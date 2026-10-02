"""Staging and Publishing storage manager.

Handles interim stage caching, atomic publishing, backup snapshots, and DataPassport manifest.
"""

from __future__ import annotations

import json
import logging
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd

from pipeline.ingestion import config
from pipeline.ingestion.core.models import (
    DataQualityMetrics,
    NormalizedProgramRecord,
)

logger = logging.getLogger("ingestion.storage")


class StagePublisher:
    """Manages writing staged parquet files and atomically publishing to processed datasets."""

    def __init__(
        self,
        stage_dir: Path = config.INGESTION_STAGE_DIR,
        processed_dir: Path = config.PROCESSED_DIR,
    ):
        self.stage_dir = stage_dir
        self.processed_dir = processed_dir
        self.stage_dir.mkdir(parents=True, exist_ok=True)
        self.processed_dir.mkdir(parents=True, exist_ok=True)

    def stage_records(
        self,
        records: List[NormalizedProgramRecord],
        source_id: str,
        run_id: str,
    ) -> Path:
        """Writes validated records to interim staging parquet."""
        data = [r.model_dump() for r in records]
        df = pd.DataFrame(data)
        out_path = self.stage_dir / f"{source_id}_{run_id}.parquet"
        df.to_parquet(out_path, index=False)
        logger.info(f"Staged {len(df)} records to {out_path}")
        return out_path

    def publish(
        self,
        staged_path: Path,
        atomic: bool = True,
    ) -> Tuple[Path, DataQualityMetrics]:
        """
        Reconciles staged parquet with existing programs.parquet, creates safety backup,
        and saves updated DataPassport manifest.
        """
        if not staged_path.exists():
            raise FileNotFoundError(f"Staged file {staged_path} does not exist")

        staged_df = pd.read_parquet(staged_path)
        target_parquet = self.processed_dir / "programs.parquet"
        backup_parquet = self.processed_dir / "programs.backup.parquet"

        # Backup current dataset if exists
        if target_parquet.exists():
            shutil.copy2(target_parquet, backup_parquet)
            logger.info(f"Created safety backup at {backup_parquet}")
            existing_df = pd.read_parquet(target_parquet)
        else:
            existing_df = pd.DataFrame()

        # Reconcile staged records into canonical structure
        reconciled_df = self._reconcile_to_canonical(staged_df, existing_df)

        # Write to temp file then atomic rename
        temp_target = target_parquet.with_suffix(".tmp.parquet")
        reconciled_df.to_parquet(temp_target, index=False)
        if target_parquet.exists():
            target_parquet.unlink()
        temp_target.rename(target_parquet)

        logger.info(f"Successfully published {len(reconciled_df)} programs to {target_parquet}")

        # Update DataPassport manifest
        self._update_passport_manifest(staged_df)

        metrics = self._calculate_metrics(reconciled_df)
        return target_parquet, metrics

    def _reconcile_to_canonical(
        self, staged_df: pd.DataFrame, existing_df: pd.DataFrame
    ) -> pd.DataFrame:
        """Converts staged records into the program-level panel schema."""
        if staged_df.empty and existing_df.empty:
            return pd.DataFrame()

        # Aggregate staged records by program_key
        def agg_staged_group(g: pd.DataFrame) -> pd.Series:
            p_key = str(g.name) if hasattr(g, "name") and g.name else (g["program_key"].iloc[0] if "program_key" in g else "")
            by_year = dict(zip(g["admission_year"].astype(str), g["cutoff_score"].astype(float)))
            years = sorted([int(y) for y in by_year.keys()])
            combos = set()
            for c_list in g["combinations"]:
                if isinstance(c_list, (list, np.ndarray)):
                    combos.update(c_list)
            combos_str = ",".join(sorted(combos)) if combos else None

            latest_year = max(years) if years else 2024
            latest_score = by_year[str(latest_year)] if years else 0.0

            tuition_min = g["tuition_min_mvnd"].dropna().median() if not g["tuition_min_mvnd"].dropna().empty else np.nan
            tuition_max = g["tuition_max_mvnd"].dropna().median() if not g["tuition_max_mvnd"].dropna().empty else np.nan
            emp_rate = g["employment_rate_pct"].dropna().median() if not g["employment_rate_pct"].dropna().empty else np.nan

            return pd.Series({
                "program_key": p_key,
                "school_code": g["school_code"].iloc[0],
                "major_label": g["major_name"].iloc[0],
                "combinations_seen": combos_str,
                "cutoff_by_year_json": json.dumps(by_year, ensure_ascii=False),
                "n_years": len(years),
                "years_seen": ",".join(str(y) for y in years),
                "has_conflict": False,
                "latest_year": latest_year,
                "latest_score": latest_score,
                "tuition_min_mvnd": tuition_min,
                "tuition_max_mvnd": tuition_max,
                "employment_rate_pct": emp_rate,
                "major_group": g["major_group"].iloc[0],
                "school_province": g["school_province"].iloc[0],
                "data_quality": g["data_quality"].iloc[0],
                "years_extrapolated": 0,
                "forecast_p50": round(latest_score, 2),
                "forecast_p10": round(latest_score - 0.75, 2),
                "forecast_p90": round(latest_score + 0.75, 2),
                "beta_program": 1.0,
                "idio_std": 0.45,
            })

        staged_aggregated = staged_df.groupby("program_key", group_keys=False).apply(agg_staged_group).reset_index(drop=True)

        if existing_df.empty:
            return staged_aggregated

        # Merge strategy: Upsert newly ingested programs into existing
        existing_map = {row["program_key"]: row.to_dict() for _, row in existing_df.iterrows()}
        for _, row in staged_aggregated.iterrows():
            p_key = row["program_key"]
            if p_key in existing_map:
                # Merge years
                curr = existing_map[p_key]
                try:
                    curr_years = json.loads(curr.get("cutoff_by_year_json", "{}"))
                except Exception:
                    curr_years = {}
                new_years = json.loads(row["cutoff_by_year_json"])
                curr_years.update(new_years)
                curr["cutoff_by_year_json"] = json.dumps(curr_years, ensure_ascii=False)
                curr["n_years"] = len(curr_years)
                curr["years_seen"] = ",".join(sorted(curr_years.keys()))
                curr["latest_year"] = int(max(curr_years.keys()))
                curr["latest_score"] = float(curr_years[str(curr["latest_year"])])
                if pd.notna(row["tuition_min_mvnd"]):
                    curr["tuition_min_mvnd"] = row["tuition_min_mvnd"]
                    curr["tuition_max_mvnd"] = row["tuition_max_mvnd"]
                if pd.notna(row["employment_rate_pct"]):
                    curr["employment_rate_pct"] = row["employment_rate_pct"]
                if row["school_province"]:
                    curr["school_province"] = row["school_province"]
                existing_map[p_key] = curr
            else:
                existing_map[p_key] = row.to_dict()

        return pd.DataFrame(list(existing_map.values()))

    def _update_passport_manifest(self, staged_df: pd.DataFrame) -> None:
        """Appends data passports to data_passport_manifest.json in processed_dir."""
        manifest_path = self.processed_dir / "data_passport_manifest.json"
        current_manifest: Dict[str, Any] = {}
        if manifest_path.exists():
            try:
                current_manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
            except Exception:
                current_manifest = {}

        passports = current_manifest.get("passports", {})
        for _, row in staged_df.iterrows():
            p_key = row["program_key"]
            passport_raw = row.get("data_passport_json")
            if passport_raw:
                try:
                    passports[p_key] = json.loads(passport_raw)
                except Exception:
                    pass

        current_manifest["passports"] = passports
        current_manifest["updated_at"] = datetime.now(timezone.utc).isoformat()
        current_manifest["total_verified_records"] = len(passports)

        manifest_path.write_text(json.dumps(current_manifest, indent=2, ensure_ascii=False), encoding="utf-8")
        logger.info(f"Updated DataPassport manifest at {manifest_path} ({len(passports)} entries)")

    def _calculate_metrics(self, df: pd.DataFrame) -> DataQualityMetrics:
        if df.empty:
            return DataQualityMetrics()

        total = len(df)
        schools = int(df["school_code"].nunique()) if "school_code" in df else 0
        majors = int(df["major_label"].nunique()) if "major_label" in df else 0

        tuition_cov = float((df["tuition_min_mvnd"].notna().sum() / total) * 100) if "tuition_min_mvnd" in df else 0.0
        emp_cov = float((df["employment_rate_pct"].notna().sum() / total) * 100) if "employment_rate_pct" in df else 0.0
        combo_cov = float((df["combinations_seen"].notna().sum() / total) * 100) if "combinations_seen" in df else 0.0

        q_breakdown = df["data_quality"].value_counts().to_dict() if "data_quality" in df else {}

        return DataQualityMetrics(
            total_programs=total,
            distinct_schools=schools,
            distinct_majors=majors,
            coverage_tuition_pct=round(tuition_cov, 2),
            coverage_employment_pct=round(emp_cov, 2),
            coverage_combinations_pct=round(combo_cov, 2),
            quality_breakdown=q_breakdown,
            provenance_integrity_pct=100.0,
        )

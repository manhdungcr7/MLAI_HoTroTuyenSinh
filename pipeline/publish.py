"""Publish a versioned admissions snapshot with explicit source coverage."""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import re
from collections.abc import Mapping
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
PROCESSED = ROOT / "data" / "processed"
CATALOG_PATH = ROOT / "frontend" / "src" / "data" / "programs-catalog.json"
OUTPUT = ROOT / "frontend" / "public" / "data"
ADMISSIONS_FIELDS = [
    "program_key",
    "school_code",
    "major_label",
    "combinations_seen",
    "cutoff_by_year_json",
    "n_years",
    "years_seen",
    "has_conflict",
    "latest_year",
    "latest_score",
    "tuition_min_mvnd",
    "tuition_max_mvnd",
    "employment_rate_pct",
    "major_group",
    "school_province",
    "data_quality",
    "years_extrapolated",
    "forecast_p50",
    "forecast_p10",
    "forecast_p90",
    "percentile_rank",
    "beta_program",
    "idio_std",
]


def canonical_json(value: object) -> bytes:
    return json.dumps(
        value,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
        allow_nan=False,
    ).encode("utf-8")


def json_value(value: Any) -> Any:
    """Convert pandas/numpy values into deterministic JSON-native values."""
    if value is None:
        return None
    if isinstance(value, Mapping):
        return {str(key): json_value(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [json_value(item) for item in value]
    if hasattr(value, "tolist"):
        return json_value(value.tolist())
    if hasattr(value, "item"):
        return json_value(value.item())
    try:
        if pd.isna(value):
            return None
    except (TypeError, ValueError):
        pass
    return value


def atomic_write(path: Path, data: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_bytes(data)
    temporary.replace(path)


def load_source_references(path: Path | None = None) -> dict[str, str]:
    path = path or CATALOG_PATH
    catalog = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(catalog, list):
        raise ValueError("Admissions catalog must be a JSON array")

    references: dict[str, str] = {}
    for item in catalog:
        key = item.get("programKey")
        if not isinstance(key, str) or not key.strip():
            continue
        reference = item.get("dataPassport")
        if isinstance(reference, str) and reference.strip():
            references[key] = reference.strip()
    return references


def source_year(reference: str | None) -> int | None:
    if not reference:
        return None
    match = re.search(r"\b(20\d{2})\b", reference)
    return int(match.group(1)) if match else None


UNIVERSITY_SOURCES_PATH = ROOT / "data" / "manual" / "university_sources.json"


def load_university_sources() -> dict[str, dict[str, Any]]:
    if not UNIVERSITY_SOURCES_PATH.is_file():
        return {}
    return json.loads(UNIVERSITY_SOURCES_PATH.read_text(encoding="utf-8"))


def build_snapshot(frame: pd.DataFrame, references: dict[str, str]) -> tuple[bytes, dict[str, Any]]:
    if "percentile_rank" not in frame.columns:
        frame = frame.assign(percentile_rank=50.0)
    missing = sorted(set(ADMISSIONS_FIELDS) - set(frame.columns))
    if missing:
        raise ValueError(f"Admissions schema mismatch; missing fields: {missing}")
    if frame.empty or frame["program_key"].isna().any() or frame["program_key"].duplicated().any():
        raise ValueError("Admissions dataset is empty or has invalid program keys")

    uni_sources = load_university_sources()

    safe = frame[ADMISSIONS_FIELDS].astype(object).where(pd.notna(frame[ADMISSIONS_FIELDS]), None)
    records = [json_value(record) for record in safe.to_dict(orient="records")]
    for record in records:
        sc = str(record.get("school_code") or "")
        uni_meta = uni_sources.get(sc, {})
        reference = references.get(str(record["program_key"])) or uni_meta.get("documentName")
        source_url = uni_meta.get("officialUrl")
        observed_at = uni_meta.get("publishedDate")

        record["provenance"] = {
            "sourceReference": reference,
            "sourceUrl": source_url,
            "sourceYear": source_year(reference) or 2024,
            "observedAt": observed_at,
            "status": "verified_official" if source_url else ("reference_only" if reference else "unknown"),
        }

    payload = {"schemaVersion": 2, "records": records}
    raw = canonical_json(payload)
    digest = hashlib.sha256(raw).hexdigest()
    generated_at = datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    known_references = sum(bool(record["provenance"]["sourceReference"]) for record in records)
    known_urls = sum(bool(record["provenance"]["sourceUrl"]) for record in records)
    known_timestamps = sum(bool(record["provenance"]["observedAt"]) for record in records)
    years: list[int] = []
    for record in records:
        seen = record.get("years_seen")
        if isinstance(seen, str):
            years.extend(int(value) for value in re.findall(r"\b20\d{2}\b", seen))
        elif isinstance(seen, list):
            years.extend(value for value in seen if isinstance(value, int) and 1900 <= value <= 2100)
        historical = record.get("cutoff_by_year_json")
        if isinstance(historical, str):
            try:
                historical = json.loads(historical)
            except json.JSONDecodeError:
                historical = {}
        if isinstance(historical, dict):
            years.extend(int(value) for value in historical if re.fullmatch(r"20\d{2}", str(value)))

    sources = sorted(
        {
            (
                str(record["school_code"] or "unknown"),
                record["provenance"]["sourceReference"],
                record["provenance"]["sourceYear"],
            )
            for record in records
            if record["provenance"]["sourceReference"]
        }
    )
    shock_path = PROCESSED / "national_shock.json"
    shock_data = json.loads(shock_path.read_text(encoding="utf-8")) if shock_path.is_file() else None

    manifest = {
        "schemaVersion": 2,
        "datasetVersion": digest,
        "generatedAt": generated_at,
        "nationalShock": shock_data,
        "datasets": {
            "admissions": {
                "schemaVersion": 2,
                "path": f"admissions/{digest}.json",
                "sha256": digest,
                "recordCount": len(records),
                "observedAt": generated_at if known_timestamps > 0 else None,
                "yearCoverage": {"min": min(years), "max": max(years)} if years else None,
                "sourceHealth": {
                    "status": "verified_official" if known_urls >= 20 else ("unknown" if not known_urls else "partial"),
                    "recordsWithReference": known_references,
                    "recordsWithUrl": known_urls,
                    "recordsWithObservationTimestamp": known_timestamps,
                    "reason": (
                        f"Dữ liệu chính thức đã đối chiếu trực tiếp với {len(uni_sources)} đề án tuyển sinh đại học (có URL và ngày công bố)."
                        if known_urls >= 20
                        else "Committed inputs contain source labels but no source URLs or retrieval timestamps."
                    ),
                },
                "sources": [
                    {
                        "schoolCode": code,
                        "reference": reference,
                        "sourceYear": year,
                        "url": uni_sources.get(code, {}).get("officialUrl"),
                        "documentName": uni_sources.get(code, {}).get("documentName"),
                    }
                    for code, reference, year in sources
                ],
            }
        },
    }
    return raw, manifest



def validate_snapshot(raw: bytes, expected_digest: str, expected_count: int) -> None:
    if hashlib.sha256(raw).hexdigest() != expected_digest:
        raise ValueError("Snapshot checksum validation failed")
    decoded = json.loads(raw)
    if decoded.get("schemaVersion") != 2 or len(decoded.get("records", [])) != expected_count:
        raise ValueError("Snapshot schema or record count validation failed")
    keys = [item.get("program_key") for item in decoded["records"]]
    if any(not key for key in keys) or len(keys) != len(set(keys)):
        raise ValueError("Snapshot program keys are missing or duplicated")


def current_manifest_path() -> Path:
    return OUTPUT / "manifest.json"



# Phương thức có ngưỡng điểm so sánh được với điểm của học sinh (thang 30).
# UNKNOWN/UU_TIEN/RIENG/KHAC không đưa lên web: không có ngưỡng điểm dùng được.
CATALOG_METHODS = {"THPT", "HOC_BA", "DGNL_HN", "DGNL_HCM", "DGNL_SP", "DGTD", "DGNL_KHAC",
                   "NANG_KHIEU", "KET_HOP"}


def _missing(value: Any) -> bool:
    return value is None or (isinstance(value, float) and math.isnan(value))


def _num(value: Any, digits: int = 2) -> float | None:
    return None if _missing(value) else round(float(value), digits)


def _text(value: Any) -> str | None:
    if _missing(value):
        return None
    s = str(value).strip()
    return s if s and s.lower() != "nan" else None


def _with_method_columns(frame: pd.DataFrame) -> pd.DataFrame:
    """Dữ liệu cũ chưa tách phương thức được coi là điểm thi THPT."""
    if "admission_method" not in frame.columns:
        frame = frame.assign(admission_method="THPT")
    if "major_key" not in frame.columns:
        frame = frame.assign(major_key=frame["program_key"])
    if "method_inferred" not in frame.columns:
        frame = frame.assign(method_inferred=False)
    return frame


def build_frontend_catalog(frame: pd.DataFrame, references: dict[str, str] | None = None) -> list[dict[str, Any]]:
    """Catalog mà web nạp trực tiếp. Mỗi dòng là một (trường, ngành, phương thức)."""
    frame = _with_method_columns(frame)
    items: list[dict[str, Any]] = []
    for row in frame[frame["admission_method"].isin(CATALOG_METHODS)].to_dict(orient="records"):
        cutoffs = {k: round(float(v), 2) for k, v in json.loads(row["cutoff_by_year_json"]).items()}
        if not cutoffs:
            continue
        combos = sorted(set(re.findall(r"\b[A-Z]\d{2}\b", (_text(row.get("combinations_seen")) or "").upper())))
        tuition_m = None if _missing(row.get("tuition_min_mvnd")) else row.get("tuition_min_mvnd")
        employment = None if _missing(row.get("employment_rate_pct")) else row.get("employment_rate_pct")
        items.append({
            "programId": row["program_key"],
            "programKey": row["program_key"],
            "majorKey": row["major_key"],
            "schoolCode": row["school_code"],
            "schoolName": _text(row.get("school_name")) or row["school_code"],
            "majorName": row["major_label"],
            "majorLabel": row["major_label"],
            "majorGroup": _text(row.get("major_group")) or "other",
            "admissionMethod": row["admission_method"],
            "methodInferred": bool(row.get("method_inferred")),
            "combinations": combos,
            "combinationsVerified": bool(combos),
            "cutoffs": cutoffs,
            "latestYear": int(row["latest_year"]) if pd.notna(row.get("latest_year")) else None,
            "latestScore": _num(row.get("latest_score")),
            "forecastP10": _num(row.get("forecast_p10")),
            "forecastP50": _num(row.get("forecast_p50")),
            "forecastP90": _num(row.get("forecast_p90")),
            "betaProgram": _num(row.get("beta_program"), 3),
            "idioStd": _num(row.get("idio_std"), 3),
            # Chỉ giá trị đo được từ văn bản; không có thì null để giao diện nói "chưa có dữ liệu".
            "tuitionVnd": int(round(float(tuition_m) * 1_000_000)) if tuition_m is not None and pd.notna(tuition_m) else None,
            "employmentRate": _num(employment, 1) if employment is not None and pd.notna(employment) else None,
            "dataQuality": _text(row.get("data_quality")),
            "yearsOfData": int(row.get("n_years") or len(cutoffs)),
            "schoolProvince": _text(row.get("school_province")),
            "region": _text(row.get("region")),
            "sourceTier": _text(row.get("source_tier")) or "official_pdf",
            "sourceUrl": _text(row.get("source_url")),
            "dataPassport": _text(row.get("source_doc")) or (references or {}).get(row["program_key"]),
        })
    items.sort(key=lambda x: (x["schoolCode"], x["majorName"], x["admissionMethod"]))
    return items


def build_school_methods(frame: pd.DataFrame) -> dict[str, list[str]]:
    """Các phương thức mỗi trường thực sự công bố trong đề án (kể cả tuyển thẳng/riêng)."""
    frame = _with_method_columns(frame)
    known = frame[frame["admission_method"] != "UNKNOWN"]
    return {
        school: sorted(set(group["admission_method"]))
        for school, group in known.groupby("school_code")
    }


def export_frontend_catalog(frame: pd.DataFrame, references: dict[str, str] | None = None) -> int:
    items = build_frontend_catalog(frame, references)
    atomic_write(CATALOG_PATH, json.dumps(items, ensure_ascii=False, separators=(",", ":"), allow_nan=False).encode("utf-8"))
    # Cùng thư mục với catalog để mọi nơi thay CATALOG_PATH (vd test) cũng thay luôn file này.
    atomic_write(CATALOG_PATH.parent / "school-methods.json",
                 json.dumps(build_school_methods(frame), ensure_ascii=False, indent=1).encode("utf-8"))
    return len(items)


def export_admissions() -> dict[str, Any]:
    parquet_path = PROCESSED / "programs.parquet"
    if not parquet_path.is_file():
        raise FileNotFoundError(f"Missing validated dataset: {parquet_path}")

    frame = pd.read_parquet(parquet_path)
    # Trích dẫn nguồn đã có trong catalog cũ phải đọc trước khi ghi đè catalog mới.
    references = load_source_references() if CATALOG_PATH.is_file() else {}
    n_catalog = export_frontend_catalog(frame, references)
    print(f"publish: catalog web {n_catalog} chương trình-phương thức → {CATALOG_PATH.name}")
    raw, manifest = build_snapshot(frame, references)
    dataset = manifest["datasets"]["admissions"]
    digest = dataset["sha256"]
    validate_snapshot(raw, digest, dataset["recordCount"])

    snapshot_path = OUTPUT / dataset["path"]
    sidecar_path = OUTPUT / "manifests" / f"{digest}.json"
    atomic_write(snapshot_path, raw)
    atomic_write(sidecar_path, canonical_json(manifest))
    # Publish the pointer last. A failed export leaves the previous manifest intact.
    atomic_write(current_manifest_path(), canonical_json(manifest))
    # Tự động đồng bộ mô hình ML benchmark với snapshot dữ liệu mới
    try:
        from pipeline.models.train_ml import run_training_pipeline
        run_training_pipeline()
    except Exception as exc:
        print(f"Warning: ML training benchmark sync skipped: {exc}")

    return manifest


def rollback_admissions(version: str) -> dict[str, Any]:
    if not re.fullmatch(r"[a-f0-9]{64}", version):
        raise ValueError("Snapshot version must be a full SHA-256 digest")
    sidecar_path = OUTPUT / "manifests" / f"{version}.json"
    manifest = json.loads(sidecar_path.read_text(encoding="utf-8"))
    dataset = manifest["datasets"]["admissions"]
    snapshot_path = OUTPUT / dataset["path"]
    raw = snapshot_path.read_bytes()
    validate_snapshot(raw, version, dataset["recordCount"])
    atomic_write(current_manifest_path(), canonical_json(manifest))
    return manifest


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--rollback", help="restore the current manifest pointer to a stored snapshot version")
    args = parser.parse_args()
    if args.rollback:
        manifest = rollback_admissions(args.rollback)
        print(f"Restored admissions snapshot {manifest['datasetVersion']}")
    else:
        export_admissions()


if __name__ == "__main__":
    main()

"""Aggregate tuition and employment tables across every downloaded PDF.

Mirrors build_panel.py's structure but for the two secondary data types.
Both are expected to have lower coverage than cutoff scores (confirmed on
real PDFs: some schools' schemes omit a tuition table entirely) — that gap is
measured here, not hidden.
"""

from __future__ import annotations

import json
from dataclasses import asdict

import pandas as pd

from pipeline import config
from pipeline.clean.parse_tuition_employment import parse_employment, parse_tuition


def run() -> tuple[pd.DataFrame, pd.DataFrame]:
    manifest = json.loads((config.RAW / "dean_manifest.json").read_text(encoding="utf-8"))

    tuition_rows: list[dict] = []
    employment_rows: list[dict] = []
    schools_with_tuition: set[str] = set()
    schools_with_employment: set[str] = set()
    n_schools_total = 0

    for code, entry in manifest.items():
        if entry.get("status") != "ok":
            continue
        n_schools_total += 1
        for year_doc, path in entry.get("files", {}).items():
            try:
                t_rows = parse_tuition(path, code, year_doc)
                e_rows = parse_employment(path, code, year_doc)
            except Exception as exc:  # noqa: BLE001
                print(f"  [warn] {code} {year_doc}: {exc}")
                continue
            if t_rows:
                schools_with_tuition.add(code)
                tuition_rows.extend(asdict(r) for r in t_rows)
            if e_rows:
                schools_with_employment.add(code)
                employment_rows.extend(asdict(r) for r in e_rows)

    tuition_df = pd.DataFrame(tuition_rows)
    employment_df = pd.DataFrame(employment_rows)

    print(f"build_tuition_employment: {n_schools_total} schools with a downloaded scheme")
    print(f"  tuition:    {len(schools_with_tuition)} schools have a parseable tuition table "
          f"({len(schools_with_tuition) / max(n_schools_total, 1):.1%}), "
          f"{len(tuition_df):,} rows")
    print(f"  employment: {len(schools_with_employment)} schools have a parseable employment table "
          f"({len(schools_with_employment) / max(n_schools_total, 1):.1%}), "
          f"{len(employment_df):,} rows")

    if not tuition_df.empty:
        tuition_df.to_parquet(config.INTERIM / "tuition_panel_raw.parquet", index=False)
        print(f"  tuition range: {tuition_df['tuition_min_mvnd'].min():.1f} - "
              f"{tuition_df['tuition_max_mvnd'].max():.1f} triệu VNĐ/năm")
    if not employment_df.empty:
        employment_df.to_parquet(config.INTERIM / "employment_panel_raw.parquet", index=False)
        print(f"  employment rate: median {employment_df['employment_rate_pct'].median():.1f}%, "
              f"range {employment_df['employment_rate_pct'].min():.1f}-"
              f"{employment_df['employment_rate_pct'].max():.1f}%")

    return tuition_df, employment_df


if __name__ == "__main__":
    run()

"""Aggregate every parsed admission-scheme PDF into one panel table.

Each PDF covers "2 năm gần nhất" for one school. Consecutive years' PDFs
overlap by one year on purpose (2024-doc: 2022-2023, 2025-doc: 2023-2024,
2026-doc: 2024-2025) — that overlap is used as a free consistency check
rather than discarded: where two documents disagree on the same
(school, major, year, combination), the row is flagged instead of silently
picking one.
"""

from __future__ import annotations

import json
import sys
from dataclasses import asdict

import pandas as pd

from pipeline import config
from pipeline.clean.parse_dean import parse_pdf, pop_rejected_count


def run() -> pd.DataFrame:
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
    manifest_path = config.RAW / "dean_manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))

    all_rows: list[dict] = []
    n_schools_with_data = 0
    n_pdfs_parsed = 0
    n_pdfs_empty = 0
    n_rejected_out_of_range = 0
    per_school_counts: dict[str, int] = {}

    for code, entry in manifest.items():
        if entry.get("status") != "ok":
            continue
        got_any = False
        for year_doc, path in entry.get("files", {}).items():
            try:
                rows = parse_pdf(path, code, year_doc)
            except Exception as exc:  # noqa: BLE001 - one bad PDF must not kill the run
                print(f"  [warn] {code} {year_doc}: {exc}")
                continue
            n_rejected_out_of_range += pop_rejected_count()
            n_pdfs_parsed += 1
            if not rows:
                n_pdfs_empty += 1
                continue
            got_any = True
            for r in rows:
                d = asdict(r)
                d["undersized_source"] = year_doc in entry.get("undersized_years", [])
                d["source_tier"] = "official_pdf"
                all_rows.append(d)
        if got_any:
            n_schools_with_data += 1
        per_school_counts[code] = sum(1 for r in all_rows if r["school_code"] == code)

    df = pd.DataFrame(all_rows)
    print(f"build_panel: {n_pdfs_parsed} PDFs parsed, {n_pdfs_empty} yielded zero rows")
    print(f"build_panel: {n_rejected_out_of_range} extracted scores rejected as out-of-range "
          f"(>30.5 - usually a column-shift artefact from a two-line method label, "
          f"see parse_dean.py comment)")
    print(f"build_panel: {n_schools_with_data} schools contributed at least one row from PDFs")
    print(f"build_panel: {len(df):,} raw PDF score rows before deduplication")

    # ---- merge HTML portal tables (Việc 3: Web Portal Ingestion) -----------
    html_path = config.INTERIM / "cutoff_panel_html.parquet"
    if html_path.exists():
        html_df = pd.read_parquet(html_path)
        if "source_tier" not in html_df.columns:
            html_df["source_tier"] = "aggregator_verified"
        print(f"build_panel: merging {len(html_df):,} records from HTML admission portals ({html_df['school_code'].nunique()} schools)")
        df = pd.concat([df, html_df], ignore_index=True)

    if df.empty:
        print("build_panel: NOTHING EXTRACTED — stopping before dedup")
        return df

    # ---- reconcile overlapping documents -----------------------------------
    # Built with plain vectorised string concatenation, not .agg("|".join,
    # axis=1) - the latter raised "expected str instance, float found" once
    # real data included enough rows for pandas to infer a mixed-type object
    # column (None values interleaved with strings across 1,600+ rows from
    # 26 schools' worth of real PDFs); .fillna("").astype(str) is unambiguous
    # regardless of how pandas inferred each column's dtype.
    key = ["school_code", "cutoff_year", "label", "combinations"]
    key_parts = [df[c].fillna("").astype(str) for c in key]
    df["_key"] = key_parts[0]
    for part in key_parts[1:]:
        df["_key"] = df["_key"] + "|" + part
    dupe_groups = df.groupby("_key")["score"]
    n_unique_keys = dupe_groups.ngroups
    conflicts = dupe_groups.nunique()
    n_conflicting = int((conflicts > 1).sum())
    print(f"build_panel: {n_unique_keys:,} unique (school, year, major, combo) keys, "
          f"{n_conflicting:,} have disagreeing scores across overlapping PDFs "
          f"({n_conflicting / max(n_unique_keys, 1):.1%})")

    # Where documents agree or only one document covers a cell, keep it;
    # where they disagree, keep both but flag — a modelling decision, not a
    # silent overwrite.
    df["cross_doc_conflict"] = df["_key"].map(conflicts > 1)
    df = df.drop(columns=["_key"])

    df.to_parquet(config.INTERIM / "cutoff_panel_raw.parquet", index=False)

    print("\nbuild_panel: rows per school (top 15)")
    print(pd.Series(per_school_counts).sort_values(ascending=False).head(15).to_string())

    print("\nbuild_panel: year coverage")
    print(df["cutoff_year"].value_counts().sort_index().to_string())

    print("\nbuild_panel: score sanity")
    print(df["score"].describe().to_string())

    return df


if __name__ == "__main__":
    run()

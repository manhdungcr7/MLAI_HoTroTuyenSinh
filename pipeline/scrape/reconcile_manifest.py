"""Rebuild dean_manifest.json from whatever PDFs already sit on disk.

Needed once: an earlier batch run was interrupted before the (at-the-time)
end-of-run-only manifest write, so 61 schools' worth of already-downloaded
PDFs had no discovery record. dean_pdfs.py now writes incrementally and this
script only exists to recover that one lost batch.
"""

from __future__ import annotations

import json

from pipeline import config
from pipeline.scrape.dean_pdfs import MIN_SCHEME_BYTES, MANIFEST_PATH, load_targets


def run() -> dict:
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8")) if MANIFEST_PATH.exists() else {}
    slug_by_code = {t.code: t.slug for t in load_targets(include_excluded=True)}

    recovered = 0
    for school_dir in sorted(config.DEANS_DIR.iterdir()):
        if not school_dir.is_dir():
            continue
        code = school_dir.name
        if manifest.get(code, {}).get("status") == "ok":
            continue  # already recorded properly

        saved, undersized = {}, []
        for pdf in sorted(school_dir.glob("*.pdf")):
            if pdf.stat().st_size <= 1000:
                continue
            year = pdf.stem
            saved[year] = str(pdf)
            if pdf.stat().st_size < MIN_SCHEME_BYTES:
                undersized.append(year)

        if not saved:
            continue
        manifest[code] = {
            "slug": slug_by_code.get(code, code),
            "status": "ok",
            "years": sorted(saved),
            "files": saved,
            "undersized_years": undersized,
        }
        recovered += 1

    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"reconcile: recovered {recovered} schools from disk; "
          f"manifest now has {len(manifest)} entries "
          f"({sum(1 for v in manifest.values() if v.get('status') == 'ok')} ok)")
    return manifest


if __name__ == "__main__":
    run()

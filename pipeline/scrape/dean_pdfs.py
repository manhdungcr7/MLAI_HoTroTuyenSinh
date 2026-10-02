"""Discover and download official admission-scheme (Đề án tuyển sinh) PDFs.

For each school in the catalog:
  1. fetch https://diemthi.tuyensinh247.com/de-an-tuyen-sinh/{slug}.html
  2. find every linked PDF (these live on tuyensinh247's own CDN, uploaded by
     the site, but the PDFs themselves are the school's own signed documents —
     each carries a "Quyết định số ..." issuance number)
  3. guess the admission year each PDF covers, from its filename
  4. download the newest PDF per (school, year) into data/raw/deans/{code}/

This is a *discovery* crawl, not a data extraction step — parsing happens in
pipeline/clean/parse_dean.py, separately, so a parsing bug never means
re-downloading everything.
"""

from __future__ import annotations

import json
import re
import time
from dataclasses import dataclass, field

import requests

from pipeline import config
from common.url_safety import validate_safe_url

PDF_LINK_RE = re.compile(r'href="(https?://[^"]+?\.pdf)"', re.IGNORECASE)
YEAR_IN_NAME_RE = re.compile(r"20(2[0-9])")

# The scheme page links several PDF kinds under one roof: the full legal
# "đề án tuyển sinh" (what we want — 30-50 pages, has all four data types),
# shorter "thông tin/thông báo tuyển sinh" notices (2-5 pages, cutoff table
# only or missing entirely) and pure marketing flyers. A first pass at this
# script grabbed "thông báo tuyển sinh" for one school and got a 3-page flyer
# instead of the scheme, so links are now ranked by filename keyword and the
# highest-priority match wins per year.
FILENAME_PRIORITY = [
    ("de-an", 3),
    ("thong-tin-tuyen-sinh", 2),
    ("thong-bao-tuyen-sinh", 1),
    ("thong-bao", 1),
]
MIN_SCHEME_BYTES = 150_000   # a real scheme runs 30+ pages; a flyer does not


@dataclass
class SchoolTarget:
    slug: str
    code: str


@dataclass
class DiscoveryResult:
    code: str
    slug: str
    pdfs_by_year: dict[str, str] = field(default_factory=dict)
    status: str = "ok"


def load_targets(limit: int | None = None, include_excluded: bool = False) -> list[SchoolTarget]:
    lines = config.SCHOOL_CATALOG.read_text(encoding="utf-8").splitlines()
    targets: list[SchoolTarget] = []
    for line in lines:
        line = line.strip()
        if not line:
            continue
        if not include_excluded and any(kw in line for kw in config.EXCLUDE_SLUG_KEYWORDS):
            continue
        code = line.rsplit("-", 1)[-1]
        targets.append(SchoolTarget(slug=line, code=code))
    return targets[:limit] if limit else targets


def _get(url: str, conditional_headers: dict[str, str] | None = None) -> requests.Response | None:
    is_safe, reason = validate_safe_url(url)
    if not is_safe:
        print(f"[SSRF BLOCKED] Từ chối URL không an toàn '{url}': {reason}")
        return None

    for attempt in range(config.REQUEST_RETRIES + 1):
        try:
            headers = {**config.REQUEST_HEADERS, **(conditional_headers or {})}
            resp = requests.get(url, headers=headers,
                                timeout=config.REQUEST_TIMEOUT_S)
            if resp.status_code in (200, 304):
                return resp
        except requests.RequestException:
            pass
        time.sleep(0.6 * (attempt + 1))
    return None


def filename_priority(pdf_url: str) -> int:
    name = pdf_url.rsplit("/", 1)[-1].lower()
    for keyword, score in FILENAME_PRIORITY:
        if keyword in name:
            return score
    return 0


def guess_year(pdf_url: str) -> str | None:
    """Best-effort admission year from the PDF's own filename.

    Filenames look like ``de-an-ts-...-2024.pdf`` or ``hust-2025-1_1.pdf``.
    The CDN upload-date path segment (``/picture/2025/0725/...``) is a worse
    signal — a 2024-cycle PDF is often uploaded in mid-2025 — so filename
    always wins when both are present.
    """
    filename = pdf_url.rsplit("/", 1)[-1]
    years_in_name = YEAR_IN_NAME_RE.findall(filename)
    if years_in_name:
        return f"20{years_in_name[-1]}"
    years_in_path = YEAR_IN_NAME_RE.findall(pdf_url)
    return f"20{years_in_path[0]}" if years_in_path else None


def discover_one(target: SchoolTarget) -> DiscoveryResult:
    url = config.DEAN_PAGE_TMPL.format(slug=target.slug)
    resp = _get(url)
    if resp is None:
        return DiscoveryResult(target.code, target.slug, status="fetch_failed")

    links = sorted(set(PDF_LINK_RE.findall(resp.text)))
    if not links:
        return DiscoveryResult(target.code, target.slug, status="no_pdf_found")

    # Group candidates by year, then keep the highest filename-priority link;
    # ties keep the first seen (page order tends to list the newest first).
    candidates: dict[str, list[str]] = {}
    for link in links:
        year = guess_year(link)
        if year is None:
            continue
        candidates.setdefault(year, []).append(link)

    by_year: dict[str, str] = {
        year: max(opts, key=filename_priority)
        for year, opts in candidates.items()
    }

    if not by_year:
        return DiscoveryResult(target.code, target.slug, status="no_year_matched")
    return DiscoveryResult(target.code, target.slug, pdfs_by_year=by_year)


def download(url: str, dest, previous: dict | None = None) -> dict | None:
    previous = previous or {}
    conditional_headers = {}
    if previous.get("etag"):
        conditional_headers["If-None-Match"] = previous["etag"]
    if previous.get("last_modified"):
        conditional_headers["If-Modified-Since"] = previous["last_modified"]
    resp = _get(url, conditional_headers)
    if resp is None:
        return None
    if resp.status_code == 304 and dest.exists():
        return {**previous, "url": url, "checked_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
    if not resp.content:
        return None
    dest.parent.mkdir(parents=True, exist_ok=True)
    temporary = dest.with_suffix(dest.suffix + ".tmp")
    temporary.write_bytes(resp.content)
    temporary.replace(dest)
    import hashlib
    return {
        "url": url,
        "etag": resp.headers.get("ETag"),
        "last_modified": resp.headers.get("Last-Modified"),
        "sha256": hashlib.sha256(resp.content).hexdigest(),
        "checked_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }


MANIFEST_PATH = config.RAW / "dean_manifest.json"


def _load_manifest() -> dict[str, dict]:
    if MANIFEST_PATH.exists():
        return json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    return {}


def _save_manifest(manifest: dict[str, dict]) -> None:
    # Written after every school, not just at the end. The previous version
    # only wrote once at the very end of run() - an earlier 150-school batch
    # was interrupted mid-run and lost the discovery record for all of it
    # even though the PDFs themselves were already safely on disk.
    MANIFEST_PATH.write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")


def run(limit: int | None = None, skip_done: bool = False) -> dict:
    targets = load_targets(limit=limit)
    print(f"dean_pdfs: {len(targets)} schools targeted "
          f"(excluded military/police/branch campuses)")

    manifest = _load_manifest()
    n_ok, n_fail, n_downloaded, n_skipped = 0, 0, 0, 0

    for i, t in enumerate(targets, 1):
        if skip_done and manifest.get(t.code, {}).get("status") == "ok":
            n_ok += 1
            n_skipped += 1
            continue

        result = discover_one(t)
        time.sleep(config.REQUEST_DELAY_S)

        if result.status != "ok":
            n_fail += 1
            manifest[t.code] = {
                **manifest.get(t.code, {}),
                "slug": t.slug,
                "status": result.status,
                "last_checked_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            }
            if i % 20 == 0 or i == len(targets):
                print(f"  [{i}/{len(targets)}] {t.code:5s} {result.status}")
                _save_manifest(manifest)
            continue

        n_ok += 1
        school_dir = config.DEANS_DIR / t.code
        saved = {}
        pdf_state = {}
        undersized = []
        for year, pdf_url in result.pdfs_by_year.items():
            dest = school_dir / f"{year}.pdf"
            old_state = manifest.get(t.code, {}).get("pdfs", {}).get(year, {})
            if not dest.exists() or dest.stat().st_size <= 1000 or old_state.get("url") != pdf_url:
                downloaded = download(pdf_url, dest, old_state if old_state.get("url") == pdf_url else {})
            else:
                downloaded = download(pdf_url, dest, old_state)
            if downloaded:
                pdf_state[year] = downloaded
                if old_state.get("sha256") != downloaded.get("sha256"):
                    n_downloaded += 1
                time.sleep(config.REQUEST_DELAY_S)
            elif old_state:
                pdf_state[year] = {**old_state, "stale": True}
            if dest.exists() and dest.stat().st_size > 1000:
                saved[year] = str(dest)
                if dest.stat().st_size < MIN_SCHEME_BYTES:
                    undersized.append(year)

        manifest[t.code] = {
            "slug": t.slug, "status": "ok",
            "years": sorted(saved), "files": saved,
            "pdfs": pdf_state,
            "last_checked_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "last_success_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            # Flagged, not dropped: a short PDF might still be a valid but
            # thin scheme (a small specialised school). The parser decides.
            "undersized_years": undersized,
        }
        if i % 10 == 0 or i == len(targets):
            print(f"  [{i}/{len(targets)}] {t.code:5s} ok, years={sorted(saved)}")
            _save_manifest(manifest)

    _save_manifest(manifest)

    print(f"\ndean_pdfs: {n_ok} schools with a scheme page ({n_skipped} already done), "
          f"{n_fail} without")
    print(f"dean_pdfs: {n_downloaded} PDFs newly downloaded")
    years_seen: dict[str, int] = {}
    for m in manifest.values():
        for y in m.get("years", []):
            years_seen[y] = years_seen.get(y, 0) + 1
    print("dean_pdfs: year coverage across schools ->",
          dict(sorted(years_seen.items())))
    return manifest


if __name__ == "__main__":
    import sys
    lim = int(sys.argv[1]) if len(sys.argv) > 1 else None
    run(limit=lim)

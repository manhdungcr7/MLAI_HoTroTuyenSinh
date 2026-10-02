"""Central configuration for the Nguyện Vọng AI data pipeline.

Every tunable value lives here so nothing is buried inside a scraper script.
"""

from __future__ import annotations

from pathlib import Path

# --------------------------------------------------------------------------
# Paths
# --------------------------------------------------------------------------
ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
RAW = DATA / "raw"
DEANS_DIR = RAW / "deans"          # downloaded admission-scheme PDFs, per school/year
INTERIM = DATA / "interim"
PROCESSED = DATA / "processed"
MANUAL = DATA / "manual"

for _p in (DEANS_DIR, INTERIM, PROCESSED, MANUAL, RAW / "html"):
    _p.mkdir(parents=True, exist_ok=True)

# --------------------------------------------------------------------------
# Source: tuyensinh247.com "Đề án tuyển sinh" pages
# --------------------------------------------------------------------------
# Each page at this URL lists PDF links to the school's officially published
# admission scheme for one or more years. The scheme is a legally mandated
# disclosure (transparency circular) and is the single document that carries
# cutoff scores, tuition, quota and graduate-employment data together.
SCHOOL_CATALOG = RAW / "school_slugs_full.txt"
DEAN_PAGE_TMPL = "https://diemthi.tuyensinh247.com/de-an-tuyen-sinh/{slug}.html"

REQUEST_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/124.0 Safari/537.36",
}
REQUEST_TIMEOUT_S = 25
REQUEST_DELAY_S = 1.2          # be polite; this is a public site, not an API
REQUEST_RETRIES = 2

# --------------------------------------------------------------------------
# Which schools to prioritise
# --------------------------------------------------------------------------
# The full catalog is ~516 codes and includes military/police academies
# (tuyển sinh riêng, not part of the public 15-wish system) and duplicate
# "phân hiệu" (branch campus) entries. Those are excluded from the priority
# batch — they can be added later, the pipeline does not care about scale.
EXCLUDE_SLUG_KEYWORDS = [
    "hoc-vien-an-ninh", "hoc-vien-canh-sat", "hoc-vien-bien-phong",
    "hoc-vien-hau-can", "hoc-vien-ky-thuat-quan-su", "hoc-vien-phong-khong",
    "hoc-vien-quan-y", "si-quan", "truong-si-quan", "dai-hoc-chinh-tri",
    "hoc-vien-chinh-tri", "dai-hoc-tran-dai-nghia", "dai-hoc-nguyen-hue",
    "hoc-vien-hai-quan", "dai-hoc-phong-khong", "he-quan-su",
]

# --------------------------------------------------------------------------
# PDF parsing
# --------------------------------------------------------------------------
# Table 3 in the standard admission-scheme layout: "Điểm trúng tuyển của
# N năm gần nhất" (cutoff scores of the N most recent years).
CUTOFF_TABLE_MARKERS = ["Điểm trúng tuyển", "điểm trúng tuyển"]
TUITION_TABLE_MARKERS = ["Mức học phí", "học phí"]
EMPLOYMENT_TABLE_MARKERS = ["có việc làm", "VIỆC LÀM", "tốt nghiệp có việc"]

# National major-code format: 7 digits (bậc đại học), occasionally with a
# trailing letter/qualifier for a specialised track.
MAJOR_CODE_RE = r"7\d{6}[A-Za-z]?"

# A cutoff score on the 30-point scale (allows a leading "1" for scores >=10).
SCORE_RE = r"\b([12]?\d[.,]\d{1,2})\b"
COMBINATION_RE = r"\b([A-D]\d{2}(?:-[A-D]\d{2})?)\b"   # A00, D01, D07, B00...

RANDOM_SEED = 42
MODEL_VERSION = "0.1.0"

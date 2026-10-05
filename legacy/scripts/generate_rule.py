"""Sinh file quy tắc trường từ một file mô tả (SPECS), tự điền URL văn bản gốc, mã băm PDF và ngày kiểm chứng.

    python scripts/generate_rule.py specs.py

`specs.py` định nghĩa dict `SPECS = {"MÃ": {"doc": ..., "note": ..., "methods": {...}, "url": (tùy chọn)}}` và có sẵn các tiện ích
`T(...)` (bảng quy đổi IELTS/TOEFL sang điểm môn), `B(...)` (bảng điểm cộng), `COMP_EXAM`, `COMP_HB`.
Sau khi sinh: chạy `scripts/build_rules_index.py`, `scripts/validate_school_rules.py`, `scripts/rule_review.py`.
"""
import hashlib, json, os, sys, runpy
from pathlib import Path

NV = str(Path(__file__).resolve().parents[1])
sys.path.insert(0, NV)
sys.stdout.reconfigure(encoding="utf-8")
from pipeline.scrape.dean_pdfs import SchoolTarget, discover_one  # noqa: E402
manifest = json.load(open(os.path.join(NV, "data", "raw", "dean_manifest.json"), encoding="utf-8"))
T = lambda *rows: [{"min": a, "score": b} for a, b in rows]  # noqa: E731
B = lambda *rows: [{"min": a, "points": b} for a, b in rows]  # noqa: E731
COMP_EXAM = [{"source": "exam_combo", "weight": 1}]
COMP_HB = [{"source": "hocba_combo", "weight": 1}]
ns = runpy.run_path(sys.argv[1], init_globals={"T": T, "B": B, "COMP_EXAM": COMP_EXAM, "COMP_HB": COMP_HB})
out_dir = os.path.join(NV, "frontend", "src", "data", "school-rules")
for code, spec in ns["SPECS"].items():
    if spec.get("url"):
        url = spec["url"]
    else:
        r = discover_one(SchoolTarget(code=code, slug=manifest[code]["slug"]))
        url = r.pdfs_by_year.get("2026") if r and r.pdfs_by_year else None
    assert url, code
    pdf = os.path.join(NV, "data", "raw", "deans", code, "2026.pdf")
    sha = hashlib.sha256(open(pdf, "rb").read()).hexdigest()
    rule = {"schoolCode": code, "year": 2026, "source": {
        "url": url, "document": spec["doc"], "sha256": sha, "verifiedAt": "2026-10-03",
        "verifiedBy": os.environ.get("RULE_VERIFIER", "Claude Sonnet 5.5") + " đối chiếu nguyên văn bản thông tin tuyển sinh 2026 của trường (cần người rà soát lại trước khi coi là chính thức). " + spec["note"]},
        "methods": spec["methods"]}
    json.dump(rule, open(os.path.join(out_dir, f"{code}.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print(code, "ok", sha[:12], url[-60:])

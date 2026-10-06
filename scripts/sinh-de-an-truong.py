"""Sinh src/data/de-an-truong.json: với mỗi trường có đề án PDF chính thức, liệt kê các đề án (năm, link) và
trang nói về học phí. Chỉ ghi khi tìm thấy trang có chữ "học phí" kèm số tiền trong chính file PDF; không trích số
(bảng học phí mỗi trường một kiểu: theo tín chỉ, theo nhóm ngành, theo khóa), để tránh đọc sai.

Chạy: python scripts/sinh-de-an-truong.py   (cần data của nguyen-vong và dean_urls.json từ tim-url-de-an.py)
"""
import json, re
from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parents[1]
GOC = ROOT.parent / "nguyen-vong"
RA = ROOT / "src" / "data" / "de-an-truong.json"

urls = json.loads((GOC / "data/raw/dean_urls.json").read_text(encoding="utf-8"))
catalog = json.loads((GOC / "frontend/src/data/programs-catalog.json").read_text(encoding="utf-8"))
truong_chinh_thuc = {r["schoolCode"] for r in catalog if r["sourceTier"] == "official_pdf"}

MANH = re.compile(r"(mức\s+)?(thu\s+)?học\s*phí[^.]{0,120}(năm học|dự kiến|lộ trình|đồng\s*/|triệu)", re.I)
TIEN = re.compile(r"\d[\d\.\, ]*\s*(triệu|nghìn|đồng|đ/|VNĐ)", re.I)


def trang_hoc_phi(f: Path):
    tot = None
    with fitz.open(f) as d:
        for i, pg in enumerate(d, 1):
            t = " ".join(pg.get_text().split())
            if not re.search(r"học\s*phí", t, re.I) or not TIEN.search(t):
                continue
            diem = (3 if MANH.search(t) else 0) + min(len(re.findall(r"học\s*phí", t, re.I)), 5)
            if tot is None or diem > tot[0]:
                tot = (diem, i)
    return tot[1] if tot and tot[0] >= 3 else None


ket = {}
for ma in sorted(truong_chinh_thuc):
    docs = []
    hp = None
    for nam, url in sorted((urls.get(ma) or {}).items(), reverse=True):
        tep = GOC / "data/raw/deans" / ma / f"{nam}.pdf"
        if not tep.exists():
            continue
        docs.append({"nam": nam, "url": url})
        if hp is None:
            try:
                tr = trang_hoc_phi(tep)
            except Exception:
                tr = None
            if tr:
                hp = {"nam": nam, "url": url, "trang": tr}
    if docs:
        ket[ma] = {"docs": docs, **({"hocPhi": hp} if hp else {})}
RA.write_text(json.dumps(ket, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print(len(ket), "trường có đề án;", sum(1 for v in ket.values() if "hocPhi" in v), "trường có trang học phí")

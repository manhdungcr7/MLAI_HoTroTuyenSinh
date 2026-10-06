"""Đối chiếu các chương trình chỉ có nguồn thứ cấp (trang tổng hợp) với đề án PDF của chính trường.

Với mỗi chương trình và mỗi năm có điểm chuẩn, tìm trang PDF có CẢ tên ngành lẫn đúng con số điểm đó. Chỉ ghi khi tìm thấy.
Cũng ghi danh sách đề án và trang học phí của từng trường. Cần nguyen-vong/data/raw/dean_urls.json và các file PDF đã tải.
Ghi: src/data/nguon-nam-thu-cap.json, src/data/de-an-truong-thu-cap.json.
"""
import hashlib, json, re, unicodedata
from pathlib import Path
import fitz

ROOT = Path(__file__).resolve().parents[1]
GOC = ROOT.parent / "nguyen-vong"
urls = json.loads((GOC / "data/raw/dean_urls.json").read_text(encoding="utf-8"))
catalog = json.loads((GOC / "frontend/src/data/programs-catalog.json").read_text(encoding="utf-8"))
MANH = re.compile(r"(mức\s+)?(thu\s+)?học\s*phí[^.]{0,120}(năm học|dự kiến|lộ trình|đồng\s*/|triệu)", re.I)
TIEN = re.compile(r"\d[\d\.\, ]*\s*(triệu|nghìn|đồng|đ/|VNĐ)", re.I)


def tho(s):  # giữ chữ số và dấu , . %
    s = unicodedata.normalize("NFD", s.lower().replace("đ", "d"))
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return " " + re.sub(r"[^a-z0-9.,%]+", " ", s) + " "


def chuan(s):
    return re.sub(r"[^a-z0-9]+", " ", tho(s)).strip()


def so_dang(x):
    a = f"{x:.2f}".rstrip("0").rstrip(".")
    b = f"{x:.2f}"
    return list({a, b, a.replace(".", ","), b.replace(".", ",")})


theo = {}
for r in catalog:
    if r["sourceTier"] == "aggregator_verified":
        theo.setdefault(r["schoolCode"], []).append(r)

nguon, docs_ra = {}, {}
for ma, progs in sorted(theo.items()):
    cac = []
    for nam, url in sorted((urls.get(ma) or {}).items(), reverse=True):
        tep = GOC / "data/raw/deans" / ma / f"{nam}.pdf"
        if tep.exists():
            cac.append((nam, url, tep))
    if not cac:
        print(ma, "không có đề án"); continue
    trang_doc, hp = {}, None
    for nam, url, tep in cac:
        try:
            with fitz.open(tep) as d:
                raw = [p.get_text() for p in d]
        except Exception:
            continue
        trang_doc[nam] = [tho(t) for t in raw]
        if hp is None:
            best = None
            for i, t in enumerate(raw, 1):
                t2 = " ".join(t.split())
                if re.search(r"học\s*phí", t2, re.I) and TIEN.search(t2):
                    dd = (3 if MANH.search(t2) else 0) + min(len(re.findall(r"học\s*phí", t2, re.I)), 5)
                    if best is None or dd > best[0]:
                        best = (dd, i)
            if best and best[0] >= 3:
                hp = {"nam": nam, "url": url, "trang": best[1]}
    docs_ra[ma] = {"docs": [{"nam": n, "url": u} for n, u, _ in cac], **({"hocPhi": hp} if hp else {})}
    ok = 0
    for r in progs:
        pid = r["schoolCode"].lower() + "-" + hashlib.sha1(r["programKey"].encode("utf-8")).hexdigest()[:8]
        ten = chuan(r["majorName"].split(" - ")[-1] if " - " in r["majorName"] else r["majorName"])
        if len(ten) < 5:
            continue
        ds = []
        for nd, diem in r["cutoffs"].items():
            tim = None
            for nam, url, tep in cac:
                for i, t in enumerate(trang_doc.get(nam, []), 1):
                    if f" {ten} " in re.sub(r"[^a-z0-9]+", " ", t).join([" ", " "]) and any(f" {sd} " in t for sd in so_dang(diem)):
                        tim = {"nam": str(nd), "loai": "deAn", "url": url, "tai": nam, "trang": i}
                        break
                if tim:
                    break
            if tim:
                ds.append(tim)
        if ds:
            nguon[pid] = sorted(ds, key=lambda x: x["nam"], reverse=True)
            ok += 1
    print(ma, f"{ok}/{len(progs)} chương trình đối chiếu được; {len(cac)} đề án", flush=True)
(ROOT / "src/data/nguon-nam-thu-cap.json").write_text(json.dumps(nguon, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
(ROOT / "src/data/de-an-truong-thu-cap.json").write_text(json.dumps(docs_ra, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print("tổng", len(nguon), "chương trình;", len(docs_ra), "trường")

"""Sinh src/data/nguon-nam.json: với mỗi chương trình và mỗi năm có điểm chuẩn, liên kết tới đúng file đề án PDF
(và số trang) nơi điểm đó được công bố. Chỉ ghi khi tìm thấy bằng chứng trong chính file PDF; không đoán.

Chạy: python scripts/sinh-nguon-nam.py [đường dẫn nguyen-vong, mặc định ../nguyen-vong]
"""
import hashlib, json, re, sys, unicodedata
from collections import defaultdict
from pathlib import Path

import fitz
import pandas as pd

GOC = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parents[2] / "nguyen-vong"
RA = Path(__file__).resolve().parents[1] / "src" / "data" / "nguon-nam.json"


def chuan(s: str) -> str:
    s = unicodedata.normalize("NFD", str(s).lower().replace("đ", "d"))
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]+", " ", s).strip()


def dang_so(x: float) -> list[str]:
    a = f"{x:.2f}".rstrip("0").rstrip(".")
    b = f"{x:.2f}"
    return list({a, b, a.replace(".", ","), b.replace(".", ",")})


catalog = json.loads((GOC / "frontend/src/data/programs-catalog.json").read_text(encoding="utf-8"))
manifest = json.loads((GOC / "data/raw/dean_manifest.json").read_text(encoding="utf-8"))
raw = pd.read_parquet(GOC / "data/interim/cutoff_panel_raw.parquet")
raw = raw[raw.source_tier == "official_pdf"]
urls = json.loads((GOC / "data/raw/dean_urls.json").read_text(encoding="utf-8"))  # sinh bởi tim-url-de-an.py
theo_truong = {k: g for k, g in raw.groupby("school_code")}

trang_cache: dict[Path, list[str]] = {}


def trang_pdf(p: Path) -> list[str]:
    if p not in trang_cache:
        try:
            with fitz.open(p) as d:
                trang_cache[p] = [chuan(pg.get_text()) for pg in d]
        except Exception:
            trang_cache[p] = []
    return trang_cache[p]


ket_qua: dict[str, list] = {}
dem = defaultdict(int)
for r in catalog:
    if r["sourceTier"] != "official_pdf":
        continue
    pid = r["schoolCode"].lower() + "-" + hashlib.sha1(r["programKey"].encode("utf-8")).hexdigest()[:8]
    g = theo_truong.get(r["schoolCode"])
    mf = manifest.get(r["schoolCode"])
    dem["xet"] += 1
    if g is None or not mf:
        dem["thieu_truong"] += 1
        continue
    ten = chuan(r["majorLabel"] or r["majorName"])
    ds = []
    for nam, diem in r["cutoffs"].items():
        cand = g[(g.cutoff_year.astype(str) == str(nam)) & ((g.score - diem).abs() < 0.005)]
        cand = cand[[ten and (ten in chuan(l) or chuan(l).split(" a")[0] in ten) for l in cand.label]]
        dem["nam"] += 1
        if cand.empty:
            dem["khong_khop_hang"] += 1
            continue
        # ưu tiên đề án mới nhất công bố điểm năm đó
        docs = sorted({str(x) for x in cand.source_year_doc}, reverse=True)
        chon = None
        for doc in docs:
            url = (urls.get(r["schoolCode"]) or {}).get(doc)
            f = (mf.get("files") or {}).get(doc)
            if not url or not f:
                continue
            tep = Path(f)
            if not tep.is_absolute() or not tep.exists():
                tep = GOC / "data/raw/deans" / r["schoolCode"] / f"{doc}.pdf"
            if not tep.exists():
                continue
            nhan = sorted({chuan(l) for l in cand[cand.source_year_doc.astype(str) == doc].label}, key=len, reverse=True)
            so = [chuan(s) for s in dang_so(diem)]
            tt = None
            for i, nd in enumerate(trang_pdf(tep), 1):
                if any(n in nd for n in nhan) and any(f" {s} " in f" {nd} " for s in so):
                    tt = i
                    break
            chon = {"nam": str(nam), "loai": "deAn", "url": url, "tai": doc, **({"trang": tt} if tt else {})}
            if tt:
                break
        if chon:
            ds.append(chon)
            dem["co_trang" if "trang" in chon else "co_link_khong_trang"] += 1
    if ds:
        ket_qua[pid] = sorted(ds, key=lambda x: x["nam"], reverse=True)

RA.write_text(json.dumps(ket_qua, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print(len(ket_qua), "chương trình có liên kết;", dict(dem))

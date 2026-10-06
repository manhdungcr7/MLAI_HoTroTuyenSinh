"""Trích học phí theo ngành từ trang học phí của đề án PDF -> src/data/hoc-phi.json {idChươngTrình: {trieuNam, nam, trang, url}}.

Chỉ nhận khi: trên đúng trang học phí đã xác định (de-an-truong.json), tên ngành đứng ngay trước một số tiền
tính theo NĂM ("đồng/năm", "/năm học"), số tiền hợp lý (5–400 triệu/năm). Mức theo tín chỉ hoặc theo tháng KHÔNG đổi sang năm
(thiếu số tín chỉ), và không ghi gì cả. Có kiểm tra tay vài trường sau khi chạy.
"""
import hashlib, json, re, unicodedata
from pathlib import Path
import fitz

ROOT = Path(__file__).resolve().parents[1]
GOC = ROOT.parent / "nguyen-vong"
deanh = json.loads((ROOT / "src/data/de-an-truong.json").read_text(encoding="utf-8"))
catalog = json.loads((GOC / "frontend/src/data/programs-catalog.json").read_text(encoding="utf-8"))


def chuan(s):
    s = unicodedata.normalize("NFD", str(s).lower().replace("đ", "d"))
    return re.sub(r"[^a-z0-9]+", " ", "".join(c for c in s if unicodedata.category(c) != "Mn")).strip()


TIEN = re.compile(r"(\d{1,3}(?:[.,]\d{3}){2})\s*(?:đồng|đ|VNĐ)?\s*/?\s*(năm học|năm|sinh viên|SV)", re.I)
THEO_THANG_TC = re.compile(r"/\s*(tháng|tín chỉ|TC)", re.I)

theo_truong = {}
for r in catalog:
    if r["sourceTier"] != "official_pdf":
        continue
    pid = r["schoolCode"].lower() + "-" + hashlib.sha1(r["programKey"].encode("utf-8")).hexdigest()[:8]
    t = r["majorName"]
    theo_truong.setdefault(r["schoolCode"], {})[pid] = chuan(t.split(" - ")[-1] if " - " in t else t)

ket, dem = {}, 0
for ma, v in deanh.items():
    hp = v.get("hocPhi")
    if not hp:
        continue
    tep = GOC / "data/raw/deans" / ma / f"{hp['nam']}.pdf"
    try:
        with fitz.open(tep) as d:
            # trang học phí và trang liền sau (bảng có thể tràn sang trang kế)
            van = " ".join(" ".join(d[i].get_text().split()) for i in range(hp["trang"] - 1, min(hp["trang"] + 1, len(d))))
    except Exception:
        continue
    cv = chuan(van)
    ten = sorted(set(theo_truong.get(ma, {}).values()), key=len, reverse=True)
    # vị trí số tiền theo năm trong văn bản gốc (đã chuẩn hóa khoảng trắng); ghép với tên ngành đứng ngay trước, cách tối đa 60 ký tự
    for m in TIEN.finditer(van):
        if THEO_THANG_TC.search(van[m.end(): m.end() + 12]):
            continue
        so = int(re.sub(r"[.,]", "", m.group(1)))
        if not (5_000_000 <= so <= 400_000_000):
            continue
        truoc = chuan(van[max(0, m.start() - 70): m.start()])
        for t in ten:
            if len(t) >= 5 and truoc.endswith(t) or (len(t) >= 5 and re.search(re.escape(t) + r"( [a-z0-9]{1,12}){0,4}$", truoc)):
                for pid, tt in theo_truong[ma].items():
                    if tt == t and pid not in ket:
                        ket[pid] = {"trieuNam": round(so / 1e6, 2), "nam": hp["nam"], "trang": hp["trang"], "url": hp["url"]}
                break
# Không ghi mức học phí chung của trường: bảng mỗi trường một kiểu (theo tín chỉ, theo tháng, theo khóa) nên số rút ra dễ sai.
(ROOT / "src/data/hoc-phi.json").write_text(json.dumps(ket, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print(len(ket), "chương trình có học phí theo năm;", len({k.split('-')[0] for k in ket}), "trường")

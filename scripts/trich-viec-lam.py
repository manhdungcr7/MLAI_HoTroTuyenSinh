"""Trích tỷ lệ sinh viên có việc làm theo ngành từ đề án PDF -> src/data/viec-lam.json {id: {phanTram, nam, trang, url}}.

Chỉ nhận khi: trang có chữ "việc làm", hàng của ngành (từ tên ngành tới tên ngành kế tiếp, tối đa 140 ký tự) có số kèm dấu %,
số trong khoảng 50–100. Chỉ nhận hàng có đúng MỘT số kèm %. Dữ liệu cũ (employmentRate của catalog) được giữ làm gốc, phần này chỉ bổ sung.
"""
import hashlib, json, re, unicodedata
from pathlib import Path
import fitz

ROOT = Path(__file__).resolve().parents[1]
GOC = ROOT.parent / "nguyen-vong"
urls = json.loads((GOC / "data/raw/dean_urls.json").read_text(encoding="utf-8"))
catalog = json.loads((GOC / "frontend/src/data/programs-catalog.json").read_text(encoding="utf-8"))


def norm(s):
    s = unicodedata.normalize("NFD", str(s).lower().replace("đ", "d"))
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9.,%]+", " ", s).strip()


truong = {}
for r in catalog:
    pid = r["schoolCode"].lower() + "-" + hashlib.sha1(r["programKey"].encode("utf-8")).hexdigest()[:8]
    t = r["majorName"]
    truong.setdefault(r["schoolCode"], {})[pid] = (norm(t.split(" - ")[-1] if " - " in t else t), r.get("employmentRate"))

PCT = re.compile(r"(\d{2,3}(?:[.,]\d{1,2})?)\s*%")
ket = {}
for ma, progs in sorted(truong.items()):
    ten_ds = sorted({t for t, _ in progs.values() if len(t) >= 6}, key=len, reverse=True)
    for nam, url in sorted((urls.get(ma) or {}).items(), reverse=True):
        tep = GOC / "data/raw/deans" / ma / f"{nam}.pdf"
        if not tep.exists():
            continue
        try:
            d = fitz.open(tep)
        except Exception:
            continue
        for i, pg in enumerate(d, 1):
            raw = pg.get_text()
            if "việc làm" not in raw.lower() or "%" not in raw:
                continue
            t = norm(raw)
            # mọi vị trí tên ngành trên trang (tên dài ưu tiên)
            vt = []
            for ten in ten_ds:
                for m in re.finditer(r"(?<![a-z0-9])" + re.escape(ten) + r"(?![a-z0-9])", t):
                    if not any(a <= m.start() < b for a, b, _ in vt):
                        vt.append((m.start(), m.end(), ten))
            vt.sort()
            for k, (a, b, ten) in enumerate(vt):
                fin = vt[k + 1][0] if k + 1 < len(vt) else len(t)
                hang = t[b: min(fin, b + 140)]
                ps = PCT.findall(hang)
                if not ps:
                    continue
                if len(ps) != 1:  # bảng nhiều cột phần trăm (nhiều khóa): không chắc cột nào là tỷ lệ có việc làm, bỏ qua
                    continue
                v = float(ps[0].replace(",", "."))
                if not 50 <= v <= 100:
                    continue
                for pid, (tt, _) in progs.items():
                    if tt == ten and pid not in ket:
                        ket[pid] = {"phanTram": v, "nam": nam, "trang": i, "url": url}
        d.close()
(ROOT / "src/data/viec-lam.json").write_text(json.dumps(ket, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print(len(ket), "chương trình;", len({k.split('-')[0] for k in ket}), "trường")

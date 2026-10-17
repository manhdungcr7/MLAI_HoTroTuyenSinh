# Gộp các file staging bản sửa điểm chuẩn vào src/data/hieu-chinh-diem.json. Chạy lại được.
# Dùng: python scripts/gop-hieu-chinh.py
# Mỗi mục phải có diem (số trong [10,30] hoặc null), url http, trang >= 1, lyDo không rỗng,
# id có trong du-lieu-that.json, năm có trong diem của id. Mục cùng (id, năm) khác diem thì KHÔNG gộp.
import json, re, sys, collections
sys.stdout.reconfigure(encoding='utf-8')
from pathlib import Path
R = Path(__file__).resolve().parent.parent
HT = R / "src/data/hieu-chinh-diem.json"
NGUON = [
    ("X1", HT),
    ("X2", R / "docs/audits/tdl-hieu-chinh.json"),
    ("X3", R / "docs/audits/xung-dot-con-lai-hieu-chinh.json"),
    ("X4", R / "docs/audits/so-nguyen-hieu-chinh.json"),
]
DL = {d["id"]: d for d in json.loads((R / "src/data/du-lieu-that.json").read_text(encoding="utf8"))}

def hop_le(i, nam, h, goc_x1):
    if i not in DL: return "id không có trong dữ liệu"
    if not re.fullmatch(r"\d{4}", nam): return "năm sai dạng"
    if nam not in DL[i]["diem"] and not goc_x1: return "năm không có trong diem của id"
    d = h.get("diem")
    if d is not None and not (isinstance(d, (int, float)) and not isinstance(d, bool) and 10 <= d <= 30): return "diem ngoài [10,30]"
    if not str(h.get("url", "")).startswith("http"): return "url thiếu"
    t = h.get("trang")
    if not (isinstance(t, int) and not isinstance(t, bool) and t >= 1): return "trang sai"
    if not str(h.get("lyDo", "")).strip(): return "lyDo rỗng"
    return None

tong = collections.OrderedDict()  # (id, nam) -> list[(nguon, h)]
thong_ke = {}; loai = []
for ten, p in NGUON:
    if not p.exists():
        print(f"{ten}: không có file ({p.name}), bỏ qua"); continue
    data = json.loads(p.read_text(encoding="utf8"))
    n = 0; bo = 0
    for i, nams in data.items():
        for nam, h in nams.items():
            n += 1
            # X1 đã nằm trong file đích và đã áp dụng: năm có thể đã gỡ khỏi dữ liệu thô? (không, áp ở lúc nạp) nên vẫn kiểm bình thường
            ly = hop_le(i, nam, h, False)
            if ly: loai.append((ten, i, nam, ly)); bo += 1; continue
            tong.setdefault((i, nam), []).append((ten, h))
    thong_ke[ten] = (n, bo)

ket = {}; gop = 0; xd = []
for (i, nam), ds in tong.items():
    diems = {h["diem"] for _, h in ds}
    if len(diems) > 1:
        xd.append((i, nam, ds)); continue
    ten0, h0 = ds[0]
    h = dict(h0)
    if len(ds) > 1:
        ly = h0["lyDo"]
        for t, x in ds[1:]:
            if x["lyDo"] in ly: continue  # chạy lại: đã gộp rồi
            gop += 1
            ly += f" | [{t}] {x['lyDo']}"
        h["lyDo"] = ly
    ket.setdefault(i, {})[nam] = h

HT.write_text(json.dumps(ket, ensure_ascii=False, indent=2) + "\n", encoding="utf8")
out = ["# Xung đột khi gộp bản sửa điểm chuẩn", "",
       "Mục cùng (id, năm) nhưng khác `diem` giữa các nguồn: không gộp, cần người kiểm.", ""]
if not xd: out.append("Không có xung đột.")
for i, nam, ds in xd:
    t = DL[i]; out.append(f"- `{i}` {t['ma']} {t['nganh']} năm {nam}: " + "; ".join(f"{s}={h['diem']} (trang {h['trang']}, {h['url']})" for s, h in ds))
out += ["", "## Mục bị loại", ""] + [f"- {t} `{i}` {n}: {l}" for t, i, n, l in loai]
(R / "docs/audits/gop-hieu-chinh-xung-dot.md").write_text("\n".join(out) + "\n", encoding="utf8")
for t, (n, b) in thong_ke.items(): print(f"{t}: {n} mục, loại {b}")
print(f"gộp trùng cùng điểm: {gop}; xung đột: {len(xd)}; tổng mục ra: {sum(len(v) for v in ket.values())}")
for t, i, n, l in loai[:20]: print("loại", t, i, n, l)

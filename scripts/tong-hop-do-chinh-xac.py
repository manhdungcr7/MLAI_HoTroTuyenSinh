"""Tổng hợp độ chính xác từ docs/audits/mau-do-chinh-xac-danh-sach.csv (kết quả script)
và docs/audits/mau-do-chinh-xac-kiem-tay.csv (kết quả đọc PDF bằng mắt, ghi tay).
Chạy: python scripts/tong-hop-do-chinh-xac.py
"""
import csv, math, random
from collections import Counter
from pathlib import Path

D = Path(__file__).resolve().parents[1] / "docs/audits"
R = list(csv.DictReader(open(D / "mau-do-chinh-xac-danh-sach.csv", encoding="utf-8-sig")))
KT = {(r["mau"], r["id"], r["nam"]): r for r in csv.DictReader(open(D / "mau-do-chinh-xac-kiem-tay.csv", encoding="utf-8-sig"))}


def wilson(k, n, z=1.96):
    if n == 0:
        return (float("nan"),) * 3
    p = k / n; d = 1 + z * z / n
    c = (p + z * z / (2 * n)) / d; h = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d
    return p, c - h, c + h


def pc(t):
    p, a, b = t
    return f"{p*100:.1f}% (Wilson 95%: {a*100:.1f}% đến {b*100:.1f}%)"


def phan_loai(r):
    """Trạng thái cuối: KHỚP / SAI / KHÔNG XÁC ĐỊNH (PDF không chứa điểm để đối chiếu) / CHƯA KIỂM (số nguyên ngoài mẫu kiểm tay)."""
    nguyen = float(r["diem_du_lieu"]).is_integer()
    k = KT.get((r["mau"], r["id"], r["nam"]))
    if k and k["nguon_kiem"] == "kiem-them":
        k = None  # kiểm thêm ngoài mẫu con: chỉ để liệt kê, không dùng tính tỉ lệ
    if r["ket_qua"] == "KHỚP":
        return "KHỚP", "tự động"
    if k:
        return k["ket_qua_kiem_tay"], "kiểm tay"
    if r["ket_qua"] == "KHÔNG ĐỌC ĐƯỢC":
        return "CHƯA KIỂM", "-"
    return r["ket_qua"], "tự động"


for mau in ("ngau-nhien", "diem-nhay"):
    rows = [r for r in R if r["mau"] == mau]
    print(f"\n=== Mẫu {mau}: {len(rows)} dòng ===")
    print("Kết quả script:", dict(Counter(r["ket_qua"] for r in rows)))
    for ten, loc in (("điểm có phần thập phân", lambda r: not float(r["diem_du_lieu"]).is_integer()),
                     ("điểm nguyên", lambda r: float(r["diem_du_lieu"]).is_integer())):
        sub = [r for r in rows if loc(r)]
        pl = Counter(phan_loai(r)[0] for r in sub)
        k, s = pl["KHỚP"], pl["SAI"]
        print(f"[{ten}] n={len(sub)}; sau kiểm tay: {dict(pl)}")
        if k + s:
            print(f"    độ chính xác trên dòng quyết định được: {k}/{k+s} = {pc(wilson(k, k+s))}")
    # riêng nhóm số nguyên: chỉ trên mẫu con đã kiểm tay (ngẫu nhiên trong các dòng số nguyên)
    ik = [KT[(r['mau'], r['id'], r['nam'])] for r in rows if (r['mau'], r['id'], r['nam']) in KT
          and KT[(r['mau'], r['id'], r['nam'])]['nguon_kiem'] == 'mau-con-so-nguyen']
    c = Counter(x["ket_qua_kiem_tay"] for x in ik)
    print(f"[mẫu con số nguyên kiểm tay] n={len(ik)}: {dict(c)}")
    k_ = c["KHỚP"]; s_ = c["SAI"]
    if k_ + s_:
        print(f"    độ chính xác trên dòng số nguyên quyết định được (mẫu con): {k_}/{k_+s_} = {pc(wilson(k_, k_+s_))}")

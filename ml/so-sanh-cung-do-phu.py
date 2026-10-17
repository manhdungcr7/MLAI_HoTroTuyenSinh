"""So sánh công bằng các cách dự báo khoảng 80%: ép mọi phương án về cùng độ phủ rồi so độ rộng và điểm Winkler.

    python -I ml/so-sanh-cung-do-phu.py

Mỗi phương án cho khoảng [lo, hi] quanh tâm c = (lo+hi)/2. Co giãn nửa độ rộng bằng hệ số lam sao cho độ phủ gộp qua các năm kiểm tra
đạt đúng 80%. Phương án nào cho khoảng HẸP hơn ở cùng độ phủ là phương án thật sự tốt hơn (loại bỏ khác biệt chỉ do nới rộng).
"""
import sys
from importlib import import_module
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
tn = import_module("thu-nghiem")
kh = import_module("thu-nghiem-khoang")
MUC_TIEU = 0.8


def lam_cho_do_phu(cac_nam, muc=MUC_TIEU):
    """Tìm lam để độ phủ gộp (theo số mẫu) bằng muc, bằng chia đôi."""
    lo_l, hi_l = 0.2, 6.0
    for _ in range(50):
        m = (lo_l + hi_l) / 2
        phu = sum(np.sum((y >= c - m * (c - lo)) & (y <= c + m * (hi - c))) for y, lo, hi, c in cac_nam) / sum(len(y) for y, *_ in cac_nam)
        lo_l, hi_l = (m, hi_l) if phu < muc else (lo_l, m)
    return (lo_l + hi_l) / 2


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    df = tn.bang_cap(tn.doc_du_lieu())
    kho: dict[str, list] = {}
    for nam in (2024, 2025):
        tr, kt = df[df["nam"] < nam], df[df["nam"] == nam]
        y = kt["dich"].to_numpy()
        lo, hi, _ = kh.phuong_an_A(tr, kt); kho.setdefault("A heuristic cũ (phân vị toàn cục x 1,3 x căn số năm)", []).append((y, lo, hi, (lo + hi) / 2))
        lo, hi, _ = kh.phuong_an_B(tr, kt); kho.setdefault("B phân vị theo nhóm (không máy học)", []).append((y, lo, hi, (lo + hi) / 2))
        cs, ds = [], []
        for s in range(3):
            c, d = kh.phuong_an_CD(tr, kt, s)
            cs.append(c); ds.append(d)
        lo, hi = np.mean([c[0] for c in cs], 0), np.mean([c[1] for c in cs], 0)
        kho.setdefault("C LightGBM hồi quy phân vị (thích ứng theo đặc trưng)", []).append((y, lo, hi, (lo + hi) / 2))
    print(f"{'Phương án':64s} {'lam':>5s} {'phủ':>6s} {'rộng':>6s} {'Winkler':>8s}")
    for ten, cac_nam in kho.items():
        lam = lam_cho_do_phu(cac_nam)
        phu, rong, wk, n = [], [], [], []
        for y, lo, hi, c in cac_nam:
            l2, h2 = c - lam * (c - lo), c + lam * (hi - c)
            phu.append(np.mean((y >= l2) & (y <= h2))); rong.append(np.mean(h2 - l2)); wk.append(kh.winkler(y, l2, h2)); n.append(len(y))
        w = np.array(n, float)
        print(f"{ten:64s} {lam:5.2f} {np.average(phu, weights=w):6.1%} {np.average(rong, weights=w):6.2f} {np.average(wk, weights=w):8.2f}")


if __name__ == "__main__":
    main()

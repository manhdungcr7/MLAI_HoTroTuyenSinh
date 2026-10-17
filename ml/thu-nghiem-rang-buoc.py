"""Thử các ràng buộc cho khoảng dự báo: (1) không ràng buộc, (2) chặn dưới tại điểm sàn 15, (3) sàn + trần rộng theo phân vị lịch sử.

    python -I ml/thu-nghiem-rang-buoc.py

Với mỗi cấu hình, chọn hệ số co giãn lam để độ phủ gộp 2024-2025 đạt 80%, rồi báo độ rộng và Winkler của backtest,
độ phủ ngoài mẫu (lam chọn từ 2024, áp cho 2025), và độ rộng trung bình khi áp cho tập dự báo 2027 (đo mức hợp lý về mặt sử dụng).
"""
import sys
from importlib import import_module
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
hl = import_module("huan-luyen-2027")
tn, kh = hl.tn, hl.kh
SAN = tn.SAN


def ap(lo, hi, lam, base, rb):
    """Áp co giãn rồi ràng buộc. `base` là điểm năm gần nhất; ràng buộc làm trên thang điểm tuyệt đối rồi đổi lại về độ thay đổi."""
    l2, h2 = hl.co_gian(lo, hi, lam)
    if rb["san"]:
        l2 = np.where(base >= SAN, np.maximum(l2, SAN - base), l2)
    if rb["tran"] is not None:
        l2, h2 = np.maximum(l2, rb["tran"][0]), np.minimum(h2, rb["tran"][1])
    return l2, h2


def tim_lam(cac, rb, muc=0.8):
    a, b = 0.2, 8.0
    n = sum(len(y) for y, *_ in cac)
    for _ in range(50):
        m = (a + b) / 2
        phu = sum(np.sum((y >= ap(lo, hi, m, base, rb)[0]) & (y <= ap(lo, hi, m, base, rb)[1])) for y, lo, hi, base in cac) / n
        a, b = (m, b) if phu < muc else (a, m)
    return (a + b) / 2


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    df = tn.bang_cap(tn.doc_du_lieu(), 3)
    cac = []
    for nam in (2024, 2025):
        tr, kt = df[df["nam"] < nam], df[df["nam"] == nam]
        lo, md, hi = hl.du_bao_khoang(tr, kt)
        cac.append((kt["dich"].to_numpy(), lo, hi, kt["diem_gan"].to_numpy()))
    # tập dự báo 2027 để đo độ rộng áp dụng thực tế
    ds = tn.doc_du_lieu()
    import pandas as pd
    dong = []
    for x in ds:
        nam = sorted(int(y) for y in x["diem"]); l = nam[-1]
        if 2027 - l > 3:
            continue
        d = [x["diem"][str(y)] for y in nam]
        dong.append({"id": x["id"], "ma": x["ma"], "nam": 2027, "cach": 2027 - l, "nhom": x["nhom"], "tinh": x["tinh"], "tier": x["tier"], "diem_gan": d[-1], "so_nam": len(d),
                     "delta_gan": d[-1] - d[-2] if len(d) > 1 else np.nan, "delta_tb": float(np.mean(np.diff(d))) if len(d) > 1 else np.nan, "dao_dong": float(np.std(d)) if len(d) > 1 else np.nan,
                     "tb2": float(np.mean(d[-2:])), "o_san": float(abs(d[-1] - SAN) < 1e-9), "so_to_hop": len(x["toHop"]), "nam_gan": l, "dich": np.nan})
    kt27 = pd.DataFrame(dong)
    lo27, md27, hi27 = hl.du_bao_khoang(df, kt27)
    b27 = kt27["diem_gan"].to_numpy()
    q01, q05, q95, q99 = np.quantile(df["dich"], [0.01, 0.05, 0.95, 0.99])
    print(f"phân vị lịch sử của độ thay đổi: p1={q01:.2f} p5={q05:.2f} p95={q95:.2f} p99={q99:.2f}")
    for ten, rb in [("1. không ràng buộc", {"san": False, "tran": None}), ("2. chặn dưới tại sàn 15", {"san": True, "tran": None}),
                    ("3. sàn + trần p1..p99", {"san": True, "tran": (q01, q99)}), ("4. sàn + trần p5..p95", {"san": True, "tran": (q05, q95)})]:
        lam = tim_lam(cac, rb)
        w = np.array([len(y) for y, *_ in cac], float)
        rs = [hl.thuoc_do(y, *ap(lo, hi, lam, base, rb)) for y, lo, hi, base in cac]
        gop = {k: float(np.average([r[k] for r in rs], weights=w)) for k in ("phu", "rong", "winkler")}
        lam24 = tim_lam(cac[:1], rb)
        y5, lo5, hi5, b5 = cac[1]
        nm = hl.thuoc_do(y5, *ap(lo5, hi5, lam24, b5, rb))
        l27, h27 = ap(lo27, hi27, lam, b27, rb)
        cham_duoi = float(np.mean(np.isclose(l27, rb["tran"][0]))) if rb["tran"] else float("nan")
        print(f"{ten:28s} lam {lam:4.2f} | backtest phủ {gop['phu']:.1%} rộng {gop['rong']:.2f} Winkler {gop['winkler']:.2f} | ngoài mẫu 2025 phủ {nm['phu']:.1%} Winkler {nm['winkler']:.2f} | dự báo 2027 rộng TB {np.mean(h27 - l27):.2f}, trung vị {np.median(h27 - l27):.2f}, p90 {np.percentile(h27 - l27, 90):.2f}")


if __name__ == "__main__":
    main()

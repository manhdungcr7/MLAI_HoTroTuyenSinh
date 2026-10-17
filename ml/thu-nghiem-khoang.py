"""So sánh các cách dự báo KHOẢNG 80% (p10 đến p90) cho điểm chuẩn năm sau, kiểm định lăn theo thời gian.

    python -I ml/thu-nghiem-khoang.py

Các phương án (cùng tâm là điểm năm gần nhất cộng độ lệch dự báo):
  A. heuristic cũ của app: phân vị toàn cục của độ thay đổi, nhân 1,3 và căn bậc hai số năm cách
  B. phân vị theo nhóm (không máy học): chia theo loại nguồn, mức điểm, số năm lịch sử
  C. LightGBM hồi quy phân vị (p10, p50, p90), chưa hiệu chỉnh
  D. LightGBM hồi quy phân vị + hiệu chỉnh conformal (CQR): khoảng thích ứng theo đặc trưng, độ phủ được bảo đảm
Chỉ số: độ phủ (mục tiêu 80%), độ rộng trung bình, điểm khoảng Winkler (càng thấp càng tốt, phạt khoảng quá rộng và bỏ sót).
"""
import sys

import lightgbm as lgb
import numpy as np
import pandas as pd

sys.path.insert(0, str(__import__("pathlib").Path(__file__).resolve().parent))
from importlib import import_module

tn = import_module("thu-nghiem")
ALPHA = 0.2  # khoảng 80%
COT = ["cach", "diem_gan", "so_nam", "delta_gan", "delta_tb", "dao_dong", "o_san", "so_to_hop", "tier_ma", "lech_nhom", "lech_truong", "dl_nhom"]


def winkler(y, lo, hi, a=ALPHA):
    return np.mean((hi - lo) + (2 / a) * np.maximum(lo - y, 0) + (2 / a) * np.maximum(y - hi, 0))


def phuong_an_A(tr, kt):
    lo, hi = np.quantile(tr["dich"], [0.1, 0.9])
    k = np.sqrt(kt["cach"].to_numpy())
    return lo * 1.3 * k, hi * 1.3 * k, np.zeros(len(kt))


def nhom_khoa(d):
    return list(zip((d["tier"] == "official_pdf").astype(int), pd.cut(d["diem_gan"], [0, 15.01, 18, 21, 24, 31], labels=False), np.minimum(d["so_nam"], 2)))


def phuong_an_B(tr, kt):
    tr, kt = tr.copy(), kt.copy()
    tr["k"], kt["k"] = nhom_khoa(tr), nhom_khoa(kt)
    chung_lo, chung_hi = np.quantile(tr["dich"], [0.1, 0.9])
    q = {}
    for k, g in tr.groupby("k"):
        if len(g) >= 30:
            q[k] = tuple(np.quantile(g["dich"], [0.1, 0.5, 0.9]))
    lo = np.array([q.get(k, (chung_lo, 0, chung_hi))[0] for k in kt["k"]])
    hi = np.array([q.get(k, (chung_lo, 0, chung_hi))[2] for k in kt["k"]])
    return lo, hi, np.zeros(len(kt))


def gbm_phan_vi(a, y, b):
    out = {}
    for qn in (0.1, 0.5, 0.9):
        m = lgb.LGBMRegressor(objective="quantile", alpha=qn, n_estimators=120, learning_rate=0.04, num_leaves=5, min_child_samples=30, subsample=0.8, subsample_freq=1,
                              colsample_bytree=0.8, reg_lambda=8.0, verbose=-1).fit(a, y)
        out[qn] = m.predict(b)
    lo, md, hi = np.minimum(out[0.1], out[0.5]), out[0.5], np.maximum(out[0.9], out[0.5])
    return lo, md, hi


def phuong_an_CD(tr, kt, seed=0):
    rng = np.random.default_rng(seed)
    idx = rng.permutation(len(tr))
    cat = idx[: int(0.4 * len(tr))]
    huan = idx[int(0.4 * len(tr)):]
    t1, t2 = tr.iloc[huan].copy(), tr.iloc[cat].copy()
    t1, t2 = tn.them_dac_trung_nhom(t1, t2)
    t1b, ktb = tn.them_dac_trung_nhom(t1, kt)
    a, b = tn.chuan_bi(t1, t2, COT)
    _, c = tn.chuan_bi(t1b, ktb, COT)
    lo_c, md_c, hi_c = gbm_phan_vi(a, t1["dich"].to_numpy(), b)
    y_c = t2["dich"].to_numpy()
    lo_k, md_k, hi_k = gbm_phan_vi(a, t1["dich"].to_numpy(), c)
    diem = np.maximum(lo_c - y_c, y_c - hi_c)
    qhat = np.quantile(diem, min(1.0, (1 - ALPHA) * (1 + 1 / len(diem))))
    return (lo_k, hi_k, md_k), (lo_k - qhat, hi_k + qhat, md_k)


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    df = tn.bang_cap(tn.doc_du_lieu())
    tong = {}
    for nam in (2024, 2025):
        tr, kt = df[df["nam"] < nam], df[df["nam"] == nam]
        y = kt["dich"].to_numpy()
        print(f"\n== Năm kiểm tra {nam}: huấn luyện {len(tr)}, kiểm tra {len(kt)} ==")
        res = {}
        lo, hi, _ = phuong_an_A(tr, kt); res["A heuristic cũ"] = (lo, hi)
        lo, hi, _ = phuong_an_B(tr, kt); res["B phân vị theo nhóm"] = (lo, hi)
        c_ls, d_ls = [], []
        for s in range(3):
            c, d = phuong_an_CD(tr, kt, s)
            c_ls.append(c); d_ls.append(d)
        res["C LightGBM chưa hiệu chỉnh"] = (np.mean([c[0] for c in c_ls], 0), np.mean([c[1] for c in c_ls], 0))
        res["D LightGBM + conformal"] = (np.mean([d[0] for d in d_ls], 0), np.mean([d[1] for d in d_ls], 0))
        for ten, (lo, hi) in res.items():
            phu, rong, wk = float(np.mean((y >= lo) & (y <= hi))), float(np.mean(hi - lo)), float(winkler(y, lo, hi))
            tong.setdefault(ten, []).append((phu, rong, wk, len(y)))
            print(f"  {ten:30s} phủ {phu:5.1%}  rộng {rong:5.2f}  Winkler {wk:6.2f}")
    print("\n== Trung bình có trọng số hai năm kiểm tra ==")
    for ten, ls in tong.items():
        w = np.array([n for *_, n in ls], float)
        print(f"  {ten:30s} phủ {np.average([a for a, *_ in ls], weights=w):5.1%}  rộng {np.average([b for _, b, *_ in ls], weights=w):5.2f}  Winkler {np.average([c for _, _, c, _ in ls], weights=w):6.2f}")


if __name__ == "__main__":
    main()

"""Mô hình dự báo điểm chuẩn THPT (LightGBM, hồi quy phân vị) và backtest theo thời gian.

    python ml/du-bao-diem-chuan.py

Bài toán: biết điểm chuẩn các năm trước của một chương trình, dự đoán điểm chuẩn năm sau (cả khoảng 10% đến 90%).
Mô hình dự đoán độ thay đổi so với năm gần nhất, không dự đoán điểm tuyệt đối.
Chia theo thời gian: huấn luyện chỉ bằng các năm đích đến trước năm kiểm tra, không có rò rỉ tương lai.
So với: (1) giữ nguyên điểm năm trước, (2) khoảng theo phân vị độ thay đổi toàn cục (cách đang dùng trong app).
"""
import json
import sys
from pathlib import Path

import lightgbm as lgb
import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
QUANTILES = (0.1, 0.5, 0.9)


def bang_du_lieu() -> pd.DataFrame:
    ds = json.loads((ROOT / "src" / "data" / "du-lieu-that.json").read_text(encoding="utf-8"))
    dong = []
    for x in ds:
        if x["pt"] != "THPT":
            continue
        nam = sorted(int(y) for y in x["diem"])
        for i, t in enumerate(nam):
            truoc = nam[:i]
            if not truoc or t - truoc[-1] > 2:
                continue
            gan = truoc[-1]
            d = [x["diem"][str(y)] for y in truoc]
            dong.append({
                "id": x["id"], "ma": x["ma"], "nam": t, "cach": t - gan,
                "diem_gan": d[-1], "so_nam": len(d),
                "delta_gan": d[-1] - d[-2] if len(d) > 1 else np.nan,
                "delta_tb": float(np.mean(np.diff(d))) if len(d) > 1 else np.nan,
                "dao_dong": float(np.std(d)) if len(d) > 1 else np.nan,
                "nhom": x["nhom"], "tinh": x["tinh"], "tier": x["tier"],
                "so_to_hop": len(x["toHop"]),
                "dich": x["diem"][str(t)] - d[-1],
            })
    df = pd.DataFrame(dong)
    for c in ("nhom", "tinh", "tier"):
        df[c] = df[c].astype("category")
    return df


DAC_TRUNG = ["cach", "diem_gan", "so_nam", "delta_gan", "delta_tb", "dao_dong", "nhom", "tinh", "tier", "so_to_hop"]


def huan_luyen(tr: pd.DataFrame) -> dict:
    mo = {}
    for q in QUANTILES:
        mo[q] = lgb.LGBMRegressor(objective="quantile", alpha=q, n_estimators=150, learning_rate=0.04, num_leaves=6,
                                  min_child_samples=25, subsample=0.8, subsample_freq=1, colsample_bytree=0.8,
                                  reg_lambda=5.0, verbose=-1).fit(tr[DAC_TRUNG], tr["dich"])
    return mo


def danh_gia(df: pd.DataFrame, nam_kt: int) -> dict:
    tr, kt = df[df["nam"] < nam_kt], df[df["nam"] == nam_kt]
    if len(tr) < 100 or len(kt) < 30:
        return {}
    mo = huan_luyen(tr)
    p = {q: mo[q].predict(kt[DAC_TRUNG]) for q in QUANTILES}
    p[0.1], p[0.9] = np.minimum(p[0.1], p[0.5]), np.maximum(p[0.9], p[0.5])
    y = kt["dich"].to_numpy()
    # cách đang dùng: phân vị độ thay đổi toàn cục của dữ liệu huấn luyện, nới theo căn số năm cách xa, hệ số 1.3
    lo, hi = np.quantile(tr["dich"], [0.1, 0.9])
    k = np.sqrt(kt["cach"].to_numpy())
    ban_dau = (lo * 1.3 * k, hi * 1.3 * k)
    return {
        "nam": nam_kt, "huan_luyen": len(tr), "kiem_tra": len(kt),
        "MAE giữ nguyên": float(np.mean(np.abs(y))),
        "MAE mô hình": float(np.mean(np.abs(y - p[0.5]))),
        "phủ 80% cũ": float(np.mean((y >= ban_dau[0]) & (y <= ban_dau[1]))),
        "rộng cũ": float(np.mean(ban_dau[1] - ban_dau[0])),
        "phủ 80% mô hình": float(np.mean((y >= p[0.1]) & (y <= p[0.9]))),
        "rộng mô hình": float(np.mean(p[0.9] - p[0.1])),
    }


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    df = bang_du_lieu()
    print(f"{len(df)} cặp (chương trình, năm đích), {df['id'].nunique()} chương trình, năm đích: {sorted(df['nam'].unique())}")
    for nam in sorted(df["nam"].unique()):
        r = danh_gia(df, nam)
        if r:
            print({k: (round(v, 3) if isinstance(v, float) else v) for k, v in r.items()})


if __name__ == "__main__":
    main()

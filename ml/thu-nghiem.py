"""Thử nghiệm mô hình dự báo điểm chuẩn năm sau: nhiều mô hình, nhiều bộ đặc trưng, kiểm định lăn theo thời gian.

    python -I ml/thu-nghiem.py

Đơn vị dự báo: một chương trình THPT, biết các điểm chuẩn đã có tới năm `gan`, dự báo điểm chuẩn năm `t` (t > gan).
Biến đích: độ thay đổi so với điểm năm gần nhất (dich = diem_t - diem_gan). Mọi thống kê tổng hợp (trung bình nhóm, xu hướng nhóm)
chỉ tính từ các dòng có năm đích NHỎ HƠN năm kiểm tra, nên không rò rỉ tương lai.
"""
import json
import sys
from pathlib import Path

import lightgbm as lgb
import numpy as np
import pandas as pd
from sklearn.linear_model import RidgeCV

ROOT = Path(__file__).resolve().parents[1]
SAN = 15.0


# Khớp quy tắc của ứng dụng (src/engine/trang-thai-du-lieu.ts, cacDiemHopLe): điểm THPT đúng bằng mức sàn 15,0 không được coi là điểm chuẩn của ngành,
# nên không đưa vào huấn luyện (cả điểm gốc lẫn điểm đích) và ngành chỉ có mức sàn không được dự báo. Nguồn dữ liệu không có trường nào
# phân biệt điểm sàn với điểm chuẩn (các dòng đúng 15 giống hệt cấu trúc các dòng khác), nên đây là quy tắc thận trọng, không phải khẳng định về nguồn.
LOC_SAN = True


def doc_du_lieu() -> list[dict]:
    ra = []
    for x in json.loads((ROOT / "src" / "data" / "du-lieu-that.json").read_text(encoding="utf-8")):
        if x["pt"] != "THPT" or not x["diem"]:
            continue
        diem = {n: d for n, d in x["diem"].items() if not (LOC_SAN and abs(d - SAN) < 1e-9)}
        if diem:
            ra.append({**x, "diem": diem})
    return ra


def bang_cap(ds: list[dict], toi_da_cach: int = 3) -> pd.DataFrame:
    """Mỗi dòng: (chương trình, năm đích t, năm gần nhất trước đó). Dùng cho huấn luyện và kiểm định."""
    dong = []
    for x in ds:
        nam = sorted(int(y) for y in x["diem"])
        for i, t in enumerate(nam):
            if i == 0 or t - nam[i - 1] > toi_da_cach:
                continue
            d = [x["diem"][str(y)] for y in nam[:i]]
            dong.append({
                "id": x["id"], "ma": x["ma"], "nam": t, "cach": t - nam[i - 1], "nhom": x["nhom"], "tinh": x["tinh"], "tier": x["tier"],
                "diem_gan": d[-1], "so_nam": len(d),
                "delta_gan": d[-1] - d[-2] if len(d) > 1 else np.nan,
                "delta_tb": float(np.mean(np.diff(d))) if len(d) > 1 else np.nan,
                "dao_dong": float(np.std(d)) if len(d) > 1 else np.nan,
                "tb2": float(np.mean(d[-2:])),
                "o_san": float(abs(d[-1] - SAN) < 1e-9),
                "so_to_hop": len(x["toHop"]),
                "nam_gan": nam[i - 1],
                "dich": x["diem"][str(t)] - d[-1],
            })
    return pd.DataFrame(dong)


def them_dac_trung_nhom(tr: pd.DataFrame, kt: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Đặc trưng nhóm tính CHỈ từ tập huấn luyện: độ lệch của điểm so với trung bình nhóm, và biến động gần nhất của trường và nhóm ngành."""
    tr, kt = tr.copy(), kt.copy()
    tb_nhom = tr.groupby("nhom", observed=True)["diem_gan"].mean()
    tb_truong = tr.groupby("ma")["diem_gan"].mean()
    dl_truong = tr.groupby("ma")["dich"].mean()
    dl_nhom = tr.groupby("nhom", observed=True)["dich"].mean()
    for d in (tr, kt):
        d["lech_nhom"] = d["diem_gan"] - d["nhom"].map(tb_nhom).astype(float).fillna(tr["diem_gan"].mean())
        d["lech_truong"] = d["diem_gan"] - d["ma"].map(tb_truong).fillna(tr["diem_gan"].mean())
        d["dl_truong"] = d["ma"].map(dl_truong).fillna(0.0)
        d["dl_nhom"] = d["nhom"].map(dl_nhom).astype(float).fillna(0.0)
    return tr, kt


CAC_DAC_TRUNG = {
    "co_ban": ["cach", "diem_gan", "so_nam", "delta_gan", "delta_tb", "dao_dong"],
    "co_ban+sàn": ["cach", "diem_gan", "so_nam", "delta_gan", "delta_tb", "dao_dong", "o_san"],
    "day_du": ["cach", "diem_gan", "so_nam", "delta_gan", "delta_tb", "dao_dong", "o_san", "so_to_hop", "lech_nhom", "lech_truong", "dl_truong", "dl_nhom", "nhom_ma", "tier_ma"],
}


def chuan_bi(tr: pd.DataFrame, kt: pd.DataFrame, cot: list[str]):
    for d in (tr, kt):
        d["nhom_ma"] = d["nhom"].astype("category").cat.codes if False else pd.Categorical(d["nhom"], categories=sorted(set(tr["nhom"]) | set(kt["nhom"]))).codes
        d["tier_ma"] = (d["tier"] == "official_pdf").astype(int)
    return tr[cot].fillna(0.0).to_numpy(), kt[cot].fillna(0.0).to_numpy()


def luoi(tr: pd.DataFrame, kt: pd.DataFrame, ten: str) -> np.ndarray:
    """Trả về dự báo độ thay đổi (trung vị) cho tập kiểm tra theo từng mô hình."""
    if ten == "giu_nguyen":
        return np.zeros(len(kt))
    if ten == "tb_hai_nam":
        return (kt["tb2"] - kt["diem_gan"]).to_numpy()
    if ten == "xu_huong_tat_dan":
        return (0.5 * kt["delta_tb"].fillna(0.0)).to_numpy()
    if ten.startswith("ridge"):
        cot = CAC_DAC_TRUNG[ten.split(":")[1]]
        a, b = chuan_bi(*them_dac_trung_nhom(tr, kt), cot)
        return RidgeCV(alphas=[0.1, 1, 10, 100]).fit(a, tr["dich"]).predict(b)
    if ten.startswith("gbm"):
        cot = CAC_DAC_TRUNG[ten.split(":")[1]]
        a, b = chuan_bi(*them_dac_trung_nhom(tr, kt), cot)
        m = lgb.LGBMRegressor(objective="huber", alpha=1.0, n_estimators=120, learning_rate=0.04, num_leaves=5, min_child_samples=40, subsample=0.8, subsample_freq=1,
                              colsample_bytree=0.8, reg_lambda=10.0, verbose=-1).fit(a, tr["dich"])
        return m.predict(b)
    raise ValueError(ten)


MO_HINH = ["giu_nguyen", "tb_hai_nam", "xu_huong_tat_dan", "ridge:co_ban", "ridge:co_ban+sàn", "ridge:day_du", "gbm:co_ban", "gbm:co_ban+sàn", "gbm:day_du"]


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    df = bang_cap(doc_du_lieu())
    print(f"{len(df)} cặp, {df['id'].nunique()} chương trình; số cặp theo năm đích: {df.groupby('nam').size().to_dict()}")
    goc = {}
    for nam in sorted(df["nam"].unique()):
        tr, kt = df[df["nam"] < nam], df[df["nam"] == nam]
        if len(tr) < 150 or len(kt) < 40:
            continue
        y = kt["dich"].to_numpy()
        print(f"\n== Năm kiểm tra {nam}: huấn luyện {len(tr)}, kiểm tra {len(kt)} (MAE giữ nguyên = {np.mean(np.abs(y)):.3f}) ==")
        for ten in MO_HINH:
            p = luoi(tr, kt, ten)
            mae, rmse = np.mean(np.abs(y - p)), np.sqrt(np.mean((y - p) ** 2))
            goc.setdefault(ten, []).append((mae, rmse, len(kt)))
            print(f"  {ten:20s} MAE {mae:.3f}  RMSE {rmse:.3f}")
    print("\n== Trung bình có trọng số theo số mẫu kiểm tra ==")
    for ten, ls in goc.items():
        w = np.array([n for _, _, n in ls], float)
        print(f"  {ten:20s} MAE {np.average([a for a, _, _ in ls], weights=w):.3f}  RMSE {np.average([b for _, b, _ in ls], weights=w):.3f}")


if __name__ == "__main__":
    main()

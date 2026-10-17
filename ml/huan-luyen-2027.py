"""Huấn luyện mô hình dự báo điểm chuẩn THPT năm 2027 cho từng chương trình và xuất kết quả cho ứng dụng.

    python -I ml/huan-luyen-2027.py

Quy trình (mỗi bước có số liệu in ra và ghi vào ml/ket-qua-du-bao-2027.json):
  1. Dữ liệu: các chương trình xét điểm thi THPT có điểm chuẩn nhiều năm (src/data/du-lieu-that.json).
  2. Tập huấn luyện: mỗi cặp (chương trình, năm đích t) với điểm của năm gần nhất trước đó; biến đích = điểm_t - điểm_gần_nhất.
  3. Mô hình: LightGBM hồi quy phân vị (p10, p50, p90), trung bình 5 hạt giống, đặc trưng ở ml/thu-nghiem.py (COT).
  4. Kiểm định lăn theo thời gian: huấn luyện chỉ bằng năm đích < T, dự báo năm T (T = 2024, 2025). Không rò rỉ tương lai.
  5. Hiệu chỉnh vĩ mô: nhân độ rộng khoảng với hệ số lam sao cho độ phủ gộp qua các năm kiểm tra đạt 80%. lam được chọn trên hai năm
     kiểm tra này (một tham số duy nhất); độ phủ "lam chọn từ 2024, áp cho 2025" là phép thử ngoài mẫu trung thực hơn và được báo riêng.
  6. Huấn luyện lại trên toàn bộ cặp, dự báo 2027 cho mọi chương trình có điểm từ 2024 trở lại đây (cách tối đa 3 năm).
"""
import json
import hashlib
import sys
from datetime import datetime, timezone
from importlib import import_module
from pathlib import Path

import lightgbm as lgb
import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent))
tn = import_module("thu-nghiem")
kh = import_module("thu-nghiem-khoang")
ROOT = Path(__file__).resolve().parents[1]
COT = kh.COT
NAM_DU_BAO = 2027
TOI_DA_CACH = 3
HAT_GIONG = (0, 1, 2, 3, 4)


def hoi_quy_phan_vi(a: np.ndarray, y: np.ndarray, b: np.ndarray) -> dict[float, np.ndarray]:
    """p10, p50, p90 của độ thay đổi; mỗi phân vị là trung bình của nhiều hạt giống để ổn định."""
    out = {}
    for qn in (0.1, 0.5, 0.9):
        ps = []
        for hat in HAT_GIONG:
            m = lgb.LGBMRegressor(objective="quantile", alpha=qn, n_estimators=120, learning_rate=0.04, num_leaves=5, min_child_samples=30, subsample=0.8,
                                  subsample_freq=1, colsample_bytree=0.8, reg_lambda=8.0, random_state=hat, verbose=-1).fit(a, y)
            ps.append(m.predict(b))
        out[qn] = np.mean(ps, axis=0)
    return out


def du_bao_khoang(tr: pd.DataFrame, kt: pd.DataFrame) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Trả về (lo, trung vị, hi) của độ thay đổi cho từng dòng kt, chưa hiệu chỉnh vĩ mô."""
    t1, k1 = tn.them_dac_trung_nhom(tr, kt)
    a, b = tn.chuan_bi(t1, k1, COT)
    p = hoi_quy_phan_vi(a, tr["dich"].to_numpy(), b)
    return np.minimum(p[0.1], p[0.5]), p[0.5], np.maximum(p[0.9], p[0.5])


def thuoc_do(y: np.ndarray, lo: np.ndarray, hi: np.ndarray) -> dict:
    return {"phu": float(np.mean((y >= lo) & (y <= hi))), "rong": float(np.mean(hi - lo)), "winkler": float(kh.winkler(y, lo, hi)), "n": int(len(y))}


def co_gian(lo: np.ndarray, hi: np.ndarray, lam: float, base: np.ndarray | None = None, tran: tuple[float, float] | None = None) -> tuple[np.ndarray, np.ndarray]:
    """Co giãn khoảng quanh tâm bằng lam (bù hiệu ứng "biến động năm sau lớn hơn lịch sử"), rồi áp hai ràng buộc có cơ sở:
      - Sàn của Bộ: điểm chuẩn không thấp hơn 15, nên với ngành đang ở từ 15 trở lên, cận dưới không thấp hơn 15 - điểm_gần_nhất.
      - Trần lịch sử: độ thay đổi một năm không vượt phân vị 1% và 99% của toàn bộ dữ liệu (chặn khoảng phi thực tế ở ngành mô hình ít thấy khi huấn luyện)."""
    c = (lo + hi) / 2
    l2, h2 = c - lam * (c - lo), c + lam * (hi - c)
    if base is not None:
        l2 = np.where(base >= tn.SAN, np.maximum(l2, tn.SAN - base), l2)
    if tran is not None:
        l2, h2 = np.maximum(l2, tran[0]), np.minimum(h2, tran[1])
    return l2, h2


def lam_cho_do_phu(cac_nam: list, muc: float = 0.8, trans: list | None = None) -> float:
    """Chọn lam để độ phủ gộp bằng muc. Mỗi phần tử là (y, lo, hi) hoặc (y, lo, hi, base)."""
    a, b = 0.2, 8.0
    tong = sum(len(x[0]) for x in cac_nam)
    for _ in range(50):
        m = (a + b) / 2
        phu = 0.0
        for i, x in enumerate(cac_nam):
            y, lo, hi = x[0], x[1], x[2]
            l2, h2 = co_gian(lo, hi, m, x[3] if len(x) > 3 else None, trans[i] if trans else None)
            phu += np.sum((y >= l2) & (y <= h2))
        a, b = (m, b) if phu / tong < muc else (a, m)
    return (a + b) / 2


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    ds = tn.doc_du_lieu()
    df = tn.bang_cap(ds, TOI_DA_CACH)
    ket_qua: dict = {"tao_luc": datetime.now(timezone.utc).isoformat(timespec="seconds")}

    # ---- 1. Thống kê dữ liệu ----
    tho_thpt = [x for x in json.loads((ROOT / "src" / "data" / "du-lieu-that.json").read_text(encoding="utf-8")) if x["pt"] == "THPT" and x["diem"]]
    nam_moi = pd.Series([max(int(y) for y in x["diem"]) for x in ds])
    ket_qua["du_lieu"] = {
        "so_chuong_trinh_thpt": len(ds), "so_co_tu_2_nam": int(sum(1 for x in ds if len(x["diem"]) >= 2)),
        "so_cap_huan_luyen": int(len(df)), "so_cap_theo_nam_dich": {int(k): int(v) for k, v in df.groupby("nam").size().items()},
        "nam_moi_nhat": {int(k): int(v) for k, v in nam_moi.value_counts().sort_index().items()},
        "so_chuong_trinh_thpt_tho": len(tho_thpt), "so_chuong_trinh_chi_co_muc_san_15": sum(1 for x in tho_thpt if all(abs(d - tn.SAN) < 1e-9 for d in x["diem"].values())),
        "so_diem_muc_san_15_bi_loai": sum(1 for x in tho_thpt for d in x["diem"].values() if abs(d - tn.SAN) < 1e-9),
        "thay_doi_theo_nam": {int(n): {"tb": round(float(g["dich"].mean()), 3), "do_lech": round(float(g["dich"].std()), 3), "n": int(len(g))} for n, g in df.groupby("nam")},
    }
    print("Dữ liệu:", json.dumps(ket_qua["du_lieu"], ensure_ascii=False))

    # ---- 2. Kiểm định lăn ----
    cac_nam: list[tuple[np.ndarray, np.ndarray, np.ndarray]] = []
    trans: list[tuple[float, float]] = []
    chi_so_diem: dict = {}
    for nam in (2024, 2025):
        tr, kt = df[df["nam"] < nam], df[df["nam"] == nam]
        y = kt["dich"].to_numpy()
        lo, md, hi = du_bao_khoang(tr, kt)
        cac_nam.append((y, lo, hi, kt["diem_gan"].to_numpy()))
        trans.append((float(np.quantile(tr["dich"], 0.01)), float(np.quantile(tr["dich"], 0.99))))
        chi_so_diem[nam] = {
            "n_huan_luyen": int(len(tr)), "n_kiem_tra": int(len(kt)),
            "MAE_giu_nguyen": float(np.mean(np.abs(y))), "MAE_mo_hinh": float(np.mean(np.abs(y - md))),
            "RMSE_giu_nguyen": float(np.sqrt(np.mean(y ** 2))), "RMSE_mo_hinh": float(np.sqrt(np.mean((y - md) ** 2))),
        }
    lam = lam_cho_do_phu(cac_nam, trans=trans)
    lam_2024 = lam_cho_do_phu(cac_nam[:1], trans=trans[:1])
    khoang = {"lam": lam, "lam_tu_2024": lam_2024, "tran_theo_nam": {2024: trans[0], 2025: trans[1]}, "theo_nam": {}}
    for i, (nam, (y, lo, hi, base)) in enumerate(zip((2024, 2025), cac_nam)):
        khoang["theo_nam"][nam] = {"chua_hieu_chinh": thuoc_do(y, lo, hi), "da_hieu_chinh": thuoc_do(y, *co_gian(lo, hi, lam, base, trans[i]))}
    khoang["ngoai_mau_lam_2024_ap_2025"] = thuoc_do(cac_nam[1][0], *co_gian(cac_nam[1][1], cac_nam[1][2], lam_2024, cac_nam[1][3], trans[1]))
    w = np.array([len(y) for y, *_ in cac_nam], float)
    khoang["gop"] = {k: float(np.average([khoang["theo_nam"][n]["da_hieu_chinh"][k] for n in (2024, 2025)], weights=w)) for k in ("phu", "rong", "winkler")}
    # đối chiếu: heuristic cũ và phân vị theo nhóm, cùng độ phủ
    doi_chieu = {}
    for ten, ham in (("heuristic_cu", kh.phuong_an_A), ("phan_vi_theo_nhom", kh.phuong_an_B)):
        ls = []
        for nam in (2024, 2025):
            tr, kt = df[df["nam"] < nam], df[df["nam"] == nam]
            lo, hi, _ = ham(tr, kt)
            ls.append((kt["dich"].to_numpy(), lo, hi))
        lm = lam_cho_do_phu(ls)
        rs = [thuoc_do(y, *co_gian(lo, hi, lm)) for y, lo, hi in ls]
        doi_chieu[ten] = {"lam": lm, **{k: float(np.average([r[k] for r in rs], weights=w)) for k in ("phu", "rong", "winkler")}}
    ket_qua["kiem_dinh"] = {"diem": chi_so_diem, "khoang": khoang, "doi_chieu_cung_do_phu_80": doi_chieu}
    print("Điểm:", json.dumps(chi_so_diem, ensure_ascii=False))
    print("Khoảng đã hiệu chỉnh (gộp):", json.dumps(khoang["gop"], ensure_ascii=False), "| lam =", round(lam, 3))
    print("Ngoài mẫu (lam chọn từ 2024, áp cho 2025):", json.dumps(khoang["ngoai_mau_lam_2024_ap_2025"], ensure_ascii=False))
    print("Đối chiếu cùng độ phủ 80%:", json.dumps(doi_chieu, ensure_ascii=False))

    # ---- 3. Huấn luyện lại trên toàn bộ và dự báo 2027 ----
    dong = []
    for x in ds:
        nam = sorted(int(y) for y in x["diem"])
        l = nam[-1]
        cach = NAM_DU_BAO - l
        if cach > TOI_DA_CACH:
            continue
        d = [x["diem"][str(y)] for y in nam]
        dong.append({
            "id": x["id"], "ma": x["ma"], "nam": NAM_DU_BAO, "cach": cach, "nhom": x["nhom"], "tinh": x["tinh"], "tier": x["tier"],
            "diem_gan": d[-1], "so_nam": len(d), "delta_gan": d[-1] - d[-2] if len(d) > 1 else np.nan,
            "delta_tb": float(np.mean(np.diff(d))) if len(d) > 1 else np.nan, "dao_dong": float(np.std(d)) if len(d) > 1 else np.nan,
            "tb2": float(np.mean(d[-2:])), "o_san": float(abs(d[-1] - tn.SAN) < 1e-9), "so_to_hop": len(x["toHop"]), "nam_gan": l, "dich": np.nan,
        })
    kt = pd.DataFrame(dong)
    lo, md, hi = du_bao_khoang(df, kt)
    tran_all = (float(np.quantile(df["dich"], 0.01)), float(np.quantile(df["dich"], 0.99)))
    base = kt["diem_gan"].to_numpy()
    lo2, hi2 = co_gian(lo, hi, lam, base, tran_all)
    out = {}
    for i, r in enumerate(kt.itertuples()):
        thap = float(np.clip(base[i] + lo2[i], 10, 30))
        cao = float(np.clip(base[i] + hi2[i], 10, 30))
        giua = float(np.clip(base[i] + md[i], thap, cao))
        out[r.id] = [round(thap, 2), round(giua, 2), round(cao, 2), int(r.nam_gan)]
    ket_qua["du_bao_2027"] = {
        "so_chuong_trinh": len(out), "theo_nam_co_so": {int(k): int(v) for k, v in kt["nam_gan"].value_counts().sort_index().items()},
        "do_rong_trung_binh": float(np.mean([v[2] - v[0] for v in out.values()])),
        "thay_doi_trung_vi_trung_binh": float(np.mean([v[1] - base[i] for i, v in enumerate(out.values())])),
    }
    print("Dự báo 2027:", json.dumps(ket_qua["du_bao_2027"], ensure_ascii=False))

    meta = {
        "namDuBao": NAM_DU_BAO, "moHinh": "LightGBM hồi quy phân vị (p10, p50, p90), trung bình 5 hạt giống",
        "catalogSha256": hashlib.sha256((ROOT / "src" / "data" / "du-lieu-that.json").read_bytes()).hexdigest(),
        "mucTinCay": 0.8, "heSoHieuChinh": round(lam, 3), "tranBienDong": [round(tran_all[0], 2), round(tran_all[1], 2)], "taoLuc": ket_qua["tao_luc"][:10],
        "kiemDinh": {"phuGop": round(khoang["gop"]["phu"], 3), "phuNgoaiMau": round(khoang["ngoai_mau_lam_2024_ap_2025"]["phu"], 3), "winkler": round(khoang["gop"]["winkler"], 2),
                     "winklerHeuristicCu": round(doi_chieu["heuristic_cu"]["winkler"], 2)},
    }
    (ROOT / "src" / "data" / "du-bao-2027.json").write_text(json.dumps({"meta": meta, "ds": out}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    (ROOT / "src" / "data" / "du-lieu-fingerprint.json").write_text(json.dumps({"sha256": meta["catalogSha256"]}, separators=(",", ":")), encoding="utf-8")
    (ROOT / "ml" / "ket-qua-du-bao-2027.json").write_text(json.dumps(ket_qua, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Đã ghi src/data/du-bao-2027.json ({len(out)} chương trình) và ml/ket-qua-du-bao-2027.json")


if __name__ == "__main__":
    main()

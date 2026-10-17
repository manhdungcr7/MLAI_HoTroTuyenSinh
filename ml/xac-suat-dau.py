"""Xác suất đậu từ khoảng dự đoán của LightGBM, kiểm định hiệu chỉnh bằng backtest theo thời gian, so với công thức logistic đặt tay cũ.

    python -I ml/xac-suat-dau.py

Định nghĩa: với điểm xét s của học sinh, P(đậu) = P(điểm chuẩn năm đó <= s). Phân phối điểm chuẩn lấy từ ba phân vị của mô hình
(p10, p50, p90 sau hiệu chỉnh vĩ mô) khớp một phân phối chuẩn hai nửa (split normal): sigma trái = (p50 - p10)/1,2816, sigma phải = (p90 - p50)/1,2816.
Kiểm định: trên các cặp (chương trình, năm đích) của 2024 và 2025 (mô hình chỉ học các năm trước), lấy s = điểm chuẩn thật + d, d thuộc một lưới,
so xác suất dự đoán với kết quả thật (điểm chuẩn thật <= s). Báo Brier, log-loss, sai số hiệu chỉnh kỳ vọng (ECE) và bảng độ tin cậy.
Phép thử ngoài mẫu: lam chọn từ 2024, áp cho 2025.
"""
import json
import sys
from importlib import import_module
from pathlib import Path
from math import erf, sqrt

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
hl = import_module("huan-luyen-2027")
tn = hl.tn
Z90 = 1.2815515655446004
LUOI_D = np.array([-3, -2, -1.5, -1, -0.5, -0.25, 0, 0.25, 0.5, 1, 1.5, 2, 3], float)


def cdf_hai_nua(s: np.ndarray, thap: np.ndarray, giua: np.ndarray, cao: np.ndarray) -> np.ndarray:
    sl = np.maximum((giua - thap) / Z90, 0.05)
    sr = np.maximum((cao - giua) / Z90, 0.05)
    z = np.where(s <= giua, (s - giua) / sl, (s - giua) / sr)
    ph = np.vectorize(lambda v: 0.5 * (1 + erf(v / sqrt(2))))(z)
    # hai nửa có khối lượng 0,5 mỗi bên: CDF = 2*Phi(z)*0,5 ở nửa dưới, 0,5 + (Phi(z)-0,5) ở nửa trên
    return ph


def p_dau(s, thap, giua, cao):
    return np.clip(cdf_hai_nua(s, thap, giua, cao), 0.02, 0.98)


def ky_vong_tau(diem: dict[str, float], nam_dich: int):
    e = sorted(((int(n), d) for n, d in diem.items() if int(n) < nam_dich and 10 <= d <= 30), reverse=True)
    if not e:
        return 24.0, 1.25
    if len(e) == 1:
        return e[0][1], 1.45
    if len(e) == 2:
        return 0.65 * e[0][1] + 0.35 * e[1][1], float(np.clip(0.5 * abs(e[0][1] - e[1][1]) + 0.625, 0.85, 2.4))
    c = e[:4]
    w = np.array([0.6 ** i for i in range(len(c))])
    d = np.array([x[1] for x in c])
    return float((w * d).sum() / w.sum()), float(np.clip(0.6 * np.std(d, ddof=1) + 0.5, 0.8, 2.2))


def p_cu(s, kv, tau):
    z = (s - kv) / max(0.5, tau)
    return float(np.clip(1 / (1 + np.exp(-1.65 * z)), 0.02, 0.98))


def do(p: np.ndarray, o: np.ndarray) -> dict:
    p = np.clip(p, 1e-4, 1 - 1e-4)
    bins = np.linspace(0, 1, 11)
    idx = np.digitize(p, bins[1:-1])
    ece, bang = 0.0, []
    for b in range(10):
        m = idx == b
        if m.sum() == 0:
            continue
        ece += m.mean() * abs(p[m].mean() - o[m].mean())
        bang.append([f"{bins[b]:.1f}-{bins[b+1]:.1f}", int(m.sum()), round(float(p[m].mean()), 3), round(float(o[m].mean()), 3)])
    return {"brier": float(np.mean((p - o) ** 2)), "logloss": float(-np.mean(o * np.log(p) + (1 - o) * np.log(1 - p))), "ece": float(ece), "bang": bang}


def logit(p):
    p = np.clip(np.asarray(p, float), 1e-4, 1 - 1e-4)
    return np.log(p / (1 - p))


def platt(p, o):
    """P' = sigmoid(a + b*logit(P)): sửa việc đuôi phân phối chuẩn quá mỏng (điểm chuẩn thật đôi khi nhảy xa hơn mô hình nghĩ)."""
    from sklearn.linear_model import LogisticRegression
    m = LogisticRegression(C=1e6).fit(logit(p).reshape(-1, 1), o)
    return float(m.intercept_[0]), float(m.coef_[0][0])


def ap_platt(p, ab, lo=0.03, hi=0.97):
    return np.clip(1 / (1 + np.exp(-(ab[0] + ab[1] * logit(p)))), lo, hi)


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    ds = tn.doc_du_lieu()
    theo_id = {x["id"]: x for x in ds}
    df = tn.bang_cap(ds)
    cac_nam, trans = [], []
    for nam in (2024, 2025):
        tr, kt = df[df["nam"] < nam], df[df["nam"] == nam]
        lo, md, hi = hl.du_bao_khoang(tr, kt)
        cac_nam.append((kt["dich"].to_numpy(), lo, hi, kt["diem_gan"].to_numpy(), md, kt))
        trans.append((float(np.quantile(tr["dich"], 0.01)), float(np.quantile(tr["dich"], 0.99))))
    lam = hl.lam_cho_do_phu([x[:4] for x in cac_nam], trans=trans)
    lam24 = hl.lam_cho_do_phu([cac_nam[0][:4]], trans=trans[:1])
    kq = {}
    thu_thap = {}
    for ten, he in (("gop (lam chọn trên 2024+2025)", lambda i: lam), ("ngoài mẫu (lam từ 2024, chỉ chấm 2025)", lambda i: lam24)):
        P_ml, P_cu, O, NAM = [], [], [], []
        for i, (y, lo, hi, base, md, kt) in enumerate(cac_nam):
            if "ngoài mẫu" in ten and i == 0:
                continue
            l2, h2 = hl.co_gian(lo, hi, he(i), base, trans[i])
            thap = np.clip(base + l2, 10, 30); cao = np.clip(base + h2, 10, 30); giua = np.clip(base + md, thap, cao)
            thuc = base + y
            nam_dich = 2024 + i
            for j, r in enumerate(kt.itertuples()):
                kv, tau = ky_vong_tau(theo_id[r.id]["diem"], nam_dich)
                for d in LUOI_D:
                    s = thuc[j] + d
                    P_ml.append(float(p_dau(np.array([s]), thap[j:j+1], giua[j:j+1], cao[j:j+1])[0]))
                    P_cu.append(p_cu(s, kv, tau))
                    O.append(1.0 if thuc[j] <= s else 0.0)
                    NAM.append(nam_dich)
        O = np.array(O)
        thu_thap[ten] = (np.array(P_ml), O, np.array(NAM))
        kq[ten] = {"n": int(len(O)), "mo_hinh_ml": do(np.array(P_ml), O), "cong_thuc_cu": do(np.array(P_cu), O)}
        a, b = kq[ten]["mo_hinh_ml"], kq[ten]["cong_thuc_cu"]
        print(f"\n== {ten}, n={len(O)}")
        for t, r in (("ML", a), ("cũ", b)):
            print(f"  {t}: Brier {r['brier']:.4f} | log-loss {r['logloss']:.4f} | ECE {r['ece']:.4f}")
        print("  Độ tin cậy (khoảng P | n | P TB | tần suất thật):")
        for t, r in (("ML", a), ("cũ", b)):
            print("   ", t, r["bang"])
    # Hiệu chỉnh Platt: học trên 2024, chấm trên 2025 (ngoài mẫu); rồi học trên cả hai năm để dùng cho ứng dụng.
    p_all, o_all, n_all = thu_thap["gop (lam chọn trên 2024+2025)"]
    m24 = n_all == 2024
    ab24 = platt(p_all[m24], o_all[m24])
    p25 = ap_platt(p_all[~m24], ab24)
    kq["platt_ngoai_mau"] = {"a_b_tu_2024": ab24, "n": int((~m24).sum()), **do(p25, o_all[~m24]), "khong_platt": do(np.clip(p_all[~m24], 0.03, 0.97), o_all[~m24])}
    ab = platt(p_all, o_all)
    kq["platt_cuoi"] = {"a": ab[0], "b": ab[1], **do(ap_platt(p_all, ab), o_all)}
    print()
    print("== Hiệu chỉnh Platt (học trên 2024, chấm 2025):", [round(x, 3) for x in ab24])
    for t, r in (("sau Platt", kq["platt_ngoai_mau"]), ("trước Platt", kq["platt_ngoai_mau"]["khong_platt"])):
        print(f"  {t}: Brier {r['brier']:.4f} | log-loss {r['logloss']:.4f} | ECE {r['ece']:.4f}")
        print("   ", r["bang"])
    print("== Hệ số cuối cùng (học trên cả 2024+2025): a = %.3f, b = %.3f" % ab)
    print("   sau Platt (trong mẫu):", {k: round(v, 4) for k, v in kq["platt_cuoi"].items() if k in ("brier", "logloss", "ece")})
    Path(__file__).with_name("ket-qua-xac-suat-dau.json").write_text(json.dumps(kq, ensure_ascii=False, indent=1), encoding="utf-8")


if __name__ == "__main__":
    main()

"""Ước lượng cú sốc điểm chuẩn toàn quốc theo năm — TỪ CHÍNH DỮ LIỆU ĐÃ CÀO.

Bản cũ (Gemini) gán `beta_shock = random.uniform(0.1, 0.9)` và
`sigma_idio = random.uniform(0.15, 0.6)` cho MỖI chương trình — hai con số
hoàn toàn không liên hệ gì tới thực tế, chỉ để Monte Carlo "có gì đó" chạy.

Cách làm đúng: với mọi (trường, ngành, tổ hợp) có điểm ở cả năm Y và năm Y-1,
tính delta = điểm(Y) - điểm(Y-1). Trung vị các delta trong một năm là ước
lượng thực của "cú sốc toàn quốc năm đó" (năm đề dễ hơn thì trung vị dương,
năm đề khó hơn thì âm). Độ lệch giữa các delta CÙNG NĂM (sau khi trừ trung vị
năm đó) là nhiễu riêng từng trường (sigma_idio) — có thể ước lượng theo
NHÓM cấp trường (school_tier) thay vì một hằng số chung.

GIỚI HẠN PHẢI NÓI THẲNG: dữ liệu thật hiện chỉ phủ khoảng 3-4 cặp năm liên
tiếp (2022→2023, 2023→2024, 2024→2025), nghĩa là ước lượng độ lệch chuẩn của
cú sốc toàn quốc dựa trên rất ít điểm dữ liệu (n~3-4). Đây là ước lượng có ý
nghĩa thống kê thật, nhưng khoảng tin cậy của chính nó rất rộng — hệ thống
phải phản ánh sự không chắc chắn này trong biên dự báo, không giả vờ chắc
chắn hơn thực tế.
"""

from __future__ import annotations

import numpy as np
import pandas as pd


def compute_year_deltas(cutoff_panel: pd.DataFrame) -> pd.DataFrame:
    """Trả về DataFrame long-format: mỗi dòng là một cặp năm liên tiếp của
    cùng (trường, ngành, tổ hợp) với delta điểm."""
    df = cutoff_panel.copy()
    df["major_label"] = df["label"].str.split(" / ").str[0]
    key_cols = ["school_code", "major_label", "combinations"]

    # Trung bình nếu có nhiều dòng trùng khóa trong cùng năm (vd 2 PDF chồng
    # nhau đã báo qua cross_doc_conflict — lấy trung bình cho bước này).
    agg = df.groupby(key_cols + ["cutoff_year"])["score"].mean().reset_index()
    agg = agg.sort_values(key_cols + ["cutoff_year"])

    agg["prev_score"] = agg.groupby(key_cols)["score"].shift(1)
    agg["prev_year"] = agg.groupby(key_cols)["cutoff_year"].shift(1)
    agg["delta"] = agg["score"] - agg["prev_score"]
    agg["year_gap"] = agg["cutoff_year"] - agg["prev_year"]

    # Chỉ giữ cặp năm LIỀN KỀ (gap=1) — delta giữa 2022 và 2024 bỏ qua 2023
    # gộp hai cú sốc năm làm một, sẽ làm nhiễu ước lượng.
    out = agg[(agg["year_gap"] == 1) & agg["delta"].notna()].copy()
    return out[key_cols + ["cutoff_year", "prev_year", "score", "prev_score", "delta"]]


def estimate_national_shock(cutoff_panel: pd.DataFrame) -> dict:
    deltas = compute_year_deltas(cutoff_panel)
    if deltas.empty:
        return {
            "by_year": {}, "overall_std": 1.0, "overall_median": 0.0,
            "n_pairs": 0, "warning": "Không đủ cặp năm liền kề để ước lượng — dùng giá trị mặc định rộng.",
        }

    by_year = deltas.groupby("cutoff_year")["delta"].agg(["median", "std", "count"])
    residual = deltas.merge(
        by_year["median"].rename("year_median"), left_on="cutoff_year", right_index=True)
    residual["idio"] = residual["delta"] - residual["year_median"]

    n_year_points = by_year.shape[0]
    overall_std = float(by_year["median"].std()) if n_year_points >= 2 else 1.0
    if not np.isfinite(overall_std) or overall_std <= 0:
        overall_std = 0.8  # sàn hợp lý cho biến động điểm chuẩn năm-năm ở VN

    return {
        "by_year": {
            int(y): {"median_delta": round(float(r["median"]), 3),
                     "std_delta": round(float(r["std"]), 3) if pd.notna(r["std"]) else None,
                     "n_programs": int(r["count"])}
            for y, r in by_year.iterrows()
        },
        "overall_std": round(overall_std, 3),
        "overall_median": round(float(by_year["median"].median()), 3),
        "idio_std_overall": round(float(residual["idio"].std()), 3) if len(residual) > 3 else 0.8,
        "n_pairs": int(len(deltas)),
        "n_year_points": n_year_points,
        "warning": (
            f"Ước lượng dựa trên {n_year_points} cặp năm liên tiếp — số lượng nhỏ, "
            "độ tin cậy của chính ước lượng độ lệch chuẩn còn hạn chế."
            if n_year_points < 4 else None
        ),
    }


if __name__ == "__main__":
    import sys
    from pathlib import Path
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
    from pipeline import config

    panel = pd.read_parquet(config.INTERIM / "cutoff_panel_raw.parquet")
    result = estimate_national_shock(panel)
    print(f"national_shock: {result['n_pairs']} cặp năm liền kề, "
          f"{result['n_year_points']} năm có ước lượng")
    for y, v in sorted(result["by_year"].items()):
        print(f"  {y}: trung vị delta={v['median_delta']:+.2f}  "
              f"độ lệch chuẩn={v['std_delta']}  n={v['n_programs']}")
    print(f"  độ lệch chuẩn cú sốc toàn quốc (ước lượng): {result['overall_std']}")
    print(f"  độ lệch chuẩn nhiễu riêng trường: {result['idio_std_overall']}")
    if result["warning"]:
        print(f"  [!] {result['warning']}")

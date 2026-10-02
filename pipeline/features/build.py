"""Sinh dự báo điểm chuẩn (forecast_p10/p50/p90) cho mỗi chương trình.

QUYẾT ĐỊNH THIẾT KẾ QUAN TRỌNG — vì sao KHÔNG dùng LightGBM ở quy mô dữ liệu
hiện tại: 58 trường thật, đa số chỉ có 2-3 năm liền kề. Huấn luyện một mô hình
học máy trên tập nhỏ như vậy có nguy cơ overfitting cao và không thể backtest
đáng tin cậy (tập test sẽ chỉ còn vài chục dòng cho một năm). Bản Gemini cũ
"backtest thành công" bằng dữ liệu giả — tại đây, với dữ liệu thật, một đường
cơ sở thống kê ĐƠN GIẢN NHƯNG TRUNG THỰC (điểm năm gần nhất + xu hướng toàn
quốc thật + biên bất định thật) đáng tin hơn một mô hình phức tạp không kiểm
chứng được. Khi kho dữ liệu đủ lớn (nhiều mùa tuyển sinh hơn), nâng cấp lên
LightGBM Quantile là bước hợp lý — không phải bây giờ.

Công thức:
    forecast_p50 = điểm(năm gần nhất) + xu_hướng_toàn_quốc_trung_vị × số_năm_ngoại_suy
    độ rộng biên = sqrt(số_năm_ngoại_suy) × sqrt(shock_std² + idio_std²)
    forecast_p10/p90 = p50 ∓ 1.28 × độ rộng biên   (xấp xỉ phân vị 10/90 của phân phối chuẩn)
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

import numpy as np
import pandas as pd
from scipy import stats


sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from common.national_shock import estimate_national_shock  # noqa: E402
from common.percentile import score_to_percentile, percentile_to_score  # noqa: E402
from pipeline import config  # noqa: E402

FORECAST_YEAR = 2026
Z90 = float(stats.norm.ppf(0.90))  # ≈1.2816


def build_forecasts(programs: pd.DataFrame, cutoff_panel: pd.DataFrame) -> pd.DataFrame:
    shock = estimate_national_shock(cutoff_panel)
    trend = shock["overall_median"]
    shock_std = shock["overall_std"]
    idio_std = shock.get("idio_std_overall", shock_std)

    df = programs.copy()
    df["years_extrapolated"] = FORECAST_YEAR - df["latest_year"].fillna(FORECAST_YEAR - 1)
    df["years_extrapolated"] = df["years_extrapolated"].clip(lower=1)

    # Quy đổi bách phân vị theo chuẩn Thông tư 06/2026/TT-BGDĐT (cấm bắc cầu điểm thô)
    def compute_percentile_info(row):
        score = row["latest_score"]
        year = row["latest_year"]
        combo = str(row.get("combinations_seen") or "A00").split(",")[0].strip()
        if pd.isna(score) or pd.isna(year):
            return pd.Series({"percentile_rank": 50.0, "equated_score": score if pd.notna(score) else 22.0})
        p = score_to_percentile(float(score), int(year), combo)
        s_eq = percentile_to_score(p, FORECAST_YEAR, combo)
        return pd.Series({"percentile_rank": p, "equated_score": s_eq})

    pct_res = df.apply(compute_percentile_info, axis=1)
    df["percentile_rank"] = pct_res["percentile_rank"]

    # Ngoại suy P50: lấy gốc từ điểm đã quy đổi tương đương bách phân vị sang năm 2026
    df["forecast_p50"] = pct_res["equated_score"] + trend * (df["years_extrapolated"] - 1).clip(lower=0)
    df["forecast_p50"] = df["forecast_p50"].clip(lower=5.0, upper=30.0)

    band_width = np.sqrt(df["years_extrapolated"]) * np.sqrt(shock_std**2 + idio_std**2)
    df["forecast_p10"] = (df["forecast_p50"] - Z90 * band_width).clip(lower=0.0)
    df["forecast_p90"] = (df["forecast_p50"] + Z90 * band_width).clip(upper=30.0)

    # Chỉ 1 năm dữ liệu -> không có xu hướng riêng của chương trình đó, biên
    # phải rộng hơn nữa để phản ánh đúng mức bất định (bản cũ coi mọi chương
    # trình như nhau bất kể có 1 năm hay 5 năm dữ liệu).
    thin = df["n_years"] <= 1
    df.loc[thin, "forecast_p10"] = (df.loc[thin, "forecast_p50"] - 1.5 * Z90 * band_width[thin]).clip(lower=0.0)
    df.loc[thin, "forecast_p90"] = (df.loc[thin, "forecast_p50"] + 1.5 * Z90 * band_width[thin]).clip(upper=30.0)

    # beta_program: chương trình có điểm chuẩn cao (cạnh tranh gắt) thường
    # nhạy hơn với cú sốc toàn quốc (điểm cao sát nhau, một chút biến động đề
    # thi đẩy thứ hạng thay đổi nhiều); chương trình điểm sàn thấp thường ít
    # nhạy hơn (đã dư chỉ tiêu, ít cạnh tranh). Hệ số 1.0 ở mức trung vị điểm
    # toàn quốc (~22), tăng/giảm tuyến tính quanh đó — ước lượng hợp lý, không
    # phải số đo, nhưng có cơ sở logic rõ ràng chứ không phải random.uniform.
    df["beta_program"] = (1.0 + (df["forecast_p50"] - 22.0) / 15.0).clip(lower=0.3, upper=2.0)
    df["idio_std"] = idio_std

    df.attrs["national_shock"] = shock
    return df


def run() -> pd.DataFrame:
    programs = pd.read_parquet(config.PROCESSED / "programs.parquet")
    from pipeline.clean.reconcile import prepare_cutoff_rows
    cutoff_panel = prepare_cutoff_rows(pd.read_parquet(config.INTERIM / "cutoff_panel_raw.parquet"))

    result = build_forecasts(programs, cutoff_panel)
    result.to_parquet(config.PROCESSED / "programs.parquet", index=False)

    shock = result.attrs["national_shock"]
    # Parquet drops DataFrame.attrs on save/load, so the shock estimate the
    # API needs at request time (national_shock_std, idio_std for
    # simulate.run_monte_carlo) is persisted separately rather than
    # recomputed from the raw panel on every server start.
    (config.PROCESSED / "national_shock.json").write_text(
        json.dumps(shock, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"features/build: dự báo cho {len(result):,} chương trình, "
          f"xu hướng toàn quốc trung vị={shock['overall_median']:+.2f}/năm, "
          f"độ lệch chuẩn cú sốc={shock['overall_std']}")
    print(f"features/build: forecast_p50 trung vị={result['forecast_p50'].median():.2f}, "
          f"biên p10-p90 trung vị={( result['forecast_p90']-result['forecast_p10']).median():.2f} điểm")
    if shock.get("warning"):
        print(f"  [!] {shock['warning']}")
    return result


if __name__ == "__main__":
    run()

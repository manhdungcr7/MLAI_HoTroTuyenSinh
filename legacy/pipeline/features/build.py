"""Dự báo điểm chuẩn năm tới cho mỗi chương trình.

QUY TẮC DỰ BÁO (đã được kiểm chứng bằng backtest, xem pipeline/features/backtest.py):
    forecast_p50 = điểm chuẩn thật của năm gần nhất có dữ liệu

Vì sao đơn giản như vậy: thử trên hai năm giữ lại (2024 và 2025) với dữ liệu hiện có, không cách nào
sai số trung bình thấp hơn "giữ nguyên điểm năm trước": cộng xu hướng toàn quốc, co về trung bình nhóm
ngành, trung bình hai năm gần nhất hay quy đổi bách phân vị đều không tốt hơn (hoặc tốt ở năm này
nhưng kém ở năm kia). Phần biến động còn lại là cú sốc chung của từng năm (đề dễ/khó) và nhiễu riêng
từng chương trình; hai thứ này được đo từ dữ liệu (common/national_shock.py) và đi vào độ rộng
của khoảng dự báo và vào công thức xác suất đỗ, không được giấu đi.

    độ rộng biên = sqrt(số_năm_từ_dữ_liệu_gần_nhất) × sqrt(shock_std² + idio_std²) × hệ_số_dữ_liệu_mỏng
    forecast_p10/p90 = p50 ∓ 1.2816 × độ rộng biên
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
from common.admission_core import FORECAST_YEAR  # noqa: E402
from common.national_shock import estimate_national_shock  # noqa: E402
from pipeline import config  # noqa: E402

Z90 = float(stats.norm.ppf(0.90))  # ≈1.2816
# Chương trình chỉ có 1 năm dữ liệu dao động mạnh hơn: đo trên hai năm giữ lại, độ lệch chuẩn sai số
# gấp 1.14 lần (2025) và 1.47 lần (2024) so với chương trình có từ 2 năm; lấy mức giữa.
THIN_DATA_MULTIPLIER = 1.3


def forecast_band(years_since_data: pd.Series | np.ndarray, thin: pd.Series | np.ndarray, shock_std: float, idio_std: float):
    """Độ rộng biên (1 độ lệch chuẩn) theo số năm kể từ dữ liệu gần nhất và độ mỏng của dữ liệu."""
    sigma = np.sqrt(np.maximum(1, years_since_data)) * np.sqrt(shock_std**2 + idio_std**2)
    return sigma * np.where(thin, THIN_DATA_MULTIPLIER, 1.0)


def build_forecasts(programs: pd.DataFrame, cutoff_panel: pd.DataFrame) -> pd.DataFrame:
    shock = estimate_national_shock(cutoff_panel)
    shock_std = shock["overall_std"]
    idio_std = shock.get("idio_std_overall", shock_std)

    df = programs.copy()
    df["years_extrapolated"] = (FORECAST_YEAR - df["latest_year"].fillna(FORECAST_YEAR - 1)).clip(lower=1)
    df["forecast_p50"] = df["latest_score"].astype(float).clip(lower=5.0, upper=30.0)

    sigma = forecast_band(df["years_extrapolated"].to_numpy(), (df["n_years"] <= 1).to_numpy(), shock_std, idio_std)
    df["forecast_p10"] = (df["forecast_p50"] - Z90 * sigma).clip(lower=0.0)
    df["forecast_p90"] = (df["forecast_p50"] + Z90 * sigma).clip(upper=30.0)

    df.attrs["national_shock"] = shock
    return df


def run() -> pd.DataFrame:
    programs = pd.read_parquet(config.PROCESSED / "programs.parquet")
    from pipeline.clean.reconcile import prepare_cutoff_rows
    cutoff_panel = prepare_cutoff_rows(pd.read_parquet(config.INTERIM / "cutoff_panel_raw.parquet"))

    result = build_forecasts(programs, cutoff_panel)
    result.to_parquet(config.PROCESSED / "programs.parquet", index=False)

    shock = result.attrs["national_shock"]
    # Parquet bỏ DataFrame.attrs khi lưu, nên ước lượng cú sốc được lưu riêng cho API và frontend.
    (config.PROCESSED / "national_shock.json").write_text(
        json.dumps(shock, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"features/build: dự báo cho {len(result):,} chương trình bằng điểm năm gần nhất; "
          f"độ lệch chuẩn cú sốc chung={shock['overall_std']}, nhiễu riêng={shock['idio_std_overall']}")
    print(f"features/build: biên p10-p90 trung vị={(result['forecast_p90'] - result['forecast_p10']).median():.2f} điểm")
    if shock.get("warning"):
        print(f"  [!] {shock['warning']}")
    return result


if __name__ == "__main__":
    run()

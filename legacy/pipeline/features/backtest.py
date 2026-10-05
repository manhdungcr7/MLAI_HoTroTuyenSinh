"""Kiểm định dự báo trên các năm đã biết, bằng đúng quy tắc đang chạy thật.

Quy tắc dự báo: điểm chuẩn năm tới = điểm chuẩn thật của năm gần nhất (xem pipeline/features/build.py).
Với mỗi năm giữ lại T (2024, 2025):
  - chỉ dùng dữ liệu các năm < T để dự báo và để ước lượng độ bất định (không rò rỉ),
  - đo sai số (MAE, RMSE) và độ phủ của khoảng dự báo 10–90% so với điểm chuẩn thật năm T,
  - đo độ chuẩn của xác suất đỗ: với học sinh giả định có điểm bằng dự báo + một mức lệch, so xác suất ứng dụng
    đưa ra (cùng hàm common.admission_core.admit_probability) với tỷ lệ thực tế có điểm chuẩn thấp hơn.
Kết quả ghi ở frontend/public/data/backtest.json và hiển thị ở trang "Cách tính".
"""

from __future__ import annotations

import json
import math
import sys
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd
from scipy import stats

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
from common import admission_core as core  # noqa: E402
from common.national_shock import estimate_national_shock  # noqa: E402
from pipeline.features.build import THIN_DATA_MULTIPLIER, forecast_band  # noqa: E402

PROCESSED = ROOT / "data" / "processed"
OUTPUT_JSON = ROOT / "frontend" / "public" / "data" / "backtest.json"
HOLDOUT_YEARS = (2024, 2025)
OFFSETS = (-3.0, -2.0, -1.0, 0.0, 1.0, 2.0, 3.0)
Z90 = float(stats.norm.ppf(0.90))
MODEL_VERSION = "2026.2-diem-nam-gan-nhat"


def _histories(df: pd.DataFrame) -> list[dict[int, float]]:
    out = []
    for raw in df["cutoff_by_year_json"]:
        try:
            cutoffs = {int(k): float(v) for k, v in json.loads(raw).items() if 12.0 <= float(v) <= 30.0}
        except (TypeError, ValueError):
            continue
        if cutoffs:
            out.append(cutoffs)
    return out


def _train_panel(histories: list[dict[int, float]], before: int) -> pd.DataFrame:
    rows = [
        {"school_code": "x", "major_label": str(i), "combinations": "", "cutoff_year": y, "score": s}
        for i, h in enumerate(histories)
        for y, s in h.items()
        if y < before
    ]
    return pd.DataFrame(rows)


def evaluate_holdout(histories: list[dict[int, float]], test_year: int) -> dict:
    records = []
    for h in histories:
        past = [y for y in h if y < test_year]
        if test_year in h and past:
            last = max(past)
            records.append((h[last], h[test_year], test_year - last, len(past), last))
    if len(records) < 30:
        return {"year": test_year, "n": len(records), "note": "Chưa đủ chương trình để kiểm định"}

    last_score = np.array([r[0] for r in records])
    actual = np.array([r[1] for r in records])
    gap = np.array([r[2] for r in records])
    n_hist = np.array([r[3] for r in records])
    latest = [r[4] for r in records]
    err = actual - last_score

    result: dict = {
        "year": test_year,
        "n": len(records),
        "mae": round(float(np.mean(np.abs(err))), 3),
        "rmse": round(float(np.sqrt(np.mean(err**2))), 3),
        "meanError": round(float(np.mean(err)), 3),
    }

    shock = estimate_national_shock(_train_panel(histories, test_year))
    shock_std, idio_std = shock.get("overall_std"), shock.get("idio_std_overall")
    if shock_std is None or idio_std is None or not (math.isfinite(shock_std) and math.isfinite(idio_std)):
        result["note"] = "Dữ liệu trước năm này chưa đủ để ước lượng độ bất định, chỉ báo sai số"
        return result

    sigma = forecast_band(gap, n_hist <= 1, shock_std, idio_std)
    inside = (actual >= last_score - Z90 * sigma) & (actual <= last_score + Z90 * sigma)
    result.update({
        "shockStd": round(float(shock_std), 3),
        "idioStd": round(float(idio_std), 3),
        "coverageP10P90Pct": round(float(inside.mean() * 100), 1),
        "meanBandWidth": round(float(np.mean(2 * Z90 * sigma)), 2),
    })

    # Độ chuẩn của xác suất đỗ: học sinh giả định có điểm = dự báo + mức lệch.
    scales = [
        core.sigma_scale_for(latest[i], int(n_hist[i]), forecast_year=test_year) for i in range(len(records))
    ]
    curve, squared = [], []
    for off in OFFSETS:
        predicted = np.array([
            core.admit_probability(last_score[i] + off, last_score[i], shock_std=shock_std, idio_std=idio_std, sigma_scale=scales[i])
            for i in range(len(records))
        ])
        observed = (actual <= last_score + off).astype(float)
        curve.append({"offset": off, "predicted": round(float(predicted.mean()), 3), "observed": round(float(observed.mean()), 3)})
        squared.append((predicted - observed) ** 2)
    result["calibration"] = curve
    result["brierScore"] = round(float(np.mean(np.concatenate(squared))), 4)
    result["calibrationGap"] = round(float(np.mean([abs(c["predicted"] - c["observed"]) for c in curve])), 3)
    return result


def run_backtest() -> dict:
    programs_path = PROCESSED / "programs.parquet"
    if not programs_path.is_file():
        raise FileNotFoundError(f"Missing {programs_path}")
    histories = _histories(pd.read_parquet(programs_path))

    holdouts = [evaluate_holdout(histories, y) for y in HOLDOUT_YEARS]
    payload = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "modelVersion": MODEL_VERSION,
        "forecastRule": "Điểm chuẩn năm tới = điểm chuẩn thật của năm gần nhất; khoảng dự báo và xác suất đỗ dùng độ bất định đo từ dữ liệu.",
        "thinDataMultiplier": THIN_DATA_MULTIPLIER,
        "holdouts": holdouts,
        "limitationsVi": [
            "Chỉ có vài năm dữ liệu liên tiếp nên ước lượng cú sốc chung giữa các năm còn rất thô.",
            "Chưa có cách nào thử được cho sai số thấp hơn việc giữ nguyên điểm năm trước; phần còn lại là cú sốc chung của từng năm, không dự đoán trước được.",
            "Mỗi năm giữ lại được kiểm định riêng: năm 2024 chưa đủ dữ liệu trước đó để ước lượng độ bất định.",
        ],
    }
    OUTPUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_JSON.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print("[OK] Backtest hoàn tất")
    for h in holdouts:
        extra = f" | phủ {h['coverageP10P90Pct']}% | Brier {h['brierScore']}" if "coverageP10P90Pct" in h else f" | {h.get('note', '')}"
        print(f"   {h['year']}: n={h['n']} MAE={h.get('mae')} RMSE={h.get('rmse')}{extra}")
    return payload


if __name__ == "__main__":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
    run_backtest()

"""Năm dự báo phải theo kịp mùa tuyển sinh đang diễn ra."""

from datetime import date

from common.admission_core import FORECAST_YEAR


def test_forecast_year_is_not_stale():
    """Kết quả tuyển sinh của một năm công bố khoảng tháng 8–9. Từ 1/9 của FORECAST_YEAR trở đi, năm dự báo
    phải chuyển sang năm sau (và dữ liệu điểm chuẩn mùa vừa xong cần được thêm vào pipeline)."""
    assert date.today() < date(FORECAST_YEAR, 9, 1), (
        f"FORECAST_YEAR={FORECAST_YEAR} đã cũ: cập nhật common/admission_core.py và "
        "frontend/src/engine/admissions/probability.ts, chọn năm thi trong Wizard, và nạp điểm chuẩn mùa mới."
    )

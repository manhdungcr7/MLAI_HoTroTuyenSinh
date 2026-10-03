# Quy tắc tính điểm riêng của từng trường

Mỗi trường một file `<MÃ TRƯỜNG>.json`. Chỉ đưa vào quy tắc đã **đối chiếu với văn bản gốc** của trường
(đề án tuyển sinh / thông báo công thức xét tuyển). Không suy đoán, không lấy từ trang tổng hợp.

```json
{
  "schoolCode": "ABC",
  "year": 2026,
  "source": { "url": "https://…/de-an-2026.pdf", "verifiedAt": "2026-10-03", "verifiedBy": "Tên người kiểm chứng" },
  "methods": {
    "THPT": {
      "priority": "standard",
      "components": [{ "source": "exam_combo", "weight": 1, "subjectWeights": { "toan": 2 } }],
      "certBonus": { "ielts": [{ "min": 5.5, "points": 1 }, { "min": 6.5, "points": 2 }] },
      "bonusCap": 3
    },
    "HOC_BA": {
      "priority": "standard",
      "components": [{ "source": "hocba_combo", "weight": 1, "grades": [11, 12] }]
    },
    "DGNL_HCM": {
      "priority": "standard",
      "components": [
        { "source": "dgnl_hcm", "weight": 0.55 },
        { "source": "exam_combo", "weight": 0.35 },
        { "source": "hocba_combo", "weight": 0.10 }
      ]
    }
  }
}
```

- `source`: `exam_combo`, `hocba_combo`, `dgnl_hcm` (thang 1200), `dgnl_hn` (thang 150), `dgtd_bk` (thang 100).
- Các `weight` của một phương thức cộng lại bằng 1. Kết quả luôn quy về thang 30.
- `grades` (chỉ học bạ): các lớp lấy trung bình; bỏ trống = điểm trung bình học sinh đã nhập.
- `minExamComboTotal`: ngưỡng tổng điểm thi gốc 3 môn (thang 30). `priority`: `standard` hoặc `none`.

Sau khi thêm: chạy `python scripts/validate_school_rules.py` và `pytest tests/backend/test_admission_core_parity.py`.
Lưu ý: so sánh với điểm chuẩn chỉ đúng khi dữ liệu điểm chuẩn của phương thức đó cùng thang 30.

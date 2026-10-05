# Quy tắc tính điểm riêng của từng trường

Mỗi trường một file `<MÃ TRƯỜNG>.json`. Chỉ đưa vào quy tắc **đã đối chiếu từng con số với văn bản gốc** của trường
(thông tin tuyển sinh / đề án). Không suy đoán, không lấy từ trang tổng hợp, không dùng bản tóm tắt tự động.

Trường chưa có file dùng công thức chung: tổng điểm 3 môn của tổ hợp (không hệ số) hoặc trung bình cả năm lớp 10–11–12
của 3 môn, cộng ưu tiên theo quy chế (giảm dần từ 22,5 điểm, tối đa 3 điểm), **không quy đổi IELTS** (nhiều trường không
cho dùng chứng chỉ thay điểm thi, và mỗi trường quy đổi khác nhau).

## Cách thêm một trường

```powershell
python scripts/extract_dean_text.py DQN                      # trích văn bản đề án 2026 của trường
python scripts/extract_dean_text.py --grep "IELTS|ngưỡng" DQN # tìm đoạn cần đọc
# tạo frontend/src/data/school-rules/DQN.json (mẫu bên dưới)
python scripts/build_rules_index.py                          # sinh lại index.ts
python scripts/validate_school_rules.py                      # kiểm tra cấu trúc
cd frontend; npm test; cd ..; python -m pytest -q tests/backend/test_admission_core_parity.py
```

PDF dạng ảnh cho văn bản rỗng: đọc trực tiếp ảnh trang hoặc OCR rồi đối chiếu bằng mắt.

## Mẫu

```json
{
  "schoolCode": "ABC",
  "year": 2026,
  "source": {
    "url": "https://…/thong-tin-tuyen-sinh-2026.pdf",
    "document": "Tên văn bản",
    "sha256": "mã băm file PDF đã đối chiếu",
    "verifiedAt": "2026-10-03",
    "verifiedBy": "Người đối chiếu và ghi chú mục đã đọc"
  },
  "methods": {
    "THPT": {
      "priority": "standard",
      "components": [{ "source": "exam_combo", "weight": 1, "subjectWeights": { "toan": 2 } }],
      "allowedCombinations": ["A00", "A01", "D01", "D07"],
      "ieltsToEnglish": [{ "min": 5.5, "score": 8.0 }, { "min": 6.5, "score": 9.0 }],
      "certBonus": { "ielts": [{ "min": 6.5, "points": 0.75 }], "excludedMajorGroups": ["su_pham"] },
      "bonusCap": 3
    },
    "HOC_BA": {
      "priority": "standard",
      "components": [{ "source": "hocba_combo", "weight": 1, "grades": [11, 12] }],
      "minHocBaComboTotal": 18.0
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

| Trường | Ý nghĩa |
|---|---|
| `components` | Thành phần điểm học lực, tỷ trọng cộng lại bằng 1, quy về thang 30. Nguồn: `exam_combo`, `hocba_combo`, `dgnl_hcm` (thang 1200), `dgnl_hn` (150), `dgtd_bk` (100). |
| `subjectWeights` | Hệ số từng môn (ví dụ Toán nhân 2). |
| `grades` | Học bạ chỉ lấy một số lớp; bỏ trống là trung bình ba năm học sinh đã nhập. |
| `allowedCombinations` | Tổ hợp trường nhận khi đề án không ghi tổ hợp từng ngành. |
| `ieltsToEnglish` | Bảng quy đổi IELTS sang điểm môn Tiếng Anh do chính trường công bố; không có bảng thì không quy đổi. |
| `certBonus` | Điểm thưởng IELTS (cộng sau điểm học lực), có thể loại nhóm ngành. |
| `scoreFactor` | Hệ số quy đổi nhân vào điểm học lực khi trường quy đổi phương thức về thang chung. |
| `minExamComboTotal`, `minHocBaComboTotal` | Ngưỡng đầu vào riêng (tổng 3 môn, thang 30, không hệ số). |
| `majorGroupOverrides` | Ngoại lệ theo nhóm ngành (`majorGroup`), ghi đè lên quy tắc chung của phương thức, ví dụ ngành Ngôn ngữ không nhân hệ số Toán: `"majorGroupOverrides": { "ngon_ngu": { "components": [...] } }`. |
| `priority` | `standard` hoặc `none` nếu trường không cộng ưu tiên cho phương thức này. |
| `unsupportedReason` | Trường chưa công bố cách quy đổi: phương thức này không được tính, thay vì đoán. |

**Điểm chuẩn phải cùng thang với cách tính.** Khi trường đổi thang hoặc công thức giữa các năm, điểm chuẩn năm cũ trong dữ liệu
không so được với điểm tính theo công thức mới; trong trường hợp đó dùng `unsupportedReason` hoặc cập nhật dữ liệu điểm chuẩn.

## Đã nhập (đối chiếu từ thông tin tuyển sinh 2026)

DBL, DDT, DPQ, DQN, DTL, GHA, GSA, GTA, KHA, SPD, TCT, TDV, TTN, XDT. Các trường khác dùng công thức chung.
Chưa có file PDF 2026 trong kho dữ liệu: PKA, DDK, IUH, TMU. PDF dạng ảnh cần đọc tay: TDM, TSN, TLA, DCT, BVH, SPH và các trường khác.

Trường đã đọc nhưng chưa nhập vì cách tính khác nhau theo từng ngành (cần bảng ngành → hệ số, hiện khung chỉ ghi đè theo nhóm ngành):
DKK (hệ số 4.5/3.5/2 theo thứ tự môn), NTH (chương trình tích hợp thang 40, môn nhân 1,5), NHH, DDP, YDS, DHY.

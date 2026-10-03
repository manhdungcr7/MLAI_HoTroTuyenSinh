IELTS = {"ielts": B((5.0, 0.5), (5.5, 0.75), (6.0, 1.0), (6.5, 1.25), (7.0, 1.5))}
SPECS = {"DTL": {
  "doc": "Thông tin tuyển sinh đại học năm 2026 – Trường Đại học Thăng Long",
  "note": "Mục 2.1: ngành có môn hệ số 2 (khoa học máy tính, hệ thống thông tin, công nghệ thông tin, trí tuệ nhân tạo: Toán) tính (Toán×2 + 2 môn)×3/4, các ngành khác tổng 3 môn; mục 5.2: điểm khuyến khích IELTS 5.0→0.5 … ≥7.0→1.5. Quy đổi IELTS thành điểm môn Tiếng Anh chỉ thuộc phương thức 2 (kết hợp) nên không áp dụng cho thi THPT. Nhóm CNTT trong dữ liệu có thêm ngành Mạng máy tính (không có trong bảng ngành hệ số 2 của đề án) nên kết quả ngành này có thể lệch.",
  "methods": {"THPT": {"priority": "standard", "components": COMP_EXAM, "certBonus": IELTS,
     "majorGroupOverrides": {"cntt": {"components": [{"source": "exam_combo", "weight": 1, "subjectWeights": {"toan": 2}}]}}}}}}

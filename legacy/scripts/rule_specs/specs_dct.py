IT = T((4.0, 6.0), (4.5, 7.0), (5.5, 8.0), (6.5, 9.0), (8.0, 10))
TF = T((40, 6.0), (45, 7.0), (60, 8.0), (79, 9.0), (102, 10))
SPECS = {"DCT": {"doc": "Thông tin tuyển sinh đại học năm 2026 – Trường Đại học Công Thương TP.HCM (bản ảnh, đọc trực tiếp các trang 5–9)",
  "note": "Điểm xét tuyển = tổng 3 môn của tổ hợp; chứng chỉ IELTS/TOEFL iBT quy đổi thay điểm môn Tiếng Anh cho phương thức thi THPT và học bạ (IELTS 4,0→6; 4,5–5,0→7; 5,5–6,0→8; 6,5–7,5→9; ≥8,0→10; TOEFL iBT 40–44→6; 45–59→7; 60–78→8; 79–101→9; ≥102→10); học bạ cần tổng 3 môn từ 20,00 (Toán và Ngữ văn từ 6,0 chưa mã hóa). Cột điểm 10 của bảng bị cắt mép ảnh nên mức ≥8,0 và ≥102 suy từ quy luật bảng.",
  "methods": {
    "THPT": {"priority": "standard", "components": COMP_EXAM, "ieltsToEnglish": IT, "toeflToEnglish": TF},
    "HOC_BA": {"priority": "standard", "components": COMP_HB, "minHocBaComboTotal": 20.0, "ieltsToEnglish": IT, "toeflToEnglish": TF}}}}

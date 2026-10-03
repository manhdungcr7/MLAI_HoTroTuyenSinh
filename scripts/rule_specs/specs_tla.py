LANG = {"name:ngon ngu anh": {"components": [{"source": "exam_combo", "weight": 1, "subjectWeights": {"toan": 2, "anh": 2}}]}}
LANG_HB = {"name:ngon ngu anh": {"components": [{"source": "hocba_combo", "weight": 1, "subjectWeights": {"toan": 2, "anh": 2}}]}}
SPECS = {"TLA": {"doc": "Thông tin tuyển sinh đại học chính quy năm 2026 – Trường Đại học Thủy lợi (bản ảnh, đọc trực tiếp trang 11–13)",
  "note": "Mục 2.2–2.3: điểm = M1+M2+M3 (+ưu tiên); riêng Ngôn ngữ Anh (M1 Toán, M2 Tiếng Anh, M3 môn còn lại) tính (M1×2 + M2×2 + M3)×3/5. Phương thức học bạ: trung bình 3 năm, cộng điểm giải học sinh giỏi cấp tỉnh (nhất 1,00; nhì 0,75; ba 0,50; khuyến khích 0,25 chưa mã hóa) và chứng chỉ IELTS 5,0→0,2 … ≥7,0→1,0; TOEFL iBT 60–64→0,2 … ≥79→1,0. Ngôn ngữ Trung Quốc (M2 ngoại ngữ ×2) chưa mã hóa vì tổ hợp tiếng Trung chưa có trong ứng dụng.",
  "methods": {
    "THPT": {"priority": "standard", "components": COMP_EXAM, "majorGroupOverrides": LANG},
    "HOC_BA": {"priority": "standard", "components": COMP_HB, "majorGroupOverrides": LANG_HB,
      "awardBonus": {"tinh_nhat": 1.0, "tinh_nhi": 0.75, "tinh_ba": 0.5},
      "certBonus": {"ielts": B((5.0, 0.2), (5.5, 0.4), (6.0, 0.6), (6.5, 0.8), (7.0, 1.0)), "toefl": B((60, 0.2), (65, 0.4), (70, 0.6), (75, 0.8), (79, 1.0))}}}}}

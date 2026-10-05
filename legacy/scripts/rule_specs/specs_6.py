EXAM = lambda w: [{"source": "exam_combo", "weight": 1, "subjectWeights": w}]
HB = lambda w: [{"source": "hocba_combo", "weight": 1, "subjectWeights": w}]
NHH_BONUS_I = B((5.5, 0.5), (6.0, 0.75), (6.5, 1.0), (7.0, 1.25), (7.5, 1.5))
NHH_BONUS_T = B((46, 0.5), (60, 0.75), (79, 1.0), (94, 1.25), (102, 1.5))
yds_toefl = [{"min": t, "points": round(0.9 * t / 120, 3)} for t in range(80, 121)]
yds_ielts = [{"min": i / 2, "points": round(0.9 * (i / 2) / 9, 3)} for i in range(12, 19)]
SPECS = {
 "NHH": {"doc": "Thông tin tuyển sinh đại học chính quy năm 2026 – Học viện Ngân hàng",
   "note": "Mục 2.2–2.4: điểm = (môn chính×2 + môn 2 + môn 3)×3/4 (môn chính là Toán, riêng nhóm Luật là Ngữ văn theo bảng chương trình); chứng chỉ IELTS/TOEFL iBT dùng quy đổi thay điểm Tiếng Anh HOẶC lấy điểm khuyến khích 0,5–1,5, không dùng cả hai (mục 5.b). Học bạ chỉ lấy điểm khuyến khích vì bảng quy đổi học bạ chưa công bố.",
   "methods": {
     "THPT": {"priority": "standard", "components": EXAM({"toan": 2}), "certMode": "either",
              "ieltsToEnglish": T((5.5, 8.5), (6.0, 9.0), (6.5, 9.5), (7.0, 9.75), (7.5, 10)),
              "toeflToEnglish": T((46, 8.5), (60, 9.0), (79, 9.5), (94, 9.75), (102, 10)),
              "certBonus": {"ielts": NHH_BONUS_I, "toefl": NHH_BONUS_T},
              "majorGroupOverrides": {"luat": {"components": EXAM({"van": 2})}}},
     "HOC_BA": {"priority": "standard", "components": HB({"toan": 2}),
                "certBonus": {"ielts": NHH_BONUS_I, "toefl": NHH_BONUS_T},
                "majorGroupOverrides": {"luat": {"components": HB({"van": 2})}}}}},
 "YDS": {"doc": "Thông tin tuyển sinh đại học năm 2026 – Đại học Y Dược TP.HCM",
   "note": "Mục 6.2.2: tổng 3 môn không nhân hệ số + ưu tiên + điểm khuyến khích; chứng chỉ chọn một trong IELTS (≥6,0) hoặc TOEFL iBT (≥80): 0,9×IELTS/9 hoặc 0,9×TOEFL/120, tối đa 1,5. Chưa mã hóa điểm SAT.",
   "methods": {"THPT": {"priority": "standard", "components": COMP_EXAM, "certBonus": {"ielts": yds_ielts, "toefl": yds_toefl}}}},
 "DHY": {"doc": "Thông tin tuyển sinh đại học năm 2026 – Trường Đại học Y Dược, Đại học Huế",
   "note": "Mục 3.1: IELTS/TOEFL iBT quy đổi thay điểm thi Tiếng Anh (IELTS 5,5→8,5; 6,0→9; 6,5→9,5; ≥7,0→10; TOEFL iBT 46–59→8,5; 60–78→9; 79–93→9,5; ≥94→10); riêng Y khoa, Răng - Hàm - Mặt, Dược học chỉ nhận từ IELTS 6,5 hoặc TOEFL 79. Mức IELTS 5,0 và TOEFL 35–45 ghi trong bảng nhưng điều kiện nêu từ 5,5 và 46 nên không mã hóa (thận trọng).",
   "methods": {"THPT": {"priority": "standard", "components": COMP_EXAM,
      "ieltsToEnglish": T((5.5, 8.5), (6.0, 9.0), (6.5, 9.5), (7.0, 10)),
      "toeflToEnglish": T((46, 8.5), (60, 9.0), (79, 9.5), (94, 10)),
      "majorGroupOverrides": {k: {"ieltsToEnglish": T((6.5, 9.5), (7.0, 10)), "toeflToEnglish": T((79, 9.5), (94, 10))} for k in ("name:y khoa", "name:rang - ham - mat", "name:duoc hoc")}}}},
}

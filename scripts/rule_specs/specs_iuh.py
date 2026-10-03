SPECS = {"IUH": {"url": "https://cdn.tuyensinh247.com/picture/2026/0710/867-thongbao-tuyensinh-2026.pdf",
  "doc": "Thông báo số 867/TB-ĐHCN tuyển sinh đại học hệ chính quy năm 2026 – Trường Đại học Công nghiệp TP.HCM (bản ảnh, đọc trực tiếp trang 1 và Phụ lục 2 trang 11)",
  "note": "Mục 3.1.2: điểm xét = Max(XT1, XT2, XT3); XT2 = tổng 3 môn thi + ưu tiên + điểm cộng (đã mã hóa); XT1 = 0,7×điểm thi + 0,3×học bạ lớp 12 và XT3 (ĐGNL) chưa mã hóa. Phụ lục 2: IELTS dùng một trong hai cách: cộng khuyến khích (4,5→0,50; 5,0→0,75; 5,5→1,00; 6,0→1,25; ≥6,5→1,50) hoặc quy đổi môn Tiếng Anh (4,5→8,0; 5,0→8,5; 5,5→9,0; 6,0→9,5; ≥6,5→10); TOEFL iBT quy về IELTS: 38→4,5; 45→5,0; 46–59→5,5; 70→6,0; 93→6,5.",
  "methods": {"THPT": {"priority": "standard", "components": COMP_EXAM, "certMode": "either",
     "ieltsToEnglish": T((4.5, 8.0), (5.0, 8.5), (5.5, 9.0), (6.0, 9.5), (6.5, 10)),
     "toeflToEnglish": T((38, 8.0), (45, 8.5), (46, 9.0), (70, 9.5), (93, 10)),
     "certBonus": {"ielts": B((4.5, 0.5), (5.0, 0.75), (5.5, 1.0), (6.0, 1.25), (6.5, 1.5)), "toefl": B((38, 0.5), (45, 0.75), (46, 1.0), (70, 1.25), (93, 1.5))}}}}}

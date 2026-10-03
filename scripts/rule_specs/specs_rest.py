def approx(doc, note, reason, methods=("THPT",)):
    comp = {"THPT": COMP_EXAM, "HOC_BA": COMP_HB}
    return {"doc": doc, "note": note, "methods": {m: {"priority": "standard", "components": comp[m], "approximateReason": reason} for m in methods}}
SPECS = {
 "SPS": {"doc": "Thông tin tuyển sinh đại học năm 2026 – Trường Đại học Sư phạm TP.HCM",
   "note": "Xét điểm thi THPT: ĐXT = ĐM1 + ĐM2 + ĐM3 + ĐUT (điểm từng môn thang 10), trùng công thức chung. Phương thức học bạ kết hợp ĐGNL chuyên biệt ((0,5×ĐMC + 0,35×ĐHB1 + 0,15×ĐHB2)×3) chưa mã hóa.",
   "methods": {"THPT": {"priority": "standard", "components": COMP_EXAM}}},
 "SP2": {"doc": "Thông tin tuyển sinh đại học năm 2026 – Trường Đại học Sư phạm Hà Nội 2",
   "note": "Điểm xét = Môn 1 + Môn 2 + Môn 3 + ĐƯT; học bạ: trung bình (lớp 10 + 11 + 12)/3 của từng môn, chỉ áp dụng một số ngành; chứng chỉ ngoại ngữ quy đổi theo Bảng 1 chưa mã hóa. Trùng công thức chung.",
   "methods": {"THPT": {"priority": "standard", "components": COMP_EXAM}, "HOC_BA": {"priority": "standard", "components": COMP_HB}}},
 "XDA": approx("Thông tin tuyển sinh đại học năm 2026 – Trường Đại học Xây dựng Hà Nội",
   "Mục 5.1.3 và 5.2.3: tổ hợp thường tính tổng 3 môn + điểm cộng + ưu tiên; tổ hợp có môn Vẽ mỹ thuật (V00, V01, V02, V06, V10) tính (Toán×2 hoặc Vẽ×2, ghi không thống nhất giữa hai chỗ) × 3/4. Chưa mã hóa phần có môn Vẽ và bảng quy đổi IELTS.",
   "Tổ hợp có môn Vẽ mỹ thuật được trường quy đổi theo hệ số riêng (văn bản ghi hai cách khác nhau) nên điểm các ngành đó chỉ là ước lượng; hãy tính lại theo đề án.", ("THPT", "HOC_BA")),
 "DDS": approx("Thông tin tuyển sinh đại học năm 2026 – Trường Đại học Sư phạm, Đại học Đà Nẵng",
   "Phương thức kết hợp: ĐXT = Đ1_THPT×X + Đ1_HB×Y + điểm cộng + ưu tiên (X = 0,7 ngành giáo viên, 0,6 ngành khác; Y là phần còn lại); chưa mã hóa.",
   "Trường xét kết hợp điểm thi THPT và điểm học bạ theo tỷ trọng (0,6/0,4 hoặc 0,7/0,3), ứng dụng chưa mã hóa nên điểm của bạn chỉ là ước lượng; hãy tính lại theo đề án."),
}

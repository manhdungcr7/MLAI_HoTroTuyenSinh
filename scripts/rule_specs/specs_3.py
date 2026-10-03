SPECS = {
 "DKK": {"doc": "Thông tin tuyển sinh đại học năm 2026 – Trường Đại học Kinh tế - Kỹ thuật Công nghiệp",
   "note": "Mục 4.2.2: ĐPT2 = (M1×4,5 + M2×3,5 + M3×2)×3/10, thứ tự môn M1, M2, M3 theo từng nhóm tổ hợp của ngành. Ứng dụng chưa mã hóa hệ số theo thứ tự môn nên điểm tính theo công thức chung và được đánh dấu ước lượng.",
   "methods": {
     "THPT": {"priority": "standard", "components": COMP_EXAM, "approximateReason": "Trường tính điểm theo hệ số 4,5 / 3,5 / 2 cho môn thứ nhất, thứ hai, thứ ba của tổ hợp (thứ tự khác nhau theo nhóm ngành), ứng dụng chưa mã hóa nên điểm của bạn chỉ là ước lượng; hãy tính lại theo đề án."},
     "HOC_BA": {"priority": "standard", "components": COMP_HB, "approximateReason": "Trường tính điểm theo hệ số riêng theo thứ tự môn của tổ hợp, ứng dụng chưa mã hóa nên điểm của bạn chỉ là ước lượng; hãy tính lại theo đề án."}}},
 "DDP": {"doc": "Thông tin tuyển sinh đại học năm 2026 – Trường Đại học Sư phạm Kỹ thuật, Đại học Đà Nẵng",
   "note": "Điểm xét tuyển = tổng điểm 3 môn thuộc tổ hợp (không nhân hệ số) quy về thang 30 + ưu tiên; học bạ dùng trung bình cả năm lớp 10, 11, 12 của 3 môn, môn ngoại ngữ là Tiếng Anh chính. Trùng công thức chung nhưng đã đối chiếu văn bản.",
   "methods": {"THPT": {"priority": "standard", "components": COMP_EXAM}, "HOC_BA": {"priority": "standard", "components": COMP_HB}}},
 "NTH": {"doc": "Thông tin tuyển sinh đại học năm 2026 – Trường Đại học Ngoại thương (cơ sở phía Bắc)",
   "note": "Chương trình tiêu chuẩn, ĐHNN&PTQT và Luật dân sự: M1 + M2 + M3 + điểm ưu tiên, điểm thưởng; học bạ lấy trung bình cả năm lớp 10, 11, 12. Các chương trình tích hợp có môn nhân hệ số trên thang 40 không nằm trong dữ liệu nên không mã hóa. Chứng chỉ ngoại ngữ chỉ dùng cho phương thức kết hợp riêng.",
   "methods": {"THPT": {"priority": "standard", "components": COMP_EXAM}, "HOC_BA": {"priority": "standard", "components": COMP_HB}}},
}

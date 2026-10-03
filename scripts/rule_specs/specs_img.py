def approx(doc, note, reason):
    return {"doc": doc, "note": note, "methods": {"THPT": {"priority": "standard", "components": COMP_EXAM, "approximateReason": reason}}}
SPECS = {
 "NHF": approx("Thông tin tuyển sinh đại học năm 2026 – Trường Đại học Hà Nội (bản ảnh, đọc qua nhận dạng chữ trang 2)",
   "Quy tắc tính điểm: môn ngoại ngữ nhân hệ số 2, và tùy ngành Toán hoặc Ngữ văn nhân hệ số 2; tổng tối đa 50 điểm quy đổi về thang 40; ngưỡng đầu vào 22 điểm. Chưa mã hóa vì chưa đối chiếu được bảng ngành; điểm tính theo công thức chung.",
   "Trường nhân hệ số 2 cho môn ngoại ngữ (và Toán hoặc Ngữ văn tùy ngành) rồi quy về thang 40; ứng dụng chưa mã hóa nên điểm của bạn chỉ là ước lượng, hãy tính lại theo đề án."),
 "HHK": approx("Thông tin tuyển sinh đại học năm 2026 – Học viện Hàng không Việt Nam (bản ảnh, đọc qua nhận dạng chữ trang 4)",
   "Điểm xét tuyển = (môn thứ nhất×3 + môn thứ hai×2 + môn thứ ba)/2 + điểm cộng + ưu tiên, thang 30, thứ tự môn theo nhóm mã tổ hợp của từng ngành. Chưa mã hóa vì chưa đối chiếu bảng nhóm tổ hợp.",
   "Trường tính (môn 1 × 3 + môn 2 × 2 + môn 3) / 2 theo thứ tự môn của từng nhóm tổ hợp; ứng dụng chưa mã hóa nên điểm của bạn chỉ là ước lượng, hãy tính lại theo đề án."),
 "SPH": approx("Thông tin tuyển sinh đại học năm 2026 – Trường Đại học Sư phạm Hà Nội (bản ảnh, đọc trực tiếp trang 5)",
   "Mục III-1.3: điểm xét thang 30; tổ hợp gốc của ngành không nhân hệ số, tổ hợp khác quy đổi theo hệ số riêng (chưa mã hóa).",
   "Chỉ tổ hợp gốc của ngành được tính không nhân hệ số; các tổ hợp khác trường quy đổi theo hệ số riêng, ứng dụng chưa mã hóa nên điểm của bạn có thể lệch; hãy tính lại theo đề án."),
}

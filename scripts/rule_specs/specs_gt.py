ENG = {"ngon_ngu": {"components": COMP_EXAM}}
ENG_HB = {"ngon_ngu": {"components": COMP_HB}}
IELTS = {"ielts": B((5.0, 0.5), (5.5, 0.75), (6.0, 1.0), (6.5, 1.25), (7.0, 1.5))}
TOAN2 = lambda src: [{"source": src, "weight": 1, "subjectWeights": {"toan": 2}}]
def spec(doc, note):
    return {"doc": doc, "note": note, "methods": {
        "THPT": {"priority": "standard", "components": TOAN2("exam_combo"), "certBonus": IELTS, "majorGroupOverrides": ENG},
        "HOC_BA": {"priority": "standard", "components": TOAN2("hocba_combo"), "certBonus": IELTS, "majorGroupOverrides": ENG_HB}}}
SPECS = {
 "GHA": spec("Thông tin tuyển sinh đại học năm 2026 – Trường Đại học Giao thông vận tải (trụ sở Hà Nội)",
   "Mục 2.1–2.2: điểm xét tuyển = (Toán×2 + hai môn còn lại)×3/4, riêng Ngôn ngữ Anh không nhân hệ số; mục 5.3: điểm cộng IELTS 5.0→0.5 … ≥7.0→1.5. Chưa mã hóa điều kiện học bạ (không môn nào dưới 5,5 mỗi năm, thi Toán ≥5)."),
 "GSA": spec("Thông tin tuyển sinh đại học năm 2026 – Trường Đại học Giao thông vận tải (phân hiệu TP.HCM)",
   "Mục 1.1.1–1.1.2: Toán nhân 2 (trừ Ngôn ngữ Anh); mục 2.2: điểm cộng IELTS 5.0→0.5 … ≥7.0→1.5. Chưa mã hóa điều kiện học bạ (không môn nào dưới 5,5 mỗi năm, thi Toán ≥5)."),
}

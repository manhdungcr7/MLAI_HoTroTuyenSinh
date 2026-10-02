"""Chuẩn hoá phương thức xét tuyển từ chuỗi thô trong đề án.

Điểm chuẩn của các phương thức khác nhau (thi THPT, học bạ, ĐGNL, năng khiếu...)
không so sánh được với nhau. Trộn chúng rồi lấy trung vị làm sai lệch dự báo,
nên mỗi dòng phải được gắn đúng một mã phương thức trước khi gộp theo chương trình.

Mã số theo danh mục phương thức của Bộ GD&ĐT: 100 thi THPT, 200 học bạ, 30x tuyển
thẳng/ưu tiên, 40x phương thức khác/kết hợp, 500 phương thức khác. Chuỗi không đủ
căn cứ (số rời, mã tổ hợp, tên ngành bị lệch cột, "PT2" do trường tự đánh số)
trả về UNKNOWN thay vì đoán.
"""

from __future__ import annotations

import re
import unicodedata

THPT = "THPT"
HOC_BA = "HOC_BA"
DGNL_HN = "DGNL_HN"      # HSA - ĐHQG Hà Nội
DGNL_HCM = "DGNL_HCM"    # V-ACT - ĐHQG TP.HCM
DGNL_SP = "DGNL_SP"      # SPT - ĐHSP Hà Nội
DGTD = "DGTD"            # TSA - ĐH Bách khoa Hà Nội
DGNL_KHAC = "DGNL_KHAC"
NANG_KHIEU = "NANG_KHIEU"
KET_HOP = "KET_HOP"
UU_TIEN = "UU_TIEN"
RIENG = "RIENG"
KHAC = "KHAC"
UNKNOWN = "UNKNOWN"

METHOD_LABELS_VI = {
    THPT: "Điểm thi tốt nghiệp THPT",
    HOC_BA: "Học bạ THPT",
    DGNL_HN: "ĐGNL ĐHQG Hà Nội (HSA)",
    DGNL_HCM: "ĐGNL ĐHQG TP.HCM (V-ACT)",
    DGNL_SP: "ĐGNL ĐHSP Hà Nội (SPT)",
    DGTD: "Đánh giá tư duy Bách khoa (TSA)",
    DGNL_KHAC: "Đánh giá năng lực (khác)",
    NANG_KHIEU: "Kết hợp thi năng khiếu",
    KET_HOP: "Kết hợp chứng chỉ / nhiều tiêu chí",
    UU_TIEN: "Tuyển thẳng / ưu tiên xét tuyển",
    RIENG: "Tuyển sinh riêng của trường",
    KHAC: "Phương thức khác",
    UNKNOWN: "Chưa xác định phương thức",
}

_CODE_MAP = {
    "100": THPT, "200": HOC_BA,
    "301": UU_TIEN, "302": UU_TIEN, "303": UU_TIEN,
    "401": DGNL_KHAC, "402": DGNL_KHAC,
    "405": NANG_KHIEU, "406": NANG_KHIEU,
    "407": KET_HOP, "408": KET_HOP, "409": KET_HOP, "410": KET_HOP,
    "411": KET_HOP, "415": KET_HOP, "416": KET_HOP, "417": KET_HOP,
    "500": KHAC,
}

_COMBO_ONLY = re.compile(r"^[\(\s]*([A-DXHKMNRSTV]\d{2}[\s,;]*)+[\)\s]*$", re.I)
_NUMERIC_ONLY = re.compile(r"^[\d\s,.\-–;]+$")


def _norm(text: object) -> str:
    if text is None or (isinstance(text, float) and text != text):
        return ""
    s = unicodedata.normalize("NFC", str(text)).lower()
    return re.sub(r"\s+", " ", s).strip()


def _from_codes(s: str) -> str | None:
    codes = re.findall(r"(?<!\d)(\d{3})(?!\d)", s)
    known = [c for c in codes if c in _CODE_MAP]
    if not known or len(known) < len(codes):
        return None
    # Một ngưỡng điểm áp dụng cho nhiều phương thức (vd "100, 200, 301"): ngưỡng ở
    # thang điểm thi THPT nên quy về THPT khi có mã 100 trong danh sách.
    if "100" in known:
        return THPT
    return _CODE_MAP[known[0]]


def normalize_method(raw_method: object, label: object = None) -> str:
    """Trả về mã phương thức chuẩn cho một dòng điểm chuẩn."""
    s = _norm(raw_method)
    lab = _norm(label)

    if s:
        # Chuỗi liệt kê nhiều phương thức ("- PT1: ... - PT2: ...") thuộc về phương thức đầu.
        s = re.split(r"\s-\s?pt\s?2\b", s)[0]
        coded = _from_codes(s)
        if coded:
            return coded
        if _NUMERIC_ONLY.match(s) or _COMBO_ONLY.match(s):
            return UNKNOWN

        if "năng khiếu" in s or re.search(r"\bnk\b", s) or s in {"khhb", "khđt"}:
            return NANG_KHIEU
        if "tuyển sinh riêng" in s or "thang điểm 300" in s or "thi tuyển" in s:
            return RIENG
        if any(k in s for k in ("tuyển thẳng", "ưu tiên xét tuyển", "học sinh giỏi", "cử tuyển",
                                 "dự bị đại học", "người nước ngoài", "lưu học sinh", "khuyết tật")) \
                or re.search(r"\bxtt\b", s):
            return UU_TIEN
        if "đgtd" in s or "tư duy" in s:
            return DGTD
        if "đgnl" in s or "đánh giá năng lực" in s or re.search(r"\bnl\b", s) or "v-sat" in s \
                or "thang điểm 1200" in s:
            if "đhsp" in s or "sư phạm" in s:
                return DGNL_SP
            if "hcm" in s or "hồ chí minh" in s or "1200" in s:
                return DGNL_HCM
            if "đhqghn" in s or "hà nội" in s or "hsa" in s:
                return DGNL_HN
            return DGNL_KHAC
        if "chứng chỉ" in s or "cc tiếng anh" in s or "quốc tế" in s or "ielts" in s:
            return KET_HOP
        if "kết hợp" in s or ("học bạ" in s and "điểm thi" in s):
            return KET_HOP
        if ("học bạ" in s or "hoc ba" in s or re.search(r"\bhb\b", s) or "học tập" in s
                or "khhb" in s or s == "bạ" or s.startswith("xét học") or "tbc học tập" in s):
            return HOC_BA
        if any(k in s for k in ("thpt", "tốt nghiệp", "điểm thi", "thi qg", "kq thi", "toán*2",
                                 "ngữ văn*2", "toán *2")):
            return THPT
        return UNKNOWN

    if re.search(r"\b(hb|học bạ)\b", lab):
        return HOC_BA
    if re.search(r"\b(đgnl|nl)\b", lab):
        return DGNL_KHAC
    return UNKNOWN

"""
MODULE: CANONICAL PROGRAM IDENTITY & ENTITY RESOLUTION (P0 SSOT)
Chuẩn hóa khóa định danh thực thể tuyển sinh, quản trị bí danh (Aliases)
và giải quyết bài toán đa biến thể tên ngành/trường tại Việt Nam.

Canonical Identity Specification:
    Canonical_Program_ID = institution_code:campus_code:program_code:admission_method_code

Ví dụ:
    BKA:MAIN:IT1:100  -> ĐH Bách Khoa Hà Nội, Trụ sở chính, CNTT (IT1), Thi THPT
    UEH:VLG:7340101:200 -> ĐH Kinh tế TP.HCM, Phân hiệu Vĩnh Long, QTKD, Xét học bạ
"""

import re
import unicodedata
from typing import Optional, Dict, Any, List


def remove_vietnamese_diacritics(text: str) -> str:
    """Loại bỏ dấu tiếng Việt để phục vụ so khớp và tìm kiếm nhị phân/fuzzy."""
    if not text:
        return ""
    text = text.replace('đ', 'd').replace('Đ', 'd')
    text = unicodedata.normalize('NFD', text)
    text = re.sub(r'[\u0300-\u036f]', '', text)
    return text.lower().strip()


def sanitize_program_label(raw_label: str) -> str:
    """Lọc rác OCR, loại bỏ mã phương thức xét tuyển và ký tự thừa trong tên ngành."""
    if not raw_label:
        return ""
    
    text = raw_label.strip()
    
    # Loại bỏ mã phương thức thường dính vào tên: pt1, pt2, pt100, pt402...
    text = re.sub(r'\bpt\s*\d+\b', '', text, flags=re.IGNORECASE)
    # Loại bỏ số thứ tự cột bảng biểu rác: (1) (2) (3) (4) (5) (6)...
    text = re.sub(r'\(\s*\d+\s*\)', '', text)
    # Loại bỏ chỉ tiêu hoặc ghi chú vùng: vung 1, kv2...
    text = re.sub(r'\b(vùng|khu vực|kv)\s*\d+\b', '', text, flags=re.IGNORECASE)
    # Loại bỏ chuỗi tổ hợp môn dính vào tên: + Ngữ văn, Lịch sử...
    text = re.sub(r'\+\s*(toán|ngữ văn|vật lý|hóa học|sinh học|tiếng anh|lịch sử|địa lý).*', '', text, flags=re.IGNORECASE)
    # Chuẩn hóa khoảng trắng
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def build_canonical_program_id(institution_code: str,
                               campus_code: str = "MAIN",
                               program_code: Optional[str] = None,
                               admission_method: str = "100") -> str:
    """
    Sinh khóa định danh bất biến (Immutable Canonical ID).
    Quy chuẩn: INSTITUTION:CAMPUS:PROGRAM_CODE:METHOD
    """
    inst = institution_code.strip().upper()
    campus = campus_code.strip().upper() if campus_code else "MAIN"
    prog = program_code.strip().upper() if program_code else "GENERAL"
    method = admission_method.strip().upper() if admission_method else "100"
    return f"{inst}:{campus}:{prog}:{method}"


def parse_canonical_program_id(canonical_id: str) -> Dict[str, str]:
    """Phân tách Canonical ID thành các thành phần cấu trúc."""
    parts = canonical_id.split(":")
    if len(parts) == 4:
        return {
            "institution_code": parts[0],
            "campus_code": parts[1],
            "program_code": parts[2],
            "admission_method": parts[3]
        }
    elif len(parts) == 2:
        return {
            "institution_code": parts[0],
            "campus_code": "MAIN",
            "program_code": parts[1],
            "admission_method": "100"
        }
    else:
        return {
            "institution_code": parts[0] if parts else "UNKNOWN",
            "campus_code": "MAIN",
            "program_code": "GENERAL",
            "admission_method": "100"
        }


# TỪ ĐIỂN ALIAS TRƯỜNG ĐẠI HỌC VIỆT NAM (GROUNDED ALIAS SSOT)
UNIVERSITY_ALIASES: Dict[str, str] = {
    "bka": "BKA", "hust": "BKA", "bach khoa ha noi": "BKA", "dh bach khoa ha noi": "BKA",
    "qhi": "QHI", "uet": "QHI", "dai hoc cong nghe": "QHI", "dh cong nghe dhqghn": "QHI", "cong nghe ha noi": "QHI",
    "neu": "KHA", "kha": "KHA", "kinh te quoc dan": "KHA", "dh kinh te quoc dan": "KHA",
    "ftu": "NTH", "nth": "NTH", "ngoai thuong": "NTH", "dh ngoai thuong": "NTH",
    "ptit": "BVH", "bvh": "BVH", "buu chinh vien thong": "BVH", "hoc vien buu chinh": "BVH",
    "hcmut": "QST", "qst": "QST", "qsb": "QST", "bach khoa tphcm": "QST", "dh bach khoa tphcm": "QST",
    "ueh": "KSA", "ksa": "KSA", "kinh te tphcm": "KSA", "dh kinh te tphcm": "KSA",
    "uit": "QSX", "qsx": "QSX", "cong nghe thong tin tphcm": "QSX", "dh cntt dhqg tphcm": "QSX",
    "hcmus": "QSC", "qsc": "QSC", "khoa hoc tu nhien tphcm": "QSC", "dh khtn tphcm": "QSC",
    "haui": "DCN", "dcn": "DCN", "cong nghiep ha noi": "DCN", "dh cong nghiep ha noi": "DCN",
    "tmu": "TMA", "tma": "TMA", "thuong mai": "TMA", "dh thuong mai": "TMA",
    "sdu": "SDU", "sao do": "SDU", "dh sao do": "SDU",
}


# TỪ ĐIỂN ALIAS TÊN NGÀNH PHỔ BIẾN
MAJOR_ALIASES: Dict[str, str] = {
    "cntt": "Công nghệ thông tin",
    "it": "Công nghệ thông tin",
    "it1": "Khoa học Máy tính",
    "it2": "Kỹ thuật Máy tính",
    "cs": "Khoa học Máy tính",
    "khmt": "Khoa học Máy tính",
    "ktmt": "Kỹ thuật Máy tính",
    "ds": "Khoa học Dữ liệu",
    "ai": "Trí tuệ Nhân tạo",
    "qtkd": "Quản trị Kinh doanh",
    "kt": "Kinh tế",
    "tcdn": "Tài chính Doanh nghiệp",
    "nna": "Ngôn ngữ Anh",
}


def resolve_institution_code(raw_input: str) -> Optional[str]:
    """Khớp mã trường từ tên viết tắt, tiếng lóng hoặc tên đầy đủ."""
    if not raw_input:
        return None
    cleaned = remove_vietnamese_diacritics(raw_input)
    # Check exact alias
    if cleaned in UNIVERSITY_ALIASES:
        return UNIVERSITY_ALIASES[cleaned]
    # Check upper case code
    upper = raw_input.strip().upper()
    if len(upper) == 3 and upper.isalpha():
        return upper
    return None


def resolve_major_group(major_name: str) -> str:
    """Phân loại 12 nhóm ngành chuẩn dựa trên từ khóa tiếng Việt không dấu."""
    norm = remove_vietnamese_diacritics(major_name)
    
    if any(k in norm for k in ["may tinh", "cntt", "phan mem", "du lieu", "tri tue nhan tao", "an toan thong tin", "he thong thong tin", "khoa hoc may tinh"]):
        return "cntt"
    if any(k in norm for k in ["dien", "dien tu", "co khi", "tu dong hoa", "vat lieu", "xay dung", "hoa hoc", "co dien tu", "ky thuat"]):
        return "ky_thuat"
    if any(k in norm for k in ["kinh te", "tai chinh", "ngan hang", "ke toan", "kiem toan", "quan tri", "marketing", "kinh doanh", "thuong mai", "logistics"]):
        return "kinh_te"
    if any(k in norm for k in ["y khoa", "duoc", "dieu duong", "y te", "rang ham mat", "y te cong cong"]):
        return "y_duoc"
    if any(k in norm for k in ["su pham", "giao duc"]):
        return "su_pham"
    if any(k in norm for k in ["luat"]):
        return "luat"
    if any(k in norm for k in ["ngon ngu", "tieng anh", "tieng trung", "tieng nhat", "tieng han"]):
        return "ngon_ngu"
    if any(k in norm for k in ["du lich", "khach san", "nha hang"]):
        return "du_lich"
    if any(k in norm for k in ["bao chi", "truyen thong", "xa hoi", "tam ly", "quan he quoc te"]):
        return "xa_hoi"
    if any(k in norm for k in ["nong nghiep", "lam nghiep", "thuy san", "thu y"]):
        return "nong_lam"
    if any(k in norm for k in ["kien truc", "quy hoach", "thiet ke do hoa"]):
        return "kien_truc"
    if any(k in norm for k in ["the duc", "the thao"]):
        return "the_thao"
        
    return "khac"


# ============================================================================
# CANONICAL ADMISSION BUSINESS RULES (MOET SSOT)
# ============================================================================

def convert_ielts_to_english(ielts: Optional[float], current_english: Optional[float] = 0.0) -> float:
    """
    Quy đổi chuẩn chứng chỉ IELTS sang điểm thi môn Tiếng Anh (thang 10).
    Tuân thủ quy chế tuyển sinh của các trường ĐH lớn (BKA, NEU, FTU, UEH):
    - IELTS >= 7.0: 10.0
    - IELTS >= 6.5: 9.5
    - IELTS >= 6.0: 9.0
    - IELTS >= 5.5: 8.5
    - IELTS >= 5.0: 8.0
    - IELTS >= 4.5: 7.0
    Trả về max(điểm quy đổi, điểm thi hiện có).
    """
    current_val = float(current_english) if current_english is not None else 0.0
    if ielts is None or ielts <= 0:
        return current_val

    converted = 0.0
    if ielts >= 7.0:
        converted = 10.0
    elif ielts >= 6.5:
        converted = 9.5
    elif ielts >= 6.0:
        converted = 9.0
    elif ielts >= 5.5:
        converted = 8.5
    elif ielts >= 5.0:
        converted = 8.0
    elif ielts >= 4.5:
        converted = 7.0

    return max(converted, current_val)


def compute_ministry_priority(area: str, object_code: str, base_score: float) -> tuple[float, float]:
    """
    Tính điểm ưu tiên theo Quy chế Tuyển sinh 2026 của Bộ GD&ĐT (Thông tư 06/2026/TT-BGDĐT):
    - Điểm ưu tiên tối đa = Điểm KV + Điểm Đối tượng
      + KV1: 0.75, KV2-NT: 0.50, KV2: 0.25, KV3: 0.00
      + Nhóm UT1: 2.00, UT2: 1.00, none: 0.00 (quy chế hiện hành không có nhóm UT3)
    - Cơ chế giảm dần từ 22.5 điểm:
      Khi Tổng_điểm_gốc >= 22.5:
        Điểm_ưu_tiên = Điểm_ưu_tiên_tối_đa * (30 - Tổng_điểm_gốc) / 7.5
    - Điểm cuối cùng = min(30.0, max(0.0, base_score + effective_bonus))
    Returns: (effective_bonus, total_score)
    """
    area_bonus = {"KV1": 0.75, "KV2-NT": 0.5, "KV2": 0.25, "KV3": 0.0}.get(area, 0.0)
    object_bonus = {"uu_tien_1": 2.0, "uu_tien_2": 1.0, "none": 0.0}.get(object_code, 0.0)
    max_bonus = area_bonus + object_bonus

    if base_score >= 22.5:
        effective_bonus = max_bonus * ((30.0 - base_score) / 7.5)
    else:
        effective_bonus = max_bonus

    effective_bonus = max(0.0, effective_bonus)
    total_score = min(30.0, max(0.0, base_score + effective_bonus))
    return effective_bonus, total_score


# DANH MỤC TỔ HỢP MÔN CHUẨN XÉT TUYỂN (COMBO SUBJECTS CATALOG)
COMBO_SUBJECTS: Dict[str, List[str]] = {
    "A00": ["toan", "ly", "hoa"],
    "A01": ["toan", "ly", "anh"],
    "A02": ["toan", "ly", "sinh"],
    "A07": ["toan", "su", "dia"],
    "A09": ["toan", "dia", "gdcd"],
    "B00": ["toan", "hoa", "sinh"],
    "B03": ["toan", "sinh", "van"],
    "B08": ["toan", "sinh", "anh"],
    "C00": ["van", "su", "dia"],
    "C01": ["van", "toan", "ly"],
    "C02": ["van", "toan", "hoa"],
    "C03": ["van", "toan", "su"],
    "C04": ["van", "toan", "dia"],
    "C08": ["van", "hoa", "sinh"],
    "C20": ["van", "dia", "gdcd"],
    "D01": ["toan", "van", "anh"],
    "D02": ["toan", "van", "nga"],
    "D03": ["toan", "van", "phap"],
    "D04": ["toan", "van", "trung"],
    "D05": ["toan", "van", "duc"],
    "D06": ["toan", "van", "nhat"],
    "D07": ["toan", "hoa", "anh"],
    "D08": ["toan", "sinh", "anh"],
    "D09": ["toan", "su", "anh"],
    "D10": ["toan", "dia", "anh"],
    "D12": ["van", "hoa", "anh"],
    "D14": ["van", "su", "anh"],
    "D15": ["van", "dia", "anh"],
    "D63": ["van", "sinh", "anh"],
    "D66": ["van", "gdcd", "anh"],
    "D71": ["toan", "gdcd", "anh"],
    "D78": ["van", "xa_hoi", "anh"],
    "D82": ["toan", "xa_hoi", "anh"],
    "D96": ["toan", "khoa_hoc_xa_hoi", "anh"],
}

"""National major taxonomy normalizer according to MoET Circular 09/2022/TT-BGDĐT.

Standardizes 7-digit major codes and maps them deterministically to the 12 canonical groups.
"""

from __future__ import annotations

import re
from typing import Optional, Tuple

# 7-digit bachelor code regex: e.g. 7480201 or 7480201A
MOET_CODE_REGEX = re.compile(r"\b(7\d{6})([A-Za-z0-9_]*)?\b")

# Circular 09/2022/TT-BGDĐT 3-digit prefix mapping to 12 canonical groups
PREFIX_TO_MAJOR_GROUP = {
    "714": "su_pham",    # Sư phạm & Giáo dục
    "721": "kien_truc",  # Nghệ thuật, Mỹ thuật ứng dụng
    "722": "ngon_ngu",   # Nhân văn, Ngôn ngữ
    "731": "xa_hoi",     # Khoa học xã hội & Hành vi
    "732": "xa_hoi",     # Báo chí & Truyền thông
    "734": "kinh_te",    # Kinh doanh & Quản lý
    "738": "luat",       # Pháp luật
    "742": "nong_lam",   # Khoa học sự sống
    "744": "ky_thuat",   # Khoa học tự nhiên
    "746": "cntt",       # Toán ứng dụng, Khoa học dữ liệu
    "748": "cntt",       # Máy tính & Công nghệ thông tin
    "751": "ky_thuat",   # Công nghệ kỹ thuật
    "752": "ky_thuat",   # Kỹ thuật
    "754": "ky_thuat",   # Sản xuất & Chế biến
    "758": "kien_truc",  # Kiến trúc & Xây dựng
    "762": "nong_lam",   # Nông lâm & Thủy sản
    "764": "nong_lam",   # Thú y
    "772": "y_duoc",     # Sức khỏe, Y đa khoa, Dược học
    "781": "du_lich",    # Du lịch, Khách sạn, Dịch vụ cá nhân
    "784": "ky_thuat",   # Khai khoáng
    "785": "nong_lam",   # Quản lý đất đai & Môi trường
    "786": "xa_hoi",     # An ninh, Quốc phòng
}

# Explicit overrides for sub-branches under 781 and 714
SPECIFIC_CODE_OVERRIDES = {
    "7810301": "the_thao",  # Quản lý thể dục thể thao
    "7810302": "the_thao",  # Huấn luyện thể thao
    "7140206": "the_thao",  # Giáo dục thể chất
    "7580101": "kien_truc",  # Kiến trúc
    "7580102": "kien_truc",  # Kiến trúc cảnh quan
    "7580103": "kien_truc",  # Kiến trúc nội thất
    "7580104": "kien_truc",  # Quy hoạch vùng và đô thị
    "7580201": "ky_thuat",   # Kỹ thuật xây dựng
    "7580205": "ky_thuat",   # Kỹ thuật công trình thủy
}

# Fallback keywords for legacy or un-coded major descriptions
FALLBACK_KEYWORD_RULES = [
    ("công nghệ thông tin", "cntt"),
    ("khoa học máy tính", "cntt"),
    ("kỹ thuật phần mềm", "cntt"),
    ("hệ thống thông tin", "cntt"),
    ("an toàn thông tin", "cntt"),
    ("trí tuệ nhân tạo", "cntt"),
    ("mạng máy tính", "cntt"),
    ("data science", "cntt"),
    ("khoa học dữ liệu", "cntt"),
    ("y khoa", "y_duoc"),
    ("dược", "y_duoc"),
    ("điều dưỡng", "y_duoc"),
    ("răng hàm mặt", "y_duoc"),
    ("y học", "y_duoc"),
    ("y tế công cộng", "y_duoc"),
    ("xét nghiệm", "y_duoc"),
    ("sư phạm", "su_pham"),
    ("giáo dục mầm non", "su_pham"),
    ("giáo dục tiểu học", "su_pham"),
    ("giáo dục thể chất", "the_thao"),
    ("luật", "luat"),
    ("pháp lý", "luat"),
    ("ngôn ngữ", "ngon_ngu"),
    ("tiếng anh", "ngon_ngu"),
    ("tiếng trung", "ngon_ngu"),
    ("tiếng nhật", "ngon_ngu"),
    ("tiếng hàn", "ngon_ngu"),
    ("phiên dịch", "ngon_ngu"),
    ("kiến trúc", "kien_truc"),
    ("mỹ thuật", "kien_truc"),
    ("thiết kế", "kien_truc"),
    ("nội thất", "kien_truc"),
    ("đồ họa", "kien_truc"),
    ("nông", "nong_lam"),
    ("lâm", "nong_lam"),
    ("thủy sản", "nong_lam"),
    ("chăn nuôi", "nong_lam"),
    ("thú y", "nong_lam"),
    ("thể dục thể thao", "the_thao"),
    ("thể thao", "the_thao"),
    ("huấn luyện", "the_thao"),
    ("du lịch", "du_lich"),
    ("khách sạn", "du_lich"),
    ("nhà hàng", "du_lich"),
    ("lữ hành", "du_lich"),
    ("báo chí", "xa_hoi"),
    ("truyền thông", "xa_hoi"),
    ("tâm lý", "xa_hoi"),
    ("xã hội học", "xa_hoi"),
    ("quan hệ công chúng", "xa_hoi"),
    ("quốc tế học", "xa_hoi"),
    ("kế toán", "kinh_te"),
    ("tài chính", "kinh_te"),
    ("ngân hàng", "kinh_te"),
    ("kinh doanh", "kinh_te"),
    ("marketing", "kinh_te"),
    ("quản trị", "kinh_te"),
    ("kinh tế", "kinh_te"),
    ("logistics", "kinh_te"),
    ("thương mại", "kinh_te"),
    ("chuỗi cung ứng", "kinh_te"),
    ("kiểm toán", "kinh_te"),
    ("kỹ thuật", "ky_thuat"),
    ("cơ khí", "ky_thuat"),
    ("điện", "ky_thuat"),
    ("xây dựng", "ky_thuat"),
    ("cơ điện tử", "ky_thuat"),
    ("ô tô", "ky_thuat"),
    ("tự động hóa", "ky_thuat"),
    ("vật liệu", "ky_thuat"),
    ("hóa học", "ky_thuat"),
    ("môi trường", "ky_thuat"),
    ("công nghệ", "ky_thuat"),
]


class MajorCodeNormalizer:
    """Normalizes major code, validates 7-digit format, and infers major group."""

    @classmethod
    def extract_and_validate_code(cls, raw_code: Optional[str], raw_text: Optional[str] = None) -> Optional[str]:
        """Validates or extracts standard 7-digit MoET major code."""
        if raw_code:
            clean_code = str(raw_code).strip()
            m = MOET_CODE_REGEX.search(clean_code)
            if m:
                return m.group(1)

        if raw_text:
            m = MOET_CODE_REGEX.search(raw_text)
            if m:
                return m.group(1)

        return None

    @classmethod
    def clean_major_name(cls, raw_name: str) -> str:
        """Strips noise, internal program codes, and unnecessary symbols from major name."""
        if not raw_name:
            return ""
        name = str(raw_name).strip()
        # Remove parenthesized program abbreviations like (IT1), (EE2), (CN1)
        name = re.sub(r"\([A-Z0-9_-]{2,6}\)", "", name)
        # Remove leading bullets or dashes
        name = re.sub(r"^[\s\-\*\.\d\)]+", "", name)
        # Remove trailing method indicators
        name = re.sub(r"\s*-\s*(Chất lượng cao|Tiên tiến|Chuẩn|CTTT|CLC).*$", "", name, flags=re.IGNORECASE)
        # Normalize whitespace
        name = re.sub(r"\s+", " ", name).strip()
        return name

    @classmethod
    def infer_major_group(
        cls,
        major_code: Optional[str] = None,
        major_name: Optional[str] = None,
    ) -> Tuple[str, bool]:
        """
        Infers canonical major group (1 of 12) from MoET code or name.
        Returns: (major_group, is_high_confidence)
        """
        # 1. Exact MoET 7-digit code lookup
        if major_code:
            code_str = str(major_code).strip()
            if code_str in SPECIFIC_CODE_OVERRIDES:
                return SPECIFIC_CODE_OVERRIDES[code_str], True

            prefix = code_str[:3]
            if prefix in PREFIX_TO_MAJOR_GROUP:
                return PREFIX_TO_MAJOR_GROUP[prefix], True

        # 2. Text keyword heuristic
        if major_name:
            lower_name = major_name.lower()
            for keyword, group in FALLBACK_KEYWORD_RULES:
                if keyword in lower_name:
                    return group, False

        # 3. Default fallback
        return "xa_hoi", False

"""University metadata standardizer, code mapping, and geographic resolver.

Solves the missing school_province and non-canonical alias issues across datasets.
"""

from __future__ import annotations

from typing import Dict, Literal, NamedTuple, Optional


class SchoolInfo(NamedTuple):
    code: str
    canonical_name: str
    province: str
    region: Literal["bac", "trung", "nam"]
    tier: int  # 1: Trọng điểm / Top đầu; 2: Tầm trung; 3: Địa phương / Tư thục


# Canonical directory of Vietnam Universities with aliases
UNIVERSITY_CATALOG: Dict[str, SchoolInfo] = {
    # Hà Nội (Miền Bắc)
    "BKA": SchoolInfo("BKA", "Đại học Bách Khoa Hà Nội", "Hà Nội", "bac", 1),
    "QHI": SchoolInfo("QHI", "Trường ĐH Công nghệ - ĐHQGHN", "Hà Nội", "bac", 1),
    "QHT": SchoolInfo("QHT", "Trường ĐH Khoa học Tự nhiên - ĐHQGHN", "Hà Nội", "bac", 1),
    "QHX": SchoolInfo("QHX", "Trường ĐH Khoa học Xã hội & Nhân văn - ĐHQGHN", "Hà Nội", "bac", 1),
    "QHE": SchoolInfo("QHE", "Trường ĐH Kinh tế - ĐHQGHN", "Hà Nội", "bac", 1),
    "QHF": SchoolInfo("QHF", "Trường ĐH Ngoại ngữ - ĐHQGHN", "Hà Nội", "bac", 1),
    "QHL": SchoolInfo("QHL", "Trường ĐH Luật - ĐHQGHN", "Hà Nội", "bac", 1),
    "QHY": SchoolInfo("QHY", "Trường ĐH Y Dược - ĐHQGHN", "Hà Nội", "bac", 1),
    "KHA": SchoolInfo("KHA", "Trường ĐH Kinh tế Quốc dân", "Hà Nội", "bac", 1),
    "NTH": SchoolInfo("NTH", "Trường ĐH Ngoại thương", "Hà Nội", "bac", 1),
    "YHB": SchoolInfo("YHB", "Trường ĐH Y Hà Nội", "Hà Nội", "bac", 1),
    "DKH": SchoolInfo("DKH", "Trường ĐH Dược Hà Nội", "Hà Nội", "bac", 1),
    "LPH": SchoolInfo("LPH", "Trường ĐH Luật Hà Nội", "Hà Nội", "bac", 1),
    "SPH": SchoolInfo("SPH", "Trường ĐH Sư phạm Hà Nội", "Hà Nội", "bac", 1),
    "GHA": SchoolInfo("GHA", "Trường ĐH Giao thông Vận tải", "Hà Nội", "bac", 2),
    "XDA": SchoolInfo("XDA", "Trường ĐH Xây dựng Hà Nội", "Hà Nội", "bac", 2),
    "TLA": SchoolInfo("TLA", "Trường ĐH Thủy lợi", "Hà Nội", "bac", 2),
    "DDA": SchoolInfo("DDA", "Trường ĐH Điện lực", "Hà Nội", "bac", 2),
    "DCN": SchoolInfo("DCN", "Trường ĐH Công nghiệp Hà Nội", "Hà Nội", "bac", 2),
    "BVH": SchoolInfo("BVH", "Học viện Công nghệ Bưu chính Viễn thông", "Hà Nội", "bac", 1),
    "HVA": SchoolInfo("HVA", "Học viện Ngân hàng", "Hà Nội", "bac", 1),
    "HTC": SchoolInfo("HTC", "Học viện Tài chính", "Hà Nội", "bac", 1),
    "HQT": SchoolInfo("HQT", "Học viện Ngoại giao", "Hà Nội", "bac", 1),
    "HBA": SchoolInfo("HBA", "Học viện Báo chí và Tuyên truyền", "Hà Nội", "bac", 1),
    "SDU": SchoolInfo("SDU", "Trường ĐH Sao Đỏ", "Hải Dương", "bac", 3),
    "QHQ": SchoolInfo("QHQ", "Trường ĐH Hoa Lư", "Ninh Bình", "bac", 3),
    "DTN": SchoolInfo("DTN", "Đại học Thái Nguyên", "Thái Nguyên", "bac", 2),

    # TP. Hồ Chí Minh & Miền Nam
    "QSG": SchoolInfo("QSG", "Trường ĐH Bách Khoa - ĐHQG-HCM", "TP.HCM", "nam", 1),
    "QSC": SchoolInfo("QSC", "Trường ĐH Công nghệ Thông tin - ĐHQG-HCM", "TP.HCM", "nam", 1),
    "QST": SchoolInfo("QST", "Trường ĐH Khoa học Tự nhiên - ĐHQG-HCM", "TP.HCM", "nam", 1),
    "QSX": SchoolInfo("QSX", "Trường ĐH Khoa học Xã hội & Nhân văn - ĐHQG-HCM", "TP.HCM", "nam", 1),
    "QSE": SchoolInfo("QSE", "Trường ĐH Kinh tế - Luật - ĐHQG-HCM", "TP.HCM", "nam", 1),
    "QSI": SchoolInfo("QSI", "Trường ĐH Quốc tế - ĐHQG-HCM", "TP.HCM", "nam", 1),
    "KSA": SchoolInfo("KSA", "Đại học Kinh tế TP. Hồ Chí Minh (UEH)", "TP.HCM", "nam", 1),
    "NTS": SchoolInfo("NTS", "Trường ĐH Ngoại thương (Cơ sở II)", "TP.HCM", "nam", 1),
    "YDS": SchoolInfo("YDS", "Đại học Y Dược TP. Hồ Chí Minh", "TP.HCM", "nam", 1),
    "SPS": SchoolInfo("SPS", "Trường ĐH Sư phạm TP. Hồ Chí Minh", "TP.HCM", "nam", 1),
    "SPK": SchoolInfo("SPK", "Trường ĐH Sư phạm Kỹ thuật TP. Hồ Chí Minh", "TP.HCM", "nam", 1),
    "LPS": SchoolInfo("LPS", "Trường ĐH Luật TP. Hồ Chí Minh", "TP.HCM", "nam", 1),
    "DCS": SchoolInfo("DCS", "Trường ĐH Công Thương TP. Hồ Chí Minh", "TP.HCM", "nam", 2),
    "TDT": SchoolInfo("TDT", "Trường ĐH Tôn Đức Thắng", "TP.HCM", "nam", 2),
    "TTD": SchoolInfo("TTD", "Trường ĐH Nguyễn Tất Thành", "TP.HCM", "nam", 3),
    "FPT": SchoolInfo("FPT", "Trường ĐH FPT", "Hà Nội", "bac", 2),
    "TDM": SchoolInfo("TDM", "Trường ĐH Thủ Dầu Một", "Bình Dương", "nam", 2),
    "CTU": SchoolInfo("CTU", "Trường ĐH Cần Thơ", "Cần Thơ", "nam", 1),
    "DLA": SchoolInfo("DLA", "Trường ĐH Đà Lạt", "Lâm Đồng", "nam", 2),

    # Miền Trung
    "DDK": SchoolInfo("DDK", "Trường ĐH Bách Khoa - ĐH Đà Nẵng", "Đà Nẵng", "trung", 1),
    "DDC": SchoolInfo("DDC", "Trường ĐH Công nghệ Thông tin & TT Việt - Hàn (VKU)", "Đà Nẵng", "trung", 2),
    "DDE": SchoolInfo("DDE", "Trường ĐH Kinh tế - ĐH Đà Nẵng", "Đà Nẵng", "trung", 1),
    "DDF": SchoolInfo("DDF", "Trường ĐH Ngoại ngữ - ĐH Đà Nẵng", "Đà Nẵng", "trung", 2),
    "DDS": SchoolInfo("DDS", "Trường ĐH Sư phạm - ĐH Đà Nẵng", "Đà Nẵng", "trung", 2),
    "DHK": SchoolInfo("DHK", "Trường ĐH Khoa học - ĐH Huế", "Thừa Thiên Huế", "trung", 2),
    "DHE": SchoolInfo("DHE", "Trường ĐH Kinh tế - ĐH Huế", "Thừa Thiên Huế", "trung", 2),
    "DHY": SchoolInfo("DHY", "Trường ĐH Y Dược - ĐH Huế", "Thừa Thiên Huế", "trung", 1),
    "TDV": SchoolInfo("TDV", "Trường ĐH Vinh", "Nghệ An", "trung", 2),
    "QNU": SchoolInfo("QNU", "Trường ĐH Quy Nhơn", "Bình Định", "trung", 2),
    "NTU": SchoolInfo("NTU", "Trường ĐH Nha Trang", "Khánh Hòa", "trung", 2),
    "TYS": SchoolInfo("TYS", "Trường ĐH Tây Nguyên", "Đắk Lắk", "trung", 2),
}

# Alias mapping for popular unofficial or international abbreviations
ALIASES: Dict[str, str] = {
    "HUST": "BKA",
    "BK": "BKA",
    "BACH KHOA HN": "BKA",
    "UET": "QHI",
    "DHCN": "QHI",
    "HUS": "QHT",
    "USSH HN": "QHX",
    "NEU": "KHA",
    "KTQD": "KHA",
    "FTU": "NTH",
    "NGOAI THUONG": "NTH",
    "HMU": "YHB",
    "Y HA NOI": "YHB",
    "HNMU": "SPH",
    "PTIT": "BVH",
    "BA": "HVA",
    "NGAN HANG": "HVA",
    "AOF": "HTC",
    "TAI CHINH": "HTC",
    "DAV": "HQT",
    "AJC": "HBA",
    "HCMUT": "QSG",
    "BK TPHCM": "QSG",
    "UIT": "QSC",
    "CNTT HCM": "QSC",
    "HCMUS": "QST",
    "USSH HCM": "QSX",
    "UEL": "QSE",
    "IU": "QSI",
    "UEH": "KSA",
    "FTU2": "NTS",
    "UMP": "YDS",
    "HCMUE": "SPS",
    "HCMUTE": "SPK",
    "DUT": "DDK",
    "BK DA NANG": "DDK",
    "DUE": "DDE",
    "VKU": "DDC",
    "HCE": "DHE",
    "HUE": "DHK",
}


class SchoolNormalizer:
    """Normalizes university codes, names, provinces, and regions."""

    @classmethod
    def resolve_school(cls, raw_code_or_name: str) -> SchoolInfo:
        """Resolves raw school code or name to canonical SchoolInfo."""
        clean_input = raw_code_or_name.strip().upper()
        # Direct code lookup
        if clean_input in UNIVERSITY_CATALOG:
            return UNIVERSITY_CATALOG[clean_input]

        # Alias lookup
        if clean_input in ALIASES:
            canonical_code = ALIASES[clean_input]
            return UNIVERSITY_CATALOG[canonical_code]

        # Check if raw input contains code or name keyword
        for code, info in UNIVERSITY_CATALOG.items():
            if code in clean_input or info.canonical_name.upper() in clean_input:
                return info

        for alias, canonical_code in ALIASES.items():
            if alias in clean_input:
                return UNIVERSITY_CATALOG[canonical_code]

        # Fallback for unlisted universities
        code = clean_input[:6] if len(clean_input) > 2 else "UNI"
        return SchoolInfo(
            code=code,
            canonical_name=raw_code_or_name.strip(),
            province="Toàn quốc",
            region="bac",
            tier=2,
        )

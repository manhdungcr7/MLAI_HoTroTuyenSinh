#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
generate-nguyen-vong-icons.py
Trình sinh bộ 30 biểu tượng SVG chuẩn hóa cho sản phẩm "Nguyện Vọng AI".
Chỉ sử dụng Python Standard Library, tích hợp kiểm thử tự động (self-validation).
"""

import hashlib
import html
import json
import pathlib
import re
import shutil
import sys
import xml.etree.ElementTree as ET
from typing import Any, Callable, Dict, List, Optional, Tuple, Union

# ==============================================================================
# 1. CẤU HÌNH HỆ MÀU & HẰNG SỐ
# ==============================================================================

REPO_ROOT = pathlib.Path(__file__).resolve().parent.parent
OUTPUT_ROOT = REPO_ROOT / "generated" / "nguyen-vong-icons"

ALLOWED_BRAND_COLORS = {
    "#2448C4",  # Xanh mực chính
    "#1A348F",  # Xanh mực đậm
    "#E9EEFB",  # Xanh nhạt
    "#131C3F",  # Màu mực / tiêu đề
    "#107A5F",  # Xanh lục tin cậy
    "#DC8A00",  # Cam ấm
    "#8A5100",  # Cam đậm
    "#6A4FD6",  # Tím
    "#E0614E",  # San hô dịu
    "#FFE45E",  # Vàng dạ quang
    "#FFFFFF",  # Trắng
}

FORBIDDEN_TAGS = {
    "text",
    "tspan",
    "image",
    "foreignObject",
    "script",
    "style",
    "animate",
    "animateTransform",
    "animateMotion",
    "set",
    "filter",
    "feGaussianBlur",
    "feDropShadow",
    "linearGradient",
    "radialGradient",
    "pattern",
    "mask",
    "clipPath",
    "metadata",
}

UI_VIEWBOX = "0 0 24 24"
UI_STROKE_WIDTH = "1.9"

Number = Union[int, float]


# ==============================================================================
# 2. HELPER DỰNG SVG SẠCH & ĐỊNH DẠNG SỐ
# ==============================================================================

def fmt(val: Number) -> str:
    """Làm tròn số tối đa 2 chữ số thập phân, bỏ số 0 thừa."""
    rounded = round(float(val), 2)
    if rounded == int(rounded):
        return str(int(rounded))
    return f"{rounded:.2f}".rstrip("0").rstrip(".")


class SvgBuilder:
    """Helper tạo cấu trúc XML SVG phẳng, sạch, không boilerplate thừa."""

    def __init__(self, view_box: str, is_ui: bool = True) -> None:
        self.view_box = view_box
        self.is_ui = is_ui
        attrs: Dict[str, str] = {
            "xmlns": "http://www.w3.org/2000/svg",
            "viewBox": view_box,
            "fill": "none",
        }
        if is_ui:
            attrs["stroke"] = "currentColor"
            attrs["stroke-width"] = UI_STROKE_WIDTH
            attrs["stroke-linecap"] = "round"
            attrs["stroke-linejoin"] = "round"
        self.root = ET.Element("svg", attrs)

    def _clean_attrs(self, raw: Dict[str, Any]) -> Dict[str, str]:
        cleaned: Dict[str, str] = {}
        for k, v in raw.items():
            if v is None:
                continue
            key = k.rstrip("_").replace("_", "-")
            if isinstance(v, (int, float)):
                cleaned[key] = fmt(v)
            else:
                cleaned[key] = str(v)
        return cleaned

    def path(self, d: str, **kwargs: Any) -> "SvgBuilder":
        attrs = {"d": d}
        attrs.update(self._clean_attrs(kwargs))
        ET.SubElement(self.root, "path", attrs)
        return self

    def rect(
        self,
        x: Number,
        y: Number,
        width: Number,
        height: Number,
        rx: Optional[Number] = None,
        **kwargs: Any,
    ) -> "SvgBuilder":
        attrs: Dict[str, Any] = {"x": x, "y": y, "width": width, "height": height}
        if rx is not None:
            attrs["rx"] = rx
        attrs.update(kwargs)
        ET.SubElement(self.root, "rect", self._clean_attrs(attrs))
        return self

    def circle(self, cx: Number, cy: Number, r: Number, **kwargs: Any) -> "SvgBuilder":
        attrs: Dict[str, Any] = {"cx": cx, "cy": cy, "r": r}
        attrs.update(kwargs)
        ET.SubElement(self.root, "circle", self._clean_attrs(attrs))
        return self

    def line(
        self, x1: Number, y1: Number, x2: Number, y2: Number, **kwargs: Any
    ) -> "SvgBuilder":
        attrs: Dict[str, Any] = {"x1": x1, "y1": y1, "x2": x2, "y2": y2}
        attrs.update(kwargs)
        ET.SubElement(self.root, "line", self._clean_attrs(attrs))
        return self

    def render(self) -> str:
        ET.indent(self.root, space="  ")
        xml_str = ET.tostring(self.root, encoding="unicode", short_empty_elements=True)
        return xml_str.strip() + "\n"


# ==============================================================================
# 3. ĐỊNH NGHĨA HÌNH HỌC CHO 30 BIỂU TƯỢNG SVG
# ==============================================================================

# ------------------------------------------------------------------------------
# A. THƯƠNG HIỆU (4 FILES)
# Ý tưởng: Hai trang vở mở tạo chữ V hướng lên, mép trên tạo góc mũ tốt nghiệp,
# kết hợp lộ trình vươn lên và chấm sáng vàng dạ quang ở đỉnh.
# ------------------------------------------------------------------------------

def build_brand_symbol_color() -> str:
    s = SvgBuilder("0 0 64 64", is_ui=False)
    # Tán mũ tốt nghiệp / Đỉnh tri thức phía trên
    s.path("M32 6 L54 15 L32 23 L10 15 Z", fill="#1A348F")
    # Trang vở bên trái (Mực xanh chính)
    s.path(
        "M8 21 C8 19.3 9.5 18.2 11.1 18.8 L29.5 25.8 C31 26.4 32 27.8 32 29.5 "
        "V56 C32 57.5 30.3 58.4 29 57.6 L10.2 46.8 C8.8 46 8 44.5 8 42.9 Z",
        fill="#2448C4",
    )
    # Trang vở bên phải (Mực xanh đậm tạo chiều sâu phẳng)
    s.path(
        "M56 21 C56 19.3 54.5 18.2 52.9 18.8 L34.5 25.8 C33 26.4 32 27.8 32 29.5 "
        "V56 C32 57.5 33.7 58.4 35 57.6 L53.8 46.8 C55.2 46 56 44.5 56 42.9 Z",
        fill="#1A348F",
    )
    # Ruột trang vở sáng màu bên trong tạo chữ V rõ nét
    s.path("M14 24.5 L29 30.2 V49.5 L14 41 Z", fill="#E9EEFB")
    s.path("M50 24.5 L35 30.2 V49.5 L50 41 Z", fill="#FFFFFF")
    # Dòng kẻ ô ly nhẹ bên trang trái
    s.path(
        "M18 32 L25 34.8 M18 37.5 L25 40.3",
        stroke="#2448C4",
        stroke_width=2.2,
        stroke_linecap="round",
    )
    # Đường dẫn lộ trình vươn lên bên trang phải + Gáy sách
    s.path(
        "M32 49.5 V29.5 C32 24 37.5 19.5 45 15",
        stroke="#2448C4",
        stroke_width=3.6,
        stroke_linecap="round",
    )
    # Điểm sáng AI / Mục tiêu (Vàng dạ quang)
    s.circle(45, 15, 4, fill="#FFE45E", stroke="#131C3F", stroke_width=2)
    return s.render()


def build_brand_symbol_mono() -> str:
    s = SvgBuilder(UI_VIEWBOX, is_ui=True)
    # Mép mũ tốt nghiệp phía trên
    s.path("M12 3 L20.5 6.5 L12 10 L3.5 6.5 Z")
    # Hai cánh trang vở mở hình chữ V
    s.path("M3.5 10.2 L12 13.8 L20.5 10.2 V17.5 L12 21 L3.5 17.5 Z")
    # Sống vở và lộ trình vươn lên
    s.path("M12 21 V13.8 C12 11.2 14.5 9.2 17.5 7.5")
    # Điểm sáng mục tiêu ở đầu lộ trình
    s.circle(18, 7.2, 1.5, fill="currentColor", stroke="none")
    return s.render()


def build_favicon() -> str:
    s = SvgBuilder("0 0 64 64", is_ui=False)
    # Nền vuông bo góc xanh mực
    s.rect(0, 0, 64, 64, rx=14, fill="#2448C4")
    # Vùng an toàn >= 8 đơn vị mỗi cạnh (tất cả chi tiết nằm trong 10..54)
    # Nền bóng nhẹ của quyển vở
    s.path("M32 10 L51 17.5 L32 25 L13 17.5 Z", fill="#E9EEFB")
    # Cánh vở trái (Xanh nhạt)
    s.path(
        "M11 23.5 L29.5 30.8 V51.5 L12.5 42 C11.5 41.4 11 40.4 11 39.2 Z",
        fill="#E9EEFB",
    )
    # Cánh vở phải (Trắng tinh)
    s.path(
        "M53 23.5 L34.5 30.8 V51.5 L51.5 42 C52.5 41.4 53 40.4 53 39.2 Z",
        fill="#FFFFFF",
    )
    # Đường lộ trình xanh mực đậm nổi trên nền sáng
    s.path(
        "M32 50 V30.5 C32 25.5 37 21.5 44 17.5",
        stroke="#1A348F",
        stroke_width=4,
        stroke_linecap="round",
    )
    # Chấm sáng vàng dạ quang nổi bật ở cả kích thước 16x16
    s.circle(44, 17.5, 4.5, fill="#FFE45E", stroke="#1A348F", stroke_width=2)
    return s.render()


def build_app_icon_master() -> str:
    s = SvgBuilder("0 0 512 512", is_ui=False)
    # Nền vuông bo góc chuẩn App Icon
    s.rect(0, 0, 512, 512, rx=112, fill="#2448C4")
    # Lớp nền phụ xanh mực đậm tạo độ sâu
    s.path(
        "M88 196 L256 262 L424 196 V332 C424 344 417 355 406 361 L256 442 "
        "L106 361 C95 355 88 344 88 332 Z",
        fill="#1A348F",
    )
    # Tán mũ tốt nghiệp phía trên (vùng an toàn cách mép > 80px)
    s.path("M256 84 L408 144 L256 204 L104 144 Z", fill="#E9EEFB")
    s.path("M256 84 L408 144 L256 174 L104 144 Z", fill="#FFFFFF")
    # Trang vở trái (Xanh nhạt)
    s.path(
        "M96 184 L240 242 V412 L110 340 C101 335 96 326 96 316 Z",
        fill="#E9EEFB",
    )
    # Trang vở phải (Trắng)
    s.path(
        "M416 184 L272 242 V412 L402 340 C411 335 416 326 416 316 Z",
        fill="#FFFFFF",
    )
    # Chi tiết dòng kẻ vở ô ly tinh tế trên trang trái (chỉ có ở bản 512)
    s.path(
        "M136 244 L204 272 M136 284 L204 312 M136 324 L184 344",
        stroke="#2448C4",
        stroke_width=14,
        stroke_linecap="round",
    )
    # Đường lộ trình AI hướng lên trên trang phải
    s.path(
        "M256 404 V244 C256 204 298 172 356 140",
        stroke="#1A348F",
        stroke_width=28,
        stroke_linecap="round",
    )
    # Nút giao trung gian trên lộ trình
    s.circle(312, 168, 16, fill="#2448C4")
    # Điểm đích vàng dạ quang
    s.circle(356, 140, 32, fill="#FFE45E", stroke="#1A348F", stroke_width=14)
    return s.render()


# ------------------------------------------------------------------------------
# B. ĐIỀU HƯỚNG CHÍNH (10 FILES - 5 CẶP OUTLINE / ACTIVE)
# ------------------------------------------------------------------------------

def build_nav_today_outline() -> str:
    s = SvgBuilder(UI_VIEWBOX)
    # Trang lịch/sổ tay hôm nay
    s.rect(4, 5, 16, 16, rx=3)
    # Gáy lò xo trên
    s.path("M8 3 V6 M16 3 V6")
    # Đường phân tách tiêu đề ngày
    s.path("M4 9.5 H20")
    # Dấu hoàn thành nhiệm vụ hôm nay
    s.path("M9 15 L11.2 17.2 L15.5 12.8")
    return s.render()


def build_nav_today_active() -> str:
    s = SvgBuilder(UI_VIEWBOX)
    # Gáy lò xo trên
    s.path("M8 3 V6 M16 3 V6")
    # Khung lịch giữ nguyên kích thước
    s.rect(4, 5, 16, 16, rx=3)
    # Phần đầu trang lịch tô đặc
    s.path(
        "M4 8 C4 6.34 5.34 5 7 5 H17 C18.66 5 20 6.34 20 8 V9.5 H4 Z",
        fill="currentColor",
    )
    # Huy hiệu tròn tô đặc ở tâm trang lịch chứa dấu kiểm
    s.circle(12, 15.2, 4.2, fill="currentColor", stroke="none")
    # Dấu kiểm nét đậm rõ ràng
    s.path("M8.8 15.2 L11 17.4 L15.5 12.8", stroke_width=2.1)
    return s.render()


def build_nav_explore_outline() -> str:
    s = SvgBuilder(UI_VIEWBOX)
    # Vòng kính tìm kiếm
    s.circle(11, 11, 7.5)
    # Tay cầm kính lúp
    s.path("M16.5 16.5 L21 21")
    # Đường chân trời / bậc thang ngành học bên trong kính
    s.path("M6.5 13 L9.8 9.8 L12.2 11.8 L15.2 8.5")
    s.circle(15.2, 8.5, 1, fill="currentColor", stroke="none")
    return s.render()


def build_nav_explore_active() -> str:
    s = SvgBuilder(UI_VIEWBOX)
    # Vòng kính tìm kiếm
    s.circle(11, 11, 7.5)
    # Tô đặc miền chân trời phía dưới bên trong kính lúp
    s.path(
        "M4.2 13.5 L9.5 9.2 L12.2 11.5 L16.2 7.5 "
        "C17.8 9.8 17.5 13.2 15.2 15.5 C12.5 18.2 7.8 17.8 5.2 15 Z",
        fill="currentColor",
        stroke="none",
    )
    # Đường dẫn hướng phía trên
    s.path("M6.5 12.8 L9.8 9.5 L12.2 11.5 L15.2 8.2")
    # Tay cầm kính lúp nhấn đậm
    s.path("M16.5 16.5 L21 21", stroke_width=2.5)
    return s.render()


def build_nav_preferences_outline() -> str:
    s = SvgBuilder(UI_VIEWBOX)
    # Thẻ nguyện vọng 1 (trên cùng, có chấm tròn ưu tiên và ký hiệu tim nhỏ bên phải)
    s.rect(3, 4, 18, 5.5, rx=1.8)
    s.circle(6.2, 6.75, 0.9, fill="currentColor", stroke="none")
    s.path(
        "M15.8 5.4 C15.1 4.7 14 5.2 14 6.1 C14 7 15.8 8.1 15.8 8.1 "
        "C15.8 8.1 17.6 7 17.6 6.1 C17.6 5.2 16.5 4.7 15.8 5.4 Z",
         fill="currentColor",
        stroke="none",
    )
    # Thẻ nguyện vọng 2 (xếp tầng giữa)
    s.path("M4.5 13 H19.5")
    s.circle(6.5, 13, 0.9, fill="currentColor", stroke="none")
    # Thẻ nguyện vọng 3 (xếp tầng dưới)
    s.path("M4.5 17.5 H17.5")
    s.circle(6.5, 17.5, 0.9, fill="currentColor", stroke="none")
    # Khung bao các nguyện vọng xếp sau
    s.path("M4 9.5 V18.5 C4 19.6 4.9 20.5 6 20.5 H18 C19.1 20.5 20 19.6 20 18.5 V9.5")
    return s.render()


def build_nav_preferences_active() -> str:
    s = SvgBuilder(UI_VIEWBOX)
    # Thẻ nguyện vọng 1 được tô đặc nổi bật
    s.rect(3, 4, 18, 5.5, rx=1.8, fill="currentColor")
    # Khung bao các nguyện vọng xếp tầng bên dưới
    s.path("M4 9.5 V18.5 C4 19.6 4.9 20.5 6 20.5 H18 C19.1 20.5 20 19.6 20 18.5 V9.5")
    # Hai thanh phiếu xếp dưới tô đặc dạng pill
    s.rect(6.5, 12.2, 11, 2, rx=1, fill="currentColor", stroke="none")
    s.rect(6.5, 16.2, 8.5, 2, rx=1, fill="currentColor", stroke="none")
    return s.render()


def build_nav_plan_outline() -> str:
    s = SvgBuilder(UI_VIEWBOX)
    # Khung sổ kế hoạch tuần
    s.rect(3.5, 4, 17, 16.5, rx=2.5)
    # Đường chia cột mốc tuần bên trái
    s.path("M8.5 4 V20.5")
    # Lộ trình 3 bước tiến lên trong kế hoạch
    s.path("M11.5 15.5 L14 13 L17.5 9.5")
    s.circle(11.5, 15.5, 1.1, fill="currentColor", stroke="none")
    s.circle(17.5, 9.5, 1.2, fill="currentColor", stroke="none")
    # Vạch đánh dấu tuần bên cột trái
    s.path("M5.5 8.5 H6.5 M5.5 12.2 H6.5 M5.5 16 H6.5")
    return s.render()


def build_nav_plan_active() -> str:
    s = SvgBuilder(UI_VIEWBOX)
    # Khung sổ kế hoạch tuần
    s.rect(3.5, 4, 17, 16.5, rx=2.5)
    # Cột danh mục tuần bên trái tô đặc
    s.path(
        "M6 4 H8.5 V20.5 H6 C4.62 20.5 3.5 19.38 3.5 18 V6.5 C3.5 5.12 4.62 4 6 4 Z",
        fill="currentColor",
    )
    # Đường lộ trình và điểm đích tô đặc rõ nét
    s.path("M11.5 15.5 L14 13 L17.5 9.5", stroke_width=2.2)
    s.circle(11.5, 15.5, 1.5, fill="currentColor", stroke="none")
    s.circle(17.5, 9.5, 1.8, fill="currentColor", stroke="none")
    return s.render()


def build_nav_profile_outline() -> str:
    s = SvgBuilder(UI_VIEWBOX)
    # Thẻ hồ sơ học sinh có góc gấp tài liệu ở trên bên phải
    s.path("M5 3.5 H15.5 L19.5 7.5 V18.5 C19.5 19.6 18.6 20.5 17.5 20.5 H6.5 C5.4 20.5 4.5 19.6 4.5 18.5 V4 C4.5 3.7 4.7 3.5 5 3.5 Z")
    s.path("M15 3.5 V7.5 H19.5")
    # Chân dung học sinh tối giản (đầu + vai cân đối, phi giới tính)
    s.circle(12, 11.2, 2.3)
    s.path("M8.2 17.5 C8.8 15.4 10.2 14.5 12 14.5 C13.8 14.5 15.2 15.4 15.8 17.5")
    return s.render()


def build_nav_profile_active() -> str:
    s = SvgBuilder(UI_VIEWBOX)
    # Khung thẻ hồ sơ giữ nguyên silhouette
    s.path("M5 3.5 H15.5 L19.5 7.5 V18.5 C19.5 19.6 18.6 20.5 17.5 20.5 H6.5 C5.4 20.5 4.5 19.6 4.5 18.5 V4 C4.5 3.7 4.7 3.5 5 3.5 Z")
    # Góc gấp tài liệu tô đặc
    s.path("M15 3.5 L19.5 7.5 H15 Z", fill="currentColor")
    # Chân dung học sinh tô đặc bên trong thẻ
    s.circle(12, 11.2, 2.5, fill="currentColor", stroke="none")
    s.path(
        "M7.8 18 C8.4 15.4 10 14.4 12 14.4 C14 14.4 15.6 15.4 16.2 18 Z",
        fill="currentColor",
        stroke="none",
    )
    return s.render()


# ------------------------------------------------------------------------------
# C. NGHIỆP VỤ TUYỂN SINH VÀ HỌC TẬP (12 FILES)
# ------------------------------------------------------------------------------

def build_feature_career_fit() -> str:
    """Biết mình hợp ngành nào: mục tiêu/cột mốc nằm trên trang vở mở."""
    s = SvgBuilder(UI_VIEWBOX)
    # Hai trang vở mở phía dưới
    s.path("M3 9.5 L12 12.5 L21 9.5 V18.5 L12 21.5 L3 18.5 Z")
    s.path("M12 12.5 V21.5")
    # Cột mốc định hướng kim cương phía trên trang vở
    s.path("M12 2.5 L15.5 6 L12 9.5 L8.5 6 Z")
    s.circle(12, 6, 1, fill="currentColor", stroke="none")
    return s.render()


def build_feature_school_filter() -> str:
    """Lọc trường theo điểm và túi tiền: tòa nhà trường tối giản + hai thanh lọc."""
    s = SvgBuilder(UI_VIEWBOX)
    # Tòa nhà trường học tối giản phía trên (mái tam giác cân + khối nhà)
    s.path("M4 9.5 L12 4 L20 9.5")
    s.path("M6.5 9.5 V13.5 H17.5 V9.5")
    s.path("M12 9.5 V13.5")
    # Thanh lọc 1 (Điểm chuẩn)
    s.path("M4 17 H20")
    s.circle(9, 17, 1.7, fill="currentColor")
    # Thanh lọc 2 (Học phí / Khu vực)
    s.path("M4 20.5 H20")
    s.circle(15.5, 20.5, 1.7, fill="currentColor")
    return s.render()


def build_feature_preference_ranking() -> str:
    """Xếp thứ tự nguyện vọng: các phiếu xếp tầng + mũi tên dọc."""
    s = SvgBuilder(UI_VIEWBOX)
    # Ba phiếu nguyện vọng xếp tầng bên trái
    s.rect(3, 4, 11.5, 4, rx=1.2)
    s.rect(3, 10, 11.5, 4, rx=1.2)
    s.rect(3, 16, 11.5, 4, rx=1.2)
    # Trục mũi tên sắp thứ tự ưu tiên bên phải
    s.path("M19 4.5 V19.5")
    s.path("M16.5 7 L19 4.5 L21.5 7")
    s.path("M16.5 17 L19 19.5 L21.5 17")
    return s.render()


def build_feature_score_simulator() -> str:
    """Thử thay đổi điều kiện: hai thanh điều chỉnh + một đường kết quả."""
    s = SvgBuilder(UI_VIEWBOX)
    # Hai thanh trượt điều chỉnh điểm / điều kiện ở nửa dưới
    s.path("M3.5 15.5 H20.5")
    s.circle(8.5, 15.5, 1.8, fill="currentColor")
    s.path("M3.5 19.5 H20.5")
    s.circle(15.5, 19.5, 1.8, fill="currentColor")
    # Đường biểu đồ kết quả phản hồi tức thì ở nửa trên
    s.path("M4 10.5 L9 7.5 L13.5 9.5 L19.5 4.5")
    s.path("M16 4.5 H19.5 V8")
    return s.render()


def build_feature_mock_score() -> str:
    """Nhập điểm thi thử: tờ bài làm + bút + một dấu kiểm nhỏ."""
    s = SvgBuilder(UI_VIEWBOX)
    # Tờ bài thi thử
    s.path("M14 20.5 H6 C4.9 20.5 4 19.6 4 18.5 V5.5 C4 4.4 4.9 3.5 6 3.5 H14.5 C15.6 3.5 16.5 4.4 16.5 5.5 V10")
    # Dấu kiểm hoàn thành bài thi ở đầu trang
    s.path("M7.5 8.5 L9.2 10.2 L12.8 6.8")
    # Dòng ghi điểm
    s.path("M7.5 14 H11.5")
    # Cây bút chấm/nhập điểm nghiêng bên phải
    s.path("M14.5 17.5 L19.2 12.8 C19.8 12.2 20.8 12.2 21.4 12.8 C22 13.4 22 14.4 21.4 15 L16.7 19.7 L13.8 20.4 Z")
    return s.render()


def build_feature_study_goal() -> str:
    """Mục tiêu học: cột mốc/đích đến + đường đi đi lên."""
    s = SvgBuilder(UI_VIEWBOX)
    # Đường lộ trình bậc thang đi lên vững chắc
    s.path("M3.5 19.5 L8.5 15.5 L12.5 17 L17.5 11")
    s.circle(3.5, 19.5, 1.2, fill="currentColor", stroke="none")
    s.circle(8.5, 15.5, 1.2, fill="currentColor", stroke="none")
    # Cột mốc cờ đích ở đỉnh lộ trình
    s.path("M17.5 19.5 V4")
    s.path("M17.5 4 L21.5 6.2 L17.5 8.5")
    return s.render()


def build_feature_weekly_plan() -> str:
    """Kế hoạch tuần: sổ lịch dạng vở với 6 ô gợi tuần và một dấu đánh dấu."""
    s = SvgBuilder(UI_VIEWBOX)
    # Khung sổ lịch tuần
    s.rect(3, 4.5, 18, 16, rx=2.5)
    s.path("M7.5 3 V5.5 M16.5 3 V5.5")
    s.path("M3 9 H21")
    # 5 ô chấm tròn biểu thị các ngày trong tuần
    s.circle(7, 13, 1, fill="currentColor", stroke="none")
    s.circle(12, 13, 1, fill="currentColor", stroke="none")
    s.circle(17, 13, 1, fill="currentColor", stroke="none")
    s.circle(7, 17, 1, fill="currentColor", stroke="none")
    s.circle(12, 17, 1, fill="currentColor", stroke="none")
    # Ngày mục tiêu có dấu kiểm hoàn thành
    s.path("M15.5 17 L16.8 18.2 L19.2 15.5")
    return s.render()


def build_feature_progress() -> str:
    """Tiến độ: ba bước tăng dần + dấu hoàn thành."""
    s = SvgBuilder(UI_VIEWBOX)
    # Ba cột tiến độ tăng dần chiều cao
    s.rect(4, 15, 3.5, 5.5, rx=1)
    s.rect(10.2, 11.5, 3.5, 9, rx=1)
    s.rect(16.5, 8, 3.5, 12.5, rx=1)
    # Dấu kiểm xác nhận tiến độ phía trên bên trái
    s.path("M4.5 8 L6.8 10.2 L11.5 5.5")
    return s.render()


def build_feature_data_source() -> str:
    """Dữ liệu có nguồn: tờ tài liệu + mắt xích/đường dẫn + dấu kiểm nhỏ."""
    s = SvgBuilder(UI_VIEWBOX)
    # Tờ tài liệu thông tin tuyển sinh chính thống
    s.path("M11 20.5 H6 C4.9 20.5 4 19.6 4 18.5 V5.5 C4 4.4 4.9 3.5 6 3.5 H15 C16.1 3.5 17 4.4 17 5.5 V11")
    # Dấu kiểm xác thực trên tài liệu
    s.path("M7.5 8.5 L9.2 10.2 L13 6.5")
    s.path("M7.5 14 H11")
    # Mắt xích liên kết dẫn nguồn ở góc dưới phải
    s.path("M14.5 17.5 H13.5 C12.1 17.5 11 16.4 11 15 C11 13.6 12.1 12.5 13.5 12.5 H15")
    s.path("M17.5 12.5 H18.5 C19.9 12.5 21 13.6 21 15 C21 16.4 19.9 17.5 18.5 17.5 H17")
    s.path("M14 15 H18")
    return s.render()


def build_feature_ai_advisor() -> str:
    """Trợ lý AI: bong bóng hội thoại mềm + ba nút liên kết/ánh sáng."""
    s = SvgBuilder(UI_VIEWBOX)
    # Bong bóng hội thoại bo tròn mềm mại
    s.path(
        "M4 12 C4 7.3 7.8 3.8 12.5 3.8 C17.2 3.8 21 7.3 21 12 "
        "C21 16.7 17.2 20.2 12.5 20.2 C10.6 20.2 8.8 19.6 7.3 18.6 "
        "L3.8 19.8 L4.8 16.2 C4.3 14.9 4 13.5 4 12 Z"
    )
    # Mạng lưới 3 nút suy luận / gợi ý thông minh bên trong
    s.path("M9.5 13.5 L12.5 9 L15.5 12.5")
    s.circle(9.5, 13.5, 1.3, fill="currentColor", stroke="none")
    s.circle(12.5, 9, 1.4, fill="currentColor", stroke="none")
    s.circle(15.5, 12.5, 1.3, fill="currentColor", stroke="none")
    return s.render()


def build_feature_companion() -> str:
    """Người đồng hành: hai người ở cùng độ cao + bong bóng góp ý."""
    s = SvgBuilder(UI_VIEWBOX)
    # Hai người đồng hành ngang hàng (cùng độ cao y=11.5)
    s.circle(7.5, 11.5, 2.2)
    s.path("M3.5 19.5 C4.2 16.8 5.6 15.8 7.5 15.8 C9.4 15.8 10.8 16.8 11.5 19.5")
    s.circle(16.5, 11.5, 2.2)
    s.path("M12.5 19.5 C13.2 16.8 14.6 15.8 16.5 15.8 C18.4 15.8 19.8 16.8 20.5 19.5")
    # Bong bóng góp ý kết nối ở chính giữa phía trên
    s.path("M9.5 3.5 H14.5 C15.6 3.5 16.5 4.4 16.5 5.5 C16.5 6.6 15.6 7.5 14.5 7.5 H13 L12 9 L11 7.5 H9.5 C8.4 7.5 7.5 6.6 7.5 5.5 C7.5 4.4 8.4 3.5 9.5 3.5 Z")
    return s.render()


def build_feature_school_program() -> str:
    """Chương trình/ngành của trường: trang giáo trình mở + điểm mốc nhỏ của trường."""
    s = SvgBuilder(UI_VIEWBOX)
    # Cuốn giáo trình mở rộng
    s.path("M3 7.5 C6 6.5 9.5 7.2 12 9 C14.5 7.2 18 6.5 21 7.5 V18.5 C18 17.5 14.5 18.2 12 20 C9.5 18.2 6 17.5 3 18.5 Z")
    s.path("M12 9 V20")
    # Dòng nội dung chương trình học bên trang trái
    s.path("M6 11.5 H9 M6 14.5 H9")
    # Cột mốc ngành học cắm trên trang phải
    s.path("M16.5 15.5 V10.5")
    s.circle(16.5, 9.5, 1.5, fill="currentColor", stroke="none")
    return s.render()


# ------------------------------------------------------------------------------
# D. BỐN NHÃN NGUYỆN VỌNG (4 FILES)
# Quy tắc: Phân biệt hoàn toàn bằng hình dáng đường đi (silhouette) ngay cả khi
# hiển thị 1 màu, không dùng khiên hay lửa.
# ------------------------------------------------------------------------------

def build_status_safe() -> str:
    """
    An toàn: Đường đi đã chạm tới một cột mốc tròn lớn có dấu kiểm bên trong.
    Silhouette: Đường dẫn ngắn từ góc trái dưới dẫn vào vòng tròn lớn có dấu kiểm.
    """
    s = SvgBuilder(UI_VIEWBOX)
    # Đường dẫn đã tiếp cận đích
    s.path("M3 18.5 C5.5 18.5 7 16 9.2 14")
    s.circle(3, 18.5, 1.3, fill="currentColor", stroke="none")
    # Cột mốc tròn vững chãi kèm dấu kiểm
    s.circle(15, 10.5, 6)
    s.path("M12.5 10.5 L14.2 12.2 L17.8 8.6")
    return s.render()


def build_status_balanced() -> str:
    """
    Vừa sức: Đường đi lượn mượt nằm gọn giữa hai vạch chuẩn trên và dưới.
    Silhouette: Hai thanh giới hạn ngang song song kẹp một đường sóng có nút tâm.
    """
    s = SvgBuilder(UI_VIEWBOX)
    # Hai vạch chuẩn giới hạn trên và dưới
    s.path("M4 5.5 H20")
    s.path("M4 18.5 H20")
    # Đường đi cân bằng nằm giữa hai chuẩn
    s.path("M3.5 14 C7.5 14 9 10 12 12 C15 14 16.5 10 20.5 10")
    # Nút cân bằng ở tâm
    s.circle(12, 12, 2, fill="currentColor")
    return s.render()


def build_status_reach() -> str:
    """
    Thử sức: Đường đi leo qua các bậc cao dần hướng tới cột mốc kim cương ở đỉnh cao.
    Silhouette: Đường bậc thang dốc lên từ trái qua phải + kim cương ở góc trên phải.
    """
    s = SvgBuilder(UI_VIEWBOX)
    # Đường bậc thang vươn lên bậc cao
    s.path("M3.5 19.5 H8.5 V14.5 H13.5 V9.5 H17.5")
    s.circle(3.5, 19.5, 1.3, fill="currentColor", stroke="none")
    # Cột mốc kim cương ở vị trí cao
    s.path("M18.5 3 L21.5 6 L18.5 9 L15.5 6 Z")
    return s.render()


def build_status_backup() -> str:
    """
    Dự phòng: Đường đi chính có một nhánh rẽ thứ hai tách ra nhưng vẫn dẫn tới cột mốc.
    Silhouette: Ngã ba phân nhánh (fork) với hai cột mốc đích riêng biệt bên phải.
    """
    s = SvgBuilder(UI_VIEWBOX)
    # Nhánh chính đi thẳng lên trên
    s.path("M3.5 12 H9.5 L13.5 7 H17.5")
    # Nhánh rẽ dự phòng tách xuống dưới nhưng vẫn tới đích
    s.path("M9.5 12 L13.5 17 H17.5")
    # Điểm xuất phát
    s.circle(3.5, 12, 1.3, fill="currentColor", stroke="none")
    # Cột mốc nhánh trên (nhỏ) và cột mốc nhánh dự phòng (vòng tròn rõ nét)
    s.circle(19.5, 7, 1.5, fill="currentColor", stroke="none")
    s.circle(19.5, 17, 2.2)
    return s.render()


# ==============================================================================
# 4. DANH MỤC 30 TÀI SẢN & METADATA MANIFEST
# ==============================================================================

IconEntry = Dict[str, Any]

ICON_CATALOG: List[Tuple[IconEntry, Callable[[], str]]] = [
    # --- A. BRAND (4) ---
    (
        {
            "name": "brand-symbol-color",
            "file": "brand/brand-symbol-color.svg",
            "category": "brand",
            "variant": "color",
            "meaning_vi": "Biểu tượng thương hiệu Nguyện Vọng AI đầy đủ màu (hai trang vở chữ V, mũ tốt nghiệp cách điệu và lộ trình AI)",
            "suggested_sizes": [32, 40, 48, 64],
            "uses_current_color": False,
            "integration_hint": "Logo đầu trang app/CMS trên nền giấy sáng hoặc thẻ trắng",
        },
        build_brand_symbol_color,
    ),
    (
        {
            "name": "brand-symbol-mono",
            "file": "brand/brand-symbol-mono.svg",
            "category": "brand",
            "variant": "mono",
            "meaning_vi": "Biểu tượng thương hiệu Nguyện Vọng AI đơn sắc tối giản dùng currentColor",
            "suggested_sizes": [16, 20, 24, 32],
            "uses_current_color": True,
            "integration_hint": "Logo đầu trang app/CMS ở chế độ đơn sắc, watermark phiếu in hoặc nút thu gọn",
        },
        build_brand_symbol_mono,
    ),
    (
        {
            "name": "favicon",
            "file": "brand/favicon.svg",
            "category": "brand",
            "variant": "color",
            "meaning_vi": "Biểu tượng favicon nền vuông bo góc xanh mực, tối ưu độ rõ ở kích thước 16x16",
            "suggested_sizes": [16, 32, 48, 64],
            "uses_current_color": False,
            "integration_hint": "Favicon trình duyệt cho đầu trang app/CMS",
        },
        build_favicon,
    ),
    (
        {
            "name": "app-icon-master",
            "file": "brand/app-icon-master.svg",
            "category": "brand",
            "variant": "color",
            "meaning_vi": "Biểu tượng ứng dụng gốc độ phân giải cao 512x512 dùng để xuất PWA icon 192px và 512px",
            "suggested_sizes": [192, 512],
            "uses_current_color": False,
            "integration_hint": "Biểu tượng cài đặt PWA trên màn hình chính điện thoại và splash screen của app",
        },
        build_app_icon_master,
    ),
    # --- B. NAVIGATION (10) ---
    (
        {
            "name": "nav-today",
            "file": "navigation/nav-today.svg",
            "category": "navigation",
            "variant": "outline",
            "meaning_vi": "Tab Hôm nay (trạng thái thường): trang sổ lịch hôm nay kèm dấu hoàn thành",
            "suggested_sizes": [20, 22, 24],
            "uses_current_color": True,
            "integration_hint": "Tab Hôm nay trên thanh điều hướng chính (bottom navigation / sidebar)",
        },
        build_nav_today_outline,
    ),
    (
        {
            "name": "nav-today-active",
            "file": "navigation/nav-today-active.svg",
            "category": "navigation",
            "variant": "active",
            "meaning_vi": "Tab Hôm nay (trạng thái đang chọn): trang sổ lịch hôm nay có đầu trang và huy hiệu tô đặc",
            "suggested_sizes": [20, 22, 24],
            "uses_current_color": True,
            "integration_hint": "Tab Hôm nay khi đang kích hoạt trên thanh điều hướng chính",
        },
        build_nav_today_active,
    ),
    (
        {
            "name": "nav-explore",
            "file": "navigation/nav-explore.svg",
            "category": "navigation",
            "variant": "outline",
            "meaning_vi": "Tab Khám phá (trạng thái thường): kính tìm kiếm kết hợp đường chân trời ngành học",
            "suggested_sizes": [20, 22, 24],
            "uses_current_color": True,
            "integration_hint": "Tab Khám phá trên thanh điều hướng chính",
        },
        build_nav_explore_outline,
    ),
    (
        {
            "name": "nav-explore-active",
            "file": "navigation/nav-explore-active.svg",
            "category": "navigation",
            "variant": "active",
            "meaning_vi": "Tab Khám phá (trạng thái đang chọn): kính tìm kiếm có miền chân trời tô đặc",
            "suggested_sizes": [20, 22, 24],
            "uses_current_color": True,
            "integration_hint": "Tab Khám phá khi đang kích hoạt trên thanh điều hướng chính",
        },
        build_nav_explore_active,
    ),
    (
        {
            "name": "nav-preferences",
            "file": "navigation/nav-preferences.svg",
            "category": "navigation",
            "variant": "outline",
            "meaning_vi": "Tab Nguyện vọng (trạng thái thường): ba phiếu nguyện vọng xếp lớp kèm điểm nhấn tim nhỏ",
            "suggested_sizes": [20, 22, 24],
            "uses_current_color": True,
            "integration_hint": "Tab Nguyện vọng trên thanh điều hướng chính",
        },
        build_nav_preferences_outline,
    ),
    (
        {
            "name": "nav-preferences-active",
            "file": "navigation/nav-preferences-active.svg",
            "category": "navigation",
            "variant": "active",
            "meaning_vi": "Tab Nguyện vọng (trạng thái đang chọn): phiếu nguyện vọng đầu tô đặc nổi bật trên các lớp phiếu",
            "suggested_sizes": [20, 22, 24],
            "uses_current_color": True,
            "integration_hint": "Tab Nguyện vọng khi đang kích hoạt trên thanh điều hướng chính",
        },
        build_nav_preferences_active,
    ),
    (
        {
            "name": "nav-plan",
            "file": "navigation/nav-plan.svg",
            "category": "navigation",
            "variant": "outline",
            "meaning_vi": "Tab Kế hoạch (trạng thái thường): sổ lịch tuần kết hợp nét đường đi tiến bộ",
            "suggested_sizes": [20, 22, 24],
            "uses_current_color": True,
            "integration_hint": "Tab Kế hoạch trên thanh điều hướng chính",
        },
        build_nav_plan_outline,
    ),
    (
        {
            "name": "nav-plan-active",
            "file": "navigation/nav-plan-active.svg",
            "category": "navigation",
            "variant": "active",
            "meaning_vi": "Tab Kế hoạch (trạng thái đang chọn): sổ lịch tuần có cột mốc tô đặc và đường đi đậm",
            "suggested_sizes": [20, 22, 24],
            "uses_current_color": True,
            "integration_hint": "Tab Kế hoạch khi đang kích hoạt trên thanh điều hướng chính",
        },
        build_nav_plan_active,
    ),
    (
        {
            "name": "nav-ho-so",
            "file": "navigation/nav-ho-so.svg",
            "category": "navigation",
            "variant": "outline",
            "meaning_vi": "Tab Hồ sơ (trạng thái thường): thẻ hồ sơ gấp góc kèm chân dung học sinh tối giản",
            "suggested_sizes": [20, 22, 24],
            "uses_current_color": True,
            "integration_hint": "Tab Hồ sơ trên thanh điều hướng chính",
        },
        build_nav_profile_outline,
    ),
    (
        {
            "name": "nav-ho-so-active",
            "file": "navigation/nav-ho-so-active.svg",
            "category": "navigation",
            "variant": "active",
            "meaning_vi": "Tab Hồ sơ (trạng thái đang chọn): thẻ hồ sơ với chân dung và góc gấp tô đặc",
            "suggested_sizes": [20, 22, 24],
            "uses_current_color": True,
            "integration_hint": "Tab Hồ sơ khi đang kích hoạt trên thanh điều hướng chính",
        },
        build_nav_profile_active,
    ),
    # --- C. FEATURES (12) ---
    (
        {
            "name": "feature-career-fit",
            "file": "features/feature-career-fit.svg",
            "category": "feature",
            "variant": "outline",
            "meaning_vi": "Định hướng mức độ phù hợp ngành học: cột mốc mục tiêu đặt trên trang vở mở",
            "suggested_sizes": [18, 20, 24],
            "uses_current_color": True,
            "integration_hint": "Thẻ khám phá ngành nghề và mức độ phù hợp trong tab Khám phá",
        },
        build_feature_career_fit,
    ),
    (
        {
            "name": "feature-school-filter",
            "file": "features/feature-school-filter.svg",
            "category": "feature",
            "variant": "outline",
            "meaning_vi": "Bộ lọc trường theo điểm, học phí và khu vực: trường học tối giản kèm hai thanh lọc",
            "suggested_sizes": [18, 20, 24],
            "uses_current_color": True,
            "integration_hint": "Thẻ khám phá và thanh công cụ lọc trường đại học/cao đẳng",
        },
        build_feature_school_filter,
    ),
    (
        {
            "name": "feature-preference-ranking",
            "file": "features/feature-preference-ranking.svg",
            "category": "feature",
            "variant": "outline",
            "meaning_vi": "Sắp xếp thứ tự ưu tiên nguyện vọng: các phiếu xếp tầng và trục mũi tên hai chiều",
            "suggested_sizes": [18, 20, 24],
            "uses_current_color": True,
            "integration_hint": "Khu vực kéo thả và sắp xếp danh sách trong tab Nguyện vọng",
        },
        build_feature_preference_ranking,
    ),
    (
        {
            "name": "feature-score-simulator",
            "file": "features/feature-score-simulator.svg",
            "category": "feature",
            "variant": "outline",
            "meaning_vi": "Giả lập thay đổi điểm và điều kiện xét tuyển: hai thanh trượt và đường kết quả",
            "suggested_sizes": [18, 20, 24],
            "uses_current_color": True,
            "integration_hint": "Thẻ tình huống giả lập điểm số và tổ hợp môn trong tab Nguyện vọng",
        },
        build_feature_score_simulator,
    ),
    (
        {
            "name": "feature-mock-score",
            "file": "features/feature-mock-score.svg",
            "category": "feature",
            "variant": "outline",
            "meaning_vi": "Nhập và quản lý điểm thi thử: tờ bài làm có dấu kiểm kèm cây bút",
            "suggested_sizes": [18, 20, 24],
            "uses_current_color": True,
            "integration_hint": "Thẻ nhập điểm thi thử và bảng điểm học bạ trong tab Hồ sơ và Hôm nay",
        },
        build_feature_mock_score,
    ),
    (
        {
            "name": "feature-study-goal",
            "file": "features/feature-study-goal.svg",
            "category": "feature",
            "variant": "outline",
            "meaning_vi": "Mục tiêu học tập: đường lộ trình đi lên chạm cột mốc cờ đích",
            "suggested_sizes": [18, 20, 24],
            "uses_current_color": True,
            "integration_hint": "Thẻ thiết lập mục tiêu điểm số trong tab Kế hoạch và Hôm nay",
        },
        build_feature_study_goal,
    ),
    (
        {
            "name": "feature-weekly-plan",
            "file": "features/feature-weekly-plan.svg",
            "category": "feature",
            "variant": "outline",
            "meaning_vi": "Kế hoạch học tập theo tuần: sổ lịch tuần kèm các điểm nhiệm vụ và dấu hoàn thành",
            "suggested_sizes": [18, 20, 24],
            "uses_current_color": True,
            "integration_hint": "Thẻ lịch học tuần và phân bổ thời gian ôn tập trong tab Kế hoạch",
        },
        build_feature_weekly_plan,
    ),
    (
        {
            "name": "feature-progress",
            "file": "features/feature-progress.svg",
            "category": "feature",
            "variant": "outline",
            "meaning_vi": "Theo dõi tiến độ học tập: ba bậc tiến triển tăng dần kèm dấu kiểm hoàn thành",
            "suggested_sizes": [18, 20, 24],
            "uses_current_color": True,
            "integration_hint": "Thẻ theo dõi tiến độ ôn tập trong tab Hôm nay và Kế hoạch",
        },
        build_feature_progress,
    ),
    (
        {
            "name": "feature-data-source",
            "file": "features/feature-data-source.svg",
            "category": "feature",
            "variant": "outline",
            "meaning_vi": "Nguồn dữ liệu tuyển sinh minh bạch: tài liệu xác thực kèm mắt xích dẫn nguồn",
            "suggested_sizes": [16, 18, 20, 24],
            "uses_current_color": True,
            "integration_hint": "Thẻ nguồn dữ liệu đề án tuyển sinh và chú thích xuất xứ điểm chuẩn",
        },
        build_feature_data_source,
    ),
    (
        {
            "name": "feature-ai-advisor",
            "file": "features/feature-ai-advisor.svg",
            "category": "feature",
            "variant": "outline",
            "meaning_vi": "Trợ lý AI giải thích và tư vấn: bong bóng hội thoại mềm chứa cụm 3 nút liên kết",
            "suggested_sizes": [20, 22, 24],
            "uses_current_color": True,
            "integration_hint": "Nút nổi trợ lý AI và khung giải thích kết quả thuật toán",
        },
        build_feature_ai_advisor,
    ),
    (
        {
            "name": "feature-companion",
            "file": "features/feature-companion.svg",
            "category": "feature",
            "variant": "outline",
            "meaning_vi": "Người đồng hành cùng xem và góp ý: hai người ngang hàng kèm bong bóng trao đổi",
            "suggested_sizes": [18, 20, 24],
            "uses_current_color": True,
            "integration_hint": "Thẻ chia sẻ cho người đồng hành (phụ huynh, giáo viên, anh chị) trong tab Hồ sơ và Nguyện vọng",
        },
        build_feature_companion,
    ),
    (
        {
            "name": "feature-school-program",
            "file": "features/feature-school-program.svg",
            "category": "feature",
            "variant": "outline",
            "meaning_vi": "Chương trình đào tạo của trường: cuốn giáo trình mở kèm cột mốc ngành học",
            "suggested_sizes": [18, 20, 24],
            "uses_current_color": True,
            "integration_hint": "Thẻ chi tiết ngành/chương trình đào tạo trong trang thông tin trường",
        },
        build_feature_school_program,
    ),
    # --- D. STATUS (4) ---
    (
        {
            "name": "status-safe",
            "file": "status/status-safe.svg",
            "category": "status",
            "variant": "outline",
            "meaning_vi": "Nhãn An toàn: đường đi đã chạm tới cột mốc có dấu kiểm xác nhận",
            "suggested_sizes": [16, 18, 20],
            "uses_current_color": True,
            "integration_hint": "Nhãn An toàn trên thẻ nguyện vọng và bảng đối chiếu điểm",
        },
        build_status_safe,
    ),
    (
        {
            "name": "status-balanced",
            "file": "status/status-balanced.svg",
            "category": "status",
            "variant": "outline",
            "meaning_vi": "Nhãn Vừa sức: đường đi ổn định nằm giữa hai vạch chuẩn cân bằng",
            "suggested_sizes": [16, 18, 20],
            "uses_current_color": True,
            "integration_hint": "Nhãn Vừa sức trên thẻ nguyện vọng và bảng đối chiếu điểm",
        },
        build_status_balanced,
    ),
    (
        {
            "name": "status-reach",
            "file": "status/status-reach.svg",
            "category": "status",
            "variant": "outline",
            "meaning_vi": "Nhãn Thử sức: đường bậc thang vươn lên cột mốc cao hơn",
            "suggested_sizes": [16, 18, 20],
            "uses_current_color": True,
            "integration_hint": "Nhãn Thử sức trên thẻ nguyện vọng và bảng đối chiếu điểm",
        },
        build_status_reach,
    ),
    (
        {
            "name": "status-backup",
            "file": "status/status-backup.svg",
            "category": "status",
            "variant": "outline",
            "meaning_vi": "Nhãn Dự phòng: đường rẽ thứ hai tách nhánh nhưng vẫn dẫn tới cột mốc đích",
            "suggested_sizes": [16, 18, 20],
            "uses_current_color": True,
            "integration_hint": "Nhãn Dự phòng trên thẻ nguyện vọng và bảng đối chiếu điểm",
        },
        build_status_backup,
    ),
]


# ==============================================================================
# 5. SINH FILE PREVIEW.HTML & README.MD
# ==============================================================================

def generate_preview_html(
    manifest_data: List[IconEntry], svg_map: Dict[str, str]
) -> str:
    """Tạo trang preview.html chạy hoàn toàn offline, nhúng trực tiếp 30 SVG."""

    def embed(rel_path: str, cls: str = "") -> str:
        raw = svg_map[rel_path].strip()
        if cls:
            raw = raw.replace("<svg ", f'<svg class="{html.escape(cls)}" ', 1)
        return raw

    # Khu vực kiểm tra thương hiệu
    brand_cards_html = []
    for item in manifest_data:
        if item["category"] != "brand":
            continue
        f = item["file"]
        brand_cards_html.append(
            f"""
            <div class="card">
              <div class="brand-stage-grid">
                <div class="stage bg-white" title="Nền trắng #FFFFFF">
                  <div class="sz-64">{embed(f)}</div>
                </div>
                <div class="stage bg-soft" title="Nền xanh nhạt #E9EEFB">
                  <div class="sz-64">{embed(f)}</div>
                </div>
                <div class="stage bg-ink" title="Nền xanh mực #2448C4">
                  <div class="sz-64" style="color:#FFFFFF">{embed(f)}</div>
                </div>
              </div>
              <div class="favicon-strip">
                <span class="strip-label">Kiểm tra cỡ nhỏ (16 / 32 / 64px):</span>
                <div class="sz-16">{embed(f)}</div>
                <div class="sz-32">{embed(f)}</div>
                <div class="sz-64">{embed(f)}</div>
              </div>
              <div class="meta">
                <code>{html.escape(f)}</code>
                <p>{html.escape(item["meaning_vi"])}</p>
              </div>
            </div>
            """
        )

    # Khu vực đối chiếu 5 cặp Navigation Outline vs Active
    nav_pairs = [
        ("Hôm nay", "navigation/nav-today.svg", "navigation/nav-today-active.svg"),
        ("Khám phá", "navigation/nav-explore.svg", "navigation/nav-explore-active.svg"),
        ("Nguyện vọng", "navigation/nav-preferences.svg", "navigation/nav-preferences-active.svg"),
        ("Kế hoạch", "navigation/nav-plan.svg", "navigation/nav-plan-active.svg"),
        ("Hồ sơ", "navigation/nav-ho-so.svg", "navigation/nav-ho-so-active.svg"),
    ]

    nav_pair_cards = []
    for label, out_file, act_file in nav_pairs:
        nav_pair_cards.append(
            f"""
            <div class="card">
              <div class="pair-header">{html.escape(label)}</div>
              <div class="pair-compare">
                <div class="pair-col">
                  <span class="badge">Outline</span>
                  <div class="size-row">
                    <div class="sz-16">{embed(out_file)}</div>
                    <div class="sz-20">{embed(out_file)}</div>
                    <div class="sz-24">{embed(out_file)}</div>
                    <div class="sz-32">{embed(out_file)}</div>
                    <div class="sz-48">{embed(out_file)}</div>
                  </div>
                  <code>{html.escape(out_file)}</code>
                </div>
                <div class="pair-col active-col">
                  <span class="badge badge-active">Active</span>
                  <div class="size-row">
                    <div class="sz-16">{embed(act_file)}</div>
                    <div class="sz-20">{embed(act_file)}</div>
                    <div class="sz-24">{embed(act_file)}</div>
                    <div class="sz-32">{embed(act_file)}</div>
                    <div class="sz-48">{embed(act_file)}</div>
                  </div>
                  <code>{html.escape(act_file)}</code>
                </div>
              </div>
            </div>
            """
        )

    # Mô phỏng 5 thanh Bottom Navigation 390px với từng tab active lần lượt
    bottom_nav_sims = []
    for active_idx in range(len(nav_pairs)):
        tabs_html = []
        for idx, (label, out_f, act_f) in enumerate(nav_pairs):
            is_act = idx == active_idx
            chosen_f = act_f if is_act else out_f
            cls = "sim-tab active" if is_act else "sim-tab"
            tabs_html.append(
                f"""
                <div class="{cls}">
                  <div class="sz-24">{embed(chosen_f)}</div>
                  <span>{html.escape(label)}</span>
                </div>
                """
            )
        bottom_nav_sims.append(
            f"""
            <div class="phone-bar">
              {''.join(tabs_html)}
            </div>
            """
        )

    # Khu vực toàn bộ Icon UI (Navigation, Features, Status) với đủ 5 kích thước & 5 màu
    ui_cards_html = []
    for item in manifest_data:
        if item["category"] == "brand":
            continue
        f = item["file"]
        ui_cards_html.append(
            f"""
            <div class="card ui-card">
              <div class="ui-top">
                <span class="cat-tag">{html.escape(item["category"])} · {html.escape(item["variant"])}</span>
                <code>{html.escape(f)}</code>
              </div>
              <p class="meaning">{html.escape(item["meaning_vi"])}</p>
              <div class="size-strip" title="Kích thước: 16, 20, 24, 32, 48px">
                <div class="sz-item"><div class="sz-16">{embed(f)}</div><span>16</span></div>
                <div class="sz-item"><div class="sz-20">{embed(f)}</div><span>20</span></div>
                <div class="sz-item"><div class="sz-24">{embed(f)}</div><span>24</span></div>
                <div class="sz-item"><div class="sz-32">{embed(f)}</div><span>32</span></div>
                <div class="sz-item"><div class="sz-48">{embed(f)}</div><span>48</span></div>
              </div>
              <div class="color-strip" title="Kiểm tra currentColor trên 5 màu hệ thống">
                <div class="c-swatch c-ink"><div class="sz-24">{embed(f)}</div><span>#2448C4</span></div>
                <div class="c-swatch c-title"><div class="sz-24">{embed(f)}</div><span>#131C3F</span></div>
                <div class="c-swatch c-green"><div class="sz-24">{embed(f)}</div><span>#107A5F</span></div>
                <div class="c-swatch c-amber"><div class="sz-24">{embed(f)}</div><span>#8A5100</span></div>
                <div class="c-swatch c-purple"><div class="sz-24">{embed(f)}</div><span>#6A4FD6</span></div>
              </div>
              <div class="hint">Vị trí: {html.escape(item["integration_hint"])}</div>
            </div>
            """
        )

    return f"""<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Nguyện Vọng AI — Bộ 30 Biểu Tượng SVG</title>
  <style>
    :root {{
      --bg-page: #F5F7FA;
      --bg-card: #FFFFFF;
      --ink-main: #2448C4;
      --ink-dark: #1A348F;
      --ink-soft: #E9EEFB;
      --text-title: #131C3F;
      --trust-green: #107A5F;
      --warm-amber: #8A5100;
      --accent-purple: #6A4FD6;
      --border-soft: #DCE3F2;
    }}
    * {{ box-sizing: border-box; }}
    body {{
      margin: 0;
      padding: 32px 20px 64px;
      background: var(--bg-page);
      color: var(--text-title);
      font-family: "Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      line-height: 1.5;
    }}
    .container {{
      max-width: 1240px;
      margin: 0 auto;
    }}
    header {{
      background: var(--bg-card);
      border: 1px solid var(--border-soft);
      border-radius: 16px;
      padding: 24px 28px;
      margin-bottom: 32px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 16px;
    }}
    .header-brand {{
      display: flex;
      align-items: center;
      gap: 16px;
    }}
    h1 {{
      margin: 0;
      font-size: 22px;
      color: var(--text-title);
    }}
    .sub {{
      margin: 4px 0 0;
      font-size: 14px;
      color: #4A5578;
    }}
    h2 {{
      font-size: 18px;
      margin: 36px 0 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid var(--ink-soft);
      color: var(--ink-dark);
    }}
    .grid-brand {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;
    }}
    .grid-pairs {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
      gap: 16px;
    }}
    .grid-ui {{
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 16px;
    }}
    .card {{
      background: var(--bg-card);
      border: 1px solid var(--border-soft);
      border-radius: 14px;
      padding: 18px;
    }}
    .brand-stage-grid {{
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-bottom: 12px;
    }}
    .stage {{
      height: 92px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid var(--border-soft);
    }}
    .bg-white {{ background: #FFFFFF; color: var(--ink-main); }}
    .bg-soft {{ background: #E9EEFB; color: var(--ink-main); }}
    .bg-ink {{ background: #2448C4; color: #FFFFFF; }}
    .favicon-strip {{
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 10px 12px;
      background: var(--bg-page);
      border-radius: 10px;
      margin-bottom: 12px;
    }}
    .strip-label {{
      font-size: 12px;
      color: #4A5578;
      margin-right: auto;
    }}
    .meta code, .pair-col code, .ui-top code {{
      display: inline-block;
      font-size: 12px;
      background: var(--ink-soft);
      color: var(--ink-dark);
      padding: 2px 8px;
      border-radius: 6px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    }}
    .meta p, .meaning {{
      margin: 8px 0 0;
      font-size: 13px;
      color: #364163;
    }}
    .pair-header {{
      font-weight: 700;
      font-size: 15px;
      margin-bottom: 12px;
      color: var(--text-title);
    }}
    .pair-compare {{
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }}
    .pair-col {{
      background: var(--bg-page);
      padding: 12px;
      border-radius: 10px;
      color: #4A5578;
    }}
    .pair-col.active-col {{
      background: #F0F4FF;
      color: var(--ink-main);
    }}
    .badge {{
      display: inline-block;
      font-size: 11px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 99px;
      background: #E2E8F0;
      color: #334155;
      margin-bottom: 10px;
    }}
    .badge-active {{
      background: var(--ink-main);
      color: #FFFFFF;
    }}
    .size-row {{
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
      flex-wrap: wrap;
    }}
    .sim-wrapper {{
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      margin-top: 12px;
    }}
    .phone-bar {{
      width: 390px;
      background: #FFFFFF;
      border: 1px solid var(--border-soft);
      border-radius: 16px;
      padding: 10px 8px;
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      box-shadow: 0 2px 6px rgba(19, 28, 63, 0.04);
    }}
    .sim-tab {{
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      color: #5A6587;
      font-size: 11px;
      font-weight: 500;
    }}
    .sim-tab.active {{
      color: var(--ink-main);
      font-weight: 700;
    }}
    .ui-top {{
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }}
    .cat-tag {{
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      font-weight: 700;
      color: var(--ink-main);
    }}
    .size-strip {{
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      background: var(--bg-page);
      padding: 12px 14px;
      border-radius: 10px;
      margin: 12px 0;
      color: var(--text-title);
    }}
    .sz-item {{
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    }}
    .sz-item span {{
      font-size: 11px;
      color: #5A6587;
    }}
    .color-strip {{
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 6px;
      margin-bottom: 10px;
    }}
    .c-swatch {{
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 8px 4px;
      border-radius: 8px;
      background: #F8FAFC;
      border: 1px solid #EEF2F9;
    }}
    .c-swatch span {{
      font-size: 10px;
      font-family: ui-monospace, monospace;
      color: #4A5578;
    }}
    .c-ink {{ color: #2448C4; }}
    .c-title {{ color: #131C3F; }}
    .c-green {{ color: #107A5F; }}
    .c-amber {{ color: #8A5100; }}
    .c-purple {{ color: #6A4FD6; }}
    .hint {{
      font-size: 12px;
      color: #5A6587;
      border-top: 1px dashed var(--border-soft);
      padding-top: 8px;
    }}
    .sz-16 svg {{ width: 16px; height: 16px; display: block; }}
    .sz-20 svg {{ width: 20px; height: 20px; display: block; }}
    .sz-24 svg {{ width: 24px; height: 24px; display: block; }}
    .sz-32 svg {{ width: 32px; height: 32px; display: block; }}
    .sz-48 svg {{ width: 48px; height: 48px; display: block; }}
    .sz-64 svg {{ width: 64px; height: 64px; display: block; }}
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="header-brand">
        <div class="sz-48">{embed("brand/brand-symbol-color.svg")}</div>
        <div>
          <h1>Nguyện Vọng AI — Hệ Thống 30 Biểu Tượng SVG</h1>
          <p class="sub">Phong cách: Vở ô ly · Mực xanh (#2448C4) · Chuẩn nét 1.9px · Hỗ trợ currentColor</p>
        </div>
      </div>
    </header>

    <h2>A. Tài sản Thương hiệu &amp; Favicon (4 file)</h2>
    <div class="grid-brand">
      {''.join(brand_cards_html)}
    </div>

    <h2>B. Mô phỏng Bottom Navigation (Rộng 390px · 5 trạng thái Active)</h2>
    <div class="sim-wrapper">
      {''.join(bottom_nav_sims)}
    </div>

    <h2>C. Đối chiếu trực tiếp Outline &amp; Active (10 file điều hướng)</h2>
    <div class="grid-pairs">
      {''.join(nav_pair_cards)}
    </div>

    <h2>D. Chi tiết toàn bộ Icon Giao diện ở 16 / 20 / 24 / 32 / 48px &amp; 5 màu (26 file UI)</h2>
    <div class="grid-ui">
      {''.join(ui_cards_html)}
    </div>
  </div>
</body>
</html>
"""


def generate_readme_md() -> str:
    """Tạo file README.md hướng dẫn tích hợp bằng tiếng Việt."""
    return """# Bộ Biểu Tượng SVG — Nguyện Vọng AI

Thư mục này chứa 30 tài sản SVG chính thức của ứng dụng **Nguyện Vọng AI** (phong cách *Vở ô ly · Mực xanh*), được sinh tự động bằng script Python.

## 1. Cách chạy script sinh icon

Từ thư mục gốc chứa script, chạy lệnh:

```bash
python generate_nguyen_vong_icons.py
```

Kết quả được ghi vào `generated/nguyen-vong-icons/` theo bốn nhóm:

- `brand/`: biểu tượng thương hiệu, favicon và app icon master.
- `navigation/`: năm tab chính, mỗi tab có outline và active.
- `features/`: biểu tượng nghiệp vụ tuyển sinh và học tập.
- `status/`: bốn nhãn nguyện vọng.

`manifest.json` mô tả ý nghĩa và vị trí tích hợp. `preview.html` cho phép xem toàn bộ icon offline.

## 2. Quy tắc tích hợp

- Icon giao diện dùng `currentColor`; đặt màu bằng CSS của phần tử cha.
- Logo dùng file màu trong `brand/`.
- Icon trang trí cạnh chữ nên có `aria-hidden="true"`.
- Nút chỉ có icon phải nhận `aria-label` từ React/HTML theo đúng ngữ cảnh.
- Không đặt `title` cố định trong SVG tái sử dụng.
- Khi cần sửa hình học, sửa generator rồi chạy lại thay vì chỉnh từng SVG.
"""


# ==============================================================================
# 6. KIỂM TRA VÀ GHI FILE
# ==============================================================================

def _local_name(tag: str) -> str:
    return tag.rsplit("}", 1)[-1]


def validate_svg(rel_path: str, svg: str, is_brand: bool) -> None:
    data = svg.encode("utf-8")
    if not data or len(data) >= 12 * 1024:
        raise ValueError(f"{rel_path}: SVG rỗng hoặc vượt 12 KB")
    try:
        root = ET.fromstring(svg)
    except ET.ParseError as exc:
        raise ValueError(f"{rel_path}: XML không hợp lệ: {exc}") from exc

    expected_view_box = (
        "0 0 512 512" if rel_path.endswith("app-icon-master.svg")
        else "0 0 64 64" if rel_path in {
            "brand/brand-symbol-color.svg", "brand/favicon.svg"
        }
        else UI_VIEWBOX
    )
    if root.attrib.get("viewBox") != expected_view_box:
        raise ValueError(f"{rel_path}: viewBox phải là {expected_view_box}")

    forbidden_attrs = {"onload", "onclick", "onerror", "href", "xlink:href"}
    for element in root.iter():
        name = _local_name(element.tag)
        if name in FORBIDDEN_TAGS:
            raise ValueError(f"{rel_path}: chứa tag bị cấm <{name}>")
        for attr, value in element.attrib.items():
            attr_name = _local_name(attr).lower()
            value_lower = value.lower()
            if attr_name in forbidden_attrs or value_lower.startswith(("http:", "https:", "data:")):
                raise ValueError(f"{rel_path}: chứa thuộc tính/liên kết bị cấm")

    if re.search(r"[\U0001F300-\U0001FAFF]", svg):
        raise ValueError(f"{rel_path}: chứa emoji")

    hex_colors = {value.upper() for value in re.findall(r"#[0-9A-Fa-f]{6}", svg)}
    if is_brand:
        invalid = hex_colors - ALLOWED_BRAND_COLORS
        if invalid:
            raise ValueError(f"{rel_path}: màu ngoài palette: {sorted(invalid)}")
    else:
        if hex_colors:
            raise ValueError(f"{rel_path}: icon UI không được khóa màu hex")
        if "currentColor" not in svg:
            raise ValueError(f"{rel_path}: icon UI phải dùng currentColor")


def validate_all(manifest_data: List[IconEntry], svg_map: Dict[str, str]) -> None:
    if len(ICON_CATALOG) != 30 or len(svg_map) != 30:
        raise ValueError(f"Cần đúng 30 SVG, hiện có {len(svg_map)}")
    if len(manifest_data) != 30:
        raise ValueError(f"Manifest cần đúng 30 mục, hiện có {len(manifest_data)}")

    names = [str(item["name"]) for item in manifest_data]
    files = [str(item["file"]) for item in manifest_data]
    if len(names) != len(set(names)) or len(files) != len(set(files)):
        raise ValueError("Manifest có name hoặc file trùng nhau")
    if set(files) != set(svg_map):
        raise ValueError("Danh sách file trong manifest không khớp SVG đã sinh")

    for item in manifest_data:
        rel_path = str(item["file"])
        path = pathlib.PurePosixPath(rel_path)
        if path.is_absolute() or ".." in path.parts:
            raise ValueError(f"Đường dẫn không an toàn: {rel_path}")
        validate_svg(rel_path, svg_map[rel_path], item["category"] == "brand")

    for stem in ("today", "explore", "preferences", "plan", "ho-so"):
        outline = ET.fromstring(svg_map[f"navigation/nav-{stem}.svg"])
        active = ET.fromstring(svg_map[f"navigation/nav-{stem}-active.svg"])
        if outline.attrib.get("viewBox") != active.attrib.get("viewBox"):
            raise ValueError(f"Cặp navigation {stem} không cùng viewBox")


def main() -> int:
    manifest_data: List[IconEntry] = []
    svg_map: Dict[str, str] = {}
    for metadata, builder in ICON_CATALOG:
        item = dict(metadata)
        rel_path = str(item["file"])
        manifest_data.append(item)
        svg_map[rel_path] = builder()

    validate_all(manifest_data, svg_map)

    # Mỗi lần sinh là một bộ sạch, không giữ lại tệp đã bị đổi tên hoặc loại bỏ.
    if OUTPUT_ROOT.exists():
        shutil.rmtree(OUTPUT_ROOT)
    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    for rel_path, svg in svg_map.items():
        destination = OUTPUT_ROOT / pathlib.PurePosixPath(rel_path)
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_text(svg, encoding="utf-8", newline="\n")

    (OUTPUT_ROOT / "manifest.json").write_text(
        json.dumps(manifest_data, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
        newline="\n",
    )
    (OUTPUT_ROOT / "preview.html").write_text(
        generate_preview_html(manifest_data, svg_map),
        encoding="utf-8",
        newline="\n",
    )
    (OUTPUT_ROOT / "README.md").write_text(
        generate_readme_md(), encoding="utf-8", newline="\n"
    )

    total_size = sum(len(svg.encode("utf-8")) for svg in svg_map.values())
    print(f"Đã sinh {len(svg_map)} SVG ({total_size} bytes) tại {OUTPUT_ROOT}")
    for rel_path in sorted(svg_map):
        digest = hashlib.sha256(svg_map[rel_path].encode("utf-8")).hexdigest()
        print(f"{digest}  {rel_path}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"Lỗi sinh icon: {exc}", file=sys.stderr)
        raise

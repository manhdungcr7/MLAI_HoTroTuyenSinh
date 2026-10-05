"""Xuất danh mục chương trình thật (từ pipeline trong legacy/) sang src/data/du-lieu-that.json cho app mới.

    python scripts/xuat-du-lieu-that.py

Mỗi dòng là một (trường, ngành, phương thức xét tuyển); mỗi ngành chỉ giữ phương thức cho điểm cao nhất ở bước làm sạch.
Chỉ có số liệu đo được từ đề án: điểm chuẩn từng năm, tổ hợp, tỉnh, nguồn. Học phí và việc làm không có thì để trống, không điền số giả.
"""
from __future__ import annotations

import hashlib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "legacy" / "frontend" / "src" / "data" / "programs-catalog.json"
OUT = ROOT / "src" / "data" / "du-lieu-that.json"

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

# Nhóm ngành của dữ liệu -> nhóm ngành ở bước tạo hồ sơ (src/features/khoi-dau/lua-chon.ts)
KEY = [
    ("Logistics", r"logistics|chuỗi cung ứng"),
    ("Marketing", r"marketing|thương mại điện tử|truyền thông|quan hệ công chúng"),
    ("Tài chính", r"tài chính|ngân hàng|kế toán|kiểm toán|bảo hiểm|thuế"),
    ("Xây dựng", r"xây dựng|giao thông|cầu đường|kiến trúc công trình|quản lý đô thị|trắc địa|thủy lợi|cấp thoát nước"),
    ("Điều dưỡng", r"điều dưỡng|xét nghiệm|y tế công cộng|hộ sinh|phục hồi chức năng|dinh dưỡng|hình ảnh y học|y học dự phòng"),
    ("Báo chí", r"báo chí|truyền thông đa phương tiện|xuất bản"),
    ("Thiết kế", r"thiết kế|mỹ thuật|đồ họa|nội thất|thời trang|hội họa|điện ảnh|nhiếp ảnh"),
]
GROUP = {
    "cntt": "CNTT", "ky_thuat": "Kỹ thuật", "kinh_te": "Kinh tế", "luat": "Luật", "ngon_ngu": "Ngôn ngữ", "y_duoc": "Y Dược",
    "su_pham": "Sư phạm", "xa_hoi": "Xã hội", "du_lich": "Du lịch", "nong_lam": "Nông Lâm", "kien_truc": "Kiến trúc", "the_thao": "Thể thao",
}


def nhom_nganh(name: str, group: str) -> str:
    low = name.lower()
    base = GROUP.get(group, "Khác")
    if group in ("kinh_te", "ky_thuat", "xa_hoi", "other", "kien_truc"):
        for label, pattern in KEY:
            if re.search(pattern, low) and (label != "Điều dưỡng") and (label != "Báo chí" or group in ("xa_hoi", "other")):
                if label == "Xây dựng" and group == "kinh_te":
                    continue
                return label
    if group == "y_duoc" and re.search(KEY[4][1], low):
        return "Điều dưỡng"
    if group == "other":
        return "Kỹ thuật" if re.search(r"kỹ thuật|công nghệ|cơ khí|điện|tự động", low) else "Xã hội"
    return base


def main() -> None:
    raw = json.loads(SRC.read_text(encoding="utf-8"))
    rows = raw if isinstance(raw, list) else next(v for v in raw.values() if isinstance(v, list))
    out = []
    for r in rows:
        cutoffs = {y: v for y, v in (r.get("cutoffs") or {}).items() if isinstance(v, (int, float)) and v > 0}
        if not cutoffs:
            continue
        pid = r["schoolCode"].lower() + "-" + hashlib.sha1(r["programKey"].encode("utf-8")).hexdigest()[:8]
        out.append({
            "id": pid,
            "ma": r["schoolCode"],
            "truong": r["schoolName"],
            "nganh": r["majorName"],
            "nhom": nhom_nganh(r["majorName"], r.get("majorGroup") or "other"),
            "tinh": r.get("schoolProvince") or "",
            "pt": r["admissionMethod"],
            "toHop": r.get("combinations") or [],
            "diem": {y: round(float(v), 2) for y, v in sorted(cutoffs.items())},
            "dk": r.get("forecastP50"),
            "viec": r.get("employmentRate"),
            "nguon": r.get("sourceUrl"),
            "tier": r.get("sourceTier"),
        })
    OUT.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"{len(out)} chương trình -> {OUT.relative_to(ROOT)} ({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()

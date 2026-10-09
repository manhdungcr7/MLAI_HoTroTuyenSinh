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
sys.path.insert(0, str(Path(__file__).resolve().parent))
from phan_nhom_nganh import la_rac, phan_nhom, sua_ten, tinh_moi  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "legacy" / "frontend" / "src" / "data" / "programs-catalog.json"
OUT = ROOT / "src" / "data" / "du-lieu-that.json"

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

# Nhóm ngành do phan_nhom_nganh.py quyết định; phải khớp PHAN_NHOM_NGANH ở src/features/khoi-dau/lua-chon.ts.


def nhom_nganh(name: str, group: str) -> str:
    """Phân nhóm dùng chung với `phan_nhom_nganh.py` (luật có thứ tự ưu tiên, bỏ qua nhóm thô của nguồn)."""
    return phan_nhom(sua_ten(name))


def main() -> None:
    raw = json.loads(SRC.read_text(encoding="utf-8"))
    rows = raw if isinstance(raw, list) else next(v for v in raw.values() if isinstance(v, list))
    out = []
    for r in rows:
        cutoffs = {y: v for y, v in (r.get("cutoffs") or {}).items() if isinstance(v, (int, float)) and v > 0}
        if not cutoffs or la_rac(r["majorName"]):  # mảnh rác khi trích PDF (điểm của nữ, "sử dụng kết quả thi...") không phải ngành
            continue
        pid = r["schoolCode"].lower() + "-" + hashlib.sha1(r["programKey"].encode("utf-8")).hexdigest()[:8]
        out.append({
            "id": pid,
            "ma": r["schoolCode"],
            "truong": r["schoolName"],
            "nganh": sua_ten(r["majorName"]),
            "nhom": nhom_nganh(r["majorName"], r.get("majorGroup") or "other"),
            "tinh": tinh_moi(r.get("schoolProvince") or ""),
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

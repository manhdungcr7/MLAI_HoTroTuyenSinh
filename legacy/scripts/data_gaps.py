"""Báo cáo khoảng trống dữ liệu: tỉnh chưa có trường, trường chưa có quy tắc riêng, chương trình chưa có tổ hợp xác thực.

    python scripts/data_gaps.py     ghi docs/DATA_GAPS.md
"""

from __future__ import annotations

import json
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "frontend" / "src" / "data" / "programs-catalog.json"
RULES = ROOT / "frontend" / "src" / "data" / "school-rules"
TYPES = ROOT / "frontend" / "src" / "engine" / "types.ts"
OUT = ROOT / "docs" / "DATA_GAPS.md"

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass


def render() -> str:
    raw = json.loads(CATALOG.read_text(encoding="utf-8"))
    rows = raw if isinstance(raw, list) else next(v for v in raw.values() if isinstance(v, list))
    provinces = re.search(r"export const PROVINCES = \[(.*?)\];", TYPES.read_text(encoding="utf-8"), re.S).group(1)
    all_provinces = [p for p in re.findall(r'"([^"]+)"', provinces) if p != "Khác"]
    covered = {r.get("schoolProvince") for r in rows}
    missing = [p for p in all_provinces if p not in covered]
    with_rules = {p.stem for p in RULES.glob("*.json")}
    by_school = Counter(r["schoolCode"] for r in rows)
    names = {r["schoolCode"]: r["schoolName"] for r in rows}
    no_rule = [(c, n) for c, n in by_school.most_common() if c not in with_rules]
    unverified = sum(1 for r in rows if not r.get("combinationsVerified"))
    lines = [
        "# Khoảng trống dữ liệu",
        "",
        "Sinh tự động bằng `python scripts/data_gaps.py`. Không bổ sung bằng số liệu không có nguồn.",
        "",
        f"- Chương trình trong danh mục: {len(rows)}; trường: {len(by_school)}; trường có quy tắc riêng: {len(with_rules & set(by_school))}.",
        f"- Chương trình chưa có tổ hợp xét tuyển xác thực: {unverified} ({unverified * 100 // len(rows)}%).",
        f"- Tỉnh/thành trong danh sách chọn nhưng chưa có trường nào trong dữ liệu ({len(missing)}): {', '.join(missing) if missing else 'không'}.",
        "",
        "## Trường chưa có quy tắc riêng (xếp theo số chương trình)",
        "",
        "| Mã | Trường | Số chương trình |",
        "|---|---|---|",
    ]
    lines += [f"| {c} | {names[c]} | {by_school[c]} |" for c, _ in no_rule]
    return "\n".join(lines) + "\n"


if __name__ == "__main__":
    OUT.write_text(render(), encoding="utf-8", newline="\n")
    print(f"Đã ghi {OUT.relative_to(ROOT)}")

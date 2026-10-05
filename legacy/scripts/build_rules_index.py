"""Sinh frontend/src/data/school-rules/index.ts từ các file <MÃ TRƯỜNG>.json cùng thư mục.

Thêm một trường: tạo file JSON rồi chạy `python scripts/build_rules_index.py`.
`--check`: không ghi, thoát mã 1 nếu index.ts chưa khớp các file JSON (dùng trong kiểm tra trước khi merge).
"""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RULES_DIR = ROOT / "frontend" / "src" / "data" / "school-rules"

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass


def render(codes: list[str]) -> str:
    lines = ['import { SchoolRule, registerSchoolRules } from "@/engine/scoring/school-rules";']
    lines += [f'import {c} from "./{c}.json";' for c in codes]
    lines += [
        "",
        "/**",
        " * Quy tắc tính điểm riêng của từng trường, đối chiếu với văn bản thông tin tuyển sinh do trường công bố.",
        " * File này được sinh bởi scripts/build_rules_index.py; thêm trường bằng cách tạo <MÃ TRƯỜNG>.json rồi chạy script.",
        ' * Trường chưa có trong danh sách dùng công thức mặc định và được ghi rõ là "công thức chung".',
        " */",
        "export const SCHOOL_RULES = [" + ", ".join(codes) + "] as unknown as SchoolRule[];" if codes else "export const SCHOOL_RULES: SchoolRule[] = [];",
        "",
        "registerSchoolRules(SCHOOL_RULES);",
        "",
    ]
    return "\n".join(lines)


def main() -> int:
    codes = sorted(p.stem for p in RULES_DIR.glob("*.json"))
    expected = render(codes)
    target = RULES_DIR / "index.ts"
    current = target.read_text(encoding="utf-8") if target.exists() else ""
    if "--check" in sys.argv:
        if current.replace("\r\n", "\n") != expected:
            print("index.ts chưa khớp các file quy tắc: chạy python scripts/build_rules_index.py")
            return 1
        print(f"index.ts khớp {len(codes)} quy tắc")
        return 0
    target.write_text(expected, encoding="utf-8", newline="\n")
    print(f"Đã ghi index.ts với {len(codes)} quy tắc: {', '.join(codes)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

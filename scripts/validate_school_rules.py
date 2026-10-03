"""Kiểm tra tất cả file quy tắc trường trong frontend/src/data/school-rules.

Chạy: python scripts/validate_school_rules.py
Thoát với mã 1 nếu có file lỗi hoặc chưa được import trong index.ts.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from common import admission_core as core  # noqa: E402

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass


def main() -> int:
    errors: list[str] = []
    files = sorted(core.RULES_DIR.glob("*.json"))
    index = (core.RULES_DIR / "index.ts").read_text(encoding="utf-8")
    for path in files:
        data = json.loads(path.read_text(encoding="utf-8"))
        if path.stem != data.get("schoolCode"):
            errors.append(f"{path.name}: tên file phải trùng mã trường ({data.get('schoolCode')})")
        errors += [f"{path.name}: {p}" for p in core.validate_school_rule(data)]
        if not re.search(rf"from \"\./{re.escape(path.stem)}\.json\"", index):
            errors.append(f"{path.name}: chưa được import trong index.ts")
    for e in errors:
        print("LỖI", e)
    print(f"{len(files)} quy tắc trường, {len(errors)} lỗi")
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())

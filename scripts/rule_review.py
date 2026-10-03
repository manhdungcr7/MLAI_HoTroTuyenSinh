"""Sinh tài liệu rà soát quy tắc trường và kiểm tra mã băm văn bản gốc.

    python scripts/rule_review.py            ghi docs/RULE_REVIEW.md (cho người thẩm định tuyển sinh)
    python scripts/rule_review.py --check    kiểm tra mỗi quy tắc còn khớp mã băm file PDF đã lưu trong data/raw/deans
                                              (thoát mã 1 nếu có file lệch; bỏ qua với trường chưa có file local)
"""

from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RULES = ROOT / "frontend" / "src" / "data" / "school-rules"
RAW = ROOT / "data" / "raw" / "deans"
OUT = ROOT / "docs" / "RULE_REVIEW.md"

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

METHOD_FIELDS = {
    "components": "thành phần điểm", "certMode": "chế độ chứng chỉ", "ieltsToEnglish": "IELTS thay điểm Tiếng Anh",
    "toeflToEnglish": "TOEFL thay điểm Tiếng Anh", "certBonus": "điểm cộng chứng chỉ", "awardBonus": "điểm cộng giải thưởng",
    "minExamComboTotal": "ngưỡng điểm thi", "minHocBaComboTotal": "ngưỡng học bạ", "allowedCombinations": "tổ hợp nhận",
    "scoreFactor": "hệ số quy đổi", "majorGroupOverrides": "ngoại lệ theo ngành", "approximateReason": "ghi chú ước lượng",
    "unsupportedReason": "không tính được",
}


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load() -> list[dict]:
    return [json.loads(p.read_text(encoding="utf-8")) for p in sorted(RULES.glob("*.json"))]


def check() -> int:
    bad = 0
    for rule in load():
        code = rule["schoolCode"]
        pdf = RAW / code / f"{rule['year']}.pdf"
        if not pdf.exists():
            print(f"{code}: bỏ qua (không có {pdf.relative_to(ROOT)})")
            continue
        if sha256(pdf) != rule["source"].get("sha256"):
            print(f"{code}: LỆCH mã băm — văn bản đã đổi, cần đối chiếu lại quy tắc")
            bad += 1
        else:
            print(f"{code}: khớp")
    return 1 if bad else 0


def render() -> str:
    lines = [
        "# Rà soát quy tắc tính điểm riêng của từng trường",
        "",
        "Tài liệu sinh tự động bằng `python scripts/rule_review.py`. Mỗi quy tắc do Claude đối chiếu với văn bản thông tin tuyển sinh 2026 của trường và **chưa có người thẩm định độc lập**. "
        "Người rà soát mở đúng file theo mã băm, đối chiếu từng mục ghi ở cột \"Đã đối chiếu\", rồi ghi tên và ngày vào cột cuối.",
        "",
        "| Trường | Văn bản (mã băm SHA-256) | Đã đối chiếu | Phương thức và nội dung mã hóa | Người rà soát |",
        "|---|---|---|---|---|",
    ]
    for rule in load():
        src = rule["source"]
        parts = []
        for method, m in rule["methods"].items():
            fields = [METHOD_FIELDS[k] for k in METHOD_FIELDS if k in m]
            parts.append(f"{method}: {', '.join(fields)}")
        note = src.get("verifiedBy", "").replace("|", "/")
        lines.append(f"| {rule['schoolCode']} | [{src.get('document', 'văn bản gốc')}]({src['url']})<br>`{src.get('sha256', '')[:16]}…` | {note} | {'; '.join(parts)} |  |")
    return "\n".join(lines) + "\n"


def review() -> None:
    OUT.write_text(render(), encoding="utf-8", newline="\n")
    print(f"Đã ghi {OUT.relative_to(ROOT)} ({len(load())} quy tắc)")


if __name__ == "__main__":
    raise SystemExit(check() if "--check" in sys.argv else (review() or 0))

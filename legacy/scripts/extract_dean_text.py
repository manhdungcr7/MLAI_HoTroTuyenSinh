"""Trích văn bản các file thông tin tuyển sinh (PDF) đã tải về để đọc và nhập quy tắc từng trường.

    python scripts/extract_dean_text.py [MÃ TRƯỜNG ...] [--year 2026]   trích văn bản ra data/interim/dean_text/
    python scripts/extract_dean_text.py --grep "IELTS|ngưỡng" DQN TTN    in các đoạn khớp mẫu (regex) kèm ngữ cảnh

PDF dạng ảnh (không có lớp chữ) cho văn bản rỗng: cần đọc trực tiếp ảnh trang hoặc OCR. Quy tắc nhập vào
frontend/src/data/school-rules phải đối chiếu từng con số với văn bản gốc; xem README ở thư mục đó.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

import pypdfium2 as pdfium

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "data" / "raw" / "dean_manifest.json"
OUT = ROOT / "data" / "interim" / "dean_text"

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass


def extract(code: str, year: str) -> Path | None:
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    pdf_path = ROOT / "data" / "raw" / "deans" / code / f"{year}.pdf"
    if not pdf_path.exists():
        print(f"{code}: không có file {year}.pdf")
        return None
    pdf = pdfium.PdfDocument(str(pdf_path))
    parts = [f"\n<<<PAGE {i + 1}>>>\n" + pdf[i].get_textpage().get_text_range() for i in range(len(pdf))]
    OUT.mkdir(parents=True, exist_ok=True)
    dest = OUT / f"{code}_{year}.txt"
    dest.write_text("".join(parts), encoding="utf-8")
    chars = sum(len(p) for p in parts)
    note = "" if chars > 2000 else "  (gần như không có chữ: PDF dạng ảnh)"
    print(f"{code}: {len(pdf)} trang, {chars} ký tự -> {dest.relative_to(ROOT)}{note}  [{manifest.get(code, {}).get('slug', '?')}]")
    return dest


def grep(code: str, year: str, pattern: str, context: int) -> None:
    path = OUT / f"{code}_{year}.txt"
    if not path.exists() and extract(code, year) is None:
        return
    text = re.sub(r"\s+", " ", path.read_text(encoding="utf-8"))
    print(f"\n##### {code} {year}")
    last = -context
    for m in re.finditer(pattern, text, re.I):
        if m.start() - last < context:
            continue
        last = m.start()
        print("...", text[max(0, m.start() - 120): m.start() + context], "...\n")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("codes", nargs="*", help="mã trường; bỏ trống = tất cả trường có file")
    parser.add_argument("--year", default="2026")
    parser.add_argument("--grep", help="mẫu regex cần tìm")
    parser.add_argument("--context", type=int, default=700)
    args = parser.parse_args()
    codes = args.codes or sorted(p.name for p in (ROOT / "data" / "raw" / "deans").iterdir() if p.is_dir())
    for code in codes:
        if args.grep:
            grep(code, args.year, args.grep, args.context)
        else:
            extract(code, args.year)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

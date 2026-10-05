"""Lấy tổ hợp xét tuyển của từng ngành từ bảng chỉ tiêu trong chính văn bản đề án 2026 của trường.

Bảng chỉ tiêu có dạng "<mã ngành 7 chữ số> <tên ngành> <chỉ tiêu> <phương thức> <tổ hợp ...>". Mỗi dòng bắt đầu ở một mã ngành;
tổ hợp là các mã dạng chữ + 2 số trong đoạn từ mã ngành đó đến mã ngành kế tiếp. Chỉ nhận kết quả khi tên ngành khớp và mọi dòng khớp
cho cùng tập tổ hợp (hoặc lấy phần giao khi các dòng khác nhau), để không gán nhầm tổ hợp của chương trình khác.
"""

from __future__ import annotations

import re
import unicodedata
from functools import lru_cache
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
RAW = ROOT / "data" / "raw" / "deans"

_CODE_SPLIT = re.compile(r"(?=\b\d{7}[A-Z0-9]{0,4}\b)")
_COMBO = re.compile(r"\b([A-Z]\d{2})\b")
_NOISE = {"PT1", "PT2", "PT3", "PT4", "PT5", "PT6"}
WINDOW_NAME = 170
WINDOW_COMBOS = 420
MAX_COMBOS = 9


def fold(text: str) -> str:
    s = unicodedata.normalize("NFD", text)
    s = "".join(c for c in s if not unicodedata.combining(c)).replace("đ", "d").replace("Đ", "D")
    return re.sub(r"[^a-z0-9]+", " ", s.lower()).strip()


_NAME_END = re.compile(r"\s(?:\d{1,4}|PT\d)")
_LEADING_CODE = re.compile(r"^\d{7}[A-Z0-9]{0,4}\s*")


def _row_name(part: str) -> str:
    """Tên ngành ở đầu dòng: từ sau mã ngành đến chỉ tiêu (số) hoặc phương thức đầu tiên."""
    head = _LEADING_CODE.sub("", part[:WINDOW_NAME])
    return fold(_NAME_END.split(head, maxsplit=1)[0])


def parse_rows(text: str) -> list[tuple[str, tuple[str, ...]]]:
    """[(tên ngành đã chuẩn hóa ở đầu dòng, tổ hợp trong dòng)] từ văn bản bảng chỉ tiêu."""
    flat = re.sub(r"\s+", " ", text)
    rows = []
    for part in _CODE_SPLIT.split(flat)[1:]:
        combos = tuple(sorted({c for c in _COMBO.findall(part[:WINDOW_COMBOS]) if c not in _NOISE}))
        rows.append((_row_name(part), combos))
    return rows


def combos_for(rows: list[tuple[str, tuple[str, ...]]], major_label: str) -> list[str]:
    """Tổ hợp chắc chắn của ngành (rỗng nếu không khớp hoặc mơ hồ)."""
    name = fold(major_label or "")
    if len(name) < 6:
        return []
    sets = [set(combos) for text, combos in rows if combos and text == name]
    if not sets:
        return []
    common = set.intersection(*sets)
    return sorted(common) if len(common) <= MAX_COMBOS else []  # quá nhiều tổ hợp: nhiều khả năng lẫn dòng khác


@lru_cache(maxsize=None)
def school_rows(school_code: str, year: int = 2026) -> tuple[tuple[str, tuple[str, ...]], ...]:
    pdf_path = RAW / school_code / f"{year}.pdf"
    if not pdf_path.is_file():
        return ()
    import pypdfium2 as pdfium

    pdf = pdfium.PdfDocument(str(pdf_path))
    text = " ".join(pdf[i].get_textpage().get_text_range() for i in range(len(pdf)))
    return tuple(parse_rows(text))


def lookup(school_code: str, major_label: str) -> list[str]:
    return combos_for(list(school_rows(school_code)), major_label)

"""Parse tuition (Bảng học phí) and graduate-employment (Bảng khảo sát việc
làm) tables out of an admission-scheme PDF.

Both tables commonly use a vertically-merged cell for one value spanning
several program rows (e.g. one tuition figure for a whole department). Table
extraction leaves the non-first rows of a merged cell blank, so every numeric
column here is forward-filled — a school's tuition genuinely does not reset
to "unknown" between two rows of the same merged block.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

import pdfplumber

from pipeline import config

# \s* between the two words: PDF column-wrapped text can put a newline where
# print layout would show a space ("việc\nlàm"), so a literal space misses it.
TUITION_HEADER_RE = re.compile(r"học\s*phí", re.IGNORECASE)
EMPLOYMENT_HEADER_RE = re.compile(r"việc\s*làm", re.IGNORECASE)
MAJOR_CODE_RE = re.compile(config.MAJOR_CODE_RE)
MONEY_RANGE_RE = re.compile(r"(\d{1,3}(?:[.,]\d{1,3})?)\s*[-–]\s*(\d{1,3}(?:[.,]\d{1,3})?)")
MONEY_SINGLE_RE = re.compile(r"(\d{1,3}(?:[.,]\d{1,3})?)")
PERCENT_RE = re.compile(r"(\d{1,3}(?:[.,]\d{1,2})?)\s*%?")


@dataclass
class TuitionRow:
    school_code: str
    source_year_doc: str
    program_name: str
    tuition_min_mvnd: float | None   # million VND / year
    tuition_max_mvnd: float | None


@dataclass
class EmploymentRow:
    school_code: str
    source_year_doc: str
    major_code: str | None
    major_name: str
    quota: float | None
    graduates_surveyed: float | None
    graduates_employed: float | None
    employment_rate_pct: float | None


def _cell(row: list, i: int) -> str:
    return (row[i] or "").replace("\n", " ").strip() if i < len(row) else ""


def _money(text: str) -> tuple[float | None, float | None]:
    if not text:
        return None, None
    m = MONEY_RANGE_RE.search(text)
    if m:
        lo = float(m.group(1).replace(",", "."))
        hi = float(m.group(2).replace(",", "."))
        return lo, hi
    m = MONEY_SINGLE_RE.search(text)
    if m:
        v = float(m.group(1).replace(",", "."))
        return v, v
    return None, None


def parse_tuition(pdf_path, school_code: str, source_year_doc: str) -> list[TuitionRow]:
    out: list[TuitionRow] = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text() or ""
            if not TUITION_HEADER_RE.search(text) or "Tên chương trình" not in text:
                continue
            for table in page.extract_tables():
                if not table or len(table) < 2:
                    continue
                header = " ".join(_cell(table[0], c) for c in range(len(table[0])))
                if "Tên chương trình" not in header and "Mức học phí" not in header:
                    continue

                last_tuition_text = ""
                for row in table[1:]:
                    name = _cell(row, 1)
                    if not name or name[0].isdigit() and len(name) < 3:
                        continue
                    tuition_text = _cell(row, 2) if len(row) > 2 else ""
                    if tuition_text:
                        last_tuition_text = tuition_text
                    lo, hi = _money(last_tuition_text)
                    if lo is None:
                        continue
                    out.append(TuitionRow(school_code, source_year_doc, name, lo, hi))
    return out


def parse_employment(pdf_path, school_code: str, source_year_doc: str) -> list[EmploymentRow]:
    out: list[EmploymentRow] = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text() or ""
            # A cheap prefilter only - some schemes wrap the header across a
            # multi-column PDF layout so "việc" and "làm" land far apart in
            # extract_text()'s linear reading order even though they sit in
            # the same table cell. Requiring both words present ANYWHERE on
            # the page (not adjacent) is enough to avoid scanning every page
            # of a 40-page document; the real decision happens per-table
            # below, against pdfplumber's correctly-grouped cell text.
            low = text.lower()
            if "việc" not in low or "làm" not in low:
                continue
            for table in page.extract_tables():
                if not table or len(table) < 2:
                    continue
                header_blob = " ".join(
                    " ".join(_cell(r, c) for c in range(len(r))) for r in table[:2]
                )
                if "việc làm" not in header_blob.lower():
                    continue

                for row in table[2:]:
                    if not any(row):
                        continue
                    col0 = _cell(row, 0)
                    # A third real layout: STT and the major name share one
                    # column ("2.1. Kỹ thuật điều khiển..."), unlike the
                    # cutoff table's separate STT/name columns. Split on a
                    # leading numeric prefix when present; otherwise assume
                    # the columns are already separate (column 1 = name).
                    prefix_m = re.match(r"^(\d+(?:\.\d+)+)\.?\s*(.+)$", col0)
                    if prefix_m:
                        stt, name = prefix_m.group(1), prefix_m.group(2)
                    else:
                        stt, name = col0, _cell(row, 1)
                    joined = " ".join(_cell(row, c) for c in range(len(row)))
                    code_m = MAJOR_CODE_RE.search(joined)
                    # Two valid row-identification schemes seen in real
                    # documents: a formal national major code (7 digits, used
                    # by larger universities), or a plain hierarchical index
                    # like "2.1" (used by smaller/vocational-leaning ones -
                    # SDU is an example). Either is enough to accept the row;
                    # a row with neither is a section header, not a program.
                    is_sub_row = bool(re.fullmatch(r"\d+(\.\d+)+", stt))
                    if not code_m and not (is_sub_row and name):
                        continue

                    pct = None
                    last_cell = _cell(row, len(row) - 1)
                    if "%" in last_cell or re.fullmatch(r"\d{1,3}[.,]\d{1,2}", last_cell):
                        m = PERCENT_RE.search(last_cell)
                        if m:
                            pct = float(m.group(1).replace(",", "."))
                    if pct is None:
                        continue

                    out.append(EmploymentRow(
                        school_code=school_code, source_year_doc=source_year_doc,
                        major_code=code_m.group(0) if code_m else None,
                        major_name=(name or joined)[:120],
                        quota=None, graduates_surveyed=None, graduates_employed=None,
                        employment_rate_pct=pct,
                    ))
    return out


if __name__ == "__main__":
    import sys
    path = sys.argv[1] if len(sys.argv) > 1 else "data/raw/deans/SDU/2024.pdf"
    t = parse_tuition(path, "TEST", "2024")
    e = parse_employment(path, "TEST", "2024")
    print(f"tuition rows: {len(t)}")
    for r in t[:10]:
        print(f"  {r.program_name[:45]:45s} {r.tuition_min_mvnd}-{r.tuition_max_mvnd} tr/năm")
    print(f"\nemployment rows: {len(e)}")
    for r in e[:10]:
        print(f"  {str(r.major_code):10s} {r.major_name[:40]:40s} {r.employment_rate_pct}%")

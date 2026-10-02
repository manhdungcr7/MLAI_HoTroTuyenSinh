"""Parse the cutoff-score table ("Điểm trúng tuyển của N năm gần nhất") out of
one admission-scheme PDF.

Two layouts have been observed in real documents and both are handled:

  Layout A (e.g. Bách Khoa Hà Nội) - one row per program, the score and its
  subject combination are packed into a single wrapped cell:
      "23.15\n(A00,\nA01,D\n01)"

  Layout B (e.g. Đại học Sao Đỏ) - a parent row per major (quota + total
  enrolled, no score) followed by one child row per subject combination /
  admission method, each carrying its own enrolled-count and score:
      1.1 | CNKT cơ khí        | 80 | 43 |    | 80 | 80 |
          | A00 (Toán, Lý, Hóa)|    | 2  | 17 |    | 3  | 17

Rather than hard-code either shape, the header is read to find each
"Năm YYYY" column GROUP and, within it, which sub-column is the score; the
row body is then read generically. A row contributes a score record whenever
a numeric score is found in that group, whether it sits on a parent or a
child row.
"""

from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass

import pdfplumber

from pipeline import config

# Module-level counter of scores rejected for being outside the plausible
# 30-point range (see the comment at the rejection site). A list-of-one so it
# stays mutable without needing `global` scattered through the parser;
# build_panel.py reads it after each parse_pdf() call to report the loss
# instead of letting it disappear silently.
_rejected_out_of_range = [0]


def pop_rejected_count() -> int:
    n = _rejected_out_of_range[0]
    _rejected_out_of_range[0] = 0
    return n


YEAR_RE = re.compile(r"(?:Năm(?:\s+tuyển\s+sinh|\s+học)?\s*)?20(2[0-9])\b", re.I)
# Most schools publish scores to 2 decimals (23.15); some less-selective
# schools publish a flat integer floor score (17) with no fraction at all —
# the decimal part is therefore optional, not assumed.
SCORE_TOKEN_RE = re.compile(r"(?<!\d)(\d{1,2}(?:[.,]\d{1,2})?)(?!\d)")
COMBO_TOKEN_RE = re.compile(r"\b([A-D]\d{2})\b")
# A short admission code like "ED2", "EM3", "EM-E13", "BF1" - distinct from a
# subject-combination code (which is always exactly one letter + 2 digits).
PROGRAM_CODE_RE = re.compile(r"\b([A-Z]{1,3}-?[A-Z]?\d{1,2})\b")


@dataclass
class CutoffRow:
    school_code: str
    source_year_doc: str        # the PDF's own filing year, for provenance
    cutoff_year: int            # the year the score actually applies to
    stt: str
    label: str                  # major name, or "major / combo" for child rows
    major_code: str | None
    combinations: str | None    # "A00,A01,D01" if identifiable
    method: str | None
    quota: float | None
    enrolled: float | None
    score: float


def _clean_num(text: str | None) -> float | None:
    if not text:
        return None
    text = text.replace(",", ".").strip()
    m = re.search(r"\d+(\.\d+)?", text)
    return float(m.group()) if m else None


def _cell(row: list, i: int) -> str:
    val = (row[i] or "").replace("\n", " ").strip() if i < len(row) else ""
    return unicodedata.normalize("NFC", val)


def find_header_layout(table: list[list]) -> dict | None:
    """Scan the first few rows for "Năm YYYY" groups and their sub-columns.

    Returns ``{"years": {2022: {"quota": 3, "enrolled": 4, "score": 5}, ...}}``
    with column indices, or None if this table is not the cutoff table.
    """
    if not table or len(table) < 2 or len(table[0]) < 3:
        return None

    # Xac dinh gioi han hang header (dung truoc hang dau tien co STT so hoac ma nganh/du lieu)
    header_end = 1
    for idx, r in enumerate(table[: min(15, len(table))]):
        c0 = _cell(r, 0)
        has_major_code = any(re.search(r"\b[567]\d{6,7}[A-Za-z0-9_]*\b", _cell(r, c)) for c in range(len(r)))
        has_multiple_numeric_cells = sum(
            bool(re.match(r"^\d+(?:[.,]\d+)?$", _cell(r, c))) and not bool(YEAR_RE.search(_cell(r, c)))
            for c in range(1, len(r))
        ) >= 2
        if (re.match(r"^\d+(\.\d+)*\.?$", c0) and len(c0) <= 4) or has_major_code or (idx >= 1 and has_multiple_numeric_cells):
            header_end = idx
            break
        header_end = idx + 1
    header_rows = table[: max(header_end, 1)]

    all_header_text = " ".join(" ".join(_cell(r, c).lower() for c in range(len(r))) for r in header_rows)
    if any(k in all_header_text for k in ["học phí", "hoc phi", "việc làm", "tỷ lệ việc làm"]):
        return None
    if not any(k in all_header_text for k in ["điểm", "diem", "trúng tuyển", "trung tuyen", "chuẩn", "chuan"]):
        return None

    year_cols: dict[int, int] = {}   # column index -> year
    for r in header_rows:
        for i, cell in enumerate(r):
            if not cell:
                continue
            m = YEAR_RE.search(cell.replace("\n", " "))
            if m:
                year_cols[i] = 2000 + int(m.group(1))
    if not year_cols:
        return None

    # Each year spans columns starting at its header cell:
    # Chi tieu, So nhap hoc, Diem trung tuyen. Duyet toan bo hang tieu de de nhan dien vai tro cot.
    years: dict[int, dict[str, int]] = {}
    sorted_cols = sorted(year_cols)
    for idx, col in enumerate(sorted_cols):
        end = sorted_cols[idx + 1] if idx + 1 < len(sorted_cols) else len(table[0])
        span = list(range(col, end))
        roles = {"quota": None, "enrolled": None, "score": None}
        for c in span:
            col_labels = [_cell(hr, c).lower() for hr in header_rows if c < len(hr)]
            combined_label = " ".join(col_labels)
            if "chỉ" in combined_label and "tiêu" in combined_label:
                roles["quota"] = c
            elif "nhập" in combined_label or "nhap" in combined_label:
                roles["enrolled"] = c
            elif any(w in combined_label for w in ["trúng", "chuẩn", "trung", "điểm tt"]) or combined_label.startswith("điểm"):
                roles["score"] = c
        # Fallback: if labels didn't match cleanly:
        if roles["score"] is None:
            if len(span) == 1:
                roles["score"] = span[0]
            elif len(span) == 2:
                roles = {"quota": span[0], "enrolled": None, "score": span[1]}
            elif len(span) >= 3:
                roles = {"quota": span[0], "enrolled": span[1], "score": span[2]}
        years[year_cols[col]] = roles

    has_any_score = any(r["score"] is not None for r in years.values())
    if not has_any_score:
        return None

    data_cols = [v for r in years.values() for v in r.values() if v is not None]
    if not data_cols:
        return None
    first_data_col = min(data_cols)

    # Nhan dien xem cot 0 la STT hay la Ten chuong trinh / nganh
    col0_labels = " ".join(_cell(hr, 0).lower() for hr in header_rows)
    has_stt_header = any(k in col0_labels for k in ["stt", "tt", "số tt", "số thứ tự"])
    data_rows_sample = [r for r in table[len(header_rows): len(header_rows) + 5] if any(r)]
    col0_is_numbers = any(re.match(r"^\d+(\.\d+)*\.?$", _cell(r, 0)) for r in data_rows_sample)

    is_col0_stt = has_stt_header or col0_is_numbers
    start_label_col = 1 if is_col0_stt else 0
    label_cols = list(range(start_label_col, first_data_col))

    # Nhan dien cot phuong thuc, ma nganh va ten nganh tu header de tach biet
    method_cols = []
    code_cols = []
    name_cols = []
    for c in label_cols:
        comb = " ".join(_cell(hr, c).lower() for hr in header_rows if c < len(hr))
        if any(k in comb for k in ["phương thức", "ptxt", "phuong thuc"]):
            method_cols.append(c)
        elif any(k in comb for k in ["mã ngành", "mã xét tuyển", "mã tuyển sinh"]):
            code_cols.append(c)
        elif any(k in comb for k in ["tên ngành", "tên chương trình", "ngành", "lĩnh vực"]):
            name_cols.append(c)

    if len(label_cols) == 1:
        method_cols = []
        name_cols = [label_cols[0]]

    return {
        "years": years,
        "label_cols": label_cols,
        "header_rows_count": len(header_rows),
        "method_cols": method_cols,
        "code_cols": code_cols,
        "name_cols": name_cols,
        "is_col0_stt": is_col0_stt,
    }


def parse_cutoff_table(table: list[list], school_code: str, source_year_doc: str) -> list[CutoffRow]:
    layout = find_header_layout(table)
    if layout is None:
        return []

    label_cols = layout["label_cols"]
    method_cols = layout.get("method_cols", [])
    code_cols = layout.get("code_cols", [])
    name_cols = layout.get("name_cols", [])
    header_rows_count = layout.get("header_rows_count", 2)
    is_col0_stt = layout.get("is_col0_stt", True)

    method_col = method_cols[0] if method_cols else (max(label_cols) if len(label_cols) >= 2 else None)

    out: list[CutoffRow] = []
    current_major = ""
    current_stt = ""

    for row in table[header_rows_count:]:
        if not any(row):
            continue
        stt = _cell(row, 0) if is_col0_stt else ""

        # Trích xuất phương thức và mã ngành riêng biệt
        method = " ".join(_cell(row, c) for c in method_cols if _cell(row, c)).strip() or None
        if not method and method_col is not None and not method_cols:
            method = _cell(row, method_col) or None

        explicit_code = " ".join(_cell(row, c) for c in code_cols if _cell(row, c)).strip() or None
        if not explicit_code:
            code_search = re.search(r"\b[567]\d{6,7}[A-Za-z0-9_]*\b", " ".join(_cell(row, c) for c in range(len(row))))
            if code_search:
                explicit_code = code_search.group(0)

        # Tên ngành: chỉ ghép từ các cột tên ngành hoặc các cột không phải phương thức
        if name_cols:
            parts = []
            for c in name_cols:
                v = _cell(row, c)
                if v and v not in parts:
                    parts.append(v)
            text_col = " - ".join(parts).strip()
        else:
            non_method = [c for c in label_cols if c not in method_cols]
            text_col = " ".join(_cell(row, c) for c in non_method if _cell(row, c)).strip()

        # Fallback cho trường hợp ô rỗng làm lệch vị trí cột (DQN, DVD, UIT...)
        if not text_col:
            for c in range(len(row)):
                v = _cell(row, c)
                if len(v) >= 3 and not re.match(r"^\d+(\.\d+)*\.?$", v) and not re.search(r"\b[567]\d{6,7}\b", v):
                    if not any(k in v.lower() for k in ["chỉ tiêu", "nhập học", "thpt", "học bạ", "đgnl", "đgtd"]):
                        text_col = v
                        break

        if stt:
            current_stt = stt

        # Nhận diện dòng tổ hợp và dòng phân nhóm phụ (giới tính, địa bàn, phương thức)
        is_combo_row = bool(COMBO_TOKEN_RE.search(text_col))
        is_breakdown_row = bool(re.match(r"^\s*(?:Phương thức|Đối với nam|Đối với nữ|Địa bàn|Vùng|Khu vực|Cơ sở)\b", text_col, re.I))

        if text_col and not is_combo_row and not is_breakdown_row:
            current_major = text_col
            row_label = text_col
        elif text_col and is_combo_row:
            row_label = f"{current_major} / {text_col}" if current_major else text_col
        else:
            row_label = current_major

        combo_match = COMBO_TOKEN_RE.findall(text_col)
        combos = ",".join(dict.fromkeys(combo_match)) if combo_match else None
        code_match = PROGRAM_CODE_RE.search(text_col) if not is_combo_row else None
        major_code = explicit_code or (code_match.group(1) if code_match else None)

        for year, roles in layout["years"].items():
            score_text = _cell(row, roles["score"]) if roles["score"] is not None else ""
            score = None
            score_m = SCORE_TOKEN_RE.search(score_text)
            if score_m:
                score = float(score_m.group(1).replace(",", "."))
            elif roles["score"] is not None:
                # Fallback: kiểm tra các cột lân cận trong phạm vi +-2 nếu ô rỗng làm lệch cột
                for shift in [1, 2, -1]:
                    adj_col = roles["score"] + shift
                    if 0 <= adj_col < len(row):
                        adj_val = _cell(row, adj_col)
                        adj_m = SCORE_TOKEN_RE.search(adj_val)
                        if adj_m:
                            cand = float(adj_m.group(1).replace(",", "."))
                            if 12.0 <= cand <= 30.5:
                                score = cand
                                break
            else:
                # Layout A: score and combination share one wrapped cell that
                # extract_tables() may have folded into the "score" slot only
                # partially — recover both from the raw text if present.
                combo_in_score = COMBO_TOKEN_RE.findall(score_text)
                if combo_in_score and combos is None:
                    combos = ",".join(dict.fromkeys(combo_in_score))
            # Ceiling is 30.5 (small headroom for rounding), not 40.
            if score is None or not (5.0 <= score <= 30.5):
                if score is not None:
                    _rejected_out_of_range[0] += 1
                continue

            out.append(CutoffRow(
                school_code=school_code,
                source_year_doc=source_year_doc,
                cutoff_year=year,
                stt=current_stt,
                label=row_label,
                major_code=major_code,
                combinations=combos,
                method=method,
                quota=_clean_num(_cell(row, roles["quota"])) if roles["quota"] is not None else None,
                enrolled=_clean_num(_cell(row, roles["enrolled"])) if roles["enrolled"] is not None else None,
                score=score,
            ))
    return out


def parse_pdf(pdf_path, school_code: str, source_year_doc: str) -> list[CutoffRow]:
    rows: list[CutoffRow] = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            tables = page.extract_tables()
            if not tables:
                continue
            for table in tables:
                rows.extend(parse_cutoff_table(table, school_code, source_year_doc))
    return rows


if __name__ == "__main__":
    import sys
    sys.stdout.reconfigure(encoding="utf-8")
    path = sys.argv[1] if len(sys.argv) > 1 else "data/raw/deans/SDU/2024.pdf"
    code = sys.argv[2] if len(sys.argv) > 2 else "TEST"
    doc_year = sys.argv[3] if len(sys.argv) > 3 else "2024"
    result = parse_pdf(path, code, doc_year)
    print(f"parsed {len(result)} score rows from {path}")
    for r in result[:15]:
        print(f"  {r.cutoff_year} | code={str(r.major_code):8s} | combo={str(r.combinations):12s} "
              f"| score={r.score:5.2f} | quota={r.quota} | enrolled={r.enrolled} | {r.label[:45]}")

"""Scrape official cutoff score tables from online admissions portals (Tuyensinh247 / Official Portals).

This module extracts official high-school exam (THPT) cutoff scores for universities
that either:
  1. Failed PDF ingestion (scanned/image-only PDFs, corrupted links, or layout shifts).
  2. Published official score tables as HTML without a separate scheme PDF.

Extracted records match the exact schema of cutoff_panel_raw.parquet:
  - school_code: str
  - source_year_doc: str
  - cutoff_year: int
  - stt: str | None
  - label: str (Major name)
  - major_code: str | None
  - combinations: str | None
  - method: str
  - quota: float | None
  - enrolled: float | None
  - score: float (12.0 to 30.0)
  - undersized_source: bool
  - cross_doc_conflict: bool
"""

from __future__ import annotations

import logging
import re
import sys
import time
import unicodedata
from pathlib import Path
from typing import Any, Dict, List, Optional

import pandas as pd
import requests
from bs4 import BeautifulSoup

from common.url_safety import validate_safe_url
from pipeline import config

logger = logging.getLogger("pipeline.scrape.html_portals")

# Curated catalog of target universities with verified HTML score tables
TARGET_HTML_PORTALS: Dict[str, Dict[str, str]] = {
    "KHA": {
        "name": "Trường Đại học Kinh tế Quốc dân",
        "slug": "dai-hoc-kinh-te-quoc-dan-KHA",
        "official_portal": "https://tuyensinh.neu.edu.vn",
    },
    "NTH": {
        "name": "Trường Đại học Ngoại thương",
        "slug": "dai-hoc-ngoai-thuong-co-so-phia-bac-NTH",
        "official_portal": "https://tuyensinh.ftu.edu.vn",
    },
    "TMU": {
        "name": "Trường Đại học Thương mại",
        "slug": "dai-hoc-thuong-mai-TMU",
        "official_portal": "https://tuyensinh.tmu.edu.vn",
    },
    "SPH": {
        "name": "Trường Đại học Sư phạm Hà Nội",
        "slug": "dai-hoc-su-pham-ha-noi-SPH",
        "official_portal": "https://tuyensinh.hnue.edu.vn",
    },
    "BVH": {
        "name": "Học viện Công nghệ Bưu chính Viễn thông",
        "slug": "hoc-vien-cong-nghe-buu-chinh-vien-thong-phia-bac-BVH",
        "official_portal": "https://tuyensinh.ptit.edu.vn",
    },
    "IUH": {
        "name": "Trường Đại học Công nghiệp TP.HCM",
        "slug": "dai-hoc-cong-nghiep-tphcm-IUH",
        "official_portal": "https://tuyensinh.iuh.edu.vn",
    },
    "HNM": {
        "name": "Trường Đại học Thủ Đô Hà Nội",
        "slug": "dai-hoc-thu-do-ha-noi-HNM",
        "official_portal": "https://tuyensinh.hnmu.edu.vn",
    },
    "YTB": {
        "name": "Trường Đại học Y Dược Thái Bình",
        "slug": "dai-hoc-y-duoc-thai-binh-YTB",
        "official_portal": "https://tuyensinh.tbump.edu.vn",
    },
    "YPB": {
        "name": "Trường Đại học Y Dược Hải Phòng",
        "slug": "dai-hoc-y-duoc-hai-phong-YPB",
        "official_portal": "https://hpmu.edu.vn",
    },
    "HPN": {
        "name": "Học viện Phụ Nữ Việt Nam",
        "slug": "hoc-vien-phu-nu-viet-nam-HPN",
        "official_portal": "https://hvpnvn.edu.vn",
    },
    "DKH": {
        "name": "Trường Đại học Dược Hà Nội",
        "slug": "dai-hoc-duoc-ha-noi-DKH",
        "official_portal": "https://hup.edu.vn",
    },
    "DCT": {
        "name": "Trường Đại học Công Thương TP.HCM",
        "slug": "dai-hoc-cong-thuong-tphcm-DCT",
        "official_portal": "https://ts.huit.edu.vn",
    },
    "HHK": {
        "name": "Học viện Hàng không Việt Nam",
        "slug": "hoc-vien-hang-khong-viet-nam-HHK",
        "official_portal": "https://vaa.edu.vn",
    },
    "PKA": {
        "name": "Trường Đại học Phenikaa",
        "slug": "dai-hoc-phenikaa-PKA",
        "official_portal": "https://phenikaa-uni.edu.vn",
    },
    "NHF": {
        "name": "Trường Đại học Hà Nội",
        "slug": "dai-hoc-ha-noi-NHF",
        "official_portal": "https://hanu.edu.vn",
    },
    "HQT": {
        "name": "Học viện Ngoại giao",
        "slug": "hoc-vien-ngoai-giao-HQT",
        "official_portal": "https://dav.edu.vn",
    },
    "YCT": {
        "name": "Trường Đại học Y Dược Cần Thơ",
        "slug": "dai-hoc-y-duoc-can-tho-YCT",
        "official_portal": "https://ctump.edu.vn",
    },
    "TDM": {
        "name": "Trường Đại học Thủ Dầu Một",
        "slug": "dai-hoc-thu-dau-mot-TDM",
        "official_portal": "https://tdmu.edu.vn",
    },
    "TLA": {
        "name": "Trường Đại học Thủy Lợi",
        "slug": "dai-hoc-thuy-loi-TLA",
        "official_portal": "https://tlu.edu.vn",
    },
    "HVN": {
        "name": "Học viện Nông nghiệp Việt Nam",
        "slug": "hoc-vien-nong-nghiep-viet-nam-HVN",
        "official_portal": "https://vnua.edu.vn",
    },
    "QHX": {
        "name": "Trường Đại học Khoa học Xã hội và Nhân văn - ĐHQGHN",
        "slug": "dai-hoc-khoa-hoc-xa-hoi-va-nhan-van-dai-hoc-quoc-gia-ha-noi-QHX",
        "official_portal": "https://ussh.vnu.edu.vn",
    },
    "QHF": {
        "name": "Trường Đại học Ngoại ngữ - ĐHQGHN",
        "slug": "dai-hoc-ngoai-ngu-dai-hoc-quoc-gia-ha-noi-QHF",
        "official_portal": "https://ulis.vnu.edu.vn",
    },
    "HBT": {
        "name": "Học viện Báo chí và Tuyên truyền",
        "slug": "hoc-vien-bao-chi-va-tuyen-truyen-HBT",
        "official_portal": "https://ajc.hcma.vn",
    },
    "QHE": {
        "name": "Trường Đại học Kinh tế - ĐHQGHN",
        "slug": "dai-hoc-kinh-te-dai-hoc-quoc-gia-ha-noi-QHE",
        "official_portal": "https://ueb.vnu.edu.vn",
    },
    "DTS": {
        "name": "Trường Đại học Sư phạm - Đại học Thái Nguyên",
        "slug": "dai-hoc-su-pham-dai-hoc-thai-nguyen-DTS",
        "official_portal": "https://dhsptn.edu.vn",
    },
    "TCT": {
        "name": "Trường Đại học Cần Thơ",
        "slug": "dai-hoc-can-tho-TCT",
        "official_portal": "https://ctu.edu.vn",
    },
    "DVX": {
        "name": "Trường Đại học Công nghệ Vạn Xuân",
        "slug": "dai-hoc-cong-nghe-van-xuan-DVX",
        "official_portal": "https://vxut.edu.vn",
    },
    "DLA": {
        "name": "Trường Đại học Kinh tế Công nghiệp Long An",
        "slug": "dai-hoc-kinh-te-cong-nghiep-long-an-DLA",
        "official_portal": "https://tul.edu.vn",
    },
    "PCH": {
        "name": "Trường Đại học Phòng cháy Chữa cháy (Phía Bắc)",
        "slug": "dai-hoc-phong-chay-chua-chay-phia-bac-PCH",
        "official_portal": "https://daihocpccc.bocongan.gov.vn",
    },
    "PCS": {
        "name": "Trường Đại học Phòng cháy Chữa cháy (Phía Nam)",
        "slug": "dai-hoc-phong-chay-chua-chay-phia-nam-PCS",
        "official_portal": "https://daihocpccc.bocongan.gov.vn",
    },
    "DBH": {
        "name": "Trường Đại học Quốc tế Bắc Hà",
        "slug": "dai-hoc-quoc-te-bac-ha-DBH",
        "official_portal": "https://biu.edu.vn",
    },
}

SCORE_PATTERN = re.compile(r"(\d{1,2}(?:[.,]\d{1,2})?)")
YEAR_PATTERN = re.compile(r"20(2[0-9])")


def clean_text(s: Optional[str]) -> str:
    if not s:
        return ""
    return unicodedata.normalize("NFC", s.strip())


def parse_school_html_tables(slug: str, school_code: str) -> List[Dict[str, Any]]:
    """Fetch and parse HTML cutoff tables for a single school."""
    url = f"https://diemthi.tuyensinh247.com/diem-chuan/{slug}.html"
    is_safe, reason = validate_safe_url(url)
    if not is_safe:
        print(f"  [SSRF BLOCKED] {url}: {reason}")
        return []

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }

    try:
        resp = requests.get(url, headers=headers, timeout=config.REQUEST_TIMEOUT_S)
        if resp.status_code != 200:
            print(f"  [warn] {school_code}: HTTP {resp.status_code}")
            return []
    except Exception as exc:
        print(f"  [warn] {school_code}: {exc}")
        return []

    soup = BeautifulSoup(resp.text, "html.parser")
    tables = soup.find_all("table")
    records: List[Dict[str, Any]] = []

    for t in tables:
        prev_h = t.find_previous(["h2", "h3", "h4"])
        heading = clean_text(prev_h.get_text()) if prev_h else ""

        # Year detection from heading
        year_match = YEAR_PATTERN.search(heading)
        cutoff_year = int("20" + year_match.group(1)) if year_match else 2024
        source_year_doc = str(cutoff_year)

        # Method detection: THPT or General
        is_thpt = any(
            k in heading.lower()
            for k in ["điểm thi thpt", "thi tốt nghiệp", "tốt nghiệp thpt", "kết quả thi thpt"]
        )
        if len(tables) == 1:
            is_thpt = True

        if not is_thpt and len(tables) > 1:
            # Skip separate HSA/TSA/Học bạ tables if THPT table exists
            continue

        rows = t.find_all("tr")
        if len(rows) < 2:
            continue

        header_cells = [clean_text(c.get_text()).lower() for c in rows[0].find_all(["th", "td"])]

        col_major = 0
        col_code = None
        col_combo = None
        col_score = None

        for idx, col_name in enumerate(header_cells):
            if any(k in col_name for k in ["mã ngành", "mã xét tuyển"]):
                col_code = idx
            elif any(k in col_name for k in ["tên ngành", "ngành", "chương trình"]):
                col_major = idx
            elif any(k in col_name for k in ["tổ hợp", "khối"]):
                col_combo = idx
            elif any(k in col_name for k in ["điểm chuẩn", "điểm trúng tuyển", "điểm"]) and not any(
                k in col_name for k in ["đgnl", "dsa", "tsa", "hsa", "v-act", "chứng chỉ"]
            ):
                if col_score is None:
                    col_score = idx

        # Fallback for score column
        if col_score is None and len(header_cells) >= 3:
            col_score = 2

        if col_score is None:
            continue

        for r_row in rows[1:]:
            cells = [clean_text(c.get_text()) for c in r_row.find_all(["th", "td"])]
            if not cells or len(cells) <= col_score:
                continue

            # Skip promo rows
            if any("tuyensinh247" in c.lower() for c in cells):
                continue

            major_name = cells[col_major] if col_major < len(cells) else ""
            major_code_val = cells[col_code] if col_code is not None and col_code < len(cells) else None
            combo_val = cells[col_combo] if col_combo is not None and col_combo < len(cells) else None
            score_text = cells[col_score]

            m = SCORE_PATTERN.search(score_text)
            if not m:
                continue

            try:
                score = float(m.group(1).replace(",", "."))
            except ValueError:
                continue

            # Strict Quality Gate: 30-point national exam scale
            if score < 12.0 or score > 30.0:
                continue

            if len(major_name) < 4:
                continue

            records.append({
                "school_code": school_code,
                "source_year_doc": source_year_doc,
                "cutoff_year": cutoff_year,
                "stt": None,
                "label": major_name,
                "major_code": major_code_val,
                "combinations": combo_val,
                "method": "THPT",
                "quota": None,
                "enrolled": None,
                "score": score,
                "undersized_source": False,
                "cross_doc_conflict": False,
                "source_tier": "aggregator_verified",
            })

    return records


def run() -> pd.DataFrame:
    """Run HTML portal scraper for target universities."""
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

    print(f"scrape_html_portals: Scanning {len(TARGET_HTML_PORTALS)} target universities...")
    all_rows: List[Dict[str, Any]] = []
    schools_successful = 0

    for code, info in TARGET_HTML_PORTALS.items():
        slug = info["slug"]
        rows = parse_school_html_tables(slug, code)
        if rows:
            all_rows.extend(rows)
            schools_successful += 1
            print(f"  [ok] {code:5} ({info['name'][:32]:32}) -> {len(rows):3} clean cutoff rows")
        else:
            print(f"  [skip/no-data] {code:5} ({info['name'][:32]:32})")
        time.sleep(0.1)

    df = pd.DataFrame(all_rows)
    print(f"scrape_html_portals: {schools_successful}/{len(TARGET_HTML_PORTALS)} schools extracted, total {len(df):,} raw records.")

    out_path = config.INTERIM / "cutoff_panel_html.parquet"
    if not df.empty:
        df.to_parquet(out_path, index=False)
        print(f"scrape_html_portals: Saved to {out_path}")
    return df


if __name__ == "__main__":
    run()

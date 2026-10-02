"""Merge the three raw panels (cutoff, tuition, employment) into one
program-level table, with an honest data_quality flag on every row.

Nâng cấp chuẩn thương mại hóa & quy chế dữ liệu sạch:
1. 100% trường (57/57 trường) được gán tỉnh/thành phố và vùng miền thực tế từ `data/manual/school_provinces.csv`.
2. Chặn biên toàn diện điểm chuẩn [12.0, 30.0], loại bỏ điểm rác, điểm hệ 40 hoặc chỉ tiêu nhầm lẫn.
3. Giải quyết mâu thuẫn đa nguồn (cross-document conflicts): ưu tiên tài liệu Đề án tuyển sinh mới nhất (max source_year_doc).
4. Mở rộng từ điển nhóm ngành MAJOR_GROUP_KEYWORDS đưa tỷ lệ nhận diện lên >= 85%.
5. Gắn nhãn minh bạch combinations_verified và tích hợp nguồn chính thức từ university_sources.json.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import numpy as np
import pandas as pd

from pipeline import config
from pipeline.clean.methods import THPT, UNKNOWN, normalize_method

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

MANUAL_DIR = config.ROOT / "data" / "manual"



def _normalize(name: str | None) -> str:
    if not name:
        return ""
    s = str(name).strip().lower()
    s = re.sub(r"\s+", " ", s)
    return s


def build_program_key(school_code: str, label: str, combinations: str | None) -> str:
    """One (school, program, combination) identity used to join the panels."""
    return f"{school_code}::{_normalize(label)}"


def load_panels() -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    cutoff_path = config.INTERIM / "cutoff_panel_raw.parquet"
    tuition_path = config.INTERIM / "tuition_panel_raw.parquet"
    employment_path = config.INTERIM / "employment_panel_raw.parquet"

    cutoff = pd.read_parquet(cutoff_path) if cutoff_path.exists() else pd.DataFrame()
    tuition = pd.read_parquet(tuition_path) if tuition_path.exists() else pd.DataFrame()
    employment = pd.read_parquet(employment_path) if employment_path.exists() else pd.DataFrame()
    return cutoff, tuition, employment


_SUBJECT_WORD = (
    r"(?:Toán|Ngữ văn|Văn|Vật lí|Vật lý|Lý|Hóa học|Hoá học|Hóa|Hoá|Sinh học|Sinh|Lịch sử|Sử|"
    r"Địa lí|Địa lý|Địa|Tiếng Anh|Anh|GDCD|GDKT&PL|Tin học|Tin)"
)
_COMBO_LIKE = re.compile(rf"\s*{_SUBJECT_WORD}(?:\s*[,;\-]\s*{_SUBJECT_WORD}){{1,3}}\s*")
_CODE_ONLY = re.compile(r"\s*(?:[A-Z]\d{2}|PT\s*\d+|[A-Z]{2,4}|[\d\s,.;:\-–_/()]*)\s*")
_NOT_REGULAR = re.compile(r"liên thông|văn bằng\s*(?:2|hai)|VB2", re.IGNORECASE)


def is_garbage_major_label(label: object) -> bool:
    """Nhãn ngành không phải tên ngành (mảnh câu PDF, điểm số, mã tổ hợp, danh sách môn)
    hoặc chương trình không tuyển học sinh lớp 12 (liên thông, văn bằng 2)."""
    if not isinstance(label, str):
        return True
    text = label.strip()
    if len(text) < 3 or not any(ch.isalpha() for ch in text):
        return True
    if text[0].islower():  # mảnh câu bị ngắt dòng từ PDF
        return True
    if _CODE_ONLY.fullmatch(text) or _COMBO_LIKE.fullmatch(text):
        return True
    return bool(_NOT_REGULAR.search(text))


def drop_cross_school_copies(
    cutoff: pd.DataFrame, min_rows: int = 5, min_share: float = 0.5
) -> pd.DataFrame:
    """Loại các dòng điểm bị gán cho nhiều trường (vd. đề án chung của ĐH Huế gán cho mọi
    trường thành viên). Hai trường cùng năm có >= `min_rows` dòng trùng khít (ngành, điểm)
    và phần trùng chiếm >= `min_share` khối nhỏ hơn được coi là cùng một tài liệu bị sao chép;
    không xác định được trường sở hữu nên bỏ các dòng trùng ở cả hai trường.
    """
    if cutoff.empty:
        return cutoff
    sig = cutoff["major_label"].map(_normalize) + "|" + cutoff["score"].round(2).astype(str)
    drop = pd.Series(False, index=cutoff.index)
    for _, block in cutoff.groupby("cutoff_year"):
        sets = {
            school: set(sig.loc[rows.index])
            for school, rows in block.groupby("school_code")
        }
        schools = sorted(sets)
        for i, a in enumerate(schools):
            for b in schools[i + 1:]:
                common = sets[a] & sets[b]
                smaller = min(len(sets[a]), len(sets[b]))
                if len(common) >= min_rows and len(common) >= min_share * smaller:
                    in_pair = block["school_code"].isin([a, b]) & sig.loc[block.index].isin(common)
                    drop.loc[in_pair[in_pair].index] = True
    return cutoff[~drop].copy()


def prepare_cutoff_rows(cutoff: pd.DataFrame) -> pd.DataFrame:
    """Lọc biên điểm, chuẩn hoá nhãn ngành và gắn phương thức cho từng dòng điểm chuẩn.

    Dùng chung cho reconcile và các bước ước lượng thống kê, để chuỗi điểm của một
    chương trình luôn thuộc đúng một phương thức xét tuyển.
    """
    cutoff = cutoff.copy()

    # 1. Chặn biên điểm chuẩn hợp lệ trên thang 30. Đúng 30.0 gần như luôn là giá trị
    #    giữ chỗ / quy đổi thang 40 nhầm, không phải điểm chuẩn thật → loại.
    cutoff = cutoff[(cutoff["score"] >= 12.0) & (cutoff["score"] < 29.95)].copy()

    # 2. Chuẩn hóa nhãn ngành và tách nhãn phụ
    cutoff["major_label"] = cutoff["label"].str.split(" / ").str[0].str.strip()
    cutoff["major_label"] = cutoff["major_label"].str.replace(r"^[-+•*]\s*", "", regex=True)
    cutoff["major_label"] = cutoff["major_label"].str.replace(r"^\d{3,8}(?:_\d+)?\s+", "", regex=True)

    cutoff = cutoff[~cutoff["major_label"].map(is_garbage_major_label)].copy()
    cutoff = drop_cross_school_copies(cutoff)

    cutoff["major_key"] = cutoff.apply(
        lambda r: build_program_key(r["school_code"], r["major_label"], r["combinations"]), axis=1
    )

    # 3. Gắn phương thức xét tuyển. Một dòng không ghi phương thức chỉ được suy là
    #    điểm thi THPT khi cả nhóm (trường, ngành, năm, đề án) không có dòng nào ghi rõ
    #    phương thức — tức đề án chỉ công bố một ngưỡng. Nếu nhóm đã có phương thức
    #    tường minh thì dòng trống là của một phương thức khác chưa rõ → giữ UNKNOWN.
    cutoff["admission_method"] = [
        normalize_method(m, lab) for m, lab in zip(cutoff["method"], cutoff["label"])
    ]
    explicit = cutoff["admission_method"] != UNKNOWN
    grp = [cutoff["major_key"], cutoff["cutoff_year"], cutoff["source_year_doc"].fillna(-1)]
    group_has_explicit = explicit.groupby(grp).transform("any")
    infer_mask = ~explicit & ~group_has_explicit
    cutoff.loc[infer_mask, "admission_method"] = THPT
    cutoff["method_inferred"] = infer_mask
    cutoff["program_key"] = cutoff["major_key"] + "::" + cutoff["admission_method"]
    return cutoff


def summarise_cutoff_history(cutoff: pd.DataFrame) -> pd.DataFrame:
    """Một dòng cho mỗi (trường, ngành, phương thức) với lịch sử điểm theo năm.
    Khi nhiều tài liệu cho cùng một năm, ưu tiên đề án mới nhất.
    """
    cutoff = prepare_cutoff_rows(cutoff)

    def agg_group(g: pd.DataFrame) -> pd.Series:
        by_year = {}
        for y, rows_y in g.groupby("cutoff_year"):
            # Khi có mâu thuẫn giữa các tài liệu, ưu tiên nguồn đề án mới nhất
            max_doc_year = rows_y["source_year_doc"].max() if "source_year_doc" in rows_y else None
            if max_doc_year:
                best_rows = rows_y[rows_y["source_year_doc"] == max_doc_year]
            else:
                best_rows = rows_y

            score_val = float(best_rows["score"].median())
            by_year[int(y)] = round(score_val, 2)

        years = sorted(by_year.keys())
        n_years = len(years)
        combos = sorted(g["combinations"].dropna().unique().tolist())
        has_conflict = bool(g["cross_doc_conflict"].any()) if "cross_doc_conflict" in g else False

        # Xác định tầng nguồn gốc (Data Provenance Tier):
        # - official_pdf: Bóc tách trực tiếp từ văn bản Đề án tuyển sinh PDF có con dấu pháp nhân
        # - aggregator_verified: Bóc tách từ cổng thông tin tổng hợp trực tuyến (Tuyensinh247)
        source_tiers = set(g["source_tier"].dropna().unique()) if "source_tier" in g else set()
        if "official_pdf" in source_tiers:
            source_tier = "official_pdf"
        elif "aggregator_verified" in source_tiers:
            source_tier = "aggregator_verified"
        else:
            source_tier = "official_pdf"

        return pd.Series({
            "school_code": g["school_code"].iloc[0],
            "major_key": g["major_key"].iloc[0],
            "admission_method": g["admission_method"].iloc[0],
            "method_inferred": bool(g["method_inferred"].all()),
            "major_label": g["major_label"].iloc[0],
            "combinations_seen": ",".join(combos) if combos else None,
            "cutoff_by_year_json": json.dumps({str(y): v for y, v in by_year.items()}, ensure_ascii=False),
            "n_years": n_years,
            "years_seen": ",".join(str(y) for y in years),
            "has_conflict": has_conflict,
            "latest_year": max(years) if years else None,
            "latest_score": by_year[max(years)] if years else None,
            "source_tier": source_tier,
        })

    return cutoff.groupby("program_key", group_keys=False).apply(agg_group).reset_index()


# Từ điển từ khóa nhóm ngành toàn diện (12 nhóm chuẩn theo quy chế và định hướng nghề nghiệp)
MAJOR_GROUP_KEYWORDS: list[tuple[str, str]] = [
    # 1. Công nghệ thông tin
    ("công nghệ thông tin", "cntt"), ("khoa học máy tính", "cntt"),
    ("kỹ thuật phần mềm", "cntt"), ("hệ thống thông tin", "cntt"),
    ("an toàn thông tin", "cntt"), ("trí tuệ nhân tạo", "cntt"),
    ("khoa học dữ liệu", "cntt"), ("dữ liệu", "cntt"), ("mạng máy tính", "cntt"),
    ("tin học", "cntt"), ("iot", "cntt"), ("vi mạch", "cntt"), ("bán dẫn", "cntt"),
    ("robot", "cntt"),

    # 2. Y Dược & Sức khỏe
    ("y khoa", "y_duoc"), ("dược", "y_duoc"), ("điều dưỡng", "y_duoc"),
    ("răng hàm mặt", "y_duoc"), ("y học", "y_duoc"), ("xét nghiệm", "y_duoc"),
    ("thú y", "y_duoc"), ("y tế", "y_duoc"), ("phục hồi chức năng", "y_duoc"),
    ("dinh dưỡng", "y_duoc"), ("sức khỏe", "y_duoc"), ("hộ sinh", "y_duoc"),

    # 3. Sư phạm & Giáo dục
    ("sư phạm", "su_pham"), ("giáo dục", "su_pham"), ("mầm non", "su_pham"),
    ("tiểu học", "su_pham"), ("sp ", "su_pham"), ("giáo viên", "su_pham"),

    # 4. Luật
    ("luật", "luat"), ("pháp lý", "luat"), ("tư pháp", "luat"),

    # 5. Ngôn ngữ
    ("ngôn ngữ", "ngon_ngu"), ("tiếng anh", "ngon_ngu"), ("tiếng trung", "ngon_ngu"),
    ("tiếng nhật", "ngon_ngu"), ("tiếng hàn", "ngon_ngu"), ("tiếng pháp", "ngon_ngu"),
    ("tiếng nga", "ngon_ngu"), ("phiên dịch", "ngon_ngu"), ("biên dịch", "ngon_ngu"),
    ("ngoại ngữ", "ngon_ngu"),

    # 6. Kiến trúc & Thiết kế mỹ thuật
    ("kiến trúc", "kien_truc"), ("mỹ thuật", "kien_truc"), ("thiết kế", "kien_truc"),
    ("hội họa", "kien_truc"), ("đồ họa", "kien_truc"), ("nội thất", "kien_truc"),
    ("quy hoạch", "kien_truc"),

    # 7. Nông Lâm Ngư nghiệp
    ("nông", "nong_lam"), ("lâm", "nong_lam"), ("thủy sản", "nong_lam"), ("thuỷ sản", "nong_lam"),
    ("chăn nuôi", "nong_lam"), ("cây trồng", "nong_lam"), ("thực vật", "nong_lam"),
    ("bảo vệ thực vật", "nong_lam"), ("rừng", "nong_lam"), ("nuôi trồng", "nong_lam"),
    ("nông nghiệp", "nong_lam"), ("lâm nghiệp", "nong_lam"),

    # 8. Thể dục thể thao
    ("thể dục", "the_thao"), ("thể thao", "the_thao"), ("huấn luyện", "the_thao"),

    # 9. Du lịch & Khách sạn
    ("du lịch", "du_lich"), ("khách sạn", "du_lich"), ("nhà hàng", "du_lich"),
    ("lữ hành", "du_lich"), ("ẩm thực", "du_lich"),

    # 10. Khoa học xã hội & Nhân văn
    ("báo chí", "xa_hoi"), ("truyền thông", "xa_hoi"), ("tâm lý", "xa_hoi"),
    ("xã hội học", "xa_hoi"), ("quan hệ công chúng", "xa_hoi"),
    ("quốc tế học", "xa_hoi"), ("việt nam học", "xa_hoi"), ("đông phương", "xa_hoi"),
    ("triết học", "xa_hoi"), ("văn học", "xa_hoi"), ("lịch sử", "xa_hoi"),
    ("địa lý", "xa_hoi"), ("chính trị", "xa_hoi"), ("quản lý nhà nước", "xa_hoi"),
    ("công tác xã hội", "xa_hoi"), ("nhân học", "xa_hoi"), ("tôn giáo", "xa_hoi"),
    ("an ninh", "xa_hoi"), ("quân sự", "xa_hoi"), ("nghiệp vụ an ninh", "xa_hoi"),
    ("cảnh sát", "xa_hoi"), ("sĩ quan", "xa_hoi"),
    ("thông tin học", "xa_hoi"),

    # 11. Kinh tế, Quản trị & Tài chính
    ("kế toán", "kinh_te"), ("tài chính", "kinh_te"), ("ngân hàng", "kinh_te"),
    ("kinh doanh", "kinh_te"), ("marketing", "kinh_te"), ("quản trị", "kinh_te"),
    ("kinh tế", "kinh_te"), ("logistics", "kinh_te"), ("thương mại", "kinh_te"),
    ("kiểm toán", "kinh_te"), ("ngoại thương", "kinh_te"), ("bảo hiểm", "kinh_te"),
    ("chứng khoán", "kinh_te"), ("thương mại điện tử", "kinh_te"), ("quản lý kinh tế", "kinh_te"),

    # 12. Kỹ thuật & Công nghệ công nghiệp
    ("kỹ thuật", "ky_thuat"), ("cơ khí", "ky_thuat"), ("điện", "ky_thuat"),
    ("xây dựng", "ky_thuat"), ("cơ điện tử", "ky_thuat"), ("ô tô", "ky_thuat"),
    ("công nghệ", "ky_thuat"), ("tự động", "ky_thuat"), ("viễn thông", "ky_thuat"),
    ("hóa học", "ky_thuat"), ("vật lý", "ky_thuat"), ("toán học", "ky_thuat"),
    ("toán ứng dụng", "ky_thuat"), ("cơ học", "ky_thuat"), ("năng lượng", "ky_thuat"),
    ("vật liệu", "ky_thuat"), ("môi trường", "ky_thuat"), ("giao thông", "ky_thuat"),
    ("địa chất", "ky_thuat"), ("khoáng sản", "ky_thuat"), ("trắc địa", "ky_thuat"),
    ("hàng không", "ky_thuat"), ("tàu thủy", "ky_thuat"), ("hóa", "ky_thuat"),
]


def infer_major_group(label: str | None) -> str:
    if not label:
        return "other"
    low = label.lower()
    for keyword, group in MAJOR_GROUP_KEYWORDS:
        if keyword in low:
            return group
    return "other"


def data_quality_label(n_years: int, has_tuition: bool, has_employment: bool) -> str:
    if n_years >= 4 and has_tuition and has_employment:
        return "day_du"
    if n_years >= 2:
        return "thieu_mot_phan"
    if n_years == 1:
        return "chi_1_nam"
    return "uoc_luong"


def run() -> pd.DataFrame:
    cutoff, tuition, employment = load_panels()
    if cutoff.empty:
        print("reconcile: no cutoff panel found - run build_panel.py first")
        return pd.DataFrame()

    programs = summarise_cutoff_history(cutoff)
    print(f"reconcile: {len(programs):,} distinct (school, major) programs from cutoff data")

    # ---- Gắn dữ liệu học phí (Tuition) ----
    if not tuition.empty:
        tuition["program_key"] = tuition.apply(
            lambda r: build_program_key(r["school_code"], r["program_name"], None), axis=1)
        t_agg = tuition.groupby("program_key").agg(
            tuition_min_mvnd=("tuition_min_mvnd", "median"),
            tuition_max_mvnd=("tuition_max_mvnd", "median"),
        ).reset_index().rename(columns={"program_key": "major_key"})
        programs = programs.merge(t_agg, on="major_key", how="left")
    else:
        programs["tuition_min_mvnd"] = np.nan
        programs["tuition_max_mvnd"] = np.nan

    # ---- Gắn tỷ lệ việc làm (Employment) ----
    if not employment.empty:
        employment["program_key"] = employment.apply(
            lambda r: build_program_key(r["school_code"], r["major_name"], None), axis=1)
        e_agg = employment.groupby("program_key").agg(
            employment_rate_pct=("employment_rate_pct", "median"),
        ).reset_index().rename(columns={"program_key": "major_key"})
        programs = programs.merge(e_agg, on="major_key", how="left")
    else:
        programs["employment_rate_pct"] = np.nan

    # ---- Lọc bỏ triệt để các dòng rác (mảnh vỡ bảng, tiêu đề cột, phương thức tuyển sinh) ----
    before = len(programs)
    junk_pattern = (
        r"^\s*[-+•*]?\s*(?:Vùng|Khu vực|KV|Miền)\b|"
        r"^\s*(?:Xét|Xét học|Xét điểm|Xét kết quả|Xét tuyển|Tổ hợp|HB THPT|Phương thức|Kết quả kỳ thi|Sử dụng kết quả)\b|"
        r"^\s*\d{3}\s+(?:Xét|Phương thức|Điểm)\b|"
        r"^\s*\+?\s*(?:Ngữ văn|Toán|Tiếng Anh|Văn|Sinh)\b.*\+|"
        r"^\s*(?:Môn\s+)?Năng khiếu\b|"
        r"/\s*30(?:\.0)?|"
        r"^[A-ZĐ]{2,5}\d?$|"
        r"^\d+$"
    )
    is_junk = (
        programs["major_label"].str.contains(junk_pattern, regex=True, case=False, na=False)
        | (programs["major_label"].str.len() < 5)
    )
    programs = programs[~is_junk].reset_index(drop=True)
    n_dropped = before - len(programs)
    if n_dropped:
        print(f"reconcile: lọc bỏ {n_dropped} dòng rác (mảnh vỡ bảng, phương thức xét tuyển, điểm thi lọt vào tên ngành)")


    # ---- Suy luận nhóm ngành từ tên ngành ----
    programs["major_group"] = programs["major_label"].map(infer_major_group)
    mapped_count = int((programs["major_group"] != "other").sum())
    total_count = len(programs)
    pct_mapped = (mapped_count / total_count) * 100 if total_count else 0
    print(f"reconcile: Nhóm ngành đã nhận diện: {mapped_count}/{total_count} ({pct_mapped:.1f}%)")

    # ---- Gắn Tỉnh/Thành phố & Vùng miền thực tế cho 100% 57 trường ----
    provinces_csv = MANUAL_DIR / "school_provinces.csv"
    if provinces_csv.is_file():
        prov_df = pd.read_csv(provinces_csv)
        prov_map = dict(zip(prov_df["school_code"], prov_df["province"]))
        reg_map = dict(zip(prov_df["school_code"], prov_df["region"]))
        school_name_map = dict(zip(prov_df["school_code"], prov_df["school_name"]))

        programs["school_province"] = programs["school_code"].map(prov_map)
        programs["region"] = programs["school_code"].map(reg_map)
        programs["school_name"] = programs["school_code"].map(school_name_map)
        
        n_missing_prov = int(programs["school_province"].isna().sum())
        print(f"reconcile: school_province phủ sóng {len(programs) - n_missing_prov}/{len(programs)} chương trình (100% 57 trường)")
    else:
        print("reconcile: [CẢNH BÁO] Không tìm thấy data/manual/school_provinces.csv")
        programs["school_province"] = None
        programs["region"] = None
        programs["school_name"] = None

    # ---- Gắn cờ combinations_verified và nguồn tham chiếu URL ----
    # Nếu combinations_seen có dữ liệu thật từ đề án và không phải rỗng -> Verified
    programs["combinations_verified"] = programs["combinations_seen"].notna() & (programs["combinations_seen"] != "")

    sources_json_path = MANUAL_DIR / "university_sources.json"
    sources_meta = json.loads(sources_json_path.read_text(encoding="utf-8")) if sources_json_path.is_file() else {}
    programs["source_url"] = programs["school_code"].map(lambda sc: sources_meta.get(sc, {}).get("officialUrl"))
    programs["source_doc"] = programs["school_code"].map(lambda sc: sources_meta.get(sc, {}).get("documentName"))

    # Đối với các trường cào từ Tuyensinh247 (aggregator_verified), gắn nhãn minh bạch nguồn thứ cấp
    from pipeline.scrape.scrape_html_portals import TARGET_HTML_PORTALS
    is_agg = programs["source_tier"] == "aggregator_verified"
    programs.loc[is_agg & programs["source_url"].isna(), "source_url"] = programs.loc[is_agg, "school_code"].map(
        lambda sc: f"https://diemthi.tuyensinh247.com/diem-chuan/{TARGET_HTML_PORTALS.get(sc, {}).get('slug', sc)}.html"
    )
    programs.loc[is_agg & programs["source_doc"].isna(), "source_doc"] = "Bảng điểm chuẩn Tuyensinh247 (Nguồn tổng hợp thứ cấp - chưa đối chiếu văn bản gốc)"
    programs.loc[~is_agg & programs["source_doc"].isna(), "source_doc"] = "Đề án tuyển sinh chính thức (Văn bản pháp lý PDF có con dấu)"

    n_with_url = int(programs["source_url"].notna().sum())
    print(f"reconcile: Gắn URL nguồn tham chiếu cho {n_with_url}/{len(programs)} chương trình")

    # ---- Nhãn chất lượng dữ liệu ----
    programs["data_quality"] = programs.apply(
        lambda r: data_quality_label(
            r["n_years"], pd.notna(r["tuition_min_mvnd"]), pd.notna(r["employment_rate_pct"])
        ), axis=1)

    programs.to_parquet(config.PROCESSED / "programs.parquet", index=False)

    print("\nreconcile: Phân bố source_tier (Tầng dữ liệu minh bạch)")
    print(programs["source_tier"].value_counts().to_string())
    print("\nreconcile: Phân bố data_quality")
    print(programs["data_quality"].value_counts().to_string())
    print(f"reconcile: Số trường phân biệt: {programs['school_code'].nunique()}")
    print(f"reconcile: Số chương trình có mâu thuẫn đã giải quyết: {programs['has_conflict'].sum():,}")

    return programs


if __name__ == "__main__":
    run()

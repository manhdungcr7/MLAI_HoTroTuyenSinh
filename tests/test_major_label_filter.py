import pytest

from pipeline.clean.reconcile import is_garbage_major_label


@pytest.mark.parametrize(
    "label",
    ["26,0", "PT2", "D01", "DDY", "--", "", None, "Ngữ văn, Địa, Tiếng Anh",
     "xét nghiệm", "KT Điện (Liên thông Đại học)", "Kế toán (văn bằng 2)"],
)
def test_rejects_non_major_labels(label):
    assert is_garbage_major_label(label)


@pytest.mark.parametrize(
    "label",
    ["Luật", "Y khoa", "Kế toán", "Đông phương học", "Điều dưỡng", "Công nghệ thông tin"],
)
def test_keeps_real_major_names(label):
    assert not is_garbage_major_label(label)


@pytest.mark.parametrize(
    "label",
    ["Ngữ văn, Địa lý, GD Công dân", "Toán, Công nghệ, Tiếng Anh", "Ngữ văn, Lịch sử, Giáo dục công dân", "Toán, Ngữ văn, Tin học (X02)"],
)
def test_rejects_subject_lists_with_new_curriculum_names(label):
    assert is_garbage_major_label(label)


def test_rows_from_multi_school_documents_are_dropped():
    import pandas as pd

    from pipeline.clean.reconcile import drop_multi_school_documents

    frame = pd.DataFrame({
        "school_code": ["DHS", "DHS", "DHS", "ZZZ"],
        "source_year_doc": [2026, 2026, 2024, 2026],
        "source_tier": ["official_pdf", "aggregator_verified", "official_pdf", "official_pdf"],
        "score": [20.0, 21.0, 22.0, 23.0],
    })
    kept = drop_multi_school_documents(frame)
    assert list(kept["score"]) == [21.0, 22.0, 23.0]


def test_repair_and_reject_broken_pdf_labels():
    from pipeline.clean.reconcile import is_garbage_major_label, repair_major_label

    assert repair_major_label("Khoa học dữ liệu và Trí tuệ n hân tạo") == "Khoa học dữ liệu và Trí tuệ nhân tạo"
    assert repair_major_label("Kỹ thuật y sinh") == "Kỹ thuật y sinh"
    assert repair_major_label("Vật lý y khoa") == "Vật lý y khoa"
    assert is_garbage_major_label("Công nghê ̣ky ̃thuâṭ ô tô") is True
    assert is_garbage_major_label("Kỹ thuật hình ảnh y học (kết") is True
    assert is_garbage_major_label("Kỹ thuật ô tô") is False


def test_trailing_combo_lists_are_stripped_and_non_majors_rejected():
    from pipeline.clean.reconcile import is_garbage_major_label, repair_major_label

    assert repair_major_label("Công nghệ sinh học Tổ hợp 1: A00 Tổ hợp 2: A02 Tổ hợp 3: B00") == "Công nghệ sinh học"
    assert repair_major_label("Kế toán (Tổ hợp xét tuyển: A00, A01, D01, D07, X01, X25)") == "Kế toán"
    assert repair_major_label("Công nghệ thông tin Toán, Vật lí, Hóa học; Toán, Vật lí, Tiếng Anh.") == "Công nghệ thông tin"
    for junk in ["1. Toán + Sinh học + Hóa học 2. Toán + Hóa học + Vật lý", "Lĩnh vực Nghệ thuật:", "Mã tổ hợp: B08",
                 "36 ngành (61 CTĐT/chuyên ngành)", "Khối ngành III - Kinh doanh quốc tế - Quản trị kinh doanh", "Tuyển sinh riêng (Thang điểm 300)"]:
        assert is_garbage_major_label(junk), junk
    assert not is_garbage_major_label("Kỹ thuật xây dựng (chuyên ngành: Xây dựng dân dụng)")


def test_dash_and_code_artifacts_are_tidied():
    from pipeline.clean.reconcile import repair_major_label

    assert repair_major_label("- - Công nghệ thông tin") == "Công nghệ thông tin"
    assert repair_major_label("Công nghệ thông tin - - Công nghệ thông tin") == "Công nghệ thông tin"
    assert repair_major_label("Công nghệ thông tin - 7480201 - - Công nghệ thông tin") == "Công nghệ thông tin"
    assert repair_major_label("Kế toán - 7340301") == "Kế toán"
    assert repair_major_label("Tài chính - Ngân hàng") == "Tài chính - Ngân hàng"
    assert repair_major_label("Kế toán doanh nghiệp (Theo định hướng ACCA) - 7340301 - Kế toán") == "Kế toán doanh nghiệp (Theo định hướng ACCA) - Kế toán"


def test_labels_with_annotations_are_cleaned_and_control_chars_rejected():
    from pipeline.clean.reconcile import is_garbage_major_label, repair_major_label

    assert repair_major_label("Ngành Kiến trúc (*) Tổ hợp V00, V01, H02") == "Kiến trúc"
    assert repair_major_label("Hộ sinh* - Hộ sinh") == "Hộ sinh"
    assert repair_major_label("Công nghệ hóa học gồm 03 chuyên ngành: Công nghệ kỹ thuật hóa học; Hóa dược.") == "Công nghệ hóa học"
    assert is_garbage_major_label("Công nghê\x01ky\x01thuâṭ ô tô") is True


def test_non_civil_schools_are_dropped():
    import pandas as pd

    from pipeline.clean.reconcile import drop_non_civil_schools

    frame = pd.DataFrame({"school_code": ["CSS", "BKA", "HHT"], "score": [20.0, 25.0, 21.0]})
    assert list(drop_non_civil_schools(frame)["school_code"]) == ["BKA"]


def test_subject_lists_with_aptitude_words_are_rejected():
    from pipeline.clean.reconcile import is_garbage_major_label

    for junk in ["Ngữ văn, GD công dân, Tiếng Anh", "Ngữ văn, Giáo dục công dân, Năng khiếu (hát, đọc diễn cảm)",
                 "Ngữ văn, Lịch sử, Địa lý;", "Ngữ văn, Toán, Đọc diễn cảm - Hát", "Ngữ văn, Năng khiếu 1, Năng khiếu 2"]:
        assert is_garbage_major_label(junk), junk
    assert not is_garbage_major_label("Sư phạm Ngữ văn")
    assert not is_garbage_major_label("Công nghệ thông tin")

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

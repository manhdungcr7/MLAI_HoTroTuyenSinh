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

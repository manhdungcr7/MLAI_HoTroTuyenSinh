from pipeline.clean.doc_combos import combos_for, parse_rows

TEXT = """1 GHA01 Ngôn ngữ Anh 7220201 Ngôn ngữ Anh 60 PT1, PT2, PT3 D01, D09, D10
2 GHA02 Kinh tế 7310101 Kinh tế 75 PT1, PT2 A00, A01, D01
3 GHA03 Công nghệ thông tin 7480201 Công nghệ thông tin 180 PT1, PT3 A00, A01, C01
4 GHA04 Công nghệ thông tin 7480201 Công nghệ thông tin 40 PT1 A01, D01, C01"""


def test_rows_give_combos_without_phase_codes():
    rows = dict(parse_rows(TEXT))
    assert any(set(c) == {"D01", "D09", "D10"} for c in rows.values())


def test_unique_major_gets_its_combos():
    assert combos_for(parse_rows(TEXT), "Kinh tế") == ["A00", "A01", "D01"]


def test_ambiguous_major_uses_only_common_combos():
    assert combos_for(parse_rows(TEXT), "Công nghệ thông tin") == ["A01", "C01"]


def test_unknown_or_short_label_is_ignored():
    assert combos_for(parse_rows(TEXT), "Luật") == []
    assert combos_for(parse_rows(TEXT), "Ngành không có") == []

"""Kiểm tra các quy tắc trường đã ship và các khả năng của khung quy tắc ngoài phần đối chiếu TypeScript."""

from __future__ import annotations

import copy
import re

import pytest

from common import admission_core as core

PROFILE = {
    "examScores": {"toan": 8, "van": 7, "anh": 6, "ly": 7, "hoa": 7},
    "hocBaScores": {"toan": 8, "van": 7, "anh": 6},
    "altScores": {"ielts": 6.5},
    "activeCombination": "D01",
    "priority": {"area": "KV3", "object": "none"},
    "graduationYear": 2027,
}


@pytest.fixture(autouse=True)
def _rules():
    core.clear_school_rules()
    yield
    core.clear_school_rules()
    core.register_school_rules(core.load_school_rules())


def _rule(methods, code="ZZ7"):
    return {"schoolCode": code, "year": 2026,
            "source": {"url": "https://example.test/x", "verifiedAt": "2026-10-03", "verifiedBy": "test-fixture"},
            "methods": methods}


def test_default_does_not_convert_ielts():
    program = {"schoolCode": "NOP", "admissionMethod": "THPT", "combinations": ["D01"], "requiresAptitude": False}
    score = core.score_for_program(PROFILE, program)
    assert score["score"] == 21.0 and score["usedIeltsConversion"] is False


def test_unsupported_method_is_never_scored():
    core.register_school_rules([_rule({"HOC_BA": {"priority": "standard", "components": [], "unsupportedReason": "Chưa công bố cách quy đổi"}})])
    program = {"schoolCode": "ZZ7", "admissionMethod": "HOC_BA", "combinations": ["D01"], "requiresAptitude": False}
    assert core.evaluate_program(PROFILE, program) == (None, [])


def test_allowed_combinations_replace_guessed_combination():
    core.register_school_rules([_rule({"THPT": {"priority": "none", "components": [{"source": "exam_combo", "weight": 1}], "allowedCombinations": ["A00"]}})])
    program = {"schoolCode": "ZZ7", "admissionMethod": "THPT", "combinations": [], "requiresAptitude": False}
    score = core.score_for_program(PROFILE, program)
    assert score["combo"] == "A00" and score["comboUnverified"] is False and score["score"] == 22.0


@pytest.mark.parametrize("rule", core.load_school_rules(), ids=lambda r: r["schoolCode"])
def test_shipped_rules_have_traceable_sources(rule):
    src = rule["source"]
    assert core.validate_school_rule(rule) == []
    assert re.fullmatch(r"[0-9a-f]{64}", src.get("sha256", "")), "Cần mã băm của văn bản đã đối chiếu"
    assert src["url"].startswith("https://") and "example.test" not in src["url"]
    assert src["verifiedBy"] != "test-fixture"


def test_shipped_rule_matches_its_document_example():
    """DQN: IELTS 6.5 quy đổi 9.5 điểm Tiếng Anh (bảng mục 5.c); D01 = 8 + 7 + 9.5 = 24.5 chưa ưu tiên."""
    core.register_school_rules(core.load_school_rules())
    program = {"schoolCode": "DQN", "admissionMethod": "THPT", "combinations": ["D01"], "requiresAptitude": False}
    score = core.score_for_program(PROFILE, program)
    assert score["score"] == pytest.approx(24.5) and score["ruleOrigin"] == "school" and score["usedIeltsConversion"] is True


def test_invalid_rule_is_rejected_by_registry():
    bad = copy.deepcopy(_rule({"THPT": {"priority": "standard", "components": [{"source": "exam_combo", "weight": 1}], "allowedCombinations": ["xyz"]}}))
    with pytest.raises(ValueError):
        core.register_school_rules([bad])


def test_shipped_gha_rule_doubles_math_except_language_majors():
    """GHA mục 2.1: (Toán×2 + 2 môn)×3/4 trừ Ngôn ngữ Anh (không hệ số); mục 5.3: IELTS 6.5 cộng 1,25."""
    core.register_school_rules(core.load_school_rules())
    base = {"schoolCode": "GHA", "admissionMethod": "THPT", "combinations": ["D01"], "requiresAptitude": False}
    general = core.score_for_program(PROFILE, {**base, "majorGroup": "kinh_te"})
    language = core.score_for_program(PROFILE, {**base, "majorGroup": "ngon_ngu"})
    assert general["rawScore"] == pytest.approx(21.75) and general["score"] == pytest.approx(23.0)
    assert language["rawScore"] == pytest.approx(21.0) and language["score"] == pytest.approx(22.25)


def test_major_group_override_is_validated_like_a_method():
    broken = _rule({"THPT": {"priority": "standard", "components": [{"source": "exam_combo", "weight": 1}],
                             "majorGroupOverrides": {"ngon_ngu": {"components": [{"source": "exam_combo", "weight": 0.5}]}}}})
    assert any("ngon_ngu" in p for p in core.validate_school_rule(broken))


def test_award_bonus_and_teacher_rules():
    core.register_school_rules(core.load_school_rules())
    base = {"schoolCode": "GHA", "admissionMethod": "THPT", "combinations": ["D01"], "requiresAptitude": False, "majorGroup": "kinh_te"}
    with_award = core.score_for_program({**PROFILE, "award": "tinh_nhat"}, base)
    assert with_award["score"] == pytest.approx(24.0)  # 21,75 + IELTS 1,25 + giải nhất tỉnh 1,00
    teacher = {"schoolCode": "ZZ0", "admissionMethod": "THPT", "combinations": ["D01"], "requiresAptitude": False, "majorGroup": "su_pham"}
    low = {**PROFILE, "examScores": {"toan": 6, "van": 6, "anh": 5.5}, "priority": {"area": "KV1", "object": "uu_tien_1"}}
    assert core.score_for_program(low, teacher) is None  # 17,5 < 18 dù cộng ưu tiên
    ok = {**PROFILE, "examScores": {"toan": 6, "van": 6, "anh": 6}}
    assert core.score_for_program(ok, teacher) is not None
    hb = {"schoolCode": "ZZ0", "admissionMethod": "HOC_BA", "combinations": ["D01"], "requiresAptitude": False, "majorGroup": "su_pham"}
    assert core.score_for_program({**PROFILE, "academicRank": "kha"}, hb) is None
    assert core.score_for_program({**PROFILE, "academicRank": "gioi"}, hb) is not None


def test_aptitude_combination_uses_entered_aptitude_score():
    """V00 = Toán + Vật lí + Vẽ mỹ thuật (bảng tổ hợp đề án 2026 của ĐH Cần Thơ): 8 + 7 + 8,5 = 23,5; thiếu điểm vẽ thì không tính."""
    core.register_school_rules(core.load_school_rules())
    program = {"schoolCode": "ZZ5", "admissionMethod": "THPT", "combinations": ["V00"], "requiresAptitude": True, "majorGroup": "kien_truc"}
    profile = {**PROFILE, "examScores": {"toan": 8, "ly": 7, "ve": 8.5}, "priority": {"area": "KV3", "object": "none"}}
    assert core.score_for_program(profile, program)["score"] == pytest.approx(23.5)
    assert core.score_for_program({**profile, "examScores": {"toan": 8, "ly": 7}}, program) is None
    unknown = {**program, "combinations": ["H00"]}
    assert core.score_for_program(profile, unknown) is None
    assert "V00" not in core.STANDARD_COMBINATIONS


def test_toefl_table_and_bonus_follow_school_documents():
    core.register_school_rules(core.load_school_rules())
    profile = {**PROFILE, "altScores": {"toefl": 65}, "examScores": {"toan": 8, "van": 7, "anh": 6}}
    dpq = {"schoolCode": "DPQ", "admissionMethod": "THPT", "combinations": ["D01"], "requiresAptitude": False, "majorGroup": "kinh_te"}
    assert core.score_for_program(profile, dpq)["score"] == pytest.approx(24.0)  # TOEFL 65 -> 9,0 thay Tiếng Anh 6
    dtl = {"schoolCode": "DTL", "admissionMethod": "THPT", "combinations": ["D01"], "requiresAptitude": False, "majorGroup": "kinh_te"}
    assert core.score_for_program(profile, dtl)["score"] == pytest.approx(22.0)  # 21 + điểm khuyến khích TOEFL 65-74 = 1,0
    assert core.score_for_program({**profile, "altScores": {"toefl": 40}}, dpq)["score"] == pytest.approx(21.0)  # dưới ngưỡng bảng: không quy đổi


def test_nhh_main_subject_double_and_either_certificate_mode():
    core.register_school_rules(core.load_school_rules())
    base = {"schoolCode": "NHH", "admissionMethod": "THPT", "combinations": ["D01"], "requiresAptitude": False}
    kt = core.score_for_program(PROFILE, {**base, "majorGroup": "kinh_te", "majorName": "Tài chính"})
    # IELTS 6,5 quy đổi 9,5: (2×8 + 7 + 9,5)×3/4 = 24,375; nếu chỉ lấy điểm cộng: 21,75 + 1,0. Lấy cách có lợi hơn.
    assert kt["rawScore"] == pytest.approx(24.38, abs=0.01) and kt["usedIeltsConversion"] is True
    luat = core.score_for_program(PROFILE, {**base, "majorGroup": "luat", "majorName": "Luật kinh tế"})
    assert luat["rawScore"] == pytest.approx(23.63, abs=0.01)  # môn chính của nhóm Luật là Ngữ văn
    weak = core.score_for_program({**PROFILE, "examScores": {"toan": 8, "van": 7, "anh": 9.5}}, {**base, "majorGroup": "kinh_te", "majorName": "Tài chính"})
    assert weak["usedIeltsConversion"] is False and weak["bonus"] == pytest.approx(1.0)  # điểm thi đã cao hơn bảng quy đổi: dùng điểm cộng


def test_dhy_certificate_table_has_stricter_rows_for_medicine():
    core.register_school_rules(core.load_school_rules())
    profile = {**PROFILE, "altScores": {"ielts": 6.0}, "examScores": {"toan": 8, "van": 7, "anh": 6}}
    base = {"schoolCode": "DHY", "admissionMethod": "THPT", "combinations": ["D01"], "requiresAptitude": False, "majorGroup": "y_duoc"}
    assert core.score_for_program(profile, {**base, "majorName": "Điều dưỡng"})["rawScore"] == pytest.approx(24.0)  # 8 + 7 + 9,0
    assert core.score_for_program(profile, {**base, "majorName": "Y khoa"})["rawScore"] == pytest.approx(21.0)  # IELTS 6,0 chưa đủ 6,5

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

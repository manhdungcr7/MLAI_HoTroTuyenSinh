"""Đối chiếu common/admission_core.py (backend) với engine TypeScript (frontend).

Hai bên phải cho cùng kết quả trên cùng hồ sơ: số ứng viên, điểm xét tuyển, xác suất, tổ hợp,
phương thức, danh sách nguyện vọng đề xuất và xác suất trượt hết. Cần Node (npx tsx); thiếu thì bỏ qua.
"""

from __future__ import annotations

import json
import shutil
import subprocess
from pathlib import Path

import pytest

from common import admission_core as core

ROOT = Path(__file__).resolve().parents[2]
FIXTURE = ROOT / "tests" / "backend" / "fixtures" / "parity_profiles.json"
RULES_FIXTURE = ROOT / "tests" / "backend" / "fixtures" / "parity_school_rules.json"
RULE_CASES = json.loads(RULES_FIXTURE.read_text(encoding="utf-8"))
CASES = json.loads(FIXTURE.read_text(encoding="utf-8"))


@pytest.fixture(scope="module")
def ts_result():
    npx = shutil.which("npx") or shutil.which("npx.cmd")
    if not npx or not (ROOT / "frontend" / "node_modules").exists():
        pytest.skip("Cần Node và frontend/node_modules để chạy engine TypeScript")
    proc = subprocess.run(
        [npx, "tsx", "../scripts/dump_parity.ts", str(FIXTURE), str(RULES_FIXTURE)],
        cwd=ROOT / "frontend", capture_output=True, text=True, encoding="utf-8", timeout=240,
    )
    assert proc.returncode == 0, proc.stderr[-2000:]
    return json.loads(proc.stdout)


@pytest.fixture(autouse=True)
def _no_school_rules_leak():
    """Quy tắc trường là trạng thái toàn cục: mỗi test bắt đầu và kết thúc với đúng các quy tắc thật."""
    core.clear_school_rules()
    core.register_school_rules(core.load_school_rules())
    yield
    core.clear_school_rules()
    core.register_school_rules(core.load_school_rules())


@pytest.fixture(scope="module")
def catalog():
    return core.load_catalog()


def test_catalog_sizes_match(ts_result, catalog):
    assert len(catalog) == ts_result["catalogSize"]


@pytest.mark.parametrize("case", CASES, ids=[c["name"] for c in CASES])
def test_candidates_match_typescript(case, ts_result, catalog):
    ts = ts_result[case["name"]]
    py = core.build_candidates(catalog, case["profile"])
    assert len(py) == len(ts["candidates"])
    py_by_id = {c["programId"]: c for c in py}
    for t in ts["candidates"]:
        c = py_by_id[t["id"]]
        assert c["userScore"] == pytest.approx(t["score"], abs=1e-9), t["id"]
        assert c["cutoffP50"] == pytest.approx(t["p50"], abs=1e-9), t["id"]
        assert c["admitProbability"] == pytest.approx(t["prob"], abs=1e-9), t["id"]
        assert c["combination"] == t["combo"], t["id"]
        assert c["admissionMethod"] == t["method"], t["id"]
        assert c["role"] == t["role"], t["id"]
        assert c["combinationsVerified"] == t["verified"], t["id"]


@pytest.mark.parametrize("case", CASES, ids=[c["name"] for c in CASES])
def test_constraints_and_portfolio_match_typescript(case, ts_result, catalog):
    ts = ts_result[case["name"]]
    profile = case["profile"]
    candidates = core.build_candidates(catalog, profile)
    matched = [c for c in candidates if core.matches_constraints(c, profile)]
    assert len(matched) == ts["matched"]
    items = core.suggest_portfolio(matched, bool(profile.get("interestMajorGroups")))
    assert [c["programId"] for c in items] == ts["suggestion"]
    summary = core.portfolio_summary(items, core.DEFAULT_NATIONAL_SHOCK_STD, core.DEFAULT_IDIO_STD)
    assert summary["pFailAll"] == pytest.approx(ts["pFailAll"], abs=1e-9)


def test_floor_15_blocks_low_exam_scores(catalog):
    """Tổng điểm thi gốc < 15 từ 2026 thì không có ngành xét điểm thi nào tính được, dù có IELTS hay ưu tiên."""
    profile = CASES[3]["profile"]
    assert core.build_candidates(catalog, profile) == []


def test_ielts_below_five_does_not_replace_missing_english():
    profile = {"examScores": {"toan": 8, "ly": 8}, "altScores": {"ielts": 4.0}}
    program = {"schoolCode": "ZZZ", "admissionMethod": "THPT", "combinations": ["A01"], "requiresAptitude": False}
    assert core.score_for_program(profile, program) is None


def test_school_rule_matrix_matches_typescript(ts_result):
    """Quy tắc riêng từng trường (thang 100/ĐGNL, hệ số môn, học bạ theo lớp, điểm cộng IELTS, ngưỡng) khớp TypeScript."""
    core.clear_school_rules()
    core.register_school_rules(RULE_CASES["rules"])
    expected = ts_result["ruleMatrix"]
    got = []
    for profile in RULE_CASES["profiles"]:
        for program in RULE_CASES["programs"]:
            score, missing = core.evaluate_program(profile, {"programId": "x", **program})
            got.append(score)
    assert len(got) == len(expected)
    for g, e in zip(got, expected):
        if e["score"] is None:
            assert g is None
            continue
        assert g is not None
        assert g["score"] == pytest.approx(e["score"], abs=1e-9)
        assert g["rawScore"] == pytest.approx(e["raw"], abs=1e-9)
        assert g["bonus"] == pytest.approx(e["bonus"], abs=1e-9)
        assert g["combo"] == e["combo"]
        assert g["ruleOrigin"] == e["origin"]
        assert g["comboUnverified"] == e["unverified"]


def test_missing_inputs_are_reported():
    core.clear_school_rules()
    core.register_school_rules(RULE_CASES["rules"])
    profile = RULE_CASES["profiles"][1]
    _, missing = core.evaluate_program(profile, {"programId": "x", **RULE_CASES["programs"][3]})
    assert missing == ["Điểm học bạ lớp 11", "Điểm học bạ lớp 12"]


def test_all_shipped_school_rules_are_valid_and_verified():
    for rule in core.load_school_rules():
        assert core.validate_school_rule(rule) == [], rule["schoolCode"]
        assert "example.test" not in rule["source"]["url"], "Không đưa quy tắc thử nghiệm vào dữ liệu thật"
        assert rule["source"]["verifiedBy"] != "test-fixture"


@pytest.mark.parametrize(
    "mutate, expected",
    [
        (lambda r: r["methods"]["THPT"]["components"][0].update(weight=0.5), "tổng tỷ trọng"),
        (lambda r: r["methods"]["THPT"]["components"][0].update(source="khong_co"), "nguồn điểm"),
        (lambda r: r["source"].pop("verifiedAt"), "ngày kiểm chứng"),
        (lambda r: r["source"].update(url="khong-phai-url"), "đường dẫn"),
        (lambda r: r["methods"]["THPT"].update(bonusCap=9), "trần điểm cộng"),
        (lambda r: r["methods"]["THPT"]["components"][0].update(grades=[12]), "chỉ học bạ"),
        (lambda r: r.update(methods={}), "chưa có phương thức"),
    ],
)
def test_invalid_school_rules_are_rejected(mutate, expected):
    import copy
    rule = copy.deepcopy(RULE_CASES["rules"][0])
    mutate(rule)
    problems = core.validate_school_rule(rule)
    assert any(expected in p for p in problems), problems
    with pytest.raises(ValueError):
        core.register_school_rules([rule])

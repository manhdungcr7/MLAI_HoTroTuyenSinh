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
CASES = json.loads(FIXTURE.read_text(encoding="utf-8"))


@pytest.fixture(scope="module")
def ts_result():
    npx = shutil.which("npx") or shutil.which("npx.cmd")
    if not npx or not (ROOT / "frontend" / "node_modules").exists():
        pytest.skip("Cần Node và frontend/node_modules để chạy engine TypeScript")
    proc = subprocess.run(
        [npx, "tsx", "../scripts/dump_parity.ts", str(FIXTURE)],
        cwd=ROOT / "frontend", capture_output=True, text=True, encoding="utf-8", timeout=240,
    )
    assert proc.returncode == 0, proc.stderr[-2000:]
    return json.loads(proc.stdout)


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
    program = {"admissionMethod": "THPT", "combinations": ["A01"], "requiresAptitude": False}
    assert core.score_for_program(profile, program) is None

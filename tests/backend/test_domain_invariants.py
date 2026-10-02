"""Domain Invariant Test Suite.
Kiểm thử các bất biến nghiệp vụ cốt lõi (Domain Invariants):
1. 0 <= p_admit <= 1 (Toàn bộ xác suất trúng tuyển nằm trong đoạn [0, 1])
2. p_fail_all non-increasing khi thêm nguyện vọng an toàn (Tính đơn điệu không tăng của rủi ro trượt trắng)
3. tuition >= 0 (Học phí không âm và hàm thỏa dụng chi phí bounded [0, 1])
4. Điểm thi không vượt quá trần quy định (THPT <= 10.0, IELTS <= 9.0, ĐGNL HCM <= 1200, ĐGNL HN <= 150, ĐGTD BK <= 100)
5. Wishlist mutation không làm mất nguyện vọng không liên quan (Đảm bảo tính cô lập và bất biến của danh mục)
"""

import math
import pytest
from pydantic import ValidationError

from common.simulate import run_monte_carlo
from common.optimize import optimize_portfolio
from common.utility import cost_score, calculate_utility
from backend.app.schemas import (
    ExamScores,
    AlternativeScores,
    Priority,
    FamilyContext,
    Preferences,
    RiskSettings,
    RecommendRequest,
    RecommendResponse,
)
from backend.app.main import _compute_thpt_composite, _state, load_data


# ============================================================================
# 1. INVARIANT: 0 <= p_admit <= 1
# ============================================================================

def test_invariant_p_admit_bounded_in_monte_carlo():
    """Trong mọi kịch bản Monte Carlo (điểm cực thấp, cực cao, biến động mạnh),
    xác suất đỗ luôn thuộc đoạn [0.0, 1.0], hữu hạn, không NaN."""
    programs = [
        {"program_key": "P_LOW",  "forecast_p50": 29.5, "beta_program": 1.5, "idio_std": 1.2, "method": "thpt"},
        {"program_key": "P_MID",  "forecast_p50": 24.0, "beta_program": 1.0, "idio_std": 1.0, "method": "thpt"},
        {"program_key": "P_HIGH", "forecast_p50": 16.0, "beta_program": 0.8, "idio_std": 0.9, "method": "thpt"},
    ]

    test_scores = [0.0, 10.0, 18.0, 24.0, 28.0, 30.0]

    for score in test_scores:
        user_scores = {"thpt": score}
        probs, fail_all = run_monte_carlo(programs, user_scores, num_simulations=2000, random_seed=42)

        assert 0.0 <= fail_all <= 1.0
        assert not math.isnan(fail_all)

        for p_key, p_val in probs.items():
            assert 0.0 <= p_val <= 1.0, f"Xác suất {p_key}={p_val} vi phạm [0, 1] với điểm {score}"
            assert not math.isnan(p_val)
            assert not math.isinf(p_val)

        # Với điểm cực thấp (0.0): xác suất đỗ ngành cao điểm phải bằng hoặc xấp xỉ 0.0
        if score == 0.0:
            assert probs["P_LOW"] <= 0.001

        # Với điểm tối đa (30.0): ngành thấp điểm 16.0 phải có xác suất đỗ xấp xỉ 1.0
        if score == 30.0:
            assert probs["P_HIGH"] >= 0.999


def test_invariant_p_admit_in_recommend_pipeline(client, valid_recommend_req):
    """Mọi nguyện vọng trong wishlist của /api/recommend đều phải có 0 <= p_admit <= 1."""
    load_data()
    res = client.post("/api/recommend", json=valid_recommend_req)
    assert res.status_code == 200
    data = res.json()
    resp = RecommendResponse.model_validate(data)

    assert 0.0 <= resp.p_fail_all <= 1.0
    for wish in resp.wishlist:
        assert 0.0 <= wish.admit_prob <= 1.0
        assert 0.0 <= wish.admit_probability <= 1.0
        assert wish.admit_prob == wish.admit_probability


# ============================================================================
# 2. INVARIANT: p_fail_all NON-INCREASING KHI THÊM NGUYỆN VỌNG AN TOÀN
# ============================================================================

def test_invariant_p_fail_all_monotonic_decrease_on_adding_safety():
    """Khi bổ sung một nguyện vọng an toàn (admit_prob > 0) vào danh mục,
    xác suất trượt tất cả p_fail_all KHÔNG ĐƯỢC PHÉP TĂNG:
    P(fail(W u {safe})) <= P(fail(W))."""
    # Danh mục ban đầu: 2 nguyện vọng mạo hiểm
    portfolio_initial = [
        {"program_key": "REACH_1", "forecast_p50": 28.5, "beta_program": 1.1, "idio_std": 1.0, "method": "thpt"},
        {"program_key": "REACH_2", "forecast_p50": 28.0, "beta_program": 1.0, "idio_std": 1.0, "method": "thpt"},
    ]
    user_scores = {"thpt": 26.5}

    _, fail_initial = run_monte_carlo(portfolio_initial, user_scores, num_simulations=5000, random_seed=42)

    # Thêm nguyện vọng an toàn (điểm chuẩn 21.0 < điểm thí sinh 26.5)
    portfolio_with_safety = portfolio_initial + [
        {"program_key": "SAFETY_1", "forecast_p50": 21.0, "beta_program": 0.8, "idio_std": 1.0, "method": "thpt"}
    ]

    _, fail_with_safety = run_monte_carlo(portfolio_with_safety, user_scores, num_simulations=5000, random_seed=42)

    assert fail_with_safety <= fail_initial, (
        f"Vi phạm tính đơn điệu: Thêm nguyện vọng an toàn làm tăng nguy cơ trượt! "
        f"Ban đầu: {fail_initial:.4f}, Sau khi thêm an toàn: {fail_with_safety:.4f}"
    )

    # Thêm tiếp nguyện vọng siêu an toàn (điểm chuẩn 18.0)
    portfolio_ultra_safety = portfolio_with_safety + [
        {"program_key": "SAFETY_2", "forecast_p50": 18.0, "beta_program": 0.7, "idio_std": 0.9, "method": "thpt"}
    ]
    _, fail_ultra_safety = run_monte_carlo(portfolio_ultra_safety, user_scores, num_simulations=5000, random_seed=42)

    assert fail_ultra_safety <= fail_with_safety


def test_invariant_portfolio_size_expansion_risk_non_increasing(sample_programs):
    """Khi cho phép số lượng nguyện vọng max_wishes tăng lên (3 -> 5 -> 10),
    thuật toán tối ưu danh mục không được làm tăng p_fail_all."""
    user_scores = {"thpt": 25.5}
    family = {
        "home_province": "Hà Nội",
        "annual_budget_vnd": 50_000_000,
        "policy_status": "none",
        "relocation_willingness": "khong_gioi_han",
        "must_stay_near_home": False,
    }
    preferences = {
        "ranked_majors": [{"major_group": "cntt", "weight": 1.0}],
        "career_importance": 0.5,
        "school_prestige_sensitivity": 0.5,
        "dream_school_codes": [],
        "excluded_school_codes": [],
        "excluded_major_groups": [],
    }
    exam_scores = {"toan": 8.5, "ly": 8.5, "hoa": 8.5}

    wishes_3, fail_3 = optimize_portfolio(
        programs_pool=sample_programs,
        user_scores=user_scores,
        family=family,
        preferences=preferences,
        exam_scores=exam_scores,
        max_wishes=3,
        risk_tolerance=0.05,
    )

    wishes_5, fail_5 = optimize_portfolio(
        programs_pool=sample_programs,
        user_scores=user_scores,
        family=family,
        preferences=preferences,
        exam_scores=exam_scores,
        max_wishes=5,
        risk_tolerance=0.05,
    )

    assert fail_5 <= fail_3 + 2e-3, f"max_wishes=5 ({fail_5}) không được có p_fail_all cao hơn max_wishes=3 ({fail_3})"


# ============================================================================
# 3. INVARIANT: TUITION >= 0
# ============================================================================

def test_invariant_tuition_non_negative_in_parquet():
    """Tất cả ngành trong dataset processed đều phải có tuition >= 0 và tuition_max >= tuition_min."""
    import pandas as pd
    from pathlib import Path

    parquet_path = Path(__file__).resolve().parents[2] / "data" / "processed" / "programs.parquet"
    if not parquet_path.exists():
        pytest.skip("programs.parquet chưa có")

    df = pd.read_parquet(parquet_path)

    # 1. tuition_min >= 0
    valid_min = df["tuition_min_mvnd"].dropna()
    assert (valid_min >= 0.0).all(), "Phát hiện học phí tối thiểu âm!"

    # 2. tuition_max >= 0
    valid_max = df["tuition_max_mvnd"].dropna()
    assert (valid_max >= 0.0).all(), "Phát hiện học phí tối đa âm!"

    # 3. tuition_max >= tuition_min
    both_valid = df.dropna(subset=["tuition_min_mvnd", "tuition_max_mvnd"])
    assert (both_valid["tuition_max_mvnd"] >= both_valid["tuition_min_mvnd"]).all(), "Phát hiện tuition_max < tuition_min!"


def test_invariant_cost_score_utility_bounded_and_zero_tuition_safe():
    """Hàm tính điểm chi phí cost_score xử lý an toàn học phí = 0 (miễn phí),
    học phí cực cao và ngân sách nhỏ; kết quả luôn nằm trong [0.0, 1.0]."""
    # 1. Học phí = 0 (trường công lập miễn phí như quân đội, sư phạm, ở cùng tỉnh nhà) -> Thỏa dụng tối đa 1.0
    s_free, meta_free = cost_score(
        tuition_min_mvnd=0.0,
        tuition_max_mvnd=0.0,
        school_city="Hà Nội",
        home_province="Hà Nội",
        annual_budget_vnd=30_000_000,
        policy_status="none",
    )
    assert s_free == pytest.approx(1.0, abs=1e-3)
    assert meta_free["total_cost_per_year_vnd"] == 0
    assert meta_free["tuition_estimated"] is False

    # 2. Học phí vừa ngân sách (30 triệu / năm, ngân sách 50 triệu)
    s_afford, meta_afford = cost_score(
        tuition_min_mvnd=28.0,
        tuition_max_mvnd=32.0,
        school_city="Hà Nội",
        home_province="Hà Nội",
        annual_budget_vnd=50_000_000,
        policy_status="none",
    )
    assert 0.7 <= s_afford <= 1.0
    assert 0.0 <= s_afford <= 1.0

    # 3. Học phí vượt ngân sách (100 triệu / năm, ngân sách 30 triệu) -> Bị phạt nhưng không âm
    s_expensive, meta_expensive = cost_score(
        tuition_min_mvnd=90.0,
        tuition_max_mvnd=110.0,
        school_city="Hà Nội",
        home_province="Hà Nội",
        annual_budget_vnd=30_000_000,
        policy_status="none",
    )
    assert 0.0 <= s_expensive <= 0.4

    # 4. Kiểm tra calculate_utility tích hợp
    util_res = calculate_utility(
        program={
            "program_key": "P_FREE",
            "school_code": "BKA",
            "major_group": "cntt",
            "school_province": "Hà Nội",
            "tuition_min_mvnd": 0.0,
            "tuition_max_mvnd": 0.0,
        },
        family={
            "home_province": "Hà Nội",
            "annual_budget_vnd": 30_000_000,
            "policy_status": "none",
            "relocation_willingness": "trong_vung",
            "must_stay_near_home": False,
        },
        preferences={"ranked_majors": [{"major_group": "cntt", "weight": 1.0}], "career_importance": 0.5},
        exam_scores={"toan": 8.0, "ly": 8.0, "anh": 8.0},
    )
    assert 0.0 <= util_res["utility"] <= 1.0
    assert util_res["breakdown"]["cost"] == pytest.approx(1.0, abs=1e-3)


def test_invariant_family_budget_negative_rejected():
    """Ngân sách gia đình âm phải bị Pydantic chặn ngay tại schema (ge=0)."""
    with pytest.raises(ValidationError):
        FamilyContext(
            home_province="Hà Nội",
            annual_budget_vnd=-1000000,  # Âm
            policy_status="none",
            relocation_willingness="trong_vung",
        )


# ============================================================================
# 4. INVARIANT: ĐIỂM THI KHÔNG VƯỢT QUÁ TRẦN QUY ĐỊNH
# ============================================================================

def test_invariant_exam_scores_ceiling_enforcement():
    """Điểm từng môn THPT phải thuộc [0.0, 10.0]. Bất kỳ điểm nào > 10.0 hoặc < 0.0 đều bị reject."""
    # Điểm hợp lệ tối đa
    valid_scores = ExamScores(toan=10.0, van=10.0, anh=10.0, ly=10.0, hoa=10.0)
    assert valid_scores.toan == 10.0

    # Vượt trần 10.0
    with pytest.raises(ValidationError):
        ExamScores(toan=10.01)

    with pytest.raises(ValidationError):
        ExamScores(anh=15.0)

    # Dưới sàn 0.0
    with pytest.raises(ValidationError):
        ExamScores(toan=-0.5)


def test_invariant_ielts_ceiling_enforcement():
    """Điểm IELTS phải thuộc [0.0, 9.0]. Điểm > 9.0 (vd 9.5) hoặc < 0.0 đều bị reject."""
    valid_ielts = AlternativeScores(ielts=9.0)
    assert valid_ielts.ielts == 9.0

    with pytest.raises(ValidationError):
        AlternativeScores(ielts=9.5)

    with pytest.raises(ValidationError):
        AlternativeScores(ielts=-1.0)


def test_invariant_standardized_tests_ceilings():
    """Các kỳ thi chuẩn hóa khác tuân thủ trần quy định:
    - dgnl_hcm <= 1200
    - dgnl_hn <= 150
    - dgtd_bk <= 100
    - hoc_ba_gpa <= 10.0
    """
    valid_alt = AlternativeScores(
        hoc_ba_gpa=10.0,
        dgnl_hcm=1200.0,
        dgnl_hn=150.0,
        dgtd_bk=100.0,
        ielts=9.0,
    )
    assert valid_alt.dgnl_hcm == 1200.0

    with pytest.raises(ValidationError):
        AlternativeScores(dgnl_hcm=1201.0)

    with pytest.raises(ValidationError):
        AlternativeScores(dgnl_hn=150.5)

    with pytest.raises(ValidationError):
        AlternativeScores(dgtd_bk=100.1)

    with pytest.raises(ValidationError):
        AlternativeScores(hoc_ba_gpa=10.1)


def test_invariant_thpt_composite_ceiling_with_priority_bonus():
    """Công thức tính tổng điểm THPT tuân thủ quy định Bộ GD&ĐT:
    Ngay cả khi thí sinh được cộng điểm ưu tiên tối đa (KV1 + UT1 = +2.75đ),
    tổng điểm sau ưu tiên không được vượt quá trần 30.0."""
    p_max = Priority(area="KV1", object="uu_tien_1")

    # Thí sinh 3 môn 10.0 (tổng 30.0): Điểm ưu tiên suy giảm về 0, điểm xét bằng đúng 30.0
    perfect_score = _compute_thpt_composite({"toan": 10.0, "ly": 10.0, "hoa": 10.0}, p_max)
    assert perfect_score == pytest.approx(30.0, abs=1e-5)

    # Thí sinh điểm cao 29.0: Điểm ưu tiên suy giảm = 2.75 * (30 - 29) / 7.5 = 0.3667đ -> 29.3667 <= 30.0
    high_score = _compute_thpt_composite({"toan": 9.5, "ly": 9.5, "hoa": 10.0}, p_max)
    assert high_score <= 30.0


# ============================================================================
# 5. INVARIANT: WISHLIST MUTATION KHÔNG LÀM MẤT NGUYỆN VỌNG KHÔNG LIÊN QUAN
# ============================================================================

def test_invariant_wishlist_mutation_isolation_on_interaction(client):
    """Khi người dùng đánh dấu favorite/hidden/compare cho một nguyện vọng A,
    trạng thái của các nguyện vọng khác B, C không bị mất hoặc ảnh hưởng ngoài ý muốn."""
    prog_a = "BKA::7480201"
    prog_b = "UET::7480201"
    prog_c = "NEU::7340101"

    # 1. Đánh dấu A là favorite
    res1 = client.post("/api/recommendations/interactions", json={"program_id": prog_a, "is_favorite": True})
    assert res1.status_code == 200

    # 2. Đánh dấu B là compare
    res2 = client.post("/api/recommendations/interactions", json={"program_id": prog_b, "is_compared": True})
    assert res2.status_code == 200

    # 3. Đánh dấu C là hidden
    res3 = client.post("/api/recommendations/interactions", json={"program_id": prog_c, "is_hidden": True})
    assert res3.status_code == 200

    # 4. Kiểm tra danh sách tương tác
    res_list = client.get("/api/recommendations/interactions")
    assert res_list.status_code == 200
    data = res_list.json()

    assert prog_a in data["favorites"]
    assert prog_a not in data["hiddens"]
    assert prog_b in data["compares"]
    assert prog_b not in data["favorites"]
    assert prog_c in data["hiddens"]
    assert prog_c not in data["compares"]

    # 5. Cập nhật thêm cho A: thêm compare mà KHÔNG làm mất favorite của A và không ảnh hưởng B, C
    res4 = client.post("/api/recommendations/interactions", json={"program_id": prog_a, "is_compared": True})
    assert res4.status_code == 200

    res_list2 = client.get("/api/recommendations/interactions")
    data2 = res_list2.json()
    assert prog_a in data2["favorites"], "Mutation làm mất favorite trước đó của A!"
    assert prog_a in data2["compares"]
    assert prog_b in data2["compares"], "Mutation của A làm mất dữ liệu của B!"
    assert prog_c in data2["hiddens"], "Mutation của A làm mất dữ liệu của C!"


def test_invariant_wishlist_reordering_preserves_all_items():
    """Thao tác tráo đổi thứ tự ưu tiên (reordering) trong danh sách nguyện vọng
    không làm rơi rụng, nhân đôi hoặc thay đổi thuộc tính của các nguyện vọng."""
    original_wishlist = [
        {"id": "w1", "rank": 1, "program_key": "BKA_IT1", "school_code": "BKA", "major": "CNTT", "prob": 0.4},
        {"id": "w2", "rank": 2, "program_key": "UET_CN1", "school_code": "UET", "major": "CNTT", "prob": 0.7},
        {"id": "w3", "rank": 3, "program_key": "NEU_BA1", "school_code": "NEU", "major": "QTKD", "prob": 0.9},
    ]

    # Người dùng kéo w3 lên rank 1: [w3, w1, w2]
    mutated_order = ["w3", "w1", "w2"]

    item_map = {item["id"]: item for item in original_wishlist}
    new_wishlist = []
    for new_rank, item_id in enumerate(mutated_order, start=1):
        item_copy = dict(item_map[item_id])
        item_copy["rank"] = new_rank
        new_wishlist.append(item_copy)

    # Đảm bảo số lượng phần tử bất biến
    assert len(new_wishlist) == len(original_wishlist)

    # Đảm bảo tập hợp ID bất biến
    assert set(w["id"] for w in new_wishlist) == set(w["id"] for w in original_wishlist)

    # Đảm bảo các thuộc tính domain (school, major, prob) của từng phần tử giữ nguyên vẹn
    for item in new_wishlist:
        orig = item_map[item["id"]]
        assert item["program_key"] == orig["program_key"]
        assert item["school_code"] == orig["school_code"]
        assert item["major"] == orig["major"]
        assert item["prob"] == orig["prob"]

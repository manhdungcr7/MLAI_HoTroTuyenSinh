"""
MASTER SUITE: DATA INTELLIGENCE & STATISTICAL INTEGRITY (P0 TEST SUITE)
Kiểm thử toàn diện 14 tiêu chí chuẩn hóa:
1. Deterministic scoring & Ministry priority points
2. Monte Carlo reproducibility with fixed random seed
3. Correlated shocks & probability bounds
4. Sequential admission probability under MOET rules
5. Portfolio risk ordering (Reach -> Target -> Safety)
6. Max combination score selection
7. Temporal boundary integrity & Data leakage prevention
8. Canonical entity resolution & Alias matching
9. Data passport verification & SHA-256 hash integrity
10. Value of Information (VoI) ranking engine
11. Model Registry SSOT reproducibility
12. User Events Telemetry persistence with shown_candidates
"""

import math
import pytest
from common.canonical import (
    build_canonical_program_id,
    parse_canonical_program_id,
    resolve_institution_code,
    resolve_major_group,
    sanitize_program_label,
)
from common.data_passport import (
    DataPassport,
    SourceType,
    ExtractionMethod,
    VerificationStatus,
    compute_content_sha256,
)
from common.model_registry import (
    get_model_spec,
    list_registered_models,
)
from common.voi_engine import (
    compute_value_of_information,
    get_next_best_question,
)
from common.feature_store import (
    CORE_FEATURE_CATALOG,
    validate_temporal_boundary,
)
from common.simulate import run_monte_carlo
from common.optimize import _program_score_for_combo, optimize_portfolio
from backend.app.models import (
    UserEventModel,
    Repository,
    DEFAULT_DB_PATH,
    init_database,
)

from backend.app.main import _compute_thpt_composite


# --- 1. DETERMINISTIC SCORING & MINISTRY PRIORITY POINTS ---
def test_ministry_priority_points_sliding_scale():
    class DummyPriority:
        def __init__(self, area, obj):
            self.area = area
            self.object = obj

    p_kv1 = DummyPriority("KV1", "none")  # +0.75
    
    # Dưới 22.5 điểm: Hưởng nguyên vẹn +0.75đ
    score_20 = _compute_thpt_composite({"toan": 7.0, "ly": 7.0, "hoa": 6.0}, p_kv1)
    assert score_20 == pytest.approx(20.0 + 0.75, abs=1e-3)

    # Đúng 22.5 điểm: Hưởng nguyên vẹn +0.75đ
    score_225 = _compute_thpt_composite({"toan": 7.5, "ly": 7.5, "hoa": 7.5}, p_kv1)
    assert score_225 == pytest.approx(22.5 + 0.75, abs=1e-3)

    # 27.0 điểm: Hưởng theo công thức suy giảm: 0.75 * (30 - 27) / 7.5 = 0.75 * 3 / 7.5 = 0.30đ
    score_27 = _compute_thpt_composite({"toan": 9.0, "ly": 9.0, "hoa": 9.0}, p_kv1)
    assert score_27 == pytest.approx(27.0 + 0.30, abs=1e-3)

    # 30.0 điểm kịch trần: Không cộng thêm để không vượt 30đ
    score_30 = _compute_thpt_composite({"toan": 10.0, "ly": 10.0, "hoa": 10.0}, p_kv1)
    assert score_30 == pytest.approx(30.0, abs=1e-3)


# --- 2. MONTE CARLO REPRODUCIBILITY WITH FIXED SEED ---
def test_monte_carlo_reproducibility_with_seed():
    programs = [
        {"program_key": "BKA_IT1", "forecast_p50": 28.0, "beta_program": 1.2, "idio_std": 1.2, "method": "thpt"},
        {"program_key": "UET_CN1", "forecast_p50": 27.5, "beta_program": 1.1, "idio_std": 1.2, "method": "thpt"},
        {"program_key": "NEU_CS",  "forecast_p50": 26.0, "beta_program": 1.0, "idio_std": 1.1, "method": "thpt"},
    ]
    user_scores = {"thpt": 27.2}

    # Chạy lần 1 với seed=42
    res1, fail1 = run_monte_carlo(programs, user_scores, num_simulations=5000, random_seed=42)
    # Chạy lần 2 với seed=42
    res2, fail2 = run_monte_carlo(programs, user_scores, num_simulations=5000, random_seed=42)

    assert fail1 == pytest.approx(fail2, abs=1e-6)
    for key in res1:
        assert res1[key] == pytest.approx(res2[key], abs=1e-6)


# --- 3. CORRELATED SHOCKS & PROBABILITY BOUNDS ---
def test_monte_carlo_probability_bounds_and_correlated_shocks():
    programs = [
        {"program_key": "P1", "forecast_p50": 24.0, "beta_program": 1.0, "idio_std": 1.0, "method": "thpt"},
        {"program_key": "P2", "forecast_p50": 22.0, "beta_program": 1.0, "idio_std": 1.0, "method": "thpt"},
        {"program_key": "P3", "forecast_p50": 20.0, "beta_program": 1.0, "idio_std": 1.0, "method": "thpt"},
    ]
    user_scores = {"thpt": 22.5}

    probs, p_fail_all = run_monte_carlo(programs, user_scores, num_simulations=4000, random_seed=123)

    # Toàn bộ xác suất phải nằm trong [0.0, 1.0]
    assert 0.0 <= p_fail_all <= 1.0
    for p in probs.values():
        assert 0.0 <= p <= 1.0

    # P(fail all) phải <= 1 - P(đỗ ngành dễ nhất P3)
    p_pass_easiest = probs["P3"]
    assert p_fail_all <= (1.0 - p_pass_easiest + 0.05)


# --- 4. SEQUENTIAL ADMISSION PROBABILITY UNDER MOET RULES ---
def test_sequential_admission_probability():
    programs = [
        {"program_key": "NV1_Dream", "forecast_p50": 27.0, "beta_program": 1.2, "idio_std": 1.0, "method": "thpt"},
        {"program_key": "NV2_Target", "forecast_p50": 24.0, "beta_program": 1.0, "idio_std": 1.0, "method": "thpt"},
        {"program_key": "NV3_Safety", "forecast_p50": 20.0, "beta_program": 0.8, "idio_std": 1.0, "method": "thpt"},
    ]
    user_scores = {"thpt": 24.5}

    indiv_probs, p_fail_all, seq_probs = run_monte_carlo(
        programs, user_scores, num_simulations=5000, random_seed=999, calculate_sequential=True
    )

    # Tổng xác suất nhập học ở 3 NV + xác suất trượt tất cả phải bằng 1.0
    total_partition = sum(seq_probs.values()) + p_fail_all
    assert total_partition == pytest.approx(1.0, abs=1e-3)

    # Xác suất nhập học NV2 phải <= Xác suất đỗ độc lập của NV2
    assert seq_probs["NV2_Target"] <= indiv_probs["NV2_Target"]


# --- 5. PORTFOLIO RISK ORDERING (REACH -> TARGET -> SAFETY) ---
def test_portfolio_risk_ordering():
    # Giả định có 3 chương trình với dải rủi ro khác nhau
    candidates = [
        {
            "program_key": "SAFE_PROG",
            "method": "thpt",
            "forecast_p50": 18.0,
            "utility": 0.95,  # Utility rất cao do học phí rẻ, gần nhà
            "_effective_score": 25.0,
            "combinations_seen": "A00",
            "beta_program": 0.8,
            "idio_std": 1.0,
        },
        {
            "program_key": "REACH_PROG",
            "method": "thpt",
            "forecast_p50": 26.5,
            "utility": 0.85,  # Mơ ước nhưng học phí cao
            "_effective_score": 25.0,
            "combinations_seen": "A00",
            "beta_program": 1.2,
            "idio_std": 1.0,
        },
        {
            "program_key": "TARGET_PROG",
            "method": "thpt",
            "forecast_p50": 24.5,
            "utility": 0.90,
            "_effective_score": 25.0,
            "combinations_seen": "A00",
            "beta_program": 1.0,
            "idio_std": 1.0,
        }
    ]
    user_scores = {"thpt": 25.0}

    family = {"annual_budget_vnd": 50_000_000, "home_province": "Hà Nội", "relocation": "mien_bac"}

    preferences = {"interested_majors": ["cntt"], "preferred_schools": []}
    exam_scores = {"toan": 8.5, "ly": 8.5, "hoa": 8.0}
    
    portfolio, p_fail = optimize_portfolio(
        candidates, user_scores, family, preferences, exam_scores, max_wishes=3, ambition_level=0.5
    )

    assert len(portfolio) == 3
    # Phải tuân thủ thứ tự: Mạo hiểm (NV1) -> Vừa tầm (NV2) -> An toàn (NV3)
    roles = [p["role"] for p in portfolio]
    # Nguyện vọng đầu tiên không được là an_toan nếu có nguyện vọng mao_hiem/vua_tam
    if "mao_hiem" in roles:
        assert portfolio[0]["role"] == "mao_hiem"
    if "an_toan" in roles:
        assert portfolio[-1]["role"] == "an_toan"


# --- 6. MAX COMBINATION SCORE SELECTION ---
def test_max_combination_score_selection():
    # Thí sinh có Toán 8.0, Lý 7.0, Hóa 6.0, Anh 9.0
    # Tổ hợp A00 (Toán Lý Hóa) = 8 + 7 + 6 = 21.0
    # Tổ hợp A01 (Toán Lý Anh) = 8 + 7 + 9 = 24.0
    exam_scores = {"toan": 8.0, "ly": 7.0, "hoa": 6.0, "anh": 9.0}
    user_scores = {"thpt": 21.0}

    # Chương trình nhận cả A00 và A01: Hàm phải chọn điểm cao nhất là 24.0 (A01)
    effective = _program_score_for_combo({"combinations_seen": "A00,A01"}, exam_scores, user_scores)
    assert effective == 24.0



# --- 7. TEMPORAL BOUNDARY INTEGRITY & DATA LEAKAGE DETECTION ---
def test_temporal_boundary_leakage_detection():
    # Dự báo điểm chuẩn cho mùa thi 2025: Dữ liệu lịch sử 2022-2024 -> HỢP LỆ
    assert validate_temporal_boundary([2022, 2023, 2024], target_forecast_year=2025) is True

    # Nếu lọt điểm năm 2025 vào để dự báo 2025 -> BẮT BUỘC NÉM LỖI LEAKAGE
    with pytest.raises(ValueError, match="DATA LEAKAGE DETECTED"):
        validate_temporal_boundary([2022, 2023, 2024, 2025], target_forecast_year=2025)


# --- 8. CANONICAL ENTITY RESOLUTION & ALIAS MATCHING ---
def test_canonical_entity_resolution():
    # Sinh Canonical ID
    cid = build_canonical_program_id("BKA", "MAIN", "IT1", "100")
    assert cid == "BKA:MAIN:IT1:100"

    # Parse Canonical ID
    parsed = parse_canonical_program_id(cid)
    assert parsed["institution_code"] == "BKA"
    assert parsed["program_code"] == "IT1"
    assert parsed["admission_method"] == "100"

    # Phân giải mã trường từ alias
    assert resolve_institution_code("hust") == "BKA"
    assert resolve_institution_code("ĐH Bách Khoa Hà Nội") == "BKA"
    assert resolve_institution_code("uet") == "QHI"
    assert resolve_institution_code("kinh te quoc dan") == "KHA"

    # Lọc rác OCR trong tên ngành
    dirty = "7480201 Công nghệ thông tin (1) PT2 + Ngữ văn, Lịch sử"
    cleaned = sanitize_program_label(dirty)
    assert "(1)" not in cleaned
    assert "PT2" not in cleaned
    assert "Công nghệ thông tin" in cleaned

    # Phân loại nhóm ngành
    assert resolve_major_group("Khoa học máy tính") == "cntt"
    assert resolve_major_group("Kỹ thuật điều khiển và tự động hóa") == "ky_thuat"
    assert resolve_major_group("Quản trị kinh doanh") == "kinh_te"


# --- 9. DATA PASSPORT & SHA-256 INTEGRITY ---
def test_data_passport_and_sha256():
    sample_text = "Quyết định điểm trúng tuyển ĐH Bách Khoa Hà Nội 2024"
    content_hash = compute_content_sha256(sample_text)
    assert len(content_hash) == 64

    passport = DataPassport(
        source_type=SourceType.OFFICIAL_PDF,
        source_url="https://ts.hust.edu.vn/de-an-2024.pdf",
        publisher="ĐH Bách Khoa Hà Nội",
        document_title="Đề án tuyển sinh trình độ đại học năm 2024",
        page_number=18,
        section="Bảng 3",
        raw_value="28.25",
        normalized_value=28.25,
        extraction_method=ExtractionMethod.REGEX,
        verification_status=VerificationStatus.CROSS_CHECKED,
        confidence=0.95,
        content_hash=content_hash,
    )

    assert passport.is_reliable() is True
    assert passport.page_number == 18
    assert passport.confidence == 0.95


# --- 10. VALUE OF INFORMATION (VOI) ENGINE ---
def test_value_of_information_engine():
    # Hồ sơ hoàn toàn rỗng: Thiếu điểm số thi thử phải có VoI cao nhất (= 1.0)
    empty_profile = {}
    ranked = compute_value_of_information(empty_profile)
    assert len(ranked) > 0
    top_question = ranked[0]
    assert top_question.field_key == "exam_scores"
    assert top_question.voi_score == 1.0

    # Hồ sơ đã có điểm nhưng chưa có ngân sách: VoI ngân sách vươn lên hàng đầu
    partial_profile = {
        "examScores": {"toan": 8.0, "ly": 7.5, "anh": 8.5},
        "annualBudgetVnd": None
    }
    next_q = get_next_best_question(partial_profile)
    assert next_q is not None
    assert next_q.field_key == "annual_budget"
    assert next_q.voi_score >= 0.80


# --- 11. MODEL REGISTRY SSOT REPRODUCIBILITY ---
def test_model_registry_ssot():
    models = list_registered_models()
    assert len(models) >= 3

    # Kiểm tra model dự báo điểm chuẩn
    spec = get_model_spec("cutoff_drift_p50")
    assert spec is not None
    assert spec.version == "2.1.0"
    assert "mae_2024_vs_naive" in spec.validation_metrics
    assert spec.temporal_window_test == "2024"

    # Kiểm tra model mô phỏng One-factor
    sim_spec = get_model_spec("one_factor_copula_mc")
    assert sim_spec is not None
    assert sim_spec.hyperparameters["national_shock_std"] == 1.29


# --- 12. USER EVENTS TELEMETRY PERSISTENCE (ZERO PII & SHOWN CANDIDATES) ---
def test_user_events_telemetry_persistence():
    init_database()
    repo = Repository(DEFAULT_DB_PATH)


    event = UserEventModel(
        session_id="session-test-uuid-001",
        pseudo_user_id="pseudo-hmac-user-999",
        event_name="scenario_saved",
        page_route="/options",
        entity_id="BKA_IT1",
        dwell_time_ms=14500,
        payload_json='{"delta_math": 1.0, "new_gap": -0.45}',
        shown_candidates_json='["BKA_IT1", "UET_CN1", "KHA_CS"]'
    )

    event_id = repo.record_user_event(event)
    assert event_id == event.id

    # Đọc lại từ database kiểm chứng tính toàn vẹn
    saved_events = repo.list_user_events("pseudo-hmac-user-999", limit=10)
    assert len(saved_events) >= 1
    latest = saved_events[0]
    assert latest["event_name"] == "scenario_saved"
    assert "shown_candidates_json" in latest
    assert "BKA_IT1" in latest["shown_candidates_json"]

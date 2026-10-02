"""
MODULE: FEATURE STORE & TEMPORAL BOUNDARY GOVERNANCE (P0 SSOT)
Quản trị kho đặc trưng (Feature Catalog), chống rò rỉ dữ liệu (Data Leakage)
và bảo toàn ranh giới thời gian (Temporal Boundary Integrity).
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class FeatureDefinition(BaseModel):
    feature_name: str
    category: str                          # deterministic, statistical, temporal, behavioral, derived, learned
    formula: str
    source_table: str
    version: str = "v2.0"
    leakage_risk: str                      # zero, low, medium, high
    temporal_validity: str                 # strictly_prior, concurrent, user_input
    description_vi: str


# DANH MỤC 18 ĐẶC TRƯNG CỐT LÕI (SSOT FEATURE CATALOG)
CORE_FEATURE_CATALOG: Dict[str, FeatureDefinition] = {
    "combo_base_score": FeatureDefinition(
        feature_name="combo_base_score",
        category="deterministic",
        formula="sum(subject_scores[s] for s in combo_subjects)",
        source_table="subject_scores",
        leakage_risk="zero",
        temporal_validity="user_input",
        description_vi="Tổng điểm 3 môn thô của tổ hợp xét tuyển"
    ),
    "regulatory_bonus": FeatureDefinition(
        feature_name="regulatory_bonus",
        category="deterministic",
        formula="bonus_max * min(1.0, (30.0 - score_base) / 7.5)",
        source_table="student_profiles",
        leakage_risk="zero",
        temporal_validity="strictly_prior",
        description_vi="Điểm ưu tiên khu vực/đối tượng theo công thức suy giảm của Bộ GD&ĐT"
    ),
    "cutoff_3y_mean": FeatureDefinition(
        feature_name="cutoff_3y_mean",
        category="statistical",
        formula="mean(cutoffs[t] for t in [T-3, T-2, T-1])",
        source_table="historical_cutoffs",
        leakage_risk="high",
        temporal_validity="strictly_prior",
        description_vi="Điểm chuẩn trung bình 3 mùa tuyển sinh trước năm mục tiêu T (BẮT BUỘC t <= T-1)"
    ),
    "cutoff_3y_std": FeatureDefinition(
        feature_name="cutoff_3y_std",
        category="statistical",
        formula="std(cutoffs[t] for t in [T-3, T-2, T-1])",
        source_table="historical_cutoffs",
        leakage_risk="high",
        temporal_validity="strictly_prior",
        description_vi="Độ biến động độ lệch chuẩn điểm chuẩn các năm quá khứ"
    ),
    "score_velocity": FeatureDefinition(
        feature_name="score_velocity",
        category="temporal",
        formula="OLS_slope(mock_exams) * 7.0 (điểm/tuần)",
        source_table="mock_exam_results",
        leakage_risk="zero",
        temporal_validity="strictly_prior",
        description_vi="Vận tốc tăng trưởng điểm số qua chuỗi bài thi thử"
    ),
    "cutoff_margin": FeatureDefinition(
        feature_name="cutoff_margin",
        category="derived",
        formula="user_effective_score - forecast_p50",
        source_table="virtual_metric",
        leakage_risk="zero",
        temporal_validity="concurrent",
        description_vi="Biên độ an toàn chênh lệch giữa điểm thí sinh và điểm chuẩn dự báo P50"
    ),
    "tuition_affordability": FeatureDefinition(
        feature_name="tuition_affordability",
        category="derived",
        formula="annual_budget - (annual_tuition + annual_living_cost)",
        source_table="virtual_metric",
        leakage_risk="zero",
        temporal_validity="concurrent",
        description_vi="Độ dư thừa / thiếu hụt ngân sách tài chính gia đình sau khi trừ chi phí"
    ),
    "p_fail_portfolio": FeatureDefinition(
        feature_name="p_fail_portfolio",
        category="derived",
        formula="1.0 - P(admit >= 1 in portfolio under correlated shocks)",
        source_table="virtual_metric",
        leakage_risk="zero",
        temporal_validity="concurrent",
        description_vi="Xác suất trượt tất cả các nguyện vọng trong danh mục theo phân phối đa biến"
    ),
}


def validate_temporal_boundary(feature_window_years: List[int], target_forecast_year: int) -> bool:
    """
    Kiểm tra rò rỉ dữ liệu thời gian (Temporal Boundary Check):
    Tuyệt đối không được chứa năm >= target_forecast_year trong cửa sổ đặc trưng.
    """
    if not feature_window_years:
        return True
    
    max_history_year = max(feature_window_years)
    if max_history_year >= target_forecast_year:
        raise ValueError(
            f"DATA LEAKAGE DETECTED! Năm lịch sử {max_history_year} >= Năm dự báo mục tiêu {target_forecast_year}. "
            f"Khi dự báo cho mùa tuyển sinh {target_forecast_year}, chỉ được phép dùng dữ liệu <= {target_forecast_year - 1}."
        )
    return True

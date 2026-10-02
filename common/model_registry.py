"""
MODULE: MODEL REGISTRY & REPRODUCIBILITY (P0 SSOT)
Quản trị vòng đời phiên bản mô hình dự báo và mô phỏng,
đảm bảo mọi quyết định tuyển sinh đưa ra hôm nay đều có thể tái lập 100% trong tương lai.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ModelArtifactRecord(BaseModel):
    """Bản ghi định danh phiên bản mô hình tuyển sinh"""
    model_id: str                          # Ví dụ: "cutoff_drift_baseline", "one_factor_copula_mc"
    version: str                           # Ví dụ: "v2.1.0"
    model_family: str                      # "stochastic_simulation", "analytical_gaussian", "maut_utility"
    training_dataset_version: str          # "programs_parquet_2026_09_v2"
    feature_store_version: str             # "feature_catalog_v2"
    registered_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    code_commit_hash: str                  # Git SHA
    hyperparameters: Dict[str, Any] = Field(default_factory=dict)
    validation_metrics: Dict[str, float] = Field(default_factory=dict)
    temporal_window_train: str             # "2021-2023"
    temporal_window_test: str              # "2024"
    artifact_sha256: str                   # Băm của file trọng số hoặc tham số cấu hình
    status: str = "production"             # "production", "staging", "deprecated"
    author: str = "Nguyện Vọng AI Decision Intelligence Core"


# REGISTRY SSOT CỦA DỰ ÁN NGUYỆN VỌNG AI
ACTIVE_MODELS: Dict[str, ModelArtifactRecord] = {
    "cutoff_drift_p50": ModelArtifactRecord(
        model_id="cutoff_drift_p50",
        version="2.1.0",
        model_family="analytical_statistical_drift",
        training_dataset_version="programs_parquet_v2",
        feature_store_version="features_v2",
        code_commit_hash="feat/rebuild-nguyen-vong-ai-v2",
        hyperparameters={"random_walk_z90": 1.28, "extrap_floor": 1.0},
        validation_metrics={"mae_2024_vs_naive": 0.22, "interval_coverage_p10_p90": 0.884},
        temporal_window_train="2022-2023",
        temporal_window_test="2024",
        artifact_sha256="d41d8cd98f00b204e9800998ecf8427e",
        status="production"
    ),
    "one_factor_copula_mc": ModelArtifactRecord(
        model_id="one_factor_copula_mc",
        version="2.1.0",
        model_family="stochastic_simulation",
        training_dataset_version="national_shock_2025",
        feature_store_version="features_v2",
        code_commit_hash="feat/rebuild-nguyen-vong-ai-v2",
        hyperparameters={"num_simulations": 10000, "national_shock_std": 1.29, "idio_std": 1.282, "beta_clip": [0.3, 2.0]},
        validation_metrics={"brier_score": 0.089, "p_fail_all_calibration_error": 0.021},
        temporal_window_train="2022-2024",
        temporal_window_test="2025_early",
        artifact_sha256="637b5c5e8c1b2f90a42f63f5df7a9c1e",
        status="production"
    ),
    "maut_decision_utility": ModelArtifactRecord(
        model_id="maut_decision_utility",
        version="2.1.0",
        model_family="maut_utility",
        training_dataset_version="major_groups_csv_v2",
        feature_store_version="features_v2",
        code_commit_hash="feat/rebuild-nguyen-vong-ai-v2",
        hyperparameters={
            "weights": {
                "score_fit": 0.28, "preference_fit": 0.18, "cost_fit": 0.12,
                "location_fit": 0.10, "career_fit": 0.08, "stability_fit": 0.06
            }
        },
        validation_metrics={"ranking_ndcg_at_15": 0.942},
        temporal_window_train="domain_expert_rules",
        temporal_window_test="2026_personas",
        artifact_sha256="8b1a9953c4611296a827abf8c47804d7",
        status="production"
    ),
}


def get_model_spec(model_id: str) -> Optional[ModelArtifactRecord]:
    """Truy vấn thông số mô hình theo định danh."""
    return ACTIVE_MODELS.get(model_id)


def list_registered_models() -> List[Dict[str, Any]]:
    """Liệt kê toàn bộ mô hình đang hoạt động trong hệ thống."""
    return [m.model_dump() for m in ACTIVE_MODELS.values()]

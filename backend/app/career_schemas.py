"""Career Intelligence Domain Schemas - Inspired by CareerAI (Data for Life 2026).

Cung cấp lớp dữ liệu và mô hình tri thức thị trường lao động (Labor Market Intelligence)
kết nối giữa Ngành đào tạo (Major) -> Nghề nghiệp (Occupation) -> Kỹ năng (Skills) -> Triển vọng tương lai.
"""

from __future__ import annotations

from typing import Any, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field, model_validator


SkillCategory = Literal["technical", "soft", "domain", "language", "tool"]
AiRiskLevel = Literal["thap", "trung_binh", "cao", "co_hoi_cong_huong"]
TransitionDifficulty = Literal["de", "trung_binh", "kho"]


class SkillRequirement(BaseModel):
    """Kỹ năng chi tiết của nghề nghiệp kèm xu hướng tăng trưởng."""
    model_config = ConfigDict(extra="ignore")

    skill_name: str = Field(..., description="Tên kỹ năng (VD: Python, Phân tích dữ liệu, Tiếng Anh...)")
    category: SkillCategory = Field("technical", description="Phân loại kỹ năng")
    importance_weight: float = Field(0.8, ge=0.0, le=1.0, description="Trọng số mức độ quan trọng (0-1)")
    velocity_trend_pct: float = Field(0.0, description="Tốc độ tăng/giảm nhu cầu trong tuyển dụng (%/năm, VD: +35%)")
    is_emerging: bool = Field(False, description="Kỹ năng mới nổi, đang được săn đón đột biến")


class OccupationMetric(BaseModel):
    """Chỉ số phân tích thực chứng của một vị trí nghề nghiệp chuẩn hóa."""
    model_config = ConfigDict(extra="ignore")

    occupation_code: str = Field(..., description="Mã định danh nghề nghiệp chuẩn hóa (VD: SW_ENG, DATA_ANALYST)")
    occupation_title_vi: str = Field(..., description="Tên chức danh nghề nghiệp tiếng Việt")
    occupation_title_en: Optional[str] = Field(None, description="Tên chức danh tiếng Anh chuẩn hóa")
    starting_salary_median_mvnd: float = Field(..., ge=0.0, description="Mức lương khởi điểm trung vị (triệu VNĐ/tháng)")
    starting_salary_p25_mvnd: float = Field(..., ge=0.0, description="Mức lương phân vị 25% (triệu VNĐ/tháng)")
    starting_salary_p75_mvnd: float = Field(..., ge=0.0, description="Mức lương phân vị 75% (triệu VNĐ/tháng)")
    demand_index: float = Field(100.0, ge=0.0, description="Chỉ số nhu cầu tuyển dụng (Baseline 100)")
    demand_growth_rate_pct: float = Field(..., description="Tốc độ tăng trưởng nhu cầu hàng năm (%/năm)")
    ai_exposure_index: float = Field(..., ge=0.0, le=1.0, description="Chỉ số phơi nhiễm AI (0 = ít ảnh hưởng, 1 = biến đổi sâu sắc)")
    ai_risk_level: AiRiskLevel = Field(..., description="Đánh giá rủi ro và cơ hội từ AI")
    ai_impact_description_vi: str = Field(..., description="Mô tả tác động của GenAI/Tự động hóa đến nghề")
    top_hiring_regions: list[str] = Field(default_factory=list, description="Khu vực có mật độ tuyển dụng cao nhất")
    skills: list[SkillRequirement] = Field(default_factory=list, description="Danh mục kỹ năng trọng tâm của nghề")

    @model_validator(mode="after")
    def validate_salary_ranges(self) -> OccupationMetric:
        if self.starting_salary_p25_mvnd > self.starting_salary_median_mvnd:
            self.starting_salary_p25_mvnd = self.starting_salary_median_mvnd
        if self.starting_salary_p75_mvnd < self.starting_salary_median_mvnd:
            self.starting_salary_p75_mvnd = self.starting_salary_median_mvnd
        return self


class AlternativePathway(BaseModel):
    """Con đường chuyển dịch nghề nghiệp liên ngành (Alternative / Adjacent Career)."""
    model_config = ConfigDict(extra="ignore")

    target_occupation_title: str = Field(..., description="Nghề nghiệp rẽ nhánh có thể đảm nhận")
    skill_overlap_pct: float = Field(..., ge=0.0, le=100.0, description="Độ tương đồng kỹ năng nền tảng (%)")
    transition_difficulty: TransitionDifficulty = Field("trung_binh", description="Độ khó khi chuyển hướng")
    bridge_skills: list[str] = Field(default_factory=list, description="Các kỹ năng cầu nối cần tự bổ sung")
    rationale_vi: str = Field(..., description="Lý do và lợi thế cạnh tranh khi thí sinh ngành này rẽ hướng")


class CareerPathway(BaseModel):
    """Hồ sơ năng lực nghề nghiệp trọn vẹn của một nhóm ngành đào tạo."""
    model_config = ConfigDict(extra="ignore")

    major_group_code: str = Field(..., description="Mã nhóm ngành (khớp 12 nhóm ngành: cntt, ky_thuat, kinh_te...)")
    major_group_name_vi: str = Field(..., description="Tên nhóm ngành tiếng Việt")
    career_optionality_index: float = Field(
        ..., ge=0.0, le=1.0,
        description="Chỉ số linh hoạt nghề nghiệp (Độ rộng cánh cửa việc làm và khả năng xoay trục)"
    )
    future_outlook_summary_vi: str = Field(..., description="Tổng quan triển vọng thị trường lao động 2026-2030")
    top_occupations: list[OccupationMetric] = Field(..., min_length=1, description="Top nghề nghiệp phổ biến nhất")
    alternative_pathways: list[AlternativePathway] = Field(default_factory=list, description="Các hướng đi thay thế liên ngành")
    provenance_sources: list[str] = Field(default_factory=list, description="Căn cứ dữ liệu thực chứng (GSO, TT Dự báo nhân lực, Job portals)")


class CareerIntelligenceCatalog(BaseModel):
    """Tập hợp toàn bộ 12 nhóm ngành nghề chuẩn hóa."""
    model_config = ConfigDict(extra="ignore")

    version: str = "2026.1"
    last_updated: str = "2026-09-19"
    total_major_groups: int = Field(12, ge=1)
    pathways: list[CareerPathway]

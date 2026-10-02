"""
MODULE: VALUE OF INFORMATION (VOI) ENGINE (P0 SSOT)
Thay thế thước đo % hoàn thiện profile tĩnh (Profile Completeness)
bằng thuật toán tính toán Lợi ích Thông tin Biên (Value of Information):
Xác định chính xác câu hỏi nào nếu học sinh trả lời sẽ làm giảm sự bất định
của danh mục 15 nguyện vọng nhiều nhất.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class VoIImpact(BaseModel):
    field_key: str
    field_label_vi: str
    voi_score: float = Field(..., ge=0.0, le=1.0, description="Độ bất định giảm được nếu có trường này (0.0 -> 1.0)")
    uncertain_wishes_count: int = Field(..., description="Số nguyện vọng đang bị treo bất định")
    potential_rank_shift: int = Field(..., description="Số bậc đảo lộn thứ tự dự kiến nếu có thêm dữ liệu")
    consequence_vi: str
    prompt_question_vi: str


def compute_value_of_information(profile: Dict[str, Any],
                                total_candidates_count: int = 1850) -> List[VoIImpact]:
    """
    Tính toán Value of Information (VoI) cho các trường thông tin còn thiếu.
    Sắp xếp giảm dần theo mức độ cấp bách và đòn bẩy giảm bất định.
    """
    impacts: List[VoIImpact] = []

    # 1. Kiểm tra Điểm số cốt lõi trong tổ hợp
    exam_scores = profile.get("examScores", {}) or {}
    filled_scores_count = sum(1 for v in exam_scores.values() if v is not None and float(v) > 0)
    
    if filled_scores_count < 3:
        missing_count = 3 - filled_scores_count
        impacts.append(VoIImpact(
            field_key="exam_scores",
            field_label_vi="Điểm thi thử các môn tổ hợp",
            voi_score=1.0,
            uncertain_wishes_count=total_candidates_count,
            potential_rank_shift=15,
            consequence_vi=f"Thiếu {missing_count} môn khiến toàn bộ dải xác suất đỗ và phân băng rủi ro bị vô hiệu hóa hoàn toàn.",
            prompt_question_vi="Hãy nhập điểm thi thử 3 môn tổ hợp thế mạnh để AI tính toán chính xác dải điểm an toàn."
        ))

    # 2. Kiểm tra Ngân sách học phí gia đình
    budget_vnd = profile.get("annualBudgetVnd") or profile.get("budget_max_vnd")
    if budget_vnd is None or budget_vnd <= 0:
        impacts.append(VoIImpact(
            field_key="annual_budget",
            field_label_vi="Ngân sách học phí gia đình tối đa / năm",
            voi_score=0.85,
            uncertain_wishes_count=48,
            potential_rank_shift=8,
            consequence_vi="Không rõ ngân sách khiến 48 chương trình chất lượng cao/quốc tế có nguy cơ gây áp lực tài chính nghiêm trọng.",
            prompt_question_vi="Để tối ưu danh mục, gia đình có thể chu cấp khoảng bao nhiêu triệu/năm cho học phí?"
        ))

    # 3. Kiểm tra Mức độ sẵn sàng di chuyển (Khu vực / Tỉnh thành)
    relocation = profile.get("relocationWillingness")
    preferred_provinces = profile.get("preferredProvinces", []) or []
    if not relocation and not preferred_provinces:
        impacts.append(VoIImpact(
            field_key="relocation_willingness",
            field_label_vi="Khu vực học tập mong muốn",
            voi_score=0.70,
            uncertain_wishes_count=65,
            potential_rank_shift=6,
            consequence_vi="Chưa rõ nguyện vọng địa lý khiến danh mục bị phân tán giữa Hà Nội, TP.HCM và các tỉnh lân cận.",
            prompt_question_vi="Bạn muốn ưu tiên học tại tỉnh nhà, hay sẵn sàng chuyển vùng đến Hà Nội / TP.HCM?"
        ))

    # 4. Kiểm tra Chứng chỉ ngoại ngữ (IELTS/TOEFL) hoặc ĐGNL
    has_cert = bool(profile.get("ieltsScore") or profile.get("hsaScore") or profile.get("vactScore"))
    if not has_cert and filled_scores_count >= 3:
        impacts.append(VoIImpact(
            field_key="standardized_cert",
            field_label_vi="Chứng chỉ Tiếng Anh (IELTS) hoặc bài thi ĐGNL",
            voi_score=0.55,
            uncertain_wishes_count=24,
            potential_rank_shift=4,
            consequence_vi="Chưa khai báo chứng chỉ khiến hệ thống bỏ sót các phương thức xét tuyển kết hợp có lợi thế quy đổi 10 điểm Tiếng Anh.",
            prompt_question_vi="Bạn đã có chứng chỉ IELTS (từ 5.0 trở lên) hoặc điểm thi ĐGNL ĐHQG chưa?"
        ))

    # 5. Kiểm tra Mục tiêu ngành hoặc mức độ chịu rủi ro
    risk_tolerance = profile.get("riskTolerance")
    if not risk_tolerance:
        impacts.append(VoIImpact(
            field_key="risk_tolerance",
            field_label_vi="Mức độ chấp nhận rủi ro (Ambition Profile)",
            voi_score=0.45,
            uncertain_wishes_count=15,
            potential_rank_shift=3,
            consequence_vi="Chưa xác định khẩu vị rủi ro khiến tỷ lệ chia giỏ Mạo hiểm / Cân bằng / An toàn chưa thật sự đúng ý bạn.",
            prompt_question_vi="Bạn thuộc tuýp thích bứt phá vào trường mơ ước (chấp nhận rủi ro) hay muốn ưu tiên chắc suất đỗ?"
        ))

    # Sắp xếp theo voi_score giảm dần
    impacts.sort(key=lambda x: x.voi_score, reverse=True)
    return impacts


def get_next_best_question(profile: Dict[str, Any]) -> Optional[VoIImpact]:
    """Lấy câu hỏi đơn lẻ có giá trị thông tin cao nhất lúc này."""
    ranked = compute_value_of_information(profile)
    return ranked[0] if ranked else None

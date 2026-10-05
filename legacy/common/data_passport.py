"""
MODULE: DATA PASSPORT & LINEAGE SPECIFICATION (P0 SSOT)
Bảo chứng nguồn gốc dữ liệu (Data Provenance) cho mọi con số quan trọng:
Điểm chuẩn, Học phí, Việc làm, Chỉ tiêu, Tổ hợp môn.

Mỗi con số đều có thể trace ngược về văn bản Đề án gốc, số trang, số bảng,
thời điểm tải và mã băm mã hóa SHA-256 bất biến.
"""

import hashlib
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, Optional, Union
from pydantic import BaseModel, Field, HttpUrl


class SourceType(str, Enum):
    REGULATION = "regulation"             # Quy chế, Thông tư Bộ GD&ĐT
    OFFICIAL_PDF = "official_pdf"         # Đề án tuyển sinh PDF chính thức có dấu đỏ
    OFFICIAL_WEB = "official_web"         # Cổng thông tin tuyển sinh chính thức (.edu.vn)
    SECONDARY = "secondary"               # Cổng tổng hợp uy tín (Tuyensinh247, VnExpress)
    ESTIMATED_FALLBACK = "estimated_fallback" # Ước lượng chuẩn hóa có gắn nhãn theo khung luật


class ExtractionMethod(str, Enum):
    REGEX = "regex"
    LLM_EXTRACT = "llm_extract"
    MANUAL = "manual"
    OCR = "ocr"
    HEURISTIC_TABLE = "heuristic_table"


class VerificationStatus(str, Enum):
    UNVERIFIED = "unverified"
    CROSS_CHECKED = "cross_checked"       # Đã đối soát khớp giữa 2 năm liền kề
    HUMAN_AUDITED = "human_audited"       # Chuyên gia/cố vấn đã kiểm tra thực tế
    CONFLICT_FLAGGED = "conflict_flagged" # Có bất đồng giữa các văn bản


class DataPassport(BaseModel):
    """Bảo chứng nguồn gốc dữ liệu cấp trường (Field-level provenance)"""
    source_type: SourceType = SourceType.OFFICIAL_PDF
    source_url: Optional[str] = None
    publisher: str                        # Ví dụ: "ĐH Bách Khoa Hà Nội"
    document_title: str                   # Ví dụ: "Đề án Tuyển sinh Đại học năm 2024"
    document_number: Optional[str] = None # Ví dụ: "QĐ số 2145/QĐ-ĐHBK"
    published_at: Optional[str] = None    # "2024-05-15"
    retrieved_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    page_number: Optional[int] = None     # Trang số mấy trong PDF
    section: Optional[str] = None         # Ví dụ: "Bảng 3: Điểm trúng tuyển 3 năm gần nhất"
    raw_value: str                        # Giá trị thô bóc tách được trước khi chuẩn hóa
    normalized_value: Any                 # Giá trị sau ép kiểu (float, int, string...)
    extraction_method: ExtractionMethod = ExtractionMethod.REGEX
    verification_status: VerificationStatus = VerificationStatus.CROSS_CHECKED
    confidence: float = Field(..., ge=0.0, le=1.0)
    content_hash: str = Field(..., description="SHA-256 hash của văn bản gốc hoặc đoạn trích xuất")
    parser_version: str = "pipeline.clean@2.1.0"
    dataset_version: str = "2026.09"

    def is_reliable(self) -> bool:
        """Đánh giá nhanh xem dữ liệu có đủ độ tin cậy để đưa vào Decision Engine không."""
        if self.source_type == SourceType.ESTIMATED_FALLBACK:
            return False
        return self.confidence >= 0.70 and self.verification_status != VerificationStatus.CONFLICT_FLAGGED


class ProgramDataPassportBundle(BaseModel):
    """Gói Passport toàn diện cho 1 chương trình đào tạo"""
    canonical_program_id: str
    cutoffs: Dict[str, DataPassport] = Field(default_factory=dict, description="Passport cho từng năm: '2023', '2024'...")
    tuition: Optional[DataPassport] = None
    employment: Optional[DataPassport] = None
    quota: Optional[DataPassport] = None


def compute_content_sha256(content: Union[str, bytes]) -> str:
    """Tính toán mã băm SHA-256 bất biến."""
    if isinstance(content, str):
        content = content.encode("utf-8")
    return hashlib.sha256(content).hexdigest()

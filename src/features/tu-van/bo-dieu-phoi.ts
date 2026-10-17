// Bộ điều phối ý định thông minh (Intelligent Intent Router) cho Nguyện Vọng AI.
// TypeScript thuần, không React, an toàn với hiệu năng và độ trễ.
import { chuanHoa } from "@/engine/truong";
import { phanTichCau } from "./hieu-cau";

export type LoaiIntent =
  | "general_chat"
  | "admissions_question"
  | "university_search"
  | "major_search"
  | "admissions_calculation"
  | "application_strategy"
  | "study_plan"
  | "comparison"
  | "clarification_needed";

export interface KetQuaDieuPhoi {
  intent: LoaiIntent;
  confidence: number;
  requires_retrieval: boolean;
  requires_calculation: boolean;
  requires_profile: boolean;
  lyDo: string;
}

// Từ khóa liên quan trực tiếp đến tuyển sinh & đại học / trường
const RE_TUYEN_SINH = /\b(diem chuan|diem san|xet tuyen|nguyen vong|hoc phi|to hop|khoi [abcd]|dgnl|thpt|dai hoc|cao dang|hoc ba|chi tieu|trung tuyen|dau dai hoc|do dai hoc|truong dai hoc|nganh hoc|hoc bong|ky tuc|ktx|bach khoa|bka|qsb|uit|hust|neu|ftu|fpt|hcmus|ussh|ueh|hcmute|spkt)\b/;

// Mẫu câu trò chuyện chung / triết lý / cảm xúc / cuộc sống / chào hỏi / kể chuyện
const MAU_CUOC_SONG = /\b(xin chao|chao ban|chao em|chao anh|chao chi|chao|hello|hi|hey|alo|good morning|cuoc song|cuoc song nay|cuoc doi|suy nghi gi|tam su|lo lang|lo cho tuong lai|tuong lai sau nay|ban la ai|ten gi|gioi thieu ban than|truyen cuoi|chuyen vui|buon qua|vui qua|suy nghi the nao|thay sao|thay the nao|dao nay the nao|cuoc song the nao|ban the nao|cam on|tam biet)\b|\bke\b.*\b(chuyen|cau chuyen)\b|\b(ke chuyen|chuyen vui|truyen cuoi|chuyen ngan)\b/;

// Mẫu so sánh và tư vấn lựa chọn phù hợp
const MAU_SO_SANH = /\b(so sanh|khac nhau gi|nen chon truong nao|truong nao hon|nganh nao hon|truong nao hop|nganh nao hop|hop voi minh|phu hop voi minh)\b/;

// Mẫu chiến lược nguyện vọng
const MAU_NGUYEN_VONG = /\b(danh sach nguyen vong|can bang|thu suc|vua suc|an toan|du phong|xep nguyen vong|dat nguyen vong|chien luoc)\b/;

// Mẫu tính toán điểm
const MAU_TINH_TOAN = /\b(tinh diem|diem uu tien|quy doi|thang 30|thang 40|thang 100|cong thuc tinh)\b/;

/**
 * Tầng 1: Phân loại ý định bằng bộ quy tắc xác định nhanh (0 latency).
 */
export function phanLoaiYdinh(cau: string): KetQuaDieuPhoi {
  const q = chuanHoa(cau);

  // 1. Câu hỏi đời sống, triết lý, cảm xúc, không nhắc tuyển sinh
  if (MAU_CUOC_SONG.test(q) && !RE_TUYEN_SINH.test(q)) {
    return {
      intent: "general_chat",
      confidence: 0.95,
      requires_retrieval: false,
      requires_calculation: false,
      requires_profile: false,
      lyDo: "Hội thoại đời sống/cảm xúc thông thường",
    };
  }

  // 2. So sánh trường / ngành
  if (MAU_SO_SANH.test(q)) {
    return {
      intent: "comparison",
      confidence: 0.9,
      requires_retrieval: true,
      requires_calculation: false,
      requires_profile: true,
      lyDo: "So sánh trường hoặc ngành",
    };
  }

  // 3. Chiến lược danh sách nguyện vọng
  if (MAU_NGUYEN_VONG.test(q)) {
    return {
      intent: "application_strategy",
      confidence: 0.9,
      requires_retrieval: true,
      requires_calculation: true,
      requires_profile: true,
      lyDo: "Tư vấn cấu trúc danh sách nguyện vọng",
    };
  }

  // 4. Phép tính điểm xác định
  if (MAU_TINH_TOAN.test(q)) {
    return {
      intent: "admissions_calculation",
      confidence: 0.92,
      requires_retrieval: false,
      requires_calculation: true,
      requires_profile: true,
      lyDo: "Tính toán điểm hoặc công thức",
    };
  }

  // 5. Kiểm tra phân tích câu từ hieu-cau
  const pt = phanTichCau(cau);
  if (pt.kieu === "so-sanh-truong") {
    return {
      intent: "comparison",
      confidence: 0.88,
      requires_retrieval: true,
      requires_calculation: false,
      requires_profile: true,
      lyDo: "So sánh 2 trường",
    };
  }

  if (pt.kieu === "la-truong-gi") {
    return {
      intent: "university_search",
      confidence: 0.9,
      requires_retrieval: true,
      requires_calculation: false,
      requires_profile: false,
      lyDo: "Tra cứu thông tin trường",
    };
  }

  // 6. Câu có yếu tố tuyển sinh rõ ràng
  const coTuyenSinh = RE_TUYEN_SINH.test(q) || pt.nhom !== null || pt.diem !== null || pt.cumNganh.length >= 3;
  if (coTuyenSinh) {
    return {
      intent: "admissions_question",
      confidence: 0.85,
      requires_retrieval: true,
      requires_calculation: pt.diem !== null,
      requires_profile: true,
      lyDo: "Câu hỏi thông tin tuyển sinh hoặc ngành học",
    };
  }

  // 7. Mặc định nếu không có bất kỳ tín hiệu tuyển sinh nào -> xem như hội thoại chung
  return {
    intent: "general_chat",
    confidence: 0.75,
    requires_retrieval: false,
    requires_calculation: false,
    requires_profile: false,
    lyDo: "Câu hỏi chung không chứa từ khóa tuyển sinh",
  };
}

// Định tuyến ý định bằng quy tắc, chạy trước mọi truy vấn dữ liệu và trước AI. TypeScript thuần, không React, không gọi mạng.
// Chỉ nhận các ý định không cần dữ liệu tuyển sinh (chào, cảm ơn, tạm biệt, trợ giúp, hỏi lượt AI, ngoài phạm vi).
// Câu có thêm nội dung thật ("chào, UIT là trường gì") không bị nuốt: lời chào được bóc ra rồi phần còn lại đi tiếp.
import { chuanHoa } from "@/engine/truong";
import { LUOT_AI_MOI_NGAY, type CheDoAI, type Luot } from "./che-do-ai";
import type { KetQuaTuDong } from "./lay-du-lieu";

export type YDinhQuyTac = "chao" | "cam-on" | "tam-biet" | "tro-giup" | "hoi-luot-ai" | "hoi-ai-loi" | "ngoai-pham-vi";

const CHAO = "(?:xin chao|chao ban|chao|hello|helo|hi|hey|alo|a lo|chao buoi sang|chao buoi chieu|chao buoi toi|good morning|good afternoon|good evening)";
const DUOI_LICH_SU = "(?:ban|bot|ad|admin|a|nhe|nha|ha|oi|nhe ban|ban oi|minh oi|may chu|tro ly|chatbot|ai)";
const RE_CHAO = new RegExp(`^(?:${CHAO}(?: ${DUOI_LICH_SU})*)(?: ${CHAO})*(?: ${DUOI_LICH_SU})*$`);
const RE_CAM_ON = /^(?:(?:cam on|thanks|thank you|thank|tks|thanks ban|cam on ban|cam on nhieu|cam on nhe|ok cam on|oke cam on|ok thanks|da cam on)(?: ban| nhieu| nha| nhe| a| ah| ak)*)$/;
const RE_TAM_BIET = /^(?:tam biet|bye|bye bye|goodbye|hen gap lai|thoi nhe|minh di day|em di day|chao nhe|chuc ngu ngon)(?: ban| nhe| nha| a)*$/;
const RE_TRO_GIUP = /^(?:help|tro giup|huong dan|ban lam duoc gi|ban giup duoc gi|ban la ai|ban co the lam gi|chuc nang|the nay dung sao|dung the nao|dung nhu the nao|cach dung|bat dau tu dau)(?: ban| a| vay| nhe)*$|\b(?:ban|bot|tro ly) (?:lam|giup) (?:duoc )?(?:gi|nhung gi)\b/;
const RE_LUOT_AI = /\b(?:con bao nhieu luot|con may luot|con luot|so luot|han muc|gioi han luot|quota|bao nhieu cau hoi|toi da bao nhieu cau|hoi duoc may cau|hoi duoc bao nhieu)\b/;
const RE_AI_LOI = /\b(?:ai bi loi|ai loi|ai khong chay|ai khong tra loi|khong ket noi duoc ai|mat ket noi ai|neu ai loi|ai hong|ai bi hong|chatbot loi|bot loi)\b/;
const RE_NGOAI = /\b(?:thoi tiet|gia vang|ty gia|bitcoin|crypto|chung khoan|bong da|world cup|nau an|cong thuc nau|phim hay|nhac hay|bai hat|xo so|horoscope|tu vi|cung hoang dao|lam tho|viet code|code python|giai bai tap|giai phuong trinh)\b/;
// Câu ngoài phạm vi chỉ bị chặn khi KHÔNG nhắc gì tới tuyển sinh.
const RE_TUYEN_SINH = /\b(?:truong|dai hoc|nganh|diem|thi|tuyen sinh|nguyen vong|hoc phi|to hop|xet tuyen|cao dang|hoc ba|khoi [abcd]|dgnl|thpt)\b/;

export interface KetQuaYDinh { y: YDinhQuyTac; con: string }

/** Bóc lời chào đứng đầu câu; trả phần còn lại đã chuẩn hóa ("chào, uit là trường gì" -> "uit la truong gi"). */
const boLoiChaoDau = (q: string): string => q.replace(new RegExp(`^(?:${CHAO}(?: ${DUOI_LICH_SU})*)(?: |$)`), "").trim();

/** Nhận ra ý định quy tắc. null = không phải ý định quy tắc, đi tiếp sang tra cứu dữ liệu. */
export function nhanYDinhQuyTac(cau: string): KetQuaYDinh | null {
  const q = chuanHoa(cau);
  if (!q || q.length > 80) return null;
  if (RE_CHAO.test(q)) return { y: "chao", con: "" };
  if (RE_CAM_ON.test(q)) return { y: "cam-on", con: "" };
  if (RE_TAM_BIET.test(q)) return { y: "tam-biet", con: "" };
  if (RE_AI_LOI.test(q)) return { y: "hoi-ai-loi", con: "" };
  if (RE_LUOT_AI.test(q)) return { y: "hoi-luot-ai", con: "" };
  if (RE_TRO_GIUP.test(q)) return { y: "tro-giup", con: "" };
  if (RE_NGOAI.test(q) && !RE_TUYEN_SINH.test(q)) return { y: "ngoai-pham-vi", con: "" };
  return null;
}

/** Nếu câu mở đầu bằng lời chào kèm nội dung thật, trả về phần nội dung để xử lý tiếp (không còn lời chào). */
export function bocLoiChao(cau: string): string | null {
  const q = chuanHoa(cau);
  if (RE_CHAO.test(q)) return null;
  const con = boLoiChaoDau(q);
  return con && con !== q ? con : null;
}

const GOI_Y_BAT_DAU = [
  { nhan: "Điểm chuẩn ngành quan tâm", cau: "Điểm chuẩn ngành Công nghệ thông tin các năm gần đây?" },
  { nhan: "Nên bắt đầu từ đâu", cau: "Nên bắt đầu tìm ngành từ đâu?" },
  { nhan: "Danh sách nguyện vọng", cau: "Danh sách nguyện vọng của mình có cân bằng không?" },
];

/** Câu trả lời cho ý định quy tắc. Không có số liệu tuyển sinh, không gọi AI, không trừ lượt. */
export interface BoiCanhAI { cheDo: CheDoAI; luot: Luot | null }

/** Câu trả lời cho "còn bao nhiêu lượt": nói số thật máy chủ báo gần nhất, chưa biết thì nói chưa gọi AI hôm nay. */
function noiLuotAI(b: BoiCanhAI | undefined): string {
  const cuoi = "Tra cứu số liệu và chào hỏi không dùng AI nên không bị tính.";
  if (b?.cheDo === "tietKiem") return `Bạn đang ở chế độ Tiết kiệm nên mình không gọi AI, không tốn lượt nào. Bật chế độ AI ở Cài đặt hoặc nút AI trong khung chat để dùng tối đa ${LUOT_AI_MOI_NGAY} lượt mỗi ngày. ${cuoi}`;
  if (b?.luot) return b.luot.con > 0
    ? `Hôm nay bạn còn ${b.luot.con}/${b.luot.toiDa} lượt AI, đặt lại lúc 0 giờ (giờ Việt Nam). ${cuoi}`
    : `Hôm nay bạn đã dùng hết ${b.luot.toiDa} lượt AI, 0 giờ sẽ có lượt mới. Mình vẫn tra được số liệu có sẵn. ${cuoi}`;
  return `Bạn đang bật chế độ AI và hôm nay chưa gọi AI lần nào, nên còn đủ ${LUOT_AI_MOI_NGAY} lượt (đặt lại lúc 0 giờ, giờ Việt Nam). ${cuoi}`;
}

export function traLoiQuyTac(k: YDinhQuyTac, boiCanh?: BoiCanhAI): KetQuaTuDong {
  switch (k) {
    case "chao":
      return { traLoi: "Chào bạn! Mình là trợ lý tuyển sinh. Bạn có thể hỏi điểm chuẩn, so sánh trường, hoặc nhờ mình xem danh sách nguyện vọng đã cân bằng chưa.", nguon: [], luaChon: GOI_Y_BAT_DAU };
    case "cam-on":
      return { traLoi: "Không có gì nhé! Cần xem thêm trường hay ngành nào, bạn cứ hỏi tiếp.", nguon: [] };
    case "tam-biet":
      return { traLoi: "Hẹn gặp lại bạn! Hồ sơ và nguyện vọng vẫn được giữ trên máy bạn, lúc nào cần cứ quay lại.", nguon: [] };
    case "tro-giup":
      return {
        traLoi: "Mình giúp được các việc sau, đều dựa trên số liệu thật có nguồn:\n• Tra điểm chuẩn, học phí của ngành và trường\n• So sánh hai trường hoặc hai ngành\n• Cho biết điểm của bạn đang ở mức Thử sức, Vừa sức, An toàn hay Dự phòng\n• Xem danh sách nguyện vọng đã cân bằng chưa, rồi thêm ngành vào danh sách khi bạn xác nhận\nMình không dự đoán đỗ hay trượt, và nếu thiếu số liệu mình sẽ nói là chưa có.",
        nguon: [], luaChon: GOI_Y_BAT_DAU,
      };
    case "hoi-luot-ai":
      return { traLoi: noiLuotAI(boiCanh), nguon: [] };
    case "hoi-ai-loi":
      return {
        traLoi: "Nếu dịch vụ AI không phản hồi, mình vẫn tra được điểm chuẩn, học phí, so sánh trường và xem nguyện vọng từ số liệu có sẵn. Chỉ các câu cần diễn giải dài mới phải chờ AI, khi đó mình sẽ báo rõ và cho bạn bấm Thử lại, câu bạn gõ không bị mất.",
        nguon: [],
      };
    case "ngoai-pham-vi":
      return {
        traLoi: "Chuyện này nằm ngoài phần mình giúp được. Mình chỉ hỗ trợ chọn ngành, chọn trường và nguyện vọng xét tuyển đại học.",
        nguon: [], luaChon: GOI_Y_BAT_DAU.slice(0, 2),
      };
  }
}

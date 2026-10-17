// Máy chủ nhỏ cho Tư vấn AI (Cloudflare Pages Function). Khóa API nằm ở biến bí mật của Cloudflare, không bao giờ xuống trình duyệt.
// Bật: Cloudflare Pages > Settings > Variables and Secrets > thêm OPENROUTER_API_KEY (hoặc ANTHROPIC_API_KEY / OPENAI_API_KEY).
// Hạn mức: mỗi hồ sơ ẩn danh (hoSoId, UUID do client sinh) tối đa AI_QUOTA_DAILY (mặc định 50) lượt AI mỗi ngày giờ Việt Nam, đếm bằng D1 (binding DB, migration 0008).
// Chỉ trừ lượt khi AI trả lời thành công; mã yêu cầu (requestId) giúp gửi lại không bị trừ hai lần. Thiếu DB thì không gọi AI (fail-closed).
// Bậc thang: cache KV > Clef > RAG > LLM (xem _thu-vien/ai/bac-thang.ts). Chưa có bậc server nào dùng được thì trả 503 và app tự dùng chế độ trả lời từ số liệu có sẵn.
import { GIOI_HAN, canTimWeb, choPhepTanSuat, kiemTraYeuCau } from "../../src/engine/tu-van";
import { traLoiBacThang, type EnvBacThang } from "../_thu-vien/ai/bac-thang";
import { coKhoaLLM } from "../_thu-vien/ai/sinh-van-ban";
import { chotLuot, docHanMuc, giuLuot, laUuid, luotConLai, traLaiLuot, type GiuCho, type KhoD1HanMuc } from "../_thu-vien/han-muc-ai";

// Trần toàn hệ thống theo ngày (mọi hồ sơ cộng lại), để việc đổi mã hồ sơ không làm vượt chi phí.
const KHOA_TONG_HE_THONG = "he-thong";
export const TONG_NGAY_MAC_DINH = 500;
// Trần riêng cho lượt có tìm web (đắt hơn một lượt thường): hết trần thì vẫn trả lời, chỉ không tìm web.
const KHOA_WEB_HE_THONG = "he-thong-web";
export const WEB_NGAY_MAC_DINH = 150;

export { goiMoHinh } from "../_thu-vien/ai/sinh-van-ban";
export interface Env extends EnvBacThang { DB?: KhoD1HanMuc; AI_QUOTA_DAILY?: string; AI_TONG_NGAY?: string; AI_WEB_NGAY?: string }
interface Ctx { request: Request; env: Env }

const json = (v: unknown, status = 200) =>
  new Response(JSON.stringify(v), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });

export async function xuLy(request: Request, env: Env, f: typeof fetch = fetch): Promise<Response> {
  if (request.method !== "POST") return json({ loi: "Chỉ nhận POST" }, 405);
  if (!coKhoaLLM(env) && !env.AI) return json({ loi: "chua-cau-hinh" }, 503);
  const khai = Number(request.headers.get("content-length"));
  if (Number.isFinite(khai) && khai > GIOI_HAN.kichThuocBody) return json({ loi: "Yêu cầu quá lớn" }, 413);
  // Request.text() đọc toàn bộ body trước khi kiểm tra kích thước; đọc theo luồng để giới hạn bộ nhớ.
  const reader = request.body?.getReader();
  if (!reader) return json({ loi: "Yêu cầu không hợp lệ" }, 400);
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > GIOI_HAN.kichThuocBody) {
        await reader.cancel();
        return json({ loi: "Yêu cầu quá lớn" }, 413);
      }
      chunks.push(value);
    }
  } catch { return json({ loi: "Không đọc được yêu cầu" }, 400); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  const chu = new TextDecoder().decode(bytes);
  let goc: unknown;
  try { goc = JSON.parse(chu); } catch { return json({ loi: "Yêu cầu không hợp lệ" }, 400); }
  const kt = kiemTraYeuCau(goc);
  if (!kt.ok) return json({ loi: kt.loi }, 400);
  const o = goc as Record<string, unknown>;
  if (!laUuid(o.hoSoId) || !laUuid(o.requestId)) return json({ loi: "ho-so-sai" }, 400);
  const hoSo = o.hoSoId.toLowerCase(), yeuCau = o.requestId.toLowerCase();
  // Không gọi mô hình nếu thiếu rate limit hoặc KV gặp lỗi: endpoint công khai có thể phát sinh chi phí.
  if (!env.RATE_KV) return json({ loi: "Dịch vụ tư vấn chưa được cấu hình giới hạn truy cập" }, 503);
  const ip = request.headers.get("cf-connecting-ip") ?? "khong-ro";
  try {
    if (!await choPhepTanSuat(env.RATE_KV, ip, Date.now())) return json({ loi: "Bạn hỏi hơi nhanh, đợi một phút rồi thử lại nhé" }, 429);
  } catch { return json({ loi: "Dịch vụ tư vấn đang tạm thời không sẵn sàng" }, 503); }
  // Hạn mức theo ngày: giữ chỗ nguyên tử trước khi gọi AI, chốt khi thành công, trả lại khi lỗi.
  if (!env.DB) return json({ loi: "chua-cau-hinh-han-muc" }, 503);
  const toiDa = docHanMuc(env.AI_QUOTA_DAILY);
  let giu;
  try { giu = await giuLuot(env.DB, hoSo, yeuCau, toiDa); } catch { return json({ loi: "Dịch vụ tư vấn đang tạm thời không sẵn sàng" }, 503); }
  if (!giu.ok) return giu.ly === "trung" ? json({ loi: "da-xu-ly" }, 409) : json({ loi: "het-luot-ngay", luot: { con: 0, toiDa } }, 429);
  // Trần toàn hệ thống: giữ thêm một chỗ ở khóa chung. Hết thì trả lại lượt cá nhân vừa giữ.
  const toiDaTong = Math.max(1, Math.floor(Number(env.AI_TONG_NGAY) || TONG_NGAY_MAC_DINH));
  let giuTong: Awaited<ReturnType<typeof giuLuot>>;
  try { giuTong = await giuLuot(env.DB, KHOA_TONG_HE_THONG, `${yeuCau}:tong`, toiDaTong); } catch {
    await traLaiLuot(env.DB, giu.giu).catch(() => {});
    return json({ loi: "Dịch vụ tư vấn đang tạm thời không sẵn sàng" }, 503);
  }
  if (!giuTong.ok) {
    await traLaiLuot(env.DB, giu.giu).catch(() => {});
    return giuTong.ly === "trung" ? json({ loi: "da-xu-ly" }, 409) : json({ loi: "het-luot-he-thong" }, 429);
  }
  // Câu định tính cần thông tin cập nhật (học bổng, ký túc xá, tin tuyển sinh...): giữ thêm một chỗ ở trần web. Hết chỗ thì bỏ web, không báo lỗi.
  let giuWeb: GiuCho | null = null;
  if (canTimWeb(kt.v.cauHoi) && !kt.v.bangSoSanh && env.OPENROUTER_API_KEY) {
    const toiDaWeb = Math.max(0, Math.floor(Number(env.AI_WEB_NGAY) || WEB_NGAY_MAC_DINH));
    try { const g = await giuLuot(env.DB, KHOA_WEB_HE_THONG, `${yeuCau}:web`, toiDaWeb); if (g.ok) giuWeb = g.giu; } catch { /* không có web, vẫn trả lời thường */ }
  }
  const traWeb = () => (giuWeb ? traLaiLuot(env.DB!, giuWeb).catch(() => {}) : Promise.resolve());
  const tra = () => Promise.all([traLaiLuot(env.DB!, giu.giu), traLaiLuot(env.DB!, giuTong.giu as GiuCho), traWeb()]).then(() => undefined, () => undefined);
  try {
    const r = await traLoiBacThang(env, kt.v, f, { web: !!giuWeb });
    if (!r.ok) { await tra(); return json({ loi: r.loi, ...(r.goiY ? { goiY: r.goiY } : {}) }, r.loi === "chua-cau-hinh" ? 503 : 422); }
    // Trả từ cache không tốn nhà cung cấp nên không tính lượt.
    if (r.kq.tang === "cache") await tra();
    else {
      // Chỗ web chỉ tính khi câu trả lời thật sự dựa trên web (có nguồn); không thì trả lại.
      const chotWeb = giuWeb && r.kq.nguonWeb?.length ? chotLuot(env.DB, giuWeb) : traWeb();
      await Promise.all([chotLuot(env.DB, giu.giu), chotLuot(env.DB, giuTong.giu as GiuCho), chotWeb]).catch(() => {});
    }
    const luot = await luotConLai(env.DB, hoSo, toiDa).catch(() => undefined);
    return json(luot ? { ...r.kq, luot } : r.kq);
  } catch (e) {
    await tra();
    // Mã ngắn (ví dụ "openrouter 401", "rong") để chẩn đoán; không chứa khóa hay dữ liệu người dùng.
    const ma = (e instanceof Error ? `${e.name}: ${e.message}` : "loi-la").replace(/[^\w .:/-]/g, "").slice(0, 80);
    console.error(JSON.stringify({ tang: "tu-van", loi: "502", ma }));
    return json({ loi: "Dịch vụ tư vấn đang bận, bạn thử lại sau ít phút", ma }, 502);
  }
}

export const onRequest = ({ request, env }: Ctx) => xuLy(request, env);

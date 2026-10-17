// Máy chủ nhỏ cho Tư vấn AI (Cloudflare Pages Function). Khóa API nằm ở biến bí mật của Cloudflare, không bao giờ xuống trình duyệt.
// Bật: Cloudflare Pages > Settings > Variables and Secrets > thêm OPENROUTER_API_KEY (hoặc ANTHROPIC_API_KEY / OPENAI_API_KEY).
// Hạn mức: mỗi hồ sơ ẩn danh (hoSoId, UUID do client sinh) tối đa AI_QUOTA_DAILY (mặc định 50) lượt AI mỗi ngày giờ Việt Nam, đếm bằng D1 (binding DB, migration 0008).
// Chỉ trừ lượt khi AI trả lời thành công; mã yêu cầu (requestId) giúp gửi lại không bị trừ hai lần. Thiếu DB thì không gọi AI (fail-closed).
// Bậc thang: cache KV > Clef > RAG > LLM (xem _thu-vien/ai/bac-thang.ts). Chưa có bậc server nào dùng được thì trả 503 và app tự dùng chế độ trả lời từ số liệu có sẵn.
import { GIOI_HAN, canTimWeb, choPhepTanSuat, kiemTraYeuCau } from "../../src/engine/tu-van";
import { traLoiBacThang, type EnvBacThang } from "../_thu-vien/ai/bac-thang";
import { coKhoaLLM } from "../_thu-vien/ai/sinh-van-ban";
import { chotLuot, docHanMuc, giuLuot, laUuid, luotConLai, traLaiLuot, type GiuCho, type KhoD1HanMuc } from "../_thu-vien/han-muc-ai";

import { xacThucTurnstile } from "../_thu-vien/turnstile";

// Trần toàn hệ thống theo ngày (mọi hồ sơ cộng lại), để việc đổi mã hồ sơ không làm vượt chi phí.
const KHOA_TONG_HE_THONG = "he-thong";
export const TONG_NGAY_MAC_DINH = 500;
// Trần riêng cho lượt có tìm web (đắt hơn một lượt thường): hết trần thì vẫn trả lời, chỉ không tìm web.
const KHOA_WEB_HE_THONG = "he-thong-web";
export const WEB_NGAY_MAC_DINH = 150;

// Trần theo IP mỗi ngày: hồ sơ (hoSoId) do trình duyệt tự sinh nên đổi được; IP là khóa khó đổi hơn. Đặt trước trần toàn hệ thống
// để một nguồn không dùng hết 500 lượt chung bằng UUID ngẫu nhiên. Thiếu IP (chỉ gặp khi chạy cục bộ) thì mọi yêu cầu dùng chung một khóa.
export const IP_NGAY_MAC_DINH = 40;
const KHOA_IP_KHONG_RO = "khong-ro";

export { goiMoHinh } from "../_thu-vien/ai/sinh-van-ban";
<<<<<<< HEAD
export interface Env extends EnvBacThang { DB?: KhoD1HanMuc; AI_QUOTA_DAILY?: string; AI_TONG_NGAY?: string; AI_WEB_NGAY?: string; TURNSTILE_SECRET_KEY?: string }
=======
export interface Env extends EnvBacThang { DB?: KhoD1HanMuc; AI_QUOTA_DAILY?: string; AI_TONG_NGAY?: string; AI_WEB_NGAY?: string; AI_IP_NGAY?: string }
>>>>>>> origin/main
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
<<<<<<< HEAD

  // Xác thực bot Turnstile (Fail-open: không ảnh hưởng người dùng thật nếu chưa cấu hình key hoặc Cloudflare trục trặc)
  const turnstileToken = request.headers.get("cf-turnstile-response") || (typeof o.turnstileToken === "string" ? o.turnstileToken : undefined);
  const ts = await xacThucTurnstile(env.TURNSTILE_SECRET_KEY, turnstileToken, ip, f);
  if (!ts.hopLe) return json({ loi: "Xác minh bot không thành công, vui lòng thử lại" }, 403);
  // Hạn mức theo ngày: giữ chỗ nguyên tử trước khi gọi AI, chốt khi thành công, trả lại khi lỗi.
=======
  // Hạn mức theo ngày: giữ chỗ nguyên tử trước khi gọi AI, chốt khi thành công, trả lại khi lỗi hạ tầng (không trả khi 422/400/429).
>>>>>>> origin/main
  if (!env.DB) return json({ loi: "chua-cau-hinh-han-muc" }, 503);
  const db = env.DB;
  const toiDa = docHanMuc(env.AI_QUOTA_DAILY);
  const toiDaIp = Math.max(1, Math.floor(Number(env.AI_IP_NGAY) || IP_NGAY_MAC_DINH));
  const khoaIp = `ip:${request.headers.get("cf-connecting-ip") ?? KHOA_IP_KHONG_RO}`;
  const traCacGiu: GiuCho[] = [];
  const traHet = () => Promise.all(traCacGiu.map((g) => traLaiLuot(db, g).catch(() => {}))).then(() => undefined);
  const giuMot = async (khoa: string, yc: string, tran: number) => {
    const g = await giuLuot(db, khoa, yc, tran);
    if (g.ok) traCacGiu.push(g.giu);
    return g;
  };
  try {
    const gIp = await giuMot(khoaIp, `${yeuCau}:ip`, toiDaIp);
    if (!gIp.ok) return gIp.ly === "trung" ? json({ loi: "da-xu-ly" }, 409) : json({ loi: "het-luot-ip" }, 429);
  } catch { await traHet(); return json({ loi: "Dịch vụ tư vấn đang tạm thời không sẵn sàng" }, 503); }
  let giu;
  try { giu = await giuMot(hoSo, yeuCau, toiDa); } catch { await traHet(); return json({ loi: "Dịch vụ tư vấn đang tạm thời không sẵn sàng" }, 503); }
  if (!giu.ok) { await traHet(); return giu.ly === "trung" ? json({ loi: "da-xu-ly" }, 409) : json({ loi: "het-luot-ngay", luot: { con: 0, toiDa } }, 429); }
  // Trần toàn hệ thống: giữ thêm một chỗ ở khóa chung. Hết thì trả lại các lượt vừa giữ.
  const toiDaTong = Math.max(1, Math.floor(Number(env.AI_TONG_NGAY) || TONG_NGAY_MAC_DINH));
  let giuTong: Awaited<ReturnType<typeof giuLuot>>;
  try { giuTong = await giuMot(KHOA_TONG_HE_THONG, `${yeuCau}:tong`, toiDaTong); } catch {
    await traHet();
    return json({ loi: "Dịch vụ tư vấn đang tạm thời không sẵn sàng" }, 503);
  }
  if (!giuTong.ok) {
    await traHet();
    return giuTong.ly === "trung" ? json({ loi: "da-xu-ly" }, 409) : json({ loi: "het-luot-he-thong" }, 429);
  }
  // Câu định tính cần thông tin cập nhật (học bổng, ký túc xá, tin tuyển sinh...): giữ thêm một chỗ ở trần web. Hết chỗ thì bỏ web, không báo lỗi.
  let giuWeb: GiuCho | null = null;
  if (canTimWeb(kt.v.cauHoi) && !kt.v.bangSoSanh && env.OPENROUTER_API_KEY) {
    const toiDaWeb = Math.max(0, Math.floor(Number(env.AI_WEB_NGAY) || WEB_NGAY_MAC_DINH));
    try { const g = await giuLuot(db, KHOA_WEB_HE_THONG, `${yeuCau}:web`, toiDaWeb); if (g.ok) giuWeb = g.giu; } catch { /* không có web, vẫn trả lời thường */ }
  }
  const traWeb = () => (giuWeb ? traLaiLuot(db, giuWeb).catch(() => {}) : Promise.resolve());
  // Hoàn lượt (cá nhân, IP, toàn hệ thống, web) chỉ khi lỗi hạ tầng hoặc không tốn nhà cung cấp. Lỗi do nội dung (422) thì KHÔNG hoàn:
  // mô hình đã được gọi, nên lượt vẫn tính, và hoSoId do trình duyệt sinh không thể dùng để lách bằng cách gây lỗi lặp lại.
  const tra = () => Promise.all([traHet(), traWeb()]).then(() => undefined, () => undefined);
  const chotTatCa = () => Promise.all([...traCacGiu.map((g) => chotLuot(db, g)), traWeb()]).catch(() => {});
  try {
    const r = await traLoiBacThang(env, kt.v, f, { web: !!giuWeb });
    if (!r.ok) {
      if (r.loi === "chua-cau-hinh") { await tra(); return json({ loi: r.loi, ...(r.goiY ? { goiY: r.goiY } : {}) }, 503); }
      await chotTatCa();
      return json({ loi: r.loi, ...(r.goiY ? { goiY: r.goiY } : {}) }, 422);
    }
    // Trả từ cache không tốn nhà cung cấp nên không tính lượt.
    if (r.kq.tang === "cache") await tra();
    else {
      // Chỗ web chỉ tính khi câu trả lời thật sự dựa trên web (có nguồn); không thì trả lại.
      const chotWeb = giuWeb && r.kq.nguonWeb?.length ? chotLuot(db, giuWeb) : traWeb();
      await Promise.all([...traCacGiu.map((g) => chotLuot(db, g)), chotWeb]).catch(() => {});
    }
    const luot = await luotConLai(db, hoSo, toiDa).catch(() => undefined);
    const traVe = luot ? { ...r.kq, luot } : r.kq;

    if (kt.v.stream === true || request.headers.get("accept")?.includes("text/event-stream")) {
      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      const encoder = new TextEncoder();

      (async () => {
        try {
          const doan = r.kq.traLoi.match(/.{1,16}/g) || [r.kq.traLoi];
          for (const token of doan) {
            await writer.write(encoder.encode(`data: ${JSON.stringify({ token })}\n\n`));
          }
          await writer.write(encoder.encode(`data: ${JSON.stringify({ xong: true, ...traVe })}\n\n`));
          await writer.close();
        } catch {
          await writer.abort().catch(() => {});
        }
      })();

      return new Response(readable, {
        headers: {
          "content-type": "text/event-stream; charset=utf-8",
          "cache-control": "no-cache",
          "connection": "keep-alive",
        },
      });
    }

    return json(traVe);
  } catch (e) {
    await tra();
    // Mã chẩn đoán (ví dụ "openrouter 401") chỉ ghi log máy chủ, không trả cho trình duyệt.
    const ma = (e instanceof Error ? `${e.name}: ${e.message}` : "loi-la").replace(/[^\w .:/-]/g, "").slice(0, 80);
    console.error(JSON.stringify({ tang: "tu-van", loi: "502", ma }));
    return json({ loi: "Dịch vụ tư vấn đang bận, bạn thử lại sau ít phút" }, 502);
  }
}

export const onRequest = ({ request, env }: Ctx) => xuLy(request, env);

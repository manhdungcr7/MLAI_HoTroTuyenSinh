// Xác thực Cloudflare Turnstile bot protection cho các endpoint công khai (Tư vấn AI, Đăng ký sớm).
// Nguyên tắc an toàn: Không ảnh hưởng trải nghiệm người dùng thật.
// - Chế độ: Managed / Invisible (không hiện captcha phiền toái, Cloudflare tự xác minh qua tín hiệu trình duyệt).
// - Graceful Fallback (Fail-Open): Nếu chưa cấu hình secret key hoặc Cloudflare siteverify bị lỗi mạng/timeout,
//   hệ thống tự động cho qua để học sinh không bao giờ bị chặn nhầm.

export interface KetQuaTurnstile {
  hopLe: boolean;
  lyDo?: string;
  hostname?: string;
}

const URL_SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const TIMEOUT_MS = 3000;

export async function xacThucTurnstile(
  secretKey: string | undefined,
  token: string | undefined | null,
  ip?: string | null,
  f: typeof fetch = fetch
): Promise<KetQuaTurnstile> {
  // 1. Chưa cấu hình biến môi trường TURNSTILE_SECRET_KEY -> Bỏ qua an toàn (Local dev / Demo / CI)
  if (!secretKey || secretKey.trim() === "") {
    return { hopLe: true, lyDo: "chua-cau-hinh-secret" };
  }

  // 2. Có cấu hình secret nhưng không có token gửi lên -> Nghi vấn bot tự động / cào dữ liệu
  if (!token || typeof token !== "string" || token.trim().length === 0 || token.length > 2048) {
    return { hopLe: false, lyDo: "thieu-token" };
  }

  // 3. Gửi verify ngầm tới Cloudflare Turnstile API với timeout 3s
  const formData = new FormData();
  formData.append("secret", secretKey.trim());
  formData.append("response", token.trim());
  if (ip && ip !== "khong-ro") {
    formData.append("remoteip", ip);
  }

  try {
    const res = await f(URL_SITEVERIFY, {
      method: "POST",
      body: formData,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!res.ok) {
      // API của Cloudflare gặp sự cố HTTP -> Fail-Open để bảo vệ người dùng thật
      console.warn("Turnstile API tra ma HTTP khong phai 200:", res.status);
      return { hopLe: true, lyDo: "loi-mang-cloudflare" };
    }

    const data = (await res.json()) as { success?: boolean; hostname?: string; "error-codes"?: string[] };
    if (data.success) {
      return { hopLe: true, hostname: data.hostname };
    }

    return { hopLe: false, lyDo: (data["error-codes"] ?? []).join(", ") || "token-khong-hop-le" };
  } catch (e) {
    // Timeout hoặc đứt kết nối tới Cloudflare -> Fail-Open cho người dùng thật
    console.warn("Turnstile siteverify gap loi timeout/network:", e instanceof Error ? e.message : e);
    return { hopLe: true, lyDo: "fail-open-timeout" };
  }
}

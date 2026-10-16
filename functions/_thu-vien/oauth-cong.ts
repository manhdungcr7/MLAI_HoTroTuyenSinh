// Phần dùng chung của các endpoint OAuth: giới hạn tần suất (fail-closed), đọc form có giới hạn, metadata khám phá (RFC 8414, RFC 9728).
import { TAT_CA_PHAM_VI } from "./oauth";
import type { EnvKetNoi } from "./ket-noi";

export type EnvOAuth = EnvKetNoi;
const GIOI_HAN_FORM_BYTE = 8_192;

export const ocNoStore = { "cache-control": "no-store", pragma: "no-cache" };

export function jsonOAuth(v: unknown, status = 200, them: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(v), { status, headers: { "content-type": "application/json; charset=utf-8", ...ocNoStore, ...them } });
}

export const loiOAuth = (error: string, error_description: string, status = 400) => jsonOAuth({ error, error_description }, status);

/** Giới hạn theo IP trong một cửa sổ. KV thiếu hoặc lỗi thì từ chối (fail-closed), không cho phép dò mã không giới hạn. */
export async function giuTanSuat(env: EnvOAuth, khoa: string, toiDa: number, giay: number): Promise<boolean> {
  if (!env.RATE_KV) return false;
  try {
    const dem = Number(await env.RATE_KV.get(khoa)) || 0;
    if (dem >= toiDa) return false;
    await env.RATE_KV.put(khoa, String(dem + 1), { expirationTtl: Math.max(60, giay) });
    return true;
  } catch { return false; }
}

export const ipYeuCau = (request: Request) => request.headers.get("cf-connecting-ip") ?? "khong-ro";

/** Đọc form urlencoded, giới hạn byte. Trả về object chuỗi; trường lặp lại thì lấy giá trị đầu. */
export async function docForm(request: Request): Promise<Record<string, string> | null> {
  const ct = request.headers.get("content-type") ?? "";
  if (!ct.includes("application/x-www-form-urlencoded")) return null;
  const khai = Number(request.headers.get("content-length"));
  if (Number.isFinite(khai) && khai > GIOI_HAN_FORM_BYTE) return null;
  const chu = await request.text();
  if (new TextEncoder().encode(chu).byteLength > GIOI_HAN_FORM_BYTE) return null;
  const v: Record<string, string> = {};
  for (const [k, x] of new URLSearchParams(chu)) if (!(k in v)) v[k] = x;
  return v;
}

/** Metadata máy chủ ủy quyền (RFC 8414). Issuer là gốc của trang, không có dấu / cuối. */
export function metadataMayChu(origin: string) {
  return {
    issuer: origin,
    authorization_endpoint: `${origin}/oauth/authorize`,
    token_endpoint: `${origin}/oauth/token`,
    registration_endpoint: `${origin}/oauth/register`,
    revocation_endpoint: `${origin}/oauth/revoke`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none"],
    revocation_endpoint_auth_methods_supported: ["none"],
    scopes_supported: TAT_CA_PHAM_VI,
  };
}

/** Metadata tài nguyên được bảo vệ (RFC 9728): chỉ ra máy chủ ủy quyền và tài nguyên /mcp. */
export function metadataTaiNguyen(origin: string) {
  return {
    resource: `${origin}/mcp`,
    authorization_servers: [origin],
    bearer_methods_supported: ["header"],
    scopes_supported: TAT_CA_PHAM_VI,
    resource_name: "Nguyện Vọng AI",
  };
}

// Metadata tài nguyên được bảo vệ (RFC 9728), gốc. Bản cho /mcp nằm ở oauth-protected-resource/[[path]].ts.
import { jsonOAuth, metadataTaiNguyen } from "../_thu-vien/oauth-cong";

export const onRequestGet = ({ request }: { request: Request }) =>
  jsonOAuth(metadataTaiNguyen(new URL(request.url).origin), 200, { "access-control-allow-origin": "*", "cache-control": "public, max-age=300" });

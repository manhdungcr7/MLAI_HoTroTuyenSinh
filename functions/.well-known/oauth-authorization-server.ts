// Metadata máy chủ ủy quyền (RFC 8414): client đọc để biết endpoint đồng ý, đổi token, đăng ký, thu hồi.
import { jsonOAuth, metadataMayChu } from "../_thu-vien/oauth-cong";

export const onRequestGet = ({ request }: { request: Request }) =>
  jsonOAuth(metadataMayChu(new URL(request.url).origin), 200, { "access-control-allow-origin": "*", "cache-control": "public, max-age=300" });

// Metadata tài nguyên cho đường dẫn con (ví dụ /.well-known/oauth-protected-resource/mcp). Nội dung như bản gốc.
import { jsonOAuth, metadataTaiNguyen } from "../../_thu-vien/oauth-cong";

export const onRequestGet = ({ request }: { request: Request }) =>
  jsonOAuth(metadataTaiNguyen(new URL(request.url).origin), 200, { "access-control-allow-origin": "*", "cache-control": "public, max-age=300" });

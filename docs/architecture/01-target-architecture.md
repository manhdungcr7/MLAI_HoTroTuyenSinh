# Kiến trúc đích

Trạng thái: đã triển khai trong code, chưa đưa lên production cho đến khi migration 0011 được áp dụng (xem [../operations/rollback.md](../operations/rollback.md)).

## Nguyên tắc

- Một nguồn logic. Các công cụ MCP và GPT Actions gọi cùng một hàm trong `functions/_thu-vien/ket-noi-cong-cu.ts`. Giao thức (JSON-RPC, REST, OAuth) chỉ là lớp vỏ.
- Không thêm hạ tầng mới. Vẫn là Cloudflare Pages Functions, D1 và KV. Không Durable Object, không Redis, không Postgres.
- Không thêm framework khi chưa cần. Chưa dùng Hono hay Zod: kiểm tra đầu vào hiện làm bằng hàm thủ công có giới hạn độ dài và kiểu.

## Các lớp

```
KHÁCH                         LỚP VỎ (giao thức)                    LÕI DÙNG CHUNG                 DỮ LIỆU
Website (React)  ───────────► /api/ket-noi/* (quản lý kết nối)  ─┐
                                                                  │
Claude (MCP connector) ─────► /mcp (Bearer, OAuth 2.1) ──────────┼─► xuLyThanMcp ─► CONG_CU ─┬─► D1: ket_noi_ai
ChatGPT (MCP / GPT Actions) ─► /mcp/{mã} (cách cũ)  ─────────────┤   (giao thức JSON-RPC)    │   ket_noi_de_xuat
                              /api/gpt/{mã}/* (GPT Actions) ────┘                           │   oauth_client
                                                                                           │   oauth_ma_xac_nhan
ChatGPT / Claude đăng ký ───► /oauth/register, /oauth/authorize,                            │   oauth_token
                              /oauth/token, /oauth/revoke ─────────► _thu-vien/oauth.ts ────┘
                                                                  ──► xacThucMaBam (một chỗ kiểm tra kết nối)
Tư vấn AI (web) ────────────► /api/tu-van ───────────► bậc thang: cache > luật > RAG > LLM
Kiểm tra sức khỏe ──────────► /api/v1/health (không đụng D1), /api/v1/ready (D1 + KV)
```

## Thành phần đã có và đã thay đổi trong đợt này

| Thành phần | Trạng thái | Ghi chú |
|---|---|---|
| `functions/mcp/[ma].ts` | Sửa | Tách phần giao thức (`xuLyThanMcp`) để /mcp/{mã} và /mcp dùng chung |
| `functions/mcp/index.ts` | Mới | `/mcp` với Bearer token, trả 401 kèm `WWW-Authenticate` khi thiếu token |
| `functions/oauth/*` | Mới | Đăng ký client, trang đồng ý, đổi token, thu hồi |
| `functions/.well-known/*` | Mới | Metadata RFC 8414 (máy chủ ủy quyền) và RFC 9728 (tài nguyên /mcp) |
| `functions/api/v1/health.ts`, `ready.ts` | Mới | Health không lộ cấu hình; ready kiểm tra D1 và KV |
| `functions/_thu-vien/ket-noi.ts` | Sửa | Tách `xacThucMaBam` để token dùng chung cách kiểm tra kết nối; xóa kết nối cũng xóa token |
| `functions/_thu-vien/ket-noi-cong-cu.ts` | Sửa | Thêm `PHAM_VI_CONG_CU`: mỗi công cụ cần một phạm vi OAuth. `icsUrl` chỉ có khi có mã đường dẫn |
| `migrations/0011_oauth_mcp.sql` | Mới | Bốn thay đổi bảng, chỉ thêm, không đổi bảng cũ |

## Chưa có (so với prompt gốc)

- Công cụ theo tên trong spec (`search_universities`, `get_university_profile`, `estimate_admission_chance`, `rank_preferences`, `calculate_admission_score`): hiện chỉ có 6 công cụ theo kết nối cá nhân. Các công cụ tra cứu công khai là việc tiếp theo.
- Prefix `/api/v1/` cho toàn bộ API: mới có health và ready. Các route còn lại giữ tên cũ để không làm hỏng liên kết đã phát hành.
- Cảnh báo ngân sách 70% và 90%: chưa có.
- Staging: repo chỉ có một môi trường production, deploy khi push `main`.

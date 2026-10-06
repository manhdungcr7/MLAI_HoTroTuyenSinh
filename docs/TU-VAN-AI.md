# Tư vấn AI có căn cứ

Màn **Tư vấn cùng AI** (`/tu-van`) hoạt động ở hai chế độ, em không cần làm gì để chuyển:

1. **Trả lời tự động** (mặc định, không cần máy chủ AI): app tự tra trong dữ liệu có nguồn. Hỏi tên ngành/trường thì liệt kê điểm chuẩn, nhãn so với điểm của em và nguồn (trang đề án); hỏi về danh sách nguyện vọng thì đếm Thử sức/Vừa sức/An toàn/Dự phòng và nhận xét; hỏi chung thì cho biết điểm đủ cho bao nhiêu ngành. Mã: `src/features/tu-van/lay-du-lieu.ts`.
2. **Trả lời bằng AI** (khi bật khóa API): trình duyệt gửi câu hỏi + tóm tắt hồ sơ (không có tên) + tối đa 12 ngành liên quan (có điểm chuẩn và nguồn) tới `/api/tu-van`. Máy chủ gọi mô hình với lời nhắc cấm tự nêu số liệu ngoài phần dữ liệu gửi kèm, rồi chỉ giữ lại các mã nguồn có thật. Mã: `functions/api/tu-van.ts`, `src/engine/tu-van.ts`.

## Bật chế độ AI
Cloudflare Pages > dự án `nguyenvongai` > Settings > Variables and Secrets (môi trường Production), thêm **một** trong hai:
- `ANTHROPIC_API_KEY` (mặc định dùng `claude-haiku-4-5-20251001`)
- `OPENAI_API_KEY` (mặc định dùng `gpt-4o-mini`)

Tùy chọn: `AI_MODEL` để đổi mô hình. Sau khi thêm, deploy lại (hoặc Retry deployment). Chưa có khóa thì `/api/tu-van` trả 503 và app dùng chế độ tự động.

Chạy thử trên máy: `npm run build && npx wrangler pages dev dist --port 8788` (đặt khóa trong file `.dev.vars`, đã được ignore).

## Quyền riêng tư và chi phí
- Em thấy đúng dữ liệu sẽ gửi (nút "Xem dữ liệu sẽ gửi đi") và có thể tắt chia sẻ hồ sơ. Không gửi tên, không gửi thông tin liên hệ.
- Khóa API chỉ nằm ở biến bí mật của Cloudflare, không xuống trình duyệt (có test kiểm tra).
- Endpoint công khai nên có thể bị gọi nhiều: giới hạn đầu vào (câu hỏi ≤ 1000 ký tự, body ≤ 40 KB, ≤ 12 ngành, `max_tokens` 700). Nếu cần chặn lạm dụng, thêm Cloudflare Rate Limiting cho đường dẫn `/api/tu-van`.

## Vì sao làm theo cách này
Mô hình chung (như ChatGPT) hay nhớ sai điểm chuẩn và không chỉ được nguồn. Ở đây mô hình chỉ là lớp diễn đạt: số liệu do app tìm và tính, kèm nguồn; câu trả lời được lọc để mọi mã nguồn đều có thật.

# Tư vấn AI có căn cứ

Màn **Tư vấn cùng AI** (`/tu-van`) hoạt động ở hai chế độ, em không cần làm gì để chuyển:

1. **Trả lời tự động** (mặc định, không cần máy chủ AI): app tự tra trong dữ liệu có nguồn. Hỏi tên ngành/trường thì liệt kê điểm chuẩn, nhãn so với điểm của em và nguồn (trang đề án); hỏi về danh sách nguyện vọng thì đếm Thử sức/Vừa sức/An toàn/Dự phòng và nhận xét; hỏi chung thì cho biết điểm đủ cho bao nhiêu ngành. Mã: `src/features/tu-van/lay-du-lieu.ts`.
2. **Trả lời bằng AI** (khi bật khóa API): trình duyệt gửi câu hỏi + tóm tắt hồ sơ (không có tên) + tối đa 12 ngành liên quan (có điểm chuẩn và nguồn) tới `/api/tu-van`. Máy chủ gọi mô hình với lời nhắc cấm tự nêu số liệu ngoài phần dữ liệu gửi kèm, rồi chỉ giữ lại các mã nguồn có thật. Mã: `functions/api/tu-van.ts`, `src/engine/tu-van.ts`.

## Bậc thang trên máy chủ
`functions/_thu-vien/ai/bac-thang.ts`, rẻ đến đắt: cache KV (6 giờ) > Clef (chọn 4–6 ngành, chỉ khi có binding `AI`) > RAG cộng đồng (Vectorize, tối đa 6 mảnh) > LLM. Mỗi bậc thiếu binding hoặc lỗi thì bị bỏ qua. Tổng ngân sách 12 giây một lượt. Client gửi tối đa 12 ngành; sau Clef còn 4–6 ngành vào lời nhắc.

## Cách trả lời: ngắn gọn trước, chi tiết khi được hỏi, hành động khi muốn
Lời nhắc `NHAC_HE_THONG` (`src/engine/tu-van.ts`) yêu cầu: mặc định 2–4 câu, tối đa 120 từ, trả thẳng câu hỏi, tối đa 3 kết quả, tên trường đầy đủ ở lần đầu, giải thích thuật ngữ trong 3–5 chữ, không dự báo/xác suất khi chưa được hỏi, thiếu dữ liệu thì nói chưa có, mơ hồ thì hỏi lại đúng một câu, không hỏi lại điều đã có trong hồ sơ. Ba cấp: trả lời ngắn, giải thích thêm khi hỏi vì sao/so sánh, hành động khi muốn làm. `max_tokens` là 450. Lời nhắc không chứa danh sách trường.

### Hợp đồng phản hồi (tương thích ngược, mọi trường mới là tùy chọn)
Mô hình trả một JSON; máy chủ kiểm bằng hàm tay (không thư viện) rồi trả cho client cùng `traLoi/nguon/tang/congDong/viecTiep` cũ:
```
{ intent?: "tra-cuu"|"so-sanh"|"goi-y"|"giai-thich"|"lam-ro"|"ngoai-pham-vi",
  traLoi: string,                       // bắt buộc
  thucThe?: [{ loai: "truong"|"nganh", maTruong, idChuongTrinh? }],
  hanhDong?: [{ loai: "xem-truong"|"xem-nganh"|"xem-diem-chuan"|"so-sanh"|"them-nguyen-vong",
                maTruong?, idChuongTrinh?, ids?: string[], nhan, canXacNhan? }],   // tối đa 3
  hoiLai?: string,
  trangThaiDuLieu?: "da-xac-minh"|"lich-su"|"uoc-tinh"|"du-bao"|"chua-co" }
```
- `maTruong` và `idChuongTrinh` phải nằm trong dữ liệu client gửi kèm; mã bịa bị loại từng mục, `maTruong` của ngành được lấy lại từ dữ liệu.
- `them-nguyen-vong` chỉ là **đề xuất** (`canXacNhan: true`); máy chủ không đổi dữ liệu cá nhân, client phải hỏi xác nhận.
- Sai schema (không phải JSON, thiếu `traLoi`) thì rơi về văn bản + `nguon` như trước. JSON cụt/không có `traLoi` thì không hiện JSON thô mà báo lỗi để client tự trả lời.

### Hậu kiểm số liệu
Số cạnh "điểm"/"triệu" (kể cả khoảng a–b) trong `traLoi` phải có trong tập số của dữ liệu gửi kèm, hồ sơ, ngữ cảnh và tư liệu (cho phép làm tròn, giá trị tuyệt đối của chênh, hiệu các điểm cùng ngành, năm). Lệch thì máy chủ trả 422 `so-lieu-khong-khop`, không cache; app tự trả lời từ số liệu có sẵn. Đầu vào `chenh`, `hocPhiTrieu`, `hocPhiMaxTrieu`, `tiLeViecLam` bị chặn NaN/Infinity/ngoài thang.

### Khóa cache
`tvc<phiên bản logic>:` + SHA-256 của (câu hỏi chuẩn hóa, id+nhãn ngành, hồ sơ, `DATA_VERSION`, ngữ cảnh, **nội dung lời nhắc**). Đổi lời nhắc thì khóa tự đổi; đổi logic thì tăng `PHIEN_BAN_LOGIC` (hiện 4). Bản ghi cache giữ cả phần cấu trúc.

## Bật chế độ AI
Cloudflare Pages > dự án `nguyenvongai` > Settings > Variables and Secrets (môi trường Production), thêm **một** trong các khóa (ưu tiên theo thứ tự):
- `OPENROUTER_API_KEY` (mặc định `deepseek/deepseek-v4.1-flash`, tắt reasoning)
- `ANTHROPIC_API_KEY` (mặc định `claude-haiku-4-5-20251001`)
- `OPENAI_API_KEY` (mặc định `gpt-4o-mini`)
- hoặc binding Workers AI `AI` với `CF_AI_LLM` (mặc định `@cf/meta/llama-3.3-70b-instruct`)

Tùy chọn: `AI_MODEL` để đổi mô hình. Sau khi thêm, deploy lại (hoặc Retry deployment). Chưa có khóa thì `/api/tu-van` trả 503 và app dùng chế độ tự động.

Chạy thử trên máy: `npm run build && npx wrangler pages dev dist --port 8788` (đặt khóa trong file `.dev.vars`, đã được ignore).

## Quyền riêng tư và chi phí
- Em thấy đúng dữ liệu sẽ gửi (nút "Xem dữ liệu sẽ gửi đi") và có thể tắt chia sẻ hồ sơ. Không gửi tên, không gửi thông tin liên hệ.
- Khóa API chỉ nằm ở biến bí mật của Cloudflare, không xuống trình duyệt (có test kiểm tra).
- Endpoint công khai nên có thể bị gọi nhiều: giới hạn đầu vào (câu hỏi ≤ 1000 ký tự, body ≤ 16 KB (kiểm `content-length` trước khi đọc), hồ sơ chỉ giữ các trường đã biết, gọi nhà cung cấp tối đa 10 giây, ≤ 12 ngành, `max_tokens` 450). 
### Giới hạn tần suất (tùy chọn)
Máy chủ bắt buộc có binding KV tên `RATE_KV` để đếm theo IP và theo phút; quá 8 yêu cầu/phút thì trả 429 (app tự chuyển sang trả lời tự động). Nếu thiếu binding hoặc KV lỗi, API trả 503 và không gọi mô hình để tránh phát sinh chi phí không giới hạn.
Bật: `npx wrangler kv namespace create RATE_KV`, rồi Cloudflare Pages > Settings > Bindings > Add > KV namespace, đặt tên biến `RATE_KV`, chọn namespace vừa tạo, deploy lại.
Đếm bằng KV không nguyên tử nên chỉ chặn lạm dụng thô. Khuyến nghị thêm quy tắc WAF Rate Limiting của Cloudflare cho đường dẫn `/api/tu-van` (ví dụ 10 yêu cầu/phút/IP) để chặn chặt ngay ở cạnh mạng.

## Vì sao làm theo cách này
Mô hình chung (như ChatGPT) hay nhớ sai điểm chuẩn và không chỉ được nguồn. Ở đây mô hình chỉ là lớp diễn đạt: số liệu do app tìm và tính, kèm nguồn; câu trả lời được lọc để mọi mã nguồn đều có thật.

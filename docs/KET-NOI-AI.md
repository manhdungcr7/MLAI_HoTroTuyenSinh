# Kết nối Claude và ChatGPT

Học sinh có thể cho Claude hoặc ChatGPT đọc hồ sơ của mình (điểm thi thử, mục tiêu, nguyện vọng, gợi ý ngành, kế hoạch tuần) để hỏi đáp dựa trên đúng số liệu của mình. Trợ lý cũng có thể **đề xuất** thêm hoặc sắp lại nguyện vọng; mọi thay đổi chỉ xảy ra khi học sinh bấm **Xác nhận** trong app.

## 1. Cho học sinh

### Bật kết nối
1. Mở **Hồ sơ > Cài đặt**, mục **Kết nối Claude và ChatGPT**.
2. Bật **Cho Claude/ChatGPT xem hồ sơ của bạn** (mặc định tắt).
3. Đọc hộp đồng ý: bản chụp gồm điểm thi thử, mục tiêu, nguyện vọng, gợi ý ngành và kế hoạch tuần. Bản chụp **không** gồm tên, liên hệ hay lịch sử trò chuyện với AI.
4. Bấm **Đồng ý và tạo**. Máy chủ trả về liên kết MCP và đường dẫn GPT Actions.

Liên kết chỉ hiện **một lần**. Hãy sao chép ngay và cất ở nơi an toàn. Sau khi rời trang, muốn dùng tiếp thì bấm **Tạo lại** (liên kết cũ có thể không còn dùng được).

### Kết nối với Claude
1. Trong Claude, vào **Settings > Connectors** (tên mục có thể khác theo phiên bản).
2. Chọn **Add custom connector**, dán liên kết MCP, đặt tên tùy ý rồi thêm.
3. Trong cuộc trò chuyện, bật kết nối này.

### Kết nối với ChatGPT
ChatGPT có hai cách, tùy gói của bạn:
- **Kết nối MCP (Developer Mode)**: nếu gói của bạn có mục này, dán liên kết MCP như với Claude. Tính năng và vị trí công tắc đã thay đổi trong 2026, và có thể chỉ đọc hoặc chưa có ở gói cá nhân. Hãy kiểm tra trong ứng dụng của bạn.
- **Tạo GPT của riêng bạn** (dùng được với gói cá nhân):
  1. Vào **Explore GPTs > Create**.
  2. Ở **Instructions**, dán đoạn hướng dẫn soạn sẵn (nút **Sao chép hướng dẫn** trong app).
  3. Ở **Actions**, chọn **Import from URL**, dán đường dẫn `openapi.json` (nút **Sao chép đường dẫn** trong app), Authentication để **None**.
  4. Lưu và chọn **Only me** (chỉ mình tôi).

### Đồng bộ và theo dõi
- Khi bạn đổi hồ sơ, nguyện vọng hoặc kế hoạch, app tự đẩy bản chụp mới sau khoảng 5 giây (chỉ khi đang bật). Bấm **Đồng bộ ngay** nếu muốn đẩy liền.
- Phần kết nối hiện hạn dùng, số lần Claude/ChatGPT đã đọc và thời điểm cập nhật lần cuối.

### Đề xuất từ trợ lý
Khi trợ lý đề xuất một thay đổi, một thẻ **"Claude đề xuất: …"** hiện ở phía trên thanh điều hướng, mỗi 4 giây kiểm tra một lần (chỉ khi tab đang mở).
- **Xác nhận**: app áp dụng thay đổi (ví dụ thêm ngành vào đúng vị trí), rồi báo máy chủ. Ngành đã có sẵn thì không thêm lần hai.
- **Bỏ qua**: bỏ đề xuất, không đổi gì.

Đề xuất về điểm hay mục tiêu chưa áp tự động được; thẻ chỉ có **Bỏ qua** và em tự cập nhật trong app.

### Ngắt kết nối
- Tắt công tắc, hoặc bấm **Ngắt kết nối và xóa**: máy chủ xóa bản chụp, app xóa khóa trên máy này. Liên kết cũ hết hiệu lực.
- **Xóa hết** (trong Cài đặt) cũng xóa khóa kết nối trên máy.

## 2. Cho người demo (ban giám khảo)

Chuẩn bị:
1. Chạy `npm run app:local` (hoặc app đã triển khai có máy chủ).
2. Mở Cài đặt, dùng **Hồ sơ mẫu** để có dữ liệu thật, rồi bật kết nối và tạo liên kết.
3. Sao chép liên kết MCP trước khi chuyển sang màn khác (chỉ hiện một lần).

Câu mẫu để thử với trợ lý:
- "Hồ sơ của tôi hiện thế nào?"
- "Nguyện vọng nào của tôi đang là Thử sức? Điểm chuẩn hai năm gần nhất là bao nhiêu?"
- "Tôi còn thiếu bao nhiêu điểm để đạt mục tiêu?"
- "Gợi ý thêm một ngành An toàn cùng nhóm với nguyện vọng 1 và thêm vào danh sách của tôi."
- "Kế hoạch tuần này của tôi có những việc gì?"

Kiểm tra nhanh: sau câu gợi ý thêm ngành, thẻ **Claude đề xuất** phải hiện; chỉ sau khi bấm **Xác nhận** danh sách nguyện vọng mới đổi.

## 3. Giới hạn cần nói thật

- **Không có đăng nhập.** Ai có liên kết đều đọc được bản chụp. Liên kết là bí mật; đừng dán vào nơi công khai.
- **Chưa xác minh gói ChatGPT nào hỗ trợ kết nối MCP.** Trước khi hứa với ai, hãy thử thật trên tài khoản đó. Đường GPT Actions là phương án dự phòng, và OpenAI đã thông báo sẽ ngừng custom GPT với Enterprise, nên chỉ là cầu nối.
- **Bản chụp là ảnh chụp tại thời điểm đồng bộ.** Trợ lý thấy số liệu của lần đồng bộ gần nhất, không tự cập nhật theo từng phút.
- **Điểm chuẩn là số các năm trước.** Trợ lý phải nói rõ năm và nguồn, không được coi là xác suất đậu.
- **Xóa kết nối là xóa bản chụp** trên máy chủ. Dữ liệu trên máy học sinh không đổi.
- Máy chủ phải chạy để kết nối hoạt động. Nếu không kết nối được, app báo lỗi và có nút **Thử lại**; dữ liệu trên máy không mất.

## 4. Thành phần kỹ thuật (để bảo trì)

| Phần | Tệp |
|---|---|
| Hợp đồng dữ liệu (không đổi tùy tiện) | `src/engine/ket-noi-kieu.ts` |
| Dựng bản chụp, khóa cục bộ, áp đề xuất (thuần TypeScript) | `src/state/ket-noi.ts` |
| Gọi máy chủ, có thời hạn 12 giây | `src/features/ket-noi/api.ts` |
| Trạng thái trình duyệt, bật/đồng bộ/ngắt | `src/features/ket-noi/quan-ly.ts` |
| Khối trong Cài đặt | `src/features/ket-noi/khoi-ket-noi.tsx` |
| Hướng dẫn Claude/ChatGPT, đoạn Instructions | `src/features/ket-noi/huong-dan.tsx` |
| Thẻ đề xuất và đồng bộ nền (gắn vào khung) | `src/features/ket-noi/the-de-xuat.tsx` |
| Kiểm thử | `tests/ket-noi-app.test.ts` |

Khóa cục bộ: `nvai:ket-noi` (`{ma, hetHan}`). Khóa bắt đầu bằng `nvai:` nên "Xóa hết" xóa được.

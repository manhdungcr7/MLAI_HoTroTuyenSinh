# E2E và sản xuất demo

Ngày chạy: 16-10-2026. Agent 5 chỉ ghi trong `docs/audits/05-e2e-demo.md` và `demo/**`.

## Môi trường và dữ liệu

- Dùng Cloudflare Pages local tại `http://127.0.0.1:8790`, build local và state cô lập qua `NV_TRANG_THAI`; không gửi thao tác hoặc dữ liệu lên production.
- Browser automation dùng Chrome mới với Puppeteer, context mới, viewport 390×844 CSS px, không dùng Chrome profile của người dùng.
- Hồ sơ tổng hợp có tên “An Demo”, học sinh lớp 11, điểm môn Toán/Lý/Hóa/Anh 8.2/7.5/7.8/8.0, ngân sách đã chọn trong app. Các ảnh trong `demo/assets/` chỉ lấy từ context này.
- Local AI remote bị tắt. Không có phản hồi AI thật được xác minh; video không mô tả chatbot như một năng lực đã chạy.

## Kết quả hành trình

| Bước | Kết quả | Bằng chứng |
|---|---|---|
| Bắt đầu, hồ sơ, nhập điểm | Hoạt động với hồ sơ lớp 11 tổng hợp | `01-start.png`–`04-analysis.png` |
| Khám phá danh mục | Route `#/kham-pha` mở được; danh sách trường/ngành hiển thị và thao tác tìm kiếm hoạt động | `05-discovery.png`, `06-discovery-search.png` |
| Xem và lưu gợi ý | Có thể xem 6 lựa chọn ở các nhóm rủi ro và lưu danh sách | `07-preference-review.png`, lượt tự động ghi nhận check `suggestion-review` và `six-preferences-saved` trước khi chờ route |
| Sắp xếp, tải lại | Một lượt chạy trước đó đã đổi thứ tự và thấy thứ tự còn sau reload; ảnh là capture từ lượt đó | `08-preferences-saved.png` |
| Mục tiêu và kế hoạch tuần | Một lượt chạy trước đó chọn mục tiêu và tạo 3 việc sau khi xác nhận bỏ qua cảnh báo chưa có thời khóa biểu | `09-study-goal.png`, `10-study-plan.png` |
| Chia sẻ với người đồng hành | UI nêu rõ người có link xem được dữ liệu và link không thu hồi được; lượt chạy trước mở trang chia sẻ local. Link không được gửi ra ngoài | `11-companion-share-warning.png`, `12-companion-view.png` |

Ảnh 08–12 là bằng chứng của lượt chạy trước đã đi qua các bước đó. Hai lượt tự động cuối sau khi khởi tạo context mới dừng ở bước lưu nguyện vọng: nội dung route vẫn là “Đang tải dữ liệu chương trình…”, chờ tên danh sách quá 10 giây. Trong lượt cuối không ghi nhận `pageerror`, console error, request thất bại hay phản hồi HTTP lỗi trước thời điểm timeout. Vì thế, lỗi này được ghi là **race/loading chưa xác định nguyên nhân**, không kết luận lỗi điều hướng. Các lần chạy trước đã từng đi qua các bước sau, nên có bằng chứng tính không ổn định giữa các lượt.

## Chat, AI và quyền riêng tư

- Với câu hỏi tổng hợp “Em lớp 11 chưa có điểm thi thử, nên bắt đầu từ đâu?”, API local `POST /api/tu-van` trả HTTP **503** khi AI remote tắt. UI hiện fallback cục bộ.
- Trong lần kiểm tra thủ công, checkbox “Kèm hồ sơ của bạn” được bỏ chọn nhưng fallback vẫn hiển thị thông tin lấy từ hồ sơ tổng hợp như tổ hợp D07, điểm 24,0 và số lượng ngành. Đây là P1 về hành vi opt-out. Root cause đã chuyển cho agent chính; agent chính báo đã sửa và regression pass. Audit này không xác minh bản build sau sửa vì Pages local cần được bàn giao để build lại.
- Response body của HTTP 503 không được lưu ở lần bắt thủ công; không suy diễn thông báo lỗi của server. Không gửi câu hỏi có dữ liệu thật.
- Luồng chia sẻ tạo URL mang payload hồ sơ trong query string. UI đã cảnh báo ai có link có thể xem nội dung và link không thu hồi được. Link chỉ được mở trên local, không đưa vào ảnh hoặc video, và không ghi payload vào report.

## Tài nguyên demo

- `demo/storyboard.md`: kịch bản 115 giây, dựa trên màn hình đã chụp.
- `demo/scripts/run-demo-e2e.mjs`: automation dùng Chrome context cô lập, output JSON và ảnh; mặc định `http://127.0.0.1:8790`.
- `demo/scripts/render-demo-video.mjs`: đóng gói ảnh thật thành video H.264 1920×1080, 30 fps, không âm thanh có bản quyền.
- `demo/assets/e2e-report.json`: log lượt chạy tự động gần nhất, chỉ có synthetic data và URL local; route share nếu có được redact.
- Ảnh: `demo/assets/01-start.png` đến `demo/assets/12-companion-view.png`.
- Video đích: `demo/final/nguyen-vong-ai-demo.mp4`.

## Hạn chế

- Không xác minh production, connector ngoài, OAuth, hay AI provider thật.
- Thống kê catalog/điểm chuẩn được trình bày như output app; audit E2E này không xác nhận độ đầy đủ hoặc độ đúng độc lập của dataset.
- Video là dựng liên tục từ ảnh chụp thật cùng lời dẫn ngắn; không có âm thanh. Chatbot và AI bị lược khỏi demo vì local provider không hoạt động và fallback opt-out từng lộ context.
- Cần sửa/điều tra trạng thái loading sau khi lưu danh sách để automation đi hết hành trình ổn định.

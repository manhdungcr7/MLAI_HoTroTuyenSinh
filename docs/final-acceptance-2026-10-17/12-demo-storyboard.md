# 12 — DEMO STORYBOARD & BACKUP VISUAL PACK

**Tệp video chính thức:** `evidence/presentation/nguyenvongai-demo-offline.mp4`  
- **Thông số kỹ thuật:** Thời lượng **115,0 giây** (nằm chuẩn trong khung 100–120 giây yêu cầu), độ phân giải **1280×720 (HD 16:9)**, codec **H.264 (`libx264`, `yuv420p`, `25 fps`)**, dung lượng **0,70 MB** (tương thích 100% với mọi trình phát video offline, PowerPoint, trình duyệt và Zalo/Telegram).
- **Phương pháp ghi hình:** Quay trực tiếp từ trình duyệt Chromium thật điều khiển tự động qua các thao tác DOM thực tế của ứng dụng Nguyện Vọng AI (kèm khung hiển thị mobile thật bên phải và bảng thuyết minh thông số kỹ thuật trực tiếp bên trái).
- **Bộ ảnh 10 bước dự phòng:** `evidence/presentation/10-step-journey/step-01..10-*.png` (dùng trong trường hợp máy chiếu hội trường không phát được video MP4).

---

## Phần 1 — Storyboard chi tiết Video Demo `115 giây` (7 Phân đoạn bắt buộc)

| Phân đoạn | Mốc thời gian | Màn hình & Route thực tế | Thao tác hiển thị trên màn hình | Thông điệp cốt lõi cho Ban Giám khảo | Ảnh đối chiếu (10-Step Pack) |
|---|---|---|---|---|---|
| **1. Nêu bài toán** | `0:00 – 0:10` *(10s)* | `/chao` | Mở màn hình chào Nguyện Vọng AI; giới thiệu chân dung em Minh (lớp 12, tổ hợp A01, ngân sách gia đình $\le 35$ triệu/năm) đứng trước 3.648 chương trình và giới hạn 15 nguyện vọng năm 2026. | Học sinh cần một hệ thống **Ra quyết định (Decision Intelligence)** chứ không chỉ là bảng tra cứu điểm rời rạc. | `step-01-chao-problem.png` |
| **2. Nhập hồ sơ học sinh** | `0:10 – 0:25` *(15s)* | `/bat-dau/1` → `/bat-dau/2` → `/bat-dau/3` | Chọn Lớp 12, TP.HCM, hướng Công nghệ thông tin; nhập điểm Toán `8.5`, Lý `8.25`, Anh `8.5` (tổng môn `25.25`), khu vực ưu tiên `KV2-NT` và ngân sách gia đình. Hệ thống hiển thị điểm ưu tiên giảm dần theo quy chế Bộ GD&ĐT (`+0.16` thay vì `+0.50`, tổng xét tuyển `25.41`). | Tính điểm **tất định 100% theo Quy chế Bộ GD&ĐT**, hỗ trợ cả học sinh lớp 11 chưa có điểm thi. | `step-02-bat-dau-1-profile.png`<br>`step-03-bat-dau-2-scores.png` |
| **3. Khám phá & Lọc ngành** | `0:25 – 0:45` *(20s)* | `/kham-pha` → `/kham-pha/:id` | Duyệt danh sách ngành gợi ý từ 3.648 chương trình; lọc theo nhóm ngành CNTT, khu vực miền Nam và học phí trong ngân sách; mở chi tiết một chương trình để xem chênh lệch điểm chuẩn 2025, trạng thái học phí (*Chính thức* vs *Ước tính*) và liên kết đề án gốc. | Minh bạch nguồn dữ liệu, cảnh báo rõ chương trình vượt ngân sách hoặc chưa có liên kết đề án. | `step-04-kham-pha-programs.png`<br>`step-05-chi-tiet-program.png` |
| **4. Xếp nguyện vọng & Giải thích độ an toàn** | `0:45 – 1:05` *(20s)* | `/nguyen-vong` → `/nguyen-vong/an-toan` | Xem danh mục nguyện vọng được gắn 4 nhãn cố định (*Thử sức · Vừa sức · An toàn · Dự phòng*); mở bảng chẩn đoán danh mục và kiểm tra độ an toàn để phát hiện lỗi **xếp ngược thứ tự nguyện vọng** hoặc thiếu chốt chặn *Dự phòng*. | Bảo vệ học sinh khỏi rủi ro trượt oan do sắp xếp sai thứ tự ưu tiên nguyện vọng. | `step-06-nguyen-vong-portfolio.png`<br>`step-07-an-toan-audit.png` |
| **5. Thử tình huống & Kế hoạch học tập** | `1:05 – 1:25` *(20s)* | `/thu-tinh-huong` → `/ke-hoach/tuan` | Kéo thanh trượt giảm thử điểm thi để kiểm tra độ bền của danh mục nguyện vọng; chuyển sang màn hình Kế hoạch tuần nơi hệ thống tự động ưu tiên các buổi ôn tập cho **môn kéo điểm (Vật lý)**. | Chuyển hóa lo lắng điểm số thành **kế hoạch hành động cụ thể mỗi tuần**. | `step-08-thu-tinh-huong-ke-hoach.png` |
| **6. Hỏi Trợ lý AI có dẫn nguồn** | `1:25 – 1:40` *(15s)* | `/tu-van` | Đặt câu hỏi tuyển sinh thực tế theo điểm và học phí; hệ thống phản hồi tức thì từ bộ định tuyến tất định và dữ liệu đã kiểm chứng, kèm gợi ý hành động tiếp theo, **0 ảo giác số liệu**. | AI phục vụ bài toán tuyển sinh thực chất với chi phí vận hành cực thấp và kiểm soát chặt nguồn dữ liệu. | `step-09-tu-van-ai-grounded.png` |
| **7. Xuất lộ trình & Kết nối mở** | `1:40 – 1:55` *(15s)* | `/ho-so/chia-se` → `/ho-so/cai-dat` | Tạo liên kết chia sẻ chế độ chỉ-đọc cho phụ huynh/giáo viên chủ nhiệm, xuất tệp sao lưu JSON Local-First và hiển thị cổng kết nối chuẩn mở **MCP + OAuth 2.1 PKCE**. | Tôn trọng quyền riêng tư học sinh, sẵn sàng đồng hành cùng gia đình và hệ sinh thái AI mở. | `step-10-chia-se-backup-mcp.png` |

---

## Phần 2 — Bộ 10 Ảnh Chụp Hành Trình Dự Phòng (`evidence/presentation/10-step-journey/`)

Trong trường hợp hội trường gặp sự cố âm thanh/video, người thuyết trình có thể mở trực tiếp 10 ảnh chụp màn hình theo đúng thứ tự đánh số từ `01` đến `10`:

1. [`step-01-chao-problem.png`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/presentation/10-step-journey/step-01-chao-problem.png) — Màn hình `/chao`: Khởi đầu trực quan, cho phép chọn bắt đầu hồ sơ mới hoặc nạp hồ sơ mẫu ngay lập tức.
2. [`step-02-bat-dau-1-profile.png`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/presentation/10-step-journey/step-02-bat-dau-1-profile.png) — Màn hình `/bat-dau/1`: Chọn lớp (10/11/12/Thí sinh tự do), tỉnh thành và định hướng ngành nghề (đã ẩn nút Chatbot nổi để không che nút *Tiếp tục*).
3. [`step-03-bat-dau-2-scores.png`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/presentation/10-step-journey/step-03-bat-dau-2-scores.png) — Màn hình `/bat-dau/2`: Nhập điểm các môn tổ hợp A01, hiển thị rõ tổng điểm và tổ hợp mạnh nhất.
4. [`step-04-kham-pha-programs.png`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/presentation/10-step-journey/step-04-kham-pha-programs.png) — Màn hình `/kham-pha`: Danh sách ngành được chấm điểm phù hợp và gắn nhãn *Thử sức · Vừa sức · An toàn · Dự phòng*.
5. [`step-05-chi-tiet-program.png`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/presentation/10-step-journey/step-05-chi-tiet-program.png) — Màn hình `/kham-pha/qsc-24737475`: Chi tiết ngành Công nghệ thông tin (ĐH Công nghệ Thông tin - ĐHQG TP.HCM) với điểm xét tuyển đã cộng ưu tiên chuẩn xác 1 lần và tỷ lệ vượt ngưỡng năm trước tham khảo.
6. [`step-06-nguyen-vong-portfolio.png`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/presentation/10-step-journey/step-06-nguyen-vong-portfolio.png) — Màn hình `/nguyen-vong`: Quản lý danh mục nguyện vọng kèm thẻ *Chẩn đoán danh mục* đồng nhất số lượng nhãn và không còn lỗi `undefined%`.
7. [`step-07-an-toan-audit.png`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/presentation/10-step-journey/step-07-an-toan-audit.png) — Màn hình `/nguyen-vong/an-toan`: Phân tích độ an toàn của danh mục nguyện vọng và hướng dẫn cách bổ sung phương án dự phòng.
8. [`step-08-thu-tinh-huong-ke-hoach.png`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/presentation/10-step-journey/step-08-thu-tinh-huong-ke-hoach.png) — Màn hình `/ke-hoach/tuan`: Lịch học tuần tự động phân bổ các phiên ôn tập theo môn kéo điểm.
9. [`step-09-tu-van-ai-grounded.png`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/presentation/10-step-journey/step-09-tu-van-ai-grounded.png) — Màn hình `/tu-van`: Trợ lý AI trả lời câu hỏi tư vấn ngành Công nghệ thông tin theo điểm và học phí dựa trên dữ liệu kiểm chứng.
10. [`step-10-chia-se-backup-mcp.png`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/presentation/10-step-journey/step-10-chia-se-backup-mcp.png) — Màn hình `/ho-so/cai-dat`: Sao lưu/khôi phục tệp JSON Local-First và quản lý kết nối MCP / OAuth 2.1.

---

## Phần 3 — Bộ Ảnh Đối Chiếu Trước & Sau Khi Sửa Lỗi (`evidence/before-after/`)

Để chứng minh quá trình nghiệm thu đã phát hiện lỗi thật và sửa thật trên giao diện, Hội đồng có thể đối chiếu trực tiếp 4 cặp ảnh trong `evidence/before-after/`:

1. **Lỗi P1-01 (`xác suất undefined%` khi nguyện vọng thiếu môn trong tổ hợp):**
   - Trước khi sửa: [`01-before-nguyen-vong-undefined-pct.png`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/before-after/01-before-nguyen-vong-undefined-pct.png)
   - Sau khi sửa: [`01-after-nguyen-vong-clean-probability.png`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/before-after/01-after-nguyen-vong-clean-probability.png)
2. **Lỗi P1-03 (Nút Chatbot nổi đè lên nút *Tiếp tục* trên màn hình khởi đầu `/bat-dau/1`):**
   - Trước khi sửa: [`02-before-bat-dau-1-chatbot-overlap.png`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/before-after/02-before-bat-dau-1-chatbot-overlap.png)
   - Sau khi sửa: [`02-after-bat-dau-1-no-chatbot-overlap.png`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/before-after/02-after-bat-dau-1-no-chatbot-overlap.png)
3. **Lỗi P2-03 (Học sinh lớp 11 chưa chọn trường mục tiêu bị khóa nút tạo lịch học tuần tại `/ke-hoach/tuan`):**
   - Trước khi sửa: [`03-before-lop11-ke-hoach-tuan-blocked.png`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/before-after/03-before-lop11-ke-hoach-tuan-blocked.png)
   - Sau khi sửa: [`03-after-lop11-ke-hoach-tuan-light-plan.png`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/before-after/03-after-lop11-ke-hoach-tuan-light-plan.png)
4. **Lỗi P0-01 (Cộng trùng hai lần điểm ưu tiên tại `/kham-pha/:id`):**
   - Sau khi sửa và chuẩn hóa nhãn tham khảo lịch sử: [`04-after-chi-tiet-priority-consistent.png`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/before-after/04-after-chi-tiet-priority-consistent.png)

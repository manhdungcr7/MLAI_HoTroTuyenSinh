# 14 — POST-PRESENTATION ROADMAP (2026–2027 ADMISSIONS CYCLE)

Tài liệu này xác định lộ trình kỹ thuật và dữ liệu thực tế của **Nguyện Vọng AI** ngay sau buổi bảo vệ ngày **17/10/2026**, tập trung vào việc phục vụ học sinh THPT trong mùa tuyển sinh 2026–2027 một cách an toàn, bền vững và chi phí thấp.

---

## Nguyên tắc định hướng phát triển
1. **Giữ vững miễn phí 100% cho học sinh phổ thông:** Không thu phí tính năng cốt lõi, không gắn quảng cáo gây nhiễu quyết định chọn trường.
2. **Dữ liệu có nguồn kiểm chứng quan trọng hơn số lượng:** Ưu tiên nâng tỷ lệ chương trình có liên kết đề án chính thức và học phí xác thực lên 100% trước khi mở rộng thêm trường mới.
3. **Kiến trúc Static-First & Privacy-By-Design:** Tiếp tục xử lý tính toán ở phía thiết bị học sinh để giữ chi phí vận hành dưới $15/tháng cho hàng chục nghìn người dùng, đồng thời không thu thập thông tin định danh cá nhân (PII).

---

## Giai đoạn 1 — Ngay sau ngày 17/10/2026 đến Tháng 12/2026 (Chuẩn bị Đề án sớm 2026)

### 1.1. Hoàn tất xác minh 377 chương trình chưa có URL đề án (Data Completeness)
- **Hiện trạng:** Trong 3.648 chương trình hiện có, 3.271 chương trình (89,7%) đã có URL nguồn và 377 chương trình (10,3%) đang gắn nhãn chờ bổ sung liên kết.
- **Hành động:**
  - Sử dụng hệ thống quản trị `cms/` và hàng đợi đóng góp `/dong-gop` để rà soát và đính kèm link thông báo tuyển sinh chính thức cho toàn bộ 377 chương trình còn lại.
  - Tự động hóa script kiểm tra link chết (HTTP 404/500) định kỳ hàng tuần qua GitHub Actions.
- **Tiêu chí hoàn thành:** 100% chương trình hiển thị trên `/kham-pha` có liên kết nguồn hoạt động hoặc tài liệu lưu trữ đối chiếu.

### 1.2. Triển khai bản sửa lỗi lên Production & Kiểm chứng Claude/ChatGPT Connectors
- **Hiện trạng:** Các bản sửa lỗi `P0-01`, `P1-01..04`, `P2-01..06` đã hoàn tất, vượt qua toàn bộ 64 bộ test và sẵn sàng ở nhánh local; giao thức MCP + OAuth 2.1 đã đạt 17/17 bài kiểm thử E2E trên production.
- **Hành động:**
  - Sau khi được phê duyệt phát hành sau buổi thuyết trình, đẩy bản cập nhật lên `https://nguyenvongai.pages.dev/`.
  - Thực hiện phiên kết nối trực tiếp từ giao diện **Claude Desktop / Claude Web Custom MCP Connector** và **ChatGPT Custom GPT Actions** thông qua luồng OAuth 2.1 PKCE thật, quay video hướng dẫn 60 giây cho học sinh.

---

## Giai đoạn 2 — Quý 1/2027 (Cao điểm Thi thử & Tuyển sinh sớm)

### 2.1. Cập nhật cuốn chiếu Đề án Tuyển sinh 2026 chính thức & Học phí thực tế
- **Hiện trạng:** Hiện tại có 602 chương trình có học phí chính thức từ đề án và 3.046 chương trình dùng mức ước tính theo nhóm trường.
- **Hành động:**
  - Phối hợp với các câu lạc bộ/đội sinh viên tình nguyện tại 10–15 cụm trường đại học lớn (Hà Nội, Đà Nẵng, TP.HCM, Cần Thơ) thông qua cổng `/dong-gop/tinh-nguyen` để cập nhật ngay khi các trường công bố Đề án tuyển sinh năm 2026.
  - Bổ sung trường dữ liệu `namApDungDeAn: 2026` song song với mốc điểm chuẩn lịch sử 2025 để học sinh thấy rõ những ngành có thay đổi tổ hợp môn hoặc chỉ tiêu năm mới.

### 2.2. Đồng bộ Đám mây Tùy chọn Không Mật khẩu (Optional Zero-PII Cloud Sync)
- **Hiện trạng:** Hồ sơ lưu mặc định trên `localStorage` kèm xuất/nhập tệp JSON và liên kết chia sẻ chỉ-đọc `/dong-hanh/:ma`.
- **Hành động:**
  - Xây dựng tính năng *"Mã khôi phục 6 ký tự + PIN"* trên nền hạ tầng Cloudflare D1 và cơ chế băm SHA-256 đã có sẵn trong `functions/oauth/`.
  - Cho phép học sinh dùng máy tính ở phòng tin học nhà trường nhập mã khôi phục để tiếp tục chỉnh sửa danh mục nguyện vọng đã tạo trên điện thoại mà vẫn không cần khai báo email hay số điện thoại.

---

## Giai đoạn 3 — Quý 2 & Quý 3/2027 (Cao điểm Đăng ký Nguyện vọng & Hiệu chuẩn Mô hình)

### 3.1. Hiệu chuẩn Độ lệch chuẩn ($\sigma$) theo Nhóm ngành từ Chuỗi dữ liệu Đa năm (2022–2026)
- **Hiện trạng:** Hàm ước tính tỷ lệ vượt ngưỡng (`tinhXacSuatTrungTuyen`) đang sử dụng độ lệch chuẩn lịch sử cố định $\sigma = 0.85$ và hệ số tương quan $\rho = 0.65$ cho mọi ngành.
- **Hành động:**
  - Thu thập đầy đủ chuỗi điểm chuẩn 4–5 năm liên tiếp (2022–2026) cho từng chương trình.
  - Tính độ biến động thực nghiệm $\sigma_i$ riêng cho từng nhóm ngành (ví dụ: nhóm Y Dược/Sư phạm tốp đầu thường có $\sigma \approx 0.35 - 0.50$, trong khi các ngành mới mở hoặc xét học bạ có thể biến động $\sigma \approx 1.2 - 1.5$).
  - Thực hiện kiểm định hậu nghiệm (Backtesting & Calibration Brier Score) sau khi có điểm chuẩn chính thức để đánh giá độ chính xác của 4 nhãn *Thử sức · Vừa sức · An toàn · Dự phòng*.

### 3.2. Gói Triển khai cho Giáo viên Chủ nhiệm & Ban Tư vấn Hướng nghiệp THPT
- **Hiện trạng:** Liên kết `/dong-hanh/:ma` đã cho phép phụ huynh và giáo viên xem hồ sơ của từng học sinh.
- **Hành động:**
  - Bổ sung chế độ tổng hợp ẩn danh cho Giáo viên chủ nhiệm lớp 12: giúp giáo viên nhìn nhanh trong lớp có bao nhiêu học sinh đang xếp danh mục *Thiếu nguyện vọng An toàn/Dự phòng* hoặc *Vượt trần học phí gia đình* để kịp thời nhắc nhở trước ngày khóa cổng đăng ký của Bộ GD&ĐT.

---

## Bảng tóm tắt lộ trình theo cột mốc

| Cột mốc thời gian | Mục tiêu trọng tâm | Chỉ số đo lường thành công (KPI kỹ thuật) |
|---|---|---|
| **Tháng 10 – 12/2026** | Hoàn tất liên kết đề án & Mở rộng tích hợp MCP | **100%** trong 3.648 chương trình có URL nguồn kiểm chứng; hướng dẫn kết nối Claude/ChatGPT hoàn chỉnh. |
| **Tháng 01 – 03/2027** | Cập nhật Đề án 2026 & Đồng bộ đa thiết bị tùy chọn | Nâng số chương trình có học phí chính thức từ **602 lên > 2.000**; hỗ trợ khôi phục hồ sơ qua mã PIN ẩn danh. |
| **Tháng 04 – 08/2027** | Hiệu chuẩn mô hình đa năm & Hỗ trợ mùa chốt nguyện vọng | Tính $\sigma_i$ thực nghiệm từ dữ liệu 2022–2026; duy trì **0 lỗi cộng sai điểm** và chi phí hạ tầng **< $15/tháng**. |

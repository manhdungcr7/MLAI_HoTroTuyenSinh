# 🎯 PHÂN TÍCH KHOẢNG TRỐNG & MA TRẬN ƯU TIÊN (GAP ANALYSIS & PRIORITY MATRIX)

## 1. Phân tích Hiện trạng (Current vs Target Product Model)

| Tiêu chí | Hiện trạng (Current) | Mục tiêu Hoàn thiện (Target) | Khoảng cách & Giải pháp |
|---|---|---|---|
| **Khởi đầu & Trường mơ ước** | Chọn "Đã có trường mơ ước" chỉ lưu cờ boolean | Cho phép gõ/chọn nhanh trường hoặc ngành mơ ước ngay tại Bước 1 | Đã thêm `truongMoUoc` vào `types.ts` và ô nhập tại `buoc-1.tsx`. Chưa nối tới hiển thị hoặc so tính. |
| **Mục tiêu chính khi chưa chọn** | Hiện trạng thái trống chỉ có 1 nút "Khám phá" | Khi học sinh đã có nguyện vọng trong danh sách, gợi ý 1 chạm chọn ngay NV1 làm mục tiêu | Thêm nút "Chọn từ {N} nguyện vọng đã lưu" trong `hom-nay.tsx` và `muc-tieu.tsx`. Chưa liên kết `datMucTieu`. |
| **Tổ hợp khối Xã hội & Tin học** | Tab Mục tiêu chỉ hỗ trợ 4 tổ hợp A00, A01, D01, B00 | Mở rộng tính toán cho các ngành xét tổ hợp C00, D14, X70... khi học sinh có điểm Sử, Địa, GDKT&PL, Tin | Nâng cấp `toHopChoMucTieu` và `coTheDatMucTieu` trong `src/state/chon.ts`. |
| **Hành động từ Thử tình huống** | Thử +1.0 điểm thấy trường mới mở nhưng phải quay lại tìm | Cho phép bấm trực tiếp vào thẻ trường để xem chi tiết hoặc thêm vào nguyện vọng | Xác nhận thẻ `DongTruong` liên kết thẳng tới `/kham-pha/:id`. |
| **Vòng lặp Điểm thi thử ➔ Kế hoạch** | Nhập điểm thi thử mới lưu vào `diemThi` nhưng chưa nhắc cập nhật Kế hoạch | Trang so sánh trước/sau có nút 1-chạm "Cập nhật kế hoạch học" | Đã có nút liên kết tới Kế hoạch tuần. |

---

## 2. Ma trận Ưu tiên Triển khai (Priority Matrix)

### 🔴 P0 — Broken & Integrity (Cốt lõi)
- [x] Sửa triệt để warning Vite `__dirname` trong `vite.config.ts`.
- [x] Đảm bảo mọi phép toán điểm (dấu phẩy thập phân, chuỗi gõ dở "7,") không sinh `NaN`.
- [x] Try/catch an toàn toàn bộ thao tác `localStorage` tránh crash trên iOS Safari Private Mode.

### 🟡 P1 — Core UX & Zero Dead-Ends
- [x] Bổ sung ô nhập trường mơ ước `truongMoUoc` tại Bước 1 Onboarding.
- [x] Cải thiện Empty State tại trang `Hôm nay` và `Mục tiêu`: cho phép 1 chạm chọn từ danh sách nguyện vọng đã lưu thay vì bắt tìm kiếm lại từ đầu.
- [ ] Mở rộng hỗ trợ tổ hợp xét tuyển trong `src/state/chon.ts` (`coTheDatMucTieu`, `toHopChoMucTieu`) để không từ chối các ngành xét C00/D14/X70 khi học sinh đã nhập điểm môn Sử/Địa/Tin.

### 🟢 P2 — Decision Intelligence & Explainability
- [ ] Tối ưu hóa giải thích ROI môn kéo điểm trong `mon-keo-diem.tsx`: nêu rõ lý do vì sao dồn sức vào môn có điểm 6.5–8.0 mang lại hiệu quả cao hơn môn đã chạm ngưỡng 9.0+.
- [ ] Cải thiện thông điệp cân bằng danh mục trong `an-toan.tsx` với câu khuyến nghị tự nhiên, dễ hiểu.

### 🔵 P3 — Daily Utility & Loop
- [ ] Hoàn thiện vòng lặp: Khi học sinh tick hoàn thành buổi học ở trang Hôm nay (`hom-nay.tsx`), thanh tiến độ tuần cập nhật tức thì với hiệu ứng phản hồi tích cực.
- [ ] Đồng bộ hóa nhắc nhở học tập với thời gian còn lại đến kỳ thi THPT.

### 🟣 P4 — Polish & Visual Hierarchy
- [ ] Bổ sung đầy đủ thẻ OpenGraph Meta, Twitter card trong `index.html` phục vụ chia sẻ phụ huynh qua Zalo/Facebook. (Meta tag thêm nhưng chưa có file `public/og.png` 1200x630.)
- [ ] Rà soát toàn bộ touch targets ≥ 48px và text wrapping trên mobile viewports 320px–390px.

---

## 3. P0 Integrity — Vấn đề chất lượng dữ liệu & Logic

| Vấn đề | Trạng thái | Ghi chú |
|---|---|---|
| Điểm chuẩn gắn nhầm năm | Đã có từ trước | `lua-chon-thuc.ts:68` chứa chương trình mà điểm chuẩn gắn năm sai; cần audit lại dữ liệu. |
| Nhãn nguyện vọng cho chương trình không phải THPT | Đã có từ trước | Một số chương trình CĐ/dạy nghề được nhãn Thử sức/Vừa sức/An toàn; cần bộ lọc riêng. |
| Cờ "suy ra" cho tổ hợp chỉ hiện ở chi tiết | Đã có từ trước | Danh sách nguyện vọng không hiển thị cờ này; người dùng không biết tổ hợp nào là suy ra. |
| Điểm thiếu môn tính như 0 | Đã có từ trước | Khi em chưa nhập đủ 3 môn tổ hợp, tính điểm bằng 0 làm điểm tổng thấp hơn thực tế; cần hiển thị rõ "chưa đủ điểm các môn". |
| Ngày thi THPT cứng 26/6 | Đã có từ trước | Mã cứng `const NGAY_THI` trong engine; cần lấy từ dữ liệu hoặc cấu hình. |
| API tư vấn không rate-limit | Chưa có | `functions/api/tu-van.ts` không kiểm tra số lần gọi/giây; dễ bị spam. |
| Hydrate localStorage không chuẩn hóa | Đã có từ trước | Khi nạp dữ liệu từ localStorage, không kiểm tra kiểu/phần tử khách; có thể là lỗi im lặng. |

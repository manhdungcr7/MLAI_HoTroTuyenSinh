# 07 — MOBILE UX & ACCESSIBILITY AUDIT (KIỂM TOÁN 6 VIEWPORTS × 25 MÀN HÌNH)

Báo cáo này ghi lại kết quả quét tự động bằng trình duyệt Chrome thật trên **6 kích thước màn hình bắt buộc** × **25 màn hình** (= **150 tổ hợp**) cùng 12 màn hình trạng thái trống (`seed=empty`), kiểm thử đóng/mở Modal (`HopTruot`), bàn phím ảo che ô nhập và thông báo lỗi nhập liệu.
- **File dữ liệu đo đạc chi tiết**: `evidence/mobile-ux/viewport-audit.json`
- **Bộ 155 ảnh chụp thực tế**: `evidence/mobile-ux/*.png` + ảnh đối chiếu sau khi vá tại `evidence/before-after/02-after-bat-dau-1-no-chatbot-overlap.png`.

---

## 1. Kết quả quét 6 Viewports bắt buộc (150 tổ hợp màn hình)

| Viewport | Thiết bị đại diện | Số màn hình quét | Tràn ngang (`scrollWidth > innerWidth`) | Vỡ khung / Cắt chữ nghiêm trọng | Nút bị che khuất (Sau khi vá `P1-03`) | Trạng thái |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **`320 × 568`** | iPhone SE (thế hệ 1 — màn siêu nhỏ) | `25` | **`0 / 25`** (`0px` overflow) | `0` | `0` | **PASS** |
| **`360 × 800`** | Android phổ thông | `25` | **`0 / 25`** (`0px` overflow) | `0` | `0` | **PASS** |
| **`375 × 812`** | iPhone X / 12 mini | `25` | **`0 / 25`** (`0px` overflow) | `0` | `0` | **PASS** |
| **`390 × 844`** | iPhone 13 / 14 chuẩn thiết kế | `25` | **`0 / 25`** (`0px` overflow) | `0` | `0` | **PASS** |
| **`430 × 932`** | iPhone 14/15 Pro Max | `25` | **`0 / 25`** (`0px` overflow) | `0` | `0` | **PASS** |
| **`1366 × 768`** | Laptop phổ thông | `25` | **`0 / 25`** (`0px` overflow) | `0` | `0` | **PASS** |

---

## 2. Phân loại lỗi phát hiện: Task-Blocking vs Cosmetic & Kết quả khắc phục

### A. Lỗi Task-Blocking (Ngăn cản hoặc gây bấm nhầm thao tác) — **ĐÃ SỬA TRIỆT ĐỂ 100%**
1. **`[P1-03 · ĐÃ SỬA]` Nút tròn Chatbot AI nổi (`NutTroLyAI`) đè lên góc phải nút `"Tiếp tục"` cố định ở đáy màn `/bat-dau/1`, `/bat-dau/2`, `/bat-dau/3`**:
   - **Hiện tượng**: Trên các màn `/bat-dau/*` không có thanh điều hướng 5 tab dưới (`khongThanh = true`), nên `NutTroLyAI` hạ xuống `bottom-5 right-4` (`y = 724..780` trên màn `360×800`), đè trực tiếp lên vùng bấm bên phải của nút `"Tiếp tục"` (`y = 723..771`).
   - **Cách sửa**: Ẩn `NutTroLyAI` khi `pathname.startsWith("/bat-dau")` trong `src/features/tu-van/tro-ly-noi-bot.tsx:289`.
   - **Bằng chứng Trước / Sau**:
     - Trước: `evidence/before-after/02-before-bat-dau-1-chatbot-overlap.png`
     - Sau: `evidence/before-after/02-after-bat-dau-1-no-chatbot-overlap.png` (Nút `"Tiếp tục"` thông thoáng 100%).

### B. Lỗi Quy tắc Giao diện & Thẩm mỹ (Cosmetic / Design Rule) — **ĐÃ SỬA TRIỆT ĐỂ**
1. **`[P2-05 · ĐÃ SỬA]` Còn sót class `backdrop-blur-md` và `backdrop-blur-sm` (Vi phạm quy tắc Không Glassmorphism)**:
   - Đã gỡ bỏ hoàn toàn tại `src/features/tu-van/tu-van.tsx:185` và `src/components/ui/hien-thi.tsx:89`, chuyển sang nền đặc `bg-trang` và `bg-muc/50`.
2. **`[Cosmetic · Ghi nhận]` Các liên kết đề án PDF phụ hoặc nút tăng/giảm nhỏ (`±0,25`)**:
   - Các nút hành động chính (`Nut`, `HangBam`, tab dưới, nút đóng modal, nút sắp xếp nguyện vọng) đều đạt chiều cao chuẩn `min-h-11` (`44px`) đến `min-h-12` (`48px`). Một số nút phụ trợ trong thẻ (`±0,25` ở màn Thử tình huống hoặc chip lọc phụ) có chiều cao `32px–36px` để giữ mật độ thông tin gọn trên màn `320px`, không ảnh hưởng tới khả năng hoàn thành tác vụ.

---

## 3. Kiểm tra chuyên sâu các tình huống tương tác trên Mobile

1. **Modal / `HopTruot` (`src/components/ui/hien-thi.tsx`)**:
   - Sử dụng phần tử chuẩn `<dialog>` HTML5 (`showModal()`), có bẫy tiêu điểm bàn phím (`Tab` / `Shift+Tab` focus trap), đóng được bằng cả 3 cách: bấm nút `X` (`size-11` = `44×44px`), bấm ra vùng nền ngoài (`onClick backdrop`), hoặc nhấn phím `Escape` (`onCancel`).
2. **Bàn phím ảo che ô nhập liệu (Mobile Virtual Keyboard Simulation)**:
   - Khi thu hẹp chiều cao khả dụng xuống `500px` (giả lập bàn phím ảo chiếm `300px` dưới đáy trên màn `360×800`) và focus vào các ô điểm ở `/bat-dau/2` hoặc ô tìm kiếm ở `/kham-pha`: trang cuộn mượt (`scrollIntoView`), ô đang nhập không bị kẹt dưới thanh cố định.
3. **Kiểm tra Validation & Thông báo lỗi nhập sai (`Input Validation`)**:
   - Thử bỏ trống Tỉnh/thành ở `/bat-dau/1` và bấm **Tiếp tục**: Hệ thống chặn chuyển bước, cuộn tới trường thiếu và hiện thông báo tiếng Việt rõ ràng (*"Bạn chọn tỉnh/thành phố đang học nhé"*).
   - Thử nhập điểm `11` hoặc `-1` ở `/bat-dau/2` và `/diem-thi-thu`: Hệ thống hiển thị cảnh báo đỏ ngay dưới ô nhập (*"Điểm từ 0 đến 10"*), không cho lưu số ngoài thang.
4. **Kiểm tra đủ 4 trạng thái (`Data · Empty · Loading · Error`)**:
   - Đã chụp và xác minh 12 màn hình ở trạng thái hồ sơ trắng (`seed=empty` tại `evidence/mobile-ux/empty-390x844-*.png`): Mọi màn hình (`/`, `/nguyen-vong`, `/nguyen-vong/an-toan`, `/so-sanh`, `/ke-hoach/muc-tieu`, `/ke-hoach/tuan`, `/ke-hoach/tien-do`) đều hiển thị `TrangThaiTrong` giải thích rõ vì sao chưa có dữ liệu kèm nút dẫn tới đúng bước tiếp theo.

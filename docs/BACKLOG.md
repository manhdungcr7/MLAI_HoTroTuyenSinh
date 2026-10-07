# 📋 DANH SÁCH TÍNH NĂNG & BACKLOG (ISSUES) — NGUYỆN VỌNG AI

> **Luật phối hợp nhóm (Team Collaboration Rules):**
> 1. **Phân chia theo Feature / Slice:** Mỗi thành viên toàn quyền và chịu trách nhiệm chính trên thư mục slice của mình (`src/features/<slice>/`).
> 2. **Chống xung đột (Zero Conflict):** Tuyệt đối không sửa chéo code trong thư mục slice của người khác. File dùng chung (`components/`, `state/`, `data/`, `engine/`, `duong-dan.ts`) chỉ đổi bằng PR riêng nhỏ sau khi báo cả nhóm.
> 3. **Cập nhật chéo Backlog:** Khi soi thấy vấn đề hoặc ý tưởng mới (kể cả thuộc phần của thành viên khác), lập tức tạo/cập nhật Issue vào file này và gán đúng Người phụ trách (Owner) để cả nhóm cùng theo dõi.
> 4. **Kỷ luật Pull Request (PR):** Tạo nhánh riêng `feat/<slice>-<viec>`, chạy đủ 4 bước kiểm tra (`tsc`, `kiem-tra`, `test`, `build`) trước khi tạo PR.

---

## 👥 BẢNG PHÂN CÔNG THEO SLICE & THÀNH VIÊN

| Thành viên | Slice phụ trách | Thư mục | Trọng tâm tính năng |
|---|---|---|---|
| **Tuấn** | Khởi đầu + Hôm nay + Hồ sơ | `khoi-dau`, `hanh-trinh` | Form khởi đầu (60s), AI chuyển cảnh, Dashboard Hôm nay, Quản lý hồ sơ |
| **Dũng** | Khám phá + Nguyện vọng | `kham-pha`, `nguyen-vong` | Bộ lọc trường/ngành, So sánh đa chiều, 4 nhãn nguyện vọng (Thử sức/Vừa sức/An toàn/Dự phòng) |
| **Kiệt** | Mục tiêu + Thử tình huống | `muc-tieu`, `thu-tinh-huong` | Phân tích khoảng cách điểm (Gap Analysis), Giả định What-If tăng/giảm điểm, Điểm thi thử |
| **Hưng** | Kế hoạch tuần + Tự học | `ke-hoach`, `tu-hoc` | Thuật toán xếp lịch tự học, Nhiệm vụ theo tuần, Theo dõi tiến độ, Nhắc nhở |

---

## 📌 Issue #01: Luồng nhập và mô tả "Trường mơ ước" khi tạo hồ sơ
- 👤 **Phụ trách (Owner):** Tuấn (`khoi-dau`) & Kiệt (`muc-tieu`)
- ⏳ **Trạng thái:** `Bán phần hoàn thành — Cần nối hiển thị & tính toán`
- 🏷️ **Nhãn:** `enhancement`, `khoi-dau`, `muc-tieu`

### 1. Bối cảnh & Vấn đề
- Ở màn hình **Tạo hồ sơ (Bước 1/3)**, mục **"Mục tiêu hiện tại"** có lựa chọn `Đã có trường mơ ước`.
- Hiện tại khi chọn mục này, hệ thống chỉ lưu trường mơ ước vào `HoSo.truongMoUoc` nhưng chưa nối tới hiển thị hoặc tính toán.

### 2. Yêu cầu nghiệp vụ (User Story)
- **Khi học sinh chọn "Đã có trường mơ ước":**
  - ✅ Hiển thị thêm trường nhập liệu: **"Tên trường / Ngành mơ ước của em"** (ô nhập tự do).
  - ❌ Chưa: Tự động gọi ý từ danh mục 200+ trường.
- **Giá trị mang lại:**
  - ❌ Chưa: Lập tức thiết lập trường đó làm **Mục tiêu tham chiếu chính** trong tab *Mục tiêu* và tính toán khoảng cách điểm.

### 3. Các thành phần cần hoàn thiện
- ✅ **State (`src/state/types.ts`):** Đã thêm `truongMoUoc?: string` vào `HoSo`.
- ✅ **Giao diện (`src/features/khoi-dau/buoc-1.tsx`):** Đã thêm ô nhập.
- ❌ **Phân tích (`src/features/muc-tieu/` & `src/state/chon.ts`):** Chưa gắn trường mơ ước vào mục tiêu tự động; `datMucTieu` chưa được gọi.

---

## 📌 Issue #02: Phân định rạch ròi giữa Form trắng và Dữ liệu mẫu (Sample Persona)
- 👤 **Phụ trách (Owner):** Tuấn (`khoi-dau`, `hanh-trinh`)
- ✅ **Trạng thái:** `Đã xử lý cốt lõi luồng khởi đầu` / ⏳ `Mở rộng trang Hồ sơ (Backlog)`
- 🏷️ **Nhãn:** `state-management`, `ux`, `data-integrity`

### 1. Bối cảnh & Vấn đề
- Trước đây khi bấm "Bắt đầu ngay" từ màn hình Chào mừng, nếu trước đó học sinh đã từng nhấn "Xem hồ sơ mẫu", state lưu trữ trên máy (`localStorage`) vẫn giữ tên "Nguyễn Minh Anh" cùng các điểm thi mẫu. Điều này gây hiểu lầm rằng hệ thống tự ý hardcode thông tin cá nhân.

### 2. Giải pháp đã thực hiện & Tiếp tục theo dõi
- ✅ **Đã xử lý:** Tách biệt nút "Bắt đầu ngay" (gọi `lamLai()` trả về `HO_SO_TRONG` hoàn toàn trắng nếu không phải hồ sơ người dùng tự điền dở dang) và "Xem hồ sơ mẫu" (`dungHoSoMau()`).
- ⏳ **Cần hoàn thiện thêm:** Cơ chế "Đổi hồ sơ / Xóa hồ sơ" trực tiếp trong trang Cài đặt / Cá nhân để học sinh có thể chuyển qua lại giữa hồ sơ cá nhân và hồ sơ mẫu chỉ với 1 chạm.

---

## 📌 Issue #03: Cơ chế tính điểm ưu tiên khu vực (KV1, KV2, KV2-NT, KV3) & Đối tượng
- 👤 **Phụ trách (Owner):** Tuấn (`khoi-dau`) & Kiệt (`thu-tinh-huong`)
- ⏳ **Trạng thái:** `Ghi nhận (Backlog - Dự kiến Phase 2)`
- 🏷️ **Nhãn:** `engine`, `tuyen-sinh`, `tinh-toan`

### 1. Bối cảnh & Vấn đề
- Điểm xét tuyển đại học thực tế tại Việt Nam chịu ảnh hưởng lớn từ chính sách cộng điểm ưu tiên theo khu vực và đối tượng chính sách theo quy chế của Bộ GD&ĐT (đặc biệt là công thức giảm dần mức điểm ưu tiên đối với thí sinh đạt tổng điểm từ 22.5 trở lên).
- Khi chọn Tỉnh/Thành phố ở Bước 1, hệ thống có thể gợi ý sẵn khu vực ưu tiên mặc định.

### 2. Yêu cầu nghiệp vụ (User Story)
- **Tự động hóa:** Tự động map Tỉnh/Huyện học sinh chọn sang khu vực ưu tiên tương ứng.
- **Tùy chỉnh:** Cho phép học sinh tùy chỉnh lại Khu vực (KV1: +0.75đ, KV2-NT: +0.5đ, KV2: +0.25đ, KV3: 0đ) và Đối tượng chính sách (nếu có).
- **Tính toán:** Áp dụng đúng công thức điểm ưu tiên theo quy chế tuyển sinh:
  `Điểm ưu tiên thực tế = [(30 - Tổng điểm) / 7.5] × Mức điểm ưu tiên theo quy định` (với thí sinh đạt ≥ 22.5 điểm).

---

## 📌 Issue #04: Cảnh báo sớm độ lệch môn thi và tổ hợp xét tuyển
- 👤 **Phụ trách (Owner):** Kiệt (`muc-tieu`) & Hưng (`tu-hoc`)
- ⏳ **Trạng thái:** `Ghi nhận (Backlog)`
- 🏷️ **Nhãn:** `smart-advice`, `tu-hoc`, `ai-insight`

### 1. Bối cảnh & Vấn đề
- Khi học sinh nhập điểm các môn ở Bước 2, hệ thống cần lập tức tính toán ra điểm của các tổ hợp phổ biến (A00, A01, B00, C00, D01, D07...) và chỉ ra môn nào đang là "điểm nghẽn" (bottleneck) kéo tụt điểm xét tuyển.

### 2. Yêu cầu nghiệp vụ (User Story)
- Ngay tại màn hình gợi ý / kết quả ban đầu, hệ thống hiển thị badge: *"Tổ hợp A01 của em đang cao nhất (25.5 điểm). Môn Tiếng Anh là môn có tiềm năng kéo thêm +1.0 điểm nhanh nhất."*

---

## 📌 Issue #05: Nâng cấp bộ lọc trường theo Học phí & Cơ hội việc làm
- 👤 **Phụ trách (Owner):** Dũng (`kham-pha`, `nguyen-vong`)
- ⏳ **Trạng thái:** `Ghi nhận (Backlog)`
- 🏷️ **Nhãn:** `kham-pha`, `bo-loc`, `du-lieu-that`

### 1. Bối cảnh & Vấn đề
- Học sinh THPT và phụ huynh rất quan tâm đến mức học phí hàng năm và môi trường thực tập / việc làm của trường.
- Hiện tại bộ lọc trường đang tập trung chính vào Điểm chuẩn và Vị trí địa lý.

### 2. Yêu cầu nghiệp vụ (User Story)
- Bổ sung thanh trượt (slider) / khoảng lựa chọn học phí: `< 20 triệu/năm`, `20 - 40 triệu/năm`, `40 - 80 triệu/năm`, `Chương trình quốc tế`.
- Thẻ trường hiển thị rõ mức học phí dự kiến kèm nhãn dẫn nguồn đề án của trường.

---

## 📌 Issue #06: Tối ưu thuật toán xếp lịch tự học theo nhịp sinh học & điểm nghẽn
- 👤 **Phụ trách (Owner):** Hưng (`ke-hoach`, `tu-hoc`)
- ⏳ **Trạng thái:** `Ghi nhận (Backlog)`
- 🏷️ **Nhãn:** `xep-lich`, `tu-hoc`, `engine`

### 1. Bối cảnh & Vấn đề
- Lịch học tự động cần ưu tiên các môn kéo điểm (môn đang có khoảng cách lớn nhất đến mục tiêu) vào các khung giờ tập trung cao (buổi tối hoặc cuối tuần), tránh dồn lịch quá nặng vào những ngày học sinh đã có lịch học thêm dày đặc.

### 2. Yêu cầu nghiệp vụ (User Story)
- Thuật toán `xepLichTuan` tự động đọc danh sách `coDinh` (lịch cố định) để tìm các "khoảng trống vàng" (golden slots).
- Tự động gán khối học cho môn cần kéo điểm trước, các môn duy trì sau.



---

## 📌 Issue #07: Điểm Sử, Địa, GDKT&PL, Tin, Công nghệ để so ngành khối xã hội
- 👤 **Phụ trách (Owner):** Tuấn (`khoi-dau`) & Dũng (`kham-pha`)
- ✅ **Trạng thái:** `Đã làm`: hồ sơ có `diemThem`, ô nhập ở bước 2, 73 tổ hợp chính thức. Còn lại: Thử tình huống và Mục tiêu vẫn chỉ có 4 tổ hợp A00, A01, D01, B00.
- Hiện 106 trong 2.529 ngành chỉ xét tổ hợp có Sử, Địa, GDKT&PL, Tin (C00, D14, X70...). App ghi "chưa so được" thay vì so sai. Muốn so được cần thêm các môn này vào `MonId`, `HoSo.diem`, bước nhập điểm và bảng `MON_CUA_TO_HOP` ở `features/kham-pha/to-hop.ts`. Thử tình huống vẫn chỉ có 4 tổ hợp A00, A01, D01, B00.

## 📌 Issue #08: Khung chương trình học chi tiết của từng ngành
- 👤 **Phụ trách (Owner):** Dũng (`kham-pha`)
- ⏳ **Trạng thái:** `Ghi nhận (cần nguồn dữ liệu)`
- Chưa có dữ liệu môn từng học kỳ. Hiện có link trang ngành của trường cho khoảng một phần tư số chương trình (`chuong-trinh.json`). Cần quyết định nguồn (website từng trường, hay nhập tay các ngành lớn) trước khi làm.

## 📌 Issue #09: Nâng cấp nguồn cho 962 chương trình chỉ có trang tổng hợp
- 👤 **Phụ trách (Owner):** Dũng (`kham-pha`)
- ⏳ **Trạng thái:** `Ghi nhận (Backlog)`
- Các chương trình lấy từ `tuyensinh247` chưa có đề án PDF chính thức. Cần tìm đề án của từng trường (xem `docs/DU-LIEU.md`).

## 📌 Issue #10: Chia nhỏ gói dữ liệu khi lên bản có máy chủ
- 👤 **Phụ trách (Owner):** cả nhóm, khi làm phần máy chủ
- ⏳ **Trạng thái:** `Ghi nhận (Backlog)`
- `du-lieu-that.json` (khoảng 800 KB) nằm trong gói chính (gzip khoảng 157 KB). Khi có máy chủ, nên tải danh mục theo trang và tìm kiếm phía máy chủ.

---

## Đợt nâng cấp vừa hoàn thành & đã gộp vào `main` (2026-10-07)

1. **Phân luồng 3 chặng học sinh (`src/state/chang.ts`)**:
   - `changCuaEm`: Định hướng (Lớp 10–11), Nước rút (Lớp 12), Thi lại (Đã tốt nghiệp).
   - Ẩn toàn bộ đếm ngược kỳ thi và cảnh báo dồn dập cho học sinh lớp 10–11; điều chỉnh ngày thi dự kiến (+1 năm).
   - Rút gọn Onboarding Bước 1–3 gọn gàng, hỗ trợ cả 3 chặng mượt mà.
2. **Nâng cấp Engine Xếp Lịch & Tạo Việc (`src/engine/tao-viec.ts`, `xep-lich.ts`)**:
   - `viecChoTuan` & `xepLai`: Xếp lịch thông minh từ thời điểm hiện tại (`tuPhut`), không xếp vào ngày đã qua hoặc giờ đã trôi qua.
   - Hỗ trợ chế độ "ôn nhẹ" 3 môn chung (Toán, Văn, Anh) khi học sinh chưa đặt mục tiêu trường.
   - Test suite hoàn chỉnh `tests/xep-lai.test.ts` kiểm thử mọi kịch bản góc.
3. **Giao diện Kế hoạch tuần & Nhập lịch nhanh (`src/features/ke-hoach/`)**:
   - Hộp nhập nhanh lịch học cố định theo buổi (sáng/chiều/tối) không cần bấm từng tiết.
   - Component `TuanMoiTuTao` và `TheViecDoTuanTruoc` tự động bắt nhịp khi sang tuần mới.
   - Tích hợp lịch phổ thông mẫu, cho phép thêm hoặc thay thế lịch cũ an toàn.
4. **Hạ tầng CMS Quản trị & Dữ liệu Cộng đồng (`cms/`, `migrations/0001_cong_dong.sql`)**:
   - Trọn bộ API Cloudflare Pages Functions D1 (`cms/functions/api/`) quản lý trường, thông tin học phí, học bổng, nơi lưu trú, review, phân công CTV/QTV.
   - Ứng dụng CMS Mobile riêng (`cms/`) chạy độc lập (cổng `npm run cms:dev` / `npm run cms:build`), có sẵn chế độ giả lập (`gia-lap.ts`) cho dev nhanh.
   - Module kiểm tra làm sạch dữ liệu `src/data/dong-gop-kiem-tra.ts` (100% test xanh `tests/dong-gop.test.ts`).

---

## Việc còn lại để bàn giao cho các bạn tiếp theo

| # | Việc | Phụ trách | Ưu tiên | Trạng thái & Hướng dẫn thực hiện |
|---|---|---|---|---|
| 11 | Ảnh `public/og.png` 1200x630 và icon PNG 192/512 + apple-touch-icon | Thiết kế | P0 | Xuất ảnh OpenGraph để khi chia sẻ lên Zalo/Facebook hiện preview đẹp |
| 12 | Đổi `EMAIL_BAO_SAI` trong `src/duong-dan.ts` sang email chung nhóm | Hưng | P0 | Sửa hằng số email tiếp nhận phản hồi lỗi từ người dùng |
| 13 | Kiểm tra bundle size chunk `chuan-hoa` (~980KB) | Dũng | P1 | Tách lazy-load danh mục dữ liệu trường để giảm tải lần đầu |
| 14 | Xác minh 924 chương trình chỉ có điểm "2026" từ trang tổng hợp | Dũng | P0 | Rà soát và cập nhật nhãn nguồn trong `docs/DU-LIEU.md` |
| 15 | Kết nối giao diện người dùng với CMS Backend thật trên Cloudflare | Cả nhóm | P1 | Tạo D1 instance trên Cloudflare, áp migration `0001_cong_dong.sql` và cấu hình Pages Access |
| 16 | Mở rộng tổ hợp mục tiêu sang C00, D07, D14, X70 | Kiệt | P1 | Bổ sung các môn KHXH vào ma trận tổ hợp và phân tích Gap điểm |
| 17 | Rate-limit thật cho `/api/tu-van` trên Cloudflare Workers | Tuấn / Hưng | P0 | Bật binding `RATE_KV` và WAF rule chống spam |
| 18 | Rà soát visual responsive 360px - 390px trên thiết bị thật | Cả nhóm | P0 | Dùng `agent-browser` hoặc DevTools kiểm tra độ tràn viền |


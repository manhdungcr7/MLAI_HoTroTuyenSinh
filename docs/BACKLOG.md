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

## 📌 Issue #01: Đặt mục tiêu sớm cho học sinh "đã có trường mơ ước"
- 👤 **Phụ trách (Owner):** Tuấn (`khoi-dau`) & Kiệt (`muc-tieu`)
- ✅ **Trạng thái:** `Đóng — giải quyết theo hướng khác (2026-10-11)`
- 🏷️ **Nhãn:** `enhancement`, `khoi-dau`, `muc-tieu`

### 1. Bối cảnh
- Bản đầu có mục **"Mục tiêu hiện tại"** ở Bước 1 với lựa chọn `Đã có trường mơ ước` và ô gõ tự do `HoSo.truongMoUoc`, nhưng không logic nào đọc hai trường này.

### 2. Đã xử lý
- Bỏ mục "Mục tiêu hiện tại" và ô trường mơ ước khỏi Bước 1; **đã xóa** `mucTieuHienTai`, `truongMoUoc` khỏi kiểu `HoSo` (`src/state/types.ts`). Dữ liệu cũ còn hai trường này vẫn đọc được, `chuanHoa` tự bỏ (test ở `tests/do-ben-du-lieu.test.ts`).
- Nhu cầu "đặt mục tiêu sớm" được đáp ứng bằng 3 lối có dữ liệu thật (thay cho ô gõ tự do không so được với điểm chuẩn):
  - Trang ngành (`kham-pha/chi-tiet.tsx`) → **Đặt mục tiêu**.
  - So sánh (`kham-pha/so-sanh.tsx`) → **Chọn mục tiêu**.
  - Hôm nay / Mục tiêu khi chưa có mục tiêu → lấy **NV1** (`chonNguyenVongLamMucTieu` ở `state/chon.ts`).
- Ngay sau khi tạo hồ sơ, màn kết quả cho thấy số ngành trong tầm điểm của từng nhóm ngành em chọn (`khoi-dau/man-hinh-phan-tich.tsx`).

### 3. Có thể làm tiếp (nếu nhóm thấy cần)
- Ô tìm trường/ngành **chọn từ danh mục thật** ở Bước 1, chọn xong gọi `datMucTieu(mucTieuTuLuaChon(lc))` (chỉ khi `coTheDatMucTieu(lc).ok`).

---

## 📌 Issue #02: Phân định rạch ròi giữa Form trắng và Dữ liệu mẫu (Sample Persona)
- 👤 **Phụ trách (Owner):** Tuấn (`khoi-dau`, `hanh-trinh`)
- ✅ **Trạng thái:** `Đã xử lý cốt lõi` / ⏳ `Đổi qua lại hồ sơ thật ↔ hồ sơ mẫu (Backlog)`
- 🏷️ **Nhãn:** `state-management`, `ux`, `data-integrity`

### 1. Bối cảnh & Vấn đề
- Trước đây khi bấm "Bắt đầu ngay" từ màn hình Chào mừng, nếu trước đó học sinh đã từng nhấn "Xem hồ sơ mẫu", state lưu trữ trên máy (`localStorage`) vẫn giữ tên "Nguyễn Minh Anh" cùng các điểm thi mẫu.

### 2. Đã xử lý
- ✅ Tách "Bắt đầu ngay" (`lamLai()`, xóa mọi khóa `nvai:*`) và "Xem hồ sơ mẫu" (`dungHoSoMau()`); cả hai hỏi lại bằng `HopTruot` trước khi xóa/ghi đè dữ liệu đang có.
- ✅ Cờ `HoSo.laMau` đánh dấu hồ sơ mẫu; Hồ sơ hiện nhãn "Hồ sơ mẫu, không phải người thật"; màn Chào nhận diện hồ sơ mẫu bằng cờ này (không so tên nữa).
- ✅ Cài đặt có **Dùng hồ sơ mẫu**, **Xóa hết và làm lại**, **Tải bản sao lưu**, **Khôi phục từ tệp sao lưu**.

### 3. Còn lại
- ⏳ Chuyển qua lại giữa hồ sơ thật và hồ sơ mẫu mà **không mất** hồ sơ thật (hiện phải tự tải bản sao lưu trước khi dùng hồ sơ mẫu).

---

## 📌 Issue #03: Điểm ưu tiên khu vực (KV1, KV2-NT, KV2, KV3) & Đối tượng
- 👤 **Phụ trách (Owner):** Tuấn (`khoi-dau`) & Kiệt (`thu-tinh-huong`)
- ✅ **Trạng thái:** `Đã làm phần tính toán` / ⏳ `Tự map tỉnh → khu vực (Backlog)`
- 🏷️ **Nhãn:** `engine`, `tuyen-sinh`, `tinh-toan`

### 1. Đã làm
- Khai báo ở Bước 2, khối gập "Điểm ưu tiên khu vực, đối tượng" (`khoi-dau/diem-uu-tien.tsx`) → `HoSo.uuTienTuyenSinh`.
- Mức theo quy chế: KV1 +0,75 · KV2-NT +0,5 · KV2 +0,25 · KV3 0 · UT1 +2 · UT2 +1; từ 22,5 điểm giảm dần theo `[(30 − tổng) / 7,5] × mức` (`engine/diem-uu-tien.ts`, test `tests/diem-uu-tien.test.ts`).
- Đi vào mọi phép so với điểm chuẩn (`tongChoLuaChon`), phần "còn thiếu" của Mục tiêu (`mucTieuTho`), dòng "tổ hợp cao nhất khi tính đủ" ở Bước 2 và màn kết quả sau khi tạo hồ sơ.

### 2. Còn lại
- ⏳ Tự gợi ý khu vực từ Tỉnh/Huyện (cần danh sách xã theo khu vực của Bộ GD&ĐT; hồ sơ hiện chỉ có tỉnh nên chưa map chính xác được).
- ⏳ Đối chiếu lại mức cộng mỗi mùa tuyển sinh.

---

## 📌 Issue #04: Cảnh báo sớm độ lệch môn thi và tổ hợp xét tuyển
- 👤 **Phụ trách (Owner):** Kiệt (`muc-tieu`) & Hưng (`tu-hoc`)
- ✅ **Trạng thái:** `Đã hoàn thành (2026-10-16)`
- 🏷️ **Nhãn:** `smart-advice`, `tu-hoc`, `ai-insight`, `engine`

### 1. Bối cảnh & Vấn đề
- Khi học sinh nhập điểm các môn ở Bước 2, hệ thống cần lập tức tính toán ra điểm của các tổ hợp phổ biến (A00, A01, B00, C00, D01, D07...) và chỉ ra môn nào đang là "điểm nghẽn" (bottleneck) kéo tụt điểm xét tuyển.

### 2. Đã xử lý
- ✅ Hàm thuần `phanTichDiemNghen` trong `src/engine/phan-tich.ts` phân tích tự động độ lệch điểm của môn thấp nhất so với trung bình các môn còn lại trong tổ hợp cao nhất.
- ✅ Hiển thị gợi ý thông minh bứt phá điểm số ngay tại Bước 2 (`khoi-dau/buoc-2.tsx`) khi đang nhập điểm.
- ✅ Hiển thị khuyến nghị kéo điểm nghẽn tại màn hình kết quả ngay sau khi tạo hồ sơ (`khoi-dau/man-hinh-phan-tich.tsx`).
- ✅ Bộ kiểm thử toàn diện `tests/diem-nghen.test.ts` (100% pass, đã tích hợp vào cổng `npm test`).

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
| 11 | Ảnh `public/og.png` 1200x630 và icon PNG 192/512 + apple-touch-icon | Thiết kế | P0 | ✅ **Đã hoàn thành**: Đã tạo trọn bộ ảnh nhận diện thương hiệu độ phân giải cao và PWA icons |
| 12 | Đổi `EMAIL_BAO_SAI` trong `src/duong-dan.ts` sang email chung nhóm | Hưng | P0 | ⚠️ **Chưa xong** (kiểm 12/10): `src/duong-dan.ts` vẫn là email cá nhân `daomanhdungtvt@…`; cần một email chung của nhóm rồi đổi một dòng |
| 13 | Kiểm tra bundle size chunk `chuan-hoa` (~980KB) | Dũng | P1 | Tách lazy-load danh mục dữ liệu trường để giảm tải lần đầu |
| 14 | Xác minh điểm "2026" (đếm lại 12/10: 1.716 chương trình có điểm 2026, phần lớn từ trang tổng hợp); đồng thời sửa câu "Điểm chuẩn năm nay chưa công bố" ở `ve-du-lieu.tsx` cho khớp | Dũng | P0 | Rà soát và cập nhật nhãn nguồn trong `docs/DU-LIEU.md` |
| 15 | Kết nối giao diện người dùng với CMS Backend thật trên Cloudflare | Cả nhóm | P1 | Tạo D1 instance trên Cloudflare, áp migration `0001_cong_dong.sql` và cấu hình Pages Access |
| 16 | Mở rộng tổ hợp mục tiêu sang C00, D07, D14, X70 | Kiệt | P1 | Bổ sung các môn KHXH vào ma trận tổ hợp và phân tích Gap điểm |
| 17 | Rate-limit thật cho `/api/tu-van` trên Cloudflare Workers | Tuấn / Hưng | P0 | **Một phần:** API đã từ chối gọi mô hình khi thiếu KV hoặc KV lỗi; cần tạo/gắn namespace `RATE_KV` trên Cloudflare và bật WAF rule để hoàn tất vận hành. |
| 18 | Rà soát visual responsive 360px - 390px trên thiết bị thật | Cả nhóm | P0 | Dùng `agent-browser` hoặc DevTools kiểm tra độ tràn viền |
| 19 | [Audit P0] Sửa `useLuuCucBo` hỏng kiểu Array/Primitive | Core Engine | P0 | Ngăn spread object làm vỡ cấu trúc Array thành Object |
| 20 | [Audit P0] Sửa bẫy điều hướng khi để trống Họ Tên trong Hôm nay & Hồ sơ | Tuấn | P0 | Kiểm tra dữ liệu thực chất thay vì bắt buộc có họ tên |
| 21 | [Audit P0] Thay thế so sánh tên cố định bằng cờ `laMau` trong Store | Tuấn | P0 | Phân định dứt điểm hồ sơ mẫu và hồ sơ thật bằng cờ boolean |
| 22 | [Audit P0] Xóa `alert()` và lỗi chữ Hán trên Landing Page | Tuấn / Landing | P0 | Thay alert bằng inline message; sửa `đề案` thành `đề án` |
| 23 | [Audit P1] Sửa các lỗi tính toán, fallback dinhDang, timeout hook và hoàn tác | Cả nhóm | P1 | Tinh chỉnh dinhDang phòng thủ, snapshot hoàn tác NV, fix ngưỡng nhãn 0.25đ |


## Audit bàn giao hệ thống — 2026-10-15

- **Đã xử lý trong nhánh audit:** lỗi cấu hình Pages/local API, hardening xác thực CMS và rate limit, giới hạn request body, luồng hộp thư đăng ký sớm/cấp CTV, modal truy cập bàn phím và xác nhận thao tác ghi đè/xóa.
- **Đã xác minh:** build app/CMS; tích hợp 30 request qua Pages local + D1/KV; luồng browser chính và responsive 360/390/1440; production GET-only cho app, CMS, manifest và xác thực CMS.
- **Cần làm trước khi tuyên bố production-ready:** chạy lại `npm test` + `npm run kiem-tra` trên máy/CI ổn định (lượt xác nhận cuối bị Node 24 dừng trước test với `uv_os_get_passwd ENOMEM`); kiểm tra secrets/bindings/migrations/email/AI trên Cloudflare; thử tải, backup/restore và thiết bị thật.
- **Theo dõi:** tách chunk `chuan-hoa` (1.55 MB), xác nhận nguồn và độ mới dữ liệu tuyển sinh, thay email cá nhân bằng email chung nhóm.
- Chi tiết: `docs/BAO-CAO-KIEM-THU-BAN-GIAO-2026-10-15.md`.

---

## 🚀 SPRINT 4 GIỜ — MLAI HACKATHON 2026 (4 ISSUES GITHUB ĐÃ TẠO)

| Issue | Tiêu đề & Trọng tâm | Người phụ trách | Tiêu chí MLAI | Link GitHub |
|---|---|---|---|---|
| **#12** | **[Tuấn] Hoàn thiện luồng nhập hồ sơ học sinh, Form trắng & Bảo mật Local-First 100%** | Tuấn (`khoi-dau`, `hanh-trinh`) | UX/UI (25%) & Privacy-by-Design | [#12](https://github.com/manhdungcr7/MLAI_HoTroTuyenSinh/issues/12) |
| **#13** | **[Dũng] Chu trình Grounded AI 3 bước, 5 rào chắn an toàn & Thẻ hành động có xác nhận** | Dũng (`kham-pha`, `tu-van`) | AI Reliability & Hallucination Prevention (30%) | [#13](https://github.com/manhdungcr7/MLAI_HoTroTuyenSinh/issues/13) |
| **#14** | **[Kiệt] Động cơ chẩn đoán danh mục, bắt lỗi ngược vị thế/dồn rủi ro & Dữ liệu Backtesting** | Kiệt (`nguyen-vong`, `thu-tinh-huong`) | Algorithmic Rigor & Innovation (25%) | ✅ **Đã hoàn thành**: Phân loại 4 nhóm vị thế, bắt 2 lỗi chiến lược tuyển sinh, công khai Backtesting 3 năm, test xanh 100% ([#14](https://github.com/manhdungcr7/MLAI_HoTroTuyenSinh/issues/14)) |
| **#15** | **[Hưng] Minh bạch nguồn dữ liệu 3 tầng, phân định mã tuyển sinh & Đồng bộ lịch Google Calendar/.ICS** | Hưng (`ke-hoach`, `tu-hoc`, `cms`) | Completeness & Data Provenance (20%) | [#15](https://github.com/manhdungcr7/MLAI_HoTroTuyenSinh/issues/15) |


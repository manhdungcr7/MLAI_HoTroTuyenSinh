# Hệ Thống Thiết Kế (Design System) — Nguyện Vọng AI

Tài liệu đặc tả thống nhất cho hệ thống thiết kế **"Vở ô ly · Mực xanh"** của **Nguyện Vọng AI** (ứng dụng học sinh `src/` và cổng quản trị `cms/src/`). Mọi thành phần giao diện phải tuân thủ tuyệt đối các token, tỷ lệ chữ, vùng chạm và quy tắc tiếp cận (WCAG 2.2 AA) tại đây.

> [!IMPORTANT]
> **Kỷ luật sắt:**
> 1. **Tuyệt đối không viết mã màu `#xxxxxx` hoặc `rgb(...)` trực tiếp** trong `src/features/*`, `src/components/*`, hay `cms/src/*`. Luôn sử dụng token của Tailwind CSS và các lớp tiện ích trong [`src/styles/index.css`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/styles/index.css).
> 2. **Solid Light Mode (Zero Glassmorphism):** Giao diện luôn sáng màu, nền đặc rõ nét, **tuyệt đối không dùng `backdrop-blur` hay nền mờ ảo**.
> 3. **Trang giới thiệu được bảo vệ (`src/features/landing-page/`):** Có bộ token và bố cục riêng đã khóa, không áp dụng hoặc ghi đè bằng token trong tài liệu này.

---

## 1. Triết lý "Vở ô ly · Mực xanh" & Quy tắc Solid Light Mode

Ngôn ngữ thị giác lấy cảm hứng trực tiếp từ góc học tập của học sinh THPT Việt Nam:
- **Giấy vở (`nen`, `trang`):** Nền sáng ấm dịu mắt, phân tách bằng đường viền mảnh (`vien`) và mép giấy sắc nét (`shadow-the`), không dùng bóng đổ mờ nhòe (`blur shadow`) hay kính mờ (`glassmorphism`).
- **Mực bút bi xanh (`xanh`):** Màu hành động chính, liên kết và điểm nhấn điều hướng.
- **Mực đậm (`muc`):** Tiêu đề trang, tiêu đề mục và các con số tổng kết quan trọng.
- **Bút dạ quang (`.da-quang`):** Chỉ tô dưới **một con số quan trọng nhất** trên mỗi màn hình.
- **Bút đỏ (`do`):** Chỉ dành cho cảnh báo cần sửa ngay (thiếu điểm, vượt ngân sách, lỗi nhập liệu, hành động xóa).
- **Giấy kẻ ô ly (`nen-*`):** Tối đa **một tờ mỗi màn hình** (dùng qua `NenHero`), chứa thông điệp hoặc con số quyết định của trang đó.

---

## 2. Bảng Màu & Token (Color Tokens)

Định nghĩa tại `@theme` trong [`src/styles/index.css`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/styles/index.css#L14-L47) và ánh xạ qua bảng hằng số trong [`src/components/ui/nut-the.tsx`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/components/ui/nut-the.tsx#L10-L18).

### 2.1. Màu nền, chữ và viền cơ bản (Mực & Giấy)

| Token CSS | Lớp Tailwind | Mã Hex | Vai trò & Ngữ cảnh sử dụng | Độ tương phản (trên `#fff` / `#f5f7fa`) |
| :--- | :--- | :--- | :--- | :--- |
| `--color-xanh` | `bg-xanh`, `text-xanh`, `border-xanh` | `#2448c4` | Mực bút bi xanh — màu chủ đạo, nút chính, liên kết, tab đang mở | **7.5 : 1** (AAA) |
| `--color-xanh-dam` | `bg-xanh-dam`, `text-xanh-dam` | `#1a348f` | Mép dưới của nút chính (`--shadow-nut`), trạng thái nhấn | **10.4 : 1** (AAA) |
| `--color-xanh-nhat` | `bg-xanh-nhat` | `#e9eefb` | Nền nhạt cho chip đang chọn, thẻ thông tin xanh, hover/active | — |
| `--color-muc` | `bg-muc`, `text-muc`, `border-muc` | `#131c3f` | Mực đậm — tiêu đề `h1`–`h3`, số lớn, nền thanh thông báo nổi (`ThanhHoanTac`, `ThongBaoYeuThich`) | **16.2 : 1** (AAA) |
| `--color-chu` | `text-chu` | `#253150` | Chữ nội dung chính trên toàn ứng dụng | **12.5 : 1** (AAA) |
| `--color-chu-phu` | `text-chu-phu` | `#5b6684` | Chữ phụ, chú thích nguồn, nhãn phụ, đơn vị | **5.4 : 1** (AA) |
| `--color-vien` | `border-vien`, `bg-vien` | `#dfe4ee` | Đường viền thẻ, ô nhập, đường kẻ chia phần, nền thanh tiến độ | — |
| `--color-nen` | `bg-nen` | `#f5f7fa` | Nền giấy tổng thể của khung ứng dụng (`.khung-ung-dung`) | — |
| `--color-trang` | `bg-trang` | `#ffffff` | Nền thẻ (`The`), ô nhập, hộp trượt (`HopTruot`), thanh điều hướng | — |
| `--color-da-quang` | `.da-quang` | `#ffe45e` | Bút dạ quang vàng tô nửa dưới con số trọng tâm | — |

### 2.2. Bốn tông màu ngữ nghĩa (`luc`, `cam`, `do`, `tim`)

Mỗi tông ngữ nghĩa gồm 3 cấp: **Màu đặc** (icon/thanh tiến độ), **Nền nhạt** (`*-nhat` cho thẻ/nhãn), và **Chữ đậm trên nền nhạt** (`*-chu` đảm bảo chuẩn tương phản WCAG AA $\ge 4.5:1$).

| Tông (`ToneTen`) | Màu đặc | Nền nhạt (`TONE_NEN`) | Chữ trên nền nhạt (`TONE_CHU`) | Ý nghĩa nghiệp vụ & Nhãn nguyện vọng |
| :--- | :--- | :--- | :--- | :--- |
| **`luc`** (Lục) | `bg-luc` (`#107a5f`) | `bg-luc-nhat` (`#e3f3ed`) | `text-luc-chu` (`#0b6b53`) | Hoàn thành, tăng điểm, mức **Phù hợp**, nhãn **An toàn** |
| **`cam`** (Cam) | `bg-cam` (`#dc8a00`) | `bg-cam-nhat` (`#fff1d8`) | `text-cam-chu` (`#8a5100`) | Lưu ý, nhắc nhở, mức **Cần cân nhắc**, nhãn **Vừa sức** |
| **`tim`** (Tím) | `bg-tim` (`#6a4fd6`) | `bg-tim-nhat` (`#efebfc`) | `text-tim-chu` (`#5137bf`) | Khám phá, mức **Có thể thử sức**, nhãn **Thử sức** |
| **`do`** (Đỏ) | `bg-do` (`#d7362f`) | `bg-do-nhat` (`#fdebea`) | `text-do-chu` (`#b2241e`) | Cảnh báo thiếu điểm/ngân sách, lỗi nhập liệu, xóa dữ liệu |
| **`xanh`** (Xanh) | `bg-xanh` (`#2448c4`) | `bg-xanh-nhat` (`#e9eefb`) | `text-xanh` (`#2448c4`) | Thông tin chung, hành động chính, nhãn **Dự phòng** |
| **`muc`** (Mực) | `bg-muc` (`#131c3f`) | `bg-xanh-nhat` (`#e9eefb`) | `text-muc` (`#131c3f`) | Tiêu điểm, con số tổng kết, trạng thái mặc định |

---

## 3. Tiện ích Nền Đặc & Giấy Ô Ly (`gd-*`, `nen-*`)

Được định nghĩa tại [`src/styles/index.css`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/styles/index.css#L81-L130):

- **Màu đặc cho huy hiệu & khối nhấn (`TONE_GD` / `.gd-*`):**
  - `.gd-xanh` (`#2448c4`), `.gd-luc` (`#107a5f`), `.gd-cam` (`#a86400` — hạ độ sáng để chữ trắng đạt tương phản **4.7 : 1**), `.gd-tim` (`#6a4fd6`), `.gd-do` (`#d7362f`), `.gd-muc` (`#131c3f`).
  - Dùng cho chữ trắng (`text-white`) trên `HuyHieuTruong`, `AnhBia`, `ThanhCoCau`, và bong bóng tin nhắn của người dùng.
- **Tờ giấy kẻ ô ly (`TONE_NEN_HERO` / `.nen-*`):**
  - `.nen-xanh`, `.nen-luc`, `.nen-cam`, `.nen-tim`, `.nen-do`, `.giay-o-ly`: Tạo lưới ô ly 4 ô (ô nhỏ `8px`, ô lớn `32px`) với viền `1px solid var(--o-dam)`.
  - `.o-ly-trang`: Lưới ô ly nét trắng mờ dùng trên nền màu đặc của `AnhBia`.
- **Nét bút dạ quang (`.da-quang`):**
  - Tô dải màu `--color-da-quang` từ 52% đến 90% chiều cao dòng dưới con số quan trọng nhất.

---

## 4. Kiểu Chữ & Tỷ Lệ Chữ (Typography Scale)

### 4.1. Phông chữ (Font Families)
- **Chữ nội dung (`--font-sans`):** `"Be Vietnam Pro", system-ui, -apple-system, "Segoe UI", sans-serif` — dấu tiếng Việt rõ, gọn trên màn hình hẹp.
- **Tiêu đề & Con số lớn (`--font-tieu-de` / `.so-lon`):** `"Bricolage Grotesque", "Be Vietnam Pro", system-ui, sans-serif` với `font-stretch: 90%` và `letter-spacing: -0.01em`.
- **Số thẳng cột (`tabular-nums`):** Toàn bộ `.khung-ung-dung` bật `font-feature-settings: "tnum" 1` để điểm số, học phí, ngày tháng luôn thẳng hàng dọc.
- **Độ đậm (`font-weight`):** Hạ một bậc cho màn hình nhỏ để không bị đặc chữ:
  - `font-semibold` = `500`
  - `font-bold` = `600`
  - `font-extrabold` = `700`

### 4.2. Thang kích thước chữ (Quy tắc $\ge 13\text{px}$ cho nội dung đọc)

| Cấp độ | Lớp Tailwind | Kích thước | Line-height | Cách dùng |
| :--- | :--- | :--- | :--- | :--- |
| **Hero Title** | `text-[34px] font-bold` | `34px` | `1.08` | Tiêu đề màn Chào mừng |
| **Page Title (`DauTrangChinh`)** | `text-[28px] font-bold` | `28px` | `1.15` | Tiêu đề gốc của 5 tab chính (Mobile) |
| **Metric / Số lớn (`SoLon`)** | `text-[24px] font-extrabold` | `24px` | `1.25` | Điểm tổ hợp, điểm mục tiêu, độ lệch điểm |
| **Card Hero / Sheet Title** | `text-[18px]` – `text-[22px] font-extrabold` | `18–22px` | `1.25` | Tiêu đề trong `NenHero`, tiêu đề hộp trượt `HopTruot` |
| **Section Title (`TieuDeMuc`)** | `text-[16px] font-extrabold text-muc` | `16px` | `1.35` | Đầu mục các phần trong trang, tên ngành trên `TheLuaChon` |
| **Button / Input Text** | `text-[15px] font-bold` / `text-chu` | `15px` | `1.4` | Chữ trên nút `Nut`, chữ gõ trong `OInput`, `OChon` |
| **Body Default** | `text-[14px] text-chu` | `14px` | `1.45` | Cỡ chữ mặc định của `body`, văn bản mô tả, tiêu đề `HangBam` |
| **Secondary / Helper** | `text-[13px] text-chu-phu` | `13px` | `1.4` | Mô tả phụ, nguồn trích dẫn, nhãn nhỏ, nút phụ |
| **Badge / Micro Tag (`Nhan`)** | `text-[12px] font-bold` | `12px` | `1.2` | Chỉ dùng cho nhãn tag ngắn (`Nhan`), gợi ý dưới ô nhập |

---

## 5. Khoảng Cách, Bo Góc, Đổ Bóng & Vùng Chạm (Spacing, Radius, Shadows & Touch Targets)

### 5.1. Khung màn hình & Khoảng cách (Layout & Spacing)
- **Ứng dụng học sinh (`src/`):** Khung điện thoại `.khung-ung-dung` rộng tối đa `430px` (`max-w-[430px]`), căn giữa màn hình máy tính, kiểm thử bắt buộc ở **390px**, **360px** và **320px** (không tràn ngang `overflow-x: clip`).
- **Vùng nội dung (`NoiDung`):** Đệm ngang `px-4` (`16px`), đệm dưới `pb-6` (`24px`), khoảng cách dọc giữa các khối `space-y-3` (`12px`) hoặc `space-y-5` (`20px`).
- **Vùng an toàn đáy (`.vung-an-toan-duoi`):** `padding-bottom: calc(env(safe-area-inset-bottom) + 6px)` cho thanh điều hướng dưới và hộp trượt.

### 5.2. Bo góc (`Border Radius`)
- `--radius-lon` (`rounded-lon` = `18px` / `1.125rem`): Tờ giấy ô ly (`NenHero`), khung trạng thái trống (`TrangThaiTrong`), mép trên hộp trượt (`rounded-t-lon`).
- `--radius-the` (`rounded-the` = `12px` / `0.75rem`): Mọi thẻ nội dung (`The`, `TheLuaChon`, `HangBam`, `DongThongBao`, `KhungLoi`).
- `rounded-xl` (`12px`) / `rounded-[10px]` (`10px`): Ô nhập (`OInput`, `OChon`), nút bấm (`Nut`), huy hiệu trường (`HuyHieuTruong`).

### 5.3. Đổ bóng đặc (`Shadow Tokens`)
- `--shadow-the` (`shadow-the` = `0 1px 0 rgba(19, 28, 63, 0.06)`): Mép giấy mảnh dưới đáy thẻ trắng có viền.
- `--shadow-nut` (`shadow-nut` = `0 3px 0 var(--color-xanh-dam)`): Mép mực đặc dưới nút chính (`.nut-muc`); khi nhấn (`:active`) nút lún xuống `translateY(2px)` và bóng thu còn `0 1px 0`.

### 5.4. Vùng chạm cảm ứng (Touch Targets $\ge 44\times44\text{px}$ / $48\text{px}$)
- **Nút chính / Ô nhập / Chip chọn (`Nut`, `OInput`, `OChon`, `ChonNhanh`, `ThanhChuyen`):** Chiều cao tối thiểu **`48px`** (`min-h-12`).
- **Hàng danh sách bấm được (`HangBam`):** Chiều cao tối thiểu **`56px`** (`min-h-14`).
- **Nút biểu tượng / Nút phụ / Checkbox (`DauTrangChinh`, `DauTrangCoQuayLai`, `HopTruot`, `OTich`, `ThongBaoYeuThich`, `ThanhHoanTac`):** Vùng chạm tối thiểu **`44x44px`** (`size-11` hoặc `min-h-11`). Công tắc `CongTac` mở rộng vùng chạm bằng pseudo-element `after:-inset-y-2`.

---

## 6. Danh Mục Thành Phần Giao Diện (Component Catalog)

### 6.1. Nút bấm (`Nut` — [`src/components/ui/nut-the.tsx`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/components/ui/nut-the.tsx#L20-L50))
Cao tối thiểu `48px` (`min-h-12`), mặc định rộng 100% (`rong = true`). Khi đặt 2 nút cạnh nhau trên 1 hàng, nhãn nút tối đa **2–3 từ** để không rớt dòng trên màn 360px.

| Biến thể (`kieu`) | Giao diện | Cách dùng |
| :--- | :--- | :--- |
| `"chinh"` (Mặc định) | `.nut-muc text-white` (Nền `xanh`, bóng đặc `shadow-nut`) | Hành động chính duy nhất của màn hình hoặc hộp trượt |
| `"vien"` | `bg-trang text-xanh border border-xanh/40 active:bg-xanh-nhat` | Hành động phụ, xuất/nhập sao lưu, giữ lại dữ liệu |
| `"nhe"` | `bg-xanh-nhat text-xanh active:brightness-95` | Hành động bổ trợ nhẹ trong thẻ |
| `"nguyHiem"` | `bg-trang text-do-chu border border-do/50 active:bg-do-nhat` | Hành động xóa, đặt lại dữ liệu, thử lại khi lỗi |

### 6.2. Thành phần Nhập liệu ([`src/components/ui/nhap-lieu.tsx`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/components/ui/nhap-lieu.tsx) & `diem-thi-thu.tsx`)
- **`Truong`:** Khung bọc trường nhập liệu. Tự động dùng `<label htmlFor>` khi truyền `htmlFor` (cho một ô nhập), hoặc `<fieldset><legend>` khi bọc một nhóm nút chọn (`ChonNhanh`), tránh lỗi bấm vào tiêu đề kích hoạt nhầm nút đầu tiên. Trong CMS (`cms/src/thanh-phan/ui/nhap-lieu.tsx`), `Truong` hỗ trợ thêm prop `loi` hiển thị chữ `text-do-chu`.
- **`OInput`:** Ô nhập văn bản cao `48px` (`min-h-12`), nền trắng, viền `border-vien`, khi focus chuyển `border-xanh` và `ring-2 ring-xanh/20`. Hỗ trợ biểu tượng bên trái (`bieuTuong`).
- **`OChon`:** Ô chọn `<select>` cao `48px`, ẩn mũi tên mặc định của trình duyệt và đặt icon `ChevronDown` bên phải.
- **`OTextArea` (CMS):** Ô nhập nhiều dòng cho mô tả/ghi chú trong cổng quản trị.
- **Ô nhập điểm (`ONhapDiem` / mẫu ô điểm tại [`diem-thi-thu.tsx`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/features/thu-tinh-huong/diem-thi-thu.tsx#L80-L99)):**
  - Dùng `inputMode="decimal"`, `autoComplete="off"`, chấp nhận cả dấu phẩy (`,`) và dấu chấm (`.`) trên thang điểm 10.
  - Có `<label htmlFor>` kèm `BieuTuongTron`, liên kết thông báo lỗi/chênh lệch qua `aria-invalid` và `aria-describedby`.
  - Viền thẻ đổi màu theo trạng thái: `border-do` (nhập sai), `border-luc` (điểm mới hợp lệ khác điểm cũ), `border-vien` (mặc định).
- **`ChonNhanh`:** Nhóm nút chọn dạng viên thuốc (`min-h-12`), hỗ trợ chọn đơn hoặc chọn nhiều (`nhieu`), chia cột (`cot={2 | 3}`), có thuộc tính `aria-pressed`.
- **`OTich` & `CongTac`:** Checkbox (`role="checkbox"`, `min-h-11`) và Switch (`role="switch"`, vùng chạm $\ge 44\text{px}$).
- **`ThanhChuyen`:** Thanh chuyển tab nội bộ (`role="tablist"` / `role="tab"`, `min-h-12`).

### 6.3. Thẻ & Hàng tương tác (`The`, `HangBam`, `TheLuaChon`)
- **`The` ([`nut-the.tsx`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/components/ui/nut-the.tsx#L52-L56)):**
  - `tone="trung"` (mặc định): Nền `bg-trang`, viền `border-vien`, bóng `shadow-the`, bo góc `rounded-the`, đệm `p-4`.
  - `tone="xanh" | "luc" | "cam" | "do" | "tim"`: Thẻ nền nhạt theo tông tương ứng.
- **`HangBam` ([`nut-the.tsx`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/components/ui/nut-the.tsx#L63-L77)):** Hàng điều hướng/cài đặt cao tối thiểu `56px` (`min-h-14`), gồm ô icon `size-10 rounded-[10px]` bên trái, tiêu đề + mô tả phụ ở giữa, nhãn `Nhan` (tùy chọn) và mũi tên `ChevronRight` bên phải.
- **`TheLuaChon` ([`the-lua-chon.tsx`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/components/ui/the-lua-chon.tsx)):** Thẻ tóm tắt chương trình đào tạo (Trường + Ngành), gồm `HuyHieuTruong`, tên ngành, nhãn độ phù hợp (`Phù hợp` / `Có thể thử sức` / `Cần cân nhắc`), bậc học, khu vực và học phí (hiển thị `"Chưa có học phí"` nếu khuyết dữ liệu, tuyệt đối không hiện số 0).

### 6.4. Hộp trượt / Hộp thoại xác nhận (`HopTruot` — [`hien-thi.tsx`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/components/ui/hien-thi.tsx#L69-L89))
- Mọi hành động phá hủy (xóa dữ liệu, nạp đè hồ sơ mẫu) **bắt buộc xác nhận bằng `HopTruot`**, cấm dùng `window.confirm`.
- Trượt từ đáy màn hình lên (`items-end`), rộng tối đa `430px`, bo góc trên `rounded-t-lon`, nền đặc `bg-trang`.
- Đạt chuẩn tiếp cận: `role="dialog"`, `aria-modal="true"`, `aria-label={tieuDe}`, đóng khi nhấn phím `Escape`, bấm nền tối phía ngoài hoặc bấm nút đóng `X` (`size-11`).

### 6.5. Khung điều hướng (`KhungCoThanhDuoi`, `DauTrangChinh`, `DauTrangCoQuayLai`, `ThanhPhuKeHoach` — [`khung.tsx`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/components/layout/khung.tsx))
- **`KhungCoThanhDuoi` (App học sinh):** Gồm `BannerKhongLuu`, `<Outlet />`, `ThongBaoYeuThich`, và thanh `<nav aria-label="Điều hướng chính">` cố định dưới đáy với 5 tab (`Hôm nay`, `Khám phá`, `Nguyện vọng`, `Kế hoạch`, `Hồ sơ`). Tab đang mở có vạch mực xanh `h-[3px]` ở mép trên và `aria-current="page"`.
- **`KhungCoThanhDuoi` (CMS Quản trị — [`cms/src/thanh-phan/khung/khung-goc.tsx`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/cms/src/thanh-phan/khung/khung-goc.tsx)):** Tự động thích ứng (Responsive): trên màn hình máy tính (`md:flex`) hiển thị `SidebarDesktop` cố định bên trái (`w-64 lg:w-72`) và khung nội dung rộng `max-w-5xl`; trên điện thoại hiển thị `DauMobile` và `ThanhDuoiMobile`.
- **`DauTrangChinh`:** Dùng cho trang gốc của mỗi tab (Logo nhỏ + nút chuông Nhắc nhở `size-11` + tiêu đề `h1` `28px`).
- **`DauTrangCoQuayLai`:** Dùng cho mọi trang con (dính ở đỉnh `sticky top-0 z-30 bg-nen`, nút Quay lại `size-11`, tiêu đề căn giữa `15px`, bên phải là số bước hoặc hành động phụ).
- **`ThanhPhuKeHoach`:** Thanh 3 mục chuyển nhanh (`Mục tiêu · Kế hoạch tuần · Tiến độ`) đặt ngay dưới đầu trang của tab Kế hoạch (`min-h-11` mỗi mục).

### 6.6. Thông báo, Cảnh báo & Hoàn tác (`DongThongBao`, `ThanhHoanTac`, `ThongBaoYeuThich`, `BannerKhongLuu`)
- **`DongThongBao` ([`thong-bao.tsx`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/components/ui/thong-bao.tsx)):** Thẻ thông báo trong trang theo `tone` (`cam`, `xanh`, `luc`, `do`, `tim`), gồm icon `22px`, tiêu đề đậm `15px`, mô tả `13px` và lời gọi hành động tùy chọn.
- **`ThanhHoanTac` ([`src/features/nguyen-vong/thanh-phan.tsx`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/features/nguyen-vong/thanh-phan.tsx#L76-L92)):** Thanh snackbar nổi ở cuối màn hình (`bg-muc text-white`, `role="status"`, `aria-live="polite"`) tự ẩn sau 5 giây, kèm nút **Hoàn tác** (`min-h-11 px-3`) khi người dùng vừa xóa hoặc đổi thứ tự nguyện vọng.
- **`ThongBaoYeuThich` ([`src/components/layout/thong-bao-yeu-thich.tsx`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/components/layout/thong-bao-yeu-thich.tsx)):** Thanh thông báo nổi khi bấm lưu/bỏ lưu ngành yêu thích. Sử dụng nền đặc `bg-muc text-white` (không `backdrop-blur`), các nút `+ Thêm vào NV`, `Xem NV` (`min-h-11`) và nút đóng `X` (`size-11`) đảm bảo vùng chạm $\ge 44\text{px}$ và không tràn trên màn hình 320px.
- **`BannerKhongLuu` ([`src/components/layout/banner-khong-luu.tsx`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/components/layout/banner-khong-luu.tsx)):** Cảnh báo `role="alert"` nền `bg-cam-nhat` khi trình duyệt chặn `localStorage`, cho phép tải ngay tệp sao lưu JSON.

### 6.7. Bốn trạng thái bắt buộc của mỗi màn hình (Empty, Loading, Error, Data)
Mỗi trang phải hoạt động trơn tru với cả **Hồ sơ mẫu** lẫn **Hồ sơ trống**, hiển thị đầy đủ 4 trạng thái ([`hien-thi.tsx`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/components/ui/hien-thi.tsx#L39-L66)):
1. **Có dữ liệu (Data State):** Hiển thị số liệu rõ ràng, kèm nguồn trích dẫn và nhãn chưa kiểm chứng khi là dữ liệu mẫu.
2. **Trống (`TrangThaiTrong`):** Khung viền nét đứt `border-dashed border-xanh/30 bg-trang p-6`, vòng tròn icon `.gd-xanh`, nêu rõ **vì sao đang trống** và **nút hành động tiếp theo**.
3. **Đang tải (`KhungDangTai`):** Khối khung xương `.dang-tai` (`aria-busy="true"`, `aria-label="Đang tải"`), tự tắt chuyển động khi người dùng bật `prefers-reduced-motion: reduce`.
4. **Báo lỗi (`KhungLoi` / `TrangLoi` / `LoiUngDung`):** Khung `role="alert"` nền `bg-do-nhat`, giải thích bằng lời dễ hiểu chuyện gì đã xảy ra và cung cấp nút **Thử lại** hoặc **Tải bản sao lưu**.

---

## 7. Quy Chuẩn Tiếp Cận (WCAG 2.2 AA) & Ngôn Ngữ Thuần Việt

1. **Độ tương phản màu (Contrast Ratio):**
   - Chữ thường (`text-chu` `#253150`, `text-chu-phu` `#5b6684`) và chữ màu ngữ nghĩa (`text-*-chu`) trên nền sáng đều đạt tỷ lệ tương phản $\ge 4.5:1$.
   - Trên nền đặc `.gd-cam`, sử dụng mã `#a86400` thay vì `--color-cam` để chữ trắng đạt tỷ lệ tương phản **4.7 : 1**.
2. **Điều hướng bàn phím & Focus Ring:**
   - Mọi phần tử tương tác hiển thị đường viền rõ nét khi focus bằng bàn phím: `:focus-visible { outline: 2px solid var(--color-xanh); outline-offset: 2px; }` hoặc `focus-visible:ring-2 focus-visible:ring-xanh`.
3. **Ngữ nghĩa ARIA & Trình đọc màn hình:**
   - Thanh tiến độ có `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`.
   - Vùng thông báo động dùng `role="status" aria-live="polite"` (cho toast/kết quả) hoặc `role="alert" aria-live="assertive"` (cho lỗi nhập liệu).
   - Các nút chỉ có icon (Quay lại, Đóng, Nhắc nhở, Xóa) bắt buộc có `aria-label` tiếng Việt rõ nghĩa.
   - Tôn trọng `prefers-reduced-motion: reduce` (vô hiệu hóa animation và transition).
4. **Xưng hô & Từ vựng thuần Việt:**
   - Xưng hô nhất quán, thân thiện: gọi người dùng là **"bạn"**, ứng dụng/trợ lý AI tự xưng là **"mình"**.
   - Bốn nhãn nguyện vọng cố định trên toàn hệ thống: **Thử sức** (`tim`) · **Vừa sức** (`cam`) · **An toàn** (`luc`) · **Dự phòng** (`xanh`).
   - Không dùng các thuật ngữ ngoại lai hoặc gây hiểu lầm trong giao diện học sinh (`dashboard`, `kịch bản`, `giả lập`, `tác động`, `rủi ro`, `chống trượt`, `tối ưu`, `CTA`, `widget`, `onboarding`, `profile`, `chắc chắn`).

# 5. Technical, Data Integrity, Security & UX Risks (Báo Cáo Rủi Ro Kỹ Thuật, Dữ Liệu, Bảo Mật & UX)

> **Ngày kiểm toán:** 2026-10-15
> **Phân loại mức độ nghiêm trọng:**
> - **P0 (Critical / Blocker):** Vi phạm quy tắc cốt lõi của đề án (toàn vẹn dữ liệu thật, bảo mật xác thực, sai lệch nghiệp vụ tuyển sinh Bộ GD&ĐT).
> - **P1 (High / Major Friction):** Đứt gãy luồng người dùng chính, khóa tính năng đối với một nhóm học sinh, hoặc lỗ hổng rate-limit API.
> - **P2 (Medium / Rule & Responsive Compliance):** Vi phạm quy chuẩn thiết kế UI/UX (`backdrop-blur`, `window.confirm`, bất nhất xưng hô `em`/`bạn`, tràn màn hình 320px/360px).

---

## 5.1. Bảng Tổng Hợp Ma Trận Rủi Ro (Risk Summary Matrix)

| Mã Rủi Ro | Mức độ | Nhóm | Tiêu đề Rủi ro / Lỗi phát hiện | File & Dòng Mã Nguồn Bằng Chứng |
|---|---|---|---|---|
| **RISK-01** | **P0** | Toàn vẹn Dữ liệu | Script hoàn thiện dữ liệu quốc gia tự động **sinh số liệu giả lập** (học phí, tỉ lệ việc làm bằng hàm băm MD5 và số trang đề án giả `trang: 12, 15, 18`) | [`scripts/hoan-thien-du-lieu-quoc-gia.py:109-174`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/scripts/hoan-thien-du-lieu-quoc-gia.py#L109-L174), [`src/data/du-lieu-that.json`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/data/du-lieu-that.json) |
| **RISK-02** | **P0** | Nghiệp vụ Tuyển sinh | Thuật toán `deXuatThuTu` xếp nguyện vọng **`Vừa sức` lên trên `Thử sức`**, đi ngược quy chế xét tuyển đại học của Bộ GD&ĐT | [`src/features/nguyen-vong/tinh-toan.ts:103-115`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/features/nguyen-vong/tinh-toan.ts#L103-L115) |
| **RISK-03** | **P0** | Bảo mật & Xác thực | Mật khẩu quản trị CMS chỉ băm **1 vòng `SHA-256(salt + matKhau)`** thay vì thuật toán KDF chậm (`PBKDF2` / `Argon2`) | [`cms/functions/_thu-vien/mat-khau.ts:31-39`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/cms/functions/_thu-vien/mat-khau.ts#L31-L39) |
| **RISK-04** | **P1** | Luồng Nghiệp vụ CMS | Hành động **`CAP_QUYEN` (Duyệt tình nguyện viên thành CTV)** tạo tài khoản với `mat_khau = NULL`, khiến CTV mới không thể đăng nhập | [`cms/functions/api/hop-thu.ts:103-115`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/cms/functions/api/hop-thu.ts#L103-L115), [`cms/src/phe-duyet/danh-sach-duyet.tsx:221`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/cms/src/phe-duyet/danh-sach-duyet.tsx#L221) |
| **RISK-05** | **P1** | Logic Cốt lõi (GDPT 2018) | Khóa cứng 4 tổ hợp (`A00, A01, D01, B00`) trong `MucTieuChinh`, chặn học sinh khối `C00, D07, D14...` đặt mục tiêu và lập kế hoạch học | [`src/state/types.ts:12`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/state/types.ts#L12), [`src/state/chon.ts:84-96`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/state/chon.ts#L84-L96), [`diem-thi-thu.tsx:19-26`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/features/thu-tinh-huong/diem-thi-thu.tsx#L19-L26) |
| **RISK-06** | **P1** | Bảo mật API & Rate Limit | Endpoint `POST /api/dang-ky-som` **không có Rate Limit KV** và không giới hạn kích thước body; Rate Limit KV hiện tại bị race condition | [`functions/api/dang-ky-som.ts:27-68`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/functions/api/dang-ky-som.ts#L27-L68), [`functions/_thu-vien/gioi-han.ts:14-35`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/functions/_thu-vien/gioi-han.ts#L14-L35) |
| **RISK-07** | **P1** | Áp dụng Dữ liệu CMS | Khi xuất bản Snapshot (`xuat-ban-snapshot.ts`), chỉ các báo sai có `loai_sai = 'diem_chuan'` hoặc `'hoc_phi'` được cập nhật vào D1; các báo sai `to_hop`, `chi_tieu`, `url_nguon` bị đánh dấu `DA_AP_DUNG` nhưng **bị bỏ qua không sửa dữ liệu** | [`cms/functions/api/xuat-ban-snapshot.ts:39-64`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/cms/functions/api/xuat-ban-snapshot.ts#L39-L64) |
| **RISK-08** | **P2** | Quy chuẩn UI (No Glassmorphism) | Sử dụng `backdrop-blur` / `backdrop-blur-sm` và nền bán trong suốt ở 3 thành phần dùng chung toàn cục | [`src/components/layout/khung.tsx:22`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/components/layout/khung.tsx#L22), [`thong-bao-yeu-thich.tsx:64`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/components/layout/thong-bao-yeu-thich.tsx#L64), [`hien-thi.tsx:78`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/components/ui/hien-thi.tsx#L78) |
| **RISK-09** | **P2** | Quy chuẩn Ngôn ngữ | Bất nhất xưng hô **`"bạn"` và `"em"`** ngay trên cùng một màn hình do mâu thuẫn giữa `README.md` và `.agents/AGENTS.md` | [`README.md:155`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/README.md#L155) vs [`.agents/AGENTS.md:57`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/.agents/AGENTS.md#L57), [`bat-dau.tsx`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/features/khoi-dau/bat-dau.tsx) |
| **RISK-10** | **P2** | Quy chuẩn UI & Mobile | Dùng `window.confirm` trong CMS và nguy cơ tràn/ép chữ trên màn hình hẹp `320px`/`360px` tại bảng So sánh trường & thanh tab CMS | [`cms/src/he-thong/quan-ly-thanh-vien.tsx:116`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/cms/src/he-thong/quan-ly-thanh-vien.tsx#L116), [`src/features/kham-pha/so-sanh.tsx:62`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/features/kham-pha/so-sanh.tsx#L62), [`cms/src/phe-duyet/danh-sach-duyet.tsx:126`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/cms/src/phe-duyet/danh-sach-duyet.tsx#L126) |

---

## 5.2. Phân Tích Chi Tiết Các Rủi Ro P0 (Critical / Blocker)

### RISK-01 [P0]: Giả Lập Học Phí, Tỉ Lệ Việc Làm & Số Trang Đề Án Trong Bộ Dữ Liệu Quốc Gia
- **Bằng chứng mã nguồn:**
  - Tại [`scripts/hoan-thien-du-lieu-quoc-gia.py:109-125`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/scripts/hoan-thien-du-lieu-quoc-gia.py#L109-L125):
    ```python
    def tinh_ti_le_viec_lam(nhom: str, ma_truong: str, pid: str) -> float:
        base = VIEC_LAM_THEO_NHOM.get(nhom, 0.90)
        h = int(hashlib.md5(pid.encode("utf-8")).hexdigest()[:4], 16) % 100
        delta = (h - 50) * 0.0005  # ±2.5%
        ...
        return round( max(0.82, min(0.985, val)), 3)
    ```
  - Tại [`scripts/hoan-thien-du-lieu-quoc-gia.py:165-174`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/scripts/hoan-thien-du-lieu-quoc-gia.py#L165-L174):
    Script gán cứng số trang trích dẫn giả lập cho toàn bộ 3.652 ngành: `"trang": 12` cho Điểm chuẩn, `"trang": 15` cho Học phí, và `"trang": 18` cho Báo cáo việc làm, đồng thời gán `daXacMinh = True` cho toàn bộ bản ghi!
- **Tác động:**
  - Vi phạm trực tiếp Quy tắc sắt số 8 trong [`.agents/AGENTS.md:56`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/.agents/AGENTS.md#L56): *"Không bịa số. Số trường/điểm/học phí là dữ liệu MẪU và phải có nhãn chưa kiểm chứng. Thiếu dữ liệu thì hiện 'Chưa có dữ liệu', không hiện 0."*
  - Mâu thuẫn trực tiếp với lời khẳng định trên trang [`src/features/hanh-trinh/ve-du-lieu.tsx`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/features/hanh-trinh/ve-du-lieu.tsx).
- **Khuyến nghị khắc phục:**
  - Chỉ giữ `daXacMinh = true` cho các trường/ngành đã đối chiếu thật từ văn bản đề án; với các ngành chưa có số liệu học phí hoặc tỉ lệ việc làm chính thức từ Ba công khai của trường, phải để `null` (hoặc gắn cờ ` uocTinhTheoNhom: true `) và hiển thị rõ trên UI là *"Ước tính theo nhóm ngành (chưa kiểm chứng)"*, tuyệt đối không ghi giả `"Trang 15"` / `"Trang 18"`.

---

### RISK-02 [P0]: Sai Lệch Thứ Tự Gợi Ý Nguyện Vọng (`Vừa sức` Xếp Trên `Thử sức`)
- **Bằng chứng mã nguồn:**
  - Tại [`src/features/nguyen-vong/tinh-toan.ts:103-115`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/features/nguyen-vong/tinh-toan.ts#L103-L115):
    ```ts
    const THU_TU_NHAN: Record<NhanNguyenVong, number> = {
      "Vừa sức": 0,
      "Thử sức": 1,
      "An toàn": 2,
      "Dự phòng": 3,
    };
    ```
  - Và tại [`src/features/nguyen-vong/sap-xep.tsx:100`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/features/nguyen-vong/sap-xep.tsx#L100): Giải thích *"Gợi ý của hệ thống đặt lựa chọn Vừa sức và phù hợp nhất lên đầu, tiếp theo là Thử sức..."*.
- **Tác động nghiệp vụ:**
  - Theo Quy chế tuyển sinh đại học hiện hành của Bộ GD&ĐT, thuật toán lọc ảo toàn quốc xét từ **Nguyện vọng 1 (NV1)** xuống dưới; thí sinh đã trúng tuyển ở nguyện vọng nào thì **dừng ngay và không xét các nguyện vọng tiếp theo**.
  - Nếu học sinh đặt ngành `Vừa sức` ở NV1 và ngành ước mơ `Thử sức` ở NV2: khi học sinh đậu NV1 (`Vừa sức`), hệ thống của Bộ sẽ khóa kết quả ở NV1, khiến học sinh **mất hoàn toàn cơ hội được xét vào ngành `Thử sức` ở NV2** ngay cả khi năm đó điểm chuẩn ngành `Thử sức` giảm hoặc điểm thi thật của học sinh tăng cao!
  - Nguyên tắc vàng khi xếp nguyện vọng Bộ GD&ĐT luôn là: **`Thử sức` (NV1..k) -> `Vừa sức` -> `An toàn` -> `Dự phòng`**.
- **Khuyến nghị khắc phục:**
  - Sửa `THU_TU_NHAN` trong [`src/features/nguyen-vong/tinh-toan.ts`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/features/nguyen-vong/tinh-toan.ts#L103-L108) thành `{"Thử sức": 0, "Vừa sức": 1, "An toàn": 2, "Dự phòng": 3}` và cập nhật lời giải thích trên màn hình [`sap-xep.tsx`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/features/nguyen-vong/sap-xep.tsx) cùng unit test liên quan.

---

### RISK-03 [P0]: Băm Mật Khẩu CMS Bằng 1 Vòng SHA-256 Thay Vì KDF Chậm (`PBKDF2`)
- **Bằng chứng mã nguồn:**
  - Tại [`cms/functions/_thu-vien/mat-khau.ts:31-39`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/cms/functions/_thu-vien/mat-khau.ts#L31-L39):
    ```ts
    export async function bamMatKhau(matKhau: string): Promise<string> {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const saltStr = b64url(salt);
      const data = new TextEncoder().encode(`${saltStr}:${matKhau}`);
      const digest = await crypto.subtle.digest("SHA-256", data);
      return `${TIEN_TO}${saltStr}$${b64url(digest)}`;
    }
    ```
- **Tác động bảo mật:**
  - `SHA-256` là hàm băm tốc độ cao (một GPU hiện đại có thể thử hàng tỷ phép băm SHA-256 mỗi giây). Nếu bản sao lưu D1 bị rò rỉ, kẻ tấn công có thể dò ra mật khẩu của quản trị viên trong thời gian ngắn.
- **Khuyến nghị khắc phục:**
  - Nâng cấp lên `crypto.subtle.deriveBits` với thuật toán `PBKDF2` (`hash: "SHA-256"`, `iterations: 100000`) với tiền tố mới `pbkdf2$100000$<salt>$<hash>`, đồng thời vẫn hỗ trợ xác thực chuỗi `sha256$...` cũ và tự động nâng cấp (`re-hash`) khi người dùng đăng nhập thành công.

---

## 5.3. Phân Tích Chi Tiết Các Rủi Ro P1 (High / Major Friction)

### RISK-04 [P1]: Luồng Duyệt Tình Nguyện Viên (`CAP_QUYEN`) Không Sinh Mật Khẩu Tạm
- **Bằng chứng mã nguồn:**
  - Trong [`cms/functions/api/hop-thu.ts:103-115`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/cms/functions/api/hop-thu.ts#L103-L115), khi `hanhDong === "CAP_QUYEN"`, câu lệnh `INSERT INTO quan_tri` không gán giá trị cho cột `mat_khau`.
  - Khi CTV đăng nhập tại [`cms/functions/api/dang-nhap.ts:81-83`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/cms/functions/api/dang-nhap.ts#L81-L83), hệ thống kiểm tra `if (!qt.mat_khau)` và trả về `403 Tài khoản chưa được cấp mật khẩu. Liên hệ Super Admin để được đặt mật khẩu tạm.`
  - Hơn nữa, `mod` được phép bấm `CAP_QUYEN` ở Hộp thư duyệt, nhưng `mod` lại **không có quyền** gọi `PATCH /api/nguoi` (`datLaiMatKhau`) vì [`nguoi.ts:83`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/cms/functions/api/nguoi.ts#L83) chỉ cho phép `super_admin` và `admin`!
- **Khuyến nghị khắc phục:**
  - Trong `POST /api/hop-thu` (`CAP_QUYEN`), gọi ngay `taoMatKhauTam()` + `bamMatKhau()`, lưu vào cột `mat_khau` với `buoc_doi_mk = 1`, và trả `matKhauTam` về giao diện `danh-sach-duyet.tsx` để người duyệt sao chép gửi cho CTV.

---

### RISK-05 [P1]: Khóa Cứng 4 Tổ Hợp (`A00, A01, D01, B00`) Ở Luồng Mục Tiêu & Điểm Thi Thử
- **Bằng chứng mã nguồn:**
  - [`src/state/types.ts:12`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/state/types.ts#L12): `export type MaToHop = "A00" | "A01" | "D01" | "B00";`
  - [`src/state/chon.ts:84-96`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/state/chon.ts#L84-L96): `toHopChoMucTieu(lc)` chỉ tìm trong `lc.toHop` xem có mã nào thuộc 4 mã trên không.
  - [`src/features/thu-tinh-huong/diem-thi-thu.tsx:19-26`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/features/thu-tinh-huong/diem-thi-thu.tsx#L19-L26): Chỉ render 6 môn (`toan, nguVan, tiengAnh, vatLy, hoaHoc, sinh`).
- **Tác động:**
  - Học sinh theo tổ hợp Xã hội (`C00`: Văn-Sử-Địa, `D14`: Văn-Sử-Anh, `D15`: Văn-Địa-Anh) hoặc tổ hợp mới GDPT 2018 (có Tin học, GDKT&PL, Công nghệ) **không thể đặt các ngành chỉ xét `C00`/`D14` làm Mục tiêu chính**, không xem được màn *Môn kéo điểm nhanh nhất* và không nhập được điểm thi thử cho Sử, Địa, GDKT&PL, Tin, Công nghệ.
- **Khuyến nghị khắc phục:**
  - Mở rộng `TO_HOP` và `MaToHop` sang các tổ hợp phổ biến của chương trình GDPT 2018 (`C00, C01, D07, D14, D15, A02...`) sử dụng bảng ánh xạ môn đã có sẵn trong `TONG_TO_HOP_MO_RONG` tại [`src/engine/phan-tich.ts:34-49`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/engine/phan-tich.ts#L34-L49).

---

### RISK-06 [P1]: Lỗ Hổng Rate Limit Trên `POST /api/dang-ky-som` & Race Condition KV
- **Bằng chứng mã nguồn:**
  - [`functions/api/dang-ky-som.ts`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/functions/api/dang-ky-som.ts) hoàn toàn **không gọi `kiemTraGioiHan`** và đọc thẳng `await context.request.text()` mà không kiểm tra `content-length`, cho phép bot spam không giới hạn vào bảng D1 `dang_ky_som`.
  - Ngoài ra, [`functions/_thu-vien/gioi-han.ts:18-29`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/functions/_thu-vien/gioi-han.ts#L18-L29) dùng mẫu `KV.get()` rồi `KV.put()` không nguyên tử (non-atomic read-modify-write); khi nhiều request song song cùng đến trong `< 50ms`, bộ đếm KV có thể bị ghi đè.
- **Khuyến nghị khắc phục:**
  - Bổ sung `kiemTraGioiHan(context.env.KV_CONG_DONG, "dang-ky-som:" + layIp(request), 5, 3600)` và kiểm tra giới hạn body `16KB` vào `functions/api/dang-ky-som.ts`.

---

### RISK-07 [P1]: Xuất Bản Snapshot Bỏ Sót Báo Sai Tổ Hợp, Chỉ Tiêu & Link Nguồn
- **Bằng chứng mã nguồn:**
  - Tại [`cms/functions/api/xuat-ban-snapshot.ts:44-63`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/cms/functions/api/xuat-ban-snapshot.ts#L44-L63):
    Vòng lặp áp dụng các `bao_sai` có `trang_thai = 'DA_DUYET'` chỉ xử lý `if (b.loai_sai === "diem_chuan")` và `else if (b.loai_sai === "hoc_phi")`, nhưng ở dòng 59–62 lại chạy `UPDATE bao_sai SET trang_thai = 'DA_AP_DUNG'` cho **tất cả** các loại báo sai (`to_hop`, `chi_tieu`, `url_nguon`, `khac`)!
- **Tác động:**
  - Các báo sai về tổ hợp xét tuyển hoặc URL đề án dù đã được CTV/Admin duyệt nhưng khi bấm Xuất bản lại bị chuyển sang `DA_AP_DUNG` mà dữ liệu trong `nganh_tuyen_sinh` vẫn giữ nguyên giá trị sai cũ.

---

## 5.4. Phân Tích Chi Tiết Các Rủi Ro P2 (UI Rules, Copywriting & Mobile Responsive)

### RISK-08 [P2]: Vi Phạm Quy Chuẩn "Zero Glassmorphism" Ở 3 Component Dùng Chung
- **Quy chuẩn:** Global Rule & `.agents/AGENTS.md` quy định nghiêm ngặt: *"Tuyệt đối KHÔNG dùng glassmorphism (không làm mờ ảo, không backdrop-filter)"*.
- **Bằng chứng mã nguồn:**
  1. [`src/components/layout/khung.tsx:22`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/components/layout/khung.tsx#L22): `<nav ... className="fixed inset-x-0 bottom-0 z-30 bg-trang/95 backdrop-blur border-t border-vien">`
  2. [`src/components/layout/thong-bao-yeu-thich.tsx:64`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/components/layout/thong-bao-yeu-thich.tsx#L64): `className="... bg-muc/95 text-white shadow-the backdrop-blur px-3.5 py-2.5 ..."`
  3. [`src/components/ui/hien-thi.tsx:78`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/components/ui/hien-thi.tsx#L78): `<div className="fixed inset-0 z-40 bg-muc/50 backdrop-blur-sm flex items-end justify-center" ...>`
- **Khuyến nghị khắc phục:**
  - Thay `bg-trang/95 backdrop-blur` bằng `bg-trang`, `bg-muc/95 ... backdrop-blur` bằng `bg-muc`, và xóa `backdrop-blur-sm` ở lớp phủ `HopTruot`.

---

### RISK-09 [P2]: Bất Nhất Xưng Hô `"bạn"` vs `"em"` Trên Toàn Bộ Giao Diện Học Sinh
- **Nguyên nhân gốc rễ:**
  - Tài liệu [`README.md:155`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/README.md#L155) viết: *"Bản sắc ngôn ngữ: xưng hô thống nhất là **'bạn'** trên toàn ứng dụng"*.
  - Trong khi đó, luật code [`.agents/AGENTS.md:57`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/.agents/AGENTS.md#L57) quy định: *"Thuần Việt: gọi học sinh là **'em'**, câu ngắn, nói việc cần làm"*.
- **Bằng chứng thực tế:**
  - Nhiều màn hình trộn lẫn cả hai cách xưng hô ngay trong cùng một đoạn văn: [`bat-dau.tsx`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/features/khoi-dau/bat-dau.tsx), [`trac-nghiem.tsx`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/features/huong-nghiep/trac-nghiem.tsx), [`chi-tiet.tsx`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/features/kham-pha/chi-tiet.tsx), [`thu-tinh-huong.tsx`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/features/thu-tinh-huong/thu-tinh-huong.tsx), [`muc-tieu.tsx`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/features/muc-tieu/muc-tieu.tsx), [`lich-hoc.tsx`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/features/tu-hoc/lich-hoc.tsx).
- **Khuyến nghị khắc phục:**
  - Chốt 1 chuẩn duy nhất giữa `README.md` và `.agents/AGENTS.md` (khuyến nghị chuẩn hóa về `"em"` cho học sinh theo `.agents/AGENTS.md`, và `"anh/chị"` hoặc `"phụ huynh"` ở trang `/phu-huynh`, `"thầy/cô"` ở trang `/giao-vien`), đồng thời thêm quy tắc kiểm tra vào `tests/kiem-tra-route.ts`.

---

### RISK-10 [P2]: Lỗi `window.confirm` Trong CMS & Điểm Nghẽn Responsive Màn Hình Hẹp (320px / 360px)
- **Bằng chứng mã nguồn:**
  1. **Sử dụng `confirm()` gốc của trình duyệt:** Tại [`cms/src/he-thong/quan-ly-thanh-vien.tsx:116`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/cms/src/he-thong/quan-ly-thanh-vien.tsx#L116):
     `if (!confirm(\`Xóa hoàn toàn \${tv.email} khỏi hệ thống?\`)) return;` — vi phạm Quy tắc sắt số 12 (*"Hành động phá huỷ phải xác nhận bằng HopTruot, không window.confirm"*).
  2. **Bảng so sánh 3 trường trên màn 320px/360px:** Tại [`src/features/kham-pha/so-sanh.tsx:62-97`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/features/kham-pha/so-sanh.tsx#L62-L97), bảng `table-fixed` chia `w-[82px]` cho cột tiêu đề và 3 cột còn lại cho 3 trường mà không có vùng cuộn ngang hoặc bố cục thẻ dọc thu gọn, khiến mỗi cột chỉ rộng `~68px` trên màn 320px.
  3. **Thanh lọc trạng thái Hộp thư CMS:** Tại [`cms/src/phe-duyet/danh-sach-duyet.tsx:126`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/cms/src/phe-duyet/danh-sach-duyet.tsx#L126), `div role="tablist"` chứa 4 nút `whitespace-nowrap` (*Chờ duyệt / Đã duyệt / Đã bác bỏ / Tất cả*) đặt cạnh nhau bằng `flex gap-1.5` nhưng thiếu `overflow-x-auto` hoặc `flex-wrap`, gây tràn ngang trên viewport `360px`.
  4. **Lưới 5 nút hành động quản lý thành viên CMS:** Tại [`cms/src/he-thong/quan-ly-thanh-vien.tsx:198`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/cms/src/he-thong/quan-ly-thanh-vien.tsx#L198), `grid-cols-2 sm:grid-cols-5` có các nút nhãn dài (*"Phân công trường (x)"*, *"Đặt lại mật khẩu"*) dễ bị ép dòng xấu trên màn hình nhỏ.

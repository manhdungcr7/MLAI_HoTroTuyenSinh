# 2. Route & Endpoint Inventory (Danh Mục Toàn Bộ Đường Dẫn & API)

> **Ngày kiểm toán:** 2026-10-15
> **Nguồn sự thật (SSOT):**
> - Web App Học sinh: [`src/duong-dan.ts`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/duong-dan.ts) & [`src/App.tsx`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/App.tsx)
> - CMS Quản trị: [`cms/src/duong-dan.ts`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/cms/src/duong-dan.ts) & [`cms/src/App.tsx`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/cms/src/App.tsx)
> - Public API Functions: [`functions/api/`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/functions/api) & [`functions/snapshots/[tep].ts`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/functions/snapshots/%5Btep%5D.ts)
> - CMS API Functions: [`cms/functions/api/`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/cms/functions/api)

---

## 2.1. Tổng Quan Kiến Trúc Định Tuyến (Routing Architecture)

1. **Ứng dụng Học sinh (`src/App.tsx`):**
   - Sử dụng `createHashRouter` của `react-router-dom`. Mọi đường dẫn thực tế trên trình duyệt đều có tiền tố `#` (ví dụ: `/#/hom-nay`, `/#/kham-pha/truong/bka-it1`).
   - Có tổng cộng **34 khóa định tuyến** trong `MAU` ([`src/duong-dan.ts`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/duong-dan.ts#L9-L44)):
     - **33 route công khai** được gom từ 13 feature slices (trong đó 5 route thuộc `KhungCoThanhDuoi` có thanh điều hướng 4 tab cố định ở đáy màn hình, và 28 route toàn màn hình `ngoaiKhung`).
     - **1 route chỉ dành cho môi trường phát triển (`import.meta.env.DEV`):** `/thiet-ke`.
     - **1 route fallback (`*`):** Chuyển hướng về `/` (`MAU.chaoMung`).
2. **Ứng dụng Quản trị CMS (`cms/src/App.tsx`):**
   - Sử dụng `createHashRouter` độc lập tại cổng `3031` (hoặc tên miền CMS riêng).
   - Có **6 mẫu đường dẫn (`MAU`)** trong [`cms/src/duong-dan.ts`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/cms/src/duong-dan.ts#L5-L12), hiển thị trên khung quản trị 5 tab (`Duyệt`, `AI Tư vấn`, `Xuất bản`, `Dữ liệu`, `Hệ thống`), tự động kiểm tra phiên qua `GET /api/toi` và ép đổi mật khẩu nếu `buocDoiMatKhau === true`.

---

## 2.2. Bảng Kiểm Toán 34 Route Ứng Dụng Học Sinh (`nguyen-vong-ai`)

### Nhóm A: Khởi Đầu & Giới Thiệu (Onboarding & Landing — 4 Routes)

| STT | Khóa `MAU` | Mẫu URL (`HashRouter`) | Tham số / Query | Slice & Component | Khung bố cục (Layout) | Điều kiện truy cập / Guard | Nguồn dữ liệu chính |
|---|---|---|---|---|---|---|---|
| 1 | `gioiThieu` | `/gioi-thieu` | Không | [`landing-page/index.tsx`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/features/landing-page/index.tsx) | Tự quản (Full-page Landing, khóa bảo vệ) | Công khai | Tĩnh (`public/landing/`) |
| 2 | `chaoMung` | `/` | Không | [`khoi-dau/chao-mung.tsx`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/features/khoi-dau/chao-mung.tsx) | `ngoaiKhung` (Full-bleed mobile container) | Công khai | `useApp()` (`napHoSoMau`, `xoaSach`) |
| 3 | `batDau` | `/bat-dau` | `?buoc=1\|2\|3` | [`khoi-dau/bat-dau.tsx`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/features/khoi-dau/bat-dau.tsx) | `ngoaiKhung` + Header bước `1/3..3/3` | Công khai | `useApp()` (`capNhatHoSo`, `datTamTrang`) |
| 4 | `sanSang` | `/san-sang` | Không | [`khoi-dau/san-sang.tsx`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/features/khoi-dau/san-sang.tsx) | `DauTrangCoQuayLai` + `NoiDung` | Nếu thiếu điểm -> Hiện thẻ `TrangThaiTrong` nhắc nhập điểm | `useApp()`, `goiYDauTien` (`LUA_CHON_MAU`) |

### Nhóm B: Hành Trình, Hồ Sơ & Hướng Nghiệp (Tab 1 "Hôm nay" & Sub-routes — 6 Routes)

| STT | Khóa `MAU` | Mẫu URL (`HashRouter`) | Tham số / Query | Slice & Component | Khung bố cục (Layout) | Điều kiện truy cập / Guard | Nguồn dữ liệu chính |
|---|---|---|---|---|---|---|---|
| 5 | `homNay` | `/hom-nay` | Không | [`hanh-trinh/hom-nay.tsx`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/features/hanh-trinh/hom-nay.tsx) | **`KhungCoThanhDuoi`** (Tab 1: `Hôm nay`) + `DauTrangChinh` | Công khai (tự thích ứng theo 3 chặng `dinhHuong`, `nuocRut`, `thiLai`) | `useApp()`, `changCuaEm`, `mucTieuDayDu`, `viecHomNay` |
| 6 | `loTrinh` | `/lo-trinh` | Không | [`hanh-trinh/lo-trinh.tsx`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/features/hanh-trinh/lo-trinh.tsx) | `DauTrangCoQuayLai` + `NoiDung` | Công khai | `useApp()`, `CAC_CHANG`, `changCuaEm` |
| 7 | `hoSo` | `/ho-so` | Không | [`hanh-trinh/ho-so.tsx`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/features/hanh-trinh/ho-so.tsx) | `DauTrangCoQuayLai` + `NoiDung` | Công khai | `useApp()`, `xuatMaHoSo`, `nhapMaHoSo`, `dong-bo-tk.ts` |
| 8 | `veDuLieu` | `/ve-du-lieu` | Không | [`hanh-trinh/ve-du-lieu.tsx`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/features/hanh-trinh/ve-du-lieu.tsx) | `DauTrangCoQuayLai` + `NoiDung` | Công khai | `THONG_KE_DU_LIEU`, `DANH_SACH_TRUONG_THAT` |
| 9 | `huongNghiep` | `/huong-nghiep` | Không | [`huong-nghiep/trac-nghiem.tsx`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/features/huong-nghiep/trac-nghiem.tsx) | `DauTrangCoQuayLai` + `NoiDung` | Công khai | `CAU_HOI_RIASEC`, `useLuuCucBo("riasec-tra-loi")` |
| 10 | `ketQuaNghe` | `/huong-nghiep/ket-qua` | Không | [`huong-nghiep/ket-qua-nghe.tsx`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/features/huong-nghiep/ket-qua-nghe.tsx) | `DauTrangCoQuayLai` + `NoiDung` | Nếu chưa trả lời câu nào (`daTraLoi === 0`) -> Hiện `TrangThaiTrong` dẫn về `/huong-nghiep` | `tinhDiemRiasec`, `useApp()` (`capNhatHoSo`) |

### Nhóm C: Khám Phá Ngành & Trường (Tab 2 "Khám phá" & Sub-routes — 4 Routes)

| STT | Khóa `MAU` | Mẫu URL (`HashRouter`) | Tham số / Query | Slice & Component | Khung bố cục (Layout) | Điều kiện truy cập / Guard | Nguồn dữ liệu chính |
|---|---|---|---|---|---|---|---|
| 11 | `khamPha` | `/kham-pha` | Không | [`kham-pha/kham-pha.tsx`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/features/kham-pha/kham-pha.tsx) | **`KhungCoThanhDuoi`** (Tab 2: `Khám phá`) + `DauTrangChinh` | Công khai | `LUA_CHON_MAU`, `useBoLocKhamPha`, `chamDiem` |
| 12 | `boLoc` | `/kham-pha/bo-loc` | Không | [`kham-pha/bo-loc.tsx`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/features/kham-pha/bo-loc.tsx) | `DauTrangCoQuayLai` + `NoiDung` + Thanh đáy cố định | Công khai | `useBoLocKhamPha` (`localStorage: kham-pha-bo-loc`), `locDanhSach` |
| 13 | `soSanh` | `/kham-pha/so-sanh` | Không | [`kham-pha/so-sanh.tsx`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/features/kham-pha/so-sanh.tsx) | `DauTrangCoQuayLai` + `NoiDung` | Nếu `< 2` trường được chọn -> Hiện hướng dẫn thêm trường từ danh sách gợi ý | `useSoSanh` (`localStorage: kham-pha-so-sanh`), `LUA_CHON_MAU` |
| 14 | `chiTiet` | `/kham-pha/truong/:id` | `:id` (Mã chương trình, VD `bka-it1`) | [`kham-pha/chi-tiet.tsx`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/features/kham-pha/chi-tiet.tsx) | `DauTrangCoQuayLai` + `NoiDung` | Nếu `:id` không tồn tại trong `tim(id)` -> Hiện `TrangThaiTrong` ("Không tìm thấy lựa chọn này") | `tim(id)`, `chamDiem`, `quy-doi-diem.ts`, `useApp()` |

### Nhóm D: Nguyện Vọng, Thử Tình Huống & Điểm Thi Thử (Tab 3 "Nguyện vọng" & Sub-routes — 7 Routes)

| STT | Khóa `MAU` | Mẫu URL (`HashRouter`) | Tham số / Query | Slice & Component | Khung bố cục (Layout) | Điều kiện truy cập / Guard | Nguồn dữ liệu chính |
|---|---|---|---|---|---|---|---|
| 15 | `nguyenVong` | `/nguyen-vong` | Không | [`nguyen-vong/danh-sach.tsx`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/features/nguyen-vong/danh-sach.tsx) | **`KhungCoThanhDuoi`** (Tab 3: `Nguyện vọng`) + `DauTrangChinh` | Nếu `s.nguyenVong.length === 0` -> Hiện `ManTrong` kèm gợi ý thêm nhanh 4 tầng | `useApp()`, `xayDanhSach`, `demCoCau` |
| 16 | `kiemTraNv` | `/nguyen-vong/kiem-tra` | Không | [`nguyen-vong/kiem-tra.tsx`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/features/nguyen-vong/kiem-tra.tsx) | `DauTrangCoQuayLai` + `NoiDung` | Nếu `s.nguyenVong.length === 0` -> Hiện `ManTrong` | `nhanXetCoCau`, `goiYBoSung`, `bangRuiRo` |
| 17 | `sapXepNv` | `/nguyen-vong/sap-xep` | Không | [`nguyen-vong/sap-xep.tsx`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/features/nguyen-vong/sap-xep.tsx) | `DauTrangCoQuayLai` + `NoiDung` | Nếu trống hoặc thiếu điểm -> Hiện `ManTrong` / nhắc nhập điểm | `deXuatThuTu`, `datLaiNguyenVong` |
| 18 | `thuTinhHuong` | `/thu-tinh-huong` | Không | [`thu-tinh-huong/thu-tinh-huong.tsx`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/features/thu-tinh-huong/thu-tinh-huong.tsx) | `DauTrangCoQuayLai` + `NoiDung` | Nếu thiếu điểm 3 môn của tổ hợp -> Hiện `ThieuDiem` dẫn về nhập điểm | `useTinhHuong` (`localStorage: thu-tinh-huong-dang-thu`), `tinhKetQua` |
| 19 | `thuTinhHuongKetQua` | `/thu-tinh-huong/ket-qua` | Không | [`thu-tinh-huong/ket-qua-tinh-huong.tsx`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/features/thu-tinh-huong/ket-qua-tinh-huong.tsx) | `DauTrangCoQuayLai` + `NoiDung` | Nếu `!kq.coThayDoi` -> Hiện `TrangThaiTrong` ("Em chưa thử thay đổi gì") | `useTinhHuong`, `useLuuTinhHuong`, `bangSoSanh` |
| 20 | `diemThiThu` | `/diem-thi-thu` | Không | [`thu-tinh-huong/diem-thi-thu.tsx`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/features/thu-tinh-huong/diem-thi-thu.tsx) | `DauTrangCoQuayLai` + `NoiDung` | Công khai | `useApp()` (`themDiemThi`, `xoaDiemThi`), `chupTruocSau` |
| 21 | `diemThiThuKetQua` | `/diem-thi-thu/ket-qua` | Không | [`thu-tinh-huong/ket-qua-diem-thi.tsx`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/features/thu-tinh-huong/ket-qua-diem-thi.tsx) | `DauTrangCoQuayLai` + `NoiDung` | Nếu `!anh.luc \|\| anh.dong.length === 0` -> Hiện `TrangThaiTrong` dẫn về `/diem-thi-thu` | `useLuuCucBo("diem-thi-thu-truoc-sau")`, `tomTatTruocSau` |

### Nhóm E: Mục Tiêu, Kế Hoạch Tuần & Tự Học (Tab 4 "Kế hoạch" & Sub-routes — 9 Routes)

| STT | Khóa `MAU` | Mẫu URL (`HashRouter`) | Tham số / Query | Slice & Component | Khung bố cục (Layout) | Điều kiện truy cập / Guard | Nguồn dữ liệu chính |
|---|---|---|---|---|---|---|---|
| 22 | `keHoach` | `/ke-hoach` | Không | [`ke-hoach/chuyen-huong.tsx`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/features/ke-hoach/chuyen-huong.tsx) | **`KhungCoThanhDuoi`** (Redirector) | Tự động `<Navigate replace />`: Nếu có `s.mucTieu` và `chang !== "dinhHuong"` -> `/ke-hoach/tuan`; ngược lại -> `/ke-hoach/muc-tieu` | `useApp()`, `changCuaEm` |
| 23 | `mucTieu` | `/ke-hoach/muc-tieu` | Không | [`muc-tieu/muc-tieu.tsx`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/features/muc-tieu/muc-tieu.tsx) | **`KhungCoThanhDuoi`** (Tab 4) + `DauTrangChinh` + `ThanhPhuKeHoach` | Nếu chưa có `s.mucTieu` -> Hiện `TrangThaiTrong` cho chọn từ Nguyện vọng hoặc Khám phá | `docMucTieu`, `chonNguyenVongLamMucTieu` |
| 24 | `monKeoDiem` | `/ke-hoach/muc-tieu/mon` | Không | [`muc-tieu/mon-keo-diem.tsx`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/features/muc-tieu/mon-keo-diem.tsx) | `DauTrangCoQuayLai` + `NoiDung` | Nếu chưa có mục tiêu hoặc thiếu điểm tổ hợp -> Hiện `TrangThaiTrong` | `docMucTieu`, `tongPhanBu`, `goiYTuanNay` |
| 25 | `tuan` | `/ke-hoach/tuan` | `?xem=lich\|chienLuoc` (mặc định `viec`) | [`ke-hoach/ke-hoach-tuan.tsx`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/features/ke-hoach/ke-hoach-tuan.tsx) | **`KhungCoThanhDuoi`** (Tab 4) + `DauTrangChinh` + `ThanhPhuKeHoach` | Công khai (tự sinh việc tuần mới qua `TuanMoiTuTao`) | `useApp()` (`viec`, `khoiHoc`, `xepLai`), `engine/xep-lich.ts` |
| 26 | `viec` | `/ke-hoach/viec/:id` | `:id` (Mã việc, VD `v1`) | [`ke-hoach/chi-tiet-viec.tsx`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/features/ke-hoach/chi-tiet-viec.tsx) | `DauTrangCoQuayLai` + `NoiDung` | Nếu không tìm thấy `:id` trong `s.viec` -> Hiện `TrangThaiTrong` | `useApp()` (`datTrangThaiViec`, `ghimKhoi`), `cacKhungDoiLich` |
| 27 | `tienDo` | `/ke-hoach/tien-do` | Không | [`tu-hoc/tien-do.tsx`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/features/tu-hoc/tien-do.tsx) | **`KhungCoThanhDuoi`** (Tab 4) + `DauTrangChinh` + `ThanhPhuKeHoach` | Nếu trống việc + lịch sử + điểm thi -> Hiện `TrangThaiTrong` | `demTienDo`, `xuHuongCacMon`, `taoCanhBao` |
| 28 | `caiDatLichHoc` | `/cai-dat/lich-hoc` | Không | [`tu-hoc/lich-hoc.tsx`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/features/tu-hoc/lich-hoc.tsx) | `DauTrangCoQuayLai` + `NoiDung` | Công khai | `useApp()` (`coDinh`, `themTiet`, `xoaTiet`, `datCoDinh`), `phatHienTrung` |
| 29 | `caiDatTuHoc` | `/cai-dat/tu-hoc` | Không | [`tu-hoc/cai-dat-tu-hoc.tsx`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/features/tu-hoc/cai-dat-tu-hoc.tsx) | `DauTrangCoQuayLai` + `NoiDung` | Công khai | `useApp()` (`cauHinh`, `capNhatCauHinh`), `uocLuongGioTuHoc` |
| 30 | `nhacNho` | `/cai-dat/nhac-nho` | Không | [`tu-hoc/nhac-nho-trang.tsx`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/features/tu-hoc/nhac-nho-trang.tsx) | `DauTrangCoQuayLai` + `NoiDung` | Công khai | `useApp()` (`nhacNho`), `nhacSapToi`, Web Notification API |

### Nhóm F: Tư Vấn AI, Đồng Hành (Phụ Huynh / Giáo Viên), Đóng Góp & Dev (7 Routes)

| STT | Khóa `MAU` | Mẫu URL (`HashRouter`) | Tham số / Query | Slice & Component | Khung bố cục (Layout) | Điều kiện truy cập / Guard | Nguồn dữ liệu chính |
|---|---|---|---|---|---|---|---|
| 31 | `tuVan` | `/tu-van` | Không | [`tu-van/tu-van.tsx`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/features/tu-van/tu-van.tsx) | `DauTrangCoQuayLai` + `NoiDung` | Công khai | `hoiTuVan` (`POST /api/tu-van` + fallback `traLoiTuDong`), `localStorage: nvai:tu-van-lich-su:v1` |
| 32 | `phuHuynh` | `/phu-huynh` | `?ma=<base64_hoso>` (tùy chọn) | [`dong-hanh/phu-huynh.tsx`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/features/dong-hanh/phu-huynh.tsx) | `DauTrangCoQuayLai` + `NoiDung` | Công khai (hỗ trợ nạp tạm thời mã hồ sơ của con mà không ghi đè máy phụ huynh) | `useApp()` hoặc `giaiMaHoSo(?ma)`, `uocTinhChiPhi4Nam` |
| 33 | `giaoVien` | `/giao-vien` | Không | [`dong-hanh/giao-vien.tsx`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/features/dong-hanh/giao-vien.tsx) | `DauTrangCoQuayLai` + `NoiDung` | Công khai | `useLuuCucBo("gv-danh-sach-lop")`, `phanTichMaHocSinh` |
| 34 | `baoSai` | `/bao-sai` | `?truong=&nganh=&hienTai=` (tùy chọn) | [`dong-gop/bao-sai.tsx`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/features/dong-gop/bao-sai.tsx) | `DauTrangCoQuayLai` + `NoiDung` | Công khai | `guiBaoSai` (`POST /api/bao-sai` + fallback lưu hàng đợi cục bộ `nvai:bao-sai-cho-gui:v1`) |
| 35 | `tinhNguyen` | `/tinh-nguyen` | Không | [`dong-gop/tinh-nguyen.tsx`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/features/dong-gop/tinh-nguyen.tsx) | `DauTrangCoQuayLai` + `NoiDung` | Công khai | `guiTinhNguyen` (`POST /api/tinh-nguyen` + fallback cục bộ) |
| 36 | `dangKySom` | `/dang-ky-som` | `?nguon=` (tùy chọn) | [`dong-gop/dang-ky-som.tsx`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/features/dong-gop/dang-ky-som.tsx) | `DauTrangCoQuayLai` + `NoiDung` | Công khai | `guiDangKySom` (`POST /api/dang-ky-som` + fallback cục bộ) |
| 37 | `thietKe` | `/thiet-ke` | Không | [`thiet-ke/trang-thiet-ke.tsx`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/features/thiet-ke/trang-thiet-ke.tsx) | Tự quản (Design Showcase) | **Chỉ đăng ký khi `import.meta.env.DEV === true`** ([`src/App.tsx:35`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/App.tsx#L35)) | Token màu, Typography và UI Component mẫu |

*(Ghi chú: Tổng số route định nghĩa trong `MAU` của `src/duong-dan.ts` là **34 khóa** — trong bảng trên tách chi tiết 33 route công khai + 1 route dev `/thiet-ke` — hoàn toàn khớp với kiểm định của `tests/kiem-tra-route.ts`).*

---

## 2.3. Bảng Kiểm Toán 6 Route Ứng Dụng Quản Trị CMS (`nguyenvongai-cms`)

Định nghĩa tại [`cms/src/duong-dan.ts`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/cms/src/duong-dan.ts) và [`cms/src/App.tsx`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/cms/src/App.tsx):

| STT | Khóa `MAU` | Mẫu URL (`HashRouter`) | Tham số | Component Thực Thi | Tab hiển thị | Phân quyền hiển thị trên UI (`coTab`) | API gọi trực tiếp |
|---|---|---|---|---|---|---|---|
| 1 | `goc` | `/` | Không | `<Navigate to={DUONG_DAN.duyet("bao_sai")} replace />` | Chuyển hướng | Yêu cầu phiên đăng nhập (`ManDangNhap`) | `GET /api/toi` |
| 2 | `duyet` | `/duyet/:luong` | `:luong` (`bao_sai` \| `tinh_nguyen` \| `dang_ky_som`) | [`phe-duyet/danh-sach-duyet.tsx`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/cms/src/phe-duyet/danh-sach-duyet.tsx) | Tab 1: **Duyệt** | Mọi vai trò (`super_admin`, `admin`, `mod`, `ctv` — tự ẩn sub-tab theo quyền) | `GET /api/hop-thu`, `POST /api/hop-thu`, `POST /api/goi-y-duyet` |
| 3 | `aiTuVan` | `/ai-tu-van` | Không | [`ai-tu-van/trang-ai.tsx`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/cms/src/ai-tu-van/trang-ai.tsx) | Tab 2: **AI Tư vấn** | Chỉ `super_admin`, `admin`, `mod` (`vaiTro !== "ctv"`) | `GET /api/ban-ghi?bang=lich_su_tu_van`, `tai_lieu_nguon`, `doan_van_ai`, `goi_y_ai_duyet` |
| 4 | `xuatBan` | `/xuat-ban` | Không | [`xuat-ban/trang-xuat-ban.tsx`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/cms/src/xuat-ban/trang-xuat-ban.tsx) | Tab 3: **Xuất bản** | Chỉ `super_admin`, `admin` | `POST /api/xuat-ban-snapshot`, `GET /api/ban-ghi?bang=phien_ban_du_lieu` |
| 5 | `duLieu` | `/du-lieu/:bang` | `:bang` (`nganh_tuyen_sinh` \| `truong` \| `phien_ban_du_lieu`) | [`du-lieu/trinh-xem-bang.tsx`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/cms/src/du-lieu/trinh-xem-bang.tsx) | Tab 4: **Dữ liệu** | Mọi vai trò (chỉ đọc kèm bộ lọc `q` và `maTruong`) | `GET /api/ban-ghi` |
| 6 | `heThong` | `/he-thong` | Không | [`he-thong/trang-he-thong.tsx`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/cms/src/he-thong/trang-he-thong.tsx) + [`quan-ly-thanh-vien.tsx`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/cms/src/he-thong/quan-ly-thanh-vien.tsx) | Tab 5: **Hệ thống** | Mọi vai trò xem được thông tin cá nhân & đổi mật khẩu; khối **Quản lý thành viên** và **Nhật ký** chỉ mở cho `super_admin`, `admin`, `mod` | `GET/POST/PATCH/DELETE /api/nguoi`, `GET/PUT /api/phan-cong`, `GET /api/nhat-ky`, `POST /api/doi-mat-khau` |

---

## 2.4. Bảng Kiểm Toán Toàn Bộ API Endpoints (Serverless Cloudflare Pages Functions)

### 2.4.1. Public API Endpoints (`functions/`) — Phục Vụ Ứng Dụng Học Sinh

| STT | Method & Path | File Xử Lý | Cơ chế Bảo vệ & Rate Limit | Request Payload / Query | Response Chuẩn | Bảng D1 / KV Tương Tác |
|---|---|---|---|---|---|---|
| 1 | `GET /api/manifest` | [`functions/api/manifest.ts`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/functions/api/manifest.ts) | Công khai + Cache Header `max-age=300` | Không | `{ phienBan, capNhatLuc, urlSnapshot, sha256, soTruong, soNganh }` | Đọc KV `manifest:current` -> Fallback đọc D1 `phien_ban_du_lieu` -> Fallback trả `v0-local` |
| 2 | `GET /snapshots/:tep` | [`functions/snapshots/[tep].ts`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/functions/snapshots/%5Btep%5D.ts) | Công khai + Regex kiểm tra tên file `^[a-zA-Z0-9._-]+\\.json$` + Cache `immutable, max-age=31536000` | Path param `:tep` | Chuỗi JSON mảng bản ghi chương trình tuyển sinh | Đọc KV `snapshot:<tep>` |
| 3 | `POST /api/tu-van` | [`functions/api/tu-van.ts`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/functions/api/tu-van.ts) | Rate limit KV (`tu-van:<ip>`: **20 lượt / giờ**, burst **5 lượt / phút**); giới hạn body `16KB` | `{ cauHoi: string (3..500 ký tự), hoSo?: HoSoRutGon, nguCanh?: string }` | `{ ok: true, traLoi, nguon: NguonTrichDan[], goiYHoiTiep, tuCache, moHinh, loai }` | KV (`KV_CONG_DONG`), `AI`, `VECTORIZE`, D1 (`nganh_tuyen_sinh`, `tai_lieu_nguon`, `doan_van_ai`, ghi `lich_su_tu_van`) |
| 4 | `POST /api/bao-sai` | [`functions/api/bao-sai.ts`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/functions/api/bao-sai.ts) | Rate limit KV (`bao-sai:<ip>`: **5 lượt / giờ**); giới hạn body `32KB`; kiểm tra URL `https://` | `{ maTruong, tenNganh, loaiSai, giaTriCu, giaTriDeXuat, urlNguon, soTrang, ghiChu, emailLienHe }` | `201 { ok: true, id }` | Ghi D1 `bao_sai`, gửi thông báo Telegram (`guiThongBaoTelegram`) |
| 5 | `POST /api/tinh-nguyen` | [`functions/api/tinh-nguyen.ts`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/functions/api/tinh-nguyen.ts) | Rate limit KV (`tinh-nguyen:<ip>`: **3 lượt / ngày**); giới hạn body `16KB` | `{ hoTen, email, soDienThoai, vaiTro, toChuc, cacTruong: string[] (1..10), kinhNghiem }` | `201 { ok: true, id }` | Ghi D1 `tinh_nguyen_vien`, gửi thông báo Telegram |
| 6 | `POST /api/dang-ky-som` | [`functions/api/dang-ky-som.ts`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/functions/api/dang-ky-som.ts) | Kiểm tra `hoTen`, `vaiTro`, `lienHe` (**Chưa có rate limit KV** — xem `technical-risks.md`) | `{ hoTen, vaiTro, lop, tinh, lienHe, truongQuanTam, ghiChu, nguon }` | `200 { ok: true, id, taoLuc }` | Tự chạy `CREATE TABLE IF NOT EXISTS dang_ky_som` và `INSERT` vào D1 |

### 2.4.2. CMS API Endpoints (`cms/functions/api/`) — Phục Vụ Ứng Dụng Quản Trị

| STT | Method & Path | File Xử Lý | Phân Quyền Bắt Buộc | Request Payload / Query | Response Chuẩn | Bảng D1 / KV Tương Tác |
|---|---|---|---|---|---|---|
| 7 | `POST /api/dang-nhap` | [`cms/functions/api/dang-nhap.ts`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/cms/functions/api/dang-nhap.ts) | Công khai + Rate limit KV (`login:<ip>:<email>`: **5 lần sai / 15 phút**) | `{ email, matKhau }` | `200 { ok: true, email, hoTen, vaiTro, buocDoiMatKhau }` + Header `Set-Cookie: nv_cms=...` | Đọc/cập nhật D1 `quan_tri`, xóa khóa KV `login:*` khi thành công |
| 8 | `POST /api/dang-xuat` | [`cms/functions/api/dang-xuat.ts`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/cms/functions/api/dang-xuat.ts) | Công khai | Không | `200 { ok: true }` + Header `Set-Cookie: nv_cms=; Max-Age=0` | Không |
| 9 | `POST /api/doi-mat-khau` | [`cms/functions/api/doi-mat-khau.ts`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/cms/functions/api/doi-mat-khau.ts) | Yêu cầu phiên hợp lệ (`xacThucQuanTri`) | `{ matKhauCu, matKhauMoi (>= 10 ký tự, có chữ + số) }` | `200 { ok: true }` | Đọc & cập nhật `quan_tri.mat_khau`, đặt `buoc_doi_mk = 0`, ghi `lich_su_quyen` (`DOI_MAT_KHAU`) |
| 10 | `GET /api/toi` | [`cms/functions/api/toi.ts`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/cms/functions/api/toi.ts) | Yêu cầu phiên hợp lệ (`yeuCauQuyen`) | Không | `{ ok: true, nguoi: { email, hoTen, vaiTro, cacTruong, buocDoiMatKhau } }` | Đọc D1 `quan_tri` + `phan_cong_truong` |
| 11 | `GET /api/hop-thu` | [`cms/functions/api/hop-thu.ts`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/cms/functions/api/hop-thu.ts) | Mọi vai trò (tự động lọc theo quyền và `cacTruong` của `mod`/`ctv`) | `?luong=bao_sai\|tinh_nguyen\|dang_ky_som&trangThai=CHO_DUYET\|...` | `{ luong, trangThai, vaiTro, cacTruong, soLuong, danhSach, thongKe? }` | Đọc D1 `bao_sai`, `tinh_nguyen_vien`, `dang_ky_som` |
| 12 | `POST /api/hop-thu` | [`cms/functions/api/hop-thu.ts`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/cms/functions/api/hop-thu.ts) | `DUYET`/`TU_CHOI` `bao_sai`: kiểm tra `coQuyenTruong`; `tinh_nguyen` & `CAP_QUYEN`: yêu cầu `mod` trở lên | `{ luong, id, hanhDong: "DUYET"\|"TU_CHOI"\|"CAP_QUYEN", ghiChu }` | `{ ok: true, id, trangThaiMoi }` | Cập nhật `bao_sai` / `tinh_nguyen_vien`, nếu `CAP_QUYEN` thì thêm `ctv` vào `quan_tri` + `phan_cong_truong`, ghi `nhat_ky_duyet` |
| 13 | `POST /api/goi-y-duyet` | [`cms/functions/api/goi-y-duyet.ts`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/cms/functions/api/goi-y-duyet.ts) | Yêu cầu phiên + `coQuyenTruong` đối với `ma_truong` của báo sai | `{ baoSaiId }` | `{ ok: true, goiY: { khuyenNghi, doTinCay, lyDo, trichDan }, tuCache }` | Đọc `bao_sai`, `nganh_tuyen_sinh`, `doan_van_ai`, gọi Workers AI `@cf/meta/llama-3.1-8b-instruct-fast`, lưu D1 `goi_y_ai_duyet` |
| 14 | `POST /api/xuat-ban-snapshot` | [`cms/functions/api/xuat-ban-snapshot.ts`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/cms/functions/api/xuat-ban-snapshot.ts) | Chỉ `super_admin` và `admin` (`coQuyenXuatBan`) | `{ phienBan?, ghiChu? }` | `{ ok: true, manifest, apDungBaoSai }` | Áp dụng các `bao_sai` đã `DA_DUYET` vào `nganh_tuyen_sinh`, xuất JSON + SHA-256 lên KV (`snapshot:<tep>`, `manifest:current`), ghi `phien_ban_du_lieu` & `nhat_ky_duyet` |
| 15 | `GET/POST/PATCH/DELETE /api/nguoi` | [`cms/functions/api/nguoi.ts`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/cms/functions/api/nguoi.ts) | `GET`: `super_admin`, `admin`, `mod`; `POST/PATCH/DELETE`: chỉ `super_admin`, `admin` | Tạo mới, đổi vai trò/khóa, đặt lại mật khẩu tạm (`datLaiMatKhau: true`), xóa thành viên | `{ ok: true, danhSach \| matKhauTam }` | Đọc/ghi D1 `quan_tri`, `phan_cong_truong`, `lich_su_quyen` |
| 16 | `GET/PUT /api/phan-cong` | [`cms/functions/api/phan-cong.ts`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/cms/functions/api/phan-cong.ts) | `super_admin`, `admin`, `mod` (`mod` chỉ được phân công cho `ctv`) | `PUT { email, cacTruong: [{ maTruong, quyen }] }` | `{ ok: true, email, soTruong }` | Đọc/ghi D1 `phan_cong_truong`, ghi `lich_su_quyen` (`PHAN_CONG`) |
| 17 | `GET /api/ban-ghi` | [`cms/functions/api/ban-ghi.ts`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/cms/functions/api/ban-ghi.ts) | Mọi vai trò (`ctv` bị chặn xem 4 bảng AI: `lich_su_tu_van`, `tai_lieu_nguon`, `doan_van_ai`, `goi_y_ai_duyet`) | `?bang=...&maTruong=...&q=...&gioiHan=1..200` | `{ bang, soLuong, danhSach }` | Đọc D1 1 trong 7 bảng cho phép (`DANH_SACH_BANG`) |
| 18 | `GET /api/nhat-ky` | [`cms/functions/api/nhat-ky.ts`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/cms/functions/api/nhat-ky.ts) | Chỉ `super_admin`, `admin`, `mod` (`vaiTro !== "ctv"`) | Không | `{ nhatKyDuyet, lichSuQuyen }` (tối đa 100 dòng mỗi bảng) | Đọc D1 `nhat_ky_duyet` & `lich_su_quyen` |
| 19 | `POST /api/telegram` | [`cms/functions/api/telegram.ts`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/cms/functions/api/telegram.ts) | Xác thực header `X-Telegram-Bot-Api-Secret-Token` khớp `TELEGRAM_WEBHOOK_SECRET` | Telegram `callback_query` (`duyet:bao_sai:<id>`, `tuchoi:...`) | `{ ok: true }` + `editMessageReplyMarkup` trên Telegram | Cập nhật D1 `bao_sai` / `tinh_nguyen_vien`, ghi `nhat_ky_duyet` |

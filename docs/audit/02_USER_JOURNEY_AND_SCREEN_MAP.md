# 🗺️ BẢN ĐỒ HÀNH TRÌNH NGƯỜI DÙNG & TOÀN BỘ MÀN HÌNH (USER JOURNEY & SCREEN MAP)

## 1. Bản đồ Hành trình Người dùng (User Journey Map)

### Persona 1: Học sinh Lớp 11 định hướng sớm (Chưa có điểm thi thử)
1. `/chao` -> Bấm "Bắt đầu ngay" -> `/bat-dau/1` chọn "Lớp 10-11", tỉnh thành, nhóm ngành yêu thích.
2. Bấm "Xem gợi ý" -> Khám phá 2.529 ngành đào tạo.
3. Làm trắc nghiệm sở thích Holland `/huong-nghiep` -> Chọn 3 nhóm ngành phù hợp.
4. Lưu 5-6 ngành vào Danh sách nguyện vọng `/nguyen-vong`.
5. Đặt 1 ngành làm Mục tiêu chính -> Xem khoảng cách điểm học bạ.

### Persona 2: Học sinh Lớp 12 đã có điểm thi thử (Đang có trường mơ ước)
1. `/bat-dau/1..3` -> Nhập điểm Toán, Lý, Hóa, Văn, Anh, Sinh + Sử, Địa, Tin.
2. `/` (Hôm nay) -> Thấy đếm ngược kỳ thi THPT & thanh khoảng cách điểm `conThieu`.
3. `/ke-hoach/muc-tieu/mon-keo-diem` -> Xem môn có ROI kéo điểm cao nhất (ví dụ: Toán thiếu 0.8, Anh thiếu 0.7).
4. `/ke-hoach/tuan` -> Bấm "Xếp lịch giúp em" -> Thuật toán xếp các buổi tự học môn Toán & Anh vào các khung giờ trống buổi tối.
5. `/diem-thi-thu` -> Nhập điểm thi thử đợt 2 -> Xem `/diem-thi-thu/ket-qua` (so sánh trước/sau) -> Cập nhật sang Kế hoạch tuần.

### Persona 3: Phụ huynh / Giáo viên đồng hành
1. Học sinh tại `/ho-so/chia-se` bật "Kèm tên" -> Bấm "Tạo liên kết".
2. Phụ huynh mở link `/dong-hanh?d=...` trên điện thoại -> Xem tổng quan mục tiêu, học phí ước tính, cơ cấu nguyện vọng.
3. Phụ huynh viết lời nhắn động viên -> Hệ thống sinh link `/loi-nhan?d=...` gửi lại học sinh.
4. Học sinh mở link -> Lời nhắn hiển thị trân trọng trong tab Hồ sơ.

---

## 2. Bản đồ Toàn bộ 31 Màn hình (Screen Map)

| # | Route Pattern | Slice | Khung Layout | Mục tiêu của User | Main CTA | Dữ liệu tiêu thụ & Sản sinh | Next Screen |
|---|---|---|---|---|---|---|---|
| 1 | `/chao` | `khoi-dau` | KhongThanh | Khởi đầu sử dụng app | Bắt đầu ngay / Xem mẫu | `dungHoSoMau()` / `lamLai()` | `/bat-dau/1` hoặc `/` |
| 2 | `/bat-dau/1` | `khoi-dau` | KhongThanh | Nhập Lớp, Tỉnh, Ngành, Trường mơ ước | Xem gợi ý / Bổ sung điểm | `HoSo` (khoi, tinh, nganhQuanTam) | `/bat-dau/2` hoặc `/kham-pha` |
| 3 | `/bat-dau/2` | `khoi-dau` | KhongThanh | Nhập điểm 6 môn chính + 5 môn thêm | Tiếp tục | `HoSo.diem` & `HoSo.diemThem` | `/bat-dau/3` |
| 4 | `/bat-dau/3` | `khoi-dau` | KhongThanh | Nhập Ngân sách, Chỗ ở, Khu vực | Hoàn tất | `HoSo` (nganSach, choO, khuVuc) | `/` (qua ManHinhPhanTich) |
| 5 | `/` | `hanh-trinh` | CoThanh (Tab 1) | Tổng quan hôm nay: Nhiệm vụ, Đếm ngược | Làm việc hôm nay / Xem Kế hoạch | `mucTieuDayDu`, `viecTrongNgay` | `/ke-hoach/tuan` |
| 6 | `/kham-pha` | `kham-pha` | CoThanh (Tab 2) | Tìm kiếm 2.529 ngành, lọc đa chiều | Xem chi tiết / Lọc | `LUA_CHON_MAU`, `danhGia` | `/kham-pha/:id` |
| 7 | `/kham-pha/bo-loc` | `kham-pha` | KhongThanh | Bộ lọc chuyên sâu học phí, điểm, nơi | Áp dụng bộ lọc | `useBoLoc()` | `/kham-pha` |
| 8 | `/kham-pha/ve-du-lieu` | `kham-pha` | KhongThanh | Minh bạch nguồn dữ liệu đề án | Quay lại | `de-an-truong.json` | `/kham-pha` |
| 9 | `/kham-pha/:id` | `kham-pha` | KhongThanh | Chi tiết ngành, điểm chuẩn 3 năm, PDF | Thêm NV / Đặt mục tiêu / So sánh | `LuaChon`, `deAnTruong`, `hocPhi` | `/nguyen-vong` / `/so-sanh` |
| 10 | `/so-sanh` | `kham-pha` | CoThanh (Tab 2) | So sánh song song 2 ngành | Đổi trường so sánh | `s.soSanh`, `danhGia` | `/kham-pha/:id` |
| 11 | `/nguyen-vong` | `nguyen-vong` | CoThanh (Tab 3) | Sắp xếp thứ tự ưu tiên NV1..NVn | Đổi thứ tự / Đánh giá an toàn | `s.nguyenVong`, `dungDanhSach` | `/nguyen-vong/an-toan` |
| 12 | `/nguyen-vong/an-toan` | `nguyen-vong` | CoThanh (Tab 3) | Audit rủi ro danh mục 4 nhãn | Sắp xếp lại / Thêm an toàn | `xetCoCau`, `chamDiem` | `/kham-pha` |
| 13 | `/thu-tinh-huong` | `thu-tinh-huong` | CoThanh (Tab 3) | Kéo slider thử tăng/giảm điểm | Xem kết quả thay đổi | `TinhHuongDangThu`, `dieuKienTuHoSo` | `/thu-tinh-huong/ket-qua` |
| 14 | `/thu-tinh-huong/ket-qua` | `thu-tinh-huong` | KhongThanh | Danh sách ngành mới mở / tăng cơ hội | Thêm vào NV / Đặt mục tiêu | `DongKetQua`, `useLuuTinhHuong` | `/kham-pha/:id` |
| 15 | `/diem-thi-thu` | `thu-tinh-huong` | CoThanh (Tab 3) | Nhập điểm thi thử từng môn & ngày | Xem so sánh trước/sau | `s.diemThi`, `themDiemThi` | `/diem-thi-thu/ket-qua` |
| 16 | `/diem-thi-thu/ket-qua` | `thu-tinh-huong` | KhongThanh | So sánh trước/sau khi đổi điểm | Cập nhật NV / Kế hoạch | `tomTatTruocSau`, `dongDangChuY` | `/ke-hoach/tuan` |
| 17 | `/ke-hoach` | `ke-hoach` | CoThanh (Tab 4) | Hub kế hoạch ôn thi | Tự chuyển sang Tuần hoặc Mục tiêu | `s.mucTieu` | `/ke-hoach/tuan` |
| 18 | `/ke-hoach/muc-tieu` | `muc-tieu` | CoThanh (Tab 4) | Xem khoảng cách điểm mục tiêu | Xem môn kéo điểm / Kế hoạch | `docMucTieu`, `khoiTHPT` | `/ke-hoach/muc-tieu/mon-keo-diem` |
| 19 | `/ke-hoach/muc-tieu/mon-keo-diem` | `muc-tieu` | KhongThanh | Phân tích điểm nghẽn & đề xuất bù | Lập kế hoạch cải thiện | `congSucMon`, `goiYTuanNay` | `/ke-hoach/tuan` |
| 20 | `/ke-hoach/tuan` | `ke-hoach` | CoThanh (Tab 4) | Việc cần làm & Thời khóa biểu | Xếp lịch giúp em / Hoàn thành | `xepLai`, `viecCuaTuan`, `s.khoiHoc` | `/ke-hoach/viec/:id` |
| 21 | `/ke-hoach/viec/:id` | `ke-hoach` | KhongThanh | Chi tiết bài học, bấm giờ, tiêu chí | Hoàn thành / Dời lịch / Bỏ qua | `s.viec`, `datTrangThaiViec` | `/ke-hoach/tuan` |
| 22 | `/ke-hoach/tien-do` | `tu-hoc` | CoThanh (Tab 4) | Thống kê giờ học tuần, chuỗi ngày | Cài đặt mục tiêu | `s.lichSu`, `tinhTienDo` | `/ke-hoach/cai-dat/tu-hoc` |
| 23 | `/ke-hoach/cai-dat/lich-hoc` | `tu-hoc` | KhongThanh | Nhập lịch học chính khóa, học thêm | Lưu lịch cố định | `s.coDinh`, `themTiet`, `xoaTiet` | `/ke-hoach/tuan` |
| 24 | `/ke-hoach/cai-dat/tu-hoc` | `tu-hoc` | KhongThanh | Cấu hình giờ tự học, thời điểm vàng | Lưu cấu hình | `s.cauHinh`, `capNhatCauHinh` | `/ke-hoach/tuan` |
| 25 | `/ke-hoach/cai-dat/nhac-nho` | `tu-hoc` | KhongThanh | Cấu hình giờ nhắc chuẩn bị bài | Bật/tắt thông báo | `s.nhacNho`, `capNhatNhacNho` | `/ke-hoach/tuan` |
| 26 | `/ho-so` | `hanh-trinh` | CoThanh (Tab 5) | Xem tóm tắt hồ sơ, trắc nghiệm, sao lưu | Sửa hồ sơ / Trắc nghiệm / Chia sẻ | `s.hoSo`, `s.loiNhan` | `/ho-so/cai-dat` / `/huong-nghiep` |
| 27 | `/ho-so/cai-dat` | `hanh-trinh` | KhongThanh | Sửa điểm, đổi hồ sơ, sao lưu/khôi phục | Lưu thay đổi / Tải tệp sao lưu | `s.hoSo`, `khoiPhuc`, `lamLai` | `/ho-so` |
| 28 | `/ho-so/chia-se` | `hanh-trinh` | KhongThanh | Tạo link gửi phụ huynh / thầy cô | Tạo liên kết / Sao chép | `tomTatChiaSe`, `taoGoiChiaSe` | N/A (mở link ngoài) |
| 29 | `/huong-nghiep` | `huong-nghiep` | KhongThanh | 18 câu trắc nghiệm RIASEC Holland | Trả lời -> Thêm nhóm ngành | `tinhKetQua`, `nhomNganhGoiY` | `/kham-pha` |
| 30 | `/dong-hanh` | `dong-hanh` | KhongThanh | Trang phụ huynh/thầy cô xem & nhắn nhủ | Gửi lời nhắn | `docGoiChiaSe`, `taoLoiNhan` | `/loi-nhan` |
| 31 | `/loi-nhan` | `dong-hanh` | KhongThanh | Học sinh nhận lời nhắn từ phụ huynh | Lưu vào hồ sơ | `docLoiNhan`, `themLoiNhan` | `/ho-so` |

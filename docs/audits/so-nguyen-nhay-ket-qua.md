# Điểm chuẩn số nguyên nghi sai: kiểm và ghi đè có bằng chứng (X1)

Ngày: 2026-10-17. Danh sách và kết luận từng ô: `docs/audits/so-nguyen-nhay-danh-sach.csv`. Cơ chế: `src/data/hieu-chinh-diem.json` + `src/data/hieu-chinh-diem.ts`, nạp ở `napLuaChon()`; test `tests/hieu-chinh-diem.test.ts`.

## 1. Số liệu

Danh sách: chương trình THPT, cặp năm liền nhau 2022-2025 chênh hơn 4 điểm (không tính 15,0), ít nhất một đầu là số nguyên, cộng 6 dòng đã xác nhận trước. Kết quả: 52 ô số nguyên (khoảng 46 cặp + 6 dòng).

| Kết luận | Số ô |
|---|---|
| ĐÚNG | 36 |
| SAI | 13 |
| KHÔNG XÁC ĐỊNH | 3 |

Quy tắc nhận bản sửa: (a) bộ đọc tự động (`pdftotext -layout` và tọa độ chữ của PyMuPDF) ra đúng số ở cột của đúng năm; (b) đọc bằng mắt ảnh trang PDF, tự xác nhận ngành, năm, phương thức. Cả hai mới được ghi vào tệp.

Phát hiện chung: phần lớn ô sai là cột chỉ tiêu, số nhập học hoặc chỉ tiêu năm bên cạnh bị đọc thành điểm. Phần lớn ô số nguyên khác là ĐÚNG (điểm sàn 15-19, 17,0 của Xây dựng Hà Nội, 19 của khối sư phạm...). Số trang trong `nguon-nam.json` sai ở nhiều trường (Quy Nhơn, Đà Nẵng SP, Quảng Nam, Đồng Nai, HUS...); bản sửa ghi số trang đúng đã đọc.

## 2. Bản sửa đã ghi (17 mục)

13 ô thuộc danh sách, thêm 4 ô cùng trang, cùng bảng, cùng hai bằng chứng (đánh dấu *).

| id | Trường, ngành | Năm | Cũ | Mới | Trang |
|---|---|---|---|---|---|
| ddk-a58ca670 | ĐH Bách Khoa ĐN, Kỹ thuật cơ sở hạ tầng | 2023 | 24 | 17 | 54 |
| ddk-8ecff7a5 | ĐH Bách Khoa ĐN, Quản lý TN&MT | 2023 | 28 | 17 | 55 |
| ddk-d6b8c754 | ĐH Bách Khoa ĐN, Kiến trúc (học bạ) | 2023 | 14 | 24,63 | 52 |
| ddk-3e6b69d0 | Bách Khoa ĐN, CT tiên tiến Việt-Mỹ ĐTVT | 2023 | 18 | 17,5 | 50 |
| ddk-cca300a9 | Bách Khoa ĐN, CT tiên tiến Hệ thống nhúng và IoT | 2023 | 18 | 20,33 | 51 |
| dcl-91a83fa5 | ĐH Cửu Long, Truyền thông đa phương tiện | 2024 | 24 | gỡ | 11 |
| sps-c18e451e | ĐH SP TP.HCM, GD Quốc phòng - An ninh | 2025 | 17 | gỡ | 7 |
| qhs-0e790636 | ĐH Giáo dục, SP Vật lí | 2024 | 20 | gỡ | 17 |
| qhs-0e790636* | như trên | 2025 | 23,5 | 28,00 | 17 |
| qhs-d3be5846 | ĐH Giáo dục, SP Hóa học | 2024 | 20 | gỡ | 17 |
| qht-3dd461b8 | ĐH KHTN HN, Môi trường SK và An toàn | 2022 | 13 | gỡ | 6 |
| qst-c1b7641f | ĐH KHTN TP.HCM, Khoa học Vật liệu (CT tăng cường) | 2023 | 17 | gỡ | 43 |
| sp2-367fe6b8 | ĐH SP Hà Nội 2, KHTN - Khoa học vật liệu | 2023 | 25 | gỡ | 25 |
| tdl-3d1df396 | ĐH Đà Lạt, SP Toán | 2023 | 20 | 26,5 | 4 |
| tdl-3d1df396* | như trên | 2022 | 20 | 25 | 4 |
| tdl-3d1df396* | như trên | 2024 | 24,25 | 25,80 | 4 |
| nhh-eda0a51b* | HV Ngân hàng, KD quốc tế (Coventry) | 2022 | 22 | gỡ | 3 |

Ghi chú: ĐH Đà Lạt: dữ liệu cũ lấy cột ĐGNL (20, 20, 24,25) thay cho cột THPT. ĐH Giáo dục: 20 là chỉ tiêu; ô điểm 2024 là ô gộp cho nhóm ngành (26,58) nên gỡ chứ không gán. Với dòng gỡ, số đúng chưa biết hoặc ngành chưa tuyển sinh năm đó.

## 3. Tác động lên nhãn (hồ sơ 24,0 điểm, so bằng `nhanNguyenVong`)

Chỉ 4 chương trình đổi điểm gần nhất; 3 đổi nhãn:

- dcl-91a83fa5: Vừa sức thành Dự phòng (điểm gần nhất 24 thành 15,0).
- qhs-0e790636: Vừa sức thành Thử sức (23,5 thành 28,0).
- sps-c18e451e: Dự phòng thành Thử sức (2025:17 bị gỡ, điểm gần nhất thành 2024:27,28).
- tdl-3d1df396: vẫn Thử sức (24,25 thành 25,8).

Các bản sửa còn lại nằm ở năm cũ nên đổi lịch sử và đầu vào dự báo 2027 chứ không đổi nhãn.

## 4. KHÔNG XÁC ĐỊNH (không ghi vào tệp)

- nhh-eda0a51b 2024 (27): không có nguồn năm 2024 gắn trong `nguon-nam.json`.
- qst-b5bb5fce 2022 (17): thiếu nguồn gắn; khả năng khớp "Sinh học_CLC" (17) trong đề án 2024 nhưng chưa chắc cùng chương trình.
- sps-866642e2 2025 (24): tên ngành trong dữ liệu bị cắt, không xác định được dòng PDF.

## 5. Giới hạn và việc còn lại

- sps-c18e451e: sau khi gỡ 2025, điểm gần nhất là 2024: 27,28. Trong PDF đó là dòng phương thức 100 (chưa rõ có phải THPT); chưa chứng minh sai nên giữ. Nên rà.
- Phát hiện ngoài phạm vi, chưa sửa: dvd-631ee8ee 2023 dữ liệu 26,74 nhưng PDF ghi 26,99; mã `tys-*` gắn tên "ĐH Y tế Công cộng" trong khi nguồn là ĐH Y khoa Phạm Ngọc Thạch.
- Chỉ kiểm ô số nguyên của cặp nhảy. Lỗi cùng loại ở ô khác (chỉ tiêu bị đọc thành điểm, nhất là bảng hai năm của Bách Khoa ĐN) có thể còn; cần quét theo cột toàn bộ.
- Một số ô (Quy Nhơn dqn-e7c67f48) được đối chiếu với cùng PDF dù thiếu mục nguồn năm.

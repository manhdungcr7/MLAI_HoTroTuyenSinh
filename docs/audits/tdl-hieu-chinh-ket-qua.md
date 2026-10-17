# Hiệu chỉnh điểm ĐH Đà Lạt (TDL): lấy nhầm cột ĐGNL

Nguồn duy nhất: `Thong_tin_tuyen_sinh_2025_Dai_hoc_Da_Lat.pdf`, trang 4-7. Mỗi bảng có ba cột con cho mỗi năm, theo thứ tự "THPT | Học bạ | Điểm ĐGNL" (năm 2024, 2023, 2022).

## Số liệu
- 39 chương trình TDL, tất cả phương thức THPT, đều trỏ về PDF này (trang 4-7). PDF có 40 hàng; cả 39 tên khớp đúng một hàng.
- 117 ô (id, năm): 34 chương trình có 2022-2024, 5 chương trình chỉ có 2023-2024.
- Phân loại: 112 ô LẤY NHẦM CỘT ĐGNL (điểm trong dữ liệu bằng cột ĐGNL, khác cột THPT), 0 ô đúng, 0 ô lấy nhầm cột học bạ, 0 ô KHÔNG XÁC ĐỊNH. 5 ô (2022 của Công nghệ Sinh học, Công nghệ Thông tin, Kế toán, Ngôn ngữ Anh, Quản trị Kinh doanh) dữ liệu không có điểm nhưng PDF có cột THPT: ghi trong CSV là "THIẾU", không đưa vào file ghi đè (ngoài phạm vi sửa).
- Không có ngành nào chỉ xét ĐGNL (mọi ngành đều có cột THPT), nên không đề xuất `diem: null`.
- Số bản sửa đề xuất: 112 ô, 39 chương trình (`docs/audits/tdl-hieu-chinh.json`).

## Hai bằng chứng
(a) Đọc tự động bằng pdfplumber (bảng theo cột, có kiểm tiêu đề cột bằng assert). (b) Đọc mắt: trang 4 và 5 đọc từ `pdftotext -layout`, trang 6 và 7 từ bảng trích ra; tiêu đề "THPT / Học bạ / Điểm ĐGNL" và hàng ngành đối chiếu từng dòng. Điểm ĐGNL thường là sàn (20 hoặc 15, 16), khớp dấu hiệu dữ liệu cũ toàn là 15, 16, 20.

## Ví dụ (cũ → mới)
| id | ngành | năm | cũ → mới | trang |
|---|---|---|---|---|
| tdl-d670d1b3 | Công nghệ Kỹ thuật Điện tử - Viễn thông | 2022 | 15 → 16 | 5 |
| tdl-e0e0a15c | Công nghệ kỹ thuật môi trường | 2023 | 15 → 16 | 5 |
| tdl-3365aff3 | Giáo dục tiểu học | 2022 | 20 → 23,5 | 4 |
| tdl-f3864ffd | Khoa học dữ liệu | 2024 | 16 → 17 | 4 |
| tdl-bf61010e | Lịch sử | 2024 | 16 → 17 | 7 |
| tdl-bccca850 | Quốc tế học | 2022 | 15 → 16 | 7 |
| tdl-411849ac | Sư phạm Lịch sử | 2024 | 20 → 27,25 | 4 |
| tdl-61000875 | Sư phạm Tiếng Anh | 2023 | 20 → 27 | 4 |
| tdl-47d0f161 | Trung Quốc học | 2022 | 15 → 16 | 7 |
| tdl-df01a88d | Văn hóa Du lịch | 2024 | 16 → 17 | 7 |
Sư phạm Toán 2024: 24,25 → 25,80 (trang 4).

## Kiểm lại ngẫu nhiên
20 bản ghi (seed 7) đọc lại bằng phương pháp độc lập (PyMuPDF, tìm theo mã ngành, lấy 9 số của hàng, không dùng pdfplumber): 20/20 đúng (cả điểm THPT mới lẫn điểm ĐGNL cũ ở đúng vị trí cột). Lần đọc đầu bằng tên ngành chỉ ra 13/20 vì tên bị xuống dòng, không phải do lệch số; đổi sang mã ngành thì đủ 20/20.

## Trường khác (chỉ liệt kê, `lay-nham-cot-trường-khac.csv`)
- Quét tự động chỉ làm được với GHA và GSA (bảng có hàng phương thức KQ thi THPT / HB / ĐGTD / ĐGNL). GHA: 9 trang, 43 ô so được; GSA: 7 trang nhận dạng, 31 ô so được. So khớp theo giá trị cả trang (chưa gán hàng, nên có thể trùng ngẫu nhiên).
- Nghi vấn: 1 ô, `gha-fe927ff7` (Hệ thống điện đường sắt tốc độ cao), 2025: dữ liệu 25,58 = cột HB THPT của hàng Kỹ thuật điện (7520201 DS, trang 20); cột THPT cùng hàng là 23,39. Mới một bằng chứng, chưa đưa vào file ghi đè.
- GSA: không phát hiện ô nào.
- TTN, HVN, QHF: các trang nguồn trong cache không có bảng đa phương thức (danh sách ngành, hoặc một cột điểm mỗi năm), không quét được. DHS: không có PDF trong cache. Không kết luận được cho 4 trường này.

## Giới hạn
- Chỉ đối chiếu 2022-2024; PDF không có cột 2025, và dữ liệu TDL cũng không có 2025.
- Chưa kiểm PDF `thong-tin-tuyen-sinh-dai-hoc-da-lat-2026.pdf` (pdfplumber không trích được bảng).
- Trường `dk` của TDL (ví dụ 16) có thể cũng lấy từ cột sai; chưa xét.
- Chưa sửa `du-lieu-that.json`; file ghi đè chờ X1 nạp.

# Nâng độ phủ chương trình có từ 2 năm điểm chuẩn THPT (D3)

Ngày chạy: 2026-10-17. Script: `scripts/mo-rong-nam-diem.py` (chạy lại được, có tiến độ ở `D:/nv-artifacts/d3-tien-do.log`, kết quả trung gian theo PDF ở `D:/nv-artifacts/d3-obs/`).
Đầu ra: `src/data/nam-diem-bo-sung.json` (đề xuất, chưa nối vào app), `docs/audits/nam-diem-xung-dot.csv`. Không sửa `du-lieu-that.json`.

## 1. Khảo sát (bước 1)

- 3.320 chương trình THPT; điểm hợp lệ (bỏ 15,0 là điểm sàn): 1 năm = 1.813, 2 năm = 653, 3 năm trở lên = 251, 0 năm = 603. Từ 2 năm trở lên: 904 (27%).
- Trong 1.813 chương trình một năm: 1.772 (88 trường) thuộc trường có đề án PDF; 1.732 thuộc 150 PDF đã tải (tối đa 150 PDF; tổng 204 PDF của 88 trường); 151 cặp (trường, PDF).
- Năm của điểm duy nhất: 2026 = 1.474 (nguồn tổng hợp tuyensinh247, không gắn PDF), 2025 = 187, 2024 = 98, 2023 = 50, 2022 = 4. Vì vậy phần lớn chương trình một năm không có "neo" để đối chiếu trong PDF.
- Chỉ 235 chương trình một năm có liên kết trong `nguon-nam.json`.

## 2. Cấu trúc bảng nhiều năm (bước 2)

- Trong 150 PDF, chỉ 24 PDF có hàng khớp tên ngành; phần lớn PDF (nhất là bản 2026) chỉ có chỉ tiêu, phương thức, tổ hợp, không có điểm các năm trước hoặc là bản quét ảnh.
- 10 trường nhiều chương trình một năm nhất: TCT, KHA, PKA, SPK, GTA, MBS, NLS không có trang bảng điểm nhiều năm đọc được; SPH, DCN có vài trang bảng nhưng thiếu khớp; BKA có bảng 2022-2023 và 2024-2025 nhưng mỗi ô gộp nhiều phương thức (23.15 (A00..) 15.1 (K00..)) nên bị loại theo quy tắc "đúng một số trong ô".
- Cấu trúc phổ biến (trường có bảng): hàng = ngành, nhóm cột lặp theo năm "Năm 2024 | Chỉ tiêu | Số nhập học | Điểm trúng tuyển", tiêu đề hai tầng (ô gộp). Biến thể: cột năm con "THPT / Học bạ / ĐGNL" (ĐH Đà Lạt), cột "phương thức" xen kẽ hàng (ĐH Sư phạm Huế), điểm dạng "25.33/30" (GHA, GSA, HTC), nhiều số trong một ô (DHY), hàng phụ không tên cho học bạ.

## 3. Kết quả (bước 4-5)

- Tìm thêm được: **19 chương trình, 31 cặp (chương trình, năm)**; cả 19 từ 1 năm lên 2 năm (hoặc hơn). Tức độ phủ từ 2 năm tăng thêm khoảng 0,6 điểm phần trăm (904 -> 923 / 3.320); chưa đạt kỳ vọng.
- Theo trường (chương trình / cặp): HVN 8/15, DHS 4/4, QHF 4/8, GHA 2/2, SP2 1/2.
- Mức tin cậy: mức A (bảng có ô điểm đã có trong dữ liệu trùng khớp, không có ô lệch) = 2 cặp (GHA); mức B (bảng không có ô neo nào, chỉ dựa vào quy tắc a-d) = 29 cặp.
- Đối chiếu ngược trên ô đã có điểm (neo): 415 ô trùng, 215 ô lệch (tính cả các bảng bị loại). Trong các bảng được nhận: 311 trùng, 0 lệch.
- Xung đột: 220 dòng (`nam-diem-xung-dot.csv`): 215 lệch với điểm đã có, 5 nhiều hàng cùng tên. Phân bố: TDL 112, TTN 45, GSA 27, GHA 23, SPS 5, HCS 5, XDA 2, DHY 1.

### Phát hiện về dữ liệu hiện có (cần điều phối viên xem)

- **ĐH Đà Lạt (TDL)**: điểm năm 2022-2024 trong `du-lieu-that.json` trùng đúng cột "Điểm ĐGNL" của bảng đề án 2025 (trang 4-7), không phải cột THPT (ví dụ Sư phạm Toán 2024: dữ liệu 24,25 = ĐGNL; THPT là 25,80). Rất có thể 112 giá trị này sai phương thức.
- TTN (Tây Nguyên), GSA, GHA, SPS, HCS: nhiều điểm lệch hệ thống với PDF (thường PDF cao hơn), nên kiểm lại phương thức hoặc cơ sở/phân hiệu. GHA và GSA dùng chung một PDF nên tên ngành trùng giữa Hà Nội và phân hiệu phía Nam.

## 4. Kiểm chứng ngược

Chỉ có 31 bản ghi mới (ít hơn 50) nên kiểm cả 31: mở lại đúng trang, đọc hàng và tiêu đề cột; 31/31 khớp ngành, năm, điểm với dòng văn bản trích từ chính trang. Kiểm thị giác (render ảnh trang) cho 2 trang đại diện (DHS trang 60, HVN trang 4): đúng, và nhờ đó phát hiện cột 2025 của DHS là ô gộp không ghi phương thức nên đã bỏ cột đó (script nay yêu cầu ô phương thức ghi THPT). Tỉ lệ đúng quan sát được: 31/31, nhưng 29/31 bản ghi thuộc mức B (không có neo độc lập) nên không nên coi đó là độ chính xác đã chứng minh.

## 5. Quy tắc loại và giới hạn

- Tên ngành phải khớp chính xác ô tên (bỏ dấu, chuẩn hóa); khớp theo phần sau " - " chỉ nhận khi bảng ở mức A. Trùng tên giữa nhiều chương trình/trường dùng chung PDF mà không phân biệt được bằng tổ hợp thì bỏ (176 hàng).
- Cột bị loại nếu có học bạ, ĐGNL, tư duy, năng khiếu, kết hợp, xét tuyển thẳng, nhiều số trong một ô; hàng bị loại nếu ô phương thức ghi HB/NL/KH/TT hoặc nhiều mã phương thức gộp.
- Một chương trình khớp nhiều hàng trong cùng PDF thì bỏ hết; một hàng lệch điểm đã có thì bỏ cả hàng.
- Chỉ đọc được bảng `find_tables` của PyMuPDF; PDF quét ảnh, bảng không viền, hoặc bảng chia trang không lặp tiêu đề (chỉ nối trang khi cùng số cột) bị bỏ sót. Tên ngành dài/khác biệt ("Khai thác vận tải (chuyên ngành ...)") không khớp.
- Không dùng nguồn ngoài PDF. Không nội suy. 15,00 và điểm ngoài [10; 30] (ví dụ "34,35/40") bị loại.
- Hạn chế cứng của ý tưởng: phần lớn PDF của các trường lớn không chứa điểm nhiều năm; muốn tăng độ phủ đáng kể cần nguồn khác (trang điểm chuẩn chính thức của trường) hoặc OCR bản quét, ngoài phạm vi D3.

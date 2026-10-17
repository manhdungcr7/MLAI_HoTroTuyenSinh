# Kiểm nhãn năm 2026 (điểm chuẩn từ trang tổng hợp)

Ngày kiểm: 17/10/2026. Phạm vi: 20 chương trình có `diemTheoNam["2026"]` và `nguonCap = aggregator_verified` trong `src/data/du-lieu-that.json` (1.679 dòng 2026, 47 trường). Kiểm trên nhánh `feat/w1-1710`.

## Cách kiểm

1. Chọn 20 chương trình (20 trường khác nhau, mỗi trường 1 chương trình) bằng `napLuaChon()` và `LUA_CHON` trong `src/data/lua-chon-that.ts`. Danh sách lấy từ `chon.txt` tạm, không ghi vào repo.
2. Trang tổng hợp (`linkNguon`, `diemthi.tuyensinh247.com/diem-chuan/...`): tải vào `D:\nv-artifacts\pdf-cache\agg-<id>.html`. Mỗi trang có nhiều bảng, tiêu đề mỗi bảng ghi năm ("Điểm chuẩn theo phương thức Điểm thi THPT năm 2026"). Đã đối chiếu: dòng THPT của mọi chương trình nằm dưới tiêu đề "năm 2026".
3. Đề án tuyển sinh của trường (`de-an-truong.json`, `nguon-nam.json`): tải PDF vào cùng thư mục cache, đọc bằng PyMuPDF (`pdftotext` làm lỗi dấu tiếng Việt ở nhiều tệp). Bảng điểm trúng tuyển nằm trong đề án năm sau (ví dụ đề án 2026 có cột "Năm 2025" và "Năm 2024"). Tệp đề án năm 2025 thường chỉ có chỉ tiêu, không có điểm trúng tuyển.
4. Giới hạn: không tải được đề án 2026 của nhiều trường trong giới hạn 40 tệp. Các trường đó không kết luận được.

## Bảng 20 dòng

Kết luận: ĐÚNG = điểm và năm khớp nguồn chính thức; LỆCH = điểm khớp đúng một năm khác (ghi năm thật); KHÔNG XÁC ĐỊNH = không mở được nguồn chính thức có bảng điểm cho ngành này, hoặc điểm không khớp và không giải thích được.

| id | Trường | Ngành | Điểm trong dữ liệu | Năm trong dữ liệu | Năm đọc từ nguồn | Điểm đọc từ nguồn | Kết luận | Bằng chứng |
|---|---|---|---|---|---|---|---|---|
| bka-9dc074a5 | ĐH Bách Khoa Hà Nội | Logistics và QL chuỗi cung ứng (CT tiên tiến) | 25,06 | 2026 | Trang tổng hợp: 2026 (khớp dữ liệu). Đề án 2026: cột "Năm 2025" | 2025: 23,71/30 (THPT); 2024: 26,06/30 | KHÔNG XÁC ĐỊNH (điểm không khớp 2025 chính thức; 2026 không có trong đề án) | Đề án 2026 `thong-tin-tuyen-sinh-dai-hoc-bach-khoa-ha-noi-2026.pdf` trang 31 (dòng EME14); trang tổng hợp `agg-bka-9dc074a5.html` |
| bvh-4c3d058b | HV Công nghệ BCVT | Công nghệ vi mạch bán dẫn | 25,64 | 2026 | Trang tổng hợp: 2026 (khớp) | Không đọc được | KHÔNG XÁC ĐỊNH (đề án 2026 chưa tải; đề án 2025 không có bảng điểm) | `agg-bvh-4c3d058b.html` |
| dcn-b9773123 | ĐH Công nghiệp Hà Nội | Kiểm toán | 17,75 | 2026 | Trang tổng hợp: 2026 (khớp) | Không đọc được | KHÔNG XÁC ĐỊNH (đề án 2026 chỉ có bảng "Năm 2024"; đề án 2025 không có điểm) | `thong-tin-tuyen-sinh-dai-hoc-cong-nghiep-ha-noi-2026.pdf` |
| dct-e7ec3fbc | ĐH Công Thương TP.HCM | Công nghệ thực phẩm | 22 | 2026 | Trang tổng hợp: 2026 (khớp) | Không đọc được | KHÔNG XÁC ĐỊNH (tệp 2025 gắn với mã DCT là của Trường Cao đẳng Công Thương TP.HCM; không có điểm) | `thong-tin-tuyen-sinh-truong-cao-dang-cong-thuong-tphcm-2025.pdf` |
| ddn-3dcebaab | ĐH Đại Nam | Quản trị kinh doanh | 15 | 2026 | Trang tổng hợp: 2026 (khớp; 15 là mức sàn) | Không đọc được | KHÔNG XÁC ĐỊNH (đề án 2026 không có bảng điểm) | `thong-tin-tuyen-sinh-truong-dai-hoc-dai-nam-nam-2026.pdf` |
| ddq-d23f28e7 | ĐH Kinh tế - ĐH Đà Nẵng | Kinh doanh quốc tế (ST - Tiêu chuẩn) | 25 | 2026 | Trang tổng hợp: 2026 (khớp) | Đề án 2026 có cột "Năm 2025" với nhiều dòng KDQT: 27,00; 26,00; 24,00 (S - Tiêu chuẩn, một phương thức) | KHÔNG XÁC ĐỊNH (không tách được cột và dòng ST trong bảng nhiều cột) | `thong-tin-tuyen-sinh-dh-kinh-te-dh-da-nang-2026.pdf` trang 14 |
| ddu-b0cbbb5a | ĐH Đông Đô | Thương mại điện tử | 15 | 2026 | Trang tổng hợp: 2026 (khớp) | Không đọc được | KHÔNG XÁC ĐỊNH (dữ liệu không có tệp đề án nào) | `agg-ddu-b0cbbb5a.html` |
| dhs-287865cf | ĐH Sư phạm - ĐH Huế | Sư phạm Tin học | 23 | 2026 | Trang tổng hợp: 2026 (khớp) | Đề án 2026 trang 60: HB 26,00 và 22,30; THPT không có điểm | KHÔNG XÁC ĐỊNH (không thấy 23 ở cột THPT; cột năm không chắc) | `thong-tin-tuyen-sinh-dai-hoc-su-pham-hue.pdf` trang 60 |
| dkc-b8a891cd | ĐH Công nghệ TP.HCM | Digital Marketing (tiếng Anh) | 15 | 2026 | Trang tổng hợp: 2026 (khớp; 15 là mức sàn) | Không đọc được | KHÔNG XÁC ĐỊNH (đề án 2026 không có bảng điểm) | `thong-tin-tuyen-sinh-dh-cong-nghe-tphcm-2026.pdf` |
| dkh-a345387c | ĐH Dược Hà Nội | Dược học | 23,5 | 2026 | Trang tổng hợp: 2026 (khớp) | Không đọc được | KHÔNG XÁC ĐỊNH (đề án 2026 chưa tải; đề án 2025 không có bảng điểm ngành) | `thong-tin-tuyen-sinh-dai-hoc-duoc-ha-noi-hup-nam-2025.pdf` |
| dsg-92f213f6 | ĐH Công nghệ Sài Gòn | Luật kinh tế | 20 | 2026 | Trang tổng hợp: 2026 (khớp) | Không đọc được | KHÔNG XÁC ĐỊNH (đề án 2026 không có bảng điểm) | `thong-tin-tuyen-sinh-dai-hoc-cong-nghe-sai-gon.pdf` |
| gta-8692f45d | ĐH Công nghệ GTVT | Công nghệ vật liệu xây dựng tiên tiến và thông minh (Lớp tài năng) | 18 | 2026 | Trang tổng hợp: 2026 (khớp) | Không đọc được | KHÔNG XÁC ĐỊNH (không tìm thấy dòng ngành có điểm trong đề án đã tải) | `cngtvt-thong-tin-tuyen-sinh-2026.pdf` |
| hbt-f2db4c1a | HV Báo chí và Tuyên truyền | Công tác xã hội | 23,49 | 2026 | Trang tổng hợp: dòng D01 ghi 23,24 (dòng tổ hợp khác chưa đối chiếu) | Không đọc được | KHÔNG XÁC ĐỊNH (đề án 2026 chưa tải; trang tổng hợp chưa khớp đầy đủ) | `agg-hbt-f2db4c1a.html` |
| hhk-2166883c | HV Hàng không Việt Nam | Kỹ thuật hàng không (học bằng tiếng Anh) | 25 | 2026 | Trang tổng hợp: 2026 (khớp) | Không đọc được | KHÔNG XÁC ĐỊNH (đề án 2026 chưa tải; đề án 2025 không có bảng điểm) | `thong-tin-tuyen-sinh-hoc-vien-hang-khong-viet-nam-2025.pdf` |
| hnm-9969c3ce | ĐH Thủ đô Hà Nội | Giáo dục thể chất | 23,25 | 2026 | Trang tổng hợp: 2026 (khớp) | Không đọc được | KHÔNG XÁC ĐỊNH (đề án 2026 chưa tải; QĐ 2025 không có bảng điểm) | `844-qd-1452025-ban-hanh-thong-tin-tuyen-sinh-dhcq2025.pdf` |
| hpn-a8fe59e7 | HV Phụ nữ Việt Nam | Kinh tế | 23 | 2026 | Trang tổng hợp: 2026 ghi 23,25 (A00; D01) và 22,75 (A01...). Không có 23 | Đề án 2025 ghi 18,50 và 19,00 nhưng không rõ năm (có thể 2024) | KHÔNG XÁC ĐỊNH; dữ liệu (23) không khớp trang tổng hợp (23,25/22,75) | `thongtintuyensinh2025.pdf` trang 14; `agg-hpn-a8fe59e7.html` |
| hqt-38048c2a | HV Ngoại giao | Kinh doanh quốc tế | 25,42 | 2026 | Trang tổng hợp: 2026 (khớp) | Không đọc được | KHÔNG XÁC ĐỊNH (đề án 2026 chưa tải; đề án 2025 không có điểm) | `thong-tin-tuyen-sinh-2025-hv-ngoai-giao.pdf` |
| htc-215328e3 | HV Tài chính | Kế toán quản trị và KSQL (định hướng CMA) | 22,25 | 2026 | Trang tổng hợp: 2026 (khớp) | Không đọc được | KHÔNG XÁC ĐỊNH (đề án 2026 chưa tải; đề án 2025 không có bảng điểm) | `thong-tin-tuyen-sinh-2025-hoc-vien-tai-chinh.pdf` |
| hvn-e85bab72 | HV Nông nghiệp Việt Nam | Di sản học | 18 | 2026 | Trang tổng hợp: 2026 (khớp) | Không đọc được | KHÔNG XÁC ĐỊNH (đề án 2026 chưa tải; đề án 2025 không có điểm ngành) | `thong-tin-tuyen-sinh-2025-hoc-vien-nong-nghiep-viet-nam.pdf` |
| iuh-73e4f2c5 | ĐH Công nghiệp TP.HCM | Công nghệ kỹ thuật điện, điện tử | 22,52 | 2026 | Không tìm được dòng ngành tương ứng trong trang tổng hợp | Không đọc được | KHÔNG XÁC ĐỊNH | `agg-iuh-73e4f2c5.html`; `dh-cong-nghiep-tphcm.pdf` (2025, không có điểm) |

## Tổng hợp

- ĐÚNG: 0 / 20.
- LỆCH (điểm đúng, năm sai): 0 / 20.
- KHÔNG XÁC ĐỊNH: 20 / 20. Trong đó 1 chương trình (BKA) đã đọc được điểm chính thức 2025 và điểm đó không khớp (23,71 so với 25,06), nên không phải "nhãn lệch" đơn giản.
- Dòng trong trang tổng hợp: 17 / 20 khớp đúng giá trị 2026 của dữ liệu. HPN (23 so với 23,25/22,75) và HBT (chỉ đối chiếu được dòng D01 là 23,24 so với 23,49) chưa khớp. IUH không tìm được dòng.

## Quy luật

Không thấy quy luật lệch năm trong mẫu này. Dữ liệu 2026 lấy đúng giá trị dưới tiêu đề "năm 2026" của trang tổng hợp, nên lỗi nếu có nằm ở chính trang tổng hợp, không nằm ở bước nạp dữ liệu. Không thể kết luận về nhãn năm 2026 từ mẫu này, vì các bảng điểm 2026 chính thức chưa có trong tệp đã tải.

## Đề xuất (chưa sửa dữ liệu)

1. Với mỗi trường trong 47 trường, tải trang tổng hợp của năm 2025 (`Xem thêm ... năm 2025`) và so từng dòng THPT với dòng 2026. Nếu điểm giống hệt nhau thì đánh dấu nhãn nghi lệch. Đây là kiểm tra rẻ nhất để phát hiện lệch năm.
2. Khi trường công bố điểm trúng tuyển 2026 chính thức (đề án mới hoặc thông báo), đối chiếu lại 47 trường này và ghi cờ "đã kiểm chứng".
3. Cho đến khi có bước 1 hoặc 2, giữ nhãn "trang tổng hợp, năm ghi trên trang: 2026" và không dùng điểm 2026 làm mốc chính cho dự báo 2027 mà không ghi chú.
4. Kiểm lại trường DCT: tệp 2025 gắn với mã DCT trong `de-an-truong*.json` là của Trường Cao đẳng Công Thương TP.HCM.
5. Kiểm lại HPN "Kinh tế": dữ liệu 23 không tồn tại trong các dòng THPT 2026 của trang tổng hợp.

## Chỗ chưa chắc

- Không tải được đề án 2026 cho 11 trường (BVH, DCT, DKH, HBT, HHK, HNM, HPN, HQT, HTC, HVN, IUH) vì giới hạn 40 tệp. Với các trường này chỉ có thể nói "chưa kiểm được".
- Cột năm trong các bảng nhiều cột (DDQ, DHS) đọc từ text PDF, chưa xác nhận bằng hình ảnh trang.
- Đề án 2025 của HPN có cột điểm nhưng không ghi rõ năm.

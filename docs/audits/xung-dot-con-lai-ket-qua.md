# Xung đột điểm còn lại (TTN, GSA, GHA, SPS, HCS, XDA, DHY) và liên kết PDF gắn nhầm trường (X3)

Ngày chạy: 2026-10-17. Không sửa `du-lieu-that.json`, `nguon-nam.json`, `de-an-truong*.json`. Script tạm: `scripts/.tmp-*` (lien-ket, a-final, xd-ttn, gtvt-parse, xd-gtvt, xd-final, verify-xd).
Đầu ra: `lien-ket-pdf-sai-truong.csv`, `xung-dot-con-lai-bang-chung.csv`, `xung-dot-con-lai-hieu-chinh.json` (staging, đúng lược đồ ghi đè).

## A. Liên kết PDF với trường (109 mã, 260 tệp-năm)

Cách làm: đọc 4 trang đầu của từng tệp đã có trong cache (không phải chỉ 1 tệp mỗi trường), so cụm tên đặc trưng và "Mã trường/Mã cơ sở đào tạo" ghi trong PDF với mã/tên trong dữ liệu; tệp quét ảnh được đọc bằng mắt từ ảnh trang 1 (18 trường); 3 tệp tải thêm (C23, DNT, LPS). Kết quả theo dòng tệp-năm: KHỚP 155, LỆCH 15, KHÔNG ĐỌC ĐƯỢC 90 (phần lớn là tệp năm khác không có trong cache hoặc quét, không ảnh hưởng vì trường đó đã có tệp khác đọc được). Theo trường: chỉ DNB (Hoa Lư) không đọc được tệp nào (tệp 2025 hỏng, các tệp khác chưa tải).

**10 trường có liên kết/nhãn lệch** (2 loại):

PDF là của trường khác (6):
- DQH ("ĐH Hồng Đức"): PDF 2025 là Học viện Kỹ thuật Quân sự (mã KQH). 2 chương trình dữ liệu DQH thật ra thuộc HV Kỹ thuật Quân sự.
- HCS ("Học viện Chính sách và Phát triển"): PDF 2024 và 2026 là Học viện Hành chính và Quản trị công (mã HCH, không có chữ HCS). 9 chương trình HCS trong dữ liệu có tên ngành nằm trong PDF này (5/5 kiểm được), tức dữ liệu HCS thực chất là của HCH.
- HPN: PDF 2025 là ĐH Vinh (TDV). Dữ liệu HPN không dùng tệp này (nguồn là html).
- QHF: tệp `595-tnn-thong-tin-tuyen-sinh-2026.pdf` là Trường Ngoại ngữ - ĐH Thái Nguyên (DTF). Điểm QHF không lấy từ tệp này.
- QHX: tệp 2025 là ĐH KHXH&NV - ĐHQG TP.HCM (QSX). Dữ liệu QHX nguồn html.
- QHY: tệp 2025 `...truong-dh-y-ha-noi.pdf` là ĐH Y Hà Nội (YHB). Dữ liệu QHY dùng tệp QHY đúng.

PDF khớp mã nhưng TÊN/tỉnh của trường trong dữ liệu sai (4; đã kiểm tên ngành trong dữ liệu có mặt trong PDF: TTN 74/74, DTV 6/6, TYS 12/12, DDP 17/17):
- TTN: dữ liệu "ĐH Tiền Giang" (Đồng Tháp); PDF ghi "Trường Đại học Tây Nguyên", mã TTN, Đắk Lắk. 78 chương trình đều là của ĐH Tây Nguyên.
- DTV: dữ liệu "ĐH Trà Vinh"; PDF là ĐH Lương Thế Vinh (mã DTV).
- TYS: dữ liệu "ĐH Y tế Công cộng" (Hà Nội); PDF là ĐH Y khoa Phạm Ngọc Thạch (TP.HCM), mã TYS.
- DDP: dữ liệu "ĐH Sư phạm Kỹ thuật - ĐH Đà Nẵng"; PDF là Phân hiệu ĐHĐN tại Kon Tum, mã DDP.

Hai nghi vấn của đề bài:
- **DCT: KHÔNG phải liên kết sai.** Tệp `...truong-cao-dang-cong-thuong-tphcm-2025.pdf` chỉ có TÊN TỆP chứa "cao đẳng"; đọc trang 1: "Trường Đại học Công Thương TPHCM ... Mã trường: DCT". Nên tên tệp gây hiểu lầm, nội dung đúng.
- TTN: đúng như nghi vấn, nhưng lỗi nằm ở TÊN trường trong dữ liệu, PDF và chương trình đều của ĐH Tây Nguyên.

Ghi chú khác: DDY ("Khoa Y Dược", nay "Trường Y Dược"), QSX (viết tắt), NTS (PDF chung ĐH Ngoại thương có phần cơ sở TP.HCM), DHS (tệp chung ĐH Huế, trang 20 có mục "Ký hiệu trường DHS"), GSA/GHA (một tệp chung, đề án 2024 ghi "MÃ TUYỂN SINH GHA VÀ GSA") đều KHỚP. DQN 2025 là tệp không ghi tên trường (ghi KHÔNG ĐỌC ĐƯỢC).

Phát hiện thêm (chưa sửa): bản ghi GHA có "nguon" là `vaa.edu.vn` (Học viện Hàng không) dù là số liệu ĐH GTVT; và các bản ghi GHA có tên "(chuyên ngành: ...)" mang điểm của bảng Phân hiệu TP.HCM (GSA) chứ không phải Hà Nội (kiểm 5 bản: Kỹ thuật điện, ĐTVT, ĐK&TĐH, KTXD, Khai thác vận tải: điểm dữ liệu GHA trùng đúng hàng GSA của PDF).

## B. Xung đột điểm (108 dòng, không tính TDL)

| Kết luận | Số dòng | Ghi chú |
|---|---|---|
| BỘ ĐỌC NHẦM (dữ liệu đúng) | 60 | TTN 45, GSA 8, SPS 4, GHA 3 |
| DỮ LIỆU SAI | 37 dòng (20 cặp bản ghi-năm, 18 bản ghi) | GHA 20 dòng/11 cặp, GSA 17 dòng/9 cặp |
| KHÔNG XÁC ĐỊNH | 6 | XDA 2, SPS 1, DHY 1, GSA 2 (Kiến trúc 2024) |
| PDF SAI TRƯỜNG | 5 | HCS 5 |

- TTN (45): với mọi dòng, điểm dữ liệu = hàng "Xét kết quả thi tốt nghiệp THPT"; bộ đọc đã lấy hàng "Xét kết quả học tập cấp THPT (học bạ)" ngay dưới. Đọc tự động bằng bảng (đủ 45/45 hàng duy nhất) và xem ảnh trang 36.
- GHA/GSA: tên ngành trùng ở hai cơ sở nên bộ đọc ghép hàng của cơ sở kia và hàng chương trình CLC. Đã đọc đúng theo cơ sở (GHA mục 11.1 trang 18-23 của tệp 2026; GSA mục II trang 21-23 của đề án 2025), hàng "KQ thi THPT", đúng năm; xem ảnh từng trang.
  - GHA sai: Tài chính - Ngân hàng 2025 (25,08 -> 25,86), Kỹ thuật máy tính 2025 (23,91 -> 23,95), Công nghệ thông tin 2024 (24,40 -> 25,41; 24,40 là điểm hàng chất lượng cao), Kỹ thuật cơ khí 2025/2024 (24,37 -> 25,95; 23,84 -> 24,93), Kỹ thuật cơ điện tử 2025 (25,21 -> 24,93), Kỹ thuật ô tô 2025 (24,04 -> 23,66), Kiến trúc 2025 (22,82 -> 23,52), Quản lý đô thị và công trình 2025 (18,84 -> 22,62), Quản trị dịch vụ du lịch và lữ hành 2025/2024 (23,25 -> 24,02; 22,85 -> 24,30).
  - GSA sai (đều năm 2023): Tài chính - Ngân hàng 24,10 -> 23,10; Cơ điện tử 23,88 -> 22,90; Cơ khí động lực 22,18 -> 21,50; Ô tô 24,17 -> 23,47; Điện 22,93 -> 22,15; ĐTVT 23,13 -> 22,00; ĐK&TĐH 24,22 -> 23,25; KTXD công trình giao thông 18,90 -> 16,15; Khai thác vận tải 24,12 -> 23,84. Năm 2024 của các bản ghi này khớp đúng.
- SPS (5): Ngữ văn (cơ sở chính) và Tiếng Anh (phân hiệu Long An): dữ liệu đúng theo phương thức 100 của đúng cơ sở; bộ đọc lấy hàng cơ sở kia. GDQP-AN 2025 (dữ liệu 17): ô 2025 phương thức 100 trong PDF trống; 17 trùng chỉ tiêu/nhập học 2024; nghi sai nhưng không có số đúng, ghi KHÔNG XÁC ĐỊNH.
- HCS (5): PDF thuộc HCH, không dùng làm bằng chứng.
- XDA (2): PDF chỉ có một "Điểm TT" gộp cho 6 phương thức (100, 200, 301, 402, 415, 417), không tách THPT: không so được với điểm THPT.
- DHY (1): hàng Hộ sinh không ghi phương thức; PDF 2024 = 19,00, 2025 = 17,00, dữ liệu 2023 = 19, 2024 = 16, 2025 = 15; có dấu hiệu lệch năm nhưng không chứng minh được.

## C. Bản sửa và kiểm chứng ngược

- Bản sửa có đủ hai bằng chứng (đọc tự động đúng cột + đọc bằng mắt ảnh trang xác nhận ngành, năm, cột, cơ sở): **20 cặp (bản ghi, năm), 18 bản ghi** trong `xung-dot-con-lai-hieu-chinh.json` (GHA 11, GSA 9). Không có bản `diem: null`.
- Kiểm lại ngẫu nhiên 15/20 bằng thư viện khác (pdfplumber, đọc theo toạ độ chữ): lần đầu 14/15; 1 sai là do công cụ kiểm (hai chương trình cùng mã 7480201 nên lấy nhầm hàng chất lượng cao). Gắn lại theo số TT của hàng: 25,41 đúng; kết quả sau sửa công cụ **15/15**. Cả 20 đã được xem bằng mắt trên ảnh trang trước khi ghi.

## D. Cần người kiểm thủ công
- XDA (cần bảng điểm THPT riêng từ trang tuyển sinh trường), DHY Hộ sinh (có lệch năm hay không), SPS GDQP-AN 2025 (nguồn website trường), GSA Kiến trúc 2024 (dữ liệu thiếu, PDF có 22,05).
- HCS toàn bộ: dữ liệu thực chất của Học viện Hành chính và Quản trị công, cần quyết định đổi nhãn hay thay dữ liệu.
- DQH, TTN, DTV, TYS, DDP: sửa tên/tỉnh trường trong `du-lieu-that.json` (người điều phối).
- 18 trường tệp quét ảnh chỉ kiểm được tên trường ở trang 1; chưa đọc điểm.

## Giới hạn
- Nhận KHỚP bằng cụm tên đặc trưng + mã trong PDF, có đọc bằng mắt các ca nghi ngờ; không kiểm từng trang của mọi PDF.
- Bản sửa GHA/GSA dựa vào đề án chính thức của trường (cột "Điểm trúng tuyển"); nếu nguồn khác của trường công bố số khác, cần người quyết định nguồn ưu tiên.

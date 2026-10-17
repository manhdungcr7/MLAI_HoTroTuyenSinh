# Kiểm mẫu độ chính xác dữ liệu điểm chuẩn

Ngày chạy: 2026-10-17. Phạm vi: so điểm trong `src/data/du-lieu-that.json` với đúng tệp PDF và số trang đã gắn trong `src/data/nguon-nam.json`. Không sửa file dữ liệu nào.

Tái chạy: `python scripts/kiem-mau-do-chinh-xac.py` (tạo mẫu theo seed 20261017, tải và đọc PDF, ghi `docs/audits/mau-do-chinh-xac-danh-sach.csv`), rồi `python scripts/tong-hop-do-chinh-xac.py` (gộp với `docs/audits/mau-do-chinh-xac-kiem-tay.csv`, các dòng đã đọc bằng mắt).

## 1. Kết luận ngắn

| Nhóm dòng | Cỡ mẫu | Kết quả | Độ chính xác (Wilson 95%) |
|---|---|---|---|
| Ngẫu nhiên phân tầng, điểm có phần thập phân | 95 dòng, 93 quyết định được | 93 khớp, 0 sai | 100% (96,0% đến 100%) |
| Điểm nhảy (> 4 điểm), điểm có phần thập phân | 108 dòng, 108 quyết định được | 108 khớp, 0 sai | 100% (96,6% đến 100%) |
| Ngẫu nhiên, điểm nguyên (15, 18, 20...), mẫu con kiểm tay | 14 dòng, 8 quyết định được | 7 khớp, 1 sai | 87,5% (52,9% đến 97,8%) |
| Điểm nhảy, điểm nguyên, mẫu con kiểm tay | 14 dòng, 7 quyết định được | 3 khớp, 4 sai | 42,9% (15,8% đến 75,0%) |

Cách đọc đúng các con số này:

- Có thể nói "điểm có phần thập phân khớp PDF nguồn ở mọi dòng đã kiểm" (93/93 và 108/108). Không nên nói "dữ liệu chính xác 100%".
- Điểm nguyên chiếm 45,5% số ô điểm 2022 đến 2025 trong dữ liệu (1.691 trên 3.714) và 52,5% mẫu ngẫu nhiên (105 trên 200). Phần này kém hơn rõ: lỗi tìm thấy đều thuộc loại chỉ tiêu hoặc số lượng bị ghi thành điểm (mục 5).
- Ước tính thô cho cả mẫu ngẫu nhiên, nếu dòng số nguyên chưa kiểm đúng với tỉ lệ của mẫu con (87,5%): 0,475 x 100% + 0,525 x 87,5% khoảng 93%. Khoảng tin cậy rộng, từ khoảng 75% (nếu lấy cận dưới Wilson của số nguyên) đến 100%. Chỉ là ước tính, không phải số đo.
- Tỉ lệ dòng không tự động kết luận được: 83 trên 200 (41,5%) ở mẫu ngẫu nhiên và 72 trên 194 (37,1%) ở mẫu điểm nhảy là điểm nguyên không ghi phần thập phân; 1 dòng ngẫu nhiên không đọc được trang. Chỉ 14 dòng mỗi mẫu trong nhóm này được đọc bằng mắt.

## 2. Phương pháp

Khung chọn mẫu: các ô (chương trình, năm) năm 2022 đến 2025 có điểm trong dữ liệu và có mục nguồn đúng năm kèm số trang trong `nguon-nam.json`. Trong 3.714 ô điểm, 2.945 có link năm, 2.383 có thêm số trang; mẫu lấy từ 2.383 ô này (563 mục link không có số trang bị loại). Nguồn tổng hợp năm 2026 không có PDF theo năm nên không nằm trong mẫu.

a) Mẫu ngẫu nhiên phân tầng, 200 dòng, seed 20261017. Tầng theo năm (4) và theo cỡ trường (3: nhỏ ≤ 13 chương trình, vừa 14 đến 36, lớn > 36, chia tam phân vị theo số chương trình mỗi trường). Phân bổ tỉ lệ theo số ô, tối thiểu 5 mỗi tầng.

| Năm | Lớn (khung/mẫu) | Vừa | Nhỏ |
|---|---|---|---|
| 2022 | 173/14 | 175/15 | 47/5 |
| 2023 | 359/30 | 270/22 | 96/8 |
| 2024 | 470/39 | 210/17 | 99/8 |
| 2025 | 318/27 | 119/10 | 47/5 |

b) Điểm nhảy: đo lại trên dữ liệu có 141 cặp năm liền kề chênh > 4 điểm (không phải 106). 97 cặp có link và số trang ở cả hai đầu. Lấy đủ 97 cặp (nhỏ hơn mức tối đa 106), tức 194 dòng. 44 cặp còn lại không kiểm được vì thiếu link hoặc số trang.

Số PDF khác nhau dùng: 68 (tải từ `images.tuyensinh247.com` và `cdn.tuyensinh247.com`, cache ngoài repo).

Bộ khớp tự động (`scripts/kiem-mau-do-chinh-xac.py`): đọc từ PDF bằng PyMuPDF, gom chữ thành dòng theo tọa độ y; đọc trang đã ghi và ±1; tìm dòng có tên ngành chuẩn hóa (bỏ dấu, ba biến thể tên, đủ ≥ 85% từ); lấy các số quanh dòng đó (cửa sổ hẹp rồi cửa sổ rộng cho ô gộp nhiều dòng), ưu tiên phương thức đúng loại (THPT, học bạ, ĐGNL). KHỚP nếu điểm dữ liệu có trong cửa sổ (dung sai 0,005). Nếu không có trong ±1 trang, tìm toàn tệp (chỉ với điểm có phần thập phân). Điểm nguyên chỉ được tính khớp khi ghi rõ phần thập phân (ví dụ "19,00"), vì số nguyên trùng ngẫu nhiên với chỉ tiêu, số thứ tự, ngày tháng. Điểm nguyên không khớp thì để KHÔNG ĐỌC ĐƯỢC, không kết luận sai.

Bộ khớp không xác định cột năm; nó chỉ chứng minh điểm có mặt trong hàng đúng ngành.

## 3. Quá trình sửa bộ khớp (nói thẳng)

Bản đầu dùng `pdftotext -layout`, đọc sai tiếng Việt (thiếu `-enc UTF-8`) nên gần như mọi dòng KHÔNG TÌM THẤY. Sau khi sửa, bản theo dòng văn bản cho nhiều dòng SAI giả vì ô gộp nhiều dòng đặt số lệch khỏi tên ngành (ví dụ Ngôn ngữ Nga 15,1 và 15,04 thật ra có trong PDF, nhưng nằm giữa khối ô). Tôi đọc ảnh trang để chẩn đoán rồi chuyển sang đọc theo tọa độ, bỏ lỗi dừng sớm không xét trang ±1, và thêm tìm toàn tệp. Vì vậy 30 dòng "SAI/KHÔNG TÌM THẤY" đầu tiên của bản cuối chỉ có 27 dòng. Cỡ này do tôi đã tinh chỉnh bộ khớp dựa trên các dòng đó, nên tỉ lệ khớp nhầm đo dưới đây là của bản cuối, không phải của bản chưa tinh chỉnh.

Bản trước khi sửa quy tắc số nguyên đã tính KHỚP giả với số nguyên: trong 15 dòng KHỚP số nguyên đọc bằng mắt có 6 dòng khớp giả (chỉ tiêu, dòng bên cạnh, mã tổ hợp "C19", ngày "15/02/2007") và 1 dòng chưa rõ. Quy tắc hiện tại loại các trường hợp đó, nhưng khớp số nguyên dạng ".00" (khoảng 37 dòng) chưa được kiểm độc lập ngoài 2 dòng thấy đúng.

## 4. Kiểm tay

### 4.1 Các dòng script xếp SAI hoặc KHÔNG TÌM THẤY (27 dòng, bản cuối)

Tất cả 27 dòng (điều kiện là "30 dòng đầu", thực tế chỉ có 27) đã đối chiếu bằng ảnh trang PDF hoặc văn bản quanh hàng ngành:

| Kết quả đọc bằng mắt | Số dòng |
|---|---|
| Dữ liệu đúng, script đọc nhầm (KHỚP khi kiểm tay) | 26 |
| PDF không có điểm riêng của ngành, không đối chiếu được | 1 |
| Dữ liệu sai | 0 |

Tỉ lệ script kết luận SAI/KHÔNG TÌM THẤY nhầm: 26 trên 27 (96%). Nguyên nhân: ô gộp nhiều dòng, tên ngành xuống dòng, ngành lặp lại ở nhiều phương thức, định dạng "20,63/30". Hệ quả: nếu chỉ dùng kết quả thô của script, độ chính xác mẫu ngẫu nhiên là 97/(97+17) = 85,1% và mẫu điểm nhảy là 115/(115+5) = 95,8%; con số đó thấp hơn thực tế vì SAI ở đây là lỗi bộ khớp. Bảng ở mục 1 đã cộng kết quả kiểm tay.

Ba trong số 26 dòng (Khoa học chính trị, ĐH Sư phạm Kỹ thuật Đà Nẵng) có số đúng nhưng PDF ghi theo ngành Quản lý nhà nước thuộc nhóm ngành "Khoa học chính trị"; tên chương trình trong dữ liệu có vẻ là tên nhóm ngành.

### 4.2 Mẫu con số nguyên (28 dòng ngẫu nhiên trong các dòng điểm nguyên không tự kết luận được; 14 mỗi mẫu)

| | Ngẫu nhiên | Điểm nhảy |
|---|---|---|
| Khớp | 7 | 3 |
| Sai | 1 | 4 |
| Nghi sai (chưa phân định) | 1 | 1 |
| Không xác định (trang liên kết không chứa điểm) | 5 | 6 |

Đáng chú ý: 11 trên 28 dòng (39%) có trang liên kết là bảng chỉ tiêu, bảng việc làm, bảng học phí, danh mục ngành hoặc trang bìa, tức liên kết trang không chứng minh được điểm.

### 4.3 Kiểm chéo dòng KHỚP

Đọc ảnh 10 dòng KHỚP có điểm thập phân (cả cửa sổ hẹp và rộng): 10/10 đúng hàng, đúng điểm. Cỡ mẫu nhỏ, chưa đủ để loại khớp giả hiếm.

## 5. Dòng dữ liệu SAI đã xác nhận bằng mắt (cho người có quyền sửa)

Chỉ có 6 dòng sai xác nhận được (không đủ 10 ví dụ), cộng 2 dòng nghi sai. Mẫu chung: số trong dữ liệu trùng chỉ tiêu hoặc số lượng của ngành.

| id | Trường | Ngành | Năm, phương thức | Điểm dữ liệu | Điểm PDF | Trang | PDF |
|---|---|---|---|---|---|---|---|
| qhs-0e790636 | ĐH Giáo dục - ĐHQGHN | Sư phạm Vật lí | 2024, THPT | 20 | 28,00 (20 là chỉ tiêu) | 17 | https://cdn.tuyensinh247.com/picture/2026/0903/thong-tin-tuyen-sinh-dh-giao-duc-dhqghn.pdf |
| ddk-a58ca670 | ĐH Bách Khoa - ĐH Đà Nẵng | Kỹ thuật cơ sở hạ tầng | 2023, THPT | 24 | 17 (24 là chỉ tiêu) | 54 | https://images.tuyensinh247.com/picture/2025/0623/20250615-thong-tin-tuyen-sinh-dh-chinh-quy-14g00-dang-lai.pdf |
| ddk-d6b8c754 | ĐH Bách Khoa - ĐH Đà Nẵng | Kiến trúc | 2023, học bạ | 14 | 24,63 (14 là chỉ tiêu 2024) | 52 | cùng PDF Bách Khoa Đà Nẵng ở trên |
| ddk-8ecff7a5 | ĐH Bách Khoa - ĐH Đà Nẵng | Quản lý tài nguyên và môi trường | 2023, THPT | 28 | 17 | 55 (link ghi trang 6, là danh mục ngành) | cùng PDF Bách Khoa Đà Nẵng ở trên |
| sps-c18e451e | ĐH Sư phạm TP.HCM | Giáo dục Quốc phòng - An ninh | 2025, THPT | 17 | 27,28/30 (17 là số lượng) | 7 | https://images.tuyensinh247.com/picture/2026/0416/thong-tin-tuyen-sinh-truong-dai-hoc-su-pham-tphcm-2026.pdf |
| dcl-91a83fa5 | ĐH Cửu Long | Truyền thông đa phương tiện | 2024, THPT | 24 | để trống năm 2024 (24 là chỉ tiêu) | 11 | https://images.tuyensinh247.com/picture/2026/0424/thong-tin-tuyen-truong-dai-hoc-cuu-long-2026.pdf |

Nghi sai, chưa phân định:

- spd-e99b5a2f, ĐH Đồng Tháp, Giáo dục Mầm non (CĐ), 2025, KET_HOP: dữ liệu 26; PDF trang 28 có 23,65 và 27,76 (2025), 25,8 và 26,37 (2024); không có 26 chính xác. Có thể bị làm tròn.
- sps-866642e2, ĐH Sư phạm TP.HCM, Giáo dục Mầm non (tên trong dữ liệu là "(đào tạo tại cơ sở chính)", có vẻ cắt hỏng), 2025, THPT: dữ liệu 24; PDF trang 5 ghi 26,05/30 và 24,24/30. Chưa rõ hàng nào là THPT.

Lưu ý id `ddk-8ecff7a5` (28) là dòng kiểm thêm khi chẩn đoán, không nằm trong mẫu con 28 dòng nên không dùng để tính tỉ lệ ở mục 1.

Gợi ý rà toàn bộ: lọc các điểm nguyên trong dữ liệu có giá trị trùng chỉ tiêu của cùng ngành (đặc biệt phương thức THPT của các trường Đà Nẵng, ĐHQGHN, Sư phạm TP.HCM), và các điểm nhảy mà một đầu là số nguyên lớn hơn 20 trong khi năm kề là số thập phân.

## 6. Giới hạn

1. Chỉ kiểm khớp giữa dữ liệu và PDF nguồn đã gắn. Không chứng minh PDF đúng, và không kiểm các ô không có link năm (769 ô năm 2022 đến 2025) hay không có số trang (563 mục).
2. Khung mẫu có thiên lệch: script tạo link trước đây chỉ ghi khi tìm thấy điểm trong PDF (`scripts/sinh-nguon-nam.py`). Vì vậy mọi dòng trong khung đã từng khớp ít nhất ở bước sinh link; độ chính xác thực của các dòng không có link có thể thấp hơn.
3. Bộ khớp xác định hàng ngành bằng tên và cửa sổ vị trí, không xác định cột năm. Hai năm cạnh nhau có cùng điểm hoặc điểm của năm kề trùng giá trị sẽ khớp nhầm cột; chưa đo tần suất. Trong ảnh đã đọc, cột năm khớp ở các dòng kiểm nhưng không phải dòng nào cũng có tiêu đề năm trong khung ảnh.
4. Phương thức (THPT, học bạ, ĐGNL) chỉ được dùng để ưu tiên, không bắt buộc; mã phương thức kiểu "100, 200" của một số trường được suy theo giá trị.
5. Điểm nguyên chưa có phương pháp tự động đáng tin; con số của nhóm này dựa trên mẫu con 14 dòng mỗi mẫu nên khoảng tin cậy rất rộng.
6. Việc đọc bằng mắt do một người (tôi) thực hiện, không có người thứ hai đối chiếu.
7. Không có dòng nào của mẫu thuộc nguồn tổng hợp năm 2026.

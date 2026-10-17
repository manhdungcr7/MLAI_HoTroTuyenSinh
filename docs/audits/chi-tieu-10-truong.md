# Chỉ tiêu tuyển sinh theo ngành của 10 trường (đề án PDF)

Sinh bằng `scripts/trich-chi-tieu.py` thành `src/data/chi-tieu.json` (421 bản ghi). Chỉ nhận con số đọc trực tiếp từ ô "Chỉ tiêu" của bảng trong đề án, kèm năm, URL, số trang. Thiếu thì bỏ trống và app không hiện dòng chỉ tiêu.

## Kết quả

| Mã | Trường | Số chương trình (mọi phương thức) | Có chỉ tiêu | Phủ | Chương trình THPT | THPT có chỉ tiêu | Năm | Đề án |
|---|---|---|---|---|---|---|---|---|
| TCT | Trường Đại học Cần Thơ | 126 | 105 | 83% | 126 | 105 | 2026 | https://images.tuyensinh247.com/picture/2026/0407/thong-bao-tuyen-sinh-truong-dai-hoc-can-tho-2026.pdf |
| SPD | ĐH Đồng Tháp | 121 | 85 | 70% | 51 | 37 | 2026 | https://cdn.tuyensinh247.com/picture/2026/0616/20260528044344d-spd-thong-tin-tuyen-sinh-dai-hoc-cao-dang-2026-hoanchinh-trnh-ky-20260528015322-e.pdf |
| GSA | ĐH Giao thông Vận tải Cơ sở 2 | 82 | 17 | 20% | 48 | 9 | 2026 | https://images.tuyensinh247.com/picture/2026/0407/thong-tin-tuyen-sinh-truong-dai-hoc-giao-thong-van-tai-co-so-2-utc2-2026.pdf |
| GTA | ĐH Công nghệ Giao thông Vận tải | 74 | 18 | 24% | 74 | 18 | 2026 | https://images.tuyensinh247.com/picture/2026/0406/cngtvt-thong-tin-tuyen-sinh-2026.pdf |
| BKA | ĐH Bách Khoa Hà Nội | 69 | 49 | 71% | 69 | 49 | 2026 | https://cdn.tuyensinh247.com/picture/2026/0907/thong-tin-tuyen-sinh-dai-hoc-bach-khoa-ha-noi-2026.pdf |
| QST | ĐH Khoa học Tự nhiên - ĐHQG TP.HCM | 63 | 25 | 39% | 42 | 14 | 2026 | https://cdn.tuyensinh247.com/picture/2026/0616/thong-tin-tuyen-sinh-truong-dai-hoc-khoa-hoc-tu-nhien.pdf |
| TDV | ĐH Vinh | 62 | 34 | 54% | 61 | 34 | 2026 | https://cdn.tuyensinh247.com/picture/2026/0615/thongtintuyensinh2026update.pdf |
| DDK | ĐH Bách Khoa - ĐH Đà Nẵng | 62 | 42 | 67% | 34 | 22 | 2025 | https://images.tuyensinh247.com/picture/2025/0623/20250615-thong-tin-tuyen-sinh-dh-chinh-quy-14g00-dang-lai.pdf |
| DQN | ĐH Quy Nhơn | 50 | 37 | 74% | 50 | 37 | 2026 | https://cdn.tuyensinh247.com/picture/2026/0616/thong-tin-tuyen-sinh-truong-dai-hoc-quy-nhon-nam-2026.pdf |
| DCN | ĐH Công nghiệp Hà Nội | 58 | 9 | 15% | 58 | 9 | 2026 | https://images.tuyensinh247.com/picture/2026/0402/thong-tin-tuyen-sinh-dai-hoc-cong-nghiep-ha-noi-2026.pdf |
| | Tổng 10 trường | 767 | 421 | 54% | 613 | 334 | | |

## Kiểm chứng

Rút ngẫu nhiên 30 bản ghi (seed 7), mở lại đúng trang PDF và đối chiếu tên ngành với con số trên đúng hàng: 30/30 đúng. BKA đối chiếu thêm trực tiếp bảng trang 11 (Cơ điện tử 300, Cơ khí 560, Cơ điện tử tiên tiến 180), và rà toàn bộ danh sách GTA, DCN, GSA. Mẫu nhỏ nên chưa loại trừ được sai sót hiếm.

## Quy tắc nhận và cách hiểu con số

- Tên ngành chuẩn hóa (bỏ dấu, chữ thường) phải khớp đúng tên ngành trong dữ liệu, và trong đề án chỉ có một giá trị chỉ tiêu cho tên đó (bảng nhắc lại ở phụ lục cho cùng số vẫn tính một).
- Số là chỉ tiêu cả ngành/chương trình theo đề án, thường gộp mọi phương thức. Dữ liệu có nhiều dòng cùng ngành theo phương thức (THPT, học bạ, ĐGNL...) thì các dòng cùng nhận một con số, ghi chú trong `chi-tieu.json` nêu rõ. Không đọc đó là chỉ tiêu riêng của phương thức điểm thi THPT; dòng hiển thị trên trang ngành ghi "tính cho cả ngành (mọi phương thức)".
- Bảng chỉ có chỉ tiêu theo nhóm ngành thì không gán cho từng ngành.
- Không tính tỉ lệ chọi hay độ cạnh tranh bằng số vì không có số hồ sơ đăng ký.

## Trường đã thử nhưng không trích được

| Mã | Lý do |
|---|---|
| KHA, MBS | PDF là ảnh quét, không có lớp chữ (cần OCR; không dùng để tránh đọc sai số) |
| PKA, DDT, NTT, DKC | Đề án chỉ nêu tổng chỉ tiêu toàn trường hoặc bảng ngành không có cột chỉ tiêu |
| QSX | Ô tên ngành tách nhiều dòng; dữ liệu dùng tên "CT chuẩn - ..." nên không khớp duy nhất, chưa gán |
| GHA | Bảng có chỉ tiêu nhưng bộ tách bảng nhận nhầm cột tên ngành; chỉ khớp 5 ngành nên không đưa vào |
| SPH, NLS, IUH, TMU, TDM, TLA, SGD, SPS, TSN, DCT | Không tìm thấy bảng có cột chỉ tiêu theo ngành (có thể bảng không kẻ ô hoặc chỉ có tổng), chưa rà tay |
| TTN | Dữ liệu ghi "ĐH Tiền Giang" nhưng đề án là của ĐH Tây Nguyên, nghi sai mã nên không dùng |

## Giới hạn

- Phủ thấp ở GSA, GTA, DCN, QST: nhiều ngành trong dữ liệu có tên khác tên trong bảng chỉ tiêu (ví dụ có phần "(chuyên ngành...)") nên bị bỏ thay vì đoán.
- Chỉ tiêu là dự kiến theo đề án, có thể điều chỉnh khi trường công bố chính thức.
- DDK dùng đề án 2025; các trường còn lại 2026.
- Chạy lại: `python -X utf8 scripts/trich-chi-tieu.py` (cần PyMuPDF, PDF cache ở `D:/nv-artifacts/pdf-cache`). Các tệp `scripts/.tmp-*` là tạm, không đưa vào git.

# Audit dữ liệu 16/10/2026

Audit bằng script trên `src/data/du-lieu-that.json` (3.652 chương trình, 118 trường). Chỉ kiểm bằng máy, **chưa đối chiếu được với PDF gốc** (thư mục `../nguyen-vong` không có, máy không có mạng). Số liệu do agent tự động đếm; người sửa nên chạy lại script trước khi đổi dữ liệu.

Phần sạch: id duy nhất; không thiếu `ma`, `truong`, `nganh`, `pt`, `diem`; 118 mã trường khớp danh mục hai chiều; không có điểm ≤ 0, NaN hay vượt thang THPT; không còn tên tỉnh cũ; việc làm nằm trong 0–100, không bị đọc thành phân số; khoảng dự báo không đảo ngược; học phí không ngoài 5–300 triệu.

## Mức cao (ảnh hưởng nhãn Thử sức / Vừa sức / An toàn)

| # | Vấn đề | Quy mô | Ví dụ id |
|---|---|---|---|
| 1 | `dk` (điểm dự kiến) trùng điểm năm mới nhất: nếu UI gọi là "dự kiến" thì đang đưa điểm cũ ra như dự báo | 3.652/3.652 | `bka-33d10e85` |
| 2 | Có điểm năm 2026 bằng đúng `dk`, chỉ từ nguồn tổng hợp (không có trong `nguon-nam.json`), mâu thuẫn `docs/DU-LIEU.md` ("điểm năm nay chưa có"). Dự báo 2027 neo vào năm này | 1.680 dòng (46%), 47 trường | `bvh-ee8d55d9` |
| 3 | Điểm THPT đúng bằng 15, tập trung theo trường: nghi điểm sàn/giá trị mặc định của nguồn | 843 dòng (205 dòng năm 2026); `bvu-*` 88/93, `dkc-*` 71/77, `ddt-*` 65/72, `ntt-*` 61/72, `lnh-*` 24/24 | `bvu-*` |
| 4 | ĐGNL/ĐGTD đều nằm trong 12–29 (thang 30), không dòng nào thang 1200/150: đã quy đổi mà không ghi, hoặc sai thang | 74 dòng | `ttn-166161bc`, `qst-5c488ee5` |
| 5 | Học phí đồng loạt một mức trong trường, nghi nhánh `else` của `scripts/lam-day-hoc-phi.py` gán mức chung rồi gắn link nguồn (trái "không bịa số") | QSX 38/78 = 26; GHA 19/53 = 23; DCN 58/58 = 21; XDA 40/41 = 18,5; QHT 8/24 = 19,3 | `qsx-6c5d8a1a`, `gha-fe927ff7`, `qht-01a4afcf` |
| 6 | Điểm nhảy hơn 4 điểm giữa hai năm liền kề, đều từ PDF, nghi lỗi trích xuất | 106 dòng (2025: 54); ĐH Cửu Long cùng giảm 24 → 15 | `qst-b44776a1`, `sps-c18e451e`, `ddk-8ecff7a5`, `dcl-cd97cce4` |
| 7 | `CLAUDE.md` ghi 721 chương trình học phí ở 20 trường; dữ liệu thật 602 ở 18 trường. KHA (99) và QHI (20) không có học phí từ văn bản | — | — |

## Mức vừa

- 1.173 dòng nguồn PDF không có `nguon` ở bản ghi nhưng vẫn gắn `daKiemChung: true` (56 dòng không có link nào trong `nguon-nam.json`). Ví dụ `ddk-bc06675a`.
- 61 dòng chỉ có tổ hợp ngoài danh sách chính thức (A03, A04, D04, D06...) nên không tính được điểm (`dds-6740e5ba`, `dnu-d031a738`); 367 dòng lẫn mã lạ, mã đó bị bỏ lặng lẽ (`dbh-e1188a6e`).
- Học phí ước tính cao bất thường: HIU Y Dược 180 triệu (`hiu-02b30c5f`), NTT 95 triệu (`ntt-02bcda66`); 107 dòng ước tính trên 60 triệu ngoài Y Dược ở QST, LPS, UEF, HSU, SIU, VGU, FPT.
- Trùng khác id: 6 nhóm theo (mã, tên chuẩn hóa, phương thức), ví dụ `tsn-244218df`/`tsn-9d787902`, `yds-2f815521`/`yds-c92db48c`; 1 cặp chỉ khác NBSP `gta-47c7acc0`/`gta-0d6f3f34`.
- Kiểm định ngược dự báo: phủ 89,4% (2023), 94,9% (2024), chỉ 63,9% (2025); test chỉ đòi ≥ 60%.

## Mức thấp

- 28 tên ngành có NBSP/khoảng trắng thừa; 4 tên còn `\r\n` (`bka-8b31f37d`, `bka-0bfcdede`, `htc-f82ca2d9`).
- 4 dòng lặp mã tổ hợp (`dnt-7421eb87`, `hsu-3a4a45ef`, `ddt-48e81911`).
- 10 dòng `nguon-nam` có năm không có trong `diem` (`dtn-92b7305f`).
- 356 nhóm biến thể gần trùng (tiên tiến, CLC, tiếng Anh): phần lớn là chương trình khác nhau, **không gộp hàng loạt**; chỉ gộp cặp cùng điểm và cùng tên gốc.
- 65% chương trình chỉ có 1 năm điểm (thông tin).

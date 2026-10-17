# Machine learning: dự báo điểm chuẩn 2027 cho từng ngành

Tài liệu cho pitch deck. Mọi con số lấy từ `ml/ket-qua-du-bao-2027.json`, sinh bởi `python -I ml/huan-luyen-2027.py`; chạy lại ra đúng các số này. Bài toán bắt buộc của hệ thống tư vấn tuyển sinh: dự đoán điểm chuẩn năm tiếp theo (2027) cho từng chương trình, hiển thị ở trang chi tiết ngành ngay dưới dòng "Điểm chuẩn 2026".

Kết quả đã được huấn luyện lại trên dữ liệu sau khi áp dụng đúng quy tắc của ứng dụng: điểm THPT đúng 15,0 không được coi là điểm chuẩn riêng của ngành (xem mục 3).

## 1. Bài toán

- Đầu vào: điểm chuẩn các năm đã có của một chương trình (xét theo điểm thi tốt nghiệp THPT, thang 30), cùng thông tin trường, nhóm ngành, nguồn dữ liệu.
- Đầu ra: **khoảng dự đoán điểm chuẩn 2027** (cận thấp, mức giữa, cận cao), mục tiêu độ phủ 80%.
- Điều không làm: không dự đoán xác suất đậu (đó là bước sau, dùng khoảng này cùng điểm của học sinh).

## 2. Dữ liệu

| Mục | Số liệu |
|---|---|
| Chương trình xét điểm thi THPT trong dữ liệu | 3.320 chương trình |
| Chỉ có mức sàn 15,0 (không có điểm chuẩn hợp lệ, **không đưa vào mô hình**) | 603 chương trình; 843 điểm bằng 15,0 bị loại |
| Chương trình có điểm chuẩn hợp lệ | **2.717** |
| Trong đó có điểm từ 2 năm trở lên | 904 (33,3%) |
| Cặp huấn luyện (chương trình, năm đích) | 1.203: năm 2023: 337, 2024: 500, 2025: 346 (2022: 20) |
| Năm điểm hợp lệ mới nhất của từng chương trình | 2026: 1.474, 2025: 533, 2024: 494, 2023: 206, 2022: 10 |
| Chương trình được dự báo 2027 | **2.501** (có điểm hợp lệ từ 2024 trở lại đây) |

Nguồn: đề án tuyển sinh chính thức của trường (PDF có số trang) và trang tổng hợp điểm chuẩn (gắn nhãn "chưa đối chiếu"). Không có số liệu giả lập. Pipeline thu thập và làm sạch: `scripts/` (phân nhóm ngành, chuẩn hóa tỉnh theo 34 tỉnh thành, loại dòng rác, đối chiếu mã trường).

Đặc điểm quyết định cách làm: **hai phần ba chương trình chỉ có một điểm duy nhất**, nên không thể ngoại suy xu hướng riêng của chúng.

## 3. Tiền xử lý

- Chỉ giữ phương thức điểm thi THPT: điểm học bạ, ĐGNL, xét kết hợp có thang khác (100, 600 đến 1.200), không so được.
- **Điểm đúng 15,0 bị loại khỏi điểm chuẩn.** Lý do: 15,0 là điểm sàn xét tuyển chung; nguồn dữ liệu không có trường nào phân biệt điểm sàn với điểm chuẩn (các dòng đúng 15 có cấu trúc giống hệt dòng khác), nên đây là quy tắc thận trọng của ứng dụng (`src/engine/trang-thai-du-lieu.ts`), không phải khẳng định về nguồn. Ngành chỉ có mức sàn không có dự báo. Nếu sau này đối chiếu được đề án và xác nhận một trường áp dụng điểm chuẩn phẳng, cần đưa dữ liệu có cấu trúc đó vào và đổi quy tắc, không đổi bằng cách đoán theo con số.
- Mỗi chương trình một chuỗi điểm theo năm; loại điểm ngoài [10, 30]; gộp trùng; phân nhóm ngành bằng bộ luật có thứ tự (`scripts/phan_nhom_nganh.py`).
- Cặp huấn luyện chỉ lấy khi khoảng cách năm không quá 3.
- Không dùng thông tin tương lai: mọi thống kê nhóm (trung bình điểm theo trường, theo nhóm ngành) chỉ tính từ các cặp có năm đích nhỏ hơn năm kiểm tra.
- Danh sách 32 cặp năm liên tiếp lệch từ 6 điểm trở lên để đối chiếu với nguồn: `docs/audits/data-anomalies.csv` (sinh bởi `ml/ngoai-lai.py`).

## 4. Khám phá dữ liệu (EDA)

- Biến đích: độ thay đổi so với điểm năm gần nhất. Trung bình theo năm đích: +0,59 (2023), +0,85 (2024), +0,09 (2025). Độ lệch chuẩn: 1,79, 1,60, **2,40**: biến động tăng vọt ở 2025.
- Theo mức điểm gần nhất: dưới 18: +1,54; 18 đến 21: +1,22; 21 đến 24: +0,38; từ 24: -0,07. Ngành điểm thấp tăng nhiều hơn, ngành điểm cao ổn định hơn (hiệu ứng hồi quy về trung bình).
- Theo nguồn: nguồn đề án có độ lệch chuẩn 2,01; trang tổng hợp 1,12 (chỉ 71 cặp).
- Phân phối biến động có đuôi dày: phân vị 1%, 5%, 95%, 99% là -5,00, -3,00, +3,80, +5,80 điểm.

## 5. Kỹ thuật đặc trưng (feature engineering)

| Nhóm | Đặc trưng | Ý nghĩa |
|---|---|---|
| Lịch sử riêng | `diem_gan`, `so_nam`, `delta_gan`, `delta_tb`, `dao_dong`, `cach` | mức điểm, độ dài lịch sử, biến động gần nhất, trung bình trượt, độ lệch chuẩn, số năm cách xa |
| Cấu trúc | `so_to_hop`, `tier` | số tổ hợp xét; nguồn đề án hay trang tổng hợp |
| Nhóm (chỉ tính từ tập huấn luyện) | `lech_nhom`, `lech_truong`, `dl_nhom` | điểm so với trung bình nhóm ngành và trường; biến động trung bình của nhóm ngành |

## 6. Mô hình và vòng lặp thử nghiệm

Mô hình cuối: **LightGBM hồi quy phân vị** (phân vị 10%, 50%, 90% của độ thay đổi), trung bình 5 hạt giống, 120 cây, 5 lá, chính quy hóa mạnh vì dữ liệu ít. Sau đó nhân độ rộng khoảng với hệ số **1,72** để bù hiệu ứng "biến động năm sau lớn hơn lịch sử", rồi áp hai ràng buộc: cận dưới không thấp hơn điểm sàn 15; độ thay đổi một năm không vượt phân vị 1% và 99% lịch sử.

Quá trình lặp lại (mỗi vòng có kiểm định lăn theo thời gian, huấn luyện chỉ bằng năm đích trước năm kiểm tra):

| Vòng | Thử | Kết quả | Quyết định |
|---|---|---|---|
| 1 | Dự báo điểm: giữ nguyên, trung bình 2 năm, xu hướng tắt dần, Ridge, GBM | MAE tốt nhất vẫn là "giữ nguyên" 1,44; GBM giảm RMSE 2% (2,00 so với 2,05) | Dự báo điểm đơn lẻ gần như không thắng được; chuyển sang dự báo khoảng |
| 2 | Thêm đặc trưng nhóm | Không cải thiện thêm trên MAE | Giữ để tạo khoảng |
| 3 | Khoảng bằng phân vị theo nhóm, và GBM phân vị chưa hiệu chỉnh | Độ phủ chỉ khoảng 56% đến 61% thay vì 80% | Cần hiệu chỉnh |
| 4 | Hiệu chỉnh conformal ngẫu nhiên | Vẫn phủ khoảng 58%: tập hiệu chỉnh và năm tương lai không cùng phân phối (độ lệch 2025 tăng) | Hiệu chỉnh bằng hệ số co giãn chọn trên kiểm định lăn |
| 5 | Hệ số co giãn 1,71; khoảng dự báo của một số ngành điểm thấp rộng tới 13 điểm | Không dùng được | Thêm ràng buộc điểm sàn 15 |
| 6 | Trần theo phân vị 5% đến 95% so với 1% đến 99% | Trần 5% đến 95%: độ phủ ngoài mẫu 69,9%; trần 1% đến 99%: 73,1% | Chọn trần 1% đến 99% |

## 7. Kết quả kiểm định (kiểm định lăn theo thời gian)

Dự báo điểm (độ thay đổi trung vị, so với giữ nguyên):

| Năm kiểm tra | MAE giữ nguyên | MAE mô hình | RMSE giữ nguyên | RMSE mô hình |
|---|---|---|---|---|
| 2024 (500 chương trình) | 1,207 | 1,251 | 1,804 | 1,734 |
| 2025 (346 chương trình) | 1,780 | 1,732 | 2,395 | 2,349 |

Kết luận trung thực: sai số bình phương giảm ở cả hai năm (4% và 2%); sai số tuyệt đối tăng 4% năm 2024 và giảm 3% năm 2025. Lợi thế về điểm trung tâm nhỏ và không đều, chưa đủ để khẳng định mô hình hơn rõ rệt cách giữ nguyên.

Dự báo khoảng 80%, ở **cùng độ phủ 80%** (so công bằng bằng cách co giãn khoảng):

| Phương án | Độ rộng trung bình | Điểm Winkler (thấp hơn là tốt hơn) |
|---|---|---|
| Heuristic cũ (phân vị toàn cục x 1,3 x căn số năm) | 4,42 | 7,99 |
| Phân vị theo nhóm (không máy học) | 5,43 | 7,94 |
| **LightGBM phân vị + hiệu chỉnh + ràng buộc (mô hình dùng trong app)** | 5,08 | **7,65** |

Ở cùng độ phủ, điểm Winkler của mô hình học máy thấp hơn khoảng 4% so với heuristic cũ. Lợi thế có thật nhưng nhỏ: mô hình đặt khoảng đúng chỗ hơn (ngành điểm thấp hay tăng, ngành điểm cao ổn định) chứ không làm khoảng hẹp đi.

Độ phủ theo từng năm sau hiệu chỉnh: 82,8% (2024), 75,7% (2025).

**Phép thử ngoài mẫu trung thực:** hệ số co giãn chọn chỉ từ 2024, áp cho 2025: độ phủ **73,1%** (Winkler 9,22), thấp hơn mục tiêu 80% vì biến động 2025 lớn hơn mọi năm trước. Nói cách khác khoảng này đúng với các năm đã thấy; nếu biến động năm sau lớn bất thường, độ phủ có thể xuống khoảng 73%.

## 8. Triển khai

- Huấn luyện lại trên toàn bộ 1.203 cặp, dự báo 2027 cho 2.501 chương trình, ghi vào `src/data/du-bao-2027.json` (mỗi chương trình: cận thấp, mức giữa, cận cao, năm điểm cơ sở).
- Ứng dụng nạp tệp một lần (không chạy mô hình trên trình duyệt). Hook `useTrangThaiDuLieu` thay khoảng thống kê cũ bằng khoảng của mô hình khi quy tắc dữ liệu cho phép dự báo (có điểm chuẩn hợp lệ, không quá cũ) và khi cùng năm điểm cơ sở; nên khối "Điểm chuẩn năm tới có thể ở đâu?", danh sách và bảng so sánh trong chat dùng cùng một số. Trang chi tiết ngành có dòng "Điểm chuẩn dự đoán 2027 (mô hình học máy)" ngay dưới "Điểm chuẩn 2026".
- Kiểm thử: `tests/du-bao-ml.test.ts` (miền giá trị, thứ tự, sàn, ngành chỉ có mức sàn không có dự báo, khớp báo cáo huấn luyện, hàm áp dụng, Winkler thấp hơn heuristic cũ).

## 9. Hạn chế và hướng cải thiện

- Chỉ 3 năm đích có cặp, và hai phần ba chương trình chỉ có một điểm: tín hiệu riêng của từng ngành yếu. Cải thiện chắc chắn nhất là thêm dữ liệu.
- Thiếu các biến giải thích lớn nhất của điểm chuẩn: chỉ tiêu từng năm, số thí sinh đăng ký, phổ điểm thi do Bộ công bố, điểm chuẩn 2018 đến 2021. Nguồn công khai tổng hợp hiện chưa cung cấp chỉ tiêu theo ngành; đề án PDF có nhưng cần OCR từng trường.
- Khoảng 80% chưa được bảo đảm khi biến động vĩ mô thay đổi (bằng chứng: 73,1% ngoài mẫu).
- 603 chương trình chỉ có mức sàn 15 không được dự báo. Nếu về sau xác nhận được một số trường áp dụng điểm chuẩn phẳng, cần dữ liệu có cấu trúc từ đề án để đưa trở lại.
- Dữ liệu chưa được thẩm định độc lập toàn danh mục: nhiều điểm đến từ trang tổng hợp chưa đối chiếu đề án (xem `docs/audits/data-quality.md`).

## 10. Tái lập

```
python -I ml/eda_du_lieu.py              # thống kê dữ liệu
python -I ml/ngoai-lai.py                # danh sách biến động bất thường
python -I ml/thu-nghiem.py               # vòng 1-2: so các mô hình dự báo điểm
python -I ml/thu-nghiem-khoang.py        # vòng 3-4: các cách dự báo khoảng
python -I ml/thu-nghiem-rang-buoc.py     # vòng 5-6: ràng buộc sàn và trần
python -I ml/so-sanh-cung-do-phu.py      # so công bằng ở cùng độ phủ 80%
python -I ml/huan-luyen-2027.py          # huấn luyện cuối, kiểm định, xuất dự báo 2027
```

## Gợi ý 6 slide cho phần ML

1. Bài toán và vì sao khó: dự đoán điểm chuẩn 2027 từng ngành; hai phần ba chương trình chỉ có một điểm.
2. Dữ liệu: 2.717 chương trình có điểm chuẩn hợp lệ, 1.203 cặp huấn luyện, nguồn và làm sạch; vì sao loại mức sàn 15.
3. EDA và đặc trưng: biến động theo năm (độ lệch 1,6 lên 2,4), theo mức điểm; bảng đặc trưng.
4. Mô hình và vòng lặp: bảng 6 vòng, nói thẳng điều gì thất bại.
5. Kết quả: bảng Winkler ở cùng độ phủ 80% (7,65 so với 7,99); ngoài mẫu 73,1%.
6. Triển khai và giá trị: dòng dự đoán 2027 trong app; giới hạn dữ liệu và lộ trình (chỉ tiêu, phổ điểm Bộ).

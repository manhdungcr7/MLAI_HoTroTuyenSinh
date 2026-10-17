# Machine learning: dự báo điểm chuẩn 2027 cho từng ngành

Tài liệu cho pitch deck. Mọi con số lấy từ `ml/ket-qua-du-bao-2027.json`, sinh bởi `python -I ml/huan-luyen-2027.py`; chạy lại ra đúng các số này. Bài toán bắt buộc của hệ thống tư vấn tuyển sinh: dự đoán điểm chuẩn năm tiếp theo (2027) cho từng chương trình, hiển thị ở trang chi tiết ngành ngay dưới dòng "Điểm chuẩn 2026".

## 1. Bài toán

- Đầu vào: điểm chuẩn các năm đã có của một chương trình (xét theo điểm thi tốt nghiệp THPT, thang 30), cùng thông tin trường, nhóm ngành, nguồn dữ liệu.
- Đầu ra: **khoảng dự đoán điểm chuẩn 2027** (cận thấp, mức giữa, cận cao), mục tiêu độ phủ 80%.
- Điều không làm: không dự đoán xác suất đậu (đó là bước sau, dùng khoảng này cùng điểm của học sinh).

## 2. Dữ liệu

| Mục | Số liệu |
|---|---|
| Chương trình xét điểm thi THPT | 3.320 chương trình, 116 trường |
| Có điểm từ 2 năm trở lên | 1.048 (chiếm 31,6%) |
| Cặp huấn luyện (chương trình, năm đích) | 1.443: năm 2023: 396, 2024: 612, 2025: 413 (2022: 22) |
| Năm điểm mới nhất của từng chương trình | 2026: 1.679, 2025: 877, 2024: 527, 2023: 225, 2022: 12 |
| Chương trình có điểm đúng bằng sàn 15 | 616 (18,5%) |
| Chương trình được dự báo 2027 | 3.083 (có điểm từ 2024 trở lại đây) |

Nguồn: đề án tuyển sinh chính thức của trường (PDF có số trang) và trang tổng hợp điểm chuẩn (gắn nhãn "chưa đối chiếu"). Không có số liệu giả lập. Pipeline thu thập và làm sạch: `scripts/` (phân nhóm ngành, chuẩn hóa tỉnh theo 34 tỉnh thành, loại dòng rác, đối chiếu mã trường).

Đặc điểm quyết định cách làm: **hơn hai phần ba chương trình chỉ có một điểm duy nhất**, nên không thể ngoại suy xu hướng riêng của chúng.

## 3. Tiền xử lý

- Chỉ giữ phương thức điểm thi THPT: điểm học bạ, ĐGNL, xét kết hợp có thang khác (100, 600 đến 1.200), không so được.
- Mỗi chương trình một chuỗi điểm theo năm; loại điểm ngoài [10, 30]; gộp trùng; phân nhóm ngành bằng bộ luật có thứ tự (`scripts/phan_nhom_nganh.py`).
- Cặp huấn luyện chỉ lấy khi khoảng cách năm không quá 3.
- Không dùng thông tin tương lai: mọi thống kê nhóm (trung bình điểm theo trường, theo nhóm ngành) chỉ tính từ các cặp có năm đích nhỏ hơn năm kiểm tra.

## 4. Khám phá dữ liệu (EDA)

- Biến đích: độ thay đổi so với điểm năm gần nhất. Trung bình theo năm đích: +0,52 (2023), +0,83 (2024), +0,26 (2025). Độ lệch chuẩn: 1,78, 1,62, **2,60**: biến động tăng vọt ở 2025.
- Theo mức điểm: ngành điểm đến 21 tăng nhiều hơn (trung bình +1,0 đến +1,4), ngành điểm từ 21 trở lên ổn định hơn (+0,4 đến -0,15): hiệu ứng hồi quy về trung bình và hiệu ứng sàn.
- **Hiệu ứng sàn:** 616 chương trình đứng đúng 15 điểm (điểm tối thiểu Bộ quy định). Với các ngành này điểm chuẩn không đo được độ cạnh tranh, và cận dưới của dự báo không thể thấp hơn 15.
- Phân phối biến động có đuôi dày: phân vị 1%, 5%, 95%, 99% là -5,13, -2,77, +4,06, +6,41 điểm.

## 5. Kỹ thuật đặc trưng (feature engineering)

| Nhóm | Đặc trưng | Ý nghĩa |
|---|---|---|
| Lịch sử riêng | `diem_gan`, `so_nam`, `delta_gan`, `delta_tb`, `dao_dong`, `cach` | mức điểm, độ dài lịch sử, biến động gần nhất, trung bình trượt, độ lệch chuẩn, số năm cách xa |
| Hiệu ứng sàn | `o_san` | đang đứng đúng điểm sàn 15 |
| Cấu trúc | `so_to_hop`, `tier` | số tổ hợp xét; nguồn đề án hay trang tổng hợp |
| Nhóm (chỉ tính từ tập huấn luyện) | `lech_nhom`, `lech_truong`, `dl_nhom` | điểm so với trung bình nhóm ngành và trường; biến động trung bình của nhóm ngành |

## 6. Mô hình và vòng lặp thử nghiệm

Mô hình cuối: **LightGBM hồi quy phân vị** (phân vị 10%, 50%, 90% của độ thay đổi), trung bình 5 hạt giống, 120 cây, 5 lá, chính quy hóa mạnh vì dữ liệu ít. Sau đó nhân độ rộng khoảng với hệ số **1,73** để bù hiệu ứng "biến động năm sau lớn hơn lịch sử", rồi áp hai ràng buộc: cận dưới không thấp hơn điểm sàn 15; độ thay đổi một năm không vượt phân vị 1% và 99% lịch sử.

Quá trình lặp lại (mỗi vòng có kiểm định lăn theo thời gian, huấn luyện chỉ bằng năm đích trước năm kiểm tra):

| Vòng | Thử | Kết quả | Quyết định |
|---|---|---|---|
| 1 | Dự báo điểm: giữ nguyên, trung bình 2 năm, xu hướng tắt dần, Ridge, GBM (3 bộ đặc trưng) | Sai số tuyệt đối trung bình (MAE) tốt nhất vẫn là "giữ nguyên" 1,44; GBM giảm sai số bình phương (RMSE) 2% (2,10 so với 2,14) | Dự báo điểm đơn lẻ gần như không thắng được; chuyển sang dự báo khoảng |
| 2 | Thêm đặc trưng nhóm, đặc trưng sàn | Không cải thiện thêm trên MAE | Giữ để tạo khoảng, không để tăng độ chính xác điểm |
| 3 | Khoảng bằng phân vị theo nhóm, và GBM phân vị chưa hiệu chỉnh | Độ phủ chỉ 56% đến 61% thay vì 80% | Cần hiệu chỉnh |
| 4 | Hiệu chỉnh conformal ngẫu nhiên | Vẫn phủ 58%: tập hiệu chỉnh và năm tương lai không cùng phân phối (độ lệch 2025 tăng) | Hiệu chỉnh theo năm, bằng hệ số co giãn chọn trên kiểm định lăn |
| 5 | Hệ số co giãn 1,71 (chọn để phủ 80%); khoảng dự báo của một số ngành điểm thấp rộng tới 13 điểm | Không dùng được | Thêm ràng buộc điểm sàn 15 |
| 6 | Trần theo phân vị 5% đến 95% | 86% cận dưới chạm trần: mất tính thích ứng | Đổi sang trần phân vị 1% đến 99% (rộng hơn, không chạm nhiều) |

## 7. Kết quả kiểm định (kiểm định lăn theo thời gian)

Dự báo điểm (độ thay đổi trung vị, so với giữ nguyên):

| Năm kiểm tra | MAE giữ nguyên | MAE mô hình | RMSE giữ nguyên | RMSE mô hình |
|---|---|---|---|---|
| 2024 (612 chương trình) | 1,147 | 1,198 | 1,820 | 1,782 |
| 2025 (413 chương trình) | 1,864 | 1,887 | 2,607 | 2,579 |

Kết luận trung thực: mô hình **không** giảm sai số tuyệt đối so với giữ nguyên (tăng 1% đến 4%), chỉ giảm nhẹ sai số bình phương (1% đến 2%). Điểm trung tâm của dự đoán gần bằng điểm năm trước cộng một độ dịch nhỏ (trung vị +0,4).

Dự báo khoảng 80%, ở **cùng độ phủ 80%** (so công bằng bằng cách co giãn khoảng):

| Phương án | Độ rộng trung bình | Điểm Winkler (thấp hơn là tốt hơn) |
|---|---|---|
| Heuristic cũ (phân vị toàn cục x 1,3 x căn số năm) | 4,40 | 8,32 |
| Phân vị theo nhóm (không máy học) | 5,24 | 8,36 |
| **LightGBM phân vị + hiệu chỉnh + ràng buộc (mô hình dùng trong app)** | 4,80 | **7,52** |

Mô hình học máy cho khoảng đúng chỗ hơn: điểm Winkler thấp hơn 9,6% so với heuristic cũ ở cùng độ phủ. Mô hình học được rằng ngành điểm thấp hay tăng, ngành điểm cao ổn định, và có hiệu ứng sàn.

Độ phủ theo từng năm sau hiệu chỉnh: 82,2% (2024), 76,8% (2025).

**Phép thử ngoài mẫu trung thực:** hệ số co giãn chọn chỉ từ 2024, áp cho 2025: độ phủ **75,5%** (Winkler 9,00), thấp hơn mục tiêu 80% vì biến động 2025 lớn hơn mọi năm trước. Nói cách khác khoảng này đúng với các năm đã thấy; nếu biến động năm sau lớn bất thường, độ phủ có thể thấp hơn.

## 8. Triển khai

- Huấn luyện lại trên toàn bộ 1.443 cặp, dự báo 2027 cho 3.083 chương trình, ghi vào `src/data/du-bao-2027.json` (mỗi chương trình: cận thấp, mức giữa, cận cao, năm điểm cơ sở).
- Ứng dụng nạp tệp một lần (không chạy mô hình trên trình duyệt). Trang chi tiết ngành: dòng "Điểm chuẩn dự đoán 2027 (mô hình học máy)" ngay dưới "Điểm chuẩn 2026", cùng khoảng 80% và khối "Điểm chuẩn năm tới có thể ở đâu?". Bảng so sánh trong chat dùng cùng khoảng này.
- Kiểm thử: `tests/du-bao-ml.test.ts` (miền giá trị, thứ tự, sàn, khớp báo cáo huấn luyện, Winkler thấp hơn heuristic cũ).

## 9. Hạn chế và hướng cải thiện

- Chỉ 3 năm đích có cặp, và hơn hai phần ba chương trình chỉ có một điểm: tín hiệu riêng của từng ngành yếu. Cải thiện chắc chắn nhất là thêm dữ liệu.
- Thiếu các biến giải thích lớn nhất của điểm chuẩn: chỉ tiêu từng năm, số thí sinh đăng ký, phổ điểm thi do Bộ công bố, điểm chuẩn 2018 đến 2021. Nguồn công khai tổng hợp hiện chưa cung cấp chỉ tiêu theo ngành; đề án PDF có nhưng cần OCR từng trường.
- Khoảng 80% chưa được bảo đảm khi biến động vĩ mô thay đổi (bằng chứng: 75,5% ngoài mẫu).
- Hơn một phần năm ngành đứng đúng điểm sàn 15: dự báo của chúng chủ yếu cho biết "không thấp hơn sàn", không phân biệt được độ cạnh tranh.

## 10. Tái lập

```
python -I ml/eda_du_lieu.py              # thống kê dữ liệu
python -I ml/thu-nghiem.py               # vòng 1-2: so các mô hình dự báo điểm
python -I ml/thu-nghiem-khoang.py        # vòng 3-4: các cách dự báo khoảng
python -I ml/thu-nghiem-rang-buoc.py     # vòng 5-6: ràng buộc sàn và trần
python -I ml/so-sanh-cung-do-phu.py      # so công bằng ở cùng độ phủ 80%
python -I ml/huan-luyen-2027.py          # huấn luyện cuối, kiểm định, xuất dự báo 2027
```

## Gợi ý 6 slide cho phần ML

1. Bài toán và vì sao khó: dự đoán điểm chuẩn 2027 từng ngành; 68% chương trình chỉ có một điểm.
2. Dữ liệu: 3.320 chương trình, 1.443 cặp huấn luyện, nguồn và làm sạch; hiệu ứng sàn 15 (616 ngành).
3. EDA và đặc trưng: biến động theo năm (độ lệch 1,6 lên 2,6), theo mức điểm; bảng đặc trưng.
4. Mô hình và vòng lặp: bảng 6 vòng, nói thẳng điều gì thất bại.
5. Kết quả: bảng Winkler ở cùng độ phủ 80% (7,52 so với 8,32); ngoài mẫu 75,5%.
6. Triển khai và giá trị: dòng dự đoán 2027 trong app; giới hạn dữ liệu và lộ trình (chỉ tiêu, phổ điểm Bộ).

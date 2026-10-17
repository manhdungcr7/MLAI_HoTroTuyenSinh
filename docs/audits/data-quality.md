# Chất lượng dữ liệu tuyển sinh

**Cập nhật 2026-10-17:** xem [báo cáo hiện tại](data-quality-2026-10-17.md) và [danh sách 118 trường cần đối chiếu](data-quality-schools.csv). Đã sửa phân loại/hợp nhất điểm, bổ sung 13 điểm UIT THPT 2025 có nguồn và metadata; toàn danh mục vẫn chưa đạt cổng chất lượng thương mại (`npm run data:audit -- --strict` trả mã 1). Chưa sửa dữ liệu production.

## Báo cáo lịch sử 2026-10-16

Audit cục bộ ngày 2026-10-16. Tái lập bằng `npx tsx scripts/audit-admissions-data.ts`. Script chỉ đọc dữ liệu trong repository, không gọi mạng, không cập nhật CMS và không tự nâng trạng thái xác minh.

## Phạm vi đã đo

| Chỉ số | Kết quả |
| --- | ---: |
| Trường trong danh mục | 118 |
| Chương trình/phương thức | 3.648 |
| THPT | 3.320 |
| Học bạ | 220 |
| ĐGNL khác / ĐGNL TP.HCM / ĐGTD | 65 / 5 / 8 |
| Kết hợp / năng khiếu | 21 / 9 |
| Nhãn nguồn `official_pdf` / `aggregator_verified` trong dữ liệu cũ | 1.492 / 2.156 |
| Chương trình thiếu URL nguồn chính | 56 |
| Chương trình thiếu liên kết nguồn theo năm | 2.162 |
| Chương trình không ghi tổ hợp | 1 |
| Có tổ hợp nhưng engine chưa hỗ trợ môn | 93 |
| Trùng ID / điểm sai hình dạng / điểm THPT ngoài thang 30 | 0 / 0 / 0 |
| Học phí có số / trong đó ước tính | 3.648 / 3.047 |

Số bản ghi có điểm theo năm: 2021: 22; 2022: 487; 2023: 1.017; 2024: 1.181; 2025: 1.029; 2026: 1.679. Một chương trình có thể có nhiều năm. Đây là năm của số liệu, không phải ngày xác minh hay bằng chứng số liệu còn hiệu lực.

## Hợp đồng trả dữ liệu

- `search_universities`, `get_university`, `search_majors`, `get_admission_rules` dùng cùng bản dữ liệu đi kèm bản phát hành. Chưa nối kho CMS trực tiếp trên server. Không mô tả chúng là dữ liệu thời gian thực.
- `sourceTier` giữ nhãn nguồn cũ để truy vết; không đồng nghĩa với xác minh độc lập. Mọi chương trình trả `verificationStatus: not_independently_verified`, `lastVerifiedAt: null`, `lastUpdatedAt: null`; URL có mặt không tự chuyển trạng thái.
- Điểm lịch sử giữ nguyên theo năm. Điểm thiếu là `null`, kể cả năm mới nhất thiếu điểm và năm cũ có điểm. Không thay bằng 0, không tự điền năm mới hay tạo xác suất đỗ.
- Học phí giữ nguồn, năm và cờ ước tính. Có con số ước tính không chứng minh chương trình phù hợp ngân sách.
- Phương thức và tổ hợp đã trích không phải bộ điều kiện dự tuyển. Điều kiện, trọng số, quy đổi và năm áp dụng đã xác minh trả `null` khi repository chưa có dữ liệu có cấu trúc.
- `calculate_admission_score` gọi engine ưu tiên hiện có. Chỉ tính THPT ba môn, hệ số 1, thang 30; công thức được ghi là `implementation_only`, không được mô tả là đã kiểm tra quy chế hiện hành.
- Bản chụp học sinh chỉ có tổng tổ hợp cao nhất, không có điểm từng môn. Gợi ý chỉ so chương trình THPT ghi đúng tổ hợp đó. Chương trình khác tổ hợp/phương thức, thiếu điểm hay thiếu tổ hợp không được gắn nhãn phù hợp điểm.
- Nhãn `Thử sức`, `Vừa sức`, `An toàn`, `Dự phòng` tái dùng thuật toán hiện có và chỉ là khoảng cách tới điểm lịch sử. Thứ tự nguyện vọng theo sở thích học sinh; capability không tự xếp theo điểm chuẩn.

## Giới hạn trước khi vận hành dữ liệu như nguồn đã kiểm chứng

Cần đối chiếu tài liệu gốc theo trường, chương trình, phương thức và năm; lưu người kiểm, thời điểm, điều kiện đủ tư cách, trọng số, công thức quy đổi. Cần kiểm tra URL và ghi thời điểm kiểm; audit hiện tại chưa làm các bước này. Cần bổ sung nguồn cho 56 bản ghi thiếu URL và 2.162 bản ghi thiếu nguồn theo năm, cùng chứng cứ học phí cho 3.047 bản ghi ước tính. Những thiếu sót này được trả rõ trong dữ liệu thay vì che bằng số giả hoặc nhãn đã xác minh.

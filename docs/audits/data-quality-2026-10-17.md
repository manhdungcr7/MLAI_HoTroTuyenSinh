# Chất lượng dữ liệu tuyển sinh — 2026-10-17

**Chưa đủ điều kiện coi toàn bộ danh mục là dữ liệu đã kiểm chứng để triển khai thương mại.** Đã rà soát cấu trúc toàn bộ dữ liệu đóng gói, sửa lỗi phân loại/hợp nhất, và đối chiếu bảng THPT 2025 của UIT. Chưa đối chiếu thủ công tất cả trường, chưa truy cập hay sửa CMS production.

## Tái lập

```powershell
npm run data:audit
npm run data:audit -- --write
npm run data:audit -- --strict
npm run test:data-quality
```

Script audit chỉ đọc dữ liệu tuyển sinh cục bộ. `--write` ghi chi tiết vào `.agent-runtime/data-audit/catalog-audit.json` và danh sách 118 trường vào `docs/audits/data-quality-schools.csv`; không sửa số liệu. `--strict` trả mã 1 khi còn thiếu bằng chứng loại điểm, thẩm định độc lập, nguồn theo năm hoặc còn học phí ước tính. Đây là cổng chất lượng dữ liệu, không thay thế kiểm tra vận hành/bảo mật toàn ứng dụng.

## Kết quả sau sửa

| Chỉ số | Kết quả |
| --- | ---: |
| Trường / chương trình-phương thức | 118 / 3.648 |
| Ô điểm theo năm | 5.428 |
| Thiếu URL nguồn chính | 56 chương trình |
| Không có nguồn theo năm nào | 2.162 chương trình |
| Ô điểm thiếu nguồn đúng năm | 2.422 |
| Chương trình thiếu nguồn cho điểm mới nhất | 2.259 |
| Ô điểm chưa có bằng chứng loại điểm/thang điểm có cấu trúc | 5.415 |
| Ô điểm chưa ghi nhận thẩm định độc lập | 5.428 |
| Chương trình THPT có mức 15 cần ưu tiên đối chiếu | 703 |
| Trùng ID / nhóm trùng tên-trường-phương thức-tập tổ hợp | 0 / 0 |
| Điểm sai hình dạng / điểm THPT ngoài thang 30 | 0 / 0 |
| Có tổ hợp nhưng engine chưa hỗ trợ môn | 93 chương trình |
| Học phí có số / trong đó ước tính | 3.648 / 3.047 |

**703 không phải số bản ghi đã xác định là điểm sàn.** Một điểm chuẩn thật có thể bằng 15. Chỉ văn bản đúng ngành, năm, phương thức và đợt tuyển sinh mới quyết định loại điểm. Phép tìm trùng cũng chưa chứng minh không còn ngành bị gán nhầm hoặc biến thể tên.

Phân bố năm: 2021: 22; 2022: 487; 2023: 1.017; 2024: 1.181; 2025: 1.042; 2026: 1.679. Không tự coi số liệu 2026 là dự kiến chỉ vì lấy từ nguồn thứ cấp.

## Lỗi đã sửa

1. Bỏ suy luận mọi điểm THPT bằng 15 là điểm sàn; bỏ khẳng định điểm phương thức khác đã được quy đổi sang thang 30 chỉ vì trị số nhỏ hơn 30.
2. CMS kiểm `loaiDiem: diem_chuan`, năm, phương thức, tổ hợp, giá trị hữu hạn và thang điểm trước khi nhận/gửi duyệt/phê duyệt/xuất bản điểm chuẩn. Nguồn có tiêu đề chỉ nói điểm sàn/ngưỡng nhận hồ sơ bị chặn; trích dẫn MCP mô tả điểm sàn cũng bị chặn. Kiểm chuỗi không thay thế đọc văn bản gốc, nhất là tài liệu chứa cả hai loại điểm.
3. Hợp nhất CMS giữ lịch sử từng năm; sửa năm cũ không làm lùi `namDiem`; kiểm đúng trường/phương thức; chỉ nhận THPT thang 30, loại điểm đã khai báo và có nguồn/ngày kiểm.
4. Không lấy max hoặc median giữa các tổ hợp/nguồn mâu thuẫn. `LuaChon` chỉ có một điểm chung mỗi năm: chỉ áp dụng khi nguồn ghi `TATCA`, hoặc đủ mọi tổ hợp với cùng một điểm. Khác điểm/thiếu tổ hợp thì giữ dữ liệu gốc chờ mô hình phù hợp, không tuyên bố dữ liệu gốc đã đúng.
5. Giữ nguồn hiệu chỉnh CMS theo năm trong trang ngành và tư vấn; không lấy nguồn năm khác làm bằng chứng cho năm đang hỏi. Capability sắp nguồn theo năm mới đến cũ trước khi giới hạn kết quả.
6. Script sinh chỉ mục CMS đợi nạp danh mục, ngăn ghi đè bằng danh mục rỗng; đã sinh lại chỉ mục sau bổ sung UIT. Chỉ mục cũ có 3.652 dòng, danh mục chuẩn có 3.648: loại 4 ID mồ côi, đồng bộ 169 dòng khác tên/năm/điểm/phương thức với danh mục app (gồm 13 dòng UIT). Đây là đồng bộ nội bộ, không phải xác minh chính thức 169 chương trình. Regression kiểm chỉ mục và app luôn khớp.
7. Sửa alias MCP che công cụ chính: `calculate_admission_score` đến đúng capability tính điểm; `get_study_plan` giữ timestamp cho xác nhận tiến độ. Tên cũ vẫn hoạt động.

Bản CMS cũ thiếu `loaiDiem`/`thangDiem` **không tự được nâng cấp thành đã kiểm chứng**. Bản đã xuất bản vẫn lưu để truy vết nhưng không ghi đè danh mục qua luồng mới; bản đang chờ cần đối chiếu và sửa metadata trước khi duyệt/xuất bản. Chưa áp dụng lên production.

## Đối chiếu thật: UIT THPT 2025

Nguồn: [thông báo UIT ngày 22/08/2025](https://tuyensinh.uit.edu.vn/node/4147), [bảng ảnh chính thức](https://tuyensinh.uit.edu.vn/sites/default/files/uploads/images/202508/trung_hoc_pho_thong_1.png). Đã đọc trực tiếp ảnh ngày 2026-10-17. SHA-256 ảnh: `a2850dcb05ae41749b5673bf2787b77772c799ed77591b24b256e69cd2f94e2d`.

| Chương trình có sẵn | Điểm 2025 bổ sung |
| --- | ---: |
| An toàn thông tin | 26,27 |
| Công nghệ thông tin | 26,60 |
| Công nghệ thông tin Việt Nhật | 24,20 |
| Hệ thống thông tin | 24,70 |
| Hệ thống thông tin tiên tiến | 24,20 |
| Khoa học dữ liệu | 27,70 |
| Khoa học máy tính | 27,20 |
| Kỹ thuật máy tính | 25,30 |
| Kỹ thuật phần mềm | 26,00 |
| Mạng máy tính và truyền thông dữ liệu | 24,00 |
| Thiết kế vi mạch | 27,00 |
| Thương mại điện tử | 24,57 |
| Trí tuệ nhân tạo | 29,60 |

Bảng ghi thang 30 và đã gồm điểm cộng/ưu tiên. Đã bổ sung 13 ô điểm, nguồn đúng năm, `scoreEvidence` gắn với trị số; bỏ dự kiến cũ ở 13 dòng này bằng `null`. Giữ nguyên điểm 2023/2024, không coi đối chiếu 2025 là xác minh các năm cũ. `checkedBy` ghi Codex đối chiếu ảnh; `independentReviewer` giữ `null`, `daKiemChung` vẫn `false`. `tier` là nhãn lineage cũ, không xác nhận định dạng/độ đúng của thông báo mới.

Bảng còn ngành **Truyền thông đa phương tiện, mã 7320104, điểm 25,00**, chưa có chương trình tương ứng. Chưa tạo chương trình với tổ hợp/học phí suy đoán; cần bổ sung đủ thông tin chương trình 2025 từ trường. [Thông báo UIT 2026](https://tuyensinh.uit.edu.vn/2026-thong-bao-diem-trung-tuyen-theo-phuong-thuc-xet-tuyen-tong-hop) ghi phương thức tổng hợp; không ghép vào lịch sử THPT như cùng một phương thức.

## Phần còn phải hoàn thiện trước thương mại

- Dùng [danh sách theo trường](data-quality-schools.csv) và `reviewQueue` trong JSON để đối chiếu từng ô điểm. Giữ đúng chương trình/cơ sở, năm, phương thức, tổ hợp và đợt; phân biệt sàn/trúng tuyển, bổ sung/đợt đầu, năm tài liệu/năm điểm.
- Ưu tiên QSX/GSA (mỗi trường 13 chương trình thiếu nguồn), rồi các trường còn thiếu URL; xác minh riêng 703 chương trình có mức 15. Không sửa hàng loạt dựa trên trị số.
- Bổ sung quy tắc/thang điểm/tổ hợp theo từng năm, điểm theo từng tổ hợp và điều kiện dự tuyển. Một tập tổ hợp cấp chương trình chưa chứng minh áp dụng cho mọi năm.
- Đối chiếu 3.047 học phí ước tính: phân biệt tín chỉ/năm/toàn khóa, cơ sở/chương trình và năm học; thiếu nguồn thì không quảng bá là học phí chính thức.
- Pipeline legacy còn mặc định năm khi thiếu tiêu đề, suy THPT khi thiếu phương thức và lấy median khi nguồn điểm mâu thuẫn (`legacy/pipeline/scrape/scrape_html_portals.py`, `legacy/pipeline/clean/reconcile.py`). Chưa chạy lại pipeline đó. Không tái xuất đè dữ liệu đã đối chiếu trước khi sửa và giữ `scoreEvidence`; test dữ liệu và audit strict sẽ phát hiện mất bằng chứng.
- Cần thẩm định độc lập sau đối chiếu bằng agent và kiểm snapshot CMS thực tế. Chưa có bằng chứng về độ phủ đầy đủ 118 trường hoặc xác nhận quy chế cho mọi năm. Công thức ưu tiên vẫn `implementation_only`.

Đối với pitch: trình bày danh mục và các trường đã đối chiếu theo đúng phạm vi trên. Chưa có cơ sở công bố toàn bộ dữ liệu chính thức/đã kiểm chứng hoặc toàn ứng dụng sẵn sàng production.

## Bằng chứng kiểm tra local

Base checkout cuối: `2d1270e` (PR phân bổ giờ học đã được cập nhật trong lúc audit). Nhánh sửa: `fix/admissions-data-quality-latest`. Đã giải quyết xung đột `package.json` bằng cách giữ cả test phân bổ giờ học và test dữ liệu.

Đã qua: `npm run typecheck`, `npm run kiem-tra`, `npm test`, `npm run test:mcp`, `npm run test:capabilities`, `npm run build`, `npm run build:functions`, `npm run cms:build`. Vite còn cảnh báo kích thước chunk, không phải lỗi build. `npm run data:audit -- --strict` trả mã 1 có chủ đích vì thiếu chứng cứ như bảng trên. Không push/merge, triển khai hay cập nhật cơ sở dữ liệu từ phiên làm việc này. Các đường dẫn landing được bảo vệ không có diff.

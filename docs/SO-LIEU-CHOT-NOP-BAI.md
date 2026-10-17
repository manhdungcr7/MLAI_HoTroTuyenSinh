# Số liệu chốt cho nộp bài (một bộ số cho cả đội)

Đo ngày 17/10/2026 trên nhánh `main` đã hợp nhất mới nhất. Mọi người trình bày, viết slide, trả lời hỏi đáp chỉ dùng bộ số dưới đây. Số đổi khi dữ liệu đổi: chạy lại lệnh, không sửa tay.

```bash
npx tsx scripts/so-lieu-nop-bai.mts          # số chính (thêm --json để máy đọc)
npx tsx tests/du-bao-diem-chuan.test.ts      # mức phủ kiểm định bỏ-một-năm của dự báo thống kê
```

## 1. Danh mục dữ liệu (nguồn: `so-lieu-nop-bai.mts`)

| Số | Giá trị | Ghi chú nói đúng |
|---|---|---|
| Chương trình / trường / tỉnh / nhóm ngành | 3.648 / 118 / 24 / 20 | Mỗi dòng là một (ngành, trường, phương thức). Không nói "3.652". |
| Chương trình xét điểm thi THPT | 3.320 | Còn lại là học bạ, ĐGNL, kết hợp: không so với điểm thi THPT. |
| Có điểm từ 2 năm trở lên (loại "nhiều năm") | 1.721 | Có tính điểm 2026 từ trang tổng hợp, nên không đồng nghĩa "2 năm đều từ đề án". |
| Chỉ có điểm 1 năm | 1.599 | Tham chiếu hạn chế. |
| Điểm của phương thức khác | 328 | Không so với điểm THPT. |
| Nguồn: đề án PDF / trang tổng hợp | 1.492 / 2.156 | Nhãn nguồn theo từng chương trình; trang tổng hợp là nguồn thứ cấp. |
| Chương trình có điểm năm 2026 | 2.082 | Phần lớn từ trang tổng hợp (tuyensinh247), bổ sung từ VnExpress; chưa đối chiếu đề án (mục 3). |
| Học phí đang hiển thị | 662 | Toàn bộ theo VnExpress (nguồn thứ cấp, có link trang trường trên VnExpress, nhãn "Theo VnExpress"). Học phí đã đối chiếu văn bản của chính trường: 0 chương trình đạt điều kiện hiển thị (`laHocPhiDaKiemChung`). Chương trình còn lại: "Chưa có học phí riêng ngành". |
| Tỷ lệ có việc làm | 121 | Từ đề án; còn lại "chưa có". |
| Chỉ tiêu theo ngành | 421 bản ghi (10 trường) | `docs/audits/chi-tieu-10-truong.md`: 30/30 bản ghi kiểm lại đúng; mẫu nhỏ. |
| Bản sửa điểm có bằng chứng (đã gộp) | 146 mục năm, 70 chương trình (8 mục gỡ năm) | `docs/audits/gop-hieu-chinh-tac-dong.md`. |

## 2. Độ chính xác điểm chuẩn (nguồn: `docs/audits/do-chinh-xac-du-lieu.md`)

- Câu nói được: **"Điểm có phần lẻ khớp với PDF nguồn ở 201/201 dòng đã kiểm"** (93/93 mẫu ngẫu nhiên phân tầng, 108/108 mẫu điểm nhảy). Kiểm bằng đối chiếu tự động với đúng PDF và số trang đã gắn, các ca nghi ngờ đọc bằng mắt.
- Giới hạn bắt buộc đi kèm: điểm **số nguyên** (45,5% ô điểm 2022 đến 2025) chưa kiểm hết. Mẫu con 28 dòng đọc tay: 10 khớp, 5 sai, 2 nghi sai, 11 không xác định. Lỗi tìm thấy là chỉ tiêu hoặc số lượng bị ghi thành điểm.
- Đã sửa bằng chứng: 52 ô số nguyên nghi sai được kiểm, 36 đúng, 13 sai, 3 không xác định (`so-nguyen-nhay-ket-qua.md`); cùng các bản sửa ĐH Đà Lạt, GHA, GSA: 146 mục năm sau khi gộp (mục 1). Sau gộp, 17 chương trình đổi điểm gần nhất, 6 đổi nhãn khi thử với điểm 24,0, 0 đổi loại trạng thái (`gop-hieu-chinh-tac-dong.md`).
- Không nói "dữ liệu chính xác 100%".

## 3. Điểm 2026 và nguồn thứ cấp

- Kiểm 20 chương trình có điểm 2026 (`kiem-tra-nhan-nam-2026.md`): 17/20 dòng khớp trang tổng hợp, nhưng **0/20 đối chiếu được với đề án chính thức** (chưa có bảng điểm 2026 chính thức trong tệp đã tải). Điểm 2026 là tham chiếu, ghi rõ trên app "chưa đối chiếu đề án".
- Đối chiếu hai nguồn tổng hợp với VnExpress (`docs/ML-DU-BAO-DIEM-CHUAN-2027.md`): khớp 88,6% (334/377) năm 2025 và 92,9% (773/832) năm 2026 ở các cặp có cả hai nguồn; các cặp lệch chỉ được liệt kê, không tự sửa.
- 5 trường nghi sai mã hoặc tên trong dữ liệu gốc (`lien-ket-pdf-sai-truong.csv`, `xung-dot-con-lai-ket-qua.md`): DQH, TTN, DTV, TYS, DDP (PDF khớp mã nhưng tên hoặc tỉnh trường trong dữ liệu khác). Thêm HCS: dữ liệu thực chất của Học viện Hành chính và Quản trị công. Chưa sửa; việc của người điều phối dữ liệu.

## 4. Dự báo điểm chuẩn 2027

| Số | Giá trị | Nguồn |
|---|---|---|
| Năm dự báo | 2027 | script |
| Số chương trình có dự báo thống kê | 2.812, **tất cả độ tin cậy "thấp"** | script: điểm mới nhất của các chương trình này là 2026 từ trang tổng hợp, chưa đối chiếu đề án |
| Dự báo có cận trên chạm trần 30 điểm | 272 | script |
| Mô hình học máy (ML) | **Đang áp dụng** (LightGBM hồi quy phân vị p10/p50/p90, trung bình 5 hạt giống) cho 2.580 chương trình có điểm từ 2024; huấn luyện lại 17/10 trên điểm đã gồm bản sửa, mã băm danh mục khớp | script (`duBaoML`), `ml/ket-qua-du-bao-2027.json`, `src/data/du-bao-2027.json` |
| ML: độ phủ khoảng 80% | 80,0% gộp 2024 và 2025 (hệ số co giãn 2,02 chọn trên chính các năm này, nên là số **trong mẫu**); 87,1% (2024), 73,3% (2025) | `ml/ket-qua-du-bao-2027.json` |
| ML: **độ phủ ngoài mẫu** (hệ số chọn từ 2024, áp cho 2025) | **63,8%** | script (`phuNgoaiMau`) |
| ML: điểm Winkler ở cùng độ phủ 80% (thấp hơn là tốt hơn) | 8,21 so với 8,19 của khoảng thống kê cũ: **không tốt hơn khoảng thống kê** | script (`winkler`, `winklerHeuristicCu`) |
| ML: sai số điểm dự đoán so với giữ nguyên điểm năm trước | MAE 1,16 so với 1,20 (2024); 1,81 so với 1,84 (2025). Cải thiện nhỏ | `ml/ket-qua-du-bao-2027.json` |
| Chương trình ngoài ML | Dùng khoảng thống kê: điểm năm gần nhất cộng phân vị 10 và 90 của biến động, nhân hệ số 1,3 | `src/engine/du-bao-diem-chuan.ts` |
| Số cặp năm liền kề làm cơ sở | 2.526 | đo bổ sung bằng `thongKeBienDong` |
| Kiểm định bỏ-một-năm, khoảng "80%" phủ điểm thật | 2023: 91,1% (393 chương trình); 2024: 93,2% (601); 2025: 76,6% (589); trung bình 86,9% | `tests/du-bao-diem-chuan.test.ts`, 17/10 |
| Sai số trung bình | 1,04 / 1,15 / 1,74 điểm | như trên |

Lưu ý nội bộ: bảng "Backtesting 3 năm" trong `src/engine/du-bao-diem-chuan.ts` (`KET_QUA_BACKTESTING_3_NAM`, hiện ở màn Chẩn đoán danh mục) còn số cũ 89% / 95% / 64% (đo 15/10). Dữ liệu đã đổi, số đúng là bảng trên. Cần sửa hằng số trong mã (không thuộc phạm vi tài liệu).

Cách nói đúng về ML: "chúng em có mô hình học máy LightGBM dự báo khoảng điểm chuẩn 2027, nhưng kiểm định cho thấy nó chỉ cải thiện nhẹ so với giữ nguyên điểm năm trước và khoảng của nó phủ 63,8% ngoài mẫu". Chạy lại script trước buổi nói; nếu `phuNgoaiMau` hoặc `winkler` đổi thì đổi số theo. Tài liệu `docs/ML-DU-BAO-DIEM-CHUAN-2027.md` còn lời mở đầu "ML đang tắt" và số của lần huấn luyện trước (66,6%; 8,45 so với 8,76): số trên bảng này mới hơn.

## 5. Sản phẩm và kỹ thuật

| Số | Giá trị | Nguồn |
|---|---|---|
| Slice tính năng (có `routes.tsx`) / mẫu đường dẫn | 16 / 36 | `src/features`, `src/duong-dan.ts` |
| Bộ kiểm thử trong `npm test` | 88 tệp kiểm thử khác nhau | `package.json` |
| Công cụ MCP | 18 | `functions/_thu-vien/ket-noi-cong-cu.ts` |
| Hạn mức AI | 50 lượt/ngày/hồ sơ (mặc định, đổi được) | `functions/api/tu-van.ts` |
| Cổng chất lượng | `tsc` + `kiem-tra` + test phần đổi trước commit; `tsc` + `kiem-tra` + `vite build` trước push; CI tự deploy khi push `main` | `scripts/cong-kiem-tra.mjs`, `.github/workflows/deploy.yml`, `AGENTS.md` mục 9 |

## 6. Những điều KHÔNG được nói

1. "Xác suất đậu", "khả năng đậu x%", "chắc chắn đậu". Nhãn Thử sức/Vừa sức/An toàn/Dự phòng là chênh điểm so với điểm chuẩn năm gần nhất, không phải xác suất.
2. "Dữ liệu chính xác 100%" hay "toàn bộ đã kiểm chứng". Chỉ nói câu ở mục 2 kèm giới hạn.
3. "Học phí đã kiểm chứng toàn bộ" hay "học phí có văn bản của trường". Thực tế: 662 chương trình hiện học phí theo nguồn thứ cấp VnExpress, 0 chương trình đạt mức đã đối chiếu văn bản trường.
4. "Mô hình học máy dự báo chính xác điểm chuẩn", "vượt trội" hay "tốt hơn thống kê". ML đang chạy nhưng Winkler 8,21 so với 8,19 (không tốt hơn), phủ ngoài mẫu 63,8%.
5. "Điểm 2026 là điểm chuẩn chính thức". Là tham chiếu từ trang tổng hợp.
6. "Dự báo phủ 64% năm 2025" hay "89/95/64": số cũ của khoảng thống kê. Dùng 91,1 / 93,2 / 76,6 (thống kê) và 63,8% ngoài mẫu (ML). Hai nhóm số này khác phương pháp, không trộn.
7. "Dự báo có độ tin cậy cao". Cả 2.812 dự báo trong phân loại dữ liệu đang ở mức thấp (điểm mới nhất là 2026 từ trang tổng hợp).
8. "3.652 chương trình", "602 học phí", "24 bộ test", "33 route", "1.300 cặp năm": số cũ.
9. "Có hàng nghìn tình nguyện viên", "đã triển khai trên nhiều trường", "người dùng thật đã dùng": chưa có số liệu người dùng thật.
10. "CMS đã đăng nhập bằng Cloudflare Access": CMS dùng email + mật khẩu tự quản.
11. "Hệ thống đồng bộ nhiều thiết bị" hay "có tài khoản": local-first, chuyển máy bằng tệp sao lưu.
12. Khẳng định về khung chương trình học: chưa có dữ liệu.

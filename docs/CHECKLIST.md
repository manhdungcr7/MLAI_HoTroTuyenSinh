# Checklist hoàn thiện

Quy ước: chỉ tick khi có bằng chứng (kiểm thử, ảnh chụp, hoặc văn bản gốc đã đối chiếu). Mục chưa tick ghi rõ lý do, không tick giả.
Kết quả cuối ngày 3/10/2026: 167 bài pytest, tsc, eslint, test TypeScript, build đều qua; 25 vai học sinh chạy không lỗi console; workflow triển khai thành công.

## A. Trung thực với học sinh
- [x] A1. Tỉnh nhà chưa có trường trong dữ liệu: báo rõ ở bước chọn nơi học và ở trang kết quả (kiểm bằng vai Lai Châu, An Giang, Cao Bằng)
- [x] A2. Chỉ có ĐGNL/ĐGTD: nói rõ dữ liệu ĐGNL còn ít và bước tiếp theo (ảnh p10)
- [x] A3. Mỗi thẻ nêu nguồn và mức tin cậy: "Theo quy chế trường", "Ước lượng" kèm lý do, "Kiểm tra đề án", mục "Vì sao ra kết quả này?"

## B. Ngành thi năng khiếu
- [x] B1. Nhập điểm năng khiếu (vẽ, thể thao, mầm non) ở "Môn khác" của bước điểm thi
- [x] B2. Tính điểm cho tổ hợp V00–V03, T00, T01, T06, T10, M01, M05, M06, M11 (nghĩa mã đối chiếu bảng tổ hợp đề án ĐH Cần Thơ 2026)
- [x] B3. Nhãn "Có thi năng khiếu"; có kiểm thử TypeScript và Python. Tổ hợp năng khiếu khác (H, N, M00, M02…) chưa có định nghĩa chung nên không tính, đã nói rõ trong giao diện

## C. Chứng chỉ ngoại ngữ
- [x] C1. Nhập TOEFL iBT ngoài IELTS
- [ ] C1b. TOEIC: bảng quy đổi mỗi trường một khác và nhiều trường chỉ ghi điểm 4 kỹ năng, chưa mã hóa an toàn; giao diện nói rõ chưa hỗ trợ
- [x] C2. Chỉ áp dụng khi trường công bố bảng; chứng chỉ dùng một lần (certMode) khi trường quy định như vậy
- [x] C3. Bảng đã nhập và có kiểm thử: DPQ, DTL, NHH, YDS, DHY, DCT, IUH, TLA, PKA

## D. Quy tắc riêng từng trường (32 trường)
- [x] D1. DKK, NTH, NHH, DDP, YDS, DHY đã đọc: NHH, YDS, DHY, DDP, NTH mã hóa; DKK mã hóa dạng "ước lượng" vì hệ số theo thứ tự môn của từng nhóm tổ hợp
- [x] D2. Trường PDF ảnh đọc được qua nhận dạng chữ + đọc ảnh trang: TLA, DCT, NHF, HHK, SPH có quy tắc. Chưa có quy tắc: TDM, TSN, TDL, BVH, QHX, DTS, YCT, QSC, DTV, QHY (không thấy hệ số riêng ở THPT, dùng công thức chung; chưa đối chiếu đủ để ghi là "quy chế trường")
- [x] D3. SPS, SP2 (trùng công thức chung, đã đối chiếu), XDA và DDS (dạng "ước lượng" kèm lý do), QSX (trọng số chưa công bố nên không tính xác suất, `unsupportedReason`). QST chưa đọc được văn bản nên chưa có quy tắc
- [x] D4. docs/RULE_REVIEW.md sinh tự động, có test nhắc cập nhật
- [x] D5. `python scripts/rule_review.py --check`: 32/32 quy tắc khớp mã băm PDF đã lưu
- [ ] D6. Người thẩm định tuyển sinh rà soát từng quy tắc — việc của con người, chưa có

## E. Dữ liệu trường còn thiếu
- [x] E1. PKA và IUH: tìm được đề án 2026, đã nhập quy tắc. DDK: nguồn chỉ có bản 2025. TMU: có bản ảnh 2026 nhưng chưa xác nhận được công thức riêng cho phương thức thi THPT
- [x] E2. Danh sách 17 tỉnh chưa có trường trong docs/DATA_GAPS.md (sinh tự động). Không thể tự bổ sung điểm chuẩn khi nguồn công khai không có
- [x] E3. Tổ hợp xác thực: lấy từ bảng chỉ tiêu trong đề án (327 chương trình), từ 62% còn 49% chưa xác thực. Phần còn lại dùng xác suất trường nhận tổ hợp

## F. Triển khai và vận hành
- [x] F1. GitHub Pages: các lần chạy workflow gần nhất đều thành công
- [x] F2. Dockerfile build được; chạy container, /api/health và /api/advisor/search trả kết quả
- [x] F3. README có chạy, kiểm thử, cập nhật dữ liệu, triển khai
- [x] F4. pytest, tsc, eslint, test TypeScript, build đều qua

## G. Chốt cuối
- [x] G1. 25 vai học sinh chạy lại: không lỗi console; vai chỉ có ĐGNL nhận hướng dẫn thay vì trang trống
- [x] G2. Bộ nhớ dự án cập nhật; báo cáo trung thực các mục chưa tick (C1b, D6)

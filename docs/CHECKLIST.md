# Checklist hoàn thiện (tick khi đã làm và kiểm chứng)

Quy ước: chỉ tick khi có bằng chứng (kiểm thử, ảnh chụp, hoặc văn bản gốc đã đối chiếu). Mục không thể làm hết do thiếu dữ liệu công khai được ghi rõ lý do, không tick giả.

## A. Trung thực với học sinh
- [ ] A1. Tỉnh nhà chưa có trường trong dữ liệu: báo rõ ngay ở bước chọn nơi học và ở trang kết quả (không chỉ "không có ngành")
- [ ] A2. Chỉ có ĐGNL/ĐGTD: nói rõ dữ liệu ĐGNL còn ít, hướng dẫn bước tiếp theo (đã có, kiểm lại)
- [ ] A3. Mỗi thẻ nêu rõ nguồn và mức tin cậy (quy chế riêng hay công thức chung) (đã có, kiểm lại)

## B. Ngành thi năng khiếu
- [ ] B1. Nhập điểm năng khiếu (vẽ, nhạc, thể thao, mầm non) khi quan tâm ngành năng khiếu
- [ ] B2. Tính điểm xét tuyển cho tổ hợp có môn năng khiếu (V, H, N, M, T, S, K) theo tổ hợp đề án ghi
- [ ] B3. Kết quả có nhãn "cần thi năng khiếu của trường", có kiểm thử TS và Python

## C. Chứng chỉ ngoại ngữ
- [ ] C1. Nhập TOEFL iBT, TOEIC (ngoài IELTS)
- [ ] C2. Chỉ áp dụng khi trường có bảng quy đổi riêng; trường chưa có bảng thì không quy đổi (giữ nguyên tắc không bịa)
- [ ] C3. Bảng quy đổi của các trường đã nhập (đối chiếu văn bản) và có kiểm thử

## D. Quy tắc riêng từng trường
- [ ] D1. DKK, NTH, NHH, DDP, YDS, DHY: đọc đề án, nhập quy tắc đã đối chiếu (hoặc ghi rõ lý do không mã hóa được)
- [ ] D2. Trường có PDF dạng ảnh (TDM, TSN, TLA, DCT, BVH, SPH, HHK, TDL, QHX…): đọc ảnh trang, nhập quy tắc
- [ ] D3. Các trường text còn lại có hệ số/quy đổi khác công thức chung (SPS, SP2, XDA, DDS, QSX, QST, GSA…) đã rà
- [ ] D4. Tài liệu rà soát quy tắc cho người thẩm định (trích nguyên văn, trang, mã băm) — docs/RULE_REVIEW.md sinh tự động
- [ ] D5. Script kiểm tra mọi quy tắc còn khớp mã băm PDF đã lưu

## E. Dữ liệu trường còn thiếu
- [ ] E1. PKA, DDK, IUH, TMU: tìm và tải đề án 2026 (nếu công khai), nhập quy tắc
- [ ] E2. Liệt kê trường tỉnh còn thiếu trong dữ liệu (An Giang, Cao Bằng, Lai Châu…) và thử bổ sung từ nguồn công khai
- [ ] E3. Tổ hợp xét tuyển xác thực cho nhiều chương trình hơn (hiện 35%)

## F. Triển khai và vận hành
- [ ] F1. Web chạy trên GitHub Pages, workflow xanh sau mỗi lần đẩy (kiểm tra trạng thái thực tế)
- [ ] F2. Dockerfile API build được (cần Docker chạy; nếu không chạy được ghi rõ)
- [ ] F3. README có hướng dẫn chạy, kiểm thử, cập nhật dữ liệu, triển khai
- [ ] F4. Toàn bộ kiểm thử (pytest, tsc, eslint, test TS, build, QA 25 vai) xanh ở lần chốt cuối

## G. Chốt cuối
- [ ] G1. Chạy lại 25 vai học sinh, không lỗi console, không còn vấn đề đã liệt kê
- [ ] G2. Cập nhật bộ nhớ dự án và báo cáo trung thực phần chưa làm được

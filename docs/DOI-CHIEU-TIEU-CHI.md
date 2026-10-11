# Đối chiếu với tiêu chí chấm điểm của Ban Tổ chức

Nguồn: *Decision Intelligence Challenge — Challenge Brief* (mục 4, 6 tiêu chí, 100 điểm). Bảng dưới nói thật: cái gì đã có và kiểm chứng được ở đâu, cái gì còn thiếu.
Hướng chọn: **số 6, "Chọn trường hoặc chương trình học"**, người dùng là học sinh THPT lớp 11–12 và phụ huynh; quyết định là chọn ngành, trường và lập danh sách nguyện vọng.

## 1. Mức độ giải quyết vấn đề và tác động (20 điểm)

| Ý chấm | Bằng chứng trong sản phẩm |
|---|---|
| (5đ) Người dùng và quyết định cụ thể | Học sinh lớp 11–12 chọn ngành, trường, thứ tự nguyện vọng; phụ huynh và thầy cô đồng hành. Quyết định có hạn chót thật (đợt đăng ký nguyện vọng). Hồ sơ tạo trong 60 giây (`khoi-dau`). |
| (10đ) Đúng nhu cầu, giá trị rõ | Từ điểm của chính học sinh ra: ngành nào đủ điểm, ngành nào "thử sức" (`phu-hop.ts`); danh sách nguyện vọng cân bằng Thử sức/Vừa sức/An toàn/Dự phòng và nhận xét danh sách (`nguyen-vong`); khoảng cách tới mục tiêu và việc cần học mỗi tuần sinh từ môn còn thiếu (`engine/tao-viec.ts`); thử tình huống "nếu tăng điểm" (`thu-tinh-huong`). Đi trọn từ dữ liệu đầu vào đến hành động tuần này. |
| (5đ) Tiềm năng tác động | Mỗi mùa tuyển sinh có hơn một triệu thí sinh; quyết định sai nguyện vọng là cái giá cả năm. Kênh đồng hành (liên kết cho phụ huynh/thầy cô) và kênh cập nhật dữ liệu bởi người trong trường mở rộng tác động ra ngoài một học sinh. |

## 2. Mức độ phù hợp với Việt Nam (15 điểm)

| Ý chấm | Bằng chứng |
|---|---|
| (5đ) Đặc điểm địa lý, kinh tế, văn hóa, hành vi | Điểm ưu tiên khu vực KV1/KV2-NT/KV2/KV3 và đối tượng UT1/UT2, giảm dần từ 22,5 điểm đúng quy chế (`engine/diem-uu-tien.ts`); 34 tỉnh thành theo đơn vị hành chính mới; ngân sách học phí theo gia đình, ở nhà hay ở trọ hay ký túc xá, sẵn sàng học xa nhà; Zalo/Facebook là kênh chính (liên kết chia sẻ, nhóm tuyển sinh). |
| (10đ) Dữ liệu, hạ tầng, ngôn ngữ, khả năng triển khai | 3.447 chương trình của 113 trường, lấy từ đề án tuyển sinh chính thức, mỗi con số kèm link và số trang (`docs/DU-LIEU.md`); 73 tổ hợp xét tuyển chính thức; tiếng Việt thuần, chữ nhẹ, mobile-first, chạy được không cần tài khoản (local-first, dữ liệu em nằm trên máy em); chạy trên Cloudflare Pages (miễn phí ở quy mô ban đầu). |

## 3. Tính sáng tạo và khác biệt (20 điểm)

| Ý chấm | Bằng chứng |
|---|---|
| (10đ) Cách tiếp cận mới | "Decision Layer": không chỉ trả lời "em đậu trường nào" mà trả lời "em nên chọn gì và từ hôm nay làm gì". Khoảng điểm chuẩn dự kiến có mức bất định và **kiểm định ngược trên dữ liệu thật** (mục 4). Cập nhật dữ liệu mỗi năm bằng tình nguyện viên của chính các trường, có duyệt và có nguồn, thay vì thu thập tự động mong manh. |
| (10đ) Vượt tìm kiếm, tổng hợp, chatbot | Quyết định có cấu trúc: nhãn theo điểm từng tổ hợp của từng ngành, cân bằng danh sách, thử tình huống, kế hoạch tuần xếp lịch thật vào thời khóa biểu của em, theo dõi tiến độ, nhắc nhở. AI tư vấn chỉ nói trong phạm vi dữ liệu có nguồn, lọc mã nguồn bịa (`functions/api/tu-van.ts`). So với hỏi một chatbot chung: có số liệu có nguồn, có hồ sơ riêng, có hành động tiếp theo, và nói thẳng khi thiếu dữ liệu. |

## 4. Đổi mới trong sử dụng dữ liệu và AI (20 điểm)

| Ý chấm | Bằng chứng |
|---|---|
| (5đ) Chiến lược dữ liệu hợp lý | Ba tầng, mỗi tầng có nhãn tin cậy: (1) đề án tuyển sinh chính thức (kiểm chứng được tới trang PDF); (2) trang tổng hợp có đối chiếu với đề án; (3) thông tin cộng đồng do tình nguyện viên nhập, bắt buộc có nguồn và qua duyệt, hiển thị kèm nhãn "chưa phải số liệu chính thức". Quy trình cập nhật theo năm: `docs/QUAN-TRI.md`. |
| (5đ) Khai thác dữ liệu người dùng, thời gian, cộng đồng | Dữ liệu người dùng: điểm từng môn, thi thử theo thời gian (xu hướng tăng giảm), thời khóa biểu, ngân sách. Thời gian: dự báo điểm chuẩn năm tới; kế hoạch tuần thay đổi theo ngày còn lại tới kỳ thi và giờ trống. Cộng đồng: tình nguyện viên, báo số liệu sai từ học sinh, lời nhắn của phụ huynh/thầy cô. |
| (10đ) AI phù hợp, có giải thích và giới hạn | **Dự báo**: khoảng điểm chuẩn năm tới từ biến động thật của các cặp năm (`engine/du-bao-diem-chuan.ts`), hệ số chọn bằng kiểm định bỏ-một-năm: khoảng 80% phủ 92% (2023), 93% (2024) và 68% (2025, năm biến động bất thường); đo thực bằng `tests/du-bao-diem-chuan.test.ts`. **Phân tích**: nhãn nguyện vọng, hạng mục "điểm phù hợp" có công thức công khai. **Tối ưu**: xếp lịch tự học ràng buộc theo thời khóa biểu (`engine/xep-lich.ts`), sinh việc theo môn thiếu. **Đề xuất**: gợi ý danh sách nguyện vọng cân bằng. **Giải thích**: mỗi nhãn nói điểm của em hơn hay kém điểm chuẩn bao nhiêu và theo tổ hợp nào; mỗi số có nguồn; mọi màn nói "không phải xác suất đậu". **Giới hạn**: trang "Số liệu từ đâu ra" và khối giới hạn ở từng kết quả. |

## 5. Tính khả thi và sản phẩm thử nghiệm (15 điểm)

| Ý chấm | Bằng chứng |
|---|---|
| (5đ) Web demo ổn định, trình diễn được | https://nguyenvongai.pages.dev; 14 slice, 33 route; 24 bộ kiểm thử tự động chạy mỗi lần đẩy mã (CI); hồ sơ mẫu để trình diễn ngay không cần nhập. Kịch bản demo 5 phút: `docs/KICH-BAN-DEMO.md`. |
| (10đ) Mở rộng, tích hợp dữ liệu thật, vận hành, tạo giá trị trong một quy trình | Đường ống dữ liệu đã chạy thông suốt (đã kiểm bằng D1/KV cục bộ): tình nguyện viên nhập (CMS, `cms/`) → quản trị viên duyệt → xuất bản snapshot có mã băm SHA-256 → học sinh nhận bản mới tự động (`/api/manifest`, `/snapshots/*`) và mọi màn dùng số mới. Phân quyền ở máy chủ, nhật ký kiểm toán, rollback phiên bản, khóa xuất bản, giới hạn tần suất. Quy trình vận hành: `docs/QUAN-TRI.md`. |

## 6. Trình bày và trải nghiệm người dùng (10 điểm)

| Ý chấm | Bằng chứng |
|---|---|
| (5đ) Giao diện trực quan, dễ dùng | Thiết kế mobile-first 360–390px, chữ nhẹ, một việc mỗi màn, trạng thái rỗng/lỗi/đang tải đầy đủ, kiểm tra truy cập tự động (axe) và cổng đồng nhất (`npm run kiem-tra`: đường dẫn, màu, từ ngữ). |
| (5đ) Trả lời được câu hỏi về giả định, dữ liệu, AI, rủi ro | `docs/HOI-DAP-BAN-GIAM-KHAO.md` (24 câu hỏi dự kiến, có trả lời kèm vị trí trong mã hoặc test). |

## Việc còn thiếu (nói thẳng)

- Điểm chuẩn **năm 2026** mới có cho 924 chương trình, chủ yếu từ trang tổng hợp; phần lớn dữ liệu là 2023–2025. Mùa tuyển sinh tới, tình nguyện viên nhập từng trường qua CMS.
- Học phí riêng theo ngành đã phủ 566 chương trình (bao gồm toàn bộ top 15 trường đại học lớn nhất); việc làm và khung chương trình học chưa đủ (đã nói rõ trên app).
- Hạ tầng thật (D1, Cloudflare Access cho CMS) cần chủ tài khoản thao tác (xem `docs/QUAN-TRI.md`); tài khoản hiện chạm giới hạn số D1.
- Trắc nghiệm hướng nghiệp (Holland) là công cụ gợi ý, chưa kiểm định tâm lý.
- Dự báo điểm chuẩn **không** bù được cho thay đổi quy chế, đề thi, chỉ tiêu; năm 2025 khoảng chỉ phủ 68%.

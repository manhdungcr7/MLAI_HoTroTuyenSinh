# Nội dung dành cho slide (không đưa vào app)

Nguyên tắc: app giữ gọn cho học sinh dùng thật; mọi giải thích dành cho Ban giám khảo (giả định, kiểm định, kiến trúc, mô hình mở rộng) để ở slide. Mỗi mục dưới đây là một ý slide, kèm số liệu đã kiểm chứng và nơi kiểm tra.
Tiêu chí chấm: `docs/DOI-CHIEU-TIEU-CHI.md`. Hỏi đáp dự kiến: `docs/HOI-DAP-BAN-GIAM-KHAO.md`. Kịch bản demo: `docs/KICH-BAN-DEMO.md`.

## 1. Bài toán và người dùng (tiêu chí 1)
- Người dùng: học sinh lớp 11–12 và phụ huynh. Quyết định: chọn ngành, trường, thứ tự nguyện vọng; có hạn chót thật mỗi mùa tuyển sinh.
- Vấn đề: thông tin rời rạc (đề án PDF của từng trường), điểm chuẩn đổi hằng năm, mỗi ngành xét tổ hợp khác nhau, quyết định sai mất cả năm.
- Khác tra cứu điểm chuẩn và chatbot chung: hiểu hồ sơ riêng, giải thích đánh đổi, xếp danh sách cân bằng, biến thành kế hoạch hành động, theo dõi tiến độ (slide 6 của bộ slide hiện có).

## 2. Phù hợp Việt Nam (tiêu chí 2)
- Điểm ưu tiên khu vực KV1/KV2-NT/KV2/KV3 và đối tượng UT1/UT2, giảm dần từ 22,5 điểm theo quy chế (`engine/diem-uu-tien.ts`).
- Tổ hợp xét tuyển chính thức (73 tổ hợp), tính đúng theo từng ngành; 34 tỉnh thành theo đơn vị hành chính mới; ngân sách học phí, ở nhà hay ở trọ hay ký túc xá, học xa nhà.
- Zalo và Facebook là kênh tuyển sinh thật: chia sẻ cho phụ huynh bằng liên kết, không cần tài khoản.
- Chạy được trên điện thoại phổ thông, không cần tài khoản, hồ sơ nằm trên máy em.

## 3. Sáng tạo và khác biệt (tiêu chí 3)
- Lớp quyết định chứ không phải ô tìm kiếm: nhãn nguyện vọng theo điểm, cân bằng danh sách, thử "nếu tăng điểm", kế hoạch tuần xếp vào thời khóa biểu thật.
- Khoảng điểm chuẩn năm tới có mức bất định, kiểm định ngược trên dữ liệu thật (mục 5).
- Dữ liệu đổi hằng năm được cập nhật bởi người trong chính các trường, có duyệt và có nguồn (mục 6).

## 4. Chiến lược dữ liệu (tiêu chí 4, ý 1 và 2)
Ba tầng, mỗi tầng có nhãn tin cậy hiện trên app:
1. Đề án tuyển sinh chính thức: 3.648 chương trình, 118 trường, link tới đúng trang PDF.
2. Trang tổng hợp điểm chuẩn, có đối chiếu với đề án khi tìm thấy cùng con số.
3. Thông tin cộng đồng (ký túc xá, đánh giá, lưu ý): bắt buộc có nguồn, qua duyệt, gắn nhãn "chưa phải số liệu chính thức".
Dữ liệu người dùng: điểm từng môn, thi thử theo thời gian, thời khóa biểu, ngân sách. Dữ liệu thời gian: dự báo, đếm ngược tới kỳ thi, kế hoạch tuần.

## 5. AI và dự báo (tiêu chí 4, ý 3, trọng tâm 10 điểm)
Bốn vai trò của AI, chỉ một là mô hình ngôn ngữ:
- **Dự báo:** khoảng điểm chuẩn năm tới. Cách làm: điểm năm gần nhất cộng phân vị 10 và 90 của biến động giữa hai năm liền nhau, từ hơn 1.300 cặp năm thật, nhân hệ số 1,3.
- **Phân tích:** nhãn nguyện vọng và nhận xét danh sách (công thức công khai).
- **Tối ưu:** xếp lịch tự học theo ràng buộc, sinh việc theo môn còn thiếu.
- **Hỏi đáp có căn cứ:** chỉ dùng số liệu có nguồn gửi kèm, lọc mã nguồn bịa, không nói "khả năng đậu x%".

**Kiểm định bỏ-một-năm (số thật, chạy lại bằng `npx tsx tests/du-bao-diem-chuan.test.ts`):**

| Năm kiểm | Số chương trình | Khoảng "80%" phủ điểm thật | Sai số trung bình |
|---|---|---|---|
| 2023 | 397 | 89% | 1,0 điểm |
| 2024 | 603 | 95% | 1,2 điểm |
| 2025 | 413 | 64% | 1,9 điểm |

Điểm nhấn kể chuyện: bản đầu (cộng trung vị, tách theo nhóm ngành) chỉ phủ 55%, kiểm định cho thấy nó kém nên đã bỏ. Năm 2025 biến động mạnh bất thường (độ lệch chuẩn 2,6 so với 1,8) nên khoảng phủ thấp hơn; app nói thẳng "không phải xác suất đậu".
**Giới hạn nêu ra:** không bù được thay đổi quy chế, đề thi, chỉ tiêu; điểm do học sinh tự nhập; trắc nghiệm hướng nghiệp (Holland, 12 tình huống) chỉ là gợi ý.

## 6. Mở rộng và vận hành (tiêu chí 5, ý 2, 10 điểm)
Sơ đồ một dòng cho slide:
`Tình nguyện viên (điện thoại) → CMS → quản trị viên duyệt → xuất bản snapshot có mã băm → học sinh nhận bản mới tự động → mọi màn dùng số mới`
- Học sinh báo số liệu sai ngay trên trang ngành, vào hộp thư của người phụ trách trường.
- Sinh viên, thầy cô, cán bộ tuyển sinh đăng ký làm tình nguyện viên ngay trong app; quản trị viên cấp quyền một chạm và giao đúng trường.
- Mùa tuyển sinh: nhập điểm chuẩn cả trường một lượt, một nguồn chung.
- An toàn vận hành: phân quyền ở máy chủ, nhật ký kiểm toán, quay về phiên bản cũ, khóa xuất bản, kiểm tra mã băm, giới hạn tần suất.
- Chi phí: Cloudflare Pages, D1, KV có gói miễn phí đủ cho quy mô thử nghiệm; AI là chi phí duy nhất tăng theo người dùng và có chế độ trả lời từ dữ liệu.
- Mở rộng nhóm người dùng: cùng lõi (chấm điểm, dự báo, kế hoạch) cho du học, sau đại học, chọn nghề.
- Đường ống đã chạy thông suốt và được kiểm bằng trình duyệt ở máy (nhập → duyệt → xuất bản → học sinh thấy).

## 7. Tác động (tiêu chí 1, ý 3)
- Hơn một triệu thí sinh mỗi mùa; giảm chọn nguyện vọng thiếu căn cứ và thiếu phương án an toàn.
- Chỉ số theo dõi (slide 9): tỷ lệ hoàn thiện hồ sơ, số danh sách nguyện vọng có căn cứ, tỷ lệ hoàn thành nhiệm vụ tuần, khoảng cách tới mục tiêu thu hẹp (đã có trong app, trang Hồ sơ).
- Chưa có số liệu người dùng thật; đây là hướng đo, chưa phải kết quả.

## 8. Rủi ro và kiểm soát (tiêu chí 6, ý 2)
| Rủi ro | Kiểm soát |
|---|---|
| Số liệu sai | Nguồn đến trang PDF, nhãn đã kiểm chứng hay chưa, nút báo sai, duyệt trước khi xuất bản |
| Hiểu nhầm là dự đoán đậu | Nhãn và khoảng đều ghi "không phải xác suất"; AI bị cấm nói % |
| Thông tin cộng đồng thiên lệch | Gắn nhãn, bắt buộc nguồn, chặn số điện thoại và email, giới hạn số bài, người duyệt đọc tên riêng |
| Lạm dụng đầu vào công khai | Giới hạn tần suất theo IP, kiểm tra đầu vào chặt, ghi nhật ký |
| Quyền riêng tư | Hồ sơ nằm trên máy; AI chỉ nhận bản tóm tắt bỏ tên; liên kết chia sẻ không lưu trên máy chủ |
| Quy chế thay đổi hằng năm | Mức ưu tiên và công thức nằm một chỗ, đối chiếu mỗi mùa; ghi rõ trong tài liệu vận hành |

## 9. Điều nói thẳng (slide "Giới hạn và bước tiếp")
- Học phí đã kiểm chứng (link + trang văn bản gốc) ở 0 chương trình; các chương trình khác chỉ có học phí ước tính theo khối ngành, app ghi "≈ ước tính" và không gắn link; tỷ lệ việc làm có ở 121 chương trình; điểm 2026 chủ yếu từ trang tổng hợp; chưa có khung chương trình học.
- Hạ tầng thật của CMS (D1, Access) cần dựng; chạy thử đầy đủ ở máy.
- Bước tiếp: tuyển tình nguyện viên từ các trường đối tác, nhập điểm chuẩn mùa 2027, tài khoản cho phụ huynh và thầy cô, đo tác động bằng người dùng thật.

# Hỏi đáp dự kiến với Ban giám khảo

Mỗi câu trả lời dẫn tới nơi kiểm chứng được trong mã, test hoặc tài liệu. Quy tắc trả lời: nói thật điều chưa có, không hứa quá.

## A. Giả định

**1. Sản phẩm giả định điều gì về học sinh?**
Học sinh lớp 11–12 có điện thoại, biết điểm các môn (học bạ hoặc thi thử), và quyết định ngành/trường cùng gia đình. Không giả định học sinh biết rõ mình muốn gì: có trắc nghiệm sở thích (`features/huong-nghiep`) và gợi ý ngành theo điểm.

**2. "Điểm của em" lấy từ đâu, có đáng tin không?**
Do học sinh tự nhập (điểm học bạ hoặc thi thử, có thể cập nhật theo thời gian). Mình không xác minh điểm. App chỉ dùng để so với điểm chuẩn và nói rõ điểm nào được dùng (`HoSo.nguonDiem`).

**3. Điểm chuẩn năm nay chưa công bố thì sao?**
App dùng điểm các năm trước, luôn ghi năm, và đưa thêm khoảng dự kiến năm tới (câu 12). Điểm chuẩn năm vừa công bố do tình nguyện viên cập nhật qua CMS có nguồn và có duyệt.

**4. Điểm ưu tiên khu vực, đối tượng có tính không?**
Có, nếu học sinh khai (`features/khoi-dau/diem-uu-tien.tsx`). Mức theo quy chế, giảm dần từ 22,5 điểm, tính riêng cho từng tổ hợp của từng ngành (`engine/diem-uu-tien.ts`, test `tests/diem-uu-tien.test.ts`). Mức cộng có thể đổi theo năm; app nhắc học sinh đối chiếu thông báo chính thức.

## B. Dữ liệu

**5. Dữ liệu lấy ở đâu?**
2.878 chương trình của 105 trường từ đề án tuyển sinh chính thức (PDF, có link và số trang) và trang tổng hợp điểm chuẩn (đã đối chiếu với đề án khi tìm thấy cùng con số). Chi tiết, giới hạn: `docs/DU-LIEU.md`; trang "Số liệu từ đâu ra" trong app.

**6. Sao biết dữ liệu không sai?**
Ba lớp: (a) con số chỉ nhận khi tìm thấy đúng ngành và điểm ở trang PDF ghi; (b) nhãn "Đã kiểm chứng" hay "Chưa kiểm chứng" hiện ngay ở từng ngành; (c) học sinh bấm "Báo số liệu sai", báo cáo vào hộp thư CMS để người của trường kiểm tra nguồn và sửa. Không bao giờ tự đè số khi có báo sai.

**7. Dữ liệu đổi mỗi năm, ai cập nhật?**
Tình nguyện viên là sinh viên, thầy cô, cán bộ tuyển sinh của chính các trường, nhập qua CMS trên điện thoại (`cms/`). Mỗi mục bắt buộc có link nguồn, quản trị viên duyệt rồi mới xuất bản. Có nhập điểm chuẩn cả trường một lượt cho mùa tuyển sinh. Học sinh nhận bản mới tự động, kèm mã băm kiểm toàn vẹn. Đăng ký làm tình nguyện viên ngay trong app (`/dong-gop`).

**8. Sao không tự động thu thập (crawl)?**
Đã thử và dùng cho lần nạp đầu, nhưng website trường đổi cấu trúc mỗi năm, nhiều thông tin chỉ nằm trong PDF/ảnh/bài đăng Facebook. Người trong trường nắm chính xác và đáng tin hơn; máy hỗ trợ kiểm tra (định dạng, nguồn, trùng lặp) chứ không thay con người xác nhận.

**9. Thông tin do cộng đồng nhập có bị sai, bị lạm dụng không?**
Có thể, nên có kiểm soát: bắt buộc nguồn; chặn số điện thoại, email, link trong nội dung; bản ghi cộng đồng hiện kèm nhãn "chưa phải số liệu chính thức"; cộng tác viên chỉ sửa trường được giao; chỉ quản trị viên duyệt, xuất bản, cấp quyền; mọi thao tác ghi nhật ký; rollback về phiên bản trước. Báo sai và đăng ký tình nguyện có giới hạn tần suất theo địa chỉ IP.

**10. Quyền riêng tư của học sinh?**
Hồ sơ nằm trên máy học sinh (localStorage), không cần tài khoản. Tư vấn AI chỉ gửi bản tóm tắt đã bỏ tên và liên hệ, và học sinh xem được chính xác điều gì sẽ gửi. Liên kết chia sẻ cho phụ huynh/thầy cô mang nội dung ngay trong đường dẫn, không lưu trên máy chủ; tên chỉ kèm khi học sinh bật. Có sao lưu, khôi phục và xóa toàn bộ dữ liệu ở Cài đặt.

## C. AI

**11. AI dùng ở đâu, dùng để làm gì?**
(a) Tư vấn hỏi đáp có căn cứ: chỉ được dùng số liệu app gửi kèm, mã nguồn bịa bị lọc (`engine/tu-van.ts`, `functions/api/tu-van.ts`); chưa có khóa API thì tự trả lời từ dữ liệu. (b) Dự báo khoảng điểm chuẩn. (c) Tối ưu: xếp lịch tự học và sinh việc theo môn thiếu. (d) Đề xuất: danh sách nguyện vọng cân bằng. Phần "AI" của sản phẩm không chỉ là mô hình ngôn ngữ.

**12. Dự báo điểm chuẩn hoạt động thế nào, tin được đến đâu?**
Lấy điểm năm gần nhất, cộng phân vị 10 và 90 của biến động giữa hai năm liền nhau, rút từ 1.330 cặp năm thật; khoảng nở thêm theo căn bậc hai số năm xa. Chọn hệ số bằng kiểm định bỏ-một-năm: bỏ hết biến động của năm T, đoán điểm năm T từ T−1, so với điểm thật. Kết quả khoảng 80% phủ: 2023 là 92%, 2024 là 93%, 2025 chỉ 68% vì năm đó biến động mạnh bất thường (độ lệch chuẩn 2,6 so với 1,8). Nói thẳng với học sinh trên màn hình: "Không phải xác suất đậu; đổi chỉ tiêu, phương thức, đề thi thì có thể ra ngoài khoảng". Test: `tests/du-bao-diem-chuan.test.ts`.

**13. Sao không dùng mô hình học máy phức tạp hơn?**
Dữ liệu có nhiều nhất hai đến ba năm mỗi ngành, và biến động phần lớn do yếu tố chung (đề thi, quy chế) hơn là từng ngành; thử riêng theo nhóm ngành và thêm trung vị đều không cải thiện sai số trong kiểm định. Mô hình nhẹ, giải thích được, kiểm chứng được tốt hơn một mô hình phức tạp không đủ dữ liệu để huấn luyện. Khi có thêm dữ liệu nhiều năm qua CMS, bài kiểm định chạy lại tự động và cho biết có nên nâng cấp không.

**14. AI có thể "bịa" không?**
Tư vấn AI bị ép dùng số liệu gửi kèm, mỗi số phải kèm tên ngành, trường, năm và mã nguồn; mã không có trong dữ liệu gửi đi bị loại trước khi hiện. Không cho nói "khả năng đậu x%". Vẫn có rủi ro diễn đạt sai, nên mọi câu trả lời kèm nguồn để học sinh mở kiểm tra.

**15. Nhãn Thử sức/Vừa sức/An toàn/Dự phòng tính thế nào?**
Chênh giữa điểm của học sinh (theo đúng tổ hợp của ngành, đã gồm ưu tiên) và điểm chuẩn năm gần nhất: dưới 0 là Thử sức, dưới 1,5 là Vừa sức, dưới 4 là An toàn, từ 4 là Dự phòng (`engine/phan-tich.ts`). Là gợi ý để cân bằng danh sách, không phải xác suất.

## D. Rủi ro và đạo đức

**16. Học sinh làm theo máy và chọn sai thì sao?**
Mỗi màn nhắc quyết định cuối thuộc về học sinh và gia đình; đối chiếu đề án chính thức. App không đưa kết luận "đậu/trượt", chỉ nêu đánh đổi: điểm, học phí, nơi học, ngành. Phụ huynh và thầy cô được mời cùng xem qua bản tóm tắt chia sẻ.

**17. Trắc nghiệm hướng nghiệp có khoa học không?**
Dựa trên mô hình Holland (RIASEC) phổ biến trong hướng nghiệp, 12 tình huống, chưa kiểm định tâm lý riêng cho học sinh Việt Nam. App nói rõ đây là gợi ý để tìm hiểu, và khi các nhóm điểm gần nhau thì nói "chưa nổi bật nhóm nào" thay vì kết luận.

**18. Thiên lệch (bias) có không?**
Điểm chuẩn phản ánh nhu cầu thị trường chứ không phải năng lực; ngành ít người chọn có điểm thấp. App không xếp hạng ngành "tốt hay xấu"; gợi ý theo điểm, ngân sách, khu vực, sở thích mà học sinh khai. Thông tin cộng đồng có thể thiên lệch theo người viết, nên bị gắn nhãn và giới hạn số bài hiển thị.

## E. Mở rộng và triển khai

**19. Mở rộng cho thêm trường, thêm nhóm người dùng thế nào?**
Thêm trường: thêm mã vào tập trường, tình nguyện viên nhập qua CMS. Thêm dữ liệu mới (học bổng, ký túc xá): các loại bản ghi đã có sẵn. Thêm nhóm người dùng: cùng cách làm ("lớp quyết định") cho chọn chương trình sau đại học, du học, chọn nghề; lõi chấm điểm, dự báo, kế hoạch dùng lại được.

**20. Chi phí vận hành?**
Cloudflare Pages, D1, KV có gói miễn phí đủ cho quy mô thử nghiệm; tư vấn AI là chi phí duy nhất tăng theo người dùng, có giới hạn tần suất và có chế độ trả lời từ dữ liệu khi chưa dùng AI.

**21. Mô hình bền vững?**
Giai đoạn đầu: miễn phí cho học sinh, trường đối tác đóng góp dữ liệu có xác minh; sau đó có thể có gói cho trường (trang thông tin chính thức, thống kê quan tâm ẩn danh) và cho trung tâm tư vấn. Chưa có doanh thu; đây là hướng, chưa phải kết quả.

**22. Làm sao có tình nguyện viên?**
Trang `/dong-gop` trong app cho phép sinh viên, thầy cô, cán bộ tuyển sinh đăng ký; quản trị viên liên hệ, xác minh, rồi cấp quyền và giao đúng trường chỉ bằng một nút (CMS, Hộp thư). Mỗi mùa tuyển sinh có thể bắt đầu từ các trường đối tác, mỗi trường vài tình nguyện viên.

**23. Có cần máy chủ và tài khoản?**
Học sinh thì không (local-first). CMS dùng Cloudflare Access (đăng nhập bằng email) và D1/KV. Muốn đồng bộ nhiều thiết bị hoặc tài khoản riêng cho phụ huynh/thầy cô thì cần thêm đăng nhập cho học sinh, chưa làm.

**24. Điểm yếu lớn nhất hiện giờ?**
Phủ dữ liệu: học phí theo ngành mới có 24 chương trình, điểm 2026 chủ yếu từ trang tổng hợp, chưa có khung chương trình học. Cách khắc phục đã dựng (CMS, tình nguyện viên) nhưng cần người dùng thật để lấp đầy. Điều này được nói thẳng trên app ("Chưa có dữ liệu") thay vì điền số suy diễn.

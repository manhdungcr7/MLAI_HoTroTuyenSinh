# Hỏi đáp dự kiến với Ban giám khảo

Mỗi câu trả lời dẫn tới nơi kiểm chứng được trong mã, test hoặc báo cáo. Quy tắc trả lời: nói thật điều chưa có, không hứa quá. Số liệu lấy từ `docs/SO-LIEU-CHOT-NOP-BAI.md` (đo 17/10/2026, chạy lại bằng `npx tsx scripts/so-lieu-nop-bai.mts`).

## A. Giả định

**1. Sản phẩm giả định điều gì về học sinh?**
Học sinh lớp 11–12 có điện thoại, biết điểm các môn (học bạ hoặc thi thử), và quyết định ngành/trường cùng gia đình. Không giả định học sinh biết rõ mình muốn gì: có trắc nghiệm sở thích (`features/huong-nghiep`) và gợi ý ngành theo điểm.

**2. "Điểm của em" lấy từ đâu, có đáng tin không?**
Do học sinh tự nhập (điểm học bạ hoặc thi thử, cập nhật theo thời gian). Mình không xác minh điểm. App chỉ dùng để so với điểm chuẩn và nói rõ điểm nào được dùng: mỗi môn lấy lần thi thử gần nhất, chưa có thì lấy điểm ở hồ sơ (`diemHienTaiCuaTungMon`).

**3. Điểm chuẩn năm nay chưa công bố thì sao?**
App dùng điểm các năm trước, luôn ghi năm, và đưa thêm điểm dự đoán cho năm tới (câu 13). Điểm chuẩn mới do tình nguyện viên cập nhật qua CMS có nguồn và có duyệt.

**4. Điểm ưu tiên khu vực, đối tượng có tính không?**
Có, nếu học sinh khai (`features/khoi-dau/diem-uu-tien.tsx`). Mức theo quy chế, giảm dần từ 22,5 điểm, tính riêng cho từng tổ hợp của từng ngành (`engine/diem-uu-tien.ts`, test `tests/diem-uu-tien.test.ts`). Mức cộng có thể đổi theo năm; app nhắc đối chiếu thông báo chính thức. Học sinh tự khai khu vực, app chưa tự suy từ tỉnh/huyện.

## B. Dữ liệu

**5. Dữ liệu lấy ở đâu, bao nhiêu?**
3.648 chương trình của 118 trường: 1.492 chương trình gắn nguồn đề án PDF của trường (có link và số trang), 2.156 gắn nguồn trang tổng hợp (nguồn thứ cấp, nhãn "chưa đối chiếu đề án"). Điểm 2026 có ở 2.082 chương trình, chủ yếu từ trang tổng hợp, bổ sung từ VnExpress. Chi tiết, giới hạn: `docs/DU-LIEU.md`; trong app: Khám phá > Về dữ liệu.

**6. Sao biết dữ liệu không sai? Độ chính xác bao nhiêu?**
Trả lời trung thực, theo đúng báo cáo `docs/audits/do-chinh-xac-du-lieu.md`:
- Mẫu kiểm: đối chiếu từng dòng với đúng PDF và số trang đã gắn. **Điểm có phần lẻ khớp PDF nguồn ở 201/201 dòng đã kiểm** (93 mẫu ngẫu nhiên phân tầng, 108 mẫu điểm nhảy).
- **Điểm số nguyên chưa kiểm hết**. Chúng chiếm khoảng 45% ô điểm 2022 đến 2025 và là nơi có lỗi: ở mẫu con 28 dòng đọc tay, 10 khớp, 5 sai, 2 nghi sai, 11 không xác định. Lỗi điển hình là chỉ tiêu hoặc số lượng bị ghi thành điểm.
- Đã sửa theo bằng chứng: 146 mục năm của 70 chương trình có bản ghi đè kèm trang PDF và hai lần đọc (`src/data/hieu-chinh-diem.json`, `docs/audits/gop-hieu-chinh-tac-dong.md`). Lỗi còn lại cùng loại có thể tồn tại ở ô chưa kiểm.
- Còn có 5 trường nghi sai mã hoặc tên trong dữ liệu gốc (DQH, TTN, DTV, TYS, DDP; `docs/audits/lien-ket-pdf-sai-truong.csv`), chưa sửa.
- Vì vậy chúng em không tuyên bố "chính xác 100%". Học sinh có nút **Báo số liệu sai** ngay trên trang ngành; báo cáo vào hộp thư CMS để người của trường kiểm tra nguồn.

**7. Điểm năm 2026 lấy từ đâu, tin được đến đâu?**
Phần lớn từ trang tổng hợp (tuyensinh247), bổ sung từ VnExpress; **chưa đối chiếu với đề án chính thức**. Kiểm 20 chương trình (`docs/audits/kiem-tra-nhan-nam-2026.md`): 17/20 dòng khớp trang tổng hợp, 0/20 đối chiếu được với bảng điểm chính thức vì chưa có bảng 2026 trong tệp đã tải. Đối chiếu hai nguồn tổng hợp: khớp 92,9% (773/832) ở các cặp năm 2026 có cả hai nguồn. App ghi nhãn "chưa đối chiếu đề án" và độ tin cậy dự báo ở mức thấp.

**8. Học phí có tin được không?**
App chỉ hiện học phí khi có nguồn có link. Hiện có 662 chương trình có học phí, **toàn bộ theo VnExpress** (nguồn thứ cấp, app ghi "Theo VnExpress" kèm link). Học phí đã đối chiếu văn bản của chính trường và đạt điều kiện hiển thị: 0 chương trình. Các chương trình còn lại ghi "Chưa có học phí riêng ngành"; không có số ước tính nào được hiển thị. Việc làm: 121 chương trình có tỷ lệ từ đề án.

**9. Dữ liệu đổi mỗi năm, ai cập nhật? Sao không tự crawl?**
Tình nguyện viên là sinh viên, thầy cô, cán bộ tuyển sinh của chính các trường, nhập qua CMS trên điện thoại (`cms/`): mỗi mục bắt buộc có link nguồn, quản trị viên duyệt rồi mới xuất bản; học sinh nhận bản mới kèm mã băm kiểm toàn vẹn. Đã dùng crawl cho lần nạp đầu và đối chiếu (VnExpress), nhưng website trường đổi cấu trúc mỗi năm và nhiều thông tin nằm trong PDF/ảnh, nên người trong trường đáng tin hơn; máy hỗ trợ kiểm tra chứ không thay người xác nhận. Hiện chưa có tình nguyện viên thật: đây là mô hình đã dựng, chưa phải kết quả vận hành.

**10. Thông tin do cộng đồng nhập có bị sai, bị lạm dụng không?**
Có thể, nên có kiểm soát: bắt buộc nguồn; chặn số điện thoại, email, link trong nội dung; bản ghi cộng đồng gắn nhãn "chưa phải số liệu chính thức"; cộng tác viên chỉ sửa trường được giao; chỉ quản trị viên duyệt, xuất bản, cấp quyền; nhật ký mọi thao tác; quay về phiên bản trước; giới hạn tần suất theo IP.

**11. Dữ liệu của học sinh nằm ở đâu? Quyền riêng tư?**
Local-first: hồ sơ nằm trên máy học sinh (localStorage), không cần tài khoản, không gửi lên máy chủ khi dùng thường. Tư vấn AI chỉ gửi bản tóm tắt đã bỏ tên và liên hệ (cộng tối đa 12 ngành liên quan), học sinh xem được điều gì sẽ gửi. Liên kết chia sẻ cho phụ huynh/thầy cô mang nội dung ngay trong đường dẫn, không lưu trên máy chủ. Ở Cài đặt, mục **Dữ liệu của em** cho tải bản sao lưu, khôi phục và xóa toàn bộ. Giới hạn: không có đồng bộ nhiều thiết bị; chuyển máy bằng tệp sao lưu.

## C. AI và dự báo

**12. AI dùng ở đâu, dùng để làm gì?**
(a) Tư vấn hỏi đáp có căn cứ (câu 14). (b) Dự đoán điểm chuẩn năm tới: mô hình học máy kèm khoảng thống kê (câu 13). (c) Tối ưu: xếp lịch tự học vào thời khóa biểu và sinh việc theo môn thiếu. (d) Phân tích: nhãn nguyện vọng, chẩn đoán danh mục. (e) Kết nối trợ lý ngoài qua MCP (18 công cụ, có phạm vi quyền và xác nhận). Phần "AI" của sản phẩm không chỉ là mô hình ngôn ngữ. Các phần tính điểm, ưu tiên, xếp lịch là mã tất định, không dùng AI.

**13. Dự báo điểm chuẩn hoạt động thế nào, tin được đến đâu? Có dùng học máy không?**
- **Hai lớp.** (1) Khoảng thống kê: điểm dự đoán 2027 giữ điểm năm gần nhất; khoảng = điểm đó cộng phân vị 10 và 90 của biến động giữa hai năm liền kề (2.526 cặp năm thật), nhân hệ số 1,3, nở theo căn bậc hai số năm xa (`src/engine/du-bao-diem-chuan.ts`). (2) Mô hình học máy LightGBM hồi quy phân vị (p10, p50, p90, trung bình 5 hạt giống) đang áp dụng cho 2.580 chương trình có điểm từ 2024; khi có, màn chi tiết ngành dùng điểm giữa và khoảng của nó (có ghi "mô hình học máy"), chương trình khác dùng lớp (1). Huấn luyện lại 17/10 trên điểm đã gồm các bản sửa có bằng chứng (`ml/`, `src/data/du-bao-ml.ts`).
- **Học máy chỉ cải thiện nhẹ, và chúng em nói thẳng điều đó.** Kiểm định lăn: sai số tuyệt đối trung bình 1,16 điểm so với 1,20 khi giữ nguyên điểm năm trước (2024), 1,81 so với 1,84 (2025). Khoảng 80% sau hiệu chỉnh phủ 80,0% gộp hai năm, nhưng hệ số hiệu chỉnh chọn trên chính các năm đó nên đây là số trong mẫu. **Phép thử ngoài mẫu trung thực** (chọn hệ số từ 2024, áp cho 2025): phủ **63,8%**, thấp hơn 80% vì biến động 2025 lớn hơn mọi năm trước. Ở cùng độ phủ 80%, điểm Winkler của ML là 8,21 so với 8,19 của khoảng thống kê cũ: không tốt hơn. Vì vậy chúng em không tuyên bố ML vượt trội.
- **Khoảng thống kê, kiểm định bỏ-một-năm** (bỏ biến động năm T, đoán T từ T−1; đo 17/10 bằng `tests/du-bao-diem-chuan.test.ts`): khoảng danh nghĩa 80% phủ 91,1% điểm thật năm 2023 (393 chương trình), 93,2% năm 2024 (601), 76,6% năm 2025 (589); trung bình 86,9%; sai số trung bình 1,0 đến 1,7 điểm. Đây cũng là kiểm định trong mẫu của cùng dữ liệu, không phải kiểm định ngoài mẫu độc lập.
- **Độ tin cậy**: cả 2.812 dự báo trong phân loại dữ liệu hiện ở mức "thấp", vì điểm mới nhất của chúng là 2026 từ trang tổng hợp chưa đối chiếu đề án. App ghi rõ trên màn hình. 272 dự báo chạm trần 30 điểm; app nói điểm đã chạm trần.
- Không bù được thay đổi quy chế, đề thi, chỉ tiêu. Không phải xác suất đậu.

**14. AI tư vấn dùng dữ liệu nào? Làm sao tránh bịa?**
Trình duyệt gom bản tóm tắt hồ sơ (không tên) và tối đa 12 ngành liên quan kèm điểm và nguồn, gửi `/api/tu-van`. Lời nhắc cấm nêu số ngoài dữ liệu gửi kèm; máy chủ lọc mã nguồn bịa; hậu kiểm: số điểm, học phí trong câu trả lời phải có trong dữ liệu gửi, lệch thì trả 422 và app tự trả lời từ dữ liệu. Có hạn mức 50 lượt/ngày/hồ sơ (mặc định). Chưa có khóa API hoặc lỗi thì chạy chế độ trả lời từ dữ liệu. Thẻ hành động "thêm nguyện vọng" chỉ là đề xuất, học sinh phải xác nhận. Vẫn có rủi ro diễn đạt sai, nên câu trả lời kèm nguồn để học sinh mở kiểm tra. Chi tiết: `docs/TU-VAN-AI.md`; test `tests/tu-van*.test.ts`.

**15. Vì sao không hiện xác suất đậu?**
Vì chúng em không có cách hiệu chỉnh xác suất: không có dữ liệu kết quả trúng tuyển theo từng thí sinh, chỉ có điểm chuẩn tổng hợp của từng ngành. Một con số "đậu 85%" sẽ trông chính xác hơn điều chúng em biết. Thay vào đó app hiện chênh điểm so với điểm chuẩn năm gần nhất và nhãn Thử sức/Vừa sức/An toàn/Dự phòng. Trong mã có mô-đun ước lượng xác suất nội bộ (`engine/xac-suat-trung-tuyen.ts`) dùng cho chẩn đoán danh mục, chưa hiệu chỉnh và không hiển thị cho học sinh.

**16. Nhãn Thử sức/Vừa sức/An toàn/Dự phòng tính thế nào?**
Chênh giữa điểm học sinh (theo đúng tổ hợp của ngành, đã gồm ưu tiên) và điểm chuẩn năm gần nhất: dưới 0 là Thử sức, dưới 1,5 là Vừa sức, dưới 4 là An toàn, từ 4 là Dự phòng (`engine/phan-tich.ts`, `nhanNguyenVong`). Gợi ý để cân bằng danh sách, không phải xác suất. Ngành thiếu điểm hợp lệ, hoặc xét phương thức khác thi THPT, thì app nói "chưa so được", không gán nhãn.

## D. Rủi ro và đạo đức

**17. Học sinh làm theo máy và chọn sai thì sao?**
Mỗi màn nhắc quyết định cuối thuộc về học sinh và gia đình; đối chiếu đề án chính thức. App không kết luận "đậu/trượt", chỉ nêu đánh đổi: điểm, học phí, nơi học, ngành. Phụ huynh và thầy cô được mời cùng xem qua bản tóm tắt chia sẻ.

**18. Trắc nghiệm hướng nghiệp có khoa học không?**
Dựa trên mô hình Holland (RIASEC), 12 tình huống, chưa kiểm định tâm lý riêng cho học sinh Việt Nam. App nói đây là gợi ý để tìm hiểu; khi các nhóm điểm gần nhau thì nói "chưa nổi bật nhóm nào".

**19. Thiên lệch (bias) có không?**
Điểm chuẩn phản ánh nhu cầu chứ không phải chất lượng; app không xếp hạng ngành "tốt hay xấu", chỉ gợi ý theo điểm, ngân sách, khu vực, sở thích học sinh khai. Dữ liệu 2026 và học phí đến từ nguồn thứ cấp có thể sai lệch theo nguồn; app gắn nhãn. Thông tin cộng đồng có thể thiên lệch theo người viết, nên bị gắn nhãn và giới hạn số bài.

## E. Mở rộng và triển khai

**20. Chi phí vận hành?**
Cloudflare Pages, D1, KV có gói miễn phí đủ cho quy mô thử nghiệm. Tư vấn AI là chi phí duy nhất tăng theo người dùng: có hạn mức theo hồ sơ, IP và toàn hệ thống, bộ nhớ đệm, và chế độ trả lời từ dữ liệu không tốn lượt gọi mô hình. Chưa đo chi phí ở quy mô người dùng thật.

**21. Mở rộng cho thêm trường, nhóm người dùng thế nào?**
Thêm trường: thêm mã vào tập trường, tình nguyện viên nhập qua CMS. Thêm loại dữ liệu (học bổng, ký túc xá): các loại bản ghi đã có sẵn. Thêm nhóm người dùng: cùng lõi chấm điểm, dự báo, kế hoạch cho chọn chương trình sau đại học, du học, chọn nghề.

**22. Mô hình bền vững? Làm sao có tình nguyện viên?**
Giai đoạn đầu miễn phí cho học sinh, trường đối tác đóng góp dữ liệu có xác minh; sau đó có thể có gói cho trường và trung tâm tư vấn. Chưa có doanh thu; đây là hướng, chưa phải kết quả. Tình nguyện viên đăng ký ngay trong app (`/dong-gop`), quản trị viên xác minh rồi cấp quyền và giao đúng trường bằng một nút (CMS > Hộp thư).

**23. Có cần máy chủ và tài khoản?**
Học sinh thì không. CMS dùng đăng nhập email và mật khẩu tự quản, lưu trên D1/KV (`docs/QUAN-TRI.md`). Muốn đồng bộ nhiều thiết bị hoặc tài khoản riêng cho phụ huynh/thầy cô thì cần thêm đăng nhập cho học sinh, chưa làm.

**24. Quy trình kỹ thuật bảo đảm không đẩy mã hỏng?**
Cổng kiểm tra tự động chạy trước khi commit (kiểu, đồng nhất, test phần đổi) và trước khi push (kiểu, đồng nhất, build); CI tự deploy lên Cloudflare Pages khi push `main` (`.github/workflows/deploy.yml`, `scripts/cong-kiem-tra.mjs`, `AGENTS.md` mục 9). Test đầy đủ chạy ở job riêng; test đang đỏ có chủ ghi ở `tests/baseline-do.json`.

**25. Điểm yếu lớn nhất hiện giờ?**
Dữ liệu: điểm số nguyên chưa kiểm hết; điểm 2026 và học phí từ nguồn thứ cấp; 5 trường nghi sai mã hoặc tên; chưa có khung chương trình học; dự báo 2027 toàn bộ mức tin cậy thấp, ML chỉ cải thiện nhẹ và phủ ngoài mẫu 63,8%. Cách khắc phục đã dựng (CMS, tình nguyện viên, cơ chế ghi đè có bằng chứng) nhưng cần người dùng thật để lấp đầy. Điều này được nói thẳng trên app ("Chưa có dữ liệu", nhãn nguồn) thay vì điền số suy diễn.

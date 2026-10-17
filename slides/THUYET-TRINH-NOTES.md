# TÀI LIỆU HỖ TRỢ NGƯỜI THUYẾT TRÌNH (SPEAKER NOTES)
## DỰ ÁN: NGUYỆN VỌNG AI — MLAI HACKATHON 2026
*Phong cách: Founder thuyết trình thực chiến, tự nhiên, tự tin, minh bạch và có bằng chứng kỹ thuật.*

---

### 🎬 SLIDE 01: BÌA & MỞ ĐẦU (00:00 - 00:30)
- **Thông điệp chính**: Nguyện Vọng AI là giải pháp giúp học sinh chọn đúng ngành, đúng trường và tự tin sắp xếp thứ tự nguyện vọng dựa trên dữ liệu tuyển sinh đã kiểm chứng.
- **Lời thoại đề xuất (25 giây)**:  
  *"Kính chào Ban giám khảo. Mỗi mùa tuyển sinh, hơn 1 triệu thí sinh và phụ huynh phải đối mặt với một quyết định có thể làm thay đổi tương lai. Nhóm em là RTC Team, mang đến sản phẩm **Nguyện Vọng AI** nhằm giải quyết trọn vẹn câu hỏi: 'Em nên chọn ngành nào, và từ hôm nay cần làm gì?'. Trong 10 phút tới, em xin trình bày cách sản phẩm giải quyết vấn đề, vị trí ứng dụng của AI và thuật toán, cùng những giới hạn nhóm thẳng thắn nhìn nhận."*
- **Câu chuyển tiếp**: *"Trước hết, hãy nhìn vào thực tế học sinh đang phải vật lộn với những khó khăn nào khi đặt nguyện vọng."*
- **Thuật ngữ cần giải thích nếu bị hỏi**:
  - *Bài toán 6 (Chọn trường và chương trình học)*: Một trong các bài toán trọng tâm của cuộc thi MLAI Hackathon 2026 về ứng dụng AI trong hỗ trợ giáo dục và hướng nghiệp.
- **Bằng chứng kỹ thuật**: Ứng dụng đã chạy thực tế trên Cloudflare Pages tại `https://nguyenvongai.pages.dev`.

---

### 🎬 SLIDE 02: VẤN ĐỀ CỦA HỌC SINH (00:30 - 01:10)
- **Thông điệp chính**: Học sinh đang đưa ra một quyết định quan trọng của cuộc đời trên một mớ thông tin rời rạc và quy chế dễ gây nhầm lẫn.
- **Lời thoại đề xuất (35 giây)**:  
  *"Nỗi đau của thí sinh hiện nay gồm 3 tầng:  
  Thứ nhất, thông tin tuyển sinh nằm rải rác trong hàng trăm đề án PDF, mỗi trường một cấu trúc bảng biểu, rất khó đối chiếu.  
  Thứ hai, quy chế tính điểm cực kỳ phức tạp: điểm ưu tiên giảm dần từ mức 22,5 điểm và 73 tổ hợp môn khiến phần lớn học sinh tự tính sai điểm xét tuyển của mình.  
  Và thứ ba, tai hại nhất: quy chế xét tuyển chỉ cho phép trúng tuyển nguyện vọng cao nhất; nếu đặt một ngành an toàn lên đầu, các em sẽ vĩnh viễn mất cơ hội vào ngành mơ ước phía sau.  
  Dữ liệu thì khổng lồ với hơn 3.600 chương trình, nhưng các em lại thiếu một công cụ phân tích đúng."*
- **Câu chuyển tiếp**: *"Vậy tại sao các công cụ hiện nay vẫn chưa giải quyết được khoảng trống này?"*
- **Thuật ngữ cần giải thích nếu bị hỏi**:
  - *Quy chế điểm ưu tiên giảm dần*: Theo quy chế tuyển sinh của Bộ GD&ĐT từ năm 2023, thí sinh đạt từ 22,5 điểm trở lên sẽ được cộng điểm ưu tiên theo công thức giảm tuyến tính: `[(30 - Tổng điểm)/7.5] × Mức ưu tiên gốc`.
  - *Nghịch đảo thứ tự*: Xếp ngành có điểm chuẩn thấp hơn lên trước ngành có điểm chuẩn cao hơn mà mình yêu thích, dẫn đến việc bị trúng tuyển sớm và mất cơ hội ở các nguyện vọng sau.
- **Bằng chứng kỹ thuật**: Dữ liệu thật gồm 3.648 chương trình đào tạo của 118 trường đại học đã được số hóa trong `src/data/du-lieu-that.json`.

---

### 🎬 SLIDE 03: KHOẢNG TRỐNG THỊ TRƯỜNG (01:10 - 01:45)
- **Thông điệp chính**: Học sinh không thiếu thông tin, mà thiếu công cụ cá nhân hóa giúp biến thông tin thành quyết định an toàn.
- **Lời thoại đề xuất (30 giây)**:  
  *"Thị trường không hề thiếu thông tin. Nhưng các cổng tra cứu hiện nay chỉ dừng lại ở việc liệt kê điểm số năm cũ, không phân tích theo hồ sơ của em.  
  Trong khi đó, các chatbot AI thông thường tuy trả lời trôi chảy nhưng không nắm được hồ sơ học tập, dễ bịa ra điểm chuẩn và không có nguồn kiểm chứng.  
  Nguyện Vọng AI lấp đầy khoảng trống này: nhận hồ sơ riêng của học sinh, đối chiếu dữ liệu có nguồn gốc, phân loại nguyện vọng rõ ràng và chuyển hóa thành kế hoạch học tập từng tuần."*
- **Câu chuyển tiếp**: *"Để biến điều đó thành trải nghiệm đơn giản cho học sinh, sản phẩm được thiết kế xoay quanh 4 câu hỏi tự nhiên."*
- **Thuật ngữ cần giải thích nếu bị hỏi**:
  - *Bịa số liệu (AI Hallucination)*: Hiện tượng LLM tự sinh ra con số điểm chuẩn hoặc học phí nghe rất hợp lý nhưng hoàn toàn không có thật trong văn bản tuyển sinh.
- **Bằng chứng kỹ thuật**: Bộ test so sánh rào chắn AI trong `tests/tu-van-privacy.test.ts` và `tests/tu-van.test.ts`.

---

### 🎬 SLIDE 04: GIẢI PHÁP — 4 CÂU HỎI HÀNH TRÌNH (01:45 - 02:25)
- **Thông điệp chính**: Một hành trình khép kín trả lời 4 câu hỏi cốt lõi của người học: Ở đâu? Đi tới đâu? Cách bao xa? Hôm nay làm gì?
- **Lời thoại đề xuất (35 giây)**:  
  *"Nguyện Vọng AI dẫn dắt học sinh qua 4 câu hỏi:  
  Một: 'Mình đang ở đâu?' — Hồ sơ tự động tính điểm theo từng tổ hợp và cộng điểm ưu tiên chuẩn xác.  
  Hai: 'Muốn đi tới đâu?' — Công cụ khám phá giúp lọc trong 3.648 chương trình theo ngành, khu vực, học phí và sở thích.  
  Ba: 'Còn cách bao xa?' — Danh sách nguyện vọng phân loại thành 4 nhóm Thử sức, Vừa sức, An toàn, Dự phòng và tự động cảnh báo thứ tự xếp.  
  Bốn: 'Hôm nay làm gì?' — Kế hoạch tuần phân bổ việc học vào đúng giờ rảnh và xuất ra Google Calendar.  
  Đặc biệt, hệ thống hoạt động ngay mà không bắt buộc tạo tài khoản: dữ liệu được lưu an toàn tại thiết bị của học sinh."*
- **Câu chuyển tiếp**: *"Em xin phép mở ngay giao diện sản phẩm đang chạy thực tế để quý Ban giám khảo cùng trải nghiệm."*
- **Thuật ngữ cần giải thích nếu bị hỏi**:
  - *Local-first*: Kiến trúc lưu trữ dữ liệu người dùng trên `localStorage` trình duyệt, không đẩy lên máy chủ trừ khi người dùng chủ động yêu cầu đồng bộ, bảo vệ tối đa quyền riêng tư của học sinh THPT.
- **Bằng chứng kỹ thuật**: 4 tính năng tương ứng 4 slice độc lập trong mã nguồn: `features/khoi-dau`, `features/kham-pha`, `features/nguyen-vong`, `features/ke-hoach`.

---

### 🎬 SLIDE 05: DEMO TRỰC TIẾP TRÊN SẢN PHẨM (02:25 - 03:05)
- **Thông điệp chính**: Trải nghiệm thực tế mượt mà, từ nhập điểm đến nhận kế hoạch học tập trong 1 phút.
- **Lời thoại đề xuất (35 giây)**:  
  *"Trên màn hình là luồng tương tác thực tế của sản phẩm:  
  Bước 1: Em nhập điểm thi thử, app lập tức tính ra điểm xét tuyển của mọi tổ hợp có thể.  
  Bước 2: Vào Khám phá, chọn một ngành như Khoa học máy tính, app hiển thị điểm chuẩn 3 năm gần nhất kèm liên kết tới đúng trang PDF của trường.  
  Bước 3: Thêm vào Nguyện vọng, hệ thống tự động gán nhãn Vừa sức hay An toàn và kiểm tra độ cân bằng danh mục.  
  Bước 4: Sang Kế hoạch tuần, app đề xuất lịch ôn tập và cho phép bấm một nút để đưa thẳng vào lịch Google Calendar trên điện thoại."*
- **Câu chuyển tiếp**: *"Đằng sau giao diện trực quan này là một lớp dữ liệu được chuẩn hóa cực kỳ khắt khe."*
- **Thuật ngữ cần giải thích nếu bị hỏi**:
  - *File .ics*: Chuẩn file lịch quốc tế (iCalendar) giúp nhập sự kiện lịch học vào bất kỳ ứng dụng lịch nào (Apple Calendar, Google Calendar, Outlook) mà không cần cấp quyền truy cập tài khoản nhạy cảm.
- **Bằng chứng kỹ thuật**: Link demo trực tiếp tại `https://nguyenvongai.pages.dev`, có thể quét mã QR hoặc mở trực tiếp trên điện thoại.

---

### 🎬 SLIDE 06: DỮ LIỆU TUYỂN SINH TIN CẬY (03:05 - 04:00)
- **Thông điệp chính**: Dữ liệu tuyển sinh được phân tầng tin cậy, chuẩn hóa đúng mã tuyển sinh để tránh nộp nhầm trường/ngành, và lưu vết từng lần cập nhật.
- **Lời thoại đề xuất (45 giây)**:  
  *"Dữ liệu là trái tim của Nguyện Vọng AI. Chúng em phân chia nguồn tin thành 3 tầng:  
  Tầng 1 là Đề án chính thức, kiểm chứng được tới từng số trang PDF của trường.  
  Tầng 2 là trang tổng hợp đã qua đối chiếu.  
  Tầng 3 là ghi chú thực tế như ký túc xá, luôn gắn nhãn chưa chính thức.  
  Điểm mấu chốt: Hệ thống chuẩn hóa chính xác **Mã trường tuyển sinh** và **Mã ngành đào tạo** theo quy định của Bộ để tránh tuyệt đối việc học sinh nộp nhầm cơ sở hay nhầm hệ đào tạo — còn tên viết tắt quen thuộc chỉ dùng làm bí danh hỗ trợ tìm kiếm nhanh.  
  Mọi bản ghi đều lưu ngày cập nhật và link gốc. Khi thiếu thông tin, hệ thống hiển thị rõ là 'Chưa có dữ liệu', tuyệt đối không đoán mò hay điền thay."*
- **Câu chuyển tiếp**: *"Có dữ liệu chuẩn rồi, hệ thống dùng thuật toán gì để hỗ trợ học sinh ra quyết định?"*
- **Thuật ngữ cần giải thích nếu bị hỏi**:
  - *Mã tuyển sinh vs Bí danh trường*: Mã tuyển sinh là mã chính thức theo quy chế (ví dụ: `QSC` là ĐH Công nghệ Thông tin ĐHQG-HCM, mã ngành `7480201`), thí sinh phải điền mã này trên cổng của Bộ GD&ĐT. Bí danh (`UIT`, `ĐH CNTT`) chỉ là từ khóa để tìm kiếm nhanh trong app.
  - *Snapshot*: Bản sao dữ liệu đóng gói tại một thời điểm, được kiểm tra tính toàn vẹn để đảm bảo web app luôn đọc đúng dữ liệu đã được thẩm định.
- **Bằng chứng kỹ thuật**: Cấu trúc dữ liệu trong `src/state/types.ts` (trường `maTruong`, `phuongThuc`, `toHopXet`, `nguonTheoNam`), bộ kiểm tra `tests/du-lieu.test.ts`.

---

### 🎬 SLIDE 07: THUẬT TOÁN HỖ TRỢ QUYẾT ĐỊNH (04:00 - 04:55)
- **Thông điệp chính**: Thuật toán giải thích được, tách biệt rõ giữa tính toán tất định, mô hình thống kê có kiểm định, và bài toán tối ưu lịch học.
- **Lời thoại đề xuất (45 giây)**:  
  *"Hệ thống sử dụng các thuật toán hoàn toàn minh bạch, giải thích được:  
  Một là tính điểm đúng theo từng tổ hợp và điểm ưu tiên giảm dần, thiếu môn báo thiếu, không thay bằng số 0.  
  Hai là phân loại 4 nhóm nguyện vọng dựa trên độ lệch điểm và độ biến động lịch sử của ngành đó — đây là ước lượng có khoảng bất định, không phải cam kết đỗ trượt.  
  Ba là phát hiện và cảnh báo nghịch đảo thứ tự danh mục nguyện vọng.  
  Bốn là thuật toán phân bổ giờ học theo nguyên lý lợi suất giảm dần, ưu tiên môn còn nhiều dư địa cải thiện điểm nhất.  
  Chúng em đã kiểm nghiệm ngược mô hình dự báo bằng phương pháp bỏ-một-năm: tỷ lệ bao phủ đạt 89% năm 2023, 95% năm 2024 và 64% năm 2025. Nhóm công khai cả điểm còn hạn chế này vì năm 2025 đề thi có biến động lớn."*
- **Câu chuyển tiếp**: *"Vậy AI nằm ở đâu trong hệ thống này?"*
- **Thuật ngữ cần giải thích nếu bị hỏi**:
  - *Kiểm định bỏ-một-năm (Leave-one-year-out backtesting)*: Giả lập lấy dữ liệu các năm trước đó để dự báo biên độ điểm chuẩn cho năm tiếp theo, rồi so sánh với điểm chuẩn thực tế xem có nằm trong khoảng dự báo 80% không.
  - *Chia giờ theo hiệu quả biên*: giờ học thứ hai ở một môn tăng ít điểm hơn giờ thứ nhất, nên mỗi 15 phút được đưa vào môn mà em này tăng được nhiều điểm nhất. Mỗi môn có cách ôn riêng (Hóa/Sinh buổi ngắn rải đều, Văn viết bài, Anh đều đặn mỗi ngày, Toán/Lý giải bài và sổ lỗi). Tham số là giả định sư phạm chưa đo trên học sinh thật; kết quả luôn là ước lượng, và app nói thẳng khi mục tiêu khó đạt với quỹ giờ này.
- **Bằng chứng kỹ thuật**: Thuật toán trong `src/engine/toan-bo-chuong-trinh.ts`, `src/engine/toi-uu-nguyen-vong.ts`, `src/engine/toi-uu-lich-hoc.ts` và test `tests/diem-nghen.test.ts`.

---

### 🎬 SLIDE 08: PHÂN ĐỊNH VAI TRÒ AI (04:55 - 05:40)
- **Thông điệp chính**: Quy tắc làm gốc, dữ liệu kiểm chứng, AI chỉ dùng để diễn giải ngôn ngữ tự nhiên.
- **Lời thoại đề xuất (40 giây)**:  
  *"Nguyên tắc cốt lõi của chúng em: **AI không quyết định sự thật**.  
  Những phần cần độ chính xác tuyệt đối như tính điểm, cộng ưu tiên, tra cứu mã ngành thì dùng thuật toán thuần, không tốn AI.  
  Phần ước lượng dùng mô hình thống kê có kiểm định.  
  Mô hình ngôn ngữ lớn (LLM) chỉ được dùng ở tầng diễn giải: trả lời câu hỏi, so sánh ngành học và giải thích sự đánh đổi. AI chỉ nhận đúng dữ liệu mà ứng dụng gửi kèm.  
  Chúng em dựng sẵn 5 rào chắn bảo vệ: chặn số lạ ngoài dữ liệu, lọc mã tuyển sinh bịa, giới hạn 50 lượt/ngày, chế độ Tiết kiệm không gọi AI, và AI tuyệt đối không có quyền tự sửa dữ liệu của học sinh."*
- **Câu chuyển tiếp**: *"Trong thực tế tương tác hàng ngày, trợ lý AI hỗ trợ học sinh như thế nào?"*
- **Thuật ngữ cần giải thích nếu bị hỏi**:
  - *Rào chắn hậu kiểm (Post-generation Guardrail)*: Thuật toán quét câu trả lời của LLM trước khi hiện lên màn hình; nếu câu trả lời chứa số điểm hoặc học phí không khớp với tập dữ liệu gửi kèm, hệ thống lập tức chặn và rơi về thuật toán quy tắc.
  - *Chế độ Tiết kiệm*: Chế độ chạy hoàn toàn bằng thuật toán client-side, 0 đồng chi phí API, phù hợp khi máy yếu hoặc hết hạn mức.
- **Bằng chứng kỹ thuật**: Code hậu kiểm trong `functions/api/tu-van.ts` và `src/engine/tu-van.ts`, kiểm thử tại `tests/tu-van-phan-hoi.test.ts`.

---

### 🎬 SLIDE 09: ỨNG DỤNG AI THỰC TẾ (05:40 - 06:35)
- **Thông điệp chính**: Quy trình 3 bước khép kín từ câu hỏi tự nhiên đến hành động an toàn, loại bỏ hoàn toàn hiện tượng ảo giác.
- **Lời thoại đề xuất (45 giây)**:  
  *"Thay vì làm một chatbot trả lời chung chung, chúng em thiết kế AI thành Trợ lý tư vấn có căn cứ theo 3 bước:  
  Bước 1 — Tự gom ngữ cảnh: Khi học sinh hỏi, app tự động lấy điểm tổ hợp (đã ẩn danh hoàn toàn) cùng 4 đến 6 ngành phù hợp từ đề án gốc gửi kèm vào câu lệnh.  
  Bước 2 — LLM diễn giải & Hậu kiểm: Mô hình phân tích sự đánh đổi trong tối đa 120 từ. Máy chủ tự động kiểm tra số liệu: nếu phát hiện con số điểm chuẩn hay học phí nào không có trong đề án gửi kèm, phản hồi sẽ bị chặn ngay lập tức.  
  Bước 3 — Quyết định an toàn: AI không chỉ trả lời bằng chữ mà trả về các thẻ hành động như [Thêm nguyện vọng], [So sánh ngành]. Điểm an toàn là AI chỉ đề xuất, học sinh phải tự tay bấm 'Xác nhận' thì dữ liệu mới thay đổi."*
- **Câu chuyển tiếp**: *"Dữ liệu tuyển sinh thay đổi mỗi năm. Vậy làm sao hệ thống luôn được làm mới?"*
- **Thuật ngữ cần giải thích nếu bị hỏi**:
  - *Human-in-the-loop (Xác nhận chủ động)*: Nguyên tắc thiết kế AI không bao giờ tự ý sửa đổi danh sách nguyện vọng hoặc thông tin cá nhân của người học; AI chỉ đề xuất thẻ chờ, người dùng chủ động bấm xác nhận.
- **Bằng chứng kỹ thuật**: Schema phản hồi `functions/api/tu-van.ts`, giao diện thẻ hành động tại `src/features/tu-van/trinh-bay-phan-hoi.ts`.

---

### 🎬 SLIDE 10: CỘNG ĐỒNG CÙNG HOÀN THIỆN (06:35 - 07:20)
- **Thông điệp chính**: Dữ liệu tuyển sinh tự hoàn thiện mỗi mùa nhờ quy trình đóng góp có AI hỗ trợ và con người kiểm duyệt.
- **Lời thoại đề xuất (40 giây)**:  
  *"Dữ liệu tuyển sinh thay đổi từng mùa. Chúng em xây dựng vòng lặp hoàn thiện 4 bước:  
  Một: Học sinh thấy số liệu chưa khớp có thể bấm nút 'Báo sai' ngay trên màn hình.  
  Hai: Cộng tác viên tại các trường sử dụng công cụ AI hỗ trợ đọc đề án PDF để trích xuất điểm chuẩn kèm câu trích dẫn và số trang.  
  Ba: Dữ liệu vào hàng chờ kiểm duyệt; hệ thống tự động đối chiếu và cảnh báo nếu có chênh lệch lớn.  
  Bốn: Quản trị viên thẩm định và xuất bản bản snapshot mới; các bài kiểm định tự động chạy lại.  
  AI chỉ hỗ trợ nhập liệu, quyền xuất bản dữ liệu luôn thuộc về con người."*
- **Câu chuyển tiếp**: *"Từ quy trình chặt chẽ đó, đâu là những lợi thế khác biệt khó sao chép của sản phẩm?"*
- **Thuật ngữ cần giải thích nếu bị hỏi**:
  - *CMS kiểm duyệt*: Hệ thống quản trị nội bộ riêng biệt (`cms/`) cho phép phân quyền cộng tác viên theo từng trường, có lưu nhật ký sửa đổi chi tiết theo thời gian.
- **Bằng chứng kỹ thuật**: Mã nguồn CMS trong thư mục `cms/`, kiểm thử phân quyền tại `tests/cms-vai-tro.test.ts`.

---

### 🎬 SLIDE 11: LỢI THẾ KHÁC BIỆT (07:20 - 08:05)
- **Thông điệp chính**: Giá trị cạnh tranh không nằm ở vỏ bọc chatbot, mà nằm ở dữ liệu có nguồn, logic bản địa hóa và sự tôn trọng người học.
- **Lời thoại đề xuất (40 giây)**:  
  *"Lợi thế của Nguyện Vọng AI không nằm ở giao diện chatbot, vì chatbot ai cũng có thể làm được trong vài ngày. Giá trị bền vững nằm ở 4 điểm:  
  Thứ nhất: Dữ liệu có nguồn trích dẫn tới từng trang PDF đề án, có lịch sử phiên bản rõ ràng.  
  Thứ hai: Thuật toán chuẩn hóa đúng quy chế tuyển sinh Việt Nam từ điểm ưu tiên đến 73 tổ hợp môn.  
  Thứ ba: 64 bộ kiểm thử tự động rà soát liên tục; dữ liệu sai lệch là hệ thống báo ngay, không có lỗi âm thầm.  
  Thứ tư: Quyền riêng tư — toàn bộ dữ liệu điểm số thuộc về học sinh, không thu thập thông tin định danh cá nhân.  
  Chúng em hiểu rằng sản phẩm cần tiếp tục được đo lường thực tế cùng học sinh trong mùa tuyển sinh tới."*
- **Câu chuyển tiếp**: *"Nhóm xin thẳng thắn báo cáo những gì đã hoàn thành và những gì còn đang phát triển."*
- **Thuật ngữ cần giải thích nếu bị hỏi**:
  - *Zero-PII (Không lưu thông tin định danh cá nhân)*: Ứng dụng không yêu cầu họ tên, số CCCD, số điện thoại hay email của học sinh để sử dụng tính năng tính điểm và sắp xếp nguyện vọng.
- **Bằng chứng kỹ thuật**: 64 tệp test tự động trong thư mục `tests/`.

---

### 🎬 SLIDE 12: TRẠNG THÁI THỰC TẾ (08:05 - 08:50)
- **Thông điệp chính**: Minh bạch tối đa giữa phần đã hoàn thiện, phần đang thử nghiệm và các giới hạn nhóm tự nhận diện.
- **Lời thoại đề xuất (45 giây)**:  
  *"Chúng em xin báo cáo minh bạch trạng thái kỹ thuật:  
  Những gì đã chạy thực tế và có test tự động: Dữ liệu 3.648 chương trình, phân loại 4 nhóm nguyện vọng, tính điểm ưu tiên, kế hoạch học tập xuất lịch, Trợ lý AI có hậu kiểm số liệu và CMS kiểm duyệt.  
  Những gì đang thử nghiệm: Giao thức mở rộng trợ lý ngoài, cổng tiếp nhận đóng góp cộng đồng và công thức ước lượng xác suất theo lịch sử.  
  Những hạn chế nhóm tự nhận thấy: Điểm 2025 hiện là mốc tham khảo cho mùa 2026 trong khi chờ các trường công bố đề án mới; 602 chương trình đã có học phí chính thức (các ngành còn lại ước tính theo khối); và chưa hỗ trợ tài khoản đồng bộ tự động đa thiết bị.  
  Mọi con số trên slide đều có thể kiểm chứng độc lập trong mã nguồn."*
- **Câu chuyển tiếp**: *"Dựa trên thực tế đó, lộ trình hành động của nhóm trong các giai đoạn tới được xác định rõ ràng."*
- **Thuật ngữ cần giải thích nếu bị hỏi**:
  - *602 ngành có học phí chính thức*: Trong 3.648 chương trình, chỉ những ngành có văn bản học phí cụ thể của trường mới có link nguồn; các ngành còn lại hiển thị nhãn `≈ ... (ước tính)` để học sinh không bị nhầm lẫn.
- **Bằng chứng kỹ thuật**: Báo cáo kiểm toán dữ liệu `docs/AUDIT-DU-LIEU-2026-10-16.md` và `tests/toan-bo-chuong-trinh.test.ts`.

---

### 🎬 SLIDE 13: PHƯƠNG HƯỚNG PHÁT TRIỂN (08:50 - 09:30)
- **Thông điệp chính**: Lộ trình 4 giai đoạn từ công cụ chạy được đến nền tảng hỗ trợ tuyển sinh tin cậy cho học sinh cả nước.
- **Lời thoại đề xuất (35 giây)**:  
  *"Lộ trình của chúng em gồm 4 bước thực tế:  
  Ngay bây giờ: Cập nhật đề án tuyển sinh 2026 ngay khi các trường đại học công bố và tối ưu giao diện trên thiết bị di động.  
  Một đến ba tháng: Bổ sung tính năng đồng bộ đám mây tùy chọn và tuyển cộng tác viên sinh viên đối chiếu dữ liệu từ 10 trường đầu tiên.  
  Mùa tuyển sinh 2027: Tiếp nhận dữ liệu mới qua cổng đóng góp và sử dụng kết quả trúng tuyển thực tế để hiệu chỉnh độ chính xác của thuật toán.  
  Sáu đến mười hai tháng: Mở rộng sang khối cao đẳng, học nghề, và hợp tác trực tiếp với các trường THPT để đo lường hiệu quả thực tế."*
- **Câu chuyển tiếp**: *"Em xin tóm gọn lại thông điệp lớn nhất mà Nguyện Vọng AI muốn gửi gắm."*
- **Thuật ngữ cần giải thích nếu bị hỏi**:
  - *Hiệu chỉnh mô hình bằng kết quả thật*: Thu thập phản hồi trúng tuyển ẩn danh từ thí sinh mùa 2026 để làm dữ liệu kiểm chứng, điều chỉnh trọng số biên độ điểm chuẩn cho mùa 2027.
- **Bằng chứng kỹ thuật**: Kế hoạch phát triển chi tiết trong `docs/KE-HOACH-HACKATHON.md`.

---

### 🎬 SLIDE 14: KẾT LUẬN & HỎI ĐÁP (09:30 - 10:00)
- **Thông điệp chính**: Không thay học sinh quyết định — giúp em đưa ra lựa chọn có căn cứ.
- **Lời thoại đề xuất (25 giây)**:  
  *"Kính thưa Ban giám khảo, Nguyện Vọng AI không sinh ra để thay học sinh quyết định tương lai. Chúng em sinh ra để giúp các em tự tin đưa ra quyết định dựa trên dữ liệu có nguồn, thuật toán giải thích được, và sự chung tay hoàn thiện của cộng đồng giáo dục.  
  Nhóm RTC Team xin trân trọng cảm ơn Ban giám khảo và quý thầy cô đã lắng nghe. Chúng em sẵn sàng trả lời các câu hỏi và thực hiện demo chuyên sâu."*
- **Bằng chứng kỹ thuật**: Demo trực tiếp tại `https://nguyenvongai.pages.dev`, mã nguồn mở và tài liệu kiểm thử đầy đủ trong repository.

---

## 💡 BẢNG TRA CỨU CÂU HỎI VÀ ĐỐI THOẠI VỚI BAN GIÁM KHẢO (Q&A CHEATSHEET)

| Câu hỏi của Ban Giám Khảo | Câu trả lời trọng tâm của Founder | Bằng chứng trong code |
|---|---|---|
| **"Tại sao không dùng luôn ChatGPT để hỏi cho nhanh?"** | ChatGPT không biết hồ sơ của em, hay bịa điểm chuẩn, không có liên kết tới trang đề án PDF, và không tính được điểm ưu tiên giảm dần theo quy chế Việt Nam. Nguyện Vọng AI dùng thuật toán quy tắc để tính điểm chính xác, và chỉ dùng AI để giải thích sự đánh đổi. | `functions/api/tu-van.ts`, `src/engine/toan-bo-chuong-trinh.ts` |
| **"Mã trường và bí danh khác nhau thế nào?"** | Mã trường (như `QSC`, `BKA`) là mã pháp lý bắt buộc khi thí sinh đăng ký trên cổng của Bộ GD&ĐT. Bí danh (`UIT`, `Bách Khoa`) chỉ là từ khóa phụ trợ tìm kiếm trong app để học sinh gõ từ quen thuộc vẫn tìm ra đúng mã tuyển sinh. | `src/data/truong-danh-muc.ts`, `src/engine/tim-kiem.ts` |
| **"Nếu trường thay đổi điểm chuẩn hoặc đề án thì sao?"** | Dữ liệu được quản lý theo từng bản snapshot có ngày cập nhật và liên kết tới trang PDF. Khi có đề án mới, quản trị viên duyệt snapshot mới và toàn bộ hệ thống tự động cập nhật đồng bộ. | `src/data/du-lieu-that.json`, `cms/` |
| **"Xác suất trúng tuyển có đảm bảo đỗ 100% không?"** | Tuyệt đối không. Hệ thống phân loại 4 nhóm (Thử sức, Vừa sức, An toàn, Dự phòng) dựa trên độ lệch điểm và biến động lịch sử, luôn cảnh báo có khoảng bất định. Không bao giờ cam kết đỗ trượt. | `src/features/nguyen-vong/nhan-nguyen-vong.ts` |
| **"Chi phí vận hành AI có bị đắt khi nhiều người dùng không?"** | Nhóm thiết kế bậc thang chi phí: cache KV 6 giờ -> thuật toán quy tắc -> LLM súc tích <120 từ. Mỗi hồ sơ giới hạn 50 lượt/ngày và có chế độ Tiết kiệm chạy 100% offline 0 đồng chi phí. | `functions/_thu-vien/ai/bac-thang.ts`, `src/features/tu-van/dung-ai.ts` |

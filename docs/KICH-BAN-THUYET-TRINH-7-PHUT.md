# KỊCH BẢN THUYẾT TRÌNH 7 PHÚT (PITCH DECK SỐNG ĐỘNG)
## DỰ ÁN: NGUYỆN VỌNG AI (BÀI TOÁN SỐ 6 - CHỌN TRƯỜNG & CHƯƠNG TRÌNH HỌC)
**Cuộc thi:** Decision Intelligence Challenge 2026  
**Thời lượng:** Đúng 7 phút (420 giây)  
**Tệp slide Beamer LaTeX:** [`docs/slide-beamer.tex`](file:///d:/07-Competitions-Hackathons/mlai/nguyenvongai/docs/slide-beamer.tex)  
**Thư mục ảnh chụp màn hình:** [`.agent-runtime/screenshots/`](file:///d:/07-Competitions-Hackathons/mlai/nguyenvongai/.agent-runtime/screenshots/)  
**Live Web Demo:** `https://nguyenvongai.pages.dev`

---

## MA TRẬN PHÂN BỔ THỜI GIAN & ÁNH XẠ ẢNH MÀN HÌNH

| Slide | Tiêu đề Slide | Thời gian | Điểm BTC nhắm tới | File ảnh minh họa đề xuất |
|:---:|---|:---:|---|---|
| **1** | Bìa: Nguyện Vọng AI - Decision Intelligence Tuyển sinh | **30s** | Nhận diện & Định vị | `06-hom-nay.png` (Hero Phone Mockup) |
| **2** | Bối cảnh & Điểm nghẽn Ra quyết định tại Việt Nam | **45s** | Tiêu chí 1 (5đ) & 2 (5đ) | `02-bat-dau-1.png`, `03-bat-dau-2.png` |
| **3** | Phát biểu Bài toán, Người dùng Mục tiêu & 4 Câu hỏi | **45s** | Tiêu chí 1 (10đ) | `04-bat-dau-3.png` |
| **4** | Tính Khác biệt: Lớp Trí tuệ Quyết định vs Chatbot | **45s** | Tiêu chí 3 (20đ) | `11-so-sanh.png` |
| **5** | Luồng Quyết định Hoàn chỉnh (End-to-End) & Phễu 4 Tầng | **60s** | Tiêu chí 5 (5đ) & 6 (5đ) | **`12-nguyen-vong.png`**, `14-thu-tinh-huong.png` |
| **6** | Chiến lược Dữ liệu 3 Tầng & Bản địa hóa Việt Nam | **45s** | Tiêu chí 2 (10đ) & 4 (5đ) | `09-kham-pha-ve-du-lieu.png`, `10-chi-tiet-nganh.png` |
| **7** | Đổi mới AI & Kiểm định Backtest Bỏ-một-năm | **60s** | Tiêu chí 4 (15đ) | `15-thu-tinh-huong-ket-qua.png`, `18-muc-tieu.png` |
| **8** | Vận hành Bền vững & Mở rộng CMS Tình nguyện viên | **45s** | Tiêu chí 5 (10đ) | Sơ đồ TikZ Data Pipeline + CMS |
| **9** | Quản trị Rủi ro, Minh bạch & Đạo đức AI | **30s** | Tiêu chí 6 (5đ) | `29-ho-so-chia-se.png`, `33-tu-van.png` |
| **10** | Tổng kết, Giá trị Xã hội & Trình diễn Web Demo | **15s** | Tiêu chí 1 (5đ) & Demo | `20-ke-hoach-tuan-viec.png` + QR Code Demo |

---

## KỊCH BẢN NÓI CHI TIẾT (SPEAKER NOTES CHO 7 PHÚT)

### 🎙️ [00:00 - 00:30] SLIDE 1: MỞ ĐẦU & ĐỊNH VỊ
> *"Kính thưa Ban giám khảo và toàn thể hội đồng,*  
> *Mỗi mùa thi, có hơn 1 triệu học sinh lớp 12 và phụ huynh Việt Nam phải đối mặt với một quyết định định đoạt cả tương lai: **Đặt nguyện vọng đại học**.  
> Hôm nay, nhóm chúng em xin được đại diện mang đến **Nguyện Vọng AI** — một giải pháp Decision Intelligence được may đo chính xác cho bối cảnh tuyển sinh Việt Nam, giải quyết bài toán số 6 của thử thách: Giúp học sinh không chỉ biết mình đỗ trường nào, mà thấu hiểu sự đánh đổi và chuyển hóa quyết định thành hành động học tập mỗi ngày."*

---

### 🎙️ [00:30 - 01:15] SLIDE 2: BỐI CẢNH & ĐIỂM NGHẼN
> *"Tại sao một quyết định quan trọng như vậy lại thường dẫn đến kết quả cay đắng?  
> Thứ nhất, **Dữ liệu phân mảnh cực độ**: Thí sinh phải tự đọc hàng trăm file PDF đề án tuyển sinh dài cả trăm trang của từng trường, đối mặt với ma trận 73 tổ hợp môn.  
> Thứ hai, **Quy chế đặc thù phức tạp**: Quy chế Bộ GD&ĐT quy định điểm ưu tiên khu vực và đối tượng giảm dần khi tổng điểm từ 22.5 trở lên — một công thức mà hầu như không trang web tuyển sinh nào tính đúng.  
> Thứ ba, **Bất định và đứt gãy hành động**: Học sinh không biết điểm chuẩn năm nay sẽ dao động thế nào; danh sách nguyện vọng thường bị dồn về trường top dẫn đến trượt trắng, hoặc an toàn quá mức. Quan trọng nhất: biết mình thiếu 1.5 điểm nhưng không ai chỉ cho các em mỗi tuần phải học thêm bao nhiêu giờ để bù đắp."*

---

### 🎙️ [01:15 - 02:00] SLIDE 3: BÀI TOÁN & NGƯỜI DÙNG MỤC TIÊU
> *"Để giải quyết triệt để điểm nghẽn này, nhóm chúng em phát biểu bài toán: Xây dựng một **Lớp Trí tuệ Hỗ trợ Ra Quyết định (Decision Intelligence Layer)** trả lời trọn vẹn 4 câu hỏi sống còn của học sinh:  
> 1. **Mình đang ở đâu?** — Xác định chính xác năng lực thực và điểm ưu tiên giảm dần theo đúng quy chế.  
> 2. **Muốn đi tới đâu?** — Đối chiếu sở thích ngành, vị trí địa lý và ngân sách học phí thực tế của gia đình.  
> 3. **Còn cách bao xa?** — Phân tích khoảng cách điểm theo tổ hợp xét tuyển tối ưu nhất.  
> 4. **Hôm nay làm gì?** — Chuyển hóa mục tiêu thành lịch tự học từng tuần, khớp khít với thời khóa biểu trường của em."*

---

### 🎙️ [02:00 - 02:45] SLIDE 4: KHÁC BIỆT CỐT LÕI (VƯỢT XA CHATBOT & TRA CỨU)
> *"Điểm sáng tạo và khác biệt cốt lõi của Nguyện Vọng AI so với thị trường là gì?  
> Nếu các cổng tra cứu truyền thống chỉ trả lời những con số quá khứ chết, và chatbot AI thông thường chỉ nói văn xuôi chung chung, dễ sinh ảo giác (hallucination) và bịa ra xác suất đỗ, thì **Nguyện Vọng AI là một Lớp Quyết Định (Decision Layer)**:  
> - Đầu vào là hồ sơ đa chiều có cấu trúc: điểm từng môn, tổ hợp, ngân sách, giờ trống.  
> - Đầu ra là một chiến lược nguyện vọng 4 giỏ cân bằng, giải thích rõ ràng sự đánh đổi.  
> - Điểm chuẩn nào cũng kèm nguồn, phần lớn dẫn tới đúng trang PDF đề án của trường; học phí chỗ nào chỉ là ước tính thì app ghi rõ "≈ ước tính".  
> Và triết lý của chúng em: **AI không quyết định thay con người. AI phân tích đánh đổi, minh bạch giả định và giữ quyền làm chủ tuyệt đối cho học sinh.**"*

---

### 🎙️ [02:45 - 03:45] SLIDE 5: LUỒNG TRẢI NGHIỆM END-TO-END & PHỄU 4 TẦNG
*(Chỉ tay vào màn hình điện thoại visual slide 5)*
> *"Kính mời Ban giám khảo theo dõi luồng ra quyết định 5 bước khép kín trên giao diện Mobile-First mà chúng em đã hoàn thiện:  
> 1. **Tạo hồ sơ trong 60 giây**: Học sinh chọn tổ hợp, nhập điểm kiểm tra và khu vực ưu tiên.  
> 2. **Khám phá đa chiều**: Hệ thống quét qua 3.652 chương trình của 118 trường đại học.  
> 3. **Cơ cấu danh sách 4 tầng thông minh**:  
>    - **Thử sức**: điểm chuẩn năm gần nhất **cao hơn** điểm của em — để vươn tới ước mơ.  
>    - **Vừa sức**: điểm của em cao hơn điểm chuẩn **chưa tới 1,5 điểm**.  
>    - **An toàn**: cao hơn **từ 1,5 đến dưới 4 điểm**.  
>    - **Dự phòng**: cao hơn **từ 4 điểm trở lên** — để giảm nguy cơ trượt hết nguyện vọng (không có mức nào là "chắc chắn đậu").  
> 4. **Mô phỏng tình huống What-If**: Học sinh có thể kéo thanh trượt 'Nếu điểm thi thật tăng/giảm 1 điểm' thì danh sách phản ứng ra sao.  
> 5. **Hành động**: Động cơ xếp lịch tự động đưa môn hổng kiến thức vào giờ tự học mỗi tối."*

---

### 🎙️ [03:45 - 04:30] SLIDE 6: CHIẾN LƯỢC DỮ LIỆU & PHÙ HỢP BỐI CẢNH VIỆT NAM
> *"Một hệ thống AI hỗ trợ quyết định chỉ có giá trị khi dữ liệu thực sự đáng tin. Nhóm áp dụng chiến lược dữ liệu 3 tầng:  
> - **Tầng 1 (Đề án gốc)**: 3.652 chương trình từ 118 trường, kèm đường link dẫn thẳng tới trang tài liệu PDF của Hội đồng tuyển sinh.  
> - **Tầng 2 (Điểm chuẩn đối chiếu)**: Chuỗi dữ liệu lịch sử 2023–2025 được đối chiếu chéo.  
> - **Tầng 3 (Dữ liệu cộng đồng)**: Học phí có văn bản của trường ở 602 chương trình (các chương trình khác chỉ có ước tính, ghi rõ "≈ ước tính"), chi phí KTX, đời sống — dữ liệu cộng đồng đều phải qua duyệt CMS, bắt buộc có link nguồn.  
> Đặc biệt, hệ thống bản địa hóa triệt để: Tích hợp công thức điểm ưu tiên mới nhất của Bộ GD&ĐT, 73 tổ hợp môn chính thức, và tính năng chia sẻ danh sách nguyện vọng cho cha mẹ qua đường dẫn Zalo/Facebook mà phụ huynh không cần tạo tài khoản rườm rà."*

---

### 🎙️ [04:30 - 05:30] SLIDE 7: ĐỔI MỚI AI & KIỂM ĐỊNH DỰ BÁO NGƯỢC (BACKTESTING)
> *"Tại Nguyện Vọng AI, chúng em định nghĩa AI theo nghĩa rộng của Decision Intelligence với 4 vai trò cụ thể:  
> 1. **Mô hình Dự báo Khoảng điểm chuẩn**: Thay vì đưa ra 1 con số duy nhất gây ngộ nhận, chúng em dự báo một khoảng tin cậy dựa trên phân vị $P_{10}$ và $P_{90}$ từ hơn 1.300 cặp năm biến động thực tế.  
> 2. **Kiểm định Backtesting Bỏ-một-năm (Leave-one-year-out)**: Chúng em tự viết unit test chạy thực tế:  
>    - Năm 2023: Khoảng dự báo phủ đúng **89%** điểm chuẩn thật (sai số trung bình 1,0 điểm).  
>    - Năm 2024: Phủ đúng **95%** điểm chuẩn thật (sai số 1,2 điểm).  
>    - Năm 2025: Kỳ thi có biến động đề thi bất thường, độ phủ giảm xuống **64%** (sai số 1,9 điểm). *(Số đo ngày 15/10 trên dữ liệu hiện tại; chạy lại `npx tsx tests/du-bao-diem-chuan.test.ts` trước buổi thuyết trình.)* Lúc này, hệ thống minh bạch nói thẳng với học sinh: 'Khoảng điểm năm nay có độ biến động cao, đây không phải xác suất đỗ'.  
> 3. **Động cơ Tối ưu Ràng buộc (Constraint Engine)**: Xếp lịch tự học vào đúng khoảng thời gian trống theo thời khóa biểu thực.  
> 4. **Tư vấn Căn cứ (Grounded LLM)**: Sử dụng RAG chặt chẽ, loại bỏ hoàn toàn việc bịa số liệu."*

---

### 🎙️ [05:30 - 06:15] SLIDE 8: MÔ HÌNH VẬN HÀNH BỀN VỮNG & CMS TÌNH NGUYỆN VIÊN
> *"Làm sao hệ thống sống được qua các mùa tuyển sinh?  
> Chúng em đã thiết kế và kiểm nghiệm trọn vẹn đường ống dữ liệu 5 bước:  
> `Tình nguyện viên sinh viên nhập $\rightarrow$ CMS nội bộ $\rightarrow$ Quản trị viên duyệt $\rightarrow$ Xuất bản snapshot SHA-256 $\rightarrow$ Học sinh nhận bản cập nhật tức thì.`  
> - Học sinh có nút **Báo sai số liệu** trực tiếp trên từng trang ngành gửi thẳng về hộp thư phụ trách trường.  
> - Toàn bộ hệ thống chạy trên nền tảng Serverless Edge (Cloudflare Pages, D1 SQLite, KV Cache) với chi phí vận hành gần như bằng 0, đáp ứng hàng trăm ngàn lượt truy cập đồng thời mà không nghẽn mạng."*

---

### 🎙️ [06:15 - 06:45] SLIDE 9: QUẢN TRỊ RỦI RO & ĐẠO ĐỨC AI
> *"Để bảo vệ tối đa lợi ích của học sinh, chúng em áp dụng 4 nguyên tắc đạo đức AI:  
> 1. **Nói không với ảo tưởng xác suất**: Mọi màn hình đều dán nhãn 'Không phải xác suất đỗ, chỉ là điểm đối chiếu tham khảo'.  
> 2. **Minh bạch nguồn gốc**: Mỗi con số đều đi kèm tài liệu kiểm chứng.  
> 3. **Quyền riêng tư tuyệt đối (Local-first)**: Dữ liệu điểm thi và thời khóa biểu lưu ngay trên điện thoại của học sinh, không thu thập danh tính trái phép.  
> 4. **Cấu hình độc lập (Decoupled Engine)**: Quy chế Bộ thay đổi năm nào, chỉ cần cập nhật Rule Engine năm đó mà không phải viết lại ứng dụng."*

---

### 🎙️ [06:45 - 07:00] SLIDE 10: TỔNG KẾT & MỜI TRẢI NGHIỆM DEMO
> *"Tóm lại, Nguyện Vọng AI không phải là một mô hình thử nghiệm lý thuyết, mà là một **sản phẩm đã vận hành hoàn chỉnh với 3.652 chương trình đào tạo, 33 giao diện chuyên sâu và 24 bộ test tự động**.  
> Chúng em tin rằng đây chính là giải pháp Decision Intelligence thiết thực nhất, giải tỏa áp lực cho hàng triệu gia đình Việt Nam.  
> Kính mời Ban Giám Khảo cùng quét mã QR hoặc truy cập `nguyenvongai.pages.dev` để trực tiếp trải nghiệm bản demo.  
> Nhóm chúng em xin trân trọng cảm ơn và sẵn sàng nhận câu hỏi phản biện từ Ban Giám Khảo!"*

# KỊCH BẢN THUYẾT TRÌNH 7 PHÚT (PITCH DECK SỐNG ĐỘNG)
## DỰ ÁN: NGUYỆN VỌNG AI (BÀI TOÁN SỐ 6 - CHỌN TRƯỜNG & CHƯƠNG TRÌNH HỌC)
**Cuộc thi:** Decision Intelligence Challenge 2026  
**Thời lượng:** Đúng 7 phút (420 giây)  
**Tệp slide Beamer LaTeX:** [`docs/slide-beamer.tex`](file:///d:/07-Competitions-Hackathons/mlai/nguyenvongai/docs/slide-beamer.tex)  
**Thư mục ảnh chụp màn hình:** [`.agent-runtime/screenshots/`](file:///d:/07-Competitions-Hackathons/mlai/nguyenvongai/.agent-runtime/screenshots/)  
**Live Web Demo:** `https://nguyenvongai.pages.dev`  
**Số liệu được phép nói:** chỉ dùng `docs/SO-LIEU-CHOT-NOP-BAI.md` (đo 17/10/2026), kể cả mục "Những điều KHÔNG được nói". Số đổi khi dữ liệu đổi: chạy `npx tsx scripts/so-lieu-nop-bai.mts` trước buổi thuyết trình.

---

## MA TRẬN PHÂN BỔ THỜI GIAN & ÁNH XẠ ẢNH MÀN HÌNH

| Slide | Tiêu đề Slide | Thời gian | Điểm BTC nhắm tới | File ảnh minh họa đề xuất |
|:---:|---|:---:|---|---|
| **1** | Bìa: Nguyện Vọng AI - Decision Intelligence Tuyển sinh | **30s** | Nhận diện & Định vị | `06-hom-nay.png` (Hero Phone Mockup) |
| **2** | Bối cảnh & Điểm nghẽn Ra quyết định tại Việt Nam | **45s** | Tiêu chí 1 (5đ) & 2 (5đ) | `02-bat-dau-1.png`, `03-bat-dau-2.png` |
| **3** | Phát biểu Bài toán, Người dùng Mục tiêu & 4 Câu hỏi | **45s** | Tiêu chí 1 (10đ) | `04-bat-dau-3.png` |
| **4** | Tính Khác biệt: Lớp Trí tuệ Quyết định vs Chatbot | **45s** | Tiêu chí 3 (20đ) | `11-so-sanh.png` |
| **5** | Luồng Quyết định Hoàn chỉnh (End-to-End) & Phễu 4 Tầng | **60s** | Tiêu chí 5 (5đ) & 6 (5đ) | **`12-nguyen-vong.png`**, `14-thu-tinh-huong.png` (Bản đồ cơ hội, Phòng thử điểm: chụp lại từ app hiện tại) |
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
> - Điểm chuẩn nào cũng kèm nhãn nguồn: 1.492 chương trình dẫn tới đúng trang PDF đề án của trường; phần còn lại từ trang tổng hợp và app ghi "chưa đối chiếu đề án". Chỗ nào thiếu số thì app nói "chưa có", không điền số ước tính.  
> Và triết lý của chúng em: **AI không quyết định thay con người. AI phân tích đánh đổi, minh bạch giả định và giữ quyền làm chủ tuyệt đối cho học sinh.**"*

---

### 🎙️ [02:45 - 03:45] SLIDE 5: LUỒNG TRẢI NGHIỆM END-TO-END & PHỄU 4 TẦNG
*(Chỉ tay vào màn hình điện thoại visual slide 5)*
> *"Kính mời Ban giám khảo theo dõi luồng ra quyết định 5 bước khép kín trên giao diện Mobile-First mà chúng em đã hoàn thiện:  
> 1. **Tạo hồ sơ 3 bước** (hoặc xem ngay bằng hồ sơ mẫu): Học sinh chọn tổ hợp, nhập điểm và khu vực ưu tiên.  
> 2. **Khám phá đa chiều**: Hệ thống so với 3.648 chương trình của 118 trường, kèm **Bản đồ cơ hội**: bao nhiêu ngành ở từng nhãn.  
> 3. **Cơ cấu danh sách 4 tầng thông minh**:  
>    - **Thử sức**: điểm chuẩn năm gần nhất **cao hơn** điểm của em — để vươn tới ước mơ.  
>    - **Vừa sức**: điểm của em cao hơn điểm chuẩn **chưa tới 1,5 điểm**.  
>    - **An toàn**: cao hơn **từ 1,5 đến dưới 4 điểm**.  
>    - **Dự phòng**: cao hơn **từ 4 điểm trở lên** — để giảm nguy cơ trượt hết nguyện vọng (không có mức nào là "chắc chắn đậu").  
> 4. **Mô phỏng What-If**: trong **Phòng thử điểm**, học sinh kéo điểm từng môn để xem ngành nào đổi nhãn (xem thử, không ghi vào hồ sơ).  
> 5. **Hành động**: Động cơ xếp lịch tự động đưa môn hổng kiến thức vào giờ tự học mỗi tối."*

---

### 🎙️ [03:45 - 04:30] SLIDE 6: CHIẾN LƯỢC DỮ LIỆU & PHÙ HỢP BỐI CẢNH VIỆT NAM
> *"Một hệ thống AI hỗ trợ quyết định chỉ có giá trị khi dữ liệu thực sự đáng tin. Nhóm áp dụng chiến lược dữ liệu 3 tầng:  
> - **Tầng 1 (Đề án gốc)**: 1.492 trong 3.648 chương trình của 118 trường gắn nguồn đề án PDF, có link và số trang.  
> - **Tầng 2 (Nguồn thứ cấp)**: 2.156 chương trình từ trang tổng hợp, gồm điểm 2026, đối chiếu chéo với VnExpress (khớp 92,9% ở các cặp năm 2026), gắn nhãn "chưa đối chiếu đề án". Điểm có phần lẻ khớp PDF ở 201/201 dòng đã kiểm; điểm số nguyên chưa kiểm hết, chúng em nói thẳng điều đó.  
> - **Tầng 3 (Dữ liệu cộng đồng)**: ký túc xá, đời sống, lưu ý — phải qua duyệt CMS, bắt buộc có link nguồn, gắn nhãn "chưa phải số liệu chính thức". Học phí: 662 chương trình hiển thị theo VnExpress (nguồn thứ cấp), chương trình khác ghi "chưa có".  
> Đặc biệt, hệ thống bản địa hóa triệt để: Tích hợp công thức điểm ưu tiên mới nhất của Bộ GD&ĐT, 73 tổ hợp môn chính thức, và tính năng chia sẻ danh sách nguyện vọng cho cha mẹ qua đường dẫn Zalo/Facebook mà phụ huynh không cần tạo tài khoản rườm rà."*

---

### 🎙️ [04:30 - 05:30] SLIDE 7: ĐỔI MỚI AI & KIỂM ĐỊNH DỰ BÁO NGƯỢC (BACKTESTING)
> *"Tại Nguyện Vọng AI, chúng em định nghĩa AI theo nghĩa rộng của Decision Intelligence với 4 vai trò cụ thể:  
> 1. **Dự báo thống kê điểm chuẩn 2027**: điểm năm gần nhất kèm khoảng từ phân vị $P_{10}$ và $P_{90}$ của biến động giữa hai năm liền kề (2.526 cặp thực tế). Đây là phương pháp thống kê; mô hình học máy đã huấn luyện nhưng đang tắt vì không khớp dữ liệu hiện tại, nên chúng em không nói đó là AI học máy. Mọi dự báo hiện ở mức tin cậy thấp vì điểm mới nhất là 2026 từ trang tổng hợp, và app hiện rõ điều đó.  
> 2. **Kiểm định Backtesting Bỏ-một-năm (Leave-one-year-out)**: Chúng em tự viết unit test chạy thực tế:  
>    - Năm 2023: Khoảng danh nghĩa 80% phủ **91,1%** điểm chuẩn thật (sai số trung bình 1,04 điểm).  
>    - Năm 2024: Phủ **93,2%** (sai số 1,15 điểm).  
>    - Năm 2025: Kỳ thi biến động bất thường, độ phủ giảm xuống **76,6%** (sai số 1,74 điểm). *(Số đo ngày 17/10; chạy lại `npx tsx tests/du-bao-diem-chuan.test.ts` trước buổi thuyết trình. Đây là kiểm định trong mẫu của cùng dữ liệu, chưa phải ngoài mẫu.)* Hệ thống nói thẳng với học sinh: 'Đây không phải xác suất đỗ'.  
> 3. **Động cơ Tối ưu Ràng buộc (Constraint Engine)**: Xếp lịch tự học vào đúng khoảng thời gian trống theo thời khóa biểu thực.  
> 4. **Tư vấn có căn cứ (Grounded LLM)**: chỉ dùng số liệu có nguồn gửi kèm, hậu kiểm số trong câu trả lời, lọc mã nguồn bịa; vẫn có thể diễn đạt sai nên mọi câu trả lời kèm nguồn để mở kiểm tra."*

---

### 🎙️ [05:30 - 06:15] SLIDE 8: MÔ HÌNH VẬN HÀNH BỀN VỮNG & CMS TÌNH NGUYỆN VIÊN
> *"Làm sao hệ thống sống được qua các mùa tuyển sinh?  
> Chúng em đã thiết kế và kiểm nghiệm trọn vẹn đường ống dữ liệu 5 bước:  
> `Tình nguyện viên sinh viên nhập $\rightarrow$ CMS nội bộ $\rightarrow$ Quản trị viên duyệt $\rightarrow$ Xuất bản snapshot SHA-256 $\rightarrow$ Học sinh nhận bản cập nhật tức thì.`  
> - Học sinh có nút **Báo sai số liệu** trực tiếp trên từng trang ngành gửi thẳng về hộp thư phụ trách trường.  
> - Toàn bộ hệ thống chạy trên nền tảng Serverless Edge (Cloudflare Pages, D1 SQLite, KV Cache) trên gói miễn phí đủ cho quy mô thử nghiệm; chi phí tăng chủ yếu ở lượt gọi AI, đã có hạn mức. Mỗi lần push `main`, CI tự kiểm tra và deploy."*

---

### 🎙️ [06:15 - 06:45] SLIDE 9: QUẢN TRỊ RỦI RO & ĐẠO ĐỨC AI
> *"Để bảo vệ tối đa lợi ích của học sinh, chúng em áp dụng 4 nguyên tắc đạo đức AI:  
> 1. **Nói không với ảo tưởng xác suất**: Mọi màn hình đều dán nhãn 'Không phải xác suất đỗ, chỉ là điểm đối chiếu tham khảo'.  
> 2. **Minh bạch nguồn gốc**: Mỗi con số đều đi kèm tài liệu kiểm chứng.  
> 3. **Quyền riêng tư (Local-first)**: Dữ liệu điểm thi và thời khóa biểu lưu ngay trên điện thoại của học sinh, không cần tài khoản; có sao lưu, khôi phục và xóa ở Cài đặt.  
> 4. **Cấu hình độc lập (Decoupled Engine)**: Quy chế Bộ thay đổi năm nào, chỉ cần cập nhật Rule Engine năm đó mà không phải viết lại ứng dụng."*

---

### 🎙️ [06:45 - 07:00] SLIDE 10: TỔNG KẾT & MỜI TRẢI NGHIỆM DEMO
> *"Tóm lại, Nguyện Vọng AI không phải là một mô hình thử nghiệm lý thuyết, mà là một **sản phẩm chạy được từ đầu đến cuối với 3.648 chương trình của 118 trường, 16 phân hệ tính năng và hơn 80 bộ kiểm thử tự động**.  
> Chúng em tin rằng đây chính là giải pháp Decision Intelligence thiết thực nhất, giải tỏa áp lực cho hàng triệu gia đình Việt Nam.  
> Kính mời Ban Giám Khảo cùng quét mã QR hoặc truy cập `nguyenvongai.pages.dev` để trực tiếp trải nghiệm bản demo.  
> Nhóm chúng em xin trân trọng cảm ơn và sẵn sàng nhận câu hỏi phản biện từ Ban Giám Khảo!"*

# 10 — PRESENTATION SCRIPT (10-MINUTE MASTER PITCH)

**Dự án:** Nguyện Vọng AI (`https://nguyenvongai.pages.dev/`)  
**Thời lượng chuẩn:** 10 phút 00 giây (kèm bản rút gọn 7 phút nếu BGK giới hạn giờ)  
**Slide Deck:** `slides/thuyet-trinh.html` (14 slides, bản PDF offline: `evidence/presentation/NguyenvongAI-Slides-Offline.pdf`)  
**Video dự phòng:** `evidence/presentation/nguyenvongai-demo-offline.mp4` (`115s`, `1280×720` H.264, `0.70 MB`)

---

## Tổng quan phân bổ thời gian (7 Khối)

| Khối thời gian | Nội dung chính | Slide tương ứng |
|---|---|---|
| **0:00 – 1:00** | Vấn đề thực tế của học sinh THPT Việt Nam | Slide 1 – 2 |
| **1:00 – 2:30** | Nguyện Vọng AI giải quyết gì khác biệt (Decision Intelligence) | Slide 3 – 4 |
| **2:30 – 5:30** | Demo thực tế theo một học sinh cụ thể (Live hoặc Video `115s`) | Slide 5 – 6 |
| **5:30 – 7:00** | Cách hệ thống tính toán và giữ dữ liệu trung thực | Slide 7 – 9 |
| **7:00 – 8:30** | Kiến trúc, bảo mật, chi phí AI và tích hợp MCP / OAuth 2.1 | Slide 10 – 12 |
| **8:30 – 9:30** | Kết quả kiểm thử thực tế và giới hạn trung thực | Slide 13 |
| **9:30 – 10:00** | Tác động tiềm năng và bước tiếp theo sau 17/10/2026 | Slide 14 |

---

## Kịch bản chi tiết từng phân đoạn

### 1. [0:00 – 1:00] Vấn đề thực tế của học sinh THPT Việt Nam (Slide 1 & Slide 2)

- **Thao tác trình chiếu:** Mở **Slide 1 (Bìa)** trong 15 giây đầu, sau đó chuyển sang **Slide 2 (Nỗi đau thực tế)**.
- **Lời nói gợi ý:**
  > "Chào Hội đồng Giám khảo. Mỗi mùa tuyển sinh có hơn **1 triệu học sinh THPT** bước vào quyết định lớn đầu tiên của cuộc đời giữa một 'rừng' thông tin phân mảnh: hàng trăm đề án tuyển sinh PDF dài hàng chục trang, 5 phương thức xét tuyển khác nhau, học phí thay đổi theo từng chương trình, và đặc biệt là quy chế mới từ năm 2026 giới hạn tối đa **15 nguyện vọng**.
  > 
  > Hiện nay, học sinh đang phải đánh cược tương lai bằng hai cách đều rủi ro: hoặc tự ghép thông tin từ các trang tin thứ cấp và nhóm mạng xã hội, hoặc hỏi các chatbot AI thông thường vốn rất dễ bịa điểm chuẩn và cộng nhầm điểm ưu tiên. Hậu quả là nhiều em đủ điểm nhưng trượt oan vì xếp sai thứ tự nguyện vọng, hoặc đậu vào chương trình vượt quá khả năng chi trả của gia đình."

---

### 2. [1:00 – 2:30] Nguyện Vọng AI giải quyết gì khác biệt (Slide 3 & Slide 4)

- **Thao tác trình chiếu:** Chuyển sang **Slide 3 (Giải pháp — 4 câu hỏi cốt lõi)** rồi **Slide 4 (Kiến trúc 4 tầng & 5 phương thức)**.
- **Lời nói gợi ý:**
  > "Nguyện Vọng AI không phải là một trang tra cứu điểm chuẩn thụ động, cũng không phải một vỏ bọc ChatGPT để trò chuyện xã giao. Chúng em xây dựng một **Hệ thống Hỗ trợ Ra quyết định Tuyển sinh và Lộ trình Học tập (Admissions Decision Intelligence)** chạy mượt ngay trên điện thoại tầm trung của học sinh phổ thông.
  > 
  > Sản phẩm dẫn dắt học sinh trả lời trọn vẹn **4 câu hỏi cốt lõi**:
  > 1. *Mình đang ở đâu?* — Tự động tính điểm theo 5 phương thức và công thức điểm ưu tiên giảm dần đúng Quy chế Bộ GD&ĐT.
  > 2. *Muốn đi tới đâu?* — Khám phá và lọc **3.648 chương trình của 118 trường** theo điểm, khu vực và trần học phí gia đình.
  > 3. *Còn cách bao xa?* — Phân tích danh mục nguyện vọng theo 4 nhãn cố định (*Thử sức · Vừa sức · An toàn · Dự phòng*), chỉ ra đúng môn đang kéo lùi cơ hội và cho phép thử tình huống nếu một môn tụt điểm.
  > 4. *Hôm nay làm gì?* — Tự động sinh lịch ôn tập tuần gắn trực tiếp với khoảng cách điểm còn thiếu.
  > 
  > Điểm khác biệt cốt lõi là kiến trúc **Không ảo giác (Zero-Hallucination)**: toàn bộ phép cộng điểm, kiểm tra điều kiện tiên quyết, kiểm tra ngân sách và xếp nguyện vọng đều do **Deterministic Engine thuần TypeScript** xử lý. AI ngôn ngữ chỉ được dùng để giải thích kết quả đã tính toán."

---

### 3. [2:30 – 5:30] Demo thực tế theo một học sinh cụ thể (Slide 5 & Slide 6 + Video / Live Demo)

- **Thao tác trình chiếu:**
  - Chuyển nhanh qua **Slide 5** và **Slide 6** (15 giây) để giới thiệu chân dung học sinh demo, sau đó bật **Video Demo Offline `115s`** (`evidence/presentation/nguyenvongai-demo-offline.mp4`) hoặc thao tác trực tiếp theo đúng 7 phân đoạn của video.
- **Kịch bản thuyết minh khớp từng giây với Video `115s`:**
  - **`0:00 – 0:10` (Khởi đầu):** "Hãy theo dõi hành trình của em Minh, học sinh lớp 12 tại TP.HCM, tổ hợp A01, ngân sách gia đình dưới 35 triệu/năm."
  - **`0:10 – 0:25` (Nhập hồ sơ — `/bat-dau/1..3`):** "Ở bước khởi đầu, học sinh lớp 11 chưa có điểm thi vẫn có thể dùng học bạ hoặc trắc nghiệm RIASEC. Với Minh (lớp 12), em nhập Toán 8.5, Lý 8.25, Anh 8.5 và chọn khu vực KV2-NT. Hệ thống tự động áp dụng công thức giảm dần khi tổng điểm vượt 22.5 — cộng đúng **+0.16 điểm ưu tiên** thành **25.41 điểm**, không cộng lố."
  - **`0:25 – 0:45` (Khám phá & Lọc học phí — `/kham-pha`):** "Minh lọc các ngành Công nghệ thông tin tại miền Nam có học phí phù hợp ngân sách. Mỗi thẻ ngành đều hiển thị rõ chênh lệch điểm so với năm 2025 và ghi chú rõ học phí là *Chính thức* hay *Ước tính*."
  - **`0:45 – 1:05` (Xếp nguyện vọng & Cảnh báo rủi ro — `/nguyen-vong` & `/nguyen-vong/an-toan`):** "Minh đưa 5 ngành vào danh mục. Hệ thống lập tức cảnh báo nếu thứ tự nguyện vọng bị ngược (đặt ngành An toàn lên trên ngành Vừa sức làm mất cơ hội ở các nguyện vọng sau), đồng thời kiểm tra cấu trúc danh mục có phương án Dự phòng hay chưa."
  - **`1:05 – 1:25` (Thử tình huống & Kế hoạch học — `/thu-tinh-huong` & `/ke-hoach/tuan`):** "Tại màn hình Thử tình huống, Minh kéo thanh trượt: *Nếu ngày thi thật môn Lý giảm 1.0 điểm thì sao?* Hệ thống tính lại ngay lập tức những nguyện vọng nào chuyển sang trạng thái rủi ro, chỉ ra môn Lý là điểm nghẽn và tạo lịch ôn tập tuần ưu tiên môn Lý."
  - **`1:25 – 1:40` (Hỏi Trợ lý AI — `/tu-van`):** "Khi Minh hỏi trợ lý AI bằng tiếng Việt không dấu hoặc tên viết tắt như *'25 diem A01 hoc CNTT truong cong lap nao hoc phi duoi 30 trieu?'*, tầng định tuyến giải quyết ngay trong vài mili-giây từ dữ liệu đã kiểm chứng, không tốn chi phí LLM."
  - **`1:40 – 1:55` (Xuất lộ trình & Sao lưu — `/ho-so/chia-se` & `/ho-so/cai-dat`):** "Cuối cùng, Minh tạo liên kết chia sẻ chế độ chỉ-đọc cho bố mẹ hoặc giáo viên chủ nhiệm xem cùng, và tải file sao lưu JSON về máy."

---

### 4. [5:30 – 7:00] Cách hệ thống tính toán và giữ dữ liệu trung thực (Slide 7, Slide 8 & Slide 9)

- **Thao tác trình chiếu:** Đi qua **Slide 7 (Kho dữ liệu & Minh bạch)** → **Slide 8 (Quy trình kiểm chứng cộng đồng)** → **Slide 9 (AI Chatbot & Chống ảo giác)**.
- **Lời nói gợi ý:**
  > "Trong tư vấn tuyển sinh, **sai một con số là hại một thí sinh**. Vì vậy, chúng em đặt tính trung thực dữ liệu lên hàng đầu:
  > - Toàn bộ **3.648 chương trình của 118 trường** đều có cấu trúc dữ liệu rõ nguồn gốc (`du-lieu-tuyen-sinh.json`).
  > - Hệ thống phân tách minh bạch trên giao diện: **3.271 chương trình (89,7%)** có URL nguồn để đối chiếu trực tiếp, và **377 chương trình (10,3%)** đang chờ bổ sung liên kết được gắn nhãn cảnh báo rõ ràng để học sinh không nhầm lẫn.
  > - Về học phí: **602 chương trình** đã có học phí chính thức từ đề án, các chương trình còn lại được ghi rõ là *Học phí ước tính theo nhóm trường* hoặc *Chưa công bố*, kèm cảnh báo màu cam ngay khi vượt ngân sách gia đình.
  > - Về thuật toán xác suất: Chúng em sử dụng phân phối chuẩn tích lũy với độ lệch chuẩn lịch sử $\sigma = 0.85$ và hệ số tương quan điểm thi $\rho = 0.65$ để mô phỏng rủi ro danh mục, nhưng **luôn hiển thị rõ đây là ước tính tham khảo dựa trên điểm chuẩn 2025**, tuyệt đối không cam kết phần trăm trúng tuyển như một con số chắc chắn."

---

### 5. [7:00 – 8:30] Kiến trúc, bảo mật, chi phí AI và tích hợp MCP / OAuth 2.1 (Slide 10, Slide 11 & Slide 12)

- **Thao tác trình chiếu:** Đi qua **Slide 10 (Chuẩn mở MCP & OAuth 2.1)** → **Slide 11 (Hạ tầng Edge & Kiểm soát chi phí)** → **Slide 12 (Ma trận kiểm thử)**.
- **Lời nói gợi ý:**
  > "Về kỹ thuật, Nguyện Vọng AI được thiết kế theo triết lý **Local-First & Zero-Cost Edge**:
  > - Hồ sơ học sinh lưu mặc định trên thiết bị (`localStorage`), không bắt đăng ký tài khoản mới được dùng, đảm bảo quyền riêng tư cho học sinh dưới 18 tuổi.
  > - Trên Cloudflare Pages Functions + D1 + KV, chúng em kiểm soát chi phí AI bằng phễu 4 tầng: **85–90% câu hỏi tuyển sinh phổ biến được giải quyết trực tiếp bởi Deterministic Intent Router (`traLoiTuDong`) với chi phí $0 và độ trễ dưới 5ms**. Với 10–15% câu hỏi phức tạp cần suy luận, hệ thống áp dụng hạn mức cứng **50 lượt/người/ngày** và **500 lượt toàn hệ thống/ngày** trên KV, kèm bộ lọc hậu kiểm (`kiemChungSoLieu`) tự động chặn mọi con số điểm chuẩn hoặc học phí mà LLM tự bịa ra ngoài dữ liệu gốc.
  > - Đặc biệt, sản phẩm đã triển khai đầy đủ máy chủ **Model Context Protocol (MCP chuẩn 2025-03-26)** và **OAuth 2.1 PKCE (S256)** với 9 công cụ chuyên biệt, phát hiện tái sử dụng refresh token (token reuse detection) và cô lập dữ liệu theo đúng phạm vi quyền (`scope`)."

---

### 6. [8:30 – 9:30] Kết quả kiểm thử thực tế và giới hạn trung thực (Slide 13)

- **Thao tác trình chiếu:** Mở **Slide 13 (Đối chiếu tiêu chí & Kết quả nghiệm thu)**.
- **Lời nói gợi ý:**
  > "Trước buổi bảo vệ hôm nay, chúng em đã thực hiện đợt nghiệm thu toàn diện (Final Product Acceptance) với bằng chứng thực tế lưu trong thư mục `evidence/`:
  > - **64/64 bộ kiểm thử tự động (267 test cases)** chạy xanh 100%, bao gồm bộ Golden Tests kiểm toán công thức điểm ưu tiên và chẩn đoán danh mục nguyện vọng.
  > - **5/5 hành trình người dùng E2E** (từ học sinh lớp 11, lớp 12 chưa thi, đã có điểm thi, ngân sách dưới 15 triệu đến người dùng khôi phục sao lưu) đều vượt qua kiểm thử trình duyệt thật với **0 lỗi console/network**.
  > - **155/155 lượt kiểm tra giao diện** trên 6 kích thước màn hình (từ iPhone SE `320px` đến Laptop `1366px`) đạt **0 lỗi tràn ngang**.
  > - **42/42 câu hỏi kiểm thử AI Chatbot** qua 11 nhóm (kể cả tiếng Việt không dấu, viết tắt và chống prompt injection) đạt **100% PASS, 0 ảo giác số liệu**.
  > 
  > Chúng em cũng xin báo cáo trung thực **3 giới hạn hiện tại**:
  > 1. Điểm chuẩn trong hệ thống là dữ liệu chính thức năm **2025** dùng làm mốc tham khảo; đề án 2026 sẽ được cập nhật cuốn chiếu khi các trường công bố.
  > 2. Dữ liệu hồ sơ mặc định là **Local-first** trên trình duyệt; khi đổi thiết bị, học sinh dùng tệp sao lưu JSON hoặc mã kết nối.
  > 3. Máy chủ MCP và OAuth 2.1 đã đạt **17/17 bài kiểm thử giao thức E2E trên production**, sẵn sàng để kết nối vào giao diện Claude/ChatGPT custom connectors."

---

### 7. [9:30 – 10:00] Tác động tiềm năng và bước tiếp theo (Slide 14)

- **Thao tác trình chiếu:** Mở **Slide 14 (Tầm nhìn & Kết thúc)**.
- **Lời nói gợi ý:**
  > "Mục tiêu lớn nhất của Nguyện Vọng AI là **dân chủ hóa cơ hội tiếp cận tư vấn tuyển sinh chất lượng cao**: giúp một học sinh ở vùng sâu vùng xa với chiếc điện thoại 360px và ngân sách dưới 15 triệu/năm cũng có được chiến lược xếp nguyện vọng an toàn và lịch học rõ ràng như học sinh ở các thành phố lớn.
  > 
  > Ngay sau cột mốc 17/10/2026, lộ trình của chúng em tập trung vào 3 việc cụ thể: hoàn tất xác minh PDF đề án 2026 cho 377 chương trình còn thiếu link, mở tính năng đồng bộ đám mây tùy chọn trên nền OAuth 2.1 sẵn có, và phối hợp với các đội tình nguyện viên sinh viên tại các trường đại học để kiểm chứng học phí thực tế.
  > 
  > Xin cảm ơn Hội đồng Giám khảo. Chúng em sẵn sàng trả lời mọi câu hỏi phản biện và mở bất kỳ màn hình hoặc tệp bằng chứng nào theo yêu cầu của Hội đồng."

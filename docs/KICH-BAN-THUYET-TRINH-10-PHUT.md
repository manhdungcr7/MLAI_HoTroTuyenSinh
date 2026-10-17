# KỊCH BẢN LỜI THOẠI THUYẾT TRÌNH 10 PHÚT (SPEAKER SCRIPT)
## DỰ ÁN: NGUYỆN VỌNG AI — HỆ THỐNG TRÍ TUỆ HỖ TRỢ RA QUYẾT ĐỊNH TUYỂN SINH
**Cuộc thi**: Decision Intelligence Challenge 2026 (Bài toán số 6: Chọn trường hoặc chương trình học)  
**Tệp slide trình chiếu gốc**: [`slides/thuyet-trinh.html`](file:///d:/07-Competitions-Hackathons/mlai/nguyenvongai/slides/thuyet-trinh.html)  
**File PDF trình chiếu**: [`slides/thuyet-trinh.pdf`](file:///d:/07-Competitions-Hackathons/mlai/nguyenvongai/slides/thuyet-trinh.pdf)  
**Tổng thời lượng**: 10 phút (600 giây) | **Số lượng slide**: 14 slide  
**Người trình bày**: Đại diện RTC Team (Đội thi Nguyện Vọng AI)  
**Số liệu được phép nói**: chỉ dùng `docs/SO-LIEU-CHOT-NOP-BAI.md` (đo 17/10/2026), kể cả mục "Những điều KHÔNG được nói". Chạy lại `npx tsx scripts/so-lieu-nop-bai.mts` trước buổi thuyết trình; số đổi thì sửa theo.  
**Lưu ý**: bản `.docx` cùng tên chưa được xuất lại từ bản `.md` này.  

---

### BẢNG ĐIỀU PHỐI THỜI GIAN THEO TỪNG SLIDE (PACING GUIDE)

| Slide | Chủ đề Slide | Thời gian | Tích lũy | Trọng tâm ghi điểm BTC |
|:---:|---|:---:|:---:|---|
| **01** | **Bìa**: Từ dữ liệu tuyển sinh đến quyết định | 30s | 0:30 | Định vị thương hiệu & Tuyên ngôn Decision Intelligence |
| **02** | **Vấn đề**: Một quyết định cả đời, trên dữ liệu rời rạc | 40s | 1:10 | Tiêu chí 1: Nỗi đau thực tế của 1,1 triệu thí sinh |
| **03** | **Khoảng trống**: Cổng tra cứu vs. Chatbot vs. Nguyện Vọng AI | 35s | 1:45 | Tiêu chí 3: Sự khác biệt so với thị trường |
| **04** | **Giải pháp**: 4 câu hỏi, một hành trình khép kín | 40s | 2:25 | Tiêu chí 1: Hành trình người học từ điểm số đến hành động |
| **05** | **Demo thật**: Từ hồ sơ đến kế hoạch tuần cụ thể | 40s | 3:05 | Tiêu chí 5: Sản phẩm chạy thật, UX Mobile 390px mượt mà |
| **06** | **Lớp dữ liệu**: Nguồn gốc 3 tầng, phiên bản, nhãn tin cậy | 55s | 4:00 | Tiêu chí 4: Chiến lược dữ liệu có kiểm chứng, trích PDF |
| **07** | **Động cơ quyết định**: Thuật toán tất định & Backtesting | 55s | 4:55 | Tiêu chí 4: Không phải hộp đen; kiểm định phủ 77%–93% |
| **08** | **AI ở đâu**: Quy tắc trước, dữ liệu sau, AI diễn giải | 45s | 5:40 | Tiêu chí 4: Rào chắn AI, lọc số bịa, hạn mức an toàn |
| **09** | **ChatGPT & Claude**: Họ là kênh tiếp cận, ta là sự thật | 55s | 6:35 | Tiêu chí 3 & 5: Giao thức Agent-Native MCP, xuất Google Cal |
| **10** | **Tự cải tiến**: Vòng lặp đóng góp từ người trong trường | 45s | 7:20 | Tiêu chí 5: Khả năng vận hành và tự hoàn thiện dữ liệu |
| **11** | **Lợi thế bền vững**: Khó sao chép ở dữ liệu & bản địa hóa | 40s | 8:00 | Tiêu chí 3: Moat thực sự (quy chế Việt Nam, kiểm chứng CI) |
| **12** | **Trạng thái thật**: Cái gì xong, cái gì đang thử, cái gì chưa | 50s | 8:50 | Tiêu chí 6: Minh bạch tuyệt đối, tôn trọng sự thật kỹ thuật |
| **13** | **Phương hướng**: Lộ trình 4 giai đoạn thực tế | 40s | 9:30 | Tiêu chí 5: Tầm nhìn khả thi, không hứa viển vông |
| **14** | **Kết luận**: Giúp em quyết định có căn cứ | 30s | 10:00 | Chốt hạ thông điệp, sẵn sàng phản biện Q&A |

---

## LỜI THOẠI CHI TIẾT TỪNG SLIDE (KÈM CHỈ DẪN SÂN KHẤU)

---

### 🎬 SLIDE 01: BÌA (00:00 - 00:30)
**Tiêu đề**: *Từ dữ liệu tuyển sinh đến quyết định*  
**Thời lượng**: 30 giây | **Thời gian tích lũy**: 0:30  

**Lời thoại người thuyết trình**:
> *"Kính thưa Ban giám khảo và toàn thể hội đồng chuyên môn,*  
> 
> *Mỗi mùa thi, có hơn một triệu học sinh lớp 12 tại Việt Nam phải đưa ra một quyết định mang tính bước ngoặt cho cả cuộc đời: **Đặt danh sách nguyện vọng đại học**.  
> 
> Nhóm chúng em là **RTC Team**, và hôm nay chúng em mang đến **Nguyện Vọng AI** — một lớp dữ liệu và hỗ trợ ra quyết định chuyên biệt cho kỳ tuyển sinh Việt Nam, giải quyết trực diện Bài toán số 6 của cuộc thi: **Chọn trường và chương trình học**.  
> 
> Sản phẩm của chúng em không sinh ra để trả lời câu hỏi mơ hồ 'Em có thể đậu trường nào?', mà giải quyết bài toán lớn hơn: **'Với năng lực và điều kiện hiện tại, em nên chọn ngành nào, và từ hôm nay cần làm gì để đạt được mục tiêu đó?'**"*

📌 **Chỉ dẫn sân khấu**: Đứng thẳng, mắt quét toàn bộ hội đồng, giọng tự tin, đĩnh đạc. Nhấn mạnh vào cụm từ *"từ hôm nay cần làm gì"*.

---

### 🎬 SLIDE 02: VẤN ĐỀ (00:30 - 01:10)
**Tiêu đề**: *Một quyết định cả đời, trên dữ liệu rời rạc*  
**Thời lượng**: 40 giây | **Thời gian tích lũy**: 1:10  

**Lời thoại người thuyết trình**:
> *"Thưa Ban giám khảo, tại sao học sinh lại liên tục đưa ra quyết định sai lầm trong kỳ xét tuyển? Vấn đề nằm ở 3 điểm nghẽn lớn:  
> 
> **Thứ nhất, dữ liệu phân mảnh cực độ**: Hơn 200 trường đại học công bố đề án tuyển sinh bằng các file PDF dài hàng trăm trang, mỗi trường một cấu trúc, với ma trận 73 tổ hợp môn khác nhau.  
> **Thứ hai, quy chế tuyển sinh Việt Nam rất đặc thù**: Quy chế Bộ GD&ĐT quy định điểm ưu tiên khu vực và đối tượng bắt đầu giảm dần tuyến tính từ mốc 22,5 điểm trở lên. Đây là công thức toán học mà hầu hết các trang tra cứu trên mạng hiện nay đều tính sai hoặc bỏ qua.  
> **Thứ ba, và nguy hiểm nhất là cơ chế lọc ảo của Bộ**: Thí sinh chỉ trúng tuyển duy nhất một nguyện vọng cao nhất đủ điểm. Nếu đặt một ngành an toàn lên đầu, toàn bộ ngành mơ ước phía sau sẽ bị hủy bỏ ngay lập tức.  
> 
> Dữ liệu thì khổng lồ — **3.648 chương trình, 118 trường** — nhưng học sinh đang thiếu một công cụ biến dữ liệu thành quyết định đúng đắn."*

📌 **Chỉ dẫn sân khấu**: Chỉ tay vào 3 con số lớn ở cuối slide (3.648 — 118 — 73) để nhấn mạnh quy mô dữ liệu thực tế mà nhóm đã chuẩn hóa.

---

### 🎬 SLIDE 03: KHOẢNG TRỐNG (01:10 - 01:45)
**Tiêu đề**: *Không thiếu thông tin. Thiếu người biến nó thành quyết định*  
**Thời lượng**: 35 giây | **Thời gian tích lũy**: 1:45  

**Lời thoại người thuyết trình**:
> *"Vậy trên thị trường hiện nay, học sinh đang tìm kiếm sự trợ giúp từ đâu?  
> 
> Các **Cổng tra cứu điểm truyền thống** chỉ đưa ra những con số tĩnh của các năm trước rồi dừng lại.  
> Các **Chatbot AI phổ thông** như ChatGPT hay Gemini thì nói năng trôi chảy, nhưng không nắm được hồ sơ riêng của học sinh, không hiểu quy chế điểm ưu tiên và thường xuyên tự 'bịa đặt' điểm chuẩn năm ngoái.  
> 
> **Nguyện Vọng AI chính là chiếc cầu nối ở giữa**: Chúng em nhận đầu vào là điểm số và điều kiện của chính em, đối chiếu với nguồn dữ liệu tuyển sinh đã kiểm chứng, phân tầng danh sách nguyện vọng kèm giải thích đánh đổi, và chuyển hóa thành kế hoạch học tập từng tuần."*

📌 **Chỉ dẫn sân khấu**: Nhìn vào sơ đồ so sánh 3 cột ở dưới slide, nhấn giọng ở phần Nguyện Vọng AI: *"Hồ sơ riêng → Nhãn có nguồn → Việc cần làm mỗi tuần"*.

---

### 🎬 SLIDE 04: GIẢI PHÁP (01:45 - 02:25)
**Tiêu đề**: *Bốn câu hỏi, một hành trình*  
**Thời lượng**: 40 giây | **Thời gian tích lũy**: 2:25  

**Lời thoại người thuyết trình**:
> *"Toàn bộ sản phẩm được kiến trúc để đồng hành trả lời **bốn câu hỏi cốt lõi** của học sinh:  
> 
> 1. **Mình đang ở đâu?** — Hồ sơ thông minh tính điểm từng môn, tổ hợp xét tuyển tối ưu và điểm ưu tiên giảm dần theo quy chế.  
> 2. **Muốn đi tới đâu?** — Khám phá 3.648 chương trình, lọc theo ngành, học phí và khoảng cách địa lý.  
> 3. **Còn cách bao xa?** — Phân tầng 4 nhóm nguyện vọng: Thử sức, Vừa sức, An toàn, Dự phòng để danh mục không bao giờ bị trượt trắng.  
> 4. **Hôm nay làm gì?** — Phân tích môn nghẽn điểm và tự động lập thời khóa biểu tự học tuần, xuất trực tiếp sang Google Calendar.  
> 
> Đặc biệt, toàn bộ dữ liệu này được lưu trữ **Local-First ngay trên thiết bị của học sinh**, không cần tạo tài khoản, bảo vệ quyền riêng tư tuyệt đối."*

📌 **Chỉ dẫn sân khấu**: Điểm qua 4 thẻ tương ứng với 4 câu hỏi. Dừng lại 1 giây ở câu hỏi 4 để tạo điểm tò mò trước khi bước sang màn demo.

---

### 🎬 SLIDE 05: DEMO THẬT (02:25 - 03:05)
**Tiêu đề**: *Từ một hồ sơ đến một kế hoạch cụ thể*  
**Thời lượng**: 40 giây | **Thời gian tích lũy**: 3:05  

**Lời thoại người thuyết trình**:
> *"Kính mời Ban giám khảo nhìn vào luồng trải nghiệm thực tế trên bản Web đang chạy trực tiếp tại `nguyenvongai.pages.dev`:  
> 
> Bắt đầu từ **Hồ sơ mẫu Minh Anh** (tổ hợp A01, điểm thi thử gần nhất từng môn): hệ thống tính điểm theo tổ hợp, cộng điểm ưu tiên nếu em khai khu vực.  
> Chuyển sang **Khám phá**: **Bản đồ cơ hội** cho biết có bao nhiêu ngành ở từng nhãn; **Phòng thử điểm** cho kéo điểm một môn xem ngành nào đổi nhãn; mở một ngành thấy điểm từng năm kèm nguồn, chỉ tiêu và điểm dự đoán 2027.  
> Sang **Nguyện vọng**: Danh mục tự động gắn nhãn 4 tầng rủi ro, cảnh báo nếu danh mục bị lệch cấu trúc.  
> Và cuối cùng là **Kế hoạch tuần**: Hệ thống nhận ra môn còn thiếu điểm nhiều nhất, xếp các buổi tự học vào khung giờ trống trong thời khóa biểu của em, và có thể đưa vào Google Calendar. Số buổi và môn cụ thể do hồ sơ quyết định; đọc đúng thứ đang hiện trên màn hình."*

📌 **Chỉ dẫn sân khấu**: Chỉ vào 4 khung mockup điện thoại nối tiếp nhau trên slide để chứng minh tính mượt mà của hành trình ra quyết định.

---

### 🎬 SLIDE 06: LỚP DỮ LIỆU RA QUYẾT ĐỊNH (03:05 - 04:00)
**Tiêu đề**: *Mỗi con số có nguồn, có phiên bản, có nhãn tin cậy*  
**Thời lượng**: 55 giây | **Thời gian tích lũy**: 4:00  

**Lời thoại người thuyết trình**:
> *"Thưa Ban giám khảo, đây là phần cốt lõi tạo nên tính tin cậy của Nguyện Vọng AI: **Lớp dữ liệu ra quyết định**.  
> 
> Dữ liệu của chúng em được phân thành **ba tầng nguồn minh bạch**:  
> - **Tầng 1**: Đề án tuyển sinh chính thức của trường — kiểm chứng được tới từng số trang PDF.  
> - **Tầng 2**: Trang tổng hợp và VnExpress, nguồn thứ cấp, đối chiếu chéo (khớp 92,9% ở các cặp năm 2026), luôn gắn nhãn "chưa đối chiếu đề án". 1.492 trong 3.648 chương trình gắn đề án PDF, 2.156 gắn nguồn trang tổng hợp.  
> - **Tầng 3**: Ghi chú cộng đồng về ký túc xá, chi phí sinh hoạt — luôn bắt buộc gắn nhãn 'chưa chính thức'.  
> 
> Toàn bộ dữ liệu được chuẩn hóa, duyệt qua hệ thống CMS nội bộ, rồi đóng gói thành các **Snapshot có mã băm SHA-256** bất biến. Mọi kênh từ Web app, API cho đến trợ lý ngoài đều dùng chung một nguồn sự thật duy nhất.  
> 
> Quan trọng nhất: mỗi con số mang nhãn nguồn và trạng thái (đề án, nguồn thứ cấp, dự báo tham khảo, hoặc chưa có), và khối **Độ tin cậy dữ liệu** ở trang Về dữ liệu đếm thật từ danh mục. Chúng em đã kiểm mẫu: điểm có phần lẻ khớp PDF ở 201/201 dòng đã kiểm; điểm số nguyên chưa kiểm hết và đã sửa 146 mục có bằng chứng. Nếu thiếu dữ liệu, hệ thống nói thẳng là thiếu, không tự điền số."*

📌 **Chỉ dẫn sân khấu**: Nhấn giọng mạnh mẽ ở đoạn *"thiếu thì nói thiếu, tuyệt đối không tự bịa đặt"* — đây là tiêu chí đạo đức AI mà giám khảo kỹ thuật đánh giá rất cao.

---

### 🎬 SLIDE 07: ĐỘNG CƠ RA QUYẾT ĐỊNH (04:00 - 04:55)
**Tiêu đề**: *Thuật toán giải thích được, không phải hộp đen*  
**Thời lượng**: 55 giây | **Thời gian tích lũy**: 4:55  

**Lời thoại người thuyết trình**:
> *"Động cơ tính toán của Nguyện Vọng AI bao gồm 4 thuật toán tất định, hoàn toàn minh bạch và có thể giải thích được:  
> 
> 1. **Thuật toán tính điểm xét tuyển**: Áp dụng đúng công thức tổ hợp của từng ngành và cơ chế giảm điểm ưu tiên trên 22,5 điểm.  
> 2. **Dự báo khoảng điểm chuẩn 2027 (thống kê)**: điểm năm gần nhất kèm khoảng từ phân bố biến động giữa hai năm liền kề của 2.526 cặp thực tế, không bao giờ cam kết 'chắc chắn đậu'. Mọi dự báo hiện ở mức tin cậy thấp vì điểm mới nhất là 2026 từ trang tổng hợp. Mô hình học máy LightGBM bổ sung cho 2.580 chương trình, nhưng chỉ cải thiện nhẹ (thử ngoài mẫu phủ 63,8%, Winkler 8,21 so với 8,19), nên chúng em không nói nó vượt trội.  
> 3. **Tối ưu danh mục nguyện vọng**: Tự động phát hiện và chặn lỗi 'nghịch đảo thứ tự' — ngăn học sinh đặt ngành dễ trúng tuyển lên trước ngành mơ ước.  
> 4. **Chia giờ tự học theo hiệu quả biên**: mỗi giờ đi vào môn mà em này tăng được nhiều điểm nhất, mỗi môn một cách ôn riêng, và nói thật khi mục tiêu khó đạt với quỹ giờ này.  
> 
> Đặc biệt, chúng em đã thực hiện **Kiểm định ngược (Leave-one-year-out backtesting)** trên dữ liệu thật: Khoảng danh nghĩa 80% phủ **91,1%** điểm chuẩn năm 2023, **93,2%** năm 2024, và **76,6%** năm 2025 khi đề thi biến động bất thường (đo 17/10, kiểm định trong mẫu, chưa phải ngoài mẫu). Chúng em công khai các con số này trong `tests/du-bao-diem-chuan.test.ts`."*

📌 **Chỉ dẫn sân khấu**: Chỉ vào dòng thông báo màu xanh ở đáy slide về kết quả kiểm định bỏ-một-năm để chứng minh chiều sâu nghiên cứu thuật toán.

---

### 🎬 SLIDE 08: AI ĐƯỢC DÙNG Ở ĐÂU (04:55 - 05:40)
**Tiêu đề**: *Quy tắc trước, dữ liệu sau, AI để diễn giải*  
**Thời lượng**: 45 giây | **Thời gian tích lũy**: 5:40  

**Lời thoại người thuyết trình**:
> *"Nguyên tắc thiết kế bất khả xâm phạm của chúng em: **AI không quyết định sự thật**.  
> 
> - **Phần cần chính xác tuyệt đối — Không dùng AI**: Tính điểm, cộng ưu tiên, xếp lịch và chẩn đoán danh mục đều do engine TypeScript thuần xử lý.  
> - **Phần ước lượng — Dùng Thống kê**: Dự báo khoảng điểm chuẩn có kiểm định bỏ-một-năm.  
> - **Mô hình ngôn ngữ (LLM) — Chỉ dùng để Diễn giải**: Hỗ trợ trả lời thắc mắc, so sánh học phí và giải thích sự đánh đổi bằng ngôn ngữ thân thiện.  
> 
> Chúng em thiết lập **5 rào chắn bảo vệ**: LLM chỉ nhận đúng số liệu app gửi kèm; câu trả lời chứa số lạ không có trong dữ liệu sẽ bị chặn ngay lập tức; giới hạn 50 lượt/ngày mỗi hồ sơ; và AI tuyệt đối không có quyền tự ý sửa đổi dữ liệu của học sinh."*

📌 **Chỉ dẫn sân khấu**: Nhìn vào 3 cột màu sắc (Xanh - Trời - Đậm), chỉ rõ ranh giới phân định trách nhiệm giữa Code tất định và AI tạo sinh.

---

### 🎬 SLIDE 09: ỨNG DỤNG AI THỰC TẾ (05:40 - 06:35)
**Tiêu đề**: *Từ ngôn ngữ tự nhiên đến hành động an toàn, không ảo giác*  
**Thời lượng**: 55 giây | **Thời gian tích lũy**: 6:35  

**Lời thoại người thuyết trình**:
> *"Thay vì để AI làm một chatbot chung chung dễ bịa đặt hay vẽ viễn cảnh xa xôi, chúng em ứng dụng AI thành **Trợ lý tư vấn có căn cứ** ngay trong ứng dụng, theo quy trình 3 bước khép kín:  
> 
> 1. **Tự động gom ngữ cảnh có kiểm chứng**: Khi học sinh hỏi bằng ngôn ngữ tự nhiên, hệ thống không gửi câu hỏi chay cho LLM chém gió. App tự gom điểm tổ hợp của em (đã ẩn danh hoàn toàn) cùng 4–6 ngành phù hợp từ đề án gốc gửi kèm vào lời nhắc.  
> 2. **LLM diễn giải & Rào chắn hậu kiểm**: Mô hình chỉ đóng vai trò phân tích và giải thích sự đánh đổi trong tối đa 120 từ. Máy chủ kích hoạt thuật toán hậu kiểm tự động: nếu câu trả lời chứa con số điểm chuẩn hay học phí lạ ngoài dữ liệu, lập tức chặn ngay (422) và rơi về thuật toán quy tắc.  
> 3. **Thẻ hành động có xác nhận chủ động**: AI không chỉ trả lời bằng chữ mà sinh ra các Thẻ hành động như [Thêm nguyện vọng], [So sánh ngành]. Nguyên tắc an toàn cốt lõi: AI chỉ đề xuất, học sinh phải tự tay bấm 'Xác nhận' thì danh sách mới cập nhật.  
> 
> Nhờ đó câu trả lời đều kèm nguồn để học sinh mở kiểm tra, rủi ro bịa số được giảm mạnh nhưng không bằng không (vẫn có thể diễn đạt sai), và học sinh có thể bật chế độ Tiết kiệm để tra cứu hoàn toàn bằng thuật toán mà không tốn một lượt gọi AI nào."*

📌 **Chỉ dẫn sân khấu**: Chỉ theo thứ tự 3 bước từ trái sang phải trên slide: Gom ngữ cảnh → LLM & Hậu kiểm → Thẻ hành động xác nhận.

---

### 🎬 SLIDE 10: TỰ CẢI TIẾN & CỘNG ĐỒNG (06:35 - 07:20)
**Tiêu đề**: *Dữ liệu tốt hơn mỗi mùa, nhờ chính người trong trường*  
**Thời lượng**: 45 giây | **Thời gian tích lũy**: 7:20  

**Lời thoại người thuyết trình**:
> *"Dữ liệu tuyển sinh thay đổi hằng năm. Làm sao hệ thống sống sót và lớn lên? Câu trả lời là **Vòng lặp tự cải tiến 4 bước**:  
> 
> 1. Học sinh thấy số liệu chưa khớp có thể bấm nút **Báo sai** ngay trên màn hình.  
> 2. Tình nguyện viên của chính trường đó sử dụng công cụ AI đọc đề án tuyển sinh PDF, gửi điểm chuẩn kèm câu trích dẫn nguyên văn.  
> 3. Dữ liệu vào **Hàng chờ duyệt CMS**, tự động gắn cờ nếu phát hiện chênh lệch bất thường.  
> 4. Quản trị viên phê duyệt thì hệ thống lập tức xuất bản Snapshot mới và tự động chạy lại bài kiểm định.  
> 
> AI chỉ đóng vai trò trợ lý nhập liệu vào hàng chờ; quyền xuất bản dữ liệu luôn thuộc về con người."*

📌 **Chỉ dẫn sân khấu**: Vòng tay mô phỏng vòng tròn khép kín 1 → 2 → 3 → 4 trên slide.

---

### 🎬 SLIDE 11: LỢI THẾ BỀN VỮNG (07:20 - 08:00)
**Tiêu đề**: *Khó sao chép không nằm ở chatbot, mà ở dữ liệu và vòng lặp*  
**Thời lượng**: 40 giây | **Thời gian tích lũy**: 8:00  

**Lời thoại người thuyết trình**:
> *"Thưa Ban giám khảo, tạo ra một chatbot thì ai cũng làm được trong 2 ngày. Lợi thế phòng thủ (Moat) thực sự của Nguyện Vọng AI nằm ở 4 điểm:  
> 
> 1. **Dữ liệu có nguồn kiểm chứng**: Dẫn link tới tận trang PDF của trường, có lịch sử phiên bản và người chịu trách nhiệm duyệt.  
> 2. **Logic bản địa hóa triệt để**: Tính đúng điểm ưu tiên quy chế Việt Nam, hỗ trợ 73 tổ hợp và 34 tỉnh thành sau sắp xếp lại địa giới hành chính.  
> 3. **Bộ kiểm chứng tự động**: hơn 80 bộ kiểm thử, cổng kiểm tra trước commit và push, CI tự kiểm tra rồi deploy khi push `main`; sai sót dữ liệu bị lộ sớm.  
> 4. **Khả năng phân phối Agent-Native**: Dữ liệu nằm an toàn tại máy học sinh, nhưng sẵn sàng cấp quyền cho mọi trợ lý AI giao tiếp chuẩn mực qua MCP."*

📌 **Chỉ dẫn sân khấu**: Từng ngón tay đếm 4 lợi thế để tạo nhịp điệu dứt khoát, thuyết phục.

---

### 🎬 SLIDE 12: TRẠNG THÁI THẬT (08:00 - 08:50)
**Tiêu đề**: *Cái gì xong, cái gì đang thử, cái gì chưa*  
**Thời lượng**: 50 giây | **Thời gian tích lũy**: 8:50  

**Lời thoại người thuyết trình**:
> *"Chúng em xin báo cáo minh bạch 100% hiện trạng sản phẩm với 3 nhóm rõ ràng:  
> 
> - **Đã hoàn thiện & Có test (Xanh)**: 3.648 chương trình, tính điểm ưu tiên quy chế, thuật toán xếp lịch tuần, server MCP 18 công cụ, hỏi đáp AI có hạn mức, và hệ thống CMS (đã chạy thử trọn vòng nhập, duyệt, xuất bản ở máy).  
> - **Đang thử nghiệm (Vàng)**: Cổng đóng góp cộng đồng đã có code nhưng chưa tuyển tình nguyện viên thật; việc tích hợp tài khoản ChatGPT thương mại ngoài production đang trong giai đoạn thử nghiệm; trắc nghiệm hướng nghiệp Holland là công cụ gợi ý chưa kiểm định tâm lý.  
> - **Chưa làm & Đã nhận diện (Cam)**: điểm 2026 (2.082 chương trình) từ trang tổng hợp, chưa đối chiếu đề án; điểm số nguyên chưa kiểm hết, 5 trường nghi sai mã hoặc tên chưa sửa; học phí hiển thị ở 662 chương trình theo VnExpress, chưa có văn bản của trường; dự báo 2027 ở mức tin cậy thấp, học máy chỉ cải thiện nhẹ và phủ ngoài mẫu 63,8%; chưa có đồng bộ đa thiết bị, chưa có tình nguyện viên thật.  
> 
> Chúng em tự kiểm toán dữ liệu và công khai mọi khiếm khuyết. Đây là danh dự kỹ thuật của đội thi."*

📌 **Chỉ dẫn sân khấu**: Nhìn thẳng vào mắt Ban giám khảo, giọng điệu khiêm tốn nhưng đanh thép. Giám khảo luôn đánh giá điểm tối đa cho sự trung thực kỹ thuật.

---

### 🎬 SLIDE 13: PHƯƠNG HƯỚNG (08:50 - 09:30)
**Tiêu đề**: *Từ công cụ chạy được đến hạ tầng quyết định tuyển sinh*  
**Thời lượng**: 40 giây | **Thời gian tích lũy**: 9:30  

**Lời thoại người thuyết trình**:
> *"Phương hướng phát triển của chúng em tuân theo lộ trình 4 bước thực tế:  
> 
> - **Ngay bây giờ**: Chuẩn hóa dữ liệu tuyển sinh 2026 khi các trường công bố đề án chính thức; hoàn thiện kết nối Custom GPT.  
> - **1 đến 3 tháng tới**: Mở rộng cho người dùng thật, bổ sung tính năng đồng bộ đám mây có mã hóa và tuyển tình nguyện viên từ 10 trường đại học đầu tiên.  
> - **Mùa tuyển sinh 2027**: Kích hoạt trọn vẹn vòng lặp đóng góp cộng đồng, tự động chạy lại kiểm định backtest mô hình khi có phổ điểm mới.  
> - **6 đến 12 tháng**: Mở rộng sang hệ thống cao đẳng, đào tạo nghề và du học.  
> 
> Nguyên tắc của nhóm: **Chỉ mở rộng bước tiếp theo khi bước trước đã được kiểm chứng bằng dữ liệu và người dùng thật**."*

📌 **Chỉ dẫn sân khấu**: Chỉ vào 4 mốc thời gian trên timeline slide 13, thể hiện tầm nhìn dài hạn nhưng có kỷ luật triển khai.

---

### 🎬 SLIDE 14: KẾT LUẬN (09:30 - 10:00)
**Tiêu đề**: *Không thay học sinh quyết định. Giúp em quyết định có căn cứ*  
**Thời lượng**: 30 giây | **Thời gian tích lũy**: 10:00  

**Lời thoại người thuyết trình**:
> *"Kính thưa Ban giám khảo,*  
> 
> *Nguyện Vọng AI không sinh ra để thay thế học sinh đưa ra quyết định của cuộc đời mình.  
> Sứ mệnh của chúng em là: **Giúp các em tự đưa ra quyết định có căn cứ vững chắc.**  
> 
> Một quyết định dựa trên **Dữ liệu có nguồn kiểm chứng** — được bảo vệ bởi **Hệ thống AI có rào chắn** — và không ngừng lớn lên nhờ **Sự chung tay của cộng đồng giáo dục**.  
> 
> Chúng em là **RTC Team**. Xin chân thành cảm ơn Ban giám khảo đã lắng nghe. Chúng em sẵn sàng bước vào phần giải trình câu hỏi và trình diễn sản phẩm trực tiếp!"*

📌 **Chỉ dẫn sân khấu**: Cúi đầu chào trang trọng, mỉm cười, sẵn sàng chuyển màn hình sang Web demo hoặc mở danh sách câu hỏi phản biện.

---

## 3. CHECKLIST 5 PHÚT TRƯỚC KHI LÊN SÂN KHẤU

1. **Kiểm tra thiết bị trình chiếu**:
   - Mở sẵn file PDF chuẩn: [`slides/thuyet-trinh.pdf`](file:///d:/07-Competitions-Hackathons/mlai/nguyenvongai/slides/thuyet-trinh.pdf) trên chế độ Toàn màn hình (Full Screen `Ctrl + L`).
   - Mở sẵn 1 tab phụ chạy web demo local: `http://127.0.0.1:8790 (chạy `npm run app:local`)` phòng khi mất mạng Internet.
2. **Phân vai trong đội thi (nếu có 2–3 người)**:
   - *Người nói chính*: Thuyết trình liền mạch theo kịch bản này (giữ đúng nhịp 40–50 giây/slide).
   - *Người điều khiển máy*: Bấm chuyển slide chuẩn nhịp; khi người nói nhắc đến con số nào thì con trỏ chuột hover nhẹ vào con số đó.
   - *Người phụ trách phản biện kỹ thuật*: Mở sẵn tài liệu [`docs/submission/ENGINEERING-EVIDENCE.md`](file:///d:/07-Competitions-Hackathons/mlai/nguyenvongai/docs/submission/ENGINEERING-EVIDENCE.md) để tra cứu ngay file mã nguồn khi giám khảo hỏi sâu.
3. **Chiến thuật kiểm soát thời gian (Pacing Rescue)**:
   - Nếu đến **phút thứ 5** mà mới xong Slide 05 (bị chậm nhịp): Chủ động nói lướt Slide 06 và 07, tập trung vào thông điệp rào chắn AI ở Slide 08 và trạng thái thật ở Slide 12.
   - Nếu còn thừa thời gian ở Slide 14: Mời Ban giám khảo trực tiếp chọn 1 tổ hợp môn bất kỳ để nhóm demo tính điểm ưu tiên và phân tầng nguyện vọng ngay trên sân khấu.

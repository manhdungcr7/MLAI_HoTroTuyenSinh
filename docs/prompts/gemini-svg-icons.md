# Prompt Gemini tạo bộ SVG cho Nguyện Vọng AI

Sao chép toàn bộ nội dung trong khối dưới đây và gửi cho Gemini. Yêu cầu Gemini trả về **một file Python hoàn chỉnh**, không chỉ mô tả thiết kế.

```text
Bạn là senior icon designer và Python engineer. Hãy viết một script Python tự chứa tên `generate_nguyen_vong_icons.py` để sinh một bộ SVG hoàn chỉnh cho sản phẩm “Nguyện Vọng AI”. Tôi cần mã Python có thể chạy trực tiếp, không cần chỉnh tay sau khi nhận.

## 1. Bối cảnh sản phẩm

Nguyện Vọng AI là ứng dụng web/PWA mobile-first dành cho học sinh Việt Nam lớp 11–12. Ứng dụng hỗ trợ:
- khám phá ngành và trường;
- đối chiếu điểm, học phí, khu vực và phương thức xét tuyển;
- xếp danh sách nguyện vọng;
- thử thay đổi điểm hoặc điều kiện;
- đặt mục tiêu, lập kế hoạch học và theo dõi tiến độ;
- hỏi trợ lý AI nhưng kết quả tính toán vẫn do thuật toán xác định;
- cho người đồng hành xem và góp ý.

Phong cách hiện tại là “vở ô ly · mực xanh”: trẻ, sáng, đáng tin, gần với học sinh Việt Nam, hiện đại nhưng không trẻ con. Giao diện có nền giấy sáng, thẻ trắng, bo góc mềm, nét mực xanh và một ít màu dạ quang. Font của ứng dụng là Be Vietnam Pro và Bricolage Grotesque; SVG không được chứa chữ nên chỉ cần tạo hình hợp với hai font này.

Đối tượng sử dụng chính là học sinh 15–18 tuổi tại Việt Nam. Biểu tượng cần dễ hiểu ngay cả với người không quen các biểu tượng đại học kiểu Mỹ. Không dùng huy hiệu Ivy League, cờ Mỹ, đồng đô-la, bản đồ nước ngoài, kiến trúc cổ điển phương Tây hoặc các hình ảnh “Việt Nam” sáo mòn như nón lá/áo dài/chùa chỉ để trang trí. Sự phù hợp với người Việt đến từ các vật quen thuộc: vở ô ly, phiếu nguyện vọng, bút, lịch học, bảng điểm, cột mốc, đường đi và cách diễn đạt trực quan.

## 2. Hệ màu bắt buộc

Chỉ dùng các màu sau cho tài sản thương hiệu nhiều màu:
- xanh mực chính: `#2448C4`
- xanh mực đậm: `#1A348F`
- xanh nhạt: `#E9EEFB`
- màu mực/tiêu đề: `#131C3F`
- xanh lục tin cậy: `#107A5F`
- cam ấm: `#DC8A00`; nếu cần chữ/hình đậm trên nền sáng dùng `#8A5100`
- tím: `#6A4FD6`
- san hô dịu: `#E0614E`
- vàng dạ quang: `#FFE45E`, chỉ làm điểm nhấn rất nhỏ
- trắng: `#FFFFFF`

Tất cả icon giao diện 24×24 phải dùng `currentColor`, không khóa màu trong file. Màu sẽ được ứng dụng gán bằng CSS. Chỉ các file thương hiệu/app icon được dùng màu cố định ở trên.

## 3. Ngôn ngữ tạo hình

- Hình học phẳng, sạch, có góc bo nhẹ, cân bằng quang học.
- Cùng một họ với Lucide nhưng có cá tính riêng: nét tròn, đầu nét tròn, điểm nối tròn, ít chi tiết hơn minh họa.
- ViewBox chuẩn của icon giao diện: `0 0 24 24`.
- Nét chuẩn: `stroke-width="1.9"`, `stroke-linecap="round"`, `stroke-linejoin="round"`.
- Icon outline dùng `fill="none"`, `stroke="currentColor"`.
- Icon active giữ nguyên silhouette và tỷ lệ của bản outline, có thể dùng mảng `fill="currentColor"` có chọn lọc; không biến thành một hình hoàn toàn khác.
- Icon phải rõ ở 16, 18, 20, 22 và 24 CSS px. Tránh khe nhỏ dưới 1.5 đơn vị ở viewBox 24.
- Không dùng chi tiết mảnh, phối cảnh 3D, glassmorphism, blur, drop shadow, texture, noise, clip-path phức tạp hay gradient cho icon giao diện.
- Không dùng emoji, ký tự Unicode, chữ, số hoặc font bên trong SVG. Nếu cần diễn đạt “nguyện vọng”, dùng các thẻ xếp lớp/chấm thứ tự trừu tượng thay cho số 1, 2, 3.
- Không nhồi nhiều vật thể. Mỗi icon cần một ý chính và tối đa một dấu hiệu phụ.
- Không dùng màu là dấu hiệu duy nhất: silhouette của bốn trạng thái nguyện vọng phải phân biệt được khi hiển thị một màu.
- Vùng hình chính nên nằm trong khoảng x/y từ 2 đến 22, không chạm mép viewBox.
- Trọng lượng thị giác giữa các icon phải đồng đều; icon hồ sơ, lịch và tìm kiếm không được trông nặng/nhẹ lệch hẳn nhau.

## 4. Ý tưởng logo bắt buộc

Logo mới cần giải quyết việc sản phẩm hiện dùng nhiều biểu tượng mũ tốt nghiệp không đồng nhất. Tạo một biểu tượng gốc duy nhất:
- hai trang vở mở tạo thành chữ V trừu tượng, gợi “Nguyện Vọng” nhưng không vẽ chữ;
- mép trên có thể gợi nhẹ hình mũ tốt nghiệp, không sao chép icon mortarboard phổ thông;
- một đường đi ngắn hoặc nút sáng nhỏ hướng lên, gợi mục tiêu và AI hỗ trợ;
- tổng thể phải đọc tốt ở favicon 16×16;
- thân thiện, tự tin, đáng tin; không giống logo ngân hàng, trung tâm ngoại ngữ, sàn tiền số hoặc chatbot đồ chơi;
- dùng xanh mực làm chủ đạo; vàng dạ quang chỉ là một chấm nhỏ nếu thật sự cần;
- logo không chứa chữ “NV”, “AI” hoặc tên sản phẩm. Wordmark sẽ là chữ HTML bên cạnh.

## 5. Danh sách chính xác 30 file SVG phải sinh

### A. Thương hiệu — 4 file

1. `brand/brand-symbol-color.svg`
   - viewBox `0 0 64 64`, nền trong suốt;
   - biểu tượng logo đầy đủ hai hoặc ba màu;
   - dùng trong đầu trang ứng dụng và CMS.

2. `brand/brand-symbol-mono.svg`
   - viewBox `0 0 24 24`, `currentColor`;
   - bản đơn sắc tối giản của cùng logo, không phải thiết kế khác.

3. `brand/favicon.svg`
   - viewBox `0 0 64 64`;
   - nền vuông bo góc xanh mực, logo trắng/xanh nhạt;
   - giữ vùng an toàn tối thiểu 8 đơn vị mỗi cạnh và vẫn rõ khi thu về 16×16.

4. `brand/app-icon-master.svg`
   - viewBox `0 0 512 512`;
   - nền vuông bo góc, không để chi tiết quan trọng ở 64 px sát mép;
   - cùng biểu tượng và hình học với favicon, chỉ được thêm chi tiết quang học phù hợp kích thước lớn;
   - phù hợp để sau này rasterize thành icon 192 và 512.

### B. Điều hướng chính — 10 file

Mỗi tab có một bản outline và một bản active cùng hình học:

5–6. `navigation/nav-today.svg`, `navigation/nav-today-active.svg`
- “Hôm nay”: một trang lịch/vở hôm nay với dấu hoàn thành nhỏ; tránh icon ngôi nhà chung chung.

7–8. `navigation/nav-explore.svg`, `navigation/nav-explore-active.svg`
- “Khám phá”: kính tìm kiếm kết hợp một đường chân trời/ngành học; tránh la bàn hàng hải phức tạp.

9–10. `navigation/nav-preferences.svg`, `navigation/nav-preferences-active.svg`
- “Nguyện vọng”: ba phiếu xếp lớp hoặc ba dòng ưu tiên với một điểm nhấn hình tim rất nhỏ; không dùng chỉ một trái tim vì dễ hiểu thành yêu thích.

11–12. `navigation/nav-plan.svg`, `navigation/nav-plan-active.svg`
- “Kế hoạch”: lịch tuần kết hợp một nét đường đi hoặc dấu kiểm.

13–14. `navigation/nav-profile.svg`, `navigation/nav-profile-active.svg`
- “Hồ sơ”: chân dung học sinh tối giản kết hợp góc giấy/hồ sơ; không phân biệt giới tính.

### C. Nghiệp vụ tuyển sinh và học tập — 12 file

15. `features/feature-career-fit.svg`
- biết mình hợp ngành nào: một mục tiêu/cột mốc nằm trên trang vở mở; không biểu diễn xác suất.

16. `features/feature-school-filter.svg`
- lọc trường theo điểm và túi tiền: tòa nhà trường tối giản + hai thanh lọc; không dùng ký hiệu đô-la.

17. `features/feature-preference-ranking.svg`
- xếp thứ tự nguyện vọng: các phiếu xếp tầng + mũi tên dọc; không dùng chữ/số.

18. `features/feature-score-simulator.svg`
- thử thay đổi điều kiện: hai thanh điều chỉnh + một đường kết quả; không dùng bình thí nghiệm vì đây là quyết định tuyển sinh, không phải phòng lab.

19. `features/feature-mock-score.svg`
- nhập điểm thi thử: tờ bài làm + bút + một dấu kiểm nhỏ.

20. `features/feature-study-goal.svg`
- mục tiêu học: cột mốc/đích đến + đường đi đi lên, tránh bia bắn mang cảm giác cạnh tranh quá mạnh.

21. `features/feature-weekly-plan.svg`
- kế hoạch tuần: sổ lịch dạng vở với 5–7 ô gợi tuần và một dấu đánh dấu.

22. `features/feature-progress.svg`
- tiến độ: ba bước tăng dần + dấu hoàn thành; không hứa hẹn tỷ lệ đậu.

23. `features/feature-data-source.svg`
- dữ liệu có nguồn: tờ tài liệu + mắt xích/đường dẫn + dấu kiểm nhỏ; không dùng khiên làm hình chính.

24. `features/feature-ai-advisor.svg`
- trợ lý AI: bong bóng hội thoại mềm + ba nút liên kết/ánh sáng; thân thiện nhưng không vẽ mặt robot, antenna hoặc não người.

25. `features/feature-companion.svg`
- người đồng hành: hai người ở cùng độ cao + bong bóng góp ý; không tạo quan hệ thầy-trò áp đặt.

26. `features/feature-school-program.svg`
- chương trình/ngành của trường: một trang giáo trình mở + điểm mốc nhỏ của trường; không dùng logo trường thật.

### D. Bốn nhãn nguyện vọng — 4 file

27. `status/status-safe.svg`
- “An toàn”: đường đi đã chạm một cột mốc có dấu kiểm; cảm giác chắc chắn nhưng không hứa chắc trúng tuyển.

28. `status/status-balanced.svg`
- “Vừa sức”: đường đi nằm giữa hai vạch chuẩn/cân bằng; không dùng dấu bằng đơn thuần.

29. `status/status-reach.svg`
- “Thử sức”: đường đi lên một bậc cao/cột mốc xa hơn; không dùng lửa vì dễ mang nghĩa nguy hiểm.

30. `status/status-backup.svg`
- “Dự phòng”: một đường rẽ thứ hai vẫn dẫn tới cột mốc; không dùng khiên giống “An toàn”.

## 6. Cấu trúc thư mục đầu ra

Khi chạy:

```bash
python generate_nguyen_vong_icons.py
```

script phải tạo:

```text
generated/nguyen-vong-icons/
  brand/
  navigation/
  features/
  status/
  manifest.json
  preview.html
  README.md
```

Không ghi đè ngoài `generated/nguyen-vong-icons/`. Nếu thư mục đã có, chỉ ghi đè đúng các file do script quản lý; không xóa file lạ của người dùng.

## 7. Yêu cầu kỹ thuật cho script Python

- Chỉ dùng Python standard library: `pathlib`, `json`, `html`, `xml.etree.ElementTree`, `re`, `hashlib` nếu cần.
- Không dùng CairoSVG, Pillow, svgwrite, requests hay package ngoài.
- Không tải gì từ Internet.
- Tạo SVG bằng các helper rõ ràng, tránh nối chuỗi khó đọc và tránh lặp boilerplate.
- Mỗi SVG phải là XML UTF-8 hợp lệ, có `xmlns="http://www.w3.org/2000/svg"` và đúng `viewBox`.
- Icon UI không khai báo `width`/`height` cố định; ứng dụng sẽ đặt kích thước bằng CSS.
- Không chứa `<text>`, `<image>`, `<foreignObject>`, `<script>`, animation, event handler, URL ngoài, base64, embedded font, CSS bên ngoài, filter, blur hoặc raster.
- Không dùng `id` trong icon UI. Nếu brand cần `id`, ID phải duy nhất theo file và không tham chiếu ngoài file; tốt nhất vẫn dùng màu phẳng, không gradient.
- Không chèn metadata của công cụ thiết kế hoặc comment dài trong SVG.
- Các path phải dùng số được làm tròn hợp lý, tối đa 2 chữ số thập phân.
- Thêm newline cuối file.

## 8. `manifest.json`

Tạo manifest là một mảng 30 object, mỗi object có:
- `name`
- `file`
- `category`: `brand | navigation | feature | status`
- `variant`: `color | mono | outline | active`
- `meaning_vi`
- `suggested_sizes`: mảng số
- `uses_current_color`: boolean
- `integration_hint`: vị trí dự kiến trong app.

Các `integration_hint` nên dùng các vùng sau:
- logo đầu trang app/CMS;
- 5 tab `Hôm nay`, `Khám phá`, `Nguyện vọng`, `Kế hoạch`, `Hồ sơ`;
- nút nổi trợ lý AI;
- các thẻ khám phá, tình huống, điểm thi thử, mục tiêu, kế hoạch, tiến độ, nguồn dữ liệu và người đồng hành;
- nhãn `An toàn`, `Vừa sức`, `Thử sức`, `Dự phòng`.

Không đưa landing page marketing vào `integration_hint`; landing page đó đang có thiết kế riêng và không thuộc đợt thay icon này.

## 9. `preview.html`

Tạo một file HTML chạy offline, không CDN, không JavaScript framework:
- hiển thị đầy đủ 30 SVG bằng cách nhúng inline nội dung SVG, để `currentColor` hoạt động;
- nền sáng `#F5F7FA`, thẻ trắng, font system fallback;
- mỗi icon UI được xem ở 16, 20, 24, 32 và 48 px;
- xem icon trên màu mực xanh, màu tiêu đề, xanh lục, cam và tím;
- đặt outline và active cạnh nhau;
- có khu vực mô phỏng bottom navigation rộng 390px với 5 tab và trạng thái active lần lượt;
- có khu vực kiểm tra logo trên nền trắng, xanh nhạt, xanh mực và kích thước favicon 16/32/64;
- có nhãn tên file bên dưới để tôi đối chiếu;
- không dùng hình ảnh hoặc tài nguyên mạng.

## 10. `README.md`

README ngắn bằng tiếng Việt, ghi:
- cách chạy script;
- danh sách thư mục;
- quy tắc `currentColor`;
- khuyến nghị dùng icon trang trí với `aria-hidden="true"`, còn nút chỉ có icon phải có `aria-label` ở HTML/React;
- không nhúng `title` cố định vào SVG tái sử dụng vì tên truy cập phụ thuộc ngữ cảnh;
- logo thương hiệu dùng file màu, icon UI dùng bản currentColor;
- không sửa thủ công từng SVG: sửa generator rồi chạy lại.

## 11. Tự kiểm tra bắt buộc trong script

Sau khi sinh file, script phải tự chạy validation và dừng với exit code khác 0 nếu sai:
- đúng chính xác 30 file SVG đã liệt kê;
- mọi file parse được bằng `xml.etree.ElementTree`;
- đúng viewBox theo nhóm;
- không chứa tag/thuộc tính bị cấm;
- icon UI có `currentColor` và không có mã hex;
- brand chỉ dùng màu trong palette cho phép;
- không có `<text>` hoặc ký tự emoji;
- file không rỗng và mỗi SVG nhỏ hơn 12 KB;
- manifest có đủ 30 mục, đường dẫn tồn tại, không trùng `name`/`file`;
- outline/active của từng tab có cùng viewBox;
- in bảng kết quả cuối cùng gồm số file, tổng dung lượng và SHA-256 của từng file.

## 12. Tiêu chí chất lượng cần tự rà trước khi trả lời

- Logo vẫn nhận ra khi xem ở 16×16.
- Năm tab phân biệt được chỉ bằng silhouette.
- “Nguyện vọng” không bị hiểu nhầm thành nút yêu thích.
- “Vừa sức/Thử sức/An toàn/Dự phòng” không tạo lời hứa chắc chắn hoặc xác suất đậu.
- Không có icon nào giống logo trường đại học cụ thể.
- Các icon trông như một bộ duy nhất khi đặt cạnh Lucide stroke 2.
- Hình không bị lệch tâm quang học hay sát cạnh.
- Bản active rõ hơn outline nhưng không dày cục.
- Mọi biểu tượng hợp với giao diện sáng, mềm, mực xanh của học sinh Việt Nam.

## 13. Định dạng câu trả lời của bạn

Trả lời bằng tiếng Việt. Đầu tiên nêu rất ngắn ý tưởng tạo hình (tối đa 8 dòng). Sau đó đưa **một code block Python duy nhất** chứa toàn bộ nội dung `generate_nguyen_vong_icons.py`. Không chia code thành nhiều phần, không dùng dấu `...`, không bỏ sót helper hoặc dữ liệu path, không yêu cầu tôi tự bổ sung. Sau code block, chỉ ghi đúng lệnh chạy và đường dẫn thư mục đầu ra.
```

Khi Gemini trả kết quả, gửi lại file `generate_nguyen_vong_icons.py` hoặc nguyên code block. Không cần tự chạy trước; script sẽ được rà soát và chạy trong workspace trước khi các icon được gắn vào ứng dụng.

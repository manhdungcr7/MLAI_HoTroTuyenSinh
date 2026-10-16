# Nguyện Vọng AI — Đề xuất kỹ thuật và sản phẩm

**Bản kiểm chứng ngày 16/10/2026 · Mã nguồn:** nhánh `feat/agent-native-mcp`, commit `a03b257`
**Sản phẩm:** [nguyenvongai.pages.dev](https://nguyenvongai.pages.dev/)

## Tóm tắt

Nguyện Vọng AI hỗ trợ học sinh lớp 11–12 ghi nhận kết quả học tập, khám phá ngành và trường, sắp xếp nguyện vọng và chuyển mục tiêu thành kế hoạch học tập. Các phép tính và kiểm tra dữ liệu được thực hiện bằng logic tất định trong ứng dụng; AI đóng vai trò giải thích, không quyết định thay học sinh và không bảo đảm kết quả trúng tuyển.

Đây là nguyên mẫu có các luồng sản phẩm, API và kiểm thử tự động. Mức kiểm chứng dữ liệu tuyển sinh và chất lượng phản hồi của model còn giới hạn; các điểm này được nêu rõ bên dưới.

## Vấn đề và người dùng

Học sinh phải ghép điểm số, tổ hợp xét tuyển, điều kiện cá nhân, thông tin chương trình và thứ tự ưu tiên từ nhiều nguồn. Khi thiếu điểm thi thử hoặc chưa chốt ngành, các bảng tra cứu tĩnh khó giúp em biết nên làm gì tiếp theo. Tư vấn sinh thành có thể diễn đạt dễ hiểu, nhưng không nên thay thế quy chế tuyển sinh hoặc biến điểm tham khảo thành xác suất đỗ.

Sản phẩm hướng đến học sinh THPT, đặc biệt lớp 11–12, cần một nơi lưu hồ sơ học tập và xem các lựa chọn theo dữ liệu hiện có. Hồ sơ có thể chưa đầy đủ; trường hợp thiếu dữ liệu cần giữ trạng thái chưa đủ căn cứ thay vì tự điền điểm.

## Luồng học sinh

1. Tạo hoặc tiếp tục hồ sơ cá nhân trên thiết bị.
2. Nhập điểm theo năm học; có thể để trống điểm thi thử chưa có.
3. Xem phân tích năng lực và các môn cần cải thiện dựa trên dữ liệu đã nhập.
4. Tìm trường/chương trình và đọc phương thức, tổ hợp, năm và nguồn khi có.
5. So sánh lựa chọn phù hợp với điều kiện, thêm nguyện vọng và tự quyết định thứ tự.
6. Lập kế hoạch tuần, cập nhật tiến độ và tiếp tục dùng hồ sơ đã lưu.
7. Nếu kết nối trợ lý qua MCP, các thao tác ghi tạo đề xuất chờ học sinh xác nhận trong ứng dụng.

Các bước trên mô tả năng lực có trong code và bộ kiểm thử. Mức hoàn tất từng bước trong phiên trình duyệt được ghi riêng ở báo cáo E2E; không coi mô tả luồng là bằng chứng browser đã chạy.

## Năng lực đã xác minh trong mã nguồn

- Hồ sơ và tiến độ theo hướng local-first, cùng các màn khám phá, nguyện vọng, mục tiêu và kế hoạch học tập.
- Engine TypeScript thuần để tính điểm ưu tiên, tìm kiếm/chọn chương trình, gợi ý và xếp lịch; điểm thiếu được giữ là `null` ở các phép so sánh yêu cầu dữ liệu đó.
- Capability dùng schema kiểm tra đầu vào và danh mục chương trình dùng chung cho ứng dụng/API.
- Backend Cloudflare Pages Functions có luồng tuyển sinh, CMS và các endpoint kết nối.
- MCP Streamable HTTP với discovery/schema, OAuth/PKCE, scope theo connection và pending proposals cho thao tác ghi.
- Dữ liệu đóng gói hiện có 118 trường và 3.648 chương trình theo `npm run data:audit`. Đây là số lượng của snapshot trong checkout, không phải xác nhận độ phủ toàn quốc hay dữ liệu hiện hành.

## Kiến trúc và công nghệ

Frontend dùng React 19, TypeScript và Vite, tổ chức theo feature slices trong `src/features/`. `src/state/` quản lý hồ sơ ứng dụng và lưu cục bộ; `src/engine/` chứa các thuật toán thuần; `src/capabilities/` cung cấp thao tác nghiệp vụ có kiểm tra dữ liệu. Cloudflare Pages Functions nằm trong `functions/`; cấu hình ứng dụng dùng D1/KV cho các luồng backend tương ứng. MCP được triển khai trong `functions/mcp/` và thư viện kết nối/OAuth trong `functions/_thu-vien/`.

Luồng tổng quát: giao diện gọi engine/capability để trình bày kết quả; các yêu cầu cần dữ liệu hoặc lưu trữ máy chủ đi qua Pages Functions. MCP xác định hồ sơ từ token/connection phía máy chủ. Hệ thống không dùng student ID do client tự gửi để chọn hồ sơ được cấp quyền.

## AI và phương pháp gợi ý

Kết quả điểm, kiểm tra điều kiện và sắp xếp do logic xác định trong code tạo ra. Nhãn nguyện vọng là phân loại hỗ trợ quyết định, không phải xác suất trúng tuyển. Các so sánh cần đúng phương thức, tổ hợp và dữ liệu tương ứng; thiếu dữ liệu phải thể hiện giới hạn.

AI có thể hỗ trợ diễn giải câu hỏi và đưa bước tiếp theo dựa trên ngữ cảnh/dữ liệu được cung cấp. AI không phải nguồn quy chế độc lập, không được phép bịa ngưỡng điểm hoặc cam kết đỗ. Bộ đánh giá 50 câu hỏi đã được tạo nhưng **chưa chạy** vì runtime kiểm thử không có provider/model credentials hoặc binding AI. Vì vậy đề xuất này không đưa ra kết luận về factuality, grounding, latency hay chi phí model. Tích hợp client Claude/ChatGPT bên ngoài cũng chưa được xác minh.

Qua MCP, quyền đọc/ghi phụ thuộc OAuth scope. Ghi nguyện vọng hay tiến độ tạo pending proposal cần học sinh xác nhận. Kiểm thử hồi quy xác nhận connection legacy không được dùng tool ghi tiến độ mới nếu chưa có consent `study:write`.

## Độ tin cậy dữ liệu

Kiểm toán snapshot cục bộ ghi nhận: 56 chương trình thiếu URL nguồn chính; 2.162 thiếu nguồn theo năm; 93 chương trình có tổ hợp chứa môn engine chưa hỗ trợ; 3.047/3.648 mức học phí mang cờ ước tính. Audit không đối chiếu thủ công đề án tuyển sinh gốc và không xác nhận độ mới. Vì vậy số trường/chương trình không đại diện cho độ phủ đã kiểm chứng; học phí ước tính chỉ để tham khảo; dữ liệu thiếu năm/nguồn không nên dùng để khẳng định điều kiện năm tuyển sinh hiện tại.

Điểm chuẩn lịch sử là dữ liệu quá khứ, không bảo đảm điểm tương lai. Báo cáo hồi cứu engine có độ phủ khác nhau theo năm (2023: 89,4%; 2024: 94,9%; 2025: 64,9%) và không phải chứng nhận năng lực dự đoán. Không đưa ra tuyên bố chính xác dự báo.

## Riêng tư và an toàn

Hồ sơ trên ứng dụng ưu tiên lưu cục bộ. Các kết nối MCP được xác thực bằng OAuth; token được gắn với connection, scope kiểm tra ở backend, schema giới hạn dữ liệu vào/ra và các ghi tạo đề xuất chờ xác nhận. Bộ test MCP kiểm tra cách ly hồ sơ, token hết hạn/thu hồi, scope, OAuth PKCE, transport và write proposals. Đây là kết quả test local, không chứng minh cấu hình production hoặc kết nối trợ lý bên thứ ba đã được nghiệm thu.

## Bằng chứng kiểm thử

Trên checkout `a03b257`: `npm run typecheck`, `npm run kiem-tra`, `npm test`, `npm run build`, `npm run build:functions` và `npm run cms:build` đều đã chạy thành công. `npm run test:mcp`, `npm run test:capabilities` và `npm run data:audit` cũng đạt trong các lượt audit chuyên biệt. Build frontend có cảnh báo chunk `du-lieu-that` khoảng 1,36 MB.

Browser harness trên Pages local đã chạy 156 page/viewport và năm journey checks không ghi lỗi browser/network; harness không gửi câu hỏi AI. Kết quả này không thay thế đánh giá câu trả lời model, xác minh nguồn từng chương trình hay kiểm tra deployment. Báo cáo E2E ghi riêng một race chưa xác định sau khi lưu sáu gợi ý, nên không suy ra toàn bộ hành trình liên tục đã ổn định.

## Giới hạn nguyên mẫu

- Snapshot tuyển sinh chưa được xác minh độc lập từng dòng và freshness chưa biết.
- Một phần học phí là ước tính; một số tổ hợp chưa được engine hỗ trợ.
- Chưa có kết quả chạy bộ AI 50 câu với provider thật; chất lượng model chưa được chấm.
- Chưa xác nhận kết nối client MCP bên ngoài hoặc khả năng mở rộng production bằng phép thử tải.
- Browser E2E và video chỉ được coi là hoàn thành khi có log/MP4 thực tế và được kiểm tra phát lại.

## Kịch bản demo

Demo nên theo một hồ sơ tổng hợp không nhận dạng cá nhân: nhập vài điểm học tập, để trống điểm thi thử nếu chưa có, xem phân tích, tìm chương trình theo danh mục hiện có, đọc giới hạn nguồn, hỏi một câu tư vấn thật nếu provider được cấu hình, chọn và sắp xếp nguyện vọng, rồi mở kế hoạch tuần. Chỉ trình chiếu những hành động chạy được trên runtime được ghi trong báo cáo E2E; bỏ qua hoặc ghi rõ giới hạn nếu một bước không hoạt động.

## Kế hoạch cải thiện sau bốn giờ phản hồi

1. Phân loại phản hồi thành lỗi dữ liệu, lỗi nghiệp vụ, khó hiểu và lỗi tương tác; ưu tiên P0/P1 có thể tái hiện.
2. Đối chiếu nguồn gốc theo trường, chương trình, năm và phương thức; không dùng một URL chung để xác nhận toàn bộ danh mục.
3. Sửa một luồng học sinh hoàn chỉnh, thêm regression test đúng nguyên nhân và kiểm tra lại trên mobile.
4. Chạy bộ AI 50 câu trong môi trường provider có kiểm soát, lưu câu trả lời/latency/tool calls thực tế và chấm theo tiêu chí đã định.
5. Chốt lại proposal, evidence appendix và demo theo commit đã kiểm chứng; ghi rõ các giới hạn còn mở.

## Hồ sơ bằng chứng

Ánh xạ từng tuyên bố kỹ thuật tới mã nguồn, cấu hình và lệnh kiểm tra nằm trong [`ENGINEERING-EVIDENCE.md`](ENGINEERING-EVIDENCE.md). Danh sách issue và trạng thái xác minh nằm trong [`../audits/MASTER-ISSUES.md`](../audits/MASTER-ISSUES.md).

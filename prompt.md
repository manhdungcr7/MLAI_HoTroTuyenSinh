# Hướng dẫn Codex — Nguyện Vọng AI

## Mục tiêu

Thực hiện yêu cầu cụ thể của người dùng trên repo hiện có theo cách nhỏ gọn, dễ kiểm chứng và phù hợp với cách Nguyện Vọng AI đang vận hành. Không biến mỗi yêu cầu thành một cuộc tái kiến trúc toàn sản phẩm.

## Nguyên tắc sản phẩm và repo

- Trả lời bằng tiếng Việt; giữ nguyên tiếng Anh cho code, tên file, API, CLI và thuật ngữ kỹ thuật.
- Sản phẩm ưu tiên học sinh lớp 11–12, Vietnamese-first và local-first. Hồ sơ cá nhân tiếp tục ở luồng ứng dụng hiện có; không giả định plugin/MCP tự đọc `localStorage`.
- Tính toán, điều kiện tuyển sinh và xếp hạng phải dựa trên logic xác định. AI chỉ giải thích kết quả, không tự đặt quy chế, điểm còn thiếu hay xác suất trúng tuyển.
- Thiếu dữ liệu thì giữ `null` hoặc nói rõ chưa có; phân biệt dữ liệu chính thức, lịch sử, ước tính và chưa xác minh. Có URL không đồng nghĩa đã kiểm chứng.
- Tôn trọng ranh giới hiện có: `src/engine/` cho thuật toán thuần; `src/capabilities/` cho thao tác nghiệp vụ dùng lại; `functions/mcp/` cho MCP transport; `functions/_thu-vien/ket-noi-cong-cu.ts` cho hợp đồng tool; `src/state/ket-noi.ts` cho xác nhận trong app. Trước khi thay đổi, xác nhận code hiện tại và tái sử dụng đúng phần đang được gọi.
- Danh tính và quyền riêng tư được xác định phía server từ OAuth/connection. Không tin `studentId` do client gửi làm bằng chứng quyền truy cập.
- MCP chỉ đọc đúng snapshot đã được kết nối/cấp quyền. Thay đổi dữ liệu tạo đề xuất chờ học sinh xác nhận trong ứng dụng; không ghi trực tiếp từ tool.

## Quy trình 4 bước

1. **Kiểm tra hiện trạng.** Đọc `AGENTS.md` và `.agents/AGENTS.md`, kiểm tra `git status`, diff, branch, đường đi dữ liệu và test liên quan. Đối chiếu tài liệu với code hiện tại; ghi nhận phần đã có, phần lỗi và phần chưa được xác minh. Không giả định báo cáo cũ phản ánh checkout này.
2. **Chọn một gap có bằng chứng.** Bám yêu cầu người dùng và lỗi/thiếu sót tái hiện được. Ưu tiên sửa nguyên nhân gốc, tái sử dụng implementation hiện có, chọn phạm vi nhỏ nhất vẫn hoàn thành được luồng cần thiết. Hỏi người dùng chỉ khi thiếu quyết định nghiệp vụ không thể suy ra.
3. **Sửa và kiểm tra luồng liên quan.** Đọc code trước khi sửa. Giữ tương thích cần thiết, cập nhật test phù hợp, chạy các kiểm tra liên quan và kiểm tra hành vi thật khi task yêu cầu. Không coi typecheck/build riêng lẻ là bằng chứng tính năng đúng.
4. **Báo kết quả ngắn.** Nêu thay đổi chính, file liên quan, lệnh kiểm tra thực chạy và kết quả. Đánh dấu từng hạng mục `PASS`, `PARTIAL`, `BLOCKED` hoặc `FAIL`; ghi rõ giới hạn và bước chưa xác minh.

## Dùng tool và subagent

- Ưu tiên khả năng có sẵn trong repo, Codex và công cụ đã cài. Chỉ cài thêm MCP/plugin/dependency khi có lợi ích cụ thể, đã kiểm tra tương thích và thật sự cần cho yêu cầu.
- Chỉ gọi tối đa 3 subagent khi có các nhánh rà soát độc lập giúp giảm rủi ro. Giao nhiệm vụ đọc-only, phạm vi rõ (ví dụ: kiến trúc/diff, MCP và quyền, dữ liệu hoặc hành trình người dùng). Agent chính sở hữu mọi chỉnh sửa, tích hợp và kiểm chứng; không để agent cùng sửa file.
- Không gọi subagent chỉ để tăng số lượng hoặc giao lại cùng một việc. Tổng hợp kết quả, kiểm tra phát hiện dựa trên repo và bỏ qua đề xuất trái quy tắc dự án.

## Ranh giới an toàn

- Giữ nguyên mọi thay đổi có sẵn trong worktree. Không dùng `reset`, `restore`, `clean`, ghi đè file người dùng, hoặc tạo commit/tag/branch nếu yêu cầu không cần và chưa được cho phép.
- Không sửa, xóa, đổi tên, định dạng lại hay làm lệch giao diện landing page đã duyệt tại `src/features/landing-page/`, `src/styles/landing.css`, `public/landing/`, trừ khi người dùng yêu cầu rõ việc sửa landing page.
- Không deploy production, áp migration từ xa, sửa dữ liệu production hay gửi yêu cầu ghi ra dịch vụ bên ngoài nếu chưa có cho phép rõ ràng. Mặc định chỉ kiểm tra production ở chế độ đọc khi điều đó cần thiết và được hỗ trợ.
- Không ghi token, secret, hồ sơ học sinh hoặc điểm cá nhân vào log, tài liệu hay cấu hình được theo dõi bởi Git.
- Làm theo chế độ cộng tác hiện hành: trong Plan Mode chỉ khảo sát và lập kế hoạch; khi được yêu cầu thực thi ở Default Mode thì hoàn tất việc trong phạm vi đã chốt.

## Kiểm tra và hoàn tất

Chọn lệnh theo phần bị ảnh hưởng; các lệnh repo thường dùng:

- `npm run typecheck`
- `npm run kiem-tra`
- `npm test`
- `npm run build`
- `npm run build:functions`
- `npm run test:capabilities`
- `npm run test:mcp`
- `npm run test:browser`
- `npm run data:audit`

Xác nhận script còn tồn tại và phù hợp với checkout trước khi chạy. Với thay đổi MCP, kiểm tra schema, scope, cô lập dữ liệu và đề xuất chờ xác nhận. Với thay đổi UI, kiểm tra hành trình thực và kích thước màn hình liên quan. Với dữ liệu tuyển sinh, kiểm tra provenance và ngày/năm nguồn. Không deploy để “xác minh” nếu chưa được cho phép.


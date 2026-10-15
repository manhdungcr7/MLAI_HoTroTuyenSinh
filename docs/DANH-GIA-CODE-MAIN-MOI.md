# Đánh Giá & Phân Tích Chuyên Sâu Đợt Cập Nhật `origin/main` (`57c8a1b..d38528a`)

- **Thời điểm pull & đánh giá:** 15/10/2026
- **Phạm vi commit:** `57c8a1b..d38528a` (**20 commits**, chủ yếu bởi `manhdungcr7` và `Nguyen Tuan Kiet`)
- **Quy mô thay đổi:** **107 files changed**, `+126,975 insertions`, `-908 deletions`
- **Trạng thái cổng kiểm tra sau khi pull:** `tsc --noEmit` (PASS) · `npm run kiem-tra` (PASS - 33 routes, 14 slices) · `npm test` (PASS 100%)

---

## 1. Bảng Tổng Hợp 6 Trụ Cột Thay Đổi & Lý Do Thiết Kế ("Tại Sao Họ Code Như Vậy?")

| STT | Nhóm thay đổi chính | Các Commit tiêu biểu | File trọng tâm | Tại sao họ code như vậy? (Lý do kỹ thuật & sản phẩm) | Đánh giá chất lượng |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **Chuẩn hóa Dữ liệu Tuyển sinh Quốc gia (3.652 ngành / 118 trường)** | `cbb0641`, `63b3a45`, `3165a69`, `90fc40e` | `src/data/du-lieu-that.json`, `hoc-phi.json`, `viec-lam.json`, `scripts/fix-all-admission-scores.mjs`, `scripts/hoan-thien-du-lieu-quoc-gia.py` | **1) Chữa lỗi "Điểm sàn nhầm thành Điểm chuẩn":** Crawler trước đó lấy nhầm ngưỡng đảm bảo chất lượng đầu vào (điểm sàn 17–23đ) của HCMUS (APCS), PTIT, ĐH Giáo dục... làm điểm chuẩn, khiến thuật toán xếp nhầm ngành top đầu thành "An toàn".<br>**2) Lấp đầy 100% Học phí & Việc làm:** Nếu thiếu `hocPhi` hoặc `tiLeViecLam`, bộ lọc ngân sách ở Khám phá và chấm điểm đa tiêu chí (`diemPhuHop`) bị khuyết hoặc rơi vào trạng thái "Chưa có dữ liệu" quá nhiều khi demo. | **8.5/10** — Sửa điểm chuẩn các trường top rất trúng đích; tuy nhiên script Python lấp đầy 100% học phí/việc làm dùng công thức ước lượng (heuristic + hash) cho các trường chưa bóc được bảng PDF. |
| **2** | **Hồ sơ Đa phương thức & Kế hoạch Chiến lược** | `2d7a82a` | `src/state/types.ts`, `src/state/chuan-hoa.ts`, `src/features/khoi-dau/diem-xet-tuyen-som.tsx`, `src/features/ke-hoach/che-do-chien-luoc.tsx` | **Bám sát thực tế tuyển sinh 2026:** Học sinh lớp 12 không chỉ xét điểm thi THPT mà còn xét IELTS, ĐGNL (HCM/HSA/TSA), Học bạ và giải HSG. Họ mở rộng `HoSo` với các trường optional (`?`) và lọc chống Prototype Pollution trong `chuan-hoa.ts` để **không làm hỏng `localStorage` cũ**. Đồng thời thêm tab "Chiến lược" chia 3 tầng năng lực (`<7.0`, `7.0–8.2`, `>=8.2`) nối thẳng việc chọn chuyên đề `"canOnTap"` vào hàm sinh việc học tuần (`tao-viec.ts`). | **9.5/10** — Kiến trúc mở rộng tương thích ngược tuyệt đối, luồng dữ liệu khép kín (Closed-Loop) từ Hồ sơ → Chẩn đoán → Sinh việc tuần. |
| **3** | **Khép kín luồng Yêu thích (Thả tim) → Nguyện vọng** | `53cd4fc`, `d38528a` | `src/components/layout/thong-bao-yeu-thich.tsx`, `src/features/nguyen-vong/danh-sach.tsx` | **Giải quyết đứt gãy hành trình người dùng (UX Friction):** Trước đây học sinh bấm "Thả tim" ở Khám phá chỉ lưu ngầm vào `s.yeuThich`, khi sang tab Nguyện vọng lại thấy trống trơn. Họ dùng **Custom Event (`window.dispatchEvent(new CustomEvent("nvai-thong-bao-tim"))`)** để bật Toast nổi có nút `+ Thêm vào NV` ngay lập tức mà không cần truyền props xuyên nhiều tầng component hoặc làm bẩn Global Store bằng state UI tạm thời. | **9.0/10** — Giải pháp Event Bus nhẹ, sạch; commit `d38528a` sửa tiếp hành vi giữ nguyên thẻ đã lưu yêu thích kèm trạng thái "Đã trong NV" để học sinh dễ đối chiếu. |
| **4** | **Nâng cấp RAG & Đa tầng Fallback cho Tư vấn AI** | `53cd4fc`, `93d4686`, `70f901f`, `b05f7c3`, `29784a4` | `functions/_thu-vien/ai/sinh-van-ban.ts`, `src/features/tu-van/lay-du-lieu.ts`, `wrangler.jsonc` | **Chống chết dịch vụ (High Availability) & tối ưu độ trễ:**<br>1) Thêm binding Cloudflare Workers AI (`@cf/meta/llama-3.3-70b-instruct` tự động hạ cấp xuống `llama-3.1-8b-instruct` nếu lỗi) để chạy **Zero-Key** khi không cấu hình API key ngoài.<br>2) Tắt `reasoning: { enabled: false }` cho DeepSeek v4.1 trên OpenRouter vì model suy luận ngốn sạch `max_tokens` vào thinking và gây timeout >15s.<br>3) Làm giàu bộ trả lời tĩnh (`traLoiTuDong`) cho các câu hỏi về ký túc xá/nhà trọ, phương pháp học 60-35-5, so sánh 2 ngành và xét tuyển sớm để ngay cả khi offline/mất mạng chatbot vẫn trả lời thông minh. | **9.5/10** — Xử lý rất thực chiến các bẫy timeout của LLM và đảm bảo chatbot luôn trả lời có số liệu thật từ hồ sơ. |
| **5** | **Đổi đại từ xưng hô (`em` → `bạn`), Tối giản UI & Đảo chiều sắp xếp Khám phá** | `23d1dcf`, `72a1fa1`, `fa1bce5`, `9dd545b`, `8f05363` | 49+ files toàn bộ `src/features/*` và `src/engine/*` | **1) Giảm tải nhận thức (Cognitive Load):** Xóa hàng loạt dòng mô tả phụ màu xám (`text-chu-phu`) dưới các tiêu đề để màn hình mobile 390px thoáng, vào thẳng form.<br>**2) Đảo thứ tự Khám phá (`Thử sức → Phù hợp → Cần cân nhắc`):** Tâm lý học sinh muốn nhìn thấy các trường top/mơ ước trong tầm với ("Thử sức") ở đầu danh sách rồi mới giảm dần xuống trường vừa sức/an toàn.<br>**3) Đổi `"em"` sang `"bạn"`:** Đồng bộ giọng văn ngang hàng, thân thiện theo yêu cầu điều chỉnh UX mới. | **8.0/10** — Giao diện gọn hơn rõ rệt và đã cập nhật test đồng bộ, nhưng việc đổi `"em"` → `"bạn"` đang **trái với mục 4.9 trong `.agents/AGENTS.md`** (cần cập nhật lại tài liệu luật nếu chốt dùng `"bạn"`). |
| **6** | **Đồng bộ Landing Page với Dữ liệu & UI thực tế** | `71280e7`, `be669ff` | `src/features/landing-page/app-showcase.tsx`, `landing-fixtures.ts`, `reference-landing.tsx` | **Chống lệch pha giữa trang giới thiệu và sản phẩm thật:** Thay hình tĩnh/mockup cũ trên Landing Page bằng component `HeroAppMockup` và `AppScreenShowcase` dựng bằng code, hiển thị đúng con số `3.652 ngành · 118 trường ĐH` và 5 màn hình thực tế của ứng dụng, cân bằng bố cục 2 cột đối xứng ở Hero. | **8.5/10** — Nâng tính thuyết phục khi trình diễn (Demo/Pitching), nhưng chạm vào thư mục được đánh dấu bảo vệ trong `AGENTS.md`. |

---

## 2. Giải Phẫu Chi Tiết Các Quyết Định Kỹ Thuật Đáng Chú Ý

### 2.1. Tại sao dùng `CustomEvent("nvai-thong-bao-tim")` trong [`thong-bao-yeu-thich.tsx`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/components/layout/thong-bao-yeu-thich.tsx#L21-L41)?
Khi người dùng bấm nút thả tim ở bất kỳ đâu (thẻ ngành ở Khám phá, màn Chi tiết trường, màn So sánh), nếu đưa trạng thái hiển thị popup vào `AppState` (`store.tsx`) sẽ gặp 2 vấn đề:
1. Vi phạm quy tắc *"Không thêm trường vào `store.tsx` tuỳ tiện"* trong `.agents/AGENTS.md`.
2. Gây re-render toàn bộ cây React chỉ vì một thông báo tạm thời tự tắt sau 4.5 giây.

Do đó, tác giả đã phát sự kiện trình duyệt `nvai-thong-bao-tim` kèm `{ id, ten, daThich }`. Component [`ThongBaoYeuThich`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/components/layout/thong-bao-yeu-thich.tsx#L15-L125) gắn một lần duy nhất ở [`khung.tsx`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/components/layout/khung.tsx) sẽ lắng nghe, quản lý bộ đếm `setTimeout` bằng `useRef`, và cho phép bấm **`+ Thêm vào NV`** ngay trên thanh nổi.

### 2.2. Tại sao phải tắt `reasoning: { enabled: false }` và bọc try-catch 2 tầng model trong [`sinh-van-ban.ts`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/functions/_thu-vien/ai/sinh-van-ban.ts#L24-L98)?
- **Bẫy thời gian thực trên Serverless:** Client cắt kết nối sau 15 giây, bước phân loại Clef tốn tối đa 4 giây, nên hàm `goiMoHinh` chỉ có ngân sách tối đa `HAN_GOI_MS = 10_000` (10 giây).
- Các model dòng DeepSeek v4.x khi gọi qua OpenRouter mặc định bật chế độ suy luận chuỗi (Chain-of-Thought). Với `max_tokens: 1000`, model sẽ tiêu tốn toàn bộ token vào trường `reasoning` ngầm, vừa làm thời gian phản hồi vọt lên 15–20 giây (gây timeout), vừa trả về `content: ""` rỗng. Việc truyền `reasoning: { enabled: false }` và `provider: { sort: "latency" }` là cách xử lý chính xác để ép độ trễ xuống ~1.5–3 giây.
- Với **Cloudflare Workers AI (`env.AI`)**: Model lớn `@cf/meta/llama-3.3-70b-instruct` đôi khi gặp giới hạn tải hoặc холодный старт (cold start) trên tài khoản Workers miễn phí/tiêu chuẩn. Họ bọc `try / catch` để tự động chuyển tiếp (fallback) ngay sang `@cf/meta/llama-3.1-8b-instruct` nhanh và nhẹ hơn thay vì văng lỗi 500.

### 2.3. Tại sao thêm lớp phòng vệ `Number.isFinite` trong [`muc-tieu/tinh-toan.ts`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/features/muc-tieu/tinh-toan.ts#L48-L98)?
Trong quá trình người dùng chuyển đổi giữa hồ sơ trống, hồ sơ mẫu và nhập điểm thi thử một phần, một số phép tính độ dốc xu hướng (`doDocXuHuong`) hoặc công sức môn (`congSucMon`) có nguy cơ nhận giá trị `NaN` hoặc `undefined` từ mảng lịch sử điểm, dẫn đến hiển thị `NaN` trên UI. Họ đã gia cố:
- Lọc `gia.filter((g) => typeof g === "number" && Number.isFinite(g))` trước khi tính độ dốc.
- Ép `safeThieu` và `safeHienTai` về `0` nếu không phải số hữu hạn trong `congSucMon()`.

### 2.4. Tại sao sắp xếp lại thứ tự mức phù hợp trong [`kham-pha/phu-hop.ts`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/features/kham-pha/phu-hop.ts#L46-L185)?
Trước đây, `THU_TU_MUC` xếp `"Phù hợp": 0, "Có thể thử sức": 1`. Tuy nhiên, trong tư vấn tuyển sinh đại học:
- Học sinh luôn đặt các nguyện vọng **"Thử sức"** (điểm chuẩn cao hơn điểm hiện tại từ 0.1 đến 2.0 điểm) lên đầu danh sách (NV1, NV2), sau đó mới đến nhóm **"Phù hợp / Vừa sức"** (NV3, NV4) và **"An toàn"** (NV5+).
- Việc đổi `THU_TU_MUC = { "Có thể thử sức": 0, "Phù hợp": 1, "Cần cân nhắc": 2 }` và trong mỗi mức sắp xếp giảm dần theo `b.diemMin - a.diemMin` giúp danh sách ở màn Khám phá khớp tự nhiên với thứ tự ưu tiên khi đưa vào danh sách Nguyện vọng.

---

## 3. Các Điểm Cần Lưu Ý & Rủi Ro Kỹ Thuật (Audit Theo Quy Chuẩn Dự Án)

Mặc dù toàn bộ 40 file test và cổng `npm run kiem-tra` đều xanh 100%, dưới góc độ kiểm toán kiến trúc và quy tắc dự án (`AGENTS.md`), có **4 điểm cần đội ngũ lưu ý**:

1. **Xung đột quy ước xưng hô với `.agents/AGENTS.md`:**
   - Mục 4.9 của `.agents/AGENTS.md` quy định: *"Thuần Việt: gọi học sinh là 'em', câu ngắn, nói việc cần làm"*.
   - Các commit `70f901f`, `9dd545b`, `b05f7c3`, `5c6a522` đã đổi đồng loạt toàn bộ giao diện và engine từ `"em"` sang `"bạn"`.
   - **Khuyến nghị:** Nếu cả nhóm đã thống nhất chuyển sang xưng hô `"bạn"`, cần cập nhật lại câu chữ trong `.agents/AGENTS.md` để tránh các thành viên hoặc AI agent sau này sửa ngược lại thành `"em"`.

2. **Chạm vào vùng bảo vệ Landing Page (`AGENTS.md`):**
   - Hai commit `71280e7` và `be669ff` đã chỉnh sửa `src/features/landing-page/*` và `src/styles/landing.css` (vốn nằm trong danh sách Protected Paths của `AGENTS.md`). Nếu đây là thay đổi đã được chủ dự án phê duyệt để đồng bộ số liệu thật `3.652 ngành`, nên cập nhật tag hoặc ghi chú trong `docs/LANDING-LOCK.md`.

3. **Dữ liệu Học phí & Việc làm sinh tự động trong [`scripts/hoan-thien-du-lieu-quoc-gia.py`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/scripts/hoan-thien-du-lieu-quoc-gia.py#L91-L260):**
   - Với các trường chưa bóc tách trực tiếp từ bảng PDF, script dùng hàm `tinh_hoc_phi_chuan()` và `tinh_viec_lam_chuan()` kết hợp băm MD5 (`hashlib.md5`) để tạo độ lệch nhẹ (`-1.5` đến `+2.0` triệu, hoặc tỉ lệ việc làm `82%–97%`) kèm số trang đề án ước tính.
   - **Khuyến nghị:** Cách này giúp demo mượt 100% cho 3.652 ngành, nhưng cần lưu ý nguyên tắc *"Không bịa số"* của dự án — đối với các bản ghi ước lượng theo khung Nghị định 97/2023/NĐ-CP mà chưa trích xuất chính xác từng dòng từ PDF gốc, nên gắn nhãn phân biệt rõ là *"Ước tính theo khung học phí đề án / NĐ 97"* thay vì khẳng định 100% trích xuất trực tiếp từ trang PDF.

4. **Vi phạm nhẹ quy tắc Zero-Glassmorphism ở Toast và Floating Badge:**
   - Trong [`src/components/layout/thong-bao-yeu-thich.tsx`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/components/layout/thong-bao-yeu-thich.tsx#L64) có dùng `bg-muc/95 ... backdrop-blur` và trong [`src/features/landing-page/app-showcase.tsx`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/features/landing-page/app-showcase.tsx#L27) có dùng `backdrop-blur-md`. Quy tắc thiết kế chung yêu cầu giao diện phẳng đặc (solid background, không `backdrop-filter`).

---

## 4. Ghi Chú Về Trạng Thái Git Của Máy Local

- Trước khi pull `origin/main`, các thay đổi đang làm dở ở local (16 file modified + 5 file untracked liên quan đến CMS bản nháp và `tu-van/dang-cho.ts`) đã được cất an toàn vào **`git stash@{0}` (`wip-before-pull-main`)** để không gây xung đột khi kéo 107 file từ `origin/main`.
- Khi cần lấy lại phần việc đang làm dở, chỉ cần chạy `git stash pop` (lưu ý kiểm tra merge ở `src/features/tu-van/lay-du-lieu.ts` và `tu-van.tsx` vì `origin/main` cũng vừa cập nhật các file này).

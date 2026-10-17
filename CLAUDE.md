# CLAUDE.md — Nguyện Vọng AI (RTC TEAM, MLAI Hackathon 2026)

File này giải thích dự án và những gì đã làm, cho đồng đội vừa clone về và cho Claude Code khi mở repo.
Đọc xong file này là đủ để chạy, sửa và deploy mà không phải hỏi lại.

## 1. Sản phẩm là gì

Ứng dụng mobile web hỗ trợ học sinh THPT Việt Nam chọn ngành/trường và theo đuổi mục tiêu.
Hành trình ba bước theo slide: **Hiểu bản thân → Chọn con đường → Theo đuổi mục tiêu**.

| Tính năng trong slide | Nằm ở đâu |
|---|---|
| Hồ sơ học sinh thông minh | `src/features/khoi-dau` (nhập), `src/features/hanh-trinh/ho-so.tsx` (nhận xét tự động) |
| Khám phá ngành/trường | `src/features/kham-pha` (3.648 chương trình thật của 118 trường, lọc, so sánh, chi tiết có nguồn) |
| Danh mục nguyện vọng cân bằng | `src/features/nguyen-vong`, `src/features/thu-tinh-huong` |
| Mục tiêu và khoảng cách | `src/features/muc-tieu` |
| Kế hoạch học theo tuần | `src/features/ke-hoach`, `src/features/tu-hoc` |
| Hỏi tư vấn AI có căn cứ | `src/features/tu-van`, `functions/api/tu-van.ts` |
| Hiểu sở thích (hướng nghiệp) | `src/features/huong-nghiep` (trắc nghiệm Holland 12 tình huống + 1 câu giá trị → nhóm ngành gợi ý, lưu `HoSo.soThich`) |
| Phụ huynh/thầy cô đồng hành | `src/features/hanh-trinh/chia-se.tsx` (tóm tắt + tạo liên kết), `src/features/dong-hanh` (người đồng hành xem, viết lời nhắn; em nhận lời nhắn) |
| Dự báo điểm chuẩn năm tới (khoảng thống kê + LightGBM, ML chỉ cải thiện nhẹ) | `src/engine/du-bao-diem-chuan.ts`, `src/features/kham-pha/khoi-du-bao.tsx` (có kiểm định ngược, độ tin cậy từng dự báo) |
| Bản đồ cơ hội, Phòng thử điểm, Thẻ hành trình | `src/features/co-hoi` (`/co-hoi`, `/co-hoi/thu-diem`), `src/engine/ban-do-co-hoi.ts`, `src/features/hanh-trinh/the-hanh-trinh.tsx` (ở Hôm nay) |
| Độ tin cậy dữ liệu, chỉ tiêu ngành | `src/features/kham-pha/khoi-do-tin-cay.tsx` (trang Về dữ liệu), `src/engine/do-tin-cay-du-lieu.ts`, dòng Chỉ tiêu ở `chi-tiet.tsx` |
| Sửa điểm có bằng chứng | `src/data/hieu-chinh-diem.json` + `.ts`, báo cáo ở `docs/audits/` |
| Số chốt nộp bài | `docs/SO-LIEU-CHOT-NOP-BAI.md`, `scripts/so-lieu-nop-bai.mts` |
| Điểm ưu tiên khu vực/đối tượng | `src/engine/diem-uu-tien.ts`, `src/features/khoi-dau/diem-uu-tien.tsx` |
| Cập nhật dữ liệu bởi người trong trường | `cms/` (CMS quản trị), `functions/snapshots`, `functions/api/{bao-sai,tinh-nguyen,manifest}.ts`, `src/features/dong-gop`; vận hành: `docs/QUAN-TRI.md` |
| Đối chiếu tiêu chí chấm của Ban Tổ chức | `docs/DOI-CHIEU-TIEU-CHI.md`, `docs/HOI-DAP-BAN-GIAM-KHAO.md`, `docs/KICH-BAN-DEMO.md` |
| 4 chỉ số theo dõi (slide 9) | `src/features/hanh-trinh/chi-so-theo-doi.tsx`, logic ở `tom-tat.ts` |
| Quyền riêng tư, local-first (slide 8) | `localStorage`, xuất/khôi phục ở Cài đặt, `src/state/sao-luu.ts` |

Nguyên tắc sản phẩm: không có học sinh nào bị "dự đoán đậu/trượt". "Điểm phù hợp" khác xác suất.
Điểm chuẩn là số các năm trước, mọi con số đều kèm nguồn, thiếu dữ liệu thì nói thiếu.

## 2. Chạy và kiểm tra

```bash
npm install
npm run dev          # chạy thử
npx tsc --noEmit     # kiểm tra kiểu (gồm cả thư mục functions)
npm run kiem-tra     # kiểm tra route, màu, từ cấm
npm test             # toàn bộ test (hơn 80 bộ: logic, dữ liệu, CMS/API, dự báo, MCP, AI, hộp thư, kiểm tra đồng nhất)
npm run cong:commit  # cổng trước commit (tự chạy bằng hook): tsc + kiem-tra + test phần đổi
npm run cong:push    # cổng trước push: tsc + kiem-tra + vite build (thêm -- --day-du để chạy mọi test)
npx tsx scripts/so-lieu-nop-bai.mts   # số chốt cho slide và tài liệu nộp bài
npm run cms:build    # build CMS quản trị (CI cũng chạy)
npm run cms:api      # CMS + API cục bộ (D1/KV cục bộ), xem docs/QUAN-TRI.md
npm run app:local    # app học sinh + Functions cục bộ, dùng chung dữ liệu với cms:api
npm run build
```

Trước khi gộp vào `main`, cả bốn lệnh `tsc`, `kiem-tra`, `test`, `build` phải qua. Làm việc song song: mỗi việc một worktree (`npm run viec-moi -- ten-viec`), chỉ `git add` đường dẫn cụ thể, không `--no-verify` (`AGENTS.md` mục 9). Push `main` thì CI tự deploy lên Cloudflare Pages (mục 6).

## 3. Kiến trúc

- Vite + React 19 + react-router-dom 7 (hash router) + Tailwind 4 + TypeScript.
- Mỗi tính năng là một slice trong `src/features/<slice>` với `routes.tsx` riêng. Quy tắc slice: `docs/HUONG-DAN-SLICE.md`.
- Đường dẫn chỉ khai báo ở `src/duong-dan.ts` (`MAU`, `DUONG_DAN`). Không viết tay chuỗi `"/..."` trong features; `tests/kiem-tra-route.ts` sẽ báo lỗi.
- Trạng thái toàn app: `src/state/store.tsx`, lưu ở `localStorage` khóa `nvai:v2`. Hàm dẫn xuất dùng chung: `src/state/chon.ts`.
- Engine thuần TypeScript, không React, có test: `src/engine/{phan-tich,xep-lich,tao-viec,tu-van}.ts`.
- Giao diện: chữ nhẹ, xưng "bạn/em" theo ngữ cảnh, ít in đậm, màu lấy từ token (không dùng mã màu viết tay).
- Cẩn thận vòng import: `diemHienTaiCuaTungMon` nằm ở `src/state/diem-hien-tai.ts` (store re-export) chính vì việc này.

## 4. Dữ liệu

- 3.648 chương trình thật ở `src/data/du-lieu-that.json`, chuyển sang kiểu `LuaChon` bởi `src/data/lua-chon-that.ts`. Số chốt (17/10/2026, lệnh `npx tsx scripts/so-lieu-nop-bai.mts`): 118 trường, 3.320 chương trình xét điểm thi THPT, 1.492 gắn nguồn đề án PDF và 2.156 gắn nguồn trang tổng hợp. Mọi số khi trình bày lấy từ `docs/SO-LIEU-CHOT-NOP-BAI.md`.
- Các file nạp lười (lazy): điểm theo năm, đề án trường, chương trình, trang ngành-trường.
- Điểm năm 2026 (2.082 chương trình) chủ yếu từ trang tổng hợp (tuyensinh247) và bổ sung từ VnExpress (`scripts/crawl-vnexpress.py`, `doi-chieu-vnexpress.py`), **chưa đối chiếu đề án**; app ghi nhãn "chưa đối chiếu đề án".
- Học phí: 662 chương trình hiển thị, **toàn bộ theo VnExpress** (nguồn thứ cấp, `hoc-phi-vnexpress.json`). Học phí trích từ văn bản trường (`hoc-phi.json`) bị ẩn vì chưa có dấu đối chiếu tài liệu gốc (`hoc-phi-kiem-chung.ts`); học phí ước tính không bao giờ hiển thị. Các số cũ "602 chương trình ở 18 trường", "721 ở 20 trường" không còn đúng. Việc làm: 121 chương trình; chỉ tiêu theo ngành: 421 bản ghi của 10 trường (`chi-tieu.json`).
- Sửa điểm có bằng chứng: `src/data/hieu-chinh-diem.json` (146 mục năm của 70 chương trình), nạp ở `napLuaChon()`. Không sửa tay `du-lieu-that.json`.
- Độ chính xác đã đo (`docs/audits/do-chinh-xac-du-lieu.md`): điểm có phần lẻ khớp PDF ở 201/201 dòng đã kiểm; **điểm số nguyên chưa kiểm hết** (mẫu con: 5 sai trên 28). 5 trường nghi sai mã hoặc tên (DQH, TTN, DTV, TYS, DDP). Không được nói "chính xác 100%".
- 73 tổ hợp xét tuyển chính thức: `src/data/to-hop-chinh-thuc.ts`.
- Script sinh lại dữ liệu cần thư mục anh em `nguyen-vong` (nguồn thô). Hướng dẫn và giới hạn: `docs/DU-LIEU.md`.
- Dữ liệu nào chưa có thì hiển thị "chưa có", không điền thay.

### Logic điểm (quan trọng nhất, dễ sai)

- Tổng điểm tính **theo tổ hợp của từng chương trình** (`tongChoLuaChon` ở `kham-pha/to-hop.ts`), không dùng một tổ hợp chung cho cả danh sách.
- Ngành đề án chưa ghi tổ hợp: lấy tổ hợp tốt nhất em tính được và gắn cờ "suy ra".
- Chưa đủ điểm môn: trả `khongTinhDuoc`/`thieuMon`, không tự điền 0.
- Nhãn Thử sức / Vừa sức / An toàn / Dự phòng: `nhanNguyenVong`, ngưỡng chênh điểm < 0, < 1,5, < 4, ≥ 4 (đã làm tròn 2 chữ số để không lệch do số thực).
- Môn thêm (Sử, Địa, GDKT&PL, Tin, Công nghệ) nằm ở `HoSo.diemThem`, gộp qua `diemDayDu(s)`.

## 5. Tư vấn AI có căn cứ

- Client gom dữ liệu liên quan (`tu-van/lay-du-lieu.ts`), gửi `POST /api/tu-van`.
- Server (Cloudflare Pages Function) chỉ cho phép trích nguồn có thật (`locNguon` lọc id bịa).
- Chưa có khóa API: trả 503 `chua-cau-hinh`, app tự trả lời từ dữ liệu (`traLoiTuDong`), người dùng vẫn dùng được.
- Bật AI thật: thêm biến `ANTHROPIC_API_KEY` (hoặc `OPENAI_API_KEY`) trong Cloudflare Pages → Settings → Variables. Chi tiết `docs/TU-VAN-AI.md`.

## 6. Việc đã làm và vì sao (lịch sử rà soát)

Giai đoạn 1 — nạp dữ liệu thật và đưa lên main:
- Thay dữ liệu mẫu bằng 3.648 chương trình thật của 118 trường, có nguồn, năm, tổ hợp, phương thức.
- Trang "Về dữ liệu" nói rõ nguồn và giới hạn; lọc, so sánh, gợi ý danh sách nguyện vọng theo điểm và ngân sách.
- Cloudflare Pages (https://nguyenvongai.pages.dev) deploy bằng GitHub Actions khi push `main` (`.github/workflows/deploy.yml`: tsc + kiem-tra + build rồi `wrangler pages deploy`; test chạy job riêng, không chặn). Trước 17/10/2026 workflow này đỏ ở bước test nên không bao giờ tới bước deploy và bản trên site đều do `npm run deploy` thủ công; nếu CI đỏ thì deploy tay: `npm run build && npx wrangler pages deploy dist --project-name=nguyenvongai --branch=main`. `public/_headers` đặt no-cache cho HTML, `sw.js`, manifest để người dùng không kẹt bản cũ.

Giai đoạn 2 — rà soát logic toàn bộ (mục tiêu: "chạy đúng thật, không chỉ hiển thị"):
- Thử tình huống và điểm thi thử: tính theo từng chương trình thay vì một tổ hợp cố định.
- Kế hoạch tuần: trước đây việc là danh sách viết sẵn giống nhau cho mọi người. Nay `engine/tao-viec.ts` sinh việc từ điểm thiếu, xu hướng thi thử, giờ tự học còn trống, xoay chủ đề theo tuần, và `viecChoTuan` thử xếp lịch thật, giảm khối lượng đến khi mọi việc có chỗ. Việc có trường `tuan`; `viecCuaTuan` giữ việc các tuần không lẫn nhau.
- Nhắc nhở: service worker `public/sw.js` + banner trong app (`tu-hoc/nhac-nho-nen.tsx`).
- "Xóa hết và làm lại" xóa mọi khóa `nvai:*`; hồ sơ mẫu dựng việc bằng bộ sinh việc thật.
- Mục tiêu: `coTheDatMucTieu` chặn mục tiêu không tính được.
- Sửa lỗi đơn vị tỷ lệ việc làm (phần trăm bị đọc thành phân số), sửa lệch làm tròn nhãn nguyện vọng.
- Sửa vòng import làm `tests/ke-hoach.test.ts` lỗi khi chạy riêng.

Giai đoạn 3 — đối chiếu slide thuyết trình (6–10/10) và bổ sung:
- Slide nói "phụ huynh và thầy cô đồng hành": thêm màn **Chia sẻ với người đồng hành** (`/ho-so/chia-se`): tóm tắt hồ sơ, mục tiêu, nguyện vọng kèm nhãn, và các câu nên trao đổi sinh từ chính dữ liệu (học phí vượt ngân sách, ở nhà nhưng chọn trường xa, danh sách thiếu chỗ an toàn...). Sao chép, gửi qua ứng dụng khác, in/lưu PDF. Không gửi gì lên máy chủ.
- Slide 9 "Chỉ số nên theo dõi": thêm 4 chỉ số (hồ sơ hoàn thiện, nguyện vọng có căn cứ, nhiệm vụ tuần, khoảng cách tới mục tiêu có đo "đã thu hẹp bao nhiêu" so với lần thi thử đầu), hiển thị ở Hồ sơ và màn chia sẻ.
- Slide 8 "người dùng kiểm soát dữ liệu": thêm tải bản sao lưu JSON và khôi phục (`src/state/sao-luu.ts`, kiểm tra tệp sai/phiên bản mới hơn/thiếu trường).
- Test mới: `tests/chia-se.test.ts`.

Giai đoạn 4 — hoàn thiện phần còn thiếu của các slice khác và rà giao diện:
- **Trắc nghiệm hướng nghiệp** (`/huong-nghiep`): 12 tình huống (chọn một trong bốn) theo mô hình Holland (RIASEC) và một câu về điều em coi trọng ở nghề; viết lại ngày 2026-10-09 vì bản 18 câu "em có thích..." quá chung chung. Kết quả là điểm 6 nhóm và nhóm ngành gợi ý (chỉ dùng nhóm có trong dữ liệu thật, test kiểm tra). Kết quả đi vào: nhận xét ở Hồ sơ, dòng "hợp sở thích" ở thẻ ngành trong Khám phá (không đổi mức phù hợp theo điểm), bản tóm tắt chia sẻ. Khi các nhóm điểm gần nhau thì nói "chưa nổi bật nhóm nào" thay vì chọn bừa.
- **Đồng hành không cần tài khoản** (`/dong-hanh`, `/loi-nhan`): hệ thống chưa có máy chủ lưu dữ liệu, nên dữ liệu đi theo phần `#` của liên kết (không gửi lên máy chủ). Em tạo liên kết (tùy chọn kèm tên) → phụ huynh/thầy cô mở xem, viết lời nhắn → họ gửi lại một liên kết → em mở và bấm lưu vào Hồ sơ (`AppState.loiNhan`, tối đa 30). Mọi dữ liệu đọc từ liên kết được kiểm tra hình dạng, cắt độ dài, chỉ hiển thị dạng chữ (`dong-hanh/goi-tin.ts`, có test cho dữ liệu xấu). Giới hạn: ai có liên kết đều xem được; không có thông báo tự động khi có lời nhắn mới.
- Sao lưu/khôi phục kiểm tra thêm `loiNhan` và `soThich`.
- Giao diện: dấu thập phân thống nhất bằng dấu phẩy qua `engine/dinh-dang.ts` (không dùng `.toFixed` trực tiếp để hiển thị); màn chờ onboarding hiện số chương trình/trường thật thay vì con số viết tay.

Giai đoạn 5 — kéo code mới của nhóm, đối chiếu đề bài Ban Tổ chức, nối đường ống dữ liệu cộng đồng (2026-10-09):
- Đã đọc `Decision_Intelligence_Challenge_Brief_TMA` (6 tiêu chí, 100 điểm). Bảng đối chiếu từng ý chấm với bằng chứng trong sản phẩm: `docs/DOI-CHIEU-TIEU-CHI.md`; hỏi đáp dự kiến: `docs/HOI-DAP-BAN-GIAM-KHAO.md`; kịch bản demo: `docs/KICH-BAN-DEMO.md`.
- **Lỗ hổng nghiêm trọng đã vá: dữ liệu tình nguyện viên không bao giờ tới học sinh.** CMS của nhóm xuất bản snapshot vào KV, app học sinh tải `/snapshots/*.json` nhưng không có hàm nào phục vụ các đường dẫn đó (SPA trả `index.html`, JSON hỏng). Thêm `functions/snapshots/[tep].ts` (đọc KV, dự phòng D1, tự kiểm mã băm, cache vĩnh viễn). Phát hiện thêm khi chạy cả vòng ở máy: tên tệp `cutoff-scores` khác khóa KV `cutoffScores` (404), hợp nhất tìm trường theo **tên ngắn** thay vì **mã trường** nên không trường thật nào khớp, hình dạng `data` mà CMS lưu khác hình dạng app đọc (thiếu `nguon`, tên ô kênh khác), điểm chuẩn CMS khóa theo mã ngành Bộ mà dữ liệu gốc không có, thông tin cộng đồng (nơi ở, đánh giá, lưu ý) không được nạp, và các màn danh sách không dùng bản hợp nhất. Đã sửa tất cả: `chuanHoaChoSnapshot`, hợp nhất theo mã trường, điểm chuẩn khóa theo **mã chương trình** (người nhập chọn ngành từ danh sách của trường), `LUA_CHON_MAU` thay tại chỗ khi có bản mới (`useBanDuLieu`).
- Chạy thử cả vòng ở máy, không cần tài khoản Cloudflare: `npm run cms:api` rồi `npm run app:local` (`scripts/chay-app-local.mjs`, dùng chung D1/KV với CMS). Đã kiểm bằng trình duyệt: nhập điểm chuẩn ở CMS, duyệt, xuất bản, học sinh thấy số mới trên cả thẻ danh sách, nhãn và trang chi tiết.
- CMS: "Nhập điểm chuẩn cả trường một lượt" (bảng ngành, một nguồn chung), form từng ngành chọn chương trình thay vì gõ mã.
- Kênh cộng đồng công khai: `/api/bao-sai` (học sinh báo số liệu sai, thay cho mailto), `/api/tinh-nguyen` + trang `/dong-gop` (đăng ký làm tình nguyện viên), migration `0005`, hộp thư trong CMS (Phê duyệt > Hộp thư) với nút "Cấp quyền cộng tác viên" tự thêm email và giao đúng trường. Giới hạn tần suất theo IP bằng KV. Test: `tests/hop-thu.test.ts` (SQLite thật).
- **Dự báo khoảng điểm chuẩn năm tới** (`engine/du-bao-diem-chuan.ts`, khối trên trang ngành, dòng "Dự kiến" ở danh sách nguyện vọng, và trong dữ liệu gửi AI tư vấn). Hệ số nở khoảng chọn bằng kiểm định bỏ-một-năm trên dữ liệu thật; phát hiện bản đầu (cộng trung vị, tách theo nhóm ngành) phủ chỉ 55% nên bỏ. Số đo mới nhất (17/10, `tests/du-bao-diem-chuan.test.ts`): phủ 91,1% (2023), 93,2% (2024), 76,6% (2025); số đo 15/10 (89/95/64) đã cũ. Test in và kiểm mức phủ mỗi lần chạy.
- **Điểm ưu tiên khu vực/đối tượng** (`engine/diem-uu-tien.ts`, khai ở Bước 2): đi vào mọi phép so điểm chuẩn và phần "còn thiếu" của mục tiêu.
- Sửa dấu thập phân còn sót ("1.3 điểm"), CI build CMS, tài liệu vận hành `docs/QUAN-TRI.md`.
- Việc cần chủ tài khoản Cloudflare (không làm thay được): tạo D1 (tài khoản từng chạm giới hạn số D1), biến môi trường; CMS đăng nhập bằng email và mật khẩu tự quản, không dùng Cloudflare Access; xem `docs/QUAN-TRI.md` mục 3.

Giai đoạn 6 — làm đúng dữ liệu, thêm lớp "Cơ hội" và chốt nộp bài (2026-10-15 đến 17):
- **Màn mới:** Bản đồ cơ hội (`/co-hoi`: số ngành ở từng nhãn theo nhóm ngành, `engine/ban-do-co-hoi.ts`), Phòng thử điểm (`/co-hoi/thu-diem`: kéo điểm từng môn xem ngành đổi nhãn, không ghi vào hồ sơ), Thẻ hành trình ở Hôm nay (bốn dòng kể chuyện từ dữ liệu của em), Tạo hồ sơ 3 bước thiết kế lại (`khoi-dau/buoc-1..3`), mục "Dữ liệu của em" ở Cài đặt (tải sao lưu, khôi phục, xóa).
- **Trang ngành:** dòng Chỉ tiêu (đọc từ đề án, có link và trang), học phí kèm nhãn nguồn; trang Về dữ liệu có khối Độ tin cậy dữ liệu đếm từ danh mục (`engine/trang-thai-du-lieu.ts` phân loại nhiều năm / một năm / phương thức khác; `do-tin-cay-du-lieu.ts`).
- **Dữ liệu:** bổ sung điểm 2025 và 2026 từ VnExpress, đối chiếu hai nguồn; phân biệt điểm sàn, điểm chuẩn, dự kiến (không đoán loại điểm từ trị số); kiểm mẫu độ chính xác; cơ chế ghi đè điểm có bằng chứng (146 mục). Báo cáo ở `docs/audits/`. Dự báo: điểm dự đoán 2027 kèm độ tin cậy từng dự báo; mô hình ML LightGBM huấn luyện lại 17/10 trên điểm đã sửa, áp dụng cho 2.580 chương trình khi mã băm danh mục khớp (`du-bao-ml.ts`); ngoài mẫu phủ 63,8%, Winkler 8,21 so với 8,19 của thống kê, nên không được nói là vượt trội.
- **AI:** bậc thang trả lời (cache, Clef, RAG cộng đồng, LLM), hậu kiểm số liệu, hạn mức theo hồ sơ/IP/toàn hệ thống; kết nối trợ lý ngoài qua MCP (18 công cụ).
- **Quy trình:** cổng kiểm tra trên bản chụp của thứ sắp commit/push (`scripts/cong-kiem-tra.mjs`, hook `.githooks`, `npm run cong:commit`/`cong:push`), mỗi việc một worktree, test đỏ có chủ ở `tests/baseline-do.json`. CI `.github/workflows/deploy.yml` tự deploy Cloudflare Pages khi push `main`.
- **Tài liệu nộp bài đã đồng bộ:** `docs/SO-LIEU-CHOT-NOP-BAI.md` (một bộ số, kèm điều không được nói), kịch bản demo 3 phút, hỏi đáp, đối chiếu tiêu chí, nội dung slide, kịch bản 7 và 10 phút. Bản `.docx` của kịch bản 10 phút chưa xuất lại.

**Quy ước giao diện (nhóm chốt 2026-10-09):** app dành cho học sinh dùng thật, giữ gọn. Giải thích dành cho ban giám khảo (giả định, kiểm định, kiến trúc, mô hình mở rộng) để ở **slide**, không nhồi vào app. Nội dung sẵn cho slide: `docs/NOI-DUNG-CHO-SLIDE.md`. Màn mới chỉ giữ một dòng giới hạn ngắn (ví dụ "không phải xác suất đậu").

## 7. Giới hạn đã biết và việc còn lại

- Điểm chuẩn là số năm trước; điểm năm nay có thể khác. Điểm 2026 là tham chiếu từ trang tổng hợp. Học phí (662, theo VnExpress) và việc làm (121) mới có cho một phần chương trình; chưa có khung chương trình học. Điểm số nguyên chưa kiểm hết; 5 trường nghi sai mã hoặc tên chưa sửa. Danh sách đầy đủ ở `docs/DU-LIEU.md` và `docs/BACKLOG.md`.
- Trắc nghiệm hướng nghiệp là công cụ gợi ý để tìm hiểu, chưa được kiểm định tâm lý; kết quả chỉ nên dùng cùng điểm số và trao đổi với người lớn.
- Chưa có tài khoản, đăng nhập hay đồng bộ nhiều thiết bị (đúng với hướng local-first của MVP); chuyển máy dùng tệp sao lưu.
- Phụ huynh/thầy cô không có tài khoản riêng, đồng hành bằng liên kết hai chiều (xem mục 6, giai đoạn 4). Muốn có tài khoản, thông báo đẩy và đồng bộ thật cần đăng nhập cho học sinh và máy chủ lưu dữ liệu của em, chưa làm (D1 đã có cho dữ liệu trường).
- Dự báo điểm chuẩn không bù được thay đổi quy chế/đề thi/chỉ tiêu (năm 2025 phủ 76,6%; cả 2.812 dự báo ở mức tin cậy thấp vì điểm mới nhất là 2026 từ nguồn thứ cấp; ML phủ ngoài mẫu 63,8%). Điểm ưu tiên: học sinh tự khai khu vực, chưa tự map từ tỉnh/huyện. Mức cộng ưu tiên cần đối chiếu quy chế mỗi năm.
- Hạ tầng thật của CMS (D1, biến môi trường) cần chủ tài khoản dựng; chạy thử đầy đủ bằng `npm run cms:api` + `npm run app:local`.
- Chưa bật AI thật cho đến khi có khóa API trên Cloudflare.
- Thông báo đẩy khi tắt app phụ thuộc trình duyệt; nhắc trong app luôn hoạt động.

## 8. Quy ước làm việc với repo

- Mỗi người giữ slice của mình; sửa file dùng chung (`src/state`, `src/engine`, `duong-dan.ts`) thì báo cả nhóm và pull `main` trước khi làm tiếp.
- Commit nhỏ, thông điệp tiếng Việt rõ nghĩa. Không commit ảnh chụp màn hình, file shard dữ liệu lớn (đã ở `.gitignore`).
- Thêm màn mới: dùng skill `them-man-hinh`; rà giao diện 390px/360px: skill `kiem-tra-ui` (trong `.claude/skills`).
- Quy tắc chữ trên giao diện và từ bị cấm: do `tests/kiem-tra-route.ts` kiểm tra.

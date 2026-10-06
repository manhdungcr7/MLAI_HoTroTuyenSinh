# CLAUDE.md — Nguyện Vọng AI (RTC TEAM, MLAI Hackathon 2026)

File này giải thích dự án và những gì đã làm, cho đồng đội vừa clone về và cho Claude Code khi mở repo.
Đọc xong file này là đủ để chạy, sửa và deploy mà không phải hỏi lại.

## 1. Sản phẩm là gì

Ứng dụng mobile web hỗ trợ học sinh THPT Việt Nam chọn ngành/trường và theo đuổi mục tiêu.
Hành trình ba bước theo slide: **Hiểu bản thân → Chọn con đường → Theo đuổi mục tiêu**.

| Tính năng trong slide | Nằm ở đâu |
|---|---|
| Hồ sơ học sinh thông minh | `src/features/khoi-dau` (nhập), `src/features/hanh-trinh/ho-so.tsx` (nhận xét tự động) |
| Khám phá ngành/trường | `src/features/kham-pha` (2.529 chương trình thật, lọc, so sánh, chi tiết có nguồn) |
| Danh mục nguyện vọng cân bằng | `src/features/nguyen-vong`, `src/features/thu-tinh-huong` |
| Mục tiêu và khoảng cách | `src/features/muc-tieu` |
| Kế hoạch học theo tuần | `src/features/ke-hoach`, `src/features/tu-hoc` |
| Hỏi tư vấn AI có căn cứ | `src/features/tu-van`, `functions/api/tu-van.ts` |
| Phụ huynh/thầy cô đồng hành | `src/features/hanh-trinh/chia-se.tsx` (bản tóm tắt chia sẻ) |
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
npm test             # toàn bộ test (xep-lich, muc-tieu, thu-tinh-huong, tu-hoc, du-lieu, tu-van, ke-hoach, chia-se, kiem-tra-route)
npm run build
```

Trước khi gộp vào `main`, cả bốn lệnh `tsc`, `kiem-tra`, `test`, `build` phải qua.

## 3. Kiến trúc

- Vite + React 19 + react-router-dom 7 (hash router) + Tailwind 4 + TypeScript.
- Mỗi tính năng là một slice trong `src/features/<slice>` với `routes.tsx` riêng. Quy tắc slice: `docs/HUONG-DAN-SLICE.md`.
- Đường dẫn chỉ khai báo ở `src/duong-dan.ts` (`MAU`, `DUONG_DAN`). Không viết tay chuỗi `"/..."` trong features; `tests/kiem-tra-route.ts` sẽ báo lỗi.
- Trạng thái toàn app: `src/state/store.tsx`, lưu ở `localStorage` khóa `nvai:v2`. Hàm dẫn xuất dùng chung: `src/state/chon.ts`.
- Engine thuần TypeScript, không React, có test: `src/engine/{phan-tich,xep-lich,tao-viec,tu-van}.ts`.
- Giao diện: chữ nhẹ, xưng "bạn/em" theo ngữ cảnh, ít in đậm, màu lấy từ token (không dùng mã màu viết tay).
- Cẩn thận vòng import: `diemHienTaiCuaTungMon` nằm ở `src/state/diem-hien-tai.ts` (store re-export) chính vì việc này.

## 4. Dữ liệu

- 2.529 chương trình thật ở `src/data/du-lieu-that.json`, chuyển sang kiểu `LuaChon` bởi `src/data/lua-chon-that.ts`.
- Các file nạp lười (lazy): điểm theo năm, đề án trường, chương trình, trang ngành-trường.
- Học phí (24 chương trình) và tỷ lệ việc làm trích từ đề án bằng script trong `scripts/`.
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
- Thay dữ liệu mẫu bằng 2.529 chương trình thật, có nguồn, năm, tổ hợp, phương thức.
- Trang "Về dữ liệu" nói rõ nguồn và giới hạn; lọc, so sánh, gợi ý danh sách nguyện vọng theo điểm và ngân sách.
- Cloudflare Pages deploy từ `main` (https://nguyenvongai.pages.dev). `public/_headers` đặt no-cache cho HTML, `sw.js`, manifest để người dùng không kẹt bản cũ.

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

## 7. Giới hạn đã biết và việc còn lại

- Điểm chuẩn là số năm trước; điểm năm nay có thể khác. Học phí và việc làm mới có cho một phần chương trình. Danh sách đầy đủ ở `docs/DU-LIEU.md` và `docs/BACKLOG.md`.
- Hồ sơ "sở thích, hoàn cảnh" mới ở mức chọn ngành quan tâm, ngân sách, nơi ở; chưa có bài trắc nghiệm hướng nghiệp.
- Chưa có tài khoản, đăng nhập hay đồng bộ nhiều thiết bị (đúng với hướng local-first của MVP); chuyển máy dùng tệp sao lưu.
- Phụ huynh/thầy cô chưa có tài khoản riêng; hiện đồng hành bằng bản tóm tắt chia sẻ.
- Chưa bật AI thật cho đến khi có khóa API trên Cloudflare.
- Thông báo đẩy khi tắt app phụ thuộc trình duyệt; nhắc trong app luôn hoạt động.

## 8. Quy ước làm việc với repo

- Mỗi người giữ slice của mình; sửa file dùng chung (`src/state`, `src/engine`, `duong-dan.ts`) thì báo cả nhóm và pull `main` trước khi làm tiếp.
- Commit nhỏ, thông điệp tiếng Việt rõ nghĩa. Không commit ảnh chụp màn hình, file shard dữ liệu lớn (đã ở `.gitignore`).
- Thêm màn mới: dùng skill `them-man-hinh`; rà giao diện 390px/360px: skill `kiem-tra-ui` (trong `.claude/skills`).
- Quy tắc chữ trên giao diện và từ bị cấm: do `tests/kiem-tra-route.ts` kiểm tra.

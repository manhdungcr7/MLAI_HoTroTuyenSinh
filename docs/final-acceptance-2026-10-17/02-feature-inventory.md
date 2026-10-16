# 02 — FEATURE INVENTORY (KIỂM KÊ TOÀN BỘ TÍNH NĂNG & 35 ROUTES)

Báo cáo này phân loại chính xác toàn bộ **35 routes** (34 routes trong `src/duong-dan.ts` + 1 route tĩnh `/thuyetrinh`) và **15 slices** trong codebase theo 4 trạng thái thực tế:
- **`PRODUCTION VERIFIED`**: Đã triển khai đầy đủ, chạy thật trên `https://nguyenvongai.pages.dev` và local.
- **`LOCAL ENGINE VERIFIED`**: Chạy hoàn toàn trên trình duyệt bằng động cơ TypeScript thuần (`src/engine/*`), không phụ thuộc mạng, lưu trạng thái qua `localStorage`.
- **`PROTOCOL VERIFIED (NO EXTERNAL CLIENT UI)`**: API/Giao thức chạy thật trên production D1/KV nhưng chưa gắn vào UI của bên thứ ba (Claude/ChatGPT thương mại).
- **`PARTIAL / EXPERIMENTAL`**: Tính năng đã chạy nhưng dữ liệu/người dùng cộng đồng đang ở giai đoạn khởi tạo.

---

## 1. Bảng kiểm kê 15 Slices & 35 Routes

| STT | Slice (`src/features/*`) | Route (`src/duong-dan.ts`) | File thực thi chính | Nơi xử lý (Local vs Backend) | Trạng thái thực tế | Giá trị cho học sinh |
| :-- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `landing-page` | `/gioi-thieu` | `src/features/landing-page/trang-gioi-thieu.tsx` | Static + Local | **PRODUCTION VERIFIED** (Locked Tag) | Trang giới thiệu tổng quan dự án (bảo toàn 100% theo tag `landing-approved-2026-10-07`). |
| 2 | `khoi-dau` | `/chao` | `src/features/khoi-dau/chao-mung.tsx` | Local (`store.tsx`) | **PRODUCTION VERIFIED** | Màn chào mừng, phân tách rõ "Bắt đầu hồ sơ của bạn" (trắng) và "Xem thử với hồ sơ mẫu". |
| 3 | `khoi-dau` | `/bat-dau` -> `/bat-dau/1` | `src/features/khoi-dau/routes.tsx` | Local redirect | **PRODUCTION VERIFIED** | Điều hướng vào bước 1 khởi tạo hồ sơ. |
| 4 | `khoi-dau` | `/bat-dau/1` | `src/features/khoi-dau/bat-dau.tsx` | Local (`store.tsx`) | **PRODUCTION VERIFIED** | Chọn khối lớp (11/12), tỉnh/thành (34 tỉnh sau sáp nhập), nhóm ngành quan tâm. |
| 5 | `khoi-dau` | `/bat-dau/2` | `src/features/khoi-dau/bat-dau.tsx` | Local + `diem-uu-tien.ts` | **PRODUCTION VERIFIED** | Nhập điểm 6 môn chính + 5 môn thêm, học bạ, ĐGNL/TSA, chứng chỉ ngoại ngữ, HSG, khu vực/đối tượng ưu tiên. |
| 6 | `khoi-dau` | `/bat-dau/3` | `src/features/khoi-dau/bat-dau.tsx` | Local + `phan-tich.ts` | **PRODUCTION VERIFIED** | Chọn ngân sách gia đình, mong muốn chỗ ở, khu vực học và xem chẩn đoán điểm nghẽn ban đầu. |
| 7 | `hanh-trinh` | `/` (Hôm nay) | `src/features/hanh-trinh/hom-nay.tsx` | Local (`chang.ts`, `chon.ts`) | **PRODUCTION VERIFIED** | Màn hình chính theo chặng (`dinhHuong`, `chuaThi`, `daCoDiem`), việc hôm nay, mục tiêu và lối tắt. |
| 8 | `hanh-trinh` | `/ho-so` | `src/features/hanh-trinh/ho-so.tsx` | Local (`store.tsx`) | **PRODUCTION VERIFIED** | Xem và chỉnh sửa hồ sơ học sinh, bảng điểm hiện tại, ưu tiên, ngân sách. |
| 9 | `hanh-trinh` | `/ho-so/cai-dat` | `src/features/hanh-trinh/cai-dat.tsx` | Local + `/api/ket-noi/*` | **PRODUCTION VERIFIED** | Xuất/nhập file sao lưu `.json`, xóa dữ liệu làm lại, bật/tắt AI, tạo mã kết nối MCP/GPT. |
| 10 | `hanh-trinh` | `/ho-so/chia-se` | `src/features/hanh-trinh/chia-se.tsx` | Local + URL Base64 / `/api/dong-hanh` | **PRODUCTION VERIFIED** | Tạo liên kết chia sẻ hồ sơ rút gọn cho phụ huynh/thầy cô cùng xem và góp ý. |
| 11 | `hanh-trinh` | `/ve-du-lieu` | `src/features/hanh-trinh/ve-du-lieu.tsx` | Local (`du-lieu-that.json`) | **PRODUCTION VERIFIED** | Minh bạch phương pháp thu thập dữ liệu, độ phủ nguồn PDF, kết quả backtest dự báo. |
| 12 | `kham-pha` | `/kham-pha` | `src/features/kham-pha/kham-pha.tsx` | Local + `/api/manifest` | **PRODUCTION VERIFIED** | Tìm kiếm, lọc và xếp hạng 3.648 chương trình đào tạo theo độ phù hợp cá nhân. |
| 13 | `kham-pha` | `/kham-pha/bo-loc` | `src/features/kham-pha/man-bo-loc.tsx` | Local (`dung-bo-loc.ts`) | **PRODUCTION VERIFIED** | Bộ lọc chi tiết theo nhóm ngành, khu vực, phương thức xét tuyển, mức học phí, nhãn nguyện vọng. |
| 14 | `kham-pha` | `/kham-pha/:id` | `src/features/kham-pha/chi-tiet.tsx` | Local + `xac-suat-trung-tuyen.ts` | **PRODUCTION VERIFIED** | Chi tiết chương trình: điểm chuẩn các năm, ước lượng cơ hội tham khảo, dự báo khoảng điểm, học phí, link PDF đề án. |
| 15 | `kham-pha` | `/so-sanh` | `src/features/kham-pha/so-sanh.tsx` | Local (`phu-hop.ts`) | **PRODUCTION VERIFIED** | Bảng đặt cạnh nhau 2 chương trình đào tạo để so sánh điểm, học phí, khu vực, cơ hội việc làm. |
| 16 | `truong` | `/truong/:ma` | `src/features/truong/man-truong.tsx` | Local + `/api/ghi-chu` | **PRODUCTION VERIFIED** | Trang thông tin tổng hợp của từng trường đại học (118 trường), danh sách ngành, đề án PDF và ghi chú cộng đồng. |
| 17 | `nguyen-vong` | `/nguyen-vong` | `src/features/nguyen-vong/danh-sach.tsx` | Local + `toi-uu-nguyen-vong.ts` | **PRODUCTION VERIFIED** | Quản lý danh sách nguyện vọng, kéo thả/bấm nút đổi thứ tự, phát hiện nghịch đảo thứ tự và gợi ý danh mục 3 tầng. |
| 18 | `nguyen-vong` | `/nguyen-vong/an-toan` | `src/features/nguyen-vong/an-toan.tsx` | Local (`tinh-toan.ts`) | **PRODUCTION VERIFIED** | Phân tích sâu cơ cấu 4 tầng (Thử sức · Vừa sức · An toàn · Dự phòng), cảnh báo thiếu chốt chặn hoặc vượt ngân sách. |
| 19 | `muc-tieu` | `/ke-hoach/muc-tieu` | `src/features/muc-tieu/muc-tieu.tsx` | Local (`muc-tieu/tinh-toan.ts`) | **PRODUCTION VERIFIED** | Theo dõi mục tiêu số 1, khoảng cách điểm từng môn, xu hướng điểm thi thử qua các lần. |
| 20 | `muc-tieu` | `/ke-hoach/muc-tieu/mon-keo-diem` | `src/features/muc-tieu/mon-keo-diem.tsx` | Local (`phan-tich.ts`) | **PRODUCTION VERIFIED** | Chẩn đoán môn kéo điểm (điểm nghẽn) và giải thích vì sao tăng môn yếu hiệu quả hơn môn đã cao. |
| 21 | `thu-tinh-huong` | `/thu-tinh-huong` | `src/features/thu-tinh-huong/thu-tinh-huong.tsx` | Local (`tinh-toan.ts`) | **PRODUCTION VERIFIED** | Thanh trượt thử tăng/giảm điểm từng môn để xem số ngành được mở khóa. |
| 22 | `thu-tinh-huong` | `/thu-tinh-huong/ket-qua` | `src/features/thu-tinh-huong/ket-qua-tinh-huong.tsx` | Local (`tinh-toan.ts`) | **PRODUCTION VERIFIED** | Danh sách chi tiết các nguyện vọng đổi nhãn (từ Thử sức sang Vừa sức/An toàn) khi điểm thay đổi. |
| 23 | `thu-tinh-huong` | `/diem-thi-thu` | `src/features/thu-tinh-huong/diem-thi-thu.tsx` | Local (`store.tsx`) | **PRODUCTION VERIFIED** | Nhập và lưu lịch sử các đợt điểm thi thử theo ngày. |
| 24 | `thu-tinh-huong` | `/diem-thi-thu/ket-qua` | `src/features/thu-tinh-huong/ket-qua-diem-thi.tsx` | Local (`tinh-toan.ts`) | **PRODUCTION VERIFIED** | So sánh đợt thi thử mới nhất với đợt trước và cập nhật tiến độ tới mục tiêu. |
| 25 | `ke-hoach` | `/ke-hoach` -> `/ke-hoach/tuan` | `src/features/ke-hoach/routes.tsx` | Local redirect | **PRODUCTION VERIFIED** | Điều hướng vào màn kế hoạch tuần. |
| 26 | `ke-hoach` | `/ke-hoach/tuan` | `src/features/ke-hoach/ke-hoach-tuan.tsx` | Local (`xep-lich.ts`, `tao-viec.ts`, `toi-uu-lich-hoc.ts`) | **PRODUCTION VERIFIED** | 3 chế độ: Việc cần làm · Theo ngày · Chiến lược & Lộ trình. Tự động sinh việc và xếp vào giờ trống, xuất `.ics` / Google Calendar. |
| 27 | `ke-hoach` | `/ke-hoach/tuan/lich-hoc` | `src/features/ke-hoach/lich-hoc.tsx` | Local (`store.tsx`) | **PRODUCTION VERIFIED** | Khai báo lịch học cố định trên trường và học thêm để bộ xếp lịch tránh trùng giờ. |
| 28 | `ke-hoach` | `/ke-hoach/tuan/viec/:id` | `src/features/ke-hoach/chi-tiet-viec.tsx` | Local (`store.tsx`) | **PRODUCTION VERIFIED** | Xem chi tiết buổi tự học, đồng hồ bấm giờ Pomodoro/tự học, đánh dấu hoàn thành hoặc dời buổi. |
| 29 | `tu-hoc` | `/ke-hoach/tien-do` | `src/features/tu-hoc/tien-do.tsx` | Local (`tinh-tien-do.ts`) | **PRODUCTION VERIFIED** | Thống kê tỷ lệ hoàn thành việc trong tuần, chuỗi ngày học liên tiếp và phân bổ phút học theo môn. |
| 30 | `tu-hoc` | `/ke-hoach/cai-dat-tu-hoc` | `src/features/tu-hoc/cai-dat-tu-hoc.tsx` | Local (`store.tsx`) | **PRODUCTION VERIFIED** | Cấu hình khung giờ tự học buổi tối, độ dài mỗi buổi (30/45/60 phút) và ngày nghỉ trong tuần. |
| 31 | `tu-hoc` | `/ke-hoach/nhac-nho` | `src/features/tu-hoc/nhac-nho-trang.tsx` | Local (Web Notifications) | **PRODUCTION VERIFIED** | Thiết lập lời nhắc giờ tự học trên trình duyệt. |
| 32 | `tu-van` | `/tu-van` | `src/features/tu-van/tu-van.tsx` | Hybrid: Local `traLoiTuDong` + Backend `/api/tu-van` | **PRODUCTION VERIFIED** | Hỏi đáp tuyển sinh có căn cứ: ưu tiên trả lời tức thì bằng quy tắc + dữ liệu trên máy (0 token), gọi `/api/tu-van` (RAG + OpenRouter + hậu kiểm chống bịa số) khi cần diễn giải sâu. |
| 33 | `huong-nghiep` | `/huong-nghiep` | `src/features/huong-nghiep/trac-nghiem.tsx` | Local (`cau-hoi.ts`) | **PRODUCTION VERIFIED** (Unvalidated Psychometrics) | 10 câu hỏi gợi ý nhóm ngành phù hợp cho học sinh chưa rõ sở thích (ghi rõ là gợi ý tham khảo, không phải trắc nghiệm tâm lý lâm sàng). |
| 34 | `dong-hanh` | `/dong-hanh` | `src/features/dong-hanh/dong-hanh.tsx` | Local URL decode + `/api/dong-hanh` | **PRODUCTION VERIFIED** | Màn hình dành cho phụ huynh/thầy cô mở liên kết chia sẻ của học sinh và gửi lời nhắn động viên/góp ý. |
| 35 | `dong-gop` | `/dong-gop` | `src/features/dong-gop/dong-gop.tsx` | Backend `/api/tinh-nguyen` | **PARTIAL / EXPERIMENTAL** | Cổng đăng ký tình nguyện viên đóng góp dữ liệu trường đại học (API hoạt động, chưa có cộng đồng tình nguyện viên thật). |
| 36 | `ket-noi` | `/ket-noi/uy-quyen` | `src/features/ket-noi/uy-quyen.tsx` | Backend `/oauth/*` + `/api/ket-noi/*` | **PROTOCOL VERIFIED** | Màn hình cấp quyền OAuth 2.1 PKCE cho phép ứng dụng AI ngoài đọc bản chụp hồ sơ theo từng scope. |
| 37 | Static Slide | `/thuyetrinh` | `slides/thuyet-trinh.html` -> `dist/thuyetrinh/index.html` | Static HTML/CSS/JS | **PRODUCTION VERIFIED** | Bộ 14 slide thuyết trình 10 phút kèm đồng hồ bấm giờ và ghi chú người nói (Speaker Notes). |

---

## 2. Phân định rõ: Tính năng Local-First vs Backend Production

### A. Chạy hoàn toàn trên thiết bị học sinh (Local-First · 0ms Network Latency · Offline-Capable)
- Toàn bộ thuật toán tính điểm 73 tổ hợp (`src/features/kham-pha/to-hop.ts`), tính điểm ưu tiên giảm dần (`src/engine/diem-uu-tien.ts`), gắn nhãn 4 tầng & phát hiện điểm nghẽn (`src/engine/phan-tich.ts`).
- Mô hình ước lượng cơ hội tham khảo & khoảng tin cậy (`src/engine/xac-suat-trung-tuyen.ts`), phát hiện nghịch đảo thứ tự & gợi ý danh mục nguyện vọng (`src/engine/toi-uu-nguyen-vong.ts`).
- Thuật toán phân bổ giờ học theo lợi suất cận biên (`src/engine/toi-uu-lich-hoc.ts`), sinh việc tuần (`src/engine/tao-viec.ts`), xếp lịch tránh giờ bận (`src/engine/xep-lich.ts`) và xuất lịch `.ics` (`src/engine/lich-ics.ts`).
- Tầng trả lời tự động có căn cứ của Trợ lý AI (`traLoiTuDong` trong `src/features/tu-van/lay-du-lieu.ts`).

### B. Chạy trên Cloudflare Pages Functions + D1 + KV + Vectorize (`https://nguyenvongai.pages.dev`)
- `/api/v1/health`, `/api/v1/ready`, `/api/v1/universities`, `/api/manifest`: Kiểm tra sức khỏe hệ thống, danh mục trường và đồng bộ snapshot dữ liệu mới từ CMS.
- `/api/tu-van`: Hỏi đáp AI bậc thang (Rate limit `RATE_KV` -> Hạn mức 50 lượt/người/ngày & 500 lượt toàn cục trên D1 -> `CACHE_KV` -> Clef -> Vectorize RAG -> OpenRouter `anthropic/claude-haiku-5.5` -> Bộ lọc hậu kiểm chống bịa số `kiemChungSoLieu`).
- `/oauth/register`, `/oauth/authorize`, `/oauth/token`, `/oauth/revoke`, `/.well-known/oauth-authorization-server`: Máy chủ OAuth 2.1 chuẩn PKCE S256 có xoay vòng refresh token và phát hiện tái sử dụng token.
- `/mcp` & `/mcp/[ma]`, `/api/gpt/[ma]/openapi.json`: Máy chủ MCP (`2025-03-26`) gồm 8 công cụ chuẩn + 2 alias đọc hồ sơ, nguyện vọng, gợi ý ngành, điểm chuẩn, kế hoạch tuần và gửi đề xuất thêm nguyện vọng chờ học sinh xác nhận.
- `/api/bao-sai`, `/api/tinh-nguyen`, `/api/dong-hanh`: Tiếp nhận báo số liệu sai, đăng ký tình nguyện viên và lời nhắn đồng hành của phụ huynh vào D1.

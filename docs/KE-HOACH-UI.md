# Kế hoạch dựng UI trước (mobile-first, thuần Việt)

## Nguyên tắc
- UI trước, logic sau. Mọi màn chạy bằng **dữ liệu mẫu** lấy từ `src/state` (đã có). Chưa viết thêm thuật toán/backend.
- Chuẩn thiết kế: bộ ref ngày 5/10 (10 ảnh = 20 màn, đã copy vào `docs/ui-ref/01..10.png`). Bộ cũ chỉ lấy ý cho phần Lịch/tự học.
- Rộng 390px là chuẩn; nút cao tối thiểu 48px; chữ tối thiểu 13px; thanh điều hướng dưới 5 tab.
- Từ ngữ thuần Việt: "Hôm nay", "Thử tình huống", "Điểm hiện tại", "Việc nên làm tiếp"… Không dùng từ kỹ thuật (dashboard, CTA, AI-score, rủi ro…).
- Không bịa số: dữ liệu trường/ngành ghi rõ "dữ liệu mẫu, chưa kiểm chứng"; bỏ câu "10.000+ học sinh" trong ref.

## Đã có (nền)
Vite + React + TS + Tailwind 4, token màu, bộ thành phần (Nut, The, Nhan, ChonNhanh, HopTruot…), khung 5 tab, hồ sơ mẫu "Minh Anh", màn: Chào mừng, Tạo hồ sơ 3 bước, Hôm nay, Hồ sơ, Khám phá, Bộ lọc.
Đã lỡ viết thêm: `engine/xep-lich.ts` (+test), `engine/phan-tich.ts`, `state/store.tsx`. Giữ nguyên, **không mở rộng** cho tới khi UI xong.

## Thứ tự làm (theo luồng học sinh đi, mỗi bước chạy được ngay)
1. **Chạy được khung**: `main.tsx`, `App.tsx` (HashRouter, route), build + typecheck sạch. Đây là việc đầu vì chưa có gì mở được.
2. **Khởi đầu** (ref 01–04): kiểm tra thật trên 390px.
3. **Hôm nay + Hồ sơ** (ref 05–06).
4. **Khám phá** (ref 07–10): danh sách, bộ lọc, chi tiết, so sánh.
5. **Nguyện vọng** (ref 11–14): danh sách kéo thả/nút lên-xuống, phân tích, thử tình huống, so sánh tình huống.
6. **Mục tiêu + Kế hoạch tuần** (ref 15–18).
7. **Lịch tuần + Tiến độ** (ref 19–20) và phần riêng của Hưng: cài đặt tự học, nhắc nhở, tâm trạng, câu nói động lực, nhập lịch học.
8. **Rà soát**: 390×844 và 360×740 bằng Playwright `setViewportSize`; `agent-browser` kiểm tràn chữ, nút; 1 ảnh chụp cuối so với ref.

## Phân công (đề xuất, xếp theo sức build)
| Người | Thư mục | Phụ trách |
|---|---|---|
| Hưng | `features/lich`, `engine/xep-lich.ts` | Lịch, xếp lịch tự học, nhắc nhở, tâm trạng, câu động lực, tiến độ |
| Dũng | `features/kham-pha`, `features/nguyen-vong`, `engine/phan-tich.ts` | Khám phá, so sánh, danh sách nguyện vọng, thử tình huống, dữ liệu thật |
| Tuấn | `features/khoi-dau`, `features/hanh-trinh`, `state/` | Hồ sơ, Hôm nay, lưu trữ, đăng nhập/backend sau này |
| Kiệt | `features/muc-tieu`, `features/ke-hoach` | Mục tiêu, khoảng cách theo môn, việc tuần |

## Cần bạn chốt
- Đúng bộ ref 5/10 là chuẩn, và 2 bộ cũ chỉ để tham khảo ý?
- Tab thứ 4 gộp 4 mục con (Mục tiêu · Việc tuần · Lịch · Tiến độ) bằng thanh chuyển — đồng ý không?

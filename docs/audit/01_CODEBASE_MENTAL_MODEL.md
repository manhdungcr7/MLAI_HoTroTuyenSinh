# 🧠 BẢN ĐỒ KIẾN TRÚC TÂM TRÍ (CODEBASE MENTAL MODEL) — NGUYỆN VỌNG AI

## 1. Bản chất hệ thống
**Nguyện Vọng AI** là một hệ sinh thái hỗ trợ ra quyết định giáo dục và đồng hành ôn thi THPT theo thời gian thực (Local-First SPA trên Cloudflare Pages).
Sản phẩm giải quyết bài toán: Không chỉ dừng lại ở câu trả lời *"Em có thể đậu trường nào?"*, mà trả lời liên tục 4 câu hỏi:
1. **Mình đang ở đâu?** (Năng lực, điểm số 11 môn, sở thích nghề nghiệp Holland, ngân sách gia đình, khu vực).
2. **Mình muốn đi tới đâu?** (Khám phá 2.529 ngành có minh chứng đề án PDF, so sánh đa chiều, lập danh mục nguyện vọng 4 nhãn cân bằng).
3. **Còn cách mục tiêu bao xa?** (Phân tích khoảng cách điểm - Gap Analysis, xác định môn nghẽn kéo điểm nhanh nhất).
4. **Hôm nay cần làm gì?** (Tự động sinh nhiệm vụ tuần, xếp lịch tự học tối ưu tránh lịch cố định, ghi nhận điểm thi thử và tự động điều chỉnh kế hoạch).

---

## 2. Vòng lặp Trải nghiệm Cốt lõi (Closed-Loop Experience)

```
       ┌────────────────────────────────────────────────────────┐
       │                                                        │
       ▼                                                        │
[1. Hiểu Người Học]                                              │
- Lớp 10-12, Điểm 11 môn (Học bạ/Thi thử/ĐGNL)                   │
- Sở thích Holland (RIASEC), Ngân sách, Địa lý                  │
       │                                                        │
       ▼                                                        │
[2. Khám Phá & So Sánh Đa Chiều]                                │
- 2.529 ngành thật của 26 ĐH trọng điểm                         │
- Đối chiếu điểm chuẩn 3 năm, Học phí, Việc làm                │
       │                                                        │
       ▼                                                        │
[3. Danh Mục Nguyện Vọng Cân Bằng]                              │
- 4 Nhãn: Thử sức · Vừa sức · An toàn · Dự phòng                 │
- Audit an toàn tài chính, an toàn điểm số                      │
       │                                                        │
       ▼                                                        │
[4. Chọn Mục Tiêu & Phân Tích Điểm Nghẽn]                        │
- Gap Analysis: Thiếu bao nhiêu điểm từng môn                    │
- ROI Môn kéo điểm: Tránh trần năng lực                         │
       │                                                        │
       ▼                                                        │
[5. Kế Hoạch Tuần & Xếp Lịch Tự Học]                             │
- Sinh bài tập tuần theo môn kéo điểm                           │
- Thuật toán xếp lịch tự học tránh lịch cứng                    │
       │                                                        │
       ▼                                                        │
[6. Thực Hiện & Ghi Nhận Điểm Thi Thử]                           │
- Hoàn thành nhiệm vụ, bấm giờ tự học                           │
- Cập nhật điểm thi thử mới ─────────────────────────────────────┘
  (Hệ thống tự động tính lại khoảng cách & điều chỉnh lịch)
```

---

## 3. Cấu trúc Thư mục & Phân định Trách nhiệm (Decoupled Slices)

| Thư mục | Vai trò | Trọng tâm nghiệp vụ |
|---|---|---|
| `src/state/` | State Management | `store.tsx` (Reactive AppState), `chon.ts` (Selectors trích xuất), `types.ts` (Domain Entities), `mau.ts` (Seed/Blank Profiles) |
| `src/engine/` | Pure TS Algorithms | `xep-lich.ts` (Xếp thời khóa biểu), `phan-tich.ts` (Scoring phi tuyến), `tao-viec.ts` (Sinh việc học), `dinh-dang.ts` (Format số/ngày) |
| `src/data/` | Dữ liệu kiểm chứng | 2.529 ngành (`lua-chon-that.ts`), `de-an-truong.json`, `nguon-nam.json`, `hoc-phi.json`, `viec-lam.json`, `chuong-trinh.json` |
| `src/features/khoi-dau/` | Onboarding | Form khởi đầu 60s, nhập điểm nhanh 11 môn, chọn ngành/trường mơ ước |
| `src/features/hanh-trinh/` | Dashboard & Profile | Trang Hôm nay (`/`), đếm ngược kỳ thi, hồ sơ học sinh, chia sẻ phụ huynh |
| `src/features/kham-pha/` | Discovery & Compare | Tra cứu 2.529 ngành, bộ lọc học phí/khu vực/điểm, so sánh song song 2 ngành |
| `src/features/nguyen-vong/`| Wishlist & Risk Audit | 4 nhãn cơ cấu, audit rủi ro tài chính/điểm, 1-click tự động xếp tối ưu |
| `src/features/muc-tieu/` | Target & Gap Analysis | Phân tích điểm còn thiếu từng môn, đề xuất môn kéo điểm |
| `src/features/thu-tinh-huong/`| What-If Simulation | Giả lập tăng/giảm điểm, ghi nhận điểm thi thử theo ngày |
| `src/features/ke-hoach/` | Weekly Planning | Kế hoạch tuần, xếp lịch tự học thông minh, quản lý tiết cố định |
| `src/features/tu-hoc/` | Daily Tracking | Bấm giờ làm bài, theo dõi tiến độ, chuỗi ngày học, thông báo nền |
| `src/features/dong-hanh/` | Companion Sharing | Mã hóa link không lưu server để phụ huynh/thầy cô xem & nhắn nhủ |
| `src/features/huong-nghiep/`| Holland Vocational | 18 câu trắc nghiệm RIASEC -> Map thẳng sang 24 nhóm ngành đào tạo |
| `src/features/tu-van/` | Grounded AI Advisor | Giao thức tư vấn AI có căn cứ số liệu minh bạch |

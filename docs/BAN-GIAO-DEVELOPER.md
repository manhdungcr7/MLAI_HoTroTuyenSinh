# 🧭 HƯỚNG DẪN BÀN GIAO & LƯU Ý CHO LẬP TRÌNH VIÊN MỚI (DEVELOPER ONBOARDING)

Tài liệu này dành cho lập trình viên mới tiếp nhận dự án **Nguyện Vọng AI**. Đọc file này trong 5 phút đầu tiên để tránh các bẫy thường gặp và nắm bắt luồng code nhanh nhất.

---

## ⚡ 1. CHECKLIST 5 PHÚT BẮT ĐẦU

1. **Cài đặt & Khởi động dev server**:
   ```bash
   npm install
   npm run dev       # Chạy dev server tại cổng http://localhost:3030
   ```
2. **Kiểm tra môi trường (Cổng kiểm tra bắt buộc)**:
   ```bash
   npx tsc --noEmit  # Kiểm tra lỗi kiểu dữ liệu TypeScript
   npm run kiem-tra  # Kiểm tra đường dẫn, mã màu, từ ngữ cấm
   npm test          # Chạy toàn bộ 19 bộ test logic & CMS
   ```
3. **Thư viện Giao diện & Bảng màu Design System**:
   - Truy cập: `http://localhost:3030/#/thiet-ke` (chỉ hiển thị trong môi trường dev).
   - Xem toàn bộ Tokens (`text-xanh`, `bg-luc-nhat`, `border-vien`), Gradients (`gd-*`), Nút bấm (`Nut`), Thẻ (`The`), Huy hiệu trường (`HuyHieuTruong`).

---

## 🏛️ 2. KIẾN TRÚC CODEBASE (4 TRỤ CỘT CỐT LÕI)

```
                       ┌────────────────────────────────────────────────────────┐
                       │                     NGUYỆN VỌNG AI                     │
                       │           (4 Câu hỏi Cốt lõi của Học sinh THPT)         │
                       └────────────────────────────────────────────────────────┘
                                                    │
         ┌─────────────────────┬────────────────────┴────────────────────┬────────────────────┐
         ▼                     ▼                                         ▼                    ▼
   [ĐANG Ở ĐÂU?]        [MUỐN TỚI ĐÂU?]                           [CÁCH BAO XA?]        [HÔM NAY LÀM GÌ?]
  ┌──────────────┐     ┌──────────────┐                          ┌──────────────┐      ┌────────────────┐
  │  `khoi-dau`  │ ──► │  `kham-pha`  │ ───────────────────────► │  `muc-tieu`  │ ───► │   `ke-hoach`   │
  │  `ho-so`     │     │ `nguyen-vong`│                          │`thu-tinh-huong`     │    `tu-hoc`    │
  └──────────────┘     └──────────────┘                          └──────────────┘      └────────────────┘
```

1. **Feature-Driven Architecture**:
   - Mỗi tính năng nằm trong một thư mục độc lập dưới `src/features/<ten-slice>/`.
   - Mỗi slice có file `routes.tsx` (định tuyến nội bộ) và `tinh-toan.ts` (thuật toán tính toán thuần TypeScript).
2. **Pure TypeScript Engine (Tách biệt UI và Logic)**:
   - Toàn bộ thuật toán xếp lịch, tính điểm, phân tích nguyện vọng nằm ở `src/engine/` hoặc `features/<slice>/tinh-toan.ts`.
   - **Tuyệt đối KHÔNG import React hook vào các hàm tính toán lõi**.
3. **Thuần Việt & Kebab-case**:
   - Toàn bộ tên file, thư mục, hàm, biến đều đặt theo tiếng Việt không dấu (ví dụ: `hoSo`, `nguyenVong`, `monKeoDiem`, `xepLich`, `diemChuan`).
4. **Light Mode Solid & Zero Glassmorphism**:
   - Giao diện sáng màu, nền đặc, chữ đậm tương phản cao. Không dùng hiệu ứng làm mờ nền (`backdrop-filter`).

---

## ⚠️ 3. BỐN BẪY CHÍ MẠNG CẦN LƯU Ý (WATCH-OUTS)

### 🔴 Bẫy 1: Sửa Dữ liệu Tuyển sinh ở đâu?
* **Hiện trạng**: Repo có 2 tầng dữ liệu:
  1. *Core Dataset tĩnh*: Bundled sẵn tại `src/data/chuong-trinh.*.json`.
  2. *CMS Snapshot Overrides*: Nằm tại `public/snapshots/` hoặc qua cơ chế hợp nhất `src/engine/hop-nhat-snapshot.ts`.
* **Quy tắc**: **Không sửa tay đè vào file JSON core**. Dữ liệu tuyển sinh cập nhật mới phải đi qua quy trình CMS Snapshot (`DRAFT -> SUBMITTED -> APPROVED -> PUBLISHED`).

### 🔴 Bẫy 2: Tính điểm 2 tầng (Chương trình cũ vs GDPT 2018)
* **Cấu trúc**: `src/state/types.ts` chia điểm làm:
  - `diem`: 6 môn cơ bản (Toán, Lý, Hóa, Sinh, Văn, Anh).
  - `diemThem`: 5 môn mới theo GDPT 2018 (Sử, Địa, GDKT&PL, Tin học, Công nghệ).
* **Quy tắc**: Khi viết hàm tính điểm tổ hợp, luôn dùng hàm `tongChoLuaChon` hoặc đọc cả `diem` lẫn `diemThem` để không làm thiếu môn của các khối C00, D14, X26...

### 🔴 Bẫy 3: Vùng Cấm Landing Page (`LANDING-LOCK`)
* **Khu vực được bảo vệ nghiêm ngặt**:
  - `src/features/landing-page/`
  - `src/styles/landing.css`
  - `public/landing/`
* **Quy tắc**: Đã được phê duyệt theo tag Git `landing-approved-2026-10-07`. **Tuyệt đối không sửa, đổi tên, format lại hoặc thay đổi CSS của Landing Page**.

### 🔴 Bẫy 4: Quản lý State Client-Side (`useApp`)
* **Hiện trạng**: Toàn bộ dữ liệu người dùng đang chạy Offline-First qua React Context + Reducer và lưu `localStorage` (`src/state/store.tsx`, `src/state/luu-cuc-bo.ts`).
* **Quy tắc**: Không có thư viện quản lý state cồng kềnh (Redux/MobX). Khi cần đọc/ghi dữ liệu, dùng hook `useApp()` và các hàm selector sạch trong `src/state/chon.ts`.

---

## 📐 4. QUY CHUẨN THIẾT KẾ UI CHO MOBILE (360px – 390px)

1. **Chữ trên nút bấm (Button Text)**:
   - Luôn ngắn gọn từ **2 đến 3 từ** (tối đa 4 từ): *Xem chi tiết, Thêm nguyện vọng, Tự xếp lại, Sửa hồ sơ, Chép liên kết*.
   - Luôn có `whitespace-nowrap` hoặc chia layout `grid grid-cols-2 gap-2` để chống rớt chữ đơn chiếc (widow word) xuống dòng thứ 2.
2. **Kích thước vùng bấm**:
   - Mọi nút, chip chọn và input phải có chiều cao tối thiểu $\ge 44\text{px}$ (chuẩn chạm ngón tay trên mobile).
3. **Từ ngữ cấm trong giao diện**:
   - Cấm dùng từ ngoại lai/công nghệ khó hiểu: *dashboard, kịch bản, giả lập, tác động, rủi ro, chống trượt, tối ưu, CTA, widget, onboarding, profile*.
   - Bốn nhãn nguyện vọng cố định: **Thử sức · Vừa sức · An toàn · Dự phòng**.

---

## 🗺️ 5. BẢN ĐỒ PHÂN CHIA SLICE & NGƯỜI PHỤ TRÁCH

| Slice | Thư mục | Nội dung chính |
|---|---|---|
| **Khởi đầu** | `src/features/khoi-dau/` | Onboarding 3 bước, nhập điểm, sở thích Holland, ngân sách. |
| **Hôm nay + Hồ sơ** | `src/features/hanh-trinh/` | Dashboard hành động trong ngày, hồ sơ cá nhân, chia sẻ cho phụ huynh. |
| **Khám phá** | `src/features/kham-pha/` | Tra cứu trường/ngành, bộ lọc đa chiều, so sánh 2-3 trường, nguồn đề án. |
| **Nguyện vọng** | `src/features/nguyen-vong/` | Xếp thứ tự NV, phân bổ 4 giỏ chiến lược, kéo thả reorder. |
| **Mục tiêu** | `src/features/muc-tieu/` | Phân rã khoảng cách điểm (Delta), tính toán "Môn kéo điểm" đòn bẩy. |
| **Thử tình huống** | `src/features/thu-tinh-huong/` | What-If Simulator: trượt đổi điểm, thay đổi ngân sách, điểm thi thử. |
| **Kế hoạch tuần** | `src/features/ke-hoach/` | Tự động xếp lịch tự học, tránh lịch cố định, bảo vệ giờ ăn/nghỉ ngơi. |
| **Tiến độ & Tự học** | `src/features/tu-hoc/` | Theo dõi tiến độ học thực tế, cảnh báo lệch kế hoạch, nhắc nhở. |
| **Hệ thống CMS** | `cms/` | Quản trị và kiểm duyệt dữ liệu tuyển sinh, snapshot provenance. |

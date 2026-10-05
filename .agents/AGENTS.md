# AGENTS — Luật code Nguyện Vọng AI (cho người và agent)

Web mobile-first, thuần Việt, cho học sinh THPT 15–18 tuổi. 4 người làm song song, nên **đồng nhất quan trọng hơn sáng tạo**. Đọc file này trước khi code. Chi tiết bản đồ route và ma trận liên kết: `docs/HUONG-DAN-SLICE.md`.

## 1. Lệnh
- `npm run dev` (cổng 3030) · `npm run build` · `npx tsc --noEmit`
- `npm test` = test xếp lịch + cổng kiểm tra · `npm run kiem-tra` = cổng đồng nhất (đường dẫn viết tay, mã màu viết tay, từ cấm, route chưa đăng ký)
- **Xong việc phải chạy `tsc`, `kiem-tra`, `test` đều xanh trước khi commit.**
- Xem toàn bộ thành phần và màu: `http://localhost:3030/#/thiet-ke` (chỉ khi dev).

## 2. Cấu trúc và ai sở hữu gì
```
src/duong-dan.ts        NGUỒN SỰ THẬT của đường dẫn (MAU, DUONG_DAN, CAC_TAB)
src/routes-type.ts      kiểu RoutesCuaSlice + trang() tải lười
src/App.tsx             chỉ gom routes của các slice
src/components/ui/      thành phần dùng chung (nút, thẻ, ô nhập, gradient, thông báo…)
src/components/layout/  khung.tsx: KhungCoThanhDuoi, DauTrangChinh, DauTrangCoQuayLai, ThanhPhuKeHoach
src/state/              types.ts (kiểu), store.tsx (useApp, localStorage), chon.ts (hàm đọc), luu-cuc-bo.ts
src/engine/             thuật toán thuần TS, KHÔNG import React
src/data/               dữ liệu mẫu (nhãn "chưa kiểm chứng")
src/features/<slice>/   mỗi slice một thư mục + routes.tsx
```
| Slice | Thư mục | Người |
|---|---|---|
| Khởi đầu | `khoi-dau` | Tuấn |
| Hôm nay + Hồ sơ | `hanh-trinh` | Tuấn |
| Khám phá | `kham-pha` | Dũng |
| Nguyện vọng | `nguyen-vong` | Dũng |
| Mục tiêu | `muc-tieu` | Kiệt |
| Thử tình huống + Điểm thi thử | `thu-tinh-huong` | Kiệt |
| Kế hoạch tuần (+ xếp lịch) | `ke-hoach` | Hưng |
| Tiến độ + tự học + nhắc nhở | `tu-hoc` | Hưng |

**Chỉ sửa trong thư mục slice của mình.** File dùng chung (`components/`, `state/`, `engine/`, `data/`, `styles/`, `duong-dan.ts`, `App.tsx`) đổi bằng PR riêng, nhỏ, có báo cả nhóm, vì ai cũng dựa vào nó.

## 3. Quy tắc sắt (cổng `kiem-tra` bắt phần lớn)
1. **Đường dẫn**: luôn `DUONG_DAN.xxx()`; khai báo route bằng `MAU.xxx` trong `features/<slice>/routes.tsx`. Không viết tay `"/..."`.
2. **Mọi nút phải đi tới đúng nơi.** Không `onClick={() => {}}`, không link chết.
3. **Theme**: không viết `#xxxxxx`, không gradient tay. Dùng token Tailwind (`text-xanh`, `bg-luc-nhat`, `text-cam-chu`, `border-vien`, `rounded-the`, `shadow-the`) và `gd-*` / `nen-*`. Tông: `xanh luc cam tim do muc`.
4. **Minh họa bằng gradient** (`NenHero`, `BieuTuongTron`, `HuyHieuTruong`, `AnhBia`). Không vẽ nhân vật, không dùng logo trường.
5. **Khung có sẵn**: trang gốc của tab dùng `DauTrangChinh`; trang con dùng `DauTrangCoQuayLai`; tab Kế hoạch thêm `ThanhPhuKeHoach`; nội dung bọc `NoiDung`. Không tự vẽ đầu trang/thanh dưới.
6. **Dữ liệu**: đọc/ghi qua `useApp()` và `@/state/chon`. Nhớ riêng cho slice: `useLuuCucBo("<slice>-<khoa>", macDinh)`. Không thêm trường vào `store.tsx` tuỳ tiện.
7. **Logic tách khỏi giao diện**: tính toán đặt trong `tinh-toan.ts` (thuần TS) của slice, có test khi quan trọng (`tests/<slice>.test.ts`). Component chỉ ghép.
8. **Không bịa số.** Số trường/điểm/học phí là dữ liệu MẪU và phải có nhãn chưa kiểm chứng. Thiếu dữ liệu thì hiện "Chưa có dữ liệu"/"Chưa đủ điểm", không hiện 0. Không viết số người dùng, lời chứng thực, tỉ lệ đậu giả. "Điểm phù hợp" /100 KHÔNG phải xác suất đậu.
9. **Thuần Việt**: gọi học sinh là "em", câu ngắn, nói việc cần làm. Cấm trong chữ hiển thị: dashboard, kịch bản, giả lập, tác động, rủi ro, chống trượt, tối ưu, CTA, widget, onboarding, profile. Bốn nhãn nguyện vọng cố định: **Thử sức · Vừa sức · An toàn · Dự phòng**.
10. **Mobile**: thiết kế 390px, kiểm cả 360px. Nút/ô bấm ≥ 48px (tối thiểu 44), chữ ≥ 13px, không cuộn ngang, không chữ bị cắt. Kéo thả luôn kèm nút bấm.
11. **Đủ trạng thái**: có dữ liệu · trống (nói vì sao và làm gì tiếp) · đang tải · lỗi/nhập sai (báo bằng lời dễ hiểu). Chạy được với hồ sơ mẫu lẫn hồ sơ trống.
12. **Hành động phá huỷ** (xóa, ghi đè) phải xác nhận bằng `HopTruot`, không `window.confirm`; nếu được thì cho hoàn tác.

## 4. Bẫy đã gặp (đừng lặp lại)
- CSS reset phải nằm trong `@layer base`, nếu không nó đè mọi class màu chữ (chữ nút ra xanh đậm thay vì trắng).
- `Truong` bọc `<label>` làm bấm chữ tiêu đề kích hoạt nút đầu của nhóm chip: dùng `fieldset/legend` cho nhóm lựa chọn.
- Gọi `xepLai` ngay sau `datTamTrang` đọc tâm trạng cũ: đợi state mới (useEffect) rồi mới xếp.
- Tên trường dài bị cắt 4 ký tự trong `HuyHieuTruong` (HCMUS/HCMUT cùng ra "HCMU"): dùng ký hiệu riêng khi cần.
- Mọi so sánh điểm hiện giả định tổ hợp A01; đừng ngầm định A01 ở chỗ mới, đọc `s.mucTieu.maToHop`.
- Windows/Git Bash: dùng `/` trong đường dẫn lệnh; không dán chuỗi có `\n` qua heredoc Python khi sửa file TS (hỏng escape), dùng công cụ Edit.

## 5. Git
- Không push thẳng `main`. Nhánh `feat/<slice>-<việc>`, `fix/…`. Commit nhỏ, Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`).
- Mỗi PR chỉ chạm thư mục slice của mình (trừ PR dùng chung). Mô tả PR: Mục tiêu, Thay đổi, Kiểm thử (lệnh đã chạy).
- Không commit `node_modules`, `dist`, ảnh chụp tạm.

## 6. Thêm màn hình mới
Dùng quy trình ở `.claude/skills/them-man-hinh/SKILL.md`. Tóm tắt: thêm `MAU`/`DUONG_DAN` → đăng ký trong `routes.tsx` của slice → viết trang bằng khung + thành phần có sẵn → nối mọi nút → `kiem-tra` → đo 390/360px.

## 7. Phần còn lại sau UI (backend)
`useApp()` hiện lưu localStorage. Khi có máy chủ (gợi ý Cloudflare Workers + D1), chỉ thay ruột `state/store.tsx`; giao diện không đổi. Dữ liệu trường thật có nguồn thay `data/lua-chon-mau.ts`, giữ kiểu `LuaChon`.

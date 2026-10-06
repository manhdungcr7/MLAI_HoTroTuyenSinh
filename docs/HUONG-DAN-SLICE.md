# Hướng dẫn chung cho mọi slice (ĐỌC KỸ TRƯỚC KHI CODE)

Nguyện Vọng AI: web giúp học sinh THPT chọn ngành/trường và theo đuổi mục tiêu. **Mobile-first, thuần Việt, thân thiện với học sinh 15–18 tuổi.** 4 người làm song song, mỗi người một vài slice, nên mọi thứ phải đồng nhất.

## 1. Quy tắc sắt
1. **Chỉ sửa trong thư mục slice của mình** `src/features/<slice>/` (tạo thêm file thoải mái ở đó). **Cấm sửa** file ngoài thư mục đó, gồm `src/components/**`, `src/state/**`, `src/duong-dan.ts`, `src/App.tsx`, `src/styles/**`, `src/engine/**`, `src/data/**`. Ngoại lệ ghi ở bảng sở hữu bên dưới. Cần thứ gì ở file chung (thành phần mới, trường dữ liệu, hàm) thì **ghi vào báo cáo cuối**, đừng tự sửa; trong lúc chờ, làm bản dùng riêng ngay trong thư mục slice của mình.
2. **Mọi đường dẫn dùng `DUONG_DAN.xxx()`** từ `@/duong-dan`. Không viết tay `"/..."`. Route của slice khai báo trong `features/<slice>/routes.tsx` bằng `MAU.xxx` (đã có sẵn trang tạm, bạn thay bằng trang thật, giữ nguyên `path`).
3. **Mọi nút phải đi tới đúng nơi.** Không có nút chết, không `onClick={() => {}}`. Nếu nơi đến thuộc slice khác, vẫn dùng `DUONG_DAN` (trang tạm của họ đã tồn tại).
4. **Theme duy nhất.** Không viết mã màu `#xxxxxx`, không viết gradient tay. Chỉ dùng class token của Tailwind (`text-xanh`, `bg-luc-nhat`, `text-cam-chu`, `border-vien`, `text-chu-phu`, `rounded-the`, `shadow-the`…) và `gd-*` / `nen-*` của theme. Tông màu: `xanh`, `luc`, `cam`, `tim`, `do`, `muc`. Xem toàn bộ ở **`/thiet-ke`** (mở `http://localhost:3030/#/thiet-ke`).
5. **Minh họa bằng gradient**, không vẽ nhân vật/logo: `NenHero`, `BieuTuongTron`, `HuyHieuTruong`, `AnhBia` (`components/ui/hinh-nen.tsx`).
6. **Dùng khung có sẵn** (`components/layout/khung.tsx`): trang gốc của tab dùng `DauTrangChinh`; trang con dùng `DauTrangCoQuayLai`; trang thuộc tab Kế hoạch dùng thêm `ThanhPhuKeHoach`. Nội dung bọc trong `NoiDung`. Không tự vẽ đầu trang hay thanh dưới.
7. **Thành phần có sẵn, ưu tiên dùng** (đọc code trước khi viết cái mới): `Nut`, `The`, `Nhan`, `HangBam`, `ChonNhanh`, `Truong`, `OInput`, `OChon`, `OTich`, `CongTac`, `ThanhChuyen`, `ThanhTienDo`, `VongTienDo`, `SoLon`, `TieuDeMuc`, `TrangThaiTrong`, `KhungDangTai`, `KhungLoi`, `HopTruot`, `DongThongBao`, `TheLuaChon`, `DaiNgay`, `TieuDeTuan`, `DuongXuHuong`, `ThanhCoCau`, `NhanNguyenVongTag`. Thành phần riêng của slice đặt trong thư mục slice.
8. **Dữ liệu qua `useApp()`** (`@/state/store`) và các hàm đọc ở `@/state/chon`. Kiểu dữ liệu ở `@/state/types`. Thuật toán thuần ở `@/engine/*` (đọc, gọi, không sửa). Cần nhớ thêm thứ gì riêng: `useLuuCucBo("<ten-slice>-<khoa>", macDinh)` ở `@/state/luu-cuc-bo`, không sửa `store.tsx`.
9. **Không bịa số.** Danh mục trong `data/lua-chon-mau.ts` nay là dữ liệu thật (xem `docs/DU-LIEU.md`): điểm chuẩn các năm trước kèm nguồn, nhưng học phí và việc làm nhiều ngành chưa có. Nơi nào hiện số phải ghi rõ là điểm chuẩn các năm trước; thiếu thì hiện "Chưa có dữ liệu" (dùng `coHocPhi()`), không điền thay. Thiếu dữ liệu thì hiện "chưa có dữ liệu" thay vì tự điền. Không viết lời chứng thực, số người dùng, tỉ lệ đậu giả. Điểm "phù hợp" là điểm gợi ý trên 100, KHÔNG phải xác suất đậu.
10. **Thuần Việt, dễ hiểu.** Cấm: dashboard, kịch bản, giả lập, tác động, rủi ro, chống trượt, tối ưu, CTA, widget, onboarding, profile (script `npm run kiem-tra` bắt các từ này trong chữ hiển thị). Gọi học sinh là "em". Câu ngắn, nói việc cần làm. Dùng: "Hôm nay", "Thử tình huống", "Nên làm trước", "Mức chắc chắn", "Danh sách có an toàn không?". Bốn nhãn nguyện vọng cố định: **Thử sức · Vừa sức · An toàn · Dự phòng**.
11. **Chuẩn mobile**: thiết kế cho rộng 390px (kiểm cả 360px). Nút/ô bấm cao ≥ 48px (tối thiểu 44px), chữ ≥ 13px, không cuộn ngang, không chữ bị cắt hay nút bị xuống dòng xấu. Hai nút cạnh nhau thì chữ nút tối đa 2–3 chữ. Thanh dưới cao 64px nên nội dung cuối trang đã có chỗ trống sẵn (`pb-24` ở khung). Kéo thả luôn kèm nút bấm thay thế.
12. **Đủ trạng thái**: có dữ liệu · chưa có dữ liệu (`TrangThaiTrong` nói rõ vì sao trống và làm gì tiếp) · đang tải khi cần (`KhungDangTai`) · lỗi/giá trị không hợp lệ (nhập sai thì báo bằng lời dễ hiểu). Màn phải chạy được cả với **hồ sơ mẫu** và với **hồ sơ trống**.
13. **Truy cập được**: nút có nhãn chữ hoặc `aria-label`, tab/radio có `role`+`aria-*` đúng, tương phản đủ.

## 2. Chạy và kiểm tra
- Dev server đang chạy ở `http://localhost:3030` (HMR). Đừng chạy thêm. Nếu chưa chạy: `npm run dev` ở thư mục gốc.
- Nạp hồ sơ mẫu: mở `http://localhost:3030/#/chao` rồi bấm "Xem thử bằng hồ sơ mẫu". Hồ sơ trống: `localStorage.clear()` rồi tải lại.
- **Dùng `agent-browser` với phiên riêng** (nhiều agent chạy cùng lúc): `export AGENT_BROWSER_SESSION=<ten-slice>` trước lệnh đầu tiên; `agent-browser set viewport 390 844`; đóng bằng `agent-browser close` khi xong. Đọc kiểm tra bằng `agent-browser eval` (kiểm `document.documentElement.scrollWidth > clientWidth`, kích thước nút, chữ bị cắt) thay vì chụp ảnh liên tục. **Tối đa một ảnh chụp cuối** để đối chiếu với ref.
- Trước khi báo xong: `npx tsc --noEmit` (lỗi nằm trong thư mục slice khác thì bỏ qua, họ đang làm dở) và `npm run kiem-tra` (đường dẫn viết tay, mã màu, từ cấm, route chưa đăng ký) phải sạch ở phần của bạn. **Không `git commit`**, người điều phối sẽ gộp.

## 3. Bản đồ route (nguồn: `src/duong-dan.ts`)
Tab dưới: Hôm nay `/` · Khám phá `/kham-pha` · Nguyện vọng `/nguyen-vong` · Kế hoạch `/ke-hoach` · Hồ sơ `/ho-so`.
Không thanh tab: `/chao`, `/bat-dau/1|2|3`.
Con của Khám phá: `/kham-pha/bo-loc`, `/kham-pha/:id`, `/so-sanh`.
Con của Nguyện vọng: `/nguyen-vong/an-toan`, `/thu-tinh-huong`, `/thu-tinh-huong/ket-qua`, `/diem-thi-thu`, `/diem-thi-thu/ket-qua`.
Kế hoạch (3 mục chuyển bằng `ThanhPhuKeHoach`: Mục tiêu · Kế hoạch tuần · Tiến độ): `/ke-hoach/muc-tieu`, `/ke-hoach/muc-tieu/mon-keo-diem`, `/ke-hoach/tuan` (Việc cần làm | Lịch, `?xem=lich`), `/ke-hoach/viec/:id`, `/ke-hoach/tien-do`, `/ke-hoach/cai-dat/lich-hoc`, `/ke-hoach/cai-dat/tu-hoc`, `/ke-hoach/cai-dat/nhac-nho`. Chuông ở đầu trang gốc của tab → `nhacNho`.
Hồ sơ: `/ho-so`, `/ho-so/cai-dat`.

**Ma trận liên kết bắt buộc** (nút nào phải dẫn đi đâu):
- Chào → `/bat-dau/1` → 2 → 3 → `/ho-so` (hoàn tất hồ sơ) · "Xem thử bằng hồ sơ mẫu" → `/`.
- Hôm nay → thẻ mục tiêu: `mucTieu` · "Còn X ngày": `mucTieu` · việc nên làm tiếp: `viec(id)` · nhịp học: `tienDo` · gợi ý môn: `monKeoDiem` · chưa có mục tiêu: `khamPha`.
- Khám phá → thẻ: `chiTiet(id)` · Bộ lọc: `boLoc` (Áp dụng quay về `khamPha`).
- Chi tiết → "Thêm vào nguyện vọng": thêm rồi hỏi tiếp tới `nguyenVong` · "So sánh": `soSanh(a,b)` (chọn thêm một trường nếu mới có một).
- So sánh → "Chọn mục tiêu": đặt mục tiêu rồi tới `mucTieu` · "Lưu so sánh": lưu và báo đã lưu · bấm trường: `chiTiet(id)`.
- Nguyện vọng → "Thêm nguyện vọng": `khamPha` · "Danh sách có an toàn không?": `nguyenVongAnToan` · "Nếu tăng điểm?": `thuTinhHuong` · "Nhập điểm thi thử": `diemThiThu` · bấm một nguyện vọng: `chiTiet(id)`.
- An toàn → 3 gợi ý: "Thêm trường an toàn" → `khamPha` · "Giảm bớt thử sức" → `nguyenVong` · "Gợi ý thêm trường" → `khamPha`.
- Thử tình huống → "Xem thay đổi": `thuTinhHuongKetQua` · bấm một trường: `chiTiet(id)` · "Lưu tình huống" lưu rồi ở lại.
- Điểm thi thử → "Cập nhật kết quả": ghi điểm rồi `diemThiThuKetQua` → "Cập nhật nguyện vọng": `nguyenVong` · "Xem lại kế hoạch học": `tuan` · "So sánh lại trường": `soSanh`.
- Mục tiêu → "Xem môn nên ưu tiên": `monKeoDiem` · "Xem kế hoạch cải thiện": `tuan` · "Xem lại mục tiêu khác": `khamPha` · thẻ trường: `chiTiet(id)`.
- Môn kéo điểm → "Lập kế hoạch học": `tuan`.
- Kế hoạch tuần → một việc: `viec(id)` · chuyển Lịch: `tuan("lich")` · bánh răng: `caiDatTuHoc` · "Nhập lịch học": `caiDatLichHoc`.
- Chi tiết việc → Hoàn thành / Dời lịch / Bỏ qua rồi quay lại `tuan`.
- Tiến độ → cảnh báo có nút: tới `tuan("lich")` / `caiDatTuHoc` / `viec(id)` tùy cảnh báo · "Xem đề xuất điều chỉnh" → `tuan("lich")` · Cài đặt nhắc nhở: `nhacNho`.

## 4. Ref giao diện (ảnh 1 trang = 2 màn điện thoại + giải thích bên phải)
Thư mục `docs/ui-ref/`: `bo-A` (mới nhất, sạch), `bo-B` (nhiều ý hay: nhập điểm có tổ hợp tự tính, gợi ý hành động, môn kéo điểm, thi thử), `bo-C` (Lịch, Tiến độ). Số `01..10` là số trang trong bộ. **Tự mở từng ảnh bằng Read, đọc cả hai điện thoại lẫn cột chữ bên phải (yêu cầu triển khai), rồi lập danh sách MỌI phần tử của màn** (tiêu đề, thẻ, nhãn, số, nút, trạng thái) trước khi viết code.
Ref chỉ là hướng dẫn bố cục và nội dung: **không chép ảnh nhân vật/logo** (thay bằng gradient), **không chép số liệu bịa** (dân số "10.000+ học sinh", tên người thật…), và **đổi từ khó hiểu sang từ thuần Việt** (xem mục 10 ở trên). Khi ref xung đột nhau, làm theo bản chốt ở giao việc của bạn.

| Trang trong bộ | A | B | C |
|---|---|---|---|
| Chào mừng + thông tin cơ bản | 01 | 01 | 01 |
| Học tập/điểm + mục tiêu/ngân sách | 02 | 02 | 02 |
| Tổng quan/Hôm nay + Hồ sơ tóm tắt | 03 | 03 | 03 |
| Khám phá + Bộ lọc | 04 | 04 | 04 |
| Chi tiết lựa chọn + So sánh | 05 | 05 | 05 |
| Danh sách nguyện vọng + Phân tích/chống trượt | 06 | 06 | 06 |
| Giả lập điểm (nếu tăng điểm) + Kết quả | 07 | 07 | 07 |
| Mục tiêu chính + Khoảng cách theo môn | 08 | 08 | 08 |
| Kế hoạch tuần + Chi tiết việc | 09 | 09 | 09 |
| Lịch tuần + Tiến độ (A, C) · Nhập điểm thi thử + kết quả (B) | 10 | 10 | 10 |

## 5. Bảng sở hữu và ngoại lệ
| Slice | Thư mục | Được sửa thêm |
|---|---|---|
| S1 Khởi đầu | `features/khoi-dau` | — |
| S2 Hôm nay + Hồ sơ | `features/hanh-trinh` | — (giữ nguyên `tu-hoc/widgets.tsx` là của S8) |
| S3 Khám phá | `features/kham-pha` | `data/lua-chon-mau.ts` (thêm trường mẫu, giữ kiểu `LuaChon`) |
| S4 Nguyện vọng | `features/nguyen-vong` | — |
| S5 Mục tiêu | `features/muc-tieu` | — |
| S6 Thử tình huống + Điểm thi thử | `features/thu-tinh-huong` | — |
| S7 Kế hoạch tuần | `features/ke-hoach` | `engine/xep-lich.ts`, `data/lich-mau.ts` (giữ nguyên chữ ký hàm đang có; `npm test` phải qua) |
| S8 Tiến độ + tự học | `features/tu-hoc` | giữ nguyên tên export của `widgets.tsx` |

Người của nhóm: Tuấn (S1, S2), Dũng (S3, S4), Kiệt (S5, S6), Hưng (S7, S8). Code của bạn sẽ do người đó tiếp tục phát triển lên thành bản có máy chủ, nên **giữ code sạch, đặt tên tiếng Việt không dấu như file hiện có, tách hàm tính toán thuần (không React) khỏi giao diện, chú thích ngắn khi có lý do không hiển nhiên**.

## 6. Báo cáo cuối (ngắn, đúng 4 mục)
1. Các route/màn đã làm xong, mỗi màn một dòng. 2. File đã tạo/sửa. 3. Kết quả kiểm tra (typecheck, kiem-tra, đã đo gì ở 390px). 4. Điều cần đổi ở file dùng chung hoặc phần chưa làm được, kèm lý do.

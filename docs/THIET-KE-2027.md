# Thiết kế 2027: nền dùng chung

Xem thử: chạy `npm run dev`, mở `/#/thiet-ke` (chỉ dev). Mockup đích (ảnh, không commit): `D:
v-artifactsmockup-2027`; hỏi người giữ nếu cần bản sao.
Nhập: `import { ... } from "@/components/ui/thiet-ke"`. (Không `export *` vào `ui/index.ts` vì trùng tên `ThanhTienDo` cũ ở `hien-thi.tsx`.)

Luật chung: màu chỉ qua token Tailwind và class `gd-*`/`the-*` dưới đây. Không hex, không `linear-gradient` trong TSX. Nút >= 44px, chữ >= 13px, không kính mờ. Mọi nhãn màu đều kèm icon + chữ.

## Component

| Component | API (một dòng) |
|---|---|
| `VongDiem` | `value: number\|null, max=30, nhanGiua?, nhanDuoi?, tong?: xanh\|luc\|tim\|cam\|do, size=124, dinhDang?, aria?` vòng + đếm số khi vào màn; `null` = vòng nét đứt "—" |
| `PillTrangThai` | `tong?: TongPill, icon?, children` nền nhạt chữ đậm |
| `ChipLoc` / `HangChipLoc` | `chon?, onClick, icon?, dem?` / `nhan` (hàng cuộn ngang snap) |
| `ONhom` | `icon, ten, soNganh: number\|null, tong?: TongNhom, onClick?` ô nhóm ngành; `THU_TU_TONG_NHOM` để xoay 6 tông |
| `HuyHieuTruong` | `ten, tone?: ToneTen, kichThuoc=44` vuông gradient (giữ API cũ; `hinh-nen.tsx` re-export) |
| `TheNen` | `tong?: xanh\|luc\|cam\|tim\|do, as?, className` thẻ trắng bo 20px bóng mềm; `tong` tô nhẹ |
| `TabPhan` | `cacTab:{gia,nhan,icon?}[], gia, onChange, nhan` segmented, chip active trượt, phím mũi tên |
| `ThanhTienDo` | `phanTram: number\|null, tong?, nhanNoi?, nhan?` nhãn nổi "Đạt 71%", chạy từ 0 |
| `TieuDeMan` | `tieuDe, phuDe?, phai?, onChuong?, chamChuong?` đầu trang tab; `DauTrangChinh` trong `khung.tsx` đã dùng nó |
| `HangKeoTha` | `muc, khoa, ten, onDoiCho(tu,den), veMuc(m,i,dieuKhien)` kéo-thả; `dieuKhien` = Lên/nắm/Xuống (luôn có, đặt ở chỗ tuỳ ý), phím mũi tên trên nút nắm, có vùng đọc cho trình đọc màn hình |
| `ToastNho` | `mo, noiDung, hoanTac?, dong, thoiGian=5000` có nút "Hoàn tác" |
| `NenTrangTroi` | đặt một lần đầu màn: khung nhận nền gradient xanh lam nhạt sang lavender |
| `HienDan` | bọc danh sách, 10 phần tử đầu hiện dần so le |
| hooks | `useSoChay(dich, ms, chay)`, `useHienKhiVaoMan()` trả `[ref, daHien]` (một lần), `giamChuyenDong()` |

Ví dụ:
```tsx
<NenTrangTroi />
<TieuDeMan tieuDe="Khám phá" phuDe="Tìm ngành hợp với điểm của em" onChuong={...} />
<TheNen tong="xanh"><VongDiem value={tong} nhanGiua="/30 điểm" tong="luc" /></TheNen>
<HangKeoTha muc={ds} khoa={(l) => l.id} ten={(l) => l.ten} onDoiCho={doi}
  veMuc={(l, i, dk) => <TheNen className="flex gap-3">...{dk}</TheNen>} />
```

Bottom nav: tab đang mở có chip nền (`nav-chip-dang`), `aria-current="page"`; padding đáy trang đã chừa chỗ cho nút trợ lý AI (thu nhỏ 44px, nằm trên nav, ẩn ở `/bat-dau`, `/diem-thi-thu`, các màn cài đặt).

## Class trong `index.css`

- Nền: `nen-trang-troi` (hoặc `<NenTrangTroi/>`), `the-mem`, `o-mem`, `nav-noi`, `the-nen-nhe-{xanh,luc,cam,tim,do}`.
- Huy hiệu (chữ trắng): `gd-huy-hieu-{xanh,luc,cam,tim,do,muc}`.
- Nút/chip/hero: `gd-nut-chinh`, `gd-chip-chon`, `gd-hero-diem`, `gd-menta`.
- Thanh: `gd-thanh-{xanh,luc,cam,tim,do}`. Ô nhóm: `gd-nhom-{cam,xanh,tim,luc,ngoc,san-ho}`.
- Chuyển động (token `--tg-nhanh .16s`, `--tg-vua .32s`, `--tg-cham .7s`, `--ease-ra`): `vao-len`, `hien-dan` + `.da-hien` (so le bằng `--i`), `nhip-nhe` (dùng tối đa 1 chỗ mỗi màn), `shimmer`, `nay-nhe` (lún khi nhấn), `toast-vao`, `tg-thanh`, `chip-truot`. Chỉ transform/opacity (riêng nét vòng điểm dùng stroke-dashoffset). Tắt hết khi `prefers-reduced-motion` (CSS và JS).

## Màu-nghĩa (một bảng duy nhất: `thiet-ke/mau-nghia.ts`)

| Nhãn nguyện vọng `MAU_NHAN_NV` | Tông | Icon |
|---|---|---|
| An toàn | lục | ShieldCheck |
| Vừa sức | lam | Target |
| Thử sức | tím | Flame |
| Dự phòng | cam | Shield |

`THU_TU_NHAN_NV` = An toàn, Vừa sức, Thử sức, Dự phòng. `TONE_NHAN` trong `co-cau.tsx` đã khớp bảng này.

| Vị trí điểm so với khoảng dự báo `MAU_VI_TRI` | Chữ | Tông |
|---|---|---|
| caoHonCa | Trên khoảng | ngọc |
| tren | Trên mức giữa | lục |
| trongKhoang | Trong khoảng | lam |
| duoi | Hơi thấp | cam |
| thapHonCa | Còn thấp xa | san hô (không dùng đỏ gắt) |

Còn có: `MAU_TRONG` (chưa có dữ liệu, trung tính), `mauTheoTong(tong)` cho lớp nen/chu/dam/thanh/huyHieu. Chữ trên nền nhạt luôn dùng token `*-chu` (>= 4,5:1).

## Quy tắc trung thực khi bám mockup

Số trong ảnh mockup chỉ là minh hoạ. Số thật phải tính từ dữ liệu; thiếu thì hiện trạng thái trống ("—", vòng nét đứt, "Chưa có dữ liệu").

KHÔNG sao chép: "Tỷ lệ trúng tuyển ~85%", vòng "85% Phù hợp", "cơ hội trúng tuyển cao", "top 20% thí sinh", "Cao hơn 2,8x", "Dự đoán khả năng đạt mục tiêu", "Rủi ro cao". Cổng `npm run kiem-tra` chặn từ "rủi ro". Chưa có xác suất đã hiệu chỉnh nên dùng: nhãn định tính (bảng trên) + khoảng dự báo + chênh điểm.

`VongDiem` chỉ dùng cho cái ĐO ĐƯỢC: điểm/30, % hồ sơ hoàn thiện, % tiến độ tuần, số nhóm nguyện vọng đã đủ. Không dùng cho "xác suất" hay "độ phù hợp".

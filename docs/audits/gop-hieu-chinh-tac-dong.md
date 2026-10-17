# Tác động sau khi gộp bản sửa điểm chuẩn (X1 + X2 + X3)

Đo thật bằng `scripts/do-tac-dong-hieu-chinh.ts` (so bản `hieu-chinh-diem.json` ở HEAD với bản sau gộp; điểm mẫu tổ hợp 24,0; `nhanNguyenVong`, `phanLoaiDuLieu`).

- Bản sửa sau gộp: 146 mục (năm) của 70 chương trình; trong đó 8 mục gỡ năm (diem null).
- (a) Chương trình đổi `diemMin` hoặc `namDiem` so với trước gộp: 17. Phần lớn do X3 (GHA, GSA); X2 (ĐH Đà Lạt) chủ yếu sửa các năm cũ, chỉ một số ngành đổi điểm năm mới nhất.
- (b) Chương trình đổi nhãn với điểm 24,0: 6.
- (c) Chương trình đổi trạng thái có từ 2 năm điểm THPT: 0.

## Ví dụ đổi nhãn

- `gha-58f2f056` GHA Kỹ thuật ô tô: điểm 24.04 -> 23.66 (2025); nhãn Thử sức -> Vừa sức
- `gha-cdc36af0` GHA Quản lý đô thị và công trình: điểm 18.84 -> 22.62 (2025); nhãn Dự phòng -> Vừa sức
- `gha-340ad0ef` GHA Quản trị dịch vụ du lịch và lữ hành: điểm 23.25 -> 24.02 (2025); nhãn Vừa sức -> Thử sức
- `gsa-94cffacc` GSA Kỹ thuật ô tô: điểm 24.17 -> 23.47 (2023); nhãn Thử sức -> Vừa sức
- `gsa-c04596b5` GSA Tài chính - Ngân hàng: điểm 24.1 -> 23.1 (2023); nhãn Thử sức -> Vừa sức
- `tdl-bce13cec` TDL Sư phạm Tin học: điểm 20 -> 23.8 (2024); nhãn Dự phòng -> Vừa sức

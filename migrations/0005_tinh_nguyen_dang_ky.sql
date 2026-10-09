-- Migration 0005: Đăng ký làm tình nguyện viên cập nhật dữ liệu trường (do sinh viên, giáo viên, cán bộ tuyển sinh gửi từ app học sinh).
-- Quản trị viên xem ở CMS (Hệ thống > Hộp thư), liên hệ rồi cấp quyền cộng tác viên và giao trường.
CREATE TABLE IF NOT EXISTS tinh_nguyen_dang_ky (
  id         TEXT PRIMARY KEY,
  ho_ten     TEXT NOT NULL,
  vai_tro    TEXT NOT NULL CHECK (vai_tro IN ('sinh_vien', 'giao_vien', 'can_bo_tuyen_sinh', 'khac')),
  ma_truong  TEXT NOT NULL,
  lien_he    TEXT NOT NULL,
  ghi_chu    TEXT,
  trang_thai TEXT NOT NULL DEFAULT 'moi' CHECK (trang_thai IN ('moi', 'da_lien_he', 'da_cap_quyen', 'tu_choi')),
  tao_luc    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tinh_nguyen_trang_thai ON tinh_nguyen_dang_ky (trang_thai, tao_luc);

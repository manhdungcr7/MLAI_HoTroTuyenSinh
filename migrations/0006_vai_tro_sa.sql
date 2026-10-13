-- Migration 0006: thêm vai trò 'sa' (siêu quản trị) cho bảng quan_tri.
-- SQLite không sửa được CHECK tại chỗ nên dựng lại bảng và chép nguyên dữ liệu. Không bảng nào khóa ngoại tới quan_tri
-- (phan_cong, nhat_ky, khoa_api chỉ lưu email dạng chữ) nên không cần đổi bảng khác. Chạy lại nhiều lần vẫn an toàn.
DROP TABLE IF EXISTS quan_tri_moi;
CREATE TABLE quan_tri_moi (
  email    TEXT PRIMARY KEY,
  vai_tro  TEXT NOT NULL CHECK (vai_tro IN ('sa', 'qtv', 'ctv')),
  tao_luc  TEXT NOT NULL
);
INSERT INTO quan_tri_moi (email, vai_tro, tao_luc) SELECT email, vai_tro, tao_luc FROM quan_tri;
DROP TABLE quan_tri;
ALTER TABLE quan_tri_moi RENAME TO quan_tri;

-- Siêu quản trị đầu tiên được tạo bằng scripts/tao-sa.ts (xem docs/QUAN-TRI.md), không nâng vai bằng tay.

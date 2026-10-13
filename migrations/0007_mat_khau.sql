-- Migration 0007: đăng nhập email + mật khẩu tự quản (thay Cloudflare Access).
-- mat_khau: 'sha256$<muối>$<băm>'; NULL = chưa đặt (người đó chưa đăng nhập được cho tới khi sa/qtv đặt lại).
-- phai_doi_mat_khau = 1: mật khẩu tạm, bị chặn mọi API cho tới khi đổi. wrangler d1 chỉ áp mỗi migration một lần.
ALTER TABLE quan_tri ADD COLUMN mat_khau TEXT;
ALTER TABLE quan_tri ADD COLUMN phai_doi_mat_khau INTEGER NOT NULL DEFAULT 0;
ALTER TABLE quan_tri ADD COLUMN mat_khau_luc TEXT;

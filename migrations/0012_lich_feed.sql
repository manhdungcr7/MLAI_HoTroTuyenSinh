-- Lịch iCalendar riêng tư bằng URL bí mật, không dùng OAuth.
-- Chỉ lưu SHA-256 của hai khóa và các sự kiện lịch đã làm sạch.
CREATE TABLE IF NOT EXISTS lich_feed (
  ma_bam       TEXT PRIMARY KEY,
  quan_ly_bam  TEXT NOT NULL UNIQUE,
  su_kien      TEXT NOT NULL,
  cap_nhat     INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_lich_feed_cap_nhat ON lich_feed (cap_nhat);

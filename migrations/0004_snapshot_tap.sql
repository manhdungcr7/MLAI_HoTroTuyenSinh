-- Migration 0004: lưu nội dung từng tệp snapshot (bất biến) trong D1 để đồng bộ lại KV khi KV lỗi và để phục vụ rollback.
-- Mỗi lần xuất bản ghi 6 dòng (schools, tuition, scholarships, admissions, announcements, cutoffScores) cùng giao dịch với manifest.

CREATE TABLE IF NOT EXISTS snapshot_tap (
  data_version  TEXT NOT NULL,
  ten           TEXT NOT NULL CHECK (ten IN ('schools', 'tuition', 'scholarships', 'admissions', 'announcements', 'cutoffScores', 'community')),
  duong_dan     TEXT NOT NULL,           -- vd: /snapshots/schools.2026.10.07.01.9e6aab9c.json (khớp manifest.datasets[ten].url)
  hash_sha256   TEXT NOT NULL,
  kich_thuoc    INTEGER NOT NULL,
  so_ban_ghi    INTEGER NOT NULL,
  noi_dung      TEXT NOT NULL CHECK (json_valid(noi_dung)),
  PRIMARY KEY (data_version, ten)
);

CREATE INDEX IF NOT EXISTS idx_snapshot_tap_duong_dan ON snapshot_tap (duong_dan);

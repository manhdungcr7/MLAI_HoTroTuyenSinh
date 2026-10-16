-- Migration 0009: Kết nối Claude/ChatGPT. Chỉ lưu SHA-256 của mã ghép nối (ma_bam), không bao giờ lưu mã thô.
-- ket_noi_ai: bản chụp hồ sơ đã làm sạch (JSON) và thời hạn 30 ngày. ket_noi_de_xuat: đề xuất chờ xác nhận trong app (máy chủ không tự đổi dữ liệu).
CREATE TABLE IF NOT EXISTS ket_noi_ai (
  ma_bam      TEXT PRIMARY KEY,
  ban_chup    TEXT NOT NULL,
  cap_nhat    TEXT,
  tao_luc     INTEGER NOT NULL,
  het_han     INTEGER NOT NULL,
  so_truy_cap INTEGER NOT NULL DEFAULT 0,
  lan_cuoi    INTEGER
);
CREATE TABLE IF NOT EXISTS ket_noi_de_xuat (
  id          TEXT PRIMARY KEY,
  ma_bam      TEXT NOT NULL,
  loai        TEXT NOT NULL,
  tom_tat     TEXT NOT NULL,
  du_lieu     TEXT NOT NULL,
  trang_thai  TEXT NOT NULL DEFAULT 'cho' CHECK (trang_thai IN ('cho', 'xac-nhan', 'tu-choi')),
  tao_luc     INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ket_noi_de_xuat_ma ON ket_noi_de_xuat (ma_bam, trang_thai);
CREATE INDEX IF NOT EXISTS idx_ket_noi_ai_het_han ON ket_noi_ai (het_han);

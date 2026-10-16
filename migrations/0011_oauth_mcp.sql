-- Migration 0011: OAuth 2.1 cho MCP (PKCE, làm mới có xoay vòng, thu hồi).
-- Chỉ lưu SHA-256 của mã xác nhận và token (cột *_bam), không bao giờ lưu giá trị thô.
-- Mọi bản ghi gắn với một kết nối (ket_noi_bam = ma_bam của ket_noi_ai). Xóa kết nối thì xóa hết các bản ghi này.
-- Additive: không đổi bảng cũ, chạy được trên production đang có dữ liệu.
CREATE TABLE IF NOT EXISTS oauth_client (
  client_id     TEXT PRIMARY KEY,
  ten           TEXT NOT NULL,
  redirect_uris TEXT NOT NULL,
  tao_luc       INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS oauth_ma_xac_nhan (
  ma_bam        TEXT PRIMARY KEY,
  ket_noi_bam   TEXT NOT NULL,
  client_id     TEXT NOT NULL,
  redirect_uri  TEXT NOT NULL,
  thach_thuc    TEXT NOT NULL,
  pham_vi       TEXT NOT NULL,
  het_han       INTEGER NOT NULL,
  da_dung       INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS oauth_token (
  token_bam     TEXT PRIMARY KEY,
  loai          TEXT NOT NULL CHECK (loai IN ('access', 'refresh')),
  ket_noi_bam   TEXT NOT NULL,
  client_id     TEXT NOT NULL,
  ho            TEXT NOT NULL,
  pham_vi       TEXT NOT NULL,
  het_han       INTEGER NOT NULL,
  thu_hoi       INTEGER NOT NULL DEFAULT 0,
  tao_luc       INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_oauth_token_ket_noi ON oauth_token (ket_noi_bam);
CREATE INDEX IF NOT EXISTS idx_oauth_token_ho ON oauth_token (ho);
CREATE INDEX IF NOT EXISTS idx_oauth_ma_ket_noi ON oauth_ma_xac_nhan (ket_noi_bam);
CREATE INDEX IF NOT EXISTS idx_oauth_ma_het_han ON oauth_ma_xac_nhan (het_han);

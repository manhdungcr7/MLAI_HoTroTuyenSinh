-- Migration 0002: Hệ thống CMS Phê duyệt đa cấp, Snapshot Builder & Manifest Version Lock
-- Hỗ trợ Rollback, Audit Log chi tiết, Domain Snapshots phân vùng

-- Bảng quản trị viên và vai trò đa cấp: contributor, editor, reviewer, admin
CREATE TABLE IF NOT EXISTS nguoi_dung_cms (
  email       TEXT PRIMARY KEY,
  ho_ten      TEXT NOT NULL,
  vai_tro     TEXT NOT NULL CHECK (vai_tro IN ('contributor', 'editor', 'reviewer', 'admin')),
  kich_hoat   INTEGER NOT NULL DEFAULT 1,
  tao_luc     TEXT NOT NULL,
  cap_nhat_luc TEXT NOT NULL
);

-- Bảng lưu trữ toàn bộ các phiên bản CMS (Immutable versioning)
CREATE TABLE IF NOT EXISTS ban_ghi_cms (
  id                    TEXT PRIMARY KEY,
  entity_type           TEXT NOT NULL CHECK (entity_type IN ('school', 'tuition', 'scholarship', 'admission', 'cutoff_score', 'announcement', 'deadline', 'contact', 'noi_luu_tru', 'review', 'luu_y')),
  entity_id             TEXT NOT NULL,
  version               INTEGER NOT NULL DEFAULT 1,
  status                TEXT NOT NULL CHECK (status IN ('DRAFT', 'SUBMITTED', 'IN_REVIEW', 'APPROVED', 'PUBLISHED', 'REJECTED', 'ARCHIVED', 'SUPERSEDED')),
  
  data_json             TEXT NOT NULL CHECK (json_valid(data_json)),
  
  source_url            TEXT NOT NULL,
  source_title          TEXT NOT NULL,
  source_publisher      TEXT NOT NULL,
  source_published_at   TEXT,
  source_verified_at    TEXT NOT NULL,
  
  importance            TEXT NOT NULL DEFAULT 'normal' CHECK (importance IN ('normal', 'important', 'critical')),
  change_note           TEXT NOT NULL,
  rejection_reason      TEXT,
  previous_version_id   TEXT,
  
  created_by            TEXT NOT NULL,
  created_at            TEXT NOT NULL,
  updated_by            TEXT NOT NULL,
  updated_at            TEXT NOT NULL,
  
  submitted_by          TEXT,
  submitted_at          TEXT,
  reviewed_by           TEXT,
  reviewed_at           TEXT,
  published_by          TEXT,
  published_at          TEXT
);

CREATE INDEX IF NOT EXISTS idx_ban_ghi_entity ON ban_ghi_cms (entity_type, entity_id, status);
CREATE INDEX IF NOT EXISTS idx_ban_ghi_status ON ban_ghi_cms (status, updated_at);
CREATE INDEX IF NOT EXISTS idx_ban_ghi_version ON ban_ghi_cms (entity_id, version);

-- Bảng lưu lịch sử xuất bản Snapshot (để hỗ trợ rollback tức thì)
CREATE TABLE IF NOT EXISTS snapshot_manifest (
  data_version          TEXT PRIMARY KEY, -- vd: '2026.10.07.01'
  schema_version        INTEGER NOT NULL DEFAULT 1,
  manifest_json         TEXT NOT NULL CHECK (json_valid(manifest_json)),
  is_active             INTEGER NOT NULL DEFAULT 0,
  published_by          TEXT NOT NULL,
  published_at          TEXT NOT NULL,
  total_records         INTEGER NOT NULL DEFAULT 0,
  change_summary        TEXT
);

CREATE INDEX IF NOT EXISTS idx_snapshot_active ON snapshot_manifest (is_active, published_at);

-- Bảng khóa chống Race Condition khi hai Admin cùng bấm Publish cùng lúc
CREATE TABLE IF NOT EXISTS khoa_xuat_ban (
  khoa_id      TEXT PRIMARY KEY, -- 'publish_lock'
  so_huu_boi   TEXT NOT NULL,
  khoa_luc     TEXT NOT NULL,
  het_han_luc  TEXT NOT NULL
);

-- Bảng Audit Log chi tiết
CREATE TABLE IF NOT EXISTS nhat_ky_kiem_toan (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_id     TEXT NOT NULL,
  actor_email  TEXT NOT NULL,
  action       TEXT NOT NULL,
  entity_type  TEXT NOT NULL,
  entity_id    TEXT NOT NULL,
  version      INTEGER NOT NULL,
  changed_info TEXT,
  note         TEXT,
  timestamp    TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON nhat_ky_kiem_toan (timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON nhat_ky_kiem_toan (entity_type, entity_id);

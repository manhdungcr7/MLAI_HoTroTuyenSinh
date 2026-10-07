-- Migration 0003: Đăng ký nhận thông tin và trải nghiệm sớm cho học sinh THPT
-- Bảng lưu trữ thông tin đăng ký quan tâm tuyển sinh, chọn ngành, chọn trường

CREATE TABLE IF NOT EXISTS dang_ky_truy_cap_som (
  id        TEXT PRIMARY KEY,
  ho_ten    TEXT NOT NULL,
  lop       TEXT NOT NULL CHECK (lop IN ('11', '12', 'khac')),
  nhu_cau   TEXT NOT NULL CHECK (nhu_cau IN ('nganh', 'truong', 'nguyen_vong', 'ke_hoach')),
  lien_he   TEXT NOT NULL,
  tao_luc   TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_dang_ky_tao_luc ON dang_ky_truy_cap_som (tao_luc);
CREATE INDEX IF NOT EXISTS idx_dang_ky_nhu_cau ON dang_ky_truy_cap_som (nhu_cau, lop);

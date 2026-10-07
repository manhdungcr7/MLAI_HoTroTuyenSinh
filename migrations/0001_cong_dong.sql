-- Nội dung cộng đồng cho CMS quản trị.
-- Chạy: wrangler d1 execute <tên-db> --remote --file=migrations/0001_cong_dong.sql
-- Quy tắc truy vấn: luôn có LIMIT (và OFFSET hoặc khóa phân trang). Học sinh không đọc D1 trực tiếp, chỉ đọc bản chụp KV.

CREATE TABLE IF NOT EXISTS quan_tri (
  email    TEXT PRIMARY KEY,
  vai_tro  TEXT NOT NULL CHECK (vai_tro IN ('qtv', 'ctv')),
  tao_luc  TEXT NOT NULL
);

-- Kênh chính thức và kênh cộng đồng của trường, mỗi trường một dòng. Mỗi URL đã qua kiemTraLink.
CREATE TABLE IF NOT EXISTS truong_cong_dong (
  ma_truong                      TEXT PRIMARY KEY,
  fanpage_url                    TEXT,
  nhom_tuyen_sinh_chinh_thuc_url TEXT,
  nhom_cong_dong_url             TEXT,
  website_tuyen_sinh_url         TEXT,
  ghi_chu                        TEXT,
  cap_nhat_luc                   TEXT NOT NULL,
  cap_nhat_boi                   TEXT
);

-- Thông tin theo loại. Khung chung là cột; phần riêng từng loại nằm ở du_lieu (JSON), schema kiểm ở src/data/dong-gop-kiem-tra.ts.
-- Bắt buộc nam/link_nguon theo loại và cấm số điện thoại/email cũng kiểm ở đó, không tin client. Mỗi bản ghi duyệt riêng.
CREATE TABLE IF NOT EXISTS thong_tin_truong (
  id           TEXT PRIMARY KEY,
  ma_truong    TEXT NOT NULL,
  loai         TEXT NOT NULL CHECK (loai IN ('hoc_phi', 'hoc_bong', 'noi_luu_tru', 'review', 'luu_y', 'khac')),
  nam          INTEGER,
  link_nguon   TEXT,
  trang_thai   TEXT NOT NULL CHECK (trang_thai IN ('nhap', 'cho', 'duyet', 'an')),
  phien_ban    INTEGER NOT NULL DEFAULT 1,
  tao_boi      TEXT,
  nguon_gui    TEXT NOT NULL DEFAULT 'cms' CHECK (nguon_gui IN ('cms', 'agent')),
  khoa_id      TEXT,
  tao_luc      TEXT NOT NULL,
  cap_nhat_luc TEXT NOT NULL,
  du_lieu      TEXT NOT NULL CHECK (json_valid(du_lieu) AND length(du_lieu) <= 4000)
);
CREATE INDEX IF NOT EXISTS idx_tt_truong_loai_tt ON thong_tin_truong (ma_truong, loai, trang_thai);
CREATE INDEX IF NOT EXISTS idx_tt_trang_thai ON thong_tin_truong (trang_thai, tao_luc);

-- Tình nguyện viên (ctv) chỉ sửa trường được giao; qtv sửa mọi trường.
CREATE TABLE IF NOT EXISTS phan_cong (
  email     TEXT NOT NULL,
  ma_truong TEXT NOT NULL,
  PRIMARY KEY (email, ma_truong)
);
CREATE INDEX IF NOT EXISTS idx_phan_cong_truong ON phan_cong (ma_truong);

-- Khóa tích hợp cho agent (MCP/CLI/REST /api/v1). Chỉ lưu băm SHA-256 (kèm pepper trong secret), khóa gốc chỉ hiện một lần.
-- pham_vi 'doc' chỉ đọc có định danh; 'de_xuat' được gửi đề xuất vào hàng chờ. truong_duoc_phep là mảng JSON mã trường.
CREATE TABLE IF NOT EXISTS khoa_api (
  id               TEXT PRIMARY KEY,
  email            TEXT NOT NULL,
  tien_to          TEXT NOT NULL,
  bam_sha256       TEXT NOT NULL UNIQUE,
  pham_vi          TEXT NOT NULL CHECK (pham_vi IN ('doc', 'de_xuat')),
  truong_duoc_phep TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(truong_duoc_phep)),
  tao_luc          TEXT NOT NULL,
  het_han          TEXT NOT NULL,
  thu_hoi_luc      TEXT,
  lan_dung_cuoi    TEXT
);
CREATE INDEX IF NOT EXISTS idx_khoa_api_email ON khoa_api (email);

CREATE TABLE IF NOT EXISTS bao_sai (
  id               TEXT PRIMARY KEY,
  ma_chuong_trinh  TEXT NOT NULL,
  truong_du_lieu   TEXT NOT NULL,
  noi_dung         TEXT NOT NULL,
  link             TEXT,
  trang_thai       TEXT NOT NULL DEFAULT 'moi' CHECK (trang_thai IN ('moi', 'xong', 'boQua')),
  tao_luc          TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_bao_sai_trang_thai ON bao_sai (trang_thai, tao_luc);

CREATE TABLE IF NOT EXISTS nhat_ky (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  ai        TEXT NOT NULL,
  hanh_dong TEXT NOT NULL,
  doi_tuong TEXT NOT NULL,
  luc       TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_nhat_ky_luc ON nhat_ky (luc);

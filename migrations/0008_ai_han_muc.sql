-- Migration 0008: Hạn mức lượt AI mỗi hồ sơ ẩn danh mỗi ngày (giờ Asia/Ho_Chi_Minh). Cập nhật nguyên tử bằng D1 batch (một giao dịch).
-- ai_luot_ngay: số lượt đã giữ hoặc đã dùng trong ngày. ai_yeu_cau: từng yêu cầu (mã do client sinh) để gửi lại không bị trừ hai lần.
-- trang_thai 'giu' = đã giữ chỗ, đang gọi AI; 'xong' = AI thành công, lượt đã trừ. AI lỗi thì xóa dòng và trả lại lượt.
CREATE TABLE IF NOT EXISTS ai_luot_ngay (
  ho_so TEXT NOT NULL,
  ngay  TEXT NOT NULL,
  dem   INTEGER NOT NULL DEFAULT 0 CHECK (dem >= 0),
  PRIMARY KEY (ho_so, ngay)
);
CREATE TABLE IF NOT EXISTS ai_yeu_cau (
  ho_so      TEXT NOT NULL,
  yeu_cau    TEXT NOT NULL,
  ngay       TEXT NOT NULL,
  the        TEXT NOT NULL,
  trang_thai TEXT NOT NULL CHECK (trang_thai IN ('giu', 'xong')),
  tao_luc    INTEGER NOT NULL,
  PRIMARY KEY (ho_so, yeu_cau)
);
CREATE INDEX IF NOT EXISTS idx_ai_yeu_cau_ngay ON ai_yeu_cau (ngay);
CREATE INDEX IF NOT EXISTS idx_ai_luot_ngay_ngay ON ai_luot_ngay (ngay);

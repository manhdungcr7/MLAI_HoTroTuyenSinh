-- Migration 0010: khóa kết nối cá nhân cho cộng tác viên (MCP đóng góp dữ liệu) và dấu "nhập qua AI" trên bản ghi.
-- Khóa dùng lại bảng khoa_api (migration 0001, chưa có mã nào đọc/ghi): pham_vi = 'de_xuat', truong_duoc_phep = '[]'
-- (quyền theo trường được giao được tra lại từ phan_cong MỖI LẦN gọi, không chép vào khóa). Không tạo bảng mới.
-- Cột nhap_qua_ai (JSON) chỉ dùng nội bộ CMS, KHÔNG đi vào bản chụp công khai (snapshot builder chỉ đọc data_json).
-- Nội dung: { "nhapQuaAI": true, "via": "mcp", "khoaId", "email", "nguon": { loai, url, trang, trichDan }, "chenhLon": bool, "diemCu"?: number }.
-- ALTER TABLE ADD COLUMN không có IF NOT EXISTS: wrangler chỉ áp mỗi migration một lần.

ALTER TABLE ban_ghi_cms ADD COLUMN nhap_qua_ai TEXT CHECK (nhap_qua_ai IS NULL OR json_valid(nhap_qua_ai));

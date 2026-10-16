# Kết nối Claude

MCP endpoint khai báo trong `plugins/nguyen-vong-ai/mcp.json` dùng Streamable HTTP và OAuth. Custom remote MCP connector hiện có trên Claude/Claude Desktop cho gói Pro, Max, Team và Enterprise. Trong Claude, thêm custom connector/server theo giao diện phiên bản đang dùng, nhập endpoint rồi hoàn tất consent OAuth. Với Team/Enterprise, owner cần bật connector cho workspace. Chỉ cấp scope cần dùng; quyền mặc định là đọc.

Thử truy vấn đọc và kiểm tra nguồn/năm dữ liệu. Thao tác ghi phải tạo proposal chờ xác nhận trong app.

Hướng dẫn này không xác nhận kết nối Claude hoặc production; xác minh bằng tài khoản và môi trường được ủy quyền. Không đưa token/secret vào repo.

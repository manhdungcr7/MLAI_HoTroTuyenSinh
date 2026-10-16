# Kết nối ChatGPT

Plugin MCP khai báo endpoint OAuth trong `plugins/nguyen-vong-ai/mcp.json`. ChatGPT gọi tích hợp MCP là custom app/connector, không phải plugin kiểu cũ. Full MCP gồm thao tác ghi đang được triển khai theo gói Business, Enterprise và Edu; Pro có thể kết nối MCP ở chế độ developer cho quyền đọc/fetch. Để kết nối, bật developer mode nếu gói/workspace hỗ trợ, tạo custom app, nhập endpoint và hoàn tất OAuth consent. Chỉ yêu cầu scope cần dùng; quyền mặc định là đọc.

Sau khi kết nối, thử một truy vấn tra cứu trường và kiểm tra nguồn, năm dữ liệu cùng giới hạn được nêu rõ. Với thao tác ghi, kiểm tra proposal trong ứng dụng và tự xác nhận.

Checkout local không chứng minh tài khoản ChatGPT, OAuth client bên ngoài hoặc endpoint production đã hoạt động. Không lưu token trong repository.

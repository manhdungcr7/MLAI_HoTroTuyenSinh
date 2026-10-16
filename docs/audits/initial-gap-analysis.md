# Khoảng trống ban đầu

| Nhóm | Phát hiện | Hành động |
|---|---|---|
| A — có implementation và test | State local, lịch học, priority engine, OAuth PKCE, API snapshot | Giữ và kiểm tra regression |
| B — lỗi | Baseline test Bách khoa TP.HCM; chuẩn hóa và lazy data lifecycle | Sửa matching, không bịa trường thiếu |
| C — một phần | MCP tự viết, schema chưa được enforce, thiếu structured output/Origin policy | Dùng server SDK và kiểm thử client thật |
| C — một phần | API/MCP search có logic trùng | Gom capability dùng chung |
| D — dữ liệu cần phân loại | Lịch sử, nguồn tổng hợp và học phí ước tính | Xuất provenance/freshness trung thực |
| E — thiếu | Progress write qua MCP có xác nhận | Task ID thật, scope study:write, pending proposal |
| E — thiếu | Repo skills và plugin package | Tạo workflow bám code thực tế |
| F — dư thừa | Thêm DB/GitHub/browser MCP khi CLI/browser đã làm được | Dùng SQLite, gh, Wrangler, browser hiện có |

Chưa được chứng minh khi bắt đầu: migration/binding production, kiểm chứng nguồn từng bản ghi, calibration dự báo, kết nối tài khoản ChatGPT/Claude. Không ghi nhận chúng là đã đạt từ báo cáo cũ.

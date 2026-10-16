# Quy trình phát hành agent-native

Tài liệu này là checklist thao tác, không phải giấy phép phát hành.

## Trước phát hành

1. Ghi lại branch, commit, `git status` và diff; giữ nguyên thay đổi người dùng chưa commit.
2. Chạy các cổng phù hợp trong `docs/operations/runtime-checks.md` và xử lý mọi `FAIL`.
3. Kiểm tra migration, biến môi trường, D1/KV bindings, OAuth metadata và snapshot trên môi trường đích bằng quyền chỉ đọc trước.
4. Kiểm tra hành trình học sinh và trạng thái dữ liệu trên đúng môi trường; không dùng mock làm bằng chứng production.
5. Đối chiếu diff với landing baseline `landing-approved-2026-10-07`; không thay đổi các đường dẫn landing được bảo vệ.

## Ranh giới phát hành

- Deploy production, áp remote migration, publish snapshot hoặc sửa dữ liệu production cần ủy quyền phát hành rõ ràng.
- Không ghi secret, token, hồ sơ học sinh hoặc điểm cá nhân vào repo hay log.
- Thực hiện release theo CI và hướng dẫn rollback hiện hành; dừng nếu migration hoặc binding chưa rõ.
- Sau release, ghi URL, thời gian, commit, kết quả health/runtime và hành trình smoke đã thực chạy. Phân biệt lỗi môi trường với lỗi sản phẩm.

Không có release hay production check nào được xác nhận bởi tài liệu này.

---
name: admissions-data-verification
description: Audit admissions provenance, freshness, duplicate records and ingestion changes in the existing catalog.
---

Dùng `npm run data:audit`, `src/data/` và pipeline CMS hiện có; không thêm pipeline song song.
Phân biệt URL tài liệu, tier do dataset khai báo và ngày kiểm chứng thực tế. Không tự gắn verified từ việc có URL.
Giữ năm, phương thức, tổ hợp, nguồn và giá trị thiếu khi nhập/gộp. Chỉ hợp nhất cùng institution/program/year/method/combination.
Không đổi số liệu từ nguồn tổng hợp thành quy định chính thức. Đối chiếu tài liệu gốc trước khi cập nhật trạng thái xác minh.
Ghi phần chưa đủ bằng chứng trong `docs/audits/data-quality.md`; không sửa production tự động.

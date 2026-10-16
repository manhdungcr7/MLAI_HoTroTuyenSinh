---
name: mobile-ux-audit
description: Verify actual student journeys, save/resume and responsive layouts with the repository browser harness.
---

Chạy local Pages không có remote AI mặc định. Dùng `npm run test:browser` và báo cáo JSON trong `.agent-runtime/`.
Kiểm 320/375/390/430/768/1440px, overflow, console, network, route, empty state, thao tác thật và reload.
Không coi DOM tĩnh/build là hành trình đã đạt. Không mock response rồi báo backend thật đã chạy.
Landing được khóa: chỉ kiểm, không sửa hoặc thay CSS chung làm đổi giao diện. Nếu có lỗi trên protected path, ghi bằng chứng và giữ nguyên.

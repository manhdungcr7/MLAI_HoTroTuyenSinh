---
name: admissions-domain
description: Implement or review Vietnamese admissions calculations and preference analysis in this repository.
---

Đọc `src/capabilities/`, `src/engine/diem-uu-tien.ts` và helper của feature liên quan trước khi sửa.
Tính theo tổ hợp của chương trình; thiếu môn giữ null. Không mặc định A01, không cộng ưu tiên hai lần.
Điểm phù hợp không phải xác suất đậu. Thứ tự nguyện vọng phản ánh mong muốn của học sinh; không tự thay bằng thứ tự điểm chuẩn.
AI không được thay kết quả xác định. Chạy `npm run test:capabilities` và regression của feature đã sửa.

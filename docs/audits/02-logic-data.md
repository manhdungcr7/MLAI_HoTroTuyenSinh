# Audit logic và toàn vẹn dữ liệu tuyển sinh

Ngày audit: 2026-10-16. Phạm vi: `src/engine/`, `src/capabilities/`, `src/data/` và logic tuyển sinh liên quan. Không sửa dữ liệu nguồn hoặc hành vi sản phẩm trong lượt audit này vì chưa tái hiện được lỗi logic có căn cứ; không chỉnh sửa mã do agent khác sở hữu.

## Kết quả

Không tái hiện được lỗi P0/P1 trong các luồng điểm, tổ hợp, nhãn nguyện vọng, thứ tự ưu tiên và capability tuyển sinh đã kiểm tra. Các phép tính dùng tổ hợp của từng chương trình; điểm thiếu giữ `null`; dữ liệu so sánh ghi rõ phạm vi và trạng thái chưa xác minh độc lập. Các kiểm tra hiện có đã bao phủ phần lớn ca biên quan trọng nên không thêm regression test trùng lặp.

| ID | Mức | Phạm vi / tái hiện | Kết quả và trạng thái |
|---|---|---|---|
| DATA-01 | P2 | `npm run data:audit` trên snapshot kèm repo | 56 chương trình thiếu URL nguồn chính; 2.162 thiếu nguồn theo năm; 93 có tổ hợp engine chưa tính được; 3.047/3.648 học phí mang cờ ước tính. Ghi nhận là giới hạn truy xuất/độ chắc chắn, chưa phải bằng chứng con số sai. Đã có cảnh báo và provenance `not_independently_verified`; giữ nguyên, không tự nâng xác minh. |
| LOGIC-01 | Không tái hiện | Điểm thiếu/null, 0, `NaN`, tổ hợp thiếu môn, không có tổ hợp tính được | `tongChoLuaChon` trả tổng `null` khi thiếu dữ liệu; capability từ chối điểm âm, >10, không hữu hạn hoặc sai kiểu. Kiểm tra tại `tests/capabilities.test.ts` và `tests/audit-logic-edge-cases.test.ts` đạt. |
| LOGIC-02 | Không tái hiện | Ranh giới cộng ưu tiên 22,5/30, cộng khu vực/đối tượng | `tests/diem-uu-tien.test.ts` đạt; capability dùng chung engine và ghi cảnh báo công thức theo năm chưa được xác minh. |
| LOGIC-03 | Không tái hiện | Lặp ID, ID lạ, thứ tự thiếu/thừa, thứ tự học sinh chọn | `validate_preference_order` báo duplicate/unknown/missing/unselected; không tự xếp lại. `tests/capabilities.test.ts`, `tests/nguyen-vong.test.ts`, `tests/nhan-nguyen-vong.test.ts` đạt. |
| LOGIC-04 | Không tái hiện | Điểm chuẩn năm mới nhất là `null`, khác phương thức hoặc khác tổ hợp | `programDetails` giữ `null` ở năm mới nhất thay vì lùi về điểm năm cũ; capability chỉ so khi THPT và cùng tổ hợp. Test capability xác nhận năm thiếu được giữ nguyên. |

## Bằng chứng dữ liệu

`npm run data:audit` hoàn tất thành công, phạm vi chỉ là snapshot cục bộ, không truy cập mạng hoặc xác nhận tài liệu gốc. Kết quả: 118 trường, 3.648 chương trình; 3.320 THPT, 220 học bạ và 108 chương trình thuộc phương thức khác/kết hợp/năng khiếu. Không phát hiện ID trùng, điểm sai hình dạng, điểm âm hoặc điểm THPT vượt 30. Có điểm dữ liệu theo năm 2021–2026; năm dữ liệu không đồng nghĩa ngày xác minh hay hiệu lực tuyển sinh.

Học phí có giá trị trong 3.648 bản ghi lựa chọn; 3.047 có cờ ước tính. Vì vậy cần xem giá trị này là tín hiệu tham khảo, không phải xác nhận khả năng chi trả. Một chương trình không khai báo tổ hợp; 93 chương trình có tổ hợp nhưng có ít nhất một môn engine chưa hỗ trợ. Các bản ghi này không đủ căn cứ để so điểm theo tổ hợp và cần giữ trạng thái không so được.

## Kiểm tra đã chạy

- `npm run data:audit` — đạt, không có duplicate ID, malformed score hoặc THPT score ngoài thang 30.
- `npm run test:capabilities` — đạt: validation đầu vào, điểm thiếu, ưu tiên, provenance, snapshot có scope, gợi ý xác định.
- `npx tsx tests/audit-logic-edge-cases.test.ts` — đạt.
- `npx tsx tests/diem-uu-tien.test.ts` — đạt.
- `npx tsx tests/du-bao-diem-chuan.test.ts` — đạt; kiểm định hồi cứu hiển thị độ phủ khác nhau theo năm (2023: 89,4%; 2024: 94,9%; 2025: 64,9%), không phải chứng nhận khả năng dự đoán tương lai.
- `npx tsx tests/nguyen-vong.test.ts`, `npx tsx tests/nhan-nguyen-vong.test.ts`, `npx tsx tests/kham-pha.test.ts` — đạt.

## Giới hạn và việc còn lại

Audit này không đối chiếu thủ công từng đề án/URL, không kiểm tra CMS đang chạy hay cập nhật tuyển sinh mới nhất. Các thiếu sót nguồn và học phí ước tính phải được xử lý bằng đối chiếu tài liệu gốc theo trường, chương trình, năm và phương thức; không thể suy ra tính chính xác chỉ từ nhãn `sourceTier` hoặc URL. Chưa chạy toàn bộ `npm test`, typecheck hoặc build trong phạm vi agent này; tích hợp chính cần chạy các cổng tổng thể.

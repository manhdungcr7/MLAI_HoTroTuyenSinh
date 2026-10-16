# Mô hình chi phí

Trạng thái: **giá theo token chưa được xác minh** (không có bảng giá trong repo, và tôi không suy đoán giá). Tài liệu này ghi các con số có trong code và công thức để điền giá thật.

## Thành phần chi phí

| Mục | Nguồn | Ghi chú |
|---|---|---|
| Cloudflare Workers/Pages | Gói trả phí của tài khoản | Không đổi trong đợt này; OAuth và MCP chạy trên Pages Functions có sẵn |
| D1 | Số dòng đọc/ghi | OAuth thêm truy vấn cho đổi token, làm mới, và mỗi yêu cầu MCP có Bearer (tra token rồi kiểm kết nối). Số truy vấn chưa đo trên production |
| KV | Số thao tác đọc/ghi | Giới hạn tần suất mỗi yêu cầu đăng ký, đồng ý, đổi token, MCP-theo-kết nối |
| Nhà cung cấp AI | Token vào và ra | Phần duy nhất có chi phí biến đổi lớn |

## Giới hạn đang có trong code

| Giới hạn | Giá trị | Nơi quy định |
|---|---|---|
| Lượt AI mỗi hồ sơ mỗi ngày | 50 (`AI_QUOTA_DAILY`) | `functions/_thu-vien/han-muc-ai.ts` |
| Lượt AI toàn hệ thống mỗi ngày | 500 (`AI_TONG_NGAY`) | `functions/api/tu-van.ts`, mới thêm trong đợt này |
| Token ra tối đa mỗi yêu cầu | 450 | `functions/_thu-vien/ai/sinh-van-ban.ts` (`TOKEN_RA`) |
| Kích thước thân yêu cầu tư vấn | 16.000 byte | `src/engine/tu-van.ts` |
| Câu hỏi tối đa | 1.000 ký tự | `src/engine/tu-van.ts` |
| Yêu cầu tư vấn mỗi phút mỗi IP | 8 | `src/engine/tu-van.ts` |
| Yêu cầu MCP mỗi phút mỗi kết nối | 60 | `functions/_thu-vien/ket-noi.ts` |
| Thời gian chờ mô hình | `HAN_GOI_MS` | `functions/_thu-vien/ai/sinh-van-ban.ts` |

Lưu ý: mục tiêu của prompt là 1.500 token vào mỗi yêu cầu. Code **chưa đếm token vào**; chỉ giới hạn kích thước byte (16 KB, tương đương vài nghìn token trong trường hợp xấu nhất). Đây là khoảng cách cần đóng nếu muốn kiểm soát chi phí chặt.

## Công thức

```
chi phí AI/ngày  ≤  N_lượt × (token_vào × giá_vào + token_ra × giá_ra)
N_lượt tối đa    =  AI_TONG_NGAY (500)
token_ra tối đa  =  450
token_vào        =  đo từ phản hồi nhà cung cấp (trường usage), chưa lưu lại
```

Ví dụ điền giá: thay `giá_vào` và `giá_ra` bằng bảng giá của nhà cung cấp đang dùng (theo `OPENROUTER_API_KEY`, `ANTHROPIC_API_KEY` hoặc `OPENAI_API_KEY`), tại thời điểm tính.

Trần tuyệt đối mỗi ngày: 500 × (token_vào tối đa + 450) × giá. Với 500 lượt là giới hạn trên của chi phí AI, không phải dự báo.

## Ngân sách và cảnh báo

- **Chưa có**: cảnh báo ở 70% và 90% ngân sách tháng. Trần 500 lượt/ngày là biện pháp dừng cứng, không phải cảnh báo.
- **Cách bổ sung**: đọc tổng lượt `ai_luot_ngay` cho khóa `he-thong` theo ngày (đã lưu trong D1); so với ngưỡng 70% và 90% của tổng lượt tháng dự kiến. Việc này chưa làm.
- Đếm lượt cho biết mức sử dụng, không phải chi phí. Chi phí cần giá token và `usage` thật từ phản hồi.

## Lượt không tính phí

- Trả từ cache (tầng `cache`) không trừ lượt của học sinh và không tính lượt hệ thống.
- Yêu cầu lỗi nhà cung cấp: trả lại lượt cả hai bộ đếm.
- Công cụ MCP và GPT Actions không gọi AI: không tính lượt.

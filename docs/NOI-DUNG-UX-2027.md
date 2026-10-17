# Nội dung UX 2027: rà soát chữ, câu chuẩn và thông điệp demo

Chủ sở hữu: Agent 4 (nội dung). Bộ câu dùng chung nằm ở `src/noi-dung/du-bao.ts`.

## 1. Bảng lỗi chữ đã quét

Quét toàn `src` và `public` (đọc cả ngoài phạm vi). Cổng `npm run kiem-tra` (từ cấm) qua trước và sau khi sửa.

| # | Loại | Vị trí | Câu cũ | Câu mới | Trạng thái |
|---|---|---|---|---|---|
| 1 | Thuật ngữ máy móc | `ke-hoach/che-do-chien-luoc.tsx` (thông báo tạo việc) | "phân bổ đều vào lịch... của bạn!" | "xếp đều vào lịch tự học tuần của bạn." | Đã sửa |
| 2 | Quảng cáo quá lời | `ke-hoach/che-do-chien-luoc.tsx` (nút) | "Áp dụng phân bổ thông minh vào Lịch tuần" | "Xếp vào lịch tuần" | Đã sửa |
| 3 | Hứa hẹn chưa kiểm chứng | cùng file, mốc ĐGNL | "...để mở thêm chỉ tiêu." | "Nếu trường em chọn xét ĐGNL (HSA, TSA), xem lịch đăng ký đợt 1." | Đã sửa |
| 4 | Hứa hẹn chưa kiểm chứng | cùng file, mốc ngoại ngữ | "đủ điều kiện quy đổi điểm 10 kết hợp" | "Hỏi từng trường xem có quy đổi thành điểm không." | Đã sửa |
| 5 | Thuật ngữ chưa giải thích | cùng file | "Đã có điểm ĐGNL, dùng nộp sớm các trường lớn." | "Đã có điểm ĐGNL (đánh giá năng lực). Xem trường em chọn có nhận không." | Đã sửa |
| 6 | Giọng máy | `ke-hoach/ke-hoach-tuan.tsx`, `ke-hoach/hop-lich.tsx`, `tu-hoc/cai-dat-tu-hoc.tsx` | "Hệ thống sẽ phân bổ / luôn chừa / luôn giữ trống" | "Mình sẽ xếp / luôn chừa / luôn giữ trống" | Đã sửa |
| 7 | Giọng máy, nói chung chung | `huong-nghiep/trac-nghiem.tsx` | "Hệ thống dùng kết quả để gợi ý nhóm ngành và hướng đi phù hợp." | "Kết quả dùng để gợi ý nhóm ngành, không thay cho điểm số." | Đã sửa |
| 8 | Xưng hô lẫn (bạn/em trong cùng màn) | `huong-nghiep/trac-nghiem.tsx`, `huong-nghiep/cau-hoi.ts` | "bạn" ở phần mở đầu và 12 câu hỏi, "em" ở kết quả | thống nhất "em" (giữ nguyên "bạn bè", "bạn thân") | Đã sửa |
| 9 | Tên gọi không nhất quán | `tu-van/tro-ly-noi-bot.tsx` (6 chỗ, gồm aria-label), `tu-van/tu-van.tsx` | "Chatbot AI Tuyển sinh", "Trợ lý Tuyển sinh AI" | "Trợ lý tuyển sinh AI", "Đóng/Mở trợ lý AI" | Đã sửa |
| 10 | Lỗi thiếu hướng dẫn | `tu-van/thanh-phan/tin-may-chu.tsx` | "Dịch vụ AI chưa phản hồi." | "Chưa nhận được trả lời từ AI, có thể do mạng chậm. Câu hỏi của em vẫn còn." | Đã sửa |
| 11 | Điểm sàn nói như điều kiện đỗ | `noi-dung/du-bao.ts` (THUAT_NGU.diemSan) | "Đạt điểm sàn chưa chắc đỗ." | "Đạt điểm sàn chưa có nghĩa là trúng tuyển." | Đã sửa |
| 12 | Câu dài, lặp | `noi-dung/du-bao.ts` (giải thích trạng thái C, D, F) | câu dài, "chính thức" thừa | rút gọn, thêm bước tiếp theo cho D | Đã sửa |
| 13 | Câu nhãn thiên về cổ vũ | `noi-dung/du-bao.ts` NHAN_KET_LUAN | "Còn cách xa, cần nhiều nỗ lực", "Hơi thấp, cần thêm điểm" | "Còn cách xa khoảng dự báo", "Hơi thấp hơn khoảng dự báo" | Đã sửa |
| 14 | Thiếu giải thích thuật ngữ | THUAT_NGU | chưa có tổ hợp, ĐGNL | thêm `toHop`, `dgnl` | Đã thêm |
| 15 | Offline thiếu hướng đi | `NHAN_NGOAI_TUYEN` | "Không có kết nối mạng. Dữ liệu đã tải vẫn xem được." | thêm "dữ liệu mới sẽ cập nhật khi có mạng" | Đã sửa |

Đã kiểm, không có lỗi: từ cấm trong chữ hiển thị (trừ trang giới thiệu, bị khóa theo `docs/LANDING-LOCK.md`); chữ "chắc chắn", "đảm bảo", "100%" gắn với khả năng đỗ (các chỗ còn lại đều là câu phủ định "không phải xác suất đậu"); chỗ gọi điểm sàn là điểm chuẩn (trạng thái C đã tách đúng); chỗ gọi dự báo là kết quả thật; `.toFixed` hiển thị (chỉ có trong tọa độ SVG, không hiển thị).

## 2. Bộ câu chuẩn (trong `src/noi-dung/du-bao.ts`)

Năm vị trí điểm so với khoảng dự báo, kèm câu "Điểm của bạn đang cao/thấp hơn mức dự báo trung tâm X điểm. Tuy nhiên điểm chuẩn thực tế vẫn có thể thay đổi.":

| Vị trí | Nhãn (`NHAN_KET_LUAN`) | Câu (`CAU_VI_TRI`) |
|---|---|---|
| caoHonCa | Đang ở phía trên khoảng dự báo | Điểm của bạn cao hơn cả mức cao nhất của khoảng dự báo. |
| tren | Có cơ hội, nhưng còn biến động | Điểm của bạn nằm trong khoảng dự báo, trên mức giữa. |
| trongKhoang | Sát ngưỡng, cần cân nhắc | Điểm của bạn nằm trong khoảng dự báo, dưới mức giữa. Kết quả có thể đi cả hai hướng. |
| duoi | Hơi thấp hơn khoảng dự báo | Điểm của bạn hơi thấp hơn mức thấp nhất của khoảng dự báo. |
| thapHonCa | Còn cách xa khoảng dự báo | Điểm của bạn thấp hơn khá xa mức thấp nhất của khoảng dự báo. |

Hàm ghép câu đầy đủ: `cauVeDiemSoVoiDuBao(viTri, chenh, dinhDang, laDiemXemThu?)`.

Trạng thái dữ liệu A-F có sẵn (`TIEU_DE_TRANG_THAI`, `GIAI_THICH_TRANG_THAI`). Thêm G, H ở `TIEU_DE_TRANG_THAI_PHU` / `GIAI_THICH_TRANG_THAI_PHU` (khóa `doiMa`, `chuaXuatBan`, `daCu`), không đổi kiểu `LoaiDuLieu` của engine.

Mạng và tải: `CAU_TRANG_THAI_MANG` (ngoaiTuyen, loiApi, hetGio, mangCham, dangTai, trong), mỗi mục có `tieuDe` + `moTa` theo mẫu chuyện gì, vì sao, làm gì.

AI thiếu dữ liệu: `CAU_AI_THIEU_DU_LIEU` ("Mình chưa có điểm chuẩn hợp lệ của ngành này nên không nêu con số." và các biến thể).

Không hiện phần trăm cơ hội khi chưa có xác suất đã hiệu chỉnh: `CAU_KHONG_PHAN_TRAM`.

## 3. Cần chủ file sửa

Agent 3 (`src/engine`, `src/features/nguyen-vong`, `tests`):
- `src/engine/du-bao-diem-chuan.ts:114` `MO_TA_VI_TRI` dùng "mức dự kiến" lẫn "dự báo". Đề xuất: dùng `CAU_VI_TRI` / `cauVeDiemSoVoiDuBao` từ `@/noi-dung/du-bao` để cùng một giọng "khoảng dự báo".
- `src/features/nguyen-vong/goi-y-danh-sach.ts:219` "...để bạn chắc chắn có chỗ học" hứa hẹn. Đề xuất: "...để danh sách có một lựa chọn dư điểm an toàn." Nên bỏ "chắc chắn".
- `src/features/tu-van/lay-du-lieu.ts:554, 565` (chữ nằm ở `.ts`, ngoài phạm vi .tsx của Agent 4) dùng "Em kiểm tra/Em đối chiếu" trong khi các câu quanh đó dùng "Bạn" (dòng 357, 412, 759). Đề xuất: chọn "bạn" cho toàn bộ trả lời tự động, hoặc "em" cho toàn bộ.
- Khi AI thiếu dữ liệu, dùng các câu trong `CAU_AI_THIEU_DU_LIEU` cho lời nhắc hệ thống và câu trả lời tự động.

Agent 2 (`src/features/kham-pha`, `src/components`):
- `src/features/kham-pha/so-sanh.tsx:139` nhãn phụ "dự kiến" của học phí. Đề xuất: "ước tính" cho nhất quán với `chi-tiet.tsx:283`.
- `src/features/kham-pha/ve-du-lieu.tsx:70` dùng "Chatbot". Đề xuất: "Trợ lý AI".
- Nên dùng `CAU_VI_TRI` thay cho `MO_TA_VI_TRI` nếu hiển thị câu vị trí.

Agent 1 (`src/features/khoi-dau`, `thu-tinh-huong`):
- `src/features/thu-tinh-huong/ket-qua-diem-thi.tsx:24` và `ket-qua-tinh-huong.tsx:36` nhãn "Tăng cơ hội" dễ bị đọc là tăng khả năng đỗ. Đề xuất: "Điểm phù hợp tăng" (hoặc "Tăng mức phù hợp").
- `src/features/khoi-dau/bat-dau.tsx:130` nút "Phân tích cơ hội". Đề xuất: "Xem phân tích".

Trang giới thiệu (`src/features/landing-page`, bị khóa): không sửa.

## 4. Tóm tắt thay đổi

- Thêm vào `du-bao.ts`: `NHAN_DU_BAO_2027`, `LoaiTrangThaiPhu`, `TIEU_DE_TRANG_THAI_PHU`, `GIAI_THICH_TRANG_THAI_PHU`, `CAU_VI_TRI`, `cauVeDiemSoVoiDuBao`, `CAU_TRANG_THAI_MANG`, `CAU_AI_THIEU_DU_LIEU`, `CAU_KHONG_PHAN_TRAM`, và hai thuật ngữ `toHop`, `dgnl`. Mọi tên export cũ giữ nguyên.
- Sửa chữ hiển thị ở các slice kế hoạch, tự học, hướng nghiệp, tư vấn (xem bảng mục 1). Không đổi logic, bố cục.

## 5. Thông điệp cho video demo

1. "Ứng dụng này không nói em đậu hay trượt. Nó cho em thấy điểm của mình đang ở đâu so với điểm chuẩn các năm trước."
2. "Điểm chuẩn năm 2027 chưa có. Cái em thấy là khoảng dự báo tham khảo, và luôn ghi rõ như vậy."
3. "Điểm sàn không phải điểm chuẩn. Ngành nào chỉ có điểm sàn thì ứng dụng nói thẳng là chưa đủ dữ liệu."
4. "Mỗi con số đều kèm năm và nguồn. Chưa có thì ghi là chưa có, không điền thay."
5. "Nhãn Thử sức, Vừa sức, An toàn, Dự phòng giúp em cân bằng danh sách nguyện vọng, không phải lời hứa."
6. "Hỏi trợ lý AI một ngành chưa có điểm chuẩn, nó trả lời: mình chưa có điểm chuẩn hợp lệ nên không nêu con số."
7. "Mất mạng vẫn xem được dữ liệu đã tải. Dữ liệu của em nằm trên máy em."
8. "Người trong trường có thể báo số sai hoặc bổ sung điểm chuẩn, và dữ liệu được duyệt trước khi tới học sinh."

## 6. Giới hạn còn lại

- Các câu mới trong `CAU_TRANG_THAI_MANG`, `CAU_AI_THIEU_DU_LIEU`, `TIEU_DE_TRANG_THAI_PHU` đã có sẵn nhưng cần Agent 2/3 nối vào giao diện và AI; hiện chỉ `NHAN_NGOAI_TUYEN` và các câu cũ đang được dùng.
- Chưa có hiện thực cho trạng thái G (đổi mã ngành) và H (dự báo cũ) ở engine; mới có câu chữ.
- Chữ trong `.ts` của slice tư vấn (câu trả lời tự động) ngoài phạm vi nên chưa sửa.
- Chưa thử với người dùng thật, nên các câu còn là giả định về cách học sinh hiểu.

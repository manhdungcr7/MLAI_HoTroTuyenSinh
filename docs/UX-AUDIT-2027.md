# UX audit 2027 — Agent 1 (Bước 1 "Nhập năng lực")

Ngày: 2026-10-17. Đo ở 390px (kiểm thêm 320/360) bằng agent-browser, dev server cổng 3041.
Phạm vi audit sâu: Khởi đầu (`/bat-dau/1..3`, màn kết quả đầu tiên) và Điểm thi thử (`/diem-thi-thu`). Các màn khác chỉ ghi nhận qua mã nguồn, chưa duyệt hết ở trình duyệt.
Ảnh "trước": `evidence/ui-2027/agent1/truoc-*.png`; ảnh "sau": `sau-*.png`.

## 1. Bảng lỗi UX

| # | Màn | Vấn đề | Mức | Gốc rễ | Chủ file | Trạng thái |
|---|---|---|---|---|---|---|
| 1 | Bước 2 | Ô điểm không nói là điểm gì (thi thử, mục tiêu, học bạ?). Dễ trộn loại điểm | Cao | Không có nhãn loại điểm; state chỉ có `HoSo.diem` + `diemThi` | Agent 1 | Đã sửa (chip "Điểm thi thử" + hộp giải thích dùng `THUAT_NGU`). Phần "điểm mục tiêu từng môn" chờ state |
| 2 | Bước 2 | Phải kéo qua 3 mục gập mới thấy tổng tổ hợp, mất phản hồi tức thì | Trung bình | Thứ tự khối | Agent 1 | Đã sửa (tổ hợp lên ngay dưới 6 ô điểm) |
| 3 | Bước 2 | Không biết đã nhập bao nhiêu, có bắt buộc không | Trung bình | Thiếu tiến độ, thiếu câu nói "nhập sau cũng được" | Agent 1 | Đã sửa (thanh "Đã nhập n/6", mô tả bước) |
| 4 | Bước 2 | 4 thẻ tổ hợp trống lặp "Chưa đủ điểm / Thiếu ..." 4 lần, cao và thừa chữ | Thấp | Hai dòng cho một ý | Agent 1 | Đã sửa (một dòng "Còn thiếu ...") |
| 5 | Điểm thi thử | Không nói điểm đang dùng của mỗi môn đến từ đâu (thi thử hay hồ sơ) | Trung bình | `diemHienTaiCuaTungMon` gộp hai nguồn, UI không lộ | Agent 1 | Đã sửa ("Đang dùng 8,5 (em nhập ở hồ sơ / thi thử 12/10)") |
| 6 | Điểm thi thử | Có thể nhầm nhập điểm mục tiêu vào ô thi thử | Cao | Thiếu cảnh báo phân loại | Agent 1 | Đã sửa (câu dặn + chip + hộp giải thích) |
| 7 | Điểm thi thử | Nút chatbot nổi che dòng "Đang dùng ..." của ô cuối bên phải và thẻ tổ hợp khi cuộn | Trung bình | FAB toàn cục cố định góc phải dưới | Agent 2/5 (`src/components`) | Chưa sửa, ngoài phạm vi |
| 8 | Bước 1/2 | "Bỏ qua điểm" chỉ có ở Bước 1; ở Bước 2 nút trái là "Quay lại" nên không rõ có thể đi tiếp khi để trống | Thấp | Một cặp nút dùng chung | Agent 1 | Giảm nhẹ bằng câu mô tả; ở Bước 2 "Tiếp tục" vốn không chặn |
| 9 | Bước 2 | Ô điểm xóa hết một số khi gõ sai (chữ không phải số) thì hồ sơ mất điểm môn đó | Thấp | `goDiem` ghi `null` khi ô sai | Agent 1 | Giữ nguyên (đúng nguyên tắc không điền thay), có báo lỗi bằng lời |
| 10 | Hồ sơ / Hôm nay | Không thấy chỗ "Em đang ở đâu" gom điểm theo loại (thi thử / mục tiêu / thi thật / học bạ) | Trung bình | Màn thuộc `hanh-trinh` | Agent 3/4 | Chưa sửa, ngoài phạm vi. Có thể dùng `NhanLoaiDiem`, `ChuThichLoaiDiem` |
| 11 | Mục tiêu | Chỉ có tổng điểm mục tiêu, gắn với một ngành; chưa có mục tiêu theo môn khi chưa thi thử | Cao | Thiết kế state | Agent 3 | Xem đề xuất state |
| 12 | Điểm thi thử | Điểm thi thật chưa có chỗ nhập riêng | Trung bình | State | Agent 3 | Xem đề xuất state |
| 13 | Test | `tests/thu-tinh-huong.test.ts` đang đỏ (UIT `goc < NGUONG_PHU_HOP`), do dữ liệu `src/data` đang sửa dở, không do UI | Thấp | Dữ liệu đổi | Agent 3 | Chưa xử lý, báo lại |

## 2. Màn thừa chữ, thông tin trùng, khoảng trắng, cân đối

- Bước 2 trước: tiêu đề + 3 mục gập + 4 thẻ "Chưa đủ điểm" là phần chiếm nhiều chiều cao nhất mà ít thông tin. Đã gọn lại.
- Điểm thi thử: câu "Thang 10, dấu phẩy hay chấm đều được. Môn để trống giữ điểm cũ." đứng riêng dưới lưới, hơi trùng với placeholder "Ví dụ 7,5". Giữ, vì giải thích hành vi môn trống.
- Card lệch cân đối: lưới 6 ô ở Bước 2 (3 cột) cân; lưới 4 thẻ tổ hợp (2x2) cân. Không phát hiện card lệch trong phạm vi.
- Khoảng trắng lớn: không có ở 390px sau khi sửa; màn thi thử có khoảng trắng đáy do thanh điều hướng, không đáng kể.
- Cuộn ngang: không có ở 320/360/390 ở hai màn đã kiểm.

## 3. Thuật ngữ gây hiểu nhầm

- "Điểm các môn" (không rõ loại điểm): đã gắn chip "Điểm thi thử".
- "Tổ hợp ... / 30" khác "điểm chuẩn": chưa có chú giải ở Bước 2; nên dùng `THUAT_NGU.diemChuan` ở màn kết quả (Agent 2/3).
- "Cập nhật kết quả" ở màn Điểm thi thử: chấp nhận được, nhưng "Lưu điểm thi thử" rõ hơn (chưa đổi để khỏi lệch test/route text của nhóm).

## 4. Thiếu trạng thái

- Trống: có (ô "–", "Còn thiếu ...", "Chưa có điểm").
- Có dữ liệu: có.
- Đang tải: Bước 2 dựa vào danh mục nạp lười ở màn kết quả; đã có `ChoDuLieu`.
- Lỗi nhập sai: có `role="alert"` (Bước 2) và `aria-invalid` + `aria-describedby` (thi thử).

## 5. Hợp đồng state

Hiện có (đọc từ `src/state/types.ts`, chưa thấy field mới của Agent 3 lúc kiểm cuối):

| Field | Ý nghĩa | Dùng cho |
|---|---|---|
| `HoSo.diem` | Điểm 6 môn em nhập ở hồ sơ (coi là "điểm hiện tại") | Bước 2 |
| `AppState.diemThi: DiemThi[]` | Chuỗi điểm thi thử theo ngày | Màn Điểm thi thử |
| `HoSo.diemThem` | Sử, Địa, GDKT&PL, Tin, Công nghệ | Bước 2 mục gập |
| `HoSo.hocBa`, `diemDgnl`, `chungChiNgoaiNgu` | Học bạ, ĐGNL, chứng chỉ | Mục gập "ĐGNL, IELTS & Học bạ" |
| `AppState.mucTieu.diemMucTieu` | Tổng điểm mục tiêu cho một ngành | Màn Mục tiêu |

Đề xuất cho Agent 3 (chưa ai sửa, Agent 1 không đụng `src/state/**`):

1. `HoSo.diemMucTieuMon?: Partial<Record<MonId, number | null>>`: điểm mục tiêu từng môn khi chưa thi thử. Tách hẳn khỏi `diem`; `diemHienTaiCuaTungMon` KHÔNG được đọc field này.
2. `HoSo.diemThiThat?: Partial<Record<MonId, number | null>>`: điểm thi thật sau kỳ thi 2027. Khi có thì ưu tiên cao nhất.
3. Hàm dẫn xuất `diemTheoLoai(s): { thiThat, thiThu, hocHienTai, mucTieu }` trong `src/state/chon.ts` hoặc `diem-hien-tai.ts`, trả kèm nguồn, để Khám phá/Nguyện vọng biết đang dùng loại nào và ghi nhãn đúng.
4. Cho phép `chuan-hoa.ts` bỏ qua field lạ cũ, không đổi khoá `nvai:v2`.
5. Khi có (1), Agent 1 sẽ thêm chế độ "Đặt điểm mục tiêu" ở Bước 2 (chip `mucTieu` và `LOAI_DIEM.mucTieu` đã sẵn sàng trong `src/features/khoi-dau/loai-diem.tsx`).

## 6. Thành phần dùng lại (Agent 1)

`src/features/khoi-dau/loai-diem.tsx`: `NhanLoaiDiem` (chip màu theo loại điểm), `ChuThichLoaiDiem` (hộp thu gọn giải thích bằng `THUAT_NGU`), `TienDoDiem` (thanh tiến độ có `role="progressbar"`, tôn trọng giảm chuyển động), hằng `LOAI_DIEM`.

### 5.1 Hợp đồng state đã triển khai (Agent 3, 2026-10-17)

Đã thêm đúng theo đề xuất ở trên; khoá `nvai:v2` và định dạng sao lưu (phiên bản 2) không đổi, bản cũ đọc được và không mất gì.

| Field / hàm | Cách dùng |
|---|---|
| `HoSo.diemThiThat?: Partial<Record<MonId, number \| null>>` | Điểm thi tốt nghiệp thật từng môn (0 đến 10). Khi có, là "điểm hiện tại" ưu tiên cao nhất. Thiếu = chưa có kết quả thật, KHÔNG tự điền. |
| `HoSo.diemMucTieuMon?: Partial<Record<MonId, number \| null>>` | Điểm em muốn đạt từng môn. `diemHienTaiCuaTungMon` không bao giờ đọc field này. |
| `diemTheoLoai(s)` trong `src/state/diem-hien-tai.ts` | Trả `{ thiThat, thiThu, hoSo, hienTai, hocHienTai (alias), mucTieu, nguon }`. `nguon[mon]` cho biết điểm hiện tại của môn đó là `thiThat` hay `thiThu` để ghi nhãn đúng. |
| `diemHienTaiCuaTungMon(s)` | Thứ tự: thi thật > thi thử mới nhất > điểm hồ sơ (thêm tầng thi thật, bản cũ không đổi). |
| `type LoaiDiem = "thiThu" \| "mucTieu" \| "thiThat" \| "hocBa"` | Tên loại điểm dùng chung (nhãn giải thích ở `noi-dung/du-bao.ts` `THUAT_NGU`). |
| `chuanHoa` (`chuan-hoa.ts`) | Hai field mới được kiểm: chỉ nhận số 0 đến 10, khoá lạ bị bỏ; không có thì để `undefined`. |

Ghi vào store bằng cách cập nhật `hoSo` (ví dụ qua hàm cập nhật hồ sơ có sẵn), không có khoá localStorage mới. Chưa có hàm riêng trong store: Agent 1 gọi cập nhật hồ sơ với `{ diemThiThat: {...} }` hoặc `{ diemMucTieuMon: {...} }`.

Hợp đồng dữ liệu điểm chuẩn (mọi màn dùng chung): `src/engine/tom-tat-nganh.ts` `tomTatDiemChoNganh(lc, diemEm, tk, namDuBao)` trả `TomTatDiemNganh` (trạng thái, điểm chuẩn gần nhất hợp lệ, dự báo, nhãn, chênh, vị trí trong khoảng dự báo, `moTa` định tính). Ngành chỉ có điểm sàn 15,0, khác phương thức hoặc thiếu điểm thì `soSanhDuoc=false`, `nhan=null`, kèm `lyDoKhongSo`.

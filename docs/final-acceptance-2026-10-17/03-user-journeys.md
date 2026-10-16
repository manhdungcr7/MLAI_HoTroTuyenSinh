# 03 — USER JOURNEYS (KIỂM THỬ THỰC TẾ 5 CHÂN DUNG NGƯỜI DÙNG)

Báo cáo này ghi lại kết quả kiểm thử End-to-End bằng trình duyệt thật (**Google Chrome + Playwright**) trên `https://nguyenvongai.pages.dev` và bản build đã vá lỗi (`dist/`).
- **Tổng số bước chụp màn hình**: `56` ảnh từng bước tại `evidence/personas/` + `10` ảnh hành trình lõi tại `evidence/presentation/10-step-journey/`.
- **Báo cáo máy đọc**: `evidence/personas/personas-e2e-report.json` & `evidence/personas/REPORT.md`.

---

## 1. Bảng tổng hợp 5 Chân dung người dùng (5 Personas)

| Chân dung | Mô tả hồ sơ đầu vào | Console / Network Errors | Kết quả trước sửa | Kết quả sau sửa | Bằng chứng ảnh chụp |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **Persona A — Học sinh lớp 11** | Lớp 11, Đà Nẵng, chưa có điểm thi THPT, có học bạ (8,2 / 8,5), quan tâm CNTT, làm trắc nghiệm hướng nghiệp | `0` / `0` | **PASS** *(có ghi chú P2 ở `/ke-hoach/tuan` khi chưa chọn mục tiêu)* | **PASS (100%)** *(đã mở nút `"Tạo lịch ôn nền tảng"` 3 môn chung)* | `evidence/personas/persona-a-01..08.png` & `evidence/before-after/03-after-lop11-ke-hoach-tuan-light-plan.png` |
| **Persona B — Học sinh lớp 12 chưa có điểm thi** | Lớp 12, TP.HCM, điểm thi thử Toán `7,5`, Lý `6,0` (điểm nghẽn), Anh `8,2` (tổ hợp A01 = `21,70`), mục tiêu CNTT UIT (`26,6`) | `0` / `0` | **PASS** | **PASS (100%)** | `evidence/personas/persona-b-01..10.png` |
| **Persona C — Học sinh đã có điểm thi** | Lớp 12, điểm thi Toán `8,5`, Lý `8,25`, Hóa `8,0`, Văn `7,0`, Anh `8,5`, khu vực `KV2-NT`, ngân sách `20–40 tr`, xếp 7 nguyện vọng | `0` / `0` | **FAIL (P1-01)** *(hiện `"xác suất undefined%"` khi có ngành B00 thiếu môn Sinh & cộng ưu tiên 2 lần)* | **PASS (100%)** *(sửa triệt để `P0-01` & `P1-01`)* | `evidence/personas/persona-c-01..09.png` & `evidence/before-after/01-after-nguyen-vong-clean-probability.png` |
| **Persona D — Học sinh ngân sách hạn chế** | Lớp 12, ngân sách `< 15 triệu/năm` (và `≤ 20 triệu`), tìm trường công lập, đối chiếu học phí chính thức vs ước tính | `0` / `0` | **PASS** | **PASS (100%)** | `evidence/personas/persona-d-01..07.png` |
| **Persona E — Người dùng quay lại sau nhiều ngày** | Đã có hồ sơ, nguyện vọng, lịch học, hoàn thành 2 buổi học; reload, mở tab mới, xuất/xóa/khôi phục file JSON, chia sẻ phụ huynh | `0` / `0` | **PASS** | **PASS (100%)** | `evidence/personas/persona-e-01..12.png` & `evidence/personas/persona-e-backup.json` |

---

## 2. Chi tiết từng hành trình (Input -> Thao tác -> Expected vs Actual)

### Persona A — Học sinh lớp 11 (`dinhHuong`)
- **Input đầu vào**: Khối `11`, Tỉnh `Đà Nẵng`, Ngành quan tâm `Công nghệ thông tin`, Điểm học bạ ĐTB lớp 10 = `8,2`, lớp 11 = `8,5` (không nhập điểm thi THPT). Ngân sách `Dưới 20 triệu/năm`, Chỗ ở `Ở cùng gia đình`.
- **Các thao tác thực tế**:
  1. Mở `/chao` -> bấm **Bắt đầu hồ sơ của bạn** -> chọn **Lớp 11**, tỉnh **Đà Nẵng**, nhóm ngành **Công nghệ thông tin** (`persona-a-01`, `persona-a-02`).
  2. Sang `/bat-dau/2`: Để trống 6 ô điểm thi THPT -> mở mục **Điểm học bạ & ĐGNL** -> nhập ĐTB lớp 10 (`8,2`), lớp 11 (`8,5`) -> bấm **Tiếp tục** (`persona-a-03`).
  3. Sang `/bat-dau/3`: Chọn ngân sách `< 20 triệu/năm` -> bấm **Xem gợi ý của bạn** (`persona-a-04`).
  4. Kiểm tra `/` (`Hôm nay`): Hệ thống nhận diện `changCuaEm(s) === "dinhHuong"`, hiển thị thẻ định hướng sớm cho lớp 11, **không hiển thị đồng hồ đếm ngược ngày thi gây áp lực** (`persona-a-05`).
  5. Mở `/huong-nghiep`: Hoàn thành 10 câu hỏi trắc nghiệm sở thích nghề nghiệp (`persona-a-06`).
  6. Mở `/kham-pha` và `/ke-hoach/tuan`: Lọc ngành theo ngân sách và bấm **Tạo lịch ôn nền tảng** (`persona-a-07`, `03-after-lop11-ke-hoach-tuan-light-plan.png`).
- **Expected vs Actual**: Không bắt buộc nhập điểm thi chưa tồn tại; phân biệt rõ điểm học bạ/mục tiêu với điểm chính thức; tạo được lịch ôn nền tảng 3 môn chung ngay cả khi chưa chốt trường mục tiêu.
- **Kết quả**: **PASS** (`0` console error, `0` network error).

### Persona B — Học sinh lớp 12 chưa có điểm thi (`chuaThi`)
- **Input đầu vào**: Khối `12`, Tỉnh `TP. Hồ Chí Minh`, Điểm hiện tại: Toán `7,5`, Vật lý `6,0`, Tiếng Anh `8,2` (tổ hợp `A01` = `21,70`). Mục tiêu: CNTT — ĐH Công nghệ Thông tin ĐHQG TP.HCM (`qsc-24737475`, điểm chuẩn `26,60`).
- **Các thao tác thực tế**:
  1. Nhập điểm tại `/bat-dau/2` -> ngay tại `/bat-dau/3`, khung **Phát hiện điểm nghẽn tổ hợp** chỉ rõ: *"Tổ hợp mạnh nhất hiện tại: A01 (21,7 điểm). Điểm nghẽn lớn nhất là môn Vật lý (6,0 điểm) — đang thấp hơn môn cao nhất tới 2,2 điểm"* (`persona-b-03`).
  2. Vào `/diem-thi-thu`: Nhập thêm đợt thi thử mới (Toán `7,8`, Lý `6,5`, Anh `8,3`) -> bấm **Lưu điểm thi thử** -> chuyển sang `/diem-thi-thu/ket-qua` xem biểu đồ tiến bộ (`persona-b-05`, `persona-b-06`).
  3. Vào `/ke-hoach/muc-tieu` và `/ke-hoach/muc-tieu/mon-keo-diem`: Xem giải thích tổ hợp `A01`, điều kiện xét tuyển và phân tích lợi suất cận biên vì sao nâng Vật lý từ `6,5 -> 7,8` khả thi hơn nâng Tiếng Anh từ `8,3 -> 9,5` (`persona-b-07`, `persona-b-08`).
  4. Vào `/ke-hoach/tuan`: Bấm **Tạo việc và xếp lịch** -> hệ thống tự động sinh các buổi tự học ưu tiên môn Vật lý (`mucUuTien: "cao"`) vào khung giờ trống buổi tối (`persona-b-09`, `persona-b-10`).
- **Expected vs Actual**: Hiểu đúng điểm thi thử gần nhất (`diemHienTaiCuaTungMon`), giải thích rõ tổ hợp và điểm nghẽn, kế hoạch tuần gắn chặt với môn kéo điểm.
- **Kết quả**: **PASS** (`0` console error, `0` network error).

### Persona C — Học sinh đã có điểm thi (`daCoDiem`)
- **Input đầu vào**: Toán `8,5`, Lý `8,25`, Hóa `8,0`, Văn `7,0`, Anh `8,5` (`A01 = 25,25`, `A00 = 25,00`), ưu tiên `KV2-NT` (mức gốc `0,50`), ngân sách `20–40 triệu/năm`.
- **Các thao tác thực tế**:
  1. Kiểm tra công thức điểm ưu tiên giảm dần: Với `A01 = 25,25` ($\ge 22,5$), điểm ưu tiên thực tế = $((30 - 25,25) / 7,5) \times 0,5 = 0,3166... \rightarrow +0,32$, tổng điểm xét tuyển = **`25,57`** (`persona-c-02`).
  2. Vào `/kham-pha`: Chọn ngành đủ điểm (`spk-548bb8c3`), ngành thử sức (`qsc-24737475`), và 1 ngành xét tổ hợp `B00` thiếu môn Sinh (`qst-7145cb30`) -> hệ thống hiển thị rõ nhãn **`Chưa đủ điểm`** kèm lý do *"Bạn chưa nhập điểm Sinh học"* (`persona-c-05`).
  3. Thêm 7 nguyện vọng vào `/nguyen-vong`: Hệ thống hiển thị thông báo nhẹ *"Bạn đang có 7 nguyện vọng · Khoảng 5–6 nguyện vọng là dễ cân nhắc nhất"*, phát hiện nghịch đảo thứ tự và cho phép bấm **Tự động chỉnh thứ tự chuẩn ngay** (`01-after-nguyen-vong-clean-probability.png`).
  4. Mở `/nguyen-vong/an-toan` và reload trang (`F5`): Toàn bộ thứ tự nguyện vọng và điểm số giữ nguyên 100%, mọi chỉ số cơ hội đều ghi rõ *"Cơ hội tham khảo ~X%"*.
- **Expected vs Actual**: Sau khi vá `P0-01` và `P1-01`, điểm ưu tiên chỉ cộng đúng 1 lần duy nhất (`25,57`) và không còn lỗi `"undefined%"` khi có ngành thiếu môn.
- **Kết quả**: **PASS** (`0` console error, `0` network error).

### Persona D — Học sinh ngân sách hạn chế
- **Input đầu vào**: Ngân sách `< 20 triệu/năm`, tìm trường công lập tại TP.HCM và miền Trung.
- **Các thao tác thực tế**:
  1. Vào `/kham-pha/bo-loc`: Chọn mức học phí `≤ 20 triệu/năm` -> danh sách rút gọn còn các chương trình phù hợp ngân sách (`persona-d-02`, `persona-d-03`).
  2. Mở chi tiết ngành Sư phạm và Kỹ thuật công lập (`/kham-pha/:id`): Hiển thị rõ chính sách hỗ trợ học phí Sư phạm theo Nghị định 116, phân biệt rõ `"Học phí / năm (dự kiến)"` có link đề án PDF với `"Học phí / năm (ước tính)"` và `"Chưa có dữ liệu"` (`persona-d-04`, `persona-d-05`).
  3. Mở `/so-sanh` và thêm thử 1 chương trình học phí 45 triệu/năm vào `/nguyen-vong`: Thẻ chẩn đoán danh mục cảnh báo đỏ *"Có 1 nguyện vọng (NV...) có học phí vượt ngân sách dự kiến của gia đình"* (`persona-d-06`, `persona-d-07`).
- **Kết quả**: **PASS** (`0` console error, `0` network error).

### Persona E — Người dùng quay lại sau nhiều ngày
- **Input đầu vào**: Hồ sơ đã có 4 nguyện vọng, lịch học tuần và đã tích hoàn thành `2` buổi học tại `/ke-hoach/tuan`.
- **Các thao tác thực tế**:
  1. Tải lại trang (`page.reload()`) và mở tab mới cùng origin: Toàn bộ hồ sơ, danh sách nguyện vọng và trạng thái `2` buổi học đã xong được khôi phục chính xác 100% (`persona-e-03`, `persona-e-04`).
  2. Vào `/ho-so/cai-dat`: Bấm **Tải bản sao lưu** -> lưu tệp `persona-e-backup.json` (`persona-e-06`).
  3. Bấm **Xóa hết và làm lại** -> xác nhận trên `HopTruot` -> ứng dụng trở về trạng thái trống (`persona-e-07`, `persona-e-08`).
  4. Quay lại `/ho-so/cai-dat` -> nạp tệp `persona-e-backup.json` vào ô **Khôi phục từ tệp sao lưu** -> toàn bộ hồ sơ, 4 nguyện vọng và tiến độ 2 buổi học khôi phục nguyên vẹn 100% (`persona-e-09`, `persona-e-10`).
  5. Kiểm tra `/ho-so/chia-se` và `/dong-hanh`: Liên kết chia sẻ mở được trang đồng hành cho phụ huynh kèm đầy đủ nguyện vọng và mục tiêu (`persona-e-11`, `persona-e-12`).
- **Kết quả**: **PASS** (`0` console error, `0` network error).

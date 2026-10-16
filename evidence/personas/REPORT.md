# Báo cáo Nghiệm thu E2E 5 Personas trên Trình duyệt Thật (Agent E — E2E QA Engineer)

- **Ngày thực thi**: 2026-10-16
- **Môi trường kiểm thử**: Production (`https://nguyenvongai.pages.dev`) qua `playwright-core` điều khiển trình duyệt **Google Chrome thật** (`C:/Program Files/Google/Chrome/Application/chrome.exe`), viewport Mobile chuẩn `390x844`.
- **Thư mục bằng chứng (56 ảnh chụp màn hình + JSON report + file backup JSON)**: `D:\07-Competitions-Hackathons\mlai\nguyenvongai\evidence\personas\`
  - Báo cáo máy đọc đầy đủ: [personas-e2e-report.json](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/personas/personas-e2e-report.json)
  - Tệp sao lưu thực tế xuất từ Persona E: [persona-e-backup.json](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/personas/persona-e-backup.json)

---

## 1. Bảng Tổng hợp Kết quả 5 Personas

| Persona | Mô tả đối tượng | Số bước & Ảnh chụp | Console Errors | Page Errors | Network / HTTP Errors | Kết quả | Ghi chú phát hiện |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **Persona A** | Học sinh lớp 11 (`dinhHuong`, chưa có điểm THPT, chỉ có Học bạ 10–11) | 12 ảnh | `0` | `0` | `0` / `0` | **PASS** | Không đếm ngược gây áp lực; phân biệt rõ Điểm mục tiêu (`27,1`) và Điểm hiện tại (`— / 30` · `"Điểm học bạ, chỉ để so tham khảo"`). |
| **Persona B** | Học sinh lớp 12 chưa có điểm thi (`nuocRut`, có Học bạ & điểm thi thử A01 lệch môn Lý) | 9 ảnh | `0` | `0` | `0` / `0` | **PASS** *(có 1 lưu ý Low)* | `/ke-hoach/muc-tieu`, `/ke-hoach/muc-tieu/mon-keo-diem`, `/ke-hoach/tuan` đều ưu tiên môn nghẽn **Vật lý (+3,5đ)**. Lưu ý: thẻ gợi ý điểm nghẽn ngay tại `/bat-dau/2` mới có ở working tree local chưa deploy lên Production. |
| **Persona C** | Học sinh đã có điểm thi (`Toán 8.5, Lý 8.25, Hóa 8.0, Văn 7.0, Anh 8.5`, `KV2-NT`) | 11 ảnh | `0` | `0` | `0` / `0` | **PASS** *(có 1 bug UI Medium)* | Công thức ưu tiên giảm dần từ 22.5 tính chuẩn xác (`+0,32`, tổng `25,6`); phát hiện thiếu môn Sinh học (`B00`); nhắc khi `> 6` nguyện vọng; giải thích rõ không phải xác suất đậu. **Phát hiện 1 bug Medium**: `ChanDoanDanhMucCard` hiển thị `"xác suất undefined%"` khi 1 nguyện vọng thiếu điểm môn tổ hợp. |
| **Persona D** | Học sinh ngân sách hạn chế (`< 15–20 triệu/năm`, lọc khu vực & so sánh) | 10 ảnh | `0` | `0` | `0` / `0` | **PASS** *(có 1 lưu ý Low)* | Tìm kiếm tự nhiên `"cntt sài gòn dưới 15 triệu"` tự hiểu `Học phí ≤ 15tr`; cảnh báo vượt ngân sách rõ ràng; ghi nhãn `(ước tính)` minh bạch. **Lưu ý Low**: số thập phân học phí ước tính dùng dấu chấm `≈ 15.2` thay vì dấu phẩy `15,2`. |
| **Persona E** | Người dùng quay lại sau nhiều ngày (Lưu trữ, đánh dấu 2 buổi học, sao lưu/khôi phục JSON, chia sẻ `/dong-hanh`, kết nối MCP) | 14 ảnh | `0` | `0` | `0` / `0` | **PASS** | Giữ nguyên 100% dữ liệu sau reload & mở tab mới; xuất JSON (`12.780 bytes`) -> xóa sạch -> khôi phục khớp 100%; liên kết `/dong-hanh` và mã kết nối Claude/ChatGPT hoạt động trọn vẹn. |

---

## 2. Chi tiết Kiểm thử từng Persona

### Persona A — Học sinh lớp 11 (`PASS`)
- **Input đã nhập**:
  - Họ tên: `Trần Minh Khôi` · Lớp: `Lớp 10–11` (`khoi = 11`, `changCuaEm = "dinhHuong"`) · Tỉnh: `Đà Nẵng` · Ngành quan tâm: `Công nghệ thông tin`, `Kinh tế & Quản trị`.
  - Điểm THPT: Để trống hoàn toàn (chưa thi).
  - Điểm xét tuyển sớm & Học bạ (`#bd-dtb-lop10`, `#bd-dtb-lop11`): ĐTB Lớp 10 = `8,2`, ĐTB Lớp 11 = `8,5`.
  - Ngân sách: `Dưới 30 triệu` · Chỗ ở: `Ở nhà` · Khu vực ưu tiên học: `Đà Nẵng`.
- **Hành động cụ thể**:
  1. Đi từ `/chao` -> `/bat-dau/1` -> `/bat-dau/2` (mở khối Học bạ nhập điểm lớp 10 & 11, để trống điểm thi THPT) -> `/bat-dau/3` -> bấm `Khám phá ngành hợp em`.
  2. Kiểm tra `/hom-nay` (`/#/`): Xác nhận thông điệp chặng định hướng, không hiển thị đồng hồ đếm ngược ngày thi THPT gây áp lực.
  3. Mở `/huong-nghiep`, làm trọn vẹn 12 câu trắc nghiệm tình huống Holland (RIASEC) -> nhận kết quả nhóm tính cách và nhóm ngành gợi ý.
  4. Mở `/kham-pha`, chọn ngành CNTT tại ĐH Bách Khoa - ĐH Đà Nẵng (`ddk-bc06675a`) và bấm `Đặt mục tiêu`.
  5. Kiểm tra `/ke-hoach/muc-tieu`, quay lại `/hom-nay` và mở `/ke-hoach/tuan`.
- **Expected Output**:
  - Không ép nhập điểm thi THPT ở Bước 2; nhận diện đúng học sinh lớp 10–11 (`dinhHuong`).
  - Không đếm ngược số ngày thi THPT trên `/hom-nay` và `/ke-hoach/muc-tieu`.
  - Phân biệt rõ **Điểm mục tiêu** (`27,1 / 30`) với **Điểm hiện tại** (`— / 30` kèm ghi chú `"Điểm học bạ, chỉ để so tham khảo"`), không lấy điểm học bạ giả làm điểm thi THPT chính thức.
- **Actual Output**:
  - Khớp 100% kỳ vọng. Trên `/hom-nay` hiển thị: *"Bạn chưa cần chốt mục tiêu ngay. Khám phá và lưu vài ngành thấy hợp trước đã"* và khi đã đặt mục tiêu hiển thị rõ: `"Hiện tại: — · Mục tiêu: 27,1 · Còn thiếu: — · Điểm học bạ, chỉ để so tham khảo"`.
- **Lỗi Console / Network**: `0 console.error`, `0 pageerror`, `0 network error`, `0 HTTP 4xx/5xx`.
- **Bằng chứng ảnh chụp**:
  - [persona-a-01-chao.png](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/personas/persona-a-01-chao.png)
  - [persona-a-02-buoc1.png](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/personas/persona-a-02-buoc1.png)
  - [persona-a-03-buoc2-hocba.png](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/personas/persona-a-03-buoc2-hocba.png)
  - [persona-a-04-buoc3.png](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/personas/persona-a-04-buoc3.png)
  - [persona-a-05-hom-nay.png](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/personas/persona-a-05-hom-nay.png)
  - [persona-a-06-huong-nghiep-intro.png](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/personas/persona-a-06-huong-nghiep-intro.png)
  - [persona-a-07-huong-nghiep-ket-qua.png](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/personas/persona-a-07-huong-nghiep-ket-qua.png)
  - [persona-a-08-kham-pha.png](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/personas/persona-a-08-kham-pha.png)
  - [persona-a-09-chi-tiet-nganh.png](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/personas/persona-a-09-chi-tiet-nganh.png)
  - [persona-a-10-muc-tieu-lop11.png](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/personas/persona-a-10-muc-tieu-lop11.png)
  - [persona-a-11-hom-nay-co-muc-tieu.png](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/personas/persona-a-11-hom-nay-co-muc-tieu.png)
  - [persona-a-12-ke-hoach-tuan.png](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/personas/persona-a-12-ke-hoach-tuan.png)

---

### Persona B — Học sinh lớp 12 chưa có điểm thi (`PASS`)
- **Input đã nhập**:
  - Họ tên: `Lê Hoàng Nam` · Lớp: `Lớp 12` · Tỉnh: `TP. Hồ Chí Minh` · Ngành quan tâm: `Công nghệ thông tin`.
  - Điểm dự kiến tổ hợp A01 ở Bước 2: `Toán = 7,5`, `Vật lý = 6,0` (môn kéo điểm / điểm nghẽn), `Tiếng Anh = 8,2` (tổng A01 = `21,7`).
  - Học bạ 3 năm: Lớp 10 = `8,0`, Lớp 11 = `8,2`, Lớp 12 = `8,4`.
  - Môn muốn cải thiện: `Vật lý` · Kỹ năng muốn rèn: `Quản lý thời gian`.
  - Điểm thi thử mới nhập thêm tại `/diem-thi-thu`: `Toán = 7,8` (`+0,3`), `Vật lý = 6,3` (`+0,3`) -> tổng A01 tăng từ `21,7 -> 22,3`.
- **Hành động cụ thể**:
  1. Nhập hồ sơ qua `/bat-dau/1` -> `/bat-dau/2` -> `/bat-dau/3` -> bấm `Phân tích cơ hội` và `Lưu lộ trình & bắt đầu`.
  2. Vào `/diem-thi-thu`, cập nhật đợt thi thử mới (`Toán 7,8`, `Lý 6,3`) -> bấm `Lưu & xem thay đổi` -> kiểm tra `/diem-thi-thu/ket-qua`.
  3. Vào `/ke-hoach/muc-tieu` và `/ke-hoach/muc-tieu/mon-keo-diem`, mở hộp giải thích chi tiết môn Vật lý.
  4. Vào `/ke-hoach/tuan`, bấm `Tạo việc và xếp lịch` để hệ thống tự động sinh công việc học tập theo môn kéo điểm.
- **Expected Output**:
  - `/diem-thi-thu/ket-qua` tính đúng chênh lệch từng môn (`Toán 7,5 → 7,8`, `Lý 6,0 → 6,3`, `A01 21,7 → 22,3`) và chỉ ra các trường tăng cơ hội (`Vừa sức → An toàn`).
  - `/ke-hoach/muc-tieu` và `/ke-hoach/muc-tieu/mon-keo-diem` phát hiện chính xác **Vật lý** là môn kéo điểm cần ưu tiên số 1 (`còn thiếu +3,5`, gắn nhãn `Nên ưu tiên`).
  - `/ke-hoach/tuan` tự động xếp việc ưu tiên cho môn **Vật lý** lên đầu danh sách `Nên làm trước`.
- **Actual Output**:
  - `/ke-hoach/muc-tieu` hiển thị rõ: *"Bạn đang thiếu chủ yếu ở môn Vật lý. Vật lý còn thiếu 3,5 điểm, nhiều nhất trong tổ hợp A01. Tập trung môn này sẽ thu hẹp khoảng cách nhanh hơn."*
  - `/ke-hoach/muc-tieu/mon-keo-diem` xếp **Vật lý** ở vị trí đầu tiên (`Nên ưu tiên`, Đề xuất bù `+3,5` cho Vật lý, `+1,4` cho Toán, `+1,1` cho Tiếng Anh).
  - `/ke-hoach/tuan` tạo thẻ mục tiêu hôm nay: *"Bù +3,5 điểm cho Vật lý · Ưu tiên: Vật lý – làm nửa đề tính giờ"* và đưa việc ôn Vật lý lên đầu nhóm `Nên làm trước`.
  - *Lưu ý nhỏ (Low)*: Trong working tree local (`src/features/khoi-dau/buoc-2.tsx`) có thêm khối gợi ý điểm nghẽn inline ngay tại Bước 2 (`phanTichDiemNghen`), hiện chưa được deploy lên bản Production (`nguyenvongai.pages.dev`). Tuy nhiên ở các màn `/ke-hoach/muc-tieu` và `/ke-hoach/muc-tieu/mon-keo-diem` trên Production đã hoạt động đầy đủ.
- **Lỗi Console / Network**: `0 console.error`, `0 pageerror`, `0 network error`, `0 HTTP 4xx/5xx`.
- **Bằng chứng ảnh chụp**:
  - [persona-b-01-buoc1.png](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/personas/persona-b-01-buoc1.png)
  - [persona-b-02-buoc2-diem-nghen.png](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/personas/persona-b-02-buoc2-diem-nghen.png)
  - [persona-b-03-man-phan-tich.png](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/personas/persona-b-03-man-phan-tich.png)
  - [persona-b-04-diem-thi-thu-nhap.png](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/personas/persona-b-04-diem-thi-thu-nhap.png)
  - [persona-b-05-diem-thi-thu-ket-qua.png](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/personas/persona-b-05-diem-thi-thu-ket-qua.png)
  - [persona-b-06-muc-tieu.png](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/personas/persona-b-06-muc-tieu.png)
  - [persona-b-07-mon-keo-diem.png](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/personas/persona-b-07-mon-keo-diem.png)
  - [persona-b-08-mon-keo-diem-giai-thich.png](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/personas/persona-b-08-mon-keo-diem-giai-thich.png)
  - [persona-b-09-ke-hoach-tuan.png](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/personas/persona-b-09-ke-hoach-tuan.png)

---

### Persona C — Học sinh đã có điểm thi (`PASS` — *kèm 1 phát hiện Bug UI mức Medium*)
- **Input đã nhập**:
  - Họ tên: `Nguyễn Quốc Bảo` · Lớp: `Đã tốt nghiệp` (`daCoDiem`) · Tỉnh: `Nghệ An`.
  - Điểm thi thật: `Toán = 8,5`, `Vật lý = 8,25`, `Hóa học = 8,0`, `Ngữ văn = 7,0`, `Tiếng Anh = 8,5`, `Sinh học = (để trống)`.
  - Khu vực ưu tiên: `KV2-NT` (`+0,5` điểm gốc), Đối tượng ưu tiên: `Không thuộc đối tượng ưu tiên` (`+0`).
- **Hành động cụ thể**:
  1. Kiểm tra công thức tính điểm ưu tiên giảm dần tại `/bat-dau/2` khi tổng điểm 3 môn $\ge 22,5$.
  2. Vào `/nguyen-vong`, bấm `Gợi ý danh sách` -> `Lưu cả 6 ngành vào danh sách`.
  3. Bấm `Tìm ngành để thêm`, gõ tìm `Y khoa` (ngành xét tổ hợp `B00` cần môn Sinh học mà thí sinh chưa nhập điểm) và thêm vào làm Nguyện Vọng 7.
  4. Kiểm tra thông báo khi danh sách vượt quá 6 nguyện vọng (`SO_NV_GOI_Y = 6`), kiểm tra phát hiện thiếu điểm môn Sinh học, bấm nút đổi thứ tự NV1 xuống NV2.
  5. Vào `/nguyen-vong/an-toan`, mở hộp giải thích `Cách xếp nhãn` và `Cách tính` độ cân bằng `/100`.
  6. Reload lại `/nguyen-vong` kiểm tra tính toàn vẹn của thứ tự nguyện vọng.
- **Expected Output**:
  - Tổ hợp cao nhất `A01` = $8,5 + 8,25 + 8,5 = 25,25$. Vì $25,25 \ge 22,5$, điểm ưu tiên thực cộng = $\frac{30 - 25,25}{7,5} \times 0,5 = 0,3166... \approx +0,32$, tổng điểm xét tuyển hiển thị `25,6` ($25,25 + 0,32 = 25,57$, làm tròn 1 chữ số thập phân = `25,6`).
  - Khi thêm ngành thứ 7, hiện thông báo nhắc: `"Bạn đang có 7 nguyện vọng · Khoảng 5–6 nguyện vọng là dễ cân nhắc nhất"`.
  - Ngành Y khoa (`DDY`, xét `B00`) phải báo rõ `"Bạn chưa nhập điểm Sinh học"`, không tự gán điểm 0.
  - Hộp giải thích tại `/nguyen-vong/an-toan` nêu rõ điểm chuẩn mỗi năm có thể dao động và `"Đây là điểm gợi ý trên 100, không phải khả năng đậu"`.
  - Sau khi đổi thứ tự và reload trang, thứ tự nguyện vọng giữ nguyên 100%.
- **Actual Output**:
  - Công thức ưu tiên giảm dần chính xác tuyệt đối: hiển thị `A01: 25,6 (25,3 +0,32 ưu tiên)`.
  - Thông báo vượt 6 nguyện vọng, phát hiện thiếu điểm Sinh học (`"Nguyện Vọng 7 · DDY – Y khoa: Bạn chưa nhập điểm Sinh học"`), giải thích bất định điểm chuẩn và miễn trừ xác suất đậu đều hiển thị đúng.
  - Đổi thứ tự NV1 ↔ NV2 và reload trang giữ nguyên 100% trong `localStorage` (`nguyen-vong-ai-v1`).
  - **Phát hiện Bug UI (Severity: Medium)**: Khi trong danh sách có 1 nguyện vọng thiếu điểm môn tổ hợp (như `NV7 - Y khoa - DDY` thiếu môn Sinh học nên `thongSo = null`), hàm `danhGiaDanhMucToanDien` trong `src/engine/toi-uu-nguyen-vong.ts` (dòng 123–129) gán mặc định `pSau = nvSau.thongSo?.xacSuat ?? 0.5` rồi ghép chuỗi cảnh báo nghịch đảo thứ tự với `${nvSau.thongSo?.phanTram}%`, dẫn đến câu cảnh báo trên thẻ `ChanDoanDanhMucCard` bị in ra chữ **`"xác suất undefined%"`**:
    > `• NV2 (Công nghệ thông tin (định hướng ứng dụng) - BVH, xác suất đỗ 80%) đang đứng TRƯỚC NV7 (Y khoa - DDY, xác suất undefined%).`
- **Lỗi Console / Network**: `0 console.error`, `0 pageerror`, `0 network error`, `0 HTTP 4xx/5xx`.
- **Bằng chứng ảnh chụp**:
  - [persona-c-01-buoc1.png](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/personas/persona-c-01-buoc1.png)
  - [persona-c-02-buoc2-uutien.png](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/personas/persona-c-02-buoc2-uutien.png)
  - [persona-c-03-phan-tich.png](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/personas/persona-c-03-phan-tich.png)
  - [persona-c-04-goi-y-sheet.png](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/personas/persona-c-04-goi-y-sheet.png)
  - [persona-c-05-tim-nganh-thieu-mon.png](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/personas/persona-c-05-tim-nganh-thieu-mon.png)
  - [persona-c-06-danh-sach-7-nv.png](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/personas/persona-c-06-danh-sach-7-nv.png)
  - [persona-c-07-sau-sap-xep.png](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/personas/persona-c-07-sau-sap-xep.png)
  - [persona-c-08-nguyen-vong-an-toan.png](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/personas/persona-c-08-nguyen-vong-an-toan.png)
  - [persona-c-09-cach-xep-nhan.png](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/personas/persona-c-09-cach-xep-nhan.png)
  - [persona-c-10-khong-nham-xac-suat.png](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/personas/persona-c-10-khong-nham-xac-suat.png)
  - [persona-c-11-reload-nguyen-vong.png](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/personas/persona-c-11-reload-nguyen-vong.png)

---

### Persona D — Học sinh ngân sách hạn chế (`PASS` — *kèm 1 lưu ý định dạng số Low*)
- **Input đã nhập**:
  - Họ tên: `Phạm Thị Mai` · Lớp: `Lớp 12` · Tỉnh: `TP. Hồ Chí Minh` · Ngành quan tâm: `CNTT`, `Sư phạm`.
  - Điểm: `Toán = 8,0`, `Vật lý = 8,0`, `Tiếng Anh = 8,0` (`24,0` điểm).
  - Ngân sách gia đình ở Bước 3: `Dưới 30 triệu` + `Ký túc xá` (hệ thống gợi ý mức học phí an toàn `Dưới 20 triệu/năm`).
  - Lọc tại `/kham-pha/bo-loc`: Học phí tối đa `Dưới 20 triệu`, Khu vực `TP.HCM`.
  - Tìm kiếm tự nhiên tại `/kham-pha`: `"cntt sài gòn dưới 15 triệu"`.
- **Hành động cụ thể**:
  1. Thiết lập ngân sách `Dưới 30 triệu` + `Ký túc xá` tại `/bat-dau/3`.
  2. Lọc ngành tại `/kham-pha/bo-loc` với `Dưới 20 triệu` và `TP.HCM`.
  3. Gõ câu tìm kiếm tự nhiên `"cntt sài gòn dưới 15 triệu"` vào ô tìm kiếm `/kham-pha`.
  4. Lọc các ngành `Trên 40 triệu` để kiểm tra cảnh báo vượt ngân sách trên thẻ `/kham-pha` và trang chi tiết `/kham-pha/qst-257323bc`.
  5. Mở trang so sánh `/so-sanh?a=tdm-93607471&b=qst-257323bc` giữa ngành học phí thấp (`Sư phạm Toán - TDM`, `≈ 15.2 triệu/năm`) và ngành học phí cao (`Khoa học máy tính CTTT - QST`, `≈ 70 triệu/năm`), sau đó bấm `Đổi ngành` sang ngành Sư phạm khác (`c19-f2b80438`).
- **Expected Output**:
  - Ô tìm kiếm tự nhiên hiểu đúng ràng buộc `Học phí ≤ 15tr`, `Khu vực: TP.HCM`, `Ngành: CNTT`.
  - Ngành học phí cao (`≈ 70 triệu/năm`) hiển thị cảnh báo rõ ràng: `"Học phí vượt ngân sách"` / `"Học phí ≈ 70 triệu/năm (ước tính) vượt ngân sách 30 tr của bạn"`.
  - Phân biệt rõ học phí có nguồn đề án và học phí ước tính theo nhóm trường (`Học phí / năm (ước tính)`, dấu `≈`, và chú thích `"Ước tính theo trường và khối ngành — xem đề án trường để biết mức chính thức"`).
  - Bảng `/so-sanh` tô nền xanh lá cho bên có học phí thấp hơn và tóm tắt chênh lệch (`"TDM có học phí thấp hơn khoảng 55 triệu/năm"`).
- **Actual Output**:
  - Tất cả tính năng lọc học phí, tìm kiếm tự nhiên `< 15 triệu`, cảnh báo vượt ngân sách, nhãn `(ước tính)` và bảng so sánh hoạt động chính xác.
  - *Lưu ý nhỏ (Severity: Low)*: Hàm `hocPhiChu` trong `src/data/lua-chon-phu.ts` (dòng 11) nối chuỗi trực tiếp `` `${l.hocPhiMin}` `` thay vì qua `dinhDang()`, nên số thập phân học phí ước tính hiển thị dấu chấm (`≈ 15.2 triệu đồng`) trong khi điểm chuẩn hiển thị dấu phẩy chuẩn tiếng Việt (`25,9 điểm`).
- **Lỗi Console / Network**: `0 console.error`, `0 pageerror`, `0 network error`, `0 HTTP 4xx/5xx`.
- **Bằng chứng ảnh chụp**:
  - [persona-d-01-buoc3-ngan-sach.png](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/personas/persona-d-01-buoc3-ngan-sach.png)
  - [persona-d-02-bo-loc-duoi20.png](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/personas/persona-d-02-bo-loc-duoi20.png)
  - [persona-d-03-kham-pha-da-loc.png](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/personas/persona-d-03-kham-pha-da-loc.png)
  - [persona-d-04-tim-duoi-15-trieu.png](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/personas/persona-d-04-tim-duoi-15-trieu.png)
  - [persona-d-05-kham-pha-vuot-ngan-sach.png](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/personas/persona-d-05-kham-pha-vuot-ngan-sach.png)
  - [persona-d-06-chi-tiet-vuot-ngan-sach.png](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/personas/persona-d-06-chi-tiet-vuot-ngan-sach.png)
  - [persona-d-07-chi-tiet-hoc-phi-thap.png](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/personas/persona-d-07-chi-tiet-hoc-phi-thap.png)
  - [persona-d-08-so-sanh-hoc-phi.png](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/personas/persona-d-08-so-sanh-hoc-phi.png)
  - [persona-d-09-hop-chon-nganh-so-sanh.png](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/personas/persona-d-09-hop-chon-nganh-so-sanh.png)
  - [persona-d-10-so-sanh-sau-doi-nganh.png](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/personas/persona-d-10-so-sanh-sau-doi-nganh.png)

---

### Persona E — Người dùng quay lại sau nhiều ngày (`PASS`)
- **Input đã nhập**:
  - Hồ sơ đầy đủ (họ tên, điểm các môn, lịch sử thi thử, 5 nguyện vọng đã xếp, mục tiêu chính QSC, thời khóa biểu 11 buổi cố định, kế hoạch tự học trong tuần).
- **Hành động cụ thể**:
  1. Vào `/ke-hoach/tuan`, đánh dấu hoàn thành 2 buổi học trong tuần -> sang `/ke-hoach/tien-do` kiểm tra tiến độ (`2/3 việc · 67%`).
  2. Reload trang (`F5`), sau đó đóng/mở một tab mới trên cùng `BrowserContext` (cùng origin `https://nguyenvongai.pages.dev`) và đối chiếu toàn bộ `localStorage` (`nguyen-vong-ai-v1`) lẫn giao diện `/ke-hoach/tien-do`.
  3. Vào `/ho-so/cai-dat`, bấm `Lưu về máy` để tải tệp JSON sao lưu (`persona-e-backup.json`, `12.780 bytes`).
  4. Bấm `Xóa hết` -> xác nhận trong `HopTruot` (`Xóa hết dữ liệu`) -> kiểm tra ứng dụng xóa sạch `localStorage` và điều hướng về `/chao`.
  5. Quay lại `/ho-so/cai-dat`, nạp tệp `persona-e-backup.json` vào input khôi phục -> xác nhận trong `HopTruot` (`Khôi phục`) -> kiểm tra `localStorage` và `/ke-hoach/tien-do`.
  6. Mở `/ho-so/chia-se`, kiểm tra tính năng tạo liên kết cho phụ huynh/thầy cô và truy cập trực tiếp liên kết `/dong-hanh?d=...`.
  7. Mở `/ho-so/cai-dat`, bật công tắc `Cho Claude/ChatGPT xem hồ sơ của bạn` -> xác nhận hộp thoại quyền riêng tư (`Bật và tạo liên kết`) -> kiểm tra liên kết MCP một lần được sinh ra từ Worker API.
- **Expected Output**:
  - Sau khi reload và mở tab mới: `stateIdentical100Percent = true`, `uiIdentical = true`.
  - Sau khi xuất JSON -> xóa sạch -> khôi phục từ JSON: `restoredIdentical100Percent = true`, tiến độ `2/3` buổi học và danh sách nguyện vọng khôi phục nguyên trạng 100%.
  - Liên kết `/dong-hanh?d=...` hiển thị đầy đủ bản tóm tắt độc lập cho phụ huynh/giáo viên mà không làm hỏng dữ liệu trên máy người xem.
  - Tính năng Kết nối Claude/ChatGPT gọi API thành công và trả về URL kết nối bảo mật.
- **Actual Output**:
  - Đạt tuyệt đối 100% ở tất cả các bước (`stateIdentical100Percent: true`, `clearedSuccessfully: true`, `restoredIdentical100Percent: true`, `tienDoMatchesBeforeClear: true`, `dongHanhRendered: true`, `ketNoiCreated: true`).
- **Lỗi Console / Network**: `0 console.error`, `0 pageerror`, `0 network error`, `0 HTTP 4xx/5xx`.
- **Bằng chứng ảnh chụp**:
  - [persona-e-01-ke-hoach-tuan-2-buoi-xong.png](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/personas/persona-e-01-ke-hoach-tuan-2-buoi-xong.png)
  - [persona-e-02-tien-do-truoc-reload.png](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/personas/persona-e-02-tien-do-truoc-reload.png)
  - [persona-e-03-tien-do-tab-moi.png](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/personas/persona-e-03-tien-do-tab-moi.png)
  - [persona-e-04-cai-dat-truoc-sao-luu.png](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/personas/persona-e-04-cai-dat-truoc-sao-luu.png)
  - [persona-e-05-da-xuat-json.png](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/personas/persona-e-05-da-xuat-json.png)
  - [persona-e-06-hop-xac-nhan-xoa.png](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/personas/persona-e-06-hop-xac-nhan-xoa.png)
  - [persona-e-07-sau-khi-xoa-ve-chao.png](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/personas/persona-e-07-sau-khi-xoa-ve-chao.png)
  - [persona-e-08-hop-xac-nhan-khoi-phuc.png](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/personas/persona-e-08-hop-xac-nhan-khoi-phuc.png)
  - [persona-e-09-sau-khi-khoi-phuc.png](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/personas/persona-e-09-sau-khi-khoi-phuc.png)
  - [persona-e-10-tien-do-sau-khoi-phuc.png](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/personas/persona-e-10-tien-do-sau-khoi-phuc.png)
  - [persona-e-11-chia-se-dong-hanh.png](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/personas/persona-e-11-chia-se-dong-hanh.png)
  - [persona-e-12-xem-trang-dong-hanh.png](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/personas/persona-e-12-xem-trang-dong-hanh.png)
  - [persona-e-13-ket-noi-xac-nhan.png](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/personas/persona-e-13-ket-noi-xac-nhan.png)
  - [persona-e-14-ket-noi-da-tao-ma.png](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/personas/persona-e-14-ket-noi-da-tao-ma.png)

---

## 3. Danh mục Phát hiện Kỹ thuật (Findings & Severity)

1. **[Severity: Medium] Chuỗi cảnh báo nghịch đảo thứ tự nguyện vọng in ra `"xác suất undefined%"` khi có ngành thiếu điểm môn tổ hợp**
   - **Vị trí**: [toi-uu-nguyen-vong.ts](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/engine/toi-uu-nguyen-vong.ts#L118-L135)
   - **Bằng chứng**: Ảnh [persona-c-06-danh-sach-7-nv.png](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/personas/persona-c-06-danh-sach-7-nv.png) và `nvSnippet` của Persona C trong [personas-e2e-report.json](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/personas/personas-e2e-report.json#L283).
   - **Nguyên nhân**: Khi một nguyện vọng trong danh sách chưa tính được `thongSo` (ví dụ ngành xét `B00` nhưng thí sinh chưa nhập điểm Sinh học nên `thongSo === null`), vòng lặp kiểm tra nghịch đảo thứ tự gán `const pSau = nvSau.thongSo?.xacSuat ?? 0.5;` (thỏa mãn `pSau <= 0.52`), sau đó nội suy `${nvSau.thongSo?.phanTram}%` thành `"undefined%"`.
   - **Khuyến nghị sửa**: Trong vòng lặp phát hiện nghịch đảo thứ tự (`toi-uu-nguyen-vong.ts` dòng 120), nếu `!nvTruoc.thongSo || !nvSau.thongSo` thì `continue` (bỏ qua so sánh nghịch đảo xác suất đối với ngành chưa đủ điểm môn xét tuyển).

2. **[Severity: Low] Định dạng số thập phân của học phí ước tính dùng dấu chấm (`.` ) thay vì dấu phẩy (`,`)**
   - **Vị trí**: [lua-chon-phu.ts](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/data/lua-chon-phu.ts#L9-L13)
   - **Bằng chứng**: Ảnh [persona-d-08-so-sanh-hoc-phi.png](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/personas/persona-d-08-so-sanh-hoc-phi.png) (`≈ 15.2 triệu đồng`).
   - **Nguyên nhân**: `hocPhiChu` nối chuỗi trực tiếp `` `${l.hocPhiMin}` `` thay vì gọi `dinhDang(l.hocPhiMin, 1)`.

3. **[Severity: Low / Deployment Sync] Khối gợi ý điểm nghẽn inline tại `/bat-dau/2` mới có ở working tree local, chưa deploy lên Production**
   - **Vị trí**: [buoc-2.tsx](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/features/khoi-dau/buoc-2.tsx#L194-L230)
   - **Chi tiết**: Trên Production (`https://nguyenvongai.pages.dev`), việc phân tích môn kéo điểm hoạt động đầy đủ ở `/ke-hoach/muc-tieu` và `/ke-hoach/muc-tieu/mon-keo-diem`, còn thẻ gợi ý sớm ngay ở Bước 2 đang nằm trong bản thay đổi local chưa deploy.

# 04 — ADMISSIONS ACCURACY AUDIT (KIỂM TOÁN ĐỘ CHÍNH XÁC TUYỂN SINH & GOLDEN TESTS)

Báo cáo này trình bày kết quả kiểm toán toàn diện dữ liệu tuyển sinh và thuật toán tính điểm của **Nguyện Vọng AI**.
- **File kết quả kiểm toán chi tiết**: `evidence/admissions/admissions-audit.json` (sinh từ `scratch/audit-admissions.ts`).

---

## 1. Đối chiếu con số thực tế trong Source / Build / Production

| Chỉ số | Con số công bố | Con số thực trong `src/data/du-lieu-that.json` & Production | Kết quả đối chiếu |
| :--- | :---: | :---: | :--- |
| **Tổng số chương trình đào tạo (`LUA_CHON`)** | `3.648` | **`3.648`** | **KHỚP 100%** |
| **Tổng số trường đại học (`DANH_MUC_TRUONG`)** | `118` | **`118`** | **KHỚP 100%** |
| **Tổng số tổ hợp xét tuyển (`MON_CUA_TO_HOP`)** | `73` | **`73`** (66 tổ hợp tính điểm tự động + 7 tổ hợp năng khiếu) | **KHỚP 100%** |
| **Số tỉnh/thành sau sáp nhập (`TINH_THANH`)** | `34` | **`34`** (kèm bảng ánh xạ 63 tỉnh cũ -> 34 tỉnh mới) | **KHỚP 100%** |
| **Chương trình có điểm chuẩn từ PDF đề án (`official_pdf`)** | — | **`1.425`** chương trình (thuộc **52/118** trường có PDF đề án nối trang) | Minh bạch rõ nhãn `"Đã kiểm chứng"` |
| **Chương trình từ bảng tổng hợp (`aggregator_verified`)** | — | **`2.223`** chương trình (trong đó **1.404** ngành trùng khớp số với PDF đề án của trường) | Ghi rõ nguồn & trạng thái đối chiếu |
| **Độ phủ dữ liệu học phí** | `602` chính thức | **`602`** chính thức (có link văn bản) · **`3.005`** ước tính (gắn nhãn `hocPhiUocTinh: true`) · **`41`** chưa có/miễn phí | Không hiển thị `0` cho dữ liệu thiếu |

---

## 2. Đánh giá 10 tiêu chí chất lượng dữ liệu tuyển sinh

1. **Trường trùng lặp, mã trường sai, ngành trùng**:
   - Đã quét toàn bộ 118 trường trong `src/data/truong-danh-muc.ts` và 3.648 bản ghi trong `du-lieu-that.json`: **0 mã trường trùng lặp**, **0 ID chương trình trùng lặp**. Mỗi bản ghi là duy nhất theo tổ hợp `(maTruong, maNganh, phuongThuc, heDaoTao)`.
2. **Tên trường và tên viết tắt**:
   - Hỗ trợ đầy đủ mã tuyển sinh Bộ GD&ĐT (`BKA`, `QSB`, `QSC`, `KHA`, `NTH`, `YHB`...) và tên viết tắt thông dụng (`HUST`, `BKHN`, `HCMUT`, `UIT`, `NEU`, `FTU`, `PTIT`, `HCMUTE`, `UET`, `HMU`). Đã khắc phục lỗi trùng 4 ký tự đầu (`HCMUS` vs `HCMUT`) bằng hàm `kyHieu()` riêng.
3. **Mã ngành, mã phương thức tuyển sinh**:
   - Chuẩn hóa 8 mã phương thức: `THPT` (3.249 ngành), `DGNL_HCM` (186 ngành), `HOC_BA` (154 ngành), `KET_HOP` (35 ngành), `DGTD` (12 ngành), `DGNL_HN` (8 ngành), `NANG_KHIEU` (4 ngành).
4. **Điểm chuẩn theo từng năm và từng phương thức**:
   - Chuỗi lịch sử từ `2022` đến `2025`. Các phương thức không dùng thang 30 (`DGNL_HCM` thang 1200, `DGNL_HN` thang 150, `DGTD` thang 100) được tách riêng bằng hàm `lyDoKhacPhuongThuc(lc)` để **không bao giờ lấy điểm 3 môn THPT (thang 30) so sánh nhầm với điểm chuẩn thang 1200 hay 100**.
5. **Tổ hợp môn hợp lệ**:
   - Đối chiếu với `MON_CUA_TO_HOP` (`src/data/to-hop-chinh-thuc.ts`): Hỗ trợ 66 tổ hợp 3 môn văn hóa (từ `A00`, `A01`, `B00`, `C00`, `D01`, `D07` đến các tổ hợp chương trình GDPT 2018 có môn Tin học, Công nghệ, GDKT&PL như `A0T`, `D01_TH`, `C14`...) và nhận diện 7 tổ hợp năng khiếu (`V00`, `V01`, `H00`, `H01`, `M00`, `N00`, `T00`) để báo rõ không tự tính điểm.
6. **Quy tắc quy đổi, ưu tiên, điều kiện đặc biệt**:
   - Công thức ưu tiên tại `src/engine/diem-uu-tien.ts` tuân thủ chính xác Điều 7 Quy chế tuyển sinh Bộ GD&ĐT:
     - Mức cộng gốc: `KV1 = 0,75`, `KV2-NT = 0,50`, `KV2 = 0,25`, `KV3 = 0`; `ĐT01–04 = 2,00`, `ĐT05–07 = 1,00`.
     - Khi tổng 3 môn $< 22,5$: Cộng nguyên mức ưu tiên.
     - Khi tổng 3 môn $\in [22,5; 30]$: $\text{Ưu tiên thực tế} = \frac{30 - \text{Tổng 3 môn}}{7,5} \times \text{Mức ưu tiên gốc}$ (làm tròn 2 chữ số thập phân).
7. **Học phí và năm áp dụng**:
   - Lưu theo đơn vị `triệu đồng/năm` (`hocPhiMin`, `hocPhiMax`). Phân biệt rõ học phí có văn bản chính thức (`602` ngành) và học phí ước tính theo nhóm trường/khối ngành (`3.005` ngành có cờ `hocPhiUocTinh: true`).
8. **URL đề án tuyển sinh chính thức**:
   - Lưu trong `src/data/de-an-truong.json` và `src/data/nguon-nam.json` kèm số trang PDF (`#page=X`) để học sinh bấm mở trực tiếp trang có bảng điểm chuẩn.
9. **Dữ liệu năm 2025 vs Quy tắc tuyển sinh 2026**:
   - Đã kiểm tra và ghi rõ trên toàn bộ giao diện (`/kham-pha/:id`, `/ve-du-lieu`, `/tu-van`): Điểm chuẩn năm **2025** chỉ có giá trị **tham khảo lịch sử** cho mùa tuyển sinh **2026**. Khoảng dự báo 2026 (`du-bao.ts`) được tính từ xu hướng lịch sử kèm biên độ bất định $\pm 1,0 \rightarrow 2,5$ điểm.
10. **Những trường chưa có PDF đề án chính thức trong kho**:
    - Hiện có **66/118 trường** lấy từ bảng điểm chuẩn tổng hợp (`aggregator_verified`) chưa có file PDF đề án lưu trong `de-an-truong.json`. Tất cả các chương trình này đều được gắn nhãn **`Chưa kiểm chứng`** (màu cam) trên giao diện để học sinh biết và đối chiếu thêm trên website trường.

---

## 3. Kiểm tra mẫu phân tầng 33 chương trình (Stratified Sample)

Đã lấy mẫu phân tầng **33 chương trình** bao phủ Bắc (`Hà Nội`, `Thái Nguyên`, `Hải Phòng`) · Trung (`Đà Nẵng`, `Huế`, `Nghệ An`) · Nam (`TP.HCM`, `Cần Thơ`, `Vĩnh Long`), đủ các nhóm trường Top đầu (`BKA`, `QSB`, `QSC`, `YHB`, `NTH`, `KHA`), trường tầm trung (`SPK`, `BVH`, `GHA`, `TLA`) và trường địa phương (`DVL`, `TCT`, `hue`), đủ phương thức (`THPT`, `HOC_BA`, `DGNL_HCM`, `DGTD`, `NANG_KHIEU`).
- Chi tiết toàn bộ 33 mẫu nằm trong `evidence/admissions/admissions-audit.json` (`stratifiedSample33`).
- Không phát hiện trường hợp nào hiển thị học phí `0` khi thiếu dữ liệu hoặc gán nhãn `"Đã kiểm chứng"` sai nguồn.

---

## 4. Kết quả 8 Nhóm Golden Tests (`evidence/admissions/admissions-audit.json`)

| Mã test | Tình huống biên (Edge Case) | Đầu vào kiểm thử | Kết quả mong đợi | Kết quả thực tế | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **GT-01** | Thiếu một môn trong tổ hợp | Ngành xét `A00` (`Toán, Lý, Hóa`), học sinh nhập `Toán 8,5, Lý 8,0, Hóa = null` | `tong = null`, `thieuMon = ["hoaHoc"]`, không tự điền `0` cho môn Hóa | `tong: null`, `thieuMon: ["hoaHoc"]` | **PASS** |
| **GT-02** | Điểm bằng đúng ngưỡng điểm chuẩn | Ngành `diemMin = 25,0`, tổng điểm học sinh `= 25,0` (`chenh = 0,0`) | Nhãn cố định = **`Vừa sức`**, ước lượng tham khảo `~50%` | `nhan: "Vừa sức"`, `phanTram: 50` | **PASS** |
| **GT-03** | Điểm sát ngưỡng (`-0,05`, `+1,49`, `+1,50`, `+4,00`) | `diemMin = 25,0`, thử `24,95` / `26,49` / `26,50` / `29,00` | `24,95 -> Thử sức` · `26,49 -> Vừa sức` · `26,50 -> An toàn` · `29,00 -> Dự phòng` | Khớp chính xác cả 4 mốc biên | **PASS** |
| **GT-04** | Điểm ưu tiên có điều kiện giảm tuyến tính ($\ge 22,5$) | `KV1` (`0,75`) + `ĐT01` (`2,00`) = `2,75`; thử ở tổng 3 môn `21,0`, `22,5`, `25,5`, `30,0` | Ở `21,0 -> +2,75`; ở `22,5 -> +2,75`; ở `25,5 -> ((30-25,5)/7,5)*2,75 = +1,65`; ở `30,0 -> +0` | `2,75` · `2,75` · `1,65` · `0` | **PASS** |
| **GT-05** | Điểm vượt phạm vi (`-1`, `10,5`, `NaN`) | Nhập điểm môn `< 0`, `> 10` hoặc chuỗi không hợp lệ vào bộ chuẩn hóa | Bộ chuẩn hóa chặn hoặc cắt về khoảng hợp lệ `[0, 10]`, UI báo lỗi đỏ | Chặn hoàn toàn ngoài khoảng `[0, 10]` | **PASS** |
| **GT-06** | Đổi phương thức xét tuyển (`DGNL_HCM` thang 1200) | Ngành có `phuongThuc = "DGNL_HCM"`, `diemMin = 850`, điểm THPT `26,0` | Không lấy `26,0` trừ `850`; `nhanChoLuaChon` trả `null`, giải thích khác thang điểm | `nhan: null`, `lyDoKhacPhuongThuc` trả thông báo rõ ràng | **PASS** |
| **GT-07** | Đổi khu vực ưu tiên (`KV3` -> `KV1`) | Tổng 3 môn `24,0`, ngành `diemMin = 24,5`: đổi từ `KV3` (`0`) sang `KV1` (`0,75 -> +0,60`) | Ở `KV3`: `24,0 < 24,5` (`Thử sức`); sang `KV1`: `24,6 >= 24,5` (`Vừa sức`) | Đổi nhãn chính xác từ `Thử sức` sang `Vừa sức` | **PASS** |
| **GT-08** | Dữ liệu không tồn tại / Tổ hợp năng khiếu | Mã ngành không tồn tại hoặc tổ hợp `V00` (`Toán, Lý, Vẽ`) | `tong = null`, `khongTinhDuoc = ["V00"]`, UI hiện trạng thái trống an toàn | `tong: null`, `khongTinhDuoc: ["V00"]` | **PASS** |

---

## 5. Phân định bạch bạch: Tính toán tất định vs Quy tắc nghiệp vụ vs Suy luận AI

1. **Tính toán tất định (100% Deterministic TypeScript — Không bao giờ dùng LLM)**:
   - Cộng điểm 3 môn của 66 tổ hợp văn hóa (`tongChoLuaChon`).
   - Công thức khấu trừ tuyến tính điểm ưu tiên từ 22,5 điểm (`diemUuTien`).
   - Khoảng cách điểm còn thiếu tới mục tiêu (`mucTieuDayDu`, `khoangCachCuaToi`).
2. **Quy tắc nghiệp vụ & Mô hình thống kê có kiểm định (Rule-based & Statistical Heuristics)**:
   - Bốn nhãn nguyện vọng cố định theo độ chênh so với điểm chuẩn năm gần nhất (`< 0`: **Thử sức**, `[0; 1,5)`: **Vừa sức**, `[1,5; 4,0)`: **An toàn**, `>= 4,0`: **Dự phòng**).
   - Phát hiện môn kéo điểm (`phanTichDiemNghen`) và phát hiện nghịch đảo thứ tự nguyện vọng (`danhGiaDanhMucToanDien`).
   - Khoảng điểm dự báo (`duBaoCua`) và ước lượng cơ hội tham khảo (`tinhXacSuatTrungTuyen`) dựa trên độ biến động lịch sử $\tau$ của từng ngành.
3. **Suy luận ngôn ngữ AI (LLM Interpretation — Có rào chắn hậu kiểm)**:
   - Chỉ dùng trong `/api/tu-van` khi học sinh đặt câu hỏi tự nhiên phức tạp cần tổng hợp lời khuyên từ các bản ghi `SuKien` mà client gửi lên.
   - Mọi con số trong câu trả lời của LLM đều bị kiểm tra đối chiếu với tập số đầu vào (`kiemChungSoLieu`); nếu LLM tự sinh ra một con số lạ, câu trả lời bị chặn ngay và thay bằng bản tóm tắt tất định từ dữ liệu gốc.

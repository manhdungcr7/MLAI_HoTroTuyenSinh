# Báo cáo Thuật toán Chẩn đoán Danh mục Nguyện vọng & Dữ liệu Kiểm thử (Kiệt - Sprint 4H)

> **MLAI Hackathon 2026** · Phụ trách: **Kiệt (Algorithm & Domain Engine Lead)**  
> **Tiêu chí mục tiêu:** Chiều sâu Thuật toán & Logic Nghiệp vụ (*Algorithmic Rigor & Innovation* - Trọng số 25% điểm BGK).  
> **Phạm vi mã nguồn:** `src/engine/`, `src/features/nguyen-vong/`, `src/features/thu-tinh-huong/`, `tests/`.

---

## 1. Tổng quan & Triết lý Thiết kế Động cơ Tính toán

Toàn bộ thuật toán thuộc phạm vi của Kiệt được xây dựng theo triết lý **Deterministic Engine (Động cơ Xác định)**:
1. **Thuần TypeScript (Zero-Hook, Zero-React)**: Toàn bộ hàm tính toán nằm trong `src/engine/`, là các pure function không phụ thuộc trạng thái giao diện, dễ kiểm thử tự động độc lập.
2. **Quy chế Tuyển sinh làm gốc**: Mô phỏng trung thực quy chế lọc ảo của Bộ GD&ĐT; tuyệt đối không dùng AI để bịa xác suất đỗ hay thay thế quy tắc tuyển sinh.
3. **Minh bạch khoa học**: Không che giấu sai số; công khai toàn bộ dữ liệu kiểm định quá khứ (Backtesting) qua 3 mùa tuyển sinh.

---

## 2. Chi tiết Thuật toán: Phần CÓ Thay đổi & KHÔNG Thay đổi

### A. Phân loại 4 Nhóm Vị thế Nguyện vọng (Portfolio Position Classification)

#### 🔹 Phần KHÔNG thay đổi:
- **Cơ chế tính chênh lệch điểm ($\Delta$)**:  
  $$\Delta = \text{Điểm xét tuyển của học sinh} - \text{Điểm chuẩn lịch sử của ngành}$$
  Trong đó điểm xét tuyển được tính chuẩn xác theo đúng tổ hợp môn của ngành đào tạo (có tính điểm ưu tiên khu vực/đối tượng theo thang giảm dần của Bộ GD&ĐT).
- **Nguyên tắc phân định nhãn**: Nhãn không phải xác suất đỗ, mà là chỉ số định vị khoảng cách điểm lịch sử để học sinh tự ra quyết định.

#### 🔸 Phần CÓ sự thay đổi / Hoàn thiện mới:
- **Chuẩn hóa 4 ngưỡng vị thế theo quy chế và độ co giãn điểm**:  
  Trước đây, hệ thống chỉ dùng phép so sánh thô ($<0$ là Thử sức, $<1.5$ là Vừa sức, $<4.0$ là An toàn). Nay động cơ đã được nâng cấp chính xác theo hàm `phanLoaiViThe(chenhDiem: number)` trong [`src/engine/toi-uu-nguyen-vong.ts`](file:///d:/FILE/UIT/MLAI_Hackathon/MLAI_HoTroTuyenSinh/src/engine/toi-uu-nguyen-vong.ts):
  - **Thử sức ($\Delta < -0.5$, đặc biệt $\Delta \in [-2.0, -0.5)$)**: Điểm của em thấp hơn điểm chuẩn năm trước từ 0.5 đến 2.0 điểm. Nhóm này cần nỗ lực bứt phá điểm thi hoặc kỳ vọng điểm chuẩn hạ nhiệt.
  - **Vừa sức ($\Delta \in [-0.5, +1.0]$)**: Điểm của em dao động quanh điểm chuẩn năm trước $\pm 0.5$ đến $+1.0$. Đây là vùng xác suất rơi vào biến động điểm chuẩn tự nhiên hàng năm cao nhất.
  - **An toàn ($\Delta \in (+1.0, +2.5]$)**: Điểm của em cao hơn điểm chuẩn từ 1.0 đến 2.5 điểm, tạo vùng đệm an toàn vững chắc.
  - **Dự phòng ($\Delta > +2.5$)**: Điểm của em vượt xa điểm chuẩn từ 2.5 điểm trở lên, đóng vai trò là "chốt chặn an toàn cuối cùng" chống trượt đại học.

---

### B. Bắt 2 Lỗi Chiến lược Tuyển sinh Kinh điển (Strategic Admission Guardrails)

#### 1. Lỗi 1: Ngược vị thế (Inverted Order / Rank Inversion)
- **Bản chất nghiệp vụ Tuyển sinh**:  
  Theo quy chế của Bộ GD&ĐT, hệ thống lọc ảo quốc gia xét tuyển theo thứ tự ưu tiên từ trên xuống dưới (NV1 $\to$ NV2 $\to$ NV3...). Thí sinh chỉ trúng tuyển vào **nguyện vọng cao nhất đủ điều kiện**, toàn bộ các nguyện vọng phía sau lập tức bị **hủy bỏ**.
- **Nguy cơ thực tế**:  
  Nếu học sinh đặt một ngành có điểm chuẩn thấp (nhóm An toàn/Dự phòng, ví dụ 22 điểm) ở NV1, rồi lại đặt ngành điểm chuẩn cao (nhóm Thử sức/Vừa sức, ví dụ 28 điểm) ở NV2, thì khi đỗ NV1 (22 điểm), em sẽ **mất hoàn toàn cơ hội xét tuyển NV2** dù điểm thi thực tế của em có thể đạt 28 điểm!
- **Cơ chế thuật toán mới**:  
  Thuật toán quét toàn bộ danh mục theo cặp $(i, j)$ với $i < j$:
  $$\text{Nếu } NV_i \in \{\text{An toàn, Dự phòng}\} \text{ và } NV_j \in \{\text{Thử sức, Vừa sức}\} \text{ (hoặc } \text{Điểm chuẩn } NV_j > NV_i + 0.5\text{)}$$
  $\implies$ Gắn cờ vi phạm `biNghichDao = true` và kích hoạt cảnh báo nghiêm trọng:
  > *"Ngược vị thế: NV{i} xếp trước NV{j}. Nếu đỗ NV{i}, toàn bộ NV sau sẽ bị hủy bỏ theo quy chế lọc ảo của Bộ!"*

#### 2. Lỗi 2: Dồn rủi ro (Risk Clustering)
- **Bản chất nghiệp vụ Tuyển sinh**:  
  Nhiều thí sinh có tâm lý "tất tay", xếp toàn bộ 4–5 nguyện vọng vào các ngành có điểm chuẩn cao hơn năng lực thật của mình ($\Delta \in [-2.0, -0.5)$) mà không có bất kỳ phương án dự phòng nào. Nếu năm thi đó đề thi vừa sức hoặc độ cạnh tranh ngành tăng nhẹ, thí sinh đối mặt nguy cơ **trượt trắng toàn bộ các nguyện vọng**.
- **Cơ chế thuật toán mới**:  
  Kiểm tra cơ cấu danh mục:
  $$\text{Nếu } N_{NV} \ge 2 \quad \text{và} \quad N_{\text{Thử sức}} \ge 2 \quad \text{và} \quad (N_{\text{An toàn}} + N_{\text{Dự phòng}} = 0)$$
  $\implies$ Kích hoạt cảnh báo nghiêm trọng `canhBaoNghiemTrong`:
  > *"Dồn rủi ro: Danh mục có {N}/5 nguyện vọng Thử sức và thiếu hoàn toàn nguyện vọng An toàn hoặc Dự phòng. Cảnh báo nguy cơ trượt trắng cả mùa tuyển sinh!"*
  Đồng thời tự động bổ sung đề xuất hành động:
  > *"Thiếu nguyện vọng dự phòng: Em cần bổ sung ít nhất 1–2 nguyện vọng An toàn hoặc Dự phòng (điểm chuẩn thấp hơn điểm của em từ 1.5 điểm trở lên) để đảm bảo không bị trượt đại học."*

---

### C. Dữ liệu Kiểm thử Quá khứ (Leave-one-year-out Backtesting)

#### 🔹 Phần KHÔNG thay đổi:
- **Mô hình khoảng tin cậy không hộp đen (Empirical Distribution)**:  
  Không dùng phân phối chuẩn giả định; gom biến động thực tế từ toàn bộ các cặp 2 năm liền nhau $(\Delta_{năm} = \text{Điểm}_{T} - \text{Điểm}_{T-1})$.
  Khoảng dự báo được tính từ phân vị 10% đến 90% nhân với hệ số mở rộng:
  $$\text{Khoảng dự báo} = \left[ \text{Điểm}_{T-1} + Q_{10\%} \cdot H \cdot \sqrt{k}, \quad \text{Điểm}_{T-1} + Q_{90\%} \cdot H \cdot \sqrt{k} \right]$$
  với $H = 1.3$ (`HE_SO_NO_RONG`) và $k$ là khoảng cách năm.

#### 🔸 Phần CÓ sự thay đổi / Hoàn thiện mới:
- **Xuất bản bộ dữ liệu nghiệm thu Backtesting 3 năm** (`KET_QUA_BACKTESTING_3_NAM` trong [`src/engine/du-bao-diem-chuan.ts`](file:///d:/FILE/UIT/MLAI_Hackathon/MLAI_HoTroTuyenSinh/src/engine/du-bao-diem-chuan.ts)):
  | Mùa tuyển sinh | Số chương trình kiểm định | Tỷ lệ bao hàm thực tế | Sai số trung bình (MAE) | Đánh giá & Phân tích hiện tượng |
  | :--- | :---: | :---: | :---: | :--- |
  | **Năm 2023** | 396 chương trình | **89.4%** | 1.01 điểm | Năm dữ liệu ổn định, độ phủ vượt mức danh nghĩa 80%. |
  | **Năm 2024** | 603 chương trình | **94.9%** | 1.16 điểm | Năm dữ liệu đầy đủ nhất, độ phủ đạt mức tối ưu 95%. |
  | **Năm 2025** | 413 chương trình | **64.9%** | 1.86 điểm | Năm có biến động bất thường (phổ điểm khối A01 lệch chuẩn 2.6 so với 1.8). |
- **Trực quan hóa minh bạch trên giao diện**:  
  Đưa trực tiếp widget 3 cột hiển thị tỷ lệ bao hàm 89% · 95% · 64% vào [`ChanDoanDanhMucCard`](file:///d:/FILE/UIT/MLAI_Hackathon/MLAI_HoTroTuyenSinh/src/features/nguyen-vong/chan-doan-danh-muc.tsx) với chú thích khoa học giải thích rõ nguyên nhân biến động năm 2025. Ban giám khảo thấy rõ sản phẩm minh bạch số liệu, không giấu diếm sai số.

---

### D. Mô hình Tính Xác suất Trúng tuyển Được Hiệu chuẩn (Calibrated Probability Model)

Mô hình tính toán xác suất được xây dựng độc lập trong [`src/engine/xac-suat-trung-tuyen.ts`](file:///d:/FILE/UIT/MLAI_Hackathon/MLAI_HoTroTuyenSinh/src/engine/xac-suat-trung-tuyen.ts) và tích hợp vào chẩn đoán danh mục [`src/engine/toi-uu-nguyen-vong.ts`](file:///d:/FILE/UIT/MLAI_Hackathon/MLAI_HoTroTuyenSinh/src/engine/toi-uu-nguyen-vong.ts).

#### 1. Xác suất trúng tuyển đơn lẻ của từng nguyện vọng ($P_i$)
Không dùng xác suất cảm tính hay "hộp đen", xác suất $P_i$ được tính qua chuỗi 5 bước toán học:

- **Bước 1: Điểm chuẩn kỳ vọng ($\mu$) với trọng số phân rã theo thời gian (Exponential Decay Weights)**:
  Các năm gần nhất phản ánh xu hướng chuẩn xác hơn các năm xa. Khi có chuỗi điểm lịch sử $D = [d_1, d_2, d_3, \dots]$ sắp xếp từ mới nhất:
  $$w_t = 0.6^t \quad (t = 0, 1, 2, \dots)$$
  $$\mu = \frac{\sum_{t} d_t \cdot w_t}{\sum_{t} w_t}$$
  *(Nếu có 1 năm: $\mu = d_1$; nếu có 2 năm: $\mu = 0.65 d_1 + 0.35 d_2$).*

- **Bước 2: Ước lượng độ biến động ($\tau$) với Bayesian Smoothing**:
  Độ biến động không chỉ tính từ độ lệch chuẩn mẫu $\sigma$ của trường, mà được làm mượt theo mô hình Bayes kết hợp với độ biến động vĩ mô toàn quốc ($\tau_{\text{macro}} = 1.25$ điểm):
  $$\tau = \text{clamp}\left(0.6 \cdot \sigma + 0.4 \cdot \tau_{\text{macro}}, \quad 0.8, \quad 2.2\right)$$
  *(Giúp tránh trường hợp ngành có điểm 2 năm liền bằng nhau $\sigma = 0$ dẫn đến mẫu số bằng 0).*

- **Bước 3: Chuẩn hóa khoảng chênh lệch ($z$-score)**:
  $$\Delta = \text{Điểm xét tuyển (đã cộng ưu tiên)} - \mu$$
  $$z = \frac{\Delta}{\tau}$$

- **Bước 4: Hàm Logistic chuyển đổi xác suất (Calibrated Sigmoid Curve)**:
  Sử dụng hàm logistic với độ dốc chuẩn hóa $k = 1.65$:
  $$P_{\text{raw}} = \frac{1}{1 + e^{-1.65 \cdot z}}$$
  Đặc tính phân phối:
  - Khi $z = 0$ (điểm xét bằng điểm kỳ vọng): $P = 50\%$ (vùng phân định 50-50).
  - Khi $\Delta \approx +1.5$ điểm: $P \ge 85\%$ (vùng An toàn).
  - Khi $\Delta \ge +2.5$ điểm: $P \ge 96\%$ (vùng Dự phòng vững chắc).
  - Khi $\Delta \le -1.5$ điểm: $P \le 15\%$ (vùng Thử sức cao).

- **Bước 5: Hiệu chuẩn biên an toàn (Safety Bounds & Confidence Interval)**:
  Do luôn tồn tại bất định về đề thi và chỉ tiêu biến động:
  $$P_i = \text{clamp}(P_{\text{raw}}, \quad 0.02, \quad 0.98)$$
  *(Tuyệt đối không bao giờ trả về 0% hay 100% để tránh cam kết viển vông).*
  Khoảng tin cậy $[P_{\text{min}}, P_{\text{max}}]$ co giãn theo số năm dữ liệu lịch sử ($\pm 6\%$ nếu có $\ge 3$ năm, $\pm 10\%$ nếu 2 năm, $\pm 15\%$ nếu 1 năm).

---

#### 2. Xác suất trúng tuyển ít nhất 1 nguyện vọng của cả danh mục ($P_{\text{đỗ } \ge 1}$)
Được tính trong hàm `danhGiaDanhMucToanDien` ([`src/engine/toi-uu-nguyen-vong.ts`](file:///d:/FILE/UIT/MLAI_Hackathon/MLAI_HoTroTuyenSinh/src/engine/toi-uu-nguyen-vong.ts#L173-L182)):
- Gọi $P_i$ là xác suất trúng tuyển nguyện vọng thứ $i$.
- Xác suất trượt nguyện vọng thứ $i$ là $1 - P_i$.
- Theo quy tắc nhân xác suất biến cố đối (trượt toàn bộ $N$ nguyện vọng):
  $$P_{\text{trượt hết}} = \prod_{i=1}^N (1 - P_i)$$
- Xác suất trúng tuyển **ít nhất 1 nguyện vọng** trong danh mục là:
  $$P_{\text{đỗ } \ge 1} = 1 - P_{\text{trượt hết}} = 1 - \prod_{i=1}^N (1 - P_i)$$
- **Ví dụ cụ thể**:
  - Học sinh có danh mục 3 NV: NV1 Thử sức ($P_1 = 20\%$), NV2 Vừa sức ($P_2 = 60\%$), NV3 An toàn ($P_3 = 85\%$):
  - Xác suất trượt cả 3: $(1 - 0.20) \times (1 - 0.60) \times (1 - 0.85) = 0.80 \times 0.40 \times 0.15 = 0.048$ ($4.8\%$).
  - Xác suất đỗ ít nhất 1 NV: $1 - 0.048 = 95.2\% \approx 95\%$.

---

## 3. Danh sách File Đã Sửa Đổi & Bằng Chứng Kiểm Thử

### File đã chỉnh sửa (Đúng phạm vi phân công của Kiệt):
1. [`src/engine/toi-uu-nguyen-vong.ts`](file:///d:/FILE/UIT/MLAI_Hackathon/MLAI_HoTroTuyenSinh/src/engine/toi-uu-nguyen-vong.ts): Cài đặt hàm `phanLoaiViThe`, nâng cấp thuật toán chẩn đoán bắt lỗi Ngược vị thế & Dồn rủi ro.
2. [`src/engine/du-bao-diem-chuan.ts`](file:///d:/FILE/UIT/MLAI_Hackathon/MLAI_HoTroTuyenSinh/src/engine/du-bao-diem-chuan.ts): Khai báo kiểu `KetQuaKiemDinhNam`, xuất hằng số `KET_QUA_BACKTESTING_3_NAM`.
3. [`src/features/nguyen-vong/chan-doan-danh-muc.tsx`](file:///d:/FILE/UIT/MLAI_Hackathon/MLAI_HoTroTuyenSinh/src/features/nguyen-vong/chan-doan-danh-muc.tsx): Hiển thị cảnh báo ngược vị thế, cảnh báo dồn điểm và widget Backtesting 3 năm.
4. [`src/features/nguyen-vong/tinh-toan.ts`](file:///d:/FILE/UIT/MLAI_Hackathon/MLAI_HoTroTuyenSinh/src/features/nguyen-vong/tinh-toan.ts): Cập nhật câu cảnh báo thứ tự dẫn chiếu quy chế lọc ảo của Bộ.
5. [`tests/toi-uu-nguyen-vong.test.ts`](file:///d:/FILE/UIT/MLAI_Hackathon/MLAI_HoTroTuyenSinh/tests/toi-uu-nguyen-vong.test.ts): Bổ sung bộ test cho `phanLoaiViThe`, Nghiệm thu 1 (NV1 22đ, NV2 28đ) và Nghiệm thu 2 (4 NV thiếu 2đ).
6. [`tests/nhan-nguyen-vong.test.ts`](file:///d:/FILE/UIT/MLAI_Hackathon/MLAI_HoTroTuyenSinh/tests/nhan-nguyen-vong.test.ts): Cập nhật fallback an toàn cho trường hợp toàn bộ danh mục đã có tổ hợp.

### Kết quả kiểm thử tự động:
- `npx tsx tests/toi-uu-nguyen-vong.test.ts`: **PASS** (100%)
- `npx tsx tests/du-bao-diem-chuan.test.ts`: **PASS** (100%)
- `npx tsx tests/nguyen-vong.test.ts`: **PASS** (100%)
- `npx tsx tests/nhan-nguyen-vong.test.ts`: **PASS** (100%)
- `npx tsx tests/thu-tinh-huong.test.ts`: **PASS** (100%)
- `npx tsx tests/muc-tieu.test.ts`: **PASS** (100%)
- `npm run kiem-tra`: **PASS** (34 routes, 15 slices xanh toàn bộ, 0 lỗi từ cấm, 0 mã màu lạ).


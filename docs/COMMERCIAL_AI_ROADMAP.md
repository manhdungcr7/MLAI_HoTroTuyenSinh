# LỘ TRÌNH KỸ THUẬT & QUY TRÌNH HOÀN THIỆN AI CHO TRIỂN KHAI THƯƠNG MẠI
**Hệ Thống Trí Tuệ Quyết Định Tuyển Sinh Đại Học (Nguyện Vọng AI)**  
*Tài liệu kỹ thuật nội bộ — Định hướng chuyển giao công nghệ từ TRL 6 lên TRL 9 (Production Ready)*

---

## 1. TỔNG QUAN & NGUYÊN TẮC CHUYỂN GIAO THƯƠNG MẠI

| Tiêu chí | Chuẩn Cuộc Thi (MLAI Hackathon) | Chuẩn Triển Khai Thương Mại (Commercial Production) |
| :--- | :--- | :--- |
| **Bản chất xác thực** | Chứng minh tính đúng 1 lần trên tập dữ liệu kiểm tra. | Quy trình sống: Tự động đánh giá, tự phát hiện trôi dạt mô hình (model drift) qua từng mùa thi. |
| **Độ bao phủ dữ liệu** | 57 trường đại học trọng điểm (TP.HCM, Hà Nội, Đà Nẵng). | Mở rộng lên 350 – 440 trường trên toàn quốc, tích hợp dữ liệu Đề án tuyển sinh công khai. |
| **Xử lý biên (Robustness)** | Pass các test case danh định và kịch bản chuẩn. | Property-based testing: Chống chịu hàng triệu biến thể dữ liệu dị biệt, không bao giờ crash hay trả số vô lý. |
| **Cơ chế học hỏi (Feedback)** | Dữ liệu kiểm định lịch sử (static ground truth 2025). | Vòng lặp thu thập kết quả đỗ/trượt thật (ẩn danh, phi định danh) đối chiếu chéo với dự báo. |
| **Trách nhiệm pháp lý** | Disclaimer cơ bản trên giao diện. | Quy chuẩn điều khoản dịch vụ (ToS), tuân thủ Nghị định 13/2023/NĐ-CP và Luật Trẻ em 2016. |

---

## 2. THỨ TỰ ƯU TIÊN TRIỂN KHAI (CHỦ ĐỘNG RỦI RO)

```
[Ưu tiên 1: C] Kiểm định biên (Robustness & Edge-cases) 
      ↓
[Ưu tiên 2: D] Chuẩn hóa khoảng cách tỉnh & độ tin cậy Utility
      ↓
[Ưu tiên 3: A + F] Pipeline Backtest liên tục & Quản trị mô hình (Governance)
      ↓
[Ưu tiên 4: B] Thiết kế vòng lặp phản hồi kết quả thật (Feedback Loop)
      ↓
[Ưu tiên 5: E] Lớp LLM Copilot có rào chắn số liệu (Grounded LLM Layer)
```

---

## 3. CHI TIẾT 5 GIAI ĐOẠN HOÀN THIỆN AI THƯƠNG MẠI

### Giai đoạn 1: Kiểm Định Biên & Phòng Thủ Đầu Vào (Robustness Hardening - Nhóm C)
*Mục tiêu: Đảm bảo hệ thống không bao giờ trả về `NaN`, `undefined`, crash trắng trang, hoặc âm thầm cho ra kết quả sai lệch khi người dùng nhập dữ liệu bất thường.*

1. **Xử lý chương trình 0 năm lịch sử ($n = 0$):**
   - *Rủi ro:* Các ngành mới mở, trường mới thành lập không có dữ liệu điểm chuẩn quá khứ.
   - *Cơ chế:* Tự động mượn điểm trung vị và phương sai của nhóm ngành tương đương (`major_group`) tại cùng phân tầng trường (`prestige_tier`), đồng thời nhân hệ số bất định $\times 1.6$ và gắn nhãn bắt buộc: `"Dữ liệu ước lượng nhóm ngành — Ngành mới tuyển sinh"`.
2. **Bộ lọc biên điểm số đầu vào (Boundary Validators):**
   - Chặn điểm âm, điểm $> 10.0$ mỗi môn, tổng điểm $> 30.0$.
   - Khi phát hiện học sinh nhập điểm bất thường (ví dụ Toán 10.0, Lý 0.5), hệ thống yêu cầu xác nhận trước khi tính toán.
3. **Xử lý tổ hợp hiếm không có trong danh mục (Missing Combination Defense):**
   - Khi học sinh chọn tổ hợp không có trường nào xét tuyển trong khu vực quan tâm, không trả về danh sách trống rỗng mà hiển thị cảnh báo hướng dẫn: đề xuất chuyển đổi sang tổ hợp gần nhất (ví dụ B08 $\to$ B00/D07) với phân tích chênh lệch môn.
4. **Cảnh báo danh mục 100% rủi ro cao (Zero Safety Fallback):**
   - Khi hồ sơ thí sinh quá thấp so với toàn bộ cơ sở dữ liệu và không thể tìm thấy dù chỉ 1 nguyện vọng an toàn, hệ thống lập tức kích hoạt khuyến nghị khẩn cấp: Gợi ý các phương thức xét tuyển học bạ, cao đẳng liên thông hoặc mở rộng bán kính vùng tuyển.

---

### Giai đoạn 2: Hoàn Thiện Hàm Thỏa Dụng (Geo Distance & Utility Uncertainty - Nhóm D)

1. **Xây dựng Bảng ma trận khoảng cách Tỉnh $\leftrightarrow$ Tỉnh (Real Distance Matrix):**
   - *Hiện trạng:* Code cũ dùng hằng số giả định 300km cho mọi trường.
   - *Giải pháp thương mại:* Tạo bảng tọa độ hành chính trung tâm 63 tỉnh/thành phố (WGS84). Tính khoảng cách theo công thức Haversine:
     $$d = 2R \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)$$
   - Phân cấp theo 4 nấc di chuyển thực tế: Nội tỉnh ($< 30\text{km}$), Cùng vùng kinh tế ($< 150\text{km}$), Khác vùng ($150 - 500\text{km}$), Liên miền ($> 500\text{km}$).
2. **Công khai mức độ tin cậy của ước lượng Học phí & Việc làm:**
   - Đối với các trường chưa có học phí xác thực trong đề án, hệ thống công khai dải phương sai ước lượng thay vì 1 số trung vị cố định:
     $$\text{Học phí ước tính} = \text{Median}_{\text{group}} \pm 1.96 \cdot \text{Std}_{\text{group}}$$
   - Hiển thị rõ nhãn: `"Ước tính theo nhóm ngành — Độ tin cậy: Trung bình (chờ đề án chính thức)"`.

---

### Giai đoạn 3: Pipeline Backtest Sống & Quản Trị Mô Hình (Living Backtest & Governance - Nhóm A & F)

1. **Lịch sử kiểm định theo mùa tuyển sinh (`backtest_history/{year}.json`):**
   - Không ghi đè file kiểm định. Mỗi năm lưu một bản chụp độc lập:
     - `backtest_2025.json` (Đối chiếu 2024 $\to$ 2025)
     - `backtest_2026.json` (Đối chiếu 2025 $\to$ 2026)
   - Lưu chuỗi thời gian để theo dõi độ ổn định của hệ số cú sốc $\sigma_{\text{national}}$.
2. **Cơ chế Tự động Kích hoạt Cảnh báo Trôi dạt (Model Drift Alert):**
   - Nếu ở mùa tuyển sinh mới:
     - $\text{MAE}_{\text{mới}} > 1.3 \times \text{MAE}_{\text{lịch sử}}$
     - Hoặc Độ phủ dải $[P_{10}, P_{90}]$ rơi ra ngoài khoảng $[65\%, 90\%]$
     - Hoặc Brier Score $> 0.25$
   - $\to$ Hệ thống tự động kích hoạt cờ `MODEL_DRIFT_WARNING` yêu cầu nhóm kỹ sư tái hiệu chỉnh tham số độ lệch chuẩn $\sigma$ và tỷ lệ co ngót Bayes.
3. **Quy trình Quản trị Phiên bản & Rollback:**
   - Mỗi bộ tham số và dữ liệu đi kèm một `modelVersion` duy nhất (ví dụ `2026.1-prod`).
   - Mọi xuất bản dữ liệu đều đính kèm chữ ký SHA-256 trong `manifest.json`. Khi phát hiện sự cố, hệ thống có thể quay về phiên bản ổn định gần nhất chỉ bằng 1 thao tác cấu hình trỏ digest.

---

### Giai đoạn 4: Vòng Thu Thập Kết Quả Thực Tế (Feedback Loop - Nhóm B)

1. **Nguyên tắc Bảo mật & Phi định danh (Strictly Anonymized):**
   - Tuyệt đối không thu thập Họ tên, Số CMND/CCCD, Số báo danh hay Số điện thoại.
   - Thí sinh tự nguyện đóng góp kết quả sau mùa tuyển sinh thông qua cơ chế mã hóa một chiều.
2. **Schema Sự kiện Thu Thập:**
   ```json
   {
     "event_type": "admission_outcome_feedback",
     "schema_version": "1.0",
     "graduation_year": 2026,
     "anonymized_session_id": "sha256_hash_device_salt",
     "recorded_wishes": [
       {
         "rank": 1,
         "program_key": "QSB_7480201",
         "combination": "A01",
         "predicted_p50": 27.8,
         "predicted_admit_prob": 0.65,
         "outcome": "admitted"
       },
       {
         "rank": 2,
         "program_key": "QSC_7480101",
         "combination": "A01",
         "predicted_p50": 26.5,
         "predicted_admit_prob": 0.88,
         "outcome": "unconsidered"
       }
     ]
   }
   ```
3. **Mục đích sử dụng:**
   - Dùng để đối chiếu độ lệch thực tế (Empirical Calibration) và phát hiện các cú sốc bất thường cục bộ ở từng trường cụ thể.

---

### Giai đoạn 5: Lớp AI Copilot & LLM có Rào Chắn Nghiêm Ngặt (Grounded LLM Layer - Nhóm E)

1. **Kiến trúc Rào chắn 2 lớp (Dual-Layer Guardrail):**
   - **Lớp 1 (Deterministic Core):** Mọi con số điểm, khoảng cách, học phí, xác suất và thứ hạng được tính toán $100\%$ bởi thuật toán xác định (deterministic engine) và đóng băng dưới dạng JSON.
   - **Lớp 2 (Generative Formatter):** LLM chỉ được cấp JSON số liệu đã đóng băng, với System Prompt cấm tự ý nội suy hoặc đoán số:
     *"Tuyệt đối không đưa ra bất kỳ con số điểm chuẩn hay xác suất nào ngoài các số liệu đã được cung cấp trong cấu trúc JSON."*
2. **Hậu kiểm tự động bằng Biểu thức chính quy (Regex Post-validation):**
   - Quét toàn bộ output văn bản của LLM. Nếu xuất hiện bất kỳ số điểm nào không khớp với JSON đầu vào $\to$ Tự động hủy phản hồi của LLM và chuyển ngay sang Bản mẫu giải thích chuẩn (Fallback Grounded Template).
3. **Kiểm soát chi phí & Tốc độ tại quy mô lớn:**
   - Bộ nhớ đệm biên (Edge Caching / Cloudflare Workers KV) cho các câu hỏi phổ biến về trường và ngành.
   - Giới hạn tần suất 20 câu hỏi tư vấn sâu / tài khoản / ngày để ngăn ngừa lạm dụng tài nguyên.

---

---

## 4. BẢNG HIỆN THỰC HÓA KỸ THUẬT (IMPLEMENTATION & VERIFICATION STATUS)

Toàn bộ 5 giai đoạn ưu tiên kỹ thuật đã được hiện thực hóa trực tiếp trong mã nguồn hệ thống và vượt qua 100% kiểm thử tự động:

| Hạng mục | Trạng thái | Mã nguồn hiện thực | Kiểm thử & Bằng chứng xác minh |
| :--- | :--- | :--- | :--- |
| **Giai đoạn 1 (Robustness Hardening - Nhóm C)** | ✅ **Đã hoàn thiện** | `frontend/src/engine/decision/optimizer.ts`<br>`frontend/src/engine/scoring/composite.ts`<br>`frontend/src/engine/admissions/probability.ts` | • `frontend/tests/test_commercial_ai_robustness.ts` (15/15 tests pass)<br>• Chặn biên điểm $[0, 10]$ & $[0, 30]$, zero-NaN, zero crash.<br>• Fallback cho $n=0$ năm lịch sử (Bayes group median + nở dải $\times 1.6$).<br>• Cảnh báo cấp bách `ZERO_SAFETY_WARNING` khi danh mục 100% Thử sức. |
| **Giai đoạn 2 (Geo Distance & Utility - Nhóm D)** | ✅ **Đã hoàn thiện** | `frontend/src/engine/geo/distance.ts`<br>`common/utility.py`<br>`data/manual/province_distance.csv`<br>`pipeline/generate_province_distance.py` | • Ma trận khoảng cách thực tế 63 tỉnh/thành phố (1.953 cặp khoảng cách Haversine).<br>• Đồng bộ 100% giữa Python backend và TypeScript frontend.<br>• Khoảng bất định thỏa dụng `uncertaintyBounds` $[U_{\min}, U_{\max}]$ khi khuyết dữ liệu. |
| **Giai đoạn 3 (Living Backtest & Governance - Nhóm A & F)** | ✅ **Đã hoàn thiện** | `pipeline/features/backtest.py`<br>`frontend/public/data/backtest.json`<br>`frontend/public/data/backtest_history/backtest_2025.json` | • Quản trị phiên bản `modelVersion: "2026.1-prod"`.<br>• Tự động lưu trữ lịch sử kiểm định mùa tuyển sinh không ghi đè.<br>• Tự động kích hoạt cơ chế phát hiện trôi dạt (Drift Triggers: Coverage $\notin [65\%, 90\%]$, $\text{MAE} > 1.3\times$, Brier $> 0.25$). |
| **Giai đoạn 4 (Feedback Loop - Nhóm B)** | ✅ **Đã hoàn thiện** | `frontend/src/engine/feedback/outcome-collector.ts` | • Tuân thủ Nghị định 13/2023/NĐ-CP (100% ẩn danh, không lưu CCCD/SĐT/Họ tên).<br>• Local-first storage ghi nhận ảnh chụp dự báo và kết quả trúng tuyển thực tế.<br>• Hàm tính toán Brier Score thực nghiệm và xuất khẩu dữ liệu hiệu chuẩn. |
| **Giai đoạn 5 (Grounded LLM Layer - Nhóm E)** | ✅ **Đã hoàn thiện** | `frontend/src/engine/explain/grounded-explainer.ts` | • Rào chắn kép chống Hallucination (Dual-Layer Guardrail).<br>• Regex Post-Validator quét toàn bộ token số trong văn bản tư vấn đối chiếu Factsheet.<br>• Tự động chuyển về bản mẫu chuẩn xác định nếu phát hiện số bịa đặt. |

---

## 5. KẾT LUẬN & CAM KẾT ĐẠO ĐỨC AI

Trí tuệ Nhân tạo trong giáo dục và tuyển sinh đòi hỏi tiêu chuẩn đạo đức cao nhất: **Sự trung thực về mặt thống kê quan trọng hơn sự màu mè về mặt tính năng.**  
Lộ trình thương mại trên bảo đảm hệ thống luôn vận hành trên nguyên tắc:
1. Quyết định thuộc về con người (Human-in-the-loop).
2. Minh bạch về sự bất định của tương lai (Uncertainty-aware).
3. Tôn trọng quyền riêng tư và dữ liệu cá nhân của thế hệ trẻ Việt Nam.


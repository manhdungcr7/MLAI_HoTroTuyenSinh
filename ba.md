# Nguyện Vọng AI — Đặc tả sản phẩm (BA, nguồn sự thật duy nhất)

> **Dự thi:** MLAI Hackathon 2026 · Bảng Decision Intelligence (TMA Solutions) · Đề 6 "Chọn trường hoặc chương trình học". Team RTC đã vào chung kết (Sprint 2).
> **Phiên bản 3.0** — 27/09/2026. Thêm sitemap đầy đủ cho sản phẩm dùng hằng ngày (tài khoản, cài đặt, quản trị), mục tiêu TRL, quy trình 5 cổng và phân công theo GitHub issue. Chờ cả team chốt ngày **29/09/2026** (cổng G1, issue #31).
> **Live:** https://nguyen-vong-ai.ppnh10092002.workers.dev
>
> Repo chỉ có 3 file tài liệu:
> - `ba.md` (file này): làm gì, vì sao, kiến trúc, khi nào.
> - `README.md`: cửa vào cho ban giám khảo, cách chạy.
> - `.agents/AGENTS.md`: luật làm việc cho người và agent.
>
> Tài liệu cũ xem trong `git log`. **Nếu nơi khác nói khác file này, file này đúng.**

**Ký hiệu**

| Ký hiệu | Nghĩa |
|---|---|
| ✅ | Đã có trong code. Luôn kèm đường dẫn file. |
| 🔧 | Có code nhưng phải sửa trước khi demo. Kèm hạn. |
| 📐 | Đã chốt thiết kế, chưa code. Kèm hạn. |
| ✂️ | Cắt hoặc đóng băng: không làm, không demo, không nói trong pitch. |
| **ƯỚC TÍNH** | Giả định người dùng nhìn thấy và biết đó là giả định. |

Mọi đường dẫn code trong file này tính từ `frontend/src/`, trừ khi ghi rõ khác.

---

## 1. Tinh thần dự án

**Thesis.**

> *Nguyện Vọng AI là **lớp ra quyết định** (decision layer) đi cùng học sinh lớp 12 từ lúc đặt mục tiêu tới lúc nộp nguyện vọng: em đang ở đâu, thiếu bao nhiêu điểm, nên dồn sức vào môn nào, chọn trường nào, xếp nguyện vọng ra sao — và **tự tính lại toàn bộ mỗi khi có điểm thi thử mới**.*

**Khẩu hiệu.** *"Không chỉ chọn nguyện vọng — mà biết phải làm gì mỗi tuần để đỗ nguyện vọng mình muốn."*

**Vấn đề.** Chọn trường không phải một quyết định ra trong một buổi tối tháng 7. Đó là **chuỗi quyết định kéo dài cả năm lớp 12**:

- Mục tiêu nào là thực tế?
- Còn thiếu mấy điểm?
- Dồn sức vào Toán hay Lý?
- Sau mỗi đợt thi thử: mục tiêu còn giữ được không?
- Cuối cùng: xếp 15 nguyện vọng thế nào để không trượt hết?

Hiện nay mỗi câu hỏi được trả lời ở một nơi khác nhau: trang tra điểm chuẩn, thầy cô, hội nhóm, chatbot. Các câu trả lời không nối với nhau, và không ai cập nhật lại khi điểm của em thay đổi. Hậu quả:

- Năm 2025 có khoảng 850.000 thí sinh đăng ký 7,6 triệu nguyện vọng.
- Vẫn có những em điểm cao trượt toàn bộ vì xếp danh sách theo cảm tính.
- Rất nhiều em ôn dàn trải mọi môn trong khi chỉ một môn là đòn bẩy thật.

**Vì sao là lúc này (2026).**

- **Thông tư 06/2026/TT-BGDĐT:**
  - Tối đa 15 nguyện vọng.
  - Ngành sư phạm chỉ xét nguyện vọng 1–5.
  - Sàn 15/30.
  - Tổng điểm cộng tối đa 3.
- **Bắt buộc quy đổi theo bách phân vị**, cấm "bắc cầu". Bộ đã công bố bảng bách phân vị 2026.
- **Phổ điểm 2026 dịch chuyển mạnh:** Toán +0,87, Văn giảm. Nhìn điểm chuẩn thô năm ngoái để đoán năm nay là sai phương pháp.

**Khác gì sản phẩm đang có**

| Sản phẩm | Trả lời câu gì | Thiếu |
|---|---|---|
| AI Hay "2k8 Đỗ ĐH" | "Ngành này em đỗ không?" (nhãn đỗ / cân nhắc / nguy cơ) | Không có xác suất, không có danh sách, không có kế hoạch, không cập nhật theo thời gian |
| Tuyensinh247, các trang "dự đoán điểm chuẩn" | "Điểm chuẩn năm ngoái bao nhiêu?" | Tra cứu tĩnh |
| **Nguyện Vọng AI** | *"Em thiếu bao nhiêu, làm gì tuần này, xếp danh sách thế nào — và giờ thi thử xong thì mọi thứ thay đổi ra sao?"* | Mới phủ 57 trường; được nói thẳng ở §5.4 |

Họ trả lời **một câu hỏi tại một thời điểm**. Mình là **một vòng lặp quyết định**.

**Ba nguyên tắc không bao giờ vi phạm**

1. **Người dùng quyết định cuối cùng.** App đề xuất, giải thích, cảnh báo; không tự chốt thay em. Brief của TMA yêu cầu điều này với quyết định giáo dục.
2. **Không có số thì nói không có số.** Thiếu học phí thì hiện "chưa có dữ liệu". Thiếu nguồn thì hiện "chưa xác thực". Không người dùng giả, không log giả: vi phạm là bị loại khỏi cuộc thi.
3. **Con số do engine tính, lời văn do AI viết.** LLM không tạo ra và không sửa con số (§8.5).

### 1.4. Mức sẵn sàng công nghệ (TRL) — nói thật

Mục tiêu dài hạn là **TRL 9**: hệ thống thật, chạy liên tục trong môi trường vận hành, đã chứng minh qua một mùa tuyển sinh thật với người dùng thật. Mốc đó chỉ có thể đạt sau mùa tuyển sinh 07/2027. Nếu nói "TRL 9" ngày 15/10/2026, BGK sẽ hỏi bằng chứng vận hành mà mình chưa có.

| Mốc | TRL | Bằng chứng |
|---|---|---|
| Hôm nay (27/09) | 5–6 | Prototype chạy trên live URL; dữ liệu 57 trường chưa có URL nguồn |
| **Nộp bài 15/10** | **7** | Sản phẩm hoàn chỉnh (tài khoản, cài đặt, quản trị, 7 màn lõi) chạy trên live URL. 3 người dùng thật đã dùng (#46). Dữ liệu 20 trường có nguồn. `/verify` 4/4. |
| Học kỳ 2 lớp 12 (01–06/2027) | 8 | Học sinh dùng hằng ngày qua các đợt thi thử; theo dõi lỗi và sửa |
| Sau mùa tuyển sinh 07/2027 | 9 | Đối chiếu dự báo với kết quả trúng tuyển thật của người dùng |

Vì hướng tới TRL 9, **mọi màn phải được thiết kế như sản phẩm dùng hằng ngày** (có tài khoản, cài đặt, quản trị, trạng thái lỗi), không phải chỉ một demo.

---

## 2. Câu chuyện người dùng — một năm lớp 12 của Minh Anh

> ⚠️ Các con số dưới đây và ở §7, §11 là **số minh họa để chốt cách kể**. Tại cổng G4 (12/10) phải thay bằng số thật app tính trên hồ sơ mẫu. Không đưa số minh họa vào slide hay video.

**Minh Anh**, học sinh lớp 12 ở Biên Hòa, Đồng Nai (khu vực 2).
- Thi khối A01, muốn học CNTT ở TP.HCM.
- Bố mẹ làm công nhân; học phí trên khoảng 30 triệu/năm là cả nhà phải tính lại.
- Mỗi tuần có khoảng 50 giờ tự học.

| Thời điểm | Minh Anh hỏi | App trả lời | Màn hình |
|---|---|---|---|
| **Tháng 10** | "Em đang ở đâu?" | Nhập điểm, tổ hợp, khu vực, ngân sách, lịch học. Đặt mục tiêu CNTT – ĐH Bách khoa TP.HCM. | S2 Hồ sơ |
| | "Còn thiếu bao nhiêu?" | *"Em đang cách vùng tham chiếu 1,8 điểm (**ƯỚC TÍNH**)."* | S3 Phân tích năng lực |
| | "Dồn sức vào đâu?" | *"Lý là đòn bẩy lớn nhất: +0,5 điểm Lý mở thêm nhiều lựa chọn nhất; Toán đã gần trần."* | S3 |
| | "Tuần này học gì?" | Kế hoạch 52,5 giờ/tuần, chia theo đòn bẩy từng môn | S6 Kế hoạch học |
| **Tháng 3** | "Thi thử xong rồi, giờ sao?" | Nhập điểm thi thử. App làm mượt (không tin tuyệt đối một đề), rồi **tính lại tất cả**: khoảng cách, đòn bẩy, giờ học, khả năng trượt hết của danh sách. *"Lý +0,6 → 2 nguyện vọng chuyển từ Thử sức lên Phù hợp; giảm 3 giờ Lý, tăng 3 giờ Anh."* **Đây là khoảnh khắc "à, ra thế".** | S6 → S5 |
| **Tháng 7** | "Xếp 15 nguyện vọng sao cho khỏi trượt hết?" | Danh sách 3 nhóm Thử sức / Phù hợp / An toàn kèm **khả năng trượt hết**. Mỗi dòng có lý do. | S5 Xếp nguyện vọng |
| | Mẹ hỏi *"Sao tin được?"* | Nguồn từng con số, giả định, công thức; báo cáo 1 trang cho phụ huynh | S7 Cách tính |

**Người dùng phụ**
- **Phụ huynh:** đọc báo cáo phụ huynh (S7).
- **Giáo viên tư vấn:** xem nhanh khoảng cách và danh sách của học sinh (S3, S5), xuất CSV.

---

## 3. Chấm điểm → thiết kế

Tính năng nào không ăn điểm ở bảng này thì bị cắt (§6.3).

**Vòng chấm hồ sơ — tiêu chí TMA, 100 điểm**

| Tiêu chí | Điểm | BGK dễ trừ khi | Mình ăn điểm bằng |
|---|---|---|---|
| 1. Giải quyết vấn đề & tác động | 20 | Người dùng mơ hồ | Một năm lớp 12 của Minh Anh (§2); vòng quyết định trọn vẹn |
| 2. Phù hợp Việt Nam | 15 | Luật và dữ liệu không phải của Việt Nam | Điểm ưu tiên khu vực/đối tượng, TT06/2026, bách phân vị của Bộ, đề án tuyển sinh thật |
| 3. Sáng tạo & khác biệt | 20 | *"Chỉ là tìm kiếm, tổng hợp hoặc chatbot"* | **Vòng lặp khép kín** thi thử → tính lại (Wow 1); tối ưu cả danh sách (Wow 2) |
| 4. Đổi mới dữ liệu & AI | 20 | AI không dự báo, tối ưu hay mô phỏng; không nêu giới hạn | Xác suất có dải bất định; tối ưu danh mục; mô phỏng "nếu… thì…"; đòn bẩy môn; backtest; Hộ chiếu dữ liệu |
| 5. Khả thi & demo | 15 | Demo lỗi, dữ liệu giả | Live URL tĩnh, không cần đăng nhập, nút "Thử hồ sơ mẫu"; trang Verify |
| 6. Trình bày & UX | 10 | Không trả lời được câu hỏi về giả định, dữ liệu, rủi ro | S7 Cách tính + bộ hỏi–đáp §10 |

**Demo Day 17/10.** Thang này lấy từ brief bảng khác cùng cuộc thi, chưa xác nhận cho bảng TMA, nhưng vẫn chuẩn bị như thể áp dụng:

| Phần | Điểm |
|---|---|
| Demo trực tiếp | 45 |
| Hỏi đáp | 35 |
| **Kiểm chứng trực tiếp** (BGK nhập 2 hồ sơ lạ, 1 hồ sơ bất thường) | 20 |

---

## 4. USP — ba điểm "wow"

### Wow 1 — Vòng quyết định khép kín

Thi thử → làm mượt điểm → tính lại khoảng cách → đòn bẩy môn → phân bổ giờ học → danh sách nguyện vọng và khả năng trượt hết. App cho thấy **cái gì đã thay đổi và vì sao**.

- **Làm mượt theo độ tin cậy của đề.** Đề trường chuyên được tin hơn đề trường thường: điểm mới = (1 − γ) · điểm cũ + γ · điểm thi thử, với γ = 0,6 · ω và ω ∈ {0,95; 0,85; 0,75}. Nhờ vậy một đề dễ bất thường không làm em ảo tưởng.
- **Kết quả là một bản "diff".** Điểm thay đổi ra sao, khả năng trượt hết tăng hay giảm, nguyện vọng nào được nâng nhóm, giờ học dịch chuyển thế nào.
- Code:
  - ✅ `state/DecisionContext.tsx` (`submitMockTest`)
  - ✅ `features/study-plan/MockTestModal.tsx`
  - ✅ `features/method/ClosedLoopFeedbackCard.tsx`
  - 🔧 Chuyển lõi tính của `submitMockTest` sang `engine/` để test được. Hạn 12/10 (#13, Kiệt).

### Wow 2 — Khả năng trượt hết của cả danh sách

Mọi đối thủ chấm từng ngành; mình chấm **cả danh sách**. Năm đề dễ, điểm chuẩn cả nước cùng tăng, nên 7 nguyện vọng CNTT cùng mức điểm thực chất là một vụ cược đặt 7 lần.

- Mô hình có **cú sốc chung toàn quốc** (national shock). Khả năng trượt hết được tính tất định bằng tích phân Gauss-Hermite.
- Tối ưu tối đa 15 nguyện vọng chia 3 nhóm Thử sức / Phù hợp / An toàn.
- Code:
  - ✅ `engine/decision/optimizer.ts` (`buildOptimizedPortfolio`, `calculateWishlistFailAll`)
  - ✅ `engine/admissions/probability.ts`
  - 🔧 Luật 2026 thành ràng buộc cứng: sư phạm chỉ NV1–5, trần cộng 3 điểm. Hạn 12/10 (#26, Dũng).

### Wow 3 — Trung thực có kiểm chứng

- **Hộ chiếu dữ liệu** trên mọi con số: nguồn, năm, ngày thu thập, hash snapshot.
  - ✅ `features/method/DataPassportTable.tsx`, `state/dataset-freshness.tsx`
  - 🔧 Còn thiếu URL và ngày.
- **Mô hình bách phân vị:** điểm chuẩn các năm quy về vị trí trong phổ điểm năm đó, rồi chiếu sang 2026. Đúng cách Bộ bắt buộc quy đổi. 📐 hạn 12/10 (#44, Kiệt).
- **Backtest công khai:** dùng 2023–2024 dự đoán 2025, có biểu đồ hiệu chỉnh (calibration). 📐 hạn 12/10 (#44, Kiệt).
- **Trang `/verify`:** một nút chạy 4 ca kiểm chứng, gồm ca app phải từ chối đúng. 📐 hạn 08/10 (#40, Dũng).

**Câu chốt pitch:** *"App khác cho em một câu trả lời. Tụi em cho em một vòng lặp: mỗi lần thi thử, em biết ngay mình gần mục tiêu hơn bao nhiêu, tuần sau học gì, và danh sách nguyện vọng an toàn đến đâu."*

---

## 5. Lớp dữ liệu — moat thật sự

Đội khác có thể chép giao diện. Thứ khó chép là **dữ liệu điểm chuẩn đã chuẩn hóa theo phương thức và bách phân vị, có nguồn gốc từng dòng, cộng với backtest trên chính dữ liệu đó, cộng với vòng lặp thi thử của người dùng**.

### 5.1. Hiện trạng thật (đo 27/09/2026)

| Chỉ số | Hiện có |
|---|---|
| Trường / chương trình | 57 / 1.850 (`data/processed/programs.parquet` ở gốc repo; `data/programs-catalog.json` trong frontend) |
| Năm điểm chuẩn | 2022–2025. 471 chương trình chỉ có 1 năm; 1.334 có 2 năm; 45 có 3 năm. |
| URL nguồn / ngày thu thập | **0 / 1.850** (manifest `frontend/public/data/manifest.json` ghi `unknown`) |
| Học phí thật | 6 / 1.850. Placeholder 24 triệu đã chuyển thành `null` trong `data/catalog.ts`. |
| Tỉ lệ việc làm thật | 5 / 1.850 |
| Tổ hợp thật | 299 / 1.850 |
| Dòng lỗi | 237 "điểm" dưới 10 (chỉ tiêu bị bóc nhầm); 114 dòng mâu thuẫn |
| Cú sốc toàn quốc | σ ≈ 1,29, ước từ 331 cặp năm. Độ tin cậy thấp. |

### 5.2. Pipeline

```text
pipeline/scrape   PDF đề án, trang điểm chuẩn     (chặn SSRF bằng common/url_safety.py)
pipeline/clean    1 dòng = (trường, ngành, phương thức, tổ hợp, năm, điểm, URL, ngày)
pipeline/features cú sốc toàn quốc, dự báo         (common/national_shock.py)
   📐 bách phân vị: điểm chuẩn → percentile phổ điểm năm → chiếu sang 2026; quy đổi HSA/V-ACT
   📐 backtest: 2023–2024 → 2025, xuất backtest.json
pipeline/publish.py  snapshot JSON bất biến theo SHA-256 + manifest → frontend/public/data/
```

### 5.3. Chỉ tiêu dữ liệu trước G4 (12/10)

| # | Chỉ tiêu | Người làm | Trạng thái |
|---|---|---|---|
| D1 | 20 trường trọng tâm (CNTT, Kinh tế, Kỹ thuật ở TP.HCM và Hà Nội): điểm chuẩn 2023–2026, 100% dòng có URL và ngày | Tuấn (#21) | 📐 |
| D2 | Học phí thật năm 2026–2027 cho 20 trường đó | Tuấn (#21) | 📐 |
| D3 | Tổ hợp thật cho 20 trường đó | Tuấn (#21) | 📐 |
| D4 | Phổ điểm của Bộ 2023–2026 → bảng bách phân vị; bảng quy đổi HSA và V-ACT | Kiệt (#44) | 📐 |
| D5 | Lọc hoặc gắn cờ mọi dòng lỗi | Tuấn (#21) | 🔧 |
| D6 | 37 trường còn lại gắn nhãn "chưa xác thực", không vào gợi ý mặc định | Dũng (#28) | 📐 |
| D7 | Backtest + `frontend/public/data/backtest.json` | Kiệt (#44) | 📐 |

### 5.4. Giới hạn — nói thẳng trong app và pitch

- Chỉ 20 trường được kiểm chứng đầy đủ, trên khoảng 440 trường cả nước. Mở rộng bằng cùng pipeline, mỗi trường khoảng 30 phút công.
- Dải bất định rộng vì cú sốc toàn quốc ước từ ít năm dữ liệu. App hiện dải rộng, không giấu.
- Chưa có dữ liệu việc làm tin cậy nên app không hiển thị.
- Làm mượt điểm thi thử dùng hệ số ω theo loại trường. Đây là **ƯỚC TÍNH**, và app phải ghi rõ.
- Khoảng cách từ tỉnh tới trường hiện dùng mặc định 300 km (`common/utility.py`), vì chưa có bảng khoảng cách thật.

---

## 6. Phạm vi — sản phẩm dùng hằng ngày: 20 màn

### 6.1. Sitemap

| Nhóm | # | Màn | Route | Ai thấy | Issue |
|---|---|---|---|---|---|
| **Công khai & tài khoản** | A1 | Trang giới thiệu + "Dùng thử không cần tài khoản" | `/` (khi chưa đăng nhập) | Mọi người | #35, #38 |
| | A2a | Đăng nhập (email, Google) | `/login` | Mọi người | #35, #38, #42 |
| | A2b | Đăng ký | `/register` | Mọi người | #35, #38, #42 |
| | A2c | Quên mật khẩu | `/forgot-password` | Mọi người | #35, #38, #42 |
| | A3 | Onboarding 3 bước lần đầu | `/onboarding` | Người mới | #35, #38 |
| **Vòng quyết định (nav chính, như bản live)** | S1 | Tổng quan | `/dashboard` | Học sinh | #34, #20 |
| | S2 | Hồ sơ của em (+ mục tiêu) | `/profile`, `/profile/goal` | Học sinh | #34, #20 |
| | S3 | Phân tích năng lực | `/analysis` (+ gap, roi, simulation) | Học sinh | #34, #20 |
| | S4 | Khám phá trường (+ so sánh) | `/options`, `/comparison` | Học sinh | #34, #20 |
| | S5 | Xếp nguyện vọng | `/portfolio` | Học sinh | #34, #40 |
| | S6 | Kế hoạch học (+ nhập thi thử) | `/study-plan` | Học sinh | #34, #23 |
| | S7 | Cách tính (+ báo cáo phụ huynh) | `/explanation` | Học sinh, phụ huynh | #34, #20 |
| **Tiện ích hằng ngày** | A4 | Cài đặt: tài khoản, bảo mật, thông báo, quyền riêng tư (xuất/xóa dữ liệu), chia sẻ cho phụ huynh/giáo viên | `/settings` | Người đã đăng nhập | #35, #38, #42 |
| | A5 | Thông báo & mốc tuyển sinh | `/notifications` | Học sinh | #35, #41 |
| | A6 | 404 / mất mạng | — | Mọi người | #35, #38 |
| **Quản trị** | AD1 | Tổng quan hệ thống | `/admin` | Admin | #36, #39, #43 |
| | AD2 | Dữ liệu & snapshot (publish / rollback, độ phủ nguồn) | `/admin/data` | Admin | #36, #39, #43 |
| | AD3 | Người dùng & vai trò | `/admin/users` | Admin | #36, #39, #43 |
| | AD4 | Phản hồi & nhật ký thao tác | `/admin/audit` | Admin | #36, #39, #43 |
| **Kiểm chứng** | V | Verify cho ban giám khảo | `/verify` | Mọi người (không có trong nav) | #37, #40, #49 |

**Vai trò:**
- Học sinh: toàn bộ S1–S7, A4, A5.
- Phụ huynh / giáo viên: xem chỉ đọc qua link chia sẻ (S1, S5, S7).
- Admin: thêm AD1–AD4.
- Khách (chưa đăng nhập): S1–S7 lưu trên máy như hiện nay. Hộ chiếu dữ liệu và `/verify` luôn công khai.

### 6.2. Tính năng

| Mã | Tính năng | Màn hình | Trạng thái |
|---|---|---|---|
| F1 | Hồ sơ theo 7 chiều của brief: mục tiêu, học phí, vị trí, tuyển sinh, nghề nghiệp, năng lực, hoàn cảnh gia đình; kèm lịch học tuần | S2 | ✅ `features/profile/*` |
| F2 | Điểm xét tuyển theo tổ hợp + điểm ưu tiên giảm dần + chứng chỉ | S2 | ✅ `engine/admissions/priority.ts`, `engine/scoring/composite.ts`; 🔧 trần cộng 3 điểm |
| F3 | Khoảng cách tới mục tiêu | S3 | ✅ `engine/gap/engine.ts`, `engine/gap/selectors.ts` |
| F4 | Môn đòn bẩy (subject ROI) | S3 | ✅ `engine/roi/engine.ts`, `engine/roi/selectors.ts` |
| F5 | Mô phỏng "nếu… thì…" (± điểm, ngân sách, vùng, bỏ IELTS) | S3 | ✅ `engine/decision/scenario.ts`, `features/analysis/simulation/ScenarioSimulator.tsx` |
| F6 | Khám phá và so sánh trường/ngành | S4 | ✅ `features/explore/*`, `pages/explore/compare/page.tsx` |
| F7 | Xác suất đỗ + tối ưu 15 nguyện vọng + khả năng trượt hết | S5 | ✅ `engine/decision/optimizer.ts`, `engine/recommend/recommendation-engine.ts`; 🔧 hợp nhất (§8.4) |
| F8 | Kế hoạch ôn thi + vòng thi thử | S6 | ✅ `engine/study-plan/engine.ts`, `state/DecisionContext.tsx`; 🔧 tách lõi vòng lặp sang `engine/` |
| F9 | Giải thích + báo cáo phụ huynh + hỏi AI | S7 | ✅ template `engine/explain/ai-decision-engine.ts`, `features/method/ParentReportModal.tsx`; 📐 LLM |
| F10 | Hộ chiếu dữ liệu + Verify | S7, V | ✅ `features/method/DataPassportTable.tsx`; 📐 `/verify` (#40) |
| F11 | Tài khoản + đồng bộ hồ sơ (tùy chọn), vẫn dùng được không cần tài khoản | A1–A4 | 📐 #38 (UI), #42 (API) |
| F12 | Thông báo & mốc tuyển sinh | A5 | 📐 #41 |
| F13 | Quản trị: dữ liệu/snapshot, người dùng, phản hồi, nhật ký | AD1–AD4 | 📐 #39 (UI), #43 (API) |

### 6.3. Luồng quyết định (brief bắt buộc: đầu vào → kết quả → giải thích → hành động)

```text
S1 Tổng quan ─► S2 Hồ sơ của em ─► S3 Phân tích năng lực ─► S4 Khám phá trường ─► S5 Xếp nguyện vọng
                     ▲                                                                   │
                     │        S6 Kế hoạch học ◄──────────────────────────────────────────┘
                     └──── nhập điểm thi thử (tính lại toàn bộ) ◄──┘
S7 Cách tính: mở được từ mọi màn hình (giải thích, nguồn, báo cáo phụ huynh)
```

### 6.4. Danh sách cắt / đóng băng ✂️

| Thứ bị cắt | Vì sao |
|---|---|
| Backend FastAPI (`backend/`): CRUD, 31 bảng, webhook, rate limit, telemetry | Frontend không gọi; tài khoản và quản trị làm trên stack mới (§8.3). Giữ code, test trong `tests/backend/` |
| Lớp nghề nghiệp CareerAI, trắc nghiệm Holland | Quyết định chính thức (28/09): GIỮ NGUYÊN CẮT BỎ. Dữ liệu chưa kiểm chứng độc lập; tránh mở thêm bài toán thứ hai làm phân tán câu chuyện cốt lõi Decision Intelligence phân bổ danh mục nguyện vọng theo TMA Brief |
| `analytics-engine`, `study-plan-intelligence` | Trùng với engine đang chạy; đã xóa ngày 27/09 |
| Mô hình LightGBM `train_quantile` cũ | Đã thay thế hoàn toàn bằng `pipeline/models/train_ml.py` (huấn luyện trên 840 mẫu train, kiểm định out-of-sample 2025 đạt chuẩn Data Science) |

---

## 7. Từng màn hình — câu chuyện và lý do phải code

Tên và thứ tự đúng như nav bản live (`components/layout/Sidebar.tsx`). URL giữ nguyên để link cũ không gãy.

### S1 — Tổng quan · `/dashboard`

- **Câu chuyện:** Minh Anh mở app lần đầu, hoặc quay lại sau một tuần.
- **Hỏi:** *"Em đang thế nào, việc tiếp theo là gì?"*
- **Trả lời:** 4 thẻ, cùng một nguồn số:
  1. Mục tiêu và khoảng cách.
  2. Môn nên ưu tiên.
  3. Các phương án đáng cân nhắc.
  4. Kế hoạch tuần này.
  - Người mới: nút **Nhập hồ sơ** và **Thử hồ sơ mẫu 1-click**.
- **Dữ liệu → xử lý → kết quả:** state hồ sơ → `buildDashboardSummary` → 4 thẻ.
- **AI:** không.
- **Vì sao phải code:**
  - Tiêu chí 5: BGK vào bằng "hồ sơ mẫu" trong 10 giây.
  - Tiêu chí 6: một màn trả lời "việc tiếp theo".
- **Hiện trạng:**
  - ✅ `pages/overview/page.tsx`, `engine/decision/dashboard-summary.ts`.
  - 🔧 Bỏ số cứng trong thẻ "Kế hoạch tuần này" với người mới (bản live còn hiện 5/5 cho user chưa nhập gì).
- **Hạn / người:** UI 03/10 (#34) · frontend 08/10 (#20) · Hưng.

### S2 — Hồ sơ của em · `/profile`, `/profile/goal`

- **Câu chuyện:** Tháng 10, Minh Anh nhập điểm dự kiến, khu vực 2, ngân sách, lịch học, rồi chọn mục tiêu.
- **Hỏi:** *"Điểm xét tuyển thực của em là bao nhiêu, mục tiêu nào hợp?"*
- **Trả lời:** điểm theo từng tổ hợp (ma trận tổ hợp), điểm ưu tiên, mức hoàn thiện hồ sơ, gợi ý mục tiêu.
- **Luật cứng:**
  - Điểm ngoài 0–10 thì báo lỗi, không lưu.
  - Chưa đủ 3 môn thì không tự nhân 3.
  - Ưu tiên giảm dần khi điểm từ 22,5 trở lên.
  - Cộng tối đa 3.
- **AI:** không; luật tất định.
- **Vì sao phải code:** đây là "đầu vào" của luồng mà brief bắt buộc (tiêu chí 1, 2).
- **Hiện trạng:**
  - ✅ `pages/profile/page.tsx`, `pages/profile/goal/page.tsx`, `features/profile/*`, `features/profile/goal/*`.
  - 🔧 Validate input; áp trần cộng 3 điểm.
- **Hạn / người:** UI 03/10 (#34) · frontend 08/10 (#20) · Hưng; luật TT06 12/10 (#26) · Dũng.

### S3 — Phân tích năng lực · `/analysis` (+ `/analysis/gap`, `/analysis/roi`, `/analysis/simulation`)

- **Câu chuyện:** Minh Anh muốn biết còn thiếu bao nhiêu và nên dồn sức vào đâu.
- **Hỏi:** *"Em cách mục tiêu bao xa? Môn nào đáng đầu tư nhất? Lỡ điểm thay đổi thì sao?"*
- **Trả lời:**
  - **Khoảng cách** so với vùng tham chiếu, kèm giả định dữ liệu.
  - **Bảng đòn bẩy môn:** +0,5 điểm môn nào mở thêm nhiều lựa chọn nhất.
  - **Mô phỏng:** kéo ± điểm, đổi ngân sách hoặc vùng → kết quả đổi ngay, không ghi đè hồ sơ gốc.
- **Dữ liệu → xử lý → kết quả:** hồ sơ + mục tiêu → `selectGapAnalysis`, `selectSubjectRoiAnalysis`, `runScenario` → khoảng cách, bảng ROI, kết quả mô phỏng.
- **AI:** dự báo và mô phỏng (tiêu chí 4). Nút "Hỏi AI" hiện dùng template.
- **Vì sao phải code:**
  - Đây là nửa "làm gì" của decision layer, phần làm mình khác mọi app tra cứu (tiêu chí 3).
  - "Mô phỏng" có tên trong tiêu chí 4.
- **Hiện trạng:**
  - ✅ `pages/analysis/*`, `features/analysis/gap/*`, `features/analysis/roi/*`, `features/analysis/simulation/ScenarioSimulator.tsx`, `engine/gap/*`, `engine/roi/*`, `engine/decision/scenario.ts`.
  - 🔧 Gộp 2 cặp cài đặt trùng (§8.4). Bỏ mục tiêu tự điền khi học sinh chưa chọn (`GOLDEN_PROGRAMS[0]` trong `pages/analysis/page.tsx`).
- **Hạn / người:** UI 03/10 (#34) · frontend 08/10 (#20) · Hưng; gộp gap/ROI 12/10 (#27) · Dũng.

### S4 — Khám phá trường · `/options` (+ `/comparison`)

- **Câu chuyện:** Minh Anh tò mò "CNTT Bách khoa khác KHTN thế nào?".
- **Hỏi:** *"Có những lựa chọn nào hợp với em, đặt cạnh nhau thì khác gì?"*
- **Trả lời:**
  - Lưới trường/ngành lọc theo hồ sơ; mỗi thẻ có xác suất, học phí (hoặc "chưa có dữ liệu"), nguồn.
  - Chọn 2–4 thẻ để so sánh; nút "So sánh chi tiết" mở `/comparison`.
  - Nút "Thêm vào danh sách" → S5.
- **AI:** mô hình xác suất (F7). Nút "AI phân tích độ phù hợp" hiện dùng template.
- **Vì sao phải code:** brief yêu cầu "so sánh trường, ngành, chương trình theo mục tiêu, học phí, vị trí…" (tiêu chí 1).
- **Hiện trạng:**
  - ✅ `pages/explore/page.tsx`, `pages/explore/compare/page.tsx` (1.035 dòng, cần tách component), `features/explore/*`.
  - 🔧 Trang so sánh còn dùng `GOLDEN_PROGRAMS`; phải chuyển sang catalog chung.
- **Hạn / người:** UI 03/10 (#34) · frontend 08/10 (#20) · Hưng.

### S5 — Xếp nguyện vọng · `/portfolio` ★

- **Câu chuyện:** Tháng 7, còn 2 ngày tới hạn chốt 14/7.
- **Hỏi:** *"Danh sách của em có an toàn không, sửa chỗ nào?"*
- **Trả lời:**
  - Danh sách tối đa 15 nguyện vọng chia Thử sức / Phù hợp / An toàn.
  - **Khả năng trượt hết** kèm nhãn ƯỚC TÍNH.
  - Biểu đồ phân bổ; "Lý do sắp xếp".
  - Nút tối ưu lại: đề xuất thay đổi, người dùng chấp nhận.
- **Dữ liệu → xử lý → kết quả:** ứng viên hợp lệ → `buildOptimizedPortfolio` → danh sách + `calculateWishlistFailAll`.
- **AI:** tối ưu và mô phỏng xác suất (tiêu chí 4). LLM chỉ viết lời giải thích.
- **Vì sao phải code:** Wow 2; tiêu chí 3 và 4 (40 điểm). Đây là "kết quả" của luồng.
- **Hiện trạng:**
  - ✅ `pages/portfolio/page.tsx`, `features/portfolio/*`, `engine/decision/optimizer.ts`, `engine/decision/portfolio-assessment.ts`.
  - 🔧 Hợp nhất engine (§8.4). Luật sư phạm NV1–5. Hiện "vì sao / vì sao không / điều gì làm sai".
- **Hạn / người:** UI 03/10 (#34, Hưng) · frontend 08/10 (#40, Dũng) · engine hợp nhất 12/10 (#28, Dũng).

### S6 — Kế hoạch học · `/study-plan` ★

- **Câu chuyện:** Mỗi tuần Minh Anh cần biết học gì. Sau mỗi đợt thi thử, em nhập điểm mới.
- **Hỏi:** *"Tuần này em học gì? Thi thử xong thì kế hoạch và danh sách thay đổi ra sao?"*
- **Trả lời:**
  - Quỹ giờ tự học mỗi tuần (ví dụ 52,5 giờ), phân bổ theo đòn bẩy môn (water-filling).
  - Lịch tuần, mục tiêu và nhiệm vụ tuần.
  - Nút **Nhập điểm thi thử** → bản diff vòng lặp (Wow 1).
- **Dữ liệu → xử lý → kết quả:** lịch học + ROI môn → `buildStudyPlan`. Điểm thi thử → `submitMockTest` → hồ sơ mới → khoảng cách, ROI, danh mục, khả năng trượt hết mới.
- **AI:** tối ưu phân bổ giờ học; tính lại danh mục.
- **Vì sao phải code:**
  - **Đây là "hành động tiếp theo" mà brief yêu cầu, và là thứ biến app từ công cụ tra cứu thành vòng lặp quyết định** (tiêu chí 3).
  - Khoảnh khắc wow của demo.
- **Hiện trạng:**
  - ✅ `pages/study-plan/page.tsx`, `features/study-plan/*`, `engine/study-plan/engine.ts`, `state/DecisionContext.tsx`.
  - 🔧 Bỏ ngày cứng 2025. Đưa lõi `submitMockTest` vào `engine/`. Test bất biến: điểm tăng thì khoảng cách không xa thêm.
- **Hạn / người:** UI 03/10 (#34, Hưng) · frontend 08/10 (#23, Kiệt) · lõi vòng thi thử trong `engine/` 12/10 (#13, Kiệt).

### S7 — Cách tính · `/explanation`

- **Câu chuyện:** Mẹ Minh Anh hỏi *"Sao con tin cái app này?"*.
- **Hỏi:** *"Con số lấy ở đâu, sai được bao nhiêu, giải thích cho bố mẹ thế nào?"*
- **Trả lời:**
  - Cảnh báo "hệ thống không đảm bảo trúng tuyển".
  - Tóm tắt khuyến nghị; dữ liệu đã dùng; suy luận từng bước.
  - "Nếu cập nhật điểm mới…"
  - Hộ chiếu dữ liệu, công thức, báo cáo phụ huynh.
  - 📐 Biểu đồ backtest và ô hỏi AI (LLM).
- **AI:** LLM diễn giải có rào chắn (§8.5).
- **Vì sao phải code:** brief bắt buộc "giải thích và cơ chế kiểm soát rủi ro, trình bày giả định, mức độ bất định". Ăn tiêu chí 4 ("nêu rõ giới hạn") và tiêu chí 6.
- **Hiện trạng:**
  - ✅ `pages/method/page.tsx`, `features/method/*`.
  - 📐 Backtest, LLM.
- **Hạn / người:** UI 03/10 (#34) · frontend 08/10 (#20) · Hưng; backtest 12/10 (#44, Kiệt); LLM 12/10 (#45, Tuấn).

### V — Verify cho ban giám khảo · `/verify` (không nằm trong nav, link từ README và chân trang)

| Ca | Đầu vào | Mong đợi |
|---|---|---|
| 1 | Hồ sơ mẫu Minh Anh | Luồng đủ: khoảng cách, đòn bẩy, kế hoạch, danh sách không vi phạm luật |
| 2 | Hồ sơ mẫu + điểm thi thử mới | Bản diff đúng chiều: điểm tăng thì khả năng trượt hết không tăng |
| 3 | Ngành sư phạm đặt ở nguyện vọng 8 | **Từ chối đúng**, dẫn luật TT06 |
| 4 | Điểm 11, thiếu môn, hoặc tổ hợp không tồn tại | **Từ chối đúng**, báo lỗi rõ |

- **Vì sao phải code:** 20 điểm kiểm chứng trực tiếp ở Demo Day.
- **Hiện trạng:** 📐. Tái dùng `frontend/tests/test_decision_quality.ts`, `test_decision_layer.ts`.
- **Hạn / người:** thiết kế 03/10 (#37) · code 08/10 (#40) · tập kiểm chứng 15/10 (#49) · Dũng.

### A1–A6 — Tài khoản & tiện ích hằng ngày

- **Câu chuyện:** Minh Anh dùng app cả năm, trên điện thoại và máy tính ở trường; mẹ muốn xem danh sách từ máy của mẹ.
- **Hỏi:** *"Dữ liệu của em có mất không? Em có bị lỡ hạn không? Làm sao cho mẹ xem?"*
- **Trả lời:**
  - A1: giới thiệu 1 màn, nút "Dùng thử không cần tài khoản" (BGK vào thẳng hồ sơ mẫu).
  - A2: đăng nhập / đăng ký / quên mật khẩu (email + Google).
  - A3: onboarding 3 bước (lớp, tỉnh, khu vực → điểm → mục tiêu), rồi vào S1.
  - A4: cài đặt tài khoản, bảo mật, thông báo; **xuất và xóa toàn bộ dữ liệu**; link chia sẻ chỉ đọc cho phụ huynh/giáo viên.
  - A5: mốc tuyển sinh có nguồn (đăng ký 2–14/7…), nhắc thi thử và việc trong tuần.
  - A6: 404, mất mạng (app vẫn chạy với dữ liệu đã tải).
- **Luật:** đồng bộ hồ sơ lên server chỉ khi người dùng bật; không đăng nhập vẫn dùng đủ S1–S7.
- **Vì sao phải code:**
  - Tiêu chí 5 ("khả năng mở rộng, tích hợp, quy trình cụ thể").
  - Điều kiện để đạt TRL 7 (§1.4): sản phẩm dùng thật, không chỉ demo.
  - Chia sẻ cho phụ huynh là "hành động tiếp theo" thật.
- **Hạn / người:** UI 03/10 (#35) · frontend 08/10 (#38) · Hưng; API 12/10 (#42) · Tuấn; A5 frontend 08/10 (#41) · Kiệt.

### AD1–AD4 — Quản trị

- **Câu chuyện:** Mùa tuyển sinh, trường công bố điểm chuẩn mới; quản trị viên phải cập nhật dữ liệu trong 1 giờ và biết ngay nếu có gì sai.
- **Hỏi:** *"Dữ liệu đang là phiên bản nào, phủ bao nhiêu nguồn? Publish bản mới hoặc quay lại bản cũ thế nào? Ai đang dùng, có phản hồi lỗi gì?"*
- **Trả lời:**
  - AD1: số người dùng hoạt động, phiên bản snapshot, độ phủ URL/ngày, lỗi.
  - AD2: danh sách snapshot, publish/rollback (cùng logic `pipeline/publish.py`), dòng bị gắn cờ.
  - AD3: người dùng và vai trò, khóa tài khoản.
  - AD4: phản hồi người dùng và nhật ký mọi thao tác admin.
- **Vì sao phải code:**
  - Tiêu chí 5: chứng minh vận hành và cập nhật dữ liệu được, không chỉ chạy một lần.
  - Tiêu chí 4: chiến lược dữ liệu có quy trình.
  - Trả lời câu "dữ liệu có cũ không?" bằng một màn thật.
- **Hạn / người:** UI 03/10 (#36) · frontend 08/10 (#39) · API 12/10 (#43) · Tuấn.

---

## 8. Kiến trúc

### 8.1. Hệ thống

```text
┌──────── OFFLINE (máy dev) ────────┐        ┌──────── Cloudflare Workers ─────────────────┐
│ pipeline/ (Python)                │ build  │ Static assets: Vite + React 19 SPA          │
│  scrape → clean → features        │ ─────► │  engine/ chạy trong trình duyệt (<200 ms)   │
│  pipeline/publish.py              │        │  hồ sơ lưu localStorage (khách)             │
│  → frontend/public/data/          │        │ 📐 Worker API: /api/auth, /api/sync,         │
│    (snapshot SHA-256 + manifest)  │        │    /api/admin/*, /api/explain → LLM          │
│                                   │        │ 📐 D1 (SQLite): users, profiles, audit      │
│                                   │        └─────────────────────────────────────────────┘
└───────────────────────────────────┘
backend/ (FastAPI) — ✂️ đóng băng, frontend không gọi
```

Vì sao chọn kiến trúc này:
- **Demo không thể sập:** cả app là file tĩnh; LLM lỗi thì lùi về template.
- **Riêng tư:** hồ sơ không rời máy.
- **Chi phí gần 0** khi có hàng trăm nghìn người dùng.

### 8.2. Decision layer — luồng dữ liệu trong `engine/`

```text
Hồ sơ (state/DecisionContext)
  │
  ├─► engine/scoring/composite + engine/admissions/priority ─► điểm xét tuyển theo tổ hợp
  │        │
  │        ├─► engine/gap ─────────────► khoảng cách tới mục tiêu               (S3)
  │        ├─► engine/roi ─────────────► đòn bẩy từng môn                       (S3)
  │        ├─► engine/decision/scenario ► mô phỏng "nếu… thì…"                  (S3)
  │        └─► engine/admissions/probability + engine/decision/optimizer
  │                 ─► ứng viên → danh mục 15 NV → khả năng trượt hết           (S4, S5)
  │
  ├─► engine/study-plan ◄── đòn bẩy môn + lịch học ─► kế hoạch tuần             (S6)
  │
  └─◄ điểm thi thử (submitMockTest: làm mượt theo độ tin cậy) ─── tính lại toàn bộ vòng
engine/explain ─► lời giải thích (template; 📐 LLM qua /api/explain)            (S7)
```

### 8.3. Tài khoản & quản trị — đề xuất stack (chốt ở G1, issue #32, Tuấn)

**Đề xuất:** Cloudflare Workers (cùng nơi đang deploy SPA) + D1 (SQLite) cho người dùng, hồ sơ đồng bộ, phản hồi, audit log. Đăng nhập bằng email + Google.

**Vì sao không dùng lại FastAPI:**
- FastAPI cần một server chạy riêng, có cold start, thêm chi phí và thêm chỗ có thể hỏng khi demo.
- Workers + D1 chạy cùng domain, không cần server, gần như miễn phí ở quy mô này.

**Nguyên tắc:**
- Engine tính toán vẫn chạy trên trình duyệt; server chỉ lưu và phân quyền, **không tính lại con số**.
- Chế độ khách giữ nguyên localStorage.
- Không có khóa bí mật trong frontend.

Frontend (G3) dùng adapter giả `state/auth` có cùng kiểu với API. Sang G4 chỉ cần thay adapter, không sửa UI.

### 8.4. Việc kỹ thuật lớn còn lại (G4, Dũng)

Refactor ngày 27/09 đã đặt mọi thứ đúng chỗ, nhưng **chưa gộp** các cài đặt trùng đang chạy (cố ý, để không đổi kết quả khi đang di chuyển file):

| Trùng | Chốt | Hạn |
|---|---|---|
| `engine/recommend/recommendation-engine.ts` (ngưỡng 0,85/0,50) và `engine/decision/optimizer.ts` (0,80/0,40) | Một engine duy nhất, một bộ ngưỡng, chạy trên catalog đã làm sạch | 12/10 (#28) |
| `engine/gap/engine.ts` (`runGapAnalysis`) và `engine/gap/selectors.ts` (`selectGapAnalysis`) | Một hàm | 12/10 (#27) |
| `engine/roi/engine.ts` và `engine/roi/selectors.ts` | Một hàm | 12/10 (#27) |
| `engine/decision/{candidate-generator,context-builder,gap-calculator,decision-result}.ts` | Tính trong `DecisionContext` nhưng không màn nào dùng. Hoặc thay thế các bản trên, hoặc xóa. `frontend/tests/test_decision_result.ts` đang fail sẵn (assertion `cost`) nên chưa đưa vào `npm test`. | 12/10 (#28) |
| `GOLDEN_PROGRAMS` (`data/universities/index.ts`) dùng làm dữ liệu hiển thị | Chỉ giữ làm hồ sơ mẫu; mọi số hiển thị lấy từ catalog | 08/10 (#20) |

### 8.5. Lớp LLM — rào chắn

1. LLM chỉ nhận JSON kết quả đã tính xong.
2. LLM chỉ viết lời giải thích và trả lời câu hỏi; không đổi thứ tự, không đổi số.
3. Mọi số trong câu trả lời phải có trong JSON đầu vào. Sai là bỏ câu trả lời và dùng template.
4. Từ chối câu hỏi ngoài phạm vi.
5. Dùng credit API BTC cấp trong Sprint 2. Chốt model tại G4 và ghi vào build log.

### 8.6. Cây thư mục (sau refactor 27/09)

```text
ba.md · README.md · .agents/AGENTS.md
frontend/                     ← SẢN PHẨM (deploy)
  src/
    main.tsx · App.tsx · routes.ts · globals.css
    pages/        1 thư mục / màn hình: overview · profile(+goal) · analysis(+gap, roi, simulation)
                  · explore(+compare) · portfolio · study-plan · method
                  📐 auth · onboarding · settings · notifications · admin · verify
    features/     UI theo màn hình: profile(+goal) · analysis/{gap,roi,simulation} · explore
                  · portfolio · study-plan · method
    engine/       DECISION LAYER, TypeScript thuần:
                  types · decision-profile · admissions · scoring · gap · roi · decision
                  · study-plan · recommend · explain
    state/        DecisionContext (hồ sơ, vòng thi thử) · storage (localStorage) · dataset-freshness
    data/         catalog.ts + programs-catalog.json · universities/ · seed/ (hồ sơ mẫu)
    components/   layout/ (AppShell, Sidebar, Topbar…) · ui/ · navigation/
    lib/format.ts
  tests/          test engine chạy bằng tsx (npm test)
  public/data/    snapshot + manifest (do pipeline/publish.py sinh)
pipeline/                     ← DỮ LIỆU (offline): scrape · clean · features · ingestion · publish.py
common/                       toán dùng chung (mô phỏng, tối ưu, cú sốc, url_safety)
data/                         manual/ · processed/programs.parquet
tests/                        pytest lõi (common, pipeline) · tests/backend/ (cần FastAPI)
backend/                      ✂️ FastAPI đóng băng (+ backend/scripts/)
scripts/                      công cụ dev (run-all-tests.ps1, audit UI)
docs/                         pitch deck PDF
```

**Luật phụ thuộc một chiều** (ESLint chặn phần của `engine/`):

```text
pages → features → state → engine → data
                            ↑
components (layout, ui) dùng state/engine
```

`engine/` không được import React, `state/`, `features/`, `pages/` hay `components/`. Không dùng file barrel (`index.ts` re-export): import thẳng file định nghĩa.

---

## 9. Quy trình, timeline và phân công

### 9.1. Quy trình: 5 cổng, đi đúng thứ tự

```text
G1 Chốt đặc tả ─► G2 Chốt UI ─► G3 Chốt frontend ─► G4 Tính năng & dữ liệu ─► G5 Hoàn thiện & nộp
   29/09            03/10          08/10                12/10                     13–15/10
```

- **Không nhảy cóc.** UI phải đẹp và được duyệt trước khi code frontend. Frontend phải đúng thiết kế trước khi nối tính năng thật. Đây là bài học từ vòng trước: làm hết một lượt sinh ra nhiều tính năng thừa.
- **Ngoại lệ duy nhất: viết hàm trước.** Engine và dữ liệu là hàm thuần có test (`engine/`, `pipeline/`), nên Dũng, Kiệt, Tuấn viết song song ngay từ 30/09. Các hàm đã có (của Dũng, Tuấn, Kiệt) được **map vào màn hình**, không viết lại. G4 là lúc **nối** chúng vào UI đã chốt.
- **Qua cổng rồi thì không mở lại.** Ý tưởng mới ghi vào issue #25 (sau cuộc thi).
- Mỗi cổng là một milestone trên GitHub. Mỗi việc là một issue có người nhận và tiêu chí "xong khi".

| Cổng | Hạn | Xong khi |
|---|---|---|
| **G1 Chốt đặc tả** | T3 29/09 | `ba.md` v3 được 4/4 người approve (#31); chốt stack đăng nhập/quản trị (#32) |
| **G2 Chốt UI** | T6 03/10 | Design system (#33, xong trước 01/10) + thiết kế hi-fi 20 màn, desktop + mobile, đủ trạng thái rỗng/lỗi/đang tải (#34–#37) |
| **G3 Chốt frontend** | T4 08/10 | Mọi màn code đúng thiết kế, chạy bằng engine hiện có hoặc adapter giả (#20, #23, #38–#41); lint/typecheck/test/build xanh; responsive 390 và 1440 |
| **G4 Tính năng & dữ liệu** | CN 12/10 | Engine hợp nhất, luật TT06 (#26–#28); vòng thi thử trong `engine/` (#13); dữ liệu có nguồn và snapshot (#21, #24); bách phân vị + backtest (#44); đăng nhập + quản trị thật (#42, #43); LLM (#45, cắt đầu tiên nếu trễ); 3 người dùng thật (#46) |
| **G5 Hoàn thiện & nộp** | 13/10 đóng băng → 14/10 khóa → **T5 15/10 nộp** | #47, #48, #49 |
| **Demo Day** | T7 17/10 | Demo, hỏi đáp, kiểm chứng trực tiếp |

### 9.2. Phân công theo người

| Người | Vai trò | G1–G2 (đến 03/10) | G3 (đến 08/10) | G4 (đến 12/10) | G5 (đến 15/10) |
|---|---|---|---|---|---|
| **Hưng** (`26730023-PhamPhuNguyenHung`) | Product, BA, UI/UX, frontend chính, pitch | #31 chốt ba.md · #33 design system · #34 thiết kế S1–S7 · #35 thiết kế tài khoản & tiện ích | #20 code S1–S4, S7 · #38 app shell + màn tài khoản | #46 thử với 3 người dùng thật | #48 slide + video |
| **Dũng** (`manhdungcr7`) | Decision engine, Verify | #37 thiết kế `/verify`; bắt đầu viết hàm #26 | #40 code S5 + `/verify` | #26 luật TT06 · #27 gap/ROI hợp nhất · #28 engine danh sách hợp nhất | #49 tập kiểm chứng trực tiếp |
| **Tuấn** (`xuantuan4444`) | Trưởng nhóm, dữ liệu, tài khoản, quản trị, phát hành | #32 ADR stack · #36 thiết kế admin; bắt đầu #21 dữ liệu | #39 code admin (dữ liệu giả) | #21 dữ liệu 20 trường · #24 snapshot · #42 API tài khoản · #43 API quản trị · #45 LLM | #47 khóa phát hành + build log |
| **Kiệt** (`kevin1238874`) | Kế hoạch học, vòng thi thử, toán thống kê | Góp nội dung S6 cho #34; bắt đầu viết hàm #13, #44 | #23 code S6 · #41 thông báo & mốc tuyển sinh | #13 lõi vòng thi thử vào `engine/` · #44 bách phân vị + backtest | Hỗ trợ #49, #48 (phần số liệu) |

**Review chéo:** mọi PR cần 1 người khác duyệt. UI (#33–#37) do Hưng duyệt thẩm mỹ. Engine (#13, #26–#28, #44) do Dũng hoặc Kiệt duyệt chéo. Dữ liệu và API (#21, #24, #42, #43) do Tuấn chịu trách nhiệm, Dũng duyệt.

### 9.3. Lịch theo ngày

| Ngày | Hưng | Dũng | Tuấn | Kiệt |
|:-:|---|---|---|---|
| 28/09 | Đọc góp ý ba.md (#31) | Đọc ba.md; viết ca kiểm chứng (#37) | Đọc ba.md; ADR (#32) | Đọc ba.md; góp nội dung S6 |
| 29/09 | **G1** | Viết hàm luật TT06 (#26) | **Chốt ADR** (#32) | Viết hàm lõi vòng thi thử (#13) |
| 30/09–01/10 | Design system (#33) | #26 | Thiết kế admin (#36); thu dữ liệu (#21) | #13; thu phổ điểm (#44) |
| 02–03/10 | Thiết kế S1–S7, tài khoản (#34, #35). **G2** | Thiết kế `/verify` (#37); #27 | #36; #21 | Góp ý S6; #44 |
| 04–06/10 | Code app shell + tài khoản (#38) | Code S5 + `/verify` (#40) | Code admin (#39) | Code S6 (#23) |
| 07–08/10 | Code S1–S4, S7 (#20). **G3** | #40; #27 | #39; #21 | Thông báo (#41) |
| 09–10/10 | Thử 3 người dùng (#46) | Hợp nhất engine (#28) | API tài khoản (#42) | Backtest (#44) |
| 11–12/10 | Sửa theo người dùng | #28; `/verify` 4/4 trên live | API quản trị (#43); snapshot (#24); LLM (#45) | Nối #13 vào S6. **G4** |
| 13/10 | Slide (#48) | Kiểm chứng (#49) | **Đóng băng tính năng** | Số liệu cho slide |
| 14/10 | Video (#48) | #49 | **Khóa phát hành** (#47) | Hỗ trợ |
| **15/10** | **Nộp** | | | |
| 16/10 | Tập demo 3 lần, tập hỏi đáp | | | |
| **17/10** | **Demo Day** | | | |

### 9.4. Nếu trễ thì cắt từ dưới lên

1. LLM (#45): giữ template.
2. Quy đổi HSA/V-ACT (một phần #44).
3. AD4 phản hồi & nhật ký.
4. So sánh chi tiết (`/comparison`).

**Không bao giờ cắt:**
- Vòng thi thử (Wow 1)
- Khả năng trượt hết (Wow 2)
- Hộ chiếu dữ liệu + Verify (Wow 3)
- Đăng nhập + chế độ khách

### 9.5. Sau cuộc thi (issue #25)

- Phủ khoảng 440 trường.
- Học bạ và ĐGNL theo từng trường.
- Dữ liệu việc làm.
- Theo dõi kết quả tuyển sinh thật (đường tới TRL 9).
- Ứng dụng di động.

### 9.6. Danh mục bàn giao 15/10

- [ ] Live URL, không đăng nhập, 1 dòng hướng dẫn ở trang chủ
- [ ] Repo công khai, lịch sử commit nguyên vẹn
- [ ] Slide theo danh mục brief: vấn đề, người dùng, bối cảnh, nhu cầu, luồng, giải pháp, dữ liệu, AI, giải thích và kiểm soát rủi ro, mở rộng, tác động
- [ ] Video ≤ 3 phút
- [ ] Build log 1 trang
- [ ] Gói dữ liệu: snapshot, manifest, `backtest.json`
- [ ] `/verify` 4/4
- [ ] Minh chứng 3 người dùng thật

---

---

## 10. Rủi ro và hỏi đáp với ban giám khảo

| BGK hỏi | Trả lời |
|---|---|
| "Khác gì chatbot hay AI Hay?" | Họ trả lời một câu tại một thời điểm. Tụi em là vòng lặp: thi thử → khoảng cách → đòn bẩy → kế hoạch → danh sách, tính lại mỗi lần. Ngoài ra tối ưu cả danh sách theo khả năng trượt hết. |
| "Xác suất lấy từ đâu?" | Điểm chuẩn lịch sử, bách phân vị phổ điểm, cú sốc chung toàn quốc; dải bất định hiện cạnh mỗi con số; backtest ở S7. |
| "Một đề thi thử dễ thì app có ảo tưởng không?" | Không. Điểm được làm mượt theo độ tin cậy của đề (ω, **ƯỚC TÍNH**, hiển thị rõ). |
| "Dữ liệu có cũ không?" | Mỗi con số có URL, năm, ngày, hash. 20 trường đã xác thực; trường khác gắn nhãn và không vào gợi ý mặc định. |
| "Sai thì sao?" | App nói trước nó sai đến đâu; người dùng tự chấp nhận từng đề xuất. |
| "LLM có bịa số không?" | LLM chỉ thấy JSON đã tính; số được đối chiếu tự động. |
| "Mở rộng thế nào?" | Cùng pipeline, mỗi trường khoảng 30 phút công; app tĩnh nên chi phí phục vụ gần 0. |

---

## 11. Kịch bản demo 3 phút

| Thời gian | Nói | Màn hình |
|:-:|---|---|
| 0:00–0:20 | *"Chọn trường không phải quyết định một tối tháng 7 — là cả năm lớp 12. Đây là Minh Anh, A01, muốn CNTT, nhà không dư dả."* | S1 → "Thử hồ sơ mẫu" |
| 0:20–0:50 | *"Em đang cách mục tiêu 1,8 điểm. Lý là đòn bẩy lớn nhất — không phải học đều mọi môn."* | S3 |
| 0:50–1:10 | *"Kế hoạch 52,5 giờ/tuần chia theo đòn bẩy."* | S6 |
| 1:10–1:50 | **Cao trào:** *"Tháng 3, Minh Anh thi thử. Nhập điểm — app tính lại tất cả: 2 nguyện vọng lên nhóm Phù hợp, khả năng trượt hết giảm, giờ Lý chuyển sang Anh."* | S6 → diff vòng lặp |
| 1:50–2:20 | *"Tháng 7: 15 nguyện vọng, 3 nhóm, khả năng trượt hết dưới 5% — mỗi dòng có lý do."* | S5 |
| 2:20–2:45 | *"Mẹ em hỏi sao tin được: nguồn từng con số, giả định, backtest, báo cáo 1 trang."* | S7 |
| 2:45–3:00 | *"Thầy cô muốn kiểm tra? Một nút, 4 ca kiểm chứng."* → *"Nguyện Vọng AI: biết phải làm gì mỗi tuần để đỗ nguyện vọng mình muốn."* | V |

---

## 12. Nguồn chính thức

- Brief TMA `Decision_Intelligence_Challenge_Brief_TMA.docx.pdf` (bản text: thư mục cha `_challenge_briefs/brief_decision_intel.txt`). Lịch chung: [UIT forum](https://forum.uit.edu.vn/t/moi-sinh-vien-tham-gia-cuoc-thi-mlai-hackathon-2026/163716), [ai-network.hcmut.edu.vn/mlai2026](https://ai-network.hcmut.edu.vn/mlai2026)
- [Những điểm mới Thông tư 06/2026](https://xaydungchinhsach.chinhphu.vn/nhung-diem-moi-trong-quy-che-tuyen-sinh-dai-hoc-2026-119260215183555963.htm) · [Bộ chốt quy định tuyển sinh 2026](https://baochinhphu.vn/bo-gddt-chot-quy-dinh-tuyen-sinh-dai-hoc-2026-102260505095923563.htm)
- [Bách phân vị A00/A01/B00/C00/D01 năm 2026](https://xaydungchinhsach.chinhphu.vn/bach-phan-vi-cac-to-hop-mon-a00-a01-b00-c00-d01-ky-thi-tot-nghiep-thpt-nam-2026-11926070110255949.htm) · [Quy đổi theo bách phân vị, không "bắc cầu"](https://tuoitre.vn/bo-gd-dt-huong-dan-quy-doi-diem-xet-tuyen-2026-phai-dua-tren-bach-phan-vi-khong-lam-kieu-bac-cau-100260706190213926.htm) · [Bảng quy đổi HSA của ĐHQGHN](https://xaydungchinhsach.chinhphu.vn/dai-hoc-quoc-gia-ha-noi-cong-bo-bang-phan-vi-quy-doi-tuong-duong-giua-diem-thi-hsa-va-diem-thi-tot-nghiep-2026-119260703201406446.htm)
- [Mốc thời gian tuyển sinh 2026](https://xaydungchinhsach.chinhphu.vn/tuyen-sinh-2026-cac-moc-thoi-gian-quan-trong-thi-sinh-can-nho-119260206155449664.htm) · [Phân tích phổ điểm 2026](https://xaydungchinhsach.chinhphu.vn/phan-tich-pho-diem-thi-tot-nghiep-thpt-2026-du-bao-diem-chuan-tuyen-sinh-dai-hoc-119260701073205713.htm)
- Đối thủ: [VnExpress — AI Hay](https://vnexpress.net/ung-dung-ai-du-doan-kha-nang-do-dai-hoc-5087474.html), [Tuyensinh247](https://diemthi.tuyensinh247.com/tu-van-chon-truong.html), [Dân trí — bẫy khi dùng AI chọn ngành](https://dantri.com.vn/giao-duc/2-ngay-cuoi-dang-ky-dai-hoc-dung-ai-chon-nganh-thi-sinh-co-the-mac-bay-20260713081902658.htm)
- Bối cảnh 2025: [Thí sinh điểm cao trượt đại học](https://dantri.com.vn/giao-duc/loat-thi-sinh-diem-cao-nhung-truot-dai-hoc-kho-hieu-bo-gddt-vao-cuoc-20250825221502206.htm)

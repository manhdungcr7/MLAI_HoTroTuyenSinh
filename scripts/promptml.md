Bạn là Principal ML Engineer, Data Scientist, MLOps Architect, Cloudflare Solutions Architect và chuyên gia hệ thống tuyển sinh đại học Việt Nam.

NHIỆM VỤ: Thiết kế, triển khai và kiểm thử một hệ thống dự báo điểm chuẩn đại học năm 2027 cho dự án Nguyện Vọng AI, sử dụng LightGBM, mô hình bất định và kiến trúc serverless chịu tải cao.

Đây là công việc triển khai code production-minded trong phạm vi hackathon. Không xây dựng hệ thống ML phức tạp không cần thiết, không thêm microservices vô nghĩa và không tạo dữ liệu tuyển sinh giả rồi trình bày là dữ liệu thật.

## 1. Mục tiêu sản phẩm

Cho phép học sinh dự thi năm 2027:
- Xem điểm chuẩn chính thức của ngành trong các năm trước.
- Xem mức điểm chuẩn dự báo cho năm 2027.
- Xem khoảng biến động hợp lý.
- So sánh điểm thi thử/điểm mục tiêu với dự báo.
- Ước lượng mức độ phù hợp hoặc xác suất vượt ngưỡng điểm chuẩn, nếu xác suất được hiệu chỉnh đáng tin cậy.
- Biết mình cần cải thiện bao nhiêu điểm.
- Hiểu tại sao một số ngành không thể dự báo.

Ưu tiên sự chính xác, minh bạch và tính hữu ích thay vì đưa ra càng nhiều con số càng tốt.

## 2. BẮT BUỘC: Audit dữ liệu hiện tại

Trước khi viết mô hình:
1. Đọc toàn bộ cấu trúc repository.
2. Xác định dữ liệu đang nằm ở đâu: D1, JSON, CSV, localStorage, API hay file import.
3. Kiểm tra toàn bộ schema tuyển sinh.
4. Kiểm tra nguồn dữ liệu và các đường dẫn provenance.
5. Xác định dữ liệu lịch sử có thật đến năm nào.
6. Kiểm tra thông tin ngành, trường, tổ hợp, phương thức, chỉ tiêu, điểm sàn và điểm chuẩn.
7. Kiểm tra cách điểm ưu tiên và điểm cộng được tính hiện tại.
8. Xác định những gì đã có thể tái sử dụng.

Tạo DATA_AUDIT.md gồm:
- Số trường có dữ liệu.
- Số chương trình/ngành.
- Số bản ghi điểm chuẩn chính thức.
- Số bản ghi chỉ có điểm sàn.
- Số bản ghi thiếu nguồn.
- Số bản ghi bị trùng hoặc xung đột.
- Số bản ghi đủ điều kiện huấn luyện.
- Số bản ghi không đủ điều kiện dự báo.

Tuyệt đối không mặc định các trường hiện tại đều đã có điểm chuẩn thực.

## 3. Chuẩn hóa bản chất dữ liệu tuyển sinh

Thiết kế mô hình dữ liệu phân biệt ít nhất:

A. OFFICIAL_ADMISSION_CUTOFF
Điểm trúng tuyển chính thức, đúng chương trình, phương thức, năm và thang điểm.

B. OFFICIAL_ELIGIBILITY_FLOOR
Điểm sàn/ngưỡng nhận hồ sơ hoặc ngưỡng đầu vào, không phải kết quả trúng tuyển.

C. HISTORICAL_REFERENCE
Giá trị tham khảo có nguồn nhưng không đủ điều kiện so sánh trực tiếp.

D. MODEL_FORECAST
Dự báo do mô hình tạo ra, có model_version và thời điểm phát hành.

E. UNAVAILABLE
Không đủ dữ liệu để cung cấp số điểm có căn cứ.

Dữ liệu phải có các trường phù hợp:

institution_id
campus_id
program_id
program_code
admission_year
admission_method
subject_combination
score_scale
raw_score
normalized_score
score_type
score_formula
quota
source_url
source_published_at
source_verified_at
verification_status
record_version

Các trường có thể nullable nếu thực tế không có dữ liệu, nhưng tuyệt đối không điền bằng giá trị tưởng tượng.

Quy tắc:
- Điểm sàn không được dùng làm nhãn y của mô hình dự báo điểm trúng tuyển.
- Không coi mức điểm sàn 18 là một lần quan sát điểm chuẩn 18.
- Không gộp học bạ, điểm thi THPT, ĐGNL và các phương thức khác thành một thang đo.
- Không trộn thang 30, 40, 100 hoặc 1.200 nếu chưa có cơ sở quy đổi hợp lệ.
- Không tự động coi mọi tổ hợp trong một ngành đều có điểm trúng tuyển riêng.
- Nếu trường công bố một mức chung cho các tổ hợp thì lưu đúng phạm vi áp dụng chung.
- Không nhân bản một điểm chung thành nhiều điểm độc lập trong dữ liệu train.
- Tôn trọng trường có một điểm sàn chung nhưng không công bố điểm chuẩn từng ngành.
- Phân biệt dữ liệu không công bố, không tìm thấy, chưa xác minh và không áp dụng.
- Không coi điểm chưa công bố là bằng 0.

Thiết lập identity mapping có hiệu lực theo năm khi trường đổi mã, đổi tên ngành, sáp nhập hoặc tách chương trình.

## 4. Data sourcing & provenance

Dùng nguồn chính thức từ:
- Bộ Giáo dục và Đào tạo.
- Website tuyển sinh chính thức của từng trường.
- Đề án, thông báo và quyết định điểm trúng tuyển.
- Dữ liệu phổ điểm và chỉ tiêu đã công bố chính thức.

Ưu tiên dữ liệu tuyển sinh 2023–2026 nếu thực sự thu thập và xác minh được. Có thể mở rộng các năm trước nếu phù hợp và so sánh được.

Đánh dấu thay đổi quy chế, phương thức, thang điểm và công thức tính giữa các năm.

Nếu số lượng dữ liệu quá nhỏ hoặc không đủ so sánh, không huấn luyện mô hình mang tính hình thức.

Pipeline:
collect → validate → canonicalize → deduplicate → source verification → feature generation → training dataset.

Mọi hàng dữ liệu đưa vào huấn luyện phải truy vết được về nguồn.

Không dùng dữ liệu sinh bởi LLM làm nhãn huấn luyện.

## 5. Thiết kế mô hình LightGBM

Ưu tiên mô hình tabular nhỏ, dễ tái huấn luyện và vận hành.

Baseline bắt buộc:
- Last known official cutoff.
- Rolling historical median nếu có.
- Trend đơn giản từ lịch sử hợp lệ.

Candidate ML:
LightGBM Regression.

Quantile models:
- q10
- q50
- q90

Có thể dùng point regression riêng nếu backtest chứng minh hữu ích.

Không mặc định LightGBM tốt hơn baseline.

Các đặc trưng ứng viên:
- Điểm trúng tuyển chính thức năm trước.
- Trung bình hoặc trung vị lịch sử.
- Mức biến động lịch sử.
- Xu hướng qua các năm.
- Số năm có dữ liệu hợp lệ.
- Trường và nhóm trường.
- Ngành và nhóm ngành.
- Loại chương trình và cơ sở đào tạo.
- Phương thức xét tuyển.
- Tổ hợp hoặc phạm vi áp dụng.
- Chỉ tiêu nếu có.
- Biến động chỉ tiêu nếu có.
- Phổ điểm, percentile tương ứng nếu có.
- Biến động phân bố điểm thi.
- Các thay đổi chính sách được mã hóa từ dữ liệu có căn cứ.
- Độ trễ và chất lượng nguồn dữ liệu.

Không dùng ranking hoặc độ nổi tiếng tự suy đoán làm đặc trưng.

Quan trọng về temporal leakage:
- Dự báo 2027 chỉ được dùng thông tin đã biết tại thời điểm phát hành dự báo.
- Không sử dụng phổ điểm 2027, điểm chuẩn 2027 hoặc số liệu tương lai chưa công bố.
- Những biến chưa biết phải có missing flag, fallback hoặc kịch bản minh bạch.
- Tách rõ forecast_before_exam và forecast_after_exam nếu sau này bổ sung dữ liệu thực của năm 2027.

## 6. Backtesting và chọn mô hình

Dùng kiểm thử theo thời gian, không random split thông thường.

Ví dụ:
- Train bằng dữ liệu sẵn có đến 2023, kiểm thử dự báo 2024.
- Train đến 2024, kiểm thử 2025.
- Train đến 2025, kiểm thử 2026.

Chỉ thực hiện fold nếu đủ dữ liệu hợp lệ và tái hiện đúng thông tin có sẵn tại thời điểm dự báo.

Đánh giá:
MAE
RMSE
Median Absolute Error
Pinball Loss cho các quantile
Interval Coverage
Interval Width
Performance by institution
Performance by program group
Performance by admission method
Performance by history depth

Kiểm tra riêng:
- Ngành cạnh tranh cao.
- Ngành ít lịch sử.
- Chương trình đổi phương thức.
- Ngành chỉ có 1 năm dữ liệu.
- Trường có dữ liệu không ổn định.

Áp dụng conformal calibration cho prediction intervals nếu dữ liệu hiệu chỉnh đủ độc lập và đại diện.

Kiểm tra quantile crossing và sửa hoặc đánh dấu khi q10 > q50 hoặc q50 > q90.

Không tự đặt khoảng ±0,5 hay ±1,0 rồi gọi là khoảng tin cậy 80%.

Chỉ phát hành LightGBM khi vượt được baseline theo ngưỡng chất lượng định trước.

Nếu không đạt, chọn baseline hoặc từ chối dự báo số.

## 7. Quy tắc về dự báo khi dữ liệu thiếu

CASE A — Có nhiều năm điểm chuẩn chính thức tương thích:
Có thể dùng LightGBM nếu mô hình đã được xác nhận.

CASE B — Có ít năm lịch sử:
Xem xét baseline hoặc dự báo nhóm ngành có hiệu chỉnh, nếu backtest chứng minh hợp lệ.
Gắn nhãn độ chắc chắn thấp.

CASE C — Chỉ có điểm sàn:
Không lấy điểm sàn làm điểm chuẩn.
Không huấn luyện bằng điểm sàn như target.
Mặc định từ chối dự báo ngành cụ thể nếu thiếu tín hiệu đáng tin cậy.

CASE D — Ngành mới mở:
Ưu tiên "Chưa đủ dữ liệu".
Chỉ cung cấp tham khảo ngành tương tự dưới nhãn riêng, không giả làm dự báo của ngành mới.

CASE E — Thang điểm hoặc phương thức thay đổi:
Không so sánh trực tiếp nếu không có phép chuyển đổi có căn cứ.

CASE F — Dữ liệu nguồn xung đột:
Đánh dấu để kiểm duyệt, không tự chọn ngẫu nhiên.

Dự báo bị chặn vẫn phải cung cấp thông tin hữu ích cho người dùng: điểm sàn nếu có, ngành tương tự và dữ liệu lịch sử đã xác minh.

## 8. Ước lượng cơ hội của học sinh

Phải tách 2 lớp bất định:

Lớp 1: Điểm chuẩn tương lai không chắc chắn.

Lớp 2: Điểm thi thật của học sinh chưa chắc bằng điểm thi thử hoặc điểm mục tiêu.

Xây dựng phương pháp:
- CDF hoặc predictive distribution từ kết quả dự báo đã hiệu chỉnh.
- Personal score distribution chỉ khi có đủ điểm thi thử, lịch sử và căn cứ thống kê.
- Tính P(student_final_score >= admission_cutoff), có xét đúng công thức và điều kiện hợp lệ.

Có thể dùng Monte Carlo ở offline training hoặc dùng lookup/table và phép tính nhẹ tại runtime.

Không ép ba phân vị q10/q50/q90 thành phân phối chuẩn rồi mặc định đó là xác suất đúng.

Không diễn giải xác suất vượt ngưỡng điểm chuẩn thành xác suất đỗ chính thức. Điều kiện xét tuyển, phương thức, chỉ tiêu, tiêu chí phụ và quy trình lọc nguyện vọng vẫn có thể ảnh hưởng đến kết quả.

Nếu học sinh chỉ nhập điểm mục tiêu:
Hiển thị đánh giá theo kịch bản giả định, không trình bày như xác suất thực tế đạt được điểm mục tiêu.

Nếu học sinh có nhiều lần thi thử:
Có thể ước lượng độ biến động cá nhân nhưng cần kiểm định sample size, độ tương đồng đề thi và calibration.

Nếu thiếu căn cứ hiệu chỉnh:
Trả về qualitative_assessment thay vì con số phần trăm.

Output đề xuất:

{
  "year": 2027,
  "forecast_status": "available",
  "score_type": "MODEL_FORECAST",
  "predicted_cutoff": 25.2,
  "interval": {
    "lower": 24.3,
    "upper": 26.1,
    "coverage_target": 0.8,
    "empirical_coverage": null
  },
  "confidence_level": "medium",
  "student_score": 25.5,
  "student_score_kind": "mock_exam",
  "student_assessment": "competitive_but_uncertain",
  "threshold_exceedance_probability": null,
  "probability_calibrated": false,
  "model_version": "example-only",
  "data_version": "example-only",
  "official": false
}

Các số trên chỉ minh họa data contract, không được publish thành dữ liệu dự báo thật.

## 9. Kiến trúc hệ thống chịu tải cao

Ưu tiên tái sử dụng Cloudflare Workers + D1 + R2 + frontend hiện có.

ĐỀ XUẤT:

OFFLINE:
Python + LightGBM
→ ETL
→ Feature Engineering
→ Backtesting
→ Calibration
→ Forecast Generation
→ Versioned Artifacts

STORAGE:
R2: historical snapshots, model artifacts, full forecast snapshots, reports.
D1: indexed metadata, verified records, published forecast records hoặc index manifest theo lựa chọn tối ưu sau benchmark.

SERVING:
Cloudflare Workers
→ input validation
→ published forecast lookup
→ personalized assessment
→ response caching
→ frontend / MCP / AI Chat

Tuyệt đối không chạy LightGBM Python inference cho mọi lượt xem trường/ngành nếu không cần.

Một phiên bản mô hình có thể sinh trước toàn bộ dự báo phổ biến theo từng ngành, phương thức và năm.

Runtime chỉ cần:
- Truy vấn một dự báo đã xuất bản.
- Ghép với điểm học sinh.
- Áp dụng cùng một bộ quy tắc tính điểm.
- Tính đánh giá cơ hội hoặc tra bảng xác suất hiệu chỉnh.
- Trả JSON nhẹ.

BẮT BUỘC khảo sát hạ tầng đang có trước khi quyết định thêm service.

## 10. API design

Đề xuất các API, điều chỉnh cho khớp router hiện tại:

GET /api/forecast/2027/programs/:id

GET /api/forecast/2027/programs/:id/history

GET /api/forecast/2027/compare

POST /api/forecast/2027/assess

GET /api/forecast/2027/metadata

GET /api/forecast/2027/methodology

Các API phải:
- Versioned.
- Validated.
- Typed.
- Có giới hạn input.
- Có timeout.
- Trả thông báo lỗi nhất quán.
- Không trả dữ liệu nhạy cảm không cần thiết.
- Không phụ thuộc AI inference.
- Không gửi hàng nghìn dòng dữ liệu xuống client để lọc.
- Sử dụng batch lookup khi so sánh nhiều ngành.

GET public forecast có thể cache bằng CDN hoặc Cache API.

POST assessment theo điểm cá nhân không được public-cache theo URL chung, không đưa điểm cá nhân vào cache dùng chung nếu thiếu isolation thích hợp.

Thiết kế phù hợp khả năng phục vụ của Cloudflare Workers và giới hạn D1 thực tế.

## 11. Thiết kế database và indexing

Đề xuất schema gồm các nhóm:
- institutions
- programs
- program_identity_history
- admission_records
- admission_sources
- verified_score_history
- forecast_runs
- forecast_results
- forecast_quality_metrics
- publication_manifest

Chỉ tạo bảng mới khi không thể mở rộng bảng hiện có an toàn.

Index theo các luồng truy vấn thực:
- program_id + year
- institution_id + year
- program_id + admission_method + year
- published forecast version
- identity mapping

Không tạo index hàng loạt nếu không có query plan chứng minh hữu ích.

Sử dụng migration versioned và rollback strategy.

Publish snapshot theo kiểu atomic:
- Sinh dự báo.
- Validate schema.
- Kiểm tra độ phủ.
- So sánh với bản đang chạy.
- Chuyển manifest sang bản mới sau khi pass.
- Giữ bản cũ cho rollback.

## 12. Chịu tải, caching và chi phí

Thiết kế cho 3 kịch bản kiểm thử giả định:
- 100 người dùng đồng thời.
- 1.000 người dùng đồng thời.
- 10.000 người dùng đồng thời.

Không giả định các mức trên chắc chắn chạy được nếu chưa benchmark.

Phải đo:
- Throughput.
- p50/p95/p99 latency.
- Workers CPU time.
- D1 reads / writes.
- Cache hit ratio.
- Error rate.
- 429 / 5xx.
- Response payload size.
- Chi phí ước tính theo lưu lượng.

Tối ưu:
- Static forecast snapshots.
- Cached public endpoints.
- Batch read.
- Prepared SQL queries.
- Pagination.
- Compression nếu hiệu quả.
- Deduplicated program records.
- Server-side filtering.
- Không đọc cả database cho một truy vấn.
- Không gọi AI/LLM để tính điểm dự báo.

Thiết kế chống traffic spike:
- Rate limiting theo mức phù hợp.
- Input size limits.
- Request timeout.
- Retry với backoff cho tác vụ nội bộ.
- Graceful degradation.
- Stale-but-verified snapshot fallback có ghi rõ phiên bản.
- Circuit breaker nếu có upstream bên ngoài.

Nếu backend lỗi:
Frontend vẫn có thể xem dữ liệu cache đã xác minh, nhưng phải hiển thị thời điểm cập nhật và không giả vờ có dự báo mới.

## 13. Tích hợp AI Chat và MCP

Dự báo phải được cung cấp bằng deterministic tools:

get_admission_history
get_official_score_type
get_2027_cutoff_forecast
assess_student_against_forecast
compare_2027_programs
get_forecast_methodology

Nếu dự án đã có tool tương đương thì mở rộng, không tạo bản sao.

AI chat có thể giải thích kết quả nhưng không được tự tính hoặc tự sáng tác điểm chuẩn.

Ví dụ:
Học sinh hỏi:
"Em được 25 điểm A00, năm 2027 có cơ hội vào CNTT trường X không?"

Luồng:
1. Tìm đúng chương trình.
2. Kiểm tra tổ hợp A00 có được áp dụng không.
3. Kiểm tra phương thức tuyển sinh.
4. Đọc điểm chính thức các năm.
5. Đọc dự báo 2027 đã xuất bản.
6. Tính đánh giá phù hợp.
7. Trả lời ngắn, có bất định và nguồn.

Nếu không có dự báo thì AI phải nói không có đủ dữ liệu.

Không dùng LLM như prediction engine.

## 14. Bộ kiểm thử bắt buộc

DATA QUALITY:
- Phân biệt điểm sàn và điểm chuẩn.
- Không trộn phương thức.
- Không trộn thang điểm.
- Không ghép sai mã ngành.
- Không sử dụng nguồn không xác minh.
- Không leakage dữ liệu tương lai.

ML:
- Temporal backtesting.
- Baseline comparisons.
- Prediction interval coverage.
- Quantile crossing.
- Outlier checks.
- Data drift.
- Performance across sparse-data groups.

API:
- Valid input.
- Invalid program.
- Missing forecast.
- Deleted source.
- Stale snapshot.
- Invalid score.
- Unsupported admission method.
- Concurrent reads.
- Database timeout.

FRONTEND:
- Điểm học sinh thay đổi.
- Dự báo chính thức/chưa chính thức.
- Không đủ dữ liệu.
- Chỉ có điểm sàn.
- Hiển thị đúng model version.
- AI chat giải thích nhất quán với API.

LOAD TEST:
- k6 hoặc công cụ tương đương.
- Local/staging benchmark.
- Kiểm tra resource consumption.
- Không load test trực tiếp production quá mức.
- Báo cáo số liệu thực, không tự suy đoán.

## 15. Chia việc cho subagents

Invoke 5–6 subagents nếu được hỗ trợ:

Agent 1 — Data Auditor:
Kiểm tra nguồn, schema, mapping và tính hợp lệ.

Agent 2 — ML Researcher:
Baseline, LightGBM, quantile regression, calibration và backtesting.

Agent 3 — Database Engineer:
D1 schema, indexes, migrations và data integrity.

Agent 4 — Backend/Infra Engineer:
Worker serving, caching, API và load optimization.

Agent 5 — Integration Engineer:
Frontend contracts, MCP và AI chat integration.

Agent 6 — QA/Red Team:
Tìm lỗi thống kê, data leakage, xác suất sai và performance regressions.

Phân công không đè file của nhau; tích hợp bằng một owner chính.

## 16. Deliverables

A. Architecture
- FORECAST_ARCHITECTURE.md
- DATA_DICTIONARY.md
- FORECAST_METHODOLOGY.md

B. Machine Learning
- Training pipeline.
- Feature generation.
- Baseline models.
- LightGBM quantile models.
- Backtesting scripts.
- Calibration report.
- Versioned prediction artifacts.

C. Backend
- Database migrations.
- API endpoints.
- Cache layer.
- Snapshot publication.
- Rollback implementation.

D. Verification
- Data quality report.
- Model comparison.
- Load test report.
- API integration tests.
- End-to-end results.

E. Product
- Dự báo 2027 tích hợp vào giao diện.
- Đánh giá mức độ phù hợp của học sinh.
- Giải thích nguồn và độ bất định.
- Chế độ fallback khi không đủ dữ liệu.

## 17. Tiêu chí hoàn thành

Không đánh dấu DONE nếu:
- Điểm sàn bị biến thành điểm chuẩn.
- Không có lịch sử chính thức nhưng vẫn hiển thị dự báo tưởng tượng.
- Model chưa backtest.
- Không có so sánh baseline.
- Xác suất chưa calibration nhưng UI hiển thị như xác suất chính xác.
- Dự báo dùng thông tin tương lai không khả dụng.
- Frontend và AI chat trả số liệu khác nhau.
- Một lượt hỏi phải chạy lại cả LightGBM.
- Không có dữ liệu kiểm thử tải thật.
- Không biết nguồn của một điểm trúng tuyển.
- Có thay đổi phá vỡ các chức năng hiện có.

Nếu dữ liệu thực không đủ để huấn luyện:
Vẫn triển khai data contracts, pipeline, baseline, API, UI và các fallback có ích, nhưng khóa phát hành dự báo số chưa đạt chất lượng.

Ưu tiên kết quả đáng tin, chạy nhanh và tiết kiệm chi phí.

BẮT ĐẦU:
1. Audit repository và dữ liệu thực.
2. Xác định phạm vi khả thi.
3. Lập kế hoạch triển khai theo mức ưu tiên.
4. Chia subagents.
5. Code và test.
6. Benchmark.
7. Báo cáo bằng chứng, những gì đã làm và các giới hạn còn tồn tại.

Không dừng ở proposal, pseudo-code hoặc báo cáo lý thuyết.
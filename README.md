# Nguyện Vọng AI

Ứng dụng giúp học sinh lớp 12 biết **khả năng đỗ của từng ngành, từng trường** dựa trên điểm của chính mình, rồi xếp danh sách nguyện vọng an toàn. Thay cho việc tự tra điểm chuẩn và tự tính điểm xét tuyển theo từng trường.

- **Bản đang chạy:** https://manhdungcr7.github.io/MLAI_HoTroTuyenSinh/ (GitHub Pages, tự cập nhật mỗi lần đẩy lên nhánh `main`)
- **Mã nguồn:** https://github.com/manhdungcr7/MLAI_HoTroTuyenSinh
- **Tình trạng:** đã dùng được thật; còn các hạn chế về dữ liệu ghi ở mục [Hạn chế đã biết](#hạn-chế-đã-biết-và-việc-nên-làm-tiếp). Danh sách việc đã xong và chưa xong: [`docs/CHECKLIST.md`](docs/CHECKLIST.md).

## 1. Ứng dụng làm gì

Luồng người dùng (5 màn, mỗi màn một việc, không cần hướng dẫn):

| Màn | Việc |
|---|---|
| **Tìm ngành** (`#/start`) | Màn chào, rồi từng câu hỏi một: năm thi, điểm thi, học bạ (trung bình 3 năm hoặc từng lớp), chứng chỉ (IELTS, TOEFL iBT) và điểm ĐGNL/ĐGTD, giải học sinh giỏi, học lực và hạnh kiểm, nơi ở và nơi muốn học, ngành hoặc trường muốn học (gõ tên không cần dấu), khu vực và đối tượng ưu tiên |
| **Kết quả** (`#/results`) | Mọi ngành tính được, **xếp theo xác suất đỗ tăng dần** (ngành khó vào ở trên để tạo động lực; từ 99% trở lên xếp theo điểm chuẩn). Lọc theo Chắc đỗ / Vừa tầm / Thử sức và theo nhóm ngành, tìm theo tên, thả tim, mở "Vì sao ra kết quả này?" (điểm chuẩn các năm, dải dự kiến, cách tính, link đề án) |
| **Nguyện vọng** (`#/portfolio`) | Đề xuất hoặc tự xếp tối đa 15 nguyện vọng, cho biết xác suất đỗ ít nhất một nguyện vọng, cảnh báo (thiếu ngành chắc đỗ, ngành bị che, sư phạm phải nằm trong 5 nguyện vọng đầu); sao chép hoặc in |
| **Cải thiện điểm** (`#/improve`) | Chọn một ngành muốn vươn tới: thiếu hoặc dư bao nhiêu điểm, tăng thêm 1 điểm môn nào thì xác suất đỗ ngành đó và số ngành trong tầm tăng bao nhiêu |
| **Cách tính** (`#/about`) | Số liệu dữ liệu, kết quả kiểm định dự báo, nguồn dữ liệu |

Mọi phép tính chạy **ngay trên trình duyệt**; hồ sơ học sinh chỉ lưu ở `localStorage`, không gửi đi đâu. Backend FastAPI là tùy chọn, dùng cho tích hợp bên ngoài và kiểm thử đối chiếu.

Quy ước giao diện đã chốt: xưng "bạn"; chữ nhẹ, ít in đậm; mỗi trang một nội dung; không glassmorphism; app dẫn dắt từng bước.

## 2. Cách tính (tóm tắt, đọc code để biết chi tiết)

1. **Điểm xét tuyển của học sinh theo từng chương trình và phương thức** (`frontend/src/engine/scoring/method-score.ts`): mỗi trường có quy tắc riêng (hệ số môn, điểm cộng IELTS/TOEFL/giải thưởng, ngưỡng, quy đổi chứng chỉ) khai báo bằng file JSON ở `frontend/src/data/school-rules/<MÃ>.json`. Trường chưa có quy tắc dùng công thức chung (tổng 3 môn hoặc trung bình học bạ 3 năm, cộng ưu tiên theo quy chế: KV1 0,75, KV2-NT 0,5, KV2 0,25; nhóm ưu tiên 1 là 2 điểm, nhóm 2 là 1 điểm; giảm dần từ 22,5; tối đa 3), **không quy đổi IELTS/TOEFL** vì nhiều trường cấm hoặc quy đổi khác nhau.
2. **Điểm chuẩn dự kiến** (`pipeline/features/build.py`): bằng điểm chuẩn năm gần nhất có thật (kiểm định ngược cho thấy không phương pháp nào chính xác hơn cách này). Năm dự báo `FORECAST_YEAR = 2027`; có test nhắc cập nhật khi quá hạn.
3. **Xác suất đỗ** = Φ((điểm − điểm chuẩn dự kiến)/σ), σ đo từ dữ liệu (cú sốc chung toàn quốc giữa các năm + sai số riêng) và nhân `√(số năm cách từ dữ liệu mới nhất đến 2027)`, nhân thêm 1,3 khi chỉ có một năm dữ liệu.
4. **Một ngành chỉ giữ một phương thức** (phương thức cho xác suất cao nhất).
5. **Chương trình chưa rõ tổ hợp:** thử mọi tổ hợp học sinh có điểm, nhân xác suất với tỷ lệ trường nhận tổ hợp đó (suy từ các ngành đã xác thực cùng trường và nhóm ngành).
6. **Danh sách nguyện vọng:** xác suất không đỗ nguyện vọng nào tính bằng tích phân Gauss-Hermite 15 điểm, có cú sốc chung toàn quốc và cú sốc riêng chung giữa các ngành cùng trường (23% phương sai riêng, đo từ 15.329 cặp ngành cùng trường).
7. **Ngoại lệ đã mã hóa:** sư phạm cần tổng 3 môn thi từ 18 điểm và học lực lớp 12 giỏi khi xét học bạ; sàn 15 điểm cho thí sinh thi từ 2026; Công an, Quân đội bị loại (tuyển riêng); ngành thi năng khiếu chỉ tính cho tổ hợp V00–V03, T00, T01, T06, T10, M01, M05, M06, M11.

Kiểm định ngược (`frontend/public/data/backtest.json`, xuất bởi pipeline): sai số trung bình 1,31 điểm (2024) và 1,77 điểm (2025); khoảng p10–p90 chứa điểm thật 89% và 75%.

**TypeScript và Python phải cho cùng kết quả.** Lõi tính có hai bản: `frontend/src/engine/` (TypeScript, dùng trên web) và `common/admission_core.py` (Python, dùng cho API). Đổi công thức ở bên nào thì phải đổi bên kia; `tests/backend/test_admission_core_parity.py` chạy hai bên trên cùng bộ ca (`tests/backend/fixtures/parity_school_rules.json`) và so từng số. Bảng dùng chung (tổ hợp, vùng của tỉnh) xuất từ TypeScript sang `common/data/shared_rules.json` bằng `cd frontend && npx tsx ../scripts/export_shared_rules.ts`.

## 3. Cấu trúc thư mục

```
frontend/                 Vite + React 19 + TypeScript + Tailwind 4
  src/pages/              5 màn (start, results, portfolio, improve, about)
  src/features/           start (Wizard, màn chào ở pages/start), results (thẻ, thông báo, trợ giúp), portfolio
  src/engine/             TypeScript thuần, không import React:
                          scoring (quy tắc từng trường), admissions (xác suất, ưu tiên),
                          decision (ứng viên, ràng buộc, đề xuất nguyện vọng), roi, gap
  src/data/               programs-catalog.json (sinh bởi pipeline), tổ hợp môn, school-rules/ (32 quy tắc trường)
  src/state/              AppContext (hồ sơ, nguyện vọng), storage.ts (localStorage, chuẩn hóa dữ liệu cũ)
  public/data/            manifest.json, backtest.json, snapshot dữ liệu theo mã băm
  tests/                  test TypeScript chạy bằng tsx
backend/app/              FastAPI: advisor.py (API tư vấn), main.py (health, meta), security.py, logging_config.py
common/                   admission_core.py (lõi Python), data/shared_rules.json, national_shock.py, data_passport.py
pipeline/                 scrape (cào), clean (làm sạch, ghép, tổ hợp từ đề án), features (dự báo, kiểm định), publish
data/manual/              danh sách do người duy trì (tỉnh của trường, nhóm ngành, nguồn chính thức,
                          trường công an/quân đội bị loại, văn bản dùng chung nhiều trường bị loại)
data/processed/           programs.parquet, national_shock.json (đã commit); phần còn lại do pipeline sinh
data/raw, data/interim    PDF đề án và bảng trung gian (KHÔNG commit, tái tạo bằng pipeline)
scripts/                  công cụ (xem mục 5 và 6)
tools/qa/                 kịch bản kiểm thử giao diện bằng Playwright (mục 7)
tests/                    pytest: lõi, pipeline, dữ liệu, backend
docs/                     CHECKLIST.md, DATA_GAPS.md, RULE_REVIEW.md (sinh tự động), bản trình bày cuộc thi
Dockerfile                API backend
.github/workflows/        deploy.yml (GitHub Pages)
```

## 4. Chạy và kiểm thử

Yêu cầu: Node.js 22 trở lên, Python 3.12 trở lên (đã chạy với 3.12 và 3.14).

```powershell
# Web
cd frontend
npm ci
npm run dev                 # http://localhost:3030

# Python (API, kiểm thử)
python -m venv .venv ; .\.venv\Scripts\Activate.ps1
pip install -r requirements-pipeline.txt      # gồm backend/requirements.txt
```

Kiểm tra trước khi đẩy code (CI cũng chạy phần frontend):

```powershell
powershell -File scripts/run-all-tests.ps1
# hoặc từng phần:
$env:PYTHONIOENCODING = "utf-8"
python -m pytest -q                                   # ~170 bài: lõi, pipeline, dữ liệu, API, đối chiếu TS-Python
cd frontend ; npm run lint ; npm run typecheck ; npm test ; npm run build
```

`npm test` gồm kiểm chứng toán (Gauss-Hermite so với Monte Carlo), quy tắc trường, đề xuất nguyện vọng, ROI, lưu trữ trình duyệt và một bài bảo đảm CSS không khóa cuộn trang.

## 5. Quy tắc tính điểm riêng của từng trường

Mỗi trường một file `frontend/src/data/school-rules/<MÃ>.json`, kèm `source` (URL, tên văn bản, **mã băm SHA-256 của PDF đã đối chiếu**, ngày, người đối chiếu). Danh sách trường đã có: xem thư mục hoặc [`docs/RULE_REVIEW.md`](docs/RULE_REVIEW.md). Ý nghĩa từng trường dữ liệu (hệ số môn, `certBonus`, `awardBonus`, `ieltsToEnglish`, `toeflToEnglish`, `certMode`, `majorGroupOverrides` kể cả khóa `name:`, `approximateReason`, `unsupportedReason`…) và mẫu: [`frontend/src/data/school-rules/README.md`](frontend/src/data/school-rules/README.md).

Thêm một trường:

```powershell
python scripts/extract_dean_text.py DQN                         # trích văn bản đề án 2026 (cần PDF trong data/raw/deans/<MÃ>/2026.pdf)
python scripts/extract_dean_text.py --grep "IELTS|hệ số" DQN    # tìm đoạn cần đọc
# viết mô tả (xem mẫu scripts/rule_specs/*.py) rồi sinh file quy tắc có URL, mã băm, ngày:
python scripts/generate_rule.py scripts/rule_specs/specs_xxx.py   # đặt RULE_VERIFIER="Tên bạn" để ghi người đối chiếu
python scripts/build_rules_index.py                               # sinh index.ts
python scripts/validate_school_rules.py
python scripts/rule_review.py                                     # cập nhật docs/RULE_REVIEW.md (test sẽ nhắc nếu quên)
python scripts/rule_review.py --check                             # mã băm PDF còn khớp
```

Nguyên tắc: chỉ đưa vào con số **đã đối chiếu nguyên văn bản gốc**; mơ hồ thì không mã hóa, dùng `approximateReason` (kết quả ghi "Ước lượng") hoặc `unsupportedReason` (không tính xác suất). Không dùng công cụ tóm tắt tự động làm nguồn số liệu. Đề án dạng ảnh: render trang bằng `pypdfium2`, chạy `tools/qa/ocr.ps1` (nhận dạng chữ của Windows, chỉ tiếng Anh nhưng đủ để **tìm trang công thức**), rồi mở ảnh trang đó đọc bằng mắt.

**Các quy tắc hiện do Claude đối chiếu, chưa có người thẩm định độc lập.** Cần người am hiểu tuyển sinh rà theo `docs/RULE_REVIEW.md` trước khi dùng thương mại.

## 6. Dữ liệu và pipeline

Nguồn: đề án/thông tin tuyển sinh công khai của các trường (PDF, trang tổng hợp). Mỗi dòng trong catalog ghi `sourceTier` (`official_pdf` hoặc `aggregator_verified`) và link nguồn.

```powershell
python -m pipeline.run_all        # ~40 phút lần đầu: cào, làm sạch, ghép, dự báo, kiểm định, xuất
```

Các bước (`pipeline/run_all.py`): cào PDF đề án → cào trang tổng hợp → phân tích bảng điểm chuẩn → học phí và việc làm → **ghép** (`pipeline/clean/reconcile.py`: lọc nhãn rác, loại văn bản dùng chung nhiều trường, loại trường công an/quân đội, loại bản sao giữa các trường, điền tổ hợp từ bảng chỉ tiêu) → dự báo → kiểm định ngược → xuất `programs-catalog.json` và snapshot mã băm.

Lưu ý khi giao tiếp:
- `data/raw` và `data/interim` không nằm trong repo. Chạy lại **từ bước ghép trở đi** cần `data/interim/cutoff_panel_raw.parquet` do các bước đầu tạo, nên lần đầu phải chạy đủ `run_all` (hoặc xin bản `data/` từ người duy trì).
- Sau khi chạy lại dữ liệu, chạy thêm `python scripts/data_gaps.py` và `python scripts/rule_review.py`, rồi `pytest`. **Tắt `npm run dev` trước khi `pipeline.publish`** (Windows không ghi đè được `manifest.json` khi Vite đang giữ file).
- Danh sách trường bị loại có chủ đích: `data/manual/non_civil_schools.json` (công an, quân đội), `data/manual/multi_school_documents.json` (văn bản chung của ĐH Huế). Hai bài test `tests/test_school_regression.py` và `tests/test_html_portals.py` giữ danh sách trường phải có mặt: nếu thay đổi làm một trường biến mất có chủ đích thì cập nhật bài test kèm lý do.
- Khoảng trống dữ liệu cập nhật tự động ở [`docs/DATA_GAPS.md`](docs/DATA_GAPS.md): tỉnh chưa có trường, trường chưa có quy tắc riêng, tỷ lệ chương trình chưa có tổ hợp xác thực.

## 7. Kiểm thử giao diện tự động (tools/qa)

Kịch bản Playwright dùng Microsoft Edge đã cài sẵn. Cần web đang chạy (`npm run dev` ở cổng 3030, hoặc đặt `BASE=https://.../` trỏ vào bản đã đăng).

```powershell
cd tools/qa ; npm install
node persona.mjs              # 25 học sinh giả lập (HSG, IELTS, yếu, nhà khó, năng khiếu, ĐGNL...) đi hết luồng, ghi tools/qa/out-persona/report.json và ảnh
node persona.mjs p05_trung_binh_kha p13_y_khoa     # chạy vài vai
node tour.mjs                 # chụp từng bước ở khổ điện thoại
node scroll.mjs               # kiểm tra mọi trang cuộn được (desktop và điện thoại)
```

Vai `p10_dgnl_hcm` luôn "thất bại" trong kịch bản vì trang kết quả đúng là không có nút Xếp nguyện vọng khi chỉ có điểm ĐGNL (dữ liệu ĐGNL rất ít); đó là hành vi mong muốn.

## 8. Backend (API tư vấn)

```powershell
pip install -r backend/requirements.txt
uvicorn backend.app.main:app --port 8000        # tài liệu tự sinh: http://localhost:8000/docs
```

| Endpoint | Việc |
|---|---|
| `POST /api/advisor/search` | Hồ sơ → mọi ngành thỏa ràng buộc, xếp theo xác suất đỗ **giảm dần** (khác trang web), lọc, phân trang |
| `POST /api/advisor/portfolio` | Đề xuất hoặc đánh giá danh sách ≤ 15 nguyện vọng, kèm xác suất không đỗ nguyện vọng nào |
| `GET /api/advisor/methods` | Phương thức xét tuyển hệ thống hiểu và phương thức nào tính được |
| `GET /api/advisor/programs/{id}` | Chi tiết một chương trình và lịch sử điểm chuẩn |
| `GET /api/health`, `/api/health/ready`, `/api/health/data`, `/api/meta` | Sức khỏe, sẵn sàng, nguồn gốc dữ liệu, thông tin phiên bản |

Hồ sơ (`AdvisorProfile` trong `backend/app/advisor.py`) có cùng trường với `StudentProfile` của frontend (điểm thi, học bạ, học bạ từng lớp, `altScores` gồm IELTS, TOEFL, ĐGNL, ĐGTD, giải thưởng, học lực, hạnh kiểm, ngành và trường muốn học…). Có giới hạn tốc độ, header bảo mật, nhật ký có mã tương quan; CORS cấu hình bằng biến môi trường `CORS_ALLOWED_ORIGINS` (danh sách phân cách bằng dấu phẩy; mặc định là các cổng local).

Docker (đã build và chạy thử):

```powershell
docker build -t nguyenvong-api .
docker run -p 8000:8000 -e CORS_ALLOWED_ORIGINS=https://ten-mien-cua-ban nguyenvong-api
```

## 9. Triển khai web

Web là trang tĩnh (đường dẫn dạng hash `#/results`, đường dẫn tài nguyên tương đối), chạy được ở thư mục con. Workflow `.github/workflows/deploy.yml` chạy kiểm tra kiểu, test, build rồi đăng `frontend/dist` lên GitHub Pages mỗi lần đẩy lên `main`.

- Bật một lần: GitHub → Settings → Pages → Source: **GitHub Actions**.
- Nơi khác (Netlify, Vercel, Cloudflare Pages): thư mục `frontend`, lệnh `npm ci && npm run build`, thư mục xuất `dist`.
- Trình duyệt giữ bản cũ tối đa khoảng 10 phút sau khi đăng; báo người dùng bấm Ctrl+F5 nếu cần.
- `frontend/wrangler.jsonc` là cấu hình Cloudflare Workers từ giai đoạn thi, hiện không dùng.

## 10. Hạn chế đã biết và việc nên làm tiếp

Theo thứ tự nên làm:

1. **Người thật rà soát quy tắc từng trường** theo `docs/RULE_REVIEW.md`; ghi tên người rà vào cột cuối.
2. **Nhập thêm điểm chuẩn và quy tắc cho trường còn thiếu.** 17 tỉnh chưa có trường nào trong dữ liệu (`docs/DATA_GAPS.md`); chưa có đề án 2026 cho DDK (chỉ có 2025); TMU chỉ có bản ảnh chưa đọc xong công thức; QST chưa đọc được văn bản; 10 trường PDF ảnh (TDM, TSN, TDL, BVH, QHX, DTS, YCT, QSC, DTV, QHY) đang dùng công thức chung vì chưa đối chiếu xong.
3. **Tổ hợp xét tuyển:** gần một nửa chương trình chưa có tổ hợp xác thực; dùng xác suất trường nhận tổ hợp. Tăng độ phủ của `pipeline/clean/doc_combos.py` (bảng ảnh, tên ngành khớp không chính xác).
4. **Trường tính điểm kiểu kết hợp** (QSX dùng trọng số chưa công bố; DDS, DKK, NHF, HHK, SPH, XDA hệ số theo tổ hợp): đang `unsupportedReason` hoặc "Ước lượng". Nhập đầy đủ khi trường công bố.
5. **TOEIC chưa hỗ trợ** (bảng quy đổi mỗi trường một khác); **tổ hợp năng khiếu ngoài danh sách** ở mục 2 chưa tính; **học phí** gần như không có dữ liệu nên không lọc theo học phí; **ĐGNL/ĐGTD** rất ít chương trình.
6. Điểm chuẩn năm sau: thêm cột năm mới vào dữ liệu, chạy lại pipeline, đổi `FORECAST_YEAR`.

## 11. Quy ước khi sửa code

- **Không bịa dữ liệu.** Thiếu thì hiển thị "chưa có dữ liệu" hoặc "ước lượng", không điền số giả.
- Đổi công thức tính: sửa cả TypeScript và Python, thêm ca vào `parity_school_rules.json`, chạy pytest và `npm test`.
- Lõi `frontend/src/engine/` không import React, `state/`, `features/`, `pages/` (ESLint chặn).
- Chuỗi trong giao diện xưng "bạn", không dùng "em"; không thêm trang hay đoạn chữ giải thích thừa.
- Quy tắc trường: theo mục 5; mọi con số phải đối chiếu được với văn bản có mã băm.
- Tên nhánh và commit: `feat/…`, `fix/…`, `docs/…`; commit rõ một việc; đừng ép đẩy (force-push) lên `main`.
- Tài liệu cũ: `ba.md` và `.agents/AGENTS.md` viết từ giai đoạn cuộc thi MLAI Hackathon 2026 (sitemap 20 màn, triển khai Cloudflare, nhiều quy ước đã đổi). **README này là nguồn đúng nhất về hiện trạng**; hai file kia chỉ để tham khảo bối cảnh.

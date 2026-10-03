# Nguyện Vọng AI

> MLAI Hackathon 2026 · Bảng Decision Intelligence (TMA Solutions) · Đề "Chọn trường hoặc chương trình học" · Team RTC

**Dùng thử ngay (không cần đăng nhập):** https://nguyen-vong-ai.ppnh10092002.workers.dev
→ Bấm **"Xem thử với hồ sơ mẫu Minh Anh"** để thấy toàn bộ luồng trong 1 phút.

Nguyện Vọng AI là **lớp ra quyết định** đi cùng học sinh lớp 12 từ lúc đặt mục tiêu tới lúc nộp nguyện vọng: em đang ở đâu, thiếu bao nhiêu, nên dồn sức vào môn nào, chọn trường nào, xếp 15 nguyện vọng ra sao để không trượt hết — và tự tính lại toàn bộ mỗi khi có điểm thi thử mới.

Luồng: **Tìm ngành cho em** (nhập điểm thi + học bạ và điều kiện → danh sách ngành xếp theo xác suất đỗ) → **Khám phá trường** (lọc, so sánh) → **Xếp nguyện vọng** (tối đa 15, kèm xác suất không đỗ nguyện vọng nào) → **Cải thiện điểm** và **Kế hoạch học** (phần mở rộng) → **Cách tính** / **Kiểm chứng**.

## Tài liệu

Repo chỉ có 3 file tài liệu:

| File | Đọc khi |
|---|---|
| [`ba.md`](ba.md) | Muốn biết sản phẩm làm gì, vì sao, sitemap 20 màn, phân công (§9), kiến trúc + cây thư mục (§8), dữ liệu, timeline. **Đây là nguồn sự thật duy nhất.** |
| `README.md` | Muốn chạy hoặc kiểm chứng app (file này) |
| [`.agents/AGENTS.md`](.agents/AGENTS.md) | Chuẩn bị sửa code: luật git, quy ước và các bẫy đã gặp |

## Kiểm chứng

- Mở `/#/verify` trên bản live và bấm **Chạy kiểm chứng**. App chạy 4 ca cố định, trong đó có ca app phải từ chối đúng. *(📐 hoàn thành trước 11/10/2026)*
- Mỗi con số trong app có Hộ chiếu dữ liệu: nguồn, năm, ngày thu thập và hash snapshot (`frontend/public/data/manifest.json`).
- Giới hạn hiện tại được ghi thẳng ở `ba.md` §5.1 và §5.4.

## Chạy local

Yêu cầu: Node.js 24, Python 3.12 trở lên.

```powershell
cd frontend
npm ci
npm run dev        # http://localhost:3030
```

## API tư vấn (backend)

```powershell
pip install -r backend/requirements.txt
uvicorn backend.app.main:app --port 8000
```

| Endpoint | Việc |
|---|---|
| `POST /api/advisor/search` | Hồ sơ → mọi ngành thỏa ràng buộc, xếp theo xác suất đỗ (phương thức tốt nhất cho học sinh), có lọc và phân trang |
| `POST /api/advisor/portfolio` | Đề xuất hoặc đánh giá danh sách tối đa 15 nguyện vọng, kèm xác suất không đỗ nguyện vọng nào |
| `GET /api/advisor/methods` | Phương thức xét tuyển hệ thống hiểu và phương thức nào đã tính được |
| `GET /api/advisor/programs/{id}` | Chi tiết một chương trình và lịch sử điểm chuẩn |

Lõi tính ở `common/admission_core.py` được đối chiếu tự động với engine TypeScript
(`tests/backend/test_admission_core_parity.py`): đổi công thức ở một bên thì phải đổi cả bên kia.
Bảng dùng chung (tổ hợp, vùng của tỉnh) xuất từ TypeScript bằng `scripts/export_shared_rules.ts`.

## Việc dữ liệu còn lại

Số liệu cập nhật tự động trong [`docs/DATA_GAPS.md`](docs/DATA_GAPS.md) (`python scripts/data_gaps.py`): tỉnh chưa có trường, trường chưa có quy tắc riêng, tỷ lệ chương trình chưa có tổ hợp xác thực.

- Điểm chuẩn mùa 2026 mới có cho một phần chương trình: chạy lại `python -m pipeline.run_all` khi có thêm trường công bố.
  Năm dự báo là `FORECAST_YEAR` (`common/admission_core.py`, `frontend/src/engine/admissions/probability.ts`); có test nhắc khi quá hạn.
- Tổ hợp xét tuyển từng ngành: lấy từ bảng chỉ tiêu trong đề án khi tên ngành khớp chính xác (`pipeline/clean/doc_combos.py`); phần còn lại dùng xác suất trường nhận tổ hợp.
- Quy tắc tính điểm riêng từng trường: xem `frontend/src/data/school-rules/README.md` và [`docs/RULE_REVIEW.md`](docs/RULE_REVIEW.md) (tài liệu cho người thẩm định, cần người thật rà soát trước khi dùng thương mại).
  `python scripts/rule_review.py --check` kiểm tra mã băm văn bản gốc. Đề án dạng ảnh: render trang bằng pypdfium2 rồi đọc ảnh hoặc dùng nhận dạng chữ của Windows để tìm trang công thức.
- Ngành năng khiếu chỉ tính cho tổ hợp V00–V03, T00, T01, T06, T10, M01, M05, M06, M11 (nghĩa từng mã đã đối chiếu đề án); mã khác chưa có định nghĩa chung nên không tính.
- Học phí: gần như không có dữ liệu theo ngành nên không có bộ lọc học phí trong giao diện.
- Điểm chuẩn ĐGNL/ĐGTD: dữ liệu rất ít, học sinh chỉ có điểm ĐGNL sẽ được hướng dẫn nhập thêm điểm thi.

## Cập nhật dữ liệu

```powershell
pip install -r requirements-pipeline.txt
python -m pipeline.run_all                 # tải đề án công khai, tạo nhiều request ra ngoài
python -m pipeline.publish                  # tạo snapshot SHA-256 + manifest
python -m pipeline.publish --rollback <sha256>
```

## Kiểm tra trước khi merge

```powershell
cd frontend
npm run lint; npm run typecheck; npm test; npm run build
cd ..
$env:PYTHONIOENCODING = "utf-8"
python -m pytest -q                              # toàn bộ (cần backend/requirements.txt)
python -m pytest -q --ignore=tests/backend       # chỉ lõi: common + pipeline
```

Hoặc chạy tất cả một lần: `powershell -File scripts/run-all-tests.ps1`.

## Cấu trúc

```
frontend/src/
  pages/        5 màn: start (nhập từng câu hỏi), results, portfolio, improve, about
  features/     start (Wizard), results (thẻ kết quả), portfolio (danh sách nguyện vọng)
  engine/       thuần TypeScript: scoring (quy tắc từng trường), admissions (xác suất, ưu tiên),
                decision (ứng viên, ràng buộc, đề xuất nguyện vọng), roi, gap
  data/         catalog điểm chuẩn, tổ hợp, school-rules/ (quy tắc riêng từng trường)
  state/        AppContext (hồ sơ, nguyện vọng, mục tiêu), lưu trình duyệt
backend/app/    FastAPI: advisor (API tư vấn), health/meta
common/         admission_core.py (lõi Python, đối chiếu tự động với engine TypeScript)
pipeline/       cào, làm sạch, dự báo, xuất catalog và snapshot
```

Thêm quy tắc tính điểm riêng cho một trường: `frontend/src/data/school-rules/README.md`.
`ba.md` ghi bối cảnh và yêu cầu ban đầu của cuộc thi; phần sitemap 20 màn trong đó đã được thay bằng 5 màn ở trên.

## Đưa web lên mạng

Web là trang tĩnh (mọi phép tính chạy ngay trên trình duyệt, định tuyến bằng hash), nên chỉ cần máy chủ tệp tĩnh.
Workflow `.github/workflows/deploy.yml` tự kiểm tra rồi đăng `frontend/dist` lên GitHub Pages mỗi lần đẩy lên nhánh `main`.
Bật một lần: GitHub → Settings → Pages → Source: **GitHub Actions**. Địa chỉ: `https://<tài khoản>.github.io/<tên repo>/`.
Dùng nơi khác (Netlify, Vercel, Cloudflare Pages): thư mục `frontend`, lệnh `npm ci && npm run build`, thư mục xuất `dist`.

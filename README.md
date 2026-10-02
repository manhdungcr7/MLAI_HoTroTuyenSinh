# Nguyện Vọng AI

> MLAI Hackathon 2026 · Bảng Decision Intelligence (TMA Solutions) · Đề "Chọn trường hoặc chương trình học" · Team RTC

**Dùng thử ngay (không cần đăng nhập):** https://nguyen-vong-ai.ppnh10092002.workers.dev
→ Bấm **"Xem thử với hồ sơ mẫu Minh Anh"** để thấy toàn bộ luồng trong 1 phút.

Nguyện Vọng AI là **lớp ra quyết định** đi cùng học sinh lớp 12 từ lúc đặt mục tiêu tới lúc nộp nguyện vọng: em đang ở đâu, thiếu bao nhiêu, nên dồn sức vào môn nào, chọn trường nào, xếp 15 nguyện vọng ra sao để không trượt hết — và tự tính lại toàn bộ mỗi khi có điểm thi thử mới.

Luồng: **Tổng quan → Hồ sơ của em → Phân tích năng lực → Khám phá trường → Xếp nguyện vọng → Kế hoạch học → Cách tính.**

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

`frontend/` là sản phẩm (decision layer nằm ở `frontend/src/engine/`); `pipeline/` sinh dữ liệu; `common/` là toán dùng chung. Cây thư mục đầy đủ và luật phụ thuộc: `ba.md` §8.6. Sitemap 20 màn, phân công và timeline: `ba.md` §6 và §9 (issue #31–#49).

Thư mục `backend/` (FastAPI) được giữ nhưng **đóng băng**: bản demo không gọi tới nó (test ở `tests/backend/`). Lý do ở `ba.md` §6.3.

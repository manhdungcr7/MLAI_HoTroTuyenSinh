# AGENTS — Luật làm việc cho người và agent

> Đọc `ba.md` trước khi code. `ba.md` quyết định **làm gì**; file này quy định **làm thế nào**. Repo chỉ có 3 file `.md` (`ba.md`, `README.md`, file này): **không tạo thêm file `.md` mới**. Muốn ghi nhận điều gì thì sửa đúng mục trong 3 file này.

## 1. Git — luật bất di bất dịch

1. **Không push thẳng vào `main`.** Mọi thay đổi đi qua nhánh riêng và Pull Request.
2. **Cấm force-push và squash.** Lịch sử commit là bằng chứng chấm thi MLAI Hackathon.
3. Tên nhánh: `feat/…`, `fix/…`, `docs/…`, `chore/…`, `refactor/…`.
4. Commit theo Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`). Mỗi commit là một đơn vị logic trọn vẹn, đã chạy thử.
5. Mô tả PR có 3 phần: **Mục tiêu** (việc gì trong `ba.md`, ví dụ S4 hoặc D1), **Thay đổi**, **Kiểm thử** (lệnh đã chạy và kết quả).
6. `main` luôn deploy được: lint, typecheck, test, build đều xanh.

```powershell
git checkout main; git pull origin main
git checkout -b feat/<ten-nhanh>
# … làm việc, commit …
git push -u origin feat/<ten-nhanh>
```

## 2. Kỷ luật phạm vi

- **Chỉ làm những gì có trong `ba.md` §6 và §7.** Việc không có ở đó thì ghi vào `ba.md` §9.4 "Sau cuộc thi", không code.
- Thứ đã ✂️ trong `ba.md` §6.3 thì không sửa, không mở rộng, không demo.
- Đã qua cổng nào (G1–G5, `ba.md` §9) thì không mở lại phần đó nếu cả team chưa đồng ý.
- **Không bao giờ bịa dữ liệu.** Thiếu thì hiện "chưa có dữ liệu" hoặc "chưa xác thực". Không người dùng giả, không lời chứng thực giả, không log giả: vi phạm là bị loại khỏi cuộc thi.

## 3. Frontend (`frontend/`) — cấu trúc xem `ba.md` §8.6

- Vite + React 19 SPA, deploy lên Cloudflare Workers (`frontend/wrangler.jsonc`).
- Lệnh: `npm run dev` (cổng 3030), `npm run build`, `npm run lint`, `npm run typecheck`, `npm test`.
- **Đặt code đúng tầng:**
  - `src/pages/<màn>/page.tsx`: chỉ ghép component. URL khai báo ở `src/App.tsx`; nhãn nav ở `src/components/layout/Sidebar.tsx`.
  - `src/features/<màn>/`: component UI của màn đó.
  - `src/engine/`: **decision layer**, TypeScript thuần. Không import React, `state/`, `features/`, `pages/`, `components/`; ESLint chặn.
  - `src/state/`: `DecisionContext` (state + vòng thi thử), `storage.ts` (localStorage), `dataset-freshness.tsx`.
  - `src/data/`: catalog và hồ sơ mẫu.
- **Không tạo file barrel** (`index.ts` chỉ để re-export). Import thẳng file định nghĩa bằng alias `@/`.
- Route dùng hash (`src/routes.ts`). Hồ sơ không gửi ra ngoài.
- Giao diện luôn sáng màu, không glassmorphism. Từ vựng cố định: **Thử sức / Phù hợp / An toàn**.
- Kiểm tra UI bằng `agent-browser`. Kiểm tra responsive bằng Playwright `page.setViewportSize` ở 390×844 và 1440×900.

## 4. Dữ liệu, pipeline và test Python

- Dữ liệu đi một chiều: `pipeline/` → `data/processed/` → `python -m pipeline.publish` → `frontend/public/data/` (snapshot SHA-256 + manifest).
- `pipeline/` chỉ được import `common/`, **không import `backend/`** (backend đóng băng). Chống SSRF dùng `common/url_safety.py`.
- Mỗi dòng điểm chuẩn phải có: mã trường, mã ngành, phương thức, tổ hợp, năm, điểm, **URL nguồn, ngày thu thập**.
- `pytest.ini` đã đặt `pythonpath = .`; không cần `PYTHONPATH`. Test cần FastAPI để trong `tests/backend/`.
- Trên Windows, đặt `$env:PYTHONIOENCODING="utf-8"` trước khi chạy Python (tránh `UnicodeEncodeError` cp1252).
- Chạy tất cả kiểm thử: `powershell -File scripts/run-all-tests.ps1`.

## 5. Bẫy đã gặp — đừng lặp lại

**Tuyển sinh và toán**

1. **Tự nhân 3 khi mới nhập 1 môn.** `(tổng / số môn) × 3` biến Toán 9,5 thành 28,5. Chưa đủ 3 môn → `isComplete: false`, không suy ra tổng.
2. **Điểm ưu tiên giảm dần.** Khi tổng điểm S ≥ 22,5: `ưu tiên = ưu tiên_max × (30 − S) / 7,5`. Chỉ có UT1 = 2,0, UT2 = 1,0; **không có UT3**. Tổng điểm cộng tối đa 3 (TT06/2026).
3. **Một bảng quy đổi duy nhất** cho IELTS và chứng chỉ, đặt ở `src/engine/admissions/priority.ts`. Bảng thực tế do từng trường quy định, nên phải gắn nguồn.
4. **Tính đơn điệu.** Điểm tăng thì khoảng cách không được xa thêm và xác suất đỗ không được giảm. Thêm một nguyện vọng An toàn thì khả năng trượt hết không được tăng. Ngân sách giảm thì ngành đắt không được tăng điểm phù hợp.
5. **What-if không được sửa hồ sơ gốc.** Tách state mô phỏng tạm (ví dụ `whatIfBudget`) khỏi state lưu. `resetWhatIf()` phải trả hồ sơ về nguyên trạng.
6. **Dải An toàn "nuốt" dải Thử sức.** Nếu xếp chung theo điểm phù hợp, top ứng viên toàn là An toàn. Phải chia 3 dải trước, rồi lấy mẫu theo hạn mức từng dải.
7. **Monte Carlo trong test:** cố định seed, hoặc cho phép dung sai khoảng 2×10⁻³.

**Dữ liệu**

8. **Điểm chuẩn dưới 10 thường là chỉ tiêu bị bóc nhầm.** Tên cột "Mã ngành đào tạo" chứa chữ "ngành", nên phải khớp chuỗi dài và cụ thể trước.
9. **NaN của pandas là truthy.** `val or "A00"` vẫn trả về `nan`. Dùng `pd.isna`.
10. Với pandas 2.2+, `groupby(...).apply` không còn cột khóa trong nhóm con; lấy khóa qua `g.name`.
11. **Lệch schema giữa màn hình.** Mọi màn hình phải dùng chung schema chuẩn: `programId`, `forecastP50`, `tuitionVnd`, `combinations`, `dataPassportUrl`…

**Backend** (đang đóng băng, ghi lại phòng khi mở lại)

12. SQLite: chạy `ALTER TABLE ADD COLUMN` trước `executescript()` khi tạo index. Không lạm dụng `INSERT OR IGNORE` trong fixture, vì nó nuốt lỗi thiếu cột NOT NULL.
13. CORS không được dùng `*` cùng với credentials. Crawler phải chặn URL trỏ tới IP nội bộ (SSRF).
14. Pydantic v2 dùng `.model_dump()`; dùng `datetime.now(timezone.utc)`; FastAPI dùng `lifespan` thay cho `on_event`.

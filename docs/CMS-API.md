# CMS API (Cloudflare Pages Functions + D1 + KV)

Mã nguồn: `cms/functions/api/*`. Mọi endpoint đều: xác thực Cloudflare Access (JWT) -> tra bảng `quan_tri` -> kiểm vai trò ở MÁY CHỦ -> xử lý. Không có dữ liệu mẫu ở đường chạy thật; thiếu cấu hình thì trả lỗi JSON thật (500 `chua-cau-hinh`), không rơi về số 0.

## Lỗi chuẩn
`{ "loi": "...", "ma": "du-lieu-sai", "thongBao": "...", "chiTiet": [{ "truong": "source.url", "thongBao": "..." }] }`
Mã HTTP: 400 dữ liệu sai, 401 chưa đăng nhập, 403 thiếu quyền, 404, 409 xung đột (lệch trạng thái, đã tồn tại, đang xuất bản), 413, 429, 500, 502 (KV lỗi sau khi D1 đã lưu).
Danh sách phân trang: `?trang=1&moi=50` (tối đa 50), trả `tong`.

## Xác thực và vai trò
- Production: header `Cf-Access-Jwt-Assertion`, cần biến `TEAM_DOMAIN`, `ACCESS_AUD`. Email chưa có trong `quan_tri` thì 403.
- `QTV_DAU_TIEN` (email, phân cách dấu phẩy): tự thành qtv khi bảng `quan_tri` còn rỗng.
- Dev local: `GIA_DANH_DEV=1` trong `cms/.dev.vars` và host localhost thì đọc email từ header `X-Gia-Danh`. Production không bao giờ bật.
- Vai `qtv` (quản trị viên): duyệt, từ chối, xuất bản, rollback, quản lý người dùng. Vai `ctv` (cộng tác viên): tạo nháp, sửa nháp của mình, gửi duyệt, chỉ với trường được giao (`phan_cong`).
- `GET /api/toi` -> `{ email, vaiTro, truongDuocGiao }`.

## Quy trình bản ghi (pipeline chuẩn)
`DRAFT -> SUBMITTED -> (IN_REVIEW) -> APPROVED -> PUBLISHED`; `SUBMITTED/IN_REVIEW -> REJECTED` (bắt buộc lý do) rồi ctv sửa và gửi lại; `DRAFT/REJECTED -> ARCHIVED` (qtv). Bản cũ cùng thực thể khi bản mới xuất bản thành `SUPERSEDED`.
PUBLISHED chỉ sinh ra từ `POST /api/xuat-ban-snapshot`; không đặt trực tiếp bằng PATCH.

Loại thực thể (`entityType`): `school`, `tuition` (học phí), `scholarship` (học bổng), `admission`, `cutoff_score`, `announcement`, `deadline`, `contact`, `noi_luu_tru`, `review`, `luu_y`.
`entityId`: chữ/số/`.`/`_`/`-` tối đa 64 ký tự, mã trường là phần trước dấu `-` đầu tiên (BKA, BKA-7480201, ddy-649a423e). Mã trường phải có trong `cms/functions/_thu-vien/tap-truong.json`. Ngoại lệ: `announcement` không gắn trường (chỉ qtv tạo). Mỗi (entityType, entityId) chỉ một bản đang mở hoặc đang PUBLISHED.
`data.maTruong` nếu có phải khớp mã trường trong entityId. `data` tối đa 24.000 ký tự.

Nguồn bắt buộc (`source`): `{ url (http/https), tieuDe (3-300), donViCongBo (2-200), ngayCongBo? (YYYY-MM-DD) }`. `ngayKiemChung` và `nguoiKiemChung` do máy chủ đặt.

Hình dạng bản ghi (`BanGhiCms`, xem `src/engine/du-lieu-tuyen-sinh/kieu.ts`): `id, entityType, entityId, version, status, data, source, importance (normal|important|critical), changeNote, rejectionReason?, previousVersionId?, createdBy/At, updatedBy/At, submittedBy/At?, reviewedBy/At?, publishedBy/At?`.

### `/api/ban-ghi`
| Method | Vai | Body / query | Kết quả |
|---|---|---|---|
| GET | qtv (tất cả), ctv (của mình + PUBLISHED) | `?id=` hoặc lọc `?entityType=&entityId=&status=&createdBy=(qtv)` + phân trang | `{ items: BanGhiCms[], tong }` hoặc một `BanGhiCms` |
| POST `{action:"CREATE"}` (mặc định) | qtv, ctv (trường được giao) | `{ entityType, entityId, data, source, changeNote?, importance? }` | 201 `BanGhiCms` DRAFT v1. 409 nếu đã có bản |
| POST `{action:"CREATE_MODIFICATION"}` | qtv, ctv | `{ currentId (bản PUBLISHED), duLieuMoi?, sourceMoi?, changeNote?, importance? }` | 201 bản DRAFT, `version` = cũ + 1, `previousVersionId`. 409 nếu đã có bản nháp mở |
| PUT | chủ bản ghi (ctv) hoặc qtv | `{ id, data?, source?, changeNote?, importance? }` chỉ khi DRAFT/REJECTED | `BanGhiCms`, `version` tăng 1 mỗi lần sửa. 409 nếu lệch |
| PATCH | ctv: chỉ `SUBMITTED` bản của mình; qtv: `IN_REVIEW/APPROVED/REJECTED/ARCHIVED/SUBMITTED` | `{ id, status, rejectionReason? }` | `BanGhiCms`. Header `x-thong-bao`: `da-gui/chua-cau-hinh/loi/khong-can` (Telegram). 409 `chuyen-trang-thai-khong-hop-le` hoặc `lech-trang-thai` |

Mọi thao tác ghi đều ghi `nhat_ky_kiem_toan` cùng giao dịch.

### `/api/xuat-ban-snapshot` (chỉ qtv)
- `GET` -> `{ soChoXuatBan, dangChay: { dataVersion, publishedBy, publishedAt, totalRecords, manifest } | null, lichSu: [{ dataVersion, dangChay, publishedBy, publishedAt, totalRecords, changeSummary }], tong }` (phân trang lịch sử).
- `POST {action:"PUBLISH"}` (mặc định): lấy tối đa 500 bản APPROVED, mỗi thực thể một bản thắng (version cao nhất), dựng snapshot, ghi D1 trong MỘT `DB.batch` (bản ghi, `snapshot_manifest`, 7 dòng `snapshot_tap`, nhật ký), rồi đồng bộ KV (`manifest:active` ghi cuối). Trả `{ thanhCong, dataVersion (YYYY.MM.DD.NN), soBanGhiMoi, soBanBiThayThe, conBanChoXuatBan, tongBanGhiPublished, dongBoKv: "ok"|"chua-cau-hinh", manifest }`. 409 `khong-co-gi-de-xuat-ban` nếu không có APPROVED; 409 `dang-xuat-ban` nếu khóa đang bị giữ (khóa nguyên tử, hết hạn 60 giây); 502 `dong-bo-kv-loi` nếu D1 đã lưu mà KV lỗi (gọi `DONG_BO_KV`).
- `POST {action:"ROLLBACK", targetVersion}`: đặt lại bản đang chạy (một câu UPDATE), đồng bộ KV. 404 nếu không có phiên bản.
- `POST {action:"DONG_BO_KV"}`: đẩy lại bản đang chạy từ D1 sang KV.

Snapshot: 7 tệp JSON theo miền `schools, tuition, scholarships, admissions, announcements, cutoffScores, community` (community = noi_luu_tru + review + luu_y). Mỗi tệp có `hash` SHA-256 trong manifest; URL dạng `/snapshots/<ten>.<dataVersion>.<hash8>.json` (`manifest.datasets[ten].url`). Nội dung tệp lưu ở D1 `snapshot_tap` và KV `snapshot:<dataVersion>:<ten>`; manifest ở KV `manifest:active` và D1 `snapshot_manifest` (is_active=1).

### Người dùng, phân công, nhật ký (qtv, trừ ghi chú)
- `GET /api/nguoi` -> `{ nguoi: [{ email, vaiTro, taoLuc }], tong }`; `POST {email, vaiTro:"qtv"|"ctv"}` 201 (409 trùng); `DELETE ?email=` 204 (400 nếu tự xóa hoặc qtv cuối cùng; xóa cả phân công).
- `GET /api/phan-cong?email=` (qtv tất cả, ctv chỉ của mình) -> `{ phanCong: [{ email, maTruong }], tong }`; `PUT {email, maTruong: string[]}` (qtv) thay toàn bộ, 400 mã không tồn tại, 404 email chưa có.
- `GET /api/nhat-ky?trang=&moi=` -> `{ nhatKy: [{ id, ai, hanhDong, doiTuong, luc }], tong }` (hợp nhất `nhat_ky` và `nhat_ky_kiem_toan`, mới nhất trước).
- `GET /api/telegram` -> `{ daCauHinh }`; `POST /api/telegram` gửi tin thử (503 chưa có secret).

## Telegram (phía máy chủ)
Secret `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` (`wrangler pages secret put ...` hoặc `cms/.dev.vars`). Máy chủ tự gửi khi gửi duyệt, duyệt, từ chối, xuất bản; lỗi gửi không làm hỏng thao tác. Trình duyệt không còn giữ token: `cms/src/may-chu/telegram.ts` chỉ gọi `/api/telegram`, các hàm `thongBao*` là no-op.

## Việc UI cần làm theo
- Chế độ thật là mặc định. Dữ liệu mẫu chỉ khi build đặt `VITE_GIA_LAP=1` (`che-do.ts`). Không còn bật bằng URL hay localhost.
- Ở chế độ thật `layTaiKhoanHienTai()` trả quyền thấp nhất cho đến khi gọi `napTaiKhoanTuMayChu()` (`xac-thuc/phien-lam-viec.ts`, gọi `/api/toi`); lỗi 401/403 thì hiện màn báo lỗi. Đổi vai trò ở trình duyệt không còn tác dụng.
- Nhóm `/api/thong-tin`, `/api/truong` (kênh) là pipeline cũ (A): đã bỏ tự động phát hành KV, header `x-phat-hanh` luôn là `khong-tu-dong`. Dữ liệu mới nên đi qua `/api/ban-ghi`. Sau khi UI chuyển hết, xóa A (`thong-tin*.ts`, `phat-hanh.ts`, `_thu-vien/phat-hanh.ts`).
- Thông tin cộng đồng cũ ánh xạ: `hoc_phi` -> `tuition`, `hoc_bong` -> `scholarship`, `noi_luu_tru` -> `noi_luu_tru`, `review` -> `review`, `luu_y` -> `luu_y`; link nguồn bắt buộc.

## Khớp với app học sinh
- `functions/api/manifest.ts` (app học sinh) đọc KV `manifest:active` rồi D1. Phải dùng binding tên `DB` (không phải `D1_CONG_DONG`) và cùng KV `KV_CONG_DONG`. Đã được báo là sửa; nếu còn `D1_CONG_DONG` thì phải đổi.
- URL tệp trong manifest là `/snapshots/...`. App học sinh cần một route phục vụ các URL đó từ KV (`snapshot:<dataVersion>:<ten>`) hoặc D1 `snapshot_tap.duong_dan`, hoặc xuất tệp tĩnh vào `public/snapshots`. Các tệp trong `public/snapshots` hiện có sinh từ script cũ có dữ liệu bịa, phải xóa và thay bằng bản xuất từ pipeline này.
- Manifest có thêm `datasets.community` (tùy chọn ở kiểu TypeScript, luôn có từ pipeline này).

## Vận hành
- D1 `nguyenvongai_db`: tài khoản Cloudflare hiện đã đạt giới hạn số D1 (lỗi `maximum number of D1 databases`). Cần xóa một DB không dùng hoặc nâng gói, rồi `wrangler d1 create nguyenvongai_db`, dán `database_id` vào `wrangler.jsonc` và `cms/wrangler.jsonc`, chạy `wrangler d1 migrations apply nguyenvongai_db --remote` (0001-0004).
- KV `KV_CONG_DONG` đã tạo (id trong hai file wrangler).
- Nạp dữ liệu thật: `npx tsx scripts/khoi-tao-d1-that.ts` sinh `.wrangler/seed-d1.sql` (50 trường và 24 mức học phí, đều có link nguồn thật, không có số suy diễn), nạp bằng `wrangler d1 execute nguyenvongai_db --local|--remote --file=.wrangler/seed-d1.sql`, rồi qtv gọi `POST /api/xuat-ban-snapshot`.
- Chạy thử local: `wrangler pages dev` ở `cms/` bị vướng cấu hình gốc `../.wrangler/deploy/config.json` và đường dẫn dài trên Windows; chạy từ một bản sao ngắn (ví dụ `C:\tmp\nv`) với `--d1 DB=00000000-0000-0000-0000-000000000000 --kv KV_CONG_DONG`.
- Test: `npx tsx tests/cms-api-ban-ghi.test.ts` (SQLite thật trong bộ nhớ, migrations thật, không mạng).

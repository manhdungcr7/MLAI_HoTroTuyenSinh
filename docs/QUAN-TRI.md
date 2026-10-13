# Vận hành và triển khai thật

Tài liệu cho người quản trị hệ thống (chủ tài khoản Cloudflare và quản trị viên nội dung). Kiến trúc dữ liệu: `docs/CMS-THIET-KE.md`, `docs/CMS-API.md`.

## 1. Bức tranh tổng

```
Tình nguyện viên (điện thoại) -> CMS (project Pages `nguyenvongai-cms`, đăng nhập email + mật khẩu)
        -> D1 `nguyenvongai_db`  (bản ghi, nhật ký, hộp thư, snapshot)
        -> quản trị viên duyệt -> Xuất bản -> D1 + KV `KV_CONG_DONG` (manifest + snapshot có mã băm)
Học sinh (app, project Pages `nguyenvongai`)
        -> /api/manifest (KV, cache 5 phút) -> /snapshots/<tên>.<phiên bản>.<băm>.json (KV, cache vĩnh viễn, tự kiểm băm)
        -> kho dữ liệu hợp nhất lên dữ liệu gốc -> mọi màn dùng số mới
Học sinh báo sai: POST /api/bao-sai -> D1 `bao_sai` -> CMS, mục Phê duyệt > Hộp thư.
Đăng ký tình nguyện: POST /api/tinh-nguyen -> D1 `tinh_nguyen_dang_ky` -> CMS > Hộp thư > Cấp quyền.
```

Hai project Pages dùng chung **một** D1 và **một** KV (cùng id, cùng tên binding `DB` và `KV_CONG_DONG`).

## 2. Chạy thử cả vòng ở máy bạn (không cần tài khoản Cloudflare)

```
npm run build && npm run cms:build
echo "GIA_DANH_DEV=1`nSESSION_SECRET=bi-mat-cuc-bo-0123456789" > cms/.dev.vars   # (PowerShell) hai dòng, tệp bị .gitignore
# GIA_DANH_DEV chỉ để chạy thử: bỏ qua mật khẩu, chỉ có tác dụng ở localhost; người đó phải có dòng trong `quan_tri`
npm run cms:api        # CMS + API, http://127.0.0.1:8788 (D1/KV cục bộ, tự áp migrations)
npm run app:local      # app học sinh + Functions, http://127.0.0.1:8790, DÙNG CHUNG D1/KV với CMS
```
Gọi API CMS cần header `X-Gia-Danh: ban@example.com` (chỉ có tác dụng ở localhost khi `GIA_DANH_DEV=1`). Giao diện CMS mở ở cổng 8788; muốn gắn header trong trình duyệt dùng `CMS_GIA_DANH=ban@example.com npm run cms:dev` (cổng 3031, proxy sang 8788).
Thử vòng: nhập điểm chuẩn ở CMS (Dữ liệu trường, một trường, "Nhập điểm chuẩn cả trường một lượt", Duyệt luôn) > Xuất bản > mở app học sinh, trang ngành có số mới. Dữ liệu cục bộ nằm ở `<thư mục tạm>/nv-cms/cms/.wrangler/state`.

## 3. Tạo hạ tầng thật (một lần, cần chủ tài khoản)

1. **D1**: `npx wrangler d1 create nguyenvongai_db`. *Lưu ý:* tài khoản hiện báo `maximum number of D1 databases`; cần xóa một DB không dùng hoặc nâng gói trước. Dán `database_id` vào `wrangler.jsonc` và `cms/wrangler.jsonc` (đang là `00000000-…`).
2. **Migrations**: `npx wrangler d1 migrations apply nguyenvongai_db --remote` (0001 đến 0007). Migration 0006 dựng lại bảng `quan_tri` để nhận vai `sa`; 0007 thêm cột mật khẩu (`mat_khau`, `phai_doi_mat_khau`, `mat_khau_luc`). Dữ liệu cũ giữ nguyên, nhưng những người đã có trong bảng chưa có mật khẩu: sa/qtv phải "Đặt lại mật khẩu" cho họ (hoặc chạy lại `scripts/tao-sa.ts` cho chính mình).
3. **KV**: namespace `KV_CONG_DONG` đã tạo (id nằm trong hai tệp wrangler). Tư vấn AI dùng một KV riêng cho giới hạn tần suất (`RATE_KV`), đừng nhầm.
4. **Gắn binding** ở cả hai project Pages (Settings > Bindings): D1 `DB`, KV `KV_CONG_DONG`.
5. **Project CMS**: tạo project Pages `nguyenvongai-cms` (Direct Upload). Đặt secret ký phiên (bắt buộc, thiếu thì mọi API trả 500 `chua-cau-hinh`): `openssl rand -base64 32` rồi `npx wrangler pages secret put SESSION_SECRET --project-name=nguyenvongai-cms`. Đổi secret này thì mọi người bị đăng xuất. Secret tùy chọn `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` để nhận thông báo. Không dùng Cloudflare Access; **không bao giờ** đặt `GIA_DANH_DEV` ở production.
6. **Siêu quản trị đầu tiên**: `npx tsx scripts/tao-sa.ts ban@example.com --remote` (thêm `--mat-khau=...` nếu muốn tự chọn; bỏ cờ `--remote` thì chỉ in SQL). Mật khẩu tạm in ra màn hình một lần; đăng nhập vào CMS rồi đổi ngay. Chạy lại lệnh này cũng là cách cứu hộ khi mất mật khẩu của sa cuối cùng.
7. **CI**: đặt Repository variable `DEPLOY_CMS = true` (Settings > Secrets and variables > Actions > Variables) để mỗi lần đẩy `main` tự triển khai CMS (`.github/workflows/deploy.yml`). Cần secret `CLOUDFLARE_API_TOKEN` (quyền Pages, D1).
8. **Nạp dữ liệu ban đầu** (tùy chọn): `npx tsx scripts/khoi-tao-d1-that.ts` rồi `wrangler d1 execute nguyenvongai_db --remote --file=.wrangler/seed-d1.sql`. Kiểm lại nội dung tệp seed trước khi nạp: dữ liệu CMS luôn phải có nguồn thật (xem `docs/DU-LIEU.md`).
8b. **Bản xuất bản đầu tiên** (thay cho bước 8 nếu chỉ cần dữ liệu có nguồn thật): `npx tsx scripts/xuat-ban-ban-dau.ts --local` để thử (D1/KV cục bộ; xem bằng `NV_TRANG_THAI=<thư mục --state> node scripts/chay-app-local.mjs`), rồi `--remote` (cần `wrangler login`; tự dừng nếu D1 đã có dữ liệu của CMS). Nạp 66 trường + 721 học phí có link đề án, ghi D1, KV và Vectorize qua một Worker tạm (không deploy). Chạy lại an toàn; `--chi-vector` chỉ nhúng lại.
9. **Tư vấn AI**: thêm secret `ANTHROPIC_API_KEY` (hoặc `OPENAI_API_KEY`) cho project `nguyenvongai`. Thiếu khóa thì app tự trả lời từ dữ liệu.

### Vai trò và cách thêm người

| Việc | Siêu quản trị (`sa`) | Quản trị viên (`qtv`) | Cộng tác viên (`ctv`) |
|---|---|---|---|
| Nhập, sửa dữ liệu | mọi trường | mọi trường | chỉ trường được giao |
| Duyệt, xuất bản, hộp thư | có | có | không |
| Thêm, đổi vai, xóa `ctv`, giao trường | có | có | không |
| Thêm, đổi vai, xóa `qtv` và `sa` | có | không | không |
| Quay về bản cũ, đồng bộ KV/vector | có | không | không |
| Nhật ký đầy đủ | có | trừ thao tác lên `sa`/`qtv` | không |

Luôn đúng: không tự xóa hay tự hạ quyền chính mình; không bao giờ xóa hay hạ quyền siêu quản trị cuối cùng; email lưu chữ thường. Gỡ quyền hẳn thì dùng CMS > Hệ thống > Thành viên (xóa có hiệu lực ngay, kể cả khi người đó còn phiên đăng nhập).

Đăng nhập: email + mật khẩu (băm SHA-256 có muối, lưu ở `quan_tri.mat_khau`). Phiên là cookie `nv_cms` (HttpOnly, Secure, SameSite=Strict) ký HMAC bằng `SESSION_SECRET`, sống 12 giờ; mỗi yêu cầu vẫn tra `quan_tri` nên xóa người hoặc đặt lại mật khẩu là mất phiên ngay. Sai 5 lần trong 15 phút (theo IP + email) thì bị khóa 15 phút (429). Yêu cầu ghi phải có Origin/Referer cùng host.

Thêm người: CMS > Hệ thống > Thành viên, nhập email và vai trò. Hệ thống sinh **mật khẩu tạm 14 ký tự, chỉ hiện một lần** (có nút sao chép): gửi riêng cho người đó. Họ đăng nhập, bị buộc đổi mật khẩu rồi mới dùng được CMS. **Quên mật khẩu**: sa (với mọi người) hoặc qtv (với ctv) bấm "Đặt lại mật khẩu" để lấy mật khẩu tạm mới. Mọi người tự đổi mật khẩu bằng nút "Đổi mật khẩu" ở đầu trang. Với ctv, nhớ bấm "Giao trường". Nhật ký ghi đăng nhập thành công, đổi và đặt lại mật khẩu (không bao giờ ghi mật khẩu).

Kiểm sau khi dựng: mở `/api/manifest` của app học sinh (200, JSON), mở CMS (đăng nhập bằng email + mật khẩu, thấy Tổng quan), thử một vòng nhập > duyệt > xuất bản > xem ở app.

## 4. Mùa tuyển sinh: cập nhật dữ liệu hằng năm

| Thời điểm | Việc | Ai |
|---|---|---|
| Tháng 4 đến 5 | Trường công bố đề án: cập nhật học phí, học bổng, ký túc xá, kênh chính thức | Tình nguyện viên của trường (CMS > Dữ liệu trường) |
| Tháng 7 đến 8 | Công bố điểm chuẩn: nhập điểm chuẩn cả trường một lượt (một nguồn chung, mỗi ngành một mục) | Tình nguyện viên; qtv duyệt |
| Sau mỗi đợt nhập | Xuất bản; kiểm app học sinh đã nhận bản mới | qtv |
| Quanh năm | Xử lý báo sai (Phê duyệt > Hộp thư), đăng ký tình nguyện mới | Cộng tác viên của trường, qtv |

**Tuyển tình nguyện viên:** link `/#/dong-gop` (nút "Cùng cập nhật dữ liệu trường" ở Hồ sơ, và ở trang "Số liệu từ đâu ra"). Quản trị viên mở Hộp thư, liên hệ người đăng ký để xác minh (thẻ sinh viên, email trường), bấm "Cấp quyền cộng tác viên": hệ thống thêm email vào danh sách được vào CMS và giao đúng trường họ đăng ký. Chỉ cấp được khi họ để email; số điện thoại thì liên hệ xin email trước.

**Duyệt thế nào cho đúng:** mở link nguồn, đối chiếu con số; nguồn nên là trang `.edu.vn`, thông báo chính thức hoặc bài trên trang Facebook chính thức của trường. Nội dung đánh giá của sinh viên: đọc kỹ tên riêng, lời lẽ công kích (máy chặn được số điện thoại, email, link trong chữ, nhưng không bắt được tên riêng). Trả lại kèm lý do cụ thể khi thiếu nguồn.

## 5. Sao lưu, khôi phục, sự cố

- **Rollback nội dung:** CMS > Xuất bản > chọn phiên bản cũ > quay lại. Học sinh nhận bản đó trong vài phút (cache 5 phút).
- **KV lỗi sau khi xuất bản:** API báo 502 `dong-bo-kv-loi`, dữ liệu đã ở D1; bấm "Đồng bộ lại KV" (hoặc `POST /api/xuat-ban-snapshot {action:"DONG_BO_KV"}`).
- **Sao lưu D1:** `npx wrangler d1 export nguyenvongai_db --remote --output=sao-luu-$(date +%F).sql` mỗi tuần và sau mỗi đợt nhập lớn; lưu ở nơi ngoài Cloudflare.
- **App học sinh không tải được bản mới:** app giữ bản đang có trong IndexedDB và dùng dữ liệu gốc đi kèm; không hỏng, chỉ chưa cập nhật. Tệp snapshot sai mã băm bị bỏ qua.
- **Báo cáo lạm dụng:** các endpoint công khai (`/api/bao-sai`, `/api/tinh-nguyen`, `/api/dang-ky-som`) có giới hạn theo IP bằng KV. Bị tấn công lớn thì bật Cloudflare WAF rate limiting và Turnstile (chưa bật sẵn).

## 6. Nhật ký và kiểm toán

Mọi thao tác ghi (tạo, duyệt, từ chối, xuất bản, rollback, cấp quyền, đổi trạng thái hộp thư) ghi vào `nhat_ky` hoặc `nhat_ky_kiem_toan` cùng giao dịch. Xem ở CMS > Hệ thống > Nhật ký.

# Vận hành và triển khai thật

Tài liệu cho người quản trị hệ thống (chủ tài khoản Cloudflare và quản trị viên nội dung). Kiến trúc dữ liệu: `docs/CMS-THIET-KE.md`, `docs/CMS-API.md`.

## 1. Bức tranh tổng

```
Tình nguyện viên (điện thoại) -> CMS (project Pages `nguyenvongai-cms`, sau Cloudflare Access)
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
echo "GIA_DANH_DEV=1`nQTV_DAU_TIEN=ban@example.com" > cms/.dev.vars   # (PowerShell) hai dòng, tệp bị .gitignore
npm run cms:api        # CMS + API, http://127.0.0.1:8788 (D1/KV cục bộ, tự áp migrations)
npm run app:local      # app học sinh + Functions, http://127.0.0.1:8790, DÙNG CHUNG D1/KV với CMS
```
Gọi API CMS cần header `X-Gia-Danh: ban@example.com` (chỉ có tác dụng ở localhost khi `GIA_DANH_DEV=1`). Giao diện CMS mở ở cổng 8788; muốn gắn header trong trình duyệt dùng `CMS_GIA_DANH=ban@example.com npm run cms:dev` (cổng 3031, proxy sang 8788).
Thử vòng: nhập điểm chuẩn ở CMS (Dữ liệu trường, một trường, "Nhập điểm chuẩn cả trường một lượt", Duyệt luôn) > Xuất bản > mở app học sinh, trang ngành có số mới. Dữ liệu cục bộ nằm ở `<thư mục tạm>/nv-cms/cms/.wrangler/state`.

## 3. Tạo hạ tầng thật (một lần, cần chủ tài khoản)

1. **D1**: `npx wrangler d1 create nguyenvongai_db`. *Lưu ý:* tài khoản hiện báo `maximum number of D1 databases`; cần xóa một DB không dùng hoặc nâng gói trước. Dán `database_id` vào `wrangler.jsonc` và `cms/wrangler.jsonc` (đang là `00000000-…`).
2. **Migrations**: `npx wrangler d1 migrations apply nguyenvongai_db --remote` (0001 đến 0005).
3. **KV**: namespace `KV_CONG_DONG` đã tạo (id nằm trong hai tệp wrangler). Tư vấn AI dùng một KV riêng cho giới hạn tần suất (`RATE_KV`), đừng nhầm.
4. **Gắn binding** ở cả hai project Pages (Settings > Bindings): D1 `DB`, KV `KV_CONG_DONG`.
5. **Project CMS**: tạo project Pages `nguyenvongai-cms` (Direct Upload). Đặt biến `TEAM_DOMAIN` (ví dụ `ten-nhom.cloudflareaccess.com`), `ACCESS_AUD` (Application Audience tag), `QTV_DAU_TIEN` (email quản trị viên đầu tiên). Secret tùy chọn `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` để nhận thông báo.
6. **Cloudflare Access** (Zero Trust > Access > Applications): bảo vệ toàn bộ tên miền CMS, chính sách cho phép danh sách email, xác thực một lần qua email. **Không bao giờ** đặt `GIA_DANH_DEV` ở production.
7. **CI**: đặt Repository variable `DEPLOY_CMS = true` (Settings > Secrets and variables > Actions > Variables) để mỗi lần đẩy `main` tự triển khai CMS (`.github/workflows/deploy.yml`). Cần secret `CLOUDFLARE_API_TOKEN` (quyền Pages, D1).
8. **Nạp dữ liệu ban đầu** (tùy chọn): `npx tsx scripts/khoi-tao-d1-that.ts` rồi `wrangler d1 execute nguyenvongai_db --remote --file=.wrangler/seed-d1.sql`. Kiểm lại nội dung tệp seed trước khi nạp: dữ liệu CMS luôn phải có nguồn thật (xem `docs/DU-LIEU.md`).
9. **Tư vấn AI**: thêm secret `ANTHROPIC_API_KEY` (hoặc `OPENAI_API_KEY`) cho project `nguyenvongai`. Thiếu khóa thì app tự trả lời từ dữ liệu.

Kiểm sau khi dựng: mở `/api/manifest` của app học sinh (200, JSON), mở CMS (đăng nhập qua Access, thấy Tổng quan), thử một vòng nhập > duyệt > xuất bản > xem ở app.

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

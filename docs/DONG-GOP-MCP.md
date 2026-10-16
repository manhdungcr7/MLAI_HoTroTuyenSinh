# Đóng góp số liệu qua AI (MCP cho cộng tác viên)

Người trong trường (thầy cô, sinh viên, cán bộ tuyển sinh) nhờ Claude hoặc ChatGPT đọc đề án tuyển sinh rồi nhập điểm chuẩn vào CMS. Số liệu chỉ vào **hàng chờ duyệt**. Học sinh chỉ thấy số đã được quản trị viên duyệt và xuất bản.

Phạm vi lần này là mức 1.5 của issue #10: điểm chuẩn (`de_xuat_diem_chuan`). Học phí và ghi chú cộng đồng qua MCP chưa làm.

## Quy tắc cốt lõi

- AI **không bao giờ** tự duyệt, xuất bản, xóa, hay sửa bản đã xuất bản. Mọi dòng đi vào trạng thái "chờ duyệt".
- Mỗi dòng phải có **nguồn**: link đề án, số trang và một dòng **chép nguyên văn** từ tài liệu (`trichDan`, 5 đến 300 ký tự). Thiếu nguồn thì cả lần gửi bị từ chối.
- Người được giao trường (CTV) chỉ gửi cho trường đó. Quản trị viên (qtv, sa) gửi cho mọi trường.
- Nếu số mới lệch hơn 4 điểm so với số đang có, dòng được gắn cờ "Chênh lớn" để người duyệt kiểm kỹ.
- Gửi lại đúng dòng đã chờ duyệt không tạo bản trùng.

## Quy trình cho người trong trường

1. **Đăng ký làm tình nguyện viên** ở trang `/dong-gop` của app. Quản trị viên xem ở CMS, Phê duyệt > Hộp thư, rồi bấm **Cấp quyền cộng tác viên** (tạo tài khoản, giao đúng trường, gửi mật khẩu tạm).
2. **Đăng nhập CMS** và đổi mật khẩu tạm.
3. **Tạo khóa**: Hệ thống > Khóa kết nối > Tạo khóa mới. Khóa có dạng `nvk_` và 40 ký tự hex, **chỉ hiện một lần**. Sao chép ngay. Mỗi người tối đa 3 khóa còn hiệu lực, hết hạn sau 90 ngày mặc định.
4. **Kết nối với AI**:
   - Địa chỉ máy chủ: `https://<tên-miền-cms>/api/mcp-dong-gop`
   - Header: `Authorization: Bearer <khóa>`
   - Claude Code: `claude mcp add --transport http dong-gop <địa-chỉ> --header "Authorization: Bearer <khóa>"`
   - Ứng dụng khác: thêm máy chủ MCP kiểu HTTP với địa chỉ và header trên. Nếu ứng dụng không cho nhập header thì không dùng được khóa này.
5. **Nhờ AI làm việc**, ví dụ: *"Điền điểm chuẩn 2025 cho trường BKA từ file này. Mỗi dòng ghi kèm trích dẫn nguyên văn."*
   AI sẽ gọi `truong_cua_toi` và `xem_du_lieu_truong` để biết còn thiếu gì, đọc tài liệu, rồi gọi `de_xuat_diem_chuan`.
6. **Quản trị viên duyệt**: Phê duyệt > bộ lọc **Nhập qua AI**. Đọc trích dẫn, bấm **Mở nguồn** để đối chiếu, rồi Duyệt hoặc Trả lại kèm lý do. Sau đó bấm Xuất bản.
7. **Theo dõi**: nhờ AI gọi `trang_thai_dong_gop` để xem đề xuất nào đang chờ, đã duyệt, hoặc bị trả lại và vì sao.

Thu hồi khóa ngay khi máy bị mất hoặc người rời trường: Hệ thống > Khóa kết nối > Thu hồi. Thu hồi có hiệu lực ngay ở lần gọi kế tiếp.

## Công cụ (cho AI)

| Công cụ | Làm gì | Ghi dữ liệu |
|---|---|---|
| `truong_cua_toi` | Trường được phép chỉnh (sa, qtv: tất cả) | Không |
| `xem_du_lieu_truong(maTruong, nam?)` | Đã công bố gì; chương trình nào còn thiếu điểm chuẩn năm đó (`diemChuan.chuaCo.mau`), kèm `idChuongTrinh` | Không |
| `de_xuat_diem_chuan(maTruong, hang[], nguon)` | Tối đa 100 hàng `{idChuongTrinh, nam, diem, phuongThuc?, toHop?}` | Vào hàng chờ duyệt |
| `trang_thai_dong_gop` | 20 đề xuất gần nhất của chính người gọi | Không |

Kết quả công cụ là JSON tiếng Việt, tối đa khoảng 3KB. Nếu dài hơn, mảng bị cắt và có `daCat: true`.

## Kiểm tra phía máy chủ

- `idChuongTrinh` phải thuộc đúng trường. Năm từ 2015 đến năm sau.
- Thang điểm: THPT và các phương thức khác 10 đến 30; ĐGNL tối đa 1200; HSA tối đa 150.
- `toHop` không ghi thì là `KHONG`, theo quy ước của CMS.
- Hàng sai bị bỏ qua kèm lý do, hàng đúng vẫn nhận. Lần gửi có lỗi nguồn thì không ghi gì.
- Giới hạn theo khóa: 60 hàng mỗi phút, 500 hàng mỗi ngày. Số hàng bị từ chối vẫn được đếm.
- Mỗi lần gửi được ghi một dòng nhật ký kiểm toán (email, công cụ, số hàng, `via=mcp`). Không ghi trích dẫn.

## Giới hạn trung thực

- **AI có thể đọc sai.** Người duyệt phải mở nguồn và đối chiếu trích dẫn. Trích dẫn là bằng chứng để kiểm, không phải để tin tuyệt đối.
- Điểm chuẩn là số của năm đã qua. Đề án năm nay có thể khác.
- Đã kiểm bằng test tự động (SQLite thật), **chưa kiểm** trên Claude hay ChatGPT thật. Hỗ trợ header Authorization tùy ứng dụng và phiên bản.
- Khóa được gửi qua header, cần HTTPS. Ai có khóa đều gửi được đề xuất trong phạm vi của người đó, nên không chia sẻ khóa.
- Giới hạn tần suất đếm bằng KV, không nguyên tử: có thể lệch vài hàng khi nhiều yêu cầu chạy song song. KV lỗi thì từ chối, không cho ghi không đếm được.
- Kết quả đề xuất và trạng thái chỉ hiện 20 dòng gần nhất.
- Chưa làm: `de_xuat_hoc_phi`, `ghi_chu_cong_dong`, duyệt hàng loạt có xem trước khác biệt, luồng SSE.

## Cho người phát triển

- Migration: `migrations/0010_khoa_ket_noi_ctv.sql` (cột `ban_ghi_cms.nhap_qua_ai`, JSON nội bộ, không vào bản chụp công khai). Khóa dùng lại bảng `khoa_api` (pham_vi `de_xuat`).
- API: `cms/functions/api/mcp-dong-gop.ts` (MCP), `cms/functions/api/khoa-ket-noi.ts` (quản lý khóa).
- Thư viện: `cms/functions/_thu-vien/dong-gop-mcp.ts` (giao thức và công cụ), `dong-gop-kiem.ts` (kiểm tra thuần), `khoa-ket-noi.ts` (khóa, xác thực, giới hạn).
- Test: `npx tsx tests/mcp-dong-gop.test.ts` (dùng `tests/nap-d1-dong-gop.ts`).
- Giao diện CMS: `cms/src/he-thong/khoa-ket-noi.tsx`, `cms/src/phe-duyet/danh-sach-duyet.tsx` (nhãn, trích dẫn, chênh, bộ lọc).
- Chạy cục bộ: `npm run cms:api` (Pages Functions nạp theo đường dẫn tệp trong `cms/functions/api`, không cần khai báo thêm).

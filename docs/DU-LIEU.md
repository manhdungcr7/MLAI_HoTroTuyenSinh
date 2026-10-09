# Dữ liệu ngành và trường: nguồn, cách sinh lại, giới hạn

Danh mục trong app (`LUA_CHON_MAU` ở `src/data/lua-chon-mau.ts`) là **2.513 chương trình** của 95 trường, lấy từ đề án tuyển sinh chính thức và trang tổng hợp điểm chuẩn. Đường ống thu thập nằm trong `legacy/` (Python). Các tệp JSON dưới đây là kết quả, **đừng sửa tay**: chạy lại script.

## Các tệp dữ liệu (`src/data/`)
| Tệp | Nội dung | Sinh bởi |
|---|---|---|
| `du-lieu-that.json` | 2.513 chương trình: tên ngành, trường, tỉnh, phương thức, tổ hợp, điểm chuẩn từng năm, điểm dự kiến, nguồn | `scripts/xuat-du-lieu-that.py` |
| `nguon-nam.json` | Với mỗi chương trình và mỗi năm có điểm: link file đề án PDF và **số trang** có điểm đó | `scripts/sinh-nguon-nam.py` (cần `tim-url-de-an.py` chạy trước) |
| `de-an-truong.json` | Mỗi trường: danh sách đề án PDF các năm, và trang nói về học phí | `scripts/sinh-de-an-truong.py` |
| `chuong-trinh.json` | Trang giới thiệu ngành trên website của trường (đã mở thử, tiêu đề trùng tên ngành) | `scripts/tim-chuong-trinh.py`, `tim-chuong-trinh-sitemap.py`, rồi `gop-chuong-trinh.py` |
| `nguon-nam-thu-cap.json`, `de-an-truong-thu-cap.json` | Như hai tệp trên nhưng cho các trường chỉ có điểm từ trang tổng hợp: toàn văn đề án của trường, và những điểm tìm thấy đúng số trong đề án | `scripts/doi-chieu-thu-cap.py` |
| `hoc-phi.json` | Học phí theo năm của vài chục ngành, trích từ trang học phí của đề án (tên ngành đứng ngay trước số tiền theo năm; không đổi từ tín chỉ/tháng) | `scripts/trich-hoc-phi.py` |
| `viec-lam.json` | Tỷ lệ có việc làm bổ sung (hàng có đúng một số %), chỉ dùng cho ngành chưa có số liệu cũ | `scripts/trich-viec-lam.py` |
| `trang-nganh-truong.json` | Trang danh sách ngành/chương trình đào tạo của từng trường (đã mở thử), dùng khi chưa có trang riêng của ngành | `scripts/trang-nganh-truong.py` (danh sách ứng viên tìm bằng tìm kiếm giới hạn tên miền trường) |
| `to-hop-chinh-thuc.ts` | 73 tổ hợp xét tuyển chính thức (ba môn mỗi tổ hợp) từ `legacy/common/data/shared_rules.json` | tạo từ tệp trên |
| `lua-chon-that.ts` | Chuyển các tệp trên thành kiểu `LuaChon` của app; tên ngành gọn (`tenGon`); chọn nguyện vọng cho hồ sơ mẫu | viết tay |
| `tham-khao/lua-chon-mau-cu.ts` | 14 trường mẫu cũ, chỉ để làm dữ liệu cố định cho `tests/thu-tinh-huong.test.ts` | viết tay |

`nguon-nam`, `de-an-truong`, `chuong-trinh` được tải **khi mở trang chi tiết** (import động), không nằm trong gói chính.

## Chạy lại
Cần thư mục `nguyen-vong` (đường ống cũ, có `data/raw/deans/*.pdf` đã tải) nằm cạnh thư mục dự án này.
```
python scripts/xuat-du-lieu-that.py
cd ../nguyen-vong && python ../team-repo/scripts/tim-url-de-an.py && cd ../team-repo   # tìm lại URL gốc, chỉ nhận khi dung lượng khớp file đã tải
python scripts/sinh-nguon-nam.py
python scripts/sinh-de-an-truong.py
PHAN=0/8 python scripts/tim-chuong-trinh.py     # chạy song song 8 phần (0/8 … 7/8); tương tự tim-chuong-trinh-sitemap.py
python scripts/gop-chuong-trinh.py
npm test
```

## Quy tắc đã áp dụng
- **Không bịa số.** Học phí, việc làm, môi trường học chỉ hiện khi dữ liệu có. Thiếu thì ghi "Chưa có dữ liệu" (`coHocPhi()` ở `data/lua-chon-phu.ts`). Chỉ 6 chương trình có học phí riêng; còn lại app dẫn tới **trang học phí trong đề án** thay vì tự điền số.
- **Điểm chuẩn tính theo đúng tổ hợp của ngành** (`features/kham-pha/to-hop.ts`). Đề án chưa ghi tổ hợp (khoảng một nửa số ngành) thì lấy tổ hợp cao nhất của em và báo rõ. Ngành chỉ xét tổ hợp có Sử, Địa, Tin... thì ghi "chưa so được" vì hồ sơ chỉ có 6 môn.
- **Link nguồn chỉ nhận khi có bằng chứng**: PDF phải có đúng tên ngành và điểm ở trang được ghi; trang ngành của trường phải mở được và tiêu đề trùng tên ngành (`scripts/gop-chuong-trinh.py` lọc chặt, bỏ bài tin tức, quyết định, trang điểm chuẩn).
- Điểm của phương thức khác thi THPT (học bạ, ĐGNL, kết hợp) xếp sau điểm thi THPT, và có ghi chú.

## Giới hạn đã biết
- 962 chương trình chỉ có nguồn thứ cấp (trang tổng hợp `tuyensinh247`), chưa có PDF chính thức.
- Link trang riêng của ngành trên website trường: khoảng một phần tư số chương trình; thêm 26 trường có trang danh sách ngành chung (`trang-nganh-truong.json`). Còn lại do website trường không quét được hoặc tên ngành trên web khác đề án.
- Khung chương trình học chi tiết (môn từng học kỳ) **chưa có dữ liệu**; trang chi tiết dẫn tới trang ngành của trường nếu có, không thì nói thẳng và cho đường tìm kiếm.
- Hồ sơ có 6 môn chính + 5 môn thêm không bắt buộc (Sử, Địa, GDKT&PL, Tin, Công nghệ; `HoSo.diemThem`). Tổ hợp có môn năng khiếu / vẽ (V00, T00, M01...) và ngoại ngữ khác (D02-D06...) không tính được từ điểm hồ sơ nên app ghi 'chưa so được'.
- Học phí: chỉ khoảng 30 ngành có số theo năm; các bảng theo tín chỉ/tháng/nhóm ngành không được đổi sang năm vì dễ sai (thay vào đó dẫn tới đúng trang học phí).
- Điểm chuẩn năm nay chưa có; app dùng năm gần nhất và luôn ghi "điểm chuẩn các năm trước".

## Lớp dữ liệu từ CMS (bản xuất bản)
- Ứng dụng nạp nền `/api/manifest` (nếu chưa có bản xuất bản thì dùng `/data/manifest.json` đi kèm bản dựng), tải đúng bộ dữ liệu đổi hash, kiểm tra SHA-256, lưu IndexedDB, rồi hợp nhất lên dữ liệu gốc bằng `src/engine/du-lieu-tuyen-sinh/hop-nhat.ts`. Chưa có bản nào thì app chạy bằng dữ liệu gốc.
- Màn chi tiết (`kham-pha/chi-tiet.tsx`) đọc qua `khoDuLieu` và có khối "Thông tin của trường" (`thong-tin-truong.tsx`): kênh chính thức, nơi lưu trú, học bổng, thông báo. Mỗi dòng kèm link nguồn; không có thì ghi "chưa có".
- Quy tắc hợp nhất: thông tin trường, học bổng, thông báo **bắt buộc có `nguon.url`**, thiếu thì bỏ. Học phí CMS không ghi đè khi chỉ lặp lại số gốc (cùng nguồn, cùng mức thấp). Học phí cấp trường chỉ lấy bản ghi cấp trường, không lấy học phí của một ngành. Test: `tests/hop-nhat-snapshot.test.ts`.
- **Mọi màn dùng bản đã hợp nhất.** `LUA_CHON_MAU` và `tim()` (`src/data/lua-chon-mau.ts`) là danh mục đang dùng: kho dữ liệu thay nội dung tại chỗ bằng `datDanhMuc` khi có bản CMS mới, và gốc ứng dụng dựng lại màn đang mở (`useBanDuLieu`). Khám phá, nhãn nguyện vọng, so sánh, thử tình huống đều thấy số mới. Dữ liệu gốc (`LUA_CHON`) không bị sửa.
- Điểm chuẩn từ CMS chỉ ghi đè điểm thi THPT thang 30; mỗi chương trình lấy năm mới nhất, cùng năm nhiều bản ghi thì lấy điểm cao nhất (không làm học sinh tưởng dễ hơn). Bản ghi DGNL (thang 1200) hay học bạ không bao giờ đè điểm THPT. Khóa ghép là **mã chương trình** (người nhập chọn ngành từ danh sách của trường, `cms/src/du-lieu-truong/chuong-trinh-truong.json`, sinh bằng `scripts/sinh-chuong-trinh-cms.ts`).
- Bộ dựng snapshot (`chuanHoaChoSnapshot`) lấy nguồn, mã trường, mã bản ghi, ngày cập nhật từ bản ghi đã duyệt ở máy chủ, **không tin** nguồn người dùng tự ghi trong `data`.
- Học phí cấp trường chỉ lấp chỗ trống của chương trình chưa có học phí riêng (không đè số riêng) và chỉ loại tính theo năm.
- Phục vụ tệp: `functions/snapshots/[tep].ts` trả `/snapshots/<tên>.<phiên bản>.<băm>.json` từ KV (dự phòng D1), tự kiểm lại mã băm, cache vĩnh viễn. Test: `tests/snapshot-phuc-vu.test.ts`.

## Chỗ còn thiếu (chưa có nguồn thật, không điền)
- Ký túc xá, học bổng, kênh Zalo/fanpage, thông báo, đánh giá của sinh viên: chưa có bản ghi nào được xác minh. Bản xuất bản hiện chứa 100 bản ghi trường sinh bằng `scripts/khoi-tao-d1-that.ts` với website, fanpage và giá ký túc xá do script tự dựng (chung một giá cho mọi trường) và mức học phí cao bằng 1,2 lần mức thấp. App bỏ các bản ghi này vì không có nguồn; cần sửa script, không dựng số thay cho dữ liệu chưa có.
- Thư mục thô `../nguyen-vong` không có trong máy này nên không bổ sung được dữ liệu mới; mọi số liệu trong app vẫn là kết quả đã sinh sẵn ở `src/data/`.
- Học phí riêng của ngành: 24 chương trình. Việc làm, học phí, khung chương trình: xem mục "Giới hạn đã biết" ở trên.

## Dự báo điểm chuẩn năm tới
`src/engine/du-bao-diem-chuan.ts`. Khoảng = điểm năm gần nhất cộng phân vị 10 và 90 của biến động giữa hai năm liền nhau (từ 2023, 1.330 cặp) nhân hệ số 1,3, nở theo căn bậc hai số năm xa. Kiểm định bỏ-một-năm: khoảng "80%" phủ 92% (2023), 93% (2024), 68% (2025); sai số trung bình 1,0 đến 1,9 điểm. Năm 2025 biến động mạnh bất thường. Chỉ cho điểm thi THPT; không bù thay đổi quy chế, đề thi, chỉ tiêu. Chạy lại khi có dữ liệu mới: `npx tsx tests/du-bao-diem-chuan.test.ts` (in mức phủ từng năm; test thất bại nếu khoảng không còn phủ đúng).

## Điểm ưu tiên khu vực và đối tượng
`src/engine/diem-uu-tien.ts`. KV1 +0,75; KV2-NT +0,5; KV2 +0,25; KV3 0; UT1 +2; UT2 +1; từ 22,5 điểm giảm dần theo [(30 − tổng)/7,5] × mức. Học sinh khai ở Bước 2; `diemDayDu(s).uuTien` mang mức vào `tongChoLuaChon`, tính riêng cho từng tổ hợp. Mục tiêu hiển thị vẫn là điểm chuẩn của ngành; phần còn thiếu đã trừ ưu tiên (`mucTieuTho`). Mức cộng có thể đổi theo quy chế từng năm: cần đối chiếu mỗi mùa tuyển sinh.

## Làm sạch và phân nhóm (2026-10-09)
`scripts/phan_nhom_nganh.py` (chạy `python scripts/phan_nhom_nganh.py --ghi`, và được `xuat-du-lieu-that.py` dùng chung):
- **Phân nhóm ngành** theo luật có thứ tự ưu tiên trên tên đã làm sạch (bỏ tiền tố CT chuẩn, phần trong ngoặc, phần cơ sở, phần sau "chuyên ngành"). Bản cũ phân theo từ khóa trên cả chuỗi tên nên sai nhiều: "Hóa học (tăng cường tiếng Anh)" vào Ngôn ngữ, "Sư phạm Tin học" vào CNTT, "Chăn nuôi thú y" vào Y Dược... Thêm nhóm **Khoa học tự nhiên** (Toán, Lý, Hóa, Sinh, Môi trường, Tài nguyên). Nhóm trả về phải khớp `PHAN_NHOM_NGANH` ở màn Tạo hồ sơ (test kiểm hai chiều).
- **Bỏ 16 dòng không phải ngành**: mảnh rác khi trích PDF ("Nữ: 21.07", "Kết hợp", "Sử dụng kết quả thi...", "Tổng chỉ tiêu...", mã ngành trơ trọi) và 2 bản ghi gán nhầm trường (D61, D64: "Giáo dục Mầm non" ở Học viện Ngân hàng).
- **Sửa chính tả** do trích PDF (dấu đặt nhầm chữ "thuâṭ", chữ dính "Công nghệkỹthuật", ký tự hỏng).
- **Đổi tên tỉnh sang 34 tỉnh thành từ 1/7/2025** (Nghị quyết 202/2025/QH15): dữ liệu gốc còn tên tỉnh cũ (Bình Dương, Phú Yên, Tiền Giang...), nên học sinh chọn "TP.HCM" hay "Đắk Lắk" trước đây không khớp trường cùng nơi. Bảng đổi ở `TINH_MOI`.
- Tệp phụ mồ côi (khóa không còn trong dữ liệu chính) tự bị bỏ; `cms/.../tap-truong.json` và danh sách chương trình của CMS sinh lại bằng `scripts/sinh-tap-truong.ts`, `scripts/sinh-chuong-trinh-cms.ts`.
- Test chất lượng: `tests/du-lieu.test.ts` (nhóm, tên ngành, tỉnh), `tests/toan-bo-chuong-trinh.test.ts` (mọi chương trình qua mọi hàm hiển thị với 7 kiểu học sinh, không chữ lỗi, số vô lý).
- Còn tồn tại: mã trường trùng tên (D61 và NHH đều là Học viện Ngân hàng; D64 và TMU là ĐH Thương mại); nhiều trường chỉ có vài chương trình (BKA 2); điểm chuẩn mặc định lọc từ 15 trở lên ở màn Khám phá.

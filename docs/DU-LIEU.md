# Dữ liệu ngành và trường: nguồn, cách sinh lại, giới hạn

Danh mục trong app (`LUA_CHON_MAU` ở `src/data/lua-chon-mau.ts`) là **2.529 chương trình** của khoảng 100 trường, lấy từ đề án tuyển sinh chính thức và trang tổng hợp điểm chuẩn. Đường ống thu thập nằm trong `legacy/` (Python). Các tệp JSON dưới đây là kết quả, **đừng sửa tay**: chạy lại script.

## Các tệp dữ liệu (`src/data/`)
| Tệp | Nội dung | Sinh bởi |
|---|---|---|
| `du-lieu-that.json` | 2.529 chương trình: tên ngành, trường, tỉnh, phương thức, tổ hợp, điểm chuẩn từng năm, điểm dự kiến, nguồn | `scripts/xuat-du-lieu-that.py` |
| `nguon-nam.json` | Với mỗi chương trình và mỗi năm có điểm: link file đề án PDF và **số trang** có điểm đó | `scripts/sinh-nguon-nam.py` (cần `tim-url-de-an.py` chạy trước) |
| `de-an-truong.json` | Mỗi trường: danh sách đề án PDF các năm, và trang nói về học phí | `scripts/sinh-de-an-truong.py` |
| `chuong-trinh.json` | Trang giới thiệu ngành trên website của trường (đã mở thử, tiêu đề trùng tên ngành) | `scripts/tim-chuong-trinh.py`, `tim-chuong-trinh-sitemap.py`, rồi `gop-chuong-trinh.py` |
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
- Link trang ngành của trường: khoảng một phần tư số chương trình. Còn lại do website trường không quét được hoặc tên ngành trên web khác đề án.
- Khung chương trình học chi tiết (môn từng học kỳ) **chưa có dữ liệu**; trang chi tiết dẫn tới trang ngành của trường nếu có, không thì nói thẳng và cho đường tìm kiếm.
- Hồ sơ chỉ có 6 môn (Toán, Lý, Hóa, Sinh, Văn, Anh). Thêm Sử, Địa, Tin, GDKT&PL cần sửa chung `state/types.ts`, bước nhập điểm và `to-hop.ts`.
- Điểm chuẩn năm nay chưa có; app dùng năm gần nhất và luôn ghi "điểm chuẩn các năm trước".

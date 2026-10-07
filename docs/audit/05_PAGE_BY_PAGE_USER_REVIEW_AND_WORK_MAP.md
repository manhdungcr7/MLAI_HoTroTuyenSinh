# Rà soát từng trang theo góc nhìn người dùng thật và bản đồ chia việc

Ngày rà: 2026-10-07. Rà bằng cách đọc code theo từng bước của 3 vai người dùng, chưa chạy trên thiết bị thật. Chỗ nào là ước lượng thì ghi rõ.
Ba vai: **P1** lớp 11, chưa có điểm thi thử, dùng Android 360px. **P2** lớp 12 sát kỳ thi, cần chốt nguyện vọng. **P3** thi lần 2, ngân sách thấp, ở tỉnh.
Phụ huynh và thầy cô được rà riêng ở mục 3.9.

## 1. Kết luận ngắn

| Câu hỏi | Trả lời |
|---|---|
| Hệ thống đang ở mức nào? | Lõi khám phá, nguyện vọng và mục tiêu dùng được cho P2. Vòng lặp hằng ngày chưa đủ để dùng thật. |
| Màn tốt nhất | Chi tiết ngành (4,5/5), An toàn danh mục (4,5/5), Khám phá (4/5), Mục tiêu (4/5). |
| Màn yếu nhất | Màn phân tích (2/5, chờ giả), Nhắc nhở (2/5, chỉ nhắc khi tab còn mở), Hôm nay cho người chưa có mục tiêu (1,5/5). |
| Persona bị bỏ rơi | P3 (thi lại, ngân sách thấp). P1 bị cản ở 3 chỗ (mục 2). |
| Lỗi sản phẩm nặng nhất | Nút "Sắp xếp lại" đặt Vừa sức lên trước Thử sức, mâu thuẫn với quy tắc đỗ nguyện vọng cao nhất đủ điểm. |
| Học sinh có đóng góp được không? | Hiện không. Không có nút báo sai, góp ý hay form nào. |
| Dữ liệu trả ra có ổn không? | Minh bạch nguồn tốt, nhưng 38% chương trình chỉ có nguồn thứ cấp và 924 chương trình chỉ có một điểm "2026" chưa đối chiếu (mục 4). |

## 2. Phát hiện xuyên suốt

1. **Ô nhập không được dùng.** Các trường `nguonDiem`, `ghiChuChiPhi`, `conDuong`, `mucTieuHienTai`, `cachHoc`, `truongMoUoc` chỉ lưu vào state, không logic nào đọc. `buoc-1.tsx` còn hứa "dùng để tính khoảng cách điểm". Riêng `nguonDiem` nguy hiểm nhất: P1 chọn "Học bạ" nhưng app vẫn so với điểm chuẩn thi THPT.
2. **Quá nhiều thang đo cho một ngành.** Chi tiết ngành có Phù hợp / Có thể thử sức / Cần cân nhắc, cộng "Mức chắc chắn", cộng "Điểm gợi ý /100". Nguyện vọng dùng Thử / Vừa / An toàn / Dự phòng. Chi tiết ngành không cho biết nhãn nguyện vọng.
3. **Thiếu thứ quyết định nguyện vọng thật:** điểm ưu tiên khu vực và đối tượng, hạn đăng ký, số nguyện vọng tối đa, quy tắc đỗ nguyện vọng đầu tiên đủ điểm, học bổng, ký túc xá, tỉ lệ chọi.
4. **Hôm nay chỉ có giá trị khi đã đặt mục tiêu.** Chưa đặt thì không có đếm ngược, không có việc.
5. **Vòng lặp hằng ngày đứt ở 4 chỗ:** tuần mới không tự tạo việc, nhắc nhở không chạy khi đóng app, streak chỉ là một câu chữ, làm đề xong không có chỗ ghi điểm.
6. **Chỉ 4 tổ hợp cho mục tiêu** (A00, A01, D01, B00). Khối C, D07, tổ hợp có Sử/Địa/Tin không có kế hoạch. 112 chương trình bị ảnh hưởng.

## 3. Thẻ từng trang

Cột Mức là 0-5. Cỡ: T tiny, S small, M medium. Model: H haiku, S5 sonnet 5.5, Main là phần cần quyết định sản phẩm hoặc đụng file dùng chung.

### 3.1 Onboarding và Hôm nay

| Trang | Người dùng đang hỏi | Mức | Khó hiểu / phức tạp | Thiếu | Thừa | Việc đề xuất (cỡ, model) |
|---|---|---|---|---|---|---|
| `/chao` | App này làm gì, mất bao lâu, có lộ thông tin không? | 4 | Khẩu hiệu mơ hồ; "60 giây" lệch thực tế (6 câu + 6 ô điểm) | Nói rõ dành cho lớp nào, dữ liệu chỉ tham khảo | Minh họa 3 biển chiếm 180px | Thay minh họa bằng 1 dòng "2.529 chương trình thật, có link đề án" (T, H) |
| `/bat-dau/1` | Lớp 11 chưa có điểm thì sao? Phải chọn ngành ngay à? | 3,5 | "Lớp" và "Giai đoạn" hỏi gần như một thứ; nhóm ngành có cả dropdown lẫn chip | Lựa chọn "thi lại / đã tốt nghiệp"; không dùng tỉnh để tính điểm ưu tiên | Ô Mục tiêu hiện tại, Trường mơ ước (ô chết) | Bỏ "Giai đoạn", suy từ Lớp, thêm "thi lại"; bỏ ô chết (S, S5) |
| `/bat-dau/2` | Quên điểm điền sao? Điểm này là học bạ hay thi thử? | 4 | Mã A00/A01 chưa giải thích; "Điểm lấy từ đâu" không có tác dụng | Cảnh báo học bạ khác điểm thi; ô "điểm dự kiến" cho người chưa có điểm | Khối "Thêm về cách em học" | Nối `nguonDiem` vào cảnh báo ở Khám phá; bỏ `cachHoc` (S, S5) |
| `/bat-dau/3` | Nhà khó khăn, trường nào rẻ, có ký túc xá, học bổng? | 3 | Mức thấp nhất "Dưới 30 triệu" quá rộng; Khu vực trùng ý "Học xa nhà" | Ký túc xá, học bổng, chi phí sống, công/tư | `conDuong`, `ghiChuChiPhi` | Thêm mức "Dưới 15 triệu"; bỏ 2 ô chết (S, S5). Dữ liệu học bổng/KTX cần nguồn thật (M, Main) |
| Màn phân tích | Nó đang làm gì? | 2 | Chữ "Đối chiếu năng lực" không đúng thực tế | Kết quả thật ngay tại đây | Cả màn là chờ giả 1,2 giây | Thay bằng thẻ "Với điểm của em: X ngành đủ điểm" từ `tinhCoHoi` (S, S5) |
| `/` Hôm nay | P2: còn bao nhiêu ngày, hôm nay học gì? P1: nên làm gì tiếp? | P2 4 / P1 1,5 | Mục tiêu chính vs nguyện vọng khác nhau thế nào? | Đếm ngược độc lập mục tiêu; mốc tuyển sinh; việc khám phá cho P1 | Câu động lực, tâm trạng ở màn đầu người mới | Thẻ "3 việc đầu tiên" cho người chưa có mục tiêu (M, S5); thẻ mốc tuyển sinh (S, S5) |

### 3.2 Khám phá và Nguyện vọng

| Trang | Người dùng đang hỏi | Mức | Khó hiểu / phức tạp | Thiếu | Thừa | Việc đề xuất |
|---|---|---|---|---|---|---|
| `/kham-pha` | Với điểm này vào được ngành gì, trường nào, ở đâu? | 4 | Đầu trang xếp chồng 8 khối; "Có N ngành phù hợp" thực ra là số sau lọc; bộ lọc tự bật theo hồ sơ mà người dùng không biết | Lọc theo tổ hợp, phương thức, công/tư; so sánh nhanh từ thẻ | Thông báo trắc nghiệm cam | Chip lọc tổ hợp (S, S5); gộp 2 thông báo thành 1 dải (S, H); đổi "ngành phù hợp" thành "ngành" (T, H) |
| `/kham-pha/bo-loc` | Cho mình xem trường điểm gần mình, học phí dưới X | 4 | Thanh trượt 30 điểm khó chọn chính xác trên 360px; lọc học phí vẫn giữ ngành chưa có học phí, P3 dễ bị đánh lừa | Lọc tổ hợp, phương thức, công/tư | Loại hình ĐH/CĐ | Công tắc "Chỉ ngành có học phí trong dữ liệu" (S, S5) |
| `/kham-pha/:id` | Đủ điểm không? Có đáng không? Link đâu để tự kiểm tra? | 4,5 | 3 thang đo chồng nhau; trang dài, nút hành động ở cuối | Nhãn Thử/Vừa/An toàn; xu hướng điểm chuẩn tăng/giảm; tỉ lệ chọi; học bổng; chia sẻ cho bố mẹ | Ảnh bìa gradient; Điểm gợi ý /100 | Thanh nút dính dưới (S, S5); dòng "tăng/giảm X qua N năm" (S, S5); bỏ Điểm gợi ý /100 khỏi Chi tiết (T, H); thêm nhãn nguyện vọng (S, S5) |
| `/so-sanh` | Hai trường đang phân vân, cái nào hơn? | 3,5 | Ô xanh cho "điểm đầu vào thấp hơn" gợi ý thấp là tốt; "Mức phù hợp" và "Mức chắc chắn" trùng | So 3-4 phương án; thêm vào nguyện vọng ngay trong bảng | Hàng "Mức chắc chắn" | Nút "Thêm cả 2 vào nguyện vọng" (S, S5); so 3 ngành (M, Main) |
| `/kham-pha/ve-du-lieu` | Số liệu có đáng tin không? | 4 | "Đề án" chưa giải thích với lớp 11 | Ngày cập nhật dữ liệu; nút báo sai | Khối "Khác gì chatbot" | Nút "Báo số liệu sai" (S, H); thu gọn khối chatbot (T, H) |
| `/nguyen-vong` | Danh sách đã an toàn chưa? NV nào đặt trước? | 4 | **Mâu thuẫn thứ tự**: mô tả nói NV1 là trường muốn nhất, nút sắp xếp đặt Vừa sức lên đầu; dòng chỉ hiện điểm chuẩn, không hiện chênh với điểm em | Giải thích quy tắc đỗ NV cao nhất đủ điểm; chênh điểm từng dòng; xuất danh sách để mang đi hỏi thầy cô; hạn nộp | Hai nút Thêm và Gợi ý xếp liền | Chênh điểm +x,x/−x,x (S, S5); câu giải thích quy tắc (T, H) |
| `/nguyen-vong/an-toan` | Danh sách có rớt hết không? Cần thêm gì? | 4,5 | Ba điểm /100 là thang tự đặt; "Khu vực" chấm thấp vô lý với P3 chọn nhiều nơi | Link sang Thử tình huống; nút "Thêm trường an toàn" mở sẵn bộ lọc | Tác vụ nhanh trùng với Gợi ý điều chỉnh | Sắp xếp giữ thứ tự mong muốn, chỉ cảnh báo khi NV an toàn đứng trước NV thử sức (M, Main); nút thêm trường an toàn có sẵn bộ lọc (S, S5) |
| Gợi ý danh sách | Em không biết chọn gì, cho em danh sách mẫu | 3,5 | "Thêm cả N ngành" không cho chọn từng ngành | Giải thích vì sao 6 ngành; chế độ ngân sách thấp | Không đáng kể | Nút thêm từng ngành (S, S5); P1 chưa có điểm gợi ý theo `nganhQuanTam` thay vì khóa nút (M, S5) |

### 3.3 Mục tiêu, kế hoạch, theo dõi

| Trang | Mục đích | Mức | Khó hiểu / phức tạp | Thiếu | Thừa | Việc đề xuất |
|---|---|---|---|---|---|---|
| `/thu-tinh-huong` (+kết quả) | Tăng Toán +1 thì mở thêm bao nhiêu ngành | 3 | "Tóm tắt thay đổi" có 3 con số; điều kiện phụ cùng màn | Đặt điểm giả lập làm mục tiêu; cần tăng bao nhiêu để mở ngành này | Điều kiện phụ có thể gấp | Nút "Đặt X điểm làm mục tiêu" (T, H); "cần tăng +? mới mở" trên thẻ ngành (S, S5) |
| `/diem-thi-thu` (+kết quả) | Ghi điểm mỗi lần thi thử, tín hiệu quan trọng nhất của vòng lặp | 3 | Điểm thi thử và điểm hồ sơ khác nhau thế nào? | Ô ngày, tên đề; nhập bù; tự cập nhật kế hoạch | Khối tổ hợp trùng màn Mục tiêu | Ô ngày + tên đề (S, S5); sau khi lưu hỏi "Cập nhật việc theo điểm mới?" (S, S5) |
| `/ke-hoach` | Điểm vào tab | 4 | Không | Lộ trình dài hạn cho lớp 11 | Không | Chưa cần đổi |
| `/ke-hoach/muc-tieu` (+môn kéo điểm, sửa) | Còn thiếu bao nhiêu điểm, dồn sức môn nào | 4 | Hai tab ĐGNL và Học bạ vào ngõ cụt; hai nút gần nhau | Mục tiêu dự phòng; đường dốc theo thời gian; xử lý riêng lớp 11 | Hai tab trống | Ẩn tab chưa tính được (T, H); cờ `khoi===11` đổi tài liệu SGK 11 (S, S5); thêm tổ hợp C00, D07… (M, Main) |
| `/ke-hoach/tuan`, `/viec/:id`, `/tien-do` | Trung tâm vòng lặp hằng ngày | 3,5 | 3 nút xếp lịch gần giống nhau; một việc nhiều buổi nhưng tick một lần | Tự tạo việc tuần mới; bộ đếm giờ; ghi điểm sau buổi; kiểm tra chưa nhập lịch học trước khi xếp | Ba nút trùng ý | Xem mục 5, gói WP4 |
| `/ke-hoach/cai-dat/*` | Cho hệ thống biết bận lúc nào, nhắc ra sao | Lịch học 4, tự học 4, nhắc nhở 2 | Nhập từng tiết một | Nhập nhanh theo mẫu tuần; lịch thi thật của trường | Câu "Học vừa sức…" lặp | Nhập nhiều thứ một lần (S, H); thông báo thật khi tắt app cần máy chủ push (M-L, Main) |

### 3.4 Hồ sơ, hướng nghiệp, đồng hành, tư vấn

| Trang | Mục đích | Mức | Thiếu | Việc đề xuất |
|---|---|---|---|---|
| `/ho-so` (+cài đặt, chia sẻ) | Xem hệ thống hiểu em thế nào, sao lưu, chia sẻ | 4 | Nhắc sao lưu; nhắc chia sẻ khi danh sách thiếu chỗ an toàn | Banner "chưa sao lưu lần nào" sau N ngày (T, H) |
| `/huong-nghiep` | Lớp 11 chưa biết ngành làm Holland 18 câu | 4 | Nối kết quả sang lộ trình 2 năm; biết kết quả ảnh hưởng gì | Đề nghị "mục tiêu tạm" và khung học bạ lớp 11 (M, S5) |
| `/dong-hanh`, `/loi-nhan` | Phụ huynh xem, nhắn lại | 3 | Bản gọn cho phụ huynh; nút phản hồi nhanh; nhắc cập nhật liên kết | Xem mục 3.9 |
| `/tu-van` | Hỏi AI có căn cứ | 3,5 | Nói rõ gửi gì lên máy chủ | Dòng giải thích riêng tư (T, H) |
| `/thiet-ke` | Chỉ có khi dev, không phải màn người dùng | — | — | Không đề xuất |

### 3.9 Phụ huynh và thầy cô

Phụ huynh muốn thấy ngắn: con theo ngành nào, thiếu bao nhiêu điểm, tuần này học đều không, chi phí, cần người lớn giúp việc gì. Bản tóm tắt hiện dài (tối đa 10 mục), nặng về nguyện vọng.

Rủi ro riêng tư của liên kết:
- Chứa điểm, tỉnh, ngân sách, mục tiêu, có thể cả họ tên. Lịch sử Zalo giữ liên kết vô thời hạn và không thể thu hồi vì không có máy chủ.
- Lời nhắn nhận về đã có dòng "người gửi tự xưng", chưa có biện pháp chống giả mạo.
- Liên kết là bản chụp tĩnh, muốn cập nhật phải tạo mới.

Việc đề xuất: bản gọn 4 con số + 3 việc đầu `/dong-hanh` (S, S5); ba nút phản hồi nhanh sinh lời nhắn có sẵn (S, H); cảnh báo riêng tư trước khi tạo liên kết lần đầu (T, H); hiện ngày tạo và nhắc tạo mới sau 2 tuần (T, H).

## 4. Dữ liệu trả ra có ổn không

Số liệu đo từ `src/data/*.json` (bản build 07/10, commit `8c08c24`). Thời gian tải 3G là ước tính.

| Chỉ tiêu | Kết quả |
|---|---|
| Điểm chuẩn | 1 năm: 50,2%; 2 năm: 37,1%; 3 năm: 9,0%; 4-5 năm: 3,7% |
| Tổ hợp | 49,7% chưa ghi tổ hợp, app tự suy ra |
| Phương thức | THPT 86,9%; khác 13,1% (học bạ 220, ĐGNL 72, kết hợp 22, năng khiếu 10, ĐGTD 8) |
| Học phí / việc làm | 24 chương trình (0,9%) / 122 (4,8%) |
| Nguồn | PDF trường 62%; trang tổng hợp 38% (962). Link PDF theo năm cho 59% |
| Phân bố | 100 trường, 31/63 tỉnh. Hà Nội 38,6%, TP.HCM 18,9%. Y Dược chỉ 77 chương trình (nhiều khả năng thiếu) |
| Điểm "2026" | 924 chương trình chỉ có một điểm 2026 từ trang tổng hợp, không có PDF. Trang "Số liệu từ đâu ra?" lại nói điểm năm nay chưa công bố: **mâu thuẫn cần xác minh** |
| Nạp đầu | ≈1,28 MB raw, ≈212 KB gzip. Ước tính 2-3 s Fast 3G, 5-6 s Slow 3G |
| Kiểm schema | Không có. `du-lieu-that.json` ép kiểu `as unknown as`. Kiểm dữ liệu nằm ở `npm test`, không nằm ở `npm run kiem-tra` |
| Tái tạo | Script cần thư mục anh em `nguyen-vong` ngoài repo. Không có ngày cập nhật, không có người phụ trách |

Điểm tốt: UI đã nói thẳng độ tin cậy (nhãn Đã/Chưa kiểm chứng, cảnh báo mới có điểm một năm, cảnh báo phương thức khác THPT, trang giới hạn dữ liệu).

### Học sinh đóng góp như thế nào

Hiện không có cơ chế nào (không nút báo sai, không form, không `mailto:`, `functions/api` chỉ có `tu-van.ts`, không KV/D1).

| Phương án | Cách làm | Cỡ | Khuyến nghị |
|---|---|---|---|
| A. Nút "Báo sai" mở GitHub Issue hoặc mailto điền sẵn id chương trình, trường sai, link nguồn | Không cần máy chủ, nhật ký công khai. Học sinh ít có tài khoản GitHub nên mailto/Google Form là đường chính | S | Làm ngay |
| B. Form → Pages Function → D1/KV chờ duyệt, có Turnstile, bắt buộc link bằng chứng, không lưu thông tin cá nhân | Học sinh không cần tài khoản, gom được nhiều báo | M-L | Làm khi thực sự có người báo |
| C. Mẫu CSV/JSON + PR, CI validate | Hợp thầy cô có kỹ thuật, truy vết sạch | S-M | Song song, dành cho nhóm kỹ thuật |

Nguyên tắc: dữ liệu học sinh báo luôn gắn nhãn "do học sinh báo, chưa kiểm chứng" và không đè lên số liệu có nguồn trước khi maintainer duyệt.

## 5. Bản đồ chia việc (work packages)

Mức ưu tiên: P0 làm trước khi ship, P1 ngay sau, P2 sau.

| WP | Nội dung | Ưu tiên | Cỡ | Model | Phụ thuộc / file chung |
|---|---|---|---|---|---|
| WP1 | Hoàn tất nhóm A: nhãn đúng năm, không gán nhãn phương thức khác THPT, cờ suy ra, thiếu môn hiện "—", copy cấm, test biên (đang chạy) | P0 | M | S5 | Đụng `engine`, `nguyen-vong`, `tom-tat` |
| WP2 | Gộp 2 nhánh worktree (độ bền dữ liệu, API tư vấn) và nối nút "chọn từ nguyện vọng" | P0 | S | Main | Sau WP1 |
| WP3 | Sửa mâu thuẫn thứ tự nguyện vọng: giữ thứ tự mong muốn, chỉ cảnh báo; giải thích quy tắc đỗ NV cao nhất đủ điểm; chênh điểm từng dòng | P0 | M | Main + S5 | Quyết định sản phẩm; sau WP1 |
| WP4 | Vòng lặp hằng ngày: tự tạo việc tuần mới, chặn xếp lịch khi chưa nhập lịch học, reset tâm trạng theo ngày, ngày nghỉ mặc định Chủ nhật, streak và "làm nhẹ khi bỏ lỡ", ghi điểm sau buổi | P1 | M | S5 (phần T giao H) | `ke-hoach`, `tu-hoc`, `store` |
| WP5 | Dọn onboarding: bỏ 6 ô chết hoặc nối thật (`nguonDiem` trước), bỏ "Giai đoạn", thêm "thi lại", mức ngân sách thấp, màn phân tích thành thẻ kết quả thật | P1 | S-M | S5 | `khoi-dau`, `types.ts` |
| WP6 | Thống nhất thang nhãn: nhãn nguyện vọng ở Chi tiết ngành, bỏ Điểm gợi ý /100 và Mức chắc chắn, thanh nút dính | P1 | S | S5 + H | Sau WP1 |
| WP7 | Khám phá: chip lọc tổ hợp, công tắc "chỉ ngành có học phí", gộp thông báo đầu trang | P1 | S | S5 + H | `kham-pha` |
| WP8 | Dữ liệu: sửa mâu thuẫn "điểm năm nay chưa công bố" sau khi xác minh 924 dòng, `du-lieu.meta.json` (ngày lấy, người phụ trách), nhãn "chưa có" nhất quán, zod schema vào `kiem-tra`, bắt ID mồ côi | P1 | M | Main xác minh, H sửa chữ, S5 schema | `src/data`, `scripts` |
| WP9 | Đóng góp: nút "Báo sai số liệu" (phương án A) và dòng "Gợi ý này có ích không?" lưu cục bộ | P1 | S | H | Sau WP8 |
| WP10 | Mở rộng tổ hợp xã hội (C00, D07, D14, X70…): đổi `MaToHop`, `mucTieuDayDu`, mon-keo-diem, xếp lịch, migration hồ sơ cũ | P1 | M-L | Main | File dùng chung `chon.ts`, `types.ts` |
| WP11 | Phụ huynh/thầy cô: bản gọn, nút phản hồi nhanh, cảnh báo riêng tư, nhắc tạo liên kết mới | P2 | S | S5 + H | `dong-hanh`, `chia-se` |
| WP12 | Thông báo thật khi tắt app (Web Push qua Worker) và quyết định quyền riêng tư | P2 | M-L | Main | Quyết định kiến trúc |
| WP13 | Dữ liệu cho P3: học bổng, ký túc xá, điểm ưu tiên khu vực; mở rộng độ phủ Y Dược và các tỉnh thiếu | P2 | L | Main thiết kế, S5 làm | Cần nguồn thật |
| WP14 | Hiệu năng nạp: chẻ `nguon-nam` theo trường, cache `taiNguon()`, đo Lighthouse thật | P2 | M | S5 | Sau WP8 |
| WP15 | Quét polish: bỏ khối thừa, sửa chữ, font nhúng, og.png 1200x630, icon PNG | P2 | S | H | Độc lập |

### Phân model theo kiểu việc
- **Haiku:** sửa chữ, bỏ khối thừa, thêm nút/dòng nhỏ, cập nhật doc, thêm từ cấm.
- **Sonnet 5.5:** việc nhiều file trong một slice, có test, mỗi agent một worktree.
- **Main (tôi):** quyết định sản phẩm (thứ tự nguyện vọng, tổ hợp, push), file dùng chung, tích hợp nhánh, chạy cổng.

### Thứ tự gợi ý
WP1 → WP2 → WP3 → (WP4, WP5, WP6, WP7 song song ở các slice khác nhau) → WP8 → WP9 → WP10 → phần còn lại.
Không chạy song song hai WP cùng chạm `store.tsx`, `chon.ts`, `types.ts` hoặc `tom-tat.ts`.

## 6. Cần sửa trong các doc audit cũ
- Doc 02 #4 và #5: màn phân tích đi tới `/kham-pha`, không phải `/`.
- Doc 02 #8: nguồn nạp qua `taiNguon()`, không phải trực tiếp `de-an-truong.json`.
- Doc 03 hàng Nguyện vọng: nút "Sắp xếp lại" nằm ở `an-toan.tsx`, không ở danh sách.
- Doc 02/03 nhắc "bấm giờ làm bài" và "tự điều chỉnh thời khóa biểu khi điểm đổi": code chưa có bộ đếm giờ, việc cập nhật phải bấm tay.
- Doc 02 #22 hứa "giờ học tuần, chuỗi ngày": chưa có hiển thị chuỗi ngày.
- Doc 02 không nhắc `/tu-van`, `/thiet-ke` (chỉ dev).

## 7. Giới hạn của lần rà này
Đọc code, không chạy trên điện thoại thật. Một số màn chỉ đọc tiêu đề và nút (`mon-keo-diem`, `tien-do`, `lich-hoc`, `cai-dat-tu-hoc`, `trac-nghiem`, `tu-van`, `ho-so`), nhận xét ở đó là ước lượng. Số liệu tải 3G và bộ nhớ chưa đo. Nên chạy `kiem-tra-ui` ở 390/360px và Lighthouse trước khi chốt.

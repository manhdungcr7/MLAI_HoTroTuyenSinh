# Kế hoạch hoàn thiện để dự thi — Decision Intelligence Challenge

> Tài liệu chung cho cả nhóm. Cập nhật 12/10/2026 trên `main` = `c000463`. Mỗi việc có **người phụ trách theo slice**, **cách làm**, **tiêu chí xong**. Đánh dấu `[x]` khi xong và ghi commit.
> Căn cứ: đề bài (6 tiêu chí, 100 điểm; bàn giao **Web demo + Pitch Deck**), `docs/DOI-CHIEU-TIEU-CHI.md`, đo đạc giao diện ngày 12/10 (mục 3).

## 1. Chiến lược trong một câu

**Ít tính năng mới, một luồng quyết định thật rõ, chữ ít đi một nửa, mọi con số có nguồn đúng.** Giám khảo nhớ được 1 khoảnh khắc "à, công cụ này giúp mình quyết định" — đó là **mô phỏng sức chịu của danh sách nguyện vọng** (mục 4, việc F1) dựa trên khoảng dự báo đã kiểm định.

## 2. Việc chặn đường (làm trước mọi thứ khác)

| # | Việc | Phụ trách | Cách làm | Xong khi |
|---|---|---|---|---|
| B1 | **Gỡ học phí sai nguồn** | Slice dữ liệu (`kham-pha`) | `QHL` lấy PDF của ĐH Luật Hà Nội, `QHY` lấy PDF của ĐH Y Hà Nội (trường khác). Xóa các khóa `qhl-*`, `qhy-*` trong `src/data/hoc-phi.json`; sửa `DEAN_CAP_NHAT` trong `scripts/lam-day-hoc-phi.py`; mở PDF `QHF` kiểm; rà các nhánh `else` (mức mặc định) với PDF | `npm test` xanh; trang ngành QHL/QHY hiện "Chưa có dữ liệu" |
| B2 | **Bật AI thật** | Hạ tầng (`ke-hoach`/`tu-hoc` + chủ tài khoản) | Cloudflare Pages `nguyenvongai`: thêm secret `ANTHROPIC_API_KEY`, tạo KV `RATE_KV` và gắn binding (bắt buộc từ `c000463`), deploy lại | `POST /api/tu-van` trả 200, câu trả lời ghi "Trả lời bởi AI" |
| B3 | **Hồ sơ mẫu hợp lý cho demo** | `hanh-trinh` (Tuấn) + file chung `state/mau.ts`, `data/lua-chon-that.ts` | `idHoSoMau()` hiện chọn mục tiêu là KHMT CT Tiên tiến – QST, học phí 70 tr vượt ngân sách 60 tr của chính hồ sơ mẫu → màn đầu báo "Cần cân nhắc", thiếu 4,0 điểm. Chọn mục tiêu: THPT, đề án **có ghi tổ hợp A01**, ≥2 năm điểm, học phí trong ngân sách (hoặc chưa có), thiếu 1–2 điểm. Thêm test | Hôm nay hiện "còn thiếu ~1,5 điểm", trang ngành mục tiêu không bị "Cần cân nhắc" vì học phí |
| B4 | **Khôi phục dòng giới hạn** đã bị xóa ngày 12/10 | `kham-pha` | Một dòng ngắn dưới nhãn "Mức độ phù hợp" (trang ngành) và dưới "Với điểm của em" (Khám phá): "So với điểm chuẩn năm trước · không phải xác suất đậu" | Hai dòng có lại, ≤ 12 từ |
| B5 | **Sửa tài liệu nói quá** | Ai cũng được | `DOI-CHIEU-TIEU-CHI.md`: bỏ "axe" (hoặc làm thật), "924" → 1.716; `DU-LIEU.md`: bỏ D61/D64; `BACKLOG.md` #12: email vẫn là email cá nhân | Không còn khẳng định sai code |

## 3. Giảm chữ trên giao diện

### 3.1 Đo được gì (12/10, 390px, hồ sơ mẫu)

| Màn | Số từ | Đoạn dài (≥12 từ) | Dài bao nhiêu màn hình | Nhận xét |
|---|---|---|---|---|
| Chia sẻ `/ho-so/chia-se` | 564 | 15 | 3,1 | Bản tóm tắt in nguyên văn trên màn |
| Số liệu từ đâu ra | 464 | 9 | 2,3 | Nhiều đoạn giải thích |
| Cơ cấu danh sách `/nguyen-vong/an-toan` | 433 | 10 | 2,7 | 4 khối giải thích trước phần hành động |
| **Trang ngành** `/kham-pha/:id` | 429 | 11 | **3,3** (7 lần cuộn ở ảnh chụp) | "Học phí vượt" lặp ở 3 khối; 6 link nguồn liền nhau |
| Nguyện vọng | 360 | 8 | 2,8 | Mỗi dòng NV có 5–6 mẩu thông tin |
| Trắc nghiệm | 321 | 8 | 2,1 | |
| Kế hoạch tuần | 319 | 8 | 2,2 | |
| Điểm thi thử | 313 | 4 | 3,0 | |
| Hồ sơ | 289 | 4 | 2,3 | 4 khối nhận xét dạng câu |
| Hôm nay | 186 | 2 | 1,8 | Tạm ổn |

(Khám phá 1.215 từ vì có 30 thẻ — bình thường với danh sách; `/dong-gop` và Bước 1 cao vì ô chọn có 118 trường / 34 tỉnh.)

### 3.2 Nguyên tắc chữ (áp dụng cho mọi màn, thêm vào review PR)

1. **Màn đầu (trước lần cuộn đầu tiên): 1 kết luận + 1 hành động chính.** Mọi thứ khác xuống dưới hoặc vào "Xem thêm".
2. **Số trước, chữ sau.** "28,5 điểm · thiếu 3,7" thay cho câu "Điểm hiện tại của em là 24,8, thấp hơn mức tham khảo 3,7 điểm".
3. **Câu ≤ 15 từ, khối chữ ≤ 2 dòng** ở 390px. Dài hơn → nút ⓘ mở `HopTruot` (đã có sẵn).
4. **Không nói một ý hai lần trên cùng màn.** Một lý do chỉ xuất hiện ở một khối.
5. **Giải thích cách tính → ⓘ**, không in sẵn (giám khảo xem ở slide; học sinh tò mò thì bấm).
6. **Danh sách nguồn gộp thành một hàng** "Nguồn: Đề án 2025 tr.21 · +4" mở sheet.
7. **Giữ đúng 1 dòng giới hạn** ở mỗi chỗ có nhãn/khoảng ("không phải xác suất đậu") — không bỏ, không kéo dài.
8. Mục tiêu đo: màn chi tiết ≤ 2 màn hình, ≤ 250 từ; màn tổng quan ≤ 1,5 màn hình, ≤ 180 từ.

### 3.3 Việc theo màn (ưu tiên theo mức nặng và mức xuất hiện trong demo)

| # | Màn | Phụ trách | Làm gì |
|---|---|---|---|
| T1 | Trang ngành | `kham-pha` | Đầu trang: tên ngành + 3 số (điểm chuẩn · điểm em · học phí) + nhãn + 1 dòng giới hạn. Gộp "Mức độ phù hợp", "Vì sao nên cân nhắc", "Điều cần lưu ý" thành **một** khối "Hợp / Chưa hợp" dạng chip, mỗi ý ≤ 10 từ. "Chương trình học", "Thông tin trường", "Nguồn" → 3 hàng gập. Thanh nút dính dưới (Thêm NV · Đặt mục tiêu · So sánh) |
| T2 | Cơ cấu danh sách | `nguyen-vong` | Đưa **kết luận + gợi ý điều chỉnh** lên đầu; "Tổ hợp dùng để tính" và chú thích 4 nhãn → ⓘ; 3 thẻ điểm đánh giá thành 1 hàng 3 số |
| T3 | Nguyện vọng | `nguyen-vong` | Mỗi dòng: NV số · ngành · trường · nhãn · chênh điểm. Dự báo, học phí, tổ hợp → khi bấm mở dòng |
| T4 | Hồ sơ | `hanh-trinh` (Tuấn) | 4 khối nhận xét → mỗi khối tối đa 2 dòng ngắn dạng "Toán 8,0 ↑" và nút "Xem thêm"; gộp "Hành động nhanh" thành lưới 2×2 icon |
| T5 | Chia sẻ | `hanh-trinh` (Tuấn) | Không in toàn văn bản tóm tắt; hiện 4 chỉ số + nút "Xem nội dung sẽ gửi" (gập) |
| T6 | Hôm nay | `hanh-trinh` (Tuấn) | Gộp "Điểm hiện tại / mục tiêu / còn thiếu / còn N ngày" vào **một** thẻ mục tiêu; câu động lực và tâm trạng thu nhỏ |
| T7 | Khởi đầu | `khoi-dau` (Tuấn) | Bớt dòng phụ dưới mỗi câu hỏi; màn kết quả đã gọn |
| T8 | Số liệu từ đâu ra, Trắc nghiệm, Kế hoạch tuần, Điểm thi thử | chủ slice | Áp nguyên tắc 3.2 |

### 3.4 Kết quả đo lại (12/10, sau các commit T1–T8, cùng cách đo)

| Màn | Từ trước → sau | Màn hình trước → sau | Đã làm |
|---|---|---|---|
| Chia sẻ | 506 → **113** | 3,0 → **1,2** | 4 chỉ số dạng gọn, nội dung tóm tắt vào khối gập (vẫn in được), câu ngắn |
| Cơ cấu danh sách | 355 → **167** | 2,4 → **1,7** | Tổ hợp + chú thích nhãn vào ⓘ; gợi ý điều chỉnh lên trước thẻ điểm; thẻ điểm chỉ hiện chi tiết khi chưa chấm được |
| Trang ngành | 425 → **274** | 3,3 → **2,7** | Link nguồn "Nguồn · tr. N"; khối Nguồn gập; mô tả 2 dòng; "Thông tin trường" trống còn 1 dòng; câu phù hợp ngắn |
| Nguyện vọng | 352 → **203** | 2,8 → **2,2** | Thẻ NV 2 dòng số; bỏ hộp "Cách xét" (vào mô tả đầu trang); ghi chú 1 dòng |
| Hồ sơ | 283 → **145** | 2,2 → **1,6** | Nhận xét dạng số, ≤ 2 ý/khối; "nên bổ sung" vào thẻ đầu; hành động nhanh lưới 2×2 |
| Hôm nay | 182 → **126** | 1,7 → **1,4** | Một thẻ mục tiêu: hiện tại → mục tiêu · thiếu · số ngày; tâm trạng 1 hàng; gợi ý ≤ 15 từ |
| Điểm thi thử | 313 → **96** | 3,0 → **1,4** | Bỏ hộp lặp ý; nút chính lên trước; lịch sử 18 dòng vào khối gập |
| Kế hoạch tuần | 317 → **194** | 2,2 → **1,7** | Bỏ nhãn ưu tiên lặp tên nhóm, dòng chi tiết từng việc, 2 dòng giải thích dưới nút |
| Khởi đầu B1/B2/B3 | 415/264/143 → 397/223/113 | — | Rút dòng phụ (B1 cao vì ô chọn 34 tỉnh) |

**Chưa làm (ưu tiên tiếp):** Trang ngành vẫn 2,7 màn (mục tiêu ≤ 2: gộp "Vì sao nên cân nhắc" + "Điều cần lưu ý" thành một khối chip như T1 gốc); "Số liệu từ đâu ra" 464 từ; Trắc nghiệm 321; Nhắc nhở 238; Thử tình huống 232.

Cách đo: Playwright + Edge, 390×844, nạp hồ sơ mẫu, đếm từ trong `<main>`, số màn = `scrollHeight / 844`. Script nằm ngoài repo (cần `playwright-core`, không thêm vào dependencies); ai cần chạy lại thì hỏi Tuấn.

## 4. Tính năng nên thêm (ăn điểm tiêu chí 3 và 4)

| # | Việc | Phụ trách | Cách làm (tóm tắt) | Tiêu chí |
|---|---|---|---|---|
| F1 ⭐ | **Danh sách có chịu được năm điểm chuẩn tăng?** | `nguyen-vong` (hàm thuần có thể nhờ Tuấn) | Với mỗi NV: `duBaoDiemChuan(lc)` + `tongChoLuaChon(lc, diemDayDu(s))` → đủ điểm ở mức thấp/giữa/cao của khoảng; đếm số NV đủ điểm và NV đầu tiên đủ điểm ở mỗi mức. Hiện 3 cột ở đầu màn Cơ cấu + 1 câu kết luận + nút "Thêm ngành an toàn". Không nói %. Có test | 3, 4 (mô phỏng), 1 |
| F2 | **Chi phí mỗi năm** (học phí + sinh hoạt) | `kham-pha` | `src/data/chi-phi-song.ts` (theo tỉnh × chỗ ở, có nguồn, gắn nhãn "giả định, em sửa được") + `tongChiPhi(lc, hoSo)`; hiện ở trang ngành và So sánh | 2, 1 |
| F3 | **Trọng số do em chọn** khi so sánh 2–3 ngành + câu "đổi trọng số thì thứ hạng đổi thế nào" | `kham-pha` | Dùng lại `diemPhuHop` (4 thành phần) với thanh trượt | 3 |
| F4 | **"AI giải thích ngành này"** ngay trên trang ngành | `tu-van` | Gọi `/api/tu-van` với câu hỏi dựng sẵn + dữ liệu ngành; 503 thì dùng câu tự sinh từ `danhGia()` | 4 |
| F5 | **Thử với 5–10 học sinh thật** | cả nhóm | 15 phút/bạn; đo thời gian tạo hồ sơ, % hiểu nhãn, % đổi danh sách, 3 câu trích dẫn → 1 slide | 1, 6 |

## 5. Backend còn thiếu

| # | Việc | Trạng thái 12/10 | Cách làm | Ghi chú |
|---|---|---|---|---|
| H1 | D1 production | ❌ `database_id` = `00000000-…` | `docs/QUAN-TRI.md` mục 3 (xóa bớt DB cũ vì chạm giới hạn) | Không có D1 thì báo sai, tình nguyện viên, đăng ký sớm không lưu được online |
| H2 | Project CMS + Cloudflare Access | ❌ | `QUAN-TRI.md` mục 3.5–3.7; `DEPLOY_CMS=true` | Nếu không kịp: **video 60 giây** vòng nhập → duyệt → xuất bản → học sinh thấy (chạy `cms:api` + `app:local`) |
| H3 | `RATE_KV` + khóa AI | ❌ | B2 | Bắt buộc |
| H4 | Một bản xuất bản CMS thật | ❌ manifest rỗng | Nhập điểm chuẩn hoặc học phí có nguồn cho 1–2 trường qua CMS, duyệt, xuất bản | Để demo "dữ liệu cộng đồng" có số thật |
| H5 | Gói dữ liệu nhẹ hơn | ⚠ `du-lieu-that.json` ~1,2 MB trong gói chính | Tải lười sau màn Chào (Backlog #10/#13) | Mạng hội trường |
| H6 | Không làm thêm | — | Tài khoản/đồng bộ, push server, tích hợp lịch | Ngoài phạm vi hackathon; nêu ở slide "bước tiếp" |

## 6. Bàn giao

| # | Việc | Phụ trách | Xong khi |
|---|---|---|---|
| D1 | **Pitch Deck 10–12 slide** theo mục 3b đề bài | 1 người chốt, cả nhóm góp | Dàn ý: `tuan_docs/15-danh-gia-theo-tieu-chi-hackathon.md` mục 7 (bản cho nhóm: `docs/NOI-DUNG-CHO-SLIDE.md`) |
| D2 | Kịch bản demo 5 phút, 4 khoảnh khắc (Hiểu em → Chọn & đánh đổi → Kiểm tra quyết định (F1) → Hành động) + video dự phòng | người trình bày | Tập ≥ 3 lần, đúng 5 phút |
| D3 | Cập nhật `docs/KICH-BAN-DEMO.md` theo D2 | người trình bày | |

## 7. Thứ tự đề xuất

```
Ngày 1:  B1, B2, B3, B4, B5            (chặn đường, nhỏ)
Ngày 2:  F1  +  T1, T2 (2 màn có trong demo)
Ngày 3:  T3–T6  +  F5 (buổi chiều thử với học sinh)
Ngày 4:  F2 hoặc F4 (chọn 1)  +  H1/H2 hoặc video  +  D1
Ngày 5:  đóng băng tính năng; sửa lỗi từ F5; D2, D3; tập demo
```

## 8. Theo dõi

| Việc | Trạng thái | Commit / ghi chú |
|---|---|---|
| B1 Gỡ học phí sai nguồn | ✅ | `8e83163` — tải lại từng PDF: gỡ 337 dòng của 11 trường (QHF, QHL, QHY, QST, IUH, TMU, TLA, BVH, QHX, SPH, NTS: link 404 hoặc PDF của trường khác); giữ 721 dòng ở 20 trường; `BO_QUA` trong `lam-day-hoc-phi.py` để chạy lại không thêm lại |
| B2 Bật AI | ⬜ | |
| B3 Hồ sơ mẫu cho demo | ✅ | `9a68cfd` — mục tiêu mới CNTT CLC – QST (26,0; có A01; 2 năm điểm), Minh Anh 24,5 → thiếu 1,5; `idHoSoMau` nhận điểm thi thử mới nhất + ngân sách; test trong `hanh-trinh.test.ts` |
| B4 Dòng giới hạn | ✅ | `6daea0d` — 1 dòng dưới "So với điểm chuẩn" (trang ngành) và dưới "Với điểm của em" (Khám phá) |
| B5 Sửa tài liệu | ✅ | `CLAUDE.md`, `DU-LIEU.md`, `DOI-CHIEU-TIEU-CHI.md`, `NOI-DUNG-CHO-SLIDE.md`: học phí 1.058 → 721, bỏ "axe", 924 → 1.716, bỏ D61/D64; `BACKLOG.md` #12 mở lại (email vẫn cá nhân), #14 thêm câu "năm nay chưa công bố" ở `ve-du-lieu.tsx` |
| T1 Trang ngành | 🟡 | `874fbbe` — 425 → 274 từ, 3,3 → 2,7 màn. Còn: gộp 2 khối ý thành chip |
| T2 Cơ cấu danh sách | ✅ | `874fbbe` — 355 → 167 từ |
| T3 Nguyện vọng | ✅ | `874fbbe` — 352 → 203 từ (giữ 2 dòng số thay vì gập, vì bấm dòng đã mở trang ngành) |
| T4 Hồ sơ | ✅ | `5a040ad` — 283 → 145 từ |
| T5 Chia sẻ | ✅ | `5a040ad` — 506 → 113 từ |
| T6 Hôm nay | ✅ | `5a040ad` — 182 → 126 từ |
| T7 Khởi đầu | ✅ | `5a040ad` |
| T8 Điểm thi thử · Kế hoạch tuần | ✅ | `c44eb30` — 313 → 96 và 317 → 194 từ. Còn: Số liệu từ đâu ra, Trắc nghiệm |
| F1 Sức chịu danh sách | ⬜ | |
| F2 Chi phí mỗi năm | ⬜ | |
| F3 Trọng số | ⬜ | |
| F4 AI giải thích | ⬜ | |
| F5 Thử với học sinh | ⬜ | |
| H1–H4 Hạ tầng | ⬜ | |
| D1 Deck · D2 Demo · D3 Kịch bản | ⬜ | |

Quy tắc chung không đổi: nhánh `feat/<slice>-<việc>`, chạy `tsc`, `kiem-tra`, `test`, `build`, `cms:build` trước PR; file dùng chung (`state/`, `engine/`, `data/`, `components/`) làm PR riêng và báo nhóm.

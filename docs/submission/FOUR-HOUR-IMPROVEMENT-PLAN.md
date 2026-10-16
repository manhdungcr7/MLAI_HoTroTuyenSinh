# KẾ HOẠCH HÀNH ĐỘNG 4 GIỜ HẬU PHẢN BIỆN (4-HOUR IMPROVEMENT PLAN)
**Chiến lược Phẫu thuật Kỹ thuật & Cải thiện Sản phẩm Sau Khi Nhận Nhận Xét Từ Ban Giám Khảo**

- **Dự án**: Nguyện Vọng AI
- **Ngân sách thời gian**: Chính xác 240 phút (4 giờ đồng hồ)
- **Tài liệu tham chiếu**: [NGUYEN-VONG-AI-PROPOSAL.md](file:///d:/07-Competitions-Hackathons/mlai/nguyenvongai/docs/submission/NGUYEN-VONG-AI-PROPOSAL.md)
- **Nguyên tắc bất khả xâm phạm**: 
  - **Phẫu thuật tối thiểu (Surgical Changes)**: Chỉ sửa đúng khiếm khuyết được chỉ ra; không tái cấu trúc mã nguồn (refactor) lan man; không thêm tính năng mới chưa kiểm chứng.
  - **Bảo toàn trang Landing đã duyệt**: Tuyệt đối không chỉnh sửa thư mục `src/features/landing-page/` và tag `landing-approved-2026-10-07`.
  - **Kiểm thử trước khi đóng gói**: Mỗi thay đổi phải có targeted test đi kèm và vượt qua bộ kiểm thử tự động trước khi xuất xưởng.

---

## 1. Phân bổ Ngân sách Thời gian (4-Hour Timeline Allocation)

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 TỔNG THỜI GIAN: 240 PHÚT (4 GIỜ)                                 │
├────────────────────┬────────────────────┬────────────────────────────┬───────────────────────────┤
│ GIỜ 1 (0 - 60m)    │ GIỜ 2 (60 - 120m)  │ GIỜ 3 (120 - 180m)         │ GIỜ 4 (180 - 240m)        │
│ Triage & Tái lập   │ Sửa lỗi P0         │ Kiểm thử Tích hợp & E2E    │ Đóng gói & Diễn tập       │
├────────────────────┼────────────────────┼────────────────────────────┼───────────────────────────┤
│ • Lọc phản hồi BGK │ • Sửa UI vỡ/lệch   │ • Test 144 viewports       │ • Chụp màn hình minh chứng│
│ • Tái lập local    │ • Khớp số liệu     │ • Chạy 4 hành trình E2E    │ • Chốt slides/proposal    │
│ • Chốt scope P0/P1 │ • Regression test  │ • Kiểm tra API readiness   │ • Diễn tập trả lời Q&A    │
│ • Đóng băng code   │ • Commit độc lập   │ • Vá blocker phát sinh     │ • Freeze Release RC       │
└────────────────────┴────────────────────┴────────────────────────────┴───────────────────────────┘
```

---

## 2. Ma trận Ưu tiên Xử lý Phản hồi (Prioritized Feedback Execution Matrix)

Bảng ma trận chuẩn bị sẵn các kịch bản phản hồi kỹ thuật thường gặp từ Ban giám khảo và phương án phẫu thuật trong 4 giờ:

| Mã | Tình huống phản hồi từ BGK | Mức ưu tiên | Thời gian dự kiến | Tệp mã nguồn tác động | Rủi ro kỹ thuật | Phương pháp kiểm chứng | Người phụ trách | Tiêu chí hoàn thành (Done Criteria) |
|---|---|---|---|---|---|---|---|---|
| **FB-01** | **Vỡ giao diện / Tràn ngang trên thiết bị mobile nhỏ (360px)** | **P0** | 25 phút | `src/features/kham-pha/`, `src/features/nguyen-vong/` | Làm xô lệch layout lân cận | Chạy agent-browser CLI đo `scrollWidth > clientWidth` tại 360px | Frontend Lead | `scrollWidth === 360px`, không còn thanh cuộn ngang, font chữ không rớt dòng |
| **FB-02** | **Số liệu điểm chuẩn hoặc học phí hiển thị mâu thuẫn / thiếu nhãn** | **P0** | 30 phút | `src/engine/phan-tich.ts`, `src/components/ui/` | Làm sai lệch thuật toán phân tầng | Chạy `npm run data:audit` và kiểm tra thẻ hiển thị | Data Lead | Nhãn `≈ ước tính` hiển thị rõ ràng trên mọi ngành chưa có học phí chính thức |
| **FB-03** | **Điểm ưu tiên tính sai trường hợp biên (trên 22,5 điểm)** | **P0** | 20 phút | `src/engine/diem-uu-tien.ts`, `tests/diem-uu-tien.test.ts` | Ảnh hưởng toàn bộ danh mục nguyện vọng | Chạy `tsx tests/diem-uu-tien.test.ts` với các ca kiểm thử biên | Algorithm Lead | Công thức giảm tuyến tính đúng 100% tại mốc 22.5, 27.0 và 30.0 điểm |
| **FB-04** | **Trợ lý tư vấn AI trả lời quá dài hoặc bị timeout trên mạng yếu** | **P1** | 25 phút | `functions/_thu-vien/ai/sinh-van-ban.ts`, `functions/api/tu-van.ts` | Lỗi 504 Gateway Timeout | Kiểm tra thời gian phản hồi qua `npm run test:agent-routing` | AI Lead | Token ra bị chặn ở mức ≤ 450 tokens, thời gian phản hồi trung bình < 4.5s |
| **FB-05** | **Nút bấm khó thao tác (Hit target < 44px) ở màn hình cài đặt** | **P1** | 20 phút | `src/features/hanh-trinh/cai-dat.tsx` | Không có | Chạy script kiểm tra target size của Puppeteer | Frontend Lead | Toàn bộ các nút bấm và chip lựa chọn đạt kích thước tối thiểu ≥ 44x44px |
| **FB-06** | **Chưa rõ sự khác biệt giữa Heuristic và Machine Learning** | **P1** | 15 phút | `docs/submission/NGUYEN-VONG-AI-PROPOSAL.md`, Slide Beamer | Hiểu lầm về năng lực sản phẩm | Đối chiếu văn bản với định nghĩa kỹ thuật | Product Lead | Văn bản khẳng định rõ đây là Hệ thống gợi ý Heuristic tất định |
| **FB-07** | **Đề xuất tính năng mới vượt quá phạm vi (VD: Chatbot giọng nói)** | **P2** | 5 phút | `docs/submission/FOUR-HOUR-IMPROVEMENT-PLAN.md` | Gây vỡ tiến độ 4 giờ | Từ chối lịch sự, ghi nhận vào Roadmap tương lai | Team Lead | Đưa vào danh mục "Out of Scope" trong báo cáo phản biện |

---

## 3. Kế hoạch Thực thi Chi tiết Từng Giờ (Hour-by-Hour Playbook)

### GIỜ 1: Phản biện & Triage (Phút 0 – 60)
- **Mục tiêu**: Lọc sạch nhiễu thông tin, xác định đúng 1–2 vấn đề mấu chốt có ảnh hưởng lớn nhất đến điểm số kỹ thuật của Ban giám khảo.
- **Các bước hành động**:
  1. *Phút 0 – 15*: Thư ký ghi nhận toàn bộ câu hỏi và góp ý của BGK. Họp nhanh 5 phút phân loại: Cái gì là Bug hiển thị (P0)? Cái gì là Dữ liệu chưa rõ (P0)? Cái gì là Câu hỏi giải thích (P1)? Cái gì là Tính năng mới (P2 - Out of scope)?
  2. *Phút 15 – 35*: Mở môi trường dev local (`npm run dev`), tái lập chính xác tình huống lỗi mà BGK đã chứng kiến. Chụp lại ảnh màn hình "TRƯỚC KHI SỬA" làm bằng chứng.
  3. *Phút 35 – 50*: Phân công nhiệm vụ rõ ràng: Dev A sửa lỗi UI/Data; Dev B chuẩn bị bài kiểm thử hồi quy; Dev C cập nhật tài liệu thuyết minh.
  4. *Phút 50 – 60*: **Scope Freeze (Đóng băng phạm vi)**. Cam kết không nhận thêm bất kỳ yêu cầu sửa đổi nào ngoài danh sách P0 đã chốt.
- **Sản phẩm bàn giao Giờ 1**: Danh sách Task P0 có gán người phụ trách, ảnh chụp lỗi tái lập.
- **Kiểm thử nghiệm thu**: Lỗi được tái lập thành công trên máy local.

### GIỜ 2: Sửa lỗi P0 & Hotfix Kỹ thuật (Phút 60 – 120)
- **Mục tiêu**: Phẫu thuật dứt điểm khiếm khuyết kỹ thuật cốt lõi trong thời gian nhanh nhất.
- **Các bước hành động**:
  1. *Phút 60 – 90*: Thực hiện chỉnh sửa mã nguồn cục bộ. Áp dụng nguyên tắc phẫu thuật tối thiểu (Surgical edit) — chỉ sửa đúng dòng CSS/TypeScript bị lỗi, không sửa các file lân cận.
  2. *Phút 90 – 105*: Viết bổ sung hoặc cập nhật unit test tương ứng trong thư mục `tests/` để khóa chặt trường hợp lỗi vừa sửa, đảm bảo không bao giờ bị tái diễn.
  3. *Phút 105 – 120*: Chạy kiểm tra nhanh cục bộ:
     ```powershell
     npm run typecheck; npm run kiem-tra
     ```
     Nếu phát hiện lỗi biên dịch hoặc vi phạm cổng đồng nhất, sửa ngay trong 5 phút.
- **Sản phẩm bàn giao Giờ 2**: Mã nguồn đã được sửa, git commit cục bộ với thông điệp rõ ràng (`fix(p0): ...`).
- **Kiểm thử nghiệm thu**: `npm run typecheck` và `npm run kiem-tra` thoát mã 0.

### GIỜ 3: Kiểm thử Tích hợp & Kiểm tra Đa Màn hình (Phút 120 – 180)
- **Mục tiêu**: Đảm bảo bản vá lỗi không gây tác dụng phụ làm hỏng các tính năng khác của sản phẩm.
- **Các bước hành động**:
  1. *Phút 120 – 140*: Chạy toàn bộ test suite cốt lõi của dự án:
     ```powershell
     npm test
     ```
     Xác nhận 100% bài kiểm tra chức năng, tính điểm, xếp lịch và hợp đồng MCP đều đạt.
  2. *Phút 140 – 165*: Chạy kiểm thử tự động giao diện trình duyệt trên môi trường Pages mô phỏng:
     ```powershell
     npm run test:browser
     ```
     Kiểm tra kỹ 144 điểm kiểm định viewport. Xác nhận không có lỗi tràn màn hình ngang (horizontal scrollbar leak) và không có ảnh hỏng tại độ phân giải 360px và 390px.
  3. *Phút 165 – 180*: Thực hiện thủ công hành trình demo 90 giây từ trang Chào mừng → Nhập điểm → Khám phá ngành → Cân bằng nguyện vọng → Lập kế hoạch học.
- **Sản phẩm bàn giao Giờ 3**: Nhật ký kiểm thử `npm test` và `test:browser` xanh 100%.
- **Kiểm thử nghiệm thu**: Không có cảnh báo lỗi nghiêm trọng, toàn bộ hành trình hoạt động mượt mà.

### GIỜ 4: Đóng gói, Tài liệu & Diễn tập Bảo vệ (Phút 180 – 240)
- **Mục tiêu**: Chuẩn bị đầy đủ vũ khí thuyết phục Ban giám khảo trong phiên bảo vệ chung cuộc.
- **Các bước hành động**:
  1. *Phút 180 – 200*: Chụp lại ảnh màn hình "SAU KHI SỬA" để đặt cạnh ảnh "TRƯỚC KHI SỬA", chứng minh sự cải thiện rõ rệt và tinh thần cầu thị của nhóm. Cập nhật tài liệu `docs/submission/NGUYEN-VONG-AI-PROPOSAL.md`.
  2. *Phút 200 – 215*: Build bản phát hành ứng dụng và kiểm tra gói bundle:
     ```powershell
     npm run build; npm run build:functions
     ```
     Đảm bảo thư mục `dist/` sẵn sàng phục vụ mà không phát sinh cảnh báo lỗi cú pháp.
  3. *Phút 215 – 230*: Diễn tập nhanh 1 lượt (Rehearsal) kịch bản thuyết trình phản biện:
     - 1 phút: Nhắc lại nhận xét sắc bén của Ban giám khảo.
     - 2 phút: Trình diễn trực tiếp bản sửa lỗi trên màn hình.
     - 1 phút: Trả lời tự tin về giới hạn kỹ thuật và phương án phát triển tiếp theo.
  4. *Phút 230 – 240*: **Release Candidate Freeze**. Khóa nhánh nộp bài, đóng gói tài liệu gửi Ban tổ chức.
- **Sản phẩm bàn giao Giờ 4**: Bộ tài liệu hoàn chỉnh, bản build sản xuất sẵn sàng, người thuyết trình tự tin.
- **Kiểm thử nghiệm thu**: Demo chạy trơn tru, không có sự cố bất ngờ.

---

## 4. Phương án Dự phòng Khẩn cấp (Fallback & Contingency Plan)

Nếu trong 4 giờ gặp sự cố nghiêm trọng không lường trước:

1. **Sự cố mất mạng Internet tại địa điểm thi**:
   - Ứng dụng là **Local-First**, 90% logic chạy offline trong trình duyệt. Nhóm kích hoạt chế độ Demo Offline sử dụng dữ liệu mẫu có sẵn trong máy (`npm run preview`), hoàn toàn không phụ thuộc vào kết nối Cloudflare hay API ngoài.
2. **Bản vá mới gây lỗi hồi quy không thể sửa kịp trong Giờ 3**:
   - Sử dụng lệnh Git khôi phục ngay lập tức về checkpoint ban đầu an toàn:
     ```powershell
     git checkout checkpoint-antigravity-takeover-2026-10-16
     ```
   - Chấp nhận không nộp bản vá tính năng đó và trình bày với BGK dưới dạng "Giới hạn đã nhận diện được và kế hoạch khắc phục chi tiết". Thà trung thực về giới hạn còn hơn để lộ lỗi sập hệ thống trực tiếp trên sân khấu.
3. **Mô hình AI bên ngoài bị nghẽn (Rate Limit / 502 Bad Gateway)**:
   - Hệ thống tự động chuyển sang chế độ fallback cục bộ: Sử dụng Bộ quy tắc tất định Clef và dữ liệu có sẵn để hiển thị câu trả lời khuyến nghị mà không làm gián đoạn trải nghiệm người dùng.

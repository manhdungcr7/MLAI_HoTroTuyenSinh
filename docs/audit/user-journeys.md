# 4. End-to-End User Journeys & Flow Analysis (Kiểm Toán Luồng Hành Trình Người Dùng)

> **Ngày kiểm toán:** 2026-10-15
> **Phạm vi:** 5 hành trình người dùng cốt lõi xuyên suốt từ Học sinh (Lớp 10–12 & Thí sinh tự do), Phụ huynh, Giáo viên chủ nhiệm cho đến Cộng tác viên & Quản trị viên CMS.

---

## 4.1. Hành Trình 1: Học Sinh Khởi Đầu, Định Hướng RIASEC & Xây Dựng Danh Sách Nguyện Vọng Cân Bằng

### Sơ Đồ Luồng Tương Tác (Mermaid Flowchart)

```mermaid
flowchart TD
    Start["Mở ứng dụng (/#/ hoặc /#/gioi-thieu)"] --> Choice{"Chọn cách bắt đầu?"}
    Choice -->|"Bắt đầu mới (xoaSach)"| Step1["Bước 1/3: Chọn Lớp (10/11/12/Tự do) & Tâm trạng\n(/#/bat-dau?buoc=1)"]
    Choice -->|"Xem với hồ sơ mẫu (napHoSoMau)"| Home["Tab 1: Hôm nay\n(/#/hom-nay)"]

    Step1 --> Step2["Bước 2/3: Nhập điểm 6 môn chính + 5 môn GDPT 2018\n(/#/bat-dau?buoc=2)"]
    Step2 --> Step3["Bước 3/3: Chọn Sở thích, Ngân sách, Khu vực\n(/#/bat-dau?buoc=3)"]
    Step3 -->|"Chưa rõ sở thích?"| RIASEC["Làm 12 câu Trắc nghiệm Holland RIASEC\n(/#/huong-nghiep)"]
    RIASEC --> RIASECRes["Kết quả RIASEC Top 2 Nhóm & Áp dụng vào Hồ sơ\n(/#/huong-nghiep/ket-qua)"]
    RIASECRes --> Explore["Tab 2: Khám phá 3.652 ngành / 118 trường\n(/#/kham-pha)"]

    Step3 -->|"Đã chọn sở thích"| Ready["Màn Sẵn sàng: Top 3 lựa chọn gợi ý đầu tiên\n(/#/san-sang)"]
    Ready -->|"Lưu nguyện vọng & đi tiếp"| Home

    Home --> Explore
    Explore <--> Filter["Bộ lọc chi tiết\n(/#/kham-pha/bo-loc)"]
    Explore <--> Compare["So sánh tối đa 3 trường\n(/#/kham-pha/so-sanh)"]
    Explore --> Detail["Chi tiết ngành + Quy đổi điểm ưu tiên/IELTS\n(/#/kham-pha/truong/:id)"]

    Detail -->|"Lưu nguyện vọng"| Wishlist["Tab 3: Danh sách Nguyện vọng\n(/#/nguyen-vong)"]
    Detail -->|"Đặt làm mục tiêu chính"| Goal["Tab 4: Mục tiêu chính\n(/#/ke-hoach/muc-tieu)"]

    Wishlist --> BalanceCheck["Kiểm tra độ cân bằng 4 tầng\n(Thử sức · Vừa sức · An toàn · Dự phòng)\n(/#/nguyen-vong/kiem-tra)"]
    BalanceCheck --> OrderSuggest["Gợi ý & Sắp xếp thứ tự NV1..NVn\n(/#/nguyen-vong/sap-xep)"]
```

### Phân Tích Chi Tiết Từng Bước & Điểm Đứt Gãy (Friction Analysis)
1. **Phân tách Hồ sơ mẫu và Hồ sơ cá nhân (`/` -> `/bat-dau`):**
   - Trong [`chao-mung.tsx:31`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/features/khoi-dau/chao-mung.tsx#L31), nút **Bắt đầu** gọi `xoaSach()` trước khi chuyển sang `/bat-dau`, đảm bảo học sinh từng bấm xem thử hồ sơ mẫu trước đó không bị dính điểm số hay nguyện vọng demo vào hồ sơ thật của mình.
2. **Nhánh rẽ Trắc nghiệm Hướng nghiệp RIASEC (`/bat-dau?buoc=3` -> `/huong-nghiep`):**
   - Học sinh lớp 10–11 chưa biết chọn nhóm ngành nào ở Bước 3 có thể bấm thẳng vào thẻ **"Chưa rõ mình hợp ngành nào? Làm 12 câu trắc nghiệm nhanh"**.
   - **Điểm nghẽn UX #1 (Mất mạch Onboarding khi rẽ sang RIASEC):** Khi hoàn thành 12 câu tại [`ket-qua-nghe.tsx:41-47`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/features/huong-nghiep/ket-qua-nghe.tsx#L41-L47), nút **Áp dụng vào hồ sơ & Khám phá trường** điều hướng thẳng tới `/kham-pha` mà **bỏ qua** phần còn lại của Bước 3 (chọn Học phí tối đa `nganSachTrieu` và Khu vực ưu tiên `khuVuc`, khiến 2 trường này giữ nguyên giá trị mặc định `30 triệu/năm` và `Đông Nam Bộ`).
3. **Điểm nghẽn UX #2 (Đứt gãy các tổ hợp môn mới GDPT 2018 khi Đặt mục tiêu):**
   - Ở `/bat-dau?buoc=2`, học sinh ban Xã hội hoặc chương trình mới nhập điểm Ngữ văn, Lịch sử, Địa lý (`C00`) hoặc Toán, Anh, Tin học (`IT`). Khi vào `/kham-pha`, các ngành xét `C00`, `D14`, `D15` vẫn được tính điểm phù hợp bình thường nhờ `TONG_TO_HOP_MO_RONG`.
   - Tuy nhiên, khi học sinh bấm vào trang chi tiết ngành đó (`/kham-pha/truong/:id`) để bấm **Đặt làm mục tiêu chính**, hàm [`coTheDatMucTieu(lc)`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/state/chon.ts#L93-L96) chỉ kiểm tra 4 mã `A00, A01, D01, B00`. Nếu ngành chỉ xét `C00`, nút đặt mục tiêu bị khóa cứng với lý do *"chưa hỗ trợ tổ hợp của ngành này"*.

---

## 4.2. Hành Trình 2: Học Sinh Giả Lập Tình Huống, Nhập Điểm Thi Thử & Tự Động Xếp Lịch Học Tuần

### Sơ Đồ Luồng Tương Tác (Mermaid Flowchart)

```mermaid
flowchart TD
    Goal["Mục tiêu chính (/#/ke-hoach/muc-tieu)\nĐo khoảng cách điểm & đếm ngược ngày thi"] --> PullSub["Môn kéo điểm nhanh nhất\n(/#/ke-hoach/muc-tieu/mon)\nMa trận Công sức × Dư địa × Xu hướng"]
    PullSub --> WeekPlan["Kế hoạch tuần (/#/ke-hoach/tuan)\n3 chế độ: Việc cần làm | Lịch | Chiến lược"]

    subgraph SimLoop["Vòng lặp Thử tình huống & Điểm thi thử"]
        WhatIf["Thử tình huống (/#/thu-tinh-huong)\nKéo cộng điểm môn / đổi ngân sách"] --> WhatIfRes["Kết quả thay đổi & So sánh 2 tình huống\n(/#/thu-tinh-huong/ket-qua)"]
        MockInput["Nhập điểm thi thử mới\n(/#/diem-thi-thu)"] -->|"chupTruocSau()"| MockRes["So sánh danh sách Trước & Sau thi thử\n(/#/diem-thi-thu/ket-qua)"]
    end

    MockRes -->|"Cập nhật khoảng cách"| Goal
    MockRes -->|"Điều chỉnh lịch"| WeekPlan

    WeekPlan --> FixedSched["Cài đặt Lịch học cố định\n(/#/cai-dat/lich-hoc)\n(Chính khóa, Học thêm, Lịch mẫu)"]
    WeekPlan --> SelfStudyCfg["Cài đặt Khung giờ tự học & Ngày nghỉ\n(/#/cai-dat/tu-hoc)"]

    FixedSched -->|"xepLai(tuan, tuNgay)"| AutoSchedule["Giải thuật Tự động xếp lịch\n(src/engine/xep-lich.ts)\nTránh tiết cố định + chừa 10p di chuyển + giữ giờ ăn"]
    SelfStudyCfg -->|"xepLai(tuan, tuNgay)"| AutoSchedule

    AutoSchedule --> TaskDetail["Chi tiết buổi học (/#/ke-hoach/viec/:id)\nChia bước nhỏ + Checklist tiêu chí"]
    TaskDetail -->|"Hoàn thành / Dời lịch / Bỏ qua"| Progress["Tiến độ & Điều chỉnh (/#/ke-hoach/tien-do)\nCảnh báo lệch lịch & Nhắc nhở (/#/cai-dat/nhac-nho)"]
```

### Phân Tích Chi Tiết & Điểm Sáng / Điểm Nghẽn
1. **Điểm sáng thiết kế — Chụp ảnh Trước/Sau khi nhập điểm thi thử (`diem-thi-thu.tsx` -> `ket-qua-diem-thi.tsx`):**
   - Trước khi ghi điểm thi thử mới vào `store`, hàm [`chupTruocSau`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/features/thu-tinh-huong/tinh-toan.ts#L198-L246) lưu lại toàn bộ nhãn nguyện vọng (`Thử sức / Vừa sức / An toàn / Dự phòng`) và điểm phù hợp của từng trường vào `localStorage` (`diem-thi-thu-truoc-sau`). Nhờ đó, màn hình kết quả chỉ rõ ngành nào vừa thăng hạng từ *Thử sức* lên *Vừa sức*, hoặc cảnh báo nếu danh sách mất đi lựa chọn *An toàn*.
2. **Điểm sáng thuật toán — Xếp lịch thông minh có đệm di chuyển (`src/engine/xep-lich.ts`):**
   - Giải thuật tự động chừa `10 phút` đệm trước và sau mỗi tiết cố định để học sinh di chuyển, luôn khóa cứng khung giờ ăn trưa (`11:45–13:00`) và ăn tối (`18:00–19:00`), đồng thời tự động cắt giảm trần giờ học trong ngày khi học sinh chọn tâm trạng *"Hơi mệt"* ở trang Hôm nay.
3. **Điểm nghẽn UX #3 (Thiếu 5 môn tự chọn ở màn Nhập điểm thi thử):**
   - Trong [`diem-thi-thu.tsx:19-26`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/features/thu-tinh-huong/diem-thi-thu.tsx#L19-L26), mảng `O_MON` chỉ hiển thị 6 ô (`toan, nguVan, tiengAnh, vatLy, hoaHoc, sinh`). Học sinh thi thử các môn Lịch sử, Địa lý, GDKT&PL, Tin học, Công nghệ không thể ghi nhận lịch sử thi thử tại màn hình này mà phải quay về `/ho-so` sửa điểm gốc.

---

## 4.3. Hành Trình 3: Phụ Huynh & Giáo Viên Chủ Nhiệm Đồng Hành Cùng Học Sinh

### Sơ Đồ Tương Tác Liên Vai Trò (Sequence Diagram)

```mermaid
sequenceDiagram
    actor HS as Học sinh (Thiết bị A)
    participant AppHS as Web App Học sinh (/#/ho-so)
    actor PH as Phụ huynh (Thiết bị B)
    participant AppPH as Góc Phụ huynh (/#/phu-huynh)
    actor GV as Giáo viên CN (Thiết bị C)
    participant AppGV as Góc Giáo viên (/#/giao-vien)

    HS->>AppHS: Hoàn thiện Hồ sơ, Nguyện vọng & Mục tiêu
    AppHS->>HS: Tạo Mã hồ sơ Base64 (xuatMaHoSo) & Link chia sẻ
    HS-->>PH: Gửi link /#/phu-huynh?ma=<base64> qua Zalo/Tin nhắn
    PH->>AppPH: Mở link ?ma=<base64>
    AppPH->>PH: Giải mã tạm thời (KHÔNG ghi đè dữ liệu máy phụ huynh)\nHiển thị Cơ cấu 4 tầng + Ước tính tổng chi phí 4 năm ĐH + Gợi ý trò chuyện
    PH->>AppPH: Bấm "In hoặc lưu PDF bản tóm tắt" để cả nhà cùng bàn

    HS-->>GV: Gửi Mã hồ sơ Base64 cho Giáo viên chủ nhiệm
    GV->>AppGV: Dán mã của từng học sinh vào Danh sách lớp (gv-danh-sach-lop)
    AppGV->>GV: Thống kê toàn lớp: Số HS chưa có NV, thiếu NV An toàn, vượt ngân sách\nXuất file báo cáo CSV toàn lớp
```

### Đánh Giá Thiết Kế Luồng Đồng Hành
- **Không cần máy chủ trung gian hay đăng ký tài khoản phức tạp:** Toàn bộ trạng thái hồ sơ được nén thành chuỗi Base64 URL-safe có tiền tố `NVAI1:` ([`src/state/store.tsx:207-235`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/state/store.tsx#L207-L235)).
- **Chế độ Xem An Toàn (`Safe Read-Only Mode`) trên máy Phụ huynh:** Trong [`phu-huynh.tsx:52-68`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/src/features/dong-hanh/phu-huynh.tsx#L52-L68), khi phát hiện tham số `?ma=` trên URL, trang đọc dữ liệu vào biến cục bộ `hoSoXem` chứ không gọi `nhapMaHoSo` ghi đè vào `localStorage` của máy đang mở.

---

## 4.4. Hành Trình 4: Trợ Lý Tư Vấn AI 4 Tầng & Cơ Chế Chống Bịa Nguồn

```mermaid
sequenceDiagram
    actor HS as Học sinh
    participant UI as Giao diện /#/tu-van
    participant API as POST /api/tu-van (bac-thang.ts)
    participant KV as Cloudflare KV Cache
    participant AI as Workers AI (Clef + BGE-M3 + Vectorize)
    participant LLM as LLM (OpenRouter / Anthropic / OpenAI)

    HS->>UI: Đặt câu hỏi (kèm HoSoRutGon: tổ hợp, tổng điểm, ngân sách, khu vực)
    UI->>API: POST /api/tu-van
    API->>KV: Kiểm tra Rate Limit (20 câu/giờ) & Tra cứu Cache câu hỏi
    alt Trúng KV Cache
        KV-->>API: Kết quả đã lưu
        API-->>UI: Trả lời ngay (<30ms, tuCache: true)
    else Chưa có trong Cache
        API->>AI: Tầng 1 (Clef): Phân loại ý định & lọc mã trường liên quan
        alt Câu hỏi ngoài phạm vi tuyển sinh
            AI-->>API: loai = "ngoai_pham_vi"
            API-->>UI: Từ chối lịch sự, hướng dẫn quay lại chủ đề tuyển sinh
        else Hợp lệ
            API->>AI: Tầng 2 (RAG): Nhúng BGE-M3 -> Truy vấn Vectorize + D1 nganh_tuyen_sinh
            API->>LLM: Tầng 3: Sinh câu trả lời JSON kèm trích dẫn từ ngữ cảnh thực
            LLM-->>API: JSON { traLoi, nguon, goiYHoiTiep }
            API->>API: Kiểm duyệt trích dẫn (locNguon): Loại bỏ mọi URL không nằm trong ngữ cảnh gốc
            API->>KV: Lưu kết quả vào KV Cache & ghi D1 lich_su_tu_van
            API-->>UI: Hiển thị câu trả lời + Thẻ trích dẫn đề án (Trang/Mục/URL)
        end
    end
    opt Mất mạng hoặc Server trả 503 CHUA_CAU_HINH
        UI->>UI: Tự động chạy traLoiTuDong() trên thiết bị từ dữ liệu tĩnh
        UI-->>HS: Hiển thị câu trả lời cục bộ + Nhãn "Trả lời tự động trên thiết bị"
    end
```

---

## 4.5. Hành Trình 5: Đóng Góp Cộng Đồng, Kiểm Duyệt CMS & Xuất Bản Snapshot Quốc Gia

### Sơ Đồ Luồng Quản Trị Dữ Liệu (Mermaid Flowchart)

```mermaid
flowchart TD
    subgraph Community["1. Đóng góp từ Cộng đồng (Web App Học sinh)"]
        ReportErr["Học sinh/Giáo viên gửi Báo sai dữ liệu\n(/#/bao-sai -> POST /api/bao-sai)"]
        VolApply["Sinh viên/GV đăng ký Tình nguyện viên\n(/#/tinh-nguyen -> POST /api/tinh-nguyen)"]
    end

    subgraph Triage["2. Hàng đợi & Hỗ trợ Kiểm duyệt (D1 + Telegram + Workers AI)"]
        D1Queue[("Bảng D1: bao_sai & tinh_nguyen_vien\n(trang_thai = CHO_DUYET)")]
        TeleBot["Thông báo Telegram Bot kèm nút bấm Inline\n(POST /api/telegram)"]
        AIAssist["Gợi ý duyệt bằng AI (POST /api/goi-y-duyet)\nĐối chiếu doan_van_ai -> Khuyến nghị DUYET / TU_CHOI / CAN_XEM_THEM"]
    end

    subgraph CMSReview["3. Phê duyệt theo Phân quyền RBAC (CMS /#/duyet/:luong)"]
        CTVMod["CTV / Mod / Admin mở Hộp thư duyệt\n(Chỉ thấy các trường thuộc phạm vi phân công)"]
        ApproveErr["Bấm DUYET báo sai\n(trang_thai = DA_DUYET)"]
        PromoteVol["Bấm CAP_QUYEN đơn tình nguyện\n(Tạo tài khoản CTV + gán phan_cong_truong)"]
    end

    subgraph PublishSync["4. Xuất bản Snapshot & Đồng bộ về Thiết bị Học sinh"]
        PublishBtn["Admin / Super Admin bấm Xuất bản\n(CMS /#/xuat-ban -> POST /api/xuat-ban-snapshot)"]
        ApplyD1["Cập nhật bảng nganh_tuyen_sinh trong D1\nĐánh dấu bao_sai -> DA_AP_DUNG"]
        WriteKV["Đóng gói JSON + tính SHA-256\nGhi KV snapshot:<phienBan>.json & manifest:current"]
        ClientSync["Trình duyệt học sinh chạy bo-dong-bo.ts\nTải Snapshot -> Kiểm tra SHA-256 -> Lưu IndexedDB -> hopNhatLuaChon()"]
    end

    ReportErr --> D1Queue
    VolApply --> D1Queue
    D1Queue --> TeleBot
    D1Queue --> CTVMod
    AIAssist --> CTVMod
    CTVMod --> ApproveErr
    CTVMod --> PromoteVol
    ApproveErr --> PublishBtn
    PublishBtn --> ApplyD1 --> WriteKV --> ClientSync
```

### Phát Hiện Đứt Gãy Luồng Nghiệp Vụ CMS (Critical Workflow Bug)
> [!CAUTION]
> **Đứt gãy luồng Thăng cấp Tình nguyện viên thành CTV (`CAP_QUYEN`):**
> - Khi một `mod` hoặc `admin` bấm nút **"Duyệt & Cấp quyền CTV"** tại [`cms/src/phe-duyet/danh-sach-duyet.tsx:221`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/cms/src/phe-duyet/danh-sach-duyet.tsx#L221), endpoint [`POST /api/hop-thu`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/cms/functions/api/hop-thu.ts#L103-L115) thực thi câu lệnh:
>   `INSERT INTO quan_tri (email, ho_ten, vai_tro, ...) VALUES (?, ?, 'ctv', ...)` mà **không truyền cột `mat_khau`** (dẫn tới `mat_khau = NULL`) và cũng không trả về mật khẩu tạm trên giao diện.
> - Hệ quả: Tình nguyện viên vừa được cấp quyền CTV khi vào trang đăng nhập CMS sẽ bị chặn bởi lỗi `403 Tài khoản chưa được cấp mật khẩu` ([`dang-nhap.ts:81`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/cms/functions/api/dang-nhap.ts#L81)), buộc `admin` phải mở tiếp tab **Hệ thống -> Quản lý thành viên -> Đặt lại mật khẩu** mới lấy được mật khẩu tạm gửi cho CTV. (Xem hướng khắc phục tại `technical-risks.md`).

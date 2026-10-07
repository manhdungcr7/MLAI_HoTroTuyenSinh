# 📊 BẢN ĐỒ DỮ LIỆU & TẦNG RA QUYẾT ĐỊNH (DATA & DECISION MAP)

## 1. Bản đồ Luồng Dữ liệu (Data Flow Map)

```
[Người dùng nhập điểm]
  - 6 môn chính: Toán, Lý, Hóa, Văn, Anh, Sinh
  - 5 môn thêm: Sử, Địa, GDKT&PL, Tin, Công nghệ
        │
        ▼
[Hồ Sơ: HoSo] (Persist trong localStorage `nvai:v2`)
        │
        ├─► [diemHienTaiCuaTungMon] (Ưu tiên điểm thi thử mới nhất)
        │         │
        │         ▼
        ├─► [Khám Phá: toHopXet & tongChoLuaChon]
        │     - Tự động map điểm vào 73 tổ hợp chính thức của Bộ GD&ĐT
        │     - Tính điểm phù hợp phi tuyến (/100) kết hợp:
        │         + Điểm chuẩn tham khảo 3 năm
        │         + Mức độ vừa túi tiền học phí
        │         + Khoảng cách địa lý / Khu vực
        │         + Tỷ lệ có việc làm sau tốt nghiệp
        │         │
        │         ▼
        ├─► [Nguyện Vọng: dungDanhSach]
        │     - Xếp 4 nhãn: Thử sức · Vừa sức · An toàn · Dự phòng
        │     - Audit rủi ro danh mục (xetCoCau & chamDiem)
        │         │
        │         ▼
        ├─► [Mục Tiêu: mucTieuDayDu]
        │     - Gap Analysis: Khoảng cách điểm = Điểm mục tiêu - Điểm hiện tại
        │     - Đếm ngược số ngày đến kỳ thi THPT
        │         │
        │         ▼
        ├─► [Môn Kéo Điểm: congSucMon]
        │     - Tính hệ số độ khó (dư địa hẹp dần khi điểm cao)
        │     - Tính hệ số xu hướng dốc (slope) qua các lần thi
        │     - Đề xuất phân bổ bù điểm tối ưu ROI
        │         │
        │         ▼
        └─► [Kế Hoạch & Tự Học: tao-viec-tuan & xepLichTuan]
              - Tự động sinh việc cần học tập trung vào môn kéo điểm
              - Xếp các khối tự học vào khung giờ trống tránh TietCoDinh
```

---

## 2. Tầng Ra Quyết Định (Decision Layer & Explainability)

Khác biệt cốt lõi giữa **Nguyện Vọng AI** và một website tra cứu thông thường:
Không dừng lại ở việc hiển thị dữ liệu thô, mỗi màn hình đều có cấu trúc:
**DATA ➔ INSIGHT ➔ DECISION ➔ NEXT-BEST-ACTION**.

| Màn hình | Data đầu vào | Insight rút ra | Quyết định hỗ trợ | Action 1-chạm kế tiếp |
|---|---|---|---|---|
| **Khám phá** | Điểm 11 môn + 2.529 ngành | Có bao nhiêu ngành đủ điểm, bao nhiêu ngành thử sức | Nhận biết các cơ hội xét tuyển khả thi | Thêm vào nguyện vọng hoặc Đặt mục tiêu |
| **Nguyện vọng** | Danh sách NV đã chọn | Danh mục đang quá mạo hiểm hay quá an toàn | Cân bằng danh mục với đủ 4 tầng phòng thủ | 1-Click "Sắp xếp lại theo mức chắc chắn" |
| **Mục tiêu** | Ngành mơ ước + Điểm hiện tại | Còn thiếu bao nhiêu điểm, môn nào là "điểm nghẽn" | Quyết định dồn sức vào môn nào trong 8 tuần tới | Mở "Môn kéo điểm" & "Lập kế hoạch tuần" |
| **Môn kéo điểm** | Điểm từng môn + Độ dốc | Tăng Toán từ 7 lên 8 dễ hơn tăng Anh từ 9 lên 10 | Tập trung vào môn có dư địa tăng điểm cao nhất | Áp dụng vào Kế hoạch học tuần |
| **Thử tình huống** | Giả lập +1.0 điểm Toán | Mở thêm 3 ngành mới tại TP.HCM trong ngân sách | Thấy rõ giá trị thực của từng 0.5 điểm nỗ lực | Xem chi tiết ngành mới mở |
| **Điểm thi thử** | Lịch sử các lần thi | Điểm môn Lý đang giảm, điểm Toán đang tăng | Điều chỉnh phân bổ thời gian ôn tập | Cập nhật thời khóa biểu tự học |
| **Kế hoạch tuần** | Lịch cứng + Việc cần học | Có bao nhiêu khoảng trống vàng để tự học | Sắp xếp lịch học cân đối không bị quá tải | Bấm giờ làm bài & Đánh dấu hoàn thành |

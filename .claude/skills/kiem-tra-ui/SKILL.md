---
name: kiem-tra-ui
description: Rà soát một màn hình ở 390px và 360px (tràn ngang, nút nhỏ, chữ bị cắt, luồng nút) bằng agent-browser. Dùng trước khi báo xong một màn.
---

Dùng `agent-browser` với phiên riêng (`export AGENT_BROWSER_SESSION=<ten>`), không mở/đóng liên tục, tối đa một ảnh chụp cuối.

1. `agent-browser set viewport 390 844`, mở `http://localhost:3030/#/<route>`. Nạp hồ sơ mẫu: mở `#/chao` rồi bấm "Xem thử bằng hồ sơ mẫu". Hồ sơ trống: `agent-browser eval "localStorage.clear()"` rồi tải lại.
2. Đo bằng `agent-browser eval`, không chụp lặp:
   - tràn ngang: `document.documentElement.scrollWidth > document.documentElement.clientWidth`
   - nút nhỏ: các `button,a` hiển thị có `height < 44` hoặc `width < 44` (bỏ qua link chữ trong đoạn văn)
   - chữ bị cắt: phần tử có `scrollWidth > clientWidth` trong nút/tiêu đề
   - màu chữ nút chính là trắng (không phải xanh đậm)
3. Lặp ở `set viewport 360 780`.
4. Bấm thử từng nút của màn, xác nhận `location.hash` đúng theo ma trận ở `docs/HUONG-DAN-SLICE.md`. `agent-browser errors` phải trống.
5. Tối đa một ảnh chụp cuối, đối chiếu ref `docs/ui-ref/`.
6. Cuối cùng chạy `npm run kiem-tra` và `npm test`.

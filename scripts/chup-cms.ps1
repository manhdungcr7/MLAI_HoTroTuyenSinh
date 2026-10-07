# Script chụp màn hình CMS siêu tốc cho cả Mobile và Desktop
$ErrorActionPreference = "Stop"

# Đóng session cũ để làm mới hoàn toàn
try { agent-browser close } catch {}

$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()

$screens = @(
  @{ name = "01_danh_sach_truong"; url = "http://localhost:3031/?gia-lap=1&v=$timestamp#/" },
  @{ name = "02_chi_tiet_truong_uit"; url = "http://localhost:3031/?gia-lap=1&v=$timestamp#/truong/QSC" },
  @{ name = "03_chi_tiet_truong_ftu"; url = "http://localhost:3031/?gia-lap=1&v=$timestamp#/truong/NTH" },
  @{ name = "04_duyet_cho_duyet"; url = "http://localhost:3031/?gia-lap=1&v=$timestamp#/duyet" },
  @{ name = "05_tong_quan_tien_do"; url = "http://localhost:3031/?gia-lap=1&v=$timestamp#/tien-do" },
  @{ name = "06_trang_toi_quan_tri"; url = "http://localhost:3031/?gia-lap=1&v=$timestamp#/toi" },
  @{ name = "07_quan_ly_nguoi_dung"; url = "http://localhost:3031/?gia-lap=1&v=$timestamp#/toi/nguoi" },
  @{ name = "08_phan_cong_truong"; url = "http://localhost:3031/?gia-lap=1&v=$timestamp#/toi/phan-cong" },
  @{ name = "09_nhat_ky_thao_tac"; url = "http://localhost:3031/?gia-lap=1&v=$timestamp#/toi/nhat-ky" }
)

Write-Host "=== 1. CHỤP GIAO DIỆN ĐIỆN THOẠI (Mobile 390x844) ===" -ForegroundColor Cyan
agent-browser set viewport 390 844

foreach ($s in $screens) {
  $file = "ktra/mobile_$($s.name).png"
  Write-Host "-> Chụp Mobile: $($s.name)..."
  agent-browser open $s.url
  agent-browser wait 1000
  agent-browser screenshot $file
}

# Chụp thêm tương tác Modal Thêm/Sửa trên Mobile
Write-Host "-> Chụp Mobile tương tác Form Sửa Học Phí..."
agent-browser open "http://localhost:3031/?gia-lap=1&v=$timestamp#/truong/QSC"
agent-browser wait 1000
try {
  agent-browser click "text=Sửa"
  agent-browser wait 500
  agent-browser screenshot "ktra/mobile_02b_form_sua_hoc_phi.png"
} catch {}

# Chụp tab Đã duyệt trong Phê duyệt
Write-Host "-> Chụp Mobile Tab Đã duyệt..."
agent-browser open "http://localhost:3031/?gia-lap=1&v=$timestamp#/duyet"
agent-browser wait 1000
try {
  agent-browser click "text=Đã duyệt"
  agent-browser wait 500
  agent-browser screenshot "ktra/mobile_04b_duyet_da_duyet.png"
} catch {}

Write-Host "`n=== 2. CHỤP GIAO DIỆN MÁY TÍNH (Desktop 1280x800) ===" -ForegroundColor Cyan
agent-browser set viewport 1280 800

foreach ($s in $screens) {
  $file = "ktra/desktop_$($s.name).png"
  Write-Host "-> Chụp Desktop: $($s.name)..."
  agent-browser open $s.url
  agent-browser wait 1000
  agent-browser screenshot $file
}

# Chụp Desktop Form Sửa
Write-Host "-> Chụp Desktop tương tác Form Sửa..."
agent-browser open "http://localhost:3031/?gia-lap=1&v=$timestamp#/truong/QSC"
agent-browser wait 1000
try {
  agent-browser click "text=Sửa"
  agent-browser wait 500
  agent-browser screenshot "ktra/desktop_02b_form_sua_hoc_phi.png"
} catch {}

# Chụp Desktop Tab Đã duyệt
Write-Host "-> Chụp Desktop Tab Đã duyệt..."
agent-browser open "http://localhost:3031/?gia-lap=1&v=$timestamp#/duyet"
agent-browser wait 1000
try {
  agent-browser click "text=Đã duyệt"
  agent-browser wait 500
  agent-browser screenshot "ktra/desktop_04b_duyet_da_duyet.png"
} catch {}

Write-Host "`n=== HOÀN TẤT CHỤP TOÀN BỘ MÀN HÌNH CMS ===" -ForegroundColor Green
Get-ChildItem ktra | Select-Object Name, Length, LastWriteTime


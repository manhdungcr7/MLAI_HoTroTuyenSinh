# Script chụp màn hình CMS siêu tốc cho cả Mobile và Desktop
$ErrorActionPreference = "Stop"

$screens = @(
  @{ name = "01_danh_sach_truong"; url = "http://localhost:3031/?gia-lap=1#/" },
  @{ name = "02_chi_tiet_truong_uit"; url = "http://localhost:3031/?gia-lap=1#/truong/QSC" },
  @{ name = "03_chi_tiet_truong_ftu"; url = "http://localhost:3031/?gia-lap=1#/truong/NTH" },
  @{ name = "04_duyet_noi_dung"; url = "http://localhost:3031/?gia-lap=1#/duyet" },
  @{ name = "05_tong_quan_tien_do"; url = "http://localhost:3031/?gia-lap=1#/tien-do" },
  @{ name = "06_trang_toi_quan_tri"; url = "http://localhost:3031/?gia-lap=1#/toi" },
  @{ name = "07_quan_ly_nguoi_dung"; url = "http://localhost:3031/?gia-lap=1#/toi/nguoi" },
  @{ name = "08_phan_cong_truong"; url = "http://localhost:3031/?gia-lap=1#/toi/phan-cong" },
  @{ name = "09_nhat_ky_thao_tac"; url = "http://localhost:3031/?gia-lap=1#/toi/nhat-ky" }
)

Write-Host "=== 1. CHỤP GIAO DIỆN ĐIỆN THOẠI (Mobile 390x844) ===" -ForegroundColor Cyan
agent-browser set viewport 390 844

foreach ($s in $screens) {
  $file = "ktra/mobile_$($s.name).png"
  Write-Host "-> Chup Mobile: $($s.name)..."
  agent-browser open $s.url
  agent-browser wait 600
  agent-browser screenshot $file
}

Write-Host "`n=== 2. CHỤP GIAO DIỆN MÁY TÍNH (Desktop 1280x800) ===" -ForegroundColor Cyan
agent-browser set viewport 1280 800

foreach ($s in $screens) {
  $file = "ktra/desktop_$($s.name).png"
  Write-Host "-> Chup Desktop: $($s.name)..."
  agent-browser open $s.url
  agent-browser wait 600
  agent-browser screenshot $file
}

Write-Host "`n=== HOÀN TẤT CHỤP TOÀN BỘ MÀN HÌNH CMS ===" -ForegroundColor Green
Get-ChildItem ktra | Select-Object Name, Length, LastWriteTime

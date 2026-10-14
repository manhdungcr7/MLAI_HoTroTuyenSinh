import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, '..', '.tmp', 'screenshots');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 4188;

const PAGES = [
  { name: "01_chao", url: `http://127.0.0.1:${PORT}/?seed=empty#/chao` },
  { name: "02_bat_dau_1", url: `http://127.0.0.1:${PORT}/?seed=empty#/bat-dau/1` },
  { name: "03_bat_dau_2", url: `http://127.0.0.1:${PORT}/?seed=empty#/bat-dau/2` },
  { name: "04_bat_dau_3", url: `http://127.0.0.1:${PORT}/?seed=empty#/bat-dau/3` },
  { name: "05_hom_nay", url: `http://127.0.0.1:${PORT}/?seed=mau#/` },
  { name: "06_kham_pha", url: `http://127.0.0.1:${PORT}/?seed=mau#/kham-pha` },
  { name: "07_bo_loc", url: `http://127.0.0.1:${PORT}/?seed=mau#/kham-pha/bo-loc` },
  { name: "08_chi_tiet", url: `http://127.0.0.1:${PORT}/?seed=mau#/kham-pha/qsc-060cb1c0` },
  { name: "09_so_sanh", url: `http://127.0.0.1:${PORT}/?seed=mau#/so-sanh` },
  { name: "10_nguyen_vong", url: `http://127.0.0.1:${PORT}/?seed=mau#/nguyen-vong` },
  { name: "11_nguyen_vong_an_toan", url: `http://127.0.0.1:${PORT}/?seed=mau#/nguyen-vong/an-toan` },
  { name: "12_thu_tinh_huong", url: `http://127.0.0.1:${PORT}/?seed=mau#/thu-tinh-huong` },
  { name: "13_diem_thi_thu", url: `http://127.0.0.1:${PORT}/?seed=mau#/diem-thi-thu` },
  { name: "14_ke_hoach_muc_tieu", url: `http://127.0.0.1:${PORT}/?seed=mau#/ke-hoach/muc-tieu` },
  { name: "15_mon_keo_diem", url: `http://127.0.0.1:${PORT}/?seed=mau#/ke-hoach/muc-tieu/mon-keo-diem` },
  { name: "16_ke_hoach_tuan_viec", url: `http://127.0.0.1:${PORT}/?seed=mau#/ke-hoach/tuan?xem=viec` },
  { name: "17_ke_hoach_tuan_lich", url: `http://127.0.0.1:${PORT}/?seed=mau#/ke-hoach/tuan?xem=lich` },
  { name: "18_ke_hoach_tien_do", url: `http://127.0.0.1:${PORT}/?seed=mau#/ke-hoach/tien-do` },
  { name: "19_cai_dat_lich_hoc", url: `http://127.0.0.1:${PORT}/?seed=mau#/ke-hoach/cai-dat/lich-hoc` },
  { name: "20_cai_dat_tu_hoc", url: `http://127.0.0.1:${PORT}/?seed=mau#/ke-hoach/cai-dat/tu-hoc` },
  { name: "21_cai_dat_nhac_nho", url: `http://127.0.0.1:${PORT}/?seed=mau#/ke-hoach/cai-dat/nhac-nho` },
  { name: "22_ho_so", url: `http://127.0.0.1:${PORT}/?seed=mau#/ho-so` },
  { name: "23_ho_so_cai_dat", url: `http://127.0.0.1:${PORT}/?seed=mau#/ho-so/cai-dat` },
  { name: "24_ho_so_chia_se", url: `http://127.0.0.1:${PORT}/?seed=mau#/ho-so/chia-se` },
  { name: "25_huong_nghiep", url: `http://127.0.0.1:${PORT}/?seed=mau#/huong-nghiep` },
  { name: "26_tu_van", url: `http://127.0.0.1:${PORT}/?seed=mau#/tu-van` },
  { name: "27_dong_gop", url: `http://127.0.0.1:${PORT}/?seed=mau#/dong-gop` },
  { name: "28_gioi_thieu", url: `http://127.0.0.1:${PORT}/?seed=mau#/gioi-thieu` },
];

for (const p of PAGES) {
  const outFile = path.join(OUT_DIR, `${p.name}.png`);
  process.stdout.write(`Capturing ${p.name}... `);
  try {
    const cmd = `cmd /c ""${CHROME}" --headless --disable-gpu --window-size=430,932 --screenshot="${outFile}" "${p.url}""`;
    execSync(cmd, { stdio: 'pipe', timeout: 8000 });
    console.log('OK');
  } catch (err) {
    console.log('ERR:', err.message);
  }
}

console.log('Done capturing all pages!');


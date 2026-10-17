// In MỌI con số dùng trong slide và tài liệu nộp bài, đo từ dữ liệu thật tại thời điểm chạy. Slide và tài liệu chỉ được dùng số do script này in ra.
// Chạy: npx tsx scripts/so-lieu-nop-bai.mts   (thêm --json để lấy dạng máy đọc)
import { LUA_CHON, napLuaChon } from "../src/data/lua-chon-that";
import { phanLoaiDuLieu } from "../src/engine/trang-thai-du-lieu";
import { thongKeBienDong } from "../src/engine/du-bao-diem-chuan";
import { napDuBaoML, metaDuBaoML } from "../src/data/du-bao-ml";
import { namTuyenSinhToi } from "../src/engine/du-bao-diem-chuan";
import hieuChinh from "../src/data/hieu-chinh-diem.json";
import chiTieu from "../src/data/chi-tieu.json";

await napLuaChon();
await napDuBaoML();
const tk = thongKeBienDong(LUA_CHON);
const nam = namTuyenSinhToi();
const dem: Record<string, number> = {};
const doTinCay: Record<string, number> = {};
let chamTran = 0;
for (const l of LUA_CHON) {
  const t = phanLoaiDuLieu(l, tk, nam);
  dem[t.loai] = (dem[t.loai] ?? 0) + 1;
  if (t.duBao) { doTinCay[t.duBao.doTinCay] = (doTinCay[t.duBao.doTinCay] ?? 0) + 1; if (t.duBao.chamTran) chamTran++; }
}
const nam2026 = LUA_CHON.filter((l) => l.diemTheoNam?.["2026"] !== undefined).length;
const meta = metaDuBaoML();
const so = {
  chuongTrinh: LUA_CHON.length,
  truong: new Set(LUA_CHON.map((l) => l.maTruong)).size,
  tinh: new Set(LUA_CHON.map((l) => l.khuVuc)).size,
  nhomNganh: new Set(LUA_CHON.map((l) => l.nhomNganh)).size,
  phuongThucTHPT: LUA_CHON.filter((l) => !l.phuongThuc || l.phuongThuc === "THPT").length,
  theoLoaiDuLieu: dem,
  nguonDeAnPDF: LUA_CHON.filter((l) => l.nguonCap === "official_pdf").length,
  nguonTrangTongHop: LUA_CHON.filter((l) => l.nguonCap === "aggregator_verified").length,
  dongDiem2026: nam2026,
  hocPhiHienThi: LUA_CHON.filter((l) => l.hocPhiMin !== undefined).length,
  hocPhiCoLinkNguon: LUA_CHON.filter((l) => l.hocPhiMin !== undefined && l.nguonHocPhi).length,
  tiLeViecLam: LUA_CHON.filter((l) => l.tiLeViecLam !== undefined).length,
  chiTieu: Object.keys(chiTieu as Record<string, unknown>).length,
  banSuaDiemCoBangChung: Object.values(hieuChinh as Record<string, Record<string, unknown>>).reduce((s, v) => s + Object.keys(v).length, 0),
  duBaoThongKe: { namDuBao: nam, theoDoTinCay: doTinCay, chamTran30: chamTran },
  duBaoML: meta ? { namDuBao: meta.namDuBao, moHinh: meta.moHinh, phuGop: meta.kiemDinh.phuGop, phuNgoaiMau: meta.kiemDinh.phuNgoaiMau, winkler: meta.kiemDinh.winkler, winklerHeuristicCu: meta.kiemDinh.winklerHeuristicCu } : "mô hình ML không áp dụng cho danh mục hiện tại (fingerprint lệch)",
};
if (process.argv.includes("--json")) console.log(JSON.stringify(so, null, 2));
else for (const [k, v] of Object.entries(so)) console.log(k.padEnd(22), typeof v === "object" ? JSON.stringify(v) : v);

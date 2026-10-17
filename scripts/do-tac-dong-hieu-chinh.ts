// Xuất ảnh chụp nhãn và phân loại để so trước/sau khi gộp bản sửa. Dùng: npx tsx scripts/do-tac-dong-hieu-chinh.ts <tep-ra.json>
import { writeFileSync } from "node:fs";
import { LUA_CHON, napLuaChon } from "../src/data/lua-chon-that";
import { nhanNguyenVong } from "../src/engine/phan-tich";
import { phanLoaiDuLieu } from "../src/engine/trang-thai-du-lieu";
await napLuaChon();
const ra: Record<string, unknown> = {};
for (const lc of LUA_CHON) {
  const p = phanLoaiDuLieu(lc);
  ra[lc.id] = { ma: lc.maTruong, nganh: lc.nganh, diemMin: lc.diemMin, namDiem: lc.namDiem, nhan: nhanNguyenVong(lc, 24), soNam: p.cacNam.length, loai: p.loai };
}
writeFileSync(process.argv[2], JSON.stringify(ra));

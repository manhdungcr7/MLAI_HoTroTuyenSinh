import "./nap-du-lieu";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { LUA_CHON_MAU, tim } from "../src/data/lua-chon-mau";
import { duBaoMLCua, metaDuBaoML, napDuBaoML } from "../src/data/du-bao-ml";
import { apDungDuBaoML } from "../src/engine/du-bao-ml-ap-dung";
import { phanLoaiDuLieu } from "../src/engine/trang-thai-du-lieu";
import { namTuyenSinhToi } from "../src/engine/du-bao-diem-chuan";
import { thongKeChung } from "../src/features/kham-pha/du-bao";

type TapDuBao = {
  meta: { namDuBao: number; catalogSha256?: string; kiemDinh: { phuGop: number } };
  ds: Record<string, [number, number, number, number]>;
};

const raw = JSON.parse(readFileSync("src/data/du-bao-2027.json", "utf8")) as TapDuBao;
const fingerprint = JSON.parse(readFileSync("src/data/du-lieu-fingerprint.json", "utf8")) as { sha256: string };
// Băm theo nội dung LF (Windows autocrlf có thể cho CRLF). Dấu vân tay = sha256(băm LF du-lieu-that.json + băm LF hieu-chinh-diem.json), trùng ml/thu-nghiem.py.
const bamLF = (tep: string) => createHash("sha256").update(Buffer.from(readFileSync(tep, "utf8").split(String.fromCharCode(13, 10)).join(String.fromCharCode(10)), "utf8")).digest("hex");
const hashThuc = createHash("sha256").update(bamLF("src/data/du-lieu-that.json") + bamLF("src/data/hieu-chinh-diem.json"), "utf8").digest("hex");
assert.equal(fingerprint.sha256, hashThuc, "fingerprint phải khớp danh mục điểm hiện hành (điểm gốc + bản ghi đè)");
assert.equal(raw.meta.namDuBao, 2027);
assert.ok(Object.keys(raw.ds).length > 2000, "tệp dự báo cũ vẫn đọc được để đối chiếu");
assert.ok(raw.meta.kiemDinh.phuGop > 0 && raw.meta.kiemDinh.phuGop <= 1);
for (const [id, [thap, giua, cao, nam]] of Object.entries(raw.ds)) {
  assert.ok(Number.isFinite(thap) && thap <= giua && giua <= cao && cao <= 30, id);
  assert.ok(nam >= 2024 && nam <= 2026, id);
}

const khopDuLieu = raw.meta.catalogSha256 === fingerprint.sha256;
const kho = await napDuBaoML();
assert.equal(kho !== null, khopDuLieu, "chỉ nạp dự báo được huấn luyện trên đúng dữ liệu hiện hành");
if (khopDuLieu) {
  // Mô hình đã học trên điểm SAU ghi đè: chương trình bị gỡ hết năm THPT hợp lệ (hoặc chỉ còn mức sàn 15,0) không được có dự báo.
  const hc = JSON.parse(readFileSync("src/data/hieu-chinh-diem.json", "utf8")) as Record<string, Record<string, { diem: number | null }>>;
  const tho = JSON.parse(readFileSync("src/data/du-lieu-that.json", "utf8")) as { id: string; pt: string; diem: Record<string, number> }[];
  let soGoHet = 0;
  for (const x of tho) {
    const h = hc[x.id];
    if (!h || x.pt !== "THPT") continue;
    const diem = { ...x.diem };
    for (const [nam, m] of Object.entries(h)) { if (!(nam in diem)) continue; if (m.diem === null) delete diem[nam]; else diem[nam] = m.diem; }
    if (Object.values(diem).every((d) => Math.abs(d - 15) < 1e-9)) {
      soGoHet++;
      assert.equal(x.id in raw.ds, false, `chương trình không còn điểm hợp lệ không có dự báo: ${x.id}`);
      assert.equal(duBaoMLCua(x.id), null, x.id);
    }
  }
  console.log(`du-bao-ml: ${soGoHet} chương trình bị gỡ hết năm hợp lệ, không có dự báo`);
}
if (!khopDuLieu) {
  assert.equal(metaDuBaoML(), null, "không công bố độ phủ của mô hình cũ");
  assert.equal(duBaoMLCua(Object.keys(raw.ds)[0]), null, "không cấp dự báo sai lệch cho màn hình");
  for (const lc of LUA_CHON_MAU.slice(0, 100)) {
    const trangThai = phanLoaiDuLieu(lc, thongKeChung(), namTuyenSinhToi());
    assert.equal(apDungDuBaoML(trangThai, lc.id), trangThai, "giữ dự báo thống kê hiện hành");
  }
} else {
  for (const id of Object.keys(raw.ds)) {
    const lc = tim(id);
    if (lc) {
      // so với điểm của đúng năm cơ sở (năm mới nhất có thể là mức sàn 15,0 đã bị loại khỏi huấn luyện)
      const coSo = lc.diemTheoNam?.[String(raw.ds[id][3])] ?? lc.diemMin;
      assert.ok(Math.abs(raw.ds[id][1] - coSo) <= 6, `dự báo lệch quá xa dữ liệu cơ sở: ${id}`);
    }
  }
}

console.log(`du-bao-ml: ${khopDuLieu ? "đúng phiên bản dữ liệu" : "đã chặn mô hình cũ"}`);

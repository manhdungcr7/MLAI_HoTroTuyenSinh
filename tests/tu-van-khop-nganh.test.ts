import "./nap-du-lieu";
// Khớp ngành/trường không đoán. Chạy: npx tsx tests/tu-van-khop-nganh.test.ts
import assert from "node:assert/strict";
import { LUA_CHON_MAU } from "../src/data/lua-chon-mau";
import { timNganhKhop, dungSuKien } from "../src/features/tu-van/lay-du-lieu";
import { tenTruongChuaCo } from "../src/features/tu-van/hieu-cau";
import { gonSuKien } from "../src/engine/tu-van";
import { diemDayDu } from "../src/features/kham-pha/to-hop";
import { taoHoSoMau } from "../src/state/mau";

const k = (q: string) => timNganhKhop(q, 5, LUA_CHON_MAU);
assert.equal(k("Phi hành gia").length, 0, "Phi hành gia không được khớp ngành gần giống");
assert.ok(tenTruongChuaCo("Công nghệ thông tin UEH"), "UEH chưa có trong dữ liệu phải báo chưa có");
assert.equal(k("Công nghệ thông tin UEH").length, 0);
const h = k("CNTT HUTECH");
assert.ok(h.length > 0 && h.every((l) => l.maTruong === "DKC" && /công nghệ thông tin/i.test(l.nganh)) , "CNTT HUTECH: chỉ ngành CNTT của HUTECH");
assert.equal(tenTruongChuaCo("ĐH Bạc Liêu có ngành gì"), null);
assert.ok(k("ĐH Bạc Liêu có ngành gì").every((l) => l.maTruong === "DBL") && k("ĐH Bạc Liêu có ngành gì").length > 0);
assert.ok(k("KTPM").some((l) => /kỹ thuật phần mềm/i.test(l.nganh)));
// Nguồn học phí: dữ liệu thật đều từ VnExpress, không được gán nhãn đề án.
const lc = LUA_CHON_MAU.find((l) => l.nguonHocPhi?.thuCap)!;
const sk = dungSuKien(lc, diemDayDu(taoHoSoMau()), null);
assert.equal(sk.hocPhiNguon, "thuCap");
assert.match(String(gonSuKien(sk).hpNguon), /VnExpress/);
console.log("tu-van-khop-nganh: OK");

import "./nap-du-lieu";
import assert from "node:assert/strict";
import { LUA_CHON_MAU } from "../src/data/lua-chon-mau";
import { phanGiaiTenTruong, tachNganhVaBienThe, toAcademicDisplay } from "../src/engine/trinh-bay-hoc-thuat";

const qsc = phanGiaiTenTruong("QSC", "Tên cũ không khớp danh mục");
assert.equal(qsc.daXacMinh, true);
assert.equal(qsc.tenHienThi, "ĐH Công nghệ Thông tin - ĐHQG TP.HCM");
assert.notEqual(qsc.tenHienThi, "QSC");

const khongRo = phanGiaiTenTruong("ZZZ", "");
assert.equal(khongRo.daXacMinh, false);
assert.equal(khongRo.tenHienThi, "Tên trường chưa xác minh");

const chuaXacMinh = phanGiaiTenTruong("ZZZ", "Một trường có tên nhưng chưa có trong catalog");
assert.equal(chuaXacMinh.daXacMinh, false);
assert.equal(chuaXacMinh.tenChinhThuc, "Tên trường chưa xác minh");

const bienThe = tachNganhVaBienThe("Công nghệ thông tin (Chương trình chất lượng cao Công nghệ thông tin Việt - Anh)");
assert.equal(bienThe.core, "Công nghệ thông tin");
assert.equal(bienThe.variant, "Chương trình Việt – Anh");

const lc = LUA_CHON_MAU[0];
assert.ok(lc, "catalog admissions data was loaded");
const hienThi = toAcademicDisplay({ ...lc, namDiem: 0 });
assert.ok(hienThi);
assert.equal(hienThi.admissionYear, null, "missing year must remain missing");
assert.equal(hienThi.universityNameOfficial, phanGiaiTenTruong(lc.maTruong || lc.truong, lc.tenTruong).tenChinhThuc);

console.log("trinh-bay-hoc-thuat: PASS");

import assert from "node:assert/strict";
import { TRANG_THAI_BAN_DAU } from "../src/state/mau";
import { GIAI_DOAN_DA_TOT_NGHIEP, changCuaEm, coDemNguoc, nhanLop } from "../src/state/chang";

const voi = (khoi: 11 | 12 | null, giaiDoan: string) => ({ hoSo: { ...TRANG_THAI_BAN_DAU.hoSo, khoi, giaiDoan } });

assert.equal(changCuaEm(voi(11, "Đang học lớp 11")), "dinhHuong");
assert.equal(changCuaEm(voi(null, "")), "dinhHuong", "chưa chọn lớp thì định hướng");
assert.equal(changCuaEm(voi(12, "Ôn thi THPT")), "nuocRut");
assert.equal(changCuaEm(voi(12, "")), "nuocRut");
assert.equal(changCuaEm(voi(12, GIAI_DOAN_DA_TOT_NGHIEP)), "thiLai", "đã tốt nghiệp thắng cả khi khối = 12");
assert.equal(changCuaEm(voi(11, GIAI_DOAN_DA_TOT_NGHIEP)), "thiLai");

assert.equal(nhanLop({ khoi: 12, giaiDoan: "" }), "Lớp 12");
assert.equal(nhanLop({ khoi: 11, giaiDoan: "" }), "Lớp 10 – 11");
assert.equal(nhanLop({ khoi: 12, giaiDoan: GIAI_DOAN_DA_TOT_NGHIEP }), "Đã tốt nghiệp, thi lại");

assert.equal(coDemNguoc("dinhHuong"), false);
assert.equal(coDemNguoc("nuocRut"), true);
assert.equal(coDemNguoc("thiLai"), true);

console.log("chang: tất cả kiểm tra đều qua");


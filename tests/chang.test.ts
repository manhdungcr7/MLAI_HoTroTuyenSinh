import assert from "node:assert/strict";
import { TRANG_THAI_BAN_DAU } from "../src/state/mau";
import { GIAI_DOAN_DA_TOT_NGHIEP, changCuaEm, coDemNguoc } from "../src/state/chang";
import { GIAI_DOAN } from "../src/features/khoi-dau/lua-chon";

const voi = (khoi: 11 | 12 | null, giaiDoan: string) => ({ hoSo: { ...TRANG_THAI_BAN_DAU.hoSo, khoi, giaiDoan } });

assert.equal(changCuaEm(voi(11, "Đang học lớp 11")), "dinhHuong");
assert.equal(changCuaEm(voi(null, "")), "dinhHuong", "chưa chọn lớp thì định hướng");
assert.equal(changCuaEm(voi(12, "Ôn thi THPT")), "nuocRut");
assert.equal(changCuaEm(voi(12, "")), "nuocRut");
assert.equal(changCuaEm(voi(12, GIAI_DOAN_DA_TOT_NGHIEP)), "thiLai", "đã tốt nghiệp thắng cả khi khối = 12");
assert.equal(changCuaEm(voi(11, GIAI_DOAN_DA_TOT_NGHIEP)), "thiLai");

assert.ok(GIAI_DOAN.includes(GIAI_DOAN_DA_TOT_NGHIEP), "hằng phải khớp danh sách chọn ở khoi-dau");
assert.equal(coDemNguoc("dinhHuong"), false);
assert.equal(coDemNguoc("nuocRut"), true);
assert.equal(coDemNguoc("thiLai"), true);

console.log("chang: tất cả kiểm tra đều qua");

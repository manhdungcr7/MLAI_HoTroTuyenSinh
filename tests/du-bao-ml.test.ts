import "./nap-du-lieu"; // danh mục gốc nạp lười: phải xong trước các import còn lại
// Kiểm thử dữ liệu dự báo điểm chuẩn 2027 của mô hình học máy: toàn vẹn, hợp lý về miền giá trị, khớp danh mục, khớp báo cáo huấn luyện.
// Chạy: npx tsx tests/du-bao-ml.test.ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { LUA_CHON_MAU, tim } from "../src/data/lua-chon-mau";
import { duBaoMLCua, metaDuBaoML, napDuBaoML } from "../src/data/du-bao-ml";
import { apDungDuBaoML } from "../src/engine/du-bao-ml-ap-dung";
import { phanLoaiDuLieu } from "../src/engine/trang-thai-du-lieu";
import { namTuyenSinhToi } from "../src/engine/du-bao-diem-chuan";
import { thongKeChung } from "../src/features/kham-pha/du-bao";

const kho = await napDuBaoML();
assert.ok(kho, "nạp được tệp dự báo");
const meta = metaDuBaoML()!;
assert.equal(meta.namDuBao, 2027);
assert.equal(meta.mucTinCay, 0.8);
assert.ok(meta.moHinh.includes("LightGBM"));
assert.ok(meta.heSoHieuChinh > 1 && meta.heSoHieuChinh < 4, "hệ số hiệu chỉnh trong khoảng hợp lý");

const ids = Object.keys(kho!.ds);
assert.ok(ids.length > 2000, `đủ độ phủ chương trình: ${ids.length}`);

let khongTrongDanhMuc = 0;
for (const id of ids) {
  const [thap, giua, cao, namCoSo] = kho!.ds[id] as [number, number, number, number];
  assert.ok(Number.isFinite(thap) && Number.isFinite(giua) && Number.isFinite(cao), id);
  assert.ok(thap >= 10 && cao <= 30, `trong thang điểm: ${id} ${thap}-${cao}`);
  assert.ok(thap <= giua && giua <= cao, `thứ tự thấp ≤ giữa ≤ cao: ${id}`);
  assert.ok(cao - thap <= 12, `khoảng không phi thực tế: ${id} rộng ${(cao - thap).toFixed(1)}`);
  assert.ok(namCoSo >= 2024 && namCoSo <= 2026, `năm cơ sở: ${id}`);
  const lc = tim(id);
  if (!lc) { khongTrongDanhMuc++; continue; }
  // Mức giữa dự đoán không lệch quá xa điểm năm gần nhất của chính chương trình đó
  assert.ok(Math.abs(giua - lc.diemMin) <= 6, `mức giữa gần điểm gần nhất: ${id} ${giua} vs ${lc.diemMin}`);
}
assert.ok(khongTrongDanhMuc / ids.length < 0.05, `hầu hết id có trong danh mục: ${khongTrongDanhMuc} lạ`);

// Ràng buộc điểm sàn: ngành đang ở từ 15 trở lên không có cận dưới thấp hơn 15
for (const id of ids) {
  const lc = tim(id);
  if (lc && lc.diemMin >= 15) assert.ok(kho!.ds[id][0] >= 15 - 1e-9, `cận dưới không thấp hơn điểm sàn: ${id} ${kho!.ds[id][0]}`);
}

// Truy cập qua hàm và qua id không có
const mot = tim(ids[0]);
assert.ok(mot && duBaoMLCua(ids[0]), "tra được theo id");
assert.equal(duBaoMLCua("khong-co-id-nay"), null);

// Khớp báo cáo huấn luyện: số chương trình và kiểm định ghi trong meta là của lần chạy đã xuất tệp này
const bc = JSON.parse(readFileSync("ml/ket-qua-du-bao-2027.json", "utf8")) as { du_bao_2027: { so_chuong_trinh: number }; kiem_dinh: { khoang: { gop: { phu: number; winkler: number } } } };
assert.equal(bc.du_bao_2027.so_chuong_trinh, ids.length, "số chương trình khớp báo cáo");
assert.ok(Math.abs(bc.kiem_dinh.khoang.gop.phu - meta.kiemDinh.phuGop) < 0.005, "độ phủ gộp khớp báo cáo");
assert.ok(Math.abs(bc.kiem_dinh.khoang.gop.winkler - meta.kiemDinh.winkler) < 0.01, "Winkler khớp báo cáo");
// Mô hình phải tốt hơn cách cũ ở cùng độ phủ 80% (kết luận dùng trong pitch, không được tự ý sửa số)
assert.ok(meta.kiemDinh.winkler < meta.kiemDinh.winklerHeuristicCu, "Winkler của mô hình thấp hơn heuristic cũ");

// Quy tắc dữ liệu của ứng dụng: chương trình chỉ có mức sàn 15 không bao giờ có dự báo (không có điểm chuẩn để dự báo từ đó)
let soChiSan = 0;
for (const lc of LUA_CHON_MAU) {
  const tt = phanLoaiDuLieu(lc, thongKeChung(), 2027);
  if (tt.loai === "chiDiemSan") { soChiSan++; assert.equal(duBaoMLCua(lc.id), null, `ngành chỉ có điểm sàn không có dự báo ML: ${lc.id}`); }
}
assert.ok(soChiSan > 300, `có nhiều ngành chỉ có mức sàn: ${soChiSan}`);

// apDungDuBaoML: chỉ thay khoảng khi cùng năm đích và năm cơ sở; không thì giữ nguyên trạng thái
let daAp = 0, giuNguyen = 0;
for (const lc of LUA_CHON_MAU.slice(0, 1500)) {
  const tt = phanLoaiDuLieu(lc, thongKeChung(), namTuyenSinhToi());
  const sau = apDungDuBaoML(tt, lc.id);
  if (tt.duBao && sau.duBao && sau.duBao.moHinh === "hoc-may") {
    daAp++;
    const ml = duBaoMLCua(lc.id)!;
    assert.deepEqual([sau.duBao.thap, sau.duBao.kyVong, sau.duBao.cao], [ml.thap, ml.giua, ml.cao], "khoảng lấy từ mô hình học máy");
    assert.equal(sau.duBao.namCuoi, ml.namCoSo, "cùng năm cơ sở");
  } else { giuNguyen++; assert.equal(sau, tt, "không áp thì giữ nguyên trạng thái"); }
}
assert.ok(daAp > 100 && giuNguyen > 100, `áp ${daAp}, giữ nguyên ${giuNguyen}`);

console.log(`du-bao-ml: tất cả kiểm tra đều qua (${ids.length} chương trình, ${LUA_CHON_MAU.length} trong danh mục)`);

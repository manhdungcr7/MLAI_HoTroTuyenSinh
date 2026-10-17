import "./nap-du-lieu"; // danh mục gốc nạp lười: phải xong trước các import còn lại
// Hợp đồng dữ liệu dùng chung: trạng thái A-H của điểm chuẩn, điểm sàn không bao giờ là điểm chuẩn, một nguồn `tomTatDiemChoNganh`,
// AI nhận cùng trạng thái, điểm theo loại và migration lành tính. Chạy: npx tsx tests/trang-thai-du-lieu.test.ts
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { LUA_CHON } from "../src/data/lua-chon-that";
import { duBaoDiemChuan, namTuyenSinhToi, thongKeBienDong } from "../src/engine/du-bao-diem-chuan";
import { lyDoKhacPhuongThuc, nhanChoLuaChon } from "../src/engine/phan-tich";
import { tomTatDiemChoNganh } from "../src/engine/tom-tat-nganh";
import { KHONG_CO_DIEM_CHUAN, gonSuKien, kiemTraYeuCau, NHAC_HE_THONG } from "../src/engine/tu-van";
import { cacDiemHopLe, cungChuongTrinh, diemChuanDeSo, lyDoKhongSoDuoc, phanLoaiDuLieu, raSoatMaChuongTrinh } from "../src/engine/trang-thai-du-lieu";
import { XAC_SUAT_DA_HIEU_CHINH } from "../src/engine/xac-suat-trung-tuyen";
import { dungSuKien, traLoiTuDong } from "../src/features/tu-van/lay-du-lieu";
import { dungDanhSach } from "../src/features/nguyen-vong/tinh-toan";
import { coTheDatMucTieu } from "../src/state/chon";
import { chuanHoa } from "../src/state/chuan-hoa";
import { diemHienTaiCuaTungMon, diemTheoLoai } from "../src/state/diem-hien-tai";
import { docBanSaoLuu, taoBanSaoLuu } from "../src/state/sao-luu";
import { taoHoSoMau } from "../src/state/mau";
import type { DiemDayDu, LuaChon } from "../src/state/types";

const tk = thongKeBienDong(LUA_CHON);
const NAM = 2027;
const goc = LUA_CHON.find((l) => l.phuongThuc === "THPT")!;
const fake = (o: Partial<LuaChon>): LuaChon => {
  const diemTheoNam = o.diemTheoNam ?? {};
  const nam = Object.keys(diemTheoNam).sort();
  const cuoi = nam.length ? Number(nam[nam.length - 1]) : 0;
  return { ...goc, id: "fake", maTruong: "FAK", truong: "FAK", phuongThuc: "THPT", toHopXet: ["A00"], nguonCap: "official_pdf", diemMin: cuoi ? diemTheoNam[String(cuoi)] : 0, diemMax: cuoi ? diemTheoNam[String(cuoi)] : 0, namDiem: cuoi, ...o, diemTheoNam };
};
const diemEm = (o: Partial<DiemDayDu> = {}): DiemDayDu => ({ toan: 9, vatLy: 9, hoaHoc: 9, sinh: null, nguVan: null, tiengAnh: null, lichSu: null, diaLy: null, gdktpl: null, tinHoc: null, congNghe: null, ...o });

// ---- A: nhiều năm ----
{
  const t = phanLoaiDuLieu(fake({ diemTheoNam: { "2025": 25, "2026": 26 } }), tk, NAM);
  assert.equal(t.loai, "nhieuNam"); assert.deepEqual(t.cacNam, [2025, 2026]);
  assert.equal(t.diemCuoi, 26); assert.equal(t.namCuoi, 2026); assert.equal(t.duocDuBao, true); assert.ok(t.duBao);
  assert.equal(t.loiThoi, false); assert.equal(t.duBaoCu, false); assert.equal(t.daCoDiemNamDuBao, false);
}
// ---- B: một năm ----
{
  const t = phanLoaiDuLieu(fake({ diemTheoNam: { "2025": 24.5 } }), tk, NAM);
  assert.equal(t.loai, "motNam"); assert.equal(t.diemCuoi, 24.5); assert.equal(lyDoKhongSoDuoc(fake({ diemTheoNam: { "2025": 24.5 } })), null);
}
// ---- C: chỉ điểm sàn 15,0 (một hay nhiều năm) ----
{
  const l = fake({ diemTheoNam: { "2023": 15, "2024": 15, "2025": 15 } });
  const t = phanLoaiDuLieu(l, tk, NAM);
  assert.equal(t.loai, "chiDiemSan"); assert.equal(t.diemCuoi, null); assert.equal(t.duocDuBao, false); assert.equal(diemChuanDeSo(l), null);
  assert.deepEqual(t.cacNamSan, [2023, 2024, 2025]);
  assert.match(lyDoKhongSoDuoc(l)!, /điểm sàn/i);
  // Mọi cửa so điểm đều từ chối: nhãn, mục tiêu, tóm tắt, tư vấn AI, danh sách nguyện vọng.
  assert.ok(lyDoKhacPhuongThuc(l));
  assert.equal(nhanChoLuaChon(l, 29), null, "điểm sàn không bao giờ cho nhãn, dù em 29 điểm");
  const ts = tomTatDiemChoNganh(l, diemEm(), tk, NAM);
  assert.equal(ts.soSanhDuoc, false); assert.equal(ts.nhan, null); assert.equal(ts.diemChuan, null); assert.equal(ts.chenh, null); assert.equal(ts.duBao, null);
  assert.ok(!/15/.test(ts.moTa) || /sàn/.test(ts.moTa));
  const mt = coTheDatMucTieu(l); assert.equal(mt.ok, false);
  const [dong] = dungDanhSach([l.id], diemEm(), (id) => (id === l.id ? l : undefined));
  assert.equal(dong.nhan, null); assert.equal(dong.chenh, null); assert.ok(dong.lyDoKhongNhan);
  const sk = dungSuKien(l, diemEm(), null);
  assert.equal(sk.loaiDuLieu, "chiDiemSan"); assert.deepEqual(sk.diem, {}); assert.equal(sk.nhanCuaEm, undefined); assert.equal(sk.chenh, undefined);
}
// Có cả năm sàn lẫn năm điểm chuẩn thật: năm sàn bị loại khỏi lịch sử, điểm chuẩn gần nhất là năm thật
{
  const l = fake({ diemTheoNam: { "2023": 15, "2024": 24, "2025": 15 } });
  const t = phanLoaiDuLieu(l, tk, NAM);
  assert.equal(t.loai, "motNam"); assert.equal(t.diemCuoi, 24); assert.equal(t.namCuoi, 2024); assert.deepEqual(t.cacNamSan, [2023, 2025]);
  assert.deepEqual(cacDiemHopLe(l), [[2024, 24]]);
  assert.equal(duBaoDiemChuan(l, tk, 2026)!.diemCuoi, 24, "dự báo cũng không lấy điểm sàn làm điểm cuối");
}
// 15,0 ở chương trình KHÔNG phải THPT cũng không bị coi là điểm chuẩn THPT (thuộc phương thức khác)
assert.equal(phanLoaiDuLieu(fake({ phuongThuc: "HOC_BA", diemTheoNam: { "2025": 15 } })).loai, "phuongThucKhac");
// Điểm sàn không làm sai thống kê biến động: cặp 15 -> 24 không tạo "+9"
assert.deepEqual(thongKeBienDong([fake({ diemTheoNam: { "2023": 15, "2024": 24 } })]).tatCa, []);

// ---- D: không có điểm hợp lệ ----
for (const dt of [{}, { "2025": 0 }, { "2025": 5 }, { "2025": 99 }, { "2025": Number.NaN }]) {
  const l = fake({ diemTheoNam: dt as Record<string, number>, diemMin: 0, namDiem: 0 });
  const t = phanLoaiDuLieu(l, tk, NAM);
  assert.equal(t.loai, "khongDu", JSON.stringify(dt)); assert.equal(t.diemCuoi, null);
  assert.equal(nhanChoLuaChon(l, 25), null, "thiếu điểm chuẩn: không điền 0 để ra nhãn Dự phòng");
  assert.match(lyDoKhongSoDuoc(l)!, /chưa có điểm chuẩn hợp lệ/);
}
// ---- E: chương trình mới chỉ khi dữ liệu nói rõ; không đoán từ việc thiếu điểm ----
assert.equal(phanLoaiDuLieu(fake({ diemTheoNam: {} }), tk, NAM).chuongTrinhMoi, undefined, "thiếu điểm thôi chưa đủ để gọi là mới");
assert.equal(phanLoaiDuLieu(fake({ diemTheoNam: {}, namBatDauTuyenSinh: 2027 }), tk, NAM).chuongTrinhMoi, true);
assert.equal(phanLoaiDuLieu(fake({ diemTheoNam: {}, namBatDauTuyenSinh: 2020 }), tk, NAM).chuongTrinhMoi, undefined, "mở từ lâu mà thiếu điểm: không phải chương trình mới");
// ---- F: phương thức khác ----
for (const pt of ["HOC_BA", "DGNL_HCM", "DGNL_HN", "DGTD", "NANG_KHIEU", "KET_HOP"]) {
  const l = fake({ phuongThuc: pt, diemTheoNam: { "2024": 20, "2025": 22 } });
  const t = phanLoaiDuLieu(l, tk, NAM);
  assert.equal(t.loai, "phuongThucKhac"); assert.equal(t.diemCuoi, null); assert.equal(t.duocDuBao, false);
  assert.equal(nhanChoLuaChon(l, 25), null);
  assert.equal(tomTatDiemChoNganh(l, diemEm(), tk, NAM).tongEm, null, "không tính tổng điểm THPT cho ngành xét phương thức khác");
}
// ---- G: đổi mã ----
{
  const l = fake({ diemTheoNam: { "2023": 20, "2024": 25, "2025": 26 }, maTheoNam: { "2023": { maNganh: "7480201" }, "2024": { maNganh: "7480201" }, "2025": { maNganh: "7480101" } } });
  const t = phanLoaiDuLieu(l, tk, NAM);
  assert.equal(t.doiMa, true); assert.deepEqual(t.cacNamBoQuaDoiMa, [2023, 2024]); assert.deepEqual(t.cacNam, [2025]);
  assert.equal(t.loai, "motNam"); assert.equal(t.diemCuoi, 26); assert.equal(t.duBao, null, "lịch sử khác mã: không dự báo");
  const khongDoi = phanLoaiDuLieu(fake({ diemTheoNam: { "2024": 25, "2025": 26 }, maTheoNam: { "2024": { maNganh: "A" }, "2025": { maNganh: "A" } } }), tk, NAM);
  assert.equal(khongDoi.doiMa, undefined); assert.equal(khongDoi.loai, "nhieuNam");
  assert.equal(phanLoaiDuLieu(fake({ diemTheoNam: { "2024": 25, "2025": 26 } }), tk, NAM).doiMa, undefined, "không có mã từng năm thì không suy đoán");
  assert.equal(cungChuongTrinh({ id: "a" }, { id: "a" }), true); assert.equal(cungChuongTrinh({ id: "a" }, { id: "b" }), false);
  const r = raSoatMaChuongTrinh([fake({ id: "1", truong: "X", maTruong: "AAA", nganh: "N" }), fake({ id: "2", truong: "X", maTruong: "BBB", nganh: "N" }), fake({ id: "3", truong: "Y", maTruong: "AAA", nganh: "N" }), fake({ id: "4", truong: "Y", maTruong: "AAA", nganh: "N" })]);
  assert.deepEqual(r.cungTenKhacMaTruong, ["X"]); assert.deepEqual(r.cungMaKhacTenTruong, ["AAA"]); assert.deepEqual(r.trungTenKhacId, ["AAA|N|THPT"]);
  // Dữ liệu thật: hiện không có trường nào đổi mã giữa các dòng; lịch sử luôn giữ theo id.
  const that = raSoatMaChuongTrinh(LUA_CHON);
  assert.deepEqual(that.cungTenKhacMaTruong, []); assert.deepEqual(that.cungMaKhacTenTruong, []);
}
// ---- H: dự báo cũ / quá xa / đã có điểm ----
{
  const cu = phanLoaiDuLieu(fake({ diemTheoNam: { "2024": 25, "2025": 26 } }), tk, 2027); // cách 2 năm
  assert.equal(cu.loiThoi, true); assert.equal(cu.duBaoCu, true); assert.ok(cu.duBao);
  const xa = phanLoaiDuLieu(fake({ diemTheoNam: { "2023": 25 } }), tk, 2027); // cách 4 năm
  assert.equal(xa.duBaoQuaXa, true); assert.equal(xa.duocDuBao, false); assert.equal(xa.loiThoi, true);
  const da = phanLoaiDuLieu(fake({ diemTheoNam: { "2026": 25 } }), tk, 2026);
  assert.equal(da.daCoDiemNamDuBao, true); assert.equal(da.duocDuBao, false);
}

// ---- Phân bố trên dữ liệu thật + bất biến: không chương trình nào "đủ để so" mà điểm là sàn / phương thức khác ----
{
  const dem: Record<string, number> = {};
  for (const l of LUA_CHON) {
    const t = phanLoaiDuLieu(l, tk, NAM);
    dem[t.loai] = (dem[t.loai] ?? 0) + 1;
    const lyDo = lyDoKhongSoDuoc(l);
    if (t.loai === "nhieuNam" || t.loai === "motNam") {
      assert.equal(lyDo, null); assert.ok(t.diemCuoi !== null && t.diemCuoi !== 15 && t.diemCuoi >= 10, l.id);
      assert.equal(l.phuongThuc, "THPT", l.id); assert.equal(l.diemMin, t.diemCuoi, `diemMin phải bằng điểm chuẩn gần nhất hợp lệ: ${l.id}`);
      assert.equal(l.namDiem, t.namCuoi, l.id);
    } else assert.ok(lyDo, l.id);
  }
  assert.equal(Object.values(dem).reduce((a, b) => a + b, 0), LUA_CHON.length);
  console.log("phân bố LoaiDuLieu (dữ liệu thật):", JSON.stringify(dem), "tổng", LUA_CHON.length);
  assert.ok(dem.chiDiemSan > 0 && dem.nhieuNam > 0, "dữ liệu thật phải có cả hai nhóm để bài kiểm này có nghĩa");
}

// ---- tomTatDiemChoNganh: một nguồn ----
{
  const l = fake({ diemTheoNam: { "2025": 25, "2026": 26 } });
  const ts = tomTatDiemChoNganh(l, diemEm({ toan: 9, vatLy: 9, hoaHoc: 9 }), tk, NAM);
  assert.equal(ts.soSanhDuoc, true); assert.equal(ts.tongEm, 27); assert.equal(ts.toHopEm, "A00");
  assert.deepEqual(ts.diemChuan, { diem: 26, nam: 2026, nguonThuCap: false, laThamChieu: false });
  assert.equal(ts.chenh, 1); assert.equal(ts.nhan, "Vừa sức"); assert.ok(ts.duBao); assert.ok(ts.viTriDuBao);
  assert.match(ts.moTa, /cao hơn 1,0 điểm so với điểm chuẩn năm 2026/); assert.match(ts.moTa, /Dự báo tham khảo 2027/);
  assert.ok(!/%|xác suất|chắc chắn|đảm bảo/.test(ts.moTa), ts.moTa);
  assert.equal(nhanChoLuaChon(l, ts.tongEm!), ts.nhan, "nhãn của tóm tắt trùng nhãn của các màn khác");
  // thiếu điểm môn: không điền 0
  const thieu = tomTatDiemChoNganh(l, diemEm({ hoaHoc: null }), tk, NAM);
  assert.equal(thieu.tongEm, null); assert.equal(thieu.nhan, null); assert.equal(thieu.chenh, null); assert.ok(thieu.lyDoThieuDiemEm); assert.ok(thieu.diemChuan, "điểm chuẩn vẫn hiện để em tham khảo");
  // chỉ có điểm của năm tham chiếu từ trang tổng hợp
  const tc = tomTatDiemChoNganh(fake({ diemTheoNam: { "2026": 25 }, nguonCap: "aggregator_verified" }), diemEm(), tk, NAM);
  assert.equal(tc.diemChuan!.nguonThuCap, true); assert.match(tc.moTa, /từ trang tổng hợp/); assert.match(tc.moTa, /mới có một năm/);
}

// ---- Không màn nào / máy chủ nào lộ xác suất chưa hiệu chỉnh ----
{
  assert.equal(XAC_SUAT_DA_HIEU_CHINH, false);
  const quet = (dir: string, ra: string[] = []): string[] => {
    for (const f of readdirSync(dir)) { const p = join(dir, f); if (statSync(p).isDirectory()) quet(p, ra); else if (/\.(ts|tsx)$/.test(f)) ra.push(p); }
    return ra;
  };
  const goiHam = quet("src").concat(quet("functions")).filter((p) => !/xac-suat-trung-tuyen\.ts$/.test(p)).filter((p) => /tinhXacSuatTrungTuyen/.test(readFileSync(p, "utf8")));
  assert.deepEqual(goiHam.map((p) => p.replace(/\\/g, "/")), ["src/engine/toi-uu-nguyen-vong.ts"], "chỉ engine nội bộ (thuộc tính ẩn) được gọi; giao diện và máy chủ không");
  const dsFeatures = quet("src/features").concat(quet("functions"));
  for (const p of dsFeatures) assert.ok(!/\.xacSuat\b|\.phanTram\b.*xacSuat|xacSuatDoItNhatMotNV/.test(readFileSync(p, "utf8")), `lộ xác suất ở ${p}`);
}

// ---- Tư vấn AI: cùng trạng thái, máy chủ chặn số điểm sàn ----
{
  const l = fake({ diemTheoNam: { "2023": 15, "2024": 15, "2025": 15 } });
  const sk = dungSuKien(l, diemEm(), null);
  const g = gonSuKien(sk, true);
  assert.equal(g.dl, "chiDiemSan"); assert.deepEqual(g.diem, {}); assert.equal(g.nhan, undefined); assert.equal(g.chenh, undefined);
  assert.ok(!/15/.test(JSON.stringify(g.diem)));
  assert.ok(KHONG_CO_DIEM_CHUAN.includes("chiDiemSan"));
  // máy khách cũ/cố tình gửi số kèm cờ chiDiemSan: máy chủ bỏ hết
  const kt = kiemTraYeuCau({ cauHoi: "ngành này điểm chuẩn bao nhiêu", duLieu: [{ id: "x", nganh: "N", truong: "T", loaiDuLieu: "chiDiemSan", diem: { "2025": 15 }, nhanCuaEm: "Dự phòng", chenh: 12, duBao: { nam: 2027, thap: 14, cao: 16 } }] });
  assert.ok(kt.ok); if (kt.ok) { const d = kt.v.duLieu[0]; assert.deepEqual(d.diem, {}); assert.equal(d.nhanCuaEm, undefined); assert.equal(d.chenh, undefined); assert.equal(d.duBao, undefined); assert.equal(d.loaiDuLieu, "chiDiemSan"); }
  const kt2 = kiemTraYeuCau({ cauHoi: "ngành này điểm chuẩn bao nhiêu", duLieu: [{ id: "x", nganh: "N", truong: "T", loaiDuLieu: "la-hoac", thamChieu: true, viTriDuBao: "tren", diem: { "2025": 25 } }] });
  assert.ok(kt2.ok); if (kt2.ok) { const d = kt2.v.duLieu[0]; assert.equal(d.loaiDuLieu, undefined); assert.equal(d.thamChieu, true); assert.equal(d.viTriDuBao, "tren"); assert.deepEqual(d.diem, { "2025": 25 }); }
  // dữ liệu hợp lệ nhiều năm được gửi như cũ, có trạng thái và vị trí dự báo
  const ok = dungSuKien(fake({ diemTheoNam: { "2024": 25, "2025": 26 } }), diemEm(), null);
  assert.equal(ok.loaiDuLieu, "nhieuNam"); assert.deepEqual(ok.diem, { "2024": 25, "2025": 26 }); assert.equal(ok.nhanCuaEm, "Vừa sức");
  // lời nhắc hệ thống có ràng buộc cấm bịa và không hứa đỗ
  assert.match(NHAC_HE_THONG, /chiDiemSan/); assert.match(NHAC_HE_THONG, /Không hứa đỗ/); assert.match(NHAC_HE_THONG, /Không tự nêu điểm chuẩn/);
  // trả lời tự động cũng không nêu điểm sàn như điểm chuẩn
  const dbl = LUA_CHON.find((x) => phanLoaiDuLieu(x).loai === "chiDiemSan" && x.maTruong)!;
  const app = taoHoSoMau();
  const tra = traLoiTuDong(`Em được 23 điểm, ngành ${dbl.nganh} của ${dbl.tenTruong} thì sao?`, app, null);
  assert.ok(!/điểm chuẩn \d{4} là 15,0/.test(tra.traLoi), tra.traLoi);
  for (const dong of tra.traLoi.split("\n").filter((d) => d.includes(dbl.nganh) && d.includes(dbl.tenTruong))) assert.ok(!/(Thử sức|Vừa sức|An toàn|Dự phòng)/.test(dong), dong);
}

// ---- Điểm theo loại: không trộn, bản cũ không mất gì ----
{
  const mau = taoHoSoMau();
  const s0 = { ...mau, hoSo: { ...mau.hoSo, diem: { ...mau.hoSo.diem, toan: 7 } }, diemThi: [{ mon: "toan" as const, diem: 8, ngay: "2026-10-01" }] };
  assert.equal(diemHienTaiCuaTungMon(s0).toan, 8, "thi thử mới nhất ưu tiên hơn điểm hồ sơ (hành vi cũ giữ nguyên)");
  const s1 = { ...s0, hoSo: { ...s0.hoSo, diemMucTieuMon: { toan: 10, vatLy: 10 } } };
  assert.equal(diemHienTaiCuaTungMon(s1).toan, 8, "điểm mục tiêu không bao giờ thành điểm hiện tại");
  assert.equal(diemTheoLoai(s1).mucTieu.toan, 10); assert.equal(diemTheoLoai(s1).thiThat.toan, null);
  const s2 = { ...s1, hoSo: { ...s1.hoSo, diemThiThat: { toan: 9.2 } } };
  assert.equal(diemHienTaiCuaTungMon(s2).toan, 9.2, "điểm thi thật ưu tiên cao nhất");
  const dl = diemTheoLoai(s2);
  assert.equal(dl.nguon.toan, "thiThat"); assert.equal(dl.thiThu.toan, 8); assert.equal(dl.hoSo.toan, 7); assert.equal(dl.mucTieu.toan, 10); assert.deepEqual(dl.hienTai, dl.hocHienTai);
  assert.equal(diemHienTaiCuaTungMon(s2).vatLy, mau.hoSo.diem.vatLy, "môn không có điểm thật giữ giá trị cũ");
  // migration: bản cũ (không có hai trường mới) chuẩn hóa không mất gì và không tự thêm số
  const cu = JSON.parse(JSON.stringify(mau));
  const sCu = chuanHoa(cu);
  assert.equal(sCu.hoSo.diemThiThat, undefined); assert.equal(sCu.hoSo.diemMucTieuMon, undefined);
  assert.deepEqual(sCu.hoSo.diem, mau.hoSo.diem); assert.deepEqual(sCu.nguyenVong, mau.nguyenVong); assert.deepEqual(sCu.diemThi, mau.diemThi);
  // trường mới đi qua chuẩn hóa: giữ số hợp lệ, bỏ số sai
  const moi = chuanHoa({ ...cu, hoSo: { ...cu.hoSo, diemThiThat: { toan: 9, vatLy: 99, hoaHoc: "x", nguVan: null }, diemMucTieuMon: { toan: 10, evil: 1 } } });
  assert.deepEqual(moi.hoSo.diemThiThat, { toan: 9, vatLy: null, hoaHoc: null, nguVan: null }); assert.deepEqual(moi.hoSo.diemMucTieuMon, { toan: 10 });
  // sao lưu: bản mới khôi phục đủ trường mới; bản cũ (phiên bản 2, không có trường mới) vẫn đọc được, nguyện vọng giữ nguyên
  const sao = taoBanSaoLuu({ ...mau, hoSo: { ...mau.hoSo, diemThiThat: { toan: 9 }, diemMucTieuMon: { vatLy: 9.5 } } });
  const doc = docBanSaoLuu(sao); assert.ok(doc.ok); if (doc.ok) { assert.equal(doc.s.hoSo.diemThiThat?.toan, 9); assert.equal(doc.s.hoSo.diemMucTieuMon?.vatLy, 9.5); assert.deepEqual(doc.s.nguyenVong, mau.nguyenVong); }
  const bCu = docBanSaoLuu(taoBanSaoLuu(mau)); assert.ok(bCu.ok); if (bCu.ok) { assert.deepEqual(bCu.s.nguyenVong, mau.nguyenVong); assert.equal(bCu.s.hoSo.diemThiThat, undefined); }
}

// ---- Dự báo bám trạng thái: namTuyenSinhToi vẫn là hàm của ngày ----
assert.equal(namTuyenSinhToi(new Date("2026-10-17")), 2027);

console.log("trang-thai-du-lieu: tất cả kiểm tra đều qua");

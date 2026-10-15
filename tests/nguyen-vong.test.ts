import "./nap-du-lieu"; // danh mục gốc nạp lười: phải xong trước các import còn lại
// Kiểm thử logic cơ cấu, nhãn và lời nhận xét nguyện vọng.
// Chạy: npx tsx tests/nguyen-vong.test.ts
import assert from "node:assert/strict";
import {
  xetCoCau, ketLuan, moTaSoLuong, dungDanhSach, demNhan,
} from "../src/features/nguyen-vong/tinh-toan";
import { goiYDanhSach, moNeoNV1 } from "../src/features/nguyen-vong/goi-y-danh-sach";
import { LUA_CHON_MAU } from "../src/data/lua-chon-mau";
import { diemDayDu, tongChoLuaChon } from "../src/features/kham-pha/to-hop";
import { nhanNguyenVong } from "../src/engine/phan-tich";
import { cauKhoangCachNV1, phanTichMoNeo, tomTatMoNeoChoAI } from "../src/features/nguyen-vong/mo-neo";
import { MON_CUA_TO_HOP } from "../src/data/to-hop-chinh-thuc";
import { taoHoSoMau } from "../src/state/mau";
import { goiYChoEm } from "../src/features/hanh-trinh/tinh-toan";
import type { DiemDayDu, NhanNguyenVong } from "../src/state/types";

// ---------- 1) Mô tả số lượng (moTaSoLuong) ----------
const demMau: Record<NhanNguyenVong, number> = {
  "Thử sức": 2,
  "Vừa sức": 1,
  "An toàn": 1,
  "Dự phòng": 1,
};
const moTa = moTaSoLuong(demMau);
assert.equal(moTa, "2 nguyện vọng thử sức, 1 vừa sức, 1 an toàn và 1 dự phòng");

const demMot: Record<NhanNguyenVong, number> = {
  "Thử sức": 1,
  "Vừa sức": 0,
  "An toàn": 0,
  "Dự phòng": 0,
};
assert.equal(moTaSoLuong(demMot), "1 nguyện vọng thử sức");

// ---------- 2) Xét cơ cấu và kết luận (xetCoCau & ketLuan) ----------

// Trường hợp 1: Danh sách toàn Thử sức, không có An toàn hay Dự phòng
const demToanThuSuc: Record<NhanNguyenVong, number> = {
  "Thử sức": 3,
  "Vừa sức": 0,
  "An toàn": 0,
  "Dự phòng": 0,
};
const ccNguyHiem = xetCoCau(demToanThuSuc, 3);
assert.equal(ccNguyHiem.chacChan, 0);
assert.equal(ccNguyHiem.canThemAnToan, true);
const klNguyHiem = ketLuan(ccNguyHiem);
assert.equal(klNguyHiem.tone, "do", "Không có an toàn phải cảnh báo đỏ");
assert.equal(klNguyHiem.tieuDe, "Chưa có nguyện vọng điểm chuẩn thấp hơn điểm của bạn");
assert.equal(klNguyHiem.onDinh, false);

// Trường hợp 2: Tỉ lệ Thử sức quá nhiều (>50%) dù có 1 An toàn
const demThuSucQuaNhieu: Record<NhanNguyenVong, number> = {
  "Thử sức": 3,
  "Vừa sức": 1,
  "An toàn": 1,
  "Dự phòng": 0,
};
const ccNhieuThuSuc = xetCoCau(demThuSucQuaNhieu, 5);
assert.equal(ccNhieuThuSuc.thuSucNhieu, true);
const klNhieuThuSuc = ketLuan(ccNhieuThuSuc);
assert.equal(klNhieuThuSuc.tone, "cam");
assert.equal(klNhieuThuSuc.tieuDe, "Thử sức đang hơi nhiều");

// Trường hợp 3: Thiếu nguyện vọng Vừa sức
const demThieuVuaSuc: Record<NhanNguyenVong, number> = {
  "Thử sức": 1,
  "Vừa sức": 0,
  "An toàn": 2,
  "Dự phòng": 1,
};
const ccThieuVuaSuc = xetCoCau(demThieuVuaSuc, 4);
assert.equal(ccThieuVuaSuc.thieuVuaSuc, true);
const klThieuVuaSuc = ketLuan(ccThieuVuaSuc);
assert.equal(klThieuVuaSuc.tone, "cam");
assert.equal(klThieuVuaSuc.tieuDe, "Chưa có nguyện vọng vừa sức");

// Trường hợp 4: Danh sách cân bằng chuẩn (1 Thử sức, 2 Vừa sức, 1 An toàn, 1 Dự phòng)
const demCanBang: Record<NhanNguyenVong, number> = {
  "Thử sức": 1,
  "Vừa sức": 2,
  "An toàn": 1,
  "Dự phòng": 1,
};
const ccCanBang = xetCoCau(demCanBang, 5);
assert.equal(ccCanBang.canThemAnToan, false);
assert.equal(ccCanBang.thuSucNhieu, false);
assert.equal(ccCanBang.thieuVuaSuc, false);
const klCanBang = ketLuan(ccCanBang);
assert.equal(klCanBang.tone, "luc", "Cân bằng đạt chuẩn ra tone lục");
assert.equal(klCanBang.onDinh, true);
assert.equal(klCanBang.tieuDe, "Cơ cấu danh sách đủ các nhóm");

// Trường hợp 5: Có nguyện vọng chưa đủ căn cứ
const ccChuaDu = xetCoCau({ "Thử sức": 1, "Vừa sức": 1, "An toàn": 0, "Dự phòng": 0 }, 4); // 2 hàng thiếu dữ liệu
assert.equal(ccChuaDu.chuaDuCanCu, 2);
const klChuaDu = ketLuan(ccChuaDu);
assert.equal(klChuaDu.tone, "muc");
assert.equal(klChuaDu.tieuDe, "Chưa đủ căn cứ để nhận xét cả danh sách");

// ---------- 3) Dựng danh sách nguyện vọng (dungDanhSach) ----------
const diemEm: DiemDayDu = {
  toan: 8.5, vatLy: 8.0, hoaHoc: 8.5, sinh: null, nguVan: null, tiengAnh: 8.0,
  lichSu: null, diaLy: null, gdktpl: null, tinHoc: null, congNghe: null,
};
const dsId = [LUA_CHON_MAU[0].id, LUA_CHON_MAU[1].id];
const dsDong = dungDanhSach(dsId, diemEm, (id) => LUA_CHON_MAU.find((l) => l.id === id));
assert.equal(dsDong.length, 2);
assert.equal(dsDong[0].viTri, 0);
assert.equal(dsDong[1].viTri, 1);
assert.ok(dsDong[0].nhan !== null, "Có đủ điểm tổ hợp nên phải có nhãn");

// Đếm nhãn từ danh sách dòng
const ketQuaDem = demNhan(dsDong);
assert.equal(typeof ketQuaDem["Thử sức"], "number");
assert.equal(typeof ketQuaDem["Vừa sức"], "number");
assert.equal(typeof ketQuaDem["An toàn"], "number");
// ---------- 4) Gợi ý danh sách nguyện vọng (goiYDanhSach) ----------
const hoSoGoiY = {
  nganSach: "duoi30" as const,
  khuVuc: ["TP.HCM"],
  nganhQuanTam: ["Công nghệ thông tin"],
  tinh: "TP.HCM",
  hocXaNha: true,
};
const dsGoiY = goiYDanhSach(diemEm, hoSoGoiY);
assert.ok(dsGoiY.length > 0, "Thuật toán gợi ý phải trả về danh sách");
assert.ok(dsGoiY.length <= 6, "Tối đa 6 nguyện vọng theo cơ cấu");
assert.ok(dsGoiY.every((d) => d.lc && d.nhan && d.lyDo.length > 0), "Mỗi dòng có đủ lựa chọn, nhãn và lý do");

// Ngành bạn thực sự muốn vào: luôn đứng đầu danh sách, không trùng, và danh sách vẫn đủ cân bằng.
{
  const muon = dsGoiY[dsGoiY.length - 1].lc;
  const coMuon = goiYDanhSach(diemEm, hoSoGoiY, [], undefined, muon);
  assert.equal(coMuon[0].lc.id, muon.id, "ngành mục tiêu đứng đầu");
  assert.ok(coMuon[0].lyDo[0].includes("mục tiêu"), "nói rõ đây là mục tiêu");
  assert.equal(new Set(coMuon.map((d) => d.lc.id)).size, coMuon.length, "không gợi ý trùng");
  assert.ok(coMuon.length <= 6, "vẫn tối đa 6");
  assert.equal(goiYDanhSach(diemEm, hoSoGoiY, [muon.id], undefined, muon).some((d) => d.lc.id === muon.id), false, "đã có trong danh sách thì không thêm lại");
}

// Kiểm tra giới hạn tối đa 2 ngành / 1 trường
const demTruong = new Map<string, number>();
for (const d of dsGoiY) {
  demTruong.set(d.lc.truong, (demTruong.get(d.lc.truong) ?? 0) + 1);
}
for (const [truong, soLuong] of demTruong) {
  assert.ok(soLuong <= 2, `Trường ${truong} không được vượt quá 2 ngành`);
}

// Kiểm tra thứ tự ưu tiên: Thử sức -> Vừa sức -> An toàn -> Dự phòng
const thuTuNhan: Record<NhanNguyenVong, number> = { "Thử sức": 0, "Vừa sức": 1, "An toàn": 2, "Dự phòng": 3 };
for (let i = 0; i < dsGoiY.length - 1; i++) {
  assert.ok(
    thuTuNhan[dsGoiY[i].nhan] <= thuTuNhan[dsGoiY[i + 1].nhan],
    "Nguyện vọng phải xếp theo thứ tự Thử sức -> Vừa sức -> An toàn -> Dự phòng",
  );
}


// ---------- 5) Chiến lược mỏ neo NV1 ----------
{
  const trongNS = (l: (typeof LUA_CHON_MAU)[number]) => l.hocPhiMin === undefined || l.hocPhiMin <= 30;
  const thuong = LUA_CHON_MAU.filter((l) => (!l.phuongThuc || l.phuongThuc === "THPT") && trongNS(l));
  const nhanCua = (l: (typeof LUA_CHON_MAU)[number]) => { const t = tongChoLuaChon(l, diemEm); return t.tong === null ? null : nhanNguyenVong(l, t.tong); };
  const cungTr = (a: (typeof LUA_CHON_MAU)[number], b: (typeof LUA_CHON_MAU)[number]) => (a.maTruong ?? a.truong) === (b.maTruong ?? b.truong);
  // NV1 là ngành Thử sức; cùng trường có ngành cùng nhóm, mềm hơn, Vừa sức hoặc An toàn; và có trường khác cùng nhóm để làm lớp 2.
  const neo = thuong.find((l) => nhanCua(l) === "Thử sức"
    && thuong.some((x) => x.id !== l.id && cungTr(x, l) && x.nhomNganh === l.nhomNganh && x.diemMin < l.diemMin && ["Vừa sức", "An toàn"].includes(nhanCua(x) as string))
    && thuong.some((x) => !cungTr(x, l) && x.nhomNganh === l.nhomNganh && ["Vừa sức", "An toàn"].includes(nhanCua(x) as string)));
  assert.ok(neo, "dữ liệu phải có ca NV1 Thử sức kèm cửa phụ cùng trường (nếu không, test này vô nghĩa)");
  const hs = { ...hoSoGoiY, nganhQuanTam: [neo.nhomNganh] };
  const kq = goiYDanhSach(diemEm, hs, [], undefined, neo);
  assert.equal(kq[0].lc.id, neo.id, "mỏ neo đứng đầu");
  assert.equal(kq[0].tang, "muc-tieu");
  assert.ok(kq.length <= 6 && new Set(kq.map((d) => d.lc.id)).size === kq.length, "tối đa 6 dòng, không trùng");

  // Lớp 1: có cửa phụ vào đúng trường, đứng trước mọi dòng của trường khác, lý do nêu rõ trường và độ mềm điểm.
  const cuaPhu = kq.filter((d) => d.tang === "cung-truong");
  assert.ok(cuaPhu.length >= 1 && cuaPhu.length <= 2, "có 1–2 cửa phụ cùng trường");
  assert.ok(cuaPhu.every((d) => cungTr(d.lc, neo) && d.lc.diemMin < neo.diemMin && ["Vừa sức", "An toàn"].includes(d.nhan)), "cửa phụ: cùng trường, điểm chuẩn mềm hơn, Vừa sức/An toàn");
  assert.ok(cuaPhu[0].lyDo[0].includes(`đúng ${neo.tenTruong}`) && /mềm hơn \d+,\d điểm\)/.test(cuaPhu[0].lyDo[0]) && !cuaPhu[0].lyDo[0].includes(`trường ${neo.truong} `), `lý do cửa phụ nêu tên trường, không nêu mã: ${cuaPhu[0].lyDo[0]}`);
  const viTriTruongKhac = kq.findIndex((d, i) => i > 0 && !cungTr(d.lc, neo));
  assert.ok(viTriTruongKhac === -1 || kq.indexOf(cuaPhu[cuaPhu.length - 1]) < viTriTruongKhac, "cửa phụ cùng trường xếp trước các trường khác");

  // Tầng 1a: cùng trường không có ngành Vừa sức/An toàn nào mềm hơn, nhưng có ngành Thử sức mềm hơn ≥ 0,25 điểm và chỉ thiếu ≤ 1,5 điểm.
  const tongCua = (l: (typeof LUA_CHON_MAU)[number]) => tongChoLuaChon(l, diemEm).tong;
  const lamMemCungTruong = (l: (typeof LUA_CHON_MAU)[number]) => thuong.filter((x) => x.id !== l.id && cungTr(x, l) && x.diemMin < l.diemMin && ["Vừa sức", "An toàn"].includes(nhanCua(x) as string));
  const memNhatCungTruong = (l: (typeof LUA_CHON_MAU)[number]) => thuong.filter((x) => x.id !== l.id && nhanCua(x) === "Thử sức" && cungTr(x, l) && l.diemMin - x.diemMin >= 0.25 && tongCua(x) !== null && x.diemMin - (tongCua(x) as number) <= 1.5);
  const coLop2 = (l: (typeof LUA_CHON_MAU)[number]) => thuong.some((x) => !cungTr(x, l) && x.nhomNganh === l.nhomNganh && ["Vừa sức", "An toàn"].includes(nhanCua(x) as string));
  {
    // Ca thật: Minh Anh, NV1 = QSC Hệ thống thông tin (26,25). Cả trường QSC không có ngành Vừa sức/An toàn nào mềm hơn.
    const ma = taoHoSoMau("minhAnh");
    const diemMA = diemDayDu(ma);
    const neo1a = moNeoNV1({ nguyenVong: [], mucTieu: ma.mucTieu })!;
    const nhanMA = (l: (typeof LUA_CHON_MAU)[number]) => { const t = tongChoLuaChon(l, diemMA); return t.tong === null ? null : nhanNguyenVong(l, t.tong); };
    const trongNS60 = (l: (typeof LUA_CHON_MAU)[number]) => (!l.phuongThuc || l.phuongThuc === "THPT") && (l.hocPhiMin === undefined || l.hocPhiMin <= 60);
    const cungMA = LUA_CHON_MAU.filter((x) => x.id !== neo1a.id && cungTr(x, neo1a) && trongNS60(x));
    assert.equal(cungMA.some((x) => x.diemMin < neo1a.diemMin && ["Vừa sức", "An toàn"].includes(nhanMA(x) as string)), false, "tiền đề: không có cửa phụ Vừa sức/An toàn");
    const dieuKien = cungMA.filter((x) => nhanMA(x) === "Thử sức" && neo1a.diemMin - x.diemMin >= 0.25 && x.diemMin - (tongChoLuaChon(x, diemMA).tong as number) <= 1.5);
    assert.ok(dieuKien.length > 0, "tiền đề: có ngành Thử sức mềm hơn trong ngưỡng");
    const kq1a = goiYDanhSach(diemMA, ma.hoSo, [], undefined, neo1a);
    const cp = kq1a.filter((d) => d.tang === "cung-truong");
    assert.equal(cp.length, 1, "tầng 1a lấy đúng 1 ngành");
    assert.ok(cungTr(cp[0].lc, neo1a) && cp[0].nhan === "Thử sức" && neo1a.diemMin - cp[0].lc.diemMin >= 0.25 && cp[0].lc.diemMin - cp[0].tong <= 1.5);
    assert.equal(cp[0].lc.diemMin, Math.min(...dieuKien.map((x) => x.diemMin)), "là ngành mềm nhất đủ điều kiện");
    assert.ok(cp[0].lyDo[0].startsWith(`Ngành có điểm chuẩn mềm nhất tại ${neo1a.tenTruong} (thấp hơn Nguyện Vọng 1 `) && cp[0].lyDo[0].endsWith("để tăng cơ hội đỗ đúng trường mơ ước"), cp[0].lyDo[0]);
    assert.ok(kq1a.some((d) => d.tang === "cung-nganh"), "vẫn có lớp 2 sau tầng 1a");
  }
  // Tầng 1b: cả trường không có cửa phụ nào thì bỏ qua lớp 1, vào thẳng lớp 2 và có chú thích.
  const neo1b = thuong.find((l) => nhanCua(l) === "Thử sức" && lamMemCungTruong(l).length === 0 && memNhatCungTruong(l).length === 0 && coLop2(l));
  assert.ok(neo1b, "dữ liệu phải có ca tầng 1b");
  {
    const kq1b = goiYDanhSach(diemEm, { ...hoSoGoiY, nganhQuanTam: [neo1b.nhomNganh] }, [], undefined, neo1b);
    assert.equal(kq1b.filter((d) => d.tang === "cung-truong").length, 0, "không có cửa phụ cùng trường");
    const l2 = kq1b.find((d) => d.tang === "cung-nganh")!;
    assert.ok(l2, "vào thẳng lớp 2");
    assert.ok(l2.lyDo.some((r) => r.startsWith(`Vì các ngành khác tại ${neo1b.tenTruong} đều có mức điểm chuẩn tương đương hoặc cao hơn`) && r.includes(`giữ đúng ngành ${neo1b.nganh}`)), "có chú thích tầng 1b");
  }

  // Lớp 2: có trường khác cùng ngành/nhóm ngành, lý do giữ đúng ngành.
  const cungNganh = kq.filter((d) => d.tang === "cung-nganh");
  assert.ok(cungNganh.length >= 1 && cungNganh.every((d) => !cungTr(d.lc, neo) && d.lc.nhomNganh === neo.nhomNganh), "lớp 2: trường khác, cùng nhóm ngành");
  assert.ok(cungNganh[0].lyDo[0].includes(`Giữ đúng ngành ${neo.nganh}`));

  // Lớp 3: dòng cuối là chốt chặn An toàn/Dự phòng, dư tối thiểu 1,0 điểm, trong ngân sách.
  const cuoi = kq[kq.length - 1];
  assert.equal(cuoi.tang, "chot-chan");
  assert.ok(cuoi.nhan === "An toàn" || cuoi.nhan === "Dự phòng");
  assert.ok(cuoi.tong - cuoi.lc.diemMin >= 1, "chốt chặn dư ít nhất 1,0 điểm");
  assert.ok(trongNS(cuoi.lc), "chốt chặn trong ngân sách");

  // NV1 đã nằm trong danh sách: không thêm lại nhưng vẫn xây quanh nó.
  const daCo = goiYDanhSach(diemEm, hs, [neo.id], undefined, neo);
  assert.ok(daCo.every((d) => d.lc.id !== neo.id), "không thêm lại NV1");
  assert.ok(daCo.some((d) => d.tang === "cung-truong") && daCo[daCo.length - 1].tang === "chot-chan", "vẫn có cửa phụ và chốt chặn");

  // Mỏ neo đã Vừa sức/An toàn: không cần cửa phụ cùng trường.
  const de = thuong.find((l) => ["Vừa sức", "An toàn"].includes(nhanCua(l) as string));
  assert.ok(de);
  assert.equal(goiYDanhSach(diemEm, { ...hoSoGoiY, nganhQuanTam: [de.nhomNganh] }, [], undefined, de).some((d) => d.tang === "cung-truong"), false, "mỏ neo khả thi thì không ép cửa phụ");
}

// ---------- 6) Phân tích khoảng cách tới NV1 (Hôm nay và ngữ cảnh AI) ----------
{
  const gb = taoHoSoMau("giaBao");
  const p = phanTichMoNeo(gb)!;
  assert.ok(p, "có mỏ neo từ NV1");
  assert.equal(p.lc.id, gb.nguyenVong[0]);
  assert.ok(p.conThieu > 0 && p.conThieu <= 0.8, `Gia Bảo thiếu ${p.conThieu}`);
  assert.ok(p.theoMon.length > 0 && p.theoMon.every((k) => k.thieu > 0), "chia phần thiếu theo từng môn");
  assert.ok(Math.abs(p.theoMon.reduce((t, k) => t + k.thieu, 0) - p.conThieu) <= 0.15, "tổng phần thiếu theo môn khớp phần thiếu tổng");
  assert.equal(p.luoiDo.length, gb.nguyenVong.length - 1, "lưới đỡ là các NV còn lại");
  const cau = cauKhoangCachNV1(p)!;
  assert.ok(cau.includes(p.lc.truong) && /thiếu \d+,\d điểm/.test(cau), cau);
  assert.equal(goiYChoEm(gb).moTa, cau, "thẻ Hôm nay lấy NV1 làm gốc");
  const ctx = tomTatMoNeoChoAI(p);
  assert.ok(ctx.startsWith("NV1:") && ctx.includes("Lưới đỡ:") && ctx.length < 420, ctx);
  // Danh sách trống thì lấy mục tiêu làm mỏ neo; chưa có mục tiêu lẫn NV thì không có phân tích.
  assert.equal(phanTichMoNeo({ ...gb, nguyenVong: [] })!.lc.id, gb.mucTieu!.luaChonId);
  assert.equal(phanTichMoNeo({ ...gb, nguyenVong: [], mucTieu: null }), null);
  assert.equal(tomTatMoNeoChoAI(null), "");
}

// ---------- Ma trận hồ sơ thực tế (không phụ thuộc hồ sơ mẫu) ----------
{
  const diemTheoToHop = (ma: string, tong: number): DiemDayDu => {
    const d: DiemDayDu = { toan: null, vatLy: null, hoaHoc: null, sinh: null, nguVan: null, tiengAnh: null, lichSu: null, diaLy: null, gdktpl: null, tinHoc: null, congNghe: null };
    for (const m of MON_CUA_TO_HOP[ma]) d[m] = tong / 3;
    return d;
  };
  const hs = { nganSach: null, khuVuc: [] as string[], nganhQuanTam: [] as string[], tinh: "", hocXaNha: null };
  const thpt = (a: number, b: number, ma: string) => LUA_CHON_MAU.filter((l) => (!l.phuongThuc || l.phuongThuc === "THPT") && l.diemMin >= a && l.diemMin <= b && (l.toHopXet ?? []).includes(ma));
  const khongTrung = (kq: ReturnType<typeof goiYDanhSach>) => assert.equal(new Set(kq.map((d) => d.lc.id)).size, kq.length, "không trùng ngành");

  // 1) Điểm thấp 17,5 (A00), chưa có mục tiêu: đủ danh sách, có chốt chặn <= 16,5, không toàn ngành thiếu nhiều
  {
    const kq = goiYDanhSach(diemTheoToHop("A00", 17.5), hs);
    assert.equal(kq.length, 6, "điểm thấp vẫn đủ 6 dòng");
    khongTrung(kq);
    assert.ok(kq.some((d) => d.lc.diemMin <= 16.5 && d.tong - d.lc.diemMin >= 1), "có chốt chặn <= 16,5");
    assert.ok(kq.every((d) => d.tong - d.lc.diemMin >= -2), "không dòng nào thiếu quá 2 điểm");
    assert.ok(kq.some((d) => d.nhan === "An toàn" || d.nhan === "Dự phòng"));
  }

  // 2) Mơ quá tầm: 20,0 (D01), NV1 = ngành ~26 điểm
  {
    const neo = thpt(25.5, 26.5, "D01")[0];
    assert.ok(neo, "dữ liệu có ngành ~26 điểm xét D01");
    const diem = diemTheoToHop("D01", 20);
    const kq = goiYDanhSach(diem, hs, [], undefined, neo);
    khongTrung(kq);
    assert.equal(kq[0].lc.id, neo.id, "NV1 vẫn đứng đầu theo ý bạn");
    assert.ok(kq[0].lyDo.some((l) => l.includes("khá xa")), "cảnh báo khoảng cách lớn");
    for (const d of kq.filter((x) => x.tang === "cung-truong")) assert.ok(d.lc.diemMin - d.tong <= 1.5, "cửa phụ cùng trường không thiếu quá 1,5 điểm");
    const lop2 = kq.filter((d) => d.tang === "cung-nganh");
    assert.ok(lop2.length > 0 && lop2.some((d) => d.lc.diemMin >= 18.5 && d.lc.diemMin <= 20.5), "lớp 2 về đúng tầm 18,5–20,5");
    assert.ok(kq.slice(1).every((d) => d.lc.diemMin <= 20 + 1.5), "ngoài NV1, không dòng nào thiếu quá 1,5 điểm");
    assert.equal(kq[kq.length - 1].tang, "chot-chan");
    assert.ok(kq[kq.length - 1].tong - kq[kq.length - 1].lc.diemMin >= 1);
  }

  // 3) NV1 đã vừa/dư điểm: không ép cửa phụ mềm hơn, có 1 dòng nâng tầm và 1 chốt chặn dưới
  {
    const neo = thpt(21.8, 22.2, "A00")[0];
    const kq = goiYDanhSach(diemTheoToHop("A00", 23), hs, [], undefined, neo);
    assert.equal(kq[0].lc.id, neo.id);
    assert.ok(!kq.some((d) => d.tang === "cung-truong"), "không cần cửa phụ");
    const nang = kq.filter((d) => d.tang === "nang-tam");
    assert.ok(nang.length <= 1 && nang.every((d) => d.lc.diemMin >= neo.diemMin + 0.5 && d.lc.diemMin - d.tong <= 1.5), "nâng tầm cao hơn NV1, thiếu tối đa 1,5");
    assert.equal(kq[kq.length - 1].tang, "chot-chan");
  }

  // 4) Điểm rất cao 28,0 (A01): tập trung nhóm top, không chốt chặn thấp vô nghĩa
  {
    const kq = goiYDanhSach(diemTheoToHop("A01", 28), hs);
    assert.equal(kq.length, 6);
    assert.ok(kq.every((d) => d.lc.diemMin >= 24), `mọi dòng >= 24 điểm: ${kq.map((d) => d.lc.diemMin).join(", ")}`);
    const neoCao = thpt(27, 28.5, "A01")[0];
    if (neoCao) {
      const kq2 = goiYDanhSach(diemTheoToHop("A01", 28), hs, [], undefined, neoCao);
      assert.ok(kq2.every((d) => d.lc.diemMin >= 24), "có mỏ neo cao vẫn không rớt xuống chốt chặn thấp");
    }
  }

  // 5) Khối khác (C00, B00, D01) và các mức điểm: luôn có gợi ý, đúng tổ hợp, không lỗi lọc
  for (const [ma, tong] of [["C00", 22], ["B00", 24], ["D01", 21], ["A00", 15], ["A01", 19], ["C00", 27]] as const) {
    const kq = goiYDanhSach(diemTheoToHop(ma, tong), hs);
    assert.ok(kq.length >= 4, `${ma} ${tong} điểm phải có gợi ý (được ${kq.length})`);
    khongTrung(kq);
    assert.ok(kq.every((d) => d.toHop === null || d.toHop === ma || MON_CUA_TO_HOP[d.toHop].every((m) => MON_CUA_TO_HOP[ma].includes(m))), `${ma}: chỉ tính theo tổ hợp em có điểm`);
  }

  // 6) Đổi NV1 trực tiếp: kết quả đi theo NV1 mới (mỏ neo là NV1, không dính mục tiêu cũ)
  {
    const [a, b] = [thpt(23, 23.5, "A00")[0], thpt(19, 19.5, "A00")[0]];
    const diem = diemTheoToHop("A00", 21);
    const s1 = { nguyenVong: [a.id], mucTieu: { luaChonId: b.id } };
    const s2 = { nguyenVong: [b.id, a.id], mucTieu: { luaChonId: a.id } };
    assert.equal(moNeoNV1(s1)?.id, a.id);
    assert.equal(moNeoNV1(s2)?.id, b.id);
    const k1 = goiYDanhSach(diem, hs, s1.nguyenVong, undefined, moNeoNV1(s1));
    const k2 = goiYDanhSach(diem, hs, s2.nguyenVong, undefined, moNeoNV1(s2));
    assert.notDeepEqual(k1.map((d) => d.lc.id), k2.map((d) => d.lc.id), "đổi NV1 thì gợi ý đổi theo");
  }
}

console.log("nguyen-vong: tất cả kiểm tra đều qua");

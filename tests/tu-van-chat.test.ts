import "./nap-du-lieu";
// Chat tư vấn hiểu đúng ý định: tỉnh, ngành, tên trường, điểm, hành động. Chạy: npx tsx tests/tu-van-chat.test.ts
// Được nạp luôn từ tests/lay-du-lieu.test.ts. Dùng dữ liệu thật; không gọi mạng (trừ mô phỏng fetch ở mục I).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { LUA_CHON_MAU } from "../src/data/lua-chon-mau";
import { lyDoKhacPhuongThuc } from "../src/engine/phan-tich";
import { locTheoTinh } from "../src/engine/truong";
import { chuTruongDinhNghia, phanTichCau, timDiemTrongCau, timTinhTrongCau } from "../src/features/tu-van/hieu-cau";
import { lamSachLichSu, type TinNhan } from "../src/features/tu-van/hoi-thoai";
import { chonDuLieuKemTheo, traLoiTuDong } from "../src/features/tu-van/lay-du-lieu";
import { layTinTraLoi, traLoiNoiBo } from "../src/features/tu-van/cau-tra-loi";
import { taoHoSoMau, TRANG_THAI_BAN_DAU } from "../src/state/mau";

const TU_CAM_UI = ["dashboard", "kịch bản", "giả lập", "tác động", "rủi ro", "chống trượt", "tối ưu", "CTA", "widget", "onboarding", "profile", "chắc chắn", "chắc chân", "an toàn không", "yên tâm", "cơ hội tốt"];
const NHAN = /Dự phòng|An toàn|Vừa sức|Thử sức/;
const trong = TRANG_THAI_BAN_DAU;
const ct = (id: string) => LUA_CHON_MAU.find((l) => l.id === id)!;
const tra = (c: string, hs: TinNhan[] = [], st = trong) => traLoiTuDong(c, st, null, [], hs);
/** Hỏi nối tiếp: ghi câu hỏi và câu đáp vào lịch sử như app làm. */
const hoi = (c: string, hs: TinNhan[], st = trong) => {
  const r = tra(c, hs, st);
  hs.push({ vai: "em", chu: c }, { vai: "mayChu", chu: r.traLoi, nguon: r.nguon, ...(r.the ? { the: r.the } : {}), ...(r.cho ? { cho: r.cho } : {}) });
  return r;
};

// Nhận ra điểm, tỉnh, tên trường
assert.equal(timDiemTrongCau("Em được 23 điểm"), 23);
assert.equal(timDiemTrongCau("em duoc 24,5 diem khoi A00"), 24.5);
assert.equal(timDiemTrongCau("23"), 23);
assert.equal(timDiemTrongCau("học phí dưới 30 triệu"), null);
assert.equal(timDiemTrongCau("đề án năm 2024"), null);
assert.equal(timDiemTrongCau("lớp 12"), null);
assert.equal(timTinhTrongCau("Ở Vĩnh Long có trường nào")?.tinh, "Vĩnh Long");
assert.equal(timTinhTrongCau("trường nào ở Trà Vinh")?.tinh, "Vĩnh Long", "tên tỉnh cũ gộp vào tỉnh mới");
assert.equal(timTinhTrongCau("Đại học Hà Nội là trường gì"), null, "tên trường chứa tên tỉnh không phải tỉnh");
assert.equal(chuTruongDinhNghia("DTL là trường gì?"), "dtl");
assert.equal(chuTruongDinhNghia("Ngành CNTT là gì?"), null);
assert.equal(phanTichCau("Em có cơ hội đỗ không?").kieu, "co-hoi");
assert.equal(phanTichCau("Ngành này có cơ hội việc làm không?").kieu, "khac", "cơ hội việc làm không phải cơ hội đỗ");

// A. Khám phá: Vĩnh Long + CNTT chỉ ra trường thật ở Vĩnh Long, không khớp mờ sang Long An/Vĩnh Phúc
{
  const r = tra("Ở Vĩnh Long có trường nào dạy CNTT?");
  assert.ok(r.the && r.the.length >= 1, "phải có thẻ trường");
  const vl = new Set(locTheoTinh(LUA_CHON_MAU, "Vĩnh Long").map((l) => l.maTruong));
  for (const t of r.the!) {
    assert.ok(vl.has(t.ma), `trường ${t.ma} không ở Vĩnh Long`);
    assert.equal(t.muc, "chinh-xac");
    if (t.id) assert.ok(/công nghệ thông tin/i.test(ct(t.id).nganh) && ct(t.id).maTruong === t.ma);
  }
  assert.ok(r.the!.some((t) => t.ma === "DTV"), "ĐH Trà Vinh nằm ở Vĩnh Long (sáp nhập) và có CNTT");
  assert.ok(/Vĩnh Long/.test(r.traLoi) && /Trà Vinh/.test(r.traLoi) && !/Long An|Vĩnh Phúc|Sư phạm/.test(r.traLoi));
  assert.ok(!/dự báo|dự kiến|%/i.test(r.traLoi), "không nêu dự báo khi chưa hỏi");
  assert.ok(r.traLoi.length < 400, "trả lời ngắn");
  // Không có ngành đó: nói chưa tìm thấy, không nhét trường khác
  const k = tra("Ở Vĩnh Long có trường nào dạy Y khoa?");
  assert.ok(/chưa tìm thấy/.test(k.traLoi) && !k.the, k.traLoi);
  assert.equal(k.trangThaiDuLieu, "chua-co");
  // Nhiều kết quả: chữ nêu tối đa 3 tên, thẻ có thể nhiều hơn, nguồn không quá 3
  const hn = tra("Ở Hà Nội có trường nào dạy CNTT?");
  assert.ok(hn.the!.length > 3 && hn.nguon.length <= 3);
  assert.ok(/cùng \d+ trường khác/.test(hn.traLoi), hn.traLoi);
  const hnTinh = locTheoTinh(LUA_CHON_MAU, "Hà Nội").map((l) => l.maTruong);
  for (const t of hn.the!) assert.ok(hnTinh.includes(t.ma));
  // Dữ liệu gửi AI cho câu này cũng là trường thật ở Vĩnh Long
  const gui = chonDuLieuKemTheo("Ở Vĩnh Long có trường nào dạy CNTT?", trong, null);
  assert.ok(gui.length > 0 && gui.every((d) => d.tinh === "Vĩnh Long" && /công nghệ thông tin/i.test(d.nganh)), JSON.stringify(gui.map((d) => d.tinh)));
}

// B. Tên trường: DTL = ĐH Thăng Long theo dữ liệu; mơ hồ thì hỏi lại, không đoán
{
  const r = tra("DTL là trường gì?");
  assert.deepEqual(r.the, [{ ma: "DTL" }]);
  assert.ok(r.traLoi.includes("ĐH Thăng Long") && r.hanhDong?.some((h) => h.loai === "xem-truong" && h.maTruong === "DTL"));
  const m = tra("bk là trường gì?");
  assert.ok(m.hoiLai && (m.luaChon?.length ?? 0) >= 2 && !m.the && !m.hanhDong, "mã mơ hồ: hỏi lại kèm lựa chọn");
  assert.ok(m.luaChon!.every((l) => /Bách Khoa/.test(l.nhan)));
  const khong = tra("zzzq là trường gì?");
  assert.ok(/chưa thấy/.test(khong.traLoi) && !khong.the);
  // Bấm lựa chọn (chỉ tên đầy đủ) ra thẻ trường đó
  assert.equal(tra(m.luaChon![0].cau).the?.length, 1);
}

// C. Cơ hội đỗ: thiếu thông tin thì hỏi đúng một câu; đủ thì dùng nhãn, không xác suất
{
  const h: TinNhan[] = [];
  const a = hoi("Em có cơ hội đỗ không?", h);
  assert.ok(a.hoiLai && !/%|xác suất/.test(a.traLoi));
  hoi("Ở Vĩnh Long có trường nào dạy CNTT?", h);
  const b = hoi("Em có cơ hội đỗ không?", h);
  assert.ok(b.cho?.y === "co-hoi-diem" && /tổng điểm/i.test(b.hoiLai ?? ""), "có ngành nhưng chưa có điểm: hỏi điểm");
  const c = hoi("23", h);
  const lcC = ct(c.nguon[0]);
  if (lyDoKhacPhuongThuc(lcC)) {
    // Ngành chỉ có điểm sàn 15,0 (hoặc chưa có điểm chuẩn): không gắn nhãn, không nêu 15,0 như điểm chuẩn.
    assert.ok(/chưa so/.test(c.traLoi) && !NHAN.test(c.traLoi) && !/15[,.]0/.test(c.traLoi) && !/%/.test(c.traLoi), c.traLoi);
  } else {
    assert.ok(NHAN.test(c.traLoi) && /không phải khả năng đỗ/.test(c.traLoi) && !/%/.test(c.traLoi), c.traLoi);
    assert.ok(c.hanhDong?.[0]?.canXacNhan);
  }
  const h2: TinNhan[] = [];
  hoi("Ở Vĩnh Long có trường nào dạy CNTT?", h2);
  const d = hoi("Em được 23 điểm, có nên đăng ký trường này?", h2);
  const l = ct(d.nguon[0]);
  const chenh = Math.round((23 - l.diemMin) * 100) / 100;
  if (lyDoKhacPhuongThuc(l)) {
    assert.ok(d.traLoi.includes(l.nganh) && /chưa so/.test(d.traLoi) && !NHAN.test(d.traLoi), d.traLoi);
  } else {
    assert.ok(d.traLoi.includes(l.nganh) && d.traLoi.includes("23,0") && NHAN.test(d.traLoi));
    assert.ok(d.traLoi.includes(`${chenh >= 0 ? "hơn" : "kém"} ${Math.abs(chenh).toFixed(1).replace(".", ",")} điểm`), d.traLoi);
  }
  assert.ok(!/chắc chắn|đảm bảo|100%/.test(d.traLoi));
  // Ngành xét phương thức khác (không phải THPT): không so điểm bừa
  const khac = LUA_CHON_MAU.find((x) => x.phuongThuc && x.phuongThuc !== "THPT" && x.maTruong);
  if (khac) {
    const h3: TinNhan[] = [{ vai: "em", chu: "x" }, { vai: "mayChu", chu: "y", nguon: [khac.id], the: [{ ma: khac.maTruong!, id: khac.id }] }];
    const e = tra("Em được 23 điểm, có nên đăng ký trường này?", h3);
    assert.ok(/chưa so/.test(e.traLoi) && !NHAN.test(e.traLoi), e.traLoi);
  }
  // Ngữ cảnh nhiều trường: không chọn thay
  const hn: TinNhan[] = [];
  hoi("Ở Hà Nội có trường nào dạy CNTT?", hn);
  const f = hoi("Em được 23 điểm, có nên đăng ký trường này?", hn);
  assert.ok(f.hoiLai && (f.luaChon?.length ?? 0) >= 2 && !NHAN.test(f.traLoi));
}

// D. So sánh hai trường: không tự chọn ngành hay trường
{
  const a = tra("So sánh hai trường");
  assert.ok(a.hoiLai && !a.hanhDong);
  const hn: TinNhan[] = [];
  hoi("Ở Hà Nội có trường nào dạy CNTT?", hn);
  const b = hoi("So sánh hai trường", hn);
  assert.ok(b.hoiLai && !b.hanhDong, "nhiều hơn hai trường ở lượt trước: hỏi lại, không chọn hai trường đầu");
  const c = tra("So sánh ĐH Thăng Long và UIT");
  assert.ok(c.hoiLai && (c.luaChon?.length ?? 0) > 0 && !c.hanhDong, "biết hai trường nhưng chưa biết ngành: hỏi ngành chung");
  const rr = tra(c.luaChon![0].cau);
  const so = rr.hanhDong?.find((x) => x.loai === "so-sanh");
  assert.ok(so && so.ids?.length === 2, rr.traLoi);
  assert.deepEqual(new Set(so!.ids!.map((i) => ct(i).maTruong)), new Set(["DTL", "QSC"]));
  assert.equal(ct(so!.ids![0]).nganh.toLowerCase(), ct(so!.ids![1]).nganh.toLowerCase(), "hai bên cùng tên ngành");
}

// E. Thêm vào nguyện vọng: chỉ đề xuất (canXacNhan), không tự thêm
{
  const hv: TinNhan[] = [];
  hoi("Ở Vĩnh Long có trường nào dạy CNTT?", hv);
  const a = hoi("Thêm trường này vào nguyện vọng", hv);
  assert.equal(a.hanhDong?.length, 1);
  assert.equal(a.hanhDong![0].loai, "them-nguyen-vong"); assert.equal(a.hanhDong![0].canXacNhan, true);
  assert.equal(ct(a.hanhDong![0].idChuongTrinh!).maTruong, "DTV");
  assert.equal(trong.nguyenVong.length, 0, "bộ trả lời không đụng vào dữ liệu của bạn");
  const s2 = { ...trong, nguyenVong: [a.hanhDong![0].idChuongTrinh!] };
  assert.ok(/đã có/.test(tra("Thêm trường này vào nguyện vọng", hv, s2).traLoi));
  // Thiếu ngành: hỏi, kèm tối đa 3 ngành để chọn
  const hu: TinNhan[] = [];
  hoi("UIT là trường gì", hu);
  const b = hoi("Thêm trường này vào nguyện vọng", hu);
  assert.ok(b.hoiLai && b.hanhDong!.length >= 2 && b.hanhDong!.length <= 3 && b.hanhDong!.every((x) => x.canXacNhan && ct(x.idChuongTrinh!).maTruong === "QSC"));
  // Nêu ngành trong câu thì đi thẳng tới xác nhận
  const c = hoi("Thêm ngành Khoa học máy tính vào nguyện vọng", hu);
  assert.equal(c.hanhDong?.length, 1); assert.ok(/khoa học máy tính/i.test(ct(c.hanhDong![0].idChuongTrinh!).nganh));
  // Không có ngữ cảnh: hỏi
  const d = tra("Thêm trường này vào nguyện vọng");
  assert.ok(d.hoiLai && !d.hanhDong);
  // Nhiều trường ở lượt trước: hỏi trường nào
  const hh: TinNhan[] = [];
  hoi("Ở Hà Nội có trường nào dạy CNTT?", hh);
  const e = hoi("Thêm trường này vào nguyện vọng", hh);
  assert.ok(e.hoiLai && (e.luaChon?.length ?? 0) >= 2 && !e.hanhDong);
}

// F. Học phí: hiểu "thấp" là xếp hạng, không khớp chữ trong tên ngành. Chỉ học phí đã kiểm chứng mới có trong danh mục
// (src/data/hoc-phi-kiem-chung.ts); chưa có chương trình nào thì phải nói thẳng là chưa có dữ liệu, không xếp hạng từ số ước tính.
{
  const coHp = LUA_CHON_MAU.filter((l) => l.hocPhiMin !== undefined);
  const r = tra("Trường nào học phí thấp?");
  assert.ok(!/tầm thấp/.test(r.traLoi));
  if (coHp.length >= 3) {
    assert.equal(r.nguon.length, 3);
    const hp = r.nguon.map((id) => ct(id).hocPhiMin!);
    assert.deepEqual([...hp].sort((x, y) => x - y), hp, "tăng dần");
    assert.ok(r.nguon.every((id) => !ct(id).hocPhiUocTinh), "không xếp hạng từ học phí ước tính");
  } else {
    assert.equal(r.nguon.length, 0, "chưa có học phí đã kiểm chứng thì không có kết quả xếp hạng");
    assert.match(r.traLoi, /chưa có dữ liệu học phí/i);
    assert.equal(r.trangThaiDuLieu, "chua-co");
  }
  const t = tra("Ở Hà Nội học phí thấp ngành CNTT");
  for (const id of t.nguon) assert.ok(/công nghệ thông tin/i.test(ct(id).nganh) && ct(id).khuVuc === "Hà Nội" && ct(id).hocPhiMin !== undefined);
  if (coHp.length === 0) assert.equal(t.nguon.length, 0);
}

// G. Không số cứng, không khối lặp, không từ cấm, trả lời ngắn
{
  const nguonMa = ["lay-du-lieu.ts", "tro-ly-noi-bot.tsx", "tu-van.tsx", "cau-tra-loi.ts", "hieu-cau.ts"].map((f) => readFileSync(new URL(`../src/features/tu-van/${f}`, import.meta.url), "utf8")).join("\n");
  for (const cam of ["1,5–3,5 triệu", "300–800 nghìn", "60-35-5", "đảm bảo 100%", "Lợi thế cạnh tranh", "quy đổi thành điểm 10"]) assert.ok(!nguonMa.includes(cam), `còn số cứng: ${cam}`);
  const mauHs = taoHoSoMau();
  const uit = LUA_CHON_MAU.filter((l) => l.maTruong === "QSC").slice(0, 2).map((l) => l.id);
  const cau = ["Điểm chuẩn Khoa học máy tính UIT", "Nên bắt đầu tìm ngành từ đâu?", "Danh sách nguyện vọng của mình có cân bằng không?", "3 tầng là gì", "Trường đó học phí bao nhiêu?", "Ký túc xá UIT thế nào?", "IELTS 7.0 quy đổi thế nào?", "Làm sao tăng điểm", "xin chào bạn", "Ở Hà Nội có trường nào dạy CNTT?", "DTL là trường gì?"];
  for (const c of cau) {
    const r = traLoiTuDong(c, mauHs, null, uit, []);
    for (const cam of TU_CAM_UI) assert.ok(!new RegExp(`\\b${cam}\\b`, "i").test(r.traLoi), `từ cấm "${cam}" trong câu trả lời cho "${c}"`);
    assert.ok(!/⭐|🎯|🔥|🛡️|📋/u.test(r.traLoi), `biểu tượng cảm xúc trong câu trả lời cho "${c}"`);
    assert.ok(r.nguon.length <= 8);
    // Câu luật cứng giờ chỉ là dự phòng khi AI lỗi; bản dự phòng có thêm 3 chương trình kèm nguồn nên dài hơn bản cũ.
    assert.ok(r.traLoi.length <= 1600, `trả lời quá dài (${r.traLoi.length}) cho "${c}"`);
  }
  const ktx = traLoiTuDong("Ký túc xá UIT thế nào?", mauHs, null, [], []);
  assert.ok(/chưa có dữ liệu/.test(ktx.traLoi) && !/\d\s*(triệu|nghìn)/.test(ktx.traLoi), "chỗ ở: nói chưa có dữ liệu, không nêu giá");
  const ktxTruong = traLoiTuDong("Ký túc xá ĐH Thăng Long thế nào?", mauHs, null, [], []);
  assert.ok(ktxTruong.traLoi.includes("ĐH Thăng Long") && ktxTruong.the?.[0].ma === "DTL" && !ktxTruong.nguon.length, "chỗ ở: đúng trường được nêu, không khớp mờ sang trường khác");
  const dp = traLoiTuDong("Điểm chuẩn Khoa học máy tính UIT", mauHs, null, [], []);
  assert.ok(!/dự báo/i.test(dp.traLoi), "không dự báo khi chưa hỏi");
}

// H. Lịch sử lưu và đọc lại đúng các phần có cấu trúc, bỏ phần sai
{
  const tin = lamSachLichSu([{ vai: "mayChu", chu: "đáp", the: [{ ma: "DTV", id: "dtv-1", muc: "chinh-xac" }, { ma: 5 }, null], hanhDong: [{ loai: "them-nguyen-vong", idChuongTrinh: "x", nhan: "Thêm", canXacNhan: true }, { loai: "xoa-het", nhan: "x" }], hoiLai: "Ngành nào?", luaChon: [{ nhan: "A", cau: "B" }, { nhan: 1 }], trangThaiDuLieu: "lich-su", cho: { y: "co-hoi-diem", id: "q" } }]);
  assert.deepEqual(tin[0].the, [{ ma: "DTV", id: "dtv-1", muc: "chinh-xac" }]);
  assert.equal(tin[0].hanhDong?.length, 1); assert.equal(tin[0].hanhDong![0].loai, "them-nguyen-vong");
  assert.equal(tin[0].hoiLai, "Ngành nào?"); assert.deepEqual(tin[0].luaChon, [{ nhan: "A", cau: "B" }]);
  assert.equal(tin[0].trangThaiDuLieu, "lich-su"); assert.deepEqual(tin[0].cho, { y: "co-hoi-diem", id: "q" });
}

// I. Hợp đồng phản hồi từ máy chủ: hành động chỉ từ ID có thật; ý định rõ trả lời nội bộ, câu mở hỏi AI
{
  assert.ok(traLoiNoiBo("Thêm trường này vào nguyện vọng", []) && traLoiNoiBo("DTL là trường gì?", []) && traLoiNoiBo("Ở Vĩnh Long có trường nào dạy CNTT?", []));
  assert.ok(!traLoiNoiBo("Hãy giải thích vì sao ngành này được nhiều bạn chọn", []));
  const idThat = LUA_CHON_MAU.find((l) => l.maTruong === "QSC")!.id;
  const that = globalThis.fetch;
  let soLanGoi = 0;
  globalThis.fetch = (async () => { soLanGoi++; return { ok: true, status: 200, json: async () => ({
    traLoi: "Ngành này hợp nếu bạn thích lập trình.", nguon: [], tang: "llm", hoiLai: "Bạn muốn xem điểm chuẩn năm nào?", trangThaiDuLieu: "lich-su",
    thucThe: [{ loai: "truong", maTruong: "QSC" }, { loai: "truong", maTruong: "BIA" }],
    hanhDong: [{ loai: "xem-truong", maTruong: "QSC", nhan: "Xem trường" }, { loai: "xem-truong", maTruong: "BIA", nhan: "Bịa" }, { loai: "them-nguyen-vong", idChuongTrinh: idThat, nhan: "Thêm", canXacNhan: true }, { loai: "them-nguyen-vong", idChuongTrinh: "bia-123", nhan: "Thêm bịa", canXacNhan: true }],
  }) }; }) as unknown as typeof fetch;
  try {
    const tin = await layTinTraLoi({ cau: "Hãy giải thích vì sao ngành này được nhiều bạn chọn", truoc: [], s: trong, nguon: null, dungHoSo: true, manHinh: "Tư vấn chung" });
    assert.equal(soLanGoi, 1);
    assert.equal(tin.cheDo, "ai");
    assert.deepEqual(tin.the?.map((x) => x.ma), ["QSC"], "mã trường bịa bị bỏ");
    assert.deepEqual(tin.hanhDong?.map((h) => h.maTruong ?? h.idChuongTrinh), ["QSC", idThat], "hành động bịa bị bỏ");
    assert.equal(tin.hoiLai, "Bạn muốn xem điểm chuẩn năm nào?"); assert.equal(tin.trangThaiDuLieu, "lich-su");
    // Hành vi mới: tra cứu cũng hỏi AI trước; luật cứng chỉ là dự phòng có nhãn.
    soLanGoi = 0;
    const ai = await layTinTraLoi({ cau: "DTL là trường gì?", truoc: [], s: trong, nguon: null, dungHoSo: true, manHinh: "Tư vấn chung" });
    assert.equal(soLanGoi, 1); assert.equal(ai.cheDo, "ai");
    globalThis.fetch = (async () => { soLanGoi++; return { ok: false, status: 503, json: async () => ({ loi: "chua-cau-hinh" }) }; }) as unknown as typeof fetch;
    const noi = await layTinTraLoi({ cau: "DTL là trường gì?", truoc: [], s: trong, nguon: null, dungHoSo: true, manHinh: "Tư vấn chung" });
    assert.equal(noi.cheDo, "tuDong"); assert.equal(noi.the?.[0].ma, "DTL");
    assert.ok(noi.ghiChu?.startsWith("Câu trả lời dự phòng từ dữ liệu có sẵn, không phải AI"), "nhãn dự phòng");
    globalThis.fetch = (async () => ({ ok: false, status: 429, json: async () => ({ loi: "het-luot-ngay", luot: { con: 0, toiDa: 50 } }) })) as unknown as typeof fetch;
    const het = await layTinTraLoi({ cau: "DTL là trường gì?", truoc: [], s: trong, nguon: null, dungHoSo: true, manHinh: "Tư vấn chung" });
    assert.ok(het.ghiChu?.includes("hết lượt"));
  } finally { globalThis.fetch = that; }
}

// J. Gợi ý theo điểm và tỉnh thành, cùng với bộ lọc trường chưa có
{
  const rDiem = tra("24 điểm A00 CNTT ở TP.HCM nên chọn trường nào?");
  assert.ok(rDiem.traLoi.includes("chiến lược 3 tầng") || rDiem.traLoi.includes("Vừa sức / An toàn") || rDiem.traLoi.includes("Thử sức"), "phân nhóm gợi ý theo điểm");
  assert.ok(rDiem.the && rDiem.the.length > 0, "trả về danh sách thẻ trường phù hợp");

  // Kiểm tra không bắt nhầm trường đã có trong kho dữ liệu (như ĐH Bạc Liêu)
  const { tenTruongChuaCo } = await import("../src/features/tu-van/hieu-cau");
  assert.equal(tenTruongChuaCo("ĐH Bạc Liêu là bao nhiêu?"), null, "ĐH Bạc Liêu đã có trong kho dữ liệu");
  assert.equal(tenTruongChuaCo("ĐH Bạc Liêu lấy 15 điểm thôi đúng không?"), null, "ĐH Bạc Liêu có thật, không báo chưa có");
  assert.ok(tenTruongChuaCo("ĐH Harvard lấy điểm thế nào?") !== null, "ĐH nước ngoài không có trong kho");
}

console.log("OK tu-van-chat: ý định, trường, tỉnh, điểm, hành động");

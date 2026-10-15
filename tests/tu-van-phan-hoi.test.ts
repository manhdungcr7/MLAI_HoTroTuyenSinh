import "./nap-du-lieu"; // danh mục gốc nạp lười: phải xong trước các import còn lại
// Hợp đồng phản hồi có cấu trúc của Tư vấn AI: kiểm schema, id bịa, hành động đề xuất, số bịa, khóa cache. Chạy: npx tsx tests/tu-van-phan-hoi.test.ts
import assert from "node:assert/strict";
import { xuLy, type Env } from "../functions/api/tu-van";
import { khoaCache } from "../functions/_thu-vien/ai/cache";
import { NHAC_HE_THONG, docPhanHoiLLM, kiemTraPhanHoiCauTruc, kiemTraYeuCau, soLieuLech, type SuKien } from "../src/engine/tu-van";

const log = console.log; console.log = () => {};
const sk = (id: string, truong: string, diem = 26.5): SuKien => ({ id, nganh: "Khoa học máy tính", truong, tenTruong: `Trường ${truong}`, tinh: "Hà Nội", phuongThuc: "THPT", toHop: ["A00"], diem: { "2024": diem, "2023": diem - 0.5 }, nhanCuaEm: "Vừa sức", chenh: 0.8, tongCuaEm: 27.3, hocPhiTrieu: 30, nguon: "Đề án 2024" });
const du = [sk("a1", "BKA"), sk("a2", "QSC", 25)];
const cho = ["a1", "a2"];

// 1) Hợp đồng hợp lệ: giữ phần cấu trúc, gỡ thẻ nguồn
{
  const tho = JSON.stringify({
    intent: "tra-cuu", traLoi: "Điểm chuẩn 2024 của Khoa học máy tính tại Trường BKA là 26,5 điểm. [nguồn: a1]",
    thucThe: [{ loai: "truong", maTruong: "BKA" }, { loai: "nganh", maTruong: "SAI", idChuongTrinh: "a2" }],
    hanhDong: [{ loai: "xem-diem-chuan", idChuongTrinh: "a1", nhan: "Xem điểm chuẩn" }, { loai: "them-nguyen-vong", idChuongTrinh: "a2", nhan: "Thêm vào danh sách" }],
    trangThaiDuLieu: "lich-su",
  });
  const r = docPhanHoiLLM(tho, { duLieu: du }, cho);
  assert.equal(r.intent, "tra-cuu"); assert.deepEqual(r.nguon, ["a1"]); assert.ok(!r.traLoi.includes("nguồn"));
  assert.deepEqual(r.thucThe, [{ loai: "truong", maTruong: "BKA" }, { loai: "nganh", maTruong: "QSC", idChuongTrinh: "a2" }], "maTruong lấy lại từ dữ liệu, không tin mô hình");
  assert.equal(r.trangThaiDuLieu, "lich-su");
  const them = r.hanhDong!.find((h) => h.loai === "them-nguyen-vong")!;
  assert.equal(them.canXacNhan, true, "thêm nguyện vọng chỉ là đề xuất, cần client xác nhận");
}

// 2) Id bịa bị loại; hành động thiếu/ sai loại bị bỏ; không quá 3
{
  const o = kiemTraPhanHoiCauTruc({
    thucThe: [{ loai: "truong", maTruong: "XYZ" }, { loai: "nganh", idChuongTrinh: "bịa-1" }, { loai: "khac", maTruong: "BKA" }],
    hanhDong: [
      { loai: "xem-truong", maTruong: "XYZ", nhan: "Xem" },
      { loai: "xem-nganh", idChuongTrinh: "bịa-2", nhan: "Xem" },
      { loai: "xoa-du-lieu", idChuongTrinh: "a1", nhan: "Xóa" },
      { loai: "so-sanh", ids: ["a1", "bịa-3"], nhan: "So sánh" },
      { loai: "xem-nganh", idChuongTrinh: "a1" },
      { loai: "xem-truong", maTruong: "BKA", nhan: "Xem trường" },
    ],
    intent: "hack", trangThaiDuLieu: "chac-chan",
  }, du);
  assert.equal(o.thucThe, undefined); assert.deepEqual(o.hanhDong, [{ loai: "xem-truong", maTruong: "BKA", nhan: "Xem trường" }]);
  assert.equal(o.intent, undefined); assert.equal(o.trangThaiDuLieu, undefined);
  const ss = kiemTraPhanHoiCauTruc({ hanhDong: [{ loai: "so-sanh", ids: ["a1", "a2", "a1"], nhan: "So sánh 2" }] }, du);
  assert.deepEqual(ss.hanhDong![0].ids, ["a1", "a2"]);
  const nhieu = kiemTraPhanHoiCauTruc({ hanhDong: Array.from({ length: 6 }, () => ({ loai: "xem-truong", maTruong: "BKA", nhan: "Xem" })) }, du);
  assert.equal(nhieu.hanhDong!.length, 3);
}

// 3) Sai schema -> rơi về văn bản + nguồn cũ
{
  const vb = docPhanHoiLLM("Điểm là 26,5. [nguồn: a1, bịa]", { duLieu: du }, cho);
  assert.equal(vb.traLoi, "Điểm là 26,5."); assert.deepEqual(vb.nguon, ["a1"]); assert.equal(vb.hanhDong, undefined);
  const thieu = docPhanHoiLLM('{"intent":"tra-cuu","hanhDong":[]}', { duLieu: du }, cho);
  assert.equal(thieu.traLoi, "", "JSON không có traLoi: không hiện JSON thô, bậc trên báo lỗi"); assert.equal(thieu.intent, undefined);
  const sai = docPhanHoiLLM('{"traLoi": 5, "intent":"tra-cuu"}', { duLieu: du }, cho);
  assert.equal(sai.intent, undefined);
  const cat = docPhanHoiLLM('{"intent":"tra-cuu","traLoi":"Đã cắt [nguồn: a1]","thucThe":[{"loai":"tru', { duLieu: du }, cho);
  assert.equal(cat.traLoi, "Đã cắt"); assert.deepEqual(cat.nguon, ["a1"]);
  const hong = docPhanHoiLLM('{"intent":"tra-cu', { duLieu: du }, cho);
  assert.equal(hong.traLoi, "", "JSON cụt không có traLoi: để bậc trên báo lỗi, không hiện JSON thô");
  const rao = docPhanHoiLLM("```json\n" + JSON.stringify({ traLoi: "Ổn. [nguồn: a2]", hoiLai: "Bạn muốn ngành nào?" }) + "\n```", { duLieu: du }, cho);
  assert.equal(rao.traLoi, "Ổn."); assert.equal(rao.hoiLai, "Bạn muốn ngành nào?");
}

// 4) Hậu kiểm số liệu
{
  const y = { duLieu: du, hoSo: { toHopCaoNhat: { ma: "A00", tong: 27.3 } }, nguCanh: "NV1: thiếu 1,5 điểm" };
  assert.deepEqual(soLieuLech("Điểm chuẩn 2024 là 26,5 điểm, bạn hơn 0,8 điểm, học phí 30 triệu/năm.", y), []);
  assert.deepEqual(soLieuLech("Điểm chuẩn từ 25 đến 26,5 điểm (2023-2024).", y), []);
  assert.deepEqual(soLieuLech("Bạn còn thiếu 1,5 điểm so với NV1.", y), [], "số trong ngữ cảnh được phép");
  assert.deepEqual(soLieuLech("Điểm chuẩn 2024 là 28,75 điểm.", y), ["28,75"]);
  assert.deepEqual(soLieuLech("Học phí khoảng 45 triệu một năm.", y), ["45"]);
  assert.deepEqual(soLieuLech("Điểm chuẩn từ 24 đến 26,5 điểm.", y), ["24"]);
  assert.deepEqual(soLieuLech("Điểm chuẩn là 26,5. [nguồn: a1]", y), []);
}

// 5) Cả vòng máy chủ: số bịa thì không trả câu AI (422, app tự trả lời), không cache; số đúng thì trả kèm cấu trúc
{
  const m = new Map<string, string>();
  const kv = { get: async (k: string) => m.get(k) ?? null, put: async (k: string, v: string) => { m.set(k, v); } };
  let tra = "";
  const f = (async () => ({ ok: true, status: 200, json: async () => ({ content: [{ type: "text", text: tra }] }) })) as unknown as typeof fetch;
  const goi = async (cauHoi: string) => { const r = await xuLy(new Request("https://x/api/tu-van", { method: "POST", body: JSON.stringify({ cauHoi, duLieu: du }) }), { ANTHROPIC_API_KEY: "k", RATE_KV: kv } as Env, f); return { status: r.status, d: (await r.json()) as Record<string, unknown> }; };
  tra = JSON.stringify({ traLoi: "Điểm chuẩn 2024 là 29,9 điểm. [nguồn: a1]" });
  const bia = await goi("Điểm chuẩn BKA?");
  assert.equal(bia.status, 422); assert.equal(bia.d.loi, "so-lieu-khong-khop"); assert.equal(m.size - 1 >= 0 && [...m.keys()].filter((k) => k.startsWith("tvc")).length, 0, "không cache câu bị chặn");
  tra = JSON.stringify({ intent: "tra-cuu", traLoi: "Điểm chuẩn 2024 là 26,5 điểm. [nguồn: a1]", thucThe: [{ loai: "truong", maTruong: "BKA" }, { loai: "truong", maTruong: "MA-BIA" }], hanhDong: [{ loai: "them-nguyen-vong", idChuongTrinh: "a1", nhan: "Thêm vào" }] });
  const ok = await goi("Điểm chuẩn BKA năm 2024?");
  assert.equal(ok.status, 200); assert.equal(ok.d.traLoi, "Điểm chuẩn 2024 là 26,5 điểm."); assert.deepEqual(ok.d.nguon, ["a1"]);
  assert.deepEqual(ok.d.thucThe, [{ loai: "truong", maTruong: "BKA" }]);
  assert.equal((ok.d.hanhDong as { canXacNhan?: boolean }[])[0].canXacNhan, true);
  tra = "KHÔNG ĐƯỢC GỌI";
  const cache = await goi("điểm chuẩn bka năm 2024");
  assert.equal(cache.d.tang, "cache"); assert.deepEqual(cache.d.thucThe, ok.d.thucThe, "cache giữ cả phần cấu trúc");
}

// 6) Khóa cache đổi khi đổi lời nhắc; yêu cầu đã làm sạch số vô lý
{
  const a = await khoaCache("x y z", [{ id: "a1" }], null, "v1");
  assert.equal(a, await khoaCache("x y z", [{ id: "a1" }], null, "v1", "", NHAC_HE_THONG));
  assert.notEqual(a, await khoaCache("x y z", [{ id: "a1" }], null, "v1", "", NHAC_HE_THONG + " thêm"));
  assert.ok(a.startsWith("tvc4:"), "đổi phiên bản logic làm vô hiệu cache cũ");
  const k = kiemTraYeuCau({ cauHoi: "điểm chuẩn?", duLieu: [{ ...sk("a1", "BKA"), chenh: 1e9, hocPhiTrieu: -5, hocPhiMaxTrieu: 99999, tiLeViecLam: 250 }] });
  assert.ok(k.ok);
  if (k.ok) { const d = k.v.duLieu[0]; assert.equal(d.chenh, undefined); assert.equal(d.hocPhiTrieu, undefined); assert.equal(d.hocPhiMaxTrieu, undefined); assert.equal(d.tiLeViecLam, undefined); }
}

// 7) Lời nhắc: ngắn gọn, không ép persona cũ, không hardcode danh sách trường
{
  for (const cam of ["chuyên gia", "3 tầng", "sâu sắc", "vượt trội"]) assert.ok(!NHAC_HE_THONG.includes(cam), `lời nhắc còn "${cam}"`);
  for (const can of ["120 từ", "Tối đa 3 kết quả", "MỘT câu", "tên đầy đủ", "TƯ LIỆU"]) assert.ok(NHAC_HE_THONG.includes(can), `lời nhắc thiếu "${can}"`);
  assert.ok(!/\b(BKA|KHA|QSC|UIT|NEU|FTU)\b/.test(NHAC_HE_THONG), "không hardcode mã trường");
}

console.log = log;
console.log("tu-van-phan-hoi: tất cả kiểm tra đều qua");

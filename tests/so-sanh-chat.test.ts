import "./nap-du-lieu"; // danh mục gốc nạp lười: phải xong trước các import còn lại
// Kiểm thử bảng so sánh trong khung chat và nhận diện tên trường/ngành khi so sánh.
// Chạy: npx tsx tests/so-sanh-chat.test.ts
import assert from "node:assert/strict";
import { tim } from "../src/data/lua-chon-mau";
import { diemDayDu } from "../src/features/kham-pha/to-hop";
import { DIEM_SAN, dungBangSoSanh, laDiemSan, tomTatChoAI, tomTatKhongAI } from "../src/features/tu-van/bang-so-sanh";
import { traLoiTuDong } from "../src/features/tu-van/lay-du-lieu";
import { timTruongTrongCau } from "../src/features/tu-van/hieu-cau";
import { NHAC_SO_SANH, NHAC_TU_VAN, canTimWeb, dungNoiDung, kiemTraYeuCau, soLieuLech } from "../src/engine/tu-van";
import { resolveTruong } from "../src/engine/truong";
import { taoHoSoMau } from "../src/state/mau";
import { goLienKetWeb, cauNhacDiemChuan } from "../functions/_thu-vien/ai/bac-thang";

const s = taoHoSoMau("minhAnh");
const diem = diemDayDu(s);
const ma = (c: string) => timTruongTrongCau(c).map((t) => t.kq.ma);

// 1) Tên trường: "ngoại thương" là trường chính (NTH), cơ sở TP.HCM (NTS) không chiếm tên chung
assert.equal(resolveTruong("ngoai thuong").ma, "NTH", "ngoại thương = trường chính");
assert.equal(resolveTruong("ftu").kieu, "mo-ho", "FTU vẫn mơ hồ giữa hai cơ sở (quyết định sản phẩm cũ)");
assert.equal(resolveTruong("ngoai thuong co so 2").ma, "NTS", "cơ sở 2 vẫn nhận được");

// 2) Tên ngành đứng sau chữ "ngành" không bị nhận là trường (Thương mại điện tử ≠ Trường Đại học Thương mại)
{
  const r = traLoiTuDong("So sánh DTL và QSC ngành Thương mại điện tử", s, null, [], []);
  assert.ok(r.soSanh, "vẫn dựng bảng");
  assert.deepEqual(r.soSanh!.ids.map((i) => tim(i)!.maTruong).sort(), ["DTL", "QSC"], "không nhận TMU từ tên ngành");
}

// 3) Ngành gọi trước tên trường vẫn tìm đủ trường
assert.deepEqual(ma("So sánh ngành Công nghệ thông tin ở Công nghệ Sài Gòn, Văn Lang và Hoa Sen").length, 3);

// 4) Tỉnh không bị coi là tên trường
assert.ok(timTruongTrongCau("Ở Hà Nội học phí thấp ngành CNTT").every((t) => t.kq.ma !== "NHF"), "\"Hà Nội học\" không phải Đại học Hà Nội");

// 5) So hai trường có ngành rõ ràng: bảng + nút mở so sánh
{
  const r = traLoiTuDong("So sánh HUTECH và UEF ngành Công nghệ thông tin", s, null, [], []);
  assert.ok(r.soSanh && r.soSanh.ids.length === 2, "có bảng so sánh");
  assert.ok(r.hanhDong?.some((h) => h.loai === "so-sanh"), "có nút mở so sánh chi tiết");
  assert.ok(!/nghiêng|chắc đỗ/i.test(r.traLoi), "không nói nghiêng về trường nào khi chưa đủ dữ liệu");
}

// 6) Chưa nêu ngành: vẫn hỏi lại ngành, không tự mở so sánh, và có gợi ý ngành để bấm
{
  const r = traLoiTuDong("So sánh ĐH Thăng Long và UIT", s, null, [], []);
  assert.ok(r.hoiLai && (r.luaChon?.length ?? 0) > 0, "hỏi lại ngành và đưa gợi ý");
  assert.ok(!r.hanhDong, "không có hành động tự động");
  assert.ok(r.soSanh, "vẫn có bảng ngành chung làm điểm bắt đầu");
}

// 7) Bảng: mức sàn được gọi đúng tên và không tuyên bố "dễ vào hơn"
{
  const ls = ["dkc", "uef"].map((m) => tim(`${m}-02f3478b`) ?? tim(`${m}-24028cf1`)).filter((x): x is NonNullable<typeof x> => !!x);
  const sans = ls.filter(laDiemSan);
  if (sans.length === ls.length && ls.length === 2) {
    const bang = dungBangSoSanh(ls, diem);
    assert.ok(bang.luuY.some((x) => x.includes(String(DIEM_SAN))), "lưu ý nêu mức sàn");
    assert.ok(!/dễ vào hơn|khó vào hơn/i.test(tomTatKhongAI(bang).replace(/không cho thấy trường nào khó vào hơn/i, "")), "không suy ra trường khó hơn từ mức sàn");
  }
  const bang2 = dungBangSoSanh(ls, diem);
  assert.equal(bang2.cot.length, 2);
  assert.ok(bang2.hang.some((h) => h.khoa === "hocPhi"), "có dòng học phí");
  const tom = tomTatChoAI(bang2);
  assert.ok(tom.startsWith("CÁC LỰA CHỌN:"), "bản gọn có tên các lựa chọn");
  assert.ok(tom.length <= 1800, "bản gửi AI có giới hạn");
}

// 8) Yêu cầu AI giữ bảng, và dữ liệu gửi AI có bảng thì dùng lời nhắc so sánh
{
  const k = kiemTraYeuCau({ cauHoi: "So sánh hai trường giúp mình nhé", duLieu: [], bangSoSanh: "CÁC LỰA CHỌN: A=..." });
  assert.ok(k.ok && k.v.bangSoSanh?.startsWith("CÁC LỰA CHỌN"), "máy chủ nhận bảng");
  const dai = kiemTraYeuCau({ cauHoi: "So sánh hai trường giúp mình", duLieu: [], bangSoSanh: "x".repeat(5000) });
  assert.ok(dai.ok && (dai.v.bangSoSanh?.length ?? 0) <= 1800, "bảng bị cắt, không gửi quá dài");
  const noi = dungNoiDung({ cauHoi: "so sánh", duLieu: [], bangSoSanh: "CÁC LỰA CHỌN: A=X; B=Y" });
  assert.ok(noi.includes("BẢNG SO SÁNH"), "nội dung gửi AI có bảng");
  assert.ok(NHAC_SO_SANH.includes("Không thêm điểm chuẩn"), "lời nhắc so sánh cấm bịa số");
  assert.ok(NHAC_TU_VAN.includes("KIẾN THỨC CHUNG") && NHAC_TU_VAN.includes("SỐ LIỆU TUYỂN SINH"), "lời nhắc tư vấn mở tách số liệu và kiến thức chung");
  // Số trong bảng và hiệu giữa các số trong bảng không bị coi là bịa
  const lech = soLieuLech("Học phí HUTECH 38 triệu, UEF 68 triệu, chênh 30 triệu.", { duLieu: [], bangSoSanh: "A: 38 triệu | B: 68 triệu" });
  assert.deepEqual(lech, [], "số trong bảng và hiệu của chúng được chấp nhận");
}

// 9) Tìm web: chỉ khi câu hỏi định tính, không cho số liệu tuyển sinh
assert.equal(canTimWeb("Học bổng của HUTECH năm 2026 có những loại nào?"), true);
assert.equal(canTimWeb("Ký túc xá Bách Khoa có đủ chỗ không?"), true);
assert.equal(canTimWeb("Điểm chuẩn ngành CNTT Bách Khoa 2025 là bao nhiêu?"), false, "điểm chuẩn chỉ từ dữ liệu của app");
assert.equal(canTimWeb("Học phí HUTECH bao nhiêu?"), false);

// 10) Nguồn web: link markdown được gỡ, con số điểm chuẩn từ web không được coi là nguồn
assert.equal(goLienKetWeb("Học bổng 25% ([hutech.edu.vn](https://hutech.edu.vn/x)). Hết."), "Học bổng 25%. Hết.");
assert.equal(cauNhacDiemChuan("Học bổng 25%. Điểm chuẩn 27 năm 2025. Hết."), "Điểm chuẩn 27 năm 2025.");

console.log("so-sanh-chat: tất cả kiểm tra đều qua");

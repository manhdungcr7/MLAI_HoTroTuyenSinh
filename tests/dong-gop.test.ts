import assert from "node:assert/strict";
import {
  LOAI_CHI_QTV_DUYET, NHAN_CONG_DONG, NHAN_LOAI, coQuyenSuaTruong, coThongTinCaNhan, duocDatTrangThai, dungBanChup, hopLeMa, khopPhienBan, kiemTraBaoSai,
  kiemTraBanGhiTruong, kiemTraLink, kiemTraThongTin, lamSachChu, thongTinCuaTruong, tienDoTruong, tomTatTruong, type KieuLink, type ThongTinTruong,
} from "../src/data/dong-gop-kiem-tra";
import { banChupGoc, docBanChupAnToan, nhomCuaTruong, thongTinTruong } from "../src/data/dong-gop";
import { NGAY_CO_DINH, ngayThu } from "./ngay-co-dinh";

// ---- kiemTraLink
const tu = (u: string, k?: KieuLink) => kiemTraLink(u, k);
assert.equal(tu("http://facebook.com/groups/abc").ok, false, "http bị từ chối");
assert.equal(tu("ftp://facebook.com/x").ok, false);
assert.equal(tu("javascript:alert(1)").ok, false);
assert.equal(tu("https://user:pass@facebook.com/groups/abc").ok, false, "user:pass@ bị từ chối");
assert.equal(tu("https://user@facebook.com/groups/abc").ok, false);
assert.equal(tu("https://evil.com/groups/abc").ok, false, "tên miền lạ");
assert.equal(tu("https://facebook.com.evil.com/x").ok, false, "đuôi giả mạo");
assert.equal(tu("https://notfacebook.com/x").ok, false);
assert.equal(tu("https://evil.com/.edu.vn").ok, false);
assert.equal(tu("https://xedu.vn").ok, false, "chỉ nhận subdomain .edu.vn");
assert.equal(tu("https://edu.vn").ok, false);
assert.equal(tu("https://facebook.com:8443/x").ok, false, "cổng lạ");
assert.equal(tu("https://facebook.com/a\u0000b").ok, false, "ký tự điều khiển");
assert.equal(tu("https://facebook.com/a\nb").ok, false);
assert.equal(tu("https://facebook.com/a b").ok, false);
assert.equal(tu("").ok, false);
assert.equal(tu("không phải link").ok, false);
assert.equal(kiemTraLink(123 as never).ok, false);
assert.equal(tu("https://facebook.com/groups/" + "a".repeat(300)).ok, false, "dài quá 300");
assert.equal(tu("https://facebook.com/groups/" + "a".repeat(260)).ok, true, "vừa đủ thì được");
assert.equal(tu("https://hust.gov.vn/x").ok, false, "bat-ky không nhận gov.vn");

const nhom = tu("https://www.facebook.com/groups/k2k8.tuyensinh/?utm_source=x&fbclid=abc#anchor", "facebook");
assert.ok(nhom.ok && nhom.loai === "nhomFacebook");
assert.ok(nhom.ok && !nhom.url.includes("fbclid") && !nhom.url.includes("utm_") && !nhom.url.includes("#"), "bỏ tham số theo dõi và fragment");
const trangFb = tu("https://m.facebook.com/truongabc");
assert.ok(trangFb.ok && trangFb.loai === "facebook");
assert.ok(tu("https://fb.watch/xyz").ok);
const zalo = tu("https://zalo.me/g/abcxyz", "facebook");
assert.ok(zalo.ok && zalo.loai === "zalo");
const edu = tu("https://tuyensinh.hust.edu.vn/", "website");
assert.ok(edu.ok && edu.loai === "edu", "subdomain edu.vn được");
assert.ok(tu("HTTPS://FaceBook.COM/groups/ABC").ok, "hoa thường tên miền");

// fanpage / website / nguồn chính thức / công khai
assert.ok(tu("https://facebook.com/truongabc", "fanpage").ok);
assert.equal(tu("https://zalo.me/g/abc", "fanpage").ok, false, "fanpage không nhận zalo");
assert.equal(tu("https://hust.edu.vn", "fanpage").ok, false);
assert.equal(tu("https://hust.edu.vn", "facebook").ok, false, "ô nhóm không nhận edu.vn");
assert.ok(tu("https://truongabc.com.vn/tuyen-sinh", "website").ok, "website https không edu.vn vẫn nhận");
assert.equal(tu("https://truongabc.com.vn", "bat-ky").ok, false, "bat-ky vẫn chỉ nhận danh sách cho phép");
assert.equal(tu("https://facebook.com/truongabc", "website").ok, false, "website không phải Facebook");
assert.equal(tu("https://192.168.1.1/x", "website").ok, false, "địa chỉ IP");
assert.equal(tu("https://localhost/x", "website").ok, false);
assert.equal(tu("https://may.local/x", "website").ok, false);
assert.equal(tu("https://bit.ly/abc", "website").ok, false, "trình rút gọn");
assert.ok(tu("https://hust.edu.vn/hoc-phi", "nguonChinhThuc").ok);
assert.ok(tu("https://sogd.gov.vn/x", "nguonChinhThuc").ok, "gov.vn");
assert.ok(tu("https://www.facebook.com/truongabc/posts/123", "nguonChinhThuc").ok, "bài trên fanpage");
assert.equal(tu("https://facebook.com/groups/abc/posts/1", "nguonChinhThuc").ok, false, "nhóm không phải nguồn chính thức");
assert.equal(tu("https://zalo.me/g/abc", "nguonChinhThuc").ok, false);
assert.equal(tu("https://baomoi.com/x", "nguonChinhThuc").ok, false);
assert.ok(tu("https://vnexpress.net/bai-viet", "congKhai").ok, "luu_y nhận https công khai");
assert.ok(tu("https://facebook.com/groups/abc", "congKhai").ok);
for (const rg of ["https://bit.ly/x", "https://tinyurl.com/x", "https://t.co/x", "https://goo.gl/x", "https://www.bit.ly/x"]) assert.equal(tu(rg, "congKhai").ok, false, `rút gọn: ${rg}`);
assert.equal(tu("http://vnexpress.net", "congKhai").ok, false);

// ---- lamSachChu
assert.equal(lamSachChu("  Xin   chào\n\tbạn  ", 50), "Xin chào bạn");
assert.equal(lamSachChu("<script>alert(1)</script>Chào <b>bạn</b>", 50), "alert(1) Chào bạn", "bỏ thẻ HTML");
assert.equal(lamSachChu("a\u0000b\u0007c", 50), "a b c", "bỏ ký tự điều khiển");
assert.equal(lamSachChu("abcdef", 3), "abc");
assert.equal(lamSachChu("😀😀😀", 2), "😀😀", "không cắt đôi emoji");
assert.equal(lamSachChu(42, 5), "");
assert.ok(!lamSachChu("1 < 2 > 0", 20).match(/[<>]/), "không còn dấu ngoặc nhọn");

// ---- hopLeMa
assert.equal(hopLeMa("BKA", new Set(["BKA", "NEU"])), true);
assert.equal(hopLeMa("XXX", new Set(["BKA"])), false, "mã không tồn tại");
assert.equal(hopLeMa("BKA", ["BKA"]), true);
assert.equal(hopLeMa("", ["BKA"]), false);
assert.equal(hopLeMa(5, ["BKA"]), false);

// ---- kênh của trường
const TRUONG = new Set(["BKA", "NEU"]);
const NGANH = new Set(["bka-cntt", "neu-kt"]);
const t1 = kiemTraBanGhiTruong({
  maTruong: "BKA", fanpageUrl: "https://facebook.com/dhbk", nhomTuyenSinhChinhThucUrl: "https://zalo.me/g/bk", nhomCongDongUrl: "https://facebook.com/groups/k68?fbclid=1",
  websiteTuyenSinhUrl: "https://ts.hust.edu.vn", ghiChu: "  <i>Kênh</i> chính thức  ",
}, { tapTruong: TRUONG });
assert.ok(t1.ok && t1.duLieu.ghiChu === "Kênh chính thức" && t1.duLieu.nhomCongDongUrl === "https://facebook.com/groups/k68");
const t2 = kiemTraBanGhiTruong({ maTruong: "ZZZ" }, { tapTruong: TRUONG });
assert.ok(!t2.ok && t2.loi.maTruong === "Không có trường với mã này", "mã trường không tồn tại");
const t3 = kiemTraBanGhiTruong({ maTruong: "BKA", fanpageUrl: "https://hust.edu.vn", nhomCongDongUrl: "http://facebook.com/groups/x", nhomTuyenSinhChinhThucUrl: "https://evil.com", websiteTuyenSinhUrl: "https://bit.ly/x" });
assert.ok(!t3.ok && t3.loi.fanpageUrl && t3.loi.nhomCongDongUrl && t3.loi.nhomTuyenSinhChinhThucUrl && t3.loi.websiteTuyenSinhUrl, "lỗi từng ô");
assert.ok(!kiemTraBanGhiTruong({ maTruong: "BKA", ghiChu: "a".repeat(301) }).ok);
assert.ok(!kiemTraBanGhiTruong({ maTruong: "BKA", ghiChu: "gọi 0912345678" }).ok, "ghi chú cấm số điện thoại");
assert.ok(!kiemTraBanGhiTruong(null).ok);
assert.ok(!kiemTraBanGhiTruong({ maTruong: "../x" }).ok, "mã có ký tự lạ");
const t5 = kiemTraBanGhiTruong({ maTruong: "BKA", fanpageUrl: "", ghiChu: "" });
assert.ok(t5.ok && Object.keys(t5.duLieu).length === 1, "ô để trống thì bỏ");

// ---- thông tin theo loại
const NGUON = "https://ts.hust.edu.vn/hoc-phi-2025";
const khung = { id: "x1", maTruong: "BKA", trangThai: "cho", linkNguon: NGUON, nam: 2025 };
const hp = (duLieu: Record<string, unknown> = {}, ngoai: Record<string, unknown> = {}) =>
  ({ ...khung, id: "hp1", loai: "hoc_phi", duLieu: { donVi: "trieu_nam", mucThap: 20, mucCao: 30, phamVi: "Chương trình đại trà", ...duLieu }, ...ngoai });
const hb = (duLieu: Record<string, unknown> = {}, ngoai: Record<string, unknown> = {}) =>
  ({ ...khung, id: "hb1", loai: "hoc_bong", duLieu: { ten: "Học bổng khuyến khích", giaTri: "50% học phí", dieuKien: "Điểm đầu vào từ 27", ...duLieu }, ...ngoai });
const nlt = (duLieu: Record<string, unknown> = {}, ngoai: Record<string, unknown> = {}) =>
  ({ ...khung, id: "nlt1", loai: "noi_luu_tru", linkNguon: undefined, duLieu: { coKyTucXa: "co", giaKyTucThang: [300, 500], khuTroXungQuanh: "nhieu", giaTroThang: [1500, 2500], khoangCachKm: 1.5, ...duLieu }, ...ngoai });
const rv = (duLieu: Record<string, unknown> = {}, ngoai: Record<string, unknown> = {}) =>
  ({ ...khung, id: "rv1", loai: "review", linkNguon: undefined, nam: undefined, duLieu: { tieuDe: "Kinh nghiệm thi", noiDung: "Đề năm nay thiên về ứng dụng.", nguoiVietLa: "sinh_vien", ...duLieu }, ...ngoai });
const ly = (duLieu: Record<string, unknown> = {}, ngoai: Record<string, unknown> = {}) =>
  ({ ...khung, id: "ly1", loai: "luu_y", linkNguon: "https://vnexpress.net/bai", duLieu: { tieuDe: "Cẩn thận lừa đảo", noiDung: "Có kẻ giả danh nhà trường thu tiền.", ...duLieu }, ...ngoai });
const kt = (x: unknown) => kiemTraThongTin(x, { tapTruong: TRUONG, bayGio: NGAY_CO_DINH });
const loiCua = (x: unknown) => { const r = kt(x); assert.ok(!r.ok, "phải bị từ chối"); return (r as { ok: false; loi: Record<string, string> }).loi; };

// chung
const okHp = kt(hp());
assert.ok(okHp.ok && okHp.duLieu.loai === "hoc_phi" && okHp.duLieu.phienBan === 1 && okHp.duLieu.nam === 2025 && okHp.duLieu.luc === NGAY_CO_DINH.toISOString());
assert.equal(loiCua(hp({}, { maTruong: "ZZZ" })).maTruong, "Không có trường với mã này");
assert.ok(loiCua(hp({}, { loai: "canh_bao" })).loai, "tên loại cũ không còn");
assert.ok(loiCua(hp({}, { loai: "ky_tuc_xa" })).loai, "tên loại cũ không còn");
assert.ok(loiCua(hp({}, { id: undefined })).id, "thiếu id");
const taoId = kiemTraThongTin(hp({}, { id: undefined }), { taoId: () => "moi-1" });
assert.ok(taoId.ok && taoId.duLieu.id === "moi-1");
const macDinh = kt(hp({}, { trangThai: undefined }));
assert.ok(macDinh.ok && macDinh.duLieu.trangThai === "nhap", "mặc định là nháp");
assert.ok(loiCua(hp({}, { trangThai: "xoa" })).trangThai);
assert.ok(loiCua(hp({}, { phienBan: 0 })).phienBan);
assert.ok(loiCua(hp({}, { phienBan: "2" })).phienBan);
assert.ok(loiCua(hp({}, { duLieu: undefined })).duLieu, "thiếu duLieu");
assert.ok(loiCua(hp({}, { duLieu: "chuỗi" })).duLieu);
assert.ok(loiCua("rác").chung);
const sach = kt(hp({ phamVi: "<b>Đại trà</b>  nhóm 1", extraRac: "bị bỏ" }));
assert.ok(sach.ok && (sach.duLieu.duLieu as { phamVi: string }).phamVi === "Đại trà nhóm 1" && !("extraRac" in sach.duLieu.duLieu), "làm sạch, bỏ trường lạ");

// hoc_phi
assert.equal(loiCua(hp({ mucCao: 10 }))["duLieu.mucCao"], "Mức cao phải lớn hơn hoặc bằng mức thấp");
assert.ok(kt(hp({ mucThap: 25, mucCao: 25 })).ok, "bằng nhau thì được");
assert.ok(loiCua(hp({ mucThap: -1 }))["duLieu.mucThap"]);
assert.ok(loiCua(hp({ mucThap: "abc" }))["duLieu.mucThap"]);
assert.ok(loiCua(hp({ mucThap: Infinity }))["duLieu.mucThap"]);
assert.ok(loiCua(hp({ mucCao: 99999 }))["duLieu.mucCao"]);
assert.ok(kt(hp({ mucThap: "20,5".replace(",", "."), mucCao: "30" })).ok, "số gửi dạng chuỗi số vẫn nhận");
assert.ok(loiCua(hp({ donVi: "trieu_thang" }))["duLieu.donVi"]);
assert.ok(loiCua(hp({ donVi: undefined }))["duLieu.donVi"]);
assert.ok(kt(hp({ donVi: "trieu_tin_chi", mucThap: 0.5, mucCao: 0.7 })).ok);
assert.ok(loiCua(hp({ phamVi: "a".repeat(81) }))["duLieu.phamVi"]);
assert.ok(kt(hp({ phamVi: "a".repeat(80) })).ok);
assert.ok(loiCua(hp({ phamVi: "" }))["duLieu.phamVi"], "thiếu phạm vi");
assert.ok(loiCua(hp({ loTrinhTang: "a".repeat(121) }))["duLieu.loTrinhTang"]);
assert.ok(kt(hp({ loTrinhTang: "Tăng 10% mỗi năm", ghiChu: "Chưa gồm bảo hiểm" })).ok);
assert.ok(loiCua(hp({ ghiChu: "a".repeat(301) }))["duLieu.ghiChu"]);
assert.ok(loiCua(hp({}, { nam: undefined })).nam, "thiếu năm");
const namTrongDuLieu = kt(hp({ nam: 2024 }, { nam: undefined }));
assert.ok(namTrongDuLieu.ok && namTrongDuLieu.duLieu.nam === 2024, "nam đặt trong duLieu cũng nhận");
assert.ok(!("nam" in (namTrongDuLieu.ok ? namTrongDuLieu.duLieu.duLieu : {})), "nam không nằm trong duLieu đầu ra");
assert.ok(loiCua(hp({ nam: 2023 }, { nam: 2025 })).nam, "năm hai nơi lệch nhau");
assert.ok(loiCua(hp({}, { nam: 1999 })).nam);
assert.ok(loiCua(hp({}, { nam: 2025.5 })).nam);
assert.ok(loiCua(hp({}, { nam: 2040 })).nam, "năm quá xa");
assert.ok(kt(hp({}, { nam: "2025" })).ok);
assert.ok(loiCua(hp({}, { linkNguon: undefined })).linkNguon, "thiếu nguồn");
assert.ok(loiCua(hp({}, { linkNguon: "http://ts.hust.edu.vn/x" })).linkNguon, "http");
assert.ok(loiCua(hp({}, { linkNguon: "https://facebook.com/groups/abc/posts/1" })).linkNguon, "nhóm không phải nguồn chính thức");
assert.ok(loiCua(hp({}, { linkNguon: "https://baomoi.com/x" })).linkNguon, "báo không phải nguồn chính thức");
assert.ok(loiCua(hp({}, { linkNguon: "https://bit.ly/x" })).linkNguon);
assert.ok(kt(hp({}, { linkNguon: "https://sogd.gov.vn/x" })).ok, "gov.vn");
assert.ok(kt(hp({}, { linkNguon: "https://facebook.com/dhbk/posts/1" })).ok, "bài trên fanpage");
assert.ok(loiCua(hp({ phamVi: "Gọi 0912345678" }))["duLieu.phamVi"], "cấm số điện thoại trong chuỗi con");

// hoc_bong
assert.ok(kt(hb({ hanNop: "30/08/2025" })).ok);
assert.ok(loiCua(hb({ ten: "a".repeat(101) }))["duLieu.ten"]);
assert.ok(loiCua(hb({ giaTri: "a".repeat(101) }))["duLieu.giaTri"]);
assert.ok(loiCua(hb({ dieuKien: "a".repeat(301) }))["duLieu.dieuKien"]);
assert.ok(loiCua(hb({ hanNop: "a".repeat(41) }))["duLieu.hanNop"]);
assert.ok(loiCua(hb({ ten: "" }))["duLieu.ten"]);
assert.ok(loiCua(hb({}, { linkNguon: undefined })).linkNguon, "hoc_bong bắt buộc nguồn");
assert.ok(kt(hb({}, { nam: undefined })).ok, "hoc_bong không bắt buộc năm");

// noi_luu_tru
const okNlt = kt(nlt());
assert.ok(okNlt.ok && okNlt.duLieu.loai === "noi_luu_tru" && okNlt.duLieu.linkNguon === undefined, "không bắt buộc nguồn và năm");
assert.ok(loiCua(nlt({ coKyTucXa: "maybe" }))["duLieu.coKyTucXa"]);
assert.ok(loiCua(nlt({ khuTroXungQuanh: undefined }))["duLieu.khuTroXungQuanh"]);
assert.ok(kt(nlt({ coKyTucXa: "chua_ro", khuTroXungQuanh: "chua_ro", giaKyTucThang: undefined, giaTroThang: undefined, khoangCachKm: undefined })).ok, "chỉ cần hai ô bắt buộc");
assert.ok(loiCua(nlt({ giaKyTucThang: [500, 300] }))["duLieu.giaKyTucThang"], "thấp > cao");
assert.ok(loiCua(nlt({ giaTroThang: [100] }))["duLieu.giaTroThang"], "thiếu một số");
assert.ok(loiCua(nlt({ giaTroThang: "1500" }))["duLieu.giaTroThang"]);
assert.ok(loiCua(nlt({ giaTroThang: [-1, 5] }))["duLieu.giaTroThang"]);
assert.ok(loiCua(nlt({ khoangCachKm: -1 }))["duLieu.khoangCachKm"]);
assert.ok(loiCua(nlt({ khoangCachKm: 9999 }))["duLieu.khoangCachKm"]);
assert.ok(loiCua(nlt({ ghiChu: "a".repeat(301) }))["duLieu.ghiChu"]);
assert.ok(kt(nlt({ coKyTucXa: "khong" }, { linkNguon: "https://facebook.com/groups/k68" })).ok, "nguồn tùy chọn, nhận Facebook");

// review
const okRv = kt(rv());
assert.ok(okRv.ok && okRv.duLieu.loai === "review");
assert.ok(kt(rv({ nguoiVietLa: undefined })).ok);
assert.ok(loiCua(rv({ nguoiVietLa: "giao_vien" }))["duLieu.nguoiVietLa"]);
assert.ok(kt(rv({}, { linkNguon: "https://zalo.me/g/abc" })).ok, "review nhận zalo");
assert.ok(kt(rv({}, { linkNguon: "https://facebook.com/groups/bk/posts/1" })).ok, "review nhận Facebook");
assert.ok(kt(rv({}, { linkNguon: "https://hust.edu.vn/x" })).ok, "review nhận edu.vn");
assert.ok(loiCua(rv({}, { linkNguon: "https://baomoi.com/x" })).linkNguon, "review không nhận tên miền lạ");
assert.ok(loiCua(rv({ tieuDe: "a".repeat(121) }))["duLieu.tieuDe"], "tiêu đề quá 120");
assert.ok(kt(rv({ tieuDe: "a".repeat(120) })).ok);
assert.ok(loiCua(rv({ noiDung: "a".repeat(601) }))["duLieu.noiDung"], "nội dung quá 600");
assert.ok(kt(rv({ noiDung: "a".repeat(600) })).ok);
assert.ok(loiCua(rv({ tieuDe: "<b></b>" }))["duLieu.tieuDe"], "tiêu đề chỉ có thẻ thì rỗng");
const rvHtml = kt(rv({ tieuDe: "<b>Hay</b> lắm" }));
assert.ok(rvHtml.ok && (rvHtml.duLieu.duLieu as { tieuDe: string }).tieuDe === "Hay lắm", "HTML bị bỏ");

// luu_y
assert.ok(kt(ly()).ok);
assert.ok(loiCua(ly({}, { linkNguon: undefined })).linkNguon, "luu_y bắt buộc nguồn");
assert.ok(loiCua(ly({}, { nam: undefined })).nam, "luu_y bắt buộc năm");
assert.ok(loiCua(ly({}, { linkNguon: "http://vnexpress.net/x" })).linkNguon);
assert.ok(loiCua(ly({}, { linkNguon: "https://bit.ly/abc" })).linkNguon, "luu_y cấm link rút gọn");
assert.ok(loiCua(ly({}, { linkNguon: "https://tinyurl.com/abc" })).linkNguon);
assert.ok(kt(ly({}, { linkNguon: "https://www.baomoi.com/bai-viet" })).ok, "luu_y nhận mọi https công khai");
assert.ok(loiCua(ly({}, { linkNguon: "https://localhost/x" })).linkNguon);

// khac
assert.ok(kt({ ...khung, id: "k1", loai: "khac", linkNguon: undefined, nam: undefined, duLieu: { tieuDe: "Ghi chú", noiDung: "Có kỳ thi riêng." } }).ok);
assert.ok(loiCua({ ...khung, id: "k1", loai: "khac", duLieu: { tieuDe: "Ghi chú" } })["duLieu.noiDung"]);

// cấm thông tin cá nhân và link trong chữ, ở mọi loại
for (const xau of ["Gọi 0912 345 678 để hỏi", "Zalo 0912.345.678", "SĐT 091-234-5678", "liên hệ +84 912345678", "mail: banA@gmail.com", "84912345678"]) {
  const l1 = loiCua(rv({ noiDung: xau }));
  assert.ok(l1["duLieu.noiDung"], `từ chối: ${xau}`);
  assert.ok(loiCua(hb({ dieuKien: xau }))["duLieu.dieuKien"], `hoc_bong từ chối: ${xau}`);
  assert.ok(loiCua(ly({ noiDung: xau }))["duLieu.noiDung"], `luu_y từ chối: ${xau}`);
  assert.ok(loiCua(nlt({ ghiChu: xau }))["duLieu.ghiChu"], `noi_luu_tru từ chối: ${xau}`);
}
assert.ok(loiCua(rv({ tieuDe: "Gọi 0912345678" }))["duLieu.tieuDe"], "tiêu đề cũng kiểm");
assert.ok(kt(rv({ noiDung: "Học phí 150.000.000 đồng cả khóa, 30.000.000 mỗi năm, điểm 27,5 năm 2025." })).ok, "số tiền và điểm không bị nhầm là số điện thoại");
assert.ok(loiCua(rv({ noiDung: "Xem thêm tại https://abc.com" }))["duLieu.noiDung"], "link phải để ở ô link nguồn");
assert.ok(loiCua(rv({ noiDung: "Xem www.abc.com" }))["duLieu.noiDung"]);
assert.equal(coThongTinCaNhan("không có gì"), false);

// nhãn
assert.equal(NHAN_LOAI.luu_y, "Lưu ý");
assert.equal(NHAN_LOAI.noi_luu_tru, "Nơi lưu trú");
assert.equal(NHAN_CONG_DONG, "Thông tin cộng đồng cung cấp, chưa phải số liệu chính thức");

// ---- quyền và khóa lạc quan
assert.equal(coQuyenSuaTruong("qtv", "BKA", []), true, "qtv sửa mọi trường");
assert.equal(coQuyenSuaTruong("ctv", "BKA", new Set(["BKA"])), true);
assert.equal(coQuyenSuaTruong("ctv", "NEU", new Set(["BKA"])), false, "ctv chỉ trường được giao");
assert.equal(coQuyenSuaTruong("ctv", "BKA", []), false);
assert.equal(coQuyenSuaTruong(null, "BKA", ["BKA"]), false);
assert.equal(duocDatTrangThai("ctv", "cho"), true);
assert.equal(duocDatTrangThai("ctv", "nhap"), true);
assert.equal(duocDatTrangThai("ctv", "duyet"), false, "ctv không tự duyệt");
assert.equal(duocDatTrangThai("ctv", "an"), false);
assert.equal(duocDatTrangThai("qtv", "duyet"), true);
assert.equal(duocDatTrangThai(undefined, "cho"), false);
assert.deepEqual(LOAI_CHI_QTV_DUYET, ["luu_y"]);
assert.equal(khopPhienBan(3, 3), true);
assert.equal(khopPhienBan(3, 2), false, "lệch phiên bản thì 409");
assert.equal(khopPhienBan(3, undefined), false);
assert.equal(khopPhienBan(3, "3"), false);

// ---- tiến độ
const lay = (...x: unknown[]) => x.map((v) => { const r = kt(v); assert.ok(r.ok, JSON.stringify(r)); return (r as { ok: true; duLieu: ThongTinTruong }).duLieu; });
const tdRong = tienDoTruong("BKA", undefined, []);
assert.deepEqual(tdRong.thieu, ["kenh", "hoc_phi", "hoc_bong", "noi_luu_tru", "review"]);
assert.equal(tdRong.du, false);
const tdMot = tienDoTruong("BKA", { maTruong: "BKA", fanpageUrl: "https://facebook.com/dhbk" }, lay(hp(), hb({}, { trangThai: "nhap" }), nlt({}, { trangThai: "an" }), rv({}, { maTruong: "NEU" })));
assert.deepEqual(tdMot.co, ["kenh", "hoc_phi"], "nháp, ẩn và trường khác không tính");
assert.deepEqual(tdMot.thieu, ["hoc_bong", "noi_luu_tru", "review"]);
const tdDu = tienDoTruong("BKA", { maTruong: "BKA", websiteTuyenSinhUrl: "https://hust.edu.vn" }, lay(hp({}, { trangThai: "duyet" }), hb(), nlt({}, { trangThai: "duyet" }), rv({}, { trangThai: "duyet" }), ly({}, { trangThai: "duyet" })));
assert.equal(tdDu.du, true);
assert.deepEqual(tdDu.thieu, []);
assert.equal(tienDoTruong("BKA", { maTruong: "BKA", ghiChu: "chỉ ghi chú" }, []).co.includes("kenh"), false, "ghi chú không phải kênh");

// ---- báo sai
const sai = kiemTraBaoSai({ id: "s1", maChuongTrinh: "bka-cntt", truongDuLieu: "diemChuan", noiDung: " Điểm  sai <b>nhé</b> ", link: "https://hust.edu.vn/x" }, { tapNganh: NGANH, bayGio: NGAY_CO_DINH });
assert.ok(sai.ok && sai.duLieu.trangThai === "moi" && sai.duLieu.noiDung === "Điểm sai nhé");
assert.ok(!kiemTraBaoSai({ id: "s1", maChuongTrinh: "xyz", truongDuLieu: "a", noiDung: "đủ dài rồi" }, { tapNganh: NGANH }).ok, "mã không tồn tại");
assert.ok(!kiemTraBaoSai({ id: "s1", maChuongTrinh: "bka-cntt", truongDuLieu: "a", noiDung: "ab" }).ok, "nội dung quá ngắn");
assert.ok(!kiemTraBaoSai({ id: "s1", maChuongTrinh: "bka-cntt", truongDuLieu: "a", noiDung: "a".repeat(1001) }).ok, "nội dung quá dài");
assert.ok(!kiemTraBaoSai({ id: "s1", maChuongTrinh: "bka-cntt", truongDuLieu: "a", noiDung: "đủ dài rồi", link: "https://evil.com" }).ok);
const sl = kiemTraBaoSai({ id: "s1", maChuongTrinh: "bka-cntt", truongDuLieu: "a", noiDung: "đủ dài rồi", link: "" });
assert.ok(sl.ok && sl.duLieu.link === undefined, "link rỗng thì bỏ");

// ---- bản chụp
const moi = (x: Record<string, unknown>, trangThai: string, ngoai: Record<string, unknown> = {}) => ({ ...x, trangThai, luc: ngayThu(0).toISOString(), ...ngoai }) as unknown as ThongTinTruong;
const ban = dungBanChup(
  [{ maTruong: "BKA", fanpageUrl: "https://facebook.com/dhbk" }, { maTruong: "NEU", ghiChu: "ghi chú" }, { maTruong: "ZZZ", ghiChu: "mã lạ" }, { maTruong: "BKA", fanpageUrl: "https://facebook.com/dhbk2" }],
  [moi(rv({}, { id: "a" }), "duyet"), moi(rv({}, { id: "b" }), "nhap"), moi(rv({}, { id: "c" }), "cho"), moi(rv({}, { id: "d" }), "an"),
    moi(rv({}, { id: "e" }), "duyet", { linkNguon: "http://x.com" }), moi(rv({}, { id: "f", maTruong: "ZZZ" }), "duyet"), moi(rv({ noiDung: "gọi 0912345678" }, { id: "g" }), "duyet")],
  NGAY_CO_DINH, { tapTruong: TRUONG },
);
assert.deepEqual(Object.keys(ban.thongTin), ["BKA"]);
assert.deepEqual(ban.thongTin.BKA.map((x) => x.id), ["a"], "chỉ dòng duyệt; link xấu, mã lạ, số điện thoại bị bỏ");
assert.equal(ban.truong.BKA.fanpageUrl, "https://facebook.com/dhbk2", "trùng mã trường lấy dòng sau");
assert.ok(!("ZZZ" in ban.truong), "mã không tồn tại không vào bản chụp");
assert.equal(ban.luc, NGAY_CO_DINH.toISOString());
const trung = dungBanChup([], [moi(rv({ tieuDe: "Cũ" }, { id: "a" }), "duyet"), moi(rv({ tieuDe: "Mới nhất" }, { id: "a" }), "duyet", { luc: ngayThu(2).toISOString() }), moi(rv({ tieuDe: "Cũ hơn" }, { id: "a" }), "duyet", { luc: ngayThu(-1).toISOString() })], NGAY_CO_DINH);
assert.equal(trung.thongTin.BKA.length, 1);
assert.equal((trung.thongTin.BKA[0].duLieu as { tieuDe: string }).tieuDe, "Mới nhất", "trùng id lấy dòng mới nhất");
const trungPb = dungBanChup([], [moi(rv({ tieuDe: "Bản v2" }, { id: "a", phienBan: 2 }), "duyet"), moi(rv({ tieuDe: "Bản v1" }, { id: "a", phienBan: 1 }), "duyet", { luc: ngayThu(3).toISOString() })], NGAY_CO_DINH);
assert.equal((trungPb.thongTin.BKA[0].duLieu as { tieuDe: string }).tieuDe, "Bản v2", "phiên bản cao hơn thắng");
assert.equal(dungBanChup([{ maTruong: "BKA", fanpageUrl: "https://facebook.com/dhbk" }, { maTruong: "BKA" }], [], NGAY_CO_DINH).truong.BKA, undefined, "dòng rỗng sau xóa dòng trước");

// học phí: trùng (trường, năm, phạm vi) lấy bản mới nhất; khác năm hoặc phạm vi giữ riêng
const bh = dungBanChup([], [
  moi(hp({ mucThap: 20, mucCao: 25 }, { id: "h1", nam: 2025 }), "duyet"),
  moi(hp({ mucThap: 22, mucCao: 28 }, { id: "h2", nam: 2025 }), "duyet", { luc: ngayThu(1).toISOString() }),
  moi(hp({ mucThap: 18, mucCao: 22 }, { id: "h3", nam: 2024 }), "duyet"),
  moi(hp({ mucThap: 40, mucCao: 50, phamVi: "Chương trình tiên tiến" }, { id: "h4", nam: 2025 }), "duyet"),
  moi(hp({ phamVi: "CHƯƠNG TRÌNH ĐẠI TRÀ", mucThap: 23, mucCao: 29 }, { id: "h5", nam: 2025 }), "duyet", { luc: ngayThu(2).toISOString() }),
  moi(hp({ mucThap: 99, mucCao: 99 }, { id: "h6", nam: 2025 }), "cho", { luc: ngayThu(9).toISOString() }),
], NGAY_CO_DINH);
assert.deepEqual(bh.thongTin.BKA.map((x) => x.id).sort(), ["h3", "h4", "h5"], "h1,h2 bị h5 (cùng năm+phạm vi, không phân biệt hoa thường) thay; bản chờ không vào");

// ---- tomTatTruong
const tt = dungBanChup(
  [{ maTruong: "BKA", fanpageUrl: "https://facebook.com/dhbk", nhomCongDongUrl: "https://facebook.com/groups/k68", ghiChu: "ok" }],
  [
    moi(hp({ phamVi: "Đại trà" }, { id: "p25", nam: 2025 }), "duyet"), moi(hp({ phamVi: "Đại trà" }, { id: "p23", nam: 2023 }), "duyet"), moi(hp({ phamVi: "Đại trà" }, { id: "p24", nam: 2024 }), "duyet"),
    moi(hb(), "duyet"), moi(nlt({ khuTroXungQuanh: "it" }, { id: "n1" }), "duyet"), moi(nlt({ khuTroXungQuanh: "nhieu" }, { id: "n2" }), "duyet", { luc: ngayThu(4).toISOString() }),
    ...[0, 1, 2, 3, 4].map((i) => moi(rv({ tieuDe: `Đánh giá ${i}` }, { id: `r${i}` }), "duyet", { luc: ngayThu(i).toISOString() })),
    moi(ly({}, { id: "ly" }), "duyet"), moi(ly({}, { id: "ly-cho" }), "cho"),
  ],
  NGAY_CO_DINH,
);
const ts = tomTatTruong(tt, "BKA");
assert.deepEqual(ts.hocPhiTheoNam.map((x) => x.nam), [2025, 2024, 2023], "học phí sắp theo năm giảm dần");
assert.equal(ts.hocBong.length, 1);
assert.equal(ts.noiLuuTru?.id, "n2", "nơi lưu trú lấy bản mới nhất");
assert.deepEqual(ts.review.map((x) => x.id), ["r4", "r3", "r2"], "review tối đa 3, mới nhất trước");
assert.deepEqual(ts.luuY.map((x) => x.id), ["ly"], "chỉ lưu ý đã duyệt");
assert.deepEqual(ts.kenh, { fanpage: "https://facebook.com/dhbk", nhomCongDong: "https://facebook.com/groups/k68", ghiChu: "ok" });
assert.deepEqual(ts.thieu, []);
const tsRong = tomTatTruong(tt, "NEU");
assert.deepEqual(tsRong.kenh, {});
assert.deepEqual(tsRong.hocPhiTheoNam, []);
assert.equal(tsRong.noiLuuTru, null);
assert.deepEqual(tsRong.thieu, ["kenh", "hoc_phi", "hoc_bong", "noi_luu_tru", "review"]);
assert.deepEqual(tomTatTruong(banChupGoc, "BKA").thieu, ["kenh", "hoc_phi", "hoc_bong", "noi_luu_tru", "review"], "bản chụp gốc rỗng: thiếu hết");

// ---- phía đọc: tối đa 3 bản ghi mỗi loại mỗi trường, mới nhất trước
const nhieu = dungBanChup([], [0, 1, 2, 3, 4].map((i) => moi(rv({}, { id: `p${i}` }), "duyet", { luc: ngayThu(i).toISOString() })).concat([moi(hp(), "duyet")]), NGAY_CO_DINH);
assert.deepEqual(thongTinCuaTruong(nhieu, "BKA", { loai: "review" }).map((x) => x.id), ["p4", "p3", "p2"], "tối đa 3 bản ghi, mới nhất trước");
assert.equal(thongTinCuaTruong(nhieu, "BKA", { loai: "review", toiDa: 10 }).length, 5);
assert.equal(thongTinCuaTruong(nhieu, "BKA").length, 4, "3 review + 1 học phí");
assert.equal(thongTinCuaTruong(nhieu, "NEU").length, 0);
const lanLon = { ...nhieu, thongTin: { BKA: [...nhieu.thongTin.BKA, moi(rv({}, { id: "cho1" }), "cho"), moi(rv({}, { id: "nhap1" }), "nhap")] } };
assert.ok(thongTinCuaTruong(lanLon, "BKA", { toiDa: 99 }).every((x) => x.trangThai === "duyet"), "phía đọc không hiện bản ghi chưa duyệt");
assert.ok(tomTatTruong(lanLon, "BKA").review.every((x) => x.trangThai === "duyet"));

// ---- loader
assert.equal(banChupGoc.phienBan, 1);
assert.deepEqual(banChupGoc.truong, {});
assert.deepEqual(banChupGoc.thongTin, {});
assert.equal(banChupGoc.luc, "2026-10-01T00:00:00.000Z");
const L = "2026-10-01T00:00:00.000Z";
for (const xau of [null, undefined, "html", 5, [], {}, { phienBan: 2, luc: L, truong: {}, thongTin: {} }, { phienBan: 1, luc: "x", truong: {}, thongTin: {} }, { phienBan: 1, luc: L, truong: [], thongTin: {} }, { phienBan: 1, luc: L, truong: {}, thongTin: [] }, { phienBan: 1, luc: L, truong: {} }]) {
  const r = docBanChupAnToan(xau);
  assert.equal(r.phienBan, 1);
  assert.deepEqual(r.truong, {});
  assert.deepEqual(r.thongTin, {});
}
const tuMang = docBanChupAnToan({
  phienBan: 1, luc: "2026-10-05T00:00:00.000Z",
  truong: { BKA: { nhomTuyenSinhChinhThucUrl: "https://zalo.me/g/bk", ghiChu: "<b>hi</b>" }, NEU: { nhomCongDongUrl: "http://xau.com" }, X: 5 },
  thongTin: { BKA: [moi(rv({}, { id: "a" }), "duyet"), moi(rv({}, { id: "b" }), "cho"), { rac: true }, null, moi(hp({ mucCao: 1 }, { id: "xau" }), "duyet")], NEU: "không phải mảng" },
});
assert.equal(nhomCuaTruong(tuMang, "BKA"), "https://zalo.me/g/bk");
assert.equal(tuMang.truong.BKA.ghiChu, "hi", "làm sạch lại dữ liệu từ mạng");
assert.equal(nhomCuaTruong(tuMang, "NEU"), null, "link xấu bị bỏ");
assert.equal(nhomCuaTruong(tuMang, "KHONG"), null);
assert.deepEqual(tuMang.thongTin.BKA.map((x) => x.id), ["a"], "bản ghi sai schema (mucCao < mucThap) bị bỏ");
assert.deepEqual(thongTinTruong(tuMang, "BKA").map((x) => x.id), ["a"]);
assert.deepEqual(thongTinTruong(tuMang, "NEU"), []);
const uuTien = docBanChupAnToan({ phienBan: 1, luc: L, truong: { BKA: { nhomTuyenSinhChinhThucUrl: "https://zalo.me/g/ct", nhomCongDongUrl: "https://facebook.com/groups/cd" } }, thongTin: {} });
assert.equal(nhomCuaTruong(uuTien, "BKA"), "https://zalo.me/g/ct", "ưu tiên nhóm chính thức");

// ---- ngày cố định
assert.equal(NGAY_CO_DINH.getDay(), 2, "thứ Ba");
assert.equal(ngayThu(0).getTime(), NGAY_CO_DINH.getTime());
assert.equal(ngayThu(5).getDay(), 0, "Chủ nhật");
assert.equal(ngayThu(7).getDate(), 13);
assert.equal(ngayThu(0).getHours(), 8);

console.log("dong-gop: tất cả kiểm tra đều qua");

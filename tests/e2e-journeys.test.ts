// Kiểm thử đầu-cuối (E2E) các hành trình người dùng cốt lõi và kịch bản chịu lỗi / bảo mật.
// Chạy: npx tsx tests/e2e-journeys.test.ts
import assert from "node:assert/strict";

// State & Chuẩn hóa & Sao lưu
import { HO_SO_TRONG, taoHoSoMau } from "../src/state/mau";
import { chuanHoa } from "../src/state/chuan-hoa";
import { docBanSaoLuu, taoBanSaoLuu } from "../src/state/sao-luu";
import { diemHienTaiCuaTungMon, type AppState } from "../src/state/store";
import { chonNguyenVongLamMucTieu, khoangCachCuaToi, mucTieuDayDu, tienDoTuan, viecConLai } from "../src/state/chon";
import { xepLaiTuan } from "../src/state/xep-lai";
import type { DiemThi, MonId, NhanNguyenVong } from "../src/state/types";

// Khởi đầu (Onboarding)
import { docDiem, goiYHocPhi, ketQuaBanDau, kiemTraBuoc1, tinhCacToHop, toHopCaoNhatDayDu } from "../src/features/khoi-dau/tinh-toan";

// Khám phá & Nguyện vọng
import { LUA_CHON_MAU, datDanhMuc, tim } from "../src/data/lua-chon-mau";
import { LUA_CHON } from "../src/data/lua-chon-that";
import { BO_LOC_MAC_DINH, loc } from "../src/features/kham-pha/bo-loc";
import { boiCanhTu, danhGia, sapXep } from "../src/features/kham-pha/phu-hop";
import { diemDayDu } from "../src/features/kham-pha/to-hop";
import { goiYDanhSach } from "../src/features/nguyen-vong/goi-y-danh-sach";
import { chamDiem, demNhan, dungDanhSach, ketLuan, xetCoCau } from "../src/features/nguyen-vong/tinh-toan";

// Điểm thi thử, Thử tình huống, Mục tiêu & Kế hoạch tuần
import { DANG_THU_MAC_DINH, chupTruocSau, dieuKienTuHoSo, tinhTinhHuong, tomTatTruocSau } from "../src/features/thu-tinh-huong/tinh-toan";
import { nhanDinhMucTieu, phanLoaiMon, tongPhanBu } from "../src/features/muc-tieu/tinh-toan";
import { NOI_DUNG_ON } from "../src/engine/tao-viec";
import { viecChoTuan } from "../src/features/ke-hoach/tao-viec-tuan";
import { isoNgay, thuHaiCuaTuan } from "../src/engine/xep-lich";

// Đồng hành, Trắc nghiệm & Tư vấn AI
import { chiSoTheoDoi, tomTatChiaSe } from "../src/features/hanh-trinh/tom-tat";
import { docGoiChiaSe, docLoiNhan, maHoa, taoGoiChiaSe, taoLoiNhan } from "../src/features/dong-hanh/goi-tin";
import { cauNganHoiTiep, chonDuLieuKemTheo, coDaiTu, timNganhKhop, traLoiTuDong } from "../src/features/tu-van/lay-du-lieu";
import { docLichSu, nganhLuotTruoc, taoNguCanh } from "../src/features/tu-van/hoi-thoai";
import { cauDangCho, guiNen } from "../src/features/tu-van/dang-cho";
import { GIOI_HAN, choPhepTanSuat, lamSachHoSo, locNguon, type KhoKV } from "../src/engine/tu-van";
import { xuLy as xuLyTuVan } from "../functions/api/tu-van";
import { dungStateEn, quyetDinhNguyenVong, type HoSoEn, type UngVienEn } from "../functions/_thu-vien/ai/clef";
import type { KhoAI } from "../functions/_thu-vien/ai/kieu";

// Bảo mật, Đóng góp, Đăng ký sớm & CMS Snapshot
import { kiemTraDuLieuDangKy, kiemTraLienHe, xuLyDangKySom, type EnvDangKySom } from "../functions/api/dang-ky-som";
import { coThongTinCaNhan, kiemTraBaoSai, kiemTraLink, lamSachChu } from "../src/data/dong-gop-kiem-tra";
import { hopNhatLuaChonVaCms, layChiTietTruongHopNhat } from "../src/engine/du-lieu-tuyen-sinh/hop-nhat";
import { chuanHoaChoSnapshot, taoSnapshotVaManifest } from "../src/engine/du-lieu-tuyen-sinh/snapshot-builder";
import type { BanGhiCms } from "../src/engine/du-lieu-tuyen-sinh/kieu";

console.log("=== BẮT ĐẦU KIỂM THỬ HÀNH TRÌNH ĐẦU-CUỐI (E2E JOURNEYS & RESILIENCE) ===");

// ============================================================================
// HÀNH TRÌNH 1: HỌC SINH LẦN ĐẦU (PERSONA A — FIRST-TIME STUDENT)
// Hồ sơ trống -> 3 bước Khởi đầu (đa phương thức: IELTS/ĐGNL/Học bạ/HSG) ->
// hoanTat: true -> Khám phá -> Nguyện vọng -> Cơ cấu 4 nhóm nhãn
// ============================================================================
{
  // 1.1. Bắt đầu từ trạng thái rỗng hoàn toàn
  let state: AppState = chuanHoa(null);
  assert.equal(state.hoSo.hoanTat, false, "Hồ sơ ban đầu chưa hoàn tất");
  assert.deepEqual(state.hoSo, HO_SO_TRONG, "Hồ sơ ban đầu khớp HO_SO_TRONG");
  assert.equal(state.nguyenVong.length, 0, "Danh sách nguyện vọng ban đầu trống");

  // 1.2. Bước 1: Kiểm tra lỗi khi trống & điền thông tin cơ bản
  const loiB1 = kiemTraBuoc1(state.hoSo);
  assert.deepEqual(Object.keys(loiB1).sort(), ["khoi", "nganhQuanTam", "tinh"], "Bước 1 báo thiếu khối, tỉnh, ngành quan tâm");

  state = chuanHoa({
    ...state,
    hoSo: {
      ...state.hoSo,
      hoTen: "Lê Hoàng Minh",
      khoi: 12,
      tinh: "TP. Hồ Chí Minh",
      nganhQuanTam: ["Công nghệ thông tin", "Kinh tế"],
    },
  });
  assert.deepEqual(kiemTraBuoc1(state.hoSo), {}, "Điền đủ Bước 1 thì hết lỗi");

  // 1.3. Bước 2: Nhập điểm các môn + Đa phương thức (IELTS, ĐGNL, Học bạ, Giải HSG)
  const dToan = docDiem("8,5");
  const dLy = docDiem("8.25");
  const dAnh = docDiem("8,75");
  const dHoa = docDiem("7,5");
  assert.ok(dToan.loai === "hopLe" && dLy.loai === "hopLe" && dAnh.loai === "hopLe" && dHoa.loai === "hopLe");

  const diemNhap: Record<MonId, number | null> = {
    toan: dToan.gia,
    vatLy: dLy.gia,
    hoaHoc: dHoa.gia,
    sinh: null,
    nguVan: 7.5,
    tiengAnh: dAnh.gia,
  };

  const cacToHop = tinhCacToHop(diemNhap);
  assert.equal(cacToHop.find((t) => t.ma === "A01")?.tong, 25.5, "Tổ hợp A01 tính đúng 8.5 + 8.25 + 8.75 = 25.5");
  assert.equal(cacToHop.find((t) => t.ma === "A00")?.tong, 24.3, "Tổ hợp A00 làm tròn 1 chữ số thập phân (24.25 -> 24.3)");
  assert.equal(cacToHop.find((t) => t.ma === "B00")?.tong, null, "Thiếu Sinh thì B00 là null");

  const caoNhat = toHopCaoNhatDayDu(diemNhap, { tinHoc: 9.0 }, { khuVuc: "KV2", doiTuong: null });
  assert.ok(caoNhat && caoNhat.tong >= 25.5, "Tính tổ hợp cao nhất đầy đủ kèm điểm ưu tiên");

  // 1.4. Bước 3: Điều kiện gia đình (ngân sách, chỗ ở, khu vực) + Hoàn tất hồ sơ đa phương thức
  const goiYHp = goiYHocPhi("30-60", "kyTucXa");
  assert.ok(goiYHp && goiYHp.khoang.includes("30") && goiYHp.ghiChu?.includes("ký túc xá"));

  state = chuanHoa({
    ...state,
    hoSo: {
      ...state.hoSo,
      diem: diemNhap,
      diemThem: { tinHoc: 9.0 },
      uuTienTuyenSinh: { khuVuc: "KV2", doiTuong: "khong" },
      chungChiNgoaiNgu: { loai: "IELTS", diem: 7.0, ngayCap: "2026-05-10" },
      diemDgnl: { hcm: 910, hn: null, tsa: 78 },
      hocBa: { dtbLop10: 8.5, dtbLop11: 8.7, dtbLop12: 8.9, dtb3Nam: 8.7, hocLuc: "gioi", hanhKiem: "tot", truongChuyen: true },
      giaiThuongHsg: { cap: "tinh", mon: "Tin học", giai: "nhi" },
      nganSach: "30-60",
      choO: "kyTucXa",
      khuVuc: ["TP.HCM"],
      hocXaNha: true,
      quanTamViecLam: "rat",
      hoanTat: true,
    },
  });

  assert.equal(state.hoSo.hoanTat, true, "Đã hoàn tất onboarding");
  assert.equal(state.hoSo.chungChiNgoaiNgu?.loai, "IELTS");
  assert.equal(state.hoSo.chungChiNgoaiNgu?.diem, 7.0);
  assert.equal(state.hoSo.diemDgnl?.hcm, 910);
  assert.equal(state.hoSo.hocBa?.dtb3Nam, 8.7);
  assert.equal(state.hoSo.giaiThuongHsg?.giai, "nhi");

  const kqBanDau = ketQuaBanDau(
    { tong: 25.5, toHop: "A01", soDuDiem: 85, soThuSuc: 25, theoNhom: [{ nhom: "Công nghệ thông tin", duDiem: 20, thuSuc: 8 }] },
    state.hoSo.nganhQuanTam,
  );
  assert.equal(kqBanDau.coDiem, true);
  assert.equal(kqBanDau.nhomQuanTam[0].nhom, "Công nghệ thông tin");

  // 1.5. Khám phá (Explore): Lọc, đánh giá mức phù hợp và sắp xếp
  const bc = boiCanhTu(state);
  const dsDaLoc = loc(LUA_CHON_MAU, { ...BO_LOC_MAC_DINH, khuVuc: "TP.HCM" });
  assert.ok(dsDaLoc.length > 0, "Khám phá lọc được các chương trình tại TP.HCM");
  const dsSapXep = sapXep(dsDaLoc, "phuHop", bc);
  assert.equal(dsSapXep.length, dsDaLoc.length);
  const dgDau = danhGia(dsSapXep[0], bc);
  assert.ok(dgDau.muc !== null && dgDau.tong !== null, "Đánh giá có đầy đủ mức phù hợp và tổng điểm");

  // 1.6. Gợi ý & Thêm vào Nguyện vọng, kiểm tra cơ cấu 4 nhãn (Thử sức · Vừa sức · An toàn · Dự phòng)
  const diemDD = diemDayDu(state);
  const goiY = goiYDanhSach(diemDD, state.hoSo);
  assert.ok(goiY.length >= 4 && goiY.length <= 6, "Gợi ý từ 4 đến 6 nguyện vọng");

  state = chuanHoa({
    ...state,
    nguyenVong: goiY.map((g) => g.lc.id),
  });

  const dsDong = dungDanhSach(state.nguyenVong, diemDD, tim);
  const bangDem = demNhan(dsDong);
  const CAC_NHAN_CO_DINH: NhanNguyenVong[] = ["Thử sức", "Vừa sức", "An toàn", "Dự phòng"];
  for (const nhan of CAC_NHAN_CO_DINH) {
    assert.equal(typeof bangDem[nhan], "number", `Nhãn cố định "${nhan}" có trong bảng đếm`);
  }
  const coCau = xetCoCau(bangDem, dsDong.length);
  const kl = ketLuan(coCau);
  assert.ok(coCau.chacChan >= 1, "Danh sách gợi ý luôn có ít nhất 1 nguyện vọng An toàn hoặc Dự phòng");
  assert.ok(kl.tieuDe.length > 0 && kl.hienTrang.length > 0);
  const diemDanhSach = chamDiem(dsDong, state.hoSo, true);
  assert.equal(diemDanhSach.length, 3, "Chấm điểm danh sách đủ 3 tiêu chí");

  console.log("✓ Hành trình 1 (Học sinh lần đầu — Onboarding đa phương thức -> Khám phá -> Nguyện vọng) đạt 100%.");
}

// ============================================================================
// HÀNH TRÌNH 2: HỌC SINH QUAY LẠI HẰNG NGÀY (PERSONA B — DAILY RETURNING STUDENT)
// Điểm thi thử -> Thử tình huống -> Mục tiêu & Môn kéo điểm ->
// Đánh dấu chuyên đề canOnTap -> Sinh việc cần học & Xếp lịch tự động
// ============================================================================
{
  let state = taoHoSoMau();
  const diemTruoc = diemHienTaiCuaTungMon(state);

  // 2.1. Nhập điểm thi thử mới (môn Toán tăng từ 8.0 lên 8.8, Lý giữ 8.5, Anh 8.2)
  const ngayThiMoi = isoNgay(new Date());
  const dotThiMoi: DiemThi[] = [
    ...state.diemThi,
    { mon: "toan", diem: 8.8, ngay: ngayThiMoi },
    { mon: "vatLy", diem: 8.5, ngay: ngayThiMoi },
    { mon: "tiengAnh", diem: 8.2, ngay: ngayThiMoi },
  ];
  state = chuanHoa({ ...state, diemThi: dotThiMoi });
  const diemSau = diemHienTaiCuaTungMon(state);
  assert.equal(diemSau.toan, 8.8, "Điểm hiện tại của Toán cập nhật theo lần thi thử mới nhất");

  // Chụp trước/sau khi nhập điểm thi thử
  const dk = dieuKienTuHoSo(state.hoSo);
  const cacLcNv = state.nguyenVong.map((id) => tim(id)!).filter(Boolean);
  const anh = chupTruocSau({
    lcs: cacLcNv,
    nguon: "nguyenVong",
    diemTruoc,
    diemSau,
    maToHop: "A01",
    toHop: ["toan", "vatLy", "tiengAnh"],
    dk,
    luc: "2026-10-12T08:00:00Z",
  });
  assert.ok(anh.tongSau > anh.tongTruoc, "Tổng điểm sau thi thử tăng lên");
  const tomTatTS = tomTatTruocSau(anh, tim);
  assert.equal(tomTatTS.length, 3, "Tóm tắt trước/sau có 3 dòng nhận xét");

  // 2.2. Thử tình huống (What-if simulation): Giả sử Vật lý +0.75 điểm
  const dangThu = { ...DANG_THU_MAC_DINH, congMon: { vatLy: 0.75 } };
  const kqTinhHuong = tinhTinhHuong(LUA_CHON_MAU.slice(0, 80), diemSau, ["toan", "vatLy", "tiengAnh"], dk, dangThu);
  assert.equal(kqTinhHuong.coThayDoi, true);
  assert.equal(kqTinhHuong.tongSau, Math.round((kqTinhHuong.tongTruoc + 0.75) * 100) / 100);
  assert.ok(kqTinhHuong.phuHop[1] >= kqTinhHuong.phuHop[0], "Khi cộng điểm, số ngành phù hợp không giảm");

  // 2.3. Đặt mục tiêu cao hơn để kiểm tra Khoảng cách & Môn kéo điểm
  const chonMt = chonNguyenVongLamMucTieu(state, tim);
  assert.ok(chonMt.ok, "Chọn được nguyện vọng đầu làm mục tiêu");
  state = chuanHoa({
    ...state,
    mucTieu: {
      ...chonMt.mucTieu,
      maToHop: "A01",
      toHop: ["toan", "vatLy", "tiengAnh"],
      diemMucTieu: 27.5, // Hiện tại 8.8 + 8.5 + 8.2 = 25.5 -> còn thiếu 2.0 điểm
    },
  });

  const mt = mucTieuDayDu(state)!;
  assert.ok(mt && mt.duDiem, "Đủ điểm 3 môn của tổ hợp mục tiêu");
  assert.ok(mt.conThieu > 0, "Còn thiếu điểm so với mục tiêu 27.5");

  const kc = khoangCachCuaToi(state);
  const plMon = phanLoaiMon(kc, state.diemThi);
  assert.equal(plMon.length, 3, "Phân loại đủ 3 môn trong tổ hợp");
  assert.ok(plMon.some((m) => m.nhan === "Nên ưu tiên"), "Có ít nhất 1 môn được gắn nhãn Nên ưu tiên");
  const phanBu = tongPhanBu(plMon, mt.conThieu);
  assert.ok(Math.abs(phanBu.tong - mt.conThieu) <= 0.15, "Tổng phần bù của 3 môn khớp với số điểm còn thiếu (trong sai số làm tròn 0.1)");
  const nhanDinh = nhanDinhMucTieu(kc, mt.conThieu, mt.hienTai, mt.mucTieuTho, "A01");
  assert.equal(nhanDinh.datRoi, false);

  // 2.4. Đánh dấu chuyên đề cần ôn tập (canOnTap) & Sinh việc cần học trong tuần
  const chuyenDeCanOn = NOI_DUNG_ON.tiengAnh[2]; // "Luyện ngữ pháp và từ vựng theo chủ đề"
  state = chuanHoa({
    ...state,
    hoSo: {
      ...state.hoSo,
      tienDoKienThuc: {
        [chuyenDeCanOn]: "canOnTap",
        [NOI_DUNG_ON.toan[0]]: "namVung",
      },
    },
  });
  assert.equal(state.hoSo.tienDoKienThuc?.[chuyenDeCanOn], "canOnTap");

  const tuanNay = thuHaiCuaTuan("2026-10-12");
  const kqViec = viecChoTuan(state, tuanNay, "2026-10-12", new Date("2026-10-12T08:00:00"));
  assert.ok(kqViec.ok && kqViec.moi >= 3, "Sinh được danh sách việc cần học cho tuần");

  // Kiểm tra chuyên đề đánh dấu canOnTap được ưu tiên đưa vào buổi học chuyên đề môn Tiếng Anh
  const viecAnhChuyenDe = kqViec.viec.filter((v) => v.tuan === tuanNay && v.mon === "tiengAnh" && !v.tieuDe.includes("đề tính giờ"));
  if (viecAnhChuyenDe.length > 0) {
    assert.ok(
      viecAnhChuyenDe.some((v) => v.chiTiet.includes(chuyenDeCanOn)),
      "Chuyên đề đánh dấu canOnTap được đưa vào việc cần học của tuần",
    );
  }

  // 2.5. Tự động xếp lịch tuần (Auto-scheduler) và đánh dấu hoàn thành việc
  const daXep = xepLaiTuan(state, tuanNay, "2026-10-12", kqViec.viec, new Date("2026-10-12T08:00:00"));
  state = daXep.s;
  assert.equal(daXep.chuaXep, 0, "Mọi việc cần học trong tuần đều được xếp vào khung giờ trống");
  assert.ok(state.khoiHoc.some((k) => k.loai === "tuHoc" && k.viecId !== null), "Lịch học có các khối tự học gắn với việc");

  // Đánh dấu hoàn thành 1 việc và kiểm tra tiến độ
  const viecDau = state.viec.find((v) => v.tuan === tuanNay)!;
  state = chuanHoa({
    ...state,
    trangThaiViec: { ...state.trangThaiViec, [viecDau.id]: "xong" },
    lichSu: [{ viecId: viecDau.id, ten: viecDau.tieuDe, luc: "2026-10-12T20:00:00.000Z", trangThai: "xong" }],
  });
  const td = tienDoTuan({ ...state, viec: state.viec.map((v) => ({ ...v, tuan: undefined })) });
  assert.ok(td.xong >= 1 && td.phanTram > 0, "Tiến độ tuần ghi nhận việc đã hoàn thành");
  assert.ok(!viecConLai({ ...state, viec: state.viec.map((v) => ({ ...v, tuan: undefined })) }).some((v) => v.id === viecDau.id));

  console.log("✓ Hành trình 2 (Học sinh hằng ngày — Điểm thi thử -> Thử tình huống -> Mục tiêu -> Kế hoạch & Xếp lịch) đạt 100%.");
}

// ============================================================================
// HÀNH TRÌNH 3: ĐỒNG HÀNH & TƯ VẤN AI (PERSONA C & D — COMPANION & AI ADVISORY)
// Mã hóa gói chia sẻ (dong-hanh) -> Nhận lời nhắn (loi-nhan) ->
// Tư vấn AI đa lượt (coDaiTu, cauNganHoiTiep, guiNen, Clef + fallback) ->
// Sao lưu & Khôi phục kèm lịch sử trò chuyện (sao-luu)
// ============================================================================
{
  const state = taoHoSoMau();

  // 3.1. Tạo gói chia sẻ cho phụ huynh / giáo viên và giải mã
  const { muc } = tomTatChiaSe(state, new Date("2026-10-12T09:00:00Z"));
  const chiSo = chiSoTheoDoi(state).map((c) => ({ ten: c.ten, giaTri: c.giaTri }));
  const goi = taoGoiChiaSe(muc, chiSo, new Date("2026-10-12T09:00:00Z"), state.hoSo.hoTen);
  const maChiaSe = maHoa(goi);
  assert.ok(/^[A-Za-z0-9_-]+$/.test(maChiaSe), "Chuỗi mã hóa URL-safe");

  const goiGiaiMa = docGoiChiaSe(maChiaSe);
  assert.ok(goiGiaiMa, "Giải mã thành công gói chia sẻ");
  assert.equal(goiGiaiMa.ten, state.hoSo.hoTen);
  assert.deepEqual(goiGiaiMa.muc, muc);

  // 3.2. Phụ huynh gửi lời nhắn động viên và học sinh nhận lời nhắn
  const loiNhanGoc = taoLoiNhan(
    "Bố Minh Anh",
    "phuHuynh",
    "Bố mẹ đã xem danh sách nguyện vọng của con. Con cứ yên tâm ôn tập, nhớ giữ trường an toàn nhé!",
    new Date("2026-10-12T10:00:00Z"),
  );
  assert.ok(loiNhanGoc, "Tạo lời nhắn hợp lệ");
  const maLoiNhan = maHoa(loiNhanGoc);
  const nhanDuoc = docLoiNhan(maLoiNhan);
  assert.ok(nhanDuoc && nhanDuoc.id.startsWith("ln-") && nhanDuoc.vai === "phuHuynh");

  const stateCoLoiNhan = chuanHoa({ ...state, loiNhan: [nhanDuoc] });
  assert.equal(stateCoLoiNhan.loiNhan.length, 1);
  assert.equal(stateCoLoiNhan.loiNhan[0].tu, "Bố Minh Anh");

  // 3.3. Tư vấn AI đa lượt (Multi-turn RAG, coDaiTu, cauNganHoiTiep, guiNen, Clef)
  // Lượt 1: Hỏi ngành cụ thể
  const cau1 = "Điểm chuẩn Khoa học máy tính UIT?";
  assert.equal(coDaiTu(cau1), false);
  const nganhKhop1 = timNganhKhop(cau1, 4).map((l) => l.id);
  assert.ok(nganhKhop1.length > 0, "Tìm được ngành Khoa học máy tính UIT");
  const dlKem1 = chonDuLieuKemTheo(cau1, stateCoLoiNhan, null);
  assert.ok(dlKem1.length > 0 && !JSON.stringify(dlKem1).includes(stateCoLoiNhan.hoSo.hoTen), "Không rò họ tên học sinh trong dữ liệu gửi AI");

  // Lượt 2: Câu hỏi nối tiếp có đại từ ("Còn trường đó học phí bao nhiêu?") và câu ngắn ("Có khó không?")
  const cau2 = "Trường đó học phí bao nhiêu?";
  const cau3 = "Có khó không?";
  assert.equal(coDaiTu(cau2), true, "Nhận diện đại từ nối tiếp");
  assert.equal(cauNganHoiTiep(cau3), true, "Nhận diện câu ngắn hỏi tiếp");

  const dlKem2 = chonDuLieuKemTheo(cau2, stateCoLoiNhan, null, 8, nganhKhop1);
  assert.deepEqual(dlKem2.slice(0, nganhKhop1.length).map((x) => x.id), nganhKhop1, "Giữ nguyên các ngành của lượt trước khi hỏi nối tiếp");

  const traLoiOffline = traLoiTuDong(cau2, stateCoLoiNhan, null, nganhKhop1);
  assert.ok(traLoiOffline.nguon.includes(nganhKhop1[0]) && /học phí/i.test(traLoiOffline.traLoi), "Chế độ trả lời tự động (fallback) hiểu câu hỏi nối tiếp");

  // Kiểm tra guiNen (gửi nền không mất tin nhắn khi chuyển trang)
  const boNhoChat = (() => {
    const m = new Map<string, string>();
    return {
      m,
      getItem: (k: string) => m.get(k) ?? null,
      setItem: (k: string, v: string) => void m.set(k, v),
      removeItem: (k: string) => void m.delete(k),
    };
  })();

  let moKhoa!: () => void;
  const doiMang = new Promise<void>((r) => { moKhoa = r; });
  const tacVuNen = guiNen(boNhoChat, cau1, [], async () => {
    await doiMang;
    return {
      vai: "mayChu",
      chu: "Điểm chuẩn Khoa học máy tính UIT năm gần nhất là 26,9. [nguồn: " + nganhKhop1[0] + "]",
      nguon: [nganhKhop1[0]],
      idDuLieu: nganhKhop1,
      cheDo: "ai",
      tang: "llm",
    };
  });
  assert.equal(cauDangCho(), cau1, "Đang chờ phản hồi nền");
  moKhoa();
  await tacVuNen;
  assert.equal(cauDangCho(), null, "Đã hoàn tất phản hồi nền");

  const lichSuChat = docLichSu(boNhoChat);
  assert.equal(lichSuChat.length, 2, "Lưu đủ câu hỏi của em và câu trả lời của máy chủ");
  assert.deepEqual(nganhLuotTruoc(lichSuChat), nganhKhop1);
  const nguCanhTiep = taoNguCanh("Tư vấn chung", lichSuChat);
  assert.ok(nguCanhTiep.includes(cau1) && nguCanhTiep.length <= GIOI_HAN.nguCanh);

  // Kiểm tra lớp Clef (tín hiệu thứ hai) + fallback an toàn khi timeout hoặc lỗi
  const ungVienClef: UngVienEn[] = [
    { id: "qsc-1", label: "match", scoreGap: 0.5, tuitionMillion: 32, interestGroups: ["technology"] },
    { id: "qsc-2", label: "trial", scoreGap: -1.1, tuitionMillion: 55, interestGroups: ["technology"] },
  ];
  const stateClef = JSON.stringify(dungStateEn({ grade: 12, totalScore: 25.5, ten: "Lê Hoàng Minh", sdt: "0901234567" } as unknown as HoSoEn, ungVienClef));
  assert.ok(!stateClef.includes("Lê Hoàng Minh") && !stateClef.includes("0901234567"), "Clef ẩn danh hoàn toàn PII");

  const aiGiaClef: KhoAI = {
    run: async () => ({
      model: "clef-omni",
      answers: {
        fin_c0: { type: "score", score: 0.2, confidence: 0.8 },
        int_c0: { type: "score", score: 1.8, confidence: 0.8 },
        fin_c1: { type: "score", score: 1.5, confidence: 0.8 },
        int_c1: { type: "score", score: 1.6, confidence: 0.8 },
        next_action: { type: "choice", choice: "keep_list", probabilities: { keep_list: 0.75 }, confidence: 0.75 },
      },
    }),
  };
  const qdClef = await quyetDinhNguyenVong(aiGiaClef, { grade: 12, budgetMillion: 45 }, ungVienClef);
  assert.ok(qdClef && qdClef.hanhDong?.chon === "keep_list");
  // Fallback khi Clef lỗi
  const aiLoiClef: KhoAI = { run: async () => { throw new Error("Clef offline"); } };
  assert.equal(await quyetDinhNguyenVong(aiLoiClef, {}, ungVienClef), null, "Clef lỗi trả về null để tự động fallback");

  // 3.4. Sao lưu & Khôi phục (kèm và không kèm lịch sử trò chuyện)
  const banSaoKhongChat = taoBanSaoLuu(stateCoLoiNhan, new Date("2026-10-12T12:00:00Z"));
  assert.ok(!banSaoKhongChat.includes("lichSuChat"), "Mặc định sao lưu không kèm lịch sử chat");
  const khoiPhuc1 = docBanSaoLuu(banSaoKhongChat);
  assert.ok(khoiPhuc1.ok && khoiPhuc1.lichSu === undefined);
  assert.deepEqual(khoiPhuc1.s, stateCoLoiNhan);

  const banSaoCoChat = taoBanSaoLuu(stateCoLoiNhan, new Date("2026-10-12T12:00:00Z"), lichSuChat);
  const khoiPhuc2 = docBanSaoLuu(banSaoCoChat);
  assert.ok(khoiPhuc2.ok && khoiPhuc2.lichSu?.length === 2, "Khôi phục thành công cả hồ sơ và lịch sử trò chuyện");

  console.log("✓ Hành trình 3 (Đồng hành & Tư vấn AI đa lượt + Sao lưu/Khôi phục) đạt 100%.");
}

// ============================================================================
// HÀNH TRÌNH 4: ĐỘ BỀN DỮ LIỆU & BẢO MẬT (RESILIENCE & SECURITY)
// Chống Prototype Pollution & NaN/Infinity -> Giới hạn tần suất API (Rate limit) ->
// Kiểm định Đăng ký sớm -> Kiểm định Báo sai & PII -> Hợp nhất CMS Snapshot
// ============================================================================
{
  // 4.1. Chống Prototype Pollution & phục hồi dữ liệu localStorage bị hỏng
  const docHai = JSON.parse(
    '{"__proto__":{"polluted":true},"constructor":{"prototype":{"polluted":true}},"hoSo":{"hoTen":"An","diem":{"toan":null,"vatLy":"NaN","hoaHoc":999,"sinh":-5,"nguVan":8.0},"tienDoKienThuc":{"__proto__":"canOnTap","chuyenDe1":"canOnTap","chuyenDe2":"hacked"}},"trangThaiViec":{"__proto__":"xong","constructor":"xong","v1":"xong","v2":"invalid"}}',
  );
  const stateSach = chuanHoa(docHai);
  assert.equal(({} as Record<string, unknown>).polluted, undefined, "Không bị Prototype Pollution trên Object.prototype");
  assert.equal(stateSach.hoSo.diem.nguVan, 8.0);
  assert.equal(stateSach.hoSo.diem.hoaHoc, null, "Điểm ngoài thang 0-10 bị loại bỏ");
  assert.equal(stateSach.hoSo.diem.sinh, null, "Điểm âm bị loại bỏ");
  assert.deepEqual(Object.keys(stateSach.trangThaiViec), ["v1"], "Chỉ giữ khóa hợp lệ trong trangThaiViec");
  assert.deepEqual(Object.keys(stateSach.hoSo.tienDoKienThuc ?? {}), ["chuyenDe1"], "Chỉ giữ khóa và trạng thái hợp lệ trong tienDoKienThuc");

  // 4.2. Giới hạn tần suất API Tư vấn AI (Rate Limiting), lọc nguồn giả & bảo vệ khóa bí mật
  const kvMap = new Map<string, string>();
  const kv: KhoKV = {
    get: async (k) => kvMap.get(k) ?? null,
    put: async (k, v) => { kvMap.set(k, v); },
  };
  for (let i = 0; i < GIOI_HAN.yeuCauMoiPhutMoiIp; i++) {
    assert.equal(await choPhepTanSuat(kv, "203.0.113.5", 1_700_000_000_000), true);
  }
  assert.equal(await choPhepTanSuat(kv, "203.0.113.5", 1_700_000_000_000), false, "Chặn khi vượt quá giới hạn yêu cầu mỗi phút");

  // Kiểm tra endpoint /api/tu-van chặn 429 khi vượt hạn mức và lọc mã nguồn do AI tự bịa
  const phanHoi429 = await xuLyTuVan(
    new Request("https://nguyenvongai.vn/api/tu-van", {
      method: "POST",
      headers: { "cf-connecting-ip": "203.0.113.5" },
      body: JSON.stringify({ cauHoi: "Điểm chuẩn UIT?" }),
    }),
    { ANTHROPIC_API_KEY: "secret-key-123", RATE_KV: { get: async () => "999", put: async () => {} } },
  );
  assert.equal(phanHoi429.status, 429, "Trả về HTTP 429 khi vượt tần suất");

  const daLocNguon = locNguon("Điểm chuẩn là 26,9 [nguồn: qsc-1, ma-bia-dat]", ["qsc-1"]);
  assert.deepEqual(daLocNguon.nguon, ["qsc-1"], "Loại bỏ mã nguồn không nằm trong dữ liệu gửi đi");

  const hoSoSach = lamSachHoSo({
    lop: 12,
    tinh: "TP.HCM",
    hoTen: "Bí mật không được gửi",
    sdt: "0909000111",
    email: "secret@gmail.com",
    nganhQuanTam: ["CNTT"],
  });
  assert.ok(hoSoSach && !("hoTen" in hoSoSach) && !("sdt" in hoSoSach) && !("email" in hoSoSach), "Whitelist hồ sơ loại bỏ hoàn toàn PII");

  // 4.3. Kiểm định Đăng ký sớm (/api/dang-ky-som) — Fail-closed khi thiếu D1
  assert.equal(kiemTraLienHe("0912345678"), true);
  assert.equal(kiemTraLienHe("hocsinh@thpt.edu.vn"), true);
  assert.equal(kiemTraLienHe("0123456789"), false);
  assert.equal(kiemTraDuLieuDangKy({ hoTen: "A", lop: "12", nhuCau: "nganh", lienHe: "0912345678" }).hopLe, false);

  const resThieuD1 = await xuLyDangKySom(
    new Request("https://nguyenvongai.vn/api/dang-ky-som", {
      method: "POST",
      body: JSON.stringify({ hoTen: "Nguyễn Văn An", lop: "12", nhuCau: "nguyen_vong", lienHe: "0912345678" }),
    }),
    {},
  );
  assert.equal(resThieuD1.status, 503, "Không có D1 phải trả về 503 (Fail-closed, không báo thành công giả)");

  let daLuuD1 = false;
  const envD1: EnvDangKySom = {
    D1_CONG_DONG: {
      prepare: () => ({
        bind: () => ({
          run: async () => {
            daLuuD1 = true;
            return { success: true };
          },
        }),
      }),
    },
  };
  const resCoD1 = await xuLyDangKySom(
    new Request("https://nguyenvongai.vn/api/dang-ky-som", {
      method: "POST",
      body: JSON.stringify({ hoTen: "Nguyễn Văn An", lop: "12", nhuCau: "nguyen_vong", lienHe: "0912345678" }),
    }),
    envD1,
  );
  assert.equal(resCoD1.status, 200);
  assert.equal(daLuuD1, true);

  // 4.4. Kiểm định Báo sai lệch số liệu & Chặn XSS / PII trong đóng góp cộng đồng
  assert.equal(lamSachChu("<script>alert(1)</script>Điểm chuẩn <b>26,5</b>", 100), "alert(1) Điểm chuẩn 26,5");
  assert.equal(coThongTinCaNhan("Liên hệ Zalo 0912.345.678 để biết thêm"), true);
  assert.equal(kiemTraLink("javascript:alert(1)").ok, false);
  assert.equal(kiemTraLink("https://bit.ly/rut-gon", "congKhai").ok, false);
  assert.equal(kiemTraLink("https://tuyensinh.hust.edu.vn/de-an", "nguonChinhThuc").ok, true);

  const tapNganh = new Set(LUA_CHON.slice(0, 10).map((l) => l.id));
  const idMau = LUA_CHON[0].id;
  const baoSaiOk = kiemTraBaoSai(
    { id: "bs-1", maChuongTrinh: idMau, truongDuLieu: "diemChuan", noiDung: "Điểm chuẩn năm 2025 trong đề án là 26,75", link: "https://tuyensinh.hust.edu.vn/2025" },
    { tapNganh },
  );
  assert.ok(baoSaiOk.ok && baoSaiOk.duLieu.trangThai === "moi");
  const baoSaiMaLa = kiemTraBaoSai(
    { id: "bs-2", maChuongTrinh: "ma-khong-ton-tai", truongDuLieu: "diemChuan", noiDung: "Nội dung báo sai đủ dài" },
    { tapNganh },
  );
  assert.equal(baoSaiMaLa.ok, false, "Từ chối báo sai cho mã chương trình không tồn tại");

  // 4.5. Toàn vẹn hợp nhất CMS Snapshot (hop-nhat-snapshot)
  const nguonChuan = {
    url: "https://hust.edu.vn/de-an-2026.pdf",
    tieuDe: "Đề án tuyển sinh 2026",
    donViCongBo: "ĐH Bách khoa Hà Nội",
    ngayKiemChung: "2026-10-10",
  };
  const banGhiCms = (entityType: string, entityId: string, data: Record<string, unknown>): BanGhiCms =>
    ({
      id: "rec-1",
      entityType,
      entityId,
      version: 1,
      status: "PUBLISHED",
      data,
      source: nguonChuan,
      importance: "normal",
      changeNote: "Cập nhật chính thức",
      createdBy: "qtv",
      createdAt: "2026-10-10T00:00:00Z",
      updatedBy: "qtv",
      updatedAt: "2026-10-10T01:00:00Z",
    }) as unknown as BanGhiCms;

  // Nguồn giả trong data bị ghi đè bởi source đã kiểm chứng của bản ghi CMS
  const chuanSnap = chuanHoaChoSnapshot(
    banGhiCms("tuition", "BKA-HP2026", { mucThap: 30, mucCao: 38, nam: 2026, donVi: "trieu_nam", nguon: { url: "https://gia-mao.example/x" } }),
    { mucThap: 30, mucCao: 38, nam: 2026, donVi: "trieu_nam", nguon: { url: "https://gia-mao.example/x" } },
  );
  assert.equal((chuanSnap.nguon as { url: string }).url, nguonChuan.url, "Nguồn giả trong data bị thay bằng nguồn đã kiểm chứng");

  // Dựng snapshot & hợp nhất: Điểm chuẩn THPT cập nhật đúng ngành, điểm ĐGNL thang 1200 không đè điểm THPT thang 30
  const lcGoc = LUA_CHON[0];
  const snap = await taoSnapshotVaManifest(
    [
      banGhiCms("cutoff_score", `DC-THPT-${lcGoc.id}`, { id: lcGoc.id, nam: 2026, phuongThuc: "THPT", toHop: "A00", diemChuan: 28.25, maNganh: "" }),
      banGhiCms("cutoff_score", `DC-DGNL-${lcGoc.id}`, { id: lcGoc.id, nam: 2026, phuongThuc: "DGNL", toHop: "KHONG", diemChuan: 950, maNganh: "" }),
    ],
    "2026.10.12.01",
  );
  const daHopNhat = hopNhatLuaChonVaCms([lcGoc], { cutoffScores: snap.datasets.cutoffScores.duLieu });
  assert.equal(daHopNhat[0].diemMin, 28.25, "Điểm chuẩn THPT mới cập nhật đúng, không bị điểm ĐGNL 950 ghi đè");

  // Bản ghi thiếu nguồn kiểm chứng bị loại bỏ khi lấy chi tiết trường hợp nhất
  const ctKhongNguon = layChiTietTruongHopNhat("BKA", [lcGoc], {
    scholarships: [{ id: "hb-1", maTruong: "BKA", tenHocBong: "HB1", giaTri: "100%", dieuKien: "Top 1", nguon: undefined as never, capNhatLuc: "x" }],
  });
  assert.equal(ctKhongNguon?.hocBong.length ?? 0, 0, "Học bổng không có nguồn kiểm chứng bị loại bỏ");

  // Đảm bảo danh mục toàn cục luôn nguyên vẹn
  datDanhMuc([...LUA_CHON]);
  assert.equal(tim(lcGoc.id)?.diemMin, lcGoc.diemMin);

  console.log("✓ Hành trình 4 (Độ bền dữ liệu, Bảo mật API/PII & Hợp nhất CMS Snapshot) đạt 100%.");
}

console.log("=== TẤT CẢ 4 HÀNH TRÌNH ĐẦU-CUỐI (E2E JOURNEYS) ĐỀU ĐẠT 100% ===");

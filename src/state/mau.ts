import { CAU_HINH_MAC_DINH, isoNgay, thuHaiCuaTuan, xepLichTuan } from "@/engine/xep-lich";
import { LICH_CO_DINH_MAU } from "@/data/lich-mau";
import { viecChoTuan } from "@/features/ke-hoach/tao-viec-tuan";
import type { AppState } from "./store";
import { LUA_CHON, daNapLuaChon, idHoSoMau, THIEU_MUC_TIEU_MAU, timLuaChon } from "@/data/lua-chon-that";
import { nhanNguyenVong } from "@/engine/phan-tich";
import { tongChoLuaChon } from "@/features/kham-pha/to-hop";
import { TO_HOP, type DiemThi, type HoSo, type MaToHop, type MonId } from "./types";

export const HO_SO_TRONG: HoSo = {
  hoTen: "", khoi: null, tinh: "", giaiDoan: "", nganhQuanTam: [],
  diem: { toan: null, vatLy: null, hoaHoc: null, sinh: null, nguVan: null, tiengAnh: null },
  diemManh: [], canCaiThien: [], nganSach: null, choO: null, khuVuc: [],
  hocXaNha: null, quanTamViecLam: null, hoanTat: false,
};

export const TRANG_THAI_BAN_DAU: AppState = {
  phienBan: 2,
  hoSo: HO_SO_TRONG,
  mucTieu: null,
  nguyenVong: [], yeuThich: [], soSanh: [],
  diemThi: [], tinhHuong: [],
  coDinh: [], viec: [], trangThaiViec: {}, khoiHoc: [],
  cauHinh: CAU_HINH_MAC_DINH, tamTrang: "binhThuong", tamTrangNgay: undefined,
  nhacNho: { bat: false, truocPhut: 15, nhacChuanBiBai: true, gioChuanBiBai: "20:00" },
  lichSu: [],
  cauNoiHomNay: 0,
  loiNhan: [],
};

export type KieuMau = "minhAnh" | "giaBao";

/** Thông tin hiển thị cho các hồ sơ mẫu ở màn chào. */
export const DANH_SACH_MAU: { kieu: KieuMau; ten: string; khoi: string; mucTieu: string }[] = [
  { kieu: "minhAnh", ten: "Minh Anh", khoi: "Khối A01", mucTieu: "Công nghệ thông tin" },
  { kieu: "giaBao", ten: "Gia Bảo", khoi: "Khối D01", mucTieu: "Kinh tế" },
];

/**
 * Chọn 5 nguyện vọng cho hồ sơ mẫu theo một nhóm ngành và một tổ hợp: Thử sức, Vừa sức x2, An toàn, Dự phòng,
 * tính từ chính điểm mẫu. NV1 chọn ngành thiếu khoảng 1–2,5 điểm so với điểm chuẩn. Không gõ tay mã ngành.
 */
function chonNguyenVongMau(nhom: string, maToHop: MaToHop, diem: Record<MonId, number>, nganSach: number, thieu = THIEU_MUC_TIEU_MAU): string[] {
  const ds = LUA_CHON.filter((l) => l.nhomNganh === nhom && l.phuongThuc === "THPT" && l.toHopXet?.includes(maToHop)
    && (l.hocPhiMin === undefined || l.hocPhiMin <= nganSach) && Object.keys(l.diemTheoNam ?? {}).length >= 2)
    .map((l) => { const tong = tongChoLuaChon(l, diem).tong; return { l, tong }; })
    .filter((x): x is { l: (typeof LUA_CHON)[number]; tong: number } => x.tong !== null)
    .map((x) => ({ ...x, nhan: nhanNguyenVong(x.l, x.tong) }))
    .sort((a, b) => b.l.diemMin - a.l.diemMin);
  const chon: typeof ds = [];
  const conTrong = (u: (typeof ds)[number]) => !chon.includes(u) && !chon.some((c) => c.l.truong === u.l.truong && c.l.nganh === u.l.nganh);
  for (const [i, nhan] of (["Thử sức", "Vừa sức", "Vừa sức", "An toàn", "Dự phòng"] as const).entries()) {
    const hop = ds.filter((u) => u.nhan === nhan && conTrong(u));
    const x = i === 0 ? hop.find((u) => u.l.diemMin - u.tong >= thieu.it && u.l.diemMin - u.tong <= thieu.nhieu) ?? hop[0] : hop[0];
    if (x) chon.push(x);
  }
  return chon.map((u) => u.l.id);
}

/** Hồ sơ mẫu để thử giao diện và cho nhóm dev đi nhanh. Số liệu là mẫu, không phải người thật. Mặc định "Minh Anh". */
export function taoHoSoMau(kieu: KieuMau = "minhAnh"): AppState {
  if (!daNapLuaChon()) throw new Error("taoHoSoMau cần danh mục chương trình: gọi await khoDuLieu.sanSang() (hoặc napDanhMuc) trước.");
  const hom = new Date();
  const ngay = (lui: number) => isoNgay(new Date(hom.getFullYear(), hom.getMonth(), hom.getDate() - lui));
  const giaBao = kieu === "giaBao";
  const bangDiem: [MonId, number[]][] = giaBao
    ? [["toan", [7.0, 7.4, 7.5]], ["nguVan", [7.4, 7.6, 7.8]], ["tiengAnh", [7.8, 8.2, 8.4]], ["vatLy", [6.5, 6.8, 7.0]], ["hoaHoc", [6.6, 6.8, 7.0]], ["sinh", [7.0, 7.2, 7.2]]]
    : [["toan", [7.2, 7.6, 8.0]], ["vatLy", [8.0, 8.3, 8.5]], ["tiengAnh", [7.0, 7.5, 8.0]], ["hoaHoc", [7.0, 7.2, 7.2]], ["nguVan", [7.6, 7.5, 7.6]], ["sinh", [8.0, 8.2, 8.3]]];
  const diemThi: DiemThi[] = bangDiem.flatMap(([mon, d]) => d.map((diem, i) => ({ mon, diem, ngay: ngay((2 - i) * 14 + 1) })));
  // Chọn ngành theo điểm app thực sự dùng (lần thi thử mới nhất từng môn) và ngân sách "30-60" (tối đa 60 tr/năm).
  const diemMoiNhat = Object.fromEntries(diemThi.map((d) => [d.mon, d.diem])) as Record<MonId, number>;
  const maToHop: MaToHop = giaBao ? "D01" : "A01";
  const ids = giaBao ? chonNguyenVongMau("Kinh tế", "D01", diemMoiNhat, 60, { it: 0.3, nhieu: 0.8 }) : idHoSoMau(diemMoiNhat, 60);
  const hoSoMau: HoSo = giaBao
    ? {
      laMau: true, hoTen: "Trần Gia Bảo", khoi: 12, tinh: "TP. Hồ Chí Minh", giaiDoan: "", nganhQuanTam: ["Kinh tế"],
      diem: { toan: 7.3, vatLy: 6.8, hoaHoc: 6.8, sinh: 7.2, nguVan: 7.6, tiengAnh: 8.2 },
      soThich: { diem: { R: 1, I: 2, A: 2, S: 2, E: 5, C: 4 }, top: ["E", "C", "I"], giaTri: ["thuNhap", "onDinh"], luc: new Date().toISOString() },
      diemManh: ["Giao tiếp", "Tiếng Anh", "Thuyết trình"], canCaiThien: ["Toán", "Quản lý thời gian"],
      nganSach: "30-60", choO: "oNha", khuVuc: ["TP.HCM"],
      hocXaNha: true, quanTamViecLam: "rat", hoanTat: true,
    }
    : {
      laMau: true, hoTen: "Nguyễn Minh Anh", khoi: 12, tinh: "TP. Hồ Chí Minh", giaiDoan: "", nganhQuanTam: ["CNTT"],
      diem: { toan: 7.8, vatLy: 6.9, hoaHoc: 7.2, sinh: 8.3, nguVan: 7.6, tiengAnh: 8.1 },
      soThich: { diem: { R: 1, I: 5, A: 1, S: 1, E: 2, C: 2 }, top: ["I", "C", "E"], giaTri: ["thuNhap", "sangTao"], luc: new Date().toISOString() },
      diemManh: ["Tư duy logic", "Giải quyết vấn đề", "Tiếng Anh"], canCaiThien: ["Vật lý", "Diễn đạt", "Quản lý thời gian"],
      nganSach: "30-60", choO: "oNha", khuVuc: ["TP.HCM"],
      hocXaNha: true, quanTamViecLam: "rat", hoanTat: true,
      chungChiNgoaiNgu: { loai: "IELTS", diem: 7.0 },
      diemDgnl: { hcm: 875, hn: null, tsa: null },
      hocBa: { dtbLop10: 8.6, dtbLop11: 8.8, dtbLop12: 9.0, dtb3Nam: 8.8, hocLuc: "gioi", hanhKiem: "tot" },
      giaiThuongHsg: { cap: "tinh", mon: "Toán", giai: "ba" },
    };
  const nen: AppState = {
    ...TRANG_THAI_BAN_DAU,
    hoSo: hoSoMau,
    // Điểm mục tiêu đúng bằng điểm chuẩn của ngành mục tiêu (NV1); ngành mục tiêu thiếu khoảng 1–2,5 điểm (Gia Bảo: 0,3–0,8 điểm, ca "cố thêm chút nữa là chạm tới"), không vượt ngân sách.
    mucTieu: { luaChonId: ids[0], phuongThuc: "THPT", maToHop, toHop: TO_HOP[maToHop], diemMucTieu: timLuaChon(ids[0])?.diemMin ?? 26, ngayThi: isoNgay(new Date(hom.getFullYear() + (hom.getMonth() > 5 ? 1 : 0), 5, 26)) /* như ngayThiDuKien("nuocRut") ở state/chon.ts; không import để tránh vòng store → mau → chon */ },
    nguyenVong: ids.slice(0, 5),
    yeuThich: ids.slice(0, 1), soSanh: ids.slice(0, 2),
    diemThi,
    coDinh: LICH_CO_DINH_MAU,
    lichSu: [
      { viecId: "v-x1", ten: "Hoàn thành bài tập Toán (Chương 3)", luc: new Date(hom.getTime() - 3_600_000).toISOString(), trangThai: "xong" },
      { viecId: "v-x2", ten: "Ôn lại công thức Vật lý", luc: new Date(hom.getTime() - 7_200_000).toISOString(), trangThai: "xong" },
      { viecId: "v-x3", ten: "Đọc 1 bài báo tiếng Anh", luc: new Date(hom.getTime() - 86_400_000).toISOString(), trangThai: "doi" },
      { viecId: "v-x4", ten: "Hoàn thành đề Hóa học", luc: new Date(hom.getTime() - 90_000_000).toISOString(), trangThai: "xong" },
    ],
  };
  // Việc của tuần này do chính bộ sinh việc tạo từ mục tiêu và điểm của hồ sơ mẫu (không phải danh sách viết sẵn), rồi xếp sẵn vào lịch.
  const tuan = thuHaiCuaTuan(isoNgay(hom));
  const kqThu = viecChoTuan(nen, tuan, isoNgay(hom));
  const kq = kqThu.ok ? kqThu : viecChoTuan(nen, tuan);
  const viec = kq.ok ? kq.viec : [];
  const r = xepLichTuan({ tuanBatDau: tuan, tuNgay: kqThu.ok ? isoNgay(hom) : undefined, coDinh: nen.coDinh, viec, cfg: nen.cauHinh }); // nếu còn ngày thì chỉ xếp từ hôm nay, nếu cuối tuần thì xếp cả tuần
  return { ...nen, viec, khoiHoc: r.khoi };
}

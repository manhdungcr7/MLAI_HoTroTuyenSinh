import { CAU_HINH_MAC_DINH, congNgay, isoNgay, thuHaiCuaTuan, xepLichTuan } from "@/engine/xep-lich";
import { LICH_CO_DINH_MAU } from "@/data/lich-mau";
import { viecChoTuan } from "@/features/ke-hoach/tao-viec-tuan";
import type { AppState } from "./store";
import { idHoSoMau } from "@/data/lua-chon-that";
import { TO_HOP, type DiemThi, type HoSo, type MonId } from "./types";

export const HO_SO_TRONG: HoSo = {
  hoTen: "", khoi: null, tinh: "", giaiDoan: "", nganhQuanTam: [], mucTieuHienTai: null, nguonDiem: "hocBa",
  diem: { toan: null, vatLy: null, hoaHoc: null, sinh: null, nguVan: null, tiengAnh: null },
  diemManh: [], canCaiThien: [], cachHoc: [], nganSach: null, choO: null, khuVuc: [], ghiChuChiPhi: "",
  hocXaNha: null, quanTamViecLam: null, conDuong: null, hoanTat: false,
};

export const TRANG_THAI_BAN_DAU: AppState = {
  hoSo: HO_SO_TRONG,
  mucTieu: null,
  nguyenVong: [], yeuThich: [], soSanh: [],
  diemThi: [], tinhHuong: [],
  coDinh: [], viec: [], trangThaiViec: {}, khoiHoc: [],
  cauHinh: CAU_HINH_MAC_DINH, tamTrang: "binhThuong",
  nhacNho: { bat: false, truocPhut: 15, nhacChuanBiBai: true, gioChuanBiBai: "20:00" },
  lichSu: [],
  cauNoiHomNay: 0,
  loiNhan: [],
};

/** Hồ sơ mẫu "Minh Anh" – để thử giao diện và cho nhóm dev đi nhanh. Số liệu là mẫu, không phải người thật. */
export function taoHoSoMau(): AppState {
  const hom = new Date();
  const ngay = (lui: number) => isoNgay(new Date(hom.getFullYear(), hom.getMonth(), hom.getDate() - lui));
  const diemThi: DiemThi[] = ([
    ["toan", [7.2, 7.6, 8.0]], ["vatLy", [8.0, 8.3, 8.5]], ["tiengAnh", [7.0, 7.5, 8.0]],
    ["hoaHoc", [7.0, 7.2, 7.2]], ["nguVan", [7.6, 7.5, 7.6]], ["sinh", [8.0, 8.2, 8.3]],
  ] as [MonId, number[]][]).flatMap(([mon, d]) => d.map((diem, i) => ({ mon, diem, ngay: ngay((2 - i) * 14 + 1) })));
  const ids = idHoSoMau({ toan: 7.8, vatLy: 6.9, hoaHoc: 7.2, sinh: 8.3, nguVan: 7.6, tiengAnh: 8.1 });
  const nen: AppState = {
    ...TRANG_THAI_BAN_DAU,
    hoSo: {
      hoTen: "Nguyễn Minh Anh", khoi: 12, tinh: "TP. Hồ Chí Minh", giaiDoan: "Ôn thi THPT", nganhQuanTam: ["CNTT"], mucTieuHienTai: "daCoMoUoc",
      nguonDiem: "thiThu", diem: { toan: 7.8, vatLy: 6.9, hoaHoc: 7.2, sinh: 8.3, nguVan: 7.6, tiengAnh: 8.1 },
      soThich: { diem: { R: 4, I: 8, A: 4, S: 5, E: 4, C: 6 }, top: ["I", "C", "S"], luc: new Date().toISOString() },
      diemManh: ["Tư duy logic", "Giải quyết vấn đề", "Tiếng Anh"], canCaiThien: ["Vật lý", "Diễn đạt", "Quản lý thời gian"],
      cachHoc: ["Học qua bài tập", "Học theo dự án"], nganSach: "30-60", choO: "oNha", khuVuc: ["TP.HCM"], ghiChuChiPhi: "",
      hocXaNha: true, quanTamViecLam: "rat", conDuong: "daiHoc", hoanTat: true,
    },
    mucTieu: { luaChonId: ids[0], phuongThuc: "THPT", maToHop: "A01", toHop: TO_HOP.A01, diemMucTieu: 26, ngayThi: congNgay(isoNgay(hom), 266) },
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
  const kq = viecChoTuan(nen, tuan);
  const viec = kq.ok ? kq.viec : [];
  const r = xepLichTuan({ tuanBatDau: tuan, coDinh: nen.coDinh, viec, cfg: nen.cauHinh });
  return { ...nen, viec, khoiHoc: r.khoi };
}

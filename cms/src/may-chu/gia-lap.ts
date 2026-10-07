// Bộ xử lý dữ liệu mẫu khi chạy CMS ở chế độ giả lập (VITE_GIA_LAP=1 hoặc ?gia-lap=1).
import { DANH_SACH_TRUONG } from "../du-lieu/danh-sach-truong";
import { vaiTroMau } from "./che-do";
import { tienDoTruong } from "@/data/dong-gop-kiem-tra";
import type {
  ChiTietTruongApi, KenhBody, KetQuaPhatHanh, NguoiCms, NhatKyCms, PhanCongCms,
  SuaThongTinBody, TaoThongTinBody, ThongTinCms, TienDoTruong, Toi,
  TruongTrongDanhSach, BanGhiTruong,
} from "./kieu";

const DANG_PHAN_CONG_MAU: PhanCongCms[] = [
  { email: "ban@nguyenvongai.local", maTruong: "QSC" },
  { email: "ban@nguyenvongai.local", maTruong: "BKA" },
];

const NGUOI_MAU: NguoiCms[] = [
  { email: "ban@nguyenvongai.local", vaiTro: "qtv", taoLuc: "2026-01-01T00:00:00Z" },
  { email: "ctv1@nguyenvongai.local", vaiTro: "ctv", taoLuc: "2026-01-02T00:00:00Z" },
];

const KENH_LUC_DAU: Record<string, BanGhiTruong> = {
  QSC: {
    maTruong: "QSC",
    fanpageUrl: "https://facebook.com/uit.edu.vn",
    websiteTuyenSinhUrl: "https://tuyensinh.uit.edu.vn",
  },
};

const THONG_TIN_LUC_DAU: ThongTinCms[] = [
  {
    id: "tt-mau-1",
    maTruong: "QSC",
    loai: "hoc_phi",
    nam: 2026,
    trangThai: "duyet",
    phienBan: 1,
    luc: "2026-03-01T00:00:00Z",
    nguonGui: "cms",
    linkNguon: "https://tuyensinh.uit.edu.vn/hoc-phi",
    duLieu: { mucThap: 35, mucCao: 45, donVi: "trieu_nam", phamVi: "Chương trình chuẩn" },
  },
];

const NHAT_KY_LUC_DAU: NhatKyCms[] = [
  { id: 1, ai: "ban@nguyenvongai.local", hanhDong: "Duyệt học phí", doiTuong: "QSC", luc: "2026-03-01T00:00:00Z" },
];

function tinhTienDo(ma: string): TienDoTruong {
  const kenh = KENH_LUC_DAU[ma];
  const tt = THONG_TIN_LUC_DAU.filter((t) => t.maTruong === ma);
  return tienDoTruong(ma, kenh, tt);
}

export async function xuLyDuLieuMau(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  duong: string,
  query: Record<string, string | number | undefined>,
  body?: unknown,
): Promise<unknown> {
  // GET /toi
  if (method === "GET" && duong === "/toi") {
    const vai = vaiTroMau();
    const giao = DANG_PHAN_CONG_MAU.filter((p) => p.email === "ban@nguyenvongai.local").map((p) => p.maTruong);
    const toi: Toi = { email: "ban@nguyenvongai.local", vaiTro: vai, truongDuocGiao: giao };
    return toi;
  }

  // GET /truong/:ma
  const khopChiTiet = duong.match(/^\/truong\/([^/]+)$/);
  if (method === "GET" && khopChiTiet) {
    const ma = decodeURIComponent(khopChiTiet[1]);
    const kenh = KENH_LUC_DAU[ma];
    const thongTin = THONG_TIN_LUC_DAU.filter((t) => t.maTruong === ma);
    const ct: ChiTietTruongApi = { kenh, thongTin, tienDo: tinhTienDo(ma) };
    return ct;
  }

  // PUT /truong/:ma
  if (method === "PUT" && khopChiTiet) {
    const ma = decodeURIComponent(khopChiTiet[1]);
    const b = body as KenhBody;
    const moi: BanGhiTruong = { maTruong: ma, ...b };
    KENH_LUC_DAU[ma] = moi;
    return moi;
  }

  // GET /truong
  if (method === "GET" && duong === "/truong") {
    const trang = Number(query.trang || 1);
    const moi = Number(query.moi || 50);
    const cuaToi = query["cua-toi"] === "1" || query["cua-toi"] === 1;
    let ds = DANH_SACH_TRUONG.map((t) => {
      const td = tinhTienDo(t.ma);
      const res: TruongTrongDanhSach = { maTruong: t.ma, ten: t.ten, kenh: KENH_LUC_DAU[t.ma], tienDo: td };
      return res;
    });
    if (cuaToi) {
      const tapGiao = new Set(DANG_PHAN_CONG_MAU.filter((p) => p.email === "ban@nguyenvongai.local").map((p) => p.maTruong));
      ds = ds.filter((t) => tapGiao.has(t.maTruong));
    }
    const batDau = (trang - 1) * moi;
    return { truong: ds.slice(batDau, batDau + moi), tong: ds.length };
  }

  // GET /thong-tin
  if (method === "GET" && duong === "/thong-tin") {
    const trang = Number(query.trang || 1);
    const moi = Number(query.moi || 50);
    let ds = [...THONG_TIN_LUC_DAU];
    if (query.truong) ds = ds.filter((t) => t.maTruong === query.truong);
    if (query.loai) ds = ds.filter((t) => t.loai === query.loai);
    if (query.trangThai) ds = ds.filter((t) => t.trangThai === query.trangThai);
    const batDau = (trang - 1) * moi;
    return { thongTin: ds.slice(batDau, batDau + moi), tong: ds.length };
  }

  // POST /thong-tin
  if (method === "POST" && duong === "/thong-tin") {
    const b = body as TaoThongTinBody;
    const moi: ThongTinCms = {
      id: `tt-${Date.now()}`,
      maTruong: b.maTruong,
      loai: b.loai,
      nam: b.nam,
      trangThai: b.trangThai ?? "nhap",
      phienBan: 1,
      luc: new Date().toISOString(),
      nguonGui: "cms",
      linkNguon: b.linkNguon,
      duLieu: b.duLieu,
    } as unknown as ThongTinCms;
    THONG_TIN_LUC_DAU.unshift(moi);
    return moi;
  }

  // PATCH /thong-tin/:id
  const khopThongTinId = duong.match(/^\/thong-tin\/([^/]+)$/);
  if (method === "PATCH" && khopThongTinId) {
    const id = decodeURIComponent(khopThongTinId[1]);
    const b = body as SuaThongTinBody;
    const idx = THONG_TIN_LUC_DAU.findIndex((t) => t.id === id);
    if (idx >= 0) {
      const cu = THONG_TIN_LUC_DAU[idx];
      const moi: ThongTinCms = {
        ...cu,
        phienBan: (cu.phienBan ?? 1) + 1,
        luc: new Date().toISOString(),
        ...(b.nam !== undefined && { nam: b.nam }),
        ...(b.linkNguon !== undefined && { linkNguon: b.linkNguon }),
        ...(b.duLieu !== undefined && { duLieu: b.duLieu }),
        ...(b.trangThai !== undefined && { trangThai: b.trangThai }),
        ...(b.lyDo && { lyDoTuChoi: b.lyDo }),
      } as unknown as ThongTinCms;
      THONG_TIN_LUC_DAU[idx] = moi;
      return moi;
    }
    return null;
  }

  // GET /tien-do
  if (method === "GET" && duong === "/tien-do") {
    const cuaToi = query["cua-toi"] === "1" || query["cua-toi"] === 1;
    let ds = DANH_SACH_TRUONG.map((t) => tinhTienDo(t.ma));
    if (cuaToi) {
      const tapGiao = new Set(DANG_PHAN_CONG_MAU.filter((p) => p.email === "ban@nguyenvongai.local").map((p) => p.maTruong));
      ds = ds.filter((t) => tapGiao.has(t.maTruong));
    }
    const dem = ds.filter((t) => t.du).length;
    const trang = Number(query.trang || 1);
    const moi = Number(query.moi || 50);
    const batDau = (trang - 1) * moi;
    return { truong: ds.slice(batDau, batDau + moi), tongDu: dem, tong: ds.length };
  }

  // GET /nguoi
  if (method === "GET" && duong === "/nguoi") {
    return { nguoi: NGUOI_MAU };
  }

  // POST /nguoi
  if (method === "POST" && duong === "/nguoi") {
    const b = body as { email: string; vaiTro: "ctv" | "qtv" };
    const moi: NguoiCms = { email: b.email, vaiTro: b.vaiTro, taoLuc: new Date().toISOString() };
    NGUOI_MAU.push(moi);
    return moi;
  }

  // DELETE /nguoi
  if (method === "DELETE" && duong === "/nguoi") {
    const email = String(query.email ?? "");
    const idx = NGUOI_MAU.findIndex((n) => n.email === email);
    if (idx >= 0) NGUOI_MAU.splice(idx, 1);
    return undefined;
  }

  // GET /phan-cong
  if (method === "GET" && duong === "/phan-cong") {
    let ds = [...DANG_PHAN_CONG_MAU];
    if (query.email) ds = ds.filter((p) => p.email === query.email);
    return { phanCong: ds };
  }

  // PUT /phan-cong
  if (method === "PUT" && duong === "/phan-cong") {
    const b = body as { email: string; maTruong: string[] };
    const giu = DANG_PHAN_CONG_MAU.filter((p) => p.email !== b.email);
    const moi = b.maTruong.map((ma) => ({ email: b.email, maTruong: ma }));
    DANG_PHAN_CONG_MAU.length = 0;
    DANG_PHAN_CONG_MAU.push(...giu, ...moi);
    return b;
  }

  // GET /nhat-ky
  if (method === "GET" && duong === "/nhat-ky") {
    const trang = Number(query.trang || 1);
    const moi = Number(query.moi || 50);
    const batDau = (trang - 1) * moi;
    return { nhatKy: NHAT_KY_LUC_DAU.slice(batDau, batDau + moi), tong: NHAT_KY_LUC_DAU.length };
  }

  // POST /phat-hanh
  if (method === "POST" && duong === "/phat-hanh") {
    const res: KetQuaPhatHanh = { luc: new Date().toISOString(), soTruong: DANH_SACH_TRUONG.length, soBanGhi: THONG_TIN_LUC_DAU.length };
    return res;
  }

  return null;
}

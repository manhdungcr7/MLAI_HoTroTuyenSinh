// Hợp đồng dữ liệu cho kết nối Claude/ChatGPT (MCP + GPT Actions). TypeScript thuần, dùng chung trình duyệt và máy chủ.
// Nguyên tắc: trình duyệt TÍNH SẴN (nhãn, điểm chuẩn, kế hoạch tuần) rồi đẩy "bản chụp"; máy chủ chỉ kiểm tra, lưu và phục vụ,
// không nạp bộ 3.652 chương trình. Bản chụp KHÔNG chứa tên, liên hệ, lịch sử chat.

/** Một sự kiện lịch. Giờ luôn có múi +07:00, ví dụ "2026-10-19T19:00:00+07:00". */
export interface SuKienLich {
  tieuDe: string; batDau: string; ketThuc: string; ghiChu?: string;
  /** Chỉ có khi khối lịch liên kết tới việc thật trong app; không dùng tiêu đề làm định danh. */
  taskId?: string;
  progressStatus?: "chua" | "xong" | "doi" | "boQua";
}

export interface NguyenVongChiTiet {
  thuTu: number; // 1 là nguyện vọng ưu tiên nhất
  id: string; // id chương trình trong app
  nganh: string; truong: string; maTruong: string;
  diemChuan?: Record<string, number>; // năm -> điểm, tối đa 2 năm gần nhất
  nhan?: "Thử sức" | "Vừa sức" | "An toàn" | "Dự phòng"; chenh?: number; // chênh điểm của em so với điểm chuẩn
  hocPhiTrieu?: number; hocPhiUocTinh?: boolean;
  nguon?: string;
}

export interface GoiYNganh { id: string; nganh: string; truong: string; maTruong: string; diemChuan?: number; namDiem?: number; nhan?: NguyenVongChiTiet["nhan"]; chenh?: number }

export interface BanChup {
  phienBan: 1;
  capNhat: string; // ISO
  hoSo: { lop?: number | null; tinh?: string; nganhQuanTam?: string[]; nganSachToiDaTrieu?: number | null; khuVuc?: string[]; toHopCaoNhat?: { ma: string; tong: number } | null };
  mucTieu?: { nganh: string; truong: string; diemCan?: number; conThieu?: number } | null;
  diemThi: { ngay: string; tong?: number; toHop?: string }[];
  nguyenVong: NguyenVongChiTiet[]; // tối đa 30
  goiY: GoiYNganh[]; // tối đa 20: để Claude/ChatGPT có id hợp lệ khi đề xuất thêm nguyện vọng
  keHoachTuan: SuKienLich[]; // tối đa 40, đã xếp giờ thật theo lịch của em
}

export const GIOI_HAN_BAN_CHUP = { byte: 64_000, nguyenVong: 30, goiY: 20, suKien: 40, diemThi: 20, chuoi: 200 } as const;

/** Loại đề xuất mà Claude/ChatGPT được phép tạo. Chỉ là đề xuất: app hiện thẻ và em bấm Xác nhận mới đổi dữ liệu. */
export const LOAI_DE_XUAT = ["them-nguyen-vong", "sap-xep-nguyen-vong", "cap-nhat-diem", "dat-muc-tieu", "cap-nhat-tien-do"] as const;
export type LoaiDeXuat = (typeof LOAI_DE_XUAT)[number];

export interface DeXuat {
  id: string; loai: LoaiDeXuat;
  tomTat: string; // câu một dòng hiển thị trên thẻ, do máy chủ dựng (không lấy nguyên văn từ AI)
  duLieu: { idChuongTrinh?: string; viTri?: number; thuTuMoi?: string[]; diem?: { ngay?: string; tong: number; toHop?: string }; mucTieu?: { idChuongTrinh: string }; taskId?: string; status?: "xong" | "chua"; snapshotUpdatedAt?: string; expectedStatus?: "chua" | "xong" | "doi" | "boQua" };
  taoLuc: number; // epoch ms
}

const cat = (x: unknown, n: number = GIOI_HAN_BAN_CHUP.chuoi) => String(x ?? "").slice(0, n);
const so = (x: unknown) => (typeof x === "number" && Number.isFinite(x) ? x : undefined);
const NHAN = ["Thử sức", "Vừa sức", "An toàn", "Dự phòng"] as const;
const nhan = (x: unknown) => ((NHAN as readonly unknown[]).includes(x) ? (x as NguyenVongChiTiet["nhan"]) : undefined);
const mang = (x: unknown, n: number): Record<string, unknown>[] => (Array.isArray(x) ? x.filter((e): e is Record<string, unknown> => !!e && typeof e === "object").slice(0, n) : []);
const RE_GIO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+07:00$/;

/** Kiểm tra và làm sạch bản chụp từ trình duyệt (không tin dữ liệu gửi lên). Sai hình dạng trả null. */
export function lamSachBanChup(x: unknown): BanChup | null {
  if (!x || typeof x !== "object") return null;
  const o = x as Record<string, unknown>;
  if (o.phienBan !== 1) return null;
  const h = (o.hoSo && typeof o.hoSo === "object" ? o.hoSo : {}) as Record<string, unknown>;
  const th = h.toHopCaoNhat as Record<string, unknown> | null | undefined;
  const ds = (v: unknown, n: number) => (Array.isArray(v) ? v.filter((t): t is string => typeof t === "string").slice(0, n).map((t) => cat(t, 60)) : undefined);
  const nv = mang(o.nguyenVong, GIOI_HAN_BAN_CHUP.nguyenVong).flatMap((e, i): NguyenVongChiTiet[] => {
    if (typeof e.id !== "string" || !e.id) return [];
    const dc = e.diemChuan && typeof e.diemChuan === "object" ? Object.fromEntries(Object.entries(e.diemChuan as Record<string, unknown>).flatMap(([k, v]) => (so(v) !== undefined && /^\d{4}$/.test(k) ? [[k, v as number]] : [])).slice(0, 3)) : undefined;
    return [{ thuTu: so(e.thuTu) ?? i + 1, id: cat(e.id, 40), nganh: cat(e.nganh), truong: cat(e.truong), maTruong: cat(e.maTruong, 12), ...(dc && Object.keys(dc).length ? { diemChuan: dc } : {}), ...(nhan(e.nhan) ? { nhan: nhan(e.nhan) } : {}), ...(so(e.chenh) !== undefined ? { chenh: so(e.chenh) } : {}), ...(so(e.hocPhiTrieu) !== undefined ? { hocPhiTrieu: so(e.hocPhiTrieu) } : {}), ...(e.hocPhiUocTinh === true ? { hocPhiUocTinh: true } : {}), ...(typeof e.nguon === "string" ? { nguon: cat(e.nguon) } : {}) }];
  });
  const gy = mang(o.goiY, GIOI_HAN_BAN_CHUP.goiY).flatMap((e): GoiYNganh[] => (typeof e.id === "string" && e.id ? [{ id: cat(e.id, 40), nganh: cat(e.nganh), truong: cat(e.truong), maTruong: cat(e.maTruong, 12), ...(so(e.diemChuan) !== undefined ? { diemChuan: so(e.diemChuan) } : {}), ...(so(e.namDiem) !== undefined ? { namDiem: so(e.namDiem) } : {}), ...(nhan(e.nhan) ? { nhan: nhan(e.nhan) } : {}), ...(so(e.chenh) !== undefined ? { chenh: so(e.chenh) } : {}) }] : []));
  const sk = mang(o.keHoachTuan, GIOI_HAN_BAN_CHUP.suKien).flatMap((e): SuKienLich[] => {
    if (typeof e.batDau !== "string" || typeof e.ketThuc !== "string" || !RE_GIO.test(e.batDau) || !RE_GIO.test(e.ketThuc) || e.batDau >= e.ketThuc) return [];
    const taskId = typeof e.taskId === "string" && e.taskId.length > 0 && e.taskId.length <= 120 ? e.taskId : undefined;
    const progressStatus = ["chua", "xong", "doi", "boQua"].includes(String(e.progressStatus)) ? e.progressStatus as SuKienLich["progressStatus"] : undefined;
    return [{ tieuDe: cat(e.tieuDe, 120), batDau: e.batDau, ketThuc: e.ketThuc, ...(typeof e.ghiChu === "string" ? { ghiChu: cat(e.ghiChu, 400) } : {}), ...(taskId ? { taskId, ...(progressStatus ? { progressStatus } : {}) } : {}) }];
  });
  const dt = mang(o.diemThi, GIOI_HAN_BAN_CHUP.diemThi).map((e) => ({ ngay: cat(e.ngay, 10), ...(so(e.tong) !== undefined ? { tong: so(e.tong) } : {}), ...(typeof e.toHop === "string" ? { toHop: cat(e.toHop, 6) } : {}) }));
  const mt = o.mucTieu && typeof o.mucTieu === "object" ? (o.mucTieu as Record<string, unknown>) : null;
  const r: BanChup = {
    phienBan: 1, capNhat: cat(o.capNhat, 30),
    hoSo: { lop: so(h.lop) ?? null, tinh: cat(h.tinh, 60), nganhQuanTam: ds(h.nganhQuanTam, 8), nganSachToiDaTrieu: so(h.nganSachToiDaTrieu) ?? null, khuVuc: ds(h.khuVuc, 4), toHopCaoNhat: th && typeof th.ma === "string" && so(th.tong) !== undefined ? { ma: cat(th.ma, 6), tong: th.tong as number } : null },
    mucTieu: mt ? { nganh: cat(mt.nganh), truong: cat(mt.truong), ...(so(mt.diemCan) !== undefined ? { diemCan: so(mt.diemCan) } : {}), ...(so(mt.conThieu) !== undefined ? { conThieu: so(mt.conThieu) } : {}) } : null,
    diemThi: dt, nguyenVong: nv, goiY: gy, keHoachTuan: sk,
  };
  return JSON.stringify(r).length <= GIOI_HAN_BAN_CHUP.byte ? r : null;
}

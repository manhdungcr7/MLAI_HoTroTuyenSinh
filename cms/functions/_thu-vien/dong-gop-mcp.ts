// MCP đóng góp dữ liệu cho cộng tác viên: giao thức JSON-RPC 2.0 (không trạng thái) và năm công cụ.
// Mọi ghi đi vào đúng hàng đợi CMS (status SUBMITTED = chờ duyệt) qua các hàm workflow dùng chung với /api/ban-ghi.
// Không bao giờ duyệt, xuất bản, xóa, hay sửa bản đã xuất bản. Quyền: sa/qtv mọi trường, ctv chỉ trường trong phan_cong.
import chuongTrinhJson from "../../src/du-lieu-truong/chuong-trinh-truong.json";
import type { VaiTro } from "../../../src/data/dong-gop-kiem-tra";
import type { BanGhiCms, TrangThaiCms } from "../../../src/engine/du-lieu-tuyen-sinh/kieu";
import { chuyenTrangThaiWorkflow, taoBanNhapMoi, taoPhienBanSuaDoi } from "../../../src/engine/du-lieu-tuyen-sinh/workflow";
import { cauKiemToan, kiemTraData, mapTuD1, maTruongCua, type HangBanGhiD1, type NhapQuaAI } from "./ban-ghi-d1";
import { coPhanCong, truongDuocGiao } from "./d1";
import { gioiHanHang } from "./khoa-ket-noi";
import { gonKetQua, kiemHangDiemChuan, kiemNguonMcp, laChenhLon, maBanGhiDiemChuan, nguonCmsTuMcp, SO_HANG_TOI_DA, type HangDeXuat } from "./dong-gop-kiem";
import type { Env, KhoD1, KhoD1Cau } from "./kieu";
import { LoiHttp } from "./phan-hoi";
import { TAP_TRUONG, TEN_TRUONG } from "./quyen";

export const PHIEN_BAN_MCP_HO_TRO = ["2025-06-18", "2025-03-26"] as const;
const TEN_MCP = "nguyenvong-dong-gop";
const PHIEN_BAN_MAY_CHU = "1.0.0";

type DongChuongTrinh = [string, string, number | null, number | null, string];
const DS_CHUONG_TRINH = chuongTrinhJson as unknown as Record<string, DongChuongTrinh[]>;
const chuongTrinhCua = (ma: string): { id: string; nganh: string }[] => (DS_CHUONG_TRINH[ma] ?? []).map(([id, nganh]) => ({ id, nganh }));

export interface NguCanhDongGop {
  d1: KhoD1;
  env: Env;
  email: string;
  vaiTro: VaiTro;
  khoaId: string;
  bayGio: Date;
  taoId: () => string;
}

const laQuanTri = (v: VaiTro) => v === "sa" || v === "qtv";
const lucOf = (c: NguCanhDongGop) => c.bayGio.toISOString();

/** Trường trong phạm vi của người gọi. Mã lạ hoặc không được giao thì false. */
async function coPhamVi(c: NguCanhDongGop, ma: string): Promise<boolean> {
  if (!TAP_TRUONG.has(ma)) return false;
  if (laQuanTri(c.vaiTro)) return true;
  return (await coPhanCong(c.d1, c.email, ma)).length > 0;
}

function maTruongTuDoiSo(v: unknown): string {
  if (typeof v !== "string" || !/^[A-Za-z0-9]{1,32}$/.test(v.trim())) throw new LoiHttp(400, "du-lieu-sai", "maTruong là mã trường (chữ và số), ví dụ BKA");
  const ma = v.trim().toUpperCase();
  if (!TAP_TRUONG.has(ma)) throw new LoiHttp(400, "du-lieu-sai", `Mã trường ${ma} không có trong danh sách trường của dự án`);
  return ma;
}

async function baoPhamVi(c: NguCanhDongGop, ma: string) {
  if (!(await coPhamVi(c, ma))) throw new LoiHttp(403, "ngoai-pham-vi", "Trường này chưa được giao cho bạn. Hãy nhờ quản trị viên giao trường trong mục Thành viên.");
}

/** Điều kiện lọc một trường trong ban_ghi_cms (cùng cách với ?truong= của /api/ban-ghi, dùng chỉ mục). */
function dieuKienTruong(ma: string): { sql: string; gt: string[] } {
  const hoa = ma.toUpperCase(), thuong = ma.toLowerCase();
  return {
    sql: "(entity_id IN (?, ?) OR (entity_id >= ? AND entity_id < ?) OR (entity_id >= ? AND entity_id < ?))",
    gt: [hoa, thuong, `${hoa}-`, `${hoa}.`, `${thuong}-`, `${thuong}.`],
  };
}

// ============ Công cụ ============

async function truongCuaToi(c: NguCanhDongGop) {
  if (laQuanTri(c.vaiTro)) {
    const ds = [...TAP_TRUONG].sort();
    return { vaiTro: c.vaiTro, tatCa: true, soTruong: ds.length, maTruong: ds };
  }
  const ds = (await truongDuocGiao(c.d1, c.email)).filter((m) => TAP_TRUONG.has(m));
  return { vaiTro: c.vaiTro, tatCa: false, soTruong: ds.length, truong: ds.map((m) => ({ maTruong: m, ten: TEN_TRUONG[m] ?? "" })) };
}

async function xemDuLieuTruong(c: NguCanhDongGop, a: Record<string, unknown>) {
  const ma = maTruongTuDoiSo(a.maTruong);
  await baoPhamVi(c, ma);
  const namMacDinh = c.bayGio.getFullYear() - 1;
  const nam = a.nam === undefined ? namMacDinh : a.nam;
  if (typeof nam !== "number" || !Number.isInteger(nam) || nam < 2015 || nam > c.bayGio.getFullYear() + 1) throw new LoiHttp(400, "du-lieu-sai", "nam phải là số nguyên trong khoảng 2015 đến năm sau");
  const dk = dieuKienTruong(ma);

  const dem = await c.d1.prepare(`SELECT entity_type AS loai, COUNT(*) AS c FROM ban_ghi_cms WHERE status = 'PUBLISHED' AND ${dk.sql} GROUP BY entity_type LIMIT 20`)
    .bind(...dk.gt).all<{ loai: string; c: number }>();
  const daCong = Object.fromEntries(dem.results.map((r) => [r.loai, Number(r.c)]));

  // Điểm chuẩn năm được hỏi: PUBLISHED = đã công bố, SUBMITTED/IN_REVIEW/APPROVED = đang chờ, không gửi lại.
  const cc = await c.d1.prepare(`SELECT json_extract(data_json, '$.id') AS ma, status FROM ban_ghi_cms WHERE entity_type = 'cutoff_score' AND status IN ('PUBLISHED', 'SUBMITTED', 'IN_REVIEW', 'APPROVED') AND json_extract(data_json, '$.nam') = ? AND ${dk.sql} LIMIT 2000`)
    .bind(nam, ...dk.gt).all<{ ma: string | null; status: string }>();
  const coCong = new Set<string>(), dangCho = new Set<string>();
  for (const r of cc.results) if (r.ma) (r.status === "PUBLISHED" ? coCong : dangCho).add(String(r.ma).toLowerCase());

  const ct = chuongTrinhCua(ma);
  const chuaCo = ct.filter((x) => !coCong.has(x.id) && !dangCho.has(x.id));
  const cho = await c.d1.prepare(`SELECT COUNT(*) AS c FROM ban_ghi_cms WHERE status IN ('SUBMITTED', 'IN_REVIEW') AND ${dk.sql}`).bind(...dk.gt).first<{ c: number }>();
  const kenh = await c.d1.prepare("SELECT fanpage_url, nhom_tuyen_sinh_chinh_thuc_url, nhom_cong_dong_url, website_tuyen_sinh_url FROM truong_cong_dong WHERE ma_truong = ? LIMIT 1").bind(ma).first();

  const thieu: string[] = [];
  if (chuaCo.length) thieu.push(`diem_chuan_nam_${nam}`);
  if (!daCong.tuition) thieu.push("hoc_phi");
  if (!kenh) thieu.push("kenh_tuyen_sinh");

  return {
    maTruong: ma,
    ten: TEN_TRUONG[ma] ?? "",
    nam,
    soChuongTrinh: ct.length,
    diemChuan: { daCong: coCong.size, dangChoDuyet: dangCho.size, chuaCo: { soLuong: chuaCo.length, mau: chuaCo.slice(0, 15) } },
    hocPhi: { soBanGhiDaCong: daCong.tuition ?? 0 },
    banGhiDaCongBo: daCong,
    dangChoDuyetTatCa: Number(cho?.c ?? 0),
    kenhDaCo: Boolean(kenh),
    thieu,
    huongDan: "Điền các chương trình trong diemChuan.chuaCo.mau trước (dùng đúng idChuongTrinh). Mỗi hàng cần nguon.trichDan là dòng chép nguyên văn từ tài liệu.",
  };
}

const TRANG_THAI_HIEN = (s: TrangThaiCms): string => {
  switch (s) {
    case "DRAFT": return "nhap";
    case "SUBMITTED": case "IN_REVIEW": return "cho_duyet";
    case "APPROVED": return "da_duyet";
    case "PUBLISHED": return "da_cong_bo";
    case "REJECTED": return "tu_choi";
    default: return "da_thay_the";
  }
};

async function deXuatDiemChuan(c: NguCanhDongGop, a: Record<string, unknown>) {
  const ma = maTruongTuDoiSo(a.maTruong);
  await baoPhamVi(c, ma);
  const nguonKq = kiemNguonMcp(a.nguon);
  if (!nguonKq.ok) throw new LoiHttp(400, "du-lieu-sai", nguonKq.loi);
  const nguonMcp = nguonKq.nguon;
  if (!Array.isArray(a.hang) || a.hang.length < 1 || a.hang.length > SO_HANG_TOI_DA) throw new LoiHttp(400, "du-lieu-sai", `hang phải là mảng từ 1 đến ${SO_HANG_TOI_DA} hàng`);
  const hang = a.hang as unknown[];

  // Giới hạn tần suất tính theo số hàng nhận được (kể cả hàng sai, để không dò được bằng cách gửi liên tục).
  await gioiHanHang(c.env, c.khoaId, hang.length, c.bayGio);

  const ctMa = new Set(chuongTrinhCua(ma).map((x) => x.id));
  const ten = TEN_TRUONG[ma] ?? ma;
  const luc = lucOf(c);
  const boQua: { viTri: number; idChuongTrinh?: string; lyDo: string }[] = [];
  const daVao: { viTri: number; idChuongTrinh: string; nam: number; diem: number; phuongThuc: string; toHop: string; chenhLon: boolean; loai: "moi" | "sua_ban_da_cong_bo" }[] = [];
  const daThay = new Set<string>();
  const hopLe: { viTri: number; hang: HangDeXuat; maBan: string }[] = [];

  for (let i = 0; i < hang.length; i++) {
    const viTri = i + 1;
    const kq = kiemHangDiemChuan(hang[i], ctMa, c.bayGio);
    if (!kq.ok) { boQua.push({ viTri, lyDo: kq.loi }); continue; }
    const h: HangDeXuat = kq.hang;
    const maBan = maBanGhiDiemChuan(ma, h.nam, h.idChuongTrinh, h.phuongThuc, h.toHop);
    if (daThay.has(maBan)) { boQua.push({ viTri, idChuongTrinh: h.idChuongTrinh, lyDo: "Trùng hàng khác trong cùng lần gửi" }); continue; }
    daThay.add(maBan);
    hopLe.push({ viTri, hang: h, maBan });
  }

  // Đọc theo lô hữu hạn (tối đa 100 mã) rồi ghi trong một giao dịch: tránh N lần chờ D1
  // khi MCP gửi nhiều hàng. Mỗi mã vẫn giới hạn 10 phiên bản như trước để không quét lịch sử vô hạn.
  const hangHienCo = hopLe.length
    ? await c.d1.batch(hopLe.map(({ maBan }) => c.d1.prepare("SELECT * FROM ban_ghi_cms WHERE entity_type = 'cutoff_score' AND entity_id = ? ORDER BY version DESC LIMIT 10").bind(maBan))) as unknown as { results: HangBanGhiD1[] }[]
    : [];
  const cauGhi: KhoD1Cau[] = [];

  for (const [i, ungVien] of hopLe.entries()) {
    const { viTri, hang: h, maBan } = ungVien;
    // Trạng thái hiện có của đúng mục này (mọi phiên bản). Không gửi chồng lên bản đang xử lý.
    const ds = (hangHienCo[i]?.results ?? []).map(mapTuD1);
    const dangMo = ds.find((b) => b.status === "DRAFT" || b.status === "SUBMITTED" || b.status === "IN_REVIEW" || b.status === "APPROVED" || b.status === "REJECTED");
    if (dangMo) { boQua.push({ viTri, idChuongTrinh: h.idChuongTrinh, lyDo: `Mục này đã có bản đang ở trạng thái ${TRANG_THAI_HIEN(dangMo.status)}, không gửi trùng` }); continue; }
    const cong = ds.find((b) => b.status === "PUBLISHED");
    const diemCu = cong ? Number((cong.data as Record<string, unknown>).diemChuan) : null;
    if (cong && diemCu === h.diem) { boQua.push({ viTri, idChuongTrinh: h.idChuongTrinh, lyDo: "Đã đúng như đang công bố, không cần gửi" }); continue; }

    const duLieu = kiemTraData({
      id: h.idChuongTrinh, tenNganh: chuongTrinhCua(ma).find((x) => x.id === h.idChuongTrinh)?.nganh ?? "", maTruong: ma, maNganh: "",
      nam: h.nam, phuongThuc: h.phuongThuc, toHop: h.toHop, diemChuan: h.diem,
      loaiDiem: "diem_chuan", ...(h.phuongThuc === "THPT" ? { thangDiem: 30 } : {}),
    }, maBan, "cutoff_score");
    const nguon = nguonCmsTuMcp(nguonMcp, c.email, luc, ten);
    const changeNote = `Nhập qua AI (MCP): ${nguonMcp.loai}, trang ${nguonMcp.trang}`.slice(0, 500);
    const id = c.taoId();
    const kqTao = cong
      ? taoPhienBanSuaDoi({ newId: id, banGhiHienTai: cong, duLieuMoi: duLieu, sourceMoi: nguon, changeNote, actorEmail: c.email, actorRole: "contributor", now: luc })
      : taoBanNhapMoi({ id, entityType: "cutoff_score", entityId: maBan, data: duLieu, source: nguon, changeNote, actorEmail: c.email, actorRole: "contributor", now: luc });
    if (!kqTao.thanhCong || !kqTao.duLieu) { boQua.push({ viTri, idChuongTrinh: h.idChuongTrinh, lyDo: kqTao.loi ?? "Không tạo được bản ghi" }); continue; }
    const nop = chuyenTrangThaiWorkflow({ banGhi: kqTao.duLieu, trangThaiDich: "SUBMITTED", actorEmail: c.email, actorRole: "contributor", now: luc });
    if (!nop.thanhCong || !nop.duLieu) { boQua.push({ viTri, idChuongTrinh: h.idChuongTrinh, lyDo: nop.loi ?? "Không gửi được vào hàng chờ" }); continue; }
    const b: BanGhiCms = { ...nop.duLieu, version: ds.length ? Math.max(...ds.map((x) => x.version)) + 1 : nop.duLieu.version };
    const chenh = laChenhLon(h.diem, diemCu);
    const dau: NhapQuaAI = {
      nhapQuaAI: true, via: "mcp", khoaId: c.khoaId, email: c.email, nguon: nguonMcp, chenhLon: chenh,
      ...(diemCu !== null && { diemCu }),
    };
    cauGhi.push(c.d1.prepare(
      `INSERT INTO ban_ghi_cms (id, entity_type, entity_id, version, status, data_json, source_url, source_title, source_publisher, source_published_at, source_verified_at,
         importance, change_note, previous_version_id, created_by, created_at, updated_by, updated_at, submitted_by, submitted_at, nhap_qua_ai)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      b.id, b.entityType, b.entityId, b.version, b.status, JSON.stringify(b.data), b.source.url, b.source.tieuDe, b.source.donViCongBo, b.source.ngayCongBo ?? null, b.source.ngayKiemChung,
      b.importance, b.changeNote, b.previousVersionId ?? null, b.createdBy, b.createdAt, b.updatedBy, b.updatedAt, b.submittedBy ?? null, b.submittedAt ?? null, JSON.stringify(dau),
    ));
    daVao.push({ viTri, idChuongTrinh: h.idChuongTrinh, nam: h.nam, diem: h.diem, phuongThuc: h.phuongThuc, toHop: h.toHop, chenhLon: chenh, loai: cong ? "sua_ban_da_cong_bo" : "moi" });
  }

  // Nhật ký đi cùng batch ghi: lỗi ghi không thể tạo một phần hàng đợi mà vẫn báo thành công.
  cauGhi.push(cauKiemToan(c.d1, {
    email: c.email, hanhDong: "MCP_DE_XUAT", entityType: "school", entityId: ma, version: 0,
    ghiChu: `via=mcp; cong_cu=de_xuat_diem_chuan; khoa=${c.khoaId}; so_hang=${hang.length}; nhan=${daVao.length}`, luc,
  }));
  await c.d1.batch(cauGhi);

  return {
    maTruong: ma,
    soHangNhan: hang.length,
    chapNhan: daVao.length,
    daVaoHangChoDuyet: daVao,
    boQua,
    luuY: "Đã vào hàng chờ duyệt trong CMS. Học sinh chưa thấy số này cho tới khi quản trị viên duyệt và xuất bản.",
  };
}

async function trangThaiDongGop(c: NguCanhDongGop) {
  const tong = await c.d1.prepare("SELECT COUNT(*) AS c FROM ban_ghi_cms WHERE created_by = ? AND nhap_qua_ai IS NOT NULL").bind(c.email).first<{ c: number }>();
  const ds = await c.d1.prepare("SELECT * FROM ban_ghi_cms WHERE created_by = ? AND nhap_qua_ai IS NOT NULL ORDER BY updated_at DESC, id LIMIT 20").bind(c.email).all<HangBanGhiD1>();
  return {
    tong: Number(tong?.c ?? 0),
    dong: ds.results.map((h) => {
      const b = mapTuD1(h);
      const d = b.data as Record<string, unknown>;
      return {
        maTruong: maTruongCua(h.entity_id),
        idChuongTrinh: d.id, nam: d.nam, diem: d.diemChuan,
        trangThai: TRANG_THAI_HIEN(b.status),
        ...(b.rejectionReason ? { lyDoTuChoi: b.rejectionReason } : {}),
        ...(b.nhapQuaAI?.chenhLon ? { chenhLon: true } : {}),
        capNhatLuc: b.updatedAt,
      };
    }),
    ghiChu: "Hiện tối đa 20 đề xuất gần nhất. Đã duyệt nghĩa là đã vào hàng xuất bản; chỉ quản trị viên mới xuất bản lên web.",
  };
}

// ============ Định nghĩa công cụ (mô tả tiếng Anh cho AI, dữ liệu trả về tiếng Việt) ============

export const DINH_NGHIA_CONG_CU = [
  {
    name: "truong_cua_toi",
    description: "List the school codes this contributor may edit. Admins get all schools. Call this first.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "xem_du_lieu_truong",
    description: "Show what is already published for one school and which programs still lack cutoff scores for a year (diemChuan.chuaCo.mau). Call before proposing data.",
    inputSchema: {
      type: "object",
      properties: {
        maTruong: { type: "string", description: "School code, e.g. BKA" },
        nam: { type: "integer", description: "Admission year to check. Default: last year." },
      },
      required: ["maTruong"],
      additionalProperties: false,
    },
  },
  {
    name: "de_xuat_diem_chuan",
    description: "Propose cutoff scores for one school. Each row goes to the CMS approval queue (not published). Every call needs a source with an exact quote (trichDan). Max 100 rows.",
    inputSchema: {
      type: "object",
      properties: {
        maTruong: { type: "string", description: "School code, e.g. BKA" },
        hang: {
          type: "array",
          maxItems: SO_HANG_TOI_DA,
          items: {
            type: "object",
            properties: {
              idChuongTrinh: { type: "string", description: "Program id from xem_du_lieu_truong" },
              nam: { type: "integer", description: "Admission year, e.g. 2025" },
              diem: { type: "number", description: "Cutoff score, e.g. 26.5" },
              phuongThuc: { type: "string", description: "THPT (default), DGNL, HOC_BA or KHAC" },
              toHop: { type: "string", description: "Subject group, e.g. A00. Default KHONG." },
            },
            required: ["idChuongTrinh", "nam", "diem"],
            additionalProperties: false,
          },
        },
        nguon: {
          type: "object",
          description: "Source of every row in this call",
          properties: {
            loai: { type: "string", description: "Source type, e.g. de_an, thong_bao" },
            url: { type: "string", description: "http or https link to the document" },
            trang: { type: "string", description: "Page number or short location" },
            trichDan: { type: "string", description: "Exact line copied from the document (5 to 300 characters)" },
          },
          required: ["loai", "url", "trang", "trichDan"],
          additionalProperties: false,
        },
      },
      required: ["maTruong", "hang", "nguon"],
      additionalProperties: false,
    },
  },
  {
    name: "trang_thai_dong_gop",
    description: "Show this contributor's recent proposals and their status (waiting, approved, rejected with reason).",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
] as const;

/** Chạy một công cụ, trả về chuỗi JSON gọn (tối đa khoảng 3KB). Lỗi nghiệp vụ ném LoiHttp, hiển thị nguyên văn cho AI. */
export async function chayCongCu(c: NguCanhDongGop, ten: string, a: Record<string, unknown>): Promise<string> {
  switch (ten) {
    case "truong_cua_toi": return gonKetQua(await truongCuaToi(c));
    case "xem_du_lieu_truong": return gonKetQua(await xemDuLieuTruong(c, a));
    case "de_xuat_diem_chuan": return gonKetQua(await deXuatDiemChuan(c, a));
    case "trang_thai_dong_gop": return gonKetQua(await trangThaiDongGop(c));
    default: throw new LoiHttp(404, "khong-co-cong-cu", "Không có công cụ tên này. Gọi tools/list để xem danh sách.");
  }
}

// ============ JSON-RPC 2.0 ============

export type ThongDiepRpc = Record<string, unknown>;
const ket = (id: unknown, result: unknown): ThongDiepRpc => ({ jsonrpc: "2.0", id, result });
const loiRpc = (id: unknown, code: number, message: string): ThongDiepRpc => ({ jsonrpc: "2.0", id, error: { code, message } });

/** Một thông điệp JSON-RPC. Trả null nếu là thông báo (không có id), HTTP sẽ là 202. */
export async function xuLyThongDiep(msg: unknown, c: NguCanhDongGop): Promise<ThongDiepRpc | null> {
  if (typeof msg !== "object" || msg === null || Array.isArray(msg)) return loiRpc(null, -32600, "Yêu cầu không đúng JSON-RPC");
  const m = msg as Record<string, unknown>;
  const laThongBao = !("id" in m);
  const id = laThongBao ? null : m.id;
  const phuong = typeof m.method === "string" ? m.method : "";
  if (m.jsonrpc !== "2.0" || !phuong) return laThongBao ? null : loiRpc(id, -32600, "Thiếu jsonrpc 2.0 hoặc method");
  if (laThongBao) return null;

  switch (phuong) {
    case "initialize": {
      const p = (m.params ?? {}) as { protocolVersion?: unknown };
      const v = typeof p.protocolVersion === "string" && (PHIEN_BAN_MCP_HO_TRO as readonly string[]).includes(p.protocolVersion) ? p.protocolVersion : PHIEN_BAN_MCP_HO_TRO[0];
      return ket(id, {
        protocolVersion: v,
        capabilities: { tools: {} },
        serverInfo: { name: TEN_MCP, version: PHIEN_BAN_MAY_CHU },
        instructions: "Dùng để đóng góp số liệu tuyển sinh vào hàng chờ duyệt của CMS. Luôn gọi truong_cua_toi, xem_du_lieu_truong trước, và chỉ gửi số có trích dẫn nguyên văn từ tài liệu.",
      });
    }
    case "ping": return ket(id, {});
    case "tools/list": return ket(id, { tools: DINH_NGHIA_CONG_CU });
    case "tools/call": {
      const p = (m.params ?? {}) as { name?: unknown; arguments?: unknown };
      const ten = typeof p.name === "string" ? p.name : "";
      const a = typeof p.arguments === "object" && p.arguments !== null && !Array.isArray(p.arguments) ? (p.arguments as Record<string, unknown>) : {};
      try {
        return ket(id, { content: [{ type: "text", text: await chayCongCu(c, ten, a) }] });
      } catch (e) {
        if (e instanceof LoiHttp) return ket(id, { content: [{ type: "text", text: e.thongBao }], isError: true });
        console.error("mcp-dong-gop", e instanceof Error ? e.message : e);
        return ket(id, { content: [{ type: "text", text: "Máy chủ gặp lỗi, thử lại sau. Chưa có gì được ghi thêm nếu lỗi xảy ra trước khi gửi hàng." }], isError: true });
      }
    }
    default: return loiRpc(id, -32601, "Không có phương thức này");
  }
}

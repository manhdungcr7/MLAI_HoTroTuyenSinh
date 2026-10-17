// Công cụ dùng chung cho MCP (/mcp/{mã} hoặc /mcp với Bearer) và GPT Actions (/api/gpt/{mã}/...): một nguồn logic, không nhân đôi.
// Tra cứu danh mục, đọc bản chụp hoặc tạo đề xuất chờ xác nhận. Không đổi trực tiếp dữ liệu thật của học sinh.
import { linkGoogleCalendar, taoIcs } from "../../src/engine/lich-ics";
import type { BanChup } from "../../src/engine/ket-noi-kieu";
import { TOI_DA_DE_XUAT_CHO, type KhoD1Ket } from "./ket-noi";
import { DANH_MUC_TRUONG } from "../../src/data/truong-danh-muc";
import { capabilityDefinitions, executeCapability, validateSchema, type JsonSchema } from "../../src/capabilities";

export interface NguCanhCongCu { ban: BanChup; ma: string; maBam: string; origin: string; db: KhoD1Ket }
export type KetQuaCongCu = { ok: true; data: unknown; meta?: unknown } | { ok: false; loi: string; code?: string; details?: unknown };

interface CongCu {
  ten: string;
  mota: string;
  schema: JsonSchema;
  chay: (args: Record<string, unknown>, cc: NguCanhCongCu) => Promise<KetQuaCongCu>;
}

const KHONG_THAM_SO = { type: "object", properties: {}, additionalProperties: false };
const loi = (thongBao: string): KetQuaCongCu => ({ ok: false, loi: thongBao });
const khongDau = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d");
export const TEN_LICH = "Nguyện Vọng AI";

async function runCapability(name: string, args: Record<string, unknown>, cc: NguCanhCongCu): Promise<KetQuaCongCu> {
  const result = await executeCapability(name, args, cc.ban);
  return result.ok ? { ok: true, data: result.data, meta: result.meta }
    : { ok: false, loi: result.error.message, code: result.error.code, details: result.error.details };
}

/** Nội dung .ics của kế hoạch tuần. Dùng chung cho công cụ và endpoint lich.ics. */
export function lichIcsCuaBan(ban: BanChup): string {
  return taoIcs(ban.keHoachTuan, TEN_LICH);
}

async function deXuatThemNguyenVong(idChuongTrinh: string, viTri: number | undefined, cc: NguCanhCongCu): Promise<KetQuaCongCu> {
  const ct = cc.ban.nguyenVong.find((v) => v.id === idChuongTrinh) ?? cc.ban.goiY.find((g) => g.id === idChuongTrinh);
  if (!ct) return loi("Chương trình này không có trong bản chụp của em. Gọi goi_y_nganh để lấy id hợp lệ trước.");
  const tomTat = `Thêm ${ct.nganh} (${ct.truong}) ${viTri ? `vào vị trí ${viTri}` : "vào cuối"} danh sách nguyện vọng`.slice(0, 200);
  const duLieu = JSON.stringify(viTri ? { idChuongTrinh, viTri } : { idChuongTrinh });
  const db = cc.db;
  // Một câu lệnh: không thêm nếu đã có đề xuất chờ cùng chương trình, và không vượt giới hạn số đề xuất chờ.
  const id = crypto.randomUUID();
  const kq = await db.prepare(
    "INSERT INTO ket_noi_de_xuat (id, ma_bam, loai, tom_tat, du_lieu, trang_thai, tao_luc) " +
    "SELECT ?, ?, 'them-nguyen-vong', ?, ?, 'cho', ? " +
    "WHERE NOT EXISTS (SELECT 1 FROM ket_noi_de_xuat WHERE ma_bam = ? AND loai = 'them-nguyen-vong' AND trang_thai = 'cho' AND json_extract(du_lieu, '$.idChuongTrinh') = ?) " +
    "AND (SELECT COUNT(*) FROM ket_noi_de_xuat WHERE ma_bam = ? AND trang_thai = 'cho') < ?",
  ).bind(id, cc.maBam, tomTat, duLieu, Date.now(), cc.maBam, idChuongTrinh, cc.maBam, TOI_DA_DE_XUAT_CHO).run();
  if ((kq.meta?.changes ?? 0) > 0) {
    return { ok: true, data: { trangThai: "cho", deXuatId: id, loiNhan: "Đã gửi đề xuất, đang chờ bạn xác nhận trong app" } };
  }
  const co = await db.prepare("SELECT id FROM ket_noi_de_xuat WHERE ma_bam = ? AND loai = 'them-nguyen-vong' AND trang_thai = 'cho' AND json_extract(du_lieu, '$.idChuongTrinh') = ? LIMIT 1")
    .bind(cc.maBam, idChuongTrinh).first<{ id: string }>();
  if (co) return { ok: true, data: { trangThai: "cho", deXuatId: co.id, loiNhan: "Đề xuất này đã gửi trước đó, đang chờ bạn xác nhận trong app" } };
  return loi(`Đã có ${TOI_DA_DE_XUAT_CHO} đề xuất đang chờ. Nhờ em xác nhận hoặc từ chối bớt trong ứng dụng trước nhé.`);
}

export const CONG_CU: CongCu[] = [
  {
    ten: "lay_ho_so",
    mota: "Get the student's profile snapshot (grade, province, interested majors, budget, scores, goal). Data is in Vietnamese.",
    schema: KHONG_THAM_SO,
    chay: async (_a, cc) => ({ ok: true, data: { capNhat: cc.ban.capNhat, hoSo: cc.ban.hoSo, mucTieu: cc.ban.mucTieu ?? null, diemThi: cc.ban.diemThi } }),
  },
  {
    ten: "lay_nguyen_vong",
    mota: "Get the student's ordered list of university program choices (wishes), with cutoff scores, labels and tuition. Data is in Vietnamese.",
    schema: KHONG_THAM_SO,
    chay: async (_a, cc) => ({ ok: true, data: { capNhat: cc.ban.capNhat, nguyenVong: cc.ban.nguyenVong } }),
  },
  {
    ten: "goi_y_nganh",
    mota: "Get suggested programs the student could add to the list. Each item has an id needed by de_xuat_them_nguyen_vong.",
    schema: KHONG_THAM_SO,
    chay: async (_a, cc) => ({ ok: true, data: { capNhat: cc.ban.capNhat, goiY: cc.ban.goiY } }),
  },
  {
    ten: "diem_chuan",
    mota: "Look up cutoff scores by major or school name (matches the student's choices and suggestions only). Returns the years available with their source; says 'chưa có' when missing.",
    schema: { type: "object", properties: { truyVan: { type: "string", maxLength: 100, description: "Major or school name, e.g. 'công nghệ thông tin UIT'" } }, required: ["truyVan"] },
    chay: async (a, cc) => {
      const q = khongDau(String(a.truyVan ?? "").trim().slice(0, 100)).trim();
      if (!q) return loi("Cho mình biết tên ngành hoặc tên trường cần tra");
      const tu = q.split(/\s+/).filter(Boolean);
      const khop = (...chu: string[]) => { const gop = khongDau(chu.join(" ")); return tu.every((t) => gop.includes(t)); };
      const ketQua: Record<string, unknown>[] = [];
      const daCo = new Set<string>();
      for (const v of cc.ban.nguyenVong) {
        if (!khop(v.nganh, v.truong, v.maTruong)) continue;
        daCo.add(v.id);
        ketQua.push({ nganh: v.nganh, truong: v.truong, maTruong: v.maTruong, diemChuan: v.diemChuan ?? "chưa có", nguon: v.nguon ?? null });
      }
      for (const g of cc.ban.goiY) {
        if (daCo.has(g.id) || !khop(g.nganh, g.truong, g.maTruong)) continue;
        daCo.add(g.id);
        const diem = g.diemChuan !== undefined && g.namDiem !== undefined ? { [String(g.namDiem)]: g.diemChuan } : "chưa có";
        ketQua.push({ nganh: g.nganh, truong: g.truong, maTruong: g.maTruong, diemChuan: diem, nguon: null });
      }
      const kq = ketQua.slice(0, 10);
      return { ok: true, data: { truyVan: q, capNhat: cc.ban.capNhat, ketQua: kq, ...(kq.length ? {} : { ghiChu: "Không có trong nguyện vọng hoặc gợi ý của em. Thử tên ngành hoặc tên trường khác, không tự suy ra điểm." }) } };
    },
  },
  {
    ten: "ke_hoach_tuan",
    mota: "Get the student's weekly study plan events with Google Calendar link and an .ics file URL for each event. Times are Vietnam time (+07:00).",
    schema: KHONG_THAM_SO,
    chay: async (_a, cc) => ({
      ok: true,
      data: {
        // Dùng cho update_study_progress (get_study_plan là bí danh của công cụ này): đề xuất phải kèm đúng phiên bản kế hoạch đã đọc.
        capNhat: cc.ban.capNhat, snapshotUpdatedAt: cc.ban.capNhat,
        suKien: cc.ban.keHoachTuan.map((e) => ({ ...e, linkGoogleCalendar: linkGoogleCalendar(e), ...(cc.ma ? { icsUrl: `${cc.origin}/api/gpt/${cc.ma}/lich.ics` } : {}) })),
      },
    }),
  },
  {
    ten: "de_xuat_them_nguyen_vong",
    mota: "Propose adding a program to the student's wish list. Only creates a pending suggestion; the student must confirm it in the app. idChuongTrinh must come from goi_y_nganh or lay_nguyen_vong.",
    schema: {
      type: "object",
      properties: {
        idChuongTrinh: { type: "string", maxLength: 40, description: "Program id from goi_y_nganh" },
        viTri: { type: "integer", minimum: 1, maximum: 30, description: "Optional position in the wish list (1 = first)" },
      },
      required: ["idChuongTrinh"],
    },
    chay: async (a, cc) => {
      const id = String(a.idChuongTrinh ?? "").trim().slice(0, 40);
      if (!id) return loi("Thiếu idChuongTrinh. Gọi goi_y_nganh để lấy id hợp lệ trước.");
      let viTri: number | undefined;
      if (a.viTri !== undefined && a.viTri !== null) {
        const n = Number(a.viTri);
        if (!Number.isInteger(n) || n < 1 || n > 30) return loi("viTri phải là số nguyên từ 1 đến 30");
        viTri = n;
      }
      return deXuatThemNguyenVong(id, viTri, cc);
    },
  },
  {
    ten: "get_university_profile",
    mota: "Compatibility alias for get_university. Read source verification metadata before quoting data.",
    schema: { type: "object", properties: { maTruong: { type: "string", minLength: 1, maxLength: 12 } }, required: ["maTruong"], additionalProperties: false },
    chay: (args, cc) => runCapability("get_university", args, cc),
  },
  {
    ten: "get_app_capabilities",
    mota: "Get tool names, authentication methods and bundled dataset limitations; no student data.",
    schema: KHONG_THAM_SO,
    chay: async () => ({
      ok: true,
      data: {
        ten: "Nguyện Vọng AI",
        phienBan: "2.0.0",
        tongSoTruong: DANH_MUC_TRUONG.length,
        datasetStatus: "Bundled snapshot; not independently verified; freshness unknown; not live CMS",
        phuongThucXacThuc: "OAuth 2.1 (RFC 7636 PKCE S256) hoặc mã kết nối",
        congCuHoTro: CONG_CU.map((c) => c.ten),
      },
    }),
  },
];

/** Phạm vi OAuth cần để gọi từng công cụ. Đăng nhập bằng mã trong đường dẫn (cách cũ) không kiểm phạm vi. */
export const PHAM_VI_CONG_CU: Record<string, string> = {
  lay_ho_so: "profile:read",
  lay_nguyen_vong: "preferences:read",
  goi_y_nganh: "admissions:read",
  diem_chuan: "admissions:read",
  ke_hoach_tuan: "study:read",
  de_xuat_them_nguyen_vong: "preferences:write",
  search_universities: "admissions:read",
  get_university_profile: "admissions:read",
};

const BIEN_THE: Record<string, string> = {
  get_student_profile: "lay_ho_so",
  get_study_plan: "ke_hoach_tuan",
};

// Canonical tools share the exact deterministic capability implementation used by HTTP adapters.
for (const definition of capabilityDefinitions) {
  const existing = CONG_CU.findIndex((c) => c.ten === definition.name);
  const tool: CongCu = {
    ten: definition.name,
    mota: definition.description,
    schema: definition.inputSchema,
    chay: (args, cc) => runCapability(definition.name, args, cc),
  };
  if (existing >= 0) CONG_CU[existing] = tool;
  else CONG_CU.push(tool);
}

// `truyVan` remains accepted for clients connected before the canonical `q` argument.
const search = CONG_CU.find((c) => c.ten === "search_universities")!;
search.schema = { ...search.schema, properties: { ...search.schema.properties, truyVan: { type: "string", maxLength: 100 } } };
const runSearch = search.chay;
search.chay = (args, cc) => {
  if (args.q !== undefined && args.truyVan !== undefined) return Promise.resolve({ ok: false, code: "INVALID_ARGUMENT", loi: "Chỉ dùng q hoặc truyVan" });
  const { truyVan, ...rest } = args;
  return runSearch(truyVan === undefined ? rest : { ...rest, q: truyVan }, cc);
};

CONG_CU.push({
  ten: "get_study_plan", mota: "Read the authenticated student's latest weekly study-plan snapshot. Times include +07:00. This does not regenerate the plan.",
  schema: KHONG_THAM_SO, chay: async (_args, cc) => ({ ok: true, data: {
    capNhat: cc.ban.capNhat, snapshotUpdatedAt: cc.ban.capNhat,
    suKien: cc.ban.keHoachTuan.map((event) => ({ ...event, linkGoogleCalendar: linkGoogleCalendar(event) })),
  } }),
}, {
  ten: "update_study_progress",
  mota: "Create a pending study-progress proposal. The student must confirm in the app before any progress changes. Use taskId and snapshotUpdatedAt from get_study_plan; never invent IDs.",
  schema: { type: "object", additionalProperties: false, properties: {
    taskId: { type: "string", minLength: 1, maxLength: 120 },
    status: { type: "string", enum: ["xong", "chua"] },
    snapshotUpdatedAt: { type: "string", minLength: 1, maxLength: 30 },
  }, required: ["taskId", "status", "snapshotUpdatedAt"] },
  chay: async (args, cc) => {
    if (args.snapshotUpdatedAt !== cc.ban.capNhat) return { ok: false, code: "STALE_SNAPSHOT", loi: "Kế hoạch đã thay đổi. Gọi get_study_plan để đọc lại trước khi đề xuất." };
    if (!cc.ban.keHoachTuan.some((task) => task.taskId === args.taskId)) return { ok: false, code: "TASK_NOT_FOUND", loi: "Không có taskId này trong kế hoạch đã đồng bộ. Mở ứng dụng và đồng bộ lại kế hoạch." };
    const task = cc.ban.keHoachTuan.find((task) => task.taskId === args.taskId)!;
    const duLieu = JSON.stringify({ taskId: args.taskId, status: args.status, snapshotUpdatedAt: args.snapshotUpdatedAt, expectedStatus: task.progressStatus ?? "chua" });
    const id = crypto.randomUUID();
    const tomTat = `${args.status === "xong" ? "Đánh dấu đã xong" : "Đánh dấu chưa xong"}: ${task.tieuDe}`.slice(0, 200);
    const result = await cc.db.prepare(
      "INSERT INTO ket_noi_de_xuat (id, ma_bam, loai, tom_tat, du_lieu, trang_thai, tao_luc) " +
      "SELECT ?, ?, 'cap-nhat-tien-do', ?, ?, 'cho', ? " +
      "WHERE NOT EXISTS (SELECT 1 FROM ket_noi_de_xuat WHERE ma_bam = ? AND loai = 'cap-nhat-tien-do' AND trang_thai = 'cho' AND du_lieu = ?) " +
      "AND (SELECT COUNT(*) FROM ket_noi_de_xuat WHERE ma_bam = ? AND trang_thai = 'cho') < ?",
    ).bind(id, cc.maBam, tomTat, duLieu, Date.now(), cc.maBam, duLieu, cc.maBam, TOI_DA_DE_XUAT_CHO).run();
    const existing = (result.meta?.changes ?? 0) > 0 ? { id } : await cc.db.prepare(
      "SELECT id FROM ket_noi_de_xuat WHERE ma_bam = ? AND loai = 'cap-nhat-tien-do' AND trang_thai = 'cho' AND du_lieu = ? LIMIT 1",
    ).bind(cc.maBam, duLieu).first<{ id: string }>();
    if (!existing) return { ok: false, code: "PENDING_LIMIT", loi: "Đã đủ đề xuất đang chờ. Xác nhận hoặc từ chối bớt trong ứng dụng." };
    return { ok: true, data: { trangThai: "cho", deXuatId: existing.id, taskId: args.taskId, status: args.status, snapshotUpdatedAt: args.snapshotUpdatedAt, loiNhan: "Đang chờ em xác nhận trong ứng dụng; tiến độ chưa thay đổi." } };
  },
});

for (const tool of CONG_CU) tool.schema = { ...tool.schema, additionalProperties: false };

Object.assign(PHAM_VI_CONG_CU, {
  get_app_capabilities: "admissions:read", get_university: "admissions:read", search_majors: "admissions:read",
  get_admission_rules: "admissions:read", calculate_admission_score: "admissions:read",
  analyze_student_profile: "profile:read", recommend_preferences: "profile:read", validate_preference_order: "profile:read",
  get_study_plan: "study:read", update_study_progress: "study:write",
});

/** Every tool must declare all permissions; missing declarations deny OAuth access. */
export function phamViCanThiet(ten: string): string[] {
  if (ten === "recommend_preferences" || ten === "validate_preference_order") return ["profile:read", "preferences:read", "admissions:read"];
  const scope = PHAM_VI_CONG_CU[ten];
  return scope ? [scope] : [];
}

export const tenCongCu = (ten: string): CongCu | undefined => {
  const t = BIEN_THE[ten] ?? ten;
  return CONG_CU.find((c) => c.ten === t);
};

/** Chạy công cụ theo tên. Tên lạ trả lỗi thường (không ném). */
export async function chayCongCu(ten: string, args: Record<string, unknown>, cc: NguCanhCongCu): Promise<KetQuaCongCu> {
  const c = tenCongCu(ten);
  if (!c) return loi("Không có công cụ này");
  const errors = validateSchema(args, c.schema);
  if (errors.length) return { ok: false, code: "INVALID_ARGUMENT", loi: "Tham số không hợp lệ", details: errors };
  return c.chay(args, cc);
}

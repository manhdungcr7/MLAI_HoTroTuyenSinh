// Công cụ dùng chung cho MCP (/mcp/{mã}) và GPT Actions (/api/gpt/{mã}/...): một nguồn logic, không nhân đôi.
// Công cụ chỉ đọc bản chụp hoặc tạo đề xuất chờ xác nhận. Không công cụ nào đổi dữ liệu thật của học sinh.
import { linkGoogleCalendar, taoIcs } from "../../src/engine/lich-ics";
import type { BanChup } from "../../src/engine/ket-noi-kieu";
import { TOI_DA_DE_XUAT_CHO, type KhoD1Ket } from "./ket-noi";

export interface NguCanhCongCu { ban: BanChup; ma: string; maBam: string; origin: string; db: KhoD1Ket }
export type KetQuaCongCu = { ok: true; data: unknown } | { ok: false; loi: string };

interface CongCu {
  ten: string;
  mota: string;
  schema: Record<string, unknown>;
  chay: (args: Record<string, unknown>, cc: NguCanhCongCu) => Promise<KetQuaCongCu>;
}

const KHONG_THAM_SO = { type: "object", properties: {} };
const loi = (thongBao: string): KetQuaCongCu => ({ ok: false, loi: thongBao });
const khongDau = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d");
export const TEN_LICH = "Nguyện Vọng AI";

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
        capNhat: cc.ban.capNhat,
        suKien: cc.ban.keHoachTuan.map((e) => ({ ...e, linkGoogleCalendar: linkGoogleCalendar(e), icsUrl: `${cc.origin}/api/gpt/${cc.ma}/lich.ics` })),
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
];

export const tenCongCu = (ten: string): CongCu | undefined => CONG_CU.find((c) => c.ten === ten);

/** Chạy công cụ theo tên. Tên lạ trả lỗi thường (không ném). */
export async function chayCongCu(ten: string, args: Record<string, unknown>, cc: NguCanhCongCu): Promise<KetQuaCongCu> {
  const c = tenCongCu(ten);
  if (!c) return loi("Không có công cụ này");
  return c.chay(args, cc);
}

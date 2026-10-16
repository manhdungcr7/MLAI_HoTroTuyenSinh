// Khóa kết nối cá nhân cho người trong quan_tri (sa, qtv, ctv) dùng với AI của họ qua /api/mcp-dong-gop.
// Lưu trong bảng khoa_api (migration 0001): pham_vi 'de_xuat', chỉ lưu băm SHA-256, khóa gốc chỉ hiện đúng một lần lúc tạo.
// Quyền không chép vào khóa: mỗi lần gọi tra lại quan_tri (vai) và phan_cong (trường), nên hạ vai hoặc xóa là mất quyền ngay.
import { hoSoQuanTri } from "./d1";
import type { Env, KhoD1, KhoKV } from "./kieu";
import { LoiHttp } from "./phan-hoi";

export const TIEN_TO_KHOA = "nvk_";
export const KHOP_KHOA = /^nvk_[0-9a-f]{40}$/;
export const PHAM_VI_KHOA = "de_xuat";
export const SO_KHOA_TOI_DA = 3;
export const SO_NGAY_MAC_DINH = 90;
export const SO_NGAY_TOI_DA = 365;
/** Một thông điệp chung cho mọi lỗi xác thực (sai, hết hạn, thu hồi, không thuộc quan_tri): không tiết lộ khóa có tồn tại hay không. */
export const THONG_BAO_KHOA_SAI = "Khóa kết nối không hợp lệ, đã hết hạn hoặc đã bị thu hồi.";

export const HAN_MOI_PHUT = 60;
export const HAN_MOI_NGAY = 500;

const hex = (b: Uint8Array) => Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");

/** Khóa mới: "nvk_" + 40 chữ hex (20 byte ngẫu nhiên, 160 bit). */
export function sinhKhoa(): string {
  const b = new Uint8Array(20);
  crypto.getRandomValues(b);
  return TIEN_TO_KHOA + hex(b);
}

export async function bamKhoa(khoa: string): Promise<string> {
  return hex(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(khoa))));
}

export interface KhoaCuaToi {
  id: string;
  tienTo: string;
  taoLuc: string;
  hetHan: string;
  thuHoiLuc: string | null;
  lanDungCuoi: string | null;
  conHieuLuc: boolean;
}

interface HangKhoa { id: string; tien_to: string; tao_luc: string; het_han: string; thu_hoi_luc: string | null; lan_dung_cuoi: string | null }

/** Các khóa của chính người này (mới nhất trước). Khóa đã thu hồi vẫn hiện để họ thấy lịch sử. */
export async function dsKhoaCuaToi(d1: KhoD1, email: string, luc: string): Promise<KhoaCuaToi[]> {
  const r = await d1.prepare("SELECT id, tien_to, tao_luc, het_han, thu_hoi_luc, lan_dung_cuoi FROM khoa_api WHERE email = ? AND pham_vi = ? ORDER BY tao_luc DESC LIMIT 20")
    .bind(email, PHAM_VI_KHOA).all<HangKhoa>();
  return r.results.map((h) => ({
    id: h.id, tienTo: h.tien_to, taoLuc: h.tao_luc, hetHan: h.het_han, thuHoiLuc: h.thu_hoi_luc, lanDungCuoi: h.lan_dung_cuoi,
    conHieuLuc: h.thu_hoi_luc === null && h.het_han > luc,
  }));
}

export async function demKhoaConHieuLuc(d1: KhoD1, email: string, luc: string): Promise<number> {
  const h = await d1.prepare("SELECT COUNT(*) AS c FROM khoa_api WHERE email = ? AND pham_vi = ? AND thu_hoi_luc IS NULL AND het_han > ?")
    .bind(email, PHAM_VI_KHOA, luc).first<{ c: number }>();
  return Number(h?.c ?? 0);
}

/** Tạo khóa mới. Khóa gốc chỉ nằm trong giá trị trả về; DB chỉ có băm. Tối đa SO_KHOA_TOI_DA khóa còn hiệu lực mỗi người. */
export async function taoKhoa(d1: KhoD1, email: string, soNgay: number, luc: string, taoId: () => string = () => crypto.randomUUID()) {
  if ((await demKhoaConHieuLuc(d1, email, luc)) >= SO_KHOA_TOI_DA) {
    throw new LoiHttp(409, "du-khoa", `Mỗi người tối đa ${SO_KHOA_TOI_DA} khóa còn hiệu lực. Thu hồi bớt khóa cũ rồi tạo khóa mới.`);
  }
  const khoa = sinhKhoa();
  const hetHan = new Date(Date.parse(luc) + soNgay * 86_400_000).toISOString();
  const id = taoId();
  const tienTo = khoa.slice(0, 10);
  await d1.prepare("INSERT INTO khoa_api (id, email, tien_to, bam_sha256, pham_vi, truong_duoc_phep, tao_luc, het_han) VALUES (?, ?, ?, ?, ?, '[]', ?, ?)")
    .bind(id, email, tienTo, await bamKhoa(khoa), PHAM_VI_KHOA, luc, hetHan).run();
  return { khoa, id, tienTo, hetHan };
}

/** Thu hồi khóa của chính người này. Trả false nếu không có khóa nào như vậy (hoặc đã thu hồi). */
export async function thuHoiKhoa(d1: KhoD1, email: string, id: string, luc: string): Promise<{ thuHoi: boolean; tienTo?: string }> {
  const h = await d1.prepare("SELECT tien_to FROM khoa_api WHERE id = ? AND email = ? AND pham_vi = ? AND thu_hoi_luc IS NULL LIMIT 1")
    .bind(id, email, PHAM_VI_KHOA).first<{ tien_to: string }>();
  if (!h) return { thuHoi: false };
  const r = await d1.prepare("UPDATE khoa_api SET thu_hoi_luc = ? WHERE id = ? AND thu_hoi_luc IS NULL").bind(luc, id).run();
  return { thuHoi: (r.meta?.changes ?? 0) > 0, tienTo: h.tien_to };
}

export interface NguoiQuaKhoa { email: string; vaiTro: "sa" | "qtv" | "ctv"; khoaId: string }

/**
 * Xác thực `Authorization: Bearer nvk_...`. Mọi lỗi (thiếu, sai định dạng, không có trong DB, hết hạn, đã thu hồi,
 * không phải phạm vi đóng góp, email đã rời quan_tri hoặc đang phải đổi mật khẩu tạm) đều ném cùng một 401.
 */
export async function xacThucKhoa(d1: KhoD1, authorization: string | null, bayGio: Date): Promise<NguoiQuaKhoa> {
  const sai = () => new LoiHttp(401, "khoa-sai", THONG_BAO_KHOA_SAI);
  const m = /^Bearer\s+(\S+)$/.exec(authorization ?? "");
  if (!m || !KHOP_KHOA.test(m[1])) throw sai();
  const bam = await bamKhoa(m[1]);
  const h = await d1.prepare("SELECT id, email, pham_vi, het_han, thu_hoi_luc FROM khoa_api WHERE bam_sha256 = ? LIMIT 1")
    .bind(bam).first<{ id: string; email: string; pham_vi: string; het_han: string; thu_hoi_luc: string | null }>();
  if (!h || h.pham_vi !== PHAM_VI_KHOA || h.thu_hoi_luc !== null || Date.parse(h.het_han) <= bayGio.getTime()) throw sai();
  const hs = await hoSoQuanTri(d1, h.email);
  if (!hs || hs.phaiDoiMatKhau) throw sai();
  await d1.prepare("UPDATE khoa_api SET lan_dung_cuoi = ? WHERE id = ?").bind(bayGio.toISOString(), h.id).run();
  return { email: h.email, vaiTro: hs.vaiTro, khoaId: h.id };
}

const kvDem = (env: Env): KhoKV | undefined => env.RATE_KV ?? env.KV_CONG_DONG;

/**
 * Giới hạn số HÀNG đóng góp theo khóa: 60 hàng mỗi phút, 500 hàng mỗi ngày (giờ UTC). Đếm bằng KV, không nguyên tử.
 * Fail-closed: thiếu KV hoặc KV lỗi thì từ chối, không cho ghi không đếm được.
 */
export async function gioiHanHang(env: Env, khoaId: string, soHang: number, bayGio: Date): Promise<void> {
  const kv = kvDem(env);
  if (!kv) throw new LoiHttp(503, "chua-cau-hinh", "Máy chủ chưa có bộ đếm giới hạn (KV), tạm từ chối nhận đóng góp");
  const phut = Math.floor(bayGio.getTime() / 60_000);
  const ngay = bayGio.toISOString().slice(0, 10);
  const kPhut = `mcp:p:${khoaId}:${phut}`;
  const kNgay = `mcp:n:${khoaId}:${ngay}`;
  let demPhut: number, demNgay: number;
  try {
    demPhut = Number((await kv.get(kPhut)) ?? 0);
    demNgay = Number((await kv.get(kNgay)) ?? 0);
  } catch {
    throw new LoiHttp(503, "tam-gian-doan", "Bộ đếm giới hạn đang gián đoạn, thử lại sau");
  }
  if (demPhut + soHang > HAN_MOI_PHUT) throw new LoiHttp(429, "qua-nhanh", `Mỗi phút gửi tối đa ${HAN_MOI_PHUT} hàng. Đợi một phút rồi gửi tiếp.`);
  if (demNgay + soHang > HAN_MOI_NGAY) throw new LoiHttp(429, "qua-nhanh", `Mỗi ngày gửi tối đa ${HAN_MOI_NGAY} hàng. Ngày mai gửi tiếp.`);
  try {
    await kv.put(kPhut, String(demPhut + soHang), { expirationTtl: 120 });
    await kv.put(kNgay, String(demNgay + soHang), { expirationTtl: 2 * 86_400 });
  } catch {
    throw new LoiHttp(503, "tam-gian-doan", "Bộ đếm giới hạn đang gián đoạn, thử lại sau");
  }
}

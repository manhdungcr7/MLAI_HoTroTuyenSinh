// Phát hành bản chụp công khai: dựng từ D1 (chỉ trạng thái 'duyet', kiểm lại bằng cùng bộ kiểm tra) rồi ghi KV.
// Học sinh chỉ đọc KV (functions/api/dong-gop.ts ở app học sinh), không bao giờ đọc D1.
import { dungBanChup, type BanChup } from "../../../src/data/dong-gop-kiem-tra";
import { banGhiTruongTuHang, cauNhatKy, docHetTheoKhoa, thongTinTuHang, type HangThongTin, type HangTruong } from "./d1";
import { LoiHttp } from "./phan-hoi";
import { TAP_TRUONG } from "./quyen";
import type { Env, KhoD1 } from "./kieu";

export const KHOA_BAN_CHUP = "dong-gop:v1";
export const KHOA_BAN_TRUOC = "dong-gop:v1:truoc";

export interface KetQuaPhatHanh { luc: string; soTruong: number; soBanGhi: number }

export async function dungBanChupTuD1(d1: KhoD1, bayGio: Date): Promise<BanChup> {
  const hangTruong = await docHetTheoKhoa<HangTruong>(d1, "SELECT * FROM truong_cong_dong WHERE ma_truong > ? ORDER BY ma_truong LIMIT ?", "ma_truong");
  const hangTin = await docHetTheoKhoa<HangThongTin>(d1, "SELECT * FROM thong_tin_truong WHERE trang_thai = 'duyet' AND id > ? ORDER BY id LIMIT ?", "id");
  return dungBanChup(hangTruong.map(banGhiTruongTuHang), hangTin.map(thongTinTuHang), bayGio, { tapTruong: TAP_TRUONG });
}

export const demBanChup = (b: BanChup): KetQuaPhatHanh => ({
  luc: b.luc,
  soTruong: new Set([...Object.keys(b.truong), ...Object.keys(b.thongTin)]).size,
  soBanGhi: Object.values(b.thongTin).reduce((n, ds) => n + ds.length, 0),
});

/** Dựng bản chụp, giữ bản đang chạy ở khóa `:truoc` để hoàn tác, ghi bản mới, ghi nhật ký. */
export async function phatHanh(env: Env, d1: KhoD1, ai: string, bayGio: Date, hanhDong = "phat-hanh"): Promise<KetQuaPhatHanh> {
  const kv = env.KV_CONG_DONG;
  if (!kv) throw new LoiHttp(500, "chua-cau-hinh", "Máy chủ chưa gắn KV_CONG_DONG nên chưa phát hành được");
  const ban = await dungBanChupTuD1(d1, bayGio);
  const hienTai = await kv.get(KHOA_BAN_CHUP);
  if (hienTai) await kv.put(KHOA_BAN_TRUOC, hienTai);
  await kv.put(KHOA_BAN_CHUP, JSON.stringify(ban));
  const kq = demBanChup(ban);
  await cauNhatKy(d1, ai, hanhDong, `${KHOA_BAN_CHUP} (${kq.soTruong} trường, ${kq.soBanGhi} bản ghi)`, bayGio.toISOString()).run();
  return kq;
}

/** Đổi chỗ bản trước và bản hiện tại (gọi lần nữa sẽ quay lại). */
export async function hoanTac(env: Env, d1: KhoD1, ai: string, bayGio: Date): Promise<KetQuaPhatHanh> {
  const kv = env.KV_CONG_DONG;
  if (!kv) throw new LoiHttp(500, "chua-cau-hinh", "Máy chủ chưa gắn KV_CONG_DONG");
  const truoc = await kv.get(KHOA_BAN_TRUOC);
  if (!truoc) throw new LoiHttp(404, "khong-co-ban-truoc", "Chưa có bản phát hành trước để hoàn tác");
  const hienTai = await kv.get(KHOA_BAN_CHUP);
  await kv.put(KHOA_BAN_CHUP, truoc);
  if (hienTai) await kv.put(KHOA_BAN_TRUOC, hienTai);
  let ban: BanChup | null = null;
  try { ban = JSON.parse(truoc) as BanChup; } catch { /* bản cũ hỏng thì vẫn báo số 0 */ }
  const kq = ban ? demBanChup(ban) : { luc: bayGio.toISOString(), soTruong: 0, soBanGhi: 0 };
  await cauNhatKy(d1, ai, "phat-hanh.hoan-tac", KHOA_BAN_CHUP, bayGio.toISOString()).run();
  return kq;
}

/** Tự phát hành sau khi sửa nội dung công khai. Không ném lỗi: trả trạng thái để đặt vào header `x-phat-hanh`. */
export async function tuPhatHanh(env: Env, d1: KhoD1, ai: string, bayGio: Date): Promise<"ok" | "loi" | "chua-cau-hinh"> {
  if (!env.KV_CONG_DONG) return "chua-cau-hinh";
  try { await phatHanh(env, d1, ai, bayGio, "phat-hanh.tu-dong"); return "ok"; } catch (e) { console.error("tu-phat-hanh", e instanceof Error ? e.message : e); return "loi"; }
}

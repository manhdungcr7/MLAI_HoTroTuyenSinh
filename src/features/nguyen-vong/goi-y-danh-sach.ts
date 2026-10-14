// Tự đề xuất một danh sách nguyện vọng cân bằng cho em: có Thử sức, Vừa sức, An toàn, Dự phòng, đúng nhóm ngành, khu vực, ngân sách.
// Hàm thuần (không React). Mỗi dòng kèm lý do bằng lời, chỉ dùng số có thật trong dữ liệu.
import { LUA_CHON_MAU } from "@/data/lua-chon-mau";
import { coHocPhi } from "@/data/lua-chon-phu";
import { NGAN_SACH_TOI_DA, nhanNguyenVong } from "@/engine/phan-tich";
import { cungNoi } from "@/features/kham-pha/bo-loc";
import { dungKhuVuc } from "@/features/kham-pha/phu-hop";
import { tongChoLuaChon } from "@/features/kham-pha/to-hop";
import type { DiemDayDu, HoSo, LuaChon, NhanNguyenVong } from "@/state/types";
import { dinhDang } from "@/engine/dinh-dang";

export interface DongGoiY { lc: LuaChon; nhan: NhanNguyenVong; tong: number; toHop: string | null; lyDo: string[] }

/** Cơ cấu gợi ý cho 6 nguyện vọng (khớp lời khuyên giữ khoảng 5–6; em thêm, bỏ bớt hoặc sắp lại sau). */
const CO_CAU: NhanNguyenVong[] = ["Thử sức", "Vừa sức", "Vừa sức", "An toàn", "An toàn", "Dự phòng"];
const TOI_DA_MOT_TRUONG = 2;

type DauVao = Pick<HoSo, "nganSach" | "khuVuc" | "nganhQuanTam" | "tinh"> & { hocXaNha?: boolean | null };

export function goiYDanhSach(diem: DiemDayDu, hoSo: DauVao, daCo: string[] = [], ds: LuaChon[] = LUA_CHON_MAU): DongGoiY[] {
  const ns = hoSo.nganSach ? NGAN_SACH_TOI_DA[hoSo.nganSach] : Infinity;
  const tinh = hoSo.tinh === "Tỉnh khác" ? "" : hoSo.tinh;
  const ungVien = ds
    .filter((l) => (!l.phuongThuc || l.phuongThuc === "THPT") && !daCo.includes(l.id))
    .filter((l) => !coHocPhi(l) || (l.hocPhiMin as number) <= ns)
    .map((l) => {
      const t = tongChoLuaChon(l, diem);
      return t.tong === null ? null : { lc: l, tong: t.tong, toHop: t.toHop, nhan: nhanNguyenVong(l, t.tong) };
    })
    .filter((x): x is { lc: LuaChon; tong: number; toHop: string | null; nhan: NhanNguyenVong } => x !== null);

  // Điểm ưu tiên: đúng nhóm ngành > đúng khu vực > ngành có nhiều năm dữ liệu > điểm chuẩn cao hơn (với nhãn Thử sức/Vừa sức: sát em nhất)
  const nganh = (l: LuaChon) => (hoSo.nganhQuanTam.length === 0 || hoSo.nganhQuanTam.includes(l.nhomNganh) ? 0 : 1);
  const kv = (l: LuaChon) => (dungKhuVuc(l, hoSo.khuVuc) === false ? 2 : tinh && cungNoi(l.khuVuc, tinh) ? 0 : 1);
  const nhieuNam = (l: LuaChon) => (Object.keys(l.diemTheoNam ?? {}).length >= 2 ? 0 : 1);
  const sat = (x: { nhan: NhanNguyenVong; tong: number; lc: LuaChon }) => Math.abs(x.tong - x.lc.diemMin - (x.nhan === "Thử sức" ? -1 : x.nhan === "Vừa sức" ? 0.7 : x.nhan === "An toàn" ? 2.7 : 5));

  const chon: DongGoiY[] = [];
  const soTruong = new Map<string, number>();
  const daLay = new Set<string>();
  for (const nhan of CO_CAU) {
    const dung = ungVien
      .filter((x) => x.nhan === nhan && !daLay.has(x.lc.id) && !chon.some((c) => c.lc.truong === x.lc.truong && c.lc.nganh === x.lc.nganh) && (soTruong.get(x.lc.truong) ?? 0) < TOI_DA_MOT_TRUONG)
      .sort((a, b) => nganh(a.lc) - nganh(b.lc) || kv(a.lc) - kv(b.lc) || nhieuNam(a.lc) - nhieuNam(b.lc) || sat(a) - sat(b))[0];
    if (!dung) continue;
    daLay.add(dung.lc.id);
    soTruong.set(dung.lc.truong, (soTruong.get(dung.lc.truong) ?? 0) + 1);
    const lyDo: string[] = [];
    const chenh = Math.round((dung.tong - dung.lc.diemMin) * 10) / 10;
    lyDo.push(chenh >= 0 ? `Điểm của bạn ${dung.toHop ? `(${dung.toHop}) ` : ""}cao hơn điểm chuẩn ${dung.lc.namDiem} ${dinhDang(chenh, 1).replace(".", ",")} điểm` : `Điểm của bạn ${dung.toHop ? `(${dung.toHop}) ` : ""}thấp hơn điểm chuẩn ${dung.lc.namDiem} ${dinhDang(-chenh, 1)} điểm`);
    if (hoSo.nganhQuanTam.includes(dung.lc.nhomNganh)) lyDo.push(`Đúng nhóm ngành bạn quan tâm (${dung.lc.nhomNganh})`);
    if (tinh && cungNoi(dung.lc.khuVuc, tinh)) lyDo.push(`Ở ${dung.lc.khuVuc}, gần nơi bạn sống`);
    else if (dungKhuVuc(dung.lc, hoSo.khuVuc) === true) lyDo.push(`Ở ${dung.lc.khuVuc}, đúng khu vực bạn ưu tiên`);
    if (coHocPhi(dung.lc)) lyDo.push(`Học phí khoảng ${dung.lc.hocPhiMin} triệu/năm, trong ngân sách`);
    chon.push({ lc: dung.lc, nhan, tong: dung.tong, toHop: dung.toHop, lyDo });
  }
  // Thử sức trước, Dự phòng sau: đúng thứ tự ưu tiên khi đăng ký
  const thuTu: Record<NhanNguyenVong, number> = { "Thử sức": 0, "Vừa sức": 1, "An toàn": 2, "Dự phòng": 3 };
  return chon.sort((a, b) => thuTu[a.nhan] - thuTu[b.nhan] || b.lc.diemMin - a.lc.diemMin);
}

// Phân tích quanh mỏ neo NV1 (hoặc mục tiêu khi danh sách trống): còn cách bao xa, mỗi môn cần thêm bao nhiêu,
// và các nguyện vọng còn lại đỡ cho giấc mơ đó thế nào. Hàm thuần, không React. Chỉ dùng số có thật trong dữ liệu.
import { tim } from "@/data/lua-chon-mau";
import { tongCanDatDeDen, mucUuTien } from "@/engine/diem-uu-tien";
import { dinhDang } from "@/engine/dinh-dang";
import { khoangCachTheoMon, lyDoKhacPhuongThuc, monThieuCuaToHop, nhanChoLuaChon, tongDiem, type KhoangCachMon } from "@/engine/phan-tich";
import { diemDayDu, tongChoLuaChon } from "@/features/kham-pha/to-hop";
import { diemHienTaiCuaTungMon } from "@/state/diem-hien-tai";
import type { AppState } from "@/state/store";
import { TO_HOP, type LuaChon, type MaToHop, type MonId, type NhanNguyenVong } from "@/state/types";
import { moNeoNV1 } from "./goi-y-danh-sach";

export interface DongLuoiDo { thuTu: number; lc: LuaChon; nhan: NhanNguyenVong; chenh: number }
export interface PhanTichMoNeo {
  lc: LuaChon;
  toHop: MonId[];
  /** Điểm chuẩn của mỏ neo sau khi trừ điểm ưu tiên: mức tổng ba môn cần đạt. */
  canDat: number;
  hienTai: number;
  conThieu: number;
  /** Chưa đủ điểm các môn trong tổ hợp thì không chia được phần thiếu theo môn. */
  monChuaCoDiem: MonId[];
  theoMon: KhoangCachMon[];
  luoiDo: DongLuoiDo[];
}

const lam1 = (n: number) => dinhDang(Math.round(n * 10) / 10, 1);

export function phanTichMoNeo(s: AppState): PhanTichMoNeo | null {
  const lc = moNeoNV1(s);
  if (!lc || lyDoKhacPhuongThuc(lc)) return null;
  const diemDay = diemDayDu(s);
  // Tổ hợp: nếu mỏ neo chính là mục tiêu thì dùng tổ hợp bạn đã chọn, không thì tổ hợp tốt nhất của chính chương trình đó.
  let toHop: MonId[];
  if (s.mucTieu && s.mucTieu.luaChonId === lc.id) toHop = s.mucTieu.toHop;
  else {
    const t = tongChoLuaChon(lc, diemDay);
    if (t.tong === null || !t.toHop || !(t.toHop in TO_HOP)) return null;
    toHop = TO_HOP[t.toHop as MaToHop];
  }
  const diem = diemHienTaiCuaTungMon(s);
  const canDat = tongCanDatDeDen(lc.diemMin, mucUuTien(s.hoSo.uuTienTuyenSinh));
  const hienTai = tongDiem(diem, toHop);
  const monChuaCoDiem = monThieuCuaToHop(diem, toHop);
  const conThieu = Math.max(0, Math.round((canDat - hienTai) * 10) / 10);
  const theoMon = monChuaCoDiem.length === 0 && conThieu > 0
    ? khoangCachTheoMon(diem, toHop, canDat, s.hoSo.canCaiThien).filter((k) => k.thieu > 0).sort((a, b) => b.thieu - a.thieu)
    : [];
  const luoiDo: DongLuoiDo[] = [];
  s.nguyenVong.forEach((id, i) => {
    const x = tim(id);
    if (!x || x.id === lc.id) return;
    const t = tongChoLuaChon(x, diemDay);
    const nhan = nhanChoLuaChon(x, t.tong); // null khi khác phương thức, chỉ có điểm sàn hoặc thiếu điểm: không đưa vào lưới đỡ
    if (t.tong === null || nhan === null) return;
    luoiDo.push({ thuTu: i + 1, lc: x, nhan, chenh: Math.round((t.tong - x.diemMin) * 10) / 10 });
  });
  return { lc, toHop, canDat, hienTai, conThieu, monChuaCoDiem, theoMon, luoiDo };
}

/** Một câu cho màn Hôm nay: NV1 còn thiếu bao nhiêu và mỗi môn cần thêm bao nhiêu. Null khi chưa đủ điểm hoặc đã chạm mốc. */
export function cauKhoangCachNV1(p: PhanTichMoNeo | null): string | null {
  if (!p || p.conThieu <= 0 || p.theoMon.length === 0) return null;
  const mon = p.theoMon.slice(0, 3).map((k) => `${k.ten} +${lam1(k.thieu)}`).join(", ");
  return `${p.lc.truong} còn thiếu ${lam1(p.conThieu)} điểm: ${mon}.`;
}

/** Dòng "NV1: ..." đặt đầu ngữ cảnh gửi AI. Ngắn gọn (ngữ cảnh tối đa 700 ký tự), chỉ có số trong dữ liệu. */
export function tomTatMoNeoChoAI(p: PhanTichMoNeo | null): string {
  if (!p) return "";
  const tenNV1 = `${p.lc.truong} ${p.lc.nganh}`.slice(0, 70);
  const vitri = p.monChuaCoDiem.length
    ? "bạn chưa nhập đủ điểm các môn của tổ hợp"
    : p.conThieu > 0
      ? `còn thiếu ${lam1(p.conThieu)} điểm (${p.theoMon.slice(0, 3).map((k) => `${k.ten} +${lam1(k.thieu)}`).join(", ")})`
      : "đã chạm mốc điểm chuẩn";
  const luoi = p.luoiDo.slice(0, 4).map((d) => `NV${d.thuTu} ${d.lc.truong} ${d.nhan.toLowerCase()}`).join("; ");
  return `NV1: ${tenNV1}, chuẩn ${lam1(p.lc.diemMin)} (${p.lc.namDiem}), ${vitri}.${luoi ? ` Lưới đỡ: ${luoi}.` : ""}`;
}

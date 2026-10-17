// Cơ hội của em trên toàn danh mục: với điểm hiện tại, bao nhiêu ngành đủ điểm, bao nhiêu ngành có thể thử sức, nhiều nhất ở nhóm nào.
// Tính từ điểm chuẩn năm gần nhất của phương thức thi tốt nghiệp THPT, theo đúng tổ hợp của từng ngành. TypeScript thuần.
import { LUA_CHON_MAU } from "@/data/lua-chon-mau";
import { tongChoLuaChon, type TongToHop } from "./to-hop";
import { diemChuanDeSo, lyDoKhongSoDuoc } from "@/engine/trang-thai-du-lieu";
import type { DiemDayDu, LuaChon } from "@/state/types";

export interface CoHoi {
  tong: number; // điểm tổ hợp cao nhất của em
  toHop: string; // tổ hợp đó
  soNganh: number; // số ngành đã xét (có tổ hợp tính được)
  soDuDiem: number; // điểm của em từ điểm chuẩn trở lên
  soThuSuc: number; // thấp hơn điểm chuẩn tới 2 điểm
  theoNhom: { nhom: string; duDiem: number; thuSuc: number }[]; // xếp theo số ngành đủ điểm giảm dần
}

export function tinhCoHoi(diem: DiemDayDu, ds: LuaChon[] = LUA_CHON_MAU): CoHoi | null {
  const tot = tongChoLuaChon({ toHopXet: [] }, diem);
  if (tot.tong === null || tot.toHop === null) return null;
  let soNganh = 0, soDuDiem = 0, soThuSuc = 0;
  const nhom = new Map<string, { duDiem: number; thuSuc: number }>();
  for (const l of ds) {
    if (lyDoKhongSoDuoc(l)) continue; // điểm sàn, học bạ, ĐGNL không so được với điểm thi tốt nghiệp
    const diemChuan = diemChuanDeSo(l);
    if (diemChuan === null) continue;
    const t: TongToHop = tongChoLuaChon(l, diem);
    if (t.tong === null) continue;
    soNganh++;
    const chenh = t.tong - diemChuan;
    const g = nhom.get(l.nhomNganh) ?? { duDiem: 0, thuSuc: 0 };
    if (chenh >= 0) { soDuDiem++; g.duDiem++; } else if (chenh >= -2) { soThuSuc++; g.thuSuc++; }
    nhom.set(l.nhomNganh, g);
  }
  const theoNhom = [...nhom.entries()].map(([n, v]) => ({ nhom: n, ...v })).filter((x) => x.duDiem + x.thuSuc > 0)
    .sort((a, b) => b.duDiem - a.duDiem || b.thuSuc - a.thuSuc);
  return { tong: tot.tong, toHop: tot.toHop, soNganh, soDuDiem, soThuSuc, theoNhom };
}

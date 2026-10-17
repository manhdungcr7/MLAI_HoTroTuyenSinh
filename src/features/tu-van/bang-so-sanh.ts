// Bảng so sánh trong khung chat: dựng 100% từ dữ liệu thật của app, không qua mô hình ngôn ngữ nên không thể sai số.
// Mô hình chỉ được nhờ diễn giải bảng này (xem tomTatChoAI); mọi số trong lời diễn giải phải nằm trong bảng.
// TypeScript thuần, không React, không gọi mạng.
import { coHocPhi } from "@/data/lua-chon-phu";
import { dinhDang, dinhDangDiem } from "@/engine/dinh-dang";
import { lyDoKhacPhuongThuc, nhanNguyenVong } from "@/engine/phan-tich";
import { duBaoCua } from "@/features/kham-pha/du-bao";
import { tongChoLuaChon } from "@/features/kham-pha/to-hop";
import type { DiemDayDu, LuaChon } from "@/state/types";

export interface CotSoSanh { id: string; nganh: string; truong: string; tinh: string }
/** `o` là chữ đã định dạng cho từng cột. `tot` là chỉ số cột có lợi thế rõ ràng ở tiêu chí đó (chỉ khi khách quan: học phí thấp hơn). */
export interface HangSoSanh { khoa: string; nhan: string; o: string[]; tot?: number }
export interface BangSoSanh { cot: CotSoSanh[]; hang: HangSoSanh[]; luuY: string[] }

/** Điểm sàn của Bộ cho nhóm ngành thường: trường công bố đúng mức này nghĩa là gần như nhận mọi hồ sơ đủ ngưỡng, không đo được độ cạnh tranh. */
export const DIEM_SAN = 15;
const PT_TEN: Record<string, string> = { THPT: "điểm thi THPT", HOC_BA: "học bạ", DGNL_HCM: "ĐGNL ĐHQG-HCM", DGNL_HN: "ĐGNL ĐHQG-HN", DGNL_KHAC: "ĐGNL", DGTD: "đánh giá tư duy", KET_HOP: "xét kết hợp", NANG_KHIEU: "năng khiếu" };
const ptCua = (l: LuaChon) => l.phuongThuc ?? "THPT";
const laTHPT = (l: LuaChon) => ptCua(l) === "THPT";
/** Điểm chuẩn ở mức sàn: chỉ coi là sàn với phương thức THPT và đúng bằng 15. */
export const laDiemSan = (l: LuaChon) => laTHPT(l) && Math.abs(l.diemMin - DIEM_SAN) < 1e-9;

const soDiem = (n: number) => dinhDangDiem(n);
const namMoiNhat = (l: LuaChon) => String(l.namDiem);

function oDiemChuan(l: LuaChon): string {
  if (!laTHPT(l)) return `${PT_TEN[ptCua(l)] ?? ptCua(l)}: thang khác, không so với điểm thi THPT`;
  const nam = namMoiNhat(l);
  return laDiemSan(l) ? `${soDiem(l.diemMin)} (${nam}), mức sàn` : `${soDiem(l.diemMin)} (${nam})`;
}

function oXuHuong(l: LuaChon): string | null {
  const t = Object.entries(l.diemTheoNam ?? {}).filter(([, v]) => Number.isFinite(v)).sort(([a], [b]) => Number(a) - Number(b)).slice(-4);
  if (t.length < 2) return null;
  const di = t[t.length - 1][1] - t[0][1];
  const chu = Math.abs(di) < 0.5 ? "ổn định" : di > 0 ? "tăng" : "giảm";
  return `${t.map(([, v]) => soDiem(v)).join(" → ")} (${t[0][0]}–${t[t.length - 1][0]}, ${chu})`;
}

function oHocPhi(l: LuaChon): string {
  if (!coHocPhi(l)) return "Chưa có";
  const a = l.hocPhiMin as number, b = l.hocPhiMax as number;
  const k = a === b ? dinhDang(a, a % 1 ? 1 : 0) : `${dinhDang(a, a % 1 ? 1 : 0)}–${dinhDang(b, b % 1 ? 1 : 0)}`;
  return `${l.hocPhiUocTinh ? "≈ " : ""}${k} triệu${l.hocPhiUocTinh ? " (ước tính)" : ""}`;
}

function oVoiDiemCuaEm(l: LuaChon, diem: DiemDayDu): { chu: string; coDiem: boolean } {
  if (!laTHPT(l)) return { chu: "Không so được (khác phương thức)", coDiem: false };
  if (lyDoKhacPhuongThuc(l)) return { chu: "Chưa có điểm chuẩn riêng để so (mới có điểm sàn)", coDiem: false };
  const t = tongChoLuaChon(l, diem);
  if (t.tong === null) return { chu: "Chưa đủ điểm để so", coDiem: false };
  const chenh = Math.round((t.tong - l.diemMin) * 100) / 100;
  const nhan = nhanNguyenVong(l, t.tong);
  return { chu: `${nhan}: ${soDiem(t.tong)} điểm, ${chenh >= 0 ? "hơn" : "thiếu"} ${soDiem(Math.abs(chenh))}`, coDiem: true };
}

const tenCot = (l: LuaChon) => l.tenTruong || l.truong;

export function dungBangSoSanh(ls: LuaChon[], diem: DiemDayDu): BangSoSanh {
  const cot: CotSoSanh[] = ls.map((l) => ({ id: l.id, nganh: l.nganh, truong: tenCot(l), tinh: l.khuVuc }));
  const hang: HangSoSanh[] = [];
  hang.push({ khoa: "diem", nhan: "Điểm chuẩn gần nhất", o: ls.map(oDiemChuan) });
  const xh = ls.map(oXuHuong);
  if (xh.some(Boolean)) hang.push({ khoa: "xuhuong", nhan: "Xu hướng", o: xh.map((x) => x ?? "Chỉ có 1 năm dữ liệu") });
  const vd = ls.map((l) => oVoiDiemCuaEm(l, diem));
  hang.push({ khoa: "voiEm", nhan: "Với điểm của bạn", o: vd.map((v) => v.chu) });
  hang.push({ khoa: "toHop", nhan: "Tổ hợp xét", o: ls.map((l) => (l.toHopXet?.length ? l.toHopXet.slice(0, 4).join(", ") : "Đề án chưa ghi")) });
  const hp = ls.map(oHocPhi);
  const giaHP = ls.map((l) => (coHocPhi(l) ? (l.hocPhiMin as number) : null));
  const coHai = giaHP.filter((g): g is number => g !== null);
  const re = coHai.length >= 2 && Math.min(...coHai) < Math.max(...coHai) ? giaHP.indexOf(Math.min(...coHai)) : undefined;
  hang.push({ khoa: "hocPhi", nhan: "Học phí / năm", o: hp, ...(re !== undefined ? { tot: re } : {}) });
  if (ls.some((l) => l.tiLeViecLam !== undefined)) hang.push({ khoa: "viecLam", nhan: "Có việc làm", o: ls.map((l) => (l.tiLeViecLam !== undefined ? `${dinhDang(l.tiLeViecLam, 0)}% (khảo sát của trường)` : "Chưa có")) });
  hang.push({ khoa: "diaDiem", nhan: "Địa điểm", o: ls.map((l) => l.khuVuc) });
  const db = ls.map((l) => duBaoCua(l));
  if (db.some(Boolean)) hang.push({ khoa: "duBao", nhan: "Dự kiến năm tới", o: db.map((d) => (d ? `${soDiem(d.thap)}–${soDiem(d.cao)} (${d.namDuBao})` : "Chưa dự báo được")) });
  hang.push({ khoa: "nguon", nhan: "Nguồn dữ liệu", o: ls.map((l) => (l.nguonCap === "official_pdf" ? "Đề án của trường" : "Trang tổng hợp, chưa đối chiếu đề án")) });

  const luuY: string[] = [];
  const san = ls.filter(laDiemSan);
  if (san.length) {
    const ten = san.map((l) => `${l.truong}`).join(", ");
    luuY.push(san.length === ls.length
      ? `Cả ${san.length > 2 ? "ba" : "hai"} lựa chọn đều ở mức sàn ${DIEM_SAN} (điểm tối thiểu Bộ quy định), nên điểm chuẩn không cho thấy trường nào khó vào hơn. Hãy so theo học phí, địa điểm và nội dung đào tạo.`
      : `${ten} ở mức sàn ${DIEM_SAN} (điểm tối thiểu Bộ quy định), nên con số này không phản ánh độ cạnh tranh thật. Đối chiếu với đề án của trường.`);
  }
  const nam = new Set(ls.filter(laTHPT).map(namMoiNhat));
  if (nam.size > 1) luuY.push(`Điểm chuẩn lấy của các năm khác nhau (${ls.filter(laTHPT).map((l) => `${l.truong} ${namMoiNhat(l)}`).join(", ")}), đừng so trực tiếp.`);
  if (new Set(ls.map(ptCua)).size > 1) luuY.push("Các lựa chọn xét theo phương thức khác nhau, điểm không so trực tiếp được.");
  if (ls.some((l) => l.nguonCap !== "official_pdf")) luuY.push("Có dữ liệu lấy từ trang tổng hợp, chưa đối chiếu với đề án của trường.");
  return { cot, hang, luuY };
}

/** Bản gọn gửi cho mô hình: tên cột là chữ, mỗi dòng một tiêu chí. Mô hình chỉ được dùng số có trong đây. */
export function tomTatChoAI(b: BangSoSanh): string {
  const dau = b.cot.map((c, i) => `${String.fromCharCode(65 + i)}=${c.nganh} tại ${c.truong} (${c.tinh})`).join("; ");
  const dong = b.hang.map((h) => `- ${h.nhan}: ${h.o.map((o, i) => `${String.fromCharCode(65 + i)}: ${o}`).join(" | ")}${h.tot !== undefined ? ` [${String.fromCharCode(65 + h.tot)} rẻ hơn]` : ""}`);
  const luu = b.luuY.map((x) => `* ${x}`);
  return [`CÁC LỰA CHỌN: ${dau}`, ...dong, ...(luu.length ? ["LƯU Ý:", ...luu] : [])].join("\n").slice(0, 1800);
}

/** Câu tóm tắt khi không gọi được mô hình: chỉ ghép từ bảng, không thêm nhận định mới. */
export function tomTatKhongAI(b: BangSoSanh): string {
  const ten = b.cot.map((c) => `${c.nganh} (${c.truong})`);
  const dau = `Mình đặt ${ten.slice(0, -1).join(", ")} cạnh ${ten[ten.length - 1]} trong bảng bên dưới.`;
  const voiEm = b.hang.find((h) => h.khoa === "voiEm");
  const dongEm = voiEm && voiEm.o.some((x) => /hơn|thiếu/.test(x)) ? ` Theo điểm của bạn: ${voiEm.o.map((x, i) => `${b.cot[i].truong}: ${x}`).join("; ")}.` : "";
  return `${dau}${dongEm}${b.luuY.length ? ` ${b.luuY[0]}` : ""}`;
}

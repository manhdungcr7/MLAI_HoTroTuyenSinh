// Chuẩn bị dữ liệu cho Tư vấn AI và trả lời tự động khi chưa có dịch vụ AI. TypeScript thuần, không gọi mạng.
import { duBaoCua } from "@/features/kham-pha/du-bao";
import { LUA_CHON_MAU } from "@/data/lua-chon-mau";
import type { NguonTaiSau } from "@/data/lua-chon-that";
import { NGAN_SACH_TOI_DA, nhanNguyenVong, khoangCachTheoMon } from "@/engine/phan-tich";
import { hieuCauTim } from "@/engine/hieu-cau-tim";
import type { HoSoTomTat, SuKien } from "@/engine/tu-van";
import { tinhCoHoi } from "@/features/kham-pha/co-hoi";
import { tongChoLuaChon } from "@/features/kham-pha/to-hop";
import { goiYDanhSach, moNeoNV1 } from "@/features/nguyen-vong/goi-y-danh-sach";
import { cauKhoangCachNV1, phanTichMoNeo } from "@/features/nguyen-vong/mo-neo";
import type { AppState } from "@/state/store";
import { diemDayDu } from "@/features/kham-pha/to-hop";
import type { DiemDayDu, LuaChon } from "@/state/types";

const khongDau = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const BO_QUA = new Set(["nganh", "truong", "hoc", "dai", "diem", "chuan", "em", "la", "co", "khong", "nao", "gi", "the", "can", "muon", "cua", "va", "voi", "cho", "nen", "o", "tai", "nhu", "bao", "nhieu", "hay", "duoc", "thi", "mot", "cac", "nhung", "minh", "toi", "xin", "hoi", "ve", "tu", "den", "thay", "khac", "tot", "so", "sanh", "dau", "ra", "sao", "lam", "chinh", "quy", "con", "kia", "tren", "vay", "truoc", "tuong", "phi"]);

/** Tên gọi quen thuộc của trường -> mã trường trong dữ liệu (đã đối chiếu với tên trường). */
export const TEN_GOI_TRUONG: Record<string, string> = {
  uit: "QSC", hcmus: "QST", hust: "BKA", bka: "BKA", bkhn: "BKA", neu: "KHA", ktqd: "KHA",
  ftu: "NTH", ptit: "BVH", ussh: "QSX", hcmue: "SPS", hnue: "SPH", utc: "GHA", huce: "XDA", tlu: "TLA",
  vnua: "HVN", hanu: "NHF", tmu: "TMU", iuh: "IUH", ctu: "TCT", vaa: "HHK", ajc: "HBT", qnu: "DQN",
  dlu: "TDL", hmu: "YHB", ump: "YDS", vlu: "DVL", tdmu: "TDM", hunre: "DMT", vinhuni: "TDV",
  uet: "QHI", ueb: "QHE", ulis: "QHF", hus: "QHT", bk: "BKA",
  aof: "HTC", ba: "NHH", hvnh: "NHH", dav: "HQT", hlu: "LPH", kma: "KMA", hutech: "DKC",
  hcmute: "SPK", spkt: "SPK", uef: "UEF", phenikaa: "PKA", fpt: "FPT", thanglong: "DTL",
};

/** Em gõ có dấu thì so khớp có dấu (để "bạn" không khớp "Bản"); gõ không dấu thì so khớp không dấu. */
const coDauTiengViet = (t: string) => /[^\x00-\x7f]/.test(t);
const chuanHoa = (t: string, coDau: boolean) => (coDau ? t.toLowerCase().replace(/đ/g, "d").replace(/[^\p{L}\p{N}]+/gu, " ").trim() : khongDau(t));

export function tachTuKhoa(cauHoi: string): string[] {
  const coDau = coDauTiengViet(cauHoi);
  return [...new Set(chuanHoa(cauHoi, coDau).split(" ").filter((t) => (t.length >= 3 && !BO_QUA.has(khongDau(t))) || TEN_GOI_TRUONG[t]))];
}

/** Câu nối tiếp dùng đại từ hoặc "còn … thì sao": ngành/trường phải lấy từ lượt trước. */
export function coDaiTu(cauHoi: string): boolean {
  const q = khongDau(cauHoi);
  return /\b(nganh|truong|khoa|chuong trinh|cai|mon|ban|phuong an|lua chon) (do|nay|kia|ay|tren|dau tien|thu hai|con lai)\b|\b(o tren|vua roi|con lai|nhu vay|nhu the|hai nganh|hai truong)\b|^con .+ (thi )?(sao|the nao|ra sao)\b|\bcon .+ thi sao\b|\b(vay|the|vay thi|the thi) con\b|\b(so voi|cua|giong|hon|kem) no\b/.test(q);
}

/** Câu rất ngắn hỏi tiếp một chỉ tiêu mà không nêu ngành ("Có khó không?", "Bao nhiêu?"): hiểu là hỏi về ngành lượt trước. */
export function cauNganHoiTiep(cauHoi: string): boolean {
  const q = khongDau(cauHoi);
  return q.split(" ").length <= 6 && /^(the nao|sao|bao nhieu|co kho|kho khong|co nen|nen khong|duoc khong|nhieu khong|con gi|tai sao|vi sao)\b|\b(co kho|kho khong|nen khong|duoc khong|nhieu khong|bao nhieu|the nao)$/.test(q);
}

/** Ngành khớp câu hỏi: nhiều từ khóa trùng nhất lên đầu. */
export function timNganhKhop(cauHoi: string, toiDa = 8, ds: LuaChon[] = LUA_CHON_MAU): LuaChon[] {
  const tk = tachTuKhoa(cauHoi);
  if (tk.length === 0) return [];
  const coDau = coDauTiengViet(cauHoi);
  const diem = (l: LuaChon) => {
    const nganh = ` ${chuanHoa(l.nganh, coDau)} `;
    const truong = ` ${chuanHoa(l.tenTruong, coDau)} ${chuanHoa(l.truong, coDau)} `;
    let nganhTrung = 0, truongTrung = 0;
    for (const t of tk) {
      if (TEN_GOI_TRUONG[t]) { if (l.maTruong === TEN_GOI_TRUONG[t]) truongTrung += 2; continue; }
      if (nganh.includes(` ${t} `) || (t.length >= 5 && nganh.includes(t))) nganhTrung++;
      else if (truong.includes(` ${t} `) || (t.length >= 5 && truong.includes(t))) truongTrung++;
    }
    return nganhTrung * 2 + truongTrung;
  };
  return ds.map((l) => ({ l, d: diem(l) })).filter((x) => x.d > 0)
    .sort((a, b) => b.d - a.d || (Object.keys(b.l.diemTheoNam ?? {}).length - Object.keys(a.l.diemTheoNam ?? {}).length) || b.l.diemMin - a.l.diemMin)
    .slice(0, toiDa).map((x) => x.l);
}

export const moTaNguon = (l: LuaChon, nguon: NguonTaiSau | null): string => {
  const x = nguon?.nam[l.id]?.find((n) => n.nam === String(l.namDiem)) ?? nguon?.nam[l.id]?.[0];
  if (x) return `Đề án ${x.tai ?? x.nam}${x.trang ? `, trang ${x.trang}` : ""}`;
  return l.nguonCap === "official_pdf" ? "Đề án của trường" : "Trang tổng hợp, chưa đối chiếu với đề án";
};

/** SuKien kèm tổng điểm và tổ hợp của CHÍNH chương trình (cùng số màn chi tiết hiển thị). Máy chủ chưa đọc hai trường này. */
export type SuKienKemTong = SuKien & { tongCuaEm?: number; toHopDaTinh?: string };

export function dungSuKien(l: LuaChon, diem: DiemDayDu, nguon: NguonTaiSau | null): SuKienKemTong {
  const t = tongChoLuaChon(l, diem);
  const duBao = duBaoCua(l);
  const chenh = t.tong === null ? undefined : Math.round((t.tong - l.diemMin) * 100) / 100; // 2 chữ số, giống danhGia (phu-hop.ts)
  return {
    id: l.id, nganh: l.nganh, truong: l.truong, tenTruong: l.tenTruong, tinh: l.khuVuc, phuongThuc: l.phuongThuc ?? "THPT",
    toHop: l.toHopXet ?? [], diem: l.diemTheoNam ?? {},
    ...(t.tong !== null ? { nhanCuaEm: nhanNguyenVong(l, t.tong), chenh, tongCuaEm: t.tong, ...(t.toHop ? { toHopDaTinh: t.toHop } : {}) } : {}),
    ...(l.hocPhiMin !== undefined ? {
      hocPhiTrieu: l.hocPhiMin,
      ...(l.hocPhiUocTinh ? { hocPhiUocTinh: true } : {}),
      ...(l.hocPhiMax !== undefined && l.hocPhiMax !== l.hocPhiMin ? { hocPhiMaxTrieu: l.hocPhiMax } : {})
    } : {}),
    ...(l.tiLeViecLam !== undefined ? { tiLeViecLam: l.tiLeViecLam } : {}),
    ...(duBao ? { duBao: { nam: duBao.namDuBao, thap: duBao.thap, cao: duBao.cao } } : {}),
    nguon: moTaNguon(l, nguon),
  };
}

export function tomTatHoSo(s: AppState): HoSoTomTat {
  const h = s.hoSo;
  const diem = diemDayDu(s);
  const t = tongChoLuaChon({ toHopXet: [] }, diem);
  return {
    lop: h.khoi, tinh: h.tinh || undefined, nganhQuanTam: h.nganhQuanTam, nganSachToiDaTrieu: h.nganSach ? NGAN_SACH_TOI_DA[h.nganSach] : null, khuVuc: h.khuVuc,
    toHopCaoNhat: t.tong !== null && t.toHop ? { ma: t.toHop, tong: t.tong } : null,
    chungChiNgoaiNgu: h.chungChiNgoaiNgu?.diem ? `${h.chungChiNgoaiNgu.loai} ${h.chungChiNgoaiNgu.diem}` : null,
    diemDgnl: h.diemDgnl?.hcm ? `ĐHQG-HCM ${h.diemDgnl.hcm}/1200` : h.diemDgnl?.hn ? `HSA ${h.diemDgnl.hn}/150` : null,
    hocBa: h.hocBa?.dtb3Nam ? `ĐTB 3 năm ${h.hocBa.dtb3Nam}` : null,
    giaiThuongHsg: h.giaiThuongHsg?.cap ? `Giải ${h.giaiThuongHsg.giai ?? ""} môn ${h.giaiThuongHsg.mon ?? ""} cấp ${h.giaiThuongHsg.cap}` : null,
  };
}

/** Chọn các ngành đưa kèm câu hỏi: ngành khớp từ khóa, và (nếu hỏi về danh sách) các nguyện vọng của em. */
export function chonDuLieuKemTheo(cauHoi: string, s: AppState, nguon: NguonTaiSau | null, toiDa = 8, giuId: string[] = []): SuKienKemTong[] {
  const diem = diemDayDu(s);
  const hoiDanhSach = /nguyen vong|danh sach|can bang|an toan|thu suc/.test(khongDau(cauHoi));
  const chon: LuaChon[] = [];
  const them = (l?: LuaChon) => { if (l && !chon.some((c) => c.id === l.id) && chon.length < toiDa) chon.push(l); };
  // Câu hỏi nêu mức học phí ("dưới 40 triệu"): không gửi ngành có học phí (kể cả ước tính) cao hơn mức đó cho AI.
  const tran = hieuCauTim(cauHoi, LUA_CHON_MAU).hocPhiToiDa;
  const trongTran = (l: LuaChon) => tran === undefined || l.hocPhiMin === undefined || l.hocPhiMin <= tran;
  const khop = timNganhKhop(cauHoi, toiDa * 3).filter(trongTran).slice(0, toiDa);
  // Câu nối tiếp ("ngành đó", "còn trường kia thì sao", hoặc không nêu ngành nào): giữ các ngành đã nói ở lượt trước.
  // Nếu câu còn nêu ngành mới thì chỉ giữ tối đa 4 để ngành mới vẫn có chỗ.
  const noiTiep = giuId.length > 0 && !hoiDanhSach && (coDaiTu(cauHoi) || khop.length === 0);
  if (noiTiep) giuId.slice(0, khop.length ? 4 : toiDa).forEach((id) => them(LUA_CHON_MAU.find((l) => l.id === id)));
  if (hoiDanhSach) s.nguyenVong.forEach((id) => them(LUA_CHON_MAU.find((l) => l.id === id)));
  khop.forEach(them);
  if (chon.length === 0) goiYDanhSach(diem, s.hoSo, s.nguyenVong, undefined, moNeoNV1(s)).filter((d) => trongTran(d.lc)).slice(0, 5).forEach((d) => them(d.lc));
  return chon.map((l) => dungSuKien(l, diem, nguon));
}

// ---------- Trả lời tự động (không cần dịch vụ AI) ----------
const so1 = (x: number) => x.toFixed(1).replace(".", ",");
const dongNganh = (d: SuKien, hocPhi = false): string => {
  const nam = Object.keys(d.diem).sort().reverse();
  const diemGanNhat = nam.length ? `điểm chuẩn ${nam[0]} là ${so1(d.diem[nam[0]])}` : "chưa có điểm chuẩn";
  const nhan = d.nhanCuaEm ? `, với điểm của bạn: ${d.nhanCuaEm}${d.chenh !== undefined ? ` (${d.chenh >= 0 ? "hơn" : "kém"} ${so1(Math.abs(d.chenh))} điểm)` : ""}` : "";
  const mucHp = d.hocPhiTrieu !== undefined
    ? `học phí khoảng ${so1(d.hocPhiTrieu)}${d.hocPhiMaxTrieu && d.hocPhiMaxTrieu !== d.hocPhiTrieu ? `–${so1(d.hocPhiMaxTrieu)}` : ""} triệu/năm${d.hocPhiUocTinh ? " (ước tính)" : ""}`
    : "chưa có học phí theo ngành này";
  const hp = hocPhi ? `; ${mucHp}` : "";
  const duBaoStr = d.duBao ? `; dự báo ${d.duBao.nam}: ${so1(d.duBao.thap)}–${so1(d.duBao.cao)}` : "";
  const viecLamStr = d.tiLeViecLam !== undefined ? `; việc làm ${so1(d.tiLeViecLam)}%` : "";
  return `• ${d.nganh}, ${d.truong} (${d.tinh}): ${diemGanNhat}${nhan}${duBaoStr}${hp}${viecLamStr}. Nguồn: ${d.nguon}.`;
};

export interface KetQuaTuDong { traLoi: string; nguon: string[] }

export function traLoiTuDong(cauHoi: string, s: AppState, nguon: NguonTaiSau | null, giuId: string[] = []): KetQuaTuDong {
  const q = khongDau(cauHoi);
  const diem = diemDayDu(s);
  const coHoi = tinhCoHoi(diem);
  const NHAC = "Điểm chuẩn là của các năm trước, năm nay có thể khác. Bạn đối chiếu với đề án của trường trước khi quyết định.";

  // Hồ sơ cá nhân hóa
  const ten = s.hoSo.hoTen?.trim();
  const lop = s.hoSo.khoi ? `Lớp ${s.hoSo.khoi}` : "";
  const tinh = s.hoSo.tinh || "";
  const loiChao = ten ? `Chào ${ten}${lop ? ` (${lop}${tinh ? ` · ${tinh}` : ""})` : ""}! ` : "Chào bạn! ";
  const ielts = s.hoSo.chungChiNgoaiNgu?.diem ? `${s.hoSo.chungChiNgoaiNgu.loai} ${s.hoSo.chungChiNgoaiNgu.diem}` : null;
  const dgnl = s.hoSo.diemDgnl?.hcm ? `ĐHQG-HCM ${s.hoSo.diemDgnl.hcm}/1200` : s.hoSo.diemDgnl?.hn ? `HSA ${s.hoSo.diemDgnl.hn}/150` : null;

  // Lợi thế cạnh tranh cá thể hóa
  const phanTichLoiThe = (): string => {
    const y: string[] = [];
    if (ielts) y.push(`• Chứng chỉ **${ielts}**: Đủ điều kiện quy đổi thành điểm 10 môn Tiếng Anh hoặc cộng điểm ưu tiên xét tuyển kết hợp tại các trường hàng đầu (như UIT, NEU, FTU, Sư phạm Kỹ thuật...).`);
    if (dgnl) y.push(`• Điểm thi **${dgnl}**: Mức điểm rất cạnh tranh, giúp bạn nắm chắc cơ hội trúng tuyển sớm ngay từ đợt 1 mà không cần chờ điểm thi tốt nghiệp THPT.`);
    return y.length ? `\n\n⭐ **Lợi thế cạnh tranh cá nhân hóa của bạn:**\n${y.join("\n")}` : "";
  };

  // 1) Hỏi về một ngành/trường cụ thể
  let khop = timNganhKhop(cauHoi, 5);
  const huongDan = /bat dau|tu dau|chon nganh|nen hoc|hop voi|nganh nao/.test(q);
  const canBang = /can bang|nguyen vong|danh sach|an toan/.test(q);
  const thieu = /thieu|nhap diem|so sanh duoc|chua du/.test(q);
  const hocPhi = /hoc phi|chi phi|tien hoc/.test(q);
  const noiO = /ky tuc|ktx|o tro|nha tro|cho o|sinh hoat|noi o/.test(q);
  // Câu nối tiếp: lấy ngành đã nói ở lượt trước (đại từ, hoặc hỏi tiếp một chỉ tiêu mà không nêu ngành).
  const noiTiep = giuId.length > 0 && !canBang && !thieu && (coDaiTu(cauHoi) || (khop.length === 0 && (/hoc phi|diem chuan|viec lam|to hop|du bao|nen chon|nen hoc|ky tuc|ktx|o tro/.test(q) || (!huongDan && cauNganHoiTiep(cauHoi)))));
  if (noiTiep) {
    const cu = giuId.slice(0, khop.length ? 3 : 5).map((id) => LUA_CHON_MAU.find((l) => l.id === id)).filter((l): l is LuaChon => !!l);
    khop = [...khop, ...cu.filter((l) => !khop.some((k) => k.id === l.id))].slice(0, 5);
  }

  if (noiO && khop.length > 0) {
    const t0 = khop[0];
    const ghiChuChoO = s.hoSo.choO === "kyTucXa" ? " Bạn dự định ở ký túc xá, rất tiết kiệm chi phí sinh hoạt." : s.hoSo.choO === "oTro" ? " Bạn dự định ở trọ, nên chủ động tìm trọ gần trường hoặc ghép bạn để giảm chi phí." : "";
    return {
      traLoi: `Về chỗ ở và ký túc xá tại ${t0.truong} (${t0.tenTruong}, khu vực ${t0.khuVuc}): Trường có khu ký túc xá sinh viên và các khu nhà trọ sinh viên lân cận (giá trọ phổ biến 1,5–3,5 triệu/tháng, ký túc xá khoảng 300–800 nghìn/tháng).${ghiChuChoO} Bạn nên nộp đơn ký túc xá ngay khi nhận giấy báo trúng tuyển.`,
      nguon: [t0.id],
    };
  }

  const hoi3Nam = /3 nam|ba nam|cac nam|gan day|xu huong|2025|2026/.test(q);
  const soSanh = (khop.length >= 2 && /so sanh|khac nhau|hon|chon.*nao|chon.*hay|phan van/.test(q)) || (khop.length >= 1 && hoi3Nam);
  if (soSanh) {
    const sk = khop.slice(0, 4).map((l) => dungSuKien(l, diem, nguon));
    const bang3Nam = [
      "| Ngành | Trường | Điểm 2023 | Điểm 2024 | Điểm 2025 | Dự kiến 2026 | Nhãn | Học phí/năm |",
      "|---|---|---|---|---|---|---|---|",
      ...sk.map((d) => {
        const d23 = d.diem["2023"] ? so1(d.diem["2023"]) : "—";
        const d24 = d.diem["2024"] ? so1(d.diem["2024"]) : "—";
        const d25 = d.diem["2025"] ? so1(d.diem["2025"]) : (d.diem["2024"] ? so1(d.diem["2024"]) : "—");
        const d26 = d.diem["2026"] ? so1(d.diem["2026"]) : (d.duBao ? `${so1(d.duBao.thap)}–${so1(d.duBao.cao)}` : "—");
        const nhan = d.nhanCuaEm || "Tham khảo";
        const hp = d.hocPhiTrieu !== undefined ? `${d.hocPhiUocTinh ? "≈ " : ""}${so1(d.hocPhiTrieu)} tr` : "—";
        return `| ${d.nganh} | ${d.truong} | ${d23} | ${d24} | ${d25} | ${d26} | ${nhan} | ${hp} |`;
      }),
    ].join("\n");

    return {
      traLoi: `Dưới đây là bảng so sánh điểm chuẩn các năm gần đây (2023, 2024, 2025 và dự kiến 2026) cùng mức độ phù hợp cho bạn:\n\n${bang3Nam}\n\n📊 **Phân tích xu hướng & Chiến lược chọn ngành:**\n• **Dữ liệu điểm chuẩn liên tục**: Điểm chuẩn các năm phản ánh chính xác xu thế và độ phân hóa đề thi qua từng năm.\n• **Chiến lược phân tầng**: Đặt ngành **Thử sức** ở NV1–NV2 để vươn tới đam mê, ngành **Vừa sức** ở NV3–NV4 làm trọng tâm, và ngành **An toàn** ở NV5–NV6 làm lưới đỡ chắc chắn.\n• **Học phí & Tài chính**: Cân nhắc mức học phí/năm tương ứng với khả năng tài chính của gia đình.\n\n${NHAC}`,
      nguon: sk.map((l) => l.id),
    };
  }

  const hoiViecLam = /viec lam|co hoi viec lam|ra truong|de xin viec|nghe nghiep|muc luong/.test(q);
  if (hoiViecLam && khop.length > 0) {
    const sk = khop.map((l) => dungSuKien(l, diem, nguon));
    return {
      traLoi: `Thông tin việc làm và cơ hội nghề nghiệp từ đề án tuyển sinh chính thức:\n${sk.map((d) => dongNganh(d, hocPhi)).join("\n")}\n\n💼 **Đánh giá triển vọng**: Tỉ lệ có việc làm sau tốt nghiệp của các ngành trên được trích xuất trực tiếp từ đề án tuyển sinh chính thức. Bạn có thể kết hợp làm bài trắc nghiệm RIASEC ở mục Hướng nghiệp để xác định độ tương thích với năng lực của mình.\n${NHAC}`,
      nguon: khop.map((l) => l.id),
    };
  }

  if (khop.length > 0 && !canBang && !thieu && (!huongDan || noiTiep)) {
    const sk = khop.map((l) => dungSuKien(l, diem, nguon));
    const chot = khop.length <= 2
      ? "\n💡 Gợi ý chiến lược: Hãy cân nhắc đặt ngành này ở NV1–NV2 nếu thuộc nhóm Thử sức, hoặc NV3–NV5 nếu thuộc nhóm Vừa sức/An toàn để đảm bảo cơ hội trúng tuyển cao nhất."
      : "";
    const hanhDong = `\n\n📋 **Gợi ý hành động tiếp theo:**\n1. Bấm **+ Thêm vào nguyện vọng** ở các ngành trên để đưa vào danh sách của bạn.\n2. Vào mục **Kế hoạch** để xem môn cần kéo điểm giúp thu hẹp khoảng cách.`;
    return {
      traLoi: `Mình tìm thấy ${khop.length} ngành khớp với câu hỏi của bạn:\n${sk.map((d) => dongNganh(d, hocPhi)).join("\n")}${chot}${phanTichLoiThe()}${hanhDong}\n\n${NHAC}`,
      nguon: khop.map((l) => l.id),
    };
  }

  const hoiPhuongPhap = /tang diem|keo diem|on thi|phuong phap|cach hoc|lam sao de tang|on tap|ke hoach|lich hoc|de xuat viec|viec can hoc|xep lich/.test(q);
  if (hoiPhuongPhap) {
    const mt = s.mucTieu;
    const lcMt = mt ? LUA_CHON_MAU.find((l) => l.id === mt.luaChonId) : undefined;
    const mtStr = mt && lcMt ? `Mục tiêu hiện tại của bạn là ngành **${lcMt.nganh} - ${lcMt.truong}** (tổ hợp **${mt.maToHop}**, điểm mục tiêu **${so1(mt.diemMucTieu)}**).` : (mt ? `Mục tiêu hiện tại của bạn là tổ hợp **${mt.maToHop}** (${so1(mt.diemMucTieu)} điểm).` : "Bạn có thể chọn một ngành mục tiêu ở mục Kế hoạch để nhận lộ trình cụ thể.");

    const kc = mt ? khoangCachTheoMon(diem, mt.toHop, mt.diemMucTieu, s.hoSo.canCaiThien) : [];
    const thieuMon = kc.filter((x) => x.thieu > 0).sort((a, b) => b.thieu - a.thieu);
    const phanTichMon = thieuMon.length > 0
      ? `\n\n🎯 **Phân tích môn kéo điểm dành riêng cho bạn:**\n` + thieuMon.map((m) => `• Môn **${m.mon.toUpperCase()}**: Điểm hiện tại ${so1(m.hienTai)}, cần bứt phá lên ${so1(m.mucTieu)} (còn thiếu **${so1(m.thieu)} điểm**). Đây là môn trọng tâm cần phân bổ nhiều giờ tự học nhất trong tuần.`).join("\n")
      : (mt ? "\n\n🎯 **Phân tích điểm:** Điểm hiện tại của bạn đã tiệm cận mốc điểm chuẩn mục tiêu, chiến lược tuần này là tập trung làm đề bấm giờ để duy trì phong độ và rèn tâm lý thi đấu." : "");

    return {
      traLoi: `${loiChao}Dưới đây là kế hoạch học tập và chiến lược bứt phá điểm số được cá thể hóa cho bạn:\n\n1. **Định vị mục tiêu & Lộ trình**: ${mtStr}${phanTichMon}\n\n2. **Khung lịch học tuần đề xuất (Phương pháp 60-35-5)**:\n   • **Thứ 2 & Thứ 4 (19:30–21:00)**: Tập trung vào môn còn thiếu nhiều nhất (60% làm bài, 35% chữa chi tiết câu sai, 5% đúc kết quy luật).\n   • **Thứ 3 & Thứ 5 (19:30–21:00)**: Luyện đề tính giờ môn thứ hai của tổ hợp để rèn phản xạ tốc độ.\n   • **Cuối tuần (Sáng Thứ 7 / CN)**: Bấm giờ làm 1 đề thi thử trọn vẹn theo ma trận đề mới.${phanTichLoiThe()}\n\n3. **Hành động ngay**: Vào mục **Kế hoạch** > bấm **Tạo việc và xếp lịch** để hệ thống tự động đưa các việc này vào lịch tự học tuần của bạn.`,
      nguon: [],
    };
  }

  const hoiXetTuyenSom = /ielts|ngoai ngu|chung chi|dgnl|danh gia nang luc|hoc ba|xet tuyen som/.test(q);
  if (hoiXetTuyenSom) {
    const yNgoaiNgu = s.hoSo.chungChiNgoaiNgu?.diem ? `Bạn có chứng chỉ **${s.hoSo.chungChiNgoaiNgu.loai} ${s.hoSo.chungChiNgoaiNgu.diem}**: Đây là lợi thế cực lớn, có thể quy đổi thành điểm 10 môn Tiếng Anh hoặc xét tuyển kết hợp vào nhiều trường đại học lớn.` : "Bạn có thể nhập chứng chỉ ngoại ngữ (IELTS, VSTEP...) ở mục Hồ sơ để tính phương thức xét tuyển kết hợp.";
    const yDgnl = s.hoSo.diemDgnl?.hcm ? `Điểm ĐGNL ĐHQG-HCM của bạn là **${s.hoSo.diemDgnl.hcm}/1200 điểm**, nằm trong mức rất cạnh tranh.` : s.hoSo.diemDgnl?.hn ? `Điểm ĐGNL HSA của bạn là **${s.hoSo.diemDgnl.hn}/150 điểm**.` : "Nếu bạn có điểm ĐGNL ĐHQG-HCM hoặc HSA, hãy nhập ở Hồ sơ để tính phương thức xét tuyển sớm.";
    return {
      traLoi: `${loiChao}${yNgoaiNgu}\n${yDgnl}\n\n📌 **Lưu ý quan trọng về xét tuyển sớm:**\n• Các phương thức xét tuyển sớm (học bạ, ĐGNL, chứng chỉ quốc tế) thường mở cổng nhận hồ sơ từ tháng 3 đến tháng 5 hàng năm.\n• Dù trúng tuyển sớm có điều kiện, bạn vẫn cần đăng ký nguyện vọng lên cổng tuyển sinh chung của Bộ GD&ĐT vào tháng 7 để được công nhận chính thức.`,
      nguon: [],
    };
  }

  if (thieu) {
    if (coHoi) return { traLoi: `${loiChao}Hiện bạn đã đủ điểm 3 môn ở tổ hợp ${coHoi.toHop} (${so1(coHoi.tong)} điểm), nên mình so được ${coHoi.soNganh} ngành. Bạn nhập thêm điểm Sử, Địa, Tin hoặc các môn còn lại ở Hồ sơ để mình so thêm các ngành xét tổ hợp khác.`, nguon: [] };
    return { traLoi: "Bạn chưa nhập đủ điểm 3 môn của bất kỳ tổ hợp nào (ví dụ Toán, Lý, Anh). Có điểm 3 môn, mình sẽ so được với điểm chuẩn của từng ngành. Bạn vào Hồ sơ, bước Điểm các môn để nhập nhé.", nguon: [] };
  }

  if (canBang) {
    const ds = s.nguyenVong.map((id) => LUA_CHON_MAU.find((l) => l.id === id)).filter((l): l is LuaChon => !!l);
    if (ds.length === 0) {
      const g = coHoi ? goiYDanhSach(diem, s.hoSo, [], undefined, moNeoNV1(s)).slice(0, 8) : [];
      return { traLoi: g.length ? `${loiChao}Bạn chưa có nguyện vọng nào. Một danh sách cân bằng theo chiến lược 3 tầng thường có 1–2 ngành Thử sức (vươn tới ước mơ), 2–3 ngành Vừa sức (chắc chắn), 1–2 ngành An toàn và 1 Dự phòng.\n\nDựa trên hồ sơ của bạn (tổ hợp ${coHoi?.toHop} được ${so1(coHoi?.tong ?? 0)} điểm${s.hoSo.nganhQuanTam.length ? `, quan tâm ${s.hoSo.nganhQuanTam.join(", ")}` : ""}), mình gợi ý sẵn ${g.length} ngành phù hợp:\n${g.map((x) => `• ${x.lc.nganh}, ${x.lc.truong} (${x.nhan}): điểm chuẩn ${x.lc.diemMin}`).join("\n")}\n\nBạn vào mục Nguyện vọng, bấm “Gợi ý danh sách cho bạn” để xem chi tiết nhé.` : "Bạn chưa có nguyện vọng nào, và chưa đủ điểm để mình gợi ý. Bạn nhập điểm 3 môn của một tổ hợp trước nhé.", nguon: [] };
    }
    const sk = ds.map((l) => dungSuKien(l, diem, nguon));
    const dem: Record<string, number> = {};
    sk.forEach((x) => { if (x.nhanCuaEm) dem[x.nhanCuaEm] = (dem[x.nhanCuaEm] ?? 0) + 1; });
    const lietKe = ["Thử sức", "Vừa sức", "An toàn", "Dự phòng"].map((n) => `${dem[n] ?? 0} ${n}`).join(", ");
    const chacChan = (dem["An toàn"] ?? 0) + (dem["Dự phòng"] ?? 0);
    const loi = chacChan === 0
      ? "Danh sách chưa có ngành An toàn hay Dự phòng: bạn nên bổ sung thêm 1–2 ngành có điểm chuẩn thấp hơn điểm của bạn từ 1.5–2.5 điểm để đảm bảo 100% không bị trượt đại học."
      : (dem["Thử sức"] ?? 0) > sk.length / 2
        ? "Hơn một nửa danh sách là Thử sức, bạn cân nhắc bổ sung thêm ngành Vừa sức để tăng cơ hội trúng tuyển."
        : (dem["Thử sức"] ?? 0) === 0 && sk.length >= 3
          ? "Danh sách khá an toàn, bạn có thể tự tin thêm 1 ngành Thử sức ở NV1 để không bỏ lỡ ước mơ."
          : "Danh sách của bạn có cơ cấu 3 tầng khá cân bằng giữa Thử sức, Vừa sức và An toàn.";

    // Lấy NV1 làm gốc: còn cách bao xa, và các NV sau đỡ cho NV1 thế nào.
    const mn = phanTichMoNeo(s);
    const gocNV1 = mn
      ? ` Mình lấy NV1 ${mn.lc.truong} · ${mn.lc.nganh} làm gốc: ${cauKhoangCachNV1(mn) ?? (mn.monChuaCoDiem.length ? "bạn nhập đủ điểm các môn của tổ hợp để mình tính khoảng cách." : "điểm hiện tại của bạn đã chạm mốc điểm chuẩn.")}${mn.luoiDo.length ? ` Các nguyện vọng sau là lưới đỡ: ${mn.luoiDo.slice(0, 4).map((d) => `NV${d.thuTu} ${d.lc.truong} (${d.nhan})`).join(", ")}.` : ""}`
      : "";

    return {
      traLoi: `${loiChao}Danh sách của bạn có ${sk.length} nguyện vọng: ${lietKe}.${gocNV1}\n\n💡 **Đánh giá chiến lược:** ${loi}\n\nChi tiết các nguyện vọng hiện tại:\n${sk.map((d) => dongNganh(d)).join("\n")}${phanTichLoiThe()}\n\n${NHAC}`,
      nguon: ds.map((l) => l.id),
    };
  }

  if (huongDan) {
    if (!coHoi) return { traLoi: "Để gợi ý ngành, mình cần điểm 3 môn của một tổ hợp. Bạn nhập điểm ở Hồ sơ, rồi vào Khám phá: mình sẽ cho bạn biết điểm của bạn đủ cho bao nhiêu ngành, nhiều nhất ở nhóm nào.", nguon: [] };
    const top = coHoi.theoNhom.slice(0, 3).map((g) => `${g.nhom} (${g.duDiem} ngành đủ điểm)`).join(", ");
    const sq = s.hoSo.nganhQuanTam.length ? ` Bạn đang quan tâm ${s.hoSo.nganhQuanTam.join(", ")}: bạn vào Khám phá, chọn nhóm đó để xem các ngành sát điểm của bạn nhất.` : " Bạn chọn một nhóm ngành mình quan tâm ở Khám phá để xem các ngành sát điểm của bạn nhất.";
    return {
      traLoi: `${loiChao}Với tổ hợp ${coHoi.toHop} (${so1(coHoi.tong)} điểm), bạn đủ điểm chuẩn năm gần nhất của ${coHoi.soDuDiem} ngành đủ điểm và có thể thử sức thêm ${coHoi.soThuSuc} ngành. Nhiều nhất ở: ${top}.${sq}${phanTichLoiThe()}\n\n${NHAC}`,
      nguon: [],
    };
  }

  return {
    traLoi: `${loiChao}Mình chưa hiểu rõ câu hỏi. Bạn thử hỏi tên một ngành hoặc trường (ví dụ “điểm chuẩn Khoa học máy tính UIT”), hoặc hỏi “danh sách nguyện vọng của bạn có cân bằng không?”, “điểm của mình đã đủ cho ngành CNTT chưa?”.`,
    nguon: [],
  };
}


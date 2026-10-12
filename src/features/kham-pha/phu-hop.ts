// Tính mức phù hợp của một lựa chọn với hồ sơ của em. TypeScript thuần, không React.
// Mức phù hợp và điểm gợi ý /100 chỉ để em sắp xếp, so sánh. KHÔNG phải xác suất đậu.
import { NGAN_SACH_TOI_DA, NGUONG_PHU_HOP, diemPhuHop, lyDoKhacPhuongThuc, nhanNguyenVong } from "@/engine/phan-tich";
import { tongA01 } from "@/state/chon";
import { coHocPhi } from "@/data/lua-chon-phu";
import { diemDayDu, tongChoLuaChon } from "./to-hop";
import type { AppState } from "@/state/store";
import { TEN_MON, TEN_MON_NGAN, TEN_MON_THEM, TEN_MON_THEM_NGAN, type DiemDayDu, type LuaChon, type MonId, type MonThem, type MucPhuHop, type ToneTen } from "@/state/types";
import { khongRoNet, nhomNganhGoiY } from "@/features/huong-nghiep/cau-hoi";
import { cungNoi } from "./bo-loc";
import { dinhDang } from "@/engine/dinh-dang";

export interface BoiCanh {
  tong: number | null; // tổng Toán + Lý + Anh hiện tại, null nếu chưa nhập đủ (cho các màn chưa tính theo tổ hợp từng ngành)
  diem: DiemDayDu; // điểm từng môn hiện tại, để tính theo đúng tổ hợp của từng ngành
  nganSach: number | null; // triệu đồng / năm
  khuVucUuTien: string[];
  tinh: string;
  hocXaNha: boolean | null;
  nganhQuanTam: string[];
  /** Nhóm ngành hợp kết quả trắc nghiệm sở thích (rỗng nếu em chưa làm). */
  nganhHopSoThich: string[];
  uuTienViecLam: boolean;
}

export function boiCanhTu(s: AppState): BoiCanh {
  const h = s.hoSo;
  return {
    tong: tongA01(s),
    diem: diemDayDu(s),
    nganSach: h.nganSach ? NGAN_SACH_TOI_DA[h.nganSach] : null,
    khuVucUuTien: h.khuVuc,
    tinh: h.tinh === "Tỉnh khác" ? "" : h.tinh,
    hocXaNha: h.hocXaNha,
    nganhQuanTam: h.nganhQuanTam,
    nganhHopSoThich: h.soThich && !khongRoNet(h.soThich) ? nhomNganhGoiY(h.soThich, 4).map((g) => g.nhom) : [],
    uuTienViecLam: h.quanTamViecLam === "rat",
  };
}

export type MucChacChan = "Cao" | "Vừa" | "Thấp";
export const TONE_CHAC_CHAN: Record<MucChacChan, ToneTen> = { Cao: "luc", "Vừa": "cam", "Thấp": "do" };
/** Chữ hiển thị cho `chacChan`: chỉ mô tả vị trí điểm của em so với điểm chuẩn, không hứa kết quả. */
export const CHU_SO_VOI_DIEM_CHUAN: Record<MucChacChan, string> = { Cao: "Vượt điểm chuẩn", "Vừa": "Sát điểm chuẩn", "Thấp": "Thấp hơn điểm chuẩn" };
export const TONE_MUC: Record<MucPhuHop, ToneTen> = { "Phù hợp": "luc", "Có thể thử sức": "tim", "Cần cân nhắc": "cam" };
const THU_TU_MUC: Record<MucPhuHop, number> = { "Phù hợp": 0, "Có thể thử sức": 1, "Cần cân nhắc": 2 };

export interface KetQuaPhuHop {
  muc: MucPhuHop | null; // null = em chưa nhập đủ điểm để so
  tong: number | null; // điểm của em theo tổ hợp của ngành (null = chưa đủ điểm)
  chenh: number | null; // điểm của em trừ điểm tham khảo thấp nhất
  diemGoiY: number | null; // /100, điểm gợi ý, không phải xác suất đậu
  chacChan: MucChacChan | null; // null = chưa so được (thiếu điểm hoặc khác phương thức)
  /** Có chữ khi điểm chuẩn thuộc phương thức khác THPT nên không so được với điểm thi của em. */
  lyDoKhongSo: string | null;
  vuotNganSach: boolean;
  ngoaiKhuVuc: boolean;
  tomTat: string; // một dòng ngắn cho thẻ
  giaiThich: string; // một câu giải thích mức phù hợp
  tot: string[]; // điểm cộng sinh từ hồ sơ của em
  luuY: string[]; // điều cần lưu ý sinh từ hồ sơ của em
}

const so = (n: number) => (Math.abs(n) < 0.1 && n !== 0 ? dinhDang(n, 2) : dinhDang(Math.round(n * 10) / 10, 1));

/** Trường có nằm trong khu vực em ưu tiên không. "Tỉnh khác" khớp mọi nơi ngoài 3 thành phố lớn. */
export function dungKhuVuc(lc: LuaChon, uuTien: string[]): boolean | null {
  if (!uuTien.length) return null;
  const lon = ["TP.HCM", "Hà Nội", "Đà Nẵng"];
  return uuTien.some((k) => (k === "Tỉnh khác" ? !lon.includes(lc.khuVuc) : cungNoi(lc.khuVuc, k)));
}

export function danhGia(lc: LuaChon, bc: BoiCanh): KetQuaPhuHop {
  const tot: string[] = [];
  const luuY: string[] = [];

  // 1) Điểm: tính theo tổ hợp đề án ghi cho ngành này; đề án chưa ghi thì lấy tổ hợp cao nhất của em.
  const khac = lyDoKhacPhuongThuc(lc);
  const tl = tongChoLuaChon(lc, bc.diem);
  const tong = tl.tong;
  const chenh = tong === null ? null : Math.round((tong - lc.diemMin) * 100) / 100; // 2 chữ số: quyết định mức theo số thật, chỉ khi hiển thị mới làm tròn 1 chữ số
  const moNhom = tl.toHop ? ` (tổ hợp ${tl.toHop})` : "";
  if (!khac && tong !== null && chenh !== null) {
    if (chenh >= 0) tot.push(chenh < 0.05 ? `Điểm em${moNhom} ${so(tong)}, bằng mức tham khảo, chưa có dự phòng.` : `Điểm em${moNhom} ${so(tong)}, hơn mức tham khảo ${so(chenh)}.`);
    else luuY.push(`Điểm em${moNhom} ${so(tong)}, thiếu ${so(-chenh)} so với mức tham khảo.`);
    if (tl.suyRa) luuY.push(`Đề án chưa ghi tổ hợp, tạm dùng ${tl.toHop} của em. Nên kiểm tra đề án.`);
  }

  // 2) Học phí so với ngân sách
  let vuotNganSach = false;
  if (bc.nganSach !== null) {
    if (!coHocPhi(lc)) luuY.push("Chưa có học phí riêng của ngành, chưa so được ngân sách.");
    else if ((lc.hocPhiMin as number) > bc.nganSach) { vuotNganSach = true; luuY.push(`Học phí từ ${lc.hocPhiMin} tr/năm, vượt ngân sách ${bc.nganSach} tr.`); }
    else if ((lc.hocPhiMax as number) > bc.nganSach) luuY.push(`Học phí có thể tới ${lc.hocPhiMax} tr/năm, trên ngân sách ${bc.nganSach} tr.`);
    else tot.push(`Học phí trong ngân sách ${bc.nganSach} tr/năm.`);
  }

  // 3) Khu vực
  const dung = dungKhuVuc(lc, bc.khuVucUuTien);
  const xaNha = bc.hocXaNha === false && !!bc.tinh && !cungNoi(lc.khuVuc, bc.tinh);
  if (dung === true) tot.push(`Ở ${lc.khuVuc}, đúng khu vực em ưu tiên.`);
  else if (xaNha) luuY.push(`Ở ${lc.khuVuc}, xa nơi em muốn học.`);
  else if (dung === false) luuY.push(`Ở ${lc.khuVuc}, ngoài khu vực ưu tiên: tính thêm ăn ở.`);
  const ngoaiKhuVuc = xaNha;

  // 4) Ngành
  const khacNganh = bc.nganhQuanTam.length > 0 && !bc.nganhQuanTam.includes(lc.nhomNganh);
  if (bc.nganhQuanTam.includes(lc.nhomNganh)) tot.push(`Đúng nhóm ngành ${lc.nhomNganh} em quan tâm.`);
  else if (khacNganh) luuY.push(`Khác nhóm ngành em đã chọn (${bc.nganhQuanTam.join(", ")}).`);
  if (bc.nganhHopSoThich.includes(lc.nhomNganh)) tot.push("Hợp sở thích theo trắc nghiệm hướng nghiệp.");

  if (khac || tong === null || chenh === null) {
    return {
      muc: null, tong: null, chenh: null, diemGoiY: null, chacChan: null, lyDoKhongSo: khac, vuotNganSach, ngoaiKhuVuc, tot, luuY,
      tomTat: khac ? "Khác phương thức, chưa so được điểm" : tl.khongTinhDuoc ? `Ngành xét tổ hợp ${tl.khongTinhDuoc.slice(0, 3).join(", ")}, mình chưa so được`
        : tl.thieuMon ? `Thêm điểm ${tl.thieuMon.map((m) => TEN_MON_THEM_NGAN[m as MonThem] ?? TEN_MON_NGAN[m as MonId]).slice(0, 3).join(", ")} để so` : "Nhập đủ điểm 3 môn của một tổ hợp để so",
      giaiThich: khac ? `${khac} Em xem điểm chuẩn ở bảng bên dưới theo đúng phương thức đó.` : tl.khongTinhDuoc
        ? `Ngành này xét tổ hợp ${tl.khongTinhDuoc.join(", ")} (có môn năng khiếu hoặc ngoại ngữ khác), mình chưa tính được. Em so điểm chuẩn ở bảng bên dưới với điểm của em.`
        : tl.thieuMon
          ? `Ngành này xét tổ hợp cần điểm ${tl.thieuMon.map((m) => TEN_MON[m as MonId] ?? TEN_MON_THEM[m as MonThem]).join(", ")}. Em thêm điểm các môn đó ở Hồ sơ (bước Điểm các môn) để mình so.`
          : "Em chưa nhập đủ điểm 3 môn của tổ hợp xét tuyển ngành này nên chưa so được với điểm tham khảo.",
    };
  }

  // Mức theo điểm, rồi hạ xuống "Cần cân nhắc" nếu vướng học phí, khoảng cách, hoặc khác hẳn ngành em chọn.
  const theoDiem: MucPhuHop = chenh >= 0 ? "Phù hợp" : chenh >= -2 ? "Có thể thử sức" : "Cần cân nhắc";
  let muc = theoDiem;
  if (vuotNganSach || ngoaiKhuVuc || khacNganh) muc = "Cần cân nhắc";
  const vuaNganSach = bc.nganSach !== null && coHocPhi(lc) && (lc.hocPhiMax as number) <= bc.nganSach;

  const nhan = nhanNguyenVong(lc, tong);
  const chacChan: MucChacChan = nhan === "Thử sức" ? "Thấp" : nhan === "Vừa sức" ? "Vừa" : "Cao";

  const khuVucSo = bc.khuVucUuTien.find((k) => cungNoi(lc.khuVuc, k)) ?? bc.khuVucUuTien[0] ?? "";
  const diemTho = diemPhuHop(lc, {
    tong, nganSachTrieu: bc.nganSach ?? lc.hocPhiMax ?? 0, khuVuc: khuVucSo === "Tỉnh khác" ? "" : khuVucSo,
    uuTien: bc.uuTienViecLam ? "viecLam" : "hocPhi",
  });

  // Mức "Cần cân nhắc" (khác ngành, vượt ngân sách, ở xa...) thì điểm gợi ý không được vượt ngưỡng phù hợp, để hai con số không mâu thuẫn nhau.
  const diemGoiY = muc === "Cần cân nhắc" ? Math.min(diemTho, NGUONG_PHU_HOP - 1) : diemTho;

  const phanDiem = chenh >= 0 ? (chenh < 0.05 ? "bằng mức tham khảo" : `cao hơn mức tham khảo ${so(chenh)} điểm`) : `thấp hơn mức tham khảo ${so(-chenh)} điểm`;
  const tomTat = vuotNganSach ? "Học phí vượt ngân sách của em" : ngoaiKhuVuc ? "Ở xa nơi em muốn học"
    : khacNganh ? "Khác nhóm ngành em quan tâm" : `Điểm của em ${phanDiem}`;
  const giaiThich = muc === "Phù hợp"
    ? `Điểm của em ${phanDiem}${vuaNganSach ? ", học phí vừa ngân sách" : ""}.`
    : muc === "Có thể thử sức"
      ? `Điểm của em ${phanDiem}. Cố thêm là có thể với tới.`
      : vuotNganSach ? "Học phí vượt ngân sách, cần bàn với gia đình."
        : ngoaiKhuVuc ? "Trường ở xa nơi em muốn học."
          : khacNganh ? `Ngành này khác nhóm ngành em quan tâm. Điểm của em ${phanDiem}.`
            : `Điểm của em ${phanDiem}, khoảng cách còn khá xa.`;

  return { muc, tong, chenh, diemGoiY, chacChan, lyDoKhongSo: null, vuotNganSach, ngoaiKhuVuc, tomTat, giaiThich, tot, luuY };
}

export type KieuSapXep = "phuHop" | "hocPhi" | "diem";
export const CAC_KIEU_SAP_XEP: { gia: KieuSapXep; nhan: string }[] = [
  { gia: "phuHop", nhan: "Phù hợp nhất" }, { gia: "hocPhi", nhan: "Học phí thấp" }, { gia: "diem", nhan: "Điểm thấp" },
];

/** Em đã nhập đủ điểm cho ít nhất một tổ hợp 3 môn nào đó. */
export const coDiemDeSo = (bc: BoiCanh): boolean => tongChoLuaChon({ toHopXet: [] }, bc.diem).tong !== null;

export function sapXep(ds: LuaChon[], kieu: KieuSapXep, bc: BoiCanh): LuaChon[] {
  const kq = new Map(ds.map((l) => [l.id, danhGia(l, bc)]));
  return [...ds].sort((a, b) => {
    if (kieu === "hocPhi") return (a.hocPhiMin ?? Infinity) - (b.hocPhiMin ?? Infinity) || 0;
    if (kieu === "diem") return a.diemMin - b.diemMin;
    const ka = kq.get(a.id)!, kb = kq.get(b.id)!;
    // 1) Đúng nhóm ngành em quan tâm (nếu em có chọn). 2) Đúng khu vực ưu tiên.
    const nganh = (l: LuaChon) => (bc.nganhQuanTam.length === 0 || bc.nganhQuanTam.includes(l.nhomNganh) ? 0 : 1);
    const kv = (l: LuaChon) => (dungKhuVuc(l, bc.khuVucUuTien) === false ? 2 : bc.tinh && cungNoi(l.khuVuc, bc.tinh) ? 0 : 1);
    // Điểm của phương thức khác (học bạ, ĐGNL...) không cùng thang với điểm thi tốt nghiệp nên xếp sau cùng nhóm.
    const pt = (l: LuaChon) => (l.phuongThuc && l.phuongThuc !== "THPT" ? 1 : 0);
    const dau = nganh(a) - nganh(b) || pt(a) - pt(b);
    if (dau) return dau;
    // 3) Mức phù hợp (ngành chưa so được xếp cuối). 4) Trong cùng mức: trường điểm chuẩn sát điểm của em nhất (sát mà vẫn đủ điểm) lên trước,
    //    để em thấy trường tốt nhất mình với tới, không phải trường dễ nhất. Điểm gợi ý ở mức tối đa nên không đủ để phân biệt.
    const gan = (k: KetQuaPhuHop) => (k.chenh === null ? 999 : k.chenh >= 0 ? k.chenh : 100 - k.chenh);
    const hang = (k: KetQuaPhuHop) => (k.muc ? THU_TU_MUC[k.muc] : 3);
    return hang(ka) - hang(kb) || kv(a) - kv(b) || (ka.muc ? gan(ka) - gan(kb) : a.diemMin - b.diemMin);
  });
}

// ---------- So sánh 2 lựa chọn ----------

const VIEC_LAM_HANG = { "Rất cao": 3, Cao: 2, Khá: 1 } as const;
const hangViec = (l: LuaChon) => (l.coHoiViecLam ? VIEC_LAM_HANG[l.coHoiViecLam] : null);
const giua = (a: number, b: number) => (a + b) / 2;

/** Bên nào tốt hơn cho em ở từng tiêu chí: "a", "b" hoặc null (ngang nhau / không so được). */
export type BenTotHon = "a" | "b" | null;
export interface DongSoSanh { diem: BenTotHon; hocPhi: BenTotHon; khuVuc: BenTotHon; viecLam: BenTotHon; phuHop: BenTotHon; chacChan: BenTotHon }

const hon = (x: number, y: number, nguong = 0): BenTotHon => (x - y > nguong ? "a" : y - x > nguong ? "b" : null);

export function soSanhHai(a: LuaChon, b: LuaChon, bc: BoiCanh): { kqA: KetQuaPhuHop; kqB: KetQuaPhuHop; tot: DongSoSanh; ketLuan: string[] } {
  const kqA = danhGia(a, bc), kqB = danhGia(b, bc);
  const hangMuc = (k: KetQuaPhuHop) => (k.muc ? 3 - THU_TU_MUC[k.muc] : 0);
  const hangCC = (k: KetQuaPhuHop) => (k.chacChan ? { Cao: 3, "Vừa": 2, "Thấp": 1 }[k.chacChan] : 0);
  const kvA = dungKhuVuc(a, bc.khuVucUuTien), kvB = dungKhuVuc(b, bc.khuVucUuTien);
  const tot: DongSoSanh = {
    // Điểm đầu vào thấp hơn = dễ đạt hơn với em.
    diem: hon(b.diemMin, a.diemMin, 0.2),
    hocPhi: coHocPhi(a) && coHocPhi(b) ? hon(giua(b.hocPhiMin as number, b.hocPhiMax as number), giua(a.hocPhiMin as number, a.hocPhiMax as number), 1) : null,
    khuVuc: kvA === null || kvA === kvB ? null : kvA ? "a" : "b",
    viecLam: hangViec(a) !== null && hangViec(b) !== null ? hon(hangViec(a) as number, hangViec(b) as number) : null,
    phuHop: kqA.muc && kqB.muc ? hon(hangMuc(kqA), hangMuc(kqB)) || hon(kqA.diemGoiY ?? 0, kqB.diemGoiY ?? 0, 2) : null,
    chacChan: kqA.chacChan && kqB.chacChan ? hon(hangCC(kqA), hangCC(kqB)) : null,
  };
  return { kqA, kqB, tot, ketLuan: ketLuanNhanh(a, b, kqA, kqB) };
}

const khoang = (x: number, y: number) => {
  const lo = Math.min(x, y), hi = Math.max(x, y);
  return Math.abs(hi - lo) < 0.05 ? so(lo) : `${so(lo)}–${so(hi)}`;
};

/** 2–3 ý khác biệt chính, sinh từ dữ liệu của hai lựa chọn và điểm của em. */
export function ketLuanNhanh(a: LuaChon, b: LuaChon, kqA: KetQuaPhuHop, kqB: KetQuaPhuHop): string[] {
  const ra: string[] = [];
  const ten = (l: LuaChon) => (a.truong === b.truong ? `${l.truong} (${l.nganh})` : l.truong);

  // Điểm đầu vào
  const dMin = b.diemMin - a.diemMin, dMax = b.diemMax - a.diemMax;
  if (Math.abs(dMin) < 0.25 && Math.abs(dMax) < 0.25) ra.push(`Hai lựa chọn có điểm tham khảo gần như nhau (năm ${a.namDiem === b.namDiem ? a.namDiem : `${a.namDiem}/${b.namDiem}`}).`);
  else {
    const cao = dMin + dMax >= 0 ? b : a;
    ra.push(`${ten(cao)} có điểm đầu vào cao hơn khoảng ${khoang(Math.abs(dMin), Math.abs(dMax))} điểm.`);
  }

  // Học phí
  if (coHocPhi(a) && coHocPhi(b)) {
    const hpA = giua(a.hocPhiMin as number, a.hocPhiMax as number), hpB = giua(b.hocPhiMin as number, b.hocPhiMax as number);
    if (Math.abs(hpA - hpB) < 1.5) ra.push("Học phí hai bên gần bằng nhau.");
    else {
      const re = hpA < hpB ? a : b;
      ra.push(`${ten(re)} có học phí thấp hơn khoảng ${Math.round(Math.abs(hpA - hpB))} triệu/năm.`);
    }
  } else ra.push("Chưa so được học phí vì đề án chưa công bố học phí theo ngành.");

  // Ý thứ ba: hợp với em hơn (nếu có điểm), nếu không thì việc làm / môi trường học.
  if (kqA.muc && kqB.muc && kqA.chenh !== null && kqB.chenh !== null && kqA.muc !== kqB.muc) {
    const hop = THU_TU_MUC[kqA.muc] < THU_TU_MUC[kqB.muc] ? a : b;
    const k = hop === a ? kqA : kqB;
    ra.push(`Với điểm hiện tại, ${ten(hop)} hợp với em hơn (${k.muc!.toLowerCase()}).`);
  } else if (a.coHoiViecLam && b.coHoiViecLam && a.coHoiViecLam !== b.coHoiViecLam) {
    const hon2 = (hangViec(a) as number) > (hangViec(b) as number) ? a : b;
    ra.push(`${ten(hon2)} có cơ hội việc làm ${(hon2.coHoiViecLam as string).toLowerCase()}.`);
  } else if (!a.coHoiViecLam || !b.coHoiViecLam) {
    ra.push("Chưa so được cơ hội việc làm vì chưa có dữ liệu cho cả hai.");
  } else {
    ra.push(`Cả hai có cơ hội việc làm ${a.coHoiViecLam.toLowerCase()}.`);
  }
  return ra;
}

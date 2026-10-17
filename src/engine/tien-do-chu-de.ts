// Tiến độ học theo chủ đề của chương trình lớp 12 (bộ Kết nối tri thức): hiểu câu em nói về mình đã học gì, và xếp thứ tự học. TypeScript thuần.
//
// Nguyên tắc chống bịa: mọi tên chủ đề và ý "cần nắm" lấy từ src/data/chuong-trinh-lop12.ts. Câu nói không khớp chủ đề nào, hoặc nói về
// kiến thức lớp 10–11, thì trả về dưới dạng "chưa có dữ liệu" để lớp trên báo lại, KHÔNG tự đoán chủ đề.
// Các hệ số xếp thứ tự là giả định của nhóm (như engine/ho-so-mon.ts), chưa đo trên học sinh thật.
import { CHU_DE_LOP12, NGOAI_PHAM_VI_LOP12, chuDeCuaMon, timChuDeTheoId, timChuDeTheoTen, type ChuDeHoc } from "@/data/chuong-trinh-lop12";
import { chuanHoa } from "@/engine/truong";
import { TEN_MON, type MonId } from "@/state/types";

export type MucDoChuDe = "chuaHoc" | "dangHoc" | "namVung" | "canOnTap";
export type TienDoChuDe = Record<string, MucDoChuDe>;

export const NHAN_MUC_DO: Record<MucDoChuDe, string> = { chuaHoc: "Chưa học", dangHoc: "Đã học, chưa chắc", namVung: "Vững", canOnTap: "Cần ôn" };

/** Mức "còn phải học": càng cao càng cần học sớm. Chủ đề chưa có câu trả lời được coi là chưa biết (trung tính hơi cao). */
const CAN_HOC: Record<MucDoChuDe | "chuaTraLoi", number> = { chuaHoc: 1, canOnTap: 0.8, chuaTraLoi: 0.6, dangHoc: 0.5, namVung: 0.1 };

export interface ChuDeUuTien {
  chuDe: ChuDeHoc;
  mucDo: MucDoChuDe | null;
  diem: number;
  lyDo: string;
}

/** Em đã trả lời ít nhất một chủ đề của môn này chưa. */
export const coTienDoMon = (mon: MonId, tienDo: TienDoChuDe | undefined): boolean => !!tienDo && chuDeCuaMon(mon).some((c) => !!tienDo[c.ten]);

const lyDoMuc = (m: MucDoChuDe | null): string =>
  m === "chuaHoc" ? "em ghi là chưa học" : m === "canOnTap" ? "em ghi là cần ôn" : m === "dangHoc" ? "em đã học nhưng chưa chắc" : m === "namVung" ? "em ghi là đã vững" : "em chưa cho mình biết mức hiện tại";

/**
 * Thứ tự nên học trong một môn: chủ đề còn phải học nhiều lên trước; chủ đề tiên quyết chưa vững đứng trước chủ đề phụ thuộc nó.
 * Không dùng trọng số theo đề thi (chưa có số liệu đếm), nên mọi chủ đề ngang quan trọng.
 */
export function xepUuTienChuDe(mon: MonId, tienDo: TienDoChuDe | undefined): ChuDeUuTien[] {
  const ds = chuDeCuaMon(mon).map((chuDe, i) => {
    const mucDo = tienDo?.[chuDe.ten] ?? null;
    return { chuDe, mucDo, diem: CAN_HOC[mucDo ?? "chuaTraLoi"], lyDo: lyDoMuc(mucDo), i };
  });
  ds.sort((a, b) => b.diem - a.diem || a.i - b.i);
  // Đưa chủ đề tiên quyết (nếu chưa vững) lên trước chủ đề phụ thuộc.
  const ra: typeof ds = [];
  const them = (x: (typeof ds)[number]) => {
    if (ra.includes(x)) return;
    for (const id of x.chuDe.tienQuyet ?? []) {
      const q = ds.find((d) => d.chuDe.id === id);
      if (q && q.mucDo !== "namVung") them(q);
    }
    ra.push(x);
  };
  ds.forEach(them);
  return ra.map(({ chuDe, mucDo, diem, lyDo }) => ({ chuDe, mucDo, diem, lyDo }));
}

/** Các chủ đề còn nên học (bỏ chủ đề em đã vững); nếu em vững hết thì trả toàn bộ để ôn giữ nhịp. */
export function chuDeConHoc(mon: MonId, tienDo: TienDoChuDe | undefined): ChuDeUuTien[] {
  const ds = xepUuTienChuDe(mon, tienDo);
  const con = ds.filter((x) => x.mucDo !== "namVung");
  return con.length ? con : ds;
}

// ---------- Hiểu câu gõ tự do (quy tắc, không dùng AI) ----------

/**
 * Nhận ra môn trong câu. Tên đầy đủ ("vat ly", "hoa hoc") khớp ở bất cứ đâu; tên ngắn ("ly", "hoa", "van", "anh", "sinh")
 * chỉ khớp ở đầu đoạn hoặc sau "môn/học/ôn/em/xong/về", để "tiến hóa", "lý thuyết", "toàn phần" không bị nhầm sang môn khác.
 */
const monNgan = (ngan: string) => new RegExp(`(?:^|\\b(?:mon|hoc|on|xong|em|ve)\\s)${ngan}\\b`);
const TU_MON: { mon: MonId; mau: RegExp[] }[] = [
  { mon: "vatLy", mau: [/\b(vat ly|vat li)\b/, monNgan("(?:ly|li)")] },
  { mon: "toan", mau: [/\btoan\b/] },
  { mon: "hoaHoc", mau: [/\bhoa hoc\b/, monNgan("hoa")] },
  { mon: "sinh", mau: [/\bsinh hoc\b/, monNgan("sinh")] },
  { mon: "nguVan", mau: [/\bngu van\b/, monNgan("van")] },
  { mon: "tiengAnh", mau: [/\b(tieng anh|anh van)\b/, monNgan("anh")] },
];

const MAU_CHUA_HOC = /\b(chua hoc|chua biet|chua on|chua den|chua duoc hoc|chua lam)\b/;
const MAU_CAN_ON = /\b(can on|yeu|kem|hay sai|con quen|chua vung|chua chac|chua nam chac|on lai|on tap lai)\b/;
const MAU_VUNG = /\b(gioi|vung|nam chac|nam vung|thanh thao|tot|thao|tu tin|chac chan|lam tot)\b/;
const MAU_DA_HOC = /\b(hoc xong|hoc roi|da hoc|hoc duoc|da on|on xong|on roi|hoc het|hoc qua|da xong)\b/;

export function mucDoTuCau(seg: string): MucDoChuDe | null {
  if (MAU_CHUA_HOC.test(seg)) return "chuaHoc";
  if (MAU_CAN_ON.test(seg)) return "canOnTap";
  if (MAU_VUNG.test(seg)) return "namVung";
  if (MAU_DA_HOC.test(seg)) return "dangHoc";
  return null;
}

const khop = (seg: string, kw: string) => ` ${seg} `.includes(` ${chuanHoa(kw)} `);

export interface KetQuaTienDo {
  /** Chủ đề trong dữ liệu khớp câu em nói, kèm mức hiểu được. */
  khop: { chuDe: ChuDeHoc; mucDo: MucDoChuDe }[];
  /** Chủ đề em nhắc nhưng thuộc lớp 10–11 (không có trong dữ liệu lớp 12). */
  ngoaiPhamVi: { ten: string; lop: string; mon: MonId }[];
  /** Đoạn có nêu mức học nhưng không khớp chủ đề nào: chưa có dữ liệu phù hợp. */
  khongKhop: string[];
  /** Môn được nhắc trong câu (để biết hỏi tiếp môn nào). */
  mon: MonId[];
}

/**
 * Tách câu thành các đoạn (dấu phẩy, chấm phẩy, "nhưng", "còn"), mỗi đoạn tìm môn, mức học và chủ đề.
 * Chỉ ghi nhận khi đoạn có mức học rõ ràng; đoạn chỉ nêu môn mà không nêu mức thì bỏ qua (không đoán).
 */
export function hieuTienDoTuCau(cau: string): KetQuaTienDo {
  const kq: KetQuaTienDo = { khop: [], ngoaiPhamVi: [], khongKhop: [], mon: [] };
  const goc = cau.split(/[,;.\n]|\bnhung\b|\bcon\b|\bnhưng\b|\bcòn\b/i).map((x) => x.trim()).filter(Boolean);
  let monNgu: MonId | null = null;
  for (const raw of goc) {
    // "cuộc sống", "đời sống" không phải bài Sóng (từ khóa "song" khớp nhầm sau khi bỏ dấu).
    const seg = chuanHoa(raw).split(" cuoc song ").join(" ").split(" doi song ").join(" ").trim();
    if (!seg) continue;
    const monTrongDoan = TU_MON.filter((m) => m.mau.some((r) => r.test(seg))).map((m) => m.mon);
    for (const m of monTrongDoan) if (!kq.mon.includes(m)) kq.mon.push(m);
    if (monTrongDoan.length === 1) monNgu = monTrongDoan[0];
    const mucDo = mucDoTuCau(seg);
    // Tên chủ đề nằm trong đoạn; nếu đã biết môn thì chỉ xét chủ đề của môn đó.
    const monXet = monTrongDoan.length === 1 ? monTrongDoan[0] : monNgu;
    const ung = (monXet ? chuDeCuaMon(monXet) : CHU_DE_LOP12).filter((c) => c.tuKhoa.some((k) => khop(seg, k)));
    // Từ khóa "hình học" chung chung cho nhiều chủ đề: ghi nhận tất cả chủ đề khớp, đã giới hạn theo môn nếu có.
    if (ung.length === 0) {
      const ngoai = NGOAI_PHAM_VI_LOP12.filter((n) => (!monXet || n.mon === monXet) && n.tuKhoa.some((k) => khop(seg, k)));
      for (const n of ngoai) if (!kq.ngoaiPhamVi.some((x) => x.ten === n.ten)) kq.ngoaiPhamVi.push({ ten: n.ten, lop: n.lop, mon: n.mon });
      if (ngoai.length === 0 && mucDo && monTrongDoan.length === 0 && !monNgu) continue;
      if (ngoai.length === 0 && mucDo) kq.khongKhop.push(raw);
      continue;
    }
    if (!mucDo) continue;
    for (const c of ung) if (!kq.khop.some((x) => x.chuDe.id === c.id)) kq.khop.push({ chuDe: c, mucDo });
  }
  return kq;
}

/** Tiến độ sau khi áp dụng các chủ đề đã hiểu (khóa là tên chủ đề). */
export function apDungTienDo(truoc: TienDoChuDe | undefined, khopDuoc: { chuDe: ChuDeHoc; mucDo: MucDoChuDe }[]): TienDoChuDe {
  const ra: TienDoChuDe = { ...(truoc ?? {}) };
  for (const k of khopDuoc) ra[k.chuDe.ten] = k.mucDo;
  return ra;
}

// ---------- Hỏi về chương trình ----------

export const tenMon = (m: MonId) => TEN_MON[m];

export function monTuCau(cau: string): MonId[] {
  const seg = chuanHoa(cau);
  return TU_MON.filter((m) => m.mau.some((r) => r.test(seg))).map((m) => m.mon);
}

export { timChuDeTheoId, timChuDeTheoTen, chuDeCuaMon };

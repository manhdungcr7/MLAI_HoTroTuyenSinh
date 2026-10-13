// Gợi ý cho người duyệt: kiểm tra quy tắc (không cần AI) + Clef chấm độ tin cậy/loại nội dung + kiểm trùng bằng vector.
// CHỈ là gợi ý: không đổi trạng thái, không ghi vào bản ghi. Thiếu AI hoặc Clef lỗi thì vẫn trả phần quy tắc (ai: null).
// Thông tin liên hệ của người nộp (email, điện thoại, createdBy) không bao giờ đưa vào state gửi AI.
import type { BanGhiCms } from "../../../src/engine/du-lieu-tuyen-sinh/kieu";
import { hoiClef, type CauHoiClef } from "../../../functions/_thu-vien/ai/clef";
import { mucTuBanGhi, vanBanCuaMuc } from "../../../functions/_thu-vien/ai/chi-muc";
import { nhungVanBan } from "../../../functions/_thu-vien/ai/nhung";
import { tinhCuaTruong } from "../../../functions/_thu-vien/ai/tinh-lan-can";
import type { EnvAI } from "../../../functions/_thu-vien/ai/kieu";
import { kiemTraNoiDungTheoLoai, maTruongCua } from "./ban-ghi-d1";

/** Ngưỡng cosine báo "có thể trùng". Giữ 0,9, CHƯA đủ căn cứ để đổi. Đo ngày 2026-10-13 bằng bge-m3 trên 721 bản ghi học phí thật (cùng trường, cùng loại):
 *  - Hai ngành khác nhau của cùng trường có cosine trung vị 0,90, p95 0,955 (vì câu mẫu "Học phí X năm N: a triệu đồng/năm. Áp dụng: ..." gần như giống hệt nhau): ngưỡng 0,9 báo nhầm 55% cặp, 0,95 còn 7%, 0,97 còn 1,5%.
 *  - Cùng chương trình nhưng đổi năm/giá: 0,945 đến 0,98 (0,95 bắt 97%). Cùng chương trình diễn đạt khác hoặc bỏ tên trường: trung vị 0,91 đến 0,94 (0,95 chỉ bắt 3% đến 20%).
 *  Hai nhóm chồng lấn nên chỉ vector không tách được bản ghi có cấu trúc cố định như học phí; nếu cần thì dùng khóa thực thể (entityId) để kiểm trùng loại này, và đo lại riêng cho ghi chú cộng đồng (chữ tự do) khi có dữ liệu thật đã gán nhãn. */
export const NGUONG_TRUNG = 0.9;
/** Dưới mức này thì không báo loại nội dung (Clef không chắc). Cùng ngưỡng với functions/_thu-vien/ai/clef.ts. */
export const NGUONG_TIN_CAY_LOAI = 0.3;
/** Khoảng hợp lý (triệu đồng/năm) và (triệu đồng/tín chỉ) của học phí; điểm chuẩn thang 30. */
export const HOC_PHI_NAM = { thap: 5, cao: 400 } as const;
export const HOC_PHI_TIN_CHI = { thap: 0.1, cao: 10 } as const;
export const DIEM_CHUAN_TOI_DA = 30;
const DIEM_CHUAN_THAP_BAT_THUONG = 10;
const LOAI_CONG_DONG = ["noi_luu_tru", "review", "luu_y"];
const LOAI_CO_THOI_HAN = ["deadline", "announcement", "scholarship", "admission"];

export type MucCanhBao = "loi" | "luu-y";
export interface CanhBao { ma: string; muc: MucCanhBao; thongBao: string }
export type MucTinCay = "cao" | "vua" | "thap";
export interface GoiYAI {
  doTinCay: { diem: number; muc: MucTinCay };
  loai: { chon: string; tinCay: number } | null;
  khanCap: { diem: number; muc: "cao" | "vua" | "thap" } | null;
  nhayCam: { xacSuat: number; co: boolean } | null;
}
export interface BanTrung { id: string; diem: number; noiDung: string }
export interface KetQuaGoiY { id: string; quyTac: CanhBao[]; ai: GoiYAI | null; trung: BanTrung | null; daKiemTrung: boolean }

const laSo = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const RE_EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/g;
const RE_DIEN_THOAI = /\+?\d[\d\s.-]{7,}\d/g;
/** Bỏ email và số điện thoại khỏi chuỗi trước khi gửi AI. */
export const boLienHe = (s: string) => s.replace(RE_EMAIL, "[removed]").replace(RE_DIEN_THOAI, "[removed]");
const coLienHe = (s: string) => new RegExp(RE_EMAIL.source).test(s) || new RegExp(RE_DIEN_THOAI.source).test(s);
const cat = (s: string, n: number) => (s.length > n ? s.slice(0, n) : s);

export type LoaiNguon = "official_edu_gov" | "social_media" | "other_website" | "none";
export function loaiNguon(url: string | undefined): { loai: LoaiNguon; host: string } {
  if (!url) return { loai: "none", host: "" };
  let host = "";
  try { host = new URL(url).hostname.toLowerCase(); } catch { return { loai: "none", host: "" }; }
  if (/(^|\.)(edu|gov)\.vn$/.test(host) || /\.(edu|gov)$/.test(host)) return { loai: "official_edu_gov", host };
  if (/(^|\.)(facebook|fb|zalo|zalo\.me|tiktok|instagram|youtube|twitter|x|t)\.(com|me|vn|co)$/.test(host)) return { loai: "social_media", host };
  return { loai: "other_website", host };
}

const hopLy = (v: number, lo: number, hi: number) => v >= lo && v <= hi;

/** Kiểm tra quy tắc rẻ, không cần AI. */
export function kiemTraQuyTac(b: BanGhiCms): CanhBao[] {
  const ra: CanhBao[] = [];
  const them = (ma: string, muc: MucCanhBao, thongBao: string) => ra.push({ ma, muc, thongBao });
  const d = (b.data ?? {}) as Record<string, unknown>;
  const nguon = loaiNguon(b.source?.url);
  const chinhThuc = !LOAI_CONG_DONG.includes(b.entityType);

  if (!b.source?.url || !b.source.tieuDe?.trim() || !b.source.donViCongBo?.trim()) them("thieu-nguon", "loi", "Thiếu nguồn kiểm chứng (link, tiêu đề hoặc đơn vị công bố).");
  else if (chinhThuc && nguon.loai === "social_media") them("nguon-mang-xa-hoi", "luu-y", "Nguồn là trang mạng xã hội, chưa phải văn bản chính thức của trường hoặc Bộ.");
  else if (chinhThuc && nguon.loai === "other_website") them("nguon-ngoai-edu-gov", "luu-y", `Nguồn không thuộc tên miền .edu.vn hoặc .gov.vn (${nguon.host}). Hãy mở link kiểm tra.`);

  if (d.maTruong !== undefined && typeof d.maTruong === "string" && d.maTruong.toUpperCase() !== maTruongCua(b.entityId)) them("lech-ma-truong", "loi", "Mã trường trong nội dung khác mã trường của bản ghi.");

  const batBuoc: Record<string, string[]> = {
    cutoff_score: ["diemChuan", "maNganh", "nam"], tuition: ["mucThap", "mucCao"], scholarship: ["tenHocBong"], admission: ["nam"], announcement: ["tieuDe"],
  };
  const thieu = (batBuoc[b.entityType] ?? []).filter((k) => d[k] === undefined || d[k] === null || d[k] === "");
  if (thieu.length) them("thieu-truong", "loi", `Thiếu trường bắt buộc của loại này: ${thieu.join(", ")}.`);

  if (b.entityType === "noi_luu_tru" || b.entityType === "luu_y") {
    try { kiemTraNoiDungTheoLoai(b.entityType, d); } catch (e) { them("sai-dinh-dang", "loi", e instanceof Error && e.message ? e.message : "Nội dung không đúng định dạng của loại này."); }
  }

  if (b.entityType === "cutoff_score" && d.diemChuan !== undefined) {
    const x = d.diemChuan;
    if (!laSo(x) || x < 0 || x > DIEM_CHUAN_TOI_DA) them("diem-ngoai-khoang", "loi", `Điểm chuẩn ${String(x)} nằm ngoài thang 0 đến ${DIEM_CHUAN_TOI_DA}.`);
    else if (x < DIEM_CHUAN_THAP_BAT_THUONG) them("diem-thap", "luu-y", `Điểm chuẩn ${x} thấp bất thường (dưới ${DIEM_CHUAN_THAP_BAT_THUONG}). Kiểm tra lại thang điểm.`);
  }
  if (b.entityType === "tuition") {
    const kr = d.donVi === "trieu_tin_chi" ? HOC_PHI_TIN_CHI : HOC_PHI_NAM;
    const donVi = d.donVi === "trieu_tin_chi" ? "triệu đồng/tín chỉ" : "triệu đồng/năm";
    const lo = d.mucThap, hi = d.mucCao;
    if (lo !== undefined && hi !== undefined) {
      if (!laSo(lo) || !laSo(hi)) them("hoc-phi-khong-phai-so", "loi", "Mức học phí phải là số.");
      else {
        if (lo > hi) them("hoc-phi-nguoc", "loi", "Mức thấp lớn hơn mức cao.");
        if (!hopLy(lo, kr.thap, kr.cao) || !hopLy(hi, kr.thap, kr.cao)) them("hoc-phi-ngoai-khoang", "luu-y", `Học phí ${lo}-${hi} nằm ngoài khoảng thường gặp ${kr.thap}-${kr.cao} ${donVi}. Kiểm tra đơn vị.`);
      }
    }
  }
  if (!chinhThuc || b.entityType === "announcement") {
    if (coLienHe(JSON.stringify(d) + " " + (b.changeNote ?? ""))) them("co-lien-he", "luu-y", "Nội dung có vẻ chứa email hoặc số điện thoại cá nhân. Cân nhắc gỡ trước khi xuất bản.");
  }
  return ra;
}

/** State tiếng Anh gửi Clef: loại bản ghi, nội dung (nguyên văn, đã bỏ liên hệ), nguồn, trường/tỉnh. Không có createdBy/email/điện thoại. */
export function dungStateDuyet(b: BanGhiCms): Record<string, unknown> {
  const ma = maTruongCua(b.entityId);
  const nguon = loaiNguon(b.source?.url);
  let noiDung = "";
  try { noiDung = vanBanCuaMuc(mucTuBanGhi(b, String(b.version))) ?? ""; } catch { /* rơi về JSON dưới */ }
  if (!noiDung) noiDung = JSON.stringify(b.data ?? {});
  return JSON.parse(JSON.stringify({
    record: {
      type: b.entityType,
      communityContributed: LOAI_CONG_DONG.includes(b.entityType),
      isRevisionOfExisting: b.version > 1,
      importance: b.importance,
      content: cat(boLienHe(noiDung), 600),
      changeNote: b.changeNote ? cat(boLienHe(b.changeNote), 200) : undefined,
      hasSource: Boolean(b.source?.url),
      sourceKind: nguon.loai,
      sourcePublisher: b.source?.donViCongBo ? cat(boLienHe(b.source.donViCongBo), 100) : undefined,
      schoolCode: ma,
      province: tinhCuaTruong(ma),
    },
  }));
}

export function dungCauHoiDuyet(b: BanGhiCms): Record<string, CauHoiClef> {
  const q: Record<string, CauHoiClef> = {
    credibility: { type: "score", criteria: ["unlikely", "doubtful", "plausible", "well-supported"], instructions: "How credible is this record's content for a university admissions information site, considering its source kind and whether the claim is specific and verifiable?" },
    kind: { type: "choice", criteria: { official_info: "factual information as published by the school or ministry", personal_opinion: "a personal opinion or experience", advertisement: "promotional or marketing content", spam: "spam, nonsense or unrelated content", other: "anything else" }, instructions: "What kind of content is this record?" },
    contains_sensitive: { type: "noul", instructions: "Does the content contain personal information about an individual or other sensitive content (insults, private data)?" },
  };
  if (LOAI_CO_THOI_HAN.includes(b.entityType)) q.urgency = { type: "score", criteria: ["low", "medium", "high"], instructions: "How time-sensitive is this record for students (deadline soon, change that affects applications)?" };
  return q;
}

const mucTinCay = (x: number): MucTinCay => (x >= 0.85 ? "cao" : x >= 0.5 ? "vua" : "thap");
const lam = (v: number) => Math.round(v * 100) / 100;

/** Một lượt Clef. null khi thiếu AI, quá hạn hoặc lỗi. */
export async function chamBangAI(env: EnvAI, b: BanGhiCms, hanMs?: number): Promise<GoiYAI | null> {
  const kq = await hoiClef(env.AI, dungStateDuyet(b), dungCauHoiDuyet(b), hanMs ? { hanMs } : undefined);
  const cred = kq?.traLoi.credibility?.score;
  if (!kq || cred === undefined) return null;
  const k = kq.traLoi.kind?.choice;
  const u = kq.traLoi.urgency?.score;
  const n = kq.traLoi.contains_sensitive?.noul;
  return {
    doTinCay: { diem: lam(cred), muc: mucTinCay(cred) },
    loai: k && k.tinCay >= NGUONG_TIN_CAY_LOAI ? { chon: k.chon, tinCay: lam(k.tinCay) } : null,
    khanCap: u === undefined ? null : { diem: lam(u), muc: mucTinCay(u) },
    nhayCam: n === undefined ? null : { xacSuat: lam(n), co: n >= 0.5 },
  };
}

/** Tìm bản đã xuất bản cùng trường + cùng loại có nội dung gần giống (cosine >= NGUONG_TRUNG). daKiemTrung=false khi thiếu AI/Vectorize hoặc lỗi. */
export async function kiemTrung(env: EnvAI, b: BanGhiCms): Promise<{ trung: BanTrung | null; daKiemTrung: boolean }> {
  const khong = { trung: null, daKiemTrung: false };
  if (!env.AI || !env.VECTORIZE) return khong;
  try {
    const muc = mucTuBanGhi(b, String(b.version));
    const vanBan = vanBanCuaMuc(muc);
    const ma = maTruongCua(b.entityId);
    if (!vanBan || !ma) return khong;
    const vec = await nhungVanBan(env.AI, [vanBan]);
    if (!vec) return khong;
    const r = await env.VECTORIZE.query(vec[0], { topK: 5, returnMetadata: "all", filter: { maTruong: ma, loai: b.entityType } });
    const tot = r.matches.filter((m) => m.id !== muc.id && m.score >= NGUONG_TRUNG).sort((x, y) => y.score - x.score)[0];
    return { trung: tot ? { id: tot.id, diem: lam(tot.score), noiDung: cat(String(tot.metadata?.noiDung ?? ""), 200) } : null, daKiemTrung: true };
  } catch {
    return khong;
  }
}

export async function goiYDuyet(env: EnvAI, b: BanGhiCms): Promise<KetQuaGoiY> {
  const quyTac = kiemTraQuyTac(b);
  const [ai, t] = await Promise.all([chamBangAI(env, b), kiemTrung(env, b)]);
  return { id: b.id, quyTac, ai, trung: t.trung, daKiemTrung: t.daKiemTrung };
}

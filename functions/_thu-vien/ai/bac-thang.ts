// Bậc thang tư vấn, rẻ -> đắt: cache KV -> Clef (chọn sự kiện) -> RAG cộng đồng (Vectorize) -> LLM.
// Mỗi bậc thiếu binding hoặc lỗi thì bị bỏ qua, bậc sau vẫn chạy; chỉ bậc LLM mới có thể làm cả lượt thất bại.
import { dungNoiDung, locNguon, type KhoKV, type SuKien, type YeuCauTuVan } from "../../../src/engine/tu-van";
import { docCache, ghiCache, khoaCache } from "./cache";
import { HANH_DONG, quyetDinhNguyenVong, type HanhDong, type NhanEn, type UngVienEn } from "./clef";
import { truyVanNhieuBoLoc, type BoLoc, type MangChiMuc } from "./chi-muc";
import { nhanDienTruongTinh } from "./ten-truong";
import type { EnvAI } from "./kieu";
import { coKhoaLLM, goiMoHinh, type EnvLLM } from "./sinh-van-ban";

export interface EnvBacThang extends EnvLLM, EnvAI { RATE_KV?: KhoKV; DATA_VERSION?: string }
export interface KetQuaBacThang { traLoi: string; nguon: string[]; tang: "cache" | "llm"; congDong?: string[]; viecTiep?: string }
export type KhoiBacThang = { ok: true; kq: KetQuaBacThang } | { ok: false; loi: "chua-cau-hinh"; goiY?: { nextAction: HanhDong; viecTiep: string } };

const NHAN_EN: Record<string, NhanEn> = { "Thử sức": "trial", "Vừa sức": "match", "An toàn": "safe", "Dự phòng": "backup" };
const VIEC_TIEP: Record<HanhDong, string> = {
  enter_more_scores: "Nhập thêm điểm các môn còn thiếu để mình so được với điểm chuẩn.",
  add_safe_option: "Thêm vài lựa chọn An toàn hoặc Dự phòng vào danh sách.",
  keep_list: "Danh sách đang cân đối, em chưa cần đổi gì.",
  review_tuition: "Xem lại học phí: một số ngành đang vượt ngân sách của em.",
  widen_region: "Mở rộng sang các trường ở tỉnh khác, vì trong tỉnh còn ít lựa chọn.",
};
const MIN_SU_KIEN = 4, MAX_SU_KIEN = 6, MAX_MANH = 6;

/** Nhãn/chênh điểm/học phí là số client đã tính: chỉ chuyển ngữ, không tính lại. */
export function dungUngVien(y: YeuCauTuVan): UngVienEn[] {
  const tinh = y.hoSo?.tinh;
  return y.duLieu.flatMap((d): UngVienEn[] => {
    const label = d.nhanCuaEm ? NHAN_EN[d.nhanCuaEm] : undefined;
    if (!label) return [];
    const vl = d.tiLeViecLam;
    return [{ id: d.id, label, scoreGap: d.chenh, tuitionMillion: d.hocPhiTrieu, sameProvince: tinh ? d.tinh === tinh : undefined, employment: vl === undefined ? undefined : vl > 1 ? vl / 100 : vl, interestGroups: [d.nganh] }];
  });
}

/** Cắt xuống 4-6 sự kiện theo gợi ý Clef (bổ sung theo thứ tự gốc nếu Clef chỉ nêu ít). */
export function catSuKien(duLieu: SuKien[], uuTien: string[]): SuKien[] {
  if (!uuTien.length) return duLieu;
  const chon = uuTien.map((id) => duLieu.find((d) => d.id === id)).filter((d): d is SuKien => !!d).slice(0, MAX_SU_KIEN);
  for (const d of duLieu) { if (chon.length >= MIN_SU_KIEN) break; if (!chon.includes(d)) chon.push(d); }
  return duLieu.filter((d) => chon.includes(d));
}

/** Ngân sách thời gian (ms) của một lượt: Clef 3 giây, RAG 2 giây, phần còn lại cho LLM, tổng dưới 12 giây để luôn trả trước khi trình duyệt bỏ (15 giây). */
export const NGAN_SACH = { tong: 12_000, clef: 3_000, rag: 2_000, llmToiThieu: 3_000 };
/** Điểm cosine tối thiểu cho mảnh tìm trên toàn kho (không lọc trường/tỉnh). */
export const NGUONG_TOAN_KHO = 0.6;

const sau = <T>(p: Promise<T>, ms: number, dự: T): Promise<T> => {
  let h: ReturnType<typeof setTimeout> | undefined;
  return Promise.race([p, new Promise<T>((r) => { h = setTimeout(() => r(dự), ms); })]).finally(() => h && clearTimeout(h));
};

/** Chủ đề lượt trước: câu "Em hỏi:" gần nhất trong ngữ cảnh client gửi lên. */
export function chuDeLuotTruoc(nguCanh?: string): string {
  const dong = (nguCanh ?? "").split("\n").filter((d) => d.startsWith("Em hỏi: "));
  return dong.length ? dong[dong.length - 1].slice(8).trim() : "";
}

/** Câu dùng để nhúng và nhận diện trường/tỉnh: câu quá ngắn hoặc chỉ nêu đại từ thì ghép với chủ đề lượt trước. */
export function cauTruyVanRag(y: YeuCauTuVan): string {
  const chuDe = chuDeLuotTruoc(y.nguCanh);
  return chuDe && y.cauHoi.length < 40 ? `${chuDe} ${y.cauHoi}`.slice(0, 300) : y.cauHoi;
}

/** Gom bộ lọc: tỉnh của em; trường trong dữ liệu gửi kèm; trường và tỉnh được NÊU TRONG CÂU HỎI (kể cả khác dữ liệu gửi kèm); thêm một truy vấn toàn kho. */
export function boLocRag(y: YeuCauTuVan): BoLoc[] {
  const tinh = y.hoSo?.tinh?.trim();
  const nhan = nhanDienTruongTinh(cauTruyVanRag(y));
  const truong = [...new Set([...nhan.truong, ...y.duLieu.map((d) => d.truong).filter(Boolean)])].slice(0, 3);
  const bo: BoLoc[] = [];
  if (tinh) bo.push({ tinh, k: 4 });
  for (const t of nhan.tinh) if (t !== tinh) bo.push({ tinh: t, k: 3 });
  for (const t of truong) bo.push({ maTruong: t, k: 3 });
  bo.push({ k: 4 });
  return bo;
}

async function layManhCongDong(env: EnvAI, y: YeuCauTuVan): Promise<{ manh: MangChiMuc[]; diemToanKho: number[] }> {
  const bo = boLocRag(y);
  const kq = (await truyVanNhieuBoLoc(env, cauTruyVanRag(y), bo)) ?? [];
  const thay = new Map<string, MangChiMuc>();
  const toanKho = kq[bo.length - 1] ?? [];
  kq.forEach((r, i) => {
    for (const m of r ?? []) {
      if (i === bo.length - 1 && m.diem < NGUONG_TOAN_KHO) continue;
      if (m.id && m.noiDung && !thay.has(m.id)) thay.set(m.id, m);
    }
  });
  return { manh: [...thay.values()].sort((a, b) => b.diem - a.diem).slice(0, MAX_MANH), diemToanKho: toanKho.map((m) => Math.round(m.diem * 100) / 100) };
}

function phanMoRong(manh: MangChiMuc[], viec?: HanhDong): string {
  const cd = manh.filter((m) => !m.chinhThuc), ct = manh.filter((m) => m.chinhThuc);
  const dong = (m: MangChiMuc) => `[${m.id}] ${m.noiDung}`;
  return [
    viec ? `\n\nTÍN HIỆU THỨ HAI (không đổi nhãn, chỉ để em gợi ý): việc nên làm tiếp là "${HANH_DONG[viec]}".` : "",
    ct.length ? `\n\nTƯ LIỆU CHÍNH THỨC BỔ SUNG (mỗi dòng có id để trích nguồn):\n${ct.map(dong).join("\n")}` : "",
    cd.length ? `\n\nGHI CHÚ CỘNG ĐỒNG (chưa chính thức, mỗi dòng có id; khi dùng phải nói rõ là ý kiến cộng đồng chưa kiểm chứng và trích [nguồn: id]):\n${cd.map(dong).join("\n")}` : "",
  ].join("");
}

export async function traLoiBacThang(env: EnvBacThang, y: YeuCauTuVan, f: typeof fetch = fetch): Promise<KhoiBacThang> {
  const kv = env.CACHE_KV ?? env.RATE_KV;
  const khoa = await khoaCache(y.cauHoi, y.duLieu, y.hoSo, env.DATA_VERSION, y.nguCanh).catch(() => "");
  const trung = khoa ? await docCache(kv, khoa) : null;
  if (trung) {
    console.log(JSON.stringify({ tang: "cache", msClef: 0, msLLM: 0, soSuKien: y.duLieu.length, tokenVaoUocTinh: 0 }));
    return { ok: true, kq: { ...trung, tang: "cache" } };
  }

  // Bậc 2 và 3 chạy song song; mỗi bậc lỗi thì giữ nguyên dữ liệu của client.
  const ungVien = dungUngVien(y);
  const t0 = Date.now();
  const clefP = env.AI && ungVien.length >= 2
    ? quyetDinhNguyenVong(env.AI, { totalScore: y.hoSo?.toHopCaoNhat?.tong, budgetMillion: y.hoSo?.nganSachToiDaTrieu ?? undefined, province: y.hoSo?.tinh, interests: y.hoSo?.nganhQuanTam, grade: y.hoSo?.lop ?? undefined }, ungVien, { hanMs: NGAN_SACH.clef })
        .then((r) => ({ r, ms: Date.now() - t0 })).catch(() => ({ r: null, ms: Date.now() - t0 }))
    : Promise.resolve({ r: null, ms: 0 });
  const ragP = sau(layManhCongDong(env, y).catch(() => ({ manh: [] as MangChiMuc[], diemToanKho: [] as number[] })), NGAN_SACH.rag, { manh: [] as MangChiMuc[], diemToanKho: [] as number[] }).then((r) => ({ ...r, ms: Date.now() - t0 }));
  const [{ r: qd, ms: msClef }, { manh, diemToanKho, ms: msRag }] = await Promise.all([clefP, ragP]);
  const viec = qd?.hanhDong?.chon;
  const y2: YeuCauTuVan = qd ? { ...y, duLieu: catSuKien(y.duLieu, qd.uuTienLLM) } : y;

  if (!coKhoaLLM(env)) {
    console.log(JSON.stringify({ tang: "khong-llm", msClef, msLLM: 0, soSuKien: y2.duLieu.length, tokenVaoUocTinh: 0 }));
    return { ok: false, loi: "chua-cau-hinh", goiY: viec ? { nextAction: viec, viecTiep: VIEC_TIEP[viec] } : undefined };
  }

  const noiDung = dungNoiDung(y2) + phanMoRong(manh, viec);
  const t1 = Date.now();
  const conLai = Math.max(NGAN_SACH.llmToiThieu, NGAN_SACH.tong - (t1 - t0));
  const tho = await goiMoHinh(env, noiDung, f, conLai);
  const msLLM = Date.now() - t1;
  if (!tho) throw new Error("rong");
  const cho = [...y2.duLieu.map((d) => d.id), ...manh.map((m) => m.id)];
  const { traLoi, nguon } = locNguon(tho, cho);
  const congDong = nguon.filter((id) => manh.some((m) => m.id === id && !m.chinhThuc));
  const kq: KetQuaBacThang = { traLoi, nguon, tang: "llm", ...(congDong.length ? { congDong } : {}), ...(viec ? { viecTiep: VIEC_TIEP[viec] } : {}) };
  // Không cache khi kho vector có mà RAG trả rỗng: có thể do chưa lập chỉ mục xong hoặc lỗi tạm, cache sẽ giữ câu "chưa có dữ liệu" sai trong 6 giờ.
  const phuThuocRag = !!(env.AI && env.VECTORIZE);
  if (khoa && (!phuThuocRag || nguon.length > 0 || manh.length > 0)) await ghiCache(kv, khoa, { traLoi, nguon, congDong: kq.congDong, viecTiep: kq.viecTiep });
  console.log(JSON.stringify({ tang: "llm", ai: !!env.AI, vec: !!env.VECTORIZE, uv: ungVien.length, clef: !!qd, nCm: manh.length, msClef, msRag, msLLM, msTong: Date.now() - t0, dRag: diemToanKho, soSuKien: y2.duLieu.length, tokenVaoUocTinh: Math.ceil(noiDung.length / 3) }));
  return { ok: true, kq };
}

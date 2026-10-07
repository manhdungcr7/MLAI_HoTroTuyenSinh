// Tư vấn AI có căn cứ. Dùng chung cho trình duyệt (dựng yêu cầu) và máy chủ (kiểm tra, dựng lời nhắc). TypeScript thuần.
// Nguyên tắc: AI chỉ được dùng số liệu mà app gửi kèm (dữ liệu thật có nguồn), không tự nhớ điểm chuẩn từ trí nhớ.

export interface SuKien {
  id: string; // mã chương trình trong app, để gắn nguồn
  nganh: string;
  truong: string;
  tenTruong: string;
  tinh: string;
  phuongThuc: string;
  toHop: string[];
  diem: Record<string, number>; // điểm chuẩn theo năm
  nhanCuaEm?: string; // Thử sức / Vừa sức / An toàn / Dự phòng, nếu đã tính được
  chenh?: number; // điểm của em trừ điểm chuẩn gần nhất
  hocPhiTrieu?: number;
  tiLeViecLam?: number;
  nguon: string; // mô tả nguồn: "Đề án 2024, trang 3" hoặc "Trang tổng hợp, chưa đối chiếu"
}

export interface HoSoTomTat { // không có tên, không có thông tin liên hệ
  lop?: number | null;
  tinh?: string;
  nganhQuanTam?: string[];
  nganSachToiDaTrieu?: number | null;
  khuVuc?: string[];
  toHopCaoNhat?: { ma: string; tong: number } | null;
}

export interface YeuCauTuVan { cauHoi: string; nguCanh?: string; hoSo?: HoSoTomTat | null; duLieu: SuKien[] }
export interface TraLoiTuVan { traLoi: string; nguon: string[] }

export const GIOI_HAN = { cauHoi: 1000, suKien: 12, kichThuocBody: 16_000, yeuCauMoiPhutMoiIp: 8 };

const chuoi = (x: unknown, n: number) => String(x ?? "").slice(0, n);

const so = (x: unknown, lo: number, hi: number) => (typeof x === "number" && Number.isFinite(x) && x >= lo && x <= hi ? x : undefined);
const dsChuoi = (x: unknown, soMuc: number, dai: number) => (Array.isArray(x) ? x.filter((t): t is string => typeof t === "string").slice(0, soMuc).map((t) => t.slice(0, dai)) : undefined);

/** Chỉ giữ các trường đã biết của hồ sơ, đúng kiểu, cắt độ dài. Mọi trường lạ (kể cả tên, liên hệ) bị bỏ. */
export function lamSachHoSo(x: unknown): HoSoTomTat | null {
  if (!x || typeof x !== "object" || Array.isArray(x)) return null;
  const o = x as Record<string, unknown>;
  const r: HoSoTomTat = {};
  const lop = so(o.lop, 1, 12); if (lop !== undefined) r.lop = Math.round(lop);
  if (typeof o.tinh === "string") r.tinh = o.tinh.slice(0, 40);
  const nq = dsChuoi(o.nganhQuanTam, 8, 60); if (nq) r.nganhQuanTam = nq;
  const ns = so(o.nganSachToiDaTrieu, 0, 10_000); if (ns !== undefined) r.nganSachToiDaTrieu = ns;
  const kv = dsChuoi(o.khuVuc, 8, 30); if (kv) r.khuVuc = kv;
  const th = o.toHopCaoNhat;
  if (th && typeof th === "object") {
    const t = th as Record<string, unknown>; const tong = so(t.tong, 0, 30);
    if (typeof t.ma === "string" && tong !== undefined) r.toHopCaoNhat = { ma: t.ma.slice(0, 6), tong };
  }
  return r;
}

/** Khóa đếm tần suất: theo IP và theo phút. */
export const khoaTanSuat = (ip: string, nowMs: number) => `tv:${ip.slice(0, 64)}:${Math.floor(nowMs / 60_000)}`;

export interface KhoKV { get(k: string): Promise<string | null>; put(k: string, v: string, o?: { expirationTtl?: number }): Promise<void> }
/** true nếu còn được gọi. Đếm không nguyên tử (KV), đủ để chặn lạm dụng thô; chặn chặt hơn cần Cloudflare WAF rate limiting. */
export async function choPhepTanSuat(kv: KhoKV, ip: string, nowMs: number, toiDa = GIOI_HAN.yeuCauMoiPhutMoiIp): Promise<boolean> {
  const k = khoaTanSuat(ip, nowMs);
  const dem = Number(await kv.get(k)) || 0;
  if (dem >= toiDa) return false;
  await kv.put(k, String(dem + 1), { expirationTtl: 120 });
  return true;
}

export function kiemTraYeuCau(x: unknown): { ok: true; v: YeuCauTuVan } | { ok: false; loi: string } {
  if (!x || typeof x !== "object") return { ok: false, loi: "Yêu cầu không hợp lệ" };
  const o = x as Record<string, unknown>;
  const cauHoi = typeof o.cauHoi === "string" ? o.cauHoi.trim() : "";
  if (cauHoi.length < 3) return { ok: false, loi: "Em viết rõ hơn câu hỏi nhé" };
  if (cauHoi.length > GIOI_HAN.cauHoi) return { ok: false, loi: "Câu hỏi quá dài" };
  const duLieu = Array.isArray(o.duLieu) ? o.duLieu.slice(0, GIOI_HAN.suKien) : [];
  const sach: SuKien[] = [];
  for (const d of duLieu) {
    if (!d || typeof d !== "object") continue;
    const r = d as Record<string, unknown>;
    if (typeof r.id !== "string" || typeof r.nganh !== "string" || typeof r.truong !== "string") continue;
    const diem: Record<string, number> = {};
    if (r.diem && typeof r.diem === "object") {
      for (const [n, v] of Object.entries(r.diem as Record<string, unknown>)) if (typeof v === "number" && v > 0 && v <= 30) diem[chuoi(n, 4)] = v;
    }
    sach.push({
      id: chuoi(r.id, 40), nganh: chuoi(r.nganh, 120), truong: chuoi(r.truong, 12), tenTruong: chuoi(r.tenTruong, 120), tinh: chuoi(r.tinh, 40),
      phuongThuc: chuoi(r.phuongThuc, 20),
      toHop: Array.isArray(r.toHop) ? r.toHop.filter((t): t is string => typeof t === "string").slice(0, 12).map((t) => t.slice(0, 6)) : [],
      diem,
      nhanCuaEm: typeof r.nhanCuaEm === "string" ? r.nhanCuaEm.slice(0, 12) : undefined,
      chenh: typeof r.chenh === "number" ? r.chenh : undefined,
      hocPhiTrieu: typeof r.hocPhiTrieu === "number" ? r.hocPhiTrieu : undefined,
      tiLeViecLam: typeof r.tiLeViecLam === "number" ? r.tiLeViecLam : undefined,
      nguon: chuoi(r.nguon, 120),
    });
  }
  const hoSo = lamSachHoSo(o.hoSo);
  return { ok: true, v: { cauHoi, nguCanh: typeof o.nguCanh === "string" ? o.nguCanh.slice(0, 80) : undefined, hoSo, duLieu: sach } };
}

export const NHAC_HE_THONG = [
  'Em là trợ lý tư vấn chọn ngành, chọn trường cho học sinh THPT Việt Nam, trong ứng dụng "Nguyện Vọng AI". Luôn xưng "mình", gọi học sinh là "em", viết tiếng Việt thuần, câu ngắn, dễ hiểu.',
  "QUY TẮC BẮT BUỘC:",
  "1. Chỉ được dùng số liệu trong phần DỮ LIỆU và HỒ SƠ bên dưới. Tuyệt đối không tự nêu điểm chuẩn, học phí, chỉ tiêu, tỷ lệ việc làm từ trí nhớ. Thiếu dữ liệu thì nói rõ \"mình chưa có dữ liệu này\" và chỉ em cách tự kiểm tra (đề án của trường).",
  "2. Mỗi số liệu nêu ra phải kèm tên ngành, trường và năm. Cuối câu trả lời liệt kê mã nguồn đã dùng theo dạng [nguồn: id1, id2].",
  '3. Không nói "khả năng đậu x%". Dùng các nhãn Thử sức, Vừa sức, An toàn, Dự phòng và giải thích vì sao (điểm của em hơn hay kém điểm chuẩn bao nhiêu).',
  "4. Điểm chuẩn là của các năm trước, năm nay có thể khác: nhắc điều này khi so điểm.",
  "5. Không quyết định thay em. Nêu lợi ích, giới hạn và đánh đổi (điểm, học phí, nơi học, ngành nghề) rồi để em chọn.",
  "6. Nếu câu hỏi ngoài việc chọn ngành, chọn trường, ôn thi, lập kế hoạch thì từ chối nhẹ nhàng.",
  "7. Trả lời tối đa khoảng 180 từ.",
].join("\n");

export function dungNoiDung(y: YeuCauTuVan): string {
  const hs = y.hoSo ? JSON.stringify(y.hoSo) : "(em không chia sẻ hồ sơ)";
  const dl = y.duLieu.length ? y.duLieu.map((d) => JSON.stringify(d)).join("\n") : "(không có ngành nào khớp câu hỏi trong dữ liệu)";
  return `HỒ SƠ (đã bỏ tên):\n${hs}\n\nDỮ LIỆU (mỗi dòng một ngành, có mã id):\n${dl}\n\nNGỮ CẢNH MÀN HÌNH: ${y.nguCanh ?? "Tư vấn chung"}\n\nCÂU HỎI CỦA EM:\n${y.cauHoi}`;
}

/** Giữ lại các mã nguồn có thật trong dữ liệu đã gửi; bỏ mã AI tự bịa. */
export function locNguon(traLoi: string, duocPhep: string[]): TraLoiTuVan {
  const ids = new Set<string>();
  for (const m of traLoi.matchAll(/\[nguồn:\s*([^\]]+)\]/gi)) for (const t of m[1].split(/[,;\s]+/)) if (duocPhep.includes(t)) ids.add(t);
  const sach = traLoi.replace(/\s*\[nguồn:[^\]]*\]/gi, "").trim();
  return { traLoi: sach, nguon: [...ids] };
}

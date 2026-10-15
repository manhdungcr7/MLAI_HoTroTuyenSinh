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
  tongCuaEm?: number; // tổng điểm của em theo tổ hợp của CHÍNH chương trình này
  toHopDaTinh?: string; // tổ hợp đã dùng để tính tongCuaEm
  hocPhiTrieu?: number;
  hocPhiMaxTrieu?: number;
  /** Học phí là ước tính theo khối ngành, chưa có văn bản của trường: AI phải nói "ước tính". */
  hocPhiUocTinh?: boolean;
  tiLeViecLam?: number;
  /** Khoảng điểm chuẩn dự kiến của năm tới (suy từ biến động các năm trước, KHÔNG phải xác suất đậu). */
  duBao?: { nam: number; thap: number; cao: number };
  nguon: string; // mô tả nguồn: "Đề án 2024, trang 3" hoặc "Trang tổng hợp, chưa đối chiếu"
}

export interface HoSoTomTat { // không có tên, không có thông tin liên hệ
  lop?: number | null;
  tinh?: string;
  nganhQuanTam?: string[];
  nganSachToiDaTrieu?: number | null;
  khuVuc?: string[];
  toHopCaoNhat?: { ma: string; tong: number } | null;
  chungChiNgoaiNgu?: string | null;
  diemDgnl?: string | null;
  hocBa?: string | null;
  giaiThuongHsg?: string | null;
}

export interface YeuCauTuVan { cauHoi: string; nguCanh?: string; hoSo?: HoSoTomTat | null; duLieu: SuKien[] }
export interface TraLoiTuVan extends PhanHoiCauTruc {
  traLoi: string;
  nguon: string[];
  tang?: "cache" | "llm"; // bậc server đã trả lời
  congDong?: string[]; // id ghi chú cộng đồng (chưa chính thức) đã được trích
  viecTiep?: string; // "Việc nên làm tiếp" từ tín hiệu quyết định
}

function lamSachDuBao(x: unknown): SuKien["duBao"] {
  if (!x || typeof x !== "object") return undefined;
  const o = x as Record<string, unknown>;
  const thap = so(o.thap, 10, 30), cao = so(o.cao, 10, 30), nam = so(o.nam, 2020, 2100);
  return thap !== undefined && cao !== undefined && nam !== undefined && thap <= cao ? { nam: Math.round(nam), thap, cao } : undefined;
}

export const GIOI_HAN = { cauHoi: 1000, nguCanh: 700, suKien: 12, kichThuocBody: 16_000, yeuCauMoiPhutMoiIp: 8 };

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
  if (typeof o.chungChiNgoaiNgu === "string") r.chungChiNgoaiNgu = o.chungChiNgoaiNgu.slice(0, 30);
  if (typeof o.diemDgnl === "string") r.diemDgnl = o.diemDgnl.slice(0, 60);
  if (typeof o.hocBa === "string") r.hocBa = o.hocBa.slice(0, 30);
  if (typeof o.giaiThuongHsg === "string") r.giaiThuongHsg = o.giaiThuongHsg.slice(0, 50);
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
  if (cauHoi.length < 3) return { ok: false, loi: "Bạn viết rõ hơn câu hỏi nhé" };
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
      chenh: so(r.chenh, -30, 30),
      tongCuaEm: so(r.tongCuaEm, 0, 30),
      toHopDaTinh: typeof r.toHopDaTinh === "string" && r.toHopDaTinh.trim() ? r.toHopDaTinh.trim().slice(0, 6) : undefined,
      hocPhiTrieu: so(r.hocPhiTrieu, 0, 1000),
      hocPhiMaxTrieu: so(r.hocPhiMaxTrieu, 0, 1000),
      hocPhiUocTinh: r.hocPhiUocTinh === true ? true : undefined,
      tiLeViecLam: so(r.tiLeViecLam, 0, 100),
      duBao: lamSachDuBao(r.duBao),
      nguon: chuoi(r.nguon, 120),
    });
  }
  const hoSo = lamSachHoSo(o.hoSo);
  return { ok: true, v: { cauHoi, nguCanh: typeof o.nguCanh === "string" && o.nguCanh.trim() ? o.nguCanh.trim().slice(0, GIOI_HAN.nguCanh) : undefined, hoSo, duLieu: sach } };
}

export const NHAC_HE_THONG = [
  'Bạn là trợ lý tuyển sinh trong ứng dụng "Nguyện Vọng AI". Xưng "mình", gọi người dùng là "bạn". Giọng thân thiện, nói thẳng. Nguyên tắc: NGẮN GỌN TRƯỚC, CHI TIẾT KHI ĐƯỢC HỎI, HÀNH ĐỘNG KHI BẠN MUỐN.',
  "QUY TẮC BẮT BUỘC:",
  '1. Độ dài: mặc định 2 đến 4 câu, tối đa 120 từ, câu đầu trả thẳng vào câu hỏi. Không mở bài, không nhắc lại câu hỏi, không tiêu đề, không gạch đầu dòng dài. Chỉ viết dài hơn khi bạn nhờ giải thích, so sánh hoặc nói "chi tiết".',
  "2. Ba cấp, chỉ lên cấp khi được hỏi: cấp 1 trả lời ngắn kèm đúng một gợi ý bước tiếp; cấp 2 (khi hỏi vì sao, so sánh, chi tiết) giải thích thêm số liệu và đánh đổi; cấp 3 (khi bạn muốn làm gì đó) đưa hành động vào trường hanhDong.",
  '3. Tối đa 3 kết quả mỗi lần. Còn nhiều hơn thì nói "còn vài lựa chọn khác, bạn muốn xem tiếp không?". Lần đầu nhắc trường phải dùng tên đầy đủ (trường tenTruong); mã trường chỉ là metadata, đừng viết mã trần trong câu trả lời.',
  '4. Chỉ được dùng số liệu trong phần DỮ LIỆU và HỒ SƠ (và các mục có id trong TƯ LIỆU hoặc GHI CHÚ CỘNG ĐỒNG nếu có). Tuyệt đối không tự nêu điểm chuẩn, học phí, chỉ tiêu, việc làm từ trí nhớ. Thiếu dữ liệu thì nói "mình chưa có dữ liệu này" và chỉ bạn tự kiểm tra đề án của trường; không điền thay, không đoán. Có hocPhiTrieu (và hocPhiMaxTrieu) thì nêu theo năm; mục có hocPhiUocTinh thì PHẢI nói "khoảng … (ước tính, chưa có văn bản của trường)".',
  "5. Mỗi số liệu kèm tên ngành, trường, năm. Cuối câu liệt kê nguồn dạng [nguồn: id1, id2]. Ghi chú cộng đồng là chưa chính thức: phải nói rõ như vậy.",
  "6. Điểm chuẩn là của các năm trước. Không dự báo, không nói khả năng đậu x% khi bạn chưa hỏi. Chỉ khi được hỏi mới nêu duBao (khoảng điểm dự kiến, nêu cả hai đầu, không phải xác suất). Điểm chuẩn năm tuyển sinh hiện hành chưa có chính thức: nêu điểm các năm trước. Dùng nhãn Thử sức, Vừa sức, An toàn, Dự phòng kèm chênh điểm.",
  "7. Thuật ngữ khó (tổ hợp, điểm chuẩn, học bạ, ĐGNL...) giải thích bằng 3 đến 5 chữ ngay lần đầu. Chỉ nhắc chứng chỉ ngoại ngữ, ĐGNL, lớp học khi câu hỏi hoặc ngành đó thực sự liên quan; không cá thể hóa cho có.",
  "8. Điểm của bạn ở MỘT ngành: dùng tongCuaEm (tổng theo tổ hợp toHopDaTinh của chính ngành đó) và chenh của ngành đó. hoSo.toHopCaoNhat chỉ là tổ hợp cao nhất của cả hồ sơ, KHÔNG dùng làm điểm của một ngành cụ thể.",
  '9. Không mô tả phạm vi dữ liệu của app (đừng nói "dữ liệu chỉ có trường X"). Chỉ nói về những gì có trong DỮ LIỆU và TƯ LIỆU được đưa. Nếu câu hỏi nêu trường/ngành khác DỮ LIỆU nhưng có trong TƯ LIỆU thì dùng TƯ LIỆU.',
  '10. Nếu NGỮ CẢNH có dòng bắt đầu bằng "NV1:", lấy NV1 làm gốc: nói thẳng khoảng cách điểm tới NV1 và mỗi môn cần thêm bao nhiêu (đúng các số trong dòng đó, không tự tính thêm).',
  "11. Câu hỏi mơ hồ (không rõ ngành, trường hay điểm nào) mà hồ sơ và DỮ LIỆU không đủ để trả: hỏi lại đúng MỘT câu ngắn vào trường hoiLai, không trả lời suông. Không hỏi lại điều đã có trong HỒ SƠ. Không quyết định thay bạn; ngoài chọn ngành, chọn trường, ôn thi, lập kế hoạch thì từ chối nhẹ nhàng.",
  "ĐỊNH DẠNG TRẢ LỜI: chỉ một đối tượng JSON, không văn bản ngoài, không khối mã:",
  '{"intent":"tra-cuu|so-sanh|goi-y|giai-thich|lam-ro|ngoai-pham-vi","traLoi":"văn bản theo các quy tắc trên, có [nguồn: ...]","thucThe":[{"loai":"truong|nganh","maTruong":"...","idChuongTrinh":"..."}],"hanhDong":[{"loai":"xem-truong|xem-nganh|xem-diem-chuan|so-sanh|them-nguyen-vong","maTruong":"...","idChuongTrinh":"...","ids":["..."],"nhan":"2 đến 4 chữ"}],"hoiLai":"một câu hỏi (tùy chọn)","trangThaiDuLieu":"da-xac-minh|lich-su|uoc-tinh|du-bao|chua-co"}',
  "Chỉ traLoi là bắt buộc. maTruong lấy từ trường truong, idChuongTrinh lấy từ id trong DỮ LIỆU, tuyệt đối không bịa mã. hanhDong tối đa 3, so-sanh dùng ids (2 đến 3 id). them-nguyen-vong chỉ là đề xuất, bạn sẽ xác nhận trong app. trangThaiDuLieu: da-xac-minh (điểm đề án chính thức), lich-su (điểm các năm trước), uoc-tinh (suy ra), du-bao (khoảng dự kiến), chua-co (thiếu dữ liệu).",
].join("\n");

/** Phần mới của hợp đồng phản hồi cấu trúc (mọi trường đều tùy chọn để tương thích client cũ). */
export const Y_DINH = ["tra-cuu", "so-sanh", "goi-y", "giai-thich", "lam-ro", "ngoai-pham-vi"] as const;
export const LOAI_HANH_DONG = ["xem-truong", "xem-nganh", "xem-diem-chuan", "so-sanh", "them-nguyen-vong"] as const;
export const TRANG_THAI_DU_LIEU = ["da-xac-minh", "lich-su", "uoc-tinh", "du-bao", "chua-co"] as const;
export type YDinh = (typeof Y_DINH)[number];
export type LoaiHanhDong = (typeof LOAI_HANH_DONG)[number];
export type TrangThaiDuLieu = (typeof TRANG_THAI_DU_LIEU)[number];
export interface ThucThe { loai: "truong" | "nganh"; maTruong: string; idChuongTrinh?: string }
export interface HanhDongDeXuat {
  loai: LoaiHanhDong;
  maTruong?: string;
  idChuongTrinh?: string;
  /** so-sanh: 2 đến 3 id chương trình. */
  ids?: string[];
  nhan: string;
  /** Luôn true với them-nguyen-vong: chỉ là đề xuất, client phải hỏi xác nhận; máy chủ không đổi dữ liệu cá nhân. */
  canXacNhan?: boolean;
}
export interface PhanHoiCauTruc {
  intent?: YDinh;
  thucThe?: ThucThe[];
  hanhDong?: HanhDongDeXuat[];
  hoiLai?: string;
  trangThaiDuLieu?: TrangThaiDuLieu;
}

const thuocDs = <T extends string>(ds: readonly T[], x: unknown): x is T => typeof x === "string" && (ds as readonly string[]).includes(x);

/** Rút đối tượng JSON đầu tiên (bỏ khối mã ``` nếu có). Không phải JSON hợp lệ thì null. */
function tachJson(tho: string): Record<string, unknown> | null {
  const t = tho.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const dau = t.indexOf("{"), cuoi = t.lastIndexOf("}");
  if (dau < 0 || cuoi <= dau) return null;
  try {
    const o = JSON.parse(t.slice(dau, cuoi + 1)) as unknown;
    return o && typeof o === "object" && !Array.isArray(o) ? (o as Record<string, unknown>) : null;
  } catch { return null; }
}

/**
 * Kiểm phần có cấu trúc theo danh sách cho phép (chỉ trường và id có trong dữ liệu client gửi). Mục sai bị bỏ từng mục;
 * mã bịa không bao giờ lọt qua. them-nguyen-vong luôn gắn canXacNhan: máy chủ không thực hiện hành động.
 */
export function kiemTraPhanHoiCauTruc(o: Record<string, unknown>, duLieu: SuKien[]): PhanHoiCauTruc {
  const truong = new Set(duLieu.map((d) => d.truong));
  const truongCua = new Map(duLieu.map((d) => [d.id, d.truong]));
  const r: PhanHoiCauTruc = {};
  if (thuocDs(Y_DINH, o.intent)) r.intent = o.intent;
  if (thuocDs(TRANG_THAI_DU_LIEU, o.trangThaiDuLieu)) r.trangThaiDuLieu = o.trangThaiDuLieu;
  if (typeof o.hoiLai === "string" && o.hoiLai.trim()) r.hoiLai = o.hoiLai.trim().slice(0, 200);
  const idOk = (x: unknown): x is string => typeof x === "string" && truongCua.has(x);
  const maOk = (x: unknown): x is string => typeof x === "string" && truong.has(x);
  if (Array.isArray(o.thucThe)) {
    const ds: ThucThe[] = [];
    for (const e of o.thucThe.slice(0, 6)) {
      if (!e || typeof e !== "object") continue;
      const t = e as Record<string, unknown>;
      if (t.loai === "truong" && maOk(t.maTruong)) ds.push({ loai: "truong", maTruong: t.maTruong });
      else if (t.loai === "nganh" && idOk(t.idChuongTrinh)) ds.push({ loai: "nganh", maTruong: truongCua.get(t.idChuongTrinh)!, idChuongTrinh: t.idChuongTrinh });
    }
    if (ds.length) r.thucThe = ds;
  }
  if (Array.isArray(o.hanhDong)) {
    const ds: HanhDongDeXuat[] = [];
    for (const e of o.hanhDong.slice(0, 8)) {
      if (ds.length >= 3) break;
      if (!e || typeof e !== "object") continue;
      const h = e as Record<string, unknown>;
      const nhan = typeof h.nhan === "string" ? h.nhan.trim().slice(0, 40) : "";
      if (!thuocDs(LOAI_HANH_DONG, h.loai) || !nhan) continue;
      if (h.loai === "xem-truong") { if (maOk(h.maTruong)) ds.push({ loai: h.loai, maTruong: h.maTruong, nhan }); }
      else if (h.loai === "so-sanh") {
        const ids = Array.isArray(h.ids) ? [...new Set(h.ids.filter(idOk))].slice(0, 3) : [];
        if (ids.length >= 2) ds.push({ loai: h.loai, ids, nhan });
      } else if (idOk(h.idChuongTrinh)) {
        ds.push({ loai: h.loai, idChuongTrinh: h.idChuongTrinh, maTruong: truongCua.get(h.idChuongTrinh)!, nhan, ...(h.loai === "them-nguyen-vong" ? { canXacNhan: true } : {}) });
      }
    }
    if (ds.length) r.hanhDong = ds;
  }
  return r;
}

/**
 * Đọc phản hồi thô của mô hình. Đúng schema (JSON có traLoi chuỗi) thì lấy thêm phần có cấu trúc đã kiểm; sai schema hoặc là văn bản thường
 * thì rơi về hành vi cũ: toàn bộ văn bản + nguồn. Không bao giờ ném lỗi.
 */
export function docPhanHoiLLM(tho: string, y: Pick<YeuCauTuVan, "duLieu">, nguonHopLe: string[]): TraLoiTuVan & PhanHoiCauTruc {
  const o = tachJson(tho);
  if (o && typeof o.traLoi === "string" && o.traLoi.trim()) {
    return { ...locNguon(o.traLoi, nguonHopLe), ...kiemTraPhanHoiCauTruc(o, y.duLieu) };
  }
  // Bị cắt giữa chừng nhưng vẫn thấy trường traLoi: lấy phần chuỗi đã đóng, tránh hiện JSON thô cho học sinh.
  if (/^\s*(```(?:json)?\s*)?\{/.test(tho)) {
    const m = tho.match(/"traLoi"\s*:\s*("(?:[^"\\]|\\.)*")/);
    if (m) { try { const s = JSON.parse(m[1]) as string; if (s.trim()) return locNguon(s, nguonHopLe); } catch { /* rơi xuống */ } }
    return { traLoi: "", nguon: [] };
  }
  return locNguon(tho, nguonHopLe);
}

/**
 * Hậu kiểm số liệu: số đứng cạnh "điểm" hoặc "triệu" (kể cả khoảng a-b) phải nằm trong tập số của dữ liệu gửi kèm, hồ sơ, ngữ cảnh
 * và tư liệu. Trả về danh sách số lệch (rỗng = qua). Cho phép làm tròn, giá trị tuyệt đối của chênh, hiệu giữa các điểm cùng ngành, và năm.
 */
export function soLieuLech(traLoi: string, y: Pick<YeuCauTuVan, "duLieu" | "hoSo" | "nguCanh">, tuLieu = ""): string[] {
  const cho: number[] = [10, 30];
  const them = (v: number | undefined) => { if (typeof v === "number" && Number.isFinite(v)) cho.push(v, Math.abs(v)); };
  const mocSo = (s: string) => { for (const m of s.matchAll(/\d+(?:[.,]\d+)?/g)) them(Number(m[0].replace(",", "."))); };
  for (const d of y.duLieu) {
    const dsDiem = [...Object.values(d.diem), ...(d.tongCuaEm !== undefined ? [d.tongCuaEm] : [])];
    dsDiem.forEach(them);
    for (const a of dsDiem) for (const b of dsDiem) them(Math.abs(a - b));
    [d.chenh, d.hocPhiTrieu, d.hocPhiMaxTrieu, d.tiLeViecLam, d.duBao?.thap, d.duBao?.cao].forEach(them);
  }
  if (y.hoSo) mocSo(JSON.stringify(y.hoSo));
  mocSo(`${y.nguCanh ?? ""}\n${tuLieu}`);
  const hopLe = (x: number) => (x >= 1990 && x <= 2100 && Number.isInteger(x)) || cho.some((c) => Math.abs(c - x) < 0.0051 || Math.abs(Math.round(c) - x) < 1e-9 || Math.abs(Math.round(c * 10) / 10 - x) < 1e-9);
  const lech = new Set<string>();
  const kiem = (chuoiSo: string) => { for (const m of chuoiSo.matchAll(/\d+(?:[.,]\d+)?/g)) { const x = Number(m[0].replace(",", ".")); if (!hopLe(x)) lech.add(m[0]); } };
  const khoang = "\\d+(?:[.,]\\d+)?(?:\\s*(?:-|–|—|đến)\\s*\\d+(?:[.,]\\d+)?)*";
  const van = traLoi.replace(/\[ngu[oôồ]n:[^\]]*\]/gi, "");
  for (const m of van.matchAll(new RegExp(`(${khoang})\\s*(?:điểm|triệu|tr)(?![\\p{L}])`, "giu"))) kiem(m[1]);
  for (const m of van.matchAll(new RegExp(`(?:điểm chuẩn|điểm|học phí)\\s*(?:là|khoảng|:|~)?\\s*(${khoang})`, "giu"))) kiem(m[1]);
  return [...lech];
}

export function dungNoiDung(y: YeuCauTuVan): string {
  const hs = y.hoSo ? JSON.stringify(y.hoSo) : "(bạn không chia sẻ hồ sơ)";
  const dl = y.duLieu.length ? y.duLieu.map((d) => JSON.stringify(d)).join("\n") : "(không có ngành nào khớp câu hỏi trong phần dữ liệu gửi kèm)";
  return `HỒ SƠ (đã bỏ tên):\n${hs}\n\nDỮ LIỆU (mỗi dòng một ngành, có mã id; các ngành này chỉ là phần khớp câu hỏi, KHÔNG phải toàn bộ dữ liệu của app):\n${dl}\n\nNGỮ CẢNH MÀN HÌNH VÀ CÁC LƯỢT TRƯỚC (chỉ để hiểu "ngành đó", "trường này", "còn … thì sao"; KHÔNG phải nguồn số liệu, mọi con số phải lấy từ DỮ LIỆU): ${y.nguCanh ?? "Tư vấn chung"}\n\nCÂU HỎI CỦA BẠN:\n${y.cauHoi}`;
}

/** Giữ lại các mã nguồn có thật trong dữ liệu đã gửi; bỏ mã AI tự bịa. */
export function locNguon(goc: string, duocPhep: string[]): TraLoiTuVan {
  // Mô hình đôi khi viết "[nguon: id]" không dấu: nhận cả hai, và luôn gỡ thẻ khỏi câu trả lời.
  const traLoi = goc.normalize("NFC");
  const ids = new Set<string>();
  for (const m of traLoi.matchAll(/\[ngu[oôồ]n:\s*([^\]]+)\]/gi)) for (const t of m[1].split(/[,;\s]+/)) if (duocPhep.includes(t)) ids.add(t);
  const sach = traLoi.replace(/\s*\[ngu[oôồ]n:[^\]]*\]/gi, "")
    // Thẻ nguồn bị gỡ có thể để lại dòng "Nguồn:" / "*Nguồn:*" trống: bỏ luôn dòng đó.
    .replace(/^[ \t]*[*_]*\s*ngu[oôồ]n\s*:?\s*[*_]*[ \t]*$/gim, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return { traLoi: sach, nguon: [...ids] };
}

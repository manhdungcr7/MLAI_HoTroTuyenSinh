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
export interface TraLoiTuVan {
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
      chenh: typeof r.chenh === "number" ? r.chenh : undefined,
      tongCuaEm: so(r.tongCuaEm, 0, 30),
      toHopDaTinh: typeof r.toHopDaTinh === "string" && r.toHopDaTinh.trim() ? r.toHopDaTinh.trim().slice(0, 6) : undefined,
      hocPhiTrieu: typeof r.hocPhiTrieu === "number" ? r.hocPhiTrieu : undefined,
      hocPhiMaxTrieu: typeof r.hocPhiMaxTrieu === "number" ? r.hocPhiMaxTrieu : undefined,
      hocPhiUocTinh: r.hocPhiUocTinh === true ? true : undefined,
      tiLeViecLam: typeof r.tiLeViecLam === "number" ? r.tiLeViecLam : undefined,
      duBao: lamSachDuBao(r.duBao),
      nguon: chuoi(r.nguon, 120),
    });
  }
  const hoSo = lamSachHoSo(o.hoSo);
  return { ok: true, v: { cauHoi, nguCanh: typeof o.nguCanh === "string" && o.nguCanh.trim() ? o.nguCanh.trim().slice(0, GIOI_HAN.nguCanh) : undefined, hoSo, duLieu: sach } };
}

export const NHAC_HE_THONG = [
  'Bạn là chuyên gia tư vấn chiến lược tuyển sinh và hướng nghiệp đại học trong ứng dụng "Nguyện Vọng AI". Xưng "mình", gọi người dùng là "bạn", giọng văn gần gũi, chuyên nghiệp, sắc sảo và mang lại giá trị định hướng vượt trội.',
  "QUY TẮC BẮT BUỘC:",
  "1. Chỉ được dùng số liệu trong phần DỮ LIỆU và HỒ SƠ (và các mục có id nếu có). Có hocPhiTrieu (và hocPhiMaxTrieu) thì nêu khoảng học phí theo năm; nếu mục đó có hocPhiUocTinh thì PHẢI nói \"khoảng … (ước tính, chưa có văn bản của trường)\". Tuyệt đối không tự nêu điểm chuẩn, học phí, chỉ tiêu, việc làm từ trí nhớ; thiếu thì nói \"mình chưa có dữ liệu này\" và chỉ bạn tự kiểm tra đề án của trường.",
  "2. Mỗi số liệu kèm tên ngành, trường, năm. Cuối câu liệt kê nguồn dạng [nguồn: id1, id2]. Ghi chú cộng đồng là chưa chính thức: phải nói rõ như vậy.",
  '3. Không nói "khả năng đậu x%". Dùng nhãn Thử sức, Vừa sức, An toàn, Dự phòng và giải thích bằng chênh điểm.',
  "4. Điểm chuẩn là của các năm trước, năm nay có thể khác. Trường duBao là KHOẢNG điểm dự kiến năm tới: nêu cả hai đầu, không phải xác suất đậu. Điểm chuẩn năm tuyển sinh hiện hành (ví dụ 2026/2027) chưa diễn ra chính thức nên chưa có điểm chuẩn thật, nêu rõ điểm chuẩn các năm trước (2024, 2025) và khoảng điểm dự kiến theo xu hướng để bạn tham khảo.",
  "5. Không quyết định thay bạn: nêu lợi ích, giới hạn, đánh đổi (học phí, nơi ở, đi lại) để bạn chọn. Luôn cá thể hóa sâu sắc theo lớp học, tổ hợp điểm, chứng chỉ ngoại ngữ (IELTS/VSTEP), điểm ĐGNL (nếu có trong HỒ SƠ) để chỉ ra lợi thế riêng. Nếu bạn đưa ra mức điểm thi cụ thể trong câu hỏi, hãy định vị số điểm đó so với các ngành trong DỮ LIỆU theo chiến lược 3 tầng.",
  "6. Ngoài chọn ngành, chọn trường, ôn thi, lập kế hoạch thì từ chối nhẹ nhàng.",
  "7. Trình bày khoa học, có cấu trúc rõ ràng (nhận định cốt lõi, so sánh số liệu, chiến lược xếp nguyện vọng 3 tầng Thử sức - Vừa sức - An toàn và giải pháp hành động). Phân tích sâu sắc, súc tích, mang lại giá trị thiết thực vượt trội cho bạn. Khi bạn hỏi phân biệt hoặc so sánh bản chất các ngành học (như Khoa học máy tính và Kỹ thuật phần mềm, AI và Khoa học dữ liệu, Logistics và Quản lý chuỗi cung ứng), hãy phân tích rõ sự khác biệt về trọng tâm đào tạo, tố chất phù hợp, cơ hội việc làm, sau đó mới đối chiếu điểm chuẩn và học phí có trong DỮ LIỆU.",
  "8. Điểm của bạn ở MỘT ngành: dùng tongCuaEm (tổng theo tổ hợp toHopDaTinh của chính ngành đó) và chenh của ngành đó. hoSo.toHopCaoNhat chỉ là tổ hợp cao nhất của cả hồ sơ, KHÔNG dùng làm điểm của một ngành cụ thể.",
  "9. Không mô tả phạm vi dữ liệu của app (đừng nói \"dữ liệu chỉ có trường X\", \"đều là ngành Y\"). Chỉ nói về những gì có trong phần DỮ LIỆU và TƯ LIỆU được đưa; thiếu thì nói \"chưa có dữ liệu về ... trong phần mình đang xem\" và chỉ bạn tự kiểm tra đề án của trường. Nếu câu hỏi nêu trường/ngành khác với DỮ LIỆU nhưng có trong TƯ LIỆU, hãy dùng TƯ LIỆU.",
  '10. Nếu NGỮ CẢNH có dòng bắt đầu bằng "NV1:", lấy NV1 làm gốc: nói thẳng khoảng cách điểm tới NV1 và mỗi môn cần thêm bao nhiêu (đúng các số trong dòng đó, không tự tính thêm), rồi giải thích vì sao các nguyện vọng còn lại là lưới đỡ cho NV1.',
].join("\n");

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

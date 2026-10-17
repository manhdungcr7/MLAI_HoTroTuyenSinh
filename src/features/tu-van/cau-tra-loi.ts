// Lấy câu trả lời cho một câu hỏi: dùng chung cho màn Tư vấn và trợ lý nổi (không nhân đôi logic). TypeScript thuần, không React.
// Câu hỏi có ý định rõ (thêm nguyện vọng, trường nào, so sánh trường, xếp hạng học phí, cơ hội đỗ) trả lời ngay từ dữ liệu thật,
// vì tra cứu và hành động cần đúng mã, không cần mô hình ngôn ngữ. Câu mở còn lại hỏi dịch vụ AI; không được thì tự trả lời.
import type { NguonTaiSau } from "@/data/lua-chon-that";
import { tim } from "@/data/lua-chon-mau";
import { coTruong } from "@/engine/truong";
import { GIOI_HAN, type TraLoiTuVan, type YeuCauTuVan } from "@/engine/tu-van";
import { phanTichMoNeo, tomTatMoNeoChoAI } from "@/features/nguyen-vong/mo-neo";
import { HO_SO_TRONG } from "@/state/mau";
import type { AppState } from "@/state/store";
import { phanTichCau, timTruongMoHo } from "./hieu-cau";
import { lamSachHanhDong, lamSachThe, nganhLuotTruoc, taoNguCanh, type TheTruong, type TinNhan } from "./hoi-thoai";
import { CHE_DO_MAC_DINH, idHoSoAI, uuidMoi, type Luot, type PhienAI } from "./che-do-ai";
import { bocLoiChao, nhanYDinhQuyTac, traLoiQuyTac } from "./y-dinh";
import { traLoiTienDoChat } from "./tien-do-chat";
import { chonDuLieuKemTheo, nguCanhLuotTruoc, tomTatHoSo, traLoiTuDong, type KetQuaTuDong } from "./lay-du-lieu";
import { dungBangSoSanh, tomTatChoAI } from "./bang-so-sanh";
import { diemDayDu } from "@/features/kham-pha/to-hop";

/** Dòng NV1 (nếu có) đứng đầu ngữ cảnh để AI lấy NV1 làm gốc; phần lượt trước bị cắt bớt cho vừa giới hạn. */
export function nguCanhVoiNV1(manHinh: string, truoc: TinNhan[], s: AppState): string {
  const nv1 = tomTatMoNeoChoAI(phanTichMoNeo(s));
  if (!nv1) return taoNguCanh(manHinh, truoc);
  return `${nv1}\n${taoNguCanh(manHinh, truoc, Math.max(60, GIOI_HAN.nguCanh - nv1.length - 1))}`.slice(0, GIOI_HAN.nguCanh);
}

/** Máy chủ có ngân sách tối đa 12 giây cho một lượt; cộng thời gian mạng, nên chờ 25 giây rồi mới tự trả lời từ số liệu có sẵn. */
const CHO_TOI_DA_MS = 25_000;
export type LoiAI = "chua-cau-hinh" | "mang" | "het-luot";

const laLuot = (x: unknown): x is Luot => !!x && typeof x === "object" && Number.isInteger((x as Luot).con) && Number.isInteger((x as Luot).toiDa) && (x as Luot).toiDa > 0 && (x as Luot).con >= 0;

/** Gọi dịch vụ AI (chỉ khi chế độ AI và còn lượt). kq=null khi không gọi được: khi đó app tự trả lời từ số liệu có sẵn (loi nói vì sao).
 *  Gửi kèm mã hồ sơ ẩn danh và mã yêu cầu để máy chủ đếm lượt đúng một lần; số lượt máy chủ báo được ghi lại qua phien.ghiLuot. */
export async function hoiAI(y: YeuCauTuVan, phien: PhienAI): Promise<{ kq: TraLoiTuVan | null; viecTiep?: string; loi?: LoiAI }> {
  try {
    const goi = phien.fetch ?? fetch;
    const r = await goi("/api/tu-van", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...y, hoSoId: phien.idHoSo, requestId: uuidMoi() }), signal: AbortSignal.timeout(CHO_TOI_DA_MS) });
    const d = (await r.json().catch(() => ({}))) as Partial<TraLoiTuVan> & { goiY?: { viecTiep?: string }; loi?: string };
    if (laLuot(d.luot)) phien.ghiLuot?.(d.luot);
    if (!r.ok) {
      if (r.status === 429 && d.loi === "het-luot-ngay") {
        phien.ghiLuot?.({ con: 0, toiDa: laLuot(d.luot) ? d.luot.toiDa : phien.luot?.toiDa ?? 50 });
        return { kq: null, loi: "het-luot" };
      }
      return { kq: null, viecTiep: typeof d.goiY?.viecTiep === "string" ? d.goiY.viecTiep : undefined, loi: r.status === 503 ? "chua-cau-hinh" : "mang" };
    }
    const ds = (x: unknown) => (Array.isArray(x) ? x.filter((t): t is string => typeof t === "string") : []);
    return typeof d.traLoi === "string" && d.traLoi
      ? { kq: { ...d, traLoi: d.traLoi, nguon: ds(d.nguon), tang: d.tang, congDong: ds(d.congDong), viecTiep: typeof d.viecTiep === "string" ? d.viecTiep : undefined, nguonWeb: Array.isArray(d.nguonWeb) ? d.nguonWeb : undefined } }
      : { kq: null, loi: "mang" };
  } catch { return { kq: null, loi: "mang" }; }
}

/** Ý định có thể trả lời chắc từ dữ liệu: không cần (và không nên) nhờ mô hình ngôn ngữ đoán. */
export function traLoiNoiBo(cau: string, truoc: TinNhan[]): boolean {
  if (nguCanhLuotTruoc(truoc).cho) return true;
  if (timTruongMoHo(cau)) return true;
  // Tra số liệu phải dùng danh mục, kể cả khi không có kết quả; AI không điền số còn thiếu.
  if (/\b(diem chuan|hoc phi|to hop|du bao|ke hoach|lich hoc|nguyen vong)\b/.test(phanTichCau(cau).q)) return true;
  const k = phanTichCau(cau).kieu;
  return k !== "khac";
}

/** Thẻ trường từ phản hồi máy chủ: chỉ giữ mã có thật trong danh mục. */
function theTuMayChu(kq: TraLoiTuVan): TheTruong[] {
  const ra: TheTruong[] = [];
  for (const e of kq.thucThe ?? []) {
    if (!coTruong(e.maTruong) || ra.some((x) => x.ma === e.maTruong)) continue;
    ra.push({ ma: e.maTruong, ...(e.idChuongTrinh && tim(e.idChuongTrinh) ? { id: e.idChuongTrinh } : {}) });
  }
  return ra;
}

function tinTuDong(td: KetQuaTuDong, idDuLieu: string[], phu: Partial<TinNhan>): TinNhan {
  return {
    vai: "mayChu", chu: td.traLoi, nguon: td.nguon, cheDo: "tuDong", idDuLieu, ...phu,
    ...(td.the?.length ? { the: td.the } : {}), ...(td.hanhDong?.length ? { hanhDong: td.hanhDong } : {}),
    ...(td.hoiLai ? { hoiLai: td.hoiLai } : {}), ...(td.luaChon?.length ? { luaChon: td.luaChon } : {}),
    ...(td.trangThaiDuLieu ? { trangThaiDuLieu: td.trangThaiDuLieu } : {}), ...(td.cho ? { cho: td.cho } : {}),
    ...(td.soSanh ? { soSanh: td.soSanh } : {}),
  };
}

export interface DauVaoTraLoi { cau: string; truoc: TinNhan[]; s: AppState; nguon: NguonTaiSau | null; dungHoSo: boolean; manHinh: string; phien?: PhienAI }

/** Khi học sinh bỏ chọn kèm hồ sơ, mọi nhánh tư vấn dùng cùng một snapshot đã bỏ dữ liệu cá nhân.
 * Nhờ vậy context, event gửi AI và câu trả lời cục bộ khi AI lỗi đều không suy ra điểm, nguyện vọng hay mục tiêu riêng. */
function trangThaiKhongKemHoSo(s: AppState): AppState {
  return {
    ...s,
    hoSo: { ...HO_SO_TRONG },
    mucTieu: null,
    nguyenVong: [],
    yeuThich: [],
    soSanh: [],
    diemThi: [],
    tinhHuong: [],
    coDinh: [],
    viec: [],
    trangThaiViec: {},
    khoiHoc: [],
    lichSu: [],
    loiNhan: [],
  };
}

/** Một lượt hỏi–đáp hoàn chỉnh, trả về tin của máy để ghi vào lịch sử. */
export async function layTinTraLoi({ cau: cauGoc, truoc, s, nguon, dungHoSo, manHinh, phien: phienGoc }: DauVaoTraLoi): Promise<TinNhan> {
  const phien: PhienAI = phienGoc ?? { cheDo: CHE_DO_MAC_DINH, idHoSo: idHoSoAI(null), luot: null };
  // Ý định quy tắc (chào, cảm ơn, trợ giúp...) trả ngay, không dữ liệu, không AI.
  const quyTac = nhanYDinhQuyTac(cauGoc);
  if (quyTac) return tinTuDong(traLoiQuyTac(quyTac.y, { cheDo: phien.cheDo, luot: phien.luot }), [], {});
  // "Chào, UIT là trường gì": bỏ lời chào, xử lý phần nội dung.
  const cau = bocLoiChao(cauGoc) ?? cauGoc;
  const stateTuVan = dungHoSo ? s : trangThaiKhongKemHoSo(s);
  // Hỏi tiến độ học theo chương trình lớp 12: chạy bằng quy tắc và dữ liệu đã lấy, không qua AI, nên không thể bịa chương hay bài.
  const tienDo = traLoiTienDoChat(cau, stateTuVan);
  if (tienDo) return { vai: "mayChu", chu: tienDo.traLoi, nguon: [], cheDo: "tuDong", idDuLieu: [], ...(tienDo.luaChon?.length ? { luaChon: tienDo.luaChon } : {}), ...(tienDo.tienDo ? { tienDo: tienDo.tienDo } : {}) };
  // Lịch sử có thể đã chứa câu trả lời cá nhân hóa, nên cũng không đưa vào lúc bỏ chọn hồ sơ.
  const truocTuVan = dungHoSo ? truoc : [];
  const giu = nganhLuotTruoc(truocTuVan);
  const y: YeuCauTuVan = {
    cauHoi: cau, nguCanh: nguCanhVoiNV1(manHinh, truocTuVan, stateTuVan), hoSo: dungHoSo ? tomTatHoSo(s) : null,
    duLieu: chonDuLieuKemTheo(cau, stateTuVan, nguon, 8, giu),
  };
  const idDuLieu = y.duLieu.map((d) => d.id);
  // So sánh trường/ngành: app tính sẵn bảng từ dữ liệu thật. Ở chế độ AI, mô hình chỉ DIỄN GIẢI bảng (không tự tính số);
  // AI lỗi hoặc hết lượt thì giữ bảng và câu tóm tắt tất định.
  const tdSoSanh = traLoiTuDong(cau, stateTuVan, nguon, giu, truocTuVan);
  if (tdSoSanh.soSanh && phien.cheDo === "ai" && !(phien.luot && phien.luot.con <= 0)) {
    const ls = tdSoSanh.soSanh.ids.map((i) => tim(i)).filter((l): l is NonNullable<ReturnType<typeof tim>> => !!l);
    if (ls.length >= 2) {
      const bang = tomTatChoAI(dungBangSoSanh(ls, diemDayDu(stateTuVan)));
      const { kq: ai, viecTiep, loi } = await hoiAI({ ...y, bangSoSanh: bang }, phien);
      if (ai) {
        return {
          vai: "mayChu", chu: ai.traLoi, nguon: tdSoSanh.nguon, cheDo: "ai", tang: ai.tang, idDuLieu, soSanh: tdSoSanh.soSanh,
          ...(viecTiep ? { viecTiep } : {}), ...(ai.nguonWeb?.length ? { nguonWeb: ai.nguonWeb } : {}),
        };
      }
      void loi;
    }
  }
  if (traLoiNoiBo(cau, truocTuVan)) return tinTuDong(tdSoSanh, idDuLieu, {});
  const cauDoc = "hỏi theo kiểu tra cứu như “điểm chuẩn Khoa học máy tính UIT”";
  // Chế độ Tiết kiệm: không bao giờ gọi AI. Câu không hiểu thì nói rõ cần bật AI (không phải lỗi mạng).
  if (phien.cheDo === "tietKiem") {
    const td = traLoiTuDong(cau, stateTuVan, nguon, giu, truocTuVan);
    if (!td.khongHieu) return tinTuDong(td, idDuLieu, {});
    return { vai: "mayChu", chu: `Câu này cần AI diễn giải, mà bạn đang ở chế độ Tiết kiệm. Bạn bật chế độ AI để mình trả lời, hoặc ${cauDoc}.`, nguon: [], cheDo: "tuDong", idDuLieu, batAI: true };
  }
  const hetLuotSan = !!phien.luot && phien.luot.con <= 0;
  const { kq: ai, viecTiep, loi } = hetLuotSan ? { kq: null, viecTiep: undefined, loi: "het-luot" as LoiAI } : await hoiAI(y, phien);
  if (ai) {
    const the = lamSachThe(theTuMayChu(ai));
    const hanhDong = lamSachHanhDong(ai.hanhDong).filter((h) => (h.maTruong ? coTruong(h.maTruong) : true) && (h.idChuongTrinh ? !!tim(h.idChuongTrinh) : true) && (h.ids ? h.ids.every((i) => !!tim(i)) : true));
    return {
      vai: "mayChu", chu: ai.traLoi, nguon: ai.nguon, cheDo: "ai", tang: ai.tang, congDong: ai.congDong, viecTiep: ai.viecTiep, idDuLieu,
      ...(the.length ? { the } : {}), ...(hanhDong.length ? { hanhDong } : {}),
      ...(ai.hoiLai ? { hoiLai: ai.hoiLai } : {}), ...(ai.trangThaiDuLieu ? { trangThaiDuLieu: ai.trangThaiDuLieu } : {}),
    };
  }
  const td = traLoiTuDong(cau, stateTuVan, nguon, giu, truocTuVan);
  // Hết lượt trong ngày: không phải lỗi, tự trả lời từ số liệu có sẵn kèm một dòng thông báo.
  if (loi === "het-luot") {
    const toiDa = phien.luot?.toiDa ?? 50;
    const ghiChu = `Hôm nay đã dùng hết ${toiDa} lượt AI`;
    if (td.khongHieu) return { vai: "mayChu", chu: `Câu này cần AI diễn giải, mà hôm nay đã dùng hết ${toiDa} lượt AI (đặt lại lúc 0 giờ). Bạn ${cauDoc}.`, nguon: [], cheDo: "tuDong", idDuLieu, ghiChu };
    return tinTuDong(td, idDuLieu, { ghiChu });
  }
  // Không hiểu câu mà AI cũng không phản hồi: nói đúng nguyên nhân thay vì hiện "chưa hiểu" như thể lỗi ở người dùng.
  if (td.khongHieu && loi === "mang") {
    return { vai: "mayChu", chu: `Câu này cần AI diễn giải mà dịch vụ AI chưa phản hồi. Bạn bấm Thử lại, hoặc ${cauDoc}.`, nguon: [], cheDo: "tuDong", idDuLieu, thuLai: true, ...(viecTiep ? { viecTiep } : {}) };
  }
  return tinTuDong(td, idDuLieu, { viecTiep, ...(loi === "mang" && !td.khongHieu ? { thuLai: true } : {}) });
}

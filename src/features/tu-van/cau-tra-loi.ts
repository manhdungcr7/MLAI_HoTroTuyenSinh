// Lấy câu trả lời cho một câu hỏi: dùng chung cho màn Tư vấn và trợ lý nổi (không nhân đôi logic). TypeScript thuần, không React.
// Câu hỏi có ý định rõ (thêm nguyện vọng, trường nào, so sánh trường, xếp hạng học phí, cơ hội đỗ) trả lời ngay từ dữ liệu thật,
// vì tra cứu và hành động cần đúng mã, không cần mô hình ngôn ngữ. Câu mở còn lại hỏi dịch vụ AI; không được thì tự trả lời.
import type { NguonTaiSau } from "@/data/lua-chon-that";
import { tim } from "@/data/lua-chon-mau";
import { coTruong } from "@/engine/truong";
import { GIOI_HAN, type TraLoiTuVan, type YeuCauTuVan } from "@/engine/tu-van";
import { phanTichMoNeo, tomTatMoNeoChoAI } from "@/features/nguyen-vong/mo-neo";
import type { AppState } from "@/state/store";
import { phanTichCau } from "./hieu-cau";
import { lamSachHanhDong, lamSachThe, nganhLuotTruoc, taoNguCanh, type TheTruong, type TinNhan } from "./hoi-thoai";
import { chonDuLieuKemTheo, nguCanhLuotTruoc, tomTatHoSo, traLoiTuDong, type KetQuaTuDong } from "./lay-du-lieu";

/** Dòng NV1 (nếu có) đứng đầu ngữ cảnh để AI lấy NV1 làm gốc; phần lượt trước bị cắt bớt cho vừa giới hạn. */
export function nguCanhVoiNV1(manHinh: string, truoc: TinNhan[], s: AppState): string {
  const nv1 = tomTatMoNeoChoAI(phanTichMoNeo(s));
  if (!nv1) return taoNguCanh(manHinh, truoc);
  return `${nv1}\n${taoNguCanh(manHinh, truoc, Math.max(60, GIOI_HAN.nguCanh - nv1.length - 1))}`.slice(0, GIOI_HAN.nguCanh);
}

/** Máy chủ có ngân sách tối đa 12 giây cho một lượt; cộng thời gian mạng, nên chờ 25 giây rồi mới tự trả lời từ số liệu có sẵn. */
const CHO_TOI_DA_MS = 25_000;
export type LoiAI = "chua-cau-hinh" | "mang";

/** Gọi dịch vụ AI. kq=null khi chưa bật hoặc không gọi được: khi đó app tự trả lời từ số liệu có sẵn (loi nói vì sao). */
export async function hoiAI(y: YeuCauTuVan): Promise<{ kq: TraLoiTuVan | null; viecTiep?: string; loi?: LoiAI }> {
  try {
    const r = await fetch("/api/tu-van", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(y), signal: AbortSignal.timeout(CHO_TOI_DA_MS) });
    const d = (await r.json().catch(() => ({}))) as Partial<TraLoiTuVan> & { goiY?: { viecTiep?: string } };
    if (!r.ok) return { kq: null, viecTiep: typeof d.goiY?.viecTiep === "string" ? d.goiY.viecTiep : undefined, loi: r.status === 503 ? "chua-cau-hinh" : "mang" };
    const ds = (x: unknown) => (Array.isArray(x) ? x.filter((t): t is string => typeof t === "string") : []);
    return typeof d.traLoi === "string" && d.traLoi
      ? { kq: { ...d, traLoi: d.traLoi, nguon: ds(d.nguon), tang: d.tang, congDong: ds(d.congDong), viecTiep: typeof d.viecTiep === "string" ? d.viecTiep : undefined } }
      : { kq: null, loi: "mang" };
  } catch { return { kq: null, loi: "mang" }; }
}

/** Ý định có thể trả lời chắc từ dữ liệu: không cần (và không nên) nhờ mô hình ngôn ngữ đoán. */
export function traLoiNoiBo(cau: string, truoc: TinNhan[]): boolean {
  if (nguCanhLuotTruoc(truoc).cho) return true;
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
  };
}

export interface DauVaoTraLoi { cau: string; truoc: TinNhan[]; s: AppState; nguon: NguonTaiSau | null; dungHoSo: boolean; manHinh: string }

/** Một lượt hỏi–đáp hoàn chỉnh, trả về tin của máy để ghi vào lịch sử. */
export async function layTinTraLoi({ cau, truoc, s, nguon, dungHoSo, manHinh }: DauVaoTraLoi): Promise<TinNhan> {
  const giu = nganhLuotTruoc(truoc);
  const y: YeuCauTuVan = {
    cauHoi: cau, nguCanh: nguCanhVoiNV1(manHinh, truoc, s), hoSo: dungHoSo ? tomTatHoSo(s) : null,
    duLieu: chonDuLieuKemTheo(cau, s, nguon, 8, giu),
  };
  const idDuLieu = y.duLieu.map((d) => d.id);
  if (traLoiNoiBo(cau, truoc)) return tinTuDong(traLoiTuDong(cau, s, nguon, giu, truoc), idDuLieu, {});
  const { kq: ai, viecTiep, loi } = await hoiAI(y);
  if (ai) {
    const the = lamSachThe(theTuMayChu(ai));
    const hanhDong = lamSachHanhDong(ai.hanhDong).filter((h) => (h.maTruong ? coTruong(h.maTruong) : true) && (h.idChuongTrinh ? !!tim(h.idChuongTrinh) : true) && (h.ids ? h.ids.every((i) => !!tim(i)) : true));
    return {
      vai: "mayChu", chu: ai.traLoi, nguon: ai.nguon, cheDo: "ai", tang: ai.tang, congDong: ai.congDong, viecTiep: ai.viecTiep, idDuLieu,
      ...(the.length ? { the } : {}), ...(hanhDong.length ? { hanhDong } : {}),
      ...(ai.hoiLai ? { hoiLai: ai.hoiLai } : {}), ...(ai.trangThaiDuLieu ? { trangThaiDuLieu: ai.trangThaiDuLieu } : {}),
    };
  }
  return tinTuDong(traLoiTuDong(cau, s, nguon, giu, truoc), idDuLieu, { viecTiep, ...(loi === "mang" ? { thuLai: true } : {}) });
}

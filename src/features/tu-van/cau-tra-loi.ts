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
import { chonDuLieuKemTheo, nguCanhLuotTruoc, tomTatHoSo, tomTatKeHoachChoAI, traLoiTuDong, type KetQuaTuDong } from "./lay-du-lieu";
import { dungBangSoSanh, tomTatChoAI } from "./bang-so-sanh";
import { diemDayDu } from "@/features/kham-pha/to-hop";
import { phanLoaiYdinh } from "./bo-dieu-phoi";

/** Dòng NV1 và kế hoạch học tập (nếu có) đứng đầu ngữ cảnh để AI nắm chắc mục tiêu và tiến độ; phần lượt trước bị cắt bớt cho vừa giới hạn. */
export function nguCanhVoiNV1(manHinh: string, truoc: TinNhan[], s: AppState): string {
  const nv1 = tomTatMoNeoChoAI(phanTichMoNeo(s));
  const kh = tomTatKeHoachChoAI(s);
  const boiCanh = [nv1, kh].filter(Boolean).join("\n");
  if (!boiCanh) return taoNguCanh(manHinh, truoc);
  return `${boiCanh}\n${taoNguCanh(manHinh, truoc, Math.max(60, GIOI_HAN.nguCanh - boiCanh.length - 1))}`.slice(0, GIOI_HAN.nguCanh);
}

export const NHAN_DU_PHONG = "Câu trả lời dự phòng từ dữ liệu có sẵn, không phải AI";
const ghiChuDuPhong = (l: LoiAI) =>
  `${NHAN_DU_PHONG} (${l === "het-luot" || l === "het-luot-chung" ? "hôm nay đã hết lượt hỏi AI" : l === "so-lieu" ? "AI nêu số chưa khớp dữ liệu" : "AI đang bận"}).`;

/** Máy chủ có ngân sách tối đa 12 giây cho một lượt; cộng thời gian mạng, nên chờ 25 giây rồi mới tự trả lời từ số liệu có sẵn. */
const CHO_TOI_DA_MS = 25_000;
/** het-luot: hết lượt của chính em; het-luot-chung: hết lượt chung trong ngày (IP hoặc toàn hệ thống); so-lieu: số AI nêu không khớp dữ liệu (422). */
export type LoiAI = "chua-cau-hinh" | "mang" | "het-luot" | "het-luot-chung" | "so-lieu";

const laLuot = (x: unknown): x is Luot => !!x && typeof x === "object" && Number.isInteger((x as Luot).con) && Number.isInteger((x as Luot).toiDa) && (x as Luot).toiDa > 0 && (x as Luot).con >= 0;

/** Gọi dịch vụ AI (chỉ khi chế độ AI và còn lượt). Hỗ trợ streaming từ những token đầu tiên qua onChunk.
 *  kq=null khi không gọi được: khi đó app tự trả lời từ số liệu có sẵn (loi nói vì sao). */
export async function hoiAI(
  y: YeuCauTuVan,
  phien: PhienAI,
  onChunk?: (doan: string) => void,
  signal?: AbortSignal
): Promise<{ kq: TraLoiTuVan | null; viecTiep?: string; loi?: LoiAI }> {
  try {
    const goi = phien.fetch ?? fetch;
    const r = await goi("/api/tu-van", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "text/event-stream, application/json" },
      body: JSON.stringify({ ...y, stream: true, hoSoId: phien.idHoSo, requestId: uuidMoi() }),
      signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(CHO_TOI_DA_MS)]) : AbortSignal.timeout(CHO_TOI_DA_MS),
    });

    const cType = r.headers?.get ? (r.headers.get("content-type") || "") : "";
    if (r.ok && cType.includes("text/event-stream") && r.body) {
      const reader = r.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullTraLoi = "";
      let cuoiKq: (Partial<TraLoiTuVan> & { loi?: string; goiY?: { viecTiep?: string } }) | null = null;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";
        for (const block of lines) {
          for (const line of block.split("\n")) {
            const tr = line.trim();
            if (!tr.startsWith("data:")) continue;
            const jsonStr = tr.slice(5).trim();
            if (!jsonStr || jsonStr === "[DONE]") continue;
            try {
              const parsed = JSON.parse(jsonStr);
              if (typeof parsed.token === "string" && parsed.token) {
                fullTraLoi += parsed.token;
                onChunk?.(fullTraLoi);
              }
              if (parsed.xong) cuoiKq = parsed;
              if (laLuot(parsed.luot)) phien.ghiLuot?.(parsed.luot);
            } catch {}
          }
        }
      }
      if (cuoiKq && cuoiKq.loi === "het-luot-ngay") {
        phien.ghiLuot?.({ con: 0, toiDa: laLuot(cuoiKq.luot) ? cuoiKq.luot.toiDa : phien.luot?.toiDa ?? 50 });
        return { kq: null, loi: "het-luot" };
      }
      const traLoiCuoi = cuoiKq?.traLoi || fullTraLoi;
      if (traLoiCuoi) {
        const ds = (x: unknown) => (Array.isArray(x) ? x.filter((t): t is string => typeof t === "string") : []);
        return {
          kq: {
            traLoi: traLoiCuoi,
            nguon: ds(cuoiKq?.nguon),
            tang: cuoiKq?.tang ?? "llm",
            congDong: ds(cuoiKq?.congDong),
            viecTiep: typeof cuoiKq?.viecTiep === "string" ? cuoiKq.viecTiep : undefined,
            nguonWeb: Array.isArray(cuoiKq?.nguonWeb) ? cuoiKq.nguonWeb : undefined,
            thucThe: cuoiKq?.thucThe,
            hanhDong: cuoiKq?.hanhDong,
            hoiLai: cuoiKq?.hoiLai,
            trangThaiDuLieu: cuoiKq?.trangThaiDuLieu,
          },
          viecTiep: typeof cuoiKq?.viecTiep === "string" ? cuoiKq.viecTiep : undefined,
        };
      }
    }

    const d = (await r.json().catch(() => ({}))) as Partial<TraLoiTuVan> & { goiY?: { viecTiep?: string }; loi?: string };
    if (laLuot(d.luot)) phien.ghiLuot?.(d.luot);
    if (!r.ok) {
      if (r.status === 429 && d.loi === "het-luot-ngay") {
        phien.ghiLuot?.({ con: 0, toiDa: laLuot(d.luot) ? d.luot.toiDa : phien.luot?.toiDa ?? 50 });
        return { kq: null, loi: "het-luot" };
      }
      if (r.status === 429 && typeof d.loi === "string" && d.loi.startsWith("het-luot")) return { kq: null, loi: "het-luot-chung" };
      if (r.status === 422) return { kq: null, viecTiep: typeof d.goiY?.viecTiep === "string" ? d.goiY.viecTiep : undefined, loi: "so-lieu" };
      return { kq: null, viecTiep: typeof d.goiY?.viecTiep === "string" ? d.goiY.viecTiep : undefined, loi: r.status === 503 ? "chua-cau-hinh" : "mang" };
    }
    const ds = (x: unknown) => (Array.isArray(x) ? x.filter((t): t is string => typeof t === "string") : []);
    if (typeof d.traLoi === "string" && d.traLoi) {
      onChunk?.(d.traLoi);
      return { kq: { ...d, traLoi: d.traLoi, nguon: ds(d.nguon), tang: d.tang, congDong: ds(d.congDong), viecTiep: typeof d.viecTiep === "string" ? d.viecTiep : undefined, nguonWeb: Array.isArray(d.nguonWeb) ? d.nguonWeb : undefined } };
    }
    return { kq: null, loi: "mang" };
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

export interface DauVaoTraLoi {
  cau: string;
  truoc: TinNhan[];
  s: AppState;
  nguon: NguonTaiSau | null;
  dungHoSo: boolean;
  manHinh: string;
  phien?: PhienAI;
  onChunk?: (chuoi: string) => void;
  signal?: AbortSignal;
}

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
export async function layTinTraLoi({ cau: cauGoc, truoc, s, nguon, dungHoSo, manHinh, phien: phienGoc, onChunk, signal }: DauVaoTraLoi): Promise<TinNhan> {
  const phien: PhienAI = phienGoc ?? { cheDo: CHE_DO_MAC_DINH, idHoSo: idHoSoAI(null), luot: null };
  // Ý định quy tắc (chào, cảm ơn, trợ giúp...) trả ngay, không dữ liệu, không tốn lượt AI.
  const quyTac = nhanYDinhQuyTac(cauGoc);
  if (quyTac) {
    const qt = traLoiQuyTac(quyTac.y, { cheDo: phien.cheDo, luot: phien.luot });
    onChunk?.(qt.traLoi);
    return tinTuDong(qt, [], {});
  }
  // "Chào, UIT là trường gì": bỏ lời chào, xử lý phần nội dung.
  const cau = bocLoiChao(cauGoc) ?? cauGoc;
  const stateTuVan = dungHoSo ? s : trangThaiKhongKemHoSo(s);
  // Hỏi tiến độ học theo chương trình lớp 12: chạy bằng quy tắc và dữ liệu đã lấy, không qua AI, nên không thể bịa chương hay bài.
  const tienDo = traLoiTienDoChat(cau, stateTuVan);
  if (tienDo) return { vai: "mayChu", chu: tienDo.traLoi, nguon: [], cheDo: "tuDong", idDuLieu: [], ...(tienDo.luaChon?.length ? { luaChon: tienDo.luaChon } : {}), ...(tienDo.tienDo ? { tienDo: tienDo.tienDo } : {}) };
  // Lịch sử có thể đã chứa câu trả lời cá nhân hóa, nên cũng không đưa vào lúc bỏ chọn hồ sơ.
  const truocTuVan = dungHoSo ? truoc : [];
  const giu = nganhLuotTruoc(truocTuVan);
  const dp = phanLoaiYdinh(cau);
  const laHoiThoaiChung = dp.intent === "general_chat";

  const y: YeuCauTuVan = {
    cauHoi: cau, nguCanh: nguCanhVoiNV1(manHinh, truocTuVan, stateTuVan), hoSo: dungHoSo ? tomTatHoSo(s) : null,
    duLieu: laHoiThoaiChung ? [] : chonDuLieuKemTheo(cau, stateTuVan, nguon, 8, giu),
  };
  const idDuLieu = y.duLieu.map((d) => d.id);
  const tdSoSanh = traLoiTuDong(cau, stateTuVan, nguon, giu, truocTuVan);
  const cauDoc = "hỏi theo kiểu tra cứu như “điểm chuẩn Khoa học máy tính UIT”";

  // Chế độ Tiết kiệm: người dùng chủ động tắt AI -> dùng rules tất định để không tốn lượt
  if (phien.cheDo === "tietKiem") {
    if (laHoiThoaiChung) {
      const tb = "Mình có thể chia sẻ và trò chuyện nhiều hơn về cuộc sống và kinh nghiệm khi bạn bật chế độ AI. Hiện tại ở chế độ Tiết kiệm, mình hỗ trợ tra cứu thông tin tuyển sinh có sẵn.";
      onChunk?.(tb);
      return { vai: "mayChu", chu: tb, nguon: [], cheDo: "tuDong", idDuLieu: [], batAI: true };
    }
    const td = traLoiTuDong(cau, stateTuVan, nguon, giu, truocTuVan);
    if (!td.khongHieu) {
      onChunk?.(td.traLoi);
      return tinTuDong(td, idDuLieu, { ghiChu: `${NHAN_DU_PHONG} (bạn đang tắt AI ở chế độ Tiết kiệm).` });
    }
    const tbTietKiem = `Câu này cần AI diễn giải, mà bạn đang ở chế độ Tiết kiệm. Bạn bật chế độ AI để mình trả lời, hoặc ${cauDoc}.`;
    onChunk?.(tbTietKiem);
    return { vai: "mayChu", chu: tbTietKiem, nguon: [], cheDo: "tuDong", idDuLieu, batAI: true };
  }

  // Thao tác thật (thêm vào nguyện vọng...) cần đúng mã: làm bằng luật, không cần AI.
  if (tdSoSanh.hanhDong?.some((h) => h.loai === "them-nguyen-vong") && !tdSoSanh.khongHieu) {
    onChunk?.(tdSoSanh.traLoi);
    return tinTuDong(tdSoSanh, idDuLieu, {});
  }

  // Hết lượt đã biết trước: khỏi gọi, rơi về luật cứng kèm nhãn.
  if (phien.luot && phien.luot.con <= 0) return duPhong("het-luot");

  // Mọi câu còn lại hỏi AI trước. So sánh: kèm bảng đã tính để AI chỉ diễn giải.
  let bangSoSanh: string | undefined;
  if (tdSoSanh.soSanh) {
    const ls = tdSoSanh.soSanh.ids.map((i) => tim(i)).filter((l): l is NonNullable<ReturnType<typeof tim>> => !!l);
    if (ls.length >= 2) bangSoSanh = tomTatChoAI(dungBangSoSanh(ls, diemDayDu(stateTuVan)));
  }
  const { kq: ai, viecTiep, loi } = await hoiAI(bangSoSanh ? { ...y, bangSoSanh } : y, phien, onChunk, signal);

  if (signal?.aborted) {
    const tb = "Đã dừng. Bạn hỏi lại hoặc gõ câu khác nhé.";
    return { vai: "mayChu", chu: tb, nguon: [], cheDo: "tuDong", idDuLieu: [] };
  }

  if (ai) {
    const the = lamSachThe(theTuMayChu(ai));
    const hanhDong = lamSachHanhDong(ai.hanhDong).filter((h) => (h.maTruong ? coTruong(h.maTruong) : true) && (h.idChuongTrinh ? !!tim(h.idChuongTrinh) : true) && (h.ids ? h.ids.every((i) => !!tim(i)) : true));
    return {
      vai: "mayChu", chu: ai.traLoi, nguon: ai.nguon, cheDo: "ai", tang: ai.tang, congDong: ai.congDong, viecTiep: ai.viecTiep, idDuLieu,
      ...(tdSoSanh.soSanh ? { soSanh: tdSoSanh.soSanh } : {}),
      ...(the.length ? { the } : {}), ...(hanhDong.length ? { hanhDong } : {}),
      ...(ai.hoiLai ? { hoiLai: ai.hoiLai } : {}), ...(ai.trangThaiDuLieu ? { trangThaiDuLieu: ai.trangThaiDuLieu } : {}),
      ...(ai.nguonWeb?.length ? { nguonWeb: ai.nguonWeb } : {}),
    };
  }
  return duPhong(loi ?? "mang", viecTiep);

  /** AI không dùng được: luật cứng trả lời nhưng luôn gắn nhãn dự phòng, không giả làm AI. */
  function duPhong(l: LoiAI, viec?: string): TinNhan {
    const ghiChu = ghiChuDuPhong(l);
    const thuLai = l === "mang" || l === "chua-cau-hinh" ? { thuLai: true } : {};
    if (laHoiThoaiChung) {
      const tb = l === "het-luot" || l === "het-luot-chung"
        ? "Hôm nay đã hết lượt hỏi AI nên mình chưa trò chuyện thêm được. Bạn quay lại ngày mai nhé."
        : "AI đang bận nên mình chưa trò chuyện thêm được. Bạn thử lại sau ít phút, hoặc hỏi về điểm chuẩn, học phí, so sánh ngành.";
      onChunk?.(tb);
      return { vai: "mayChu", chu: tb, nguon: [], cheDo: "tuDong", idDuLieu: [], ghiChu, ...thuLai };
    }
    if (tdSoSanh.khongHieu) {
      const tb = `Câu này cần AI diễn giải mà AI chưa trả lời được. Bạn thử lại sau, hoặc ${cauDoc}.`;
      onChunk?.(tb);
      return { vai: "mayChu", chu: tb, nguon: [], cheDo: "tuDong", idDuLieu, ghiChu, ...thuLai };
    }
    onChunk?.(tdSoSanh.traLoi);
    return tinTuDong(tdSoSanh, idDuLieu, { ghiChu, ...(viec ? { viecTiep: viec } : {}) });
  }
}

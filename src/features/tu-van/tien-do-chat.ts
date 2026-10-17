// Hội thoại "hỏi tiến độ học" của chatbot: chạy bằng quy tắc và dữ liệu chương trình lớp 12 (bộ Kết nối tri thức), KHÔNG gọi AI.
// Vì không đi qua mô hình ngôn ngữ nên không thể bịa chương hay bài: chỉ nói những gì có trong src/data/chuong-trinh-lop12.ts, và khi
// không có dữ liệu phù hợp (chủ đề lớp 11, bộ sách khác, câu không khớp chủ đề nào) thì nói rõ là chưa có. TypeScript thuần.
import { NGUON_CHUONG_TRINH, chuDeCuaMon } from "@/data/chuong-trinh-lop12";
import {
  NHAN_MUC_DO, chuDeConHoc, coTienDoMon, hieuTienDoTuCau, monTuCau, tenMon, type MucDoChuDe,
} from "@/engine/tien-do-chu-de";
import { chuanHoa } from "@/engine/truong";
import { mucTieuDayDu } from "@/state/chon";
import type { AppState } from "@/state/store";
import { CAC_MON, TEN_MON, type MonId } from "@/state/types";
import type { LuaChonNhanh } from "./hoi-thoai";

export interface TienDoTin {
  /** Hiện thẻ chọn mức học từng chủ đề của môn này. */
  the?: MonId;
  /** Các chủ đề mình hiểu từ câu em gõ, chờ em bấm Lưu. */
  deXuat?: { ten: string; mucDo: MucDoChuDe }[];
  /** Hiện nút mở lịch tuần. */
  moLich?: boolean;
}

export interface KetQuaTienDoChat { traLoi: string; luaChon?: LuaChonNhanh[]; tienDo?: TienDoTin }

const GHI_CHU_NGUON = `Dữ liệu: chương trình lớp 12, bộ ${NGUON_CHUONG_TRINH.boSach}, lấy từ mục lục sách (chưa đối chiếu sách in, chưa có người học môn đó duyệt). Mình chưa có lớp 10–11 và các bộ sách khác.`;

const TO_HOP_MAC_DINH: MonId[] = ["toan", "vatLy", "hoaHoc"];
const monCuaEm = (s: AppState): MonId[] => mucTieuDayDu(s)?.toHop ?? TO_HOP_MAC_DINH;

const nhieu = (ds: string[]) => ds.map((x) => `• ${x}`).join("\n");

const LUA_CHON_MON = (mons: MonId[], tru?: MonId): LuaChonNhanh[] =>
  mons.filter((m) => m !== tru).map((m) => ({ nhan: `Hỏi môn ${TEN_MON[m]}`, cau: `Hỏi tiến độ môn ${TEN_MON[m]}` }));

function moDauHoiTienDo(mon: MonId, s: AppState): KetQuaTienDoChat {
  const mons = monCuaEm(s);
  const ds = chuDeCuaMon(mon);
  const daCo = ds.filter((c) => s.hoSo.tienDoKienThuc?.[c.ten]).length;
  return {
    traLoi: `Môn ${tenMon(mon)} lớp 12 có ${ds.length} chủ đề. Bạn chọn mức cho từng chủ đề (Vững, Cần ôn hay Chưa học)${daCo ? `, mình thấy bạn đã trả lời ${daCo}/${ds.length}` : ""}, hoặc gõ ví dụ "từ trường mình học rồi, hạt nhân chưa học". ${GHI_CHU_NGUON}`,
    tienDo: { the: mon },
    luaChon: [...LUA_CHON_MON(mons, mon), { nhan: "Xem kế hoạch gợi ý", cau: "Gợi ý kế hoạch học theo tiến độ của mình" }],
  };
}

function keHoachTheoTienDo(s: AppState): KetQuaTienDoChat {
  const mons = monCuaEm(s);
  const td = s.hoSo.tienDoKienThuc;
  const daHoi = mons.filter((m) => coTienDoMon(m, td));
  if (daHoi.length === 0) {
    return {
      traLoi: `Bạn chưa cho mình biết tiến độ môn nào nên mình chưa thể đề xuất theo tiến độ, và mình không đoán. Bắt đầu với môn ${tenMon(mons[0])} nhé? ${GHI_CHU_NGUON}`,
      tienDo: { the: mons[0] },
      luaChon: LUA_CHON_MON(mons, mons[0]),
    };
  }
  const khoi = mons.map((m) => {
    if (!coTienDoMon(m, td)) return `**${tenMon(m)}**: bạn chưa cho biết tiến độ, mình chưa xếp được.`;
    const ds = chuDeConHoc(m, td).slice(0, 3);
    return `**${tenMon(m)}** nên học theo thứ tự:\n${nhieu(ds.map((x) => `${x.chuDe.ten} (${x.lyDo}). Cần nắm: ${x.chuDe.canNam.slice(0, 2).join("; ")}`))}`;
  });
  const thieu = mons.filter((m) => !coTienDoMon(m, td));
  return {
    traLoi: `Kế hoạch gợi ý theo tiến độ bạn đã cho biết:\n\n${khoi.join("\n\n")}\n\nThứ tự dựa vào mức bạn tự đánh giá và chủ đề nào học trước; mình chưa có số liệu mức quan trọng của từng chủ đề trong đề thi. Số giờ mỗi môn do mục Kế hoạch tính. ${GHI_CHU_NGUON}`,
    tienDo: { moLich: true },
    luaChon: thieu.length ? LUA_CHON_MON(thieu) : undefined,
  };
}

function lietKeChuongTrinh(mon: MonId): KetQuaTienDoChat {
  const ds = chuDeCuaMon(mon);
  return {
    traLoi: `Chương trình ${tenMon(mon)} lớp 12 (bộ ${NGUON_CHUONG_TRINH.boSach}) trong dữ liệu của mình gồm ${ds.length} ${mon === "nguVan" ? "bài" : mon === "tiengAnh" ? "unit" : "chương"}:\n${nhieu(ds.map((c) => c.ten))}\n${GHI_CHU_NGUON} Mục lục này có thể khác sách của bạn, bạn đối chiếu giúp mình nhé.`,
    luaChon: [{ nhan: `Hỏi tiến độ môn ${TEN_MON[mon]}`, cau: `Hỏi tiến độ môn ${TEN_MON[mon]}` }],
  };
}

const MAU_HOI_CT = /\b(chuong trinh|gom nhung gi|gom gi|hoc nhung gi|hoc gi|co nhung chuong|cac chuong)\b/;
const MAU_LAP_KE_HOACH = /\b(lap|len|goi y|de xuat|xep)\b.*\bke hoach\b|\bke hoach\b.*\b(tien do|theo tien do)\b|\bnen on gi\b|\bnen hoc gi\b|\bon gi\b.*\b(bay gio|tuan nay|truoc)\b/;
const MAU_HOI_TIEN_DO = /\b(hoi tien do|tien do hoc|tien do mon|em da hoc|minh da hoc|da hoc duoc|hoc den dau|hoc toi dau|da hoc nhung gi)\b/;
const MAU_TUYEN_SINH = /\b(diem chuan|nguyen vong|truong dai hoc|nganh|hoc phi|xet tuyen|ky tuc|viec lam)\b/;

/**
 * Trả lời nếu câu hỏi thuộc luồng tiến độ học; null thì để các bộ trả lời khác xử lý.
 * Chạy TRƯỚC AI để mọi câu về chương trình học đều đến từ dữ liệu, không do mô hình tự nhớ.
 */
export function traLoiTienDoChat(cauGoc: string, s: AppState): KetQuaTienDoChat | null {
  const q = chuanHoa(cauGoc);
  if (!q || q.length > 400) return null;
  const mons = monTuCau(cauGoc);
  const mon1 = mons[0] as MonId | undefined;

  // Hỏi môn nào đó: "Hỏi tiến độ môn Hóa học"
  if (MAU_HOI_TIEN_DO.test(q) || /\bhoi tien do mon\b/.test(q)) return moDauHoiTienDo(mon1 ?? monCuaEm(s)[0], s);

  // Câu nêu mức học: "lý em học xong từ trường, toán giỏi hình học": hiểu, nói lại, chờ bấm Lưu. Không xử lý câu về tuyển sinh.
  if (!MAU_TUYEN_SINH.test(q)) {
    const h = hieuTienDoTuCau(cauGoc);
    if (h.khop.length || h.ngoaiPhamVi.length || h.khongKhop.length) {
      const dong: string[] = [];
      if (h.khop.length) dong.push(`Mình hiểu là:\n${nhieu(h.khop.map((k) => `${tenMon(k.chuDe.mon)} · ${k.chuDe.ten}: ${NHAN_MUC_DO[k.mucDo]}`))}\nBạn bấm Lưu nếu đúng.`);
      if (h.ngoaiPhamVi.length) dong.push(`Chưa có dữ liệu cho: ${h.ngoaiPhamVi.map((n) => `${n.ten} (thuộc lớp ${n.lop})`).join(", ")}. Mình chỉ có chương trình lớp 12 nên chưa ghi được phần này, bạn tự ôn theo sách.`);
      if (h.khongKhop.length) dong.push(`Mình chưa tìm thấy chủ đề phù hợp trong chương trình lớp 12 cho: ${h.khongKhop.map((x) => `"${x}"`).join(", ")}. Bạn chọn trong danh sách môn đó giúp mình, hoặc gõ tên chương trong sách.`);
      const monHoi = h.khop[0]?.chuDe.mon ?? h.ngoaiPhamVi[0]?.mon ?? h.mon[0] ?? mon1;
      return {
        traLoi: `${dong.join("\n\n")}\n${GHI_CHU_NGUON}`,
        ...(h.khop.length ? { tienDo: { deXuat: h.khop.map((k) => ({ ten: k.chuDe.ten, mucDo: k.mucDo })) } } : {}),
        luaChon: monHoi ? [{ nhan: `Mở danh sách ${TEN_MON[monHoi]}`, cau: `Hỏi tiến độ môn ${TEN_MON[monHoi]}` }] : undefined,
      };
    }
  }

  // Hỏi chương trình: "chương trình lý 12 gồm gì"
  if (mon1 && MAU_HOI_CT.test(q) && !MAU_TUYEN_SINH.test(q) && /\b12\b|\blop 12\b/.test(q)) return lietKeChuongTrinh(mon1);
  if (MAU_LAP_KE_HOACH.test(q) && !MAU_TUYEN_SINH.test(q)) return keHoachTheoTienDo(s);
  return null;
}

export const MON_CO_DU_LIEU = CAC_MON;

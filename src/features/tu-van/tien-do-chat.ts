// Hội thoại "hỏi tiến độ học" của chatbot: chạy bằng quy tắc và dữ liệu chương trình lớp 12 (bộ Kết nối tri thức), KHÔNG gọi AI.
// Vì không đi qua mô hình ngôn ngữ nên không thể bịa chương hay bài: chỉ nói những gì có trong src/data/chuong-trinh-lop12.ts, và khi
// không có dữ liệu phù hợp (chủ đề lớp 11, bộ sách khác, câu không khớp chủ đề nào) thì nói rõ là chưa có. TypeScript thuần.
import { CHU_DE_LOP12, NGUON_CHUONG_TRINH, chuDeCuaMon } from "@/data/chuong-trinh-lop12";
import {
  NHAN_MUC_DO, chuDeConHoc, coTienDoMon, hieuTienDoTuCau, monTuCau, tenMon, xepUuTienChuDe, type MucDoChuDe,
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

/** Học sinh hỏi "kế hoạch/chương trình này dựa vào nguồn dữ liệu nào": trả lời tất định, nói đúng nguồn và giới hạn, không để AI tự kể. */
function nguonKeHoach(s: AppState): KetQuaTienDoChat {
  const mons = monCuaEm(s);
  return {
    traLoi: [
      "Kế hoạch học này dựa trên 4 thứ, và mình nói rõ cái nào đã kiểm chứng, cái nào chưa:",
      `• **Chương trình học:** ${CHU_DE_LOP12.length} chủ đề lớp 12 của 6 môn, bộ ${NGUON_CHUONG_TRINH.boSach}. Tên chương và bài lấy từ mục lục sách giáo khoa (trang loigiaihay.com, lấy ngày 17/10/2026). Phần "cần nắm" do nhóm viết dựa trên tên bài. Chưa đối chiếu sách in và chưa có người học môn đó duyệt, nên bạn đối chiếu giúp mình.`,
      "• **Tiến độ của bạn:** những chủ đề bạn chọn hoặc nói với mình, lưu ngay trên máy bạn, không gửi đi đâu.",
      "• **Thứ tự học:** chủ đề chưa học đứng đầu, rồi cần ôn, rồi đã học chưa chắc, cuối cùng là đã vững; chủ đề nền (tiên quyết) học trước chủ đề phụ thuộc. Mình chưa có số liệu mức quan trọng của từng chủ đề trong đề thi nên chưa tính đến.",
      "• **Số giờ mỗi môn:** tính từ điểm hiện tại, điểm mục tiêu, số ngày còn tới kỳ thi và giờ trống trong tuần. Công thức dùng tham số giả định theo cách ôn thông thường, chưa đo trên học sinh thật.",
      `Mọi nội dung về chương trình đều lấy từ dữ liệu trên, mình không tự nhớ từ AI. Chủ đề lớp 10–11 và bộ sách khác thì mình chưa có.`,
    ].join("\n"),
    luaChon: [{ nhan: "Xem kế hoạch gợi ý", cau: "Gợi ý kế hoạch học theo tiến độ của mình" }, ...LUA_CHON_MON(mons).slice(0, 1)],
  };
}

const MAU_NGUON = /\b(nguon|dua vao|dua tren|can cu|lay tu dau|lay o dau|tu dau ra|co so nao)\b/;
const MAU_VE_KE_HOACH = /\b(ke hoach|chuong trinh hoc|chu de|de xuat|goi y)\b/;
const MAU_CON_THIEU = /\b(chuong|chu de|bai|phan|kien thuc)\b.*\b(con thieu|dang thieu|thieu|con lai|chua xong)\b|\b(con thieu|dang thieu|thieu)\b.*\b(chuong|chu de|kien thuc)\b|\bchuong nao\b.*\b(chua|can)\b/;
const MAU_HOI_CT = /\b(chuong trinh|gom nhung gi|gom gi|hoc nhung gi|hoc gi|co nhung chuong|cac chuong)\b/;
const MAU_LAP_KE_HOACH = /\b(chuong trinh|lo trinh)\b.*\b(hoc|on)\b.*\b(phu hop|de xuat|goi y)\b|\b(de xuat|goi y)\b.*\b(chuong trinh|lo trinh)\b.*\b(hoc|on)\b|\b(lap|len|goi y|de xuat|xep)\b.*\bke hoach\b|\bke hoach\b.*\b(tien do|theo tien do)\b|\bnen on gi\b|\bnen hoc gi\b|\bon gi\b.*\b(bay gio|tuan nay|truoc)\b/;
const MAU_HOI_TIEN_DO = /\b(hoi tien do|tien do hoc|tien do mon|em da hoc|minh da hoc|da hoc duoc|hoc den dau|hoc toi dau|da hoc nhung gi)\b/;
const MAU_TUYEN_SINH = /\b(diem chuan|nguyen vong|truong dai hoc|nganh|hoc phi|xet tuyen|ky tuc|viec lam)\b/;

function chuongConThieu(mon: MonId, s: AppState): KetQuaTienDoChat {
  const td = s.hoSo.tienDoKienThuc;
  const mons = monCuaEm(s);
  const luaChon: LuaChonNhanh[] = [{ nhan: "Lập kế hoạch học", cau: "Gợi ý kế hoạch học theo tiến độ của mình" }, ...LUA_CHON_MON(mons, mon)];
  if (!coTienDoMon(mon, td)) {
    const ds = chuDeCuaMon(mon);
    return {
      traLoi: `Mình chưa biết bạn đã học chương nào của môn ${tenMon(mon)}, nên chưa nói được chương nào còn thiếu và không đoán. Chương trình lớp 12 môn này có ${ds.length} chủ đề:
${nhieu(ds.map((c) => c.ten))}
Bạn chọn mức cho từng chủ đề, mình sẽ liệt kê phần còn thiếu và xếp thứ tự nên học. ${GHI_CHU_NGUON}`,
      tienDo: { the: mon }, luaChon,
    };
  }
  const con = xepUuTienChuDe(mon, td).filter((x) => x.mucDo !== "namVung");
  if (con.length === 0) {
    return { traLoi: `Bạn ghi là đã vững cả ${chuDeCuaMon(mon).length} chủ đề môn ${tenMon(mon)}. Mình không thấy chương nào còn thiếu, bạn có thể dành thời gian luyện đề. ${GHI_CHU_NGUON}`, tienDo: { the: mon }, luaChon };
  }
  const chuaTraLoi = con.filter((x) => x.mucDo === null).length;
  return {
    traLoi: `Môn ${tenMon(mon)} còn ${con.length}/${chuDeCuaMon(mon).length} chủ đề chưa vững, xếp theo thứ tự nên học:
${nhieu(con.map((x) => `${x.chuDe.ten} (${x.lyDo})`))}${chuaTraLoi ? `
${chuaTraLoi} chủ đề bạn chưa cho mình biết mức, mình xếp tạm là chưa chắc.` : ""}
Bấm "Lập kế hoạch học" để mình xếp các chủ đề này vào tuần. ${GHI_CHU_NGUON}`,
    tienDo: { the: mon }, luaChon,
  };
}

/**
 * Trả lời nếu câu hỏi thuộc luồng tiến độ học; null thì để các bộ trả lời khác xử lý.
 * Chạy TRƯỚC AI để mọi câu về chương trình học đều đến từ dữ liệu, không do mô hình tự nhớ.
 */
export function traLoiTienDoChat(cauGoc: string, s: AppState): KetQuaTienDoChat | null {
  const q = chuanHoa(cauGoc);
  if (!q || q.length > 400) return null;
  const mons = monTuCau(cauGoc);
  const mon1 = mons[0] as MonId | undefined;

  // Hỏi nguồn dữ liệu của kế hoạch/chương trình được đề xuất (không đụng câu hỏi về điểm chuẩn, trường, ngành).
  if (MAU_NGUON.test(q) && MAU_VE_KE_HOACH.test(q) && !MAU_TUYEN_SINH.test(q)) return nguonKeHoach(s);

  // Hỏi môn nào đó: "Hỏi tiến độ môn Hóa học"
  if (MAU_HOI_TIEN_DO.test(q) || /\bhoi tien do mon\b/.test(q)) return moDauHoiTienDo(mon1 ?? monCuaEm(s)[0], s);

  // Hỏi phần còn thiếu của một môn: "những chương còn thiếu trong môn toán"
  if (mon1 && MAU_CON_THIEU.test(q) && !MAU_TUYEN_SINH.test(q)) return chuongConThieu(mon1, s);

  // Câu nêu mức học: "lý em học xong từ trường, toán giỏi hình học": hiểu, nói lại, chờ bấm Lưu. Không xử lý câu về tuyển sinh.
  if (!MAU_TUYEN_SINH.test(q)) {
    const h = hieuTienDoTuCau(cauGoc);
    const coNguCanhHoc = h.khop.length > 0 || (h.mon.length > 0 && (h.ngoaiPhamVi.length > 0 || h.khongKhop.length > 0));
    if (coNguCanhHoc) {
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

// Bản tóm tắt để em đưa cho phụ huynh, thầy cô hoặc người tư vấn xem, và 4 chỉ số theo dõi tiến bộ. TypeScript thuần, không React.
// Mọi câu đều sinh từ dữ liệu của em; không có câu nào viết sẵn cho mọi người.
import { coHocPhi } from "@/data/lua-chon-phu";
import { tim } from "@/data/lua-chon-mau";
import { NGAN_SACH_TOI_DA, tongDiem } from "@/engine/phan-tich";
import { diemDayDu } from "@/features/kham-pha/to-hop";
import { demNhan, dungDanhSach, xetCoCau } from "@/features/nguyen-vong/tinh-toan";
import { mucTieuDayDu, tienDoTuan } from "@/state/chon";
import type { AppState } from "@/state/store";
import { CAC_MON, TEN_MON, type MonId, type NhanNguyenVong } from "@/state/types";
import { TEN_CHO_O, TEN_NGAN_SACH, hieuEm } from "./tinh-toan";

const so = (n: number) => (Math.round(n * 10) / 10).toFixed(1).replace(".", ",");

// ---------- 4 chỉ số theo dõi (slide "Tính khả thi & tác động") ----------

export interface ChiSo {
  khoa: "hoSo" | "nguyenVong" | "nhiemVu" | "khoangCach";
  ten: string;
  /** Giá trị lớn hiển thị, ví dụ "78%" hoặc "4/6". */
  giaTri: string;
  moTa: string;
  /** 0–100 để vẽ thanh; null khi chưa đo được. */
  phanTram: number | null;
  tone: "xanh" | "luc" | "cam" | "tim";
}

/** Điểm tổ hợp mục tiêu tính từ lần thi thử ĐẦU TIÊN của từng môn (mốc xuất phát); thiếu thì lấy điểm hồ sơ. */
function tongLucDau(s: AppState, toHop: MonId[]): number | null {
  const dau: Record<MonId, number | null> = { ...s.hoSo.diem };
  const sapXep = [...s.diemThi].sort((a, b) => a.ngay.localeCompare(b.ngay));
  const daThay = new Set<MonId>();
  for (const d of sapXep) if (!daThay.has(d.mon)) { dau[d.mon] = d.diem; daThay.add(d.mon); }
  if (toHop.some((m) => dau[m] === null)) return null;
  return tongDiem(dau, toHop);
}

export function chiSoTheoDoi(s: AppState): ChiSo[] {
  const x = hieuEm(s);
  const diem = diemDayDu(s);
  const ds = dungDanhSach(s.nguyenVong, diem, tim);
  const coCan = ds.filter((d) => d.lc && d.nhan !== null).length;
  const tuan = tienDoTuan(s);
  const m = mucTieuDayDu(s);

  let khoang: ChiSo;
  if (!m) {
    khoang = { khoa: "khoangCach", ten: "Khoảng cách tới mục tiêu", giaTri: "–", phanTram: null, tone: "tim", moTa: "Em chọn một mục tiêu chính để mình đo khoảng cách." };
  } else {
    const dau = tongLucDau(s, m.toHop);
    const gapDau = dau === null ? null : Math.max(0, Math.round((m.mucTieu - dau) * 10) / 10);
    const thuHep = gapDau === null ? null : Math.round((gapDau - m.conThieu) * 10) / 10;
    khoang = {
      khoa: "khoangCach", ten: "Khoảng cách tới mục tiêu", giaTri: m.conThieu === 0 ? "Đã đủ" : `${so(m.conThieu)} điểm`,
      phanTram: gapDau && gapDau > 0 ? Math.max(0, Math.min(100, Math.round(((gapDau - m.conThieu) / gapDau) * 100))) : (m.conThieu === 0 ? 100 : null),
      tone: "tim",
      moTa: m.monThieu.length
        ? `Chưa có điểm ${m.monThieu.map((k) => TEN_MON[k]).join(", ")} nên khoảng cách đang tính thiếu.`
        : thuHep === null || gapDau === null ? `Cần thêm ${so(m.conThieu)} điểm để đạt ${so(m.mucTieu)}. Em nhập thêm điểm thi thử để thấy mình thu hẹp được bao nhiêu.`
          : thuHep > 0 ? `Đã thu hẹp ${so(thuHep)} điểm so với lần thi thử đầu (từ ${so(gapDau)} xuống ${so(m.conThieu)}).`
            : thuHep < 0 ? `Đang xa hơn ${so(-thuHep)} điểm so với lần thi thử đầu. Xem môn kéo điểm để chỉnh lại kế hoạch.`
              : `Chưa đổi so với lần thi thử đầu (${so(gapDau)} điểm).`,
    };
  }

  return [
    { khoa: "hoSo", ten: "Hồ sơ đã hoàn thiện", giaTri: `${x.dayDu}%`, phanTram: x.dayDu, tone: "xanh",
      moTa: x.boSung.length ? `Còn thiếu: ${x.boSung.slice(0, 3).map((b) => b.ten.toLowerCase()).join(", ")}${x.boSung.length > 3 ? "…" : ""}.` : "Hồ sơ đã có đủ thông tin chính." },
    { khoa: "nguyenVong", ten: "Nguyện vọng có căn cứ", giaTri: s.nguyenVong.length ? `${coCan}/${s.nguyenVong.length}` : "0",
      phanTram: s.nguyenVong.length ? Math.round((coCan / s.nguyenVong.length) * 100) : null, tone: "luc",
      moTa: !s.nguyenVong.length ? "Em chưa lưu nguyện vọng nào."
        : coCan === s.nguyenVong.length ? "Mọi nguyện vọng đều đã được so với điểm của em và ghi rõ nguồn điểm chuẩn."
          : `${s.nguyenVong.length - coCan} nguyện vọng chưa đủ điểm các môn của tổ hợp để xếp nhãn. Em bổ sung điểm nhé.` },
    { khoa: "nhiemVu", ten: "Nhiệm vụ tuần này", giaTri: tuan.tong ? `${tuan.xong}/${tuan.tong}` : "–", phanTram: tuan.tong ? tuan.phanTram : null, tone: "cam",
      moTa: tuan.tong ? `Đã xong ${tuan.xong} trên ${tuan.tong} việc của tuần này.` : "Tuần này chưa có việc. Em tạo việc ở Kế hoạch tuần." },
    khoang,
  ];
}

// ---------- Bản tóm tắt chia sẻ ----------

export interface MucTomTat { tieuDe: string; dong: string[] }

/** Điều em nên trao đổi với người lớn, rút từ chính dữ liệu của em (ngân sách, nơi ở, cơ cấu danh sách...). */
export function cauHoiTraoDoi(s: AppState): string[] {
  const h = s.hoSo;
  const ra: string[] = [];
  const diem = diemDayDu(s);
  const ds = dungDanhSach(s.nguyenVong, diem, tim);
  const lc = ds.map((d) => d.lc).filter((l): l is NonNullable<typeof l> => !!l);

  if (h.nganSach) {
    const tran = NGAN_SACH_TOI_DA[h.nganSach];
    const vuot = lc.filter((l) => coHocPhi(l) && (l.hocPhiMin ?? 0) > tran);
    if (vuot.length) ra.push(`Học phí của ${vuot.slice(0, 2).map((l) => `${l.truong} – ${l.nganh}`).join(" và ")} cao hơn mức gia đình dự kiến (${TEN_NGAN_SACH[h.nganSach].toLowerCase()} mỗi năm). Gia đình có thể hỗ trợ thêm, hay em cần tìm học bổng?`);
  } else ra.push("Gia đình có thể lo học phí khoảng bao nhiêu mỗi năm? Em chưa chọn mức này nên mình chưa lọc được trường theo tiền.");
  if (h.choO === null) ra.push("Em sẽ ở nhà, ở trọ hay ký túc xá khi học đại học?");
  else if (h.choO === "oNha" && lc.some((l) => h.khuVuc.length > 0 && !h.khuVuc.includes(l.khuVuc))) ra.push("Em chọn ở nhà nhưng có nguyện vọng ở nơi khác. Em có đi lại hằng ngày được không, hay cần chỗ ở?");
  if (h.hocXaNha === null) ra.push("Gia đình có đồng ý cho em học xa nhà không?");

  const c = xetCoCau(demNhan(ds));
  if (c.n > 0 && c.chacChan === 0) ra.push("Danh sách chưa có trường an toàn hay dự phòng. Em nên cân nhắc thêm với thầy cô để có phương án chắc chân.");
  if (c.thuSucNhieu) ra.push("Hơn một nửa nguyện vọng đang ở mức thử sức. Em hỏi thầy cô xem nên giữ hay đổi bớt.");
  const m = mucTieuDayDu(s);
  if (m && m.conThieu > 0 && !m.monThieu.length) ra.push(`Em còn thiếu khoảng ${so(m.conThieu)} điểm để đạt mục tiêu. Thầy cô hoặc gia đình có thể giúp em chọn cách ôn nào?`);
  if (m && m.monThieu.length) ra.push(`Em chưa có điểm ${m.monThieu.map((k) => TEN_MON[k]).join(", ")}. Thầy cô cho em xin điểm học bạ hoặc điểm thi thử gần nhất.`);
  return ra.slice(0, 5);
}

export function tomTatChiaSe(s: AppState, bayGio: Date): { muc: MucTomTat[]; vanBan: string } {
  const h = s.hoSo;
  const diem = diemDayDu(s);
  const m = mucTieuDayDu(s);
  const x = hieuEm(s);
  const muc: MucTomTat[] = [];

  const thongTin = [h.khoi && `Lớp ${h.khoi === 11 ? "10 – 11" : h.khoi}`, h.tinh, h.giaiDoan].filter(Boolean) as string[];
  if (h.nganhQuanTam.length) thongTin.push(`Quan tâm: ${h.nganhQuanTam.join(", ")}`);
  if (h.nganSach) thongTin.push(`Học phí gia đình dự kiến: ${TEN_NGAN_SACH[h.nganSach].toLowerCase()} mỗi năm`);
  if (h.choO) thongTin.push(`Chỗ ở: ${TEN_CHO_O[h.choO]}`);
  if (h.khuVuc.length) thongTin.push(`Nơi muốn học: ${h.khuVuc.join(", ")}`);
  muc.push({ tieuDe: h.hoTen.trim() ? `Hồ sơ của ${h.hoTen.trim()}` : "Hồ sơ", dong: thongTin.length ? thongTin : ["Em chưa điền thông tin cơ bản."] });

  const dongDiem = CAC_MON.filter((k) => diem[k] !== null).map((k) => `${TEN_MON[k]} ${so(diem[k]!)}`);
  muc.push({ tieuDe: "Điểm hiện tại", dong: dongDiem.length ? [dongDiem.join(" · ")] : ["Chưa nhập điểm môn nào."] });

  if (m && s.mucTieu) {
    muc.push({ tieuDe: "Mục tiêu chính", dong: [
      `${m.lc.nganh} – ${m.lc.tenTruong}`,
      `Tổ hợp ${s.mucTieu.maToHop}: đang ${so(m.hienTai)}, cần ${so(m.mucTieu)}${m.conThieu > 0 ? ` (còn thiếu ${so(m.conThieu)})` : " (đã đủ)"}`,
      ...(m.soNgayCon > 0 ? [`Còn ${m.soNgayCon} ngày đến kỳ thi`] : []),
    ] });
  } else muc.push({ tieuDe: "Mục tiêu chính", dong: ["Em chưa chọn mục tiêu chính."] });

  const ds = dungDanhSach(s.nguyenVong, diem, tim);
  muc.push({ tieuDe: `Danh sách nguyện vọng (${s.nguyenVong.length})`, dong: ds.length ? ds.map((d) => {
    if (!d.lc) return `NV${d.viTri + 1}: lựa chọn không còn trong dữ liệu`;
    const nhan: NhanNguyenVong | "chưa đủ điểm" = d.nhan ?? "chưa đủ điểm";
    return `NV${d.viTri + 1}: ${d.lc.truong} – ${d.lc.nganh} (${nhan}; điểm chuẩn ${so(d.lc.diemMin)} năm ${d.lc.namDiem})`;
  }) : ["Chưa lưu nguyện vọng nào."] });

  const cs = chiSoTheoDoi(s);
  muc.push({ tieuDe: "Tiến bộ", dong: cs.map((c) => `${c.ten}: ${c.giaTri}`) });

  const cau = cauHoiTraoDoi(s);
  if (x.luuY.length) muc.push({ tieuDe: "Điều cần lưu ý", dong: x.luuY });
  muc.push({ tieuDe: "Em muốn trao đổi", dong: cau.length ? cau : ["Em chưa có câu hỏi nào cần hỏi thêm."] });

  const ngay = `${bayGio.getDate()}/${bayGio.getMonth() + 1}/${bayGio.getFullYear()}`;
  const vanBan = [
    `NGUYỆN VỌNG AI · Bản tóm tắt ngày ${ngay}`,
    ...muc.flatMap((k) => ["", k.tieuDe.toUpperCase(), ...k.dong.map((d) => `- ${d}`)]),
    "",
    "Điểm chuẩn là số của các năm trước, lấy từ đề án tuyển sinh của trường; nhãn Thử sức/Vừa sức/An toàn/Dự phòng là gợi ý để cân nhắc, không dự đoán kết quả xét tuyển. Hãy đối chiếu với đề án chính thức của trường.",
  ].join("\n");
  return { muc, vanBan };
}

// Tính toán riêng của slice Mục tiêu. TypeScript thuần, không import React, để dễ kiểm thử và chuyển lên máy chủ sau này.
// Mọi con số "công sức" ở đây là ƯỚC TÍNH từ điểm thi thử, không phải cam kết hay xác suất.
import type { KhoangCachMon } from "@/engine/phan-tich";
import { TEN_MON, type DiemThi, type MonId } from "@/state/types";
import { dinhDang } from "@/engine/dinh-dang";

const lam1 = (n: number) => Math.round(n * 10) / 10;

/** Hiển thị điểm luôn 1 chữ số thập phân. */
export const diem1 = (n: number) => dinhDang(lam1(n), 1);

/** yyyy-mm-dd → dd/mm/yyyy. */
export function ngayVN(iso: string): string {
  const [y, m, d] = iso.split("-");
  return y && m && d ? `${d}/${m}/${y}` : iso;
}

// ---------- Điểm hiện tại lấy từ đâu ----------

/** Các môn của tổ hợp em chưa có điểm (cả hồ sơ lẫn thi thử). */
export function monChuaCoDiem(diem: Record<MonId, number | null>, toHop: MonId[]): MonId[] {
  return toHop.filter((m) => diem[m] === null || diem[m] === undefined);
}

export interface NguonDiemHienTai {
  loai: "thiThu" | "hoSo" | "tronLan";
  ngayGanNhat: string | null; // ngày thi thử gần nhất trong các môn của tổ hợp
}

/** Điểm hiện tại của tổ hợp lấy từ thi thử, từ hồ sơ, hay trộn cả hai (giống quy tắc của diemHienTaiCuaTungMon). */
export function nguonDiemHienTai(diemThi: DiemThi[], toHop: MonId[]): NguonDiemHienTai {
  const coThiThu = toHop.filter((m) => diemThi.some((d) => d.mon === m));
  const ngay = diemThi.filter((d) => toHop.includes(d.mon)).map((d) => d.ngay).sort();
  return {
    loai: coThiThu.length === toHop.length ? "thiThu" : coThiThu.length === 0 ? "hoSo" : "tronLan",
    ngayGanNhat: ngay.length ? ngay[ngay.length - 1] : null,
  };
}

// ---------- Xu hướng và công sức ----------

/** Điểm các lần thi thử gần nhất của một môn, cũ → mới (tối đa `so` lần). */
export function diemCacLanGanNhat(diemThi: DiemThi[], mon: MonId, so = 3): number[] {
  return diemThi.filter((d) => d.mon === mon).sort((a, b) => a.ngay.localeCompare(b.ngay)).slice(-so).map((d) => d.diem);
}

/** Độ dốc trung bình (điểm mỗi lần thi) của các lần gần nhất; null khi chưa đủ 2 lần. */
export function doDocXuHuong(gia: number[]): number | null {
  if (!Array.isArray(gia)) return null;
  const hopLe = gia.filter((g) => typeof g === "number" && Number.isFinite(g));
  if (hopLe.length < 2) return null;
  return lam1(((hopLe[hopLe.length - 1] - hopLe[0]) / (hopLe.length - 1)) * 10) / 10;
}

export type XuHuong = "tang" | "giu" | "giam" | "chuaRo";
export function loaiXuHuong(doc: number | null): XuHuong {
  if (doc === null) return "chuaRo";
  if (doc > 0.05) return "tang";
  if (doc < -0.05) return "giam";
  return "giu";
}
export const TEN_XU_HUONG: Record<XuHuong, string> = { tang: "đang tăng", giu: "đi ngang", giam: "đang giảm", chuaRo: "chưa đủ lần thi để biết" };

export type MucCongSuc = "thap" | "vua" | "cao";
export const TEN_CONG_SUC: Record<MucCongSuc, string> = { thap: "Thấp", vua: "Vừa", cao: "Cao" };

/** Điểm càng cao thì tăng thêm mỗi điểm càng khó (dư địa 10 - điểm hẹp lại). */
export function heSoDoKho(hienTai: number): number {
  if (hienTai >= 9) return 1.6;
  if (hienTai >= 8) return 1.3;
  if (hienTai >= 6.5) return 1;
  return 0.8;
}

/** Môn đang tăng đều thì cần ít công sức hơn; môn đang giảm cần nhiều hơn. */
export function heSoXuHuong(doc: number | null): number {
  if (doc === null) return 1;
  if (doc >= 0.3) return 0.7;
  if (doc > 0.05) return 0.85;
  if (doc <= -0.1) return 1.25;
  return 1;
}

export interface CongSuc { muc: MucCongSuc; diem: number; doKho: number; heSoXH: number; doc: number | null }

/** Công sức cần bỏ ra = điểm còn thiếu × độ khó (theo điểm hiện tại) × hệ số xu hướng. Chia 3 nấc. */
export function congSucMon(thieu: number, hienTai: number, gia: number[]): CongSuc {
  const safeThieu = typeof thieu === "number" && Number.isFinite(thieu) ? thieu : 0;
  const safeHienTai = typeof hienTai === "number" && Number.isFinite(hienTai) ? hienTai : 0;
  const doc = doDocXuHuong(gia);
  const doKho = heSoDoKho(safeHienTai);
  const heSoXH = heSoXuHuong(doc);
  // Dư địa gần hết (gần 10 điểm) mà vẫn phải tăng: luôn tính là công sức cao.
  const hetDuDia = safeThieu > 0 && 10 - safeHienTai - safeThieu < 0.3;
  const diem = Math.round(safeThieu * doKho * heSoXH * 100) / 100;
  const muc: MucCongSuc = safeThieu <= 0 ? "thap" : hetDuDia || diem >= 0.9 ? "cao" : diem >= 0.5 ? "vua" : "thap";
  return { muc, diem, doKho, heSoXH, doc };
}

// ---------- Nhãn ưu tiên ----------

export type NhanMon = "Nên ưu tiên" | "Dễ tăng" | "Giữ vững";
export const THU_TU_NHAN: Record<NhanMon, number> = { "Nên ưu tiên": 0, "Dễ tăng": 1, "Giữ vững": 2 };

export interface MonKeoDiem extends KhoangCachMon {
  nhan: NhanMon;
  congSuc: CongSuc;
  cacLan: number[];
  xuHuong: XuHuong;
}

/** Môn còn thiếu nhiều nhất (cùng mức thì giữ thứ tự tổ hợp, khớp gợi ý ở trang Hôm nay). */
export function monThieuNhieuNhat(ds: KhoangCachMon[]): KhoangCachMon | undefined {
  return [...ds].sort((a, b) => b.thieu - a.thieu)[0];
}

/**
 * Gắn nhãn và công sức cho từng môn:
 * - còn thiếu dưới 0.25 điểm → Giữ vững
 * - môn còn thiếu nhiều nhất → Nên ưu tiên
 * - các môn còn lại: công sức Cao → Nên ưu tiên, còn lại → Dễ tăng
 * Kết quả xếp theo nhãn, rồi theo điểm còn thiếu.
 */
export function phanLoaiMon(ds: KhoangCachMon[], diemThi: DiemThi[]): MonKeoDiem[] {
  const dau = monThieuNhieuNhat(ds.filter((x) => x.thieu >= 0.25));
  return ds
    .map((k) => {
      const cacLan = diemCacLanGanNhat(diemThi, k.mon);
      const congSuc = congSucMon(k.thieu, k.hienTai, cacLan);
      const nhan: NhanMon = k.thieu < 0.25 ? "Giữ vững" : k.mon === dau?.mon || congSuc.muc === "cao" ? "Nên ưu tiên" : "Dễ tăng";
      return { ...k, nhan, congSuc, cacLan, xuHuong: loaiXuHuong(congSuc.doc) };
    })
    .sort((a, b) => THU_TU_NHAN[a.nhan] - THU_TU_NHAN[b.nhan] || b.thieu - a.thieu);
}

// ---------- Câu nhận định ----------

export interface NhanDinh { tieuDe: string; moTa: string; datRoi: boolean }

/** Câu nhận định sinh từ số liệu: đã đạt / thiếu đều / thiếu chủ yếu ở một môn. */
export function nhanDinhMucTieu(ds: KhoangCachMon[], conThieu: number, hienTai: number, mucTieu: number, maToHop: string): NhanDinh {
  if (conThieu <= 0) {
    const du = lam1(hienTai - mucTieu);
    return {
      datRoi: true,
      tieuDe: "Bạn đã đạt mục tiêu rồi!",
      moTa: du > 0
        ? `Điểm dự kiến đang cao hơn mục tiêu ${diem1(du)} điểm. Giữ vững phong độ, mỗi tuần làm một đề để không bị tụt.`
        : "Điểm dự kiến đúng bằng mục tiêu. Giữ vững phong độ và luyện đề đều đặn nhé.",
    };
  }
  const xep = [...ds].sort((a, b) => b.thieu - a.thieu);
  const [nhat, nhi] = xep;
  if (!nhat) return { datRoi: false, tieuDe: "Chưa đủ dữ liệu để nhận định", moTa: "Bạn nhập điểm các môn để mình tính tiếp nhé." };
  // Hai môn đầu chênh nhau dưới 0.15 điểm: coi như thiếu đều, không nói "chủ yếu".
  if (nhi && nhat.thieu - nhi.thieu < 0.15) {
    return {
      datRoi: false,
      tieuDe: `Thiếu đều các môn ${maToHop}`,
      moTa: `Nên bắt đầu từ ${nhat.ten} (thiếu ${diem1(nhat.thieu)} điểm), rồi tới ${nhi.ten}.`,
    };
  }
  return {
    datRoi: false,
    tieuDe: `Thiếu chủ yếu ở môn ${nhat.ten}`,
    moTa: `${nhat.ten} thiếu ${diem1(nhat.thieu)} điểm, nhiều nhất trong ${maToHop}. Tập trung môn này để thu hẹp nhanh hơn.`,
  };
}

// ---------- Kiểm tra dữ liệu nhập ----------

export type KetQuaNhap<T> = { ok: true; gia: T } | { ok: false; loi: string };

/** Điểm mục tiêu: số từ 1 đến 30, chấp nhận dấu phẩy, làm tròn 1 chữ số thập phân. */
export function kiemTraDiemMucTieu(chu: string): KetQuaNhap<number> {
  const t = chu.trim().replace(",", ".");
  if (!t) return { ok: false, loi: "Bạn nhập điểm mục tiêu nhé." };
  if (!/^\d+(\.\d+)?$/.test(t)) return { ok: false, loi: "Điểm chỉ gồm chữ số, ví dụ 26 hoặc 26.5." };
  const n = Number(t);
  if (n > 30) return { ok: false, loi: "Tổng 3 môn tối đa là 30 điểm." };
  if (n < 1) return { ok: false, loi: "Điểm mục tiêu cần lớn hơn 0." };
  return { ok: true, gia: lam1(n) };
}

/** Ngày thi: đúng dạng yyyy-mm-dd, không ở quá khứ. */
export function kiemTraNgayThi(iso: string, homNay: string): KetQuaNhap<string> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso) || Number.isNaN(new Date(iso).getTime())) return { ok: false, loi: "Bạn chọn ngày thi dự kiến nhé." };
  if (iso < homNay) return { ok: false, loi: "Ngày thi đã qua. Bạn chọn một ngày từ hôm nay trở đi." };
  return { ok: true, gia: iso };
}

// ---------- Gợi ý nội dung tuần này ----------

/** Nội dung ôn phổ biến theo chương trình THPT, dùng làm gợi ý (không phải lịch học bắt buộc). */
export const NOI_DUNG_ON: Record<MonId, string[]> = {
  toan: ["Ôn chuyên đề hàm số và đồ thị (Toán)", "Làm 1 đề Toán tính giờ, chữa câu sai", "Luyện xác suất và thống kê (Toán)"],
  vatLy: ["Luyện bài tập vật lí nhiệt, khí lí tưởng", "Ôn từ trường và làm 10 câu cơ bản (Lý)", "Làm 1 đề Vật lý tính giờ, chữa câu sai"],
  hoaHoc: ["Ôn este – lipit và làm bài tập (Hóa)", "Luyện bài tập kim loại (Hóa)", "Làm 1 đề Hóa tính giờ, chữa câu sai"],
  sinh: ["Ôn di truyền học và làm bài tập (Sinh)", "Ôn tiến hóa và sinh thái (Sinh)", "Làm 1 đề Sinh tính giờ, chữa câu sai"],
  nguVan: ["Luyện đọc hiểu 2 văn bản (Văn)", "Lập dàn ý 2 đề nghị luận xã hội", "Viết 1 bài nghị luận văn học, tự chấm theo dàn ý"],
  tiengAnh: ["Làm 3 bài đọc hiểu Tiếng Anh, ghi từ mới", "Ôn câu điều kiện, mệnh đề quan hệ (Anh)", "Làm 1 đề Tiếng Anh và chữa lỗi sai"],
};

/** Gợi ý chiến lược ôn tập tuần này: cá nhân hóa theo mức điểm, khoảng thiếu và môn ưu tiên; đạt mục tiêu thì gợi ý giữ phong độ. */
export function goiYTuanNay(
  ds: { mon: MonId; thieu: number; hienTai?: number; mucTieu?: number; xuHuong?: string }[],
  so = 3
): { mon: MonId; noiDung: string }[] {
  const canTang = ds.filter((x) => x.thieu > 0);
  const ra: { mon: MonId; noiDung: string }[] = [];

  if (canTang.length > 0) {
    for (let vong = 0; ra.length < so && vong < 3; vong++) {
      for (const x of canTang) {
        if (ra.length >= so) break;
        const tenMon = TEN_MON[x.mon];
        const mucDiem = x.hienTai ?? 7;
        let nd: string;
        if (vong === 0) {
          nd = mucDiem < 7
            ? `Củng cố chắc kiến thức nhận biết – thông hiểu ${tenMon} (đúng trọn 30 câu đầu, bù +${diem1(x.thieu)}đ)`
            : mucDiem >= 8.5
              ? `Luyện chuyên đề phân loại 8.5+ môn ${tenMon} và rà soát bẫy đề thi (+${diem1(x.thieu)}đ)`
              : `${NOI_DUNG_ON[x.mon][0]} (mục tiêu bù +${diem1(x.thieu)}đ)`;
        } else if (vong === 1) {
          nd = `Làm đề ${tenMon} bấm giờ, chữa kỹ các câu sai để bù điểm`;
        } else {
          nd = NOI_DUNG_ON[x.mon][2] ?? `Rà soát bẫy lý thuyết môn ${tenMon}`;
        }
        ra.push({ mon: x.mon, noiDung: nd });
      }
    }
  } else {
    // Đã đạt mục tiêu: Gợi ý duy trì phong độ và phản xạ làm bài
    for (let i = 0; i < ds.length && ra.length < so; i++) {
      const x = ds[i];
      const tenMon = TEN_MON[x.mon];
      const nd = i === 0
        ? `Làm 1 đề ${tenMon} chuẩn thời gian, chữa kỹ các câu sai để duy trì phong độ`
        : i === 1
          ? `Rà soát lại các dạng bài hay nhầm lẫn ở lần thi thử gần nhất (${tenMon})`
          : `Ôn nhanh sơ đồ công thức then chốt môn ${tenMon}`;
      ra.push({ mon: x.mon, noiDung: nd });
    }
  }

  while (ra.length < so && ds.length > 0) {
    const x = ds[ra.length % ds.length];
    ra.push({ mon: x.mon, noiDung: `Luyện 1 đề ${TEN_MON[x.mon]} tính giờ để giữ nhịp` });
  }

  return ra.slice(0, so);
}

/** Tổng các phần bù (sau làm tròn) và độ lệch so với khoảng cách tổng. */
export function tongPhanBu(ds: { thieu: number }[], conThieu: number) {
  const tong = lam1(ds.reduce((s, x) => s + x.thieu, 0));
  return { tong, lech: lam1(tong - conThieu) };
}

/** "Toán – Vật lý – Tiếng Anh" */
export const tenToHop = (toHop: MonId[]) => toHop.map((m) => TEN_MON[m]).join(" – ");

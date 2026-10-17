// Sinh "việc cần học" của một tuần từ mục tiêu thật của em: môn nào còn thiếu điểm, xu hướng thi thử, thời gian tự học còn trống.
// TypeScript thuần, không React. Không có việc nào viết sẵn cho mọi người: mọi con số trong lý do đều tính từ điểm của em.
import { khoangCachTheoMon } from "@/engine/phan-tich";
import { HO_SO_MON, khungBuoi } from "@/engine/ho-so-mon";
import { phanBoGioHoc } from "@/engine/phan-bo-gio-hoc";
import { TEN_MON, type MonId, type TamTrang, type ViecCanHoc } from "@/state/types";

/** Nội dung ôn phổ biến theo chương trình THPT, dùng để gợi ý chủ đề (không phải lịch học bắt buộc). Xoay vòng theo tuần. */
export const NOI_DUNG_ON: Record<MonId, string[]> = {
  toan: ["Ôn chuyên đề hàm số và đồ thị", "Luyện xác suất và thống kê", "Ôn mũ, logarit và bất phương trình", "Luyện hình học không gian", "Ôn tích phân và ứng dụng", "Ôn số phức và tổ hợp"],
  vatLy: ["Luyện bài tập vật lí nhiệt, khí lí tưởng", "Ôn từ trường và dòng điện", "Ôn dao động và sóng", "Luyện điện xoay chiều", "Ôn vật lí hạt nhân và sóng ánh sáng"],
  hoaHoc: ["Ôn este và lipit", "Luyện bài tập kim loại", "Ôn cacbohiđrat, amin, amino axit", "Luyện hóa vô cơ và điện phân", "Ôn polime và vật liệu"],
  sinh: ["Ôn di truyền học", "Ôn tiến hóa và sinh thái", "Luyện bài tập quy luật di truyền", "Ôn cơ chế di truyền cấp phân tử"],
  nguVan: ["Luyện đọc hiểu văn bản", "Lập dàn ý nghị luận xã hội", "Viết bài nghị luận văn học", "Ôn các tác phẩm thơ trọng tâm", "Ôn các tác phẩm văn xuôi trọng tâm"],
  tiengAnh: ["Luyện đọc hiểu và ghi từ mới", "Ôn câu điều kiện, mệnh đề quan hệ", "Luyện ngữ pháp và từ vựng theo chủ đề", "Luyện viết lại câu và tìm lỗi sai"],
};

export interface DauVaoViecTuan {
  toHop: MonId[];
  diem: Record<MonId, number | null>;
  diemMucTieu: number;
  canCaiThien: string[];
  mucTieuTruong?: string;
  mucTieuNganh?: string;
  /** Độ dốc điểm thi thử gần đây của từng môn (điểm mỗi lần thi); thiếu thì bỏ qua. */
  doDoc?: Partial<Record<MonId, number | null>>;
  tuan: string; // thứ 2 của tuần, yyyy-mm-dd
  chiSoTuan: number; // số tuần từ một mốc cố định, để xoay chủ đề mỗi tuần
  phutTuHoc: number; // thời gian tự học còn trống trong tuần
  tamTrang?: TamTrang;
  ngayConDenThi?: number;
  /** Lớp em đang học; mặc định 12. Lớp 11 không ghi "sách giáo khoa 12". */
  lop?: 11 | 12;
  /** Ôn nhẹ khi em chưa có mục tiêu: không nói về phần thiếu điểm, ngân sách tối đa NGAN_SACH_ON_NHE phút. */
  nhe?: boolean;
  /** Tiến độ nắm vững chuyên đề theo tự đánh giá của em. */
  tienDoKienThuc?: Record<string, "chuaHoc" | "dangHoc" | "namVung" | "canOnTap">;
}

export const NGAN_SACH_ON_NHE = 4 * 60;

/** Tiêu đề buổi đầu theo đúng lượng đề em làm được trong thời gian đó (không hứa "1 đề" khi chỉ đủ nửa đề). */
export function tenPhanDe(phutLamDe: number): string {
  if (phutLamDe >= 90) return "làm 1 đề tính giờ";
  if (phutLamDe >= 45) return "làm nửa đề tính giờ";
  return "làm một phần đề tính giờ";
}

const lam15 = (n: number) => Math.round(n / 15) * 15;
const so = (n: number) => (Math.round(n * 10) / 10).toFixed(1).replace(".", ",");

/** Ngân sách phút cho việc của tuần: dùng 80% thời gian trống (chừa chỗ dời lịch), mệt thì giảm một nửa, không quá 20 giờ. */
export function nganSachPhut(phutTuHoc: number, tam: TamTrang = "binhThuong"): number {
  if (!Number.isFinite(phutTuHoc) || phutTuHoc <= 0) return 0;
  const he = tam === "met" ? 0.5 : tam === "tot" ? 0.9 : 0.8;
  return Math.min(20 * 60, lam15(phutTuHoc * he));
}

export function taoViecTuan(dv: DauVaoViecTuan): ViecCanHoc[] {
  const kc = khoangCachTheoMon(dv.diem, dv.toHop, dv.nhe ? 0 : dv.diemMucTieu, dv.canCaiThien);
  const lop = dv.lop ?? 12;
  const nganDay = nganSachPhut(dv.phutTuHoc, dv.tamTrang);
  const ngan = dv.nhe ? Math.min(NGAN_SACH_ON_NHE, nganDay) : nganDay;
  if (ngan < 45 || kc.length === 0) return [];

  // Trọng số: phần còn thiếu + một nền nhỏ để môn đã đủ điểm vẫn được giữ nhịp; môn đang đi xuống được cộng thêm.
  const pb = phanBoGioHoc({ mon: dv.toHop, diem: dv.diem, mucTieuTong: dv.nhe ? 0 : dv.diemMucTieu, quyPhutTuan: ngan, soNgayConDenThi: dv.ngayConDenThi, doDoc: dv.doDoc, canCaiThien: dv.canCaiThien });
  const trongSo = kc.map((k) => {
    const doc = dv.doDoc?.[k.mon];
    const dangXuong = doc !== null && doc !== undefined && doc <= -0.1;
    const chuaCoDiem = dv.diem[k.mon] === null;
    // Giờ của môn lấy từ bộ chia giờ theo hiệu quả biên (engine/phan-bo-gio-hoc), dùng chung với màn Chiến lược.
    return { k, w: (pb.phanBo.find((p) => p.mon === k.mon)?.phutMoiTuan ?? 0) + 1, dangXuong, chuaCoDiem };
  });
  const tongW = trongSo.reduce((s, x) => s + x.w, 0);
  if (tongW <= 0) return [];
  let phan = trongSo.map((x) => ({ ...x, phut: Math.max(45, lam15((ngan * x.w) / tongW)) }));
  // Vượt ngân sách thì bớt dần ở môn có trọng số thấp nhất (không bỏ hẳn môn nào dưới 45 phút nếu còn chỗ).
  let tong = phan.reduce((s, x) => s + x.phut, 0);
  while (tong > ngan && phan.length > 0) {
    const yeuNhat = [...phan].sort((a, b) => a.w - b.w)[0];
    if (yeuNhat.phut - 15 >= 45) { yeuNhat.phut -= 15; tong -= 15; }
    else { phan = phan.filter((x) => x !== yeuNhat); tong -= yeuNhat.phut; }
  }
  if (phan.length === 0) return [];

  const thieuLonNhat = Math.max(...phan.map((x) => x.k.thieu));
  const ra: ViecCanHoc[] = [];
  for (const x of phan.sort((a, b) => b.k.thieu - a.k.thieu || b.w - a.w)) {
    const { k } = x;
    const mucUuTien: ViecCanHoc["mucUuTien"] = (k.thieu >= 0.6 || (k.thieu > 0 && k.thieu === thieuLonNhat && thieuLonNhat >= 0.25)) ? "cao" : k.thieu >= 0.25 || x.dangXuong ? "vua" : "thap";
    // Chia số phút của môn thành các buổi ≤ 90 phút: buổi đầu là đề tính giờ, các buổi sau là chuyên đề (xoay theo tuần).
    let con = x.phut;
    for (let i = 0; con > 0; i++) {
      const phut = con > Math.max(45, HO_SO_MON[k.mon].buoiToiUuPhut) + 25 ? Math.max(45, HO_SO_MON[k.mon].buoiToiUuPhut) : con;
      con -= phut;
      const deTinhGio = i === 0;
      const chuDeCanOn = dv.tienDoKienThuc
        ? Object.entries(dv.tienDoKienThuc).find(([ten, td]) => td === "canOnTap" && NOI_DUNG_ON[k.mon]?.includes(ten))?.[0]
        : undefined;
      const kieu = HO_SO_MON[k.mon].kieu;
      // Toán/Lý: buổi đầu là bài tính giờ, các buổi sau theo chuyên đề. Môn khác: mọi buổi đều theo chuyên đề (ôn nhớ, viết bài, từ vựng).
      const chuDe = ((!deTinhGio || kieu !== "giaiBai") && chuDeCanOn)
        ? chuDeCanOn
        : NOI_DUNG_ON[k.mon][(dv.chiSoTuan + i) % NOI_DUNG_ON[k.mon].length];
      const khung = khungBuoi(kieu, phut, { chuDe: deTinhGio && kieu === "giaiBai" ? undefined : chuDe, dauTuan: deTinhGio, suaLoi: x.dangXuong && deTinhGio });
      const tieuDe = deTinhGio && kieu === "giaiBai" ? `${TEN_MON[k.mon]} – ${tenPhanDe(khung.cacBuoc[1]?.phut ?? lam15(phut * 0.55))}` : `${TEN_MON[k.mon]} – ${khung.tieuDe}`;
      const lyDo = x.chuaCoDiem
        ? `Bạn chưa có điểm ${TEN_MON[k.mon]}, nên mình chưa biết bạn thiếu bao nhiêu. Làm đề tính giờ (đủ cả đề càng tốt) để có điểm đầu vào cho môn này.`
        : dv.nhe
          ? `${TEN_MON[k.mon]} đang ${so(k.hienTai)} điểm. Bạn chưa chọn mục tiêu nên mình chỉ gợi ý ôn nhẹ để giữ nhịp, chưa tính phần còn thiếu.`
        : k.thieu > 0
          ? `${TEN_MON[k.mon]} đang ${so(k.hienTai)} điểm, cần khoảng ${so(k.mucTieu)} để tổ hợp đạt ${so(dv.diemMucTieu)} điểm${dv.mucTieuNganh && dv.mucTieuTruong ? ` (xét ${dv.mucTieuNganh} – ${dv.mucTieuTruong})` : ""} (còn thiếu ${so(k.thieu)}).${x.dangXuong ? " Điểm thi thử gần đây của môn này đang giảm, nên cần ôn đều hơn." : ""}${dv.ngayConDenThi !== undefined && dv.ngayConDenThi > 0 ? ` Còn ${dv.ngayConDenThi} ngày đến kỳ thi.` : ""}`
          : `${TEN_MON[k.mon]} đã đủ mức cần cho mục tiêu (${so(k.hienTai)} điểm)${dv.mucTieuNganh && dv.mucTieuTruong ? ` (xét ${dv.mucTieuNganh} – ${dv.mucTieuTruong})` : ""}. Giữ nhịp để điểm không tụt.`;
      ra.push({
        id: `v-${dv.tuan}-${k.mon}-${i}`, tuan: dv.tuan, mon: k.mon, tieuDe,
        chiTiet: khung.chiTiet,
        phut, mucUuTien: dv.nhe ? "thap" : i === 0 ? mucUuTien : mucUuTien === "cao" ? "vua" : "thap", lyDo,
        mucTieuBuoi: khung.mucTieuBuoi,
        cacBuoc: khung.cacBuoc,
        tieuChi: khung.tieuChi,
        taiLieu: [{ ten: lop === 11 ? `Sách giáo khoa ${TEN_MON[k.mon]} (chương trình bạn đang học)` : `Sách giáo khoa ${TEN_MON[k.mon]} 12` }, { ten: "Đề minh họa và đề thi thử gần nhất bạn đã có" }],
      });
    }
  }
  return ra;
}

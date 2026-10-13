// Sinh "việc cần học" của một tuần từ mục tiêu thật của em: môn nào còn thiếu điểm, xu hướng thi thử, thời gian tự học còn trống.
// TypeScript thuần, không React. Không có việc nào viết sẵn cho mọi người: mọi con số trong lý do đều tính từ điểm của em.
import { khoangCachTheoMon } from "@/engine/phan-tich";
import { TEN_MON, TEN_MON_NGAN, type MonId, type TamTrang, type ViecCanHoc } from "@/state/types";

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
  const trongSo = kc.map((k) => {
    const doc = dv.doDoc?.[k.mon];
    const dangXuong = doc !== null && doc !== undefined && doc <= -0.1;
    const chuaCoDiem = dv.diem[k.mon] === null;
    return { k, w: k.thieu + 0.3 + (dangXuong ? 0.25 : 0) + (chuaCoDiem ? 0.3 : 0), dangXuong, chuaCoDiem };
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
      const phut = con > 90 + 25 ? 90 : con;
      con -= phut;
      const deTinhGio = i === 0;
      const chuDe = NOI_DUNG_ON[k.mon][(dv.chiSoTuan + i) % NOI_DUNG_ON[k.mon].length];
      const tieuDe = deTinhGio ? `${TEN_MON[k.mon]} – ${tenPhanDe(lam15(phut * 0.6))}, chữa câu sai` : `${TEN_MON[k.mon]} – ${chuDe[0].toLowerCase()}${chuDe.slice(1)}`;
      const pLam = deTinhGio ? lam15(phut * 0.6) : lam15(phut * 0.55), pChua = deTinhGio ? lam15(phut * 0.35) : lam15(phut * 0.35);
      const pCuoi = Math.max(5, phut - pLam - pChua);
      const lyDo = x.chuaCoDiem
        ? `Em chưa có điểm ${TEN_MON[k.mon]}, nên mình chưa biết em thiếu bao nhiêu. Làm đề tính giờ (đủ cả đề càng tốt) để có điểm đầu vào cho môn này.`
        : dv.nhe
          ? `${TEN_MON[k.mon]} đang ${so(k.hienTai)} điểm. Em chưa chọn mục tiêu nên mình chỉ gợi ý ôn nhẹ để giữ nhịp, chưa tính phần còn thiếu.`
        : k.thieu > 0
          ? `${TEN_MON[k.mon]} đang ${so(k.hienTai)} điểm, cần khoảng ${so(k.mucTieu)} để tổ hợp đạt ${so(dv.diemMucTieu)} điểm (còn thiếu ${so(k.thieu)}).${x.dangXuong ? " Điểm thi thử gần đây của môn này đang giảm, nên cần ôn đều hơn." : ""}${dv.ngayConDenThi !== undefined && dv.ngayConDenThi > 0 ? ` Còn ${dv.ngayConDenThi} ngày đến kỳ thi.` : ""}`
          : `${TEN_MON[k.mon]} đã đủ mức cần cho mục tiêu (${so(k.hienTai)} điểm). Giữ nhịp để điểm không tụt.`;
      ra.push({
        id: `v-${dv.tuan}-${k.mon}-${i}`, tuan: dv.tuan, mon: k.mon, tieuDe,
        chiTiet: deTinhGio ? `${pLam}' làm đề + ${pChua}' chữa câu sai.` : `${chuDe} · ${pLam}' ôn và làm bài + ${pChua}' chữa lỗi.`,
        phut, mucUuTien: dv.nhe ? "thap" : i === 0 ? mucUuTien : mucUuTien === "cao" ? "vua" : "thap", lyDo,
        mucTieuBuoi: deTinhGio ? `Biết điểm thật của ${TEN_MON_NGAN[k.mon]} lúc này và các dạng bài hay sai, để biết tuần sau ôn gì.` : `Nắm chắc phần "${chuDe.toLowerCase()}" và làm đúng các câu cơ bản.`,
        cacBuoc: [{ phut: pLam, ten: deTinhGio ? "Làm đề" : "Ôn và làm bài" }, { phut: pChua, ten: "Chữa câu sai" }, { phut: pCuoi, ten: "Tóm tắt lỗi hay gặp" }],
        tieuChi: deTinhGio
          ? ["Làm xong phần đề đã chọn trong đúng thời gian quy định.", "Ghi mỗi câu sai kèm nguyên nhân: chưa nhớ công thức, đọc sai đề hay tính nhầm.", "Đánh dấu 3 dạng bài cần ôn lại."]
          : ["Nhắc lại được ý chính hoặc công thức mà không nhìn sách.", "Làm đúng ít nhất 80% số câu cơ bản.", "Ghi lại các câu còn sai để ôn lại sau 2 ngày."],
        taiLieu: [{ ten: lop === 11 ? `Sách giáo khoa ${TEN_MON[k.mon]} (chương trình em đang học)` : `Sách giáo khoa ${TEN_MON[k.mon]} 12` }, { ten: "Đề minh họa và đề thi thử gần nhất em đã có" }],
      });
    }
  }
  return ra;
}

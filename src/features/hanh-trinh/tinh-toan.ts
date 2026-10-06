// Tính toán thuần (không React) cho Hôm nay và Hồ sơ. Đầu vào là AppState, đầu ra là dữ liệu để vẽ.
import { congNgay, isoNgay, phutTuGio, taoNgay, thuCuaNgay } from "@/engine/xep-lich";
import { DUONG_DAN } from "@/duong-dan";
import { diemHienTaiCuaTungMon, type AppState } from "@/state/store";
import { khoangCachCuaToi, khoiTrongNgay, mucTieuDayDu, viecConLai } from "@/state/chon";
import { CAC_MON, TEN_MON, TEN_MON_NGAN, type MonId, type ViecCanHoc } from "@/state/types";

const TEN_THU = ["", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ nhật"];
const THU_NGAN = ["", "T2", "T3", "T4", "T5", "T6", "T7", "CN"];

/** "Thứ Hai, 5/10" */
export function nhanNgay(iso: string) {
  const d = taoNgay(iso);
  return `${TEN_THU[thuCuaNgay(iso)]}, ${d.getDate()}/${d.getMonth() + 1}`;
}
const ngayNgan = (iso: string) => { const d = taoNgay(iso); return `${d.getDate()}/${d.getMonth() + 1}`; };
export const ngayDayDu = (iso: string) => { const d = taoNgay(iso); return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`; };
const lam1 = (n: number) => (Math.round(n * 10) / 10).toFixed(1).replace(".", ",");
const viThuong = (x: string) => x.charAt(0).toLowerCase() + x.slice(1);
const noi = (a: string[]) => (a.length <= 1 ? a.join("") : `${a.slice(0, -1).join(", ")} và ${a[a.length - 1]}`);

// ---------------- Hôm nay ----------------

export interface ViecTrongNgay { viec: ViecCanHoc; batDau: string; ketThuc: string; phut: number; xong: boolean }

/**
 * Việc của một ngày: các khối tự học trong ngày có gắn với một việc trong s.viec.
 * Một việc bị chia thành nhiều buổi trong cùng ngày thì gộp lại (cộng phút, lấy giờ bắt đầu sớm nhất).
 * Khối "xem trước bài" không gắn việc nào nên không có ô tick, không tính ở đây.
 */
export function viecTrongNgay(s: AppState, ngay: string): ViecTrongNgay[] {
  const gop = new Map<string, ViecTrongNgay>();
  for (const k of khoiTrongNgay(s, ngay)) {
    if (k.loai !== "tuHoc" || !k.viecId) continue;
    const v = s.viec.find((x) => x.id === k.viecId);
    if (!v || s.trangThaiViec[v.id] === "boQua") continue;
    const phut = phutTuGio(k.ketThuc) - phutTuGio(k.batDau);
    const co = gop.get(v.id);
    if (co) { co.phut += phut; co.ketThuc = k.ketThuc > co.ketThuc ? k.ketThuc : co.ketThuc; }
    else gop.set(v.id, { viec: v, batDau: k.batDau, ketThuc: k.ketThuc, phut, xong: s.trangThaiViec[v.id] === "xong" });
  }
  return [...gop.values()].sort((a, b) => a.batDau.localeCompare(b.batDau));
}

export interface MucLich { id: string; ten: string; khi: string; tone: "xanh" | "cam" | "tim" }

/**
 * Các mục lịch sắp tới (từ thời điểm `bayGio`): buổi tự học đã xếp và tiết cố định trong 7 ngày tới.
 * Tiết chính khóa lặp lại mỗi ngày nên bỏ qua, chỉ lấy học thêm và hoạt động khác cho đỡ rối.
 */
export function lichSapToi(s: AppState, bayGio: Date, soMuc = 2): MucLich[] {
  const homNay = isoNgay(bayGio);
  const gio = `${String(bayGio.getHours()).padStart(2, "0")}:${String(bayGio.getMinutes()).padStart(2, "0")}`;
  const sau = (ngay: string, batDau: string) => ngay > homNay || (ngay === homNay && batDau >= gio);
  const khi = (ngay: string, batDau: string) =>
    `${ngay === homNay ? "Hôm nay" : ngay === congNgay(homNay, 1) ? "Ngày mai" : `${THU_NGAN[thuCuaNgay(ngay)]} ${ngayNgan(ngay)}`} · ${batDau}`;

  const ds: (MucLich & { khoa: string })[] = [];
  for (const k of s.khoiHoc) {
    if (k.loai === "nghi" || !sau(k.ngay, k.batDau)) continue;
    if (k.viecId && ["xong", "boQua"].includes(s.trangThaiViec[k.viecId] ?? "")) continue;
    ds.push({ id: k.id, ten: k.ten, khi: khi(k.ngay, k.batDau), tone: "xanh", khoa: k.ngay + k.batDau });
  }
  for (let i = 0; i < 7; i++) {
    const ngay = congNgay(homNay, i);
    for (const t of s.coDinh) {
      if (t.loai === "chinhKhoa" || t.thu !== thuCuaNgay(ngay) || !sau(ngay, t.batDau)) continue;
      ds.push({ id: `${t.id}-${ngay}`, ten: t.ten, khi: khi(ngay, t.batDau), tone: t.loai === "hocThem" ? "cam" : "tim", khoa: ngay + t.batDau });
    }
  }
  return ds.sort((a, b) => a.khoa.localeCompare(b.khoa)).slice(0, soMuc).map(({ khoa: _, ...m }) => m);
}

/** Câu gợi ý ngắn cho em: môn kéo điểm nhiều nhất, hoặc lời giữ nhịp khi đã chạm mục tiêu. */
export function goiYChoEm(s: AppState): { moTa: string; den: string } | null {
  const m = mucTieuDayDu(s);
  if (!m) return null;
  const chuaCo = monThieuDiem(s, m.toHop);
  if (chuaCo.length) {
    return { moTa: `Em nhập điểm ${noi(chuaCo.map((x) => TEN_MON[x]))} để mình tính đúng em còn thiếu bao nhiêu và nên ưu tiên môn nào.`, den: DUONG_DAN.batDau(2) };
  }
  const mon = [...khoangCachCuaToi(s)].sort((a, b) => b.thieu - a.thieu)[0];
  if (mon && mon.thieu > 0) {
    return { moTa: `${mon.ten} còn thiếu khoảng ${lam1(mon.thieu)} điểm so với mức cần. Dành thêm thời gian cho môn này sẽ giúp em gần mục tiêu nhanh nhất.`, den: DUONG_DAN.monKeoDiem() };
  }
  return { moTa: `Điểm hiện tại đã chạm mức ${lam1(m.mucTieu)}. Em giữ nhịp ôn đều và thử thêm đề khó hơn nhé.`, den: DUONG_DAN.tienDo() };
}

/** Các môn trong tổ hợp mục tiêu mà em chưa có điểm (tổng điểm đang tính thiếu). */
export function monThieuDiem(s: AppState, toHop: MonId[]) {
  const d = diemHienTaiCuaTungMon(s);
  return toHop.filter((m) => d[m] === null);
}

// ---------------- Hồ sơ: "Hệ thống hiểu em" ----------------

/** Xu hướng điểm thi thử của từng môn: chênh lệch giữa lần đầu và lần gần nhất, và giữa hai lần gần nhất. */
function xuHuongMon(s: AppState) {
  const theoMon = new Map<MonId, number[]>();
  for (const d of [...s.diemThi].sort((a, b) => a.ngay.localeCompare(b.ngay))) theoMon.set(d.mon, [...(theoMon.get(d.mon) ?? []), d.diem]);
  return [...theoMon.entries()].filter(([, a]) => a.length >= 2).map(([mon, a]) => ({
    mon, soLan: a.length, tongTang: a[a.length - 1] - a[0], lanCuoi: a[a.length - 1] - a[a.length - 2],
  }));
}

export interface MucBoSung { ten: string; den: string }
export interface HieuEm {
  manh: string[];
  luuY: string[];
  uuTien: string[];
  boSung: MucBoSung[];
  /** Phần trăm hồ sơ đã có, tính trên các mục ở danh sách kiểm. */
  dayDu: number;
}

/** Nhận xét tự động về em, sinh hoàn toàn từ dữ liệu em đã nhập. Không có câu nào viết sẵn cho mọi người. */
export function hieuEm(s: AppState): HieuEm {
  const h = s.hoSo;
  const diem = diemHienTaiCuaTungMon(s);
  const coDiem = CAC_MON.filter((m) => diem[m] !== null).sort((a, b) => diem[b]! - diem[a]!);
  const xu = xuHuongMon(s);
  const m = mucTieuDayDu(s);
  const kc = khoangCachCuaToi(s);

  // Điểm mạnh
  const manh: string[] = [];
  const monTot = coDiem.filter((x) => diem[x]! >= 8).slice(0, 2);
  if (monTot.length) manh.push(`${noi(monTot.map((x) => TEN_MON[x]))} đang vững (${monTot.map((x) => lam1(diem[x]!)).join(" và ")} điểm)`);
  else if (coDiem.length) manh.push(`${TEN_MON[coDiem[0]]} là môn tốt nhất của em lúc này (${lam1(diem[coDiem[0]]!)} điểm)`);
  const tangNhat = xu.filter((x) => x.tongTang >= 0.3).sort((a, b) => b.tongTang - a.tongTang)[0];
  if (tangNhat) manh.push(`${TEN_MON[tangNhat.mon]} tăng ${lam1(tangNhat.tongTang)} điểm qua ${tangNhat.soLan} lần thi thử`);
  if (h.diemManh.length) manh.push(`Em thấy mình mạnh về ${noi(h.diemManh.slice(0, 3).map(viThuong))}`);

  // Điều cần lưu ý
  const luuY: string[] = [];
  if (m) {
    const thieu = monThieuDiem(s, m.toHop);
    if (thieu.length) luuY.push(`Chưa có điểm ${noi(thieu.map((x) => TEN_MON[x]))} nên tổng điểm đang tính thiếu`);
    // Môn còn thiếu đáng kể (từ mức "vừa" trở lên), môn thiếu nhiều nhất lên trước.
    for (const k of kc.filter((x) => x.uuTien !== "duyTri" && diem[x.mon] !== null).sort((a, b) => b.thieu - a.thieu).slice(0, 2)) {
      luuY.push(`${k.ten} cần thêm khoảng ${lam1(k.thieu)} điểm (đang ${lam1(k.hienTai)})`);
    }
  } else if (coDiem.length >= 2 && diem[coDiem[coDiem.length - 1]]! < 7) {
    const x = coDiem[coDiem.length - 1];
    luuY.push(`${TEN_MON[x]} đang thấp nhất (${lam1(diem[x]!)} điểm)`);
  }
  const giam = xu.filter((x) => x.lanCuoi <= -0.3).sort((a, b) => a.lanCuoi - b.lanCuoi)[0];
  if (giam) luuY.push(`${TEN_MON[giam.mon]} giảm ${lam1(-giam.lanCuoi)} điểm ở lần thi thử gần nhất`);
  const kyNang = h.canCaiThien.filter((x) => !Object.values(TEN_MON).includes(x));
  if (kyNang.length) luuY.push(`Em muốn rèn thêm ${noi(kyNang.slice(0, 2).map(viThuong))}`);
  if (m && m.soNgayCon > 0 && m.soNgayCon <= 60) luuY.push(`Chỉ còn ${m.soNgayCon} ngày đến kỳ thi`);

  // Ưu tiên hiện tại
  const uuTien: string[] = [];
  if (m) {
    uuTien.push(`Đạt ${lam1(m.mucTieu)} điểm tổ hợp ${s.mucTieu!.maToHop} để vào ${m.lc.nganh} – ${m.lc.truong}`);
    const keo = [...kc].sort((a, b) => b.thieu - a.thieu)[0];
    if (keo && keo.thieu > 0) uuTien.push(`Nâng ${keo.ten} trước, môn này kéo điểm nhiều nhất`);
    const tiep = viecConLai(s)[0];
    if (tiep) uuTien.push(`Việc tuần này nên làm trước: ${tiep.tieuDe}`);
    else if (h.khoi === 12 && m.soNgayCon > 0) uuTien.push(`Ôn thi THPT, còn ${m.soNgayCon} ngày`);
  } else {
    uuTien.push(h.nganhQuanTam.length ? `Tìm hiểu ngành ${noi(h.nganhQuanTam)} để chọn mục tiêu chính` : "Chọn một ngành em muốn theo");
    if (coDiem.length < CAC_MON.length) uuTien.push("Nhập đủ điểm các môn để biết tổ hợp nào hợp với em");
    if (h.khoi === 11) uuTien.push("Giữ điểm học bạ lớp 10–11 đều các môn");
    else if (h.khoi === 12) uuTien.push("Chuẩn bị cho kỳ thi THPT");
  }

  // Thông tin nên bổ sung: danh sách kiểm, mỗi mục chỉ tới đúng nơi điền
  const b1 = DUONG_DAN.batDau(1), b2 = DUONG_DAN.batDau(2), b3 = DUONG_DAN.batDau(3);
  const chuaCoDiem = CAC_MON.filter((x) => diem[x] === null);
  const kiem: [boolean, MucBoSung][] = [
    [!!h.hoTen.trim(), { ten: "Họ và tên", den: b1 }],
    [h.khoi !== null, { ten: "Lớp đang học", den: b1 }],
    [!!h.tinh, { ten: "Tỉnh/thành phố", den: b1 }],
    [h.nganhQuanTam.length > 0, { ten: "Nhóm ngành quan tâm", den: b1 }],
    [chuaCoDiem.length === 0, { ten: chuaCoDiem.length === CAC_MON.length ? "Điểm các môn" : `Điểm ${chuaCoDiem.map((x) => TEN_MON_NGAN[x]).join(", ")}`, den: b2 }],
    [h.diemManh.length > 0, { ten: "Điểm mạnh của em", den: b2 }],
    [h.nganSach !== null, { ten: "Mức học phí gia đình chi trả được", den: b3 }],
    [h.khuVuc.length > 0, { ten: "Nơi em muốn học", den: b3 }],
    [h.choO !== null, { ten: "Chỗ ở dự kiến", den: b3 }],
    [h.hocXaNha !== null, { ten: "Có học xa nhà được không", den: b3 }],
    [s.mucTieu !== null, { ten: "Mục tiêu chính", den: DUONG_DAN.khamPha() }],
    [s.diemThi.length > 0, { ten: "Điểm thi thử gần nhất", den: DUONG_DAN.diemThiThu() }],
    [s.coDinh.length > 0, { ten: "Lịch học ở trường", den: DUONG_DAN.caiDatLichHoc() }],
  ];
  const boSung = kiem.filter(([ok]) => !ok).map(([, x]) => x);
  return { manh, luuY, uuTien, boSung, dayDu: Math.round(((kiem.length - boSung.length) / kiem.length) * 100) };
}

export const TEN_NGAN_SACH: Record<string, string> = { duoi30: "Dưới 30 triệu", "30-60": "30 – 60 triệu", "60-100": "60 – 100 triệu", tren100: "Trên 100 triệu" };
export const TEN_CHO_O: Record<string, string> = { oNha: "ở nhà", oTro: "ở trọ", kyTucXa: "ký túc xá" };

/** Hai chữ cái đại diện cho tên: "Nguyễn Minh Anh" -> "MA". */
export function chuDaiDien(hoTen: string) {
  const p = hoTen.trim().split(/\s+/).filter(Boolean);
  if (!p.length) return "";
  return p.slice(-2).map((x) => x[0]).join("").toUpperCase();
}

// Tính toán thuần (không React) cho Hôm nay và Hồ sơ. Đầu vào là AppState, đầu ra là dữ liệu để vẽ.
import { khongRoNet, moTaTop } from "@/features/huong-nghiep/cau-hoi";
import { congNgay, isoNgay, phutTuGio, taoNgay, thuCuaNgay } from "@/engine/xep-lich";
import { DUONG_DAN } from "@/duong-dan";
import { diemHienTaiCuaTungMon, type AppState } from "@/state/store";
import { khoangCachCuaToi, khoiTrongNgay, mucTieuDayDu, viecConLai } from "@/state/chon";
import { changCuaEm, type Chang } from "@/state/chang";
import { tim } from "@/data/lua-chon-mau";
import { diemDayDu } from "@/features/kham-pha/to-hop";
import { THANH_PHO } from "@/features/khoi-dau/lua-chon";
import { demNhan, dungDanhSach, xetCoCau } from "@/features/nguyen-vong/tinh-toan";
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

export interface GoiY { moTa: string; den: string; /** Dòng nhắc lọc học phí ở Khám phá (ngân sách thấp hoặc tỉnh xa), nếu có. */ nhacHocPhi: string | null }

/** Em có ngân sách dưới 30 triệu hoặc ở tỉnh xa trung tâm thì nên lọc học phí và nơi học ngay từ Khám phá. */
export function nhacLocHocPhi(h: Pick<AppState["hoSo"], "nganSach" | "tinh">): string | null {
  const tinhXa = !!h.tinh && !THANH_PHO.includes(h.tinh);
  if (h.nganSach === "duoi30") return "Ngân sách còn thấp: lọc theo học phí ở Khám phá.";
  if (tinhXa) return "Ở xa thành phố lớn: lọc theo học phí và nơi học.";
  return null;
}

const coDiemNaoDo = (s: AppState) => CAC_MON.some((m) => diemHienTaiCuaTungMon(s)[m] !== null);

/** Danh sách đã đủ căn cứ để nhận xét mà chưa có nguyện vọng An toàn hay Dự phòng. */
function thieuChoAnToan(s: AppState): boolean {
  if (!s.nguyenVong.length) return false;
  const ds = dungDanhSach(s.nguyenVong, diemDayDu(s), tim);
  const c = xetCoCau(demNhan(ds), ds.length);
  return c.n > 0 && c.chuaDuCanCu === 0 && c.chacChan === 0;
}

/** Lời chào dưới tên ở trang Hôm nay, theo chặng. Em mệt thì nhẹ nhàng trước. */
export function loiChaoTheoChang(s: AppState, chang: Chang = changCuaEm(s)): string {
  if (s.tamTrang === "met") return "Hôm nay mình học nhẹ thôi nhé.";
  if (chang === "dinhHuong") return "Mình làm từng bước nhỏ để hiểu bản thân và các ngành nhé.";
  if (chang === "thiLai") return s.mucTieu ? "Năm nay mình làm chắc hơn, từng việc một nhé." : "Mình xem lại điểm năm trước rồi chọn hướng đi cho sát nhé.";
  return s.mucTieu ? "Cùng cố gắng hôm nay nhé." : "Hôm nay mình bắt đầu từ đâu nhỉ?";
}

/** Câu gợi ý ngắn cho em theo chặng: việc đáng làm tiếp theo, đúng một việc. */
export function goiYChoEm(s: AppState, chang: Chang = changCuaEm(s)): GoiY {
  const nhac = nhacLocHocPhi(s.hoSo);
  const ra = (moTa: string, den: string): GoiY => ({ moTa, den, nhacHocPhi: chang === "dinhHuong" ? null : nhac });

  if (chang === "dinhHuong") {
    if (!s.hoSo.soThich) return ra("Làm trắc nghiệm 12 tình huống để biết nhóm ngành hợp em.", DUONG_DAN.tracNghiem());
    if (s.nguyenVong.length < 2) return ra("Lưu 2–3 ngành thấy hợp để so sánh dần.", DUONG_DAN.khamPha());
    if (!coDiemNaoDo(s)) return ra("Nhập điểm học bạ để so tham khảo với điểm chuẩn.", DUONG_DAN.batDau(2));
    return ra("Giữ điểm đều các môn, xem thêm vài ngành.", DUONG_DAN.khamPha());
  }

  const m = mucTieuDayDu(s);
  if (chang === "thiLai") {
    if (!coDiemNaoDo(s)) return ra("Nhập điểm thi năm trước để so với điểm chuẩn.", DUONG_DAN.batDau(2));
    if (!s.nguyenVong.length) return ra("So học phí, khu vực ở Khám phá rồi lưu nguyện vọng.", DUONG_DAN.khamPha());
    if (!m) return ra("So điểm năm trước với điểm chuẩn, rồi chọn mục tiêu.", DUONG_DAN.nguyenVong());
  } else if (!m) {
    if (s.nguyenVong.length) return ra("Chọn NV1 làm mục tiêu để tính điểm còn thiếu.", DUONG_DAN.nguyenVong());
    return ra("Chọn một ngành làm mục tiêu để tính điểm còn thiếu.", DUONG_DAN.khamPha());
  }
  if (!m) return ra("Em chọn một ngành làm mục tiêu để bắt đầu.", DUONG_DAN.khamPha());
  if (thieuChoAnToan(s)) return ra("Danh sách chưa có NV An toàn hay Dự phòng. Thêm một chỗ nhé.", DUONG_DAN.nguyenVongAnToan());
  const chuaCo = monThieuDiem(s, m.toHop);
  if (chuaCo.length) {
    return ra(`Nhập điểm ${noi(chuaCo.map((x) => TEN_MON[x]))} để tính đúng điểm còn thiếu.`, DUONG_DAN.batDau(2));
  }
  const mon = [...khoangCachCuaToi(s)].sort((a, b) => b.thieu - a.thieu)[0];
  if (mon && mon.thieu > 0) {
    return ra(`${mon.ten} thiếu khoảng ${lam1(mon.thieu)} điểm: ôn môn này trước.`, DUONG_DAN.monKeoDiem());
  }
  return ra(`Đã chạm ${lam1(m.mucTieu)}. Giữ nhịp và thử đề khó hơn.`, DUONG_DAN.tienDo());
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
  if (monTot.length) manh.push(`Vững: ${monTot.map((x) => `${TEN_MON[x]} ${lam1(diem[x]!)}`).join(" · ")}`);
  else if (coDiem.length) manh.push(`Tốt nhất: ${TEN_MON[coDiem[0]]} ${lam1(diem[coDiem[0]]!)}`);
  if (h.soThich && !khongRoNet(h.soThich)) manh.push(`Sở thích: ${moTaTop(h.soThich).toLowerCase()}`);
  const tangNhat = xu.filter((x) => x.tongTang >= 0.3).sort((a, b) => b.tongTang - a.tongTang)[0];
  if (tangNhat) manh.push(`${TEN_MON[tangNhat.mon]} +${lam1(tangNhat.tongTang)} qua ${tangNhat.soLan} lần thi thử`);
  if (h.diemManh.length) manh.push(`Tự nhận: ${noi(h.diemManh.slice(0, 3).map(viThuong))}`);

  // Điều cần lưu ý
  const luuY: string[] = [];
  if (m) {
    const thieu = monThieuDiem(s, m.toHop);
    if (thieu.length) luuY.push(`Chưa có điểm ${noi(thieu.map((x) => TEN_MON[x]))}`);
    // Môn còn thiếu đáng kể (từ mức "vừa" trở lên), môn thiếu nhiều nhất lên trước.
    for (const k of kc.filter((x) => x.uuTien !== "duyTri" && diem[x.mon] !== null).sort((a, b) => b.thieu - a.thieu).slice(0, 2)) {
      luuY.push(`${k.ten}: ${lam1(k.hienTai)}, cần thêm ${lam1(k.thieu)}`);
    }
  } else if (coDiem.length >= 2 && diem[coDiem[coDiem.length - 1]]! < 7) {
    const x = coDiem[coDiem.length - 1];
    luuY.push(`Thấp nhất: ${TEN_MON[x]} ${lam1(diem[x]!)}`);
  }
  const giam = xu.filter((x) => x.lanCuoi <= -0.3).sort((a, b) => a.lanCuoi - b.lanCuoi)[0];
  if (giam) luuY.push(`${TEN_MON[giam.mon]} −${lam1(-giam.lanCuoi)} ở lần thi thử gần nhất`);
  const kyNang = h.canCaiThien.filter((x) => !Object.values(TEN_MON).includes(x));
  if (kyNang.length) luuY.push(`Muốn rèn: ${noi(kyNang.slice(0, 2).map(viThuong))}`);
  if (m && !m.anDemNguoc && m.soNgayCon > 0 && m.soNgayCon <= 60) luuY.push(`Còn ${m.soNgayCon} ngày đến kỳ thi`);

  // Ưu tiên hiện tại
  const uuTien: string[] = [];
  if (m) {
    uuTien.push(`Đạt ${lam1(m.mucTieu)} (${s.mucTieu!.maToHop}) vào ${m.lc.nganh} – ${m.lc.truong}`);
    const keo = [...kc].sort((a, b) => b.thieu - a.thieu)[0];
    if (keo && keo.thieu > 0) uuTien.push(`Nâng ${keo.ten} trước: kéo điểm nhiều nhất`);
    const tiep = viecConLai(s)[0];
    if (tiep) uuTien.push(`Làm trước: ${tiep.tieuDe}`);
    else if (!m.anDemNguoc && m.soNgayCon > 0) uuTien.push(`Ôn thi THPT, còn ${m.soNgayCon} ngày`);
  } else {
    uuTien.push(h.nganhQuanTam.length ? `Tìm hiểu ${noi(h.nganhQuanTam)} để chọn mục tiêu` : "Chọn một ngành em muốn theo");
    if (coDiem.length < CAC_MON.length) uuTien.push("Nhập đủ điểm để biết tổ hợp hợp em");
    const chang = changCuaEm(s);
    if (chang === "dinhHuong") uuTien.push("Giữ điểm học bạ lớp 10–11 đều các môn");
    else if (chang === "thiLai") uuTien.push("Xem lại điểm năm trước, chọn hướng năm nay");
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
    [!!h.soThich, { ten: "Trắc nghiệm hướng nghiệp", den: DUONG_DAN.tracNghiem() }],
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

// Sinh "Điều cần lưu ý" cho màn Tiến độ từ dữ liệu thật. Hàm thuần, không React.
// Nguyên tắc: chỉ báo khi thật sự có ích, mỗi loại tối đa một dòng, tối đa 4 dòng, lời lẽ không phán xét.
import { DUONG_DAN } from "@/duong-dan";
import { congNgay, isoNgay, phatHienTrung, phutTuGio, thuCuaNgay, thuHaiCuaTuan, type Doan } from "@/engine/xep-lich";
import { viecCuaTuan } from "@/state/chon";
import type { AppState } from "@/state/store";
import { TEN_MON, type CanhBao, type ToneTen } from "@/state/types";
import { NHAN_THU, buoiBoLo, monTangLienTiep, ngayThang, phutHienTai } from "./tinh-tien-do";
import { dinhDang } from "@/engine/dinh-dang";

export type DuLieuCanhBao = Pick<AppState, "viec" | "trangThaiViec" | "khoiHoc" | "coDinh" | "diemThi" | "lichSu">;

/** Loại cảnh báo nằm ở tiền tố của id, giao diện dựa vào đây để chọn biểu tượng. */
export type LoaiCanhBao = "boLo" | "trung" | "dieuChinh" | "boQua" | "chuaLich" | "tangDiem";
export const loaiCuaCanhBao = (c: CanhBao) => c.id.split(":")[0] as LoaiCanhBao;

const THU_TU_TONE: Record<ToneTen, number> = { do: 0, cam: 1, xanh: 2, tim: 3, luc: 4, muc: 5 };
const TOI_DA = 4;

const noi = (ds: string[]) => (ds.length <= 1 ? ds.join("") : `${ds.slice(0, -1).join(", ")} và ${ds[ds.length - 1]}`);

export function taoCanhBao(s: DuLieuCanhBao, bayGio: Date): CanhBao[] {
  const ra: CanhBao[] = [];
  const hom = isoNgay(bayGio);
  const thu = thuCuaNgay(hom);
  const tt = (id: string) => s.trangThaiViec[id];
  const viecTuan = viecCuaTuan(s.viec, thuHaiCuaTuan(hom));

  // 1) Bỏ lỡ từ 2 buổi của cùng một môn trong tuần
  const boLo = buoiBoLo(s, bayGio);
  const theoMon = new Map<string, typeof boLo>();
  for (const k of boLo) {
    const khoa = k.mon ?? k.viecId!;
    theoMon.set(khoa, [...(theoMon.get(khoa) ?? []), k]);
  }
  const nhieuNhat = [...theoMon.values()].sort((a, b) => b.length - a.length)[0];
  if (nhieuNhat && nhieuNhat.length >= 2) {
    const k0 = nhieuNhat[0];
    const ten = k0.mon ? TEN_MON[k0.mon] : k0.ten;
    const ngays = [...new Set(nhieuNhat.map((k) => k.ngay))].sort().map(ngayThang);
    ra.push({
      id: `boLo:${k0.mon ?? k0.viecId}`, tone: "do",
      tieuDe: `Bạn đã bỏ lỡ ${nhieuNhat.length} buổi ${ten}`,
      moTa: `Buổi ngày ${noi(ngays)} chưa xong. Không sao cả, mình xếp lại cho vừa sức nhé.`,
      hanhDong: { nhan: "Xếp lại lịch", den: DUONG_DAN.tuan("lich") },
    });
  }

  // 2) Lịch trùng giờ: từ hôm nay tới hết tuần, gồm tiết cố định và buổi tự học đã xếp
  const cacTrung: { ngay: string; a: Doan; b: Doan; caHaiCoDinh: boolean }[] = [];
  for (let ngay = hom; ngay < congNgay(thuHaiCuaTuan(hom), 7); ngay = congNgay(ngay, 1)) {
    const coDinh = s.coDinh.filter((t) => t.thu === thuCuaNgay(ngay));
    const idCoDinh = new Set(coDinh.map((t) => t.id));
    const doan: Doan[] = [
      ...coDinh.map((t) => ({ id: t.id, ten: t.ten, batDau: t.batDau, ketThuc: t.ketThuc })),
      ...s.khoiHoc.filter((k) => k.ngay === ngay && !(k.viecId && tt(k.viecId) === "xong"))
        .map((k) => ({ id: k.id, ten: k.ten, batDau: k.batDau, ketThuc: k.ketThuc })),
    ];
    for (const [a, b] of phatHienTrung(doan)) {
      // buổi đã qua của hôm nay thì thôi không nhắc
      if (ngay === hom && Math.min(phutTuGio(a.ketThuc), phutTuGio(b.ketThuc)) <= phutHienTai(bayGio)) continue;
      cacTrung.push({ ngay, a, b, caHaiCoDinh: idCoDinh.has(a.id) && idCoDinh.has(b.id) });
    }
  }
  if (cacTrung.length) {
    const t = cacTrung[0];
    const them = cacTrung.length > 1 ? ` Còn ${cacTrung.length - 1} chỗ trùng khác.` : "";
    ra.push({
      id: `trung:${t.ngay}`, tone: "do",
      tieuDe: "Nên điều chỉnh lịch",
      moTa: `“${t.b.ten}” trùng giờ với “${t.a.ten}” (${NHAN_THU[thuCuaNgay(t.ngay)]}, ${t.b.batDau}).${them}`,
      hanhDong: t.caHaiCoDinh
        ? { nhan: "Sửa lịch học", den: DUONG_DAN.caiDatLichHoc() }
        : { nhan: "Xem lịch", den: DUONG_DAN.tuan("lich") },
    });
  }

  // 3) Đã qua giữa tuần mà còn nhiều việc quan trọng chưa làm
  // Chỉ tính việc quan trọng mà MỌI buổi đã xếp của nó đều đã qua mà chưa xong; kế hoạch vừa tạo giữa tuần (các buổi còn ở phía trước) không phải là "chậm".
  const daQua = (k: { ngay: string; ketThuc: string }) => k.ngay < hom || (k.ngay === hom && phutTuGio(k.ketThuc) <= phutHienTai(bayGio));
  const quanTrongChua = viecTuan.filter((v) => {
    if (v.mucUuTien !== "cao" || !(!tt(v.id) || tt(v.id) === "chua" || tt(v.id) === "doi")) return false;
    const buoi = s.khoiHoc.filter((k) => k.viecId === v.id);
    return buoi.length > 0 && buoi.every(daQua);
  });
  if (thu >= 3 && quanTrongChua.length >= 2) {
    const conNgay = 8 - thu;
    ra.push({
      id: "dieuChinh:tuan", tone: "cam",
      tieuDe: "Cần điều chỉnh kế hoạch tuần này",
      moTa: `Còn ${quanTrongChua.length} việc quan trọng chưa xong, tuần này còn ${conNgay} ngày. Mình có thể sắp lại cho vừa sức.`,
      hanhDong: { nhan: "Xem đề xuất điều chỉnh", den: DUONG_DAN.tuan("lich") },
    });
  }

  // 4) Việc em đã bỏ qua (lấy việc bỏ qua gần nhất, còn trong danh sách tuần)
  const boQua = viecTuan.filter((v) => tt(v.id) === "boQua");
  if (boQua.length) {
    const ganNhat = s.lichSu.find((l) => l.trangThai === "boQua" && boQua.some((v) => v.id === l.viecId));
    const v = boQua.find((x) => x.id === ganNhat?.viecId) ?? boQua[0];
    ra.push({
      id: `boQua:${v.id}`, tone: "cam",
      tieuDe: boQua.length > 1 ? `Bạn đã bỏ qua ${boQua.length} việc` : `Bạn đã bỏ qua “${v.tieuDe}”`,
      moTa: "Nếu việc này vẫn cần, bạn có thể làm vào lúc khác.",
      hanhDong: { nhan: "Xem việc", den: DUONG_DAN.viec(v.id) },
    });
  }

  // 5) Có việc cần học mà chưa nhập lịch học: lịch tự học dễ trùng giờ ở trường
  if (viecTuan.length && !s.coDinh.length) {
    ra.push({
      id: "chuaLich:coDinh", tone: "xanh",
      tieuDe: "Bạn chưa nhập lịch học",
      moTa: "Nhập giờ học ở trường và học thêm để giờ tự học không bị trùng.",
      hanhDong: { nhan: "Nhập lịch học", den: DUONG_DAN.caiDatLichHoc() },
    });
  }

  // 6) Ghi nhận tích cực: điểm tăng ở 3 lần thi gần nhất (gộp thành một dòng)
  const tang = monTangLienTiep(s.diemThi);
  if (tang.length) {
    const t0 = tang[0];
    const ten = tang.map((t) => TEN_MON[t.mon]);
    const danhSach = ten.length > 3 ? `${ten.slice(0, 2).join(", ")} và ${ten.length - 2} môn khác` : noi(ten);
    ra.push({
      id: `tangDiem:${tang.map((t) => t.mon).join("-")}`, tone: "luc",
      tieuDe: tang.length === 1 ? `Điểm ${TEN_MON[t0.mon]} tăng 3 lần liền` : `Điểm ${danhSach} đều tăng 3 lần liền`,
      moTa: `${TEN_MON[t0.mon]}: ${t0.ba.map((d) => dinhDang(d, 1)).join(" → ")}. Em đang đi đúng hướng, giữ nhịp này nhé!`,
    });
  }

  return ra.sort((a, b) => THU_TU_TONE[a.tone] - THU_TU_TONE[b.tone]).slice(0, TOI_DA);
}

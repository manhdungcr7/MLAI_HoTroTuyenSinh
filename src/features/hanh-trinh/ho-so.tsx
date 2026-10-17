import type { NavigateFunction } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Award, BarChart3, ChevronRight, FileText, GraduationCap, MapPin, Compass, Pencil, Plus, Settings, Sparkles, Users, Target, Trophy, Wallet, BookOpen, Languages, Medal, type LucideIcon } from "lucide-react";
import { DauTrangChinh, NoiDung } from "@/components/layout/khung";
import { Nhan, Nut, gop } from "@/components/ui/nut-the";
import { TieuDeMuc, TrangThaiTrong } from "@/components/ui/hien-thi";
import { HienDan, TheNen, VongDiem } from "@/components/ui/thiet-ke";
import { DUONG_DAN } from "@/duong-dan";
import { useApp } from "@/state/store";
import { coHoSoDeHienThi } from "@/state/chon";
import { diemTheoLoai } from "@/state/diem-hien-tai";
import { nhanLop } from "@/state/chang";
import { CAC_MON, TEN_MON } from "@/state/types";
import type { AppState } from "@/state/store";
import { dinhDang } from "@/engine/dinh-dang";
import { THONG_TIN_LOAI } from "@/features/huong-nghiep/cau-hoi";
import { NhanLoaiDiem, type LoaiDiem } from "@/features/khoi-dau/loai-diem";
import { ChiSoTheoDoi } from "./chi-so-theo-doi";
import { TEN_CHO_O, TEN_NGAN_SACH, chuDaiDien, hieuEm } from "./tinh-toan";

/** Mỗi khối nhận xét chỉ hiện 2 ý đầu (ý quan trọng đã xếp lên trước). */
const SO_DONG_TOI_DA = 2;
type Tone = "xanh" | "luc" | "cam";
const KHOI: Record<Tone, { nen: string; chu: string; cham: string; so: string; pill: string }> = {
  xanh: { nen: "the-nen-nhe-xanh", chu: "text-xanh-dam", cham: "bg-xanh", so: "border-xanh text-xanh-dam", pill: "bg-trang text-xanh-dam" },
  luc: { nen: "the-nen-nhe-luc", chu: "text-luc-chu", cham: "bg-luc", so: "border-luc text-luc-chu", pill: "bg-trang text-luc-chu" },
  cam: { nen: "the-nen-nhe-cam", chu: "text-cam-chu", cham: "bg-cam", so: "border-cam text-cam-chu", pill: "bg-trang text-cam-chu" },
};

/** Một khối nhận xét. Mỗi dòng bấm được, dẫn tới đúng nơi em xem/sửa. */
function KhoiNhanXet({ tone, icon: Icon, tieuDe, nhan, dong, phuDong, trong, danhSo, dich, nav }: {
  tone: Tone; icon: LucideIcon; tieuDe: string; nhan: string; dong: string[]; phuDong?: string; trong: string; danhSo?: boolean; dich: string[]; nav: NavigateFunction;
}) {
  const k = KHOI[tone];
  const hien = dong.slice(0, SO_DONG_TOI_DA);
  return (
    <TheNen tong={tone} className="!p-3.5">
      <div className="flex items-center justify-between gap-2">
        <h2 className={gop("flex items-center gap-2 text-[16px] font-bold", k.chu)}><Icon size={22} className="shrink-0" aria-hidden />{tieuDe}</h2>
        <span className={gop("rounded-full px-2.5 py-0.5 text-[13px] font-bold whitespace-nowrap", k.pill)}>{nhan}</span>
      </div>
      {hien.length ? (
        <ul className="mt-1.5">
          {hien.map((d, i) => (
            <li key={d}>
              <button type="button" onClick={() => nav(dich[Math.min(i, dich.length - 1)])} className="nay-nhe w-full min-h-11 flex items-center gap-2 text-left text-[14px] text-chu leading-snug">
                {danhSo
                  ? <span className={gop("size-5 rounded-full border-[1.5px] grid place-items-center text-[13px] font-bold shrink-0", k.so)}>{i + 1}</span>
                  : <span className={gop("size-2 rounded-full shrink-0 mx-1.5", k.cham)} />}
                <span className="min-w-0 flex-1 py-1">
                  <span className="block line-clamp-2 break-words">{d}</span>
                  {i === 0 && phuDong && <span className="block text-[13px] text-chu-phu line-clamp-1 break-words">{phuDong}</span>}
                </span>
                <ChevronRight size={16} className="text-chu-phu shrink-0" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : <p className="mt-1.5 text-[14px] text-chu-phu">{trong}</p>}
    </TheNen>
  );
}

/** Ô hành động nhanh trong lưới 2×2: tên ngắn + trạng thái một dòng; mục còn thiếu tô cam. */
function ONhanh({ icon: Icon, tone, ten, trangThai, du, onClick }: { icon: LucideIcon; tone: "xanh" | "cam" | "tim"; ten: string; trangThai: string; du: boolean; onClick: () => void }) {
  const mau = { xanh: "bg-xanh-nhat text-xanh-dam", cam: "bg-cam-nhat text-cam-chu", tim: "bg-tim-nhat text-tim-chu" }[tone];
  return (
    <button type="button" onClick={onClick} className="nay-nhe min-h-20 min-w-0 text-left rounded-2xl o-mem p-3">
      <span className={gop("size-9 rounded-xl grid place-items-center", mau)}><Icon size={19} aria-hidden /></span>
      <b className="mt-1.5 block text-[14px] text-muc">{ten}</b>
      <span className={gop("block text-[13px] leading-snug truncate", du ? "text-chu-phu" : "text-cam-chu font-bold")}>{trangThai}</span>
    </button>
  );
}

/** Trạng thái chữ theo % hồ sơ đã có. Chỉ mô tả mức đầy đủ, không đánh giá em. */
function trangThaiHoSo(p: number): { nhan: string; phu: string; tong: "xanh" | "luc" | "cam" } {
  if (p >= 85) return { nhan: "Hồ sơ khá đầy đủ", phu: "Đủ nền để gợi ý ngành sát hơn.", tong: "luc" };
  if (p >= 50) return { nhan: "Hồ sơ đã có nền", phu: "Thêm vài mục để gợi ý sát hơn.", tong: "xanh" };
  return { nhan: "Hồ sơ còn thiếu nhiều", phu: "Bổ sung để so điểm chính xác hơn.", tong: "cam" };
}

/** Tiến độ 4 nhóm, chỉ đếm dữ liệu em thật sự nhập ở app. */
function nhomTienDo(s: AppState, soMonCoDiem: number) {
  const h = s.hoSo;
  const dem = (a: boolean[]) => ({ co: a.filter(Boolean).length, tong: a.length });
  return [
    { ten: "Điểm môn", icon: BookOpen, nen: "gd-nhom-luc", chu: "text-luc-chu", co: soMonCoDiem, tong: CAC_MON.length },
    { ten: "Điểm thi", icon: BarChart3, nen: "gd-nhom-cam", chu: "text-cam-chu", ...dem([s.diemThi.length > 0, !!h.hocBa?.dtb3Nam || !!h.hocBa?.dtbLop12, CAC_MON.some((m) => typeof h.diemThiThat?.[m] === "number")]) },
    { ten: "Ngoại ngữ", icon: Languages, nen: "gd-nhom-tim", chu: "text-tim-chu", ...dem([!!h.chungChiNgoaiNgu?.diem, !!(h.diemDgnl?.hcm || h.diemDgnl?.hn || h.diemDgnl?.tsa)]) },
    { ten: "Hoạt động", icon: Medal, nen: "gd-nhom-xanh", chu: "text-xanh-dam", ...dem([!!h.giaiThuongHsg?.cap, !!h.soThich, h.diemManh.length > 0]) },
  ];
}

export default function HoSo() {
  const { s, dungHoSoMau } = useApp();
  const nav = useNavigate();
  const h = s.hoSo;
  const nutCaiDat = (
    <button type="button" aria-label="Cài đặt" onClick={() => nav(DUONG_DAN.hoSoCaiDat())} className="size-12 grid place-items-center rounded-full o-mem shrink-0 nay-nhe">
      <Settings size={21} className="text-muc" />
    </button>
  );

  const daCoDuLieu = coHoSoDeHienThi(s);
  if (!daCoDuLieu) {
    return (
      <>
        <DauTrangChinh tieuDe="Hồ sơ của bạn" phai={nutCaiDat} bienThe="luc" />
        <NoiDung>
          <TrangThaiTrong bieuTuong={<FileText size={28} />} tieuDe="Chưa có hồ sơ" moTa="Chỉ mất khoảng 1 phút. Bạn có thể cập nhật sau.">
            <div className="space-y-2">
              <Nut muiTen onClick={() => nav(DUONG_DAN.batDau(1))}>Tạo hồ sơ</Nut>
              <Nut kieu="vien" bieuTuong={Sparkles} onClick={dungHoSoMau}>Xem thử hồ sơ mẫu</Nut>
            </div>
          </TrangThaiTrong>
        </NoiDung>
      </>
    );
  }

  const x = hieuEm(s);
  const thongTin = [nhanLop(h), h.tinh].filter(Boolean).join(" · ") || "Chưa có lớp và tỉnh";
  const mucLuuY = s.mucTieu ? DUONG_DAN.monKeoDiem() : DUONG_DAN.batDau(2);
  const nganSach = [h.nganSach && TEN_NGAN_SACH[h.nganSach], h.choO && TEN_CHO_O[h.choO]].filter(Boolean).join(" · ");
  const tt = trangThaiHoSo(x.dayDu);
  const diem = diemTheoLoai(s);
  const monCoDiem = CAC_MON.filter((m) => diem.hienTai[m] !== null);
  const nhom = nhomTienDo(s, monCoDiem.length);
  const coMucTieuMon = CAC_MON.some((m) => diem.mucTieu[m] !== null);
  const dichUuTien = [s.mucTieu ? DUONG_DAN.mucTieu() : DUONG_DAN.khamPha(), s.mucTieu ? DUONG_DAN.monKeoDiem() : DUONG_DAN.batDau(2)];
  const xetSom = [
    { ten: "Ngoại ngữ", gt: h.chungChiNgoaiNgu?.diem ? `${h.chungChiNgoaiNgu.loai} ${h.chungChiNgoaiNgu.diem}` : "Chưa có", co: !!h.chungChiNgoaiNgu?.diem, icon: GraduationCap },
    { ten: "ĐGNL", gt: h.diemDgnl?.hcm ? `HCM ${h.diemDgnl.hcm}/1200` : h.diemDgnl?.hn ? `HSA ${h.diemDgnl.hn}/150` : h.diemDgnl?.tsa ? `TSA ${h.diemDgnl.tsa}/100` : "Chưa thi", co: !!(h.diemDgnl?.hcm || h.diemDgnl?.hn || h.diemDgnl?.tsa), icon: BarChart3 },
    { ten: "Học bạ", gt: h.hocBa?.dtb3Nam ? `ĐTB 3 năm: ${h.hocBa.dtb3Nam}` : h.hocBa?.dtbLop12 ? `Lớp 12: ${h.hocBa.dtbLop12}` : "Chưa nhập", co: !!(h.hocBa?.dtb3Nam || h.hocBa?.dtbLop12), icon: FileText },
    { ten: "Học sinh giỏi", gt: h.giaiThuongHsg?.cap ? `${h.giaiThuongHsg.giai ? `Giải ${h.giaiThuongHsg.giai}` : "Có giải"} ${h.giaiThuongHsg.mon ?? ""}`.trim() : "Chưa có", co: !!h.giaiThuongHsg?.cap, icon: Award },
  ];

  return (
    <>
      <DauTrangChinh tieuDe="Hồ sơ của bạn" phai={nutCaiDat} bienThe="luc" />
      <NoiDung>
        <HienDan className="space-y-3">
          <TheNen tong="xanh" className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span aria-hidden className="size-12 rounded-full gd-huy-hieu-xanh text-white grid place-items-center text-[16px] font-bold shrink-0 shadow-nut">{chuDaiDien(h.hoTen) || "?"}</span>
                <div className="min-w-0">
                  <p className="text-[17px] font-bold text-muc leading-tight line-clamp-1">{h.hoTen.trim() || "Bạn chưa điền tên"}</p>
                  <p className="text-[13px] text-chu-phu truncate">{thongTin}</p>
                </div>
              </div>
              <button type="button" onClick={() => nav(DUONG_DAN.batDau(1))} className="nay-nhe shrink-0 whitespace-nowrap min-h-11 px-2.5 rounded-xl bg-trang text-xanh-dam text-[13px] font-bold inline-flex items-center gap-1.5">
                <Pencil size={14} aria-hidden />Chỉnh sửa
              </button>
            </div>
            {h.laMau && (
              <div>
                <Nhan tone="cam" className="whitespace-normal line-clamp-2">Hồ sơ mẫu, không phải người thật</Nhan>
              </div>
            )}
            <button type="button" onClick={() => nav(x.boSung[0]?.den ?? DUONG_DAN.batDau(1))} className="nay-nhe w-full text-left rounded-2xl bg-trang/80 p-3 flex items-center gap-3">
              <VongDiem value={x.dayDu} max={100} size={92} tong={tt.tong} nhanGiua="đã có" dinhDang={(n) => `${Math.round(n)}%`} aria={`Hồ sơ đã có ${x.dayDu} phần trăm`} />
              <span className="min-w-0 flex-1">
                <b className="block text-[16px] text-muc leading-tight">{tt.nhan}</b>
                <span className="block text-[13px] text-chu-phu mt-0.5">{tt.phu}</span>
                {x.boSung.length > 0 && (
                  <span className="mt-1.5 flex items-start gap-1 text-[13px] text-chu">
                    <span className="min-w-0">Nên thêm: {x.boSung.slice(0, 2).map((b) => b.ten).join(", ")}{x.boSung.length > 2 && ` +${x.boSung.length - 2}`}</span>
                    <ChevronRight size={16} className="shrink-0 mt-0.5 text-chu-phu" aria-hidden />
                  </span>
                )}
              </span>
            </button>
          </TheNen>

          <ul className="grid grid-cols-2 gap-2" aria-label="Tiến độ theo nhóm">
            {nhom.map((n) => (
              <li key={n.ten} className={gop("rounded-2xl p-2.5 min-w-0 flex items-center gap-2.5", n.nen, n.chu)}>
                <n.icon size={20} className="shrink-0" aria-hidden />
                <span className="min-w-0">
                  <b className="block text-[16px] leading-tight">{n.co}/{n.tong}</b>
                  <span className="block text-[13px] leading-tight break-words">{n.ten}</span>
                </span>
              </li>
            ))}
          </ul>

          <KhoiNhanXet tone="xanh" icon={Target} tieuDe="Ưu tiên hiện tại" nhan="Gợi ý" dong={x.uuTien} phuDong={x.truongMucTieu} danhSo dich={dichUuTien} nav={nav}
            trong="Chọn một mục tiêu để bắt đầu." />
          <KhoiNhanXet tone="luc" icon={Trophy} tieuDe="Điểm mạnh" nhan="Giữ vững" dong={x.manh} dich={[DUONG_DAN.batDau(2)]} nav={nav}
            trong="Nhập điểm các môn để thấy điểm mạnh." />
          <KhoiNhanXet tone="cam" icon={AlertTriangle} tieuDe="Cần lưu ý" nhan="Cần bổ sung" dong={x.luuY} dich={[mucLuuY]} nav={nav}
            trong="Chưa thấy điều gì đáng lo." />

          <TheNen className="space-y-1" aria-label="Điểm của em">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-[16px] font-bold text-muc">Điểm của em</h2>
              <button type="button" onClick={() => nav(DUONG_DAN.batDau(2))} className="nay-nhe min-h-11 px-3 -mr-2 text-[13px] font-bold text-xanh-dam">Đổi điểm</button>
            </div>
            {monCoDiem.length === 0 ? (
              <p className="text-[14px] text-chu-phu">Chưa có điểm môn nào. Nhập điểm để so với điểm chuẩn.</p>
            ) : (
              <ul className="divide-y divide-vien">
                {monCoDiem.map((m) => {
                  const loai: LoaiDiem = diem.nguon[m] === "thiThat" ? "thiThat" : diem.thiThu[m] !== null ? "thiThu" : "hocBa";
                  return (
                    <li key={m} className="flex items-center gap-2 min-h-11 text-[14px]">
                      <span className="flex-1 min-w-0 truncate text-chu">{TEN_MON[m]}</span>
                      <NhanLoaiDiem loai={loai} />
                      <b className="so-lon w-9 text-right text-muc">{dinhDang(diem.hienTai[m]!, 1)}</b>
                      {diem.mucTieu[m] !== null && <span className="text-[13px] text-tim-chu whitespace-nowrap">→ {dinhDang(diem.mucTieu[m]!, 1)}</span>}
                    </li>
                  );
                })}
              </ul>
            )}
            <p className="text-[13px] text-chu-phu pt-1">{coMucTieuMon ? "Số sau mũi tên là điểm em muốn đạt, chưa phải điểm đã có." : "Điểm thi thật được ưu tiên hơn thi thử, thi thử hơn điểm hồ sơ."}</p>
          </TheNen>

          <div className="space-y-2">
            <TieuDeMuc>Xét tuyển sớm & Ngoại ngữ</TieuDeMuc>
            <ul className="grid grid-cols-2 gap-2">
              {xetSom.map((o) => (
                <li key={o.ten}>
                  <button type="button" onClick={() => nav(DUONG_DAN.batDau(2))} aria-label={`${o.ten}: ${o.gt}. ${o.co ? "Sửa" : "Thêm"}`}
                    className="nay-nhe w-full min-h-14 rounded-2xl o-mem p-2.5 flex items-center gap-2 text-left">
                    <span className={gop("size-9 rounded-xl grid place-items-center shrink-0", o.co ? "bg-luc-nhat text-luc-chu" : "bg-tim-nhat text-tim-chu")}><o.icon size={18} aria-hidden /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] text-chu-phu leading-tight">{o.ten}</span>
                      <b className="block text-[14px] text-muc leading-tight line-clamp-1">{o.gt}</b>
                    </span>
                    <Plus size={16} className="text-xanh-dam shrink-0" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </HienDan>

        <TieuDeMuc>Tiến bộ của bạn</TieuDeMuc>
        <ChiSoTheoDoi s={s} gon />

        <TieuDeMuc>Hành động nhanh</TieuDeMuc>
        <div className="grid grid-cols-2 gap-2">
          <ONhanh icon={Compass} tone="cam" ten="Trắc nghiệm" trangThai={h.soThich?.top[0] ? `Hợp ${THONG_TIN_LOAI[h.soThich.top[0]].ten}` : h.soThich ? "Đã làm" : "Chưa làm · 2 phút"} du={!!h.soThich} onClick={() => nav(DUONG_DAN.tracNghiem())} />
          <ONhanh icon={Users} tone="tim" ten="Chia sẻ" trangThai={s.loiNhan.length ? `${s.loiNhan.length} lời nhắn` : "Phụ huynh, thầy cô"} du onClick={() => nav(DUONG_DAN.chiaSe())} />
          <ONhanh icon={Wallet} tone="cam" ten="Ngân sách" trangThai={nganSach || "Còn thiếu"} du={!!h.nganSach} onClick={() => nav(DUONG_DAN.batDau(3))} />
          <ONhanh icon={MapPin} tone="xanh" ten="Khu vực" trangThai={h.khuVuc.length ? h.khuVuc.join(", ") : "Còn thiếu"} du={h.khuVuc.length > 0} onClick={() => nav(DUONG_DAN.batDau(3))} />
        </div>

        <Nut muiTen onClick={() => nav(DUONG_DAN.batDau(1))}>Hoàn thiện hồ sơ</Nut>
      </NoiDung>
    </>
  );
}

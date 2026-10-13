import { useNavigate } from "react-router-dom";
import { AlertTriangle, ChevronRight, FileText, MapPin, Compass, Settings, Sparkles, Users, Target, Trophy, Wallet, type LucideIcon } from "lucide-react";
import { DauTrangChinh, NoiDung } from "@/components/layout/khung";
import { NenHero } from "@/components/ui/hinh-nen";
import { Nhan, Nut, TONE_CHU, TONE_NEN, gop } from "@/components/ui/nut-the";
import { ThanhTienDo, TieuDeMuc, TrangThaiTrong } from "@/components/ui/hien-thi";
import { DUONG_DAN } from "@/duong-dan";
import { useApp } from "@/state/store";
import { nhanLop } from "@/state/chang";
import type { ToneTen } from "@/state/types";
import { moTaTop } from "@/features/huong-nghiep/cau-hoi";
import { ChiSoTheoDoi } from "./chi-so-theo-doi";
import { TEN_CHO_O, TEN_NGAN_SACH, chuDaiDien, hieuEm } from "./tinh-toan";

/** Mỗi khối nhận xét chỉ hiện 2 ý đầu (ý quan trọng đã xếp lên trước); bấm khối để xem chi tiết ở màn liên quan. */
const SO_DONG_TOI_DA = 2;
const CHAM: Record<ToneTen, string> = { xanh: "bg-xanh", luc: "bg-luc", cam: "bg-cam", do: "bg-do", tim: "bg-tim", muc: "bg-muc" };
const SO: Record<ToneTen, string> = { xanh: "border-xanh text-xanh", luc: "border-luc text-luc-chu", cam: "border-cam text-cam-chu", do: "border-do text-do-chu", tim: "border-tim text-tim-chu", muc: "border-muc text-muc" };

/** Một khối nhận xét, cả khối bấm được để tới nơi em sửa/xem thêm. */
function KhoiNhanXet({ tone, icon: Icon, tieuDe, dong, trong, danhSo, onClick }: {
  tone: ToneTen; icon: LucideIcon; tieuDe: string; dong: string[]; trong: string; danhSo?: boolean; onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className={gop("w-full text-left rounded-the p-4 flex items-start gap-3 active:brightness-95", TONE_NEN[tone])}>
      <span className="flex-1 min-w-0">
        <span className={gop("flex items-center gap-2 text-[16px] font-extrabold", TONE_CHU[tone])}><Icon size={22} className="shrink-0" />{tieuDe}</span>
        {dong.length ? (
          <ul className="mt-2 space-y-1.5">
            {dong.slice(0, SO_DONG_TOI_DA).map((d, i) => (
              <li key={d} className="flex gap-2 text-[14px] text-chu leading-snug">
                {danhSo
                  ? <span className={gop("size-5 rounded-full border-[1.5px] grid place-items-center text-[11px] font-extrabold shrink-0 mt-px", SO[tone])}>{i + 1}</span>
                  : <span className={gop("mt-[7px] size-2 rounded-full shrink-0", CHAM[tone])} />}
                <span className="min-w-0">{d}</span>
              </li>
            ))}
          </ul>
        ) : <span className="block mt-2 text-[14px] text-chu-phu">{trong}</span>}
      </span>
      <ChevronRight size={18} className="text-chu-phu shrink-0 mt-1" />
    </button>
  );
}

/** Ô hành động nhanh trong lưới 2×2: tên ngắn + trạng thái một dòng; mục còn thiếu tô cam. */
function ONhanh({ icon: Icon, tone, ten, trangThai, du, onClick }: { icon: LucideIcon; tone: ToneTen; ten: string; trangThai: string; du: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="min-h-20 min-w-0 text-left rounded-the bg-trang border border-vien shadow-the p-3 active:bg-xanh-nhat">
      <span className={gop("size-9 rounded-xl grid place-items-center", TONE_NEN[tone], TONE_CHU[tone])}><Icon size={19} /></span>
      <b className="mt-1.5 block text-[14px] text-muc">{ten}</b>
      <span className={gop("block text-[12px] leading-snug truncate", du ? "text-chu-phu" : "text-cam-chu font-bold")}>{trangThai}</span>
    </button>
  );
}

export default function HoSo() {
  const { s, dungHoSoMau } = useApp();
  const nav = useNavigate();
  const h = s.hoSo;
  const nutCaiDat = (
    <button type="button" aria-label="Cài đặt" onClick={() => nav(DUONG_DAN.hoSoCaiDat())} className="size-12 grid place-items-center rounded-full bg-trang border border-vien shrink-0 active:bg-xanh-nhat">
      <Settings size={21} className="text-muc" />
    </button>
  );

  const daCoDuLieu = Boolean(h.hoanTat || h.hoTen.trim() || h.khoi || h.tinh || h.nganhQuanTam.length || Object.values(h.diem).some((d) => d !== null));
  if (!daCoDuLieu) {
    return (
      <>
        <DauTrangChinh tieuDe="Hồ sơ của em" moTa="Hệ thống sẽ hiểu em rõ hơn khi em điền hồ sơ." phai={nutCaiDat} />
        <NoiDung>
          <TrangThaiTrong bieuTuong={<FileText size={28} />} tieuDe="Chưa có hồ sơ" moTa="Chỉ mất khoảng 1 phút. Phần nào chưa chắc, em có thể điền sau.">
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

  return (
    <>
      <DauTrangChinh tieuDe="Hệ thống hiểu em" moTa="Tóm tắt từ thông tin em đã nhập." phai={nutCaiDat} />
      <NoiDung>
        <NenHero tone="xanh" className="p-4">
          <div className="flex items-center gap-3">
            <span aria-hidden className="size-14 rounded-full gd-xanh text-white grid place-items-center text-[18px] font-extrabold shrink-0 shadow-nut">{chuDaiDien(h.hoTen) || "?"}</span>
            <div className="min-w-0 flex-1">
              <p className="text-[18px] font-extrabold text-muc leading-tight truncate">{h.hoTen.trim() || "Em chưa điền tên"}</p>
              <p className="text-[13px] text-chu">{thongTin}</p>
              {h.laMau && <Nhan tone="cam" className="mt-1 bg-trang/80">Hồ sơ mẫu, không phải người thật</Nhan>}
            </div>
          </div>
          <button type="button" onClick={() => nav(x.boSung[0]?.den ?? DUONG_DAN.batDau(1))} className="mt-3 block w-full text-left rounded-xl bg-trang/75 px-3 py-2.5 active:brightness-95">
            <span className="flex justify-between text-[13px] text-chu mb-1.5"><span>Hồ sơ đã có</span><b className="text-xanh">{x.dayDu}%</b></span>
            <ThanhTienDo phanTram={x.dayDu} />
            {x.boSung.length > 0 && (
              <span className="mt-1.5 flex items-center gap-1 text-[12px] text-chu-phu">
                <span className="min-w-0 truncate">Nên thêm: {x.boSung.slice(0, 2).map((b) => b.ten).join(", ")}{x.boSung.length > 2 && ` +${x.boSung.length - 2}`}</span>
                <ChevronRight size={14} className="shrink-0" />
              </span>
            )}
          </button>
        </NenHero>

        <KhoiNhanXet tone="xanh" icon={Target} tieuDe="Ưu tiên hiện tại" dong={x.uuTien} danhSo onClick={() => nav(s.mucTieu ? DUONG_DAN.mucTieu() : DUONG_DAN.khamPha())}
          trong="Chọn một mục tiêu để bắt đầu." />
        <KhoiNhanXet tone="luc" icon={Trophy} tieuDe="Điểm mạnh" dong={x.manh} onClick={() => nav(DUONG_DAN.batDau(2))}
          trong="Nhập điểm các môn để thấy điểm mạnh." />
        <KhoiNhanXet tone="cam" icon={AlertTriangle} tieuDe="Cần lưu ý" dong={x.luuY} onClick={() => nav(mucLuuY)}
          trong="Chưa thấy điều gì đáng lo." />

        <TieuDeMuc>Tiến bộ của em</TieuDeMuc>
        <ChiSoTheoDoi s={s} gon />

        <TieuDeMuc>Hành động nhanh</TieuDeMuc>
        <div className="grid grid-cols-2 gap-2">
          <ONhanh icon={Compass} tone="cam" ten="Trắc nghiệm" trangThai={h.soThich ? moTaTop(h.soThich) : "Chưa làm · 2 phút"} du={!!h.soThich} onClick={() => nav(DUONG_DAN.tracNghiem())} />
          <ONhanh icon={Users} tone="tim" ten="Chia sẻ" trangThai={s.loiNhan.length ? `${s.loiNhan.length} lời nhắn` : "Phụ huynh, thầy cô"} du onClick={() => nav(DUONG_DAN.chiaSe())} />
          <ONhanh icon={Wallet} tone="cam" ten="Ngân sách" trangThai={nganSach || "Còn thiếu"} du={!!h.nganSach} onClick={() => nav(DUONG_DAN.batDau(3))} />
          <ONhanh icon={MapPin} tone="xanh" ten="Khu vực" trangThai={h.khuVuc.length ? h.khuVuc.join(", ") : "Còn thiếu"} du={h.khuVuc.length > 0} onClick={() => nav(DUONG_DAN.batDau(3))} />
        </div>

        <Nut muiTen onClick={() => nav(DUONG_DAN.batDau(1))}>Hoàn thiện hồ sơ</Nut>
      </NoiDung>
    </>
  );
}

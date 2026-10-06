import { useNavigate } from "react-router-dom";
import { AlertTriangle, Brain, ChevronRight, ClipboardList, FileText, MapPin, Settings, Sparkles, Users, Target, Trophy, Wallet, type LucideIcon } from "lucide-react";
import { DauTrangChinh, NoiDung } from "@/components/layout/khung";
import { NenHero } from "@/components/ui/hinh-nen";
import { HangBam, Nhan, Nut, TONE_CHU, TONE_NEN, gop } from "@/components/ui/nut-the";
import { ThanhTienDo, TieuDeMuc, TrangThaiTrong } from "@/components/ui/hien-thi";
import { DUONG_DAN } from "@/duong-dan";
import { useApp } from "@/state/store";
import type { ToneTen } from "@/state/types";
import { ChiSoTheoDoi } from "./chi-so-theo-doi";
import { TEN_CHO_O, TEN_NGAN_SACH, chuDaiDien, hieuEm } from "./tinh-toan";

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
            {dong.map((d, i) => (
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

export default function HoSo() {
  const { s, dungHoSoMau } = useApp();
  const nav = useNavigate();
  const h = s.hoSo;
  const nutCaiDat = (
    <button type="button" aria-label="Cài đặt" onClick={() => nav(DUONG_DAN.hoSoCaiDat())} className="size-12 grid place-items-center rounded-full bg-trang border border-vien shrink-0 active:bg-xanh-nhat">
      <Settings size={21} className="text-muc" />
    </button>
  );

  if (!h.hoTen.trim() && !h.hoanTat) {
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
  const thongTin = [h.khoi && (h.khoi === 11 ? "Lớp 10 – 11" : `Lớp ${h.khoi}`), h.tinh].filter(Boolean).join(" · ") || "Chưa có lớp và tỉnh";
  const mucLuuY = s.mucTieu ? DUONG_DAN.monKeoDiem() : DUONG_DAN.batDau(2);
  const nganSach = [h.nganSach && `học phí ${TEN_NGAN_SACH[h.nganSach].toLowerCase()}/năm`, h.choO && TEN_CHO_O[h.choO]].filter(Boolean).join(", ");

  return (
    <>
      <DauTrangChinh tieuDe="Hệ thống hiểu em" moTa="Dựa trên thông tin em đã nhập, Nguyện Vọng AI đang hiểu em như sau." phai={nutCaiDat} />
      <NoiDung>
        <NenHero tone="xanh" className="p-4">
          <div className="flex items-center gap-3">
            <span aria-hidden className="size-14 rounded-full gd-xanh text-white grid place-items-center text-[18px] font-extrabold shrink-0 shadow-nut">{chuDaiDien(h.hoTen) || "?"}</span>
            <div className="min-w-0 flex-1">
              <p className="text-[18px] font-extrabold text-muc leading-tight truncate">{h.hoTen.trim() || "Em chưa điền tên"}</p>
              <p className="text-[13px] text-chu">{thongTin}</p>
              {h.giaiDoan && <Nhan tone="xanh" className="mt-1 bg-trang/80">{h.giaiDoan}</Nhan>}
            </div>
          </div>
          <div className="mt-3 rounded-xl bg-trang/75 px-3 py-2.5">
            <p className="flex justify-between text-[13px] text-chu mb-1.5"><span>Hồ sơ đã có</span><b className="text-xanh">{x.dayDu}%</b></p>
            <ThanhTienDo phanTram={x.dayDu} />
          </div>
        </NenHero>

        <KhoiNhanXet tone="luc" icon={Trophy} tieuDe="Điểm mạnh của em" dong={x.manh} onClick={() => nav(DUONG_DAN.batDau(2))}
          trong="Chưa đủ dữ liệu để nhận ra điểm mạnh. Em nhập điểm các môn và chọn điểm mạnh nhé." />
        <KhoiNhanXet tone="cam" icon={AlertTriangle} tieuDe="Điều cần lưu ý" dong={x.luuY} onClick={() => nav(mucLuuY)}
          trong="Chưa thấy điều gì đáng lo. Em giữ nhịp học hiện tại nhé." />
        <KhoiNhanXet tone="xanh" icon={Target} tieuDe="Ưu tiên hiện tại" dong={x.uuTien} danhSo onClick={() => nav(s.mucTieu ? DUONG_DAN.mucTieu() : DUONG_DAN.khamPha())}
          trong="Em chọn một mục tiêu để bắt đầu." />
        <KhoiNhanXet tone="tim" icon={ClipboardList} tieuDe="Thông tin nên bổ sung"
          dong={x.boSung.length > 3 ? [...x.boSung.slice(0, 3).map((b) => b.ten), `Và ${x.boSung.length - 3} mục khác`] : x.boSung.map((b) => b.ten)}
          onClick={() => nav(x.boSung[0]?.den ?? DUONG_DAN.batDau(1))}
          trong="Hồ sơ đã có đủ thông tin chính. Khi có gì thay đổi, em cập nhật lại nhé." />

        <TieuDeMuc>Tiến bộ của em</TieuDeMuc>
        <ChiSoTheoDoi s={s} />

        <TieuDeMuc>Hành động nhanh</TieuDeMuc>
        <div className="space-y-2">
          <HangBam bieuTuong={Users} tone="tim" tieuDe="Chia sẻ với phụ huynh, thầy cô" onClick={() => nav(DUONG_DAN.chiaSe())}
            phu="Bản tóm tắt và những điều nên trao đổi cùng người đồng hành" />
          <HangBam bieuTuong={Wallet} tone="cam" tieuDe="Bổ sung ngân sách sinh hoạt" onClick={() => nav(DUONG_DAN.batDau(3))}
            phu={nganSach ? `Đang chọn: ${nganSach}` : "Giúp gợi ý trường hợp khả năng tài chính"}
            nhan={<Nhan tone={h.nganSach ? "luc" : "cam"}>{h.nganSach ? "Đã có" : "Còn thiếu"}</Nhan>} />
          <HangBam bieuTuong={MapPin} tone="xanh" tieuDe="Xác nhận khu vực ưu tiên" onClick={() => nav(DUONG_DAN.batDau(3))}
            phu={h.khuVuc.length ? `Đang chọn: ${h.khuVuc.join(", ")}` : "Giúp đề xuất trường gần nơi em muốn học"}
            nhan={<Nhan tone={h.khuVuc.length ? "luc" : "cam"}>{h.khuVuc.length ? "Đã có" : "Còn thiếu"}</Nhan>} />
        </div>

        <p className="flex gap-2 rounded-xl bg-xanh-nhat p-3 text-[13px] text-chu leading-snug">
          <Brain size={18} className="text-xanh shrink-0 mt-px" />
          Đây là nhận xét tự động từ điểm và lựa chọn của em, không phải đánh giá con người em. Em có thể cập nhật bất cứ lúc nào.
        </p>
        <Nut muiTen onClick={() => nav(DUONG_DAN.batDau(1))}>Hoàn thiện hồ sơ</Nut>
        <Nut kieu="nhe" bieuTuong={Settings} onClick={() => nav(DUONG_DAN.hoSoCaiDat())}>Cài đặt</Nut>
      </NoiDung>
    </>
  );
}

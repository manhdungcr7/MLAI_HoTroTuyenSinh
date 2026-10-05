import { useNavigate } from "react-router-dom";
import { AlertTriangle, Brain, ClipboardList, FileText, RotateCcw, Settings, Sparkles, Target, Trophy, type LucideIcon } from "lucide-react";
import { DauTrangChinh, NoiDung } from "@/components/layout/khung";
import { Nut, TONE_CHU, TONE_NEN, gop } from "@/components/ui/nut-the";
import { TrangThaiTrong } from "@/components/ui/hien-thi";
import { DUONG_DAN } from "@/duong-dan";
import { diemHienTaiCuaTungMon, useApp } from "@/state/store";
import { TEN_MON, type MonId, type ToneTen } from "@/state/types";

const CHAM: Record<ToneTen, string> = { xanh: "bg-xanh", luc: "bg-luc", cam: "bg-cam", do: "bg-do", tim: "bg-tim", muc: "bg-muc" };

function Khoi({ tone, icon: Icon, tieuDe, dong }: { tone: ToneTen; icon: LucideIcon; tieuDe: string; dong: string[] }) {
  return (
    <section className={gop("rounded-the p-4", TONE_NEN[tone])}>
      <h2 className={gop("flex items-center gap-2 text-[16px] font-extrabold", TONE_CHU[tone])}><Icon size={22} />{tieuDe}</h2>
      <ul className="mt-2 space-y-1.5">
        {dong.map((d) => <li key={d} className="flex gap-2 text-[14px] text-chu"><span className={gop("mt-[7px] size-2 rounded-full shrink-0", CHAM[tone])} />{d}</li>)}
      </ul>
    </section>
  );
}

export default function HoSo() {
  const { s, dungHoSoMau, lamLai } = useApp();
  const nav = useNavigate();
  const h = s.hoSo;
  if (!h.hoTen) {
    return (
      <>
        <DauTrangChinh tieuDe="Hồ sơ của em" moTa="Hệ thống sẽ hiểu em rõ hơn khi em điền hồ sơ." />
        <NoiDung>
          <TrangThaiTrong bieuTuong={<FileText size={28} />} tieuDe="Chưa có hồ sơ" moTa="Chỉ mất khoảng 1 phút. Em có thể điền sau những phần chưa chắc.">
            <div className="space-y-2"><Nut onClick={() => nav(DUONG_DAN.batDau(1))}>Tạo hồ sơ</Nut><Nut kieu="vien" bieuTuong={Sparkles} onClick={dungHoSoMau}>Xem thử bằng hồ sơ mẫu</Nut></div>
          </TrangThaiTrong>
        </NoiDung>
      </>
    );
  }
  const diem = diemHienTaiCuaTungMon(s);
  const mon = Object.keys(diem) as MonId[];
  const monCao = mon.filter((m) => (diem[m] ?? 0) >= 8).map((m) => `${TEN_MON[m]} đang khá tốt (${diem[m]!.toFixed(1)})`);
  const monThap = mon.filter((m) => diem[m] !== null && diem[m]! < 7.2).map((m) => `Cần củng cố ${TEN_MON[m]} (${diem[m]!.toFixed(1)})`);
  const manh = [...h.diemManh, ...monCao].slice(0, 5);
  const luuY = [...h.canCaiThien.map((x) => `Cần củng cố: ${x}`), ...monThap].slice(0, 5);
  const uuTien = [
    h.nganhQuanTam.length > 0 && `Tập trung vào ngành ${h.nganhQuanTam.join(", ")}`,
    s.mucTieu && "Nâng điểm các môn còn thiếu theo mục tiêu",
    h.khoi === 12 && "Chuẩn bị cho kỳ thi THPT",
  ].filter(Boolean) as string[];
  const thieu = [
    h.nganSach === null && "Ngân sách học phí dự kiến",
    !h.khuVuc.length && "Nơi em muốn học",
    "Sở thích ngoài học tập",
    "Hoạt động ngoại khóa",
    "Chứng chỉ (nếu có)",
  ].filter(Boolean) as string[];

  return (
    <>
      <DauTrangChinh tieuDe="Hệ thống hiểu em" moTa="Dựa trên thông tin em đã nhập, Nguyện Vọng AI đang hiểu em như sau." />
      <NoiDung>
        <Khoi tone="luc" icon={Trophy} tieuDe="Điểm mạnh của em" dong={manh.length ? manh : ["Em chưa chọn điểm mạnh nào"]} />
        <Khoi tone="cam" icon={AlertTriangle} tieuDe="Điều cần lưu ý" dong={luuY.length ? luuY : ["Chưa thấy điều gì đáng lo"]} />
        <Khoi tone="xanh" icon={Target} tieuDe="Ưu tiên hiện tại" dong={uuTien.length ? uuTien : ["Em chọn một mục tiêu để bắt đầu"]} />
        <Khoi tone="tim" icon={ClipboardList} tieuDe="Thông tin nên bổ sung" dong={thieu} />
        <p className="text-[12px] text-chu-phu flex gap-1.5"><Brain size={14} className="shrink-0 mt-0.5" />Đây là nhận xét tự động từ điểm và lựa chọn của em, không phải đánh giá con người em.</p>
        <Nut muiTen onClick={() => nav(DUONG_DAN.batDau(1))}>Hoàn thiện hồ sơ</Nut>
        <div className="grid grid-cols-2 gap-2">
          <Nut kieu="nhe" bieuTuong={Settings} onClick={() => nav(DUONG_DAN.hoSoCaiDat())}>Cài đặt</Nut>
          <Nut kieu="nguyHiem" bieuTuong={RotateCcw} onClick={() => { if (window.confirm("Xóa toàn bộ thông tin trên điện thoại này và làm lại từ đầu?")) { lamLai(); nav(DUONG_DAN.chao()); } }}>Làm lại</Nut>
        </div>
      </NoiDung>
    </>
  );
}

// Màn 15 · Mục tiêu chính (tab Kế hoạch, mục "Mục tiêu").
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart3, CalendarDays, ChevronRight, Hammer, LineChart, ListChecks, MapPin, Pencil, Sparkles, Target, Trophy, UserPen } from "lucide-react";
import { DauTrangChinh, NoiDung } from "@/components/layout/khung";
import { ThanhTabKeHoach } from "@/features/ke-hoach/thanh-tab";
import { BieuTuongTron } from "@/components/ui/hinh-nen";
import { TrangThaiTrong } from "@/components/ui/hien-thi";
import { ChipLoc, HangChipLoc, HuyHieuTruong, PillTrangThai, TheNen, ThanhTienDo } from "@/components/ui/thiet-ke";
import { lyDoKhongSoDuoc } from "@/engine/trang-thai-du-lieu";
import { useTrangThaiDuLieu } from "@/components/ui/du-bao/dung-trang-thai";
import { Nut } from "@/components/ui/nut-the";
import { DongThongBao } from "@/components/ui/thong-bao";
import { DUONG_DAN } from "@/duong-dan";
import { chonNguyenVongLamMucTieu, homNay } from "@/state/chon";
import { useApp } from "@/state/store";
import { TEN_MON, TO_HOP, type MaToHop, type MucTieuChinh } from "@/state/types";
import { docMucTieu, type DuLieuMucTieu } from "./du-lieu";
import { SuaMucTieu } from "./sua-muc-tieu";
import { diem1, ngayVN, nhanDinhMucTieu, tenToHop } from "./tinh-toan";

type PhuongThuc = MucTieuChinh["phuongThuc"];
// Ẩn DGNL và hocBa vì chưa phát triển (chỉ giữ code, không hiển thị)
const CAC_PHUONG_THUC: { gia: PhuongThuc; nhan: string; day: string }[] = [
  { gia: "THPT", nhan: "THPT", day: "điểm thi tốt nghiệp THPT" },
  // { gia: "DGNL", nhan: "ĐGNL", day: "Đánh giá năng lực" },
  // { gia: "hocBa", nhan: "Học bạ", day: "Học bạ" },
];
const CAC_TO_HOP = Object.keys(TO_HOP) as MaToHop[];

export default function MucTieu() {
  const { s, datMucTieu } = useApp();
  const nav = useNavigate();
  const nv = chonNguyenVongLamMucTieu(s);
  const d = docMucTieu(s);
  // Chỉ THPT tính được thật; chọn hai cách kia chỉ để xem ghi chú, không lưu để các màn khác vẫn khớp số.
  const [phuongThuc, setPhuongThuc] = useState<PhuongThuc>(s.mucTieu?.phuongThuc ?? "THPT");
  const [moSua, setMoSua] = useState(false);

  if (!d) {
    const mucTieuCu = !!s.mucTieu; // có mục tiêu nhưng lựa chọn không còn trong danh sách
    return (
      <>
        <DauTrangChinh tieuDe="Mục tiêu chính" />
        <ThanhTabKeHoach />
        <NoiDung>
          <TrangThaiTrong bieuTuong={<Target size={28} />}
            tieuDe={mucTieuCu ? "Không tìm thấy mục tiêu cũ" : "Bạn chưa chọn mục tiêu chính"}
            moTa={mucTieuCu ? "Ngành bạn chọn trước đây không còn trong danh sách. Bạn chọn lại một mục tiêu nhé." : "Chọn ngành, trường bạn hướng tới để tính khoảng cách điểm và gợi ý môn cần tập trung."}>
            <Nut muiTen onClick={() => nav(DUONG_DAN.khamPha())}>Khám phá ngành học</Nut>
            {s.nguyenVong.length > 0 && (
              <Nut kieu="vien" onClick={() => (nv.ok ? datMucTieu(nv.mucTieu) : nav(DUONG_DAN.nguyenVong()))}>
                {nv.ok ? `Chọn ${nv.lc.nganh} làm mục tiêu` : `Xem ${s.nguyenVong.length} nguyện vọng đã lưu`}
              </Nut>
            )}
            {s.nguyenVong.length > 0 && !nv.ok && <span className="block text-[13px] text-chu-phu mt-2">Chưa đặt được từ nguyện vọng: {nv.lyDo}</span>}
          </TrangThaiTrong>
        </NoiDung>
      </>
    );
  }

  const doiToHop = (ma: MaToHop) => datMucTieu({ ...d.goc, maToHop: ma, toHop: TO_HOP[ma] });
  const pt = CAC_PHUONG_THUC.find((p) => p.gia === phuongThuc)!;

  return (
    <>
      <DauTrangChinh tieuDe="Mục tiêu chính" />
      <ThanhTabKeHoach />
      <NoiDung>
        <button type="button" onClick={() => nav(DUONG_DAN.chiTiet(d.lc.id))}
          className="nay-nhe w-full text-left the-mem p-3.5 flex items-center gap-3 cursor-pointer">
          <HuyHieuTruong ten={d.lc.maTruong ?? d.lc.truong} tone={d.lc.tone} kichThuoc={60} />
          <span className="flex-1 min-w-0">
            <span className="block text-[13px] font-bold text-xanh">Nguyện vọng chính</span>
            <b className="block text-[17px] text-muc leading-snug">{d.lc.truong} · {d.lc.nganh}</b>
            <span className="block text-[13px] text-chu-phu leading-snug">{d.lc.tenTruong}</span>
            <span className="mt-1.5 flex flex-wrap gap-1.5">
              {d.lc.khuVuc && <PillTrangThai tong="trung" icon={MapPin}>{d.lc.khuVuc}</PillTrangThai>}
              {d.lc.toHopXet && d.lc.toHopXet.length > 0 && <PillTrangThai tong="xanh">{d.lc.toHopXet.slice(0, 3).join(", ")}</PillTrangThai>}
            </span>
          </span>
          <ChevronRight size={20} className="text-chu-phu shrink-0" />
        </button>

        <div>
          <p className="text-[13px] font-bold text-chu-phu mb-1">Phương thức xét tuyển</p>
          <HangChipLoc nhan="Phương thức xét tuyển">
            {CAC_PHUONG_THUC.map((p) => <ChipLoc key={p.gia} chon={p.gia === phuongThuc} onClick={() => setPhuongThuc(p.gia)}>{p.nhan}</ChipLoc>)}
          </HangChipLoc>
        </div>

        {phuongThuc !== "THPT" ? (
          <DongThongBao tone="xanh" icon={Hammer} tieuDe={`Cách tính theo ${pt.day}: đang phát triển`}
            moTa="Hiện mới tính được theo điểm thi THPT, chưa có dữ liệu cho phương thức này. Bạn chọn THPT để xem khoảng cách và số ngày còn lại."
            hanhDong="Xem theo THPT" onClick={() => setPhuongThuc("THPT")} />
        ) : (
          <KhoiTHPT d={d} doiToHop={doiToHop} moSua={() => setMoSua(true)} />
        )}

        <button type="button" onClick={() => nav(DUONG_DAN.khamPha())}
          className="w-full min-h-12 text-[14px] font-bold text-xanh underline underline-offset-4 cursor-pointer">Đổi mục tiêu khác</button>
      </NoiDung>
      <SuaMucTieu mo={moSua} dong={() => setMoSua(false)} mt={d.goc} lc={d.lc} luu={datMucTieu} />
    </>
  );
}

function KhoiTHPT({ d, doiToHop, moSua }: { d: DuLieuMucTieu; doiToHop: (m: MaToHop) => void; moSua: () => void }) {
  const nav = useNavigate();
  const { s } = useApp();
  const duDiem = d.thieuDiem.length === 0;
  const nd = duDiem ? nhanDinhMucTieu(d.khoangCach, d.conThieu, d.hienTai, d.mucTieu, d.goc.maToHop) : null;
  const daQua = d.goc.ngayThi < homNay();
  const phanTram = d.mucTieu > 0 ? (d.hienTai / d.mucTieu) * 100 : 0;
  const tt = useTrangThaiDuLieu(d.lc);
  const lyDoKhongSo = lyDoKhongSoDuoc(d.lc);
  const soDuoc = lyDoKhongSo === null && tt.diemCuoi !== null && tt.namCuoi !== null;
  const uuTien = d.cacMon.filter((m) => m.thieu >= 0.25).slice(0, 2);
  const coGoiY = duDiem && d.conThieu > 0 && uuTien.length > 0;

  return (
    <>
      <div>
        <p className="text-[13px] font-bold text-chu-phu mb-1">Tổ hợp xét tuyển</p>
        <HangChipLoc nhan="Tổ hợp xét tuyển">
          {CAC_TO_HOP.map((ma) => <ChipLoc key={ma} chon={ma === d.goc.maToHop} onClick={() => doiToHop(ma)}>{ma}</ChipLoc>)}
        </HangChipLoc>
        <p className="mt-1.5 rounded-xl o-mem px-3 py-2 text-[13px] text-chu-phu">{d.goc.maToHop}: <b className="text-chu">{tenToHop(d.toHop)}</b></p>
      </div>

      {!duDiem && (
        <DongThongBao tone="cam" icon={UserPen} tieuDe={`Chưa có điểm môn ${d.thieuDiem.map((m) => TEN_MON[m]).join(", ")}`}
          moTa={`Cần điểm đủ 3 môn của tổ hợp ${d.goc.maToHop} để tính khoảng cách. Em nhập điểm để mình tính tiếp nhé.`}
          hanhDong="Nhập điểm các môn" onClick={() => nav(s.diemThi.length ? DUONG_DAN.diemThiThu() : DUONG_DAN.batDau(2))} />
      )}

      <TheNen className="space-y-3">
        <div className="flex items-center justify-between">
          <b className="text-[15px] text-muc">So sánh điểm và mục tiêu</b>
          <button type="button" onClick={moSua} className="min-h-11 -my-2 px-1 inline-flex items-center gap-1 text-[13px] font-bold text-xanh cursor-pointer"><Pencil size={14} aria-hidden />Chỉnh sửa</button>
        </div>
        <div className="grid grid-cols-2 divide-x divide-vien">
          <div className="pr-3 min-w-0">
            <span className="flex items-center gap-1.5 text-[13px] text-chu-phu"><BarChart3 size={15} className="text-xanh" aria-hidden />Điểm hiện tại</span>
            <p className="mt-0.5"><b className="so-lon text-[30px] leading-tight font-bold text-xanh">{duDiem ? diem1(d.hienTai) : "Chưa có"}</b>{duDiem && <span className="text-[14px] text-chu-phu"> / 30</span>}</p>
          </div>
          <div className="pl-3 min-w-0">
            <span className="flex items-center gap-1.5 text-[13px] text-chu-phu"><Target size={15} className="text-do" aria-hidden />Điểm mục tiêu</span>
            <p className="mt-0.5"><b className="so-lon text-[30px] leading-tight font-bold text-do-chu">{diem1(d.mucTieu)}</b><span className="text-[14px] text-chu-phu"> / 30</span></p>
          </div>
        </div>
        {duDiem
          ? <ThanhTienDo phanTram={phanTram} tong={d.conThieu > 0 ? "xanh" : "luc"} nhan="Điểm hiện tại so với mục tiêu" nhanNoi={`Đạt ${Math.min(100, Math.floor(phanTram))}%`} />
          : <p className="text-[13px] text-chu-phu">Chưa đủ điểm để tính phần trăm đạt mục tiêu.</p>}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-vien">
          <p className="text-[13px] text-chu-phu min-w-0">
            {soDuoc ? <>Điểm chuẩn tham khảo ({tt.namCuoi}): <b className="text-chu">{diem1(tt.diemCuoi!)}</b> điểm.</>
              : <>Chưa có điểm chuẩn THPT để so với mục tiêu{lyDoKhongSo ? `: ${lyDoKhongSo}` : ""}.</>}
          </p>
          {soDuoc && (
            <button type="button" onClick={() => nav(DUONG_DAN.chiTiet(d.lc.id))}
              className="nay-nhe shrink-0 min-h-11 px-3 rounded-xl o-mem text-[13px] font-bold text-xanh inline-flex items-center gap-1 cursor-pointer"><LineChart size={15} aria-hidden />Xem lịch sử điểm</button>
          )}
        </div>
      </TheNen>

      {duDiem && (d.conThieu > 0 ? (
        <div className="the-nen-nhe-do rounded-the p-4 flex items-center gap-4">
          <BieuTuongTron icon={Target} tone="do" kichThuoc={56} />
          <div className="min-w-0">
            <p className="text-[14px] font-bold text-do-chu">Khoảng cách cần vượt qua</p>
            <p className="text-do-chu leading-tight"><b className="so-lon text-[32px] font-bold">{diem1(d.conThieu)}</b><span className="text-[18px] font-bold"> điểm</span></p>
            {d.hienTai > 0 && <p className="text-[13px] text-chu-phu mt-0.5">Cần tăng thêm {Math.round((d.conThieu / d.hienTai) * 100)}% so với điểm hiện tại</p>}
          </div>
        </div>
      ) : (
        <div className="the-nen-nhe-luc rounded-the p-4 flex items-center gap-4">
          <BieuTuongTron icon={Trophy} tone="luc" kichThuoc={56} />
          <div>
            <p className="text-[14px] font-bold text-luc-chu">{d.hienTai > d.mucTieu ? "Em đang vượt mục tiêu" : "Em vừa chạm mục tiêu"}</p>
            <p className="text-luc-chu leading-tight"><b className="so-lon text-[32px] font-bold">+{diem1(d.hienTai - d.mucTieu)}</b><span className="text-[18px] font-bold"> điểm</span></p>
          </div>
        </div>
      ))}

      {!d.anDemNguoc && (
        <button type="button" onClick={moSua}
          className="nay-nhe w-full text-left the-nen-nhe-cam rounded-the p-4 flex items-center gap-4 cursor-pointer">
          <BieuTuongTron icon={CalendarDays} tone="cam" kichThuoc={56} />
          <span className="flex-1 min-w-0">
            <span className="block text-[14px] font-bold text-cam-chu">{daQua ? "Ngày thi dự kiến đã qua" : "Thời gian còn lại đến kỳ thi"}</span>
            {daQua ? (
              <span className="block text-[14px] text-chu mt-0.5">Em cập nhật ngày thi mới để mình đếm lại nhé.</span>
            ) : (
              <span className="block leading-tight text-muc"><b className="so-lon text-[28px] font-bold">{d.soNgayCon}</b><span className="text-[16px] font-bold"> ngày</span></span>
            )}
            <span className="block text-[13px] text-chu-phu">Thi ngày {ngayVN(d.goc.ngayThi)} (dự kiến)</span>
          </span>
          <Pencil size={18} className="text-cam-chu shrink-0" aria-hidden />
        </button>
      )}

      {nd && (
        <DongThongBao tone={nd.datRoi ? "luc" : "tim"} icon={nd.datRoi ? Trophy : Sparkles} tieuDe={nd.tieuDe} moTa={nd.moTa}
          onClick={() => nav(DUONG_DAN.monKeoDiem())} />
      )}

      {coGoiY ? (
        <TheNen tong="tim" className="space-y-3">
          <b className="flex items-center gap-2 text-[15px] text-muc"><ListChecks size={18} className="text-tim" aria-hidden />Gợi ý từ khoảng cách điểm</b>
          <ul className="space-y-1.5">
            {uuTien.map((m, i) => (
              <li key={m.mon} className="flex items-center gap-2 text-[14px]">
                <span className="size-6 rounded-full gd-huy-hieu-tim text-white grid place-items-center text-[13px] font-bold shrink-0">{i + 1}</span>
                <span className="flex-1 min-w-0 text-chu">{m.ten}</span>
                <span className="text-[13px] font-bold text-cam-chu">+{diem1(m.thieu)} điểm</span>
              </li>
            ))}
          </ul>
          <p className="text-[13px] text-chu-phu">{daQua || d.anDemNguoc ? "" : `Còn ${d.soNgayCon} ngày. `}Dồn sức vào môn còn thiếu nhiều nhất thay vì học dàn trải.</p>
          <div className="grid grid-cols-2 gap-2">
            <Nut kieu="vien" onClick={() => nav(DUONG_DAN.monKeoDiem())}>Môn ưu tiên</Nut>
            <Nut onClick={() => nav(DUONG_DAN.tuan())}>Xem kế hoạch</Nut>
          </div>
        </TheNen>
      ) : (
        <Nut kieu="vien" muiTen onClick={() => nav(DUONG_DAN.tuan())}>Xem kế hoạch học</Nut>
      )}
    </>
  );
}

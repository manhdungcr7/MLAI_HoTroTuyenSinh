// Màn 15 · Mục tiêu chính (tab Kế hoạch, mục "Mục tiêu").
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart3, CalendarDays, ChevronRight, Hammer, Lightbulb, Pencil, Sparkles, Target, Trophy, UserPen } from "lucide-react";
import { DauTrangChinh, NoiDung, ThanhPhuKeHoach } from "@/components/layout/khung";
import { BieuTuongTron, HuyHieuTruong } from "@/components/ui/hinh-nen";
import { ThanhTienDo, TrangThaiTrong } from "@/components/ui/hien-thi";
import { Nut, gop } from "@/components/ui/nut-the";
import { DongThongBao } from "@/components/ui/thong-bao";
import { DUONG_DAN } from "@/duong-dan";
import { chonNguyenVongLamMucTieu, homNay } from "@/state/chon";
import { useApp } from "@/state/store";
import { TEN_MON, TO_HOP, type MaToHop, type MucTieuChinh } from "@/state/types";
import { docMucTieu, type DuLieuMucTieu } from "./du-lieu";
import { SuaMucTieu } from "./sua-muc-tieu";
import { diem1, ngayVN, nhanDinhMucTieu, tenToHop } from "./tinh-toan";
import { NutTuVan } from "@/features/tu-van/tu-van";

type PhuongThuc = MucTieuChinh["phuongThuc"];
const CAC_PHUONG_THUC: { gia: PhuongThuc; nhan: string; day: string }[] = [
  { gia: "THPT", nhan: "THPT", day: "điểm thi tốt nghiệp THPT" },
  { gia: "DGNL", nhan: "ĐGNL", day: "Đánh giá năng lực" },
  { gia: "hocBa", nhan: "Học bạ", day: "Học bạ" },
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
        <DauTrangChinh tieuDe="Mục tiêu chính" moTa="Ngành, trường em muốn vào và chặng đường tới đó." />
        <ThanhPhuKeHoach />
        <NoiDung>
          <NutTuVan nguCanh="Mục tiêu học tập" />
          <TrangThaiTrong bieuTuong={<Target size={28} />}
            tieuDe={mucTieuCu ? "Không tìm thấy mục tiêu cũ" : "Em chưa chọn mục tiêu chính"}
            moTa={mucTieuCu ? "Ngành em chọn trước đây không còn trong danh sách. Em chọn lại một mục tiêu nhé." : "Chọn một ngành, trường em muốn vào. Mình sẽ tính em còn cách bao xa và nên tập trung môn nào."}>
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
      <DauTrangChinh tieuDe="Mục tiêu chính" moTa="Nguyện vọng em đã chọn và chặng đường tới đó." />
      <ThanhPhuKeHoach />
      <NoiDung>
        <NutTuVan nguCanh="Mục tiêu học tập" />
        <button type="button" onClick={() => nav(DUONG_DAN.chiTiet(d.lc.id))}
          className="w-full text-left rounded-the bg-trang border border-vien shadow-the p-3.5 flex items-center gap-3 active:bg-xanh-nhat">
          <HuyHieuTruong ten={d.lc.truong} tone={d.lc.tone} kichThuoc={56} />
          <span className="flex-1 min-w-0">
            <span className="block text-[12px] font-bold text-xanh">Nguyện vọng chính</span>
            <b className="block text-[17px] text-muc leading-snug">{d.lc.truong} · {d.lc.nganh}</b>
            <span className="block text-[13px] text-chu-phu leading-snug">{d.lc.tenTruong}</span>
          </span>
          <ChevronRight size={20} className="text-chu-phu shrink-0" />
        </button>

        <div>
          <p className="text-[13px] font-bold text-chu-phu mb-1.5">Phương thức xét tuyển</p>
          <div role="radiogroup" aria-label="Phương thức xét tuyển" className="flex bg-trang border border-vien rounded-xl p-1 gap-1">
            {CAC_PHUONG_THUC.map((p) => {
              const dang = p.gia === phuongThuc;
              return (
                <button key={p.gia} type="button" role="radio" aria-checked={dang} onClick={() => setPhuongThuc(p.gia)}
                  className={gop("flex-1 min-h-12 rounded-lg text-[14px] font-bold transition-colors", dang ? "gd-xanh text-white" : "text-chu-phu active:bg-xanh-nhat")}>
                  {p.nhan}
                </button>
              );
            })}
          </div>
        </div>

        {phuongThuc !== "THPT" ? (
          <DongThongBao tone="xanh" icon={Hammer} tieuDe={`Cách tính theo ${pt.day}: đang phát triển`}
            moTa="Hiện mình mới tính được theo điểm thi THPT, nên chưa có con số nào cho cách này. Em chọn THPT để xem khoảng cách và số ngày còn lại."
            hanhDong="Xem theo THPT" onClick={() => setPhuongThuc("THPT")} />
        ) : (
          <KhoiTHPT d={d} doiToHop={doiToHop} moSua={() => setMoSua(true)} />
        )}

        <div className="space-y-2 pt-1">
          <Nut muiTen onClick={() => nav(DUONG_DAN.monKeoDiem())}>Xem môn nên ưu tiên</Nut>
          <Nut kieu="vien" muiTen onClick={() => nav(DUONG_DAN.tuan())}>Xem kế hoạch cải thiện</Nut>
          <button type="button" onClick={() => nav(DUONG_DAN.khamPha())}
            className="w-full min-h-12 text-[14px] font-bold text-xanh underline underline-offset-4">Xem lại mục tiêu khác</button>
        </div>
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
  const ghiChuNguon = d.nguon.loai === "thiThu" && d.nguon.ngayGanNhat
    ? `Dự kiến từ lần thi thử gần nhất (${ngayVN(d.nguon.ngayGanNhat)})`
    : d.nguon.loai === "tronLan" ? "Dự kiến từ điểm thi thử và điểm em nhập" : "Dự kiến từ điểm em nhập ở hồ sơ";

  return (
    <>
      <div>
        <p className="text-[13px] font-bold text-chu-phu mb-1.5">Tổ hợp xét tuyển</p>
        <div role="radiogroup" aria-label="Tổ hợp xét tuyển" className="grid grid-cols-4 gap-2">
          {CAC_TO_HOP.map((ma) => {
            const dang = ma === d.goc.maToHop;
            return (
              <button key={ma} type="button" role="radio" aria-checked={dang} onClick={() => doiToHop(ma)}
                aria-label={`${ma}: ${tenToHop(TO_HOP[ma])}`}
                className={gop("min-h-12 rounded-xl border text-[15px] font-extrabold transition-colors", dang ? "bg-xanh-nhat border-xanh text-xanh" : "bg-trang border-vien text-chu active:bg-xanh-nhat")}>
                {ma}
              </button>
            );
          })}
        </div>
        <p className="text-[13px] text-chu-phu mt-1.5">{d.goc.maToHop}: <b className="text-chu">{tenToHop(d.toHop)}</b></p>
      </div>

      {!duDiem && (
        <DongThongBao tone="cam" icon={UserPen} tieuDe={`Chưa có điểm môn ${d.thieuDiem.map((m) => TEN_MON[m]).join(", ")}`}
          moTa={`Cần điểm đủ 3 môn của tổ hợp ${d.goc.maToHop} để tính khoảng cách. Em nhập điểm để mình tính tiếp nhé.`}
          hanhDong="Nhập điểm các môn" onClick={() => nav(s.diemThi.length ? DUONG_DAN.diemThiThu() : DUONG_DAN.batDau(2))} />
      )}

      <div className="rounded-the bg-trang border border-vien shadow-the p-4">
        <div className="grid grid-cols-2 divide-x divide-vien">
          <div className="pr-3 min-w-0">
            <span className="flex items-center gap-1.5 text-[13px] text-chu-phu"><BarChart3 size={15} className="text-xanh" />Điểm hiện tại</span>
            <p className="mt-0.5"><b className="text-[28px] leading-tight font-extrabold text-xanh">{duDiem ? diem1(d.hienTai) : "—"}</b><span className="text-[14px] text-chu-phu"> / 30</span></p>
          </div>
          <button type="button" onClick={moSua}
            className="pl-3 text-left min-w-0 rounded-r-lg active:bg-xanh-nhat">
            <span className="flex items-center gap-1.5 text-[13px] text-chu-phu"><Target size={15} className="text-do" />Điểm mục tiêu<Pencil size={14} className="text-xanh ml-auto" aria-hidden /><span className="sr-only">(bấm để sửa)</span></span>
            <p className="mt-0.5"><b className="text-[28px] leading-tight font-extrabold text-muc">{diem1(d.mucTieu)}</b><span className="text-[14px] text-chu-phu"> / 30</span></p>
          </button>
        </div>
        {duDiem && (
          <div className="mt-3">
            <ThanhTienDo phanTram={phanTram} tone={d.conThieu > 0 ? "xanh" : "luc"} cao="h-2.5" />
            <p className="text-[13px] text-chu-phu mt-1.5">Đạt <b className="text-chu">{Math.min(100, Math.floor(phanTram))}%</b> điểm mục tiêu · {ghiChuNguon}</p>
          </div>
        )}
        <p className="text-[12px] text-chu-phu mt-2 pt-2 border-t border-vien">
          Điểm chuẩn năm {d.lc.namDiem} của ngành: {diem1(d.lc.diemMin)} điểm (số của năm trước, năm nay có thể khác).
        </p>
      </div>

      {duDiem && (d.conThieu > 0 ? (
        <div className="rounded-the bg-do-nhat p-4 flex items-center gap-4">
          <BieuTuongTron icon={Target} tone="do" kichThuoc={56} />
          <div>
            <p className="text-[14px] font-bold text-do-chu">Khoảng cách cần vượt qua</p>
            <p className="text-do-chu leading-tight"><b className="text-[32px] font-extrabold">{diem1(d.conThieu)}</b><span className="text-[18px] font-bold"> điểm</span></p>
          </div>
        </div>
      ) : (
        <div className="rounded-the bg-luc-nhat p-4 flex items-center gap-4">
          <BieuTuongTron icon={Trophy} tone="luc" kichThuoc={56} />
          <div>
            <p className="text-[14px] font-bold text-luc-chu">{d.hienTai > d.mucTieu ? "Em đang vượt mục tiêu" : "Em vừa chạm mục tiêu"}</p>
            <p className="text-luc-chu leading-tight"><b className="text-[32px] font-extrabold">+{diem1(d.hienTai - d.mucTieu)}</b><span className="text-[18px] font-bold"> điểm</span></p>
          </div>
        </div>
      ))}

      <button type="button" onClick={moSua}
        className="w-full text-left rounded-the bg-cam-nhat p-4 flex items-center gap-4 active:brightness-95">
        <BieuTuongTron icon={CalendarDays} tone="cam" kichThuoc={56} />
        <span className="flex-1 min-w-0">
          <span className="block text-[14px] font-bold text-cam-chu">{daQua ? "Ngày thi dự kiến đã qua" : "Thời gian còn lại đến kỳ thi"}</span>
          {daQua ? (
            <span className="block text-[14px] text-chu mt-0.5">Em cập nhật ngày thi mới để mình đếm lại nhé.</span>
          ) : (
            <span className="block leading-tight text-muc"><b className="text-[28px] font-extrabold">{d.soNgayCon}</b><span className="text-[16px] font-bold"> ngày</span></span>
          )}
          <span className="block text-[13px] text-chu-phu">Thi ngày {ngayVN(d.goc.ngayThi)} (dự kiến)</span>
        </span>
        <Pencil size={18} className="text-cam-chu shrink-0" />
      </button>

      {nd && (
        <DongThongBao tone={nd.datRoi ? "luc" : "tim"} icon={nd.datRoi ? Trophy : Sparkles} tieuDe={nd.tieuDe} moTa={nd.moTa}
          onClick={() => nav(DUONG_DAN.monKeoDiem())} />
      )}

      {duDiem && d.conThieu > 0 && (
        <div className="rounded-the bg-trang border border-cam/40 p-4">
          <p className="flex items-start gap-2.5">
            <Lightbulb size={22} className="text-cam shrink-0 mt-0.5" />
            <b className="text-[16px] leading-snug text-cam-chu">Nếu chỉ học dàn trải, em sẽ khó bù đủ {diem1(d.conThieu)} điểm.</b>
          </p>
          <p className="text-[14px] text-chu mt-2 pl-[34px]">
            {daQua ? "" : `Còn ${d.soNgayCon} ngày. `}Chia đều sức cho mọi môn thì môn nào cũng tăng chậm. Em nên dồn sức vào môn có thể tăng điểm với công sức hợp lý.
          </p>
        </div>
      )}

      <p className="text-[12px] text-chu-phu px-1">Điểm hiện tại là điểm dự kiến (lấy lần thi thử gần nhất của từng môn, chưa có thì lấy điểm em nhập), không phải kết quả thi thật.</p>
    </>
  );
}

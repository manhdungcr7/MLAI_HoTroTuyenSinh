// Nhắc nhở: bật/tắt, nhắc trước giờ học, nhắc chuẩn bị bài tối hôm trước, quyền thông báo, danh sách sắp tới.
// Nói thật giới hạn: chưa có máy chủ nên chỉ nhắc được khi ứng dụng đang mở hoặc đã thêm lên màn hình chính.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell, BellOff, BellRing, BookOpen, BookOpenCheck, CalendarPlus, Clock, Info, NotebookPen, School, Send, ShieldCheck, X, type LucideIcon,
} from "lucide-react";
import { DauTrangCoQuayLai, NoiDung } from "@/components/layout/khung";
import { TieuDeMuc } from "@/components/ui/hien-thi";
import { Nut, The, gop } from "@/components/ui/nut-the";
import { DongThongBao } from "@/components/ui/thong-bao";
import { DUONG_DAN } from "@/duong-dan";
import { useApp } from "@/state/store";
import { docQuyenThongBao, guiThongBao, xinQuyenThongBao, type QuyenThongBao } from "./dung-nhac-nho";
import { nhacSapToi, type LoaiNhac } from "./nhac-nho";
import { CongTacLon, NhomChon, OGio, TheCaiDat } from "./thanh-phan";
import { nhanThoiDiem } from "./tinh-tien-do";

const ICON_NHAC: Record<LoaiNhac, { icon: LucideIcon; mau: string; nen: string; nhan: string }> = {
  tuHoc: { icon: BookOpen, mau: "text-luc-chu", nen: "bg-luc-nhat", nhan: "Tự học" },
  diHoc: { icon: School, mau: "text-xanh", nen: "bg-xanh-nhat", nhan: "Đi học" },
  chuanBi: { icon: NotebookPen, mau: "text-cam-chu", nen: "bg-cam-nhat", nhan: "Chuẩn bị bài" },
};
const HIEN_TOI_DA = 6;

export default function NhacNhoTrang() {
  const { s, capNhatNhacNho } = useApp();
  const nav = useNavigate();
  const n = s.nhacNho;
  const [quyen, setQuyen] = useState<QuyenThongBao>(docQuyenThongBao);
  const [thu, setThu] = useState<null | { daGui: boolean }>(null);
  const [xemHet, setXemHet] = useState(false);

  const sapToi = nhacSapToi(s, new Date());
  const hien = xemHet ? sapToi : sapToi.slice(0, HIEN_TOI_DA);

  const xinQuyen = async () => setQuyen(await xinQuyenThongBao());
  const batTat = async (bat: boolean) => {
    capNhatNhacNho({ bat });
    if (bat && quyen === "chuaHoi") await xinQuyen();
  };
  const guiThu = async () => {
    const daGui = await guiThongBao("Nguyện Vọng AI", "Đây là thông báo thử. Lời nhắc học sẽ hiện như thế này.", "thu");
    setThu({ daGui });
  };

  return (
    <>
      <DauTrangCoQuayLai tieuDe="Nhắc nhở" />
      <NoiDung>
        <TheCaiDat icon={n.bat ? BellRing : BellOff} tone={n.bat ? "xanh" : "muc"} tieuDe="Nhắc nhở học tập"
          moTa={n.bat ? "Đang bật. Mình chỉ nhắc việc có thật trong lịch của em." : "Đang tắt. Bật lên để được nhắc đi học và chuẩn bị bài."}
          phai={<CongTacLon dang={n.bat} onChange={(v) => void batTat(v)} nhan="Bật nhắc nhở" />} />

        <QuyenThongBaoThe quyen={quyen} xinQuyen={() => void xinQuyen()} />

        {/* Vẫn cho chỉnh khi đang tắt: lần bật sau dùng luôn cài đặt này */}
        <TheCaiDat icon={Clock} tone="xanh" tieuDe="Nhắc trước giờ học" moTa="Áp dụng cho tiết ở trường, học thêm và giờ tự học.">
          <NhomChon nhan="Nhắc trước bao lâu" cot={4} giaTri={n.truocPhut} onChange={(v) => capNhatNhacNho({ truocPhut: v })}
            cacLua={[5, 10, 15, 30].map((p) => ({ gia: p, nhan: `${p} phút` }))} />
        </TheCaiDat>

        <TheCaiDat icon={BookOpenCheck} tone="cam" tieuDe="Nhắc chuẩn bị bài tối hôm trước"
          moTa="Chỉ nhắc khi ngày mai em có tiết theo môn: soạn sách vở, xem lại bài cũ."
          phai={<CongTacLon dang={n.nhacChuanBiBai} onChange={(v) => capNhatNhacNho({ nhacChuanBiBai: v })} nhan="Nhắc chuẩn bị bài" />}>
          {n.nhacChuanBiBai && (
            <div className="max-w-44"><OGio nhan="Nhắc lúc" giaTri={n.gioChuanBiBai} onChange={(v) => v && capNhatNhacNho({ gioChuanBiBai: v })} /></div>
          )}
        </TheCaiDat>

        <section aria-labelledby="gui-thu" className="space-y-2">
          <Nut kieu="vien" bieuTuong={Send} onClick={() => void guiThu()}><span id="gui-thu">Gửi thử một thông báo</span></Nut>
          {thu && (
            <div role="status" className="space-y-2">
              {thu.daGui ? (
                <p className="text-[13px] text-luc-chu font-semibold text-center">Đã gửi. Nếu không thấy, em kiểm tra chế độ Không làm phiền của máy nhé.</p>
              ) : (
                <>
                  <p className="text-[13px] text-chu-phu text-center">Trình duyệt chưa cho phép thông báo, nên lời nhắc sẽ hiện ngay trong ứng dụng như sau:</p>
                  <div className="rounded-the bg-trang border border-vien shadow-the p-3.5 flex gap-3 items-start hien-len">
                    <span className="size-10 rounded-xl gd-xanh text-white grid place-items-center shrink-0"><Bell size={20} /></span>
                    <span className="flex-1 min-w-0">
                      <b className="block text-[14px] text-muc">Nguyện Vọng AI · bây giờ</b>
                      <span className="block text-[13px] text-chu">Đây là thông báo thử. Lời nhắc học sẽ hiện như thế này.</span>
                    </span>
                    <button type="button" aria-label="Đóng thông báo thử" onClick={() => setThu(null)} className="size-11 -m-2 grid place-items-center rounded-full text-chu-phu"><X size={18} /></button>
                  </div>
                </>
              )}
            </div>
          )}
        </section>

        <section aria-labelledby="sap-toi">
          <TieuDeMuc phai={sapToi.length ? `${sapToi.length} nhắc` : undefined}><span id="sap-toi">Sắp tới · 24 giờ</span></TieuDeMuc>
          {!n.bat && sapToi.length > 0 && <p className="text-[13px] text-chu-phu mb-2">Nhắc nhở đang tắt nên các nhắc dưới đây sẽ chưa hiện.</p>}
          <The className="!py-1.5">
            {sapToi.length ? (
              <>
                <ul className="divide-y divide-vien">
                  {hien.map((x) => {
                    const ic = ICON_NHAC[x.loai];
                    return (
                      <li key={x.id} className="flex items-start gap-3 py-2.5">
                        <span className={gop("size-10 rounded-xl grid place-items-center shrink-0", ic.nen, ic.mau)}><ic.icon size={19} /></span>
                        <span className="flex-1 min-w-0">
                          <span className="flex items-baseline justify-between gap-2">
                            <b className="text-[14px] text-chu leading-snug min-w-0">{x.tieuDe}</b>
                            <span className="text-[12px] font-bold text-xanh whitespace-nowrap">{nhanThoiDiem(x.luc, new Date())}</span>
                          </span>
                          <span className="block text-[13px] text-chu-phu leading-snug">{x.moTa}</span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
                {sapToi.length > HIEN_TOI_DA && (
                  <button type="button" onClick={() => setXemHet((v) => !v)} className="w-full min-h-11 text-[13px] font-bold text-xanh border-t border-vien">
                    {xemHet ? "Thu gọn" : `Xem thêm ${sapToi.length - HIEN_TOI_DA} nhắc`}
                  </button>
                )}
              </>
            ) : (
              <div className="py-3 space-y-2">
                <p className="text-[14px] text-chu-phu">Không có nhắc nào trong 24 giờ tới.{!s.coDinh.length && " Em nhập lịch học để mình nhắc đi học và chuẩn bị bài."}</p>
                {!s.coDinh.length && <Nut kieu="nhe" bieuTuong={CalendarPlus} onClick={() => nav(DUONG_DAN.caiDatLichHoc())}>Nhập lịch học</Nut>}
              </div>
            )}
          </The>
        </section>

        <DongThongBao tone="xanh" icon={Info} tieuDe="Nhắc nhở hoạt động thế nào?"
          moTa="Lời nhắc hiện được khi ứng dụng đang mở, hoặc khi em đã thêm ứng dụng lên màn hình chính. Khi tắt hẳn ứng dụng thì chưa nhắc được; phần này sẽ có khi Nguyện Vọng AI có máy chủ." />
        <p className="text-[12px] text-chu-phu px-1 flex gap-1.5"><ShieldCheck size={14} className="shrink-0 mt-0.5" />Mình không dùng thông báo để kéo em quay lại ứng dụng. Chỉ nhắc việc có trong lịch của em.</p>
      </NoiDung>
    </>
  );
}

function QuyenThongBaoThe({ quyen, xinQuyen }: { quyen: QuyenThongBao; xinQuyen: () => void }) {
  if (quyen === "daChoPhep") return <DongThongBao tone="luc" icon={ShieldCheck} tieuDe="Đã cho phép thông báo" moTa="Lời nhắc sẽ hiện cả khi em đang ở ứng dụng khác (ứng dụng vẫn cần đang mở)." />;
  if (quyen === "daChan") {
    return <DongThongBao tone="do" icon={BellOff} tieuDe="Trình duyệt đang chặn thông báo"
      moTa="Em bấm biểu tượng ổ khóa cạnh địa chỉ trang, chọn cho phép Thông báo, rồi tải lại trang. Trong lúc đó, mình nhắc ngay trong ứng dụng." />;
  }
  if (quyen === "khongHoTro") {
    return <DongThongBao tone="muc" icon={Info} tieuDe="Trình duyệt này chưa hỗ trợ thông báo" moTa="Mình vẫn hiện lời nhắc ngay trong ứng dụng khi em đang mở." />;
  }
  return (
    <div className="rounded-the bg-cam-nhat p-3.5 space-y-3">
      <div className="flex gap-3 items-start">
        <BellRing size={22} className="text-cam-chu shrink-0 mt-0.5" />
        <p className="text-[13px] text-chu"><b className="block text-[15px] text-cam-chu leading-snug">Cho phép thông báo</b>Để lời nhắc hiện lên cả khi em đang ở ứng dụng khác. Trình duyệt sẽ hỏi em một lần.</p>
      </div>
      <Nut bieuTuong={Bell} onClick={xinQuyen}>Cho phép thông báo</Nut>
    </div>
  );
}

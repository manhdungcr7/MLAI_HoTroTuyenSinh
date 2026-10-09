import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { CircleAlert } from "lucide-react";
import { DauTrangCoQuayLai, NoiDung } from "@/components/layout/khung";
import { Nut } from "@/components/ui/nut-the";
import { DUONG_DAN, type BuocBatDau } from "@/duong-dan";
import { useApp } from "@/state/store";
import { changCuaEm } from "@/state/chang";
import { CAC_MON, type HoSo, type MonId } from "@/state/types";
import Buoc1, { ID_TRUONG } from "./buoc-1";
import Buoc2, { idDiem } from "./buoc-2";
import Buoc3 from "./buoc-3";
import { ManHinhPhanTichAI } from "./man-hinh-phan-tich";
import { DaLuuTam, ThanhBuoc } from "./thanh-phan";
import { THU_TU_BAT_BUOC, docDiem, kiemTraBuoc1, vietDiem } from "./tinh-toan";

/** Đưa con trỏ tới ô và cuộn ô đó ra giữa màn hình. */
function denO(id: string) {
  requestAnimationFrame(() => {
    const o = document.getElementById(id);
    if (!o) return;
    o.focus({ preventScroll: true });
    o.scrollIntoView({ block: "center", behavior: "smooth" });
  });
}

const diemDau = (h: HoSo) => CAC_MON.some((m) => h.diem[m] !== null);

export default function BatDau() {
  const { buoc } = useParams();
  const nav = useNavigate();
  const { s, capNhatHoSo } = useApp();
  const h = s.hoSo;
  const so = Number(buoc) as BuocBatDau;
  const hopLe = so === 1 || so === 2 || so === 3;

  const [daSua, setDaSua] = useState(() => !!s.hoSo.hoTen); // mở lại hồ sơ đang điền dở cũng là đã lưu
  const [daThuBuoc1, setDaThuBuoc1] = useState(false); // chỉ báo thiếu sau khi em bấm Tiếp tục
  // Chữ điểm đang gõ. Giữ riêng để "7," gõ dở không bị mất; số hợp lệ được ghi ngay vào hồ sơ.
  const [chuDiem, setChuDiem] = useState<Record<MonId, string>>(() =>
    Object.fromEntries(CAC_MON.map((m) => [m, vietDiem(h.diem[m])])) as Record<MonId, string>);

  useEffect(() => { window.scrollTo(0, 0); }, [so]);

  if (!hopLe) return <Navigate to={DUONG_DAN.batDau(1)} replace />;

  const sua = (p: Partial<HoSo>) => { capNhatHoSo(p); setDaSua(true); };
  const goDiem = (m: MonId, chu: string) => {
    setChuDiem((c) => ({ ...c, [m]: chu }));
    const kq = docDiem(chu);
    // Ô sai hoặc trống thì hồ sơ coi như chưa có điểm môn đó, tổ hợp hiện "chưa đủ điểm".
    sua({ diem: { ...h.diem, [m]: kq.loai === "hopLe" ? kq.gia : null } });
  };

  const loi1 = kiemTraBuoc1(h);
  const thieu1 = THU_TU_BAT_BUOC.filter((k) => loi1[k]);
  const monSai = CAC_MON.filter((m) => { const k = docDiem(chuDiem[m]).loai; return k === "khongPhaiSo" || k === "ngoaiKhoang"; });

  const [dangPhanTich, setDangPhanTich] = useState(false);

  const denBuoc = (b: BuocBatDau) => nav(DUONG_DAN.batDau(b));

  const chuyenSangKhamPha = () => {
    const loi = kiemTraBuoc1(h);
    const thieu = THU_TU_BAT_BUOC.filter((k) => loi[k]);
    if (thieu.length) {
      // Không dùng hộp thoại của trình duyệt: đưa em về Bước 1 và tô đúng ô còn thiếu.
      setDaThuBuoc1(true);
      if (so !== 1) denBuoc(1);
      setTimeout(() => denO(ID_TRUONG[thieu[0]]), 150);
      return;
    }
    capNhatHoSo({ hoanTat: true });
    // Em lớp 10–11 chưa có điểm: không có gì để phân tích, vào thẳng Hôm nay.
    if (diemDau(h) || changCuaEm({ hoSo: h }) !== "dinhHuong") setDangPhanTich(true);
    else nav(DUONG_DAN.homNay(), { replace: true });
  };

  const tiepTuc = () => {
    if (so === 1) {
      setDaThuBuoc1(true);
      if (thieu1.length) return denO(ID_TRUONG[thieu1[0]]);
      chuyenSangKhamPha();
      return;
    }
    if (so === 2) {
      if (monSai.length) return denO(idDiem(monSai[0]));
      return denBuoc(3);
    }
    chuyenSangKhamPha();
  };

  if (dangPhanTich) {
    // Nước rút và thi lại đã có điểm: tới thẳng danh sách nguyện vọng; còn lại tới Khám phá.
    const den = changCuaEm({ hoSo: h }) !== "dinhHuong" && diemDau(h) ? DUONG_DAN.nguyenVong() : DUONG_DAN.khamPha();
    return <ManHinhPhanTichAI onHoanTat={() => nav(den, { replace: true })} />;
  }

  return (
    <div className="min-h-dvh flex flex-col">
      <DauTrangCoQuayLai tieuDe="Tạo hồ sơ" buoc={`Bước ${so}/3`} quayLai={so === 1 ? DUONG_DAN.chao() : DUONG_DAN.batDau((so - 1) as BuocBatDau)} />
      <ThanhBuoc hien={so} denBuoc={denBuoc} />
      <NoiDung className="flex-1 !space-y-5 pt-1 !pb-36">
        {so === 1 && <Buoc1 h={h} sua={sua} loi={daThuBuoc1 ? loi1 : {}} />}
        {so === 2 && <Buoc2 h={h} sua={sua} chuDiem={chuDiem} goDiem={goDiem} />}
        {so === 3 && <Buoc3 h={h} sua={sua} />}

        {so === 1 && daThuBuoc1 && thieu1.length > 0 && (
          <div role="alert" className="rounded-the bg-do-nhat p-3.5 text-[13px] text-do-chu">
            <p className="flex items-center gap-1.5 font-extrabold text-[14px]"><CircleAlert size={17} />Em còn thiếu {thieu1.length} mục:</p>
            <ul className="mt-1 ml-6 list-disc space-y-0.5 font-semibold">{thieu1.map((k) => <li key={k}>{loi1[k]}</li>)}</ul>
          </div>
        )}
        {so === 2 && (
          <button type="button" onClick={chuyenSangKhamPha} className="w-full min-h-12 text-[14px] font-bold text-xanh">
            Chưa nhớ điểm? Xem gợi ý trước
          </button>
        )}
      </NoiDung>

      <div className="sticky bottom-0 z-20 border-t border-vien bg-nen px-4 pt-2.5 vung-an-toan-duoi">
        <DaLuuTam daSua={daSua} />
        <div className="grid grid-cols-[1fr_1.5fr] gap-2.5 mt-2 mb-1.5">
          {so === 1
            ? <Nut kieu="vien" onClick={() => denBuoc(2)}>Bổ sung điểm</Nut>
            : <Nut kieu="vien" onClick={() => denBuoc((so - 1) as BuocBatDau)}>Quay lại</Nut>}
          <Nut muiTen onClick={tiepTuc}>{so === 1 ? "Xem gợi ý" : so === 3 ? "Hoàn tất" : "Tiếp tục"}</Nut>
        </div>
      </div>
    </div>
  );
}

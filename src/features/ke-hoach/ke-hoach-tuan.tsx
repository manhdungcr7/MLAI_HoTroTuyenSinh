// Màn 17 · Kế hoạch tuần: "Việc cần làm | Lịch" trên cùng một màn, kèm nút "Xếp lịch giúp em".
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { History, Settings, Sparkles, WandSparkles } from "lucide-react";
import { DauTrangChinh, NoiDung, ThanhPhuKeHoach } from "@/components/layout/khung";
import { DaiNgay, TieuDeTuan } from "@/components/ui/dai-ngay";
import { ThanhChuyen } from "@/components/ui/nhap-lieu";
import { DongThongBao } from "@/components/ui/thong-bao";
import { Nut } from "@/components/ui/nut-the";
import { DUONG_DAN } from "@/duong-dan";
import { bayNgayCuaTuan, congNgay } from "@/engine/xep-lich";
import { homNay, tuanHienTai, viecCuaTuan } from "@/state/chon";
import { useApp } from "@/state/store";
import { CheDoLich } from "./che-do-lich";
import { CheDoViec } from "./che-do-viec";
import { phutBayGio } from "./dinh-dang";
import { HopXepLich, type KetQuaXep } from "./hop-xep-lich";
import { useThongBaoNgan } from "./thanh-phan";
import { daKetThuc, soBuoiTuHoc } from "./tinh-toan";

type CheDo = "viec" | "lich";
const CAC_CHE_DO: { gia: CheDo; nhan: string }[] = [{ gia: "viec", nhan: "Việc cần làm" }, { gia: "lich", nhan: "Lịch" }];
/** Sau giờ này, "Xếp lịch giúp em" bắt đầu xếp từ ngày mai để không đặt việc vào giờ đã qua. */
const MUON_TRONG_NGAY = 20 * 60 + 30;

export default function KeHoachTuan() {
  const { s, xepLai } = useApp();
  const nav = useNavigate();
  const loc = useLocation();
  const [params, setParams] = useSearchParams();
  const cheDo: CheDo = params.get("xem") === "lich" ? "lich" : "viec";
  const hom = homNay();
  const [tuan, setTuan] = useState(tuanHienTai);
  const [ngay, setNgay] = useState(hom);
  const ngays = useMemo(() => bayNgayCuaTuan(tuan), [tuan]);
  const ngayChon = ngays.includes(ngay) ? ngay : ngays[0];
  const quaKhu = ngays[6] < hom;
  const [thongBao, hienThongBao] = useThongBaoNgan();
  const [ketQua, setKetQua] = useState<KetQuaXep | null>(null);
  const [choXepLai, setChoXepLai] = useState(false);

  // Thông báo ngắn do màn Chi tiết việc gửi về (Hoàn thành, Dời lịch, Bỏ qua).
  useEffect(() => {
    const chu = (loc.state as { thongBao?: string } | null)?.thongBao;
    if (!chu) return;
    hienThongBao(chu);
    nav(DUONG_DAN.tuan(cheDo), { replace: true, state: null });
    // chỉ chạy khi có thông báo mới
  }, [loc.state]); // eslint-disable-line react-hooks/exhaustive-deps

  const doiTuan = (t: string) => {
    setTuan(t);
    setNgay(bayNgayCuaTuan(t).includes(hom) ? hom : t);
  };

  const xep = () => {
    const laTuanNay = tuan === tuanHienTai();
    let tuNgay: string | undefined = laTuanNay ? hom : undefined;
    if (laTuanNay && phutBayGio() >= MUON_TRONG_NGAY) tuNgay = congNgay(hom, 1);
    if (tuNgay && tuNgay > ngays[6]) {
      setKetQua({ chuaXep: 0, ghiChu: ["Tuần này đã gần hết. Em chuyển sang tuần sau rồi bấm Xếp lịch giúp em nhé."], tuNgay, hetTuan: true });
      return;
    }
    const r = xepLai(tuan, tuNgay);
    setKetQua({ ...r, tuNgay });
  };

  // "Xếp cả việc đã bỏ qua": đợi trạng thái việc cập nhật xong rồi mới xếp lại.
  useEffect(() => {
    if (!choXepLai) return;
    setChoXepLai(false);
    xep();
  }, [choXepLai]); // eslint-disable-line react-hooks/exhaustive-deps

  const soTuHocTheoNgay = useMemo(() => {
    const ra: Record<string, number> = {};
    for (const k of s.khoiHoc) if (k.loai === "tuHoc" && ngays.includes(k.ngay)) ra[k.ngay] = (ra[k.ngay] ?? 0) + 1;
    return ra;
  }, [s.khoiHoc, ngays]);

  const conViec = viecCuaTuan(s.viec, tuan).filter((v) => !daKetThuc(s.trangThaiViec[v.id])).length;
  const nenGoiYXep = !quaKhu && soBuoiTuHoc(s.khoiHoc, ngays) === 0 && s.coDinh.length > 0 && conViec > 0;

  return (
    <>
      <DauTrangChinh tieuDe="Kế hoạch tuần" phai={
        <button type="button" aria-label="Cài đặt tự học" onClick={() => nav(DUONG_DAN.caiDatTuHoc())}
          className="size-11 shrink-0 grid place-items-center rounded-full bg-trang border border-vien text-chu active:bg-xanh-nhat">
          <Settings size={20} />
        </button>
      } />
      <ThanhPhuKeHoach />
      <NoiDung>
        <TieuDeTuan thuHai={tuan} onDoi={doiTuan} />
        <DaiNgay cacNgay={ngays} chon={ngayChon} onChon={setNgay} soViec={soTuHocTheoNgay} />
        <ThanhChuyen cacMuc={CAC_CHE_DO} giaTri={cheDo} onChange={(v) => setParams(v === "lich" ? { xem: "lich" } : {}, { replace: true })} />

        {quaKhu ? (
          <DongThongBao tone="muc" icon={History} tieuDe="Tuần đã qua" moTa="Em chỉ xem lại được lịch và việc của tuần này." />
        ) : nenGoiYXep ? (
          <DongThongBao tone="xanh" icon={Sparkles} tieuDe="Tuần này chưa có giờ tự học"
            moTa={`Bấm để mình chia ${conViec} việc vào các khung trống quanh lịch học của em.`} hanhDong="Xếp lịch giúp em" onClick={xep} />
        ) : conViec > 0 ? (
          <Nut kieu="vien" bieuTuong={WandSparkles} onClick={xep}>Xếp lịch giúp em</Nut>
        ) : null}

        {cheDo === "viec"
          ? <CheDoViec ngays={ngays} ngayChon={ngayChon} quaKhu={quaKhu} hienThongBao={hienThongBao} />
          : <CheDoLich ngayChon={ngayChon} quaKhu={quaKhu} hienThongBao={hienThongBao} />}
      </NoiDung>

      <HopXepLich ketQua={ketQua} ngays={ngays} dong={() => setKetQua(null)}
        xemLich={() => { setKetQua(null); setParams({ xem: "lich" }, { replace: true }); }}
        daXepCaBoQua={() => { setKetQua(null); setChoXepLai(true); }} />
      {thongBao}
    </>
  );
}

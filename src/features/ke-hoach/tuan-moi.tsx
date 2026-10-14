// Tuần mới: tự tạo việc một lần (có Hoàn tác) và gợi ý giữ việc dở của tuần trước.
import { useEffect, useMemo, useRef, useState } from "react";
import { Redo2, Sparkles, Undo2 } from "lucide-react";
import { Nut } from "@/components/ui/nut-the";
import { DongThongBao } from "@/components/ui/thong-bao";
import { homNay, mucTieuDayDu, tuanHienTai, viecCuaTuan } from "@/state/chon";
import { useLuuCucBo } from "@/state/luu-cuc-bo";
import { useApp } from "@/state/store";
import type { KhoiHoc, ViecCanHoc } from "@/state/types";
import { phutBayGio } from "./dinh-dang";
import { ngayBatDauXep, saoViecSangTuan, viecDoTuanTruoc } from "./lich-tuan";
import { viecChoTuan } from "./tao-viec-tuan";

/** Các tuần đã xử lý, nhớ trong máy để không tự tạo hay hỏi lại. */
const MAC_DINH = { taoTuDong: [] as string[], mangViec: [] as string[] };

interface BanChup { viec: ViecCanHoc[]; khoi: KhoiHoc[]; moi: number }

/**
 * Mở màn tuần hiện tại mà chưa có việc nào, đã có mục tiêu và lịch cố định thì tự tạo việc và xếp lịch đúng một lần.
 * Em bấm Hoàn tác thì trả về như cũ và không tự tạo lại tuần đó nữa.
 */
export function TuanMoiTuTao({ tuan, hienThongBao }: { tuan: string; hienThongBao: (c: string) => void }) {
  const { s, datViec, xepLai, xoaKhoi } = useApp();
  const [daXuLy, datDaXuLy] = useLuuCucBo("ke-hoach-tuan-moi", MAC_DINH);
  const [ban, setBan] = useState<BanChup | null>(null);
  const daChay = useRef(new Set<string>());

  const coThe = tuan === tuanHienTai() && !!mucTieuDayDu(s) && s.coDinh.length > 0 && viecCuaTuan(s.viec, tuan).length === 0;
  useEffect(() => {
    if (!coThe || daXuLy.taoTuDong.includes(tuan) || daChay.current.has(tuan)) return;
    const bd = ngayBatDauXep(tuan, homNay(), phutBayGio(), s.cauHinh.ngayNghi);
    if (bd.hetTuan) return;
    const kq = viecChoTuan(s, tuan, bd.tuNgay);
    if (!kq.ok) return;
    daChay.current.add(tuan);
    const truoc = { viec: s.viec, khoi: s.khoiHoc };
    const r = xepLai(tuan, bd.tuNgay, kq.viec);
    datDaXuLy((c) => ({ ...c, taoTuDong: [...c.taoTuDong, tuan] }));
    setBan({ ...truoc, moi: kq.moi });
    if (r.chuaXep > 0) hienThongBao(`Còn ${r.chuaXep} việc chưa có chỗ trong tuần`);
  }, [coThe, tuan]); // eslint-disable-line react-hooks/exhaustive-deps

  const tuanCu = useRef(tuan);
  useEffect(() => { if (tuanCu.current !== tuan) { tuanCu.current = tuan; setBan(null); } }, [tuan]);
  if (!ban) return null;

  const hoanTac = () => {
    const cu = new Set(ban.khoi.map((k) => k.id));
    s.khoiHoc.filter((k) => !cu.has(k.id) && k.id.startsWith("auto-")).forEach((k) => xoaKhoi(k.id));
    datViec(ban.viec);
    setBan(null);
    hienThongBao("Đã hoàn tác, tuần này chưa có việc");
  };
  return (
    <DongThongBao tone="luc" icon={Sparkles} tieuDe="Đã tạo kế hoạch học tập cho tuần này"
      moTa={`Có ${ban.moi} việc theo mục tiêu của bạn, đã xếp vào giờ tự học còn trống.`}>
      <span className="grid grid-cols-2 gap-2 mt-3">
        <Nut kieu="vien" bieuTuong={Undo2} onClick={hoanTac}>Hoàn tác</Nut>
        <Nut kieu="nhe" onClick={() => setBan(null)}>Bỏ</Nut>
      </span>
    </DongThongBao>
  );
}

/** Thẻ "Tuần trước còn N việc chưa xong": Giữ = tạo bản sao sang tuần này rồi xếp giờ; Bỏ = không hỏi lại. */
export function TheViecDoTuanTruoc({ tuan, hienThongBao }: { tuan: string; hienThongBao: (c: string) => void }) {
  const { s, datViec, xepLai } = useApp();
  const [daXuLy, datDaXuLy] = useLuuCucBo("ke-hoach-tuan-moi", MAC_DINH);
  const ds = useMemo(() => viecDoTuanTruoc(s.viec, s.trangThaiViec, tuan), [s.viec, s.trangThaiViec, tuan]);
  if (tuan !== tuanHienTai() || ds.length === 0 || daXuLy.mangViec.includes(tuan)) return null;

  const xuLy = () => datDaXuLy((c) => ({ ...c, mangViec: [...c.mangViec, tuan] }));
  const giu = () => {
    datViec([...s.viec, ...ds.map((v) => saoViecSangTuan(v, tuan))]);
    const bd = ngayBatDauXep(tuan, homNay(), phutBayGio(), s.cauHinh.ngayNghi);
    if (!bd.hetTuan) xepLai(tuan, bd.tuNgay);
    xuLy();
    hienThongBao(`Đã giữ ${ds.length} việc sang tuần này`);
  };
  return (
    <DongThongBao tone="cam" icon={Redo2} tieuDe={`Tuần trước còn ${ds.length} việc chưa xong`}
      moTa={<>{ds.slice(0, 3).map((v) => v.tieuDe).join("; ")}{ds.length > 3 && ` và ${ds.length - 3} việc khác`}. Em muốn giữ lại làm tuần này không?</>}>
      <span className="grid grid-cols-2 gap-2 mt-3">
        <Nut kieu="vien" onClick={xuLy}>Bỏ</Nut>
        <Nut onClick={giu}>Giữ</Nut>
      </span>
    </DongThongBao>
  );
}

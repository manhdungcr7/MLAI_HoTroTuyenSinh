// Thẻ "Điểm của bạn": vòng điểm tổ hợp tốt nhất, số ngành đủ điểm / thử sức (đã đối soát), bốn nhóm ngành nhiều lựa chọn.
// Chỉ đếm chương trình so được. Đây là so điểm với điểm chuẩn năm gần nhất, không phải xác suất đậu.
import { useMemo } from "react";
import { ArrowRight, BarChart3, PencilLine } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { MAU_NHOM_O, VongDiem, iconNhomNganh } from "@/components/ui/du-bao";
import { Nut, gop } from "@/components/ui/nut-the";
import { LUA_CHON_MAU } from "@/data/lua-chon-mau";
import { DUONG_DAN } from "@/duong-dan";
import { dinhDang, dinhDangSo } from "@/engine/dinh-dang";
import { useApp } from "@/state/store";
import { boiCanhTu } from "./phu-hop";
import { tinhDiemCuaBan } from "./tinh-diem-cua-ban";

export function TheDiemCuaBan({ onChonNhom }: { onChonNhom?: (nhom: string) => void }) {
  const { s } = useApp();
  const nav = useNavigate();
  const bc = useMemo(() => boiCanhTu(s), [s]);
  const k = useMemo(() => tinhDiemCuaBan(bc.diem, LUA_CHON_MAU), [bc.diem, LUA_CHON_MAU.length]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section aria-label="Điểm của bạn" className="the-mem p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-[16px] font-extrabold text-muc"><BarChart3 size={20} className="text-xanh" aria-hidden />Điểm của bạn</h2>
        <Link to={DUONG_DAN.hoSo()} className="inline-flex min-h-11 items-center gap-1 text-[13px] font-bold text-xanh">Xem chi tiết <ArrowRight size={15} aria-hidden /></Link>
      </div>
      {k ? (
        <>
          <div className="mt-1 flex items-center gap-4">
            <VongDiem diem={k.tong} nhanGiua="/30 điểm">
              <b className="so-lon text-[30px] font-bold leading-none text-muc tabular-nums">{dinhDang(k.tong, 1)}</b>
            </VongDiem>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] text-chu-phu">Tổ hợp tốt nhất của bạn: {k.toHop}</p>
              <span className="mt-1 inline-flex items-center rounded-full gd-menta px-3 py-1 text-[14px] font-bold text-ngoc-chu">Đủ điểm {dinhDangSo(k.soDuDiem)} ngành</span>
              <p className="mt-1.5 text-[13px] leading-snug text-chu">So với điểm chuẩn năm gần nhất, thử sức thêm <b className="text-cam-chu">{dinhDangSo(k.soThuSuc)}</b> ngành (trong {dinhDangSo(k.soDoiSoat)} ngành đã đối soát).</p>
            </div>
          </div>
          {k.theoNhom.length > 0 && (
            <ul className="mt-3 grid grid-cols-2 min-[400px]:grid-cols-4 gap-2" aria-label="Nhóm ngành có nhiều ngành vừa sức">
              {k.theoNhom.slice(0, 4).map((g, i) => {
                const Icon = iconNhomNganh(g.nhom), m = MAU_NHOM_O[i % MAU_NHOM_O.length];
                return (
                  <li key={g.nhom}>
                    <button type="button" onClick={() => onChonNhom ? onChonNhom(g.nhom) : nav(DUONG_DAN.khamPha())} className={gop("w-full min-h-14 rounded-xl p-2 text-left cursor-pointer active:brightness-95", m.nen)}>
                      <span className="flex items-center gap-1.5"><Icon size={16} className={gop("shrink-0", m.chu)} aria-hidden /><b className="truncate text-[13px] text-muc">{g.nhom}</b></span>
                      <span className={gop("mt-0.5 block text-[13px] font-semibold", m.chu)}>{dinhDangSo(g.so)} ngành</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      ) : (
        <div className="mt-1 flex items-center gap-4">
          <VongDiem diem={null}><PencilLine size={26} className="mx-auto text-chu-phu" aria-hidden /></VongDiem>
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-[15px] font-bold leading-snug text-muc">Nhập điểm để xem em đang ở đâu.</p>
            <p className="text-[13px] leading-snug text-chu-phu">Chỉ cần điểm 3 môn của một tổ hợp.</p>
            <Nut bieuTuong={PencilLine} rong={false} onClick={() => nav(DUONG_DAN.batDau(2))}>Nhập điểm</Nut>
          </div>
        </div>
      )}
    </section>
  );
}

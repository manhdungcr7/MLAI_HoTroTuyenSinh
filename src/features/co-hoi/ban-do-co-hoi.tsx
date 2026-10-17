// Bản đồ cơ hội của em: với điểm hiện tại, mỗi nhãn (Thử sức · Vừa sức · An toàn · Dự phòng) có bao nhiêu ngành, nằm ở nhóm ngành nào.
// So với điểm chuẩn năm gần nhất của từng ngành, không phải xác suất đậu. Chỉ đếm ngành được phép so; phần còn lại nói rõ lý do.
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronUp, FlaskConical, Info, PencilLine } from "lucide-react";
import { DauTrangCoQuayLai, NoiDung } from "@/components/layout/khung";
import { KhungDangTai, KhungLoi, TrangThaiTrong } from "@/components/ui/hien-thi";
import { Nut } from "@/components/ui/nut-the";
import { iconNhomNganh } from "@/components/ui/du-bao";
import { HienDan, MAU_NHAN_NV, ONhom, TheNen, useSoChay } from "@/components/ui/thiet-ke";
import { LUA_CHON_MAU } from "@/data/lua-chon-mau";
import { DUONG_DAN } from "@/duong-dan";
import { demNganhTheoNhan, TEN_LY_DO, THU_TU_NHAN, type DemNganhTheoNhan, type LyDoChuaSo } from "@/engine/ban-do-co-hoi";
import { dinhDangDiem, dinhDangSo } from "@/engine/dinh-dang";
import { tongChoLuaChon } from "@/features/kham-pha/to-hop";
import { useBoLoc } from "@/features/kham-pha/dung-bo-loc";
import type { NhanNguyenVong } from "@/state/types";
import { namDuBaoHienTai, useDiemEm, useTinhLucRanh } from "./dung-co-hoi";

const MO_TA_NHAN: Record<NhanNguyenVong, string> = {
  "Thử sức": "Điểm của em thấp hơn điểm chuẩn năm gần nhất.",
  "Vừa sức": "Điểm của em cao hơn điểm chuẩn dưới 1,5 điểm.",
  "An toàn": "Điểm của em cao hơn điểm chuẩn từ 1,5 đến dưới 4 điểm.",
  "Dự phòng": "Điểm của em cao hơn điểm chuẩn từ 4 điểm trở lên.",
};
const SO_NHOM_GON = 4;

function DaiNhan({ nhan, kq, chay, onChonNhom }: { nhan: NhanNguyenVong; kq: DemNganhTheoNhan; chay: boolean; onChonNhom: (nhom: string) => void }) {
  const m = MAU_NHAN_NV[nhan];
  const [moHet, setMoHet] = useState(false);
  const so = kq.theoNhan[nhan];
  const hienSo = useSoChay(so, 700, chay);
  const nhom = useMemo(() => kq.theoNhom.filter((g) => g.theoNhan[nhan] > 0).sort((a, b) => b.theoNhan[nhan] - a.theoNhan[nhan] || a.nhom.localeCompare(b.nhom, "vi")), [kq, nhan]);
  const hien = moHet ? nhom : nhom.slice(0, SO_NHOM_GON);
  return (
    <TheNen as="section" aria-label={`${nhan}: ${dinhDangSo(so)} ngành`}>
      <div className="flex items-center gap-3">
        <span className={`size-11 shrink-0 rounded-xl grid place-items-center ${m.nen} ${m.chu}`}><m.icon size={22} strokeWidth={2.2} aria-hidden /></span>
        <div className="min-w-0 flex-1">
          <h2 className={`text-[16px] font-extrabold leading-tight ${m.chu}`}>{nhan}</h2>
          <p className="text-[13px] text-chu-phu leading-snug">{MO_TA_NHAN[nhan]}</p>
        </div>
        <div className="text-right shrink-0">
          <b className="so-lon block text-[28px] leading-none text-muc tabular-nums" aria-hidden>{dinhDangSo(hienSo)}</b>
          <span className="text-[13px] text-chu-phu">ngành</span>
        </div>
      </div>
      {nhom.length > 0 ? (
        <>
          <ul className="mt-3 grid grid-cols-2 gap-2" aria-label={`Nhóm ngành ở nhãn ${nhan}`}>
            {hien.map((g) => (
              <li key={g.nhom} className="min-w-0">
                <ONhom icon={iconNhomNganh(g.nhom)} ten={g.nhom} soNganh={g.theoNhan[nhan]} tong={m.tong === "luc" || m.tong === "xanh" || m.tong === "tim" || m.tong === "cam" ? m.tong : "xanh"} onClick={() => onChonNhom(g.nhom)} />
              </li>
            ))}
          </ul>
          {nhom.length > SO_NHOM_GON && (
            <button type="button" onClick={() => setMoHet((x) => !x)} aria-expanded={moHet} className="mt-1 w-full min-h-11 inline-flex items-center justify-center gap-1 text-[13px] font-bold text-xanh">
              {moHet ? <>Thu gọn<ChevronUp size={16} aria-hidden /></> : <>Xem cả {nhom.length} nhóm<ChevronDown size={16} aria-hidden /></>}
            </button>
          )}
        </>
      ) : <p className="mt-2 text-[13px] text-chu-phu">Chưa có ngành nào ở nhãn này.</p>}
    </TheNen>
  );
}

function DongChuaSo({ kq }: { kq: DemNganhTheoNhan }) {
  if (kq.tongChuaSo === 0) return null;
  const phan = (Object.keys(kq.chuaSo) as LyDoChuaSo[]).filter((k) => kq.chuaSo[k] > 0).sort((a, b) => kq.chuaSo[b] - kq.chuaSo[a]);
  return (
    <p className="rounded-xl bg-nen px-3 py-2.5 text-[13px] leading-snug text-chu">
      Chưa so được <b>{dinhDangSo(kq.tongChuaSo)}</b> ngành: {phan.map((k) => `${dinhDangSo(kq.chuaSo[k])} ${TEN_LY_DO[k]}`).join(", ")}.
    </p>
  );
}

export default function BanDoCoHoi() {
  const nav = useNavigate();
  const { diem, khoa } = useDiemEm();
  const [, suaBoLoc] = useBoLoc();
  const tot = useMemo(() => tongChoLuaChon({ toHopXet: [] }, diem), [diem]);
  const coDiem = tot.tong !== null && tot.toHop !== null;
  const [ket, thuLai] = useTinhLucRanh(coDiem ? khoa : "trong", () => (coDiem ? demNganhTheoNhan(LUA_CHON_MAU, diem, undefined, namDuBaoHienTai()) : null));

  // Hộp lọc của Khám phá chỉ có nhóm ngành (chưa có lọc theo nhãn): mở Khám phá đã lọc theo nhóm, nhãn xem ở từng thẻ.
  const chonNhom = (nhom: string) => { suaBoLoc({ nhom }); nav(DUONG_DAN.khamPha()); };

  return (
    <>
      <DauTrangCoQuayLai tieuDe="Bản đồ cơ hội" quayLai={DUONG_DAN.khamPha()} />
      <NoiDung>
        {ket.trang === "xong" && <span hidden data-tinh-ms={Math.round(ket.ms)} />}
        {!coDiem ? (
          <TrangThaiTrong bieuTuong={<PencilLine size={26} aria-hidden />} tieuDe="Chưa có điểm để vẽ bản đồ" moTa="Nhập điểm đủ ba môn của một tổ hợp, bản đồ sẽ đếm số ngành ở từng nhãn.">
            <Nut muiTen onClick={() => nav(DUONG_DAN.batDau(2))}>Nhập điểm</Nut>
          </TrangThaiTrong>
        ) : ket.trang === "loi" ? (
          <KhungLoi moTa={`Chưa tính được bản đồ (${ket.moTa}). Hồ sơ của em vẫn an toàn trên máy.`} thuLai={thuLai} />
        ) : ket.trang === "tinh" || ket.kq === null ? (
          <div role="status" aria-live="polite">
            <p className="text-[14px] text-chu-phu mb-3">Đang tính theo điểm của em…</p>
            <KhungDangTai cao="h-32" soKhung={4} />
          </div>
        ) : (
          <>
            <p className="text-[14px] text-chu">
              Tổ hợp <b>{tot.toHop}</b> cao nhất của em: <b>{dinhDangDiem(tot.tong)}</b>/30. Dưới đây là số ngành ở từng nhãn, so với điểm chuẩn năm gần nhất.
            </p>
            <HienDan className="space-y-3">
              {THU_TU_NHAN.map((n) => (
                <DaiNhan key={n} nhan={n} kq={ket.kq!} chay onChonNhom={chonNhom} />
              ))}
            </HienDan>
            <DongChuaSo kq={ket.kq} />
            <p className="flex items-start gap-2 text-[13px] leading-snug text-chu-phu"><Info size={16} className="mt-0.5 shrink-0" aria-hidden />So với điểm chuẩn năm gần nhất, không phải xác suất đậu. Chạm một nhóm để xem các ngành trong Khám phá.</p>
            <Nut kieu="vien" bieuTuong={FlaskConical} muiTen onClick={() => nav(DUONG_DAN.phongThuDiem())}>Thử đổi điểm</Nut>
          </>
        )}
      </NoiDung>
    </>
  );
}

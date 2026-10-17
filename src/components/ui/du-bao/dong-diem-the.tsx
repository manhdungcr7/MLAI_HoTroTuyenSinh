// Dòng điểm chuẩn + dự báo gọn cho thẻ danh sách. Điểm chuẩn chỉ hiện khi dữ liệu cho phép so (không phải điểm sàn, không phải phương thức khác).
import { BarChart3 } from "lucide-react";
import { dinhDangDiem } from "@/engine/dinh-dang";
import { viTriSoVoiDuBao } from "@/engine/du-bao-diem-chuan";
import type { LuaChon } from "@/state/types";
import { laChuongTrinhMoi, NhanTrangThaiDuLieu } from "./trang-thai-du-lieu";
import { useTrangThaiDuLieu } from "./dung-trang-thai";
import { MiniDuBao } from "./thanh-du-bao";
import { MAU_KET_LUAN } from "./mau-ket-luan";
import { GiaiThichNgan } from "./giai-thich-ngan";

export function DongDiemThe({ lc, diemEm, giaiThich }: { lc: LuaChon; diemEm: number | null; giaiThich?: boolean }) {
  const tt = useTrangThaiDuLieu(lc);
  const d = tt.duBao;
  const mau = d && diemEm !== null ? MAU_KET_LUAN[viTriSoVoiDuBao(diemEm, d)] : undefined;
  return (
    <span className="block min-w-0 space-y-2">
      <span className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[13px] text-chu">
        {tt.diemCuoi !== null ? (
          <span className="inline-flex items-center gap-1.5">
            <BarChart3 size={16} className="shrink-0 text-xanh" aria-hidden />
            <span>Điểm chuẩn {tt.namCuoi}: <b className="tabular-nums text-muc text-[15px]">{dinhDangDiem(tt.diemCuoi)}</b></span>
            {giaiThich && <GiaiThichNgan khoa="diemChuan" />}
          </span>
        ) : <NhanTrangThaiDuLieu tt={tt} moi={laChuongTrinhMoi(lc, tt)} />}
        {tt.loai === "motNam" && <NhanTrangThaiDuLieu tt={tt} />}
        {mau && <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[13px] font-bold ${mau.nen} ${mau.chu}`}><mau.icon size={13} aria-hidden />{mau.ngan}</span>}
      </span>
      {d && (
        <span className="flex items-center gap-2 text-[13px] text-chu-phu">
          <span className="shrink-0">Dự báo {d.namDuBao}</span>
          <MiniDuBao d={d} diem={diemEm} mau={mau} className="flex-1 min-w-8" />
          <b className="shrink-0 tabular-nums text-muc">{dinhDangDiem(d.thap)}–{dinhDangDiem(d.cao)}</b>
        </span>
      )}
    </span>
  );
}

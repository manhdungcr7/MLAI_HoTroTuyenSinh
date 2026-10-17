// Hiển thị đúng từng loại dữ liệu điểm chuẩn (A-F). Không bao giờ gọi điểm sàn là điểm chuẩn; không so điểm phương thức khác với điểm THPT.
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, CircleDot, CircleHelp, GraduationCap, Info, Minus, Search, TrendingUp, type LucideIcon } from "lucide-react";
import { Nhan, Nut, gop } from "@/components/ui/nut-the";
import { LUA_CHON_MAU } from "@/data/lua-chon-mau";
import { DUONG_DAN } from "@/duong-dan";
import { dinhDangDiem } from "@/engine/dinh-dang";
import { phanLoaiDuLieu, type TrangThaiDuLieu } from "@/engine/trang-thai-du-lieu";
import {
  GIAI_THICH_TRANG_THAI, NHAN_CHUONG_TRINH_MOI, NHAN_LOI_THOI, NHAN_THAM_CHIEU, NHAN_THAM_CHIEU_HAN_CHE, TIEU_DE_TRANG_THAI,
} from "@/noi-dung/du-bao";
import type { LuaChon, ToneTen } from "@/state/types";

const TONE: Record<TrangThaiDuLieu["loai"], ToneTen | null> = { nhieuNam: "xanh", motNam: "cam", chiDiemSan: "cam", khongDu: null, phuongThucKhac: "tim" };
const ICON: Record<TrangThaiDuLieu["loai"], LucideIcon> = { nhieuNam: TrendingUp, motNam: CircleDot, chiDiemSan: Minus, khongDu: CircleHelp, phuongThucKhac: GraduationCap };

/** Phát hiện chương trình mới từ dữ liệu (tên ghi "mới"). Chưa có cờ riêng trong dữ liệu nên chỉ nhận dấu hiệu rõ ràng. */
export const laChuongTrinhMoi = (lc: LuaChon, tt: TrangThaiDuLieu) => tt.loai === "khongDu" && /\(mới\)|chương trình mới/i.test(`${lc.nganh} ${lc.moTa}`);

/** Nhãn nhỏ một dòng, dùng ở thẻ danh sách. `tt.loai === "nhieuNam"` có thể ẩn bằng `anNhieuNam`. */
export function NhanTrangThaiDuLieu({ tt, moi, anNhieuNam, className }: { tt: TrangThaiDuLieu; moi?: boolean; anNhieuNam?: boolean; className?: string }) {
  if (tt.loai === "nhieuNam" && anNhieuNam) return null;
  const tone = TONE[tt.loai];
  const chu = moi ? "Chương trình mới" : tt.loai === "motNam" ? "Tham chiếu hạn chế" : TIEU_DE_TRANG_THAI[tt.loai];
  const Icon = ICON[tt.loai];
  if (!tone) return <span className={gop("inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[13px] font-bold bg-nen text-chu-phu border border-vien", className)}><Icon size={13} aria-hidden />{chu}</span>;
  return <Nhan tone={tone} className={gop("gap-1", className)}><Icon size={13} aria-hidden />{chu}</Nhan>;
}

/** Ngành tương tự: cùng nhóm ngành, đã có điểm chuẩn nhiều năm; ưu tiên cùng trường rồi cùng khu vực. */
export function nganhTuongTu(lc: LuaChon, toiDa = 4): { lc: LuaChon; tt: TrangThaiDuLieu }[] {
  const diem = (x: LuaChon) => (x.truong === lc.truong ? 0 : x.khuVuc === lc.khuVuc ? 1 : 2);
  return LUA_CHON_MAU
    .filter((x) => x.id !== lc.id && x.nhomNganh === lc.nhomNganh)
    .map((x) => ({ lc: x, tt: phanLoaiDuLieu(x) }))
    .filter((x) => x.tt.loai === "nhieuNam")
    .sort((a, b) => diem(a.lc) - diem(b.lc))
    .slice(0, toiDa);
}

/** Khối giải thích cho loại dữ liệu B-F (không vẽ thanh so sánh). */
export function KhoiTrangThaiDuLieu({ lc, tt, className }: { lc: LuaChon; tt: TrangThaiDuLieu; className?: string }) {
  const [xem, setXem] = useState(false);
  const moi = laChuongTrinhMoi(lc, tt);
  const ds = useMemo(() => (xem ? nganhTuongTu(lc) : []), [xem, lc]);
  const canhBao = tt.loai === "khongDu" || tt.loai === "chiDiemSan";
  const Icon = canhBao ? AlertCircle : Info;
  const dong: string[] = [];
  if (tt.loiThoi) dong.push(NHAN_LOI_THOI);
  if (tt.laThamChieu || tt.nguonThuCap) dong.push(NHAN_THAM_CHIEU);
  return (
    <section className={gop("rounded-the bg-trang border border-vien shadow-the p-4 space-y-2.5", className)} aria-label="Tình trạng dữ liệu điểm chuẩn">
      <div className="flex flex-wrap items-center gap-2">
        <Icon size={20} className={canhBao ? "text-cam" : "text-xanh"} aria-hidden />
        <h2 className="text-[16px] font-extrabold text-muc">{moi ? "Chương trình mới" : tt.loai === "motNam" ? NHAN_THAM_CHIEU_HAN_CHE.split(":")[0] : TIEU_DE_TRANG_THAI[tt.loai]}</h2>
      </div>
      <p className="text-[14px] text-chu leading-snug">{moi ? NHAN_CHUONG_TRINH_MOI : tt.loai === "motNam" ? NHAN_THAM_CHIEU_HAN_CHE : GIAI_THICH_TRANG_THAI[tt.loai]}</p>
      {tt.loai === "motNam" && tt.namCuoi !== null && tt.diemCuoi !== null && (
        <p className="text-[14px] text-chu">Điểm chuẩn {tt.namCuoi}: <b className="text-muc tabular-nums">{dinhDangDiem(tt.diemCuoi)}</b></p>
      )}
      {tt.loai === "chiDiemSan" && tt.namCuoi !== null && <p className="text-[13px] text-chu-phu">Mức điểm sàn ghi nhận năm {tt.namCuoi}. Chưa dùng để so với điểm của em.</p>}
      {dong.map((c) => <p key={c} className="text-[13px] text-chu-phu leading-snug">{c}</p>)}
      {tt.loai === "khongDu" && (
        <>
          <Nut kieu="vien" bieuTuong={Search} aria-expanded={xem} onClick={() => setXem(!xem)}>{xem ? "Ẩn ngành tương tự" : "Xem ngành tương tự"}</Nut>
          {xem && (ds.length === 0
            ? <p className="text-[13px] text-chu-phu">Chưa tìm được ngành tương tự có đủ điểm chuẩn.</p>
            : <ul className="divide-y divide-vien rounded-xl border border-vien">
                {ds.map(({ lc: x, tt: t }) => (
                  <li key={x.id}>
                    <Link to={DUONG_DAN.chiTiet(x.id)} className="flex min-h-12 items-center justify-between gap-3 px-3 py-2 active:bg-xanh-nhat">
                      <span className="min-w-0"><b className="block text-[14px] text-muc leading-snug">{x.nganh}</b><span className="block text-[13px] text-chu-phu">{x.truong}</span></span>
                      <span className="shrink-0 text-right text-[13px] text-chu-phu"><b className="block text-[15px] text-muc tabular-nums">{dinhDangDiem(t.diemCuoi)}</b>{t.namCuoi}</span>
                    </Link>
                  </li>
                ))}
              </ul>)}
        </>
      )}
    </section>
  );
}

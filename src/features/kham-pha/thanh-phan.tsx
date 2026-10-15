// Thành phần riêng của slice Khám phá: thẻ lựa chọn có nút tim, nhãn phù hợp tính từ hồ sơ, hộp chọn trường.
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart3, ChevronRight, GraduationCap, Heart, MapPin, Search, Wallet } from "lucide-react";
import { HuyHieuTruong } from "@/components/ui/hinh-nen";
import { HopTruot } from "@/components/ui/hien-thi";
import { OInput } from "@/components/ui/nhap-lieu";
import { Nhan, gop } from "@/components/ui/nut-the";
import { coHocPhi, phuongThucNgan } from "@/data/lua-chon-phu";
import { LUA_CHON_MAU } from "@/data/lua-chon-mau";
import { hocPhiChu } from "@/data/lua-chon-phu";
import { DUONG_DAN } from "@/duong-dan";
import { useApp } from "@/state/store";
import type { LuaChon } from "@/state/types";
import { TONE_MUC, type KetQuaPhuHop } from "./phu-hop";
import { dinhDang } from "@/engine/dinh-dang";
import { khopTuKhoa, diemLienQuan } from "./tim-kiem";

/**
 * Chữ trên huy hiệu. HuyHieuTruong lấy 4 chữ cái đầu nên HCMUTE, HCMUE, HCMUS, HCMUT đều thành "HCMU";
 * ở đây bỏ tiền tố "HCM" và lấy chữ đầu mỗi từ với tên nhiều từ để các trường không trùng huy hiệu.
 */
export function kyHieu(truong: string): string {
  const tu = truong.trim().split(/\s+/);
  if (tu.length > 1) return /^[A-Z0-9]{2,4}$/.test(tu[0]) ? tu[0] : tu.map((t) => t[0]).join("").toUpperCase();
  return /^HCM[A-Z]{2,}$/.test(truong) ? truong.slice(3) : truong;
}

export const khoangDiem = (l: LuaChon) => (dinhDang(l.diemMin, 1) === dinhDang(l.diemMax, 1) ? dinhDang(l.diemMin, 1) : `${dinhDang(l.diemMin, 1)} – ${dinhDang(l.diemMax, 1)}`);
export const khoangHocPhi = (l: LuaChon) => hocPhiChu(l);

/** Nhãn mức phù hợp tính từ hồ sơ. Chưa có điểm thì nói rõ là chưa so được. */
export function NhanPhuHop({ kq, xuongDong }: { kq: KetQuaPhuHop; xuongDong?: boolean }) {
  // xuongDong: cho phép chữ xuống dòng khi nhãn nằm trong ô hẹp (bảng so sánh ở màn 360px).
  const dong = xuongDong ? "whitespace-normal text-center" : "whitespace-nowrap";
  if (!kq.muc) return <span className={gop("inline-flex items-center rounded-lg px-2 py-0.5 text-[12px] font-bold bg-nen text-chu-phu border border-vien", dong)}>{kq.lyDoKhongSo ? "Khác phương thức" : "Chưa đủ điểm để so"}</span>;
  return <Nhan tone={TONE_MUC[kq.muc]} className={xuongDong ? "!whitespace-normal text-center" : undefined}>{kq.muc}</Nhan>;
}

/** Nút tim: lưu/bỏ lựa chọn khỏi danh sách yêu thích. */
export function NutTim({ id, ten, className }: { id: string; ten: string; className?: string }) {
  const { s, doiYeuThich } = useApp();
  const dang = s.yeuThich.includes(id);
  const xuLy = (e: React.MouseEvent) => {
    e.stopPropagation();
    doiYeuThich(id);
    window.dispatchEvent(
      new CustomEvent("nvai-thong-bao-tim", {
        detail: { id, ten, daThich: !dang },
      })
    );
  };
  return (
    <button type="button" onClick={xuLy} aria-pressed={dang} aria-label={dang ? `Bỏ lưu ${ten}` : `Lưu ${ten} vào yêu thích`}
      className={gop("size-11 grid place-items-center rounded-full transition-colors active:scale-95 cursor-pointer", dang ? "text-do" : "text-chu-phu active:bg-xanh-nhat", className)}>
      <Heart size={22} strokeWidth={2.2} fill={dang ? "currentColor" : "none"} />
    </button>
  );
}

/** Thẻ một lựa chọn ở màn Khám phá: bấm thẻ mở chi tiết, bấm tim để lưu. */
export function TheKhamPha({ l, kq, onClick }: { l: LuaChon; kq: KetQuaPhuHop; onClick: () => void }) {
  return (
    <article className="relative rounded-the bg-trang border border-vien shadow-the">
      <button type="button" onClick={onClick} className="w-full text-left block p-3.5 rounded-the active:bg-xanh-nhat">
        <span className="flex items-start gap-3 pr-9">
          <HuyHieuTruong ten={kyHieu(l.truong)} tone={l.tone} kichThuoc={48} />
          <span className="flex-1 min-w-0">
            <b className="block text-[16px] text-muc leading-snug">{l.nganh}</b>
            <span className="block text-[13px] text-chu-phu leading-snug truncate"><b className="font-semibold text-chu">{l.truong}</b> · {l.tenTruong}</span>
            <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
              <NhanPhuHop kq={kq} />
              <span className="text-[12px] text-chu-phu leading-snug">{kq.tomTat}</span>
            </span>
          </span>
        </span>
        <span className="mt-3 flex items-center gap-2 border-t border-vien pt-2.5">
          <span className="flex-1 min-w-0 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-[13px] text-chu">
            <span className="inline-flex items-center gap-1.5 min-w-0"><BarChart3 size={15} className="text-xanh shrink-0" /><span className="truncate"><b>{khoangDiem(l).replace(" – ", "–")}</b> <span className="text-chu-phu">({l.namDiem})</span></span></span>
            <span className="inline-flex items-center gap-1.5 min-w-0"><Wallet size={15} className="text-cam shrink-0" /><span className="truncate">{coHocPhi(l) ? `${khoangHocPhi(l)} tr/năm` : "Chưa có học phí"}</span></span>
            <span className="inline-flex items-center gap-1.5 min-w-0"><MapPin size={15} className="text-do shrink-0" /><span className="truncate">{l.khuVuc}</span></span>
            <span className="inline-flex items-center gap-1.5 min-w-0"><GraduationCap size={15} className="text-tim shrink-0" /><span className="truncate">{l.bac}{phuongThucNgan(l) ? ` · ${phuongThucNgan(l)}` : ""}</span></span>
          </span>
          <ChevronRight size={18} className="text-chu-phu shrink-0" aria-hidden />
        </span>
      </button>
      <NutTim id={l.id} ten={`${l.nganh} – ${l.truong}`} className="absolute top-1.5 right-1.5" />
    </article>
  );
}

/** Dải nhắc nhỏ: nguồn số liệu minh bạch. */
export function GhiChuDuLieuMau({ className }: { className?: string }) {
  return (
    <div className={gop("flex items-center justify-between gap-2 rounded-xl bg-nen px-3 py-2 text-[12px] text-chu-phu", className)}>
      <span>Số liệu được đối chiếu từ đề án tuyển sinh chính thức.</span>
      <Link to={DUONG_DAN.veDuLieu()} className="font-semibold text-xanh hover:underline shrink-0">Nguồn dữ liệu</Link>
    </div>
  );
}

/** Hộp trượt chọn một lựa chọn (dùng để chọn trường thứ hai khi so sánh hoặc đổi trường). */
export function HopChonLuaChon({ mo, dong, tieuDe, boQua = [], onChon }: {
  mo: boolean; dong: () => void; tieuDe: string; boQua?: string[]; onChon: (l: LuaChon) => void;
}) {
  const { s } = useApp();
  const [tuKhoa, setTuKhoa] = useState("");
  const ds = useMemo(() => {
    const k = tuKhoa.trim();
    // Ưu tiên những trường bạn đã thích hoặc đã thêm vào nguyện vọng.
    const quen = (l: LuaChon) => (s.yeuThich.includes(l.id) || s.nguyenVong.includes(l.id) ? 0 : 1);
    return LUA_CHON_MAU
      .filter((l) => !boQua.includes(l.id) && (!k || khopTuKhoa(l, k)))
      .sort((a, b) => {
        if (k) {
          const dlq = diemLienQuan(b, k) - diemLienQuan(a, k);
          if (dlq !== 0) return dlq;
        }
        return quen(a) - quen(b);
      })
      .slice(0, 40); // danh mục có hàng nghìn ngành, chỉ hiện 40 mục đầu; bạn gõ tên để tìm chính xác
  }, [tuKhoa, boQua, s.yeuThich, s.nguyenVong]);
  return (
    <HopTruot mo={mo} dong={dong} tieuDe={tieuDe}>
      <OInput bieuTuong={Search} value={tuKhoa} onChange={(e) => setTuKhoa(e.target.value)} placeholder="Tìm trường hoặc ngành..." aria-label="Tìm trường hoặc ngành" />
      <ul className="mt-3 space-y-2">
        {ds.map((l) => {
          const quen = s.yeuThich.includes(l.id) || s.nguyenVong.includes(l.id);
          return (
            <li key={l.id}>
              <button type="button" onClick={() => { onChon(l); setTuKhoa(""); }}
                className="w-full min-h-14 flex items-center gap-3 rounded-xl border border-vien bg-trang px-3 py-2 text-left active:bg-xanh-nhat">
                <HuyHieuTruong ten={kyHieu(l.truong)} tone={l.tone} kichThuoc={40} />
                <span className="flex-1 min-w-0">
                  <b className="block text-[14px] text-muc leading-snug">{l.nganh}</b>
                  <span className="block text-[13px] text-chu-phu truncate">{l.truong} · {l.khuVuc}</span>
                </span>
                {quen && <Heart size={16} className="text-do shrink-0" fill="currentColor" aria-label="Bạn đã lưu" />}
              </button>
            </li>
          );
        })}
        {ds.length === 0 && <li className="text-center text-[14px] text-chu-phu py-6">Không có trường nào khớp “{tuKhoa}”.</li>}
      </ul>
    </HopTruot>
  );
}

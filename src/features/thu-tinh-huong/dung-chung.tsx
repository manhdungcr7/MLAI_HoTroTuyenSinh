// Thành phần và hook dùng chung giữa các màn Thử tình huống / Điểm thi thử. Chỉ dùng trong slice này.
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, ClipboardList, Info, Minus, Plus } from "lucide-react";
import { mucUuTien } from "@/engine/diem-uu-tien";
import { Nut, gop } from "@/components/ui/nut-the";
import { TrangThaiTrong } from "@/components/ui/hien-thi";
import { LUA_CHON_MAU } from "@/data/lua-chon-mau";
import { DUONG_DAN } from "@/duong-dan";
import { useLuuCucBo } from "@/state/luu-cuc-bo";
import { diemHienTaiCuaTungMon, useApp } from "@/state/store";
import { TEN_MON, type MaToHop, type MonId } from "@/state/types";
import { DANG_THU_MAC_DINH, chonToHopHienThi, dieuKienTuHoSo, monThieu, taoTinhHuongLuu, tinhTinhHuong, trungTinhHuong, type TinhHuongDangThu } from "./tinh-toan";

/** Mọi thứ hai màn Thử tình huống cần: điểm hiện tại, tổ hợp đang dùng, điều kiện gốc và tình huống đang chỉnh. */
export function useTinhHuong() {
  const app = useApp();
  const { s } = app;
  const diem = useMemo(() => diemHienTaiCuaTungMon(s), [s]);
  // Tổ hợp hiện tổng điểm: theo mục tiêu, không có thì tổ hợp cao nhất em đủ điểm. Từng ngành vẫn được so theo tổ hợp của chính nó.
  const { ma: maToHop, toHop } = chonToHopHienThi(diem, s.mucTieu);
  const muc = mucUuTien(s.hoSo.uuTienTuyenSinh);
  const them = useMemo(() => ({ ...s.hoSo.diemThem, ...(muc > 0 ? { uuTien: muc } : {}) }), [s.hoSo.diemThem, muc]);
  const dkGoc = useMemo(() => dieuKienTuHoSo(s.hoSo), [s.hoSo]);
  const [dangThu, datDangThu] = useLuuCucBo<TinhHuongDangThu>("thu-tinh-huong-dang-thu", DANG_THU_MAC_DINH);
  const thieu = monThieu(diem, toHop);
  const kq = useMemo(() => tinhTinhHuong(LUA_CHON_MAU, diem, toHop, dkGoc, dangThu, them), [diem, toHop, dkGoc, dangThu, them]);
  return { app, diem, maToHop, toHop, dkGoc, dangThu, datDangThu, thieu, kq, them };
}

/** Lưu tình huống đang thử (không lưu trùng, không lưu khi chưa đổi gì) và trả về câu báo kết quả. */
export function useLuuTinhHuong(t: ReturnType<typeof useTinhHuong>) {
  const [bao, setBao] = useState<{ tone: "luc" | "cam"; chu: string } | null>(null);
  useEffect(() => {
    if (!bao) return;
    const h = setTimeout(() => setBao(null), 3500);
    return () => clearTimeout(h);
  }, [bao]);
  const luu = useCallback(() => {
    if (!t.kq.coThayDoi) return setBao({ tone: "cam", chu: "Em chưa thay đổi gì so với hiện tại." });
    const moi = taoTinhHuongLuu(t.dangThu, t.dkGoc, t.kq.tongSau);
    const cu = t.app.s.tinhHuong.find((x) => trungTinhHuong(x, moi));
    if (cu) return setBao({ tone: "cam", chu: `Tình huống “${cu.ten}” đã được lưu trước đó.` });
    t.app.luuTinhHuong(moi);
    setBao({ tone: "luc", chu: `Đã lưu “${moi.ten}”. Xem so sánh ở trang kết quả.` });
  }, [t]);
  return { luu, bao };
}

export function BaoNho({ bao }: { bao: { tone: "luc" | "cam"; chu: string } | null }) {
  return (
    <div role="status" aria-live="polite" className="empty:hidden">
      {bao && (
        <p className={gop("rounded-xl px-3 py-2 text-[13px] font-semibold flex items-center gap-2 hien-len", bao.tone === "luc" ? "bg-luc-nhat text-luc-chu" : "bg-cam-nhat text-cam-chu")}>
          {bao.tone === "luc" ? <CheckCircle2 size={16} className="shrink-0" /> : <Info size={16} className="shrink-0" />}{bao.chu}
        </p>
      )}
    </div>
  );
}

/** Khi chưa đủ điểm 3 môn của tổ hợp: nói rõ thiếu môn nào và dẫn đi nhập. */
export function ThieuDiem({ maToHop, thieu }: { maToHop: MaToHop; thieu: MonId[] }) {
  const nav = useNavigate();
  return (
    <TrangThaiTrong bieuTuong={<ClipboardList size={26} />} tieuDe={`Em chưa có đủ điểm tổ hợp ${maToHop}`}
      moTa={`Còn thiếu điểm ${thieu.map((m) => TEN_MON[m]).join(", ")}. Có đủ 3 môn, em mới thử tăng điểm được.`}>
      <div className="space-y-2">
        <Nut muiTen onClick={() => nav(DUONG_DAN.batDau(2))}>Nhập điểm các môn</Nut>
        <Nut kieu="vien" onClick={() => nav(DUONG_DAN.diemThiThu())}>Nhập điểm thi thử</Nut>
      </div>
    </TrangThaiTrong>
  );
}

/** Ghi chú cố định về điểm phù hợp và dữ liệu mẫu. */
export function GhiChuDuLieu({ children }: { children?: ReactNode }) {
  return (
    <p className="text-[12px] leading-relaxed text-chu-phu flex gap-1.5">
      <Info size={14} className="shrink-0 mt-0.5" />
      <span>{children ?? "Điểm phù hợp là điểm gợi ý trên thang 100, KHÔNG phải xác suất đậu."} Điểm chuẩn là số các năm trước, em đối chiếu với đề án của trường.</span>
    </p>
  );
}

const vi = (gia: number, min: number, max: number) => (gia - min) / (max - min);
/** Vị trí theo tâm nút kéo (nút rộng 28px nên lùi 14px ở hai đầu). */
const viTri = (a: number) => `calc(14px + (100% - 28px) * ${a})`;

/**
 * Thanh trượt to, dễ kéo bằng ngón tay, có nút −/+ hai bên để bấm thay cho kéo.
 * tuGiua: tô màu từ mốc 0 ở giữa (dùng cho cộng/trừ điểm).
 */
export function ThanhTruot({ gia, min, max, buoc, onChange, nhan, vach, tuGiua, vietGia, tat }: {
  gia: number; min: number; max: number; buoc: number; onChange: (v: number) => void; nhan: string;
  vach?: { gia: number; chu: string }[]; tuGiua?: boolean; vietGia: (v: number) => string; tat?: boolean;
}) {
  const dat = (v: number) => onChange(Math.round(Math.min(max, Math.max(min, v)) / buoc) * buoc);
  const goc = tuGiua ? vi(0, min, max) : 0, hien = vi(gia, min, max);
  const tu = Math.min(goc, hien), den = Math.max(goc, hien);
  const nutPhu = "size-12 shrink-0 rounded-xl grid place-items-center bg-xanh-nhat text-xanh active:brightness-95 disabled:opacity-40";
  return (
    <div className={gop(tat && "opacity-50 pointer-events-none")}>
      <div className="flex items-center gap-2">
        <button type="button" className={nutPhu} aria-label={`Giảm ${nhan}`} disabled={tat || gia <= min} onClick={() => dat(gia - buoc)}><Minus size={20} strokeWidth={2.6} /></button>
        <div className="relative flex-1 h-12">
          <span aria-hidden className="absolute top-1/2 -translate-y-1/2 h-2 rounded-full bg-vien" style={{ left: 14, right: 14 }} />
          <span aria-hidden className="absolute top-1/2 -translate-y-1/2 h-2 rounded-full bg-xanh" style={{ left: viTri(tu), width: `calc((100% - 28px) * ${den - tu})` }} />
          {tuGiua && <span aria-hidden className="absolute top-1/2 -translate-y-1/2 h-4 w-0.5 rounded bg-chu-phu/50" style={{ left: viTri(goc) }} />}
          <input type="range" min={min} max={max} step={buoc} value={gia} disabled={tat} aria-label={nhan} aria-valuetext={vietGia(gia)}
            onChange={(e) => dat(Number(e.target.value))}
            className={gop(
              "absolute inset-0 w-full h-12 m-0 appearance-none bg-transparent cursor-pointer touch-pan-y",
              "[&::-webkit-slider-runnable-track]:h-12 [&::-webkit-slider-runnable-track]:bg-transparent",
              "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:mt-[10px] [&::-webkit-slider-thumb]:size-7 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-trang [&::-webkit-slider-thumb]:border-[6px] [&::-webkit-slider-thumb]:border-xanh [&::-webkit-slider-thumb]:shadow-nut",
              "[&::-moz-range-track]:bg-transparent [&::-moz-range-thumb]:size-7 [&::-moz-range-thumb]:box-border [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-trang [&::-moz-range-thumb]:border-[6px] [&::-moz-range-thumb]:border-xanh",
            )} />
        </div>
        <button type="button" className={nutPhu} aria-label={`Tăng ${nhan}`} disabled={tat || gia >= max} onClick={() => dat(gia + buoc)}><Plus size={20} strokeWidth={2.6} /></button>
      </div>
      {vach && (
        <div aria-hidden className="relative h-4 mx-14 text-[12px] text-chu-phu">
          {vach.map((v) => (
            <span key={v.gia} className="absolute -translate-x-1/2 leading-none" style={{ left: viTri(vi(v.gia, min, max)) }}>{v.chu}</span>
          ))}
        </div>
      )}
    </div>
  );
}

/** Số trước → sau, tô màu theo hướng thay đổi. */
export function TruocSau({ truoc, sau, viet = String, cao = false }: { truoc: number; sau: number; viet?: (n: number) => string; cao?: boolean }) {
  const mau = sau > truoc ? "text-luc-chu" : sau < truoc ? "text-do-chu" : "text-chu";
  return (
    <span className={gop("inline-flex items-center gap-1 font-bold whitespace-nowrap", cao ? "text-[15px]" : "text-[13px]")}>
      <span className="text-chu-phu">{viet(truoc)}</span>
      <span aria-hidden className="text-chu-phu">→</span>
      <span className="sr-only">thành</span>
      <span className={mau}>{viet(sau)}</span>
    </span>
  );
}

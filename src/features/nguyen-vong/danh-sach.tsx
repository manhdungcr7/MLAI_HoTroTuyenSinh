// Màn Nguyện vọng (nền thiết kế 2027): tổng quan cơ cấu đo được, 4 nhóm, danh sách kéo thả có hoàn tác.
// Không có phần trăm trúng tuyển: chỉ nhãn định tính, chênh điểm so với điểm chuẩn năm gần nhất và khoảng dự báo.
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpDown, Check, ChevronDown, ChevronRight, ChevronUp, Heart, Lightbulb, Plus, Search, Sparkles, Trash2, Wand2 } from "lucide-react";
import { Nut, gop } from "@/components/ui/nut-the";
import { DongThongBao } from "@/components/ui/thong-bao";
import { HuyHieuTruong } from "@/components/ui/hinh-nen";
import { HopTruot } from "@/components/ui/hien-thi";
import {
  ChipLoc, HangChipLoc, HangKeoTha, MAU_NHAN_NV, PillTrangThai, THU_TU_NHAN_NV, TheNen, TieuDeMan, VongDiem,
} from "@/components/ui/thiet-ke";
import { tim } from "@/data/lua-chon-mau";
import { DUONG_DAN } from "@/duong-dan";
import { dinhDang, dinhDangDiem } from "@/engine/dinh-dang";
import { namTuyenSinhToi } from "@/engine/du-bao-diem-chuan";
import { tomTatDiemChoNganh, type TomTatDiemNganh } from "@/engine/tom-tat-nganh";
import { toAcademicDisplay } from "@/engine/trinh-bay-hoc-thuat";
import { diemDayDu } from "@/features/kham-pha/to-hop";
import { thongKeChung } from "@/features/kham-pha/du-bao";
import { HopChonLuaChon, kyHieu, khoangDiem } from "@/features/kham-pha/thanh-phan";
import { useApp } from "@/state/store";
import type { NhanNguyenVong } from "@/state/types";
import { GoiYSheet, NutGoiYDanhSach } from "./goi-y-sheet";
import { CanhBaoThuTuThe, ThanhHoanTac, useHoanTac } from "./thanh-phan";
import { SO_NV_GOI_Y, canhBaoThuTu, deXuatThuTu, demNhan, dungDanhSach, giongNhau, ketLuan, toHopTotNhat, xetCoCau, type DongNV } from "./tinh-toan";

const CAC_LOAI_NHAN: { nhan: NhanNguyenVong; moTa: string }[] = [
  { nhan: "Thử sức", moTa: "Điểm chuẩn năm trước cao hơn điểm của bạn" },
  { nhan: "Vừa sức", moTa: "Điểm của bạn thấp hơn điểm chuẩn tối đa 1,5 điểm" },
  { nhan: "An toàn", moTa: "Điểm của bạn cao hơn điểm chuẩn từ 1,5 đến dưới 4 điểm" },
  { nhan: "Dự phòng", moTa: "Điểm của bạn cao hơn điểm chuẩn từ 4 điểm" },
];

const TONG_KET_LUAN = { xanh: "xanh", luc: "luc", cam: "cam", tim: "tim", do: "do", muc: "trung" } as const;

/** Chưa có nguyện vọng: nói vì sao nên lập danh sách, một nút chính. */
function TrangNguyenVongTrong({ coDiem, onThem, onGoiY, onNhapDiem }: { coDiem: boolean; onThem: () => void; onGoiY: () => void; onNhapDiem: () => void }) {
  return (
    <>
      <TheNen tong="xanh" className="text-center py-6">
        <span className="mx-auto size-14 rounded-full gd-huy-hieu-xanh text-white grid place-items-center"><Heart size={26} aria-hidden /></span>
        <b className="mt-3 block text-[18px] text-muc">Chưa có nguyện vọng nào</b>
        <p className="mt-1.5 text-[14px] text-chu leading-relaxed">
          Danh sách giúp bạn thấy mình có đủ chỗ thử sức, vừa sức và an toàn chưa. Thêm vài ngành, mình xếp nhãn theo điểm của bạn.
        </p>
        <div className="mt-4 space-y-2">
          <Nut bieuTuong={Plus} onClick={onThem}>Thêm nguyện vọng</Nut>
          {coDiem
            ? <Nut kieu="vien" bieuTuong={Sparkles} onClick={onGoiY}>Gợi ý danh sách</Nut>
            : <Nut kieu="vien" onClick={onNhapDiem}>Nhập điểm để có gợi ý</Nut>}
        </div>
      </TheNen>
      <div className="the-mem p-4">
        <b className="block text-[15px] text-muc">Danh sách cân bằng có 4 loại</b>
        <ul className="mt-3 space-y-2.5">
          {CAC_LOAI_NHAN.map((x) => {
            const m = MAU_NHAN_NV[x.nhan];
            return (
              <li key={x.nhan} className="flex items-start gap-3">
                <span className="w-[92px] shrink-0"><PillTrangThai tong={m.tong} icon={m.icon}>{x.nhan}</PillTrangThai></span>
                <span className="text-[14px] text-chu leading-snug">{x.moTa}</span>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-[13px] text-chu-phu">Nên giữ 5–6 nguyện vọng, xếp từ mong muốn nhất xuống an toàn nhất.</p>
      </div>
    </>
  );
}

const tenNgan = (d: DongNV) => (d.lc ? `${d.lc.nganh} · ${d.lc.truong}` : "lựa chọn này");

/** Bốn ô nhóm: số nguyện vọng của nhóm trên tổng, thanh nhỏ vẽ khi vào màn. */
function BonONhom({ dem, tong, loc, onChon }: { dem: Record<NhanNguyenVong, number>; tong: number; loc: NhanNguyenVong | "tat-ca"; onChon: (n: NhanNguyenVong) => void }) {
  const [ve, setVe] = useState(false);
  useEffect(() => { const r = requestAnimationFrame(() => setVe(true)); return () => cancelAnimationFrame(r); }, []);
  return (
    <div className="grid grid-cols-4 gap-1 min-[360px]:gap-1.5" role="group" aria-label="Số nguyện vọng theo nhóm">
      {THU_TU_NHAN_NV.map((n) => {
        const m = MAU_NHAN_NV[n], c = dem[n];
        return (
          <button key={n} type="button" onClick={() => onChon(n)} aria-pressed={loc === n} aria-label={`${n}: ${c} trên ${tong} nguyện vọng`}
            className={gop("rounded-xl border px-1.5 py-1 min-[360px]:p-2 text-left min-h-[48px] min-[360px]:min-h-[52px] cursor-pointer transition-all", m.nenNhe, m.vien, loc === n && "ring-2 ring-xanh")}>
            <span className={gop("block text-[10.5px] min-[360px]:text-[11.5px] font-bold leading-tight whitespace-nowrap", m.chu)}>
              {n}
            </span>
            <div className="mt-0.5 flex items-baseline justify-between gap-1">
              <span className="so-lon text-[14px] min-[360px]:text-[15px] font-bold text-muc">{c}<span className="text-[11px] min-[360px]:text-[12px] font-normal text-chu-phu">/{tong}</span></span>
            </div>
            <span className="mt-1 block h-1 rounded-full bg-vien/70 overflow-hidden">
              <span className={gop("block h-full rounded-full transition-[width] duration-700 ease-out", m.dam)} style={{ width: ve && tong > 0 ? `${(c / tong) * 100}%` : "0%" }} />
            </span>
          </button>
        );
      })}
    </div>
  );
}


function TheNguyenVong({ d, ts, boDieuKhien, vuaDoi, chuaDuDiem, onMo, onXoa, chiDoc }: {
  d: DongNV; ts: TomTatDiemNganh | null; boDieuKhien?: import("@/components/ui/thiet-ke/keo-tha").BoDieuKhienKeoTha; vuaDoi: boolean; chuaDuDiem: boolean; onMo: () => void; onXoa: () => void; chiDoc?: boolean;
}) {
  const lc = d.lc;
  const m = d.nhan ? MAU_NHAN_NV[d.nhan] : null;
  const model = toAcademicDisplay(lc, d.nhan);
  const nv = `Nguyện Vọng ${d.viTri + 1}`;
  return (
    <article
      aria-label={`${nv}: ${model?.majorNameDisplay ?? lc?.nganh ?? "Lựa chọn"}`}
      className={gop(
        "relative overflow-hidden rounded-2xl border bg-trang p-3 pl-3.5 transition-all shadow-xs hover:border-xanh/40",
        m ? m.vien : "border-vien",
        vuaDoi && "vao-len"
      )}
    >
      {/* Vạch màu định danh nhóm bên mép trái */}
      {m && <span aria-hidden className={gop("absolute inset-y-0 left-0 w-1", m.dam)} />}

      {/* Hàng 1: Badge NV + Nhãn phù hợp + Nút điều khiển nhanh bên phải */}
      <div className="flex items-center justify-between gap-1.5 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
          <span className={gop(
            "px-1.5 py-0.5 rounded text-[11px] font-extrabold tracking-wide uppercase shrink-0 border",
            m ? `${m.nenNhe} ${m.chu} ${m.vien}` : "bg-nen text-muc border-vien"
          )}>
            NV {String(d.viTri + 1).padStart(2, "0")}
          </span>
          {m ? (
            <PillTrangThai tong={m.tong} icon={m.icon}>{d.nhan}</PillTrangThai>
          ) : (
            <PillTrangThai tong="trung">{chuaDuDiem ? "Chưa đủ điểm" : "Chưa so được"}</PillTrangThai>
          )}
          {d.toHop && (
            <span className="text-[11.5px] font-semibold text-chu-phu hidden min-[360px]:inline">
              {d.toHop}{d.suyRa ? " (suy ra)" : ""}
            </span>
          )}
        </div>

        {/* Nút điều khiển sắp xếp + xóa gom lên góc trên bên phải, không chiếm hàng dưới */}
        <div className="flex items-center -mr-1 shrink-0" role="group" aria-label={`Thao tác ${nv}`}>
          {!chiDoc && boDieuKhien && (
            <>
              {boDieuKhien.nutLen("size-8 grid place-items-center rounded-lg text-chu-phu hover:text-muc hover:bg-nen active:bg-xanh-nhat disabled:opacity-20 cursor-pointer transition-colors")}
              {boDieuKhien.nutXuong("size-8 grid place-items-center rounded-lg text-chu-phu hover:text-muc hover:bg-nen active:bg-xanh-nhat disabled:opacity-20 cursor-pointer transition-colors")}
              {boDieuKhien.tayNam("size-8 grid place-items-center rounded-lg text-chu-phu hover:text-xanh hover:bg-nen active:bg-xanh-nhat cursor-grab touch-none transition-colors")}
            </>
          )}
          <button
            type="button"
            onClick={onXoa}
            aria-label={`Xóa ${nv}`}
            className="size-8 grid place-items-center rounded-lg text-chu-phu hover:text-do-chu hover:bg-do-nhat active:bg-do-nhat cursor-pointer transition-colors ml-0.5"
          >
            <Trash2 size={15} aria-hidden />
          </button>
        </div>
      </div>

      {/* Hàng 2: Tên ngành, Trường (click mở chi tiết) */}
      {lc && model ? (
        <button
          type="button"
          onClick={onMo}
          aria-label={`Mở chi tiết ${model.majorNameDisplay} tại ${model.universityNameDisplay}`}
          className="w-full text-left flex items-start gap-2.5 rounded-lg py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xanh cursor-pointer group"
        >
          <HuyHieuTruong ten={kyHieu(model.universityCode || lc.truong)} tone={lc.tone} kichThuoc={34} />
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5 flex-wrap">
              <b className="text-[15px] font-bold text-muc leading-snug group-hover:text-xanh transition-colors truncate">
                {model.majorNameDisplay}
              </b>
              {model.programVariant && (
                <span className="text-[10.5px] font-semibold text-xanh bg-xanh-nhat px-1.5 py-0.2 rounded shrink-0">
                  {model.programVariant}
                </span>
              )}
            </span>
            <span className="block text-[12.5px] text-chu-phu leading-snug truncate mt-0.5">
              <b className="text-chu font-semibold">{lc.maTruong || lc.truong}</b> · {model.universityNameDisplay}
            </span>
          </span>
          <ChevronRight size={16} className="mt-1 shrink-0 text-chu-phu group-hover:text-xanh transition-colors" aria-hidden />
        </button>
      ) : (
        <p className="mt-1 text-[13.5px] text-chu">
          <b>Chưa có dữ liệu</b>
          <span className="block text-[12px] text-chu-phu">Lựa chọn này không còn trong danh mục. Bạn có thể xóa đi.</span>
        </p>
      )}

      {/* Hàng 3: Dải thông số đối chiếu điểm gọn gàng (Compact Metrics Bar) */}
      {lc && (
        <div className="mt-2 px-2.5 py-1.5 rounded-xl bg-nen/60 border border-vien/60 flex flex-wrap items-center justify-between gap-x-2.5 gap-y-1 text-[12px] leading-snug">
          <div className="flex items-center gap-1.5 flex-wrap">
            {ts?.diemChuan ? (
              <span className="text-chu">
                Chuẩn {ts.diemChuan.nam}: <b className="text-muc font-bold">{dinhDangDiem(ts.diemChuan.diem)}</b>
              </span>
            ) : (
              <span className="text-chu-phu">{d.lyDoKhongNhan ?? ts?.lyDoKhongSo ?? `Tham khảo ${khoangDiem(lc)}`}</span>
            )}
            {d.chenh !== null && (
              <span className={gop("font-bold px-1.5 py-0.2 rounded text-[11px]", d.chenh < 0 ? "bg-cam-nhat text-cam-chu" : "bg-luc-nhat text-luc-chu")}>
                {d.chenh < 0 ? `Thiếu ${dinhDang(Math.abs(d.chenh), 1)}` : `Hơn ${dinhDang(d.chenh, 1)}`}
              </span>
            )}
          </div>
          {ts?.duBao && (
            <span className="text-chu-phu text-[11.5px] ml-auto">
              Dự kiến {ts.duBao.namDuBao}: <b className="text-muc font-semibold">{dinhDang(ts.duBao.thap, 1)}–{dinhDang(ts.duBao.cao, 1)}</b>
            </span>
          )}
        </div>
      )}
    </article>
  );
}

export default function DanhSachNguyenVong() {
  const nav = useNavigate();
  const { s, datNguyenVong, themNguyenVong, xoaNguyenVong, doiViTri } = useApp();
  const diemMon = diemDayDu(s);
  const tong = toHopTotNhat(diemMon).tong;
  const ds = dungDanhSach(s.nguyenVong, diemMon, tim);
  const dem = demNhan(ds);
  const dsYeuThich = useMemo(() => s.yeuThich.map(tim).filter((l): l is NonNullable<typeof l> => !!l), [s.yeuThich]);
  const coCau = xetCoCau(dem, ds.length);
  const kl = ketLuan(coCau);
  const canhBao = useMemo(() => canhBaoThuTu(ds), [ds]);
  const tomTat = useMemo(() => {
    const tk = thongKeChung(), nam = namTuyenSinhToi();
    return new Map(ds.filter((d) => d.lc).map((d) => [d.id, tomTatDiemChoNganh(d.lc!, diemMon, tk, nam)] as const));
  }, [ds, diemMon]);
  const { tin, bao, an } = useHoanTac();
  const [moTim, setMoTim] = useState(false);
  const [moGoiY, setMoGoiY] = useState(false);
  const [hoiXoa, setHoiXoa] = useState<string | null>(null);
  const [hoiXep, setHoiXep] = useState(false);
  const [loc, setLoc] = useState<NhanNguyenVong | "tat-ca">("tat-ca");
  const [vuaDoi, setVuaDoi] = useState<{ id: string; k: number } | null>(null);

  const soNhomCo = THU_TU_NHAN_NV.filter((n) => dem[n] > 0).length;
  const dichXep = useMemo(() => deXuatThuTu(ds), [ds]);
  const daHopLy = giongNhau(dichXep, s.nguyenVong);

  const chuyen = useCallback((tu: number, den: number) => {
    if (den < 0 || den >= s.nguyenVong.length || tu === den) return;
    const d = ds[tu];
    doiViTri(tu, den);
    setVuaDoi({ id: d.id, k: Date.now() });
    bao(`Đã chuyển ${d?.lc?.truong ?? "nguyện vọng"} sang Nguyện Vọng ${den + 1}`, () => doiViTri(den, tu));
  }, [ds, doiViTri, bao, s.nguyenVong.length]);

  const xoa = (id: string) => {
    const viTri = s.nguyenVong.indexOf(id);
    const d = ds[viTri];
    const cu = [...s.nguyenVong];
    xoaNguyenVong(id);
    bao(`Đã xóa Nguyện Vọng ${viTri + 1} · ${d?.lc?.truong ?? "nguyện vọng"}`, () => datNguyenVong(cu));
  };

  const apDungXep = () => {
    const cu = [...s.nguyenVong];
    datNguyenVong(dichXep);
    setHoiXep(false);
    bao("Đã sắp xếp theo đề xuất", () => datNguyenVong(cu));
  };

  const themTatCaYeuThich = useCallback(() => {
    const chuaThem = dsYeuThich.filter((l) => !s.nguyenVong.includes(l.id));
    if (chuaThem.length === 0) return;
    datNguyenVong([...s.nguyenVong, ...chuaThem.map((l) => l.id)]);
    bao(`Đã thêm ${chuaThem.length} ngành yêu thích vào danh sách`);
  }, [dsYeuThich, s.nguyenVong, datNguyenVong, bao]);

  const themNganh = useCallback((id: string, nganh: string, truong: string) => {
    const cu = [...s.nguyenVong];
    themNguyenVong(id);
    bao(`Đã thêm ${nganh} – ${truong} vào nguyện vọng`, () => datNguyenVong(cu));
  }, [themNguyenVong, datNguyenVong, bao, s.nguyenVong]);

  const dsHien = loc === "tat-ca" ? ds : ds.filter((d) => d.nhan === loc);
  const veThe = (d: DongNV, _dieuKhien: React.ReactNode, boDieuKhien?: import("@/components/ui/thiet-ke/keo-tha").BoDieuKhienKeoTha, chiDoc?: boolean) => (
    <div key={vuaDoi?.id === d.id ? vuaDoi.k : d.id} className="hien-dan da-hien" style={{ "--i": 0 } as React.CSSProperties}>
      <TheNguyenVong d={d} ts={tomTat.get(d.id) ?? null} boDieuKhien={boDieuKhien} vuaDoi={vuaDoi?.id === d.id} chuaDuDiem={tong === null} chiDoc={chiDoc}
        onMo={() => d.lc && nav(DUONG_DAN.chiTiet(d.id))} onXoa={() => setHoiXoa(d.id)} />
    </div>
  );

  return (
    <>
      <TieuDeMan tieuDe="Danh sách nguyện vọng" phuDe="Xem cơ cấu, sắp xếp và cân bằng danh sách của bạn." />
      <div className="px-4 pb-6 space-y-3">
        {ds.length === 0 ? (
          dsYeuThich.length > 0 ? (
            <TheDanhSachYeuThich dsYeuThich={dsYeuThich} nguyenVong={s.nguyenVong} onThemTatCa={themTatCaYeuThich} onThemMot={themNganh}
              onDieuHuong={(id) => nav(DUONG_DAN.chiTiet(id))} onKhamPhaThem={() => nav(DUONG_DAN.khamPha())} onMoGoiY={() => setMoGoiY(true)} />
          ) : (
            <TrangNguyenVongTrong coDiem={tong !== null} onThem={() => setMoTim(true)} onGoiY={() => setMoGoiY(true)} onNhapDiem={() => nav(DUONG_DAN.batDau(2))} />
          )
        ) : (
          <>
            <TheNen tong={coCau.chuaDuCanCu > 0 ? undefined : kl.onDinh ? "luc" : kl.tone === "do" ? "do" : "cam"} className="space-y-2.5 p-3.5" aria-label="Tổng quan danh sách">
              <div className="flex items-center gap-3">
                <VongDiem value={coCau.n === 0 ? null : soNhomCo} max={4} size={68} nhanGiua="nhóm" dinhDang={(n) => `${Math.round(n)}/4`}
                  tong={soNhomCo >= 4 ? "luc" : soNhomCo >= 3 ? "xanh" : "cam"} aria={`Danh sách có ${soNhomCo} trên 4 nhóm`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[13px] font-bold text-muc">Đã có {soNhomCo}/4 nhóm</span>
                    <PillTrangThai tong={TONG_KET_LUAN[kl.tone]}>{kl.onDinh ? "Cơ cấu đủ nhóm" : coCau.chuaDuCanCu > 0 ? "Chưa đủ căn cứ" : "Cần bổ sung"}</PillTrangThai>
                  </div>
                  <p className="mt-1 text-[13px] text-chu leading-snug line-clamp-2">{kl.hienTrang}</p>
                  <button type="button" onClick={() => nav(DUONG_DAN.nguyenVongAnToan())} className="mt-0.5 inline-flex items-center gap-1 text-[13px] font-semibold text-xanh hover:underline cursor-pointer">
                    Xem phân tích chi tiết<ChevronRight size={14} aria-hidden />
                  </button>
                </div>
              </div>
              <BonONhom dem={dem} tong={ds.length} loc={loc} onChon={(n) => setLoc((c) => (c === n ? "tat-ca" : n))} />
              {(kl.nenLam || kl.lyDo) && (
                <button type="button" onClick={() => setMoGoiY(true)} className="w-full flex items-center gap-2 rounded-xl bg-xanh-nhat px-3 py-2 text-left cursor-pointer active:brightness-95 transition-all">
                  <Lightbulb size={18} className="shrink-0 text-xanh" aria-hidden />
                  <span className="flex-1 text-[12.5px] text-chu leading-snug truncate">
                    <b className="text-xanh-dam">{kl.nenLam ? "Gợi ý" : "Nhận xét"}: </b>
                    {kl.nenLam ? `${kl.nenLam}${kl.lyDo ? `, ${kl.lyDo}` : ""}` : kl.lyDo}
                  </span>
                  <ChevronRight size={16} className="shrink-0 text-chu-phu" aria-hidden />
                </button>
              )}
            </TheNen>

            {tong === null && (
              <DongThongBao tone="cam" icon={Sparkles} tieuDe="Chưa đủ điểm để xếp nhãn"
                moTa="Nhập điểm các môn theo tổ hợp xét tuyển để biết mỗi nguyện vọng là Thử sức, Vừa sức, An toàn hay Dự phòng."
                hanhDong="Nhập điểm ngay" onClick={() => nav(s.diemThi.length ? DUONG_DAN.diemThiThu() : DUONG_DAN.batDau(2))} />
            )}

            <div className="flex items-center gap-2">
              <h2 className="text-[16px] font-bold text-muc flex-1 min-w-0 truncate">{ds.length} nguyện vọng</h2>
              <button type="button" onClick={() => (daHopLy ? bao("Thứ tự hiện tại đã hợp lý, không cần đổi") : setHoiXep(true))}
                className="min-h-10 px-3 rounded-xl bg-xanh-nhat text-xanh font-bold text-[13.5px] inline-flex items-center gap-1.5 shrink-0 cursor-pointer hover:bg-xanh/15 active:scale-98 transition-all">
                <Wand2 size={16} aria-hidden />Sắp xếp đề xuất
              </button>
            </div>

            <div className="flex gap-2">
              <button type="button" onClick={() => setMoTim(true)} aria-label="Tìm ngành, trường để thêm vào danh sách"
                className="flex-1 min-w-0 min-h-10 flex items-center gap-2 rounded-xl o-mem px-3 text-left text-[13.5px] text-chu-phu cursor-pointer">
                <Search size={17} className="shrink-0" aria-hidden /><span className="truncate">Tìm ngành, trường để thêm</span>
              </button>
              <button type="button" onClick={() => setMoTim(true)} className="min-h-10 px-3.5 rounded-xl gd-chip-chon font-bold text-[13.5px] inline-flex items-center gap-1 shrink-0 cursor-pointer">
                <Plus size={16} aria-hidden />Thêm
              </button>
            </div>

            <HangChipLoc nhan="Lọc theo nhóm">
              <ChipLoc chon={loc === "tat-ca"} onClick={() => setLoc("tat-ca")} dem={ds.length}>Tất cả</ChipLoc>
              {THU_TU_NHAN_NV.map((n) => <ChipLoc key={n} chon={loc === n} onClick={() => setLoc(n)} icon={MAU_NHAN_NV[n].icon} dem={dem[n]}>{n}</ChipLoc>)}
            </HangChipLoc>

            {dsYeuThich.some((l) => !s.nguyenVong.includes(l.id)) && (
              <TheDanhSachYeuThich dsYeuThich={dsYeuThich} nguyenVong={s.nguyenVong} onThemTatCa={themTatCaYeuThich} onThemMot={themNganh}
                onDieuHuong={(id) => nav(DUONG_DAN.chiTiet(id))} choPhepThuGon={true} />
            )}

            {ds.length > SO_NV_GOI_Y && <p className="text-[13px] text-chu-phu">Bạn đang có {ds.length} nguyện vọng. Khoảng 5–{SO_NV_GOI_Y} nguyện vọng là dễ cân nhắc nhất.</p>}

            <CanhBaoThuTuThe ds={canhBao} onDua={(c) => chuyen(c.sau.viTri, c.truoc.viTri)} />

            {loc === "tat-ca" ? (
              <HangKeoTha muc={ds} khoa={(d) => d.id} onDoiCho={chuyen} ten={tenNgan} veMuc={(d, _i, dk, bdk) => veThe(d, dk, bdk)} />
            ) : (
              <>
                <p className="text-[13px] text-chu-phu">Đang lọc nhóm {loc}. Chọn Tất cả để kéo thả đổi thứ tự.</p>
                {dsHien.length === 0
                  ? <p className="rounded-2xl o-mem p-4 text-[14px] text-chu">Chưa có nguyện vọng nhóm {loc}. Bạn có thể thêm bằng nút Thêm ở trên.</p>
                  : <ol className="space-y-2">{dsHien.map((d) => <li key={d.id}>{veThe(d, null, undefined, true)}</li>)}</ol>}
              </>
            )}
          </>
        )}
      </div>

      <HopChonLuaChon mo={moTim} dong={() => setMoTim(false)} tieuDe="Thêm vào nguyện vọng" boQua={s.nguyenVong}
        onChon={(l) => { setMoTim(false); themNganh(l.id, l.nganh, l.truong); }} />
      <GoiYSheet mo={moGoiY} dong={() => setMoGoiY(false)} />
      <ThanhHoanTac tin={tin} an={an} />
      <HopTruot mo={hoiXoa !== null} dong={() => setHoiXoa(null)} tieuDe="Xóa nguyện vọng này?">
        <p className="text-[14px] text-chu mb-4">Bạn có thể thêm lại ngành trong Khám phá hoặc hoàn tác ngay sau khi xóa.</p>
        <div className="grid grid-cols-2 gap-2">
          <Nut kieu="vien" onClick={() => setHoiXoa(null)}>Giữ lại</Nut>
          <Nut kieu="nguyHiem" onClick={() => { if (hoiXoa) xoa(hoiXoa); setHoiXoa(null); }}>Xóa</Nut>
        </div>
      </HopTruot>
      <HopTruot mo={hoiXep} dong={() => setHoiXep(false)} tieuDe="Sắp xếp theo đề xuất?">
        <p className="text-[14px] text-chu mb-3">Nguyện vọng An toàn và Dự phòng xuống cuối, các nguyện vọng còn lại giữ nguyên thứ tự bạn đặt. Đây chỉ là gợi ý, bạn hoàn tác được.</p>
        <ol className="mb-4 space-y-1 text-[14px] text-chu">
          {dichXep.map((id, i) => { const d = ds.find((x) => x.id === id); return <li key={id} className="flex gap-2"><b className="w-5 text-muc">{i + 1}</b><span className="truncate">{d ? tenNgan(d) : id}{d?.nhan ? ` · ${d.nhan}` : ""}</span></li>; })}
        </ol>
        <div className="grid grid-cols-2 gap-2">
          <Nut kieu="vien" onClick={() => setHoiXep(false)}>Không đổi</Nut>
          <Nut bieuTuong={ArrowUpDown} onClick={apDungXep}>Áp dụng</Nut>
        </div>
      </HopTruot>
    </>
  );
}

/** Thẻ hiển thị các ngành học sinh đã thả tim/lưu yêu thích, cho phép xem chi tiết, thêm từng ngành hoặc thêm tất cả. */
function TheDanhSachYeuThich({
  dsYeuThich,
  nguyenVong,
  onThemTatCa,
  onThemMot,
  onDieuHuong,
  choPhepThuGon = false,
  onKhamPhaThem,
  onMoGoiY,
}: {
  dsYeuThich: NonNullable<ReturnType<typeof tim>>[];
  nguyenVong: string[];
  onThemTatCa: () => void;
  onThemMot: (id: string, nganh: string, truong: string) => void;
  onDieuHuong: (id: string) => void;
  choPhepThuGon?: boolean;
  onKhamPhaThem?: () => void;
  onMoGoiY?: () => void;
}) {
  const yeuThichChuaThem = useMemo(
    () => dsYeuThich.filter((l) => !nguyenVong.includes(l.id)),
    [dsYeuThich, nguyenVong]
  );
  const soDaThem = dsYeuThich.length - yeuThichChuaThem.length;
  const [thuGon, setThuGon] = useState(false);

  if (dsYeuThich.length === 0) return null;

  return (
    <div className="rounded-the bg-trang border border-vien p-4 shadow-the space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="size-9 rounded-xl bg-do/10 text-do grid place-items-center shrink-0">
            <Heart size={20} fill="currentColor" />
          </span>
          <div className="min-w-0">
            <h2 className="text-[15px] font-extrabold text-muc leading-tight">
              Ngành đã lưu ({dsYeuThich.length})
            </h2>
            <p className="text-[12px] text-chu-phu mt-0.5">
              {yeuThichChuaThem.length > 0
                ? (soDaThem > 0
                    ? `Đã thêm ${soDaThem}/${dsYeuThich.length} · Còn ${yeuThichChuaThem.length} ngành`
                    : "Chọn nhanh để đưa vào danh sách Nguyện Vọng")
                : `Đã đưa tất cả ${dsYeuThich.length} ngành vào Nguyện Vọng`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {yeuThichChuaThem.length > 0 && (
            <button
              type="button"
              onClick={onThemTatCa}
              className="min-h-8.5 px-2.5 rounded-lg bg-xanh text-white text-[12px] font-bold active:brightness-95 cursor-pointer shadow-sm shrink-0"
            >
              + Thêm tất cả {soDaThem > 0 ? `(${yeuThichChuaThem.length})` : ""}
            </button>
          )}
          {choPhepThuGon && (
            <button
              type="button"
              onClick={() => setThuGon((t) => !t)}
              aria-label={thuGon ? "Mở rộng danh sách đã lưu" : "Thu gọn danh sách đã lưu"}
              className="size-8.5 rounded-lg border border-vien bg-nen hover:bg-vien/40 grid place-items-center text-chu-phu shrink-0 transition-colors"
            >
              {thuGon ? <ChevronDown size={17} /> : <ChevronUp size={17} />}
            </button>
          )}
        </div>
      </div>

      {!thuGon && (
        <>
          <ul className="divide-y divide-vien border-t border-vien pt-1">
            {dsYeuThich.map((l) => {
              const daThem = nguyenVong.includes(l.id);
              const viTriNV = nguyenVong.indexOf(l.id);
              const model = toAcademicDisplay(l);
              return (
                <li key={l.id} className="py-2.5 flex items-center justify-between gap-2.5">
                  <button
                    type="button"
                    onClick={() => onDieuHuong(l.id)}
                    className="flex items-center gap-2.5 text-left min-w-0 flex-1 active:opacity-75 cursor-pointer"
                  >
                    <HuyHieuTruong ten={kyHieu(model?.universityCode || l.truong)} tone={l.tone} kichThuoc={38} />
                    <div className="min-w-0 flex-1">
                      <b className="block text-[14px] text-muc leading-tight truncate">{model?.majorNameDisplay ?? l.nganh}</b>
                      <span className="block text-[12px] text-chu-phu truncate mt-0.5">
                        {model?.universityNameDisplay ?? l.truong} · {l.khuVuc} · {khoangDiem(l)} điểm
                      </span>
                      {model?.programVariant && (
                        <span className="inline-block mt-0.5 text-[11px] font-semibold text-xanh bg-xanh-nhat px-1.5 py-0.2 rounded">
                          {model.programVariant}
                        </span>
                      )}
                    </div>
                  </button>
                  {daThem ? (
                    <span
                      title={`Đã ở vị trí Nguyện Vọng ${viTriNV + 1} trong danh sách`}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-luc-nhat text-luc-chu text-[12px] font-bold shrink-0 border border-luc/30"
                    >
                      <Check size={13} className="stroke-[2.5]" /> Nguyện Vọng {viTriNV + 1}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onThemMot(l.id, l.nganh, l.truong)}
                      className="min-h-9 px-2.5 rounded-lg bg-xanh-nhat text-xanh text-[12px] font-bold shrink-0 active:bg-xanh/20 cursor-pointer"
                    >
                      + Thêm vào Nguyện Vọng
                    </button>
                  )}
                </li>
              );
            })}
          </ul>

          {(onKhamPhaThem || onMoGoiY) && (
            <div className="pt-2 border-t border-vien flex gap-2">
              {onKhamPhaThem && (
                <Nut kieu="vien" bieuTuong={Plus} onClick={onKhamPhaThem}>
                  Khám phá thêm
                </Nut>
              )}
              {onMoGoiY && <NutGoiYDanhSach onMo={onMoGoiY} />}
            </div>
          )}
        </>
      )}
    </div>
  );
}


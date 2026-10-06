import { useMemo, useState, type ReactNode } from "react";
import { coHocPhi } from "@/data/lua-chon-phu";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight, BarChart3, Bookmark, BookmarkCheck, Briefcase, CheckCircle2, Lightbulb, MapPin, PencilLine, Plus, Scale, ShieldCheck, Target, Users, Wallet,
} from "lucide-react";
import { DauTrangCoQuayLai, NoiDung } from "@/components/layout/khung";
import { HuyHieuTruong } from "@/components/ui/hinh-nen";
import { HopTruot, TrangThaiTrong } from "@/components/ui/hien-thi";
import { DongThongBao } from "@/components/ui/thong-bao";
import { Nut, TONE_CHU, gop } from "@/components/ui/nut-the";
import { tim } from "@/data/lua-chon-mau";
import { DUONG_DAN } from "@/duong-dan";
import { mucTieuTuLuaChon } from "@/state/chon";
import { useApp } from "@/state/store";
import type { LuaChon } from "@/state/types";
import { TONE_CHAC_CHAN, boiCanhTu, coDiemDeSo, soSanhHai, type BenTotHon, type KetQuaPhuHop } from "./phu-hop";
import { GhiChuDuLieuMau, HopChonLuaChon, NhanPhuHop, khoangDiem, khoangHocPhi, kyHieu } from "./thanh-phan";

type Khe = 0 | 1;

/** Một cột đầu bảng: huy hiệu + tên, bấm để xem chi tiết; nút đổi trường bên dưới. */
function DauCot({ l, onDoi, onChon }: { l?: LuaChon; onDoi: () => void; onChon: () => void }) {
  const nav = useNavigate();
  if (!l) {
    return (
      <button type="button" onClick={onChon} className="w-full min-h-36 rounded-the border-2 border-dashed border-xanh/40 bg-xanh-nhat/50 text-xanh font-bold text-[14px] flex flex-col items-center justify-center gap-2 active:bg-xanh-nhat">
        <span className="size-11 rounded-full gd-xanh text-white grid place-items-center"><Plus size={22} /></span>Chọn trường
      </button>
    );
  }
  return (
    <div className="flex flex-col items-center text-center min-w-0">
      <button type="button" onClick={() => nav(DUONG_DAN.chiTiet(l.id))} aria-label={`Xem chi tiết ${l.nganh} – ${l.truong}`}
        className="w-full flex flex-col items-center rounded-the px-1 py-2 active:bg-xanh-nhat">
        <HuyHieuTruong ten={kyHieu(l.truong)} tone={l.tone} kichThuoc={52} />
        <b className="mt-1.5 text-[16px] text-muc leading-tight break-words">{l.truong}</b>
        <span className="text-[13px] text-chu leading-snug">{l.nganh}</span>
        <span className="text-[12px] text-chu-phu leading-snug">{l.bac} · {l.khuVuc}</span>
      </button>
      <button type="button" onClick={onDoi} className="min-h-11 px-3 rounded-xl text-[13px] font-bold text-xanh inline-flex items-center gap-1 active:bg-xanh-nhat">
        <ArrowLeftRight size={14} />Đổi trường
      </button>
    </div>
  );
}

function O({ tot, children }: { tot: boolean; children: ReactNode }) {
  return (
    <div className={gop("rounded-xl px-1.5 py-2 text-center text-[14px] leading-snug min-w-0 break-words flex flex-col items-center justify-center", tot ? "bg-luc-nhat ring-1 ring-luc/30" : "bg-nen")}>
      {children}
      {tot && <span className="sr-only">(tốt hơn cho em)</span>}
    </div>
  );
}

function Hang({ icon: Icon, nhan, phu, tot, a, b }: { icon: LucideIcon; nhan: string; phu?: string; tot: BenTotHon; a: ReactNode; b: ReactNode }) {
  return (
    <div role="row" className="grid grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)_minmax(0,1fr)] gap-1.5 items-stretch py-1.5">
      <div role="rowheader" className="flex items-start gap-1.5 pr-1 py-1">
        <Icon size={16} className="text-xanh shrink-0 mt-0.5" aria-hidden />
        <span className="min-w-0"><span className="block text-[13px] font-bold text-chu leading-snug">{nhan}</span>{phu && <span className="block text-[12px] text-chu-phu">{phu}</span>}</span>
      </div>
      <div role="cell" className="contents"><O tot={tot === "a"}>{a}</O></div>
      <div role="cell" className="contents"><O tot={tot === "b"}>{b}</O></div>
    </div>
  );
}

const ChacChan = ({ kq }: { kq: KetQuaPhuHop }) =>
  kq.chacChan ? <b className={TONE_CHU[TONE_CHAC_CHAN[kq.chacChan]]}>{kq.chacChan}</b> : <span className="text-[13px] text-chu-phu">Cần nhập điểm</span>;

export default function SoSanh() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const { s, datSoSanh, datMucTieu } = useApp();
  const bc = useMemo(() => boiCanhTu(s), [s]);

  // Cặp đang xem: lấy từ đường dẫn ?a=&b=, nếu không có thì lấy cặp em đã lưu.
  const qa = params.get("a") ?? undefined, qb = params.get("b") ?? undefined;
  const tuNguon: (string | undefined)[] = qa || qb ? [qa, qb] : [s.soSanh[0], s.soSanh[1]];
  const [tam, setTam] = useState<(string | undefined)[] | null>(null); // khi mới chọn được 1 trường
  const ids = tam ?? tuNguon;
  const a = ids[0] ? tim(ids[0]) : undefined;
  const b = ids[1] ? tim(ids[1]) : undefined;
  const coIdHong = ids.some((x) => x && !tim(x));

  const [khe, setKhe] = useState<Khe | null>(null);
  const [hopMucTieu, setHopMucTieu] = useState(false);
  const [vuaLuu, setVuaLuu] = useState(false);

  const chon = (i: Khe, l: LuaChon) => {
    const moi = [a?.id, b?.id];
    moi[i] = l.id;
    setKhe(null);
    setVuaLuu(false);
    if (moi[0] && moi[1]) { setTam(null); nav(DUONG_DAN.soSanh(moi[0], moi[1]), { replace: true }); }
    else setTam(moi);
  };

  const ss = a && b ? soSanhHai(a, b, bc) : null;
  const daLuu = !!(a && b && s.soSanh.length === 2 && s.soSanh.includes(a.id) && s.soSanh.includes(b.id));
  const luu = () => { if (a && b) { datSoSanh([a.id, b.id]); setVuaLuu(true); } };
  const chonMucTieu = (l: LuaChon) => { datMucTieu(mucTieuTuLuaChon(l, bc.diem)); setHopMucTieu(false); nav(DUONG_DAN.mucTieu()); };
  const mucTieuCu = s.mucTieu ? tim(s.mucTieu.luaChonId) : undefined;

  return (
    <>
      <DauTrangCoQuayLai tieuDe="So sánh 2 trường" />
      <NoiDung>
        <section className="rounded-lon bg-trang border border-vien shadow-the p-3" aria-label="Hai lựa chọn đang so sánh">
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-1">
            <DauCot l={a} onDoi={() => setKhe(0)} onChon={() => setKhe(0)} />
            <span className="mt-9 size-9 rounded-full bg-nen border border-vien grid place-items-center text-[12px] font-extrabold text-chu-phu" aria-hidden>VS</span>
            <DauCot l={b} onDoi={() => setKhe(1)} onChon={() => setKhe(1)} />
          </div>
        </section>

        {coIdHong && <DongThongBao tone="cam" tieuDe="Có một lựa chọn không còn trong danh sách" moTa="Em chọn lại trường để so sánh nhé." />}

        {!ss ? (
          <TrangThaiTrong bieuTuong={<Scale size={26} />} tieuDe={a || b ? "Chọn thêm một trường nữa" : "Chưa có trường để so sánh"}
            moTa={a || b ? "So sánh cần đủ hai trường. Bấm ô “Chọn trường” ở trên hoặc chọn ngay bên dưới." : "Chọn hai trường em đang phân vân để xem khác nhau ở điểm, học phí, khu vực và việc làm."}>
            <div className="space-y-2">
              <Nut bieuTuong={Plus} onClick={() => setKhe(a ? 1 : 0)}>Chọn trường</Nut>
              <Nut kieu="vien" onClick={() => nav(DUONG_DAN.khamPha())}>Xem gợi ý ở Khám phá</Nut>
            </div>
          </TrangThaiTrong>
        ) : (
          <>
            <section className="rounded-the bg-trang border border-vien shadow-the px-3 py-2" role="table" aria-label="Bảng so sánh">
              <Hang icon={BarChart3} nhan="Điểm đầu vào" phu={a!.namDiem === b!.namDiem ? `tham khảo ${a!.namDiem}` : "tham khảo"} tot={ss.tot.diem}
                a={<><b className="text-[15px] text-muc">{khoangDiem(a!)}</b><span className="text-[12px] text-chu-phu">điểm{a!.namDiem !== b!.namDiem && ` (${a!.namDiem})`}</span></>}
                b={<><b className="text-[15px] text-muc">{khoangDiem(b!)}</b><span className="text-[12px] text-chu-phu">điểm{a!.namDiem !== b!.namDiem && ` (${b!.namDiem})`}</span></>} />
              <Hang icon={Wallet} nhan="Học phí / năm" phu="dự kiến" tot={ss.tot.hocPhi}
                a={coHocPhi(a!) ? <><b className="text-[15px] text-muc">{khoangHocPhi(a!)}</b><span className="text-[12px] text-chu-phu">triệu đồng</span></> : <span className="text-[13px] text-chu-phu">Chưa có dữ liệu</span>}
                b={coHocPhi(b!) ? <><b className="text-[15px] text-muc">{khoangHocPhi(b!)}</b><span className="text-[12px] text-chu-phu">triệu đồng</span></> : <span className="text-[13px] text-chu-phu">Chưa có dữ liệu</span>} />
              <Hang icon={MapPin} nhan="Khu vực" tot={ss.tot.khuVuc}
                a={<><b className="text-muc">{a!.khuVuc}</b><span className="text-[12px] text-chu-phu">{a!.diaChi?.split(",")[0]}</span></>}
                b={<><b className="text-muc">{b!.khuVuc}</b><span className="text-[12px] text-chu-phu">{b!.diaChi?.split(",")[0]}</span></>} />
              <Hang icon={Briefcase} nhan="Cơ hội việc làm" tot={ss.tot.viecLam} a={a!.coHoiViecLam ? <b className="text-muc">{a!.coHoiViecLam}</b> : <span className="text-[13px] text-chu-phu">Chưa có dữ liệu</span>} b={b!.coHoiViecLam ? <b className="text-muc">{b!.coHoiViecLam}</b> : <span className="text-[13px] text-chu-phu">Chưa có dữ liệu</span>} />
              <Hang icon={Users} nhan="Môi trường học" tot={null} a={<span className="text-[13px] text-chu">{a!.moiTruongHoc ?? "Chưa có dữ liệu"}</span>} b={<span className="text-[13px] text-chu">{b!.moiTruongHoc ?? "Chưa có dữ liệu"}</span>} />
              <Hang icon={CheckCircle2} nhan="Mức phù hợp với em" tot={ss.tot.phuHop} a={<NhanPhuHop kq={ss.kqA} xuongDong />} b={<NhanPhuHop kq={ss.kqB} xuongDong />} />
              <Hang icon={ShieldCheck} nhan="Mức chắc chắn" tot={ss.tot.chacChan} a={<ChacChan kq={ss.kqA} />} b={<ChacChan kq={ss.kqB} />} />
              <p className="flex items-start gap-1.5 text-[12px] text-chu-phu pt-1.5 pb-1 border-t border-vien mt-1">
                <span className="mt-0.5 size-3 rounded bg-luc-nhat ring-1 ring-luc/30 shrink-0" aria-hidden />
                Ô nền xanh lá là bên có lợi hơn cho em ở tiêu chí đó (điểm và học phí thấp hơn thì dễ hơn).
              </p>
            </section>

            {!coDiemDeSo(bc) && (
              <DongThongBao tone="xanh" icon={PencilLine} tieuDe="Nhập điểm để so mức phù hợp" moTa="Em chưa nhập đủ điểm 3 môn của một tổ hợp nên chưa so được mức phù hợp và mức chắc chắn."
                hanhDong="Nhập điểm ngay" onClick={() => nav(DUONG_DAN.batDau(2))} />
            )}

            <section className="rounded-the nen-tim p-4" aria-label="Kết luận nhanh">
              <h2 className="flex items-center gap-2 text-[16px] font-extrabold text-tim-chu"><Lightbulb size={20} />Kết luận nhanh</h2>
              <ol className="mt-2 space-y-2">
                {ss.ketLuan.map((y, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-[14px] text-chu leading-snug">
                    <span className="size-6 rounded-full gd-tim text-white text-[12px] font-extrabold grid place-items-center shrink-0">{i + 1}</span>
                    <span className="pt-0.5">{y}</span>
                  </li>
                ))}
              </ol>
            </section>

            <GhiChuDuLieuMau />

            <div className="space-y-2 pt-1">
              <Nut bieuTuong={Target} muiTen onClick={() => setHopMucTieu(true)}>Chọn mục tiêu</Nut>
              <Nut kieu="vien" bieuTuong={daLuu ? BookmarkCheck : Bookmark} onClick={luu}>{daLuu ? "Đã lưu so sánh" : "Lưu so sánh"}</Nut>
              {vuaLuu && daLuu && <p role="status" className="text-center text-[13px] font-semibold text-luc-chu">Đã lưu so sánh. Lần sau mở “So sánh” sẽ thấy lại cặp này.</p>}
            </div>
          </>
        )}
      </NoiDung>

      <HopChonLuaChon mo={khe !== null} dong={() => setKhe(null)} tieuDe={khe === 1 ? "Chọn trường thứ hai" : "Chọn trường thứ nhất"}
        boQua={[a?.id, b?.id].filter((x): x is string => !!x)} onChon={(l) => khe !== null && chon(khe, l)} />

      <HopTruot mo={hopMucTieu} dong={() => setHopMucTieu(false)} tieuDe="Chọn làm mục tiêu chính">
        <p className="text-[14px] text-chu mb-3">
          Mình sẽ lấy điểm tham khảo thấp nhất của trường làm điểm mục tiêu và lập kế hoạch cho em.
          {mucTieuCu && <> Mục tiêu hiện tại (<b>{mucTieuCu.nganh} – {mucTieuCu.truong}</b>) sẽ được thay.</>}
        </p>
        <div className="space-y-2">
          {ss && [{ l: a!, kq: ss.kqA }, { l: b!, kq: ss.kqB }].map(({ l, kq }) => (
            <button key={l.id} type="button" onClick={() => chonMucTieu(l)}
              className="w-full min-h-16 flex items-center gap-3 rounded-the border border-vien bg-trang p-3 text-left active:bg-xanh-nhat">
              <HuyHieuTruong ten={kyHieu(l.truong)} tone={l.tone} kichThuoc={44} />
              <span className="flex-1 min-w-0">
                <b className="block text-[15px] text-muc leading-snug">{l.nganh} – {l.truong}</b>
                <span className="text-[13px] text-chu-phu">Mục tiêu {l.diemMin.toFixed(1)} điểm</span>
              </span>
              <NhanPhuHop kq={kq} />
            </button>
          ))}
        </div>
      </HopTruot>
    </>
  );
}

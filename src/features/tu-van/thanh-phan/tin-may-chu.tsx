import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CalendarCheck, Check, RotateCcw, Sparkles } from "lucide-react";
import { gop } from "@/components/ui/nut-the";
import { tim } from "@/data/lua-chon-mau";
import { DUONG_DAN } from "@/duong-dan";
import { coTruong, tenTruong } from "@/engine/truong";
import type { HanhDongDeXuat } from "@/engine/tu-van";
import { useApp } from "@/state/store";
import type { TinNhan } from "../hoi-thoai";
import { useCheDoAI } from "../dung-che-do-ai";
import { SuggestedActionChips, type ChipHanhDong } from "./chip-hanh-dong";
import { DataSourceLabel } from "./nhan-nguon-du-lieu";
import { AIClarificationMessage } from "./tin-lam-ro";
import { UniversityMiniCard } from "./the-truong-mini";

const TOI_DA_HIEN = 3;
const NUT_PHU = "min-h-11 shrink-0 rounded-lg px-3 text-[13px] font-bold inline-flex items-center justify-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xanh";

interface Props {
  t: TinNhan;
  /** Tin cuối cùng của cuộc trò chuyện (mới hiện nút Thử lại). */
  laCuoi: boolean;
  dang: boolean;
  /** Tin của bạn ngay trước câu trả lời này (để Thử lại). */
  cauTruoc?: string;
  onGui: (cau: string) => void;
  onThuLai: () => void;
  /** Gọi khi chuyển sang trang khác (khung chat nổi tự đóng). */
  onDi?: () => void;
}

/** Hành động từ ID đã xác thực (máy chủ hoặc bộ trả lời tự động) thành nút điều hướng. Hành động thay đổi dữ liệu không nằm ở đây. */
function chipTuHanhDong(h: HanhDongDeXuat): ChipHanhDong | null {
  if (h.loai === "xem-truong" && h.maTruong && coTruong(h.maTruong)) return { nhan: h.nhan, to: DUONG_DAN.truong(h.maTruong) };
  if ((h.loai === "xem-nganh" || h.loai === "xem-diem-chuan") && h.idChuongTrinh && tim(h.idChuongTrinh)) return { nhan: h.nhan, to: DUONG_DAN.chiTiet(h.idChuongTrinh) };
  if (h.loai === "so-sanh" && h.ids && h.ids.length >= 2 && h.ids.every((i) => tim(i))) return { nhan: h.nhan, to: DUONG_DAN.soSanh(h.ids[0], h.ids[1]) };
  return null;
}

/** Phần dưới câu trả lời của máy: thẻ trường, ngành liên quan, hỏi lại, hành động, nguồn. Dùng chung cho màn Tư vấn và trợ lý nổi. */
export function TinMayChu({ t, laCuoi, dang, cauTruoc, onGui, onThuLai, onDi }: Props) {
  const nav = useNavigate();
  const { s, themNguyenVong } = useApp();
  const { cheDo, doiCheDo } = useCheDoAI();
  const [xemThemThe, setXemThemThe] = useState(false);
  const [xemThemNganh, setXemThemNganh] = useState(false);
  const [chon, setChon] = useState<string | null>(null);
  const [huy, setHuy] = useState(false);

  const the = (t.the ?? []).filter((x) => coTruong(x.ma));
  const theHien = xemThemThe ? the : the.slice(0, TOI_DA_HIEN);
  // Ngành liên quan dạng dòng chỉ hiện khi không có thẻ trường (thẻ đã nêu ngành).
  const nganh = the.length ? [] : (t.nguon ?? []).map((id) => tim(id)).filter((l): l is NonNullable<ReturnType<typeof tim>> => !!l);
  const nganhHien = xemThemNganh ? nganh : nganh.slice(0, TOI_DA_HIEN);

  const hanh = t.hanhDong ?? [];
  const dsThem = hanh.filter((h) => h.loai === "them-nguyen-vong" && h.idChuongTrinh && tim(h.idChuongTrinh));
  // Nút Xem trường đã có trên thẻ thì không lặp lại thành chip riêng.
  const chips: ChipHanhDong[] = hanh.filter((h) => !(h.loai === "xem-truong" && the.some((x) => x.ma === h.maTruong))).map(chipTuHanhDong).filter((c): c is ChipHanhDong => !!c);
  const chipsNhanh: ChipHanhDong[] = (t.luaChon ?? []).map((l) => ({ nhan: l.nhan, onClick: () => onGui(l.cau) }));
  const idChon = chon ?? (dsThem.length === 1 ? dsThem[0].idChuongTrinh! : null);
  const lcChon = idChon ? tim(idChon) : undefined;

  const soSanhThe = (i: number) => {
    const a = theHien[i], b = the.find((x, j) => j !== i && x.id && a?.id);
    if (a?.id && b?.id) { onDi?.(); nav(DUONG_DAN.soSanh(a.id, b.id)); } else onGui(`So sánh ${tenTruong(a.ma) ?? a.ma} với trường khác`);
  };

  return (
    <>
      {the.length > 0 && (
        <div className="mt-2.5 space-y-2" role="group" aria-label="Trường liên quan">
          <ul className="space-y-2">
            {theHien.map((x, i) => <UniversityMiniCard key={x.ma} ma={x.ma} idNganh={x.id} muc={x.muc} onSoSanh={() => soSanhThe(i)} onDi={onDi} />)}
          </ul>
          {the.length > TOI_DA_HIEN && !xemThemThe && (
            <button type="button" onClick={() => setXemThemThe(true)} className={gop(NUT_PHU, "w-full border border-vien bg-trang text-xanh")}>Xem thêm {the.length - TOI_DA_HIEN} trường</button>
          )}
        </div>
      )}

      {nganh.length > 0 && (
        <div className="mt-2.5 space-y-1.5" role="group" aria-label="Ngành liên quan">
          <p className="text-[12px] font-bold text-chu-phu">Các ngành liên quan:</p>
          <ul className="space-y-1.5">
            {nganhHien.map((l) => {
              const daCo = s.nguyenVong.includes(l.id);
              return (
                <li key={l.id} className="rounded-xl border border-xanh/20 bg-xanh-nhat p-2 flex flex-col gap-1.5 min-[420px]:flex-row min-[420px]:items-center">
                  <Link to={DUONG_DAN.chiTiet(l.id)} onClick={onDi} className="min-h-11 min-w-0 flex-1 px-1 text-[13px] font-bold leading-snug text-xanh hover:underline flex items-center">{l.tenTruong || l.truong} · {l.nganh}</Link>
                  <button type="button" disabled={daCo} onClick={() => { if (!daCo) themNguyenVong(l.id); }} aria-label={daCo ? `Đã có ${l.nganh} trong nguyện vọng` : `Thêm ${l.nganh} vào nguyện vọng`}
                    className={gop(NUT_PHU, daCo ? "bg-luc-nhat text-luc-chu" : "border border-xanh/40 bg-trang text-xanh active:bg-xanh-nhat")}>
                    {daCo ? <><Check size={15} />Đã thêm</> : "+ Thêm NV"}
                  </button>
                </li>
              );
            })}
          </ul>
          {nganh.length > TOI_DA_HIEN && !xemThemNganh && (
            <button type="button" onClick={() => setXemThemNganh(true)} className={gop(NUT_PHU, "w-full border border-vien bg-trang text-xanh")}>Xem thêm {nganh.length - TOI_DA_HIEN} ngành</button>
          )}
        </div>
      )}

      {t.hoiLai && (
        <AIClarificationMessage cauHoi={t.hoiLai}>
          {dsThem.length > 1 && !idChon && (
            <ul className="space-y-1.5">
              {dsThem.map((h) => (
                <li key={h.idChuongTrinh} className="flex items-center gap-2 rounded-lg bg-trang p-1.5 border border-vien">
                  <span className="min-w-0 flex-1 px-1 text-[13px] font-semibold text-chu leading-snug break-words">{h.nhan}</span>
                  <button type="button" onClick={() => { setChon(h.idChuongTrinh!); setHuy(false); }} className={gop(NUT_PHU, "border border-xanh/40 bg-trang text-xanh")}>Chọn</button>
                </li>
              ))}
            </ul>
          )}
          <SuggestedActionChips muc={chipsNhanh} onDi={onDi} />
        </AIClarificationMessage>
      )}
      {!t.hoiLai && chipsNhanh.length > 0 && <div className="mt-2"><SuggestedActionChips muc={chipsNhanh} onDi={onDi} /></div>}

      {/* Thêm nguyện vọng chỉ xảy ra sau khi bạn bấm Xác nhận */}
      {lcChon && !huy && (
        <div className="mt-2 rounded-xl border border-xanh/30 bg-xanh-nhat/60 p-2.5 space-y-2" role="group" aria-label="Xác nhận thêm nguyện vọng">
          {s.nguyenVong.includes(lcChon.id)
            ? <p className="flex items-center gap-1.5 text-[13.5px] font-semibold text-luc-chu"><Check size={16} aria-hidden />{lcChon.nganh} · {lcChon.tenTruong || lcChon.truong} đã có trong nguyện vọng.</p>
            : (
              <>
                <p className="text-[13.5px] font-semibold text-muc leading-snug break-words">Thêm {lcChon.nganh} · {lcChon.tenTruong || lcChon.truong} vào nguyện vọng?</p>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => { themNguyenVong(lcChon.id); }} className={gop(NUT_PHU, "bg-xanh text-white active:brightness-95")}>Xác nhận</button>
                  <button type="button" onClick={() => { setHuy(true); setChon(null); }} className={gop(NUT_PHU, "border border-vien bg-trang text-chu")}>Hủy</button>
                </div>
              </>
            )}
        </div>
      )}
      {!t.hoiLai && !lcChon && dsThem.length > 1 && (
        <div className="mt-2 space-y-1.5">
          {dsThem.map((h) => <button key={h.idChuongTrinh} type="button" onClick={() => setChon(h.idChuongTrinh!)} className={gop(NUT_PHU, "w-full border border-xanh/40 bg-trang text-xanh")}>{h.nhan}</button>)}
        </div>
      )}
      {dsThem.length === 1 && huy && !lcChon && (
        <div className="mt-2"><button type="button" onClick={() => setHuy(false)} className={gop(NUT_PHU, "border border-xanh/40 bg-trang text-xanh")}>Thêm vào nguyện vọng</button></div>
      )}

      {chips.length > 0 && <div className="mt-2"><SuggestedActionChips muc={chips} onDi={onDi} nhanNhom="Việc nên làm tiếp" /></div>}

      {/Tạo việc và xếp lịch/.test(t.chu) && (
        <div className="mt-2.5 flex items-center justify-between gap-2 rounded-xl border border-xanh/30 bg-xanh-nhat p-3">
          <b className="min-w-0 text-[13px] leading-tight text-muc">Kế hoạch tuần</b>
          <Link to={DUONG_DAN.tuan()} onClick={onDi} className={gop(NUT_PHU, "bg-xanh text-white")}><CalendarCheck size={14} /> Vào Kế hoạch tuần</Link>
        </div>
      )}
      {t.viecTiep && <p className="mt-1.5 text-[13px] text-muc">Việc nên làm tiếp: <span className="text-chu">{t.viecTiep}</span></p>}
      <DataSourceLabel trangThai={t.trangThaiDuLieu} cheDo={t.cheDo} tang={t.tang} congDong={!!t.congDong?.length} />
      {t.ghiChu && <p className="mt-1.5 text-[12px] text-chu-phu">{t.ghiChu}</p>}
      {t.batAI && laCuoi && !dang && cheDo === "tietKiem" && (
        <div className="mt-1.5">
          <button type="button" onClick={() => { doiCheDo("ai"); if (cauTruoc) onThuLai(); }} className={gop(NUT_PHU, "border border-xanh/40 bg-trang text-xanh")}><Sparkles size={14} />Bật AI, hỏi lại</button>
        </div>
      )}
      {t.thuLai && laCuoi && !dang && cauTruoc && (
        <div className="mt-1 flex flex-wrap items-center gap-x-2">
          <span className="text-[12px] text-chu-phu">Dịch vụ AI chưa phản hồi.</span>
          <button type="button" onClick={onThuLai} className="inline-flex min-h-11 items-center gap-1.5 px-1 text-[13px] font-bold text-xanh"><RotateCcw size={15} />Thử lại</button>
        </div>
      )}
    </>
  );
}

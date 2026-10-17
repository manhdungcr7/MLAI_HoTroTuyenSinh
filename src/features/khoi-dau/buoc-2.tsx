import { useState, type CSSProperties } from "react";
import { ChevronDown, Lightbulb, Sparkles, ThumbsUp, TrendingUp } from "lucide-react";
import { Nhan, TONE_CHU, TONE_NEN, TONE_VIEN, gop } from "@/components/ui/nut-the";
import { MON_CUA_TO_HOP } from "@/data/to-hop-chinh-thuc";
import { CAC_MON, TEN_MON, TEN_MON_NGAN, TEN_MON_THEM, TO_HOP, type HoSo, type MonId, type MonKhoi, type MonThem } from "@/state/types";
import { CAN_CAI_THIEN, DIEM_MANH, ICON_MON, ICON_TO_HOP, TONE_MON, TONE_TO_HOP } from "./lua-chon";
import DiemMonThem from "./diem-mon-them";
import DiemUuTien from "./diem-uu-tien";
import DiemXetTuyenSom from "./diem-xet-tuyen-som";
import { ChuThichLoaiDiem, NhanLoaiDiem, TienDoDiem } from "./loai-diem";
import { CauHoi, ChonO, LoiNho } from "./thanh-phan";
import { DauBuoc } from "./khung-buoc";
import { LOI_DIEM, docDiem, tenMonCuaToHop, tinhCacToHop, toHopCaoNhatDayDu } from "./tinh-toan";
import { dinhDang, dinhDangDiem } from "@/engine/dinh-dang";

export const idDiem = (m: MonId) => `bd-diem-${m}`;
const TO_HOP_APP: string[] = Object.keys(TO_HOP);
const tenMonKhoi = (m: MonKhoi) => (m in TEN_MON ? TEN_MON[m as MonId] : TEN_MON_THEM[m as MonThem]);

type P = {
  h: HoSo;
  sua: (p: Partial<HoSo>) => void;
  chuDiem: Record<MonId, string>; // chữ bạn đang gõ, giữ cả "7," khi gõ dở
  goDiem: (m: MonId, chu: string) => void;
};

/** Môn thấp hơn trung bình các môn còn lại, tính từ điểm đã nhập. Cần ít nhất 3 môn; chênh dưới 1 điểm thì không nhắc. */
function monThapHonTrungBinh(diem: Record<MonId, number | null>) {
  const co = CAC_MON.filter((m) => diem[m] !== null).map((m) => ({ m, d: diem[m] as number }));
  if (co.length < 3) return null;
  const thap = co.reduce((a, b) => (b.d < a.d ? b : a));
  const khac = co.filter((x) => x.m !== thap.m);
  const tb = khac.reduce((t, x) => t + x.d, 0) / khac.length;
  const lech = Math.round((tb - thap.d) * 100) / 100;
  return lech >= 1 ? { m: thap.m, d: thap.d, tb: Math.round(tb * 100) / 100, lech } : null;
}

export default function Buoc2({ h, sua, chuDiem, goDiem }: P) {
  const ketQua = CAC_MON.map((m) => ({ m, kq: docDiem(chuDiem[m]) }));
  // Tổ hợp tính từ chữ đang gõ để cập nhật ngay, ô sai coi như chưa có điểm.
  const diemDung = Object.fromEntries(ketQua.map(({ m, kq }) => [m, kq.loai === "hopLe" ? kq.gia : null])) as Record<MonId, number | null>;
  const toHop = tinhCacToHop(diemDung);
  const caoNhat = Math.max(...toHop.map((t) => t.tong ?? -1));
  const goiYMon = monThapHonTrungBinh(diemDung);
  // Con số Khám phá thật sự dùng (73 tổ hợp + ưu tiên); chỉ nhắc khi khác với 4 thẻ ở trên.
  const dayDu = toHopCaoNhatDayDu(diemDung, h.diemThem, h.uuTienTuyenSinh);
  const loiDiem = ketQua.filter(({ kq }) => kq.loai === "khongPhaiSo" || kq.loai === "ngoaiKhoang");
  const soMonCo = CAC_MON.filter((m) => diemDung[m] !== null).length;
  const coThem = h.diemManh.length + h.canCaiThien.length > 0;
  const [moThem, setMoThem] = useState(coThem);
  const [xemHet, setXemHet] = useState(false);

  // "Xem tất cả": các tổ hợp chính thức khác tính được từ điểm đã nhập (gồm môn thêm), chưa cộng điểm ưu tiên.
  const diemMonKhoi: Partial<Record<MonKhoi, number | null>> = { ...diemDung, ...(h.diemThem ?? {}) };
  const toHopKhac = xemHet
    ? Object.entries(MON_CUA_TO_HOP)
        .filter(([ma]) => !TO_HOP_APP.includes(ma))
        .map(([ma, mon]) => {
          const d = mon.map((m) => diemMonKhoi[m]);
          return { ma, mon, tong: d.every((x) => typeof x === "number") ? (d as number[]).reduce((a, b) => a + b, 0) : null };
        })
        .filter((t) => t.tong !== null)
        .sort((a, b) => (b.tong as number) - (a.tong as number))
    : [];

  return (
    <>
      <DauBuoc tieuDe="Điểm các môn" phai={<NhanLoaiDiem loai="thiThu" className="shrink-0" />}
        moTa="Điểm em đang có, ví dụ từ bài thi thử. Chưa có thì bấm Tiếp tục, nhập sau cũng được." />
      <TienDoDiem co={soMonCo} tong={CAC_MON.length} nhan="Đã nhập" />

      <fieldset className="min-w-0">
        <legend className="sr-only">Điểm các môn</legend>
        <div className="grid grid-cols-3 gap-2">
          {ketQua.map(({ m, kq }, i) => {
            const Icon = ICON_MON[m];
            const tone = TONE_MON[m];
            const sai = kq.loai === "khongPhaiSo" || kq.loai === "ngoaiKhoang";
            return (
              <div
                key={m}
                style={{ "--i": i } as CSSProperties}
                className={gop(
                  "hien-dan da-hien rounded-the border p-2 transition-colors flex flex-col justify-between min-h-[92px]",
                  sai ? "bg-trang border-do ring-1 ring-do" : gop(TONE_NEN[tone], TONE_VIEN[tone], "focus-within:border-xanh focus-within:ring-2 focus-within:ring-xanh/20"),
                )}
              >
                <label htmlFor={idDiem(m)} className={gop("flex items-center gap-1.5 text-[14px] font-bold cursor-pointer", TONE_CHU[tone])}>
                  <Icon size={16} className="shrink-0" />
                  <span className="truncate">{TEN_MON_NGAN[m]}</span>
                </label>
                <div className="flex items-baseline justify-center">
                  <input
                    id={idDiem(m)}
                    inputMode="decimal"
                    autoComplete="off"
                    placeholder="–"
                    value={chuDiem[m]}
                    maxLength={5}
                    onChange={(e) => goDiem(m, e.target.value)}
                    aria-invalid={sai}
                    aria-describedby={sai ? "loi-diem" : undefined}
                    className={gop(
                      "w-14 min-h-11 text-center text-[26px] focus-visible:!outline-none font-black text-muc placeholder:text-chu-phu/30 outline-none bg-transparent",
                      sai && "text-do"
                    )}
                  />
                  <span className="text-[13px] font-semibold text-chu-phu -ml-1">/10</span>
                </div>
              </div>
            );
          })}
        </div>
        <div id="loi-diem" role="alert" className="mt-2 space-y-0.5">
          {loiDiem.map(({ m, kq }) => <LoiNho key={m}>{TEN_MON_NGAN[m]}: {LOI_DIEM[kq.loai as "khongPhaiSo" | "ngoaiKhoang"]}</LoiNho>)}
        </div>
      </fieldset>

      <section aria-labelledby="tieu-de-to-hop">
        <div className="flex items-center justify-between gap-2 mb-1">
          <h3 id="tieu-de-to-hop" className="flex items-center gap-1.5 text-[15px] font-bold text-chu"><Sparkles size={18} className="text-xanh" />Tổ hợp xét tuyển nổi bật</h3>
          <button type="button" onClick={() => setXemHet(!xemHet)} aria-expanded={xemHet} aria-controls="bd-to-hop-khac"
            className="min-h-11 px-2 -mr-2 text-[14px] font-bold text-xanh cursor-pointer whitespace-nowrap">{xemHet ? "Thu gọn" : "Xem tất cả"}</button>
        </div>
        <ul className="grid grid-cols-2 gap-2" aria-live="polite">
          {toHop.map((t) => {
            const Icon = ICON_TO_HOP[t.ma];
            const tone = TONE_TO_HOP[t.ma];
            const nhat = t.tong !== null && t.tong === caoNhat;
            return (
              <li key={t.ma} className={gop("relative rounded-the border p-3 transition-colors", TONE_NEN[tone], nhat ? "border-xanh border-[1.5px]" : TONE_VIEN[tone])}>
                <div className="flex items-center gap-2">
                  <span className={gop("size-8 rounded-lg grid place-items-center bg-trang shrink-0", TONE_CHU[tone])}><Icon size={17} /></span>
                  <span className="min-w-0">
                    <b className={gop("block text-[16px] leading-none", TONE_CHU[tone])}>{t.ma}</b>
                    <span className="block text-[13px] leading-tight text-chu-phu mt-0.5 line-clamp-2">{tenMonCuaToHop(t.mon)}</span>
                  </span>
                </div>
                {t.tong !== null ? (
                  <p className="mt-2 flex flex-wrap items-end justify-between gap-1">
                    <span className="whitespace-nowrap"><b className="text-[24px] font-extrabold text-muc leading-none">{dinhDang(t.tong, 1)}</b><span className="text-[13px] text-chu-phu"> /30</span></span>
                    {nhat && <Nhan tone="xanh" className="!bg-trang !px-1.5 shrink-0">Cao nhất</Nhan>}
                  </p>
                ) : (
                  <p className="mt-2 text-[13px] leading-snug text-chu-phu line-clamp-2">Còn thiếu {t.thieu.map((m) => TEN_MON_NGAN[m]).join(", ")}</p>
                )}
              </li>
            );
          })}
        </ul>
        {xemHet && (
          <div id="bd-to-hop-khac" className="mt-2 rounded-the border border-vien bg-trang p-3">
            {toHopKhac.length === 0 ? (
              <p className="text-[13px] leading-snug text-chu-phu">Chưa tính được tổ hợp nào khác. Nhập thêm điểm ở mục "Điểm các môn khác" bên dưới để xem thêm.</p>
            ) : (
              <>
                <ul className="divide-y divide-vien">
                  {toHopKhac.map((t) => (
                    <li key={t.ma} className="flex items-center justify-between gap-2 py-2 min-h-11">
                      <span className="min-w-0 text-[13px] leading-snug"><b className="text-[14px] text-chu">{t.ma}</b> <span className="text-chu-phu">{t.mon.map(tenMonKhoi).join(" – ")}</span></span>
                      <b className="text-[15px] text-muc whitespace-nowrap shrink-0">{dinhDang(t.tong, 1)}<span className="text-[13px] font-normal text-chu-phu"> /30</span></b>
                    </li>
                  ))}
                </ul>
                <p className="mt-1.5 text-[13px] text-chu-phu">Chưa cộng điểm ưu tiên.</p>
              </>
            )}
          </div>
        )}
        {dayDu && (dayDu.uuTienCong > 0 || !TO_HOP_APP.includes(dayDu.toHop)) && (
          <p aria-live="polite" className="mt-2 rounded-xl bg-xanh-nhat px-3 py-2 text-[13px] text-chu">
            Cao nhất (gồm môn khác, ưu tiên): <b className="text-muc">{dayDu.toHop} · {dinhDang(dayDu.tong, 1)}</b>
            {dayDu.uuTienCong > 0 && <> (+{dinhDangDiem(dayDu.uuTienCong)} ưu tiên)</>}
          </p>
        )}
      </section>

      {goiYMon && (
        <div role="status" aria-live="polite" className="rounded-the border border-cam/30 bg-cam-nhat p-3 text-[13px] text-chu space-y-1">
          <span className="flex items-center gap-1.5 text-[14px] font-bold text-cam-chu"><Lightbulb size={17} />Gợi ý cải thiện</span>
          <p className="leading-snug">
            Môn {TEN_MON[goiYMon.m]} ({dinhDang(goiYMon.d, 1)}) đang thấp hơn trung bình các môn khác ({dinhDang(goiYMon.tb, 1)}) khoảng {dinhDang(goiYMon.lech, 1)} điểm.
            Đây là so sánh giữa các môn của bạn, không phải dự đoán kết quả xét tuyển.
          </p>
        </div>
      )}

      <DiemMonThem h={h} sua={sua} />
      <DiemUuTien h={h} sua={sua} />
      <DiemXetTuyenSom h={h} sua={sua} />
      <ChuThichLoaiDiem cacLoai={["thiThu", "mucTieu", "hocBa"]} />

      <section className="rounded-the border border-vien bg-trang">
        <button type="button" onClick={() => setMoThem(!moThem)} aria-expanded={moThem} aria-controls="bd-them"
          className="w-full min-h-12 flex items-center gap-3 px-4 text-left">
          <span className="flex-1">
            <b className="block text-[15px] text-chu">Thêm về cách bạn học</b>
          </span>
          <ChevronDown size={20} className={gop("text-chu-phu transition-transform", moThem && "rotate-180")} />
        </button>
        {moThem && (
          <div id="bd-them" className="px-4 pb-4 space-y-4 border-t border-vien pt-3">
            <CauHoi tieuDe="Điểm mạnh của bạn" icon={ThumbsUp}>
              <ChonO nhan="Điểm mạnh" nhieu cacLua={DIEM_MANH.map((x) => ({ gia: x, nhan: x }))} giaTri={h.diemManh} onChange={(v) => sua({ diemManh: v })} />
            </CauHoi>
            <CauHoi tieuDe="Điều bạn muốn cải thiện" icon={TrendingUp}>
              <ChonO nhan="Điều muốn cải thiện" nhieu cacLua={CAN_CAI_THIEN.map((x) => ({ gia: x, nhan: x }))} giaTri={h.canCaiThien} onChange={(v) => sua({ canCaiThien: v })} />
            </CauHoi>
          </div>
        )}
      </section>
    </>
  );
}

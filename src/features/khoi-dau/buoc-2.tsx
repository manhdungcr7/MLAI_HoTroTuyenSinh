import { useState } from "react";
import { ChevronDown, NotebookPen, Pencil, Sparkles, ThumbsUp, TrendingUp } from "lucide-react";
import { Nhan, TONE_CHU, TONE_NEN, gop } from "@/components/ui/nut-the";
import { CAC_MON, TEN_MON_NGAN, TO_HOP, type HoSo, type MonId } from "@/state/types";
import { CAN_CAI_THIEN, DIEM_MANH, ICON_MON, ICON_TO_HOP, TONE_MON, TONE_TO_HOP } from "./lua-chon";
import DiemMonThem from "./diem-mon-them";
import DiemUuTien from "./diem-uu-tien";
import { CauHoi, ChonO, LoiNho, TieuDeBuoc } from "./thanh-phan";
import { LOI_DIEM, docDiem, tenMonCuaToHop, tinhCacToHop, toHopCaoNhatDayDu } from "./tinh-toan";
import { dinhDang } from "@/engine/dinh-dang";

export const idDiem = (m: MonId) => `bd-diem-${m}`;
const TO_HOP_APP: string[] = Object.keys(TO_HOP);

type P = {
  h: HoSo;
  sua: (p: Partial<HoSo>) => void;
  chuDiem: Record<MonId, string>; // chữ em đang gõ, giữ cả "7," khi gõ dở
  goDiem: (m: MonId, chu: string) => void;
};

export default function Buoc2({ h, sua, chuDiem, goDiem }: P) {
  const ketQua = CAC_MON.map((m) => ({ m, kq: docDiem(chuDiem[m]) }));
  // Tổ hợp tính từ chữ đang gõ để cập nhật ngay, ô sai coi như chưa có điểm.
  const diemDung = Object.fromEntries(ketQua.map(({ m, kq }) => [m, kq.loai === "hopLe" ? kq.gia : null])) as Record<MonId, number | null>;
  const toHop = tinhCacToHop(diemDung);
  const caoNhat = Math.max(...toHop.map((t) => t.tong ?? -1));
  // Con số Khám phá thật sự dùng (73 tổ hợp + ưu tiên); chỉ nhắc khi khác với 4 thẻ ở trên.
  const dayDu = toHopCaoNhatDayDu(diemDung, h.diemThem, h.uuTienTuyenSinh);
  const loiDiem = ketQua.filter(({ kq }) => kq.loai === "khongPhaiSo" || kq.loai === "ngoaiKhoang");
  const coThem = h.diemManh.length + h.canCaiThien.length > 0;
  const [moThem, setMoThem] = useState(coThem);

  return (
    <>
      <TieuDeBuoc tieuDe="Nhập điểm nhanh" moTa="Nhập điểm gần nhất, tổ hợp xét tuyển tự tính ngay cho em."
        phai={<span className="mt-1.5 shrink-0 inline-flex items-center gap-1 rounded-lg bg-xanh-nhat px-2 py-1 text-[12px] font-bold text-xanh"><Pencil size={13} />Sửa sau được</span>} />

      <fieldset className="min-w-0">
        <legend className="flex items-center gap-1.5 text-[15px] font-bold text-chu mb-2">
          <NotebookPen size={18} className="text-xanh" />Điểm các môn <span className="text-[12px] font-semibold text-chu-phu">(thang 10)</span>
        </legend>
        <div className="grid grid-cols-3 gap-2">
          {ketQua.map(({ m, kq }) => {
            const Icon = ICON_MON[m];
            const sai = kq.loai === "khongPhaiSo" || kq.loai === "ngoaiKhoang";
            return (
              <div key={m} className={gop("rounded-the border bg-trang p-1.5 sm:p-2 shadow-the min-w-0", sai ? "border-do/60" : "border-vien")}>
                <label htmlFor={idDiem(m)} className="flex items-center gap-1 text-[13px] sm:text-[14px] font-bold text-chu mb-1">
                  <span className={gop("size-5 sm:size-6 rounded-lg grid place-items-center shrink-0", TONE_NEN[TONE_MON[m]], TONE_CHU[TONE_MON[m]])}><Icon size={13} /></span>
                  <span className="truncate">{TEN_MON_NGAN[m]}</span>
                </label>
                <div className="flex items-center gap-0.5 sm:gap-1">
                  <input id={idDiem(m)} inputMode="decimal" autoComplete="off" placeholder="–" value={chuDiem[m]} maxLength={5}
                    onChange={(e) => goDiem(m, e.target.value)} aria-invalid={sai}
                    aria-describedby={sai ? "loi-diem" : undefined}
                    className={gop("w-full min-w-0 min-h-11 sm:min-h-12 rounded-xl border bg-trang px-1 text-center text-[15px] sm:text-[17px] font-bold text-muc placeholder:text-chu-phu/60 focus:border-xanh",
                      sai ? "border-do text-do-chu" : "border-vien")} />
                  <span className="text-[12px] text-chu-phu shrink-0">/10</span>
                </div>
              </div>
            );
          })}
        </div>
        {loiDiem.length > 0 && (
          <div id="loi-diem" role="alert" className="mt-2 space-y-0.5">
            {loiDiem.map(({ m, kq }) => <LoiNho key={m}>{TEN_MON_NGAN[m]}: {LOI_DIEM[kq.loai as "khongPhaiSo" | "ngoaiKhoang"]}</LoiNho>)}
          </div>
        )}
        <p className="mt-2 text-[12px] text-chu-phu">Chưa nhớ chính xác thì để trống, em bổ sung sau. Gõ "7,5" hay "7.5" đều được.</p>
      </fieldset>

      <DiemMonThem h={h} sua={sua} />
      <DiemUuTien h={h} sua={sua} />

      <section aria-labelledby="tieu-de-to-hop">
        <div className="flex items-center justify-between gap-2 mb-2">
          <h3 id="tieu-de-to-hop" className="flex items-center gap-1.5 text-[15px] font-bold text-chu"><Sparkles size={18} className="text-xanh" />Tổ hợp xét tuyển tự tính</h3>
          <Nhan tone="xanh">Theo điểm của em</Nhan>
        </div>
        <ul className="grid grid-cols-2 gap-2" aria-live="polite">
          {toHop.map((t) => {
            const Icon = ICON_TO_HOP[t.ma];
            const tone = TONE_TO_HOP[t.ma];
            const nhat = t.tong !== null && t.tong === caoNhat;
            return (
              <li key={t.ma} className={gop("relative rounded-the p-3", TONE_NEN[tone], nhat && "ring-2 ring-xanh/50")}>
                <div className="flex items-center gap-2">
                  <span className={gop("size-8 rounded-lg grid place-items-center bg-trang", TONE_CHU[tone])}><Icon size={17} /></span>
                  <span className="min-w-0">
                    <b className={gop("block text-[16px] leading-none", TONE_CHU[tone])}>{t.ma}</b>
                    <span className="block text-[12px] text-chu-phu mt-0.5 truncate">{tenMonCuaToHop(t.mon)}</span>
                  </span>
                </div>
                {t.tong !== null ? (
                  <p className="mt-2 flex items-end justify-between gap-1">
                    <span><b className="text-[24px] font-extrabold text-muc leading-none">{dinhDang(t.tong, 1).replace(".", ",")}</b><span className="text-[13px] text-chu-phu"> / 30</span></span>
                    {nhat && <Nhan tone="xanh" className="!bg-trang !px-1.5">Cao nhất</Nhan>}
                  </p>
                ) : (
                  <p className="mt-2 text-[13px] leading-snug">
                    <b className="block text-chu-phu">Chưa đủ điểm</b>
                    <span className="text-chu-phu">Thiếu {t.thieu.map((m) => TEN_MON_NGAN[m]).join(", ")}</span>
                  </p>
                )}
              </li>
            );
          })}
        </ul>
        <p className="mt-2 text-[12px] text-chu-phu">Tổng 3 môn, chưa cộng điểm ưu tiên. Khi so với điểm chuẩn, mình tự cộng phần ưu tiên em khai ở mục Điểm ưu tiên.</p>
        {dayDu && (dayDu.uuTienCong > 0 || !TO_HOP_APP.includes(dayDu.toHop)) && (
          <p aria-live="polite" className="mt-2 rounded-xl bg-xanh-nhat px-3 py-2.5 text-[13px] text-chu">
            Tính cả môn khác và điểm ưu tiên, tổ hợp cao nhất của em là <b className="text-muc">{dayDu.toHop}</b>: <b className="text-muc">{dinhDang(dayDu.tong, 1)}</b> điểm
            {dayDu.uuTienCong > 0 && <> (đã cộng {dinhDang(dayDu.uuTienCong, 2)} ưu tiên)</>}. Đây là số mình dùng khi so với điểm chuẩn ở Khám phá.
          </p>
        )}
      </section>

      <section className="rounded-the border border-vien bg-trang">
        <button type="button" onClick={() => setMoThem(!moThem)} aria-expanded={moThem} aria-controls="bd-them"
          className="w-full min-h-14 flex items-center gap-3 px-4 text-left">
          <span className="flex-1">
            <b className="block text-[15px] text-chu">Thêm về cách em học</b>
            <span className="block text-[13px] text-chu-phu">Không bắt buộc · giúp gợi ý kế hoạch học sát hơn</span>
          </span>
          <ChevronDown size={20} className={gop("text-chu-phu transition-transform", moThem && "rotate-180")} />
        </button>
        {moThem && (
          <div id="bd-them" className="px-4 pb-4 space-y-4 border-t border-vien pt-3">
            <CauHoi tieuDe="Điểm mạnh của em" icon={ThumbsUp}>
              <ChonO nhan="Điểm mạnh" nhieu cacLua={DIEM_MANH.map((x) => ({ gia: x, nhan: x }))} giaTri={h.diemManh} onChange={(v) => sua({ diemManh: v })} />
            </CauHoi>
            <CauHoi tieuDe="Điều em muốn cải thiện" icon={TrendingUp}>
              <ChonO nhan="Điều muốn cải thiện" nhieu cacLua={CAN_CAI_THIEN.map((x) => ({ gia: x, nhan: x }))} giaTri={h.canCaiThien} onChange={(v) => sua({ canCaiThien: v })} />
            </CauHoi>
          </div>
        )}
      </section>
    </>
  );
}

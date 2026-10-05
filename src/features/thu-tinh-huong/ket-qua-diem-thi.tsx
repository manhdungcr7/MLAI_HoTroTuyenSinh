// Màn 14 (bước 2) · "Danh sách đã thay đổi thế nào?": so sánh ảnh chụp trước/sau khi nhập điểm thi thử.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowDown, ArrowRight, ArrowUp, BarChart3, CheckCircle2, ChevronRight, ClipboardList, ClipboardPen, Equal, Scale, ShieldCheck, type LucideIcon } from "lucide-react";
import { DauTrangCoQuayLai, NoiDung } from "@/components/layout/khung";
import { HuyHieuTruong } from "@/components/ui/hinh-nen";
import { TrangThaiTrong } from "@/components/ui/hien-thi";
import { NhanNguyenVongTag } from "@/components/ui/co-cau";
import { Nut, TONE_CHU, TONE_NEN, gop } from "@/components/ui/nut-the";
import { tim } from "@/data/lua-chon-mau";
import { DUONG_DAN } from "@/duong-dan";
import { useLuuCucBo } from "@/state/luu-cuc-bo";
import { TEN_MON, TEN_MON_NGAN, type ToneTen } from "@/state/types";
import { GhiChuDuLieu, TruocSau } from "./dung-chung";
import { ANH_TRONG, dongDangChuY, huongThay, tomTatTruocSau, vietDiem, type AnhTruocSau, type DongTomTat, type HuongThay } from "./tinh-toan";

const KIEU_TOM_TAT: Record<DongTomTat["loai"], { icon: LucideIcon; tone: ToneTen }> = {
  len: { icon: ArrowUp, tone: "luc" }, xuong: { icon: ArrowDown, tone: "do" }, giu: { icon: Equal, tone: "xanh" },
  anToan: { icon: ShieldCheck, tone: "xanh" }, thieuAnToan: { icon: AlertTriangle, tone: "cam" },
  xemLai: { icon: AlertTriangle, tone: "cam" }, on: { icon: CheckCircle2, tone: "luc" },
};
const THE_HUONG: Record<HuongThay, { chu: string; icon: LucideIcon; tone: ToneTen }> = {
  tang: { chu: "Tăng cơ hội", icon: ArrowUp, tone: "luc" },
  giam: { chu: "Giảm phù hợp", icon: ArrowDown, tone: "do" },
  giu: { chu: "Giữ nguyên", icon: Equal, tone: "muc" },
};
const THE_MOI_TINH = { chu: "Mới tính", icon: CheckCircle2, tone: "xanh" as ToneTen };
const SO_DONG_GON = 4;

export default function KetQuaDiemThi() {
  const nav = useNavigate();
  const [anh] = useLuuCucBo<AnhTruocSau>("diem-thi-thu-truoc-sau", ANH_TRONG);
  const [moHet, setMoHet] = useState(false);

  if (!anh.luc || anh.dong.length === 0) {
    return (
      <>
        <DauTrangCoQuayLai tieuDe="Kết quả tính lại" quayLai={DUONG_DAN.diemThiThu()} />
        <NoiDung>
          <TrangThaiTrong bieuTuong={<ClipboardList size={26} />} tieuDe="Chưa có kết quả để so sánh"
            moTa="Em nhập điểm thi thử mới, hệ thống sẽ đặt danh sách trước và sau cạnh nhau để em thấy thay đổi.">
            <Nut muiTen onClick={() => nav(DUONG_DAN.diemThiThu())}>Nhập điểm thi thử</Nut>
          </TrangThaiTrong>
        </NoiDung>
      </>
    );
  }

  const tomTat = tomTatTruocSau(anh, tim);
  const dsChuY = dongDangChuY(anh).filter((d) => tim(d.id));
  const hien = moHet ? dsChuY : dsChuY.slice(0, SO_DONG_GON);
  const luc = new Date(anh.luc);
  const ngay = `${String(luc.getDate()).padStart(2, "0")}/${String(luc.getMonth() + 1).padStart(2, "0")}`;

  return (
    <>
      <DauTrangCoQuayLai tieuDe="Kết quả tính lại" quayLai={DUONG_DAN.diemThiThu()} />
      <NoiDung>
        <div>
          <h2 className="text-[22px] leading-tight font-extrabold text-muc">Danh sách đã thay đổi thế nào?</h2>
          <p className="text-[14px] text-chu-phu mt-1">
            Dựa trên điểm thi thử ngày {ngay}, gợi ý {anh.nguon === "nguyenVong" ? "nguyện vọng của em" : "trường (em chưa có nguyện vọng nên dùng danh sách gợi ý)"} đã được cập nhật.
          </p>
        </div>

        {/* Điểm đã đổi */}
        <div className="flex flex-wrap gap-2" aria-label="Điểm đã đổi">
          {anh.monDoi.map((m) => (
            <span key={m.mon} className="inline-flex items-center gap-1.5 rounded-xl bg-trang border border-vien px-2.5 py-1.5 text-[13px]">
              <b className="text-chu">{TEN_MON_NGAN[m.mon]}</b>
              {m.truoc === null ? <b className="text-luc-chu">{vietDiem(m.sau)}</b> : <TruocSau truoc={m.truoc} sau={m.sau} viet={vietDiem} />}
            </span>
          ))}
          {anh.thieuSau.length === 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-xanh-nhat px-2.5 py-1.5 text-[13px]">
              <b className="text-xanh">{anh.maToHop}</b>
              {anh.coTruoc ? <TruocSau truoc={anh.tongTruoc} sau={anh.tongSau} viet={(n) => n.toFixed(2)} /> : <b className="text-luc-chu">{anh.tongSau.toFixed(2)}</b>}
            </span>
          )}
        </div>

        {anh.thieuSau.length > 0 ? (
          <TrangThaiTrong bieuTuong={<ClipboardPen size={26} />} tieuDe={`Chưa đủ điểm tổ hợp ${anh.maToHop} để so sánh`}
            moTa={`Điểm mới đã được ghi. Em cần thêm điểm ${anh.thieuSau.map((m) => TEN_MON[m]).join(", ")} để tính lại danh sách trường.`}>
            <Nut muiTen onClick={() => nav(DUONG_DAN.diemThiThu())}>Nhập thêm điểm</Nut>
          </TrangThaiTrong>
        ) : (
          <>
            {/* Ba dòng tóm tắt */}
            <ul className="rounded-the bg-trang border border-vien shadow-the divide-y divide-vien" aria-label="Tóm tắt thay đổi">
              {tomTat.map((d) => {
                const k = KIEU_TOM_TAT[d.loai];
                const noiDung = (
                  <>
                    <span className={gop("size-10 rounded-xl grid place-items-center shrink-0", TONE_NEN[k.tone], TONE_CHU[k.tone])}><k.icon size={20} strokeWidth={2.6} /></span>
                    <span className="flex-1 min-w-0">
                      <b className={gop("block text-[15px] leading-snug", TONE_CHU[k.tone])}>{d.tieuDe}</b>
                      <span className="block text-[13px] text-chu-phu leading-snug">{d.moTa}</span>
                    </span>
                  </>
                );
                return (
                  <li key={d.loai}>
                    {d.id ? (
                      <button type="button" onClick={() => nav(DUONG_DAN.chiTiet(d.id!))} className="w-full min-h-16 px-3 py-2.5 flex items-center gap-3 text-left active:bg-xanh-nhat rounded-the">
                        {noiDung}<ChevronRight size={18} className="text-chu-phu shrink-0" />
                      </button>
                    ) : <div className="min-h-16 px-3 py-2.5 flex items-center gap-3">{noiDung}</div>}
                  </li>
                );
              })}
            </ul>

            {/* Trường thay đổi đáng chú ý */}
            <section aria-labelledby="dang-chu-y">
              <div className="flex items-center justify-between mt-1 mb-2">
                <h2 id="dang-chu-y" className="text-[16px] font-extrabold text-muc">Một số trường thay đổi đáng chú ý</h2>
                {dsChuY.length > SO_DONG_GON && (
                  <button type="button" onClick={() => setMoHet((x) => !x)} aria-expanded={moHet} className="min-h-11 px-1 -mr-1 text-[13px] font-bold text-xanh whitespace-nowrap">
                    {moHet ? "Thu gọn" : "Xem tất cả"}
                  </button>
                )}
              </div>
              <ul className="space-y-2.5">
                {hien.map((d) => {
                  const lc = tim(d.id)!;
                  const h = anh.coTruoc ? THE_HUONG[huongThay(d)] : THE_MOI_TINH;
                  return (
                    <li key={d.id}>
                      <button type="button" onClick={() => nav(DUONG_DAN.chiTiet(d.id))} className="w-full text-left rounded-the bg-trang border border-vien shadow-the p-3 flex items-start gap-3 active:bg-xanh-nhat">
                        <HuyHieuTruong ten={lc.truong} tone={lc.tone} kichThuoc={42} />
                        <span className="flex-1 min-w-0">
                          <span className="flex items-start justify-between gap-2">
                            <b className="text-[15px] text-muc leading-snug">{lc.tenTruong}</b>
                            <span className={gop("inline-flex items-center gap-0.5 rounded-lg px-2 py-0.5 text-[12px] font-bold whitespace-nowrap shrink-0", TONE_NEN[h.tone], h.tone === "muc" ? "text-chu-phu" : TONE_CHU[h.tone])}>
                              <h.icon size={13} strokeWidth={2.8} />{h.chu}
                            </span>
                          </span>
                          <span className="block text-[13px] text-chu-phu">{lc.nganh}</span>
                          <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                            {anh.coTruoc && <><NhanNguyenVongTag nhan={d.nhanTruoc} /><ArrowRight size={14} className="text-chu-phu" aria-label="thành" /></>}
                            <NhanNguyenVongTag nhan={d.nhanSau} />
                            <span className="text-[12px] text-chu-phu">· phù hợp {anh.coTruoc ? <TruocSau truoc={d.phuHopTruoc} sau={d.phuHopSau} /> : <b className="text-chu">{d.phuHopSau}</b>}</span>
                          </span>
                        </span>
                        <ChevronRight size={18} className="text-chu-phu shrink-0 self-center" />
                      </button>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-2"><GhiChuDuLieu>Nhãn tính từ tổng điểm so với điểm tham khảo năm trước. Điểm phù hợp trên thang 100, KHÔNG phải xác suất đậu.</GhiChuDuLieu></div>
            </section>
          </>
        )}

        {/* Bước tiếp theo */}
        <section aria-labelledby="lam-gi-tiep">
          <h2 id="lam-gi-tiep" className="text-[16px] font-extrabold text-muc mb-2 mt-1">Nên làm gì tiếp theo?</h2>
          <div className="grid grid-cols-3 gap-2">
            {([
              { chu: ["Cập nhật", "nguyện vọng"], icon: ClipboardPen, den: DUONG_DAN.nguyenVong(), chinh: true },
              { chu: ["Xem lại", "kế hoạch học"], icon: BarChart3, den: DUONG_DAN.tuan(), chinh: false },
              { chu: ["So sánh", "lại trường"], icon: Scale, den: DUONG_DAN.soSanh(), chinh: false },
            ]).map((b) => (
              <button key={b.den} type="button" onClick={() => nav(b.den)}
                className={gop("min-h-20 rounded-xl px-1.5 py-2 flex flex-col items-center justify-center gap-1 text-center text-[13px] font-bold leading-tight transition active:scale-[.99]",
                  b.chinh ? "gd-xanh text-white shadow-nut" : "bg-trang border border-vien text-xanh active:bg-xanh-nhat")}>
                <b.icon size={22} />
                <span>{b.chu[0]}<br />{b.chu[1]}</span>
              </button>
            ))}
          </div>
        </section>
      </NoiDung>
    </>
  );
}

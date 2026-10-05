// Màn 13 (bước 2) · Kết quả sau khi thử: danh sách trường đổi thế nào + so sánh các tình huống đã lưu.
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart3, Bookmark, ChevronRight, FlaskConical, Lightbulb, Search, TrendingUp, Trophy, X } from "lucide-react";
import { DauTrangCoQuayLai, NoiDung } from "@/components/layout/khung";
import { HuyHieuTruong, NenHero } from "@/components/ui/hinh-nen";
import { TrangThaiTrong } from "@/components/ui/hien-thi";
import { Nhan, Nut, The, gop } from "@/components/ui/nut-the";
import { DongThongBao } from "@/components/ui/thong-bao";
import { LUA_CHON_MAU } from "@/data/lua-chon-mau";
import { DUONG_DAN } from "@/duong-dan";
import { NGUONG_PHU_HOP } from "@/engine/phan-tich";
import type { ToneTen } from "@/state/types";
import { BaoNho, GhiChuDuLieu, ThieuDiem, TruocSau, useLuuTinhHuong, useTinhHuong } from "./dung-chung";
import { TEN_TRANG_THAI, bangSoSanh, moTaCongDiem, tenTinhHuong, type DongKetQua, type NhomLoc, type TrangThaiThay } from "./tinh-toan";

const TONE_TRANG_THAI: Record<TrangThaiThay, ToneTen> = { moiPhuHop: "luc", tangCoHoi: "xanh", giuNguyen: "muc", vanKho: "cam", giamDi: "do" };
type Loc = "tatCa" | NhomLoc;

export default function KetQuaTinhHuong() {
  const nav = useNavigate();
  const t = useTinhHuong();
  const { maToHop, dkGoc, dangThu, thieu, kq } = t;
  const { luu, bao } = useLuuTinhHuong(t);
  const [loc, setLoc] = useState<Loc>("tatCa");

  const moTa = moTaCongDiem(dangThu.congMon);
  const ten = tenTinhHuong(dangThu, dkGoc);
  const tieuDe = moTa ? `Kết quả sau khi ${moTa}` : "Kết quả khi đổi điều kiện";
  const neu = moTa ? `Nếu ${moTa}` : "Với điều kiện mới";
  const ds = loc === "tatCa" ? kq.dong : kq.dong.filter((d) => d.nhom === loc);
  const cacLoc: { gia: Loc; nhan: string; so: number }[] = [
    { gia: "tatCa", nhan: "Tất cả", so: kq.dong.length },
    { gia: "moiMo", nhan: "Mới mở", so: kq.dem.moiMo },
    { gia: "tang", nhan: "Tăng cơ hội", so: kq.dem.tang },
    { gia: "khongDoi", nhan: "Không đổi", so: kq.dem.khongDoi },
    ...(kq.dem.giam > 0 ? [{ gia: "giam" as const, nhan: "Giảm đi", so: kq.dem.giam }] : []),
  ];

  return (
    <>
      <DauTrangCoQuayLai tieuDe="Kết quả thay đổi" quayLai={DUONG_DAN.thuTinhHuong()} />
      <NoiDung>
        {thieu.length > 0 ? <ThieuDiem maToHop={maToHop} thieu={thieu} /> : !kq.coThayDoi ? (
          <TrangThaiTrong bieuTuong={<FlaskConical size={26} />} tieuDe="Em chưa thử thay đổi gì"
            moTa="Chọn một môn và kéo tăng điểm, hoặc đổi ngân sách, khu vực, để xem danh sách trường đổi ra sao.">
            <Nut muiTen onClick={() => nav(DUONG_DAN.thuTinhHuong())}>Thử tình huống</Nut>
          </TrangThaiTrong>
        ) : (
          <>
            <div>
              <h2 className="text-[21px] leading-tight font-extrabold text-muc">{tieuDe}</h2>
              {moTa && ten.includes(" · ") && <p className="text-[13px] text-chu mt-1">Tình huống: <b className="text-xanh">{ten}</b></p>}
              <p className="text-[13px] text-chu-phu mt-1">Tổng {maToHop}: <TruocSau truoc={kq.tongTruoc} sau={kq.tongSau} viet={(n) => n.toFixed(2)} /></p>
            </div>

            <NenHero tone={kq.dem.moiMo > 0 ? "luc" : "xanh"} className="p-4">
              <div className="flex items-start gap-3">
                <span className={gop("size-11 rounded-xl grid place-items-center text-white shrink-0", kq.dem.moiMo > 0 ? "gd-luc" : "gd-xanh")}><BarChart3 size={22} /></span>
                <p className="text-[15px] leading-snug font-bold text-muc">
                  {kq.dem.moiMo > 0
                    ? <>{neu}, em mở thêm <span className="text-luc-chu">{kq.dem.moiMo} lựa chọn</span> nổi bật.</>
                    : kq.dem.tang > 0
                      ? <>{neu}, chưa mở thêm lựa chọn mới, nhưng <span className="text-xanh">{kq.dem.tang} lựa chọn</span> có điểm phù hợp cao hơn.</>
                      : <>{neu}, danh sách gần như không đổi{kq.dem.giam > 0 ? <>, có <span className="text-do-chu">{kq.dem.giam} lựa chọn</span> giảm đi</> : ""}.</>}
                </p>
              </div>
            </NenHero>

            {/* Thanh lọc */}
            <div className="-mx-4 px-4 overflow-x-auto an-thanh-cuon">
              <div role="tablist" aria-label="Lọc theo thay đổi" className="flex gap-2 w-max">
                {cacLoc.map((c) => (
                  <button key={c.gia} type="button" role="tab" aria-selected={loc === c.gia} onClick={() => setLoc(c.gia)}
                    className={gop("min-h-12 px-3.5 rounded-xl border text-[14px] font-bold whitespace-nowrap transition-colors",
                      loc === c.gia ? "gd-xanh border-transparent text-white" : "bg-trang border-vien text-chu active:bg-xanh-nhat")}>
                    {c.nhan} ({c.so})
                  </button>
                ))}
              </div>
            </div>

            <ul className="space-y-2.5" aria-label="Danh sách trường sau khi thử">
              {ds.length === 0
                ? <li className="rounded-the border border-dashed border-vien bg-trang p-4 text-center text-[14px] text-chu-phu">Không có lựa chọn nào ở nhóm này.</li>
                : ds.map((d) => <li key={d.lc.id}><DongTruong d={d} onClick={() => nav(DUONG_DAN.chiTiet(d.lc.id))} /></li>)}
            </ul>
            <GhiChuDuLieu>{`Điểm phù hợp trên thang 100, từ ${NGUONG_PHU_HOP} được xem là phù hợp. Đây là điểm gợi ý, KHÔNG phải xác suất đậu.`}</GhiChuDuLieu>

            {kq.thayDoiLonNhat && (
              <DongThongBao tone="cam" icon={Trophy} tieuDe="Thay đổi lớn nhất" onClick={() => nav(DUONG_DAN.chiTiet(kq.thayDoiLonNhat!.lc.id))}
                moTa={`${kq.thayDoiLonNhat.lc.nganh} (${kq.thayDoiLonNhat.lc.truong}) ${kq.thayDoiLonNhat.chenh > 0 ? "tăng" : "giảm"} ${Math.abs(kq.thayDoiLonNhat.chenh)} điểm phù hợp ${moTa ? `khi ${moTa}` : "với điều kiện mới"}.`} />
            )}
            <DongThongBao tone="luc" icon={TrendingUp} tieuDe="Lựa chọn trở nên khả thi hơn"
              moTa={kq.dem.moiMo > 0
                ? `Có ${kq.dem.moiMo} lựa chọn chuyển từ dưới ${NGUONG_PHU_HOP} lên mức phù hợp trong tình huống “${ten}”.${kq.dem.giam ? ` ${kq.dem.giam} lựa chọn giảm điểm phù hợp.` : ""}`
                : `Chưa có lựa chọn nào vượt mức ${NGUONG_PHU_HOP}. ${kq.dem.tang > 0 ? `${kq.dem.tang} lựa chọn đang gần hơn.` : "Em thử tăng thêm hoặc đổi môn khác."}`} />
          </>
        )}

        {thieu.length === 0 && (
          <SoSanhDaLuu t={t} onLuu={kq.coThayDoi ? luu : undefined} />
        )}

        {thieu.length === 0 && (
          <div className="space-y-2 pt-1">
            <BaoNho bao={bao} />
            <Nut muiTen bieuTuong={Search} onClick={() => nav(DUONG_DAN.khamPha())}>Xem lựa chọn chi tiết</Nut>
            {kq.coThayDoi && <Nut kieu="vien" bieuTuong={Bookmark} onClick={luu}>Lưu tình huống</Nut>}
          </div>
        )}
      </NoiDung>
    </>
  );
}


/** So sánh các tình huống đã lưu: Hiện tại | tình huống 1 | tình huống 2 cho top 3 lựa chọn. */
export function SoSanhDaLuu({ t, onLuu }: { t: ReturnType<typeof useTinhHuong>; onLuu?: () => void }) {
  const nav = useNavigate();
  const { app, diem, toHop, dkGoc } = t;
  const daLuu = app.s.tinhHuong;
  const [chon, setChon] = useState<string[]>(() => daLuu.slice(-2).map((x) => x.id));
  // Tình huống vừa lưu tự được đưa vào bảng so sánh.
  const moiNhat = daLuu[daLuu.length - 1]?.id;
  useEffect(() => { if (moiNhat) setChon((c) => (c.includes(moiNhat) ? c : [...c, moiNhat].slice(-2))); }, [moiNhat]);
  const chonCon = chon.filter((id) => daLuu.some((x) => x.id === id));
  const bang = useMemo(() => bangSoSanh(LUA_CHON_MAU, diem, toHop, dkGoc, daLuu.filter((x) => chonCon.includes(x.id))), [daLuu, chonCon, diem, toHop, dkGoc]);
  const doiChon = (id: string) => setChon((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c.filter((x) => chonCon.includes(x)), id].slice(-2)));

  return (
    <section aria-labelledby="so-sanh-th" className="pt-2">
      <h2 id="so-sanh-th" className="text-[16px] font-extrabold text-muc mb-2">So sánh các tình huống đã lưu</h2>
      {daLuu.length === 0 ? (
        <div className="rounded-the border border-dashed border-xanh/30 bg-trang p-4 flex gap-3">
          <Lightbulb size={22} className="text-cam shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-extrabold text-muc text-[15px]">Chưa lưu tình huống nào</p>
            <p className="text-[13px] text-chu-phu mt-0.5">Lưu vài tình huống (ví dụ “Toán +1”, “Ngân sách 30 tr”) để đặt cạnh nhau so với hiện tại.</p>
            {onLuu && <Nut kieu="nhe" bieuTuong={Bookmark} className="mt-3" onClick={onLuu}>Lưu tình huống này</Nut>}
          </div>
        </div>
      ) : (
        <>
          <p className="text-[13px] text-chu-phu -mt-1 mb-2">Chọn tối đa 2 tình huống để đặt cạnh “Hiện tại”.</p>
          <div className="-mx-4 px-4 overflow-x-auto an-thanh-cuon">
            <ul className="flex gap-2 w-max pb-1">
              <li className="w-[128px] rounded-xl border border-vien bg-trang p-2.5">
                <b className="block text-[14px] text-muc">Hiện tại</b>
                <span className="block text-[12px] text-chu-phu">{bang.cot[0].tong.toFixed(2)} điểm</span>
                <span className="block text-[12px] text-chu-phu">{dkGoc.nganSachTrieu} triệu/năm</span>
              </li>
              {daLuu.map((th) => {
                const dang = chonCon.includes(th.id);
                return (
                  <li key={th.id} className={gop("w-[150px] rounded-xl border flex", dang ? "border-xanh bg-xanh-nhat" : "border-vien bg-trang")}>
                    <button type="button" aria-pressed={dang} onClick={() => doiChon(th.id)} className="flex-1 min-w-0 min-h-12 p-2.5 text-left">
                      <b className={gop("block text-[14px] leading-snug line-clamp-2", dang ? "text-xanh" : "text-muc")}>{th.ten}</b>
                      <span className="block text-[12px] text-chu-phu">{th.nganSachTrieu} triệu/năm</span>
                    </button>
                    <button type="button" aria-label={`Xóa tình huống ${th.ten}`} onClick={() => app.xoaTinhHuong(th.id)}
                      className="size-11 shrink-0 grid place-items-center text-chu-phu rounded-xl active:bg-do-nhat active:text-do-chu"><X size={18} /></button>
                  </li>
                );
              })}
            </ul>
          </div>
          <The className="mt-2 p-3">
            <table className="w-full text-[13px] table-fixed">
              <caption className="sr-only">Điểm phù hợp của top 3 lựa chọn theo từng tình huống</caption>
              <thead>
                <tr className="text-[11px] text-chu-phu">
                  <th scope="col" className="text-left font-semibold pb-1.5">Top lựa chọn</th>
                  {bang.cot.map((c, i) => (
                    <th key={c.id} scope="col" className={gop("w-[62px] font-semibold pb-1.5 px-0.5 leading-tight", i > 0 && "text-xanh")}>
                      <span className="line-clamp-2 break-words" title={c.ten}>{c.ten}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bang.dong.map((d, i) => (
                  <tr key={d.lc.id} className="border-t border-vien">
                    <th scope="row" className="text-left font-normal py-2 pr-1">
                      <button type="button" onClick={() => nav(DUONG_DAN.chiTiet(d.lc.id))} className="flex items-start gap-1.5 text-left min-h-11 w-full">
                        <span className="size-5 shrink-0 rounded-full gd-xanh text-white text-[11px] font-bold grid place-items-center mt-0.5">{i + 1}</span>
                        <span className="min-w-0">
                          <b className="block text-[13px] text-muc leading-snug line-clamp-2">{d.lc.nganh}</b>
                          <span className="block text-[11px] text-chu-phu truncate">{d.lc.truong}</span>
                        </span>
                      </button>
                    </th>
                    {d.diem.map((x, j) => {
                      const c = x - d.diem[0];
                      return (
                        <td key={j} className={gop("text-center align-middle", j > 0 && "bg-xanh-nhat/60")}>
                          <b className={gop("block text-[15px]", x >= NGUONG_PHU_HOP ? "text-luc-chu" : "text-muc")}>{x}</b>
                          {j > 0 && <span className={gop("block text-[11px] font-bold", c > 0 ? "text-luc-chu" : c < 0 ? "text-do-chu" : "text-chu-phu")}>{c > 0 ? `▲ +${c}` : c < 0 ? `▼ ${c}` : "="}</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            {chonCon.length === 0 && <p className="text-[12px] text-chu-phu mt-1">Bấm vào một tình huống ở trên để thêm cột so sánh.</p>}
          </The>
        </>
      )}
    </section>
  );
}

function DongTruong({ d, onClick }: { d: DongKetQua; onClick: () => void }) {
  const tone = TONE_TRANG_THAI[d.trangThai];
  return (
    <button type="button" onClick={onClick} className="w-full text-left rounded-the bg-trang border border-vien shadow-the p-3 flex items-start gap-3 active:bg-xanh-nhat">
      <HuyHieuTruong ten={d.lc.truong} tone={d.lc.tone} kichThuoc={42} />
      <span className="flex-1 min-w-0">
        <span className="flex items-start justify-between gap-2">
          <b className="text-[15px] text-muc leading-snug">{d.lc.nganh}</b>
          <Nhan tone={tone} className={tone === "muc" ? "text-chu-phu" : undefined}>{TEN_TRANG_THAI[d.trangThai]}</Nhan>
        </span>
        <span className="block text-[13px] text-chu-phu truncate">{d.lc.truong} · {d.lc.khuVuc}</span>
        <span className="mt-1 flex items-center gap-2 text-[13px] text-chu">
          Điểm phù hợp <TruocSau truoc={d.goc} sau={d.moi} />
          {d.chenh !== 0 && <span className={gop("text-[12px] font-bold", d.chenh > 0 ? "text-luc-chu" : "text-do-chu")}>({d.chenh > 0 ? "+" : ""}{d.chenh})</span>}
        </span>
        <span className="block text-[12px] text-chu-phu mt-0.5 leading-snug">{d.lyDo}</span>
      </span>
      <ChevronRight size={18} className="text-chu-phu shrink-0 self-center" />
    </button>
  );
}

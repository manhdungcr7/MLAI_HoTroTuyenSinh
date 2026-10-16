// Bản tóm tắt để em đưa cho phụ huynh, thầy cô, người tư vấn xem. Dữ liệu không rời máy trừ khi em tự bấm chia sẻ.
import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Copy, Link2, MessageCircleHeart, Printer, Share2, Trash2 } from "lucide-react";
import { DauTrangCoQuayLai, NoiDung } from "@/components/layout/khung";
import { TieuDeMuc } from "@/components/ui/hien-thi";
import { The, Nut } from "@/components/ui/nut-the";
import { DUONG_DAN } from "@/duong-dan";
import { useApp } from "@/state/store";
import { TEN_VAI, lienKetDayDu, maHoa, taoGoiChiaSe } from "@/features/dong-hanh/goi-tin";
import { CongTacLon } from "@/features/tu-hoc/thanh-phan";
import { Nhan } from "@/components/ui/nut-the";
import { chiSoTheoDoi, tomTatChiaSe } from "./tom-tat";
import { ChiSoTheoDoi } from "./chi-so-theo-doi";
import { NhanNguyenVongTag } from "@/components/ui/co-cau";
import { tim } from "@/data/lua-chon-mau";
import { dinhDang } from "@/engine/dinh-dang";
import { diemDayDu } from "@/features/kham-pha/to-hop";
import { demNhan, dungDanhSach } from "@/features/nguyen-vong/tinh-toan";
import type { AppState } from "@/state/store";
import { toAcademicDisplay } from "@/engine/trinh-bay-hoc-thuat";
import { PreferenceSummary, UniversityLabel, MajorLabel, ProgramVariant } from "@/components/ui/academic-display";

/** Thẻ tóm tắt danh sách nguyện vọng: bố cục đối xứng, gọn để chụp màn hình gửi người đồng hành. */
function TheTomTatNguyenVong({ s }: { s: AppState }) {
  const ds = useMemo(() => dungDanhSach(s.nguyenVong, diemDayDu(s), tim), [s]);
  const dem = demNhan(ds);
  if (ds.length === 0) return null;
  return (
    <section aria-label="Tóm tắt danh sách nguyện vọng" className="rounded-the bg-trang border border-vien shadow-the overflow-hidden">
      <div className="px-4 py-3 border-b border-vien">
        <h2 className="text-[16px] font-extrabold text-muc leading-snug">Nguyện vọng{s.hoSo.hoTen.trim() ? ` của ${s.hoSo.hoTen.trim().split(/\s+/).slice(-2).join(" ")}` : " của bạn"}</h2>
        <p className="mt-1 text-[13px] text-chu-phu">{ds.length} lựa chọn đang cân nhắc</p>
      </div>
      <div className="px-3 py-2.5 border-b border-vien"><PreferenceSummary tong={ds.length} dem={dem} className="border-0 bg-transparent p-0 shadow-none" /></div>
      <ol className="divide-y divide-vien px-3">
        {ds.map((d) => (
          <li key={d.id} className="py-3">
            {(() => {
              const model = toAcademicDisplay(d.lc, d.nhan);
              return <details className="group">
                <summary className="list-none cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xanh">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[12px] font-bold text-chu-phu">NV {String(d.viTri + 1).padStart(2, "0")}</span>
                    {d.nhan ? <NhanNguyenVongTag nhan={d.nhan} /> : <span className="text-[12px] text-chu-phu">Chưa so được</span>}
                  </div>
                  {model ? <>
                    <MajorLabel ten={model.majorNameDisplay} />
                    <UniversityLabel tenHienThi={model.universityNameDisplay} daXacMinh={model.universityNameDisplay !== "Tên trường chưa xác minh"} />
                    <ProgramVariant variant={model.programVariant} />
                  </> : <p className="text-[14px] font-semibold text-chu">Lựa chọn không còn trong danh mục</p>}
                  <span className="mt-1 block text-[12px] font-semibold text-xanh">Xem chi tiết</span>
                </summary>
                {model && d.lc && <div className="mt-2 rounded-lg bg-nen p-3 text-[12px] space-y-1.5">
                  <p><span className="text-chu-phu">Tên trường đầy đủ: </span><span className="font-medium text-muc">{model.universityNameOfficial}</span></p>
                  <p><span className="text-chu-phu">Tên ngành trong đề án: </span><span className="font-medium text-muc">{model.majorNameOfficial}</span></p>
                  <p className="text-chu-phu">Nguồn: {model.sourceStatus === "de_an_chinh_thuc" ? "Đề án chính thức của trường" : model.sourceStatus === "da_kiem_chung" ? "Đã kiểm chứng" : "Nguồn dữ liệu đang được rà soát"}.</p>
                  <p className="text-chu-phu">Điểm tham khảo năm {d.lc.namDiem}: {d.lc.diemMin > 0 ? dinhDang(d.lc.diemMin, 1) : "chưa có dữ liệu"}. Nhãn chỉ để cân nhắc, không bảo đảm kết quả xét tuyển.</p>
                </div>}
              </details>;
            })()}
          </li>
        ))}
      </ol>
      <p className="px-4 py-2 text-[12px] text-chu-phu border-t border-vien">Nhãn tham khảo từ điểm chuẩn năm trước, không bảo đảm kết quả xét tuyển. Bấm từng lựa chọn để xem chi tiết.</p>
    </section>
  );
}

export default function ChiaSe() {
  const { s, xoaLoiNhan } = useApp();
  const [tin, setTin] = useState("");
  const [kemTen, setKemTen] = useState(false);
  const [lienKet, setLienKet] = useState("");
  const [moNoiDung, setMoNoiDung] = useState(false);
  const { muc, vanBan } = tomTatChiaSe(s, new Date(), kemTen);
  const coShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  const sao = async () => {
    try { await navigator.clipboard.writeText(vanBan); setTin("Đã sao chép. Dán vào tin nhắn hoặc email là được."); }
    catch { setMoNoiDung(true); setTin("Máy không cho sao chép tự động. Bấm giữ đoạn văn bên dưới để chọn."); }
  };
  const taoLienKet = () => {
    const goi = taoGoiChiaSe(muc, chiSoTheoDoi(s).map((c) => ({ ten: c.ten, giaTri: c.giaTri })), new Date(), kemTen ? s.hoSo.hoTen : undefined);
    setLienKet(lienKetDayDu(DUONG_DAN.dongHanh(maHoa(goi))));
  };
  const saoLienKet = async () => {
    try { await navigator.clipboard.writeText(lienKet); setTin("Đã sao chép liên kết. Gửi qua Zalo hoặc tin nhắn."); }
    catch { setTin("Máy không cho sao chép tự động. Bấm giữ liên kết để chọn."); }
  };
  const chiaSe = async () => {
    try { await navigator.share({ title: "Tóm tắt Nguyện Vọng AI", text: vanBan }); }
    catch (e) { if ((e as Error).name !== "AbortError") setTin("Không mở được chia sẻ. Em thử nút Sao chép nhé."); }
  };

  return (
    <>
      <DauTrangCoQuayLai tieuDe="Chia sẻ với người đồng hành" quayLai={DUONG_DAN.hoSo()} />
      <NoiDung className="space-y-4">
        <TheTomTatNguyenVong s={s} />

        <section aria-label="Chỉ số theo dõi">
          <ChiSoTheoDoi s={s} gon />
        </section>

        <section aria-label="Liên kết cho người đồng hành" className="space-y-2.5 print:hidden">
          <TieuDeMuc>Gửi liên kết</TieuDeMuc>
          <The className="space-y-3">
            <p className="text-[14px] text-chu leading-snug">Người nhận xem tóm tắt và gửi phản hồi, không cần tài khoản.</p>
            {!lienKet && (
              <p className="rounded-the bg-cam-nhat px-3 py-2 text-[13px] text-cam-chu leading-snug">
                <b>Riêng tư:</b> ai có liên kết đều xem được điểm, tỉnh, ngân sách và không thu hồi được. Chỉ gửi người bạn tin cậy.
              </p>
            )}
            <div className="flex items-center justify-between gap-3 min-h-11">
              <span className="text-[14px] text-chu leading-snug">Kèm tên của bạn trong liên kết</span>
              <CongTacLon dang={kemTen} onChange={(v) => { setKemTen(v); setLienKet(""); }} nhan="Kèm tên của bạn trong liên kết" />
            </div>
            <Nut bieuTuong={Link2} onClick={taoLienKet}>Tạo liên kết</Nut>
            {lienKet && (
              <>
                <p className="text-[12px] text-chu-phu">Ngày tạo: {new Date().toLocaleDateString("vi-VN")}</p>
                {lienKet.length > 8000 && (
                  <p className="text-[13px] text-cam-chu rounded-the bg-cam-nhat p-2.5 leading-snug">Liên kết dài, có ứng dụng chat sẽ cắt. Thử nút Gửi qua ứng dụng khác.</p>
                )}
                <p className="break-all rounded-lg bg-nen p-2.5 text-[12px] text-chu-phu select-all max-h-24 overflow-y-auto">{lienKet}</p>
                <Nut kieu="vien" bieuTuong={Copy} onClick={saoLienKet}>Sao chép liên kết</Nut>
              </>
            )}
          </The>
        </section>

        {s.loiNhan.length > 0 && (
          <section aria-label="Lời nhắn đã nhận" className="print:hidden">
            <TieuDeMuc>Lời nhắn đã nhận</TieuDeMuc>
            <div className="space-y-2">
              {s.loiNhan.map((l) => (
                <The key={l.id} className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <MessageCircleHeart size={18} className="text-xanh shrink-0" />
                    <p className="min-w-0 flex-1 truncate text-[14px] font-bold text-chu">{l.tu}</p>
                    <Nhan tone="xanh">{TEN_VAI[l.vai]}</Nhan>
                    <button type="button" aria-label={`Xóa lời nhắn của ${l.tu}`} onClick={() => xoaLoiNhan(l.id)} className="size-11 -mr-2 grid place-items-center rounded-full text-chu-phu active:bg-xanh-nhat"><Trash2 size={18} /></button>
                  </div>
                  <p className="text-[14px] text-chu leading-snug whitespace-pre-line">{l.noiDung}</p>
                </The>
              ))}
            </div>
          </section>
        )}

        <section aria-label="Nội dung bản tóm tắt" className="print-vung">
          <button type="button" onClick={() => setMoNoiDung((x) => !x)} aria-expanded={moNoiDung}
            className="w-full min-h-12 flex items-center justify-between rounded-the bg-trang border border-vien px-4 text-[14px] font-bold text-muc active:bg-xanh-nhat print:hidden">
            Xem nội dung sẽ gửi {moNoiDung ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          <The className={moNoiDung ? "mt-2 space-y-3.5" : "hidden print:block space-y-3.5"}>
            {muc.map((k, i) => (
              <div key={`${k.tieuDe}-${i}`}>
                <h3 className="text-[14px] font-bold text-muc">{k.tieuDe}</h3>
                <ul className="mt-1 space-y-1">
                  {k.dong.map((d, j) => <li key={`${d}-${j}`} className="text-[14px] text-chu leading-snug">{d}</li>)}
                </ul>
              </div>
            ))}
          </The>
        </section>

        <div aria-live="polite" className="min-h-5 text-[13px] text-chu-phu">{tin}</div>
        <div className="space-y-2 print:hidden">
          <Nut kieu="vien" bieuTuong={Copy} onClick={sao}>Sao chép bản tóm tắt</Nut>
          {coShare && <Nut kieu="vien" bieuTuong={Share2} onClick={chiaSe}>Gửi qua ứng dụng khác</Nut>}
          <Nut kieu="nhe" bieuTuong={Printer} onClick={() => window.print()}>In hoặc lưu PDF</Nut>
        </div>
      </NoiDung>
    </>
  );
}

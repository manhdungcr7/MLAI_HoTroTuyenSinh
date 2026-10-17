import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { RotateCcw, Send, Sparkles, X } from "lucide-react";
import { DauTrangCoQuayLai, NoiDung } from "@/components/layout/khung";
import { Nut, gop } from "@/components/ui/nut-the";
import { taiNguon, type NguonTaiSau } from "@/data/lua-chon-that";
import { DUONG_DAN } from "@/duong-dan";
import { useApp } from "@/state/store";
import { layTinTraLoi } from "./cau-tra-loi";
import { phienHienTai } from "./che-do-ai";
import { ChipCheDoAI } from "./thanh-phan/chip-che-do-ai";
import { cauDangCho, guiNen, SU_KIEN_XONG, type ChiTietXong } from "./dang-cho";
import { TOI_DA_TIN, docLichSu, ghiLichSu, goiYBanDau, type TinNhan } from "./hoi-thoai";
import { TinMayChu } from "./thanh-phan/tin-may-chu";
import { DinhDangMarkdown } from "@/components/ui/dinh-dang-markdown";
import { trinhBayPhanHoi } from "./trinh-bay-phan-hoi";
import { LichSuDoanChat } from "./thanh-phan/lich-su-doan-chat";
import { luuDoanChat } from "./kho-doan-chat";

export function NutTuVan({ nguCanh }: { nguCanh: string }) {
  const nav = useNavigate();
  return <Nut kieu="vien" bieuTuong={Sparkles} onClick={() => nav(DUONG_DAN.tuVan(), { state: { nguCanh } })}>Hỏi tư vấn AI</Nut>;
}

const ganDay = () => window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 200;

/** Vị trí cuộn lưu khi bấm sang hồ sơ trường, để quay lại (nút Back) vẫn đúng chỗ đang đọc. Chỉ lưu khi bấm liên kết, dùng một lần. */
const KHOA_CUON = "nvai:tu-van-cuon";
const luuViTriCuon = () => { try { sessionStorage.setItem(KHOA_CUON, String(Math.round(window.scrollY))); } catch { /* chế độ riêng tư: bỏ qua */ } };
const layViTriCuon = (): number | null => { try { const v = sessionStorage.getItem(KHOA_CUON); sessionStorage.removeItem(KHOA_CUON); const n = v === null ? NaN : Number(v); return Number.isFinite(n) && n > 0 ? n : null; } catch { return null; } };

export default function TuVan() {
  const location = useLocation();
  const { s } = useApp();
  const manHinh = (location.state as { nguCanh?: string } | null)?.nguCanh ?? "Tư vấn chung";
  // Yêu cầu còn chạy ở nền (bạn rời màn rồi quay lại): giữ nguyên, câu trả lời sẽ tự hiện. Không còn yêu cầu (tải lại trang)
  // mà tin cuối vẫn là câu hỏi chưa có đáp: bỏ khỏi lịch sử và trả về ô nhập để bạn gửi lại.
  const [khoiDau] = useState(() => { const h = docLichSu(localStorage); const cuoiTin = h[h.length - 1]; const cho = cauDangCho() !== null; return cuoiTin?.vai === "em" && !cho ? { tin: h.slice(0, -1), cau: cuoiTin.chu, cho } : { tin: h, cau: "", cho }; });
  const [cauHoi, setCauHoi] = useState(khoiDau.cau);
  const [tin, setTin] = useState<TinNhan[]>(khoiDau.tin);
  const [dang, setDang] = useState(khoiDau.cho);
  const [lau, setLau] = useState(false);
  const [dungHoSo, setDungHoSo] = useState(true);
  const [nguon, setNguon] = useState<NguonTaiSau | null>(null);
  const cuoi = useRef<HTMLDivElement>(null);
  const dangRef = useRef(khoiDau.cho); // chặn gửi trùng khi bấm đúp (state chưa kịp cập nhật)
  const cuonSau = useRef(true); // có cuộn xuống tin mới không: chỉ khi bạn vừa gửi hoặc đang ở gần cuối
  const lanDau = useRef(true);
  const huyRef = useRef<AbortController | null>(null);
  const viTriCu = useRef<number | null | undefined>(undefined);

  useEffect(() => { let con = true; taiNguon().then((m) => con && setNguon(m)).catch(() => {}); return () => { con = false; }; }, []);
  // Lưu hội thoại sau mỗi thay đổi; "Xóa hết", "Hồ sơ mẫu", "Khôi phục" xóa khóa và phát nvai-lam-lai.
  useEffect(() => { if (!ghiLichSu(localStorage, tin)) window.dispatchEvent(new Event("nvai-luu-loi")); }, [tin]);
  useEffect(() => { const f = () => { setTin([]); setDang(false); dangRef.current = false; }; window.addEventListener("nvai-lam-lai", f); return () => window.removeEventListener("nvai-lam-lai", f); }, []);
  // Câu trả lời đã được ghi vào lịch sử bởi dang-cho.ts (kể cả khi màn này từng bị đóng): chỉ cần đọc lại.
  useEffect(() => {
    const f = (e: Event) => {
      const { cau, tin: moi } = (e as CustomEvent<ChiTietXong>).detail;
      cuonSau.current = ganDay();
      setTin((t) => { const h = docLichSu(localStorage); return h[h.length - 1]?.vai === "mayChu" ? h : [...t, moi].slice(-TOI_DA_TIN); }); setDang(false); dangRef.current = false;
      // Ô nhập chỉ được xóa khi đã có câu trả lời thật; lỗi mạng/hết giờ thì giữ nguyên câu bạn gõ (có nút Thử lại).
      if (!moi.thuLai) setCauHoi((c) => (c.trim() === cau ? "" : c));
    };
    window.addEventListener(SU_KIEN_XONG, f); return () => window.removeEventListener(SU_KIEN_XONG, f);
  }, []);
  useEffect(() => {
    if (lanDau.current) {
      lanDau.current = false;
      if (viTriCu.current === undefined) viTriCu.current = layViTriCuon();
      const cu = viTriCu.current;
      if (cu !== null && tin.length) {
        // Quay lại từ hồ sơ trường: App cuộn về đầu trang sau khi dựng, nên đặt lại vị trí sau đó.
        const dat = () => window.scrollTo(0, cu);
        const h1 = setTimeout(dat, 60), h2 = setTimeout(dat, 300);
        return () => { clearTimeout(h1); clearTimeout(h2); };
      }
      if (tin.length) cuoi.current?.scrollIntoView({ block: "end", behavior: "auto" });
      return;
    }
    if (cuonSau.current) cuoi.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [tin.length, dang]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!dang) { setLau(false); return; }
    const h = setTimeout(() => setLau(true), 8000);
    return () => clearTimeout(h);
  }, [dang]);

  /** `thay`: vị trí tin của bạn cần hỏi lại (Thử lại): bỏ cặp hỏi–đáp cũ rồi gửi lại đúng câu đó. */
  const gui = async (q: string, thay?: number) => {
    const cau = q.trim();
    if (cau.length < 2 || dangRef.current) return;
    dangRef.current = true; setDang(true);
    const ac = new AbortController(); huyRef.current = ac;
    const truoc = thay === undefined ? tin : tin.slice(0, thay);
    cuonSau.current = true;
    setTin([...truoc, { vai: "em", chu: cau } as TinNhan].slice(-TOI_DA_TIN));
    if (thay === undefined) setCauHoi(""); // gửi xong là xóa ô nhập ngay, bạn gõ tiếp được trong lúc chờ trả lời

    const onChunk = (chuoiStream: string) => {
      setTin((cu) => {
        const last = cu[cu.length - 1];
        if (last && last.vai === "mayChu") {
          return [...cu.slice(0, -1), { ...last, chu: chuoiStream }];
        }
        return [...cu, { vai: "mayChu", chu: chuoiStream, cheDo: "ai" } as TinNhan].slice(-TOI_DA_TIN);
      });
      cuonSau.current = true;
    };

    // Chạy ở mức module: rời màn giữa chừng vẫn nhận và ghi được câu trả lời.
    try {
      await guiNen(
        localStorage,
        cau,
        truoc,
        (chunkCb) => layTinTraLoi({ cau, truoc, s, nguon, dungHoSo, manHinh, phien: phienHienTai(localStorage), onChunk: chunkCb, signal: ac.signal }),
        onChunk
      );
    } finally {
      setDang(false);
      dangRef.current = false;
    }
  };

  const goiY = goiYBanDau({ soNguyenVong: s.nguyenVong.length, nganhQuanTam: s.hoSo.nganhQuanTam });
  const viTriCuoi = tin.length - 1;

  useEffect(() => {
    const st = location.state as { cauHoiTuDong?: string; guiNgay?: number } | null;
    // guiNgay là mã duy nhất của lần bấm: gửi cả khi chat đã có tin, nhưng tải lại trang (cùng mã) thì không gửi lại.
    const daGui = (() => { try { return sessionStorage.getItem("nvai:da-gui-tu-dong") === String(st?.guiNgay); } catch { return false; } })();
    if (st?.cauHoiTuDong && !dangRef.current && (tin.length === 0 || (st.guiNgay && !daGui))) {
      if (st.guiNgay) { try { sessionStorage.setItem("nvai:da-gui-tu-dong", String(st.guiNgay)); } catch { /* bỏ qua */ } }
      if (!daGui || tin.length === 0) gui(st.cauHoiTuDong);
    }
  }, []);

  const cuoiMay = viTriCuoi >= 0 && tin[viTriCuoi].vai === "mayChu" ? tin[viTriCuoi] : null;
  const chipTiep = [
    ...(cuoiMay?.viecTiep ? [{ nhan: "Hỏi thêm về việc này", cau: `Giải thích giúp mình: ${cuoiMay.viecTiep}` }] : []),
    ...((cuoiMay?.nguon?.length ?? 0) > 0 && !cuoiMay?.hoiLai ? [{ nhan: "Học phí thế nào?", cau: "Học phí của ngành này thế nào?" }, { nhan: "Điểm chuẩn 3 năm", cau: "So sánh điểm chuẩn 3 năm gần đây của các ngành này" }] : []),
  ];

  return (
    <>
      <DauTrangCoQuayLai tieuDe="Tư vấn cùng AI" phai={<span className="sr-only">{manHinh}</span>} />
      <NoiDung className="pb-52">
        <div className="flex items-center justify-between rounded-xl bg-xanh-nhat px-3.5 py-2.5 border border-xanh/20">
          <div className="flex items-center gap-2 min-w-0">
            <span className="size-7 rounded-lg bg-trang text-xanh grid place-items-center shrink-0 shadow-xs">
              <Sparkles size={16} />
            </span>
            <div className="min-w-0">
              <span className="text-[13.5px] font-bold text-muc">Trợ lý tuyển sinh AI</span>
            </div>
          </div>
          <label className="flex items-center gap-1.5 min-h-11 text-[12.5px] font-semibold text-chu cursor-pointer shrink-0 ml-2">
            <input type="checkbox" checked={dungHoSo} onChange={(e) => setDungHoSo(e.target.checked)} className="size-5 accent-[var(--color-xanh)]" />
            <span>Kèm hồ sơ của bạn</span>
          </label>
        </div>

        <div className="flex items-center justify-between gap-2">
          <ChipCheDoAI />
        </div>

        {tin.length === 0 && (
          <div className="my-6 rounded-2xl bg-white border border-vien p-4 shadow-xs text-center space-y-3">
            <div className="size-12 rounded-2xl bg-gradient-to-br from-xanh-nhat to-xanh/20 text-xanh mx-auto grid place-items-center shadow-xs">
              <Sparkles size={24} />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-muc">Trợ lý tuyển sinh AI</h3>
              <p className="text-[13px] text-chu-phu mt-1 leading-relaxed">
                Hỏi về điểm chuẩn, so sánh trường và ngành, hoặc nhờ mình xem danh sách nguyện vọng của em.
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <LichSuDoanChat tin={tin} dang={dang} onMo={(t) => { setTin(t); setCauHoi(""); }} />
          {tin.length > 0 && <button type="button" disabled={dang} onClick={() => { luuDoanChat(localStorage, tin); setTin([]); setCauHoi(""); }} className="inline-flex items-center gap-1.5 min-h-11 px-2 text-[13px] font-bold text-xanh disabled:opacity-50"><RotateCcw size={15} />Cuộc trò chuyện mới</button>}
        </div>

        <section aria-label="Cuộc trò chuyện" aria-live="polite" className="space-y-3.5" onClickCapture={(e) => { if ((e.target as HTMLElement).closest("a")) luuViTriCuon(); }}>
          {tin.map((t, i) => (
            <div key={i} className={gop("flex", t.vai === "em" ? "justify-end" : "justify-start")}>
              <div className={gop("rounded-2xl px-3.5 py-2.5 text-[14px] leading-snug break-words shadow-xs min-w-0", t.vai === "em" ? "max-w-[88%] gd-xanh text-white font-medium" : "max-w-[96%] bg-trang border border-vien text-chu")}>
                {t.vai === "em" ? (
                  <p className="whitespace-pre-line">{t.chu}</p>
                ) : (
                  <>
                    <DinhDangMarkdown noiDung={trinhBayPhanHoi(t.chu)} />
                    <TinMayChu t={t} laCuoi={i === viTriCuoi} dang={dang} cauTruoc={tin[i - 1]?.vai === "em" ? tin[i - 1].chu : undefined}
                      onGui={(c) => gui(c)} onThuLai={() => gui(tin[i - 1].chu, i - 1)} />
                  </>
                )}
              </div>
            </div>
          ))}

          {dang && (
            <div className="flex justify-start" role="status">
              <div className="flex items-center gap-2 rounded-2xl border border-vien bg-trang px-3.5 py-1 text-[13px] text-chu-phu">
                <span className="inline-flex gap-1 align-middle" aria-hidden><span className="size-1.5 animate-pulse rounded-full bg-xanh" /><span className="size-1.5 animate-pulse rounded-full bg-xanh [animation-delay:200ms]" /><span className="size-1.5 animate-pulse rounded-full bg-xanh [animation-delay:400ms]" /></span>
                <span>{lau ? "AI trả lời hơi lâu, đợi thêm hoặc dừng" : "Đang chuẩn bị câu trả lời..."}</span>
                <button type="button" onClick={() => { huyRef.current?.abort(); setDang(false); dangRef.current = false; }} className="min-h-11 px-2 text-[13px] font-bold text-xanh cursor-pointer">Dừng</button>
              </div>
            </div>
          )}
          <div ref={cuoi} className="scroll-mb-48" />
        </section>

        {/* Thanh nhập câu hỏi và câu hỏi gợi ý: Cố định ngay trên thanh 5 tab điều hướng với khoảng cách thoáng */}
        <div className="fixed bottom-[var(--cao-nav)] inset-x-0 mx-auto max-w-[430px] z-30 bg-trang border-t border-vien px-3 py-2 shadow-sm">
          {/* Câu hỏi đề xuất hỏi nhanh đặt ngay trên thanh nhập */}
          {tin.length === 0 && (
            <div className="mb-2">
              <div className="flex items-center justify-between px-1 mb-1.5">
                <span className="text-[12px] font-bold text-chu-phu flex items-center gap-1">
                  <Sparkles size={13} className="text-xanh" /> Gợi ý hỏi nhanh:
                </span>
              </div>
              <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 snap-x [scrollbar-width:none]">
                {goiY.map((x) => (
                  <button
                    key={x}
                    type="button"
                    disabled={dang}
                    onClick={() => gui(x)}
                    className="snap-start shrink-0 min-h-11 max-w-[80vw] rounded-full border border-vien bg-white px-3 text-[12.5px] font-medium text-chu text-left leading-tight active:bg-xanh-nhat disabled:opacity-50 hover:border-xanh/40 cursor-pointer shadow-2xs"
                  >
                    {x}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!dang && chipTiep.length > 0 && (
            <div className="-mx-1 mb-2 flex gap-1.5 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none]" role="group" aria-label="Gợi ý hỏi tiếp">
              {chipTiep.map((c) => (
                <button key={c.nhan} type="button" onClick={() => gui(c.cau)} className="min-h-11 shrink-0 rounded-full border border-vien bg-white px-3 text-[12.5px] font-medium text-chu whitespace-nowrap active:bg-xanh-nhat shadow-2xs cursor-pointer">{c.nhan}</button>
              ))}
            </div>
          )}

          <label htmlFor="tu-van-cau-hoi" className="sr-only">Câu hỏi của bạn</label>
          <div className="flex items-center gap-2">
            <div className="relative min-w-0 flex-1">
            <input
              id="tu-van-cau-hoi"
              type="text"
              value={cauHoi}
              onChange={(e) => setCauHoi(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !dang && cauHoi.trim().length >= 2) {
                  e.preventDefault();
                  gui(cauHoi);
                }
              }}
              maxLength={1000}
              placeholder={tin.length ? "Hỏi tiếp (ví dụ: Còn ngành kia thì sao?)" : "Ví dụ: Điểm chuẩn các năm của Khoa học máy tính?"}
              className="h-11 w-full min-w-0 rounded-xl border border-vien bg-trang pl-3.5 pr-10 text-[14.5px] text-chu placeholder:text-chu-phu focus:border-xanh outline-none transition-colors"
            />
            {cauHoi && (
              <button type="button" aria-label="Xóa câu đang gõ" onClick={() => { setCauHoi(""); document.getElementById("tu-van-cau-hoi")?.focus(); }}
                className="absolute right-0 top-0 grid size-11 place-items-center rounded-xl text-chu-phu active:bg-xanh-nhat cursor-pointer"><X size={16} /></button>
            )}
            </div>
            <Nut
              rong={false}
              bieuTuong={Send}
              className="!h-11 !min-h-11 shrink-0 px-4 !rounded-xl cursor-pointer"
              disabled={dang || cauHoi.trim().length < 2}
              onClick={() => gui(cauHoi)}
            >
              Gửi
            </Nut>
          </div>
        </div>
      </NoiDung>
    </>
  );
}

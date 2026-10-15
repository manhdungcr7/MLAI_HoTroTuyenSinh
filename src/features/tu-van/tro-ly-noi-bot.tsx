import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Bot, CalendarCheck, Check, Maximize2, RotateCcw, Send, X,
} from "lucide-react";
import { gop } from "@/components/ui/nut-the";
import { LUA_CHON_MAU } from "@/data/lua-chon-mau";
import { taiNguon, type NguonTaiSau } from "@/data/lua-chon-that";
import { DUONG_DAN } from "@/duong-dan";
import type { TraLoiTuVan, YeuCauTuVan } from "@/engine/tu-van";
import { GIOI_HAN } from "@/engine/tu-van";
import { phanTichMoNeo, tomTatMoNeoChoAI } from "@/features/nguyen-vong/mo-neo";
import { useApp, type AppState } from "@/state/store";
import { cauDangCho, guiNen, SU_KIEN_XONG, type ChiTietXong } from "./dang-cho";
import { TOI_DA_TIN, docLichSu, ghiLichSu, goiYBanDau, nganhLuotTruoc, taoNguCanh, type TinNhan } from "./hoi-thoai";
import { chonDuLieuKemTheo, tomTatHoSo, traLoiTuDong } from "./lay-du-lieu";
import { DinhDangMarkdown } from "@/components/ui/dinh-dang-markdown";

function nguCanhVoiNV1(manHinh: string, truoc: TinNhan[], s: AppState): string {
  const nv1 = tomTatMoNeoChoAI(phanTichMoNeo(s));
  if (!nv1) return taoNguCanh(manHinh, truoc);
  return `${nv1}\n${taoNguCanh(manHinh, truoc, Math.max(60, GIOI_HAN.nguCanh - nv1.length - 1))}`.slice(0, GIOI_HAN.nguCanh);
}

const CHO_TOI_DA_MS = 25_000;
type LoiAI = "chua-cau-hinh" | "mang";

async function hoiAI(y: YeuCauTuVan): Promise<{ kq: TraLoiTuVan | null; viecTiep?: string; loi?: LoiAI }> {
  try {
    const r = await fetch("/api/tu-van", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify(y), signal: AbortSignal.timeout(CHO_TOI_DA_MS),
    });
    const d = (await r.json().catch(() => ({}))) as Partial<TraLoiTuVan> & { goiY?: { viecTiep?: string } };
    if (!r.ok) return { kq: null, viecTiep: typeof d.goiY?.viecTiep === "string" ? d.goiY.viecTiep : undefined, loi: r.status === 503 ? "chua-cau-hinh" : "mang" };
    const ds = (x: unknown) => (Array.isArray(x) ? x.filter((t): t is string => typeof t === "string") : []);
    return typeof d.traLoi === "string" && d.traLoi
      ? { kq: { traLoi: d.traLoi, nguon: ds(d.nguon), tang: d.tang, congDong: ds(d.congDong), viecTiep: typeof d.viecTiep === "string" ? d.viecTiep : undefined } }
      : { kq: null, loi: "mang" };
  } catch { return { kq: null, loi: "mang" }; }
}

/** Khung chat mini nổi ở góc màn hình giống phong cách các website thương mại */
function KhungChatMini({ dong }: { dong: () => void }) {
  const { pathname } = useLocation();
  const nav = useNavigate();
  const { s, themNguyenVong } = useApp();

  const manHinh = pathname.startsWith("/kham-pha/")
    ? "Chi tiết ngành học"
    : pathname.startsWith("/nguyen-vong")
      ? "Danh sách nguyện vọng"
      : pathname.startsWith("/ke-hoach")
        ? "Kế hoạch học tập"
        : pathname.startsWith("/ho-so")
          ? "Hồ sơ tuyển sinh"
          : "Tư vấn tuyển sinh";

  const [khoiDau] = useState(() => {
    const h = docLichSu(localStorage);
    const cuoiTin = h[h.length - 1];
    const cho = cauDangCho() !== null;
    return cuoiTin?.vai === "em" && !cho ? { tin: h.slice(0, -1), cau: cuoiTin.chu, cho } : { tin: h, cau: "", cho };
  });

  const [cauHoi, setCauHoi] = useState(khoiDau.cau);
  const [tin, setTin] = useState<TinNhan[]>(khoiDau.tin);
  const [dang, setDang] = useState(khoiDau.cho);
  const [lau, setLau] = useState(false);
  const [dungHoSo] = useState(true);
  const [nguon, setNguon] = useState<NguonTaiSau | null>(null);

  const cuoi = useRef<HTMLDivElement>(null);
  const dangRef = useRef(khoiDau.cho);

  useEffect(() => {
    let con = true;
    taiNguon().then((m) => con && setNguon(m)).catch(() => {});
    return () => { con = false; };
  }, []);

  useEffect(() => {
    if (!ghiLichSu(localStorage, tin)) window.dispatchEvent(new Event("nvai-luu-loi"));
  }, [tin]);

  useEffect(() => {
    const f = () => { setTin([]); setDang(false); dangRef.current = false; };
    window.addEventListener("nvai-lam-lai", f);
    return () => window.removeEventListener("nvai-lam-lai", f);
  }, []);

  useEffect(() => {
    const f = (e: Event) => {
      const { cau, tin: moi } = (e as CustomEvent<ChiTietXong>).detail;
      setTin((t) => {
        const h = docLichSu(localStorage);
        return h[h.length - 1]?.vai === "mayChu" ? h : [...t, moi].slice(-TOI_DA_TIN);
      });
      setDang(false);
      dangRef.current = false;
      if (!moi.thuLai) setCauHoi((c) => (c.trim() === cau ? "" : c));
    };
    window.addEventListener(SU_KIEN_XONG, f);
    return () => window.removeEventListener(SU_KIEN_XONG, f);
  }, []);

  useEffect(() => {
    if (cuoi.current) {
      cuoi.current.scrollIntoView({ block: "end", behavior: "smooth" });
    }
  }, [tin.length, dang]);

  useEffect(() => {
    if (!dang) { setLau(false); return; }
    const h = setTimeout(() => setLau(true), 8000);
    return () => clearTimeout(h);
  }, [dang]);

  const dungYeuCau = (q: string, truoc: TinNhan[]): YeuCauTuVan => ({
    cauHoi: q,
    nguCanh: nguCanhVoiNV1(manHinh, truoc, s),
    hoSo: dungHoSo ? tomTatHoSo(s) : null,
    duLieu: chonDuLieuKemTheo(q, s, nguon, 8, nganhLuotTruoc(truoc)),
  });

  const gui = async (q: string, thay?: number) => {
    const cau = q.trim();
    if (cau.length < 3 || dangRef.current) return;
    dangRef.current = true;
    setDang(true);
    const truoc = thay === undefined ? tin : tin.slice(0, thay);
    setTin([...truoc, { vai: "em", chu: cau } as TinNhan].slice(-TOI_DA_TIN));
    const y = dungYeuCau(cau, truoc);
    const idDuLieu = y.duLieu.map((d) => d.id);

    await guiNen(localStorage, cau, truoc, async () => {
      const { kq: ai, viecTiep, loi } = await hoiAI(y);
      if (ai) return { vai: "mayChu", chu: ai.traLoi, nguon: ai.nguon, cheDo: "ai", tang: ai.tang, congDong: ai.congDong, viecTiep: ai.viecTiep, idDuLieu };
      const td = traLoiTuDong(cau, s, nguon, nganhLuotTruoc(truoc));
      return { vai: "mayChu", chu: td.traLoi, nguon: td.nguon, cheDo: "tuDong", viecTiep, idDuLieu, ...(loi === "mang" ? { thuLai: true } : {}) };
    });
  };

  const goiY = goiYBanDau({ soNguyenVong: s.nguyenVong.length, nganhQuanTam: s.hoSo.nganhQuanTam });
  const viTriCuoi = tin.length - 1;

  return (
    <div className="flex flex-col h-full bg-white text-chu">
      {/* Tiêu đề xanh đậm chuẩn phong cách chatbot */}
      <header className="px-3.5 py-3 gd-xanh text-white flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="size-9 rounded-full bg-white text-xanh grid place-items-center shrink-0 shadow-xs">
            <Bot size={20} />
          </span>
          <div className="min-w-0">
            <h3 className="text-[14px] font-bold text-white leading-tight truncate">Chatbot AI Tuyển sinh</h3>
            <span className="text-[11px] text-white/90 font-medium flex items-center gap-1.5 mt-0.5">
              <span className="size-2 rounded-full bg-emerald-400 inline-block animate-pulse" /> Đang hoạt động
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => { dong(); nav(DUONG_DAN.tuVan(), { state: { nguCanh: manHinh } }); }}
            title="Mở toàn trang"
            aria-label="Mở toàn trang"
            className="size-8 grid place-items-center rounded-lg hover:bg-white/20 text-white cursor-pointer transition-colors"
          >
            <Maximize2 size={15} />
          </button>
          <button
            type="button"
            onClick={dong}
            title="Đóng"
            aria-label="Đóng"
            className="size-8 grid place-items-center rounded-lg hover:bg-white/20 text-white cursor-pointer transition-colors"
          >
            <X size={17} />
          </button>
        </div>
      </header>

      {/* Nội dung danh sách tin nhắn */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0 bg-slate-50/70 text-[13px]">
        {tin.length === 0 && (
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <span className="size-7 rounded-full gd-xanh text-white grid place-items-center shrink-0 mt-0.5 shadow-2xs">
                <Bot size={15} />
              </span>
              <div className="bg-white border border-vien rounded-2xl rounded-tl-xs p-3 text-[13px] text-chu shadow-2xs leading-relaxed max-w-[88%]">
                <p>Xin chào! 👋</p>
                <p className="mt-1">Mình là Chatbot AI tư vấn tuyển sinh. Mình có thể giúp bạn tra cứu điểm chuẩn các năm gần đây, phân tích nguyện vọng và hỗ trợ kế hoạch học tập.</p>
              </div>
            </div>

            <div className="pl-9 space-y-1.5">
              <p className="text-[11px] font-bold text-chu-phu uppercase tracking-wider">Câu hỏi thường gặp:</p>
              <div className="flex flex-wrap gap-1.5">
                {goiY.map((x) => (
                  <button
                    key={x}
                    type="button"
                    disabled={dang}
                    onClick={() => gui(x)}
                    className="text-left rounded-xl border border-vien bg-white px-2.5 py-1.5 text-[11.5px] font-medium text-chu hover:border-xanh/50 hover:bg-xanh-nhat/40 active:bg-xanh-nhat transition-colors shadow-2xs cursor-pointer"
                  >
                    {x}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {tin.length > 0 && (
          <div className="flex justify-end">
            <button
              type="button"
              disabled={dang}
              onClick={() => { setTin([]); setCauHoi(""); }}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-xanh hover:underline disabled:opacity-50 cursor-pointer"
            >
              <RotateCcw size={11} /> Đoạn chat mới
            </button>
          </div>
        )}

        <section aria-label="Cuộc trò chuyện" aria-live="polite" className="space-y-3">
          {tin.map((t, i) => (
            <div key={i} className={gop("flex items-start gap-2", t.vai === "em" ? "justify-end" : "justify-start")}>
              {t.vai === "mayChu" && (
                <span className="size-7 rounded-full gd-xanh text-white grid place-items-center shrink-0 mt-0.5 shadow-2xs">
                  <Bot size={15} />
                </span>
              )}
              <div className={gop("rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed break-words shadow-2xs", t.vai === "em" ? "max-w-[85%] rounded-tr-xs gd-xanh text-white font-medium" : "max-w-[85%] rounded-tl-xs bg-white border border-vien text-chu")}>
                {t.vai === "em" ? (
                  <p className="whitespace-pre-line">{t.chu}</p>
                ) : (
                  <DinhDangMarkdown noiDung={t.chu} />
                )}
                {t.vai === "mayChu" && (
                  <>
                    {t.nguon && t.nguon.length > 0 && (
                      <div className="mt-2.5 space-y-1.5 border-t border-vien/60 pt-2" role="group" aria-label="Nguồn số liệu và hành động">
                        <p className="text-[11.5px] font-bold text-chu-phu">Các ngành liên quan:</p>
                        <ul className="space-y-1.5">
                          {t.nguon.map((id) => {
                            const l = LUA_CHON_MAU.find((x) => x.id === id);
                            if (!l) return null;
                            const daCo = s.nguyenVong.includes(id);
                            return (
                              <li key={id} className="rounded-xl bg-slate-50 border border-vien p-2 flex flex-col gap-1 min-[340px]:flex-row min-[340px]:items-center justify-between">
                                <Link
                                  to={DUONG_DAN.chiTiet(id)}
                                  onClick={dong}
                                  className="min-w-0 flex-1 text-[12px] font-bold text-xanh leading-tight hover:underline truncate"
                                >
                                  {l.truong} · {l.nganh}
                                </Link>
                                <button
                                  type="button"
                                  disabled={daCo}
                                  onClick={() => { if (!daCo) themNguyenVong(id); }}
                                  className={gop("h-7 shrink-0 px-2.5 rounded-lg text-[11px] font-bold inline-flex items-center justify-center gap-1 transition-colors", daCo ? "bg-luc-nhat text-luc-chu" : "bg-xanh text-white active:brightness-90 cursor-pointer")}
                                >
                                  {daCo ? <><Check size={12} />Đã thêm</> : "+ Thêm vào Nguyện Vọng"}
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                    {/kế hoạch học tập|lịch học|ôn thi tuần/i.test(t.chu) && (
                      <div className="mt-2 p-2 rounded-xl bg-gradient-to-r from-xanh-nhat to-white border border-xanh/30 flex items-center justify-between gap-1.5">
                        <span className="text-[11.5px] font-bold text-muc">Lịch học tuần AI</span>
                        <Link
                          to={DUONG_DAN.tuan()}
                          onClick={dong}
                          className="shrink-0 h-6.5 px-2.5 rounded-md bg-xanh text-white text-[11px] font-bold inline-flex items-center gap-1 hover:bg-xanh/90 transition-colors"
                        >
                          <CalendarCheck size={12} /> Vào xem
                        </Link>
                      </div>
                    )}
                    {t.viecTiep && <p className="mt-1 text-[11.5px] text-muc">Gợi ý: <span className="text-chu">{t.viecTiep}</span></p>}
                    {t.thuLai && i === viTriCuoi && !dang && tin[i - 1]?.vai === "em" && (
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <span className="text-[11px] text-chu-phu">Chưa gửi được.</span>
                        <button type="button" onClick={() => gui(tin[i - 1].chu, i - 1)} className="inline-flex items-center gap-0.5 text-[11.5px] font-bold text-xanh"><RotateCcw size={11} />Thử lại</button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}

          {dang && (
            <div className="flex items-start gap-2" role="status">
              <span className="size-7 rounded-full gd-xanh text-white grid place-items-center shrink-0 mt-0.5 shadow-2xs">
                <Bot size={15} />
              </span>
              <div className="rounded-2xl rounded-tl-xs border border-vien bg-white px-3 py-2 text-[12px] text-chu-phu shadow-2xs">
                <span className="mr-1.5 inline-flex gap-1 align-middle" aria-hidden>
                  <span className="size-1.5 animate-pulse rounded-full bg-xanh" />
                  <span className="size-1.5 animate-pulse rounded-full bg-xanh [animation-delay:200ms]" />
                  <span className="size-1.5 animate-pulse rounded-full bg-xanh [animation-delay:400ms]" />
                </span>
                {lau ? "Đang đối chiếu dữ liệu…" : "Đang soạn câu trả lời…"}
              </div>
            </div>
          )}
          <div ref={cuoi} />
        </section>
      </div>

      {/* Chân khung chat: Ô nhập tin nhắn bo tròn như các chatbot thương mại */}
      <footer className="border-t border-vien bg-white p-2.5 shrink-0">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={cauHoi}
            onChange={(e) => setCauHoi(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !dang && cauHoi.trim().length >= 3) {
                e.preventDefault();
                gui(cauHoi);
              }
            }}
            readOnly={dang}
            maxLength={1000}
            placeholder="Nhập tin nhắn..."
            className="h-10 min-w-0 flex-1 rounded-full border border-vien bg-slate-100 px-4 text-[13px] text-chu placeholder:text-chu-phu focus:border-xanh focus:bg-white outline-none transition-all"
          />
          <button
            type="button"
            disabled={dang || cauHoi.trim().length < 3}
            onClick={() => gui(cauHoi)}
            aria-label="Gửi tin nhắn"
            className="size-10 rounded-full gd-xanh text-white grid place-items-center shrink-0 hover:brightness-110 active:scale-95 disabled:opacity-40 transition-all cursor-pointer shadow-xs"
          >
            <Send size={16} />
          </button>
        </div>
      </footer>
    </div>
  );
}

/** Nút tròn Chatbot AI nổi ở góc màn hình. Bấm vào hiển thị khung chat nhỏ gọn giống các trang web hiện đại. */
export function NutTroLyAI({ khongThanh = false }: { khongThanh?: boolean }) {
  const { pathname } = useLocation();
  const [mo, setMo] = useState(false);
  const vungRef = useRef<HTMLDivElement>(null);

  // Đóng khi nhấn Escape hoặc click ra ngoài khung chat
  useEffect(() => {
    if (!mo) return;
    const xuLyNhanNgoai = (e: MouseEvent) => {
      if (vungRef.current && !vungRef.current.contains(e.target as Node)) {
        setMo(false);
      }
    };
    const xuLyPhim = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMo(false);
    };
    document.addEventListener("mousedown", xuLyNhanNgoai);
    window.addEventListener("keydown", xuLyPhim);
    return () => {
      document.removeEventListener("mousedown", xuLyNhanNgoai);
      window.removeEventListener("keydown", xuLyPhim);
    };
  }, [mo]);

  // Không hiển thị trên màn tư vấn chính hoặc màn chào mừng ban đầu
  if (pathname === "/tu-van" || pathname.startsWith("/tu-van") || pathname.startsWith("/chao")) {
    return null;
  }

  return (
    <div
      ref={vungRef}
      className={gop(
        "fixed z-50 flex flex-col items-end pointer-events-none",
        khongThanh ? "bottom-5 right-4 sm:bottom-6 sm:right-6" : "bottom-20 right-4 sm:bottom-6 sm:right-6",
      )}
    >
      {/* Khung chat nhỏ gọn nổi phía trên nút tròn */}
      {mo && (
        <div
          role="dialog"
          aria-label="Chatbot AI Tuyển sinh"
          className="pointer-events-auto mb-3 w-[360px] max-w-[calc(100vw-32px)] h-[520px] max-h-[calc(100dvh-120px)] bg-white rounded-2xl shadow-2xl border border-vien overflow-hidden flex flex-col hien-len"
        >
          <KhungChatMini dong={() => setMo(false)} />
        </div>
      )}

      {/* Nút tròn nổi ở góc màn hình: Icon Bot kèm huy hiệu đỏ báo tin nhắn */}
      <button
        type="button"
        onClick={() => setMo((m) => !m)}
        aria-label={mo ? "Đóng Chatbot AI" : "Mở Chatbot AI"}
        title={mo ? "Đóng chat" : "Chatbot AI Tuyển sinh"}
        className="pointer-events-auto size-14 rounded-full gd-xanh text-white shadow-xl shadow-xanh/35 flex items-center justify-center hover:scale-105 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xanh cursor-pointer border-2 border-white relative group"
      >
        {mo ? (
          <X size={22} className="text-white" />
        ) : (
          <>
            <Bot size={26} className="text-white" />
            <span className="absolute -top-0.5 -right-0.5 flex size-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full size-4 bg-red-500 text-[9.5px] font-bold text-white items-center justify-center border border-white">
                1
              </span>
            </span>
          </>
        )}
      </button>
    </div>
  );
}

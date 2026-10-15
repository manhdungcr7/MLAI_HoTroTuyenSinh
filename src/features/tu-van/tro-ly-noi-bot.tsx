import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  CalendarCheck, Check, Maximize2, RotateCcw, Send, Sparkles, X,
} from "lucide-react";
import { Nut, gop } from "@/components/ui/nut-the";
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

/** Khung chat mini gọn gàng chuẩn giao diện website */
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
    <div className="flex flex-col h-full bg-trang text-chu">
      {/* Tiêu đề thanh trên của hộp trợ lý nhỏ */}
      <header className="px-3 py-2 border-b border-vien bg-nen flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="size-7 rounded-lg gd-xanh text-white grid place-items-center shrink-0 shadow-xs">
            <Sparkles size={14} />
          </span>
          <div className="min-w-0">
            <h3 className="text-[13px] font-bold text-muc leading-tight truncate">Trợ lý Tuyển sinh AI</h3>
            <span className="text-[10.5px] text-luc font-medium flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-luc inline-block" /> Sẵn sàng hỗ trợ
            </span>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => { dong(); nav(DUONG_DAN.tuVan(), { state: { nguCanh: manHinh } }); }}
            title="Mở toàn trang"
            aria-label="Mở toàn trang"
            className="size-7 grid place-items-center rounded-md hover:bg-vien/60 text-chu-phu cursor-pointer transition-colors"
          >
            <Maximize2 size={13} />
          </button>
          <button
            type="button"
            onClick={dong}
            title="Đóng khung chat"
            aria-label="Đóng khung chat"
            className="size-7 grid place-items-center rounded-md hover:bg-vien/60 text-chu cursor-pointer transition-colors"
          >
            <X size={15} />
          </button>
        </div>
      </header>

      {/* Nội dung danh sách tin nhắn */}
      <div className="flex-1 overflow-y-auto px-3 py-2.5 space-y-2.5 min-h-0 text-[13px]">
        {tin.length === 0 && (
          <div className="my-3 rounded-xl bg-nen border border-vien p-3 text-center space-y-1.5">
            <span className="size-8 rounded-lg bg-xanh-nhat text-xanh mx-auto grid place-items-center">
              <Sparkles size={16} />
            </span>
            <p className="text-[12.5px] font-bold text-muc">Bạn cần trợ giúp gì về tuyển sinh?</p>
            <p className="text-[11.5px] text-chu-phu leading-relaxed">
              Hỏi điểm chuẩn các năm gần đây, cơ cấu nguyện vọng hoặc ngành vừa sức với điểm của bạn.
            </p>
          </div>
        )}

        {tin.length > 0 && (
          <div className="flex justify-end">
            <button
              type="button"
              disabled={dang}
              onClick={() => { setTin([]); setCauHoi(""); }}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-xanh disabled:opacity-50"
            >
              <RotateCcw size={11} /> Đoạn chat mới
            </button>
          </div>
        )}

        <section aria-label="Cuộc trò chuyện" aria-live="polite" className="space-y-2.5">
          {tin.map((t, i) => (
            <div key={i} className={gop("flex", t.vai === "em" ? "justify-end" : "justify-start")}>
              <div className={gop("rounded-2xl px-3 py-2 text-[12.5px] leading-snug break-words shadow-xs", t.vai === "em" ? "max-w-[88%] gd-xanh text-white font-medium" : "max-w-[95%] bg-nen border border-vien text-chu")}>
                {t.vai === "em" ? (
                  <p className="whitespace-pre-line">{t.chu}</p>
                ) : (
                  <DinhDangMarkdown noiDung={t.chu} />
                )}
                {t.vai === "mayChu" && (
                  <>
                    {t.nguon && t.nguon.length > 0 && (
                      <div className="mt-2 space-y-1" role="group" aria-label="Nguồn số liệu và hành động">
                        <p className="text-[11px] font-bold text-chu-phu">Các ngành liên quan:</p>
                        <ul className="space-y-1">
                          {t.nguon.map((id) => {
                            const l = LUA_CHON_MAU.find((x) => x.id === id);
                            if (!l) return null;
                            const daCo = s.nguyenVong.includes(id);
                            return (
                              <li key={id} className="rounded-lg bg-trang border border-vien p-1.5 flex items-center justify-between gap-1.5">
                                <Link
                                  to={DUONG_DAN.chiTiet(id)}
                                  onClick={dong}
                                  className="min-w-0 flex-1 text-[11.5px] font-bold text-xanh leading-tight hover:underline truncate"
                                >
                                  {l.truong} · {l.nganh}
                                </Link>
                                <button
                                  type="button"
                                  disabled={daCo}
                                  onClick={() => { if (!daCo) themNguyenVong(id); }}
                                  className={gop("h-6.5 shrink-0 px-2 rounded text-[10.5px] font-bold inline-flex items-center justify-center gap-0.5 transition-colors", daCo ? "bg-luc-nhat text-luc-chu" : "bg-xanh text-white active:brightness-90 cursor-pointer")}
                                >
                                  {daCo ? <><Check size={11} />Đã thêm</> : "+ Thêm vào Nguyện Vọng"}
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                    {/kế hoạch học tập|lịch học|ôn thi tuần/i.test(t.chu) && (
                      <div className="mt-1.5 p-2 rounded-lg bg-gradient-to-r from-xanh-nhat to-white border border-xanh/30 flex items-center justify-between gap-1.5">
                        <span className="text-[11.5px] font-bold text-muc">Lịch học tuần AI</span>
                        <Link
                          to={DUONG_DAN.tuan()}
                          onClick={dong}
                          className="shrink-0 h-6 px-2 rounded bg-xanh text-white text-[11px] font-bold inline-flex items-center gap-0.5 hover:bg-xanh/90 transition-colors"
                        >
                          <CalendarCheck size={11} /> Vào xem
                        </Link>
                      </div>
                    )}
                    {t.viecTiep && <p className="mt-1 text-[11.5px] text-muc">Gợi ý: <span className="text-chu">{t.viecTiep}</span></p>}
                    {t.thuLai && i === viTriCuoi && !dang && tin[i - 1]?.vai === "em" && (
                      <div className="mt-1 flex items-center gap-1.5">
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
            <div className="flex justify-start" role="status">
              <div className="rounded-xl border border-vien bg-nen px-2.5 py-1.5 text-[11.5px] text-chu-phu">
                <span className="mr-1 inline-flex gap-1 align-middle" aria-hidden>
                  <span className="size-1.5 animate-pulse rounded-full bg-xanh" />
                  <span className="size-1.5 animate-pulse rounded-full bg-xanh [animation-delay:200ms]" />
                  <span className="size-1.5 animate-pulse rounded-full bg-xanh [animation-delay:400ms]" />
                </span>
                {lau ? "Đang tra số liệu…" : "Đang soạn câu trả lời…"}
              </div>
            </div>
          )}
          <div ref={cuoi} />
        </section>
      </div>

      {/* Chân khung chat mini: Gợi ý nhanh + Ô nhập câu hỏi */}
      <footer className="border-t border-vien bg-trang px-2.5 pt-1.5 pb-2 shrink-0 space-y-1.5">
        {tin.length === 0 && (
          <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none]">
            {goiY.map((x) => (
              <button
                key={x}
                type="button"
                disabled={dang}
                onClick={() => gui(x)}
                className="shrink-0 h-6.5 rounded-full border border-vien bg-nen px-2 text-[11px] font-medium text-chu whitespace-nowrap active:bg-xanh-nhat disabled:opacity-50 hover:border-xanh/40 cursor-pointer"
              >
                {x}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-1.5">
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
            placeholder="Hỏi trợ lý Tuyển sinh AI..."
            className="h-9 min-w-0 flex-1 rounded-lg border border-vien bg-nen px-2.5 text-[12.5px] text-chu placeholder:text-chu-phu focus:border-xanh outline-none transition-colors"
          />
          <Nut
            rong={false}
            bieuTuong={Send}
            className="!h-9 !min-h-9 shrink-0 px-3 !rounded-lg cursor-pointer text-[12px]"
            disabled={dang || cauHoi.trim().length < 3}
            onClick={() => gui(cauHoi)}
          >
            Gửi
          </Nut>
        </div>
      </footer>
    </div>
  );
}

/** Nút tròn trợ lý Tuyển sinh AI nổi ở góc màn hình. Bấm vào hiển thị khung chat nhỏ gọn gàng. */
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
        "fixed inset-x-0 mx-auto max-w-[430px] z-40 pointer-events-none px-3 flex flex-col items-end",
        khongThanh ? "bottom-5" : "bottom-20",
      )}
    >
      {/* Khung chat nhỏ gọn nổi phía trên nút tròn (giống các chatbot hỗ trợ trên web) */}
      {mo && (
        <div
          role="dialog"
          aria-label="Trợ lý Tuyển sinh AI"
          className="pointer-events-auto mb-2.5 w-[calc(100vw-24px)] max-w-[340px] sm:max-w-[360px] h-[450px] max-h-[calc(100dvh-110px)] bg-trang rounded-2xl border border-vien shadow-2xl flex flex-col overflow-hidden hien-len"
        >
          <KhungChatMini dong={() => setMo(false)} />
        </div>
      )}

      {/* Nút tròn nổi ở góc màn hình */}
      <button
        type="button"
        onClick={() => setMo((m) => !m)}
        aria-label={mo ? "Đóng trợ lý Tuyển sinh AI" : "Mở trợ lý Tuyển sinh AI"}
        title={mo ? "Đóng trợ lý" : "Trợ lý Tuyển sinh AI"}
        className="pointer-events-auto size-12 rounded-full gd-xanh text-white shadow-lg shadow-xanh/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xanh cursor-pointer border-2 border-trang relative group"
      >
        {mo ? (
          <X size={20} className="text-white" />
        ) : (
          <>
            <Sparkles size={20} className="text-white" />
            <span className="absolute -top-0.5 -right-0.5 flex size-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-da-quang opacity-75" />
              <span className="relative inline-flex rounded-full size-3 bg-da-quang border border-white" />
            </span>
          </>
        )}
      </button>
    </div>
  );
}

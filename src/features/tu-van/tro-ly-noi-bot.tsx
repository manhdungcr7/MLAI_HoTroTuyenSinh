import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Bot, Maximize2, RotateCcw, Send, X } from "lucide-react";
import { gop } from "@/components/ui/nut-the";
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

/** Khung chat mini nổi ở góc màn hình giống phong cách các website thương mại. Dùng chung logic trả lời với màn Tư vấn (cau-tra-loi.ts). */
function KhungChatMini({ dong }: { dong: () => void }) {
  const { pathname } = useLocation();
  const nav = useNavigate();
  const { s } = useApp();

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

  const gui = async (q: string, thay?: number) => {
    const cau = q.trim();
    if (cau.length < 2 || dangRef.current) return;
    dangRef.current = true;
    setDang(true);
    const truoc = thay === undefined ? tin : tin.slice(0, thay);
    setTin([...truoc, { vai: "em", chu: cau } as TinNhan].slice(-TOI_DA_TIN));
    await guiNen(localStorage, cau, truoc, () => layTinTraLoi({ cau, truoc, s, nguon, dungHoSo, manHinh, phien: phienHienTai(localStorage) }));
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
              Tra cứu số liệu tuyển sinh
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <ChipCheDoAI tren />
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
                <p>Chào em!</p>
                <p className="mt-1">Mình giúp em tra điểm chuẩn, so sánh trường và ngành, hoặc xem danh sách nguyện vọng. Hỏi điều em đang băn khoăn nhé.</p>
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
                  <DinhDangMarkdown noiDung={trinhBayPhanHoi(t.chu)} />
                )}
                {t.vai === "mayChu" && (
                  <TinMayChu t={t} laCuoi={i === viTriCuoi} dang={dang} cauTruoc={tin[i - 1]?.vai === "em" ? tin[i - 1].chu : undefined}
                    onGui={(c) => gui(c)} onThuLai={() => gui(tin[i - 1].chu, i - 1)} onDi={dong} />
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
              if (e.key === "Enter" && !dang && cauHoi.trim().length >= 2) {
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
            disabled={dang || cauHoi.trim().length < 2}
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

/** Biểu tượng Robot AI 3D sống động phong cách bong bóng chat Messenger */
function BieuTuongBot3D() {
  return (
    <svg
      viewBox="0 0 36 36"
      className="size-9 drop-shadow-sm pointer-events-none select-none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        {/* Gradient kim loại cho đầu robot */}
        <linearGradient id="dau-robot-grad" x1="6" y1="8" x2="30" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="rgb(255, 255, 255)" />
          <stop offset="60%" stopColor="rgb(235, 243, 255)" />
          <stop offset="100%" stopColor="rgb(198, 219, 255)" />
        </linearGradient>
        {/* Gradient cho màn hình visor */}
        <linearGradient id="visor-grad" x1="10" y1="12" x2="26" y2="23" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="rgb(10, 20, 50)" />
          <stop offset="100%" stopColor="rgb(18, 32, 74)" />
        </linearGradient>
      </defs>

      {/* Ăng-ten phát sóng với đèn xanh neon nhấp nháy */}
      <line x1="18" y1="3.5" x2="18" y2="8" stroke="rgb(255, 255, 255)" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="18" cy="3" r="2.2" fill="rgb(56, 189, 248)" className="bot-anten-sang" />

      {/* Tai nghe 2 bên (headphones) */}
      <rect x="3" y="13" width="3.5" height="9" rx="1.75" fill="rgb(56, 189, 248)" stroke="rgba(255, 255, 255, 0.85)" strokeWidth="0.8" />
      <rect x="29.5" y="13" width="3.5" height="9" rx="1.75" fill="rgb(56, 189, 248)" stroke="rgba(255, 255, 255, 0.85)" strokeWidth="0.8" />

      {/* Đầu robot 3D bo tròn */}
      <rect
        x="5"
        y="7.5"
        width="26"
        height="21"
        rx="9.5"
        fill="url(#dau-robot-grad)"
        stroke="rgba(255, 255, 255, 0.95)"
        strokeWidth="1.2"
      />

      {/* Ánh sáng phản chiếu mặt trên đầu robot */}
      <ellipse cx="18" cy="9.5" rx="8" ry="1.5" fill="rgba(255, 255, 255, 0.9)" />

      {/* Màn hình kính visor đen bóng */}
      <rect x="8" y="11.5" width="20" height="13" rx="6" fill="url(#visor-grad)" />

      {/* Vệt bóng kính phản chiếu */}
      <path
        d="M10 14.5 C10 13 12 12.2 14.5 12.2 C17 12.2 21 12.5 24 13 C21 14.5 14 15 10 14.5 Z"
        fill="rgba(255, 255, 255, 0.25)"
      />

      {/* Đôi mắt AI xanh ngọc chớp mắt tự nhiên */}
      <g className="bot-mat-chot" style={{ transformOrigin: "18px 17px" }}>
        {/* Mắt trái */}
        <ellipse cx="13" cy="17.2" rx="2.2" ry="2.8" fill="rgb(56, 189, 248)" />
        <circle cx="13.7" cy="16.2" r="0.9" fill="rgb(255, 255, 255)" />

        {/* Mắt phải */}
        <ellipse cx="23" cy="17.2" rx="2.2" ry="2.8" fill="rgb(56, 189, 248)" />
        <circle cx="23.7" cy="16.2" r="0.9" fill="rgb(255, 255, 255)" />
      </g>

      {/* Nụ cười thân thiện */}
      <path
        d="M15.5 20.8 Q18 22.6 20.5 20.8"
        stroke="rgb(56, 189, 248)"
        strokeWidth="1.3"
        strokeLinecap="round"
        fill="none"
      />

      {/* Hai chấm má hồng xinh xắn */}
      <circle cx="10" cy="19.8" r="1.1" fill="rgb(244, 114, 182)" opacity="0.8" />
      <circle cx="26" cy="19.8" r="1.1" fill="rgb(244, 114, 182)" opacity="0.8" />
    </svg>
  );
}

interface ViTriBot {
  x: number;
  y: number;
  ben: "trai" | "phai";
}

/** Nút bong bóng Chatbot AI 3D nổi phong cách Messenger, có thể kéo thả sang 2 mép màn hình. */
export function NutTroLyAI({ khongThanh = false }: { khongThanh?: boolean }) {
  const { pathname } = useLocation();
  const [mo, setMo] = useState(false);
  const [dangKeo, setDangKeo] = useState(false);
  const khungRef = useRef<HTMLDivElement>(null);
  const nutRef = useRef<HTMLButtonElement>(null);
  const vungRef = useRef<HTMLDivElement>(null);

  const [viTri, setViTri] = useState<ViTriBot>({
    x: 320,
    y: 500,
    ben: "phai",
  });

  const keoRef = useRef({
    dangKeo: false,
    daDiChuyen: false,
    pointerId: -1,
    startX: 0,
    startY: 0,
    banDauX: 0,
    banDauY: 0,
  });

  // Khởi tạo và đồng bộ vị trí khi màn hình đổi kích thước
  useEffect(() => {
    const tinhViTri = () => {
      const rongKhung = khungRef.current?.clientWidth || Math.min(window.innerWidth, 430);
      const caoCuaSo = window.innerHeight;
      const minY = 64;
      const maxY = caoCuaSo - (khongThanh ? 85 : 135);

      let ben: "trai" | "phai" = "phai";
      let y = maxY;

      try {
        const daLuu = localStorage.getItem("nvai:vitri-bot");
        if (daLuu) {
          const parsed = JSON.parse(daLuu);
          if (parsed.ben === "trai" || parsed.ben === "phai") ben = parsed.ben;
          if (typeof parsed.yRatio === "number" && !isNaN(parsed.yRatio)) {
            y = Math.max(minY, Math.min(maxY, parsed.yRatio * caoCuaSo));
          }
        }
      } catch {}

      const x = ben === "trai" ? 12 : Math.max(12, rongKhung - 58 - 12);
      setViTri({ x, y, ben });
    };

    tinhViTri();
    window.addEventListener("resize", tinhViTri);
    return () => window.removeEventListener("resize", tinhViTri);
  }, [khongThanh]);

  // Đóng khi nhấn Escape hoặc click ra ngoài khung chat
  useEffect(() => {
    if (!mo) return;
    const xuLyNhanNgoai = (e: MouseEvent) => {
      if (
        vungRef.current &&
        !vungRef.current.contains(e.target as Node) &&
        nutRef.current &&
        !nutRef.current.contains(e.target as Node)
      ) {
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

  // Xử lý kéo thả bằng Pointer Events (chuẩn cho cả cảm ứng điện thoại và chuột máy tính)
  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}

    keoRef.current = {
      dangKeo: true,
      daDiChuyen: false,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      banDauX: viTri.x,
      banDauY: viTri.y,
    };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!keoRef.current.dangKeo) return;
    const dx = e.clientX - keoRef.current.startX;
    const dy = e.clientY - keoRef.current.startY;

    if (!keoRef.current.daDiChuyen) {
      if (Math.hypot(dx, dy) > 5) {
        keoRef.current.daDiChuyen = true;
        setDangKeo(true);
      }
    }

    if (keoRef.current.daDiChuyen) {
      const rongKhung = khungRef.current?.clientWidth || Math.min(window.innerWidth, 430);
      const caoCuaSo = window.innerHeight;
      const minX = 8;
      const maxX = Math.max(minX, rongKhung - 58 - 8);
      const minY = 64;
      const maxY = caoCuaSo - (khongThanh ? 85 : 135);

      const tiepX = Math.max(minX, Math.min(maxX, keoRef.current.banDauX + dx));
      const tiepY = Math.max(minY, Math.min(maxY, keoRef.current.banDauY + dy));

      setViTri({
        x: tiepX,
        y: tiepY,
        ben: tiepX + 29 < rongKhung / 2 ? "trai" : "phai",
      });
    }
  };

  const ketThucKeo = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!keoRef.current.dangKeo) return;
    const daDi = keoRef.current.daDiChuyen;
    keoRef.current.dangKeo = false;
    setDangKeo(false);

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    if (!daDi) {
      // Nhấp nhẹ (tap/click) -> đóng/mở khung chat
      setMo((m) => !m);
      return;
    }

    // Đã kéo thả -> tự động hít vào mép trái hoặc phải gần nhất
    const rongKhung = khungRef.current?.clientWidth || Math.min(window.innerWidth, 430);
    const caoCuaSo = window.innerHeight;
    const minY = 64;
    const maxY = caoCuaSo - (khongThanh ? 85 : 135);
    const snapY = Math.max(minY, Math.min(maxY, viTri.y));

    const benMoi: "trai" | "phai" = viTri.x + 29 < rongKhung / 2 ? "trai" : "phai";
    const snapX = benMoi === "trai" ? 12 : Math.max(12, rongKhung - 58 - 12);

    setViTri({
      x: snapX,
      y: snapY,
      ben: benMoi,
    });

    try {
      localStorage.setItem(
        "nvai:vitri-bot",
        JSON.stringify({ ben: benMoi, yRatio: snapY / caoCuaSo })
      );
    } catch {}
  };

  // Không hiển thị trên màn tư vấn chính, màn chào mừng, luồng bắt đầu, hoặc màn chia sẻ/người đồng hành
  if (
    pathname === "/tu-van" ||
    pathname.startsWith("/tu-van") ||
    pathname.startsWith("/chao") ||
    pathname.startsWith("/bat-dau") ||
    pathname.startsWith("/ho-so/chia-se") ||
    pathname.startsWith("/dong-hanh") ||
    pathname.startsWith("/loi-nhan")
  ) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex justify-center overflow-hidden">
      <div ref={khungRef} className="relative w-full max-w-[430px] h-full pointer-events-none">
        {/* Khung chat mini nổi lên khi mở */}
        {mo && (
          <div
            ref={vungRef}
            role="dialog"
            aria-label="Chatbot AI Tuyển sinh"
            className="pointer-events-auto absolute inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom)+12px)] z-40 h-[min(530px,calc(100dvh-7.5rem))] bg-trang rounded-2xl shadow-2xl border border-vien overflow-hidden flex flex-col hien-len"
          >
            <KhungChatMini dong={() => setMo(false)} />
          </div>
        )}

        {/* Bong bóng chat AI 3D Messenger có thể kéo thả vào 2 cạnh màn hình */}
        <button
          ref={nutRef}
          type="button"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={ketThucKeo}
          onPointerCancel={ketThucKeo}
          aria-label={mo ? "Đóng Chatbot AI" : "Mở Chatbot AI Tuyển sinh (kéo thả để đổi vị trí)"}
          className={gop(
            "bot-bong-bong-3d pointer-events-auto absolute z-50",
            dangKeo ? "dang-keo" : "bot-troi-dong"
          )}
          style={{
            left: `${viTri.x}px`,
            top: `${viTri.y}px`,
          }}
        >
          {/* Vòng hào quang sóng phát tín hiệu nhẹ nhàng phía sau */}
          {!dangKeo && !mo && <span className="bot-vong-song" aria-hidden />}

          {/* Logo Robot 3D cử động hoặc nút đóng X */}
          {mo ? (
            <X size={26} className="text-white drop-shadow-sm transition-transform duration-200" />
          ) : (
            <BieuTuongBot3D />
          )}

          {/* Chấm tròn trạng thái trợ lý trực tuyến */}
          {!mo && (
            <span
              className="absolute bottom-0 right-0 size-3.5 rounded-full bg-emerald-400 border-2 border-white shadow-xs"
              aria-hidden
            />
          )}
        </button>
      </div>
    </div>
  );
}


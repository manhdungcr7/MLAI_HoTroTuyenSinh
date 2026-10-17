import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { X } from "lucide-react";
import { gop } from "@/components/ui/nut-the";

const KhungChatMini = lazy(() => import("./khung-chat-mini"));

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
    pathname.startsWith("/diem-thi-thu") ||
    pathname.startsWith("/ho-so/cai-dat") ||
    pathname.startsWith("/ke-hoach/cai-dat") ||
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
            <Suspense fallback={<div role="status" className="grid flex-1 place-items-center text-[13px] text-chu-phu">Đang mở trợ lý…</div>}>
              <KhungChatMini dong={() => setMo(false)} />
            </Suspense>
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


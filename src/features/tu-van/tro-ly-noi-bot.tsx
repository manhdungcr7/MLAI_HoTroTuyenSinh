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

export function HopTroLyAI({ mo, dong }: { mo: boolean; dong: () => void }) {
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
    if (mo && cuoi.current) {
      cuoi.current.scrollIntoView({ block: "end", behavior: "smooth" });
    }
  }, [tin.length, dang, mo]);

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

  if (!mo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-muc/50 backdrop-blur-sm sm:p-4" onClick={dong}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Trợ lý Tuyển sinh AI"
        onClick={(e) => e.stopPropagation()}
        className="hien-len w-full max-w-[430px] sm:max-w-[480px] h-[88dvh] sm:h-[680px] bg-trang rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Tiêu đề thanh trên của hộp trợ lý */}
        <header className="px-3.5 py-2.5 border-b border-vien bg-nen flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="size-8 rounded-lg gd-xanh text-white grid place-items-center shrink-0 shadow-xs">
              <Sparkles size={18} />
            </span>
            <div className="min-w-0">
              <h2 className="text-[14px] font-bold text-muc leading-tight">Trợ lý Tuyển sinh AI</h2>
              <span className="text-[11px] text-luc font-medium flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-luc inline-block" /> Sẵn sàng tư vấn cá thể hóa
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => { dong(); nav(DUONG_DAN.tuVan(), { state: { nguCanh: manHinh } }); }}
              title="Mở toàn màn hình"
              aria-label="Mở toàn màn hình"
              className="size-9 grid place-items-center rounded-full hover:bg-vien/60 text-chu-phu cursor-pointer transition-colors"
            >
              <Maximize2 size={16} />
            </button>
            <button
              type="button"
              onClick={dong}
              title="Đóng trợ lý"
              aria-label="Đóng trợ lý"
              className="size-9 grid place-items-center rounded-full hover:bg-vien/60 text-chu cursor-pointer transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {/* Nội dung danh sách trao đổi */}
        <div className="flex-1 overflow-y-auto px-3.5 py-3 space-y-3.5 min-h-0">
          {tin.length === 0 && (
            <div className="my-4 rounded-xl bg-nen border border-vien p-3.5 text-center space-y-2">
              <span className="size-10 rounded-xl bg-xanh-nhat text-xanh mx-auto grid place-items-center">
                <Sparkles size={20} />
              </span>
              <p className="text-[13px] font-bold text-muc">Bạn cần trợ giúp gì về tuyển sinh?</p>
              <p className="text-[12px] text-chu-phu leading-relaxed">
                Hỏi về điểm chuẩn các năm gần đây, cơ cấu nguyện vọng an toàn, hoặc ngành học phù hợp với điểm của bạn.
              </p>
            </div>
          )}

          {tin.length > 0 && (
            <div className="flex justify-end">
              <button
                type="button"
                disabled={dang}
                onClick={() => { setTin([]); setCauHoi(""); }}
                className="inline-flex items-center gap-1 text-[12px] font-bold text-xanh disabled:opacity-50"
              >
                <RotateCcw size={13} /> Cuộc trò chuyện mới
              </button>
            </div>
          )}

          <section aria-label="Cuộc trò chuyện" aria-live="polite" className="space-y-3">
            {tin.map((t, i) => (
              <div key={i} className={gop("flex", t.vai === "em" ? "justify-end" : "justify-start")}>
                <div className={gop("rounded-2xl px-3 py-2 text-[13.5px] leading-snug break-words shadow-xs", t.vai === "em" ? "max-w-[88%] gd-xanh text-white font-medium" : "max-w-[95%] bg-nen border border-vien text-chu")}>
                  {t.vai === "em" ? (
                    <p className="whitespace-pre-line">{t.chu}</p>
                  ) : (
                    <DinhDangMarkdown noiDung={t.chu} />
                  )}
                  {t.vai === "mayChu" && (
                    <>
                      {t.nguon && t.nguon.length > 0 && (
                        <div className="mt-2 space-y-1.5" role="group" aria-label="Nguồn số liệu và hành động">
                          <p className="text-[11.5px] font-bold text-chu-phu">Các ngành liên quan:</p>
                          <ul className="space-y-1.5">
                            {t.nguon.map((id) => {
                              const l = LUA_CHON_MAU.find((x) => x.id === id);
                              if (!l) return null;
                              const daCo = s.nguyenVong.includes(id);
                              return (
                                <li key={id} className="rounded-lg bg-trang border border-vien p-2 flex flex-col gap-1 min-[360px]:flex-row min-[360px]:items-center justify-between">
                                  <Link
                                    to={DUONG_DAN.chiTiet(id)}
                                    onClick={dong}
                                    className="min-w-0 flex-1 text-[12.5px] font-bold text-xanh leading-snug hover:underline line-clamp-1"
                                  >
                                    {l.truong} · {l.nganh}
                                  </Link>
                                  <button
                                    type="button"
                                    disabled={daCo}
                                    onClick={() => { if (!daCo) themNguyenVong(id); }}
                                    className={gop("h-8 shrink-0 px-2.5 rounded-md text-[11.5px] font-bold inline-flex items-center justify-center gap-1 transition-colors", daCo ? "bg-luc-nhat text-luc-chu" : "bg-xanh text-white active:brightness-90 cursor-pointer")}
                                  >
                                    {daCo ? <><Check size={13} />Đã thêm</> : "+ Thêm vào Nguyện Vọng"}
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                      {/kế hoạch học tập|lịch học|ôn thi tuần/i.test(t.chu) && (
                        <div className="mt-2 p-2.5 rounded-lg bg-gradient-to-r from-xanh-nhat to-white border border-xanh/30 flex items-center justify-between gap-2">
                          <span className="text-[12px] font-bold text-muc">Lịch học tuần đề xuất từ AI</span>
                          <Link
                            to={DUONG_DAN.tuan()}
                            onClick={dong}
                            className="shrink-0 h-7 px-2.5 rounded-md bg-xanh text-white text-[11.5px] font-bold inline-flex items-center gap-1 hover:bg-xanh/90 transition-colors"
                          >
                            <CalendarCheck size={13} /> Vào Kế hoạch tuần
                          </Link>
                        </div>
                      )}
                      {t.viecTiep && <p className="mt-1.5 text-[12px] text-muc">Việc nên làm tiếp: <span className="text-chu">{t.viecTiep}</span></p>}
                      {t.thuLai && i === viTriCuoi && !dang && tin[i - 1]?.vai === "em" && (
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-[11.5px] text-chu-phu">Chưa kết nối được.</span>
                          <button type="button" onClick={() => gui(tin[i - 1].chu, i - 1)} className="inline-flex items-center gap-1 text-[12px] font-bold text-xanh"><RotateCcw size={13} />Thử lại</button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}

            {dang && (
              <div className="flex justify-start" role="status">
                <div className="rounded-2xl border border-vien bg-nen px-3 py-2 text-[12.5px] text-chu-phu">
                  <span className="mr-1.5 inline-flex gap-1 align-middle" aria-hidden>
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

        {/* Chân hộp thoại: Gợi ý nhanh + Ô nhập câu hỏi */}
        <footer className="border-t border-vien bg-trang px-3 pt-2 pb-2.5 shrink-0 space-y-1.5">
          {tin.length === 0 && (
            <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
              {goiY.map((x) => (
                <button
                  key={x}
                  type="button"
                  disabled={dang}
                  onClick={() => gui(x)}
                  className="shrink-0 h-7.5 rounded-full border border-vien bg-nen px-2.5 text-[11.5px] font-medium text-chu whitespace-nowrap active:bg-xanh-nhat disabled:opacity-50 hover:border-xanh/40 cursor-pointer"
                >
                  {x}
                </button>
              ))}
            </div>
          )}

          {!dang && viTriCuoi >= 0 && tin[viTriCuoi].vai === "mayChu" && (
            <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none]" role="group" aria-label="Gợi ý hỏi tiếp">
              {tin[viTriCuoi].viecTiep && (
                <button
                  type="button"
                  onClick={() => gui(`Giải thích giúp mình: ${tin[viTriCuoi].viecTiep}`)}
                  className="h-7.5 rounded-full border border-xanh/40 bg-xanh-nhat/50 px-2.5 text-[11.5px] font-semibold text-xanh whitespace-nowrap shrink-0 active:bg-xanh-nhat cursor-pointer"
                >
                  Hỏi thêm việc này
                </button>
              )}
              <button
                type="button"
                onClick={() => gui("So sánh điểm chuẩn 3 năm gần đây của các trường này")}
                className="h-7.5 rounded-full border border-vien bg-nen px-2.5 text-[11.5px] font-medium text-chu whitespace-nowrap shrink-0 active:bg-xanh-nhat cursor-pointer"
              >
                So sánh 3 năm
              </button>
            </div>
          )}

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
              placeholder="Nhập câu hỏi cho trợ lý AI..."
              className="h-10 min-w-0 flex-1 rounded-xl border border-vien bg-nen px-3 text-[13.5px] text-chu placeholder:text-chu-phu focus:border-xanh outline-none transition-colors"
            />
            <Nut
              rong={false}
              bieuTuong={Send}
              className="!h-10 !min-h-10 shrink-0 px-3.5 !rounded-xl cursor-pointer"
              disabled={dang || cauHoi.trim().length < 3}
              onClick={() => gui(cauHoi)}
            >
              Gửi
            </Nut>
          </div>
        </footer>
      </div>
    </div>
  );
}

/** Nút tròn trợ lý Tuyển sinh AI nổi ở góc màn hình. Bấm vào hiển thị chatbot trợ lý hỗ trợ. */
export function NutTroLyAI({ khongThanh = false }: { khongThanh?: boolean }) {
  const { pathname } = useLocation();
  const [mo, setMo] = useState(false);

  // Không hiển thị trên màn tư vấn chính hoặc màn chào mừng ban đầu
  if (pathname === "/tu-van" || pathname.startsWith("/tu-van") || pathname.startsWith("/chao")) {
    return null;
  }

  return (
    <>
      <div
        className={gop(
          "fixed inset-x-0 mx-auto max-w-[430px] z-30 pointer-events-none px-4 flex justify-end",
          khongThanh ? "bottom-6" : "bottom-20",
        )}
      >
        <button
          type="button"
          onClick={() => setMo(true)}
          aria-label="Mở trợ lý Tuyển sinh AI"
          title="Trợ lý Tuyển sinh AI"
          className="pointer-events-auto size-13 rounded-full gd-xanh text-white shadow-lg shadow-xanh/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xanh cursor-pointer border-2 border-trang relative group"
        >
          <Sparkles size={24} className="text-white animate-pulse" />
          <span className="absolute -top-1 -right-1 flex size-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-da-quang opacity-75" />
            <span className="relative inline-flex rounded-full size-3.5 bg-da-quang border border-white" />
          </span>
        </button>
      </div>

      <HopTroLyAI mo={mo} dong={() => setMo(false)} />
    </>
  );
}

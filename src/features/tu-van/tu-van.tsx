import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, RotateCcw, Send, Sparkles } from "lucide-react";
import { DauTrangCoQuayLai, NoiDung } from "@/components/layout/khung";
import { Nut, gop } from "@/components/ui/nut-the";
import { LUA_CHON_MAU } from "@/data/lua-chon-mau";
import { taiNguon, type NguonTaiSau } from "@/data/lua-chon-that";
import { DUONG_DAN } from "@/duong-dan";
import type { TraLoiTuVan, YeuCauTuVan } from "@/engine/tu-van";
import { useApp } from "@/state/store";
import { catLichSu, docLichSu, ghiLichSu, goiYBanDau, nganhLuotTruoc, taoNguCanh, type TinNhan } from "./hoi-thoai";
import { chonDuLieuKemTheo, tomTatHoSo, traLoiTuDong } from "./lay-du-lieu";

export function NutTuVan({ nguCanh }: { nguCanh: string }) {
  const nav = useNavigate();
  return <Nut kieu="vien" bieuTuong={Sparkles} onClick={() => nav(DUONG_DAN.tuVan(), { state: { nguCanh } })}>Hỏi tư vấn AI</Nut>;
}

/** Máy chủ có ngân sách tối đa 12 giây cho một lượt; cộng thời gian mạng, nên chờ 25 giây rồi mới tự trả lời từ số liệu có sẵn. */
const CHO_TOI_DA_MS = 25_000;

type LoiAI = "chua-cau-hinh" | "mang";

/** Gọi dịch vụ AI. kq=null khi chưa bật hoặc không gọi được: khi đó app tự trả lời từ số liệu có sẵn (loi nói vì sao). */
async function hoiAI(y: YeuCauTuVan): Promise<{ kq: TraLoiTuVan | null; viecTiep?: string; loi?: LoiAI }> {
  try {
    const r = await fetch("/api/tu-van", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(y), signal: AbortSignal.timeout(CHO_TOI_DA_MS) });
    const d = (await r.json().catch(() => ({}))) as Partial<TraLoiTuVan> & { goiY?: { viecTiep?: string } };
    if (!r.ok) return { kq: null, viecTiep: typeof d.goiY?.viecTiep === "string" ? d.goiY.viecTiep : undefined, loi: r.status === 503 ? "chua-cau-hinh" : "mang" };
    const ds = (x: unknown) => (Array.isArray(x) ? x.filter((t): t is string => typeof t === "string") : []);
    return typeof d.traLoi === "string" && d.traLoi
      ? { kq: { traLoi: d.traLoi, nguon: ds(d.nguon), tang: d.tang, congDong: ds(d.congDong), viecTiep: typeof d.viecTiep === "string" ? d.viecTiep : undefined } }
      : { kq: null, loi: "mang" };
  } catch { return { kq: null, loi: "mang" }; }
}

const ganDay = () => window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 200;

export default function TuVan() {
  const nav = useNavigate();
  const location = useLocation();
  const { s, themNguyenVong } = useApp();
  const manHinh = (location.state as { nguCanh?: string } | null)?.nguCanh ?? "Tư vấn chung";
  // Rời màn khi đang chờ trả lời thì tin cuối là câu hỏi chưa có đáp: bỏ khỏi lịch sử và trả về ô nhập để em gửi lại.
  const [khoiDau] = useState(() => { const h = docLichSu(localStorage); const cuoiTin = h[h.length - 1]; return cuoiTin?.vai === "em" ? { tin: h.slice(0, -1), cau: cuoiTin.chu } : { tin: h, cau: "" }; });
  const [cauHoi, setCauHoi] = useState(khoiDau.cau);
  const [tin, setTin] = useState<TinNhan[]>(khoiDau.tin);
  const [dang, setDang] = useState(false);
  const [lau, setLau] = useState(false);
  const [dungHoSo, setDungHoSo] = useState(true);
  const [nguon, setNguon] = useState<NguonTaiSau | null>(null);
  const cuoi = useRef<HTMLDivElement>(null);
  const dangRef = useRef(false); // chặn gửi trùng khi bấm đúp (state chưa kịp cập nhật)
  const cuonSau = useRef(true); // có cuộn xuống tin mới không: chỉ khi em vừa gửi hoặc đang ở gần cuối
  const lanDau = useRef(true);

  useEffect(() => { let con = true; taiNguon().then((m) => con && setNguon(m)).catch(() => {}); return () => { con = false; }; }, []);
  // Lưu hội thoại sau mỗi thay đổi; "Xóa hết", "Hồ sơ mẫu", "Khôi phục" xóa khóa và phát nvai-lam-lai.
  useEffect(() => { if (!ghiLichSu(localStorage, tin)) window.dispatchEvent(new Event("nvai-luu-loi")); }, [tin]);
  useEffect(() => { const f = () => setTin([]); window.addEventListener("nvai-lam-lai", f); return () => window.removeEventListener("nvai-lam-lai", f); }, []);
  useEffect(() => {
    if (lanDau.current) { lanDau.current = false; if (tin.length) cuoi.current?.scrollIntoView({ block: "end", behavior: "auto" }); return; }
    if (cuonSau.current) cuoi.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [tin.length, dang]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!dang) { setLau(false); return; }
    const h = setTimeout(() => setLau(true), 8000);
    return () => clearTimeout(h);
  }, [dang]);

  const dungYeuCau = (q: string, truoc: TinNhan[]): YeuCauTuVan => ({
    cauHoi: q, nguCanh: taoNguCanh(manHinh, truoc), hoSo: dungHoSo ? tomTatHoSo(s) : null,
    duLieu: chonDuLieuKemTheo(q, s, nguon, 8, nganhLuotTruoc(truoc)),
  });

  /** `thay`: vị trí tin của em cần hỏi lại (Thử lại): bỏ cặp hỏi–đáp cũ rồi gửi lại đúng câu đó. */
  const gui = async (q: string, thay?: number) => {
    const cau = q.trim();
    if (cau.length < 3 || dangRef.current) return;
    dangRef.current = true; setDang(true);
    const truoc = thay === undefined ? tin : tin.slice(0, thay);
    cuonSau.current = true;
    setTin(catLichSu([...truoc, { vai: "em", chu: cau }]));
    try {
      const y = dungYeuCau(cau, truoc);
      const idDuLieu = y.duLieu.map((d) => d.id);
      const { kq: ai, viecTiep, loi } = await hoiAI(y);
      cuonSau.current = ganDay();
      if (ai) setTin((t) => catLichSu([...t, { vai: "mayChu", chu: ai.traLoi, nguon: ai.nguon, cheDo: "ai", tang: ai.tang, congDong: ai.congDong, viecTiep: ai.viecTiep, idDuLieu }]));
      else {
        const td = traLoiTuDong(cau, s, nguon, nganhLuotTruoc(truoc));
        setTin((t) => catLichSu([...t, { vai: "mayChu", chu: td.traLoi, nguon: td.nguon, cheDo: "tuDong", viecTiep, idDuLieu, ...(loi === "mang" ? { thuLai: true } : {}) }]));
      }
      // Ô nhập chỉ được xóa khi đã có câu trả lời thật; lỗi mạng/hết giờ thì giữ nguyên câu em gõ (có nút Thử lại).
      if (ai || loi !== "mang") setCauHoi((c) => (c.trim() === cau ? "" : c));
    } finally { dangRef.current = false; setDang(false); }
  };

  const goiY = goiYBanDau({ soNguyenVong: s.nguyenVong.length, nganhQuanTam: s.hoSo.nganhQuanTam });
  const viTriCuoi = tin.length - 1;

  return (
    <>
      <DauTrangCoQuayLai tieuDe="Tư vấn cùng AI" phai={<span className="sr-only">{manHinh}</span>} />
      <NoiDung className="pb-4">
        <div className="flex items-center justify-between rounded-xl bg-xanh-nhat px-3.5 py-2.5 border border-xanh/20">
          <div className="flex items-center gap-2 min-w-0">
            <span className="size-7 rounded-lg bg-trang text-xanh grid place-items-center shrink-0 shadow-xs">
              <Sparkles size={16} />
            </span>
            <div className="min-w-0">
              <span className="text-[13.5px] font-bold text-muc">Trợ lý Tuyển sinh AI</span>
              <span className="text-[12px] text-chu-phu hidden sm:inline ml-1.5">· Dữ liệu chuẩn hoá từ đề án</span>
            </div>
          </div>
          <label className="flex items-center gap-1.5 text-[12.5px] font-semibold text-chu cursor-pointer shrink-0 ml-2">
            <input type="checkbox" checked={dungHoSo} onChange={(e) => setDungHoSo(e.target.checked)} className="size-4 accent-[var(--color-xanh)]" />
            <span>Kèm hồ sơ của em</span>
          </label>
        </div>

        {tin.length === 0 && (
          <section aria-label="Câu hỏi gợi ý" className="space-y-2 pt-1">
            <p className="text-[13px] font-bold text-chu-phu px-1">Gợi ý hỏi nhanh:</p>
            <div className="grid gap-2">
              {goiY.map((x) => (
                <button
                  key={x}
                  type="button"
                  disabled={dang}
                  onClick={() => gui(x)}
                  className="w-full min-h-12 rounded-xl border border-vien bg-trang px-3.5 py-2.5 text-left text-[14px] font-medium text-chu active:bg-xanh-nhat disabled:opacity-50 transition-colors shadow-sm hover:border-xanh/40 cursor-pointer"
                >
                  {x}
                </button>
              ))}
            </div>
          </section>
        )}

        {tin.length > 0 && (
          <div className="flex justify-end">
            <button type="button" disabled={dang} onClick={() => { setTin([]); setCauHoi(""); }} className="inline-flex items-center gap-1.5 min-h-11 px-2 text-[13px] font-bold text-xanh disabled:opacity-50"><RotateCcw size={15} />Cuộc trò chuyện mới</button>
          </div>
        )}

        <section aria-label="Cuộc trò chuyện" aria-live="polite" className="space-y-3">
          {tin.map((t, i) => (
            <div key={i} className={gop("flex", t.vai === "em" ? "justify-end" : "justify-start")}>
              <div className={gop("max-w-[92%] rounded-2xl px-3.5 py-2.5 text-[14px] leading-snug break-words", t.vai === "em" ? "gd-xanh text-white" : "bg-trang border border-vien text-chu")}>
                <p className="whitespace-pre-line">{t.chu}</p>
                {t.vai === "mayChu" && (
                  <>
                    {t.nguon && t.nguon.length > 0 && (
                      <div className="mt-2.5 space-y-1.5" role="group" aria-label="Nguồn số liệu và hành động">
                        <p className="text-[12px] font-bold text-chu-phu">Các ngành liên quan:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {t.nguon.map((id) => {
                            const l = LUA_CHON_MAU.find((x) => x.id === id);
                            if (!l) return null;
                            const daCo = s.nguyenVong.includes(id);
                            return (
                              <div key={id} className="inline-flex items-center gap-1 rounded-xl bg-xanh-nhat p-1 border border-xanh/20">
                                <Link to={DUONG_DAN.chiTiet(id)} className="inline-flex items-center min-h-8 px-2 text-[12px] font-bold text-xanh hover:underline">
                                  {l.truong} · {l.nganh.slice(0, 24)}
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!daCo) themNguyenVong(id);
                                  }}
                                  title={daCo ? "Đã có trong danh sách nguyện vọng" : "Thêm vào danh sách nguyện vọng"}
                                  className={`min-h-8 px-2 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                                    daCo
                                      ? "bg-luc/20 text-luc-chu cursor-default"
                                      : "bg-xanh text-white active:brightness-90 shadow-sm"
                                  }`}
                                >
                                  {daCo ? "✓ Đã trong NV" : "+ Thêm NV"}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {t.congDong && t.congDong.length > 0 && <p className="mt-1.5 text-[12px] text-chu-phu">Có dùng ghi chú của cộng đồng, chưa phải thông tin chính thức.</p>}
                    {t.viecTiep && <p className="mt-1.5 text-[13px] text-muc">Việc nên làm tiếp: <span className="text-chu">{t.viecTiep}</span></p>}
                    <p className="mt-1.5 text-[12px] text-chu-phu">{t.cheDo === "ai" ? (t.tang === "cache" ? "Trả lời AI đã lưu, chỉ dùng số liệu trong app" : "Trả lời bởi AI, chỉ dùng số liệu trong app") : "Trả lời từ số liệu có sẵn trong app"}</p>
                    {t.thuLai && i === viTriCuoi && !dang && tin[i - 1]?.vai === "em" && (
                      <div className="mt-1 flex flex-wrap items-center gap-x-2">
                        <span className="text-[12px] text-chu-phu">Chưa kết nối được AI.</span>
                        <button type="button" onClick={() => gui(tin[i - 1].chu, i - 1)} className="inline-flex items-center gap-1.5 min-h-11 px-1 text-[13px] font-bold text-xanh"><RotateCcw size={15} />Thử lại</button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}

          {!dang && viTriCuoi >= 0 && tin[viTriCuoi].vai === "mayChu" && (
            <div className="flex flex-wrap gap-2" role="group" aria-label="Gợi ý hỏi tiếp">
              {tin[viTriCuoi].viecTiep && <button type="button" onClick={() => gui(`Giải thích giúp em: ${tin[viTriCuoi].viecTiep}`)} className="min-h-11 rounded-xl border border-xanh/40 bg-trang px-3 py-1.5 text-left text-[13px] text-xanh active:bg-xanh-nhat">Hỏi thêm về việc này</button>}
              {(tin[viTriCuoi].nguon?.length ?? 0) > 0 && (
                <>
                  <button type="button" onClick={() => gui("Học phí của ngành này thế nào?")} className="min-h-11 rounded-xl border border-xanh/40 bg-trang px-3 py-1.5 text-[13px] text-xanh active:bg-xanh-nhat">Học phí thế nào?</button>
                  <button type="button" onClick={() => gui("Còn ngành nào tương tự thì sao?")} className="min-h-11 rounded-xl border border-xanh/40 bg-trang px-3 py-1.5 text-[13px] text-xanh active:bg-xanh-nhat">Ngành tương tự?</button>
                </>
              )}
            </div>
          )}

          {dang && (
            <div className="flex justify-start" role="status">
              <div className="rounded-2xl border border-vien bg-trang px-3.5 py-2.5 text-[13px] text-chu-phu">
                <span className="mr-1.5 inline-flex gap-1 align-middle" aria-hidden><span className="size-1.5 animate-pulse rounded-full bg-xanh" /><span className="size-1.5 animate-pulse rounded-full bg-xanh [animation-delay:200ms]" /><span className="size-1.5 animate-pulse rounded-full bg-xanh [animation-delay:400ms]" /></span>
                {lau ? "Mất hơi lâu, mình vẫn đang tra số liệu…" : "Mình đang soạn câu trả lời…"}
              </div>
            </div>
          )}
          <div ref={cuoi} className="scroll-mb-44" />
        </section>

        {/* Ô nhập dính phía trên thanh điều hướng dưới (cao 64px + vùng an toàn) nên nút Gửi không bị che. */}
        <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 -mx-4 border-t border-vien bg-nen px-4 pb-2 pt-2">
          <label htmlFor="tu-van-cau-hoi" className="sr-only">Câu hỏi của em</label>
          <div className="flex items-end gap-2">
            <textarea id="tu-van-cau-hoi" value={cauHoi} onChange={(e) => setCauHoi(e.target.value)} readOnly={dang} maxLength={1000} rows={2}
              placeholder={tin.length ? "Hỏi tiếp, ví dụ: Còn ngành kia thì sao?" : "Ví dụ: Điểm chuẩn Khoa học máy tính UIT?"}
              className="min-h-12 min-w-0 flex-1 resize-none rounded-xl border border-vien bg-trang p-2.5 text-[15px] text-chu placeholder:text-chu-phu focus:border-xanh" />
            <Nut rong={false} bieuTuong={Send} className="shrink-0 px-4" disabled={dang || cauHoi.trim().length < 3} onClick={() => gui(cauHoi)}>Gửi</Nut>
          </div>
        </div>

        <button type="button" onClick={() => nav(DUONG_DAN.khamPha())} className="w-full min-h-11 inline-flex items-center justify-center gap-2 text-[14px] font-bold text-xanh"><ArrowLeft size={17} />Tiếp tục khám phá</button>
      </NoiDung>
    </>
  );
}

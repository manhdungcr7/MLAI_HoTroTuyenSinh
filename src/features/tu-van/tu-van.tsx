import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, LockKeyhole, Send, Sparkles } from "lucide-react";
import { DauTrangCoQuayLai, NoiDung } from "@/components/layout/khung";
import { Nut, gop } from "@/components/ui/nut-the";
import { LUA_CHON_MAU } from "@/data/lua-chon-mau";
import { taiNguon, type NguonTaiSau } from "@/data/lua-chon-that";
import { DUONG_DAN } from "@/duong-dan";
import type { TraLoiTuVan, YeuCauTuVan } from "@/engine/tu-van";
import { useApp } from "@/state/store";
import { chonDuLieuKemTheo, tomTatHoSo, traLoiTuDong } from "./lay-du-lieu";

export function NutTuVan({ nguCanh }: { nguCanh: string }) {
  const nav = useNavigate();
  return <Nut kieu="vien" bieuTuong={Sparkles} onClick={() => nav(DUONG_DAN.tuVan(), { state: { nguCanh } })}>Hỏi tư vấn AI</Nut>;
}

const GOI_Y = ["Em nên bắt đầu tìm ngành từ đâu?", "Điểm của em đang thiếu gì để so sánh?", "Làm sao cân bằng danh sách nguyện vọng?"];

interface TinNhan { vai: "em" | "mayChu"; chu: string; nguon?: string[]; cheDo?: "ai" | "tuDong" }

/** Gọi dịch vụ AI. Trả null khi dịch vụ chưa bật hoặc không gọi được: khi đó app tự trả lời từ số liệu có sẵn. */
async function hoiAI(y: YeuCauTuVan): Promise<TraLoiTuVan | null> {
  try {
    const r = await fetch("/api/tu-van", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(y) });
    if (!r.ok) return null;
    const d = (await r.json()) as Partial<TraLoiTuVan>;
    return typeof d.traLoi === "string" && d.traLoi ? { traLoi: d.traLoi, nguon: Array.isArray(d.nguon) ? d.nguon : [] } : null;
  } catch { return null; }
}

export default function TuVan() {
  const nav = useNavigate();
  const location = useLocation();
  const { s } = useApp();
  const nguCanh = (location.state as { nguCanh?: string } | null)?.nguCanh ?? "Tư vấn chung";
  const [cauHoi, setCauHoi] = useState("");
  const [tin, setTin] = useState<TinNhan[]>([]);
  const [dang, setDang] = useState(false);
  const [dungHoSo, setDungHoSo] = useState(true);
  const [xemGui, setXemGui] = useState(false);
  const [nguon, setNguon] = useState<NguonTaiSau | null>(null);
  const cuoi = useRef<HTMLDivElement>(null);
  useEffect(() => { let con = true; taiNguon().then((m) => con && setNguon(m)).catch(() => {}); return () => { con = false; }; }, []);
  useEffect(() => { cuoi.current?.scrollIntoView({ block: "end", behavior: "smooth" }); }, [tin.length, dang]);

  const dungYeuCau = (q: string): YeuCauTuVan => ({ cauHoi: q, nguCanh, hoSo: dungHoSo ? tomTatHoSo(s) : null, duLieu: chonDuLieuKemTheo(q, s, nguon) });
  const xemTruoc = cauHoi.trim().length >= 3 ? dungYeuCau(cauHoi.trim()) : null;

  const gui = async (q: string) => {
    const cau = q.trim();
    if (cau.length < 3 || dang) return;
    setCauHoi(""); setDang(true);
    setTin((t) => [...t, { vai: "em", chu: cau }]);
    const ai = await hoiAI(dungYeuCau(cau));
    if (ai) setTin((t) => [...t, { vai: "mayChu", chu: ai.traLoi, nguon: ai.nguon, cheDo: "ai" }]);
    else { const td = traLoiTuDong(cau, s, nguon); setTin((t) => [...t, { vai: "mayChu", chu: td.traLoi, nguon: td.nguon, cheDo: "tuDong" }]); }
    setDang(false);
  };

  return (
    <>
      <DauTrangCoQuayLai tieuDe="Tư vấn cùng AI" phai={<span className="sr-only">{nguCanh}</span>} />
      <NoiDung className="pb-8">
        <div className="rounded-lon bg-xanh-nhat p-4">
          <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-trang text-xanh"><Sparkles size={22} /></span>
          <h2 className="mt-3 text-[19px] font-extrabold text-muc">Mình trả lời dựa trên số liệu có nguồn</h2>
          <p className="mt-1 text-[14px] text-chu">Mình chỉ dùng điểm chuẩn, tổ hợp, học phí đã có trong app và hồ sơ của em. Câu nào chưa có dữ liệu, mình nói thẳng. Ngữ cảnh: {nguCanh}.</p>
        </div>

        {tin.length === 0 && (
          <section aria-label="Câu hỏi gợi ý" className="space-y-2">
            {GOI_Y.map((x) => <button key={x} type="button" onClick={() => gui(x)} className="w-full min-h-12 rounded-xl border border-vien bg-trang px-3 text-left text-[14px] text-chu active:bg-xanh-nhat">{x}</button>)}
          </section>
        )}

        <section aria-label="Cuộc trò chuyện" aria-live="polite" className="space-y-3">
          {tin.map((t, i) => (
            <div key={i} className={gop("flex", t.vai === "em" ? "justify-end" : "justify-start")}>
              <div className={gop("max-w-[92%] rounded-2xl px-3.5 py-2.5 text-[14px] leading-snug", t.vai === "em" ? "gd-xanh text-white" : "bg-trang border border-vien text-chu")}>
                <p className="whitespace-pre-line">{t.chu}</p>
                {t.vai === "mayChu" && (
                  <>
                    {t.nguon && t.nguon.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Nguồn số liệu">
                        {t.nguon.map((id) => {
                          const l = LUA_CHON_MAU.find((x) => x.id === id);
                          return l ? <Link key={id} to={DUONG_DAN.chiTiet(id)} className="inline-flex items-center min-h-11 px-2.5 rounded-lg bg-xanh-nhat text-[12px] font-bold text-xanh">Xem nguồn: {l.truong} · {l.nganh.slice(0, 28)}</Link> : null;
                        })}
                      </div>
                    )}
                    <p className="mt-1.5 text-[11px] text-chu-phu">{t.cheDo === "ai" ? "Trả lời bởi AI, chỉ dùng số liệu trong app" : "Trả lời tự động từ số liệu trong app"}</p>
                  </>
                )}
              </div>
            </div>
          ))}
          {dang && <p className="text-[13px] text-chu-phu" role="status">Mình đang tra số liệu…</p>}
          <div ref={cuoi} />
        </section>

        <label htmlFor="tu-van-cau-hoi" className="block text-[14px] font-bold text-muc">Câu hỏi của em</label>
        <textarea id="tu-van-cau-hoi" value={cauHoi} onChange={(e) => setCauHoi(e.target.value)} maxLength={1000} rows={3}
          placeholder="Ví dụ: Điểm chuẩn Khoa học máy tính UIT? Em đang phân vân giữa Kinh tế và Marketing…"
          className="w-full resize-y rounded-xl border border-vien bg-trang p-3 text-[15px] text-chu placeholder:text-chu-phu focus:border-xanh" />

        <div className="rounded-the border border-vien bg-trang p-3.5">
          <label className="flex items-start gap-3 min-h-11">
            <input type="checkbox" checked={dungHoSo} onChange={(e) => setDungHoSo(e.target.checked)} className="mt-1 size-5 accent-[var(--color-xanh)]" />
            <span className="text-[14px] text-chu"><b className="text-muc">Cho mình dùng hồ sơ của em</b> (điểm tổ hợp, nhóm ngành, ngân sách, khu vực) để trả lời sát hơn. Không gửi tên và thông tin liên hệ.</span>
          </label>
          <button type="button" onClick={() => setXemGui(!xemGui)} aria-expanded={xemGui} className="mt-1 inline-flex items-center gap-1.5 min-h-11 text-[13px] font-bold text-xanh">
            <Eye size={16} />{xemGui ? "Ẩn dữ liệu sẽ gửi" : "Xem dữ liệu sẽ gửi đi"}
          </button>
          {xemGui && (
            <pre className="mt-1 max-h-56 overflow-auto rounded-xl bg-nen p-2.5 text-[11px] leading-snug text-chu whitespace-pre-wrap break-words" aria-label="Dữ liệu sẽ gửi">
              {xemTruoc ? JSON.stringify({ cauHoi: xemTruoc.cauHoi, hoSo: xemTruoc.hoSo, nganhKemTheo: xemTruoc.duLieu.map((d) => `${d.nganh} · ${d.truong}`) }, null, 1) : "Em gõ câu hỏi để xem mình sẽ gửi những gì."}
            </pre>
          )}
          <p className="mt-1 flex items-start gap-1.5 text-[12px] text-chu-phu"><LockKeyhole size={14} className="mt-0.5 shrink-0 text-luc" />Hồ sơ của em chỉ lưu trên máy. Chỉ phần em thấy ở trên mới được gửi đi khi em bấm Gửi.</p>
        </div>

        <Nut bieuTuong={Send} disabled={dang || cauHoi.trim().length < 3} onClick={() => gui(cauHoi)}>{dang ? "Đang trả lời…" : "Gửi câu hỏi"}</Nut>
        <button type="button" onClick={() => nav(DUONG_DAN.khamPha())} className="w-full min-h-11 inline-flex items-center justify-center gap-2 text-[14px] font-bold text-xanh"><ArrowLeft size={17} />Tiếp tục khám phá</button>
      </NoiDung>
    </>
  );
}

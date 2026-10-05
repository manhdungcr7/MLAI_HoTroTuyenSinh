import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, LockKeyhole, Send, Sparkles } from "lucide-react";
import { DauTrangCoQuayLai, NoiDung } from "@/components/layout/khung";
import { Nut } from "@/components/ui/nut-the";
import { DUONG_DAN } from "@/duong-dan";

export function NutTuVan({ nguCanh }: { nguCanh: string }) {
  const nav = useNavigate();
  return <Nut kieu="vien" bieuTuong={Sparkles} onClick={() => nav(DUONG_DAN.tuVan(), { state: { nguCanh } })}>Hỏi tư vấn AI</Nut>;
}

const GOI_Y = ["Em nên bắt đầu tìm ngành từ đâu?", "Điểm của em đang thiếu gì để so sánh?", "Làm sao cân bằng danh sách nguyện vọng?"];

export default function TuVan() {
  const nav = useNavigate();
  const location = useLocation();
  const nguCanh = (location.state as { nguCanh?: string } | null)?.nguCanh ?? "Tư vấn chung";
  const [cauHoi, setCauHoi] = useState("");

  return (
    <>
      <DauTrangCoQuayLai tieuDe="Tư vấn cùng AI" phai={<span className="sr-only">{nguCanh}</span>} />
      <NoiDung className="pb-8">
        <div className="rounded-lon bg-xanh-nhat p-4">
          <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-trang text-xanh"><Sparkles size={22} /></span>
          <h2 className="mt-3 text-[19px] font-extrabold text-muc">Mình có thể giúp em suy nghĩ rõ hơn</h2>
          <p className="mt-1 text-[14px] text-chu">Ngữ cảnh: {nguCanh}</p>
        </div>

        <section aria-label="Câu hỏi gợi ý" className="space-y-2">
          {GOI_Y.map((x) => <button key={x} type="button" onClick={() => setCauHoi(x)} className="w-full min-h-12 rounded-xl border border-vien bg-trang px-3 text-left text-[14px] text-chu active:bg-xanh-nhat">{x}</button>)}
        </section>

        <label htmlFor="tu-van-cau-hoi" className="block text-[14px] font-bold text-muc">Câu hỏi của em</label>
        <textarea id="tu-van-cau-hoi" value={cauHoi} onChange={(e) => setCauHoi(e.target.value)} maxLength={1000} rows={4} placeholder="Viết điều em đang băn khoăn…" className="w-full resize-y rounded-xl border border-vien bg-trang p-3 text-[15px] text-chu placeholder:text-chu-phu focus:border-xanh" />

        <div role="status" className="rounded-the border border-vien bg-trang p-3.5">
          <p className="flex items-center gap-2 text-[14px] font-bold text-muc"><LockKeyhole size={18} className="text-luc" />Tư vấn AI chưa được kết nối</p>
          <p className="mt-1 text-[13px] text-chu-phu">Câu hỏi chưa được gửi hay lưu lại. Khi dịch vụ sẵn sàng, em sẽ chủ động chọn dữ liệu tối thiểu để chia sẻ; tên và thông tin liên hệ không được dùng.</p>
        </div>
        <Nut disabled bieuTuong={Send}>Chưa thể gửi câu hỏi</Nut>
        <button type="button" onClick={() => nav(DUONG_DAN.khamPha())} className="w-full min-h-11 inline-flex items-center justify-center gap-2 text-[14px] font-bold text-xanh"><ArrowLeft size={17} />Tiếp tục khám phá</button>
      </NoiDung>
    </>
  );
}

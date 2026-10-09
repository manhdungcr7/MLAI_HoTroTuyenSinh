// "Số liệu này từ đâu ra?": mọi con số ở đây tính trực tiếp từ dữ liệu trong app, không gõ tay.
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BadgeCheck, FileSearch, FileText, GraduationCap, ShieldAlert, AlertCircle, Users } from "lucide-react";
import { DauTrangCoQuayLai, NoiDung } from "@/components/layout/khung";
import { DongThongBao } from "@/components/ui/thong-bao";
import { Nut } from "@/components/ui/nut-the";
import { LUA_CHON_MAU } from "@/data/lua-chon-mau";
import { taiNguon, type NguonTaiSau } from "@/data/lua-chon-that";
import { coHocPhi } from "@/data/lua-chon-phu";
import { DUONG_DAN, EMAIL_BAO_SAI } from "@/duong-dan";

const so = (n: number) => n.toLocaleString("vi-VN");

export default function VeDuLieu() {
  const nav = useNavigate();
  const [nguon, setNguon] = useState<NguonTaiSau | null>(null);
  useEffect(() => { let con = true; taiNguon().then((m) => con && setNguon(m)).catch(() => {}); return () => { con = false; }; }, []);

  const tk = useMemo(() => {
    const truong = new Set(LUA_CHON_MAU.map((l) => l.maTruong));
    const chinhThuc = LUA_CHON_MAU.filter((l) => l.nguonCap === "official_pdf");
    return {
      tong: LUA_CHON_MAU.length, truong: truong.size, chinhThuc: chinhThuc.length,
      truongChinhThuc: new Set(chinhThuc.map((l) => l.maTruong)).size,
      nhieuNam: LUA_CHON_MAU.filter((l) => Object.keys(l.diemTheoNam ?? {}).length >= 2).length,
      hocPhi: LUA_CHON_MAU.filter(coHocPhi).length,
      viecLam: LUA_CHON_MAU.filter((l) => l.tiLeViecLam !== undefined).length,
      coToHop: LUA_CHON_MAU.filter((l) => (l.toHopXet?.length ?? 0) > 0).length,
    };
  }, []);
  const dem = useMemo(() => {
    if (!nguon) return null;
    const theoPDF = LUA_CHON_MAU.filter((l) => (nguon.nam[l.id]?.length ?? 0) > 0);
    const dungTrang = LUA_CHON_MAU.filter((l) => nguon.nam[l.id]?.some((x) => x.trang));
    return { theoPDF: theoPDF.length, dungTrang: dungTrang.length, trangNganh: Object.keys(nguon.nganh).length };
  }, [nguon]);

  const The = ({ so: n, nhan, phu }: { so: string; nhan: string; phu?: string }) => (
    <div className="rounded-the bg-trang border border-vien p-3 shadow-the">
      <b className="block text-[24px] leading-none font-extrabold text-xanh">{n}</b>
      <span className="block mt-1 text-[13px] font-semibold text-chu leading-snug">{nhan}</span>
      {phu && <span className="block text-[12px] text-chu-phu leading-snug">{phu}</span>}
    </div>
  );

  return (
    <>
      <DauTrangCoQuayLai tieuDe="Số liệu từ đâu ra?" />
      <NoiDung className="pb-8">
        <section className="rounded-lon nen-xanh p-4">
          <h2 className="text-[19px] font-extrabold text-muc leading-snug">Mỗi con số đều có nguồn để em tự kiểm tra</h2>
          <p className="mt-1 text-[14px] text-chu">Điểm chuẩn, tổ hợp, học phí, việc làm trong app lấy từ đề án tuyển sinh của chính các trường. Chỗ nào chưa có, mình ghi chưa có dữ liệu chứ không đoán.</p>
        </section>

        <section aria-label="Số liệu tổng quan" className="grid grid-cols-2 gap-2.5">
          <The so={so(tk.tong)} nhan="ngành và chương trình" phu={`của ${tk.truong} trường`} />
          <The so={so(tk.chinhThuc)} nhan="lấy từ đề án PDF của trường" phu={`${tk.truongChinhThuc} trường`} />
          <The so={dem ? so(dem.dungTrang) : "..."} nhan="mở được đúng trang PDF có điểm" phu="chỉ được trang chi tiết điểm" />
          <The so={so(tk.nhieuNam)} nhan="có điểm chuẩn từ 2 năm trở lên" />
          <The so={so(tk.coToHop)} nhan="có ghi rõ tổ hợp xét tuyển" phu="điểm của em tính đúng tổ hợp đó" />
          <The so={dem ? so(dem.trangNganh) : "..."} nhan="có trang giới thiệu ngành của trường" phu="đã mở thử, đúng tên ngành" />
        </section>

        <section className="rounded-the bg-trang border border-vien p-4 space-y-3" aria-label="Khác gì hỏi chatbot">
          <h2 className="text-[16px] font-extrabold text-muc">Khác gì hỏi một chatbot?</h2>
          <div className="space-y-3">
            {[
              [FileSearch, "Có thể kiểm tra", "Chatbot nói kết quả nhưng không chỉ được trang nào. Ở đây em bấm vào là thấy đúng dòng trong file đề án của trường."],
              [GraduationCap, "Tính đúng tổ hợp", "Mỗi ngành xét tổ hợp khác nhau. Mình cộng đúng 3 môn của tổ hợp đó từ điểm em nhập, không dùng một tổng chung cho mọi ngành."],
              [BadgeCheck, "Không bịa chỗ trống", "Thiếu học phí hay việc làm thì ghi rõ là chưa có, kèm trang đề án để em tự xem."],
              [FileText, "Nhớ em và theo em đến cùng", "Hồ sơ, danh sách nguyện vọng, mục tiêu và kế hoạch học được lưu trên máy em, cập nhật khi điểm đổi."],
            ].map(([Icon, tieuDe, moTa]) => {
              const I = Icon as typeof FileText;
              return (
                <div key={tieuDe as string} className="flex items-start gap-3">
                  <span className="size-9 rounded-xl grid place-items-center bg-xanh-nhat text-xanh shrink-0"><I size={18} /></span>
                  <p className="text-[14px] text-chu leading-snug"><b className="text-muc">{tieuDe as string}.</b> {moTa as string}</p>
                </div>
              );
            })}
          </div>
        </section>

        <DongThongBao tone="cam" icon={ShieldAlert} tieuDe="Những điều mình chưa có"
          moTa={<>
            <span className="block">- Điểm chuẩn năm nay chưa công bố: app dùng các năm trước và luôn ghi rõ năm.</span>
            <span className="block">- Học phí theo năm chỉ có ở {so(tk.hocPhi)} ngành, tỷ lệ có việc làm ở {so(tk.viecLam)} ngành. Các ngành còn lại, em xem trang học phí trong đề án.</span>
            <span className="block">- {so(tk.tong - tk.chinhThuc)} ngành lấy điểm từ trang tổng hợp, chưa đối chiếu được với đề án; trang chi tiết có ghi chưa kiểm chứng.</span>
            <span className="block">- Khung chương trình học chi tiết chưa có; mình dẫn tới trang ngành của trường khi tìm được.</span>
          </>} />

        <p className="text-[12px] text-chu-phu">Nhãn Thử sức, Vừa sức, An toàn, Dự phòng là gợi ý theo điểm chuẩn các năm trước, không phải xác suất trúng tuyển.</p>

        <section className="rounded-the bg-trang border border-vien p-3.5 flex items-start gap-3" aria-label="Báo sai lệch">
          <span className="size-10 rounded-xl grid place-items-center shrink-0 bg-do-nhat text-do"><AlertCircle size={20} /></span>
          <div className="flex-1 min-w-0">
            <b className="block text-[14px] text-muc">Báo số liệu sai lệch?</b>
            <p className="text-[13px] text-chu-phu leading-snug mt-0.5">Nếu em phát hiện điểm chuẩn, học phí hoặc thông tin nào sai so với đề án thực, hãy báo cho mình để cập nhật.</p>
            <p className="text-[13px] text-chu-phu leading-snug mt-1">Em thấy số sai ở ngành nào, mở trang ngành đó và bấm "Báo số liệu sai". Người phụ trách trường sẽ kiểm tra nguồn rồi sửa.</p>
            <a href={`mailto:${EMAIL_BAO_SAI}?subject=Góp ý dữ liệu - Nguyện Vọng AI`} className="inline-flex items-center min-h-11 text-[13px] font-bold text-do hover:underline">Góp ý khác qua email</a>
          </div>
        </section>

        <section className="rounded-the bg-trang border border-vien p-3.5 flex items-start gap-3" aria-label="Cùng cập nhật dữ liệu">
          <span className="size-10 rounded-xl grid place-items-center shrink-0 bg-luc-nhat text-luc"><Users size={20} /></span>
          <div className="flex-1 min-w-0">
            <b className="block text-[14px] text-muc">Bạn là sinh viên, thầy cô hay cán bộ tuyển sinh?</b>
            <p className="text-[13px] text-chu-phu leading-snug mt-0.5">Dữ liệu đổi mỗi năm và người trong trường nắm rõ nhất. Bạn giúp cập nhật cho trường mình, mọi thông tin đều qua duyệt và có nguồn.</p>
            <button type="button" onClick={() => nav(DUONG_DAN.dongGop())} className="inline-flex items-center min-h-11 text-[13px] font-bold text-xanh hover:underline">Đăng ký làm tình nguyện viên</button>
          </div>
        </section>

        <Nut onClick={() => nav(DUONG_DAN.khamPha())}>Về Khám phá</Nut>
      </NoiDung>
    </>
  );
}

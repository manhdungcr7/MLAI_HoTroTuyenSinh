// Màn 14 · Nhập điểm thi thử mới: 6 ô điểm, tổ hợp tự tính, ghi điểm và lưu ảnh chụp trước/sau để màn kết quả so sánh.
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Atom, BookOpen, Calculator, FlaskConical, Info, Languages, Leaf, type LucideIcon } from "lucide-react";
import { DauTrangCoQuayLai, NoiDung } from "@/components/layout/khung";
import { BieuTuongTron, NenHero } from "@/components/ui/hinh-nen";
import { Nut, gop } from "@/components/ui/nut-the";
import { DongThongBao } from "@/components/ui/thong-bao";
import { LUA_CHON_MAU, tim } from "@/data/lua-chon-mau";
import { DUONG_DAN } from "@/duong-dan";
import { homNay } from "@/state/chon";
import { useLuuCucBo } from "@/state/luu-cuc-bo";
import { diemHienTaiCuaTungMon, useApp } from "@/state/store";
import { CAC_MON, TEN_MON, TEN_MON_NGAN, TO_HOP, type LuaChon, type MaToHop, type MonId, type ToneTen } from "@/state/types";
import { ANH_TRONG, CAC_TO_HOP, chupTruocSau, dieuKienTuHoSo, docODiem, tongCacToHop, vietDiem, type AnhTruocSau, type Diem } from "./tinh-toan";

const O_MON: { mon: MonId; icon: LucideIcon; tone: ToneTen; neuCo?: boolean }[] = [
  { mon: "toan", icon: Calculator, tone: "xanh" },
  { mon: "nguVan", icon: BookOpen, tone: "cam" },
  { mon: "tiengAnh", icon: Languages, tone: "tim" },
  { mon: "vatLy", icon: Atom, tone: "do" },
  { mon: "hoaHoc", icon: FlaskConical, tone: "luc", neuCo: true },
  { mon: "sinh", icon: Leaf, tone: "luc", neuCo: true },
];
const MAU_TO_HOP: Record<MaToHop, string> = { A00: "text-xanh", A01: "text-luc-chu", D01: "text-tim-chu", B00: "text-cam-chu" };

export default function DiemThiThu() {
  const nav = useNavigate();
  const { s, themDiemThi } = useApp();
  const diemTruoc = useMemo(() => diemHienTaiCuaTungMon(s), [s]);
  const [chuoi, setChuoi] = useState<Record<MonId, string>>(() =>
    Object.fromEntries(CAC_MON.map((m) => [m, diemTruoc[m] === null ? "" : vietDiem(diemTruoc[m]!)])) as Record<MonId, string>);
  const [bao, setBao] = useState<{ tone: "do" | "cam"; chu: string } | null>(null);
  const [, datAnh] = useLuuCucBo<AnhTruocSau>("diem-thi-thu-truoc-sau", ANH_TRONG);
  const [diTiep, setDiTiep] = useState(false);
  // Chuyển trang SAU khi ảnh chụp đã được ghi vào máy (effect của useLuuCucBo chạy trước effect này).
  useEffect(() => { if (diTiep) nav(DUONG_DAN.diemThiThuKetQua()); }, [diTiep, nav]);

  const doc = useMemo(() => Object.fromEntries(CAC_MON.map((m) => [m, docODiem(chuoi[m])])) as Record<MonId, ReturnType<typeof docODiem>>, [chuoi]);
  const diemSau: Diem = useMemo(() => {
    const d = { ...diemTruoc };
    for (const m of CAC_MON) if (doc[m].gia !== null) d[m] = doc[m].gia;
    return d;
  }, [doc, diemTruoc]);
  const toHopTruoc = tongCacToHop(diemTruoc), toHopSau = tongCacToHop(diemSau);
  const maMucTieu: MaToHop = s.mucTieu?.maToHop ?? "A01";
  const soLoi = CAC_MON.filter((m) => doc[m].loi).length;

  const capNhat = () => {
    if (soLoi) return setBao({ tone: "do", chu: soLoi === 1 ? "Còn 1 ô điểm chưa đúng, em sửa lại nhé." : `Còn ${soLoi} ô điểm chưa đúng, em sửa lại nhé.` });
    const doi = CAC_MON.filter((m) => doc[m].gia !== null && doc[m].gia !== diemTruoc[m]);
    if (!doi.length) return setBao({ tone: "cam", chu: "Điểm chưa thay đổi so với lần trước, nên chưa có gì để cập nhật." });
    const coNv = s.nguyenVong.length > 0;
    const lcs = coNv ? s.nguyenVong.map(tim).filter((l): l is LuaChon => !!l) : LUA_CHON_MAU;
    datAnh(chupTruocSau({
      lcs, nguon: coNv ? "nguyenVong" : "goiY", diemTruoc, diemSau, maToHop: maMucTieu, toHop: s.mucTieu?.toHop ?? TO_HOP.A01,
      dk: dieuKienTuHoSo(s.hoSo), luc: new Date().toISOString(),
    }));
    const ngay = homNay();
    for (const m of doi) themDiemThi({ mon: m, diem: diemSau[m]!, ngay });
    setDiTiep(true);
  };

  return (
    <>
      <DauTrangCoQuayLai tieuDe="Điểm thi thử" quayLai={DUONG_DAN.nguyenVong()} />
      <NoiDung>
        <NenHero className="p-4">
          <h2 className="text-[22px] leading-tight font-extrabold text-muc">Nhập điểm thi thử mới</h2>
          <p className="text-[14px] text-chu mt-1">Nhập kết quả thi thử gần nhất của em. Điểm mới sẽ dùng để cập nhật gợi ý trường và nguyện vọng.</p>
        </NenHero>

        <section aria-labelledby="diem-mon">
          <h2 id="diem-mon" className="text-[16px] font-extrabold text-muc mb-2 mt-1">Điểm các môn <span className="font-semibold text-chu-phu text-[14px]">(thang 10)</span></h2>
          <div className="grid grid-cols-2 gap-2.5">
            {O_MON.map(({ mon, icon, tone, neuCo }) => {
              const loi = doc[mon].loi, gia = doc[mon].gia, truoc = diemTruoc[mon];
              const doi = !loi && gia !== null && gia !== truoc;
              return (
                <div key={mon} className={gop("rounded-the bg-trang border p-3 shadow-the", loi ? "border-do" : doi ? "border-luc/50" : "border-vien")}>
                  <label htmlFor={`dtt-${mon}`} className="flex items-center gap-2 mb-2">
                    <BieuTuongTron icon={icon} tone={tone} kichThuoc={32} />
                    <span className="text-[14px] font-bold text-chu leading-tight">{TEN_MON[mon]}{neuCo && <span className="block text-[11px] font-semibold text-chu-phu">nếu có</span>}</span>
                  </label>
                  <input id={`dtt-${mon}`} inputMode="decimal" autoComplete="off" placeholder="Ví dụ 7,5" value={chuoi[mon]}
                    aria-invalid={!!loi} aria-describedby={`dtt-${mon}-goi-y`}
                    onChange={(e) => { setChuoi((c) => ({ ...c, [mon]: e.target.value })); setBao(null); }}
                    className={gop("w-full min-h-12 rounded-xl border bg-trang px-3 text-[17px] font-bold text-muc focus:border-xanh", loi ? "border-do" : "border-vien")} />
                  <p id={`dtt-${mon}-goi-y`} className={gop("mt-1 text-[12px] leading-snug min-h-4", loi ? "text-do-chu font-semibold" : doi ? "text-luc-chu font-semibold" : "text-chu-phu")}>
                    {loi ?? (doi ? `Trước: ${truoc === null ? "chưa có" : vietDiem(truoc)} → ${vietDiem(gia!)}` : truoc === null ? "Chưa có điểm" : "Giữ như lần trước")}
                  </p>
                </div>
              );
            })}
          </div>
          <p className="text-[12px] text-chu-phu mt-1.5">Nhập số từ 0 đến 10, dùng dấu phẩy hoặc dấu chấm đều được. Để trống môn em không thi.</p>
        </section>

        <section aria-labelledby="to-hop-sau">
          <h2 id="to-hop-sau" className="text-[16px] font-extrabold text-muc mt-1">Tổ hợp xét tuyển sau khi nhập</h2>
          <p className="text-[13px] text-chu-phu mb-2">Tự tính điểm các tổ hợp phổ biến từ điểm em vừa nhập.</p>
          <div className="grid grid-cols-2 gap-2.5">
            {CAC_TO_HOP.map((ma) => {
              const sau = toHopSau[ma], truoc = toHopTruoc[ma].tong;
              const chenh = sau.tong !== null && truoc !== null ? Math.round((sau.tong - truoc) * 100) / 100 : null;
              return (
                <div key={ma} className={gop("rounded-the bg-trang border p-3 text-center shadow-the", ma === maMucTieu ? "border-xanh" : "border-vien")}>
                  <p className="text-[15px] font-extrabold text-muc">{ma}{ma === maMucTieu && <span className="ml-1 align-middle rounded-md bg-xanh-nhat px-1.5 text-[11px] text-xanh">mục tiêu</span>}</p>
                  <p className="text-[12px] text-chu-phu">{TO_HOP[ma].map((m) => TEN_MON_NGAN[m]).join(" – ")}</p>
                  {sau.tong === null
                    ? <p className="mt-1 text-[13px] font-semibold text-cam-chu">Thiếu {sau.thieu.map((m) => TEN_MON_NGAN[m]).join(", ")}</p>
                    : <p className={gop("mt-0.5 text-[24px] leading-tight font-extrabold", MAU_TO_HOP[ma])}>{sau.tong.toFixed(2)}</p>}
                  {chenh !== null && chenh !== 0 && (
                    <p className={gop("text-[12px] font-bold", chenh > 0 ? "text-luc-chu" : "text-do-chu")}>{chenh > 0 ? "▲ +" : "▼ "}{chenh} so với trước</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <DongThongBao tone="xanh" icon={Info} tieuDe="Điểm mới sẽ được dùng để cập nhật gợi ý trường và nguyện vọng của em."
          moTa="Mỗi môn có đổi được ghi thành một lần thi thử ngày hôm nay. Môn để trống giữ nguyên điểm cũ." />

        <div role="alert" aria-live="assertive" className="empty:hidden">
          {bao && (
            <p className={gop("rounded-xl px-3 py-2.5 text-[14px] font-semibold flex items-center gap-2", bao.tone === "do" ? "bg-do-nhat text-do-chu" : "bg-cam-nhat text-cam-chu")}>
              <AlertCircle size={18} className="shrink-0" />{bao.chu}
            </p>
          )}
        </div>
        <Nut muiTen onClick={capNhat}>Cập nhật kết quả</Nut>
      </NoiDung>
    </>
  );
}

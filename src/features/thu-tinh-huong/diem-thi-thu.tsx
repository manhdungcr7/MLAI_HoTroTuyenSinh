// Màn 14 · Nhập điểm thi thử mới: 6 ô điểm, tổ hợp tự tính, ghi điểm và lưu ảnh chụp trước/sau để màn kết quả so sánh.
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Atom, BookOpen, Calculator, FlaskConical, Languages, Leaf, type LucideIcon } from "lucide-react";
import { DauTrangCoQuayLai, NoiDung } from "@/components/layout/khung";
import { BieuTuongTron, NenHero } from "@/components/ui/hinh-nen";
import { Nut, gop } from "@/components/ui/nut-the";
import { tim } from "@/data/lua-chon-mau";
import { goiYDanhSach, moNeoNV1 } from "@/features/nguyen-vong/goi-y-danh-sach";
import { DUONG_DAN } from "@/duong-dan";
import { homNay } from "@/state/chon";
import { useLuuCucBo } from "@/state/luu-cuc-bo";
import { diemHienTaiCuaTungMon, useApp } from "@/state/store";
import { CAC_MON, TEN_MON, TEN_MON_NGAN, TO_HOP, type LuaChon, type MaToHop, type MonId, type ToneTen } from "@/state/types";
import { ANH_TRONG, CAC_TO_HOP, chonToHopHienThi, chupTruocSau, dieuKienTuHoSo, docODiem, tongCacToHop, vietDiem, type AnhTruocSau, type Diem } from "./tinh-toan";
import { dinhDangDiem } from "@/engine/dinh-dang";
import { ngayVN } from "@/features/muc-tieu/tinh-toan";
import { ChuThichLoaiDiem, NhanLoaiDiem } from "@/features/khoi-dau/loai-diem";

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
  const { s, themDiemThi, xoaDiemThi } = useApp();
  const [xoaDang, setXoaDang] = useState<number | null>(null);
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
  const { ma: maMucTieu, toHop: toHopMucTieu } = chonToHopHienThi(diemSau, s.mucTieu);
  /** Điểm đang dùng của từng môn đến từ đâu: lần thi thử gần nhất hay ô em nhập ở hồ sơ. */
  const nguonDiem = (m: MonId) => {
    const ds = s.diemThi.filter((d) => d.mon === m);
    return ds.length ? `thi thử ${ngayVN(ds.reduce((a, b) => (b.ngay >= a ? b.ngay : a), ds[0].ngay))}` : "em nhập ở hồ sơ";
  };
  const soLoi = CAC_MON.filter((m) => doc[m].loi).length;

  const capNhat = () => {
    if (soLoi) return setBao({ tone: "do", chu: soLoi === 1 ? "Còn 1 ô điểm chưa đúng, bạn sửa lại nhé." : `Còn ${soLoi} ô điểm chưa đúng, bạn sửa lại nhé.` });
    const doi = CAC_MON.filter((m) => doc[m].gia !== null && doc[m].gia !== diemTruoc[m]);
    if (!doi.length) return setBao({ tone: "cam", chu: "Điểm chưa thay đổi so với lần trước, nên chưa có gì để cập nhật." });
    const coNv = s.nguyenVong.length > 0;
    // Chưa có nguyện vọng thì so trên 8 ngành mình gợi ý theo điểm mới (không phải cả danh mục, để kết quả gọn và đọc được).
    const lcs = coNv ? s.nguyenVong.map(tim).filter((l): l is LuaChon => !!l) : goiYDanhSach({ ...diemSau, lichSu: null, diaLy: null, gdktpl: null, tinHoc: null, congNghe: null, ...s.hoSo.diemThem }, s.hoSo, [], undefined, moNeoNV1(s)).map((d) => d.lc);
    datAnh(chupTruocSau({
      lcs, nguon: coNv ? "nguyenVong" : "goiY", diemTruoc, diemSau, maToHop: maMucTieu, toHop: toHopMucTieu,
      dk: dieuKienTuHoSo(s.hoSo), luc: new Date().toISOString(), them: s.hoSo.diemThem,
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
          <NhanLoaiDiem loai="thiThu" className="mb-1.5" />
          <h2 className="text-[22px] leading-tight font-extrabold text-muc">Nhập điểm thi thử mới</h2>
          <p className="text-[14px] text-chu mt-1">Điểm mới sẽ cập nhật nhãn nguyện vọng và gợi ý. Chỉ nhập điểm bài thi thử thật, không nhập điểm mục tiêu ở đây.</p>
        </NenHero>
        <ChuThichLoaiDiem cacLoai={["thiThu", "mucTieu", "thiThat"]} />

        <section aria-labelledby="diem-mon">
          <h2 id="diem-mon" className="text-[16px] font-extrabold text-muc mb-2 mt-1">Điểm các môn <span className="font-semibold text-chu-phu text-[14px]">(thang 10)</span></h2>
          <div className="grid grid-cols-2 gap-2.5">
            {O_MON.map(({ mon, icon, tone, neuCo }) => {
              const loi = doc[mon].loi, gia = doc[mon].gia, truoc = diemTruoc[mon];
              const doi = !loi && gia !== null && gia !== truoc;
              return (
                <div key={mon} className={gop("rounded-the bg-trang border p-3 shadow-the", loi ? "border-do" : doi ? "border-luc" : "border-vien")}>
                  <label htmlFor={`dtt-${mon}`} className="flex items-center gap-2 mb-2">
                    <BieuTuongTron icon={icon} tone={tone} kichThuoc={32} />
                    <span className="text-[14px] font-bold text-chu leading-tight">{TEN_MON[mon]}{neuCo && <span className="block text-[12px] font-semibold text-chu-phu">nếu có</span>}</span>
                  </label>
                  <input id={`dtt-${mon}`} inputMode="decimal" enterKeyHint="next" autoComplete="off" placeholder="Ví dụ 7,5" value={chuoi[mon]}
                    aria-invalid={!!loi} aria-describedby={`dtt-${mon}-goi-y`}
                    onChange={(e) => { setChuoi((c) => ({ ...c, [mon]: e.target.value })); setBao(null); }}
                    className={gop("w-full min-h-12 rounded-xl border bg-trang px-3 text-[17px] font-bold text-muc focus:border-xanh", loi ? "border-do" : "border-vien")} />
                  <p id={`dtt-${mon}-goi-y`} className={gop("mt-1 text-[12px] leading-snug min-h-8", loi ? "text-do-chu font-semibold" : doi ? "text-luc-chu font-semibold" : "text-chu-phu")}>
                    {loi ?? (doi ? `Trước: ${truoc === null ? "chưa có" : vietDiem(truoc)} → ${vietDiem(gia!)}` : truoc === null ? "Chưa có điểm" : `Đang dùng ${vietDiem(truoc)} (${nguonDiem(mon)})`)}
                  </p>
                </div>
              );
            })}
          </div>
          <p className="text-[12px] text-chu-phu mt-1.5">Thang 10, dấu phẩy hay chấm đều được. Môn để trống giữ điểm cũ.</p>
        </section>

        <section aria-labelledby="to-hop-sau">
          <h2 id="to-hop-sau" className="text-[16px] font-extrabold text-muc mt-1 mb-2">Tổ hợp sau khi nhập</h2>
          <div className="grid grid-cols-2 gap-2.5">
            {CAC_TO_HOP.map((ma) => {
              const sau = toHopSau[ma], truoc = toHopTruoc[ma].tong;
              const chenh = sau.tong !== null && truoc !== null ? Math.round((sau.tong - truoc) * 100) / 100 : null;
              return (
                <div key={ma} className={gop("rounded-the bg-trang border p-3 text-center shadow-the", ma === maMucTieu ? "border-xanh" : "border-vien")}>
                  <p className="text-[15px] font-extrabold text-muc">{ma}{ma === maMucTieu && <span className="ml-1 align-middle rounded-md bg-xanh-nhat px-1.5 text-[12px] text-xanh">mục tiêu</span>}</p>
                  <p className="text-[12px] text-chu-phu">{TO_HOP[ma].map((m) => TEN_MON_NGAN[m]).join(" – ")}</p>
                  {sau.tong === null
                    ? <p className="mt-1 text-[13px] font-semibold text-cam-chu">Thiếu {sau.thieu.map((m) => TEN_MON_NGAN[m]).join(", ")}</p>
                    : <p className={gop("mt-0.5 text-[24px] leading-tight font-extrabold", MAU_TO_HOP[ma])}>{dinhDangDiem(sau.tong)}</p>}
                  {chenh !== null && chenh !== 0 && (
                    <p className={gop("text-[12px] font-bold", chenh > 0 ? "text-luc-chu" : "text-do-chu")}>{chenh > 0 ? "▲ +" : "▼ "}{chenh} so với trước</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <div role="alert" aria-live="assertive" className="empty:hidden">
          {bao && (
            <p className={gop("rounded-xl px-3 py-2.5 text-[14px] font-semibold flex items-center gap-2", bao.tone === "do" ? "bg-do-nhat text-do-chu" : "bg-cam-nhat text-cam-chu")}>
              <AlertCircle size={18} className="shrink-0" />{bao.chu}
            </p>
          )}
        </div>
        <Nut muiTen onClick={capNhat}>Cập nhật kết quả</Nut>

        {s.diemThi.length > 0 && (
          <details className="rounded-the bg-trang border border-vien px-3">
            <summary className="min-h-12 flex items-center justify-between text-[14px] font-bold text-muc cursor-pointer list-none">
              Lịch sử nhập điểm <span className="text-[13px] font-semibold text-chu-phu">{s.diemThi.length} lần · Xem</span>
            </summary>
            <ul className="space-y-2 pb-3">
              {s.diemThi.map((d, i) => ({ d, i })).sort((a, b) => (a.d.ngay === b.d.ngay ? b.i - a.i : a.d.ngay < b.d.ngay ? 1 : -1)).map(({ d, i }) => (
                <li key={i} className="rounded-xl bg-trang border border-vien px-3 py-2 flex items-center gap-2 min-h-12">
                  <span className="min-w-0 flex-1 text-[14px] text-chu">
                    <b className="text-muc">{TEN_MON[d.mon]}</b> {dinhDangDiem(d.diem)} điểm
                    <span className="block text-[12px] text-chu-phu">{ngayVN(d.ngay)}</span>
                  </span>
                  {xoaDang === i ? (
                    <span className="flex items-center gap-1.5">
                      <button type="button" onClick={() => { xoaDiemThi(i); setXoaDang(null); }} className="min-h-11 rounded-lg bg-do-nhat px-3 text-[13px] font-bold text-do-chu active:brightness-95">Xóa lần này</button>
                      <button type="button" onClick={() => setXoaDang(null)} className="min-h-11 rounded-lg border border-vien px-3 text-[13px] font-semibold text-chu">Giữ lại</button>
                    </span>
                  ) : (
                    <button type="button" onClick={() => setXoaDang(i)} aria-label={`Xóa lần thi thử ${TEN_MON[d.mon]} ngày ${ngayVN(d.ngay)}`} className="min-h-11 min-w-11 rounded-lg border border-vien px-3 text-[13px] font-semibold text-do-chu active:bg-do-nhat">Xóa</button>
                  )}
                </li>
              ))}
            </ul>
            <p className="text-[12px] text-chu-phu pb-3">Xóa lần nhập nhầm thì điểm quay về lần gần nhất còn lại.</p>
          </details>
        )}
      </NoiDung>
    </>
  );
}

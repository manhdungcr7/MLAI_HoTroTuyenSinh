import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, ExternalLink, GitCompareArrows, Heart, MapPin, Plus, School, Search, SearchX } from "lucide-react";
import { DauTrangCoQuayLai, NoiDung } from "@/components/layout/khung";
import { HuyHieuTruong } from "@/components/ui/hinh-nen";
import { HopTruot, KhungDangTai, KhungLoi, TrangThaiTrong } from "@/components/ui/hien-thi";
import { Nhan, Nut, gop } from "@/components/ui/nut-the";
import { LUA_CHON_MAU, tim } from "@/data/lua-chon-mau";
import { taiNguon, type NguonTaiSau } from "@/data/lua-chon-that";
import { DUONG_DAN } from "@/duong-dan";
import { dinhDangDiem } from "@/engine/dinh-dang";
import { useApp } from "@/state/store";
import { useKhoDuLieu } from "@/state/dung-kho-du-lieu";
import { kyHieu } from "@/features/kham-pha/thanh-phan";
import { ThongTinTruong } from "@/features/kham-pha/thong-tin-truong";
import { CHUA_CO, diemGhiThang, dungHoSoTruong, type DongChuongTrinh, type NganhHoSo } from "./ho-so";

const MOI_TRANG = 15;
type CheDo = "so-sanh" | "quan-tam" | "nguyen-vong";
const TIEU_DE_CHE_DO: Record<CheDo, string> = { "so-sanh": "Chọn ngành để so sánh", "quan-tam": "Chọn ngành để quan tâm", "nguyen-vong": "Chọn ngành để thêm nguyện vọng" };

const khoaCuon = (ma: string) => `nvai:cuon:truong:${ma}`;
const docCuon = (ma: string): { y: number; hien: number } | null => {
  try { const v = JSON.parse(sessionStorage.getItem(khoaCuon(ma)) ?? "null"); return v && typeof v.y === "number" ? v : null; } catch { return null; }
};

function Dong({ d, luu }: { d: DongChuongTrinh; luu: () => void }) {
  return (
    <li className="py-2.5">
      <Link to={DUONG_DAN.chiTiet(d.id)} onClick={luu} className="block min-h-11 rounded-lg active:bg-xanh-nhat -mx-1 px-1 py-0.5">
        <span className="flex items-start justify-between gap-3">
          <span className="min-w-0 text-[13px] text-chu-phu leading-snug">{d.phuongThuc}</span>
          <b className="shrink-0 text-[14px] text-muc tabular-nums text-right">{d.diem === null ? "Chưa có" : dinhDangDiem(d.diem)}</b>
        </span>
        <span className="block text-[12px] text-chu-phu leading-snug">
          {d.diem === null ? CHUA_CO : diemGhiThang(d, () => "").replace(/^\s*\(|\)\s*$/g, "")} ·<span className={d.nguonDiem === "chinh-thuc" ? "text-luc font-semibold" : "text-cam-chu font-semibold"}>{d.nhanNguon}</span>
        </span>
      </Link>
      <p className="text-[12px] text-chu-phu leading-snug mt-0.5">
        Tổ hợp: {d.toHop ? d.toHop.slice(0, 6).join(", ") + (d.toHop.length > 6 ? "…" : "") : "đề án chưa ghi"} · Học phí: {d.hocPhi ?? CHUA_CO}
      </p>
      {d.hocPhiGhiChu && <p className="text-[12px] text-cam-chu leading-snug">{d.hocPhiGhiChu}</p>}
      {d.theoNam.length > 1 && (
        <details className="mt-0.5">
          <summary className="min-h-11 flex items-center text-[12px] font-bold text-xanh cursor-pointer list-none">Điểm các năm trước</summary>
          <ul className="text-[12px] text-chu-phu pb-1">{d.theoNam.map(([n, v]) => <li key={n}>Năm {n}: <b className="text-chu tabular-nums">{dinhDangDiem(v)}</b>{d.thang ? ` (${d.thang})` : ""}</li>)}</ul>
        </details>
      )}
    </li>
  );
}

function TheNganh({ n, luu }: { n: NganhHoSo; luu: () => void }) {
  return (
    <li className="rounded-the bg-trang border border-vien p-3.5">
      <h3 className="text-[15px] font-extrabold text-muc leading-snug break-words">{n.ten}</h3>
      {n.coSo && <p className="flex items-center gap-1 text-[12px] text-chu-phu"><MapPin size={12} />Cơ sở {n.coSo}</p>}
      <ul className="mt-1 divide-y divide-vien">{n.dong.map((d) => <Dong key={d.id} d={d} luu={luu} />)}</ul>
    </li>
  );
}

export default function ManTruong() {
  const { ma = "" } = useParams();
  const nav = useNavigate();
  const kho = useKhoDuLieu();
  const { s, doiYeuThich, themNguyenVong, doiSoSanh } = useApp();
  const [nguon, setNguon] = useState<NguonTaiSau | null>(null);
  const [loiTai, setLoiTai] = useState(false);
  const [lanTai, setLanTai] = useState(0);
  useEffect(() => {
    let con = true; setLoiTai(false);
    taiNguon().then((m) => con && setNguon(m)).catch(() => con && setLoiTai(true));
    return () => { con = false; };
  }, [lanTai]);

  const hoSo = useMemo(() => dungHoSoTruong(ma, LUA_CHON_MAU, nguon?.truong[ma]?.docs), [ma, nguon, kho]);
  const tt = hoSo ? kho.layChiTietTruong(ma) : null;
  const tone = useMemo(() => LUA_CHON_MAU.find((l) => l.maTruong === ma)?.tone ?? "xanh", [ma]);

  const [coSoLoc, setCoSoLoc] = useState<string | null>(null);
  const [tuKhoa, setTuKhoa] = useState("");
  const [hien, setHien] = useState(() => docCuon(ma)?.hien ?? MOI_TRANG);
  const [che, setChe] = useState<CheDo | null>(null);
  const [locChon, setLocChon] = useState("");
  const [cho, setCho] = useState<string | null>(null); // id đang chờ xác nhận thêm nguyện vọng
  const [xong, setXong] = useState<string | null>(null);

  // Quay lại từ trang ngành: trả về đúng vị trí cuộn đã lưu.
  const sanSang = !!hoSo && hoSo.soChuongTrinh > 0;
  useEffect(() => {
    if (!sanSang) return;
    const v = docCuon(ma);
    if (v) { const t = setTimeout(() => window.scrollTo(0, v.y), 60); return () => clearTimeout(t); }
  }, [ma, sanSang]);
  const luu = () => { try { sessionStorage.setItem(khoaCuon(ma), JSON.stringify({ y: window.scrollY, hien })); } catch { /* bỏ qua */ } };

  if (!hoSo) {
    return (
      <>
        <DauTrangCoQuayLai tieuDe="Hồ sơ trường" quayLai={DUONG_DAN.khamPha()} />
        <NoiDung>
          <TrangThaiTrong bieuTuong={<SearchX size={28} />} tieuDe="Không tìm thấy trường này" moTa={`Mã trường "${ma.slice(0, 20)}" không có trong danh mục của ứng dụng. Có thể đường dẫn đã cũ hoặc gõ nhầm.`}>
            <Nut onClick={() => nav(DUONG_DAN.khamPha())}>Về Khám phá</Nut>
          </TrangThaiTrong>
        </NoiDung>
      </>
    );
  }

  const cacLoc = hoSo.nganh.filter((n) => (!coSoLoc || n.coSo === coSoLoc) && (!tuKhoa.trim() || n.ten.toLowerCase().includes(tuKhoa.trim().toLowerCase())));
  const tatCaDong = hoSo.nganh.flatMap((n) => n.dong.map((d) => ({ d, n })));
  const dsChon = tatCaDong.filter(({ d, n }) => !locChon.trim() || `${n.ten} ${d.phuongThuc}`.toLowerCase().includes(locChon.trim().toLowerCase())).slice(0, 40);
  const coHocPhi = tatCaDong.filter(({ d }) => d.hocPhi).length;
  const coDiem = tatCaDong.filter(({ d }) => d.diem !== null).length;
  const daLuu = (id: string) => s.yeuThich.includes(id);
  const dongCheDo = () => { setChe(null); setCho(null); setXong(null); setLocChon(""); };

  const chon = (id: string) => {
    if (che === "quan-tam") { if (!daLuu(id)) doiYeuThich(id); setXong(id); }
    else if (che === "so-sanh") {
      if (!s.soSanh.includes(id)) doiSoSanh(id);
      dongCheDo(); nav(DUONG_DAN.soSanh());
    } else setCho(id);
  };
  const choLc = cho ? tim(cho) : undefined;
  const xongLc = xong ? tim(xong) : undefined;

  const web = nguon?.truongNganh[ma];
  return (
    <>
      <DauTrangCoQuayLai tieuDe="Hồ sơ trường" />
      <NoiDung>
        <section className="rounded-lon bg-trang border border-vien shadow-the p-4">
          <div className="flex items-start gap-3">
            <HuyHieuTruong ten={kyHieu(hoSo.ma)} tone={tone} kichThuoc={56} />
            <div className="min-w-0 flex-1">
              <h2 className="text-[20px] font-extrabold text-muc leading-tight break-words">{hoSo.ten}</h2>
              <p className="text-[12px] text-chu-phu mt-0.5">Mã trường {hoSo.ma}</p>
            </div>
          </div>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-[13px]">
            <dt className="text-chu-phu">Loại hình</dt><dd className="text-chu min-w-0">{hoSo.loaiHinh}</dd>
            <dt className="text-chu-phu">Bậc</dt><dd className="text-chu min-w-0">{hoSo.bac.length ? hoSo.bac.join(", ") : CHUA_CO}</dd>
            <dt className="text-chu-phu">Địa điểm</dt><dd className="text-chu min-w-0">{hoSo.tinh.length ? hoSo.tinh.join(", ") : CHUA_CO}</dd>
            <dt className="text-chu-phu">Cơ sở</dt><dd className="text-chu min-w-0">{hoSo.coSo.length ? hoSo.coSo.join(", ") : "Không ghi cơ sở riêng trong dữ liệu"}</dd>
            <dt className="text-chu-phu">Chương trình</dt><dd className="text-chu min-w-0">{hoSo.soChuongTrinh} (có điểm: {coDiem}, có học phí: {coHocPhi})</dd>
          </dl>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Nut kieu="vien" bieuTuong={GitCompareArrows} className="!px-2" onClick={() => setChe("so-sanh")} disabled={!sanSang}>So sánh</Nut>
            <Nut kieu="vien" bieuTuong={Heart} className="!px-2" onClick={() => setChe("quan-tam")} disabled={!sanSang}>Quan tâm</Nut>
            <Nut bieuTuong={Plus} className="!px-2" onClick={() => setChe("nguyen-vong")} disabled={!sanSang}>Nguyện vọng</Nut>
          </div>
        </section>

        {!sanSang ? (
          <TrangThaiTrong bieuTuong={<School size={28} />} tieuDe="Chưa có chương trình nào của trường" moTa={`${CHUA_CO}. Trường có trong danh mục nhưng ứng dụng chưa có ngành hay điểm chuẩn của trường này.`}>
            <Nut kieu="vien" onClick={() => nav(DUONG_DAN.khamPha())}>Về Khám phá</Nut>
          </TrangThaiTrong>
        ) : (
          <>
            <section className="rounded-the bg-trang border border-vien p-4" aria-label="Phương thức và tổ hợp">
              <h2 className="text-[16px] font-extrabold text-muc">Phương thức và tổ hợp xét tuyển</h2>
              <p className="mt-1.5 text-[13px] text-chu leading-snug"><b>Phương thức:</b> {hoSo.phuongThuc.length ? hoSo.phuongThuc.join("; ") : CHUA_CO}</p>
              <p className="mt-1 text-[13px] text-chu leading-snug break-words"><b>Tổ hợp:</b> {hoSo.toHop.length ? hoSo.toHop.slice(0, 14).join(", ") + (hoSo.toHop.length > 14 ? `… (+${hoSo.toHop.length - 14})` : "") : "Đề án chưa ghi tổ hợp"}</p>
              <p className="mt-1.5 text-[12px] text-chu-phu leading-snug">Điểm mỗi phương thức có thang riêng, không so với nhau trực tiếp.</p>
            </section>

            <section aria-label="Danh sách ngành" className="space-y-2.5">
              <h2 className="text-[16px] font-extrabold text-muc">Ngành, điểm chuẩn và học phí</h2>
              <label className="flex items-center gap-2 rounded-xl bg-trang border border-vien px-3 min-h-11">
                <Search size={16} className="text-chu-phu shrink-0" />
                <input value={tuKhoa} onChange={(e) => { setTuKhoa(e.target.value); setHien(MOI_TRANG); }} placeholder="Tìm ngành của trường" aria-label="Tìm ngành của trường" className="flex-1 min-w-0 bg-transparent text-[14px] outline-none py-2" />
              </label>
              {hoSo.coSo.length > 1 && (
                <div className="flex flex-wrap gap-1.5" role="group" aria-label="Lọc theo cơ sở">
                  {[null, ...hoSo.coSo].map((c) => (
                    <button key={c ?? "tat-ca"} type="button" aria-pressed={coSoLoc === c} onClick={() => { setCoSoLoc(c); setHien(MOI_TRANG); }}
                      className={gop("min-h-11 rounded-full px-3.5 text-[13px] font-bold border cursor-pointer", coSoLoc === c ? "bg-xanh text-white border-xanh" : "bg-trang text-chu border-vien")}>
                      {c ?? "Tất cả"}
                    </button>
                  ))}
                </div>
              )}
              {cacLoc.length === 0 ? (
                <p className="rounded-the bg-trang border border-vien p-4 text-[14px] text-chu-phu">Không có ngành nào khớp. Thử bỏ bộ lọc.</p>
              ) : (
                <ul className="space-y-2.5">{cacLoc.slice(0, hien).map((n) => <TheNganh key={n.khoa} n={n} luu={luu} />)}</ul>
              )}
              {cacLoc.length > hien && <Nut kieu="vien" onClick={() => setHien(hien + MOI_TRANG)}>{`Xem thêm (còn ${cacLoc.length - hien})`}</Nut>}
            </section>

            <section className="rounded-the bg-trang border border-vien p-4" aria-label="Tuyển sinh chính thức">
              <h2 className="text-[16px] font-extrabold text-muc">Tài liệu tuyển sinh chính thức</h2>
              {!nguon && !loiTai && <div className="mt-2"><KhungDangTai cao="h-12" /></div>}
              {loiTai && <div className="mt-2"><KhungLoi moTa="Chưa tải được liên kết đề án." thuLai={() => setLanTai((n) => n + 1)} /></div>}
              {nguon && (
                <ul className="mt-1">
                  {tt?.websiteTuyenSinh && <li><a href={tt.websiteTuyenSinh} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 min-h-11 text-[14px] font-bold text-xanh hover:underline"><ExternalLink size={14} />Website tuyển sinh của trường</a></li>}
                  {web && <li><a href={web.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 min-h-11 text-[14px] font-bold text-xanh hover:underline"><ExternalLink size={14} />{web.tieuDe || "Trang chương trình đào tạo của trường"}</a></li>}
                  {hoSo.linkDeAn.map((d) => <li key={d.url}><a href={d.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 min-h-11 text-[14px] font-bold text-xanh hover:underline"><ExternalLink size={14} />Đề án tuyển sinh {d.nam} (toàn văn)</a></li>)}
                  {!tt?.websiteTuyenSinh && !web && hoSo.linkDeAn.length === 0 && <li className="py-2 text-[14px] text-chu-phu">{CHUA_CO}.</li>}
                </ul>
              )}
            </section>

            <ThongTinTruong tt={tt} />
          </>
        )}
      </NoiDung>

      <HopTruot mo={che !== null} dong={dongCheDo} tieuDe={cho ? "Thêm vào Nguyện vọng?" : xong ? "Đã lưu quan tâm" : che ? TIEU_DE_CHE_DO[che] : ""}>
        {cho && choLc ? (
          <div className="space-y-3">
            <p className="text-[14px] text-chu leading-snug"><b>{choLc.nganh}</b> – {choLc.tenTruong}</p>
            {s.nguyenVong.includes(cho) ? <p className="text-[13px] text-chu-phu">Ngành này đã có trong danh sách nguyện vọng.</p> : <p className="text-[13px] text-chu-phu">Ngành sẽ được thêm vào cuối danh sách. Bạn có thể đổi thứ tự sau.</p>}
            <Nut bieuTuong={CheckCircle2} onClick={() => { themNguyenVong(cho); dongCheDo(); nav(DUONG_DAN.nguyenVong()); }}>{s.nguyenVong.includes(cho) ? "Xem nguyện vọng" : "Thêm nguyện vọng"}</Nut>
            <Nut kieu="nhe" onClick={() => setCho(null)}>Chọn ngành khác</Nut>
          </div>
        ) : xong && xongLc ? (
          <div className="space-y-3">
            <p className="text-[14px] text-chu leading-snug"><b>{xongLc.nganh}</b> đã nằm trong danh sách quan tâm của bạn.</p>
            <Nut kieu="vien" onClick={() => setXong(null)}>Chọn thêm ngành</Nut>
            <Nut kieu="nhe" onClick={dongCheDo}>Xong</Nut>
          </div>
        ) : (
          <div className="space-y-2">
            <label className="flex items-center gap-2 rounded-xl bg-nen border border-vien px-3 min-h-11">
              <Search size={16} className="text-chu-phu shrink-0" />
              <input value={locChon} onChange={(e) => setLocChon(e.target.value)} placeholder="Tìm ngành" aria-label="Tìm ngành để chọn" className="flex-1 min-w-0 bg-transparent text-[14px] outline-none py-2" />
            </label>
            <ul className="max-h-[50vh] overflow-y-auto divide-y divide-vien">
              {dsChon.map(({ d, n }) => (
                <li key={d.id}>
                  <button type="button" onClick={() => chon(d.id)} className="w-full min-h-11 text-left py-2 cursor-pointer active:bg-xanh-nhat rounded-lg">
                    <span className="block text-[14px] font-bold text-muc leading-snug break-words">{n.ten}{n.coSo ? ` · CS ${n.coSo}` : ""}</span>
                    <span className="block text-[12px] text-chu-phu">{d.phuongThuc}{che === "so-sanh" && s.soSanh.includes(d.id) ? " · đang chọn" : ""}{che === "quan-tam" && daLuu(d.id) ? " · đã quan tâm" : ""}</span>
                  </button>
                </li>
              ))}
              {dsChon.length === 0 && <li className="py-3 text-[14px] text-chu-phu">Không có ngành khớp.</li>}
            </ul>
            {tatCaDong.length > 40 && <Nhan tone="xanh">Hiện 40 dòng đầu, gõ tên ngành để lọc</Nhan>}
          </div>
        )}
      </HopTruot>
    </>
  );
}

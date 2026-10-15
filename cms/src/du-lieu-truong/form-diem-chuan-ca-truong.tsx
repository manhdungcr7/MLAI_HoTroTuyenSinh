// Nhập điểm chuẩn CẢ TRƯỜNG một lượt: bảng các chương trình, điền điểm ngành nào có, một nguồn chung. Mỗi dòng thành một bản ghi riêng
// đi qua quy trình duyệt như mọi mục khác. Dành cho mùa tuyển sinh, khi trường công bố cả bảng điểm chuẩn cùng lúc.
import { useEffect, useMemo, useState } from "react";
import { LoiApi, thongBaoLoi } from "@cms/may-chu/api";
import { doiTrangThai, taoBanGhi } from "@cms/may-chu/ban-ghi-api";
import { HopTruot } from "@cms/thanh-phan/ui/hien-thi";
import { OInput, Truong } from "@cms/thanh-phan/ui/nhap-lieu";
import { Nut } from "@cms/thanh-phan/ui/nut-the";
import { entityIdDiemChuan, kiemTraHangLoat, taiChuongTrinh, type ChuongTrinhTruong } from "./chuong-trinh";
import { THONG_BAO_LUU, type MucTieuLuu } from "./luu-ban-ghi";
import { khoaNhap } from "@cms/trang-thai/ban-nhap";
import { useBanNhap } from "@cms/trang-thai/dung-ban-nhap";
import { ThanhBanNhap } from "@cms/trang-thai/thanh-ban-nhap";
import { usePhien } from "@cms/trang-thai/phien";

/** Phần nhập được lưu nháp (không gồm ô tìm ngành). */
interface NhapCaTruong { nam: string; diem: Record<string, string>; nguon: { link: string; tieuDe: string; donVi: string }; ghiChu: string }

function laNhapCaTruong(v: unknown): v is NhapCaTruong {
  if (typeof v !== "object" || v === null) return false;
  const r = v as Record<string, unknown>;
  const n = r.nguon as Record<string, unknown> | undefined;
  const d = r.diem as Record<string, unknown> | undefined;
  return typeof r.nam === "string" && typeof r.ghiChu === "string"
    && typeof n === "object" && n !== null && typeof n.link === "string" && typeof n.tieuDe === "string" && typeof n.donVi === "string"
    && typeof d === "object" && d !== null && Object.values(d).every((x) => typeof x === "string");
}

const dinhDang = (n: number | null) => (n === null ? "chưa có" : String(n).replace(".", ","));

export function HopFormDiemChuanCaTruong({ maTruong, tenTruong, laQtv, dong, onXong }: {
  maTruong: string; tenTruong: string; laQtv: boolean; dong: () => void; onXong: (thongBao: string) => void;
}) {
  const [ds, setDs] = useState<ChuongTrinhTruong[] | null>(null);
  const [nam, setNam] = useState(String(new Date().getFullYear() - (new Date().getMonth() >= 8 ? 0 : 1)));
  const [diem, setDiem] = useState<Record<string, string>>({});
  const [nguon, setNguon] = useState({ link: "", tieuDe: "", donVi: tenTruong });
  const [ghiChu, setGhiChu] = useState("Cập nhật điểm chuẩn theo thông báo của trường");
  const [loi, setLoi] = useState<Record<string, string>>({});
  const [loiChung, setLoiChung] = useState<string | null>(null);
  const [dang, setDang] = useState(false);
  const [tim, setTim] = useState("");
  const { toi } = usePhien();
  const banNhap = useBanNhap<NhapCaTruong>(khoaNhap("diem-chuan-ca-truong", maTruong), toi.email, laNhapCaTruong, { nam, diem, nguon, ghiChu });

  useEffect(() => { void taiChuongTrinh(maTruong).then(setDs).catch(() => setDs([])); }, [maTruong]);
  const hien = useMemo(() => (ds ?? []).filter((c) => !tim.trim() || c.nganh.toLowerCase().includes(tim.trim().toLowerCase())), [ds, tim]);
  const soDien = Object.values(diem).filter((v) => v.trim() !== "").length;

  const luu = async (muc: MucTieuLuu) => {
    setLoiChung(null);
    const namSo = Number(nam);
    const l: Record<string, string> = {};
    if (!Number.isInteger(namSo) || namSo < 2015 || namSo > 2100) l.nam = "Nhập năm tuyển sinh, ví dụ 2026.";
    if (!/^https:\/\/\S+\.\S+/.test(nguon.link.trim())) l.link = "Dán link bắt đầu bằng https://, ví dụ trang công bố điểm chuẩn của trường.";
    if (nguon.tieuDe.trim().length < 3) l.tieuDe = "Ghi tên trang hoặc văn bản nguồn, ít nhất 3 chữ.";
    if (nguon.donVi.trim().length < 2) l.donVi = "Ghi ai công bố, ví dụ tên trường.";
    if (ghiChu.trim().length < 3) l.ghiChu = "Ghi ngắn gọn bạn cập nhật gì.";
    const kt = kiemTraHangLoat((ds ?? []).map((c) => ({ chuongTrinhId: c.id, diem: diem[c.id] ?? "" })));
    if (kt.hopLe.length === 0 && Object.keys(kt.loi).length === 0) l.chung = "Bạn chưa điền điểm ngành nào.";
    setLoi({ ...l, ...kt.loi });
    if (Object.keys(l).length || Object.keys(kt.loi).length) return;

    setDang(true);
    let xong = 0, boQua = 0;
    const loiDong: string[] = [];
    try {
      for (const d of kt.hopLe) {
        const entityId = entityIdDiemChuan(maTruong, namSo, d.chuongTrinhId, "THPT", "TATCA");
        try {
          let b = await taoBanGhi({
            entityType: "cutoff_score", entityId,
            data: { id: d.chuongTrinhId, tenNganh: (ds ?? []).find((c) => c.id === d.chuongTrinhId)?.nganh, maTruong, maNganh: "", nam: namSo, phuongThuc: "THPT", toHop: "TATCA", diemChuan: d.diem },
            source: { url: nguon.link.trim(), tieuDe: nguon.tieuDe.trim(), donViCongBo: nguon.donVi.trim() }, changeNote: ghiChu.trim(),
          });
          if (muc !== "nhap") b = await doiTrangThai(b.id, "SUBMITTED");
          if (muc === "duyet") await doiTrangThai(b.id, "APPROVED");
          xong++;
        } catch (e) {
          if (e instanceof LoiApi && e.status === 409) boQua++;
          else {
            loiDong.push(`${(ds ?? []).find((c) => c.id === d.chuongTrinhId)?.nganh ?? d.chuongTrinhId}: ${thongBaoLoi(e)}`);
            if (e instanceof LoiApi && (e.status === 401 || e.status === 403 || e.status === 429)) break;
          }
        }
      }
    } finally { setDang(false); }
    if (loiDong.length) { setLoiChung(`Đã lưu ${xong} ngành. Còn ${loiDong.length} ngành lỗi: ${loiDong.slice(0, 2).join("; ")}${boQua ? `. ${boQua} ngành đã có sẵn nên bỏ qua.` : ""}`); return; }
    banNhap.xong();
    onXong(`${THONG_BAO_LUU[muc]} (${xong} ngành${boQua ? `, bỏ qua ${boQua} ngành đã có điểm chuẩn năm ${namSo}` : ""}).`);
  };

  return (
    <HopTruot mo dong={dong} tieuDe="Nhập điểm chuẩn cả trường">
      <div className="space-y-3.5 pb-2">
        <p className="text-[13px] text-chu-phu leading-snug">Điền điểm chuẩn THPT (thang 30) của các ngành trường đã công bố, để trống ngành chưa có. Một nguồn chung cho cả bảng; mỗi ngành thành một mục riêng để người duyệt đối chiếu.</p>
        {banNhap.cho && (
          <ThanhBanNhap
            luuLuc={banNhap.cho.luuLuc}
            khoiPhuc={() => {
              const du = banNhap.khoiPhuc();
              if (!du) return;
              setNam(du.nam); setDiem(du.diem); setNguon(du.nguon); setGhiChu(du.ghiChu);
            }}
            bo={banNhap.bo}
          />
        )}
        <div className="grid grid-cols-2 gap-2.5">
          <Truong nhan="Năm tuyển sinh" batBuoc htmlFor="ct-nam" loi={loi.nam}><OInput id="ct-nam" inputMode="numeric" value={nam} onChange={(e) => setNam(e.target.value)} /></Truong>
          <Truong nhan="Tìm ngành" htmlFor="ct-tim"><OInput id="ct-tim" value={tim} onChange={(e) => setTim(e.target.value)} placeholder="Tên ngành" /></Truong>
        </div>
        <fieldset className="space-y-3 rounded-xl border border-vien p-3 min-w-0">
          <legend className="px-1 text-[14px] font-extrabold text-muc">Nguồn kiểm chứng (bắt buộc)</legend>
          <Truong nhan="Link nguồn" batBuoc htmlFor="ct-link" loi={loi.link}><OInput id="ct-link" inputMode="url" value={nguon.link} onChange={(e) => setNguon({ ...nguon, link: e.target.value })} placeholder="https://" /></Truong>
          <Truong nhan="Tên trang hoặc văn bản nguồn" batBuoc htmlFor="ct-tieude" loi={loi.tieuDe}><OInput id="ct-tieude" value={nguon.tieuDe} onChange={(e) => setNguon({ ...nguon, tieuDe: e.target.value })} /></Truong>
          <Truong nhan="Ai công bố" batBuoc htmlFor="ct-donvi" loi={loi.donVi}><OInput id="ct-donvi" value={nguon.donVi} onChange={(e) => setNguon({ ...nguon, donVi: e.target.value })} /></Truong>
        </fieldset>
        <Truong nhan="Ghi chú thay đổi" batBuoc htmlFor="ct-ghichu" loi={loi.ghiChu}><OInput id="ct-ghichu" value={ghiChu} onChange={(e) => setGhiChu(e.target.value)} /></Truong>

        <div>
          <p className="text-[14px] font-extrabold text-muc mb-1.5">Các ngành ({ds ? ds.length : "đang tải"}) · đã điền {soDien}</p>
          {ds === null ? <p className="text-[13px] text-chu-phu">Đang tải danh sách ngành…</p>
            : ds.length === 0 ? <p className="rounded-xl bg-cam-nhat p-3 text-[13px] text-cam-chu">Chưa có danh sách ngành của trường này trong dữ liệu gốc.</p>
              : (
                <ul className="divide-y divide-vien rounded-xl border border-vien">
                  {hien.map((c) => (
                    <li key={c.id} className="flex items-center gap-2 p-2.5">
                      <label htmlFor={`d-${c.id}`} className="min-w-0 flex-1">
                        <span className="block text-[14px] font-semibold text-chu leading-snug">{c.nganh}</span>
                        <span className="block text-[12px] text-chu-phu">Đang có: {c.namMoiNhat ? `${c.namMoiNhat}, ` : ""}{dinhDang(c.diemMoiNhat)}</span>
                        {loi[c.id] && <span role="alert" className="block text-[12px] font-semibold text-do-chu">{loi[c.id]}</span>}
                      </label>
                      <OInput id={`d-${c.id}`} inputMode="decimal" className="w-24 shrink-0 text-center" placeholder="26,5" value={diem[c.id] ?? ""} onChange={(e) => setDiem({ ...diem, [c.id]: e.target.value })} aria-invalid={!!loi[c.id]} />
                    </li>
                  ))}
                </ul>
              )}
        </div>
        {(loi.chung || loiChung) && <p role="alert" className="rounded-xl bg-do-nhat p-3 text-[13px] font-semibold text-do-chu">{loi.chung ?? loiChung}</p>}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Nut kieu="vien" onClick={() => void luu("nhap")} disabled={dang || soDien === 0}>Lưu nháp</Nut>
          <Nut onClick={() => void luu("gui")} disabled={dang || soDien === 0}>{dang ? "Đang lưu" : `Gửi duyệt ${soDien} ngành`}</Nut>
        </div>
        {laQtv && <Nut kieu="nhe" onClick={() => void luu("duyet")} disabled={dang || soDien === 0}>Duyệt luôn</Nut>}
      </div>
    </HopTruot>
  );
}

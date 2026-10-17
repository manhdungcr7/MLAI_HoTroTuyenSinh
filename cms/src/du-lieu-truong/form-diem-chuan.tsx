// Biểu mẫu điểm chuẩn của một ngành (loại bản ghi cutoff_score). Cùng quy trình: lưu nháp, gửi duyệt, duyệt, xuất bản.
import { useEffect, useState } from "react";
import { LoiApi, thongBaoLoi } from "@cms/may-chu/api";
import type { BanGhiCms } from "@cms/may-chu/ban-ghi-api";
import { HopTruot } from "@cms/thanh-phan/ui/hien-thi";
import { OChon, OInput, Truong } from "@cms/thanh-phan/ui/nhap-lieu";
import { Nut } from "@cms/thanh-phan/ui/nut-the";
import { luuVaChuyen, THONG_BAO_LUU, type MucTieuLuu } from "./luu-ban-ghi";
import { entityIdDiemChuan, taiChuongTrinh, type ChuongTrinhTruong } from "./chuong-trinh";
import { khoaNhap, laDoiTuongChuoi } from "@cms/trang-thai/ban-nhap";
import { useBanNhap } from "@cms/trang-thai/dung-ban-nhap";
import { ThanhBanNhap } from "@cms/trang-thai/thanh-ban-nhap";
import { usePhien } from "@cms/trang-thai/phien";

interface F { chuongTrinhId: string; maNganh: string; nam: string; phuongThuc: string; toHop: string; diemChuan: string; tieuChiPhu: string; linkNguon: string; tieuDeNguon: string; donViCongBo: string; ghiChuThayDoi: string }

const PHUONG_THUC = [
  { gia: "THPT", nhan: "Điểm thi tốt nghiệp THPT" },
  { gia: "DGNL", nhan: "Đánh giá năng lực" },
  { gia: "HOC_BA", nhan: "Xét học bạ" },
  { gia: "KHAC", nhan: "Phương thức khác" },
];

const CAC_KHOA_F: readonly string[] = ["chuongTrinhId", "maNganh", "nam", "phuongThuc", "toHop", "diemChuan", "tieuChiPhu", "linkNguon", "tieuDeNguon", "donViCongBo", "ghiChuThayDoi"];

const so = (s: string): number => Number(s.trim().replace(",", "."));

export function kiemTraDiemChuan(f: F): Record<string, string> {
  const l: Record<string, string> = {};
  if (!f.chuongTrinhId) l.chuongTrinhId = "Chọn chương trình (ngành) của trường.";
  if (f.maNganh.trim() && !/^[A-Za-z0-9]{3,20}$/.test(f.maNganh.trim())) l.maNganh = "Mã ngành gồm chữ và số, 3 đến 20 ký tự. Ví dụ: 7480201.";
  const nam = so(f.nam);
  if (!Number.isInteger(nam) || nam < 2015 || nam > 2100) l.nam = "Nhập năm tuyển sinh, ví dụ 2025.";
  if (!f.toHop.trim() || f.toHop.trim().length > 20) l.toHop = "Ghi tổ hợp xét tuyển, ví dụ A00. Nếu không có tổ hợp, ghi KHONG.";
  const d = so(f.diemChuan);
  const toiDa = f.phuongThuc === "DGNL" ? 1200 : 30;
  if (f.diemChuan.trim() === "" || !Number.isFinite(d) || d < 0 || d > toiDa) l.diemChuan = `Điểm chuẩn từ 0 đến ${toiDa}. Dùng dấu phẩy hoặc chấm cho số lẻ.`;
  if (!/^https:\/\/\S+\.\S+/.test(f.linkNguon.trim())) l.linkNguon = "Dán link nguồn bắt đầu bằng https://, ví dụ trang điểm chuẩn của trường.";
  if (f.tieuDeNguon.trim().length < 3) l.tieuDeNguon = "Ghi tên trang hoặc văn bản nguồn, ít nhất 3 chữ.";
  if (f.donViCongBo.trim().length < 2) l.donViCongBo = "Ghi ai công bố, ví dụ tên trường.";
  if (f.ghiChuThayDoi.trim().length < 3) l.ghiChuThayDoi = "Ghi ngắn gọn bạn thêm hoặc sửa gì, và vì sao.";
  return l;
}

const KHOA_MAY_CHU: Record<string, string> = { "source.url": "linkNguon", "source.tieuDe": "tieuDeNguon", "source.donViCongBo": "donViCongBo", changeNote: "ghiChuThayDoi" };

export function HopFormDiemChuan({ maTruong, tenTruong, ban, laQtv, dong, onXong }: {
  maTruong: string; tenTruong: string; ban?: BanGhiCms; laQtv: boolean; dong: () => void; onXong: (m: string) => void;
}) {
  const [f, setF] = useState<F>(() => {
    const d = (ban?.data ?? {}) as Record<string, unknown>;
    const c = (k: string) => (d[k] === undefined || d[k] === null ? "" : String(d[k]));
    return {
      chuongTrinhId: c("id"), maNganh: c("maNganh"), nam: c("nam") || String(new Date().getFullYear() - 1), phuongThuc: c("phuongThuc") || "THPT", toHop: c("toHop"), diemChuan: c("diemChuan"), tieuChiPhu: c("tieuChiPhu"),
      linkNguon: ban?.source.url ?? "", tieuDeNguon: ban?.source.tieuDe ?? "", donViCongBo: ban?.source.donViCongBo ?? tenTruong, ghiChuThayDoi: "",
    };
  });
  const [loi, setLoi] = useState<Record<string, string>>({});
  const [loiMay, setLoiMay] = useState<string | null>(null);
  const [dang, setDang] = useState(false);
  const [daLuu, setDaLuu] = useState<BanGhiCms | null>(null);
  const { toi } = usePhien();
  const banNhap = useBanNhap<F>(khoaNhap("diem-chuan", `${maTruong}:${ban?.id ?? "moi"}`), toi.email, laDoiTuongChuoi<F>(CAC_KHOA_F), f);
  const [dsCt, setDsCt] = useState<ChuongTrinhTruong[] | null>(null);
  useEffect(() => { void taiChuongTrinh(maTruong).then(setDsCt).catch(() => setDsCt([])); }, [maTruong]);
  const dat = (k: keyof F) => (e: { target: { value: string } }) => setF((c) => ({ ...c, [k]: e.target.value }));

  const luu = async (muc: MucTieuLuu) => {
    setLoiMay(null);
    const l = kiemTraDiemChuan(f);
    if (Object.keys(l).length) { setLoi(l); return; }
    setLoi({});
    setDang(true);
    try {
      const nam = so(f.nam);
      const maNganh = f.maNganh.trim().toUpperCase();
      const entityId = ban?.entityId ?? entityIdDiemChuan(maTruong, nam, f.chuongTrinhId, f.phuongThuc, f.toHop.trim().toUpperCase());
      // `id` là mã chương trình trong dữ liệu gốc: nhờ đó điểm chuẩn này ghép đúng vào ngành học sinh đang xem.
      const data: Record<string, unknown> = {
        loaiDiem: "diem_chuan", ...(f.phuongThuc === "THPT" ? { thangDiem: 30 } : {}),
        id: f.chuongTrinhId, tenNganh: dsCt?.find((c) => c.id === f.chuongTrinhId)?.nganh ?? (ban?.data as Record<string, unknown> | undefined)?.tenNganh, maTruong, maNganh, nam, phuongThuc: f.phuongThuc, toHop: f.toHop.trim().toUpperCase(), diemChuan: so(f.diemChuan),
        ...(f.tieuChiPhu.trim() && { tieuChiPhu: f.tieuChiPhu.trim() }),
      };
      await luuVaChuyen({
        hien: daLuu ?? ban ?? null, entityType: "cutoff_score", entityId, data,
        nguon: { url: f.linkNguon.trim(), tieuDe: f.tieuDeNguon.trim(), donViCongBo: f.donViCongBo.trim() },
        ghiChu: f.ghiChuThayDoi.trim(), muc, onBuoc: setDaLuu,
      });
      banNhap.xong();
      onXong(THONG_BAO_LUU[muc]);
    } catch (e) {
      if (e instanceof LoiApi && e.chiTiet) setLoi(Object.fromEntries(Object.entries(e.chiTiet).map(([k, v]) => [KHOA_MAY_CHU[k] ?? k, v])));
      if (e instanceof LoiApi && e.status === 409 && /^Đã có (bản ghi|một bản)|Thực thể này đã có/.test(e.message)) {
        setLoiMay("Điểm chuẩn này (cùng ngành, năm, phương thức, tổ hợp) đã có. Đóng cửa sổ, mở mục đó trong danh sách và bấm Sửa.");
      } else setLoiMay(thongBaoLoi(e) + (daLuu ? " Nội dung đã lưu thành bản nháp; bạn bấm lại để tiếp tục." : ""));
    } finally { setDang(false); }
  };

  const khoa = Boolean(ban); // đã có thì không đổi ngành, năm, phương thức, tổ hợp vì đó là định danh của mục
  return (
    <HopTruot mo dong={dong} tieuDe={`${ban ? "Sửa" : "Thêm"} điểm chuẩn`}>
      <div className="space-y-3.5 pb-2">
        {banNhap.cho && (
          <ThanhBanNhap luuLuc={banNhap.cho.luuLuc} khoiPhuc={() => { const du = banNhap.khoiPhuc(); if (du) setF(du); }} bo={banNhap.bo} />
        )}
        {ban?.status === "PUBLISHED" && <p className="rounded-xl bg-cam-nhat p-3 text-[13px] text-cam-chu font-semibold">Mục này đang chạy trên web. Sửa xong sẽ tạo bản mới, phải được duyệt rồi xuất bản thì web mới đổi.</p>}
        {ban?.status === "REJECTED" && ban.rejectionReason && <p className="rounded-xl bg-do-nhat p-3 text-[13px] text-do-chu"><b>Lý do bị trả lại:</b> {ban.rejectionReason}</p>}
        <div className="grid grid-cols-2 gap-2.5">
          <Truong nhan="Năm tuyển sinh" batBuoc htmlFor="dc-nam" loi={loi.nam}><OInput id="dc-nam" inputMode="numeric" value={f.nam} onChange={dat("nam")} disabled={khoa} /></Truong>
          <Truong nhan="Mã ngành của Bộ" htmlFor="dc-nganh" loi={loi.maNganh} goiY="Không bắt buộc."><OInput id="dc-nganh" value={f.maNganh} onChange={dat("maNganh")} placeholder="7480201" /></Truong>
        </div>
        <Truong nhan="Chương trình (ngành)" batBuoc htmlFor="dc-ct" loi={loi.chuongTrinhId}>
          <OChon id="dc-ct" value={f.chuongTrinhId} onChange={dat("chuongTrinhId")} disabled={khoa}>
            <option value="">{dsCt === null ? "Đang tải danh sách…" : "Chọn chương trình"}</option>
            {f.chuongTrinhId && !(dsCt ?? []).some((c) => c.id === f.chuongTrinhId) && <option value={f.chuongTrinhId}>{f.chuongTrinhId}</option>}
            {(dsCt ?? []).map((c) => <option key={c.id} value={c.id}>{c.nganh}{c.namMoiNhat ? ` (đang có ${c.namMoiNhat}: ${String(c.diemMoiNhat).replace(".", ",")})` : ""}</option>)}
          </OChon>
        </Truong>
        <Truong nhan="Phương thức xét tuyển" batBuoc htmlFor="dc-pt">
          <OChon id="dc-pt" value={f.phuongThuc} onChange={dat("phuongThuc")} disabled={khoa}>{PHUONG_THUC.map((p) => <option key={p.gia} value={p.gia}>{p.nhan}</option>)}</OChon>
        </Truong>
        <div className="grid grid-cols-2 gap-2.5">
          <Truong nhan="Tổ hợp" batBuoc htmlFor="dc-th" loi={loi.toHop}><OInput id="dc-th" value={f.toHop} onChange={dat("toHop")} placeholder="A00" disabled={khoa} /></Truong>
          <Truong nhan="Điểm chuẩn" batBuoc htmlFor="dc-diem" loi={loi.diemChuan}><OInput id="dc-diem" inputMode="decimal" value={f.diemChuan} onChange={dat("diemChuan")} placeholder="26,5" /></Truong>
        </div>
        <Truong nhan="Tiêu chí phụ" htmlFor="dc-phu" goiY="Nếu trường có xét thêm điều kiện khi bằng điểm."><OInput id="dc-phu" value={f.tieuChiPhu} onChange={dat("tieuChiPhu")} /></Truong>
        <fieldset className="space-y-3 rounded-xl border border-vien p-3 min-w-0">
          <legend className="px-1 text-[14px] font-extrabold text-muc">Nguồn kiểm chứng (bắt buộc)</legend>
          <Truong nhan="Link nguồn" batBuoc htmlFor="dc-link" loi={loi.linkNguon}><OInput id="dc-link" inputMode="url" value={f.linkNguon} onChange={dat("linkNguon")} placeholder="https://" /></Truong>
          <Truong nhan="Tên trang hoặc văn bản nguồn" batBuoc htmlFor="dc-tieude" loi={loi.tieuDeNguon}><OInput id="dc-tieude" value={f.tieuDeNguon} onChange={dat("tieuDeNguon")} /></Truong>
          <Truong nhan="Ai công bố" batBuoc htmlFor="dc-donvi" loi={loi.donViCongBo}><OInput id="dc-donvi" value={f.donViCongBo} onChange={dat("donViCongBo")} /></Truong>
        </fieldset>
        <Truong nhan="Ghi chú thay đổi" batBuoc htmlFor="dc-ghichu" loi={loi.ghiChuThayDoi} goiY="Bạn thêm hoặc sửa gì, vì sao. Người duyệt sẽ đọc dòng này.">
          <OInput id="dc-ghichu" value={f.ghiChuThayDoi} onChange={dat("ghiChuThayDoi")} />
        </Truong>
        {loiMay && <p role="alert" className="rounded-xl bg-do-nhat p-3 text-[13px] font-semibold text-do-chu">{loiMay}</p>}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Nut kieu="vien" onClick={() => void luu("nhap")} disabled={dang}>Lưu nháp</Nut>
          <Nut onClick={() => void luu("gui")} disabled={dang}>{dang ? "Đang lưu" : "Gửi duyệt"}</Nut>
        </div>
        {laQtv && <Nut kieu="nhe" onClick={() => void luu("duyet")} disabled={dang}>Duyệt luôn</Nut>}
      </div>
    </HopTruot>
  );
}

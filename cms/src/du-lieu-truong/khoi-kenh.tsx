// Khối "Kênh chính thức": website tuyển sinh, fanpage, nhóm tuyển sinh, nhóm sinh viên.
// Lưu thành một bản ghi CMS loại "school" (mỗi trường một bản ghi), cũng qua gửi duyệt rồi xuất bản như mọi mục khác.
import { useState } from "react";
import { ExternalLink, Globe, Pencil } from "lucide-react";
import { LoiApi, thongBaoLoi } from "@cms/may-chu/api";
import type { BanGhiCms } from "@cms/may-chu/ban-ghi-api";
import { OInput, Truong } from "@cms/thanh-phan/ui/nhap-lieu";
import { Nhan, Nut, The } from "@cms/thanh-phan/ui/nut-the";
import { kiemTraBanGhiTruong } from "@/data/dong-gop-kiem-tra";
import { luuVaChuyen, THONG_BAO_LUU, type MucTieuLuu } from "./luu-ban-ghi";
import { NHAN_TT, TONE_TT } from "./mo-hinh";

const CAC_KENH = [
  { khoa: "websiteTuyenSinhUrl", nhan: "Website tuyển sinh", mau: "https://tuyensinh.ten-truong.edu.vn" },
  { khoa: "fanpageUrl", nhan: "Fanpage Facebook", mau: "https://facebook.com/ten-truong" },
  { khoa: "nhomTuyenSinhChinhThucUrl", nhan: "Nhóm tuyển sinh do trường lập", mau: "Link nhóm Zalo hoặc Facebook" },
  { khoa: "nhomCongDongUrl", nhan: "Nhóm sinh viên, review", mau: "https://facebook.com/groups/..." },
] as const;
type KhoaKenh = (typeof CAC_KENH)[number]["khoa"];
type FormKenh = Record<KhoaKenh, string>;

const tuBan = (b?: BanGhiCms | null): FormKenh => {
  const d = (b?.data ?? {}) as Record<string, unknown>;
  const c = (k: string) => (typeof d[k] === "string" ? (d[k] as string) : "");
  return { websiteTuyenSinhUrl: c("websiteTuyenSinhUrl") || c("websiteTuyenSinh"), fanpageUrl: c("fanpageUrl"), nhomTuyenSinhChinhThucUrl: c("nhomTuyenSinhChinhThucUrl"), nhomCongDongUrl: c("nhomCongDongUrl") };
};

export function KhoiKenh({ maTruong, tenTruong, ban, duocSua, laQtv, moSan, onDaLuu }: {
  maTruong: string; tenTruong: string; ban?: BanGhiCms; duocSua: boolean; laQtv: boolean; moSan?: boolean; onDaLuu: (thongBao: string) => void;
}) {
  const [sua, setSua] = useState(Boolean(moSan));
  const [form, setForm] = useState<FormKenh>(() => tuBan(ban));
  const [loiO, setLoiO] = useState<Record<string, string>>({});
  const [loiChung, setLoiChung] = useState<string | null>(null);
  const [dangLuu, setDangLuu] = useState(false);
  const [daLuu, setDaLuu] = useState<BanGhiCms | null>(null);

  const mo = () => { setForm(tuBan(ban)); setLoiO({}); setLoiChung(null); setSua(true); };
  const hienTai = tuBan(ban);
  const sua_duoc_ban = !ban || ban.status === "DRAFT" || ban.status === "REJECTED" || ban.status === "PUBLISHED";

  const luu = async (muc: MucTieuLuu) => {
    setLoiO({}); setLoiChung(null);
    const kt = kiemTraBanGhiTruong({ maTruong, ...form });
    if (!kt.ok) { setLoiO(kt.loi); return; }
    const d = kt.duLieu;
    const link = d.websiteTuyenSinhUrl ?? d.fanpageUrl ?? d.nhomTuyenSinhChinhThucUrl ?? d.nhomCongDongUrl;
    if (!link) { setLoiChung("Bạn cần nhập ít nhất một kênh."); return; }
    setDangLuu(true);
    try {
      const data: Record<string, unknown> = { ...d, id: maTruong, ...(d.websiteTuyenSinhUrl && { websiteTuyenSinh: d.websiteTuyenSinhUrl }) };
      await luuVaChuyen({
        hien: daLuu ?? ban ?? null, entityType: "school", entityId: maTruong, data,
        nguon: { url: link, tieuDe: `Kênh chính thức của ${tenTruong}`, donViCongBo: tenTruong },
        ghiChu: ban ? "Cập nhật kênh chính thức của trường" : "Thêm kênh chính thức của trường", muc, onBuoc: setDaLuu,
      });
      setSua(false);
      setDaLuu(null);
      onDaLuu(THONG_BAO_LUU[muc]);
    } catch (e) {
      if (e instanceof LoiApi && e.chiTiet) setLoiO(e.chiTiet);
      setLoiChung(thongBaoLoi(e) + (daLuu ? " Nội dung đã lưu thành bản nháp; bạn bấm lại để tiếp tục." : ""));
    } finally {
      setDangLuu(false);
    }
  };

  return (
    <The className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-extrabold text-[16px] text-muc flex items-center gap-2 min-w-0">
          <Globe size={18} className="text-xanh shrink-0" /> Kênh chính thức
          {ban && <Nhan tone={TONE_TT[ban.status]}>{NHAN_TT[ban.status]}</Nhan>}
        </h2>
        {duocSua && !sua && sua_duoc_ban && (
          <button type="button" onClick={mo} className="min-h-11 px-2 text-[14px] font-bold text-xanh inline-flex items-center gap-1.5 shrink-0"><Pencil size={14} /> Sửa</button>
        )}
      </div>
      {ban?.status === "REJECTED" && ban.rejectionReason && (
        <p className="rounded-xl bg-do-nhat p-2.5 text-[13px] text-do-chu"><b>Lý do trả lại:</b> {ban.rejectionReason}</p>
      )}
      {ban && !sua_duoc_ban && <p className="text-[13px] text-chu-phu">Đang chờ duyệt nên chưa sửa được.</p>}

      {sua ? (
        <div className="space-y-3">
          <p className="text-[13px] text-chu-phu">Dán link thật của trường. Ô nào chưa có thì để trống. Link này cũng là nguồn kiểm chứng.</p>
          {CAC_KENH.map((k) => (
            <Truong key={k.khoa} nhan={k.nhan} htmlFor={`kenh-${k.khoa}`} loi={loiO[k.khoa]}>
              <OInput id={`kenh-${k.khoa}`} inputMode="url" value={form[k.khoa]} placeholder={k.mau}
                onChange={(e) => setForm({ ...form, [k.khoa]: e.target.value })} />
            </Truong>
          ))}
          {loiChung && <p role="alert" className="rounded-xl bg-do-nhat p-3 text-[13px] font-semibold text-do-chu">{loiChung}</p>}
          <div className="grid grid-cols-2 gap-2">
            <Nut kieu="vien" onClick={() => void luu("nhap")} disabled={dangLuu}>Lưu nháp</Nut>
            <Nut onClick={() => void luu("gui")} disabled={dangLuu}>{dangLuu ? "Đang lưu" : "Gửi duyệt"}</Nut>
          </div>
          {laQtv && <Nut kieu="nhe" onClick={() => void luu("duyet")} disabled={dangLuu}>Duyệt luôn</Nut>}
          <Nut kieu="vien" onClick={() => setSua(false)} disabled={dangLuu}>Đóng</Nut>
        </div>
      ) : (
        <ul className="divide-y divide-vien">
          {CAC_KENH.map((k) => {
            const url = hienTai[k.khoa];
            return (
              <li key={k.khoa} className="py-2 flex items-center justify-between gap-3 min-h-11">
                <span className="text-[14px] text-chu-phu shrink-0">{k.nhan}</span>
                {url ? (
                  <a href={url} target="_blank" rel="noreferrer" className="text-[14px] text-xanh font-semibold truncate inline-flex items-center gap-1 min-w-0">
                    <span className="truncate">{url.replace(/^https?:\/\/(www\.)?/, "")}</span> <ExternalLink size={12} className="shrink-0" />
                  </a>
                ) : <span className="text-[13px] text-cam-chu font-semibold">Chưa có</span>}
              </li>
            );
          })}
        </ul>
      )}
    </The>
  );
}

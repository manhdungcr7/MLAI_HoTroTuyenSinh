import type { ReactNode } from "react";
import { ExternalLink, Home, Award, Megaphone, MessageSquareQuote, School, Users } from "lucide-react";
import type { DuLieuTruongHopNhat } from "@/engine/du-lieu-tuyen-sinh/hop-nhat";
import type { NguonKiemChung, SnapshotCongDong } from "@/engine/du-lieu-tuyen-sinh/kieu";
import { dinhDang } from "@/engine/dinh-dang";

function Nguon({ n }: { n?: NguonKiemChung }) {
  if (!n?.url) return null;
  return (
    <a href={n.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 min-h-11 text-[13px] font-bold text-xanh hover:underline">
      <ExternalLink size={13} />Nguồn: {n.tieuDe || n.donViCongBo}
    </a>
  );
}

const NHAN_CONG_DONG = "Thông tin cộng đồng cung cấp, chưa phải số liệu chính thức";
const chu = (v: unknown, toiDa = 600) => (typeof v === "string" ? v.slice(0, toiDa) : "");
const cap = (v: unknown): [number, number] | null => (Array.isArray(v) && typeof v[0] === "number" && typeof v[1] === "number" ? [v[0], v[1]] : null);
const nghin = (c: [number, number]) => (c[0] === c[1] ? `${c[0].toLocaleString("vi-VN")}` : `${c[0].toLocaleString("vi-VN")} – ${c[1].toLocaleString("vi-VN")}`);
const TEN_NGUOI_VIET: Record<string, string> = { sinh_vien: "sinh viên", cuu_sinh_vien: "cựu sinh viên", phu_huynh: "phụ huynh" };

/** Một dòng chữ mô tả nơi lưu trú do cộng đồng cung cấp. Dữ liệu lạ hình thì bỏ qua phần đó, không đoán. */
export function moTaNoiLuuTru(n: Record<string, unknown>): string {
  const p: string[] = [];
  if (n.coKyTucXa === "co") p.push("Có ký túc xá");
  else if (n.coKyTucXa === "khong") p.push("Không có ký túc xá");
  const ktx = cap(n.giaKyTucThang);
  if (ktx) p.push(`ký túc xá khoảng ${nghin(ktx)} nghìn đồng/tháng`);
  if (n.khuTroXungQuanh === "nhieu") p.push("xung quanh có nhiều nhà trọ");
  else if (n.khuTroXungQuanh === "it") p.push("xung quanh ít nhà trọ");
  else if (n.khuTroXungQuanh === "khong") p.push("xung quanh gần như không có nhà trọ");
  const tro = cap(n.giaTroThang);
  if (tro) p.push(`phòng trọ khoảng ${nghin(tro)} nghìn đồng/tháng`);
  if (typeof n.khoangCachKm === "number") p.push(`cách trường ${n.khoangCachKm} km`);
  const ghi = chu(n.ghiChu, 300);
  const dau = p.length ? `${p.join(", ")}.`.replace(/^./, (c) => c.toUpperCase()) : "";
  return [dau, ghi && `${ghi}${/[.!?]$/.test(ghi) ? "" : "."}`].filter(Boolean).join(" ");
}

function CongDong({ ds }: { ds: SnapshotCongDong[] }) {
  const ktx = ds.filter((c) => c.loai === "noi_luu_tru").slice(0, 2);
  const review = ds.filter((c) => c.loai === "review").slice(0, 3);
  const luuY = ds.filter((c) => c.loai === "luu_y").slice(0, 3);
  if (!ktx.length && !review.length && !luuY.length) return null;
  return (
    <div className="rounded-xl bg-nen p-3 space-y-3" aria-label="Thông tin cộng đồng">
      <p className="flex items-start gap-1.5 text-[12px] font-semibold text-cam-chu leading-snug"><Users size={14} className="shrink-0 mt-px" />{NHAN_CONG_DONG}</p>
      {ktx.length > 0 && (
        <div>
          <Tieu icon={Home}>Nơi ở quanh trường <span className="font-semibold text-chu-phu">(do sinh viên cung cấp)</span></Tieu>
          <ul className="mt-1 divide-y divide-vien">{ktx.map((c) => <li key={c.id} className="py-2"><p className="text-[14px] text-chu leading-snug">{moTaNoiLuuTru(c.noiDung)}</p><Nguon n={c.nguon} /></li>)}</ul>
        </div>
      )}
      {review.length > 0 && (
        <div>
          <Tieu icon={MessageSquareQuote}>Người trong cuộc nói gì</Tieu>
          <ul className="mt-1 divide-y divide-vien">{review.map((c) => (
            <li key={c.id} className="py-2">
              <b className="text-[14px] text-muc">{chu(c.noiDung.tieuDe, 120)}</b>
              <p className="text-[13px] text-chu leading-snug">{chu(c.noiDung.noiDung)}</p>
              <p className="text-[12px] text-chu-phu">{TEN_NGUOI_VIET[String(c.noiDung.nguoiVietLa)] ? `Người viết: ${TEN_NGUOI_VIET[String(c.noiDung.nguoiVietLa)]}. ` : ""}Là ý kiến cá nhân.</p>
              <Nguon n={c.nguon} />
            </li>))}</ul>
        </div>
      )}
      {luuY.length > 0 && (
        <div>
          <Tieu icon={Megaphone}>Lưu ý khi nộp hồ sơ</Tieu>
          <ul className="mt-1 divide-y divide-vien">{luuY.map((c) => (
            <li key={c.id} className="py-2"><b className="text-[14px] text-muc">{chu(c.noiDung.tieuDe, 120)}</b><p className="text-[13px] text-chu leading-snug">{chu(c.noiDung.noiDung)}</p><Nguon n={c.nguon} /></li>))}</ul>
        </div>
      )}
    </div>
  );
}

const Tieu = ({ icon: Icon, children }: { icon: typeof Home; children: ReactNode }) => (
  <h3 className="flex items-center gap-2 text-[14px] font-extrabold text-muc"><Icon size={16} className="text-xanh" />{children}</h3>
);

/**
 * Thông tin cấp trường từ bản CMS đã xuất bản: ký túc xá, học bổng, kênh chính thức, thông báo.
 * Mọi dòng đều kèm nguồn; trường nào chưa có thì nói chưa có, không điền thay.
 */
export function ThongTinTruong({ tt }: { tt: DuLieuTruongHopNhat | null }) {
  const kenh = tt ? (([["Trang tuyển sinh", tt.websiteTuyenSinh], ["Fanpage", tt.fanpageUrl], ["Nhóm tuyển sinh của trường", tt.nhomChinhThucUrl], ["Nhóm Zalo", tt.nhomZaloUrl], ["Nhóm sinh viên (cộng đồng)", tt.nhomCongDongUrl]] as [string, string | undefined][]).filter((k): k is [string, string] => !!k[1])) : [];
  const ktx = tt?.kyTucXa;
  const coGi = !!tt && (kenh.length > 0 || !!ktx || tt.hocBong.length > 0 || tt.thongBao.length > 0 || !!tt.hocPhiMoiNhat || tt.congDong.length > 0);
  return (
    <section className="rounded-the bg-trang border border-vien shadow-the p-4 space-y-3" aria-label="Thông tin của trường">
      <h2 className="flex items-center gap-2 text-[16px] font-extrabold text-muc"><School size={18} />Thông tin của trường</h2>
      {!coGi && <p className="text-[14px] text-chu-phu leading-snug">Chưa có thông tin ký túc xá, học bổng hay kênh chính thức đã được xác minh cho trường này. Có tin mới, em sẽ thấy ở đây.</p>}
      {kenh.length > 0 && (
        <div>
          <ul className="flex flex-wrap gap-x-4">
            {kenh.map(([ten, url]) => <li key={ten}><a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center min-h-11 text-[14px] font-bold text-xanh hover:underline">{ten}</a></li>)}
          </ul>
          <Nguon n={tt?.nguonTruong} />
        </div>
      )}
      {ktx && (
        <div>
          <Tieu icon={Home}>Nơi lưu trú</Tieu>
          <p className="mt-1 text-[14px] text-chu leading-snug">
            {ktx.coKyTuc ? "Có ký túc xá." : "Chưa có ký túc xá."}
            {ktx.giaThangMin !== undefined && ` Khoảng ${dinhDang(ktx.giaThangMin, 1)}${ktx.giaThangMax !== undefined && ktx.giaThangMax !== ktx.giaThangMin ? `–${dinhDang(ktx.giaThangMax, 1)}` : ""} triệu/tháng.`}
            {ktx.ghiChu && ` ${ktx.ghiChu}.`}
          </p>
          <Nguon n={tt?.nguonTruong} />
        </div>
      )}
      {tt?.hocPhiMoiNhat && (
        <p className="text-[14px] text-chu leading-snug">Học phí cấp trường{tt.hocPhiMoiNhat.phamVi ? ` (${tt.hocPhiMoiNhat.phamVi})` : ""} năm {tt.hocPhiMoiNhat.nam}: {dinhDang(tt.hocPhiMoiNhat.mucThap, 1)}{tt.hocPhiMoiNhat.mucCao !== tt.hocPhiMoiNhat.mucThap ? `–${dinhDang(tt.hocPhiMoiNhat.mucCao, 1)}` : ""} {tt.hocPhiMoiNhat.donVi === "trieu_tin_chi" ? "triệu/tín chỉ" : "triệu/năm"}. <Nguon n={tt.hocPhiMoiNhat.nguon} /></p>
      )}
      {tt && tt.hocBong.length > 0 && (
        <div>
          <Tieu icon={Award}>Học bổng</Tieu>
          <ul className="mt-1 divide-y divide-vien">
            {tt.hocBong.map((h) => (
              <li key={h.id} className="py-2">
                <b className="text-[14px] text-muc">{h.tenHocBong}</b>
                <p className="text-[13px] text-chu leading-snug">{h.giaTri}. Điều kiện: {h.dieuKien}.{h.hanNop && ` Hạn nộp: ${h.hanNop}.`}</p>
                <Nguon n={h.nguon} />
              </li>
            ))}
          </ul>
        </div>
      )}
      {tt && tt.thongBao.length > 0 && (
        <div>
          <Tieu icon={Megaphone}>Thông báo tuyển sinh</Tieu>
          <ul className="mt-1 divide-y divide-vien">
            {tt.thongBao.map((t) => (
              <li key={t.id} className="py-2">
                <b className="text-[14px] text-muc">{t.tieuDe}</b>
                <p className="text-[13px] text-chu leading-snug">{t.tomTat}</p>
                <Nguon n={t.nguon} />
              </li>
            ))}
          </ul>
        </div>
      )}
      {tt && <CongDong ds={tt.congDong} />}
    </section>
  );
}

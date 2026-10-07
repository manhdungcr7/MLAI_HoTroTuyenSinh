import { ExternalLink, Home, Award, Megaphone, School } from "lucide-react";
import type { DuLieuTruongHopNhat } from "@/engine/du-lieu-tuyen-sinh/hop-nhat";
import type { NguonKiemChung } from "@/engine/du-lieu-tuyen-sinh/kieu";
import { dinhDang } from "@/engine/dinh-dang";

function Nguon({ n }: { n?: NguonKiemChung }) {
  if (!n?.url) return null;
  return (
    <a href={n.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 min-h-11 text-[13px] font-bold text-xanh hover:underline">
      <ExternalLink size={13} />Nguồn: {n.tieuDe || n.donViCongBo}
    </a>
  );
}

const Tieu = ({ icon: Icon, children }: { icon: typeof Home; children: string }) => (
  <h3 className="flex items-center gap-2 text-[14px] font-extrabold text-muc"><Icon size={16} className="text-xanh" />{children}</h3>
);

/**
 * Thông tin cấp trường từ bản CMS đã xuất bản: ký túc xá, học bổng, kênh chính thức, thông báo.
 * Mọi dòng đều kèm nguồn; trường nào chưa có thì nói chưa có, không điền thay.
 */
export function ThongTinTruong({ tt }: { tt: DuLieuTruongHopNhat | null }) {
  const kenh = tt ? (([["Trang tuyển sinh", tt.websiteTuyenSinh], ["Fanpage", tt.fanpageUrl], ["Nhóm Zalo", tt.nhomZaloUrl]] as [string, string | undefined][]).filter((k): k is [string, string] => !!k[1])) : [];
  const ktx = tt?.kyTucXa;
  const coGi = !!tt && (kenh.length > 0 || !!ktx || tt.hocBong.length > 0 || tt.thongBao.length > 0 || !!tt.hocPhiMoiNhat);
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
        <p className="text-[14px] text-chu leading-snug">Học phí cấp trường năm {tt.hocPhiMoiNhat.nam}: {dinhDang(tt.hocPhiMoiNhat.mucThap, 1)}–{dinhDang(tt.hocPhiMoiNhat.mucCao, 1)} triệu/năm. <Nguon n={tt.hocPhiMoiNhat.nguon} /></p>
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
    </section>
  );
}

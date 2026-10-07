// "Xem thay đổi": đặt bản này cạnh bản đang chạy (nếu có) để người duyệt thấy đúng ô nào đổi.
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { layMotBanGhi, type BanGhiCms } from "@cms/may-chu/ban-ghi-api";
import { useTai } from "@cms/trang-thai/dung-tai";
import { KhungDangTai, KhungLoi } from "@cms/thanh-phan/ui/hien-thi";
import { gop } from "@cms/thanh-phan/ui/nut-the";
import { soSanhBan } from "@cms/du-lieu-truong/so-sanh";

function NoiDungSoSanh({ ban }: { ban: BanGhiCms }) {
  const truoc = ban.previousVersionId;
  const cu = useTai<BanGhiCms | null>(() => (truoc ? layMotBanGhi(truoc) : Promise.resolve(null)), truoc ?? "");
  if (cu.dangTai && !cu.du && truoc) return <KhungDangTai cao="h-16" />;
  if (cu.loi) return <KhungLoi tieuDe="Chưa tải được bản cũ" moTa={cu.loi} thuLai={cu.taiLai} />;
  const dong = soSanhBan(cu.du ?? null, ban);
  return (
    <div className="space-y-2">
      <p className="text-[13px] text-chu-phu">{cu.du ? `So với bản ${cu.du.version} đang chạy` : "Mục mới, chưa có bản cũ để so sánh"}</p>
      {dong.length === 0 ? <p className="text-[13px] text-chu">Nội dung không đổi, chỉ đổi nguồn hoặc ghi chú.</p> : (
        <ul className="space-y-2">
          {dong.map((d) => (
            <li key={d.khoa} className="rounded-xl bg-nen p-2.5 text-[13.5px] space-y-0.5">
              <p className="font-bold text-chu">{d.nhan}</p>
              {cu.du && <p className="text-do-chu line-through break-words">{d.cu}</p>}
              <p className="text-luc-chu font-semibold break-words">{d.moi}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function SoSanhBan({ ban }: { ban: BanGhiCms }) {
  const [mo, setMo] = useState(false);
  return (
    <div>
      <button type="button" aria-expanded={mo} onClick={() => setMo(!mo)} className="min-h-11 w-full flex items-center justify-between gap-2 text-[14px] font-bold text-xanh">
        <span>{mo ? "Ẩn thay đổi" : "Xem thay đổi"}</span>
        <ChevronDown size={18} className={gop("transition-transform", mo && "rotate-180")} />
      </button>
      {mo && <NoiDungSoSanh ban={ban} />}
    </div>
  );
}

// Khai báo điểm ưu tiên khu vực và đối tượng (không bắt buộc). Điểm xét tuyển thật = tổng ba môn + điểm ưu tiên,
// nên bỏ sót phần này làm học sinh vùng khó khăn hoặc diện chính sách bị đánh giá thấp hơn thực tế.
import { useState } from "react";
import { ChevronDown, Scale } from "lucide-react";
import { gop } from "@/components/ui/nut-the";
import { OChon } from "@/components/ui/nhap-lieu";
import { MUC_DOI_TUONG, MUC_KHU_VUC, TEN_DOI_TUONG, TEN_KHU_VUC, mucUuTien, type DoiTuongUuTien, type KhuVucUuTien } from "@/engine/diem-uu-tien";
import type { HoSo } from "@/state/types";
import { dinhDang, dinhDangDiem } from "@/engine/dinh-dang";

export default function DiemUuTien({ h, sua }: { h: HoSo; sua: (p: Partial<HoSo>) => void }) {
  const u = h.uuTienTuyenSinh ?? { khuVuc: null, doiTuong: null };
  const [mo, setMo] = useState(Boolean(u.khuVuc || u.doiTuong));
  const muc = mucUuTien(u);
  const dat = (p: Partial<typeof u>) => sua({ uuTienTuyenSinh: { ...u, ...p } });

  return (
    <section className="rounded-the border border-vien bg-trang">
      <button type="button" onClick={() => setMo(!mo)} aria-expanded={mo} aria-controls="bd-uu-tien" className="w-full min-h-14 flex items-center gap-3 px-4 text-left">
        <span className="size-9 rounded-xl grid place-items-center bg-cam-nhat text-cam-chu shrink-0"><Scale size={18} /></span>
        <span className="flex-1">
          <b className="block text-[15px] text-chu">Điểm ưu tiên khu vực, đối tượng</b>
          {muc > 0 && <span className="block text-[13px] font-bold text-cam-chu">+{dinhDangDiem(muc)} điểm ưu tiên</span>}
        </span>
        <ChevronDown size={20} className={gop("text-chu-phu transition-transform", mo && "rotate-180")} />
      </button>
      {mo && (
        <div id="bd-uu-tien" className="px-4 pb-4 border-t border-vien pt-3 space-y-3">
          <div>
            <label htmlFor="bd-ut-kv" className="block text-[14px] font-bold text-chu mb-1.5">Khu vực ưu tiên</label>
            <OChon id="bd-ut-kv" value={u.khuVuc ?? ""} onChange={(e) => dat({ khuVuc: (e.target.value || null) as KhuVucUuTien | null })}>
              <option value="">Bạn chưa biết hoặc chưa chọn</option>
              {(Object.keys(MUC_KHU_VUC) as KhuVucUuTien[]).map((k) => <option key={k} value={k}>{TEN_KHU_VUC[k]} · +{dinhDangDiem(MUC_KHU_VUC[k])}</option>)}
            </OChon>
          </div>
          <div>
            <label htmlFor="bd-ut-dt" className="block text-[14px] font-bold text-chu mb-1.5">Đối tượng ưu tiên</label>
            <OChon id="bd-ut-dt" value={u.doiTuong ?? ""} onChange={(e) => dat({ doiTuong: (e.target.value || null) as DoiTuongUuTien | null })}>
              <option value="">Bạn chưa biết hoặc chưa chọn</option>
              {(Object.keys(MUC_DOI_TUONG) as DoiTuongUuTien[]).map((k) => <option key={k} value={k}>{TEN_DOI_TUONG[k]}{MUC_DOI_TUONG[k] > 0 ? ` · +${dinhDang(MUC_DOI_TUONG[k], 0)}` : ""}</option>)}
            </OChon>
          </div>
        </div>
      )}
    </section>
  );
}

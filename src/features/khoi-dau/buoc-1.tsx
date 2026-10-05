import { Flag, GraduationCap, Layers, Lightbulb, MapPin, School, UserRound } from "lucide-react";
import { OChon, OInput } from "@/components/ui/nhap-lieu";
import { gop } from "@/components/ui/nut-the";
import type { HoSo } from "@/state/types";
import { GIAI_DOAN, MUC_TIEU_HIEN_TAI, NGANH, THANH_PHO, TINH } from "./lua-chon";
import { CauHoi, ChonO, TieuDeBuoc } from "./thanh-phan";
import type { TruongBatBuoc } from "./tinh-toan";

/** id ô đầu tiên của từng trường bắt buộc, để đưa con trỏ tới khi còn thiếu. */
export const ID_TRUONG: Record<TruongBatBuoc, string> = { hoTen: "bd-ho-ten", khoi: "bd-khoi", tinh: "bd-tinh", nganhQuanTam: "bd-nganh" };

type P = { h: HoSo; sua: (p: Partial<HoSo>) => void; loi: Partial<Record<TruongBatBuoc, string>> };

export default function Buoc1({ h, sua, loi }: P) {
  // Giá trị cũ không còn trong danh sách (ví dụ tỉnh trước sáp nhập) vẫn hiện để em thấy và đổi.
  const tinhLa = h.tinh && !THANH_PHO.includes(h.tinh) && !TINH.includes(h.tinh) ? h.tinh : null;
  const giaiDoanLa = h.giaiDoan && !GIAI_DOAN.includes(h.giaiDoan) ? h.giaiDoan : null;
  return (
    <>
      <TieuDeBuoc tieuDe={<>Điền nhanh trong <span className="text-xanh">60 giây</span></>}
        moTa="Chỉ vài thông tin cơ bản để gợi ý hợp với em hơn. Em có thể bổ sung thêm sau." />

      <div className="space-y-1.5">
        <label htmlFor={ID_TRUONG.hoTen} className="flex items-center gap-1.5 text-[15px] font-bold text-chu">
          <UserRound size={18} className="text-xanh" />Họ và tên<span className="text-do" aria-label="bắt buộc">*</span>
        </label>
        <OInput id={ID_TRUONG.hoTen} value={h.hoTen} onChange={(e) => sua({ hoTen: e.target.value })} placeholder="Ví dụ: Nguyễn Minh Anh"
          autoComplete="name" maxLength={60} aria-invalid={!!loi.hoTen} aria-describedby={loi.hoTen ? "loi-ho-ten" : undefined}
          className={gop(loi.hoTen && "border-do/60")} />
        {loi.hoTen && <p id="loi-ho-ten" className="text-[13px] font-semibold text-do-chu">{loi.hoTen}</p>}
      </div>

      <CauHoi tieuDe="Lớp" icon={GraduationCap} batBuoc loi={loi.khoi}>
        <ChonO nhan="Lớp" cot={2} idDau={ID_TRUONG.khoi} coLoi={!!loi.khoi}
          cacLua={[{ gia: 11, nhan: "Lớp 11" }, { gia: 12, nhan: "Lớp 12" }]} giaTri={h.khoi} onChange={(v) => sua({ khoi: v })} />
      </CauHoi>

      <div className="space-y-1.5">
        <label htmlFor={ID_TRUONG.tinh} className="flex items-center gap-1.5 text-[15px] font-bold text-chu">
          <MapPin size={18} className="text-xanh" />Tỉnh/Thành phố<span className="text-do" aria-label="bắt buộc">*</span>
        </label>
        <OChon id={ID_TRUONG.tinh} value={h.tinh} onChange={(e) => sua({ tinh: e.target.value })} aria-invalid={!!loi.tinh}
          className={gop(!h.tinh && "text-chu-phu", loi.tinh && "border-do/60")}>
          <option value="">Chọn nơi em đang sống</option>
          {tinhLa && <option value={tinhLa}>{tinhLa}</option>}
          <optgroup label="Thành phố">{THANH_PHO.map((t) => <option key={t} value={t}>{t}</option>)}</optgroup>
          <optgroup label="Tỉnh">{TINH.map((t) => <option key={t} value={t}>{t}</option>)}</optgroup>
        </OChon>
        {loi.tinh && <p className="text-[13px] font-semibold text-do-chu">{loi.tinh}</p>}
      </div>

      <CauHoi tieuDe="Nhóm ngành quan tâm" icon={Layers} batBuoc phu="chọn 1 hoặc nhiều" loi={loi.nganhQuanTam}>
        <ChonO nhan="Nhóm ngành quan tâm" nhieu idDau={ID_TRUONG.nganhQuanTam} coLoi={!!loi.nganhQuanTam}
          cacLua={NGANH} giaTri={h.nganhQuanTam} onChange={(v) => sua({ nganhQuanTam: v })} />
      </CauHoi>

      <CauHoi tieuDe="Mục tiêu hiện tại" icon={Flag} phu="chọn 1">
        <ChonO nhan="Mục tiêu hiện tại" kieu="o" cot={3} cacLua={MUC_TIEU_HIEN_TAI} giaTri={h.mucTieuHienTai} onChange={(v) => sua({ mucTieuHienTai: v })} />
      </CauHoi>

      <div className="space-y-1.5">
        <label htmlFor="bd-giai-doan" className="flex items-center gap-1.5 text-[15px] font-bold text-chu">
          <School size={18} className="text-xanh" />Giai đoạn hiện tại
          <span className="ml-auto text-[12px] font-semibold text-chu-phu">Không bắt buộc</span>
        </label>
        <OChon id="bd-giai-doan" value={h.giaiDoan} onChange={(e) => sua({ giaiDoan: e.target.value })} className={gop(!h.giaiDoan && "text-chu-phu")}>
          <option value="">Chọn giai đoạn</option>
          {giaiDoanLa && <option value={giaiDoanLa}>{giaiDoanLa}</option>}
          {GIAI_DOAN.map((t) => <option key={t} value={t}>{t}</option>)}
        </OChon>
      </div>

      <p className="flex gap-2 items-start rounded-the bg-xanh-nhat p-3 text-[13px] text-chu">
        <Lightbulb size={18} className="text-cam shrink-0 mt-0.5" />
        Chưa chắc ngành nào cũng không sao. Em cứ chọn theo cảm nhận, sau này đổi lại được.
      </p>
    </>
  );
}

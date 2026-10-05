import { Flag, GraduationCap, Layers, Lightbulb, MapPin, School, UserRound } from "lucide-react";
import { OChon, OInput } from "@/components/ui/nhap-lieu";
import { gop } from "@/components/ui/nut-the";
import type { HoSo } from "@/state/types";
import { GIAI_DOAN, MUC_TIEU_HIEN_TAI, NGANH, PHAN_NHOM_NGANH, TAT_CA_NGANH, THANH_PHO, TINH } from "./lua-chon";
import { CauHoi, ChonO, TieuDeBuoc } from "./thanh-phan";
import type { TruongBatBuoc } from "./tinh-toan";

/** id ô đầu tiên của từng trường bắt buộc, để đưa con trỏ tới khi còn thiếu. */
export const ID_TRUONG: Record<TruongBatBuoc, string> = { khoi: "bd-khoi", tinh: "bd-tinh", nganhQuanTam: "bd-nganh" };

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
        <label htmlFor="bd-ho-ten" className="flex items-center gap-1.5 text-[15px] font-bold text-chu">
          <UserRound size={18} className="text-xanh" />Họ và tên<span className="ml-auto text-[12px] font-semibold text-chu-phu">Không bắt buộc · chỉ lưu trên máy</span>
        </label>
        <OInput id="bd-ho-ten" value={h.hoTen} onChange={(e) => sua({ hoTen: e.target.value })} placeholder="Ví dụ: Minh Anh"
          autoComplete="name" maxLength={60} />
      </div>

      <CauHoi tieuDe="Lớp" icon={GraduationCap} batBuoc loi={loi.khoi}>
        <ChonO nhan="Lớp" cot={2} idDau={ID_TRUONG.khoi} coLoi={!!loi.khoi}
          cacLua={[{ gia: 11, nhan: "Lớp 10 – 11" }, { gia: 12, nhan: "Lớp 12" }]} giaTri={h.khoi} onChange={(v) => sua({ khoi: v })} />
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

      <div className="space-y-2">
        <label htmlFor={ID_TRUONG.nganhQuanTam} className="flex items-center gap-1.5 text-[15px] font-bold text-chu">
          <Layers size={18} className="text-xanh" />Nhóm ngành quan tâm<span className="text-do" aria-label="bắt buộc">*</span>
          <span className="ml-auto text-[12px] font-semibold text-chu-phu">chọn 1 hoặc nhiều</span>
        </label>

        {/* Dropdown bao phủ toàn bộ 24 nhóm ngành đào tạo */}
        <OChon
          id={ID_TRUONG.nganhQuanTam}
          value=""
          onChange={(e) => {
            const v = e.target.value;
            if (v && !h.nganhQuanTam.includes(v)) {
              sua({ nganhQuanTam: [...h.nganhQuanTam, v] });
            }
          }}
          aria-invalid={!!loi.nganhQuanTam}
          className={gop(loi.nganhQuanTam && "border-do/60")}
        >
          <option value="">+ Chọn nhóm ngành từ danh sách (24 nhóm)...</option>
          {PHAN_NHOM_NGANH.map((group) => (
            <optgroup key={group.nhom} label={group.nhom}>
              {group.danhSach.map((item) => (
                <option key={item.gia} value={item.gia} disabled={h.nganhQuanTam.includes(item.gia)}>
                  {h.nganhQuanTam.includes(item.gia) ? `✓ ${item.nhan}` : item.nhan}
                </option>
              ))}
            </optgroup>
          ))}
        </OChon>

        {/* Danh sách ngành đã chọn (Chip hiển thị có nút xoá) */}
        {h.nganhQuanTam.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {h.nganhQuanTam.map((g) => {
              const info = TAT_CA_NGANH.find((t) => t.gia === g);
              return (
                <span
                  key={g}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-xanh-nhat text-xanh text-[13px] font-bold border border-xanh/30 shadow-sm animate-hien-len"
                >
                  <span>{info?.gia || g}</span>
                  <button
                    type="button"
                    onClick={() => sua({ nganhQuanTam: h.nganhQuanTam.filter((x) => x !== g) })}
                    className="size-5 rounded-full hover:bg-xanh/20 grid place-items-center text-xanh"
                    aria-label={`Xóa ngành ${g}`}
                  >
                    ×
                  </button>
                </span>
              );
            })}
          </div>
        ) : (
          <p className="text-[12.5px] text-chu-phu italic">
            Em có thể chọn từ danh sách trên hoặc bấm nhanh các gợi ý phổ biến bên dưới.
          </p>
        )}

        {/* Gợi ý nhanh các nhóm ngành phổ biến */}
        <div className="pt-0.5">
          <span className="text-[12px] font-semibold text-chu-phu block mb-1.5">Gợi ý chọn nhanh:</span>
          <div className="flex flex-wrap gap-1.5">
            {NGANH.map((item) => {
              const daChon = h.nganhQuanTam.includes(item.gia);
              const Icon = item.icon;
              return (
                <button
                  key={item.gia}
                  type="button"
                  onClick={() => {
                    if (daChon) {
                      sua({ nganhQuanTam: h.nganhQuanTam.filter((x) => x !== item.gia) });
                    } else {
                      sua({ nganhQuanTam: [...h.nganhQuanTam, item.gia] });
                    }
                  }}
                  className={gop(
                    "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[13px] font-bold border transition active:scale-95",
                    daChon
                      ? "bg-xanh text-white border-xanh"
                      : "bg-trang text-chu border-vien hover:border-xanh/40",
                  )}
                >
                  {Icon && <Icon size={14} className="shrink-0" />}
                  <span>{item.nhan}</span>
                </button>
              );
            })}
          </div>
        </div>

        {loi.nganhQuanTam && <p className="text-[13px] font-semibold text-do-chu">{loi.nganhQuanTam}</p>}
      </div>

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

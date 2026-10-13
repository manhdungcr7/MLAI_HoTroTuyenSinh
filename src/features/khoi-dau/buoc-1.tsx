import { useMemo, useState } from "react";
import { Check, GraduationCap, Layers, MapPin, Search, UserRound, X } from "lucide-react";
import { OChon, OInput } from "@/components/ui/nhap-lieu";
import { gop } from "@/components/ui/nut-the";
import type { HoSo } from "@/state/types";
import { GIAI_DOAN_DA_TOT_NGHIEP, changCuaEm, type Chang } from "@/state/chang";
import { PHAN_NHOM_NGANH, TAT_CA_NGANH, THANH_PHO, TINH } from "./lua-chon";
import { CauHoi, ChonO, TieuDeBuoc } from "./thanh-phan";
import type { TruongBatBuoc } from "./tinh-toan";

/** id ô đầu tiên của từng trường bắt buộc, để đưa con trỏ tới khi còn thiếu. */
export const ID_TRUONG: Record<TruongBatBuoc, string> = { khoi: "bd-khoi", tinh: "bd-tinh", nganhQuanTam: "bd-nganh" };

type P = { h: HoSo; sua: (p: Partial<HoSo>) => void; loi: Partial<Record<TruongBatBuoc, string>> };

const CAC_CHANG: { gia: Chang; nhan: string }[] = [
  { gia: "dinhHuong", nhan: "Lớp 10–11" }, { gia: "nuocRut", nhan: "Lớp 12" }, { gia: "thiLai", nhan: "Đã tốt nghiệp / thi lại" },
];

/** Lưu chặng em chọn vào hồ sơ; chỉ ô "đã tốt nghiệp" mới giữ dấu giaiDoan, hai ô kia xóa dấu đó nếu đang có. */
export function hoSoTheoChang(h: Pick<HoSo, "giaiDoan">, c: Chang): Partial<HoSo> {
  const giaiDoan = h.giaiDoan === GIAI_DOAN_DA_TOT_NGHIEP ? "" : h.giaiDoan;
  if (c === "thiLai") return { khoi: 12, giaiDoan: GIAI_DOAN_DA_TOT_NGHIEP };
  return { khoi: c === "nuocRut" ? 12 : 11, giaiDoan };
}

export default function Buoc1({ h, sua, loi }: P) {
  const [tabNhom, setTabNhom] = useState<string>("Tất cả");
  const [tuKhoa, setTuKhoa] = useState<string>("");

  // Giá trị cũ không còn trong danh sách (ví dụ tỉnh trước sáp nhập) vẫn hiện để em thấy và đổi.
  const tinhLa = h.tinh && !THANH_PHO.includes(h.tinh) && !TINH.includes(h.tinh) ? h.tinh : null;

  const toggleNganh = (gia: string) => {
    if (h.nganhQuanTam.includes(gia)) {
      sua({ nganhQuanTam: h.nganhQuanTam.filter((x) => x !== gia) });
    } else {
      sua({ nganhQuanTam: [...h.nganhQuanTam, gia] });
    }
  };

  const danhSachHien = useMemo(() => {
    const k = tuKhoa.trim().toLowerCase();
    if (k) {
      return TAT_CA_NGANH.filter((item) =>
        item.gia.toLowerCase().includes(k) || item.nhan.toLowerCase().includes(k)
      );
    }
    if (tabNhom === "Tất cả") {
      return TAT_CA_NGANH;
    }
    const found = PHAN_NHOM_NGANH.find((g) => g.nhom.includes(tabNhom));
    return found ? found.danhSach : TAT_CA_NGANH;
  }, [tuKhoa, tabNhom]);

  return (
    <>
      <TieuDeBuoc
        tieuDe={<>Điền nhanh trong <span className="text-xanh">60 giây</span></>}
      />

      <div className="space-y-1.5">
        <label htmlFor="bd-ho-ten" className="flex items-center gap-1.5 text-[15px] font-bold text-chu">
          <UserRound size={18} className="text-xanh" />Họ và tên <span className="text-[13px] font-normal text-chu-phu">(không bắt buộc)</span>
        </label>
        <OInput id="bd-ho-ten" value={h.hoTen} onChange={(e) => sua({ hoTen: e.target.value })} placeholder="Ví dụ: Minh Anh"
          autoComplete="name" maxLength={60} />
      </div>

      <CauHoi tieuDe="Lớp" icon={GraduationCap} batBuoc loi={loi.khoi}>
        <ChonO nhan="Lớp" cot={3} idDau={ID_TRUONG.khoi} coLoi={!!loi.khoi}
          cacLua={CAC_CHANG} giaTri={h.khoi === null ? null : changCuaEm({ hoSo: h })} onChange={(c: Chang) => sua(hoSoTheoChang(h, c))} />
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

      <div className="space-y-2.5" id={ID_TRUONG.nganhQuanTam} tabIndex={-1}>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-1.5 text-[15px] font-bold text-chu">
            <Layers size={18} className="text-xanh" />Nhóm ngành quan tâm<span className="text-do" aria-label="bắt buộc">*</span>
          </label>
          {h.nganhQuanTam.length > 0 && (
            <span className="text-[12.5px] font-bold text-xanh bg-xanh-nhat px-2.5 py-0.5 rounded-full">
              Đã chọn {h.nganhQuanTam.length}
            </span>
          )}
        </div>

        {/* Ô tìm kiếm nhanh nhóm ngành */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-chu-phu pointer-events-none" />
          <input
            type="search"
            value={tuKhoa}
            onChange={(e) => setTuKhoa(e.target.value)}
            placeholder="Tìm nhanh ngành (CNTT, Kinh tế, Y Dược, Luật...)"
            aria-label="Tìm nhanh nhóm ngành"
            className="w-full min-h-11 rounded-xl border border-vien bg-trang pl-9 pr-9 text-[14px] focus:border-xanh outline-none"
          />
          {tuKhoa && (
            <button
              type="button"
              onClick={() => setTuKhoa("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 size-7 grid place-items-center rounded-full text-chu-phu hover:text-chu"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Danh mục phân loại nếu không tìm kiếm */}
        {!tuKhoa && (
          <div className="flex gap-1.5 overflow-x-auto an-thanh-cuon pb-0.5">
            {["Tất cả", "Công nghệ", "Kinh tế", "Y Dược", "Xã hội", "Mỹ thuật"].map((tab) => {
              const chon = tabNhom === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setTabNhom(tab)}
                  className={gop(
                    "min-h-8 px-3 rounded-lg text-[12.5px] font-semibold whitespace-nowrap transition-colors cursor-pointer",
                    chon ? "bg-xanh text-white shadow-sm" : "bg-nen text-chu hover:bg-vien/40"
                  )}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        )}

        {/* Lưới các thẻ ngành cân đối và đồng đều kích thước */}
        <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
          {danhSachHien.map((item) => {
            const daChon = h.nganhQuanTam.includes(item.gia);
            return (
              <button
                key={item.gia}
                type="button"
                onClick={() => toggleNganh(item.gia)}
                className={gop(
                  "flex items-center justify-between px-3 py-2 rounded-xl border text-left transition-all active:scale-[0.98] cursor-pointer h-[58px]",
                  daChon
                    ? "bg-xanh-nhat border-xanh text-xanh shadow-sm ring-1 ring-xanh"
                    : "bg-trang border-vien text-chu hover:border-xanh/40"
                )}
              >
                <div className="min-w-0 flex-1 pr-2">
                  <b className="block text-[13.5px] font-bold leading-tight truncate">{item.gia}</b>
                  <span className="block text-[11.5px] text-chu-phu leading-tight truncate mt-0.5">
                    {item.nhan.replace(`${item.gia} / `, "").replace(`${item.gia} - `, "")}
                  </span>
                </div>
                {daChon ? (
                  <span className="size-5 rounded-full bg-xanh text-white grid place-items-center shrink-0">
                    <Check size={12} strokeWidth={3} />
                  </span>
                ) : (
                  <span className="size-5 rounded-full border border-vien shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {loi.nganhQuanTam && <p className="text-[13px] font-semibold text-do-chu">{loi.nganhQuanTam}</p>}
      </div>
    </>
  );
}

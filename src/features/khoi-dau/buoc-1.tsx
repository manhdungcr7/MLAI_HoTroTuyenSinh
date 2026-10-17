import { useMemo, useState, type CSSProperties } from "react";
import type { ToneTen } from "@/state/types";

import { Check, GraduationCap, Layers, MapPin, Search, SearchX, UserRound, X } from "lucide-react";
import { OChon, OInput } from "@/components/ui/nhap-lieu";
import { TONE_CHU, TONE_NEN, gop } from "@/components/ui/nut-the";
import { ChipLoc } from "@/components/ui/thiet-ke";
import type { HoSo } from "@/state/types";
import { GIAI_DOAN_DA_TOT_NGHIEP, changCuaEm, type Chang } from "@/state/chang";
import { ICON_NGANH, PHAN_NHOM_NGANH, TAT_CA_NGANH, THANH_PHO, TINH } from "./lua-chon";
import { CauHoi, ChonO } from "./thanh-phan";
import { DauBuoc, MinhHoaHoSo } from "./khung-buoc";
import type { TruongBatBuoc } from "./tinh-toan";
import { boDau } from "@/features/kham-pha/tim-kiem";

/** id ô đầu tiên của từng trường bắt buộc, để đưa con trỏ tới khi còn thiếu. */
export const ID_TRUONG: Record<TruongBatBuoc, string> = { khoi: "bd-khoi", tinh: "bd-tinh", nganhQuanTam: "bd-nganh" };

type P = { h: HoSo; sua: (p: Partial<HoSo>) => void; loi: Partial<Record<TruongBatBuoc, string>> };

const TEN_HIEN_THI_NGANH: Record<string, string> = {
  CNTT: "Công nghệ thông tin",
  "Kỹ thuật": "Kỹ thuật & Cơ khí",
  "Xây dựng": "Kiến trúc & Xây dựng",
  "Khoa học tự nhiên": "Khoa học tự nhiên",
  Logistics: "Logistics & Vận tải",
  "Kinh tế": "Kinh tế & Quản trị",
  "Tài chính": "Tài chính - Ngân hàng",
  Marketing: "Marketing & Truyền thông",
  "Du lịch": "Du lịch & Khách sạn",
  "Y Dược": "Y khoa & Dược học",
  "Điều dưỡng": "Điều dưỡng & Y tế",
  "Sư phạm": "Sư phạm & Giáo dục",
  "Luật": "Luật & Pháp lý",
  "Ngôn ngữ": "Ngôn ngữ & Quốc tế học",
  "Báo chí": "Báo chí & Truyền thông",
  "Xã hội": "Khoa học Xã hội",
  "Thiết kế": "Thiết kế & Mỹ thuật",
  "Kiến trúc": "Kiến trúc & Quy hoạch",
  "Nông Lâm": "Sinh học & Nông nghiệp",
  "Thể thao": "Thể dục thể thao",
};

const CAC_CHANG: { gia: Chang; nhan: string }[] = [
  { gia: "dinhHuong", nhan: "Lớp 10–11" }, { gia: "nuocRut", nhan: "Lớp 12" }, { gia: "thiLai", nhan: "Đã tốt nghiệp" },
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
      const kKd = boDau(k);
      return TAT_CA_NGANH.filter((item) => {
        const giaKd = boDau(item.gia);
        const nhanKd = boDau(item.nhan);
        const tenHienThi = TEN_HIEN_THI_NGANH[item.gia] || "";
        const tenKd = boDau(tenHienThi);
        return (
          item.gia.toLowerCase().includes(k) ||
          item.nhan.toLowerCase().includes(k) ||
          tenHienThi.toLowerCase().includes(k) ||
          giaKd.includes(kKd) ||
          nhanKd.includes(kKd) ||
          tenKd.includes(kKd) ||
          (kKd === "it" && item.gia === "CNTT") ||
          (kKd === "cntt" && item.gia === "CNTT")
        );
      });
    }
    if (tabNhom === "Tất cả") {
      return TAT_CA_NGANH;
    }
    const found = PHAN_NHOM_NGANH.find((g) => g.nhom.includes(tabNhom));
    return found ? found.danhSach : TAT_CA_NGANH;
  }, [tuKhoa, tabNhom]);

  const cacTab = ["Tất cả", "Công nghệ", "Kinh tế", "Y Dược", "Xã hội", "Mỹ thuật"];

  return (
    <>
      <DauBuoc
        tieuDe={<>Bắt đầu hồ sơ trong <span className="text-xanh">60 giây</span></>}
        moTa="Chỉ vài thông tin cơ bản để gợi ý ngành học hợp với bạn."
        phai={<MinhHoaHoSo />}
      />

      <div className="space-y-1.5">
        <label htmlFor="bd-ho-ten" className="flex items-center gap-1.5 text-[15px] font-bold text-chu">
          Họ và tên <span className="text-[13px] font-normal text-chu-phu">(không bắt buộc)</span>
        </label>
        <OInput id="bd-ho-ten" bieuTuong={UserRound} value={h.hoTen} onChange={(e) => sua({ hoTen: e.target.value })} placeholder="Ví dụ: Minh Anh"
          autoComplete="name" maxLength={60} />
      </div>

      <CauHoi tieuDe="Lớp" icon={GraduationCap} batBuoc loi={loi.khoi} idLoi="loi-khoi">
        <ChonO nhan="Lớp" cot={3} idDau={ID_TRUONG.khoi} coLoi={!!loi.khoi}
          cacLua={CAC_CHANG} giaTri={h.khoi === null ? null : changCuaEm({ hoSo: h })} onChange={(c: Chang) => sua(hoSoTheoChang(h, c))} />
      </CauHoi>

      <div className="space-y-1.5">
        <label htmlFor={ID_TRUONG.tinh} className="flex items-center gap-1.5 text-[15px] font-bold text-chu">
          Tỉnh/Thành phố<span className="text-do" aria-label="bắt buộc">*</span>
        </label>
        <OChon id={ID_TRUONG.tinh} bieuTuong={MapPin} value={h.tinh} onChange={(e) => sua({ tinh: e.target.value })} aria-invalid={!!loi.tinh}
          aria-describedby={loi.tinh ? "loi-tinh" : undefined}
          className={gop(!h.tinh && "text-chu-phu", loi.tinh && "border-do/60")}>
          <option value="">Chọn nơi bạn đang sống</option>
          {tinhLa && <option value={tinhLa}>{tinhLa}</option>}
          <optgroup label="Thành phố">{THANH_PHO.map((t) => <option key={t} value={t}>{t}</option>)}</optgroup>
          <optgroup label="Tỉnh">{TINH.map((t) => <option key={t} value={t}>{t}</option>)}</optgroup>
        </OChon>
        {loi.tinh && <p id="loi-tinh" role="alert" className="text-[13px] font-semibold text-do-chu">{loi.tinh}</p>}
      </div>

      <fieldset className="space-y-2.5 min-w-0" id={ID_TRUONG.nganhQuanTam} tabIndex={-1}>
        <legend className="w-full flex items-center justify-between gap-2 mb-2.5">
          <span className="flex items-center gap-1.5 text-[15px] font-bold text-chu">
            <Layers size={18} className="text-xanh" />Nhóm ngành quan tâm<span className="text-do" aria-label="bắt buộc">*</span>
          </span>
          {h.nganhQuanTam.length > 0 && (
            <span aria-live="polite" className="text-[13px] font-bold text-xanh bg-xanh-nhat px-2.5 py-1 rounded-lg whitespace-nowrap">
              Đã chọn {h.nganhQuanTam.length}
            </span>
          )}
        </legend>

        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-chu-phu pointer-events-none" />
          <input
            type="search" value={tuKhoa} onChange={(e) => setTuKhoa(e.target.value)}
            placeholder="Tìm ngành, ví dụ Kinh tế" aria-label="Tìm nhanh nhóm ngành"
            className="w-full min-h-12 rounded-[10px] border border-vien bg-trang pl-10 pr-11 text-[15px] focus:border-xanh focus:outline-none focus:ring-2 focus:ring-xanh/20 [&::-webkit-search-cancel-button]:appearance-none"
          />
          {tuKhoa && (
            <button type="button" onClick={() => setTuKhoa("")} aria-label="Xóa từ khóa tìm"
              className="absolute right-0.5 top-1/2 -translate-y-1/2 size-11 grid place-items-center rounded-full text-chu-phu active:bg-xanh-nhat">
              <X size={16} />
            </button>
          )}
        </div>

        {!tuKhoa && (
          <div role="group" aria-label="Lọc theo nhóm" className="flex gap-2 overflow-x-auto an-thanh-cuon -mx-4 px-4 py-1">
            {cacTab.map((tab) => <ChipLoc key={tab} chon={tabNhom === tab} onClick={() => setTabNhom(tab)}>{tab}</ChipLoc>)}
          </div>
        )}

        {danhSachHien.length === 0 ? (
          <p role="status" className="rounded-the border border-dashed border-vien bg-trang p-4 text-[14px] text-chu-phu flex items-center gap-2">
            <SearchX size={20} className="shrink-0" />Chưa có nhóm ngành nào khớp "{tuKhoa.trim()}". Bạn thử từ khác nhé.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-2">
            {danhSachHien.map((item, i) => {
              const daChon = h.nganhQuanTam.includes(item.gia);
              const ten = TEN_HIEN_THI_NGANH[item.gia] || item.nhan.split("/")[0].trim();
              const kieu = ICON_NGANH[item.gia] ?? { icon: Layers, tone: "xanh" as ToneTen };
              const Icon = kieu.icon;
              return (
                <li key={item.gia} className="hien-dan da-hien min-w-0" style={{ "--i": Math.min(i, 8) } as CSSProperties}>
                  <button type="button" onClick={() => toggleNganh(item.gia)} aria-pressed={daChon}
                    className={gop(
                      "nay-nhe relative w-full h-full min-h-[82px] flex flex-col items-start gap-1.5 p-2.5 rounded-the border text-left transition-colors cursor-pointer",
                      daChon ? "bg-xanh-nhat border-xanh border-[1.5px] shadow-the" : "bg-trang border-vien hover:border-xanh/40",
                    )}>
                    <span className="w-full flex items-start justify-between">
                      <span className={gop("size-9 rounded-lg grid place-items-center shrink-0", TONE_NEN[kieu.tone], TONE_CHU[kieu.tone])}><Icon size={19} /></span>
                      {daChon
                        ? <span className="tick-bat size-5 rounded-full bg-xanh text-white grid place-items-center shrink-0"><Check size={12} strokeWidth={3.5} /></span>
                        : <span className="size-5 rounded-full border-[1.5px] border-vien shrink-0" />}
                    </span>
                    <span className={gop("text-[14px] leading-snug line-clamp-2", daChon ? "font-extrabold text-xanh" : "font-bold text-chu")}>{ten}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {loi.nganhQuanTam && <p role="alert" className="text-[13px] font-semibold text-do-chu">{loi.nganhQuanTam}</p>}
      </fieldset>
    </>
  );
}

// Bộ thành phần dùng chung hiển thị trường và ngành học (Academic Display Components).
// Thiết kế Mobile-First, Light Mode, solid, không glassmorphism.
// Tối ưu để quét nhanh (short to scan), xem chi tiết khi cần (detailed on demand).

import { useState, type ReactNode } from "react";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Trash2,
  GripVertical,
} from "lucide-react";
import { gop } from "./nut-the";
import { NhanNguyenVongTag } from "./co-cau";
import type { AcademicDisplayModel } from "@/engine/trinh-bay-hoc-thuat";
import type { NhanNguyenVong } from "@/state/types";
import { dinhDang } from "@/engine/dinh-dang";

/** Hiển thị tên trường đã xác minh, rõ ràng, không để lộ mã trần */
export function UniversityLabel({
  tenHienThi,
  ma,
  daXacMinh = true,
  className,
}: {
  tenHienThi: string;
  ma?: string;
  daXacMinh?: boolean;
  className?: string;
}) {
  return (
    <span className={gop("inline-flex items-center gap-1.5 min-w-0 text-[13px] text-chu-phu leading-snug", className)}>
      <span className={gop("font-medium whitespace-normal break-words", !daXacMinh && "text-cam-chu italic")}>
        {tenHienThi}
      </span>
      {ma && daXacMinh && (
        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-nen text-chu-phu border border-vien shrink-0">
          {ma}
        </span>
      )}
    </span>
  );
}

/** Hiển thị tên ngành cốt lõi (Core Major) */
export function MajorLabel({
  ten,
  className,
}: {
  ten: string;
  className?: string;
}) {
  return (
    <b className={gop("block whitespace-normal break-words text-[15px] font-extrabold text-muc leading-snug tracking-tight", className)}>
      {ten}
    </b>
  );
}

/** Biến thể chương trình đào tạo (Program Variant) */
export function ProgramVariant({
  variant,
  className,
}: {
  variant?: string;
  className?: string;
}) {
  if (!variant) return null;
  return (
    <span
      className={gop(
        "inline-flex items-center text-[11px] font-semibold text-xanh bg-xanh-nhat px-2 py-0.5 rounded-md leading-tight",
        className
      )}
    >
      {variant}
    </span>
  );
}

/** Nhãn phân loại phù hợp (Fit Indicator) */
export function FitIndicator({
  fitCategory,
  chuaDuDiem = false,
}: {
  fitCategory: NhanNguyenVong | null;
  chuaDuDiem?: boolean;
}) {
  if (fitCategory) {
    return <NhanNguyenVongTag nhan={fitCategory} />;
  }
  return (
    <span className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-semibold bg-nen text-chu-phu border border-vien">
      {chuaDuDiem ? "Chưa đủ điểm" : "Chưa so được"}
    </span>
  );
}

/** Tóm tắt cơ cấu nguyện vọng gọn gàng, đọc tốt ở 320px, số liệu chuẩn xác */
export function PreferenceSummary({
  tong,
  dem,
  className,
}: {
  tong: number;
  dem: Record<NhanNguyenVong, number>;
  className?: string;
}) {
  const parts: { label: string; count: number; tone: "tim" | "cam" | "luc" | "xanh" }[] = [
    { label: "An toàn", count: dem["An toàn"], tone: "luc" },
    { label: "Vừa sức", count: dem["Vừa sức"], tone: "cam" },
    { label: "Thử sức", count: dem["Thử sức"], tone: "tim" },
  ];
  parts.push({ label: "Dự phòng", count: dem["Dự phòng"], tone: "xanh" });
  const daXepNhan = Object.values(dem).reduce((sum, count) => sum + count, 0);
  const chuaSoDuoc = Math.max(0, tong - daXepNhan);
  if (chuaSoDuoc > 0) parts.push({ label: "Chưa so được", count: chuaSoDuoc, tone: "xanh" });
  const hienThi = parts.filter((p) => p.count > 0);

  return (
    <div
      className={gop(
        "rounded-the bg-trang border border-vien p-3 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2",
        className
      )}
      aria-label={`Tóm tắt: ${tong} nguyện vọng`}
    >
      <div className="flex items-baseline gap-2">
        <span className="so-lon text-[18px] font-extrabold text-muc leading-none">{tong}</span>
        <span className="text-[13px] font-bold text-muc">nguyện vọng</span>
      </div>

      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12px]">
        {hienThi.map((p, idx) => (
          <span key={p.label} className="inline-flex items-center gap-1 text-chu">
            <span
              className={gop(
                "size-2 rounded-full shrink-0",
                p.tone === "luc" ? "bg-luc" : p.tone === "cam" ? "bg-cam" : p.tone === "tim" ? "bg-tim" : "bg-xanh"
              )}
            />
            <b>{p.count}</b>
            <span className="text-chu-phu">{p.label}</span>
            {idx < hienThi.length - 1 && <span className="text-vien select-none ml-1.5">·</span>}
          </span>
        ))}
      </div>
    </div>
  );
}

export interface PreferenceCardProps {
  index: number;
  model: AcademicDisplayModel;
  diemChuan?: number;
  diemCuaBan?: number | null;
  chenhDiem?: number | null;
  toHop?: string | null;
  linkNguon?: string;
  isFirst?: boolean;
  isLast?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDelete?: () => void;
  onOpenDetails?: () => void;
  dragHandleProps?: Record<string, unknown>;
  extraBadges?: ReactNode;
}

/** Thẻ nguyện vọng chuẩn mobile: phân cấp dọc, rõ ràng, hiển thị chi tiết khi cần */
export function PreferenceCard({
  index,
  model,
  diemChuan,
  diemCuaBan,
  chenhDiem,
  toHop,
  linkNguon,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onDelete,
  onOpenDetails,
  dragHandleProps = {},
  extraBadges,
}: PreferenceCardProps) {
  const [moChiTiet, setMoChiTiet] = useState(false);

  const nvLabel = `NV ${String(index + 1).padStart(2, "0")}`;
  const coDiem = typeof diemChuan === "number" && diemChuan > 0;
  const coChenh = chenhDiem !== null && chenhDiem !== undefined;

  return (
    <article
      className="bg-trang p-3.5 transition-all text-left group"
      aria-label={`${nvLabel}: ${model.majorNameDisplay} tại ${model.universityNameDisplay}`}
    >
      {/* 1. Header: Thứ tự NV · Phân loại mức độ */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2">
          {Object.keys(dragHandleProps).length > 0 && (
            <button
              type="button"
              {...dragHandleProps}
              aria-label={`Kéo để đổi thứ tự ${nvLabel}`}
              className="cursor-grab text-chu-phu touch-none size-7 grid place-items-center rounded hover:bg-nen active:cursor-grabbing"
            >
              <GripVertical size={16} />
            </button>
          )}
          <span className="text-[12px] font-extrabold tracking-wider uppercase text-chu-phu bg-nen px-2 py-0.5 rounded border border-vien">
            {nvLabel}
          </span>
          <FitIndicator fitCategory={model.fitCategory} />
          {extraBadges}
        </div>

        {/* Nút bật/tắt chi tiết điểm */}
        <button
          type="button"
          onClick={() => setMoChiTiet((v) => !v)}
          aria-expanded={moChiTiet}
          aria-label={moChiTiet ? "Thu gọn chi tiết xét tuyển" : "Xem chi tiết xét tuyển"}
          className="size-8 rounded-lg border border-vien bg-nen hover:bg-vien/40 grid place-items-center text-chu-phu transition-colors shrink-0"
        >
          {moChiTiet ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* 2. Main clickable content: Tên ngành cốt lõi & Tên trường */}
      <div
        onClick={onOpenDetails}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpenDetails?.();
          }
        }}
        className="cursor-pointer space-y-1 block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xanh rounded"
      >
        <MajorLabel ten={model.majorNameDisplay} />

        <div className="flex items-center gap-1.5 flex-wrap">
          <UniversityLabel
            tenHienThi={model.universityNameDisplay}
            ma={model.universityCode}
          />
        </div>

        {model.programVariant && (
          <div className="pt-0.5">
            <ProgramVariant variant={model.programVariant} />
          </div>
        )}
      </div>

      {/* 3. Tóm tắt điểm ngắn gọn (quét nhanh) */}
      {/* 4. Khối chi tiết mở rộng theo yêu cầu (Detailed on demand) */}
      {moChiTiet && (
        <div className="mt-3 p-3 rounded-xl bg-nen border border-vien/70 text-[12px] space-y-2 hien-len">
          <div className="flex items-center justify-between gap-2">
            <span className="text-chu-phu">Điểm chuẩn{model.admissionYear ? ` năm ${model.admissionYear}` : ""}:</span>
            <span className="text-right font-semibold text-muc">{coDiem ? dinhDang(diemChuan, 1) : "Chưa có dữ liệu"}</span>
          </div>
          {(diemCuaBan !== null && diemCuaBan !== undefined || coDiem && coChenh) && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-chu-phu">Điểm của em:</span>
              <span className="text-right font-semibold text-muc">
                {dinhDang(diemCuaBan ?? diemChuan! + chenhDiem!, 1)}
                {coDiem && <> ({chenhDiem! < 0 ? "−" : "+"}{dinhDang(Math.abs(chenhDiem!), 1)})</>}
              </span>
            </div>
          )}
          {toHop && <div className="flex items-center justify-between gap-2"><span className="text-chu-phu">Tổ hợp xét tuyển:</span><b className="text-muc">{toHop}</b></div>}
          <p className="text-chu-phu">Nhãn này chỉ để tham khảo theo điểm chuẩn các năm trước, không đảm bảo kết quả tuyển sinh.</p>
          <div className="flex items-center justify-between gap-2">
            <span className="text-chu-phu">Tên trường đầy đủ:</span>
            <span className="text-right font-medium text-muc whitespace-normal break-words">{model.universityNameOfficial}</span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-chu-phu">Nguồn dữ liệu:</span>
            <span className="text-right font-medium text-chu">
              {model.sourceStatus === "de_an_chinh_thuc"
                ? "Đề án chính thức của trường"
                : model.sourceStatus === "da_kiem_chung"
                ? "Đã kiểm chứng độc lập"
                : "Bảng điểm tổng hợp"}
            </span>
          </div>

          {linkNguon && (
            <div className="pt-1 flex items-center justify-end">
              <a
                href={linkNguon}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xanh font-bold hover:underline"
              >
                <span>Xem văn bản tuyển sinh gốc</span>
                <ExternalLink size={13} />
              </a>
            </div>
          )}

          {/* Hàng nút thao tác: Đổi thứ tự và Xóa */}
          <div className="pt-2 border-t border-vien flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onMoveUp}
                disabled={isFirst}
                aria-label={`Chuyển ${nvLabel} lên trên`}
                className="size-9 rounded-lg border border-vien bg-trang grid place-items-center text-chu-phu disabled:opacity-30 active:bg-xanh-nhat transition-colors"
              >
                <ArrowUp size={16} />
              </button>
              <button
                type="button"
                onClick={onMoveDown}
                disabled={isLast}
                aria-label={`Chuyển ${nvLabel} xuống dưới`}
                className="size-9 rounded-lg border border-vien bg-trang grid place-items-center text-chu-phu disabled:opacity-30 active:bg-xanh-nhat transition-colors"
              >
                <ArrowDown size={16} />
              </button>
            </div>

            <button
              type="button"
              onClick={onDelete}
              aria-label={`Xóa ${nvLabel}`}
              className="px-2.5 h-9 rounded-lg text-do-chu border border-do/30 bg-trang hover:bg-do-nhat inline-flex items-center gap-1 font-bold text-[12px] transition-colors"
            >
              <Trash2 size={15} />
              <span>Xóa</span>
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

/** Thông tin kiểm chứng nguồn tuyển sinh */
export function AdmissionSourceDisclosure({
  status,
  nam,
  linkNguon,
}: {
  status: AcademicDisplayModel["sourceStatus"];
  nam: number;
  linkNguon?: string;
}) {
  return (
    <div className="flex items-center gap-1.5 text-[11px] text-chu-phu">
      {status === "de_an_chinh_thuc" || status === "da_kiem_chung" ? (
        <ShieldCheck size={14} className="text-luc shrink-0" />
      ) : (
        <AlertCircle size={14} className="text-cam-chu shrink-0" />
      )}
      <span>Năm đối chiếu: {nam}</span>
      {linkNguon && (
        <>
          <span>·</span>
          <a href={linkNguon} target="_blank" rel="noreferrer" className="text-xanh font-semibold hover:underline">
            Nguồn gốc
          </a>
        </>
      )}
    </div>
  );
}

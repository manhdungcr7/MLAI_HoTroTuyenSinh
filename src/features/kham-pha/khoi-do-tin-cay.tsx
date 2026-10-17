// Khối "Độ tin cậy dữ liệu" trên trang Về dữ liệu: vài dòng ngắn, mọi số ĐẾM từ danh mục đang dùng (không số cứng).
// Giải thích dài để ở slide (docs/NOI-DUNG-CHO-SLIDE.md), không nhồi vào app.
import { useMemo } from "react";
import { Calendar, CalendarRange, Minus, Shuffle } from "lucide-react";
import { KhungDangTai, KhungLoi } from "@/components/ui/hien-thi";
import { TheNen } from "@/components/ui/thiet-ke";
import { LUA_CHON_MAU } from "@/data/lua-chon-mau";
import { namTuyenSinhToi, thongKeBienDong } from "@/engine/du-bao-diem-chuan";
import { tinhDoTinCayDuLieu, type DoTinCayDuLieu } from "@/engine/do-tin-cay-du-lieu";
import type { LoaiDuLieu } from "@/engine/trang-thai-du-lieu";
import { useBanDuLieu, useDuLieuSan } from "@/state/dung-kho-du-lieu";

const so = (n: number) => n.toLocaleString("vi-VN");

/** Bốn phần của thanh xếp chồng (theo thứ tự từ mạnh tới yếu). Màu luôn đi cùng icon và chữ. */
const PHAN: { loai: Exclude<LoaiDuLieu, "khongDu">; nhan: string; icon: typeof Calendar; nen: string; chu: string; thanh: string }[] = [
  { loai: "nhieuNam", nhan: "điểm từ 2 năm trở lên", icon: CalendarRange, nen: "bg-luc-nhat", chu: "text-luc-chu", thanh: "bg-luc" },
  { loai: "motNam", nhan: "điểm chỉ một năm", icon: Calendar, nen: "bg-xanh-nhat", chu: "text-xanh", thanh: "bg-xanh" },
  { loai: "chiDiemSan", nhan: "chỉ có điểm sàn 15", icon: Minus, nen: "bg-cam-nhat", chu: "text-cam-chu", thanh: "bg-cam" },
  { loai: "phuongThucKhac", nhan: "xét bằng phương thức khác", icon: Shuffle, nen: "bg-tim-nhat", chu: "text-tim-chu", thanh: "bg-tim" },
];

function cauDuBao(d: DoTinCayDuLieu): string {
  const { cao, vua, thap } = d.duBaoTheoTinCay;
  const phan = [
    cao > 0 && `${so(cao)} tin cậy cao`,
    vua > 0 && `${so(vua)} tin cậy vừa`,
    thap > 0 && `${so(thap)} tin cậy thấp`,
  ].filter(Boolean);
  if (phan.length === 0) return `Dự báo ${d.namDuBao}: chưa có chương trình nào đủ dữ liệu để dự báo.`;
  return `Dự báo ${d.namDuBao}: ${phan.join(", ")}. Đều là khoảng tham khảo, không phải xác suất đậu.`;
}

export function KhoiDoTinCay() {
  const { san, loi, thuLai } = useDuLieuSan();
  const ban = useBanDuLieu();
  const d = useMemo(() => {
    if (!san) return null;
    return tinhDoTinCayDuLieu(LUA_CHON_MAU, thongKeBienDong(LUA_CHON_MAU), namTuyenSinhToi());
  }, [san, ban]);

  if (!d) {
    return (
      <TheNen as="section" aria-label="Độ tin cậy dữ liệu" className="space-y-3">
        <h2 className="text-[16px] font-extrabold text-muc">Độ tin cậy dữ liệu</h2>
        {loi
          ? <KhungLoi tieuDe="Chưa tải được số liệu" moTa="Mở lại để đếm độ tin cậy của dữ liệu." thuLai={thuLai} />
          : <KhungDangTai cao="h-24" soKhung={2} />}
      </TheNen>
    );
  }

  if (d.tong === 0) {
    return (
      <TheNen as="section" aria-label="Độ tin cậy dữ liệu" className="space-y-2">
        <h2 className="text-[16px] font-extrabold text-muc">Độ tin cậy dữ liệu</h2>
        <p className="text-[14px] text-chu">Chưa có chương trình nào trong dữ liệu đang dùng.</p>
      </TheNen>
    );
  }

  const hocPhi = d.hocPhiDaKiemChung > 0
    ? `Học phí đã đối chiếu văn bản: ${so(d.hocPhiDaKiemChung)} chương trình.`
    : "Học phí đã đối chiếu văn bản: chưa có, nên app không hiện học phí.";

  return (
    <TheNen as="section" aria-label="Độ tin cậy dữ liệu" className="space-y-3">
      <h2 className="text-[16px] font-extrabold text-muc">Độ tin cậy dữ liệu</h2>

      <div>
        <p className="text-[13px] text-chu-phu">
          Dữ liệu điểm chuẩn của {so(d.tong)} chương trình{d.namDiemMoiNhat !== null ? `, điểm mới nhất năm ${d.namDiemMoiNhat}` : ""}
        </p>
        <div aria-hidden className="mt-2 flex h-3 w-full overflow-hidden rounded-full bg-vien">
          {PHAN.map((p) => (
            <span key={p.loai} className={`${p.thanh} h-full`} style={{ width: `${(d.theoLoai[p.loai] / d.tong) * 100}%` }} />
          ))}
        </div>
        <ul className="mt-2.5 grid grid-cols-2 gap-2">
          {PHAN.map((p) => {
            const I = p.icon;
            return (
              <li key={p.loai} className="flex items-start gap-2 min-w-0">
                <span className={`size-7 rounded-lg grid place-items-center shrink-0 ${p.nen} ${p.chu}`}><I size={15} strokeWidth={2.2} aria-hidden /></span>
                <span className="text-[13px] leading-snug text-chu"><b className="block text-[15px] font-extrabold text-muc">{so(d.theoLoai[p.loai])}</b>{p.nhan}</span>
              </li>
            );
          })}
        </ul>
        {d.theoLoai.khongDu > 0 && (
          <p className="mt-2 text-[13px] text-chu-phu">Chưa có điểm hợp lệ: {so(d.theoLoai.khongDu)} chương trình.</p>
        )}
      </div>

      <ul className="space-y-1.5 text-[14px] leading-snug text-chu">
        <li>Nguồn: {so(d.nguonChinhThuc)} chương trình từ đề án PDF, {so(d.nguonTongHop)} từ trang tổng hợp{d.nguonKhac > 0 ? `, ${so(d.nguonKhac)} không ghi nguồn` : ""}.</li>
        <li>{hocPhi}</li>
        <li>{cauDuBao(d)}</li>
      </ul>

      <p className="text-[13px] text-chu-phu leading-snug">Đây là số đếm từ dữ liệu đang dùng. Điểm chuẩn là số các năm trước, năm nay có thể khác.</p>
    </TheNen>
  );
}

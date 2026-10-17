import { useEffect, useState } from "react";
import { CalendarDays, Flag } from "lucide-react";
import { HopTruot } from "@/components/ui/hien-thi";
import { OInput, Truong } from "@/components/ui/nhap-lieu";
import { Nut } from "@/components/ui/nut-the";
import { homNay } from "@/state/chon";
import type { LuaChon, MucTieuChinh } from "@/state/types";
import { diem1, kiemTraDiemMucTieu, kiemTraNgayThi } from "./tinh-toan";

/** Hộp sửa điểm mục tiêu và ngày thi dự kiến. Chỉ lưu khi cả hai hợp lệ. */
export function SuaMucTieu({ mo, dong, mt, lc, luu }: {
  mo: boolean; dong: () => void; mt: MucTieuChinh; lc: LuaChon; luu: (m: MucTieuChinh) => void;
}) {
  const [diem, setDiem] = useState(diem1(mt.diemMucTieu));
  const [ngay, setNgay] = useState(mt.ngayThi);
  const [daBam, setDaBam] = useState(false);

  // Mỗi lần mở lại thì nạp giá trị đang lưu.
  useEffect(() => {
    if (mo) { setDiem(diem1(mt.diemMucTieu)); setNgay(mt.ngayThi); setDaBam(false); }
  }, [mo, mt.diemMucTieu, mt.ngayThi]);

  const kqDiem = kiemTraDiemMucTieu(diem);
  const kqNgay = kiemTraNgayThi(ngay, homNay());
  const loiDiem = daBam && !kqDiem.ok ? kqDiem.loi : null;
  const loiNgay = daBam && !kqNgay.ok ? kqNgay.loi : null;

  const bamLuu = () => {
    setDaBam(true);
    if (!kqDiem.ok || !kqNgay.ok) return;
    luu({ ...mt, diemMucTieu: kqDiem.gia, ngayThi: kqNgay.gia });
    dong();
  };

  return (
    <HopTruot mo={mo} dong={dong} tieuDe="Sửa mục tiêu">
      <div className="space-y-4">
        <div>
          <Truong nhan="Điểm mục tiêu (tổng 3 môn)" goiY="Nhập số từ 1 đến 30, ví dụ 26 hoặc 26.5.">
            <OInput bieuTuong={Flag} inputMode="decimal" value={diem} onChange={(e) => setDiem(e.target.value)}
              aria-invalid={!!loiDiem} aria-describedby={loiDiem ? "loi-diem-muc-tieu" : undefined} />
          </Truong>
          {loiDiem && <p id="loi-diem-muc-tieu" role="alert" className="text-[13px] font-semibold text-do-chu mt-1">{loiDiem}</p>}
          <button type="button" onClick={() => setDiem(diem1(lc.diemMin))}
            className="mt-2 min-h-11 px-3 rounded-xl bg-xanh-nhat text-xanh text-[13px] font-bold text-left">
            Dùng mức tham khảo {lc.namDiem}: {diem1(lc.diemMin)} điểm
          </button>
          <p className="text-[13px] text-chu-phu mt-1">Mức tham khảo là điểm chuẩn các năm trước.</p>
        </div>
        <div>
          <Truong nhan="Ngày thi dự kiến" goiY="Dùng để đếm số ngày còn lại.">
            <OInput bieuTuong={CalendarDays} type="date" value={ngay} min={homNay()} onChange={(e) => setNgay(e.target.value)}
              aria-invalid={!!loiNgay} aria-describedby={loiNgay ? "loi-ngay-thi" : undefined} />
          </Truong>
          {loiNgay && <p id="loi-ngay-thi" role="alert" className="text-[13px] font-semibold text-do-chu mt-1">{loiNgay}</p>}
        </div>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Nut kieu="vien" onClick={dong}>Hủy</Nut>
          <Nut onClick={bamLuu}>Lưu</Nut>
        </div>
      </div>
    </HopTruot>
  );
}

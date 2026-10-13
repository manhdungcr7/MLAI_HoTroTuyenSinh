// Hộp "Gợi ý danh sách cho em": xem trước danh sách cân bằng mình đề xuất, rồi thêm tất cả hoặc từng ngành.
import { useMemo } from "react";
import { Plus, Sparkles } from "lucide-react";
import { NhanNguyenVongTag } from "@/components/ui/co-cau";
import { HopTruot } from "@/components/ui/hien-thi";
import { HuyHieuTruong } from "@/components/ui/hinh-nen";
import { Nut } from "@/components/ui/nut-the";
import { kyHieu } from "@/features/kham-pha/thanh-phan";
import { coDiemDeSo, boiCanhTu } from "@/features/kham-pha/phu-hop";
import { diemDayDu } from "@/features/kham-pha/to-hop";
import { useApp } from "@/state/store";
import { goiYDanhSach } from "./goi-y-danh-sach";
import { dinhDang } from "@/engine/dinh-dang";

export function NutGoiYDanhSach({ onMo, kieu = "mac-dinh" }: { onMo: () => void; kieu?: "mac-dinh" | "vien" }) {
  const { s } = useApp();
  const co = coDiemDeSo(boiCanhTu(s));
  return (
    <Nut kieu={kieu === "vien" ? "vien" : undefined} bieuTuong={Sparkles} onClick={onMo} disabled={!co}>
      {co ? "Gợi ý danh sách cho em" : "Nhập điểm để nhận gợi ý"}
    </Nut>
  );
}

export function GoiYSheet({ mo, dong }: { mo: boolean; dong: () => void }) {
  const { s, themNguyenVong } = useApp();
  const ds = useMemo(() => (mo ? goiYDanhSach(diemDayDu(s), s.hoSo, s.nguyenVong) : []), [mo, s]);
  const themTatCa = () => { ds.forEach((d) => themNguyenVong(d.lc.id)); dong(); };
  return (
    <HopTruot mo={mo} dong={dong} tieuDe="Gợi ý danh sách cho em">
      <p className="text-[14px] text-chu">Mình chọn các ngành theo điểm, nhóm ngành, khu vực và ngân sách của em, để danh sách có đủ Thử sức, Vừa sức, An toàn và Dự phòng. Em bỏ bớt hoặc sắp lại sau cũng được.</p>
      {ds.length === 0 ? (
        <p className="mt-3 text-[14px] text-chu-phu">Chưa tìm được ngành nào hợp. Em thử nới ngân sách hoặc khu vực trong hồ sơ nhé.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {ds.map((d) => (
            <li key={d.lc.id} className="rounded-the border border-vien bg-trang p-3">
              <div className="flex items-start gap-2.5">
                <HuyHieuTruong ten={kyHieu(d.lc.truong)} tone={d.lc.tone} kichThuoc={36} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <b className="text-[15px] text-muc leading-snug">{d.lc.nganh}</b>
                    <NhanNguyenVongTag nhan={d.nhan} />
                  </div>
                  <p className="text-[13px] text-chu-phu">{d.lc.truong} · {d.lc.khuVuc} · điểm chuẩn {dinhDang(d.lc.diemMin, 1).replace(".", ",")} ({d.lc.namDiem})</p>
                  <ul className="mt-1 space-y-0.5">
                    {d.lyDo.map((r) => <li key={r} className="text-[12px] text-chu-phu">• {r}</li>)}
                  </ul>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-[12px] text-chu-phu">Nhãn là gợi ý theo điểm chuẩn các năm trước, không phải cam kết trúng tuyển. Em đối chiếu với đề án của trường trước khi quyết định.</p>
      {ds.length > 0 && <div className="mt-3"><Nut bieuTuong={Plus} onClick={themTatCa}>Lưu cả {ds.length} ngành vào danh sách</Nut></div>}
    </HopTruot>
  );
}

// Thẻ hành trình ở màn Hôm nay: bốn dòng kể chuyện từ dữ liệu thật của em. Em đang ở đâu · Vì sao quan trọng · Đổi gì thì khác · Hôm nay làm gì.
// Không phần trăm, không "đậu/trượt". Số ngành đến từ `doNhayTheoMon` (cùng nguồn với Bản đồ cơ hội), tính lúc rảnh để không chặn màn.
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, FlaskConical, PencilLine } from "lucide-react";
import { Nut } from "@/components/ui/nut-the";
import { TheNen } from "@/components/ui/thiet-ke";
import { LUA_CHON_MAU } from "@/data/lua-chon-mau";
import { DUONG_DAN } from "@/duong-dan";
import { doNhayTheoMon, type DoNhayMon } from "@/engine/ban-do-co-hoi";
import { dinhDangDiem, dinhDangSo } from "@/engine/dinh-dang";
import { namDuBaoHienTai, useDiemEm, useTinhLucRanh } from "@/features/co-hoi/dung-co-hoi";
import { tongChoLuaChon } from "@/features/kham-pha/to-hop";
import { homNay, khoangCachCuaToi, viecConLai } from "@/state/chon";
import { useApp } from "@/state/store";
import { viecTrongNgay } from "./tinh-toan";

const NHAN = "text-[13px] font-bold text-chu-phu";
const NOI = "text-[14px] leading-snug text-chu line-clamp-3";

/** Môn nhạy nhất: mở ra nhiều ngành nhất, rồi đổi nhãn nhiều nhất. Môn đã đạt 10 không còn dư địa. */
const monNhayNhat = (ds: DoNhayMon[]): DoNhayMon | null =>
  [...ds].filter((m) => !m.daToiDa).sort((a, b) => b.moRa - a.moRa || b.doiNhan - a.doiNhan || a.ten.localeCompare(b.ten, "vi"))[0] ?? null;

export function TheHanhTrinh() {
  const { s } = useApp();
  const nav = useNavigate();
  const { diem, khoa } = useDiemEm();
  const tot = useMemo(() => tongChoLuaChon({ toHopXet: [] }, diem), [diem]);
  const coDiem = tot.tong !== null && tot.toHop !== null;
  const [ket] = useTinhLucRanh(coDiem ? khoa : "trong", () => (coDiem ? doNhayTheoMon(LUA_CHON_MAU, diem, undefined, namDuBaoHienTai(), 1) : null));

  if (!coDiem) {
    return (
      <TheNen tong="xanh" as="section" aria-label="Hành trình của em" className="space-y-2">
        <h2 className="text-[16px] font-extrabold text-muc">Hành trình của em</h2>
        <p className="text-[14px] leading-snug text-chu">Nhập điểm đủ ba môn của một tổ hợp để thấy mình đang ở đâu và nên học gì trước.</p>
        <Nut kieu="vien" bieuTuong={PencilLine} onClick={() => nav(DUONG_DAN.batDau(2))}>Nhập điểm</Nut>
      </TheNen>
    );
  }

  const nhay = ket.trang === "xong" && ket.kq ? monNhayNhat(ket.kq.theoMon) : null;
  const buoc = ket.trang === "xong" && ket.kq ? ket.kq.buoc : 1;
  const xaNhat = [...khoangCachCuaToi(s)].filter((k) => k.thieu > 0).sort((a, b) => b.thieu - a.thieu)[0] ?? null;
  const viec = viecTrongNgay(s, homNay()).find((v) => !v.xong) ?? null;
  const viecTiep = viec ? null : viecConLai(s)[0] ?? null;

  const vi: string = xaNhat
    ? `${xaNhat.ten} đang cách mục tiêu xa nhất, còn thiếu khoảng ${dinhDangDiem(xaNhat.thieu)} điểm.`
    : ket.trang === "tinh" ? "Đang tìm môn đáng học nhất…"
      : nhay ? `${nhay.ten} là môn cộng thêm điểm sẽ đổi nhiều ngành nhất.`
        : "Chưa thấy môn nào đổi được nhãn ngành khi cộng 1 điểm.";
  const doi: string = ket.trang === "tinh" ? "Đang tính số ngành…"
    : ket.trang === "loi" ? "Chưa tính được lúc này."
      : nhay ? `+${dinhDangDiem(buoc)} điểm ${nhay.ten}: thêm ${dinhDangSo(nhay.doiNhan)} ngành lên nhãn cao hơn.`
        : "Cộng 1 điểm một môn chưa đổi nhãn ngành nào.";

  return (
    <TheNen tong="xanh" as="section" aria-label="Hành trình của em" className="space-y-3">
      <h2 className="text-[16px] font-extrabold text-muc">Hành trình của em</h2>
      <div>
        <span className={NHAN}>Em đang ở đâu</span>
        <p className={NOI}>Tổ hợp {tot.toHop} cao nhất: <b>{dinhDangDiem(tot.tong)}</b>/30 điểm.</p>
      </div>
      <div>
        <span className={NHAN}>Vì sao quan trọng</span>
        <p className={NOI}>{vi}</p>
      </div>
      <div>
        <span className={NHAN}>Đổi gì thì khác</span>
        <p className={NOI}>{doi}</p>
        <p className="text-[13px] text-chu-phu">So với điểm chuẩn năm gần nhất, không phải xác suất đậu.</p>
        <Nut kieu="nhe" bieuTuong={FlaskConical} muiTen onClick={() => nav(DUONG_DAN.phongThuDiem())} className="mt-1">Thử điểm</Nut>
      </div>
      <div>
        <span className={NHAN}>Hôm nay làm gì</span>
        {viec ? (
          <button type="button" onClick={() => nav(DUONG_DAN.viec(viec.viec.id))} className="w-full min-h-11 flex items-center gap-2 text-left cursor-pointer">
            <span className={`${NOI} flex-1 min-w-0`}>{viec.viec.tieuDe} <span className="text-chu-phu">· {viec.phut} phút</span></span>
            <ChevronRight size={18} className="text-chu-phu shrink-0" aria-hidden />
          </button>
        ) : viecTiep ? (
          <button type="button" onClick={() => nav(DUONG_DAN.viec(viecTiep.id))} className="w-full min-h-11 flex items-center gap-2 text-left cursor-pointer">
            <span className={`${NOI} flex-1 min-w-0`}>Hôm nay trống lịch. Rảnh thì làm trước: {viecTiep.tieuDe}</span>
            <ChevronRight size={18} className="text-chu-phu shrink-0" aria-hidden />
          </button>
        ) : (
          <p className={NOI}>Chưa có việc cho hôm nay. <button type="button" onClick={() => nav(DUONG_DAN.tuan())} className="font-bold text-xanh min-h-11 cursor-pointer">Lập kế hoạch tuần</button></p>
        )}
      </div>
    </TheNen>
  );
}

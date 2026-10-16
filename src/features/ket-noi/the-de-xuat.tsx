import { useEffect, useRef, useState } from "react";
import { Nut } from "@/components/ui/nut-the";
import { useApp, type AppState } from "@/state/store";
import { apDungDeXuat, LOAI_AP_DUNG_DUOC, taoBanChup } from "@/state/ket-noi";
import type { DeXuat } from "@/engine/ket-noi-kieu";
import { dongBoNgay, ghiLoi, useKetNoi } from "./quan-ly";
import { layDeXuat, quyetDinhDeXuat } from "./api";

const KHOANG_HOI_MS = 4_000; // hỏi máy chủ có đề xuất mới
const CHO_DONG_BO_MS = 5_000; // gom các thay đổi liên tiếp trước khi đẩy bản chụp

/**
 * Thẻ nổi "Claude đề xuất" và đồng bộ nền. Chỉ chạy khi đã bật kết nối.
 * Không bao giờ đổi dữ liệu nếu em không bấm Xác nhận; áp dụng xong mới báo máy chủ.
 */
export function KetNoiNen() {
  const { s, datNguyenVong } = useApp();
  const kn = useKetNoi();
  const ma = kn.ma;
  const [ds, setDs] = useState<DeXuat[]>([]);
  const [dangGui, setDangGui] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const dangHoi = useRef(false);
  const sigDaDong = useRef("");
  const sRef = useRef<AppState>(s);
  sRef.current = s;

  // Đồng bộ nền: khi hồ sơ, nguyện vọng hoặc kế hoạch đổi (chỉ khi có bản chụp khác bản đã gửi).
  useEffect(() => {
    if (!ma) return;
    const h = setTimeout(() => {
      const b = taoBanChup(s);
      const sig = JSON.stringify({ ...b, capNhat: "" });
      if (sig === sigDaDong.current) return;
      sigDaDong.current = sig;
      void dongBoNgay(s).then((ok) => { if (!ok) sigDaDong.current = ""; });
    }, CHO_DONG_BO_MS);
    return () => clearTimeout(h);
  }, [s, ma]);

  // Hỏi đề xuất mới: chỉ khi tab đang hiển thị; quay lại tab thì hỏi ngay.
  useEffect(() => {
    if (!ma) { setDs([]); return; }
    const hoi = async () => {
      if (document.hidden || dangHoi.current) return;
      dangHoi.current = true;
      const kq = await layDeXuat(ma);
      dangHoi.current = false;
      if (kq.ok && Array.isArray(kq.du.deXuat)) setDs(kq.du.deXuat);
    };
    const khiDoiTab = () => { if (!document.hidden) void hoi(); };
    void hoi();
    const h = setInterval(hoi, KHOANG_HOI_MS);
    document.addEventListener("visibilitychange", khiDoiTab);
    return () => { clearInterval(h); document.removeEventListener("visibilitychange", khiDoiTab); };
  }, [ma]);

  if (!ma || ds.length === 0) return null;
  const d = ds[0];
  const coTheAp = LOAI_AP_DUNG_DUOC.includes(d.loai);

  const xacNhan = async () => {
    if (!ma) return;
    const kq = apDungDeXuat(sRef.current, d);
    if (!kq.ok) { setLoi(kq.chu); return; }
    if (kq.capNhat.nguyenVong) datNguyenVong(kq.capNhat.nguyenVong);
    setDangGui(true); setLoi(null);
    const gui = await quyetDinhDeXuat(ma, d.id, "xac-nhan");
    setDangGui(false);
    if (gui.ok) { setDs((x) => x.filter((k) => k.id !== d.id)); ghiLoi(null); }
    else setLoi("Đã áp dụng trên máy, nhưng chưa báo được máy chủ. Bấm Xác nhận lại để hoàn tất.");
  };

  const boQua = async () => {
    if (!ma) return;
    setDangGui(true); setLoi(null);
    const gui = await quyetDinhDeXuat(ma, d.id, "tu-choi");
    setDangGui(false);
    if (gui.ok) setDs((x) => x.filter((k) => k.id !== d.id));
    else setLoi("Chưa bỏ qua được. Bấm Bỏ qua lại.");
  };

  return (
    <div role="region" aria-label="Đề xuất từ Claude"
      className="fixed inset-x-3 z-40 mx-auto max-w-[406px] rounded-2xl border border-vien bg-trang p-3 shadow-lg bottom-[calc(9.5rem+env(safe-area-inset-bottom))]">
      <p className="text-[14px] font-semibold text-muc">Claude đề xuất: {d.tomTat}</p>
      {loi && <p role="alert" className="mt-1 text-[13px] text-do-chu">{loi}</p>}
      {ds.length > 1 && <p className="mt-1 text-[12px] text-chu-phu">Còn {ds.length - 1} đề xuất khác sau mục này.</p>}
      <div className={coTheAp ? "mt-2 grid grid-cols-2 gap-2" : "mt-2"}>
        {coTheAp && <Nut onClick={xacNhan} disabled={dangGui}>Xác nhận</Nut>}
        <Nut kieu="vien" onClick={boQua} disabled={dangGui}>Bỏ qua</Nut>
      </div>
    </div>
  );
}

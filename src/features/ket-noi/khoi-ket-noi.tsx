import { useEffect, useState } from "react";
import { Link2, RefreshCw, Unplug } from "lucide-react";
import { Nut, The } from "@/components/ui/nut-the";
import { TieuDeMuc } from "@/components/ui/hien-thi";
import { useApp } from "@/state/store";
import { batKetNoi, dongBoNgay, ghiLoi, ngatVaXoa, taiTrangThai, useKetNoi } from "./quan-ly";
import { HuongDanKetNoi, saoChep } from "./huong-dan";

const gio = (x: string | number | null | undefined) => (x === null || x === undefined ? "chưa có" : new Date(x).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" }));
const ngay = (x: string | null) => (x ? new Date(x).toLocaleDateString("vi-VN") : "chưa rõ");

/** Khối "Kết nối Claude và ChatGPT" trong Cài đặt. Mặc định tắt; bật phải đồng ý trước khi tạo liên kết. */
export function KhoiKetNoi() {
  const { s } = useApp();
  const kn = useKetNoi();
  const [hoi, setHoi] = useState(false); // hộp đồng ý đang mở
  const [dangTao, setDangTao] = useState(false);
  const [mcp, setMcp] = useState<{ mcpUrl: string; actionsUrl: string } | null>(null); // chỉ giữ trong bộ nhớ: hiện một lần
  const [daChep, setDaChep] = useState(false);

  useEffect(() => { if (kn.ma) void taiTrangThai(); }, [kn.ma]);

  const bat = !!kn.ma;

  const dongY = async () => {
    setDangTao(true);
    const kq = await batKetNoi(s);
    setDangTao(false);
    if (kq.ok) { setMcp({ mcpUrl: kq.du.mcpUrl, actionsUrl: kq.du.actionsUrl }); setHoi(false); setDaChep(false); }
  };

  const doiCongTac = (bật: boolean) => {
    if (bật) { ghiLoi(null); setHoi(true); return; }
    setHoi(false);
    void ngatVaXoa().then((ok) => { if (ok) setMcp(null); });
  };

  return (
    <section>
      <TieuDeMuc>Kết nối Claude và ChatGPT</TieuDeMuc>
      <The className="space-y-3">
        <label className="flex items-start gap-3 min-h-11">
          <input type="checkbox" checked={bat || hoi} disabled={dangTao} onChange={(e) => doiCongTac(e.target.checked)}
            className="mt-0.5 size-5 shrink-0 accent-[var(--color-xanh)]" />
          <span className="text-[14px] text-chu">Cho Claude/ChatGPT xem hồ sơ của bạn <span className="text-chu-phu">(mặc định tắt)</span></span>
        </label>

        {hoi && !bat && (
          <div className="rounded-xl border border-vien bg-nen p-3 space-y-3">
            <p className="text-[14px] text-chu">Bản chụp gồm: điểm thi thử, mục tiêu, nguyện vọng, gợi ý ngành, và kế hoạch tuần. <span className="font-semibold">Không gồm</span> tên, liên hệ hay lịch sử trò chuyện với AI.</p>
            <p className="text-[13px] text-chu-phu">Ai có đường liên kết đều đọc được bản chụp này. Không cần đăng nhập.</p>
            <div className="grid grid-cols-2 gap-2">
              <Nut onClick={dongY} disabled={dangTao} bieuTuong={Link2}>{dangTao ? "Đang tạo…" : "Đồng ý và tạo"}</Nut>
              <Nut kieu="vien" onClick={() => { setHoi(false); }} disabled={dangTao}>Hủy</Nut>
            </div>
          </div>
        )}

        {mcp && bat && (
          <div className="rounded-xl border border-cam/40 bg-nen p-3 space-y-2">
            <p className="text-[13px] text-cam-chu">Liên kết này chỉ hiện một lần. Hãy sao chép và cất ở nơi an toàn; sau khi rời trang sẽ không xem lại được. Muốn dùng tiếp thì bấm Tạo lại.</p>
            <p className="text-[12px] text-chu break-all select-all font-mono">{mcp.mcpUrl}</p>
            <div className="grid grid-cols-2 gap-2">
              <Nut kieu="vien" onClick={async () => setDaChep(await saoChep(mcp.mcpUrl))}>{daChep ? "Đã sao chép" : "Sao chép liên kết"}</Nut>
              <Nut kieu="vien" onClick={() => setMcp(null)}>Đã cất</Nut>
            </div>
          </div>
        )}

        {bat && (
          <div className="space-y-2 text-[13px] text-chu-phu">
            <p>Kết nối đang bật. Hạn dùng đến <span className="font-semibold text-chu">{ngay(kn.hetHan)}</span>. Đã có <span className="font-semibold text-chu">{kn.soTruyCap}</span> lần đọc.</p>
            <p>Cập nhật lần cuối: <span className="font-semibold text-chu">{gio(kn.lanCuoi)}</span></p>
          </div>
        )}

        {kn.loi && (
          <div role="alert" className="space-y-2">
            <p className="text-[13px] text-do-chu">{kn.loi}</p>
            {bat && <Nut kieu="vien" onClick={() => void dongBoNgay(s)} bieuTuong={RefreshCw}>Thử lại</Nut>}
          </div>
        )}
        <p role="status" className="sr-only">{kn.dang ? "Đang xử lý kết nối" : ""}</p>

        {bat && (
          <div className="grid grid-cols-2 gap-2">
            <Nut kieu="vien" bieuTuong={RefreshCw} disabled={kn.dang} onClick={() => void dongBoNgay(s)}>Đồng bộ ngay</Nut>
            <Nut kieu="vien" bieuTuong={Link2} disabled={kn.dang || dangTao} onClick={() => setHoi(true)}>Tạo lại</Nut>
            <Nut kieu="nguyHiem" bieuTuong={Unplug} disabled={kn.dang} className="col-span-2" onClick={() => void ngatVaXoa().then((ok) => { if (ok) setMcp(null); })}>Ngắt kết nối và xóa</Nut>
          </div>
        )}

        {bat && hoi && (
          <div className="rounded-xl border border-vien bg-nen p-3 space-y-3">
            <p className="text-[14px] text-chu">Tạo liên kết mới với bản chụp hiện tại. Liên kết cũ có thể không còn dùng được.</p>
            <div className="grid grid-cols-2 gap-2">
              <Nut onClick={dongY} disabled={dangTao}>{dangTao ? "Đang tạo…" : "Đồng ý và tạo"}</Nut>
              <Nut kieu="vien" onClick={() => setHoi(false)} disabled={dangTao}>Hủy</Nut>
            </div>
          </div>
        )}

        {(bat || mcp) && <HuongDanKetNoi mcpUrl={mcp?.mcpUrl ?? null} actionsUrl={mcp?.actionsUrl ?? null} />}

        <p className="text-[12px] text-chu-phu">Không cần đăng nhập; bảo vệ bằng liên kết bí mật. Ngắt kết nối là xóa bản chụp trên máy chủ.</p>
      </The>
    </section>
  );
}

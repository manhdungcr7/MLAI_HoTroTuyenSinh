// Nút "Thêm vào lịch" trên màn Kế hoạch tuần: tải file .ics hoặc mở Google Calendar cho việc đã xếp giờ trong tuần này.
import { useEffect, useMemo, useState } from "react";
import { CalendarPlus, Copy, Download, ExternalLink, RefreshCw, RotateCcw } from "lucide-react";
import { Nut } from "@/components/ui/nut-the";
import { HopTruot } from "@/components/ui/hien-thi";
import { linkGoogleCalendar, suKienTuanNay, taoIcs } from "@/engine/lich-ics";
import type { SuKienLich } from "@/engine/ket-noi-kieu";
import { useApp } from "@/state/store";
import { ngayThang } from "./dinh-dang";
import { baoFeedThuLai, docFeedLich, ghiFeedLich, taoFeedLich, thuHoiFeedLich, TIN_FEED, type FeedLich } from "./lich-feed";

const gioNgan = (iso: string) => iso.slice(11, 16);

export function ThemVaoLich() {
  const { s } = useApp();
  const [mo, setMo] = useState(false);
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [feed, setFeed] = useState<FeedLich | null>(() => docFeedLich());
  const [dangXuLyFeed, setDangXuLyFeed] = useState(false);
  const [hoiThuHoi, setHoiThuHoi] = useState(false);
  const [tinFeed, setTinFeed] = useState<string | null>(null);
  const suKien = useMemo(() => suKienTuanNay(s), [s]);

  useEffect(() => {
    const nap = () => {
      const latest = docFeedLich();
      setFeed(latest);
      if (latest?.lanDongBo) setTinFeed(null);
    };
    window.addEventListener(TIN_FEED.thayDoi, nap);
    window.addEventListener(TIN_FEED.trangThai, nap);
    window.addEventListener("storage", nap);
    return () => {
      window.removeEventListener(TIN_FEED.thayDoi, nap);
      window.removeEventListener(TIN_FEED.trangThai, nap);
      window.removeEventListener("storage", nap);
    };
  }, []);

  const taiFile = () => {
    setLoi(null);
    setDang(true);
    // Để trạng thái "Đang tạo" kịp hiện trước khi dựng file.
    window.setTimeout(() => {
      try {
        const url = URL.createObjectURL(new Blob([taoIcs(suKien)], { type: "text/calendar;charset=utf-8" }));
        const a = document.createElement("a");
        a.href = url;
        a.download = "ke-hoach-tuan.ics";
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      } catch {
        setLoi("Chưa tạo được file lịch. Bạn thử lại nhé.");
      } finally {
        setDang(false);
      }
    }, 0);
  };

  const taoFeed = async () => {
    setDangXuLyFeed(true); setTinFeed(null);
    try {
      const moi = await taoFeedLich();
      if (!ghiFeedLich(moi)) {
        await thuHoiFeedLich(moi).catch(() => undefined);
        throw new Error("Trình duyệt chưa lưu được liên kết. Em kiểm tra dung lượng máy rồi thử lại nhé.");
      }
      setFeed(moi);
      baoFeedThuLai();
      setTinFeed("Đã tạo liên kết. Đang gửi lịch tuần lên máy chủ.");
    } catch (error) { setTinFeed(error instanceof Error ? error.message : "Chưa tạo được liên kết lịch."); }
    finally { setDangXuLyFeed(false); }
  };

  const saoChep = async () => {
    if (!feed) return;
    try { await navigator.clipboard.writeText(feed.feedUrl); setTinFeed("Đã sao chép liên kết lịch."); }
    catch { setTinFeed("Chưa sao chép được. Em chọn và sao chép đường dẫn bên dưới nhé."); }
  };

  const thuHoi = async () => {
    if (!feed) return;
    setDangXuLyFeed(true); setTinFeed(null);
    try {
      await thuHoiFeedLich(feed);
      ghiFeedLich(null);
      setFeed(null); setHoiThuHoi(false);
      setTinFeed("Đã thu hồi liên kết. Lịch bên ngoài sẽ không lấy được cập nhật mới nữa.");
    } catch (error) { setTinFeed(error instanceof Error ? error.message : "Chưa thu hồi được liên kết."); }
    finally { setDangXuLyFeed(false); }
  };

  return (
    <div className="space-y-2">
      <Nut kieu="vien" bieuTuong={dang ? undefined : CalendarPlus} disabled={dang || suKien.length === 0} aria-expanded={mo} onClick={() => setMo((v) => !v)}>
        {dang ? "Đang tạo…" : "Thêm vào lịch"}
      </Nut>
      {suKien.length === 0 && <p className="text-sm text-chu-phu">Xếp giờ cho việc trước, rồi thêm vào lịch của bạn.</p>}
      {loi && <p role="alert" className="text-sm text-do-chu">{loi}</p>}
      {mo && suKien.length > 0 && (
        <div className="rounded-[14px] border border-vien bg-trang p-3 space-y-2">
          <Nut kieu="nhe" bieuTuong={Download} onClick={taiFile}>Tải file .ics</Nut>
          <p className="text-sm font-bold text-chu pt-1">Google Calendar</p>
          {suKien.length === 1 ? (
            <LienKetGoogle e={suKien[0]} nhan="Mở trong Google Calendar" />
          ) : (
            <>
              <p className="text-sm text-chu-phu">Mỗi việc một liên kết, bạn bấm lần lượt.</p>
              <ul className="space-y-1">
                {suKien.map((e) => (
                  <li key={e.batDau + e.tieuDe}>
                    <LienKetGoogle e={e} nhan={`${ngayThang(e.batDau.slice(0, 10))} · ${gioNgan(e.batDau)} ${e.tieuDe}`} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
      <section className="rounded-[14px] border border-vien bg-trang p-3 space-y-2">
        <div>
          <p className="text-sm font-bold text-chu">Đồng bộ lịch tự động</p>
          <p className="text-[13px] text-chu-phu line-clamp-2">Chỉ nhận sự kiện, không cần đăng nhập Google.</p>
        </div>
        {s.hoSo.laMau && !feed ? (
          <p className="text-[13px] text-chu-phu line-clamp-2">Lịch hồ sơ mẫu không gửi lên máy chủ.</p>
        ) : feed ? (
          <>
            <label className="block text-[13px] font-semibold text-chu" htmlFor="nvai-feed-url">Liên kết riêng của lịch</label>
            <input id="nvai-feed-url" readOnly value={feed.feedUrl} onFocus={(e) => e.currentTarget.select()}
              className="w-full min-h-11 rounded-[10px] border border-vien bg-trang px-3 text-[13px] text-chu" />
            <div className="grid grid-cols-2 gap-2">
              <Nut kieu="vien" bieuTuong={Copy} onClick={() => void saoChep()}>Sao chép link</Nut>
              {feed.dangThuHoi
                ? <Nut kieu="vien" bieuTuong={RefreshCw} disabled={dangXuLyFeed} onClick={() => void thuHoi()}>Thử thu hồi</Nut>
                : <Nut kieu="vien" bieuTuong={RefreshCw} disabled={dangXuLyFeed || s.hoSo.laMau} onClick={baoFeedThuLai}>Thử đồng bộ</Nut>}
            </div>
            <p role="status" className={feed.loi ? "text-[13px] text-do-chu" : "text-[13px] text-luc-chu"}>
              {feed.loi || (feed.lanDongBo ? `Đã đồng bộ ${new Date(feed.lanDongBo).toLocaleString("vi-VN")}. Google Calendar sẽ tự lấy lại lịch.` : "Đang chờ lần đồng bộ đầu tiên.")}
            </p>
            <p className="text-[13px] text-chu-phu">Ai có liên kết này đều xem được lịch tuần. Khi thu hồi, hãy xóa lịch đã thêm ở Google Calendar.</p>
            {feed.dangThuHoi
              ? <p className="text-[13px] text-chu-phu">Đang thu hồi liên kết. Nếu thiết bị mất mạng, bấm “Thử thu hồi”.</p>
              : <button type="button" onClick={() => setHoiThuHoi(true)} className="inline-flex min-h-11 items-center gap-2 px-2 text-sm font-bold text-do-chu">
                  <RotateCcw size={16} /> Thu hồi liên kết
                </button>}
          </>
        ) : (
          <>
            <p className="text-[13px] text-chu-phu">Tạo một liên kết riêng để Google Calendar tự lấy lịch. Em có thể thu hồi bất cứ lúc nào.</p>
            <Nut kieu="vien" bieuTuong={CalendarPlus} disabled={dangXuLyFeed} onClick={() => void taoFeed()}>
              {dangXuLyFeed ? "Đang tạo…" : "Tạo liên kết lịch"}
            </Nut>
          </>
        )}
        {tinFeed && <p role="status" className="text-[13px] text-chu-phu">{tinFeed}</p>}
        {s.hoSo.laMau && feed && <p className="text-[13px] text-chu-phu">Hồ sơ mẫu không được đồng bộ lên lịch ngoài.</p>}
        {feed && <p className="text-[13px] text-chu-phu">Thêm trên máy tính: Google Calendar → dấu + cạnh “Lịch khác” → “Từ URL” → dán liên kết.</p>}
      </section>
      <HopTruot mo={hoiThuHoi} dong={() => setHoiThuHoi(false)} tieuDe="Thu hồi liên kết lịch?">
        <p className="mb-4 text-[14px] text-chu">Lịch ngoài sẽ không nhận cập nhật tiếp theo. Em cần xóa lịch đã thêm trong Google Calendar riêng.</p>
        <div className="grid grid-cols-2 gap-2">
          <Nut kieu="vien" onClick={() => setHoiThuHoi(false)}>Giữ liên kết</Nut>
          <Nut kieu="nguyHiem" disabled={dangXuLyFeed} onClick={() => void thuHoi()}>Thu hồi</Nut>
        </div>
      </HopTruot>
    </div>
  );
}

function LienKetGoogle({ e, nhan }: { e: SuKienLich; nhan: string }) {
  return (
    <a href={linkGoogleCalendar(e)} target="_blank" rel="noopener noreferrer"
      className="flex min-h-11 items-center gap-2 rounded-[10px] px-2 py-2 text-sm font-bold text-xanh active:bg-xanh-nhat">
      <ExternalLink size={16} className="shrink-0" />
      <span className="min-w-0 break-words">{nhan}</span>
    </a>
  );
}

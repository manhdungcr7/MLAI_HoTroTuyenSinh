// Nút "Thêm vào lịch" trên màn Kế hoạch tuần: tải file .ics hoặc mở Google Calendar cho việc đã xếp giờ trong tuần này.
import { useMemo, useState } from "react";
import { CalendarPlus, Download, ExternalLink } from "lucide-react";
import { Nut } from "@/components/ui/nut-the";
import { linkGoogleCalendar, suKienTuanNay, taoIcs } from "@/engine/lich-ics";
import type { SuKienLich } from "@/engine/ket-noi-kieu";
import { useApp } from "@/state/store";
import { ngayThang } from "./dinh-dang";

const gioNgan = (iso: string) => iso.slice(11, 16);

export function ThemVaoLich() {
  const { s } = useApp();
  const [mo, setMo] = useState(false);
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const suKien = useMemo(() => suKienTuanNay(s), [s]);

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

  if (suKien.length === 0) {
    return (
      <div className="space-y-2">
        <Nut kieu="vien" bieuTuong={CalendarPlus} disabled>Thêm vào lịch</Nut>
        <p className="text-sm text-chu-phu">Xếp giờ cho việc trước, rồi thêm vào lịch của bạn.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Nut kieu="vien" bieuTuong={dang ? undefined : CalendarPlus} disabled={dang} aria-expanded={mo} onClick={() => setMo((v) => !v)}>
        {dang ? "Đang tạo…" : "Thêm vào lịch"}
      </Nut>
      {loi && <p role="alert" className="text-sm text-do-chu">{loi}</p>}
      {mo && (
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

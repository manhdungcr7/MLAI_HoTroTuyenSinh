import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { gop } from "@/components/ui/nut-the";

/** Đoạn Instructions soạn sẵn cho GPT của riêng em. */
export const HUONG_DAN_GPT = `Bạn là trợ lý học tập cho học sinh THPT Việt Nam chọn ngành và trường. Trước khi trả lời về điểm, nguyện vọng, mục tiêu hay kế hoạch tuần, hãy dùng công cụ để đọc hồ sơ mới nhất của học sinh.
Không bịa số liệu. Chỉ nêu điểm chuẩn, học phí, tỷ lệ việc làm có trong dữ liệu, kèm năm và nguồn. Thiếu dữ liệu thì nói là chưa có.
Khi đề xuất thêm hoặc sắp lại nguyện vọng, chỉ tạo đề xuất để học sinh xác nhận trong ứng dụng; không nói rằng đã thay đổi.
Không nói ai đó chắc chắn đỗ hay trượt. Dùng "điểm phù hợp" thay cho xác suất.
Trả lời ngắn gọn bằng tiếng Việt, xưng "bạn".`;

type Tab = "claude" | "chatgpt";

/** Đường dẫn tuyệt đối: máy chủ có thể trả đường dẫn tương đối. */
export const duongDanDayDu = (p: string) => (p.startsWith("/") ? `${typeof window !== "undefined" ? window.location.origin : ""}${p}` : p);
/** GPT Actions cần tệp openapi.json: nếu máy chủ trả gốc thì nối thêm tên tệp. */
export const duongDanOpenApi = (actionsUrl: string) => (actionsUrl.endsWith("openapi.json") ? actionsUrl : `${actionsUrl.replace(/\/$/, "")}/openapi.json`);

export async function saoChep(chu: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(chu); return true; } catch { return false; }
}

function NutSaoChep({ chu, nhan = "Sao chép" }: { chu: string; nhan?: string }) {
  const [xong, setXong] = useState<boolean | null>(null);
  return (
    <button type="button" onClick={async () => setXong(await saoChep(chu))}
      className="min-h-11 px-3 inline-flex items-center justify-center gap-1.5 rounded-[10px] border border-vien text-[14px] font-bold text-xanh whitespace-nowrap cursor-pointer active:bg-xanh-nhat focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xanh">
      {xong ? <Check size={16} className="shrink-0" /> : <Copy size={16} className="shrink-0" />}
      {xong === null ? nhan : xong ? "Đã sao chép" : "Chưa sao chép được, hãy chọn và chép tay"}
    </button>
  );
}

/** Hai tab hướng dẫn. `mcpUrl` và `actionsUrl` chỉ có khi vừa tạo; sau đó hiện lời nhắc tạo lại. */
export function HuongDanKetNoi({ mcpUrl, actionsUrl }: { mcpUrl: string | null; actionsUrl: string | null }) {
  const [tab, setTab] = useState<Tab>("claude");
  const cls = (dang: boolean) => gop("flex-1 min-h-11 rounded-lg text-[14px] font-bold whitespace-nowrap cursor-pointer transition-colors", dang ? "bg-xanh text-white" : "text-chu-phu");
  return (
    <div className="space-y-3">
      <div role="tablist" aria-label="Chọn ứng dụng" className="flex bg-trang border border-vien rounded-xl p-1 gap-1">
        <button role="tab" type="button" aria-selected={tab === "claude"} onClick={() => setTab("claude")} className={cls(tab === "claude")}>Claude</button>
        <button role="tab" type="button" aria-selected={tab === "chatgpt"} onClick={() => setTab("chatgpt")} className={cls(tab === "chatgpt")}>ChatGPT</button>
      </div>

      {tab === "claude" && (
        <ol className="space-y-2 text-[14px] text-chu list-decimal pl-5">
          <li>Mở Claude, vào <span className="font-semibold">Settings</span> rồi <span className="font-semibold">Connectors</span>. Tên mục có thể khác tùy phiên bản.</li>
          <li>Chọn <span className="font-semibold">Add custom connector</span> (thêm kết nối tùy chỉnh).</li>
          <li>
            Dán liên kết MCP {mcpUrl ? <NutSaoChep chu={duongDanDayDu(mcpUrl)} nhan="Sao chép liên kết" /> : <span className="text-chu-phu">(bấm Tạo lại để nhận liên kết mới)</span>}
          </li>
          <li>Trong cuộc trò chuyện, bật kết nối này và hỏi: "Hồ sơ của tôi hiện thế nào?"</li>
        </ol>
      )}

      {tab === "chatgpt" && (
        <div className="space-y-3 text-[14px] text-chu">
          <p className="text-chu-phu">Với gói cá nhân, cách dùng được là tạo GPT của riêng bạn. Kết nối MCP trong ChatGPT tùy gói và thời điểm; nếu gói của bạn có mục này thì có thể dùng như Claude.</p>
          <ol className="space-y-2 list-decimal pl-5">
            <li>Mở ChatGPT, vào <span className="font-semibold">Explore GPTs</span> rồi <span className="font-semibold">Create</span>.</li>
            <li>Ở phần <span className="font-semibold">Instructions</span>, dán đoạn sau: <div className="mt-2"><NutSaoChep chu={HUONG_DAN_GPT} nhan="Sao chép hướng dẫn" /></div></li>
            <li>
              Ở <span className="font-semibold">Actions</span>, chọn <span className="font-semibold">Import from URL</span> và dán đường dẫn openapi.json, Authentication để <span className="font-semibold">None</span>.
              {actionsUrl ? <div className="mt-2"><NutSaoChep chu={duongDanOpenApi(duongDanDayDu(actionsUrl))} nhan="Sao chép đường dẫn" /></div> : <span className="block mt-1 text-chu-phu">(bấm Tạo lại để nhận đường dẫn mới)</span>}
            </li>
            <li>Lưu GPT, chọn <span className="font-semibold">Only me</span> (chỉ mình tôi), rồi hỏi thử: "Hồ sơ của tôi hiện thế nào?"</li>
          </ol>
        </div>
      )}
    </div>
  );
}

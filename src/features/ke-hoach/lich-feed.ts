import type { SuKienLich } from "@/engine/ket-noi-kieu";

const KHOA_FEED = "nvai:ke-hoach-lich-feed";
const SU_KIEN_FEED = "nvai-lich-feed-thay-doi";
const SU_KIEN_THU_LAI = "nvai-lich-feed-thu-lai";
const SU_KIEN_TRANG_THAI = "nvai-lich-feed-trang-thai";

export interface FeedLich {
  feedUrl: string;
  writeKey: string;
  lanDongBo?: string;
  loi?: string;
  dangThuHoi?: boolean;
}

export function docFeedLich(): FeedLich | null {
  try {
    const raw = localStorage.getItem(KHOA_FEED);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<FeedLich>;
    if (typeof value.feedUrl !== "string" || typeof value.writeKey !== "string") return null;
    return { feedUrl: value.feedUrl, writeKey: value.writeKey, ...(typeof value.lanDongBo === "string" ? { lanDongBo: value.lanDongBo } : {}), ...(typeof value.loi === "string" ? { loi: value.loi } : {}), ...(value.dangThuHoi === true ? { dangThuHoi: true } : {}) };
  } catch { return null; }
}

export function ghiFeedLich(feed: FeedLich | null): boolean {
  try {
    if (feed) localStorage.setItem(KHOA_FEED, JSON.stringify(feed));
    else localStorage.removeItem(KHOA_FEED);
    window.dispatchEvent(new Event(SU_KIEN_FEED));
    window.dispatchEvent(new Event(SU_KIEN_TRANG_THAI));
    return true;
  } catch { return false; }
}

export function capNhatTrangThaiFeed(patch: Pick<FeedLich, "lanDongBo" | "loi">): void {
  const feed = docFeedLich();
  if (!feed) return;
  ghiFeedLich({ ...feed, ...patch });
}

export const baoFeedDoi = () => window.dispatchEvent(new Event(SU_KIEN_FEED));
export const baoFeedThuLai = () => window.dispatchEvent(new Event(SU_KIEN_THU_LAI));
export const TIN_FEED = { thayDoi: SU_KIEN_FEED, thuLai: SU_KIEN_THU_LAI, trangThai: SU_KIEN_TRANG_THAI } as const;

async function docLoi(response: Response, macDinh: string): Promise<string> {
  try {
    const body = await response.json() as { loi?: unknown };
    return typeof body.loi === "string" ? body.loi : macDinh;
  } catch { return macDinh; }
}

export async function taoFeedLich(): Promise<FeedLich> {
  let response: Response;
  try { response = await fetch("/api/lich/tao", { method: "POST" }); }
  catch { throw new Error("Không kết nối được dịch vụ lịch. Em kiểm tra mạng rồi thử lại nhé."); }
  if (!response.ok) throw new Error(await docLoi(response, "Chưa tạo được lịch cập nhật."));
  const body = await response.json() as { feedUrl?: unknown; writeKey?: unknown };
  if (typeof body.feedUrl !== "string" || typeof body.writeKey !== "string") throw new Error("Dịch vụ lịch trả về dữ liệu chưa đúng.");
  return { feedUrl: body.feedUrl, writeKey: body.writeKey };
}

export async function capNhatFeedLich(feed: FeedLich, suKien: SuKienLich[]): Promise<void> {
  let response: Response;
  try {
    response = await fetch("/api/lich/cap-nhat", {
      method: "PUT",
      headers: { authorization: `Bearer ${feed.writeKey}`, "content-type": "application/json" },
      body: JSON.stringify({ suKien }),
    });
  } catch { throw new Error("Chưa gửi được lịch do mất kết nối. Em thử lại khi có mạng nhé."); }
  if (!response.ok) throw new Error(await docLoi(response, "Chưa cập nhật được lịch."));
}

export async function thuHoiFeedLich(feed: FeedLich): Promise<void> {
  let response: Response;
  try { response = await fetch("/api/lich/thu-hoi", { method: "DELETE", headers: { authorization: `Bearer ${feed.writeKey}` } }); }
  catch { throw new Error("Chưa thu hồi được lịch do mất kết nối. Em thử lại nhé."); }
  if (!response.ok) throw new Error(await docLoi(response, "Chưa thu hồi được lịch."));
}

// Lời gọi JSON dùng chung cho các màn mới: lỗi nào cũng đổi thành LoiApi có câu tiếng Việt, kể cả khi phiên hết hạn (máy chủ trả HTML).
// Lỗi từng ô (`chiTiet` dạng mảng { truong, thongBao }) được giữ lại ở LoiApi.chiTiet.
import { LoiApi, thongBaoTheoMa } from "./api";

export type Phuong = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export type TruyVan = Record<string, string | number | undefined>;

export async function goiJson<T>(phuong: Phuong, duong: string, query: TruyVan = {}, body?: unknown): Promise<T> {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) if (v !== undefined && v !== "") p.set(k, String(v));
  const q = p.toString();
  let res: Response;
  try {
    res = await fetch(`/api${duong}${q ? `?${q}` : ""}`, {
      method: phuong,
      headers: { Accept: "application/json", ...(body !== undefined && { "Content-Type": "application/json" }) },
      credentials: "same-origin",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new LoiApi(0, "Không kết nối được máy chủ. Bạn kiểm tra mạng rồi thử lại.");
  }
  if (res.status === 204) return undefined as T;
  if (!(res.headers.get("content-type") ?? "").includes("json")) {
    throw new LoiApi(res.status === 200 ? 401 : res.status, "Phiên đăng nhập có thể đã hết hạn. Bạn tải lại trang để đăng nhập lại.");
  }
  const json = (await res.json().catch(() => null)) as { loi?: unknown; thongBao?: unknown; chiTiet?: unknown } | null;
  if (!res.ok) {
    const msg = typeof json?.thongBao === "string" ? json.thongBao : typeof json?.loi === "string" ? json.loi : thongBaoTheoMa(res.status);
    const ct: Record<string, string> = {};
    if (Array.isArray(json?.chiTiet)) for (const x of json.chiTiet as { truong?: unknown; thongBao?: unknown }[]) if (typeof x?.truong === "string" && typeof x.thongBao === "string") ct[x.truong] = x.thongBao;
    throw new LoiApi(res.status, msg, Object.keys(ct).length ? ct : undefined);
  }
  return json as T;
}

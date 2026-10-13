// Nhúng văn bản bằng bge-m3 (đa ngữ, giữ nguyên tiếng Việt, 1024 chiều). Lỗi hoặc thiếu binding -> null, không bao giờ ném.
import { MO_HINH, type KhoAI } from "./kieu";

export const SO_CHIEU = 1024;
const LO_TOI_DA = 32;

/** Rút mảng vector từ các hình dạng trả về có thể gặp: {data:[[..]]}, {embeddings:[[..]]} hoặc mảng thẳng. */
function rutVector(r: unknown): number[][] | null {
  const o = r as { data?: unknown; embeddings?: unknown } | null;
  const m = Array.isArray(r) ? r : Array.isArray(o?.data) ? o!.data : Array.isArray(o?.embeddings) ? o!.embeddings : null;
  return m && m.every((v) => Array.isArray(v)) ? (m as number[][]) : null;
}

export async function nhungVanBan(ai: KhoAI | undefined, ds: string[]): Promise<number[][] | null> {
  if (!ai) return null;
  const ra: number[][] = [];
  try {
    for (let i = 0; i < ds.length; i += LO_TOI_DA) {
      const lo = ds.slice(i, i + LO_TOI_DA);
      const v = rutVector(await ai.run(MO_HINH.nhung, { text: lo }));
      if (!v || v.length !== lo.length || v.some((x) => x.length !== SO_CHIEU)) return null;
      ra.push(...v);
    }
  } catch {
    return null;
  }
  return ra;
}

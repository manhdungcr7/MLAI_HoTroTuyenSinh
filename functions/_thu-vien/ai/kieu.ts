// Kiểu dùng chung cho lớp AI (app học sinh và CMS). Chỉ khai báo phần mình dùng của binding Cloudflare, không kéo @cloudflare/workers-types.

export interface KhoAI {
  run(model: string, input: unknown): Promise<unknown>;
}

export interface VectorMeta { maTruong: string; tinh: string; loai: string; phienBan: string; chinhThuc: boolean; [k: string]: string | boolean | number }
export interface VectorGhi { id: string; values: number[]; metadata: VectorMeta }
export interface VectorKetQua { id: string; score: number; metadata?: VectorMeta }
export interface KhoVector {
  upsert(v: VectorGhi[]): Promise<unknown>;
  deleteByIds(ids: string[]): Promise<unknown>;
  query(vec: number[], opt: { topK: number; filter?: Record<string, unknown>; returnMetadata?: "all" | "indexed" | "none" }): Promise<{ matches: VectorKetQua[] }>;
}

export interface KhoKVAI {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, opt?: { expirationTtl?: number }): Promise<void>;
}

/** Binding AI dùng chung: thiếu cái nào thì bậc tương ứng tự bỏ qua, không bao giờ làm vỡ tư vấn. */
export interface EnvAI { AI?: KhoAI; VECTORIZE?: KhoVector; CACHE_KV?: KhoKVAI }

export const MO_HINH = {
  quyetDinh: "@cf/cloudflare/clef-omni",
  nhung: "@cf/baai/bge-m3",
} as const;

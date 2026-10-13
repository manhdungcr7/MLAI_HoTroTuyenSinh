// Kiểu tối thiểu cho Cloudflare D1/KV (repo không dùng @cloudflare/workers-types). Đối tượng thật của Cloudflare khớp cấu trúc này.
import type { KhoAI, KhoVector, KhoKVAI } from "../../../functions/_thu-vien/ai/kieu";

export interface KhoD1Cau {
  bind(...giaTri: unknown[]): KhoD1Cau;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  run(): Promise<{ meta?: { changes?: number } }>;
}
export interface KhoD1 {
  prepare(sql: string): KhoD1Cau;
  /** Chạy nhiều câu lệnh trong một giao dịch. */
  batch(cau: KhoD1Cau[]): Promise<{ meta?: { changes?: number } }[]>;
}
export interface KhoKV {
  get(khoa: string): Promise<string | null>;
  put(khoa: string, giaTri: string, tuyChon?: { expirationTtl?: number }): Promise<void>;
}

export interface Env {
  DB?: KhoD1;
  KV_CONG_DONG?: KhoKV;
  AI?: KhoAI;
  VECTORIZE?: KhoVector;
  CACHE_KV?: KhoKVAI;
  RATE_KV?: KhoKV;
  /** Secret ký cookie phiên (wrangler pages secret put SESSION_SECRET). Thiếu thì mọi API trả 500 chua-cau-hinh. */
  SESSION_SECRET?: string;
  /** Chỉ '1' VÀ chạy ở localhost/127.0.0.1 mới giả danh người dùng (đọc email từ header X-Gia-Danh). */
  GIA_DANH_DEV?: string;
  /** Secret Telegram (wrangler secret put). Thiếu thì bỏ qua thông báo, không lỗi. */
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
}

export interface BoiCanh {
  request: Request;
  env: Env;
  params?: Record<string, string | string[] | undefined>;
}

/** Phần tiêm được để test: fetch (JWKS), đồng hồ, tạo mã. */
export interface TuyChon {
  fetch?: typeof fetch;
  bayGio?: Date;
  taoId?: () => string;
}

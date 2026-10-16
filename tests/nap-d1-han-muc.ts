// Kho D1 giả bằng SQLite thật (node:sqlite) cho hạn mức lượt AI: chỉ nạp migration 0008. Dùng chung cho các test gọi /api/tu-van.
// Không phải test độc lập (không có *.test.ts): các test import tệp này.
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { CauD1, KhoD1HanMuc } from "../functions/_thu-vien/han-muc-ai";

export class CauTest implements CauD1 {
  gt: unknown[] = [];
  constructor(private readonly db: DatabaseSync, readonly sql: string) {}
  bind(...g: unknown[]): CauTest { this.gt = g; return this; }
  async first<T = Record<string, unknown>>(): Promise<T | null> {
    return ((this.db.prepare(this.sql).get(...(this.gt as never[])) as T | undefined) ?? null);
  }
  async run(): Promise<{ meta: { changes: number } }> {
    const r = this.db.prepare(this.sql).run(...(this.gt as never[]));
    return { meta: { changes: Number(r.changes) } };
  }
}

export interface D1Test extends KhoD1HanMuc { readonly db: DatabaseSync }

/** Một cơ sở dữ liệu trong bộ nhớ, mỗi lần gọi là một bản mới. batch chạy trong một giao dịch, giống D1. */
export function taoD1Test(): D1Test {
  const db = new DatabaseSync(":memory:");
  db.exec(fs.readFileSync(path.join("migrations", "0008_ai_han_muc.sql"), "utf8"));
  return {
    db,
    prepare: (sql: string) => new CauTest(db, sql),
    async batch(cau: CauD1[]) {
      db.exec("BEGIN");
      try {
        const ra = (cau as CauTest[]).map((c) => ({ meta: { changes: Number(db.prepare(c.sql).run(...(c.gt as never[])).changes) } }));
        db.exec("COMMIT");
        return ra;
      } catch (e) { db.exec("ROLLBACK"); throw e; }
    },
  };
}

/** KV giả (get/put) dùng cho RATE_KV, CACHE_KV. */
export function kvTest(): { m: Map<string, string>; kv: { get: (k: string) => Promise<string | null>; put: (k: string, v: string) => Promise<void> } } {
  const m = new Map<string, string>();
  return { m, kv: { get: async (k: string) => m.get(k) ?? null, put: async (k: string, v: string) => { m.set(k, v); } } };
}

/** Thêm mã hồ sơ và mã yêu cầu hợp lệ (UUID v4) cho một thân yêu cầu; mỗi lần gọi là một hồ sơ mới trừ khi truyền `hoSoId`. */
export function themDinhDanh(o: object, hoSoId: string = crypto.randomUUID()): object {
  return { hoSoId, requestId: crypto.randomUUID(), ...o };
}

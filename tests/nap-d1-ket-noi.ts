// Kho D1 giả bằng SQLite thật (node:sqlite) cho kết nối Claude/ChatGPT và OAuth: nạp migration 0009 và 0011. Batch chạy trong một giao dịch, giống D1.
// Không phải test độc lập (không có *.test.ts): các test import tệp này.
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { CauD1Ket, KhoD1Ket } from "../functions/_thu-vien/ket-noi";

export class CauKetNoiTest implements CauD1Ket {
  gt: unknown[] = [];
  constructor(private readonly db: DatabaseSync, readonly sql: string) {}
  bind(...g: unknown[]): CauKetNoiTest { this.gt = g; return this; }
  async first<T = Record<string, unknown>>(): Promise<T | null> {
    return ((this.db.prepare(this.sql).get(...(this.gt as never[])) as T | undefined) ?? null);
  }
  async all<T = Record<string, unknown>>(): Promise<{ results: T[] }> {
    return { results: this.db.prepare(this.sql).all(...(this.gt as never[])) as T[] };
  }
  async run(): Promise<{ meta: { changes: number } }> {
    const r = this.db.prepare(this.sql).run(...(this.gt as never[]));
    return { meta: { changes: Number(r.changes) } };
  }
}

export interface D1KetNoiTest extends KhoD1Ket { readonly db: DatabaseSync }

/** Một cơ sở dữ liệu trong bộ nhớ, mỗi lần gọi là một bản mới, có bảng của migration 0009 và 0011. */
export function taoD1KetNoiTest(): D1KetNoiTest {
  const db = new DatabaseSync(":memory:");
  for (const f of ["0009_ket_noi_claude.sql", "0011_oauth_mcp.sql"]) db.exec(fs.readFileSync(path.join("migrations", f), "utf8"));
  return {
    db,
    prepare: (sql: string) => new CauKetNoiTest(db, sql),
    async batch(cau: unknown[]) {
      db.exec("BEGIN");
      try {
        const ra = (cau as CauKetNoiTest[]).map((c) => ({ meta: { changes: Number(db.prepare(c.sql).run(...(c.gt as never[])).changes) } }));
        db.exec("COMMIT");
        return ra;
      } catch (e) { db.exec("ROLLBACK"); throw e; }
    },
  } as D1KetNoiTest;
}

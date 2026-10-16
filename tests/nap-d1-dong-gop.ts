// Môi trường thử cho MCP đóng góp: SQLite thật (node:sqlite) nạp MỌI migration theo thứ tự, D1 và KV giả, và trợ giúp gọi API.
// Không phải test độc lập (không có *.test.ts): tests/mcp-dong-gop.test.ts import tệp này.
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { xuLy as khoaKetNoi } from "../cms/functions/api/khoa-ket-noi";
import { xuLy as mcp } from "../cms/functions/api/mcp-dong-gop";
import type { Env, KhoD1, KhoD1Cau, KhoKV } from "../cms/functions/_thu-vien/kieu";

const laDoc = (sql: string) => /^\s*(select|with)\b/i.test(sql);

class CauTest implements KhoD1Cau {
  gt: unknown[] = [];
  constructor(private readonly db: DatabaseSync, readonly sql: string) {}
  bind(...g: unknown[]): CauTest { this.gt = g; return this; }
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

export interface MoiTruong {
  db: DatabaseSync;
  env: Env;
  /** Bộ nhớ KV giả; `hong = true` làm mọi lần đọc/ghi KV lỗi (kiểm chứng fail-closed). */
  kvMap: Map<string, string>;
  kvHong: { hong: boolean };
}

/** Một cơ sở dữ liệu mới đã nạp đủ migrations. Trả về cả env dùng cho handler. */
export function taoMoiTruong(): MoiTruong {
  const db = new DatabaseSync(":memory:");
  for (const f of fs.readdirSync("migrations").filter((x) => x.endsWith(".sql")).sort()) db.exec(fs.readFileSync(path.join("migrations", f), "utf8"));
  const d1: KhoD1 = {
    prepare: (sql) => new CauTest(db, sql),
    async batch(cau) {
      db.exec("BEGIN");
      try {
        const ra = cau.map((c) => {
          const x = c as CauTest;
          return laDoc(x.sql)
            ? { results: db.prepare(x.sql).all(...(x.gt as never[])) }
            : { meta: { changes: Number(db.prepare(x.sql).run(...(x.gt as never[])).changes) } };
        });
        db.exec("COMMIT");
        return ra as never;
      } catch (e) { db.exec("ROLLBACK"); throw e; }
    },
  };
  const kvMap = new Map<string, string>();
  const kvHong = { hong: false };
  const kv: KhoKV = {
    get: async (k) => { if (kvHong.hong) throw new Error("KV hỏng (thử nghiệm)"); return kvMap.get(k) ?? null; },
    put: async (k, v) => { if (kvHong.hong) throw new Error("KV hỏng (thử nghiệm)"); kvMap.set(k, v); },
  };
  return { db, env: { DB: d1, KV_CONG_DONG: kv, GIA_DANH_DEV: "1" }, kvMap, kvHong };
}

/** Gọi API khóa (cookie không cần: dùng chế độ giả danh dev trên localhost). */
export async function goiKhoa(m: MoiTruong, method: "GET" | "POST" | "DELETE", email: string | null, o: { body?: unknown; query?: string; bayGio?: Date } = {}) {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (email) headers["x-gia-danh"] = email;
  const r = await khoaKetNoi(
    { request: new Request(`http://localhost/api/khoa-ket-noi${o.query ?? ""}`, { method, headers, body: o.body === undefined ? undefined : JSON.stringify(o.body) }), env: m.env },
    { bayGio: o.bayGio, taoId: () => crypto.randomUUID() },
  );
  const t = await r.text();
  return { status: r.status, json: t ? JSON.parse(t) as Record<string, unknown> : null };
}

export interface KetQuaMcp { status: number; json: Record<string, unknown> | Record<string, unknown>[] | null; text: string }

/** Gọi endpoint MCP. `khoa` null = không gửi header Authorization. */
export async function goiMcp(m: MoiTruong, khoa: string | null, body: unknown, o: { bayGio?: Date; taoId?: () => string; method?: string; rawBody?: string } = {}): Promise<KetQuaMcp> {
  const headers: Record<string, string> = { "content-type": "application/json", accept: "application/json, text/event-stream" };
  if (khoa) headers.authorization = `Bearer ${khoa}`;
  const init: RequestInit = { method: o.method ?? "POST", headers };
  if ((o.method ?? "POST") === "POST") init.body = o.rawBody ?? (body === undefined ? undefined : JSON.stringify(body));
  const r = await mcp({ request: new Request("http://localhost/api/mcp-dong-gop", init), env: m.env }, { bayGio: o.bayGio, taoId: o.taoId });
  const text = await r.text();
  let json: KetQuaMcp["json"] = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = null; }
  return { status: r.status, json, text };
}

/** Gọi một công cụ và trả về {isError, text} (text là JSON gọn hoặc thông báo lỗi). */
export async function goiCongCu(m: MoiTruong, khoa: string | null, ten: string, args: Record<string, unknown>, bayGio?: Date, taoId?: () => string) {
  const r = await goiMcp(m, khoa, { jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: ten, arguments: args } }, { bayGio, taoId });
  const res = (r.json as { result?: { content?: { text: string }[]; isError?: boolean }; error?: unknown } | null)?.result;
  return { status: r.status, isError: Boolean(res?.isError), text: res?.content?.[0]?.text ?? "", raw: r };
}

/** Thêm người vào quan_tri (không đặt mật khẩu: mật khẩu không cần cho các test này). */
export function themQuanTri(m: MoiTruong, email: string, vaiTro: "sa" | "qtv" | "ctv", mkTam = 0) {
  m.db.prepare("INSERT INTO quan_tri (email, vai_tro, tao_luc, phai_doi_mat_khau) VALUES (?, ?, ?, ?)").run(email, vaiTro, "2026-10-01T00:00:00.000Z", mkTam);
}

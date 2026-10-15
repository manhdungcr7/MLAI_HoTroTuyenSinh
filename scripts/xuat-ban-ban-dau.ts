// Tạo BẢN XUẤT BẢN ĐẦU TIÊN cho D1 + KV + Vectorize từ dữ liệu gốc CÓ NGUỒN trong repo (không bịa, thiếu nguồn thì bỏ).
//   npx tsx scripts/xuat-ban-ban-dau.ts --local  [--state=<thư mục>]   (D1/KV cục bộ, bỏ qua vector)
//   npx tsx scripts/xuat-ban-ban-dau.ts --remote                       (Cloudflare thật: cần `wrangler login`, CLOUDFLARE_ACCOUNT_ID)
// Cờ: --dry (chỉ dựng và in tóm tắt, không ghi) · --khong-vector · --chi-vector (chỉ nhúng lại, không đụng D1/KV).
//
// Nội dung nạp:
//   - Học phí từng chương trình: src/data/hoc-phi.json (đã đối chiếu với đề án đúng trường; docs/DU-LIEU.md), nguồn = link PDF + số trang.
//   - Thông tin trường: tên, tỉnh, số chương trình, khoảng học phí: suy từ dữ liệu gốc; nguồn = đề án tuyển sinh mới nhất của trường (src/data/de-an-truong.json).
//   KHÔNG nạp: điểm chuẩn (đã nằm trong app), ký túc xá/học bổng/kênh liên lạc/đánh giá (chưa có nguồn thật).
// Cách ghi giống CMS: bản ghi `ban_ghi_cms` PUBLISHED (created_by = he-thong-khoi-tao) -> `taoSnapshotVaManifest` (cùng hàm CMS dùng) -> `snapshot_tap`,
// `snapshot_manifest` (is_active = 1) trong MỘT batch D1 -> KV (`manifest:active` ghi cuối) -> Vectorize (`capNhatChiMuc`, `mucTuTap`).
// Chạy lại an toàn: cùng nội dung thì cùng mã băm, và bản đã có (cùng băm của cả 7 tập) được dùng lại, không nhân đôi; vector có mã cố định nên ghi đè.
// D1 và KV/AI/Vectorize được gọi qua một Worker tạm (`wrangler dev`) dựng ở thư mục tạm, không deploy gì lên production.
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { randomBytes } from "node:crypto";
import type { BanGhiCms, ManifestTuyenSinh } from "../src/engine/du-lieu-tuyen-sinh/kieu";
import { taoSnapshotVaManifest } from "../src/engine/du-lieu-tuyen-sinh/snapshot-builder";
import { mucTuTap, type MucChiMuc } from "../functions/_thu-vien/ai/chi-muc";
import { TINH_CUA_TRUONG } from "../functions/_thu-vien/ai/tinh-lan-can";

const GOC = join(dirname(fileURLToPath(import.meta.url)), "..");
export const NGUOI = "he-thong-khoi-tao";
const NGAY = "2026-10-13";
const LUC = `${NGAY}T00:00:00.000Z`;
const TEN_TAP = ["schools", "tuition", "scholarships", "admissions", "announcements", "cutoffScores", "community"] as const;
const DB_LOCAL_ID = "00000000-0000-0000-0000-000000000000";
const DB_THAT = { ten: "nguyenvongai_db", id: "3c9c7d34-ac41-4a52-89d6-d7566bc8aa31" };
const KV_THAT = "b6281182b7ff42bc8a23deb93ffdef94";

// ---------- 1. Dựng bản ghi từ dữ liệu gốc ----------
interface Dong { id: string; ma: string; truong: string; nganh: string; tinh: string; diem: Record<string, number> }
interface HocPhi { trieuNam: number; nam: string; trang: number; url: string; phamVi?: "nganh" | "truong" }
interface DeAn { docs: { nam: string; url: string }[] }

const doc = <T>(p: string): T => JSON.parse(readFileSync(join(GOC, p), "utf8")) as T;
const dinhDang = (n: number) => String(Math.round(n * 100) / 100).replace(".", ",");

export function dungBanGhi(): { ds: BanGhiCms[]; tomTat: Record<string, number>; canhBao: string[] } {
  const dong = doc<Dong[]>("src/data/du-lieu-that.json");
  const hocPhi = doc<Record<string, HocPhi>>("src/data/hoc-phi.json");
  const deAn = doc<Record<string, DeAn>>("src/data/de-an-truong.json");
  const canhBao: string[] = [];
  const theoId = new Map(dong.map((d) => [d.id, d]));
  const theoTruong = new Map<string, Dong[]>();
  for (const d of dong) theoTruong.set(d.ma, [...(theoTruong.get(d.ma) ?? []), d]);

  const chung = { version: 1, status: "PUBLISHED" as const, importance: "normal" as const, createdBy: NGUOI, createdAt: LUC, updatedBy: NGUOI, updatedAt: LUC, publishedBy: NGUOI, publishedAt: LUC };
  const ds: BanGhiCms[] = [];
  const hpTheoTruong = new Map<string, number[]>();

  // Học phí: mỗi chương trình có học phí đã đối chiếu, link nguồn là PDF đề án + số trang.
  for (const [id, hp] of Object.entries(hocPhi)) {
    if (hp.phamVi === "truong") continue; // học phí cấp trường gán chung: không nạp như học phí ngành
    const d = theoId.get(id);
    if (!d) { canhBao.push(`học phí mồ côi, bỏ: ${id}`); continue; }
    if (!(hp.trieuNam >= 5 && hp.trieuNam <= 400) || !/^https?:\/\/\S+$/.test(hp.url) || !hp.nam) { canhBao.push(`học phí không hợp lệ hoặc thiếu nguồn, bỏ: ${id}`); continue; }
    hpTheoTruong.set(d.ma, [...(hpTheoTruong.get(d.ma) ?? []), hp.trieuNam]);
    ds.push({
      ...chung, id: `khoi-tao:tuition:${id}:v1`, entityType: "tuition", entityId: id,
      data: { nam: Number(hp.nam), mucThap: hp.trieuNam, mucCao: hp.trieuNam, donVi: "trieu_nam", phamVi: `Ngành ${d.nganh} tại ${d.truong}` },
      source: { url: hp.url, tieuDe: `Đề án tuyển sinh ${hp.nam} của ${d.truong}, bảng học phí (trang ${hp.trang})`, donViCongBo: d.truong, ngayKiemChung: NGAY, ghiChu: "Nạp ban đầu từ học phí đã đối chiếu với đề án (src/data/hoc-phi.json). PDF lưu trên trang tổng hợp tuyensinh247." },
      changeNote: "Nạp ban đầu: học phí theo năm trích từ đề án tuyển sinh của trường",
    });
  }

  // Thông tin trường: chỉ trường có đề án (nguồn thật). Mọi con số suy từ chính dữ liệu gốc.
  for (const [ma, cts] of theoTruong) {
    const da = deAn[ma]?.docs ?? [];
    if (!da.length) { canhBao.push(`trường ${ma} chưa có đề án để làm nguồn, bỏ`); continue; }
    const moi = [...da].sort((a, b) => b.nam.localeCompare(a.nam))[0];
    const tinh = cts[0].tinh;
    if (TINH_CUA_TRUONG[ma] !== tinh) canhBao.push(`tỉnh của ${ma} lệch bảng tra: dữ liệu "${tinh}" / bảng "${TINH_CUA_TRUONG[ma] ?? "không có"}"`);
    const nam = [...new Set(cts.flatMap((c) => Object.keys(c.diem)))].sort();
    const hp = hpTheoTruong.get(ma);
    const ghiChu = [
      `Tỉnh/thành: ${tinh}.`,
      `Ứng dụng có ${cts.length} chương trình của trường${nam.length ? `, điểm chuẩn các năm ${nam[0]}${nam.length > 1 ? ` đến ${nam[nam.length - 1]}` : ""}` : ""}.`,
      hp?.length ? `Học phí đã đối chiếu với đề án cho ${hp.length} chương trình: từ ${dinhDang(Math.min(...hp))} đến ${dinhDang(Math.max(...hp))} triệu đồng/năm.` : "",
      `Đề án tuyển sinh đã lưu: ${[...da].map((x) => x.nam).sort().reverse().join(", ")}.`,
    ].filter(Boolean).join(" ");
    ds.push({
      ...chung, id: `khoi-tao:school:${ma}:v1`, entityType: "school", entityId: ma,
      data: { tenTruong: cts[0].truong, ghiChu },
      source: { url: moi.url, tieuDe: `Đề án tuyển sinh ${moi.nam} của ${cts[0].truong}`, donViCongBo: cts[0].truong, ngayKiemChung: NGAY, ghiChu: "Nạp ban đầu từ dữ liệu gốc của ứng dụng. PDF lưu trên trang tổng hợp tuyensinh247." },
      changeNote: "Nạp ban đầu: tóm tắt trường từ dữ liệu gốc",
    });
  }
  const tomTat = { school: ds.filter((b) => b.entityType === "school").length, tuition: ds.filter((b) => b.entityType === "tuition").length };
  return { ds, tomTat, canhBao };
}

/** Cùng thứ tự CMS dùng khi xuất bản (theo entityId rồi entityType) để băm ổn định. */
export const sapXep = (ds: BanGhiCms[]) => [...ds].sort((a, b) => (a.entityId < b.entityId ? -1 : a.entityId > b.entityId ? 1 : a.entityType.localeCompare(b.entityType)));

// ---------- 2. Worker tạm ----------
const WORKER = (tuongDoi: string) => `
import { capNhatChiMuc, truyVanChiMuc } from "${tuongDoi}/functions/_thu-vien/ai/chi-muc";
import { nhungVanBan } from "${tuongDoi}/functions/_thu-vien/ai/nhung";
const json = (v, s = 200) => new Response(JSON.stringify(v), { status: s, headers: { "content-type": "application/json; charset=utf-8" } });
export default {
  async fetch(req, env) {
    if (req.headers.get("x-khoa") !== env.KHOA) return json({ loi: "khoa" }, 403);
    const p = new URL(req.url).pathname;
    if (p === "/ping") return json({ ok: true, ai: !!env.AI, vec: !!env.VECTORIZE });
    const b = await req.json();
    try {
      if (p === "/doc") { // chỉ SELECT
        if (!/^\\s*select\\s/i.test(b.sql)) return json({ loi: "chi-select" }, 400);
        return json((await env.DB.prepare(b.sql).bind(...(b.params ?? [])).all()).results);
      }
      if (p === "/ghi") { const r = await env.DB.batch(b.cau.map((c) => env.DB.prepare(c.sql).bind(...(c.params ?? [])))); return json({ n: r.length }); }
      if (p === "/kv-ghi") { for (const x of b.puts) await env.KV_CONG_DONG.put(x.k, x.v); return json({ n: b.puts.length }); }
      if (p === "/kv-doc") return json({ v: await env.KV_CONG_DONG.get(b.k) });
      if (p === "/vec") return json(await capNhatChiMuc(env, b.muc));
      if (p === "/nhung") return json({ v: await nhungVanBan(env.AI, b.texts) });
      if (p === "/hoi") return json({ r: await truyVanChiMuc(env, b.cauHoi, b.opt ?? {}) });
      if (p === "/vec-do") { const v = await nhungVanBan(env.AI, [b.cauHoi]); const r = await env.VECTORIZE.query(v[0], { topK: b.k ?? 5, returnMetadata: "all" }); return json(r); }
    } catch (e) { return json({ loi: String(e && e.message || e) }, 500); }
    return json({ loi: "khong-co" }, 404);
  },
};`;

const wranglerBin = join(GOC, "node_modules", ".bin", process.platform === "win32" ? "wrangler.cmd" : "wrangler");
const q = (s: string) => `"${s}"`;

export interface MoWorker { goi: <T>(duong: string, body: unknown) => Promise<T>; dong: () => void; thuMuc: string; coAI: boolean }

export async function moWorker(che: "local" | "remote", o: { state?: string; cong?: number } = {}): Promise<MoWorker> {
  const thuMuc = join(process.env.CLAUDE_JOB_DIR ?? tmpdir(), "tmp", "ap-dung-worker");
  rmSync(thuMuc, { recursive: true, force: true });
  mkdirSync(thuMuc, { recursive: true });
  const tuongDoi = relative(thuMuc, GOC).replace(/\\/g, "/");
  writeFileSync(join(thuMuc, "worker.ts"), WORKER(tuongDoi));
  const state = o.state ?? join(thuMuc, "state");
  const cfg: Record<string, unknown> = {
    name: "nvai-khoi-tao-tam", main: "worker.ts", compatibility_date: "2026-07-01",
    d1_databases: [{ binding: "DB", database_name: che === "remote" ? DB_THAT.ten : "DB", database_id: che === "remote" ? DB_THAT.id : DB_LOCAL_ID, migrations_dir: join(GOC, "migrations").replace(/\\/g, "/") }],
    kv_namespaces: [{ binding: "KV_CONG_DONG", id: che === "remote" ? KV_THAT : "KV_CONG_DONG" }],
    ...(che === "remote" ? { ai: { binding: "AI" }, vectorize: [{ binding: "VECTORIZE", index_name: "nvai-kb" }] } : {}),
  };
  writeFileSync(join(thuMuc, "wrangler.jsonc"), JSON.stringify(cfg, null, 2));
  if (che === "local") {
    const r = spawnSync(`${q(wranglerBin)} d1 migrations apply DB --local --persist-to ${q(state)}`, { cwd: thuMuc, shell: true, encoding: "utf8" });
    if (r.status !== 0) throw new Error(`Không áp được migrations cục bộ:\n${r.stdout}\n${r.stderr}`);
  }
  const khoa = randomBytes(12).toString("hex");
  const cong = o.cong ?? 8799;
  const args = ["dev", "--port", String(cong), "--ip", "127.0.0.1", "--var", `KHOA:${khoa}`, ...(che === "remote" ? ["--remote"] : ["--local", "--persist-to", state])];
  const con: ChildProcess = spawn(`${q(wranglerBin)} ${args.join(" ")}`, { cwd: thuMuc, shell: true, stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID ?? "5fdd1d1433519df6429d7418d43fff9a", WRANGLER_SEND_METRICS: "false" } });
  let nhatKy = "";
  con.stdout?.on("data", (b) => { nhatKy += String(b); });
  con.stderr?.on("data", (b) => { nhatKy += String(b); });
  const dong = () => { if (con.pid) spawnSync(`taskkill /pid ${con.pid} /T /F`, { shell: true, stdio: "ignore" }); };
  const goi = async <T,>(duong: string, body: unknown): Promise<T> => {
    const r = await fetch(`http://127.0.0.1:${cong}${duong}`, { method: "POST", headers: { "x-khoa": khoa, "content-type": "application/json" }, body: JSON.stringify(body) });
    const t = await r.text();
    if (!r.ok) throw new Error(`${duong} -> HTTP ${r.status}: ${t.slice(0, 400)}`);
    return JSON.parse(t) as T;
  };
  let ping: { ok: boolean; ai: boolean } | null = null;
  const han = Date.now() + 240_000;
  while (Date.now() < han && !ping) {
    await new Promise((x) => setTimeout(x, 2000));
    try { const r = await fetch(`http://127.0.0.1:${cong}/ping`, { headers: { "x-khoa": khoa } }); if (r.ok) ping = (await r.json()) as { ok: boolean; ai: boolean }; } catch { /* chưa lên */ }
  }
  if (!ping) { dong(); throw new Error(`Worker tạm không khởi động được:\n${nhatKy.slice(-1500)}`); }
  return { goi, dong, thuMuc, coAI: ping.ai };
}

// ---------- 3. Áp dụng ----------
interface HangCu { id: string; entity_type: string; entity_id: string; version: number; status: string; data_json: string; source_url: string; source_title: string; created_by: string }
interface HangMf { data_version: string; manifest_json: string; published_by: string; is_active: number }

const lo = <T,>(a: T[], n: number) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));

async function chay(argv: string[]) {
  const co = (c: string) => argv.includes(c);
  const local = co("--local"), remote = co("--remote");
  if (local === remote) { console.error("Chọn đúng một trong --local hoặc --remote"); process.exit(2); }
  const che = local ? "local" : "remote";
  const dry = co("--dry");
  const state = argv.find((a) => a.startsWith("--state="))?.slice(8);

  const { ds, tomTat, canhBao } = dungBanGhi();
  const dsXb = sapXep(ds);
  const kq = await taoSnapshotVaManifest(dsXb, "0000.00.00.00"); // chỉ để tính băm sơ bộ; phiên bản thật gán sau
  const bam = TEN_TAP.map((t) => kq.datasets[t].meta.hash.slice(0, 8)).join(" ");
  console.log(`Bản ghi: ${tomTat.school} trường + ${tomTat.tuition} học phí = ${ds.length}. Băm (khi phiên bản cố định): ${bam}`);
  for (const c of canhBao.slice(0, 15)) console.log(`  lưu ý: ${c}`);
  if (canhBao.length > 15) console.log(`  ... và ${canhBao.length - 15} lưu ý khác`);
  if (dry) { console.log("Chạy khô (--dry): không ghi gì."); return; }

  const w = await moWorker(che, { state });
  try {
    console.log(`Worker tạm sẵn sàng (${che}, AI ${w.coAI ? "có" : "không"}).`);
    const doc2 = <T,>(sql: string, params: unknown[] = []) => w.goi<T[]>("/doc", { sql, params });
    const chiVector = co("--chi-vector");

    // Phiên bản: dùng lại bản đã có nếu cả 7 tập trùng băm, nếu không thì NN kế tiếp của ngày.
    let phienBan = "", manifestJson = "", taiDung = false;
    const mf = await doc2<HangMf>("SELECT data_version, manifest_json, published_by, is_active FROM snapshot_manifest");
    const cu = await doc2<HangCu>("SELECT id, entity_type, entity_id, version, status, data_json, source_url, source_title, created_by FROM ban_ghi_cms");
    // An toàn: chỉ làm việc trên dữ liệu do chính script này tạo. Có dữ liệu của CMS thì dừng.
    const la = cu.filter((h) => h.created_by !== NGUOI).length + mf.filter((m) => m.published_by !== NGUOI).length;
    if (la > 0) throw new Error(`D1 đã có dữ liệu không phải của ${NGUOI} (${la} dòng). DỪNG để không đè nội dung CMS.`);
    const kvHienTai = (await w.goi<{ v: string | null }>("/kv-doc", { k: "manifest:active" })).v;
    if (kvHienTai && !mf.some((m) => m.manifest_json === kvHienTai)) throw new Error("KV có manifest:active không khớp bản nào trong D1. DỪNG để kiểm tra tay.");

    // Băm tính trên nội dung tệp (không chứa phiên bản), nên so được giữa các lần chạy.
    for (const m of mf) {
      const mm = JSON.parse(m.manifest_json) as ManifestTuyenSinh;
      if (TEN_TAP.every((t) => (mm.datasets as Record<string, { hash: string }>)[t]?.hash === kq.datasets[t].meta.hash)) { phienBan = m.data_version; manifestJson = m.manifest_json; taiDung = true; break; }
    }
    if (!taiDung) {
      const ngay = new Date().toISOString().slice(0, 10).replace(/-/g, ".");
      const stt = mf.map((m) => m.data_version).filter((v) => v.startsWith(`${ngay}.`)).map((v) => Number(v.split(".")[3])).reduce((a, b) => Math.max(a, b), 0) + 1;
      phienBan = `${ngay}.${String(stt).padStart(2, "0")}`;
    }
    const ket = await taoSnapshotVaManifest(dsXb, phienBan);
    if (taiDung) {
      // Nội dung tệp không phụ thuộc phiên bản nên băm trùng; manifest cũ giữ nguyên (generatedAt cũ) để KV và D1 luôn đồng nhất.
    } else manifestJson = JSON.stringify(ket.manifest);
    console.log(taiDung ? `Nội dung không đổi: dùng lại phiên bản ${phienBan}.` : `Phiên bản mới: ${phienBan}.`);

    if (!chiVector) {
      // 3a. Bản ghi (idempotent). Bản cũ khác nội dung -> SUPERSEDED rồi thêm version kế tiếp; bản không còn muốn giữ -> SUPERSEDED.
      const cau: { sql: string; params: unknown[] }[] = [];
      const muon = new Set(ds.map((b) => `${b.entityType}\u0000${b.entityId}`));
      for (const h of cu) if (h.status === "PUBLISHED" && !muon.has(`${h.entity_type}\u0000${h.entity_id}`)) cau.push({ sql: "UPDATE ban_ghi_cms SET status = 'SUPERSEDED', updated_by = ?, updated_at = ? WHERE id = ? AND status = 'PUBLISHED'", params: [NGUOI, LUC, h.id] });
      let moi = 0, doi = 0, giu = 0;
      for (const b of ds) {
        const cua = cu.filter((h) => h.entity_type === b.entityType && h.entity_id === b.entityId);
        const dangXb = cua.find((h) => h.status === "PUBLISHED");
        const dataJson = JSON.stringify(b.data);
        if (dangXb && dangXb.data_json === dataJson && dangXb.source_url === b.source.url && dangXb.source_title === b.source.tieuDe) { giu++; continue; }
        const version = cua.reduce((a, h) => Math.max(a, h.version), 0) + 1;
        if (dangXb) { cau.push({ sql: "UPDATE ban_ghi_cms SET status = 'SUPERSEDED', updated_by = ?, updated_at = ? WHERE id = ? AND status = 'PUBLISHED'", params: [NGUOI, LUC, dangXb.id] }); doi++; } else moi++;
        cau.push({
          sql: `INSERT OR IGNORE INTO ban_ghi_cms (id, entity_type, entity_id, version, status, data_json, source_url, source_title, source_publisher, source_published_at, source_verified_at, importance, change_note, previous_version_id, created_by, created_at, updated_by, updated_at, published_by, published_at)
                VALUES (?, ?, ?, ?, 'PUBLISHED', ?, ?, ?, ?, NULL, ?, 'normal', ?, ?, ?, ?, ?, ?, ?, ?)`,
          params: [`khoi-tao:${b.entityType}:${b.entityId}:v${version}`, b.entityType, b.entityId, version, dataJson, b.source.url, b.source.tieuDe, b.source.donViCongBo, NGAY, b.changeNote, dangXb?.id ?? null, NGUOI, LUC, NGUOI, LUC, NGUOI, LUC],
        });
      }
      console.log(`Bản ghi: ${moi} mới, ${doi} thay bản cũ, ${giu} giữ nguyên.`);
      for (const nhom of lo(cau, 40)) await w.goi("/ghi", { cau: nhom });

      // 3b. MỘT batch: tắt bản đang chạy, thêm manifest (nếu chưa có), nhật ký, bật bản này, thêm 7 tập.
      const cuoi: { sql: string; params: unknown[] }[] = [
        { sql: "UPDATE snapshot_manifest SET is_active = 0 WHERE data_version <> ?", params: [phienBan] },
        { sql: "INSERT OR IGNORE INTO snapshot_manifest (data_version, schema_version, manifest_json, is_active, published_by, published_at, total_records, change_summary) VALUES (?, 1, ?, 1, ?, ?, ?, ?)", params: [phienBan, manifestJson, NGUOI, new Date().toISOString(), dsXb.length, `Nạp ban đầu: ${tomTat.school} trường, ${tomTat.tuition} học phí`] },
        { sql: "INSERT INTO nhat_ky_kiem_toan (actor_id, actor_email, action, entity_type, entity_id, version, note, timestamp) SELECT ?, ?, 'PUBLISH', 'snapshot', ?, 0, ?, ? WHERE changes() > 0", params: [NGUOI, NGUOI, phienBan, `Xuất bản ban đầu ${phienBan}: ${dsXb.length} bản ghi (scripts/xuat-ban-ban-dau.ts)`, new Date().toISOString()] },
        { sql: "UPDATE snapshot_manifest SET is_active = 1 WHERE data_version = ?", params: [phienBan] },
        ...TEN_TAP.map((t) => ({ sql: "INSERT OR IGNORE INTO snapshot_tap (data_version, ten, duong_dan, hash_sha256, kich_thuoc, so_ban_ghi, noi_dung) VALUES (?, ?, ?, ?, ?, ?, ?)", params: [phienBan, t, ket.datasets[t].meta.url, ket.datasets[t].meta.hash, ket.datasets[t].meta.size, ket.datasets[t].meta.recordCount, ket.datasets[t].json] })),
      ];
      await w.goi("/ghi", { cau: cuoi });
      const kiem = await doc2<{ n: number; a: number }>("SELECT (SELECT COUNT(*) FROM snapshot_tap WHERE data_version = ?) AS n, (SELECT COUNT(*) FROM snapshot_manifest WHERE is_active = 1) AS a", [phienBan]);
      if (kiem[0].n !== 7 || kiem[0].a !== 1) throw new Error(`Sau khi ghi D1: ${kiem[0].n} tập, ${kiem[0].a} manifest đang chạy (kỳ vọng 7 và 1)`);

      // 3c. KV: đọc lại từ D1 (nguồn sự thật) rồi ghi; manifest:active ghi cuối cùng.
      const tapD1 = await doc2<{ ten: string; noi_dung: string }>("SELECT ten, noi_dung FROM snapshot_tap WHERE data_version = ?", [phienBan]);
      const mfD1 = (await doc2<{ manifest_json: string }>("SELECT manifest_json FROM snapshot_manifest WHERE data_version = ?", [phienBan]))[0].manifest_json;
      await w.goi("/kv-ghi", { puts: [...tapD1.map((t) => ({ k: `snapshot:${phienBan}:${t.ten}`, v: t.noi_dung })), { k: `snapshot:${phienBan}:manifest`, v: mfD1 }] });
      await w.goi("/kv-ghi", { puts: [{ k: "manifest:active", v: mfD1 }] });
      console.log(`D1 + KV xong: phiên bản ${phienBan}, ${tapD1.length} tập.`);
    }

    // 4. Vector
    if (co("--khong-vector")) return;
    if (!w.coAI) { console.log("Không có binding AI/Vectorize ở chế độ này: bỏ qua vector."); return; }
    const tapD1 = await doc2<{ ten: string; noi_dung: string }>("SELECT ten, noi_dung FROM snapshot_tap WHERE data_version = ?", [phienBan]);
    const muc: MucChiMuc[] = tapD1.flatMap((t) => mucTuTap(t.ten, t.noi_dung, phienBan));
    console.log(`Vector: ${muc.length} mục. Ước lượng ~${Math.round(muc.length * 130)} token vào, khoảng ${Math.ceil((muc.length * 130 / 1e6) * 1075)} neuron (bge-m3 ~1.075 neuron/triệu token; hạn mức 10.000 neuron/ngày).`);
    let xong = 0;
    for (const nhom of lo(muc, 25)) {
      const r = await w.goi<{ daLam: boolean; soBanGhi: number; loi?: string }>("/vec", { muc: nhom });
      if (!r.daLam) throw new Error(`Nhúng lỗi sau ${xong} mục: ${r.loi ?? "không rõ"}. Chạy lại với --chi-vector (an toàn, ghi đè theo mã).`);
      xong += r.soBanGhi;
    }
    console.log(`Vector xong: ${xong} mục đã upsert (lập chỉ mục bất đồng bộ, có thể trễ vài phút).`);
  } finally {
    w.dong();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  chay(process.argv.slice(2)).then(() => process.exit(0), (e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
}

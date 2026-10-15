// Nạp dữ liệu THẬT (có nguồn) vào hàng chờ CMS: sinh một tệp SQL idempotent, không bịa số liệu.
//   - school: mã + tên trường lấy từ src/data/du-lieu-that.json, nguồn là link đề án/trang tuyển sinh thật đầu tiên của trường đó.
//   - tuition: 24 mức học phí trích từ đề án (src/data/hoc-phi.json) kèm link PDF và số trang.
// Các bản ghi vào ở trạng thái APPROVED (đã trích từ nguồn, chờ quản trị viên bấm xuất bản), người tạo là hệ thống.
// Chạy:  npx tsx scripts/khoi-tao-d1-that.ts            (ghi .wrangler/seed-d1.sql)
// Nạp:   npx wrangler d1 execute nguyenvongai_db --local  --file=.wrangler/seed-d1.sql   (hoặc --remote)
// Sau đó quản trị viên gọi POST /api/xuat-ban-snapshot để dựng snapshot qua đúng quy trình.
import fs from "node:fs";
import path from "node:path";
import rawData from "../src/data/du-lieu-that.json";
import rawHocPhi from "../src/data/hoc-phi.json";
import tapTruong from "../cms/functions/_thu-vien/tap-truong.json";

const NGUOI_TAO = "he-thong@nguyenvongai.vn";
const BAY_GIO = new Date().toISOString();
const sq = (v: string | number | null) => (v === null ? "NULL" : typeof v === "number" ? String(v) : `'${v.replace(/'/g, "''")}'`);
const tenMien = (u: string) => new URL(u).hostname.replace(/^www\./, "");

interface Dong { id: string; loai: "school" | "tuition"; eid: string; data: unknown; url: string; tieuDe: string; donVi: string; ghiChu: string; quanTrong: "normal" | "important" }

const truongHopLe = tapTruong as Record<string, string>;
const chuongTrinh = rawData as { id: string; ma: string; truong: string; nganh: string; nguon?: string }[];
const dong: Dong[] = [];

// 1. Trường: mỗi mã trường trong tập trường của CMS, nguồn = link thật đầu tiên có trong dữ liệu
const nguonTruong = new Map<string, string>();
for (const c of chuongTrinh) if (c.nguon && c.nguon.startsWith("http") && !nguonTruong.has(c.ma)) nguonTruong.set(c.ma, c.nguon);
for (const [ma, ten] of Object.entries(truongHopLe)) {
  const url = nguonTruong.get(ma);
  if (!url) continue; // không có nguồn thật thì không nạp
  dong.push({ id: `seed-school-${ma}`, loai: "school", eid: ma, data: { maTruong: ma, tenTruong: ten, capNhatLuc: BAY_GIO }, url, tieuDe: `Tài liệu tuyển sinh của ${ten}`, donVi: tenMien(url), ghiChu: "Nạp từ dữ liệu tuyển sinh đã thu thập (tên trường, mã trường)", quanTrong: "normal" });
}

// 2. Học phí: đúng số trong đề án, mucCao = mucThap (không suy diễn khoảng)
const chuongTrinhTheoId = new Map(chuongTrinh.map((c) => [c.id, c]));
const hocPhi = rawHocPhi as Record<string, { trieuNam: number; nam: string; trang: number; url: string }>;
for (const [key, hp] of Object.entries(hocPhi)) {
  const ct = chuongTrinhTheoId.get(key);
  const ma = key.split("-")[0].toUpperCase();
  if (!hp.url.startsWith("http") || !truongHopLe[ma]) continue;
  const nguon = { url: hp.url, tieuDe: `Đề án tuyển sinh, trang ${hp.trang}: học phí năm học ${hp.nam}`, donViCongBo: tenMien(hp.url), ngayKiemChung: BAY_GIO };
  dong.push({
    id: `seed-tuition-${key}`, loai: "tuition", eid: key,
    data: { id: key, maTruong: ma, maNganh: key, ...(ct && { tenNganh: ct.nganh }), nam: Number(hp.nam), mucThap: hp.trieuNam, mucCao: hp.trieuNam, donVi: "trieu_nam", nguon, capNhatLuc: BAY_GIO },
    url: hp.url, tieuDe: nguon.tieuDe, donVi: nguon.donViCongBo, ghiChu: `Học phí ${hp.trieuNam} triệu đồng/năm trích từ đề án (trang ${hp.trang})`, quanTrong: "important",
  });
}

const sql: string[] = ["-- Sinh bởi scripts/khoi-tao-d1-that.ts. Chạy lại an toàn (INSERT OR IGNORE)."];
for (const d of dong) {
  sql.push(
    `INSERT OR IGNORE INTO ban_ghi_cms (id, entity_type, entity_id, version, status, data_json, source_url, source_title, source_publisher, source_published_at, source_verified_at, importance, change_note, previous_version_id, created_by, created_at, updated_by, updated_at, submitted_by, submitted_at, reviewed_by, reviewed_at) VALUES (` +
      [sq(d.id), sq(d.loai), sq(d.eid), 1, sq("APPROVED"), sq(JSON.stringify(d.data)), sq(d.url), sq(d.tieuDe), sq(d.donVi), "NULL", sq(BAY_GIO), sq(d.quanTrong), sq(d.ghiChu), "NULL", sq(NGUOI_TAO), sq(BAY_GIO), sq(NGUOI_TAO), sq(BAY_GIO), sq(NGUOI_TAO), sq(BAY_GIO), sq(NGUOI_TAO), sq(BAY_GIO)].join(", ") + `);`,
  );
  sql.push(`INSERT INTO nhat_ky_kiem_toan (actor_id, actor_email, action, entity_type, entity_id, version, note, timestamp) SELECT ${sq(NGUOI_TAO)}, ${sq(NGUOI_TAO)}, 'CREATE', ${sq(d.loai)}, ${sq(d.eid)}, 1, ${sq("Nạp từ dữ liệu thật: " + d.ghiChu)}, ${sq(BAY_GIO)} WHERE changes() > 0;`);
}

const ra = path.resolve(process.cwd(), ".wrangler/seed-d1.sql");
fs.mkdirSync(path.dirname(ra), { recursive: true });
fs.writeFileSync(ra, sql.join("\n") + "\n", "utf8");
console.log(`Đã ghi ${ra}: ${dong.filter((d) => d.loai === "school").length} trường, ${dong.filter((d) => d.loai === "tuition").length} mức học phí (đều có link nguồn thật, trạng thái APPROVED).`);

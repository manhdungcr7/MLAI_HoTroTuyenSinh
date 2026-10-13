// /api/xuat-ban-snapshot (qtv xuất bản; ROLLBACK/DONG_BO_KV/DONG_BO_VECTOR chỉ sa): xuất bản các bản ghi APPROVED thành snapshot có phiên bản + mã băm, hoặc quay lại phiên bản cũ.
//   GET                                -> bản đang chạy, số bản chờ xuất bản, lịch sử phiên bản (phân trang)
//   POST {action:"PUBLISH"} (mặc định) -> APPROVED => PUBLISHED, bản cũ cùng thực thể => SUPERSEDED, dựng snapshot, ghi D1 trong MỘT giao dịch, rồi đồng bộ KV
//   POST {action:"ROLLBACK", targetVersion}
//   POST {action:"DONG_BO_KV"}         -> đẩy lại bản đang chạy từ D1 sang KV (khi lần trước KV lỗi)
//   POST {action:"DONG_BO_VECTOR", batDau?} -> dựng lại chỉ mục vector (RAG) từ bản đang chạy, theo lô và giới hạn thời gian; còn dở thì trả `tiepTuc` để gọi lại với batDau đó
// Thứ tự an toàn: dựng snapshot trong bộ nhớ -> một batch D1 (bản ghi, manifest, tệp snapshot, nhật ký) -> KV (manifest:active ghi cuối cùng).
import { taoSnapshotVaManifest } from "../../../src/engine/du-lieu-tuyen-sinh/snapshot-builder";
import type { BanGhiCms } from "../../../src/engine/du-lieu-tuyen-sinh/kieu";
import { cauKiemToan, mapTuD1, type HangBanGhiD1 } from "../_thu-vien/ban-ghi-d1";
import { docHetTheoKhoa } from "../_thu-vien/d1";
import type { BoiCanh, Env, KhoD1, KhoD1Cau, TuyChon } from "../_thu-vien/kieu";
import { LoiHttp, docThan, docTrang, json, sai } from "../_thu-vien/phan-hoi";
import { chay, khongHoTro, QUAN_TRI } from "../_thu-vien/quyen";
import { thongBaoSuKien } from "../_thu-vien/telegram";
import { capNhatChiMuc, mucTuBanGhi, mucTuTap, type KetQuaCapNhat } from "../../../functions/_thu-vien/ai/chi-muc";

const KHOA_ID = "publish_lock";
const THOI_HAN_KHOA_MS = 60_000;
const TOI_DA_MOI_LAN = 500;
const TEN_TAP = ["schools", "tuition", "scholarships", "admissions", "announcements", "cutoffScores", "community"] as const;

interface HangManifest { data_version: string; manifest_json: string; is_active: number; published_by: string; published_at: string; total_records: number; change_summary: string | null }
interface HangTap { ten: string; noi_dung: string }

/** Đẩy bản `dataVersion` từ D1 sang KV. Manifest active ghi cuối để người đọc không thấy manifest trỏ vào tệp chưa có. */
async function dongBoKv(env: Env, d1: KhoD1, dataVersion: string): Promise<"ok" | "chua-cau-hinh"> {
  const kv = env.KV_CONG_DONG;
  if (!kv) return "chua-cau-hinh";
  const mf = await d1.prepare("SELECT manifest_json FROM snapshot_manifest WHERE data_version = ? LIMIT 1").bind(dataVersion).first<{ manifest_json: string }>();
  if (!mf) throw new LoiHttp(404, "khong-tim-thay", `Không có snapshot ${dataVersion} trong D1`);
  const tap = await d1.prepare("SELECT ten, noi_dung FROM snapshot_tap WHERE data_version = ? LIMIT 20").bind(dataVersion).all<HangTap>();
  for (const t of tap.results) await kv.put(`snapshot:${dataVersion}:${t.ten}`, t.noi_dung);
  await kv.put(`snapshot:${dataVersion}:manifest`, mf.manifest_json);
  await kv.put("manifest:active", mf.manifest_json);
  return "ok";
}

const TG_VECTOR_MS = 20_000;
type KqVector = KetQuaCapNhat & { tongSo?: number; tiepTuc?: number };

/** Ghi một dòng cảnh báo vào nhật ký kiểm toán; chính việc ghi lỗi cũng không được làm hỏng xuất bản. */
async function canhBaoVector(c: { d1: KhoD1; email: string; luc: string }, dataVersion: string, kq: KetQuaCapNhat) {
  try { await cauKiemToan(c.d1, { email: c.email, hanhDong: "VECTOR_CANH_BAO", entityType: "snapshot", entityId: dataVersion, version: 0, ghiChu: `Chưa cập nhật được chỉ mục vector (${kq.loi ?? "không rõ"}), đã làm ${kq.soBanGhi} bản ghi. Chạy DONG_BO_VECTOR để dựng lại.`, luc: c.luc }).run(); } catch { /* bỏ qua */ }
}

/** Dựng lại chỉ mục từ tập snapshot của `dataVersion` (lấy từ D1), từ vị trí `batDau`, dừng khi hết giờ. */
async function dongBoVector(env: Env, d1: KhoD1, dataVersion: string, batDau = 0): Promise<KqVector> {
  if (!env.AI || !env.VECTORIZE) return { daLam: false, soBanGhi: 0 };
  const tap = await d1.prepare("SELECT ten, noi_dung FROM snapshot_tap WHERE data_version = ? LIMIT 20").bind(dataVersion).all<HangTap>();
  const muc = tap.results.flatMap((t) => mucTuTap(t.ten, t.noi_dung, dataVersion));
  const han = Date.now() + TG_VECTOR_MS;
  let vt = batDau, lam = 0;
  while (vt < muc.length && Date.now() < han) {
    const kq = await capNhatChiMuc(env, muc.slice(vt, vt + 100));
    if (!kq.daLam) return { ...kq, soBanGhi: lam + kq.soBanGhi, tongSo: muc.length, tiepTuc: vt };
    lam += kq.soBanGhi; vt += 100;
  }
  return { daLam: true, soBanGhi: lam, tongSo: muc.length, ...(vt < muc.length ? { tiepTuc: vt } : {}) };
}

const loiKv = (e: unknown) => new LoiHttp(502, "dong-bo-kv-loi", `Đã lưu vào D1 nhưng chưa đồng bộ được KV (${e instanceof Error ? e.message : "lỗi lạ"}). Gọi lại POST với action DONG_BO_KV.`);

export const xuLy = (ctx: BoiCanh, o: TuyChon = {}) =>
  chay(ctx, o, QUAN_TRI, async (c) => {
    // ===== GET: trạng thái xuất bản =====
    if (c.request.method === "GET") {
      const t = docTrang(c.url, 20);
      const [chuaXb, dem, ds, dangChay] = (await c.d1.batch([
        c.d1.prepare("SELECT COUNT(*) AS c FROM ban_ghi_cms WHERE status = 'APPROVED'"),
        c.d1.prepare("SELECT COUNT(*) AS c FROM snapshot_manifest"),
        c.d1.prepare("SELECT data_version, is_active, published_by, published_at, total_records, change_summary FROM snapshot_manifest ORDER BY published_at DESC, data_version DESC LIMIT ? OFFSET ?").bind(t.moi, t.offset),
        c.d1.prepare("SELECT data_version, manifest_json, is_active, published_by, published_at, total_records, change_summary FROM snapshot_manifest WHERE is_active = 1 LIMIT 1"),
      ])) as unknown as [{ results: { c: number }[] }, { results: { c: number }[] }, { results: Omit<HangManifest, "manifest_json">[] }, { results: HangManifest[] }];
      const a = dangChay.results[0];
      return json({
        soChoXuatBan: chuaXb.results[0]?.c ?? 0,
        dangChay: a ? { dataVersion: a.data_version, publishedBy: a.published_by, publishedAt: a.published_at, totalRecords: a.total_records, manifest: JSON.parse(a.manifest_json) } : null,
        lichSu: ds.results.map((r) => ({ dataVersion: r.data_version, dangChay: r.is_active === 1, publishedBy: r.published_by, publishedAt: r.published_at, totalRecords: r.total_records, changeSummary: r.change_summary })),
        tong: dem.results[0]?.c ?? 0,
      });
    }
    if (c.request.method !== "POST") throw khongHoTro();

    const body = await docThan(c.request).catch(() => ({} as Record<string, unknown>));
    const action = String(body.action || "PUBLISH");

    // ===== ROLLBACK =====
    if (action === "ROLLBACK") {
      c.yeuCauSa("Chỉ siêu quản trị được quay lại phiên bản cũ");
      const dich = String(body.targetVersion || "");
      if (!dich) throw sai("Thiếu targetVersion để rollback", "targetVersion");
      const co = await c.d1.prepare("SELECT data_version FROM snapshot_manifest WHERE data_version = ? LIMIT 1").bind(dich).first();
      if (!co) throw new LoiHttp(404, "khong-tim-thay", `Không tìm thấy snapshot ${dich}`);
      await c.d1.batch([
        c.d1.prepare("UPDATE snapshot_manifest SET is_active = (data_version = ?)").bind(dich),
        cauKiemToan(c.d1, { email: c.email, hanhDong: "ROLLBACK", entityType: "snapshot", entityId: dich, version: 0, ghiChu: `Rollback về ${dich}`, luc: c.luc }),
      ]);
      let kv: "ok" | "chua-cau-hinh";
      try { kv = await dongBoKv(c.env, c.d1, dich); } catch (e) { throw e instanceof LoiHttp && e.status === 404 ? e : loiKv(e); }
      // Chỉ mục vector dựng lại theo phiên bản đích (lỗi không làm hỏng rollback). Mã vector chỉ có ở bản mới hơn thì còn sót, chạy DONG_BO_VECTOR không xóa chúng.
      let vector: KqVector = { daLam: false, soBanGhi: 0 };
      try { vector = await dongBoVector(c.env, c.d1, dich); if (!vector.daLam && vector.loi) await canhBaoVector(c, dich, vector); } catch { /* bỏ qua */ }
      return json({ thanhCong: true, thongBao: `Đã rollback về version ${dich}`, activeVersion: dich, dongBoKv: kv, vector });
    }

    // ===== ĐỒNG BỘ KV =====
    if (action === "DONG_BO_KV") {
      c.yeuCauSa("Chỉ siêu quản trị được đồng bộ KV");
      const a = await c.d1.prepare("SELECT data_version FROM snapshot_manifest WHERE is_active = 1 LIMIT 1").first<{ data_version: string }>();
      if (!a) throw new LoiHttp(404, "chua-co-snapshot", "Chưa có snapshot nào đang chạy");
      let kv: "ok" | "chua-cau-hinh";
      try { kv = await dongBoKv(c.env, c.d1, a.data_version); } catch (e) { throw e instanceof LoiHttp ? e : loiKv(e); }
      return json({ thanhCong: true, activeVersion: a.data_version, dongBoKv: kv });
    }

    // ===== ĐỒNG BỘ VECTOR =====
    if (action === "DONG_BO_VECTOR") {
      c.yeuCauSa("Chỉ siêu quản trị được đồng bộ vector");
      const a = await c.d1.prepare("SELECT data_version FROM snapshot_manifest WHERE is_active = 1 LIMIT 1").first<{ data_version: string }>();
      if (!a) throw new LoiHttp(404, "chua-co-snapshot", "Chưa có snapshot nào đang chạy");
      const batDau = Math.max(0, Math.floor(Number(body.batDau) || 0));
      const vector = await dongBoVector(c.env, c.d1, a.data_version, batDau).catch((e): KqVector => ({ daLam: false, soBanGhi: 0, loi: e instanceof Error ? e.message : "loi-la" }));
      return json({ thanhCong: true, activeVersion: a.data_version, vector });
    }

    if (action !== "PUBLISH") throw sai("action phải là PUBLISH, ROLLBACK, DONG_BO_KV hoặc DONG_BO_VECTOR", "action");

    // ===== PUBLISH =====
    // Khóa nguyên tử: chỉ chiếm được khi chưa có khóa hoặc khóa cũ đã hết hạn (changes = 0 nghĩa là người khác đang giữ).
    const hetHan = new Date(c.bayGio.getTime() + THOI_HAN_KHOA_MS).toISOString();
    const khoa = await c.d1
      .prepare(`INSERT INTO khoa_xuat_ban (khoa_id, so_huu_boi, khoa_luc, het_han_luc) VALUES (?, ?, ?, ?)
                ON CONFLICT(khoa_id) DO UPDATE SET so_huu_boi = excluded.so_huu_boi, khoa_luc = excluded.khoa_luc, het_han_luc = excluded.het_han_luc
                WHERE khoa_xuat_ban.het_han_luc < excluded.khoa_luc`)
      .bind(KHOA_ID, c.email, c.luc, hetHan)
      .run();
    if ((khoa.meta?.changes ?? 0) === 0) throw new LoiHttp(409, "dang-xuat-ban", "Đang có tiến trình xuất bản khác. Thử lại sau ít phút.");

    try {
      const choDuyet = (await c.d1.prepare("SELECT * FROM ban_ghi_cms WHERE status = 'APPROVED' ORDER BY entity_type, entity_id, version DESC, id LIMIT ?").bind(TOI_DA_MOI_LAN).all<HangBanGhiD1>()).results;
      if (choDuyet.length === 0) throw new LoiHttp(409, "khong-co-gi-de-xuat-ban", "Không có bản ghi APPROVED nào để xuất bản.");

      // Mỗi thực thể chỉ một bản thắng (version cao nhất); các bản APPROVED còn lại thành SUPERSEDED.
      const thang = new Map<string, HangBanGhiD1>();
      const thua: HangBanGhiD1[] = [];
      for (const h of choDuyet) {
        const k = `${h.entity_type}\u0000${h.entity_id}`;
        const cu = thang.get(k);
        if (!cu) thang.set(k, h);
        else if (h.version > cu.version) { thua.push(cu); thang.set(k, h); } else thua.push(h);
      }

      const dangPublished = await docHetTheoKhoa<HangBanGhiD1>(c.d1, "SELECT * FROM ban_ghi_cms WHERE status = 'PUBLISHED' AND id > ? ORDER BY id LIMIT ?", "id");
      const giuLai = dangPublished.filter((h) => !thang.has(`${h.entity_type}\u0000${h.entity_id}`));
      const moi: BanGhiCms[] = [...thang.values()].map((h) => ({ ...mapTuD1(h), status: "PUBLISHED", publishedBy: c.email, publishedAt: c.luc, updatedBy: c.email, updatedAt: c.luc }));
      const dsXuatBan = [...giuLai.map(mapTuD1), ...moi].sort((a, b) => (a.entityId < b.entityId ? -1 : a.entityId > b.entityId ? 1 : a.entityType.localeCompare(b.entityType)));

      // Mã phiên bản YYYY.MM.DD.NN, NN tăng theo bản cuối cùng trong ngày (không dùng COUNT để khỏi trùng sau khi xóa).
      const ngay = c.luc.slice(0, 10).replace(/-/g, ".");
      const cuoi = await c.d1.prepare("SELECT data_version FROM snapshot_manifest WHERE data_version LIKE ? ORDER BY data_version DESC LIMIT 1").bind(`${ngay}.%`).first<{ data_version: string }>();
      const stt = cuoi ? Number(cuoi.data_version.split(".")[3]) + 1 : 1;
      const dataVersion = `${ngay}.${String(stt).padStart(2, "0")}`;

      const kqSnap = await taoSnapshotVaManifest(dsXuatBan, dataVersion);
      const manifestJson = JSON.stringify(kqSnap.manifest);

      const cau: KhoD1Cau[] = [];
      for (const h of thang.values()) {
        cau.push(c.d1.prepare("UPDATE ban_ghi_cms SET status = 'SUPERSEDED', updated_by = ?, updated_at = ? WHERE entity_type = ? AND entity_id = ? AND status = 'PUBLISHED'").bind(c.email, c.luc, h.entity_type, h.entity_id));
        cau.push(c.d1.prepare("UPDATE ban_ghi_cms SET status = 'PUBLISHED', published_by = ?, published_at = ?, updated_by = ?, updated_at = ? WHERE id = ? AND status = 'APPROVED'").bind(c.email, c.luc, c.email, c.luc, h.id));
        cau.push(cauKiemToan(c.d1, { email: c.email, hanhDong: "PUBLISH", entityType: h.entity_type, entityId: h.entity_id, version: h.version, ghiChu: `Xuất bản trong snapshot ${dataVersion}`, luc: c.luc }));
      }
      for (const h of thua) cau.push(c.d1.prepare("UPDATE ban_ghi_cms SET status = 'SUPERSEDED', updated_by = ?, updated_at = ? WHERE id = ? AND status = 'APPROVED'").bind(c.email, c.luc, h.id));
      cau.push(c.d1.prepare("UPDATE snapshot_manifest SET is_active = 0"));
      cau.push(c.d1.prepare("INSERT INTO snapshot_manifest (data_version, schema_version, manifest_json, is_active, published_by, published_at, total_records, change_summary) VALUES (?, 1, ?, 1, ?, ?, ?, ?)")
        .bind(dataVersion, manifestJson, c.email, c.luc, dsXuatBan.length, `${thang.size} bản ghi mới xuất bản, ${thua.length} bản bị thay thế`));
      for (const ten of TEN_TAP) {
        const d = kqSnap.datasets[ten];
        cau.push(c.d1.prepare("INSERT INTO snapshot_tap (data_version, ten, duong_dan, hash_sha256, kich_thuoc, so_ban_ghi, noi_dung) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(dataVersion, ten, d.meta.url, d.meta.hash, d.meta.size, d.meta.recordCount, d.json));
      }
      cau.push(cauKiemToan(c.d1, { email: c.email, hanhDong: "PUBLISH", entityType: "snapshot", entityId: dataVersion, version: 0, ghiChu: `Xuất bản ${dataVersion}: ${dsXuatBan.length} bản ghi`, luc: c.luc }));
      await c.d1.batch(cau);

      let kv: "ok" | "chua-cau-hinh";
      try { kv = await dongBoKv(c.env, c.d1, dataVersion); } catch (e) { throw loiKv(e); }
      // Chỉ mục vector chỉ cho bản ghi vừa xuất bản (id vector theo thực thể nên bản mới tự ghi đè bản cũ; bản đã xuất bản không bị xóa vì chỉ DRAFT/REJECTED mới lưu trữ được).
      let vector: KetQuaCapNhat = { daLam: false, soBanGhi: 0 };
      try {
        vector = await capNhatChiMuc(c.env, [...thang.values()].map((h) => mucTuBanGhi(mapTuD1(h), dataVersion)));
        if (!vector.daLam && vector.loi) await canhBaoVector(c, dataVersion, vector);
      } catch { /* vector không được làm hỏng xuất bản */ }
      const tb = await thongBaoSuKien(c.env, { hanhDong: "PUBLISHED", email: c.email, phienBan: dataVersion, soBanGhi: thang.size }, c.o);

      return json({ thanhCong: true, dataVersion, soBanGhiMoi: thang.size, soBanBiThayThe: thua.length, conBanChoXuatBan: choDuyet.length >= TOI_DA_MOI_LAN, tongBanGhiPublished: dsXuatBan.length, dongBoKv: kv, vector: { daLam: vector.daLam, soBanGhi: vector.soBanGhi }, manifest: kqSnap.manifest }, 200, { "x-thong-bao": tb });
    } finally {
      await c.d1.prepare("DELETE FROM khoa_xuat_ban WHERE khoa_id = ? AND so_huu_boi = ?").bind(KHOA_ID, c.email).run();
    }
  });

export const onRequest = (ctx: BoiCanh) => xuLy(ctx);

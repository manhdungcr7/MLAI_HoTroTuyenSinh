// Local workerd/D1 integration checks. Start app:local and cms:api with the same
// NV_TRANG_THAI pointing to an isolated QA database before running this script.
import assert from "node:assert/strict";
import { randomBytes, pbkdf2Sync, createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync, unlinkSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const state = resolve(process.env.NV_TRANG_THAI || join(root, ".wrangler", "qa-handover-state"));
if (!state.includes("qa-handover-state")) throw new Error("Use a separate qa-handover-state database for this test.");
const output = join(root, ".wrangler", "qa-evidence"); mkdirSync(output, { recursive: true });
const sqlFile = join(output, "seed.sql");
const tag = randomBytes(5).toString("hex"), email = `qa-sa-${tag}@example.test`, volunteer = `qa-ctv-${tag}@example.test`;
const pass = randomBytes(24).toString("hex"), pass2 = randomBytes(24).toString("hex"), salt = randomBytes(16);
const hash = `pbkdf2_sha256$100000$${salt.toString("base64url")}$${pbkdf2Sync(pass, salt, 100000, 32, "sha256").toString("base64url")}`;
const checks = [];
const sql = content => {
  writeFileSync(sqlFile, content);
  const r = spawnSync(process.execPath, [join(root, "node_modules/wrangler/bin/wrangler.js"), "d1", "execute", "DB", "--local", "--persist-to", state, "--file", sqlFile], { cwd: root, encoding: "utf8" });
  if (r.status !== 0) throw new Error("Local D1 setup/cleanup failed");
};
const app = "http://127.0.0.1:8790", cms = "http://127.0.0.1:8788";
const call = (base, path, { body, cookie, origin = base, ...rest } = {}) => fetch(base + path, { method: body === undefined ? "GET" : "POST", headers: { "content-type": "application/json", origin, ...(cookie ? { cookie } : {}) }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}), ...rest });
const expect = async (name, promise, status) => { const r = await promise; assert.equal(r.status, status, name); checks.push(name); return r; };
const cookie = r => r.headers.get("set-cookie").split(";")[0];
let recordId;
try {
  sql(`INSERT INTO quan_tri (email,vai_tro,tao_luc,mat_khau,phai_doi_mat_khau,mat_khau_luc) VALUES ('${email}','sa','2026-01-01','${hash}',0,'2026-01-01');`);
  await expect("Unauthenticated CMS returns 401 JSON", call(cms, "/api/toi"), 401);
  let r = await expect("Manifest JSON", call(app, "/api/manifest"), 200); assert.ok((await r.json()).datasets);
  await expect("Invalid signup rejected", call(app, "/api/dang-ky-som", { body: {} }), 400);
  r = await expect("Early signup persisted", call(app, "/api/dang-ky-som", { body: { hoTen: "QA local only", lop: "12", nhuCau: "nganh", lienHe: email } }), 200); const signupId = (await r.json()).id;
  await expect("Oversized signup rejected", call(app, "/api/dang-ky-som", { body: { x: "x".repeat(9000) } }), 413);
  r = await expect("PBKDF2 login on workerd", call(cms, "/api/dang-nhap", { body: { email, matKhau: pass } }), 200); let ck = cookie(r);
  r = await expect("Shared app/CMS D1 inbox", call(cms, "/api/hop-thu?loai=truy-cap-som", { cookie: ck }), 200); assert.ok((await r.text()).includes(signupId));
  await expect("CSRF blocked", call(cms, "/api/ban-ghi", { cookie: ck, origin: "https://another.example", body: {} }), 403);
  await expect("CMS oversized body rejected", call(cms, "/api/ban-ghi", { cookie: ck, body: { x: "x".repeat(40000) } }), 413);
  await expect("Volunteer submission accepted", call(app, "/api/tinh-nguyen", { body: { hoTen: "QA local volunteer", vaiTro: "sinh_vien", maTruong: "BKA", lienHe: volunteer } }), 200);
  const inbox = await (await call(cms, "/api/hop-thu?loai=tinh-nguyen", { cookie: ck })).json(); const registration = inbox.dangKy.find(x => x.lienHe === volunteer); assert.ok(registration);
  r = await expect("Grant creates usable temporary password", call(cms, "/api/hop-thu", { cookie: ck, body: { action: "CAP_QUYEN", id: registration.id } }), 201); const grant = await r.json(); assert.ok(grant.matKhauTam);
  r = await expect("Volunteer logs in", call(cms, "/api/dang-nhap", { body: { email: volunteer, matKhau: grant.matKhauTam } }), 200); const temp = cookie(r);
  await expect("Temporary password blocks CMS editing", call(cms, "/api/ban-ghi", { cookie: temp }), 403);
  r = await expect("Mandatory password change", call(cms, "/api/doi-mat-khau", { cookie: temp, body: { matKhauCu: grant.matKhauTam, matKhauMoi: pass2 } }), 200); const ctv = cookie(r);
  await expect("Old temporary session revoked", call(cms, "/api/toi", { cookie: temp }), 401);
  await expect("CTV cannot read early contacts", call(cms, "/api/hop-thu?loai=truy-cap-som", { cookie: ctv }), 403);
  await expect("CTV cannot manage members", call(cms, "/api/nguoi", { cookie: ctv }), 403);
  const draft = { entityType: "noi_luu_tru", entityId: `BKA-qa-${tag}`, data: { maTruong: "BKA", coKyTucXa: "co", khuTroXungQuanh: "nhieu", ghiChu: "QA LOCAL ONLY" }, source: { url: "https://tuyensinh.hust.edu.vn/ktx", tieuDe: "QA fixture", donViCongBo: "QA local" } };
  await expect("Draft requires source", call(cms, "/api/ban-ghi", { cookie: ctv, body: { ...draft, source: undefined } }), 400);
  await expect("CTV cannot edit unassigned school", call(cms, "/api/ban-ghi", { cookie: ctv, body: { ...draft, entityId: `QSC-qa-${tag}`, data: { ...draft.data, maTruong: "QSC" } } }), 403);
  r = await expect("CTV creates DRAFT", call(cms, "/api/ban-ghi", { cookie: ctv, body: draft }), 201); const saved = await r.json(); recordId = saved.id; assert.equal(saved.status, "DRAFT");
  await expect("CTV cannot self-approve", call(cms, "/api/ban-ghi", { cookie: ctv, method: "PATCH", body: { id: recordId, status: "APPROVED" } }), 403);
  await expect("Submit for review", call(cms, "/api/ban-ghi", { cookie: ctv, method: "PATCH", body: { id: recordId, status: "SUBMITTED" } }), 200);
  await expect("SA approves", call(cms, "/api/ban-ghi", { cookie: ck, method: "PATCH", body: { id: recordId, status: "APPROVED" } }), 200);
  await expect("CTV cannot publish", call(cms, "/api/xuat-ban-snapshot", { cookie: ctv, body: {} }), 403);
  r = await expect("Publish snapshot", call(cms, "/api/xuat-ban-snapshot", { cookie: ck, body: {} }), 200); const published = await r.json(); const meta = published.manifest.datasets.community;
  r = await expect("Published snapshot served to students", call(app, meta.url), 200); const json = await r.text(); assert.ok(json.includes(draft.entityId)); assert.equal(createHash("sha256").update(json).digest("hex"), meta.hash);
  await expect("Tampered snapshot path rejected", call(app, meta.url.replace(/\.json$/, "bad.json")), 404);
  r = await expect("SA password change", call(cms, "/api/doi-mat-khau", { cookie: ck, body: { matKhauCu: pass, matKhauMoi: pass2 } }), 200); const newCk = cookie(r);
  await expect("SA old session revoked", call(cms, "/api/toi", { cookie: ck }), 401);
  await expect("SA new session works", call(cms, "/api/toi", { cookie: newCk }), 200);
  // Credentials stay in memory; an optional local browser test can import this function via its own fixture.
  writeFileSync(join(output, "http.json"), JSON.stringify({ date: new Date().toISOString(), checks }, null, 2));
  console.log(`PASS ${checks.length} HTTP/workerd/D1 checks`);
} finally {
  sql(`DELETE FROM phan_cong WHERE email IN ('${email}','${volunteer}'); DELETE FROM nhat_ky WHERE ai IN ('${email}','${volunteer}'); DELETE FROM quan_tri WHERE email IN ('${email}','${volunteer}'); DELETE FROM dang_ky_truy_cap_som WHERE lien_he='${email}'; DELETE FROM tinh_nguyen_dang_ky WHERE lien_he='${volunteer}';`);
  unlinkSync(sqlFile);
}

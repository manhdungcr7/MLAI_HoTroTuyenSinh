import assert from "node:assert/strict";
import { executeCapability, capabilityDefinitions, type CapabilityResult } from "../src/capabilities";
import { loadCatalog, programDetails, type AdmissionRecord } from "../src/capabilities/catalog";
import { xuLyDanhSachTruong } from "../functions/api/v1/universities";
import type { BanChup } from "../src/engine/ket-noi-kieu";

function data(result: CapabilityResult): Record<string, unknown> {
  if (!result.ok) throw new Error(result.error.message);
  return result.data as Record<string, unknown>;
}
function error(result: CapabilityResult, code: string) {
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error.code, code);
}
const snapshot: BanChup = {
  phienBan: 1, capNhat: "2026-10-16T08:00:00Z", hoSo: { lop: 12, tinh: "Hà Nội", nganhQuanTam: ["Kinh tế"], khuVuc: ["Hà Nội"], toHopCaoNhat: { ma: "A01", tong: 25 } },
  diemThi: [], nguyenVong: [], goiY: [], keHoachTuan: [],
};

assert.equal(capabilityDefinitions.length, 8);
for (const args of [{ limit: 100.2 }, { limit: 101 }, { limit: "10" }, { offset: -1 }, { offset: Infinity }, { q: " " }, { q: "a".repeat(121) }, { injected: true }, null, []]) {
  error(await executeCapability("search_universities", args), "INVALID_ARGUMENT");
}
error(await executeCapability("unknown", {}), "UNKNOWN_CAPABILITY");
const university = data(await executeCapability("search_universities", { q: "HUST", limit: 1 }));
assert.equal((university.data as { maTruong: string }[])[0].maTruong, "BKA");
const noMatch = data(await executeCapability("search_universities", { q: "school-not-in-dataset-987" }));
assert.equal(noMatch.tong, 0);
const province = data(await executeCapability("search_universities", { tinh: "Trà Vinh", limit: 100 }));
assert.ok((province.data as { tinh: string[] }[]).every((u) => u.tinh.includes("Vĩnh Long")));
error(await executeCapability("get_university", { maTruong: "bach khoa" }), "NOT_FOUND");
error(await executeCapability("get_university", {}), "INVALID_ARGUMENT");

const scored = data(await executeCapability("calculate_admission_score", { maToHop: "A01", diemMon: { toan: 8, vatLy: 8, tiengAnh: 8 }, khuVuc: "KV1", doiTuong: "UT1" }));
assert.equal(scored.tongBaMon, 24);
assert.equal(scored.uuTienCong, 2.2);
assert.equal(scored.tongXetTuyen, 26.2);
const missing = data(await executeCapability("calculate_admission_score", { maToHop: "D01", diemMon: { toan: 0, nguVan: null, tiengAnh: 5 } }));
assert.equal(missing.tongXetTuyen, null);
assert.deepEqual(missing.thieuMon, ["nguVan"]);
const zero = data(await executeCapability("calculate_admission_score", { maToHop: "A00", diemMon: { toan: 0, vatLy: 0, hoaHoc: 0 } }));
assert.equal(zero.tongXetTuyen, 0);
for (const diemMon of [{ toan: -1 }, { toan: 11 }, { toan: NaN }, { toan: Infinity }, { toan: "8" }, { unknown: 8 }]) {
  error(await executeCapability("calculate_admission_score", { maToHop: "A01", diemMon }), "INVALID_ARGUMENT");
}
error(await executeCapability("calculate_admission_score", { maToHop: "V00", diemMon: {} }), "INVALID_ARGUMENT");
error(await executeCapability("calculate_admission_score", { maToHop: "A01", diemMon: {}, khuVuc: "KV9" }), "INVALID_ARGUMENT");

const [catalog, catalogCungLuc] = await Promise.all([loadCatalog(), loadCatalog()]);
assert.strictEqual(catalogCungLuc, catalog, "catalog bất biến phải dùng chung một promise trong isolate");
const sample = catalog.records.find((r) => r.pt === "THPT" && r.toHop.includes("A01") && r.tinh === "Hà Nội")!;
assert.ok(sample);
const profile = data(await executeCapability("get_university", { maTruong: sample.ma }));
assert.equal(profile.soChuongTrinh, catalog.records.filter((r) => r.ma === sample.ma).length);
assert.equal((profile.provenance as { verificationStatus: string }).verificationStatus, "not_independently_verified");
const majors = data(await executeCapability("search_majors", { maTruong: sample.ma, maToHop: "A01", limit: 2, offset: 1 }));
assert.ok((majors.data as { toHop: string[] }[]).every((r) => r.toHop.includes("A01")));
assert.ok((majors.data as unknown[]).length <= 2);
const rules = data(await executeCapability("get_admission_rules", { maTruong: sample.ma }));
assert.equal(rules.heSoMon, null);
assert.equal(rules.dieuKienDuTuyen, null);
const absentLatest: AdmissionRecord = { ...sample, diem: { "2024": 25, "2025": null } };
const preserved = programDetails(absentLatest, catalog);
assert.equal(preserved.diemChuan, null);
assert.equal(preserved.namDiem, 2025);
assert.deepEqual(preserved.diemTheoNam, { "2024": 25, "2025": null });

for (const name of ["analyze_student_profile", "recommend_preferences", "validate_preference_order"]) error(await executeCapability(name, {}), "AUTH_REQUIRED");
const analysis = data(await executeCapability("analyze_student_profile", {}, snapshot));
assert.equal(analysis.capNhat, snapshot.capNhat);
assert.equal(Object.hasOwn(analysis, "nguyenVong"), false);
assert.equal(Object.hasOwn(analysis, "keHoachTuan"), false);
const incomplete = { ...snapshot, hoSo: { toHopCaoNhat: null } };
error(await executeCapability("recommend_preferences", {}, incomplete), "INSUFFICIENT_DATA");
const recommendations = data(await executeCapability("recommend_preferences", { limit: 5 }, snapshot));
const recs = recommendations.data as { id: string; tinh: string; phuongThuc: string; toHop: string[]; chenhLech: number }[];
assert.ok(recs.length > 0 && recs.length <= 5);
assert.ok(recs.every((r) => r.tinh === "Hà Nội" && r.phuongThuc === "THPT" && r.toHop.includes("A01")));
assert.equal(JSON.stringify(recommendations).includes('"xacSuat'), false);
const again = data(await executeCapability("recommend_preferences", { limit: 5 }, snapshot));
assert.deepEqual(recommendations, again);
const validation = data(await executeCapability("validate_preference_order", { ids: [sample.id, sample.id, "unknown-program"] }, snapshot));
assert.equal(validation.valid, false);
assert.deepEqual(validation.duplicateIds, [sample.id]);
assert.deepEqual(validation.unknownIds, ["unknown-program"]);
error(await executeCapability("validate_preference_order", { ids: Array(31).fill(sample.id) }, snapshot), "INVALID_ARGUMENT");
assert.equal(data(await executeCapability("validate_preference_order", { ids: [] }, snapshot)).valid, true);
const selectedSnapshot: BanChup = { ...snapshot, nguyenVong: [{ id: sample.id, thuTu: 1, nganh: sample.nganh, truong: sample.truong, maTruong: sample.ma }] };
assert.equal(data(await executeCapability("validate_preference_order", {}, selectedSnapshot)).valid, true);
const missingPreference = data(await executeCapability("validate_preference_order", { ids: [] }, selectedSnapshot));
assert.equal(missingPreference.valid, false);
assert.deepEqual(missingPreference.missingIds, [sample.id]);
assert.equal(data(await executeCapability("validate_preference_order", { ids: [sample.id] }, snapshot)).valid, false);

for (const query of ["limit=1.5", "limit=1000000", "offset=Infinity", "limit=", "extra=x", "limit=1&limit=2"]) {
  assert.equal((await xuLyDanhSachTruong(new Request(`https://app.test/api/v1/universities?${query}`))).status, 400, query);
}
console.log("capabilities: strict inputs, null scores, priority calculation, provenance, scoped snapshot and deterministic recommendations passed");

// Xuất các bảng dùng chung giữa frontend (TypeScript) và backend (Python) ra JSON,
// để hai bên cùng một nguồn. Chạy: cd frontend && npx tsx ../scripts/export_shared_rules.ts
import { writeFileSync } from "node:fs";
import { COMBINATION_SUBJECTS } from "../frontend/src/data/universities/combinations";
import { VIETNAM_PROVINCES } from "../frontend/src/engine/geo/distance";

const out = {
  combinations: COMBINATION_SUBJECTS,
  provinceRegions: Object.fromEntries(Object.entries(VIETNAM_PROVINCES).map(([k, v]) => [k, v.region])),
};
writeFileSync(new URL("../common/data/shared_rules.json", import.meta.url), JSON.stringify(out, null, 1), "utf-8");
console.log(Object.keys(out.combinations).length, "tổ hợp;", Object.keys(out.provinceRegions).length, "tỉnh");

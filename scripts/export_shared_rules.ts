// Xuất các bảng dùng chung giữa frontend (TypeScript) và backend (Python) ra JSON,
// để hai bên cùng một nguồn. Chạy: cd frontend && npx tsx ../scripts/export_shared_rules.ts
import { writeFileSync } from "node:fs";
import { COMBINATION_SUBJECTS } from "../frontend/src/data/universities/combinations";
import { PROVINCE_REGIONS } from "../frontend/src/engine/geo/regions";

const out = {
  combinations: COMBINATION_SUBJECTS,
  provinceRegions: PROVINCE_REGIONS,
};
writeFileSync(new URL("../common/data/shared_rules.json", import.meta.url), JSON.stringify(out, null, 1), "utf-8");
console.log(Object.keys(out.combinations).length, "tổ hợp;", Object.keys(out.provinceRegions).length, "tỉnh");

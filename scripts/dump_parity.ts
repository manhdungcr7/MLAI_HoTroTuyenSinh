// Chạy engine TypeScript trên các hồ sơ mẫu để đối chiếu với common/admission_core.py.
// Dùng bởi tests/backend/test_admission_core_parity.py.
import { readFileSync } from "node:fs";
import { DECISION_PROGRAM_POOL } from "../frontend/src/data/catalog";
import { buildCandidateOptions, calculateWishlistFailAll } from "../frontend/src/engine/decision/optimizer";
import { filterByConstraints } from "../frontend/src/engine/decision/constraints";
import { suggestPortfolio, candidateToWishlistItem } from "../frontend/src/engine/decision/portfolio-suggest";

const cases = JSON.parse(readFileSync(process.argv[2], "utf-8")) as { name: string; profile: any }[];
const result: Record<string, unknown> = { catalogSize: DECISION_PROGRAM_POOL.length };
for (const { name, profile } of cases) {
  const full = { name: "", grade: "", highSchool: "", availableHoursPerWeek: 0, ...profile };
  const all = buildCandidateOptions(DECISION_PROGRAM_POOL, full);
  const matched = filterByConstraints(all, full);
  const suggestion = suggestPortfolio(matched, (full.interestMajorGroups ?? []).length > 0).items;
  const items = suggestion.map((c, i) => candidateToWishlistItem(c, i + 1));
  result[name] = {
    candidates: all.map((c) => ({
      id: c.programId, score: c.userScore, p50: c.cutoffP50, prob: c.admitProbability,
      combo: c.combination, method: c.admissionMethod, role: c.role, verified: c.combinationsVerified,
    })).sort((a, b) => (a.id < b.id ? -1 : 1)),
    matched: matched.length,
    suggestion: suggestion.map((c) => c.programId),
    pFailAll: items.length ? calculateWishlistFailAll(items) : 1,
  };
}
console.log(JSON.stringify(result));

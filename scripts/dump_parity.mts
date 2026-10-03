// Chạy engine TypeScript trên các hồ sơ mẫu để đối chiếu với common/admission_core.py.
// Dùng bởi tests/backend/test_admission_core_parity.py.
import { readFileSync } from "node:fs";
import { loadCatalog } from "../frontend/src/data/catalog";

const DECISION_PROGRAM_POOL = (await loadCatalog()).programs;
import { buildCandidateOptions, calculateWishlistFailAll } from "../frontend/src/engine/decision/optimizer";
import { filterByConstraints } from "../frontend/src/engine/decision/constraints";
import { suggestPortfolio, candidateToWishlistItem } from "../frontend/src/engine/decision/portfolio-suggest";
import { registerSchoolRules, clearSchoolRules } from "../frontend/src/engine/scoring/school-rules";
import { scoreForProgram, missingInputsForProgram } from "../frontend/src/engine/scoring/method-score";

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

// Quy tắc riêng từng trường (fixture thử nghiệm): ma trận hồ sơ x chương trình tổng hợp.
if (process.argv[3]) {
  const fx = JSON.parse(readFileSync(process.argv[3], "utf-8"));
  clearSchoolRules();
  registerSchoolRules(fx.rules);
  const matrix: unknown[] = [];
  for (const profile of fx.profiles) {
    for (const program of fx.programs) {
      const full = { name: "", grade: "", highSchool: "", availableHoursPerWeek: 0, ...profile };
      const s = scoreForProgram(full, { programId: "x", ...program } as any);
      matrix.push(s ? { score: s.score, raw: s.rawScore, bonus: s.bonus, combo: s.combo, origin: s.ruleOrigin, unverified: s.comboUnverified, ielts: s.usedIeltsConversion }
                    : { score: null, missing: missingInputsForProgram(full, { programId: "x", ...program } as any) });
    }
  }
  result.ruleMatrix = matrix;
}
console.log(JSON.stringify(result));

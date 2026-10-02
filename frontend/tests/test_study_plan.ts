import assert from "node:assert/strict";
import { buildStudyPlan } from "../src/engine/study-plan/engine";
import type { StudentProfile, SubjectRoiMetric } from "../src/engine/types";

const profile = (hours: number): StudentProfile => ({
  name: "",
  grade: "12",
  highSchool: "",
  homeProvince: "",
  examScores: { toan: 6, van: 7, anh: 8 },
  altScores: {},
  priority: { area: "KV3", object: "none" },
  annualBudgetVnd: 0,
  relocationWillingness: "chi_tinh_nha",
  availableHoursPerWeek: hours,
  activeCombination: "D01",
});

const roi: SubjectRoiMetric[] = [
  { subject: "toan", subjectVi: "Toán", currentScore: 6, simulatedScore: 7, deltaScore: 1, unlockedOptionsCount: 0, gapReduction: 1, effortDifficulty: 1, netRoi: 1.2, tier: 1, explanationVi: "Ưu tiên" },
  { subject: "van", subjectVi: "Văn", currentScore: 7, simulatedScore: 8, deltaScore: 1, unlockedOptionsCount: 0, gapReduction: 1, effortDifficulty: 1, netRoi: 0.8, tier: 2, explanationVi: "Bổ trợ" },
  { subject: "anh", subjectVi: "Anh", currentScore: 8, simulatedScore: 9, deltaScore: 1, unlockedOptionsCount: 0, gapReduction: 1, effortDifficulty: 1, netRoi: 0.5, tier: 2, explanationVi: "Bổ trợ" },
];

for (const hours of [52.5, 5, 0, -3, Number.NaN, 200]) {
  const plan = buildStudyPlan(profile(hours), roi);
  const cap = Number.isFinite(hours) ? Math.max(0, Math.min(168, hours)) : 52.5;
  const allocated = plan.allocations.reduce((sum, row) => sum + row.hoursPerWeek, 0);
  const scheduled = plan.schedule.reduce((sum, row) => sum + row.hours, 0);
  assert.ok(plan.totalAvailableHours <= cap + 0.001, `total bounded for ${hours}`);
  assert.ok(allocated <= plan.totalAvailableHours + 0.11, `allocations bounded for ${hours}: ${allocated}`);
  assert.ok(scheduled <= plan.totalAvailableHours + 0.001, `schedule bounded for ${hours}`);
  assert.ok(plan.schedule.every((slot) => slot.hours > 0 && slot.hours <= 2), `valid slots for ${hours}`);
}

assert.equal(buildStudyPlan(profile(0), roi).schedule.length, 0);
assert.ok(buildStudyPlan(profile(5), roi).schedule.reduce((sum, slot) => sum + slot.hours, 0) <= 5);
assert.ok(buildStudyPlan(profile(0), []).allocations.length === 0);
assert.equal(
  buildStudyPlan(profile(5), roi, undefined, undefined, { completedSubjects: ["toan"] })
    .microGoals?.find((goal) => goal.subject === "toan")?.completed,
  true,
  "completed task progress reaches the rebuilt plan"
);
console.log("Study-plan constraint tests passed.");

/**
 * MÔ PHỎNG KỊCH BẢN (Scenario Simulator) — hàm thuần, deterministic.
 * Trả lời: "Nếu điểm môn X thay đổi / không có IELTS / ngân sách chỉ còn Y / chỉ học ở miền Z thì sao?"
 * So sánh cùng một tập chương trình trước và sau kịch bản; không có số mẫu.
 */

import {
  ExamScores,
  StudentProfile,
  TargetProgram,
  Role,
} from "@/engine/types";
import { buildCandidateOptions } from "@/engine/decision/optimizer";

export type ScenarioRegion = "all" | "bac" | "trung" | "nam";

export interface ScenarioInput {
  scoreDeltas: Partial<ExamScores>;
  /** null = không giới hạn ngân sách */
  budgetVnd: number | null;
  region: ScenarioRegion;
  /** Bỏ chứng chỉ IELTS khỏi hồ sơ (kịch bản "không đạt IELTS") */
  dropIelts: boolean;
}

export interface RoleCounts {
  reach: number;
  target: number;
  safe: number;
  total: number;
}

export interface ScenarioChange {
  programId: string;
  schoolCode: string;
  schoolName: string;
  majorName: string;
  fromRole: Role | null;
  toRole: Role | null;
  fromProb: number;
  toProb: number;
}

export interface ScenarioResult {
  baseScore: number;
  scenarioScore: number;
  before: RoleCounts;
  after: RoleCounts;
  improved: ScenarioChange[];
  worsened: ScenarioChange[];
  /** Số chương trình trong kịch bản chưa có học phí xác thực (không bị loại bởi bộ lọc ngân sách) */
  unknownTuitionCount: number;
}

export const EMPTY_SCENARIO: ScenarioInput = { scoreDeltas: {}, budgetVnd: null, region: "all", dropIelts: false };

const ROLE_RANK: Record<Role, number> = { mao_hiem: 1, vua_tam: 2, an_toan: 3 };

function countRoles(items: { role: Role }[]): RoleCounts {
  return {
    reach: items.filter((i) => i.role === "mao_hiem").length,
    target: items.filter((i) => i.role === "vua_tam").length,
    safe: items.filter((i) => i.role === "an_toan").length,
    total: items.length,
  };
}

export function applyScenarioToProfile(profile: StudentProfile, scenario: ScenarioInput): StudentProfile {
  const examScores: ExamScores = { ...profile.examScores };
  for (const [subject, delta] of Object.entries(scenario.scoreDeltas)) {
    const key = subject as keyof ExamScores;
    const base = examScores[key];
    if (base === null || base === undefined || !delta) continue; // không mô phỏng môn chưa có điểm
    examScores[key] = Math.min(10, Math.max(0, Number((base + delta).toFixed(2))));
  }
  return {
    ...profile,
    examScores,
    altScores: scenario.dropIelts ? { ...profile.altScores, ielts: null } : profile.altScores,
    annualBudgetVnd: scenario.budgetVnd ?? profile.annualBudgetVnd,
  };
}

export function runScenario(
  pool: TargetProgram[],
  profile: StudentProfile,
  scenario: ScenarioInput,
  compositeScore: (p: StudentProfile) => number
): ScenarioResult {
  const inScope = (c: { region?: string; tuitionVnd: number | null }) =>
    (scenario.region === "all" || c.region === scenario.region) &&
    (scenario.budgetVnd === null || !c.tuitionVnd || c.tuitionVnd <= scenario.budgetVnd);

  // "Trước" = hồ sơ hiện tại, không ràng buộc kịch bản; "Sau" = hồ sơ + ràng buộc kịch bản
  const baseProfile = { ...profile, annualBudgetVnd: null as unknown as number };
  const before = buildCandidateOptions(pool, baseProfile).filter((c) => c.userScore > 0);
  const scenarioProfile = applyScenarioToProfile(profile, scenario);
  const after = buildCandidateOptions(pool, { ...scenarioProfile, annualBudgetVnd: null as unknown as number })
    .filter((c) => c.userScore > 0)
    .filter(inScope);

  const beforeById = new Map(before.map((c) => [c.programId, c]));
  const afterById = new Map(after.map((c) => [c.programId, c]));

  const improved: ScenarioChange[] = [];
  const worsened: ScenarioChange[] = [];
  for (const a of after) {
    const b = beforeById.get(a.programId);
    const fromRank = b ? ROLE_RANK[b.role] : 0;
    if (ROLE_RANK[a.role] > fromRank) {
      improved.push({
        programId: a.programId,
        schoolCode: a.schoolCode,
        schoolName: a.schoolName,
        majorName: a.majorName,
        fromRole: b?.role ?? null,
        toRole: a.role,
        fromProb: b?.admitProbability ?? 0,
        toProb: a.admitProbability,
      });
    }
  }
  for (const b of before) {
    const a = afterById.get(b.programId);
    if (!a || ROLE_RANK[a.role] < ROLE_RANK[b.role]) {
      worsened.push({
        programId: b.programId,
        schoolCode: b.schoolCode,
        schoolName: b.schoolName,
        majorName: b.majorName,
        fromRole: b.role,
        toRole: a?.role ?? null,
        fromProb: b.admitProbability,
        toProb: a?.admitProbability ?? 0,
      });
    }
  }
  const byGain = (x: ScenarioChange, y: ScenarioChange) => Math.abs(y.toProb - y.fromProb) - Math.abs(x.toProb - x.fromProb);

  return {
    baseScore: compositeScore(profile),
    scenarioScore: compositeScore(scenarioProfile),
    before: countRoles(before),
    after: countRoles(after),
    improved: improved.sort(byGain),
    worsened: worsened.sort(byGain),
    unknownTuitionCount: scenario.budgetVnd === null ? 0 : after.filter((c) => !c.tuitionVnd).length,
  };
}

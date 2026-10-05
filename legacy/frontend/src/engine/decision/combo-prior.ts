import { TargetProgram } from "@/engine/types";
import { COMBINATION_SUBJECTS } from "@/data/universities/combinations";

/** Trọng số làm mượt: nhóm ngành ít chương trình thì nghiêng về tỷ lệ chung của cả nước. */
const SMOOTHING = 5;

export type ComboAcceptance = (majorGroup: string, combo: string) => number;

/**
 * Xác suất một chương trình nhận một tổ hợp, ước lượng từ các chương trình ĐÃ có tổ hợp xác thực cùng nhóm ngành
 * (tỷ lệ chương trình nhóm đó liệt kê tổ hợp, làm mượt về tỷ lệ chung). Dùng khi đề án không ghi tổ hợp của ngành:
 * thay vì giả định trường nhận tổ hợp tốt nhất của học sinh, nhân xác suất đỗ với xác suất trường nhận tổ hợp đó.
 */
export function comboAcceptancePrior(programs: TargetProgram[]): ComboAcceptance {
  const progByGroup = new Map<string, number>();
  const comboByGroup = new Map<string, Map<string, number>>();
  let total = 0;
  const overall = new Map<string, number>();
  for (const p of programs) {
    const meta = p as TargetProgram & { combinationsVerified?: boolean };
    if (!meta.combinationsVerified) continue;
    const combos = new Set((p.combinations ?? []).filter((c) => COMBINATION_SUBJECTS[c]));
    if (combos.size === 0) continue;
    const group = p.majorGroup || "other";
    total += 1;
    progByGroup.set(group, (progByGroup.get(group) ?? 0) + 1);
    const m = comboByGroup.get(group) ?? new Map<string, number>();
    for (const c of combos) {
      m.set(c, (m.get(c) ?? 0) + 1);
      overall.set(c, (overall.get(c) ?? 0) + 1);
    }
    comboByGroup.set(group, m);
  }
  return (majorGroup, combo) => {
    const overallRate = total > 0 ? (overall.get(combo) ?? 0) / total : 0.5;
    const group = majorGroup || "other";
    const n = progByGroup.get(group) ?? 0;
    const k = comboByGroup.get(group)?.get(combo) ?? 0;
    return (k + SMOOTHING * overallRate) / (n + SMOOTHING);
  };
}

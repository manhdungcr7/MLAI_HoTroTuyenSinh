import { ExamScores } from "@/engine/types";
import { COMBINATION_SUBJECTS } from "@/data/universities/combinations";

/** Tổ hợp có đủ điểm 3 môn và tổng cao nhất; null nếu chưa đủ môn cho tổ hợp nào. */
export function bestCombination(scores: ExamScores | undefined | null): string | null {
  if (!scores) return null;
  let best: { code: string; sum: number } | null = null;
  for (const [code, subs] of Object.entries(COMBINATION_SUBJECTS)) {
    const values = subs.map((s) => scores[s as keyof ExamScores]);
    if (values.some((v) => typeof v !== "number" || v <= 0)) continue;
    const sum = (values as number[]).reduce((a, b) => a + b, 0);
    if (!best || sum > best.sum) best = { code, sum };
  }
  return best?.code ?? null;
}

export function countEntered(scores: ExamScores | undefined | null): number {
  return Object.values(scores ?? {}).filter((v) => typeof v === "number").length;
}

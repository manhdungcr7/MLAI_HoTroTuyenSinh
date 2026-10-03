import { CandidateOption, StudentProfile } from "@/engine/types";
import { COMBINATION_SUBJECTS } from "@/data/universities/combinations";
import { filterByConstraints, UNLIMITED_BUDGET_VND } from "@/engine/decision/constraints";

export interface Notice {
  tone: "info" | "warn";
  text: string;
}

/** Thông báo quan trọng nhất theo hồ sơ (tối đa 2) hiển thị đầu trang kết quả. */
export function profileNotices(profile: StudentProfile): Notice[] {
  const notices: Notice[] = [];
  if (profile.award === "quoc_te" || profile.award === "quoc_gia") {
    notices.push({
      tone: "info",
      text: "Giải quốc gia, quốc tế: theo Quy chế tuyển sinh, bạn có thể được xét tuyển thẳng hoặc ưu tiên xét tuyển vào ngành phù hợp với môn đạt giải. Mỗi trường quy định riêng, hãy liên hệ trường để nộp hồ sơ.",
    });
  }
  if ((profile.graduationYear ?? 2027) >= 2026 && profile.minimumScoreException !== true) {
    const best = bestExamTotal(profile);
    if (best !== null && best < 15) {
      notices.push({
        tone: "warn",
        text: `Tổng 3 môn thi tốt nhất của bạn là ${best.toFixed(2)}, thấp hơn ngưỡng 15 điểm nên chưa được xét bằng điểm thi. Các ngành bên dưới xét theo học bạ hoặc phương thức khác.`,
      });
    }
  }
  return notices.slice(0, 2);
}

/** Tổng 3 môn thi cao nhất trong các tổ hợp đã đủ điểm; null nếu chưa đủ điểm tổ hợp nào. */
function bestExamTotal(profile: StudentProfile): number | null {
  const e = profile.examScores as Record<string, number | null | undefined> | undefined;
  if (!e) return null;
  let best: number | null = null;
  for (const subs of Object.values(COMBINATION_SUBJECTS)) {
    const values = subs.map((sub) => e[sub]);
    if (values.some((v) => typeof v !== "number")) continue;
    const sum = (values as number[]).reduce((x, y) => x + y, 0);
    if (best === null || sum > best) best = sum;
  }
  return best;
}

/** Lưu ý riêng cho từng ngành (hiển thị trên thẻ kết quả). */
export function cardNote(profile: StudentProfile, c: CandidateOption): string | null {
  if (c.majorGroup === "su_pham") {
    if (profile.conduct === "trung_binh" || profile.conduct === "yeu") return "Nhiều trường sư phạm yêu cầu hạnh kiểm khá trở lên";
    if (c.admissionMethod === "HOC_BA" && !profile.academicRank) return "Xét học bạ ngành sư phạm cần học lực lớp 12 giỏi";
  }
  return null;
}

export interface Relaxation {
  key: "region" | "budget" | "interest";
  label: string;
  count: number;
  apply: Partial<StudentProfile>;
}

/** Khi không có kết quả: điều kiện nào nới ra thì có ngành, kèm số ngành tìm được. */
export function relaxations(candidates: CandidateOption[], profile: StudentProfile): Relaxation[] {
  const out: Relaxation[] = [];
  const tries: Relaxation[] = [];
  if (profile.relocationWillingness !== "khong_gioi_han") {
    tries.push({ key: "region", label: "Học ở cả nước", count: 0, apply: { relocationWillingness: "khong_gioi_han" } });
  }
  if (profile.annualBudgetVnd > 0 && profile.annualBudgetVnd < UNLIMITED_BUDGET_VND) {
    tries.push({ key: "budget", label: "Không giới hạn học phí", count: 0, apply: { annualBudgetVnd: UNLIMITED_BUDGET_VND } });
  }
  if ((profile.interestMajorGroups ?? []).length > 0 || (profile.interestMajorNames ?? []).length > 0 || (profile.preferredSchoolCodes ?? []).length > 0) {
    tries.push({ key: "interest", label: "Xem mọi ngành", count: 0, apply: { interestMajorGroups: [], interestMajorNames: [], preferredSchoolCodes: [] } });
  }
  for (const t of tries) {
    const count = filterByConstraints(candidates, { ...profile, ...t.apply }).length;
    if (count > 0) out.push({ ...t, count });
  }
  return out;
}

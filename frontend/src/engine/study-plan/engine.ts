import {
  StudentProfile,
  TargetProgram,
  SubjectRoiMetric,
  StudyPlan,
  SubjectAllocation,
  StudyPlanSlot,
  TimeDeduction,
  WeeklyMicroGoal,
} from "@/engine/types";

const WEEK_HOURS = 168;
const DAYS: StudyPlanSlot["dayOfWeek"][] = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

function finiteNonNegative(value: number | undefined, fallback: number): number {
  return Number.isFinite(value) ? Math.max(0, value as number) : fallback;
}

export function buildStudyPlan(
  profile: StudentProfile,
  roiList: SubjectRoiMetric[],
  target?: TargetProgram,
  customDeduction?: Partial<TimeDeduction>,
  progress?: { completedSubjects?: readonly string[] }
): StudyPlan {
  const defaults: TimeDeduction = {
    totalWeeklyHours: WEEK_HOURS,
    sleepHours: 52.5,
    schoolHours: 30,
    extraClassesHours: 12,
    livingHours: 21,
    availableHours: 52.5,
  };
  const deduction = { ...defaults, ...customDeduction };
  deduction.totalWeeklyHours = WEEK_HOURS;
  const deducted = ["sleepHours", "schoolHours", "extraClassesHours", "livingHours"] as const;
  for (const key of deducted) deduction[key] = finiteNonNegative(deduction[key], defaults[key]);
  const calculatedAvailable = Math.max(0, WEEK_HOURS - deducted.reduce((sum, key) => sum + deduction[key], 0));
  const requestedHours = finiteNonNegative(profile.availableHoursPerWeek, calculatedAvailable);
  const totalHours = Math.min(WEEK_HOURS, requestedHours);
  deduction.availableHours = totalHours;

  const subjects = roiList.filter((item) => item.subject && Number.isFinite(item.netRoi));
  const weighted = subjects.map((item) => {
    const current = Math.min(10, Math.max(0, finiteNonNegative(profile.examScores[item.subject] ?? undefined, 7)));
    const targetScore = target
      ? Math.min(10, Math.max(current, Math.round((target.forecastP50 / 3) * 10) / 10))
      : Math.min(10, current + 0.8);
    const gap = Math.max(0, Math.round((targetScore - current) * 10) / 10);
    const kappa = item.subject === "van" ? 0.7 : item.subject === "anh" ? 1.1 : 1;
    const feasibility = Math.min(1, Math.max(0.15, (1 / (1 + Math.exp(0.85 * (current - 7.5)))) * kappa));
    const roi = Math.max(0, item.netRoi);
    return { item, current, targetScore, gap, feasibility, weight: roi * gap * feasibility };
  });

  const reserve = Math.min(totalHours, Math.round(totalHours * 0.1 * 10) / 10);
  const studyHours = totalHours - reserve;
  const weightTotal = weighted.reduce((sum, item) => sum + item.weight, 0);
  let distributed = 0;
  const allocations: SubjectAllocation[] = weighted.map((row, index) => {
    const rawHours = index === weighted.length - 1
      ? Math.max(0, studyHours - distributed)
      : weightTotal > 0 ? studyHours * row.weight / weightTotal : studyHours / Math.max(1, weighted.length);
    const hours = Math.floor((rawHours + 1e-8) * 10) / 10;
    distributed += hours;
    const statusBadge: SubjectAllocation["statusBadge"] = row.gap >= 0.4 && row.weight > 0
      ? "bottleneck"
      : row.current >= 8.8 || row.gap <= 0.25 ? "safe" : "maintain";
    return {
      subject: row.item.subject,
      subjectVi: row.item.subjectVi,
      hoursPerWeek: Math.round(hours * 10) / 10,
      percentage: totalHours > 0 ? Math.round((hours / totalHours) * 100) : 0,
      tier: row.item.tier,
      priorityReasonVi: row.item.explanationVi,
      roiScore: Math.round(row.item.netRoi * 100) / 100,
      currentScore: row.current,
      targetScore: row.targetScore,
      gap: row.gap,
      feasibility: Math.round(row.feasibility * 100),
      statusBadge,
    };
  });

  if (reserve > 0) {
    allocations.push({
      subject: "buffer_review",
      subjectVi: "Ôn tập linh hoạt",
      hoursPerWeek: reserve,
      percentage: totalHours > 0 ? Math.round((reserve / totalHours) * 100) : 0,
      tier: 3,
      priorityReasonVi: "Thời gian dự phòng để ôn tập hoặc bù lịch bị gián đoạn.",
      roiScore: 0,
      currentScore: 0,
      targetScore: 0,
      gap: 0,
      feasibility: 100,
      statusBadge: "maintain",
    });
  }

  const ranked = [...allocations].filter((item) => item.subject !== "buffer_review").sort((a, b) => b.hoursPerWeek - a.hoursPerWeek);
  const completedSubjects = new Set((progress?.completedSubjects ?? []).map((subject) => subject.toLowerCase()));
  let remainingScheduleHours = Math.min(
    14,
    ranked.reduce((sum, item) => sum + item.hoursPerWeek, 0)
  );
  const schedule: StudyPlanSlot[] = DAYS.flatMap((day, index) => {
    if (remainingScheduleHours <= 0) return [];
    const hours = Math.min(2, remainingScheduleHours);
    remainingScheduleHours = Math.round((remainingScheduleHours - hours) * 10) / 10;
    const subject = ranked[index % Math.max(1, ranked.length)];
    return [{
      id: `slot-${day.toLowerCase()}`,
      dayOfWeek: day,
      timeBlock: index === 5 || index === 6 ? "Sáng (08:00 - 10:00)" : "Tối (19:30 - 21:30)",
      subject: subject?.subject ?? "buffer_review",
      subjectVi: subject?.subjectVi ?? "Ôn tập linh hoạt",
      hours,
      sessionType: index % 3 === 2 ? "Review & Lỗi sai" : "Deep Work",
      weeklyGoalVi: `Học ${subject?.subjectVi ?? "theo kế hoạch"} trong ${hours} giờ; ghi lại kết quả thực tế.`,
    }];
  });

  const getSubjectStudyTopic = (subject: string, score: number): string => {
    switch (subject) {
      case "toan":
        return score < 8.0
          ? "Củng cố chắc kiến thức 7-8 điểm (Hàm số, Oxyz, Hình không gian)"
          : "Chinh phục câu hỏi vận dụng cao 8.5+ (Cực trị hàm hợp, Tích phân)";
      case "ly":
        return score < 8.0
          ? "Làm chủ lý thuyết & dạng bài cốt lõi (Dao động cơ, Sóng cơ, Điện xoay chiều)"
          : "Luyện đề chuẩn cấu trúc & bẫy câu hỏi phân hóa 8.5+";
      case "hoa":
        return score < 8.0
          ? "Củng cố phương pháp giải nhanh Hóa vô cơ & Este - Lipit"
          : "Xử lý bài toán đồ thị & chuỗi phản ứng hữu cơ điểm 9+";
      case "anh":
        return score < 8.0
          ? "Nắm vững 12 chủ điểm ngữ pháp trọng tâm & từ vựng SGK"
          : "Rèn phản xạ bài đọc hiểu (Reading) & dạng bài tìm lỗi sai";
      case "van":
        return "Rèn kỹ năng lập dàn ý Nghị luận văn học & Nghị luận xã hội 200 chữ";
      case "sinh":
        return "Quy luật di truyền & Di truyền học quần thể";
      case "su":
        return "Lịch sử Việt Nam (1919 - 1975) & các mốc sự kiện trọng điểm";
      case "dia":
        return "Kỹ năng khai thác Atlat & đặc điểm các vùng kinh tế";
      case "ktpl":
        return "Hệ thống quy phạm pháp luật & bài tập tình huống thực tiễn";
      default:
        return `Ôn tập chuyên đề trọng tâm môn ${subject}`;
    }
  };

  const microGoals: WeeklyMicroGoal[] = ranked.slice(0, 3).map((item) => ({
    id: `goal-${item.subject}`,
    subject: item.subject,
    subjectVi: item.subjectVi,
    topic: getSubjectStudyTopic(item.subject, item.currentScore ?? 7.0),
    targetMetric: `Dành ${item.hoursPerWeek}h ôn luyện & giải 1 đề kiểm tra`,
    estimatedGain: (item.gap ?? 0) > 0 ? `+${(item.gap ?? 0).toFixed(1)}đ` : "Duy trì",
    allocatedBlocks: Math.max(0, Math.round(item.hoursPerWeek / 2)),
    completed: completedSubjects.has(item.subject.toLowerCase()),
  }));

  return {
    totalAvailableHours: totalHours,
    allocations,
    schedule,
    lastUpdated: new Date().toLocaleDateString("vi-VN"),
    convergenceVelocityNote: `Kế hoạch dựa trên ${totalHours} giờ tự học khả dụng mỗi tuần; tiến bộ cần được đánh giá từ kết quả luyện tập thực tế.`,
    timeDeduction: deduction,
    microGoals,
  };
}

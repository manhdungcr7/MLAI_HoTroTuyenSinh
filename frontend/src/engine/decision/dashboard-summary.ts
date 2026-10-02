/**
 * Tóm tắt quyết định cho trang Tổng quan. Trả lời 4 câu hỏi:
 *  1. Hồ sơ hiện tại của tôi thế nào?
 *  2. Tôi có những cơ hội nào?
 *  3. Rủi ro lớn nhất là gì?
 *  4. Việc quan trọng nhất nên làm tiếp theo?
 * Hàm thuần (không React) để kiểm thử được; mọi con số lấy từ engine, không có giá trị mặc định giả.
 */

import {
  CandidateOption,
  StudentProfile,
  TargetProgram,
  WishlistItem,
  SubjectRoiMetric,
} from "@/engine/types";
import { assessPortfolio, PortfolioAssessment } from "@/engine/decision/portfolio-assessment";
import { calculateWishlistFailAll } from "@/engine/decision/optimizer";

export interface NextAction {
  label: string;
  href: string;
  reason: string;
}

export interface DashboardSummary {
  hasScores: boolean;
  compositeScore: number;
  combination: string;
  counts: { reach: number; target: number; safe: number; total: number };
  headlineVi: string;
  opportunities: CandidateOption[];
  risks: string[];
  missingInfo: { label: string; href: string }[];
  portfolio: PortfolioAssessment & { source: "saved" | "suggested" | "none"; size: number };
  nextAction: NextAction;
  topSubject: SubjectRoiMetric | null;
}

interface DashboardInput {
  profile: StudentProfile;
  target: TargetProgram | null;
  compositeScore: number;
  targetGap: number | null;
  candidates: CandidateOption[];
  savedWishlist: WishlistItem[];
  suggestedWishlist: WishlistItem[];
  subjectRoiList: SubjectRoiMetric[];
}

function pickOpportunities(candidates: CandidateOption[], preferredGroup?: string): CandidateOption[] {
  // Mỗi nhóm lấy lựa chọn tốt nhất: ưu tiên đúng nhóm ngành mục tiêu, sau đó khả năng đỗ
  const rank = (a: CandidateOption, b: CandidateOption) =>
    Number(b.majorGroup === preferredGroup) - Number(a.majorGroup === preferredGroup) ||
    b.admitProbability - a.admitProbability;
  const byRole = (role: CandidateOption["role"]) => candidates.filter((c) => c.role === role).sort(rank)[0];
  return [byRole("vua_tam"), byRole("an_toan"), byRole("mao_hiem")].filter((c): c is CandidateOption => Boolean(c));
}

export function buildDashboardSummary(input: DashboardInput): DashboardSummary {
  const { profile, target, compositeScore, targetGap, candidates, savedWishlist, suggestedWishlist, subjectRoiList } =
    input;
  const hasScores = compositeScore > 0 || candidates.length > 0;
  const counts = {
    reach: candidates.filter((c) => c.role === "mao_hiem").length,
    target: candidates.filter((c) => c.role === "vua_tam").length,
    safe: candidates.filter((c) => c.role === "an_toan").length,
    total: candidates.length,
  };

  const missingInfo: DashboardSummary["missingInfo"] = [];
  if (!hasScores) missingInfo.push({ label: "Điểm 3 môn của một tổ hợp", href: "/profile" });
  if (!target) missingInfo.push({ label: "Ngành mục tiêu", href: "/profile/goal" });
  if (!profile.annualBudgetVnd) missingInfo.push({ label: "Ngân sách học phí mỗi năm", href: "/profile" });
  if (!profile.homeProvince) missingInfo.push({ label: "Tỉnh/thành đang sống", href: "/profile" });

  const portfolioItems = savedWishlist.length > 0 ? savedWishlist : suggestedWishlist;
  const source: DashboardSummary["portfolio"]["source"] =
    savedWishlist.length > 0 ? "saved" : suggestedWishlist.length > 0 ? "suggested" : "none";
  const pFail = portfolioItems.length > 0 ? calculateWishlistFailAll(portfolioItems) : 1;
  const assessment = assessPortfolio(
    {
      reach: portfolioItems.filter((w) => w.role === "mao_hiem").length,
      target: portfolioItems.filter((w) => w.role === "vua_tam").length,
      safe: portfolioItems.filter((w) => w.role === "an_toan").length,
    },
    pFail
  );

  const risks: string[] = [];
  if (hasScores && counts.safe === 0) {
    risks.push("Chưa có ngành nào ở nhóm An toàn với điểm hiện tại — cần mở rộng lựa chọn (ngành, khu vực hoặc tổ hợp).");
  }
  if (source !== "none" && assessment.level !== "ok") risks.push(assessment.messageVi);
  if (target && targetGap !== null && targetGap < 0) {
    risks.push(
      `Ngành mục tiêu (${target.schoolCode}) đang cao hơn điểm của bạn ${Math.abs(targetGap).toFixed(1)} điểm — nên xem là nguyện vọng Thử sức.`
    );
  }
  const singleYear = candidates.filter((c) => c.role !== "mao_hiem" && (c.yearsOfData ?? 0) <= 1).length;
  if (singleYear > 0 && counts.target + counts.safe > 0) {
    risks.push(`${singleYear} lựa chọn Phù hợp/An toàn chỉ có 1 năm điểm chuẩn — kết quả kém chắc chắn hơn.`);
  }

  let nextAction: NextAction;
  if (!hasScores) {
    nextAction = { label: "Nhập điểm", href: "/profile", reason: "Cần điểm 3 môn để so sánh với điểm chuẩn." };
  } else if (!target) {
    nextAction = {
      label: "Chọn ngành mục tiêu",
      href: "/profile/goal",
      reason: "Có mục tiêu thì hệ thống mới tính được khoảng cách và môn nên ưu tiên.",
    };
  } else if (source !== "saved") {
    nextAction = {
      label: "Xem danh sách nguyện vọng gợi ý",
      href: "/portfolio",
      reason: "Bạn chưa lưu danh sách nguyện vọng nào.",
    };
  } else if (assessment.level === "high" || assessment.level === "medium") {
    nextAction = { label: "Thêm lựa chọn An toàn", href: "/options", reason: assessment.messageVi };
  } else if (!profile.annualBudgetVnd) {
    nextAction = { label: "Nhập ngân sách", href: "/profile", reason: "Để loại các ngành vượt khả năng chi trả." };
  } else {
    nextAction = {
      label: "Thử kịch bản thay đổi điểm",
      href: "/analysis/simulation",
      reason: "Xem danh sách thay đổi thế nào nếu điểm thi thật cao hoặc thấp hơn.",
    };
  }

  const headlineVi = !hasScores
    ? "Nhập điểm để xem những ngành bạn có thể cân nhắc."
    : `Với điểm hiện tại, bạn có ${counts.target} lựa chọn Phù hợp và ${counts.safe} lựa chọn An toàn (trong ${counts.total} chương trình có dữ liệu cho tổ hợp của bạn).`;

  // Chỉ gợi ý môn ưu tiên khi các môn thực sự khác nhau
  const top = subjectRoiList[0] ?? null;
  const differentiated =
    top !== null && subjectRoiList.some((r) => r.netRoi !== top.netRoi || r.unlockedOptionsCount !== top.unlockedOptionsCount);

  return {
    hasScores,
    compositeScore,
    combination: profile.activeCombination,
    counts,
    headlineVi,
    opportunities: pickOpportunities(candidates, target?.majorGroup ?? profile.interestMajorGroups?.[0]),
    risks: risks.slice(0, 3),
    missingInfo,
    portfolio: { ...assessment, source, size: portfolioItems.length },
    nextAction,
    topSubject: differentiated ? top : null,
  };
}

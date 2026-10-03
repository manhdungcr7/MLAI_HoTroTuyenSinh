import { CandidateOption, StudentProfile } from "@/engine/types";
import { VIETNAM_PROVINCES } from "@/engine/geo/distance";

export const UNLIMITED_BUDGET_VND = 200_000_000;

export function regionOfProvince(province: string | null | undefined): "bac" | "trung" | "nam" | null {
  if (!province) return null;
  return VIETNAM_PROVINCES[province]?.region ?? null;
}

/**
 * Ràng buộc học sinh đã khai trong hồ sơ: vùng/tỉnh học, học phí tối đa, nhóm ngành quan tâm.
 * Dùng chung cho trang Tìm ngành, Khám phá và Xếp nguyện vọng để mọi màn hình cho cùng một danh sách.
 * Chương trình chưa có số liệu học phí không bị loại (thẻ ghi rõ "chưa có dữ liệu").
 */
export function matchesConstraints(c: CandidateOption, profile: StudentProfile): boolean {
  const home = profile.homeProvince;
  if (profile.relocationWillingness === "chi_tinh_nha" && home && c.province !== home) return false;
  if (profile.relocationWillingness === "trong_vung" && home) {
    const region = regionOfProvince(home);
    if (region && c.region !== region) return false;
  }
  const budget = profile.annualBudgetVnd;
  if (budget > 0 && budget < UNLIMITED_BUDGET_VND && c.tuitionVnd && c.tuitionVnd > budget) return false;
  const interest = profile.interestMajorGroups ?? [];
  if (interest.length > 0 && !interest.includes(c.majorGroup)) return false;
  return true;
}

export function filterByConstraints(list: CandidateOption[], profile: StudentProfile): CandidateOption[] {
  return list.filter((c) => matchesConstraints(c, profile));
}

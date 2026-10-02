import React from "react";
import { FileText, ChevronDown } from "lucide-react";
import { useDecision } from "@/state/DecisionContext";
import { MAJOR_GROUPS, RelocationWillingness } from "@/engine/types";

const SELECT_CLASS =
  "w-full min-h-[44px] appearance-none rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 pr-9 text-sm font-semibold text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition cursor-pointer";

const BUDGET_OPTIONS = [20, 30, 40, 50, 60, 80, 100];
const UNLIMITED_BUDGET_VND = 200_000_000;

/**
 * Bối cảnh & ràng buộc — mọi ô đều được lưu vào hồ sơ và ảnh hưởng tới gợi ý.
 * Khi chưa chọn, hiển thị "Chưa chọn" thay vì một giá trị mặc định trông như đã nhập.
 */
export function ConstraintsCard() {
  const { profile, updateProfile } = useDecision();
  const budgetMillion = profile.annualBudgetVnd ? Math.round(profile.annualBudgetVnd / 1_000_000) : null;
  const budgetValue = budgetMillion === null ? "" : budgetMillion >= 150 ? "0" : String(budgetMillion);
  const interest = profile.interestMajorGroups?.[0] ?? "";

  const setBudget = (million: number) =>
    updateProfile({ annualBudgetVnd: million === 0 ? UNLIMITED_BUDGET_VND : million * 1_000_000 });

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <FileText className="h-5 w-5 stroke-[2.2]" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Bối cảnh & ràng buộc</h3>
            <p className="text-xs text-slate-500">Dùng để lọc và xếp hạng các lựa chọn cho bạn</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="budget-select" className="block text-xs font-semibold text-slate-700 mb-1">
              Học phí tối đa mỗi năm
            </label>
            <div className="relative">
              <select
                id="budget-select"
                value={budgetValue}
                onChange={(e) => e.target.value !== "" && setBudget(parseInt(e.target.value, 10))}
                className={SELECT_CLASS}
              >
                <option value="" disabled>
                  Chưa chọn
                </option>
                {BUDGET_OPTIONS.map((m) => (
                  <option key={m} value={m}>
                    {m} triệu/năm
                  </option>
                ))}
                <option value="0">Không giới hạn</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" aria-hidden="true" />
            </div>
            <p className="mt-1 text-[11px] text-slate-500">Ngành chưa có học phí xác thực vẫn được hiển thị, kèm nhãn &quot;Chưa có dữ liệu&quot;.</p>
          </div>

          <div>
            <label htmlFor="relocation-select" className="block text-xs font-semibold text-slate-700 mb-1">
              Có thể học xa nhà không?
            </label>
            <div className="relative">
              <select
                id="relocation-select"
                value={profile.relocationWillingness || "khong_gioi_han"}
                onChange={(e) => updateProfile({ relocationWillingness: e.target.value as RelocationWillingness })}
                className={SELECT_CLASS}
              >
                <option value="chi_tinh_nha">Chỉ học tại tỉnh/thành đang sống</option>
                <option value="trong_vung">Trong cùng miền</option>
                <option value="khong_gioi_han">Đi đâu cũng được</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" aria-hidden="true" />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="interest-select" className="block text-xs font-semibold text-slate-700 mb-1">
              Nhóm ngành bạn quan tâm
            </label>
            <div className="relative">
              <select
                id="interest-select"
                value={interest}
                onChange={(e) => updateProfile({ interestMajorGroups: e.target.value ? [e.target.value] : [] })}
                className={SELECT_CLASS}
              >
                <option value="">Chưa biết — gợi ý giúp mình</option>
                {MAJOR_GROUPS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConstraintsCard;

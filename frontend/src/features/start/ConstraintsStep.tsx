import React, { useState } from "react";
import { MapPin, Wallet, ShieldCheck, Star } from "lucide-react";
import { MAJOR_GROUPS, PROVINCES, PriorityArea, PriorityObject, RelocationWillingness, StudentProfile } from "@/engine/types";
import { UNLIMITED_BUDGET_VND } from "@/engine/decision/constraints";

const BUDGETS = [20, 30, 40, 50, 60, 80, 100];
const AREAS: { value: PriorityArea; label: string }[] = [
  { value: "KV3", label: "KV3 – không có ưu tiên" },
  { value: "KV2", label: "KV2 – cộng 0,25 điểm" },
  { value: "KV2-NT", label: "KV2-NT – cộng 0,5 điểm" },
  { value: "KV1", label: "KV1 – cộng 0,75 điểm" },
];
const OBJECTS: { value: PriorityObject; label: string }[] = [
  { value: "none", label: "Không thuộc diện ưu tiên" },
  { value: "uu_tien_1", label: "Nhóm ưu tiên 1 – cộng 2 điểm" },
  { value: "uu_tien_2", label: "Nhóm ưu tiên 2 – cộng 1 điểm" },
];
const FIELD =
  "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100";

interface Props {
  profile: StudentProfile;
  onChange: (updates: Partial<StudentProfile>) => void;
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <h3 className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
        {icon}
        {title}
      </h3>
      {children}
    </section>
  );
}

export function ConstraintsStep({ profile, onChange }: Props) {
  const [showAll, setShowAll] = useState(false);
  const interest = profile.interestMajorGroups ?? [];
  const toggle = (v: string) =>
    onChange({ interestMajorGroups: interest.includes(v) ? interest.filter((x) => x !== v) : [...interest, v] });
  const budgetValue = profile.annualBudgetVnd
    ? profile.annualBudgetVnd >= UNLIMITED_BUDGET_VND
      ? "0"
      : String(Math.round(profile.annualBudgetVnd / 1_000_000))
    : "";

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-black text-slate-900">Điều kiện của em</h2>
        <p className="mt-1 text-sm text-slate-600">
          Càng rõ, danh sách càng gọn và đúng ý. Điều kiện nào chưa biết em có thể bỏ trống.
        </p>
      </div>

      <Section icon={<MapPin className="h-4 w-4 text-blue-600" />} title="Nơi học">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-bold text-slate-700">
            Tỉnh / thành phố em ở
            <select value={profile.homeProvince || ""} onChange={(e) => onChange({ homeProvince: e.target.value })} className={FIELD}>
              <option value="">Chưa chọn</option>
              {PROVINCES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-bold text-slate-700">
            Em muốn học ở đâu?
            <select
              value={profile.relocationWillingness}
              onChange={(e) => onChange({ relocationWillingness: e.target.value as RelocationWillingness })}
              className={FIELD}
            >
              <option value="khong_gioi_han">Cả nước</option>
              <option value="trong_vung">Trong vùng miền em ở</option>
              <option value="chi_tinh_nha">Chỉ ở tỉnh nhà</option>
            </select>
          </label>
        </div>
        {profile.relocationWillingness !== "khong_gioi_han" && !profile.homeProvince && (
          <p className="text-xs font-semibold text-amber-700">Chọn tỉnh nhà để áp dụng điều kiện nơi học.</p>
        )}
      </Section>

      <Section icon={<Wallet className="h-4 w-4 text-blue-600" />} title="Học phí">
        <label className="block max-w-sm text-xs font-bold text-slate-700">
          Học phí tối đa mỗi năm
          <select
            value={budgetValue}
            onChange={(e) => {
              if (e.target.value === "") return onChange({ annualBudgetVnd: 0 });
              const m = Number(e.target.value);
              onChange({ annualBudgetVnd: m === 0 ? UNLIMITED_BUDGET_VND : m * 1_000_000 });
            }}
            className={FIELD}
          >
            <option value="">Chưa chọn (không lọc)</option>
            {BUDGETS.map((m) => (
              <option key={m} value={m}>
                Tối đa {m} triệu / năm
              </option>
            ))}
            <option value="0">Không giới hạn</option>
          </select>
          <span className="mt-1 block font-normal text-slate-500">
            Ngành chưa có số liệu học phí vẫn được giữ lại và ghi rõ trên thẻ.
          </span>
        </label>
      </Section>

      <Section icon={<ShieldCheck className="h-4 w-4 text-blue-600" />} title="Điểm ưu tiên">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-bold text-slate-700">
            Khu vực ưu tiên
            <select
              value={profile.priority?.area ?? "KV3"}
              onChange={(e) => onChange({ priority: { area: e.target.value as PriorityArea, object: profile.priority?.object ?? "none" } })}
              className={FIELD}
            >
              {AREAS.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-bold text-slate-700">
            Đối tượng ưu tiên
            <select
              value={profile.priority?.object ?? "none"}
              onChange={(e) => onChange({ priority: { area: profile.priority?.area ?? "KV3", object: e.target.value as PriorityObject } })}
              className={FIELD}
            >
              {OBJECTS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="text-[11px] text-slate-500">
          Điểm ưu tiên được cộng theo quy chế và giảm dần khi tổng điểm từ 22,5 trở lên, tối đa 3 điểm.
        </p>
      </Section>

      <Section icon={<Star className="h-4 w-4 text-blue-600" />} title="Nhóm ngành em quan tâm">
        <div className="flex flex-wrap gap-2">
          {(showAll ? MAJOR_GROUPS : MAJOR_GROUPS.slice(0, 8)).map((g) => {
            const on = interest.includes(g.value);
            return (
              <button
                key={g.value}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(g.value)}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                  on
                    ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50"
                }`}
              >
                {g.label}
              </button>
            );
          })}
          {!showAll && (
            <button type="button" onClick={() => setShowAll(true)} className="rounded-full px-3 py-1.5 text-xs font-bold text-blue-700 underline cursor-pointer">
              Xem thêm
            </button>
          )}
        </div>
        <p className="text-[11px] text-slate-500">
          {interest.length === 0 ? "Chưa chọn nhóm nào: hệ thống hiển thị tất cả các ngành." : `Đang lọc ${interest.length} nhóm ngành.`}
        </p>
      </Section>
    </div>
  );
}

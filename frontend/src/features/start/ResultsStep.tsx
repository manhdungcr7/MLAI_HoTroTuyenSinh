import React, { useMemo, useState } from "react";
import Link from "@/components/navigation/HashLink";
import { ArrowRight } from "lucide-react";
import { CandidateOption, WishlistItem } from "@/engine/types";
import { ResultCard } from "@/features/start/ResultCard";

type Tab = "all" | "an_toan" | "vua_tam" | "mao_hiem";
const PAGE = 12;

const TABS: { key: Tab; label: string; on: string }[] = [
  { key: "all", label: "Tất cả", on: "bg-slate-900 text-white border-slate-900" },
  { key: "an_toan", label: "Chắc đỗ", on: "bg-emerald-600 text-white border-emerald-600" },
  { key: "vua_tam", label: "Vừa tầm", on: "bg-blue-600 text-white border-blue-600" },
  { key: "mao_hiem", label: "Thử sức", on: "bg-amber-500 text-white border-amber-500" },
];

interface Props {
  matched: CandidateOption[];
  totalComputable: number;
  wishlist: WishlistItem[];
  onToggle: (c: CandidateOption) => void;
  onEditConstraints: () => void;
}

export function ResultsStep({ matched, totalComputable, wishlist, onToggle, onEditConstraints }: Props) {
  const [tab, setTab] = useState<Tab>("all");
  const [shown, setShown] = useState(PAGE);

  const counts = useMemo(
    () => ({
      all: matched.length,
      an_toan: matched.filter((c) => c.role === "an_toan").length,
      vua_tam: matched.filter((c) => c.role === "vua_tam").length,
      mao_hiem: matched.filter((c) => c.role === "mao_hiem").length,
    }),
    [matched],
  );

  const ranked = useMemo(() => {
    const list = tab === "all" ? matched : matched.filter((c) => c.role === tab);
    // Xếp theo xác suất (làm tròn 1%); cùng mức thì ngành điểm chuẩn cao hơn trước.
    return [...list].sort(
      (a, b) => Math.round(b.admitProbability * 100) - Math.round(a.admitProbability * 100) || b.cutoffP50 - a.cutoffP50,
    );
  }, [matched, tab]);

  const rankById = useMemo(() => new Map(wishlist.map((w) => [w.program_id, w.rank])), [wishlist]);

  if (matched.length === 0) {
    return (
      <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        <p className="font-extrabold">Chưa có ngành nào thỏa tất cả điều kiện của em.</p>
        <p>
          Hệ thống tính được {totalComputable} ngành từ điểm của em, nhưng điều kiện nơi học, học phí hoặc nhóm ngành đã loại hết. Hãy nới điều kiện.
        </p>
        <button type="button" onClick={onEditConstraints} className="rounded-lg bg-amber-600 px-3.5 py-2 text-xs font-black text-white hover:bg-amber-700 cursor-pointer">
          Sửa điều kiện
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-xl font-black text-slate-900">{counts.all} ngành phù hợp với em</h2>
          <p className="text-sm text-slate-600">Xếp theo xác suất đỗ, theo phương thức có lợi nhất cho em ở từng ngành.</p>
        </div>
        <button type="button" onClick={onEditConstraints} className="text-xs font-bold text-blue-700 underline cursor-pointer">
          Sửa điều kiện
        </button>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Nhóm khả năng đỗ">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => {
              setTab(t.key);
              setShown(PAGE);
            }}
            className={`rounded-full border px-4 py-1.5 text-xs font-bold transition cursor-pointer ${
              tab === t.key ? t.on : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {t.label} <span className="opacity-70">{counts[t.key]}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {ranked.slice(0, shown).map((c) => (
          <ResultCard key={c.programId} c={c} rankInWishlist={rankById.get(c.programId) ?? null} onToggle={onToggle} />
        ))}
      </div>

      {shown < ranked.length && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setShown((n) => n + PAGE)}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            Xem thêm ({ranked.length - shown} ngành)
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-4">
        <Link href="/options" className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-700 underline">
          Lọc chi tiết và so sánh trong Khám phá <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <p className="text-[11px] leading-relaxed text-slate-500">
        Xác suất là ước lượng thống kê từ điểm chuẩn các năm trước, không phải cam kết. Hãy đối chiếu đề án tuyển sinh chính thức của trường
        (phương thức, tổ hợp, điểm cộng) trước khi nộp nguyện vọng.
      </p>
    </div>
  );
}

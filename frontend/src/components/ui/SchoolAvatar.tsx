import React from "react";

interface SchoolAvatarProps {
  schoolCode?: string;
  schoolName?: string;
  size?: "sm" | "md" | "lg";
}

const SCHOOL_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  BKA: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  KHA: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  NEU: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  DHK: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  FTU: { bg: "bg-rose-50", text: "text-rose-800", border: "border-rose-200" },
  NTH: { bg: "bg-rose-50", text: "text-rose-800", border: "border-rose-200" },
  TMU: { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200" },
  D64: { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200" },
  HTC: { bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200" },
  NHH: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  D61: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  QHI: { bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200" },
  QHQ: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  QHL: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
  QST: { bg: "bg-cyan-50", text: "text-cyan-800", border: "border-cyan-200" },
  QSX: { bg: "bg-purple-50", text: "text-purple-800", border: "border-purple-200" },
  DCN: { bg: "bg-orange-50", text: "text-orange-800", border: "border-orange-200" },
  HCN: { bg: "bg-orange-50", text: "text-orange-800", border: "border-orange-200" },
};

export function SchoolAvatar({
  schoolCode = "DH",
  schoolName = "",
  size = "md",
}: SchoolAvatarProps) {
  const code = (schoolCode || "DH").toUpperCase();
  const colors = SCHOOL_COLORS[code] || {
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200",
  };

  const sizeClasses =
    size === "sm"
      ? "w-8 h-8 text-[11px]"
      : size === "lg"
      ? "w-12 h-12 text-sm"
      : "w-10 h-10 text-xs";

  // Monogram code: 3-4 letters
  const label = code.length <= 4 ? code : code.slice(0, 3);

  return (
    <div
      className={`rounded-full border flex items-center justify-center font-black shrink-0 select-none shadow-2xs ${sizeClasses} ${colors.bg} ${colors.text} ${colors.border}`}
      title={schoolName || schoolCode}
    >
      {label}
    </div>
  );
}

export default SchoolAvatar;

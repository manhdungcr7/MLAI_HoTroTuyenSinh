import React, { useState } from "react";
import { ArrowRight, BarChart3, ListChecks, Target } from "lucide-react";
import { Wizard } from "@/features/start/Wizard";
import { useApp } from "@/state/AppContext";
import { countEntered } from "@/engine/scoring/combo";

const POINTS = [
  { icon: Target, title: "Nhập điểm của bạn", body: "Điểm thi, học bạ, chứng chỉ. Mất khoảng 2 phút." },
  { icon: BarChart3, title: "Xem khả năng đỗ từng ngành", body: "Mỗi ngành của mỗi trường có một tỷ lệ phần trăm, tính theo cách xét riêng của trường." },
  { icon: ListChecks, title: "Xếp nguyện vọng an toàn", body: "Danh sách có ngành chắc đỗ, vừa tầm và thử sức." },
];

function Welcome({ onStart }: { onStart: () => void }) {
  return (
    <div className="space-y-8 pt-2">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">Biết trước bạn có thể đỗ ngành nào</h1>
        <p className="text-base text-slate-600">Thay vì tự tra điểm chuẩn và tự tính điểm xét tuyển, hãy để ứng dụng làm giúp bạn.</p>
      </div>
      <ul className="space-y-4">
        {POINTS.map(({ icon: Icon, title, body }) => (
          <li key={title} className="flex gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Icon className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-base font-medium text-slate-900">{title}</span>
              <span className="block text-sm text-slate-600">{body}</span>
            </span>
          </li>
        ))}
      </ul>
      <div className="space-y-3">
        <button type="button" onClick={onStart} className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 text-base font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 cursor-pointer">
          Bắt đầu <ArrowRight className="h-5 w-5" />
        </button>
        <p className="text-center text-xs text-slate-500">Miễn phí, không cần đăng ký. Thông tin của bạn chỉ lưu trên thiết bị này.</p>
      </div>
    </div>
  );
}

export default function StartPage() {
  const { epoch, profile } = useApp();
  const blank = countEntered(profile.examScores) === 0 && countEntered(profile.hocBaScores) === 0 && !profile.graduationYear && !Object.values(profile.altScores ?? {}).some((v) => typeof v === "number");
  const [started, setStarted] = useState(false);
  if (blank && !started) return <Welcome key={epoch} onStart={() => setStarted(true)} />;
  return <Wizard key={epoch} />;
}

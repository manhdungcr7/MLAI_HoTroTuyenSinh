import React, { useEffect, useState } from "react";
import { DatasetFreshness } from "@/state/dataset-freshness";
import { CATALOG_STATS } from "@/data/catalog";
import { listSchoolRules } from "@/engine/scoring/school-rules";
import { METHOD_LABELS_VI } from "@/engine/scoring/method-score";

const STEPS = [
  "Tính điểm xét tuyển của em theo từng phương thức: điểm thi, học bạ.",
  "So với điểm chuẩn dự kiến của ngành, có tính biến động điểm chuẩn giữa các năm.",
  "Chọn phương thức có lợi nhất cho em ở mỗi ngành và xếp theo xác suất đỗ.",
];

interface Backtest {
  sampleSize: number;
  testPeriod: string;
  metrics: {
    naiveBaseline: { mae: number };
    ourModel: { mae: number; coverageP10P90Pct: number };
  };
}

/** Kết quả kiểm chứng dự báo điểm chuẩn trên năm đã biết; null nếu chưa có hoặc không tải được. */
function useBacktest(): Backtest | null {
  const [data, setData] = useState<Backtest | null>(null);
  useEffect(() => {
    let active = true;
    fetch("/data/backtest.json")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (active && j?.metrics?.ourModel) setData(j as Backtest); })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);
  return data;
}

/** Trang thông tin: cách tính và độ tin cậy dữ liệu, ngắn gọn. */
export default function AboutPage() {
  const backtest = useBacktest();
  const ownRules = listSchoolRules().length;
  const stats = [
    { value: CATALOG_STATS.usableRows, label: "ngành đã có điểm chuẩn" },
    { value: CATALOG_STATS.schools, label: "trường" },
    { value: ownRules, label: "trường có quy chế riêng" },
  ];
  const methods = Object.entries(CATALOG_STATS.byMethod).sort((a, b) => b[1] - a[1]).slice(0, 4);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black tracking-tight text-slate-900">Cách tính</h1>

      <ol className="space-y-3">
        {STEPS.map((text, i) => (
          <li key={text} className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-black text-white">{i + 1}</span>
            <p className="pt-1 text-base font-bold text-slate-800">{text}</p>
          </li>
        ))}
      </ol>

      <section className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-white p-4 text-center shadow-xs ring-1 ring-slate-200">
            <p className="text-3xl font-black text-slate-900">{s.value.toLocaleString("vi-VN")}</p>
            <p className="mt-1 text-xs font-bold text-slate-500">{s.label}</p>
          </div>
        ))}
      </section>

      {backtest && (
        <section className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
          <h2 className="text-base font-extrabold text-slate-900">Dự báo đã được thử thế nào?</h2>
          <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-700">
            Dùng dữ liệu đến 2024 để dự báo điểm chuẩn {backtest.testPeriod.split(" ")[0]} của {backtest.sampleSize} ngành rồi so với điểm thật:
            sai số trung bình {backtest.metrics.ourModel.mae.toFixed(1)} điểm (cách đơn giản là giữ nguyên điểm năm trước sai {backtest.metrics.naiveBaseline.mae.toFixed(1)} điểm).
            Khoảng dự báo 10–90% chứa điểm thật ở {backtest.metrics.ourModel.coverageP10P90Pct.toFixed(0)}% số ngành.
          </p>
        </section>
      )}

      <section className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
        <h2 className="text-base font-extrabold text-slate-900">Phương thức trong dữ liệu</h2>
        <ul className="mt-2 divide-y divide-slate-100 text-sm font-semibold text-slate-700">
          {methods.map(([code, n]) => (
            <li key={code} className="flex justify-between py-2">
              <span>{METHOD_LABELS_VI[code as keyof typeof METHOD_LABELS_VI] ?? code}</span>
              <span className="text-slate-500">{n.toLocaleString("vi-VN")}</span>
            </li>
          ))}
        </ul>
      </section>

      <DatasetFreshness />

      <p className="text-sm font-semibold leading-relaxed text-slate-500">
        Kết quả là ước lượng, không phải cam kết. Trường chưa có quy chế riêng được tính theo công thức chung. Hãy đối chiếu đề án tuyển sinh của trường trước khi nộp nguyện vọng.
      </p>
    </div>
  );
}

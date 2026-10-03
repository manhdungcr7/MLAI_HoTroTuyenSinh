import React, { useEffect, useState } from "react";
import { dataUrl } from "@/lib/data-url";
import { DatasetFreshness } from "@/state/dataset-freshness";
import { useApp } from "@/state/AppContext";
import { listSchoolRules } from "@/engine/scoring/school-rules";
import { METHOD_LABELS_VI } from "@/engine/scoring/method-score";

const STEPS = [
  "Tính điểm xét tuyển của bạn theo từng phương thức: điểm thi, học bạ.",
  "So với điểm chuẩn dự kiến của ngành, có tính biến động điểm chuẩn giữa các năm.",
  "Chọn phương thức có lợi nhất cho bạn ở mỗi ngành và xếp theo xác suất đỗ.",
];

interface Holdout {
  year: number;
  n: number;
  mae?: number;
  coverageP10P90Pct?: number;
  calibrationGap?: number;
}
interface Backtest {
  holdouts: Holdout[];
}

/** Kết quả kiểm định dự báo điểm chuẩn trên các năm đã biết; null nếu chưa có hoặc không tải được. */
function useBacktest(): Backtest | null {
  const [data, setData] = useState<Backtest | null>(null);
  useEffect(() => {
    let active = true;
    fetch(dataUrl("backtest.json"))
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (active && Array.isArray(j?.holdouts)) setData(j as Backtest); })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);
  return data;
}

/** Trang thông tin: cách tính và độ tin cậy dữ liệu, ngắn gọn. */
export default function AboutPage() {
  const backtest = useBacktest();
  const { catalog } = useApp();
  const stats0 = catalog?.stats;
  const ownRules = listSchoolRules().length;
  const stats = [
    { value: (stats0?.usableRows ?? 0), label: "ngành đã có điểm chuẩn" },
    { value: (stats0?.schools ?? 0), label: "trường" },
    { value: ownRules, label: "trường có quy chế riêng" },
  ];
  const methods = Object.entries(stats0?.byMethod ?? {}).sort((a, b) => b[1] - a[1]).slice(0, 4);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Cách tính</h1>

      <ol className="space-y-3">
        {STEPS.map((text, i) => (
          <li key={text} className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">{i + 1}</span>
            <p className="pt-1 text-base font-bold text-slate-800">{text}</p>
          </li>
        ))}
      </ol>

      <section className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-white p-4 text-center shadow-xs ring-1 ring-slate-200">
            <p className="text-3xl font-bold text-slate-900">{s.value.toLocaleString("vi-VN")}</p>
            <p className="mt-1 text-xs font-bold text-slate-500">{s.label}</p>
          </div>
        ))}
      </section>

      {backtest && backtest.holdouts.some((h) => h.mae !== undefined) && (
        <section className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
          <h2 className="text-base font-semibold text-slate-900">Đã thử trên năm đã biết</h2>
          <table className="mt-2 w-full text-left text-sm font-semibold text-slate-700">
            <thead className="text-xs text-slate-500">
              <tr><th className="py-1">Năm</th><th>Ngành</th><th>Sai số</th><th>Khoảng chứa</th><th>Xác suất lệch</th></tr>
            </thead>
            <tbody>
              {backtest.holdouts.filter((h) => h.mae !== undefined).map((h) => (
                <tr key={h.year} className="border-t border-slate-100">
                  <td className="py-2">{h.year}</td>
                  <td>{h.n}</td>
                  <td>{h.mae!.toFixed(1)} điểm</td>
                  <td>{h.coverageP10P90Pct !== undefined ? `${h.coverageP10P90Pct.toFixed(0)}%` : "–"}</td>
                  <td>{h.calibrationGap !== undefined ? `${(h.calibrationGap * 100).toFixed(1)}%` : "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <section className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
        <h2 className="text-base font-semibold text-slate-900">Phương thức trong dữ liệu</h2>
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

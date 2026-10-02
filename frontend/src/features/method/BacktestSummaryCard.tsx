import React, { useEffect, useState } from "react";
import { BarChart3, CheckCircle2, AlertCircle, TrendingUp, Info } from "lucide-react";

interface BacktestData {
  generatedAt: string;
  sampleSize: number;
  trainPeriod: string;
  testPeriod: string;
  trainParameters: {
    nationalShockStd: number;
    idioStd: number;
    medianTrend: number;
  };
  metrics: {
    naiveBaseline: { label: string; mae: number; rmse: number; n: number };
    trendBaseline: { label: string; mae: number; rmse: number; n: number };
    ourModel: { label: string; mae: number; rmse: number; coverageP10P90Pct: number; meanBandWidth: number; n: number };
  };
  brierScore: number;
  calibrationMethod?: string;
  calibrationCurve: Array<{ bin: string; predictedProb: number; observedFreq: number; count: number }>;
  baselineInsight?: string;
  limitationsVi: string;
}

export default function BacktestSummaryCard() {
  const [data, setData] = useState<BacktestData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/data/backtest.json")
      .then((res) => {
        if (!res.ok) throw new Error("Could not load backtest.json");
        return res.json();
      })
      .then((d: BacktestData) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        console.warn("Backtest data fetch error:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-20 bg-gray-100 rounded"></div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { metrics, sampleSize, testPeriod, trainPeriod, brierScore, limitationsVi, calibrationCurve, baselineInsight, calibrationMethod } = data;

  return (
    <div className="bg-white rounded-xl border border-emerald-200 p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-lg">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              Bằng Chứng Kiểm Định Backtest (Dữ liệu Thật 2025)
              <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                N = {sampleSize} chương trình
              </span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Huấn luyện trên dữ liệu {trainPeriod} → Đối chiếu điểm chuẩn thực tế {testPeriod} (không rò rỉ dữ liệu).
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Coverage [P10, P90]: <strong>{metrics.ourModel.coverageP10P90Pct}%</strong>
        </div>
      </div>

      {/* 3 Baselines Comparison Table */}
      <div className="mt-5 overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
              <th className="py-2.5 px-3">Phương pháp / Mô hình</th>
              <th className="py-2.5 px-3">Số mẫu (N)</th>
              <th className="py-2.5 px-3">Sai số MAE</th>
              <th className="py-2.5 px-3">Sai số RMSE</th>
              <th className="py-2.5 px-3">Bao phủ [P10-P90]</th>
              <th className="py-2.5 px-3">Độ rộng dải trung bình</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr className="text-gray-600 hover:bg-gray-50/50">
              <td className="py-2.5 px-3 font-medium text-gray-800">
                1. {metrics.naiveBaseline.label} (Naive)
              </td>
              <td className="py-2.5 px-3">{metrics.naiveBaseline.n}</td>
              <td className="py-2.5 px-3 font-mono font-medium">{metrics.naiveBaseline.mae.toFixed(2)}đ</td>
              <td className="py-2.5 px-3 font-mono">{metrics.naiveBaseline.rmse.toFixed(2)}đ</td>
              <td className="py-2.5 px-3 text-gray-400">— (điểm đơn lẻ)</td>
              <td className="py-2.5 px-3 text-gray-400">—</td>
            </tr>
            <tr className="text-gray-600 hover:bg-gray-50/50">
              <td className="py-2.5 px-3 font-medium text-gray-800">
                2. {metrics.trendBaseline.label} (Trend)
              </td>
              <td className="py-2.5 px-3">{metrics.trendBaseline.n}</td>
              <td className="py-2.5 px-3 font-mono font-medium">{metrics.trendBaseline.mae.toFixed(2)}đ</td>
              <td className="py-2.5 px-3 font-mono">{metrics.trendBaseline.rmse.toFixed(2)}đ</td>
              <td className="py-2.5 px-3 text-gray-400">— (điểm đơn lẻ)</td>
              <td className="py-2.5 px-3 text-gray-400">—</td>
            </tr>
            <tr className="bg-emerald-50/40 text-emerald-900 font-semibold border-emerald-100">
              <td className="py-2.5 px-3 flex items-center gap-1.5 text-emerald-800">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                3. {metrics.ourModel.label}
              </td>
              <td className="py-2.5 px-3">{metrics.ourModel.n}</td>
              <td className="py-2.5 px-3 font-mono font-bold text-emerald-800">{metrics.ourModel.mae.toFixed(2)}đ</td>
              <td className="py-2.5 px-3 font-mono">{metrics.ourModel.rmse.toFixed(2)}đ</td>
              <td className="py-2.5 px-3 text-emerald-700 font-bold">
                {metrics.ourModel.coverageP10P90Pct}% (mục tiêu 70-90%)
              </td>
              <td className="py-2.5 px-3 font-mono">{metrics.ourModel.meanBandWidth.toFixed(2)}đ</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Baseline Insight Callout */}
      {baselineInsight && (
        <div className="mt-3 p-3 bg-blue-50/70 border border-blue-200 rounded-lg flex items-start gap-2.5 text-xs text-blue-900 leading-relaxed">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold text-blue-950">Phân tích thực chứng từ Dữ liệu 2025:</strong>{" "}
            <span>{baselineInsight}</span>
          </div>
        </div>
      )}

      {/* Profile Level Probability Verification (Brier Score & Calibration) */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-lg p-3.5 border border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-700">Chỉ số Brier Score (Độ hiệu chỉnh xác suất):</span>
            <span className="text-xs font-mono font-bold text-gray-900 px-2 py-0.5 bg-white border border-gray-200 rounded">
              {brierScore.toFixed(4)}
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            Brier Score càng gần 0 thể hiện xác suất trúng tuyển dự báo càng chuẩn xác so với kết quả đỗ/trượt thực tế.
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-3.5 border border-gray-100">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-gray-700">Hiệu chỉnh xác suất (Calibration Curve):</span>
            <span className="text-[10px] text-gray-500 font-mono">2.130 phép thử</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-[11px]">
            {calibrationCurve.slice(1, 6).map((item, idx) => (
              <div key={idx} className="bg-white border border-gray-200 rounded px-2 py-1 text-center min-w-[70px]">
                <div className="text-gray-500 font-mono text-[10px]">{item.bin}</div>
                <div className="font-semibold text-emerald-700 mt-0.5">{(item.observedFreq * 100).toFixed(1)}% thật</div>
              </div>
            ))}
          </div>
          {calibrationMethod && (
            <p className="text-[10px] text-gray-500 mt-1.5 italic">
              {calibrationMethod}
            </p>
          )}
        </div>
      </div>

      {/* Honest Limitations Notice */}
      <div className="mt-4 p-3 bg-amber-50/70 border border-amber-200 rounded-lg flex items-start gap-2.5 text-xs text-amber-900">
        <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <strong className="font-semibold">Nêu rõ giới hạn mô hình (Theo TMA Challenge Brief):</strong>{" "}
          <span>{limitationsVi}</span>
        </div>
      </div>
    </div>
  );
}

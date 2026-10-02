import React, { useEffect, useState } from "react";
import { Cpu, CheckCircle2, AlertTriangle, Layers, BarChart2, Zap, ArrowUpRight } from "lucide-react";

interface VerifiedCaseStudy {
  case_id: string;
  school_code: string;
  school_name: string;
  major: string;
  score_2024: number;
  actual_2025: number;
  phenomenon: string;
  analysis: string;
  verified: boolean;
  evidence_doc: string;
  evidence_url: string;
}

interface MlBenchmarkData {
  metadata: {
    train_samples: number;
    test_samples: number;
    n_features: number;
    train_period: string;
    test_period: string;
    target: string;
  };
  models: Record<
    string,
    {
      name: string;
      mae: number;
      rmse: number;
      coverage_p10_p90?: number;
    }
  >;
  top_features: Array<{ feature: string; importance: number }>;
  error_analysis: {
    best_cases: Array<{
      school_code: string;
      major: string;
      score_2024: number;
      actual_2025: number;
      pred_2025: number;
      abs_error: number;
    }>;
    worst_cases: Array<{
      school_code: string;
      major: string;
      score_2024: number;
      actual_2025: number;
      pred_2025: number;
      abs_error: number;
      diagnosis: string;
      verified?: boolean;
      evidence_doc?: string | null;
      evidence_url?: string | null;
    }>;
    verified_case_studies?: VerifiedCaseStudy[];
  };
}

const FEATURE_EXPLANATIONS: Record<string, string> = {
  major_vs_school_gap: "Chênh lệch điểm ngành so với điểm TB trường kỳ trước (Vị thế thương hiệu nội bộ)",
  major_vs_nat_gap: "Chênh lệch điểm ngành so với trung vị toàn quốc (Độ chọn lọc quốc gia)",
  major_vs_group_gap: "Chênh lệch điểm ngành so với trung vị nhóm ngành (Độ hot tương đối)",
  fill_rate_lag1: "Tỷ lệ tuyển sinh / chỉ tiêu kỳ trước (Áp lực cung cầu tuyển sinh)",
  score_from: "Mức điểm chuẩn kỳ trước St-1 (Điểm neo cơ sở)",
  percentile_lag1: "Bách phân vị tích lũy phổ điểm Bộ GD&ĐT kỳ trước (Khung phân phối chuẩn)",
  grp_su_pham: "Biến định danh nhóm Sư phạm (Chịu tác động chính sách NĐ 116/2020/NĐ-CP)",
  grp_ngon_ngu: "Biến định danh nhóm Ngoại ngữ",
  grp_other: "Biến định danh nhóm liên ngành khác",
  grp_du_lich: "Biến định danh nhóm Du lịch & Khách sạn",
};

export default function MlBenchmarkCard() {
  const [data, setData] = useState<MlBenchmarkData | null>(null);
  const [activeTab, setActiveTab] = useState<"models" | "features" | "errors">("models");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/data/ml_benchmark.json")
      .then((res) => {
        if (!res.ok) throw new Error("Could not load ml_benchmark.json");
        return res.json();
      })
      .then((d: MlBenchmarkData) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        console.warn("ML benchmark fetch error:", err);
        setLoading(false);
      });
  }, []);

  if (loading || !data) {
    return null;
  }

  const { metadata, models, top_features, error_analysis } = data;
  const maxImportance = Math.max(...top_features.map((f) => f.importance), 1);

  return (
    <div className="bg-white rounded-2xl border border-blue-200 p-6 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl border border-blue-100">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              Nghiên Cứu & Huấn Luyện Machine Learning Chuyên Sâu
              <span className="text-xs bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                {metadata.n_features} đặc trưng chế tác
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Định vị theo Tiêu chí 4 TMA Challenge Brief: Dự báo có phân tích lỗi, Feature Importance và mô hình hoá bất định.
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab("models")}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === "models"
                ? "bg-white text-blue-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Mô hình đối đầu ({Object.keys(models).length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("features")}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === "features"
                ? "bg-white text-blue-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Feature Importance
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("errors")}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === "errors"
                ? "bg-white text-blue-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Chẩn đoán lỗi (Error Analysis)
          </button>
        </div>
      </div>

      {/* TAB 1: MODELS BENCHMARK */}
      {activeTab === "models" && (
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3">Mô hình thuật toán</th>
                  <th className="py-2.5 px-3">Hàm Loss / Cơ chế</th>
                  <th className="py-2.5 px-3">Sai số MAE</th>
                  <th className="py-2.5 px-3">Sai số RMSE</th>
                  <th className="py-2.5 px-3">Bao phủ [P10-P90]</th>
                  <th className="py-2.5 px-3">Đặc tính Decision Intelligence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.entries(models).map(([key, m]) => {
                  const isLightGBM = key === "lightgbm_huber";
                  return (
                    <tr
                      key={key}
                      className={
                        isLightGBM
                          ? "bg-blue-50/50 text-blue-950 font-bold border-blue-100"
                          : "text-slate-700 hover:bg-slate-50/60"
                      }
                    >
                      <td className="py-2.5 px-3 font-semibold flex items-center gap-1.5">
                        {isLightGBM && <Zap className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                        {m.name}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 font-mono">
                        {key === "naive_baseline" && "Zero-change (St-1)"}
                        {key === "bayesian_ridge" && "L2 Ridge + Gamma Prior"}
                        {key === "huber_regressor" && "Huber Loss (Robust to Outliers)"}
                        {key === "random_forest" && "Mean Squared Error (150 trees)"}
                        {key === "lightgbm_huber" && "Huber Loss + Quantile Boosting"}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold">{m.mae.toFixed(4)}đ</td>
                      <td className="py-2.5 px-3 font-mono">{m.rmse.toFixed(4)}đ</td>
                      <td className="py-2.5 px-3 font-mono">
                        {m.coverage_p10_p90 ? `${m.coverage_p10_p90}%` : "—"}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                        {key === "naive_baseline" && "Điểm đơn lẻ, không thể tính xác suất trượt hết P(fail all)"}
                        {key === "bayesian_ridge" && "Xác định khoảng tin cậy tham số, tuyến tính"}
                        {key === "huber_regressor" && "Kháng nhiễu ngoại lai từ các ngành đổi mã xét tuyển"}
                        {key === "random_forest" && "Nắm bắt phi tuyến nhưng tốn bộ nhớ và chậm"}
                        {key === "lightgbm_huber" && "Tối ưu phi tuyến, kháng nhiễu cực tốt, sinh dải phân vị chuẩn"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Tại sao không chỉ dùng Naive Baseline dù MAE thấp (1.78đ)?
            </div>
            <p>
              Điểm chuẩn trường đại học thường bám sát năm trước nên mô hình giữ nguyên (Naive) luôn có sai số trung bình thấp. Tuy nhiên, <strong>Naive không thể sinh ra dải bất định [P10, P90]</strong>, không thể tích phân Gauss-Hermite để tính <strong>P(fail all)</strong> cho danh mục 15 nguyện vọng, và hoàn toàn bất lực khi có cú sốc phân vị toàn quốc (như quy chế thi mới hoặc chính sách học phí). Mô hình LightGBM Huber và Hierarchical Bayes giải quyết triệt để bài toán này.
            </p>
          </div>
        </div>
      )}

      {/* TAB 2: FEATURE IMPORTANCE */}
      {activeTab === "features" && (
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Trích xuất từ 80 cây quyết định của LightGBM. Các đặc trưng được thiết kế theo bản chất tuyển sinh đại học Việt Nam (Domain Knowledge):
          </p>

          <div className="space-y-2.5">
            {top_features.map((item, idx) => {
              const pct = (item.importance / maxImportance) * 100;
              const desc = FEATURE_EXPLANATIONS[item.feature] || item.feature;
              return (
                <div key={item.feature} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-2">
                      <span className="font-mono text-slate-400">#{idx + 1}</span>
                      <code className="bg-slate-100 px-1.5 py-0.5 rounded text-blue-700 font-mono text-[11px]">
                        {item.feature}
                      </code>
                      <span className="text-slate-500 font-normal hidden md:inline">— {desc}</span>
                    </span>
                    <span className="font-mono font-bold text-slate-700">{item.importance} splits</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 leading-relaxed">
            <strong>Nhận định Data Science:</strong> 3 đặc trưng chi phối mạnh nhất là <code>major_vs_school_gap</code> (136 splits), <code>major_vs_nat_gap</code> (107 splits), và <code>major_vs_group_gap</code> (93 splits). Điều này chứng minh thuật toán đã nắm bắt chính xác quy luật: vị thế tương đối của ngành trong trường và so với cả nước quyết định biên độ dao động điểm chuẩn năm tiếp theo, chứ không đơn thuần chỉ nhìn vào điểm số tuyệt đối.
          </div>
        </div>
      )}

      {/* TAB 3: ERROR ANALYSIS */}
      {activeTab === "errors" && (
        <div className="space-y-5">
          {/* Top 5 Best Cases */}
          <div>
            <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Mẫu dự báo chính xác nhất (Sai số tuyệt đối &lt; 0.005 điểm)
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-emerald-50 text-emerald-950 font-bold border-b border-emerald-200">
                    <th className="py-2 px-3">Trường</th>
                    <th className="py-2 px-3">Ngành đào tạo</th>
                    <th className="py-2 px-3">Điểm 2024</th>
                    <th className="py-2 px-3">Điểm thực tế 2025</th>
                    <th className="py-2 px-3">Mô hình dự báo</th>
                    <th className="py-2 px-3">Sai số tuyệt đối</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-100">
                  {error_analysis.best_cases.map((c, i) => (
                    <tr key={i} className="hover:bg-emerald-50/40">
                      <td className="py-2 px-3 font-bold text-slate-800">{c.school_code}</td>
                      <td className="py-2 px-3 text-slate-600 max-w-[280px] truncate">{c.major || "Chương trình chuẩn"}</td>
                      <td className="py-2 px-3 font-mono">{c.score_2024.toFixed(2)}</td>
                      <td className="py-2 px-3 font-mono font-bold text-emerald-800">{c.actual_2025.toFixed(2)}</td>
                      <td className="py-2 px-3 font-mono font-bold text-blue-700">{c.pred_2025.toFixed(2)}</td>
                      <td className="py-2 px-3 font-mono text-emerald-700 font-bold">{c.abs_error.toFixed(3)}đ</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top 5 Worst Cases */}
          <div>
            <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Mẫu dự báo sai lệch nhiều nhất (Error Analysis &amp; Chẩn đoán nguyên nhân gốc)
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-rose-50 text-rose-950 font-bold border-b border-rose-200">
                    <th className="py-2 px-3">Trường</th>
                    <th className="py-2 px-3">Ngành đào tạo</th>
                    <th className="py-2 px-3">Điểm 2024</th>
                    <th className="py-2 px-3">Thực tế 2025</th>
                    <th className="py-2 px-3">Mô hình</th>
                    <th className="py-2 px-3">Lệch</th>
                    <th className="py-2 px-3">Chẩn đoán nguyên nhân gốc (Root Cause)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rose-100">
                  {error_analysis.worst_cases.map((c, i) => (
                    <tr key={i} className="hover:bg-rose-50/40">
                      <td className="py-2.5 px-3 font-bold text-slate-800">{c.school_code}</td>
                      <td className="py-2.5 px-3 text-slate-700 max-w-[220px]">
                        <div className="font-medium truncate">{c.major}</div>
                      </td>
                      <td className="py-2.5 px-3 font-mono">{c.score_2024.toFixed(2)}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-rose-800">{c.actual_2025.toFixed(2)}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{c.pred_2025.toFixed(2)}</td>
                      <td className="py-2.5 px-3 font-mono text-rose-700 font-bold">+{c.abs_error.toFixed(2)}đ</td>
                      <td className="py-2.5 px-3 text-slate-700 text-[11px] leading-relaxed">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            c.verified
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : "bg-amber-100 text-amber-800 border border-amber-200"
                          }`}>
                            {c.verified ? "Đã xác minh nguồn gốc" : "Chưa xác minh độc lập"}
                          </span>
                        </div>
                        <div>{c.diagnosis}</div>
                        {c.evidence_doc && (
                          <div className="text-[10px] text-slate-500 mt-1 flex flex-wrap items-center gap-1">
                            <span>Tài liệu: {c.evidence_doc}</span>
                            {c.evidence_url && (
                              <a
                                href={c.evidence_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 font-bold inline-flex items-center gap-0.5 ml-1"
                              >
                                [Cổng trường]
                                <ArrowUpRight className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Verified Deep Dive Case Studies */}
            {error_analysis.verified_case_studies && error_analysis.verified_case_studies.length > 0 && (
              <div className="mt-4 space-y-2">
                <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Nghiên cứu trường hợp điển hình đã đối chiếu thực địa (Verified Case Studies)
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {error_analysis.verified_case_studies.map((cs) => (
                    <div
                      key={cs.case_id}
                      className="p-3.5 bg-blue-50/50 border border-blue-200 rounded-xl space-y-2 text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 mr-1.5">
                            {cs.school_code}
                          </span>
                          <strong className="text-slate-900">{cs.major}</strong>
                          <div className="text-[11px] text-slate-500">{cs.school_name}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-mono text-slate-500">{cs.score_2024.toFixed(2)}</span>
                          <span className="mx-1 text-slate-400">→</span>
                          <span className="font-mono font-bold text-blue-700">{cs.actual_2025.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="text-[11px] font-bold text-blue-900">
                        Hiện tượng: {cs.phenomenon}
                      </div>
                      <p className="text-slate-700 text-[11px] leading-relaxed">
                        {cs.analysis}
                      </p>
                      <div className="pt-2 border-t border-blue-100 flex flex-wrap items-center justify-between text-[10px] text-slate-500 gap-1">
                        <span>{cs.evidence_doc}</span>
                        <a
                          href={cs.evidence_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 font-bold inline-flex items-center gap-0.5"
                        >
                          Cổng tuyển sinh
                          <ArrowUpRight className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
              <strong>Bài học đúc kết cho Vòng lặp cải tiến (Iterative Improvement):</strong>
              <ul className="list-disc list-inside mt-1 space-y-1 text-slate-700">
                <li>
                  <strong>Method Shift (Chuyển dịch phương thức):</strong> Các ngành có mã phụ &quot;HB&quot; năm 2024 là xét học bạ (thang điểm 24-25đ), sang năm 2025 trường chuyển sang xét hoàn toàn bằng điểm thi THPT (sàn 16.0đ). Mô hình dữ liệu cần tách riêng cột <code>admission_method</code> thay vì ghép chung.
                </li>
                <li>
                  <strong>Policy Shock (Cú sốc chính sách Sư phạm):</strong> Ngành Sư phạm Tiếng Pháp (DHS) tăng vọt từ 19.0 lên 27.4 điểm do chính sách cấp bù học phí và hỗ trợ sinh hoạt phí 3.63 triệu/tháng theo Nghị định 116/2020/NĐ-CP thu hút đột biến lượng hồ sơ giỏi.
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

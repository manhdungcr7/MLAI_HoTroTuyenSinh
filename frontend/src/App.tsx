import React, { Suspense, lazy } from "react";
import { DecisionProvider } from "@/state/DecisionContext";
import AppShell from "@/components/layout/AppShell";
import { usePathname } from "@/routes";
import { DatasetFreshnessProvider } from "@/state/dataset-freshness";

// Lazy-load các trang Domain của ứng dụng
const StartPage = lazy(() => import("@/pages/start/page"));
const ProfilePage = lazy(() => import("@/pages/profile/page"));
const AnalysisPage = lazy(() => import("@/pages/analysis/page"));
const GapAnalysisPage = lazy(() => import("@/pages/analysis/gap/page"));
const SubjectRoiPage = lazy(() => import("@/pages/analysis/roi/page"));
const SimulationPage = lazy(() => import("@/pages/analysis/simulation/page"));
const OptionsPage = lazy(() => import("@/pages/explore/page"));
const PortfolioPage = lazy(() => import("@/pages/portfolio/page"));
const StudyPlanPage = lazy(() => import("@/pages/study-plan/page"));
const ComparisonPage = lazy(() => import("@/pages/explore/compare/page"));
const ExplanationPage = lazy(() => import("@/pages/method/page"));
const VerifyPage = lazy(() => import("@/pages/verify/page"));

function AppContent() {
  const pathname = usePathname();

  const renderActiveRoute = () => {
    switch (pathname) {
      case "/":
      case "/start":
      case "/dashboard":
        return <StartPage />;
      case "/profile":
        return <ProfilePage />;
      case "/profile/goal":
        return <AnalysisPage />;
      case "/analysis":
        return <AnalysisPage />;
      case "/analysis/gap":
        return <GapAnalysisPage />;
      case "/analysis/roi":
        return <SubjectRoiPage />;
      case "/analysis/simulation":
      case "/simulation":
        return <SimulationPage />;
      case "/options":
      case "/explore":
        return <OptionsPage />;
      case "/portfolio":
      case "/strategy":
        return <PortfolioPage />;
      case "/study-plan":
        return <StudyPlanPage />;
      case "/comparison":
      case "/compare":
        return <ComparisonPage />;
      case "/explanation":
        return <ExplanationPage />;
      case "/verify":
        return <VerifyPage />;
      default:
        return <StartPage />;
    }
  };

  return (
    <AppShell>
      <Suspense fallback={<div className="p-8 text-center text-slate-500">Đang tải...</div>}>
        {renderActiveRoute()}
      </Suspense>
    </AppShell>
  );
}

export default function App() {
  return (
    <DatasetFreshnessProvider>
      <DecisionProvider>
        <AppContent />
      </DecisionProvider>
    </DatasetFreshnessProvider>
  );
}

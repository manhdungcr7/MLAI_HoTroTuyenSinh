import React, { Suspense, lazy } from "react";
import { AppProvider } from "@/state/AppContext";
import AppShell from "@/components/layout/AppShell";
import { usePathname } from "@/routes";
import { DatasetFreshnessProvider } from "@/state/dataset-freshness";
import { CatalogGate } from "@/components/ui/CatalogGate";

const StartPage = lazy(() => import("@/pages/start/page"));
const ResultsPage = lazy(() => import("@/pages/results/page"));
const PortfolioPage = lazy(() => import("@/pages/portfolio/page"));
const ImprovePage = lazy(() => import("@/pages/improve/page"));
const AboutPage = lazy(() => import("@/pages/about/page"));

/** Đường dẫn của các phiên bản trước vẫn mở được trang tương ứng. */
const ALIASES: Record<string, string> = {
  "/dashboard": "/start",
  "/profile": "/start",
  "/profile/goal": "/improve",
  "/options": "/results",
  "/explore": "/results",
  "/comparison": "/results",
  "/compare": "/results",
  "/strategy": "/portfolio",
  "/analysis": "/improve",
  "/analysis/gap": "/improve",
  "/analysis/roi": "/improve",
  "/analysis/simulation": "/improve",
  "/simulation": "/improve",
  "/study-plan": "/improve",
  "/explanation": "/about",
  "/method": "/about",
  "/verify": "/about",
};

function Routes() {
  const pathname = usePathname();
  switch (ALIASES[pathname] ?? pathname) {
    case "/results":
      return <CatalogGate><ResultsPage /></CatalogGate>;
    case "/portfolio":
      return <CatalogGate><PortfolioPage /></CatalogGate>;
    case "/improve":
      return <CatalogGate><ImprovePage /></CatalogGate>;
    case "/about":
      return <CatalogGate><AboutPage /></CatalogGate>;
    default:
      return <StartPage />;
  }
}

export default function App() {
  return (
    <DatasetFreshnessProvider>
      <AppProvider>
        <AppShell>
          <Suspense fallback={<div className="py-16 text-center text-sm font-semibold text-slate-400">Đang tải…</div>}>
            <Routes />
          </Suspense>
        </AppShell>
      </AppProvider>
    </DatasetFreshnessProvider>
  );
}

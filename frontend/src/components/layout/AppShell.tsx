import React, { useState } from "react";
import { usePathname } from "@/routes";
import { useDecision } from "@/state/DecisionContext";
import { Sidebar, DOMAIN_NAV_ITEMS } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { QuickSimModal } from "@/components/layout/QuickSimModal";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const {
    profile,
    target,
    gapAnalysis,
    pFailAll,
    isRecalculating,
    updateMockScore,
    savedProfiles,
    activeProfileId,
    createNewProfile,
    switchProfile,
    deleteProfile,
    logoutProfile,
    resetToBlank,
    wishlist,
  } = useDecision();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showMockModal, setShowMockModal] = useState(false);

  const currentNavItem =
    DOMAIN_NAV_ITEMS.find((item) =>
      item.matchPaths ? item.matchPaths.includes(pathname) : pathname.startsWith(item.href)
    ) || DOMAIN_NAV_ITEMS[0];

  return (
    <div className="app-shell w-full h-[100dvh] flex overflow-hidden bg-slate-50 text-slate-900 antialiased print:block print:h-auto print:overflow-visible">
      {/* Overlay mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 md:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        profile={profile}
        target={target}
        gapAnalysis={gapAnalysis}
        pFailAll={pFailAll}
      />

      {/* Main Shell: flex 1 1 auto, min-width 0, height 100dvh, flex-col */}
      <div className="main-shell flex-[1_1_auto] min-w-0 h-[100dvh] flex flex-col overflow-hidden print:block print:h-auto print:overflow-visible">
        <Topbar
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          title={currentNavItem.label}
          profile={profile}
          target={target}
          gapAnalysis={gapAnalysis}
          pFailAll={pFailAll}
          isRecalculating={isRecalculating}
          onOpenMockModal={() => setShowMockModal(true)}
          savedProfiles={savedProfiles}
          activeProfileId={activeProfileId}
          onCreateNewProfile={createNewProfile}
          onSwitchProfile={switchProfile}
          onDeleteProfile={deleteProfile}
          onLogoutProfile={logoutProfile}
          onResetToBlank={resetToBlank}
          wishlistCount={wishlist.length}
        />

        {/* Page Viewport: flex 1 1 auto, min-height 0, min-width 0, overflow-y auto, overflow-x hidden */}
        <div
          className="page-viewport flex-[1_1_auto] min-h-0 min-w-0 overflow-y-auto overflow-x-hidden print:overflow-visible print:h-auto"
          style={{ scrollbarGutter: "stable" }}
        >
          {/* Page Content: width 100%, max-w-none */}
          <main className="page-content w-full max-w-none p-4 sm:p-6 lg:p-8 space-y-6">
            {children}
          </main>
        </div>
      </div>

      {/* Quick Mock Test Simulation Modal */}
      <QuickSimModal
        isOpen={showMockModal}
        onClose={() => setShowMockModal(false)}
        onSubmit={updateMockScore}
      />
    </div>
  );
}

export default AppShell;

import React from "react";
import { PortfolioView } from "@/features/portfolio/PortfolioView";

export default function PortfolioPage() {
  return (
    <div
      className="space-y-6 antialiased"
      style={{ scrollbarGutter: "stable" }}
    >
      <PortfolioView showHeaderBanner={false} />
    </div>
  );
}

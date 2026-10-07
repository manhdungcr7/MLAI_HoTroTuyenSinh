import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./giao-dien/index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <main className="p-6 text-muc font-bold">Quản trị Nguyện Vọng (khung)</main>
  </StrictMode>,
);

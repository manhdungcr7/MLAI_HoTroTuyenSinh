import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { AppProvider } from "@/state/store";
import { LoiUngDung } from "@/components/layout/loi-ung-dung";
import { khoDuLieu } from "@/engine/du-lieu-tuyen-sinh/kho-du-lieu";
import "./styles/index.css";

// Nạp bộ đệm dữ liệu tuyển sinh ngầm không chặn UI
void khoDuLieu.khoiTao();

// Service worker chỉ để hiện thông báo nhắc học (không lưu bộ nhớ đệm).
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => { navigator.serviceWorker.register("/sw.js").catch(() => { /* không đăng ký được thì vẫn dùng nhắc trong ứng dụng */ }); });
}

let rootElement = document.getElementById("root") || document.getElementById("app");
if (!rootElement) {
  rootElement = document.createElement("div");
  rootElement.id = "root";
  document.body.appendChild(rootElement);
}

createRoot(rootElement).render(
  <StrictMode>
    <LoiUngDung>
      <AppProvider>
        <App />
      </AppProvider>
    </LoiUngDung>
  </StrictMode>,
);

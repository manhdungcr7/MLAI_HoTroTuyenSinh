import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { AppProvider } from "@/state/store";
import { LoiUngDung } from "@/components/layout/loi-ung-dung";
import "./styles/index.css";

// Service worker chỉ để hiện thông báo nhắc học (không lưu bộ nhớ đệm).
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => { navigator.serviceWorker.register("/sw.js").catch(() => { /* không đăng ký được thì vẫn dùng nhắc trong ứng dụng */ }); });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LoiUngDung>
      <AppProvider>
        <App />
      </AppProvider>
    </LoiUngDung>
  </StrictMode>,
);

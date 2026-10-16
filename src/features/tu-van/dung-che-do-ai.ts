// Hook React cho chế độ AI: đọc từ localStorage, tự cập nhật khi đổi ở màn khác (Cài đặt, khung chat, tab khác).
import { useCallback, useMemo, useSyncExternalStore } from "react";
import { KHOA_CHE_DO, KHOA_LUOT, SU_KIEN_AI, datCheDo, docCheDo, docLuot, type CheDoAI, type Luot } from "./che-do-ai";

const dangKy = (f: () => void) => {
  window.addEventListener(SU_KIEN_AI, f);
  window.addEventListener("storage", f);
  window.addEventListener("nvai-lam-lai", f);
  return () => { window.removeEventListener(SU_KIEN_AI, f); window.removeEventListener("storage", f); window.removeEventListener("nvai-lam-lai", f); };
};
const anh = () => { try { return `${localStorage.getItem(KHOA_CHE_DO) ?? ""}|${localStorage.getItem(KHOA_LUOT) ?? ""}`; } catch { return "|"; } };

export function useCheDoAI(): { cheDo: CheDoAI; luot: Luot | null; doiCheDo: (c: CheDoAI) => void } {
  const snap = useSyncExternalStore(dangKy, anh, () => "|");
  const { cheDo, luot } = useMemo(() => {
    void snap;
    try { return { cheDo: docCheDo(localStorage), luot: docLuot(localStorage) }; } catch { return { cheDo: docCheDo(null), luot: null }; }
  }, [snap]);
  const doiCheDo = useCallback((c: CheDoAI) => { try { datCheDo(localStorage, c); } catch { /* trình duyệt chặn lưu: bỏ qua */ } }, []);
  return { cheDo, luot, doiCheDo };
}

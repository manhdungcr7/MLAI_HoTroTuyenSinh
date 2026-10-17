import { useSyncExternalStore } from "react";

const dangKy = (cb: () => void) => {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => { window.removeEventListener("online", cb); window.removeEventListener("offline", cb); };
};
/** true khi trình duyệt báo mất mạng. */
export const useNgoaiTuyen = () => useSyncExternalStore(dangKy, () => navigator.onLine === false, () => false);

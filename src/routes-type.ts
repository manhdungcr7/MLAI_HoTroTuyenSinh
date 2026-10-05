import type { ComponentType } from "react";
import type { RouteObject } from "react-router-dom";

/** Mỗi slice xuất một đối tượng này từ features/<slice>/routes.tsx. App.tsx tự gom lại. */
export interface RoutesCuaSlice {
  /** Trang có thanh 5 tab ở dưới (hầu hết các trang). */
  coThanh?: RouteObject[];
  /** Trang toàn màn hình, không có thanh tab (Chào mừng, các bước Bắt đầu). */
  khongThanh?: RouteObject[];
}

/** Tải trang theo nhu cầu: `...trang(() => import("./kham-pha"))`. Trang phải `export default`. */
export const trang = (f: () => Promise<{ default: ComponentType }>): Pick<RouteObject, "lazy"> => ({
  lazy: async () => ({ Component: (await f()).default }),
});

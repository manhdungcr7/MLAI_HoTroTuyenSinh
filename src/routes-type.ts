import type { ComponentType } from "react";
import type { RouteObject } from "react-router-dom";
import { boCongDuLieu } from "@/components/layout/cong-du-lieu";
import { khoDuLieu } from "@/engine/du-lieu-tuyen-sinh/kho-du-lieu";

/** Mỗi slice xuất một đối tượng này từ features/<slice>/routes.tsx. App.tsx tự gom lại. */
export interface RoutesCuaSlice {
  /** Trang có thanh 5 tab ở dưới (hầu hết các trang). */
  coThanh?: RouteObject[];
  /** Trang toàn màn hình, không có thanh tab (Chào mừng, các bước Bắt đầu). */
  khongThanh?: RouteObject[];
}

/**
 * Tải trang theo nhu cầu: `...trang(() => import("./kham-pha"))`. Trang phải `export default`.
 * Mặc định trang CẦN danh mục chương trình (nạp lười): trang hiện khung "đang tải" đến khi danh mục sẵn sàng, và danh mục bắt đầu tải song song với mã trang.
 * Trang không đụng tới danh mục (chào, giới thiệu, các bước nhập hồ sơ) khai `{ nhe: true }` để mở ngay.
 */
export const trang = (f: () => Promise<{ default: ComponentType }>, tuyChon: { nhe?: boolean } = {}): Pick<RouteObject, "lazy"> => ({
  lazy: async () => {
    if (tuyChon.nhe) return { Component: (await f()).default };
    void khoDuLieu.sanSang().catch(() => { /* cổng ChoDuLieu hiện lỗi và cho thử lại */ });
    return { Component: boCongDuLieu((await f()).default) };
  },
});

// Phiên làm việc thật: hỏi máy chủ "tôi là ai, vai gì, được giao trường nào" (GET /api/toi).
// Đăng nhập do Cloudflare Access lo; trang này không giả lập tài khoản hay vai trò.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { layToi, thongBaoLoi, LoiApi, type Toi } from "@cms/may-chu/api";
import { KhungDangTai, KhungLoi } from "@cms/thanh-phan/ui/hien-thi";

type TrangThaiPhien =
  | { kieu: "dang-tai" }
  | { kieu: "loi"; status: number; thongBao: string }
  | { kieu: "san-sang"; toi: Toi };

interface GiaTriPhien {
  toi: Toi;
  laQtv: boolean;
  /** Được sửa trường này không (qtv: mọi trường, ctv: chỉ trường được giao). */
  duocSua: (maTruong: string) => boolean;
}

const NguCanhPhien = createContext<GiaTriPhien | null>(null);

/** Lấy phiên hiện tại. Chỉ gọi bên trong <KhungPhien>. */
export function usePhien(): GiaTriPhien {
  const v = useContext(NguCanhPhien);
  if (!v) throw new Error("usePhien phải nằm trong KhungPhien");
  return v;
}

/** Lời giải thích cho người không rành kỹ thuật, theo mã lỗi. */
function loiPhien(status: number, thongBao: string): { tieuDe: string; moTa: string } {
  if (status === 401) return { tieuDe: "Bạn chưa đăng nhập", moTa: "Phiên đăng nhập đã hết hạn hoặc chưa có. Tải lại trang để đăng nhập bằng email được cấp quyền." };
  if (status === 403) return { tieuDe: "Email của bạn chưa được cấp quyền", moTa: `${thongBao} Nhờ quản trị viên thêm email của bạn vào mục Hệ thống, rồi tải lại trang.` };
  if (status === 0) return { tieuDe: "Không kết nối được máy chủ", moTa: "Bạn kiểm tra mạng rồi bấm Thử lại." };
  return { tieuDe: "Chưa vào được trang quản trị", moTa: thongBao };
}

/** Chặn toàn bộ giao diện cho tới khi biết người dùng là ai. Lỗi được nói thật, không rơi về tài khoản mẫu. */
export function KhungPhien({ children }: { children: ReactNode }) {
  const [tt, setTt] = useState<TrangThaiPhien>({ kieu: "dang-tai" });

  const tai = useCallback(() => {
    setTt({ kieu: "dang-tai" });
    layToi()
      .then((toi) => setTt({ kieu: "san-sang", toi }))
      .catch((e: unknown) => setTt({ kieu: "loi", status: e instanceof LoiApi ? e.status : 500, thongBao: thongBaoLoi(e) }));
  }, []);
  useEffect(tai, [tai]);

  const giaTri = useMemo<GiaTriPhien | null>(() => {
    if (tt.kieu !== "san-sang") return null;
    const toi = tt.toi;
    const giao = new Set(toi.truongDuocGiao);
    return { toi, laQtv: toi.vaiTro === "qtv", duocSua: (ma) => toi.vaiTro === "qtv" || giao.has(ma) };
  }, [tt]);

  if (tt.kieu === "dang-tai") return <div className="p-4 pt-10"><KhungDangTai soKhung={3} /></div>;
  if (tt.kieu === "loi") {
    const l = loiPhien(tt.status, tt.thongBao);
    return <div className="p-4 pt-10"><KhungLoi tieuDe={l.tieuDe} moTa={l.moTa} thuLai={tai} /></div>;
  }
  return <NguCanhPhien.Provider value={giaTri!}>{children}</NguCanhPhien.Provider>;
}

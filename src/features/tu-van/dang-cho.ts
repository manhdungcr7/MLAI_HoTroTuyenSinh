// Yêu cầu tư vấn đang chờ, giữ ở mức module để rời màn Tư vấn không làm mất câu trả lời đến sau.
// Lịch sử (localStorage) là nơi ghi duy nhất: chỉ ghi đáp khi tin cuối vẫn là đúng câu hỏi đó, nên không bao giờ ghi trùng.
// Tải lại trang thì yêu cầu mất; câu hỏi chưa có đáp còn trong lịch sử và được trả về ô nhập (xem tu-van.tsx).
import { docLichSu, ghiLichSu, type KhoChat, type TinNhan } from "./hoi-thoai";

export const SU_KIEN_XONG = "nvai-tu-van-xong";
export interface ChiTietXong { cau: string; tin: TinNhan }

let treo: string | null = null;
let doi = 0; // tăng khi dữ liệu bị xóa/khôi phục: đáp của đời cũ bị bỏ

/** Câu hỏi đang chờ đáp trong phiên này (null nếu không có). */
export const cauDangCho = (): string | null => treo;

export function huyCho(): void { doi++; treo = null; }
if (typeof window !== "undefined") window.addEventListener("nvai-lam-lai", huyCho);

/** Ghi câu hỏi vào lịch sử, chạy `lay` ở nền kèm stream onChunk, rồi ghi đáp và báo cho màn đang mở (nếu có). */
export async function guiNen(
  kho: KhoChat,
  cau: string,
  truoc: TinNhan[],
  lay: (onChunk?: (doan: string) => void) => Promise<TinNhan>,
  onChunk?: (doan: string) => void
): Promise<void> {
  const dau = doi;
  treo = cau;
  ghiLichSu(kho, [...truoc, { vai: "em", chu: cau }]);
  let tin: TinNhan | null = null;
  try {
    tin = await lay((doan) => {
      if (dau === doi) onChunk?.(doan);
    });
  } catch { /* lay không được ném; nếu ném thì chỉ nhả khóa chờ */ }
  if (dau !== doi) return;
  treo = null;
  if (!tin) return;
  const h = docLichSu(kho), cuoi = h[h.length - 1];
  if (cuoi?.vai !== "em" || cuoi.chu !== cau) return; // lịch sử đã đổi (xóa, hỏi lại): bỏ đáp, không ghi trùng
  ghiLichSu(kho, [...h, tin]);
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent<ChiTietXong>(SU_KIEN_XONG, { detail: { cau, tin } }));
}

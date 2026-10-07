// Lưu một bản ghi CMS rồi đưa tới trạng thái mong muốn. Mỗi bước là một lời gọi thật; bước nào lỗi thì ném lỗi
// và `onBuoc` đã báo bản ghi đang ở đâu, để bấm lại không tạo trùng.
import { doiTrangThai, suaBanNhap, taoBanGhi, taoBanSuaDoi, type BanGhiCms, type NguonGui } from "@cms/may-chu/ban-ghi-api";

export type MucTieuLuu = "nhap" | "gui" | "duyet";

export async function luuVaChuyen(p: {
  hien: BanGhiCms | null;
  entityType: string;
  entityId: string;
  data: Record<string, unknown>;
  nguon: NguonGui;
  ghiChu: string;
  muc: MucTieuLuu;
  onBuoc: (b: BanGhiCms) => void;
}): Promise<BanGhiCms> {
  let b = p.hien;
  if (!b) b = await taoBanGhi({ entityType: p.entityType, entityId: p.entityId, data: p.data, source: p.nguon, changeNote: p.ghiChu });
  else if (b.status === "PUBLISHED") b = await taoBanSuaDoi(b.id, p.data, p.nguon, p.ghiChu);
  else if (b.status === "DRAFT" || b.status === "REJECTED") b = await suaBanNhap(b.id, p.data, p.nguon, p.ghiChu);
  p.onBuoc(b);
  if (p.muc === "nhap") return b;
  if (b.status !== "SUBMITTED") { b = await doiTrangThai(b.id, "SUBMITTED"); p.onBuoc(b); }
  if (p.muc === "duyet") { b = await doiTrangThai(b.id, "APPROVED"); p.onBuoc(b); }
  return b;
}

export const THONG_BAO_LUU: Record<MucTieuLuu, string> = {
  duyet: "Đã lưu và duyệt. Mục này đang chờ bạn bấm Xuất bản để học sinh thấy.",
  gui: "Đã gửi duyệt. Quản trị viên sẽ xem và duyệt.",
  nhap: "Đã lưu bản nháp. Mục này chưa được gửi duyệt.",
};

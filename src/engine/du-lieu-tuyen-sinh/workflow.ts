import type {
  BanGhiCms,
  LoaiThucTheCms,
  NguonKiemChung,
  NhatKyKiemToanCms,
  TrangThaiCms,
  VaiTroCms,
} from "./kieu";

export interface KetQuaWorkflow<T = BanGhiCms> {
  thanhCong: boolean;
  duLieu?: T;
  loi?: string;
  auditLog?: NhatKyKiemToanCms;
}

/** Kiểm tra tính hợp lệ của Nguồn kiểm chứng (Provenance) */
export function kiemTraNguonKiemChung(nguon: unknown): { hopLe: boolean; lyDo?: string } {
  if (!nguon || typeof nguon !== "object") {
    return { hopLe: false, lyDo: "Nguồn kiểm chứng không được để trống" };
  }
  const n = nguon as Partial<NguonKiemChung>;
  if (!n.url || typeof n.url !== "string" || !n.url.startsWith("http")) {
    return { hopLe: false, lyDo: "Link nguồn phải là đường dẫn URL hợp lệ (bắt đầu bằng http/https)" };
  }
  if (!n.donViCongBo || n.donViCongBo.trim().length < 2) {
    return { hopLe: false, lyDo: "Đơn vị công bố thông tin là bắt buộc (ví dụ: Trường ĐH Bách Khoa, Bộ GD&ĐT)" };
  }
  if (!n.tieuDe || n.tieuDe.trim().length < 3) {
    return { hopLe: false, lyDo: "Tiêu đề văn bản/thông báo nguồn là bắt buộc" };
  }
  return { hopLe: true };
}

/** Kiểm tra quyền thực thi theo vai trò */
export function coQuyenThucHien(
  vaiTro: VaiTroCms,
  hanhDong: "CREATE" | "EDIT" | "SUBMIT" | "REVIEW" | "APPROVE" | "REJECT" | "PUBLISH" | "ROLLBACK" | "ARCHIVE",
): boolean {
  switch (hanhDong) {
    case "CREATE":
    case "EDIT":
    case "SUBMIT":
      return ["contributor", "editor", "reviewer", "admin"].includes(vaiTro);
    case "REVIEW":
    case "APPROVE":
    case "REJECT":
      return ["reviewer", "admin"].includes(vaiTro);
    case "PUBLISH":
    case "ROLLBACK":
    case "ARCHIVE":
      return vaiTro === "admin";
    default:
      return false;
  }
}

/** Tạo bản nháp mới (Draft) */
export function taoBanNhapMoi(params: {
  id: string;
  entityType: LoaiThucTheCms;
  entityId: string;
  data: unknown;
  source: NguonKiemChung;
  changeNote: string;
  importance?: BanGhiCms["importance"];
  actorEmail: string;
  actorRole: VaiTroCms;
  now?: string;
}): KetQuaWorkflow<BanGhiCms> {
  const { id, entityType, entityId, data, source, changeNote, importance = "normal", actorEmail, actorRole, now = new Date().toISOString() } = params;

  if (!coQuyenThucHien(actorRole, "CREATE")) {
    return { thanhCong: false, loi: "Bạn không có quyền tạo bản ghi CMS mới" };
  }

  const ktNguon = kiemTraNguonKiemChung(source);
  if (!ktNguon.hopLe) {
    return { thanhCong: false, loi: ktNguon.lyDo };
  }

  const banGhi: BanGhiCms = {
    id,
    entityType,
    entityId,
    version: 1,
    status: "DRAFT",
    data,
    source,
    importance,
    changeNote: changeNote || "Tạo mới bản ghi",
    createdBy: actorEmail,
    createdAt: now,
    updatedBy: actorEmail,
    updatedAt: now,
  };

  const auditLog: NhatKyKiemToanCms = {
    actorId: actorEmail,
    actorEmail,
    action: "CREATE",
    entityType,
    entityId,
    version: 1,
    note: changeNote,
    timestamp: now,
  };

  return { thanhCong: true, duLieu: banGhi, auditLog };
}

/** Tạo bản nháp chỉnh sửa từ bản ghi đã PUBLISHED (Không sửa trực tiếp trên Production) */
export function taoPhienBanSuaDoi(params: {
  newId: string;
  banGhiHienTai: BanGhiCms;
  duLieuMoi: unknown;
  sourceMoi: NguonKiemChung;
  changeNote: string;
  importance?: BanGhiCms["importance"];
  actorEmail: string;
  actorRole: VaiTroCms;
  now?: string;
}): KetQuaWorkflow<BanGhiCms> {
  const { newId, banGhiHienTai, duLieuMoi, sourceMoi, changeNote, importance, actorEmail, actorRole, now = new Date().toISOString() } = params;

  if (!coQuyenThucHien(actorRole, "EDIT")) {
    return { thanhCong: false, loi: "Bạn không có quyền chỉnh sửa bản ghi này" };
  }

  const ktNguon = kiemTraNguonKiemChung(sourceMoi);
  if (!ktNguon.hopLe) {
    return { thanhCong: false, loi: ktNguon.lyDo };
  }

  const banNhapMoi: BanGhiCms = {
    ...banGhiHienTai,
    id: newId,
    version: banGhiHienTai.version + 1,
    status: "DRAFT",
    data: duLieuMoi,
    source: sourceMoi,
    importance: importance || banGhiHienTai.importance,
    changeNote,
    previousVersionId: banGhiHienTai.id,
    rejectionReason: undefined,
    createdBy: actorEmail,
    createdAt: now,
    updatedBy: actorEmail,
    updatedAt: now,
    submittedBy: undefined,
    submittedAt: undefined,
    reviewedBy: undefined,
    reviewedAt: undefined,
    publishedBy: undefined,
    publishedAt: undefined,
  };

  const auditLog: NhatKyKiemToanCms = {
    actorId: actorEmail,
    actorEmail,
    action: "CREATE",
    entityType: banGhiHienTai.entityType,
    entityId: banGhiHienTai.entityId,
    version: banNhapMoi.version,
    note: `Tạo phiên bản sửa đổi v${banNhapMoi.version} từ v${banGhiHienTai.version}: ${changeNote}`,
    timestamp: now,
  };

  return { thanhCong: true, duLieu: banNhapMoi, auditLog };
}

/** Chuyển trạng thái bản ghi trong Workflow */
export function chuyenTrangThaiWorkflow(params: {
  banGhi: BanGhiCms;
  trangThaiDich: TrangThaiCms;
  actorEmail: string;
  actorRole: VaiTroCms;
  lyDoTuChoi?: string;
  now?: string;
}): KetQuaWorkflow<BanGhiCms> {
  const { banGhi, trangThaiDich, actorEmail, actorRole, lyDoTuChoi, now = new Date().toISOString() } = params;

  // 1. Kiểm tra quyền
  if (trangThaiDich === "SUBMITTED" && !coQuyenThucHien(actorRole, "SUBMIT")) {
    return { thanhCong: false, loi: "Không có quyền gửi duyệt" };
  }
  if ((trangThaiDich === "APPROVED" || trangThaiDich === "REJECTED" || trangThaiDich === "IN_REVIEW") && !coQuyenThucHien(actorRole, "APPROVE")) {
    return { thanhCong: false, loi: "Chỉ Reviewer hoặc Admin mới có quyền duyệt hoặc từ chối" };
  }
  if (trangThaiDich === "PUBLISHED" && !coQuyenThucHien(actorRole, "PUBLISH")) {
    return { thanhCong: false, loi: "Chỉ Admin mới có quyền xuất bản lên Snapshot chính thức" };
  }

  // 2. Kiểm tra tính hợp lệ của chu trình chuyển trạng thái
  const hienTai = banGhi.status;
  if (trangThaiDich === "SUBMITTED" && hienTai !== "DRAFT" && hienTai !== "REJECTED") {
    return { thanhCong: false, loi: `Không thể gửi duyệt bản ghi đang ở trạng thái ${hienTai}` };
  }
  if (trangThaiDich === "IN_REVIEW" && hienTai !== "SUBMITTED") {
    return { thanhCong: false, loi: `Chỉ có thể chuyển sang kiểm tra khi bản ghi đã gửi duyệt (SUBMITTED)` };
  }
  if (trangThaiDich === "APPROVED" && hienTai !== "SUBMITTED" && hienTai !== "IN_REVIEW") {
    return { thanhCong: false, loi: `Bản ghi phải ở trạng thái SUBMITTED hoặc IN_REVIEW trước khi phê duyệt` };
  }
  if (trangThaiDich === "REJECTED" && (hienTai !== "SUBMITTED" && hienTai !== "IN_REVIEW")) {
    return { thanhCong: false, loi: `Chỉ có thể từ chối bản ghi đang gửi duyệt hoặc đang kiểm tra` };
  }
  if (trangThaiDich === "REJECTED" && (!lyDoTuChoi || lyDoTuChoi.trim().length < 3)) {
    return { thanhCong: false, loi: "Bắt buộc phải cung cấp lý do từ chối rõ ràng để CTV chỉnh sửa" };
  }
  if (trangThaiDich === "PUBLISHED" && hienTai !== "APPROVED") {
    return { thanhCong: false, loi: `Bản ghi phải được APPROVED trước khi PUBLISHED` };
  }

  // 3. Tạo bản ghi cập nhật
  const banGhiMoi: BanGhiCms = {
    ...banGhi,
    status: trangThaiDich,
    updatedBy: actorEmail,
    updatedAt: now,
  };

  let action: NhatKyKiemToanCms["action"] = "SUBMIT";

  if (trangThaiDich === "SUBMITTED") {
    banGhiMoi.submittedBy = actorEmail;
    banGhiMoi.submittedAt = now;
    action = "SUBMIT";
  } else if (trangThaiDich === "IN_REVIEW") {
    banGhiMoi.reviewedBy = actorEmail;
    action = "START_REVIEW";
  } else if (trangThaiDich === "APPROVED") {
    banGhiMoi.reviewedBy = actorEmail;
    banGhiMoi.reviewedAt = now;
    action = "APPROVE";
  } else if (trangThaiDich === "REJECTED") {
    banGhiMoi.reviewedBy = actorEmail;
    banGhiMoi.reviewedAt = now;
    banGhiMoi.rejectionReason = lyDoTuChoi;
    action = "REJECT";
  } else if (trangThaiDich === "PUBLISHED") {
    banGhiMoi.publishedBy = actorEmail;
    banGhiMoi.publishedAt = now;
    action = "PUBLISH";
  }

  const auditLog: NhatKyKiemToanCms = {
    actorId: actorEmail,
    actorEmail,
    action,
    entityType: banGhi.entityType,
    entityId: banGhi.entityId,
    version: banGhi.version,
    note: lyDoTuChoi || `Chuyển trạng thái từ ${hienTai} -> ${trangThaiDich}`,
    timestamp: now,
  };

  return { thanhCong: true, duLieu: banGhiMoi, auditLog };
}

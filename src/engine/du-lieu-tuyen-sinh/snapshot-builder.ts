import type {
  BanGhiCms,
  DatasetMeta,
  ManifestTuyenSinh,
  SnapshotCongDong,
  SnapshotDiemChuanHieuChinh,
  SnapshotHocBong,
  SnapshotHocPhi,
  SnapshotThongBao,
  SnapshotTruong,
  SnapshotTuyenSinh,
  ThayDoiSnapshot,
} from "./kieu";

/** Tính mã băm SHA-256 nhanh cho chuỗi ký tự UTF-8 (dùng crypto chuẩn hoặc thuật toán băm thuần) */
export async function tinhHashSha256(noiDung: string): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(noiDung);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  // Fallback băm deterministic cho môi trường không có crypto.subtle
  let hash = 0;
  for (let i = 0; i < noiDung.length; i++) {
    const char = noiDung.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, "0");
}

export interface KetQuaXayDungSnapshot {
  manifest: ManifestTuyenSinh;
  datasets: {
    schools: { duLieu: SnapshotTruong[]; json: string; meta: DatasetMeta };
    tuition: { duLieu: SnapshotHocPhi[]; json: string; meta: DatasetMeta };
    scholarships: { duLieu: SnapshotHocBong[]; json: string; meta: DatasetMeta };
    admissions: { duLieu: SnapshotTuyenSinh[]; json: string; meta: DatasetMeta };
    announcements: { duLieu: SnapshotThongBao[]; json: string; meta: DatasetMeta };
    cutoffScores: { duLieu: SnapshotDiemChuanHieuChinh[]; json: string; meta: DatasetMeta };
    community: { duLieu: SnapshotCongDong[]; json: string; meta: DatasetMeta };
  };
}

/** Lọc bỏ các thông tin nội bộ CMS trước khi đóng gói thành Snapshot công khai */
export function lamSachDuLieuPublic<T>(duLieu: T): T {
  if (!duLieu || typeof duLieu !== "object") return duLieu;
  const clone = JSON.parse(JSON.stringify(duLieu)) as Record<string, unknown>;
  delete clone.internalNote;
  delete clone.moderationNotes;
  delete clone.reviewerComments;
  delete clone.rawSubmission;
  return clone as T;
}

/**
 * Xây dựng các tệp snapshot immutable phân vùng theo miền và sinh `manifest.json`
 */
export async function taoSnapshotVaManifest(
  danhSachBanGhiPublished: BanGhiCms[],
  dataVersion: string,
  baseSnapshotUrl = "/snapshots",
): Promise<KetQuaXayDungSnapshot> {
  const generatedAt = new Date().toISOString();

  const dsTruong: SnapshotTruong[] = [];
  const dsHocPhi: SnapshotHocPhi[] = [];
  const dsHocBong: SnapshotHocBong[] = [];
  const dsTuyenSinh: SnapshotTuyenSinh[] = [];
  const dsThongBao: SnapshotThongBao[] = [];
  const dsDiemChuan: SnapshotDiemChuanHieuChinh[] = [];
  const dsCongDong: SnapshotCongDong[] = [];
  const recentChanges: ThayDoiSnapshot[] = [];

  for (const bg of danhSachBanGhiPublished) {
    if (bg.status !== "PUBLISHED") continue;

    const dataClean = lamSachDuLieuPublic(bg.data);

    switch (bg.entityType) {
      case "school":
        dsTruong.push(dataClean as SnapshotTruong);
        break;
      case "tuition":
        dsHocPhi.push(dataClean as SnapshotHocPhi);
        break;
      case "scholarship":
        dsHocBong.push(dataClean as SnapshotHocBong);
        break;
      case "admission":
        dsTuyenSinh.push(dataClean as SnapshotTuyenSinh);
        break;
      case "announcement":
        dsThongBao.push(dataClean as SnapshotThongBao);
        break;
      case "cutoff_score":
        dsDiemChuan.push(dataClean as SnapshotDiemChuanHieuChinh);
        break;
      case "noi_luu_tru":
      case "review":
      case "luu_y":
        dsCongDong.push({
          id: bg.entityId,
          loai: bg.entityType,
          maTruong: bg.entityId.split("-")[0].toUpperCase(),
          noiDung: dataClean as Record<string, unknown>,
          nguon: bg.source,
          capNhatLuc: bg.updatedAt,
        });
        break;
    }

    if (bg.importance === "important" || bg.importance === "critical") {
      recentChanges.push({
        entityType: bg.entityType,
        entityId: bg.entityId,
        field: bg.entityType,
        importance: bg.importance,
        title: bg.changeNote || `Cập nhật ${bg.entityType} ${bg.entityId}`,
        summary: `Cập nhật thông tin chính thức từ ${bg.source.donViCongBo}`,
        updatedAt: bg.updatedAt,
      });
    }
  }

  // Chuyển sang JSON và tính Hash cho từng Domain Dataset
  const buildDataset = async <T>(
    ten: string,
    duLieu: T[],
  ): Promise<{ duLieu: T[]; json: string; meta: DatasetMeta }> => {
    const jsonStr = JSON.stringify(duLieu);
    const hash = await tinhHashSha256(jsonStr);
    const shortHash = hash.slice(0, 8);
    const url = `${baseSnapshotUrl}/${ten}.${dataVersion}.${shortHash}.json`;
    const size = new TextEncoder().encode(jsonStr).length;

    return {
      duLieu,
      json: jsonStr,
      meta: {
        version: shortHash,
        hash,
        url,
        size,
        recordCount: duLieu.length,
        updatedAt: generatedAt,
      },
    };
  };

  const [schools, tuition, scholarships, admissions, announcements, cutoffScores, community] = await Promise.all([
    buildDataset("schools", dsTruong),
    buildDataset("tuition", dsHocPhi),
    buildDataset("scholarships", dsHocBong),
    buildDataset("admissions", dsTuyenSinh),
    buildDataset("announcements", dsThongBao),
    buildDataset("cutoff-scores", dsDiemChuan),
    buildDataset("community", dsCongDong),
  ]);

  const manifest: ManifestTuyenSinh = {
    schemaVersion: 1,
    dataVersion,
    generatedAt,
    datasets: {
      schools: schools.meta,
      tuition: tuition.meta,
      scholarships: scholarships.meta,
      admissions: admissions.meta,
      announcements: announcements.meta,
      cutoffScores: cutoffScores.meta,
      community: community.meta,
    },
    recentChanges: recentChanges.slice(0, 10), // Giữ tối đa 10 thay đổi mới nhất
  };

  return {
    manifest,
    datasets: {
      schools,
      tuition,
      scholarships,
      admissions,
      announcements,
      cutoffScores,
      community,
    },
  };
}

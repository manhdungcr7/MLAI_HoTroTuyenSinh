import type { ManifestTuyenSinh, ThayDoiSnapshot } from "./kieu";
import { khoIndexedDB } from "./storage-indexeddb";
import { tinhHashSha256 } from "./snapshot-builder";

export const SU_KIEN_CAP_NHAT_DU_LIEU = "nvai-data-updated";

export interface TrangThaiDongBo {
  lanKiemTraCuoi: string | null;
  dangDongBo: boolean;
  coCapNhatMoi: boolean;
  thayDoiGanDay: ThayDoiSnapshot[];
  loi: string | null;
}

export const LOI_CHUA_XUAT_BAN = "Chưa có bản dữ liệu nào được xuất bản";
const KHOA_META_MANIFEST = "manifest_local";
const KHOA_META_LAST_CHECK = "last_checked_at";

const TTL_SOFT_CHECK_MS = 6 * 60 * 60 * 1000; // 6 giờ

export class BoDongBoDuLieu {
  private dangChay = false;
  private manifestEndpoint: string;

  /** `/api/manifest` là nguồn chính; `/data/manifest.json` là bản tĩnh đi kèm bản dựng, dùng khi API chưa có bản xuất bản. */
  constructor(manifestEndpoint = "/api/manifest", private manifestDuPhong = "/data/manifest.json") {
    this.manifestEndpoint = manifestEndpoint;
  }

  /**
   * Trả về manifest có ít nhất một bộ dữ liệu đã xuất bản, hoặc ném lỗi "chưa có bản xuất bản".
   * API trả được manifest hợp lệ nhưng rỗng (chưa ai xuất bản) thì DỪNG, không thử bản tĩnh và không xin tệp nào
   * (tránh một loạt yêu cầu 404 vô ích; app dùng dữ liệu đóng gói sẵn). Chỉ khi API lỗi mạng/HTTP mới thử bản tĩnh.
   */
  private async layManifestTuXa(): Promise<ManifestTuyenSinh> {
    const hopLe = (m: unknown): m is ManifestTuyenSinh => {
      const x = m as ManifestTuyenSinh | null;
      return !!x?.schemaVersion && !!x.datasets;
    };
    const coXuatBan = (m: ManifestTuyenSinh) => Object.values(m.datasets).some((d) => d.hash);
    let loiApi = "";
    for (const url of [this.manifestEndpoint, this.manifestDuPhong]) {
      try {
        const resp = await fetch(url, { headers: { Accept: "application/json" }, cache: "no-cache" });
        if (!resp.ok) { loiApi ||= `Không tải được manifest: HTTP ${resp.status}`; continue; }
        const m: unknown = await resp.json();
        if (hopLe(m)) {
          if (coXuatBan(m)) return m;
          throw new Error(LOI_CHUA_XUAT_BAN);
        }
        loiApi ||= "Manifest sai định dạng";
      } catch (e) {
        if (e instanceof Error && e.message === LOI_CHUA_XUAT_BAN) throw e;
        loiApi ||= e instanceof Error ? e.message : String(e);
      }
    }
    throw new Error(loiApi || "Không tải được manifest");
  }

  /** Lấy metadata manifest đang lưu cục bộ */
  layManifestCucBo(): ManifestTuyenSinh | null {
    return khoIndexedDB.docMetadata<ManifestTuyenSinh>(KHOA_META_MANIFEST);
  }

  /** Kiểm tra xem có cần gọi kiểm tra manifest từ xa hay không dựa trên TTL */
  canKiemTraManifest(): boolean {
    const lastCheckStr = khoIndexedDB.docMetadata<string>(KHOA_META_LAST_CHECK);
    if (!lastCheckStr) return true;

    const lastCheck = new Date(lastCheckStr).getTime();
    if (Number.isNaN(lastCheck)) return true;

    const bayGio = Date.now();
    return bayGio - lastCheck >= TTL_SOFT_CHECK_MS;
  }

  /**
   * Đồng bộ nền thông minh:
   * 1. Kiểm tra manifest.json từ xa (chỉ tải 1 payload JSON rất nhỏ)
   * 2. So sánh hash từng dataset (schools, tuition, scholarships, admissions...)
   * 3. Chỉ tải đúng những dataset có hash thay đổi
   * 4. Xác thực tính toàn vẹn (Integrity hash) trước khi ghi vào IndexedDB
   * 5. Bắn Event thông báo UI cập nhật
   */
  async dongBoNen(force = false): Promise<TrangThaiDongBo> {
    if (this.dangChay) {
      return {
        lanKiemTraCuoi: khoIndexedDB.docMetadata<string>(KHOA_META_LAST_CHECK),
        dangDongBo: true,
        coCapNhatMoi: false,
        thayDoiGanDay: [],
        loi: null,
      };
    }

    if (!force && !this.canKiemTraManifest()) {
      const manifestLocal = this.layManifestCucBo();
      return {
        lanKiemTraCuoi: khoIndexedDB.docMetadata<string>(KHOA_META_LAST_CHECK),
        dangDongBo: false,
        coCapNhatMoi: false,
        thayDoiGanDay: manifestLocal?.recentChanges || [],
        loi: null,
      };
    }

    this.dangChay = true;
    try {
      const remoteManifest = await this.layManifestTuXa();

      const localManifest = this.layManifestCucBo();
      const cacDatasetCanTai: Array<{ key: string; url: string; expectedHash: string }> = [];

      for (const [key, meta] of Object.entries(remoteManifest.datasets)) {
        const localMeta = localManifest?.datasets?.[key as keyof typeof remoteManifest.datasets];
        if (!meta.hash) continue; // bộ này chưa xuất bản: không có tệp để xin
        if (!localMeta || localMeta.hash !== meta.hash || force) {
          cacDatasetCanTai.push({ key, url: meta.url, expectedHash: meta.hash });
        }
      }

      let coThayDoi = false;

      // Tải song song các dataset cần cập nhật
      if (cacDatasetCanTai.length > 0) {
        await Promise.all(
          cacDatasetCanTai.map(async ({ key, url, expectedHash }) => {
            try {
              const res = await fetch(url);
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              const jsonText = await res.text();

              // Kiểm tra tính toàn vẹn (Integrity check)
              const computedHash = await tinhHashSha256(jsonText);
              if (computedHash !== expectedHash && expectedHash.length === 64) {
                console.warn(`[BoDongBo] Hash mismatch cho dataset ${key}. Bỏ qua bản ghi lỗi.`);
                return;
              }

              const data = JSON.parse(jsonText);
              await khoIndexedDB.luuDataset(key, data);
              coThayDoi = true;
            } catch (err) {
              console.error(`[BoDongBo] Lỗi tải dataset ${key} từ ${url}:`, err);
            }
          }),
        );
      }

      const nowIso = new Date().toISOString();
      await khoIndexedDB.luuMetadata(KHOA_META_MANIFEST, remoteManifest);
      await khoIndexedDB.luuMetadata(KHOA_META_LAST_CHECK, nowIso);

      if (coThayDoi && typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent(SU_KIEN_CAP_NHAT_DU_LIEU, {
            detail: {
              version: remoteManifest.dataVersion,
              recentChanges: remoteManifest.recentChanges,
            },
          }),
        );
      }

      return {
        lanKiemTraCuoi: nowIso,
        dangDongBo: false,
        coCapNhatMoi: coThayDoi,
        thayDoiGanDay: remoteManifest.recentChanges || [],
        loi: null,
      };
    } catch (e) {
      const errMessage = e instanceof Error ? e.message : String(e);
      return {
        lanKiemTraCuoi: khoIndexedDB.docMetadata<string>(KHOA_META_LAST_CHECK),
        dangDongBo: false,
        coCapNhatMoi: false,
        thayDoiGanDay: this.layManifestCucBo()?.recentChanges || [],
        loi: errMessage,
      };
    } finally {
      this.dangChay = false;
    }
  }
}

export const boDongBoDuLieu = new BoDongBoDuLieu();

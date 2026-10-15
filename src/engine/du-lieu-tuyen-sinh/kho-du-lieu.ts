import { LUA_CHON as CORE_LUA_CHON } from "@/data/lua-chon-that";
import { datDanhMuc, napDanhMuc } from "@/data/lua-chon-mau";
import type { LuaChon } from "@/state/types";
import { boDongBoDuLieu, SU_KIEN_CAP_NHAT_DU_LIEU } from "./bo-dong-bo";
import { hopNhatLuaChonVaCms, layChiTietTruongHopNhat, type DuLieuTruongHopNhat, type TapDuLieuCmsSnapshot } from "./hop-nhat";
import type {
  SnapshotCongDong,
  SnapshotDiemChuanHieuChinh,
  SnapshotHocBong,
  SnapshotHocPhi,
  SnapshotThongBao,
  SnapshotTruong,
  SnapshotTuyenSinh,
} from "./kieu";
import { khoIndexedDB } from "./storage-indexeddb";

export class KhoDuLieuTuyenSinh {
  private static instance: KhoDuLieuTuyenSinh | null = null;
  private coreLuaChon: LuaChon[] = CORE_LUA_CHON;
  private cmsSnapshot: Partial<TapDuLieuCmsSnapshot> = {};
  private danhSachHopNhat: LuaChon[] = CORE_LUA_CHON;
  private mapHopNhatTheoId: Map<string, LuaChon> = new Map();
  private daKhoiTao = false;
  private dangKhoiTao: Promise<void> | null = null;

  private constructor() {
    this.capNhatMap();
    if (typeof window !== "undefined") {
      window.addEventListener(SU_KIEN_CAP_NHAT_DU_LIEU, () => {
        void this.napTuCacheIndexedDB();
      });
    }
  }

  public static layKho(): KhoDuLieuTuyenSinh {
    if (!KhoDuLieuTuyenSinh.instance) {
      KhoDuLieuTuyenSinh.instance = new KhoDuLieuTuyenSinh();
    }
    return KhoDuLieuTuyenSinh.instance;
  }

  private capNhatMap() {
    this.danhSachHopNhat = hopNhatLuaChonVaCms(this.coreLuaChon, this.cmsSnapshot);
    this.mapHopNhatTheoId = new Map(this.danhSachHopNhat.map((item) => [item.id, item]));
    datDanhMuc(this.danhSachHopNhat); // mọi màn đọc LUA_CHON_MAU/tim đều thấy bản đã hợp nhất
  }

  /**
   * Khởi động nạp dữ liệu từ Cache (IndexedDB) tức thì, sau đó chạy background sync
   */
  khoiTao(): Promise<void> {
    this.dangKhoiTao ??= this.khoiTaoThat().catch((e) => { this.dangKhoiTao = null; throw e; });
    return this.dangKhoiTao;
  }

  daSanSang(): boolean {
    return this.daKhoiTao;
  }

  /** Dữ liệu gốc (nạp lười) và bản hợp nhất với cache CMS đã sẵn sàng: màn cần danh mục chờ promise này. */
  sanSang(): Promise<void> {
    return this.khoiTao();
  }

  private async khoiTaoThat(): Promise<void> {
    if (this.daKhoiTao) return;
    await napDanhMuc(); // dữ liệu gốc nạp lười; phải xong trước khi hợp nhất với bản CMS
    await this.napTuCacheIndexedDB();
    this.daKhoiTao = true;

    // Chạy đồng bộ nền trong microtask không chặn luồng render UI
    setTimeout(() => {
      void boDongBoDuLieu.dongBoNen();
    }, 100);
  }

  private async napTuCacheIndexedDB(): Promise<void> {
    await napDanhMuc();
    try {
      const [schools, tuition, scholarships, admissions, announcements, cutoffScores, community] = await Promise.all([
        khoIndexedDB.docDataset<SnapshotTruong[]>("schools"),
        khoIndexedDB.docDataset<SnapshotHocPhi[]>("tuition"),
        khoIndexedDB.docDataset<SnapshotHocBong[]>("scholarships"),
        khoIndexedDB.docDataset<SnapshotTuyenSinh[]>("admissions"),
        khoIndexedDB.docDataset<SnapshotThongBao[]>("announcements"),
        khoIndexedDB.docDataset<SnapshotDiemChuanHieuChinh[]>("cutoffScores"),
        khoIndexedDB.docDataset<SnapshotCongDong[]>("community"),
      ]);

      this.cmsSnapshot = {
        schools: schools || [],
        tuition: tuition || [],
        scholarships: scholarships || [],
        admissions: admissions || [],
        announcements: announcements || [],
        cutoffScores: cutoffScores || [],
        community: community || [],
      };

      this.capNhatMap();
    } catch (err) {
      console.warn("[KhoDuLieu] Không thể đọc cache IndexedDB, dùng core dataset:", err);
    }
  }

  /** Lấy toàn bộ danh sách ngành/lựa chọn đã merge chuẩn */
  layTatCaLuaChon(): LuaChon[] {
    return this.danhSachHopNhat;
  }

  /** Lấy 1 lựa chọn cụ thể theo ID */
  layLuaChonTheoId(id: string): LuaChon | undefined {
    return this.mapHopNhatTheoId.get(id);
  }

  /** Lấy chi tiết thông tin trường (Kênh chính thức, Ký túc xá, Học bổng, Thông báo...) */
  layChiTietTruong(maTruong: string): DuLieuTruongHopNhat | null {
    return layChiTietTruongHopNhat(maTruong, this.coreLuaChon, this.cmsSnapshot);
  }

  /** Lấy danh sách học bổng */
  layDanhSachHocBong(maTruong?: string): SnapshotHocBong[] {
    const list = this.cmsSnapshot.scholarships || [];
    return maTruong ? list.filter((h) => h.maTruong === maTruong) : list;
  }

  /** Lấy danh sách thông báo tuyển sinh mới */
  layDanhSachThongBao(maTruong?: string): SnapshotThongBao[] {
    const list = this.cmsSnapshot.announcements || [];
    return maTruong ? list.filter((t) => !t.maTruong || t.maTruong === maTruong) : list;
  }
}

export const khoDuLieu = KhoDuLieuTuyenSinh.layKho();

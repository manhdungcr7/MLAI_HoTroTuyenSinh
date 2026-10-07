// Lưu trữ IndexedDB siêu nhẹ, an toàn, có memory fallback khi gặp Safari Private Mode hoặc Storage bị khóa

const DB_NAME = "nvai_tuyen_sinh_db";
const DB_VERSION = 1;
const STORE_DATASETS = "datasets";
const STORE_METADATA = "metadata";

class KhoIndexedDB {
  private dbPromise: Promise<IDBDatabase | null> | null = null;
  private boNhoTam: Map<string, unknown> = new Map();

  private async layDB(): Promise<IDBDatabase | null> {
    if (typeof window === "undefined" || !window.indexedDB) {
      return null;
    }
    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve) => {
        try {
          const req = indexedDB.open(DB_NAME, DB_VERSION);
          req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(STORE_DATASETS)) {
              db.createObjectStore(STORE_DATASETS);
            }
            if (!db.objectStoreNames.contains(STORE_METADATA)) {
              db.createObjectStore(STORE_METADATA);
            }
          };
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => resolve(null);
        } catch {
          resolve(null);
        }
      });
    }
    return this.dbPromise;
  }

  async luuDataset<T>(tenDomain: string, duLieu: T): Promise<boolean> {
    this.boNhoTam.set(`dataset:${tenDomain}`, duLieu);
    const db = await this.layDB();
    if (!db) return true;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_DATASETS, "readwrite");
        const store = tx.objectStore(STORE_DATASETS);
        const req = store.put(duLieu, tenDomain);
        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(false);
      } catch {
        resolve(false);
      }
    });
  }

  async docDataset<T>(tenDomain: string): Promise<T | null> {
    if (this.boNhoTam.has(`dataset:${tenDomain}`)) {
      return this.boNhoTam.get(`dataset:${tenDomain}`) as T;
    }
    const db = await this.layDB();
    if (!db) return null;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_DATASETS, "readonly");
        const store = tx.objectStore(STORE_DATASETS);
        const req = store.get(tenDomain);
        req.onsuccess = () => {
          if (req.result) {
            this.boNhoTam.set(`dataset:${tenDomain}`, req.result);
            resolve(req.result as T);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  async luuMetadata<T>(khoa: string, giaTri: T): Promise<void> {
    this.boNhoTam.set(`meta:${khoa}`, giaTri);
    // Cũng lưu vào localStorage để truy cập tức thì đồng bộ
    try {
      localStorage.setItem(`nvai_meta_${khoa}`, JSON.stringify(giaTri));
    } catch {
      // bỏ qua nếu quota đầy
    }
    const db = await this.layDB();
    if (!db) return;

    try {
      const tx = db.transaction(STORE_METADATA, "readwrite");
      tx.objectStore(STORE_METADATA).put(giaTri, khoa);
    } catch {
      // noop
    }
  }

  docMetadata<T>(khoa: string): T | null {
    if (this.boNhoTam.has(`meta:${khoa}`)) {
      return this.boNhoTam.get(`meta:${khoa}`) as T;
    }
    try {
      const t = localStorage.getItem(`nvai_meta_${khoa}`);
      if (t) {
        const val = JSON.parse(t) as T;
        this.boNhoTam.set(`meta:${khoa}`, val);
        return val;
      }
    } catch {
      // noop
    }
    return null;
  }

  async xoaDatasetCache(): Promise<void> {
    this.boNhoTam.clear();
    const db = await this.layDB();
    if (!db) return;
    try {
      const tx = db.transaction([STORE_DATASETS, STORE_METADATA], "readwrite");
      tx.objectStore(STORE_DATASETS).clear();
      tx.objectStore(STORE_METADATA).clear();
    } catch {
      // noop
    }
  }
}

export const khoIndexedDB = new KhoIndexedDB();

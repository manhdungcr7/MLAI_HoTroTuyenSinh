import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { configureShockParameters } from "@/engine/admissions/probability";

type DatasetManifest = {
  schemaVersion: number;
  path: string;
  sha256: string;
  recordCount: number;
  observedAt: string | null;
  yearCoverage: { min: number; max: number } | null;
  sourceHealth: {
    status: "verified" | "partial" | "unknown";
    recordsWithReference: number;
    recordsWithUrl: number;
    recordsWithObservationTimestamp: number;
  };
};

type SnapshotManifest = {
  schemaVersion: number;
  datasetVersion: string;
  nationalShock?: {
    overall_std: number;
    idio_std_overall: number;
    [key: string]: any;
  } | null;
  datasets: { admissions: DatasetManifest };
};

type FreshnessState =
  | { kind: "checking" }
  | { kind: "verified" | "stale" | "unknown"; manifest: SnapshotManifest; cached: boolean }
  | { kind: "error" };

const FreshnessContext = createContext<FreshnessState>({ kind: "checking" });

const CACHE_NAME = "public-datasets-v2";
const LAST_CHECK_KEY = "public-datasets-last-check-v2";
const CHECK_INTERVAL = 24 * 60 * 60 * 1000;
const STALE_AFTER = 10 * 24 * 60 * 60 * 1000;

async function sha256(response: Response): Promise<string> {
  const bytes = await response.clone().arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function parseManifest(value: unknown): SnapshotManifest {
  const candidate = value as SnapshotManifest | null;
  const dataset = candidate?.datasets?.admissions;
  if (
    candidate?.schemaVersion !== 2 ||
    !/^[a-f0-9]{64}$/.test(candidate.datasetVersion) ||
    dataset?.schemaVersion !== 2 ||
    !/^admissions\/[a-f0-9]{64}\.json$/.test(dataset.path) ||
    dataset.sha256 !== candidate.datasetVersion ||
    !Number.isInteger(dataset.recordCount) ||
    dataset.recordCount < 1 ||
    !dataset.sourceHealth ||
    !["verified", "partial", "unknown"].includes(dataset.sourceHealth.status) ||
    ![dataset.sourceHealth.recordsWithReference, dataset.sourceHealth.recordsWithUrl, dataset.sourceHealth.recordsWithObservationTimestamp]
      .every((count) => Number.isInteger(count) && count >= 0 && count <= dataset.recordCount)
  ) {
    throw new Error("Manifest không hợp lệ");
  }
  return candidate;
}

function stateFromManifest(manifest: SnapshotManifest, cached: boolean): FreshnessState {
  if (manifest.nationalShock) {
    configureShockParameters(manifest.nationalShock.overall_std, manifest.nationalShock.idio_std_overall);
  }
  const dataset = manifest.datasets.admissions;
  const observedAt = dataset.observedAt ? Date.parse(dataset.observedAt) : NaN;
  if (Number.isFinite(observedAt) && Date.now() - observedAt > STALE_AFTER) {
    return { kind: "stale", manifest, cached };
  }
  const completeProvenance = dataset.sourceHealth.status === "verified" &&
    dataset.sourceHealth.recordsWithReference === dataset.recordCount &&
    dataset.sourceHealth.recordsWithUrl === dataset.recordCount &&
    dataset.sourceHealth.recordsWithObservationTimestamp === dataset.recordCount;
  if (!Number.isFinite(observedAt) || !completeProvenance) {
    return { kind: "unknown", manifest, cached };
  }
  return { kind: "verified", manifest, cached };
}

async function verifyCachedSnapshot(cache: Cache, manifest: SnapshotManifest): Promise<boolean> {
  const response = await cache.match(`/data/${manifest.datasets.admissions.path}`);
  return Boolean(response && await sha256(response) === manifest.datasets.admissions.sha256);
}

export function DatasetFreshnessProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FreshnessState>({ kind: "checking" });

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      let cache: Cache | null = null;
      let cachedManifest: SnapshotManifest | null = null;
      try {
        cache = "caches" in window ? await caches.open(CACHE_NAME) : null;
        const cachedManifestResponse = await cache?.match("/data/manifest.json");
        if (cachedManifestResponse) {
          try {
            cachedManifest = parseManifest(await cachedManifestResponse.json());
          } catch {
            cachedManifest = null;
          }
        }

        const checkedAt = Number(localStorage.getItem(LAST_CHECK_KEY) || 0);
        const canUseRecentCache = Boolean(
          cachedManifest && cache && Date.now() - checkedAt < CHECK_INTERVAL && await verifyCachedSnapshot(cache, cachedManifest),
        );
        if (!navigator.onLine || canUseRecentCache) {
          if (!cachedManifest || !cache || !await verifyCachedSnapshot(cache, cachedManifest)) {
            throw new Error("Không có bản dữ liệu đã xác minh trong bộ nhớ đệm");
          }
          if (active) setState(stateFromManifest(cachedManifest, true));
          return;
        }

        const manifestResponse = await fetch("/data/manifest.json", { cache: "no-store" });
        if (!manifestResponse.ok) throw new Error("Không tải được manifest dữ liệu");
        const manifest = parseManifest(await manifestResponse.json());
        const snapshotResponse = await fetch(`/data/${manifest.datasets.admissions.path}`, { cache: "force-cache" });
        if (!snapshotResponse.ok || await sha256(snapshotResponse) !== manifest.datasets.admissions.sha256) {
          throw new Error("Hash snapshot không khớp manifest");
        }
        if (cache) {
          await cache.put(`/data/${manifest.datasets.admissions.path}`, snapshotResponse.clone());
          await cache.put("/data/manifest.json", new Response(JSON.stringify(manifest), {
            headers: { "Content-Type": "application/json" },
          }));
        }
        localStorage.setItem(LAST_CHECK_KEY, String(Date.now()));
        if (active) setState(stateFromManifest(manifest, false));
      } catch {
        const hasVerifiedCache = Boolean(
          cachedManifest && cache && await verifyCachedSnapshot(cache, cachedManifest),
        );
        if (active) {
          setState(
            hasVerifiedCache && cachedManifest
              ? stateFromManifest(cachedManifest, true)
              : { kind: "error" },
          );
        }
      }
    };

    void refresh();
    const interval = window.setInterval(() => { void refresh(); }, CHECK_INTERVAL);
    window.addEventListener("online", refresh);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("online", refresh);
    };
  }, []);

  return <FreshnessContext.Provider value={state}>{children}</FreshnessContext.Provider>;
}

export function useDatasetFreshness() {
  return useContext(FreshnessContext);
}

export function DatasetFreshness() {
  const state = useDatasetFreshness();
  const label = (() => {
    if (state.kind === "checking") return "Đang kiểm tra dữ liệu";
    if (state.kind === "error") return "Không xác minh được dữ liệu";
    const { manifest, cached } = state;
    const { yearCoverage, recordCount, sha256: digest } = manifest.datasets.admissions;
    const yearLabel = yearCoverage ? `${yearCoverage.min}–${yearCoverage.max}` : "chưa rõ năm";
    const prefix = state.kind === "stale" ? "Dữ liệu có thể đã cũ" : `Dữ liệu ${yearLabel}`;
    const sourceStatus = state.kind === "verified" ? "nguồn đã xác minh" : "ngày quan sát nguồn chưa xác minh";
    return `${prefix} · ${sourceStatus}${cached ? " · bản đã lưu" : ""}`;
  })();

  const version = state.kind === "verified" || state.kind === "stale" || state.kind === "unknown"
    ? state.manifest.datasetVersion
    : "";
  const count = state.kind === "verified" || state.kind === "stale" || state.kind === "unknown"
    ? state.manifest.datasets.admissions.recordCount
    : 0;
  const digest = state.kind === "verified" || state.kind === "stale" || state.kind === "unknown"
    ? state.manifest.datasets.admissions.sha256
    : "";
  const provenance = state.kind === "verified" || state.kind === "stale" || state.kind === "unknown"
    ? state.manifest.datasets.admissions.sourceHealth
    : null;

  return (
    <span
      role="status"
      aria-live="polite"
      title={`Snapshot ${version || "không rõ"} · ${count} chương trình · nguồn có URL: ${provenance?.recordsWithUrl ?? 0} · có ngày quan sát: ${provenance?.recordsWithObservationTimestamp ?? 0} · SHA-256 ${digest || "chưa xác minh"}`}
      className={`min-w-0 max-w-[38vw] truncate text-[10px] sm:max-w-[28vw] sm:text-xs ${
        state.kind === "verified" ? "text-emerald-700" : "text-amber-700"
      }`}
    >
      {label}
    </span>
  );
}

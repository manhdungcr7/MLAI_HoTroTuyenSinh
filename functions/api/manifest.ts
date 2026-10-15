// Endpoint phân phối Manifest Tuyển sinh cho Web học sinh
// CDN Cache 5 phút cho manifest (Metadata nhẹ)

type D1Like = {
  prepare: (query: string) => {
    bind: (...args: unknown[]) => {
      first: <T>() => Promise<T | null>;
    };
  };
};

interface Env {
  D1_CONG_DONG?: D1Like;
  DB?: D1Like;
  KV_CONG_DONG?: {
    get: (key: string) => Promise<string | null>;
  };
}

export const onRequestGet = async (context: { env: Env }) => {
  const { env } = context;

  // 1. Thử lấy từ KV trước (siêu tốc, ~10ms)
  if (env.KV_CONG_DONG) {
    try {
    const kvManifest = await env.KV_CONG_DONG.get("manifest:active");
    if (kvManifest) {
      return new Response(kvManifest, {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "public, max-age=300, stale-while-revalidate=60",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }
    } catch { /* D1 remains authoritative if KV is unavailable. */ }
  }

  // 2. Thử lấy từ D1
  const csdl = env.D1_CONG_DONG ?? env.DB;
  if (csdl) {
    try {
    const activeRow = await csdl
      .prepare("SELECT manifest_json FROM snapshot_manifest WHERE is_active = 1 LIMIT 1")
      .bind()
      .first<{ manifest_json: string }>();

    if (activeRow?.manifest_json) {
      return new Response(activeRow.manifest_json, {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "public, max-age=300, stale-while-revalidate=60",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }
    } catch { /* Keep the bundled dataset available if remote storage is down. */ }
  }

  // 3. Fallback Manifest rỗng an toàn
  const fallback = {
    schemaVersion: 1,
    dataVersion: "2026.10.07.01",
    generatedAt: new Date().toISOString(),
    datasets: {
      schools: { version: "0", hash: "", url: "/snapshots/schools.json", size: 0, recordCount: 0, updatedAt: "" },
      tuition: { version: "0", hash: "", url: "/snapshots/tuition.json", size: 0, recordCount: 0, updatedAt: "" },
      scholarships: { version: "0", hash: "", url: "/snapshots/scholarships.json", size: 0, recordCount: 0, updatedAt: "" },
      admissions: { version: "0", hash: "", url: "/snapshots/admissions.json", size: 0, recordCount: 0, updatedAt: "" },
      announcements: { version: "0", hash: "", url: "/snapshots/announcements.json", size: 0, recordCount: 0, updatedAt: "" },
      cutoffScores: { version: "0", hash: "", url: "/snapshots/cutoff-scores.json", size: 0, recordCount: 0, updatedAt: "" },
    },
    recentChanges: [],
  };

  return new Response(JSON.stringify(fallback), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
};

import { LUA_CHON, napLuaChon, taiNguon } from "../data/lua-chon-that";
import { DS_TRUONG, bietDanhCua, chuanHoa, chuanHoaTinh, resolveTruong } from "../engine/truong";
import { CONG_TUYEN_SINH_CHINH_THUC } from "../engine/link-chinh-thuc";
import type { BangChungDiem } from "../engine/du-lieu-tuyen-sinh/kieu";

export interface AdmissionRecord {
  id: string; ma: string; truong: string; nganh: string; nhom: string; tinh: string; pt: string;
  toHop: string[]; diem: Record<string, number | null>; nguon: string | null; tier: string | null;
  scoreEvidence?: Record<string, BangChungDiem>;
}
export async function loadCatalog() {
  const [raw, sources] = await Promise.all([import("../data/du-lieu-that.json"), taiNguon(), napLuaChon()]);
  return { records: raw.default as unknown as AdmissionRecord[], sources, choices: new Map(LUA_CHON.map((l) => [l.id, l])) };
}
export type Catalog = Awaited<ReturnType<typeof loadCatalog>>;

export function universityCode(input: string): string | null {
  const found = resolveTruong(input);
  return found.kieu === "chinh-xac" ? found.ma : null;
}

export function universitySearch(args: Record<string, unknown>) {
  const q = typeof args.q === "string" ? chuanHoa(args.q) : "";
  const province = typeof args.tinh === "string" ? chuanHoa(chuanHoaTinh(args.tinh) ?? args.tinh) : "";
  const exact = q ? resolveTruong(q) : null;
  const matches = DS_TRUONG.filter((u) => (!province || u.tinh.some((p) => chuanHoa(p).includes(province))) &&
    (!q || exact?.ung_vien.includes(u.ma) || q.split(" ").every((term) => chuanHoa([u.ma, u.ten, ...bietDanhCua(u.ma)].join(" ")).includes(term))));
  const limit = typeof args.limit === "number" ? args.limit : 20, offset = typeof args.offset === "number" ? args.offset : 0;
  return { tong: matches.length, limit, offset, data: matches.slice(offset, offset + limit).map((u) => ({ maTruong: u.ma, tenTruong: u.ten, tinh: [...u.tinh] })) };
}

export function filterPrograms(records: AdmissionRecord[], args: Record<string, unknown>) {
  const query = typeof args.q === "string" ? chuanHoa(args.q).split(" ") : [];
  const province = typeof args.tinh === "string" ? chuanHoa(chuanHoaTinh(args.tinh) ?? args.tinh) : "";
  const code = typeof args.maTruong === "string" ? universityCode(args.maTruong) : null;
  return records.filter((r) => (!args.maTruong || r.ma === code) && (!province || chuanHoa(r.tinh).includes(province)) &&
    (!args.maToHop || r.toHop.includes(String(args.maToHop).toUpperCase())) && query.every((term) => chuanHoa(`${r.nganh} ${r.nhom} ${r.ma} ${r.truong}`).includes(term)));
}

export function programDetails(record: AdmissionRecord, catalog: Catalog) {
  const cutoffHistory = Object.fromEntries(Object.entries(record.diem).map(([year, score]) => {
    const e = record.scoreEvidence?.[year];
    return [year, e && e.score === score && ["diem_san", "du_kien", "chua_ro"].includes(e.kind) ? null : score];
  }));
  const history = Object.entries(cutoffHistory).sort(([a], [b]) => b.localeCompare(a));
  const latest = history[0], choice = catalog.choices.get(record.id);
  const yearly = catalog.sources.nam[record.id] ?? [];
  return {
    id: record.id, maTruong: record.ma, tenTruong: record.truong, nganh: record.nganh, nhomNganh: record.nhom, tinh: record.tinh,
    phuongThuc: record.pt, toHop: [...record.toHop], diemTheoNam: cutoffHistory,
    scoreEvidence: record.scoreEvidence ?? null,
    diemChuan: latest && typeof latest[1] === "number" && Number.isFinite(latest[1]) ? latest[1] : null, namDiem: latest ? Number(latest[0]) : null,
    hocPhiTrieuNam: choice?.hocPhiMin ?? null, hocPhiUocTinh: choice?.hocPhiUocTinh ?? false,
    nguonHocPhi: choice?.nguonHocPhi ?? null,
    provenance: {
      sourceTier: record.tier, sourceUrl: record.nguon, verificationStatus: "not_independently_verified" as const,
      lastVerifiedAt: null, lastUpdatedAt: null,
      yearlySources: [...yearly].sort((a, b) => b.nam.localeCompare(a.nam)).slice(0, 3).map((s) => ({ year: s.nam, url: s.url, page: s.trang ?? null, documentYear: s.tai ?? null })),
    },
  };
}

export function universityDetails(code: string, catalog: Catalog) {
  const uni = DS_TRUONG.find((u) => u.ma === code)!;
  const programs = catalog.records.filter((r) => r.ma === code);
  const years = [...new Set(programs.flatMap((r) => Object.keys(r.diem)))].sort().reverse();
  return {
    maTruong: uni.ma, tenTruong: uni.ten, tinh: [...uni.tinh], soChuongTrinh: programs.length,
    phuongThuc: [...new Set(programs.map((p) => p.pt))].sort(), namDuLieu: years,
    congTuyenSinh: CONG_TUYEN_SINH_CHINH_THUC[code]?.congTuyenSinh ?? null,
    taiLieu: (catalog.sources.truong[code]?.docs ?? []).slice(0, 5),
    provenance: { verificationStatus: "not_independently_verified", lastVerifiedAt: null, lastUpdatedAt: null, latestScoreYear: years[0] ? Number(years[0]) : null },
  };
}

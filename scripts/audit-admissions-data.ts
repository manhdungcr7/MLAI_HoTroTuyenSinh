// Audit cục bộ tái lập; không gọi mạng, không sửa hay tự nâng trạng thái nguồn.
import { loadCatalog } from "../src/capabilities/catalog";
import { DS_TRUONG } from "../src/engine/truong";
import { MON_CUA_TO_HOP } from "../src/data/to-hop-chinh-thuc";

const { records, sources, choices } = await loadCatalog();
const count = (values: string[]) => Object.fromEntries([...new Set(values)].sort().map((v) => [v, values.filter((x) => x === v).length]));
const years = count(records.flatMap((r) => Object.keys(r.diem)));
const duplicateIds = records.filter((r, i) => records.findIndex((x) => x.id === r.id) !== i).map((r) => r.id);
const malformedScores = records.flatMap((r) => Object.entries(r.diem).filter(([year, n]) => !/^\d{4}$/.test(year) || n !== null && (typeof n !== "number" || !Number.isFinite(n) || n < 0)).map(([year]) => ({ id: r.id, year })));
const result = {
  scope: "bundled snapshot only; no live CMS/network/link verification",
  universityCount: DS_TRUONG.length, programCount: records.length,
  methodCounts: count(records.map((r) => r.pt)), sourceTierCounts: count(records.map((r) => r.tier ?? "missing")), scoreYearCounts: years,
  duplicateIds, malformedScores,
  programsWithoutSourceUrl: records.filter((r) => !r.nguon).length,
  programsWithoutYearlySource: records.filter((r) => !sources.nam[r.id]?.length).length,
  programsWithoutCombination: records.filter((r) => !r.toHop.length).length,
  programsWithNoComputableCombination: records.filter((r) => r.toHop.length > 0 && r.toHop.every((ma) => !MON_CUA_TO_HOP[ma])).length,
  programsWithoutScore: records.filter((r) => !Object.values(r.diem).some((s) => s !== null && Number.isFinite(s))).length,
  thptScoresOutside30: records.flatMap((r) => r.pt === "THPT" ? Object.entries(r.diem).filter(([, n]) => n !== null && n > 30).map(([year, score]) => ({ id: r.id, year, score })) : []),
  tuitionKnown: [...choices.values()].filter((r) => r.hocPhiMin !== undefined).length,
  tuitionEstimated: [...choices.values()].filter((r) => r.hocPhiUocTinh).length,
  verifiedAt: null, updatedAt: null,
};
console.log(JSON.stringify(result, null, 2));
if (duplicateIds.length || malformedScores.length) process.exitCode = 1;

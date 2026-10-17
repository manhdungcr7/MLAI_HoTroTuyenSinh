// Audit cục bộ tái lập; không gọi mạng, không sửa hay tự nâng trạng thái nguồn.
import { loadCatalog } from "../src/capabilities/catalog";
import { DS_TRUONG } from "../src/engine/truong";
import { MON_CUA_TO_HOP } from "../src/data/to-hop-chinh-thuc";
import { mkdir, writeFile } from "node:fs/promises";

const { records, sources, choices } = await loadCatalog();
const count = (values: string[]) => Object.fromEntries([...new Set(values)].sort().map((v) => [v, values.filter((x) => x === v).length]));
const years = count(records.flatMap((r) => Object.keys(r.diem)));
const duplicateIds = records.filter((r, i) => records.findIndex((x) => x.id === r.id) !== i).map((r) => r.id);
const malformedScores = records.flatMap((r) => Object.entries(r.diem).filter(([year, n]) => !/^\d{4}$/.test(year) || n !== null && (typeof n !== "number" || !Number.isFinite(n) || n < 0)).map(([year]) => ({ id: r.id, year })));
// Có một URL theo năm không có nghĩa toàn bộ lịch sử đã có nguồn.
const missingYearSources = records.flatMap((r) => Object.entries(r.diem)
  .filter(([year, score]) => score !== null && !sources.nam[r.id]?.some((s) => s.nam === year && /^https?:\/\//.test(s.url)))
  .map(([year]) => ({ id: r.id, school: r.ma, year })));
const latestYearWithoutSource = records.filter((r) => {
  const latest = Object.keys(r.diem).sort().at(-1);
  return latest && missingYearSources.some((s) => s.id === r.id && s.year === latest);
});
const semanticKeys = new Map<string, string[]>();
for (const r of records) {
  const key = JSON.stringify([r.ma, r.nganh.normalize("NFC").toLowerCase().replace(/\s+/g, " ").trim(), r.pt, [...r.toHop].sort()]);
  semanticKeys.set(key, [...(semanticKeys.get(key) ?? []), r.id]);
}
const possibleDuplicates = [...semanticKeys.values()].filter((ids) => ids.length > 1);
const reviewQueue = records.map((r) => ({
  id: r.id, school: r.ma, program: r.nganh, method: r.pt, combinations: r.toHop,
  source: r.nguon, years: Object.keys(r.diem),
  missingSourceYears: missingYearSources.filter((s) => s.id === r.id).map((s) => s.year),
  // Là tín hiệu ưu tiên kiểm tra, KHÔNG phải kết luận 15 là điểm sàn.
  score15YearsToReview: Object.entries(r.diem).filter(([, score]) => r.pt === "THPT" && score === 15).map(([year]) => year),
  yearsWithoutScoreKindEvidence: Object.keys(r.diem).filter((year) => {
    const e = r.scoreEvidence?.[year];
    return !e || e.kind !== "diem_chuan" || e.score !== r.diem[year] || !e.scale || !e.sourceUrl || !e.checkedAt || !e.checkedBy;
  }),
  yearsWithoutIndependentReview: Object.keys(r.diem).filter((year) => {
    const e = r.scoreEvidence?.[year];
    return !e?.independentReviewer || e.independentReviewer === e.checkedBy;
  }),
}));
const schoolReviewQueue = DS_TRUONG.map((school) => {
  const ds = reviewQueue.filter((r) => r.school === school.ma);
  return { school: school.ma, name: school.ten, programs: ds.length,
    missingSource: ds.filter((r) => !r.source).length,
    missingYearSources: ds.reduce((s, r) => s + r.missingSourceYears.length, 0),
    score15ProgramsToReview: ds.filter((r) => r.score15YearsToReview.length).length };
}).sort((a, b) => b.missingSource - a.missingSource || b.missingYearSources - a.missingYearSources);
const result = {
  scope: "bundled snapshot only; no live CMS/network/link verification",
  universityCount: DS_TRUONG.length, programCount: records.length,
  methodCounts: count(records.map((r) => r.pt)), sourceTierCounts: count(records.map((r) => r.tier ?? "missing")), scoreYearCounts: years,
  duplicateIds, malformedScores,
  possibleDuplicateProgramGroups: possibleDuplicates,
  programsWithoutSourceUrl: records.filter((r) => !r.nguon).length,
  programsWithoutYearlySource: records.filter((r) => !sources.nam[r.id]?.length).length,
  scoreCellsWithoutYearlySource: missingYearSources.length,
  programsWhoseLatestScoreHasNoYearlySource: latestYearWithoutSource.length,
  thptProgramsWith15NeedingSourceReview: reviewQueue.filter((r) => r.score15YearsToReview.length).length,
  programsWithoutCombination: records.filter((r) => !r.toHop.length).length,
  programsWithNoComputableCombination: records.filter((r) => r.toHop.length > 0 && r.toHop.every((ma) => !MON_CUA_TO_HOP[ma])).length,
  programsWithoutScore: records.filter((r) => !Object.values(r.diem).some((s) => s !== null && Number.isFinite(s))).length,
  singleYearScoreCount: records.filter((r) => Object.values(r.diem).filter((s) => s !== null && Number.isFinite(s)).length === 1).length,
  multiYearScoreCount: records.filter((r) => Object.values(r.diem).filter((s) => s !== null && Number.isFinite(s)).length >= 2).length,
  programsWithFloorScoreOnly: records.filter((r) => {
    const valid = Object.values(r.diem).filter((s): s is number => s !== null && Number.isFinite(s));
    return valid.length > 0 && valid.every((s) => s === 15);
  }).length,
  flatCutoffUniversities: (() => {
    const unis: Record<string, { ma: string; ten: string; scores: number[] }> = {};
    for (const r of records) {
      if (!unis[r.ma]) unis[r.ma] = { ma: r.ma, ten: r.truong, scores: [] };
      const vals = Object.values(r.diem).filter((s): s is number => s !== null && Number.isFinite(s));
      unis[r.ma].scores.push(...vals);
    }
    return Object.values(unis).filter((u) => {
      const uScores = [...new Set(u.scores)];
      return uScores.length === 1 && u.scores.length >= 3;
    }).map((u) => ({ ma: u.ma, ten: u.ten, diemChung: u.scores[0] }));
  })(),
  thptScoresOutside30: records.flatMap((r) => r.pt === "THPT" ? Object.entries(r.diem).filter(([, n]) => n !== null && n > 30).map(([year, score]) => ({ id: r.id, year, score })) : []),
  tuitionKnown: [...choices.values()].filter((r) => r.hocPhiMin !== undefined).length,
  tuitionEstimated: [...choices.values()].filter((r) => r.hocPhiUocTinh).length,
  verifiedAt: null, updatedAt: null,
  scoreCellsWithoutKindEvidence: reviewQueue.reduce((n, r) => n + r.yearsWithoutScoreKindEvidence.length, 0),
  scoreCellsWithoutIndependentReview: reviewQueue.reduce((n, r) => n + r.yearsWithoutIndependentReview.length, 0),
  releaseReady: missingYearSources.length === 0 && duplicateIds.length === 0 && malformedScores.length === 0 &&
    reviewQueue.every((r) => r.yearsWithoutScoreKindEvidence.length === 0 && r.yearsWithoutIndependentReview.length === 0) &&
    [...choices.values()].every((r) => !r.hocPhiUocTinh),
  releaseBlockers: [
    ...(reviewQueue.some((r) => r.yearsWithoutScoreKindEvidence.length) ? ["Score kinds and scales lack structured per-year evidence"] : []),
    ...(reviewQueue.some((r) => r.yearsWithoutIndependentReview.length) ? ["Independent review is missing; URLs and tiers are not verification"] : []),
    ...(missingYearSources.length ? ["Yearly score source coverage is incomplete"] : []),
    ...([...choices.values()].some((r) => r.hocPhiUocTinh) ? ["Tuition estimates still need source verification"] : []),
  ],
  schoolReviewQueue,
};
console.log(JSON.stringify(result, null, 2));
if (process.argv.includes("--write")) {
  await mkdir(".agent-runtime/data-audit", { recursive: true });
  await writeFile(".agent-runtime/data-audit/catalog-audit.json", JSON.stringify({ ...result, reviewQueue }, null, 2) + "\n");
  const csv = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  await writeFile("docs/audits/data-quality-schools.csv", [
    ["school", "name", "programs", "missingSource", "missingYearSources", "score15ProgramsToReview"].map(csv).join(","),
    ...schoolReviewQueue.map((r) => [r.school, r.name, r.programs, r.missingSource, r.missingYearSources, r.score15ProgramsToReview].map(csv).join(",")),
  ].join("\n") + "\n");
}
if (duplicateIds.length || malformedScores.length || result.thptScoresOutside30.length || process.argv.includes("--strict") && !result.releaseReady) process.exitCode = 1;

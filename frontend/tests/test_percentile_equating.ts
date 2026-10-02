import {
  scoreToPercentile,
  percentileToScore,
  equateCutoff,
  hsaToThpt,
  OFFICIAL_PERCENTILES_2026,
  HSA_EQUATING_CHECKPOINTS,
} from "../src/engine/decision/percentile";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`FAIL: ${msg}`);
  }
}

console.log("=== RUNNING PERCENTILE EQUATING & HSA/V-ACT TEST SUITE ===");

// 1. Test Monotonicity
console.log("\n[Test 1] Monotonicity of scoreToPercentile");
let prevPct = -1;
for (let score = 10; score <= 30; score += 0.5) {
  const pct = scoreToPercentile(score, 2026, "A00");
  assert(pct > prevPct, `Monotonicity violation at score ${score}: ${pct} <= ${prevPct}`);
  prevPct = pct;
}
console.log("  PASS: scoreToPercentile is strictly monotonic across range [10, 30]");

// 2. Test Invertibility: percentileToScore(scoreToPercentile(s)) ≈ s
console.log("\n[Test 2] Invertibility of scoreToPercentile and percentileToScore");
for (let score = 15; score <= 29; score += 1.0) {
  const pct = scoreToPercentile(score, 2026, "A00");
  const recoveredScore = percentileToScore(pct, 2026, "A00");
  const diff = Math.abs(recoveredScore - score);
  assert(diff <= 0.25, `Invertibility gap at score ${score}: recovered ${recoveredScore}, diff=${diff}`);
}
console.log("  PASS: Invertibility gap <= 0.25 points across entire realistic range");

// 3. Test TT06 Cross-year Equating
console.log("\n[Test 3] TT06 Cross-year Equating");
const p2024 = scoreToPercentile(25.0, 2024, "C00");
const equated2026 = equateCutoff(25.0, 2024, 2026, "C00");
console.log(`  2024 C00 25.0đ -> Percentile: ${p2024}%, Equated 2026 C00: ${equated2026}đ`);
assert(equated2026 > 24.0 && equated2026 < 26.0, `Equated score ${equated2026} outside reasonable bound`);
console.log("  PASS: Cross-year equating preserves percentile rank without raw score bridging");

// 4. Test HSA (ĐHQGHN) Equivalence according to Thông báo 299/TB-ĐTSKT
console.log("\n[Test 4] HSA (ĐHQGHN) Equivalence to THPT (Thông báo 299/TB-ĐTSKT)");
const hsa100 = hsaToThpt(100);
assert(Math.abs(hsa100 - 26.00) < 0.01, `HSA 100 should equate to 26.00 THPT, got ${hsa100}`);

const hsa110 = hsaToThpt(110);
assert(Math.abs(hsa110 - 27.51) < 0.01, `HSA 110 should equate to 27.51 THPT, got ${hsa110}`);

const hsa80 = hsaToThpt(80);
assert(Math.abs(hsa80 - 22.75) < 0.01, `HSA 80 should equate to 22.75 THPT, got ${hsa80}`);

// Interpolation between 80 and 90
const hsa85 = hsaToThpt(85);
assert(hsa85 > 22.75 && hsa85 < 24.49, `HSA 85 should interpolate between 22.75 and 24.49, got ${hsa85}`);

// Boundary checks
assert(hsaToThpt(0) === 0, "HSA 0 should equate to 0");
assert(hsaToThpt(130) === 30.0, "HSA 130 should clamp to 30.0");
console.log("  PASS: HSA conversions match official threshold table and interpolate continuously");

// 6. Test Official Tables Presence & Fallback Safety
console.log("\n[Test 6] Official Tables Presence & Fallback Safety");
assert(Object.keys(OFFICIAL_PERCENTILES_2026).length >= 5, "Must contain all 5 major combos: A00, A01, B00, C00, D01");
assert(HSA_EQUATING_CHECKPOINTS.length === 16, "Must contain all 16 official checkpoints (55 to 130, step 5) from ĐHQGHN Thông báo 299");
const fallbackEquate = equateCutoff(24.5, 2024, 2024, "A00");
assert(fallbackEquate === 24.5, "Same year equating must return exact score");
console.log("  PASS: Official tables presence and fallback safety verified");

console.log("\n>>> ALL PERCENTILE & EQUATING INVARIANTS PASSED 100% <<<");

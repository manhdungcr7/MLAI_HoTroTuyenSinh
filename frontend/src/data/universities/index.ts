/**
 * DATA UNIVERSITIES: TỔNG HỢP DANH MỤC TRỌNG ĐIỂM & TỔ HỢP XÉT TUYỂN
 */

import { TargetProgram } from "@/engine/types";
import { PROGRAMS_NORTH } from "@/data/universities/programs-north";
import { PROGRAMS_SOUTH_AND_TIERS } from "@/data/universities/programs-south";

export * from "./combinations";
export * from "./programs-north";
export * from "./programs-south";

/**
 * Danh sách toàn bộ 22 chương trình trọng điểm chuẩn hóa với Data Passport
 */
export const GOLDEN_PROGRAMS: TargetProgram[] = [
  ...PROGRAMS_NORTH,
  ...PROGRAMS_SOUTH_AND_TIERS,
];

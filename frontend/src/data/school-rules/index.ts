import { SchoolRule, registerSchoolRules } from "@/engine/scoring/school-rules";
import DBL from "./DBL.json";
import DDT from "./DDT.json";
import DPQ from "./DPQ.json";
import DQN from "./DQN.json";
import GHA from "./GHA.json";
import GSA from "./GSA.json";
import GTA from "./GTA.json";
import KHA from "./KHA.json";
import SPD from "./SPD.json";
import TCT from "./TCT.json";
import TDV from "./TDV.json";
import TTN from "./TTN.json";
import XDT from "./XDT.json";

/**
 * Quy tắc tính điểm riêng của từng trường, đối chiếu với văn bản thông tin tuyển sinh do trường công bố.
 * File này được sinh bởi scripts/build_rules_index.py; thêm trường bằng cách tạo <MÃ TRƯỜNG>.json rồi chạy script.
 * Trường chưa có trong danh sách dùng công thức mặc định và được ghi rõ là "công thức chung".
 */
export const SCHOOL_RULES = [DBL, DDT, DPQ, DQN, GHA, GSA, GTA, KHA, SPD, TCT, TDV, TTN, XDT] as unknown as SchoolRule[];

registerSchoolRules(SCHOOL_RULES);

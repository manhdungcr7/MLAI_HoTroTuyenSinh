import { SchoolRule, registerSchoolRules } from "@/engine/scoring/school-rules";
import DBL from "./DBL.json";
import DDP from "./DDP.json";
import DDT from "./DDT.json";
import DHY from "./DHY.json";
import DKK from "./DKK.json";
import DPQ from "./DPQ.json";
import DQN from "./DQN.json";
import DTL from "./DTL.json";
import GHA from "./GHA.json";
import GSA from "./GSA.json";
import GTA from "./GTA.json";
import KHA from "./KHA.json";
import NHH from "./NHH.json";
import NTH from "./NTH.json";
import SPD from "./SPD.json";
import TCT from "./TCT.json";
import TDV from "./TDV.json";
import TTN from "./TTN.json";
import XDT from "./XDT.json";
import YDS from "./YDS.json";

/**
 * Quy tắc tính điểm riêng của từng trường, đối chiếu với văn bản thông tin tuyển sinh do trường công bố.
 * File này được sinh bởi scripts/build_rules_index.py; thêm trường bằng cách tạo <MÃ TRƯỜNG>.json rồi chạy script.
 * Trường chưa có trong danh sách dùng công thức mặc định và được ghi rõ là "công thức chung".
 */
export const SCHOOL_RULES = [DBL, DDP, DDT, DHY, DKK, DPQ, DQN, DTL, GHA, GSA, GTA, KHA, NHH, NTH, SPD, TCT, TDV, TTN, XDT, YDS] as unknown as SchoolRule[];

registerSchoolRules(SCHOOL_RULES);

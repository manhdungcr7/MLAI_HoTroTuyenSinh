import { SchoolRule, registerSchoolRules } from "@/engine/scoring/school-rules";
import DBL from "./DBL.json";
import DCT from "./DCT.json";
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
import HHK from "./HHK.json";
import KHA from "./KHA.json";
import NHF from "./NHF.json";
import NHH from "./NHH.json";
import NTH from "./NTH.json";
import SPD from "./SPD.json";
import SPH from "./SPH.json";
import TCT from "./TCT.json";
import TDV from "./TDV.json";
import TLA from "./TLA.json";
import TTN from "./TTN.json";
import XDT from "./XDT.json";
import YDS from "./YDS.json";

/**
 * Quy tắc tính điểm riêng của từng trường, đối chiếu với văn bản thông tin tuyển sinh do trường công bố.
 * File này được sinh bởi scripts/build_rules_index.py; thêm trường bằng cách tạo <MÃ TRƯỜNG>.json rồi chạy script.
 * Trường chưa có trong danh sách dùng công thức mặc định và được ghi rõ là "công thức chung".
 */
export const SCHOOL_RULES = [DBL, DCT, DDP, DDT, DHY, DKK, DPQ, DQN, DTL, GHA, GSA, GTA, HHK, KHA, NHF, NHH, NTH, SPD, SPH, TCT, TDV, TLA, TTN, XDT, YDS] as unknown as SchoolRule[];

registerSchoolRules(SCHOOL_RULES);

import { MON_CUA_TO_HOP } from "../data/to-hop-chinh-thuc";
import { diemUuTien, mucUuTien, tongCoUuTien, type DoiTuongUuTien, type KhuVucUuTien } from "../engine/diem-uu-tien";
import { nhanChoLuaChon } from "../engine/phan-tich";
import { chuanHoa, chuanHoaTinh } from "../engine/truong";
import type { BanChup } from "../engine/ket-noi-kieu";
import type { MonKhoi } from "../state/types";
import { filterPrograms, loadCatalog, programDetails, universityCode, universityDetails, universitySearch, type Catalog, type AdmissionRecord } from "./catalog";
import { capabilityDefinitions, validateSchema } from "./schema";

export { capabilityDefinitions, validateSchema } from "./schema";
export type { JsonSchema, CapabilityName } from "./schema";
export type CapabilityErrorCode = "INVALID_ARGUMENT" | "NOT_FOUND" | "AUTH_REQUIRED" | "INSUFFICIENT_DATA" | "DATA_UNAVAILABLE" | "UNKNOWN_CAPABILITY";
export type CapabilityResult<T = unknown> =
  | { ok: true; data: T; meta: { version: 1; dataScope: string; warnings: string[] } }
  | { ok: false; error: { code: CapabilityErrorCode; message: string; details?: string[] } };

const SOURCE_WARNING = "Dữ liệu đi kèm bản phát hành; chưa kiểm tra độc lập tính đúng, liên kết hay độ mới. Không đồng bộ kho CMS đang chạy.";
const SCORE_WARNING = "So sánh điểm lịch sử không phải xác suất trúng tuyển. Cần đối chiếu điều kiện và quy chế của năm đăng ký.";
function success<T>(data: T, dataScope = "bundled-admissions-snapshot", warnings = [SOURCE_WARNING]): CapabilityResult<T> {
  return { ok: true, data, meta: { version: 1, dataScope, warnings } };
}
function failure(code: CapabilityErrorCode, message: string, details?: string[]): CapabilityResult<never> {
  return { ok: false, error: { code, message, ...(details?.length ? { details } : {}) } };
}
const round = (n: number) => Math.round(n * 100) / 100;

/** Đầu vào đã qua strict schema; module engine chịu trách nhiệm công thức ưu tiên. */
function calculate(args: Record<string, unknown>) {
  const maToHop = String(args.maToHop).toUpperCase(), subjects = MON_CUA_TO_HOP[maToHop];
  if (!subjects) return failure("INVALID_ARGUMENT", "Tổ hợp chưa được engine hỗ trợ; không suy công thức hay môn năng khiếu.");
  const scores = args.diemMon as Partial<Record<MonKhoi, number | null>>;
  const missing = subjects.filter((m) => scores[m] === null || scores[m] === undefined);
  if (missing.length) return success({ maToHop, diemMon: scores, mon: subjects, thieuMon: missing, tongBaMon: null, uuTienCong: null, tongXetTuyen: null }, "provided-scores", ["Chưa đủ điểm; môn thiếu được giữ là null, không thay bằng 0."]);
  const total = round(subjects.reduce((sum, m) => sum + scores[m]!, 0));
  const priority = mucUuTien({ khuVuc: args.khuVuc as KhuVucUuTien ?? null, doiTuong: args.doiTuong as DoiTuongUuTien ?? null });
  return success({ maToHop, mon: subjects, diemMon: scores, thieuMon: [], tongBaMon: total, mucUuTien: priority,
    uuTienCong: diemUuTien(total, priority), tongXetTuyen: tongCoUuTien(total, priority),
    quyTac: { id: "thpt-30-priority-engine-v1", scale: 30, source: "src/engine/diem-uu-tien.ts", verificationStatus: "implementation_only", appliesTo: "THPT-ba-mon-khong-he-so", weights: [1, 1, 1] },
    uuTienDaKhaiBao: args.khuVuc !== undefined || args.doiTuong !== undefined,
  }, "provided-scores", ["Áp dụng công thức hiện có của ứng dụng, chưa xác minh quy chế theo năm. Chưa khai báo khu vực/đối tượng thì không cộng phần ưu tiên đó."]);
}

function comparableScore(snapshot: BanChup) {
  // Bản chụp không có từng điểm môn: chỉ được dùng đúng tổ hợp đi kèm tổng đã đồng bộ.
  const score = snapshot.hoSo.toHopCaoNhat;
  return score && MON_CUA_TO_HOP[score.ma] && Number.isFinite(score.tong) && score.tong >= 0 && score.tong <= 30 ? score : null;
}
function comparison(record: AdmissionRecord, catalog: Catalog, snapshot: BanChup) {
  const details = programDetails(record, catalog), score = comparableScore(snapshot);
  const comparable = record.pt === "THPT" && !!score && record.toHop.includes(score.ma) && details.diemChuan !== null && details.diemChuan <= 30;
  const choice = catalog.choices.get(record.id);
  const reason = record.pt !== "THPT" ? "Khác phương thức THPT." : !score ? "Bản chụp thiếu tổng điểm và tổ hợp hợp lệ." : !record.toHop.length ? "Chưa có tổ hợp trong dữ liệu chương trình." : !record.toHop.includes(score.ma) ? "Tổ hợp trong bản chụp không thuộc chương trình." : !comparable ? "Chưa có điểm chuẩn THPT thang 30." : null;
  return { ...details, tongXetTuyen: comparable ? score!.tong : null, maToHopSoSanh: comparable ? score!.ma : null,
    chenhLech: comparable ? round(score!.tong - details.diemChuan!) : null,
    nhan: comparable && choice ? nhanChoLuaChon(choice, score!.tong) : null,
    lyDoChuaSoDuoc: reason,
  };
}

function analyze(snapshot: BanChup) {
  const missing: string[] = [];
  if (!snapshot.hoSo.lop) missing.push("lop");
  if (!snapshot.hoSo.tinh) missing.push("tinh");
  if (!comparableScore(snapshot)) missing.push("toHopCaoNhat");
  if (!snapshot.hoSo.nganhQuanTam?.length) missing.push("nganhQuanTam");
  if (snapshot.hoSo.nganSachToiDaTrieu === null || snapshot.hoSo.nganSachToiDaTrieu === undefined) missing.push("nganSachToiDaTrieu");
  return success({ capNhat: snapshot.capNhat, hoSo: snapshot.hoSo, mucTieu: snapshot.mucTieu ?? null,
    diemThiGanNhat: [...snapshot.diemThi].sort((a, b) => b.ngay.localeCompare(a.ngay))[0] ?? null,
    tongDiemCoTheSoSanh: comparableScore(snapshot), truongConThieu: missing,
    limitations: ["Bản chụp không có điểm từng môn, mức ưu tiên hay xác nhận điều kiện tuyển sinh. Không suy các dữ liệu này từ tổng điểm."],
  }, "authorized-student-snapshot", ["Ngày cập nhật là ngày đồng bộ bản chụp, không phải ngày xác minh dữ liệu tuyển sinh."]);
}

/** Consumer phải xác thực và kiểm scope trước khi truyền snapshot. Capability không ghi dữ liệu. */
export async function executeCapability(name: string, args: unknown, snapshot?: BanChup): Promise<CapabilityResult> {
  const definition = capabilityDefinitions.find((d) => d.name === name);
  if (!definition) return failure("UNKNOWN_CAPABILITY", "Capability không được hỗ trợ.");
  const errors = validateSchema(args, definition.inputSchema);
  if (errors.length) return failure("INVALID_ARGUMENT", "Tham số không hợp lệ.", errors);
  const input = args as Record<string, unknown>;
  if (name === "calculate_admission_score") return calculate(input);
  if (name === "search_universities") return success(universitySearch(input));
  const personal = ["analyze_student_profile", "recommend_preferences", "validate_preference_order"].includes(name);
  if (personal && !snapshot) return failure("AUTH_REQUIRED", "Cần bản chụp học sinh đã xác thực và cấp quyền.");
  if (name === "analyze_student_profile") return analyze(snapshot!);
  const code = typeof input.maTruong === "string" ? universityCode(input.maTruong) : null;
  if (typeof input.maTruong === "string" && !code) return failure("NOT_FOUND", "Không xác định duy nhất trường trong danh mục; dùng search_universities để chọn mã trường.");
  try {
    const catalog = await loadCatalog();
    if (name === "get_university") return success(universityDetails(code!, catalog));
    if (name === "search_majors") {
      const matches = filterPrograms(catalog.records, input), limit = Number(input.limit ?? 20), offset = Number(input.offset ?? 0);
      return success({ tong: matches.length, limit, offset, data: matches.slice(offset, offset + limit).map((r) => programDetails(r, catalog)) });
    }
    if (name === "get_admission_rules") {
      const records = catalog.records.filter((r) => r.ma === code);
      return success({ maTruong: code, phuongThuc: [...new Set(records.map((r) => r.pt))].sort(),
        toHop: [...new Set(records.flatMap((r) => r.toHop))].sort().map((ma) => ({ ma, mon: MON_CUA_TO_HOP[ma] ?? null })),
        dieuKienDuTuyen: null, heSoMon: null, quyDoiPhuongThuc: null, namApDungDaXacMinh: null,
        documents: (catalog.sources.truong[code!]?.docs ?? []).slice(0, 5),
        limitations: ["Tổ hợp và phương thức là dữ liệu đã trích, chưa đủ để kết luận đủ điều kiện dự tuyển.", "Chưa có quy tắc riêng theo trường/năm được kiểm chứng; không áp dụng công thức THPT cho ĐGNL, học bạ hay môn có hệ số."],
      });
    }
    if (name === "recommend_preferences") {
      const score = comparableScore(snapshot!);
      if (!score) return failure("INSUFFICIENT_DATA", "Cần đồng bộ tổng điểm kèm tổ hợp; không suy điểm môn thiếu.");
      const selected = new Set(snapshot!.nguyenVong.map((n) => n.id));
      const preferredProvinces = (snapshot!.hoSo.khuVuc ?? []).map((p) => chuanHoa(chuanHoaTinh(p) ?? p));
      const candidates = filterPrograms(catalog.records, input)
        .filter((r) => !selected.has(r.id) && (input.tinh || !preferredProvinces.length || preferredProvinces.includes(chuanHoa(r.tinh))))
        .map((r) => comparison(r, catalog, snapshot!)).filter((r) => r.chenhLech !== null);
      const budget = snapshot!.hoSo.nganSachToiDaTrieu;
      const withinBudget = candidates.filter((r) => budget === null || budget === undefined || r.hocPhiTrieuNam === null || r.hocPhiTrieuNam <= budget);
      const interests = snapshot!.hoSo.nganhQuanTam ?? [];
      const rank = (r: (typeof candidates)[number]) => interests.some((i) => chuanHoa(`${r.nganh} ${r.nhomNganh}`).includes(chuanHoa(i))) ? 0 : 1;
      withinBudget.sort((a, b) => rank(a) - rank(b) || Math.abs(a.chenhLech!) - Math.abs(b.chenhLech!) || a.id.localeCompare(b.id));
      const limit = Number(input.limit ?? 10);
      return success({ capNhatHoSo: snapshot!.capNhat, tong: withinBudget.length, limit, data: withinBudget.slice(0, limit),
        methodology: "Ưu tiên ngành quan tâm, rồi khoảng cách tuyệt đối tới điểm chuẩn gần nhất; cùng tổ hợp THPT, mã chương trình phá hòa. Không tự đổi thứ tự mong muốn.",
        limitations: ["Chỉ dùng tổng của tổ hợp đã đồng bộ; không tìm được tổ hợp khác từ bản chụp.", "Học phí chưa có nguồn hoặc là ước tính không chứng minh phù hợp ngân sách."] }, "bundled-catalog-and-authorized-snapshot", [SOURCE_WARNING, SCORE_WARNING]);
    }
    const ids = input.ids as string[] | undefined ?? snapshot!.nguyenVong.map((n) => n.id);
    const duplicates = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
    const currentIds = snapshot!.nguyenVong.map((n) => n.id);
    const missingIds = currentIds.filter((id) => !ids.includes(id));
    const unselectedIds = ids.filter((id) => !currentIds.includes(id));
    const byId = new Map(catalog.records.map((r) => [r.id, r]));
    const unknownIds = ids.filter((id) => !byId.has(id));
    const data = ids.map((id, i) => ({ thuTu: i + 1, id, comparison: byId.has(id) ? comparison(byId.get(id)!, catalog, snapshot!) : null }));
    return success({ valid: duplicates.length === 0 && unknownIds.length === 0 && missingIds.length === 0 && unselectedIds.length === 0, ids, duplicateIds: duplicates, unknownIds, missingIds, unselectedIds, data,
      warnings: ["Thứ tự cần phản ánh sở thích của em; điểm chuẩn không xác định thứ tự ưu tiên.", ...(data.some((r) => r.comparison?.chenhLech === null) ? ["Một số chương trình chưa đủ dữ liệu so điểm."] : [])],
      limitations: ["Không xác nhận điều kiện dự tuyển, phân bổ chỉ tiêu hay kết quả trúng tuyển."] }, "bundled-catalog-and-authorized-snapshot", [SOURCE_WARNING, SCORE_WARNING]);
  } catch {
    return failure("DATA_UNAVAILABLE", "Không nạp được danh mục tuyển sinh; thử lại sau.");
  }
}

// Lớp trình bày thông tin trường và ngành (Academic Presentation Layer).
// NGUYÊN TẮC:
// 1. Phân định rõ: Raw domain data -> Display model -> UI component.
// 2. Short to scan, detailed on demand.
// 3. Tên trường: luôn phân giải từ mã trường sang tên trường rút gọn, dễ nhận biết. Tuyệt đối không chỉ hiện mã (QSC, GSA, SPK...).
// 4. Tên ngành: tách tên ngành cốt lõi và biến thể chương trình (Chất lượng cao, Dạy bằng tiếng Anh, Việt – Anh...).

import type { LuaChon, NhanNguyenVong } from "@/state/types";
import { DS_TRUONG, resolveTruong, tenTruong } from "./truong";

export interface AcademicDisplayModel {
  universityId: string;
  universityNameOfficial: string;
  universityNameDisplay: string;
  universityCode: string;
  majorNameOfficial: string;
  majorNameDisplay: string;
  programVariant?: string;
  admissionYear: number | null;
  sourceStatus: "da_kiem_chung" | "chua_kiem_chung" | "nguon_thu_cap" | "de_an_chinh_thuc";
  fitCategory: NhanNguyenVong | null;
}

const BANG_TRA_THEO_MA = new Map(DS_TRUONG.map((t) => [t.ma.toUpperCase(), t.ten]));

/**
 * Rút gọn tiền tố trường để hiển thị ngắn gọn nhưng chuẩn xác.
 */
export function rutGonTenTruong(tenDai: string): string {
  if (!tenDai) return "";
  let t = tenDai.trim();
  t = t.replace(/^Trường Đại học\s+/i, "ĐH ")
       .replace(/^Đại học\s+/i, "ĐH ")
       .replace(/^Trường Cao đẳng\s+/i, "CĐ ")
       .replace(/^Cao đẳng\s+/i, "CĐ ")
       .replace(/ - Đại học Quốc gia TP\.?HCM/i, " - ĐHQG TP.HCM")
       .replace(/ - Đại học Quốc gia Hà Nội/i, " - ĐHQGHN")
       .replace(/ - Đại học Đà Nẵng/i, " - ĐH Đà Nẵng")
       .replace(/ - Đại học Huế/i, " - ĐH Huế")
       .replace(/ - Đại học Thái Nguyên/i, " - ĐH Thái Nguyên");
  return t;
}

/**
 * Phân giải mã hoặc tên trường sang định dạng hiển thị đáng tin cậy.
 * Tuyệt đối không để lộ mã trần (QSC, GSA...).
 */
export function phanGiaiTenTruong(
  maHoacTen?: string | null,
  tenDayDu?: string | null
): {
  ma: string;
  tenHienThi: string;
  tenChinhThuc: string;
  daXacMinh: boolean;
} {
  const ma = (maHoacTen || "").trim().toUpperCase();
  const tenGoc = (tenDayDu || "").trim();

  // 1. Mã trường chỉ được phân giải qua danh mục canonical.
  if (ma && BANG_TRA_THEO_MA.has(ma)) {
    const tenDanhMuc = BANG_TRA_THEO_MA.get(ma)!;
    return {
      ma,
      tenHienThi: rutGonTenTruong(tenDanhMuc),
      tenChinhThuc: tenDanhMuc,
      daXacMinh: true,
    };
  }

  // 2. Tên trường chỉ được xác nhận khi khớp duy nhất với danh mục canonical.
  for (const ten of [tenGoc, maHoacTen?.trim() ?? ""]) {
    if (!ten || ten === ma) continue;
    const ketQua = resolveTruong(ten);
    if (ketQua.kieu === "chinh-xac" && ketQua.ma) {
      const tenDanhMuc = tenTruong(ketQua.ma)!;
      return { ma: ketQua.ma, tenHienThi: rutGonTenTruong(tenDanhMuc), tenChinhThuc: tenDanhMuc, daXacMinh: true };
    }
  }

  // 3. Mã hoặc tên chưa phân giải được: không đoán tên trường.
  return {
    ma: "",
    tenHienThi: "Tên trường chưa xác minh",
    tenChinhThuc: "Tên trường chưa xác minh",
    daXacMinh: false,
  };
}

/**
 * Tách tên ngành thành Ngành cốt lõi (Core Major) và Biến thể chương trình (Program Variant).
 * Ví dụ:
 * "Công nghệ thông tin (Chương trình chất lượng cao Công nghệ thông tin Việt - Anh)"
 * -> Core: "Công nghệ thông tin", Variant: "Chương trình Việt – Anh"
 */
export function tachNganhVaBienThe(tenGoc?: string | null): {
  core: string;
  variant?: string;
} {
  let ten = (tenGoc || "").trim();
  if (!ten) return { core: "Chưa có dữ liệu", variant: undefined };

  // 1. Kiểm tra tiền tố trước " - " (ví dụ "CT chuẩn - Kỹ thuật phần mềm")
  let prefixVariant: string | undefined = undefined;
  const TIEN_TO_CHUNG = /^(CT chuẩn|Chuẩn QT|Đại học chính quy|Khoa học giáo dục và đào tạo giáo viên|Chương trình GD Mầm non|Chương trình GD [^-]+)$/i;
  const dashIdx = ten.indexOf(" - ");
  if (dashIdx > 0) {
    const left = ten.slice(0, dashIdx).trim();
    const right = ten.slice(dashIdx + 3).trim();
    if (TIEN_TO_CHUNG.test(left)) {
      ten = right;
      prefixVariant = left.replace(/^CT chuẩn$/i, "Chương trình chuẩn").replace(/^Chuẩn QT$/i, "Chuẩn quốc tế");
    }
  }

  // 2. Tách phần trong ngoặc đơn cuối
  const m = ten.match(/^(.*?)\s*\(([^)]+)\)$/);
  if (!m) {
    return { core: ten, variant: prefixVariant };
  }

  const core = m[1].trim();
  const inside = m[2].trim();

  // Nếu trong ngoặc chỉ là từ viết tắt ngành học (AI, CNTT, KTPM, IoT...) thì giữ nguyên tên đầy đủ
  if (/^[A-Z0-9]{2,5}$/.test(inside)) {
    return { core: ten, variant: prefixVariant };
  }

  // Loại bỏ tên ngành lặp lại bên trong ngoặc
  let v = inside;
  const coreRegex = new RegExp(core.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"), "gi");
  v = v.replace(coreRegex, "").replace(/\s{2,}/g, " ").trim();

  // Nhận diện các biến thể phổ biến theo đề án tuyển sinh
  if (/chất lượng cao.*việt\s*[-–]\s*anh/i.test(inside)) {
    v = "Chương trình Việt – Anh";
  } else if (/đào tạo bằng tiếng anh|dạy bằng tiếng anh|tiếng anh/i.test(inside) && !/ngôn ngữ anh|sư phạm tiếng anh/i.test(core)) {
    v = "Dạy bằng tiếng Anh";
  } else if (/chất lượng cao/i.test(inside)) {
    v = v && !/^chất lượng cao$/i.test(v)
      ? (v.toLowerCase().startsWith("chất lượng cao") ? v : `Chất lượng cao ${v}`)
      : "Chất lượng cao";
  } else if (/tiên tiến/i.test(inside)) {
    v = "Chương trình tiên tiến";
  } else if (/định hướng ứng dụng/i.test(inside)) {
    v = "Định hướng ứng dụng";
  } else if (/liên kết/i.test(inside)) {
    v = v && !/^liên kết$/i.test(v)
      ? (v.toLowerCase().startsWith("liên kết") ? v : `Liên kết ${v}`)
      : "Liên kết quốc tế";
  } else if (/chuẩn/i.test(inside)) {
    v = "Chương trình chuẩn";
  } else if (/tài năng/i.test(inside)) {
    v = "Cử nhân tài năng";
  }

  // Dọn dẹp từ nối thừa
  v = v.replace(/^chuyên ngành[:\s]*/i, "Chuyên ngành ")
       .replace(/^chương trình[:\s]*/i, "Chương trình ")
       .replace(/[-–]\s*$/, "")
       .trim();

  if (v) {
    v = v.charAt(0).toUpperCase() + v.slice(1);
    v = v.replace(/\s*-\s*/g, " – ");
  }

  return {
    core,
    variant: v || prefixVariant,
  };
}

/**
 * Chuyển đổi một đối tượng học thuật (LuaChon) sang AcademicDisplayModel.
 * Hàm này KHÔNG làm thay đổi dữ liệu gốc, chỉ trích xuất góc nhìn hiển thị ngắn gọn, dễ quét.
 */
export function toAcademicDisplay(
  lc: LuaChon | undefined,
  fitCategory: NhanNguyenVong | null = null
): AcademicDisplayModel | null {
  if (!lc) return null;

  const schoolRes = phanGiaiTenTruong(lc.maTruong || lc.truong, lc.tenTruong);
  const majorRes = tachNganhVaBienThe(lc.nganh);

  const sourceStatus: AcademicDisplayModel["sourceStatus"] = lc.daKiemChung
    ? "da_kiem_chung"
    : lc.nguonCap === "official_pdf"
    ? "de_an_chinh_thuc"
    : "nguon_thu_cap";

  return {
    universityId: lc.maTruong || lc.truong || lc.id,
    universityNameOfficial: schoolRes.tenChinhThuc,
    universityNameDisplay: schoolRes.tenHienThi,
    universityCode: schoolRes.ma,
    majorNameOfficial: lc.nganh,
    majorNameDisplay: majorRes.core,
    programVariant: majorRes.variant,
    admissionYear: Number.isInteger(lc.namDiem) && lc.namDiem > 0 ? lc.namDiem : null,
    sourceStatus,
    fitCategory,
  };
}

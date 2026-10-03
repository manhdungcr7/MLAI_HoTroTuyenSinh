import { SchoolRule, registerSchoolRules } from "@/engine/scoring/school-rules";

/**
 * Quy tắc tính điểm riêng của từng trường đã được kiểm chứng với văn bản gốc.
 * Thêm một trường: tạo file <MÃ TRƯỜNG>.json cùng thư mục (xem README.md), import ở đây rồi thêm vào mảng.
 * Trường chưa có trong danh sách dùng công thức mặc định và được ghi rõ là "công thức chung".
 */
export const SCHOOL_RULES: SchoolRule[] = [];

registerSchoolRules(SCHOOL_RULES);

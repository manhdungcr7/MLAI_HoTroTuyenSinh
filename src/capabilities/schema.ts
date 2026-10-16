// JSON Schema dùng chung cho MCP, HTTP và các consumer không phụ thuộc React.
export interface JsonSchema {
  [keyword: string]: unknown;
  type: string | string[];
  properties?: Record<string, JsonSchema>;
  required?: string[];
  additionalProperties?: boolean;
  items?: JsonSchema;
  enum?: readonly (string | number | null)[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  minItems?: number;
  maxItems?: number;
}

export const SUBJECTS = ["toan", "nguVan", "tiengAnh", "vatLy", "hoaHoc", "sinh", "lichSu", "diaLy", "gdktpl", "tinHoc", "congNghe"] as const;
const text = (maxLength = 120): JsonSchema => ({ type: "string", minLength: 1, maxLength });
const page = { limit: { type: "integer", minimum: 1, maximum: 100 }, offset: { type: "integer", minimum: 0, maximum: 10000 } } satisfies Record<string, JsonSchema>;
const filters = { q: text(), tinh: text(60), maTruong: text(12) };
const object = (properties: Record<string, JsonSchema>, required: string[] = []): JsonSchema => ({ type: "object", properties, required, additionalProperties: false });
const scores = object(Object.fromEntries(SUBJECTS.map((s) => [s, { type: ["number", "null"], minimum: 0, maximum: 10 }])));

export const capabilityDefinitions = [
  { name: "search_universities", description: "Tìm trường theo mã, tên, bí danh và tỉnh; kết quả phân trang từ danh mục đi kèm ứng dụng.", inputSchema: object({ q: filters.q, tinh: filters.tinh, ...page }) },
  { name: "get_university", description: "Thông tin trường, phạm vi dữ liệu, năm điểm và liên kết nguồn; không xác nhận dữ liệu chỉ vì có liên kết.", inputSchema: object({ maTruong: filters.maTruong }, ["maTruong"]) },
  { name: "search_majors", description: "Tìm chương trình theo trường, tên ngành, tỉnh và tổ hợp; giữ điểm thiếu là null và nêu phương thức.", inputSchema: object({ ...filters, maToHop: text(6), ...page }) },
  { name: "get_admission_rules", description: "Các phương thức và tổ hợp ghi trong dữ liệu trường; điều kiện, trọng số chưa có được trả null. Công thức THPT là quy tắc đang cài trong ứng dụng, cần đối chiếu văn bản năm xét tuyển.", inputSchema: object({ maTruong: filters.maTruong }, ["maTruong"]) },
  { name: "calculate_admission_score", description: "Tính tổng THPT thang 30 và ưu tiên bằng engine hiện có; không suy điểm môn thiếu, không quy đổi phương thức khác.", inputSchema: object({ maToHop: text(6), diemMon: scores, khuVuc: { type: "string", enum: ["KV1", "KV2-NT", "KV2", "KV3"] }, doiTuong: { type: "string", enum: ["khong", "UT1", "UT2"] } }, ["maToHop", "diemMon"]) },
  { name: "analyze_student_profile", description: "Đọc hồ sơ, mục tiêu và điểm trong bản chụp được cấp quyền; nêu trường thiếu và ngày đồng bộ.", inputSchema: object({}) },
  { name: "recommend_preferences", description: "Gợi ý THPT có cùng tổ hợp đã đồng bộ, theo khoảng cách điểm lịch sử và bộ lọc; không đưa xác suất đỗ, không tự đổi nguyện vọng.", inputSchema: object({ ...filters, limit: { type: "integer", minimum: 1, maximum: 20 } }) },
  { name: "validate_preference_order", description: "Kiểm tra thứ tự gồm đúng các nguyện vọng đã đồng bộ, không thiếu, thêm hay trùng mã; nêu khả năng so điểm, không suy sở thích từ điểm chuẩn và không tự sắp xếp.", inputSchema: object({ ids: { type: "array", items: text(80), maxItems: 30 } }) },
] as const;

export type CapabilityName = (typeof capabilityDefinitions)[number]["name"];

/** Giới hạn đầu vào trước khi nạp dữ liệu; không ép kiểu, cắt bớt hay bỏ field lạ. */
export function validateSchema(value: unknown, schema: JsonSchema, path = "arguments"): string[] {
  const kinds = Array.isArray(schema.type) ? schema.type : [schema.type];
  const kind = value === null ? "null" : Array.isArray(value) ? "array" : typeof value;
  const numeric = typeof value === "number" && Number.isFinite(value);
  if (!kinds.some((k) => k === "integer" ? numeric && Number.isInteger(value) : k === "number" ? numeric : k === kind)) return [`${path}: sai kiểu dữ liệu.`];
  if (schema.enum && !schema.enum.includes(value as string)) return [`${path}: giá trị không được hỗ trợ.`];
  if (numeric && ((schema.minimum !== undefined && value < schema.minimum) || (schema.maximum !== undefined && value > schema.maximum))) return [`${path}: ngoài khoảng cho phép.`];
  if (typeof value === "string" && ((schema.minLength !== undefined && value.trim().length < schema.minLength) || (schema.maxLength !== undefined && value.length > schema.maxLength))) return [`${path}: độ dài không hợp lệ.`];
  if (Array.isArray(value)) {
    if ((schema.minItems !== undefined && value.length < schema.minItems) || (schema.maxItems !== undefined && value.length > schema.maxItems)) return [`${path}: số phần tử không hợp lệ.`];
    return schema.items ? value.flatMap((v, i) => validateSchema(v, schema.items!, `${path}[${i}]`)).slice(0, 10) : [];
  }
  if (kind === "object") {
    const obj = value as Record<string, unknown>, props = schema.properties ?? {};
    const errors = (schema.required ?? []).filter((key) => !Object.hasOwn(obj, key)).map((key) => `${path}.${key}: bắt buộc.`);
    for (const [key, child] of Object.entries(obj)) {
      if (!Object.hasOwn(props, key)) { if (schema.additionalProperties === false) errors.push(`${path}.${key}: trường không được hỗ trợ.`); }
      else errors.push(...validateSchema(child, props[key], `${path}.${key}`));
      if (errors.length >= 10) break;
    }
    return errors.slice(0, 10);
  }
  return [];
}

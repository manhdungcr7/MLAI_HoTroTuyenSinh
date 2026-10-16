// Mô tả OpenAPI 3.1 cho GPT Actions (gói ChatGPT cá nhân). Các operationId khớp với endpoint trong api/gpt/[ma]/.
// Không chứa mã thô ngoài server URL; không có xác thực (mã nằm trong đường dẫn).

const thamSoMa = { name: "ma", in: "path", required: true, schema: { type: "string" }, description: "Mã của kết nối" };
const ketQuaJson = { "200": { description: "OK", content: { "application/json": { schema: { type: "object" } } } }, "404": { description: "Mã không dùng được" } };

export function taoOpenApi(origin: string, ma: string): Record<string, unknown> {
  const get = (operationId: string, summary: string, path: string, parameters: unknown[] = [], extra: Record<string, unknown> = {}) => ({
    [path]: { get: { operationId, summary, parameters: [thamSoMa, ...parameters], responses: ketQuaJson, ...extra } },
  });
  return {
    openapi: "3.1.0",
    info: { title: "Nguyện Vọng AI", version: "1.0.0", description: "Read the student's snapshot (profile, wishes, suggestions, cutoff scores, weekly plan) and propose adding a program. Proposals wait for the student's confirmation in the app. Data is in Vietnamese." },
    servers: [{ url: `${origin}/api/gpt/${ma}` }],
    paths: {
      ...get("layHoSo", "Get the student's profile snapshot", "/ho-so"),
      ...get("layNguyenVong", "Get the ordered list of program choices with cutoff scores", "/nguyen-vong"),
      ...get("layGoiYNganh", "Get suggested programs; each has an id for themNguyenVongDeXuat", "/goi-y"),
      ...get("traDiemChuan", "Look up cutoff scores by major or school name (only the student's choices and suggestions)", "/diem-chuan", [
        { name: "truyVan", in: "query", required: true, schema: { type: "string", maxLength: 100 }, description: "Major or school name" },
      ]),
      ...get("layKeHoachTuan", "Get the weekly study plan with Google Calendar links and .ics URLs", "/ke-hoach-tuan"),
      ...get("layLichIcs", "Download the weekly plan as an iCalendar (.ics) file", "/lich.ics", [], {
        responses: { "200": { description: "iCalendar file", content: { "text/calendar": { schema: { type: "string" } } } }, "404": { description: "Mã không dùng được" } },
      }),
      "/de-xuat/them-nguyen-vong": {
        post: {
          operationId: "themNguyenVongDeXuat",
          summary: "Propose adding a program to the wish list (pending until the student confirms in the app)",
          parameters: [thamSoMa],
          requestBody: {
            required: true,
            content: { "application/json": { schema: { type: "object", required: ["idChuongTrinh"], properties: {
              idChuongTrinh: { type: "string", maxLength: 40, description: "Program id from layGoiYNganh" },
              viTri: { type: "integer", minimum: 1, maximum: 30, description: "Optional position (1 = first)" },
            } } } },
          },
          responses: ketQuaJson,
        },
      },
    },
  };
}

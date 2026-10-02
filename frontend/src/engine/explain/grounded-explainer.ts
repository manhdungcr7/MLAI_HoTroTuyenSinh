/**
 * DUAL-LAYER GROUNDED EXPLAINER & HALLUCINATION GUARDRAIL
 * Lớp bảo vệ kép cho tư vấn AI trong môi trường thương mại hóa:
 * - Tầng 1: Factsheet xác định (Deterministic Factsheet) trích xuất toàn bộ con số chuẩn từ Decision Engine.
 * - Tầng 2: Trình kiểm định biểu thức chính quy (Regex Post-Validator):
 *   Trích xuất mọi con số (điểm số, %, học phí, thứ hạng) trong văn bản tư vấn và đối chiếu
 *   với Factsheet. Nếu phát hiện số ảo / bịa đặt (Hallucination), lập tức từ chối và fallback
 *   về bản giải thích mẫu chuẩn 100% dữ liệu thật.
 */

export interface GroundedFactsheet {
  userScore: number;
  forecastP50: number;
  forecastP10: number;
  forecastP90: number;
  gap: number;
  admitProbabilityPct: number; // e.g. 75 (%)
  pFailAllPct?: number;        // e.g. 1.45 (%)
  tuitionMillionVnd?: number | null;
  rank?: number;
  schoolCode: string;
  majorName: string;
}

export interface GroundingValidationResult {
  isValid: boolean;
  hallucinatedTokens: string[];
  explanationText: string;
  source: "llm_verified" | "deterministic_fallback";
}

/**
 * Trích xuất toàn bộ các số thực và số nguyên từ văn bản tự nhiên
 */
export function extractNumericTokens(text: string): number[] {
  // Bắt các số dạng: 27.5, 27,5, 85%, 35 tr, 1.45
  const normalized = text.replace(/,/g, ".");
  const matches = normalized.match(/-?\b\d+(\.\d+)?\b/g);
  if (!matches) return [];
  return matches.map(Number).filter((n) => Number.isFinite(n));
}

/**
 * Tạo danh sách các số hợp lệ (Valid Numerical Corpus) từ Factsheet
 */
export function buildAllowedNumberCorpus(fact: GroundedFactsheet): Set<number> {
  const allowed = new Set<number>();

  const addNumberWithRounding = (val: number | null | undefined) => {
    if (val === null || val === undefined || !Number.isFinite(val)) return;
    allowed.add(val);
    allowed.add(Math.round(val));
    allowed.add(Number(val.toFixed(1)));
    allowed.add(Number(val.toFixed(2)));
  };

  addNumberWithRounding(fact.userScore);
  addNumberWithRounding(fact.forecastP50);
  addNumberWithRounding(fact.forecastP10);
  addNumberWithRounding(fact.forecastP90);
  addNumberWithRounding(fact.gap);
  addNumberWithRounding(Math.abs(fact.gap));
  addNumberWithRounding(fact.admitProbabilityPct);
  if (fact.pFailAllPct !== undefined) addNumberWithRounding(fact.pFailAllPct);
  if (fact.tuitionMillionVnd !== null && fact.tuitionMillionVnd !== undefined) {
    addNumberWithRounding(fact.tuitionMillionVnd);
  }
  if (fact.rank !== undefined) {
    allowed.add(fact.rank);
  }

  // Các hằng số quy chế phổ biến trong tư vấn tuyển sinh Việt Nam
  const regulatoryConstants = [10, 15, 20, 22.5, 30, 3, 5, 1, 2, 4, 15, 100];
  regulatoryConstants.forEach((n) => allowed.add(n));

  return allowed;
}

/**
 * Kiểm tra xem một số trong văn bản có tồn tại trong Factsheet hay không (với sai số e <= 0.05)
 */
function isNumberGrounded(num: number, allowedSet: Set<number>): boolean {
  for (const allowed of allowedSet) {
    if (Math.abs(num - allowed) <= 0.06) return true;
  }
  return false;
}

/**
 * Tạo bản giải thích mẫu chuẩn xác định 100% (Deterministic Template)
 */
export function generateDeterministicExplanation(fact: GroundedFactsheet): string {
  const gapText = fact.gap >= 0 ? `cao hơn +${fact.gap.toFixed(2)}đ` : `thấp hơn ${Math.abs(fact.gap).toFixed(2)}đ`;
  const tuitionText = fact.tuitionMillionVnd ? `Học phí ước tính khoảng ${fact.tuitionMillionVnd} triệu/năm.` : "Học phí theo quy chế chung.";

  return (
    `Điểm xét tuyển của bạn đạt ${fact.userScore.toFixed(2)}đ, đang ${gapText} so với điểm chuẩn P50 ` +
    `(${fact.forecastP50.toFixed(2)}đ) của ngành ${fact.majorName} (${fact.schoolCode}). ` +
    `Xác suất trúng tuyển ước tính đạt ${fact.admitProbabilityPct}% trong dải bất định ` +
    `[${fact.forecastP10.toFixed(2)}đ - ${fact.forecastP90.toFixed(2)}đ]. ${tuitionText}`
  );
}

/**
 * Tầng 2: Hậu kiểm định Regex Post-Validator chống Hallucination
 */
export function verifyAndEnforceGroundedNarrative(
  generatedText: string,
  fact: GroundedFactsheet
): GroundingValidationResult {
  if (!generatedText || generatedText.trim().length === 0) {
    return {
      isValid: false,
      hallucinatedTokens: ["EMPTY_TEXT"],
      explanationText: generateDeterministicExplanation(fact),
      source: "deterministic_fallback",
    };
  }

  const tokens = extractNumericTokens(generatedText);
  const allowedSet = buildAllowedNumberCorpus(fact);
  const hallucinated: string[] = [];

  for (const token of tokens) {
    if (!isNumberGrounded(token, allowedSet)) {
      hallucinated.push(String(token));
    }
  }

  if (hallucinated.length > 0) {
    // Phát hiện số liệu bịa đặt -> Fallback an toàn về bản chuẩn xác định
    return {
      isValid: false,
      hallucinatedTokens: hallucinated,
      explanationText: generateDeterministicExplanation(fact),
      source: "deterministic_fallback",
    };
  }

  return {
    isValid: true,
    hallucinatedTokens: [],
    explanationText: generatedText,
    source: "llm_verified",
  };
}

/**
 * Tầng 3: Tích hợp gọi LLM trực tiếp (OpenAI / Cloudflare Workers AI tương thích)
 * Kèm bắt buộc chạy qua Tầng 2 Regex Post-Validator trước khi xuất xưởng ra UI.
 */
export async function generateGroundedLlmExplanation(
  fact: GroundedFactsheet,
  apiConfig?: { endpoint?: string; apiKey?: string; model?: string }
): Promise<GroundingValidationResult> {
  const endpoint =
    apiConfig?.endpoint ||
    (typeof process !== "undefined" && process.env?.VITE_AI_EXPLAINER_ENDPOINT) ||
    "";

  if (!endpoint) {
    return {
      isValid: true,
      hallucinatedTokens: [],
      explanationText: generateDeterministicExplanation(fact),
      source: "deterministic_fallback",
    };
  }

  try {
    const prompt = `Bạn là trợ lý tư vấn tuyển sinh đại học Việt Nam. Dựa TRUYỆT ĐỐI vào số liệu sự thật sau đây:
- Điểm học sinh: ${fact.userScore.toFixed(2)}đ
- Điểm chuẩn P50 dự báo: ${fact.forecastP50.toFixed(2)}đ
- Dải dự báo [P10 - P90]: [${fact.forecastP10.toFixed(2)}đ - ${fact.forecastP90.toFixed(2)}đ]
- Độ lệch điểm: ${fact.gap.toFixed(2)}đ
- Xác suất đỗ: ${fact.admitProbabilityPct}%
- Trường: ${fact.schoolCode}, Ngành: ${fact.majorName}
- Học phí: ${fact.tuitionMillionVnd ? fact.tuitionMillionVnd + " triệu VNĐ/năm" : "Theo quy chế chung"}

YÊU CẦU BẮT BUỘC:
Chỉ viết 2-3 câu tư vấn trung thực, súc tích. TUYỆT ĐỐI KHÔNG BỊA ĐẶT bất kỳ con số nào khác ngoài các con số trên.`;

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiConfig?.apiKey ? { Authorization: `Bearer ${apiConfig.apiKey}` } : {}),
      },
      body: JSON.stringify({
        model: apiConfig?.model || "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
      }),
    });

    if (!res.ok) {
      return {
        isValid: false,
        hallucinatedTokens: ["FETCH_ERROR_" + res.status],
        explanationText: generateDeterministicExplanation(fact),
        source: "deterministic_fallback",
      };
    }

    const data = await res.json();
    const rawText = data?.choices?.[0]?.message?.content || data?.result?.response || "";
    return verifyAndEnforceGroundedNarrative(rawText, fact);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "NETWORK_ERROR";
    return {
      isValid: false,
      hallucinatedTokens: [message],
      explanationText: generateDeterministicExplanation(fact),
      source: "deterministic_fallback",
    };
  }
}


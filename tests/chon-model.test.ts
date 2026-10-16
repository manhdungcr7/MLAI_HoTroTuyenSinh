// OpenRouter không được nhận id Workers AI ("@cf/...") từ biến AI_MODEL dùng chung. Chạy: npx tsx tests/chon-model.test.ts
import assert from "node:assert/strict";
import { goiMoHinh, modelNgoai } from "../functions/_thu-vien/ai/sinh-van-ban";

assert.equal(modelNgoai({ AI_MODEL: "@cf/meta/llama-3.3-70b-instruct" }), undefined);
assert.equal(modelNgoai({ AI_MODEL: "anthropic/claude-haiku-5.5" }), "anthropic/claude-haiku-5.5");
assert.equal(modelNgoai({}), undefined);

const guiDi = async (env: Parameters<typeof goiMoHinh>[0]) => {
  let model = "";
  const f = (async (_u: string, init: RequestInit) => { model = JSON.parse(String(init.body)).model; return { ok: true, status: 200, json: async () => ({ choices: [{ message: { content: "{}" } }] }) }; }) as unknown as typeof fetch;
  await goiMoHinh(env, "x", f);
  return model;
};
assert.equal(await guiDi({ OPENROUTER_API_KEY: "k", AI_MODEL: "@cf/meta/llama-3.3-70b-instruct" }), "anthropic/claude-haiku-5.5");
assert.equal(await guiDi({ OPENROUTER_API_KEY: "k" }), "anthropic/claude-haiku-5.5");
assert.equal(await guiDi({ OPENROUTER_API_KEY: "k", AI_MODEL: "openai/gpt-5-mini" }), "openai/gpt-5-mini");
console.log("chon-model: OK");

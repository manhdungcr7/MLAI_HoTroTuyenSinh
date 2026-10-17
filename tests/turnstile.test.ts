import assert from "node:assert/strict";
import { xacThucTurnstile } from "../functions/_thu-vien/turnstile";

async function testTurnstile() {
  // 1. Chưa cấu hình secret -> Luôn cho qua (Local dev / CI)
  {
    const r = await xacThucTurnstile(undefined, null);
    assert.equal(r.hopLe, true);
    assert.equal(r.lyDo, "chua-cau-hinh-secret");
  }

  // 2. Có secret nhưng thiếu token -> Chặn bot
  {
    const r = await xacThucTurnstile("0x4AAAAAA...", "");
    assert.equal(r.hopLe, false);
    assert.equal(r.lyDo, "thieu-token");
  }

  // 3. Mock fetch trả về success: true
  {
    const mockFetch = async () =>
      new Response(JSON.stringify({ success: true, hostname: "nguyenvongai.vn" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    const r = await xacThucTurnstile("0x4AAAAAA...", "dummy-token", "1.1.1.1", mockFetch as unknown as typeof fetch);
    assert.equal(r.hopLe, true);
    assert.equal(r.hostname, "nguyenvongai.vn");
  }

  // 4. Mock fetch trả về invalid-input-response
  {
    const mockFetch = async () =>
      new Response(JSON.stringify({ success: false, "error-codes": ["invalid-input-response"] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    const r = await xacThucTurnstile("0x4AAAAAA...", "fake-token", "1.1.1.1", mockFetch as unknown as typeof fetch);
    assert.equal(r.hopLe, false);
    assert.equal(r.lyDo, "invalid-input-response");
  }

  // 5. Mock fetch bị timeout hoặc lỗi mạng -> Fail-Open bảo vệ người dùng thật
  {
    const mockFetch = async () => {
      throw new Error("Connection timeout");
    };
    const r = await xacThucTurnstile("0x4AAAAAA...", "any-token", "1.1.1.1", mockFetch as unknown as typeof fetch);
    assert.equal(r.hopLe, true);
    assert.equal(r.lyDo, "fail-open-timeout");
  }

  console.log("turnstile.test.ts: tất cả kiểm tra đều qua");
}

testTurnstile();

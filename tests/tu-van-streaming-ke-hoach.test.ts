import "./nap-du-lieu";
import assert from "node:assert/strict";
import { tomTatKeHoachChoAI, tomTatHoSo } from "../src/features/tu-van/lay-du-lieu";
import { layTinTraLoi, hoiAI } from "../src/features/tu-van/cau-tra-loi";
import { TRANG_THAI_BAN_DAU } from "../src/state/mau";
import { LUA_CHON_MAU } from "../src/data/lua-chon-mau";
import type { AppState } from "../src/state/store";

const hoSoMau: AppState = {
  ...TRANG_THAI_BAN_DAU,
  hoSo: {
    ...TRANG_THAI_BAN_DAU.hoSo,
    hoTen: "Nguyễn Minh Anh",
    khoi: 12,
    tinh: "TP. Hồ Chí Minh",
    nganhQuanTam: ["CNTT"],
    diem: { toan: 8.0, vatLy: 8.5, hoaHoc: 8.0, sinh: 7.0, nguVan: 7.0, tiengAnh: 7.0 },
  },
};

// 1. Kiểm tra trích xuất kế hoạch học tập vào prompt ngữ cảnh
{
  const chon = LUA_CHON_MAU[0];
  const s: AppState = {
    ...hoSoMau,
    mucTieu: {
      luaChonId: chon.id,
      phuongThuc: "THPT",
      maToHop: "A00",
      toHop: ["toan", "vatLy", "hoaHoc"],
      diemMucTieu: 27.5,
      ngayThi: "2026-06-26",
    },
    hoSo: {
      ...hoSoMau.hoSo,
      diem: {
        toan: 8.0,
        vatLy: 8.5,
        hoaHoc: 8.0,
        sinh: 7.0,
        nguVan: 7.0,
        tiengAnh: 7.0,
      },
    },
    viec: [
      {
        id: "v1",
        mon: "toan",
        tieuDe: "Luyện đề Toán",
        chiTiet: "Chi tiết",
        phut: 90,
        mucUuTien: "cao",
        lyDo: "Kéo điểm",
        tieuChi: [],
        taiLieu: [],
      },
    ],
    trangThaiViec: { v1: "xong" },
  };

  const kh = tomTatKeHoachChoAI(s);
  assert.ok(kh.includes("Kế hoạch học tập mục tiêu"), "phải có tiêu đề kế hoạch học tập");
  assert.ok(kh.includes("Toán"), "phải có phân tích môn Toán");
  assert.ok(kh.includes("bứt phá"), "phải chỉ ra môn trọng tâm bứt phá");

  const hs = tomTatHoSo(s);
  assert.ok(hs.mucTieu && hs.mucTieu.includes("A00"), "hồ sơ tóm tắt phải có tổ hợp mục tiêu");
  assert.ok(hs.monCanKeo && hs.monCanKeo.includes("Toán"), "hồ sơ tóm tắt phải có môn cần kéo điểm");
}

// 2. Kiểm tra trước khi hết 50 lượt: KHÔNG ĐƯỢC CHẶN BỞI RULES TẤT ĐỊNH
{
  let daGoiFetch = false;
  const giaFetch: typeof fetch = async () => {
    daGoiFetch = true;
    return new Response(JSON.stringify({ traLoi: "AI tư vấn kế hoạch ôn thi bứt phá", tang: "llm" }), {
      headers: { "content-type": "application/json" },
    });
  };

  const tin = await layTinTraLoi({
    cau: "Lên kế hoạch học tập giúp em môn Toán",
    truoc: [],
    s: hoSoMau,
    nguon: null,
    dungHoSo: true,
    manHinh: "Kế hoạch tuần",
    phien: {
      cheDo: "ai",
      idHoSo: "12345678-1234-4234-8234-123456789abc",
      luot: { con: 48, toiDa: 50 },
      fetch: giaFetch,
    },
  });

  assert.equal(daGoiFetch, true, "trước khi hết 50 lượt phải gọi AI thật sự, không dùng rule tất định chặn trước");
  assert.equal(tin.cheDo, "ai", "tin nhắn phản hồi phải là chế độ AI");
  assert.equal(tin.chu, "AI tư vấn kế hoạch ôn thi bứt phá");
}

// 3. Kiểm tra khi hết 50 lượt: tự động fallback sang rule tất định kèm ghi chú
{
  let daGoiFetch = false;
  const giaFetch: typeof fetch = async () => {
    daGoiFetch = true;
    return new Response(JSON.stringify({ loi: "het-luot-ngay" }), { status: 429 });
  };

  const tin = await layTinTraLoi({
    cau: "Lên kế hoạch học tập giúp em",
    truoc: [],
    s: hoSoMau,
    nguon: null,
    dungHoSo: true,
    manHinh: "Kế hoạch tuần",
    phien: {
      cheDo: "ai",
      idHoSo: "12345678-1234-4234-8234-123456789abc",
      luot: { con: 0, toiDa: 50 },
      fetch: giaFetch,
    },
  });

  assert.equal(daGoiFetch, false, "hết lượt sẵn thì không gọi fetch tốn công");
  assert.equal(tin.cheDo, "tuDong", "phải fallback về tuDong");
  assert.ok(tin.ghiChu && tin.ghiChu.includes("hết 50 lượt AI"), "phải có ghi chú hết 50 lượt");
}

// 4. Kiểm tra streaming SSE chunks qua onChunk
{
  const sseBody = [
    `data: ${JSON.stringify({ token: "Chào " })}\n\n`,
    `data: ${JSON.stringify({ token: "em, " })}\n\n`,
    `data: ${JSON.stringify({ token: "đây là lộ trình học." })}\n\n`,
    `data: ${JSON.stringify({ xong: true, traLoi: "Chào em, đây là lộ trình học.", tang: "llm", luot: { con: 47, toiDa: 50 } })}\n\n`,
  ].join("");

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(sseBody));
      controller.close();
    },
  });

  const chunks: string[] = [];
  const giaFetch: typeof fetch = async () => {
    return new Response(stream, {
      headers: { "content-type": "text/event-stream; charset=utf-8" },
    });
  };

  const kq = await hoiAI(
    { cauHoi: "Học thế nào?", duLieu: [] },
    {
      cheDo: "ai",
      idHoSo: "12345678-1234-4234-8234-123456789abc",
      luot: { con: 48, toiDa: 50 },
      fetch: giaFetch,
    },
    (doan) => chunks.push(doan)
  );

  assert.ok(chunks.length >= 3, "phải nhận được nhiều chunk stream");
  assert.equal(chunks[0], "Chào ", "chunk đầu tiên phải có mặt ngay lập tức");
  assert.equal(kq.kq?.traLoi, "Chào em, đây là lộ trình học.", "kết quả cuối cùng phải khớp trọn vẹn");
}

console.log("tu-van-streaming-ke-hoach: tất cả kiểm tra đều qua");

// Đo thử AI hiện tại (lời nhắc hiện có) trên vài câu hỏi thật. Chạy: npx tsx scripts/ai-eval/co-so.ts "F:/MLAI_Hackathon/env"
import { goiMoHinh } from "../../functions/_thu-vien/ai/sinh-van-ban";
import { docPhanHoiLLM, dungNoiDung, soLieuLech, type YeuCauTuVan } from "../../src/engine/tu-van";
import { napEnvAI } from "./nap";
import { suKien } from "./su-kien";

const env = napEnvAI(process.argv[2]);
const hoSo = { lop: 12, tinh: "TP.HCM", nganhQuanTam: ["Công nghệ thông tin"], nganSachToiDaTrieu: 40, toHopCaoNhat: { ma: "A01", tong: 25.5 } };
const ca: { ten: string; y: YeuCauTuVan }[] = [
  { ten: "so sánh 2 trường cùng ngành", y: { cauHoi: "So sánh ngành Công nghệ thông tin của HUTECH và UEF giúp mình, mình nên chọn trường nào?", hoSo,
      duLieu: [suKien("DKC", "cong nghe thong tin", 25.5), suKien("UEF", "cong nghe thong tin", 25.5)] } },
  { ten: "so sánh 3 trường", y: { cauHoi: "Mình đang phân vân Công nghệ thông tin ở Công nghệ Sài Gòn, Văn Lang hay Hoa Sen, so sánh giúp mình", hoSo,
      duLieu: [suKien("DSG", "cong nghe thong tin", 25.5), suKien("DVL", "cong nghe thong tin", 25.5), suKien("HSU", "cong nghe thong tin", 25.5)] } },
  { ten: "tư vấn mở", y: { cauHoi: "Mình được 25,5 điểm khối A01, ở TP.HCM, thích lập trình nhưng ngân sách không quá 40 triệu một năm. Nên xếp nguyện vọng thế nào?", hoSo,
      duLieu: [suKien("DKC", "cong nghe thong tin", 25.5), suKien("UEF", "cong nghe thong tin", 25.5), suKien("SPK", "cong nghe thong tin", 25.5)] } },
];

for (const c of ca) {
  const noiDung = dungNoiDung(c.y);
  const t0 = Date.now();
  let tho = "";
  try { tho = await goiMoHinh(env, noiDung); } catch (e) { tho = `LỖI: ${(e as Error).message}`; }
  const r = docPhanHoiLLM(tho, c.y, c.y.duLieu.map((d) => d.id));
  const lech = soLieuLech(r.traLoi, c.y);
  console.log(`\n=== ${c.ten} (${Date.now() - t0} ms, ${noiDung.length} ký tự đầu vào) ===\n${r.traLoi}\n[ý định: ${r.intent ?? "-"} | từ: ${r.traLoi.split(/\s+/).length} | số lệch: ${lech.length ? lech.join(",") : "không"}]`);
}

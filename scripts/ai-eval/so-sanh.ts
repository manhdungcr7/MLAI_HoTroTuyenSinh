// Đo làn SO SÁNH: bảng dựng từ dữ liệu thật + lời nhắc NHAC_SO_SANH + model thật. In câu trả lời và kết quả hậu kiểm số liệu.
// Chạy: npx tsx scripts/ai-eval/so-sanh.ts "F:/MLAI_Hackathon/env" ["câu hỏi tùy chọn"]
import "../../tests/nap-du-lieu";
import { goiMoHinh } from "../../functions/_thu-vien/ai/sinh-van-ban";
import { tim } from "../../src/data/lua-chon-mau";
import { NHAC_SO_SANH, docPhanHoiLLM, dungNoiDung, soLieuLech, type YeuCauTuVan } from "../../src/engine/tu-van";
import { diemDayDu } from "../../src/features/kham-pha/to-hop";
import { dungBangSoSanh, tomTatChoAI } from "../../src/features/tu-van/bang-so-sanh";
import { dungSuKien, tomTatHoSo, traLoiTuDong } from "../../src/features/tu-van/lay-du-lieu";
import { taoHoSoMau } from "../../src/state/mau";
import { napEnvAI } from "./nap";

const env = napEnvAI(process.argv[2]);
const s = taoHoSoMau("minhAnh");
const diem = diemDayDu(s);
const cau = process.argv[3]
  ? [process.argv[3]]
  : [
      "So sánh HUTECH và UEF ngành Công nghệ thông tin, mình nên chọn trường nào?",
      "So sánh ngành Công nghệ thông tin ở Công nghệ Sài Gòn, Văn Lang và Hoa Sen",
      "So sánh Bách Khoa Hà Nội và Xây dựng Hà Nội ngành Kỹ thuật xây dựng",
      "Mình phân vân Kinh tế Quốc dân với Ngoại thương, so sánh giúp mình",
    ];

console.log(`Hồ sơ mẫu: ${JSON.stringify(tomTatHoSo(s))}\n`);
for (const c of cau) {
  const td = traLoiTuDong(c, s, null, [], []);
  if (!td.soSanh) { console.log(`\n=== ${c}\n(không dựng được bảng) ${td.traLoi.slice(0, 160)}`); continue; }
  const ls = td.soSanh.ids.map((i) => tim(i)!);
  const bang = dungBangSoSanh(ls, diem);
  const y: YeuCauTuVan = { cauHoi: c, hoSo: tomTatHoSo(s), duLieu: ls.map((l) => dungSuKien(l, diem, null)), bangSoSanh: tomTatChoAI(bang) };
  const t0 = Date.now();
  let tho = "";
  try { tho = await goiMoHinh(env, dungNoiDung(y), fetch, 15_000, { nhac: NHAC_SO_SANH, tokenRa: 700 }); } catch (e) { tho = `LỖI ${(e as Error).message}`; }
  const r = docPhanHoiLLM(tho, y, y.duLieu.map((d) => d.id));
  const lech = soLieuLech(r.traLoi, y);
  console.log(`\n=== ${c}  (${Date.now() - t0} ms, ${r.traLoi.split(/\s+/).length} từ, số lệch: ${lech.length ? lech.join(", ") : "không"})\n${r.traLoi}`);
}

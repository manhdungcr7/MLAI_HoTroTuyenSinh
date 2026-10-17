// Thử nhánh so sánh tự động (không gọi AI) trên dữ liệu thật. Chạy: npx tsx scripts/ai-eval/thu-so-sanh.ts
import "../../tests/nap-du-lieu";
import { traLoiTuDong } from "../../src/features/tu-van/lay-du-lieu";
import { tim } from "../../src/data/lua-chon-mau";
import { diemDayDu } from "../../src/features/kham-pha/to-hop";
import { dungBangSoSanh, tomTatChoAI } from "../../src/features/tu-van/bang-so-sanh";
import { TRANG_THAI_BAN_DAU } from "../../src/state/mau";

const s = { ...TRANG_THAI_BAN_DAU } as never;
for (const cau of ["So sánh HUTECH và UEF", "So sánh Bách Khoa Hà Nội và Xây dựng Hà Nội ngành Kỹ thuật xây dựng", "so sánh ngành Công nghệ thông tin ở Công nghệ Sài Gòn, Văn Lang và Hoa Sen"]) {
  const r = traLoiTuDong(cau, s, null, [], []);
  console.log("\n###", cau, "\n→", r.traLoi.slice(0, 400), "\n   soSanh:", JSON.stringify(r.soSanh), "| luaChon:", r.luaChon?.map((l) => l.nhan).join(", ") ?? "-");
  if (r.soSanh) {
    const ls = r.soSanh.ids.map((i) => tim(i)!);
    console.log(tomTatChoAI(dungBangSoSanh(ls, diemDayDu(s))));
  }
}

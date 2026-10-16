import { LUA_CHON_MAU } from "@/data/lua-chon-mau";
import { DS_TRUONG } from "@/engine/truong";
import { rutGonTenTruong, toAcademicDisplay } from "@/engine/trinh-bay-hoc-thuat";

const tenTruongTheoMa = new Map(DS_TRUONG.map((truong) => {
  const luaChon = LUA_CHON_MAU.find((x) => x.maTruong === truong.ma);
  const ten = toAcademicDisplay(luaChon)?.universityNameDisplay ?? rutGonTenTruong(truong.ten);
  return [truong.ma, ten] as const;
}));
const maTruong = [...tenTruongTheoMa.keys()].sort((a, b) => b.length - a.length);
const mauMaTruong = new RegExp(`\\b(${maTruong.join("|")})\\b`, "gi");

const LOI_TRINH_BAY = "Mình chưa thể trình bày câu trả lời này. Em thử hỏi lại bằng tên trường hoặc ngành nhé.";

/** Chỉ lấy câu trả lời dành cho học sinh; không hiển thị nhầm gói JSON hoặc mã trường trần. */
export function trinhBayPhanHoi(noiDung: string): string {
  let sach = noiDung.trim();
  const fenced = sach.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenced) sach = fenced[1].trim();

  if (sach.startsWith("{") || sach.startsWith("[")) {
    try {
      const object = JSON.parse(sach) as { traLoi?: unknown };
      if (typeof object.traLoi !== "string" || !object.traLoi.trim()) return LOI_TRINH_BAY;
      sach = object.traLoi.trim();
    } catch {
      return LOI_TRINH_BAY;
    }
  }

  return sach
    .replace(/\s*\[(?:nguồn|source)\s*:\s*[^\]]+\]/gi, "")
    .replace(mauMaTruong, (ma) => tenTruongTheoMa.get(ma.toUpperCase()) ?? "Tên trường chưa xác minh");
}

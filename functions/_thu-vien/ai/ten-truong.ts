// Nhận diện trường và tỉnh được nêu trong câu hỏi. Danh mục trường và chuẩn hóa tiếng Việt dùng chung với app: src/engine/truong.ts.
import { DS_TRUONG, chuanHoa as bo } from "../../../src/engine/truong";

const boTienTo = (s: string) => bo(s).replace(/^(truong |dai hoc |dh |hoc vien )+/, "");
const TINH_DS = [...new Set(DS_TRUONG.flatMap((t) => t.tinh))].map((t) => ({ t, k: bo(t) }));
const BANG = DS_TRUONG.map(({ ma, ten, tinh }) => {
  const [loi, ...duoi] = ten.split(" - ");
  return { ma, tinh: tinh[0], loi: boTienTo(loi), duoi: boTienTo(duoi.join(" - ")), day: bo(ten), codeLower: ma.toLowerCase() };
});

/** Trường và tỉnh được nêu trong câu hỏi (tên trường, mã trường dạng từ riêng, tên tỉnh). Tối đa `toiDa` trường, ưu tiên tên dài. */
export function nhanDienTruongTinh(cauHoi: string, toiDa = 2): { truong: string[]; tinh: string[] } {
  const q = ` ${bo(cauHoi)} `;
  const co = (k: string) => k.length >= 3 && q.includes(` ${k} `);
  const khop = BANG.filter((b) => co(b.codeLower) || co(b.day) || (co(b.loi) && !TINH_DS.some((x) => x.k === b.loi) && (!b.duoi || co(b.duoi))))
    .sort((a, b) => b.loi.length - a.loi.length);
  const tinh = TINH_DS.filter((x) => co(x.k)).map((x) => x.t);
  return { truong: khop.slice(0, toiDa).map((b) => b.ma), tinh };
}

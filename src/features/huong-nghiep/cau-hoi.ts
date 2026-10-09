// Trắc nghiệm hướng nghiệp theo mô hình Holland (RIASEC), viết lại bằng TÌNH HUỐNG THẬT của học sinh thay vì câu "em có thích...":
// 12 câu, mỗi câu 4 tình huống, em chọn tình huống giống mình nhất. Chọn một thứ (thay vì chấm mức thích) buộc em phải cân nhắc,
// nên kết quả phân biệt được hơn: em "thích gần hết mọi thứ" vẫn ra được thiên hướng. Thêm một câu về điều em coi trọng ở nghề.
// TypeScript thuần, không React. Kết quả chỉ gợi ý nhóm ngành để em tìm hiểu, không phải chẩn đoán hay kết luận về con người em.
import type { KetQuaSoThich, LoaiSoThich } from "@/state/types";

export const CAC_LOAI: LoaiSoThich[] = ["R", "I", "A", "S", "E", "C"];

export const THONG_TIN_LOAI: Record<LoaiSoThich, { ten: string; moTa: string }> = {
  R: { ten: "Thực hành", moTa: "Thích làm ra thứ cụ thể bằng tay, máy móc, công cụ; làm ngoài trời hoặc ở xưởng." },
  I: { ten: "Tìm tòi", moTa: "Thích hiểu vì sao và hoạt động ra sao: phân tích, giải bài khó, nghiên cứu tới cùng." },
  A: { ten: "Sáng tạo", moTa: "Thích thể hiện ý tưởng riêng qua hình ảnh, chữ viết, âm nhạc, thiết kế." },
  S: { ten: "Giúp đỡ", moTa: "Thích làm việc với con người: dạy, chăm sóc, lắng nghe, giúp người khác tiến bộ." },
  E: { ten: "Dẫn dắt", moTa: "Thích thuyết phục, tổ chức, kinh doanh, đứng ra quyết định và chịu trách nhiệm." },
  C: { ten: "Cẩn thận, ngăn nắp", moTa: "Thích làm việc có quy trình, số liệu chính xác, sắp xếp mọi thứ gọn gàng." },
};

export interface TinhHuong { loai: LoaiSoThich; chu: string }
export interface CauHoi { chu: string; luaChon: TinhHuong[] }

export const CAC_CAU_HOI: CauHoi[] = [
  { chu: "Cuối tuần được rảnh cả ngày, em dễ rơi vào việc nào nhất?", luaChon: [
    { loai: "R", chu: "Tháo lắp, sửa đồ, đạp xe đi đâu đó hoặc làm đồ thủ công" },
    { loai: "I", chu: "Xem video khoa học, tập lập trình hoặc giải câu đố đến khi hiểu ra" },
    { loai: "A", chu: "Vẽ, chụp ảnh, dựng video, viết hoặc sáng tác gì đó của riêng mình" },
    { loai: "S", chu: "Gặp bạn bè, giúp người trong nhà hoặc đi tình nguyện" },
  ] },
  { chu: "Làm dự án nhóm ở lớp, em thường nhận phần nào?", luaChon: [
    { loai: "E", chu: "Chia việc, thuyết phục cả nhóm và đứng ra thuyết trình" },
    { loai: "C", chu: "Lên lịch, ghi chép, kiểm tra từng chi tiết cho khớp" },
    { loai: "I", chu: "Tìm tài liệu, phân tích và tìm ra cách giải quyết" },
    { loai: "A", chu: "Nghĩ ý tưởng, làm slide và phần trình bày cho đẹp, cuốn hút" },
  ] },
  { chu: "Điều nào khiến em thấy “đã” nhất sau một ngày?", luaChon: [
    { loai: "R", chu: "Làm ra được một thứ chạy được hoặc cầm nắm được" },
    { loai: "S", chu: "Có người nói nhờ em mà họ hiểu bài, hoặc vui hơn" },
    { loai: "E", chu: "Thuyết phục được người khác làm theo ý tưởng của mình" },
    { loai: "C", chu: "Mọi thứ gọn gàng, đúng hạn, không sai sót nào" },
  ] },
  { chu: "Nếu chọn một câu lạc bộ ở trường, em chọn câu lạc bộ nào?", luaChon: [
    { loai: "R", chu: "Robot, cơ khí, sửa chữa, làm mô hình" },
    { loai: "I", chu: "Khoa học, Toán, lập trình thi đấu" },
    { loai: "A", chu: "Báo chí, âm nhạc, mỹ thuật, kịch" },
    { loai: "E", chu: "Kinh doanh, tranh biện, tổ chức sự kiện" },
  ] },
  { chu: "Bạn thân đang buồn vì một chuyện, em sẽ làm gì?", luaChon: [
    { loai: "S", chu: "Ngồi nghe và ở bên bạn" },
    { loai: "I", chu: "Cùng bạn phân tích nguyên nhân và các cách giải quyết" },
    { loai: "E", chu: "Rủ bạn đi đâu đó và đứng ra lo giúp bạn chuyện đó" },
    { loai: "C", chu: "Giúp bạn lập danh sách việc cần làm, từng bước một" },
  ] },
  { chu: "Loại bài nào làm em hăng nhất?", luaChon: [
    { loai: "I", chu: "Bài Toán hoặc Lý khó, càng khó càng hứng" },
    { loai: "A", chu: "Bài viết tự do hoặc bài sáng tạo, ai cũng làm khác nhau" },
    { loai: "C", chu: "Bài có nhiều bước tính chính xác, bảng biểu, số liệu" },
    { loai: "R", chu: "Thí nghiệm, thực hành hoặc làm mô hình" },
  ] },
  { chu: "Em thấy mình hợp nơi làm việc nào nhất?", luaChon: [
    { loai: "R", chu: "Xưởng, công trường, phòng thí nghiệm hoặc ngoài trời" },
    { loai: "S", chu: "Trường học, bệnh viện, nơi gặp nhiều người cần giúp" },
    { loai: "E", chu: "Công ty: họp bàn, gặp khách hàng, đàm phán" },
    { loai: "C", chu: "Văn phòng yên tĩnh với số liệu và hồ sơ" },
  ] },
  { chu: "Nghe tin về một sản phẩm mới (ứng dụng, xe điện...), em tò mò nhất điều gì?", luaChon: [
    { loai: "I", chu: "Bên trong nó hoạt động thế nào" },
    { loai: "E", chu: "Bán cho ai và kiếm tiền ra sao" },
    { loai: "A", chu: "Nó được thiết kế đẹp và dùng thích đến đâu" },
    { loai: "R", chu: "Mình có tự làm hoặc lắp được không" },
  ] },
  { chu: "Gặp việc khó chưa biết làm, em thường làm gì?", luaChon: [
    { loai: "I", chu: "Tìm hiểu tới cùng đến khi hiểu rõ" },
    { loai: "E", chu: "Rủ mọi người cùng bàn rồi đứng ra quyết định" },
    { loai: "C", chu: "Chia thành các bước, lập kế hoạch rồi làm đúng kế hoạch" },
    { loai: "S", chu: "Hỏi người giỏi hơn và cùng giúp nhau làm" },
  ] },
  { chu: "Mười năm nữa, em muốn người ta nhớ đến em vì điều gì?", luaChon: [
    { loai: "I", chu: "Tìm ra được điều mới hoặc giải được bài toán khó" },
    { loai: "A", chu: "Tạo ra sản phẩm hoặc tác phẩm đẹp, độc đáo" },
    { loai: "S", chu: "Đã giúp nhiều người trở nên tốt hơn" },
    { loai: "E", chu: "Xây được doanh nghiệp hoặc dẫn dắt được một tập thể" },
  ] },
  { chu: "Môn hoặc hoạt động nào em ngồi hàng giờ không chán?", luaChon: [
    { loai: "R", chu: "Công nghệ, thực hành, thể thao vận động" },
    { loai: "A", chu: "Văn, Mỹ thuật, Âm nhạc" },
    { loai: "C", chu: "Tính toán, bảng biểu, tin học văn phòng, sổ sách" },
    { loai: "S", chu: "Giảng lại bài cho bạn, hoạt động đoàn đội" },
  ] },
  { chu: "Kỳ nghỉ hè lý tưởng của em là gì?", luaChon: [
    { loai: "R", chu: "Đi phượt, cắm trại hoặc làm một việc tay chân từ đầu tới cuối" },
    { loai: "E", chu: "Tổ chức một sự kiện hoặc bán hàng kiếm tiền" },
    { loai: "S", chu: "Chiến dịch tình nguyện hoặc dạy kèm" },
    { loai: "I", chu: "Học một khóa mới hoặc làm dự án nghiên cứu, lập trình" },
  ] },
];

/** Điều em coi trọng ở công việc tương lai (chọn tối đa 2). Mỗi mục nghiêng về một vài nhóm ngành, có nói rõ lý do ở kết quả. */
export interface GiaTri { id: string; chu: string; nhom: string[] }
export const CAC_GIA_TRI: GiaTri[] = [
  { id: "thuNhap", chu: "Thu nhập cao, tăng nhanh theo năng lực", nhom: ["CNTT", "Tài chính", "Y Dược", "Kinh tế"] },
  { id: "onDinh", chu: "Ổn định, ít biến động, làm lâu dài", nhom: ["Sư phạm", "Điều dưỡng", "Y Dược", "Luật", "Xã hội"] },
  { id: "sangTao", chu: "Được sáng tạo, làm điều mới", nhom: ["Thiết kế", "Marketing", "CNTT", "Kiến trúc", "Báo chí"] },
  { id: "giupNguoi", chu: "Giúp ích trực tiếp cho người khác", nhom: ["Y Dược", "Điều dưỡng", "Sư phạm", "Xã hội"] },
  { id: "tuChu", chu: "Tự chủ, có thể tự kinh doanh hoặc làm tự do", nhom: ["Kinh tế", "Marketing", "Thiết kế", "CNTT", "Du lịch"] },
  { id: "diChuyen", chu: "Được đi nhiều, tiếp xúc nhiều nơi, nhiều nền văn hóa", nhom: ["Du lịch", "Ngôn ngữ", "Logistics", "Báo chí"] },
];
export const TOI_DA_GIA_TRI = 2;

/** Mỗi nhóm Holland gợi ý các nhóm ngành trong dữ liệu; nhóm đứng đầu danh sách phù hợp nhất. */
export const NHOM_NGANH_THEO_LOAI: Record<LoaiSoThich, string[]> = {
  R: ["Kỹ thuật", "Xây dựng", "Nông Lâm", "Logistics", "Thể thao"],
  I: ["CNTT", "Khoa học tự nhiên", "Y Dược", "Kỹ thuật", "Nông Lâm"],
  A: ["Thiết kế", "Kiến trúc", "Báo chí", "Ngôn ngữ", "Marketing"],
  S: ["Sư phạm", "Điều dưỡng", "Y Dược", "Xã hội", "Du lịch"],
  E: ["Kinh tế", "Marketing", "Luật", "Du lịch", "Logistics"],
  C: ["Tài chính", "Kinh tế", "Logistics", "CNTT", "Luật"],
};

/** Số lần mỗi nhóm xuất hiện trong bộ câu hỏi: để so công bằng khi các nhóm không xuất hiện đều nhau. */
export const SO_LAN_XUAT_HIEN: Record<LoaiSoThich, number> = (() => {
  const r: Record<LoaiSoThich, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  for (const c of CAC_CAU_HOI) for (const l of c.luaChon) r[l.loai]++;
  return r;
})();

/** Tỷ lệ chọn của một nhóm: số lần được chọn chia số lần được đưa ra (0 đến 1). */
export const tyLe = (kq: Pick<KetQuaSoThich, "diem">, l: LoaiSoThich): number => kq.diem[l] / SO_LAN_XUAT_HIEN[l];

/**
 * Tính kết quả từ các lựa chọn: `traLoi[i]` là vị trí (0 đến 3) em chọn ở câu i. Thiếu câu hoặc vị trí sai thì trả null để không kết luận bừa.
 * `giaTri`: các id điều em coi trọng (tối đa 2, id lạ bị bỏ).
 */
export function tinhKetQua(traLoi: number[], giaTri: string[] = [], luc = new Date()): KetQuaSoThich | null {
  if (traLoi.length !== CAC_CAU_HOI.length) return null;
  const diem: Record<LoaiSoThich, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  for (let i = 0; i < CAC_CAU_HOI.length; i++) {
    const vt = traLoi[i];
    if (!Number.isInteger(vt) || vt < 0 || vt >= CAC_CAU_HOI[i].luaChon.length) return null;
    diem[CAC_CAU_HOI[i].luaChon[vt].loai]++;
  }
  // Xếp theo tỷ lệ chọn; bằng nhau thì giữ thứ tự RIASEC để kết quả ổn định giữa các lần chạy.
  const top = [...CAC_LOAI].sort((a, b) => tyLe({ diem }, b) - tyLe({ diem }, a) || CAC_LOAI.indexOf(a) - CAC_LOAI.indexOf(b)).slice(0, 3);
  const gt = [...new Set(giaTri.filter((g) => CAC_GIA_TRI.some((x) => x.id === g)))].slice(0, TOI_DA_GIA_TRI);
  return { diem, top, luc: luc.toISOString(), ...(gt.length ? { giaTri: gt } : {}) };
}

/** Khi em chọn khá đều mọi nhóm (không nhóm nào được chọn từ 4 lần trở lên), kết quả không phân biệt được: nói thật thay vì cố chọn. */
export const khongRoNet = (kq: KetQuaSoThich): boolean => Math.max(...CAC_LOAI.map((l) => kq.diem[l])) <= 3;

export interface NhomNganhGoiY { nhom: string; diem: number; /** Nhóm Holland đóng góp nhiều nhất, và điều em coi trọng khớp với nhóm ngành này. */ vi: { loai: LoaiSoThich[]; giaTri: string[] } }

/**
 * Xếp nhóm ngành: nhóm Holland em chọn càng nhiều, ngành đứng đầu danh sách của nhóm đó càng được cộng nhiều;
 * điều em coi trọng cộng thêm một phần nhỏ cho các nhóm ngành khớp (thường chỉ làm đổi thứ tự giữa các nhóm gần nhau).
 */
export function nhomNganhGoiY(kq: KetQuaSoThich, soLuong = 5): NhomNganhGoiY[] {
  const cong = new Map<string, { diem: number; tu: Map<LoaiSoThich, number>; gt: string[] }>();
  const lay = (nhom: string) => cong.get(nhom) ?? cong.set(nhom, { diem: 0, tu: new Map(), gt: [] }).get(nhom)!;
  for (const l of CAC_LOAI) {
    NHOM_NGANH_THEO_LOAI[l].forEach((nhom, i) => {
      const d = tyLe(kq, l) * (i === 0 ? 1 : 0.6);
      const o = lay(nhom);
      o.diem += d;
      o.tu.set(l, (o.tu.get(l) ?? 0) + d);
    });
  }
  for (const id of kq.giaTri ?? []) {
    const g = CAC_GIA_TRI.find((x) => x.id === id);
    if (!g) continue;
    for (const nhom of g.nhom) { const o = lay(nhom); o.diem += 0.25; o.gt.push(id); }
  }
  return [...cong.entries()].map(([nhom, o]) => ({
    nhom, diem: Math.round(o.diem * 100) / 100,
    vi: { loai: [...o.tu.entries()].sort((a, b) => b[1] - a[1]).filter(([l]) => kq.top.includes(l)).slice(0, 2).map(([l]) => l), giaTri: o.gt },
  })).sort((a, b) => b.diem - a.diem || a.nhom.localeCompare(b.nhom, "vi")).slice(0, soLuong);
}

/** Dòng mô tả ngắn, ví dụ "Sáng tạo, Tìm tòi và Giúp đỡ". */
export function moTaTop(kq: KetQuaSoThich): string {
  const ten = kq.top.map((l) => THONG_TIN_LOAI[l].ten);
  return ten.length <= 1 ? ten.join("") : `${ten.slice(0, -1).join(", ")} và ${ten[ten.length - 1]}`;
}

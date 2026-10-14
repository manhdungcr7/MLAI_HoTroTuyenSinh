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
  { chu: "Cuối tuần được rảnh cả ngày, bạn dễ say mê việc nào nhất?", luaChon: [
    { loai: "R", chu: "Tháo lắp thiết bị, sửa chữa đồ đạc, làm mô hình hoặc vận động thể thao" },
    { loai: "I", chu: "Tìm hiểu công nghệ mới, tập lập trình hoặc giải các câu đố tư duy hóc búa" },
    { loai: "A", chu: "Sáng tạo nội dung, vẽ tranh, chụp ảnh, dựng video hoặc sáng tác nhạc/viết lách" },
    { loai: "S", chu: "Tụ tập bạn bè, giúp đỡ người thân hoặc tham gia hoạt động thiện nguyện" },
  ] },
  { chu: "Khi làm dự án nhóm ở lớp, bạn thường chủ động nhận vai trò nào?", luaChon: [
    { loai: "E", chu: "Điều phối phân chia công việc, thuyết phục cả nhóm và làm diễn giả thuyết trình" },
    { loai: "C", chu: "Lập tiến độ chi tiết, ghi chép biên bản và rà soát từng đầu việc cho chuẩn xác" },
    { loai: "I", chu: "Thu thập tài liệu, phân tích số liệu và đề xuất cách làm hiệu quả nhất" },
    { loai: "A", chu: "Khởi xướng ý tưởng độc đáo, thiết kế slide và hình ảnh cuốn hút" },
  ] },
  { chu: "Điều nào khiến bạn cảm thấy thỏa mãn và hứng khởi nhất sau một ngày?", luaChon: [
    { loai: "R", chu: "Tự tay hoàn thiện một sản phẩm cơ học/vật lý nhìn thấy và dùng được" },
    { loai: "S", chu: "Biết rằng mình đã giúp bạn bè hay người xung quanh giải quyết được khó khăn" },
    { loai: "E", chu: "Thuyết phục được người khác đồng thuận với ý tưởng và định hướng của mình" },
    { loai: "C", chu: "Mọi kế hoạch diễn ra ngăn nắp, đúng hạn và không có bất kỳ sai sót nào" },
  ] },
  { chu: "Nếu được tự do chọn một câu lạc bộ ở trường, bạn sẽ chọn CLB nào?", luaChon: [
    { loai: "R", chu: "CLB Robot, STEM, cơ điện tử, chế tạo mô hình" },
    { loai: "I", chu: "CLB Tin học, Toán học ứng dụng hoặc Nghiên cứu khoa học" },
    { loai: "A", chu: "CLB Truyền thông, Nhiếp ảnh, Thiết kế đồ họa, Âm nhạc" },
    { loai: "E", chu: "CLB Tranh biện, Khởi nghiệp kinh doanh hoặc Tổ chức sự kiện" },
  ] },
  { chu: "Khi bạn thân gặp chuyện buồn hoặc bế tắc, bạn sẽ làm gì đầu tiên?", luaChon: [
    { loai: "S", chu: "Ngồi lại lắng nghe tâm sự và ở bên cạnh động viên tinh thần bạn" },
    { loai: "I", chu: "Cùng bạn mổ xẻ nguyên nhân gốc rễ và tìm phương án giải quyết bài bản" },
    { loai: "E", chu: "Rủ bạn đi đổi gió và chủ động đứng ra giúp bạn giải quyết vướng mắc" },
    { loai: "C", chu: "Giúp bạn lên danh sách các bước việc cần làm cụ thể để tháo gỡ từng bước" },
  ] },
  { chu: "Dạng bài tập hoặc thử thách nào khiến bạn tập trung cao độ nhất?", luaChon: [
    { loai: "I", chu: "Bài toán tư duy logic, bài thực nghiệm khoa học hóc búa cần đào sâu" },
    { loai: "A", chu: "Bài tập đề mở, thỏa sức thể hiện góc nhìn cá nhân và sự sáng tạo" },
    { loai: "C", chu: "Dạng bài có cấu trúc rõ ràng, đòi hỏi tính toán tỉ mỉ và độ chuẩn xác cao" },
    { loai: "R", chu: "Bài thực hành phòng lab, chế tạo sản phẩm hoặc ứng dụng thực tế" },
  ] },
  { chu: "Bạn thấy mình hứng thú với môi trường làm việc nào nhất?", luaChon: [
    { loai: "R", chu: "Xưởng công nghệ, phòng thí nghiệm vật lý, công trường ngoài trời năng động" },
    { loai: "S", chu: "Trường học, bệnh viện, trung tâm tư vấn tương tác trực tiếp với con người" },
    { loai: "E", chu: "Văn phòng tập đoàn, môi trường kinh doanh linh hoạt, đàm phán hợp đồng" },
    { loai: "C", chu: "Không gian làm việc yên tĩnh, quy củ, quản lý dữ liệu và hệ thống chuẩn mực" },
  ] },
  { chu: "Khi nghe tin về một sản phẩm mới ra mắt, bạn tò mò nhất điều gì?", luaChon: [
    { loai: "I", chu: "Nguyên lý vận hành và công nghệ đột phá ẩn bên trong" },
    { loai: "E", chu: "Chiến lược kinh doanh, giá trị thị trường và cách tiếp cận người dùng" },
    { loai: "A", chu: "Trải nghiệm người dùng, phong cách thiết kế và độ tinh tế thẩm mỹ" },
    { loai: "R", chu: "Chất liệu chế tạo phần cứng và khả năng tự lắp ráp, nâng cấp" },
  ] },
  { chu: "Gặp bài toán hoặc vấn đề khó chưa biết cách làm, bạn sẽ làm gì?", luaChon: [
    { loai: "I", chu: "Tự tìm tài liệu nghiên cứu sâu đến khi nắm chắc bản chất mới bắt đầu" },
    { loai: "E", chu: "Tập hợp các bạn, phân chia mục tiêu và chủ động ra quyết định thử nghiệm" },
    { loai: "C", chu: "Xây dựng bảng kế hoạch từng bước, đặt mốc thời gian rồi làm tuần tự" },
    { loai: "S", chu: "Trao đổi với thầy cô, bạn bè nhiều kinh nghiệm để cùng phối hợp làm" },
  ] },
  { chu: "Mười năm nữa nhìn lại, bạn muốn bản thân đã tạo dựng được điều gì?", luaChon: [
    { loai: "I", chu: "Đóng góp phát minh kỹ thuật mới hoặc giải quyết được một bài toán chuyên môn lớn" },
    { loai: "A", chu: "Tạo ra những sản phẩm sáng tạo, ấn phẩm hoặc tác phẩm có phong cách riêng" },
    { loai: "S", chu: "Đã giúp đỡ, đào tạo và truyền cảm hứng tích cực cho nhiều thế hệ học sinh/cộng đồng" },
    { loai: "E", chu: "Xây dựng doanh nghiệp thành công hoặc dẫn dắt một đội ngũ phát triển mạnh mẽ" },
  ] },
  { chu: "Hoạt động nào bạn có thể làm liên tục hàng giờ mà không thấy chán?", luaChon: [
    { loai: "R", chu: "Lắp ráp máy móc, chế tạo vật dụng hoặc rèn luyện thể thao" },
    { loai: "A", chu: "Viết lách, vẽ tranh, dựng clip, chụp ảnh hoặc tập chơi nhạc cụ" },
    { loai: "C", chu: "Tính toán bảng tính, quản lý ngân sách, sắp xếp dữ liệu khoa học" },
    { loai: "S", chu: "Kèm cặp hỗ trợ bạn học, lắng nghe chia sẻ hoặc sinh hoạt đội nhóm" },
  ] },
  { chu: "Kỳ nghỉ hè lý tưởng và đáng nhớ nhất đối với bạn sẽ là gì?", luaChon: [
    { loai: "R", chu: "Đi phượt dã ngoại trải nghiệm hoặc tự tay hoàn thiện một dự án kỹ thuật" },
    { loai: "E", chu: "Thử sức kinh doanh, tổ chức một hội chợ hoặc sự kiện gây quỹ cùng bạn bè" },
    { loai: "S", chu: "Tham gia chiến dịch tình nguyện Mùa hè xanh hoặc lớp học thiện nguyện" },
    { loai: "I", chu: "Tham gia trại hè nghiên cứu khoa học, lập trình dự án thực tế" },
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

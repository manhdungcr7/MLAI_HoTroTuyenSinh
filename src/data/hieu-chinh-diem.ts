// Ghi đè điểm chuẩn đã đối chiếu với PDF nguồn (src/data/hieu-chinh-diem.json). Hàm thuần, không đổi dữ liệu gốc.
// `diem: null` nghĩa là giá trị cũ đã chứng minh SAI nhưng chưa biết số đúng: gỡ năm đó khỏi dữ liệu.
export interface HieuChinhNam { diem: number | null; url: string; trang: number; lyDo: string }
export type HieuChinhTep = Record<string, Record<string, HieuChinhNam>>;

export function apDungHieuChinh<T extends { id: string; diem: Record<string, number>; dk?: number | null }>(dong: T, hieuChinh: HieuChinhTep): T {
  const hc = hieuChinh[dong.id];
  if (!hc) return dong;
  const diem = { ...dong.diem };
  let dk = dong.dk;
  const namMoiNhat = Object.keys(dong.diem).sort().pop(); // điểm dự kiến chỉ đi theo năm mới nhất (dk là bản sao điểm năm đó)
  const dkGoc = dong.dk;
  for (const [nam, h] of Object.entries(hc)) {
    if (!(nam in diem)) continue; // năm không có trong dữ liệu thì bỏ qua
    if (nam === namMoiNhat && dkGoc !== undefined && dkGoc !== null && dkGoc === dong.diem[nam]) dk = h.diem; // điểm dự kiến sao chép từ năm này thì đi theo
    if (h.diem === null) delete diem[nam];
    else diem[nam] = h.diem;
  }
  return dk === dong.dk ? { ...dong, diem } : { ...dong, diem, dk };
}

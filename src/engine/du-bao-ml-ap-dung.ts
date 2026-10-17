// Áp khoảng dự báo của mô hình học máy lên trạng thái dữ liệu của một chương trình.
// Chỉ thay khoảng khi quy tắc sẵn có đã cho phép dự báo (có điểm chuẩn hợp lệ, không quá cũ), khi tệp dự báo đã nạp, và khi mô hình
// dự báo cùng năm đích và cùng năm điểm cơ sở với trạng thái hiện tại. Các trường hợp khác giữ nguyên cách thống kê cũ.
import { duBaoMLCua, metaDuBaoML } from "@/data/du-bao-ml";
import type { TrangThaiDuLieu } from "./trang-thai-du-lieu";

export function apDungDuBaoML(tt: TrangThaiDuLieu, id: string): TrangThaiDuLieu {
  const d = tt.duBao, ml = duBaoMLCua(id), meta = metaDuBaoML();
  if (!d || !ml || !meta || meta.namDuBao !== d.namDuBao || ml.namCoSo !== d.namCuoi) return tt;
  return { ...tt, duBao: { ...d, moHinh: "hoc-may", kyVong: ml.giua, thap: ml.thap, cao: ml.cao } };
}

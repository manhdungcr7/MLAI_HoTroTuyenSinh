// Logic thuần (không React) cho câu kết luận dự báo. Chỉ mô tả vị trí điểm so với khoảng dự báo, không nói xác suất.
import { viTriSoVoiDuBao, type DuBaoDiemChuan, type ViTriSoVoiDuBao } from "@/engine/du-bao-diem-chuan";
import { dinhDangDiem } from "@/engine/dinh-dang";
import { CAU_LUU_Y_DU_BAO, NHAN_KET_LUAN } from "@/noi-dung/du-bao";

export interface KetLuanDuBao { viTri: ViTriSoVoiDuBao; nhan: string; cau: string; chenh: number }

const lam2 = (n: number) => Math.round(n * 100) / 100;

export function ketLuanDuBao(diem: number, d: DuBaoDiemChuan, laDiemXemThu = false): KetLuanDuBao {
  const viTri = viTriSoVoiDuBao(diem, d);
  const chenh = lam2(diem - d.kyVong);
  const chu = laDiemXemThu ? "Với điểm này" : "Điểm của bạn";
  const dau = chenh === 0
    ? `${chu} đang bằng mức dự báo trung tâm.`
    : `${chu} đang ${chenh > 0 ? "cao" : "thấp"} hơn mức dự báo trung tâm ${dinhDangDiem(Math.abs(chenh))} điểm.`;
  return { viTri, nhan: NHAN_KET_LUAN[viTri], cau: `${dau} ${CAU_LUU_Y_DU_BAO}`, chenh };
}

export const textDiem = (n: number) => `${dinhDangDiem(n)} điểm`;

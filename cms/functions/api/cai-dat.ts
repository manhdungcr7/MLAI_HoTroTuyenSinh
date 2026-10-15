// /api/cai-dat: Quản lý cấu hình vận hành và nội dung công khai của hệ thống (lưu trong D1 bảng `cai_dat_he_thong`).
// - GET /api/cai-dat: mọi tài khoản CMS đã đăng nhập (ctv, qtv, sa) đều được đọc cấu hình hiện tại.
// - PUT /api/cai-dat: CHỈ quản trị viên (qtv, sa) được cập nhật hoặc khôi phục mặc định (ctv bị chặn 403, chưa đăng nhập bị chặn 401).
// Mọi thay đổi đều kiểm tra đầu vào nghiêm ngặt, không bao giờ nhận hoặc trả về secret/API key thô, và ghi vết vào `nhat_ky`.
import { cauNhatKy } from "../_thu-vien/d1";
import { chuanHoaEmail, laEmail } from "../_thu-vien/xac-thuc";
import type { BoiCanh, KhoD1, TuyChon } from "../_thu-vien/kieu";
import { cam, docThan, json, sai } from "../_thu-vien/phan-hoi";
import { chay, khongHoTro, MOI_VAI } from "../_thu-vien/quyen";

export type MucDoThongBaoChung = "thongTin" | "canhBao" | "baoTri";

export interface ThongBaoChungHeThong {
  bat: boolean;
  noiDung: string;
  mucDo: MucDoThongBaoChung;
}

export interface LienHeHeThong {
  emailHoTro: string;
  dienThoai: string;
  donVi: string;
}

export interface CauHinhNghiepVuHeThong {
  namTuyenSinh: number;
  soNguyenVongToiDaGoiY: number;
  choPhepDangKySom: boolean;
  choPhepBaoSai: boolean;
}

export interface EmailGuiDiHeThong {
  tenHienThi: string;
  diaChiPhanHoi: string;
}

export interface CauHoiThuongGapMuc {
  cauHoi: string;
  traLoi: string;
}

export interface CaiDatHeThong {
  tenHeThong: string;
  thongBaoChung: ThongBaoChungHeThong;
  lienHe: LienHeHeThong;
  cauHinhNghiepVu: CauHinhNghiepVuHeThong;
  emailGuiDi: EmailGuiDiHeThong;
  cauHoiThuongGap: CauHoiThuongGapMuc[];
}

export interface PhanHoiCaiDatHeThong {
  caiDat: CaiDatHeThong;
  capNhatBoi: string | null;
  capNhatLuc: string | null;
}

export const KHOA_CAI_DAT_CHINH = "he_thong_chinh";
const CAC_MUC_DO: readonly MucDoThongBaoChung[] = ["thongTin", "canhBao", "baoTri"];
const TU_KHOA_BI_MAT = ["secret", "api_key", "apikey", "token", "password", "mat_khau", "private_key", "resend_api_key"];

export const CAI_DAT_MAC_DINH: CaiDatHeThong = {
  tenHeThong: "Nguyện Vọng AI",
  thongBaoChung: {
    bat: false,
    noiDung: "",
    mucDo: "thongTin",
  },
  lienHe: {
    emailHoTro: "hotro@nguyenvong.ai",
    dienThoai: "0901234567",
    donVi: "Nhóm phát triển Nguyện Vọng AI",
  },
  cauHinhNghiepVu: {
    namTuyenSinh: 2026,
    soNguyenVongToiDaGoiY: 8,
    choPhepDangKySom: true,
    choPhepBaoSai: true,
  },
  emailGuiDi: {
    tenHienThi: "Nguyện Vọng AI",
    diaChiPhanHoi: "hotro@nguyenvong.ai",
  },
  cauHoiThuongGap: [
    {
      cauHoi: "Điểm phù hợp trên Nguyện Vọng AI có phải là xác suất đậu không?",
      traLoi: "Không. Điểm phù hợp (thang 100) chỉ phản ánh mức độ khớp giữa hồ sơ của em và chương trình đào tạo, không phải xác suất trúng tuyển.",
    },
    {
      cauHoi: "Số liệu học phí và điểm chuẩn lấy từ đâu?",
      traLoi: "Số liệu được đối chiếu từ đề án tuyển sinh chính thức của từng trường đại học và có gắn nhãn trạng thái kiểm chứng rõ ràng.",
    },
  ],
};

export function banSaoCaiDatMacDinh(): CaiDatHeThong {
  return JSON.parse(JSON.stringify(CAI_DAT_MAC_DINH)) as CaiDatHeThong;
}

/** Khởi tạo bảng `cai_dat_he_thong` an toàn trên D1. */
export async function damBaoBangCaiDat(d1: KhoD1): Promise<void> {
  await d1
    .prepare(
      `CREATE TABLE IF NOT EXISTS cai_dat_he_thong (
        khoa TEXT PRIMARY KEY,
        gia_tri_json TEXT NOT NULL,
        cap_nhat_boi TEXT,
        cap_nhat_luc TEXT NOT NULL
      )`
    )
    .run();
}

const sachChuoi = (v: unknown, toiDa: number): string =>
  typeof v === "string"
    ? v
        .replace(/<[^>]*>/g, " ")
        .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, toiDa)
    : "";

const laDoiTuong = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

function kiemKhongChuaBiMat(goc: Record<string, unknown>): void {
  const duyet = (obj: Record<string, unknown>, duong: string) => {
    for (const [k, v] of Object.entries(obj)) {
      const khoaThuong = k.toLowerCase();
      if (TU_KHOA_BI_MAT.some((bm) => khoaThuong.includes(bm))) {
        throw sai(`Không được gửi khóa bí mật hoặc thông tin nhạy cảm (${duong ? `${duong}.${k}` : k}) vào cài đặt hệ thống`, k);
      }
      if (laDoiTuong(v)) duyet(v, duong ? `${duong}.${k}` : k);
    }
  };
  duyet(goc, "");
}

/** Kiểm tra và làm sạch toàn bộ dữ liệu cài đặt gửi lên. */
export function kiemTraCaiDatHeThong(than: Record<string, unknown>): CaiDatHeThong {
  kiemKhongChuaBiMat(than);

  // 1. tenHeThong
  if (typeof than.tenHeThong !== "string") {
    throw sai("Tên hệ thống phải là chuỗi ký tự", "tenHeThong");
  }
  const tenHeThong = sachChuoi(than.tenHeThong, 80);
  if (tenHeThong.length < 2) {
    throw sai("Tên hệ thống cần từ 2 đến 80 ký tự", "tenHeThong");
  }

  // 2. thongBaoChung
  if (!laDoiTuong(than.thongBaoChung)) {
    throw sai("Thiếu hoặc sai định dạng thông báo chung", "thongBaoChung");
  }
  const tb = than.thongBaoChung;
  if (typeof tb.bat !== "boolean") {
    throw sai("Trạng thái bật/tắt thông báo chung phải là kiểu đúng/sai (boolean)", "thongBaoChung.bat");
  }
  if (typeof tb.noiDung !== "string") {
    throw sai("Nội dung thông báo chung phải là chuỗi ký tự", "thongBaoChung.noiDung");
  }
  if (tb.noiDung.trim().length > 500) {
    throw sai("Nội dung thông báo chung không được vượt quá 500 ký tự", "thongBaoChung.noiDung");
  }
  const noiDungThongBao = sachChuoi(tb.noiDung, 500);
  if (tb.bat && noiDungThongBao.length === 0) {
    throw sai("Khi bật thông báo chung, nội dung không được để trống", "thongBaoChung.noiDung");
  }
  if (typeof tb.mucDo !== "string" || !(CAC_MUC_DO as readonly string[]).includes(tb.mucDo)) {
    throw sai("Mức độ thông báo phải là thongTin, canhBao hoặc baoTri", "thongBaoChung.mucDo");
  }

  // 3. lienHe
  if (!laDoiTuong(than.lienHe)) {
    throw sai("Thiếu hoặc sai định dạng thông tin liên hệ", "lienHe");
  }
  const lh = than.lienHe;
  const emailHoTro = chuanHoaEmail(typeof lh.emailHoTro === "string" ? lh.emailHoTro : "");
  if (!laEmail(emailHoTro) || emailHoTro.length > 120) {
    throw sai("Email hỗ trợ không hợp lệ", "lienHe.emailHoTro");
  }
  const dienThoai = sachChuoi(lh.dienThoai, 30);
  if (dienThoai.length < 6 || !/^[0-9+\s().-]+$/.test(dienThoai)) {
    throw sai("Số điện thoại liên hệ không hợp lệ (6–30 ký tự số)", "lienHe.dienThoai");
  }
  const donVi = sachChuoi(lh.donVi, 120);
  if (donVi.length < 2) {
    throw sai("Tên đơn vị vận hành cần từ 2 đến 120 ký tự", "lienHe.donVi");
  }

  // 4. cauHinhNghiepVu
  if (!laDoiTuong(than.cauHinhNghiepVu)) {
    throw sai("Thiếu hoặc sai định dạng cấu hình nghiệp vụ", "cauHinhNghiepVu");
  }
  const nv = than.cauHinhNghiepVu;
  const namTuyenSinh = Number(nv.namTuyenSinh);
  if (!Number.isInteger(namTuyenSinh) || namTuyenSinh < 2024 || namTuyenSinh > 2035) {
    throw sai("Năm tuyển sinh phải là số nguyên từ 2024 đến 2035", "cauHinhNghiepVu.namTuyenSinh");
  }
  const soNguyenVongToiDaGoiY = Number(nv.soNguyenVongToiDaGoiY);
  if (!Number.isInteger(soNguyenVongToiDaGoiY) || soNguyenVongToiDaGoiY < 1 || soNguyenVongToiDaGoiY > 20) {
    throw sai("Số nguyện vọng gợi ý tối đa phải là số nguyên từ 1 đến 20", "cauHinhNghiepVu.soNguyenVongToiDaGoiY");
  }
  if (typeof nv.choPhepDangKySom !== "boolean") {
    throw sai("Cấu hình cho phép đăng ký sớm phải là boolean", "cauHinhNghiepVu.choPhepDangKySom");
  }
  if (typeof nv.choPhepBaoSai !== "boolean") {
    throw sai("Cấu hình cho phép báo sai số liệu phải là boolean", "cauHinhNghiepVu.choPhepBaoSai");
  }

  // 5. emailGuiDi
  if (!laDoiTuong(than.emailGuiDi)) {
    throw sai("Thiếu hoặc sai định dạng cấu hình email gửi đi", "emailGuiDi");
  }
  const eg = than.emailGuiDi;
  const tenHienThi = sachChuoi(eg.tenHienThi, 80);
  if (tenHienThi.length < 2) {
    throw sai("Tên hiển thị email gửi đi cần từ 2 đến 80 ký tự", "emailGuiDi.tenHienThi");
  }
  const diaChiPhanHoi = chuanHoaEmail(typeof eg.diaChiPhanHoi === "string" ? eg.diaChiPhanHoi : "");
  if (!laEmail(diaChiPhanHoi) || diaChiPhanHoi.length > 120) {
    throw sai("Địa chỉ email phản hồi không hợp lệ", "emailGuiDi.diaChiPhanHoi");
  }

  // 6. cauHoiThuongGap
  if (!Array.isArray(than.cauHoiThuongGap)) {
    throw sai("Danh sách câu hỏi thường gặp phải là một mảng", "cauHoiThuongGap");
  }
  if (than.cauHoiThuongGap.length > 30) {
    throw sai("Tối đa 30 câu hỏi thường gặp", "cauHoiThuongGap");
  }
  const cauHoiThuongGap: CauHoiThuongGapMuc[] = than.cauHoiThuongGap.map((muc, idx) => {
    if (!laDoiTuong(muc)) {
      throw sai(`Câu hỏi thường gặp thứ ${idx + 1} không đúng định dạng`, `cauHoiThuongGap.${idx}`);
    }
    if (typeof muc.cauHoi !== "string" || typeof muc.traLoi !== "string") {
      throw sai(`Câu hỏi và câu trả lời thứ ${idx + 1} phải là chuỗi ký tự`, `cauHoiThuongGap.${idx}`);
    }
    if (muc.cauHoi.trim().length > 250) {
      throw sai(`Câu hỏi thứ ${idx + 1} vượt quá 250 ký tự`, `cauHoiThuongGap.${idx}.cauHoi`);
    }
    if (muc.traLoi.trim().length > 1200) {
      throw sai(`Câu trả lời thứ ${idx + 1} vượt quá 1200 ký tự`, `cauHoiThuongGap.${idx}.traLoi`);
    }
    const cauHoi = sachChuoi(muc.cauHoi, 250);
    const traLoi = sachChuoi(muc.traLoi, 1200);
    if (cauHoi.length < 5) {
      throw sai(`Câu hỏi thứ ${idx + 1} cần ít nhất 5 ký tự`, `cauHoiThuongGap.${idx}.cauHoi`);
    }
    if (traLoi.length < 5) {
      throw sai(`Câu trả lời thứ ${idx + 1} cần ít nhất 5 ký tự`, `cauHoiThuongGap.${idx}.traLoi`);
    }
    return { cauHoi, traLoi };
  });

  return {
    tenHeThong,
    thongBaoChung: {
      bat: tb.bat,
      noiDung: noiDungThongBao,
      mucDo: tb.mucDo as MucDoThongBaoChung,
    },
    lienHe: {
      emailHoTro,
      dienThoai,
      donVi,
    },
    cauHinhNghiepVu: {
      namTuyenSinh,
      soNguyenVongToiDaGoiY,
      choPhepDangKySom: nv.choPhepDangKySom,
      choPhepBaoSai: nv.choPhepBaoSai,
    },
    emailGuiDi: {
      tenHienThi,
      diaChiPhanHoi,
    },
    cauHoiThuongGap,
  };
}

/** Đọc cấu hình từ D1, nếu chưa có hoặc JSON lỗi thì trả về bản mặc định an toàn. */
export async function docCaiDatTuD1(d1: KhoD1): Promise<PhanHoiCaiDatHeThong> {
  await damBaoBangCaiDat(d1);
  const dong = await d1
    .prepare("SELECT gia_tri_json, cap_nhat_boi, cap_nhat_luc FROM cai_dat_he_thong WHERE khoa = ? LIMIT 1")
    .bind(KHOA_CAI_DAT_CHINH)
    .first<{ gia_tri_json: string; cap_nhat_boi: string | null; cap_nhat_luc: string }>();

  if (!dong?.gia_tri_json) {
    return { caiDat: banSaoCaiDatMacDinh(), capNhatBoi: null, capNhatLuc: null };
  }
  try {
    const parsed = JSON.parse(dong.gia_tri_json) as Record<string, unknown>;
    const caiDat = kiemTraCaiDatHeThong(parsed);
    return { caiDat, capNhatBoi: dong.cap_nhat_boi ?? null, capNhatLuc: dong.cap_nhat_luc ?? null };
  } catch {
    return { caiDat: banSaoCaiDatMacDinh(), capNhatBoi: dong.cap_nhat_boi ?? null, capNhatLuc: dong.cap_nhat_luc ?? null };
  }
}

export const xuLy = (ctx: BoiCanh, o: TuyChon = {}) =>
  chay(ctx, o, MOI_VAI, async (c) => {
    const m = c.request.method;

    if (m === "GET") {
      const hienTai = await docCaiDatTuD1(c.d1);
      return json(hienTai);
    }

    if (m === "PUT") {
      if (!c.laQuanTri) {
        throw cam("Chỉ quản trị viên (qtv, sa) mới được phép thay đổi cài đặt hệ thống");
      }

      const b = await docThan(c.request);
      const hienTai = await docCaiDatTuD1(c.d1);

      const laKhoiPhucMacDinh = b.khoiPhucMacDinh === true;
      const caiDatMoi: CaiDatHeThong = laKhoiPhucMacDinh
        ? banSaoCaiDatMacDinh()
        : kiemTraCaiDatHeThong(laDoiTuong(b.caiDat) ? b.caiDat : b);

      const chuoiMoi = JSON.stringify(caiDatMoi);
      const doiTuongNhatKy = JSON.stringify({
        khoa: KHOA_CAI_DAT_CHINH,
        khoiPhucMacDinh: laKhoiPhucMacDinh,
        truoc: hienTai.caiDat,
        sau: caiDatMoi,
      });

      await c.d1.batch([
        c.d1
          .prepare(
            `INSERT INTO cai_dat_he_thong (khoa, gia_tri_json, cap_nhat_boi, cap_nhat_luc)
             VALUES (?, ?, ?, ?)
             ON CONFLICT(khoa) DO UPDATE SET
               gia_tri_json = excluded.gia_tri_json,
               cap_nhat_boi = excluded.cap_nhat_boi,
               cap_nhat_luc = excluded.cap_nhat_luc`
          )
          .bind(KHOA_CAI_DAT_CHINH, chuoiMoi, c.email, c.luc),
        cauNhatKy(c.d1, c.email, "CAP_NHAT_CAI_DAT_HE_THONG", doiTuongNhatKy, c.luc),
      ]);

      return json({
        caiDat: caiDatMoi,
        capNhatBoi: c.email,
        capNhatLuc: c.luc,
      });
    }

    throw khongHoTro();
  });

export const onRequest = (ctx: BoiCanh) => xuLy(ctx);

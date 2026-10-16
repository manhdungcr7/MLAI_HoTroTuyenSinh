// /api/khoa-ket-noi: khóa kết nối cá nhân của người đang đăng nhập (dùng cho MCP đóng góp dữ liệu, xem /api/mcp-dong-gop).
//   GET                 -> danh sách khóa của chính mình (không bao giờ trả lại khóa gốc)
//   POST { soNgay? }    -> tạo khóa mới (mặc định 90 ngày, tối đa 3 khóa còn hiệu lực). Khóa gốc "nvk_..." CHỈ có trong phản hồi này.
//   DELETE ?id=         -> thu hồi khóa của chính mình, có hiệu lực ngay
// Mọi lần tạo và thu hồi ghi nhật ký kiểm toán (chỉ ghi tiền tố khóa, không ghi khóa đầy đủ).
import { cauKiemToan } from "../_thu-vien/ban-ghi-d1";
import { khongNoiDung, json, sai, docThan, LoiHttp } from "../_thu-vien/phan-hoi";
import { chay, khongHoTro, MOI_VAI } from "../_thu-vien/quyen";
import type { BoiCanh, TuyChon } from "../_thu-vien/kieu";
import { dsKhoaCuaToi, SO_KHOA_TOI_DA, SO_NGAY_MAC_DINH, SO_NGAY_TOI_DA, taoKhoa, thuHoiKhoa } from "../_thu-vien/khoa-ket-noi";

export const xuLy = (ctx: BoiCanh, o: TuyChon = {}) =>
  chay(ctx, o, MOI_VAI, async (c) => {
    const m = c.request.method;

    if (m === "GET") {
      const ds = await dsKhoaCuaToi(c.d1, c.email, c.luc);
      return json({ khoa: ds, soKhoaConHieuLuc: ds.filter((k) => k.conHieuLuc).length, toiDaKhoa: SO_KHOA_TOI_DA, macDinhNgay: SO_NGAY_MAC_DINH });
    }

    if (m === "POST") {
      const b = await docThan(c.request).catch(() => ({} as Record<string, unknown>));
      let soNgay = SO_NGAY_MAC_DINH;
      if (b.soNgay !== undefined && b.soNgay !== null) {
        if (typeof b.soNgay !== "number" || !Number.isInteger(b.soNgay) || b.soNgay < 1 || b.soNgay > SO_NGAY_TOI_DA) throw sai(`soNgay phải là số nguyên từ 1 đến ${SO_NGAY_TOI_DA}`, "soNgay");
        soNgay = b.soNgay;
      }
      const kq = await taoKhoa(c.d1, c.email, soNgay, c.luc, c.o.taoId);
      await cauKiemToan(c.d1, { email: c.email, hanhDong: "KHOA_TAO", entityType: "khoa_ket_noi", entityId: kq.tienTo, version: 0, ghiChu: `Tạo khóa kết nối, hết hạn ${kq.hetHan.slice(0, 10)}`, luc: c.luc }).run();
      // Khóa gốc chỉ có trong phản hồi này; trình duyệt không lưu lại.
      return json({ id: kq.id, tienTo: kq.tienTo, hetHan: kq.hetHan, khoa: kq.khoa, luuY: "Khóa chỉ hiện một lần. Hãy sao chép ngay, sau này không xem lại được." }, 201);
    }

    if (m === "DELETE") {
      const id = c.url.searchParams.get("id") ?? "";
      if (!id) throw sai("Thiếu id khóa", "id");
      const kq = await thuHoiKhoa(c.d1, c.email, id, c.luc);
      if (!kq.thuHoi) throw new LoiHttp(404, "khong-tim-thay", "Không có khóa này (hoặc đã thu hồi)");
      await cauKiemToan(c.d1, { email: c.email, hanhDong: "KHOA_THU_HOI", entityType: "khoa_ket_noi", entityId: kq.tienTo ?? id, version: 0, ghiChu: "Thu hồi khóa kết nối", luc: c.luc }).run();
      return khongNoiDung();
    }

    throw khongHoTro();
  });

export const onRequest = (ctx: BoiCanh) => xuLy(ctx);

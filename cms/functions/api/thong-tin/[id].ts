// GET /api/thong-tin/:id  và  PATCH /api/thong-tin/:id (khóa lạc quan bằng phienBan; duyệt/ẩn/khôi phục chỉ qtv).
import { LOAI_THONG_TIN, duocDatTrangThai, kiemTraThongTin, khopPhienBan, type TrangThaiBai } from "../../../../src/data/dong-gop-kiem-tra";
import { cauNhatKy, layThongTin, thongTinTuHang } from "../../_thu-vien/d1";
import { chay, khongHoTro, TAP_TRUONG } from "../../_thu-vien/quyen";
import { cam, docThan, json, khongTimThay, loiKiemTra, sai, LoiHttp } from "../../_thu-vien/phan-hoi";
import type { BoiCanh, TuyChon } from "../../_thu-vien/kieu";

const TRANG_THAI: readonly string[] = ["nhap", "cho", "duyet", "an"];
void LOAI_THONG_TIN;

export const xuLy = (ctx: BoiCanh, o: TuyChon = {}) =>
  chay(ctx, o, ["qtv", "ctv"], async (c) => {
    const id = typeof c.params.id === "string" ? c.params.id : "";
    if (!/^[A-Za-z0-9_-]{1,64}$/.test(id)) throw khongTimThay();
    const hang = await layThongTin(c.d1, id);
    if (!hang) throw khongTimThay("Không tìm thấy bản ghi");
    await c.yeuCauSuaTruong(hang.ma_truong);

    if (c.request.method === "GET") return json(thongTinTuHang(hang));
    if (c.request.method !== "PATCH") throw khongHoTro();

    const than = await docThan(c.request);
    if (typeof than.phienBan !== "number") throw sai("Thiếu phienBan của bản ghi đang sửa", "phienBan");
    if (!khopPhienBan(hang.phien_ban, than.phienBan)) {
      throw new LoiHttp(409, "lech-phien-ban", "Bản ghi vừa được người khác sửa. Hãy tải lại rồi sửa tiếp.");
    }
    if (c.vaiTro === "ctv") {
      if (hang.trang_thai === "an") throw cam("Chỉ quản trị viên được khôi phục bản ghi đã ẩn");
      if (hang.loai === "luu_y" && hang.trang_thai === "duyet") throw cam("Lưu ý đã duyệt chỉ quản trị viên được sửa");
    }
    const doiNoiDung = than.nam !== undefined || than.linkNguon !== undefined || than.duLieu !== undefined;
    let tt: TrangThaiBai = hang.trang_thai as TrangThaiBai;
    if (than.trangThai !== undefined) {
      if (typeof than.trangThai !== "string" || !TRANG_THAI.includes(than.trangThai)) throw sai("Trạng thái không hợp lệ", "trangThai");
      if (!duocDatTrangThai(c.vaiTro, than.trangThai as TrangThaiBai)) throw cam("Chỉ quản trị viên được duyệt, ẩn hoặc khôi phục bản ghi");
      tt = than.trangThai as TrangThaiBai;
    }
    if (c.vaiTro === "ctv" && hang.trang_thai === "duyet") {
      // Ctv không được gỡ bản đã duyệt; sửa nội dung thì quay về chờ duyệt.
      if (!doiNoiDung) throw cam("Bản ghi đã duyệt: chỉ quản trị viên đổi trạng thái");
      tt = "cho";
    }

    const kt = kiemTraThongTin(
      {
        id, maTruong: hang.ma_truong, loai: hang.loai, trangThai: tt, phienBan: hang.phien_ban + 1, luc: c.luc, nguoiDang: hang.tao_boi ?? undefined,
        nam: than.nam !== undefined ? than.nam : hang.nam ?? undefined,
        linkNguon: than.linkNguon !== undefined ? than.linkNguon : hang.link_nguon ?? undefined,
        duLieu: than.duLieu !== undefined ? than.duLieu : JSON.parse(hang.du_lieu),
      },
      { tapTruong: TAP_TRUONG, bayGio: c.bayGio },
    );
    if (!kt.ok) throw loiKiemTra(kt.loi);
    const b = kt.duLieu;
    const r = await c.d1
      .prepare("UPDATE thong_tin_truong SET nam = ?, link_nguon = ?, trang_thai = ?, phien_ban = phien_ban + 1, cap_nhat_luc = ?, du_lieu = ? WHERE id = ? AND phien_ban = ?")
      .bind(b.nam ?? null, b.linkNguon ?? null, b.trangThai, c.luc, JSON.stringify(b.duLieu), id, hang.phien_ban)
      .run();
    if ((r.meta?.changes ?? 0) !== 1) throw new LoiHttp(409, "lech-phien-ban", "Bản ghi vừa được người khác sửa. Hãy tải lại rồi sửa tiếp.");

    const doi = `thong_tin_truong:${id}`;
    if (tt !== hang.trang_thai) {
      const ten = tt === "duyet" ? "duyet" : tt === "an" ? "an" : hang.trang_thai === "an" ? "khoi-phuc" : "doi-trang-thai";
      await cauNhatKy(c.d1, c.email, `thong-tin.${ten}`, doi, c.luc).run();
    }
    if (doiNoiDung) await cauNhatKy(c.d1, c.email, "thong-tin.sua", doi, c.luc).run();
    const phatHanh = "khong-tu-dong";
    const moi = await layThongTin(c.d1, id);
    return json(thongTinTuHang(moi!), 200, { "x-phat-hanh": phatHanh });
  });

export const onRequest = (ctx: BoiCanh) => xuLy(ctx);

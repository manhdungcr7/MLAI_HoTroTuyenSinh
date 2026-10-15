// /api/hop-thu: hộp thư từ học sinh và cộng đồng gửi vào.
//   GET   ?loai=bao-sai|tinh-nguyen&trangThai=&trang=   qtv xem tất cả; ctv chỉ xem báo sai của trường được giao
//   PATCH { loai, id, trangThai }                       đổi trạng thái (qtv; ctv chỉ báo sai của trường được giao)
//   POST  { action: "CAP_QUYEN", id }                   (qtv) biến một đăng ký tình nguyện thành cộng tác viên: thêm vào quan_tri, giao đúng trường, đánh dấu đã cấp
// Báo sai không bao giờ tự sửa số liệu: người của trường kiểm tra nguồn rồi sửa qua quy trình duyệt bình thường.
import { laEmail, chuanHoaEmail } from "../_thu-vien/xac-thuc";
import { bamMatKhau, sinhMatKhauTam } from "../_thu-vien/mat-khau";
import { cauNhatKy } from "../_thu-vien/d1";
import type { BoiCanh, TuyChon } from "../_thu-vien/kieu";
import { LoiHttp, cam, docThan, docTrang, json, khongTimThay, locEnum, sai } from "../_thu-vien/phan-hoi";
import { TAP_TRUONG, chay, khongHoTro, MOI_VAI } from "../_thu-vien/quyen";

const TT_BAO_SAI = ["moi", "xong", "boQua"] as const;
const TT_TINH_NGUYEN = ["moi", "da_lien_he", "da_cap_quyen", "tu_choi"] as const;

interface HangBaoSai { id: string; ma_chuong_trinh: string; truong_du_lieu: string; noi_dung: string; link: string | null; trang_thai: string; tao_luc: string }
interface HangTinhNguyen { id: string; ho_ten: string; vai_tro: string; ma_truong: string; lien_he: string; ghi_chu: string | null; trang_thai: string; tao_luc: string }

/** Mã trường của một báo sai: phần trước dấu "-" đầu tiên của mã chương trình (bka-47a6194c -> BKA). */
export const maTruongCuaBaoSai = (maChuongTrinh: string) => maChuongTrinh.split("-")[0].toUpperCase();

export const xuLy = (ctx: BoiCanh, o: TuyChon = {}) =>
  chay(ctx, o, MOI_VAI, async (c) => {
    const m = c.request.method;
    const laQtv = c.laQuanTri;

    if (m === "GET") {
      const loai = c.url.searchParams.get("loai") ?? "bao-sai";
      if (loai === "truy-cap-som") {
        c.yeuCauQtv();
        const t = docTrang(c.url, 20);
        const [dem, ds] = await c.d1.batch([
          c.d1.prepare("SELECT COUNT(*) AS c FROM dang_ky_truy_cap_som"),
          c.d1.prepare("SELECT id, ho_ten, lop, nhu_cau, lien_he, tao_luc FROM dang_ky_truy_cap_som ORDER BY tao_luc DESC, id LIMIT ? OFFSET ?").bind(t.moi, t.offset),
        ]) as unknown as [{ results: { c: number }[] }, { results: { id: string; ho_ten: string; lop: string; nhu_cau: string; lien_he: string; tao_luc: string }[] }];
        return json({ tong: dem.results[0]?.c ?? 0, dangKySom: ds.results.map(r => ({ id: r.id, hoTen: r.ho_ten, lop: r.lop, nhuCau: r.nhu_cau, lienHe: r.lien_he, luc: r.tao_luc })) });
      }
      if (loai !== "bao-sai" && loai !== "tinh-nguyen") throw sai("loai phải là bao-sai hoặc tinh-nguyen", "loai");
      if (loai === "tinh-nguyen") c.yeuCauQtv("Chỉ quản trị viên xem được đăng ký tình nguyện");
      const t = docTrang(c.url, 20);
      const tt = locEnum(c.url.searchParams.get("trangThai"), loai === "bao-sai" ? TT_BAO_SAI : TT_TINH_NGUYEN, "trangThai");

      if (loai === "tinh-nguyen") {
        const loc = tt ? "WHERE trang_thai = ?" : "";
        const gt = tt ? [tt] : [];
        const [dem, ds] = (await c.d1.batch([
          c.d1.prepare(`SELECT COUNT(*) AS c FROM tinh_nguyen_dang_ky ${loc}`).bind(...gt),
          c.d1.prepare(`SELECT id, ho_ten, vai_tro, ma_truong, lien_he, ghi_chu, trang_thai, tao_luc FROM tinh_nguyen_dang_ky ${loc} ORDER BY tao_luc DESC LIMIT ? OFFSET ?`).bind(...gt, t.moi, t.offset),
        ])) as unknown as [{ results: { c: number }[] }, { results: HangTinhNguyen[] }];
        return json({ tong: dem.results[0]?.c ?? 0, dangKy: ds.results.map((r) => ({ id: r.id, hoTen: r.ho_ten, vaiTro: r.vai_tro, maTruong: r.ma_truong, lienHe: r.lien_he, ghiChu: r.ghi_chu ?? "", trangThai: r.trang_thai, luc: r.tao_luc })) });
      }

      // Báo sai: ctv chỉ thấy trường mình được giao.
      let mua = "";
      const gt: unknown[] = [];
      const dieuKien: string[] = [];
      if (tt) { dieuKien.push("trang_thai = ?"); gt.push(tt); }
      if (!laQtv) {
        const duoc = (await c.d1.prepare("SELECT ma_truong FROM phan_cong WHERE email = ? LIMIT 200").bind(c.email).all<{ ma_truong: string }>()).results.map((r) => r.ma_truong);
        if (duoc.length === 0) return json({ tong: 0, baoSai: [] });
        dieuKien.push(`(${duoc.map(() => "lower(ma_chuong_trinh) LIKE ?").join(" OR ")})`);
        gt.push(...duoc.map((d) => `${d.toLowerCase()}-%`));
      }
      if (dieuKien.length) mua = `WHERE ${dieuKien.join(" AND ")}`;
      const [dem, ds] = (await c.d1.batch([
        c.d1.prepare(`SELECT COUNT(*) AS c FROM bao_sai ${mua}`).bind(...gt),
        c.d1.prepare(`SELECT id, ma_chuong_trinh, truong_du_lieu, noi_dung, link, trang_thai, tao_luc FROM bao_sai ${mua} ORDER BY tao_luc DESC LIMIT ? OFFSET ?`).bind(...gt, t.moi, t.offset),
      ])) as unknown as [{ results: { c: number }[] }, { results: HangBaoSai[] }];
      return json({
        tong: dem.results[0]?.c ?? 0,
        baoSai: ds.results.map((r) => ({ id: r.id, maChuongTrinh: r.ma_chuong_trinh, maTruong: maTruongCuaBaoSai(r.ma_chuong_trinh), truongDuLieu: r.truong_du_lieu, noiDung: r.noi_dung, link: r.link ?? undefined, trangThai: r.trang_thai, luc: r.tao_luc })),
      });
    }

    if (m === "PATCH") {
      const b = await docThan(c.request);
      const id = typeof b.id === "string" ? b.id : "";
      if (!id) throw sai("Thiếu id", "id");
      if (b.loai === "tinh-nguyen") {
        c.yeuCauQtv();
        if (typeof b.trangThai !== "string" || !(TT_TINH_NGUYEN as readonly string[]).includes(b.trangThai)) throw sai("trangThai không hợp lệ", "trangThai");
        if (b.trangThai === "da_cap_quyen") throw sai("Dùng hành động CAP_QUYEN để cấp quyền", "trangThai");
        const r = await c.d1.prepare("UPDATE tinh_nguyen_dang_ky SET trang_thai = ? WHERE id = ?").bind(b.trangThai, id).run();
        if ((r.meta?.changes ?? 0) === 0) throw khongTimThay("Không có đăng ký này");
        await cauNhatKy(c.d1, c.email, `tinh-nguyen.${b.trangThai}`, `tinh_nguyen:${id}`, c.luc).run();
        return json({ id, trangThai: b.trangThai });
      }
      if (b.loai !== "bao-sai") throw sai("loai phải là bao-sai hoặc tinh-nguyen", "loai");
      if (typeof b.trangThai !== "string" || !(TT_BAO_SAI as readonly string[]).includes(b.trangThai)) throw sai("trangThai không hợp lệ", "trangThai");
      const hang = await c.d1.prepare("SELECT ma_chuong_trinh FROM bao_sai WHERE id = ? LIMIT 1").bind(id).first<{ ma_chuong_trinh: string }>();
      if (!hang) throw khongTimThay("Không có báo sai này");
      const ma = maTruongCuaBaoSai(hang.ma_chuong_trinh);
      if (!laQtv && !(await c.coQuyenSuaTruong(ma))) throw cam("Báo sai này thuộc trường chưa giao cho bạn");
      await c.d1.batch([
        c.d1.prepare("UPDATE bao_sai SET trang_thai = ? WHERE id = ?").bind(b.trangThai, id),
        cauNhatKy(c.d1, c.email, `bao-sai.${b.trangThai}`, `bao_sai:${id}`, c.luc),
      ]);
      return json({ id, trangThai: b.trangThai });
    }

    if (m === "POST") {
      c.yeuCauQtv();
      const b = await docThan(c.request);
      if (b.action !== "CAP_QUYEN") throw sai("action phải là CAP_QUYEN", "action");
      const id = typeof b.id === "string" ? b.id : "";
      const dk = await c.d1.prepare("SELECT id, lien_he, ma_truong, trang_thai FROM tinh_nguyen_dang_ky WHERE id = ? LIMIT 1").bind(id).first<{ id: string; lien_he: string; ma_truong: string; trang_thai: string }>();
      if (!dk) throw khongTimThay("Không có đăng ký này");
      if (dk.trang_thai === "da_cap_quyen") throw new LoiHttp(409, "da-cap-quyen", "Đăng ký này đã được cấp quyền rồi");
      if (!laEmail(dk.lien_he)) throw sai("Người này để số điện thoại, chưa có email. Hãy liên hệ xin email đăng nhập rồi thêm ở mục Thành viên.", "lienHe");
      if (!TAP_TRUONG.has(dk.ma_truong)) throw sai("Mã trường của đăng ký không còn trong danh sách", "maTruong");
      const email = chuanHoaEmail(dk.lien_he);
      const daCo = await c.d1.prepare("SELECT vai_tro FROM quan_tri WHERE email = ? LIMIT 1").bind(email).first<{ vai_tro: string }>();
      const matKhauTam = sinhMatKhauTam();
      const ketQua = await c.d1.batch([
        c.d1.prepare("INSERT OR IGNORE INTO quan_tri (email, vai_tro, tao_luc, mat_khau, phai_doi_mat_khau, mat_khau_luc) VALUES (?, 'ctv', ?, ?, 1, ?)").bind(email, c.luc, await bamMatKhau(matKhauTam), c.luc),
        c.d1.prepare("INSERT OR IGNORE INTO phan_cong (email, ma_truong) VALUES (?, ?)").bind(email, dk.ma_truong),
        c.d1.prepare("UPDATE tinh_nguyen_dang_ky SET trang_thai = 'da_cap_quyen' WHERE id = ?").bind(id),
        cauNhatKy(c.d1, c.email, "tinh-nguyen.cap-quyen", `tinh_nguyen:${id}->${email}:${dk.ma_truong}`, c.luc),
      ]);
      const taoMoi = (ketQua[0].meta?.changes ?? 0) === 1;
      return json({ id, email, maTruong: dk.ma_truong, vaiTro: daCo?.vai_tro ?? "ctv", daCoTaiKhoan: !taoMoi, ...(taoMoi ? { matKhauTam } : {}) }, 201);
    }
    throw khongHoTro();
  });

export const onRequest = (ctx: BoiCanh) => xuLy(ctx);

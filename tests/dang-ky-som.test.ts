// Kiểm thử cho tính năng đăng ký nhận thông tin / trải nghiệm sớm
// Kiểm tra kiểm định dữ liệu thuần TS, hàm xử lý Cloudflare Pages Function và lưu D1
// Chạy: npx tsx tests/dang-ky-som.test.ts

import assert from "node:assert/strict";
import {
  kiemTraLienHe,
  kiemTraDuLieuDangKy,
  xuLyDangKySom,
  type EnvDangKySom,
} from "../functions/api/dang-ky-som";

console.log("--- Bắt đầu kiểm thử Đăng ký sớm (API & Validation) ---");

// 1. Kiểm thử hàm kiểm tra liên hệ (email và số điện thoại Việt Nam)
assert.equal(kiemTraLienHe(""), false, "Chuỗi rỗng không hợp lệ");
assert.equal(kiemTraLienHe("   "), false, "Chuỗi khoảng trắng không hợp lệ");
assert.equal(kiemTraLienHe("hocsinh"), false, "Chuỗi văn bản thường không hợp lệ");
assert.equal(kiemTraLienHe("hocsinh@"), false, "Email thiếu domain không hợp lệ");
assert.equal(kiemTraLienHe("@gmail.com"), false, "Email thiếu username không hợp lệ");

// Email hợp lệ
assert.equal(kiemTraLienHe("hocsinh@gmail.com"), true, "Email gmail chuẩn");
assert.equal(kiemTraLienHe("nguyen.van.a@thpt.edu.vn"), true, "Email edu.vn chuẩn");
assert.equal(kiemTraLienHe("user+test@domain.com.vn"), true, "Email có dấu cộng chuẩn");

// Số điện thoại Việt Nam hợp lệ (đầu 03, 05, 07, 08, 09 và +84)
assert.equal(kiemTraLienHe("0901234567"), true, "Số di động 090 hợp lệ");
assert.equal(kiemTraLienHe("0389998888"), true, "Số di động 038 hợp lệ");
assert.equal(kiemTraLienHe("0701122334"), true, "Số di động 070 hợp lệ");
assert.equal(kiemTraLienHe("0812345678"), true, "Số di động 081 hợp lệ");
assert.equal(kiemTraLienHe("0561234567"), true, "Số di động 056 hợp lệ");
assert.equal(kiemTraLienHe("+84901234567"), true, "Số di động có mã quốc gia +84 hợp lệ");
assert.equal(kiemTraLienHe("090 123 4567"), true, "Số di động có khoảng trắng hợp lệ");
assert.equal(kiemTraLienHe("090-123-4567"), true, "Số di động có dấu gạch nối hợp lệ");

// Số điện thoại không hợp lệ
assert.equal(kiemTraLienHe("0123456789"), false, "Đầu số 01 không còn là di động 10 số");
assert.equal(kiemTraLienHe("090123456"), false, "Số điện thoại thiếu chữ số (9 số)");
assert.equal(kiemTraLienHe("09012345678"), false, "Số điện thoại thừa chữ số (11 số)");
assert.equal(kiemTraLienHe("1234567890"), false, "Số điện thoại không bắt đầu bằng 0 hoặc +84");

console.log("✓ Kiểm tra liên hệ (email / số điện thoại) hoàn tất.");

// 2. Kiểm thử kiểm định toàn diện dữ liệu (kiemTraDuLieuDangKy)
assert.equal(kiemTraDuLieuDangKy(null).hopLe, false, "Null không hợp lệ");
assert.equal(kiemTraDuLieuDangKy(undefined).hopLe, false, "Undefined không hợp lệ");
assert.equal(kiemTraDuLieuDangKy("chuoi").hopLe, false, "Chuỗi không hợp lệ");
assert.equal(kiemTraDuLieuDangKy([]).hopLe, false, "Mảng không hợp lệ");

// Thiếu hoặc sai họ tên
assert.equal(kiemTraDuLieuDangKy({ hoTen: "", lop: "12", nhuCau: "nguyen_vong", lienHe: "0901234567" }).hopLe, false);
assert.equal(kiemTraDuLieuDangKy({ hoTen: "   ", lop: "12", nhuCau: "nguyen_vong", lienHe: "0901234567" }).hopLe, false);
assert.equal(kiemTraDuLieuDangKy({ hoTen: "A", lop: "12", nhuCau: "nguyen_vong", lienHe: "0901234567" }).hopLe, false);
assert.equal(kiemTraDuLieuDangKy({ hoTen: "a".repeat(101), lop: "12", nhuCau: "nguyen_vong", lienHe: "0901234567" }).hopLe, false);

// Sai lớp
assert.equal(kiemTraDuLieuDangKy({ hoTen: "Nguyễn Văn A", lop: "10", nhuCau: "nguyen_vong", lienHe: "0901234567" }).hopLe, false);
assert.equal(kiemTraDuLieuDangKy({ hoTen: "Nguyễn Văn A", lop: "dai_hoc", nhuCau: "nguyen_vong", lienHe: "0901234567" }).hopLe, false);

// Sai nhu cầu
assert.equal(kiemTraDuLieuDangKy({ hoTen: "Nguyễn Văn A", lop: "12", nhuCau: "khac", lienHe: "0901234567" }).hopLe, false);
assert.equal(kiemTraDuLieuDangKy({ hoTen: "Nguyễn Văn A", lop: "12", nhuCau: "hoc_phi", lienHe: "0901234567" }).hopLe, false);

// Sai liên hệ
assert.equal(kiemTraDuLieuDangKy({ hoTen: "Nguyễn Văn A", lop: "12", nhuCau: "nguyen_vong", lienHe: "khong_hop_le" }).hopLe, false);

// Trường hợp hợp lệ
const ketQuaHopLe1 = kiemTraDuLieuDangKy({
  hoTen: "  Nguyễn Văn Nam  ",
  lop: "12",
  nhuCau: "nguyen_vong",
  lienHe: "nam@gmail.com",
});
assert.equal(ketQuaHopLe1.hopLe, true);
assert.equal(ketQuaHopLe1.duLieu?.hoTen, "Nguyễn Văn Nam", "Họ tên đã được cắt tỉa khoảng trắng");
assert.equal(ketQuaHopLe1.duLieu?.lop, "12");
assert.equal(ketQuaHopLe1.duLieu?.nhuCau, "nguyen_vong");
assert.equal(ketQuaHopLe1.duLieu?.lienHe, "nam@gmail.com");

const ketQuaHopLe2 = kiemTraDuLieuDangKy({
  hoTen: "Trần Thị Mai",
  lop: "11",
  nhuCau: "nganh",
  lienHe: "0912345678",
});
assert.equal(ketQuaHopLe2.hopLe, true);
assert.equal(ketQuaHopLe2.duLieu?.lop, "11");
assert.equal(ketQuaHopLe2.duLieu?.nhuCau, "nganh");

const ketQuaHopLe3 = kiemTraDuLieuDangKy({
  hoTen: "Lê Hoàng Khang",
  lop: "khac",
  nhuCau: "ke_hoach",
  lienHe: "0389998888",
});
assert.equal(ketQuaHopLe3.hopLe, true);
assert.equal(ketQuaHopLe3.duLieu?.lop, "khac");
assert.equal(ketQuaHopLe3.duLieu?.nhuCau, "ke_hoach");

const ketQuaHopLe4 = kiemTraDuLieuDangKy({
  hoTen: "Phạm Thảo Vy",
  lop: "12",
  nhuCau: "truong",
  lienHe: "thao.vy@edu.vn",
});
assert.equal(ketQuaHopLe4.hopLe, true);
assert.equal(ketQuaHopLe4.duLieu?.nhuCau, "truong");

console.log("✓ Kiểm tra cấu trúc và lọc dữ liệu đầu vào hoàn tất.");

// 3. Kiểm thử endpoint Cloudflare Pages Function (xuLyDangKySom)
async function chayKiemThuEndpoint() {
  // 3.1. Phương thức không phải POST -> 405
  const yeuCauGet = new Request("https://nguyenvongai.vn/api/dang-ky-som", { method: "GET" });
  const phanHoiGet = await xuLyDangKySom(yeuCauGet, {});
  assert.equal(phanHoiGet.status, 405, "GET phải trả về 405");
  const thanGet = (await phanHoiGet.json()) as { thanhCong: boolean };
  assert.equal(thanGet.thanhCong, false);

  // 3.2. Body JSON lỗi cú pháp -> 400
  const yeuCauJsonLoi = new Request("https://nguyenvongai.vn/api/dang-ky-som", {
    method: "POST",
    body: "{ loiJson ",
  });
  const phanHoiJsonLoi = await xuLyDangKySom(yeuCauJsonLoi, {});
  assert.equal(phanHoiJsonLoi.status, 400, "JSON lỗi cú pháp phải trả về 400");

  // 3.3. Dữ liệu không hợp lệ -> 400
  const yeuCauThieu = new Request("https://nguyenvongai.vn/api/dang-ky-som", {
    method: "POST",
    body: JSON.stringify({ hoTen: "", lop: "12" }),
  });
  const phanHoiThieu = await xuLyDangKySom(yeuCauThieu, {});
  assert.equal(phanHoiThieu.status, 400, "Dữ liệu thiếu/sai phải trả về 400");

  // 3.4. Dữ liệu hợp lệ nhưng chưa gắn D1 -> 503 (không báo thành công khi không lưu được)
  const yeuCauHopLe1 = new Request("https://nguyenvongai.vn/api/dang-ky-som", {
    method: "POST",
    body: JSON.stringify({
      hoTen: "Nguyễn Văn Nam",
      lop: "12",
      nhuCau: "nguyen_vong",
      lienHe: "0901234567",
    }),
  });
  const phanHoiHopLe1 = await xuLyDangKySom(yeuCauHopLe1, {});
  assert.equal(phanHoiHopLe1.status, 503, "Không có D1 phải báo 503");
  const thanHopLe1 = (await phanHoiHopLe1.json()) as { thanhCong: boolean };
  assert.equal(thanHopLe1.thanhCong, false);

  // 3.5. Dữ liệu hợp lệ có D1 -> gọi query chuẩn bị và bind chính xác
  let cauLenhSql = "";
  let thamSoBind: unknown[] = [];
  let daChayRun = false;

  const moiTruongD1: EnvDangKySom = {
    D1_CONG_DONG: {
      prepare: (sql: string) => {
        cauLenhSql = sql;
        return {
          bind: (...args: unknown[]) => {
            thamSoBind = args;
            return {
              run: async () => {
                daChayRun = true;
                return { success: true };
              },
            };
          },
        };
      },
    },
  };

  const taoYeuCauHopLe = () =>
    new Request("https://nguyenvongai.vn/api/dang-ky-som", {
      method: "POST",
      body: JSON.stringify({
        hoTen: "Trần Minh Quân",
        lop: "11",
        nhuCau: "nganh",
        lienHe: "quan.tm@gmail.com",
      }),
    });

  const phanHoiHopLe2 = await xuLyDangKySom(taoYeuCauHopLe(), moiTruongD1);
  assert.equal(phanHoiHopLe2.status, 200);
  const thanHopLe2 = (await phanHoiHopLe2.json()) as { thanhCong: boolean; id: string };
  assert.equal(thanHopLe2.thanhCong, true);
  assert.equal(daChayRun, true, "Đã gọi run() vào D1");
  assert.ok(cauLenhSql.includes("INSERT INTO dang_ky_truy_cap_som"), "Câu lệnh SQL chèn dữ liệu đúng bảng");
  assert.equal(thamSoBind[0], thanHopLe2.id, "Tham số 1 là id");
  assert.equal(thamSoBind[1], "Trần Minh Quân", "Tham số 2 là ho_ten");
  assert.equal(thamSoBind[2], "11", "Tham số 3 là lop");
  assert.equal(thamSoBind[3], "nganh", "Tham số 4 là nhu_cau");
  assert.equal(thamSoBind[4], "quan.tm@gmail.com", "Tham số 5 là lien_he");
  assert.ok(typeof thamSoBind[5] === "string", "Tham số 6 là tao_luc ISO string");

  // 3.6. Lỗi D1 ghi cơ sở dữ liệu -> 500
  const moiTruongD1Loi: EnvDangKySom = {
    D1_CONG_DONG: {
      prepare: () => ({
        bind: () => ({
          run: async () => {
            throw new Error("D1 connection refused");
          },
        }),
      }),
    },
  };

  const phanHoiD1Loi = await xuLyDangKySom(taoYeuCauHopLe(), moiTruongD1Loi);
  assert.equal(phanHoiD1Loi.status, 500, "Lỗi D1 trả về 500 an toàn");
  const thanD1Loi = (await phanHoiD1Loi.json()) as { thanhCong: boolean; loi: string };
  assert.equal(thanD1Loi.thanhCong, false);

  console.log("✓ Kiểm thử endpoint Cloudflare Pages Function hoàn tất.");
}

await chayKiemThuEndpoint();
console.log("=== TẤT CẢ KIỂM THỬ ĐĂNG KÝ SỚM ĐÃ ĐẠT 100% ===");

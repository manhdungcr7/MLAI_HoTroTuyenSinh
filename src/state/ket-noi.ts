// Kết nối Claude/ChatGPT: dựng "bản chụp" từ dữ liệu thật trên máy, lưu khóa kết nối cục bộ, áp đề xuất vào nguyện vọng.
// Phần logic thuần (không React). Bản chụp KHÔNG có tên, liên hệ hay lịch sử trò chuyện.
import type { AppState } from "@/state/store";
import type { MonId } from "@/state/types";
import { tim } from "@/data/lua-chon-mau";
import { diemDayDu } from "@/features/kham-pha/to-hop";
import { dungDanhSach } from "@/features/nguyen-vong/tinh-toan";
import { goiYDanhSach, moNeoNV1 } from "@/features/nguyen-vong/goi-y-danh-sach";
import { moTaNguon, tomTatHoSo } from "@/features/tu-van/lay-du-lieu";
import { mucTieuDayDu } from "@/state/chon";
import { suKienTuanNay } from "@/engine/lich-ics";
import { lamSachBanChup, GIOI_HAN_BAN_CHUP, type BanChup, type DeXuat, type GoiYNganh, type NguyenVongChiTiet } from "@/engine/ket-noi-kieu";

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Dựng bản chụp từ trạng thái hiện tại. Tái dùng đúng hàm của màn Nguyện vọng và chatbot, không viết lại logic điểm. */
export function taoBanChup(s: AppState, bayGio: Date = new Date()): BanChup {
  const diem = diemDayDu(s);
  const ds = dungDanhSach(s.nguyenVong.slice(0, GIOI_HAN_BAN_CHUP.nguyenVong), diem, tim);
  const nguyenVong: NguyenVongChiTiet[] = ds.flatMap((d): NguyenVongChiTiet[] => {
    const lc = d.lc;
    if (!lc) return [];
    const theoNam = lc.diemTheoNam ?? {};
    const nam = Object.keys(theoNam).sort((a, b) => b.localeCompare(a)).slice(0, 2);
    const diemChuan = Object.fromEntries(nam.map((k) => [k, theoNam[k]]));
    return [{
      thuTu: d.viTri + 1, id: lc.id, nganh: lc.nganh, truong: lc.truong, maTruong: lc.maTruong ?? "",
      ...(nam.length ? { diemChuan } : {}),
      ...(d.nhan ? { nhan: d.nhan } : {}),
      ...(d.chenh !== null ? { chenh: d.chenh } : {}),
      ...(typeof lc.hocPhiMin === "number" ? { hocPhiTrieu: lc.hocPhiMin } : {}),
      ...(lc.hocPhiUocTinh ? { hocPhiUocTinh: true } : {}),
      nguon: moTaNguon(lc, null),
    }];
  });

  const goiY: GoiYNganh[] = goiYDanhSach(diem, s.hoSo, s.nguyenVong, undefined, moNeoNV1(s))
    .slice(0, GIOI_HAN_BAN_CHUP.goiY)
    .map((g) => ({
      id: g.lc.id, nganh: g.lc.nganh, truong: g.lc.truong, maTruong: g.lc.maTruong ?? "",
      diemChuan: g.lc.diemMin, namDiem: g.lc.namDiem, nhan: g.nhan, chenh: round2(g.tong - g.lc.diemMin),
    }));

  const mt = mucTieuDayDu(s);
  const mucTieu = mt ? { nganh: mt.lc.nganh, truong: mt.lc.truong, diemCan: mt.mucTieu, ...(mt.duDiem ? { conThieu: mt.conThieu } : {}) } : null;

  // Điểm thi thử gom theo ngày. Chỉ ghi tổng khi ngày đó đủ các môn của tổ hợp mục tiêu.
  const theoNgay = new Map<string, Partial<Record<MonId, number>>>();
  for (const d of s.diemThi) theoNgay.set(d.ngay, { ...theoNgay.get(d.ngay), [d.mon]: d.diem });
  const monTH = s.mucTieu?.toHop ?? [];
  const maTH = s.mucTieu?.maToHop;
  const diemThi = [...theoNgay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-GIOI_HAN_BAN_CHUP.diemThi)
    .map(([ngay, m]) => {
      const duMon = !!maTH && monTH.length > 0 && monTH.every((k) => typeof m[k] === "number");
      return duMon ? { ngay, tong: round2(monTH.reduce((t, k) => t + (m[k] ?? 0), 0)), toHop: maTH } : { ngay };
    });

  const t = tomTatHoSo(s);
  const tho: BanChup = {
    phienBan: 1, capNhat: bayGio.toISOString(),
    hoSo: { lop: t.lop ?? null, tinh: t.tinh, nganhQuanTam: t.nganhQuanTam, nganSachToiDaTrieu: t.nganSachToiDaTrieu ?? null, khuVuc: t.khuVuc, toHopCaoNhat: t.toHopCaoNhat ?? null },
    mucTieu, diemThi, nguyenVong, goiY, keHoachTuan: suKienTuanNay(s, bayGio),
  };
  // Quá 64 KB (hiếm): bỏ gợi ý và kế hoạch trước, giữ nguyện vọng. Không cắt âm thầm khi bản chụp còn vừa.
  const nhe: BanChup = { ...tho, goiY: [], keHoachTuan: [] };
  return lamSachBanChup(tho) ?? lamSachBanChup(nhe) ?? nhe;
}

// ---------- Khóa kết nối cục bộ (khóa "nvai:ket-noi": "Xóa hết" sẽ xóa) ----------

export const KHOA_KET_NOI = "nvai:ket-noi";
export interface KetNoiLuu { ma: string; hetHan: string }

function khoMacDinh(): Storage | null {
  try { return typeof localStorage !== "undefined" ? localStorage : null; } catch { return null; }
}

/** Đọc khóa đã lưu. Dữ liệu hỏng hoặc trình duyệt chặn lưu trữ thì trả null, không ném lỗi. */
export function docKetNoi(kho: Storage | null = khoMacDinh()): KetNoiLuu | null {
  try {
    const t = kho?.getItem(KHOA_KET_NOI);
    if (!t) return null;
    const o = JSON.parse(t) as Record<string, unknown>;
    if (!o || typeof o !== "object") return null;
    if (typeof o.ma !== "string" || o.ma.length < 8 || o.ma.length > 200 || /\s/.test(o.ma)) return null;
    if (typeof o.hetHan !== "string") return null;
    return { ma: o.ma, hetHan: o.hetHan };
  } catch { return null; }
}

export function ghiKetNoi(v: KetNoiLuu, kho: Storage | null = khoMacDinh()): boolean {
  try { kho?.setItem(KHOA_KET_NOI, JSON.stringify({ ma: v.ma, hetHan: v.hetHan })); return !!kho; } catch { return false; }
}

export function xoaKetNoi(kho: Storage | null = khoMacDinh()): void {
  try { kho?.removeItem(KHOA_KET_NOI); } catch { /* trình duyệt chặn lưu trữ: không còn gì để xóa */ }
}

// ---------- Áp đề xuất (chỉ khi em bấm Xác nhận) ----------

export type KetQuaApDung =
  | { ok: true; capNhat: Partial<AppState>; chu: string }
  | { ok: false; chu: string };

/** Loại đề xuất áp được ngay trong app. Các loại khác (điểm, mục tiêu) em tự nhập trong app. */
export const LOAI_AP_DUNG_DUOC: DeXuat["loai"][] = ["them-nguyen-vong", "sap-xep-nguyen-vong", "cap-nhat-tien-do"];

/**
 * Áp một đề xuất vào trạng thái hiện tại (hàm thuần: trả về phần cần cập nhật, không tự ghi).
 * Id lạ bị từ chối; id đã có thì không nhân đôi; `viTri` ngoài danh sách thì đưa về cuối.
 */
export function apDungDeXuat(s: AppState, d: DeXuat): KetQuaApDung {
  if (d.loai === "cap-nhat-tien-do") {
    const { taskId, status, expectedStatus } = d.duLieu;
    if (!taskId || !s.viec.some((v) => v.id === taskId) || (status !== "xong" && status !== "chua")) {
      return { ok: false, chu: "Việc học này không còn trong kế hoạch. Em đồng bộ rồi thử lại nhé." };
    }
    const current = s.trangThaiViec[taskId] ?? "chua";
    // Xác nhận lại sau lỗi mạng vẫn an toàn: trạng thái đích đã áp thì không ghi lần hai.
    if (current === status) return { ok: true, capNhat: {}, chu: "Tiến độ đã được cập nhật." };
    if (!expectedStatus || current !== expectedStatus) return { ok: false, chu: "Tiến độ đã thay đổi. Em bỏ qua đề xuất cũ và đồng bộ lại nhé." };
    return { ok: true, capNhat: { trangThaiViec: { ...s.trangThaiViec, [taskId]: status } }, chu: "Đã cập nhật tiến độ học." };
  }
  if (d.loai === "them-nguyen-vong") {
    const id = d.duLieu.idChuongTrinh;
    if (!id || !tim(id)) return { ok: false, chu: "Chương trình này không còn trong dữ liệu của app." };
    if (s.nguyenVong.includes(id)) return { ok: true, capNhat: {}, chu: "Ngành này đã có trong danh sách nguyện vọng của bạn." };
    const ids = [...s.nguyenVong];
    const viTri = Math.min(Math.max(0, d.duLieu.viTri ?? ids.length), ids.length);
    ids.splice(viTri, 0, id);
    return { ok: true, capNhat: { nguyenVong: ids }, chu: `Đã thêm vào nguyện vọng thứ ${viTri + 1}.` };
  }
  if (d.loai === "sap-xep-nguyen-vong") {
    const dangCo = new Set(s.nguyenVong);
    const moi = Array.from(new Set((d.duLieu.thuTuMoi ?? []).filter((id) => dangCo.has(id))));
    const ids = [...moi, ...s.nguyenVong.filter((id) => !moi.includes(id))];
    if (ids.every((id, i) => id === s.nguyenVong[i])) return { ok: true, capNhat: {}, chu: "Thứ tự nguyện vọng đã đúng." };
    return { ok: true, capNhat: { nguyenVong: ids }, chu: "Đã sắp lại thứ tự nguyện vọng." };
  }
  return { ok: false, chu: "Mục này bạn tự cập nhật trong app." };
}

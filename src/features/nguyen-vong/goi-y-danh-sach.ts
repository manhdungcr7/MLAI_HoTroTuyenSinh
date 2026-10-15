// Tự đề xuất một danh sách nguyện vọng cân bằng cho bạn: có Thử sức, Vừa sức, An toàn, Dự phòng, đúng nhóm ngành, khu vực, ngân sách.
// Khi bạn đã có NV1 (hoặc mục tiêu), danh sách xoay quanh nó theo chiến lược "mỏ neo NV1" (xem `goiYDanhSach`).
// Hàm thuần (không React). Mỗi dòng kèm lý do bằng lời, chỉ dùng số có thật trong dữ liệu.
import { LUA_CHON_MAU, tim } from "@/data/lua-chon-mau";
import { coHocPhi } from "@/data/lua-chon-phu";
import { NGAN_SACH_TOI_DA, nhanNguyenVong } from "@/engine/phan-tich";
import { cungNoi } from "@/features/kham-pha/bo-loc";
import { dungKhuVuc } from "@/features/kham-pha/phu-hop";
import { tongChoLuaChon } from "@/features/kham-pha/to-hop";
import type { DiemDayDu, HoSo, LuaChon, NhanNguyenVong } from "@/state/types";
import { dinhDang } from "@/engine/dinh-dang";

/** Vai trò của dòng trong chiến lược mỏ neo; không có mỏ neo thì là "chung". */
export type TangGoiY = "muc-tieu" | "nang-tam" | "cung-truong" | "cung-nganh" | "chot-chan" | "chung";
export interface DongGoiY { lc: LuaChon; nhan: NhanNguyenVong; tong: number; toHop: string | null; lyDo: string[]; tang?: TangGoiY }

/** Cơ cấu gợi ý cho 6 nguyện vọng (khớp lời khuyên giữ khoảng 5–6; bạn thêm, bỏ bớt hoặc sắp lại sau). */
const CO_CAU: NhanNguyenVong[] = ["Thử sức", "Vừa sức", "Vừa sức", "An toàn", "An toàn", "Dự phòng"];
const TOI_DA_MOT_TRUONG = 2;
const TOI_DA_TRUONG_MO_NEO = 3; // mỏ neo + 2 cửa phụ vào đúng trường đó
const TONG_TOI_DA = 6;
const DU_AN_TOAN_TOI_THIEU = 1; // chốt chặn: dư ít nhất 1,0 điểm so với điểm chuẩn
// Dư quá 4 điểm là lãng phí điểm của bạn (điểm chuẩn nhích 1–1,5 điểm là vẫn đỗ): ưu tiên ngành sát điểm bạn nhất. Thiếu quá 2 điểm thì không còn là "thử sức".
const DU_TOI_DA = 4;
const THIEU_TOI_DA_THU_SUC = 2;
const THIEU_TOI_DA_NANG_TAM = 1.5;
const THIEU_XA_CANH_BAO = 3;
const CHOT_CHAN_DU_TOI_DA = 2.5; // chốt chặn dư vừa đủ chịu điểm chuẩn nhích 1–1,5, không thấp hơn điểm mình quá nhiều
// Ô trống nhãn nào thì mượn nhãn kề theo thứ tự này (điểm thấp có thể không có An toàn, điểm cao không có Thử sức...).
const NHAN_THAY_THE: Record<NhanNguyenVong, NhanNguyenVong[]> = {
  "Thử sức": ["Thử sức", "Vừa sức"],
  "Vừa sức": ["Vừa sức", "Thử sức", "An toàn"],
  "An toàn": ["An toàn", "Vừa sức", "Dự phòng"],
  "Dự phòng": ["Dự phòng", "An toàn", "Vừa sức"],
};

/** Mỏ neo: NV1 hiện tại; danh sách trống thì dùng chương trình mục tiêu. */
export function moNeoNV1(s: { nguyenVong: string[]; mucTieu: { luaChonId: string } | null }): LuaChon | null {
  const id = s.nguyenVong[0] ?? s.mucTieu?.luaChonId;
  return id ? tim(id) ?? null : null;
}

type DauVao = Pick<HoSo, "nganSach" | "khuVuc" | "nganhQuanTam" | "tinh"> & { hocXaNha?: boolean | null };
type UngVien = { lc: LuaChon; tong: number; toHop: string | null; nhan: NhanNguyenVong };

const chuanTen = (t: string) => t.toLowerCase().replace(/\s+/g, " ").trim();
const cungTruong = (a: LuaChon, b: LuaChon) => (a.maTruong && b.maTruong ? a.maTruong === b.maTruong : a.truong === b.truong);
const lamTron1 = (n: number) => Math.round(n * 10) / 10;
const tenTr = (l: LuaChon) => l.tenTruong || l.truong;
// Tầng 1a: trường toàn ngành điểm cao thì vẫn lấy tối đa 1 ngành mềm nhất cùng trường, miễn mềm hơn mỏ neo ≥ 0,25 điểm và bạn chỉ thiếu ≤ 1,5 điểm.
const MEM_TOI_THIEU_TANG_1A = 0.25;
const THIEU_TOI_DA_TANG_1A = 1.5;

/**
 * Chiến lược mỏ neo NV1 khi có `moNeo` (NV1 hiện tại, hoặc chương trình mục tiêu nếu danh sách đang trống):
 *  - Lớp 1 (cửa phụ vào đúng trường): nếu mỏ neo đang là Thử sức hoặc vượt ngân sách, tìm ngay trong chính trường đó
 *    chương trình khác của cùng ngành, rồi ngành cùng nhóm, có điểm chuẩn mềm hơn (Vừa sức hoặc An toàn).
 *  - Lớp 2 (đúng ngành ở trường vừa tầm): trường khác có cùng ngành/nhóm ngành, đi từ Vừa sức xuống An toàn.
 *  - Lớp 3 (chốt chặn): dòng cuối luôn là An toàn hoặc Dự phòng, dư tối thiểu 1,0 điểm, trong ngân sách.
 * Mỏ neo chưa có trong `daCo` thì đứng đầu danh sách. Không có mỏ neo thì giữ cách gợi ý cân bằng theo điểm như trước.
 */
export function goiYDanhSach(diem: DiemDayDu, hoSo: DauVao, daCo: string[] = [], ds: LuaChon[] = LUA_CHON_MAU, moNeo?: LuaChon | null): DongGoiY[] {
  const ns = hoSo.nganSach ? NGAN_SACH_TOI_DA[hoSo.nganSach] : Infinity;
  const tinh = hoSo.tinh === "Tỉnh khác" ? "" : hoSo.tinh;
  const trongNganSach = (l: LuaChon) => !coHocPhi(l) || (l.hocPhiMin as number) <= ns;
  const ungVien = ds
    .filter((l) => (!l.phuongThuc || l.phuongThuc === "THPT") && !daCo.includes(l.id))
    .filter(trongNganSach)
    .map((l): UngVien | null => {
      const t = tongChoLuaChon(l, diem);
      return t.tong === null ? null : { lc: l, tong: t.tong, toHop: t.toHop, nhan: nhanNguyenVong(l, t.tong) };
    })
    .filter((x): x is UngVien => x !== null);

  // Mỏ neo chỉ có tác dụng khi tính được tổng điểm theo tổ hợp của chính nó.
  const tMoNeo = moNeo && (!moNeo.phuongThuc || moNeo.phuongThuc === "THPT") ? tongChoLuaChon(moNeo, diem) : null;
  const neo = moNeo && tMoNeo && tMoNeo.tong !== null ? { lc: moNeo, tong: tMoNeo.tong, toHop: tMoNeo.toHop, nhan: nhanNguyenVong(moNeo, tMoNeo.tong) } : null;
  const neoDaCo = !!neo && daCo.includes(neo.lc.id);

  // Điểm ưu tiên: đúng nhóm ngành > đúng khu vực > ngành có nhiều năm dữ liệu > điểm chuẩn cao hơn (với nhãn Thử sức/Vừa sức: sát bạn nhất)
  const nhomUuTien = moNeo ? [...hoSo.nganhQuanTam, moNeo.nhomNganh] : hoSo.nganhQuanTam;
  const nganh = (l: LuaChon) => (nhomUuTien.length === 0 || nhomUuTien.includes(l.nhomNganh) ? 0 : 1);
  const kv = (l: LuaChon) => (dungKhuVuc(l, hoSo.khuVuc) === false ? 2 : tinh && cungNoi(l.khuVuc, tinh) ? 0 : 1);
  const nhieuNam = (l: LuaChon) => (Object.keys(l.diemTheoNam ?? {}).length >= 2 ? 0 : 1);
  const chenhCua = (x: { tong: number; lc: LuaChon }) => Math.round((x.tong - x.lc.diemMin) * 100) / 100;
  const trongTam = (x: { tong: number; lc: LuaChon }) => { const c = chenhCua(x); return c >= -THIEU_TOI_DA_THU_SUC && c <= DU_TOI_DA; };
  const sat = (x: { nhan: NhanNguyenVong; tong: number; lc: LuaChon }, nhanO: NhanNguyenVong = x.nhan) =>
    Math.abs(chenhCua(x) - (nhanO === "Thử sức" ? -1 : nhanO === "Vừa sức" ? 0.7 : nhanO === "An toàn" ? 2.7 : DU_TOI_DA));
  /** Mức gần mỏ neo: 0 = cùng tên ngành, 1 = cùng nhóm ngành, 2 = khác. */
  const gan = (l: LuaChon) => (!neo ? 2 : chuanTen(l.nganh) === chuanTen(neo.lc.nganh) ? 0 : l.nhomNganh === neo.lc.nhomNganh ? 1 : 2);

  const chon: DongGoiY[] = [];
  const soTruong = new Map<string, number>();
  const daLay = new Set<string>();
  const khoaTruong = (l: LuaChon) => l.maTruong ?? l.truong;
  const trungNganh = (l: LuaChon) => chon.some((c) => c.lc.truong === l.truong && c.lc.nganh === l.nganh);
  const lyDoChung = (x: UngVien): string[] => {
    const lyDo: string[] = [];
    const chenh = lamTron1(x.tong - x.lc.diemMin);
    const toHop = x.toHop ? `(${x.toHop}) ` : "";
    lyDo.push(chenh >= 0 ? `Điểm của bạn ${toHop}cao hơn điểm chuẩn ${x.lc.namDiem} ${dinhDang(chenh, 1)} điểm` : `Điểm của bạn ${toHop}thấp hơn điểm chuẩn ${x.lc.namDiem} ${dinhDang(-chenh, 1)} điểm`);
    if (hoSo.nganhQuanTam.includes(x.lc.nhomNganh)) lyDo.push(`Đúng nhóm ngành bạn quan tâm (${x.lc.nhomNganh})`);
    if (tinh && cungNoi(x.lc.khuVuc, tinh)) lyDo.push(`Ở ${x.lc.khuVuc}, gần nơi bạn sống`);
    else if (dungKhuVuc(x.lc, hoSo.khuVuc) === true) lyDo.push(`Ở ${x.lc.khuVuc}, đúng khu vực bạn ưu tiên`);
    if (coHocPhi(x.lc)) lyDo.push(`Học phí khoảng ${dinhDang(x.lc.hocPhiMin as number, 1)} triệu/năm${x.lc.hocPhiUocTinh ? " (ước tính)" : ""}, trong ngân sách`);
    return lyDo;
  };
  const them = (x: UngVien, tang: TangGoiY, lyDoDau: string[] = []) => {
    daLay.add(x.lc.id);
    soTruong.set(khoaTruong(x.lc), (soTruong.get(khoaTruong(x.lc)) ?? 0) + 1);
    chon.push({ lc: x.lc, nhan: x.nhan, tong: x.tong, toHop: x.toHop, lyDo: [...lyDoDau, ...lyDoChung(x)], tang });
  };
  const conCho = (x: UngVien, toiDa: number) => !daLay.has(x.lc.id) && !trungNganh(x.lc) && (soTruong.get(khoaTruong(x.lc)) ?? 0) < toiDa;

  // Có mỏ neo: chừa 1 chỗ cho chốt chặn, và 1 chỗ cho chính mỏ neo nếu nó chưa nằm trong danh sách.
  const choToiDaChon = neo ? TONG_TOI_DA - (neoDaCo ? 0 : 1) - 1 : TONG_TOI_DA;
  let dauTien: DongGoiY | null = null;
  const nhomTang: Partial<Record<TangGoiY, DongGoiY[]>> = {};
  let truocTang = 0;
  const choTang = (tang: TangGoiY, ham: () => void) => { truocTang = chon.length; ham(); nhomTang[tang] = chon.slice(truocTang); };
  /** Dòng đầu tiên của tầng đang chạy (nếu có). */
  const nhomTangHienTai = (): DongGoiY | undefined => chon[truocTang];

  if (neo) {
    const chenh = lamTron1(neo.tong - neo.lc.diemMin);
    if (!neoDaCo) {
      dauTien = { lc: neo.lc, nhan: neo.nhan, tong: neo.tong, toHop: neo.toHop, tang: "muc-tieu", lyDo: [
        "Đây là ngành bạn đặt làm mục tiêu (Nguyện Vọng 1)",
        chenh >= 0 ? `Điểm của bạn cao hơn điểm chuẩn ${neo.lc.namDiem} ${dinhDang(chenh, 1)} điểm` : `Điểm của bạn thấp hơn điểm chuẩn ${neo.lc.namDiem} ${dinhDang(-chenh, 1)} điểm`,
        ...(chenh < -THIEU_XA_CANH_BAO ? [`Khoảng cách khá xa (thiếu ${dinhDang(-chenh, 1)} điểm): giữ làm mơ ước được, nhưng các nguyện vọng còn lại nên sát điểm hiện tại của bạn`] : []),
      ] };
    }
    daLay.add(neo.lc.id);
    soTruong.set(khoaTruong(neo.lc), 1);
    const lamMem = (x: UngVien) => x.lc.diemMin < neo.lc.diemMin && (x.nhan === "Vừa sức" || x.nhan === "An toàn");

    // Lớp 1: cửa phụ vào đúng trường khi mỏ neo đang thiếu điểm hoặc vượt ngân sách học phí.
    const caiCanCuaPhu = neo.nhan === "Thử sức" || neo.tong < neo.lc.diemMin || !trongNganSach(neo.lc);
    choTang("cung-truong", () => {
      if (!caiCanCuaPhu) return;
      const cuaPhu = ungVien
        .filter((x) => cungTruong(x.lc, neo.lc) && gan(x.lc) < 2 && lamMem(x) && conCho(x, TOI_DA_TRUONG_MO_NEO))
        .sort((a, b) => gan(a.lc) - gan(b.lc) || b.lc.diemMin - a.lc.diemMin);
      for (const x of cuaPhu) {
        if (chon.length >= 2 || chon.length >= choToiDaChon) break;
        if (!conCho(x, TOI_DA_TRUONG_MO_NEO)) continue;
        const mem = lamTron1(neo.lc.diemMin - x.lc.diemMin);
        them(x, "cung-truong", [`Cơ hội khác để vào đúng ${tenTr(neo.lc)} (mềm hơn ${dinhDang(mem, 1)} điểm)`]);
      }
      // Tầng 1a: không có ngành Vừa sức/An toàn nào cùng trường thì nới: 1 ngành mềm nhất, dù vẫn là Thử sức.
      if (chon.length === 0 && choToiDaChon > 0) {
        const memNhat = ungVien
          .filter((x) => x.nhan === "Thử sức" && cungTruong(x.lc, neo.lc) && conCho(x, TOI_DA_TRUONG_MO_NEO)
            && neo.lc.diemMin - x.lc.diemMin >= MEM_TOI_THIEU_TANG_1A - 1e-9 && x.lc.diemMin - x.tong <= THIEU_TOI_DA_TANG_1A + 1e-9)
          .sort((a, b) => a.lc.diemMin - b.lc.diemMin || gan(a.lc) - gan(b.lc))[0];
        if (memNhat) {
          const mem = lamTron1(neo.lc.diemMin - memNhat.lc.diemMin);
          them(memNhat, "cung-truong", [`Ngành có điểm chuẩn mềm nhất tại ${tenTr(neo.lc)} (thấp hơn Nguyện Vọng 1 ${dinhDang(mem, 1)} điểm) để tăng cơ hội đỗ đúng trường mơ ước`]);
        }
      }
    });

    // Nâng tầm: mỏ neo đã vừa tầm hoặc dư điểm thì không cần cửa phụ mềm hơn; gợi ý 1 ngành cao hơn một bậc (ưu tiên cùng trường), chỉ thiếu tối đa 1,5 điểm.
    choTang("nang-tam", () => {
      if (caiCanCuaPhu || choToiDaChon <= 0) return;
      const x = ungVien
        .filter((u) => (u.nhan === "Thử sức" || u.nhan === "Vừa sức") && u.lc.diemMin >= neo.lc.diemMin + 0.5 && chenhCua(u) >= -THIEU_TOI_DA_NANG_TAM
          && (cungTruong(u.lc, neo.lc) || nganh(u.lc) === 0) && conCho(u, cungTruong(u.lc, neo.lc) ? TOI_DA_TRUONG_MO_NEO : TOI_DA_MOT_TRUONG))
        .sort((a, b) => Number(!cungTruong(a.lc, neo.lc)) - Number(!cungTruong(b.lc, neo.lc)) || gan(a.lc) - gan(b.lc) || nhieuNam(a.lc) - nhieuNam(b.lc)
          || Math.abs(chenhCua(a) + 0.5) - Math.abs(chenhCua(b) + 0.5))[0];
      if (x) them(x, "nang-tam", [cungTruong(x.lc, neo.lc) ? `Nâng tầm: ngành cao hơn trong cùng ${tenTr(neo.lc)}, nếu năm nay điểm chuẩn thấp hơn bạn sẽ có thêm cơ hội` : `Nâng tầm: một bậc trên Nguyện Vọng 1 cùng hướng ngành, nên thử khi bạn còn đủ chỗ`]);
    });

    // Lớp 2: đúng ngành ở trường khác, đi từ Vừa sức xuống An toàn.
    choTang("cung-nganh", () => {
      const giuNganh = `Giữ đúng ngành ${neo.lc.nganh} bạn thích, giảm rủi ro trượt Nguyện Vọng 1`;
      for (const nhan of ["Vừa sức", "An toàn"] as const) {
        if (chon.length >= choToiDaChon) break;
        const x = ungVien
          .filter((u) => u.nhan === nhan && trongTam(u) && gan(u.lc) < 2 && !cungTruong(u.lc, neo.lc) && conCho(u, TOI_DA_MOT_TRUONG))
          .sort((a, b) => gan(a.lc) - gan(b.lc) || kv(a.lc) - kv(b.lc) || nhieuNam(a.lc) - nhieuNam(b.lc) || sat(a) - sat(b))[0];
        if (x) them(x, "cung-nganh", [giuNganh]);
      }
      // Tầng 1b: cả trường NV1 không có cửa phụ nào thì nói rõ vì sao danh sách nhảy sang trường khác.
      const dauLop2 = nhomTangHienTai();
      if (caiCanCuaPhu && (nhomTang["cung-truong"] ?? []).length === 0 && dauLop2) {
        dauLop2.lyDo.splice(1, 0, `Vì các ngành khác tại ${tenTr(neo.lc)} đều có mức điểm chuẩn tương đương hoặc cao hơn, danh sách ưu tiên giữ đúng ngành ${neo.lc.nganh} ở các trường vừa sức hơn.`);
      }
    });
  }

  // Phần còn lại theo cơ cấu cân bằng như trước (đủ nhãn còn thiếu), tới khi đủ 6 dòng.
  const coCau = [...CO_CAU];
  if (neo) {
    for (const d of [...(dauTien ? [dauTien] : []), ...chon]) { const i = coCau.indexOf(d.nhan); if (i >= 0) coCau.splice(i, 1); }
    if (neoDaCo) { const i = coCau.indexOf(neo.nhan); if (i >= 0) coCau.splice(i, 1); }
  }
  // Mỗi ô một nhãn; hết ứng viên đúng nhãn thì mượn nhãn kề, và chỉ chọn ngành sát điểm bạn (không thiếu quá 2, không dư quá 4) trừ khi không còn cách nào.
  for (const nhan of coCau) {
    if (chon.length >= choToiDaChon) break;
    let dung: UngVien | undefined;
    for (const rong of [false, true]) {
      for (const n of NHAN_THAY_THE[nhan]) {
        dung = ungVien
          .filter((x) => x.nhan === n && (rong || trongTam(x)) && conCho(x, TOI_DA_MOT_TRUONG))
          .sort((a, b) => nganh(a.lc) - nganh(b.lc) || kv(a.lc) - kv(b.lc) || nhieuNam(a.lc) - nhieuNam(b.lc) || sat(a, nhan) - sat(b, nhan))[0];
        if (dung) break;
      }
      if (dung) break;
    }
    if (dung) them(dung, "chung");
  }

  // Lớp 3: chốt chặn an toàn (chỉ khi có mỏ neo): dư tối thiểu 1,0 điểm, trong ngân sách; luôn nằm cuối danh sách.
  let chotChan: DongGoiY | null = null;
  if (neo) {
    const duAnToan = (x: { tong: number; lc: LuaChon }) => x.tong - x.lc.diemMin >= DU_AN_TOAN_TOI_THIEU;
    const lyDoChot = (x: { tong: number; lc: LuaChon }) => `Chốt chặn an toàn: dư ${dinhDang(lamTron1(x.tong - x.lc.diemMin), 1)} điểm so với điểm chuẩn, để bạn chắc chắn có chỗ học`;
    const ungChot = ungVien
      .filter((x) => (x.nhan === "An toàn" || x.nhan === "Dự phòng") && duAnToan(x) && !daLay.has(x.lc.id) && !trungNganh(x.lc) && (soTruong.get(khoaTruong(x.lc)) ?? 0) < TOI_DA_MOT_TRUONG)
      .sort((a, b) => Number(chenhCua(a) > CHOT_CHAN_DU_TOI_DA) - Number(chenhCua(b) > CHOT_CHAN_DU_TOI_DA) || gan(a.lc) - gan(b.lc) || kv(a.lc) - kv(b.lc) || nhieuNam(a.lc) - nhieuNam(b.lc) || Math.abs(chenhCua(a) - 2) - Math.abs(chenhCua(b) - 2))[0];
    if (ungChot) {
      chotChan = { lc: ungChot.lc, nhan: ungChot.nhan, tong: ungChot.tong, toHop: ungChot.toHop, tang: "chot-chan", lyDo: [lyDoChot(ungChot), ...lyDoChung(ungChot).slice(1)] };
    } else {
      // Hết ứng viên mới: kéo dòng đủ an toàn sẵn có xuống cuối.
      const sanCo = chon.filter((d) => (d.nhan === "An toàn" || d.nhan === "Dự phòng") && duAnToan(d)).sort((a, b) => (a.tong - a.lc.diemMin) - (b.tong - b.lc.diemMin))[0];
      if (sanCo) {
        chon.splice(chon.indexOf(sanCo), 1);
        chotChan = { ...sanCo, tang: "chot-chan", lyDo: [lyDoChot(sanCo), ...sanCo.lyDo.filter((l) => !l.startsWith("Điểm của bạn"))] };
      }
    }
  }

  // Không có mỏ neo: Thử sức trước, Dự phòng sau, đúng thứ tự ưu tiên khi đăng ký.
  const thuTu: Record<NhanNguyenVong, number> = { "Thử sức": 0, "Vừa sức": 1, "An toàn": 2, "Dự phòng": 3 };
  const theoNhan = (a: DongGoiY, b: DongGoiY) => thuTu[a.nhan] - thuTu[b.nhan] || b.lc.diemMin - a.lc.diemMin;
  if (!neo) return chon.sort(theoNhan);
  // Có mỏ neo: mỏ neo → cửa phụ cùng trường → cùng ngành → phần cân bằng còn lại → chốt chặn.
  const nangTamDs = (nhomTang["nang-tam"] ?? []).filter((d) => chon.includes(d));
  const cungTruongDs = (nhomTang["cung-truong"] ?? []).filter((d) => chon.includes(d)).sort((a, b) => b.lc.diemMin - a.lc.diemMin);
  const cungNganhDs = (nhomTang["cung-nganh"] ?? []).filter((d) => chon.includes(d)).sort((a, b) => b.lc.diemMin - a.lc.diemMin);
  const conLai = chon.filter((d) => !nangTamDs.includes(d) && !cungTruongDs.includes(d) && !cungNganhDs.includes(d)).sort(theoNhan);
  const ketQua = [...(dauTien ? [dauTien] : []), ...nangTamDs, ...cungTruongDs, ...cungNganhDs, ...conLai, ...(chotChan ? [chotChan] : [])];
  return ketQua.slice(0, TONG_TOI_DA);
}

// Nhập thông tin xét tuyển sớm & đa phương thức: Chứng chỉ ngoại ngữ, ĐGNL, Học bạ, Giải HSG.
import { useState } from "react";
import { Award, ChevronDown } from "lucide-react";
import { Nhan, gop } from "@/components/ui/nut-the";
import type { HoSo } from "@/state/types";

type P = {
  h: HoSo;
  sua: (p: Partial<HoSo>) => void;
};

export default function DiemXetTuyenSom({ h, sua }: P) {
  const cc = h.chungChiNgoaiNgu;
  const dgnl = h.diemDgnl ?? {};
  const hb = h.hocBa ?? {};
  const hsg = h.giaiThuongHsg ?? null;

  const daCo = Boolean(
    (cc && cc.diem > 0) ||
    dgnl.hcm || dgnl.hn || dgnl.tsa ||
    hb.dtb3Nam || hb.dtbLop12 ||
    hsg?.cap
  );

  const [mo, setMo] = useState(daCo);

  // Ngoại ngữ
  const [loaiCc, setLoaiCc] = useState<string>(cc?.loai ?? "IELTS");
  const [diemCcChu, setDiemCcChu] = useState<string>(cc?.diem ? String(cc.diem).replace(".", ",") : "");

  // ĐGNL
  const [hcmChu, setHcmChu] = useState<string>(dgnl.hcm ? String(dgnl.hcm) : "");
  const [hnChu, setHnChu] = useState<string>(dgnl.hn ? String(dgnl.hn) : "");
  const [tsaChu, setTsaChu] = useState<string>(dgnl.tsa ? String(dgnl.tsa) : "");

  // Học bạ
  const [hb10Chu, setHb10Chu] = useState<string>(hb.dtbLop10 ? String(hb.dtbLop10).replace(".", ",") : "");
  const [hb11Chu, setHb11Chu] = useState<string>(hb.dtbLop11 ? String(hb.dtbLop11).replace(".", ",") : "");
  const [hb12Chu, setHb12Chu] = useState<string>(hb.dtbLop12 ? String(hb.dtbLop12).replace(".", ",") : "");
  const [hb3NamChu, setHb3NamChu] = useState<string>(hb.dtb3Nam ? String(hb.dtb3Nam).replace(".", ",") : "");

  // Cập nhật chứng chỉ ngoại ngữ
  const capNhatCc = (loai: string, chu: string) => {
    setLoaiCc(loai);
    setDiemCcChu(chu);
    const num = Number.parseFloat(chu.replace(",", "."));
    if (Number.isFinite(num) && num > 0) {
      sua({
        chungChiNgoaiNgu: {
          loai: loai as NonNullable<HoSo["chungChiNgoaiNgu"]>["loai"],
          diem: num,
        },
      });
    } else if (!chu.trim()) {
      sua({ chungChiNgoaiNgu: null });
    }
  };

  // Cập nhật ĐGNL
  const capNhatDgnl = (key: "hcm" | "hn" | "tsa", chu: string) => {
    if (key === "hcm") setHcmChu(chu);
    if (key === "hn") setHnChu(chu);
    if (key === "tsa") setTsaChu(chu);

    const num = Number.parseFloat(chu.replace(",", "."));
    const val = Number.isFinite(num) && num > 0 ? num : null;
    sua({
      diemDgnl: {
        ...dgnl,
        [key]: val,
      },
    });
  };

  // Cập nhật Học bạ
  const capNhatHb = (key: "dtbLop10" | "dtbLop11" | "dtbLop12" | "dtb3Nam", chu: string) => {
    if (key === "dtbLop10") setHb10Chu(chu);
    if (key === "dtbLop11") setHb11Chu(chu);
    if (key === "dtbLop12") setHb12Chu(chu);
    if (key === "dtb3Nam") setHb3NamChu(chu);

    const num = Number.parseFloat(chu.replace(",", "."));
    const val = Number.isFinite(num) && num >= 0 && num <= 10 ? num : null;
    sua({
      hocBa: {
        ...hb,
        [key]: val,
      },
    });
  };

  // Cập nhật giải HSG
  const capNhatHsg = (capMoi?: "quocGia" | "tinh" | "truongChuyen" | null, monMoi?: string, giaiMoi?: "nhat" | "nhi" | "ba" | "khuyenKhich" | null) => {
    const cap = capMoi !== undefined ? capMoi : hsg?.cap ?? null;
    const mon = monMoi !== undefined ? monMoi : hsg?.mon;
    const giai = giaiMoi !== undefined ? giaiMoi : hsg?.giai ?? null;
    if (!cap && !mon && !giai) {
      sua({ giaiThuongHsg: null });
    } else {
      sua({
        giaiThuongHsg: { cap, mon, giai },
      });
    }
  };

  return (
    <section className="rounded-the border border-vien bg-trang">
      <button
        type="button"
        onClick={() => setMo(!mo)}
        aria-expanded={mo}
        aria-controls="bd-xet-tuyen-som"
        className="w-full min-h-14 flex items-center gap-3 px-4 text-left"
      >
        <span className="size-9 rounded-xl grid place-items-center bg-luc-nhat text-luc-chu shrink-0">
          <Award size={18} />
        </span>
        <span className="flex-1 min-w-0">
          <span className="flex items-center gap-2">
            <b className="text-[15px] text-chu">Kỳ thi ĐGNL, Ngoại ngữ (IELTS) & Học bạ</b>
            {daCo && <Nhan tone="luc" className="text-[11px] py-0 px-1.5">Đã nhập</Nhan>}
          </span>
          <span className="block text-[13px] text-chu-phu truncate">
            Đánh giá năng lực · IELTS/VSTEP · học bạ 3 năm · giải HSG
          </span>
        </span>
        <ChevronDown size={20} className={gop("text-chu-phu transition-transform", mo && "rotate-180")} />
      </button>

      {mo && (
        <div id="bd-xet-tuyen-som" className="px-4 pb-4 border-t border-vien pt-3 space-y-4">
          {/* Chứng chỉ ngoại ngữ */}
          <div>
            <label className="block text-[13px] font-bold text-chu mb-1.5">
              Chứng chỉ ngoại ngữ (IELTS, VSTEP, TOEIC...)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={loaiCc}
                onChange={(e) => capNhatCc(e.target.value, diemCcChu)}
                className="min-h-11 rounded-xl border border-vien bg-trang px-3 text-[14px] font-bold text-muc focus:border-xanh"
              >
                <option value="IELTS">IELTS Academic</option>
                <option value="TOEFL">TOEFL iBT</option>
                <option value="TOEIC">TOEIC (4 kỹ năng)</option>
                <option value="VSTEP">VSTEP Bậc 3-5</option>
                <option value="JLPT">Tiếng Nhật JLPT</option>
                <option value="HSK">Tiếng Trung HSK</option>
              </select>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder={loaiCc === "IELTS" ? "VD: 6.5" : "Điểm đạt"}
                  value={diemCcChu}
                  maxLength={5}
                  onChange={(e) => capNhatCc(loaiCc, e.target.value)}
                  className="w-full min-h-11 rounded-xl border border-vien bg-trang px-2 text-center text-[15px] font-bold text-muc placeholder:text-chu-phu/60 focus:border-xanh"
                />
              </div>
            </div>
            <p className="mt-1 text-[11px] text-chu-phu">Các trường quy đổi IELTS 6.5+ thành điểm 10 tiếng Anh hoặc xét kết hợp.</p>
          </div>

          {/* Kỳ thi ĐGNL / ĐGTD */}
          <div>
            <label className="block text-[13px] font-bold text-chu mb-1.5">
              Điểm kỳ thi Đánh giá năng lực / Đánh giá tư duy
            </label>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-the border border-vien bg-nen p-2">
                <span className="block text-[12px] font-bold text-chu mb-1 truncate">ĐHQG-HCM</span>
                <div className="flex items-center gap-0.5">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="–"
                    value={hcmChu}
                    maxLength={4}
                    onChange={(e) => capNhatDgnl("hcm", e.target.value)}
                    className="w-full min-h-10 rounded-xl border border-vien bg-trang px-1 text-center text-[14px] font-bold text-muc focus:border-xanh"
                  />
                  <span className="text-[11px] text-chu-phu shrink-0">/1200</span>
                </div>
              </div>
              <div className="rounded-the border border-vien bg-nen p-2">
                <span className="block text-[12px] font-bold text-chu mb-1 truncate">ĐHQG Hà Nội</span>
                <div className="flex items-center gap-0.5">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="–"
                    value={hnChu}
                    maxLength={3}
                    onChange={(e) => capNhatDgnl("hn", e.target.value)}
                    className="w-full min-h-10 rounded-xl border border-vien bg-trang px-1 text-center text-[14px] font-bold text-muc focus:border-xanh"
                  />
                  <span className="text-[11px] text-chu-phu shrink-0">/150</span>
                </div>
              </div>
              <div className="rounded-the border border-vien bg-nen p-2">
                <span className="block text-[12px] font-bold text-chu mb-1 truncate">TSA Bách Khoa</span>
                <div className="flex items-center gap-0.5">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="–"
                    value={tsaChu}
                    maxLength={3}
                    onChange={(e) => capNhatDgnl("tsa", e.target.value)}
                    className="w-full min-h-10 rounded-xl border border-vien bg-trang px-1 text-center text-[14px] font-bold text-muc focus:border-xanh"
                  />
                  <span className="text-[11px] text-chu-phu shrink-0">/100</span>
                </div>
              </div>
            </div>
          </div>

          {/* Học bạ THPT */}
          <div>
            <label className="block text-[13px] font-bold text-chu mb-1.5">
              Điểm trung bình học bạ THPT
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              <div className="rounded-the border border-vien bg-nen p-1.5 text-center">
                <span className="block text-[11px] font-bold text-chu-phu mb-0.5">Lớp 10</span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="–"
                  value={hb10Chu}
                  maxLength={4}
                  onChange={(e) => capNhatHb("dtbLop10", e.target.value)}
                  className="w-full min-h-9 rounded-lg border border-vien bg-trang text-center text-[13px] font-bold text-muc focus:border-xanh"
                />
              </div>
              <div className="rounded-the border border-vien bg-nen p-1.5 text-center">
                <span className="block text-[11px] font-bold text-chu-phu mb-0.5">Lớp 11</span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="–"
                  value={hb11Chu}
                  maxLength={4}
                  onChange={(e) => capNhatHb("dtbLop11", e.target.value)}
                  className="w-full min-h-9 rounded-lg border border-vien bg-trang text-center text-[13px] font-bold text-muc focus:border-xanh"
                />
              </div>
              <div className="rounded-the border border-vien bg-nen p-1.5 text-center">
                <span className="block text-[11px] font-bold text-chu-phu mb-0.5">Lớp 12</span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="–"
                  value={hb12Chu}
                  maxLength={4}
                  onChange={(e) => capNhatHb("dtbLop12", e.target.value)}
                  className="w-full min-h-9 rounded-lg border border-vien bg-trang text-center text-[13px] font-bold text-muc focus:border-xanh"
                />
              </div>
              <div className="rounded-the border border-xanh/40 bg-xanh-nhat/30 p-1.5 text-center">
                <span className="block text-[11px] font-bold text-xanh mb-0.5">ĐTB 3 năm</span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="–"
                  value={hb3NamChu}
                  maxLength={4}
                  onChange={(e) => capNhatHb("dtb3Nam", e.target.value)}
                  className="w-full min-h-9 rounded-lg border border-xanh/50 bg-trang text-center text-[13px] font-bold text-muc focus:border-xanh"
                />
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3 text-[12px] text-chu">
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hb.truongChuyen === true}
                  onChange={(e) => sua({ hocBa: { ...hb, truongChuyen: e.target.checked } })}
                  className="size-4 rounded border-vien text-xanh"
                />
                <span>Học sinh trường THPT Chuyên</span>
              </label>
              <select
                value={hb.hanhKiem ?? "tot"}
                onChange={(e) => sua({ hocBa: { ...hb, hanhKiem: e.target.value as "tot" | "kha" | "trungBinh" } })}
                className="rounded-lg border border-vien bg-trang px-2 py-1 text-[12px] font-semibold text-chu"
              >
                <option value="tot">Hạnh kiểm Tốt</option>
                <option value="kha">Hạnh kiểm Khá</option>
              </select>
            </div>
          </div>

          {/* Giải thưởng HSG */}
          <div>
            <label className="block text-[13px] font-bold text-chu mb-1.5">
              Giải thưởng thi học sinh giỏi (nếu có)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <select
                value={hsg?.cap ?? ""}
                onChange={(e) => capNhatHsg((e.target.value || null) as "quocGia" | "tinh" | "truongChuyen" | null)}
                className="min-h-10 rounded-xl border border-vien bg-trang px-2 text-[13px] font-medium text-muc"
              >
                <option value="">Cấp thi</option>
                <option value="quocGia">Quốc gia</option>
                <option value="tinh">Tỉnh / TP</option>
                <option value="truongChuyen">Trường Chuyên</option>
              </select>
              <input
                type="text"
                placeholder="Môn (VD: Toán)"
                value={hsg?.mon ?? ""}
                onChange={(e) => capNhatHsg(undefined, e.target.value)}
                className="min-h-10 rounded-xl border border-vien bg-trang px-2 text-center text-[13px] font-medium text-muc focus:border-xanh"
              />
              <select
                value={hsg?.giai ?? ""}
                onChange={(e) => capNhatHsg(undefined, undefined, (e.target.value || null) as "nhat" | "nhi" | "ba" | "khuyenKhich" | null)}
                className="min-h-10 rounded-xl border border-vien bg-trang px-2 text-[13px] font-medium text-muc"
              >
                <option value="">Giải</option>
                <option value="nhat">Giải Nhất</option>
                <option value="nhi">Giải Nhì</option>
                <option value="ba">Giải Ba</option>
                <option value="khuyenKhich">Giải Khuyến khích</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}


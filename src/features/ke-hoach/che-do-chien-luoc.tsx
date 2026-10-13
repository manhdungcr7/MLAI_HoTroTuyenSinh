// Chế độ "Chiến lược & Lộ trình": Chẩn đoán năng lực theo dải điểm, 3 mốc tuyển sinh 2026 và Bảng check-in tiến độ chuyên đề.
import { useState } from "react";
import { BookOpen, CheckCircle, Clock, Compass, Flame, HelpCircle, Zap } from "lucide-react";
import { Nhan, TONE_CHU, TONE_NEN, gop } from "@/components/ui/nut-the";
import { useApp } from "@/state/store";
import { mucTieuDayDu, khoangCachCuaToi } from "@/state/chon";
import { TEN_MON, TEN_MON_NGAN, type MonId, type ToneTen } from "@/state/types";
import { NOI_DUNG_ON } from "@/engine/tao-viec";
import { dinhDang } from "@/engine/dinh-dang";

const TRANG_THAI_CHUYEN_DE = [
  { ma: "chuaHoc", nhan: "Chưa học", tone: "muc", icon: HelpCircle },
  { ma: "dangHoc", nhan: "Đang học", tone: "cam", icon: Clock },
  { ma: "namVung", nhan: "Nắm vững", tone: "luc", icon: CheckCircle },
  { ma: "canOnTap", nhan: "Cần ôn gấp", tone: "do", icon: Flame },
] as const;

export function CheDoChienLuoc({ hienThongBao }: { hienThongBao: (c: string) => void }) {
  const { s, capNhatHoSo } = useApp();
  const m = mucTieuDayDu(s);
  const kc = khoangCachCuaToi(s);
  const toHop = m?.toHop ?? ["toan", "nguVan", "tiengAnh"];
  const [monChon, setMonChon] = useState<MonId>(toHop[0]);

  // Chẩn đoán năng lực theo dải điểm
  const diemTb = kc.length > 0
    ? kc.reduce((sum, x) => sum + (x.hienTai ?? 0), 0) / kc.length
    : 0;

  let tangNangLuc: { nhan: string; mucTieuNhan: string; loiKhuyen: string; tone: ToneTen } = {
    nhan: "Nền tảng & Củng cố lý thuyết",
    mucTieuNhan: "Vững 7,0 điểm phần cơ bản",
    loiKhuyen: "Tập trung giải quyết 35 câu đầu SGK. Chưa vội luyện đề khó, tránh bị hoang mang và hổng kiến thức nền.",
    tone: "cam",
  };

  if (diemTb >= 8.2) {
    tangNangLuc = {
      nhan: "Về đích & Vận dụng cao",
      mucTieuNhan: "Chinh phục 9,0+ điểm phân hóa",
      loiKhuyen: "Rà soát bẫy đề các Sở GD, rèn kỹ năng xử lý câu hỏi lạ và nâng độ chuẩn xác lên tuyệt đối.",
      tone: "tim",
    };
  } else if (diemTb >= 7.0) {
    tangNangLuc = {
      nhan: "Bứt phá & Tăng tốc",
      mucTieuNhan: "Ăn trọn 8,0+ điểm vận dụng",
      loiKhuyen: "Rèn phản xạ nhận diện dạng bài quen thuộc, bấm giờ luyện đề 50 phút và bấm máy tính Casio giải nhanh.",
      tone: "xanh",
    };
  }

  // Cập nhật trạng thái chuyên đề
  const doiTrangThai = (tenChuyenDe: string, tt: "chuaHoc" | "dangHoc" | "namVung" | "canOnTap") => {
    const td = { ...(s.hoSo.tienDoKienThuc ?? {}) };
    td[tenChuyenDe] = tt;
    capNhatHoSo({ tienDoKienThuc: td });
    if (tt === "canOnTap") {
      hienThongBao(`Đã đánh dấu "${tenChuyenDe}" là cần ôn gấp. Bài này sẽ được xếp vào tuần học.`);
    }
  };

  const tienDo = s.hoSo.tienDoKienThuc ?? {};
  const danhSachChuyenDe = NOI_DUNG_ON[monChon] ?? [];

  return (
    <div className="space-y-4">
      {/* Khối Chẩn đoán năng lực */}
      <section className="rounded-the border border-vien bg-trang p-4 shadow-the">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="flex items-center gap-2 text-[15px] font-extrabold text-muc">
            <Zap size={18} className="text-xanh" />
            Chẩn đoán năng lực học tập
          </span>
          <Nhan tone={tangNangLuc.tone}>{tangNangLuc.nhan}</Nhan>
        </div>

        <div className="rounded-xl bg-nen p-3 mb-3">
          <div className="flex items-center justify-between text-[13px] mb-1">
            <span className="text-chu font-semibold">Trọng tâm: <b className="text-muc">{tangNangLuc.mucTieuNhan}</b></span>
            <span className="text-chu-phu text-[12px]">Điểm TB: {dinhDang(diemTb, 1)}</span>
          </div>
          <p className="text-[13px] text-chu leading-snug">{tangNangLuc.loiKhuyen}</p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {kc.map((k) => (
            <div key={k.mon} className="rounded-xl border border-vien p-2 text-center bg-trang">
              <span className="block text-[12px] font-bold text-chu truncate">{TEN_MON_NGAN[k.mon]}</span>
              <b className="block text-[16px] font-extrabold text-muc mt-0.5">{k.hienTai !== null ? dinhDang(k.hienTai, 1) : "–"}</b>
              <span className={gop("block text-[11px] font-semibold mt-0.5", k.thieu > 0 ? "text-cam-chu" : "text-luc-chu")}>
                {k.thieu > 0 ? `Thiếu ${dinhDang(k.thieu, 1)}` : "Đã đạt"}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Lộ trình 3 Mốc Chiến lược Tuyển sinh */}
      <section className="rounded-the border border-vien bg-trang p-4 shadow-the">
        <h3 className="flex items-center gap-2 text-[15px] font-extrabold text-muc mb-3">
          <Compass size={18} className="text-xanh" />
          Lộ trình 3 mốc tuyển sinh 2026
        </h3>

        <div className="space-y-3">
          {/* Mốc 1 */}
          <div className="rounded-xl border border-xanh/30 bg-xanh-nhat/20 p-3">
            <div className="flex items-center justify-between gap-2">
              <b className="text-[14px] text-muc">Mốc 1 · Xét tuyển sớm & ĐGNL</b>
              <Nhan tone="xanh" className="text-[11px] py-0 px-1.5">Tháng 1 – Tháng 4</Nhan>
            </div>
            <ul className="mt-2 space-y-1 text-[13px] text-chu">
              <li className="flex items-start gap-1.5">
                <span className="size-1.5 rounded-full bg-xanh mt-1.5 shrink-0" />
                <span>Thi ĐGNL ĐHQG-HCM đợt 1 hoặc HSA Hà Nội / TSA Bách Khoa.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="size-1.5 rounded-full bg-xanh mt-1.5 shrink-0" />
                <span>Thi chứng chỉ ngoại ngữ (IELTS 6.5+ / VSTEP) để quy đổi điểm 10.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="size-1.5 rounded-full bg-xanh mt-1.5 shrink-0" />
                <span>Hoàn tất điểm học bạ 5 học kỳ lớp 10, 11 và HK1 lớp 12.</span>
              </li>
            </ul>
          </div>

          {/* Mốc 2 */}
          <div className="rounded-xl border border-cam/30 bg-cam-nhat/20 p-3">
            <div className="flex items-center justify-between gap-2">
              <b className="text-[14px] text-muc">Mốc 2 · Luyện đề & Nộp hồ sơ sớm</b>
              <Nhan tone="cam" className="text-[11px] py-0 px-1.5">Tháng 4 – Tháng 5</Nhan>
            </div>
            <ul className="mt-2 space-y-1 text-[13px] text-chu">
              <li className="flex items-start gap-1.5">
                <span className="size-1.5 rounded-full bg-cam mt-1.5 shrink-0" />
                <span>Nộp hồ sơ xét tuyển sớm theo phương thức học bạ và kết hợp.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="size-1.5 rounded-full bg-cam mt-1.5 shrink-0" />
                <span>Luyện đề tổng hợp chuẩn cấu trúc đề thi tốt nghiệp mới.</span>
              </li>
            </ul>
          </div>

          {/* Mốc 3 */}
          <div className="rounded-xl border border-luc/30 bg-luc-nhat/20 p-3">
            <div className="flex items-center justify-between gap-2">
              <b className="text-[14px] text-muc">Mốc 3 · Nước rút Tốt nghiệp THPT</b>
              <Nhan tone="luc" className="text-[11px] py-0 px-1.5">Tháng 5 – Tháng 6</Nhan>
            </div>
            <ul className="mt-2 space-y-1 text-[13px] text-chu">
              <li className="flex items-start gap-1.5">
                <span className="size-1.5 rounded-full bg-luc mt-1.5 shrink-0" />
                <span>Bấm giờ thực chiến 100% đề thi thử các trường chuyên và Sở GD.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="size-1.5 rounded-full bg-luc mt-1.5 shrink-0" />
                <span>Tập trung dồn sức kéo điểm 3 môn trong tổ hợp mục tiêu.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Bảng Check-in Tiến độ Chuyên đề */}
      <section className="rounded-the border border-vien bg-trang p-4 shadow-the">
        <div className="flex items-center justify-between gap-2 mb-2">
          <h3 className="flex items-center gap-2 text-[15px] font-extrabold text-muc">
            <BookOpen size={18} className="text-xanh" />
            Tiến độ kiến thức từng môn
          </h3>
          <span className="text-[12px] text-chu-phu">Chạm để đổi</span>
        </div>

        {/* Tab chọn môn */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 mb-3 scrollbar-none">
          {toHop.map((mon) => (
            <button
              key={mon}
              type="button"
              onClick={() => setMonChon(mon)}
              className={gop(
                "px-3 py-1.5 rounded-xl text-[13px] font-bold shrink-0 transition-colors",
                monChon === mon ? "bg-xanh text-white" : "bg-nen text-chu hover:bg-vien"
              )}
            >
              {TEN_MON[mon]}
            </button>
          ))}
        </div>

        {/* Danh sách chuyên đề của môn */}
        <div className="space-y-2">
          {danhSachChuyenDe.map((cd) => {
            const hienTai = tienDo[cd] ?? "chuaHoc";
            return (
              <div
                key={cd}
                className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-vien bg-nen/50"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-bold text-muc truncate">{cd}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {TRANG_THAI_CHUYEN_DE.map((tt) => (
                    <button
                      key={tt.ma}
                      type="button"
                      title={tt.nhan}
                      onClick={() => doiTrangThai(cd, tt.ma)}
                      className={gop(
                        "size-7 rounded-lg grid place-items-center text-[11px] font-bold transition-all",
                        hienTai === tt.ma
                          ? gop(TONE_NEN[tt.tone], TONE_CHU[tt.tone], "ring-2 ring-offset-1 ring-xanh")
                          : "bg-trang text-chu-phu hover:bg-vien/40"
                      )}
                    >
                      <tt.icon size={14} />
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-[12px] text-chu-phu">
          Mục chọn "Cần ôn gấp" sẽ tự động được ưu tiên đưa vào việc cần học trong tuần.
        </p>
      </section>
    </div>
  );
}

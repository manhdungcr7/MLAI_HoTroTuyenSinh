// Chế độ "Chiến lược & Lộ trình": Chẩn đoán năng lực học tập theo hàm độ khó cận biên, phân bổ giờ tự học thông minh và lộ trình tuyển sinh đa phương thức cá nhân hóa.
import { useState } from "react";
import { BookOpen, CheckCircle, Clock, Compass, Flame, HelpCircle, TrendingUp, WandSparkles, Zap } from "lucide-react";
import { Nhan, Nut, TONE_CHU, TONE_NEN, gop } from "@/components/ui/nut-the";
import { useApp } from "@/state/store";
import { mucTieuDayDu, khoangCachCuaToi, tuanHienTai } from "@/state/chon";
import { TEN_MON, TEN_MON_NGAN, type MonId, type ToneTen, type ViecCanHoc } from "@/state/types";
import { NOI_DUNG_ON } from "@/engine/tao-viec";
import { dinhDang } from "@/engine/dinh-dang";
import { toiUuPhanBoLichHoc } from "@/engine/toi-uu-lich-hoc";
import { diemDayDu } from "@/features/kham-pha/to-hop";
import { timLuaChon } from "@/data/lua-chon-that";

const TRANG_THAI_CHUYEN_DE = [
  { ma: "chuaHoc", nhan: "Chưa học", tone: "muc", icon: HelpCircle },
  { ma: "dangHoc", nhan: "Đang học", tone: "cam", icon: Clock },
  { ma: "namVung", nhan: "Nắm vững", tone: "luc", icon: CheckCircle },
  { ma: "canOnTap", nhan: "Cần ôn gấp", tone: "do", icon: Flame },
] as const;

export function CheDoChienLuoc({ hienThongBao }: { hienThongBao: (c: string) => void }) {
  const { s, capNhatHoSo, datViec, xepLai } = useApp();
  const m = mucTieuDayDu(s);
  const kc = khoangCachCuaToi(s);
  const toHop = m?.toHop ?? ["toan", "vatLy", "hoaHoc"];
  const [monChon, setMonChon] = useState<MonId>(toHop[0]);

  // Xác định năm thi dựa trên khối lớp thật của học sinh (11 thi 2027, 12 thi 2026)
  const khoiLop = s.hoSo.khoi ?? 12;
  const namThi = khoiLop === 11 ? 2027 : 2026;

  // Điểm mục tiêu của NV1 hoặc mục tiêu đã chọn
  const lcTarget = s.mucTieu?.luaChonId ? timLuaChon(s.mucTieu.luaChonId) : (s.nguyenVong[0] ? timLuaChon(s.nguyenVong[0]) : undefined);
  const diemChuanMucTieu = s.mucTieu?.diemMucTieu ?? (lcTarget?.diemMin ?? 26.0);
  const diemHienTai = diemDayDu(s);

  // Phân bổ giờ học toán học theo mô hình Knapsack
  const phanBo = toiUuPhanBoLichHoc(toHop, diemHienTai, diemChuanMucTieu, 0, 16);

  // Môn có độ bứt phá cao nhất (Leverage Subject)
  const monDonBay = [...phanBo.phanBoTungMon].sort((a, b) => b.diemCanTang - a.diemCanTang)[0];

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
      loiKhuyen: "Rà soát bẫy đề các Sở GD, rèn kỹ năng xử lý câu hỏi lạ và nâng độ chuẩn xác lên mức cao nhất.",
      tone: "tim",
    };
  } else if (diemTb >= 7.0) {
    tangNangLuc = {
      nhan: "Bứt phá & Tăng tốc",
      mucTieuNhan: "Ăn trọn 8,0+ điểm vận dụng",
      loiKhuyen: "Rèn phản xạ nhận diện dạng bài quen thuộc, bấm giờ luyện đề 50 phút và rèn kỹ năng bấm máy tính giải nhanh.",
      tone: "xanh",
    };
  }

  // Hành động thật: Áp dụng phân bổ thông minh vào lịch học tuần
  const apDungPhanBoVaoLich = () => {
    const tuan = tuanHienTai();
    const viecMoi: ViecCanHoc[] = phanBo.phanBoTungMon.flatMap((pb, i) => {
      const phutTong = Math.round(pb.soGioMoiTuan * 60 / 15) * 15;
      const phut1 = Math.min(90, Math.round(phutTong * 0.6 / 15) * 15);
      const phut2 = Math.max(30, phutTong - phut1);
      return [
        {
          id: `cd-${pb.mon}-${Date.now().toString(36)}-${i}a`,
          tuan,
          mon: pb.mon,
          tieuDe: `${pb.tenMon} – Chuyên đề bứt phá`,
          chiTiet: pb.trongTamOnTap,
          phut: phut1,
          mucUuTien: pb.diemCanTang >= 1.0 ? "cao" : "vua",
          lyDo: `Đòn bẩy điểm số (cần tăng +${pb.diemCanTang} điểm)`,
          tieuChi: ["Nắm vững dạng bài thường gặp", "Không để sai sót phần nhận biết & thông hiểu"],
          taiLieu: [{ ten: `Đề cương chuyên đề ${pb.tenMon}` }],
        },
        {
          id: `lt-${pb.mon}-${Date.now().toString(36)}-${i}b`,
          tuan,
          mon: pb.mon,
          tieuDe: `${pb.tenMon} – Luyện đề bấm giờ`,
          chiTiet: "Luyện đề thi thử có bấm giờ 50 phút, rèn kỹ năng giải nhanh",
          phut: phut2,
          mucUuTien: "vua",
          lyDo: "Rèn phản xạ và tốc độ làm đề chuẩn",
          tieuChi: ["Bấm giờ chuẩn thời gian thi", "Chữa kỹ các câu làm sai"],
          taiLieu: [{ ten: `Bộ đề thi thử chuẩn ${pb.tenMon}` }],
        },
      ];
    });

    const cacViecKhac = s.viec.filter((v) => v.tuan !== tuan);
    const tatCaViec = [...cacViecKhac, ...viecMoi];
    datViec(tatCaViec);
    xepLai(tuan, undefined, tatCaViec);
    hienThongBao(`Đã tạo ${viecMoi.length} nhiệm vụ và phân bổ đều vào lịch tự học tuần của bạn!`);
  };

  // Cập nhật trạng thái chuyên đề và tự động sinh việc học gấp
  const doiTrangThai = (tenChuyenDe: string, tt: "chuaHoc" | "dangHoc" | "namVung" | "canOnTap") => {
    const td = { ...(s.hoSo.tienDoKienThuc ?? {}) };
    td[tenChuyenDe] = tt;
    capNhatHoSo({ tienDoKienThuc: td });

    if (tt === "canOnTap") {
      const tuan = tuanHienTai();
      const viecGap: ViecCanHoc = {
        id: `gap-${Date.now().toString(36)}`,
        tuan,
        mon: monChon,
        tieuDe: `${TEN_MON[monChon]} – Ôn gấp: ${tenChuyenDe}`,
        chiTiet: `Chuyên đề ${tenChuyenDe} được bạn đánh dấu cần ôn gấp để bù lỗ hổng kiến thức`,
        phut: 60,
        mucUuTien: "cao",
        lyDo: "Chuyên đề cần ôn gấp",
        tieuChi: ["Xem lại phần lý thuyết SGK", "Làm tối thiểu 15 bài tập mẫu"],
        taiLieu: [{ ten: `Sổ tay kiến thức ${TEN_MON[monChon]}` }],
      };
      const tatCaViec = [viecGap, ...s.viec];
      datViec(tatCaViec);
      xepLai(tuan, undefined, tatCaViec);
      hienThongBao(`Đã xếp việc ôn gấp "${tenChuyenDe}" vào lịch tuần này!`);
    }
  };

  const tienDo = s.hoSo.tienDoKienThuc ?? {};
  const danhSachChuyenDe = NOI_DUNG_ON[monChon] ?? [];

  // Phân tích lợi thế đa phương thức
  const coChungChi = Boolean(s.hoSo.chungChiNgoaiNgu?.diem);
  const coDgnl = Boolean(s.hoSo.diemDgnl?.hcm || s.hoSo.diemDgnl?.hn);

  return (
    <div className="space-y-4">
      {/* Khối Chẩn đoán năng lực & Phân bổ Tự học Thông minh */}
      <section className="rounded-the border border-vien bg-trang p-4 shadow-the space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-[15px] font-extrabold text-muc">
            <Zap size={18} className="text-xanh" />
            Chẩn đoán năng lực & Phân bổ tự học
          </span>
          <Nhan tone={tangNangLuc.tone}>{tangNangLuc.nhan}</Nhan>
        </div>

        <div className="rounded-xl bg-nen p-3 space-y-1.5">
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-chu font-semibold">Trọng tâm: <b className="text-muc">{tangNangLuc.mucTieuNhan}</b></span>
            <span className="text-chu-phu text-[12px]">Điểm TB: {dinhDang(diemTb, 1)}</span>
          </div>
          <p className="text-[13px] text-chu leading-snug">{tangNangLuc.loiKhuyen}</p>
          {monDonBay && phanBo.khoangCachGap > 0 && (
            <div className="flex items-start gap-1.5 pt-1 text-[12.5px] text-cam-chu font-semibold">
              <TrendingUp size={15} className="shrink-0 mt-0.5" />
              <span>
                <b>Môn đòn bẩy:</b> {monDonBay.tenMon} (cần kéo thêm +{monDonBay.diemCanTang} điểm để chạm tới mốc {phanBo.diemMucTieuTong} của Nguyện Vọng 1).
              </span>
            </div>
          )}
        </div>

        {/* Bảng phân bổ quỹ giờ tự học hàng tuần theo bài toán Knapsack */}
        <div>
          <div className="flex items-center justify-between text-[12.5px] text-chu-phu mb-1.5">
            <span className="font-bold text-muc">Phân bổ 16 giờ tự học tuần theo độ dốc điểm số:</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {phanBo.phanBoTungMon.map((pb) => (
              <div key={pb.mon} className="rounded-xl border border-vien p-2.5 text-center bg-trang space-y-1">
                <span className="block text-[12px] font-bold text-chu truncate">{TEN_MON_NGAN[pb.mon]}</span>
                <b className="block text-[17px] font-black text-muc leading-none">{dinhDang(pb.diemHienTai, 1)}</b>
                <span className={gop("block text-[11px] font-bold", pb.diemCanTang > 0 ? "text-cam-chu" : "text-luc-chu")}>
                  {pb.diemCanTang > 0 ? `+${dinhDang(pb.diemCanTang, 1)} điểm` : "Đã đạt mốc"}
                </span>
                <div className="pt-1 border-t border-vien/70 text-[11px] text-chu-phu">
                  <span className="block font-bold text-xanh">{pb.soGioMoiTuan}h/tuần</span>
                  <span className="block text-[10px] opacity-75">{pb.tiLePhanBo}% quỹ giờ</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Nút hành động áp dụng phân bổ vào lịch học thật */}
        <div className="pt-1">
          <Nut
            bieuTuong={WandSparkles}
            onClick={apDungPhanBoVaoLich}
            className="w-full !py-2.5 text-[13.5px] shadow-sm"
          >
            Áp dụng phân bổ thông minh vào Lịch tuần
          </Nut>
        </div>
      </section>

      {/* Lộ trình Tuyển sinh Đa phương thức Cá nhân hóa */}
      <section className="rounded-the border border-vien bg-trang p-4 shadow-the space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-[15px] font-extrabold text-muc">
            <Compass size={18} className="text-xanh" />
            Lộ trình tuyển sinh đa phương thức {namThi}
          </h3>
          <span className="text-[12px] text-chu-phu font-bold">Lớp {khoiLop}</span>
        </div>

        <div className="space-y-3">
          {/* Mốc 1: Xét tuyển sớm & ĐGNL */}
          <div className="rounded-xl border border-xanh/30 bg-xanh-nhat/20 p-3 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <b className="text-[14px] text-muc">Mốc 1 · Kỳ thi ĐGNL & Xét tuyển sớm</b>
              <Nhan tone="xanh" className="text-[11px] py-0 px-1.5">Tháng 1 – Tháng 4</Nhan>
            </div>
            <p className="text-[12.5px] text-chu leading-snug">
              {coDgnl
                ? `Hồ sơ của bạn đã có điểm ĐGNL. Đây là lợi thế lớn: hãy dùng điểm này để nộp xét tuyển sớm vào các trường lớn nhằm cầm chắc một bến đỗ vững vàng.`
                : "Đăng ký thi ĐGNL ĐHQG-HCM đợt 1 hoặc HSA Hà Nội / TSA Bách Khoa. Kỳ thi này mở rộng thêm 40–60% chỉ tiêu cho các khối ngành kỹ thuật, kinh tế."}
            </p>
          </div>

          {/* Mốc 2: Chứng chỉ ngoại ngữ & Học bạ */}
          <div className="rounded-xl border border-cam/30 bg-cam-nhat/20 p-3 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <b className="text-[14px] text-muc">Mốc 2 · Ngoại ngữ & Học bạ kết hợp</b>
              <Nhan tone="cam" className="text-[11px] py-0 px-1.5">Tháng 4 – Tháng 5</Nhan>
            </div>
            <p className="text-[12.5px] text-chu leading-snug">
              {coChungChi
                ? `Bạn đã có ${s.hoSo.chungChiNgoaiNgu?.loai} ${s.hoSo.chungChiNgoaiNgu?.diem}: Bạn đủ điều kiện quy đổi điểm 10 Ngoại ngữ hoặc cộng 1–2 điểm kết hợp ở hầu hết các trường Top đầu.`
                : "Nếu chưa có chứng chỉ quốc tế, hãy tập trung tối đa kéo điểm môn tiếng Anh trong tổ hợp thi tốt nghiệp THPT để tối đa hóa tổng điểm 3 môn."}
            </p>
          </div>

          {/* Mốc 3: Nước rút Tốt nghiệp THPT */}
          <div className="rounded-xl border border-luc/30 bg-luc-nhat/20 p-3 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <b className="text-[14px] text-muc">Mốc 3 · Nước rút Tốt nghiệp THPT</b>
              <Nhan tone="luc" className="text-[11px] py-0 px-1.5">Tháng 5 – Tháng 6</Nhan>
            </div>
            <p className="text-[12.5px] text-chu leading-snug">
              Bấm giờ luyện đề chuẩn 50 phút các đề thi thử mới nhất. Tập trung cao độ cho môn đòn bẩy ({monDonBay?.tenMon ?? "môn chính"}) để san bằng phần điểm còn thiếu.
            </p>
          </div>
        </div>
      </section>

      {/* Bảng Check-in Tiến độ Chuyên đề */}
      <section className="rounded-the border border-vien bg-trang p-4 shadow-the">
        <div className="flex items-center justify-between gap-2 mb-2">
          <h3 className="flex items-center gap-2 text-[15px] font-extrabold text-muc">
            <BookOpen size={18} className="text-xanh" />
            Tiến độ chuyên đề theo môn
          </h3>
          <span className="text-[12px] text-chu-phu">Chạm để cập nhật</span>
        </div>

        {/* Tab chọn môn */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 mb-3 scrollbar-none">
          {toHop.map((mon) => (
            <button
              key={mon}
              type="button"
              onClick={() => setMonChon(mon)}
              className={gop(
                "px-3 py-1.5 rounded-xl text-[13px] font-bold shrink-0 transition-colors cursor-pointer",
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
                  <p className="text-[13.5px] font-bold text-muc truncate">{cd}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {TRANG_THAI_CHUYEN_DE.map((tt) => (
                    <button
                      key={tt.ma}
                      type="button"
                      title={tt.nhan}
                      onClick={() => doiTrangThai(cd, tt.ma)}
                      className={gop(
                        "size-7 rounded-lg grid place-items-center text-[11px] font-bold transition-all cursor-pointer",
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
      </section>
    </div>
  );
}

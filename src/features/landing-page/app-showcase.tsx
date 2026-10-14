import {
  Bell,
  BookOpen,
  CalendarDays,
  Clock,
  Flame,
  GraduationCap,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  User,
  Zap,
} from "lucide-react";

/**
 * Mockup giao diện ứng dụng thực tế của Nguyện Vọng AI
 * Hiển thị chính xác các màn hình: Hôm nay, Nguyện vọng, Khám phá, Kế hoạch tuần, Hồ sơ
 */
export function HeroAppMockup() {
  return (
    <div className="relative w-full max-w-[420px] mx-auto flex items-center justify-center py-4 pointer-events-auto">
      {/* Vòng hào quang gradient phía sau điện thoại (Ambient glow) */}
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 via-indigo-500/15 to-purple-500/10 rounded-full blur-3xl -z-10 pointer-events-none scale-90" />

      {/* Floating badge 1 (Góc trên bên phải) */}
      <div className="hidden sm:flex absolute -top-1 -right-4 lg:-right-6 bg-white/95 backdrop-blur-md border border-blue-200/80 shadow-xl rounded-2xl p-2.5 items-center gap-2.5 z-20 hover:scale-105 transition-transform duration-200">
        <div className="w-8 h-8 rounded-xl bg-blue-600 text-white grid place-items-center font-extrabold text-[11px] shadow-sm">
          100%
        </div>
        <div className="text-left">
          <b className="text-[12px] font-extrabold text-slate-900 block leading-tight">Dữ liệu chuẩn quốc gia</b>
          <span className="text-[10px] text-slate-500 font-medium">3.652 ngành · 118 trường ĐH</span>
        </div>
      </div>

      {/* Khung điện thoại thông minh chính (Mobile Phone Mockup) */}
      <div className="relative w-[310px] sm:w-[325px] rounded-[36px] bg-slate-900 p-2.5 shadow-2xl ring-1 ring-slate-800/80">
        {/* Dynamic Island */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-3 bg-slate-950 rounded-full z-20 flex items-center justify-end px-2">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-900/40 inline-block" />
        </div>

        {/* Màn hình điện thoại */}
        <div className="relative w-full rounded-[28px] bg-[#f8fafd] overflow-hidden border border-slate-200 text-slate-800 select-none text-left">
          {/* Thanh trạng thái */}
          <div className="flex justify-between items-center px-5 pt-2 pb-1 text-[10px] font-semibold text-slate-500">
            <span>9:41</span>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span>5G</span>
            </div>
          </div>

          {/* Header Ứng Dụng */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-white border-b border-slate-100">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-[11px] shadow-sm">
                NV
              </div>
              <div>
                <h4 className="text-[12px] font-extrabold text-slate-900 leading-none">Nguyện Vọng AI</h4>
                <span className="text-[9px] text-slate-500 font-medium">Hồ sơ: Minh Anh</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200/60">
              A00: 24,5đ
            </span>
          </div>

          {/* Nội dung màn hình Hôm nay */}
          <div className="p-2.5 space-y-2 text-[11px]">
            {/* Thẻ Mục tiêu NV1 */}
            <div className="rounded-xl bg-white border border-slate-200 p-2.5 shadow-sm">
              <div className="flex items-center justify-between text-[10px] mb-1">
                <span className="font-bold text-blue-700 flex items-center gap-1">
                  <Target size={12} className="text-blue-600" /> Mục tiêu NV1
                </span>
                <span className="px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-700 font-bold text-[9px] border border-rose-200/60">
                  Thiếu 2,0 điểm
                </span>
              </div>
              <div className="font-extrabold text-[12px] text-slate-900 leading-tight">
                Khoa học máy tính (IT1)
              </div>
              <div className="text-[10px] text-slate-500 font-medium">
                ĐH Bách Khoa Hà Nội · A00
              </div>

              <div className="mt-1.5 pt-1.5 border-t border-slate-100 grid grid-cols-3 text-center divide-x divide-slate-100">
                <div>
                  <span className="text-[9px] text-slate-400 block">Hiện tại</span>
                  <b className="text-[13px] text-blue-600">24,50</b>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block">Điểm chuẩn</span>
                  <b className="text-[13px] text-slate-900">26,50</b>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block">Học phí</span>
                  <b className="text-[12px] text-amber-600">35 tr/n</b>
                </div>
              </div>
            </div>

            {/* Thẻ Quyết định AI - Môn kéo điểm */}
            <div className="rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 p-2">
              <div className="flex items-center gap-1 text-blue-900 font-bold text-[10px] mb-1">
                <Zap size={11} className="text-amber-500 fill-amber-500" />
                <span>Đề xuất bù 2,0đ tối ưu công sức</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="flex-1 rounded-lg bg-white/90 border border-blue-200 px-1.5 py-0.5 text-center">
                  <span className="text-[9px] text-slate-500 block font-medium">Toán</span>
                  <b className="text-[12px] text-blue-700">+1,0 đ</b>
                </div>
                <div className="flex-1 rounded-lg bg-white/90 border border-blue-200 px-1.5 py-0.5 text-center">
                  <span className="text-[9px] text-slate-500 block font-medium">Tiếng Anh</span>
                  <b className="text-[12px] text-indigo-700">+1,0 đ</b>
                </div>
              </div>
            </div>

            {/* Danh sách 3 tầng nguyện vọng */}
            <div className="rounded-xl bg-white border border-slate-200 p-2 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-800">
                <span>Chiến lược nguyện vọng</span>
                <span className="text-emerald-700 font-bold flex items-center gap-0.5 text-[9px]">
                  <ShieldCheck size={11} /> Cân bằng an toàn
                </span>
              </div>

              <div className="space-y-1">
                {[
                  { nv: "NV1", nganh: "KH Máy tính", truong: "ĐH Bách Khoa HN", nhan: "Thử sức", mau: "bg-rose-50 text-rose-700 border-rose-200" },
                  { nv: "NV2", nganh: "CN Thông tin", truong: "ĐH Công nghệ QGHN", nhan: "Vừa sức", mau: "bg-blue-50 text-blue-700 border-blue-200" },
                  { nv: "NV3", nganh: "CN Thông tin", truong: "Học viện CNBCVT", nhan: "Vừa sức", mau: "bg-blue-50 text-blue-700 border-blue-200" },
                  { nv: "NV4", nganh: "HT Thông tin", truong: "ĐH Kinh tế Quốc dân", nhan: "An toàn", mau: "bg-emerald-50 text-emerald-700 border-emerald-200" },
                ].map((row) => (
                  <div key={row.nv} className="flex items-center justify-between p-1 rounded-lg bg-slate-50 border border-slate-100 text-[10px]">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-extrabold text-blue-600 text-[9px]">{row.nv}</span>
                      <div className="truncate">
                        <b className="text-slate-800 block leading-none truncate">{row.nganh}</b>
                        <span className="text-[8px] text-slate-400 block truncate">{row.truong}</span>
                      </div>
                    </div>
                    <span className={`px-1 py-0.5 rounded text-[8px] font-bold border shrink-0 ${row.mau}`}>
                      {row.nhan}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Thanh Bottom Tabs 5 mục */}
          <div className="grid grid-cols-5 border-t border-slate-200 bg-white py-1.5 px-1 text-center text-[9px]">
            <div className="text-blue-600 flex flex-col items-center font-bold">
              <BookOpen size={14} />
              <span>Hôm nay</span>
            </div>
            <div className="text-slate-400 flex flex-col items-center font-medium">
              <Search size={14} />
              <span>Khám phá</span>
            </div>
            <div className="text-slate-400 flex flex-col items-center font-medium">
              <GraduationCap size={14} />
              <span>Nguyện vọng</span>
            </div>
            <div className="text-slate-400 flex flex-col items-center font-medium">
              <CalendarDays size={14} />
              <span>Kế hoạch</span>
            </div>
            <div className="text-slate-400 flex flex-col items-center font-medium">
              <User size={14} />
              <span>Hồ sơ</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating badge 2 (Góc dưới bên trái) */}
      <div className="hidden sm:flex absolute -bottom-2 -left-4 lg:-left-6 bg-white/95 backdrop-blur-md border border-emerald-200/80 shadow-xl rounded-2xl p-2.5 items-center gap-2.5 z-20 hover:scale-105 transition-transform duration-200">
        <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white grid place-items-center font-bold text-xs shadow-sm">
          <Clock size={16} />
        </div>
        <div className="text-left">
          <b className="text-[12px] font-extrabold text-slate-900 block leading-tight">Lịch tự học Pomodoro</b>
          <span className="text-[10px] text-emerald-700 font-semibold">Tự động xếp khung giờ trống</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Preview Hồ sơ cá nhân hóa 4 bước
 */
export function ProfileAppMockup() {
  return (
    <div className="w-full max-w-[620px] mx-auto rounded-3xl bg-white border border-slate-200 p-5 shadow-xl text-left select-none">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-xl bg-blue-100 text-blue-700 grid place-items-center font-bold">
            <User size={18} />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-slate-900">Hồ sơ tuyển sinh toàn diện</h4>
            <span className="text-xs text-slate-500">Tích hợp đa nguồn dữ liệu của bạn</span>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
          Đầy đủ 100%
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 text-center">
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
          <span className="text-[11px] text-slate-500 block">Tổ hợp mạnh</span>
          <b className="text-base text-blue-600 font-extrabold">A00 & A01</b>
        </div>
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
          <span className="text-[11px] text-slate-500 block">Điểm thi thử</span>
          <b className="text-base text-slate-900 font-extrabold">24,50 điểm</b>
        </div>
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
          <span className="text-[11px] text-slate-500 block">Chứng chỉ</span>
          <b className="text-base text-indigo-600 font-extrabold">IELTS 6.5</b>
        </div>
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
          <span className="text-[11px] text-slate-500 block">Ưu tiên KV</span>
          <b className="text-base text-emerald-600 font-extrabold">+0,75 điểm</b>
        </div>
      </div>

      <div className="mt-4 p-3 rounded-2xl bg-blue-50/60 border border-blue-100 text-xs text-slate-700 space-y-1">
        <div className="font-bold text-blue-900 flex items-center gap-1.5">
          <Sparkles size={14} className="text-blue-600" /> Điểm mạnh & Định hướng RIASEC
        </div>
        <p className="text-slate-600">
          Nhóm nổi bật: <b>Nghiên cứu (Investigative)</b> & <b>Kỹ thuật (Realistic)</b> — rất phù hợp với các ngành Công nghệ thông tin, Khoa học máy tính, Kỹ thuật phần mềm và Vi mạch bán dẫn.
        </p>
      </div>
    </div>
  );
}

/**
 * Preview Kế hoạch học tập tuần
 */
export function PlanAppMockup() {
  return (
    <div className="w-full max-w-[620px] mx-auto rounded-3xl bg-white border border-slate-200 p-5 shadow-xl text-left select-none">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-xl bg-indigo-100 text-indigo-700 grid place-items-center font-bold">
            <CalendarDays size={18} />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-slate-900">Kế hoạch tuần tự động</h4>
            <span className="text-xs text-slate-500">Xếp việc theo khung giờ tự học còn trống</span>
          </div>
        </div>
        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
          Tuần 12
        </span>
      </div>

      <div className="mt-3 space-y-2">
        {[
          { thu: "Thứ 2", gio: "19:30 – 20:15", mon: "Toán", bai: "Luyện đề đạo hàm và tích phân", phut: "45p", xong: true },
          { thu: "Thứ 4", gio: "20:00 – 20:45", mon: "Tiếng Anh", bai: "Hoàn thiện 25 câu trắc nghiệm từ vựng", phut: "45p", xong: true },
          { thu: "Thứ 6", gio: "19:30 – 20:15", mon: "Toán", bai: "Ôn tập chuyên đề hình học không gian", phut: "45p", xong: false },
          { thu: "Chủ nhật", gio: "14:30 – 16:00", mon: "Thi thử", bai: "Thi thử đề chuẩn cấu trúc Bộ GD&ĐT", phut: "90p", xong: false },
        ].map((v, i) => (
          <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
            <div className="flex items-center gap-2.5">
              <span className={`w-5 h-5 rounded-full grid place-items-center text-white text-[10px] ${v.xong ? "bg-emerald-500" : "bg-slate-300"}`}>
                {v.xong ? "✓" : i + 1}
              </span>
              <div>
                <b className="text-slate-900 block leading-tight">{v.mon}: {v.bai}</b>
                <span className="text-[11px] text-slate-500">{v.thu} · {v.gio} ({v.phut})</span>
              </div>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${v.xong ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
              {v.xong ? "Đã học" : "Chờ học"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Preview Tiến độ học tập & Thông báo tuyển sinh hằng ngày (Daily)
 */
export function DailyAppMockup() {
  return (
    <div className="w-full max-w-[620px] mx-auto rounded-3xl bg-white border border-slate-200 p-5 shadow-xl text-left select-none">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-xl bg-amber-100 text-amber-700 grid place-items-center font-bold">
            <Flame size={18} />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-slate-900">Tiến độ hôm nay & Chuỗi giữ nhịp</h4>
            <span className="text-xs text-slate-500">Đồng hành mỗi ngày cùng kỳ thi tốt nghiệp THPT</span>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200 flex items-center gap-1">
          <Flame size={13} className="fill-amber-500 text-amber-500" /> Chuỗi 6 ngày
        </span>
      </div>

      {/* Thẻ thống kê nhịp học */}
      <div className="grid grid-cols-3 gap-2 mt-3 text-center">
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
          <span className="text-[10px] text-slate-500 block">Tuần này</span>
          <b className="text-[13px] text-slate-800">18 giờ tự học</b>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
          <span className="text-[10px] text-slate-500 block">Số phiên xong</span>
          <b className="text-[13px] text-blue-600">8/12 phiên</b>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
          <span className="text-[10px] text-slate-500 block">Điểm kéo dự kiến</span>
          <b className="text-[13px] text-emerald-600">+1,5 điểm</b>
        </div>
      </div>

      {/* Thông báo nhắc việc thông minh */}
      <div className="mt-3 p-3 rounded-2xl bg-blue-50/70 border border-blue-200/70">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="font-bold text-blue-900 flex items-center gap-1.5">
            <Bell size={13} className="text-blue-600" /> Nhắc nhở buổi học tối nay
          </span>
          <span className="text-[10px] text-blue-700 font-semibold">19:30 – 20:15</span>
        </div>
        <p className="text-xs text-slate-700">
          <b>Toán:</b> Chuyên đề Hàm số bậc 3 & Cực trị. Chuẩn bị sẵn phiếu bài tập trước 10 phút để vào guồng học tập hiệu quả.
        </p>
      </div>

      {/* Cập nhật tuyển sinh chính thức mới nhất */}
      <div className="mt-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs">
        <div className="flex items-center gap-1.5 text-slate-900 font-bold mb-1">
          <ShieldCheck size={14} className="text-emerald-600" /> Cập nhật Đề án tuyển sinh mới nhất
        </div>
        <p className="text-slate-600 text-[11px] leading-relaxed">
          ĐH Bách Khoa Hà Nội & ĐH Quốc gia Hà Nội đã công bố phân bổ chỉ tiêu 2025. Hệ thống đã tự động đối chiếu và cập nhật ngưỡng điểm tham chiếu trong hồ sơ của bạn.
        </p>
      </div>
    </div>
  );
}



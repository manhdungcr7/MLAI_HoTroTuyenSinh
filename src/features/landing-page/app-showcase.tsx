import {
  Bell,
  BookOpen,
  CalendarDays,
  Clock,
  Compass,
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
    <div className="w-full flex items-center justify-center p-2 lg:p-4 pointer-events-auto">
      <div className="relative w-full max-w-[780px] grid grid-cols-1 lg:grid-cols-[330px_1fr] gap-4 items-center">
        {/* Khung điện thoại thông minh chính (Mobile Phone Mockup) */}
        <div className="relative mx-auto w-[320px] sm:w-[330px] rounded-[38px] bg-slate-900 p-3 shadow-2xl ring-1 ring-slate-800">
          {/* Dynamic Island / Notch */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-4 bg-slate-950 rounded-full z-20" />

          {/* Màn hình điện thoại */}
          <div className="relative w-full rounded-[30px] bg-[#f8fafd] overflow-hidden border border-slate-200 text-slate-800 select-none text-left">
            {/* Thanh trạng thái */}
            <div className="flex justify-between items-center px-6 pt-3 pb-1 text-[11px] font-semibold text-slate-500">
              <span>9:41</span>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                <span>5G</span>
              </div>
            </div>

            {/* Header Ứng Dụng */}
            <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-xs shadow-sm">
                  NV
                </div>
                <div>
                  <h4 className="text-[13px] font-extrabold text-slate-900 leading-none">Nguyện Vọng AI</h4>
                  <span className="text-[10px] text-slate-500 font-medium">Hồ sơ: Minh Anh</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200/60">
                A00: 24,5đ
              </span>
            </div>

            {/* Nội dung màn hình Hôm nay */}
            <div className="p-3 space-y-2.5 max-h-[460px] overflow-hidden text-[12px]">
              {/* Thẻ Mục tiêu NV1 */}
              <div className="rounded-2xl bg-white border border-slate-200 p-3 shadow-sm">
                <div className="flex items-center justify-between text-[11px] mb-1.5">
                  <span className="font-bold text-blue-700 flex items-center gap-1">
                    <Target size={13} className="text-blue-600" /> Mục tiêu NV1
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-bold text-[10px] border border-rose-200/60">
                    Thiếu 2,0 điểm
                  </span>
                </div>
                <div className="font-extrabold text-[13px] text-slate-900 leading-snug">
                  Khoa học máy tính (IT1)
                </div>
                <div className="text-[11px] text-slate-600 font-medium">
                  ĐH Bách Khoa Hà Nội · Tổ hợp A00
                </div>

                <div className="mt-2 pt-2 border-t border-slate-100 grid grid-cols-3 text-center divide-x divide-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Hiện tại</span>
                    <b className="text-[14px] text-blue-600">24,50</b>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Điểm chuẩn</span>
                    <b className="text-[14px] text-slate-900">26,50</b>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Học phí</span>
                    <b className="text-[13px] text-amber-600">35 tr/n</b>
                  </div>
                </div>
              </div>

              {/* Thẻ Quyết định AI - Môn kéo điểm */}
              <div className="rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 p-2.5">
                <div className="flex items-center gap-1.5 text-blue-900 font-bold text-[11px] mb-1">
                  <Zap size={13} className="text-amber-500 fill-amber-500" />
                  <span>Đề xuất bù 2,0 điểm tối ưu công sức</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 rounded-xl bg-white/90 border border-blue-200 px-2 py-1 text-center">
                    <span className="text-[10px] text-slate-500 block font-semibold">Toán</span>
                    <b className="text-[13px] text-blue-700">+1,0 đ</b>
                  </div>
                  <div className="flex-1 rounded-xl bg-white/90 border border-blue-200 px-2 py-1 text-center">
                    <span className="text-[10px] text-slate-500 block font-semibold">Tiếng Anh</span>
                    <b className="text-[13px] text-indigo-700">+1,0 đ</b>
                  </div>
                </div>
              </div>

              {/* Danh sách 3 tầng nguyện vọng */}
              <div className="rounded-2xl bg-white border border-slate-200 p-2.5 shadow-sm space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-900">
                  <span>Chiến lược 5 nguyện vọng</span>
                  <span className="text-emerald-700 font-bold flex items-center gap-0.5 text-[10px]">
                    <ShieldCheck size={12} /> Cân bằng an toàn
                  </span>
                </div>

                <div className="space-y-1">
                  {[
                    { nv: "NV1", nganh: "Khoa học máy tính", truong: "ĐH Bách Khoa HN", diem: "26,5", nhan: "Thử sức", mau: "bg-rose-50 text-rose-700 border-rose-200" },
                    { nv: "NV2", nganh: "Công nghệ thông tin", truong: "ĐH Công nghệ QGHN", diem: "25,5", nhan: "Vừa sức", mau: "bg-blue-50 text-blue-700 border-blue-200" },
                    { nv: "NV3", nganh: "Công nghệ thông tin", truong: "Học viện CNBCVT", diem: "24,5", nhan: "Vừa sức", mau: "bg-blue-50 text-blue-700 border-blue-200" },
                    { nv: "NV4", nganh: "Hệ thống thông tin", truong: "ĐH Kinh tế Quốc dân", diem: "23,5", nhan: "An toàn", mau: "bg-emerald-50 text-emerald-700 border-emerald-200" },
                  ].map((row) => (
                    <div key={row.nv} className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 border border-slate-100 text-[11px]">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-extrabold text-blue-600 text-[10px]">{row.nv}</span>
                        <div className="truncate">
                          <b className="text-slate-800 block leading-tight truncate">{row.nganh}</b>
                          <span className="text-[9px] text-slate-500 block truncate">{row.truong}</span>
                        </div>
                      </div>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border shrink-0 ${row.mau}`}>
                        {row.nhan}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Thanh Bottom Tabs 5 mục */}
            <div className="grid grid-cols-5 border-t border-slate-200 bg-white py-1.5 px-1 text-center text-[10px]">
              <div className="text-blue-600 flex flex-col items-center font-bold">
                <BookOpen size={16} />
                <span>Hôm nay</span>
              </div>
              <div className="text-slate-400 flex flex-col items-center font-medium">
                <Search size={16} />
                <span>Khám phá</span>
              </div>
              <div className="text-slate-400 flex flex-col items-center font-medium">
                <GraduationCap size={16} />
                <span>Nguyện vọng</span>
              </div>
              <div className="text-slate-400 flex flex-col items-center font-medium">
                <CalendarDays size={16} />
                <span>Kế hoạch</span>
              </div>
              <div className="text-slate-400 flex flex-col items-center font-medium">
                <User size={16} />
                <span>Hồ sơ</span>
              </div>
            </div>
          </div>
        </div>

        {/* Khung phụ bên cạnh: Trực quan hóa dữ liệu tuyển sinh & Lịch học */}
        <div className="hidden lg:flex flex-col gap-3 text-left">
          {/* Box 1: Khám phá 3.652 ngành với dữ liệu số thực */}
          <div className="rounded-3xl bg-white border border-slate-200 p-4 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold flex items-center gap-1.5">
                <Compass size={14} /> Dữ liệu chuẩn quốc gia
              </span>
              <span className="text-xs text-slate-500 font-semibold">100% đối soát Đề án</span>
            </div>
            <h3 className="font-extrabold text-slate-900 text-base leading-tight">
              3.652 chương trình đào tạo · 118 trường đại học
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Điểm chuẩn 3 năm liên tiếp, học phí chi tiết theo năm học, tỷ lệ sinh viên có việc làm sau tốt nghiệp có trích dẫn số trang file PDF chính thức.
            </p>

            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100">
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <b className="text-base text-blue-600 font-extrabold block">100%</b>
                <span className="text-[11px] text-slate-600 font-medium">Có học phí thực</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <b className="text-base text-emerald-600 font-extrabold block">100%</b>
                <span className="text-[11px] text-slate-600 font-medium">Có tỷ lệ việc làm</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <b className="text-base text-purple-600 font-extrabold block">0 ảo giác</b>
                <span className="text-[11px] text-slate-600 font-medium">Không nhầm điểm sàn</span>
              </div>
            </div>
          </div>

          {/* Box 2: Tự động lên lịch học Pomodoro */}
          <div className="rounded-3xl bg-white border border-slate-200 p-4 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
                <Clock size={14} /> Lịch tự học tuần này
              </span>
              <span className="text-xs text-emerald-700 font-bold">6/10 phiên (60%)</span>
            </div>
            <div className="space-y-2 mt-2">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <b className="text-slate-800 block">Tối Thứ 4 · 19:30 – 20:15 (45 phút)</b>
                  <span className="text-slate-500 text-[11px]">Toán: Chuyên đề Cực trị hàm số</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                  Đã xong
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/80 flex items-center justify-between text-xs">
                <div>
                  <b className="text-blue-900 block">Tối Nay · 20:30 – 21:15 (45 phút)</b>
                  <span className="text-slate-600 text-[11px]">Tiếng Anh: 20 câu đọc hiểu ngữ cảnh</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-bold text-[10px]">
                  Sắp diễn ra
                </span>
              </div>
            </div>
          </div>
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


import React from "react";
import { User, ChevronDown, Award } from "lucide-react";
import { useDecision } from "@/state/DecisionContext";
import { PriorityArea, PriorityObject } from "@/engine/types";

export function BasicInfoCard() {
  const { profile, updateProfile } = useDecision();

  // Giá trị mẫu chỉ là placeholder, không hiển thị như dữ liệu đã nhập
  const fullName = profile.name || "";
  const grade = profile.grade || "";
  const graduationYear = profile.graduationYear ?? "";
  const homeProvince = profile.homeProvince || "";
  const highSchool = profile.highSchool || "";
  const priorityArea: PriorityArea = profile.priority?.area || "KV3";
  const priorityObject: PriorityObject = profile.priority?.object || "none";

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateProfile({ name: e.target.value });
  };

  const handleGradeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateProfile({ grade: e.target.value });
  };

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    updateProfile({
      homeProvince: val,
      priority: {
        ...profile.priority,
        area: profile.priority?.area || (val.includes("Hà Nội") || val === "TP.HCM" ? "KV3" : "KV2"),
      },
    });
  };

  const handleAreaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateProfile({
      priority: {
        ...profile.priority,
        area: e.target.value as PriorityArea,
      },
    });
  };

  const handleObjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateProfile({
      priority: {
        ...profile.priority,
        object: e.target.value as PriorityObject,
      },
    });
  };

  const handleHighSchoolChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    updateProfile({ highSchool: e.target.value });
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between transition-all h-full">
      {/* CARD HEADER */}
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <User className="h-5 w-5 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#0F172A] tracking-tight text-pretty">
              Thông tin cơ bản
            </h3>
            <p className="text-xs text-slate-500 text-pretty">
              Những thông tin nền tảng về bạn
            </p>
          </div>
        </div>

        {/* MAIN BODY: AVATAR + FORM */}
        <div className="mt-5 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* AVATAR COLUMN */}
          <div className="flex flex-col items-center shrink-0">
            <div className="relative group">
              {/* ILLUSTRATION AVATAR */}
              <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-full border-2 border-blue-100 bg-gradient-to-b from-blue-100 to-indigo-100 p-1 shadow-2xs overflow-hidden flex items-center justify-center">
                <svg
                  viewBox="0 0 120 120"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-full h-full object-cover"
                >
                  <circle cx="60" cy="60" r="58" fill="#DBEAFE" />
                  {/* Body / Shirt */}
                  <path
                    d="M20 115C20 95 38 82 60 82C82 82 100 95 100 115"
                    fill="#1E293B"
                  />
                  {/* Hoodie collar */}
                  <path
                    d="M40 85L60 102L80 85"
                    stroke="#2563EB"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                  {/* White inner shirt collar */}
                  <path
                    d="M52 86L60 94L68 86"
                    fill="#FFFFFF"
                  />
                  {/* Neck */}
                  <path
                    d="M50 68V80C50 85.5 54.5 90 60 90C65.5 90 70 85.5 70 80V68"
                    fill="#FBCFE8"
                  />
                  {/* Face */}
                  <ellipse cx="60" cy="58" rx="22" ry="24" fill="#FED7AA" />
                  {/* Hair */}
                  <path
                    d="M38 52C36 38 48 30 60 30C72 30 84 38 82 52C78 46 72 45 68 45C62 45 58 48 55 48C50 48 44 46 38 52Z"
                    fill="#0F172A"
                  />
                  {/* Bangs */}
                  <path
                    d="M42 42C48 46 54 44 58 41C64 45 72 44 78 43C75 36 68 32 60 32C52 32 45 36 42 42Z"
                    fill="#0F172A"
                  />
                  {/* Eyes */}
                  <ellipse cx="51" cy="56" rx="2.5" ry="3.5" fill="#0F172A" />
                  <ellipse cx="69" cy="56" rx="2.5" ry="3.5" fill="#0F172A" />
                  <circle cx="52" cy="54.5" r="1" fill="#FFFFFF" />
                  <circle cx="70" cy="54.5" r="1" fill="#FFFFFF" />
                  {/* Smile */}
                  <path
                    d="M54 67C57 70 63 70 66 67"
                    stroke="#0F172A"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  {/* Cheeks blush */}
                  <circle cx="45" cy="62" r="3" fill="#FCA5A5" opacity="0.6" />
                  <circle cx="75" cy="62" r="3" fill="#FCA5A5" opacity="0.6" />
                </svg>
              </div>

            </div>
          </div>

          {/* FORM INPUTS */}
          <div className="flex-1 w-full space-y-3.5">
            {/* ROW 1: HỌ TÊN + LỚP */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Họ và tên
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={handleNameChange}
                  placeholder="Nhập họ và tên..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#0F172A] focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lớp
                </label>
                <input
                  type="text"
                  value={grade}
                  onChange={handleGradeChange}
                  placeholder="VD: 12A1"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#0F172A] focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Năm thi tốt nghiệp</label>
                <div className="relative">
                  <select
                    value={graduationYear}
                    onChange={(e) => updateProfile({ graduationYear: e.target.value ? Number(e.target.value) : null })}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 pr-9 text-xs sm:text-sm font-semibold text-[#0F172A] focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition cursor-pointer"
                  >
                    <option value="">Chưa xác định</option>
                    {[2024, 2025, 2026, 2027, 2028, 2029].map((year) => <option key={year} value={year}>{year}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
              </div>
            </div>

            {/* ROW 2: KHU VỰC + TRƯỜNG THPT */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Khu vực
                </label>
                <div className="relative">
                  <select
                    value={homeProvince}
                    onChange={handleProvinceChange}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 pr-9 text-xs sm:text-sm font-semibold text-[#0F172A] focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition cursor-pointer"
                  >
                    <option value="" disabled>Chọn tỉnh/thành</option>
                    <option value="Hà Nội">Hà Nội</option>
                    <option value="TP.HCM">TP. Hồ Chí Minh</option>
                    <option value="Đà Nẵng">Đà Nẵng</option>
                    <option value="Hải Phòng">Hải Phòng</option>
                    <option value="Cần Thơ">Cần Thơ</option>
                    <option value="Nghệ An">Nghệ An</option>
                    <option value="Thanh Hóa">Thanh Hóa</option>
                    <option value="Nam Định">Nam Định</option>
                    <option value="Thái Bình">Thái Bình</option>
                    <option value="Bình Dương">Bình Dương</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Trường THPT
                </label>
                <div className="relative">
                  <input
                    type="text"
                    list="highschool-suggestions"
                    value={highSchool}
                    onChange={handleHighSchoolChange}
                    placeholder="Nhập tên trường THPT của bạn..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#0F172A] focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition"
                  />
                  <datalist id="highschool-suggestions">
                    <option value="THPT Việt Đức" />
                    <option value="THPT Chu Văn An" />
                    <option value="THPT Chuyên Hà Nội - Amsterdam" />
                    <option value="THPT Kim Liên" />
                    <option value="THPT Thăng Long" />
                    <option value="THPT Yên Hòa" />
                    <option value="THPT Chuyên Lê Hồng Phong" />
                    <option value="THPT Bùi Thị Xuân" />
                  </datalist>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Học sinh 63 tỉnh thành có thể tự gõ tên trường hoặc chọn gợi ý
                </p>
              </div>
            </div>

            {/* ROW 3: KHU VỰC TUYỂN SINH & ĐỐI TƯỢNG ƯU TIÊN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Khu vực ưu tiên</span>
                  <span className="text-[10px] font-bold text-blue-600">
                    {priorityArea === "KV1" ? "+0.75đ" : priorityArea === "KV2-NT" ? "+0.5đ" : priorityArea === "KV2" ? "+0.25đ" : "+0.0đ"}
                  </span>
                </label>
                <div className="relative">
                  <select
                    value={priorityArea}
                    onChange={handleAreaChange}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 pr-9 text-xs sm:text-sm font-semibold text-[#0F172A] focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition cursor-pointer"
                  >
                    <option value="KV1">KV1 (+0.75đ - Vùng khó khăn/hải đảo)</option>
                    <option value="KV2-NT">KV2-NT (+0.5đ - Vùng nông thôn)</option>
                    <option value="KV2">KV2 (+0.25đ - Thị xã/TP thuộc tỉnh)</option>
                    <option value="KV3">KV3 (0.0đ - Quận nội thành đô thị)</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Đối tượng ưu tiên</span>
                  <span className="text-[10px] font-bold text-blue-600">
                    {priorityObject === "uu_tien_1" ? "+2.0đ" : priorityObject === "uu_tien_2" ? "+1.0đ" : "+0.0đ"}
                  </span>
                </label>
                <div className="relative">
                  <select
                    value={priorityObject}
                    onChange={handleObjectChange}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 pr-9 text-xs sm:text-sm font-semibold text-[#0F172A] focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition cursor-pointer"
                  >
                    <option value="none">Không có (+0.0đ)</option>
                    <option value="uu_tien_1">Ưu tiên 1 (+2.0đ - DTTS khó khăn, thương binh)</option>
                    <option value="uu_tien_2">Ưu tiên 2 (+1.0đ - Con thương binh, DTTS khác)</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
              </div>
            </div>

            {/* ROW 4: GIỚI TÍNH (TÙY CHỌN) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Giới tính (tùy chọn)
              </label>
              <div className="relative">
                <select
                  defaultValue="Nam"
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 pr-9 text-xs sm:text-sm font-semibold text-[#0F172A] focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition cursor-pointer"
                >
                  <option value="">Chọn giới tính</option>
                  <option value="Nam">Nam</option>
                  <option value="Nu">Nữ</option>
                  <option value="Khac">Khác</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
            </div>
          </div>
        </div>
        {graduationYear === "" && (
          <p role="status" className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Chưa nhập năm thi tốt nghiệp; chưa thể kiểm tra ngưỡng tổng điểm 15 điểm áp dụng từ năm 2026.
          </p>
        )}
        {typeof graduationYear === "number" && graduationYear >= 2026 && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-xs text-amber-900">
            <label className="block font-semibold" htmlFor="minimum-score-exception">Trường hợp ngoại lệ ngưỡng 15 điểm (Điều 8, Thông tư 06/2026)</label>
            <select
              id="minimum-score-exception"
              value={profile.minimumScoreException == null ? "unknown" : profile.minimumScoreException ? "yes" : "no"}
              onChange={(e) => updateProfile({ minimumScoreException: e.target.value === "unknown" ? null : e.target.value === "yes" })}
              className="mt-2 w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-medium text-slate-800"
            >
              <option value="unknown">Chưa xác định</option>
              <option value="no">Không thuộc diện ngoại lệ</option>
              <option value="yes">Có, đã xác minh thuộc diện ngoại lệ</option>
            </select>
            <p className="mt-2">Nếu tổng điểm thi dưới 15 hoặc chưa đủ điểm, chỉ bật ngoại lệ sau khi đối chiếu Điều 8.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default BasicInfoCard;

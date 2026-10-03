import React, { useState, useMemo } from "react";
import {
  Search,
  CheckCircle2,
  ExternalLink,
  BookOpen,
  Copy,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { TargetProgram, MAJOR_GROUPS } from "@/engine/types";
import { ALL_PROGRAMS_CATALOG } from "@/data/catalog";
import { formatEmploymentRate, formatTuitionPerYear } from "@/lib/format";

interface DataPassportTableProps {
  onSelectAsTarget?: (program: TargetProgram) => void;
  showToast?: (title: string, desc: string, type?: "success" | "info") => void;
}

const ITEMS_PER_PAGE = 10;

export default function DataPassportTable({
  showToast,
}: DataPassportTableProps) {
  const [selectedSchool, setSelectedSchool] = useState<string>("ALL");
  const [selectedGroup, setSelectedGroup] = useState<string>("ALL");
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("cutoff_desc");
  const [currentPage, setCurrentPage] = useState<number>(1);

  // State cho Modal chi tiết Program Dossier
  const [activeDossier, setActiveDossier] = useState<TargetProgram | null>(null);
  const [copiedCitation, setCopiedCitation] = useState<boolean>(false);

  // Danh sách trường đại học duy nhất
  const schools = useMemo(() => {
    const map = new Map<string, string>();
    ALL_PROGRAMS_CATALOG.forEach((p) => {
      if (!map.has(p.schoolCode)) {
        map.set(p.schoolCode, p.schoolName);
      }
    });
    return Array.from(map.entries()).map(([code, name]) => ({ code, name }));
  }, []);

  // Lọc và sắp xếp chương trình
  const filteredPassports = useMemo(() => {
    return ALL_PROGRAMS_CATALOG.filter((p: TargetProgram) => {
      const matchSchool = selectedSchool === "ALL" || p.schoolCode === selectedSchool;
      const matchGroup = selectedGroup === "ALL" || p.majorGroup === selectedGroup;
      const term = searchFilter.trim().toLowerCase();
      const matchSearch =
        term === "" ||
        p.majorName.toLowerCase().includes(term) ||
        p.schoolName.toLowerCase().includes(term) ||
        p.schoolCode.toLowerCase().includes(term) ||
        p.programId.toLowerCase().includes(term) ||
        p.combinations.some((c) => c.toLowerCase().includes(term));
      return matchSchool && matchGroup && matchSearch;
    }).sort((a, b) => {
      if (sortBy === "cutoff_desc") {
        return (b.cutoff2024 ?? b.forecastP50) - (a.cutoff2024 ?? a.forecastP50);
      }
      if (sortBy === "cutoff_asc") {
        return (a.cutoff2024 ?? a.forecastP50) - (b.cutoff2024 ?? b.forecastP50);
      }
      if (sortBy === "tuition_asc") {
        return (a.tuitionVnd ?? Infinity) - (b.tuitionVnd ?? Infinity);
      }
      if (sortBy === "tuition_desc") {
        return (b.tuitionVnd ?? -Infinity) - (a.tuitionVnd ?? -Infinity);
      }
      if (sortBy === "employment_desc") {
        return (b.employmentRate ?? -Infinity) - (a.employmentRate ?? -Infinity);
      }
      return 0;
    });
  }, [selectedSchool, selectedGroup, searchFilter, sortBy]);

  // Phân trang
  const totalPages = Math.max(1, Math.ceil(filteredPassports.length / ITEMS_PER_PAGE));
  const pagedPrograms = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPassports.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPassports, currentPage]);

  // Reset trang về 1 khi đổi bộ lọc
  const handleFilterChange = (setter: (val: string) => void, val: string) => {
    setter(val);
    setCurrentPage(1);
  };

  const handleCopyCitation = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedCitation(true);
      setTimeout(() => setCopiedCitation(false), 2500);
      if (showToast) {
        showToast("Đã sao chép", "Đã lưu số trang đề án tuyển sinh vào bộ nhớ tạm.");
      }
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs space-y-4 print:hidden">
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-600 font-bold border border-blue-100">
            <BookOpen className="h-4.5 w-4.5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              Tra cứu Đề án tuyển sinh các trường
            </h2>
          </div>
        </div>

        {/* BỘ LỌC TÌM KIẾM */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm ngành, trường, mã..."
              value={searchFilter}
              onChange={(e) => handleFilterChange(setSearchFilter, e.target.value)}
              className="w-44 sm:w-52 rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none transition"
            />
          </div>

          <select
            value={selectedSchool}
            onChange={(e) => handleFilterChange(setSelectedSchool, e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none transition cursor-pointer"
          >
            <option value="ALL">Tất cả các trường ({schools.length})</option>
            {schools.map((s) => (
              <option key={s.code} value={s.code}>
                {s.code} - {s.name}
              </option>
            ))}
          </select>

          <select
            value={selectedGroup}
            onChange={(e) => handleFilterChange(setSelectedGroup, e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none transition cursor-pointer"
          >
            <option value="ALL">Tất cả nhóm ngành</option>
            {MAJOR_GROUPS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => handleFilterChange(setSortBy, e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none transition cursor-pointer"
          >
            <option value="cutoff_desc">Điểm: Cao → Thấp</option>
            <option value="cutoff_asc">Điểm: Thấp → Cao</option>
            <option value="tuition_asc">Học phí: Thấp → Cao</option>
            <option value="tuition_desc">Học phí: Cao → Thấp</option>
            <option value="employment_desc">Tỷ lệ việc làm cao</option>
          </select>
        </div>
      </div>

      {/* BẢNG DỮ LIỆU TINH GỌN */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white" style={{ scrollbarGutter: "stable" }}>
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-extrabold text-[11px] uppercase tracking-wider">
              <th className="p-3 text-center w-12">STT</th>
              <th className="p-3">Trường &amp; Ngành đào tạo</th>
              <th className="p-3 text-center">Tổ hợp</th>
              <th className="p-3 text-center">Điểm chuẩn gần nhất</th>
              <th className="p-3 text-center">Học phí dự kiến</th>
              <th className="p-3 text-center">Việc làm</th>
              <th className="p-3 text-center w-28">Đề án gốc</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pagedPrograms.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-500">
                  Không tìm thấy chương trình đào tạo phù hợp với bộ lọc.
                </td>
              </tr>
            ) : (
              pagedPrograms.map((item, index) => {
                const actualIndex = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;
                return (
                  <tr
                    key={item.programId}
                    onClick={() => setActiveDossier(item)}
                    className="hover:bg-blue-50/40 transition cursor-pointer group"
                  >
                    {/* STT */}
                    <td className="p-3 text-center text-slate-400 font-mono text-[11px]">
                      {actualIndex}
                    </td>

                    {/* TRƯỜNG & NGÀNH */}
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded">
                          {item.schoolCode}
                        </span>
                        <span className="font-bold text-slate-900 group-hover:text-blue-700 transition">
                          {item.majorName}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {item.schoolName}
                      </div>
                    </td>

                    {/* TỔ HỢP */}
                    <td className="p-3 text-center font-mono font-bold text-blue-700">
                      {item.combinations.join(", ")}
                    </td>

                    {/* ĐIỂM CHUẨN GẦN NHẤT */}
                    <td className="p-3 text-center">
                      <span className="font-mono font-black text-slate-900 text-sm">
                        {(item.cutoff2024 ?? item.forecastP50).toFixed(2)}đ
                      </span>
                    </td>

                    {/* HỌC PHÍ */}
                    <td className="p-3 text-center font-semibold text-slate-800">
                      {formatTuitionPerYear(item.tuitionVnd)}
                    </td>

                    {/* VIỆC LÀM */}
                    <td className="p-3 text-center font-bold text-emerald-700">
                      {formatEmploymentRate(item.employmentRate)}
                    </td>

                    {/* ĐỀ ÁN GỐC */}
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDossier(item);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      >
                        <span>Chi tiết</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* PHÂN TRANG (PAGINATION) */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
          <div>
            Hiển thị <strong>{(currentPage - 1) * ITEMS_PER_PAGE + 1}</strong> –{" "}
            <strong>{Math.min(currentPage * ITEMS_PER_PAGE, filteredPassports.length)}</strong> trên{" "}
            <strong>{filteredPassports.length}</strong> chương trình
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              title="Trang trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 font-bold text-slate-700 text-xs">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              title="Trang sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* MODAL CHI TIẾT ĐỀ ÁN (PROGRAM DOSSIER) */}
      {activeDossier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 animate-in fade-in duration-200">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Chi tiết Đề án tuyển sinh"
            className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs font-black bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                    {activeDossier.schoolCode}
                  </span>
                  <h3 className="text-base font-black text-slate-900">
                    {activeDossier.majorName}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1 font-medium">{activeDossier.schoolName}</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveDossier(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Trích lục Đề án */}
            <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  Trích lục văn bản Đề án tuyển sinh gốc
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyCitation(activeDossier.dataPassport)}
                  className="text-[11px] font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
                >
                  {copiedCitation ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Đã sao chép!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Sao chép trích dẫn</span>
                    </>
                  )}
                </button>
              </div>
              <div className="bg-white p-3 rounded-lg border border-blue-100 text-xs text-slate-800 font-medium leading-relaxed">
                {activeDossier.dataPassport}
              </div>
            </div>

            {/* Diễn biến điểm chuẩn 4 năm */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Diễn biến điểm chuẩn các năm
              </h4>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[10px] text-slate-500 font-semibold">2021</div>
                  <div className="text-sm font-black text-slate-700 font-mono mt-0.5">
                    {activeDossier.cutoff2021 ?? "—"}
                  </div>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[10px] text-slate-500 font-semibold">2022</div>
                  <div className="text-sm font-black text-slate-700 font-mono mt-0.5">
                    {activeDossier.cutoff2022 ?? "—"}
                  </div>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[10px] text-slate-500 font-semibold">2023</div>
                  <div className="text-sm font-black text-slate-700 font-mono mt-0.5">
                    {activeDossier.cutoff2023 ?? "—"}
                  </div>
                </div>
                <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="text-[10px] text-blue-700 font-bold">2024</div>
                  <div className="text-sm font-black text-blue-900 font-mono mt-0.5">
                    {(activeDossier.cutoff2024 ?? activeDossier.forecastP50).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            {/* Học phí & Việc làm */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-[10px] text-slate-500 font-bold uppercase">Học phí năm học</div>
                <div className="text-base font-black text-slate-900 mt-0.5">
                  {formatTuitionPerYear(activeDossier.tuitionVnd)}
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-[10px] text-slate-500 font-bold uppercase">Tỷ lệ việc làm sau 12T</div>
                <div className="text-base font-black text-emerald-700 mt-0.5">
                  {activeDossier.employmentRate ? `${activeDossier.employmentRate}%` : "Đang cập nhật đề án"}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveDossier(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

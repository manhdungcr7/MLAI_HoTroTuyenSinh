import React, { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useApp } from "@/state/AppContext";
import { isAptitudeProgram } from "@/data/catalog";
import { fold } from "@/lib/text";

/** Giải thích những trường hợp ứng dụng chưa tính được, để học sinh biết bước tiếp theo thay vì tưởng không có ngành. */
export function NotFoundHelp() {
  const { catalog, profile } = useApp();
  const [open, setOpen] = useState(false);

  const stats = useMemo(() => {
    const programs = catalog?.programs ?? [];
    return { schools: new Set(programs.map((p) => p.schoolCode)).size, programs: programs.length };
  }, [catalog]);

  const aptitude = useMemo(() => {
    if (!open) return [];
    const groups = profile.interestMajorGroups ?? [];
    const names = (profile.interestMajorNames ?? []).map(fold);
    const seen = new Set<string>();
    const list = [];
    for (const p of catalog?.programs ?? []) {
      if (!isAptitudeProgram(p)) continue;
      if (groups.length > 0 || names.length > 0) {
        const hit = groups.includes(p.majorGroup) || names.some((n) => fold(p.majorName).includes(n));
        if (!hit) continue;
      }
      const key = `${p.schoolCode}|${fold(p.majorName)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      list.push(p);
    }
    return list.slice(0, 8);
  }, [open, catalog, profile.interestMajorGroups, profile.interestMajorNames]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left text-sm font-medium text-slate-800 cursor-pointer">
        Không thấy ngành hoặc trường bạn cần?
        <ChevronDown className={`h-5 w-5 shrink-0 text-slate-500 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="space-y-4 border-t border-slate-100 px-4 py-4 text-sm leading-relaxed text-slate-700">
          <div>
            <p className="font-medium text-slate-900">Ngành thi năng khiếu (vẽ, nhạc, thể thao, mầm non)</p>
            <p>Ngoài điểm văn hóa còn thi năng khiếu riêng của trường nên chưa tính được xác suất đỗ.</p>
            {aptitude.length > 0 && (
              <ul className="mt-2 space-y-1">
                {aptitude.map((p) => (
                  <li key={p.programId} className="truncate text-slate-600">{p.majorName} · {p.schoolName}</li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <p className="font-medium text-slate-900">Công an, Quân đội</p>
            <p>Các trường này tuyển theo quy định riêng của Bộ Công an, Bộ Quốc phòng (sơ tuyển, tiêu chuẩn sức khỏe, chính trị, chỉ tiêu theo tỉnh) nên không có trong danh sách. Hãy xem thông báo tuyển sinh của từng trường.</p>
          </div>
          <div>
            <p className="font-medium text-slate-900">Cao đẳng, trung cấp, học nghề</p>
            <p>Ứng dụng chỉ tính cho chương trình đại học. Cao đẳng và nghề thường xét học bạ hoặc điểm tốt nghiệp với ngưỡng thấp hơn, bạn xem thông tin tuyển sinh của từng trường.</p>
          </div>
          <div>
            <p className="font-medium text-slate-900">Học phí và hỗ trợ tài chính</p>
            <p>Hầu hết đề án chưa công bố học phí theo từng ngành nên ứng dụng không lọc theo học phí. Bạn xem mức thu trong đề án của trường. Sinh viên thuộc diện chính sách, hộ nghèo, dân tộc thiểu số có thể được miễn giảm học phí, xét học bổng và vay vốn tín dụng sinh viên tại Ngân hàng Chính sách xã hội; hãy hỏi phòng công tác sinh viên của trường.</p>
          </div>
          <div>
            <p className="font-medium text-slate-900">Trường chưa có trong dữ liệu</p>
            <p>Hiện có {stats.schools} trường, {stats.programs} chương trình. Trường chưa có điểm chuẩn công bố sẽ được thêm khi có dữ liệu; hãy kiểm tra điểm chuẩn trực tiếp trên website của trường.</p>
          </div>
        </div>
      )}
    </section>
  );
}

/** Khung xám giữ chỗ khi danh sách đang nạp. */
export function SkeletonDanhSach({ so = 4 }: { so?: number }) {
  return (
    <ul className="space-y-3" role="status" aria-label="Đang tải danh sách ngành">
      {Array.from({ length: so }, (_, i) => (
        <li key={i} className="rounded-the border border-vien bg-trang p-3.5 shadow-the">
          <div className="flex gap-3">
            <div className="size-12 shrink-0 rounded-xl bg-vien animate-pulse motion-reduce:animate-none" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 rounded bg-vien animate-pulse motion-reduce:animate-none" />
              <div className="h-3.5 w-1/2 rounded bg-vien animate-pulse motion-reduce:animate-none" />
            </div>
          </div>
          <div className="mt-3 h-3.5 w-2/3 rounded bg-vien animate-pulse motion-reduce:animate-none" />
        </li>
      ))}
    </ul>
  );
}

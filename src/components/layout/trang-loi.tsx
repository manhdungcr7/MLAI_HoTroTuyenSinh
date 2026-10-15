// Màn báo lỗi cho cả ứng dụng. Gặp khi tải một trang con thất bại (mất mạng, hoặc vừa có bản mới nên tệp cũ không còn).
import { useEffect } from "react";
import { useNavigate, useRouteError } from "react-router-dom";
import { KhungLoi } from "@/components/ui/hien-thi";
import { Nut } from "@/components/ui/nut-the";
import { DUONG_DAN } from "@/duong-dan";

export function TrangLoi() {
  const loi = useRouteError();
  const nav = useNavigate();
  useEffect(() => { document.title = "Chưa tải được trang · Nguyện Vọng AI"; }, []);
  const doTai = /dynamically imported|Loading chunk|Failed to fetch|Importing a module script|MIME type/i.test(String((loi as Error)?.message ?? loi));
  // Ứng dụng vừa có bản mới (tệp cũ không còn): tự tải lại MỘT lần trong 30 giây, tránh vòng lặp nếu lỗi là do mất mạng.
  useEffect(() => {
    if (!doTai) return;
    try {
      const truoc = Number(sessionStorage.getItem("nvai:tu-tai-lai") ?? 0);
      if (Date.now() - truoc > 30_000) { sessionStorage.setItem("nvai:tu-tai-lai", String(Date.now())); window.location.reload(); }
    } catch { /* trình duyệt chặn bộ nhớ phiên: để người dùng tự bấm Thử lại */ }
  }, [doTai]);
  return (
    <div className="khung-ung-dung p-4 pt-10 space-y-3">
      <KhungLoi
        tieuDe={doTai ? "Chưa tải được trang này" : "Có lỗi xảy ra"}
        moTa={doTai ? "Có thể thiết bị mất kết nối mạng hoặc ứng dụng vừa được cập nhật. Bạn tải lại trang là được. Thông tin đã lưu vẫn được giữ nguyên." : "Bạn thử tải lại trang nhé. Thông tin đã lưu vẫn được giữ nguyên."}
        thuLai={() => window.location.reload()}
      />
      <Nut kieu="vien" onClick={() => nav(DUONG_DAN.homNay())}>Về trang Hôm nay</Nut>
    </div>
  );
}

// Màn báo lỗi cho cả ứng dụng. Gặp khi tải một trang con thất bại (mất mạng, hoặc vừa có bản mới nên tệp cũ không còn).
import { useEffect } from "react";
import { useNavigate, useRouteError } from "react-router-dom";
import { KhungLoi } from "@cms/thanh-phan/ui/hien-thi";
import { Nut } from "@cms/thanh-phan/ui/nut-the";
import { DUONG_DAN } from "@/duong-dan";

export function TrangLoi() {
  const loi = useRouteError();
  const nav = useNavigate();
  useEffect(() => { document.title = "Chưa tải được trang · Nguyện Vọng AI"; }, []);
  const doTai = /dynamically imported|Loading chunk|Failed to fetch|Importing a module script/i.test(String((loi as Error)?.message ?? loi));
  return (
    <div className="khung-ung-dung p-4 pt-10 space-y-3">
      <KhungLoi
        tieuDe={doTai ? "Chưa tải được trang này" : "Có lỗi xảy ra"}
        moTa={doTai ? "Có thể máy em mất mạng, hoặc ứng dụng vừa được cập nhật. Em tải lại trang là được. Thông tin em đã nhập vẫn còn trên máy." : "Em tải lại trang thử nhé. Thông tin em đã nhập vẫn còn trên máy."}
        thuLai={() => window.location.reload()}
      />
      <Nut kieu="vien" onClick={() => nav(DUONG_DAN.homNay())}>Về trang Hôm nay</Nut>
    </div>
  );
}

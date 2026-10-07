// Thông báo Telegram do máy chủ gửi. Khóa bot nằm ở máy chủ (secret), trình duyệt không nhập hay lưu khóa.
import { useState } from "react";
import { Send } from "lucide-react";
import { thongBaoLoi } from "@cms/may-chu/api";
import { guiTinThuTelegram, layTrangThaiTelegram } from "@cms/may-chu/xuat-ban-api";
import { useTai } from "@cms/trang-thai/dung-tai";
import { KhungDangTai, KhungLoi } from "@cms/thanh-phan/ui/hien-thi";
import { Nhan, Nut, The } from "@cms/thanh-phan/ui/nut-the";
import { DongThongBao } from "@cms/thanh-phan/ui/thong-bao";

export default function ThongBaoTelegram() {
  const tt = useTai(() => layTrangThaiTelegram());
  const [dang, setDang] = useState(false);
  const [ketQua, setKetQua] = useState<{ tone: "luc" | "do"; noiDung: string } | null>(null);

  const gui = async () => {
    setDang(true);
    try {
      await guiTinThuTelegram();
      setKetQua({ tone: "luc", noiDung: "Đã gửi tin thử. Bạn kiểm tra nhóm Telegram xem đã nhận chưa." });
    } catch (e) {
      setKetQua({ tone: "do", noiDung: thongBaoLoi(e) });
    } finally {
      setDang(false);
    }
  };

  if (tt.dangTai && !tt.du) return <KhungDangTai cao="h-28" />;
  if (tt.loi) return <KhungLoi moTa={tt.loi} thuLai={tt.taiLai} />;
  const bat = Boolean(tt.du?.daCauHinh);
  return (
    <div className="space-y-3">
      {ketQua && <DongThongBao tone={ketQua.tone} tieuDe={ketQua.noiDung} onClick={() => setKetQua(null)} />}
      <The className="space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-extrabold text-[16px] text-muc">Thông báo Telegram</h2>
          <Nhan tone={bat ? "luc" : "cam"}>{bat ? "Đã bật" : "Chưa bật"}</Nhan>
        </div>
        <p className="text-[14px] text-chu">
          {bat ? "Khi có mục được gửi duyệt, duyệt hoặc trả lại, nhóm Telegram sẽ nhận tin." : "Chưa có thông báo nào được gửi. Muốn bật, nhờ người quản lý kỹ thuật thêm khóa bot Telegram vào máy chủ."}
        </p>
        <Nut bieuTuong={Send} onClick={() => void gui()} disabled={dang || !bat}>{dang ? "Đang gửi" : "Gửi tin thử"}</Nut>
      </The>
    </div>
  );
}

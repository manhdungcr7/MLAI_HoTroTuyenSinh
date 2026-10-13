// Nhật ký: ai đã làm gì, lúc nào. Chỉ đọc. Mỗi lần bấm "Xem thêm" là một lần gọi máy chủ.
import { useEffect, useRef, useState } from "react";
import { ScrollText } from "lucide-react";
import { layTrangNhatKy, thongBaoLoi, type NhatKyCms } from "@cms/may-chu/api";
import { KhungDangTai, KhungLoi, TrangThaiTrong } from "@cms/thanh-phan/ui/hien-thi";
import { Nut, The } from "@cms/thanh-phan/ui/nut-the";
import { dinhDangLuc } from "@cms/du-lieu-truong/dinh-dang";

const NHAN_HANH_DONG: Record<string, string> = {
  CREATE: "Tạo bản nháp", EDIT: "Sửa bản nháp", SUBMIT: "Gửi duyệt", START_REVIEW: "Bắt đầu xem xét", APPROVE: "Duyệt", REJECT: "Trả lại",
  PUBLISH: "Xuất bản", ROLLBACK: "Quay về phiên bản cũ", ARCHIVE: "Bỏ bản nháp",
  "nguoi.them.sa": "Thêm siêu quản trị", "nguoi.them.qtv": "Thêm quản trị viên", "nguoi.them.ctv": "Thêm cộng tác viên",
  "nguoi.doi-vai.sa": "Đổi vai thành siêu quản trị", "nguoi.doi-vai.qtv": "Đổi vai thành quản trị viên", "nguoi.doi-vai.ctv": "Đổi vai thành cộng tác viên",
  "nguoi.xoa": "Xóa thành viên", "nguoi.xoa.sa": "Xóa siêu quản trị", "nguoi.xoa.qtv": "Xóa quản trị viên", "nguoi.xoa.ctv": "Xóa cộng tác viên", "phan-cong.dat": "Giao trường",
  "quan-tri.khoi-tao": "Tạo quản trị viên đầu tiên", "quan-tri.khoi-tao-sa": "Tạo siêu quản trị đầu tiên",
};
const nhanHanhDong = (h: string) => NHAN_HANH_DONG[h] ?? h;

export default function NhatKyHeThong() {
  const [ds, setDs] = useState<NhatKyCms[]>([]);
  const [tong, setTong] = useState(0);
  const [trang, setTrang] = useState(0);
  const [dang, setDang] = useState(true);
  const [loi, setLoi] = useState<string | null>(null);
  const lan = useRef(0);

  const tai = (t: number) => {
    const l = ++lan.current;
    setDang(true); setLoi(null);
    layTrangNhatKy(t)
      .then((r) => { if (l !== lan.current) return; setDs((c) => (t === 1 ? r.muc : [...c, ...r.muc])); setTong(r.tong); setTrang(t); setDang(false); })
      .catch((e: unknown) => { if (l !== lan.current) return; setLoi(thongBaoLoi(e)); setDang(false); });
  };
  useEffect(() => { tai(1); return () => { lan.current++; }; }, []);

  if (dang && ds.length === 0 && !loi) return <KhungDangTai soKhung={4} cao="h-16" />;
  if (loi && ds.length === 0) return <KhungLoi moTa={loi} thuLai={() => tai(1)} />;
  if (ds.length === 0) return <TrangThaiTrong bieuTuong={<ScrollText size={26} />} tieuDe="Chưa có hoạt động nào" moTa="Khi có người thêm, sửa, duyệt hay xuất bản, nhật ký sẽ ghi lại ở đây." />;

  return (
    <div className="space-y-2">
      {ds.map((x) => (
        <The key={x.id} className="py-3 space-y-0.5">
          <p className="font-bold text-[14px] text-muc">{nhanHanhDong(x.hanhDong)}</p>
          <p className="text-[13px] text-chu break-words">{x.doiTuong}</p>
          <p className="text-[12px] text-chu-phu break-all">{x.ai} · {dinhDangLuc(x.luc)}</p>
        </The>
      ))}
      {loi && <p role="alert" className="rounded-xl bg-do-nhat p-3 text-[13px] font-semibold text-do-chu">{loi}</p>}
      {ds.length < tong && <Nut kieu="vien" onClick={() => tai(trang + 1)} disabled={dang}>{dang ? "Đang tải" : `Xem thêm (${ds.length}/${tong})`}</Nut>}
    </div>
  );
}

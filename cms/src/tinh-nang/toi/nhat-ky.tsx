import { useState, useEffect } from "react";
import { History, Clock, User } from "lucide-react";
import { DUONG_DAN } from "@cms/duong-dan";
import { layTrangNhatKy, thongBaoLoi, type NhatKyCms } from "@cms/may-chu/api";
import { DauTrangCoQuayLai, NoiDung } from "@cms/thanh-phan/khung/khung-goc";
import { KhungDangTai, TrangThaiTrong } from "@cms/thanh-phan/ui/hien-thi";
import { The } from "@cms/thanh-phan/ui/nut-the";
import { dinhDangLuc } from "../truong/dinh-dang";

export default function NhatKy() {
  const [danhSach, setDanhSach] = useState<NhatKyCms[]>([]);
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState<string | null>(null);

  const taiLai = async () => {
    try {
      setDangTai(true);
      const res = await layTrangNhatKy(1);
      setDanhSach(res.muc);
      setDangTai(false);
    } catch (e) {
      setLoi(thongBaoLoi(e));
      setDangTai(false);
    }
  };

  useEffect(() => {
    taiLai();
  }, []);

  return (
    <div className="space-y-4">
      <DauTrangCoQuayLai
        tieuDe="Nhật ký thao tác"
        quayLai={DUONG_DAN.toi()}
      />

      <NoiDung>
        {dangTai ? (

          <KhungDangTai soKhung={4} cao="h-20" />
        ) : loi ? (
          <TrangThaiTrong bieuTuong={<History size={24} />} tieuDe="Lỗi tải dữ liệu" moTa={loi} />
        ) : danhSach.length === 0 ? (
          <TrangThaiTrong bieuTuong={<Clock size={24} />} tieuDe="Chưa có nhật ký nào" moTa="Các hoạt động trên CMS sẽ xuất hiện ở đây." />
        ) : (
          <div className="space-y-2">
            {danhSach.map((nk) => (
              <The key={nk.id} className="p-3 space-y-1.5 border border-vien/90 shadow-2xs">
                <div className="flex items-center justify-between text-[11.5px] text-chu-phu">
                  <span className="font-bold text-xanh flex items-center gap-1.5 truncate max-w-[190px]">
                    <User size={13} strokeWidth={2.4} /> {nk.ai}
                  </span>
                  <span className="shrink-0">{dinhDangLuc(nk.luc)}</span>
                </div>
                <p className="font-bold text-[13.5px] text-muc leading-snug">{nk.hanhDong}</p>
                <div className="text-[12px] text-chu bg-nen/80 px-2 py-1 rounded-md inline-block">
                  Đối tượng: <b className="font-semibold text-muc">{nk.doiTuong}</b>
                </div>
              </The>
            ))}
          </div>
        )}
      </NoiDung>
    </div>
  );
}



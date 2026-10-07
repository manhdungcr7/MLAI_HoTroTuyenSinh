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
          <div className="space-y-2.5">
            {danhSach.map((nk) => (
              <The key={nk.id} className="p-3.5 space-y-1">
                <div className="flex items-center justify-between text-[12px] text-chu-phu">
                  <span className="font-semibold flex items-center gap-1">
                    <User size={12} /> {nk.ai}
                  </span>
                  <span>{dinhDangLuc(nk.luc)}</span>
                </div>
                <p className="font-bold text-[14px] text-muc">{nk.hanhDong}</p>
                <p className="text-[13px] text-chu">Đối tượng: <b>{nk.doiTuong}</b></p>
              </The>
            ))}
          </div>
        )}
      </NoiDung>
    </div>
  );
}


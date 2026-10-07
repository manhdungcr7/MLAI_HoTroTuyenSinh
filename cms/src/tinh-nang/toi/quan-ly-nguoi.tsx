import { useState, useEffect } from "react";
import { UserPlus, Trash2, Shield, User } from "lucide-react";
import { DUONG_DAN } from "@cms/duong-dan";
import { layNguoi, themNguoi, xoaNguoi, thongBaoLoi, type NguoiCms, type VaiTro } from "@cms/may-chu/api";
import { DauTrangCoQuayLai, NoiDung } from "@cms/thanh-phan/khung/khung-goc";
import { KhungDangTai, HopTruot, TrangThaiTrong } from "@cms/thanh-phan/ui/hien-thi";
import { OInput, OChon, Truong } from "@cms/thanh-phan/ui/nhap-lieu";
import { BieuTuongTron } from "@cms/thanh-phan/ui/hinh-nen";
import { Nut, The, Nhan } from "@cms/thanh-phan/ui/nut-the";
import { DongThongBao } from "@cms/thanh-phan/ui/thong-bao";
import { dinhDangLuc } from "../truong/dinh-dang";

export default function QuanLyNguoi() {
  const [danhSach, setDanhSach] = useState<NguoiCms[]>([]);
  const [dangTai, setDangTai] = useState(true);
  const [thongBao, setThongBao] = useState<string | null>(null);
  const [loi, setLoi] = useState<string | null>(null);

  // Thêm người
  const [moThem, setMoThem] = useState(false);
  const [email, setEmail] = useState("");
  const [vaiTro, setVaiTro] = useState<VaiTro>("ctv");
  const [dangXuLy, setDangXuLy] = useState(false);

  // Xóa người
  const [xoaItem, setXoaItem] = useState<NguoiCms | null>(null);

  const taiLai = async () => {
    try {
      setDangTai(true);
      const res = await layNguoi();
      setDanhSach(res);
      setDangTai(false);
    } catch (e) {
      setLoi(thongBaoLoi(e));
      setDangTai(false);
    }
  };

  useEffect(() => {
    taiLai();
  }, []);

  const submitThem = async () => {
    if (!email.trim() || !email.includes("@")) {
      setThongBao("Email không hợp lệ.");
      return;
    }
    try {
      setDangXuLy(true);
      await themNguoi(email.trim(), vaiTro);
      setThongBao(`Đã thêm ${email} thành công.`);
      setMoThem(false);
      setEmail("");
      taiLai();
    } catch (e) {
      setThongBao(thongBaoLoi(e));
    } finally {
      setDangXuLy(false);
    }
  };

  const submitXoa = async () => {
    if (!xoaItem) return;
    try {
      setDangXuLy(true);
      await xoaNguoi(xoaItem.email);
      setThongBao(`Đã xóa ${xoaItem.email}.`);
      setXoaItem(null);
      taiLai();
    } catch (e) {
      setThongBao(thongBaoLoi(e));
    } finally {
      setDangXuLy(false);
    }
  };

  return (
    <div className="space-y-4">
      <DauTrangCoQuayLai
        tieuDe="Quản lý thành viên"
        quayLai={DUONG_DAN.toi()}
      />

      <NoiDung>
        {thongBao && (
          <DongThongBao tieuDe={thongBao} tone="luc" onClick={() => setThongBao(null)} />
        )}

        <div className="flex justify-between items-center pb-1">
          <span className="text-[13px] text-chu-phu font-semibold">
            Tổng cộng: <b>{danhSach.length}</b> thành viên
          </span>
          <Nut bieuTuong={UserPlus} rong={false} onClick={() => setMoThem(true)}>
            Thêm người
          </Nut>
        </div>

        {dangTai ? (
          <KhungDangTai soKhung={3} />
        ) : loi ? (
          <TrangThaiTrong bieuTuong={<User size={24} />} tieuDe="Lỗi tải dữ liệu" moTa={loi} />
        ) : (
          <div className="space-y-2.5">

            {danhSach.map((n) => {
              const laQtv = n.vaiTro === "qtv";
              return (
                <The key={n.email} className="p-3.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <BieuTuongTron icon={laQtv ? Shield : User} tone={laQtv ? "xanh" : "luc"} kichThuoc={40} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[14px] text-muc truncate">{n.email}</span>
                        <Nhan tone={laQtv ? "xanh" : "luc"}>
                          {laQtv ? "Quản trị viên" : "Cộng tác viên"}
                        </Nhan>
                      </div>
                      <p className="text-[12px] text-chu-phu">Tham gia: {dinhDangLuc(n.taoLuc)}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setXoaItem(n)}
                    className="text-chu-phu hover:text-do-chu p-1.5 transition-colors"
                    title="Xóa thành viên"
                  >
                    <Trash2 size={16} />
                  </button>
                </The>
              );
            })}
          </div>
        )}
      </NoiDung>

      {/* MODAL THEM */}
      <HopTruot mo={moThem} dong={() => setMoThem(false)} tieuDe="Thêm thành viên mới">
        <div className="space-y-3.5 pb-4">
          <Truong nhan="Email Google / Cloudflare Access">
            <OInput
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ten.nguoidung@gmail.com"
            />
          </Truong>
          <Truong nhan="Vai trò">
            <OChon value={vaiTro} onChange={(e) => setVaiTro(e.target.value as VaiTro)}>
              <option value="ctv">Cộng tác viên (Chỉ điền trường được giao, gửi chờ duyệt)</option>
              <option value="qtv">Quản trị viên (Đầy đủ quyền duyệt bài, phân công, phát hành)</option>
            </OChon>
          </Truong>
          <div className="flex flex-col gap-2 pt-2">
            <Nut onClick={submitThem} disabled={dangXuLy}>Xác nhận thêm</Nut>
            <Nut kieu="vien" onClick={() => setMoThem(false)}>Hủy</Nut>
          </div>
        </div>
      </HopTruot>

      {/* MODAL XOA */}
      <HopTruot mo={xoaItem !== null} dong={() => setXoaItem(null)} tieuDe="Xác nhận xóa thành viên?">
        <div className="space-y-4 pb-4">
          <p className="text-[14px] text-chu">
            Bạn có chắc chắn muốn xóa quyền truy cập của <b>{xoaItem?.email}</b> khỏi hệ thống?
          </p>
          <div className="flex flex-col gap-2">
            <Nut kieu="nguyHiem" onClick={submitXoa} disabled={dangXuLy}>Xác nhận xóa</Nut>
            <Nut kieu="vien" onClick={() => setXoaItem(null)}>Hủy</Nut>
          </div>
        </div>
      </HopTruot>
    </div>
  );
}

import { useState, useEffect } from "react";
import { UserPlus, Trash2, Shield, User } from "lucide-react";
import { DUONG_DAN } from "@cms/duong-dan";
import { layNguoi, themNguoi, xoaNguoi, thongBaoLoi, type NguoiCms, type VaiTro } from "@cms/may-chu/api";
import { DauTrangCoQuayLai, NoiDung } from "@cms/thanh-phan/khung/khung-goc";
import { KhungDangTai, HopTruot, TrangThaiTrong } from "@cms/thanh-phan/ui/hien-thi";
import { OInput, OChon, Truong } from "@cms/thanh-phan/ui/nhap-lieu";
import { Nut, The, Nhan, gop } from "@cms/thanh-phan/ui/nut-the";
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

        <div className="flex justify-between items-center pb-0.5 px-0.5">
          <span className="text-[12.5px] text-chu-phu font-semibold">
            Tổng số: <b>{danhSach.length}</b> thành viên
          </span>
          <button
            type="button"
            onClick={() => setMoThem(true)}
            className="px-3 py-1.5 rounded-xl bg-xanh text-white font-bold text-[12.5px] inline-flex items-center gap-1.5 shadow-2xs active:scale-95 transition-all"
          >
            <UserPlus size={15} strokeWidth={2.4} />
            <span>Thêm người</span>
          </button>
        </div>

        {dangTai ? (
          <KhungDangTai soKhung={3} />
        ) : loi ? (
          <TrangThaiTrong bieuTuong={<User size={24} />} tieuDe="Lỗi tải dữ liệu" moTa={loi} />
        ) : (
          <div className="space-y-2">
            {danhSach.map((n) => {
              const laQtv = n.vaiTro === "qtv";
              return (
                <The key={n.email} className="p-3 flex items-center justify-between gap-2.5 border border-vien/90 shadow-2xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={gop(
                      "size-10 rounded-xl grid place-items-center shrink-0 shadow-2xs",
                      laQtv ? "bg-xanh-nhat text-xanh" : "bg-luc-nhat text-luc-chu"
                    )}>
                      {laQtv ? <Shield size={18} strokeWidth={2.4} /> : <User size={18} strokeWidth={2.4} />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-[14px] text-muc truncate max-w-[180px]">{n.email}</span>
                        <Nhan tone={laQtv ? "xanh" : "luc"}>
                          {laQtv ? "QTV" : "CTV"}
                        </Nhan>
                      </div>
                      <p className="text-[11.5px] text-chu-phu mt-0.5">Tham gia: {dinhDangLuc(n.taoLuc)}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setXoaItem(n)}
                    className="size-9 rounded-lg grid place-items-center text-chu-phu hover:text-do-chu hover:bg-do-nhat/50 transition-colors shrink-0"
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
          <Truong nhan="Email đăng nhập">
            <OInput
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ten.nguoidung@gmail.com"
            />
          </Truong>
          <Truong nhan="Vai trò hệ thống">
            <OChon value={vaiTro} onChange={(e) => setVaiTro(e.target.value as VaiTro)}>
              <option value="ctv">Cộng tác viên (Điền dữ liệu trường được giao)</option>
              <option value="qtv">Quản trị viên (Đầy đủ quyền duyệt bài & phát hành)</option>
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

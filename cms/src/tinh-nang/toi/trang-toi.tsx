import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  UserRound, UploadCloud, Users, ListFilter,
  History, ChevronRight
} from "lucide-react";
import { DUONG_DAN } from "@cms/duong-dan";
import { layToi, phatHanh, thongBaoLoi, type Toi } from "@cms/may-chu/api";
import { DauTrangChinh, NoiDung } from "@cms/thanh-phan/khung/khung-goc";
import { KhungDangTai, HopTruot } from "@cms/thanh-phan/ui/hien-thi";
import { BieuTuongTron } from "@cms/thanh-phan/ui/hinh-nen";
import { Nut, The, Nhan } from "@cms/thanh-phan/ui/nut-the";
import { DongThongBao } from "@cms/thanh-phan/ui/thong-bao";

export default function TrangToi() {
  const [toi, setToi] = useState<Toi | null>(null);
  const [dangTai, setDangTai] = useState(true);
  const [thongBao, setThongBao] = useState<string | null>(null);
  const [loi, setLoi] = useState<string | null>(null);

  // Phát hành
  const [moPhatHanh, setMoPhatHanh] = useState(false);
  const [dangPhatHanh, setDangPhatHanh] = useState(false);

  const taiLai = async () => {
    try {
      setDangTai(true);
      const res = await layToi();
      setToi(res);
      setDangTai(false);
    } catch (e) {
      setLoi(thongBaoLoi(e));
      setDangTai(false);
    }
  };

  useEffect(() => {
    taiLai();
  }, []);

  const thucHienPhatHanh = async () => {
    try {
      setDangPhatHanh(true);
      const res = await phatHanh();
      setThongBao(`Đã phát hành thành công bản chụp ${res.soTruong} trường và ${res.soBanGhi} bản ghi lên KV.`);
      setMoPhatHanh(false);
    } catch (e) {
      setThongBao(thongBaoLoi(e));
    } finally {
      setDangPhatHanh(false);
    }
  };

  const laQtv = toi?.vaiTro === "qtv";

  return (
    <div className="space-y-4">
      <DauTrangChinh
        tieuDe="Tài khoản & Quản trị"
        moTa="Thông tin cá nhân, phân công trường và các công cụ quản lý"
      />

      <NoiDung>
        {thongBao && (
          <DongThongBao tieuDe={thongBao} tone="luc" onClick={() => setThongBao(null)} />
        )}

        {dangTai ? (
          <KhungDangTai soKhung={2} />
        ) : loi ? (
          <The className="p-4 bg-do-nhat text-do-chu">
            <p className="font-bold">Lỗi: {loi}</p>
          </The>
        ) : (
          <div className="space-y-4">
            {/* THẺ TÀI KHOẢN */}
            <The className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <BieuTuongTron icon={UserRound} tone={laQtv ? "xanh" : "luc"} kichThuoc={48} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-[16px] text-muc truncate">{toi?.email}</span>
                    <Nhan tone={laQtv ? "xanh" : "luc"}>
                      {laQtv ? "Quản trị viên" : "Tình nguyện viên"}
                    </Nhan>
                  </div>
                  <p className="text-[13px] text-chu-phu mt-0.5">
                    Được phân công: <b>{toi?.truongDuocGiao.length ?? 0}</b> trường
                  </p>
                </div>
              </div>

              {/* Danh sách trường được giao */}
              {toi?.truongDuocGiao && toi.truongDuocGiao.length > 0 && (
                <div className="pt-2 border-t border-vien">
                  <span className="text-[12px] font-bold text-chu-phu uppercase tracking-wider block mb-1.5">
                    Trường phụ trách:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {toi.truongDuocGiao.map((ma: string) => (
                      <Link
                        key={ma}
                        to={DUONG_DAN.chiTietTruong(ma)}
                        className="px-2.5 py-1 rounded bg-xanh-nhat text-xanh font-extrabold text-[13px] hover:bg-xanh hover:text-white transition-colors"
                      >
                        {ma}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </The>


            {/* QUẢN TRỊ VIÊN: CÔNG CỤ PHÁT HÀNH KV */}
            {laQtv && (
              <div className="space-y-2">
                <h3 className="font-extrabold text-[15px] text-muc">Phát hành dữ liệu cho học sinh</h3>
                <The className="p-4 space-y-3 bg-gradient-to-br from-luc-nhat/40 to-trang border-luc/30">
                  <div className="flex items-start gap-3">
                    <div className="size-10 rounded-xl gd-luc text-white grid place-items-center shrink-0">
                      <UploadCloud size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-[15px] text-muc">Dựng bản chụp Snapshot lên Cloudflare KV</h4>
                      <p className="text-[13px] text-chu mt-0.5 leading-relaxed">
                        Chỉ các bản ghi <b>Đã duyệt</b> mới được đóng gói và đưa vào CDN cache phục vụ app học sinh.
                      </p>
                    </div>
                  </div>

                  <Nut
                    bieuTuong={UploadCloud}
                    onClick={() => setMoPhatHanh(true)}
                    className="w-full bg-luc text-white hover:bg-luc-dam"
                  >
                    Phát hành ngay lên CDN
                  </Nut>
                </The>
              </div>
            )}

            {/* CÁC MỤC QUẢN LÝ DÀNH CHO QTV */}
            {laQtv && (
              <div className="space-y-2 pt-2">
                <h3 className="font-extrabold text-[15px] text-muc">Quản lý hệ thống</h3>
                <div className="space-y-2">
                  <Link to={DUONG_DAN.nguoi()} className="block group">
                    <The className="p-3.5 flex items-center justify-between group-hover:border-xanh transition-all">
                      <div className="flex items-center gap-3">
                        <Users size={20} className="text-xanh" />
                        <div>
                          <p className="font-bold text-[14px] text-chu">Quản lý người dùng</p>
                          <p className="text-[12px] text-chu-phu">Thêm CTV, cấp quyền QTV cho cộng tác viên</p>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-chu-phu group-hover:text-xanh group-hover:translate-x-0.5 transition-all" />
                    </The>
                  </Link>

                  <Link to={DUONG_DAN.phanCong()} className="block group">
                    <The className="p-3.5 flex items-center justify-between group-hover:border-xanh transition-all">
                      <div className="flex items-center gap-3">
                        <ListFilter size={20} className="text-tim-chu" />
                        <div>
                          <p className="font-bold text-[14px] text-chu">Phân công trường</p>
                          <p className="text-[12px] text-chu-phu">Gán danh sách trường cho từng tình nguyện viên</p>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-chu-phu group-hover:text-xanh group-hover:translate-x-0.5 transition-all" />
                    </The>
                  </Link>

                  <Link to={DUONG_DAN.nhatKy()} className="block group">
                    <The className="p-3.5 flex items-center justify-between group-hover:border-xanh transition-all">
                      <div className="flex items-center gap-3">
                        <History size={20} className="text-cam-chu" />
                        <div>
                          <p className="font-bold text-[14px] text-chu">Nhật ký thay đổi</p>
                          <p className="text-[12px] text-chu-phu">Lịch sử mọi thao tác thêm, sửa, duyệt nội dung</p>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-chu-phu group-hover:text-xanh group-hover:translate-x-0.5 transition-all" />
                    </The>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </NoiDung>

      {/* MODAL PHAT HANH */}
      <HopTruot
        mo={moPhatHanh}
        dong={() => setMoPhatHanh(false)}
        tieuDe="Xác nhận phát hành bản chụp?"
      >
        <div className="space-y-4 pb-4">
          <p className="text-[14px] text-chu leading-relaxed">
            Hệ thống sẽ quét toàn bộ các bản ghi đang ở trạng thái <b>Đã duyệt</b> trong cơ sở dữ liệu D1, làm sạch và tạo bản chụp JSON đồng bộ lên Cloudflare KV.
          </p>
          <div className="p-3 bg-luc-nhat rounded-lg text-[13px] text-luc-chu font-semibold">
            ✓ Học sinh trên toàn quốc sẽ nhận được dữ liệu mới nhất trong vòng 5 phút (TTL cache).
          </div>
          <div className="flex flex-col gap-2">
            <Nut
              bieuTuong={UploadCloud}
              onClick={thucHienPhatHanh}
              disabled={dangPhatHanh}
            >
              Tiến hành phát hành
            </Nut>
            <Nut kieu="vien" onClick={() => setMoPhatHanh(false)}>Hủy</Nut>
          </div>
        </div>
      </HopTruot>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  UserRound, UploadCloud, Users, ListFilter,
  History, ChevronRight, School
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
            <The className="p-4 space-y-3 border border-vien/90 shadow-2xs">
              <div className="flex items-center gap-3">
                <BieuTuongTron icon={UserRound} tone={laQtv ? "xanh" : "luc"} kichThuoc={44} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-[15.5px] text-muc truncate">{toi?.email}</span>
                    <Nhan tone={laQtv ? "xanh" : "luc"}>
                      {laQtv ? "Quản trị viên" : "Cộng tác viên"}
                    </Nhan>
                  </div>
                  <p className="text-[12.5px] text-chu-phu mt-0.5">
                    Phụ trách: <b>{toi?.truongDuocGiao.length ?? 0}</b> trường
                  </p>
                </div>
              </div>

              {/* Danh sách trường được giao */}
              {toi?.truongDuocGiao && toi.truongDuocGiao.length > 0 && (
                <div className="pt-2.5 border-t border-vien/70">
                  <span className="text-[11px] font-bold text-chu-phu uppercase tracking-wider block mb-1.5">
                    Trường được giao:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {toi.truongDuocGiao.map((ma: string) => (
                      <Link
                        key={ma}
                        to={DUONG_DAN.chiTietTruong(ma)}
                        className="px-2.5 py-1 rounded-lg bg-xanh-nhat text-xanh font-bold text-[12.5px] hover:bg-xanh hover:text-white transition-colors"
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
              <div className="space-y-2 pt-1">
                <h3 className="font-extrabold text-[15px] text-muc px-0.5">Phát hành dữ liệu cho học sinh</h3>
                <The className="p-4 space-y-3 bg-gradient-to-br from-luc-nhat/40 to-trang border-luc/30 shadow-2xs">
                  <div className="flex items-start gap-3">
                    <div className="size-10 rounded-xl gd-luc text-white grid place-items-center shrink-0 shadow-xs">
                      <UploadCloud size={20} strokeWidth={2.4} />
                    </div>
                    <div>
                      <h4 className="font-bold text-[14.5px] text-muc">Đồng bộ bản chụp lên Cloudflare KV</h4>
                      <p className="text-[12.5px] text-chu mt-0.5 leading-relaxed">
                        Chỉ các bản ghi <b>Đã duyệt</b> mới được đóng gói và cập nhật trực tiếp vào CDN cache cho học sinh toàn quốc.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setMoPhatHanh(true)}
                    className="w-full min-h-[46px] px-3 py-2.5 rounded-xl bg-luc text-white font-bold text-[13.5px] inline-flex items-center justify-center gap-2 shadow-2xs active:brightness-95 transition-all"
                  >
                    <UploadCloud size={16} strokeWidth={2.5} />
                    <span>Phát hành Snapshot lên CDN</span>
                  </button>
                </The>
              </div>
            )}

            {/* CÁC MỤC QUẢN LÝ DÀNH CHO QTV */}
            {laQtv && (
              <div className="space-y-2 pt-1">
                <h3 className="font-extrabold text-[15px] text-muc px-0.5">Quản trị hệ thống</h3>
                <div className="space-y-2">
                  <Link to={DUONG_DAN.nguoi()} className="block group">
                    <The className="p-3.5 flex items-center justify-between border border-vien/90 group-hover:border-xanh transition-all">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-lg bg-xanh-nhat text-xanh grid place-items-center shrink-0">
                          <Users size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-[14px] text-chu">Quản lý người dùng</p>
                          <p className="text-[11.5px] text-chu-phu">Thêm thành viên, phân quyền QTV và CTV</p>
                        </div>
                      </div>
                      <ChevronRight size={17} className="text-chu-phu group-hover:text-xanh group-hover:translate-x-0.5 transition-all" />
                    </The>
                  </Link>

                  <Link to={DUONG_DAN.phanCong()} className="block group">
                    <The className="p-3.5 flex items-center justify-between border border-vien/90 group-hover:border-xanh transition-all">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-lg bg-tim-nhat text-tim-chu grid place-items-center shrink-0">
                          <ListFilter size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-[14px] text-chu">Phân công trường phụ trách</p>
                          <p className="text-[11.5px] text-chu-phu">Gán danh sách trường cho từng tình nguyện viên</p>
                        </div>
                      </div>
                      <ChevronRight size={17} className="text-chu-phu group-hover:text-xanh group-hover:translate-x-0.5 transition-all" />
                    </The>
                  </Link>

                  <Link to={DUONG_DAN.nhatKy()} className="block group">
                    <The className="p-3.5 flex items-center justify-between border border-vien/90 group-hover:border-xanh transition-all">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-lg bg-cam-nhat text-cam-chu grid place-items-center shrink-0">
                          <History size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-[14px] text-chu">Nhật ký thao tác</p>
                          <p className="text-[11.5px] text-chu-phu">Lịch sử mọi hành động thêm, sửa, duyệt dữ liệu</p>
                        </div>
                      </div>
                      <ChevronRight size={17} className="text-chu-phu group-hover:text-xanh group-hover:translate-x-0.5 transition-all" />
                    </The>
                  </Link>
                </div>
              </div>
            )}

            {/* NẾU LÀ CTV: HƯỚNG DẪN & NHIỆM VỤ */}
            {!laQtv && (
              <div className="space-y-3 pt-1">
                <h3 className="font-extrabold text-[15px] text-muc px-0.5">Nhiệm vụ của bạn</h3>
                <The className="p-4 space-y-3 bg-gradient-to-br from-xanh-nhat/40 to-trang border-xanh/30 shadow-2xs">
                  <h4 className="font-bold text-[14px] text-muc">Quy trình đóng góp 3 bước:</h4>
                  <ul className="space-y-2 text-[12.5px] text-chu">
                    <li className="flex items-start gap-2">
                      <span className="size-5 rounded-full bg-xanh text-white font-bold text-[11px] grid place-items-center shrink-0">1</span>
                      <span>Vào tab <b>Trường</b>, chọn trường được phân công hoặc trường bạn có dữ liệu.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="size-5 rounded-full bg-xanh text-white font-bold text-[11px] grid place-items-center shrink-0">2</span>
                      <span>Nhập thông tin (Kênh, Học phí, Học bổng, Nơi lưu trú) kèm <b>link đề án/thông báo 2026</b>.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="size-5 rounded-full bg-xanh text-white font-bold text-[11px] grid place-items-center shrink-0">3</span>
                      <span>Bấm <b>Lưu & Gửi duyệt</b>. Quản trị viên (QTV) sẽ kiểm tra và xuất bản lên hệ thống cho học sinh.</span>
                    </li>
                  </ul>
                  <Link to={DUONG_DAN.truong()} className="block pt-1">
                    <Nut bieuTuong={School}>Bắt đầu nhập dữ liệu</Nut>
                  </Link>
                </The>
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

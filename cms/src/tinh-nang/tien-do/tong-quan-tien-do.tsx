import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChartNoAxesColumn, ArrowRight, CheckCircle2
} from "lucide-react";
import { truongTheoMa } from "@cms/du-lieu/danh-sach-truong";
import { DUONG_DAN } from "@cms/duong-dan";
import { layTienDo, thongBaoLoi, type TienDoApi } from "@cms/may-chu/api";
import { DauTrangChinh, NoiDung } from "@cms/thanh-phan/khung/khung-goc";
import { KhungDangTai, TrangThaiTrong } from "@cms/thanh-phan/ui/hien-thi";
import { Nut, The, gop } from "@cms/thanh-phan/ui/nut-the";
import { MUC_CAN_DU } from "@/data/dong-gop-kiem-tra";
import { tongHopTienDo, truongKeTiep } from "./tinh-tien-do";
import { nhanMuc } from "../truong/dinh-dang";

export default function TongQuanTienDo() {
  const nav = useNavigate();
  const [data, setData] = useState<TienDoApi | null>(null);
  const [cuaToi, setCuaToi] = useState(false);
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState<string | null>(null);

  const taiLai = async () => {
    try {
      setDangTai(true);
      const res = await layTienDo(cuaToi);
      setData(res);
      setDangTai(false);
    } catch (e) {
      setLoi(thongBaoLoi(e));
      setDangTai(false);
    }
  };

  useEffect(() => {
    taiLai();
  }, [cuaToi]);

  const ds = data?.truong ?? [];
  const thongKe = tongHopTienDo(ds);
  const keTiep = truongKeTiep(ds);

  return (
    <div className="space-y-4">
      <DauTrangChinh
        tieuDe="Tiến độ thu thập dữ liệu"
        moTa="Theo dõi tỷ lệ hoàn thiện các trường và tiếp tục điền dữ liệu"
      />

      <NoiDung>
        {/* Nút lọc Của tôi / Tất cả */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setCuaToi(false)}
            className={gop(
              "px-3 py-1.5 rounded-lg text-[13px] font-bold transition-all",
              !cuaToi ? "bg-xanh text-white shadow-sm" : "bg-nen text-chu hover:bg-nen-dam"
            )}
          >
            Tất cả 100 trường
          </button>
          <button
            type="button"
            onClick={() => setCuaToi(true)}
            className={gop(
              "px-3 py-1.5 rounded-lg text-[13px] font-bold transition-all",
              cuaToi ? "bg-xanh text-white shadow-sm" : "bg-nen text-chu hover:bg-nen-dam"
            )}
          >
            Được giao cho tôi
          </button>
        </div>

        {dangTai ? (
          <KhungDangTai soKhung={3} />
        ) : loi ? (
          <TrangThaiTrong bieuTuong={<ChartNoAxesColumn size={24} />} tieuDe="Không tải được tiến độ" moTa={loi} />
        ) : (
          <div className="space-y-4">

            {/* THẺ TỔNG QUAN TỶ LỆ */}
            <The className="bg-gradient-to-br from-xanh-nhat/40 to-trang border-xanh/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[12px] font-extrabold uppercase tracking-wider text-xanh">Tiến độ chung</span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-[32px] font-extrabold text-muc leading-none">{thongKe.phanTram}%</span>
                    <span className="text-[14px] font-bold text-chu-phu">({thongKe.du}/{thongKe.tong} trường đã đủ)</span>
                  </div>
                </div>
                <div className="size-12 rounded-full gd-xanh text-white grid place-items-center shadow-md">
                  <ChartNoAxesColumn size={24} />
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-nen-dam rounded-full h-3 overflow-hidden border border-vien">
                <div
                  className="h-full gd-xanh transition-all duration-500 rounded-full"
                  style={{ width: `${thongKe.phanTram}%` }}
                />
              </div>

              {/* Nút làm tiếp trường còn thiếu */}
              {keTiep && (
                <div className="pt-2">
                  <Nut
                    bieuTuong={ArrowRight}
                    onClick={() => nav(DUONG_DAN.chiTietTruong(keTiep.maTruong))}
                    className="w-full"
                  >
                    Điền tiếp: {keTiep.maTruong} ({truongTheoMa(keTiep.maTruong)?.ten ?? keTiep.maTruong})
                  </Nut>
                </div>
              )}
            </The>

            {/* THỐNG KÊ THEO MỤC */}
            <div className="space-y-2">
              <h3 className="font-extrabold text-[15px] text-muc">Số trường còn thiếu theo mục</h3>
              <div className="grid grid-cols-2 gap-2">
                {MUC_CAN_DU.map((m) => {
                  const thieuCount = thongKe.thieuTheoMuc[m] ?? 0;
                  const duCount = thongKe.tong - thieuCount;
                  return (
                    <The key={m} className="p-3">
                      <span className="font-bold text-[13px] text-chu block truncate">{nhanMuc(m)}</span>
                      <div className="flex items-baseline justify-between mt-1">
                        <span className="text-[18px] font-black text-muc">{duCount}/{thongKe.tong}</span>
                        {thieuCount > 0 ? (
                          <span className="text-[12px] font-bold text-cam-chu">Thiếu {thieuCount}</span>
                        ) : (
                          <span className="text-[12px] font-bold text-luc-chu flex items-center gap-0.5">
                            <CheckCircle2 size={12} /> Đủ
                          </span>
                        )}
                      </div>
                    </The>
                  );
                })}
              </div>
            </div>

            {/* DANH SÁCH CÁC TRƯỜNG CÒN THIẾU NHIỀU NHẤT */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-[15px] text-muc">Các trường cần bổ sung ({thongKe.conThieu.length})</h3>
                <Link to={DUONG_DAN.truong()} className="text-[13px] font-bold text-xanh hover:underline">
                  Xem tất cả
                </Link>
              </div>

              {thongKe.conThieu.length === 0 ? (
                <div className="p-4 bg-luc-nhat rounded-the text-center text-luc-chu font-bold">
                  🎉 Tuyệt vời! Tất cả các trường trong danh sách đều đã đủ dữ liệu.
                </div>
              ) : (
                <div className="space-y-2">
                  {thongKe.conThieu.slice(0, 10).map((t) => {
                    const truong = truongTheoMa(t.maTruong);
                    return (
                      <Link
                        key={t.maTruong}
                        to={DUONG_DAN.chiTietTruong(t.maTruong)}
                        className="block group"
                      >
                        <The className="p-3 group-hover:border-xanh transition-all">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-[14px] text-muc">{t.maTruong}</span>
                                <span className="text-[12px] text-chu-phu">({truong?.khuVuc})</span>
                              </div>
                              <p className="text-[13px] font-bold text-chu line-clamp-1">{truong?.ten}</p>
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {t.thieu.map((m) => (
                                  <span key={m} className="px-1.5 py-0.2 rounded bg-cam-nhat text-cam-chu text-[11px] font-semibold">
                                    {nhanMuc(m)}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <span className="text-[12px] font-bold text-xanh group-hover:underline shrink-0 mt-1">
                              Điền ngay →
                            </span>
                          </div>
                        </The>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </NoiDung>
    </div>
  );
}

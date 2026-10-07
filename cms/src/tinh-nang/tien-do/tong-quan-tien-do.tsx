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
import { The, gop } from "@cms/thanh-phan/ui/nut-the";
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
            <The className="bg-gradient-to-br from-xanh-nhat/40 to-trang border-xanh/30 p-4 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11.5px] font-extrabold uppercase tracking-wider text-xanh">Tiến độ thu thập</span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-[32px] font-black text-muc leading-none tracking-tight">{thongKe.phanTram}%</span>
                    <span className="text-[13px] font-bold text-chu-phu">({thongKe.du}/{thongKe.tong} trường đã đủ)</span>
                  </div>
                </div>
                <div className="size-11 rounded-xl gd-xanh text-white grid place-items-center shadow-xs">
                  <ChartNoAxesColumn size={22} strokeWidth={2.5} />
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-nen-dam rounded-full h-2.5 overflow-hidden border border-vien/60">
                <div
                  className="h-full gd-xanh transition-all duration-500 rounded-full"
                  style={{ width: `${thongKe.phanTram}%` }}
                />
              </div>

              {/* Nút làm tiếp trường còn thiếu */}
              {keTiep && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => nav(DUONG_DAN.chiTietTruong(keTiep.maTruong))}
                    className="w-full min-h-[46px] px-3.5 py-2.5 rounded-xl gd-xanh text-white font-bold text-[13.5px] inline-flex items-center justify-center gap-2 shadow-nut active:scale-[0.99] transition-transform"
                  >
                    <span>Điền tiếp: {keTiep.maTruong}</span>
                    <ArrowRight size={16} strokeWidth={2.5} />
                  </button>
                </div>
              )}
            </The>

            {/* THỐNG KÊ THEO MỤC */}
            <div className="space-y-2 pt-0.5">
              <h3 className="font-extrabold text-[15px] text-muc px-0.5">Tình trạng theo từng mục</h3>
              <div className="grid grid-cols-2 gap-2">
                {MUC_CAN_DU.map((m) => {
                  const thieuCount = thongKe.thieuTheoMuc[m] ?? 0;
                  const duCount = thongKe.tong - thieuCount;
                  const duPhanTram = Math.round((duCount / (thongKe.tong || 1)) * 100);
                  return (
                    <The key={m} className="p-3 space-y-1.5 border border-vien/80 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[13px] text-chu truncate">{nhanMuc(m)}</span>
                        {thieuCount === 0 ? (
                          <span className="text-[11px] font-bold text-luc-chu flex items-center gap-0.5">
                            <CheckCircle2 size={11} strokeWidth={2.5} /> Đủ
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-cam-chu">Thiếu {thieuCount}</span>
                        )}
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-[17px] font-black text-muc leading-none">{duCount}/{thongKe.tong}</span>
                        <span className="text-[11px] font-bold text-chu-phu">{duPhanTram}%</span>
                      </div>
                      <div className="w-full bg-nen-dam rounded-full h-1.5 overflow-hidden">
                        <div
                          className={gop("h-full rounded-full transition-all", thieuCount === 0 ? "bg-luc" : "bg-xanh")}
                          style={{ width: `${duPhanTram}%` }}
                        />
                      </div>
                    </The>
                  );
                })}
              </div>
            </div>

            {/* DANH SÁCH CÁC TRƯỜNG CẦN BỔ SUNG */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between px-0.5">
                <h3 className="font-extrabold text-[15px] text-muc">Trường cần bổ sung ({thongKe.conThieu.length})</h3>
                <Link to={DUONG_DAN.truong()} className="text-[12.5px] font-bold text-xanh hover:underline">
                  Xem tất cả
                </Link>
              </div>

              {thongKe.conThieu.length === 0 ? (
                <div className="p-4 bg-luc-nhat/80 rounded-xl text-center text-luc-chu font-bold text-[13.5px] border border-luc/30">
                  🎉 Tuyệt vời! Tất cả các trường đã đủ 100% dữ liệu.
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
                        <The className="p-3 flex items-center justify-between gap-2 border border-vien/90 group-hover:border-xanh transition-all">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-[14px] text-muc">{t.maTruong}</span>
                              <span className="text-[13px] font-bold text-chu truncate">{truong?.ten ?? t.maTruong}</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-1 mt-1">
                              <span className="text-[11px] text-chu-phu">Thiếu:</span>
                              {t.thieu.map((m) => (
                                <span key={m} className="px-1.5 py-0.2 rounded bg-cam-nhat text-cam-chu text-[10.5px] font-bold">
                                  {nhanMuc(m)}
                                </span>
                              ))}
                            </div>
                          </div>
                          <ArrowRight size={15} className="text-chu-phu group-hover:text-xanh group-hover:translate-x-0.5 transition-all shrink-0" />
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



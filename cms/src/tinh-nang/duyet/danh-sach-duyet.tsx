import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Check, X, ExternalLink, Sparkles } from "lucide-react";
import { truongTheoMa } from "@cms/du-lieu/danh-sach-truong";
import { DUONG_DAN } from "@cms/duong-dan";
import {
  layTrangThongTin, suaThongTin, layToi, thongBaoLoi,
  type ThongTinCms, type Toi
} from "@cms/may-chu/api";
import { DauTrangChinh, NoiDung } from "@cms/thanh-phan/khung/khung-goc";
import { KhungDangTai, HopTruot, TrangThaiTrong } from "@cms/thanh-phan/ui/hien-thi";
import { OTextArea, Truong } from "@cms/thanh-phan/ui/nhap-lieu";
import { Nut, The, Nhan, gop } from "@cms/thanh-phan/ui/nut-the";
import { DongThongBao } from "@cms/thanh-phan/ui/thong-bao";
import {
  tieuDeBanGhi, dongNoiDung, nhanLoai, dinhDangLuc,
  NHAN_TRANG_THAI, TONE_TRANG_THAI
} from "../truong/dinh-dang";

export default function DanhSachDuyet() {
  const [danhSach, setDanhSach] = useState<ThongTinCms[]>([]);
  const [toi, setToi] = useState<Toi | null>(null);
  const [dangTai, setDangTai] = useState(true);
  const [thongBao, setThongBao] = useState<string | null>(null);
  const [loi, setLoi] = useState<string | null>(null);

  const [locTrangThai, setLocTrangThai] = useState<"cho" | "nhap" | "duyet">("cho");

  // Từ chối modal
  const [tuChoiItem, setTuChoiItem] = useState<ThongTinCms | null>(null);
  const [lyDoTuChoi, setLyDoTuChoi] = useState("");
  const [dangXuLy, setDangXuLy] = useState(false);

  const taiLai = async () => {
    try {
      setDangTai(true);
      const [res, t] = await Promise.all([
        layTrangThongTin(1, { trangThai: locTrangThai }),
        layToi().catch(() => ({ email: "", vaiTro: "ctv" as const, truongDuocGiao: [] })),
      ]);
      setDanhSach(res.muc);
      setToi(t);
      setDangTai(false);
    } catch (e) {
      setLoi(thongBaoLoi(e));
      setDangTai(false);
    }
  };

  useEffect(() => {
    taiLai();
  }, [locTrangThai]);

  const duyetNhanh = async (item: ThongTinCms) => {
    try {
      setDangXuLy(true);
      await suaThongTin(item.id, {
        phienBan: item.phienBan ?? 1,
        trangThai: "duyet",
      });
      setThongBao(`Đã duyệt bản ghi ${nhanLoai(item.loai)} của trường ${item.maTruong}.`);
      taiLai();
    } catch (e) {
      setThongBao(thongBaoLoi(e));
    } finally {
      setDangXuLy(false);
    }
  };

  const xacNhanTuChoi = async () => {
    if (!tuChoiItem) return;
    try {
      setDangXuLy(true);
      await suaThongTin(tuChoiItem.id, {
        phienBan: tuChoiItem.phienBan ?? 1,
        trangThai: "nhap",
        lyDo: lyDoTuChoi.trim() || "Cần bổ sung thêm thông tin hoặc nguồn kiểm chứng.",
      });
      setThongBao(`Đã trả bản ghi về trạng thái nháp kèm lý do.`);
      setTuChoiItem(null);
      setLyDoTuChoi("");
      taiLai();
    } catch (e) {
      setThongBao(thongBaoLoi(e));
    } finally {
      setDangXuLy(false);
    }
  };

  const laQtv = toi?.vaiTro === "qtv";

  return (
    <div className="space-y-4">
      <DauTrangChinh
        tieuDe="Phê duyệt nội dung"
        moTa={laQtv ? "Xem xét và duyệt các thông tin do cộng đồng & CTV đóng góp" : "Theo dõi các bản ghi của bạn gửi duyệt"}
      />

      <NoiDung>
        {thongBao && (
          <DongThongBao tieuDe={thongBao} tone="luc" onClick={() => setThongBao(null)} />
        )}

        {/* Tab lọc trạng thái */}
        <div className="flex gap-2 border-b border-vien pb-2">
          <button
            type="button"
            onClick={() => setLocTrangThai("cho")}
            className={gop(
              "px-3 py-1.5 rounded-lg text-[13px] font-bold transition-all",
              locTrangThai === "cho" ? "bg-cam-nhat text-cam-chu" : "text-chu-phu hover:text-chu"
            )}
          >
            Chờ duyệt {locTrangThai === "cho" ? `(${danhSach.length})` : ""}
          </button>
          <button
            type="button"
            onClick={() => setLocTrangThai("duyet")}
            className={gop(
              "px-3 py-1.5 rounded-lg text-[13px] font-bold transition-all",
              locTrangThai === "duyet" ? "bg-luc-nhat text-luc-chu" : "text-chu-phu hover:text-chu"
            )}
          >
            Đã duyệt
          </button>
          <button
            type="button"
            onClick={() => setLocTrangThai("nhap")}
            className={gop(
              "px-3 py-1.5 rounded-lg text-[13px] font-bold transition-all",
              locTrangThai === "nhap" ? "bg-nen-dam text-chu" : "text-chu-phu hover:text-chu"
            )}
          >
            Nháp / Bị từ chối
          </button>
        </div>

        {dangTai ? (
          <KhungDangTai soKhung={3} />
        ) : loi ? (
          <TrangThaiTrong bieuTuong={<Sparkles size={24} />} tieuDe="Không tải được dữ liệu" moTa={loi} />
        ) : danhSach.length === 0 ? (
          <TrangThaiTrong
            bieuTuong={<Sparkles size={28} className="text-chu-phu" />}
            tieuDe={locTrangThai === "cho" ? "Không có bản ghi nào chờ duyệt" : "Không có bản ghi"}
            moTa="Mọi thông tin đóng góp đã được xử lý xong!"
          />

        ) : (
          <div className="space-y-3">
            {danhSach.map((item) => {
              const truong = truongTheoMa(item.maTruong);
              const lines = dongNoiDung(item);
              const tone = TONE_TRANG_THAI[item.trangThai];
              return (
                <The key={item.id} className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Link
                          to={DUONG_DAN.chiTietTruong(item.maTruong)}
                          className="font-extrabold text-[15px] text-xanh hover:underline"
                        >
                          {item.maTruong} · {truong?.ten ?? item.maTruong}
                        </Link>
                        <Nhan tone={tone}>{NHAN_TRANG_THAI[item.trangThai]}</Nhan>
                      </div>
                      <h4 className="font-bold text-[14px] text-muc">{tieuDeBanGhi(item)}</h4>
                      <p className="text-[12px] text-chu-phu">
                        Gửi lúc {dinhDangLuc(item.luc)}
                        {item.nguonGui && ` · Qua ${item.nguonGui}`}
                      </p>
                    </div>
                  </div>

                  <div className="text-[13px] text-chu space-y-1 bg-nen p-3 rounded-lg border border-vien">
                    {lines.map((l, i) => (
                      <p key={i} className="leading-relaxed">{l}</p>
                    ))}
                  </div>

                  {item.linkNguon && (
                    <div className="text-[12px] text-chu-phu flex items-center gap-1">
                      <span>Nguồn kiểm chứng:</span>
                      <a
                        href={item.linkNguon}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xanh hover:underline truncate max-w-[260px] inline-flex items-center gap-1"
                      >
                        {item.linkNguon} <ExternalLink size={12} />
                      </a>
                    </div>
                  )}

                  {item.lyDoTuChoi && (
                    <div className="p-2 bg-do-nhat rounded text-[12px] text-do-chu">
                      <b>Lý do trả về:</b> {item.lyDoTuChoi}
                    </div>
                  )}

                  {/* Nút hành động phê duyệt */}
                  {laQtv && locTrangThai === "cho" && (
                    <div className="pt-2 flex gap-2 border-t border-vien">
                      <Nut
                        bieuTuong={Check}
                        onClick={() => duyetNhanh(item)}
                        disabled={dangXuLy}
                        className="flex-1"
                      >
                        Duyệt bài
                      </Nut>
                      <Nut
                        kieu="nguyHiem"
                        bieuTuong={X}
                        onClick={() => setTuChoiItem(item)}
                        disabled={dangXuLy}
                        className="flex-1"
                      >
                        Trả về nháp
                      </Nut>
                    </div>
                  )}
                </The>
              );
            })}
          </div>
        )}
      </NoiDung>

      {/* HOP TRUOT TU CHOI */}
      <HopTruot
        mo={tuChoiItem !== null}
        dong={() => setTuChoiItem(null)}
        tieuDe="Trả bản ghi về nháp"
      >
        <div className="space-y-4 pb-4">
          <p className="text-[14px] text-chu">
            Ghi rõ lý do từ chối để người đóng góp hoặc CTV biết và cập nhật lại chính xác.
          </p>
          <Truong nhan="Lý do từ chối / góp ý">
            <OTextArea
              value={lyDoTuChoi}
              onChange={(e) => setLyDoTuChoi(e.target.value)}
              placeholder="VD: Link nguồn chưa đúng quy chế 2026, mức học phí cần ghi rõ theo năm..."
              hang={3}
            />
          </Truong>
          <div className="flex flex-col gap-2">
            <Nut kieu="nguyHiem" onClick={xacNhanTuChoi} disabled={dangXuLy}>
              Xác nhận trả về nháp
            </Nut>
            <Nut kieu="vien" onClick={() => setTuChoiItem(null)}>Hủy</Nut>
          </div>
        </div>
      </HopTruot>
    </div>
  );
}

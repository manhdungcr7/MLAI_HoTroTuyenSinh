import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Globe, MessageSquare, Plus, Pencil,
  AlertCircle, ExternalLink, Save, Share2
} from "lucide-react";
import { truongTheoMa } from "@cms/du-lieu/danh-sach-truong";
import { DUONG_DAN } from "@cms/duong-dan";
import {
  layChiTietTruong, layToi, luuKenh, taoThongTin, suaThongTin,
  thongBaoLoi, type ChiTietTruongApi, type ThongTinCms, type Toi
} from "@cms/may-chu/api";
import { DauTrangCoQuayLai, NoiDung } from "@cms/thanh-phan/khung/khung-goc";
import { KhungDangTai, HopTruot, TrangThaiTrong } from "@cms/thanh-phan/ui/hien-thi";
import { OInput, OTextArea, OChon, Truong } from "@cms/thanh-phan/ui/nhap-lieu";
import { Nut, The, Nhan } from "@cms/thanh-phan/ui/nut-the";
import { DongThongBao } from "@cms/thanh-phan/ui/thong-bao";
import type { TrangThaiBai } from "@/data/dong-gop-kiem-tra";
import {
  FORM_TRONG, LOAI_THEM_TAY, formTuBanGhi, formTrong, kiemTraForm, bodyTuForm,
  loiO, loiChung, CAC_O_FORM, type FormThongTin, type LoaiThemTay,
} from "./bieu-mau";
import {
  tieuDeBanGhi, dongNoiDung, nhanLoai, NHAN_TRANG_THAI, TONE_TRANG_THAI, dinhDangLuc,
} from "./dinh-dang";

export default function ChiTietTruong() {
  const { ma = "" } = useParams<{ ma: string }>();
  const truong = truongTheoMa(ma);

  const [data, setData] = useState<ChiTietTruongApi | null>(null);
  const [toi, setToi] = useState<Toi | null>(null);
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState<string | null>(null);
  const [thongBao, setThongBao] = useState<string | null>(null);

  // Kênh form state
  const [suaKenh, setSuaKenh] = useState(false);
  const [formKenh, setFormKenh] = useState({
    fanpageUrl: "",
    websiteTuyenSinhUrl: "",
    nhomTuyenSinhChinhThucUrl: "",
    nhomCongDongUrl: "",
    ghiChu: "",
  });
  const [dangLuuKenh, setDangLuuKenh] = useState(false);

  // Thêm / Sửa bản ghi
  const [moModal, setMoModal] = useState(false);
  const [loaiChon, setLoaiChon] = useState<LoaiThemTay>("hoc_phi");
  const [dangSuaId, setDangSuaId] = useState<string | null>(null);
  const [formTT, setFormTT] = useState<FormThongTin>(FORM_TRONG);
  const [loiForm, setLoiForm] = useState<Record<string, string>>({});
  const [dangLuuTT, setDangLuuTT] = useState(false);

  const taiLai = async () => {
    try {
      setDangTai(true);
      const [res, t] = await Promise.all([layChiTietTruong(ma), layToi()]);
      setData(res);
      setToi(t);
      if (res.kenh) {
        setFormKenh({
          fanpageUrl: res.kenh.fanpageUrl ?? "",
          websiteTuyenSinhUrl: res.kenh.websiteTuyenSinhUrl ?? "",
          nhomTuyenSinhChinhThucUrl: res.kenh.nhomTuyenSinhChinhThucUrl ?? "",
          nhomCongDongUrl: res.kenh.nhomCongDongUrl ?? "",
          ghiChu: res.kenh.ghiChu ?? "",
        });
      }
      setDangTai(false);
    } catch (e) {
      setLoi(thongBaoLoi(e));
      setDangTai(false);
    }
  };

  useEffect(() => {
    if (ma) taiLai();
  }, [ma]);

  const luuKenhAction = async () => {
    try {
      setDangLuuKenh(true);
      await luuKenh(ma, formKenh);
      setSuaKenh(false);
      setThongBao("Đã lưu kênh thông tin trường thành công.");
      taiLai();
    } catch (e) {
      setThongBao(thongBaoLoi(e));
    } finally {
      setDangLuuKenh(false);
    }
  };

  const moThemMoi = (loai: LoaiThemTay) => {
    setDangSuaId(null);
    setLoaiChon(loai);
    setFormTT(formTrong(loai));
    setLoiForm({});
    setMoModal(true);
  };

  const moSuaBanGhi = (bg: ThongTinCms) => {
    setDangSuaId(bg.id);
    setLoaiChon(bg.loai as LoaiThemTay);
    setFormTT(formTuBanGhi(bg));
    setLoiForm({});
    setMoModal(true);
  };

  const luuBanGhiAction = async (trangThaiGui: TrangThaiBai = "cho") => {
    const errs = kiemTraForm(loaiChon, formTT);
    if (Object.keys(errs).length > 0) {
      setLoiForm(errs);
      return;
    }

    try {
      setDangLuuTT(true);
      const b = bodyTuForm(loaiChon, formTT);
      if (dangSuaId) {
        const bgCu = data?.thongTin.find((t: ThongTinCms) => t.id === dangSuaId);
        await suaThongTin(dangSuaId, {
          phienBan: bgCu?.phienBan ?? 1,
          nam: typeof b.nam === "number" ? b.nam : undefined,
          linkNguon: b.linkNguon,
          duLieu: b.duLieu,
          trangThai: trangThaiGui,
        });
        setThongBao("Đã cập nhật thông tin thành công.");
      } else {
        await taoThongTin({
          maTruong: ma,
          loai: loaiChon,
          nam: typeof b.nam === "number" ? b.nam : undefined,
          linkNguon: b.linkNguon,
          duLieu: b.duLieu,
          trangThai: trangThaiGui === "nhap" ? "nhap" : "cho",
        });
        setThongBao("Đã thêm thông tin mới thành công.");
      }
      setMoModal(false);
      taiLai();
    } catch (e) {
      setThongBao(thongBaoLoi(e));
    } finally {
      setDangLuuTT(false);
    }
  };

  if (!truong) {
    return (
      <div className="p-4 space-y-4">
        <DauTrangCoQuayLai tieuDe="Không tìm thấy trường" quayLai={DUONG_DAN.truong()} />
        <TrangThaiTrong bieuTuong={<AlertCircle size={24} />} tieuDe="Mã trường không tồn tại" moTa={`Không tìm thấy trường có mã ${ma}.`} />
      </div>
    );
  }

  const laQtv = toi?.vaiTro === "qtv";

  return (
    <div className="space-y-4">
      <DauTrangCoQuayLai
        tieuDe={`${truong.ma} · ${truong.ten}`}
        quayLai={DUONG_DAN.truong()}
      />

      <NoiDung>
        {thongBao && (
          <DongThongBao
            tieuDe={thongBao}
            tone="luc"
            onClick={() => setThongBao(null)}
          />
        )}


        {dangTai ? (
          <KhungDangTai soKhung={3} />
        ) : loi ? (
          <TrangThaiTrong
            bieuTuong={<AlertCircle size={28} className="text-do-chu" />}
            tieuDe="Lỗi nạp dữ liệu"
            moTa={loi}
          />
        ) : (
          <div className="space-y-5">
            {/* KHỐI 1: KÊNH THÔNG TIN TRƯỜNG */}
            <The className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-[16px] text-muc flex items-center gap-2">
                  <Globe size={18} className="text-xanh" /> Kênh chính thức & Cộng đồng
                </h3>
                <button
                  type="button"
                  onClick={() => setSuaKenh(!suaKenh)}
                  className="text-[13px] font-bold text-xanh hover:underline flex items-center gap-1"
                >
                  <Pencil size={14} /> {suaKenh ? "Đóng" : "Chỉnh sửa"}
                </button>
              </div>

              {suaKenh ? (
                <div className="space-y-3 pt-2">
                  <Truong nhan="Website Tuyển sinh (URL)" batBuoc={false}>
                    <OInput
                      value={formKenh.websiteTuyenSinhUrl}
                      onChange={(e) => setFormKenh({ ...formKenh, websiteTuyenSinhUrl: e.target.value })}
                      placeholder="https://tuyensinh.uit.edu.vn"
                    />
                  </Truong>
                  <Truong nhan="Fanpage Facebook (URL)" batBuoc={false}>
                    <OInput
                      value={formKenh.fanpageUrl}
                      onChange={(e) => setFormKenh({ ...formKenh, fanpageUrl: e.target.value })}
                      placeholder="https://facebook.com/uit.edu.vn"
                    />
                  </Truong>
                  <Truong nhan="Nhóm Tuyển sinh chính thức (Zalo/Facebook)" batBuoc={false}>
                    <OInput
                      value={formKenh.nhomTuyenSinhChinhThucUrl}
                      onChange={(e) => setFormKenh({ ...formKenh, nhomTuyenSinhChinhThucUrl: e.target.value })}
                      placeholder="https://zalo.me/g/..."
                    />
                  </Truong>
                  <Truong nhan="Nhóm Cộng đồng sinh viên / KTX (URL)" batBuoc={false}>
                    <OInput
                      value={formKenh.nhomCongDongUrl}
                      onChange={(e) => setFormKenh({ ...formKenh, nhomCongDongUrl: e.target.value })}
                      placeholder="https://facebook.com/groups/..."
                    />
                  </Truong>
                  <Truong nhan="Ghi chú thêm về kênh" batBuoc={false}>
                    <OInput
                      value={formKenh.ghiChu}
                      onChange={(e) => setFormKenh({ ...formKenh, ghiChu: e.target.value })}
                      placeholder="Kênh chính xác tuyển sinh 2026..."
                    />
                  </Truong>
                  <div className="pt-2 flex gap-2">
                    <Nut onClick={luuKenhAction} disabled={dangLuuKenh} bieuTuong={Save}>
                      Lưu kênh
                    </Nut>
                    <Nut kieu="vien" onClick={() => setSuaKenh(false)}>Hủy</Nut>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-[14px]">
                  <div className="flex items-center gap-2">
                    <Globe size={16} className="text-chu-phu shrink-0" />
                    <span className="text-chu-phu font-medium min-w-[90px]">Website:</span>
                    {formKenh.websiteTuyenSinhUrl ? (
                      <a href={formKenh.websiteTuyenSinhUrl} target="_blank" rel="noreferrer" className="text-xanh hover:underline truncate inline-flex items-center gap-1">
                        {formKenh.websiteTuyenSinhUrl} <ExternalLink size={12} />
                      </a>
                    ) : (
                      <span className="text-chu-phu italic">Chưa có</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Share2 size={16} className="text-chu-phu shrink-0" />
                    <span className="text-chu-phu font-medium min-w-[90px]">Fanpage:</span>
                    {formKenh.fanpageUrl ? (
                      <a href={formKenh.fanpageUrl} target="_blank" rel="noreferrer" className="text-xanh hover:underline truncate inline-flex items-center gap-1">
                        {formKenh.fanpageUrl} <ExternalLink size={12} />
                      </a>
                    ) : (
                      <span className="text-chu-phu italic">Chưa có</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageSquare size={16} className="text-chu-phu shrink-0" />
                    <span className="text-chu-phu font-medium min-w-[90px]">Nhóm TV:</span>
                    {formKenh.nhomTuyenSinhChinhThucUrl ? (
                      <a href={formKenh.nhomTuyenSinhChinhThucUrl} target="_blank" rel="noreferrer" className="text-xanh hover:underline truncate inline-flex items-center gap-1">
                        {formKenh.nhomTuyenSinhChinhThucUrl} <ExternalLink size={12} />
                      </a>
                    ) : (
                      <span className="text-chu-phu italic">Chưa có</span>
                    )}
                  </div>
                </div>
              )}
            </The>

            {/* KHỐI 2: CÁC MỤC THÔNG TIN (Học phí, Học bổng, Nơi lưu trú, Review, Lưu ý) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-[17px] text-muc">Nội dung đóng góp</h3>
                <div className="flex gap-1">
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        moThemMoi(e.target.value as LoaiThemTay);
                        e.target.value = "";
                      }
                    }}
                    className="bg-xanh text-white rounded-lg px-2.5 py-1 text-[13px] font-bold cursor-pointer"
                    defaultValue=""
                  >
                    <option value="" disabled>+ Thêm mục...</option>
                    {LOAI_THEM_TAY.map((l) => (
                      <option key={l} value={l}>{nhanLoai(l)}</option>
                    ))}
                  </select>
                </div>
              </div>

              {LOAI_THEM_TAY.map((loai) => {
                const ds = (data?.thongTin ?? []).filter((t: ThongTinCms) => t.loai === loai);
                return (
                  <div key={loai} className="space-y-2">
                    <div className="flex items-center justify-between pt-2">
                      <span className="font-extrabold text-[15px] text-chu flex items-center gap-2">
                        {nhanLoai(loai)}
                        <span className="text-[12px] font-normal text-chu-phu">({ds.length} bản ghi)</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => moThemMoi(loai)}
                        className="text-[12px] font-bold text-xanh hover:underline inline-flex items-center gap-0.5"
                      >
                        <Plus size={14} /> Thêm {nhanLoai(loai).toLowerCase()}
                      </button>
                    </div>

                    {ds.length === 0 ? (
                      <div className="p-3 bg-nen rounded-the text-[13px] text-chu-phu italic border border-dashed border-vien">
                        Chưa có dữ liệu {nhanLoai(loai).toLowerCase()} cho trường này.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {ds.map((item: ThongTinCms) => {
                          const lines = dongNoiDung(item);
                          const tone = TONE_TRANG_THAI[item.trangThai];
                          return (
                            <The key={item.id} className="space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <span className="font-bold text-[14px] text-muc">{tieuDeBanGhi(item)}</span>
                                    <Nhan tone={tone}>{NHAN_TRANG_THAI[item.trangThai]}</Nhan>
                                    {item.nguonGui && <span className="text-[11px] text-chu-phu">({item.nguonGui})</span>}
                                  </div>
                                  <p className="text-[12px] text-chu-phu">{dinhDangLuc(item.luc)}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => moSuaBanGhi(item)}
                                  className="text-[12px] font-bold text-xanh hover:underline p-1 shrink-0"
                                >
                                  Sửa
                                </button>
                              </div>

                              <div className="text-[13px] text-chu space-y-1 bg-nen p-2.5 rounded-lg">
                                {lines.map((l, i) => (
                                  <p key={i} className="leading-relaxed">{l}</p>
                                ))}
                              </div>

                              {item.linkNguon && (
                                <p className="text-[12px] text-chu-phu truncate">
                                  Nguồn: <a href={item.linkNguon} target="_blank" rel="noreferrer" className="text-xanh hover:underline inline-flex items-center gap-0.5">{item.linkNguon} <ExternalLink size={10} /></a>
                                </p>
                              )}
                            </The>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </NoiDung>

      {/* MODAL THÊM / SỬA BẢN GHI */}
      <HopTruot
        mo={moModal}
        dong={() => setMoModal(false)}
        tieuDe={dangSuaId ? `Sửa ${nhanLoai(loaiChon)}` : `Thêm ${nhanLoai(loaiChon)}`}
      >
        <div className="space-y-3.5 pb-4">
          {/* Form theo loại */}
          {loaiChon === "hoc_phi" && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <Truong nhan="Năm học bắt đầu" loi={loiO(loiForm, "nam")}>
                  <OInput
                    value={formTT.nam}
                    onChange={(e) => setFormTT({ ...formTT, nam: e.target.value })}
                    placeholder="2026"
                  />
                </Truong>
                <Truong nhan="Đơn vị" loi={loiO(loiForm, "donVi")}>
                  <OChon
                    value={formTT.donVi}
                    onChange={(e) => setFormTT({ ...formTT, donVi: e.target.value })}
                  >
                    <option value="trieu_nam">triệu / năm</option>
                    <option value="trieu_tin_chi">triệu / tín chỉ</option>
                  </OChon>
                </Truong>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Truong nhan="Mức thấp (triệu)" loi={loiO(loiForm, "mucThap")}>
                  <OInput
                    value={formTT.mucThap}
                    onChange={(e) => setFormTT({ ...formTT, mucThap: e.target.value })}
                    placeholder="30"
                  />
                </Truong>
                <Truong nhan="Mức cao (triệu)" loi={loiO(loiForm, "mucCao")}>
                  <OInput
                    value={formTT.mucCao}
                    onChange={(e) => setFormTT({ ...formTT, mucCao: e.target.value })}
                    placeholder="45"
                  />
                </Truong>
              </div>
              <Truong nhan="Phạm vi chương trình áp dụng" loi={loiO(loiForm, "phamVi")}>
                <OInput
                  value={formTT.phamVi}
                  onChange={(e) => setFormTT({ ...formTT, phamVi: e.target.value })}
                  placeholder="Chương trình chuẩn / Chất lượng cao..."
                />
              </Truong>
              <Truong nhan="Lộ trình tăng học phí" loi={loiO(loiForm, "loTrinhTang")} batBuoc={false}>
                <OInput
                  value={formTT.loTrinhTang}
                  onChange={(e) => setFormTT({ ...formTT, loTrinhTang: e.target.value })}
                  placeholder="Tối đa 10% mỗi năm theo quy định..."
                />
              </Truong>
            </>
          )}

          {loaiChon === "hoc_bong" && (
            <>
              <Truong nhan="Tên học bổng" loi={loiO(loiForm, "ten")}>
                <OInput
                  value={formTT.ten}
                  onChange={(e) => setFormTT({ ...formTT, ten: e.target.value })}
                  placeholder="Học bổng Khuyến khích tài năng..."
                />
              </Truong>
              <Truong nhan="Giá trị học bổng" loi={loiO(loiForm, "giaTri")}>
                <OInput
                  value={formTT.giaTri}
                  onChange={(e) => setFormTT({ ...formTT, giaTri: e.target.value })}
                  placeholder="100% học phí năm 1 hoặc 20 triệu..."
                />
              </Truong>
              <Truong nhan="Điều kiện xét tuyển" loi={loiO(loiForm, "dieuKien")}>
                <OTextArea
                  value={formTT.dieuKien}
                  onChange={(e) => setFormTT({ ...formTT, dieuKien: e.target.value })}
                  placeholder="Đạt điểm thi tốt nghiệp THPT từ 27.0 trở lên..."
                />
              </Truong>
            </>
          )}

          {loaiChon === "noi_luu_tru" && (
            <>
              <Truong nhan="Ký túc xá" loi={loiO(loiForm, "coKyTucXa")}>
                <OChon
                  value={formTT.coKyTucXa}
                  onChange={(e) => setFormTT({ ...formTT, coKyTucXa: e.target.value })}
                >
                  <option value="">Chọn tình trạng KTX...</option>
                  <option value="co">Có ký túc xá</option>
                  <option value="khong">Không có ký túc xá</option>
                  <option value="chua_ro">Chưa rõ</option>
                </OChon>
              </Truong>
              <div className="grid grid-cols-2 gap-2">
                <Truong nhan="KTX thấp (nghìn/tháng)" loi={loiO(loiForm, "ktxThap")} batBuoc={false}>
                  <OInput
                    value={formTT.ktxThap}
                    onChange={(e) => setFormTT({ ...formTT, ktxThap: e.target.value })}
                    placeholder="250"
                  />
                </Truong>
                <Truong nhan="KTX cao (nghìn/tháng)" loi={loiO(loiForm, "ktxCao")} batBuoc={false}>
                  <OInput
                    value={formTT.ktxCao}
                    onChange={(e) => setFormTT({ ...formTT, ktxCao: e.target.value })}
                    placeholder="800"
                  />
                </Truong>
              </div>
              <Truong nhan="Khu trọ xung quanh trường" loi={loiO(loiForm, "khuTro")}>
                <OChon
                  value={formTT.khuTro}
                  onChange={(e) => setFormTT({ ...formTT, khuTro: e.target.value })}
                >
                  <option value="">Chọn tình trạng khu trọ...</option>
                  <option value="nhieu">Nhiều khu trọ</option>
                  <option value="it">Ít khu trọ</option>
                  <option value="khong">Không có</option>
                  <option value="chua_ro">Chưa rõ</option>
                </OChon>
              </Truong>
              <div className="grid grid-cols-2 gap-2">
                <Truong nhan="Trọ thấp (nghìn/tháng)" loi={loiO(loiForm, "troThap")} batBuoc={false}>
                  <OInput
                    value={formTT.troThap}
                    onChange={(e) => setFormTT({ ...formTT, troThap: e.target.value })}
                    placeholder="1500"
                  />
                </Truong>
                <Truong nhan="Trọ cao (nghìn/tháng)" loi={loiO(loiForm, "troCao")} batBuoc={false}>
                  <OInput
                    value={formTT.troCao}
                    onChange={(e) => setFormTT({ ...formTT, troCao: e.target.value })}
                    placeholder="3500"
                  />
                </Truong>
              </div>
            </>
          )}

          {(loaiChon === "review" || loaiChon === "luu_y") && (
            <>
              <Truong nhan="Tiêu đề" loi={loiO(loiForm, "tieuDe")}>
                <OInput
                  value={formTT.tieuDe}
                  onChange={(e) => setFormTT({ ...formTT, tieuDe: e.target.value })}
                  placeholder="Ví dụ: Đánh giá môi trường năng động, nhiều CLB..."
                />
              </Truong>
              <Truong nhan="Nội dung chi tiết" loi={loiO(loiForm, "noiDung")}>
                <OTextArea
                  value={formTT.noiDung}
                  onChange={(e) => setFormTT({ ...formTT, noiDung: e.target.value })}
                  placeholder="Ghi nhận thực tế từ sinh viên đang theo học..."
                  hang={4}
                />
              </Truong>
            </>
          )}

          {/* Nguồn link chung */}
          <Truong nhan="Link nguồn kiểm chứng (.edu.vn, đề án, fanpage)" loi={loiO(loiForm, "linkNguon")} batBuoc={loaiChon === "hoc_phi" || loaiChon === "hoc_bong"}>
            <OInput
              value={formTT.linkNguon}
              onChange={(e) => setFormTT({ ...formTT, linkNguon: e.target.value })}
              placeholder="https://tuyensinh.uit.edu.vn/..."
            />
          </Truong>

          {/* Lỗi chung nếu có */}
          {loiChung(loiForm, CAC_O_FORM[loaiChon]).length > 0 && (
            <div className="p-2.5 bg-do-nhat rounded-lg border border-do/20 text-[13px] text-do-chu">
              {loiChung(loiForm, CAC_O_FORM[loaiChon]).map((msg: string, i: number) => (
                <p key={i}>• {msg}</p>
              ))}
            </div>
          )}


          {/* Nút hành động */}
          <div className="pt-3 flex flex-col gap-2">
            <Nut onClick={() => luuBanGhiAction("cho")} disabled={dangLuuTT}>
              {dangSuaId ? "Lưu và Gửi duyệt" : "Tạo và Gửi duyệt"}
            </Nut>
            {laQtv && (
              <Nut kieu="nhe" onClick={() => luuBanGhiAction("duyet")} disabled={dangLuuTT}>
                Duyệt trực tiếp (Quản trị viên)
              </Nut>
            )}
            <Nut kieu="vien" onClick={() => setMoModal(false)}>Hủy</Nut>
          </div>
        </div>
      </HopTruot>
    </div>
  );
}

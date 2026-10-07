// Biểu mẫu thêm/sửa một mục thông tin trường (học phí, học bổng, nơi ở, đánh giá, lưu ý), lưu thành bản ghi CMS.
// Nguồn (link + tên trang + ai công bố) và ghi chú thay đổi luôn bắt buộc. Kiểm tra ở máy bằng bộ kiểm tra dùng chung với máy chủ;
// lỗi máy chủ trả về được hiện lại đúng ô. Chỉ báo thành công sau khi máy chủ đã trả lời thành công.
import { useState } from "react";
import { LoiApi, thongBaoLoi } from "@cms/may-chu/api";
import type { BanGhiCms } from "@cms/may-chu/ban-ghi-api";
import { HopTruot } from "@cms/thanh-phan/ui/hien-thi";
import { OChon, OInput, OTextArea, Truong } from "@cms/thanh-phan/ui/nhap-lieu";
import { Nut } from "@cms/thanh-phan/ui/nut-the";
import {
  CAC_O_FORM, formTrong, kiemTraForm, loiChung, loiO, type FormThongTin, type LoaiThemTay,
} from "./bieu-mau";
import { nhanLoai } from "./dinh-dang";
import { luuVaChuyen, THONG_BAO_LUU, type MucTieuLuu } from "./luu-ban-ghi";
import { THUC_THE_CUA, dataTuForm, entityIdCho, formTuBan, nguonTuForm } from "./mo-hinh";

type FormDayDu = FormThongTin & { tieuDeNguon: string; donViCongBo: string; ghiChuThayDoi: string };

const CAN_LINK_MSG = "Bạn cần dán link nguồn (trang của trường, văn bản, bài đăng chính thức) để người duyệt kiểm chứng.";

/** Lỗi ở máy: bộ kiểm tra chung + các ô bắt buộc riêng của CMS (nguồn, ghi chú thay đổi). */
export function kiemTraDayDu(loai: LoaiThemTay, f: FormDayDu): Record<string, string> {
  const loi = kiemTraForm(loai, f);
  if (!f.linkNguon.trim() && !loi.linkNguon) loi.linkNguon = CAN_LINK_MSG;
  if (f.tieuDeNguon.trim().length < 3) loi.tieuDeNguon = "Ghi tên trang hoặc văn bản nguồn, ít nhất 3 chữ. Ví dụ: Đề án tuyển sinh 2026.";
  if (f.donViCongBo.trim().length < 2) loi.donViCongBo = "Ghi ai công bố thông tin này. Ví dụ: tên trường.";
  const gc = f.ghiChuThayDoi.trim();
  if (gc.length < 3) loi.ghiChuThayDoi = "Ghi ngắn gọn bạn thêm hoặc sửa gì, và vì sao.";
  else if (gc.length > 500) loi.ghiChuThayDoi = "Ghi chú tối đa 500 chữ.";
  return loi;
}

/** Khóa lỗi của máy chủ đổi về tên ô của biểu mẫu. */
const KHOA_MAY_CHU: Record<string, string> = { "source.url": "linkNguon", "source.tieuDe": "tieuDeNguon", "source.donViCongBo": "donViCongBo", changeNote: "ghiChuThayDoi" };
const doiKhoa = (l: Record<string, string>) => Object.fromEntries(Object.entries(l).map(([k, v]) => [KHOA_MAY_CHU[k] ?? k, v]));

interface Props {
  loai: LoaiThemTay;
  maTruong: string;
  tenTruong: string;
  /** Có = đang sửa bản ghi này; không = thêm mới. */
  banGhi?: BanGhiCms;
  laQtv: boolean;
  dong: () => void;
  /** Gọi SAU KHI máy chủ báo thành công. */
  onXong: (thongBao: string) => void;
}

export function HopFormThongTin({ loai, maTruong, tenTruong, banGhi, laQtv, dong, onXong }: Props) {
  const [f, setF] = useState<FormDayDu>(() => {
    if (banGhi) return { ...formTuBan(banGhi) };
    return { ...formTrong(loai), tieuDeNguon: "", donViCongBo: tenTruong, ghiChuThayDoi: "" };
  });
  const [loi, setLoi] = useState<Record<string, string>>({});
  const [loiMay, setLoiMay] = useState<string | null>(null);
  const [dangLuu, setDangLuu] = useState(false);
  // Sau khi tạo/sửa thành công mà bước gửi duyệt lỗi, giữ bản ghi để bấm lại không tạo trùng.
  const [daLuu, setDaLuu] = useState<BanGhiCms | null>(null);

  const dat = (k: keyof FormDayDu) => (e: { target: { value: string } }) => setF((c) => ({ ...c, [k]: e.target.value }));
  const o = (ten: string) => `f-${ten}`;

  const luu = async (muc: MucTieuLuu) => {
    const l = kiemTraDayDu(loai, f);
    setLoiMay(null);
    if (Object.keys(l).length > 0) { setLoi(l); return; }
    setLoi({});
    setDangLuu(true);
    try {
      const entityId = banGhi?.entityId ?? entityIdCho(loai, maTruong, f);
      const data = dataTuForm(loai, maTruong, entityId, f);
      const nguon = nguonTuForm(f);
      const ghiChu = f.ghiChuThayDoi.trim();
      await luuVaChuyen({ hien: daLuu ?? banGhi ?? null, entityType: THUC_THE_CUA[loai], entityId, data, nguon, ghiChu, muc, onBuoc: setDaLuu });
      onXong(THONG_BAO_LUU[muc]);
    } catch (e) {
      if (e instanceof LoiApi && e.chiTiet) setLoi(doiKhoa(e.chiTiet));
      if (e instanceof LoiApi && e.status === 409 && /^Đã có (bản ghi|một bản)|Thực thể này đã có/.test(e.message)) {
        setLoiMay("Mục này đã có trong hệ thống (cùng trường, năm và phạm vi). Đóng cửa sổ, mở mục đó trong danh sách và bấm Sửa thay vì thêm mới.");
        return;
      }
      const dem = daLuu ? " Nội dung đã được lưu thành bản nháp; bạn bấm lại để tiếp tục." : "";
      setLoiMay((e instanceof LoiApi && e.status === 409 ? `${thongBaoLoi(e)} Bạn đóng cửa sổ này, tải lại rồi làm tiếp.` : thongBaoLoi(e)) + dem);
    } finally {
      setDangLuu(false);
    }
  };

  const chungConLai = loiChung(loi, [...CAC_O_FORM[loai], "tieuDeNguon", "donViCongBo", "ghiChuThayDoi"]);
  const sua = Boolean(banGhi);
  const laBanDangChay = banGhi?.status === "PUBLISHED";

  return (
    <HopTruot mo dong={dong} tieuDe={`${sua ? "Sửa" : "Thêm"} ${nhanLoai(loai).toLowerCase()}`}>
      <div className="space-y-3.5 pb-2">
        {laBanDangChay && (
          <p className="rounded-xl bg-cam-nhat p-3 text-[13px] text-cam-chu font-semibold">Mục này đang chạy trên web. Sửa xong sẽ tạo bản mới, phải được duyệt rồi xuất bản thì web mới đổi.</p>
        )}
        {banGhi?.status === "REJECTED" && banGhi.rejectionReason && (
          <p className="rounded-xl bg-do-nhat p-3 text-[13px] text-do-chu"><b>Lý do bị trả lại:</b> {banGhi.rejectionReason}</p>
        )}

        {loai === "hoc_phi" && (
          <>
            <div className="grid grid-cols-2 gap-2.5">
              <Truong nhan="Năm học bắt đầu" batBuoc htmlFor={o("nam")} loi={loiO(loi, "nam")} goiY="2025 nghĩa là năm học 2025 - 2026">
                <OInput id={o("nam")} inputMode="numeric" value={f.nam} onChange={dat("nam")} placeholder="2026" />
              </Truong>
              <Truong nhan="Đơn vị" batBuoc htmlFor={o("donVi")} loi={loiO(loi, "donVi")}>
                <OChon id={o("donVi")} value={f.donVi} onChange={dat("donVi")}>
                  <option value="trieu_nam">triệu / năm</option>
                  <option value="trieu_tin_chi">triệu / tín chỉ</option>
                </OChon>
              </Truong>
              <Truong nhan="Mức thấp (triệu)" batBuoc htmlFor={o("mucThap")} loi={loiO(loi, "mucThap")}>
                <OInput id={o("mucThap")} inputMode="decimal" value={f.mucThap} onChange={dat("mucThap")} placeholder="30" />
              </Truong>
              <Truong nhan="Mức cao (triệu)" batBuoc htmlFor={o("mucCao")} loi={loiO(loi, "mucCao")}>
                <OInput id={o("mucCao")} inputMode="decimal" value={f.mucCao} onChange={dat("mucCao")} placeholder="45" />
              </Truong>
            </div>
            <Truong nhan="Áp dụng cho" batBuoc htmlFor={o("phamVi")} loi={loiO(loi, "phamVi")} goiY="Ví dụ: Chương trình chuẩn, Chất lượng cao">
              <OInput id={o("phamVi")} value={f.phamVi} onChange={dat("phamVi")} />
            </Truong>
            <Truong nhan="Lộ trình tăng học phí" htmlFor={o("loTrinhTang")} loi={loiO(loi, "loTrinhTang")}>
              <OInput id={o("loTrinhTang")} value={f.loTrinhTang} onChange={dat("loTrinhTang")} placeholder="Tăng tối đa 10% mỗi năm" />
            </Truong>
            <Truong nhan="Ghi chú" htmlFor={o("ghiChu")} loi={loiO(loi, "ghiChu")}>
              <OTextArea id={o("ghiChu")} value={f.ghiChu} onChange={dat("ghiChu")} hang={2} />
            </Truong>
          </>
        )}

        {loai === "hoc_bong" && (
          <>
            <Truong nhan="Tên học bổng" batBuoc htmlFor={o("ten")} loi={loiO(loi, "ten")}>
              <OInput id={o("ten")} value={f.ten} onChange={dat("ten")} />
            </Truong>
            <Truong nhan="Giá trị" batBuoc htmlFor={o("giaTri")} loi={loiO(loi, "giaTri")} goiY="Ví dụ: 100% học phí năm đầu">
              <OInput id={o("giaTri")} value={f.giaTri} onChange={dat("giaTri")} />
            </Truong>
            <Truong nhan="Điều kiện" batBuoc htmlFor={o("dieuKien")} loi={loiO(loi, "dieuKien")}>
              <OTextArea id={o("dieuKien")} value={f.dieuKien} onChange={dat("dieuKien")} hang={3} />
            </Truong>
            <Truong nhan="Hạn nộp" htmlFor={o("hanNop")} loi={loiO(loi, "hanNop")}>
              <OInput id={o("hanNop")} value={f.hanNop} onChange={dat("hanNop")} placeholder="30/06/2026" />
            </Truong>
          </>
        )}

        {loai === "noi_luu_tru" && (
          <>
            <Truong nhan="Ký túc xá" batBuoc htmlFor={o("coKyTucXa")} loi={loiO(loi, "coKyTucXa")}>
              <OChon id={o("coKyTucXa")} value={f.coKyTucXa} onChange={dat("coKyTucXa")}>
                <option value="">Chọn</option>
                <option value="co">Có ký túc xá</option>
                <option value="khong">Không có</option>
                <option value="chua_ro">Chưa rõ</option>
              </OChon>
            </Truong>
            <div className="grid grid-cols-2 gap-2.5">
              <Truong nhan="KTX thấp (nghìn/tháng)" htmlFor={o("ktxThap")} loi={loiO(loi, "giaKyTucThang") ?? loiO(loi, "ktxThap")}>
                <OInput id={o("ktxThap")} inputMode="decimal" value={f.ktxThap} onChange={dat("ktxThap")} placeholder="300" />
              </Truong>
              <Truong nhan="KTX cao (nghìn/tháng)" htmlFor={o("ktxCao")} loi={loiO(loi, "ktxCao")}>
                <OInput id={o("ktxCao")} inputMode="decimal" value={f.ktxCao} onChange={dat("ktxCao")} placeholder="800" />
              </Truong>
            </div>
            <Truong nhan="Khu trọ quanh trường" batBuoc htmlFor={o("khuTro")} loi={loiO(loi, "khuTroXungQuanh") ?? loiO(loi, "khuTro")}>
              <OChon id={o("khuTro")} value={f.khuTro} onChange={dat("khuTro")}>
                <option value="">Chọn</option>
                <option value="nhieu">Nhiều khu trọ</option>
                <option value="it">Ít khu trọ</option>
                <option value="khong">Không có</option>
                <option value="chua_ro">Chưa rõ</option>
              </OChon>
            </Truong>
            <div className="grid grid-cols-2 gap-2.5">
              <Truong nhan="Trọ thấp (nghìn/tháng)" htmlFor={o("troThap")} loi={loiO(loi, "giaTroThang") ?? loiO(loi, "troThap")}>
                <OInput id={o("troThap")} inputMode="decimal" value={f.troThap} onChange={dat("troThap")} placeholder="1500" />
              </Truong>
              <Truong nhan="Trọ cao (nghìn/tháng)" htmlFor={o("troCao")} loi={loiO(loi, "troCao")}>
                <OInput id={o("troCao")} inputMode="decimal" value={f.troCao} onChange={dat("troCao")} placeholder="3500" />
              </Truong>
            </div>
            <Truong nhan="Cách trường (km)" htmlFor={o("khoangCachKm")} loi={loiO(loi, "khoangCachKm")}>
              <OInput id={o("khoangCachKm")} inputMode="decimal" value={f.khoangCachKm} onChange={dat("khoangCachKm")} placeholder="2" />
            </Truong>
            <Truong nhan="Ghi chú" htmlFor={o("ghiChu")} loi={loiO(loi, "ghiChu")}>
              <OTextArea id={o("ghiChu")} value={f.ghiChu} onChange={dat("ghiChu")} hang={2} />
            </Truong>
          </>
        )}

        {(loai === "review" || loai === "luu_y") && (
          <>
            {loai === "luu_y" && (
              <Truong nhan="Năm" batBuoc htmlFor={o("nam")} loi={loiO(loi, "nam")}>
                <OInput id={o("nam")} inputMode="numeric" value={f.nam} onChange={dat("nam")} placeholder="2026" />
              </Truong>
            )}
            <Truong nhan="Tiêu đề" batBuoc htmlFor={o("tieuDe")} loi={loiO(loi, "tieuDe")}>
              <OInput id={o("tieuDe")} value={f.tieuDe} onChange={dat("tieuDe")} />
            </Truong>
            <Truong nhan="Nội dung" batBuoc htmlFor={o("noiDung")} loi={loiO(loi, "noiDung")}
              goiY="Không ghi số điện thoại, email hay tên riêng của sinh viên. Link để ở ô nguồn bên dưới.">
              <OTextArea id={o("noiDung")} value={f.noiDung} onChange={dat("noiDung")} hang={4} />
            </Truong>
            {loai === "review" && (
              <Truong nhan="Người viết là" htmlFor={o("nguoiVietLa")} loi={loiO(loi, "nguoiVietLa")}>
                <OChon id={o("nguoiVietLa")} value={f.nguoiVietLa} onChange={dat("nguoiVietLa")}>
                  <option value="">Không ghi</option>
                  <option value="sinh_vien">Sinh viên</option>
                  <option value="cuu_sinh_vien">Cựu sinh viên</option>
                  <option value="phu_huynh">Phụ huynh</option>
                </OChon>
              </Truong>
            )}
          </>
        )}

        <fieldset className="space-y-3 rounded-xl border border-vien p-3 min-w-0">
          <legend className="px-1 text-[14px] font-extrabold text-muc">Nguồn kiểm chứng (bắt buộc)</legend>
          <Truong nhan="Link nguồn" batBuoc htmlFor={o("linkNguon")} loi={loiO(loi, "linkNguon")}
            goiY={loai === "hoc_phi" || loai === "hoc_bong" || loai === "luu_y" ? "Nên là trang .edu.vn, văn bản đề án hoặc bài đăng trên fanpage chính thức của trường." : "Link bài viết hoặc nhóm nơi bạn thấy thông tin này."}>
            <OInput id={o("linkNguon")} inputMode="url" value={f.linkNguon} onChange={dat("linkNguon")} placeholder="https://" />
          </Truong>
          <Truong nhan="Tên trang hoặc văn bản nguồn" batBuoc htmlFor={o("tieuDeNguon")} loi={loi.tieuDeNguon} goiY="Ví dụ: Đề án tuyển sinh 2026, Thông báo học phí năm học 2026 - 2027">
            <OInput id={o("tieuDeNguon")} value={f.tieuDeNguon} onChange={dat("tieuDeNguon")} />
          </Truong>
          <Truong nhan="Ai công bố" batBuoc htmlFor={o("donViCongBo")} loi={loi.donViCongBo}>
            <OInput id={o("donViCongBo")} value={f.donViCongBo} onChange={dat("donViCongBo")} />
          </Truong>
        </fieldset>
        <Truong nhan="Ghi chú thay đổi" batBuoc htmlFor={o("ghiChuThayDoi")} loi={loi.ghiChuThayDoi} goiY="Bạn thêm hoặc sửa gì, vì sao. Người duyệt sẽ đọc dòng này.">
          <OTextArea id={o("ghiChuThayDoi")} value={f.ghiChuThayDoi} onChange={dat("ghiChuThayDoi")} hang={2} />
        </Truong>

        {chungConLai.length > 0 && (
          <div role="alert" className="rounded-xl bg-do-nhat p-3 text-[13px] font-semibold text-do-chu space-y-0.5">
            {chungConLai.map((m, i) => <p key={i}>{m}</p>)}
          </div>
        )}
        {loiMay && <p role="alert" className="rounded-xl bg-do-nhat p-3 text-[13px] font-semibold text-do-chu">{loiMay}</p>}

        <div className="grid grid-cols-2 gap-2 pt-1">
          <Nut kieu="vien" onClick={() => void luu("nhap")} disabled={dangLuu}>Lưu nháp</Nut>
          <Nut onClick={() => void luu("gui")} disabled={dangLuu}>{dangLuu ? "Đang lưu" : "Gửi duyệt"}</Nut>
        </div>
        {laQtv && (
          <Nut kieu="nhe" onClick={() => void luu("duyet")} disabled={dangLuu}>Duyệt luôn</Nut>
        )}
      </div>
    </HopTruot>
  );
}

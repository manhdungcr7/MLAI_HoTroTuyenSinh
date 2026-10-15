// Khối quản lý Cài đặt Hệ thống & Nội dung Công khai (Phase 5.3 & 5.5).
// Quản trị viên (qtv, sa) được chỉnh sửa thông báo chung, liên hệ, ngưỡng nghiệp vụ, email gửi đi và câu hỏi thường gặp (FAQ).
// Cộng tác viên (ctv) chỉ xem ở chế độ chỉ đọc kèm giải thích vai trò rõ ràng.
import { useEffect, useState, type FormEvent } from "react";
import { Plus, RotateCcw, Save, ShieldAlert, Trash2 } from "lucide-react";
import {
  khoiPhucCaiDatMacDinh,
  layCaiDat,
  luuCaiDat,
  thongBaoLoi,
  type CaiDatHeThong,
  type CauHoiThuongGapMuc,
  type MucDoThongBaoChung,
} from "@cms/may-chu/api";
import { usePhien } from "@cms/trang-thai/phien";
import { useTai } from "@cms/trang-thai/dung-tai";
import { HopTruot, KhungDangTai, KhungLoi } from "@cms/thanh-phan/ui/hien-thi";
import { CongTac, OChon, OInput, OTextArea, Truong } from "@cms/thanh-phan/ui/nhap-lieu";
import { Nhan, Nut, The } from "@cms/thanh-phan/ui/nut-the";
import { DongThongBao } from "@cms/thanh-phan/ui/thong-bao";
import { dinhDangLuc } from "@cms/du-lieu-truong/dinh-dang";

const NHAN_MUC_DO: Record<MucDoThongBaoChung, string> = {
  thongTin: "Thông tin chung (màu xanh)",
  canhBao: "Cảnh báo chú ý (màu cam)",
  baoTri: "Đang bảo trì hệ thống (màu đỏ)",
};

export function KhoiCaiDatHeThong() {
  const { laQtv } = usePhien();
  const duLieu = useTai(() => layCaiDat());
  const [form, setForm] = useState<CaiDatHeThong | null>(null);
  const [dangLuu, setDangLuu] = useState(false);
  const [moKhoiPhuc, setMoKhoiPhuc] = useState(false);
  const [banTin, setBanTin] = useState<{ tone: "luc" | "do"; noiDung: string } | null>(null);

  useEffect(() => {
    if (duLieu.du?.caiDat) {
      setForm(JSON.parse(JSON.stringify(duLieu.du.caiDat)) as CaiDatHeThong);
    }
  }, [duLieu.du]);

  if (duLieu.dangTai && !duLieu.du) return <KhungDangTai soKhung={3} cao="h-28" />;
  if (duLieu.loi && !duLieu.du) return <KhungLoi moTa={duLieu.loi} thuLai={duLieu.taiLai} />;
  if (!form) return null;

  const chiDoc = !laQtv;

  const luu = async (e: FormEvent) => {
    e.preventDefault();
    if (chiDoc) return;
    setDangLuu(true);
    setBanTin(null);
    try {
      const kq = await luuCaiDat(form);
      setForm(JSON.parse(JSON.stringify(kq.caiDat)) as CaiDatHeThong);
      duLieu.taiLai();
      setBanTin({ tone: "luc", noiDung: "Đã lưu cài đặt hệ thống và ghi vào nhật ký kiểm toán." });
    } catch (err) {
      setBanTin({ tone: "do", noiDung: thongBaoLoi(err) });
    } finally {
      setDangLuu(false);
    }
  };

  const xacNhanKhoiPhuc = async () => {
    if (chiDoc) return;
    setDangLuu(true);
    setBanTin(null);
    try {
      const kq = await khoiPhucCaiDatMacDinh();
      setForm(JSON.parse(JSON.stringify(kq.caiDat)) as CaiDatHeThong);
      setMoKhoiPhuc(false);
      duLieu.taiLai();
      setBanTin({ tone: "luc", noiDung: "Đã khôi phục cài đặt mặc định ban đầu." });
    } catch (err) {
      setBanTin({ tone: "do", noiDung: thongBaoLoi(err) });
      setMoKhoiPhuc(false);
    } finally {
      setDangLuu(false);
    }
  };

  const capNhatFaq = (viTri: number, truong: keyof CauHoiThuongGapMuc, giaTri: string) => {
    const ds = form.cauHoiThuongGap.map((muc, i) => (i === viTri ? { ...muc, [truong]: giaTri } : muc));
    setForm({ ...form, cauHoiThuongGap: ds });
  };

  const themFaq = () => {
    setForm({
      ...form,
      cauHoiThuongGap: [
        ...form.cauHoiThuongGap,
        { cauHoi: "Câu hỏi mới về tuyển sinh?", traLoi: "Nội dung giải đáp ngắn gọn, rõ ràng cho học sinh." },
      ],
    });
  };

  const xoaFaq = (viTri: number) => {
    setForm({
      ...form,
      cauHoiThuongGap: form.cauHoiThuongGap.filter((_, i) => i !== viTri),
    });
  };

  return (
    <form onSubmit={(e) => void luu(e)} className="space-y-3" noValidate>
      {banTin && <DongThongBao tone={banTin.tone} tieuDe={banTin.noiDung} onClick={() => setBanTin(null)} />}

      {chiDoc && (
        <DongThongBao
          tone="cam"
          icon={ShieldAlert}
          tieuDe="Chế độ chỉ đọc (Cộng tác viên)"
          moTa="Bạn đang xem cấu hình hệ thống ở chế độ chỉ đọc. Chỉ Quản trị viên (qtv) hoặc Siêu quản trị (sa) mới có quyền thay đổi các thiết lập này."
        />
      )}

      {duLieu.du?.capNhatLuc && (
        <p className="text-[12px] text-chu-phu px-1">
          Cập nhật lần cuối bởi <b className="text-chu">{duLieu.du.capNhatBoi ?? "hệ thống"}</b> lúc {dinhDangLuc(duLieu.du.capNhatLuc)}
        </p>
      )}

      {/* 1. Thông báo hệ thống & Bảo trì */}
      <The className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="font-extrabold text-[16px] text-muc">Thông báo chung & Bảo trì</h2>
            <p className="text-[13px] text-chu-phu">Thanh thông báo hiển thị đầu trang web học sinh khi cần bảo trì hoặc nhắc mốc tuyển sinh.</p>
          </div>
          <Nhan tone={form.thongBaoChung.bat ? "cam" : "luc"}>{form.thongBaoChung.bat ? "Đang bật" : "Đang tắt"}</Nhan>
        </div>

        <Truong nhan="Tên hiển thị hệ thống" batBuoc htmlFor="cd-ten-he-thong">
          <OInput
            id="cd-ten-he-thong"
            disabled={chiDoc}
            value={form.tenHeThong}
            onChange={(e) => setForm({ ...form, tenHeThong: e.target.value })}
            placeholder="Nguyện Vọng AI"
          />
        </Truong>

        <div className="flex items-center justify-between gap-3 rounded-xl bg-nen p-3 border border-vien">
          <span className="text-[14px] font-bold text-chu">Bật thanh thông báo toàn hệ thống</span>
          <CongTac
            dang={form.thongBaoChung.bat}
            nhan="Bật thanh thông báo toàn hệ thống"
            onChange={(v) => !chiDoc && setForm({ ...form, thongBaoChung: { ...form.thongBaoChung, bat: v } })}
          />
        </div>

        <Truong nhan="Mức độ thông báo" htmlFor="cd-muc-do">
          <OChon
            id="cd-muc-do"
            disabled={chiDoc}
            value={form.thongBaoChung.mucDo}
            onChange={(e) =>
              setForm({
                ...form,
                thongBaoChung: { ...form.thongBaoChung, mucDo: e.target.value as MucDoThongBaoChung },
              })
            }
          >
            {(Object.keys(NHAN_MUC_DO) as MucDoThongBaoChung[]).map((m) => (
              <option key={m} value={m}>{NHAN_MUC_DO[m]}</option>
            ))}
          </OChon>
        </Truong>

        <Truong nhan="Nội dung thông báo" htmlFor="cd-noi-dung-tb" goiY="Tối đa 500 ký tự. Bắt buộc nhập nếu bật thông báo.">
          <OTextArea
            id="cd-noi-dung-tb"
            hang={2}
            disabled={chiDoc}
            value={form.thongBaoChung.noiDung}
            onChange={(e) => setForm({ ...form, thongBaoChung: { ...form.thongBaoChung, noiDung: e.target.value } })}
            placeholder="Ví dụ: Hệ thống đang cập nhật điểm chuẩn đợt 1 năm 2026..."
          />
        </Truong>
      </The>

      {/* 2. Thông tin liên hệ & Email gửi đi */}
      <The className="space-y-3">
        <h2 className="font-extrabold text-[16px] text-muc">Thông tin liên hệ & Email hiển thị</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Truong nhan="Email hỗ trợ công khai" batBuoc htmlFor="cd-email-ho-tro">
            <OInput
              id="cd-email-ho-tro"
              type="email"
              disabled={chiDoc}
              value={form.lienHe.emailHoTro}
              onChange={(e) => setForm({ ...form, lienHe: { ...form.lienHe, emailHoTro: e.target.value } })}
              placeholder="hotro@nguyenvong.ai"
            />
          </Truong>
          <Truong nhan="Số điện thoại hỗ trợ" batBuoc htmlFor="cd-dien-thoai">
            <OInput
              id="cd-dien-thoai"
              disabled={chiDoc}
              value={form.lienHe.dienThoai}
              onChange={(e) => setForm({ ...form, lienHe: { ...form.lienHe, dienThoai: e.target.value } })}
              placeholder="0901234567"
            />
          </Truong>
        </div>
        <Truong nhan="Đơn vị vận hành" batBuoc htmlFor="cd-don-vi">
          <OInput
            id="cd-don-vi"
            disabled={chiDoc}
            value={form.lienHe.donVi}
            onChange={(e) => setForm({ ...form, lienHe: { ...form.lienHe, donVi: e.target.value } })}
            placeholder="Nhóm phát triển Nguyện Vọng AI"
          />
        </Truong>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Truong nhan="Tên người gửi email" batBuoc htmlFor="cd-ten-email">
            <OInput
              id="cd-ten-email"
              disabled={chiDoc}
              value={form.emailGuiDi.tenHienThi}
              onChange={(e) => setForm({ ...form, emailGuiDi: { ...form.emailGuiDi, tenHienThi: e.target.value } })}
              placeholder="Nguyện Vọng AI"
            />
          </Truong>
          <Truong nhan="Địa chỉ nhận phản hồi (Reply-To)" batBuoc htmlFor="cd-email-phan-hoi">
            <OInput
              id="cd-email-phan-hoi"
              type="email"
              disabled={chiDoc}
              value={form.emailGuiDi.diaChiPhanHoi}
              onChange={(e) => setForm({ ...form, emailGuiDi: { ...form.emailGuiDi, diaChiPhanHoi: e.target.value } })}
              placeholder="hotro@nguyenvong.ai"
            />
          </Truong>
        </div>
      </The>

      {/* 3. Ngưỡng nghiệp vụ */}
      <The className="space-y-3">
        <h2 className="font-extrabold text-[16px] text-muc">Ngưỡng nghiệp vụ tuyển sinh</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Truong nhan="Năm tuyển sinh hiện hành" batBuoc htmlFor="cd-nam-ts" goiY="Từ 2024 đến 2035">
            <OInput
              id="cd-nam-ts"
              type="number"
              min={2024}
              max={2035}
              disabled={chiDoc}
              value={form.cauHinhNghiepVu.namTuyenSinh}
              onChange={(e) =>
                setForm({
                  ...form,
                  cauHinhNghiepVu: { ...form.cauHinhNghiepVu, namTuyenSinh: Number(e.target.value) },
                })
              }
            />
          </Truong>
          <Truong nhan="Số nguyện vọng gợi ý tối đa" batBuoc htmlFor="cd-so-nv" goiY="Từ 1 đến 20 nguyện vọng">
            <OInput
              id="cd-so-nv"
              type="number"
              min={1}
              max={20}
              disabled={chiDoc}
              value={form.cauHinhNghiepVu.soNguyenVongToiDaGoiY}
              onChange={(e) =>
                setForm({
                  ...form,
                  cauHinhNghiepVu: { ...form.cauHinhNghiepVu, soNguyenVongToiDaGoiY: Number(e.target.value) },
                })
              }
            />
          </Truong>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3 rounded-xl bg-nen p-3 border border-vien">
            <span className="text-[14px] font-bold text-chu">Cho phép mở biểu mẫu đăng ký sớm</span>
            <CongTac
              dang={form.cauHinhNghiepVu.choPhepDangKySom}
              nhan="Cho phép mở biểu mẫu đăng ký sớm"
              onChange={(v) =>
                !chiDoc &&
                setForm({
                  ...form,
                  cauHinhNghiepVu: { ...form.cauHinhNghiepVu, choPhepDangKySom: v },
                })
              }
            />
          </div>
          <div className="flex items-center justify-between gap-3 rounded-xl bg-nen p-3 border border-vien">
            <span className="text-[14px] font-bold text-chu">Cho phép học sinh gửi báo cáo số liệu sai</span>
            <CongTac
              dang={form.cauHinhNghiepVu.choPhepBaoSai}
              nhan="Cho phép học sinh gửi báo cáo số liệu sai"
              onChange={(v) =>
                !chiDoc &&
                setForm({
                  ...form,
                  cauHinhNghiepVu: { ...form.cauHinhNghiepVu, choPhepBaoSai: v },
                })
              }
            />
          </div>
        </div>
      </The>

      {/* 4. Câu hỏi thường gặp (FAQ) */}
      <The className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="font-extrabold text-[16px] text-muc">Câu hỏi thường gặp (FAQ)</h2>
            <p className="text-[13px] text-chu-phu">Danh sách câu hỏi hiển thị công khai giúp học sinh hiểu rõ cách tính điểm và nguồn dữ liệu.</p>
          </div>
          <Nhan tone="xanh">{form.cauHoiThuongGap.length} câu</Nhan>
        </div>

        <div className="space-y-3">
          {form.cauHoiThuongGap.map((muc, idx) => (
            <div key={idx} className="rounded-xl border border-vien bg-nen p-3 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-extrabold text-xanh">Câu hỏi #{idx + 1}</span>
                {!chiDoc && (
                  <button
                    type="button"
                    onClick={() => xoaFaq(idx)}
                    className="min-h-11 px-2.5 rounded-lg border border-do/40 text-do-chu text-[12px] font-bold inline-flex items-center gap-1"
                  >
                    <Trash2 size={14} /> Xóa
                  </button>
                )}
              </div>
              <Truong nhan="Câu hỏi" batBuoc htmlFor={`faq-q-${idx}`}>
                <OInput
                  id={`faq-q-${idx}`}
                  disabled={chiDoc}
                  value={muc.cauHoi}
                  onChange={(e) => capNhatFaq(idx, "cauHoi", e.target.value)}
                  placeholder="Nhập câu hỏi..."
                />
              </Truong>
              <Truong nhan="Câu trả lời" batBuoc htmlFor={`faq-a-${idx}`}>
                <OTextArea
                  id={`faq-a-${idx}`}
                  hang={2}
                  disabled={chiDoc}
                  value={muc.traLoi}
                  onChange={(e) => capNhatFaq(idx, "traLoi", e.target.value)}
                  placeholder="Nhập câu trả lời..."
                />
              </Truong>
            </div>
          ))}
        </div>

        {!chiDoc && (
          <Nut type="button" kieu="vien" bieuTuong={Plus} onClick={themFaq} disabled={form.cauHoiThuongGap.length >= 30}>
            Thêm câu hỏi
          </Nut>
        )}
      </The>

      {!chiDoc && (
        <div className="grid grid-cols-2 gap-2">
          <Nut type="button" kieu="vien" bieuTuong={RotateCcw} onClick={() => setMoKhoiPhuc(true)} disabled={dangLuu}>
            Mặc định
          </Nut>
          <Nut type="submit" bieuTuong={Save} disabled={dangLuu}>
            {dangLuu ? "Đang lưu" : "Lưu cài đặt"}
          </Nut>
        </div>
      )}

      <HopTruot mo={moKhoiPhuc} dong={() => setMoKhoiPhuc(false)} tieuDe="Khôi phục cài đặt mặc định">
        <div className="space-y-3">
          <p className="text-[14px] text-chu">
            Đặt lại toàn bộ thông báo chung, thông tin liên hệ, ngưỡng nghiệp vụ và câu hỏi thường gặp về giá trị mặc định ban đầu? Thay đổi này sẽ được ghi vào nhật ký kiểm toán.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Nut kieu="vien" onClick={() => setMoKhoiPhuc(false)} disabled={dangLuu}>Hủy</Nut>
            <Nut kieu="nguyHiem" onClick={() => void xacNhanKhoiPhuc()} disabled={dangLuu}>
              {dangLuu ? "Đang đặt lại" : "Đặt lại"}
            </Nut>
          </div>
        </div>
      </HopTruot>
    </form>
  );
}

export default KhoiCaiDatHeThong;

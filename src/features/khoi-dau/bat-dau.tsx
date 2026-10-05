import { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { GraduationCap, Lightbulb, MapPin, UserRound } from "lucide-react";
import { DauTrangCoQuayLai, NoiDung } from "@/components/layout/khung";
import { Nut, The, gop } from "@/components/ui/nut-the";
import { ChonNhanh, OChon, OInput, Truong } from "@/components/ui/nhap-lieu";
import { DUONG_DAN, type BuocBatDau } from "@/duong-dan";
import { useApp } from "@/state/store";
import { CAC_MON, TEN_MON, type HoSo, type MonId, type NguonDiem } from "@/state/types";

const TINH = ["TP. Hồ Chí Minh", "Hà Nội", "Đà Nẵng", "Cần Thơ", "Hải Phòng", "Đồng Nai", "Bình Dương", "Tỉnh khác"];
const NGANH = ["CNTT", "Kinh tế", "Y dược", "Thiết kế", "Kỹ thuật", "Sư phạm", "Ngôn ngữ"];
const MANH = ["Tư duy logic", "Giải quyết vấn đề", "Tiếng Anh", "Sáng tạo", "Giao tiếp", "Kiên trì"];
const CAN_CAI_THIEN = ["Toán", "Vật lý", "Diễn đạt", "Quản lý thời gian", "Tập trung", "Tiếng Anh"];
const CACH_HOC = ["Học qua bài tập", "Học theo dự án", "Thảo luận nhóm", "Xem video"];

function CacBuoc({ hien }: { hien: BuocBatDau }) {
  const ten = ["Thông tin cơ bản", "Điểm các môn", "Mục tiêu & ưu tiên"];
  return (
    <ol className="grid grid-cols-3 gap-1 px-4 pb-3" aria-label="Các bước">
      {ten.map((t, i) => {
        const so = i + 1;
        return (
          <li key={t} className="flex flex-col items-center text-center gap-1">
            <span className={gop("size-8 rounded-full grid place-items-center text-[13px] font-extrabold", so <= hien ? "gd-xanh text-white" : "bg-vien text-chu-phu")}>{so}</span>
            <span className={gop("text-[11px] font-semibold leading-tight", so === hien ? "text-xanh" : "text-chu-phu")}>{t}</span>
          </li>
        );
      })}
    </ol>
  );
}

function GoiY({ children }: { children: string }) {
  return <The tone="xanh" className="flex gap-2 items-start text-[13px] text-chu"><Lightbulb size={18} className="text-cam shrink-0 mt-0.5" />{children}</The>;
}

export default function BatDau() {
  const { buoc } = useParams();
  const nav = useNavigate();
  const { s, capNhatHoSo } = useApp();
  const h = s.hoSo;
  const [loi, setLoi] = useState<string[]>([]);
  const so = Number(buoc) as BuocBatDau;
  if (![1, 2, 3].includes(so)) return <Navigate to={DUONG_DAN.batDau(1)} replace />;

  const tiep = () => {
    if (so === 1) {
      const thieu: string[] = [];
      if (!h.hoTen.trim()) thieu.push("Em điền họ và tên nhé.");
      if (!h.khoi) thieu.push("Em chọn khối lớp.");
      if (!h.tinh) thieu.push("Em chọn tỉnh/thành phố.");
      if (!h.nganhQuanTam.length) thieu.push("Em chọn ít nhất một nhóm ngành.");
      if (thieu.length) return setLoi(thieu);
    }
    setLoi([]);
    if (so < 3) nav(DUONG_DAN.batDau((so + 1) as BuocBatDau));
    else { capNhatHoSo({ hoanTat: true }); nav(DUONG_DAN.hoSo()); }
  };
  const boQuaTam = () => nav(so < 3 ? DUONG_DAN.batDau((so + 1) as BuocBatDau) : DUONG_DAN.hoSo());

  return (
    <>
      <DauTrangCoQuayLai tieuDe={so === 1 ? "Điền nhanh 60 giây" : so === 2 ? "Điểm các môn" : "Mục tiêu & ưu tiên"} buoc={`Bước ${so}/3`} quayLai={so === 1 ? DUONG_DAN.chao() : DUONG_DAN.batDau((so - 1) as BuocBatDau)} />
      <CacBuoc hien={so} />
      <NoiDung className="space-y-4">
        {so === 1 && <Buoc1 h={h} sua={capNhatHoSo} />}
        {so === 2 && <Buoc2 h={h} sua={capNhatHoSo} />}
        {so === 3 && <Buoc3 h={h} sua={capNhatHoSo} />}
        {loi.length > 0 && (
          <div role="alert" className="rounded-xl bg-do-nhat text-do-chu text-[13px] font-semibold p-3 space-y-0.5">{loi.map((l) => <p key={l}>{l}</p>)}</div>
        )}
        <div className="space-y-2 pt-1">
          <Nut muiTen onClick={tiep}>{so === 3 ? "Hoàn tất hồ sơ" : "Tiếp tục"}</Nut>
          {so === 1 ? <Nut kieu="vien" onClick={boQuaTam}>Bỏ qua tạm</Nut> : <Nut kieu="vien" onClick={() => nav(DUONG_DAN.batDau((so - 1) as BuocBatDau))}>Quay lại</Nut>}
        </div>
      </NoiDung>
    </>
  );
}

type P = { h: HoSo; sua: (p: Partial<HoSo>) => void };

function Buoc1({ h, sua }: P) {
  return (
    <>
      <GoiY>Chỉ vài thông tin cơ bản để cá nhân hóa gợi ý. Em có thể bổ sung thêm sau.</GoiY>
      <Truong nhan="Họ và tên" batBuoc><OInput bieuTuong={UserRound} value={h.hoTen} onChange={(e) => sua({ hoTen: e.target.value })} placeholder="Ví dụ: Nguyễn Minh Anh" autoComplete="name" /></Truong>
      <Truong nhan="Lớp" batBuoc>
        <ChonNhanh cot={2} cacLua={[{ gia: 11, nhan: "Lớp 11" }, { gia: 12, nhan: "Lớp 12" }]} giaTri={h.khoi} onChange={(v) => sua({ khoi: v })} />
      </Truong>
      <Truong nhan="Tỉnh/Thành phố" batBuoc>
        <OChon bieuTuong={MapPin} value={h.tinh} onChange={(e) => sua({ tinh: e.target.value })}><option value="">Chọn nơi em đang sống</option>{TINH.map((t) => <option key={t}>{t}</option>)}</OChon>
      </Truong>
      <Truong nhan="Nhóm ngành em quan tâm" batBuoc goiY="Chọn một hoặc nhiều. Chưa chắc cũng không sao.">
        <ChonNhanh nhieu cacLua={NGANH.map((x) => ({ gia: x, nhan: x }))} giaTri={h.nganhQuanTam} onChange={(v) => sua({ nganhQuanTam: v })} />
      </Truong>
      <Truong nhan="Hiện tại em đang ở đâu?">
        <ChonNhanh cot={3} cacLua={[{ gia: "chuaChonTruong", nhan: "Chưa biết chọn trường" }, { gia: "daCoMoUoc", nhan: "Đã có mơ ước" }, { gia: "soSanh", nhan: "Muốn so sánh trường" }]} giaTri={h.mucTieuHienTai} onChange={(v) => sua({ mucTieuHienTai: v })} />
      </Truong>
      <Truong nhan="Giai đoạn hiện tại">
        <OChon bieuTuong={GraduationCap} value={h.giaiDoan} onChange={(e) => sua({ giaiDoan: e.target.value })}><option value="">Chọn giai đoạn</option>{["Đang học lớp 11", "Ôn thi THPT", "Đã tốt nghiệp THPT"].map((t) => <option key={t}>{t}</option>)}</OChon>
      </Truong>
    </>
  );
}

function Buoc2({ h, sua }: P) {
  const nguon: { gia: NguonDiem; nhan: string }[] = [
    { gia: "hocBa", nhan: "Học bạ" }, { gia: "thiThu", nhan: "Thi thử" }, { gia: "danhGiaNangLuc", nhan: "Đánh giá năng lực" }, { gia: "tuDanhGia", nhan: "Tự đánh giá" },
  ];
  const datDiem = (m: MonId, v: string) => {
    const so = v === "" ? null : Math.min(10, Math.max(0, Number(v.replace(",", "."))));
    sua({ diem: { ...h.diem, [m]: so !== null && Number.isNaN(so) ? null : so } });
  };
  return (
    <>
      <p className="text-[14px] text-chu-phu -mt-1">Nhập điểm gần nhất, hệ thống tự gom tổ hợp xét tuyển cho em.</p>
      <Truong nhan="Điểm em lấy từ đâu?"><ChonNhanh cacLua={nguon} giaTri={h.nguonDiem} onChange={(v) => sua({ nguonDiem: v })} /></Truong>
      <div className="grid grid-cols-2 gap-3">
        {CAC_MON.map((m) => (
          <div key={m}>
            <label htmlFor={`d-${m}`} className="block text-[14px] font-bold text-chu mb-1">{TEN_MON[m]}</label>
            <input id={`d-${m}`} inputMode="decimal" placeholder="Ví dụ 7.5" value={h.diem[m] ?? ""} onChange={(e) => datDiem(m, e.target.value)}
              className="w-full min-h-12 rounded-xl border border-vien bg-trang px-3 text-[15px] focus:border-xanh" />
          </div>
        ))}
      </div>
      <p className="text-[12px] text-chu-phu">Chưa nhớ chính xác thì để trống, em bổ sung sau.</p>
      <Truong nhan="Điểm mạnh của em"><ChonNhanh nhieu cacLua={MANH.map((x) => ({ gia: x, nhan: x }))} giaTri={h.diemManh} onChange={(v) => sua({ diemManh: v })} /></Truong>
      <Truong nhan="Điều em muốn cải thiện"><ChonNhanh nhieu cacLua={CAN_CAI_THIEN.map((x) => ({ gia: x, nhan: x }))} giaTri={h.canCaiThien} onChange={(v) => sua({ canCaiThien: v })} /></Truong>
      <Truong nhan="Cách học hợp với em"><ChonNhanh nhieu cacLua={CACH_HOC.map((x) => ({ gia: x, nhan: x }))} giaTri={h.cachHoc} onChange={(v) => sua({ cachHoc: v })} /></Truong>
    </>
  );
}

function Buoc3({ h, sua }: P) {
  return (
    <>
      <p className="text-[14px] text-chu-phu -mt-1">Chia sẻ điều kiện gia đình và mong muốn để gợi ý sát thực tế hơn.</p>
      <Truong nhan="Mức học phí có thể chi trả mỗi năm">
        <ChonNhanh cot={2} cacLua={[{ gia: "duoi30", nhan: "Dưới 30 triệu" }, { gia: "30-60", nhan: "30 – 60 triệu" }, { gia: "60-100", nhan: "60 – 100 triệu" }, { gia: "tren100", nhan: "Trên 100 triệu" }]} giaTri={h.nganSach} onChange={(v) => sua({ nganSach: v })} />
      </Truong>
      <Truong nhan="Chỗ ở dự kiến"><ChonNhanh cot={3} cacLua={[{ gia: "oNha", nhan: "Ở nhà" }, { gia: "oTro", nhan: "Ở trọ" }, { gia: "kyTucXa", nhan: "Ký túc xá" }]} giaTri={h.choO} onChange={(v) => sua({ choO: v })} /></Truong>
      <Truong nhan="Nơi em muốn học"><ChonNhanh nhieu cacLua={["TP.HCM", "Hà Nội", "Đà Nẵng", "Tỉnh khác"].map((x) => ({ gia: x, nhan: x }))} giaTri={h.khuVuc} onChange={(v) => sua({ khuVuc: v })} /></Truong>
      <Truong nhan="Em có sẵn sàng học xa nhà không?"><ChonNhanh cot={2} cacLua={[{ gia: true, nhan: "Có" }, { gia: false, nhan: "Không" }]} giaTri={h.hocXaNha} onChange={(v) => sua({ hocXaNha: v })} /></Truong>
      <Truong nhan="Em quan tâm tới việc làm sau khi ra trường?">
        <ChonNhanh cot={3} cacLua={[{ gia: "rat", nhan: "Rất quan tâm" }, { gia: "binhThuong", nhan: "Bình thường" }, { gia: "chuaRo", nhan: "Chưa rõ" }]} giaTri={h.quanTamViecLam} onChange={(v) => sua({ quanTamViecLam: v })} />
      </Truong>
      <Truong nhan="Con đường em muốn thử"><ChonNhanh cot={3} cacLua={[{ gia: "daiHoc", nhan: "Đại học" }, { gia: "caoDang", nhan: "Cao đẳng" }, { gia: "khac", nhan: "Khác" }]} giaTri={h.conDuong} onChange={(v) => sua({ conDuong: v })} /></Truong>
    </>
  );
}

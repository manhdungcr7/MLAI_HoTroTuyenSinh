// Trắc nghiệm hướng nghiệp: 12 tình huống thật + 1 câu về điều em coi trọng; kết quả gợi ý nhóm ngành kèm lý do. Lưu vào hồ sơ.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Compass, RotateCcw } from "lucide-react";
import { DauTrangCoQuayLai, NoiDung } from "@/components/layout/khung";
import { ThanhTienDo, TieuDeMuc } from "@/components/ui/hien-thi";
import { Nhan, Nut, The, gop } from "@/components/ui/nut-the";
import { DongThongBao } from "@/components/ui/thong-bao";
import { LUA_CHON } from "@/data/lua-chon-that";
import { DUONG_DAN } from "@/duong-dan";
import { TAT_CA_NGANH } from "@/features/khoi-dau/lua-chon";
import { useApp } from "@/state/store";
import type { LoaiSoThich } from "@/state/types";
import { CAC_CAU_HOI, CAC_GIA_TRI, CAC_LOAI, THONG_TIN_LOAI, TOI_DA_GIA_TRI, khongRoNet, moTaTop, nhomNganhGoiY, tinhKetQua, tyLe } from "./cau-hoi";

const TEN_NHOM = (ma: string) => TAT_CA_NGANH.find((n) => n.gia === ma)?.nhan ?? ma;
const SO_CT = (nhom: string) => LUA_CHON.filter((l) => l.nhomNganh === nhom).length;
const TONE_LOAI: Record<LoaiSoThich, "xanh" | "luc" | "cam" | "tim" | "do" | "muc"> = { R: "cam", I: "xanh", A: "tim", S: "luc", E: "do", C: "muc" };
const TONG_CAU = CAC_CAU_HOI.length;

export default function TracNghiem() {
  const { s, capNhatHoSo } = useApp();
  const nav = useNavigate();
  const [dang, setDang] = useState<number[]>(() => CAC_CAU_HOI.map(() => -1)); // vị trí đã chọn ở từng câu
  const [giaTri, setGiaTri] = useState<string[]>([]);
  const [buoc, setBuoc] = useState(-1); // -1 giới thiệu, 0..11 câu hỏi, 12 điều em coi trọng
  const [lamLai, setLamLai] = useState(false);
  const kq = s.hoSo.soThich ?? null;

  const chon = (vt: number) => {
    setDang((d) => d.map((x, i) => (i === buoc ? vt : x)));
    setBuoc(buoc + 1);
  };
  const xong = () => {
    const ra = tinhKetQua(dang, giaTri);
    if (!ra) return;
    capNhatHoSo({ soThich: ra });
    setLamLai(false); setBuoc(-1); setDang(CAC_CAU_HOI.map(() => -1)); setGiaTri([]);
  };
  const batGiaTri = (id: string) => setGiaTri((g) => (g.includes(id) ? g.filter((x) => x !== id) : g.length < TOI_DA_GIA_TRI ? [...g, id] : g));

  // ---------- Kết quả ----------
  if (kq && !lamLai) {
    const goiY = nhomNganhGoiY(kq);
    const lonNhat = Math.max(...CAC_LOAI.map((l) => tyLe(kq, l)), 0.01);
    const daCo = s.hoSo.nganhQuanTam;
    const rongNet = khongRoNet(kq);
    return (
      <>
        <DauTrangCoQuayLai tieuDe="Trắc nghiệm hướng nghiệp" quayLai={DUONG_DAN.hoSo()} />
        <NoiDung className="space-y-4">
          <The className="space-y-1">
            <p className="text-[13px] font-semibold text-chu-phu">Em nghiêng về</p>
            <p className="text-[20px] font-extrabold text-muc leading-tight">{rongNet ? "Chưa nổi bật nhóm nào" : moTaTop(kq)}</p>
            <p className="text-[14px] text-chu leading-snug">
              {rongNet
                ? "Em chọn khá đều nhiều kiểu việc khác nhau, nên mình chưa thấy một hướng rõ. Các nhóm ngành bên dưới là điểm bắt đầu; em thử lại sau khi trải nghiệm thêm."
                : kq.top.slice(0, 2).map((l) => THONG_TIN_LOAI[l].moTa).join(" ")}
            </p>
          </The>

          <section>
            <TieuDeMuc>Nhóm ngành đáng tìm hiểu</TieuDeMuc>
            <div className="space-y-2">
              {goiY.map((g) => {
                const da = daCo.includes(g.nhom);
                const vi = [
                  g.vi.loai.length ? `hợp với kiểu ${g.vi.loai.map((l) => THONG_TIN_LOAI[l].ten.toLowerCase()).join(" và ")}` : "",
                  g.vi.giaTri.length ? `khớp điều em coi trọng: ${g.vi.giaTri.map((id) => CAC_GIA_TRI.find((x) => x.id === id)?.chu.split(",")[0].toLowerCase()).join(", ")}` : "",
                ].filter(Boolean).join("; ");
                return (
                  <The key={g.nhom} className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-bold text-chu">{TEN_NHOM(g.nhom)}</p>
                      <p className="text-[13px] text-chu-phu leading-snug">{vi ? `${vi.charAt(0).toUpperCase()}${vi.slice(1)}. ` : ""}{SO_CT(g.nhom)} chương trình trong dữ liệu.</p>
                    </div>
                    {da ? <Nhan tone="luc">Đã chọn</Nhan>
                      : <Nut rong={false} kieu="vien" className="min-h-11 px-3" onClick={() => capNhatHoSo({ nganhQuanTam: [...daCo, g.nhom] })}>Thêm</Nut>}
                  </The>
                );
              })}
            </div>
          </section>

          <section>
            <TieuDeMuc>Em chọn thế nào</TieuDeMuc>
            <The className="space-y-3">
              {[...CAC_LOAI].sort((a, b) => tyLe(kq, b) - tyLe(kq, a)).map((l) => (
                <div key={l}>
                  <p className="flex justify-between text-[14px] text-chu mb-1"><span>{THONG_TIN_LOAI[l].ten}</span><b>{Math.round(tyLe(kq, l) * 100)}%</b></p>
                  <ThanhTienDo phanTram={(tyLe(kq, l) / lonNhat) * 100} tone={TONE_LOAI[l]} nhan={THONG_TIN_LOAI[l].ten} cao="h-2" />
                </div>
              ))}
              <p className="text-[12px] text-chu-phu leading-snug">Phần trăm là tỉ lệ em chọn tình huống thuộc nhóm đó, trên số lần nhóm đó được đưa ra.</p>
            </The>
          </section>

          <DongThongBao tone="xanh" icon={Compass} tieuDe="Chỉ là gợi ý để em tìm hiểu"
            moTa="Kết quả cho biết em hay nghiêng về kiểu việc nào, không cho biết em giỏi hay đậu ngành nào. Em kết hợp với điểm số, học phí và hỏi người đang làm nghề trước khi quyết định." />
          <Nut muiTen onClick={() => nav(DUONG_DAN.khamPha())}>Khám phá các ngành này</Nut>
          <Nut kieu="vien" bieuTuong={RotateCcw} onClick={() => { setLamLai(true); setBuoc(-1); }}>Làm lại trắc nghiệm</Nut>
        </NoiDung>
      </>
    );
  }

  // ---------- Giới thiệu ----------
  if (buoc < 0) {
    return (
      <>
        <DauTrangCoQuayLai tieuDe="Trắc nghiệm hướng nghiệp" quayLai={DUONG_DAN.hoSo()} />
        <NoiDung className="space-y-4">
          <The className="space-y-2">
            <p className="text-[18px] font-extrabold text-muc leading-tight">Em hợp kiểu việc nào?</p>
            <p className="text-[14px] text-chu leading-snug">{TONG_CAU} tình huống thực tế, mỗi câu chọn phương án phù hợp nhất với em (khoảng 2 phút). Kết quả dùng để gợi ý nhóm ngành, không thay cho điểm số.</p>
          </The>
          <DongThongBao tone="xanh" icon={Compass} tieuDe="Dữ liệu lưu an toàn trên máy" moTa="Thông tin chỉ lưu trên thiết bị này, đồng bộ cùng hồ sơ của em." />
          <Nut muiTen onClick={() => setBuoc(0)}>Bắt đầu</Nut>
        </NoiDung>
      </>
    );
  }

  // ---------- Câu về điều em coi trọng ----------
  if (buoc >= TONG_CAU) {
    return (
      <>
        <DauTrangCoQuayLai tieuDe="Trắc nghiệm hướng nghiệp" buoc="Câu cuối" quayLai={DUONG_DAN.hoSo()} />
        <NoiDung className="space-y-4">
          <ThanhTienDo phanTram={92} nhan="Tiến độ trắc nghiệm" />
          <The className="space-y-1">
            <p className="text-[18px] font-bold text-chu leading-snug" id="cau-gia-tri">Khi nghĩ về công việc sau này, em coi trọng điều gì nhất?</p>
            <p className="text-[13px] text-chu-phu">Chọn tối đa {TOI_DA_GIA_TRI} điều, hoặc bỏ qua.</p>
          </The>
          <div role="group" aria-labelledby="cau-gia-tri" className="grid grid-cols-1 gap-2">
            {CAC_GIA_TRI.map((g) => {
              const co = giaTri.includes(g.id);
              return (
                <button key={g.id} type="button" aria-pressed={co} onClick={() => batGiaTri(g.id)}
                  className={gop("min-h-12 rounded-xl border px-4 py-3 text-left text-[15px] font-semibold active:scale-[.99]", co ? "border-xanh bg-xanh-nhat text-xanh" : "border-vien bg-trang text-chu")}>
                  {g.chu}
                </button>
              );
            })}
          </div>
          <Nut muiTen onClick={xong}>Xem kết quả</Nut>
          <Nut kieu="nhe" bieuTuong={ArrowLeft} onClick={() => setBuoc(TONG_CAU - 1)}>Câu trước</Nut>
        </NoiDung>
      </>
    );
  }

  // ---------- Một tình huống ----------
  const c = CAC_CAU_HOI[buoc];
  return (
    <>
      <DauTrangCoQuayLai tieuDe="Trắc nghiệm hướng nghiệp" buoc={`Câu ${buoc + 1}/${TONG_CAU}`} quayLai={DUONG_DAN.hoSo()} />
      <NoiDung className="space-y-4">
        <ThanhTienDo phanTram={(buoc / (TONG_CAU + 1)) * 100} nhan="Tiến độ trắc nghiệm" />
        <The><p className="text-[18px] font-bold text-chu leading-snug" id="cau-hoi">{c.chu}</p></The>
        <div role="radiogroup" aria-labelledby="cau-hoi" className="grid grid-cols-1 gap-2">
          {c.luaChon.map((l, vt) => (
            <button key={l.chu} type="button" role="radio" aria-checked={dang[buoc] === vt} onClick={() => chon(vt)}
              className={gop("min-h-14 rounded-xl border px-4 py-3 text-left text-[15px] font-semibold leading-snug active:scale-[.99]",
                dang[buoc] === vt ? "border-xanh bg-xanh-nhat text-xanh" : "border-vien bg-trang text-chu")}>
              {l.chu}
            </button>
          ))}
        </div>
        <Nut kieu="nhe" bieuTuong={ArrowLeft} onClick={() => setBuoc(buoc - 1)}>{buoc === 0 ? "Về màn giới thiệu" : "Câu trước"}</Nut>
      </NoiDung>
    </>
  );
}

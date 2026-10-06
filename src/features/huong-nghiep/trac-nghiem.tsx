// Trắc nghiệm hướng nghiệp: 18 câu, mỗi câu một màn, kết quả gợi ý nhóm ngành dựa trên sở thích. Lưu vào hồ sơ.
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
import { CAC_CAU_HOI, CAC_LOAI, MUC_TRA_LOI, THONG_TIN_LOAI, khongRoNet, moTaTop, nhomNganhGoiY, tinhKetQua } from "./cau-hoi";

const TEN_NHOM = (ma: string) => TAT_CA_NGANH.find((n) => n.gia === ma)?.nhan ?? ma;
const SO_CT = (nhom: string) => LUA_CHON.filter((l) => l.nhomNganh === nhom).length;
const TONE_LOAI: Record<LoaiSoThich, "xanh" | "luc" | "cam" | "tim" | "do" | "muc"> = { R: "cam", I: "xanh", A: "tim", S: "luc", E: "do", C: "muc" };

export default function TracNghiem() {
  const { s, capNhatHoSo } = useApp();
  const nav = useNavigate();
  const [dang, setDang] = useState<(number | null)[]>(() => CAC_CAU_HOI.map(() => null));
  const [cau, setCau] = useState(-1); // -1 = màn giới thiệu
  const [lamLai, setLamLai] = useState(false);
  const kq = s.hoSo.soThich ?? null;

  const chon = (gia: number) => {
    const moi = dang.map((x, i) => (i === cau ? gia : x));
    setDang(moi);
    if (cau < CAC_CAU_HOI.length - 1) { setCau(cau + 1); return; }
    const ra = tinhKetQua(moi as number[]);
    if (ra) { capNhatHoSo({ soThich: ra }); setLamLai(false); setCau(-1); setDang(CAC_CAU_HOI.map(() => null)); }
  };

  if (kq && !lamLai) {
    const goiY = nhomNganhGoiY(kq);
    const lonNhat = Math.max(...CAC_LOAI.map((l) => kq.diem[l]), 1);
    const daCo = s.hoSo.nganhQuanTam;
    return (
      <>
        <DauTrangCoQuayLai tieuDe="Trắc nghiệm hướng nghiệp" quayLai={DUONG_DAN.hoSo()} />
        <NoiDung className="space-y-4">
          <The className="space-y-1">
            <p className="text-[13px] font-semibold text-chu-phu">Em nghiêng về</p>
            <p className="text-[20px] font-extrabold text-muc leading-tight">{khongRoNet(kq) ? "Chưa nổi bật nhóm nào" : moTaTop(kq)}</p>
            <p className="text-[14px] text-chu leading-snug">
              {khongRoNet(kq)
                ? "Điểm của các nhóm khá gần nhau, nghĩa là em thích khá đều nhiều kiểu việc. Em xem các nhóm ngành bên dưới như điểm bắt đầu, và thử làm lại sau khi trải nghiệm thêm."
                : kq.top.slice(0, 2).map((l) => THONG_TIN_LOAI[l].moTa).join(" ")}
            </p>
          </The>

          <section>
            <TieuDeMuc>Điểm từng nhóm</TieuDeMuc>
            <The className="space-y-3">
              {[...CAC_LOAI].sort((a, b) => kq.diem[b] - kq.diem[a]).map((l) => (
                <div key={l}>
                  <p className="flex justify-between text-[14px] text-chu mb-1"><span>{THONG_TIN_LOAI[l].ten}</span><b>{kq.diem[l]}/9</b></p>
                  <ThanhTienDo phanTram={(kq.diem[l] / lonNhat) * 100} tone={TONE_LOAI[l]} nhan={THONG_TIN_LOAI[l].ten} cao="h-2" />
                </div>
              ))}
            </The>
          </section>

          <section>
            <TieuDeMuc>Nhóm ngành đáng tìm hiểu</TieuDeMuc>
            <div className="space-y-2">
              {goiY.map((g) => {
                const da = daCo.includes(g.nhom);
                return (
                  <The key={g.nhom} className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-bold text-chu">{TEN_NHOM(g.nhom)}</p>
                      <p className="text-[13px] text-chu-phu">{SO_CT(g.nhom)} chương trình trong dữ liệu</p>
                    </div>
                    {da ? <Nhan tone="luc">Đã chọn</Nhan>
                      : <Nut rong={false} kieu="vien" className="min-h-11 px-3" onClick={() => capNhatHoSo({ nganhQuanTam: [...daCo, g.nhom] })}>Thêm</Nut>}
                  </The>
                );
              })}
            </div>
          </section>

          <DongThongBao tone="xanh" icon={Compass} tieuDe="Chỉ là gợi ý để em tìm hiểu"
            moTa="Kết quả cho biết em thích kiểu việc nào, không cho biết em giỏi hay đậu ngành nào. Em kết hợp với điểm số, học phí và nói chuyện với người đi trước trước khi quyết định." />
          <Nut muiTen onClick={() => nav(DUONG_DAN.khamPha())}>Khám phá các ngành này</Nut>
          <Nut kieu="vien" bieuTuong={RotateCcw} onClick={() => { setLamLai(true); setCau(-1); }}>Làm lại trắc nghiệm</Nut>
        </NoiDung>
      </>
    );
  }

  if (cau < 0) {
    return (
      <>
        <DauTrangCoQuayLai tieuDe="Trắc nghiệm hướng nghiệp" quayLai={DUONG_DAN.hoSo()} />
        <NoiDung className="space-y-4">
          <The className="space-y-2">
            <p className="text-[18px] font-extrabold text-muc leading-tight">Em thích làm kiểu việc nào?</p>
            <p className="text-[14px] text-chu leading-snug">18 câu ngắn, khoảng 3 phút. Không có đáp án đúng hay sai, em chọn theo cảm giác thật của mình. Kết quả giúp mình gợi ý nhóm ngành hợp sở thích của em, bên cạnh điểm số.</p>
          </The>
          <DongThongBao tone="xanh" icon={Compass} tieuDe="Dữ liệu ở lại trên máy em" moTa="Câu trả lời chỉ lưu trên thiết bị này, cùng hồ sơ của em." />
          <Nut muiTen onClick={() => setCau(0)}>Bắt đầu</Nut>
        </NoiDung>
      </>
    );
  }

  const c = CAC_CAU_HOI[cau];
  return (
    <>
      <DauTrangCoQuayLai tieuDe="Trắc nghiệm hướng nghiệp" buoc={`Câu ${cau + 1}/${CAC_CAU_HOI.length}`} quayLai={DUONG_DAN.hoSo()} />
      <NoiDung className="space-y-4">
        <ThanhTienDo phanTram={(cau / CAC_CAU_HOI.length) * 100} nhan="Tiến độ trắc nghiệm" />
        <The className="space-y-1">
          <p className="text-[13px] font-semibold text-chu-phu">Em có thích…</p>
          <p className="text-[18px] font-bold text-chu leading-snug" id="cau-hoi">{c.chu}</p>
        </The>
        <div role="radiogroup" aria-labelledby="cau-hoi" className="grid grid-cols-1 gap-2">
          {MUC_TRA_LOI.map((m) => (
            <button key={m.gia} type="button" role="radio" aria-checked={dang[cau] === m.gia} onClick={() => chon(m.gia)}
              className={gop("min-h-12 rounded-xl border px-4 py-3 text-left text-[15px] font-semibold active:scale-[.99]",
                dang[cau] === m.gia ? "border-xanh bg-xanh-nhat text-xanh" : "border-vien bg-trang text-chu")}>
              {m.nhan}
            </button>
          ))}
        </div>
        <Nut kieu="nhe" bieuTuong={ArrowLeft} onClick={() => setCau(cau - 1)}>{cau === 0 ? "Về màn giới thiệu" : "Câu trước"}</Nut>
      </NoiDung>
    </>
  );
}

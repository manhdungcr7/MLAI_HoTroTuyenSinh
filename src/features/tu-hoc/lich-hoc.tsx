// Lịch học của em: tiết cố định (chính khóa, học thêm, hoạt động khác). Giờ tự học được xếp vào khoảng trống còn lại.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, CalendarDays, CalendarPlus, Clock, Plus, Sparkles, Trash2, Wand2 } from "lucide-react";
import { DauTrangCoQuayLai, NoiDung } from "@/components/layout/khung";
import { NenHero } from "@/components/ui/hinh-nen";
import { HopTruot, TrangThaiTrong } from "@/components/ui/hien-thi";
import { OChon, OInput, Truong } from "@/components/ui/nhap-lieu";
import { Nhan, Nut, The, gop } from "@/components/ui/nut-the";
import { LICH_PHO_THONG_MAU } from "@/data/lich-mau";
import { DUONG_DAN } from "@/duong-dan";
import { phatHienTrung, phutTuGio } from "@/engine/xep-lich";
import { homNay, tuanHienTai, viecCuaTuan } from "@/state/chon";
import { useApp } from "@/state/store";
import { CAC_MON, TEN_MON, type MonId, type TietCoDinh } from "@/state/types";
import { HopNhapLichNhanh } from "@/features/ke-hoach/nhap-lich-nhanh";
import { LOAI_TIET, NhomChon, OGio } from "./thanh-phan";
import { NHAN_THU, TEN_THU, dangGio, soViet } from "./tinh-tien-do";

const CAC_THU = [1, 2, 3, 4, 5, 6, 7];
const thoiLuong = (t: Pick<TietCoDinh, "batDau" | "ketThuc">) => phutTuGio(t.ketThuc) - phutTuGio(t.batDau);

/** id các tiết đang trùng giờ với tiết khác cùng thứ. */
function idTrung(coDinh: TietCoDinh[]): Set<string> {
  const ra = new Set<string>();
  for (const thu of CAC_THU) for (const [a, b] of phatHienTrung(coDinh.filter((t) => t.thu === thu))) { ra.add(a.id); ra.add(b.id); }
  return ra;
}

export default function LichHoc() {
  const { s, xoaTiet, datCoDinh, xepLai } = useApp();
  const nav = useNavigate();
  const [moThem, setMoThem] = useState<number | null>(null); // số thứ được chọn sẵn, 0 = không chọn sẵn
  const [xoa, setXoa] = useState<TietCoDinh | null>(null);
  const [hoiMau, setHoiMau] = useState(false);
  const [moNhanh, setMoNhanh] = useState(false);
  const [daDoi, setDaDoi] = useState<string | null>(null);

  const coDinh = s.coDinh;
  const trung = idTrung(coDinh);
  const theoThu = CAC_THU.map((thu) => ({ thu, ds: coDinh.filter((t) => t.thu === thu).sort((a, b) => a.batDau.localeCompare(b.batDau)) }));
  const phutTruong = coDinh.filter((t) => t.loai === "chinhKhoa").reduce((t, x) => t + thoiLuong(x), 0);
  const phutThem = coDinh.filter((t) => t.loai === "hocThem").reduce((t, x) => t + thoiLuong(x), 0);
  const ngayTrong = theoThu.filter((n) => !n.ds.length).map((n) => NHAN_THU[n.thu]);

  /** Thay hẳn lịch đang có bằng lịch mẫu, hoặc chỉ thêm các tiết chưa có (bỏ tiết trùng đúng thứ và giờ). */
  const dungMau = (cheDo: "thay" | "them" = "thay") => {
    const them = LICH_PHO_THONG_MAU.filter((m) => !coDinh.some((c) => c.id === m.id || (c.thu === m.thu && c.loai === m.loai && c.batDau === m.batDau && c.ketThuc === m.ketThuc)));
    datCoDinh(cheDo === "thay" ? LICH_PHO_THONG_MAU : [...coDinh, ...them]);
    setHoiMau(false);
    setDaDoi(cheDo === "thay" ? `Đã dùng lịch mẫu (${LICH_PHO_THONG_MAU.length} tiết). Em sửa lại cho đúng lịch của mình nhé.` : `Đã thêm ${them.length} tiết từ lịch mẫu. Em sửa lại cho đúng lịch của mình nhé.`);
  };
  const xepLaiGiupEm = () => { xepLai(tuanHienTai(), homNay()); nav(DUONG_DAN.tuan("lich")); };

  return (
    <>
      <DauTrangCoQuayLai tieuDe="Lịch học của em" />
      <NoiDung>
        {daDoi && (
          <div role="status" className="rounded-the bg-xanh-nhat p-4 space-y-3">
            <p className="text-[14px] text-chu"><b className="block text-xanh text-[15px]">{daDoi}</b>
              {viecCuaTuan(s.viec, tuanHienTai()).length ? "Xếp lại lịch tự học giúp em để không bị trùng giờ?" : "Khi có việc cần học, mình sẽ xếp giờ tự học tránh các tiết này."}</p>
            {viecCuaTuan(s.viec, tuanHienTai()).length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                <Nut kieu="vien" onClick={() => setDaDoi(null)}>Để sau</Nut>
                <Nut bieuTuong={Wand2} onClick={xepLaiGiupEm}>Xếp lại</Nut>
              </div>
            )}
          </div>
        )}

        {!coDinh.length ? (
          <TrangThaiTrong bieuTuong={<CalendarDays size={26} />} tieuDe="Chưa có lịch học"
            moTa="Nhập giờ học ở trường và học thêm. Mình sẽ xếp giờ tự học vào khoảng trống, không bị trùng.">
            <div className="space-y-2">
              <Nut bieuTuong={CalendarPlus} onClick={() => setMoNhanh(true)}>Nhập nhanh buổi học</Nut>
              <Nut kieu="vien" bieuTuong={Plus} onClick={() => setMoThem(0)}>Thêm từng tiết</Nut>
              <Nut kieu="nhe" bieuTuong={Sparkles} onClick={() => dungMau()}>Dùng lịch mẫu</Nut>
            </div>
          </TrangThaiTrong>
        ) : (
          <>
            <NenHero tone="xanh" className="p-4">
              <p className="text-[13px] font-bold text-chu-phu">Mỗi tuần em có</p>
              <p className="text-[22px] font-extrabold text-muc leading-tight">{coDinh.length} tiết cố định</p>
              <p className="text-[13px] text-chu mt-0.5">
                {phutTruong > 0 && <>Ở trường {soViet(Math.round(phutTruong / 6) / 10)} giờ</>}
                {phutTruong > 0 && phutThem > 0 && " · "}
                {phutThem > 0 && <>Học thêm {soViet(Math.round(phutThem / 6) / 10)} giờ</>}
              </p>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3" aria-label="Chú thích màu">
                {Object.values(LOAI_TIET).map((l) => (
                  <span key={l.nhan} className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-chu"><span className={gop("size-2.5 rounded-full", l.nen)} />{l.nhan}</span>
                ))}
              </div>
            </NenHero>

            {trung.size > 0 && (
              <div role="alert" className="rounded-the bg-do-nhat p-3.5 flex gap-3">
                <AlertTriangle size={22} className="text-do-chu shrink-0 mt-0.5" />
                <p className="text-[13px] text-chu"><b className="block text-[15px] text-do-chu">Có tiết bị trùng giờ</b>Các tiết có nhãn “Trùng giờ” đang chồng lên nhau. Em xóa bớt hoặc nhập lại giờ cho đúng nhé.</p>
              </div>
            )}

            {theoThu.filter((n) => n.ds.length).map(({ thu, ds }) => (
              <section key={thu} aria-labelledby={`thu-${thu}`} className="rounded-the bg-trang border border-vien shadow-the px-4 pt-2 pb-1">
                <div className="flex items-center justify-between">
                  <h2 id={`thu-${thu}`} className={gop("text-[15px] font-extrabold", thu === 7 ? "text-do-chu" : "text-muc")}>
                    {TEN_THU[thu]} <span className="text-[13px] font-semibold text-chu-phu">· {ds.length} tiết</span>
                  </h2>
                  <button type="button" onClick={() => setMoThem(thu)} aria-label={`Thêm tiết vào ${TEN_THU[thu]}`}
                    className="min-h-11 -mr-2 px-2 rounded-full inline-flex items-center gap-1 text-[13px] font-bold text-xanh active:bg-xanh-nhat"><Plus size={16} />Thêm</button>
                </div>
                <ul className="divide-y divide-vien">
                  {ds.map((t) => (
                    <li key={t.id} className="flex items-center gap-3 min-h-14 py-2">
                      <span aria-hidden className={gop("w-1.5 self-stretch rounded-full", LOAI_TIET[t.loai].nen)} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-bold text-chu truncate">{t.ten}</p>
                        <p className="text-[13px] text-chu-phu flex items-center gap-x-1.5 gap-y-1 flex-wrap mt-0.5">
                          <span className="inline-flex items-center gap-1 whitespace-nowrap"><Clock size={13} />{t.batDau} – {t.ketThuc}</span>
                          <Nhan tone={LOAI_TIET[t.loai].tone}>{LOAI_TIET[t.loai].nhan}</Nhan>
                          {trung.has(t.id) && <Nhan tone="do">Trùng giờ</Nhan>}
                        </p>
                      </div>
                      <button type="button" onClick={() => setXoa(t)} aria-label={`Xóa ${t.ten}, ${TEN_THU[t.thu]}`}
                        className="size-11 -mr-2 grid place-items-center rounded-full text-chu-phu active:bg-do-nhat active:text-do-chu"><Trash2 size={18} /></button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}

            {ngayTrong.length > 0 && (
              <p className="text-[13px] text-chu-phu px-1">Chưa có tiết: <b className="text-chu">{ngayTrong.join(", ")}</b>. Những ngày này có nhiều thời gian tự học hơn.</p>
            )}

            <div className="pt-1"><Nut kieu="nhe" bieuTuong={CalendarPlus} onClick={() => setMoNhanh(true)}>Nhập nhanh buổi học</Nut></div>
            <div className="grid grid-cols-2 gap-2">
              <Nut bieuTuong={Plus} onClick={() => setMoThem(0)}>Thêm tiết</Nut>
              <Nut kieu="vien" bieuTuong={Sparkles} onClick={() => setHoiMau(true)}>Lịch mẫu</Nut>
            </div>
            <p className="text-[12px] text-chu-phu px-1">Giờ tự học luôn tránh các tiết này và chừa 10 phút trước, sau mỗi tiết để em di chuyển, chuẩn bị.</p>
          </>
        )}
      </NoiDung>

      {moNhanh && <HopNhapLichNhanh xong={(n) => { setMoNhanh(false); if (n > 0) setDaDoi(`Đã thêm ${n} tiết vào lịch học.`); }} />}

      {moThem !== null && (
        <HopThemTiet thuSan={moThem} dong={() => setMoThem(null)} xong={(n) => { setMoThem(null); setDaDoi(`Đã thêm ${n} tiết vào lịch học.`); }} />
      )}

      <HopTruot mo={!!xoa} dong={() => setXoa(null)} tieuDe="Xóa tiết này?">
        {xoa && (
          <div className="space-y-4">
            <The tone="xanh" className="!p-3">
              <p className="text-[15px] font-bold text-chu">{xoa.ten}</p>
              <p className="text-[13px] text-chu-phu">{TEN_THU[xoa.thu]} · {xoa.batDau} – {xoa.ketThuc} · {LOAI_TIET[xoa.loai].nhan}</p>
            </The>
            <p className="text-[14px] text-chu">Chỉ xóa tiết của {TEN_THU[xoa.thu]}. Các ngày khác giữ nguyên.</p>
            <div className="grid grid-cols-2 gap-2">
              <Nut kieu="vien" onClick={() => setXoa(null)}>Giữ lại</Nut>
              <Nut kieu="nguyHiem" bieuTuong={Trash2} onClick={() => { xoaTiet(xoa.id); setXoa(null); setDaDoi(`Đã xóa “${xoa.ten}” (${TEN_THU[xoa.thu]}).`); }}>Xóa tiết</Nut>
            </div>
          </div>
        )}
      </HopTruot>

      <HopTruot mo={hoiMau} dong={() => setHoiMau(false)} tieuDe="Dùng lịch mẫu?">
        <div className="space-y-4">
          <p className="text-[14px] text-chu">Lịch mẫu có {LICH_PHO_THONG_MAU.length} tiết: học ở trường sáng Thứ 2 đến Thứ 6, chiều Thứ 2, 4, 6 và một buổi học thêm tối. Đây chỉ là mẫu chung, em nên sửa cho đúng lịch của mình.</p>
          <p className="text-[14px] font-bold text-do-chu flex gap-2"><AlertTriangle size={18} className="shrink-0 mt-0.5" />Em đang có {coDinh.length} tiết. Em muốn thêm mẫu vào hay thay hẳn?</p>
          <div className="space-y-2">
            <Nut onClick={() => dungMau("them")}>Thêm vào lịch hiện có</Nut>
            <Nut kieu="nguyHiem" onClick={() => dungMau("thay")}>Thay bằng lịch mẫu</Nut>
            <Nut kieu="vien" onClick={() => setHoiMau(false)}>Giữ lịch cũ</Nut>
          </div>
        </div>
      </HopTruot>
    </>
  );
}

const GIO_GOI_Y: Record<TietCoDinh["loai"], [string, string]> = { chinhKhoa: ["07:00", "08:30"], hocThem: ["19:15", "21:00"], khac: ["16:00", "17:30"] };

function HopThemTiet({ thuSan, dong, xong }: { thuSan: number; dong: () => void; xong: (soTiet: number) => void }) {
  const { s, themTiet } = useApp();
  const [loai, setLoai] = useState<TietCoDinh["loai"]>("chinhKhoa");
  const [mon, setMon] = useState<MonId | "">("");
  const [ten, setTen] = useState("");
  const [thu, setThu] = useState<number[]>(thuSan ? [thuSan] : []);
  const [batDau, setBatDau] = useState(GIO_GOI_Y.chinhKhoa[0]);
  const [ketThuc, setKetThuc] = useState(GIO_GOI_Y.chinhKhoa[1]);
  const [daBam, setDaBam] = useState(false);

  const tenTuDong = mon ? (loai === "hocThem" ? `Học thêm ${TEN_MON[mon]}` : loai === "chinhKhoa" ? `${TEN_MON[mon]} (lớp học)` : TEN_MON[mon]) : "";
  const tenCuoi = ten.trim() || tenTuDong;
  const gioHopLe = !!batDau && !!ketThuc && phutTuGio(ketThuc) > phutTuGio(batDau);
  const loi = {
    ten: !tenCuoi ? "Em đặt tên cho tiết này, hoặc chọn môn để mình tự đặt tên." : "",
    thu: !thu.length ? "Chọn ít nhất một thứ trong tuần." : "",
    gio: !gioHopLe ? "Giờ kết thúc phải sau giờ bắt đầu." : phutTuGio(ketThuc) - phutTuGio(batDau) > 6 * 60 ? "Một tiết dài hơn 6 giờ, em kiểm tra lại giờ nhé." : "",
  };
  const coLoi = !!(loi.ten || loi.thu || (loi.gio && !gioHopLe));
  // Trùng giờ với tiết đã có: chỉ cảnh báo, em vẫn có thể lưu (ví dụ lịch học xen kẽ tuần chẵn/lẻ).
  const cacTrung = gioHopLe ? thu.flatMap((t) => phatHienTrung([
    ...s.coDinh.filter((x) => x.thu === t),
    { id: "moi", ten: tenCuoi, batDau, ketThuc },
  ]).filter(([a, b]) => a.id === "moi" || b.id === "moi").map(([a, b]) => ({ thu: t, voi: a.id === "moi" ? b : a }))) : [];

  const doiLoai = (l: TietCoDinh["loai"]) => {
    setLoai(l);
    // chỉ đổi giờ gợi ý khi em chưa sửa giờ
    if (Object.values(GIO_GOI_Y).some(([a, b]) => a === batDau && b === ketThuc)) { setBatDau(GIO_GOI_Y[l][0]); setKetThuc(GIO_GOI_Y[l][1]); }
  };
  const luu = () => {
    setDaBam(true);
    if (coLoi) return;
    for (const t of [...thu].sort()) themTiet({ ten: tenCuoi, loai, ...(mon ? { mon } : {}), thu: t, batDau, ketThuc });
    xong(thu.length);
  };

  return (
    <HopTruot mo dong={dong} tieuDe="Thêm tiết học">
      <div className="space-y-4">
        <div>
          <p className="text-[14px] font-bold text-chu mb-1.5">Loại</p>
          <NhomChon nhan="Loại tiết" cot={3} giaTri={loai} onChange={doiLoai}
            cacLua={(Object.keys(LOAI_TIET) as TietCoDinh["loai"][]).map((l) => ({ gia: l, nhan: l === "khac" ? "Khác" : LOAI_TIET[l].nhan }))} />
        </div>
        <Truong nhan="Môn học" goiY="Có môn thì mình nhắc em xem trước bài vào tối hôm trước.">
          <OChon value={mon} onChange={(e) => setMon(e.target.value as MonId | "")}>
            <option value="">Không theo môn</option>
            {CAC_MON.map((m) => <option key={m} value={m}>{TEN_MON[m]}</option>)}
          </OChon>
        </Truong>
        <Truong nhan="Tên tiết">
          <OInput value={ten} onChange={(e) => setTen(e.target.value)} maxLength={40} placeholder={tenTuDong || "Ví dụ: Câu lạc bộ bóng rổ"} aria-invalid={daBam && !!loi.ten} />
          {daBam && loi.ten && <span className="block text-[13px] text-do-chu mt-1">{loi.ten}</span>}
        </Truong>
        <div>
          <p className="text-[14px] font-bold text-chu mb-1.5">Học vào thứ mấy? <span className="font-semibold text-chu-phu">(chọn được nhiều)</span></p>
          <NhomChon nhan="Các thứ trong tuần" cot={7} giaTri={thu} onChange={(t) => setThu((c) => (c.includes(t) ? c.filter((x) => x !== t) : [...c, t]))}
            cacLua={CAC_THU.map((t) => ({ gia: t, nhan: NHAN_THU[t] }))} />
          {daBam && loi.thu && <span className="block text-[13px] text-do-chu mt-1">{loi.thu}</span>}
        </div>
        <div>
          <div className="grid grid-cols-2 gap-2">
            <OGio nhan="Bắt đầu" giaTri={batDau} onChange={setBatDau} loi={!gioHopLe} />
            <OGio nhan="Kết thúc" giaTri={ketThuc} onChange={setKetThuc} loi={!gioHopLe} />
          </div>
          {loi.gio ? <span role="alert" className="block text-[13px] text-do-chu mt-1">{loi.gio}</span>
            : <span className="block text-[12px] text-chu-phu mt-1">Thời lượng: {dangGio(phutTuGio(ketThuc) - phutTuGio(batDau))}</span>}
        </div>
        {cacTrung.length > 0 && (
          <div role="alert" className="rounded-xl bg-cam-nhat p-3 flex gap-2.5">
            <AlertTriangle size={20} className="text-cam-chu shrink-0 mt-0.5" />
            <p className="text-[13px] text-chu"><b className="block text-cam-chu text-[14px]">Trùng giờ với tiết đã có</b>
              {cacTrung.slice(0, 3).map((c) => `${NHAN_THU[c.thu]}: ${c.voi.ten} (${c.voi.batDau} – ${c.voi.ketThuc})`).join(" · ")}
              {cacTrung.length > 3 && ` và ${cacTrung.length - 3} chỗ khác`}. Em vẫn có thể lưu nếu đúng là vậy.</p>
          </div>
        )}
        <Nut bieuTuong={CalendarPlus} onClick={luu}>
          {cacTrung.length ? "Vẫn lưu" : thu.length > 1 ? `Lưu ${thu.length} tiết` : "Lưu tiết"}
        </Nut>
      </div>
    </HopTruot>
  );
}

// Phòng thử điểm: kéo cộng/trừ điểm từng môn của tổ hợp tốt nhất để xem ngành nào đổi nhãn. Chỉ xem thử, KHÔNG ghi vào hồ sơ.
// Đổi theo điểm chuẩn năm gần nhất của từng ngành, không phải xác suất. Số liệu tính tại chỗ từ danh mục thật.
import { useDeferredValue, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Info, Minus, PencilLine, Plus, RotateCcw, Sparkles } from "lucide-react";
import { DauTrangCoQuayLai, NoiDung } from "@/components/layout/khung";
import { KhungDangTai, KhungLoi, TrangThaiTrong } from "@/components/ui/hien-thi";
import { Nut } from "@/components/ui/nut-the";
import { HienDan, MAU_NHAN_NV, PillTrangThai, TheNen, useSoChay } from "@/components/ui/thiet-ke";
import { LUA_CHON_MAU } from "@/data/lua-chon-mau";
import { DUONG_DAN } from "@/duong-dan";
import { congDiemMon, doNhayTheoMon, monCuaToHopTotNhat, soSanhHaiDiem, type DoNhayMon } from "@/engine/ban-do-co-hoi";
import { dinhDangDiem, dinhDangSo } from "@/engine/dinh-dang";
import { tongChoLuaChon } from "@/features/kham-pha/to-hop";
import type { DiemDayDu, MonKhoi } from "@/state/types";
import { namDuBaoHienTai, useDiemEm, useTinhLucRanh } from "./dung-co-hoi";

const TOI_DA = 2, BUOC = 0.25;
const KEP = (v: number) => Math.min(TOI_DA, Math.max(-TOI_DA, Math.round(v / BUOC) * BUOC));
const cong = (d: number) => (d === 0 ? "giữ nguyên" : `${d > 0 ? "cộng" : "trừ"} ${dinhDangDiem(Math.abs(d))} điểm`);
const dau = (d: number) => (d === 0 ? "0" : `${d > 0 ? "+" : "−"}${dinhDangDiem(Math.abs(d))}`);

function ThanhKeoMon({ ten, goc, delta, onChange }: { ten: string; goc: number; delta: number; onChange: (d: number) => void }) {
  const moi = Math.min(10, Math.max(0, goc + delta));
  const kep = moi !== goc + delta;
  return (
    <div className="rounded-xl bg-nen p-3">
      <div className="flex items-baseline justify-between gap-2">
        <b className="text-[15px] text-muc">{ten}</b>
        <span className="text-[14px] text-chu tabular-nums">{dinhDangDiem(goc)} → <b className="text-muc">{dinhDangDiem(moi)}</b> <span className="text-chu-phu">({dau(delta)})</span></span>
      </div>
      <div className="mt-1 flex items-center gap-1">
        <button type="button" aria-label={`Giảm điểm ${ten}`} disabled={delta <= -TOI_DA} onClick={() => onChange(KEP(delta - BUOC))} className="size-11 shrink-0 rounded-xl bg-trang border border-vien grid place-items-center text-xanh disabled:opacity-40 active:bg-xanh-nhat cursor-pointer"><Minus size={18} aria-hidden /></button>
        <input type="range" min={-TOI_DA} max={TOI_DA} step={BUOC} value={delta} onChange={(e) => onChange(KEP(Number(e.target.value)))}
          aria-label={`Thử cộng trừ điểm ${ten}`} aria-valuetext={`${ten} ${cong(delta)}, thành ${dinhDangDiem(moi)} điểm${kep ? " (tối đa 10)" : ""}`}
          className="min-w-0 flex-1 h-11 accent-xanh cursor-pointer" />
        <button type="button" aria-label={`Tăng điểm ${ten}`} disabled={delta >= TOI_DA} onClick={() => onChange(KEP(delta + BUOC))} className="size-11 shrink-0 rounded-xl bg-trang border border-vien grid place-items-center text-xanh disabled:opacity-40 active:bg-xanh-nhat cursor-pointer"><Plus size={18} aria-hidden /></button>
      </div>
      {kep && <p className="text-[13px] text-chu-phu">Điểm một môn tối đa 10, nên phần cộng thêm được giữ ở 10.</p>}
    </div>
  );
}

function DongTong({ len, xuong }: { len: number; xuong: number }) {
  const a = useSoChay(len, 450), b = useSoChay(xuong, 450);
  return (
    <p className="text-[15px] leading-snug text-chu" role="status" aria-live="polite" aria-atomic="true">
      <b className="so-lon text-[24px] text-luc-chu tabular-nums">{dinhDangSo(a)}</b> ngành đổi sang nhãn cao hơn,{" "}
      <b className="so-lon text-[24px] text-cam-chu tabular-nums">{dinhDangSo(b)}</b> ngành thấp hơn.
    </p>
  );
}

function MonDangHoc({ ds, buoc }: { ds: DoNhayMon[]; buoc: number }) {
  const xep = [...ds].filter((m) => !m.daToiDa).sort((a, b) => b.moRa - a.moRa || b.doiNhan - a.doiNhan || a.ten.localeCompare(b.ten, "vi"));
  if (xep.length === 0) return <p className="text-[14px] text-chu">Các môn của tổ hợp đã đạt điểm tối đa, nên cộng thêm không đổi gì.</p>;
  const tatCa0 = xep.every((m) => m.doiNhan === 0);
  return (
    <>
      {tatCa0 && <p className="text-[14px] text-chu">Cộng {dinhDangDiem(buoc)} điểm một môn chưa làm ngành nào đổi nhãn. Thử kéo nhiều hơn ở trên.</p>}
      <ul className="space-y-2">
        {xep.map((m, i) => (
          <li key={m.mon} className="rounded-xl bg-nen p-3 text-[14px] leading-snug text-chu">
            <span className="flex flex-wrap items-center gap-2"><b className="text-[15px] text-muc">{m.ten} +{dinhDangDiem(buoc)}</b>{i === 0 && !tatCa0 && <PillTrangThai tong="luc" icon={Sparkles}>Nhiều nhất</PillTrangThai>}</span>
            <span className="block mt-0.5">Mở ra <b>{dinhDangSo(m.moRa)}</b> ngành (từ Thử sức lên Vừa sức trở lên); <b>{dinhDangSo(m.doiNhan)}</b> ngành đổi sang nhãn cao hơn.</span>
          </li>
        ))}
      </ul>
    </>
  );
}

export default function PhongThuDiem() {
  const nav = useNavigate();
  const { diem, khoa } = useDiemEm();
  const [delta, setDelta] = useState<Partial<Record<MonKhoi, number>>>({});
  const hoan = useDeferredValue(delta);
  const tc = useMemo(() => monCuaToHopTotNhat(diem), [diem]);
  const [ket, thuLai] = useTinhLucRanh(tc ? khoa : "trong", () => (tc ? doNhayTheoMon(LUA_CHON_MAU, diem, undefined, namDuBaoHienTai(), 1) : null));
  const san = ket.trang === "xong";

  const diemMoi = (d: Partial<Record<MonKhoi, number>>): DiemDayDu => (tc ? tc.mon.reduce((a, m) => congDiemMon(a, m.mon, d[m.mon] ?? 0), diem) : diem);
  const moiHoan = useMemo(() => diemMoi(hoan), [hoan, diem, tc]); // eslint-disable-line react-hooks/exhaustive-deps
  const ss = useMemo(() => (san && tc ? soSanhHaiDiem(LUA_CHON_MAU, diem, moiHoan, namDuBaoHienTai()) : null), [san, tc, diem, moiHoan]);
  const tongGoc = tc ? tongChoLuaChon({ toHopXet: [] }, diem).tong : null;
  const tongMoi = tc ? tongChoLuaChon({ toHopXet: [] }, diemMoi(delta)).tong : null;
  const coDoi = Object.values(delta).some((v) => v);

  return (
    <>
      <DauTrangCoQuayLai tieuDe="Phòng thử điểm" quayLai={DUONG_DAN.banDoCoHoi()} />
      <NoiDung>
        {!tc ? (
          <TrangThaiTrong bieuTuong={<PencilLine size={26} aria-hidden />} tieuDe="Chưa có điểm để thử" moTa="Nhập điểm đủ ba môn của một tổ hợp, em sẽ thử cộng trừ điểm từng môn ở đây.">
            <Nut muiTen onClick={() => nav(DUONG_DAN.batDau(2))}>Nhập điểm</Nut>
          </TrangThaiTrong>
        ) : ket.trang === "loi" ? (
          <KhungLoi moTa={`Chưa tính được (${ket.moTa}). Hồ sơ của em vẫn an toàn trên máy.`} thuLai={thuLai} />
        ) : (
          <>
            {ket.trang === "xong" && <span hidden data-tinh-ms={Math.round(ket.ms)} />}
            <TheNen tong="xanh" className="space-y-3">
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="text-[16px] font-extrabold text-muc">Thử điểm tổ hợp {tc.toHop}</h2>
                <span className="text-[14px] text-chu tabular-nums">{dinhDangDiem(tongGoc)} → <b className="text-muc">{dinhDangDiem(tongMoi)}</b>/30</span>
              </div>
              {tc.mon.map((m) => (
                <ThanhKeoMon key={m.mon} ten={m.ten} goc={m.diem} delta={delta[m.mon] ?? 0} onChange={(d) => setDelta((c) => ({ ...c, [m.mon]: d }))} />
              ))}
              {tc.monThieu.length > 0 && <p className="text-[13px] text-chu-phu">Chưa có điểm {tc.monThieu.join(", ")}, nên chưa thử được.</p>}
              <Nut kieu="vien" bieuTuong={RotateCcw} disabled={!coDoi} onClick={() => setDelta({})}>Về điểm của em</Nut>
            </TheNen>

            {ket.trang !== "xong" || !ss ? (
              <div role="status" aria-live="polite"><p className="text-[14px] text-chu-phu mb-3">Đang tính theo điểm của em…</p><KhungDangTai cao="h-24" soKhung={2} /></div>
            ) : (
              <HienDan className="space-y-3">
                <TheNen>
                  <DongTong len={ss.len} xuong={ss.xuong} />
                  <p className="mt-1 text-[13px] leading-snug text-chu-phu">Nhãn cao hơn nghĩa là điểm của em vượt điểm chuẩn nhiều hơn. Điểm thử chưa được lưu vào hồ sơ.</p>
                </TheNen>

                <TheNen as="section" aria-label="Môn đáng học nhất cho em" className="space-y-2">
                  <h2 className="text-[16px] font-extrabold text-muc">Môn đáng học nhất cho em</h2>
                  {ket.kq && <MonDangHoc ds={ket.kq.theoMon} buoc={ket.kq.buoc} />}
                </TheNen>

                <TheNen as="section" aria-label="Ngành đổi nhãn" className="space-y-2">
                  <h2 className="text-[16px] font-extrabold text-muc">Ngành đổi nhãn nổi bật</h2>
                  {ss.noiBat.length === 0 ? (
                    <p className="text-[14px] text-chu">{coDoi ? "Với mức này chưa có ngành nào đổi nhãn." : "Kéo một thanh ở trên, các ngành đổi nhãn sẽ hiện ở đây."}</p>
                  ) : (
                    <ul className="divide-y divide-vien">
                      {ss.noiBat.map((n) => (
                        <li key={n.id}>
                          <button type="button" onClick={() => nav(DUONG_DAN.chiTiet(n.id))} className="w-full min-h-14 py-2 text-left flex items-center gap-2 cursor-pointer active:bg-xanh-nhat rounded-lg">
                            <span className="min-w-0 flex-1">
                              <span className="block text-[14px] font-semibold text-chu leading-snug line-clamp-2">{n.nganh}</span>
                              <span className="block text-[13px] text-chu-phu truncate">{n.truong}</span>
                              <span className="mt-1 flex flex-wrap items-center gap-1">
                                <PillTrangThai tong={MAU_NHAN_NV[n.cu].tong} icon={MAU_NHAN_NV[n.cu].icon}>{n.cu}</PillTrangThai>
                                <ArrowRight size={14} className="text-chu-phu" aria-label={n.huong === "len" ? "lên" : "xuống"} />
                                <PillTrangThai tong={MAU_NHAN_NV[n.moi].tong} icon={MAU_NHAN_NV[n.moi].icon}>{n.moi}</PillTrangThai>
                              </span>
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </TheNen>
                <p className="flex items-start gap-2 text-[13px] leading-snug text-chu-phu"><Info size={16} className="mt-0.5 shrink-0" aria-hidden />Đổi theo điểm chuẩn năm gần nhất, không phải xác suất. Ngành chưa so được (điểm sàn, phương thức khác, thiếu điểm) không được tính.</p>
              </HienDan>
            )}
          </>
        )}
      </NoiDung>
    </>
  );
}

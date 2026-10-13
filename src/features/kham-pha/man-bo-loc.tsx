import { useMemo, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Check, School, Target } from "lucide-react";
import { DauTrangCoQuayLai, NoiDung } from "@/components/layout/khung";
import { Nut, gop } from "@/components/ui/nut-the";
import { ChonNhanh } from "@/components/ui/nhap-lieu";
import { LUA_CHON_MAU } from "@/data/lua-chon-mau";
import { DUONG_DAN } from "@/duong-dan";
import { useApp } from "@/state/store";
import { tongChoLuaChon } from "./to-hop";
import { BO_LOC_MAC_DINH, CAC_KHU_VUC, CAC_MUC_HOC_PHI, CAC_NHOM, loc, type BoLoc } from "./bo-loc";
import { useBoLoc } from "./dung-bo-loc";
import { boiCanhTu } from "./phu-hop";
import { dinhDang } from "@/engine/dinh-dang";

function Muc({ tieuDe, phu, children }: { tieuDe: string; phu?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-the bg-trang border border-vien shadow-the p-4 space-y-3" aria-label={tieuDe}>
      <h2 className="text-[15px] font-extrabold text-muc">{tieuDe}{phu && <span className="font-normal text-[13px] text-chu-phu"> {phu}</span>}</h2>
      {children}
    </section>
  );
}

const lam = (n: number) => Math.round(n * 2) / 2; // về bước 0.5 như thanh trượt

export default function ManBoLoc() {
  const nav = useNavigate();
  const { s } = useApp();
  const bc = useMemo(() => boiCanhTu(s), [s]);
  const tongEm = tongChoLuaChon({ toHopXet: [] }, bc.diem).tong; // tổ hợp cao nhất của em
  const [b, sua, datLai] = useBoLoc(CAC_KHU_VUC.includes(s.hoSo.khuVuc[0]) ? s.hoSo.khuVuc[0] : undefined);
  const soKq = loc(LUA_CHON_MAU, b, bc.tinh || undefined).length;
  const macDinh = JSON.stringify(b) === JSON.stringify(BO_LOC_MAC_DINH);

  const doiBac = (k: keyof BoLoc["bac"]) => {
    const moi = { ...b.bac, [k]: !b.bac[k] };
    if (!moi.daiHoc && !moi.caoDang) return; // giữ ít nhất một loại hình, nếu không danh sách sẽ luôn trống
    sua({ bac: moi });
  };

  return (
    <>
      <DauTrangCoQuayLai tieuDe="Bộ lọc" quayLai={DUONG_DAN.khamPha()} />
      <NoiDung className="space-y-3">
        <p className="text-[14px] text-chu-phu -mt-1">Chọn vài tiêu chí để chỉ thấy những trường đúng ngành, đúng tầm điểm và vừa học phí.</p>

        <Muc tieuDe="Ngành quan tâm" phu={bc.nganhQuanTam.length ? `(hồ sơ: ${bc.nganhQuanTam.join(", ")})` : undefined}>
          <ChonNhanh cacLua={[{ gia: "", nhan: "Tất cả" }, ...CAC_NHOM.map((n) => ({ gia: n, nhan: n }))]} giaTri={b.nhom} onChange={(v: string) => sua({ nhom: v })} />
        </Muc>

        <Muc tieuDe="Khoảng điểm tổ hợp" phu="(thang 30)">
          <div className="flex items-end justify-between">
            <p className="text-[24px] font-extrabold text-xanh leading-none">{dinhDang(b.diemTu, 1)} <span className="text-chu-phu text-[18px]">–</span> {dinhDang(b.diemDen, 1)}</p>
            <p className="text-[12px] text-chu-phu">điểm tham khảo</p>
          </div>
          <label className="block text-[13px] font-semibold text-chu">Thấp nhất
            <input type="range" min={0} max={30} step={0.5} value={b.diemTu} aria-valuetext={`${b.diemTu} điểm`}
              onChange={(e) => sua({ diemTu: Math.min(Number(e.target.value), b.diemDen) })} className="w-full accent-xanh h-11" />
          </label>
          <label className="block text-[13px] font-semibold text-chu">Cao nhất
            <input type="range" min={0} max={30} step={0.5} value={b.diemDen} aria-valuetext={`${b.diemDen} điểm`}
              onChange={(e) => sua({ diemDen: Math.max(Number(e.target.value), b.diemTu) })} className="w-full accent-xanh h-11" />
          </label>
          {tongEm !== null ? (
            <button type="button" onClick={() => sua({ diemTu: Math.max(0, lam(tongEm! - 3)), diemDen: Math.min(30, lam(tongEm! + 2)) })}
              className="w-full min-h-12 rounded-xl bg-xanh-nhat text-xanh text-[14px] font-bold inline-flex items-center justify-center gap-2 active:brightness-95">
              <Target size={17} />Lọc quanh điểm em ({dinhDang(tongEm, 1)})
            </button>
          ) : (
            <p className="text-[13px] text-chu-phu">Nhập điểm 3 môn của một tổ hợp trong hồ sơ để lọc nhanh quanh điểm của em.</p>
          )}
        </Muc>

        <Muc tieuDe="Học phí tối đa" phu="(triệu đồng/năm)">
          <ChonNhanh cot={2} cacLua={CAC_MUC_HOC_PHI} giaTri={b.hocPhi} onChange={(v: BoLoc["hocPhi"]) => sua({ hocPhi: v })} />
          {bc.nganSach !== null && <p className="text-[13px] text-chu-phu">Ngân sách trong hồ sơ của em: tối đa khoảng {bc.nganSach} triệu/năm.</p>}
        </Muc>

        <Muc tieuDe="Khu vực">
          <ChonNhanh cacLua={[{ gia: "", nhan: "Tất cả" }, ...CAC_KHU_VUC.map((k) => ({ gia: k, nhan: k }))]} giaTri={b.khuVuc} onChange={(v: string) => sua({ khuVuc: v })} />
        </Muc>

        <Muc tieuDe="Loại hình">
          <div className="grid grid-cols-2 gap-2">
            {([["daiHoc", "Đại học", School], ["caoDang", "Cao đẳng", Building2]] as const).map(([k, nhan, Icon]) => {
              const dang = b.bac[k];
              return (
                <button key={k} type="button" role="checkbox" aria-checked={dang} onClick={() => doiBac(k)}
                  className={gop("min-h-12 rounded-xl border text-[15px] font-bold inline-flex items-center justify-center gap-2 transition-colors",
                    dang ? "gd-xanh text-white border-transparent shadow-nut" : "bg-trang border-vien text-chu active:bg-xanh-nhat")}>
                  {dang ? <Check size={18} strokeWidth={3} /> : <Icon size={18} />}{nhan}
                </button>
              );
            })}
          </div>
          <p className="text-[12px] text-chu-phu">Cần chọn ít nhất một loại hình.</p>
        </Muc>

        <Muc tieuDe="Em có sẵn sàng học xa nhà?">
          <ChonNhanh cot={3} cacLua={[{ gia: "khong", nhan: "Không" }, { gia: "co", nhan: "Có" }, { gia: "tuyTruongHop", nhan: "Tùy trường" }]} giaTri={b.hocXa} onChange={(v: BoLoc["hocXa"]) => sua({ hocXa: v })} />
          {b.hocXa === "khong" && (bc.tinh
            ? <p className="text-[13px] text-chu-phu">Chỉ giữ trường ở {bc.tinh}.</p>
            : <p className="text-[13px] text-cam-chu">Em chưa chọn nơi đang sống trong hồ sơ nên mục này chưa lọc được. <button type="button" onClick={() => nav(DUONG_DAN.batDau(1))} className="font-bold text-xanh underline min-h-11">Cập nhật hồ sơ</button></p>)}
        </Muc>

        {/* Thanh nút dính ngay trên thanh tab (cao khoảng 72px) để luôn thấy số kết quả khi chỉnh. */}
        <div className="sticky bottom-[72px] z-20 -mx-4 px-4 pt-3 pb-3 bg-nen border-t border-vien">
          {soKq === 0 && <p className="text-[13px] text-cam-chu font-semibold mb-2" role="status">Chưa có trường nào khớp. Thử nới bớt tiêu chí nhé.</p>}
          <div className="grid grid-cols-[96px_1fr] gap-2">
            <Nut kieu="vien" onClick={datLai} disabled={macDinh}>Đặt lại</Nut>
            <Nut onClick={() => nav(DUONG_DAN.khamPha())}>
              Áp dụng ({soKq})
            </Nut>
          </div>
        </div>
      </NoiDung>
    </>
  );
}

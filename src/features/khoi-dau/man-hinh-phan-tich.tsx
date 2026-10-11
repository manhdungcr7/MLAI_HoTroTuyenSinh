// Màn ngay sau khi tạo hồ sơ: cho em thấy kết quả thật (bao nhiêu ngành trong tầm điểm), thay cho màn chờ giả.
// Số liệu lấy từ tinhCoHoi của Khám phá, nên khớp đúng con số em sẽ thấy ở tab Khám phá.
import { CheckCircle2, Compass, ListChecks, PencilLine, Sparkles } from "lucide-react";
import { NoiDung } from "@/components/layout/khung";
import { BieuTuongTron, NenHero } from "@/components/ui/hinh-nen";
import { Nut, The } from "@/components/ui/nut-the";
import { LUA_CHON } from "@/data/lua-chon-that";
import { dinhDang } from "@/engine/dinh-dang";
import type { KetQuaBanDau } from "./tinh-toan";

const SO_TRUONG = new Set(LUA_CHON.map((l) => l.maTruong ?? l.truong)).size;
const so = (n: number) => n.toLocaleString("vi-VN");

export function ManHinhKetQua({ kq, denNguyenVong, onDi, onNhapDiem }: {
  kq: KetQuaBanDau;
  /** true: lối chính là lập danh sách nguyện vọng (lớp 12, thi lại); false: Khám phá. */
  denNguyenVong: boolean;
  onDi: () => void;
  onNhapDiem: () => void;
}) {
  return (
    <div className="min-h-dvh flex flex-col">
      <NoiDung className="flex-1 pt-6">
        <NenHero tone="xanh" className="p-5">
          <span className="flex items-center gap-3">
            <BieuTuongTron icon={CheckCircle2} tone="luc" kichThuoc={48} />
            <span className="min-w-0">
              <b className="block text-[20px] leading-tight text-muc">Hồ sơ của em đã sẵn sàng</b>
              <span className="block text-[13px] text-chu-phu mt-0.5">Mình đã so với {so(LUA_CHON.length)} chương trình của {SO_TRUONG} trường.</span>
            </span>
          </span>
        </NenHero>

        {kq.coDiem && kq.tong !== null ? (
          <>
            <The className="space-y-3">
              <p className="text-[14px] text-chu">
                Tổ hợp cao nhất của em: <b className="text-muc">{kq.toHop}</b> · <b className="text-[18px] text-muc">{dinhDang(kq.tong, 1)}</b> điểm
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-xl bg-luc-nhat p-3">
                  <b className="block text-[24px] leading-none text-luc-chu">{so(kq.soDuDiem)}</b>
                  <span className="block mt-1 text-[13px] text-chu">ngành đủ điểm chuẩn năm gần nhất</span>
                </div>
                <div className="rounded-xl bg-cam-nhat p-3">
                  <b className="block text-[24px] leading-none text-cam-chu">{so(kq.soThuSuc)}</b>
                  <span className="block mt-1 text-[13px] text-chu">ngành có thể thử sức (thiếu dưới 2 điểm)</span>
                </div>
              </div>
            </The>

            {kq.nhomQuanTam.length > 0 && (
              <section aria-label="Nhóm ngành em quan tâm">
                <h2 className="text-[15px] font-bold text-muc mb-2">Nhóm ngành em quan tâm</h2>
                <ul className="space-y-2">
                  {kq.nhomQuanTam.map((g) => (
                    <li key={g.nhom} className="flex items-center justify-between gap-2 rounded-xl border border-vien bg-trang px-3 min-h-12">
                      <span className="text-[14px] font-semibold text-chu">{g.nhom}</span>
                      <span className="text-[13px] text-chu-phu text-right">
                        {g.duDiem + g.thuSuc === 0
                          ? "chưa có ngành trong tầm điểm"
                          : <><b className="text-luc-chu">{so(g.duDiem)}</b> đủ điểm · <b className="text-cam-chu">{so(g.thuSuc)}</b> thử sức</>}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <p className="text-[12px] text-chu-phu">Chỉ tính ngành xét điểm thi tốt nghiệp THPT, so với điểm chuẩn các năm trước, đã gồm điểm ưu tiên em khai. Không phải xác suất đậu.</p>
          </>
        ) : (
          <The className="flex items-start gap-3">
            <Sparkles size={22} className="text-xanh shrink-0 mt-0.5" />
            <p className="text-[14px] text-chu">Em chưa nhập đủ điểm 3 môn của một tổ hợp, nên mình chưa so được với điểm chuẩn. Em vẫn xem được các ngành, và nhập điểm lúc nào cũng được.</p>
          </The>
        )}
      </NoiDung>

      <div className="sticky bottom-0 z-20 border-t border-vien bg-nen px-4 pt-2.5 pb-2 vung-an-toan-duoi space-y-2">
        <Nut muiTen bieuTuong={denNguyenVong ? ListChecks : Compass} onClick={onDi}>{denNguyenVong ? "Lập danh sách nguyện vọng" : "Khám phá ngành học"}</Nut>
        {!kq.coDiem && <Nut kieu="vien" bieuTuong={PencilLine} onClick={onNhapDiem}>Nhập điểm</Nut>}
      </div>
    </div>
  );
}

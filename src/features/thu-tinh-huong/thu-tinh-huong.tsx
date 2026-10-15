// Màn 13 · "Nếu tăng điểm thì sao?": chọn môn, kéo cộng/trừ, xem tổng điểm và tóm tắt thay đổi ngay.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Bookmark, ChevronDown, GraduationCap, RotateCcw, School, SlidersHorizontal, Target, Wallet } from "lucide-react";
import { DauTrangCoQuayLai, NoiDung } from "@/components/layout/khung";
import { NenHero } from "@/components/ui/hinh-nen";
import { ChonNhanh } from "@/components/ui/nhap-lieu";
import { Nhan, Nut, The, gop } from "@/components/ui/nut-the";
import { DongThongBao } from "@/components/ui/thong-bao";
import { LUA_CHON_MAU } from "@/data/lua-chon-mau";
import { DUONG_DAN } from "@/duong-dan";
import { TEN_MON, TEN_MON_NGAN, type MonId } from "@/state/types";
import { NGUONG_PHU_HOP } from "@/engine/phan-tich";
import { BaoNho, GhiChuDuLieu, ThanhTruot, ThieuDiem, TruocSau, useLuuTinhHuong, useTinhHuong } from "./dung-chung";
import { DANG_THU_MAC_DINH, MO_TA_UU_TIEN, NGAN_SACH_KHONG_GIOI_HAN, TEN_UU_TIEN, apDungCong, vietCong, vietDiem, type UuTien } from "./tinh-toan";
import { dinhDangDiem } from "@/engine/dinh-dang";

// Thứ tự nút môn theo ref: các môn hay thi trước.
const THU_TU_MON: MonId[] = ["toan", "nguVan", "tiengAnh", "vatLy", "hoaHoc", "sinh"];
const cacKhuVucDanhMuc = () => [...new Set(LUA_CHON_MAU.map((l) => l.khuVuc))]; // tính khi gọi: danh mục nạp lười
const VACH_CONG = [-4, -2, -1, 0, 1, 2, 4].map((g) => ({ gia: g, chu: g > 0 ? `+${g}` : g < 0 ? `−${-g}` : "0" }));

export default function ThuTinhHuong() {
  const nav = useNavigate();
  const t = useTinhHuong();
  const { diem, toHop, maToHop, dkGoc, dangThu, datDangThu, thieu, kq } = t;
  const { luu, bao } = useLuuTinhHuong(t);
  const [moDieuKien, setMoDieuKien] = useState(false);

  const mon = dangThu.monDangChon;
  const cong = dangThu.congMon[mon] ?? 0;
  const diemMon = diem[mon];
  const sauCong = apDungCong(diem, dangThu.congMon);
  const trongToHop = toHop.includes(mon);
  const soDieuKienDoi = [dangThu.nganSachTrieu !== null && dangThu.nganSachTrieu !== dkGoc.nganSachTrieu, dangThu.khuVuc !== null && dangThu.khuVuc !== dkGoc.khuVuc, dangThu.uuTien !== null && dangThu.uuTien !== dkGoc.uuTien].filter(Boolean).length;

  const datCong = (v: number) => datDangThu((c) => ({ ...c, congMon: { ...c.congMon, [mon]: v } }));
  const chonMon = (m: MonId) => datDangThu((c) => ({ ...c, monDangChon: m }));

  return (
    <>
      <DauTrangCoQuayLai tieuDe="Thử tình huống" quayLai={DUONG_DAN.nguyenVong()} />
      <NoiDung>
        <NenHero className="p-4">
          <h2 className="text-[22px] leading-tight font-extrabold text-muc">Nếu tăng điểm thì sao?</h2>
          <p className="text-[14px] text-chu mt-1">Thử tăng hoặc giảm điểm một môn để xem danh sách trường phù hợp thay đổi thế nào.</p>
          <span className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-trang/80 px-2 py-1 text-[12px] font-bold text-xanh">
            <Target size={14} />Tổ hợp {maToHop} · {toHop.map((m) => TEN_MON_NGAN[m]).join(" – ")}
          </span>
        </NenHero>

        {thieu.length > 0 ? <ThieuDiem maToHop={maToHop} thieu={thieu} /> : (
          <>
            {/* Chọn môn */}
            <section aria-labelledby="chon-mon">
              <div className="flex items-center justify-between mb-2 mt-1">
                <h2 id="chon-mon" className="text-[16px] font-extrabold text-muc">Chọn môn muốn thử</h2>
                {kq.coThayDoi && (
                  <button type="button" onClick={() => datDangThu({ ...DANG_THU_MAC_DINH, monDangChon: mon })}
                    className="min-h-11 px-2 -mr-2 inline-flex items-center gap-1 text-[13px] font-bold text-xanh">
                    <RotateCcw size={15} />Đặt lại
                  </button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Môn muốn thử">
                {THU_TU_MON.map((m) => {
                  const chon = m === mon, c = dangThu.congMon[m] ?? 0;
                  return (
                    <button key={m} type="button" role="radio" aria-checked={chon} onClick={() => chonMon(m)}
                      className={gop("min-h-16 rounded-xl border px-1 py-2 flex flex-col items-center justify-center gap-0.5 transition-colors",
                        chon ? "gd-xanh border-transparent text-white shadow-nut" : "bg-trang border-vien text-chu active:bg-xanh-nhat")}>
                      <span className="text-[14px] font-bold leading-tight">{TEN_MON_NGAN[m]}{toHop.includes(m) && <span className={gop("ml-0.5", chon ? "text-white/80" : "text-xanh")} aria-label={`thuộc ${maToHop}`}>•</span>}</span>
                      <span className={gop("text-[15px] font-extrabold leading-tight", chon ? "text-white" : c > 0 ? "text-luc-chu" : c < 0 ? "text-do-chu" : "text-chu-phu")}>
                        {diem[m] === null ? <span className="text-[12px] font-semibold">chưa có</span> : vietCong(c)}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[12px] text-chu-phu mt-1.5">Dấu <b className="text-xanh">•</b> là môn thuộc tổ hợp {maToHop}, ảnh hưởng tới tổng điểm.</p>
            </section>

            {/* Kéo điểm môn đang chọn */}
            <The>
              {diemMon === null ? (
                <div className="text-center py-2">
                  <p className="font-extrabold text-muc">Bạn chưa có điểm {TEN_MON[mon]}</p>
                  <p className="text-[13px] text-chu-phu mt-1 mb-3">Nhập điểm môn này trước, rồi quay lại thử tăng điểm.</p>
                  <Nut kieu="nhe" muiTen onClick={() => nav(DUONG_DAN.diemThiThu())}>Nhập điểm thi thử</Nut>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[15px] font-extrabold text-muc">{TEN_MON[mon]}: {vietCong(cong)} điểm</p>
                      <p className="mt-1 text-[28px] leading-none font-extrabold">
                        <span className="text-xanh">{vietDiem(diemMon)}</span>
                        <ArrowRight size={22} className="inline mx-2 text-chu-phu align-[-2px]" aria-label="thành" />
                        <span className={cong > 0 ? "text-luc-chu" : cong < 0 ? "text-do-chu" : "text-xanh"}>{vietDiem(sauCong[mon]!)}</span>
                      </p>
                    </div>
                    <span className={gop("rounded-lg px-2.5 py-1 text-[14px] font-extrabold text-white", cong < 0 ? "gd-do" : "gd-xanh")}>{vietCong(cong)}</span>
                  </div>
                  <div className="mt-3">
                    <ThanhTruot gia={cong} min={-4} max={4} buoc={0.25} tuGiua onChange={datCong} nhan={`điểm ${TEN_MON[mon]}`}
                      vach={VACH_CONG} vietGia={(v) => `${vietCong(v)} điểm, ${TEN_MON[mon]} thành ${vietDiem(apDungCong(diem, { [mon]: v })[mon]!)}`} />
                  </div>
                  {(diemMon + cong > 10 || diemMon + cong < 0) && (
                    <p className="mt-2 text-[12px] text-cam-chu font-semibold">Điểm mỗi môn chỉ từ 0 đến 10 nên được giữ ở {vietDiem(sauCong[mon]!)}.</p>
                  )}
                  {!trongToHop && (
                    <p className="mt-2 text-[13px] text-chu-phu">{TEN_MON[mon]} không thuộc tổ hợp {maToHop} nên chưa làm đổi tổng điểm.</p>
                  )}
                </>
              )}
            </The>

            {/* Tổng điểm tổ hợp */}
            <The>
              <h3 className="text-[15px] font-extrabold text-muc">Tổng điểm tổ hợp ({maToHop})</h3>
              <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <div className="rounded-xl bg-nen p-2.5 text-center">
                  <p className="text-[12px] text-chu-phu">Hiện tại</p>
                  <p className="text-[24px] font-extrabold text-muc leading-tight">{dinhDangDiem(kq.tongTruoc)}</p>
                  <p className="text-[12px] text-chu-phu leading-snug">{toHop.map((m) => `${TEN_MON_NGAN[m]} ${vietDiem(diem[m]!)}`).join(" + ")}</p>
                </div>
                <ArrowRight size={20} className="text-chu-phu" aria-label="thành" />
                <div className={gop("rounded-xl p-2.5 text-center", kq.tongSau > kq.tongTruoc ? "bg-luc-nhat" : kq.tongSau < kq.tongTruoc ? "bg-do-nhat" : "bg-nen")}>
                  <p className="text-[12px] text-chu-phu">Sau khi thử</p>
                  <p className={gop("text-[24px] font-extrabold leading-tight", kq.tongSau > kq.tongTruoc ? "text-luc-chu" : kq.tongSau < kq.tongTruoc ? "text-do-chu" : "text-muc")}>{dinhDangDiem(kq.tongSau)}</p>
                  <p className="text-[12px] text-chu-phu leading-snug">{toHop.map((m) => `${TEN_MON_NGAN[m]} ${vietDiem(sauCong[m]!)}`).join(" + ")}</p>
                </div>
              </div>
            </The>

            {/* Tóm tắt thay đổi dự kiến */}
            <The tone="xanh">
              <h3 className="text-[15px] font-extrabold text-xanh">Tóm tắt thay đổi dự kiến</h3>
              <ul className="mt-1 divide-y divide-xanh/10">
                {([
                  { icon: GraduationCap, nhan: `Trường phù hợp (từ ${NGUONG_PHU_HOP} điểm)`, ab: kq.phuHop },
                  { icon: School, nhan: "Đạt mức điểm tham khảo", ab: kq.datThamKhao },
                  { icon: Wallet, nhan: "Học phí trong ngân sách (ngành đã có học phí)", ab: kq.hocPhiVua },
                ] as const).map((d) => (
                  <li key={d.nhan} className="flex items-center gap-2.5 py-2">
                    <d.icon size={18} className="text-xanh shrink-0" />
                    <span className="flex-1 text-[14px] text-chu">{d.nhan}</span>
                    {d.ab[0] === d.ab[1] ? <span className="text-[13px] text-chu-phu">không đổi ({d.ab[0]})</span> : <TruocSau truoc={d.ab[0]} sau={d.ab[1]} cao />}
                  </li>
                ))}
              </ul>
              <p className="text-[12px] text-chu-phu mt-1">Tính trên {kq.dong.length} ngành mình so được với điểm của bạn (mỗi ngành theo đúng tổ hợp xét tuyển của nó).{kq.khacPhuongThuc > 0 ? ` ${kq.khacPhuongThuc} chương trình có điểm thuộc phương thức khác (học bạ, ĐGNL, năng khiếu...) chưa so được với điểm thi THPT nên không nằm trong phần này.` : ""}</p>
            </The>

            {/* Thêm điều kiện (thu gọn) */}
            <div className="rounded-the bg-trang border border-vien shadow-the">
              <button type="button" aria-expanded={moDieuKien} aria-controls="them-dieu-kien" onClick={() => setMoDieuKien((x) => !x)}
                className="w-full min-h-14 px-4 flex items-center gap-3 text-left">
                <SlidersHorizontal size={20} className="text-xanh shrink-0" />
                <span className="flex-1 min-w-0">
                  <b className="block text-[15px] text-muc">Thêm điều kiện</b>
                  <span className="block text-[12px] text-chu-phu">Ngân sách, khu vực, điều bạn ưu tiên</span>
                </span>
                {soDieuKienDoi > 0 && <Nhan tone="xanh">Đã đổi {soDieuKienDoi}</Nhan>}
                <ChevronDown size={20} className={gop("text-chu-phu shrink-0 transition-transform", moDieuKien && "rotate-180")} />
              </button>
              {moDieuKien && (
                <div id="them-dieu-kien" className="px-4 pb-4 space-y-4 border-t border-vien pt-3">
                  <div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-[14px] font-bold text-chu">Ngân sách học phí mỗi năm</span>
                      <b className="text-[15px] text-xanh">{kq.dkMoi.nganSachTrieu} triệu</b>
                    </div>
                    {!dkGoc.coNganSach && dangThu.nganSachTrieu === null && <p className="text-[12px] text-chu-phu">Hồ sơ chưa có ngân sách nên đang tính như không giới hạn.</p>}
                    <div className="mt-1">
                      <ThanhTruot gia={kq.dkMoi.nganSachTrieu} min={10} max={NGAN_SACH_KHONG_GIOI_HAN} buoc={5} nhan="ngân sách học phí"
                        onChange={(v) => datDangThu((c) => ({ ...c, nganSachTrieu: v }))} vietGia={(v) => `${v} triệu mỗi năm`}
                        vach={[{ gia: 10, chu: "10" }, { gia: 80, chu: "80" }, { gia: 150, chu: "150" }]} />
                    </div>
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-chu mb-1.5">Khu vực ưu tiên học tập</p>
                    <ChonNhanh cacLua={[{ gia: "", nhan: "Mọi nơi" }, ...cacKhuVucDanhMuc().map((k) => ({ gia: k, nhan: k }))]} giaTri={kq.dkMoi.khuVuc}
                      onChange={(v: string) => datDangThu((c) => ({ ...c, khuVuc: v }))} />
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-chu mb-1.5">Ưu tiên cá nhân</p>
                    <ChonNhanh cacLua={(Object.keys(TEN_UU_TIEN) as UuTien[]).map((u) => ({ gia: u, nhan: TEN_UU_TIEN[u] }))} giaTri={kq.dkMoi.uuTien}
                      onChange={(v: UuTien) => datDangThu((c) => ({ ...c, uuTien: v }))} />
                    <p className="text-[12px] text-chu-phu mt-1">{MO_TA_UU_TIEN[kq.dkMoi.uuTien]}.</p>
                  </div>
                  {soDieuKienDoi > 0 && (
                    <Nut kieu="nhe" bieuTuong={RotateCcw} onClick={() => datDangThu((c) => ({ ...c, nganSachTrieu: null, khuVuc: null, uuTien: null }))}>Dùng lại theo hồ sơ</Nut>
                  )}
                </div>
              )}
            </div>

            {kq.dem.moiMo > 0 && (
              <DongThongBao tone="luc" icon={GraduationCap} tieuDe={`Bạn mở thêm ${kq.dem.moiMo} lựa chọn phù hợp`} moTa="Bấm Xem thay đổi để biết đó là trường nào." />
            )}
            <GhiChuDuLieu />

            {/* Thanh hành động dính trên thanh tab */}
            <div className="sticky bottom-[76px] z-20 -mx-4 px-4 pt-2 pb-1 bg-nen border-t border-vien/60 space-y-2">
              <BaoNho bao={bao} />
              <div className="grid grid-cols-2 gap-2">
                <Nut kieu="vien" bieuTuong={Bookmark} onClick={luu} className="px-2">Lưu tình huống</Nut>
                <Nut muiTen onClick={() => nav(DUONG_DAN.thuTinhHuongKetQua())}>Xem thay đổi</Nut>
              </div>
            </div>
          </>
        )}
      </NoiDung>
    </>
  );
}

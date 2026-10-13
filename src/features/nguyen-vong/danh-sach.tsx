// Màn 11 · Danh sách nguyện vọng: NV1..NVn, nhãn tính từ điểm của em, kéo thả + nút lên/xuống, sửa/xóa có hoàn tác.
import { useCallback, useMemo, useState } from "react";
import { coHocPhi, hocPhiChu } from "@/data/lua-chon-phu";
import { useNavigate } from "react-router-dom";
import {
  ArrowDown, ArrowUp, ChevronRight, ClipboardPen, Eye, GraduationCap, GripVertical, Heart, ListPlus, Pencil, Plus, ShieldCheck, Trash2, TrendingUp, Wallet,
} from "lucide-react";
import { DauTrangChinh, NoiDung } from "@/components/layout/khung";
import { NhanNguyenVongTag } from "@/components/ui/co-cau";
import { HopTruot, TieuDeMuc, TrangThaiTrong } from "@/components/ui/hien-thi";
import { BieuTuongTron, HuyHieuTruong, NenHero } from "@/components/ui/hinh-nen";
import { HangBam, Nhan, Nut, gop } from "@/components/ui/nut-the";
import { DongThongBao } from "@/components/ui/thong-bao";
import { tim } from "@/data/lua-chon-mau";
import { DUONG_DAN } from "@/duong-dan";
import { duBaoCua } from "@/features/kham-pha/du-bao";
import { diemDayDu } from "@/features/kham-pha/to-hop";
import { useApp } from "@/state/store";
import { GoiYSheet, NutGoiYDanhSach } from "./goi-y-sheet";
import { useKeoTha } from "./dung-keo-tha";
import { CanhBaoThuTuThe, CoCauMini, GhiChuDuLieu, OSoThuTu, ThanhHoanTac, useHoanTac } from "./thanh-phan";
import { SO_NV_GOI_Y, canhBaoThuTu, demNhan, dungDanhSach, ketLuan, toHopTotNhat, xetCoCau, type DongNV } from "./tinh-toan";
import { NutTuVan } from "@/features/tu-van/tu-van";
import { dinhDang } from "@/engine/dinh-dang";

const tenNgan = (d: DongNV) => (d.lc ? `${d.lc.truong} · ${d.lc.nganh}` : "lựa chọn này");

export default function DanhSachNguyenVong() {
  const nav = useNavigate();
  const { s, datNguyenVong, xoaNguyenVong, doiViTri } = useApp();
  const diemMon = diemDayDu(s);
  const tongTot = toHopTotNhat(diemMon);
  const tong = tongTot.tong;
  const ds = useMemo(() => dungDanhSach(s.nguyenVong, diemMon, tim), [s.nguyenVong, s.diemThi, s.hoSo.diem]); // eslint-disable-line react-hooks/exhaustive-deps
  const coCau = xetCoCau(demNhan(ds), ds.length);
  const kl = ketLuan(coCau);
  const canhBao = useMemo(() => canhBaoThuTu(ds), [ds]);
  const { tin, bao, an } = useHoanTac();
  const [dangSua, setDangSua] = useState<string | null>(null);
  const [dangXoa, setDangXoa] = useState<string | null>(null);
  const [moGoiY, setMoGoiY] = useState(false);

  /** Chuyển một nguyện vọng tới vị trí mới, báo kèm nút hoàn tác. */
  const chuyen = useCallback((tu: number, den: number) => {
    if (den < 0 || den >= s.nguyenVong.length || tu === den) return;
    const d = ds[tu];
    doiViTri(tu, den);
    bao(`Đã chuyển ${d?.lc?.truong ?? "nguyện vọng"} sang NV${den + 1}`, () => doiViTri(den, tu));
  }, [ds, doiViTri, bao, s.nguyenVong.length]);

  const { keo, tayNam, kieuHang, ganHang } = useKeoTha(ds.length, chuyen);

  const xoa = (id: string) => {
    const viTri = s.nguyenVong.indexOf(id);
    const d = ds[viTri];
    const snapshotCu = [...s.nguyenVong];
    xoaNguyenVong(id);
    setDangXoa(null); setDangSua(null);
    // Hoàn tác: khôi phục chính xác danh sách cũ bằng snapshot
    bao(`Đã xóa NV${viTri + 1} · ${d?.lc?.truong ?? "nguyện vọng"}`, () => datNguyenVong(snapshotCu));
  };

  const dongSua = ds.find((d) => d.id === dangSua);
  const dongXoa = ds.find((d) => d.id === dangXoa);

  return (
    <>
      <DauTrangChinh tieuDe="Danh sách nguyện vọng" moTa="Em vào NV cao nhất đủ điểm, nên NV1 là trường muốn nhất." />
      <NoiDung>
        <NutTuVan nguCanh="Danh sách nguyện vọng" />
        {ds.length === 0 ? (
          <TrangThaiTrong bieuTuong={<Heart size={26} />} tieuDe="Em chưa có nguyện vọng nào"
            moTa="Vào Khám phá, mở một trường em thích rồi bấm “Thêm vào nguyện vọng”. Danh sách sẽ hiện ở đây để em sắp xếp.">
            <NutGoiYDanhSach onMo={() => setMoGoiY(true)} />
            <Nut kieu="vien" bieuTuong={Plus} onClick={() => nav(DUONG_DAN.khamPha())}>Tự chọn trong Khám phá</Nut>
          </TrangThaiTrong>
        ) : (
          <>
            <TheTomTat tong={tong} kl={kl} dem={coCau.dem} onClick={() => nav(DUONG_DAN.nguyenVongAnToan())} />

            {tong === null && (
              <DongThongBao tone="cam" icon={GraduationCap} tieuDe="Chưa đủ điểm để xếp nhãn"
                moTa="Nhập điểm Toán, Vật lý, Tiếng Anh để biết mỗi nguyện vọng là Thử sức, Vừa sức, An toàn hay Dự phòng."
                hanhDong="Nhập điểm ngay" onClick={() => nav(s.diemThi.length ? DUONG_DAN.diemThiThu() : DUONG_DAN.batDau(2))} />
            )}

            {ds.length > SO_NV_GOI_Y && (
              <DongThongBao tone="xanh" icon={ListPlus} tieuDe={`Em đang có ${ds.length} nguyện vọng`}
                moTa={`Khoảng 5–${SO_NV_GOI_Y} nguyện vọng là dễ cân nhắc nhất.`} />
            )}

            <CanhBaoThuTuThe ds={canhBao} onDua={(c) => chuyen(c.sau.viTri, c.truoc.viTri)} />

            <TieuDeMuc phai={<span className="text-chu-phu font-semibold">{tong !== null ? `Cao nhất: ${dinhDang(tong, 1)}${tongTot.toHop ? ` (${tongTot.toHop})` : ""}` : `${ds.length} nguyện vọng`}</span>}>
              Thứ tự của em
            </TieuDeMuc>
            <p className="-mt-1 text-[13px] text-chu-phu flex items-center gap-1">
              <GripVertical size={15} className="shrink-0" />Kéo tay nắm hoặc bấm mũi tên để đổi.
            </p>

            <ol className={gop("space-y-3", keo && "select-none")} aria-label="Danh sách nguyện vọng theo thứ tự ưu tiên">
              {ds.map((d, i) => (
                <li key={d.id} ref={ganHang(i)} style={kieuHang(i)}>
                  <HangNguyenVong d={d} soHang={ds.length} chuaDuDiem={tong === null} dangKeo={keo?.tu === i}
                    tayNam={tayNam(i)} onLen={() => chuyen(i, i - 1)} onXuong={() => chuyen(i, i + 1)}
                    onMo={() => d.lc && nav(DUONG_DAN.chiTiet(d.id))} onSua={() => setDangSua(d.id)} onXoa={() => setDangXoa(d.id)} />
                </li>
              ))}
            </ol>

            <Nut bieuTuong={Plus} onClick={() => nav(DUONG_DAN.khamPha())}>Thêm nguyện vọng</Nut>
            <NutGoiYDanhSach kieu="vien" onMo={() => setMoGoiY(true)} />

            <TieuDeMuc>Nếu điểm thay đổi</TieuDeMuc>
            <div className="grid grid-cols-2 gap-2">
              <HangBam bieuTuong={TrendingUp} tone="tim" tieuDe="Thử tăng điểm" onClick={() => nav(DUONG_DAN.thuTinhHuong())} />
              <HangBam bieuTuong={ClipboardPen} tone="cam" tieuDe="Nhập thi thử" onClick={() => nav(DUONG_DAN.diemThiThu())} />
            </div>

            <GhiChuDuLieu />
          </>
        )}
      </NoiDung>

      {/* Sửa: đổi vị trí nhanh, xem chi tiết, xóa */}
      <HopTruot mo={!!dongSua} dong={() => setDangSua(null)} tieuDe={dongSua ? `Sửa NV${dongSua.viTri + 1}` : "Sửa nguyện vọng"}>
        {dongSua && (
          <div className="space-y-4">
            <TomTatTruong d={dongSua} />
            <div>
              <p className="text-[14px] font-bold text-muc mb-2">Chuyển tới vị trí</p>
              <div className="grid grid-cols-5 gap-2" role="group" aria-label="Chọn vị trí mới">
                {ds.map((_, j) => (
                  <button key={j} type="button" aria-pressed={j === dongSua.viTri} disabled={j === dongSua.viTri}
                    onClick={() => { chuyen(dongSua.viTri, j); setDangSua(null); }}
                    className={gop("min-h-12 rounded-xl border text-[14px] font-bold", j === dongSua.viTri ? "gd-xanh text-white border-transparent" : "bg-trang border-vien text-chu active:bg-xanh-nhat")}>
                    NV{j + 1}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Nut kieu="vien" bieuTuong={Eye} disabled={!dongSua.lc} onClick={() => nav(DUONG_DAN.chiTiet(dongSua.id))}>Xem chi tiết</Nut>
              <Nut kieu="nguyHiem" bieuTuong={Trash2} onClick={() => setDangXoa(dongSua.id)}>Xóa</Nut>
            </div>
          </div>
        )}
      </HopTruot>

      {/* Xác nhận xóa */}
      <HopTruot mo={!!dongXoa} dong={() => setDangXoa(null)} tieuDe="Xóa nguyện vọng này?">
        {dongXoa && (
          <div className="space-y-4">
            <TomTatTruong d={dongXoa} />
            <p className="text-[14px] text-chu">Các NV sau sẽ dồn lên. Hoàn tác được trong vài giây.</p>
            <div className="grid grid-cols-2 gap-2">
              <Nut kieu="vien" onClick={() => setDangXoa(null)}>Giữ lại</Nut>
              <Nut kieu="nguyHiem" bieuTuong={Trash2} onClick={() => xoa(dongXoa.id)}>Xóa</Nut>
            </div>
          </div>
        )}
      </HopTruot>

      <GoiYSheet mo={moGoiY} dong={() => setMoGoiY(false)} />
      <ThanhHoanTac tin={tin} an={an} />
    </>
  );
}

/** Thẻ đầu trang: "Cơ cấu danh sách của em" + cơ cấu mini + một câu kết luận. */
function TheTomTat({ tong, kl, dem, onClick }: { tong: number | null; kl: ReturnType<typeof ketLuan>; dem: ReturnType<typeof demNhan>; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="w-full text-left active:opacity-90">
      <NenHero tone={tong === null ? "xanh" : kl.tone} className="p-4">
        <span className="flex items-center gap-3">
          <BieuTuongTron icon={ShieldCheck} tone={tong === null ? "xanh" : kl.tone} kichThuoc={40} />
          <b className="flex-1 min-w-0 text-[16px] leading-snug text-muc">Cơ cấu danh sách của em</b>
          <ChevronRight size={20} className="text-chu-phu shrink-0" />
        </span>
        {tong === null ? (
          <span className="block mt-3 text-[14px] text-chu">Cần đủ điểm 3 môn của một tổ hợp để xếp nhãn.</span>
        ) : (
          <>
            <span className="block mt-3"><CoCauMini dem={dem} /></span>
            <span className="block mt-2.5 text-[14px] text-chu leading-snug">
              <b className="text-muc">{kl.tieuDe}.</b>{kl.nenLam && ` ${kl.nenLam}.`}
            </span>
          </>
        )}
      </NenHero>
    </button>
  );
}

function TomTatTruong({ d }: { d: DongNV }) {
  if (!d.lc) return <p className="text-[14px] text-chu-phu">Lựa chọn này không còn trong dữ liệu. Em có thể xóa khỏi danh sách.</p>;
  return (
    <div className="flex items-center gap-3 rounded-the bg-nen p-3">
      <HuyHieuTruong ten={d.lc.truong} tone={d.lc.tone} kichThuoc={40} />
      <span className="flex-1 min-w-0">
        <b className="block text-[15px] text-muc leading-snug">{d.lc.nganh}</b>
        <span className="block text-[13px] text-chu-phu truncate">{d.lc.tenTruong}</span>
      </span>
      {d.nhan && <NhanNguyenVongTag nhan={d.nhan} />}
    </div>
  );
}

const NUT_NHO = "size-12 grid place-items-center rounded-xl text-chu-phu active:bg-xanh-nhat disabled:opacity-35 disabled:pointer-events-none";

function HangNguyenVong({ d, soHang, chuaDuDiem, dangKeo, tayNam, onLen, onXuong, onMo, onSua, onXoa }: {
  d: DongNV; soHang: number; chuaDuDiem: boolean; dangKeo: boolean;
  tayNam: ReturnType<ReturnType<typeof useKeoTha>["tayNam"]>;
  onLen: () => void; onXuong: () => void; onMo: () => void; onSua: () => void; onXoa: () => void;
}) {
  const nv = `NV${d.viTri + 1}`;
  return (
    <div className={gop("flex rounded-the bg-trang border border-vien shadow-the overflow-hidden transition-shadow", dangKeo && "ring-2 ring-xanh shadow-nut scale-[1.02]")}>
      <button type="button" {...tayNam} aria-label={`Kéo để đổi thứ tự ${nv}`} aria-roledescription="tay nắm kéo thả"
        onKeyDown={(e) => { if (e.key === "ArrowUp") { e.preventDefault(); onLen(); } if (e.key === "ArrowDown") { e.preventDefault(); onXuong(); } }}
        className={gop("w-11 shrink-0 grid place-items-center bg-nen text-chu-phu touch-none", dangKeo ? "cursor-grabbing text-xanh" : "cursor-grab")}>
        <GripVertical size={18} />
      </button>

      <div className="flex-1 min-w-0">
        <button type="button" onClick={onMo} disabled={!d.lc} className="w-full text-left p-3 pb-2 block active:bg-xanh-nhat disabled:active:bg-transparent">
          <span className="flex items-start gap-3">
            <OSoThuTu viTri={d.viTri} nhan={d.nhan} />
            <span className="flex-1 min-w-0">
              {d.lc ? (
                <>
                  <span className="flex items-start justify-between gap-2">
                    <b className="text-[16px] text-muc leading-snug">{d.lc.nganh}</b>
                    {d.nhan ? <NhanNguyenVongTag nhan={d.nhan} /> : <Nhan tone="muc">{chuaDuDiem ? "Chưa đủ điểm" : "Chưa so được"}</Nhan>}
                  </span>
                  <span className="mt-1 flex items-center gap-1.5 min-w-0">
                    <HuyHieuTruong ten={d.lc.truong} tone={d.lc.tone} kichThuoc={22} />
                    <span className="text-[13px] text-chu-phu leading-snug truncate"><b className="text-chu">{d.lc.truong}</b> · {d.lc.tenTruong}</span>
                  </span>
                  {d.lyDoKhongNhan && <span className="mt-1 block text-[13px] text-chu-phu leading-snug">{d.lyDoKhongNhan}</span>}
                </>
              ) : (
                <>
                  <b className="block text-[15px] text-muc">Chưa có dữ liệu</b>
                  <span className="block text-[13px] text-chu-phu">Lựa chọn này không còn trong danh mục. Em có thể xóa đi.</span>
                </>
              )}
            </span>
          </span>
          {d.lc && (
            <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-chu-phu">
              <span className="inline-flex items-center gap-1"><GraduationCap size={14} />{d.lc.namDiem}: <b className="text-chu">{dinhDang(d.lc.diemMin, 1)}</b></span>
              {d.chenh !== null && (
                <b className={d.chenh < 0 ? "text-cam-chu" : "text-luc-chu"} title={`Điểm em so với điểm chuẩn ${d.lc.namDiem}`}>
                  em {d.chenh < 0 ? "−" : "+"}{dinhDang(Math.abs(d.chenh), 1)}
                </b>
              )}
              {d.toHop && <span className="inline-flex items-center rounded-full bg-nen px-2 py-0.5 text-[12px]">{d.toHop}{d.suyRa ? " · suy ra" : ""}</span>}
              {coHocPhi(d.lc) && <span className="inline-flex items-center gap-1"><Wallet size={14} /><b className="text-chu">{hocPhiChu(d.lc)}</b> tr/năm</span>}
            </span>
          )}
          {d.lc && (() => {
            const db = duBaoCua(d.lc);
            return db ? <span className="mt-1 block text-[12px] text-chu-phu" title="Khoảng điểm chuẩn dự kiến, đã kiểm định với các năm trước. Không phải xác suất đậu.">Dự kiến {db.namDuBao}: {dinhDang(db.thap, 1)}–{dinhDang(db.cao, 1)}</span> : null;
          })()}
        </button>

        <div className="flex items-center gap-1 border-t border-vien px-1.5 py-0.5">
          <button type="button" onClick={onLen} disabled={d.viTri === 0} aria-label={`Đưa ${tenNgan(d)} lên trên`} className={NUT_NHO}><ArrowUp size={20} /></button>
          <button type="button" onClick={onXuong} disabled={d.viTri === soHang - 1} aria-label={`Đưa ${tenNgan(d)} xuống dưới`} className={NUT_NHO}><ArrowDown size={20} /></button>
          <span className="flex-1" />
          <button type="button" onClick={onSua} aria-label={`Sửa ${nv}`} className={gop(NUT_NHO, "text-xanh")}><Pencil size={19} /></button>
          <button type="button" onClick={onXoa} aria-label={`Xóa ${nv}`} className={gop(NUT_NHO, "text-do-chu active:bg-do-nhat")}><Trash2 size={19} /></button>
        </div>
      </div>
    </div>
  );
}

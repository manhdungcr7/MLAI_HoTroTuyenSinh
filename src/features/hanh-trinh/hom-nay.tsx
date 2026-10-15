import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { CalendarClock, CalendarDays, Check, ChevronDown, ChevronRight, ChevronUp, Compass, Lightbulb, ListTodo, PartyPopper, Target, TrendingUp, Wallet } from "lucide-react";
import { DauTrangChinh, NoiDung } from "@/components/layout/khung";
import { BieuTuongTron, NenHero } from "@/components/ui/hinh-nen";
import { DongThongBao } from "@/components/ui/thong-bao";
import { HangBam, Nut, The, gop } from "@/components/ui/nut-the";
import { ThanhTienDo } from "@/components/ui/hien-thi";
import { DUONG_DAN } from "@/duong-dan";
import { useApp } from "@/state/store";
import { boCongDuLieu } from "@/components/layout/cong-du-lieu";
import { chonNguyenVongLamMucTieu, homNay, mucTieuDayDu, tenGoi, tienDoTuan, tuanHienTai, viecConLai, viecCuaTuan } from "@/state/chon";
import { TEN_MON_NGAN } from "@/state/types";
import { CauNoiDongLuc, TamTrangHomNay } from "@/features/tu-hoc/widgets";
import { goiYChoEm, lichSapToi, loiChaoTheoChang, monThieuDiem, ngayDayDu, nhanNgay, viecTrongNgay, type ViecTrongNgay } from "./tinh-toan";
import { changCuaEm, type Chang } from "@/state/chang";
import { dinhDang, dinhDangDiem } from "@/engine/dinh-dang";

const SO_DONG_GON = 3;

function HomNayDayDu() {
  const { s, datMucTieu } = useApp();
  const nav = useNavigate();
  const nv = chonNguyenVongLamMucTieu(s);
  // Chưa có hồ sơ (lần đầu mở ứng dụng): đưa tới màn Chào mừng.
  const daCoDuLieu = Boolean(s.hoSo.hoanTat || s.hoSo.hoTen.trim() || s.hoSo.khoi || s.hoSo.tinh || s.hoSo.nganhQuanTam.length || Object.values(s.hoSo.diem).some((d) => d !== null));
  if (!daCoDuLieu) return <Navigate to={DUONG_DAN.chao()} replace />;

  const m = mucTieuDayDu(s);
  const ten = s.hoSo.hoTen.trim() ? tenGoi(s.hoSo.hoTen) : "bạn";
  const chang = changCuaEm(s);
  const goiY = goiYChoEm(s, chang);
  const coKeHoach = viecCuaTuan(s.viec, tuanHienTai()).length > 0 || s.khoiHoc.length > 0;
  const thieuMon = m ? monThieuDiem(s, m.toHop).map((x) => TEN_MON_NGAN[x]) : [];

  return (
    <>
      <DauTrangChinh tieuDe={`Chào ${ten}!`} moTa={loiChaoTheoChang(s, chang)} />
      <NoiDung>
        {m ? (
          <>
            <TheMucTieu m={m} thieuMon={thieuMon} ngayThi={s.mucTieu?.ngayThi} onClick={() => nav(DUONG_DAN.mucTieu())} />
            {nv.ok && s.mucTieu && nv.lc.id !== s.mucTieu.luaChonId && (
              <DongThongBao tone="cam" icon={Target} tieuDe="Nguyện Vọng 1 đã khác mục tiêu" moTa={`Nguyện Vọng 1 hiện là ${nv.lc.nganh} (${nv.lc.truong}). Bấm để đặt làm mục tiêu và tính lại khoảng cách.`} onClick={() => datMucTieu(nv.mucTieu)} />
            )}
            {thieuMon.length > 0 && (
              <button type="button" onClick={() => nav(s.diemThi.length ? DUONG_DAN.diemThiThu() : DUONG_DAN.batDau(2))} className="w-full min-h-12 rounded-xl bg-cam-nhat px-3 text-left text-[13px] text-chu active:brightness-95">
                Thiếu điểm <b>{thieuMon.join(", ")}</b> · <b className="text-xanh">Nhập điểm</b>
              </button>
            )}
            {(chang !== "dinhHuong" || viecCuaTuan(s.viec, tuanHienTai()).length > 0) && <ViecHomNay />}
          </>
        ) : (
          <ChuaCoMucTieu
            chang={chang}
            onClick={() => nav(DUONG_DAN.khamPha())}
            soNguyenVong={s.nguyenVong.length}
            nganhNV={nv.ok ? nv.lc.nganh : undefined}
            lyDo={nv.ok ? undefined : nv.lyDo}
            onNguyenVong={() => (nv.ok ? datMucTieu(nv.mucTieu) : nav(DUONG_DAN.nguyenVong()))}
          />
        )}

        <TamTrangHomNay />

        {coKeHoach && <LichVaTienDo />}

        <CauNoiDongLuc />

        <DongThongBao tone="tim" icon={Lightbulb} tieuDe="Gợi ý cho bạn" moTa={goiY.moTa} onClick={() => nav(goiY.den)} />
        {goiY.nhacHocPhi && <DongThongBao tone="cam" icon={Wallet} tieuDe="Lọc theo học phí" moTa={goiY.nhacHocPhi} onClick={() => nav(DUONG_DAN.khamPha())} />}
      </NoiDung>
    </>
  );
}

type MucTieuDayDu = NonNullable<ReturnType<typeof mucTieuDayDu>>;

/** Một thẻ duy nhất cho mục tiêu: ngành – trường, ba con số (hiện tại → mục tiêu · thiếu) và số ngày còn lại. */
function TheMucTieu({ m, thieuMon, ngayThi, onClick }: { m: MucTieuDayDu; thieuMon: string[]; ngayThi?: string; onClick: () => void }) {
  const duDiem = thieuMon.length === 0;
  const dat = duDiem && m.conThieu <= 0;
  const dongDuoi = m.anDemNguoc
    ? "Điểm học bạ, chỉ để so tham khảo"
    : m.soNgayCon > 0 ? `Còn ${m.soNgayCon} ngày đến kỳ thi${ngayThi ? ` · ${ngayDayDu(ngayThi)}` : ""}` : "Đã tới ngày thi dự kiến · cập nhật ở Mục tiêu";
  return (
    <button type="button" onClick={onClick} className="block w-full text-left rounded-lon shadow-the active:opacity-90">
      <NenHero tone="xanh" className="p-4">
        <span className="flex items-center gap-3">
          <BieuTuongTron icon={Target} tone="xanh" kichThuoc={44} />
          <span className="flex-1 min-w-0">
            <span className="block text-[12px] font-semibold text-xanh">Mục tiêu</span>
            <b className="so-lon block text-[20px] leading-tight text-muc">{m.lc.nganh} <span className="whitespace-nowrap">– {m.lc.truong}</span></b>
          </span>
          <ChevronRight size={20} className="text-xanh shrink-0" />
        </span>
        <span className="mt-3 grid grid-cols-3 gap-1 rounded-[10px] bg-trang border border-vien py-2.5 text-center">
          <ODiem nhan="Hiện tại" gia={duDiem ? dinhDang(m.hienTai, 1) : "—"} />
          <ODiem nhan="Mục tiêu" gia={dinhDang(m.mucTieu, 1)} />
          {dat
            ? <ODiem nhan="Đã đạt" gia={<Check size={22} strokeWidth={3} className="inline text-luc-chu" />} />
            : <ODiem nhan="Còn thiếu" gia={duDiem ? dinhDang(m.conThieu, 1) : "—"} noiBat />}
        </span>
        <span className="mt-2 flex items-center gap-1.5 text-[12px] text-chu-phu">
          <CalendarDays size={14} className="shrink-0" />
          {dongDuoi}{m.uuTienCong > 0 && ` · gồm +${dinhDangDiem(m.uuTienCong)} ưu tiên`}
        </span>
      </NenHero>
    </button>
  );
}

function ODiem({ nhan, gia, noiBat }: { nhan: string; gia: React.ReactNode; noiBat?: boolean }) {
  return (
    <span className="min-w-0">
      <span className="block text-[11px] text-chu-phu">{nhan}</span>
      <b className={`so-lon block text-[26px] font-bold leading-tight ${noiBat ? "text-cam-chu" : "text-muc"}`}>{gia}</b>
    </span>
  );
}

function ChuaCoMucTieu({ chang, onClick, soNguyenVong, nganhNV, lyDo, onNguyenVong }: { chang: Chang; onClick: () => void; soNguyenVong?: number; nganhNV?: string; lyDo?: string; onNguyenVong?: () => void }) {
  return (
    <NenHero tone="cam" className="p-5">
      <span className="flex items-start gap-3">
        <BieuTuongTron icon={Compass} tone="cam" kichThuoc={48} />
        <span className="min-w-0">
          <b className="block text-[18px] leading-snug text-muc">{chang === "dinhHuong" ? "Bạn chưa cần chốt mục tiêu ngay" : "Bạn chưa chọn mục tiêu chính"}</b>
          <span className="block text-[14px] text-chu mt-1">
            {chang === "dinhHuong"
              ? "Khám phá và lưu vài ngành thấy hợp trước đã."
              : "Chọn một ngành để nhận việc cần làm mỗi ngày."}
          </span>
        </span>
      </span>
      <div className="mt-4 space-y-2">
        <Nut muiTen onClick={onClick}>Khám phá ngành học</Nut>
        {Boolean(soNguyenVong && soNguyenVong > 0 && onNguyenVong) && (
          <Nut kieu="vien" onClick={onNguyenVong}>{nganhNV ? (nganhNV.length > 25 ? "Đặt Nguyện Vọng 1 làm mục tiêu chính" : `Chọn ${nganhNV} làm mục tiêu`) : `Xem ${soNguyenVong} nguyện vọng đã lưu`}</Nut>
        )}
        {lyDo && <span className="block text-[13px] text-chu-phu">Chưa đặt được từ nguyện vọng: {lyDo}</span>}
      </div>
    </NenHero>
  );
}

/** "Hôm nay cần làm gì?": việc đã xếp cho hôm nay, tick để đánh dấu xong, bấm dòng để xem chi tiết. */
function ViecHomNay() {
  const { s, datTrangThaiViec } = useApp();
  const nav = useNavigate();
  const [moRong, setMoRong] = useState(false);
  const ngay = homNay();
  const ds = viecTrongNgay(s, ngay);
  const xong = ds.filter((v) => v.xong).length;
  const hien = moRong ? ds : ds.slice(0, SO_DONG_GON);
  const conAn = ds.length - SO_DONG_GON;

  const dauMuc = (
    <div className="flex items-baseline justify-between gap-2">
      <h2 className="text-[17px] font-extrabold text-muc">Hôm nay cần làm gì?</h2>
      <span className="text-[12px] text-chu-phu whitespace-nowrap">{nhanNgay(ngay)}</span>
    </div>
  );

  if (viecCuaTuan(s.viec, tuanHienTai()).length === 0) {
    return (
      <The className="space-y-3">
        {dauMuc}
        <div className="flex items-start gap-3 rounded-xl bg-nen p-3">
          <ListTodo size={22} className="text-xanh shrink-0 mt-0.5" />
          <p className="text-[14px] text-chu">Chưa có việc học. Lập kế hoạch tuần để việc hiện ở đây.</p>
        </div>
        <Nut kieu="nhe" muiTen onClick={() => nav(DUONG_DAN.tuan())}>Lập kế hoạch tuần</Nut>
      </The>
    );
  }

  if (ds.length === 0) {
    const tiep = viecConLai(s)[0];
    return (
      <The className="space-y-3">
        {dauMuc}
        <p className="text-[14px] text-chu">{tiep ? "Hôm nay trống lịch. Rảnh thì làm trước:" : "Bạn đã xong hết việc tuần này!"}</p>
        {tiep ? (
          <HangBam bieuTuong={ListTodo} tone="cam" tieuDe={tiep.tieuDe} phu={`${tiep.phut} phút · nên làm trước`} onClick={() => nav(DUONG_DAN.viec(tiep.id))} />
        ) : (
          <Nut kieu="nhe" muiTen onClick={() => nav(DUONG_DAN.tuan("lich"))}>Xem lịch tuần</Nut>
        )}
      </The>
    );
  }

  return (
    <The className="!px-3 !pb-3">
      <div className="px-1">{dauMuc}</div>
      <ul className="mt-1 divide-y divide-vien">
        {hien.map((v) => <DongViec key={v.viec.id} v={v} onTick={() => datTrangThaiViec(v.viec, "xong")} onMo={() => nav(DUONG_DAN.viec(v.viec.id))} />)}
      </ul>
      {conAn > 0 && (
        <button type="button" onClick={() => setMoRong((x) => !x)} aria-expanded={moRong}
          className="w-full min-h-12 flex items-center justify-center gap-1 text-[13px] font-bold text-xanh">
          {moRong ? <>Thu gọn<ChevronUp size={16} /></> : <>Xem thêm {conAn} việc khác<ChevronDown size={16} /></>}
        </button>
      )}
      <div className={gop("mt-2 flex items-center gap-3 rounded-xl px-3 py-2.5", xong === ds.length ? "bg-luc-nhat" : "bg-nen")}>
        {xong === ds.length && <PartyPopper size={20} className="text-luc-chu shrink-0" />}
        <div className="flex-1 min-w-0" aria-live="polite">
          <p className="text-[13px] text-chu mb-1.5">
            {xong === ds.length ? <b className="text-luc-chu">Xong hết việc hôm nay, giỏi lắm!</b> : <><b className="text-[15px] text-muc">{xong}/{ds.length}</b> việc xong</>}
          </p>
          <ThanhTienDo phanTram={(xong / ds.length) * 100} tone="luc" />
        </div>
      </div>
    </The>
  );
}

function DongViec({ v, onTick, onMo }: { v: ViecTrongNgay; onTick: () => void; onMo: () => void }) {
  return (
    <li className="flex items-center">
      <button type="button" role="checkbox" aria-checked={v.xong} aria-disabled={v.xong} aria-label={v.xong ? `${v.viec.tieuDe}: đã xong` : `Đánh dấu xong: ${v.viec.tieuDe}`}
        onClick={() => !v.xong && onTick()} className="size-12 -ml-1 grid place-items-center shrink-0">
        <span className={gop("size-6 rounded-full grid place-items-center border-2 transition-colors", v.xong ? "bg-luc border-luc text-white" : "border-chu-phu/50 bg-trang")}>
          {v.xong && <Check size={15} strokeWidth={3.5} />}
        </span>
      </button>
      <button type="button" onClick={onMo} className="flex-1 min-w-0 min-h-14 py-2 flex items-center gap-2 text-left active:bg-xanh-nhat rounded-lg">
        <span className="flex-1 min-w-0">
          <span className={gop("block text-[15px] font-semibold leading-snug", v.xong ? "text-chu-phu" : "text-chu")}>{v.viec.tieuDe}</span>
          <span className="block text-[13px] text-chu-phu">{v.phut} phút · {v.batDau}–{v.ketThuc}</span>
        </span>
        <ChevronRight size={18} className="text-chu-phu shrink-0" />
      </button>
    </li>
  );
}

/** Hai thẻ cạnh nhau: lịch sắp tới và tiến độ tuần này. */
function LichVaTienDo() {
  const { s } = useApp();
  const nav = useNavigate();
  const lich = lichSapToi(s, new Date());
  const td = tienDoTuan(s);
  const CHAM = { xanh: "bg-xanh", cam: "bg-cam", tim: "bg-tim" } as const;
  return (
    <div className="grid grid-cols-2 gap-3">
      <button type="button" onClick={() => nav(DUONG_DAN.tuan("lich"))} className="text-left rounded-the bg-trang border border-vien shadow-the p-3 active:bg-xanh-nhat flex flex-col">
        <span className="flex items-center justify-between">
          <span className="size-9 rounded-xl bg-xanh-nhat text-xanh grid place-items-center"><CalendarClock size={19} /></span>
          <ChevronRight size={18} className="text-chu-phu" />
        </span>
        <b className="mt-2 text-[14px] text-muc">Lịch sắp tới</b>
        {lich.length ? (
          <span className="mt-1.5 space-y-2">
            {lich.map((l) => (
              <span key={l.id} className="flex gap-1.5">
                <span className={gop("mt-1.5 size-2 rounded-full shrink-0", CHAM[l.tone])} />
                <span className="min-w-0">
                  <span className="block text-[13px] font-semibold text-chu leading-snug line-clamp-2">{l.ten}</span>
                  <span className="block text-[12px] text-chu-phu">{l.khi}</span>
                </span>
              </span>
            ))}
          </span>
        ) : (
          <span className="mt-1 text-[13px] text-chu-phu">Tuần này hết buổi.</span>
        )}
      </button>
      <button type="button" onClick={() => nav(DUONG_DAN.tienDo())} className="text-left rounded-the bg-trang border border-vien shadow-the p-3 active:bg-xanh-nhat flex flex-col">
        <span className="flex items-center justify-between">
          <span className="size-9 rounded-xl bg-luc-nhat text-luc-chu grid place-items-center"><TrendingUp size={19} /></span>
          <ChevronRight size={18} className="text-chu-phu" />
        </span>
        <b className="mt-2 text-[14px] text-muc">Tiến độ tuần này</b>
        {td.tong ? (
          <>
            <span className="mt-1.5 text-[13px] text-chu-phu"><b className="text-[22px] font-extrabold text-muc">{td.xong}</b> / {td.tong} việc xong</span>
            <span className="mt-auto pt-2 flex items-center gap-2">
              <span className="flex-1"><ThanhTienDo phanTram={td.phanTram} tone="luc" /></span>
              <b className="text-[12px] text-luc-chu">{td.phanTram}%</b>
            </span>
          </>
        ) : (
          <span className="mt-1 text-[13px] text-chu-phu">Chưa có việc nào trong tuần.</span>
        )}
      </button>
    </div>
  );
}

const HomNayCoDanhMuc = boCongDuLieu(HomNayDayDu);

/** Lần đầu mở app (chưa có hồ sơ): chuyển sang Chào mừng ngay, không chờ danh mục. Có hồ sơ thì chờ danh mục rồi mới dựng. */
export default function HomNay() {
  const { s } = useApp();
  const daCoDuLieu = Boolean(s.hoSo.hoanTat || s.hoSo.hoTen.trim() || s.hoSo.khoi || s.hoSo.tinh || s.hoSo.nganhQuanTam.length || Object.values(s.hoSo.diem).some((d) => d !== null));
  if (!daCoDuLieu) return <Navigate to={DUONG_DAN.chao()} replace />;
  return <HomNayCoDanhMuc />;
}

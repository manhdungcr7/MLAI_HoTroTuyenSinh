import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Check, ExternalLink, Inbox, Sparkles, X } from "lucide-react";
import { DUONG_DAN } from "@cms/duong-dan";
import { thongBaoLoi } from "@cms/may-chu/api";
import { doiTrangThai, layHetBanGhi, xinGoiYDuyet, type BanGhiCms, type GoiYDuyet, type TrangThaiCms } from "@cms/may-chu/ban-ghi-api";
import { usePhien } from "@cms/trang-thai/phien";
import { useTai } from "@cms/trang-thai/dung-tai";
import { layDanhSachTenTruong } from "@cms/trang-thai/ten-truong";
import { DauTrangChinh, NoiDung } from "@cms/thanh-phan/khung/khung-goc";
import { HopTruot, KhungDangTai, KhungLoi, TrangThaiTrong } from "@cms/thanh-phan/ui/hien-thi";
import { OTextArea, Truong } from "@cms/thanh-phan/ui/nhap-lieu";
import { Nhan, Nut, The, gop } from "@cms/thanh-phan/ui/nut-the";
import { DongThongBao } from "@cms/thanh-phan/ui/thong-bao";
import { dinhDangLuc, soViet } from "@cms/du-lieu-truong/dinh-dang";
import { maTruongCua, NHAN_TT, TONE_TT } from "@cms/du-lieu-truong/mo-hinh";
import { nhanBan, tomTatBan } from "@cms/du-lieu-truong/tom-tat-ban";
import { SoSanhBan } from "./so-sanh-ban";
import HopThu from "../he-thong/hop-thu";

type Tab = "cho" | "duyet" | "nhap" | "hop-thu";
const TAB: { id: Tab; nhan: string; gom: readonly TrangThaiCms[] }[] = [
  { id: "cho", nhan: "Chờ duyệt", gom: ["SUBMITTED", "IN_REVIEW"] },
  { id: "duyet", nhan: "Đã duyệt", gom: ["APPROVED"] },
  { id: "nhap", nhan: "Cần sửa", gom: ["REJECTED", "DRAFT"] },
  { id: "hop-thu", nhan: "Hộp thư", gom: [] }, // báo sai từ học sinh, đăng ký tình nguyện viên
];

const NHAN_LOAI_AI: Record<string, string> = { official_info: "Thông tin chính thức", personal_opinion: "Ý kiến cá nhân", advertisement: "Quảng cáo", spam: "Rác", other: "Khác" };
const NHAN_TIN_CAY = { cao: "Cao", vua: "Vừa", thap: "Thấp" } as const;
const TONE_TIN_CAY = { cao: "luc", vua: "cam", thap: "do" } as const;

/** Gợi ý của AI cho người duyệt. Chỉ gọi khi bấm nút; không đổi bản ghi. */
function KhoiGoiY({ id }: { id: string }) {
  const [tt, setTt] = useState<"chua" | "tai" | "xong" | "loi">("chua");
  const [kq, setKq] = useState<GoiYDuyet | null>(null);
  const [loi, setLoi] = useState("");
  const xin = async () => {
    setTt("tai");
    try { setKq(await xinGoiYDuyet(id)); setTt("xong"); } catch (e) { setLoi(thongBaoLoi(e)); setTt("loi"); }
  };
  const ai = kq?.ai;
  return (
    <div className="rounded-xl border border-vien p-2.5 space-y-2">
      {tt === "chua" && <Nut kieu="vien" bieuTuong={Sparkles} onClick={() => void xin()}>Xin gợi ý AI</Nut>}
      {tt === "tai" && <p className="text-[13px] text-chu-phu" role="status">Đang xem xét mục này</p>}
      {tt === "loi" && (
        <div className="space-y-2">
          <p className="text-[13px] text-do-chu">{loi}</p>
          <Nut kieu="vien" onClick={() => void xin()}>Thử lại</Nut>
        </div>
      )}
      {tt === "xong" && kq && (
        <div className="space-y-2 text-[13px] text-chu">
          {kq.quyTac.length === 0 ? <p className="text-chu-phu">Không thấy lỗi theo quy tắc kiểm tra.</p> : kq.quyTac.map((c) => (
            <p key={c.ma} className={c.muc === "loi" ? "rounded-lg bg-do-nhat p-2 text-do-chu" : "rounded-lg bg-cam-nhat p-2 text-cam-chu"}>{c.thongBao}</p>
          ))}
          {kq.trung && <p className="rounded-lg bg-cam-nhat p-2 text-cam-chu break-words">Có thể trùng với bản đã xuất bản <b>{kq.trung.id}</b>: {kq.trung.noiDung}</p>}
          {ai ? (
            <div className="flex flex-wrap gap-1.5">
              <Nhan tone={TONE_TIN_CAY[ai.doTinCay.muc]}>Độ tin cậy: {NHAN_TIN_CAY[ai.doTinCay.muc]}</Nhan>
              {ai.loai && <Nhan tone="tim">{NHAN_LOAI_AI[ai.loai.chon] ?? ai.loai.chon}</Nhan>}
              {ai.khanCap && ai.khanCap.muc !== "thap" && <Nhan tone="cam">Cần xem sớm</Nhan>}
              {ai.nhayCam?.co && <Nhan tone="do">Có thể chứa thông tin cá nhân</Nhan>}
            </div>
          ) : <p className="text-chu-phu">AI chưa dùng được lúc này, chỉ có kết quả kiểm tra quy tắc.</p>}
          {!kq.daKiemTrung && <p className="text-chu-phu">Chưa kiểm được trùng lặp.</p>}
        </div>
      )}
      <p className="text-[12px] text-chu-phu">Gợi ý chỉ để tham khảo, người duyệt quyết định.</p>
    </div>
  );
}

/** Dấu "nhập qua AI": chênh so với số đang có, trích dẫn nguyên văn và nút mở nguồn. Người duyệt đối chiếu với tài liệu rồi mới duyệt. */
function KhoiNhapQuaAI({ ban }: { ban: BanGhiCms }) {
  const na = ban.nhapQuaAI;
  if (!na) return null;
  const diemMoi = (ban.data as { diemChuan?: unknown }).diemChuan;
  const moi = typeof diemMoi === "number" ? diemMoi : null;
  const cu = na.diemCu;
  return (
    <div className="rounded-xl border border-vien p-2.5 space-y-2 text-[13px] text-chu">
      <p className={gop("break-words", na.chenhLon && "rounded-lg bg-do-nhat p-2 text-do-chu")}>
        <b>Chênh so với đang có:</b>{" "}
        {cu === undefined || moi === null
          ? "Chưa có điểm chuẩn nào đang công bố cho mục này."
          : `${soViet(cu)} → ${soViet(moi)}, chênh ${soViet(Math.abs(moi - cu))} điểm.`}
        {na.chenhLon && " Chênh lớn: đối chiếu kỹ với trích dẫn trước khi duyệt."}
      </p>
      <div>
        <p className="text-[12px] text-chu-phu mb-1">Trích dẫn từ nguồn (trang {na.nguon.trang}, {na.nguon.loai}):</p>
        <blockquote className="break-words rounded-lg bg-nen p-2.5 border-l-2 border-xanh italic">{na.nguon.trichDan}</blockquote>
      </div>
      <a href={na.nguon.url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-1 font-bold text-xanh">
        Mở nguồn <ExternalLink size={12} className="shrink-0" />
      </a>
    </div>
  );
}

export default function DanhSachDuyet() {
  const { laQtv, toi } = usePhien();
  const [tham, setTham] = useSearchParams();
  const tab: Tab = (["cho", "duyet", "nhap", "hop-thu"] as const).find((t) => t === tham.get("trang-thai")) ?? (laQtv ? "cho" : "nhap");
  const chiAi = tham.get("nguon") === "ai";
  const bg = useTai(() => layHetBanGhi());
  const tenDs = useTai(() => layDanhSachTenTruong());

  const [banTin, setBanTin] = useState<{ tone: "luc" | "do"; noiDung: string } | null>(null);
  const [dangXuLy, setDangXuLy] = useState<string | null>(null);
  const [tuChoi, setTuChoi] = useState<BanGhiCms | null>(null);
  const [lyDo, setLyDo] = useState("");
  const [loiLyDo, setLoiLyDo] = useState<string | null>(null);

  const tenTheoMa = useMemo(() => new Map((tenDs.du ?? []).map((t) => [t.maTruong, t.ten ?? t.maTruong])), [tenDs.du]);
  /** Cộng tác viên chỉ thấy bản do mình tạo trong các tab này. */
  const cuaToi = (b: BanGhiCms) => laQtv || b.createdBy === toi.email;
  const theoTab = useMemo(() => {
    const ds = (bg.du?.ds ?? []).filter(cuaToi);
    return Object.fromEntries(TAB.map((t) => [t.id, ds.filter((b) => t.gom.includes(b.status))])) as Record<Tab, BanGhiCms[]>;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bg.du, laQtv, toi.email]);
  const dsTheoTab = theoTab[tab] ?? [];
  const dsHienTai = chiAi ? dsTheoTab.filter((b) => b.nhapQuaAI) : dsTheoTab;

  const chay = async (b: BanGhiCms, dich: "APPROVED" | "REJECTED", thongBao: string, ly?: string) => {
    setDangXuLy(b.id);
    try {
      await doiTrangThai(b.id, dich, ly);
      setBanTin({ tone: "luc", noiDung: thongBao });
      bg.taiLai();
      return true;
    } catch (e) {
      setBanTin({ tone: "do", noiDung: thongBaoLoi(e) });
      return false;
    } finally {
      setDangXuLy(null);
    }
  };

  const xacNhanTuChoi = async () => {
    if (!tuChoi) return;
    if (lyDo.trim().length < 3) { setLoiLyDo("Bạn cần ghi lý do, ít nhất 3 chữ, để người gửi biết sửa gì."); return; }
    if (await chay(tuChoi, "REJECTED", "Đã trả lại kèm lý do. Người gửi sẽ thấy lý do ở mục Cần sửa.", lyDo.trim())) { setTuChoi(null); setLyDo(""); setLoiLyDo(null); }
  };

  return (
    <div className="space-y-3">
      <DauTrangChinh
        tieuDe="Phê duyệt"
        moTa={laQtv ? "Xem các mục cộng tác viên gửi lên. Duyệt, hoặc trả lại kèm lý do." : "Theo dõi các mục bạn đã gửi. Mục bị trả lại nằm ở Cần sửa."}
      />
      <NoiDung>
        <div role="tablist" className="flex bg-trang border border-vien rounded-xl p-1 gap-1">
          {TAB.map((t) => (
            <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTham({ "trang-thai": t.id })}
              className={gop("flex-1 min-h-12 rounded-lg text-[13px] font-bold px-1 flex flex-col items-center justify-center leading-tight whitespace-nowrap", tab === t.id ? "bg-xanh text-white" : "text-chu-phu")}>
              <span>{t.nhan}</span>
              {bg.du && t.id !== "hop-thu" && <span className="text-[12px] font-semibold">{theoTab[t.id].length}</span>}
            </button>
          ))}
        </div>

        {banTin && <DongThongBao tone={banTin.tone} tieuDe={banTin.noiDung} onClick={() => setBanTin(null)} />}

        {tab !== "hop-thu" && (
          <div role="group" aria-label="Lọc theo nguồn nhập" className="flex gap-1.5">
            {[{ ai: false, nhan: "Tất cả" }, { ai: true, nhan: "Nhập qua AI" }].map((o) => (
              <button
                key={o.nhan}
                type="button"
                aria-pressed={chiAi === o.ai}
                onClick={() => setTham(o.ai ? { "trang-thai": tab, nguon: "ai" } : { "trang-thai": tab })}
                className={gop("min-h-11 rounded-xl px-3 text-[13px] font-bold border", chiAi === o.ai ? "bg-xanh text-white border-xanh" : "border-vien text-chu-phu bg-trang")}
              >
                {o.nhan}
              </button>
            ))}
          </div>
        )}

        {tab === "hop-thu" ? <HopThu /> : bg.dangTai && !bg.du ? <KhungDangTai soKhung={3} cao="h-36" /> : bg.loi ? (
          <KhungLoi moTa={bg.loi} thuLai={bg.taiLai} />
        ) : dsHienTai.length === 0 && chiAi && dsTheoTab.length > 0 ? (
          <TrangThaiTrong bieuTuong={<Inbox size={26} />} tieuDe="Không có mục nào nhập qua AI" moTa="Bỏ bộ lọc Nhập qua AI để xem mọi mục trong mục này." />
        ) : dsHienTai.length === 0 ? (
          <TrangThaiTrong bieuTuong={<Inbox size={26} />}
            tieuDe={tab === "cho" ? "Không có mục nào chờ duyệt" : tab === "duyet" ? "Chưa có mục nào đã duyệt chờ xuất bản" : "Không có mục nào cần sửa"}
            moTa={tab === "cho" ? "Khi cộng tác viên gửi duyệt, mục sẽ hiện ở đây." : tab === "duyet" ? "Mục bạn duyệt sẽ nằm ở đây cho tới khi xuất bản." : "Mục nháp hoặc bị trả lại sẽ hiện ở đây."}>
            <Link to={DUONG_DAN.truong()} className="inline-flex min-h-12 items-center rounded-xl border border-xanh/40 px-4 text-xanh font-bold">Xem dữ liệu trường</Link>
          </TrangThaiTrong>
        ) : (
          <div className="space-y-3">
            {tab === "duyet" && laQtv && (
              <DongThongBao tone="xanh" tieuDe="Các mục này đã duyệt nhưng chưa lên web" moTa="Vào mục Xuất bản để học sinh thấy." onClick={undefined}>
                <Link to={DUONG_DAN.xuatBan()} className="inline-block mt-1.5 text-[13px] font-bold text-xanh">Đi tới Xuất bản</Link>
              </DongThongBao>
            )}
            {dsHienTai.map((b) => {
              const ma = maTruongCua(b.entityId);
              const tt = tomTatBan(b);
              const cho = b.status === "SUBMITTED" || b.status === "IN_REVIEW";
              return (
                <The key={b.id} className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[12px] text-chu-phu"><b className="text-muc">{ma}</b> · {tenTheoMa.get(ma) ?? "Chưa rõ tên trường"}</p>
                      <p className="font-bold text-[15px] text-muc leading-snug mt-0.5">{tt.tieuDe}</p>
                    </div>
                    <div className="flex flex-wrap justify-end gap-1.5">
                      {b.nhapQuaAI && <Nhan tone="tim">Nhập qua AI</Nhan>}
                      <Nhan tone={TONE_TT[b.status]}>{NHAN_TT[b.status]}</Nhan>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5"><Nhan tone="tim">{nhanBan(b)}</Nhan><Nhan tone="xanh">Bản {b.version}</Nhan></div>
                  <div className="rounded-xl bg-nen p-2.5 text-[13.5px] text-chu space-y-0.5">
                    {tt.dong.map((d, i) => <p key={i} className="break-words">{d}</p>)}
                  </div>
                  <KhoiNhapQuaAI ban={b} />
                  {b.status === "REJECTED" && b.rejectionReason && (
                    <p className="rounded-xl bg-do-nhat p-2.5 text-[13px] text-do-chu"><b>Lý do trả lại:</b> {b.rejectionReason}</p>
                  )}
                  <a href={b.source.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 min-h-11 text-[13px] text-xanh font-semibold min-w-0">
                    <span className="shrink-0">Nguồn:</span><span className="truncate">{b.source.tieuDe}</span><ExternalLink size={12} className="shrink-0" />
                  </a>
                  <p className="text-[12px] text-chu-phu">{b.source.donViCongBo} · gửi bởi {b.createdBy} · {dinhDangLuc(b.updatedAt)}</p>
                  {b.changeNote && <p className="text-[13px] text-chu"><b>Ghi chú:</b> {b.changeNote}</p>}
                  {laQtv && <SoSanhBan ban={b} />}
                  {laQtv && cho && <KhoiGoiY id={b.id} />}

                  {laQtv && cho && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <Nut kieu="nguyHiem" bieuTuong={X} onClick={() => { setTuChoi(b); setLyDo(""); setLoiLyDo(null); }} disabled={dangXuLy !== null}>Trả lại</Nut>
                      <Nut bieuTuong={Check} onClick={() => void chay(b, "APPROVED", "Đã duyệt. Mục này chờ bạn bấm Xuất bản.")} disabled={dangXuLy !== null}>{dangXuLy === b.id ? "Đang duyệt" : "Duyệt"}</Nut>
                    </div>
                  )}
                  {tab === "nhap" && (
                    <Link to={DUONG_DAN.chiTietTruong(ma)} className="flex min-h-12 items-center justify-center rounded-xl border border-xanh/40 text-xanh font-bold">Mở trường để sửa</Link>
                  )}
                  {!laQtv && cho && <p className="text-[12px] text-chu-phu">Đang chờ quản trị viên xem.</p>}
                </The>
              );
            })}
          </div>
        )}
      </NoiDung>

      <HopTruot mo={Boolean(tuChoi)} dong={() => setTuChoi(null)} tieuDe="Trả lại kèm lý do">
        <div className="space-y-3">
          <Truong nhan="Lý do trả lại" batBuoc htmlFor="ly-do" loi={loiLyDo ?? undefined} goiY="Người gửi sẽ đọc dòng này, nên ghi rõ cần sửa gì hoặc thiếu nguồn nào.">
            <OTextArea id="ly-do" value={lyDo} onChange={(e) => setLyDo(e.target.value)} hang={4} placeholder="Ví dụ: Link nguồn không mở được, cần dán lại link đề án." />
          </Truong>
          <div className="grid grid-cols-2 gap-2">
            <Nut kieu="vien" onClick={() => setTuChoi(null)}>Hủy</Nut>
            <Nut kieu="nguyHiem" onClick={() => void xacNhanTuChoi()} disabled={dangXuLy !== null}>{dangXuLy ? "Đang gửi" : "Trả lại"}</Nut>
          </div>
        </div>
      </HopTruot>
    </div>
  );
}

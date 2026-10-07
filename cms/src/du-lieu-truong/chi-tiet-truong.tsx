import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle2, Circle, ExternalLink, Plus, SearchX } from "lucide-react";
import { DUONG_DAN } from "@cms/duong-dan";
import { thongBaoLoi } from "@cms/may-chu/api";
import { doiTrangThai, layHetBanGhi, type BanGhiCms } from "@cms/may-chu/ban-ghi-api";
import { usePhien } from "@cms/trang-thai/phien";
import { useTai } from "@cms/trang-thai/dung-tai";
import { layDanhSachTenTruong } from "@cms/trang-thai/ten-truong";
import { DauTrangCoQuayLai, NoiDung } from "@cms/thanh-phan/khung/khung-goc";
import { KhungDangTai, KhungLoi, TrangThaiTrong } from "@cms/thanh-phan/ui/hien-thi";
import { Nhan, The } from "@cms/thanh-phan/ui/nut-the";
import { DongThongBao } from "@cms/thanh-phan/ui/thong-bao";
import { MUC_CAN_DU, type MucTienDo } from "@/data/dong-gop-kiem-tra";
import { HopFormThongTin } from "./form-thong-tin";
import { KhoiKenh } from "./khoi-kenh";
import { HopFormDiemChuan } from "./form-diem-chuan";
import { tomTatBan } from "./tom-tat-ban";
import { LOAI_THEM_TAY, type LoaiThemTay } from "./bieu-mau";
import { dinhDangLuc, dongNoiDung, nhanLoai, nhanMuc, tieuDeBanGhi } from "./dinh-dang";
import { banDaiDien, laKenh, loaiTuBanGhi, NHAN_TT, TONE_TT, thongTinTuBanGhi, tienDoTuBanGhi } from "./mo-hinh";

type DangMo = { loai: LoaiThemTay; ban?: BanGhiCms } | null;

const MOTA_MUC: Record<MucTienDo, string> = {
  kenh: "Website, fanpage, nhóm chính thức của trường",
  hoc_phi: "Học phí theo năm học, kèm link nguồn",
  hoc_bong: "Các suất học bổng và điều kiện",
  noi_luu_tru: "Ký túc xá, giá trọ quanh trường",
  review: "Đánh giá của sinh viên về trường",
  luu_y: "Điều cần lưu ý khi nộp hồ sơ",
  khac: "Thông tin khác",
};

export default function ChiTietTruong() {
  const { ma: maRaw = "" } = useParams<{ ma: string }>();
  const ma = maRaw.toUpperCase();
  const { laQtv, toi, duocSua: duocSuaTheoPhien } = usePhien();
  const tenDs = useTai(() => layDanhSachTenTruong());
  const bg = useTai(() => layHetBanGhi({ truong: ma }), ma);

  const [dangMo, setDangMo] = useState<DangMo>(null);
  const [diemMo, setDiemMo] = useState<{ ban?: BanGhiCms } | null>(null);
  const [kenhMoSan, setKenhMoSan] = useState(false);
  const [banTin, setBanTin] = useState<{ tone: "luc" | "do"; noiDung: string } | null>(null);
  const [dangDoi, setDangDoi] = useState<string | null>(null);

  const truong = tenDs.du?.find((t) => t.maTruong === ma);
  const ten = truong?.ten ?? ma;
  const khongCoTruong = Boolean(tenDs.du) && !truong;
  const duocSua = duocSuaTheoPhien(ma);

  // Máy chủ đã lọc theo trường (?truong=), mỗi mục lấy một bản đại diện.
  const cua = useMemo(() => bg.du?.ds ?? [], [bg.du]);
  const muc = useMemo(() => banDaiDien(cua), [cua]);
  const kenh = muc.find(laKenh);
  const diemChuan = muc.filter((b) => b.entityType === "cutoff_score");
  const tienDo = useMemo(() => tienDoTuBanGhi(ma, cua), [cua, ma]);
  const daCo = new Set<MucTienDo>(tienDo.co);
  const soDu = MUC_CAN_DU.filter((m) => daCo.has(m)).length;
  /** Cộng tác viên chỉ thao tác trên bản do mình tạo hoặc bản đang chạy; quản trị viên thao tác mọi bản. */
  const duocDung = (b: BanGhiCms) => laQtv || b.createdBy === toi.email || b.status === "PUBLISHED";

  const xong = (noiDung: string) => { setDangMo(null); setDiemMo(null); setKenhMoSan(false); setBanTin({ tone: "luc", noiDung }); bg.taiLai(); };

  const chuyen = async (b: BanGhiCms, dich: "SUBMITTED" | "ARCHIVED", thongBao: string) => {
    setDangDoi(b.id);
    try {
      await doiTrangThai(b.id, dich);
      setBanTin({ tone: "luc", noiDung: thongBao });
      bg.taiLai();
    } catch (e) {
      setBanTin({ tone: "do", noiDung: thongBaoLoi(e) });
    } finally {
      setDangDoi(null);
    }
  };

  const dienMuc = (m: MucTienDo) => {
    if (m === "kenh") { setKenhMoSan(true); document.getElementById("khoi-kenh")?.scrollIntoView({ behavior: "smooth" }); return; }
    if ((LOAI_THEM_TAY as readonly string[]).includes(m)) setDangMo({ loai: m as LoaiThemTay });
  };

  return (
    <div className="space-y-3">
      <DauTrangCoQuayLai tieuDe={`${ma} · ${ten}`} quayLai={DUONG_DAN.truong()} />
      <NoiDung>
        {banTin && <DongThongBao tone={banTin.tone} tieuDe={banTin.noiDung} onClick={() => setBanTin(null)} />}

        {khongCoTruong ? (
          <TrangThaiTrong bieuTuong={<SearchX size={26} />} tieuDe="Không có trường này" moTa={`Mã ${ma} không có trong danh sách trường.`} />
        ) : (bg.dangTai && !bg.du) || (tenDs.dangTai && !tenDs.du) ? (
          <KhungDangTai soKhung={3} cao="h-28" />
        ) : bg.loi || tenDs.loi ? (
          <KhungLoi moTa={(bg.loi ?? tenDs.loi)!} thuLai={() => { bg.taiLai(); tenDs.taiLai(); }} />
        ) : (
          <>
            <The className="space-y-2">
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="font-extrabold text-[16px] text-muc">Đã có {soDu}/{MUC_CAN_DU.length} mục</h2>
                {tienDo.du && <Nhan tone="luc">Đủ rồi</Nhan>}
              </div>
              <p className="text-[13px] text-chu-phu">
                {tienDo.du ? "Trường này đã đủ các mục cần có. Bạn vẫn có thể thêm hoặc cập nhật." : "Điền các mục còn thiếu để trường này đủ dữ liệu. Mục đã gửi duyệt cũng được tính là có."}
              </p>
              <ul className="divide-y divide-vien">
                {MUC_CAN_DU.map((m) => {
                  const co = daCo.has(m);
                  return (
                    <li key={m} className="flex items-center gap-2.5 py-1.5 min-h-12">
                      {co ? <CheckCircle2 size={20} className="text-luc shrink-0" /> : <Circle size={20} className="text-cam shrink-0" />}
                      <span className="flex-1 min-w-0">
                        <span className="block text-[14px] font-semibold text-chu">{nhanMuc(m)}</span>
                        <span className="block text-[12px] text-chu-phu">{MOTA_MUC[m]}</span>
                      </span>
                      {!co && duocSua && (
                        <button type="button" onClick={() => dienMuc(m)} className="min-h-11 px-3 rounded-xl bg-xanh-nhat text-xanh font-bold text-[14px] shrink-0">Điền</button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </The>

            {!duocSua && (
              <DongThongBao tone="cam" tieuDe="Trường này chưa giao cho bạn"
                moTa="Bạn chỉ xem được. Muốn điền thông tin, nhờ quản trị viên giao trường này cho bạn ở mục Hệ thống." />
            )}
            {bg.du?.daCatBot && <DongThongBao tone="cam" tieuDe="Danh sách quá dài nên chỉ hiện một phần" moTa="Hãy báo quản trị viên." />}

            <div id="khoi-kenh">
              <KhoiKenh key={`${kenhMoSan}-${kenh?.id ?? "moi"}-${kenh?.status ?? ""}`} maTruong={ma} tenTruong={ten} ban={kenh}
                duocSua={duocSua && (!kenh || duocDung(kenh))} laQtv={laQtv} moSan={kenhMoSan}
                onDaLuu={xong} />
            </div>

            {LOAI_THEM_TAY.map((loai) => {
              const ds = muc.filter((b) => loaiTuBanGhi(b) === loai);
              return (
                <section key={loai} className="space-y-2" aria-label={nhanLoai(loai)}>
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-extrabold text-[16px] text-muc">{nhanLoai(loai)} <span className="text-[13px] font-semibold text-chu-phu">({ds.length})</span></h2>
                    {duocSua && (
                      <button type="button" onClick={() => setDangMo({ loai })} className="min-h-11 px-2 text-[14px] font-bold text-xanh inline-flex items-center gap-1"><Plus size={16} /> Thêm</button>
                    )}
                  </div>
                  {ds.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-vien bg-trang p-3 text-[13px] text-chu-phu">Chưa có {nhanLoai(loai).toLowerCase()}.</p>
                  ) : ds.map((b) => {
                    const tt = thongTinTuBanGhi(b);
                    if (!tt) return null;
                    const moi = duocSua && duocDung(b);
                    const choDuyet = b.status === "SUBMITTED" || b.status === "IN_REVIEW" || b.status === "APPROVED";
                    const daCoBanChay = cua.some((x) => x.entityId === b.entityId && x.status === "PUBLISHED" && x.id !== b.id);
                    return (
                      <The key={b.id} className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-bold text-[15px] text-muc leading-snug">{tieuDeBanGhi(tt)}</p>
                            <p className="text-[12px] text-chu-phu mt-0.5">Cập nhật {dinhDangLuc(b.updatedAt)} · bản {b.version}</p>
                          </div>
                          <Nhan tone={TONE_TT[b.status]}>{NHAN_TT[b.status]}</Nhan>
                        </div>
                        <div className="rounded-xl bg-nen p-2.5 text-[13.5px] text-chu space-y-0.5">
                          {dongNoiDung(tt).map((d, i) => <p key={i}>{d}</p>)}
                        </div>
                        {daCoBanChay && <p className="text-[12px] text-chu-phu">Web vẫn đang hiện bản cũ cho tới khi bản này được duyệt và xuất bản.</p>}
                        {b.status === "REJECTED" && b.rejectionReason && (
                          <p className="rounded-xl bg-do-nhat p-2.5 text-[13px] text-do-chu"><b>Lý do trả lại:</b> {b.rejectionReason}</p>
                        )}
                        <a href={b.source.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 min-h-11 text-[13px] text-xanh font-semibold min-w-0">
                          <span className="shrink-0">Nguồn:</span><span className="truncate">{b.source.tieuDe}</span><ExternalLink size={12} className="shrink-0" />
                        </a>
                        {b.changeNote && <p className="text-[12px] text-chu-phu">Ghi chú: {b.changeNote}</p>}
                        {moi && !choDuyet && (
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <button type="button" onClick={() => setDangMo({ loai, ban: b })} className="min-h-11 rounded-xl border border-xanh/40 text-xanh font-bold text-[14px]">Sửa</button>
                            {b.status === "PUBLISHED" ? <span /> : (
                              <button type="button" disabled={dangDoi === b.id} onClick={() => void chuyen(b, "SUBMITTED", "Đã gửi duyệt. Quản trị viên sẽ xem và duyệt.")}
                                className="min-h-11 rounded-xl bg-xanh text-white font-bold text-[14px] disabled:opacity-50">Gửi duyệt</button>
                            )}
                          </div>
                        )}
                        {moi && laQtv && (b.status === "DRAFT" || b.status === "REJECTED") && (
                          <button type="button" disabled={dangDoi === b.id} onClick={() => void chuyen(b, "ARCHIVED", "Đã bỏ bản này.")}
                            className="min-h-11 w-full rounded-xl border border-do/40 text-do-chu font-bold text-[14px] disabled:opacity-50">Bỏ bản này</button>
                        )}
                        {choDuyet && <p className="text-[12px] text-chu-phu">Đang chờ xử lý nên chưa sửa được.</p>}
                      </The>
                    );
                  })}
                </section>
              );
            })}

            <section className="space-y-2" aria-label="Điểm chuẩn">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-extrabold text-[16px] text-muc">Điểm chuẩn <span className="text-[13px] font-semibold text-chu-phu">({diemChuan.length})</span></h2>
                {duocSua && <button type="button" onClick={() => setDiemMo({})} className="min-h-11 px-2 text-[14px] font-bold text-xanh inline-flex items-center gap-1"><Plus size={16} /> Thêm</button>}
              </div>
              {diemChuan.length === 0 ? (
                <p className="rounded-xl border border-dashed border-vien bg-trang p-3 text-[13px] text-chu-phu">Chưa có điểm chuẩn bổ sung. Mục này không bắt buộc.</p>
              ) : diemChuan.map((b) => {
                const t = tomTatBan(b);
                const moi = duocSua && duocDung(b);
                const choDuyet = b.status === "SUBMITTED" || b.status === "IN_REVIEW" || b.status === "APPROVED";
                return (
                  <The key={b.id} className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold text-[15px] text-muc leading-snug min-w-0">{t.tieuDe}</p>
                      <Nhan tone={TONE_TT[b.status]}>{NHAN_TT[b.status]}</Nhan>
                    </div>
                    {b.status === "REJECTED" && b.rejectionReason && <p className="rounded-xl bg-do-nhat p-2.5 text-[13px] text-do-chu"><b>Lý do trả lại:</b> {b.rejectionReason}</p>}
                    <a href={b.source.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 min-h-11 text-[13px] text-xanh font-semibold min-w-0">
                      <span className="shrink-0">Nguồn:</span><span className="truncate">{b.source.tieuDe}</span><ExternalLink size={12} className="shrink-0" />
                    </a>
                    {moi && !choDuyet && (
                      <div className="grid grid-cols-2 gap-2">
                        <button type="button" onClick={() => setDiemMo({ ban: b })} className="min-h-11 rounded-xl border border-xanh/40 text-xanh font-bold text-[14px]">Sửa</button>
                        {b.status === "PUBLISHED" ? <span /> : (
                          <button type="button" disabled={dangDoi === b.id} onClick={() => void chuyen(b, "SUBMITTED", "Đã gửi duyệt. Quản trị viên sẽ xem và duyệt.")} className="min-h-11 rounded-xl bg-xanh text-white font-bold text-[14px] disabled:opacity-50">Gửi duyệt</button>
                        )}
                      </div>
                    )}
                    {choDuyet && <p className="text-[12px] text-chu-phu">Đang chờ xử lý nên chưa sửa được.</p>}
                  </The>
                );
              })}
            </section>
          </>
        )}
      </NoiDung>

      {diemMo && <HopFormDiemChuan key={diemMo.ban?.id ?? "moi"} maTruong={ma} tenTruong={ten} ban={diemMo.ban} laQtv={laQtv} dong={() => setDiemMo(null)} onXong={xong} />}

      {dangMo && (
        <HopFormThongTin key={dangMo.ban?.id ?? `moi-${dangMo.loai}`} loai={dangMo.loai} maTruong={ma} tenTruong={ten} banGhi={dangMo.ban} laQtv={laQtv}
          dong={() => setDangMo(null)} onXong={xong} />
      )}
    </div>
  );
}

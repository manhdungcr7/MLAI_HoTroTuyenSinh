// Khóa kết nối cá nhân: tạo khóa để Claude hoặc ChatGPT nhập số liệu vào hàng chờ duyệt. Khóa hiện đúng một lần, có thể thu hồi ngay.
// Ai đăng nhập cũng dùng được (quyền ghi theo trường được giao do máy chủ kiểm); khóa chỉ làm việc của chính người tạo.
import { useState } from "react";
import { Copy, KeyRound, Trash2 } from "lucide-react";
import { thongBaoLoi } from "@cms/may-chu/api";
import { layKhoaKetNoi, taoKhoaKetNoi, thuHoiKhoaKetNoi, type KhoaKetNoi, type KhoaKetNoiMoi } from "@cms/may-chu/khoa-ket-noi-api";
import { useTai } from "@cms/trang-thai/dung-tai";
import { KhungDangTai, KhungLoi, TrangThaiTrong } from "@cms/thanh-phan/ui/hien-thi";
import { Nhan, Nut, The } from "@cms/thanh-phan/ui/nut-the";
import { DongThongBao } from "@cms/thanh-phan/ui/thong-bao";
import { dinhDangLuc } from "@cms/du-lieu-truong/dinh-dang";

const DUONG_MCP = "/api/mcp-dong-gop";
const CHO_KHOA = "KHOA_CUA_BAN";

function trangThaiKhoa(k: KhoaKetNoi): { nhan: string; tone: "luc" | "muc" | "do" } {
  if (k.conHieuLuc) return { nhan: "Đang dùng", tone: "luc" };
  if (k.thuHoiLuc) return { nhan: "Đã thu hồi", tone: "do" };
  return { nhan: "Hết hạn", tone: "muc" };
}

export function KhoaKetNoi() {
  const ds = useTai(() => layKhoaKetNoi());
  const [moi, setMoi] = useState<KhoaKetNoiMoi | null>(null);
  const [dang, setDang] = useState(false);
  const [banTin, setBanTin] = useState<{ tone: "luc" | "do"; noiDung: string } | null>(null);
  const [daChep, setDaChep] = useState(false);

  const duong = typeof window === "undefined" ? DUONG_MCP : `${window.location.origin}${DUONG_MCP}`;
  const hetLuot = (ds.du?.soKhoaConHieuLuc ?? 0) >= (ds.du?.toiDaKhoa ?? 3);

  const tao = async () => {
    setDang(true);
    setBanTin(null);
    setDaChep(false);
    try {
      const kq = await taoKhoaKetNoi();
      setMoi(kq);
      ds.taiLai();
    } catch (e) {
      setBanTin({ tone: "do", noiDung: thongBaoLoi(e) });
    } finally {
      setDang(false);
    }
  };

  const thuHoi = async (k: KhoaKetNoi) => {
    if (!window.confirm(`Thu hồi khóa ${k.tienTo}…? Ứng dụng đang dùng khóa này sẽ mất quyền ngay.`)) return;
    setBanTin(null);
    try {
      await thuHoiKhoaKetNoi(k.id);
      if (moi?.id === k.id) setMoi(null);
      setBanTin({ tone: "luc", noiDung: "Đã thu hồi khóa. Ứng dụng dùng khóa này không còn ghi được." });
      ds.taiLai();
    } catch (e) {
      setBanTin({ tone: "do", noiDung: thongBaoLoi(e) });
    }
  };

  const chep = async (noiDung: string) => {
    try {
      await navigator.clipboard.writeText(noiDung);
      setDaChep(true);
    } catch {
      setBanTin({ tone: "do", noiDung: "Trình duyệt không cho sao chép tự động. Bạn chọn chữ trong ô rồi sao chép thủ công." });
    }
  };

  return (
    <div className="space-y-3">
      <The className="space-y-2">
        <h2 className="font-extrabold text-[16px] text-muc">Khóa kết nối cho AI</h2>
        <p className="text-[13px] text-chu-phu">
          Dùng khi bạn muốn Claude hoặc ChatGPT đọc tài liệu tuyển sinh rồi nhập số liệu vào hàng chờ duyệt. Khóa chỉ làm được việc của chính bạn, trong các trường được giao. AI không bao giờ tự duyệt hay xuất bản.
        </p>
        <p className="text-[12px] text-chu-phu">Còn hiệu lực: {ds.du?.soKhoaConHieuLuc ?? 0} trên {ds.du?.toiDaKhoa ?? 3} khóa. Khóa mới hết hạn sau {ds.du?.macDinhNgay ?? 90} ngày.</p>
      </The>

      {banTin && <DongThongBao tone={banTin.tone} tieuDe={banTin.noiDung} onClick={() => setBanTin(null)} />}

      {moi && (
        <The tone="xanh" className="space-y-2.5">
          <p className="font-bold text-[14px] text-xanh">Khóa mới của bạn</p>
          <p className="text-[13px] text-chu">Khóa chỉ hiện một lần. Hãy sao chép và cất ở nơi an toàn. Đóng mục này là không xem lại được; khi đó hãy thu hồi và tạo khóa khác.</p>
          <input
            readOnly
            value={moi.khoa}
            aria-label="Khóa kết nối"
            onFocus={(e) => e.currentTarget.select()}
            className="w-full min-h-11 rounded-xl border border-vien bg-trang px-3 font-mono text-[13px] text-chu"
          />
          <Nut kieu="vien" bieuTuong={Copy} onClick={() => void chep(moi.khoa)}>{daChep ? "Đã sao chép" : "Sao chép khóa"}</Nut>
          <div className="space-y-1.5 text-[13px] text-chu">
            <p><b>Địa chỉ máy chủ:</b> <span className="break-all font-mono text-[12px]">{duong}</span></p>
            <p><b>Header:</b> <span className="font-mono text-[12px]">Authorization: Bearer {CHO_KHOA}</span> (thay {CHO_KHOA} bằng khóa ở trên)</p>
            <p>Claude Code: chạy lệnh này trong máy của bạn.</p>
            <pre className="whitespace-pre-wrap break-all rounded-xl bg-nen p-2.5 text-[12px] text-chu">{`claude mcp add --transport http dong-gop ${duong} --header "Authorization: Bearer ${CHO_KHOA}"`}</pre>
            <p>Claude hoặc ChatGPT khác: thêm máy chủ MCP kiểu HTTP với địa chỉ trên và header Authorization. Nếu ứng dụng không cho nhập header, ứng dụng đó chưa dùng được với khóa này.</p>
            <p>Câu mẫu gửi cho AI: <i>“Điền điểm chuẩn 2025 cho trường BKA từ file này. Mỗi dòng ghi kèm trích dẫn nguyên văn.”</i></p>
          </div>
        </The>
      )}

      <Nut bieuTuong={KeyRound} onClick={() => void tao()} disabled={dang || hetLuot || ds.dangTai}>
        {dang ? "Đang tạo" : hetLuot ? "Đã đủ khóa, hãy thu hồi bớt" : "Tạo khóa mới"}
      </Nut>

      {ds.dangTai && !ds.du ? <KhungDangTai soKhung={2} cao="h-20" /> : ds.loi && !ds.du ? (
        <KhungLoi moTa={ds.loi} thuLai={ds.taiLai} />
      ) : (ds.du?.khoa.length ?? 0) === 0 ? (
        <TrangThaiTrong bieuTuong={<KeyRound size={26} />} tieuDe="Bạn chưa có khóa nào" moTa="Tạo khóa khi bạn cần AI nhập số liệu giúp." />
      ) : (
        <div className="space-y-2">
          {ds.du!.khoa.map((k) => {
            const tt = trangThaiKhoa(k);
            return (
              <The key={k.id} className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-mono text-[14px] text-muc break-all">{k.tienTo}…</p>
                  <Nhan tone={tt.tone}>{tt.nhan}</Nhan>
                </div>
                <p className="text-[12px] text-chu-phu">Tạo {dinhDangLuc(k.taoLuc)} · Hết hạn {dinhDangLuc(k.hetHan)}</p>
                <p className="text-[12px] text-chu-phu">{k.lanDungCuoi ? `Lần dùng cuối ${dinhDangLuc(k.lanDungCuoi)}` : "Chưa dùng lần nào"}</p>
                {k.conHieuLuc && (
                  <Nut kieu="nguyHiem" bieuTuong={Trash2} onClick={() => void thuHoi(k)}>Thu hồi</Nut>
                )}
              </The>
            );
          })}
        </div>
      )}
    </div>
  );
}

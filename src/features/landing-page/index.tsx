import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, BookOpen, CalendarDays, CheckCircle2, Database, ExternalLink, GraduationCap, Heart, Info, Lightbulb, List, Mail, Search, Send, ShieldCheck, Target, Users, Wallet } from "lucide-react";
import { DUONG_DAN, EMAIL_BAO_SAI } from "@/duong-dan";
import { dinhDang } from "@/engine/dinh-dang";
import { gop } from "@/components/ui/nut-the";
import { THONG_KE, layViDuMau } from "./du-lieu-landing";

const so = (n: number) => n.toLocaleString("vi-VN");
const TONE_NHAN: Record<string, string> = { "Thử sức": "bg-tim-nhat text-tim-chu", "Vừa sức": "bg-xanh-nhat text-xanh-dam", "An toàn": "bg-luc-nhat text-luc-chu", "Dự phòng": "bg-nen text-chu-phu" };
const cuon = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });

function Nut({ den, children, phu, onClick }: { den?: string; children: ReactNode; phu?: boolean; onClick?: () => void }) {
  const lop = gop("inline-flex items-center justify-center gap-2 min-h-12 px-5 rounded-full text-[15px] font-semibold", phu ? "bg-trang text-xanh border border-vien" : "bg-xanh text-trang shadow-nut");
  return den ? <Link to={den} className={lop}>{children}<ArrowRight size={18} /></Link> : <button type="button" onClick={onClick} className={lop}>{children}</button>;
}
function Muc({ id, so: stt, tieuDe, loiDan, children, nen }: { id?: string; so: string; tieuDe: ReactNode; loiDan: string; children?: ReactNode; nen?: boolean }) {
  return (
    <section id={id} className={gop("py-14 md:py-20 border-b border-vien", nen ? "bg-nen" : "bg-trang")}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <p className="text-[13px] text-xanh font-semibold">{stt}</p>
        <h2 className="mt-1 text-[28px] md:text-[38px] leading-tight text-muc font-bold max-w-3xl">{tieuDe}</h2>
        <p className="mt-3 text-[16px] text-chu-phu max-w-2xl leading-relaxed">{loiDan}</p>
        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}
const The = ({ icon: Icon, tieu, children }: { icon: typeof Info; tieu: string; children?: ReactNode }) => (
  <div className="rounded-the border border-vien bg-trang p-4 flex gap-3">
    <span className="size-10 rounded-xl bg-xanh-nhat text-xanh grid place-items-center shrink-0"><Icon size={20} /></span>
    <div><h3 className="text-[15px] font-semibold text-muc">{tieu}</h3>{children && <p className="mt-0.5 text-[14px] text-chu-phu leading-snug">{children}</p>}</div>
  </div>
);

function DauTrang() {
  return (
    <header className="sticky top-0 z-30 bg-trang border-b border-vien">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
        <Link to={DUONG_DAN.gioiThieu()} className="text-[17px] font-bold text-muc">Nguyện Vọng <span className="text-xanh">AI</span></Link>
        <nav className="flex items-center gap-1 text-[14px]" aria-label="Điều hướng chính">
          <button className="hidden sm:inline-flex items-center min-h-11 px-3 text-chu" onClick={() => cuon("tinh-nang")}>Tính năng</button>
          <button className="hidden sm:inline-flex items-center min-h-11 px-3 text-chu" onClick={() => cuon("nguoi-dong-hanh")}>Người đồng hành</button>
          <button className="min-h-11 px-4 rounded-full bg-xanh text-trang font-semibold" onClick={() => cuon("dang-ky")}>Đăng ký sớm</button>
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  const tk: [string, string][] = [[so(THONG_KE.chuongTrinh), "chương trình đào tạo"], [so(THONG_KE.truong), "trường đại học, cao đẳng"], [so(THONG_KE.nhieuNam), "chương trình có điểm chuẩn từ hai năm"]];
  return (
    <section className="bg-nen border-b border-vien">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 md:py-24 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <p className="text-[13px] text-xanh font-semibold">Nền tảng định hướng nguyện vọng cho học sinh</p>
          <h1 className="mt-2 text-[34px] md:text-[48px] leading-[1.15] font-bold text-muc">Biết mình muốn gì.<br />Biết mình còn cách bao xa.<br /><span className="text-xanh">Biết tiếp theo phải làm gì.</span></h1>
          <p className="mt-4 text-[16px] text-chu-phu leading-relaxed max-w-xl">Nguyện Vọng AI giúp học sinh hiểu bản thân, xem các lựa chọn có căn cứ, xếp nguyện vọng cân bằng và biến mục tiêu thành kế hoạch từng tuần, với người đồng hành khi cần.</p>
          <div className="mt-6 grid grid-cols-2 gap-3 max-w-md">
            <Nut den={DUONG_DAN.chao()}>Dùng thử</Nut>
            <Nut phu onClick={() => cuon("dang-ky")}>Đăng ký sớm</Nut>
          </div>
        </div>
        <div className="rounded-lon bg-trang border border-vien shadow-the p-5">
          <p className="text-[13px] text-chu-phu">Dữ liệu đang có trong ứng dụng</p>
          <ul className="mt-3 divide-y divide-vien">
            {tk.map(([n, nhan]) => <li key={nhan} className="py-3 flex items-baseline gap-3"><b className="text-[28px] text-muc tabular-nums">{n}</b><span className="text-[14px] text-chu-phu">{nhan}</span></li>)}
          </ul>
          <p className="mt-2 text-[13px] text-chu-phu leading-snug">{so(THONG_KE.chinhThuc)} chương trình có điểm lấy từ đề án chính thức của trường. Chỗ nào chưa có số liệu, ứng dụng ghi "chưa có" thay vì đoán.</p>
          <Link to={DUONG_DAN.veDuLieu()} className="inline-flex items-center gap-1 min-h-11 text-[14px] font-semibold text-xanh">Xem nguồn và giới hạn <ExternalLink size={14} /></Link>
        </div>
      </div>
    </section>
  );
}

function Mau() {
  const { dong, soDoiNhan, toan } = useMemo(layViDuMau, []);
  const goiY = dong.slice(0, 3);
  return (
    <>
      <Muc id="tinh-nang" nen so="02" tieuDe={<>Có rất nhiều thông tin.<br /><span className="text-xanh">Nhưng vẫn khó quyết định.</span></>} loiDan="Điểm chuẩn và danh sách trường đều tìm được. Điều khó hơn là biết lựa chọn nào hợp với chính mình, và còn cách bao xa.">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <The icon={BarChart3} tieu="Điểm chuẩn">Theo năm, theo ngành, theo phương thức. {so(THONG_KE.nhieuNam)} chương trình có từ hai năm.</The>
          <The icon={Wallet} tieu="Học phí">Mới có số riêng cho {so(THONG_KE.hocPhi)} chương trình; còn lại dẫn tới trang học phí trong đề án.</The>
          <The icon={GraduationCap} tieu="Ngành học">Tên ngành, nhóm ngành, tổ hợp xét tuyển của từng trường.</The>
          <The icon={Search} tieu="Ký túc xá và học bổng">Hiện khi trường có bản tin đã được xác minh và kèm nguồn.</The>
          <The icon={ShieldCheck} tieu="Nguồn kiểm chứng">Mỗi con số có đường dẫn tới tài liệu gốc để tự đối chiếu.</The>
          <The icon={Database} tieu="Thiếu thì nói thiếu">Không điền số thay cho dữ liệu chưa có.</The>
        </div>
      </Muc>
      <Muc so="03" tieuDe={<>Hiểu bạn trước khi<br /><span className="text-xanh">nói bạn nên chọn gì</span></>} loiDan="Hệ thống bắt đầu từ điểm hiện tại, môn mạnh yếu, sở thích, ngân sách và việc có thể học xa nhà hay không.">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <The icon={BarChart3} tieu="Học lực hiện tại">Điểm sáu môn, thêm môn nếu có.</The>
          <The icon={Heart} tieu="Sở thích">Trắc nghiệm 18 câu để gợi ý nhóm ngành.</The>
          <The icon={Wallet} tieu="Ngân sách">So với học phí đã có số liệu.</The>
          <The icon={BookOpen} tieu="Nơi ở">Ở nhà hay có thể học xa.</The>
        </div>
        <div className="mt-6"><Nut den={DUONG_DAN.batDau()}>Bắt đầu hồ sơ</Nut></div>
      </Muc>
      <Muc nen so="04" tieuDe={<>Từ hàng trăm lựa chọn đến vài con đường <span className="text-xanh">đáng cân nhắc</span></>} loiDan="Mỗi lựa chọn nói rõ vì sao nên cân nhắc, cần lưu ý gì và số liệu đến từ đâu. Dưới đây là ví dụ lấy từ dữ liệu thật, tính cho hồ sơ mẫu Minh Anh (không phải học sinh thật).">
        <div className="grid md:grid-cols-3 gap-3">
          {goiY.map(({ lc, tong, nhan }) => (
            <article key={lc.id} className="rounded-the border border-vien bg-trang p-4 flex flex-col gap-2">
              <span className={gop("self-start rounded-full px-2.5 py-0.5 text-[12px] font-semibold", TONE_NHAN[nhan])}>{nhan}</span>
              <h3 className="text-[16px] font-semibold text-muc leading-snug">{lc.nganh}</h3>
              <p className="text-[14px] text-chu-phu">{lc.tenTruong}</p>
              <p className="text-[14px] text-chu">Điểm chuẩn {lc.namDiem}: <b>{dinhDang(lc.diemMin, 2)}</b>. Điểm của hồ sơ mẫu theo tổ hợp ngành: <b>{dinhDang(tong, 2)}</b>.</p>
              <p className="text-[12px] text-chu-phu">{lc.daKiemChung ? "Nguồn: đề án tuyển sinh chính thức." : "Nguồn thứ cấp, chưa đối chiếu với trường."}</p>
              {lc.linkNguon && <a href={lc.linkNguon} target="_blank" rel="noreferrer" className="mt-auto inline-flex items-center gap-1 min-h-11 text-[13px] font-semibold text-xanh">Xem nguồn <ExternalLink size={13} /></a>}
            </article>
          ))}
        </div>
        <div className="mt-6"><Nut den={DUONG_DAN.khamPha()}>Khám phá lựa chọn</Nut></div>
      </Muc>
      <Muc so="05" tieuDe={<>Nguyện vọng không chỉ là <span className="text-xanh">một danh sách</span></>} loiDan="Cân bằng giữa thử sức, vừa sức và an toàn, rồi thử thay đổi điều kiện trước khi quyết định. Nhãn bên dưới do ứng dụng tính từ điểm hồ sơ mẫu và điểm chuẩn năm gần nhất.">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-the border border-vien bg-trang p-4">
            <h3 className="flex items-center gap-2 text-[16px] font-semibold text-muc"><List size={18} className="text-xanh" />Danh sách nguyện vọng mẫu</h3>
            <ol className="mt-2 divide-y divide-vien">
              {dong.map(({ lc, nhan }, i) => (
                <li key={lc.id} className="py-2.5 flex items-center gap-3">
                  <span className="size-7 rounded-full bg-xanh-nhat text-xanh text-[13px] font-semibold grid place-items-center shrink-0">{i + 1}</span>
                  <span className="flex-1 min-w-0"><b className="block text-[14px] text-muc truncate">{lc.nganh}</b><span className="block text-[13px] text-chu-phu truncate">{lc.tenTruong}</span></span>
                  <span className={gop("rounded-full px-2.5 py-0.5 text-[12px] font-semibold shrink-0", TONE_NHAN[nhan])}>{nhan}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="rounded-the border border-vien bg-trang p-4">
            <h3 className="flex items-center gap-2 text-[16px] font-semibold text-muc"><Lightbulb size={18} className="text-xanh" />Thử thay đổi: Toán thêm 1 điểm</h3>
            <p className="mt-2 text-[14px] text-chu leading-relaxed">Hồ sơ mẫu đang có Toán {dinhDang(toan ?? 0, 1)}. Nếu thêm 1 điểm, <b>{soDoiNhan}</b> trong {dong.length} nguyện vọng đổi nhãn.</p>
            <ul className="mt-2 text-[14px] text-chu-phu space-y-1">
              {dong.filter((d) => d.nhan !== d.nhanKhiToanTang1).map((d) => <li key={d.lc.id}>{d.lc.nganh}: {d.nhan} thành {d.nhanKhiToanTang1}</li>)}
              {soDoiNhan === 0 && <li>Nhãn không đổi ở danh sách mẫu này.</li>}
            </ul>
            <div className="mt-4"><Nut den={DUONG_DAN.thuTinhHuong()}>Thử với hồ sơ của bạn</Nut></div>
          </div>
        </div>
      </Muc>
    </>
  );
}

function Con() {
  return (
    <>
      <Muc id="nguoi-dong-hanh" nen so="06" tieuDe={<>Không đủ dữ liệu? <span className="text-xanh">Có người đồng hành</span></>} loiDan="Khi thông tin chưa rõ hoặc bạn cần người cùng xem lại, phụ huynh hoặc thầy cô đồng hành qua một liên kết, không cần tạo tài khoản.">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <The icon={Users} tieu="Chia sẻ tóm tắt">Hồ sơ, mục tiêu, nguyện vọng và các câu nên trao đổi.</The>
          <The icon={Send} tieu="Nhận lời nhắn">Người đồng hành viết lời nhắn, bạn lưu vào hồ sơ.</The>
          <The icon={ShieldCheck} tieu="Dữ liệu ở trên máy bạn">Không gửi lên máy chủ khi chia sẻ.</The>
          <The icon={Database} tieu="Báo số liệu sai">Mỗi lựa chọn có nút báo sai để dữ liệu tốt dần.</The>
        </div>
        <div className="mt-6"><Nut den={DUONG_DAN.chiaSe()}>Chia sẻ với người đồng hành</Nut></div>
      </Muc>
      <Muc so="07" tieuDe={<>Chọn được rồi <span className="text-xanh">chưa phải là xong</span></>} loiDan="Khi đặt mục tiêu, ứng dụng tính khoảng cách điểm hiện tại, chỉ ra môn kéo điểm nhiều nhất và đổi thành việc cụ thể cho từng tuần.">
        <div className="grid sm:grid-cols-3 gap-3">
          <The icon={Target} tieu="Khoảng cách tới mục tiêu">Biết còn thiếu bao nhiêu điểm.</The>
          <The icon={List} tieu="Ưu tiên môn">Tập trung vào môn đáng làm trước.</The>
          <The icon={CalendarDays} tieu="Kế hoạch hằng tuần">Việc xếp vào giờ tự học còn trống.</The>
        </div>
        <div className="mt-6"><Nut den={DUONG_DAN.keHoach()}>Xem kế hoạch</Nut></div>
      </Muc>
      <Muc nen so="08" tieuDe={<>Không chỉ tư vấn <span className="text-xanh">một lần</span></>} loiDan="Việc hôm nay, lịch tuần này, tiến độ gần đây và nhắc học nằm trong ứng dụng, dùng mỗi ngày.">
        <Nut den={DUONG_DAN.tienDo()}>Theo dõi tiến độ</Nut>
      </Muc>
    </>
  );
}

function DangKy() {
  const [dangGui, setDangGui] = useState(false);
  const [loi, setLoi] = useState("");
  const [xong, setXong] = useState(false);
  async function gui(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (dangGui) return;
    const form = new FormData(e.currentTarget);
    setDangGui(true); setLoi("");
    try {
      const r = await fetch("/api/dang-ky-som", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(form)), signal: AbortSignal.timeout(15000) });
      const kq = (await r.json()) as { thanhCong?: boolean; loi?: string };
      if (!r.ok || !kq.thanhCong) throw new Error(kq.loi || "Chưa gửi được đăng ký. Bạn thử lại nhé.");
      setXong(true);
    } catch (c) {
      setLoi(c instanceof Error && c.message && !/JSON|Unexpected|fetch|timeout|aborted/i.test(c.message) ? c.message : "Chưa kết nối được hệ thống. Bạn thử lại sau nhé.");
    } finally { setDangGui(false); }
  }
  const o = "w-full min-h-12 rounded-xl border border-vien bg-trang px-3 text-[15px]";
  const nhom = (ten: string, nhan: string, ds: [string, string][], mac: string) => (
    <fieldset className="mt-4"><legend className="text-[14px] font-medium text-chu">{nhan}</legend>
      <div className="mt-1.5 flex flex-wrap gap-2">{ds.map(([v, t]) => <label key={v} className="inline-flex items-center gap-2 min-h-11 px-3 rounded-full border border-vien bg-trang text-[14px]"><input type="radio" name={ten} value={v} defaultChecked={v === mac} />{t}</label>)}</div>
    </fieldset>
  );
  return (
    <section id="dang-ky" className="py-14 md:py-20 bg-trang">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 grid md:grid-cols-2 gap-10 items-start">
        <div>
          <p className="text-[13px] text-xanh font-semibold">09</p>
          <h2 className="mt-1 text-[28px] md:text-[38px] leading-tight text-muc font-bold">Build cùng <span className="text-xanh">Nguyện Vọng AI</span></h2>
          <p className="mt-3 text-[16px] text-chu-phu leading-relaxed">Chúng tôi đang hoàn thiện sản phẩm cùng học sinh, phụ huynh và thầy cô. Để lại thông tin để tham gia giai đoạn truy cập sớm.</p>
        </div>
        <div className="rounded-lon border border-vien bg-nen p-5">
          {xong ? (
            <div role="status" className="text-center py-6">
              <CheckCircle2 className="mx-auto text-luc" size={40} />
              <h3 className="mt-2 text-[18px] font-semibold text-muc">Đã nhận đăng ký của bạn</h3>
              <p className="mt-1 text-[14px] text-chu-phu">Chúng tôi sẽ liên hệ khi đợt dùng thử phù hợp được mở.</p>
              <div className="mt-4"><Nut den={DUONG_DAN.chao()}>Khám phá ứng dụng</Nut></div>
            </div>
          ) : (
            <form onSubmit={gui}>
              <h3 className="text-[18px] font-semibold text-muc">Đăng ký truy cập sớm</h3>
              <fieldset disabled={dangGui}>
                <label htmlFor="ten" className="mt-4 block text-[14px] font-medium text-chu">Họ tên</label>
                <input id="ten" name="hoTen" required minLength={2} maxLength={100} autoComplete="name" placeholder="Nhập họ và tên" className={o} />
                {nhom("lop", "Bạn đang học lớp", [["11", "Lớp 11"], ["12", "Lớp 12"], ["khac", "Khác"]], "12")}
                {nhom("nhuCau", "Điều bạn cần nhất", [["nganh", "Chọn ngành"], ["truong", "Tìm trường"], ["nguyen_vong", "Xếp nguyện vọng"], ["ke_hoach", "Lập kế hoạch"]], "nganh")}
                <label htmlFor="lh" className="mt-4 block text-[14px] font-medium text-chu">Email hoặc số điện thoại</label>
                <input id="lh" name="lienHe" required maxLength={254} autoComplete="email" placeholder="Nhập email hoặc số điện thoại" aria-describedby={loi ? "loi-dk" : undefined} className={o} />
                {loi && <p id="loi-dk" role="alert" className="mt-2 text-[14px] text-do-chu">{loi}</p>}
                <button type="submit" className="mt-4 w-full min-h-12 rounded-full bg-xanh text-trang font-semibold shadow-nut disabled:opacity-60">{dangGui ? "Đang gửi…" : "Gửi đăng ký"}</button>
              </fieldset>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

function ChanTrang() {
  return (
    <footer className="bg-nen py-8 text-[14px] text-chu-phu">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-wrap gap-x-6 gap-y-1 items-center justify-between">
        <span>© {new Date().getFullYear()} Nguyện Vọng AI</span>
        <nav className="flex flex-wrap gap-x-4" aria-label="Liên kết chân trang">
          <Link className="min-h-11 inline-flex items-center" to={DUONG_DAN.veDuLieu()}>Nguồn dữ liệu</Link>
          <Link className="min-h-11 inline-flex items-center" to={DUONG_DAN.hoSoCaiDat()}>Quyền riêng tư</Link>
          <a className="min-h-11 inline-flex items-center gap-1" href={`mailto:${EMAIL_BAO_SAI}`}><Mail size={14} />Liên hệ</a>
        </nav>
      </div>
      <p className="max-w-6xl mx-auto px-4 sm:px-6 text-[12px]">Ví dụ trên trang tính từ dữ liệu thật và hồ sơ mẫu Minh Anh. Điểm chuẩn là số các năm trước, không phải dự đoán đậu hay trượt.</p>
    </footer>
  );
}

export default function LandingPage() {
  useEffect(() => { document.title = "Nguyện Vọng AI — Hiểu mình, chọn đúng, bước tiếp"; }, []);
  return (
    <div className="trang-toan-man-hinh">
      <DauTrang />
      <main><Hero /><Mau /><Con /><DangKy /></main>
      <ChanTrang />
    </div>
  );
}

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Database,
  ExternalLink,
  GraduationCap,
  Heart,
  Info,
  Lightbulb,
  List,
  Mail,
  MessageCircle,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Wallet
} from "lucide-react";
import { DUONG_DAN, EMAIL_BAO_SAI } from "@/duong-dan";
import { dinhDang } from "@/engine/dinh-dang";
import { gop } from "@/components/ui/nut-the";
import { THONG_KE, layViDuMau } from "./du-lieu-landing";

const so = (n: number) => n.toLocaleString("vi-VN");
const TONE_NHAN: Record<string, string> = {
  "Thử sức": "bg-tim-nhat text-tim-chu",
  "Vừa sức": "bg-xanh-nhat text-xanh-dam",
  "An toàn": "bg-luc-nhat text-luc-chu",
  "Dự phòng": "bg-nen text-chu-phu"
};

const cuon = (id: string) => {
  document.getElementById(id)?.scrollIntoView({
    behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"
  });
};

function Nut({
  den,
  children,
  phu,
  onClick,
  lopNgoai
}: {
  den?: string;
  children: ReactNode;
  phu?: boolean;
  onClick?: () => void;
  lopNgoai?: string;
}) {
  const lop = gop(
    "inline-flex items-center justify-center gap-1.5 min-h-12 px-3 sm:px-5 rounded-full text-[13.5px] sm:text-[14.5px] font-semibold transition-all active:scale-[0.98] text-center leading-none min-w-0",
    phu
      ? "bg-trang text-xanh border border-vien hover:bg-nen shadow-sm"
      : "bg-xanh text-trang shadow-nut hover:brightness-105",
    lopNgoai
  );
  return den ? (
    <Link to={den} className={lop}>
      <span className="truncate">{children}</span>
      <ArrowRight size={15} className="shrink-0" />
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={lop}>
      <span className="truncate">{children}</span>
    </button>
  );
}

function Chip({ icon: Icon, children }: { icon: typeof Info; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-trang border border-vien text-[12px] sm:text-[13px] font-medium text-chu shadow-sm shrink-0">
      <Icon size={13} className="text-xanh shrink-0" />
      <span>{children}</span>
    </span>
  );
}

function TheDacDiem({
  icon: Icon,
  tieuDe,
  moTa
}: {
  icon: typeof Info;
  tieuDe: string;
  moTa: string;
}) {
  return (
    <div className="flex items-start gap-2.5 sm:gap-3.5 p-3 sm:p-3.5 rounded-xl bg-trang border border-vien shadow-sm min-w-0 w-full overflow-hidden">
      <span className="size-8 sm:size-9 rounded-lg bg-xanh-nhat text-xanh grid place-items-center shrink-0 mt-0.5">
        <Icon size={17} />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="text-[13.5px] sm:text-[14.5px] font-semibold text-muc leading-snug break-words">{tieuDe}</h3>
        <p className="mt-0.5 text-[12.5px] sm:text-[13px] text-chu-phu leading-relaxed break-words">{moTa}</p>
      </div>
    </div>
  );
}

function TheGrid({ icon: Icon, tieu, children }: { icon: typeof Info; tieu: string; children?: ReactNode }) {
  return (
    <div className="rounded-the border border-vien bg-trang p-3 sm:p-4 flex gap-2.5 sm:gap-3 shadow-sm min-w-0 w-full overflow-hidden">
      <span className="size-8 sm:size-9 rounded-lg bg-xanh-nhat text-xanh grid place-items-center shrink-0">
        <Icon size={17} />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="text-[13.5px] sm:text-[14.5px] font-semibold text-muc leading-snug break-words">{tieu}</h3>
        {children && <p className="mt-0.5 text-[12px] sm:text-[13px] text-chu-phu leading-relaxed break-words">{children}</p>}
      </div>
    </div>
  );
}

function DauTrang() {
  return (
    <header className="sticky top-0 z-30 bg-trang border-b border-vien w-full">
      <div className="max-w-6xl mx-auto px-3.5 sm:px-6 h-14 flex items-center justify-between gap-2">
        <Link to={DUONG_DAN.gioiThieu()} className="text-[15px] sm:text-[17px] font-bold text-muc tracking-tight flex items-center gap-1.5 shrink-0 min-w-0">
          <span className="size-6.5 rounded-md bg-xanh text-trang font-black text-[12px] grid place-items-center shrink-0">NV</span>
          <span className="truncate">Nguyện Vọng <span className="text-xanh">AI</span></span>
        </Link>
        <nav className="flex items-center gap-1.5 sm:gap-2 text-[13px] sm:text-[13.5px] shrink-0" aria-label="Điều hướng chính">
          <button className="hidden sm:inline-flex items-center min-h-10 px-2.5 text-chu hover:text-xanh font-medium" onClick={() => cuon("ho-so")}>Hồ sơ</button>
          <button className="hidden sm:inline-flex items-center min-h-10 px-2.5 text-chu hover:text-xanh font-medium" onClick={() => cuon("tinh-nang")}>Tính năng</button>
          <button className="hidden sm:inline-flex items-center min-h-10 px-2.5 text-chu hover:text-xanh font-medium" onClick={() => cuon("nguoi-dong-hanh")}>Đồng hành</button>
          <button className="min-h-10 px-3 sm:px-3.5 rounded-full bg-xanh text-trang font-semibold text-[12.5px] sm:text-[13px] shadow-nut hover:brightness-105 whitespace-nowrap shrink-0" onClick={() => cuon("dang-ky")}>Đăng ký sớm</button>
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  const tk: [string, string][] = [
    [so(THONG_KE.chuongTrinh), "chương trình đào tạo"],
    [so(THONG_KE.truong), "trường đại học, cao đẳng"],
    [so(THONG_KE.nhieuNam), "chương trình có điểm 2 năm"]
  ];
  return (
    <section className="bg-nen border-b border-vien py-8 sm:py-14 md:py-20 w-full overflow-hidden">
      <div className="max-w-6xl mx-auto px-3.5 sm:px-6 grid lg:grid-cols-12 gap-6 lg:gap-10 items-center">
        <div className="lg:col-span-7 min-w-0">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-xanh-nhat text-xanh text-[12px] sm:text-[13px] font-semibold mb-2.5">
            <Sparkles size={13} className="shrink-0" /> Nền tảng định hướng nguyện vọng
          </span>
          <h1 className="text-[25px] sm:text-[34px] md:text-[44px] leading-[1.2] font-bold text-muc tracking-tight break-words">
            Biết mình muốn gì.<br />
            Biết mình còn cách bao xa.<br />
            <span className="text-xanh">Biết tiếp theo phải làm gì.</span>
          </h1>
          <p className="mt-3 text-[14px] sm:text-[15.5px] text-chu-phu leading-relaxed max-w-xl break-words">
            Nguyện Vọng AI giúp học sinh hiểu bản thân, đối chiếu các lựa chọn từ dữ liệu tuyển sinh có căn cứ, xếp danh sách nguyện vọng cân bằng và biến mục tiêu thành kế hoạch từng tuần.
          </p>

          {/* 2 nút kề nhau trên 1 hàng */}
          <div className="mt-5 grid grid-cols-2 gap-2 max-w-xs sm:max-w-md w-full">
            <Nut den={DUONG_DAN.chao()}>Dùng thử ngay</Nut>
            <Nut phu onClick={() => cuon("dang-ky")}>Đăng ký sớm</Nut>
          </div>
        </div>

        <div className="lg:col-span-5 min-w-0 w-full">
          <div className="rounded-2xl bg-trang border border-vien shadow-the p-3.5 sm:p-5 w-full overflow-hidden">
            <div className="flex items-center justify-between pb-2.5 border-b border-vien">
              <span className="text-[13px] font-semibold text-muc">Dữ liệu thực tế trong hệ thống</span>
              <span className="text-[11.5px] px-2 py-0.5 rounded bg-luc-nhat text-luc-chu font-medium">Chính thức</span>
            </div>
            <ul className="divide-y divide-vien">
              {tk.map(([n, nhan]) => (
                <li key={nhan} className="py-2.5 flex items-baseline justify-between gap-2 min-w-0">
                  <span className="text-[12.5px] sm:text-[13.5px] text-chu-phu truncate">{nhan}</span>
                  <b className="text-[20px] sm:text-[24px] text-muc tabular-nums font-bold shrink-0">{n}</b>
                </li>
              ))}
            </ul>
            <p className="mt-2.5 pt-2.5 border-t border-vien text-[12px] text-chu-phu leading-relaxed break-words">
              {so(THONG_KE.chinhThuc)} chương trình có điểm trích xuất trực tiếp từ đề án trường. Ứng dụng luôn hiển thị nguồn để tự kiểm chứng.
            </p>
            <Link
              to={DUONG_DAN.veDuLieu()}
              className="mt-2 inline-flex items-center gap-1 text-[12.5px] sm:text-[13px] font-semibold text-xanh hover:underline"
            >
              Xem chi tiết nguồn dữ liệu <ExternalLink size={13} className="shrink-0" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionHoSo() {
  return (
    <section id="ho-so" className="py-8 sm:py-14 md:py-20 bg-trang border-b border-vien w-full overflow-hidden">
      <div className="max-w-6xl mx-auto px-3.5 sm:px-6">
        <div className="grid lg:grid-cols-12 gap-6 lg:gap-10 items-center">
          <div className="lg:col-span-6 min-w-0">
            <h2 className="text-[23px] sm:text-[30px] md:text-[36px] leading-tight text-muc font-bold tracking-tight break-words">
              Hiểu bạn trước khi<br />
              <span className="text-xanh">nói bạn nên chọn gì</span>
            </h2>
            <p className="mt-2.5 text-[13.5px] sm:text-[15px] text-chu-phu leading-relaxed break-words">
              Nguyện Vọng AI không bắt đầu bằng một câu trả lời. Hệ thống bắt đầu bằng việc hiểu bạn đang ở đâu, điều gì quan trọng với bạn và thông tin nào còn thiếu.
            </p>

            {/* Chip tags */}
            <div className="mt-3.5 flex flex-wrap gap-1.5 sm:gap-2">
              <Chip icon={BarChart3}>Học lực hiện tại</Chip>
              <Chip icon={GraduationCap}>Môn mạnh / yếu</Chip>
              <Chip icon={Heart}>Sở thích</Chip>
              <Chip icon={Wallet}>Ngân sách</Chip>
              <Chip icon={BookOpen}>Có thể học xa nhà?</Chip>
            </div>

            {/* 3 cards */}
            <div className="mt-4 sm:mt-5 space-y-2.5 w-full">
              <TheDacDiem
                icon={CheckCircle2}
                tieuDe="Không cần điền biểu mẫu dài ngay từ đầu"
                moTa="Trò chuyện tự nhiên, nhẹ nhàng như đang có người hướng dẫn từng bước."
              />
              <TheDacDiem
                icon={MessageCircle}
                tieuDe="Hỏi dần những dữ liệu thực sự cần thiết"
                moTa="Chỉ hỏi những gì quan trọng với giai đoạn hiện tại của bạn, không làm phiền."
              />
              <TheDacDiem
                icon={ShieldCheck}
                tieuDe="Cho bạn thấy hệ thống đang hiểu mình thế nào"
                moTa="Tóm tắt hồ sơ trực quan, để bạn kiểm tra và bổ sung bất cứ lúc nào."
              />
            </div>

            <div className="mt-4 sm:mt-5">
              <Nut den={DUONG_DAN.batDau()}>Bắt đầu tạo hồ sơ</Nut>
            </div>
          </div>

          <div className="lg:col-span-6 min-w-0 w-full">
            <div className="rounded-2xl border border-vien bg-nen p-2 sm:p-3 shadow-the overflow-hidden w-full">
              <img
                src="/landing/ho-so.webp"
                alt="Giao diện hồ sơ học sinh trên Nguyện Vọng AI"
                className="w-full max-h-[300px] sm:max-h-[420px] object-contain mx-auto rounded-xl"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionKhamPha() {
  const { dong } = useMemo(layViDuMau, []);
  const goiY = dong.slice(0, 3);
  return (
    <section id="tinh-nang" className="py-8 sm:py-14 md:py-20 bg-nen border-b border-vien w-full overflow-hidden">
      <div className="max-w-6xl mx-auto px-3.5 sm:px-6">
        <h2 className="text-[23px] sm:text-[30px] md:text-[36px] leading-tight text-muc font-bold max-w-3xl tracking-tight break-words">
          Từ hàng trăm lựa chọn đến vài con đường{" "}
          <span className="text-xanh">đáng cân nhắc</span>
        </h2>
        <p className="mt-2.5 text-[13.5px] sm:text-[15px] text-chu-phu max-w-2xl leading-relaxed break-words">
          Mỗi lựa chọn nói rõ vì sao nên cân nhắc, cần lưu ý gì và số liệu đến từ đâu. Dưới đây là ví dụ tính từ dữ liệu thật cho hồ sơ mẫu Minh Anh.
        </p>

        {/* 3 thẻ mẫu */}
        <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full">
          {goiY.map(({ lc, tong, nhan }) => (
            <article key={lc.id} className="rounded-the border border-vien bg-trang p-3.5 sm:p-4 flex flex-col gap-1.5 shadow-sm min-w-0 w-full overflow-hidden">
              <span className={gop("self-start rounded-full px-2 py-0.5 text-[11.5px] font-semibold shrink-0", TONE_NHAN[nhan])}>
                {nhan}
              </span>
              <h3 className="text-[14.5px] sm:text-[15px] font-semibold text-muc leading-snug break-words">{lc.nganh}</h3>
              <p className="text-[13px] text-chu-phu truncate">{lc.tenTruong}</p>
              <p className="text-[12px] sm:text-[12.5px] text-chu mt-0.5 break-words">
                Điểm chuẩn {lc.namDiem}: <b>{dinhDang(lc.diemMin, 2)}</b>. Điểm tổ hợp: <b>{dinhDang(tong, 2)}</b>.
              </p>
              {lc.linkNguon && (
                <a
                  href={lc.linkNguon}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-auto pt-1 inline-flex items-center gap-1 text-[12px] font-semibold text-xanh hover:underline shrink-0"
                >
                  Xem nguồn đề án <ExternalLink size={12} className="shrink-0" />
                </a>
              )}
            </article>
          ))}
        </div>

        {/* 6 feature cards */}
        <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3 w-full">
          <TheGrid icon={BarChart3} tieu="Điểm chuẩn nhiều năm">
            Theo năm, theo ngành, theo phương thức. {so(THONG_KE.nhieuNam)} chương trình có dữ liệu từ 2 năm trở lên.
          </TheGrid>
          <TheGrid icon={Wallet} tieu="Học phí minh bạch">
            Có số liệu cụ thể cho {so(THONG_KE.hocPhi)} chương trình; các trường còn lại dẫn tới trang học phí trong đề án.
          </TheGrid>
          <TheGrid icon={GraduationCap} tieu="Tổ hợp & Nhóm ngành">
            Mã ngành, nhóm ngành và các tổ hợp xét tuyển tương ứng của từng trường.
          </TheGrid>
          <TheGrid icon={Search} tieu="Ký túc xá & Học bổng">
            Hiển thị khi trường có bản tin xác minh kèm đường link tham chiếu.
          </TheGrid>
          <TheGrid icon={ShieldCheck} tieu="Nguồn kiểm chứng">
            Mỗi con số đều có liên kết đối chiếu với tài liệu tuyển sinh gốc.
          </TheGrid>
          <TheGrid icon={Database} tieu="Thiếu thì nói thiếu">
            Không tự bịa số hay điền số phỏng đoán cho dữ liệu chưa có.
          </TheGrid>
        </div>

        <div className="mt-5">
          <Nut den={DUONG_DAN.khamPha()}>Khám phá các lựa chọn</Nut>
        </div>
      </div>
    </section>
  );
}

function SectionChienLuoc() {
  const { dong, soDoiNhan, toan } = useMemo(layViDuMau, []);
  return (
    <section className="py-8 sm:py-14 md:py-20 bg-trang border-b border-vien w-full overflow-hidden">
      <div className="max-w-6xl mx-auto px-3.5 sm:px-6">
        <h2 className="text-[23px] sm:text-[30px] md:text-[36px] leading-tight text-muc font-bold max-w-3xl tracking-tight break-words">
          Nguyện vọng không chỉ là <span className="text-xanh">một danh sách</span>
        </h2>
        <p className="mt-2.5 text-[13.5px] sm:text-[15px] text-chu-phu max-w-2xl leading-relaxed break-words">
          Cân bằng giữa Thử sức, Vừa sức và An toàn, rồi thử thay đổi điều kiện điểm số để thấy ngay kết quả trước khi đưa ra quyết định.
        </p>

        <div className="mt-5 grid lg:grid-cols-2 gap-3.5 sm:gap-5 w-full">
          {/* Card 1: Danh sach mau */}
          <div className="rounded-2xl border border-vien bg-trang p-3 sm:p-5 shadow-sm min-w-0 w-full overflow-hidden">
            <h3 className="flex items-center gap-2 text-[14.5px] sm:text-[15px] font-semibold text-muc">
              <List size={17} className="text-xanh shrink-0" />
              <span>Danh sách nguyện vọng mẫu</span>
            </h3>
            <ol className="mt-2.5 divide-y divide-vien w-full">
              {dong.map(({ lc, nhan }, i) => (
                <li key={lc.id} className="py-2.5 flex items-center justify-between gap-2 min-w-0 w-full">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="size-6 rounded-full bg-xanh-nhat text-xanh text-[11.5px] font-bold grid place-items-center shrink-0">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <b className="block text-[13px] sm:text-[13.5px] text-muc truncate">{lc.nganh}</b>
                      <span className="block text-[12px] text-chu-phu truncate">{lc.tenTruong}</span>
                    </div>
                  </div>
                  <span className={gop("rounded-full px-2 py-0.5 text-[11px] sm:text-[11.5px] font-semibold shrink-0 whitespace-nowrap", TONE_NHAN[nhan])}>
                    {nhan}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          {/* Card 2: Thu thay doi */}
          <div className="rounded-2xl border border-vien bg-nen p-3 sm:p-5 shadow-sm flex flex-col justify-between min-w-0 w-full overflow-hidden">
            <div className="min-w-0 w-full">
              <h3 className="flex items-center gap-2 text-[14.5px] sm:text-[15px] font-semibold text-muc">
                <Lightbulb size={17} className="text-xanh shrink-0" />
                <span>Thử thay đổi: Điểm Toán thêm +1</span>
              </h3>
              <p className="mt-2 text-[13px] sm:text-[13.5px] text-chu leading-relaxed break-words">
                Hồ sơ mẫu đang có Toán {dinhDang(toan ?? 0, 1)}. Nếu tăng 1 điểm, có{" "}
                <b className="text-xanh font-bold">{soDoiNhan}</b> trong {dong.length} nguyện vọng đổi nhãn an toàn hơn.
              </p>
              <ul className="mt-2.5 text-[12.5px] sm:text-[13px] text-chu-phu space-y-1.5 bg-trang p-2.5 sm:p-3 rounded-xl border border-vien w-full overflow-hidden">
                {dong
                  .filter((d) => d.nhan !== d.nhanKhiToanTang1)
                  .map((d) => (
                    <li key={d.lc.id} className="flex items-center justify-between gap-1.5 min-w-0 w-full">
                      <span className="font-medium text-muc truncate flex-1 min-w-0">{d.lc.nganh}:</span>
                      <span className="shrink-0 text-[11.5px] sm:text-[12px] whitespace-nowrap">
                        <span className="line-through text-chu-phu mr-1">{d.nhan}</span>
                        <span className="font-bold text-xanh">→ {d.nhanKhiToanTang1}</span>
                      </span>
                    </li>
                  ))}
                {soDoiNhan === 0 && <li>Nhãn không đổi ở danh sách mẫu này.</li>}
              </ul>
            </div>
            <div className="mt-4 pt-3 border-t border-vien">
              <Nut den={DUONG_DAN.thuTinhHuong()}>Thử với hồ sơ của bạn</Nut>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionKeHoachVaDongHanh() {
  return (
    <>
      {/* Ke hoach hoc tap */}
      <section className="py-8 sm:py-14 md:py-20 bg-nen border-b border-vien w-full overflow-hidden">
        <div className="max-w-6xl mx-auto px-3.5 sm:px-6">
          <div className="grid lg:grid-cols-12 gap-6 lg:gap-10 items-center">
            <div className="lg:col-span-6 min-w-0">
              <h2 className="text-[23px] sm:text-[30px] md:text-[36px] leading-tight text-muc font-bold tracking-tight break-words">
                Chọn được rồi <span className="text-xanh">chưa phải là xong</span>
              </h2>
              <p className="mt-2.5 text-[13.5px] sm:text-[15px] text-chu-phu leading-relaxed break-words">
                Khi đặt mục tiêu, ứng dụng tính khoảng cách điểm hiện tại, chỉ ra môn kéo điểm nhiều nhất và đổi thành các việc cụ thể phân bổ cho từng tuần tự học.
              </p>
              <div className="mt-4 space-y-2.5 w-full">
                <TheDacDiem
                  icon={Target}
                  tieuDe="Khoảng cách tới mục tiêu"
                  moTa="Biết chính xác còn thiếu bao nhiêu điểm cho từng nguyện vọng ưu tiên."
                />
                <TheDacDiem
                  icon={List}
                  tieuDe="Ưu tiên môn học"
                  moTa="Tập trung thời gian vào môn mang lại hiệu quả nâng điểm cao nhất."
                />
                <TheDacDiem
                  icon={CalendarDays}
                  tieuDe="Kế hoạch hằng tuần"
                  moTa="Nhiệm vụ tự học được xếp khớp vào các khung giờ rảnh của em."
                />
              </div>
              <div className="mt-4 sm:mt-5">
                <Nut den={DUONG_DAN.keHoach()}>Xem kế hoạch học tập</Nut>
              </div>
            </div>

            <div className="lg:col-span-6 min-w-0 w-full">
              <div className="rounded-2xl border border-vien bg-trang p-2 sm:p-3 shadow-the w-full overflow-hidden">
                <img
                  src="/landing/plan.webp"
                  alt="Kế hoạch học tập tuần trên Nguyện Vọng AI"
                  className="w-full max-h-[280px] sm:max-h-[400px] object-contain mx-auto rounded-xl"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Nguoi dong hanh */}
      <section id="nguoi-dong-hanh" className="py-8 sm:py-14 md:py-20 bg-trang border-b border-vien w-full overflow-hidden">
        <div className="max-w-6xl mx-auto px-3.5 sm:px-6">
          <div className="grid lg:grid-cols-12 gap-6 lg:gap-10 items-center">
            <div className="lg:col-span-6 order-2 lg:order-1 min-w-0 w-full">
              <div className="rounded-2xl border border-vien bg-nen p-2 sm:p-3 shadow-the w-full overflow-hidden">
                <img
                  src="/landing/mentor.webp"
                  alt="Giao diện chia sẻ với người đồng hành"
                  className="w-full max-h-[280px] sm:max-h-[400px] object-contain mx-auto rounded-xl"
                  loading="lazy"
                />
              </div>
            </div>

            <div className="lg:col-span-6 order-1 lg:order-2 min-w-0">
              <h2 className="text-[23px] sm:text-[30px] md:text-[36px] leading-tight text-muc font-bold tracking-tight break-words">
                Không đủ dữ liệu? <span className="text-xanh">Có người đồng hành</span>
              </h2>
              <p className="mt-2.5 text-[13.5px] sm:text-[15px] text-chu-phu leading-relaxed break-words">
                Khi thông tin chưa rõ hoặc em cần người cùng bàn bạc, phụ huynh hoặc thầy cô đồng hành qua một liên kết duy nhất — không cần tạo tài khoản rườm rà.
              </p>
              <div className="mt-4 space-y-2.5 w-full">
                <TheDacDiem
                  icon={Users}
                  tieuDe="Chia sẻ tóm tắt"
                  moTa="Hồ sơ, mục tiêu, danh sách nguyện vọng và những câu hỏi nên trao đổi."
                />
                <TheDacDiem
                  icon={Send}
                  tieuDe="Nhận lời nhắn trực tiếp"
                  moTa="Người đồng hành để lại lời khuyên, em lưu vào hồ sơ để tham khảo."
                />
                <TheDacDiem
                  icon={ShieldCheck}
                  tieuDe="Dữ liệu lưu trên máy bạn"
                  moTa="Bảo mật tuyệt đối, không tự ý tải thông tin cá nhân lên máy chủ."
                />
              </div>
              <div className="mt-4 sm:mt-5">
                <Nut den={DUONG_DAN.chiaSe()}>Chia sẻ với người đồng hành</Nut>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function SectionDangKy() {
  const [dangGui, setDangGui] = useState(false);
  const [loi, setLoi] = useState("");
  const [xong, setXong] = useState(false);

  async function gui(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (dangGui) return;
    const form = new FormData(e.currentTarget);
    setDangGui(true);
    setLoi("");
    try {
      const r = await fetch("/api/dang-ky-som", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form)),
        signal: AbortSignal.timeout(15000)
      });
      const kq = (await r.json()) as { thanhCong?: boolean; loi?: string };
      if (!r.ok || !kq.thanhCong) throw new Error(kq.loi || "Chưa gửi được đăng ký. Bạn thử lại nhé.");
      setXong(true);
    } catch (c) {
      setLoi(
        c instanceof Error && c.message && !/JSON|Unexpected|fetch|timeout|aborted/i.test(c.message)
          ? c.message
          : "Chưa kết nối được hệ thống. Bạn thử lại sau nhé."
      );
    } finally {
      setDangGui(false);
    }
  }

  const o = "w-full min-h-11 rounded-xl border border-vien bg-trang px-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-xanh";
  const nhom = (ten: string, nhan: string, ds: [string, string][], mac: string) => (
    <fieldset className="mt-3.5">
      <legend className="text-[13.5px] font-medium text-chu">{nhan}</legend>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {ds.map(([v, t]) => (
          <label
            key={v}
            className="inline-flex items-center gap-1.5 min-h-10 px-3 rounded-full border border-vien bg-trang text-[13px] cursor-pointer hover:bg-nen has-[:checked]:bg-xanh-nhat has-[:checked]:border-xanh has-[:checked]:text-xanh-dam font-medium shrink-0"
          >
            <input type="radio" name={ten} value={v} defaultChecked={v === mac} className="accent-xanh" />
            {t}
          </label>
        ))}
      </div>
    </fieldset>
  );

  return (
    <section id="dang-ky" className="py-8 sm:py-14 md:py-20 bg-nen w-full overflow-hidden">
      <div className="max-w-6xl mx-auto px-3.5 sm:px-6 grid lg:grid-cols-12 gap-6 lg:gap-10 items-start">
        <div className="lg:col-span-5 min-w-0">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-luc-nhat text-luc-chu text-[12px] font-semibold mb-2.5">
            Giai đoạn phát triển
          </span>
          <h2 className="text-[25px] sm:text-[32px] md:text-[38px] leading-tight text-muc font-bold tracking-tight break-words">
            Cùng hoàn thiện <br />
            <span className="text-xanh">Nguyện Vọng AI</span>
          </h2>
          <p className="mt-2.5 text-[13.5px] sm:text-[15px] text-chu-phu leading-relaxed break-words">
            Chúng tôi liên tục cập nhật dữ liệu và thuật toán cùng các bạn học sinh, phụ huynh và thầy cô. Để lại thông tin để nhận thông báo và truy cập sớm nhất.
          </p>
        </div>

        <div className="lg:col-span-7 min-w-0 w-full">
          <div className="rounded-2xl border border-vien bg-trang p-3.5 sm:p-6 shadow-the w-full overflow-hidden">
            {xong ? (
              <div role="status" className="text-center py-6">
                <CheckCircle2 className="mx-auto text-luc" size={44} />
                <h3 className="mt-2.5 text-[17px] sm:text-[18px] font-bold text-muc">Đã nhận đăng ký thành công!</h3>
                <p className="mt-1.5 text-[13px] text-chu-phu max-w-sm mx-auto break-words">
                  Cảm ơn bạn. Chúng tôi sẽ liên hệ qua email hoặc số điện thoại khi có đợt trải nghiệm mới.
                </p>
                <div className="mt-5">
                  <Nut den={DUONG_DAN.chao()}>Trải nghiệm bản dùng thử</Nut>
                </div>
              </div>
            ) : (
              <form onSubmit={gui} className="space-y-3 w-full">
                <h3 className="text-[16px] sm:text-[17px] font-bold text-muc">Đăng ký nhận quyền truy cập sớm</h3>
                <fieldset disabled={dangGui} className="w-full">
                  <div>
                    <label htmlFor="ten" className="block text-[13px] font-medium text-chu mb-1">
                      Họ và tên
                    </label>
                    <input
                      id="ten"
                      name="hoTen"
                      required
                      minLength={2}
                      maxLength={100}
                      autoComplete="name"
                      placeholder="Ví dụ: Nguyễn Văn A"
                      className={o}
                    />
                  </div>

                  {nhom(
                    "lop",
                    "Bạn đang là",
                    [
                      ["11", "Lớp 11"],
                      ["12", "Lớp 12"],
                      ["phu_huynh", "Phụ huynh"],
                      ["khac", "Khác"]
                    ],
                    "12"
                  )}

                  {nhom(
                    "nhuCau",
                    "Nội dung bạn quan tâm nhất",
                    [
                      ["nganh", "Chọn ngành"],
                      ["truong", "Tìm trường"],
                      ["nguyen_vong", "Xếp nguyện vọng"],
                      ["ke_hoach", "Lập kế hoạch"]
                    ],
                    "nganh"
                  )}

                  <div className="mt-3.5">
                    <label htmlFor="lh" className="block text-[13px] font-medium text-chu mb-1">
                      Email hoặc số điện thoại liên hệ
                    </label>
                    <input
                      id="lh"
                      name="lienHe"
                      required
                      maxLength={254}
                      autoComplete="email"
                      placeholder="Nhập email hoặc số điện thoại"
                      aria-describedby={loi ? "loi-dk" : undefined}
                      className={o}
                    />
                  </div>

                  {loi && (
                    <p id="loi-dk" role="alert" className="mt-2.5 text-[13px] text-do-chu font-medium break-words">
                      {loi}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="mt-4 w-full min-h-12 rounded-full bg-xanh text-trang font-semibold text-[14px] shadow-nut disabled:opacity-60 hover:brightness-105 transition-all"
                  >
                    {dangGui ? "Đang gửi đăng ký…" : "Gửi đăng ký sớm"}
                  </button>
                </fieldset>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function ChanTrang() {
  return (
    <footer className="bg-trang border-t border-vien py-8 text-[13.5px] text-chu-phu w-full overflow-hidden">
      <div className="max-w-6xl mx-auto px-3.5 sm:px-6">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between pb-4 border-b border-vien">
          <span className="font-semibold text-muc">© {new Date().getFullYear()} Nguyện Vọng AI</span>
          <nav className="flex flex-wrap gap-x-4 gap-y-1.5 items-center text-[12.5px] sm:text-[13px]" aria-label="Liên kết chân trang">
            <Link className="hover:text-xanh min-h-10 inline-flex items-center" to={DUONG_DAN.veDuLieu()}>Nguồn dữ liệu</Link>
            <Link className="hover:text-xanh min-h-10 inline-flex items-center" to={DUONG_DAN.hoSoCaiDat()}>Quyền riêng tư</Link>
            <a className="hover:text-xanh min-h-10 inline-flex items-center gap-1" href={`mailto:${EMAIL_BAO_SAI}`}>
              <Mail size={14} className="shrink-0" /> Báo sai & Liên hệ
            </a>
          </nav>
        </div>
        <p className="mt-3 text-[12px] text-chu-phu leading-relaxed break-words">
          Số liệu và ví dụ được tính toán dựa trên đề án tuyển sinh chính thức và hồ sơ mẫu. Điểm chuẩn là dữ liệu tham chiếu các năm trước, không mang tính dự đoán đỗ trượt tuyệt đối.
        </p>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  useEffect(() => {
    document.title = "Nguyện Vọng AI — Hiểu mình, chọn đúng, bước tiếp";
  }, []);
  return (
    <div className="trang-toan-man-hinh nv-page bg-trang text-chu font-sans antialiased selection:bg-xanh-nhat selection:text-xanh-dam w-full max-w-full overflow-x-hidden">
      <DauTrang />
      <main className="w-full max-w-full overflow-x-hidden">
        <Hero />
        <SectionHoSo />
        <SectionKhamPha />
        <SectionChienLuoc />
        <SectionKeHoachVaDongHanh />
        <SectionDangKy />
      </main>
      <ChanTrang />
    </div>
  );
}

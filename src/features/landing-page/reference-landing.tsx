import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, BookOpen, Bot, Brain, BriefcaseBusiness, CalendarDays, Check, CheckCircle2, Database, ExternalLink, FileText, GraduationCap, GripVertical, Heart, House, Info, Layers, Lightbulb, List, Mail, Menu, MessageCircle, MonitorCheck, PlayCircle, Search, Send, ShieldCheck, Sparkles, Target, User, Users, Wallet, X, Zap, type LucideIcon } from "lucide-react";
import { DUONG_DAN, EMAIL_BAO_SAI } from "@/duong-dan";
import { choices, recommendations, wishes } from "./landing-fixtures";
import "@/styles/landing.css";

const asset = (name: string) => `${import.meta.env.BASE_URL}landing/${name}.webp`;
function jump(id: string) { document.getElementById(id)?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" }); }
function Mark() { return <svg className="lp-mark" viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M8 36C1 25 0 7 10 5c10-2 20 13 12 23L8 36Z" fill="currentColor"/><path d="M11 39C26 29 23 5 41 4c12 0 3 25-4 33-8 9-17 8-26 2Z" fill="currentColor"/><path d="M11 39c9-3 16-12 20-22-1 13-7 21-12 25l-8-3Z" fill="white" opacity=".22"/></svg>; }
function Brand() { return <span className="lp-brand"><Mark/><span>Nguyện Vọng <b>AI</b></span></span>; }
function Icon({ icon: Component }: { icon: LucideIcon }) { return <span className="lp-icon"><Component size={27} strokeWidth={2.2}/></span>; }
function Button({ children, to, target, secondary = false }: { children: ReactNode; to?: string; target?: string; secondary?: boolean }) { const className = `lp-button ${secondary ? "lp-secondary" : ""}`; return to ? <Link className={className} to={to}>{children}<ArrowRight size={23}/></Link> : <button className={className} onClick={() => jump(target ?? "dang-ky")}>{secondary && <PlayCircle size={23}/>} {children}{!secondary && <ArrowRight size={23}/>}</button>; }
function Label({ number }: { number: string }) { return <span className="lp-label">Section {number}</span>; }
function Note({ icon, title, children }: { icon: LucideIcon; title: string; children?: ReactNode }) { return <div className="lp-note"><Icon icon={icon}/><div><h3>{title}</h3>{children && <p>{children}</p>}</div></div>; }

function Header() {
  const [open, setOpen] = useState(false); const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (!open) return; const close = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); toggle.current?.focus(); } }; window.addEventListener("keydown", close); return () => window.removeEventListener("keydown", close); }, [open]);
  const go = (id: string) => { setOpen(false); jump(id); };
  return (
    <header className="lp-header">
      <div className="lp-header-inner">
        <Link to={DUONG_DAN.gioiThieu()} aria-label="Nguyện Vọng AI — giới thiệu"><Brand/></Link>
        <nav className={open ? "lp-nav is-open" : "lp-nav"} id="landing-navigation" aria-label="Điều hướng chính">
          <button onClick={() => go("tinh-nang")}>Tính năng</button>
          <Link to={DUONG_DAN.khamPha()} className="text-[15px] font-semibold text-slate-700 hover:text-blue-600">Khám phá 3.652 ngành</Link>
          <button onClick={() => go("nguoi-dong-hanh")}>Người đồng hành</button>
          <button onClick={() => go("dang-ky")}>Truy cập sớm</button>
          <Link className="lp-button" to={DUONG_DAN.khamPha()}>Vào ứng dụng <ArrowRight size={20}/></Link>
        </nav>
        <button ref={toggle} className="lp-menu" aria-label={open ? "Đóng menu" : "Mở menu"} aria-expanded={open} aria-controls="landing-navigation" onClick={() => setOpen(!open)}>{open ? <X/> : <Menu/>}</button>
      </div>
    </header>
  );
}

function Illustration({ name, alt }: { name: string; alt: string }) {
  return <img className="lp-illustration" src={asset(name)} alt={alt} width="1672" height="941" loading="lazy" />;
}

function Hero() {
  return (
    <section className="lp-hero lp-surface">
      <div className="lp-hero-main lp-container">
        <div className="lp-hero-copy">
          <span className="lp-label">Nền tảng định hướng nguyện vọng cho học sinh</span>
          <h1>
            Biết mình muốn gì.<br/>
            Biết mình còn cách bao xa.<br/>
            <em>Biết tiếp theo phải làm gì.</em>
          </h1>
          <p className="lp-lead lp-desktop-copy">
            Nguyện Vọng AI giúp học sinh hiểu bản thân, khám phá 3.652 ngành học từ 118 trường đại học trên cả nước, xây dựng chiến lược nguyện vọng 3 tầng và chuyển mục tiêu thành kế hoạch học tập thực tế mỗi tuần.
          </p>
          <p className="lp-lead lp-mobile-copy">
            Hiểu bản thân, xây nguyện vọng 3 tầng an toàn và biến mục tiêu thành kế hoạch học tập thực tế — với AI và Người đồng hành khi cần.
          </p>
          <div className="lp-actions">
            <Button to={DUONG_DAN.khamPha()}>Khám phá ứng dụng ngay</Button>
            <Button secondary to={DUONG_DAN.batDau()}>Bắt đầu tạo hồ sơ</Button>
          </div>
          <div className="lp-trust">
            <span><ShieldCheck/>Dữ liệu có nguồn đề án</span>
            <span><Users/>Có Người đồng hành</span>
            <span><BarChart3/>Kế hoạch tuần thực tế</span>
          </div>
        </div>
        <div className="lp-hero-art">
          <picture>
            <source media="(max-width: 760px)" srcSet={asset("mobile")} />
            <img src={asset("hero")} alt="Minh họa Nguyện Vọng AI trên laptop và điện thoại: hiểu bạn, nguyện vọng và kế hoạch học tập" width="1672" height="941" fetchPriority="high" className="lp-illustration" />
          </picture>
        </div>
      </div>
      <div className="lp-benefits lp-container">
        <div>
          <Icon icon={User}/>
          <div>
            <h3>Hiểu rõ hơn bản thân</h3>
            <p>Khám phá điểm mạnh, sở thích, giá trị của bạn</p>
          </div>
        </div>
        <div>
          <Icon icon={BookOpen}/>
          <div>
            <h3>Lựa chọn có căn cứ</h3>
            <p>Dựa trên dữ liệu đáng tin cậy và phù hợp với bạn</p>
          </div>
        </div>
        <div>
          <Icon icon={BarChart3}/>
          <div>
            <h3>Biến mục tiêu thành hành động</h3>
            <p>Kế hoạch học tập cụ thể, dễ thực hiện</p>
          </div>
        </div>
      </div>
    </section>
  );
}
function Decision() {
  const sources: [LucideIcon, string, string][] = [[BarChart3,"Điểm chuẩn","Theo năm, theo ngành, theo phương thức"],[Database,"Học phí","Mức học phí và chi phí sinh hoạt"],[GraduationCap,"Ngành học","Chương trình đào tạo, chỉ tiêu tuyển sinh"],[House,"Ký túc xá","Điều kiện ở, chi phí, môi trường sống"],[Search,"Khoảng cách","Vị trí địa lý, thời gian di chuyển"],[BriefcaseBusiness,"Việc làm","Cơ hội nghề nghiệp, mức lương sau tốt nghiệp"]];
  return <section id="tinh-nang" className="lp-section lp-surface"><div className="lp-container lp-split lp-decision"><div className="lp-copy"><Label number="02"/><h2>Có rất nhiều thông tin.<br/><em>Nhưng vẫn khó quyết định.</em></h2><p className="lp-lead">Điểm chuẩn có thể tìm được. Danh sách trường cũng có thể tìm được. Điều khó hơn là biết lựa chọn nào thật sự phù hợp với chính mình.</p><div className="lp-notes"><Note icon={Layers} title="Quá nhiều lựa chọn">Trường, ngành, học phí, phương thức xét tuyển nằm rải rác.</Note><Note icon={User} title="Khó biết cái nào hợp">Cùng một mức điểm nhưng hoàn cảnh và mục tiêu mỗi người khác nhau.</Note><Note icon={Target} title="Biết mục tiêu nhưng chưa biết bắt đầu">Muốn đạt trường mơ ước nhưng không rõ phải kéo môn nào trước.</Note></div><p className="lp-quote">Khó nhất không phải tìm thêm dữ liệu.<br/><strong>Khó nhất là biến dữ liệu thành một quyết định phù hợp.</strong></p></div><div className="lp-decision-art"><div className="lp-source-stack">{sources.map(([icon,title,description]) => <div className="lp-source" key={title}><Icon icon={icon}/><div><h3>{title}</h3><p>{description}</p></div></div>)}</div><div className="lp-process"><Mark/><strong>Nguyện Vọng <em>AI</em></strong><small>Phân tích · Đối chiếu · Gợi ý</small><span>● ● ●</span></div><div className="lp-recommendations"><h3><Sparkles/>Lựa chọn đáng cân nhắc</h3><p>Dựa trên hồ sơ, sở thích và mục tiêu của bạn</p>{recommendations.map((item,index) => <article key={item.school}><div className="lp-rec-row"><b className="lp-rank">{index+1}</b><span className={`lp-school-seal seal-${index}`}><GraduationCap/></span><div><h4>{item.school}</h4><p>{item.major}</p></div><b className="lp-score">{item.score}</b></div><div className="lp-tags">{item.tags.map(tag => <span key={tag}>{tag}</span>)}</div></article>)}<Link to={DUONG_DAN.khamPha()} className="lp-soft-link">Xem thêm gợi ý phù hợp với bạn <ArrowRight size={18}/></Link><small className="lp-example">Minh họa trải nghiệm sản phẩm</small></div></div></div></section>;
}
function Profile() { return <section className="lp-section lp-surface"><div className="lp-container lp-split lp-device-section"><div className="lp-copy"><Label number="03"/><h2>Hiểu bạn trước khi<br/><em>nói bạn nên chọn gì</em></h2><p className="lp-lead">Nguyện Vọng AI không bắt đầu bằng một câu trả lời. Nó bắt đầu bằng việc hiểu bạn đang ở đâu, điều gì quan trọng với bạn và thông tin nào còn thiếu.</p><div className="lp-profile-tags">{([[BarChart3,"Học lực hiện tại"],[GraduationCap,"Môn mạnh / yếu"],[Heart,"Sở thích"],[Wallet,"Ngân sách"],[House,"Có thể học xa nhà?"]] as [LucideIcon,string][]).map(([I,text]) => <span key={text}><I/>{text}</span>)}</div><div className="lp-notes lp-compact-notes"><Note icon={FileText} title="Không cần điền biểu mẫu dài ngay từ đầu">Trò chuyện tự nhiên, nhẹ nhàng như đang có người hướng dẫn.</Note><Note icon={MessageCircle} title="Hỏi dần những dữ liệu thực sự cần thiết">Chỉ hỏi những gì quan trọng với giai đoạn hiện tại của bạn.</Note><Note icon={Target} title="Cho bạn thấy hệ thống đang hiểu mình thế nào">Tóm tắt hồ sơ rõ ràng, để bạn kiểm tra và bổ sung bất cứ lúc nào.</Note></div><Button to={DUONG_DAN.batDau()}>Bắt đầu hồ sơ</Button></div><div className="lp-device-art"><Illustration name="ho-so" alt="Minh họa hồ sơ năng lực học tập và xét tuyển sớm" /></div></div></section>; }
function Choices() { return <section className="lp-section lp-surface"><div className="lp-container lp-split lp-choices"><div className="lp-copy"><Label number="04"/><h2>Từ hàng trăm lựa chọn<br/>đến vài con đường<br/><em>đáng cân nhắc</em></h2><p className="lp-lead">Thay vì trả về một danh sách dài, hệ thống ưu tiên những lựa chọn thực sự có liên quan đến hồ sơ bạn.</p><Note icon={Lightbulb} title="Mỗi lựa chọn đều trả lời 3 câu hỏi:">Vì sao phù hợp? · Cần lưu ý gì? · Dữ liệu đến từ đâu?</Note><Button to={DUONG_DAN.khamPha()}>Khám phá lựa chọn</Button></div><div className="lp-choice-visual"><div className="lp-funnel" aria-hidden="true"><span>Hàng trăm<br/>lựa chọn</span>{Array.from({length:7},(_,i) => <i key={i}/>)}<div><Mark/></div><ArrowRight/></div><div className="lp-choice-cards">{choices.map((item,index) => <article className={`lp-choice ${item.tone}`} key={item.title}><div className="lp-choice-top"><span className={`lp-status ${item.tone}`}><CheckCircle2 size={19}/>{item.label}</span><Link to={DUONG_DAN.veDuLieu()}>Xem nguồn <ExternalLink size={16}/></Link></div><div className="lp-choice-main"><Icon icon={[MonitorCheck,Brain,BarChart3][index]}/><div><h3>{item.title}</h3><div className="lp-reasons">{item.reasons.map(reason=><span key={reason}><Check size={14}/>{reason}</span>)}</div></div></div><p className="lp-choice-warning"><Info size={21}/>{item.note}</p></article>)}<small className="lp-example">Các lựa chọn trong hình là ví dụ minh họa.</small></div></div></div></section>; }
function Simulation() { return <section className="lp-section lp-surface"><div className="lp-container lp-simulation"><div className="lp-copy"><Label number="05"/><h2>Nguyện vọng không chỉ<br/>là <em>một danh sách</em></h2><p className="lp-lead">Hệ thống giúp bạn cân bằng giữa thử sức, mục tiêu và an toàn — đồng thời thử các tình huống trước khi quyết định.</p><div className="lp-actions"><Button to={DUONG_DAN.thuTinhHuong()}>Thử tình huống ngay</Button></div></div><div className="lp-white-panel lp-wishes"><h3><Icon icon={List}/>Danh sách nguyện vọng</h3>{wishes.map(([title,school,label,tone],index)=><div className="lp-wish" key={title}><b className="lp-rank">NV{index+1}</b><div><h4>{title}</h4><p>{school}</p></div><span className={`lp-status ${tone}`}>{label}</span><GripVertical size={18}/></div>)}<Note icon={Info} title="Chiến lược 3 tầng đã cân bằng.">Đầy đủ nhóm thử sức vươn tới, vừa sức chắc chắn và an toàn chốt chặn.</Note></div><div className="lp-white-panel lp-scenario"><h3><Icon icon={Wallet}/>Thử tình huống</h3><div className="lp-scenario-control"><Icon icon={GraduationCap}/><div><h4>Toán +1 điểm <b>+1,0đ</b></h4><div className="lp-slider"><i/></div></div></div><div className="lp-scenario-control"><Icon icon={Wallet}/><div><h4>Ngân sách -10 triệu <b>-10 triệu</b></h4><div className="lp-slider short"><i/></div></div></div><div className="lp-scenario-control"><Icon icon={House}/><h4>Không học xa nhà</h4><span className="lp-toggle"/></div><div className="lp-scenario-results"><h3><BarChart3/>Kết quả mô phỏng</h3><p><Icon icon={ArrowRight}/><span><b>2</b> lựa chọn trở nên khả thi hơn</span></p><p><Icon icon={Info}/><span><b>1</b> lựa chọn vượt ngân sách</span></p><p><Icon icon={Lightbulb}/><span><b>Bách Khoa IT1</b> chuyển từ thử sức cao → trong tầm với</span></p></div><small className="lp-example">Tình huống minh họa · Mở ứng dụng để thử với hồ sơ của bạn</small></div></div></section>; }
function Companion() { const steps: [LucideIcon,string,string][] = [[User,"Học sinh","Đặt câu hỏi, chia sẻ băn khoăn"],[Bot,"AI phân tích","Tổng hợp thông tin hiện có"],[Users,"Người đồng hành kiểm tra","Xem lại, đối chiếu và tư vấn"],[Database,"CMS cập nhật","Bổ sung, xác minh thông tin"],[BarChart3,"Dữ liệu tốt hơn cho cộng đồng","Chính xác, đầy đủ và tin cậy hơn"]]; return <section id="nguoi-dong-hanh" className="lp-section lp-surface"><div className="lp-container lp-split lp-companion"><div className="lp-copy"><Label number="06"/><h2>Không đủ dữ liệu?<br/><em>Có Người đồng hành</em></h2><p className="lp-lead">Không phải quyết định nào cũng nên giao cho thuật toán. Khi thông tin chưa đủ rõ hoặc bạn cần một người cùng xem lại lựa chọn, Người đồng hành sẽ hỗ trợ.</p><div className="lp-support-grid">{([[FileText,"Xem lại danh sách nguyện vọng"],[Search,"Kiểm tra nguồn tuyển sinh"],[Lightbulb,"Gợi ý phương án đang phân vân"],[BarChart3,"Góp ý kế hoạch mục tiêu"]] as [LucideIcon,string][]).map(([icon,title])=><Note icon={icon} title={title} key={title}/>)}</div><Button>Kết nối Người đồng hành</Button></div><div className="lp-companion-art"><div className="lp-mentor-card"><img src={asset("mentor")} alt="Chân dung minh họa người đồng hành" width="220" height="220" loading="lazy"/><div><h3>Người đồng hành</h3><span className="lp-status green">● Sẵn sàng hỗ trợ</span><p>Cùng xem lại thông tin tuyển sinh và đồng hành cùng bạn trong những quyết định quan trọng.</p></div><div className="lp-mentor-tags"><span><GraduationCap/>Hiểu hệ thống tuyển sinh</span><span><Users/>Kinh nghiệm thực tế</span><span><ShieldCheck/>Tư vấn khách quan</span></div></div><div className="lp-steps">{steps.map(([icon,title,description])=><div key={title}><Icon icon={icon}/><h4>{title}</h4><p>{description}</p></div>)}</div><div className="lp-help-example"><div className="lp-question"><Icon icon={User}/><span>Xét kết hợp chứng chỉ IELTS ngành này cần điều kiện gì ạ?</span></div><div className="lp-help-card"><p><Icon icon={Info}/>Người đồng hành hỗ trợ phân tích quy đổi điểm và đối chiếu Đề án tuyển sinh trang 18.</p><button className="lp-button" onClick={()=>jump("dang-ky")}><Send size={18}/>Nhờ Người đồng hành xem giúp</button></div></div></div></div></section>; }
function Plan() { return <section className="lp-section lp-surface"><div className="lp-container lp-split lp-device-section"><div className="lp-copy"><Label number="07"/><h2>Chọn được rồi chưa<br/>phải là xong</h2><h3 className="lp-blue-heading">Biết còn cách bao xa.<br/>Và biết tuần này phải làm gì.</h3><p className="lp-lead">Khi bạn chọn một mục tiêu, hệ thống phân tích khoảng cách hiện tại, chỉ ra môn nào có tác động lớn nhất và chuyển nó thành kế hoạch cụ thể.</p><div className="lp-actions"><Button to={DUONG_DAN.keHoach()}>Xem kế hoạch</Button><Button secondary target="tien-do">Xem cách hoạt động</Button></div><div className="lp-plan-benefits"><div><Icon icon={BarChart3}/><h3>Phân tích<br/>khoảng cách</h3><p>Biết rõ còn cách bao xa</p></div><div><Icon icon={List}/><h3>Xác định<br/>ưu tiên</h3><p>Tập trung vào môn quan trọng nhất</p></div><div><Icon icon={CalendarDays}/><h3>Kế hoạch<br/>hằng tuần</h3><p>Biến mục tiêu thành hành động cụ thể</p></div></div></div><div className="lp-device-art"><Illustration name="plan" alt="Minh họa chiến lược nguyện vọng và mục tiêu" /></div></div></section>; }
function Daily() { return <section id="tien-do" className="lp-section lp-surface"><div className="lp-container lp-split lp-device-section"><div className="lp-copy"><Label number="08"/><h2>Không chỉ tư vấn<br/><em>một lần</em></h2><p className="lp-lead">Nguyện Vọng AI tiếp tục cùng bạn <b>mỗi ngày:</b> việc cần làm hôm nay, lịch tuần này, tiến độ gần đây và những thay đổi quan trọng từ bên ngoài.</p><Button to={DUONG_DAN.tienDo()}>Theo dõi tiến độ</Button><Note icon={Lightbulb} title="Điểm mới, lịch mới, mục tiêu mới —">kế hoạch cũng thay đổi theo.</Note></div><div className="lp-device-art"><Illustration name="daily" alt="Minh họa kế hoạch học tập và tiến độ hằng ngày" /></div></div></section>; }
function EarlyAccess() {
  const [pending,setPending]=useState(false); const [error,setError]=useState(""); const [success,setSuccess]=useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if(pending) return; const data=new FormData(event.currentTarget); setPending(true); setError(""); try { const response=await fetch("/api/dang-ky-som",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(Object.fromEntries(data)),signal:AbortSignal.timeout(15000)}); const result = await response.json() as {thanhCong?:boolean;loi?:string}; if(!response.ok || !result.thanhCong) throw new Error(result.loi || "Chưa gửi được đăng ký. Vui lòng thử lại."); setSuccess(true); } catch(cause) { setError(cause instanceof Error && cause.message && !/JSON|Unexpected|fetch|timeout|aborted/i.test(cause.message) ? cause.message : "Chưa kết nối được hệ thống. Vui lòng thử lại sau."); } finally { setPending(false); } }
  return <section id="dang-ky" className="lp-register lp-surface"><div className="lp-container lp-register-grid"><div className="lp-copy"><Label number="09"/><h2>Build cùng<br/><em>Nguyện Vọng AI</em></h2><p className="lp-lead">Chúng tôi đang hoàn thiện sản phẩm cùng học sinh, Người đồng hành và cộng đồng giáo dục. Hãy để lại thông tin để tham gia giai đoạn truy cập sớm.</p><div className="lp-register-values"><span><Icon icon={Zap}/>Trải nghiệm sớm</span><span><Icon icon={MessageCircle}/>Góp ý trực tiếp</span><span><Icon icon={Users}/>Cùng xây sản phẩm có ích</span></div></div><div className="lp-build-art" aria-hidden="true"><p>Cùng nhau<br/>tạo ra giá trị thật</p><div className="lp-build-card"><Mark/><strong>Nguyện Vọng <em>AI</em></strong><span>Cùng kiến tạo hành trình chọn ngành, chọn tương lai tốt đẹp hơn.</span><BarChart3/></div><Icon icon={GraduationCap}/><Icon icon={Heart}/></div><div className="lp-form-panel">{success ? <div className="lp-success" role="status"><Icon icon={CheckCircle2}/><h3>Đã nhận đăng ký của bạn!</h3><p>Chúng tôi sẽ liên hệ khi đợt dùng thử phù hợp được mở.</p><Button to={DUONG_DAN.chao()}>Khám phá ứng dụng</Button></div> : <form onSubmit={submit}><h3><Icon icon={Send}/>Đăng ký truy cập sớm</h3><fieldset disabled={pending}><legend className="lp-sr-only">Thông tin đăng ký</legend><label htmlFor="early-name">Họ tên</label><div className="lp-input"><User/><input id="early-name" name="hoTen" required minLength={2} maxLength={100} autoComplete="name" placeholder="Nhập họ và tên của bạn"/></div><fieldset className="lp-radio-group"><legend>Bạn đang học lớp</legend><div className="lp-radio-row">{[["11","Lớp 11"],["12","Lớp 12"],["khac","Khác"]].map(([value,label])=><label key={value}><input type="radio" name="lop" value={value} defaultChecked={value==="12"}/>{label}</label>)}</div></fieldset><fieldset className="lp-radio-group"><legend>Điều bạn đang cần nhất?</legend><div className="lp-radio-row needs">{[["nganh","Chọn ngành"],["truong","Tìm trường"],["nguyen_vong","Xếp nguyện vọng"],["ke_hoach","Lập kế hoạch"]].map(([value,label])=><label key={value}><input type="radio" name="nhuCau" value={value} defaultChecked={value==="nganh"}/>{label}</label>)}</div></fieldset><label htmlFor="early-contact">Email hoặc SĐT</label><div className="lp-input"><Mail/><input id="early-contact" name="lienHe" required maxLength={254} autoComplete="email" placeholder="Nhập email hoặc số điện thoại của bạn" aria-describedby={error ? "registration-error" : undefined}/></div>{error && <p id="registration-error" className="lp-error" role="alert">{error}</p>}<button className="lp-button" type="submit" disabled={pending}>{pending ? "Đang gửi đăng ký…" : "Gửi đăng ký"}<ArrowRight size={22}/></button></fieldset><p className="lp-form-note"><Info size={18}/>Chúng tôi sẽ liên hệ khi đợt dùng thử phù hợp được mở.</p></form>}</div></div></section>;
}
function Footer() { return <footer className="lp-footer"><div className="lp-container"><div className="lp-footer-grid"><div><Brand/><p>Nguyện Vọng AI giúp học sinh hiểu bản thân, khám phá những lựa chọn đáng cân nhắc, xây nguyện vọng và biến mục tiêu thành kế hoạch thực tế — với AI và Người đồng hành khi cần.</p></div><div><h3>Sản phẩm</h3><Link to={DUONG_DAN.khamPha()}><Search/>Khám phá</Link><Link to={DUONG_DAN.nguyenVong()}><GraduationCap/>Nguyện vọng</Link><Link to={DUONG_DAN.mucTieu()}><BarChart3/>Mục tiêu</Link><Link to={DUONG_DAN.keHoach()}><CalendarDays/>Kế hoạch</Link></div><div><h3>Tin cậy</h3><Link to={DUONG_DAN.veDuLieu()}><Database/>Nguồn dữ liệu</Link><Link to={DUONG_DAN.hoSoCaiDat()}><ShieldCheck/>Quyền riêng tư</Link><a href={`mailto:${EMAIL_BAO_SAI}`}><Mail/>Liên hệ</a></div><div><h3>Cộng đồng</h3><button onClick={()=>jump("nguoi-dong-hanh")}><Users/>Người đồng hành</button><button onClick={()=>jump("dang-ky")}><Send/>Truy cập sớm</button><a href={`mailto:${EMAIL_BAO_SAI}?subject=Góp%20ý%20Nguyện%20Vọng%20AI`}><MessageCircle/>Góp ý sản phẩm</a></div></div><div className="lp-footer-bottom"><span>© {new Date().getFullYear()} Nguyện Vọng AI. All rights reserved.</span><span>Hình ảnh và số liệu trên trang minh họa trải nghiệm sản phẩm.</span></div></div></footer>; }
export default function LandingPage() { useEffect(()=>{document.title="Nguyện Vọng AI — Hiểu mình, chọn đúng, bước tiếp";},[]); return <div className="trang-toan-man-hinh lp-page"><a className="lp-skip" href="#landing-content" onClick={event=>{event.preventDefault();document.getElementById("landing-content")?.focus();}}>Đến nội dung chính</a><Header/><main id="landing-content" tabIndex={-1}><Hero/><Decision/><Profile/><Choices/><Simulation/><Companion/><Plan/><Daily/><EarlyAccess/></main><Footer/></div>; }

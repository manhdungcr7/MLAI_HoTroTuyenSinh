// Trang mẫu thiết kế (chỉ khi chạy dev): mọi thành phần, tông màu, giấy ô ly, trạng thái. Slice đối chiếu ở đây.
import { useState } from "react";
import { Bell, BookOpen, Flag, Sparkles, Target } from "lucide-react";
import { DauTrangChinh, NoiDung } from "@/components/layout/khung";
import { DaiNgay, TieuDeTuan } from "@/components/ui/dai-ngay";
import { ThanhCoCau, NhanNguyenVongTag, CAC_NHAN } from "@/components/ui/co-cau";
import { AnhBia, BieuTuongTron, HuyHieuTruong, NenHero } from "@/components/ui/hinh-nen";
import { HopTruot, KhungDangTai, KhungLoi, SoLon, ThanhTienDo, TieuDeMuc, TrangThaiTrong, VongTienDo } from "@/components/ui/hien-thi";
import { ChonNhanh, CongTac, OInput, OTich, ThanhChuyen, Truong } from "@/components/ui/nhap-lieu";
import { HangBam, Nhan, Nut, The } from "@/components/ui/nut-the";
import { DongThongBao } from "@/components/ui/thong-bao";
import { TheLuaChon } from "@/components/ui/the-lua-chon";
import { DuongXuHuong } from "@/components/ui/xu-huong";
import { LUA_CHON_MAU } from "@/data/lua-chon-mau";
import { bayNgayCuaTuan, isoNgay, thuHaiCuaTuan } from "@/engine/xep-lich";
import type { ToneTen } from "@/state/types";

const TONES: ToneTen[] = ["xanh", "luc", "cam", "tim", "do", "muc"];

export default function TrangThietKe() {
  const [thuHai, setThuHai] = useState(thuHaiCuaTuan(isoNgay(new Date())));
  const [ngay, setNgay] = useState(isoNgay(new Date()));
  const [mo, setMo] = useState(false);
  const [chip, setChip] = useState<string[]>(["CNTT"]);
  const [bat, setBat] = useState(true);
  const [tab, setTab] = useState("a");
  return (
    <>
      <DauTrangChinh tieuDe="Trang mẫu thiết kế" moTa="Chỉ có khi chạy dev. Dùng để đối chiếu giao diện." />
      <NoiDung className="space-y-5">
        <section className="space-y-2"><TieuDeMuc>Vở ô ly · mực xanh</TieuDeMuc>
          <NenHero className="p-4">
            <p className="text-[13px] text-chu-phu">Tờ giấy ô ly: tối đa một tờ mỗi màn, chứa con số để quyết định</p>
            <p className="so-lon mt-1 text-[26px] font-bold text-muc">Còn thiếu <span className="da-quang">1,5</span></p>
          </NenHero>
          <p className="text-[13px] text-chu-phu"><b className="text-chu">.da-quang</b> chỉ tô một con số mỗi màn · <b className="text-do-chu">bút đỏ</b> (tông do) chỉ cho điều cần sửa · <b className="text-chu">.so-lon</b> cho số lớn và tiêu đề không phải thẻ h.</p>
        </section>
        <section><TieuDeMuc>Tông màu</TieuDeMuc>
          <div className="grid grid-cols-3 gap-2">{TONES.map((t) => (
            <div key={t} className="space-y-1"><BieuTuongTron icon={Sparkles} tone={t} /><NenHero tone={t} className="p-2 text-[12px] font-bold">{t}</NenHero><HuyHieuTruong ten={t} tone={t} /></div>
          ))}</div>
        </section>
        <section className="space-y-2"><TieuDeMuc>Nút</TieuDeMuc>
          <Nut muiTen>Nút chính</Nut><Nut kieu="vien">Nút viền</Nut><Nut kieu="nhe" bieuTuong={Bell}>Nút nhẹ</Nut><Nut kieu="nguyHiem">Xóa</Nut><Nut disabled>Không bấm được</Nut>
        </section>
        <section className="space-y-2"><TieuDeMuc>Thẻ, nhãn, hàng bấm</TieuDeMuc>
          <The>Thẻ trắng</The>
          {TONES.slice(0, 5).map((t) => <The key={t} tone={t}>Thẻ nền {t}</The>)}
          <div className="flex gap-2 flex-wrap">{TONES.map((t) => <Nhan key={t} tone={t}>Nhãn {t}</Nhan>)}{CAC_NHAN.map((n) => <NhanNguyenVongTag key={n} nhan={n} />)}</div>
          <HangBam bieuTuong={BookOpen} tieuDe="Hàng bấm được" phu="Có mô tả phụ" onClick={() => {}} />
          <DongThongBao tone="cam" icon={Flag} tieuDe="Dòng thông báo" moTa="Có mô tả và hành động" hanhDong="Xem gợi ý" />
          <DongThongBao tone="do" icon={Target} tieuDe="Cảnh báo" onClick={() => {}} />
        </section>
        <section className="space-y-2"><TieuDeMuc>Ô nhập và lựa chọn</TieuDeMuc>
          <Truong nhan="Ô nhập" batBuoc goiY="Gợi ý nhỏ bên dưới"><OInput placeholder="Ví dụ" /></Truong>
          <ChonNhanh nhieu cacLua={["CNTT", "Kinh tế", "Y dược"].map((x) => ({ gia: x, nhan: x }))} giaTri={chip} onChange={setChip} />
          <OTich nhan="Ô tích" dang={bat} onChange={setBat} />
          <div className="flex items-center gap-3"><CongTac dang={bat} onChange={setBat} nhan="Công tắc" /><span>Công tắc</span></div>
          <ThanhChuyen cacMuc={[{ gia: "a", nhan: "Mục A" }, { gia: "b", nhan: "Mục B" }]} giaTri={tab} onChange={setTab} />
        </section>
        <section className="space-y-3"><TieuDeMuc>Tiến độ, số liệu, biểu đồ nhỏ</TieuDeMuc>
          <ThanhTienDo phanTram={62} /><ThanhTienDo phanTram={40} tone="cam" />
          <div className="flex items-center gap-4"><VongTienDo phanTram={75} /><SoLon nhan="Điểm hiện tại" so="24.5" don="/ 30" /><DuongXuHuong gia={[6.8, 7.2, 7.8]} tone="luc" /></div>
          <ThanhCoCau dem={{ "Thử sức": 2, "Vừa sức": 1, "An toàn": 1, "Dự phòng": 1 }} />
        </section>
        <section className="space-y-2"><TieuDeMuc>Dải ngày</TieuDeMuc>
          <TieuDeTuan thuHai={thuHai} onDoi={setThuHai} /><DaiNgay cacNgay={bayNgayCuaTuan(thuHai)} chon={ngay} onChon={setNgay} soViec={{ [ngay]: 2 }} />
        </section>
        <section className="space-y-2"><TieuDeMuc>Thẻ lựa chọn và ảnh bìa</TieuDeMuc>
          <div className="rounded-lon overflow-hidden border border-vien bg-trang"><AnhBia tone="tim" /></div>
          <TheLuaChon l={LUA_CHON_MAU[0]} onClick={() => {}} />
        </section>
        <section className="space-y-2"><TieuDeMuc>Trạng thái trống, đang tải, lỗi</TieuDeMuc>
          <TrangThaiTrong bieuTuong={<Target />} tieuDe="Chưa có gì" moTa="Giải thích vì sao trống và làm gì tiếp." />
          <KhungDangTai cao="h-16" soKhung={2} /><KhungLoi moTa="Nói thật chuyện gì sai." thuLai={() => {}} />
        </section>
        <Nut kieu="nhe" onClick={() => setMo(true)}>Mở hộp trượt</Nut>
        <HopTruot mo={mo} dong={() => setMo(false)} tieuDe="Hộp trượt"><p>Nội dung hộp trượt từ dưới lên.</p></HopTruot>
      </NoiDung>
    </>
  );
}

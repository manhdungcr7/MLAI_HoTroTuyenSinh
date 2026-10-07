// Lưới an toàn cuối cùng: dữ liệu trên máy hỏng đến mức app không dựng được thì không để em thấy màn trắng.
// Đặt NGOÀI AppProvider nên không dùng được useApp; đọc thẳng dữ liệu thô trên máy.
import { Component, type ReactNode } from "react";
import { KhungLoi } from "@/components/ui/hien-thi";
import { Nut } from "@/components/ui/nut-the";
import { chuanHoa } from "@/state/chuan-hoa";
import { taoBanSaoLuu } from "@/state/sao-luu";
import { docThoDaLuu, xoaTatCaDuLieu } from "@/state/store";
import { taiTepJson } from "@/state/tai-tep";

function taiBanSaoLuuTho() {
  const tho = docThoDaLuu();
  if (!tho) return;
  try { taiTepJson(taoBanSaoLuu(chuanHoa(JSON.parse(tho)))); } catch { taiTepJson(tho, "nguyen-vong-ai-du-lieu-tho.json"); }
}

export class LoiUngDung extends Component<{ children: ReactNode }, { loi: boolean }> {
  state = { loi: false };
  static getDerivedStateFromError() { return { loi: true }; }
  render() {
    if (!this.state.loi) return this.props.children;
    const coDuLieu = docThoDaLuu() !== null;
    return (
      <div className="khung-ung-dung p-4 pt-10 space-y-3">
        <KhungLoi tieuDe="Ứng dụng gặp lỗi" moTa="Có thể dữ liệu trên máy bị lỗi. Em tải bản sao lưu để giữ lại, rồi đặt lại dữ liệu nếu vẫn không mở được." thuLai={() => window.location.reload()} />
        {coDuLieu && <Nut kieu="vien" onClick={taiBanSaoLuuTho}>Tải bản sao lưu</Nut>}
        <Nut kieu="nguyHiem" onClick={() => { xoaTatCaDuLieu(); window.location.reload(); }}>Đặt lại dữ liệu</Nut>
      </div>
    );
  }
}

import { Navigate } from "react-router-dom";
import { DUONG_DAN } from "@/duong-dan";
import { useApp } from "@/state/store";
import { changCuaEm } from "@/state/chang";

/** Gốc của tab Kế hoạch: em lớp 10–11 vào Mục tiêu (chưa ôn thi); nước rút và thi lại có mục tiêu thì vào Kế hoạch tuần. */
export default function ChuyenKeHoach() {
  const { s } = useApp();
  const vaoTuan = s.mucTieu && changCuaEm(s) !== "dinhHuong";
  return <Navigate to={vaoTuan ? DUONG_DAN.tuan() : DUONG_DAN.mucTieu()} replace />;
}

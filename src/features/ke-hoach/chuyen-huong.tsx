import { Navigate } from "react-router-dom";
import { DUONG_DAN } from "@/duong-dan";
import { useApp } from "@/state/store";

/** Gốc của tab Kế hoạch: có mục tiêu thì vào Kế hoạch tuần, chưa có thì vào Mục tiêu. */
export default function ChuyenKeHoach() {
  const { s } = useApp();
  return <Navigate to={s.mucTieu ? DUONG_DAN.tuan() : DUONG_DAN.mucTieu()} replace />;
}

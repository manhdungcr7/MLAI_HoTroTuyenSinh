import { useParams } from "react-router-dom";
import { DauTrangCoQuayLai, NoiDung } from "@/components/layout/khung";

// Giữ chỗ: hồ sơ trường được hoàn thiện ở bước tiếp theo.
export default function ManTruong() {
  const { ma } = useParams();
  return (
    <>
      <DauTrangCoQuayLai tieuDe="Hồ sơ trường" />
      <NoiDung><p className="text-[14px] text-chu-phu">Mã trường: {ma}</p></NoiDung>
    </>
  );
}

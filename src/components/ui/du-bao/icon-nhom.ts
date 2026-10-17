import { BookOpen, Briefcase, GraduationCap, HeartPulse, Layers, Leaf, Monitor, Newspaper, Palette, Scale, Wrench, BarChart3, type LucideIcon } from "lucide-react";

const LUAT: [RegExp, LucideIcon][] = [
  [/sư phạm|giáo dục/i, GraduationCap], [/kinh tế|tài chính|ngân hàng|kế toán|thống kê/i, BarChart3], [/quản trị|kinh doanh|thương mại|marketing|logistic/i, Briefcase],
  [/thông tin|máy tính|phần mềm|dữ liệu|điện tử|viễn thông/i, Monitor], [/báo chí|truyền thông|ngôn ngữ|xã hội|văn/i, Newspaper], [/y |y$|dược|sức khỏe|điều dưỡng|răng/i, HeartPulse],
  [/nông|lâm|thủy sản|môi trường|sinh/i, Leaf], [/luật/i, Scale], [/nghệ thuật|kiến trúc|thiết kế|mỹ thuật/i, Palette], [/kỹ thuật|cơ khí|xây dựng|điện|công nghệ|hóa|vật liệu|sản xuất/i, Wrench],
  [/khoa học|toán|vật lý|tự nhiên/i, BookOpen],
];
/** Biểu tượng theo tên nhóm ngành (khớp từ khóa), không khớp thì dùng biểu tượng chung. */
export const iconNhomNganh = (ten: string): LucideIcon => LUAT.find(([r]) => r.test(ten))?.[1] ?? Layers;

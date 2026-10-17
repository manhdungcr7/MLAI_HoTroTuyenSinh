/** Quy tắc nhận học phí trong danh mục đóng gói: chỉ văn bản sơ cấp đã được kiểm tra mới được hiển thị. */
export interface HocPhiNguon {
  trieuNam: number;
  nam: string;
  trang?: number;
  url?: string;
  /** Chỉ người đối chiếu tài liệu gốc mới được đặt cờ này trong dữ liệu nguồn. */
  nguonSoCap?: boolean;
  /** ISO time do lần đối chiếu tài liệu gốc ghi lại, không suy từ năm tuyển sinh. */
  kiemChungLuc?: string;
  /** Dữ liệu cũ: tuyệt đối không đưa ra màn học sinh. */
  uocTinh?: boolean;
}

const DOMAIN_THU_CAP = new Set(["tuyensinh247.com", "cdn.tuyensinh247.com", "images.tuyensinh247.com"]);

export function laUrlSoCap(url: unknown): url is string {
  if (typeof url !== "string") return false;
  try {
    const host = new URL(url).hostname.toLowerCase();
    return ![...DOMAIN_THU_CAP].some((d) => host === d || host.endsWith(`.${d}`));
  } catch { return false; }
}

export function laHocPhiDaKiemChung(hp: HocPhiNguon | undefined): hp is HocPhiNguon & Required<Pick<HocPhiNguon, "url" | "kiemChungLuc">> {
  return !!hp
    && hp.uocTinh !== true
    && hp.nguonSoCap === true
    && laUrlSoCap(hp.url)
    && typeof hp.kiemChungLuc === "string"
    && !Number.isNaN(Date.parse(hp.kiemChungLuc));
}

// Engine sinh lịch học cá thể hóa cùng AI (LLM Planner)
import type { AppState } from "@/state/store";
import type { ViecCanHoc, MonId } from "@/state/types";
import { mucTieuDayDu, khoangCachCuaToi } from "@/state/chon";
import { TEN_MON, TEN_MON_NGAN } from "@/state/types";
import { NOI_DUNG_ON } from "@/engine/tao-viec";
import { dinhDang } from "@/engine/dinh-dang";

export interface KeHoachAIBuoi {
  thu: string; // "Thứ 2", "Thứ 3", ...
  mon: MonId;
  tieuDe: string;
  phut: number;
  mucUuTien: "cao" | "vua" | "thap";
  mucTieuBuoi: string;
  chiTiet: string;
  cacBuoc: { phut: number; ten: string }[];
  tieuChi: string[];
  taiLieu: { ten: string; link?: string }[];
  lyDo: string;
}

export interface KetQuaKeHoachAI {
  promptGoiY: string;
  phanTichCaNhan: string;
  danhSachBuoi: KeHoachAIBuoi[];
}

/** Sinh prompt gợi ý và lịch học chi tiết từ AI dựa trên hồ sơ thực tế của học sinh */
export function sinhLichHocAI(s: AppState, _tuan?: string): KetQuaKeHoachAI {
  const m = mucTieuDayDu(s);
  const ten = s.hoSo.hoTen?.trim() || "học sinh";
  const kc = khoangCachCuaToi(s);
  const monThieu = kc.filter((x) => x.thieu > 0).sort((a, b) => b.thieu - a.thieu);
  const maToHop = s.mucTieu?.maToHop ?? "A00";
  const monTrongTam: MonId = monThieu[0]?.mon ?? (m?.toHop[0] as MonId) ?? "toan";
  const monPhu1: MonId = (m?.toHop.find((x) => x !== monTrongTam) as MonId) ?? "vatLy";
  const monPhu2: MonId = (m?.toHop.find((x) => x !== monTrongTam && x !== monPhu1) as MonId) ?? "hoaHoc";

  const ielts = s.hoSo.chungChiNgoaiNgu?.diem ? `${s.hoSo.chungChiNgoaiNgu.loai} ${s.hoSo.chungChiNgoaiNgu.diem}` : null;
  const thieuDiem = monThieu[0] ? dinhDang(monThieu[0].thieu, 1) : "0,5";

  const promptGoiY = `Lập lịch học chi tiết tuần này cho em (${ten}) theo mục tiêu ngành ${m?.lc.nganh ?? "Công nghệ thông tin"} (${m?.lc.truong ?? "Đại học"}), khối ${maToHop}, mục tiêu ${dinhDang(m?.mucTieuTho ?? 26, 1)} điểm. Hiện tại môn ${TEN_MON[monTrongTam]} đang còn thiếu ${thieuDiem} điểm. Hãy phân bổ lịch học các buổi tối trong tuần theo phương pháp 60-35-5 và ưu tiên môn kéo điểm.`;

  const phanTichCaNhan = monThieu.length > 0
    ? `Dựa trên khoảng cách điểm số, trọng tâm tuần này của ${ten} là bứt phá môn **${TEN_MON[monTrongTam]}** (cần bù thêm **${thieuDiem} điểm**).${ielts ? ` Với lợi thế có **${ielts}**, bạn được giải phóng giờ tự học môn Ngoại ngữ để tập trung 85% thời gian cho 2 môn còn lại.` : ""}`
    : `Điểm số hiện tại của bạn đã tiệm cận mốc điểm chuẩn. Lịch học tuần này tập trung vào làm đề bấm giờ và rèn tâm lý thi đấu thực chiến.`;

  const lamSachTenChuyenDe = (tenCd: string) => tenCd.replace(/^(Ôn|Luyện)\s*(chuyên đề)?\s*/i, "");
  const chuyenDeMon1 = NOI_DUNG_ON[monTrongTam]?.[0] ?? "Phương trình và bất phương trình";
  const chuyenDeMon2 = NOI_DUNG_ON[monPhu1]?.[0] ?? "Kiến thức trọng tâm";
  const chuyenDeMon3 = NOI_DUNG_ON[monPhu2]?.[0] ?? "Chuyên đề nền tảng";

  const danhSachBuoi: KeHoachAIBuoi[] = [
    {
      thu: "Thứ 2",
      mon: monTrongTam,
      tieuDe: `${TEN_MON_NGAN[monTrongTam]} – Ôn chuyên đề ${lamSachTenChuyenDe(chuyenDeMon1).toLowerCase()}`,
      phut: 90,
      mucUuTien: "cao",
      mucTieuBuoi: `Nắm chắc dạng bài then chốt của ${chuyenDeMon1} để ăn trọn điểm các câu 7,5 đến 8,5.`,
      chiTiet: `55' giải bài tập chuyên đề + 30' phân tích đáp án chi tiết + 5' ghi chú bẫy đề thi.`,
      cacBuoc: [
        { phut: 55, ten: "Làm bài tập vận dụng" },
        { phut: 30, ten: "Chữa chi tiết câu sai" },
        { phut: 5, ten: "Đúc kết kinh nghiệm & bẫy đề" },
      ],
      tieuChi: [
        `Hoàn thành tối thiểu 20 câu bài tập chuyên đề ${chuyenDeMon1}.`,
        "Chỉ ra được nguyên nhân sai của mọi câu không đạt (tính nhầm, đọc thiếu dữ kiện hoặc quên lý thuyết).",
        "Tự giải lại đúng 100% các câu vừa được chữa.",
      ],
      taiLieu: [
        { ten: `Sách giáo khoa và tài liệu chuyên đề ${TEN_MON[monTrongTam]}` },
        { ten: "Tuyển tập câu hỏi phân hóa đề thi thử các trường chuyên" },
      ],
      lyDo: `Môn ${TEN_MON[monTrongTam]} đang còn thiếu ${thieuDiem} điểm so với mục tiêu ${m?.lc.truong ?? "nguyện vọng"}. Bắt đầu tuần với môn kéo điểm tạo đà bứt phá rõ rệt.`,
    },
    {
      thu: "Thứ 3",
      mon: monPhu1,
      tieuDe: `${TEN_MON_NGAN[monPhu1]} – Ôn ${lamSachTenChuyenDe(chuyenDeMon2).toLowerCase()} & luyện đề mới`,
      phut: 75,
      mucUuTien: "vua",
      mucTieuBuoi: `Bấm giờ rèn tốc độ làm bài môn ${TEN_MON[monPhu1]} và độ chuẩn xác 30 câu đầu.`,
      chiTiet: `45' làm đề thi tính giờ + 25' đối chiếu đáp án và sửa câu sai + 5' tổng kết.`,
      cacBuoc: [
        { phut: 45, ten: "Bấm giờ làm đề" },
        { phut: 25, ten: "Chữa đề và sửa bài" },
        { phut: 5, ten: "Ghi nhận tiến độ" },
      ],
      tieuChi: [
        "Không dùng tài liệu trong thời gian bấm giờ.",
        "Đạt độ chính xác trên 90% ở các câu mức độ nhận biết và thông hiểu.",
      ],
      taiLieu: [{ ten: `Đề thi minh họa mới nhất môn ${TEN_MON[monPhu1]}` }],
      lyDo: `Duy trì phong độ môn ${TEN_MON[monPhu1]} để đảm bảo tổng điểm tổ hợp ${maToHop} không bị kéo xuống.`,
    },
    {
      thu: "Thứ 4",
      mon: monTrongTam,
      tieuDe: `${TEN_MON_NGAN[monTrongTam]} – Rèn phản xạ giải nhanh câu phân hóa`,
      phut: 90,
      mucUuTien: "cao",
      mucTieuBuoi: `Xử lý các bài toán mức vận dụng cao, rèn kỹ thuật bấm máy tính Casio và loại trừ đáp án nhiễu.`,
      chiTiet: `55' làm bài tập nâng cao + 30' phân tích phương pháp hiệu quả + 5' tổng kết.`,
      cacBuoc: [
        { phut: 55, ten: "Thực hành giải nhanh" },
        { phut: 30, ten: "Học kỹ thuật giải bài nhanh" },
        { phut: 5, ten: "Ghi chú công thức giải nhanh" },
      ],
      tieuChi: [
        "Nắm vững 2 kỹ thuật giải nhanh cho các câu phân hóa.",
        "Rút ngắn thời gian làm mỗi câu trắc nghiệm xuống dưới 2 phút.",
      ],
      taiLieu: [{ ten: `Sổ tay công thức và phương pháp giải nhanh ${TEN_MON[monTrongTam]}` }],
      lyDo: `Đây là buổi mấu chốt để kéo thêm ${thieuDiem} điểm môn ${TEN_MON[monTrongTam]}.`,
    },
    {
      thu: "Thứ 5",
      mon: monPhu2,
      tieuDe: `${TEN_MON_NGAN[monPhu2]} – Tổng ôn ${lamSachTenChuyenDe(chuyenDeMon3).toLowerCase()}`,
      phut: 75,
      mucUuTien: "vua",
      mucTieuBuoi: `Hệ thống hóa toàn bộ lý thuyết và giải các bài tập trọng tâm của ${chuyenDeMon3}.`,
      chiTiet: `45' ôn lý thuyết và làm bài + 25' chữa bài + 5' đúc kết.`,
      cacBuoc: [
        { phut: 45, ten: "Ôn lý thuyết & bài tập" },
        { phut: 25, ten: "Chữa câu hỏi bẫy" },
        { phut: 5, ten: "Ghi nhớ từ khóa" },
      ],
      tieuChi: [
        "Hoàn thành bảng tóm tắt kiến thức của chuyên đề.",
        "Không sai các câu hỏi lý thuyết đếm hoặc nhận định đúng sai.",
      ],
      taiLieu: [{ ten: `Sách giáo khoa ${TEN_MON[monPhu2]}` }],
      lyDo: `Giữ vững điểm số môn thứ ba giúp tạo đệm an toàn vững chắc cho tổng điểm xét tuyển.`,
    },
    {
      thu: "Thứ 6",
      mon: monTrongTam,
      tieuDe: `${TEN_MON_NGAN[monTrongTam]} – Rà soát sổ tay lỗi sai và bẫy đề`,
      phut: 60,
      mucUuTien: "cao",
      mucTieuBuoi: `Làm lại toàn bộ các câu hỏi đã sai trong tuần và các dạng bài còn lúng túng.`,
      chiTiet: `35' làm lại các câu từng sai + 25' củng cố lý thuyết liên quan.`,
      cacBuoc: [
        { phut: 35, ten: "Làm lại câu sai trong tuần" },
        { phut: 25, ten: "Củng cố lý thuyết" },
      ],
      tieuChi: [
        "100% các câu sai trước đó phải làm đúng khi làm lại.",
        "Giải thích được tại sao lần trước mình chọn đáp án sai.",
      ],
      taiLieu: [{ ten: "Sổ tay ghi chép lỗi sai cá nhân" }],
      lyDo: `Không lặp lại lỗi sai cũ là con đường nhanh nhất để tăng từ 0,5 đến 1,5 điểm trong thời gian ngắn.`,
    },
    {
      thu: "Thứ 7",
      mon: monTrongTam,
      tieuDe: `Thi thử bấm giờ tổng hợp tổ hợp ${maToHop}`,
      phut: 90,
      mucUuTien: "cao",
      mucTieuBuoi: `Mô phỏng áp lực thi thật, đo lường điểm số sau một tuần bứt phá.`,
      chiTiet: `60' làm đề trọn vẹn nghiêm túc + 30' chấm điểm và phân tích thang điểm đạt được.`,
      cacBuoc: [
        { phut: 60, ten: "Làm đề thi thử trọn vẹn" },
        { phut: 30, ten: "Chấm điểm và ghi nhận kết quả" },
      ],
      tieuChi: [
        "Tuân thủ nghiêm ngặt thời gian và quy chế thi như thi thật.",
        "Ghi nhận điểm số đạt được để cập nhật vào biểu đồ tiến độ học tập.",
      ],
      taiLieu: [{ ten: `Đề thi thử mới nhất năm học hiện tại` }],
      lyDo: `Đo lường sự tiến bộ thực tế để điều chỉnh kế hoạch học tập cho tuần tiếp theo.`,
    },
  ];

  return { promptGoiY, phanTichCaNhan, danhSachBuoi };
}

/** Chuyển danh sách buổi học AI thành ViecCanHoc chuẩn của hệ thống để áp dụng vào lịch */
export function chuyenDoiThanhViecHeThong(dsBuoi: KeHoachAIBuoi[], tuan: string): ViecCanHoc[] {
  return dsBuoi.map((b, idx) => ({
    id: `v-ai-${tuan}-${b.mon}-${idx}-${Date.now().toString(36)}`,
    tuan,
    mon: b.mon,
    tieuDe: b.tieuDe,
    chiTiet: b.chiTiet,
    phut: b.phut,
    mucUuTien: b.mucUuTien,
    lyDo: b.lyDo,
    tieuChi: b.tieuChi,
    taiLieu: b.taiLieu,
    mucTieuBuoi: b.mucTieuBuoi,
    cacBuoc: b.cacBuoc,
  }));
}

"""Phân nhóm ngành cho dữ liệu chương trình đào tạo, dùng chung cho `xuat-du-lieu-that.py` và lần phân lại `python scripts/phan_nhom_nganh.py`.

Vì sao viết lại: bản cũ phân theo từ khóa trên cả chuỗi tên, nên nhiều ngành bị xếp sai
("Hóa học (Chương trình tăng cường tiếng Anh)" vào Ngôn ngữ, "Sinh học" và "Văn học" cùng chung một nhóm với kỹ sư Việt-Pháp,
"Sư phạm Tin học" vào CNTT, "Chăn nuôi thú y" vào Y Dược, "Kỹ thuật cơ khí (Thiết kế...)" vào Thiết kế).
Cách làm mới:
  1. Làm sạch tên: bỏ tiền tố (CT chuẩn, Chuẩn QT, CT ĐHNNQT, Đại học chính quy...), phần trong ngoặc (chương trình tăng cường tiếng Anh, CLC...),
     phần cơ sở (CS Sóc Trăng) và phần sau "chuyên ngành".
  2. Xét theo thứ tự ưu tiên các luật có chủ ý (ngành nghề đào tạo giáo viên đứng trước ngành môn học, tài chính trước công nghệ...).
  3. Xét tên chính trước; không khớp thì xét cả tên; vẫn không khớp thì xếp "Xã hội" (nhân văn) và in ra để người rà.
Nhóm trả về phải khớp `PHAN_NHOM_NGANH` ở src/features/khoi-dau/lua-chon.ts.
"""
import json
import re
import sys
import unicodedata
from pathlib import Path

TIEN_TO = re.compile(r"^\s*(\(\d+\)\s*|ct\s*chuẩn\s*-\s*|ct\s*tc\s*|ct\s*đhnnqt\s*|chuẩn\s*qt\s*-\s*|đại học chính quy\s*-\s*|chương trình\s+|ngành\s+)+", re.I)

# (nhóm, mẫu) theo thứ tự ưu tiên. Mẫu chạy trên tên đã làm sạch, chữ thường.
LUAT = [
    ("Sư phạm", r"^(sư phạm|(cao đẳng |đào tạo ngành |hỗ trợ )?giáo dục|gd (mầm non|tiểu học)|khoa học giáo dục|quản lý giáo dục|đào tạo giáo viên|tâm lý học giáo dục|công nghệ giáo dục)"),
    ("Thể thao", r"huấn luyện thể thao|thể dục thể thao|thể thao|quản lý thể dục"),
    ("Thiết kế", r"nội thất|thiết kế (thời trang|đồ họa|mỹ thuật|công nghiệp|game|trò chơi|sản phẩm|hoạt hình|truyền thông|đa phương tiện|nội|số)|mỹ thuật|đồ họa|thời trang|hội họa|điêu khắc|điện ảnh|nhiếp ảnh|đạo diễn|diễn viên|âm nhạc|sân khấu|hoạt hình|công nghiệp văn hóa|phát triển game|thiết kế và phát triển game|thanh nhạc"),
    ("Kiến trúc", r"kiến trúc|quy hoạch (vùng|đô thị)|đô thị học"),
    ("Luật", r"(^|\b)luật\b|^thanh tra"),
    ("Y Dược", r"^(y khoa|dược|hóa dược|răng|y học cổ truyền|y học|bác sĩ)|dược học|y khoa|y học cổ truyền|vật lý y khoa|kỹ thuật dược"),
    ("Điều dưỡng", r"điều dưỡng|hộ sinh|xét nghiệm|y tế công cộng|dinh dưỡng|hình ảnh y học|phục hồi chức năng|y học dự phòng|khúc xạ|vật lý trị liệu|kỹ thuật y|an toàn thực phẩm|quản lý bệnh viện|công nghệ kỹ thuật y"),
    ("Nông Lâm", r"nông|lâm|thủy sản|thuỷ sản|chăn nuôi|thú y|trồng trọt|cây trồng|bảo vệ thực vật|công nghệ sinh học|công nghệ thực phẩm|chế biến|sau thu hoạch|khoa học đất|thủy lợi nông|bảo quản|nuôi trồng|khai thác thủy"),
    ("CNTT", r"mạng máy tính|truyền thông dữ liệu"),
    ("Báo chí", r"báo chí|xuất bản|biên tập|quay phim|truyền hình|truyền thông đại chúng|phát thanh|thông tin đối ngoại"),
    ("Marketing", r"marketing|thương mại điện tử|truyền thông|quan hệ công chúng|quảng cáo|kinh doanh số"),
    ("Du lịch", r"du lịch|khách sạn|nhà hàng|lữ hành|ẩm thực|tổ chức sự kiện|dịch vụ ăn uống"),
    ("Logistics", r"hoạt động bay|logistics|chuỗi cung ứng|vận tải|vận hành khai thác|hàng hải|điều khiển tàu|khai thác tàu"),
    ("Tài chính", r"thẩm định giá|tài chính|ngân hàng|kế toán|kiểm toán|bảo hiểm|đầu tư|thuế|chứng khoán|công nghệ tài chính|định phí|quản trị rủi ro|hải quan"),
    ("Ngôn ngữ", r"^ngôn ngữ|ngôn ngữ (anh|trung|nhật|hàn|pháp|đức|nga|tây ban nha|ả rập|italia|bồ đào nha|thái|việt)|biên phiên dịch|phiên dịch|tiếng (anh|trung|nhật|hàn|pháp|đức|nga)|đông phương học|hàn quốc học|nhật bản học|trung quốc học|thái lan học|đông nam á học|ả rập học|văn hóa và ngôn ngữ"),
    ("CNTT", r"công nghệ thông tin|khoa học máy tính|kỹ thuật phần mềm|công nghệ phần mềm|an toàn thông tin|an ninh mạng|hệ thống thông tin|khoa học dữ liệu|trí tuệ nhân tạo|mạng máy tính|truyền thông dữ liệu|tin học|học máy|kỹ thuật máy tính|công nghệ kỹ thuật máy tính|điện toán|big data|phân tích dữ liệu|internet vạn vật|iot|an ninh thông tin|công nghệ đa phương tiện"),
    ("Xây dựng", r"xây dựng|cầu đường|giao thông|quản lý đô thị|trắc địa|địa kỹ thuật|cấp thoát nước|công trình|hạ tầng|địa chính|bản đồ|thủy lợi|thủy điện"),
    ("Kinh tế", r"quản lý thị trường|kinh tế|quản trị|kinh doanh|thương mại|quản lý công nghiệp|nhân lực|khởi nghiệp|ngoại thương|bất động sản|kinh doanh quốc tế|quản lý dự án|quản lý (chất lượng|vận hành)"),
    ("Kỹ thuật", r"kỹ sư|kỹ thuật|công nghệ|cơ khí|điện|tự động|ô tô|cơ điện tử|vật liệu|dệt|may|robot|hàng không|năng lượng|mỏ|dầu khí|điều khiển|viễn thông|bán dẫn|vi mạch|luyện kim|nhiệt|hạt nhân|công nghiệp|máy|hóa học kỹ thuật|địa vật lý|an toàn lao động|in và truyền thông|bảo trì|chế tạo"),
    ("Khoa học tự nhiên", r"thủy văn"),
    ("Xã hội", r"chính trị|lịch sử|triết học|văn học|xã hội|tâm lý|quan hệ quốc tế|quốc tế học|việt nam học|văn hóa|nhân học|quản lý (công|nhà nước|văn hóa|thông tin)|lưu trữ|tôn giáo|hán nôm|chính sách|nhân văn|giới và phát triển|phát triển quốc tế|thư viện|hoa kỳ học|nghệ thuật học|di sản|quan hệ lao động|khoa học quản lý|tiếng việt"),
    ("Khoa học tự nhiên", r"khoa học y sinh|thủy văn|thông tin địa không gian|biến đổi khí hậu|quản lý biển|^(toán|vật lý|hóa học|hoá học|sinh học|thống kê|khoa học (vật liệu|môi trường|trái đất|tự nhiên)|địa lý tự nhiên|địa chất|khí tượng|hải dương|quản lý (tài nguyên|đất đai)|khoa học đất|toán tin|vật lý học|địa lý học)|môi trường|tài nguyên"),
    ("Xã hội", r"."),
]
LUAT = [(n, re.compile(m)) for n, m in LUAT]


# Lỗi chính tả do trích PDF (dấu đặt nhầm chữ, dính chữ, mất ký tự) sửa tại nguồn để không hiện ra cho học sinh.
SUA_TEN = [
    ("Công nghệkỹthuâṭ", "Công nghệ kỹ thuật"), ("thuâṭ", "thuật"), ("Thuâṭ", "Thuật"), ("điêṇ", "điện"), ("Điêṇ", "Điện"),
    ("nhiêṭ", "nhiệt"), ("Nhiêṭ", "Nhiệt"), ("dưṇ g", "dựng"), ("dưṇg", "dựng"), ("UAV v�� Robot", "UAV và Robot"),
]
TEN_CAT_CUT = {"Kỹ thuật cơ khí động": "Kỹ thuật cơ khí động lực"}


def sua_ten(ten: str) -> str:
    t = unicodedata.normalize("NFC", ten).strip()
    for a, b in SUA_TEN:
        t = t.replace(a, b)
    return TEN_CAT_CUT.get(t, t)


# Từ 1/7/2025 còn 34 tỉnh thành (Nghị quyết 202/2025/QH15). Dữ liệu trường còn tên tỉnh cũ: đổi sang tên mới để khớp nơi học sinh chọn.
TINH_MOI = {
    "Hà Giang": "Tuyên Quang", "Yên Bái": "Lào Cai", "Bắc Kạn": "Thái Nguyên", "Vĩnh Phúc": "Phú Thọ", "Hòa Bình": "Phú Thọ",
    "Bắc Giang": "Bắc Ninh", "Hải Dương": "Hải Phòng", "Thái Bình": "Hưng Yên", "Hà Nam": "Ninh Bình", "Nam Định": "Ninh Bình",
    "Quảng Bình": "Quảng Trị", "Quảng Nam": "Đà Nẵng", "Kon Tum": "Quảng Ngãi", "Bình Định": "Gia Lai", "Ninh Thuận": "Khánh Hòa",
    "Đắk Nông": "Lâm Đồng", "Bình Thuận": "Lâm Đồng", "Phú Yên": "Đắk Lắk", "Bà Rịa - Vũng Tàu": "TP.HCM", "Bà Rịa-Vũng Tàu": "TP.HCM",
    "Bình Dương": "TP.HCM", "Bình Phước": "Đồng Nai", "Long An": "Tây Ninh", "Bến Tre": "Vĩnh Long", "Trà Vinh": "Vĩnh Long",
    "Tiền Giang": "Đồng Tháp", "Hậu Giang": "Cần Thơ", "Sóc Trăng": "Cần Thơ", "Kiên Giang": "An Giang", "Bạc Liêu": "Cà Mau",
}


# Bản ghi gán nhầm trường (ngành không thể thuộc trường đó: Giáo dục Mầm non ở Học viện Ngân hàng, Khoa học giáo dục ở ĐH Thương mại): bỏ.
TRUONG_GAN_NHAM = {"D61", "D64"}
# Tên trường ghi trùng với trường khác (QHQ là Trường Quản trị và Kinh doanh, không phải ĐH Kinh tế - ĐHQGHN như QHE).
DOI_TEN_TRUONG = {"QHQ": "Trường Quản trị và Kinh doanh - ĐHQGHN"}


def tinh_moi(tinh: str) -> str:
    return TINH_MOI.get(unicodedata.normalize("NFC", tinh).strip(), unicodedata.normalize("NFC", tinh).strip())


def chuan_chu(ten: str) -> str:
    """NFC, chữ thường, thống nhất cách bỏ dấu cũ/mới (lí/lý, hoá/hóa, thuỷ/thủy)."""
    t = unicodedata.normalize("NFC", ten).lower().strip()
    for a, b in (("hoá", "hóa"), ("thuỷ", "thủy"), ("quí", "quý"), ("tàichính-ngânhàng", "tài chính - ngân hàng"), ("logictics", "logistics"), ("kĩ", "kỹ"), ("logistic ", "logistics ")):
        t = t.replace(a, b)
    # "lí" (cách viết cũ) thành "lý": vật lí, địa lí, tâm lí, quản lí
    return re.sub("lí", "lý", t)


# Dòng "ngành" thật ra là mảnh rác khi trích từ PDF (điểm của nữ, "sử dụng kết quả thi...", "tổng chỉ tiêu", mã ngành trơ trọi...).
RAC = re.compile(r"^(kết hợp$|kết quả thi|nữ\s*:|nam\s*:|tổng chỉ tiêu|sử dụng k|đhqg|\d{6,}|khai thác và quản lý$|quản lý$|thông tin$|nghiên cứu phát triển$)|^\W*$")


def la_rac(ten: str) -> bool:
    t = chuan_chu(ten)
    return len(t) < 4 or bool(RAC.search(t))


def lam_sach(ten: str) -> tuple[str, str]:
    """Trả về (tên chính, tên đầy đủ đã bỏ ngoặc), chữ thường."""
    t = chuan_chu(ten)
    t = TIEN_TO.sub("", t)
    t = re.sub(r"\(.*?\)", " ", t)            # bỏ phần trong ngoặc
    t = re.sub(r"\([^)]*$", " ", t)            # ngoặc bị cắt dở
    t = re.sub(r"[-–]\s*(cs|cơ sở|phân hiệu)\s.*$", " ", t)
    t = re.sub(r"_?\s*chuẩn quốc tế|_clc|clc\b|\bctclc\b|dạy bằng ta", " ", t)
    t = re.sub(r"\s+", " ", t).strip(" -_/;,.")
    day_du = t
    # tên chính: bỏ phần sau "chuyên ngành" và lấy đoạn đầu trước " - " hoặc "/" hoặc ";"
    chinh = re.split(r",\s*chuyên ngành|\bchuyên ngành\b|\s-\s|/|;", t)[0].strip(" -_/;,.")
    return chinh or day_du, day_du


# Tên rộng chỉ là "ngành mẹ" ghép trước tên ngành thật ("Nhân văn - Ngôn ngữ Anh", "Kĩ thuật - Kỹ thuật hóa học"): bỏ qua, xét đoạn sau.
CHUNG = {"nhân văn", "khoa học sự sống", "kỹ thuật", "công nghệ", "nghệ thuật", "ctđt nghệ thuật và thiết kế", "sức khỏe", "khoa học xã hội và hành vi", "kinh doanh và quản lý", "khoa học tự nhiên", "khoa học"}


def _thu(van: str):
    for nhom, mau in LUAT:
        if mau.pattern == ".":
            return None
        if mau.search(van):
            return nhom
    return None


def phan_nhom(ten: str) -> str:
    chinh, day_du = lam_sach(ten)
    cac_doan = [d.strip(" -_/;,.") for d in re.split(r",\s*chuyên ngành|chuyên ngành|\s-\s|/|;", day_du)]
    for doan in cac_doan:
        if len(doan) < 3 or doan in CHUNG:
            continue
        nhom = _thu(doan)
        if nhom:
            return nhom
    return _thu(day_du) or "Xã hội"


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    duong = Path(__file__).resolve().parent.parent / "src" / "data" / "du-lieu-that.json"
    ds = json.loads(duong.read_text(encoding="utf-8"))
    rac = [x for x in ds if la_rac(x["nganh"]) or x["ma"] in TRUONG_GAN_NHAM]
    ds = [x for x in ds if not (la_rac(x["nganh"]) or x["ma"] in TRUONG_GAN_NHAM)]
    doi = 0
    thong_ke: dict[str, int] = {}
    xa_hoi: set[str] = set()
    for x in ds:
        x["nganh"] = sua_ten(x["nganh"])
        x["truong"] = DOI_TEN_TRUONG.get(x["ma"], x["truong"])
        x["tinh"] = tinh_moi(x["tinh"])
        moi = phan_nhom(x["nganh"])
        if moi != x["nhom"]:
            doi += 1
            x["nhom"] = moi
        thong_ke[moi] = thong_ke.get(moi, 0) + 1
        if moi == "Xã hội":
            xa_hoi.add(lam_sach(x["nganh"])[0])
    if "--ghi" in sys.argv:
        duong.write_text(json.dumps(ds, ensure_ascii=False), encoding="utf-8")
        # Các tệp phụ khóa theo mã chương trình hoặc mã trường: bỏ khóa không còn trong dữ liệu chính (không để lại dữ liệu mồ côi).
        ids, ma = {x["id"] for x in ds}, {x["ma"] for x in ds}
        for ten, tap in (("chuong-trinh", ids), ("hoc-phi", ids), ("viec-lam", ids), ("nguon-nam", ids), ("nguon-nam-thu-cap", ids),
                         ("de-an-truong", ma), ("de-an-truong-thu-cap", ma), ("trang-nganh-truong", ma)):
            f = duong.parent / f"{ten}.json"
            j = json.loads(f.read_text(encoding="utf-8"))
            bo = [k for k in j if k not in tap]
            for k in bo:
                del j[k]
            if bo:
                f.write_text(json.dumps(j, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
                print(f"  {ten}.json: bỏ {len(bo)} khóa mồ côi")
    sys.stdout.reconfigure(encoding="utf-8")
    print(f"bỏ {len(rac)} dòng rác:", [x["nganh"] for x in rac])
    print(f"đổi nhóm {doi}/{len(ds)} chương trình")
    for k, v in sorted(thong_ke.items(), key=lambda kv: -kv[1]):
        print(f"  {k}: {v}")
    print(f"tên rơi vào 'Xã hội' ({len(xa_hoi)} tên khác nhau), để rà:")
    for t in sorted(xa_hoi)[:400]:
        print("   ", t)


if __name__ == "__main__":
    main()

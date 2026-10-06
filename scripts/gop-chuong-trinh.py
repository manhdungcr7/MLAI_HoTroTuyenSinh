"""Gộp kết quả các lượt tìm trang ngành thành src/data/chuong-trinh.json, và lọc chặt: chỉ giữ trang mà tiêu đề CHÍNH LÀ
tên ngành (sau khi bỏ tiền tố "Ngành", "Chương trình đào tạo", và phần tên trang sau dấu | hoặc -), không phải bài tin tức,
quyết định hay trang điểm chuẩn. Lượt sitemap ưu tiên hơn lượt quét liên kết."""
import glob, hashlib, json, re, unicodedata
from pathlib import Path

D = Path(__file__).resolve().parents[1] / "src" / "data"
GOC = Path(__file__).resolve().parents[2] / "nguyen-vong"


def chuan(s):
    s = unicodedata.normalize("NFD", str(s).lower().replace("đ", "d"))
    return re.sub(r"[^a-z0-9]+", " ", "".join(c for c in s if unicodedata.category(c) != "Mn")).strip()


TIEN_TO = re.compile(r"^(chuong trinh dao tao trinh do dai hoc nganh|chuong trinh dao tao cu nhan|chuong trinh dao tao nganh|chuong trinh dao tao|nganh dao tao|dai hoc chinh quy|dai hoc|cu nhan|nganh|chuyen nganh|ky su) ")
BO = ("tin-tuc", "thong-bao", "/news", "tuyen-dung", "hoi-nghi", "hoi-thao", "khai-giang", "ky-ket", "mo-nganh", "diem-chuan", "quyet-dinh", "tin-hoat-dong", "/su-kien", "hoc-bong")
BO_CHAT = tuple(x for x in BO if x not in ("quyet-dinh", "thong-bao"))  # trang công bố chương trình đôi khi nằm dưới đường dẫn này
CHUNG = {"ket hop", "khac", "chuong trinh tien tien", "chat luong cao", "dai hoc chinh quy", "quoc te hoc"}  # tên chung / dễ trùng, không tự nhận


def tieu_de_sach(td):
    dau = re.split(r"\s+[|–—]\s+|\s+-\s+", td.strip())[0]
    c = chuan(dau)
    for _ in range(3):
        c = TIEN_TO.sub("", c).strip()
    return c


catalog = json.loads((GOC / "frontend/src/data/programs-catalog.json").read_text(encoding="utf-8"))
ten = {}
for r in catalog:
    pid = r["schoolCode"].lower() + "-" + hashlib.sha1(r["programKey"].encode("utf-8")).hexdigest()[:8]
    t = r["majorName"]
    ten[pid] = chuan(t.split(" - ")[-1] if " - " in t else t)

tho = {}
for mau, bo_sm in (("chuong-trinh.*of*.json", True), ("chuong-trinh.sm*.json", False)):
    for f in sorted(glob.glob(str(D / mau))):
        if bo_sm and ".sm." in f:
            continue
        tho.update(json.loads(Path(f).read_text(encoding="utf-8")))
ket, bi_loai = {}, 0
for pid, v in tho.items():
    t = ten.get(pid, "")
    td = tieu_de_sach(v["tieuDe"])
    td_day_du = chuan(re.split(r"\s+[|–—]\s+|\s+-\s+", v["tieuDe"].strip())[0])  # tiêu đề chưa bỏ tiền tố
    ten_goc = TIEN_TO.sub("", t).strip()
    # Ngoài trường hợp tiêu đề CHÍNH LÀ tên ngành, nhận tiêu đề kiểu "Chuẩn đầu ra và chương trình đào tạo ... ngành X" hay
    # "Thông tin tuyển sinh đại học chính quy ngành X" (trang công bố chương trình / thông tin riêng của ngành), loại bài tin và bậc sau đại học.
    kieu_cong_bo = (td_day_du.endswith(" " + ten_goc) and re.search(r"chuong trinh dao tao|thong tin tuyen sinh", td_day_du)
                    and not re.search(r"hoi thao|toa dam|cong gioi|giao luu|khai giang|mo nganh|ky niem|nghien cuu|thac si|tien si|lien thong|van bang|lien ket|doi thoai|tap huan|tham dinh|khao sat|de an", td_day_du))
    ok = (t and t not in CHUNG and len(t) >= 6 and not any(b in v["url"].lower() for b in BO_CHAT)
          and (td == ten_goc or kieu_cong_bo))
    if ok:
        ket[pid] = v
    else:
        bi_loai += 1
(D / "chuong-trinh.json").write_text(json.dumps(ket, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print(len(ket), "giữ;", bi_loai, "loại")

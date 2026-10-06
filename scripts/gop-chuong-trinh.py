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
    ok = (t and t not in CHUNG and len(t) >= 6 and not any(b in v["url"].lower() for b in BO)
          and tieu_de_sach(v["tieuDe"]) == TIEN_TO.sub("", t).strip())
    if ok:
        ket[pid] = v
    else:
        bi_loai += 1
(D / "chuong-trinh.json").write_text(json.dumps(ket, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print(len(ket), "giữ;", bi_loai, "loại")

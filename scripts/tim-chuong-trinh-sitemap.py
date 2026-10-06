"""Lượt 2 tìm trang ngành: đọc sitemap của website trường, ghép đường dẫn có tên ngành, rồi mở từng trang để xác minh.

Một trang được nhận cho ngành khi: mở được (200), tiêu đề hoặc thẻ h1 chứa đúng tên ngành, và nội dung có dấu hiệu là
trang về chương trình/ngành đào tạo (chữ "chương trình đào tạo", "mã ngành", "tín chỉ", "khung chương trình"...).
Chạy: PHAN=i/n python scripts/tim-chuong-trinh-sitemap.py [mã trường ...]    -> src/data/chuong-trinh.sm.<phan>.json
"""
import hashlib, json, os, re, sys, time, unicodedata
from collections import defaultdict
from pathlib import Path
from urllib.parse import urlparse

import requests
import urllib3

urllib3.disable_warnings()
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
GOC = ROOT.parent / "nguyen-vong"
PHAN = os.environ.get("PHAN", "")
HAU = f".{PHAN.replace('/', 'of')}" if PHAN else ""
RA = ROOT / "src" / "data" / f"chuong-trinh.sm{HAU}.json"
UA = {"User-Agent": "Mozilla/5.0 (compatible; NguyenVongAI-research/1.0)"}
DAU_HIEU = re.compile(r"ch[uư]ơng tr[iì]nh đ[aà]o t[aạ]o|m[aã] ng[aà]nh|t[ií]n ch[iỉ]|khung ch[uư]ơng tr[iì]nh|chu[aẩ]n đ[aầ]u ra", re.I)
BO_QUA_DUOI = (".jpg", ".png", ".pdf", ".docx", ".doc", ".xlsx", ".zip", ".jpeg", ".gif")


def chuan(s: str) -> str:
    s = unicodedata.normalize("NFD", str(s).lower().replace("đ", "d"))
    return re.sub(r"[^a-z0-9]+", " ", "".join(c for c in s if unicodedata.category(c) != "Mn")).strip()


TIEN_TO = re.compile(r"^(chuong trinh dao tao nganh|chuong trinh dao tao|nganh dao tao|nganh|chuyen nganh|dai hoc chinh quy nganh) ")
bo_tien_to = lambda c: TIEN_TO.sub("", c).strip()


def lay(url, s, tho=False):
    try:
        try:
            r = s.get(url, headers=UA, timeout=15, allow_redirects=True)
        except requests.exceptions.SSLError:
            r = s.get(url, headers=UA, timeout=15, allow_redirects=True, verify=False)
        if r.status_code == 200 and (tho or ("text/html" in r.headers.get("content-type", "") and len(r.content) < 3_000_000)):
            return r
    except Exception:
        pass
    return None


def doc_sitemap(host: str, s) -> list[str]:
    goc = f"https://{host}"
    ung = [f"{goc}/sitemap.xml", f"{goc}/sitemap_index.xml", f"{goc}/wp-sitemap.xml", f"{goc}/sitemap/sitemap.xml"]
    rb = lay(f"{goc}/robots.txt", s, tho=True)
    if rb:
        ung = re.findall(r"(?im)^sitemap:\s*(\S+)", rb.text) + ung
    da, ra, hang = set(), [], list(dict.fromkeys(ung))
    while hang and len(da) < 60 and len(ra) < 60000:
        u = hang.pop(0)
        if u in da:
            continue
        da.add(u)
        r = lay(u, s, tho=True)
        if not r or "<" not in r.text[:200]:
            continue
        locs = re.findall(r"<loc>\s*([^<\s]+)\s*</loc>", r.text)
        for x in locs:
            if x.lower().endswith(".xml") or "sitemap" in x.lower():
                hang.append(x)
            else:
                ra.append(x)
        time.sleep(0.1)
    return ra


def slug(c: str) -> str:
    return c.replace(" ", "-")


def main():
    catalog = json.loads((GOC / "frontend/src/data/programs-catalog.json").read_text(encoding="utf-8"))
    domains = json.loads((GOC / "data/raw/school_domains_guess.json").read_text(encoding="utf-8"))
    domains.update(json.loads((GOC / "data/raw/school_domains_manual.json").read_text(encoding="utf-8")))  # tên miền tra tay, đã mở thử
    chon = set(sys.argv[1:])
    i_phan, n_phan = (int(x) for x in PHAN.split("/")) if PHAN else (0, 1)
    theo_truong = defaultdict(dict)
    for r in catalog:
        pid = r["schoolCode"].lower() + "-" + hashlib.sha1(r["programKey"].encode("utf-8")).hexdigest()[:8]
        ten = r["majorName"]
        theo_truong[r["schoolCode"]][pid] = chuan(ten.split(" - ")[-1] if " - " in ten else ten)
    ket = json.loads(RA.read_text(encoding="utf-8")) if RA.exists() else {}
    tong_bc = {}
    for k, (ma, tens) in enumerate(sorted(theo_truong.items())):
        if k % n_phan != i_phan or (chon and ma not in chon):
            continue
        hosts = [h for h, _ in domains.get(ma, []) if not h.startswith(("thisinh.", "ts-hn.", "ctsv.", "dtlt."))]
        if not hosts:
            continue
        s = requests.Session()
        urls = []
        for h in hosts[:3]:
            urls += [(h, u) for u in doc_sitemap(h, s)]
        urls = [(h, u) for h, u in dict.fromkeys(urls) if not u.lower().endswith(BO_QUA_DUOI)]
        theo_ten = defaultdict(list)
        for pid, t in tens.items():
            theo_ten[t].append(pid)
        # ghép theo đường dẫn: tên ngành (dạng gạch nối) phải là một đoạn nguyên vẹn của đường dẫn
        ung_vien = defaultdict(list)
        for h, u in urls:
            duong = chuan(urlparse(u).path.replace("/", " ").replace("-", " ").replace("_", " "))
            goi_y = bool(re.search(r"nganh|chuong trinh|dao tao|ctdt|khung", duong))
            for t in theo_ten:
                if len(t) >= 6 and re.search(rf"(^| ){re.escape(t)}( |$)", duong):
                    ung_vien[t].append((0 if goi_y else 1, len(u), u))
        so_ok = 0
        for t, ds in ung_vien.items():
            for _, _, u in sorted(ds)[:4]:
                r = lay(u, s)
                time.sleep(0.12)
                if not r:
                    continue
                h = BeautifulSoup(r.text, "html.parser")
                td = (h.title.string or "").strip() if h.title else ""
                h1 = h.find("h1").get_text(" ") if h.find("h1") else ""
                van = bo_tien_to(chuan(td)) + " | " + bo_tien_to(chuan(h1))
                if (t in van) and DAU_HIEU.search(h.get_text(" ")[:20000]):
                    for pid in theo_ten[t]:
                        ket[pid] = {"url": r.url, "tieuDe": (h1.strip() or td)[:120]}
                    so_ok += 1
                    break
        tong_bc[ma] = (so_ok, len(tens), len(urls))
        print(ma, f"{so_ok}/{len(tens)} ngành có trang; {len(urls)} URL trong sitemap", flush=True)
        RA.write_text(json.dumps(ket, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("xong", len(ket))


main()

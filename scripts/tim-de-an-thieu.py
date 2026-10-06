"""Tìm đề án PDF chính thức trên website của các trường chỉ có nguồn thứ cấp (tuyensinh247), rồi đối chiếu điểm chuẩn.

1. Tên miền: school_domains_manual.json (+ bổ sung trong EXTRA bên dưới, đã mở thử).
2. Quét trang chủ, sitemap và vài lớp liên kết để tìm file .pdf có chữ "đề án / tuyển sinh" và năm 2024–2026.
3. Tải về data/raw/deans2/<mã>/ (thư mục nguyen-vong), bỏ file không có chữ "tuyển sinh" ở 3 trang đầu.
4. Với mỗi chương trình và năm có điểm: tìm trang PDF có CẢ tên ngành lẫn đúng con số điểm. Chỉ ghi khi tìm thấy.
Ghi: src/data/nguon-nam-bo-sung.json  {id: [{nam, loai:"deAn", url, tai, trang}]}  và src/data/de-an-truong-bo-sung.json {mã: {docs:[...]}}
Chạy: PHAN=i/n python scripts/tim-de-an-thieu.py [mã trường ...]
"""
import hashlib, json, os, re, sys, time, unicodedata
from collections import defaultdict, deque
from pathlib import Path
from urllib.parse import urljoin, urldefrag, urlparse

import fitz
import requests
import urllib3
from bs4 import BeautifulSoup

urllib3.disable_warnings()
ROOT = Path(__file__).resolve().parents[1]
GOC = ROOT.parent / "nguyen-vong"
PHAN = os.environ.get("PHAN", "")
HAU = f".{PHAN.replace('/', 'of')}" if PHAN else ""
RA = ROOT / "src" / "data" / f"nguon-nam-bo-sung{HAU}.json"
RA_DOC = ROOT / "src" / "data" / f"de-an-truong-bo-sung{HAU}.json"
UA = {"User-Agent": "Mozilla/5.0 (compatible; NguyenVongAI-research/1.0)"}
EXTRA = {"TCT": ["ctu.edu.vn", "tuyensinh.ctu.edu.vn"], "PKA": ["phenikaa-uni.edu.vn", "tuyensinh.phenikaa-uni.edu.vn"], "SPH": ["hnue.edu.vn", "tuyensinh.hnue.edu.vn"],
         "DCT": ["huit.edu.vn", "ts.huit.edu.vn"], "NTH": ["ftu.edu.vn", "tuyensinh.ftu.edu.vn"], "QHX": ["ussh.vnu.edu.vn"], "HQT": ["dav.edu.vn"], "QHE": ["ueb.vnu.edu.vn"],
         "DKH": ["hup.edu.vn"], "DBH": ["bhiu.edu.vn"]}
TU_KHOA = re.compile(r"đề án|de-an|dean|de_an|tuyển sinh|tuyen-sinh|tuyensinh|ts20|thong-tin-ts", re.I)
NAM = re.compile(r"20(2[3-6])")


def chuan(s):
    s = unicodedata.normalize("NFD", str(s).lower().replace("đ", "d"))
    return re.sub(r"[^a-z0-9]+", " ", "".join(c for c in s if unicodedata.category(c) != "Mn")).strip()


def goc_mien(h):
    p = h.lower().split(".")
    return ".".join(p[-3:]) if len(p) >= 3 and p[-2] in ("edu", "com", "org", "gov") else ".".join(p[-2:])


def lay(url, s, tho=False, gioi_han=3_000_000):
    try:
        try:
            r = s.get(url, headers=UA, timeout=15, allow_redirects=True)
        except requests.exceptions.SSLError:
            r = s.get(url, headers=UA, timeout=15, allow_redirects=True, verify=False)
        if r.status_code == 200 and (tho or ("text/html" in r.headers.get("content-type", "") and len(r.content) < gioi_han)):
            return r
    except Exception:
        pass
    return None


def tim_pdf(hosts):
    s = requests.Session()
    goc = {goc_mien(h) for h in hosts}
    hang, da, pdf = deque((f"https://{h}/", 0) for h in hosts[:2]), set(), {}
    # sitemap
    for h in hosts[:2]:
        for sm in (f"https://{h}/sitemap.xml", f"https://{h}/sitemap_index.xml", f"https://{h}/wp-sitemap.xml"):
            r = lay(sm, s, tho=True)
            if r:
                for u in re.findall(r"<loc>\s*([^<\s]+)\s*</loc>", r.text)[:4000]:
                    if u.lower().endswith(".pdf") and TU_KHOA.search(u):
                        pdf[u] = u
                    elif TU_KHOA.search(u) and not u.lower().endswith((".xml", ".jpg", ".png")):
                        hang.append((u, 1))
    n = 0
    while hang and n < 70:
        url, sau = hang.popleft()
        url = urldefrag(url)[0]
        if url in da:
            continue
        da.add(url)
        r = lay(url, s)
        if not r:
            continue
        n += 1
        h = BeautifulSoup(r.text, "html.parser")
        for a in h.find_all("a", href=True):
            href = urljoin(r.url, a["href"])
            chu = " ".join(a.get_text(" ").split())
            if urlparse(href).scheme not in ("http", "https"):
                continue
            if href.lower().split("?")[0].endswith(".pdf"):
                if TU_KHOA.search(chu + " " + href) and NAM.search(chu + " " + href):
                    pdf[href] = chu
            elif sau < 2 and goc_mien(urlparse(href).netloc) in goc and TU_KHOA.search(chu + " " + href):
                hang.append((href, sau + 1))
        time.sleep(0.12)
    return pdf, s


def tai_va_kiem_tra(url, chu, s, thu_muc, ten_truong):
    try:
        try:
            r = s.get(url, headers=UA, timeout=60, verify=True)
        except requests.exceptions.SSLError:
            r = s.get(url, headers=UA, timeout=60, verify=False)
        if r.status_code != 200 or not r.content[:5] == b"%PDF-" or len(r.content) > 60_000_000 or len(r.content) < 80_000:
            return None
    except Exception:
        return None
    ten = thu_muc / (hashlib.sha1(url.encode()).hexdigest()[:10] + ".pdf")
    thu_muc.mkdir(parents=True, exist_ok=True)
    ten.write_bytes(r.content)
    try:
        with fitz.open(ten) as d:
            dau = chuan(" ".join(d[i].get_text() for i in range(min(3, len(d)))))
            n = len(d)
    except Exception:
        return None
    if "tuyen sinh" not in dau or n < 3:
        return None
    nam = NAM.findall(chu + " " + url)
    nam = "20" + max(nam) if nam else None
    return ten, nam, n


def so_dang(x):
    a = f"{x:.2f}".rstrip("0").rstrip(".")
    b = f"{x:.2f}"
    return list({a, b, a.replace(".", ","), b.replace(".", ",")})


def main():
    catalog = json.loads((GOC / "frontend/src/data/programs-catalog.json").read_text(encoding="utf-8"))
    dm = json.loads((GOC / "data/raw/school_domains_manual.json").read_text(encoding="utf-8"))
    hosts = {k: [h for h, _ in v] for k, v in dm.items()}
    for k, v in EXTRA.items():
        hosts[k] = v
    chon = set(sys.argv[1:])
    i_p, n_p = (int(x) for x in PHAN.split("/")) if PHAN else (0, 1)
    theo = defaultdict(list)
    ten_truong = {}
    for r in catalog:
        if r["sourceTier"] == "aggregator_verified":
            theo[r["schoolCode"]].append(r)
            ten_truong[r["schoolCode"]] = r["schoolName"]
    ket = json.loads(RA.read_text(encoding="utf-8")) if RA.exists() else {}
    docs_ra = json.loads(RA_DOC.read_text(encoding="utf-8")) if RA_DOC.exists() else {}
    for k, (ma, progs) in enumerate(sorted(theo.items())):
        if k % n_p != i_p or (chon and ma not in chon) or ma not in hosts:
            continue
        pdfs, s = tim_pdf(hosts[ma])
        thu_muc = GOC / "data/raw/deans2" / ma
        dung = []
        for url, chu in list(pdfs.items())[:14]:
            x = tai_va_kiem_tra(url, chu, s, thu_muc, ten_truong[ma])
            if x:
                dung.append((url, *x))
        print(ma, f"{len(pdfs)} PDF ứng viên, {len(dung)} đề án hợp lệ", flush=True)
        if not dung:
            continue
        docs_ra[ma] = {"docs": sorted([{"nam": nam or "?", "url": url} for url, _, nam, _ in dung], key=lambda x: x["nam"], reverse=True)}
        # văn bản từng trang (chuẩn hóa giữ chữ số và dấu , .)
        trang = {}
        for url, tep, nam, n in dung:
            with fitz.open(tep) as d:
                trang[url] = [re.sub(r"[^a-z0-9.,%]+", " ", unicodedata.normalize("NFD", p.get_text().lower().replace("đ", "d")).encode("ascii", "ignore").decode()) for p in d]
        so_ok = 0
        for r in progs:
            pid = r["schoolCode"].lower() + "-" + hashlib.sha1(r["programKey"].encode("utf-8")).hexdigest()[:8]
            ten = chuan(r["majorName"].split(" - ")[-1] if " - " in r["majorName"] else r["majorName"])
            if len(ten) < 5:
                continue
            ds = []
            for nam_d, diem in r["cutoffs"].items():
                found = None
                for url, tep, nam, n in sorted(dung, key=lambda x: x[2] or "", reverse=True):
                    for i, t in enumerate(trang[url], 1):
                        if ten in t and any(f" {sd} " in f" {t} " for sd in so_dang(diem)):
                            found = {"nam": str(nam_d), "loai": "deAn", "url": url, "tai": nam or "", "trang": i}
                            break
                    if found:
                        break
                if found:
                    ds.append(found)
            if ds:
                ket[pid] = sorted(ds, key=lambda x: x["nam"], reverse=True)
                so_ok += 1
        print(ma, f"  {so_ok}/{len(progs)} chương trình đối chiếu được với đề án chính thức", flush=True)
        RA.write_text(json.dumps(ket, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        RA_DOC.write_text(json.dumps(docs_ra, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    RA.write_text(json.dumps(ket, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    RA_DOC.write_text(json.dumps(docs_ra, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("xong", len(ket))


main()

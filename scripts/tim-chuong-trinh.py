"""Tìm trang chương trình đào tạo của từng ngành trên website chính thức của trường.

Quy trình (không đoán, chỉ nhận khi có bằng chứng):
  1. Lấy tên miền của trường từ chính file đề án PDF (tên miền .edu.vn xuất hiện nhiều nhất).
  2. Quét trang chủ và 2 lớp liên kết cùng tên miền gốc, ưu tiên liên kết có từ khóa
     "chương trình đào tạo / khung chương trình / ngành đào tạo / ctdt".
  3. Một trang được gán cho ngành khi: trả về 200, và tên ngành xuất hiện trong chữ của liên kết dẫn tới trang
     HOẶC trong tiêu đề trang, và trang có từ khóa chương trình đào tạo.
Chạy từ thư mục team-repo:  python scripts/tim-chuong-trinh.py [mã trường ...]
Ghi: src/data/chuong-trinh.json  {idChươngTrình: {url, tieuDe}}  và báo cáo scripts/chuong-trinh-bao-cao.json
"""
import hashlib, json, re, sys, time, unicodedata
from collections import defaultdict, deque
from pathlib import Path
from urllib.parse import urljoin, urldefrag, urlparse

import requests
import urllib3

urllib3.disable_warnings()
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
GOC = ROOT.parent / "nguyen-vong"
import os
PHAN = os.environ.get("PHAN", "")  # "i/n": chạy song song n tiến trình, mỗi tiến trình ghi file riêng, gộp bằng gop-chuong-trinh
HAU = f".{PHAN.replace('/', 'of')}" if PHAN else ""
RA = ROOT / "src" / "data" / f"chuong-trinh{HAU}.json"
BAO_CAO = ROOT / "scripts" / f"chuong-trinh-bao-cao{HAU}.json"
UA = {"User-Agent": "Mozilla/5.0 (compatible; NguyenVongAI-research/1.0)"}
KHOA = re.compile(r"ch[uư]ơng tr[iì]nh đ[aà]o t[aạ]o|khung ch[uư]ơng tr[iì]nh|ng[aà]nh đ[aà]o t[aạ]o|ctđt|ctdt|chuong-trinh|khung-chuong|nganh-dao-tao|dao-tao", re.I)


def chuan(s: str) -> str:
    s = unicodedata.normalize("NFD", str(s).lower().replace("đ", "d"))
    return re.sub(r"[^a-z0-9]+", " ", "".join(c for c in s if unicodedata.category(c) != "Mn")).strip()


TIEN_TO = re.compile(r"^(chuong trinh dao tao nganh|chuong trinh dao tao|nganh dao tao|nganh|chuyen nganh|dai hoc chinh quy nganh) ")


def bo_tien_to(c: str) -> str:
    return TIEN_TO.sub("", c).strip()


def goc_mien(host: str) -> str:
    p = host.lower().split(".")
    return ".".join(p[-3:]) if len(p) >= 3 and p[-2] in ("edu", "com", "org", "gov") else ".".join(p[-2:])


def lay(url: str, s: requests.Session):
    try:
        try:
            r = s.get(url, headers=UA, timeout=12, allow_redirects=True)
        except requests.exceptions.SSLError:
            r = s.get(url, headers=UA, timeout=12, allow_redirects=True, verify=False)  # nhiều trang .edu.vn lỗi chuỗi chứng chỉ
        if r.status_code == 200 and "text/html" in r.headers.get("content-type", "") and len(r.content) < 3_000_000:
            return r
    except Exception:
        pass
    return None


def quet_truong(ma: str, hosts: list[str], tens: dict[str, str]):
    """tens: {idChươngTrình: tên ngành chuẩn hóa}. Trả {id: (url, tiêuĐề)}."""
    s = requests.Session()
    ket = {}
    goc = {goc_mien(h) for h in hosts}
    hang = deque((f"https://{h}/", 0) for h in hosts[:2])
    da = set()
    so_trang = 0
    # tên ngành -> các id (cùng tên có thể nhiều dòng theo phương thức; cùng trang dùng chung)
    theo_ten = defaultdict(list)
    for pid, t in tens.items():
        theo_ten[t].append(pid)
    while hang and so_trang < 60:
        url, sau = hang.popleft()
        url = urldefrag(url)[0]
        if url in da:
            continue
        da.add(url)
        r = lay(url, s)
        if not r:
            continue
        so_trang += 1
        html = BeautifulSoup(r.text, "html.parser")
        tieu_de = (html.title.string or "").strip() if html.title else ""
        trang_co_ct = bool(KHOA.search(tieu_de + " " + url))
        uu_tien = []
        for a in html.find_all("a", href=True):
            href = urljoin(r.url, a["href"])
            if urlparse(href).scheme not in ("http", "https") or goc_mien(urlparse(href).netloc) not in goc:
                continue
            chu = " ".join(a.get_text(" ").split())
            c = bo_tien_to(chuan(chu))
            if c in theo_ten and href != url:
                ket.setdefault(c, (href, chu))
            if KHOA.search(chu + " " + href) and sau < 2:
                uu_tien.append((href, sau + 1))
        for x in uu_tien[:25]:
            hang.append(x)
        time.sleep(0.15)
    # xác minh từng trang ứng viên: 200 + tên ngành có trong tiêu đề/nội dung
    xong = {}
    for c, (href, chu) in ket.items():
        r = lay(href, s)
        if not r:
            continue
        h = BeautifulSoup(r.text, "html.parser")
        td = (h.title.string or "").strip() if h.title else ""
        van = chuan(td + " " + (h.find("h1").get_text(" ") if h.find("h1") else ""))
        if c in bo_tien_to(van) or c in van and (KHOA.search(td + " " + href) or "chuong trinh" in chuan(h.get_text(" ")[:6000])):
            for pid in theo_ten[c]:
                xong[pid] = {"url": r.url, "tieuDe": td[:120]}
        time.sleep(0.15)
    return xong, so_trang


def main():
    catalog = json.loads((GOC / "frontend/src/data/programs-catalog.json").read_text(encoding="utf-8"))
    ten_mien = json.loads((GOC / "data/raw/school_domains_guess.json").read_text(encoding="utf-8"))
    ten_mien.update(json.loads((GOC / "data/raw/school_domains_manual.json").read_text(encoding="utf-8")))  # tên miền tra tay, đã mở thử
    chon = set(sys.argv[1:])
    theo_truong = defaultdict(dict)
    for r in catalog:
        pid = r["schoolCode"].lower() + "-" + hashlib.sha1(r["programKey"].encode("utf-8")).hexdigest()[:8]
        ten = r["majorName"]
        # cắt phần "loại chương trình - tên ngành" lấy phần cuối nếu có
        theo_truong[r["schoolCode"]][pid] = chuan(ten.split(" - ")[-1] if " - " in ten else ten)
    ket = json.loads(RA.read_text(encoding="utf-8")) if RA.exists() else {}
    bc = json.loads(BAO_CAO.read_text(encoding="utf-8")) if BAO_CAO.exists() else {}
    i_phan, n_phan = (int(x) for x in PHAN.split("/")) if PHAN else (0, 1)
    for k, (ma, tens) in enumerate(sorted(theo_truong.items())):
        if k % n_phan != i_phan:
            continue
        if chon and ma not in chon:
            continue
        if ma in bc and not chon:
            continue
        hosts = [h for h, _ in ten_mien.get(ma, []) if not h.startswith(("thisinh.", "ts-hn.", "ctsv.", "dtlt."))]
        if not hosts:
            bc[ma] = {"ghiChu": "chưa tìm được tên miền", "tong": len(tens), "coLink": 0}
            continue
        try:
            xong, n = quet_truong(ma, hosts, tens)
        except Exception as e:  # một trường lỗi không làm hỏng cả đợt
            bc[ma] = {"ghiChu": f"lỗi: {type(e).__name__}", "tong": len(tens), "coLink": 0}
            continue
        ket.update(xong)
        bc[ma] = {"mien": hosts[:2], "trangQuet": n, "tong": len(tens), "coLink": len(xong)}
        print(ma, bc[ma], flush=True)
        RA.write_text(json.dumps(ket, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        BAO_CAO.write_text(json.dumps(bc, ensure_ascii=False, indent=1), encoding="utf-8")
    RA.write_text(json.dumps(ket, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    BAO_CAO.write_text(json.dumps(bc, ensure_ascii=False, indent=1), encoding="utf-8")
    print("tổng:", len(ket), "chương trình có link")


main()

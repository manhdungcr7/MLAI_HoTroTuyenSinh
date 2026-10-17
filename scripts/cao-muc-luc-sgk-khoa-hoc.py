import re, html, json, time, sys, urllib.request
"""Cào mục lục SGK lớp 12 (tên chương, tên bài) từ loigiaihay.com. Chỉ lấy tên, không lấy nội dung sách. Ngày cào 17/10/2026.
Chạy: python scripts/cao-muc-luc-sgk-khoa-hoc.py <thư mục ra>   -> <thư mục ra>/muc-luc-sach.json
Dữ liệu cào là NGUỒN THỨ CẤP, cần đối chiếu sách in trước khi duyệt vào src/data/chuong-trinh-lop12.ts."""
import os
RA = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else os.getcwd()

sys.stdout.reconfigure(encoding="utf-8")
B = "https://loigiaihay.com"
SEEDS = {
 ("toan","KNTT"): ["/sgk-toan-12-tap-1-pdf-toan-12-tap-1-ket-noi-tri-thuc-a156035.html","/sgk-toan-12-tap-2-pdf-toan-12-tap-2-ket-noi-tri-thuc-a156037.html"],
 ("toan","CTST"): ["/sgk-toan-12-tap-1-pdf-toan-12-tap-1-chan-troi-sang-tao-a155819.html","/sgk-toan-12-tap-2-pdf-toan-12-tap-2-chan-troi-sang-tao-a155825.html"],
 ("toan","CD"): ["/sgk-toan-12-tap-1-pdf-toan-12-tap-1-canh-dieu-a154970.html","/sgk-toan-12-tap-2-pdf-toan-12-tap-2-canh-dieu-a154975.html"],
 ("vatLy","KNTT"): ["/sgk-vat-li-12-pdf-vat-li-12-ket-noi-tri-thuc-a155831.html"],
 ("vatLy","CTST"): ["/sgk-vat-li-12-pdf-vat-li-12-chan-troi-sang-tao-a155733.html"],
 ("vatLy","CD"): ["/sgk-vat-li12-pdf-vat-li-12-canh-dieu-a155676.html"],
 ("hoaHoc","KNTT"): ["/sgk-hoa-hoc-12-pdf-hoa-hoc-12-ket-noi-tri-thuc-a155777.html"],
 ("hoaHoc","CTST"): ["/sgk-hoa-hoc-12-pdf-hoa-hoc-12-chan-troi-sang-tao-a155725.html"],
 ("hoaHoc","CD"): ["/sgk-hoa-hoc-12-pdf-hoa-hoc-12-canh-dieu-a155675.html"],
 ("sinh","KNTT"): ["/sgk-sinh-hoc-12-pdf-sinh-hoc-12-ket-noi-tri-thuc-a155127.html"],
 ("sinh","CTST"): ["/sgk-sinh-hoc-12-pdf-sinh-hoc-12-chan-troi-sang-tao-a155166.html"],
 ("sinh","CD"): ["/sgk-sinh-hoc-12-pdf-sinh-hoc-12-canh-dieu-a155165.html"],
 ("nguVan","KNTT"): ["/sgk-van-12-tap-1-pdf-van-12-tap-1-ket-noi-tri-thuc-a155097.html"],
 ("nguVan","CTST"): ["/sgk-van-12-tap-1-pdf-van-12-tap-1-chan-troi-sang-tao-a155106.html"],
 ("nguVan","CD"): ["/sgk-van-12-tap-1-pdf-van-12-tap-1-canh-dieu-a155102.html"],
 ("tiengAnh","KNTT"): ["/sgk-tieng-anh-12-pdf-tieng-anh-12-global-success-a155095.html"],
 ("tiengAnh","CTST"): ["/sgk-tieng-anh-12-pdf-tieng-anh-12-friends-global-a155098.html"],
 ("tiengAnh","CD"): ["/sgk-tieng-anh-12-pdf-tieng-anh-12-english-discovery-a155108.html"],
 ("tiengAnh","Bright"): ["/sgk-tieng-anh-12-pdf-tieng-anh-12-bright-a155104.html"],
 ("tiengAnh","iLearn"): ["/sgk-tieng-anh-12-pdf-tieng-anh-12-ilearn-smart-world-a155101.html"],
}
def get(u):
    r = urllib.request.Request(B + u, headers={"User-Agent": "Mozilla/5.0"})
    return urllib.request.urlopen(r, timeout=60).read().decode("utf-8", "ignore")
def toc(t):
    t2 = re.sub(r"<(script|style)[^>]*>.*?</\1>", " ", t, flags=re.S)
    t2 = re.sub(r"<br\s*/?>|</p>|</li>|</div>|</h\d>", "\n", t2)
    t2 = html.unescape(re.sub(r"<[^>]+>", " ", t2)).replace("\xa0", " ")
    t2 = re.sub(r"[ \t]+", " ", t2)
    CH = r"(?:CHƯƠNG|Chương|CHỦ ĐỀ|Chủ đề|Chuyên đề|PHẦN|Phần|UNIT|Unit|REVIEW|Review)"
    # cắt trước mỗi dấu chương/bài, kể cả khi các mục nằm cùng một dòng
    t2 = re.sub(r"\s*\b(" + CH + r"\s+(?:\d+|[IVX]+)\b)", r"\n\1", t2)
    t2 = re.sub(r"\s+(Bài\s+\d+\b|Bài tập cuối chương|Ôn tập (?:chương|cuối)[^\n]{0,15})", r"\n\1", t2)
    lines = [l.strip() for l in t2.split("\n") if l.strip()]
    start = None
    for i, l in enumerate(lines):
        if re.match("^" + CH + r"\s+(\d+|[IVX]+)\b", l) and any(re.match(r"^Bài\s+\d+", x) for x in lines[i + 1:i + 5]):
            start = i
            break
    if start is None:
        return None
    out = []; cur = None; vang = 0
    for l in lines[start:]:
        if re.match(r"(?i)^(download|tải|xem thêm|>>|tham khảo|xem ngay|giải sgk|xem online|bình luận|hãy tham gia)", l) or len(l) > 220:
            if out and cur and cur["bai"]:
                break
            continue
        if re.match("^" + CH + r"\s+(\d+|[IVX]+)\b", l):
            cur = {"ten": l, "bai": []}; out.append(cur); vang = 0
        elif re.match(r"^(Bài\s+\d+|Bài tập cuối chương|Ôn tập)", l) and cur is not None:
            cur["bai"].append(l)
        else:
            vang += 1
            if vang > 6 and out:
                break
    dl = re.search(r'href="(https://drive\.google\.com[^"]+)"', t)
    return out, (dl.group(1) if dl else None)
ket = {}
for (mon, bo), urls in SEEDS.items():
    ds = []; tai = []
    for u in urls:
        try:
            t = get(u); r = toc(t)
            time.sleep(0.8)
        except Exception as e:
            ds.append({"loi": f"{u}: {e}"}); continue
        if not r: ds.append({"loi": f"{u}: không thấy mục lục"}); continue
        ds.extend(r[0]); tai.append({"trang": B + u, "taiPdf": r[1]})
    ket[f"{mon}|{bo}"] = {"chuong": ds, "nguon": tai}
    n = len([c for c in ds if "ten" in c]); b = sum(len(c.get("bai", [])) for c in ds)
    print(f"{mon:9s} {bo:7s} chương={n:2d} bài={b:3d}", [c["loi"] for c in ds if "loi" in c])
json.dump(ket, open(os.path.join(RA, "muc-luc-sach.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

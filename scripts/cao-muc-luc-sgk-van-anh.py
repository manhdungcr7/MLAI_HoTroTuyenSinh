import re, html, json, time, sys, urllib.request
"""Cào mục lục SGK lớp 12 (tên chương, tên bài) từ loigiaihay.com. Chỉ lấy tên, không lấy nội dung sách. Ngày cào 17/10/2026.
Chạy: python scripts/cao-muc-luc-sgk-van-anh.py <thư mục ra>   -> <thư mục ra>/muc-luc-van-anh.json
Dữ liệu cào là NGUỒN THỨ CẤP, cần đối chiếu sách in trước khi duyệt vào src/data/chuong-trinh-lop12.ts."""
import os
RA = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else os.getcwd()

sys.stdout.reconfigure(encoding="utf-8")
B = "https://loigiaihay.com"
SEEDS = {
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
def txt(t):
    t = re.sub(r"<(script|style)[^>]*>.*?</\1>", " ", t, flags=re.S)
    t = re.sub(r"<br\s*/?>|</p>|</li>|</div>|</h\d>", "\n", t)
    return re.sub(r"[ \t]+", " ", html.unescape(re.sub(r"<[^>]+>", " ", t))).replace("\xa0", " ")
def phang(t):
    x = txt(t)
    i = x.find("MỤC LỤC")
    if i < 0:
        i = x.find("Mục lục")
    if i < 0:
        return None
    muc = []
    for l in x[i + 7:].split("\n"):
        l = l.strip()
        if not l:
            continue
        if re.match(r"^(Bài|BÀI|Unit|UNIT|Review|REVIEW|Chủ đề|Chương|Phần|Lesson|Module|Starter|Unit)\b", l) and len(l) < 150:
            muc.append(l)
        elif muc:
            break
    dl = re.search(r'href="(https://drive\.google\.com[^"]+)"', t)
    return muc, (dl.group(1) if dl else None)
ket = {}
for (mon, bo), urls in SEEDS.items():
    muc = []; tai = []
    todo = list(urls); seen = set()
    while todo:
        u = todo.pop(0)
        if u in seen:
            continue
        seen.add(u)
        try:
            t = get(u); r = phang(t); time.sleep(0.8)
        except Exception as e:
            print("LOI", u, e); continue
        if not r:
            print("khong thay muc luc", u); continue
        muc += r[0]; tai.append({"trang": B + u, "taiPdf": r[1]})
        if mon == "nguVan" and "tap-1" in u:  # tìm tập 2 của đúng bộ sách
            kh = u.split("tap-1-pdf-van-12-tap-1-")[1].rsplit("-a", 1)[0]
            for m in re.finditer(r'href="(/sgk-van-12-tap-2-pdf-van-12-tap-2-' + re.escape(kh) + r'-a\d+\.html)"', t):
                todo.append(m.group(1))
    ket[f"{mon}|{bo}"] = {"muc": muc, "nguon": tai}
    print(f"{mon:9s} {bo:7s} mục={len(muc):2d} trang={len(tai)}")
json.dump(ket, open(os.path.join(RA, "muc-luc-van-anh.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

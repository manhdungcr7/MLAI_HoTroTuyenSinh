"""Tìm lại URL gốc của các file đề án PDF đã tải (manifest cũ mất URL ở lần quét lỗi mạng).
Chỉ nhận một URL khi dung lượng trên máy chủ (Content-Length) trùng đúng dung lượng file đã tải. Ghi data/raw/dean_urls.json.
Chạy từ thư mục nguyen-vong:  python ../team-repo/scripts/tim-url-de-an.py
"""
import json, sys, time
from pathlib import Path
import requests
sys.path.insert(0, ".")
from pipeline import config
from pipeline.scrape.dean_pdfs import SchoolTarget, discover_one

man = json.loads((config.RAW / "dean_manifest.json").read_text(encoding="utf-8"))
ra = config.RAW / "dean_urls.json"
kq = json.loads(ra.read_text(encoding="utf-8")) if ra.exists() else {}
for code, v in man.items():
    if code in kq or not v.get("files"):
        continue
    if all((v.get("pdfs") or {}).get(y, {}).get("url") for y in v["files"]):
        kq[code] = {y: v["pdfs"][y]["url"] for y in v["files"]}
        continue
    r = discover_one(SchoolTarget(slug=v["slug"], code=code))
    ok = {}
    for y, f in v["files"].items():
        url = r.pdfs_by_year.get(y)
        if not url:
            continue
        try:
            h = requests.head(url, headers=config.REQUEST_HEADERS, timeout=20, allow_redirects=True)
            if int(h.headers.get("Content-Length", -1)) == Path(f).stat().st_size:
                ok[y] = url
        except Exception:
            pass
        time.sleep(0.3)
    kq[code] = ok
    print(code, r.status, f"{len(ok)}/{len(v['files'])}", flush=True)
    ra.write_text(json.dumps(kq, ensure_ascii=False, indent=1), encoding="utf-8")
    time.sleep(0.5)
ra.write_text(json.dumps(kq, ensure_ascii=False, indent=1), encoding="utf-8")
print("xong", sum(len(x) for x in kq.values()), "url")

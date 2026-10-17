"""Trích chỉ tiêu tuyển sinh theo ngành từ đề án PDF -> src/data/chi-tieu.json
{idChươngTrình: {chiTieu, nam, url, trang, ghiChu}}.

Cách làm: dùng PyMuPDF find_tables() để tìm bảng có cột "Chỉ tiêu" và cột tên ngành; chỉ nhận khi
  - tên ngành (chuẩn hóa) khớp ĐÚNG MỘT tên ngành của trường trong dữ liệu và chỉ xuất hiện MỘT lần trong cả đề án,
  - ô chỉ tiêu là một số nguyên dương duy nhất trên đúng hàng.
Hàng có nhiều số, hàng gộp nhóm, tên trùng nhiều dòng (nhiều phương thức) -> bỏ, ghi vào báo cáo.
Chạy lại: python -X utf8 scripts/trich-chi-tieu.py  (tải PDF vào D:/nv-artifacts/pdf-cache nếu thiếu).
Gỡ lỗi: --truong TCT,SPD.  Ghi thêm scripts/.tmp-chi-tieu-ung-vien.json (ứng viên chưa khớp) để rà tay.
"""
import json, os, re, subprocess, sys, time, unicodedata
from collections import defaultdict
from pathlib import Path
import fitz

ROOT = Path(__file__).resolve().parents[1]
CACHE = Path(os.environ.get("PDF_CACHE", "D:/nv-artifacts/pdf-cache"))
TRUONG = "TCT SPD GSA GTA BKA QST TDV DDK DQN DCN".split()  # 10 trường đã chạy được; thử nhưng không trích được: xem docs/audits/chi-tieu-10-truong.md
if "--truong" in sys.argv:
    TRUONG = sys.argv[sys.argv.index("--truong") + 1].split(",")

deanh = json.loads((ROOT / "src/data/de-an-truong.json").read_text(encoding="utf-8"))
deanh.update(json.loads((ROOT / "src/data/de-an-truong-thu-cap.json").read_text(encoding="utf-8")))
chuong_trinh = json.loads((ROOT / "src/data/du-lieu-that.json").read_text(encoding="utf-8"))


def chuan(s):
    s = unicodedata.normalize("NFD", str(s or "").lower().replace("đ", "d"))
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]+", " ", s).strip()


def tai(url):
    f = CACHE / url.split("/")[-1]
    if not f.exists() or f.stat().st_size < 1000:
        CACHE.mkdir(parents=True, exist_ok=True)
        subprocess.run(["curl", "-s", "-m", "60", "-A", "Mozilla/5.0", "-o", str(f), url])
        time.sleep(1)
    return f if f.exists() and f.stat().st_size > 1000 else None


def de_an_moi(ma):
    docs = sorted([x for x in deanh.get(ma, {}).get("docs", []) if x["nam"] in ("2025", "2026")], key=lambda x: x["nam"], reverse=True)
    return docs[0] if docs else None


def so_nguyen(o):
    o = (o or "").strip().replace("\n", " ")
    return int(o) if re.fullmatch(r"\d{1,5}", o) and int(o) > 0 else None


def hang_tieu_de(rows):
    """Tìm (số hàng tiêu đề, các cột chỉ tiêu, cột tên ngành). Tiêu đề có thể tách nhiều hàng nên gộp chữ theo cột trong 4 hàng đầu."""
    if not rows:
        return None
    k = 0
    while k < min(4, len(rows)) and not any(re.fullmatch(r"\d{1,3}|[57]\d{6}", (c or "").strip()) for c in rows[k][:3]):
        k += 1
    k = max(k, 1)
    n = max(len(r) for r in rows[:k])
    cot = [" ".join((r[j] or "") for r in rows[:k] if j < len(r)).lower().replace(chr(10), " ") for j in range(n)]
    cot = [re.sub(r"\s+", " ", c).strip() for c in cot]
    ct = [i for i, c in enumerate(cot) if re.search(r"chỉ tiêu|số lượng|^ct$", c)]
    ten = [i for i, c in enumerate(cot) if re.search(r"tên ngành|ngành|chương trình", c) and not c.startswith("mã")]
    if ct and ten:
        return k - 1, ct, ten[0]
    return None


def ung_vien_cua(path):
    """Trả danh sách (trang, tên, chỉ tiêu | None, ghi chú)."""
    out = []
    with fitz.open(path) as doc:
        tieu_de = None
        for i, pg in enumerate(doc):
            try:
                tabs = pg.find_tables().tables
                if not any(hang_tieu_de(t.extract()) for t in tabs) and re.search(r"chỉ\s+tiêu|số\s+lượng", pg.get_text(), re.I) and len(re.findall(r"[57]\d{6}", pg.get_text())) >= 3:
                    tabs = pg.find_tables(strategy="text").tables  # bảng không kẻ ô
            except Exception:
                continue
            for t in tabs:
                rows = t.extract()
                if not rows:
                    continue
                th = hang_tieu_de(rows)
                bat_dau = 0
                if th:
                    tieu_de = (len(rows[0]), th[1], th[2])
                    bat_dau = th[0] + 1
                elif not tieu_de or len(rows[0]) != tieu_de[0]:
                    continue
                _, ct, ten = tieu_de
                for r in rows[bat_dau:]:
                    if len(r) <= max(ct + [ten]):
                        continue
                    nm = next(((r[j] or "").replace(chr(10), " ").strip() for j in range(ten, min(ten + 3, len(r))) if (r[j] or "").strip()), "")
                    if not nm:
                        continue
                    so = [so_nguyen(r[j]) for c in ct for j in range(max(c - 1, 0), min(c + 3, len(r)))]
                    so = [x for x in so if x]
                    out.append((i + 1, nm, so[0] if len(so) == 1 else None, "" if len(so) == 1 else ("nhiều cột chỉ tiêu" if so else "ô chỉ tiêu không phải một số")))
    return out


def main():
    theo_truong = defaultdict(dict)
    for p in chuong_trinh:
        theo_truong[p["ma"]][p["id"]] = p
    ket, bao_cao, ung_vien_tho = {}, {}, {}
    for ma in TRUONG:
        da = de_an_moi(ma)
        if not da:
            bao_cao[ma] = {"loi": "không có đề án 2025/2026"}
            continue
        try:
            f = tai(da["url"])
            if not f:
                bao_cao[ma] = {"loi": "không tải được PDF"}
                continue
            uv = ung_vien_cua(f)
        except Exception as e:
            bao_cao[ma] = {"loi": f"lỗi đọc PDF: {e}"}
            continue
        ung_vien_tho[ma] = uv
        # đếm số lần mỗi tên chuẩn hóa xuất hiện trong bảng chỉ tiêu
        dem = defaultdict(list)
        for trang, ten, so, gc in uv:
            dem[chuan(ten)].append((trang, ten, so, gc))
        tên_ct = defaultdict(list)
        for pid, p in theo_truong[ma].items():
            tên_ct[chuan(p["nganh"])].append(pid)
        khop = 0
        for c, ds in dem.items():
            if c not in tên_ct:
                continue
            # cùng một (tên, số) lặp lại (bảng nhắc lại ở phụ lục) vẫn là một quan sát; số khác nhau hoặc ô lỗi thì bỏ
            ds = [x for x in ds if x[2] is not None]
            if len({x[2] for x in ds}) != 1 or len({x[0] for x in ds}) > 2:
                continue
            trang, ten, so, _ = ds[0]
            for pid in tên_ct[c]:
                ket[pid] = {"chiTieu": so, "nam": da["nam"], "url": da["url"], "trang": trang, "ghiChu": "tổng chỉ tiêu ngành trong đề án, chưa tách phương thức" if len(tên_ct[c]) > 1 or theo_truong[ma][pid]["pt"] != "THPT" else ""}
                khop += 1
        bao_cao[ma] = {"nam": da["nam"], "dongBang": len(uv), "khop": khop, "tongChuongTrinh": len(theo_truong[ma])}
        print(ma, bao_cao[ma], flush=True)
    (ROOT / "scripts/.tmp-chi-tieu-ung-vien.json").write_text(json.dumps(ung_vien_tho, ensure_ascii=False), encoding="utf-8")
    (ROOT / "scripts/.tmp-chi-tieu-bao-cao.json").write_text(json.dumps(bao_cao, ensure_ascii=False, indent=1), encoding="utf-8")
    if "--truong" not in sys.argv:
        (ROOT / "src/data/chi-tieu.json").write_text(json.dumps(ket, ensure_ascii=False, indent=1), encoding="utf-8")
        print("ghi", len(ket), "bản ghi")


main()

"""Mở rộng số năm điểm chuẩn THPT từ chính các PDF đề án đã có (trích thêm cột năm kề trong cùng bảng).

Không sửa src/data/du-lieu-that.json. Ghi đề xuất vào:
  - src/data/nam-diem-bo-sung.json   {id: {năm: {diem, url, trang}}}
  - docs/audits/nam-diem-xung-dot.csv
  - D:/nv-artifacts/d3-obs/*.json    (bộ nhớ trung gian theo từng PDF; có tiến độ, chạy lại bỏ qua PDF đã xong)

Quy tắc TRẮC ĐỊNH (chỉ nhận khi đủ cả):
  (a) tên ngành chuẩn hóa khớp CHÍNH XÁC ô tên của đúng một hàng (và đúng một chương trình, nếu trùng thì
      phân biệt bằng tổ hợp trong hàng; không phân biệt được thì bỏ);
  (b) năm đọc rõ từ tiêu đề cột (hoặc tiêu đề ngay trên bảng nếu bảng chỉ có một cột điểm);
  (c) ô điểm chứa đúng một số trong [10; 30] và khác đúng 15,00;
  (d) nếu dữ liệu đã có điểm năm đó thì phải trùng (dung sai 0,005); lệch thì không nhận, ghi xung đột,
      và bỏ luôn các năm khác của hàng đó (nghi khớp nhầm hàng).
Cột có chữ học bạ / ĐGNL / tư duy / năng khiếu / kết hợp / xét thẳng... bị loại.

Chạy:  python scripts/mo-rong-nam-diem.py [--cache D:/nv-artifacts/pdf-cache] [--toi-da-pdf 150] [--lam-lai]
PDF chưa có trong cache: tải bằng curl theo danh sách D:/nv-artifacts/d3-urls.tsv (script tự ghi danh sách này).
"""
import argparse, csv, hashlib, json, re, sys, time, unicodedata
from collections import Counter, defaultdict
from pathlib import Path

import fitz

GOC = Path(__file__).resolve().parents[1]
DATA = GOC / "src" / "data"
ART = Path("D:/nv-artifacts")
OBS = ART / "d3-obs"

LOAI = ["hoc ba", "dgnl", "danh gia nang luc", "danh gia tu duy", "tu duy", "nang khieu", "ket hop",
        "vsat", "v sat", "ielts", "xet tuyen thang", "tuyen thang truc tiep", "chung chi", "dgtd", "dgcb", "hoc sinh gioi", "uu tien xet"]


def chuan(s) -> str:
    s = unicodedata.normalize("NFD", str(s or "").lower().replace("đ", "d"))
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]+", " ", s).strip()


def hop_le(r):
    return {y: v for y, v in r["diem"].items() if v is not None and abs(v - 15) > 1e-9}


def dung_chuong_trinh():
    d = json.loads((DATA / "du-lieu-that.json").read_text(encoding="utf-8"))
    return [r for r in d if r["pt"] == "THPT"]


def doc_de_an():
    out = {}
    for f in ("de-an-truong.json", "de-an-truong-thu-cap.json"):
        for ma, v in json.loads((DATA / f).read_text(encoding="utf-8")).items():
            out.setdefault(ma, [])
            for x in v.get("docs", []):
                if x["url"] not in [y["url"] for y in out[ma]]:
                    out[ma].append(x)
    return out


def chon_pdf(thpt, de_an, toi_da):
    """Gom (url -> các trường), ưu tiên trường có nhiều chương trình chỉ 1 năm."""
    mot = Counter(r["ma"] for r in thpt if len(hop_le(r)) == 1)
    url_truong, thu_tu = defaultdict(list), []
    for ma, _ in mot.most_common():
        for x in de_an.get(ma, []):
            if x["url"] not in url_truong:
                thu_tu.append((ma, x["nam"], x["url"]))
            if ma not in url_truong[x["url"]]:
                url_truong[x["url"]].append(ma)
    return thu_tu[:toi_da], url_truong


def ten_tep(url):
    return url.rsplit("/", 1)[1]


MIN_NEO, MIN_KHOP = 1, 0.9  # mức A: bảng có >=1 ô neo (điểm đã có trong dữ liệu) trùng và >=90% neo khớp; mức B: bảng không có ô neo nào
PT_LOAI = {"hb", "nl", "dgnl", "dgtd", "kh", "tt", "xt", "tn"}
RE_SO = re.compile(r"(?<![\d.,])(\d{1,2}[.,]\d{1,3})(?![\d])")
RE_HOP = re.compile(r"\b[A-Z]\d{2}\b")


def doc_diem(o):
    """Ô điểm -> float hoặc None (chỉ nhận đúng một số trong ô)."""
    t = (o or "").replace("\n", " ").strip()
    if not t:
        return None
    ds = RE_SO.findall(t)
    if len(ds) == 1:
        v = float(ds[0].replace(",", "."))
    elif not ds and re.fullmatch(r"\d{2}", t):
        v = float(t)
    else:
        return None
    if "%" in t:
        return None
    return v if 10 <= v <= 30 and abs(v - 15) > 1e-9 else None


def la_ma(c):
    toks = c.split()
    if not toks:
        return True
    if all(re.fullmatch(r"[a-z]\d{2}[a-z]?|\d+", t) for t in toks):
        return True
    return len(c) <= 12 and any(ch.isdigit() for ch in c)


def tieu_de_cot(rows, ncols):
    """Ghép chữ tiêu đề nhiều dòng; ô gộp (None) kế thừa ô bên trái."""
    nh = 0
    for r in rows[:4]:
        if any(doc_diem(c) is not None for c in r if c):
            break
        nh += 1
    parts = [[] for _ in range(ncols)]
    for r in rows[:nh]:
        cur = ""
        for j in range(ncols):
            c = r[j] if j < len(r) else None
            if c is not None:
                cur = c
            parts[j].append(cur)
    return nh, [chuan(" ".join(p)) for p in parts]


def cot_diem(h):
    """Tiêu đề cột là cột điểm THPT: có 'điểm' hoặc 'THPT', không thuộc phương thức khác, không phải chỉ tiêu/tổ hợp."""
    hh = f" {h} "
    if any(f" {x} " in hh for x in LOAI):
        return False
    if any(f" {x} " in hh for x in ("chi tieu", "so luong", "nhap hoc", "thi sinh")):
        return False
    if " diem " in hh:
        return True
    return (" thpt " in hh or "tot nghiep" in hh) and " to hop " not in hh


def nam_cot(head):
    ys = set(re.findall(r"\b(20[12]\d)\b", head))
    return ys.pop() if len(ys) == 1 else None


def xu_ly_pdf(url, truong_ds, ch_theo_truong, tep, log):
    """Trả về danh sách khớp-hàng: {id, trang, nam:{năm: điểm}, cach}."""
    keymap, hau_to = {}, set()
    for ma in truong_ds:
        for r in ch_theo_truong.get(ma, []):
            day_du = chuan(r["nganh"])
            ks = {day_du}
            if " - " in r["nganh"]:
                ks.add(chuan(r["nganh"].rsplit(" - ", 1)[1]))
            for k in ks:
                if k:
                    keymap.setdefault(k, []).append(r)
                    if k != day_du:
                        hau_to.add((k, r["id"]))
    keys = list(keymap)
    kq = []
    doc = fitz.open(tep)
    ke_thua = None  # (số cột, năm theo cột) cho bảng nối trang
    for pi, page in enumerate(doc, 1):
        try:
            txt = chuan(page.get_text())
            if "diem" not in txt or not any(f" {k} " in f" {txt} " for k in keys):
                ke_thua = None
                continue
            tabs = page.find_tables().tables
        except Exception as e:
            log(f"  lỗi trang {pi}: {e}")
            continue
        for ti, t in enumerate(tabs):
            try:
                rows = t.extract()
            except Exception:
                continue
            if len(rows) < 2:
                continue
            ncols = max(len(r) for r in rows)
            nh, heads = tieu_de_cot(rows, ncols)
            cot = {}
            for j, h in enumerate(heads):
                if cot_diem(h):
                    y = nam_cot(h)
                    if y:
                        cot[j] = (y, "tieu-de-cot")
            cach = "tieu-de-cot"
            if not cot:
                dcols = [j for j, h in enumerate(heads) if " diem " in f" {h} " and cot_diem(h)]
                # năm theo tiêu đề ngay trên bảng (chỉ khi có đúng một cột điểm và đúng một năm)
                x0, y0, x1, y1 = t.bbox
                tren = chuan(page.get_text("text", clip=fitz.Rect(0, max(0, y0 - 70), page.rect.width, y0)))
                ys = set(re.findall(r"\b(20[12]\d)\b", tren))
                if len(dcols) == 1 and "diem" in tren and len(ys) == 1 and not any(f" {x} " in f" {tren} " for x in LOAI):
                    cot[dcols[0]] = (ys.pop(), "tieu-de-tren-bang")
                    cach = "tieu-de-tren-bang"
                elif ke_thua and ke_thua[0] == ncols and nh == 0:
                    cot = dict(ke_thua[1])
                    cach = "noi-trang"
            if not cot:
                continue
            ke_thua = (ncols, dict(cot))
            dau = min(cot)
            for ri, r in enumerate(rows[nh:], nh):
                r = list(r) + [None] * (ncols - len(r))
                ten = None
                for j in range(dau - 1, -1, -1):  # ô tên bên phải nhất (trước cột điểm) có trong danh sách ngành
                    c = chuan(r[j])
                    if len(c) <= 100 and c in keymap:
                        ten = c
                        break
                if not ten:
                    continue
                # phương thức ghi ngay trong hàng (ô ngắn): loại hàng học bạ / ĐGNL / kết hợp / nhiều phương thức gộp
                tok, nhieu = set(), False
                for j in range(dau):
                    c = chuan(r[j])
                    if c and c != ten and len(c) <= 30:
                        tok |= set(c.split())
                    if re.search(r"\b\d{3}\b.*[,;].*\b\d{3}\b", (r[j] or "").replace(chr(10), " ")):
                        nhieu = True
                if tok & PT_LOAI or nhieu:
                    log(f"  loại hàng phương thức khác p{pi}: {ten}")
                    continue
                hang = " ".join((c or "") for c in r[:dau])
                ma_hop = set(RE_HOP.findall(hang + " " + " ".join((r[j] or "") for j in cot)))
                ds = keymap[ten]
                if ma_hop:
                    loc = [x for x in ds if ma_hop & set(x["toHop"])]
                    if not loc:
                        log(f"  tổ hợp lệch p{pi}: {ten}")
                        continue
                    ds = loc
                if len({x["id"] for x in ds}) != 1:
                    kq.append({"id": None, "ten": ten, "trang": pi, "ly_do": "trung-ten-nhieu-chuong-trinh"})
                    continue
                nam = {}
                for j, (y, _) in cot.items():
                    v = doc_diem(r[j])
                    if v is None:
                        continue
                    # nếu bảng có cột "phương thức" ngay trước cột điểm thì ô phương thức phải ghi THPT / tốt nghiệp
                    k = max((k for k in range(j) if " phuong thuc " in f" {heads[k]} " and not any(k < q < j for q in cot)), default=None)
                    if k is not None:
                        pt = chuan(r[k])
                        if not (" thpt " in f" {pt} " or "tot nghiep" in pt):
                            continue
                    nam.setdefault(y, set()).add(v)
                nam = {y: next(iter(s)) for y, s in nam.items() if len(s) == 1}
                if nam:
                    kq.append({"id": ds[0]["id"], "ten": ten, "trang": pi, "bang": ti, "hang": ri, "nam": nam, "cach": cach, "via": "hau-to" if (ten, ds[0]["id"]) in hau_to else "day-du"})
    return kq


def tong_hop(thpt, url_truong, thu_tu, log):
    theo_id = {r["id"]: r for r in thpt}
    obs_all = []
    for ma, namdoc, url in thu_tu:
        f = OBS / (hashlib.sha1(url.encode()).hexdigest()[:12] + ".json")
        if f.exists():
            for o in json.loads(f.read_text(encoding="utf-8")):
                o["url"] = url
                obs_all.append(o)
    de_xuat, xung_dot = {}, []
    thong_ke = Counter()
    for o in obs_all:
        if o.get("id") is None:
            thong_ke["bo_vi_trung_ten"] += 1
    obs_all = [o for o in obs_all if o.get("id") is not None]
    # 1) hiệu chuẩn theo bảng: đối chiếu các ô đã có điểm trong dữ liệu (neo)
    neo = defaultdict(lambda: [0, 0])  # (url, trang, bảng) -> [trùng, lệch]
    for o in obs_all:
        hl = theo_id[o["id"]]["diem"]
        for y, v in o["nam"].items():
            if y in hl and hl[y] is not None:
                neo[(o["url"], o["trang"], o["bang"])][0 if abs(hl[y] - v) <= 0.005 else 1] += 1
    bang_tin = {k for k, (t, l) in neo.items() if t >= MIN_NEO and l / (t + l) <= 1 - MIN_KHOP}  # mức A
    bang_khong_neo = {(o["url"], o["trang"], o["bang"]) for o in obs_all} - set(neo)  # mức B
    thong_ke["bang_co_neo"] = len(neo)
    thong_ke["bang_tin_cay"] = len(bang_tin)
    thong_ke["doi_chieu_trung"] = sum(t for t, l in neo.values())
    thong_ke["doi_chieu_lech"] = sum(l for t, l in neo.values())
    thong_ke["doi_chieu_trung_bang_tin_cay"] = sum(neo[k][0] for k in bang_tin)
    thong_ke["doi_chieu_lech_bang_tin_cay"] = sum(neo[k][1] for k in bang_tin)
    nhom = defaultdict(list)
    for o in obs_all:
        nhom[(o["url"], o["id"])].append(o)
    moi = defaultdict(lambda: defaultdict(list))  # id -> năm -> [(điểm, url, trang)]
    for (url, pid), hs in nhom.items():
        r = theo_id[pid]
        hl = r["diem"]
        lech_hang = []
        for h in hs:
            for y, v in h["nam"].items():
                if y in hl and hl[y] is not None and abs(hl[y] - v) > 0.005:
                    lech_hang.append((h, y, v))
        hang_rieng = {(h["trang"], h["bang"], h["hang"]) for h in hs}
        if lech_hang:
            for h, y, v in lech_hang:
                xung_dot.append([pid, r["ma"], r["nganh"], y, hl[y], v, url, h["trang"], "lech-diem-da-co"])
            continue
        if len(hang_rieng) > 1:
            for h in hs:
                for y, v in h["nam"].items():
                    xung_dot.append([pid, r["ma"], r["nganh"], y, hl.get(y, ""), v, url, h["trang"], "nhieu-hang-cung-ten"])
            continue
        h = hs[0]
        kb = (url, h["trang"], h["bang"])
        muc = "A" if kb in bang_tin else "B" if kb in bang_khong_neo else None
        if muc == "B" and h.get("via") == "hau-to":
            thong_ke["bo_vi_khop_hau_to_khong_neo"] += 1
            continue
        if muc is None:
            thong_ke["bo_vi_bang_neo_khong_khop"] += 1
            continue
        for y, v in h["nam"].items():
            if y in hl and hl[y] is not None:
                continue
            moi[pid][y].append((v, url, h["trang"], muc))
    for pid, theo_nam in moi.items():
        r = theo_id[pid]
        for y, ls in theo_nam.items():
            vals = {round(v, 2) for v, _, _, _ in ls}
            if len(vals) > 1:
                for v, url, tr, _ in ls:
                    xung_dot.append([pid, r["ma"], r["nganh"], y, "", v, url, tr, "nhieu-gia-tri-khac-nhau"])
                continue
            v, url, tr, muc = ls[0]
            de_xuat.setdefault(pid, {})[y] = {"diem": v, "url": url, "trang": tr, "muc": muc}
    return de_xuat, xung_dot, thong_ke


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--cache", default="D:/nv-artifacts/pdf-cache")
    ap.add_argument("--toi-da-pdf", type=int, default=150)
    ap.add_argument("--lam-lai", action="store_true")
    ap.add_argument("--chi-tong-hop", action="store_true")
    a = ap.parse_args()
    cache = Path(a.cache)
    OBS.mkdir(parents=True, exist_ok=True)
    thpt = dung_chuong_trinh()
    de_an = doc_de_an()
    thu_tu, url_truong = chon_pdf(thpt, de_an, a.toi_da_pdf)
    (ART / "d3-urls.tsv").write_text("\n".join("\t".join(x) for x in thu_tu) + "\n", encoding="utf-8")
    ch_theo_truong = defaultdict(list)
    for r in thpt:
        ch_theo_truong[r["ma"]].append(r)
    logf = open(ART / "d3-tien-do.log", "a", encoding="utf-8")

    def log(m):
        print(m, flush=True)
        logf.write(m + "\n")

    if not a.chi_tong_hop:
        for i, (ma, namdoc, url) in enumerate(thu_tu, 1):
            f = OBS / (hashlib.sha1(url.encode()).hexdigest()[:12] + ".json")
            tep = cache / ten_tep(url)
            if f.exists() and not a.lam_lai:
                continue
            if not tep.exists() or tep.stat().st_size < 1000:
                log(f"[{i}/{len(thu_tu)}] {ma} {namdoc}: THIẾU tệp {tep.name}")
                continue
            t0 = time.time()
            try:
                kq = xu_ly_pdf(url, url_truong[url], ch_theo_truong, tep, log)
            except Exception as e:
                log(f"[{i}/{len(thu_tu)}] {ma} {namdoc}: LỖI {e}")
                continue
            f.write_text(json.dumps(kq, ensure_ascii=False), encoding="utf-8")
            log(f"[{i}/{len(thu_tu)}] {ma} {namdoc}: {len(kq)} hàng khớp, {time.time()-t0:.0f}s")

    de_xuat, xung_dot, tk = tong_hop(thpt, url_truong, thu_tu, log)
    # chỉ giữ đề xuất cho chương trình hiện có <= 1 năm hợp lệ
    theo_id = {r["id"]: r for r in thpt}
    de_xuat = {k: v for k, v in sorted(de_xuat.items()) if len(hop_le(theo_id[k])) <= 1}
    (DATA / "nam-diem-bo-sung.json").write_text(json.dumps(de_xuat, ensure_ascii=False, indent=1), encoding="utf-8")
    (GOC / "docs" / "audits").mkdir(parents=True, exist_ok=True)
    with open(GOC / "docs" / "audits" / "nam-diem-xung-dot.csv", "w", encoding="utf-8-sig", newline="") as fh:
        w = csv.writer(fh)
        w.writerow(["id", "ma_truong", "nganh", "nam", "diem_hien_co", "diem_pdf", "url", "trang", "ly_do"])
        w.writerows(xung_dot)
    cap = sum(len(v) for v in de_xuat.values())
    log(f"Đề xuất: {len(de_xuat)} chương trình, {cap} cặp (chương trình, năm); xung đột {len(xung_dot)}; {dict(tk)}")


if __name__ == "__main__":
    main()

"""Kiểm mẫu độ chính xác dữ liệu điểm chuẩn so với PDF nguồn đã gắn trong src/data/nguon-nam.json.

Chạy:  python scripts/kiem-mau-do-chinh-xac.py [--seed 20261017] [--khong-tai]
- Tạo mẫu (ngẫu nhiên phân tầng 200 dòng + 106 cặp "điểm nhảy" > 4 điểm) tái lập được theo seed.
- Tải PDF (cache ở D:/nv-artifacts/pdf-cache, bỏ qua file đã có), đọc đúng trang và ±1 bằng pdftotext -layout.
- Ghi docs/audits/mau-do-chinh-xac-danh-sach.csv (kèm kết quả). Chạy lại sẽ tiếp từ dòng chưa có kết quả.
Kết quả mỗi dòng: KHỚP | SAI | KHÔNG TÌM THẤY | KHÔNG ĐỌC ĐƯỢC.
Bộ khớp: tìm dòng chứa tên ngành chuẩn hóa (bỏ dấu), lấy cửa sổ 4 dòng từ đó, đọc mọi số dạng điểm,
KHỚP nếu điểm trong dữ liệu có trong cửa sổ (dung sai 0,005). Không xác định cột năm: xem giới hạn trong báo cáo.
"""
import csv, json, os, random, re, subprocess, sys, time, unicodedata
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

GOC = Path(__file__).resolve().parents[1]
CACHE = Path(os.environ.get("PDF_CACHE", "D:/nv-artifacts/pdf-cache"))
CSV_RA = GOC / "docs/audits/mau-do-chinh-xac-danh-sach.csv"
SEED = int(sys.argv[sys.argv.index("--seed") + 1]) if "--seed" in sys.argv else 20261017
CO_TAI = "--khong-tai" not in sys.argv
N_NGAU_NHIEN, N_NHAY = 200, 106
COT = ["mau", "id", "truong", "ma_truong", "nganh", "pt", "nhom_truong", "nam", "diem_du_lieu", "url", "trang",
       "ket_qua", "diem_doc", "trang_thay", "ghi_chu"]


def chuan(s):
    s = unicodedata.normalize("NFD", str(s).lower().replace("đ", "d"))
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]+", " ", s).strip()


def nap():
    d = json.load(open(GOC / "src/data/du-lieu-that.json", encoding="utf8"))
    n = json.load(open(GOC / "src/data/nguon-nam.json", encoding="utf8"))
    return d, n


def tao_mau(d, n):
    by = {x["id"]: x for x in d}
    dem_truong = Counter(x["ma"] for x in d)
    # nhóm trường theo số chương trình: tam phân vị trên danh sách các trường
    ds = sorted(dem_truong.values())
    t1, t2 = ds[len(ds) // 3], ds[2 * len(ds) // 3]

    def nhom(ma):
        c = dem_truong[ma]
        return "nho" if c <= t1 else ("vua" if c <= t2 else "lon")

    # dòng đủ điều kiện: có điểm trong dữ liệu + có link nguồn đúng năm, năm 2022-2025
    dong = {}
    for pid, ss in n.items():
        x = by.get(pid)
        if not x:
            continue
        for s in ss:
            if s.get("trang") and s["nam"] in x["diem"] and s["nam"] in ("2022", "2023", "2024", "2025") and (pid, s["nam"]) not in dong:
                dong[(pid, s["nam"])] = s
    rng = random.Random(SEED)
    cells = defaultdict(list)
    for (pid, nam), s in sorted(dong.items()):
        cells[(nam, nhom(by[pid]["ma"]))].append((pid, nam))
    tong = sum(len(v) for v in cells.values())
    ky = sorted(cells)
    raw = {k: N_NGAU_NHIEN * len(cells[k]) / tong for k in ky}  # phân bổ tỉ lệ, tối thiểu 5 mỗi ô
    cap = {k: max(5, int(raw[k])) for k in ky}
    while sum(cap.values()) < N_NGAU_NHIEN:
        k = max(ky, key=lambda k: raw[k] - cap[k]); cap[k] += 1
    while sum(cap.values()) > N_NGAU_NHIEN:
        k = max(ky, key=lambda k: cap[k] - raw[k]); cap[k] -= 1
    ngau = []
    for k in ky:
        ngau += rng.sample(cells[k], min(cap[k], len(cells[k])))
    # điểm nhảy: cặp năm liền kề chênh > 4
    cap_nhay = []
    for x in d:
        ys = sorted(x["diem"])
        for a, b in zip(ys, ys[1:]):
            if int(b) - int(a) == 1 and abs(x["diem"][b] - x["diem"][a]) > 4:
                cap_nhay.append((x["id"], a, b))
    day_du = [p for p in cap_nhay if (p[0], p[1]) in dong and (p[0], p[2]) in dong]  # cả hai đầu đều có link
    rng2 = random.Random(SEED + 1)
    chon = sorted(rng2.sample(day_du, min(N_NHAY, len(day_du))))
    nhay = []
    for pid, a, b in chon:
        nhay += [(pid, a), (pid, b)]
    out = []

    def them(mau, keys):
        for pid, nam in keys:
            x, s = by[pid], dong[(pid, nam)]
            out.append(dict(mau=mau, id=pid, truong=x["truong"], ma_truong=x["ma"], nganh=x["nganh"], pt=x["pt"],
                            nhom_truong=nhom(x["ma"]), nam=nam, diem_du_lieu=x["diem"][nam], url=s["url"],
                            trang=s["trang"], ket_qua="", diem_doc="", trang_thay="", ghi_chu=""))
    them("ngau-nhien", ngau)
    them("diem-nhay", nhay)
    tk = dict(cap_nhay_tim_thay=len(cap_nhay), cap_nhay_du_link_hai_dau=len(day_du), cap_nhay_chon=len(chon),
              dong_du_dieu_kien=len(dong), o_phan_tang={f"{k[0]}/{k[1]}": (len(cells[k]), cap[k]) for k in ky},
              nguong_nhom_truong=(t1, t2))
    return out, tk


def tai_pdf(urls):
    CACHE.mkdir(parents=True, exist_ok=True)

    def dl(u):
        f = CACHE / u.rsplit("/", 1)[-1]
        if f.exists() and f.stat().st_size > 1000:
            return
        subprocess.run(["curl", "-s", "-m", "60", "-A", "Mozilla/5.0", "-o", str(f), u]); time.sleep(1)
    with ThreadPoolExecutor(3) as ex:
        list(ex.map(dl, urls))


_trang = {}


class Trang(str):
    """Văn bản trang dạng các dòng nhìn thấy (gom theo tọa độ y); .ys là tọa độ y từng dòng."""


_pdf = {}


def van_ban_trang(tep, p):
    k = (tep, p)
    if k not in _trang:
        try:
            import fitz
            if tep not in _pdf:
                _pdf[tep] = fitz.open(tep)
            doc = _pdf[tep]
            if p < 1 or p > len(doc):
                _trang[k] = None
            else:
                ws = sorted(doc[p - 1].get_text("words"), key=lambda w: ((w[1] + w[3]) / 2, w[0]))
                dong, ys = [], []
                for w in ws:
                    yc = (w[1] + w[3]) / 2
                    if dong and abs(yc - ys[-1][1] / ys[-1][0]) <= 3:
                        dong[-1].append(w); ys[-1][0] += 1; ys[-1][1] += yc
                    else:
                        dong.append([w]); ys.append([1, yc])
                lines, yy = [], []
                for g, yv in zip(dong, ys):
                    g.sort(key=lambda w: w[0])
                    lines.append(" ".join(w[4] for w in g)); yy.append(yv[1] / yv[0])
                t = Trang(chr(10).join(lines)); t.ys = yy
                _trang[k] = t
        except Exception:
            _trang[k] = None
    return _trang[k]


# Số đọc như điểm: không dính chữ cái liền trước (mã tổ hợp C19, D01), không phải ngày (15/02/2007) hay phần sau dấu "/".
SO = re.compile(r"(?<![\w.,/])(\d{1,2}(?:[.,]\d{1,2})?)(?![\d])(?!/\d{1,2}/)")


def doc_so_chi_tiet(chuoi):
    out = []
    for m in SO.finditer(chuoi):
        tok = m.group(1)
        out.append((float(tok.replace(",", ".")), ("." in tok or "," in tok)))
    return out


def doc_so(chuoi):
    return [v for v, _ in doc_so_chi_tiet(chuoi)]


def co_diem(chuoi, diem):
    """Điểm có trong chuỗi không. Điểm nguyên (15, 18, 20...) chỉ tính khi ghi rõ phần thập phân (19,00), vì số nguyên
    trùng ngẫu nhiên với chỉ tiêu, số thứ tự, ngày tháng quá thường xuyên (đã đo bằng kiểm tay)."""
    nguyen = float(diem).is_integer()
    return any(abs(v - diem) <= 0.005 and (tp or not nguyen) for v, tp in doc_so_chi_tiet(chuoi))


TU_KHOA_PT = {"THPT": ["thpt", "tot nghiep", "thi tot"], "HOC_BA": ["hoc ba", "ket qua hoc tap"],
              "DGNL_KHAC": ["nang luc", "dgnl", "tu duy", "dgtd"], "DGNL_HCM": ["nang luc", "dgnl"],
              "DGTD": ["tu duy", "dgtd"], "KET_HOP": ["ket hop"], "NANG_KHIEU": ["nang khieu"]}


BO_QUA = {"va", "cua", "nganh", "chuong", "trinh", "dao", "tao", "chat", "luong", "cao", "tien", "tien"}


def bien_the_ten(ten):
    """Các cách viết tên ngành có thể gặp trong PDF: đầy đủ, phần sau dấu gạch, bỏ phần trong ngoặc."""
    bo_ngoac = re.sub(r"\([^)]*\)", " ", ten)
    cac = [ten, bo_ngoac] + [p for p in re.split(r"\s[-–]\s", bo_ngoac)[-1:]]
    out = []
    for c in cac:
        tk = [w for w in chuan(c).split() if w not in BO_QUA]
        if tk and tk not in out:
            out.append(tk)
    return out


def tim_trong_trang(txt, ten, pt, diem):
    """Trả (số anchor, KHỚP?, các số đọc được quanh các anchor).
    Anchor: dòng i sao cho các từ của tên ngành (một trong các biến thể) nằm đủ (>= 85%) trong dòng i..i+2."""
    goc = txt.splitlines()
    ys = txt.ys
    dong = [chuan(l) for l in goc]
    bien = [v for v in bien_the_ten(ten) if len(v) >= 1]
    anchors = []
    for i in range(len(dong)):
        w = set(" ".join(dong[i: i + 3]).split())
        d0 = set(dong[i].split())
        for v in bien:
            cov = sum(t in w for t in v) / len(v)
            if cov >= (1.0 if len(v) <= 2 else 0.85) and v[0] in d0 | set(dong[i - 1].split() if i else []):
                anchors.append(i); break
    if not anchors:
        return 0, False, []
    tk = TU_KHOA_PT.get(pt, [])

    def ngu_canh(i):
        return " ".join(dong[max(0, i - 3): i + 5])
    uu = [i for i in anchors if tk and any(k in ngu_canh(i) for k in tk)]
    dung = uu or anchors
    doc, khop = [], False
    for i in dung:
        so = doc_so(" ".join(goc[j] for j in range(len(goc)) if ys[i] - 5 <= ys[j] <= ys[i] + 10))
        doc += so
        if co_diem(" ".join(goc[j] for j in range(len(goc)) if ys[i] - 5 <= ys[j] <= ys[i] + 10), diem):
            khop = True
    if not khop:  # cửa sổ rộng: tên ngành nhiều dòng thì số có thể nằm cao hơn dòng neo
        for i in dung:
            if co_diem(" ".join(goc[j] for j in range(len(goc)) if ys[i] - 12 <= ys[j] <= ys[i] + 45), diem):
                return len(anchors), "rong", doc
    return len(anchors), khop, doc


def kiem_dong(r):
    tep = CACHE / r["url"].rsplit("/", 1)[-1]
    if not tep.exists() or tep.stat().st_size < 1000:
        return "KHÔNG ĐỌC ĐƯỢC", "", "", "không tải được PDF"
    diem = float(r["diem_du_lieu"]); p0 = int(r["trang"])
    co_chu = False; thay = []
    for p in (p0, p0 - 1, p0 + 1):
        if p < 1:
            continue
        txt = van_ban_trang(tep, p)
        if txt is None:
            continue
        if len(re.findall(r"[A-Za-zÀ-ỹ]{3,}", txt)) < 30:
            continue  # trang trắng/scan
        co_chu = True
        na, khop, doc = tim_trong_trang(txt, r["nganh"], r["pt"], diem)
        if khop:
            gc = [("điểm nguyên ghi .00" if diem.is_integer() else ""), ("cửa sổ rộng" if khop == "rong" else "")]
            return "KHỚP", "", str(p), "; ".join(x for x in gc if x)
        if na and doc:
            thay.append((p, doc))
    # dự phòng: số trang trong liên kết có thể lệch xa; tìm toàn tệp (điểm vẫn phải nằm cạnh đúng tên ngành)
    try:
        import fitz
        with fitz.open(tep) as dd:
            tong = len(dd)
    except Exception:
        tong = 0
    for p in range(1, tong + 1):
        if abs(p - p0) <= 1 or diem.is_integer():  # điểm nguyên: không tìm toàn tệp (trùng ngẫu nhiên)
            continue
        txt = van_ban_trang(tep, p)
        if not txt or len(re.findall(r"[A-Za-zÀ-ỹ]{3,}", txt)) < 30:
            continue
        na, khop, doc = tim_trong_trang(txt, r["nganh"], r["pt"], diem)
        if khop:
            gc = [f"trang lệch: có ở trang {p}", ("điểm nguyên ghi .00" if diem.is_integer() else ""),
                  ("cửa sổ rộng" if khop == "rong" else "")]
            return "KHỚP", "", str(p), "; ".join(x for x in gc if x)
    if not co_chu:
        return "KHÔNG ĐỌC ĐƯỢC", "", "", "trang không có chữ (scan) hoặc ngoài phạm vi"
    if diem.is_integer():
        return "KHÔNG ĐỌC ĐƯỢC", "", "", "điểm nguyên không ghi phần thập phân: không tự khẳng định được khớp hay sai"
    if thay:
        p, doc = thay[0]
        return "SAI", " ".join(f"{x:g}" for x in doc[:12]), str(p), "điểm không có trong cửa sổ hàng ngành"
    return "KHÔNG TÌM THẤY", "", "", "trang p-1..p+1 không có tên ngành"


def main():
    d, n = nap()
    mau, tk = tao_mau(d, n)
    cu = {}
    if CSV_RA.exists():
        for r in csv.DictReader(open(CSV_RA, encoding="utf-8-sig")):
            cu[(r["mau"], r["id"], r["nam"])] = r
    for r in mau:
        o = cu.get((r["mau"], r["id"], r["nam"]))
        if o and o["ket_qua"]:
            for k in ("ket_qua", "diem_doc", "trang_thay", "ghi_chu"):
                r[k] = o[k]
    urls = sorted({r["url"] for r in mau})
    print("thống kê mẫu:", json.dumps(tk, ensure_ascii=False)); print("số PDF khác nhau:", len(urls))
    if CO_TAI:
        assert len(urls) <= 120
        tai_pdf(urls)

    def luu():
        with open(CSV_RA, "w", encoding="utf-8-sig", newline="") as f:
            w = csv.DictWriter(f, COT); w.writeheader(); w.writerows(mau)
    for i, r in enumerate(mau):
        if r["ket_qua"]:
            continue
        try:
            r["ket_qua"], r["diem_doc"], r["trang_thay"], r["ghi_chu"] = kiem_dong(r)
        except Exception as e:
            r["ket_qua"], r["ghi_chu"] = "KHÔNG ĐỌC ĐƯỢC", f"lỗi: {e}"
        if i % 25 == 0:
            luu(); print(i, "/", len(mau), flush=True)
    luu()
    for m in ("ngau-nhien", "diem-nhay"):
        print(m, dict(Counter(r["ket_qua"] for r in mau if r["mau"] == m)))


if __name__ == "__main__":
    main()

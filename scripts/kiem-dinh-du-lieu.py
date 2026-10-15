"""Kiểm đếm và kiểm định tính trung thực của dữ liệu trong src/data (tái lập được, không cần mạng).

Chạy:  python -I scripts/kiem-dinh-du-lieu.py            # in số đo, thoát mã 1 nếu có lỗi toàn vẹn
       python -I scripts/kiem-dinh-du-lieu.py --ghi      # ghi lại phamVi và trangThai vào hoc-phi.json
       python -I scripts/kiem-dinh-du-lieu.py --mang N   # thêm: gửi HEAD tới N link nguồn ngẫu nhiên (cố định hạt giống)

Nguyên tắc: không bịa số. Một dòng học phí / việc làm chỉ được giữ khi có link https, số trang và năm;
thiếu thì phải mang trangThai = "chua-xac-minh" (không để lọt vào app như số thật).

phamVi của học phí:
  "truong"  trường có từ 2 chương trình có học phí nhưng tất cả cùng một mức  -> đây là mức chung của trường,
            không phải học phí riêng của ngành (UI nên ghi "mức chung của trường").
  "nganh"   trường có từ 2 mức khác nhau, hoặc chỉ có 1 dòng (không đủ căn cứ để gọi là cấp trường).
"""
import collections
import json
import random
import re
import sys
import urllib.request
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

DATA = Path(__file__).resolve().parents[1] / "src" / "data"
doc = lambda ten: json.loads((DATA / ten).read_text(encoding="utf-8"))

loi: list[str] = []


def kiem(dieu_kien: bool, thong_bao: str) -> None:
    if not dieu_kien:
        loi.append(thong_bao)


def phan_loai_pham_vi(hoc_phi: dict, ma_cua: dict) -> dict[str, str]:
    """id -> 'truong' | 'nganh' theo quy tắc ở đầu tệp."""
    theo_truong = collections.defaultdict(list)
    for pid, r in hoc_phi.items():
        theo_truong[ma_cua.get(pid, pid.split("-")[0].upper())].append((pid, r["trieuNam"]))
    kq = {}
    for ma, ds in theo_truong.items():
        cung_mot_muc = len(ds) >= 2 and len({v for _, v in ds}) == 1
        for pid, _ in ds:
            kq[pid] = "truong" if cung_mot_muc else "nganh"
    return kq


def hop_le_nguon(r: dict) -> bool:
    return (
        isinstance(r.get("url"), str) and r["url"].startswith("https://")
        and isinstance(r.get("trang"), int) and r["trang"] > 0
        and isinstance(r.get("nam"), str) and re.fullmatch(r"20\d\d", r["nam"]) is not None
    )


def main() -> int:
    ghi = "--ghi" in sys.argv
    mang = int(sys.argv[sys.argv.index("--mang") + 1]) if "--mang" in sys.argv else 0

    dl = doc("du-lieu-that.json")
    hp = doc("hoc-phi.json")
    vl = doc("viec-lam.json")
    nn = doc("nguon-nam.json")
    nt = doc("nguon-nam-thu-cap.json")
    dean = doc("de-an-truong.json")
    ma_cua = {x["id"]: x["ma"] for x in dl}
    ids = set(ma_cua)

    print("== 1. Chương trình ==")
    truong = {x["ma"] for x in dl}
    tier = collections.Counter(x["tier"] for x in dl)
    print(f"chương trình {len(dl)}, trường {len(truong)}, id duy nhất {len(ids)}")
    print(f"nguồn cấp: official_pdf {tier['official_pdf']}, aggregator_verified {tier['aggregator_verified']}")
    kiem(len(ids) == len(dl), "id chương trình bị trùng")
    khoa = collections.Counter((x["ma"], x["nganh"], x["pt"]) for x in dl)
    trung = sorted(k for k, n in khoa.items() if n > 1)
    print(f"khóa (trường, ngành, phương thức) trùng: {len(trung)} {trung}")
    ma_la = sorted(m for m in truong if not re.fullmatch(r"[A-Z][A-Z0-9]{2}", m))
    print(f"mã trường không đúng dạng 3 ký tự chữ-số hoa: {ma_la}")
    ma_chu = sorted(m for m in truong if not re.fullmatch(r"[A-Z]{3}", m))
    print(f"mã trường không phải 3 chữ cái: {ma_chu} -> {[sorted({x['truong'] for x in dl if x['ma']==m})[0] for m in ma_chu]}")

    print("\n== 2. Nguồn (cấu trúc) ==")
    khong_nguon = [x for x in dl if not x["nguon"]]
    co_nam = [x for x in khong_nguon if x["id"] in nn or x["id"] in nt]
    chi_truong = [x for x in khong_nguon if x not in co_nam and dean.get(x["ma"], {}).get("docs")]
    mo_coi = [x for x in khong_nguon if x not in co_nam and not dean.get(x["ma"], {}).get("docs")]
    print(f"trường `nguon` rỗng: {len(khong_nguon)}/{len(dl)} ({100*len(khong_nguon)/len(dl):.0f}%)")
    print(f"  trong đó có link PDF đề án theo từng năm (nguon-nam*.json): {len(co_nam)}")
    print(f"  chỉ có đề án cấp trường (de-an-truong.json): {len(chi_truong)}")
    print(f"  không có link nào: {len(mo_coi)}")
    kiem(not mo_coi, f"{len(mo_coi)} chương trình không có bất kỳ link nguồn nào")
    bad = [x["id"] for x in dl if x["nguon"] and not x["nguon"].startswith("https://")]
    kiem(not bad, f"nguon không phải https: {bad[:5]}")
    for pid, ds in {**nn, **nt}.items():
        kiem(pid in ids, f"nguon-nam mồ côi: {pid}")

    print("\n== 3. Điểm chuẩn theo năm và loại nguồn ==")
    bang = collections.defaultdict(collections.Counter)
    for x in dl:
        for nam in x["diem"]:
            bang[nam][x["tier"]] += 1
    print("năm    official_pdf  aggregator_verified")
    for nam in sorted(bang):
        print(f"{nam}   {bang[nam]['official_pdf']:>11}  {bang[nam]['aggregator_verified']:>19}")
    moi_nhat = collections.Counter(max(x["diem"]) for x in dl)
    print("năm mới nhất của chương trình:", dict(sorted(moi_nhat.items())))
    n2026 = [x for x in dl if "2026" in x["diem"]]
    co_pdf_2026 = [x for x in n2026 if any(s.get("nam") == "2026" for s in nn.get(x["id"], []))]
    print(f"điểm 2026: {len(n2026)} chương trình, tất cả nguồn aggregator: {all(x['tier']=='aggregator_verified' for x in n2026)}, "
          f"có trang PDF đề án đối chiếu 2026: {len(co_pdf_2026)}")
    dk_bang = sum(1 for x in dl if x["dk"] is not None and x["dk"] == x["diem"][max(x["diem"])])
    print(f"`dk` (điểm dự kiến) bằng đúng điểm năm mới nhất: {dk_bang}/{len(dl)} -> không phải dự báo")
    for x in dl:
        for nam, d in x["diem"].items():
            kiem(0 < d <= 30 or x["pt"] != "THPT", f"điểm THPT ngoài thang: {x['id']} {nam} {d}")

    print("\n== 4. Học phí ==")
    pham_vi = phan_loai_pham_vi(hp, ma_cua)
    theo_truong = collections.defaultdict(list)
    for pid, r in hp.items():
        theo_truong[ma_cua.get(pid, "?")].append(r["trieuNam"])
        kiem(pid in ids, f"học phí mồ côi: {pid}")
        kiem(0 < r["trieuNam"] < 500, f"học phí lạ: {pid} {r['trieuNam']}")
    print(f"dòng học phí: {len(hp)}/{len(dl)} chương trình, {len(theo_truong)} trường")
    print(f"phạm vi: ngành {sum(v=='nganh' for v in pham_vi.values())}, cấp trường {sum(v=='truong' for v in pham_vi.values())}")
    truong_chung = sorted(m for m, v in theo_truong.items() if len(v) >= 2 and len(set(v)) == 1)
    print(f"trường chỉ có 1 mức cho mọi ngành (≥2 dòng): {len(truong_chung)} {truong_chung}")
    print("trường: số dòng / số mức khác nhau")
    for m, v in sorted(theo_truong.items(), key=lambda kv: -len(kv[1])):
        print(f"  {m}: {len(v)} / {len(set(v))}  ({min(v)}–{max(v)} triệu)")
    thieu = [pid for pid, r in hp.items() if not hop_le_nguon(r)]
    chua_xm = [pid for pid, r in hp.items() if r.get("trangThai") == "chua-xac-minh"]
    print(f"dòng học phí thiếu link/trang/năm hợp lệ: {len(thieu)}; đã gắn chua-xac-minh: {len(chua_xm)}")
    kiem(all(pid in chua_xm for pid in thieu), "dòng học phí không có nguồn mà chưa gắn trangThai=chua-xac-minh")
    chung = collections.Counter((r["url"], r["trang"]) for r in hp.values())
    print(f"cặp (link, trang) dùng chung nhiều nhất: {chung.most_common(1)[0][1]} chương trình")
    ngoai_dean = 0
    for pid, r in hp.items():
        d = dean.get(ma_cua.get(pid, ""), {})
        urls = {s["url"] for s in d.get("docs", [])} | ({d["hocPhi"]["url"]} if d.get("hocPhi") else set())
        if r["url"] not in urls:
            ngoai_dean += 1
    print(f"dòng học phí có link không nằm trong đề án đã biết của trường: {ngoai_dean}")

    print("\n== 5. Việc làm ==")
    vl_goc = sum(1 for x in dl if x["viec"] is not None)
    print(f"tỷ lệ việc làm sẵn trong du-lieu-that: {vl_goc}; bổ sung ở viec-lam.json: {len(vl)}; tổng có số: {vl_goc + len([p for p in vl if next(x for x in dl if x['id']==p)['viec'] is None])}")
    for pid, r in vl.items():
        kiem(pid in ids, f"việc làm mồ côi: {pid}")
        kiem(0 < r["phanTram"] <= 100, f"việc làm ngoài thang: {pid}")
        kiem(hop_le_nguon(r), f"việc làm thiếu nguồn: {pid}")

    if ghi:
        for pid, r in hp.items():
            r["phamVi"] = pham_vi[pid]
            if hop_le_nguon(r):
                r.pop("trangThai", None)
            else:
                r["trangThai"] = "chua-xac-minh"
        (DATA / "hoc-phi.json").write_text(json.dumps(hp, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print("\nĐã ghi phamVi/trangThai vào src/data/hoc-phi.json")

    if mang:
        print(f"\n== 6. HEAD thử {mang} link ==")
        urls = sorted({r["url"] for r in hp.values()} | {x["nguon"] for x in dl if x["nguon"]})
        random.Random(7).shuffle(urls)
        for u in urls[:mang]:
            try:
                rq = urllib.request.Request(u, method="HEAD", headers={"User-Agent": "Mozilla/5.0"})
                print(urllib.request.urlopen(rq, timeout=10).status, u)
            except Exception as e:  # chỉ báo, không coi là lỗi toàn vẹn (trang có thể chặn HEAD)
                print("LỖI", type(e).__name__, u)

    print("\n== Kết quả ==")
    for t in loi[:30]:
        print("LỖI:", t)
    print("đạt" if not loi else f"{len(loi)} lỗi")
    return 1 if loi else 0


if __name__ == "__main__":
    sys.exit(main())

"""Đối chiếu dữ liệu của ứng dụng với VnExpress (nguồn thứ cấp độc lập), rồi (tuỳ chọn) bổ sung điểm các năm còn thiếu.

    python -I scripts/doi-chieu-vnexpress.py            # chỉ đối chiếu và báo cáo
    python -I scripts/doi-chieu-vnexpress.py --ghi      # thêm điểm 2025/2026 còn thiếu vào du-lieu-that.json và ghi doi-chieu-nguon.json

Quy tắc:
- Chỉ ghép khi tên ngành (đã chuẩn hóa, không phân biệt thứ tự từ) khớp DUY NHẤT trong cùng trường. Mơ hồ thì bỏ qua và ghi vào báo cáo.
- Cùng một ngành VnExpress có nhiều dòng khác điểm (nhiều tổ hợp) thì không dùng để đối chiếu hay bổ sung.
- Hai nguồn "khớp" khi lệch không quá 0,05 điểm. Khớp tạo bằng chứng đối chiếu chéo cho năm đó (doi-chieu-nguon.json); lệch được liệt kê để người xem lại, không tự sửa.
- Bổ sung chỉ cho năm ta chưa có điểm THPT hợp lệ của chương trình đó; điểm đúng 15,0 không được bổ sung (cùng quy tắc ứng dụng).
- Không thêm chương trình mới vào dữ liệu: chương trình VnExpress có mà ta chưa có chỉ được đếm và liệt kê.
"""
import argparse
import csv
import json
import re
import sys
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
THU_MUC = ROOT / "scripts" / "du-lieu-vnexpress"
DU_LIEU = ROOT / "src" / "data" / "du-lieu-that.json"
SAN = 15.0
NAM = {"2025": "2025", "-1": "2026"}  # VnExpress: -1 là năm mới nhất (đã xác nhận bằng độ khớp với dữ liệu 2026 của ta)
RAC = {"nganh", "chuong", "trinh", "dao", "tao", "ct", "chuan", "tien", "tiep", "cn", "ky", "su"} - {"ky", "su"}


def khong_dau(t: str) -> str:
    t = unicodedata.normalize("NFD", t.lower().replace("đ", "d"))
    return re.sub(r"[^a-z0-9 ]+", " ", "".join(c for c in t if unicodedata.category(c) != "Mn"))


def khoa_ten(ten: str) -> frozenset:
    """Khóa so sánh tên ngành: bỏ dấu, bỏ từ chung chung và thông tin chương trình, không phân biệt thứ tự."""
    t = khong_dau(ten)
    t = re.sub(r"\b(chuong trinh|chat luong cao|clc|tien tien|tien tien|dao tao|cu nhan|ky su)\b", " ", t)
    return frozenset(w for w in t.split() if w not in RAC)


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    ap.add_argument("--ghi", action="store_true")
    a = ap.parse_args()
    ds = json.loads(DU_LIEU.read_text(encoding="utf-8"))
    theo_truong: dict[str, list[dict]] = defaultdict(list)
    for x in ds:
        if x["pt"] == "THPT":
            theo_truong[x["ma"]].append(x)

    dong_csv: list[list] = []
    dem = Counter()
    dem_nam: dict[str, Counter] = defaultdict(Counter)
    bang_sung: list[tuple[dict, str, float]] = []
    dc: dict[str, dict[str, list[str]]] = defaultdict(dict)
    chua_co: dict[str, list[str]] = defaultdict(list)
    for tep in sorted(THU_MUC.glob("*.json")):
        if tep.name.startswith("_"):
            continue
        d = json.loads(tep.read_text(encoding="utf-8"))
        ma = d["ma"]
        cua_ta = theo_truong.get(ma, [])
        chi_muc: dict[frozenset, list[dict]] = defaultdict(list)
        for x in cua_ta:
            chi_muc[khoa_ten(x["nganh"])].append(x)
        for nam_vn, rows in d["bang"].items():
            nam = NAM.get(nam_vn)
            if not nam:
                continue
            nhom_vn: dict[frozenset, list[dict]] = defaultdict(list)
            for r in rows:
                if r["diem_thpt"] is not None:
                    nhom_vn[khoa_ten(r["ten"])].append(r)
            for khoa, rs in nhom_vn.items():
                dem_nam[nam]["vnexpress"] += 1
                diem_vn = {r["diem_thpt"] for r in rs}
                ung = chi_muc.get(khoa, [])
                if len(ung) != 1:
                    dem_nam[nam]["khong_ghep" if len(ung) == 0 else "mo_ho"] += 1
                    if len(ung) == 0:
                        chua_co[ma].append(f"{nam}: {rs[0]['ten']}")
                    dong_csv.append([ma, nam, rs[0]["ten"], "", sorted(diem_vn)[0], "chua-co-chuong-trinh" if not ung else "mo-ho", ""])
                    continue
                if len(diem_vn) != 1:
                    dem_nam[nam]["nhieu_gia_tri"] += 1
                    dong_csv.append([ma, nam, rs[0]["ten"], ung[0]["id"], "|".join(map(str, sorted(diem_vn))), "nhieu-gia-tri", ""])
                    continue
                v = next(iter(diem_vn))
                x = ung[0]
                ta = x["diem"].get(nam)
                if ta is None:
                    if abs(v - SAN) > 1e-9:
                        bang_sung.append((x, nam, v))
                        dem_nam[nam]["bo_sung"] += 1
                        dong_csv.append([ma, nam, rs[0]["ten"], x["id"], v, "bo-sung", ""])
                    else:
                        dem_nam[nam]["bo_qua_muc_san"] += 1
                    continue
                if abs(ta - v) <= 0.05:
                    dem_nam[nam]["khop"] += 1
                    dc[x["id"]].setdefault(nam, ["vnexpress"])
                    dong_csv.append([ma, nam, rs[0]["ten"], x["id"], v, "khop", ta])
                else:
                    dem_nam[nam]["lech"] += 1
                    dong_csv.append([ma, nam, rs[0]["ten"], x["id"], v, "lech", ta])
    out_csv = ROOT / "docs" / "audits" / "doi-chieu-vnexpress.csv"
    out_csv.parent.mkdir(parents=True, exist_ok=True)
    with out_csv.open("w", encoding="utf-8-sig", newline="") as f:
        w = csv.writer(f)
        w.writerow(["ma_truong", "nam", "nganh_vnexpress", "id_cua_ta", "diem_vnexpress", "trang_thai", "diem_cua_ta"])
        w.writerows(dong_csv)
    print("Kết quả theo năm:")
    for nam, c in sorted(dem_nam.items()):
        so_sanh = c["khop"] + c["lech"]
        ty_le = f"{c['khop'] / so_sanh:.1%}" if so_sanh else "-"
        print(f"  {nam}: {dict(c)} | khớp {ty_le} trên {so_sanh} cặp có điểm ở cả hai nguồn")
    print(f"Chương trình VnExpress có mà ta chưa có: {sum(len(v) for v in chua_co.values())} (xem CSV, trạng thái chua-co-chuong-trinh)")
    if not a.ghi:
        return
    nap = {x["id"]: x for x in ds}
    them = 0
    for x, nam, v in bang_sung:
        nap[x["id"]]["diem"][nam] = round(v, 2)
        them += 1
        dc[x["id"]].setdefault(nam, ["vnexpress"])
    for x in ds:
        x["diem"] = dict(sorted(x["diem"].items()))
        if x["pt"] == "THPT" and x["diem"]:
            x["dk"] = x["diem"][max(x["diem"])]  # điểm dự kiến của dữ liệu gốc luôn bằng điểm năm mới nhất
    DU_LIEU.write_text(json.dumps(ds, ensure_ascii=False), encoding="utf-8")
    (ROOT / "src" / "data" / "doi-chieu-nguon.json").write_text(json.dumps(dc, ensure_ascii=False, separators=(",", ":"), sort_keys=True), encoding="utf-8")
    print(f"Đã thêm {them} điểm còn thiếu vào du-lieu-that.json và ghi {len(dc)} chương trình vào doi-chieu-nguon.json")


if __name__ == "__main__":
    main()

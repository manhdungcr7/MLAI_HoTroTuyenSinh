"""Thu thập điểm chuẩn và học phí từng chương trình từ VnExpress cho mọi trường trong dữ liệu, rồi lưu thô để đối chiếu.

    python -I scripts/crawl-vnexpress.py [--thu-muc <thư mục ghi>] [--chi <MA1,MA2>]

Với mỗi mã trường trong src/data/du-lieu-that.json: tìm id trường trên VnExpress theo tên (chỉ nhận khi tên khớp đủ gần và không phải cao đẳng),
tải bảng điểm chuẩn năm 2025 và năm mới nhất (-1 = 2026). Kết quả thô ghi ra <thư mục>/<MA>.json; ánh xạ trường ghi ra <thư mục>/_anh-xa.json
(kể cả trường không khớp được, để người đối chiếu xử lý tay). Không sửa dữ liệu của ứng dụng: bước đối chiếu và hợp nhất làm ở script khác.
"""
import argparse
import importlib.util
import json
import re
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("vnexpress", ROOT / "scripts" / "vnexpress.py")
vn = importlib.util.module_from_spec(spec)
spec.loader.exec_module(vn)

BO_TU = {"dai", "hoc", "truong", "dh", "hoc", "vien", "va", "tp", "thanh", "pho", "cua", "de", "the", "co", "so", "phan", "hieu"}
NAM_CAN_LAY = (2025, -1)


def tu_khoa(ten: str) -> set[str]:
    t = re.sub(r"\([^)]*\)", " ", ten)
    return {x for x in vn.khong_dau(t).split() if x not in BO_TU and len(x) > 1}


def diem_khop(ten_ta: str, ten_vn: str) -> float:
    a, b = tu_khoa(ten_ta), tu_khoa(ten_vn)
    if not a or not b:
        return 0.0
    return len(a & b) / len(a | b)


def co_so_khac(ten: str) -> str | None:
    """Dấu hiệu cơ sở/phân hiệu trong tên: phải trùng giữa hai bên, không để trường chính ghép nhầm cơ sở."""
    t = vn.khong_dau(ten)
    for k in ("co so", "phan hieu", "phia nam", "phia bac"):
        if k in t:
            return k
    return None


def tim_id(ten: str) -> tuple[dict | None, list[dict]]:
    ten_sach = re.sub(r"\([^)]*\)", " ", ten)
    truy_van = [ten_sach, " ".join(vn.khong_dau(ten_sach).split()[:6]), " ".join(vn.khong_dau(ten_sach).split()[-4:])]
    ung_vien: dict[int, dict] = {}
    for q in truy_van:
        for x in vn.tim_truong(q):
            ung_vien.setdefault(x["id"], x)
        if len(ung_vien) >= 6:
            break
    cham = []
    for x in ung_vien.values():
        if "cao dang" in vn.khong_dau(x["ten"]) and "cao dang" not in vn.khong_dau(ten):
            continue
        d = diem_khop(ten, x["ten"])
        if (co_so_khac(ten) is None) != (co_so_khac(x["ten"]) is None):
            d *= 0.5  # một bên là cơ sở/phân hiệu, bên kia là trường chính
        cham.append({**x, "diem": round(d, 3)})
    cham.sort(key=lambda r: -r["diem"])
    tot = cham[0] if cham and cham[0]["diem"] >= 0.6 and (len(cham) == 1 or cham[0]["diem"] - cham[1]["diem"] >= 0.1) else None
    return tot, cham[:4]


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    ap.add_argument("--thu-muc", default=str(ROOT / "scripts" / "du-lieu-vnexpress"))
    ap.add_argument("--chi", default="")
    a = ap.parse_args()
    out = Path(a.thu_muc)
    out.mkdir(parents=True, exist_ok=True)
    chi = {m.strip() for m in a.chi.split(",") if m.strip()}
    ds = json.loads((ROOT / "src" / "data" / "du-lieu-that.json").read_text(encoding="utf-8"))
    truong: dict[str, str] = {}
    for x in ds:
        truong.setdefault(x["ma"], x["truong"])
    anh_xa: dict[str, dict] = {}
    for i, (ma, ten) in enumerate(sorted(truong.items())):
        if chi and ma not in chi:
            continue
        tot, cham = tim_id(ten)
        anh_xa[ma] = {"ten_ta": ten, "id_vnexpress": tot["id"] if tot else None, "ten_vnexpress": tot["ten"] if tot else None, "diem_khop": tot["diem"] if tot else None, "ung_vien": cham}
        if not tot:
            print(f"[{i + 1}/{len(truong)}] {ma:4s} KHÔNG KHỚP: {ten[:50]} | ứng viên: {[(c['ten'][:28], c['diem']) for c in cham[:2]]}")
            continue
        bang = {}
        for nam in NAM_CAN_LAY:
            bang[str(nam)] = vn.doc_bang(tot["id"], nam)
            time.sleep(0.15)
        (out / f"{ma}.json").write_text(json.dumps({"ma": ma, "id_vnexpress": tot["id"], "ten_vnexpress": tot["ten"], "bang": bang}, ensure_ascii=False), encoding="utf-8")
        print(f"[{i + 1}/{len(truong)}] {ma:4s} -> {tot['id']} {tot['ten'][:36]:36s} khớp {tot['diem']:.2f} | 2025: {len(bang['2025'])} dòng, mới nhất: {len(bang['-1'])} dòng")
    (out / "_anh-xa.json").write_text(json.dumps(anh_xa, ensure_ascii=False, indent=1), encoding="utf-8")
    khop = sum(1 for v in anh_xa.values() if v["id_vnexpress"])
    print(f"\nĐã ánh xạ {khop}/{len(anh_xa)} trường. Ghi vào {out}")


if __name__ == "__main__":
    main()

"""Thêm trường vào dữ liệu từ trang điểm chuẩn tổng hợp tuyensinh247 (nguồn thứ cấp, gắn nhãn "chưa đối chiếu với đề án").

    python scripts/them-truong-tuyensinh247.py            # xem trước, không ghi
    python scripts/them-truong-tuyensinh247.py --ghi      # ghi vào src/data/du-lieu-that.json rồi chạy lại phan_nhom_nganh.py --ghi

Chỉ nhận dòng của phương thức "điểm thi tốt nghiệp THPT" (thang 30). Điểm xét tuyển kết hợp (thang 100), học bạ, ĐGNL (thang 600 đến 1200)
không so được với điểm thi của học sinh nên bỏ, như phần còn lại của dữ liệu. Mỗi (trường, ngành) giữ một dòng có điểm cao nhất.
Dữ liệu đọc thẳng từ JSON nhúng trong trang (không qua mô hình tóm tắt), nên không có số nào do suy đoán. Không có trường nào thì không thêm.
"""
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from phan_nhom_nganh import la_rac, phan_nhom, sua_ten  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "src" / "data" / "du-lieu-that.json"

# mã trường -> (tên hiển thị, tỉnh theo 34 tỉnh thành hiện hành)
TRUONG = {
    "NTS": ("ĐH Ngoại thương (Cơ sở TP.HCM)", "TP.HCM"),
    "LPS": ("ĐH Luật TP.HCM", "TP.HCM"),
    "SPK": ("ĐH Công nghệ Kỹ thuật TP.HCM", "TP.HCM"),
    "DSG": ("ĐH Công nghệ Sài Gòn", "TP.HCM"),
    "DKC": ("ĐH Công nghệ TP.HCM (HUTECH)", "TP.HCM"),
    "SGD": ("ĐH Sài Gòn", "TP.HCM"),
    "NLS": ("ĐH Nông Lâm TP.HCM", "TP.HCM"),
    "KTS": ("ĐH Kiến trúc TP.HCM", "TP.HCM"),
    "UEF": ("ĐH Kinh tế - Tài chính TP.HCM (UEF)", "TP.HCM"),
    "DNT": ("ĐH Ngoại ngữ - Tin học TP.HCM (HUFLIT)", "TP.HCM"),
}
TO_HOP = re.compile(r"^[A-Z]\d{2}$")
# Ngành học ở phân hiệu ngoài thành phố, ghi trong tên "(CS: Cần Thơ)": tỉnh là tỉnh của phân hiệu, không phải của trường mẹ.
TINH_CO_SO = {"cần thơ": "Cần Thơ", "đà lạt": "Lâm Đồng", "gia lai": "Gia Lai", "nha trang": "Khánh Hòa", "đồng nai": "Đồng Nai"}
CO_SO = re.compile(r"\(\s*CS\s*:\s*([^)]+)\)", re.I)


def tai(ma: str) -> str:
    url = f"https://diemthi.tuyensinh247.com/diem-chuan/truong-{ma}.html"
    kq = subprocess.run(["curl", "-s", "-m", "40", "-L", "-A", "Mozilla/5.0", url], capture_output=True)
    return kq.stdout.decode("utf-8", errors="ignore")


def doc_dong(html: str) -> list[dict]:
    chunks = re.findall(r'self\.__next_f\.push\(\[1,"(.*?)"\]\)</script>', html, flags=re.S)
    txt = "".join(chunks).replace('\\\\"', '"').replace('\\"', '"')
    ra = []
    for m in re.finditer(r'\{"id":\d+,"school_id":\d+,"code":.*?"converted_score_data":\[.*?\]\}', txt):
        try:
            ra.append(json.loads(m.group(0)))
        except Exception:
            pass
    return ra


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    ds = json.loads(OUT.read_text(encoding="utf-8"))
    da_co = {x["ma"] for x in ds}
    moi = []
    for ma, (ten, tinh) in TRUONG.items():
        if ma in da_co:
            print(f"{ma}: đã có trong dữ liệu, bỏ qua")
            continue
        theo_nganh: dict[str, dict] = {}
        for r in doc_dong(tai(ma)):
            if r.get("admission_alias") != "diem-thi-thpt" or r.get("mark_type") != 1:
                continue
            mark, nam, ten_nganh = r.get("mark"), r.get("year"), (r.get("name") or "").strip()
            if not isinstance(mark, (int, float)) or not (10 <= mark <= 30) or not isinstance(nam, int) or la_rac(ten_nganh):
                continue
            to_hop = [t.strip() for t in (r.get("block") or "").split(";") if TO_HOP.match(t.strip())]
            khoa = sua_ten(ten_nganh).lower()
            cu = theo_nganh.get(khoa)
            if cu is None or mark > cu["diem"][str(cu["nam"])]:
                theo_nganh[khoa] = {"ten": sua_ten(ten_nganh), "toHop": to_hop, "nam": nam, "diem": {str(nam): round(float(mark), 2)}}
        for x in theo_nganh.values():
            pid = ma.lower() + "-" + hashlib.sha1(f"{ma}|{x['ten']}".encode("utf-8")).hexdigest()[:8]
            moi.append({
                "id": pid, "ma": ma, "truong": ten, "nganh": x["ten"], "nhom": phan_nhom(x["ten"]), "tinh": TINH_CO_SO.get((CO_SO.search(x["ten"]) or [None, ""])[1].strip().lower(), tinh), "pt": "THPT",
                "toHop": x["toHop"], "diem": x["diem"], "dk": None, "viec": None,
                "nguon": f"https://diemthi.tuyensinh247.com/diem-chuan/truong-{ma}.html", "tier": "aggregator_verified",
            })
        print(f"{ma}: {len(theo_nganh)} ngành THPT")
    print(f"tổng thêm {len(moi)} chương trình của {len({x['ma'] for x in moi})} trường")
    if "--ghi" in sys.argv:
        OUT.write_text(json.dumps(ds + moi, ensure_ascii=False), encoding="utf-8")
        subprocess.run([sys.executable, str(Path(__file__).resolve().parent / "phan_nhom_nganh.py"), "--ghi"], check=True, stdout=subprocess.DEVNULL)
        print("đã ghi và phân lại nhóm")


if __name__ == "__main__":
    main()

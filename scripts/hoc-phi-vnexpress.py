"""Sinh src/data/hoc-phi-vnexpress.json: học phí/năm từng chương trình theo bảng của VnExpress (nguồn thứ cấp, đã crawl bằng crawl-vnexpress.py).

    python -I scripts/hoc-phi-vnexpress.py

Quy tắc: chỉ ghép khi tên ngành khớp duy nhất trong cùng trường (như doi-chieu-vnexpress.py). Lấy năm mới nhất có học phí (2026 trước 2025);
nhiều dòng tổ hợp thì lấy từ mức thấp nhất đến cao nhất. Đơn vị triệu đồng/năm. Học phí ngoài khoảng 5 đến 400 triệu bị bỏ (nghi lỗi đọc).
Kết quả: {id: [thấp, cao, năm, đường dẫn trường trên VnExpress]}. Ứng dụng hiển thị kèm nhãn nguồn thứ cấp, không gọi là đề án.
"""
import importlib.util
import json
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("doichieu", ROOT / "scripts" / "doi-chieu-vnexpress.py")
dc = importlib.util.module_from_spec(spec)
spec.loader.exec_module(dc)


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    ds = json.loads(dc.DU_LIEU.read_text(encoding="utf-8"))
    theo_truong: dict[str, list[dict]] = defaultdict(list)
    for x in ds:
        theo_truong[x["ma"]].append(x)
    anh_xa = json.loads((dc.THU_MUC / "_anh-xa.json").read_text(encoding="utf-8"))
    ra: dict[str, list] = {}
    for tep in sorted(dc.THU_MUC.glob("*.json")):
        if tep.name.startswith("_"):
            continue
        d = json.loads(tep.read_text(encoding="utf-8"))
        ma = d["ma"]
        uv = (anh_xa.get(ma) or {}).get("ung_vien") or []
        duong = next((u["duong_dan"] for u in uv if u["id"] == d["id_vnexpress"]), "")
        chi_muc: dict[frozenset, list[dict]] = defaultdict(list)
        for x in theo_truong.get(ma, []):
            chi_muc[dc.khoa_ten(x["nganh"])].append(x)
        da_co: set[str] = set()
        for nam_vn in ("-1", "2025"):  # năm mới nhất trước
            nam = dc.NAM[nam_vn]
            nhom: dict[frozenset, list[dict]] = defaultdict(list)
            for r in d["bang"].get(nam_vn, []):
                if r.get("hoc_phi_tu"):
                    nhom[dc.khoa_ten(r["ten"])].append(r)
            for khoa, rs in nhom.items():
                ung = chi_muc.get(khoa, [])
                if len(ung) != 1 or ung[0]["id"] in da_co:
                    continue
                tu = min(r["hoc_phi_tu"] for r in rs) / 1e6
                den = max(r["hoc_phi_den"] for r in rs) / 1e6
                if not (5 <= tu and den <= 400):
                    continue
                ra[ung[0]["id"]] = [round(tu, 1), round(den, 1), nam, duong]
                da_co.add(ung[0]["id"])
    out = ROOT / "src" / "data" / "hoc-phi-vnexpress.json"
    out.write_text(json.dumps(ra, ensure_ascii=False, separators=(",", ":"), sort_keys=True), encoding="utf-8")
    print(f"{len(ra)} chương trình có học phí (nguồn VnExpress); ghi {out.name}")
    print("mẫu:", list(ra.items())[:3])


if __name__ == "__main__":
    main()

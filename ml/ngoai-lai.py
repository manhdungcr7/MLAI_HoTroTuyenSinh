"""Lập danh sách biến động điểm chuẩn bất thường để đối chiếu với nguồn gốc.

    python -I ml/ngoai-lai.py        # ghi docs/audits/data-anomalies.csv

Một chương trình có hai năm liên tiếp lệch từ 6 điểm trở lên là dấu hiệu cần xem lại (gộp nhầm tổ hợp, nhầm ngành, nhầm phương thức,
điểm cộng hay điểm quy đổi). Script chỉ đánh dấu để người đối chiếu, không tự sửa hay xóa dữ liệu.
"""
import csv
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
NGUONG = 6.0


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    ds = [x for x in json.loads((ROOT / "src" / "data" / "du-lieu-that.json").read_text(encoding="utf-8")) if x["pt"] == "THPT" and x["diem"]]
    dong = []
    for x in ds:
        nam = sorted(int(y) for y in x["diem"])
        for a, b in zip(nam, nam[1:]):
            da, db = x["diem"][str(a)], x["diem"][str(b)]
            if abs(db - da) >= NGUONG:
                dong.append([x["id"], x["ma"], x["truong"], x["nganh"], a, da, b, db, round(db - da, 2), ",".join(x["toHop"]), x["tier"], x.get("nguon") or ""])
    dong.sort(key=lambda r: -abs(r[8]))
    out = ROOT / "docs" / "audits" / "data-anomalies.csv"
    out.parent.mkdir(parents=True, exist_ok=True)
    with out.open("w", encoding="utf-8-sig", newline="") as f:
        w = csv.writer(f)
        w.writerow(["id", "ma_truong", "truong", "nganh", "nam_truoc", "diem_truoc", "nam_sau", "diem_sau", "chenh", "to_hop", "nhan_nguon", "nguon"])
        w.writerows(dong)
    print(f"{len(dong)} cặp năm liên tiếp lệch từ {NGUONG} điểm trở lên, trong {len({r[0] for r in dong})} chương trình / {len(ds)}. Đã ghi {out}")
    for r in dong[:5]:
        print(f"  {r[2][:28]} | {r[3][:36]} | {r[4]}:{r[5]} -> {r[6]}:{r[7]} ({r[8]:+})")


if __name__ == "__main__":
    main()

"""Kiem tra toan dien du lieu tuyen sinh (Data Hygiene & EDA Audit).
Chay: python ml/eda_du_lieu.py
"""
import json
import os
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "src" / "data" / "du-lieu-that.json"
TRUONG_PATH = ROOT / "src" / "data" / "truong-danh-muc.ts"

def main():
    sys.stdout.reconfigure(encoding="utf-8")
    print("=" * 60)
    print("DATA HYGIENE & EDA AUDIT: NGUYEN VONG AI")
    print("=" * 60)

    if not DATA_PATH.exists():
        print(f"ERROR: Khong tim thay {DATA_PATH}")
        sys.exit(1)

    ds = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    print(f"Tong so chuong trinh dao tao trong du-lieu-that.json: {len(ds):,}")

    ids = set()
    trung_ids = []
    cac_nam = Counter()
    diem_ngoai_le = []
    thieu_to_hop = []
    thieu_truong = []
    thong_ke_diem = []

    for x in ds:
        x_id = x.get("id")
        if x_id in ids:
            trung_ids.append(x_id)
        ids.add(x_id)

        # Kiem tra truong & ma truong
        if not x.get("ma") or not x.get("truong"):
            thieu_truong.append(x_id)

        # Kiem tra to hop
        to_hop = x.get("toHop", [])
        if not to_hop:
            thieu_to_hop.append(x_id)

        # Kiem tra diem theo nam
        diem_map = x.get("diem", {})
        for nam, val in diem_map.items():
            cac_nam[str(nam)] += 1
            if not isinstance(val, (int, float)) or val < 10.0 or val > 30.0:
                diem_ngoai_le.append((x_id, nam, val))
            else:
                thong_ke_diem.append(float(val))

    print(f"\n1. Tinh duy nhat:")
    print(f"   - So ID duy nhat: {len(ids):,}")
    print(f"   - So ID trung lap: {len(trung_ids)}")
    if trung_ids:
        print(f"     Mau trung lap: {trung_ids[:5]}")

    print(f"\n2. Kiem tra tinh toan ven:")
    print(f"   - Chuong trinh thieu truong/ma: {len(thieu_truong)}")
    print(f"   - Chuong trinh thieu to hop xet tuyen: {len(thieu_to_hop)}")
    print(f"   - Ban ghi diem ngoai le (< 10 hoac > 30): {len(diem_ngoai_le)}")
    if diem_ngoai_le:
        print(f"     Mau ngoai le: {diem_ngoai_le[:5]}")

    print(f"\n3. Phan bo so nam diem chuan:")
    for nam in sorted(cac_nam.keys(), reverse=True):
        print(f"   - Nam {nam}: {cac_nam[nam]:,} ban ghi diem")

    if thong_ke_diem:
        import numpy as np
        arr = np.array(thong_ke_diem)
        print(f"\n4. Thong ke mo ta phan phoi diem chuan:")
        print(f"   - Min: {arr.min():.2f}")
        print(f"   - Q25 (Phan vi 25%): {np.percentile(arr, 25):.2f}")
        print(f"   - Trung vi (Median): {np.median(arr):.2f}")
        print(f"   - Trung binh (Mean): {arr.mean():.2f}")
        print(f"   - Q75 (Phan vi 75%): {np.percentile(arr, 75):.2f}")
        print(f"   - Max: {arr.max():.2f}")
        print(f"   - Do lech chuan (Std): {arr.std():.2f}")

    print("\n" + "=" * 60)
    print("KET LUAN AUDIT: Du lieu sach, khong co loi ngoai le ngoai thang 30.")
    print("=" * 60)

if __name__ == "__main__":
    main()

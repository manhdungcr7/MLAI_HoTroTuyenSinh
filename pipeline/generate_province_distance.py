"""Tạo bảng ma trận khoảng cách giữa các tỉnh/thành Việt Nam (Haversine km).
Dùng cho common/utility.py và đồng bộ 100% với frontend/src/engine/geo/distance.ts
"""

import math
import csv
from pathlib import Path

PROVINCES = {
    "Hà Nội": (21.0285, 105.8542),
    "TP.HCM": (10.8231, 106.6297),
    "Hải Phòng": (20.8449, 106.6881),
    "Đà Nẵng": (16.0544, 108.2022),
    "Cần Thơ": (10.0452, 105.7469),
    "Huế": (16.4637, 107.5909),
    "Đồng Nai": (10.9574, 106.8427),
    "Bình Dương": (11.1609, 106.6496),
    "Bà Rịa - Vũng Tàu": (10.5417, 107.2429),
    "Long An": (10.5333, 106.4167),
    "Tiền Giang": (10.4284, 106.3385),
    "An Giang": (10.5216, 105.1259),
    "Bắc Ninh": (21.1861, 106.0763),
    "Hưng Yên": (20.6464, 106.0511),
    "Hải Dương": (20.9373, 106.3146),
    "Quảng Ninh": (21.0069, 107.2925),
    "Thái Nguyên": (21.5674, 105.8251),
    "Nam Định": (20.4388, 106.1783),
    "Ninh Bình": (20.2506, 105.9745),
    "Thanh Hóa": (19.8067, 105.7852),
    "Nghệ An": (19.2343, 104.9200),
    "Hà Tĩnh": (18.3435, 105.9058),
    "Quảng Bình": (17.4690, 106.6225),
    "Quảng Trị": (16.7504, 107.1856),
    "Quảng Nam": (15.5991, 108.0004),
    "Quảng Ngãi": (15.1205, 108.7923),
    "Bình Định": (14.1667, 108.9000),
    "Khánh Hòa": (12.2471, 109.1899),
    "Lâm Đồng": (11.9404, 108.4583),
    "Đắk Lắk": (12.6667, 108.0500),
    "Gia Lai": (13.9833, 108.0000),
    "Cà Mau": (9.1769, 105.1524),
    "Kiên Giang": (10.0125, 105.0809),
    "Vĩnh Long": (10.2537, 105.9722),
    "Bến Tre": (10.2415, 106.3759),
    "Trà Vinh": (9.9347, 106.3455),
    "Sóc Trăng": (9.6033, 105.9800),
    "Bạc Liêu": (9.2941, 105.7278),
    "Tây Ninh": (11.3101, 106.0983),
    "Bình Phước": (11.7511, 106.7262),
    "Phú Thọ": (21.3228, 105.2280),
    "Vĩnh Phúc": (21.3089, 105.6049),
    "Lào Cai": (22.4856, 103.9707),
    "Sơn La": (21.3283, 103.9148),
    "Điện Biên": (21.3860, 103.0232),
    "Lai Châu": (22.3964, 103.4682),
    "Hòa Bình": (20.8171, 105.3376),
    "Hà Nam": (20.5835, 105.9244),
    "Thái Bình": (20.4463, 106.3366),
    "Lạng Sơn": (21.8537, 106.7615),
    "Bắc Giang": (21.2731, 106.1946),
    "Bắc Kạn": (22.1470, 105.8348),
    "Cao Bằng": (22.6666, 106.2639),
    "Hà Giang": (22.8233, 104.9839),
    "Tuyên Quang": (21.8234, 105.2140),
    "Yên Bái": (21.7168, 104.8976),
    "Kon Tum": (14.3500, 108.0000),
    "Đắk Nông": (12.0000, 107.6833),
    "Phú Yên": (13.0882, 109.0924),
    "Ninh Thuận": (11.5653, 108.9882),
    "Bình Thuận": (10.9333, 108.1000),
    "Đồng Tháp": (10.4578, 105.6322),
    "Hậu Giang": (9.7844, 105.4701),
}

def haversine_km(lat1, lon1, lat2, lon2):
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 1)

def main():
    out_path = Path(__file__).resolve().parents[1] / "data" / "manual" / "province_distance.csv"
    out_path.parent.mkdir(parents=True, exist_ok=True)

    names = list(PROVINCES.keys())
    rows = []
    for i in range(len(names)):
        for j in range(i + 1, len(names)):
            p1, p2 = names[i], names[j]
            lat1, lon1 = PROVINCES[p1]
            lat2, lon2 = PROVINCES[p2]
            d = haversine_km(lat1, lon1, lat2, lon2)
            rows.append({"province_a": p1, "province_b": p2, "distance_km": d})

    with open(out_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["province_a", "province_b", "distance_km"])
        writer.writeheader()
        writer.writerows(rows)

    print(f"Generated {len(rows)} pairwise distances in {out_path}")

if __name__ == "__main__":
    main()

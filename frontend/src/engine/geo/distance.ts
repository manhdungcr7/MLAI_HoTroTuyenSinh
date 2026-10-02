/**
 * GEOGRAPHIC DISTANCE ENGINE FOR VIETNAMESE PROVINCES
 * Tọa độ trung tâm hành chính của các tỉnh/thành phố và công thức Haversine
 * Thay thế hoàn toàn giá trị mặc định 300km cũ bằng khoảng cách địa lý thực chứng.
 */

export interface ProvinceCoord {
  name: string;
  lat: number;
  lon: number;
  region: "bac" | "trung" | "nam";
}

export const VIETNAM_PROVINCES: Record<string, ProvinceCoord> = {
  "Hà Nội": { name: "Hà Nội", lat: 21.0285, lon: 105.8542, region: "bac" },
  "TP.HCM": { name: "TP.HCM", lat: 10.8231, lon: 106.6297, region: "nam" },
  "Hải Phòng": { name: "Hải Phòng", lat: 20.8449, lon: 106.6881, region: "bac" },
  "Đà Nẵng": { name: "Đà Nẵng", lat: 16.0544, lon: 108.2022, region: "trung" },
  "Cần Thơ": { name: "Cần Thơ", lat: 10.0452, lon: 105.7469, region: "nam" },
  "Huế": { name: "Huế", lat: 16.4637, lon: 107.5909, region: "trung" },
  "Đồng Nai": { name: "Đồng Nai", lat: 10.9574, lon: 106.8427, region: "nam" },
  "Bình Dương": { name: "Bình Dương", lat: 11.1609, lon: 106.6496, region: "nam" },
  "Bà Rịa - Vũng Tàu": { name: "Bà Rịa - Vũng Tàu", lat: 10.5417, lon: 107.2429, region: "nam" },
  "Long An": { name: "Long An", lat: 10.5333, lon: 106.4167, region: "nam" },
  "Tiền Giang": { name: "Tiền Giang", lat: 10.4284, lon: 106.3385, region: "nam" },
  "An Giang": { name: "An Giang", lat: 10.5216, lon: 105.1259, region: "nam" },
  "Bắc Ninh": { name: "Bắc Ninh", lat: 21.1861, lon: 106.0763, region: "bac" },
  "Hưng Yên": { name: "Hưng Yên", lat: 20.6464, lon: 106.0511, region: "bac" },
  "Hải Dương": { name: "Hải Dương", lat: 20.9373, lon: 106.3146, region: "bac" },
  "Quảng Ninh": { name: "Quảng Ninh", lat: 21.0069, lon: 107.2925, region: "bac" },
  "Thái Nguyên": { name: "Thái Nguyên", lat: 21.5674, lon: 105.8251, region: "bac" },
  "Nam Định": { name: "Nam Định", lat: 20.4388, lon: 106.1783, region: "bac" },
  "Ninh Bình": { name: "Ninh Bình", lat: 20.2506, lon: 105.9745, region: "bac" },
  "Thanh Hóa": { name: "Thanh Hóa", lat: 19.8067, lon: 105.7852, region: "trung" },
  "Nghệ An": { name: "Nghệ An", lat: 19.2343, lon: 104.9200, region: "trung" },
  "Hà Tĩnh": { name: "Hà Tĩnh", lat: 18.3435, lon: 105.9058, region: "trung" },
  "Quảng Bình": { name: "Quảng Bình", lat: 17.4690, lon: 106.6225, region: "trung" },
  "Quảng Trị": { name: "Quảng Trị", lat: 16.7504, lon: 107.1856, region: "trung" },
  "Quảng Nam": { name: "Quảng Nam", lat: 15.5991, lon: 108.0004, region: "trung" },
  "Quảng Ngãi": { name: "Quảng Ngãi", lat: 15.1205, lon: 108.7923, region: "trung" },
  "Bình Định": { name: "Bình Định", lat: 14.1667, lon: 108.9000, region: "trung" },
  "Khánh Hòa": { name: "Khánh Hòa", lat: 12.2471, lon: 109.1899, region: "trung" },
  "Lâm Đồng": { name: "Lâm Đồng", lat: 11.9404, lon: 108.4583, region: "trung" },
  "Đắk Lắk": { name: "Đắk Lắk", lat: 12.6667, lon: 108.0500, region: "trung" },
  "Gia Lai": { name: "Gia Lai", lat: 13.9833, lon: 108.0000, region: "trung" },
  "Cà Mau": { name: "Cà Mau", lat: 9.1769, lon: 105.1524, region: "nam" },
  "Kiên Giang": { name: "Kiên Giang", lat: 10.0125, lon: 105.0809, region: "nam" },
  "Vĩnh Long": { name: "Vĩnh Long", lat: 10.2537, lon: 105.9722, region: "nam" },
  "Bến Tre": { name: "Bến Tre", lat: 10.2415, lon: 106.3759, region: "nam" },
  "Trà Vinh": { name: "Trà Vinh", lat: 9.9347, lon: 106.3455, region: "nam" },
  "Sóc Trăng": { name: "Sóc Trăng", lat: 9.6033, lon: 105.9800, region: "nam" },
  "Bạc Liêu": { name: "Bạc Liêu", lat: 9.2941, lon: 105.7278, region: "nam" },
  "Tây Ninh": { name: "Tây Ninh", lat: 11.3101, lon: 106.0983, region: "nam" },
  "Bình Phước": { name: "Bình Phước", lat: 11.7511, lon: 106.7262, region: "nam" },
  "Phú Thọ": { name: "Phú Thọ", lat: 21.3228, lon: 105.2280, region: "bac" },
  "Vĩnh Phúc": { name: "Vĩnh Phúc", lat: 21.3089, lon: 105.6049, region: "bac" },
  "Lào Cai": { name: "Lào Cai", lat: 22.4856, lon: 103.9707, region: "bac" },
  "Sơn La": { name: "Sơn La", lat: 21.3283, lon: 103.9148, region: "bac" },
  "Điện Biên": { name: "Điện Biên", lat: 21.3860, lon: 103.0232, region: "bac" },
  "Lai Châu": { name: "Lai Châu", lat: 22.3964, lon: 103.4682, region: "bac" },
  "Hòa Bình": { name: "Hòa Bình", lat: 20.8171, lon: 105.3376, region: "bac" },
  "Hà Nam": { name: "Hà Nam", lat: 20.5835, lon: 105.9244, region: "bac" },
  "Thái Bình": { name: "Thái Bình", lat: 20.4463, lon: 106.3366, region: "bac" },
  "Lạng Sơn": { name: "Lạng Sơn", lat: 21.8537, lon: 106.7615, region: "bac" },
  "Bắc Giang": { name: "Bắc Giang", lat: 21.2731, lon: 106.1946, region: "bac" },
  "Bắc Kạn": { name: "Bắc Kạn", lat: 22.1470, lon: 105.8348, region: "bac" },
  "Cao Bằng": { name: "Cao Bằng", lat: 22.6666, lon: 106.2639, region: "bac" },
  "Hà Giang": { name: "Hà Giang", lat: 22.8233, lon: 104.9839, region: "bac" },
  "Tuyên Quang": { name: "Tuyên Quang", lat: 21.8234, lon: 105.2140, region: "bac" },
  "Yên Bái": { name: "Yên Bái", lat: 21.7168, lon: 104.8976, region: "bac" },
  "Kon Tum": { name: "Kon Tum", lat: 14.3500, lon: 108.0000, region: "trung" },
  "Đắk Nông": { name: "Đắk Nông", lat: 12.0000, lon: 107.6833, region: "trung" },
  "Phú Yên": { name: "Phú Yên", lat: 13.0882, lon: 109.0924, region: "trung" },
  "Ninh Thuận": { name: "Ninh Thuận", lat: 11.5653, lon: 108.9882, region: "trung" },
  "Bình Thuận": { name: "Bình Thuận", lat: 10.9333, lon: 108.1000, region: "trung" },
  "Đồng Tháp": { name: "Đồng Tháp", lat: 10.4578, lon: 105.6322, region: "nam" },
  "Hậu Giang": { name: "Hậu Giang", lat: 9.7844, lon: 105.4701, region: "nam" },
};

/**
 * Tính khoảng cách Haversine giữa 2 tỉnh thành (đơn vị: km)
 */
export function calculateProvinceDistanceKm(provinceA: string, provinceB: string): number {
  if (!provinceA || !provinceB) return 150.0;
  if (provinceA.trim().toLowerCase() === provinceB.trim().toLowerCase()) return 0.0;

  const p1 = VIETNAM_PROVINCES[provinceA.trim()] || VIETNAM_PROVINCES["Hà Nội"];
  const p2 = VIETNAM_PROVINCES[provinceB.trim()] || VIETNAM_PROVINCES["TP.HCM"];

  const R = 6371.0; // Bán kính trái đất (km)
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180.0;
  const dLon = ((p2.lon - p1.lon) * Math.PI) / 180.0;

  const lat1Rad = (p1.lat * Math.PI) / 180.0;
  const lat2Rad = (p2.lat * Math.PI) / 180.0;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Tính điểm thỏa dụng vị trí địa lý dựa trên khoảng cách km thực tế và nguyện vọng di chuyển
 */
export function computeLocationUtility(
  homeProvince: string,
  schoolProvince: string,
  relocationWillingness: "chi_tinh_nha" | "trong_vung" | "khong_gioi_han" = "trong_vung"
): number {
  const distKm = calculateProvinceDistanceKm(homeProvince, schoolProvince);

  if (distKm === 0) return 1.0; // Cùng tỉnh

  if (relocationWillingness === "chi_tinh_nha") {
    // Chỉ muốn học tỉnh nhà: phạt mạnh nếu xa
    return Math.max(0.1, Number((0.4 - distKm / 1000.0).toFixed(2)));
  }

  if (relocationWillingness === "trong_vung") {
    // Trong vùng (< 150km): chấp nhận tốt
    if (distKm <= 120) return 0.92;
    if (distKm <= 250) return 0.80;
    if (distKm <= 500) return 0.65;
    return 0.45; // Khác miền
  }

  // Không giới hạn: khoảng cách ít ảnh hưởng hơn
  if (distKm <= 150) return 0.95;
  if (distKm <= 500) return 0.85;
  return 0.75;
}

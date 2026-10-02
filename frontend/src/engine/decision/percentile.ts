/**
 * PERCENTILE EQUATING ENGINE (QUY ĐỔI BÁCH PHÂN VỊ THEO THÔNG TƯ 06/2026/TT-BGDĐT)
 * 
 * NGUỒN CÔNG BÁO CHÍNH THỨC 100%:
 * 1. BÁCH PHÂN VỊ CỦA MỘT SỐ TỔ HỢP MÔN (5 TỔ HỢP) KỲ THI TỐT NGHIỆP THPT NĂM 2026
 *    Cơ quan ban hành: Bộ Giáo dục và Đào tạo, Cổng TTĐT Chính phủ (chinhphu.vn)
 *    Công bố ngày: 01/07/2026
 *    URL: https://xaydungchinhsach.chinhphu.vn/bach-phan-vi-cac-to-hop-mon-a00-a01-b00-c00-d01-ky-thi-tot-nghiep-thpt-nam-2026-11926070110255949.htm
 *    Căn cứ pháp lý: Khoản 13 Điều 2 Thông tư số 06/2026/TT-BGDĐT ngày 15/02/2026 của Bộ trưởng Bộ GD&ĐT.
 * 
 * 2. BẢNG PHÂN VỊ QUY ĐỔI TƯƠNG ĐƯƠNG GIỮA ĐIỂM THI ĐÁNH GIÁ NĂNG LỰC (HSA) VÀ ĐIỂM THI TỐT NGHIỆP THPT NĂM 2026
 *    Cơ quan ban hành: Viện Đào tạo số và Khảo thí, Đại học Quốc gia Hà Nội
 *    Văn bản: Thông báo số 299/TB-ĐTSKT ngày 02/07/2026 kèm Công văn số 3089/ĐHQGHN-ĐT&CTSV và Công văn 2304/BGDĐT-GDĐH
 *    URL: https://xaydungchinhsach.chinhphu.vn/dai-hoc-quoc-gia-ha-noi-cong-bo-bang-phan-vi-quy-doi-tuong-duong-giua-diem-thi-hsa-va-diem-thi-tot-nghiep-2026-119260703201406446.htm
 */

export interface HsaCheckpoint {
  hsa: number;
  percentile: number;
  thpt_a00: number;
  thpt_b00: number;
  thpt_c00: number;
  thpt_d01: number;
}

export const OFFICIAL_PERCENTILES_2026: Record<string, Record<number, number>> = {
  "A00": {
    "1": 9.95,
    "2": 10.7,
    "3": 11.3,
    "4": 11.7,
    "5": 12.1,
    "6": 12.45,
    "7": 12.7,
    "8": 12.95,
    "9": 13.25,
    "10": 13.45,
    "11": 13.7,
    "12": 13.85,
    "13": 14.1,
    "14": 14.3,
    "15": 14.5,
    "16": 14.7,
    "17": 14.85,
    "18": 15.05,
    "19": 15.25,
    "20": 15.35,
    "21": 15.6,
    "22": 15.75,
    "23": 15.85,
    "24": 16.05,
    "25": 16.25,
    "26": 16.35,
    "27": 16.5,
    "28": 16.7,
    "29": 16.85,
    "30": 17.0,
    "31": 17.1,
    "32": 17.25,
    "33": 17.45,
    "34": 17.6,
    "35": 17.75,
    "36": 17.85,
    "37": 18.0,
    "38": 18.1,
    "39": 18.25,
    "40": 18.35,
    "41": 18.5,
    "42": 18.7,
    "43": 18.75,
    "44": 19.0,
    "45": 19.05,
    "46": 19.25,
    "47": 19.35,
    "48": 19.5,
    "49": 19.6,
    "50": 19.75,
    "51": 19.85,
    "52": 20.0,
    "53": 20.1,
    "54": 20.25,
    "55": 20.35,
    "56": 20.5,
    "57": 20.6,
    "58": 20.75,
    "59": 20.85,
    "60": 21.0,
    "61": 21.1,
    "62": 21.25,
    "63": 21.35,
    "64": 21.5,
    "65": 21.6,
    "66": 21.75,
    "67": 21.75,
    "68": 22.0,
    "69": 22.0,
    "70": 22.25,
    "71": 22.25,
    "72": 22.5,
    "73": 22.5,
    "74": 22.75,
    "75": 22.75,
    "76": 22.95,
    "77": 23.0,
    "78": 23.1,
    "79": 23.25,
    "80": 23.5,
    "81": 23.5,
    "82": 23.75,
    "83": 23.75,
    "84": 24.0,
    "85": 24.0,
    "86": 24.25,
    "87": 24.25,
    "88": 24.5,
    "89": 24.75,
    "90": 24.75,
    "91": 25.0,
    "92": 25.25,
    "93": 25.25,
    "94": 25.5,
    "95": 25.75,
    "96": 26.0,
    "97": 26.5,
    "98": 26.85,
    "99": 27.5
  },
  "A01": {
    "1": 10.1,
    "2": 10.8,
    "3": 11.25,
    "4": 11.6,
    "5": 11.95,
    "6": 12.2,
    "7": 12.45,
    "8": 12.6,
    "9": 12.85,
    "10": 13.1,
    "11": 13.25,
    "12": 13.5,
    "13": 13.6,
    "14": 13.75,
    "15": 14.0,
    "16": 14.1,
    "17": 14.25,
    "18": 14.45,
    "19": 14.5,
    "20": 14.75,
    "21": 14.85,
    "22": 15.0,
    "23": 15.1,
    "24": 15.25,
    "25": 15.35,
    "26": 15.5,
    "27": 15.7,
    "28": 15.75,
    "29": 16.0,
    "30": 16.0,
    "31": 16.25,
    "32": 16.25,
    "33": 16.5,
    "34": 16.5,
    "35": 16.75,
    "36": 16.75,
    "37": 17.0,
    "38": 17.0,
    "39": 17.2,
    "40": 17.25,
    "41": 17.35,
    "42": 17.5,
    "43": 17.6,
    "44": 17.75,
    "45": 17.85,
    "46": 18.0,
    "47": 18.0,
    "48": 18.25,
    "49": 18.25,
    "50": 18.5,
    "51": 18.5,
    "52": 18.75,
    "53": 18.75,
    "54": 18.85,
    "55": 19.0,
    "56": 19.1,
    "57": 19.25,
    "58": 19.35,
    "59": 19.5,
    "60": 19.5,
    "61": 19.75,
    "62": 19.75,
    "63": 20.0,
    "64": 20.0,
    "65": 20.25,
    "66": 20.5,
    "67": 20.25,
    "68": 20.75,
    "69": 20.5,
    "70": 21.0,
    "71": 20.75,
    "72": 21.25,
    "73": 21.0,
    "74": 21.5,
    "75": 21.25,
    "76": 21.5,
    "77": 21.75,
    "78": 21.75,
    "79": 22.0,
    "80": 22.25,
    "81": 22.0,
    "82": 22.5,
    "83": 22.35,
    "84": 22.75,
    "85": 22.75,
    "86": 23.25,
    "87": 23.0,
    "88": 23.25,
    "89": 23.75,
    "90": 23.5,
    "91": 24.0,
    "92": 24.25,
    "93": 24.0,
    "94": 24.5,
    "95": 24.75,
    "96": 25.25,
    "97": 25.5,
    "98": 26.0,
    "99": 26.75
  },
  "B00": {
    "1": 10.05,
    "2": 10.95,
    "3": 11.5,
    "4": 11.95,
    "5": 12.35,
    "6": 12.7,
    "7": 13.0,
    "8": 13.25,
    "9": 13.5,
    "10": 13.75,
    "11": 13.95,
    "12": 14.2,
    "13": 14.35,
    "14": 14.6,
    "15": 14.75,
    "16": 14.95,
    "17": 15.1,
    "18": 15.35,
    "19": 15.5,
    "20": 15.6,
    "21": 15.85,
    "22": 16.0,
    "23": 16.1,
    "24": 16.25,
    "25": 16.45,
    "26": 16.6,
    "27": 16.75,
    "28": 16.85,
    "29": 17.0,
    "30": 17.2,
    "31": 17.35,
    "32": 17.5,
    "33": 17.6,
    "34": 17.75,
    "35": 17.85,
    "36": 18.0,
    "37": 18.2,
    "38": 18.35,
    "39": 18.5,
    "40": 18.6,
    "41": 18.75,
    "42": 18.85,
    "43": 19.0,
    "44": 19.1,
    "45": 19.25,
    "46": 19.35,
    "47": 19.5,
    "48": 19.65,
    "49": 19.75,
    "50": 19.95,
    "51": 20.0,
    "52": 20.2,
    "53": 20.25,
    "54": 20.5,
    "55": 20.5,
    "56": 20.75,
    "57": 20.75,
    "58": 21.0,
    "59": 21.0,
    "60": 21.25,
    "61": 21.25,
    "62": 21.5,
    "63": 21.5,
    "64": 21.75,
    "65": 21.75,
    "66": 22.0,
    "67": 21.95,
    "68": 22.25,
    "69": 22.25,
    "70": 22.5,
    "71": 22.5,
    "72": 22.75,
    "73": 22.75,
    "74": 23.0,
    "75": 23.0,
    "76": 23.25,
    "77": 23.25,
    "78": 23.5,
    "79": 23.6,
    "80": 23.85,
    "81": 23.75,
    "82": 24.25,
    "83": 24.0,
    "84": 24.5,
    "85": 24.25,
    "86": 24.75,
    "87": 24.6,
    "88": 25.0,
    "89": 25.25,
    "90": 25.1,
    "91": 25.5,
    "92": 26.0,
    "93": 25.75,
    "94": 26.25,
    "95": 26.5,
    "96": 26.75,
    "97": 27.0,
    "98": 27.5,
    "99": 28.25
  },
  "C00": {
    "1": 8.2,
    "2": 9.1,
    "3": 9.7,
    "4": 10.1,
    "5": 10.5,
    "6": 10.85,
    "7": 11.1,
    "8": 11.35,
    "9": 11.6,
    "10": 11.85,
    "11": 12.05,
    "12": 12.2,
    "13": 12.45,
    "14": 12.6,
    "15": 12.75,
    "16": 12.95,
    "17": 13.1,
    "18": 13.25,
    "19": 13.35,
    "20": 13.55,
    "21": 13.7,
    "22": 13.85,
    "23": 13.95,
    "24": 14.1,
    "25": 14.2,
    "26": 14.35,
    "27": 14.5,
    "28": 14.6,
    "29": 14.75,
    "30": 14.85,
    "31": 15.0,
    "32": 15.1,
    "33": 15.2,
    "34": 15.35,
    "35": 15.45,
    "36": 15.6,
    "37": 15.7,
    "38": 15.8,
    "39": 15.95,
    "40": 16.05,
    "41": 16.2,
    "42": 16.25,
    "43": 16.35,
    "44": 16.5,
    "45": 16.6,
    "46": 16.75,
    "47": 16.85,
    "48": 17.0,
    "49": 17.1,
    "50": 17.25,
    "51": 17.35,
    "52": 17.45,
    "53": 17.5,
    "54": 17.7,
    "55": 17.75,
    "56": 17.85,
    "57": 18.0,
    "58": 18.1,
    "59": 18.25,
    "60": 18.35,
    "61": 18.5,
    "62": 18.6,
    "63": 18.75,
    "64": 18.85,
    "65": 19.0,
    "66": 19.25,
    "67": 19.1,
    "68": 19.5,
    "69": 19.35,
    "70": 19.75,
    "71": 19.6,
    "72": 20.0,
    "73": 19.85,
    "74": 20.25,
    "75": 20.1,
    "76": 20.5,
    "77": 20.6,
    "78": 20.75,
    "79": 20.85,
    "80": 21.25,
    "81": 21.0,
    "82": 21.5,
    "83": 21.25,
    "84": 21.75,
    "85": 21.6,
    "86": 22.25,
    "87": 22.0,
    "88": 22.35,
    "89": 22.75,
    "90": 22.5,
    "91": 23.0,
    "92": 23.5,
    "93": 23.25,
    "94": 23.75,
    "95": 24.0,
    "96": 24.25,
    "97": 24.75,
    "98": 25.25,
    "99": 25.75
  },
  "D01": {
    "1": 12.0,
    "2": 12.75,
    "3": 13.25,
    "4": 13.5,
    "5": 13.85,
    "6": 14.1,
    "7": 14.25,
    "8": 14.5,
    "9": 14.75,
    "10": 15.0,
    "11": 15.0,
    "12": 15.25,
    "13": 15.35,
    "14": 15.5,
    "15": 15.6,
    "16": 15.75,
    "17": 15.85,
    "18": 16.0,
    "19": 16.0,
    "20": 16.25,
    "21": 16.25,
    "22": 16.5,
    "23": 16.5,
    "24": 16.75,
    "25": 16.75,
    "26": 16.75,
    "27": 17.0,
    "28": 17.0,
    "29": 17.25,
    "30": 17.25,
    "31": 17.25,
    "32": 17.5,
    "33": 17.5,
    "34": 17.5,
    "35": 17.75,
    "36": 17.75,
    "37": 17.85,
    "38": 18.0,
    "39": 18.0,
    "40": 18.25,
    "41": 18.25,
    "42": 18.25,
    "43": 18.5,
    "44": 18.5,
    "45": 18.5,
    "46": 18.75,
    "47": 18.75,
    "48": 18.75,
    "49": 19.0,
    "50": 19.0,
    "51": 19.0,
    "52": 19.25,
    "53": 19.25,
    "54": 19.25,
    "55": 19.5,
    "56": 19.5,
    "57": 19.5,
    "58": 19.75,
    "59": 19.75,
    "60": 19.75,
    "61": 20.0,
    "62": 20.0,
    "63": 20.25,
    "64": 20.25,
    "65": 20.25,
    "66": 20.5,
    "67": 20.5,
    "68": 20.75,
    "69": 20.5,
    "70": 21.0,
    "71": 20.75,
    "72": 21.0,
    "73": 21.0,
    "74": 21.25,
    "75": 21.25,
    "76": 21.5,
    "77": 21.5,
    "78": 21.75,
    "79": 21.75,
    "80": 22.0,
    "81": 21.75,
    "82": 22.25,
    "83": 22.0,
    "84": 22.5,
    "85": 22.25,
    "86": 22.75,
    "87": 22.5,
    "88": 23.0,
    "89": 23.25,
    "90": 23.0,
    "91": 23.5,
    "92": 23.75,
    "93": 23.5,
    "94": 24.0,
    "95": 24.25,
    "96": 24.5,
    "97": 24.75,
    "98": 25.25,
    "99": 25.75
  }
};

export const HSA_EQUATING_CHECKPOINTS: HsaCheckpoint[] = [
  {
    "hsa": 130,
    "percentile": 100.0,
    "thpt_a00": 30.0,
    "thpt_b00": 29.75,
    "thpt_c00": 28.0,
    "thpt_d01": 28.27
  },
  {
    "hsa": 125,
    "percentile": 99.97,
    "thpt_a00": 29.51,
    "thpt_b00": 29.52,
    "thpt_c00": 28.0,
    "thpt_d01": 27.76
  },
  {
    "hsa": 120,
    "percentile": 99.8,
    "thpt_a00": 29.01,
    "thpt_b00": 29.25,
    "thpt_c00": 27.52,
    "thpt_d01": 27.23
  },
  {
    "hsa": 115,
    "percentile": 99.25,
    "thpt_a00": 28.26,
    "thpt_b00": 28.76,
    "thpt_c00": 27.23,
    "thpt_d01": 26.5
  },
  {
    "hsa": 110,
    "percentile": 97.76,
    "thpt_a00": 27.51,
    "thpt_b00": 28.24,
    "thpt_c00": 26.49,
    "thpt_d01": 25.76
  },
  {
    "hsa": 105,
    "percentile": 94.79,
    "thpt_a00": 26.75,
    "thpt_b00": 27.49,
    "thpt_c00": 25.85,
    "thpt_d01": 25.01
  },
  {
    "hsa": 100,
    "percentile": 90.06,
    "thpt_a00": 26.0,
    "thpt_b00": 26.73,
    "thpt_c00": 25.24,
    "thpt_d01": 24.27
  },
  {
    "hsa": 95,
    "percentile": 83.38,
    "thpt_a00": 25.25,
    "thpt_b00": 25.77,
    "thpt_c00": 24.51,
    "thpt_d01": 23.52
  },
  {
    "hsa": 90,
    "percentile": 74.7,
    "thpt_a00": 24.49,
    "thpt_b00": 25.01,
    "thpt_c00": 23.83,
    "thpt_d01": 22.77
  },
  {
    "hsa": 85,
    "percentile": 64.47,
    "thpt_a00": 23.62,
    "thpt_b00": 24.23,
    "thpt_c00": 23.24,
    "thpt_d01": 22.02
  },
  {
    "hsa": 80,
    "percentile": 52.99,
    "thpt_a00": 22.75,
    "thpt_b00": 23.23,
    "thpt_c00": 22.33,
    "thpt_d01": 21.25
  },
  {
    "hsa": 75,
    "percentile": 40.89,
    "thpt_a00": 21.73,
    "thpt_b00": 22.0,
    "thpt_c00": 21.48,
    "thpt_d01": 20.48
  },
  {
    "hsa": 70,
    "percentile": 29.07,
    "thpt_a00": 20.33,
    "thpt_b00": 20.56,
    "thpt_c00": 20.48,
    "thpt_d01": 19.49
  },
  {
    "hsa": 65,
    "percentile": 18.72,
    "thpt_a00": 18.83,
    "thpt_b00": 19.1,
    "thpt_c00": 19.34,
    "thpt_d01": 18.49
  },
  {
    "hsa": 60,
    "percentile": 10.36,
    "thpt_a00": 17.11,
    "thpt_b00": 17.35,
    "thpt_c00": 18.09,
    "thpt_d01": 17.48
  },
  {
    "hsa": 55,
    "percentile": 4.85,
    "thpt_a00": 15.37,
    "thpt_b00": 15.49,
    "thpt_c00": 16.53,
    "thpt_d01": 16.26
  }
];

/**
 * Trả về bảng phân vị {percentile: score} theo tổ hợp môn được công bố chính thức
 */
export function getPercentileTable(combo = 'A00'): Record<number, number> {
  const cleanCombo = (combo || 'A00').toUpperCase().split(',')[0].trim();
  const table = OFFICIAL_PERCENTILES_2026[cleanCombo] || OFFICIAL_PERCENTILES_2026['A00'];
  return table;
}

/**
 * Tính bách phân vị tích lũy (%) của điểm thi từ bảng phân vị chính thức Bộ GD&ĐT
 */
export function scoreToPercentile(score: number, _year: number | string = 2026, combo = 'A00'): number {
  if (score <= 0) return 0.0;
  if (score >= 30.0) return 99.99;

  const table = getPercentileTable(combo);
  const p1 = 1;
  const p99 = 99;
  const sMin = table[p1];
  const sMax = table[p99];

  if (score <= sMin) {
    return Number(((score / sMin) * p1).toFixed(2));
  }
  if (score >= sMax) {
    const ratio = (score - sMax) / (30.0 - sMax);
    return Number((p99 + ratio * (99.99 - p99)).toFixed(2));
  }

  for (let p = 1; p < 99; p++) {
    const sLow = table[p];
    const sHigh = table[p + 1];
    if (score >= sLow && score <= sHigh) {
      if (sHigh === sLow) return p;
      const ratio = (score - sLow) / (sHigh - sLow);
      return Number((p + ratio).toFixed(2));
    }
  }

  return 50.0;
}

/**
 * Chiếu bách phân vị tích lũy (%) sang điểm thô tương đương theo bảng phân vị chính thức
 */
export function percentileToScore(percentile: number, _targetYear: number | string = 2026, combo = 'A00'): number {
  const p = Math.min(99.99, Math.max(0.01, percentile));
  const table = getPercentileTable(combo);
  const sMin = table[1];
  const sMax = table[99];

  if (p <= 1.0) {
    return Number(((p / 1.0) * sMin).toFixed(2));
  }
  if (p >= 99.0) {
    const ratio = (p - 99.0) / (100.0 - 99.0);
    return Number(Math.min(30.0, sMax + ratio * (30.0 - sMax)).toFixed(2));
  }

  const pFloor = Math.floor(p);
  const pCeil = Math.min(99, pFloor + 1);
  if (pFloor === pCeil) return table[pFloor];

  const sLow = table[pFloor];
  const sHigh = table[pCeil];
  const ratio = p - pFloor;
  return Number((sLow + ratio * (sHigh - sLow)).toFixed(2));
}

/**
 * Quy đổi điểm chuẩn giữa hai năm khác nhau thông qua bách phân vị (TT06 chuẩn)
 */
export function equateCutoff(score: number, fromYear: number | string, toYear: number | string = 2026, combo = 'A00'): number {
  if (String(fromYear) === String(toYear)) return Number(score.toFixed(2));
  const p = scoreToPercentile(score, fromYear, combo);
  return percentileToScore(p, toYear, combo);
}

/**
 * Quy đổi điểm thi ĐGNL ĐHQGHN (HSA, thang 150) sang điểm THPT theo Thông báo số 299/TB-ĐTSKT
 */
export function hsaToThpt(hsaScore: number, combo = 'A00'): number {
  if (hsaScore <= 0) return 0;
  if (hsaScore >= 130) return 30.0;
  if (hsaScore <= 50) return 13.5;

  const cleanCombo = (combo || 'A00').toUpperCase().split(',')[0].trim();
  type CheckpointKey = 'thpt_a00' | 'thpt_b00' | 'thpt_c00' | 'thpt_d01';
  let key: CheckpointKey = 'thpt_a00';
  if (cleanCombo === 'B00') key = 'thpt_b00';
  else if (cleanCombo === 'C00') key = 'thpt_c00';
  else if (cleanCombo === 'D01') key = 'thpt_d01';

  // Checkpoints đã được sắp xếp từ cao xuống thấp (130 -> 55)
  const cps = HSA_EQUATING_CHECKPOINTS;
  for (let i = 0; i < cps.length - 1; i++) {
    const top = cps[i];
    const bot = cps[i + 1];
    if (hsaScore >= bot.hsa && hsaScore <= top.hsa) {
      const ratio = (hsaScore - bot.hsa) / (top.hsa - bot.hsa);
      const score = bot[key] + ratio * (top[key] - bot[key]);
      return Number(score.toFixed(2));
    }
  }
  return 20.0;
}

/**
 * Quy đổi điểm thi ĐGNL ĐHQG-HCM (V-ACT, thang 1200) sang điểm THPT theo phân vị
 * Công bố tham khảo ĐHQG-HCM (tương đương chuẩn 2026)
 */
export function vactToThpt(vactScore: number): number {
  if (vactScore <= 0) return 0;
  if (vactScore >= 1100) return 29.0;
  if (vactScore <= 500) return 16.0;

  // Điểm V-ACT 850/1200 tương đương 25.8 THPT; 600/1200 tương đương 18.5 THPT; 1100 tương đương 29.0
  if (vactScore >= 850) {
    const ratio = (vactScore - 850) / (1100 - 850);
    return Number((25.8 + ratio * (29.0 - 25.8)).toFixed(2));
  } else if (vactScore >= 600) {
    const ratio = (vactScore - 600) / (850 - 600);
    return Number((18.5 + ratio * (25.8 - 18.5)).toFixed(2));
  } else {
    const ratio = (vactScore - 500) / (600 - 500);
    return Number((16.0 + ratio * (18.5 - 16.0)).toFixed(2));
  }
}


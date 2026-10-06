"""Trang danh sách ngành / chương trình đào tạo của từng trường, tìm bằng tìm kiếm có giới hạn tên miền chính thức của trường,
rồi MỞ THỬ từng link (phải trả về 200). Dùng khi chưa có trang riêng của ngành. Ghi src/data/trang-nganh-truong.json.
Danh sách ứng viên dưới đây do người làm tra tay; script chỉ kiểm tra và ghi những link còn mở được."""
import json
from pathlib import Path

import requests
import urllib3

urllib3.disable_warnings()
RA = Path(__file__).resolve().parents[1] / "src" / "data" / "trang-nganh-truong.json"
UNG_VIEN = {
    "KHA": ("https://neu.edu.vn/gioi-thieu-cac-nganh-va-chuong-trinh-dao-tao-dai-hoc-he-chinh-quy-nam-2024-cua-truong-dai-hoc-kinh-te-quoc-dan/", "Giới thiệu các ngành và chương trình đào tạo đại học chính quy"),
    "GSA": ("https://tuyensinh.utc2.edu.vn/vi/cac-nganh-dao-tao", "Các ngành đào tạo"),
    "GHA": ("https://www.utc.edu.vn/dao-tao/chuong-trinh-dao-tao", "Chương trình đào tạo"),
    "PKA": ("https://phenikaa-uni.edu.vn/vi/category/tuyen-sinh/tuyen-sinh-dai-hoc-chinh-quy", "Tuyển sinh đại học chính quy"),
    "TTN": ("https://tuyensinh.ttn.edu.vn/2024/07/23/nganhdaotao/", "Ngành đào tạo đại học"),
    "DDK": ("https://tuyensinh.dut.udn.vn/nganh-va-chi-tieu-tuyen-sinh", "Ngành và chỉ tiêu tuyển sinh"),
    "TDV": ("https://vinhuni.edu.vn/chuong-trinh-dao-tao-c02.01.03l0vp0a0.html", "Chương trình đào tạo"),
    "SPH": ("https://tuyensinh.hnue.edu.vn/khungchuongtrinh", "Khung chương trình"),
    "IUH": ("https://pdt.iuh.edu.vn/thong-tin-cac-nganh-dao-tao/", "Thông tin các ngành đào tạo"),
    "DQN": ("https://qnu.edu.vn/vi/dao-tao-1771/chuong-trinh-dao-tao-trinh-do-dai-hoc-1", "Chương trình đào tạo trình độ đại học"),
    "TMU": ("https://tuyensinh.tmu.edu.vn/dao-tao-dai-hoc/chuong-trinh-dao-tao-chuan-3808", "Chương trình đào tạo chuẩn"),
    "TSN": ("https://tuyensinh.ntu.edu.vn/nganh-nghe-dao-tao", "Ngành nghề đào tạo hệ đại học chính quy"),
    "SP2": ("https://hpu2.edu.vn/vi-VN/chuong-trinh-dao-tao-dai-hoc-chinh-quy", "Chương trình đào tạo đại học chính quy"),
    "TLA": ("https://tlu.edu.vn/chuong-trinh-dao-tao-trinh-do-dai-hoc-cho-khoa-tuyen-sinh-nam-2025-k67-ve-sau-51265/", "Chương trình đào tạo trình độ đại học (khóa tuyển sinh 2025)"),
    "HNM": ("https://hnmu.edu.vn/chuong-trinh-dao-tao-cac-ma-nganh-dai-hoc", "Chương trình đào tạo các mã ngành đại học"),
    "NTH": ("https://qldt.ftu.edu.vn/chuongtrinhdaotaok64/", "Danh mục chương trình đào tạo trình độ đại học"),
    "HHK": ("https://tuyensinh.vaa.edu.vn/vi/nganh-dao-tao", "Ngành đào tạo"),
    "HBT": ("https://ajc.edu.vn/Pages/danh-sach-tin-tuc.aspx?cm=209", "Chương trình đào tạo đại học chính quy"),
    "DPQ": ("https://pdu.edu.vn/a/index.php?dept=08&kh=07", "Chương trình đào tạo"),
    "DKK": ("https://uneti.edu.vn/chuong-trinh-dao-tao-dai-hoc-nam-2026/", "Chương trình đào tạo đại học"),
    "NHH": ("https://hvnh.edu.vn/pdt/vn/ctdt/chuong-trinh-dao-tao-dai-hoc-chinh-quy-hvnh-354.html", "Chương trình đào tạo đại học chính quy"),
    "DMT": ("https://hunre.edu.vn/gioi-thieu-nganh", "Giới thiệu ngành đào tạo"),
    "DDF": ("https://tuyensinh.ufl.udn.vn/danh-sach-nganh-chuyen-nganh/", "Danh sách ngành, chuyên ngành"),
    "DDP": ("https://daotao.ute.udn.vn/curriculums.asp", "Chương trình đào tạo"),
    "LNH": ("https://vnuf.edu.vn/cac-nganh-dao-tao-va-chi-tieu-tuyen-sinh-he-dai-hoc-chinh-quy.html", "Các ngành đào tạo, chỉ tiêu và tổ hợp xét tuyển"),
    "DTS": ("https://tnue.edu.vn/chuong-trinh-dao-tao-cu-nhan-su-pham", "Chương trình đào tạo cử nhân sư phạm"),
}
ket = {}
for ma, (url, nhan) in UNG_VIEN.items():
    try:
        r = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=20, verify=False, allow_redirects=True)
        ok = r.status_code == 200
    except Exception:
        ok = False
    print(ma, "ok" if ok else "KHÔNG MỞ ĐƯỢC", url[:80])
    if ok:
        ket[ma] = {"url": url, "tieuDe": nhan}
RA.write_text(json.dumps(ket, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print(len(ket), "trường")

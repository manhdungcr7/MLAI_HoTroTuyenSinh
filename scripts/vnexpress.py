"""Thư viện nhỏ đọc dữ liệu tra cứu đại học của VnExpress (nguồn thứ cấp độc lập với trang tổng hợp đang dùng).

Điểm chuẩn từng ngành theo năm và học phí/năm (khi trường đã công bố trong đề án) có ở:
  /tra-cuu-dai-hoc/loadbenchmark/id/{id_truong}/year/{năm|-1}/sortby/1/block_name/all
Tìm id trường: /tra-cuu-dai-hoc/loadcollegev3?input_college=<tên không dấu>
Chỉ dùng thư viện chuẩn và curl; không gọi API trả phí. Đây là dữ liệu tổng hợp (thứ cấp): dùng để đối chiếu chéo và bổ sung năm, không thay cho đề án gốc.
"""
import html
import json
import re
import subprocess
import unicodedata

BASE = "https://diemthi.vnexpress.net"


def _get(duong: str, tham_so: dict | None = None) -> str:
    cmd = ["curl", "-s", "-m", "45", "-G", "-A", "Mozilla/5.0", "-H", "X-Requested-With: XMLHttpRequest", BASE + duong]
    for k, v in (tham_so or {}).items():
        cmd += ["--data-urlencode", f"{k}={v}"]
    return subprocess.run(cmd, capture_output=True).stdout.decode("utf-8", errors="ignore")


def khong_dau(t: str) -> str:
    t = unicodedata.normalize("NFD", t.lower().replace("đ", "d"))
    return re.sub(r"[^a-z0-9 ]+", " ", "".join(c for c in t if unicodedata.category(c) != "Mn")).strip()


def tim_truong(cum: str) -> list[dict]:
    """Gợi ý trường theo cụm tên không dấu. Mỗi phần tử: {id, ten, duong_dan}."""
    try:
        d = json.loads(_get("/tra-cuu-dai-hoc/loadcollegev3", {"input_college": khong_dau(cum)}))
    except Exception:
        return []
    h = d.get("html", "")
    ra = []
    for m in re.finditer(r'<a href="([^"]+)"[^>]*class="licollege[^"]*"[^>]*data-id="(\d+)"[^>]*data-name="([^"]*)"', h):
        ra.append({"id": int(m.group(2)), "ten": html.unescape(m.group(3)), "duong_dan": m.group(1).replace("\\/", "/")})
    return ra


def _o(c: str) -> str:
    return html.unescape(re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", c))).strip()


def doc_bang(id_truong: int, nam: int | str = -1) -> list[dict]:
    """Các dòng điểm chuẩn của một trường theo một năm (-1 = năm mới nhất VnExpress có). Mỗi dòng một (ngành, tổ hợp)."""
    try:
        d = json.loads(_get(f"/tra-cuu-dai-hoc/loadbenchmark/id/{id_truong}/year/{nam}/sortby/1/block_name/all"))
    except Exception:
        return []
    h = d.get("html", "")
    ra = []
    for tr in re.findall(r'<tr class="university__benchmark[^"]*">(.*?)</tr>', h, re.S):
        td = re.findall(r"<td[^>]*>(.*?)</td>", tr, re.S)
        if len(td) < 4:
            continue
        ten = _o(re.search(r"<strong>(.*?)</strong>", td[0], re.S).group(1)) if re.search(r"<strong>", td[0]) else _o(td[0])
        ma_nganh = _o(re.findall(r'<span style="display: block;">(.*?)</span>', td[0], re.S)[-1]) if re.search(r'display: block', td[0]) else ""
        to_hop = _o(td[1])
        thpt = _o(td[2])
        diem = re.search(r"\d+(?:[.,]\d+)?", thpt)
        hp_goc = _o(td[4]) if len(td) > 4 else ""
        so_hp = [int(g.replace(".", "")) for g in re.findall(r"\d{1,3}(?:\.\d{3})+|\d{5,}", hp_goc)]
        ra.append({"ten": ten, "ma_nganh": ma_nganh, "to_hop": to_hop, "diem_thpt": float(diem.group(0).replace(",", ".")) if diem else None,
                   "phuong_thuc_khac": _o(td[3]), "hoc_phi_goc": hp_goc,
                   "hoc_phi_tu": min(so_hp) if so_hp else None, "hoc_phi_den": max(so_hp) if so_hp else None})
    return ra

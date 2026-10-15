"""Tách số có nguồn khỏi số ước tính/sinh ra trong học phí, việc làm và đề án (15/10/2026).

Bối cảnh: commit 90fc40e (scripts/hoan-thien-du-lieu-quoc-gia.py) điền học phí cho mọi chương trình bằng bảng giá
theo trường/khối ngành và tỷ lệ việc làm bằng mức nền ± độ lệch md5, rồi gắn link đề án với số trang đoán.
Kiểm tra từng link ngày 15/10 (HEAD, tuyensinh247): nhiều link trả 404.

Script này:
- hoc-phi.json: giữ mọi con số. Dòng có trong bản 12/10 (78f76fc) và link mở được → giữ nguyên (có nguồn).
  Mọi dòng khác → {"trieuNam", "nam", "uocTinh": true} (bỏ url/trang để app không hiện link giả).
- viec-lam.json: chỉ giữ các dòng của bản 12/10 (50 dòng, link mở được). Bỏ 3.531 dòng sinh từ mã băm.
- de-an-truong.json: giữ docs của bản 12/10 và docs mới có link mở được (danh sách LINK_HONG dưới đây là link trả 404);
  bỏ trường hocPhi do 90fc40e thêm (số trang đoán), giữ hocPhi của bản 12/10.

Chạy lại được (idempotent): python scripts/danh-dau-uoc-tinh.py
"""
import json
import subprocess
import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "src" / "data"
BAN_CO_NGUON = "78f76fc"  # bản 12/10, trước khi điền "100%"

# Link trả 404 khi kiểm tra ngày 15/10/2026 (HEAD request). Thêm vào đây nếu phát hiện link hỏng khác.
LINK_HONG = {
    "https://images.tuyensinh247.com/picture/2026/0401/thong-tin-tuyen-sinh-truong-dai-hoc-kinh-te-quoc-dan-2026.pdf",
    "https://images.tuyensinh247.com/picture/2026/0508/thong-tin-tuyen-sinh-truong-dai-hoc-cong-nghe-dhqg-hn-2026.pdf",
    "https://cdn.tuyensinh247.com/picture/2026/0616/thong-tin-tuyen-sinh-dai-hoc-chinh-quy.pdf",
}
LINK_HONG_TEP = Path(__file__).with_name("link-hong.txt")
if LINK_HONG_TEP.exists():
    LINK_HONG |= {d.strip() for d in LINK_HONG_TEP.read_text(encoding="utf-8").splitlines() if d.strip() and not d.startswith("#")}


def doc_ban_cu(ten: str) -> dict:
    ra = subprocess.run(["git", "show", f"{BAN_CO_NGUON}:src/data/{ten}"], cwd=ROOT, capture_output=True, text=True, encoding="utf-8", check=True)
    return json.loads(ra.stdout)


def goc(url: str) -> str:
    return url.split("#")[0]


def ghi(ten: str, du_lieu: dict) -> None:
    (DATA / ten).write_text(json.dumps(du_lieu, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    # 1. Học phí
    hp_cu = doc_ban_cu("hoc-phi.json")
    hp = json.loads((DATA / "hoc-phi.json").read_text(encoding="utf-8"))
    co_nguon = uoc_tinh = 0
    for k, v in hp.items():
        that = k in hp_cu and hp_cu[k].get("trieuNam") == v.get("trieuNam") and goc(hp_cu[k].get("url", "")) not in LINK_HONG
        if that:
            hp[k] = hp_cu[k]
            co_nguon += 1
        else:
            hp[k] = {"trieuNam": v["trieuNam"], "nam": v.get("nam", ""), "uocTinh": True}
            uoc_tinh += 1
    ghi("hoc-phi.json", hp)

    # 2. Việc làm: chỉ giữ dòng có nguồn của bản 12/10
    vl_cu = doc_ban_cu("viec-lam.json")
    vl = {k: v for k, v in vl_cu.items() if goc(v.get("url", "")) not in LINK_HONG}
    ghi("viec-lam.json", vl)

    # 3. Đề án theo trường
    da_cu = doc_ban_cu("de-an-truong.json")
    da = json.loads((DATA / "de-an-truong.json").read_text(encoding="utf-8"))
    bo_docs = 0
    for ma, v in list(da.items()):
        docs = [d for d in v.get("docs", []) if goc(d["url"]) not in LINK_HONG]
        bo_docs += len(v.get("docs", [])) - len(docs)
        moi = {"docs": docs}
        if ma in da_cu and "hocPhi" in da_cu[ma] and goc(da_cu[ma]["hocPhi"]["url"]) not in LINK_HONG:
            moi["hocPhi"] = da_cu[ma]["hocPhi"]
        if docs:
            da[ma] = moi
        else:
            del da[ma]
    ghi("de-an-truong.json", da)

    print(f"Học phí: {co_nguon} dòng có nguồn, {uoc_tinh} dòng đánh dấu ước tính (uocTinh).")
    print(f"Việc làm: giữ {len(vl)} dòng có nguồn (bỏ các dòng sinh ra).")
    print(f"Đề án: {len(da)} trường, bỏ {bo_docs} link hỏng.")


if __name__ == "__main__":
    main()

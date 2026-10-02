"""Chạy toàn bộ pipeline dữ liệu từ đầu: cào PDF -> phân tích -> ghép -> dự báo.

    python -m pipeline.run_all

Mất khoảng 40+ phút cho lần chạy đầu (cào ~440 trường, gọi request ra ngoài
có độ trễ lịch sự). Idempotent theo từng bước: PDF đã tải rồi thì không tải
lại (`pipeline.scrape.dean_pdfs` bỏ qua trường đã có trong manifest); các
bước sau ghi đè file kết quả mỗi lần chạy nên chạy lại an toàn.
"""

from __future__ import annotations

import importlib
import time

STAGES = [
    ("Cào PDF Đề án tuyển sinh", "pipeline.scrape.dean_pdfs", "run"),
    ("Cào cổng thông tin trực tuyến (HTML Portals)", "pipeline.scrape.scrape_html_portals", "run"),
    ("Phân tích bảng điểm chuẩn", "pipeline.clean.build_panel", "run"),
    ("Phân tích học phí + việc làm", "pipeline.clean.build_tuition_employment_panel", "run"),
    ("Ghép panel -> programs.parquet", "pipeline.clean.reconcile", "run"),
    ("Sinh dự báo điểm chuẩn", "pipeline.features.build", "run"),
    ("Huấn luyện Machine Learning & Đánh giá Benchmark", "pipeline.models.train_ml", "run_training_pipeline"),
]


def main() -> None:
    total = time.perf_counter()
    for i, (title, module_name, fn_name) in enumerate(STAGES, 1):
        print(f"\n{'=' * 68}\n[{i}/{len(STAGES)}] {title}\n{'=' * 68}", flush=True)
        t0 = time.perf_counter()
        module = importlib.import_module(module_name)
        getattr(module, fn_name)()
        print(f"  -> {time.perf_counter() - t0:.1f}s")

    print(f"\n{'=' * 68}")
    print(f"Hoàn tất trong {(time.perf_counter() - total) / 60:.1f} phút")
    print("Artefact: data/processed/programs.parquet, data/processed/national_shock.json")


if __name__ == "__main__":
    main()

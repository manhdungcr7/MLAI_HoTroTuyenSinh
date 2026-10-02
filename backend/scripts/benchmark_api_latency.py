"""Script đo đạc và đánh giá chuẩn xác API Latency Benchmark (p50, p95, p99)
Phục vụ SUBAGENT 09 - OBSERVABILITY / PERFORMANCE / SECURITY
"""

import statistics
import sys
import time
from pathlib import Path
from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from backend.app.main import app, load_data

load_data()
client = TestClient(app)

def benchmark_endpoint(name: str, fn, n_runs: int = 50):
    # Warmup
    for _ in range(5):
        fn()

    latencies = []
    for _ in range(n_runs):
        t0 = time.perf_counter()
        res = fn()
        t1 = time.perf_counter()
        assert res.status_code == 200, f"{name} failed with status {res.status_code}"
        latencies.append((t1 - t0) * 1000)

    latencies.sort()
    p50 = statistics.median(latencies)
    p95 = latencies[int(len(latencies) * 0.95)]
    p99 = latencies[int(len(latencies) * 0.99)]
    mean_val = statistics.mean(latencies)
    min_val = min(latencies)
    max_val = max(latencies)

    print(f"=== {name} ({n_runs} runs) ===")
    print(f"  Min:  {min_val:.2f} ms")
    print(f"  P50:  {p50:.2f} ms")
    print(f"  Mean: {mean_val:.2f} ms")
    print(f"  P95:  {p95:.2f} ms")
    print(f"  P99:  {p99:.2f} ms")
    print(f"  Max:  {max_val:.2f} ms")
    return {"name": name, "p50": p50, "p95": p95, "p99": p99, "mean": mean_val, "min": min_val, "max": max_val}

recommend_payload = {
    "exam_scores": {"toan": 8.0, "ly": 7.5, "hoa": 6.8, "van": 6.5, "anh": 7.0},
    "alt_scores": {"ielts": 6.5, "hoc_ba_gpa": 8.5},
    "priority": {"area": "KV2", "object": "none"},
    "family": {
        "home_province": "Hà Nội",
        "annual_budget_vnd": 35_000_000,
        "policy_status": "none",
        "relocation_willingness": "trong_vung",
        "must_stay_near_home": False,
    },
    "preferences": {
        "ranked_majors": [
            {"major_group": "cntt", "weight": 1.0},
            {"major_group": "ky_thuat", "weight": 0.7},
        ],
        "career_importance": 0.5,
        "school_prestige_sensitivity": 0.5,
        "dream_school_codes": [],
        "excluded_school_codes": [],
        "excluded_major_groups": [],
    },
    "risk": {"risk_tolerance": 0.05, "ambition_level": 0.5, "weights": None},
    "max_wishes": 15,
}

results = []
results.append(benchmark_endpoint("GET /api/health", lambda: client.get("/api/health"), 100))
results.append(benchmark_endpoint("GET /api/health/ready", lambda: client.get("/api/health/ready"), 50))
results.append(benchmark_endpoint("GET /api/health/data", lambda: client.get("/api/health/data"), 50))
results.append(benchmark_endpoint("GET /api/scenarios", lambda: client.get("/api/scenarios"), 50))
results.append(benchmark_endpoint("POST /api/recommend", lambda: client.post("/api/recommend", json=recommend_payload), 30))

import hashlib
import json

import pandas as pd
import pytest

from pipeline import publish as publisher


def _frame(score: float = 24.5) -> pd.DataFrame:
    return pd.DataFrame(
        [
            {
                "program_key": "A::001",
                "school_code": "A",
                "major_label": "Ngành A",
                "combinations_seen": ["A00"],
                "cutoff_by_year_json": '{"2021":22.5,"2024":24.5}',
                "n_years": 2,
                "years_seen": [2021, 2024],
                "has_conflict": False,
                "latest_year": 2024,
                "latest_score": score,
                "tuition_min_mvnd": None,
                "tuition_max_mvnd": None,
                "employment_rate_pct": None,
                "major_group": "cntt",
                "school_province": "Hà Nội",
                "data_quality": "reference_only",
                "years_extrapolated": 2,
                "forecast_p50": score,
                "forecast_p10": score - 1,
                "forecast_p90": score + 1,
                "beta_program": 1.0,
                "idio_std": 1.0,
            }
        ]
    )


def _configure(tmp_path, monkeypatch, frame):
    processed = tmp_path / "processed"
    processed.mkdir()
    frame.to_parquet(processed / "programs.parquet", index=False)
    catalog = tmp_path / "catalog.json"
    catalog.write_text(
        json.dumps(
            [
                {
                    "programKey": "A::001",
                    "dataPassport": "Đề án Tuyển sinh công khai A (Cập nhật 2024)",
                }
            ],
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )
    output = tmp_path / "public" / "data"
    monkeypatch.setattr(publisher, "PROCESSED", processed)
    monkeypatch.setattr(publisher, "CATALOG_PATH", catalog)
    monkeypatch.setattr(publisher, "OUTPUT", output)
    return output


def test_export_hashes_snapshot_and_marks_missing_observation_unknown(tmp_path, monkeypatch):
    output = _configure(tmp_path, monkeypatch, _frame())

    manifest = publisher.export_admissions()
    dataset = manifest["datasets"]["admissions"]
    raw = (output / dataset["path"]).read_bytes()
    record = json.loads(raw)["records"][0]

    assert hashlib.sha256(raw).hexdigest() == dataset["sha256"]
    assert manifest["datasetVersion"] == dataset["sha256"]
    assert record["provenance"] == {
        "sourceReference": "Đề án Tuyển sinh công khai A (Cập nhật 2024)",
        "sourceUrl": None,
        "sourceYear": 2024,
        "observedAt": None,
        "status": "reference_only",
    }
    assert dataset["observedAt"] is None
    assert dataset["yearCoverage"] == {"min": 2021, "max": 2024}
    assert dataset["sourceHealth"]["status"] == "unknown"
    assert dataset["sourceHealth"]["recordsWithObservationTimestamp"] == 0


def test_failed_export_keeps_last_good_manifest_and_rollback_restores_version(tmp_path, monkeypatch):
    output = _configure(tmp_path, monkeypatch, _frame())
    first = publisher.export_admissions()
    first_version = first["datasetVersion"]

    _frame(25.0).to_parquet(output.parent.parent / "processed" / "programs.parquet", index=False)
    second = publisher.export_admissions()
    assert second["datasetVersion"] != first_version

    with pytest.raises(ValueError, match="schema mismatch"):
        publisher.build_snapshot(pd.DataFrame({"program_key": ["broken"]}), {})
    assert json.loads((output / "manifest.json").read_text(encoding="utf-8"))["datasetVersion"] == second["datasetVersion"]

    restored = publisher.rollback_admissions(first_version)
    assert restored["datasetVersion"] == first_version
    assert json.loads((output / "manifest.json").read_text(encoding="utf-8"))["datasetVersion"] == first_version

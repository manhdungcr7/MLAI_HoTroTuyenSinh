"""docs/RULE_REVIEW.md phải khớp các file quy tắc hiện có, để người thẩm định luôn đọc bản mới."""

import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("rule_review", ROOT / "scripts" / "rule_review.py")
rule_review = importlib.util.module_from_spec(spec)
spec.loader.exec_module(rule_review)


def test_review_document_is_up_to_date():
    current = (ROOT / "docs" / "RULE_REVIEW.md").read_text(encoding="utf-8").replace("\r\n", "\n")
    assert current == rule_review.render(), "Chạy python scripts/rule_review.py để cập nhật docs/RULE_REVIEW.md"


def test_every_rule_has_a_document_hash():
    for rule in rule_review.load():
        assert len(rule["source"].get("sha256", "")) == 64, rule["schoolCode"]

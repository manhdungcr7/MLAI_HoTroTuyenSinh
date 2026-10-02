"""Connector for Tuyensinh247 Admission Schemes (Đề án tuyển sinh)."""

from __future__ import annotations

import logging
import re
from pathlib import Path
from typing import List, Optional

from pipeline.ingestion import config
from pipeline.ingestion.core.context import PipelineContext
from pipeline.ingestion.core.models import DocumentFormat, RawDocument
from pipeline.ingestion.fetchers.http import ResumableHttpFetcher
from pipeline.ingestion.parsers.base import BaseParser
from pipeline.ingestion.parsers.pdf_scheme import PdfSchemeParser
from pipeline.ingestion.sources.base import BaseSource
from pipeline.ingestion.sources.registry import DataSourceMetadata, SourceRegistry

logger = logging.getLogger("ingestion.sources.tuyensinh247")

PDF_LINK_RE = re.compile(r'href="(https?://[^"]+?\.pdf)"', re.IGNORECASE)

PRIORITY_SLUGS = [
    "dai-hoc-bach-khoa-ha-noi-BKA",
    "truong-dai-hoc-kinh-te-quoc-dan-KHA",
    "truong-dai-hoc-ngoai-thuong-co-so-phia-bac-NTH",
    "truong-dai-hoc-cong-nghe-dai-hoc-quoc-gia-ha-noi-QHI",
    "truong-dai-hoc-khoa-hoc-tu-nhien-dai-hoc-quoc-gia-ha-noi-QHT",
    "truong-dai-hoc-bach-khoa-dai-hoc-quoc-gia-tphcm-QSG",
    "truong-dai-hoc-cong-nghe-thong-tin-dai-hoc-quoc-gia-tphcm-QSC",
    "truong-dai-hoc-kinh-te-tphcm-KSA",
    "truong-dai-hoc-sao-do-SDU",
    "truong-dai-hoc-hoa-lu-QHQ",
]


@SourceRegistry.register(
    DataSourceMetadata(
        source_id="tuyensinh247",
        name="Tuyensinh247 Official Admission Scheme Repository",
        source_type="secondary",
        description="Scrapes official university admission scheme PDFs signed by university rectors",
        base_url="https://diemthi.tuyensinh247.com/de-an-tuyen-sinh/{slug}.html",
        rate_limit_rps=1.5,
        reliability_tier="tier_2_so_gd",
    )
)
class TuyenSinh247Source(BaseSource):
    """Source connector for discovering and retrieving admission scheme PDFs."""

    source_id = "tuyensinh247"

    def __init__(self, fetcher: Optional[ResumableHttpFetcher] = None):
        self.fetcher = fetcher or ResumableHttpFetcher(rate_limit_rps=1.5)

    def get_parser(self) -> BaseParser:
        return PdfSchemeParser()

    def fetch_documents(self, context: PipelineContext) -> List[RawDocument]:
        documents: List[RawDocument] = []
        slugs = PRIORITY_SLUGS[: context.limit] if context.limit else PRIORITY_SLUGS

        # Check existing downloaded PDFs in deans directory first (offline-friendly)
        for slug in slugs:
            school_code = slug.rsplit("-", 1)[-1]
            school_dean_dir = config.DEANS_DIR / school_code
            if school_dean_dir.exists():
                local_pdfs = list(school_dean_dir.glob("*.pdf"))
                if local_pdfs:
                    for pdf_path in local_pdfs:
                        doc_id = f"ts247_{school_code}_{pdf_path.stem}"
                        doc = self.fetcher.fetch(
                            url_or_path=str(pdf_path),
                            doc_id=doc_id,
                            source_id=self.source_id,
                            format_hint="pdf",
                            metadata={"school_code": school_code, "slug": slug},
                        )
                        documents.append(doc)
                    continue

            # If not found locally and not offline, crawl from remote
            if not context.offline:
                url = f"https://diemthi.tuyensinh247.com/de-an-tuyen-sinh/{slug}.html"
                try:
                    html_doc = self.fetcher.fetch(
                        url_or_path=url,
                        doc_id=f"ts247_html_{school_code}",
                        source_id=self.source_id,
                        format_hint="html",
                    )
                    html_text = html_doc.content_bytes.decode("utf-8", errors="replace") if html_doc.content_bytes else ""
                    pdf_links = PDF_LINK_RE.findall(html_text)
                    if pdf_links:
                        # Prioritize 'de-an'
                        best_link = pdf_links[0]
                        for link in pdf_links:
                            if "de-an" in link.lower():
                                best_link = link
                                break

                        doc_id = f"ts247_{school_code}_scheme"
                        pdf_doc = self.fetcher.fetch(
                            url_or_path=best_link,
                            doc_id=doc_id,
                            source_id=self.source_id,
                            format_hint="pdf",
                            metadata={"school_code": school_code, "slug": slug},
                        )
                        documents.append(pdf_doc)
                except Exception as exc:
                    context.record_error(f"Failed to fetch scheme for {slug}", exc)

        return documents

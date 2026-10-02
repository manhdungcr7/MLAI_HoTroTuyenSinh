"""Module entrypoint for python -m pipeline.ingestion."""

import sys
from pipeline.ingestion.cli import main

if __name__ == "__main__":
    sys.exit(main())

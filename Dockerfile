# API tư vấn tuyển sinh. Web (frontend) là trang tĩnh nên không cần container; API dùng cho tích hợp bên ngoài.
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app

COPY backend/requirements.txt backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY common common
COPY backend backend
COPY frontend/src/data/programs-catalog.json frontend/src/data/programs-catalog.json
COPY frontend/src/data/school-rules frontend/src/data/school-rules
COPY data/processed/national_shock.json data/processed/national_shock.json

RUN useradd --create-home --uid 10001 app && chown -R app /app
USER app

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/api/health')" || exit 1
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]

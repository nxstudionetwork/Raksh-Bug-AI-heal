FROM python:3.13-slim AS builder

WORKDIR /build
COPY backend/requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

FROM python:3.13-slim

RUN groupadd -r raksh && useradd -r -g raksh -d /app -s /bin/bash raksh

WORKDIR /app

COPY --from=builder /root/.local /usr/local

COPY backend/ .
COPY frontend/ ./frontend/

RUN mkdir -p uploads logs && chown -R raksh:raksh /app

USER raksh

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/health/')" || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4", "--proxy-headers", "--forwarded-allow-ips", "*"]

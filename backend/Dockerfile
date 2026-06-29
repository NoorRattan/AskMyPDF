FROM python:3.11-slim

WORKDIR /app

# System deps needed by pdfplumber / chromadb build steps
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Torch first - separate layer so it survives requirements.txt changes
RUN pip install --no-cache-dir torch==2.3.1 \
    --index-url https://download.pytorch.org/whl/cpu

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ ./app/

# Create data dirs at image build time; Railway mounts over these at runtime
RUN mkdir -p /app/data/chroma /app/data/uploads

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libpq-dev gdal-bin libgdal-dev \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system iua && useradd --system --gid iua --create-home iua

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN chown -R iua:iua /app

USER iua

EXPOSE 8000

# Override in compose: prod uses gunicorn; local compose uses runserver.
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3"]

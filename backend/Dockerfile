# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Sketch2TikZ AI backend image.
#
# Includes a curated TeX Live subset (not the full ~5GB distribution) with
# the packages needed for TikZ, PGFPlots, and CircuiTikZ diagrams, plus
# poppler-utils (pdftoppm) and pdf2svg for PNG/SVG export.
#
# Built for IBM Code Engine: listens on $PORT (Code Engine injects this),
# runs as a non-root user, no shell-escape ever enabled for pdflatex.
# ---------------------------------------------------------------------------
FROM python:3.11-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

RUN apt-get update && apt-get install -y --no-install-recommends \
        texlive-latex-base \
        texlive-latex-extra \
        texlive-pictures \
        texlive-science \
        texlive-fonts-recommended \
        poppler-utils \
        pdf2svg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

RUN mkdir -p /app/uploads /app/generated \
    && useradd --create-home --shell /bin/bash appuser \
    && chown -R appuser:appuser /app

USER appuser

EXPOSE 8080

# Code Engine sets $PORT; default to 8080 for local `docker run`.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}"]

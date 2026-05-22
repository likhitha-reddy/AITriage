FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

RUN addgroup --system app && adduser --system --ingroup app app

COPY requirements.txt ./
RUN pip install --no-cache-dir --upgrade pip && pip install --no-cache-dir -r requirements.txt

COPY alembic ./alembic
COPY alembic.ini ./
COPY app ./app
COPY scripts ./scripts

RUN chmod +x /app/scripts/start.sh && chown -R app:app /app

USER app

EXPOSE 8000

ENTRYPOINT ["/app/scripts/start.sh"]
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

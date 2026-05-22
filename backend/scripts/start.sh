#!/usr/bin/env sh
set -eu

cd /app

if [ -d "/app/alembic/versions" ] && find /app/alembic/versions -maxdepth 1 -type f -name "*.py" ! -name "__init__.py" | grep -q .; then
  echo "Running Alembic migrations..."
  alembic upgrade head
else
  echo "No Alembic revisions found; skipping migrations."
fi

if python - <<'PY'
from sqlalchemy import func, inspect, select

from app.database import SessionLocal, engine
from app.models.doctor import Doctor
from app.models.subscription_plan import SubscriptionPlan

table_names = set(inspect(engine).get_table_names())
if not {"doctors", "subscription_plans"}.issubset(table_names):
    raise SystemExit(1)

with SessionLocal() as session:
    doctor_count = session.execute(select(func.count()).select_from(Doctor)).scalar_one()
    plan_count = session.execute(select(func.count()).select_from(SubscriptionPlan)).scalar_one()

raise SystemExit(0 if doctor_count > 0 and plan_count > 0 else 1)
PY
then
  echo "Seed data already present; skipping seed."
else
  echo "Database is empty; seeding reference data..."
  python -m app.seed
fi

exec "$@"

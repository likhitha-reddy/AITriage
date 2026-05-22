# Dallas — History

## Project Context
**Project:** AITriage — AI-powered healthcare triage platform (symptom analysis, doctor consultation, prescription management, progress tracking). Stack: React Native, Python/FastAPI, PostgreSQL. Initial focus: mental health and dermatology.
**User:** gsreddy

## Learnings
- 2026-05-22T12:22:01Z: Bootstrapped the FastAPI backend in `backend/` with a layered app package, JWT/auth middleware, SQLAlchemy models for users, doctors, triage results, consultations, prescriptions, and subscriptions, plus Alembic wiring in `backend/alembic/`.
- 2026-05-22T12:22:01Z: Kept `backend/app/services/` as business-logic seams while shipping real CRUD/auth router implementations in `backend/app/routers/` and reusable security helpers in `backend/app/utils/`.
- 2026-05-22T12:22:01Z: Core runtime entry points are `backend/app/main.py`, `backend/app/config.py`, `backend/app/database.py`, and `backend/.env.example`; container startup is defined in `backend/Dockerfile`.

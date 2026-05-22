# Ripley — History

## Project Context
**Project:** AITriage — AI-powered healthcare triage platform (symptom analysis, doctor consultation, prescription management, progress tracking). Stack: React Native, Python/FastAPI, PostgreSQL. Initial focus: mental health and dermatology.
**User:** gsreddy

## Learnings
- 2026-05-22T12:22:01Z: Established initial monorepo structure with `backend/`, `mobile/`, `ai/`, `docs/`, and `shared/` at the repository root.
- 2026-05-22T12:22:01Z: Set architecture direction so the FastAPI backend is the single client-facing gateway and orchestration layer for mobile, AI, consultations, prescriptions, and subscriptions.
- 2026-05-22T12:22:01Z: Documented core patient flow as symptoms -> AI triage -> doctor consultation -> prescription -> progress tracking, with initial specialty emphasis on mental health and dermatology.
- 2026-05-22T12:22:01Z: Captured initial architecture in `docs/ARCHITECTURE.md`, initial data model in `docs/DATA_MODEL.md`, and decision handoff in `.squad\decisions\inbox\ripley-initial-architecture.md`.
- 2026-05-22T13:30:35Z (Cross-team sync): Ash delivered AI microservice with safety guardrails, Dallas delivered FastAPI backend with JWT auth and SQLAlchemy models, Lambert delivered React Native app with mock-first services. All initial deliverables integrated into decisions.md ledger.

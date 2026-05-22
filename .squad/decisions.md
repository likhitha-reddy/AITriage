# AITriage — Decisions

<!-- Canonical decision ledger. Append-only. Scribe merges from decisions/inbox/. -->

## 2026-05-22 — Ripley: Initial Architecture

**Date:** 2026-05-22T12:22:01Z

Established the initial monorepo layout and baseline architecture documentation for AITriage as a healthcare triage platform focused first on mental health and dermatology.

1. Use a single repository with top-level domains for `backend/`, `mobile/`, `ai/`, `docs/`, and `shared/`.
2. Keep the FastAPI backend as the single client-facing gateway and system of record.
3. Route all mobile interactions through the backend; the mobile app must not call LLM or AI services directly.
4. Treat the AI triage engine as a separate Python boundary that returns explicit, traceable `TriageResult` outputs.
5. Use PostgreSQL as the primary transactional store for patient, doctor, consultation, prescription, triage, and subscription data.
6. Maintain shared contracts in `shared/` to reduce schema drift across backend, mobile, and AI components.
7. Preserve healthcare auditability by storing symptom snapshots, AI model metadata, and consultation-linked prescriptions.

## 2026-05-22 — Ash: Triage Engine

**Date:** 2026-05-22T12:22:01Z

- Implement the AI triage engine as its own FastAPI microservice under `ai/` so it can scale, deploy, and secure model access separately from the main backend.
- Use structured Pydantic request/response models in `ai/app/models/` and force LLM outputs into JSON so downstream services receive typed assessments instead of free-form text.
- Centralize healthcare safety behavior in `ai/app/engine/safety.py` with emergency keyword escalation, disclaimer injection, conservative confidence filtering, and non-definitive diagnosis wording.
- Support both OpenAI and Anthropic providers from configuration in `ai/app/config.py`; use the same provider selection for symptom triage and image analysis.
- Treat uploaded images as observational inputs only in `ai/app/engine/image_analyzer.py`; image results feed prompts but never produce standalone diagnoses.
- Prioritize mental health and dermatology referral mapping in `ai/app/engine/specialization_matcher.py`, with general practice as the fallback specialization.

## 2026-05-22 — Dallas: Backend Setup

**Date:** 2026-05-22T12:22:01Z

- Bootstrap the FastAPI backend under `backend/` with a layered structure (`app/routers`, `app/models`, `app/schemas`, `app/utils`, `app/services`, `app/middleware`) so API composition, persistence, and auth concerns stay separated.
- Use SQLAlchemy + Alembic for persistence and migrations, with PostgreSQL-ready configuration via `DATABASE_URL` while keeping a SQLite default in code for zero-config local startup.
- Ship JWT auth utilities, password hashing, and an auth context middleware early so all future protected APIs share one security baseline.
- Keep AI triage service integration behind a placeholder router flow and reserve business logic extraction for `app/services/` to avoid blocking Ash's AI ownership.

## 2026-05-22 — Lambert: Mobile Setup

**Date:** 2026-05-22T12:22:01Z

1. Built the mobile app as a manual React Native + TypeScript scaffold in `mobile/`, including app entry files, Babel, Metro, and TypeScript configuration so the project is runnable without `react-native init`.
2. Used a root native stack wrapped around a bottom-tab navigator so Home, Triage, Consultations, and Profile stay primary tabs while booking, prescription, and triage result flows remain focused detail screens.
3. Implemented mock-first service layers with Axios-ready APIs, AsyncStorage-backed auth persistence, and Zustand stores so frontend work can move independently of backend delivery.

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

## 2026-05-22 — Ash: Specialized Triage

**Date:** 2026-05-22T13:39:17Z

- Upgraded `ai/app/engine/triage_engine.py` to auto-detect `mental_health`, `dermatology`, or `general` domains, preserve conversation history, store in-memory triage context by `triage_id`, and merge specialized assessments with general triage output under existing safety guardrails.
- Added `ai/app/engine/mental_health.py` with a dedicated screener for anxiety, depression, stress, panic, sleep disturbance, and PTSD-like symptoms, including crisis escalation for self-harm or suicidal ideation and India crisis resources: AASRA helpline: 9820466726, iCall: 9152987821, Vandrevala Foundation: 1860-2662-345.
- Added `ai/app/engine/dermatology.py` with condition matching for acne, eczema/dermatitis, psoriasis, fungal infections, allergic reactions, and suspicious lesions, with image-analysis integration and urgency buckets from cosmetic concern to urgent dermatology referral.
- Added `ai/app/engine/progress_tracker.py` and expanded progress models so multi-check-in history can detect worsening trends, new symptoms, re-consultation thresholds, and mental health crisis re-screening.
- Expanded prompt templates in `ai/app/engine/prompt_templates.py` for specialized mental health, dermatology, and contextual follow-up generation so future LLM calls stay aligned with the two launch specialties.
- Extended `ai/app/routers/triage.py` with dedicated focused endpoints while keeping the original `/triage` flow backward compatible for existing integrations and tests.
- Preserved backward compatibility in `TriageEngine.assess_progress` for legacy single-check-in callers while routing new structured progress history through `ProgressTracker`.

## 2026-05-22 — Dallas: Backend Services Complete

**Date:** 2026-05-22T13:39:17Z

- Finalized the FastAPI service layer so auth, doctor matching, consultations, prescriptions, subscriptions, and triage flows now execute through `backend/app/services/` instead of router-local placeholder logic.
- Added doctor matching filters for specialization, availability, rating, and consultation fee range, plus consultation lifecycle enforcement and consultation-linked prescription creation.
- Standardized subscription handling around seeded `free`, `basic`, and `premium` plans with persisted perks metadata for consultation discounts and free triage allowances.
- Integrated the backend triage flow with Ash's AI service at `http://localhost:8001/triage` while persisting structured AI output and patient-owned triage records.
- Added root `docker-compose.yml`, root `.env.example`, backend seed tooling, and centralized CORS/error/startup setup so local multi-service bring-up is consistent.

## 2026-05-22 — Kane: Test Suite

**Date:** 2026-05-22T13:39:17Z

- Added dedicated `pytest.ini` files for `backend/` and `ai/` so tests run from each service root with predictable discovery.
- Standardized backend tests on an in-memory SQLite database plus FastAPI dependency overrides to keep API tests isolated from local files and external databases.
- Mocked backend AI-triage HTTP calls in tests instead of relying on a live AI service.
- Strengthened backend auth validation by switching login/registration email fields to `EmailStr` and adding `email-validator` to backend requirements.
- Added AI safety regression coverage for emergency escalation, disclaimers, confidence thresholds, mental health crisis support, dermatology routing, and progress re-consultation logic.
- Fixed supporting code coupled to the new tests: escaped prompt-template JSON braces, added crisis helpline messaging to emergency responses, and corrected dermatology image red-flag flattening.

## 2026-05-22 — Lambert: API Wiring

**Date:** 2026-05-22T13:39:17Z

- Standardize the React Native app on a single Axios client with AsyncStorage-backed JWT persistence, automatic bearer injection, refresh-token retries, and centralized user-facing error handling.
- Treat backend responses as transport models and map them into mobile-first view models so the UI can stay stable even when API shapes are flatter than the screen needs.
- Cache recent triage results and progress check-ins locally to preserve usable patient flows when optional endpoints such as history/progress are unavailable.
- Route triage-to-consultation handoff through deep-linked navigation parameters so recommended specialization and triage context prefill the booking flow.
- Use shared frontend UX primitives (toast notifications, skeleton placeholders, empty states, and keyboard-safe form wrappers) across patient-facing mobile screens for a more production-ready healthcare experience.

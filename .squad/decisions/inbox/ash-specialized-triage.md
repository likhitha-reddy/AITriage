# Ash — Specialized Triage Decisions

**Date:** 2026-05-22T13:39:17Z

- Upgraded `ai/app/engine/triage_engine.py` to auto-detect `mental_health`, `dermatology`, or `general` domains, preserve conversation history, store in-memory triage context by `triage_id`, and merge specialized assessments with general triage output under existing safety guardrails.
- Added `ai/app/engine/mental_health.py` with a dedicated screener for anxiety, depression, stress, panic, sleep disturbance, and PTSD-like symptoms, including crisis escalation for self-harm or suicidal ideation and India crisis resources: AASRA helpline: 9820466726, iCall: 9152987821, Vandrevala Foundation: 1860-2662-345.
- Added `ai/app/engine/dermatology.py` with condition matching for acne, eczema/dermatitis, psoriasis, fungal infections, allergic reactions, and suspicious lesions, with image-analysis integration and urgency buckets from cosmetic concern to urgent dermatology referral.
- Added `ai/app/engine/progress_tracker.py` and expanded progress models so multi-check-in history can detect worsening trends, new symptoms, re-consultation thresholds, and mental health crisis re-screening.
- Expanded prompt templates in `ai/app/engine/prompt_templates.py` for specialized mental health, dermatology, and contextual follow-up generation so future LLM calls stay aligned with the two launch specialties.
- Extended `ai/app/routers/triage.py` with dedicated focused endpoints while keeping the original `/triage` flow backward compatible for existing integrations and tests.
- Preserved backward compatibility in `TriageEngine.assess_progress` for legacy single-check-in callers while routing new structured progress history through `ProgressTracker`.

# Ash — History

## Project Context
**Project:** AITriage — AI-powered healthcare triage platform (symptom analysis, doctor consultation, prescription management, progress tracking). Stack: React Native, Python/FastAPI, PostgreSQL. Initial focus: mental health and dermatology.
**User:** gsreddy

## Learnings
- 2026-05-22T12:22:01Z — Built a standalone FastAPI AI microservice under `ai/` with `app/main.py`, `routers/triage.py`, and `engine/triage_engine.py` so symptom triage can run independently from the main API surface.
- 2026-05-22T12:22:01Z — Centralized healthcare safety rails in `ai/app/engine/safety.py`: emergency keyword detection, disclaimer injection, confidence threshold enforcement, and non-definitive wording for diagnoses.
- 2026-05-22T12:22:01Z — Added multimodal support in `ai/app/engine/image_analyzer.py` using Pillow validation plus OpenAI/Anthropic vision calls; outputs are observation-only and feed into structured triage prompts.
- 2026-05-22T12:22:01Z — Kept mental health and dermatology as first-class routing targets via `ai/app/engine/specialization_matcher.py`, with tests in `ai/tests/test_triage_engine.py` and `ai/tests/test_safety.py` covering mock LLM flows and emergency guardrails.
- 2026-05-22T13:30:35Z (Cross-team sync): Dallas backend ready for integration at `/triage` endpoints; Lambert mobile will call via `/api/triage` after auth. Safety guardrails ready for production data. Next: implement Dallas-to-Ash service client.
- 2026-05-22T13:39:17Z — Productionized focused triage for mental health and dermatology with specialized prompt templates, dedicated screeners/analyzers, conversation-aware follow-up generation, progress tracking, crisis escalation with India helplines, and new `/triage/mental-health`, `/triage/dermatology`, `/triage/progress`, and `/triage/follow-up-questions/{triage_id}` API flows validated by expanded AI tests.
- 2026-05-22T13:39:17Z (Session complete): Dallas backend integrated with AI service; Lambda mobile wiring complete; Kane tests ensure safety guardrails pass. Full-stack implementation SUCCESS.

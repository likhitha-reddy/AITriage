# Ash — History

## Project Context
**Project:** AITriage — AI-powered healthcare triage platform (symptom analysis, doctor consultation, prescription management, progress tracking). Stack: React Native, Python/FastAPI, PostgreSQL. Initial focus: mental health and dermatology.
**User:** gsreddy

## Learnings
- 2026-05-22T12:22:01Z — Built a standalone FastAPI AI microservice under `ai/` with `app/main.py`, `routers/triage.py`, and `engine/triage_engine.py` so symptom triage can run independently from the main API surface.
- 2026-05-22T12:22:01Z — Centralized healthcare safety rails in `ai/app/engine/safety.py`: emergency keyword detection, disclaimer injection, confidence threshold enforcement, and non-definitive wording for diagnoses.
- 2026-05-22T12:22:01Z — Added multimodal support in `ai/app/engine/image_analyzer.py` using Pillow validation plus OpenAI/Anthropic vision calls; outputs are observation-only and feed into structured triage prompts.
- 2026-05-22T12:22:01Z — Kept mental health and dermatology as first-class routing targets via `ai/app/engine/specialization_matcher.py`, with tests in `ai/tests/test_triage_engine.py` and `ai/tests/test_safety.py` covering mock LLM flows and emergency guardrails.

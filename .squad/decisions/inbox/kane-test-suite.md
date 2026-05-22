# Kane Test Suite Decisions

- **Date:** 2026-05-22T13:39:17Z
- Added dedicated `pytest.ini` files for `backend/` and `ai/` so tests run from each service root with predictable discovery.
- Standardized backend tests on an in-memory SQLite database plus FastAPI dependency overrides to keep API tests isolated from local files and external databases.
- Mocked backend AI-triage HTTP calls in tests instead of relying on a live AI service.
- Strengthened backend auth validation by switching login/registration email fields to `EmailStr` and adding `email-validator` to backend requirements.
- Added AI safety regression coverage for emergency escalation, disclaimers, confidence thresholds, mental health crisis support, dermatology routing, and progress re-consultation logic.
- Fixed supporting code coupled to the new tests: escaped prompt-template JSON braces, added crisis helpline messaging to emergency responses, and corrected dermatology image red-flag flattening.

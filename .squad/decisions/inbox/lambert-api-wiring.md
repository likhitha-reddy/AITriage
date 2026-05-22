# Lambert API Wiring

**Date:** 2026-05-22T13:39:17Z

- Standardize the React Native app on a single Axios client with AsyncStorage-backed JWT persistence, automatic bearer injection, refresh-token retries, and centralized user-facing error handling.
- Treat backend responses as transport models and map them into mobile-first view models so the UI can stay stable even when API shapes are flatter than the screen needs.
- Cache recent triage results and progress check-ins locally to preserve usable patient flows when optional endpoints such as history/progress are unavailable.
- Route triage-to-consultation handoff through deep-linked navigation parameters so recommended specialization and triage context prefill the booking flow.
- Use shared frontend UX primitives (toast notifications, skeleton placeholders, empty states, and keyboard-safe form wrappers) across patient-facing mobile screens for a more production-ready healthcare experience.

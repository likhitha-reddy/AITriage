# Lambert — History

## Project Context
**Project:** AITriage — AI-powered healthcare triage platform (symptom analysis, doctor consultation, prescription management, progress tracking). Stack: React Native, Python/FastAPI, PostgreSQL. Initial focus: mental health and dermatology.
**User:** gsreddy

## Learnings

- 2026-05-22T12:22:01Z — Set up the React Native app skeleton under `mobile/` with manual entry files (`App.tsx`, `index.js`, `babel.config.js`, `metro.config.js`, `tsconfig.json`) so the project can be installed and run without using `react-native init`.
- 2026-05-22T12:22:01Z — Standardized frontend architecture around `src/navigation`, `src/screens`, `src/components`, `src/services`, `src/store`, `src/types`, `src/theme`, and `src/utils` for predictable feature ownership and reuse.
- 2026-05-22T12:22:01Z — Chose a root stack + bottom-tab navigation pattern with mock-first service modules and Zustand state (`src/store/authStore.ts`, `src/store/triageStore.ts`) to keep the app frontend-ready while backend APIs are still in progress.
- 2026-05-22T13:30:35Z (Cross-team sync): Dallas backend ready for real API calls at `/auth/*` and `/triage/*`. Ash AI microservice ready for integration. Safety guardrails active. Next: replace mock services with real HTTP client and connect to backend auth flow.
- 2026-05-22T13:39:17Z — Replaced the mobile mock stack with a JWT-aware API client, real auth/profile/subscription/prescription services, triage result caching, progress check-ins, deep-linked consultation booking, and production-oriented UX patterns such as toast feedback, skeletons, pull-to-refresh, and keyboard-safe forms.
- 2026-05-22T13:39:17Z (Session complete): Dallas backend fully operational; Ash AI specialized triage integrated; Kane test suite validates all mobile-API flows. Full-stack implementation SUCCESS.
- 2026-05-22T14:01:55Z — Added mobile-first payment CTA placeholders, mock-backed video consultation screens, notification services/store/UI, and a demo notification permission prompt so the app can ship polished consultation flows before real payments, push delivery, and WebRTC arrive.

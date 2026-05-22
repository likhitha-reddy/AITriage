# Lambert — History

## Project Context
**Project:** AITriage — AI-powered healthcare triage platform (symptom analysis, doctor consultation, prescription management, progress tracking). Stack: React Native, Python/FastAPI, PostgreSQL. Initial focus: mental health and dermatology.
**User:** gsreddy

## Learnings

- 2026-05-22T12:22:01Z — Set up the React Native app skeleton under `mobile/` with manual entry files (`App.tsx`, `index.js`, `babel.config.js`, `metro.config.js`, `tsconfig.json`) so the project can be installed and run without using `react-native init`.
- 2026-05-22T12:22:01Z — Standardized frontend architecture around `src/navigation`, `src/screens`, `src/components`, `src/services`, `src/store`, `src/types`, `src/theme`, and `src/utils` for predictable feature ownership and reuse.
- 2026-05-22T12:22:01Z — Chose a root stack + bottom-tab navigation pattern with mock-first service modules and Zustand state (`src/store/authStore.ts`, `src/store/triageStore.ts`) to keep the app frontend-ready while backend APIs are still in progress.

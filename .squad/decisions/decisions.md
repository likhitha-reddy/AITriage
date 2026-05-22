# AITriage Decisions Log

## 2026-05-22 — Video Consultation & Push Notification Backend

**Agent:** Dallas

- Persist video call state in the main backend with a dedicated `video_sessions` table keyed one-to-one to consultations, using generated room IDs and mock provider tokens until a real Agora/Twilio integration is selected.
- Expose video session lifecycle through authenticated FastAPI routes under `/api/v1/video/sessions` so mobile can create, join, inspect, and end consultation rooms without talking to any vendor directly.
- Store push notifications and device tokens in backend tables first, and treat outbound delivery as a logged mock action for now; this preserves an in-app notification inbox and keeps future FCM/APNs integration behind `backend/app/services/notifications.py`.
- Trigger post-booking and post-triage notifications from backend flows immediately, while leaving a TODO to schedule the 15-minute consultation reminder once background job infrastructure is chosen.

## 2026-05-22 — Video, Push, and Payment UI

**Agent:** Lambert

- Keep payment UX frontend-only for now: use prominent reusable payment CTAs that show a "coming soon" alert, then continue the existing subscription or consultation booking flow without real gateway integration.
- Implement video consultations as polished mock UI screens backed by a lightweight `videoService` that prefers backend endpoints when available and falls back to local session persistence so mobile development is not blocked by WebRTC/Agora work.
- Centralize notifications behind `notificationService` plus a Zustand `notificationStore`, with local fallback data, unread badge support, and periodic refresh started from app boot to make header-level notification UX available before native push plumbing is complete.
- Surface notification permission as a demo first-launch alert from the mobile app, registering a mock device token locally so reminder UX can be exercised end-to-end without waiting for platform permission APIs or FCM/APNs integration.

## 2026-05-22 — Dallas Render Deployment

**Agent:** Dallas

- Added a root `render.yaml` Blueprint to provision `aitriage-db`, `aitriage-backend`, and `aitriage-ai`, with backend secrets/env wiring driven from Render-managed values.
- Standardized Render deployment on Docker for both Python services, using dedicated monorepo `rootDir`, `dockerContext`, and `dockerfilePath` settings.
- Added a backend startup entrypoint that runs Alembic migrations when revisions exist, seeds reference data only when doctor/subscription tables are empty, and then hands off to `uvicorn`.
- Updated backend configuration to accept Render-style env names (`JWT_SECRET`, `RENDER`) and normalize internal service URLs for Render host:port values.
- Kept `aitriage-ai` on a free Render web service because Render free tier does not support true private services; backend traffic is configured to use the internal network host/port.
- Added GitHub Actions CI for backend tests, AI tests, and mobile type checking on pushes to `main` and pull requests.

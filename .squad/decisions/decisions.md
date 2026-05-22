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

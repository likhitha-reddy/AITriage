# Dallas — Video consultation and push backend

**Date:** 2026-05-22T14:01:55Z

- Persist video call state in the main backend with a dedicated `video_sessions` table keyed one-to-one to consultations, using generated room IDs and mock provider tokens until a real Agora/Twilio integration is selected.
- Expose video session lifecycle through authenticated FastAPI routes under `/api/v1/video/sessions` so mobile can create, join, inspect, and end consultation rooms without talking to any vendor directly.
- Store push notifications and device tokens in backend tables first, and treat outbound delivery as a logged mock action for now; this preserves an in-app notification inbox and keeps future FCM/APNs integration behind `backend/app/services/notifications.py`.
- Trigger post-booking and post-triage notifications from backend flows immediately, while leaving a TODO to schedule the 15-minute consultation reminder once background job infrastructure is chosen.

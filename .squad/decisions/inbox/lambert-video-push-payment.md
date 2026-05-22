# Lambert — Video, Push, and Payment UI Decisions

**Date:** 2026-05-22T14:01:55Z

- Keep payment UX frontend-only for now: use prominent reusable payment CTAs that show a “coming soon” alert, then continue the existing subscription or consultation booking flow without real gateway integration.
- Implement video consultations as polished mock UI screens backed by a lightweight `videoService` that prefers backend endpoints when available and falls back to local session persistence so mobile development is not blocked by WebRTC/Agora work.
- Centralize notifications behind `notificationService` plus a Zustand `notificationStore`, with local fallback data, unread badge support, and periodic refresh started from app boot to make header-level notification UX available before native push plumbing is complete.
- Surface notification permission as a demo first-launch alert from the mobile app, registering a mock device token locally so reminder UX can be exercised end-to-end without waiting for platform permission APIs or FCM/APNs integration.

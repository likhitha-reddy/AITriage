# Dallas Render Deployment Decisions

**Date:** 2026-05-22T14:24:47Z

- Added a root `render.yaml` Blueprint to provision `aitriage-db`, `aitriage-backend`, and `aitriage-ai`, with backend secrets/env wiring driven from Render-managed values.
- Standardized Render deployment on Docker for both Python services, using dedicated monorepo `rootDir`, `dockerContext`, and `dockerfilePath` settings.
- Added a backend startup entrypoint that runs Alembic migrations when revisions exist, seeds reference data only when doctor/subscription tables are empty, and then hands off to `uvicorn`.
- Updated backend configuration to accept Render-style env names (`JWT_SECRET`, `RENDER`) and normalize internal service URLs for Render host:port values.
- Kept `aitriage-ai` on a free Render web service because Render free tier does not support true private services; backend traffic is configured to use the internal network host/port.
- Added GitHub Actions CI for backend tests, AI tests, and mobile type checking on pushes to `main` and pull requests.

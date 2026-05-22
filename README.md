# AITriage

[![CI](https://github.com/likhitha-reddy/AITriage/actions/workflows/ci.yml/badge.svg)](https://github.com/likhitha-reddy/AITriage/actions/workflows/ci.yml)

AITriage is a greenfield AI healthcare triage platform designed to move patients from symptom intake to triage guidance, doctor consultation, prescriptions, and progress tracking. The first product focus is mental health and dermatology, with an architecture intended to expand into additional specialties over time.

## Architecture Overview
- **Mobile app (`mobile/`)** captures symptoms, presents triage guidance, supports consultation booking, and tracks progress.
- **Backend (`backend/`)** is the FastAPI system of record for APIs, workflows, scheduling, prescriptions, and subscriptions.
- **AI engine (`ai/`)** analyzes symptom submissions and returns structured triage outcomes.
- **Shared contracts (`shared/`)** keep schemas aligned across services.

## Getting Started
> Placeholder: service-specific setup steps will be added as backend, mobile, and AI components are scaffolded by the delivery team.

High-level next steps:
1. Set up the FastAPI backend in `backend/`.
2. Set up the React Native mobile app in `mobile/`.
3. Set up the Python AI triage engine in `ai/`.
4. Define shared schemas and API contracts in `shared/`.

## Deployment
- Render infrastructure is defined in [`render.yaml`](render.yaml).
- A step-by-step deployment guide is available in [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).
- CI runs on pushes to `main` and pull requests via [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

## Tech Stack
- React Native
- Python FastAPI
- PostgreSQL
- LLM APIs for triage analysis

## Project Structure
```text
AITriage/
|-- backend/   # FastAPI service
|-- mobile/    # React Native app
|-- ai/        # AI triage engine
|-- docs/      # Architecture and data model documentation
|-- shared/    # Shared types and contracts
|-- README.md
|-- .gitignore
```

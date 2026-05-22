# AITriage Architecture

**Date:** 2026-05-22T12:22:01Z

## System Overview
AITriage is a healthcare triage platform that guides a patient from first symptoms through care delivery and follow-up. The initial experience starts in the mobile app, where a patient records symptoms and health context. The AI triage engine analyzes the submission, produces a triage result with confidence and a recommended next action, and sends that result to the backend for persistence and workflow orchestration.

When the result indicates clinician review or consultation is appropriate, the backend coordinates doctor discovery, booking, consultation state, prescriptions, and progress tracking. Doctors use backend-managed data to review prior symptoms, AI output, and consultation history before issuing guidance or prescriptions. After treatment, the patient continues using the mobile experience to track progress, follow prescriptions, and provide symptom updates for ongoing monitoring.

Initial clinical focus areas are **mental health** and **dermatology**, which lets the platform constrain triage pathways, domain prompts, intake forms, and specialist matching while the architecture remains extensible for future specialties.

## Service Boundaries

### Mobile App (`mobile/`)
- React Native patient-facing application.
- Captures symptom intake, triage questionnaires, appointment booking, prescriptions, and progress updates.
- Should avoid embedding business rules or healthcare decisioning logic locally.
- Communicates only with the backend API.

### Backend API (`backend/`)
- FastAPI service that acts as the system of record and orchestration layer.
- Owns authentication, patient and doctor profiles, scheduling, consultation lifecycle, prescription records, subscriptions, auditability, and API contracts.
- Persists clinical and operational data in PostgreSQL.
- Invokes the AI engine through internal service boundaries, not directly from the mobile client.

### AI Engine (`ai/`)
- Python service/library for symptom interpretation and triage recommendation generation.
- Consumes structured symptom/context payloads from the backend.
- Returns analysis, confidence, specialty hints, risk flags, and recommended next steps.
- Should remain stateless where possible, with prompts/models/versioning managed explicitly for traceability.

### Shared Contracts (`shared/`)
- Cross-service schemas, API contracts, payload examples, and canonical entity definitions.
- Prevents drift between mobile payloads, backend models, and AI input/output schemas.

## Data Flow Diagram
```text
Patient (Mobile App)
  -> submits symptoms, intake answers, and context
Backend API
  -> validates request, stores symptom intake, creates triage job/request
AI Engine
  -> analyzes symptoms and returns TriageResult
Backend API
  -> persists result, determines workflow, recommends self-care or consultation
Mobile App
  -> displays triage guidance and available next actions
Patient
  -> books doctor consultation when needed
Backend API
  -> manages consultation, doctor assignment, notes, prescription, and status
Doctor
  -> reviews triage context and completes consultation
Backend API
  -> stores prescription and care plan
Mobile App
  -> shows prescription details and progress tracking prompts
Patient
  -> submits follow-up progress updates and new symptoms as needed
```

## Key Entities
- **Patient** — end user receiving care, owning symptom submissions, consultations, prescriptions, and subscription state.
- **Doctor** — licensed clinician with specialties, availability, and consultation assignments.
- **Consultation** — scheduled or completed interaction between patient and doctor, including status, notes, and outcome.
- **Prescription** — treatment instruction linked to a consultation, including drugs, dosage, and duration.
- **Symptom** — structured patient-reported issue, severity, duration, and optional media/context.
- **TriageResult** — AI-generated analysis containing confidence, urgency, recommended action, and supporting rationale metadata.

## Tech Stack Decisions
- **Mobile:** React Native for cross-platform patient experience.
- **Backend:** Python FastAPI for API development and service orchestration.
- **Database:** PostgreSQL as the primary transactional data store.
- **AI:** Python-based triage engine integrating with LLM APIs and healthcare-specific prompt workflows.
- **Contracts:** Shared schemas in `shared/` to keep backend, mobile, and AI interfaces aligned.

## Architecture Principles
- Backend is the single gateway for mobile clients.
- AI recommendations support care workflows but do not replace clinician judgment.
- Keep PHI handling centralized, auditable, and minimized across services.
- Prefer explicit contracts and versioned AI outputs for traceability.
- Design specialty modules so mental health and dermatology can evolve independently within a common platform foundation.

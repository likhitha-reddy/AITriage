# AITriage Data Model

**Date:** 2026-05-22T12:22:01Z

## Modeling Notes
- PostgreSQL is the initial system of record for operational and clinical workflow data.
- The backend owns persistence and exposes canonical APIs to mobile and AI services.
- AI outputs should be stored as explicit triage records rather than overwriting patient-submitted symptoms.
- Clinical entities should preserve audit history, timestamps, status transitions, and ownership metadata.

## Users (Patients)
Represents the patient receiving triage and care.

**Core attributes**
- `id`
- `full_name`
- `date_of_birth`
- `email`
- `phone`
- `gender`
- `subscription_id`
- `created_at`, `updated_at`

**Relationships**
- One patient can submit many symptom records.
- One patient can have many triage results.
- One patient can book many consultations.
- One patient can receive many prescriptions through consultations.
- One patient is linked to zero or one active subscription record at a time.

## Doctors
Represents clinicians available for consultation.

**Core attributes**
- `id`
- `full_name`
- `license_number`
- `specializations` (mental health, dermatology, future specialties)
- `availability_status`
- `availability_schedule`
- `bio`
- `created_at`, `updated_at`

**Relationships**
- One doctor can have many consultations.
- A doctor may author many consultation notes and many prescriptions.
- Doctor availability informs booking logic for consultations.

## Consultations
Represents a scheduled, active, cancelled, or completed care interaction.

**Core attributes**
- `id`
- `patient_id`
- `doctor_id`
- `triage_result_id` (nullable for non-triage-originated consultations if needed later)
- `scheduled_for`
- `status` (requested, booked, in_progress, completed, cancelled)
- `consultation_notes`
- `outcome_summary`
- `created_at`, `updated_at`

**Relationships**
- Many consultations belong to one patient.
- Many consultations belong to one doctor.
- A consultation may reference one originating triage result.
- A consultation can produce zero or many prescriptions.

## Prescriptions
Represents treatment guidance issued during or after consultation.

**Core attributes**
- `id`
- `consultation_id`
- `patient_id`
- `doctor_id`
- `drug_name`
- `dosage`
- `frequency`
- `duration`
- `instructions`
- `status` (active, completed, cancelled)
- `created_at`, `updated_at`

**Relationships**
- Many prescriptions belong to one consultation.
- Many prescriptions belong to one patient.
- Many prescriptions are authored by one doctor.

## TriageResults
Represents the AI analysis of patient-reported symptoms.

**Core attributes**
- `id`
- `patient_id`
- `symptom_snapshot` (structured symptoms submitted for analysis)
- `ai_analysis`
- `confidence_score`
- `recommended_action`
- `urgency_level`
- `suggested_specialization`
- `model_version`
- `created_at`

**Relationships**
- Many triage results belong to one patient.
- A triage result may lead to zero or many consultations over time, though the initial model should assume a primary originating consultation.
- Triage results should retain immutable input/output snapshots for auditability and model review.

## Subscriptions
Represents commercial access and billing state.

**Core attributes**
- `id`
- `patient_id`
- `plan_name`
- `status` (trial, active, past_due, cancelled)
- `billing_provider_reference`
- `start_date`
- `renewal_date`
- `cancelled_at` (nullable)
- `created_at`, `updated_at`

**Relationships**
- One subscription belongs to one patient.
- A patient may have a historical series of subscriptions, but only one active subscription should exist at a time.

## Relationship Summary
```text
Patient 1---* TriageResult
Patient 1---* Consultation
Patient 1---* Prescription
Patient 1---* Subscription (historical), 1---0..1 active
Doctor 1---* Consultation
Doctor 1---* Prescription
Consultation *---1 Patient
Consultation *---1 Doctor
Consultation 1---* Prescription
Consultation *---0..1 TriageResult
```

## Early Data Integrity Rules
- Consultations must reference valid patient and doctor records.
- Prescriptions must be tied to a consultation for clinical traceability.
- Triage results must store structured symptom input and model metadata.
- Subscription status should gate premium workflows without being embedded into clinical entities.
- Specialty tagging should support the initial focus on mental health and dermatology.

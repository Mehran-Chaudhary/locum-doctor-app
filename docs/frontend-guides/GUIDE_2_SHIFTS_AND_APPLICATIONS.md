# Guide 2 — Shifts & Applications

> **Audience**: Mobile / Frontend Engineers  
> **Backend**: NestJS + Prisma + PostgreSQL (Supabase) + JWT  
> **Last Updated**: March 2, 2026  
> **Prerequisite**: Read [Guide 1 — Auth & Onboarding](./GUIDE_1_AUTH_AND_ONBOARDING.md)

---

## Table of Contents

1. [Overview & Business Logic](#1-overview--business-logic)
2. [Shift Lifecycle State Machine](#2-shift-lifecycle-state-machine)
3. [Application Lifecycle State Machine](#3-application-lifecycle-state-machine)
4. [Shift Data Model](#4-shift-data-model)
5. [ShiftApplication Data Model](#5-shiftapplication-data-model)
6. [Shift Endpoints (Hospital + Doctor)](#6-shift-endpoints)
   - 6.1 [Create Shift (Hospital)](#61-create-shift-hospital)
   - 6.2 [Get Hospital's Own Shifts (Hospital)](#62-get-hospitals-own-shifts-hospital)
   - 6.3 [Doctor Shift Feed — Geo-Spatial Search (Doctor)](#63-doctor-shift-feed--geo-spatial-search-doctor)
   - 6.4 [Get Shift Details (Any Verified User)](#64-get-shift-details-any-verified-user)
   - 6.5 [Cancel Shift (Hospital)](#65-cancel-shift-hospital)
7. [Application Endpoints (Doctor + Hospital)](#7-application-endpoints)
   - 7.1 [Apply for Shift (Doctor)](#71-apply-for-shift-doctor)
   - 7.2 [Get My Applications (Doctor)](#72-get-my-applications-doctor)
   - 7.3 [Withdraw Application (Doctor)](#73-withdraw-application-doctor)
   - 7.4 [Get Shift Applicants (Hospital)](#74-get-shift-applicants-hospital)
   - 7.5 [Accept Application (Hospital)](#75-accept-application-hospital)
8. [Complete Shift→Application Flow Diagram](#8-complete-shiftapplication-flow-diagram)
9. [Geo-Spatial Distance Calculation](#9-geo-spatial-distance-calculation)
10. [Auto-Expiry Behavior (Cron Jobs)](#10-auto-expiry-behavior-cron-jobs)
11. [Notification Events Triggered](#11-notification-events-triggered)
12. [Frontend Implementation Guide](#12-frontend-implementation-guide)

---

## 1. Overview & Business Logic

The **Shift & Application** system is the core marketplace feature:

1. **Hospitals** post shift openings (like job listings) specifying when, where, what specialty, and how much they'll pay per hour
2. **Doctors** browse a personalized feed of available shifts near them, filtered by specialty, city, date, and distance
3. **Doctors apply** to shifts they're interested in
4. **Hospitals review** applicants and **accept one** doctor per shift
5. When a doctor is accepted, all other applicants are **automatically rejected**, the shift status becomes `FILLED`, and a **timesheet** is automatically created for the clock-in/out flow (covered in Guide 3)

### Key Business Rules

| Rule | Detail |
|------|--------|
| **Who can create shifts** | Only `HOSPITAL` role with `VERIFIED` status |
| **Who can browse/apply** | Only `DOCTOR` role with `VERIFIED` status |
| **One doctor per shift** | Accepting one doctor auto-rejects all others |
| **No duplicate applications** | A doctor can only apply once per shift |
| **Schedule conflict detection** | Cannot apply if you have an ACCEPTED shift that overlaps in time |
| **Time validation** | Start must be in the future, end after start, minimum 2 hours |
| **Only OPEN shifts accept applications** | Once FILLED/CANCELLED/EXPIRED, no more applications |
| **Only OPEN shifts can be cancelled** | Already FILLED/IN_PROGRESS/COMPLETED shifts cannot be cancelled |
| **Auto-expiry** | OPEN shifts past their start time are automatically expired by cron |
| **Calculated fields** | `totalDurationHrs` and `totalEstimatedPay` are computed server-side |

---

## 2. Shift Lifecycle State Machine

```
                    ┌──────────────────────────────────────────────────┐
                    │              SHIFT STATUS FLOW                    │
                    ├──────────────────────────────────────────────────┤
                    │                                                  │
                    │   Hospital creates shift                         │
                    │          │                                       │
                    │          ▼                                       │
                    │       ┌──────┐                                   │
                    │       │ OPEN │ ◄── Doctors can apply             │
                    │       └──┬───┘                                   │
                    │          │                                       │
                    │    ┌─────┼──────────┐                            │
                    │    │     │          │                             │
                    │    ▼     ▼          ▼                             │
                    │ ┌──────┐ ┌────────┐ ┌─────────┐                  │
                    │ │FILLED│ │EXPIRED │ │CANCELLED│                  │
                    │ └──┬───┘ └────────┘ └─────────┘                  │
                    │    │   (cron/auto)  (hospital)                    │
                    │    │                                             │
                    │    ▼  Doctor clocks in                           │
                    │ ┌────────────┐                                   │
                    │ │IN_PROGRESS │                                   │
                    │ └──────┬─────┘                                   │
                    │        │  Doctor clocks out                      │
                    │        ▼                                         │
                    │   ┌──────────┐                                   │
                    │   │COMPLETED │                                   │
                    │   └──────────┘                                   │
                    │                                                  │
                    └──────────────────────────────────────────────────┘
```

### Status Transitions

| From          | To             | Trigger                                    |
|---------------|----------------|--------------------------------------------|
| `OPEN`        | `FILLED`       | Hospital accepts an application             |
| `OPEN`        | `EXPIRED`      | Cron: start time passed with no acceptance  |
| `OPEN`        | `CANCELLED`    | Hospital manually cancels                   |
| `FILLED`      | `IN_PROGRESS`  | Doctor clocks in (Guide 3)                  |
| `FILLED`      | `EXPIRED`      | Cron: shift end time passed, doctor never clocked in |
| `IN_PROGRESS` | `COMPLETED`    | Doctor clocks out (Guide 3)                 |

---

## 3. Application Lifecycle State Machine

```
                    ┌──────────────────────────────────────┐
                    │     APPLICATION STATUS FLOW           │
                    ├──────────────────────────────────────┤
                    │                                      │
                    │  Doctor applies                      │
                    │       │                              │
                    │       ▼                              │
                    │   ┌────────┐                         │
                    │   │APPLIED │                         │
                    │   └───┬────┘                         │
                    │       │                              │
                    │  ┌────┼──────────┐                   │
                    │  │    │          │                    │
                    │  ▼    ▼          ▼                    │
                    │ ┌────────┐ ┌────────┐ ┌─────────┐    │
                    │ │ACCEPTED│ │REJECTED│ │WITHDRAWN│    │
                    │ └────────┘ └────────┘ └─────────┘    │
                    │ (hospital   (hospital    (doctor      │
                    │  accepts)   rejects OR   withdraws)   │
                    │             auto-reject               │
                    │             on accept                  │
                    │             another OR                 │
                    │             shift cancel/              │
                    │             expire)                    │
                    └──────────────────────────────────────┘
```

### Status Transitions

| From      | To         | Trigger                                              |
|-----------|------------|------------------------------------------------------|
| `APPLIED` | `ACCEPTED` | Hospital accepts this specific application           |
| `APPLIED` | `REJECTED` | Hospital accepts another applicant (auto-reject)     |
| `APPLIED` | `REJECTED` | Hospital cancels the shift (all APPLIED → REJECTED)  |
| `APPLIED` | `REJECTED` | Cron expires the shift (all APPLIED → REJECTED)      |
| `APPLIED` | `WITHDRAWN`| Doctor manually withdraws their application          |

---

## 4. Shift Data Model

This is the full shape of a Shift object as returned by the API:

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "hospitalProfileId": "880e8400-e29b-41d4-a716-446655440000",
  "title": "Night Shift MO",
  "department": "EMERGENCY",
  "requiredSpecialty": "ER_SPECIALIST",
  "description": "Need an experienced ER doctor for night coverage.",
  "startTime": "2026-03-05T20:00:00.000Z",
  "endTime": "2026-03-06T08:00:00.000Z",
  "hourlyRate": "1500.00",
  "totalDurationHrs": 12,
  "totalEstimatedPay": "18000.00",
  "urgency": "NORMAL",
  "status": "OPEN",
  "createdAt": "2026-03-02T10:00:00.000Z",
  "updatedAt": "2026-03-02T10:00:00.000Z"
}
```

| Field               | Type                | Notes                                       |
|---------------------|---------------------|---------------------------------------------|
| `id`                | `string` (UUID)     | Primary key                                 |
| `hospitalProfileId` | `string` (UUID)     | Which hospital posted this shift            |
| `title`             | `string`            | Short human-readable shift title            |
| `department`        | `Department` enum   | See Guide 1 enums                           |
| `requiredSpecialty` | `Specialty` enum    | Doctor specialty needed                     |
| `description`       | `string \| null`    | Optional detailed description               |
| `startTime`         | `string` (ISO 8601) | When the shift starts                       |
| `endTime`           | `string` (ISO 8601) | When the shift ends                         |
| `hourlyRate`        | `string` (Decimal)  | PKR per hour (e.g., `"1500.00"`)            |
| `totalDurationHrs`  | `number`            | **Server-calculated**: hours between start & end |
| `totalEstimatedPay` | `string` (Decimal)  | **Server-calculated**: `hourlyRate × totalDurationHrs` |
| `urgency`           | `ShiftUrgency` enum | `NORMAL` or `URGENT`                        |
| `status`            | `ShiftStatus` enum  | Current lifecycle status                    |
| `createdAt`         | `string` (ISO 8601) |                                             |
| `updatedAt`         | `string` (ISO 8601) |                                             |

> **Note**: `hourlyRate` and `totalEstimatedPay` are returned as **strings** (Prisma Decimal type). Parse them to `float` on the frontend for display. Example: `parseFloat("1500.00")` → `1500`.

---

## 5. ShiftApplication Data Model

```json
{
  "id": "b2c3d4e5-f6a7-8901-bcde-f23456789012",
  "shiftId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "doctorProfileId": "660e8400-e29b-41d4-a716-446655440000",
  "status": "APPLIED",
  "createdAt": "2026-03-02T11:00:00.000Z",
  "updatedAt": "2026-03-02T11:00:00.000Z"
}
```

| Field              | Type                   | Notes                              |
|--------------------|------------------------|------------------------------------|
| `id`               | `string` (UUID)        | Application ID                     |
| `shiftId`          | `string` (UUID)        | Which shift this application is for |
| `doctorProfileId`  | `string` (UUID)        | Which doctor applied               |
| `status`           | `ApplicationStatus`    | `APPLIED`, `ACCEPTED`, `REJECTED`, `WITHDRAWN` |
| `createdAt`        | `string` (ISO 8601)    |                                    |
| `updatedAt`        | `string` (ISO 8601)    |                                    |

> A doctor can only have **one application** per shift (enforced by unique constraint on `shiftId + doctorProfileId`).

---

## 6. Shift Endpoints

> **All shift endpoints require**: Bearer Token + `VERIFIED` status

---

### 6.1 Create Shift (Hospital)

Creates a new shift listing. The server auto-calculates `totalDurationHrs` and `totalEstimatedPay`.

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `/shift` |
| **Auth** | Bearer Token |
| **Role** | `HOSPITAL` |
| **Status** | `VERIFIED` |

#### Request Body

```json
{
  "title": "Night Shift MO",
  "department": "EMERGENCY",
  "requiredSpecialty": "ER_SPECIALIST",
  "description": "Need an experienced ER doctor for night coverage.",
  "startTime": "2026-03-05T20:00:00.000Z",
  "endTime": "2026-03-06T08:00:00.000Z",
  "hourlyRate": 1500,
  "urgency": "URGENT"
}
```

| Field              | Type     | Required | Validation                                     |
|--------------------|----------|----------|-------------------------------------------------|
| `title`            | `string` | Yes      | Non-empty, max 200 characters                  |
| `department`       | `string` | Yes      | Must be valid `Department` enum                |
| `requiredSpecialty`| `string` | Yes      | Must be valid `Specialty` enum                 |
| `description`      | `string` | No       | Max 2000 characters                            |
| `startTime`        | `string` | Yes      | ISO 8601 datetime, must be in the **future**   |
| `endTime`          | `string` | Yes      | ISO 8601 datetime, must be **after** startTime |
| `hourlyRate`       | `number` | Yes      | Positive number, max 2 decimal places          |
| `urgency`          | `string` | No       | `"NORMAL"` (default) or `"URGENT"`             |

#### Server-Side Validation Rules

| Rule | Error |
|------|-------|
| Start time must be in the future | "Shift start time must be in the future." |
| End time must be after start time | "Shift end time must be after start time." |
| Minimum duration: 2 hours | "Shift must be at least 2 hours long." |
| Hospital profile must exist | "Hospital profile not found. Please complete your profile first." |

#### Success Response — `201 Created`

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "hospitalProfileId": "880e8400-e29b-41d4-a716-446655440000",
  "title": "Night Shift MO",
  "department": "EMERGENCY",
  "requiredSpecialty": "ER_SPECIALIST",
  "description": "Need an experienced ER doctor for night coverage.",
  "startTime": "2026-03-05T20:00:00.000Z",
  "endTime": "2026-03-06T08:00:00.000Z",
  "hourlyRate": "1500",
  "totalDurationHrs": 12,
  "totalEstimatedPay": "18000",
  "urgency": "URGENT",
  "status": "OPEN",
  "createdAt": "2026-03-02T10:00:00.000Z",
  "updatedAt": "2026-03-02T10:00:00.000Z",
  "hospitalProfile": {
    "hospitalName": "Mayo Hospital",
    "city": "Lahore",
    "latitude": 31.5204,
    "longitude": 74.3587
  }
}
```

> **Side effect**: If the shift is `URGENT`, the notification engine automatically pushes alerts to all verified doctors within 20km who match the required specialty.

#### Error Responses

| Status | Condition                       | Message                                                       |
|--------|---------------------------------|---------------------------------------------------------------|
| 400    | Hospital profile not found      | "Hospital profile not found. Please complete your profile first." |
| 400    | Start time in the past          | "Shift start time must be in the future."                     |
| 400    | End before start                | "Shift end time must be after start time."                    |
| 400    | Duration < 2 hours              | "Shift must be at least 2 hours long."                        |

---

### 6.2 Get Hospital's Own Shifts (Hospital)

Returns all shifts posted by the currently logged-in hospital, optionally filtered by status.

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/shift/hospital` |
| **Auth** | Bearer Token |
| **Role** | `HOSPITAL` |
| **Status** | `VERIFIED` |

#### Query Parameters

| Parameter | Type     | Required | Description                                     |
|-----------|----------|----------|-------------------------------------------------|
| `status`  | `string` | No       | Filter by shift status: `OPEN`, `FILLED`, `IN_PROGRESS`, `COMPLETED`, `EXPIRED`, `CANCELLED` |

#### Example Requests

```
GET /shift/hospital
GET /shift/hospital?status=OPEN
GET /shift/hospital?status=COMPLETED
```

#### Success Response — `200 OK`

Returns an **array** of shift objects with application count:

```json
[
  {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "hospitalProfileId": "880e8400-e29b-41d4-a716-446655440000",
    "title": "Night Shift MO",
    "department": "EMERGENCY",
    "requiredSpecialty": "ER_SPECIALIST",
    "description": "Need an experienced ER doctor for night coverage.",
    "startTime": "2026-03-05T20:00:00.000Z",
    "endTime": "2026-03-06T08:00:00.000Z",
    "hourlyRate": "1500.00",
    "totalDurationHrs": 12,
    "totalEstimatedPay": "18000.00",
    "urgency": "URGENT",
    "status": "OPEN",
    "createdAt": "2026-03-02T10:00:00.000Z",
    "updatedAt": "2026-03-02T10:00:00.000Z",
    "_count": {
      "applications": 5
    }
  },
  {
    "id": "...",
    "title": "Day Shift Pediatrician",
    "status": "FILLED",
    "_count": {
      "applications": 3
    }
  }
]
```

> **`_count.applications`** tells the hospital how many doctors have applied. Use this to show a badge like "5 applicants" on each shift card.

#### Error Responses

| Status | Condition                   | Message                          |
|--------|-----------------------------|----------------------------------|
| 400    | Hospital profile not found  | "Hospital profile not found."    |

---

### 6.3 Doctor Shift Feed — Geo-Spatial Search (Doctor)

This is the **main shift discovery endpoint** for doctors. Returns available shifts sorted and filtered with **real-time distance calculation** from the doctor's saved location.

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/shift/feed` |
| **Auth** | Bearer Token |
| **Role** | `DOCTOR` |
| **Status** | `VERIFIED` |

#### Query Parameters

| Parameter       | Type     | Required | Default              | Description                                          |
|-----------------|----------|----------|----------------------|------------------------------------------------------|
| `city`          | `string` | No       | —                     | Filter by city (case-insensitive exact match)        |
| `specialty`     | `string` | No       | —                     | Filter by required specialty (enum value)            |
| `dateFrom`      | `string` | No       | —                     | Only show shifts starting after this date (ISO 8601) |
| `dateTo`        | `string` | No       | —                     | Only show shifts starting before this date (ISO 8601)|
| `maxDistanceKm` | `number` | No       | —                     | Max distance in km from doctor's location (1–500)    |
| `sortBy`        | `string` | No       | `starting_soonest`    | Sort order (see below)                               |
| `page`          | `number` | No       | `1`                   | Page number                                          |
| `limit`         | `number` | No       | `20`                  | Items per page (1–100)                               |

#### Sort Options

| Value              | Description                                    |
|--------------------|------------------------------------------------|
| `starting_soonest` | Shifts starting soonest first (default)        |
| `highest_pay`      | Highest hourly rate first                      |
| `distance`         | Nearest shifts first (requires doctor lat/lng) |

#### Example Requests

```
GET /shift/feed
GET /shift/feed?city=Lahore&specialty=MEDICAL_OFFICER
GET /shift/feed?maxDistanceKm=15&sortBy=distance
GET /shift/feed?dateFrom=2026-03-05&dateTo=2026-03-10&sortBy=highest_pay
GET /shift/feed?page=2&limit=10
```

#### Success Response — `200 OK`

```json
{
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "hospitalProfileId": "880e8400-e29b-41d4-a716-446655440000",
      "title": "Night Shift MO",
      "department": "EMERGENCY",
      "requiredSpecialty": "ER_SPECIALIST",
      "description": "Need an experienced ER doctor for night coverage.",
      "startTime": "2026-03-05T20:00:00.000Z",
      "endTime": "2026-03-06T08:00:00.000Z",
      "hourlyRate": "1500.00",
      "totalDurationHrs": 12,
      "totalEstimatedPay": "18000.00",
      "urgency": "URGENT",
      "status": "OPEN",
      "createdAt": "2026-03-02T10:00:00.000Z",
      "updatedAt": "2026-03-02T10:00:00.000Z",
      "hospitalProfile": {
        "id": "880e8400-e29b-41d4-a716-446655440000",
        "hospitalName": "Mayo Hospital",
        "address": "2-Jail Road, Lahore",
        "city": "Lahore",
        "latitude": 31.5204,
        "longitude": 74.3587,
        "logoUrl": "https://supabase.co/storage/v1/object/public/...",
        "averageRating": 4.2,
        "totalReviews": 8
      },
      "_count": {
        "applications": 5
      },
      "distanceKm": 3.45
    },
    {
      "id": "...",
      "title": "Morning OPD Shift",
      "hospitalProfile": {
        "hospitalName": "Services Hospital",
        "city": "Lahore",
        "averageRating": 3.8,
        "totalReviews": 14
      },
      "_count": {
        "applications": 2
      },
      "distanceKm": 7.82
    }
  ],
  "meta": {
    "total": 42,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

#### Key Fields for Frontend

| Field                           | How to use                                                        |
|---------------------------------|-------------------------------------------------------------------|
| `distanceKm`                    | Show as "3.5 km away". Will be `null` if doctor or hospital has no lat/lng |
| `hospitalProfile.hospitalName`  | Hospital name on the shift card                                   |
| `hospitalProfile.logoUrl`       | Hospital logo image                                               |
| `hospitalProfile.averageRating` | Show hospital rating stars                                        |
| `hospitalProfile.totalReviews`  | Show "4.2 (8 reviews)"                                           |
| `_count.applications`           | Show "5 applicants" badge                                         |
| `urgency`                       | If `"URGENT"`, show a red/orange urgent badge                     |
| `totalEstimatedPay`             | Show total shift pay: "Rs. 18,000"                                |
| `hourlyRate`                    | Show rate: "Rs. 1,500/hr"                                         |
| `totalDurationHrs`              | Show duration: "12 hours"                                         |

#### How Distance Calculation Works

1. The backend reads the **doctor's saved latitude/longitude** from their profile
2. For each shift, it reads the **hospital's latitude/longitude** from the hospital profile
3. The **Haversine formula** calculates the "as-the-crow-flies" distance in kilometers
4. If `maxDistanceKm` is set, shifts beyond that radius are filtered out
5. If `sortBy=distance`, shifts are sorted nearest-first

> **IMPORTANT**: For accurate distance results, make sure the doctor has set `latitude` and `longitude` during profile creation. If either the doctor or hospital is missing coordinates, `distanceKm` will be `null`.

#### Error Responses

| Status | Condition                   | Message                                                    |
|--------|-----------------------------|------------------------------------------------------------|
| 400    | Doctor profile not found    | "Doctor profile not found. Please complete your profile first." |

---

### 6.4 Get Shift Details (Any Verified User)

Returns full details of a single shift including hospital profile.

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/shift/:id` |
| **Auth** | Bearer Token |
| **Role** | `DOCTOR`, `HOSPITAL`, `SUPER_ADMIN` |
| **Status** | `VERIFIED` |

#### URL Parameter

| Parameter | Type     | Description       |
|-----------|----------|-------------------|
| `id`      | `string` | Shift UUID        |

#### Success Response — `200 OK`

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "hospitalProfileId": "880e8400-e29b-41d4-a716-446655440000",
  "title": "Night Shift MO",
  "department": "EMERGENCY",
  "requiredSpecialty": "ER_SPECIALIST",
  "description": "Need an experienced ER doctor for night coverage.",
  "startTime": "2026-03-05T20:00:00.000Z",
  "endTime": "2026-03-06T08:00:00.000Z",
  "hourlyRate": "1500.00",
  "totalDurationHrs": 12,
  "totalEstimatedPay": "18000.00",
  "urgency": "URGENT",
  "status": "OPEN",
  "createdAt": "2026-03-02T10:00:00.000Z",
  "updatedAt": "2026-03-02T10:00:00.000Z",
  "hospitalProfile": {
    "id": "880e8400-e29b-41d4-a716-446655440000",
    "hospitalName": "Mayo Hospital",
    "address": "2-Jail Road, Lahore",
    "city": "Lahore",
    "latitude": 31.5204,
    "longitude": 74.3587,
    "logoUrl": "https://...",
    "averageRating": 4.2,
    "totalReviews": 8
  },
  "_count": {
    "applications": 5
  }
}
```

#### Error Responses

| Status | Condition           | Message              |
|--------|---------------------|----------------------|
| 404    | Shift not found     | "Shift not found."   |

---

### 6.5 Cancel Shift (Hospital)

Cancels an OPEN shift. All pending (`APPLIED`) applications are automatically rejected. Affected doctors are notified.

| | |
|---|---|
| **Method** | `PATCH` |
| **URL** | `/shift/:id/cancel` |
| **Auth** | Bearer Token |
| **Role** | `HOSPITAL` |
| **Status** | `VERIFIED` |

#### URL Parameter

| Parameter | Type     | Description       |
|-----------|----------|-------------------|
| `id`      | `string` | Shift UUID        |

#### Request Body

None.

#### Success Response — `200 OK`

Returns the updated shift object:

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "hospitalProfileId": "880e8400-e29b-41d4-a716-446655440000",
  "title": "Night Shift MO",
  "department": "EMERGENCY",
  "requiredSpecialty": "ER_SPECIALIST",
  "status": "CANCELLED",
  "startTime": "2026-03-05T20:00:00.000Z",
  "endTime": "2026-03-06T08:00:00.000Z",
  "hourlyRate": "1500.00",
  "totalDurationHrs": 12,
  "totalEstimatedPay": "18000.00",
  "urgency": "URGENT",
  "createdAt": "2026-03-02T10:00:00.000Z",
  "updatedAt": "2026-03-02T14:00:00.000Z"
}
```

#### Side Effects

| Action | Description |
|--------|-------------|
| All `APPLIED` applications → `REJECTED` | Automatically rejected |
| Push notification to applicants | All doctors who had applied are notified that the shift was cancelled |

#### Error Responses

| Status | Condition                        | Message                                                                   |
|--------|----------------------------------|---------------------------------------------------------------------------|
| 400    | Hospital profile not found       | "Hospital profile not found."                                             |
| 403    | Not this hospital's shift        | "You can only cancel your own shifts."                                    |
| 400    | Shift is not OPEN                | "Cannot cancel a shift with status FILLED. Only OPEN shifts can be cancelled." |
| 404    | Shift not found                  | "Shift not found."                                                        |

---

## 7. Application Endpoints

> **All application endpoints require**: Bearer Token + `VERIFIED` status

---

### 7.1 Apply for Shift (Doctor)

Doctor applies for an open shift. The backend checks for duplicate applications and schedule conflicts.

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `/application/apply` |
| **Auth** | Bearer Token |
| **Role** | `DOCTOR` |
| **Status** | `VERIFIED` |

#### Request Body

```json
{
  "shiftId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

| Field     | Type     | Required | Validation |
|-----------|----------|----------|------------|
| `shiftId` | `string` | Yes      | Valid UUID |

#### Success Response — `201 Created`

```json
{
  "id": "b2c3d4e5-f6a7-8901-bcde-f23456789012",
  "shiftId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "doctorProfileId": "660e8400-e29b-41d4-a716-446655440000",
  "status": "APPLIED",
  "createdAt": "2026-03-02T11:00:00.000Z",
  "updatedAt": "2026-03-02T11:00:00.000Z",
  "shift": {
    "title": "Night Shift MO",
    "startTime": "2026-03-05T20:00:00.000Z",
    "endTime": "2026-03-06T08:00:00.000Z",
    "hourlyRate": "1500.00",
    "hospitalProfile": {
      "hospitalName": "Mayo Hospital",
      "city": "Lahore"
    }
  }
}
```

#### Side Effects

| Action | Description |
|--------|-------------|
| Hospital is notified | Push notification: "Dr. Ahmed Khan has applied for Night Shift MO. You now have 5 applicant(s)." |

#### Error Responses

| Status | Condition                                  | Message                                                          |
|--------|--------------------------------------------|------------------------------------------------------------------|
| 400    | Doctor profile not found                   | "Doctor profile not found. Please complete your profile first."  |
| 403    | Account not verified                       | "Your account must be verified before applying for shifts."      |
| 404    | Shift not found                            | "Shift not found."                                              |
| 400    | Shift not OPEN                             | "Cannot apply to a shift with status FILLED. Only OPEN shifts accept applications." |
| 400    | Shift already started                      | "This shift has already started or passed."                      |
| 409    | Already applied                            | "You have already applied for this shift."                       |
| 409    | Schedule conflict                          | "Schedule conflict detected. You already have an accepted shift \"Day Shift Pediatrician\" from 2026-03-05T08:00:00.000Z to 2026-03-05T20:00:00.000Z." |

#### Schedule Conflict Detection — How It Works

When a doctor applies for a shift, the backend checks if the doctor has **any other ACCEPTED application** whose shift times overlap with the new shift:

```
Overlap exists when:
  existingShift.startTime < newShift.endTime
  AND
  existingShift.endTime > newShift.startTime
```

This prevents a doctor from being double-booked across overlapping time windows.

> **Note**: The conflict check only looks at `ACCEPTED` applications. A doctor can apply to multiple overlapping OPEN shifts — the conflict only fires if one is already accepted.

---

### 7.2 Get My Applications (Doctor)

Returns all applications the doctor has submitted, optionally filtered by status.

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/application/my` |
| **Auth** | Bearer Token |
| **Role** | `DOCTOR` |
| **Status** | `VERIFIED` |

#### Query Parameters

| Parameter | Type     | Required | Description                                           |
|-----------|----------|----------|-------------------------------------------------------|
| `status`  | `string` | No       | Filter: `APPLIED`, `ACCEPTED`, `REJECTED`, `WITHDRAWN` |

#### Example Requests

```
GET /application/my
GET /application/my?status=APPLIED
GET /application/my?status=ACCEPTED
```

#### Success Response — `200 OK`

Returns an **array** of applications with full shift and hospital details:

```json
[
  {
    "id": "b2c3d4e5-f6a7-8901-bcde-f23456789012",
    "shiftId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "doctorProfileId": "660e8400-e29b-41d4-a716-446655440000",
    "status": "APPLIED",
    "createdAt": "2026-03-02T11:00:00.000Z",
    "updatedAt": "2026-03-02T11:00:00.000Z",
    "shift": {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "hospitalProfileId": "880e8400-e29b-41d4-a716-446655440000",
      "title": "Night Shift MO",
      "department": "EMERGENCY",
      "requiredSpecialty": "ER_SPECIALIST",
      "description": "Need an experienced ER doctor for night coverage.",
      "startTime": "2026-03-05T20:00:00.000Z",
      "endTime": "2026-03-06T08:00:00.000Z",
      "hourlyRate": "1500.00",
      "totalDurationHrs": 12,
      "totalEstimatedPay": "18000.00",
      "urgency": "URGENT",
      "status": "OPEN",
      "createdAt": "2026-03-02T10:00:00.000Z",
      "updatedAt": "2026-03-02T10:00:00.000Z",
      "hospitalProfile": {
        "hospitalName": "Mayo Hospital",
        "address": "2-Jail Road, Lahore",
        "city": "Lahore",
        "logoUrl": "https://..."
      }
    }
  },
  {
    "id": "...",
    "status": "ACCEPTED",
    "shift": {
      "title": "Morning OPD Shift",
      "status": "FILLED",
      "hospitalProfile": {
        "hospitalName": "Services Hospital"
      }
    }
  }
]
```

#### Frontend Usage — Doctor's "My Applications" Screen

| Application Status | What to show                        | Actions available        |
|--------------------|-------------------------------------|--------------------------|
| `APPLIED`          | "Pending" badge (yellow)            | "Withdraw" button        |
| `ACCEPTED`         | "Accepted! ✅" badge (green)         | "View Shift" → clock-in  |
| `REJECTED`         | "Not selected" badge (gray)         | None                     |
| `WITHDRAWN`        | "Withdrawn" badge (gray)            | None                     |

---

### 7.3 Withdraw Application (Doctor)

Doctor withdraws a pending application. Only `APPLIED` status applications can be withdrawn.

| | |
|---|---|
| **Method** | `PATCH` |
| **URL** | `/application/:id/withdraw` |
| **Auth** | Bearer Token |
| **Role** | `DOCTOR` |
| **Status** | `VERIFIED` |

#### URL Parameter

| Parameter | Type     | Description        |
|-----------|----------|--------------------|
| `id`      | `string` | Application UUID   |

#### Request Body

None.

#### Success Response — `200 OK`

```json
{
  "id": "b2c3d4e5-f6a7-8901-bcde-f23456789012",
  "shiftId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "doctorProfileId": "660e8400-e29b-41d4-a716-446655440000",
  "status": "WITHDRAWN",
  "createdAt": "2026-03-02T11:00:00.000Z",
  "updatedAt": "2026-03-02T14:00:00.000Z"
}
```

#### Error Responses

| Status | Condition                            | Message                                                        |
|--------|--------------------------------------|----------------------------------------------------------------|
| 400    | Doctor profile not found             | "Doctor profile not found."                                    |
| 404    | Application not found                | "Application not found."                                       |
| 403    | Not your application                 | "You can only withdraw your own applications."                 |
| 400    | Application not in APPLIED status    | "Cannot withdraw an application with status ACCEPTED."         |

---

### 7.4 Get Shift Applicants (Hospital)

Hospital views all the doctors who applied for a specific shift. Used to review and select a doctor.

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/application/shift/:shiftId/applicants` |
| **Auth** | Bearer Token |
| **Role** | `HOSPITAL` |
| **Status** | `VERIFIED` |

#### URL Parameter

| Parameter | Type     | Description       |
|-----------|----------|-------------------|
| `shiftId` | `string` | Shift UUID        |

#### Success Response — `200 OK`

```json
{
  "shiftId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "shiftTitle": "Night Shift MO",
  "totalApplicants": 3,
  "applicants": [
    {
      "id": "b2c3d4e5-f6a7-8901-bcde-f23456789012",
      "shiftId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "doctorProfileId": "660e8400-e29b-41d4-a716-446655440000",
      "status": "APPLIED",
      "createdAt": "2026-03-02T11:00:00.000Z",
      "updatedAt": "2026-03-02T11:00:00.000Z",
      "doctorProfile": {
        "id": "660e8400-e29b-41d4-a716-446655440000",
        "firstName": "Ahmed",
        "lastName": "Khan",
        "city": "Lahore",
        "pmdcNumber": "12345-P",
        "specialty": "ER_SPECIALIST",
        "yearsExperience": 3,
        "hourlyRate": "1500.00",
        "bio": "Experienced ER doctor with 3 years at Mayo Hospital.",
        "profilePicUrl": "https://...",
        "averageRating": 4.5,
        "totalReviews": 12,
        "user": {
          "status": "VERIFIED",
          "phoneVerified": true
        }
      }
    },
    {
      "id": "c3d4e5f6-a7b8-9012-cdef-345678901234",
      "status": "APPLIED",
      "doctorProfile": {
        "firstName": "Sara",
        "lastName": "Ahmed",
        "city": "Lahore",
        "pmdcNumber": "67890-P",
        "specialty": "MEDICAL_OFFICER",
        "yearsExperience": 5,
        "hourlyRate": "2000.00",
        "averageRating": 4.8,
        "totalReviews": 20,
        "profilePicUrl": "https://..."
      }
    }
  ]
}
```

#### Frontend Usage — Hospital's "Review Applicants" Screen

For each applicant, display a card with:
- Profile picture (`doctorProfile.profilePicUrl`)
- Name (`firstName` + `lastName`)
- PMDC number
- Specialty
- Experience: "3 years"
- Hourly rate: "Rs. 1,500/hr"
- Rating stars: "4.5 ⭐ (12 reviews)"
- Bio snippet
- "Accept" button (calls [7.5 Accept Application](#75-accept-application-hospital))

#### Error Responses

| Status | Condition                        | Message                                            |
|--------|----------------------------------|----------------------------------------------------|
| 400    | Hospital profile not found       | "Hospital profile not found."                      |
| 404    | Shift not found                  | "Shift not found."                                 |
| 403    | Not this hospital's shift        | "You can only view applicants for your own shifts." |

---

### 7.5 Accept Application (Hospital)

Accepts one doctor for the shift. **This is a critical transactional operation** that:

1. Accepts the selected application → `ACCEPTED`
2. Rejects all other `APPLIED` applications for this shift → `REJECTED`
3. Updates the shift status → `FILLED`
4. **Creates a timesheet record** for the accepted doctor (pre-created for clock-in/out)

| | |
|---|---|
| **Method** | `PATCH` |
| **URL** | `/application/:id/accept` |
| **Auth** | Bearer Token |
| **Role** | `HOSPITAL` |
| **Status** | `VERIFIED` |

#### URL Parameter

| Parameter | Type     | Description             |
|-----------|----------|-------------------------|
| `id`      | `string` | Application UUID to accept |

#### Request Body

None.

#### Success Response — `200 OK`

```json
{
  "message": "Doctor accepted successfully. All other applicants have been notified.",
  "application": {
    "id": "b2c3d4e5-f6a7-8901-bcde-f23456789012",
    "shiftId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "doctorProfileId": "660e8400-e29b-41d4-a716-446655440000",
    "status": "ACCEPTED",
    "createdAt": "2026-03-02T11:00:00.000Z",
    "updatedAt": "2026-03-02T15:00:00.000Z"
  }
}
```

#### Side Effects (All Automatic)

| Action | Description |
|--------|-------------|
| Other applications → `REJECTED` | All other `APPLIED` applications are automatically rejected |
| Shift → `FILLED` | The shift status changes to `FILLED` |
| Timesheet created | A timesheet record is created for the accepted doctor |
| Accepted doctor notified | Push: "Your application for Night Shift MO at Mayo Hospital has been accepted!" |
| Rejected doctors notified | Push: "The shift Night Shift MO has been filled by another doctor." |

#### Error Responses

| Status | Condition                         | Message                                                                 |
|--------|-----------------------------------|-------------------------------------------------------------------------|
| 400    | Hospital profile not found        | "Hospital profile not found."                                           |
| 404    | Application not found             | "Application not found."                                                |
| 403    | Not this hospital's shift         | "You can only accept applicants for your own shifts."                   |
| 400    | Application not in APPLIED status | "Cannot accept an application with status REJECTED."                    |
| 400    | Shift not OPEN anymore            | "Shift is already FILLED. Cannot accept more applicants."               |

---

## 8. Complete Shift→Application Flow Diagram

```
HOSPITAL FLOW                                    DOCTOR FLOW
─────────────────                                ─────────────────

1. POST /shift                                   
   Create a shift (OPEN)                         
       │                                         
       │                                         2. GET /shift/feed
       │                                            Browse available shifts
       │                                              │
       │                                         3. GET /shift/:id
       │                                            View shift details
       │                                              │
       │                                         4. POST /application/apply
       │                                            Apply for the shift
       │                                              │
       ◄─── Hospital receives notification ────────────┘
       │    "New applicant for your shift"       
       │                                         
5. GET /application/shift/:shiftId/applicants    
   Review all applicants                         
       │                                         
6. PATCH /application/:id/accept                 
   Accept one doctor                              
       │                                         
       ├── Shift → FILLED                        
       ├── Other apps → REJECTED                 
       ├── Timesheet created                     
       │                                              │
       │                                         ◄── Doctor receives notification
       │                                             "Your application was accepted!"
       │                                         
       │                                         7. GET /application/my?status=ACCEPTED
       │                                            See accepted shifts
       │                                         
   ════════════════════════════════════════════
   ▼ CONTINUES IN GUIDE 3: Clock-In/Out Flow ▼  
   ════════════════════════════════════════════
```

---

## 9. Geo-Spatial Distance Calculation

### How It Works (Haversine Formula)

The backend uses the **Haversine formula** to calculate the great-circle distance between two points on Earth:

```
d = 2r × arcsin(√(sin²((φ₂-φ₁)/2) + cos(φ₁)cos(φ₂)sin²((λ₂-λ₁)/2)))
```

Where:
- `r` = Earth's radius (6,371 km)
- `φ` = latitude in radians
- `λ` = longitude in radians

### What You Need on the Frontend

1. **During doctor profile creation**, capture the user's GPS coordinates and send `latitude` + `longitude`
2. The distance feed will then work automatically
3. If a doctor doesn't have coordinates, `distanceKm` will be `null` for all shifts

### Requesting Location Permission (Mobile)

```javascript
// React Native example
import Geolocation from '@react-native-community/geolocation';

const getLocation = () => {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => reject(error),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  });
};
```

### Updating Doctor Location

Call `PATCH /doctor/profile` with new coordinates when the user allows location access:

```json
{
  "latitude": 31.5204,
  "longitude": 74.3587
}
```

---

## 10. Auto-Expiry Behavior (Cron Jobs)

The backend runs cron jobs that automatically manage shift lifecycle. The frontend doesn't need to call anything for these — they happen in the background.

### Shift Auto-Expiry (Every 10 Minutes)

| Condition | Action |
|-----------|--------|
| Shift status is `OPEN` AND `startTime` has passed | Shift → `EXPIRED` |
| All `APPLIED` applications on expired shifts | Application → `REJECTED` |

> **Frontend impact**: A shift that was `OPEN` might become `EXPIRED` between API calls. Always check `status` before showing an "Apply" button.

### Missed Clock-In Detection (Every 30 Minutes)

| Condition | Action |
|-----------|--------|
| Shift status is `FILLED` AND `endTime` has passed AND doctor never clocked in | Shift → `EXPIRED`, Timesheet → `DISPUTED` ("Auto-flagged: Doctor did not clock in.") |

> **Frontend impact**: If a doctor has an `ACCEPTED` application but never clocks in, the shift will eventually expire and their timesheet will be auto-disputed.

---

## 11. Notification Events Triggered

These are the real-time notifications that the frontend should expect to handle (via push notifications):

### Shift Created (URGENT only)

| Field | Value |
|-------|-------|
| **Trigger** | Hospital creates an `URGENT` shift |
| **Recipients** | All verified doctors within 20km matching the required specialty |
| **Type** | `URGENT_SHIFT` |
| **Title** | "🚨 Urgent Shift Available Near You!" |
| **Message** | `Urgent shift "Night Shift MO" at Mayo Hospital (3.5km away). Rate: Rs. 1,500/hr. Open the app to apply now!` |
| **Data** | `{ shiftId, type: "urgent_shift" }` |

### New Application

| Field | Value |
|-------|-------|
| **Trigger** | Doctor applies for a shift |
| **Recipient** | The hospital that posted the shift |
| **Type** | `NEW_APPLICATION` |
| **Title** | "New Applicant for Your Shift" |
| **Message** | `Dr. Ahmed Khan has applied for "Night Shift MO". You now have 5 applicant(s). Review and accept a doctor.` |
| **Data** | `{ shiftId, applicationId, type: "new_application" }` |

### Application Accepted

| Field | Value |
|-------|-------|
| **Trigger** | Hospital accepts an application |
| **Recipient** | The accepted doctor |
| **Type** | `APPLICATION_ACCEPTED` |
| **Title** | "Shift Confirmed! ✅" |
| **Message** | `Your application for "Night Shift MO" at Mayo Hospital has been accepted! Don't forget to clock in when you arrive.` |
| **Data** | `{ shiftId, type: "application_accepted" }` |

### Application Rejected (Others)

| Field | Value |
|-------|-------|
| **Trigger** | Hospital accepts another doctor |
| **Recipients** | All other doctors with `REJECTED` applications |
| **Type** | `APPLICATION_REJECTED` |
| **Title** | "Shift Update" |
| **Message** | `The shift "Night Shift MO" has been filled by another doctor. Keep checking the feed!` |
| **Data** | `{ shiftId, type: "application_rejected" }` |

### Shift Cancelled

| Field | Value |
|-------|-------|
| **Trigger** | Hospital cancels a shift |
| **Recipients** | All doctors who had applied |
| **Type** | `SHIFT_CANCELLED` |
| **Title** | "Shift Cancelled" |
| **Message** | `The shift "Night Shift MO" has been cancelled by the hospital.` |
| **Data** | `{ shiftId, type: "shift_cancelled" }` |

---

## 12. Frontend Implementation Guide

### Doctor App — Recommended Screens

#### 1. Shift Feed Screen (Main/Home)

```
┌────────────────────────────────────────────┐
│  🔍 Search & Filters                       │
│  [City ▼] [Specialty ▼] [Distance ▼]      │
│  [Date From] [Date To]                     │
│  Sort: [Soonest | Highest Pay | Nearest]   │
├────────────────────────────────────────────┤
│  ┌──────────────────────────────────┐      │
│  │ 🚨 URGENT  Night Shift MO        │      │
│  │ Mayo Hospital · 3.5 km away      │      │
│  │ ER Specialist · Rs. 1,500/hr     │      │
│  │ Mar 5, 8:00 PM → Mar 6, 8:00 AM │      │
│  │ 12 hrs · Rs. 18,000 total        │      │
│  │ ⭐ 4.2 (8 reviews) · 5 applicants│      │
│  └──────────────────────────────────┘      │
│  ┌──────────────────────────────────┐      │
│  │ Morning OPD Shift                 │      │
│  │ Services Hospital · 7.8 km away  │      │
│  │ Medical Officer · Rs. 1,200/hr   │      │
│  │ Mar 6, 8:00 AM → Mar 6, 2:00 PM │      │
│  │ 6 hrs · Rs. 7,200 total          │      │
│  │ ⭐ 3.8 (14 reviews) · 2 applicant│      │
│  └──────────────────────────────────┘      │
│                                            │
│  Page 1 of 3  [Load More]                 │
└────────────────────────────────────────────┘

API: GET /shift/feed?sortBy=starting_soonest&page=1&limit=20
```

#### 2. Shift Detail Screen (Tap on a shift card)

```
┌────────────────────────────────────────────┐
│ ← Back                                     │
│                                            │
│ 🚨 URGENT                                  │
│ Night Shift MO                             │
│                                            │
│ 🏥 Mayo Hospital                            │
│ 2-Jail Road, Lahore                        │
│ ⭐ 4.2 (8 reviews)                         │
│                                            │
│ 📋 Details                                  │
│ Department: Emergency                       │
│ Specialty Needed: ER Specialist            │
│ Duration: 12 hours                         │
│ Rate: Rs. 1,500/hr                         │
│ Total Pay: Rs. 18,000                      │
│                                            │
│ 📅 Schedule                                 │
│ Mar 5, 2026 — 8:00 PM to 8:00 AM           │
│                                            │
│ 📝 Description                              │
│ Need an experienced ER doctor for night    │
│ coverage. Must have pediatric experience.  │
│                                            │
│ 📍 3.5 km away                              │
│ 👥 5 applicants                             │
│                                            │
│        [    APPLY NOW    ]                 │
│                                            │
└────────────────────────────────────────────┘

API: GET /shift/:id → display
     POST /application/apply → on button tap
```

#### 3. My Applications Screen

```
┌────────────────────────────────────────────┐
│  My Applications                           │
│  [All | Pending | Accepted | Past]         │
├────────────────────────────────────────────┤
│  ┌──────────────────────────────────┐      │
│  │ ✅ ACCEPTED                       │      │
│  │ Night Shift MO                    │      │
│  │ Mayo Hospital, Lahore             │      │
│  │ Mar 5, 8:00 PM → Mar 6, 8:00 AM │      │
│  │          [View Shift →]           │      │
│  └──────────────────────────────────┘      │
│  ┌──────────────────────────────────┐      │
│  │ ⏳ PENDING                        │      │
│  │ Day Shift Pediatrician           │      │
│  │ Children's Hospital, Lahore      │      │
│  │ Mar 7, 8:00 AM → 2:00 PM        │      │
│  │          [Withdraw]               │      │
│  └──────────────────────────────────┘      │
└────────────────────────────────────────────┘

API: GET /application/my
     GET /application/my?status=APPLIED → Pending tab
     GET /application/my?status=ACCEPTED → Accepted tab
     PATCH /application/:id/withdraw → Withdraw button
```

---

### Hospital App — Recommended Screens

#### 1. My Shifts Dashboard

```
┌────────────────────────────────────────────┐
│  My Shifts                                 │
│  [All | Open | Filled | Completed | Past]  │
├────────────────────────────────────────────┤
│  ┌──────────────────────────────────┐      │
│  │ 🟢 OPEN  Night Shift MO          │      │
│  │ Emergency · ER Specialist        │      │
│  │ Mar 5, 8:00 PM → Mar 6, 8:00 AM │      │
│  │ Rs. 1,500/hr · 5 applicants     │      │
│  │   [View Applicants]  [Cancel]    │      │
│  └──────────────────────────────────┘      │
│  ┌──────────────────────────────────┐      │
│  │ 🔵 FILLED  Day Shift Pediatrician│      │
│  │ Pediatrics · Pediatrician        │      │
│  │ Mar 7, 8:00 AM → 2:00 PM        │      │
│  │ Rs. 1,200/hr · Assigned: Dr. Sara│      │
│  └──────────────────────────────────┘      │
│                                            │
│        [  + Post New Shift  ]              │
└────────────────────────────────────────────┘

API: GET /shift/hospital
     GET /shift/hospital?status=OPEN → Open tab
     POST /shift → Post New Shift
     PATCH /shift/:id/cancel → Cancel button
```

#### 2. Review Applicants Screen

```
┌────────────────────────────────────────────┐
│ ← Back to Night Shift MO                  │
│                                            │
│ 👥 5 Applicants                            │
├────────────────────────────────────────────┤
│  ┌──────────────────────────────────┐      │
│  │ 📷 Dr. Ahmed Khan               │      │
│  │ ER Specialist · PMDC: 12345-P    │      │
│  │ 3 yrs exp · Rs. 1,500/hr         │      │
│  │ ⭐ 4.5 (12 reviews)              │      │
│  │ "Experienced ER doctor with..."   │      │
│  │          [ ACCEPT ✅ ]            │      │
│  └──────────────────────────────────┘      │
│  ┌──────────────────────────────────┐      │
│  │ 📷 Dr. Sara Ahmed               │      │
│  │ Medical Officer · PMDC: 67890-P  │      │
│  │ 5 yrs exp · Rs. 2,000/hr         │      │
│  │ ⭐ 4.8 (20 reviews)              │      │
│  │          [ ACCEPT ✅ ]            │      │
│  └──────────────────────────────────┘      │
└────────────────────────────────────────────┘

API: GET /application/shift/:shiftId/applicants
     PATCH /application/:id/accept → Accept button
```

#### 3. Create Shift Screen

```
┌────────────────────────────────────────────┐
│ ← Post New Shift                           │
│                                            │
│ Title *                                    │
│ [Night Shift MO                    ]       │
│                                            │
│ Department *           Specialty *         │
│ [EMERGENCY ▼]          [ER_SPECIALIST ▼]   │
│                                            │
│ Description                                │
│ [Need an experienced ER doctor...  ]       │
│                                            │
│ Start Time *           End Time *          │
│ [2026-03-05 20:00 ▼]  [2026-03-06 08:00]  │
│                                            │
│ Hourly Rate (PKR) *                        │
│ [1500                              ]       │
│                                            │
│ Urgency                                    │
│ (○) Normal  (●) Urgent                     │
│                                            │
│ ─── Preview ───────────────────────        │
│ Duration: 12 hours                         │
│ Total Estimated Pay: Rs. 18,000            │
│ (calculated client-side for preview)       │
│                                            │
│        [   POST SHIFT   ]                  │
└────────────────────────────────────────────┘

API: POST /shift
```

> **Tip**: Calculate the preview on the client side: `totalPay = hourlyRate × (endTime - startTime) / 3600000`. The server will calculate the authoritative value.

---

## Quick Reference — All Endpoints in This Guide

| Method | Endpoint                                  | Role       | Description                          |
|--------|-------------------------------------------|------------|--------------------------------------|
| POST   | `/shift`                                  | HOSPITAL   | Create a new shift                  |
| GET    | `/shift/hospital`                         | HOSPITAL   | Get hospital's own shifts           |
| GET    | `/shift/feed`                             | DOCTOR     | Doctor shift feed (geo-spatial)     |
| GET    | `/shift/:id`                              | ANY VERIFIED | Get shift details                |
| PATCH  | `/shift/:id/cancel`                       | HOSPITAL   | Cancel an OPEN shift                |
| POST   | `/application/apply`                      | DOCTOR     | Apply for a shift                   |
| GET    | `/application/my`                         | DOCTOR     | Get my applications                 |
| PATCH  | `/application/:id/withdraw`               | DOCTOR     | Withdraw a pending application      |
| GET    | `/application/shift/:shiftId/applicants`  | HOSPITAL   | View applicants for a shift         |
| PATCH  | `/application/:id/accept`                 | HOSPITAL   | Accept an applicant                 |

---

> **Next Guide**: Guide 3 — Timesheets, Clock-In/Out & Geo-Fencing (Clock-in with GPS validation, clock-out with auto-pay calculation, timesheet approval, disputes)

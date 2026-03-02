# Guide 4 — Reviews, Ratings, Earnings & Billing

> **Audience**: Mobile / Frontend Engineers  
> **Backend**: NestJS + Prisma + PostgreSQL (Supabase) + JWT  
> **Last Updated**: March 2, 2026  
> **Prerequisites**: Read [Guide 1](./GUIDE_1_AUTH_AND_ONBOARDING.md), [Guide 2](./GUIDE_2_SHIFTS_AND_APPLICATIONS.md) & [Guide 3](./GUIDE_3_TIMESHEETS_CLOCK_IN_OUT.md)

---

## Table of Contents

1. [Overview & Business Logic](#1-overview--business-logic)
2. [Review Data Model](#2-review-data-model)
3. [LedgerEntry Data Model](#3-ledgerentry-data-model)
4. [Blind Review System — Deep Dive](#4-blind-review-system--deep-dive)
5. [Hospital Reviews Doctor](#5-hospital-reviews-doctor)
6. [Doctor Reviews Hospital](#6-doctor-reviews-hospital)
7. [Get Doctor Reviews (Paginated)](#7-get-doctor-reviews-paginated)
8. [Get Hospital Reviews (Paginated)](#8-get-hospital-reviews-paginated)
9. [Check If I Already Reviewed](#9-check-if-i-already-reviewed)
10. [Financial Ledger — Three-Way Split](#10-financial-ledger--three-way-split)
11. [Doctor Earnings Wallet](#11-doctor-earnings-wallet)
12. [Hospital Billing Dashboard](#12-hospital-billing-dashboard)
13. [Ledger Entry Lifecycle](#13-ledger-entry-lifecycle)
14. [Auto-Reveal Cron (Blind Reviews — 7 Days)](#14-auto-reveal-cron-blind-reviews--7-days)
15. [Complete Approval → Payment Flow](#15-complete-approval--payment-flow)
16. [Frontend Implementation Guide](#16-frontend-implementation-guide)

---

## 1. Overview & Business Logic

This guide covers two interconnected systems that activate **after a timesheet is approved**:

### A. Reviews & Ratings

A **blind, two-sided review** system where hospitals rate doctors and doctors rate hospitals — neither can see the other's review until both submit (or 7 days pass).

### B. Earnings & Billing (Financial Ledger)

An automatic **three-way financial split** that creates ledger entries when a timesheet is approved: the full shift payment, a 10% platform commission, and the doctor's 90% net earning.

### Key Business Rules — Reviews

| Rule | Detail |
|------|--------|
| **When can you review?** | Only after timesheet status is `APPROVED` or `RESOLVED` |
| **One review per side** | Each side (hospital/doctor) gets exactly ONE review per timesheet |
| **Blind reviews** | Reviews are hidden (`isVisible = false`) until BOTH sides submit |
| **7-day auto-reveal** | If only one side reviews, the review becomes visible after 7 days (cron) |
| **Rating scale** | 1–5 stars (integer only) |
| **Comment** | Optional free text, max 2000 characters |
| **Rating recalculation** | On every new review, the reviewee's `averageRating` and `totalReviews` are recalculated from all visible + hidden reviews |
| **Shown on profiles** | `averageRating` and `totalReviews` fields on DoctorProfile and HospitalProfile |

### Key Business Rules — Earnings

| Rule | Detail |
|------|--------|
| **Platform commission** | **10%** of `finalCalculatedPay` |
| **Doctor net earning** | **90%** of `finalCalculatedPay` |
| **Three ledger entries per approval** | `SHIFT_PAYMENT`, `PLATFORM_COMMISSION`, `DOCTOR_NET_EARNING` |
| **Trigger** | Ledger entries are created by an **event listener** when `timesheet.approved` fires |
| **Idempotent** | If ledger entries already exist for a timesheet, the system skips creation |
| **Commission settles immediately** | `PLATFORM_COMMISSION` is created with status `CLEARED` |
| **Doctor payment starts pending** | `DOCTOR_NET_EARNING` starts as `PENDING_CLEARANCE` |

---

## 2. Review Data Model

Full shape of a Review object:

```json
{
  "id": "e5f6a7b8-c9d0-1234-efgh-567890123456",
  "timesheetId": "d4e5f6a7-b8c9-0123-defg-456789012345",
  "reviewerType": "HOSPITAL_REVIEWING_DOCTOR",
  "reviewerProfileId": "880e8400-e29b-41d4-a716-446655440000",
  "revieweeProfileId": "660e8400-e29b-41d4-a716-446655440000",
  "rating": 4,
  "comment": "Very professional doctor, arrived on time.",
  "isVisible": true,
  "createdAt": "2026-03-07T10:00:00.000Z",
  "updatedAt": "2026-03-07T10:00:00.000Z"
}
```

| Field               | Type                 | Notes                                                       |
|---------------------|----------------------|-------------------------------------------------------------|
| `id`                | `string` (UUID)      | Primary key                                                 |
| `timesheetId`       | `string` (UUID)      | Which timesheet this review is for                          |
| `reviewerType`      | `ReviewerType` enum  | `HOSPITAL_REVIEWING_DOCTOR` or `DOCTOR_REVIEWING_HOSPITAL`  |
| `reviewerProfileId` | `string` (UUID)      | Profile ID of who wrote the review                          |
| `revieweeProfileId` | `string` (UUID)      | Profile ID of who is being reviewed                         |
| `rating`            | `number` (1–5)       | Integer star rating                                         |
| `comment`           | `string \| null`     | Optional text review, max 2000 chars                        |
| `isVisible`         | `boolean`            | `false` until both sides review or 7 days pass              |
| `createdAt`         | `string` (ISO 8601)  |                                                             |
| `updatedAt`         | `string` (ISO 8601)  |                                                             |

### ReviewerType Enum

| Value                          | Who reviews | Who gets reviewed |
|--------------------------------|-------------|-------------------|
| `HOSPITAL_REVIEWING_DOCTOR`    | Hospital    | Doctor            |
| `DOCTOR_REVIEWING_HOSPITAL`    | Doctor      | Hospital          |

### Unique Constraint

```
@@unique([timesheetId, reviewerType])
```

This means: **one review per side per timesheet**. A hospital can only review the doctor once, and the doctor can only review the hospital once, for the same timesheet.

---

## 3. LedgerEntry Data Model

Full shape of a LedgerEntry object:

```json
{
  "id": "f6a7b8c9-d0e1-2345-fghi-678901234567",
  "timesheetId": "d4e5f6a7-b8c9-0123-defg-456789012345",
  "doctorProfileId": "660e8400-e29b-41d4-a716-446655440000",
  "hospitalProfileId": "880e8400-e29b-41d4-a716-446655440000",
  "type": "DOCTOR_NET_EARNING",
  "amount": "16362.00",
  "status": "PENDING_CLEARANCE",
  "description": "Net earnings for \"Night Shift MO\" — Rs. 16362.00",
  "clearedAt": null,
  "createdAt": "2026-03-06T10:00:00.000Z",
  "updatedAt": "2026-03-06T10:00:00.000Z"
}
```

| Field               | Type                    | Notes                                           |
|---------------------|-------------------------|-------------------------------------------------|
| `id`                | `string` (UUID)         | Primary key                                     |
| `timesheetId`       | `string` (UUID)         | Which timesheet generated this entry            |
| `doctorProfileId`   | `string` (UUID)         | The doctor involved                             |
| `hospitalProfileId` | `string` (UUID)         | The hospital involved                           |
| `type`              | `LedgerEntryType` enum  | See below                                       |
| `amount`            | `string` (Decimal)      | Always positive, parse with `parseFloat()`      |
| `status`            | `LedgerEntryStatus` enum| See below                                       |
| `description`       | `string \| null`        | Human-readable description                      |
| `clearedAt`         | `string \| null`        | When payment was cleared/settled                |
| `createdAt`         | `string` (ISO 8601)     |                                                 |
| `updatedAt`         | `string` (ISO 8601)     |                                                 |

### LedgerEntryType Enum

| Value                 | Description                                        |
|-----------------------|----------------------------------------------------|
| `SHIFT_PAYMENT`       | Full gross amount the hospital owes for the shift  |
| `PLATFORM_COMMISSION` | 10% platform fee deducted from gross payment       |
| `DOCTOR_NET_EARNING`  | 90% net pay the doctor earns                       |

### LedgerEntryStatus Enum

| Value              | Description                                                     |
|--------------------|-----------------------------------------------------------------|
| `PENDING_CLEARANCE`| Created but not yet settled/paid out                            |
| `CLEARED`          | Payment has been settled (commission is immediately CLEARED)    |
| `WITHDRAWN`        | Doctor has withdrawn the earnings (future feature)              |

---

## 4. Blind Review System — Deep Dive

The blind review system prevents bias by hiding reviews until both parties have submitted their feedback.

### How It Works

```
                    ┌──────────────────────────────────────────────┐
                    │          BLIND REVIEW TIMELINE                │
                    ├──────────────────────────────────────────────┤
                    │                                              │
                    │  Timesheet APPROVED                          │
                    │       │                                      │
                    │       ├── Both sides can now submit reviews  │
                    │       │                                      │
                    │       ▼                                      │
                    │  ┌──────────┐                                │
                    │  │Hospital  │ submits 4⭐ review              │
                    │  │reviews   │ isVisible = false              │
                    │  │doctor    │ (hidden — waiting for doctor)  │
                    │  └──────────┘                                │
                    │       │                                      │
                    │       │ ... some time later ...              │
                    │       │                                      │
                    │  ┌──────────┐                                │
                    │  │Doctor    │ submits 5⭐ review              │
                    │  │reviews   │                                │
                    │  │hospital  │                                │
                    │  └──────────┘                                │
                    │       │                                      │
                    │       ▼  BOTH sides submitted!               │
                    │  ┌──────────────────────┐                    │
                    │  │ BOTH reviews become   │                    │
                    │  │ isVisible = true       │                    │
                    │  │ immediately            │                    │
                    │  └──────────────────────┘                    │
                    │                                              │
                    │  ═══ OR (if only one side reviews) ═══       │
                    │                                              │
                    │  ┌──────────┐                                │
                    │  │Hospital  │ submits 4⭐ review              │
                    │  │reviews   │ isVisible = false              │
                    │  │doctor    │                                │
                    │  └──────────┘                                │
                    │       │                                      │
                    │       │ 7 days pass, doctor never reviews    │
                    │       │                                      │
                    │  ┌──────────────────────┐                    │
                    │  │ CRON reveals the      │                    │
                    │  │ hospital's review     │                    │
                    │  │ isVisible = true       │                    │
                    │  └──────────────────────┘                    │
                    │                                              │
                    └──────────────────────────────────────────────┘
```

### Visibility Rules

| Scenario | What happens |
|----------|-------------|
| Hospital reviews first → Doctor reviews second | **Both become visible immediately** when the second review is submitted |
| Doctor reviews first → Hospital reviews second | **Both become visible immediately** when the second review is submitted |
| Only one side reviews, 7 days pass | **Cron reveals** the single review (`isVisible → true`) |
| Neither side reviews | Nothing happens — no reviews exist |

### Why Blind Reviews?

1. **Prevents retaliation** — A hospital can't give a 1-star review after seeing the doctor's 5-star review (or vice versa)
2. **Encourages honesty** — Both sides are more likely to give genuine feedback when they can't see the other's rating
3. **Time-limited** — After 7 days, any submitted review becomes visible regardless

---

## 5. Hospital Reviews Doctor

Hospital submits a rating and optional comment for the doctor who completed a shift.

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `/review/timesheet/:timesheetId/hospital-reviews-doctor` |
| **Auth** | Bearer Token |
| **Role** | `HOSPITAL` |
| **Status** | `VERIFIED` |

### URL Parameter

| Parameter      | Type     | Description          |
|----------------|----------|----------------------|
| `timesheetId`  | `string` | Timesheet UUID       |

### Request Body

```json
{
  "rating": 4,
  "comment": "Very professional doctor, arrived on time."
}
```

| Field     | Type     | Required | Validation                              |
|-----------|----------|----------|-----------------------------------------|
| `rating`  | `number` | Yes      | Integer, minimum 1, maximum 5           |
| `comment` | `string` | No       | Max 2000 characters                     |

### Server-Side Validation Chain

| Step | Check | Error if fails |
|------|-------|----------------|
| 1 | Hospital profile exists | "Hospital profile not found." |
| 2 | Timesheet exists | "Timesheet not found." |
| 3 | Hospital owns this timesheet | "You can only review timesheets for your own shifts." |
| 4 | Timesheet is `APPROVED` or `RESOLVED` | "Cannot review — timesheet status is {status}. Reviews are only allowed after approval." |
| 5 | Hospital hasn't already reviewed | "You have already reviewed the doctor for this shift." |

### Success Response — `201 Created`

**When the other side (doctor) has NOT yet reviewed:**

```json
{
  "message": "Review submitted. It will be visible once the doctor also leaves their review (or after 7 days).",
  "review": {
    "id": "e5f6a7b8-c9d0-1234-efgh-567890123456",
    "timesheetId": "d4e5f6a7-b8c9-0123-defg-456789012345",
    "reviewerType": "HOSPITAL_REVIEWING_DOCTOR",
    "reviewerProfileId": "880e8400-e29b-41d4-a716-446655440000",
    "revieweeProfileId": "660e8400-e29b-41d4-a716-446655440000",
    "rating": 4,
    "comment": "Very professional doctor, arrived on time.",
    "isVisible": false,
    "createdAt": "2026-03-07T10:00:00.000Z",
    "updatedAt": "2026-03-07T10:00:00.000Z"
  }
}
```

**When the other side (doctor) HAS already reviewed (both now done):**

```json
{
  "message": "Review submitted. Both reviews are now visible.",
  "review": {
    "id": "e5f6a7b8-c9d0-1234-efgh-567890123456",
    "timesheetId": "d4e5f6a7-b8c9-0123-defg-456789012345",
    "reviewerType": "HOSPITAL_REVIEWING_DOCTOR",
    "reviewerProfileId": "880e8400-e29b-41d4-a716-446655440000",
    "revieweeProfileId": "660e8400-e29b-41d4-a716-446655440000",
    "rating": 4,
    "comment": "Very professional doctor, arrived on time.",
    "isVisible": true,
    "createdAt": "2026-03-07T10:00:00.000Z",
    "updatedAt": "2026-03-07T10:00:00.000Z"
  }
}
```

### Side Effects

| Action | Description |
|--------|-------------|
| `isVisible` logic | If both sides have now reviewed → both reviews set to `isVisible = true` |
| Doctor's rating recalculated | `averageRating` and `totalReviews` on `DoctorProfile` are updated using an aggregate of ALL `HOSPITAL_REVIEWING_DOCTOR` reviews |

> **Important**: The `averageRating` recalculation includes ALL reviews (both visible and hidden) written by hospitals about this doctor. This means the rating updates immediately even if the review itself isn't visible to others yet.

### Error Responses — Complete List

| Status | Condition | Message |
|--------|-----------|---------|
| 400 | Hospital profile not found | "Hospital profile not found." |
| 404 | Timesheet not found | "Timesheet not found." |
| 403 | Not this hospital's timesheet | "You can only review timesheets for your own shifts." |
| 400 | Timesheet not APPROVED/RESOLVED | "Cannot review — timesheet status is {status}. Reviews are only allowed after approval." |
| 409 | Already reviewed | "You have already reviewed the doctor for this shift." |

---

## 6. Doctor Reviews Hospital

Doctor submits a rating and optional comment for the hospital where they completed a shift.

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `/review/timesheet/:timesheetId/doctor-reviews-hospital` |
| **Auth** | Bearer Token |
| **Role** | `DOCTOR` |
| **Status** | `VERIFIED` |

### URL Parameter

| Parameter      | Type     | Description          |
|----------------|----------|----------------------|
| `timesheetId`  | `string` | Timesheet UUID       |

### Request Body

```json
{
  "rating": 5,
  "comment": "Great facilities and supportive staff. Would work here again."
}
```

| Field     | Type     | Required | Validation                              |
|-----------|----------|----------|-----------------------------------------|
| `rating`  | `number` | Yes      | Integer, minimum 1, maximum 5           |
| `comment` | `string` | No       | Max 2000 characters                     |

### Server-Side Validation Chain

| Step | Check | Error if fails |
|------|-------|----------------|
| 1 | Doctor profile exists | "Doctor profile not found." |
| 2 | Timesheet exists | "Timesheet not found." |
| 3 | Doctor owns this timesheet | "You can only review timesheets for shifts you attended." |
| 4 | Timesheet is `APPROVED` or `RESOLVED` | "Cannot review — timesheet status is {status}. Reviews are only allowed after approval." |
| 5 | Doctor hasn't already reviewed | "You have already reviewed this hospital for this shift." |

### Success Response — `201 Created`

**When the other side (hospital) has NOT yet reviewed:**

```json
{
  "message": "Review submitted. It will be visible once the hospital also leaves their review (or after 7 days).",
  "review": {
    "id": "f6a7b8c9-d0e1-2345-fghi-678901234567",
    "timesheetId": "d4e5f6a7-b8c9-0123-defg-456789012345",
    "reviewerType": "DOCTOR_REVIEWING_HOSPITAL",
    "reviewerProfileId": "660e8400-e29b-41d4-a716-446655440000",
    "revieweeProfileId": "880e8400-e29b-41d4-a716-446655440000",
    "rating": 5,
    "comment": "Great facilities and supportive staff. Would work here again.",
    "isVisible": false,
    "createdAt": "2026-03-07T12:00:00.000Z",
    "updatedAt": "2026-03-07T12:00:00.000Z"
  }
}
```

**When the other side (hospital) HAS already reviewed (both now done):**

```json
{
  "message": "Review submitted. Both reviews are now visible.",
  "review": {
    "id": "f6a7b8c9-d0e1-2345-fghi-678901234567",
    "timesheetId": "d4e5f6a7-b8c9-0123-defg-456789012345",
    "reviewerType": "DOCTOR_REVIEWING_HOSPITAL",
    "reviewerProfileId": "660e8400-e29b-41d4-a716-446655440000",
    "revieweeProfileId": "880e8400-e29b-41d4-a716-446655440000",
    "rating": 5,
    "comment": "Great facilities and supportive staff. Would work here again.",
    "isVisible": true,
    "createdAt": "2026-03-07T12:00:00.000Z",
    "updatedAt": "2026-03-07T12:00:00.000Z"
  }
}
```

### Side Effects

| Action | Description |
|--------|-------------|
| `isVisible` logic | If both sides have now reviewed → both reviews set to `isVisible = true` |
| Hospital's rating recalculated | `averageRating` and `totalReviews` on `HospitalProfile` are updated using an aggregate of ALL `DOCTOR_REVIEWING_HOSPITAL` reviews |

### Error Responses — Complete List

| Status | Condition | Message |
|--------|-----------|---------|
| 400 | Doctor profile not found | "Doctor profile not found." |
| 404 | Timesheet not found | "Timesheet not found." |
| 403 | Not this doctor's timesheet | "You can only review timesheets for shifts you attended." |
| 400 | Timesheet not APPROVED/RESOLVED | "Cannot review — timesheet status is {status}. Reviews are only allowed after approval." |
| 409 | Already reviewed | "You have already reviewed this hospital for this shift." |

---

## 7. Get Doctor Reviews (Paginated)

Returns all **visible** reviews for a specific doctor. Used on the doctor's public profile page.

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/review/doctor/:doctorProfileId` |
| **Auth** | Bearer Token |
| **Role** | `DOCTOR`, `HOSPITAL`, `SUPER_ADMIN` |
| **Status** | `VERIFIED` |

### URL Parameter

| Parameter          | Type     | Description                |
|--------------------|----------|----------------------------|
| `doctorProfileId`  | `string` | Doctor Profile UUID        |

### Query Parameters

| Parameter | Type     | Required | Default | Description             |
|-----------|----------|----------|---------|-------------------------|
| `page`    | `number` | No       | `1`     | Page number              |
| `limit`   | `number` | No       | `20`    | Items per page           |

### Example Requests

```
GET /review/doctor/660e8400-e29b-41d4-a716-446655440000
GET /review/doctor/660e8400-e29b-41d4-a716-446655440000?page=2&limit=10
```

### Success Response — `200 OK`

```json
{
  "reviews": [
    {
      "id": "e5f6a7b8-c9d0-1234-efgh-567890123456",
      "timesheetId": "d4e5f6a7-b8c9-0123-defg-456789012345",
      "reviewerType": "HOSPITAL_REVIEWING_DOCTOR",
      "reviewerProfileId": "880e8400-e29b-41d4-a716-446655440000",
      "revieweeProfileId": "660e8400-e29b-41d4-a716-446655440000",
      "rating": 4,
      "comment": "Very professional doctor, arrived on time.",
      "isVisible": true,
      "createdAt": "2026-03-07T10:00:00.000Z",
      "updatedAt": "2026-03-07T10:00:00.000Z",
      "timesheet": {
        "shift": {
          "title": "Night Shift MO",
          "department": "EMERGENCY",
          "hospitalProfile": {
            "hospitalName": "Mayo Hospital",
            "logoUrl": "https://..."
          }
        }
      }
    },
    {
      "id": "...",
      "rating": 5,
      "comment": "Excellent work during a very busy night.",
      "timesheet": {
        "shift": {
          "title": "ICU Night Shift",
          "department": "ICU",
          "hospitalProfile": {
            "hospitalName": "Services Hospital",
            "logoUrl": "https://..."
          }
        }
      }
    }
  ],
  "meta": {
    "total": 12,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

### Included Relations

| Relation                                   | Fields Returned                      |
|--------------------------------------------|--------------------------------------|
| `timesheet.shift`                          | `title`, `department`                |
| `timesheet.shift.hospitalProfile`          | `hospitalName`, `logoUrl`            |

> **Only `isVisible = true` reviews are returned.** Hidden reviews (blind review pending) are never exposed to this endpoint.

---

## 8. Get Hospital Reviews (Paginated)

Returns all **visible** reviews for a specific hospital. Used on the hospital's public profile page.

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/review/hospital/:hospitalProfileId` |
| **Auth** | Bearer Token |
| **Role** | `DOCTOR`, `HOSPITAL`, `SUPER_ADMIN` |
| **Status** | `VERIFIED` |

### URL Parameter

| Parameter              | Type     | Description                   |
|------------------------|----------|-------------------------------|
| `hospitalProfileId`    | `string` | Hospital Profile UUID         |

### Query Parameters

| Parameter | Type     | Required | Default | Description             |
|-----------|----------|----------|---------|-------------------------|
| `page`    | `number` | No       | `1`     | Page number              |
| `limit`   | `number` | No       | `20`    | Items per page           |

### Example Requests

```
GET /review/hospital/880e8400-e29b-41d4-a716-446655440000
GET /review/hospital/880e8400-e29b-41d4-a716-446655440000?page=1&limit=5
```

### Success Response — `200 OK`

```json
{
  "reviews": [
    {
      "id": "f6a7b8c9-d0e1-2345-fghi-678901234567",
      "timesheetId": "d4e5f6a7-b8c9-0123-defg-456789012345",
      "reviewerType": "DOCTOR_REVIEWING_HOSPITAL",
      "reviewerProfileId": "660e8400-e29b-41d4-a716-446655440000",
      "revieweeProfileId": "880e8400-e29b-41d4-a716-446655440000",
      "rating": 5,
      "comment": "Great facilities and supportive staff.",
      "isVisible": true,
      "createdAt": "2026-03-07T12:00:00.000Z",
      "updatedAt": "2026-03-07T12:00:00.000Z",
      "timesheet": {
        "shift": {
          "title": "Night Shift MO",
          "department": "EMERGENCY"
        },
        "doctorProfile": {
          "firstName": "Ahmed",
          "lastName": "Khan",
          "specialty": "ER_SPECIALIST",
          "profilePicUrl": "https://..."
        }
      }
    }
  ],
  "meta": {
    "total": 8,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

### Included Relations

| Relation                          | Fields Returned                                            |
|-----------------------------------|------------------------------------------------------------|
| `timesheet.shift`                 | `title`, `department`                                      |
| `timesheet.doctorProfile`         | `firstName`, `lastName`, `specialty`, `profilePicUrl`      |

---

## 9. Check If I Already Reviewed

Check whether the current user has already submitted a review for a specific timesheet. Useful to toggle between "Leave Review" and "View My Review" states.

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/review/timesheet/:timesheetId/mine` |
| **Auth** | Bearer Token |
| **Role** | `DOCTOR`, `HOSPITAL` |
| **Status** | `VERIFIED` |

### URL Parameter

| Parameter      | Type     | Description          |
|----------------|----------|----------------------|
| `timesheetId`  | `string` | Timesheet UUID       |

### Success Response — `200 OK`

**If the user HAS reviewed:**

```json
{
  "id": "e5f6a7b8-c9d0-1234-efgh-567890123456",
  "timesheetId": "d4e5f6a7-b8c9-0123-defg-456789012345",
  "reviewerType": "HOSPITAL_REVIEWING_DOCTOR",
  "reviewerProfileId": "880e8400-e29b-41d4-a716-446655440000",
  "revieweeProfileId": "660e8400-e29b-41d4-a716-446655440000",
  "rating": 4,
  "comment": "Very professional doctor, arrived on time.",
  "isVisible": false,
  "createdAt": "2026-03-07T10:00:00.000Z",
  "updatedAt": "2026-03-07T10:00:00.000Z"
}
```

**If the user has NOT reviewed:**

```json
null
```

> **Frontend logic**: If the response data is `null`, show "Leave Review" button. If it's a review object, show "You've reviewed: 4⭐" (and show `isVisible` status).

### How It Determines the Reviewer Type

The backend automatically determines which reviewer type to look for based on the user's role:

| User Role | Looks for `reviewerType` |
|-----------|--------------------------|
| `DOCTOR`  | `DOCTOR_REVIEWING_HOSPITAL` |
| `HOSPITAL` | `HOSPITAL_REVIEWING_DOCTOR` |

### Error Responses

| Status | Condition | Message |
|--------|-----------|---------|
| 400 | Profile not found | "Doctor profile not found." / "Hospital profile not found." |
| 403 | Invalid role | "Only doctors and hospitals can have reviews." |

---

## 10. Financial Ledger — Three-Way Split

When a timesheet is approved (by hospital, auto-approve cron, or admin resolution), the **event-driven ledger system** creates three financial records:

### The Split

```
Timesheet approved: finalCalculatedPay = Rs. 18,180.00
                         │
                         ▼
    ┌──────────────────────────────────────────────────┐
    │             THREE-WAY LEDGER SPLIT                │
    ├──────────────────────────────────────────────────┤
    │                                                  │
    │  1. SHIFT_PAYMENT       = Rs. 18,180.00          │
    │     Full amount the hospital owes                │
    │     Status: PENDING_CLEARANCE                    │
    │                                                  │
    │  2. PLATFORM_COMMISSION = Rs.  1,818.00  (10%)   │
    │     Platform fee deducted                        │
    │     Status: CLEARED  (immediately settled)       │
    │                                                  │
    │  3. DOCTOR_NET_EARNING  = Rs. 16,362.00  (90%)   │
    │     Doctor's take-home pay                       │
    │     Status: PENDING_CLEARANCE                    │
    │                                                  │
    └──────────────────────────────────────────────────┘
```

### Commission Calculation

```
Platform Commission = finalCalculatedPay × 0.10
Doctor Net Earning  = finalCalculatedPay × 0.90

// Or equivalently:
Doctor Net Earning  = finalCalculatedPay - Platform Commission
```

### Example Calculations

| Gross Pay (finalCalculatedPay) | Platform Commission (10%) | Doctor Net Earning (90%) |
|-------------------------------|--------------------------|--------------------------|
| Rs. 18,180.00 | Rs. 1,818.00 | Rs. 16,362.00 |
| Rs. 7,200.00 | Rs. 720.00 | Rs. 6,480.00 |
| Rs. 3,000.00 | Rs. 300.00 | Rs. 2,700.00 |

### Event-Driven Architecture

The ledger creation is **decoupled** from the approval logic via an event listener:

```
Timesheet approved
       │
       ▼
emit('timesheet.approved', { timesheetId, ... })
       │
       ▼
LedgerNotificationListener
       │
       ▼
earningsService.createLedgerEntries(timesheetId)
       │
       ├── Check if entries already exist (idempotent)
       ├── Calculate: grossPay, commission, netPay
       └── Create 3 LedgerEntry records
```

This design ensures ledger entries are created consistently whether the approval came from:
- Hospital manual approval
- 48-hour auto-approve cron
- Admin resolving a dispute

### Description Format

Each ledger entry has a human-readable description:

| Type | Description Format |
|------|--------------------|
| `SHIFT_PAYMENT` | `Shift payment for "Night Shift MO" — Rs. 18180.00` |
| `PLATFORM_COMMISSION` | `Platform commission (10%) — Rs. 1818.00` |
| `DOCTOR_NET_EARNING` | `Net earnings for "Night Shift MO" — Rs. 16362.00` |

---

## 11. Doctor Earnings Wallet

Returns the doctor's financial dashboard: pending clearance, available to withdraw, lifetime earnings, and recent transactions.

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/earnings/doctor` |
| **Auth** | Bearer Token |
| **Role** | `DOCTOR` |
| **Status** | `VERIFIED` |

### Request Body

None.

### Success Response — `200 OK`

```json
{
  "doctorName": "Ahmed Khan",
  "wallet": {
    "pendingClearance": "16362.00",
    "availableToWithdraw": "48780.00",
    "totalLifetimeEarnings": "65142.00"
  },
  "recentTransactions": [
    {
      "id": "f6a7b8c9-d0e1-2345-fghi-678901234567",
      "type": "DOCTOR_NET_EARNING",
      "amount": "16362.00",
      "status": "PENDING_CLEARANCE",
      "description": "Net earnings for \"Night Shift MO\" — Rs. 16362.00",
      "createdAt": "2026-03-06T10:00:00.000Z"
    },
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-111111111111",
      "type": "DOCTOR_NET_EARNING",
      "amount": "6480.00",
      "status": "CLEARED",
      "description": "Net earnings for \"Morning OPD Shift\" — Rs. 6480.00",
      "createdAt": "2026-03-04T09:00:00.000Z"
    },
    {
      "id": "...",
      "type": "PLATFORM_COMMISSION",
      "amount": "1818.00",
      "status": "CLEARED",
      "description": "Platform commission (10%) — Rs. 1818.00",
      "createdAt": "2026-03-06T10:00:00.000Z"
    }
  ]
}
```

### Wallet Fields Explained

| Field                  | How it's calculated                                                                | Frontend usage          |
|------------------------|------------------------------------------------------------------------------------|-------------------------|
| `pendingClearance`     | Sum of `DOCTOR_NET_EARNING` entries with status `PENDING_CLEARANCE`                | "Pending: Rs. 16,362"   |
| `availableToWithdraw`  | Sum of `DOCTOR_NET_EARNING` entries with status `CLEARED`                          | "Available: Rs. 48,780" |
| `totalLifetimeEarnings`| Sum of ALL `DOCTOR_NET_EARNING` entries (all statuses)                             | "Total Earned: Rs. 65,142" |

### Recent Transactions

Returns the **last 20 ledger entries** for this doctor (across ALL types: `DOCTOR_NET_EARNING`, `PLATFORM_COMMISSION`, and `SHIFT_PAYMENT`), ordered by most recent first.

| Field          | Description                                                   |
|----------------|---------------------------------------------------------------|
| `type`         | `DOCTOR_NET_EARNING`, `PLATFORM_COMMISSION`, or `SHIFT_PAYMENT` |
| `amount`       | String decimal — use `parseFloat()`                           |
| `status`       | `PENDING_CLEARANCE`, `CLEARED`, or `WITHDRAWN`                |
| `description`  | Human-readable description of the transaction                 |

### Error Responses

| Status | Condition | Message |
|--------|-----------|---------|
| 400 | Doctor profile not found | "Doctor profile not found." |

---

## 12. Hospital Billing Dashboard

Returns the hospital's financial dashboard: current month spend, lifetime totals, outstanding invoices, and recent transactions.

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/billing/hospital` |
| **Auth** | Bearer Token |
| **Role** | `HOSPITAL` |
| **Status** | `VERIFIED` |

### Request Body

None.

### Success Response — `200 OK`

```json
{
  "hospitalName": "Mayo Hospital",
  "billing": {
    "currentMonthSpend": "54540.00",
    "totalSpent": "324780.00",
    "totalPlatformFees": "32478.00",
    "outstandingInvoices": {
      "count": 2,
      "amount": "36360.00"
    }
  },
  "recentTransactions": [
    {
      "id": "a7b8c9d0-e1f2-3456-ghij-789012345678",
      "type": "SHIFT_PAYMENT",
      "amount": "18180.00",
      "status": "PENDING_CLEARANCE",
      "description": "Shift payment for \"Night Shift MO\" — Rs. 18180.00",
      "createdAt": "2026-03-06T10:00:00.000Z"
    },
    {
      "id": "b8c9d0e1-f2a3-4567-hijk-890123456789",
      "type": "PLATFORM_COMMISSION",
      "amount": "1818.00",
      "status": "CLEARED",
      "description": "Platform commission (10%) — Rs. 1818.00",
      "createdAt": "2026-03-06T10:00:00.000Z"
    },
    {
      "id": "c9d0e1f2-a3b4-5678-ijkl-901234567890",
      "type": "DOCTOR_NET_EARNING",
      "amount": "16362.00",
      "status": "PENDING_CLEARANCE",
      "description": "Net earnings for \"Night Shift MO\" — Rs. 16362.00",
      "createdAt": "2026-03-06T10:00:00.000Z"
    }
  ]
}
```

### Billing Fields Explained

| Field                    | How it's calculated                                                              | Frontend usage            |
|--------------------------|----------------------------------------------------------------------------------|---------------------------|
| `currentMonthSpend`      | Sum of `SHIFT_PAYMENT` entries created this calendar month                       | "This Month: Rs. 54,540"  |
| `totalSpent`             | Sum of ALL `SHIFT_PAYMENT` entries (lifetime)                                    | "Total Spent: Rs. 324,780"|
| `totalPlatformFees`      | Sum of ALL `PLATFORM_COMMISSION` entries (lifetime)                              | "Fees Paid: Rs. 32,478"   |
| `outstandingInvoices.count` | Number of `SHIFT_PAYMENT` entries with status `PENDING_CLEARANCE`             | "2 pending invoices"       |
| `outstandingInvoices.amount` | Sum of `SHIFT_PAYMENT` entries with status `PENDING_CLEARANCE`               | "Rs. 36,360 outstanding"  |

### Recent Transactions

Returns the **last 20 ledger entries** for this hospital (all types), ordered by most recent first.

> **Note**: The hospital sees ALL three entry types for their shifts — the full payment, the platform commission, and even the doctor's net earning (for transparency).

### Error Responses

| Status | Condition | Message |
|--------|-----------|---------|
| 400 | Hospital profile not found | "Hospital profile not found." |

---

## 13. Ledger Entry Lifecycle

```
    Timesheet APPROVED
           │
           ▼
    ┌─────────────────┐
    │ SHIFT_PAYMENT    │─── PENDING_CLEARANCE ──→ CLEARED
    │ (Rs. 18,180)     │    (hospital pays)        (settled)
    └─────────────────┘
    ┌─────────────────┐
    │ PLATFORM_COMM.   │─── CLEARED (immediately)
    │ (Rs. 1,818)      │
    └─────────────────┘
    ┌─────────────────┐
    │ DOCTOR_NET_EARN. │─── PENDING_CLEARANCE ──→ CLEARED ──→ WITHDRAWN
    │ (Rs. 16,362)     │    (processing)          (available)  (paid out)
    └─────────────────┘
```

### Status Flow

| Entry Type | Initial Status | Transitions |
|------------|---------------|-------------|
| `SHIFT_PAYMENT` | `PENDING_CLEARANCE` | → `CLEARED` (when hospital payment settles) |
| `PLATFORM_COMMISSION` | `CLEARED` | Created already settled (no transition) |
| `DOCTOR_NET_EARNING` | `PENDING_CLEARANCE` | → `CLEARED` (funds available) → `WITHDRAWN` (doctor withdraws) |

---

## 14. Auto-Reveal Cron (Blind Reviews — 7 Days)

### How It Works

A cron job runs **every hour** and checks:

> "Are there any reviews with `isVisible = false` and `createdAt` was more than 7 days ago?"

If yes, those reviews are set to `isVisible = true`.

### Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `BLIND_REVIEW_DAYS` | `7` | Days before a one-sided review is auto-revealed |

### Cron Schedule

Runs **every hour** (`CronExpression.EVERY_HOUR`).

### What Gets Revealed

Only reviews where:
1. `isVisible = false` (currently hidden)
2. `createdAt <= now - 7 days` (older than 7 days)

### Frontend Impact

- If only one side has reviewed, tell the user: "Your review will be visible in X days" (calculate from review `createdAt` + 7 days)
- After 7 days (or when both sides review), refresh the reviews list to show newly visible content

```javascript
const reviewCreatedAt = new Date(review.createdAt);
const revealDate = new Date(reviewCreatedAt.getTime() + 7 * 24 * 60 * 60 * 1000);
const daysUntilVisible = Math.max(0, Math.ceil((revealDate - Date.now()) / (24 * 60 * 60 * 1000)));

if (!review.isVisible) {
  // Show: "Your review will be visible in {daysUntilVisible} days"
  // or: "Your review will be visible once the other party also reviews"
}
```

---

## 15. Complete Approval → Payment Flow

```
Timesheet APPROVED
       │
       ├── Event: timesheet.approved
       │
       ▼
┌──────────────────────────────────────────────────────┐
│ LedgerNotificationListener                            │
│ → earningsService.createLedgerEntries(timesheetId)    │
│                                                       │
│ Creates 3 records:                                    │
│   1. SHIFT_PAYMENT       (100%) → PENDING_CLEARANCE   │
│   2. PLATFORM_COMMISSION (10%)  → CLEARED              │
│   3. DOCTOR_NET_EARNING  (90%)  → PENDING_CLEARANCE   │
└──────────────────────────────────────────────────────┘
       │
       ├── Doctor checks GET /earnings/doctor
       │   → sees wallet with pending + available balances
       │
       ├── Hospital checks GET /billing/hospital
       │   → sees billing dashboard with spend + outstanding
       │
       ├── BOTH sides can now leave reviews
       │
       ├── POST /review/timesheet/:id/hospital-reviews-doctor
       │   → Hospital rates doctor (blind)
       │
       ├── POST /review/timesheet/:id/doctor-reviews-hospital
       │   → Doctor rates hospital (blind)
       │
       └── When both review (or 7 days pass):
           → Reviews become visible
           → averageRating updated on profiles
```

---

## 16. Frontend Implementation Guide

### Doctor App — Earnings Wallet Screen

```
┌────────────────────────────────────────────┐
│ 💰 My Earnings                              │
│                                            │
│ ┌──────────────────────────────────────┐   │
│ │  Wallet Balance                       │   │
│ │                                       │   │
│ │  Pending Clearance                    │   │
│ │  Rs. 16,362                           │   │
│ │  ⏳ Processing...                     │   │
│ │                                       │   │
│ │  Available to Withdraw                │   │
│ │  Rs. 48,780                           │   │
│ │  ✅ Ready                              │   │
│ │                                       │   │
│ │  Total Lifetime Earnings              │   │
│ │  Rs. 65,142                           │   │
│ └──────────────────────────────────────┘   │
│                                            │
│ ── Recent Transactions ─────────────────   │
│ ┌──────────────────────────────────┐       │
│ │ ↗ Net Earnings                    │       │
│ │ Night Shift MO                    │       │
│ │ +Rs. 16,362 · Pending             │       │
│ │ Mar 6, 2026                       │       │
│ └──────────────────────────────────┘       │
│ ┌──────────────────────────────────┐       │
│ │ ↗ Net Earnings                    │       │
│ │ Morning OPD Shift                 │       │
│ │ +Rs. 6,480 · Cleared              │       │
│ │ Mar 4, 2026                       │       │
│ └──────────────────────────────────┘       │
│ ┌──────────────────────────────────┐       │
│ │ ← Platform Fee                    │       │
│ │ Night Shift MO                    │       │
│ │ -Rs. 1,818 · Commission           │       │
│ │ Mar 6, 2026                       │       │
│ └──────────────────────────────────┘       │
└────────────────────────────────────────────┘

API: GET /earnings/doctor
```

### Hospital App — Billing Dashboard

```
┌────────────────────────────────────────────┐
│ 📊 Billing                                  │
│ Mayo Hospital                              │
│                                            │
│ ┌──────────────────────────────────────┐   │
│ │  This Month                           │   │
│ │  Rs. 54,540                           │   │
│ │                                       │   │
│ │  Total Spent (Lifetime)               │   │
│ │  Rs. 324,780                          │   │
│ │                                       │   │
│ │  Platform Fees Paid                   │   │
│ │  Rs. 32,478                           │   │
│ │                                       │   │
│ │  Outstanding Invoices                 │   │
│ │  2 invoices · Rs. 36,360              │   │
│ └──────────────────────────────────────┘   │
│                                            │
│ ── Recent Transactions ─────────────────   │
│ ┌──────────────────────────────────┐       │
│ │ Shift Payment                     │       │
│ │ Night Shift MO                    │       │
│ │ Rs. 18,180 · Pending Clearance    │       │
│ │ Mar 6, 2026                       │       │
│ └──────────────────────────────────┘       │
│ ┌──────────────────────────────────┐       │
│ │ Platform Commission               │       │
│ │ Night Shift MO                    │       │
│ │ Rs. 1,818 · Cleared               │       │
│ │ Mar 6, 2026                       │       │
│ └──────────────────────────────────┘       │
└────────────────────────────────────────────┘

API: GET /billing/hospital
```

### Review Submission Screen (Both Roles)

```
┌────────────────────────────────────────────┐
│ ← Rate Your Experience                     │
│                                            │
│ Night Shift MO                             │
│ Mayo Hospital · Mar 5-6, 2026              │
│                                            │
│ How was your experience?                   │
│                                            │
│     ☆  ☆  ☆  ☆  ☆                         │
│     1  2  3  4  5                          │
│                                            │
│ Leave a comment (optional):                │
│ ┌──────────────────────────────────┐       │
│ │ Very professional doctor,        │       │
│ │ arrived on time and handled      │       │
│ │ all patients well.               │       │
│ └──────────────────────────────────┘       │
│ Max 2000 characters                        │
│                                            │
│ 🔒 Your review will be hidden until the    │
│    other party also leaves their review    │
│    (or 7 days, whichever comes first).     │
│                                            │
│        [   SUBMIT REVIEW   ]               │
│                                            │
└────────────────────────────────────────────┘

API (Hospital): POST /review/timesheet/:id/hospital-reviews-doctor
API (Doctor):   POST /review/timesheet/:id/doctor-reviews-hospital
```

### Doctor Profile — Reviews Section

```
┌────────────────────────────────────────────┐
│ ⭐ 4.5 (12 reviews)                        │
│                                            │
│ ┌──────────────────────────────────┐       │
│ │ ⭐⭐⭐⭐ (4/5)                       │       │
│ │ Mayo Hospital · Night Shift MO   │       │
│ │ "Very professional doctor,       │       │
│ │  arrived on time."               │       │
│ │ Mar 7, 2026                      │       │
│ └──────────────────────────────────┘       │
│ ┌──────────────────────────────────┐       │
│ │ ⭐⭐⭐⭐⭐ (5/5)                      │       │
│ │ Services Hospital · ICU Night    │       │
│ │ "Excellent work during a very    │       │
│ │  busy night."                    │       │
│ │ Mar 3, 2026                      │       │
│ └──────────────────────────────────┘       │
│                                            │
│ Page 1 of 1                                │
└────────────────────────────────────────────┘

API: GET /review/doctor/:doctorProfileId?page=1&limit=20
```

### Review Prompt Logic — When to Show

After a timesheet is **APPROVED** or **RESOLVED**, check if the user has already reviewed:

```javascript
// 1. Check if user already reviewed
const myReview = await api.get(
  `/review/timesheet/${timesheetId}/mine`
);

if (myReview.data === null) {
  // Show "Leave Review" prompt
  showReviewPrompt(timesheetId);
} else {
  // Show "You reviewed: X stars"
  showMyReview(myReview.data);

  if (!myReview.data.isVisible) {
    // Show "Waiting for other party to review (or visible in X days)"
    const revealDate = new Date(
      new Date(myReview.data.createdAt).getTime() + 7 * 24 * 60 * 60 * 1000
    );
    showBlindReviewNotice(revealDate);
  }
}
```

---

## Quick Reference — All Endpoints in This Guide

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/review/timesheet/:timesheetId/hospital-reviews-doctor` | HOSPITAL | Hospital rates doctor |
| POST | `/review/timesheet/:timesheetId/doctor-reviews-hospital` | DOCTOR | Doctor rates hospital |
| GET | `/review/doctor/:doctorProfileId` | ANY VERIFIED | Get doctor's visible reviews |
| GET | `/review/hospital/:hospitalProfileId` | ANY VERIFIED | Get hospital's visible reviews |
| GET | `/review/timesheet/:timesheetId/mine` | DOCTOR, HOSPITAL | Check if I already reviewed |
| GET | `/earnings/doctor` | DOCTOR | Doctor earnings wallet |
| GET | `/billing/hospital` | HOSPITAL | Hospital billing dashboard |

---

## Key Constants Reference

| Constant | Value | Description |
|----------|-------|-------------|
| Platform commission rate | 10% (0.10) | Deducted from gross pay |
| Doctor net rate | 90% | Doctor keeps this portion |
| Blind review window | 7 days | Auto-reveal after 7 days |
| Rating range | 1–5 | Integer stars only |
| Comment max length | 2000 chars | Optional text review |
| Recent transactions limit | 20 | Last 20 entries returned |
| Blind review cron | Every hour | Checks for 7-day-old hidden reviews |

---

## Enum Reference (This Guide)

### ReviewerType

| Value | Description |
|-------|-------------|
| `HOSPITAL_REVIEWING_DOCTOR` | Hospital rates the doctor |
| `DOCTOR_REVIEWING_HOSPITAL` | Doctor rates the hospital |

### LedgerEntryType

| Value | Description |
|-------|-------------|
| `SHIFT_PAYMENT` | Full gross amount hospital owes |
| `PLATFORM_COMMISSION` | 10% platform fee |
| `DOCTOR_NET_EARNING` | 90% doctor's net pay |

### LedgerEntryStatus

| Value | Description |
|-------|-------------|
| `PENDING_CLEARANCE` | Not yet settled |
| `CLEARED` | Payment settled / available |
| `WITHDRAWN` | Doctor has withdrawn funds |

---

> **Next Guide**: Guide 5 — Admin Panel, Notifications & Mobile Integration (Super admin endpoints, dispute resolution, user management, platform stats, notification system architecture, push notification handling)

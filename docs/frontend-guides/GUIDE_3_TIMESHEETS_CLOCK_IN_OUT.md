# Guide 3 — Timesheets, Clock-In/Out & Geo-Fencing

> **Audience**: Mobile / Frontend Engineers  
> **Backend**: NestJS + Prisma + PostgreSQL (Supabase) + JWT  
> **Last Updated**: March 2, 2026  
> **Prerequisites**: Read [Guide 1](./GUIDE_1_AUTH_AND_ONBOARDING.md) & [Guide 2](./GUIDE_2_SHIFTS_AND_APPLICATIONS.md)

---

## Table of Contents

1. [Overview & Business Logic](#1-overview--business-logic)
2. [Timesheet Lifecycle State Machine](#2-timesheet-lifecycle-state-machine)
3. [Timesheet Data Model](#3-timesheet-data-model)
4. [Clock-In (Doctor)](#4-clock-in-doctor)
5. [Clock-Out (Doctor)](#5-clock-out-doctor)
6. [Get My Timesheets (Doctor)](#6-get-my-timesheets-doctor)
7. [Get Hospital Timesheets (Hospital)](#7-get-hospital-timesheets-hospital)
8. [Approve Timesheet (Hospital)](#8-approve-timesheet-hospital)
9. [Dispute Timesheet (Hospital)](#9-dispute-timesheet-hospital)
10. [Get Timesheet by Shift (Any Verified User)](#10-get-timesheet-by-shift-any-verified-user)
11. [Geo-Fencing Deep Dive](#11-geo-fencing-deep-dive)
12. [Clock-In Time Window Rules](#12-clock-in-time-window-rules)
13. [Auto-Approve Behavior (Cron — 48 Hours)](#13-auto-approve-behavior-cron--48-hours)
14. [Missed Clock-In Detection (Cron — 30 Minutes)](#14-missed-clock-in-detection-cron--30-minutes)
15. [Notification Events Triggered](#15-notification-events-triggered)
16. [Complete Clock-In → Payout Flow](#16-complete-clock-in--payout-flow)
17. [Frontend Implementation Guide](#17-frontend-implementation-guide)

---

## 1. Overview & Business Logic

The **Timesheet** system tracks actual work done during a shift. It is the bridge between "doctor was assigned a shift" and "doctor gets paid." Here's how it works end-to-end:

1. **Timesheet is auto-created** when a hospital accepts a doctor's application (see Guide 2, section 7.5). The frontend does **not** create timesheets manually.
2. **Doctor clocks in** when they physically arrive at the hospital — the backend validates their GPS location is within **500 meters** of the hospital (geo-fence) and that the current time is within the allowed window.
3. **Doctor clocks out** when their shift ends — the backend calculates `hoursWorked` and `finalCalculatedPay` automatically.
4. **Hospital reviews the timesheet** — they can either **approve** it or **dispute** it (escalates to admin).
5. If the hospital doesn't act within **48 hours**, the timesheet is **auto-approved** by a cron job.
6. Once approved, **ledger entries** (financial records) are created for payment processing (see Guide 4).

### Key Business Rules

| Rule | Detail |
|------|--------|
| **Timesheet auto-created** | Created automatically when hospital accepts a doctor's application — NOT by API call |
| **Geo-fence for clock-in** | Doctor must be within **500 meters** (0.5 km) of the hospital's GPS coordinates |
| **Clock-in time window** | 30 minutes before shift start → 2 hours after shift start |
| **Clock-out: no geo-fence** | Clock-out only requires GPS location for audit trail, no distance enforcement |
| **Auto-pay calculation** | `hoursWorked × hourlyRate` computed server-side on clock-out |
| **48-hour auto-approve** | If hospital doesn't approve/dispute within 48 hours of clock-out, cron auto-approves |
| **Missed clock-in** | If doctor never clocks in and shift end time passes, cron marks timesheet as DISPUTED |
| **One timesheet per shift** | Enforced by unique constraint on `shiftId` |
| **Shift status changes** | Clock-in → `FILLED` → `IN_PROGRESS`. Clock-out → `IN_PROGRESS` → `COMPLETED` |

---

## 2. Timesheet Lifecycle State Machine

```
              ┌────────────────────────────────────────────────────────────┐
              │                  TIMESHEET STATUS FLOW                      │
              ├────────────────────────────────────────────────────────────┤
              │                                                            │
              │  Hospital accepts doctor (Guide 2)                         │
              │          │                                                 │
              │          ▼                                                 │
              │  ┌──────────────────┐                                      │
              │  │ PENDING_APPROVAL │ ◄── Initial status (no clocks yet)   │
              │  └────────┬─────────┘                                      │
              │           │                                                │
              │    Doctor clocks in → shift becomes IN_PROGRESS            │
              │    Doctor clocks out → shift becomes COMPLETED             │
              │    Timesheet remains PENDING_APPROVAL                      │
              │           │                                                │
              │           │  Hospital reviews                              │
              │     ┌─────┴────────┐                                       │
              │     │              │                                        │
              │     ▼              ▼                                        │
              │ ┌────────┐   ┌──────────┐                                  │
              │ │APPROVED│   │ DISPUTED │                                   │
              │ └────────┘   └─────┬────┘                                   │
              │  (hospital    (hospital                                     │
              │   approves     disputes                                     │
              │   OR cron      OR cron                                      │
              │   auto-        flags                                        │
              │   approves     missed                                       │
              │   after 48h)   clock-in)                                    │
              │                    │                                        │
              │                    ▼                                        │
              │              ┌──────────┐                                   │
              │              │ RESOLVED │                                   │
              │              └──────────┘                                   │
              │              (admin                                         │
              │               resolves                                      │
              │               the dispute                                   │
              │               — Guide 5)                                    │
              │                                                            │
              └────────────────────────────────────────────────────────────┘
```

### Status Transitions

| From               | To                 | Trigger                                                              |
|--------------------|--------------------|----------------------------------------------------------------------|
| `PENDING_APPROVAL` | `APPROVED`         | Hospital manually approves the timesheet                             |
| `PENDING_APPROVAL` | `APPROVED`         | Cron auto-approves after 48 hours of hospital inaction               |
| `PENDING_APPROVAL` | `DISPUTED`         | Hospital manually disputes the timesheet                             |
| `PENDING_APPROVAL` | `DISPUTED`         | Cron flags missed clock-in (doctor never showed up)                  |
| `DISPUTED`         | `RESOLVED`         | Admin resolves the dispute (see Guide 5)                             |

> **Note**: The timesheet starts at `PENDING_APPROVAL` and stays there through clock-in AND clock-out. The status only changes when the hospital approves/disputes, or a cron job intervenes.

---

## 3. Timesheet Data Model

Full shape of a Timesheet object as returned by the API:

```json
{
  "id": "d4e5f6a7-b8c9-0123-defg-456789012345",
  "shiftId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "doctorProfileId": "660e8400-e29b-41d4-a716-446655440000",
  "hospitalProfileId": "880e8400-e29b-41d4-a716-446655440000",
  "clockInTime": "2026-03-05T19:55:00.000Z",
  "clockOutTime": "2026-03-06T08:02:00.000Z",
  "clockInLat": 31.5201,
  "clockInLng": 74.3584,
  "clockOutLat": 31.5203,
  "clockOutLng": 74.3586,
  "hoursWorked": "12.12",
  "finalCalculatedPay": "18180.00",
  "status": "PENDING_APPROVAL",
  "disputeNote": null,
  "resolvedAt": null,
  "createdAt": "2026-03-02T15:00:00.000Z",
  "updatedAt": "2026-03-06T08:02:00.000Z"
}
```

| Field                | Type                   | Notes                                                         |
|----------------------|------------------------|---------------------------------------------------------------|
| `id`                 | `string` (UUID)        | Primary key                                                   |
| `shiftId`            | `string` (UUID)        | One-to-one with Shift (unique)                                |
| `doctorProfileId`    | `string` (UUID)        | Which doctor worked this shift                                |
| `hospitalProfileId`  | `string` (UUID)        | Which hospital owns this shift                                |
| `clockInTime`        | `string \| null`       | ISO 8601 — `null` until doctor clocks in                      |
| `clockOutTime`       | `string \| null`       | ISO 8601 — `null` until doctor clocks out                     |
| `clockInLat`         | `number \| null`       | Doctor's GPS latitude at clock-in (audit trail)               |
| `clockInLng`         | `number \| null`       | Doctor's GPS longitude at clock-in (audit trail)              |
| `clockOutLat`        | `number \| null`       | Doctor's GPS latitude at clock-out (audit trail)              |
| `clockOutLng`        | `number \| null`       | Doctor's GPS longitude at clock-out (audit trail)             |
| `hoursWorked`        | `string \| null`       | Decimal — calculated on clock-out: `(clockOut - clockIn) / 1hr` |
| `finalCalculatedPay` | `string \| null`       | Decimal — calculated on clock-out: `hoursWorked × hourlyRate` |
| `status`             | `TimesheetStatus` enum | `PENDING_APPROVAL`, `APPROVED`, `DISPUTED`, `RESOLVED`        |
| `disputeNote`        | `string \| null`       | Hospital's reason for dispute (or cron auto-flag note)        |
| `resolvedAt`         | `string \| null`       | When admin resolved the dispute                               |
| `createdAt`          | `string` (ISO 8601)    |                                                               |
| `updatedAt`          | `string` (ISO 8601)    |                                                               |

> **Decimal fields** (`hoursWorked`, `finalCalculatedPay`) are returned as **strings** by Prisma. Parse them to float for display: `parseFloat("12.12")` → `12.12`.

### Timesheet Status Enum

| Value              | Description                                                  |
|--------------------|--------------------------------------------------------------|
| `PENDING_APPROVAL` | Default. Waiting for hospital to approve or dispute          |
| `APPROVED`         | Hospital approved (or auto-approved after 48h). Triggers payment |
| `DISPUTED`         | Hospital disputed OR cron flagged missed clock-in. Escalated to admin |
| `RESOLVED`         | Admin resolved the dispute                                    |

---

## 4. Clock-In (Doctor)

Doctor clocks in to their accepted shift. The backend validates **time window** and **GPS geo-fence** before allowing clock-in.

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `/timesheet/shift/:shiftId/clock-in` |
| **Auth** | Bearer Token |
| **Role** | `DOCTOR` |
| **Status** | `VERIFIED` |

### URL Parameter

| Parameter | Type     | Description       |
|-----------|----------|-------------------|
| `shiftId` | `string` | Shift UUID        |

### Request Body

```json
{
  "latitude": 31.5201,
  "longitude": 74.3584
}
```

| Field       | Type     | Required | Validation                    |
|-------------|----------|----------|-------------------------------|
| `latitude`  | `number` | Yes      | Valid latitude (-90 to +90)   |
| `longitude` | `number` | Yes      | Valid longitude (-180 to +180)|

> **IMPORTANT**: You **must** capture the doctor's current GPS location from the device and send it in the body. This is the core of the geo-fence feature.

### Server-Side Validation Chain (7 Steps)

The backend performs these checks **in order**. If any check fails, the subsequent ones do not run:

| Step | Check | Error if fails |
|------|-------|----------------|
| 1 | Doctor profile exists | "Doctor profile not found." |
| 2 | Timesheet exists for this shift | "Timesheet not found for this shift. Has your application been accepted?" |
| 3 | This doctor owns the timesheet | "You are not the assigned doctor for this shift." |
| 4 | Not already clocked in | "You have already clocked in for this shift." |
| 5 | Shift status is `FILLED` | "Cannot clock in. Shift status is {status}, expected FILLED." |
| 6 | Current time within allowed window | See [Clock-In Time Window Rules](#12-clock-in-time-window-rules) |
| 7 | Doctor is within 500m of hospital | See [Geo-Fencing Deep Dive](#11-geo-fencing-deep-dive) |

### Success Response — `201 Created`

```json
{
  "message": "Clocked in successfully. Your shift has started.",
  "clockInTime": "2026-03-05T19:55:00.000Z",
  "timesheet": {
    "id": "d4e5f6a7-b8c9-0123-defg-456789012345",
    "shiftId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "doctorProfileId": "660e8400-e29b-41d4-a716-446655440000",
    "hospitalProfileId": "880e8400-e29b-41d4-a716-446655440000",
    "clockInTime": "2026-03-05T19:55:00.000Z",
    "clockOutTime": null,
    "clockInLat": 31.5201,
    "clockInLng": 74.3584,
    "clockOutLat": null,
    "clockOutLng": null,
    "hoursWorked": null,
    "finalCalculatedPay": null,
    "status": "PENDING_APPROVAL",
    "disputeNote": null,
    "resolvedAt": null,
    "createdAt": "2026-03-02T15:00:00.000Z",
    "updatedAt": "2026-03-05T19:55:00.000Z"
  }
}
```

### Side Effects

| Action | Description |
|--------|-------------|
| Shift → `IN_PROGRESS` | Shift status changes from `FILLED` to `IN_PROGRESS` |
| Hospital is notified | Push notification: "Dr. Ahmed Khan has clocked in for Night Shift MO. The shift is now in progress." |
| GPS coordinates stored | `clockInLat` and `clockInLng` stored as audit trail |

### Error Responses — Complete List

| Status | Condition | Message |
|--------|-----------|---------|
| 400 | Doctor profile not found | "Doctor profile not found." |
| 404 | No timesheet for this shift | "Timesheet not found for this shift. Has your application been accepted?" |
| 403 | Not the assigned doctor | "You are not the assigned doctor for this shift." |
| 400 | Already clocked in | "You have already clocked in for this shift." |
| 400 | Shift not in FILLED status | "Cannot clock in. Shift status is {status}, expected FILLED." |
| 400 | Too early to clock in | "Too early to clock in. You can clock in starting {earliestTime} (30 minutes before shift start)." |
| 400 | Too late to clock in | "Too late to clock in. The clock-in window closed at {latestTime} (2 hours after shift start). Contact support if needed." |
| 400 | Outside geo-fence | "You are {distance} meters away from {hospitalName}. You must be within 500 meters to clock in." |

---

## 5. Clock-Out (Doctor)

Doctor clocks out when their shift is done. The server automatically calculates hours worked and final pay.

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `/timesheet/shift/:shiftId/clock-out` |
| **Auth** | Bearer Token |
| **Role** | `DOCTOR` |
| **Status** | `VERIFIED` |

### URL Parameter

| Parameter | Type     | Description       |
|-----------|----------|-------------------|
| `shiftId` | `string` | Shift UUID        |

### Request Body

```json
{
  "latitude": 31.5203,
  "longitude": 74.3586
}
```

| Field       | Type     | Required | Validation                    |
|-------------|----------|----------|-------------------------------|
| `latitude`  | `number` | Yes      | Valid latitude (-90 to +90)   |
| `longitude` | `number` | Yes      | Valid longitude (-180 to +180)|

> **Note**: Clock-out captures GPS coordinates for audit purposes but does **NOT enforce geo-fencing**. The doctor can clock out from anywhere.

### Server-Side Validation Chain (4 Steps)

| Step | Check | Error if fails |
|------|-------|----------------|
| 1 | Doctor profile exists | "Doctor profile not found." |
| 2 | Timesheet exists for this shift | "Timesheet not found for this shift." |
| 3 | This doctor owns the timesheet | "You are not the assigned doctor for this shift." |
| 4 | Doctor has clocked in | "You must clock in before you can clock out." |
| 5 | Not already clocked out | "You have already clocked out for this shift." |

### Pay Calculation Logic

The server calculates these values automatically:

```
clockOutTime = NOW (server time)
hoursWorked  = (clockOutTime - clockInTime) / (1000 × 60 × 60)   → rounded to 2 decimal places
finalPay     = hoursWorked × shift.hourlyRate
```

**Example calculation:**
- Clock-in: `2026-03-05T20:00:00.000Z`
- Clock-out: `2026-03-06T08:02:00.000Z`
- Time worked: 12 hours and 2 minutes = `12.03` hours
- Hourly rate: Rs. 1,500
- Final pay: `12.03 × 1500` = Rs. `18,045.00`

### Success Response — `201 Created`

```json
{
  "message": "Clocked out successfully. Shift completed.",
  "clockOutTime": "2026-03-06T08:02:00.000Z",
  "hoursWorked": 12.03,
  "finalCalculatedPay": "18045.00",
  "timesheet": {
    "id": "d4e5f6a7-b8c9-0123-defg-456789012345",
    "shiftId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "doctorProfileId": "660e8400-e29b-41d4-a716-446655440000",
    "hospitalProfileId": "880e8400-e29b-41d4-a716-446655440000",
    "clockInTime": "2026-03-05T20:00:00.000Z",
    "clockOutTime": "2026-03-06T08:02:00.000Z",
    "clockInLat": 31.5201,
    "clockInLng": 74.3584,
    "clockOutLat": 31.5203,
    "clockOutLng": 74.3586,
    "hoursWorked": "12.03",
    "finalCalculatedPay": "18045.00",
    "status": "PENDING_APPROVAL",
    "disputeNote": null,
    "resolvedAt": null,
    "createdAt": "2026-03-02T15:00:00.000Z",
    "updatedAt": "2026-03-06T08:02:00.000Z"
  }
}
```

> **Note**: In the top-level response, `hoursWorked` is a `number` (12.03). Inside the `timesheet` object, it's a `string` ("12.03") because of Prisma's Decimal type. Use `parseFloat()` on the timesheet version.

### Side Effects

| Action | Description |
|--------|-------------|
| Shift → `COMPLETED` | Shift status changes from `IN_PROGRESS` to `COMPLETED` |
| Timesheet → `PENDING_APPROVAL` | Status stays `PENDING_APPROVAL` (waiting for hospital) |
| Hospital notified | Push: "Dr. Ahmed Khan has completed Night Shift MO. Hours worked: 12.03. Pay: Rs. 18,045. Please review and approve the timesheet within 48 hours, otherwise it will be auto-approved." |
| GPS coordinates stored | `clockOutLat` and `clockOutLng` stored as audit trail |
| 48-hour countdown begins | If hospital doesn't act, cron auto-approves |

### Error Responses — Complete List

| Status | Condition | Message |
|--------|-----------|---------|
| 400 | Doctor profile not found | "Doctor profile not found." |
| 404 | No timesheet for this shift | "Timesheet not found for this shift." |
| 403 | Not the assigned doctor | "You are not the assigned doctor for this shift." |
| 400 | Not clocked in yet | "You must clock in before you can clock out." |
| 400 | Already clocked out | "You have already clocked out for this shift." |

---

## 6. Get My Timesheets (Doctor)

Returns all timesheets for the logged-in doctor, with optional status filter.

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/timesheet/doctor` |
| **Auth** | Bearer Token |
| **Role** | `DOCTOR` |
| **Status** | `VERIFIED` |

### Query Parameters

| Parameter | Type     | Required | Description |
|-----------|----------|----------|-------------|
| `status`  | `string` | No       | Filter: `PENDING_APPROVAL`, `APPROVED`, `DISPUTED`, `RESOLVED` |

### Example Requests

```
GET /timesheet/doctor
GET /timesheet/doctor?status=PENDING_APPROVAL
GET /timesheet/doctor?status=APPROVED
```

### Success Response — `200 OK`

Returns an **array** of timesheets with shift and hospital details:

```json
[
  {
    "id": "d4e5f6a7-b8c9-0123-defg-456789012345",
    "shiftId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "doctorProfileId": "660e8400-e29b-41d4-a716-446655440000",
    "hospitalProfileId": "880e8400-e29b-41d4-a716-446655440000",
    "clockInTime": "2026-03-05T19:55:00.000Z",
    "clockOutTime": "2026-03-06T08:02:00.000Z",
    "clockInLat": 31.5201,
    "clockInLng": 74.3584,
    "clockOutLat": 31.5203,
    "clockOutLng": 74.3586,
    "hoursWorked": "12.12",
    "finalCalculatedPay": "18180.00",
    "status": "APPROVED",
    "disputeNote": null,
    "resolvedAt": null,
    "createdAt": "2026-03-02T15:00:00.000Z",
    "updatedAt": "2026-03-06T10:00:00.000Z",
    "shift": {
      "title": "Night Shift MO",
      "department": "EMERGENCY",
      "startTime": "2026-03-05T20:00:00.000Z",
      "endTime": "2026-03-06T08:00:00.000Z",
      "hourlyRate": "1500.00"
    },
    "hospitalProfile": {
      "hospitalName": "Mayo Hospital",
      "address": "2-Jail Road, Lahore",
      "city": "Lahore",
      "logoUrl": "https://..."
    }
  },
  {
    "id": "...",
    "status": "PENDING_APPROVAL",
    "clockInTime": null,
    "clockOutTime": null,
    "hoursWorked": null,
    "finalCalculatedPay": null,
    "shift": {
      "title": "Morning OPD Shift",
      "department": "OPD",
      "startTime": "2026-03-07T08:00:00.000Z",
      "endTime": "2026-03-07T14:00:00.000Z",
      "hourlyRate": "1200.00"
    },
    "hospitalProfile": {
      "hospitalName": "Services Hospital",
      "city": "Lahore"
    }
  }
]
```

### Included Relations

| Relation            | Fields Returned                                |
|---------------------|------------------------------------------------|
| `shift`             | `title`, `department`, `startTime`, `endTime`, `hourlyRate` |
| `hospitalProfile`   | `hospitalName`, `address`, `city`, `logoUrl`   |

### Error Responses

| Status | Condition | Message |
|--------|-----------|---------|
| 400 | Doctor profile not found | "Doctor profile not found." |

---

## 7. Get Hospital Timesheets (Hospital)

Returns all timesheets for shifts posted by the logged-in hospital, with optional status filter.

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/timesheet/hospital` |
| **Auth** | Bearer Token |
| **Role** | `HOSPITAL` |
| **Status** | `VERIFIED` |

### Query Parameters

| Parameter | Type     | Required | Description |
|-----------|----------|----------|-------------|
| `status`  | `string` | No       | Filter: `PENDING_APPROVAL`, `APPROVED`, `DISPUTED`, `RESOLVED` |

### Example Requests

```
GET /timesheet/hospital
GET /timesheet/hospital?status=PENDING_APPROVAL
GET /timesheet/hospital?status=DISPUTED
```

### Success Response — `200 OK`

Returns an **array** of timesheets with shift and doctor details:

```json
[
  {
    "id": "d4e5f6a7-b8c9-0123-defg-456789012345",
    "shiftId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "doctorProfileId": "660e8400-e29b-41d4-a716-446655440000",
    "hospitalProfileId": "880e8400-e29b-41d4-a716-446655440000",
    "clockInTime": "2026-03-05T19:55:00.000Z",
    "clockOutTime": "2026-03-06T08:02:00.000Z",
    "clockInLat": 31.5201,
    "clockInLng": 74.3584,
    "clockOutLat": 31.5203,
    "clockOutLng": 74.3586,
    "hoursWorked": "12.12",
    "finalCalculatedPay": "18180.00",
    "status": "PENDING_APPROVAL",
    "disputeNote": null,
    "resolvedAt": null,
    "createdAt": "2026-03-02T15:00:00.000Z",
    "updatedAt": "2026-03-06T08:02:00.000Z",
    "shift": {
      "title": "Night Shift MO",
      "department": "EMERGENCY",
      "startTime": "2026-03-05T20:00:00.000Z",
      "endTime": "2026-03-06T08:00:00.000Z",
      "hourlyRate": "1500.00"
    },
    "doctorProfile": {
      "firstName": "Ahmed",
      "lastName": "Khan",
      "pmdcNumber": "12345-P",
      "specialty": "ER_SPECIALIST",
      "profilePicUrl": "https://..."
    }
  }
]
```

### Included Relations

| Relation          | Fields Returned                                             |
|-------------------|-------------------------------------------------------------|
| `shift`           | `title`, `department`, `startTime`, `endTime`, `hourlyRate` |
| `doctorProfile`   | `firstName`, `lastName`, `pmdcNumber`, `specialty`, `profilePicUrl` |

### Error Responses

| Status | Condition | Message |
|--------|-----------|---------|
| 400 | Hospital profile not found | "Hospital profile not found." |

---

## 8. Approve Timesheet (Hospital)

Hospital approves a completed timesheet. This triggers the payment/ledger creation flow (see Guide 4).

| | |
|---|---|
| **Method** | `PATCH` |
| **URL** | `/timesheet/:id/approve` |
| **Auth** | Bearer Token |
| **Role** | `HOSPITAL` |
| **Status** | `VERIFIED` |

### URL Parameter

| Parameter | Type     | Description        |
|-----------|----------|--------------------|
| `id`      | `string` | Timesheet UUID     |

### Request Body

None.

### Server-Side Validation

| Step | Check | Error if fails |
|------|-------|----------------|
| 1 | Hospital profile exists | "Hospital profile not found." |
| 2 | Timesheet exists | "Timesheet not found." |
| 3 | This hospital owns the timesheet | "You can only approve timesheets for your own shifts." |
| 4 | Status is `PENDING_APPROVAL` | "Cannot approve a timesheet with status {status}." |

### Success Response — `200 OK`

```json
{
  "message": "Timesheet approved. Payment will be processed.",
  "timesheet": {
    "id": "d4e5f6a7-b8c9-0123-defg-456789012345",
    "shiftId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "doctorProfileId": "660e8400-e29b-41d4-a716-446655440000",
    "hospitalProfileId": "880e8400-e29b-41d4-a716-446655440000",
    "clockInTime": "2026-03-05T19:55:00.000Z",
    "clockOutTime": "2026-03-06T08:02:00.000Z",
    "clockInLat": 31.5201,
    "clockInLng": 74.3584,
    "clockOutLat": 31.5203,
    "clockOutLng": 74.3586,
    "hoursWorked": "12.12",
    "finalCalculatedPay": "18180.00",
    "status": "APPROVED",
    "disputeNote": null,
    "resolvedAt": null,
    "createdAt": "2026-03-02T15:00:00.000Z",
    "updatedAt": "2026-03-06T10:00:00.000Z"
  }
}
```

### Side Effects

| Action | Description |
|--------|-------------|
| Timesheet → `APPROVED` | Status changes to `APPROVED` |
| Doctor notified | Push: "Your timesheet for Night Shift MO at Mayo Hospital has been approved. Amount: Rs. 18,180. Payment will be processed shortly." |
| Ledger entries created | 3 financial records created (see Guide 4): full payment, platform commission, doctor net earning |

### Error Responses — Complete List

| Status | Condition | Message |
|--------|-----------|---------|
| 400 | Hospital profile not found | "Hospital profile not found." |
| 404 | Timesheet not found | "Timesheet not found." |
| 403 | Not this hospital's timesheet | "You can only approve timesheets for your own shifts." |
| 400 | Timesheet not PENDING_APPROVAL | "Cannot approve a timesheet with status {status}." |

---

## 9. Dispute Timesheet (Hospital)

Hospital disputes a timesheet, escalating it to admin review. The hospital must provide a reason.

| | |
|---|---|
| **Method** | `PATCH` |
| **URL** | `/timesheet/:id/dispute` |
| **Auth** | Bearer Token |
| **Role** | `HOSPITAL` |
| **Status** | `VERIFIED` |

### URL Parameter

| Parameter | Type     | Description        |
|-----------|----------|--------------------|
| `id`      | `string` | Timesheet UUID     |

### Request Body

```json
{
  "note": "Doctor left 2 hours early but clock-out was at the correct time."
}
```

| Field  | Type     | Required | Validation          |
|--------|----------|----------|---------------------|
| `note` | `string` | No       | Max 2000 characters |

> If `note` is omitted or empty, the server sets it to `"No reason provided."`.

### Server-Side Validation

| Step | Check | Error if fails |
|------|-------|----------------|
| 1 | Hospital profile exists | "Hospital profile not found." |
| 2 | Timesheet exists | "Timesheet not found." |
| 3 | This hospital owns the timesheet | "You can only dispute timesheets for your own shifts." |
| 4 | Status is `PENDING_APPROVAL` | "Cannot dispute a timesheet with status {status}." |

### Success Response — `200 OK`

```json
{
  "message": "Timesheet disputed. It has been escalated for admin review.",
  "timesheet": {
    "id": "d4e5f6a7-b8c9-0123-defg-456789012345",
    "shiftId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "doctorProfileId": "660e8400-e29b-41d4-a716-446655440000",
    "hospitalProfileId": "880e8400-e29b-41d4-a716-446655440000",
    "clockInTime": "2026-03-05T19:55:00.000Z",
    "clockOutTime": "2026-03-06T08:02:00.000Z",
    "hoursWorked": "12.12",
    "finalCalculatedPay": "18180.00",
    "status": "DISPUTED",
    "disputeNote": "Doctor left 2 hours early but clock-out was at the correct time.",
    "resolvedAt": null,
    "createdAt": "2026-03-02T15:00:00.000Z",
    "updatedAt": "2026-03-06T10:00:00.000Z"
  }
}
```

### Side Effects

| Action | Description |
|--------|-------------|
| Timesheet → `DISPUTED` | Status changes to `DISPUTED` |
| `disputeNote` saved | The hospital's reason is stored |
| Doctor notified | Push: "Your timesheet for Night Shift MO at Mayo Hospital has been disputed by the hospital. Reason: Doctor left 2 hours early but... This has been escalated to the platform admin for resolution." |
| Escalated to admin | Admin can see and resolve this dispute (Guide 5) |

### Error Responses — Complete List

| Status | Condition | Message |
|--------|-----------|---------|
| 400 | Hospital profile not found | "Hospital profile not found." |
| 404 | Timesheet not found | "Timesheet not found." |
| 403 | Not this hospital's timesheet | "You can only dispute timesheets for your own shifts." |
| 400 | Timesheet not PENDING_APPROVAL | "Cannot dispute a timesheet with status {status}." |

---

## 10. Get Timesheet by Shift (Any Verified User)

Returns the timesheet for a specific shift. Accessible by doctors, hospitals, and admins.

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/timesheet/shift/:shiftId` |
| **Auth** | Bearer Token |
| **Role** | `DOCTOR`, `HOSPITAL`, `SUPER_ADMIN` |
| **Status** | `VERIFIED` |

### URL Parameter

| Parameter | Type     | Description       |
|-----------|----------|-------------------|
| `shiftId` | `string` | Shift UUID        |

### Success Response — `200 OK`

```json
{
  "id": "d4e5f6a7-b8c9-0123-defg-456789012345",
  "shiftId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "doctorProfileId": "660e8400-e29b-41d4-a716-446655440000",
  "hospitalProfileId": "880e8400-e29b-41d4-a716-446655440000",
  "clockInTime": "2026-03-05T19:55:00.000Z",
  "clockOutTime": "2026-03-06T08:02:00.000Z",
  "clockInLat": 31.5201,
  "clockInLng": 74.3584,
  "clockOutLat": 31.5203,
  "clockOutLng": 74.3586,
  "hoursWorked": "12.12",
  "finalCalculatedPay": "18180.00",
  "status": "APPROVED",
  "disputeNote": null,
  "resolvedAt": null,
  "createdAt": "2026-03-02T15:00:00.000Z",
  "updatedAt": "2026-03-06T10:00:00.000Z",
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
    "status": "COMPLETED",
    "hospitalProfile": {
      "hospitalName": "Mayo Hospital",
      "address": "2-Jail Road, Lahore",
      "city": "Lahore"
    }
  },
  "doctorProfile": {
    "firstName": "Ahmed",
    "lastName": "Khan",
    "pmdcNumber": "12345-P",
    "specialty": "ER_SPECIALIST"
  }
}
```

### Included Relations

| Relation                         | Fields Returned                                |
|----------------------------------|------------------------------------------------|
| `shift`                          | Full shift object                              |
| `shift.hospitalProfile`          | `hospitalName`, `address`, `city`              |
| `doctorProfile`                  | `firstName`, `lastName`, `pmdcNumber`, `specialty` |

### Error Responses

| Status | Condition | Message |
|--------|-----------|---------|
| 404 | No timesheet for this shift | "Timesheet not found for this shift." |

---

## 11. Geo-Fencing Deep Dive

### What Is Geo-Fencing?

Geo-fencing prevents doctors from clocking in remotely. The doctor must physically be at or near the hospital to start their shift.

### How It Works

```
                    Hospital GPS
                 (from hospital profile)
                        ●
                       /|\
                      / | \
                     /  |  \
                    /   |   \
                   / 500m    \
                  /   radius  \
                 ─────────────────
                    GEO-FENCE

    Doctor GPS ◆───── 200m away ────→ ✅ ALLOWED (within 500m)
    Doctor GPS ◆───── 800m away ────→ ❌ BLOCKED (outside 500m)
```

### Backend Implementation

1. Hospital's GPS coordinates are stored in `HospitalProfile` (`latitude`, `longitude`) — set during hospital profile creation
2. Doctor sends their **current** GPS coordinates in the clock-in request body
3. Backend uses the **Haversine formula** to calculate the distance:
   ```
   distance = haversineDistance(doctorLat, doctorLng, hospitalLat, hospitalLng)
   ```
4. If `distance > 0.5 km` (500 meters), the clock-in is **rejected** with an error message telling the doctor how far away they are

### Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `GEO_FENCE_RADIUS_KM` | `0.5` | 500 meters |

### Edge Case: Hospital Has No Coordinates

If the hospital profile has `latitude = null` or `longitude = null`, the geo-fence check is **skipped** with a backend warning log. The doctor can clock in from anywhere. This is by design to avoid blocking doctors if the hospital never set their coordinates.

### Frontend Requirements

1. **Request location permission** (one-time) before attempting clock-in
2. **Get high-accuracy GPS** coordinates — use `enableHighAccuracy: true`
3. **Handle permission denied** — show a message explaining why GPS is required
4. **Show distance indicator** — calculate approximate distance client-side to give feedback before the API call

#### React Native GPS Example

```javascript
import Geolocation from '@react-native-community/geolocation';

const clockIn = async (shiftId, accessToken) => {
  // 1. Get current GPS
  const position = await new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      resolve,
      reject,
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );
  });

  // 2. Call clock-in API
  const response = await fetch(
    `${BASE_URL}/timesheet/shift/${shiftId}/clock-in`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      }),
    }
  );

  const data = await response.json();

  if (!data.success) {
    // Handle geo-fence error: "You are 800 meters away from..."
    Alert.alert('Clock-In Failed', data.message);
    return;
  }

  Alert.alert('Success', 'You have clocked in!');
};
```

---

## 12. Clock-In Time Window Rules

The backend enforces a time window around the shift start time for clock-in:

```
   ──────────────────────────── Timeline ────────────────────────────────

   │◄── Too Early ──►│◄─── Allowed Window ──►│◄── Too Late ──►│
                      │                       │
            30 min before                2 hours after
            shift start                  shift start
                      │                       │
                      ▼                       ▼
              EARLIEST CLOCK-IN        LATEST CLOCK-IN
```

### Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `CLOCK_IN_EARLY_MINUTES` | `30` | Can clock in 30 minutes before shift start |
| `CLOCK_IN_LATE_HOURS` | `2` | Can clock in up to 2 hours after shift start |

### Examples

| Shift Start Time | Earliest Clock-In | Latest Clock-In | Window |
|------------------|--------------------|-----------------|--------|
| `20:00` | `19:30` | `22:00` | 2.5 hours |
| `08:00` | `07:30` | `10:00` | 2.5 hours |
| `00:00` | `23:30 (prev day)` | `02:00` | 2.5 hours |

### Error Messages

| Condition | Error Message |
|-----------|---------------|
| Current time < earliest | "Too early to clock in. You can clock in starting 2026-03-05T19:30:00.000Z (30 minutes before shift start)." |
| Current time > latest | "Too late to clock in. The clock-in window closed at 2026-03-05T22:00:00.000Z (2 hours after shift start). Contact support if needed." |

### Frontend Tip

Show a countdown timer on the shift detail screen:
- If `now < earliestClockIn`: Show "Clock-in opens in X minutes"
- If `earliestClockIn <= now <= latestClockIn`: Show enabled "CLOCK IN" button
- If `now > latestClockIn`: Show "Clock-in window closed" (disabled button)

Calculate client-side:
```javascript
const shiftStart = new Date(shift.startTime);
const earliestClockIn = new Date(shiftStart.getTime() - 30 * 60 * 1000);
const latestClockIn = new Date(shiftStart.getTime() + 2 * 60 * 60 * 1000);
const now = new Date();

if (now < earliestClockIn) {
  // "Clock-in opens in X minutes"
  const minutesLeft = Math.ceil((earliestClockIn - now) / 60000);
} else if (now <= latestClockIn) {
  // Show CLOCK IN button
} else {
  // Clock-in window closed
}
```

---

## 13. Auto-Approve Behavior (Cron — 48 Hours)

### How It Works

A cron job runs **every hour** and checks:

> "Are there any timesheets with `status = PENDING_APPROVAL` where `clockOutTime` is more than 48 hours ago?"

If yes, the timesheet is **automatically approved** — same effect as if the hospital manually approved it.

### Flow

```
Doctor clocks out
       │
       ▼
Timesheet = PENDING_APPROVAL
       │
       │  Hospital has 48 hours to:
       │    ✅ Approve → APPROVED (manual)
       │    ❌ Dispute → DISPUTED (manual)
       │    🕐 Do nothing → ...
       │
       │  48 hours pass with no action
       │
       ▼
CRON: Auto-approve → APPROVED
       │
       ├── Ledger entries created (same as manual approve)
       └── Doctor notified (same as manual approve)
```

### Why This Exists

Protects doctors from hospitals that forget or refuse to approve timesheets. After 48 hours, the system assumes the work was done correctly.

### Frontend Impact

- Show the hospital a **countdown badge**: "48 hours to review" or "Auto-approves in X hours"
- Calculate: `autoApproveAt = clockOutTime + 48 hours`

```javascript
const clockOut = new Date(timesheet.clockOutTime);
const autoApproveAt = new Date(clockOut.getTime() + 48 * 60 * 60 * 1000);
const hoursLeft = Math.max(0, (autoApproveAt - Date.now()) / (60 * 60 * 1000));
// Show: "Auto-approves in 36 hours"
```

---

## 14. Missed Clock-In Detection (Cron — 30 Minutes)

### How It Works

A cron job runs **every 30 minutes** and checks:

> "Are there any shifts with `status = FILLED` where `endTime` has passed AND the timesheet has `clockInTime = null`?"

This means a doctor was accepted but **never showed up** — they never clocked in, and the entire shift has now passed.

### What Happens

| Action | Result |
|--------|--------|
| Shift → `EXPIRED` | Shift status changes from `FILLED` to `EXPIRED` |
| Timesheet → `DISPUTED` | Status set to `DISPUTED` |
| Dispute note set | `"Auto-flagged: Doctor did not clock in. Shift end time passed without attendance."` |

### Frontend Impact

- If a doctor has an accepted shift they never clocked into, it will eventually disappear from their active shifts and appear as a disputed timesheet
- The hospital will see this timesheet in their `DISPUTED` filter
- Admin can resolve (Guide 5)

---

## 15. Notification Events Triggered

All notification events from clock-in through approval/dispute:

### Doctor Clocks In → Notify Hospital

| Field | Value |
|-------|-------|
| **Trigger** | Doctor clocks in |
| **Recipient** | Hospital |
| **Type** | `DOCTOR_CLOCKED_IN` |
| **Title** | "Doctor Has Arrived ✅" |
| **Message** | `Dr. Ahmed Khan has clocked in for "Night Shift MO". The shift is now in progress.` |
| **Data** | `{ shiftId, timesheetId, type: "doctor_clocked_in" }` |

### Doctor Clocks Out → Notify Hospital

| Field | Value |
|-------|-------|
| **Trigger** | Doctor clocks out |
| **Recipient** | Hospital |
| **Type** | `SHIFT_COMPLETED` |
| **Title** | "Shift Completed — Review Timesheet" |
| **Message** | `Dr. Ahmed Khan has completed "Night Shift MO". Hours worked: 12.03. Pay: Rs. 18,045. Please review and approve the timesheet within 48 hours, otherwise it will be auto-approved.` |
| **Data** | `{ shiftId, timesheetId, type: "shift_completed" }` |

### Timesheet Approved → Notify Doctor

| Field | Value |
|-------|-------|
| **Trigger** | Hospital approves (or cron auto-approves) |
| **Recipient** | Doctor |
| **Type** | `TIMESHEET_APPROVED` |
| **Title** | "Timesheet Approved! 💰" |
| **Message** | `Your timesheet for "Night Shift MO" at Mayo Hospital has been approved. Amount: Rs. 18,180. Payment will be processed shortly.` |
| **Data** | `{ shiftId, timesheetId, type: "timesheet_approved" }` |

### Timesheet Disputed → Notify Doctor

| Field | Value |
|-------|-------|
| **Trigger** | Hospital disputes a timesheet |
| **Recipient** | Doctor |
| **Type** | `TIMESHEET_DISPUTED` |
| **Title** | "Timesheet Disputed ⚠️" |
| **Message** | `Your timesheet for "Night Shift MO" at Mayo Hospital has been disputed by the hospital. Reason: "Doctor left 2 hours early...". This has been escalated to the platform admin for resolution.` |
| **Data** | `{ shiftId, timesheetId, type: "timesheet_disputed" }` |

---

## 16. Complete Clock-In → Payout Flow

```
DOCTOR FLOW                                     HOSPITAL FLOW
───────────────                                 ─────────────────

1. Doctor arrives at hospital
   │
2. Open accepted shift in app
   │
3. Tap "Clock In" button
   App captures GPS automatically
   │
   POST /timesheet/shift/:shiftId/clock-in
   { latitude, longitude }
   │
   Backend checks:
   ├── Time window? ✅ (within 30min early to 2hr late)
   ├── Geo-fence? ✅ (within 500m of hospital)
   ├── Shift FILLED? ✅
   └── Not already clocked in? ✅
   │
   Shift → IN_PROGRESS                          
   │                                             Hospital gets notification
   │                                             "Dr. Ahmed has clocked in"
   │
   ═══════════════════════
   Doctor works the shift
   ═══════════════════════
   │
4. Shift ends, doctor taps "Clock Out"
   │
   POST /timesheet/shift/:shiftId/clock-out
   { latitude, longitude }
   │
   Backend calculates:
   ├── hoursWorked = 12.03
   └── finalPay = Rs. 18,045
   │
   Shift → COMPLETED
   Timesheet → PENDING_APPROVAL                  
   │                                             Hospital gets notification
   │                                             "Shift completed. Please
   │                                              review within 48 hours."
   │
   ═══════════════════════════════════════════
   Hospital reviews timesheet (within 48 hours)
   ═══════════════════════════════════════════
   │                                             │
   │                                        ┌────┴────┐
   │                                        │         │
   │                                   APPROVE    DISPUTE
   │                                        │         │
   │                              PATCH /:id/    PATCH /:id/
   │                              approve        dispute
   │                                   │         { note }
   │                                   │              │
   Timesheet → APPROVED ◄─────────┘              │
   │                                              │
   │   OR if no hospital action...                │
   │   ┌─────────────────────────────┐           │
   │   │ CRON after 48hrs           │            │
   │   │ Auto-approves timesheet   │            │
   │   └─────────────────────────────┘           │
   │                                              │
   │                              Timesheet → DISPUTED
   │                              (escalated to admin)
   │
   Doctor gets notification                       
   "Timesheet approved! Rs. 18,045"              
   │
   ═══════════════════════════════════
   ▼ CONTINUES IN GUIDE 4:           
     Ledger entries created           
     → SHIFT_PAYMENT, COMMISSION,     
       DOCTOR_NET_EARNING             
   ═══════════════════════════════════
```

---

## 17. Frontend Implementation Guide

### Doctor App — Clock-In/Out Screen

```
┌────────────────────────────────────────────┐
│ ← My Shifts                               │
│                                            │
│ Night Shift MO                             │
│ Mayo Hospital, Lahore                      │
│ 🕐 8:00 PM → 8:00 AM                       │
│ Rs. 1,500/hr · 12 hours · Rs. 18,000      │
│                                            │
│ ── Current Status ─────────────────        │
│ ✅ Status: IN_PROGRESS                      │
│ ⏰ Clocked In: 7:55 PM                     │
│ 📍 Location Verified                       │
│                                            │
│ ── Time Tracking ──────────────────        │
│ Time worked so far: 4h 32m                 │
│ Estimated pay so far: Rs. 6,800            │
│                                            │
│                                            │
│        [    CLOCK OUT    ]                 │
│                                            │
└────────────────────────────────────────────┘
```

#### Pre-Clock-In State

```
┌────────────────────────────────────────────┐
│ ── Clock-In Status ────────────────        │
│                                            │
│ 📍 Your Location: 31.5201, 74.3584         │
│ 🏥 Hospital: 31.5204, 74.3587              │
│ 📏 Distance: ~200m ✅                       │
│                                            │
│ ⏰ Clock-in window:                         │
│    Opens: 7:30 PM (in 5 minutes)           │
│    Closes: 10:00 PM                        │
│                                            │
│    [ CLOCK IN (opens in 5 min) ]           │
│    (button disabled until 7:30 PM)         │
│                                            │
└────────────────────────────────────────────┘
```

### Doctor App — My Timesheets Screen

```
┌────────────────────────────────────────────┐
│ My Timesheets                              │
│ [All | Pending | Approved | Disputed]      │
├────────────────────────────────────────────┤
│ ┌──────────────────────────────────┐       │
│ │ ✅ APPROVED                       │       │
│ │ Night Shift MO · Mayo Hospital   │       │
│ │ Mar 5, 7:55 PM → Mar 6, 8:02 AM │       │
│ │ 12.12 hrs · Rs. 18,180           │       │
│ └──────────────────────────────────┘       │
│ ┌──────────────────────────────────┐       │
│ │ ⏳ PENDING APPROVAL               │       │
│ │ Morning OPD · Services Hospital  │       │
│ │ Mar 7, 8:05 AM → 1:58 PM        │       │
│ │ 5.88 hrs · Rs. 7,056             │       │
│ │ Auto-approves in 36 hours        │       │
│ └──────────────────────────────────┘       │
│ ┌──────────────────────────────────┐       │
│ │ ⚠️ DISPUTED                       │       │
│ │ Night ICU · Children's Hospital  │       │
│ │ "Doctor left 2 hours early..."   │       │
│ │ Under admin review               │       │
│ └──────────────────────────────────┘       │
└────────────────────────────────────────────┘

API: GET /timesheet/doctor
     GET /timesheet/doctor?status=PENDING_APPROVAL
     GET /timesheet/doctor?status=APPROVED
     GET /timesheet/doctor?status=DISPUTED
```

### Hospital App — Review Timesheets Screen

```
┌────────────────────────────────────────────┐
│ Timesheets                                 │
│ [All | Pending | Approved | Disputed]      │
├────────────────────────────────────────────┤
│ ┌──────────────────────────────────┐       │
│ │ ⏳ PENDING — Action Required      │       │
│ │ Night Shift MO                   │       │
│ │ Dr. Ahmed Khan · ER Specialist   │       │
│ │ Clocked: 7:55 PM → 8:02 AM      │       │
│ │ Hours: 12.12 · Pay: Rs. 18,180  │       │
│ │ ⚠️ Auto-approves in 36 hours    │       │
│ │                                  │       │
│ │  [ APPROVE ✅ ]  [ DISPUTE ❌ ]  │       │
│ └──────────────────────────────────┘       │
│ ┌──────────────────────────────────┐       │
│ │ ✅ APPROVED                       │       │
│ │ Morning OPD Shift                │       │
│ │ Dr. Sara Ahmed · Medical Officer │       │
│ │ Hours: 5.88 · Pay: Rs. 7,056    │       │
│ └──────────────────────────────────┘       │
└────────────────────────────────────────────┘

API: GET /timesheet/hospital
     GET /timesheet/hospital?status=PENDING_APPROVAL
     PATCH /timesheet/:id/approve
     PATCH /timesheet/:id/dispute { note: "..." }
```

### Dispute Dialog (Hospital)

```
┌────────────────────────────────────────────┐
│ Dispute Timesheet                          │
│                                            │
│ You are disputing the timesheet for:       │
│ "Night Shift MO" — Dr. Ahmed Khan         │
│                                            │
│ Reason (optional):                         │
│ ┌──────────────────────────────────┐       │
│ │ Doctor left 2 hours early but    │       │
│ │ clock-out was at the correct     │       │
│ │ time.                            │       │
│ └──────────────────────────────────┘       │
│ Max 2000 characters                        │
│                                            │
│ ⚠️ This will be escalated to admin.        │
│                                            │
│  [ CANCEL ]         [ SUBMIT DISPUTE ]     │
│                                            │
└────────────────────────────────────────────┘
```

---

## Quick Reference — All Endpoints in This Guide

| Method | Endpoint                              | Role       | Description                          |
|--------|---------------------------------------|------------|--------------------------------------|
| POST   | `/timesheet/shift/:shiftId/clock-in`  | DOCTOR     | Clock in (geo-fenced + time window)  |
| POST   | `/timesheet/shift/:shiftId/clock-out` | DOCTOR     | Clock out (calculates pay)           |
| GET    | `/timesheet/doctor`                   | DOCTOR     | Get my timesheets                    |
| GET    | `/timesheet/hospital`                 | HOSPITAL   | Get hospital timesheets              |
| PATCH  | `/timesheet/:id/approve`              | HOSPITAL   | Approve a timesheet                  |
| PATCH  | `/timesheet/:id/dispute`              | HOSPITAL   | Dispute a timesheet                  |
| GET    | `/timesheet/shift/:shiftId`           | ANY VERIFIED | Get timesheet by shift             |

---

## Key Constants Reference

| Constant | Value | Description |
|----------|-------|-------------|
| Geo-fence radius | 500 meters (0.5 km) | Max distance from hospital for clock-in |
| Early clock-in | 30 minutes | Can clock in 30 min before shift start |
| Late clock-in | 2 hours | Can clock in up to 2 hrs after shift start |
| Auto-approve | 48 hours | Cron auto-approves if hospital doesn't act |
| Missed clock-in check | Every 30 minutes | Cron flags no-shows |
| Auto-approve check | Every hour | Cron checks for 48hr threshold |

---

> **Next Guide**: Guide 4 — Reviews, Ratings, Earnings & Billing (Blind review system, 10% platform commission, ledger entries, doctor wallet, hospital billing)

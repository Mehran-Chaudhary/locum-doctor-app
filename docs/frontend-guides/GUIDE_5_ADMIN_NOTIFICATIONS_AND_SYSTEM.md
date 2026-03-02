# Guide 5 — Admin Panel, Notifications & System Architecture

> **Audience**: Mobile / Frontend Engineer  
> **Backend**: NestJS v11 + Prisma v7 + PostgreSQL (Supabase)  
> **Last Updated**: March 2, 2026  

This is the **final guide** in the series. It covers:

1. Admin Panel endpoints (verification, user management, stats, disputes, revenue, reviews)
2. Complete notification system architecture (events, listeners, payload contracts)
3. Cron job reference (automated background tasks)
4. Complete API endpoint catalogue (all 5 guides)
5. Mobile integration notes (push notifications, deep links, token refresh, error handling)

---

## Table of Contents

- [1. Base URL & Auth Recap](#1-base-url--auth-recap)
- [2. Admin Panel Endpoints](#2-admin-panel-endpoints)
  - [2.1 GET /admin/verifications](#21-get-adminverifications)
  - [2.2 PATCH /admin/verify/:userId](#22-patch-adminverifyuserid)
  - [2.3 GET /admin/users](#23-get-adminusers)
  - [2.4 GET /admin/users/:userId](#24-get-adminusersuserid)
  - [2.5 PATCH /admin/suspend/:userId](#25-patch-adminsuspenduserid)
  - [2.6 PATCH /admin/unsuspend/:userId](#26-patch-adminunsuspenduserid)
  - [2.7 GET /admin/stats](#27-get-adminstats)
  - [2.8 GET /admin/shifts](#28-get-adminshifts)
  - [2.9 GET /admin/disputes](#29-get-admindisputes)
  - [2.10 PATCH /admin/disputes/:timesheetId/resolve](#210-patch-admindisputestimesheetidresolve)
  - [2.11 GET /admin/revenue](#211-get-adminrevenue)
  - [2.12 GET /admin/reviews](#212-get-adminreviews)
- [3. Notification System Architecture](#3-notification-system-architecture)
  - [3.1 Overview](#31-overview)
  - [3.2 NotificationPayload Contract](#32-notificationpayload-contract)
  - [3.3 Event Payload Classes](#33-event-payload-classes)
  - [3.4 All Notification Types](#34-all-notification-types)
- [4. Cron Jobs Reference](#4-cron-jobs-reference)
- [5. Complete API Endpoint Catalogue](#5-complete-api-endpoint-catalogue)
- [6. Mobile Integration Notes](#6-mobile-integration-notes)
  - [6.1 Push Notification Handling](#61-push-notification-handling)
  - [6.2 Deep Linking Strategy](#62-deep-linking-strategy)
  - [6.3 Token Refresh Strategy](#63-token-refresh-strategy)
  - [6.4 Error Handling](#64-error-handling)
  - [6.5 Real-Time Considerations](#65-real-time-considerations)
  - [6.6 Offline-First Guidance](#66-offline-first-guidance)

---

## 1. Base URL & Auth Recap

| Item | Value |
|------|-------|
| **Base URL** | `https://<host>/api/v1` |
| **Swagger Docs** | `https://<host>/docs` |
| **Auth Header** | `Authorization: Bearer <accessToken>` |
| **Access Token TTL** | 15 minutes |
| **Refresh Token TTL** | 7 days |

### Global Response Wrapper

Every **successful** response is wrapped by `TransformInterceptor`:

```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2025-07-11T10:30:00.000Z"
}
```

### Global Error Format

Every error is handled by `HttpExceptionFilter`:

```json
{
  "success": false,
  "statusCode": 400,
  "error": "Bad Request",
  "message": "User is already VERIFIED. Cannot change status from VERIFIED.",
  "timestamp": "2025-07-11T10:30:00.000Z",
  "path": "/api/v1/admin/verify/abc-123"
}
```

### Admin Access

All endpoints in this section require:
- Valid JWT (access token)
- User must have `role: SUPER_ADMIN`
- Protected by both `JwtAuthGuard` and `RolesGuard`

If a non-admin user calls these endpoints, they receive:

```json
{
  "success": false,
  "statusCode": 403,
  "error": "Forbidden",
  "message": "Forbidden resource",
  "timestamp": "...",
  "path": "..."
}
```

---

## 2. Admin Panel Endpoints

All endpoints are prefixed with `/api/v1/admin`.

---

### 2.1 GET /admin/verifications

**Get all pending verification requests.**

| Field | Value |
|-------|-------|
| **URL** | `GET /api/v1/admin/verifications` |
| **Auth** | Bearer Token (SUPER_ADMIN only) |
| **Query Params** | `role` (optional): `DOCTOR` or `HOSPITAL` |

#### Request Example

```
GET /api/v1/admin/verifications?role=DOCTOR
Authorization: Bearer <admin_access_token>
```

#### Success Response — `200 OK`

```json
{
  "success": true,
  "data": {
    "total": 2,
    "users": [
      {
        "id": "uuid-1",
        "email": "doctor@example.com",
        "phone": "+923001234567",
        "role": "DOCTOR",
        "status": "PENDING_VERIFICATION",
        "phoneVerified": true,
        "createdAt": "2025-07-01T10:00:00.000Z",
        "doctorProfile": {
          "id": "profile-uuid",
          "userId": "uuid-1",
          "firstName": "Ahmed",
          "lastName": "Khan",
          "pmdcNumber": "12345-P",
          "specialty": "CARDIOLOGIST",
          "yearsExperience": 5,
          "city": "Lahore",
          "latitude": 31.5204,
          "longitude": 74.3587,
          "hourlyRate": "3500.00",
          "bio": null,
          "profilePicUrl": "https://...",
          "pmdcCertUrl": "https://...",
          "averageRating": 0,
          "totalReviews": 0,
          "createdAt": "2025-07-01T10:05:00.000Z",
          "updatedAt": "2025-07-01T10:05:00.000Z"
        },
        "hospitalProfile": null
      },
      {
        "id": "uuid-2",
        "email": "hospital@example.com",
        "phone": "+923009876543",
        "role": "HOSPITAL",
        "status": "PENDING_VERIFICATION",
        "phoneVerified": true,
        "createdAt": "2025-07-02T08:00:00.000Z",
        "doctorProfile": null,
        "hospitalProfile": {
          "id": "hosp-profile-uuid",
          "userId": "uuid-2",
          "hospitalName": "City Hospital",
          "healthCommRegNumber": "HC-REG-001",
          "address": "456 Elm St",
          "city": "Karachi",
          "latitude": 24.8607,
          "longitude": 67.0011,
          "contactPersonName": "Ali Raza",
          "contactPersonPhone": "+923001112233",
          "contactPersonEmail": "ali@cityhospital.pk",
          "logoUrl": "https://...",
          "averageRating": 0,
          "totalReviews": 0,
          "createdAt": "...",
          "updatedAt": "..."
        }
      }
    ]
  },
  "timestamp": "2025-07-11T10:30:00.000Z"
}
```

#### Frontend Notes
- Users are sorted by `createdAt` ascending (oldest first — FIFO queue)
- If `role` query param is omitted, both doctors and hospitals are returned
- The `doctorProfile` or `hospitalProfile` will be populated based on the user's role
- Use this to build a **verification queue** screen with action buttons

---

### 2.2 PATCH /admin/verify/:userId

**Verify or reject a user.**

| Field | Value |
|-------|-------|
| **URL** | `PATCH /api/v1/admin/verify/:userId` |
| **Auth** | Bearer Token (SUPER_ADMIN only) |
| **URL Param** | `userId` — UUID of the user |

#### Request Body

```json
{
  "status": "VERIFIED",
  "reason": "PMDC number confirmed valid"
}
```

| Field | Type | Required | Allowed Values | Description |
|-------|------|----------|---------------|-------------|
| `status` | string | **Yes** | `VERIFIED`, `REJECTED` | New account status |
| `reason` | string | No | any string | Admin's reason for the decision |

#### Success Response — `200 OK`

```json
{
  "success": true,
  "data": {
    "message": "User verified successfully",
    "user": {
      "id": "uuid-1",
      "email": "doctor@example.com",
      "phone": "+923001234567",
      "role": "DOCTOR",
      "status": "VERIFIED"
    }
  },
  "timestamp": "..."
}
```

#### Rejection Example

```json
// Request
{
  "status": "REJECTED",
  "reason": "Invalid PMDC certificate"
}

// Response
{
  "success": true,
  "data": {
    "message": "User rejected successfully",
    "user": {
      "id": "uuid-1",
      "email": "doctor@example.com",
      "phone": "+923001234567",
      "role": "DOCTOR",
      "status": "REJECTED"
    }
  },
  "timestamp": "..."
}
```

#### Error Responses

| Status | Condition | Message |
|--------|-----------|---------|
| `404` | User not found | `"User not found"` |
| `400` | User not in PENDING_VERIFICATION | `"User is already VERIFIED. Cannot change status from VERIFIED."` |
| `400` | Doctor has no profile | `"Doctor has not completed their profile yet. Cannot verify."` |
| `400` | Hospital has no profile | `"Hospital has not completed their profile yet. Cannot verify."` |
| `400` | Invalid status value | `"Status must be VERIFIED or REJECTED"` |

#### Events Emitted

| Event Name | When |
|------------|------|
| `user.verified` | Status set to VERIFIED |
| `user.rejected` | Status set to REJECTED |

Event payload:
```json
{
  "userId": "uuid",
  "email": "doctor@example.com",
  "role": "DOCTOR",
  "status": "VERIFIED",
  "reason": "PMDC number confirmed valid"
}
```

---

### 2.3 GET /admin/users

**Get all users with pagination and filters.**

| Field | Value |
|-------|-------|
| **URL** | `GET /api/v1/admin/users` |
| **Auth** | Bearer Token (SUPER_ADMIN only) |

#### Query Parameters

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | `1` | Page number |
| `limit` | number | `20` | Items per page |
| `role` | string | — | Filter by role: `DOCTOR`, `HOSPITAL`, `SUPER_ADMIN` |
| `status` | string | — | Filter by status: `PENDING_VERIFICATION`, `VERIFIED`, `REJECTED`, `SUSPENDED` |

#### Request Example

```
GET /api/v1/admin/users?page=1&limit=10&role=DOCTOR&status=VERIFIED
```

#### Success Response — `200 OK`

```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "uuid-1",
        "email": "doctor@example.com",
        "phone": "+923001234567",
        "role": "DOCTOR",
        "status": "VERIFIED",
        "phoneVerified": true,
        "createdAt": "2025-07-01T10:00:00.000Z",
        "doctorProfile": {
          "firstName": "Ahmed",
          "lastName": "Khan",
          "pmdcNumber": "12345-P",
          "specialty": "CARDIOLOGIST",
          "city": "Lahore"
        },
        "hospitalProfile": null
      }
    ],
    "meta": {
      "total": 45,
      "page": 1,
      "limit": 10,
      "totalPages": 5
    }
  },
  "timestamp": "..."
}
```

#### Frontend Notes
- Users are sorted by `createdAt` descending (newest first)
- Hospital users have `hospitalProfile` with: `hospitalName`, `city`, `healthCommRegNumber`
- Doctor users have `doctorProfile` with: `firstName`, `lastName`, `pmdcNumber`, `specialty`, `city`
- Use the `meta` object for pagination controls

---

### 2.4 GET /admin/users/:userId

**Get detailed user information.**

| Field | Value |
|-------|-------|
| **URL** | `GET /api/v1/admin/users/:userId` |
| **Auth** | Bearer Token (SUPER_ADMIN only) |
| **URL Param** | `userId` — UUID of the user |

#### Success Response — `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "uuid-1",
    "email": "doctor@example.com",
    "phone": "+923001234567",
    "role": "DOCTOR",
    "status": "VERIFIED",
    "phoneVerified": true,
    "createdAt": "2025-07-01T10:00:00.000Z",
    "updatedAt": "2025-07-05T14:30:00.000Z",
    "doctorProfile": {
      "id": "profile-uuid",
      "userId": "uuid-1",
      "firstName": "Ahmed",
      "lastName": "Khan",
      "pmdcNumber": "12345-P",
      "specialty": "CARDIOLOGIST",
      "yearsExperience": 5,
      "city": "Lahore",
      "latitude": 31.5204,
      "longitude": 74.3587,
      "hourlyRate": "3500.00",
      "bio": null,
      "profilePicUrl": "https://...",
      "pmdcCertUrl": "https://...",
      "averageRating": 4.5,
      "totalReviews": 12,
      "createdAt": "...",
      "updatedAt": "..."
    },
    "hospitalProfile": null
  },
  "timestamp": "..."
}
```

#### Error Responses

| Status | Condition | Message |
|--------|-----------|---------|
| `404` | User not found | `"User not found"` |

#### Frontend Notes
- Returns the **full** doctor or hospital profile (all fields)
- Use this for a user detail / deep-dive screen
- Both `createdAt` and `updatedAt` are included at the user level

---

### 2.5 PATCH /admin/suspend/:userId

**Suspend a user account.**

| Field | Value |
|-------|-------|
| **URL** | `PATCH /api/v1/admin/suspend/:userId` |
| **Auth** | Bearer Token (SUPER_ADMIN only) |
| **URL Param** | `userId` — UUID of the user |
| **Body** | _None_ |

#### Success Response — `200 OK`

```json
{
  "success": true,
  "data": {
    "message": "User suspended successfully",
    "user": {
      "id": "uuid-1",
      "email": "doctor@example.com",
      "role": "DOCTOR",
      "status": "SUSPENDED"
    }
  },
  "timestamp": "..."
}
```

#### Error Responses

| Status | Condition | Message |
|--------|-----------|---------|
| `404` | User not found | `"User not found"` |
| `400` | Trying to suspend a Super Admin | `"Cannot suspend a Super Admin"` |
| `400` | Already suspended | `"User is already suspended"` |

#### Backend Side Effects
- Sets `refreshToken` to `null` (force logout)
- The suspended user's existing access token will still work until it expires (15 min max)
- `StatusGuard` on other endpoints checks `AccountStatus` and rejects `SUSPENDED` users

---

### 2.6 PATCH /admin/unsuspend/:userId

**Unsuspend a user account.**

| Field | Value |
|-------|-------|
| **URL** | `PATCH /api/v1/admin/unsuspend/:userId` |
| **Auth** | Bearer Token (SUPER_ADMIN only) |
| **URL Param** | `userId` — UUID of the user |
| **Body** | _None_ |

#### Success Response — `200 OK`

```json
{
  "success": true,
  "data": {
    "message": "User unsuspended successfully. Status restored to VERIFIED",
    "user": {
      "id": "uuid-1",
      "email": "doctor@example.com",
      "role": "DOCTOR",
      "status": "VERIFIED"
    }
  },
  "timestamp": "..."
}
```

#### Error Responses

| Status | Condition | Message |
|--------|-----------|---------|
| `404` | User not found | `"User not found"` |
| `400` | User is not suspended | `"User is not suspended"` |

#### Smart Restore Logic

The backend determines the correct restore status automatically:

| Condition | Restored Status |
|-----------|-----------------|
| User has a completed profile (DoctorProfile or HospitalProfile) | `VERIFIED` |
| User has NO profile | `PENDING_VERIFICATION` |
| User is a SUPER_ADMIN | `VERIFIED` |

---

### 2.7 GET /admin/stats

**Get platform statistics.**

| Field | Value |
|-------|-------|
| **URL** | `GET /api/v1/admin/stats` |
| **Auth** | Bearer Token (SUPER_ADMIN only) |
| **Query Params** | _None_ |

#### Success Response — `200 OK`

```json
{
  "success": true,
  "data": {
    "users": {
      "totalUsers": 150,
      "totalDoctors": 100,
      "totalHospitals": 48,
      "verifiedDoctors": 85,
      "verifiedHospitals": 40,
      "pendingVerifications": 12
    },
    "shifts": {
      "totalShifts": 500,
      "openShifts": 25,
      "filledShifts": 15,
      "completedShifts": 400,
      "expiredShifts": 60
    },
    "applications": {
      "totalApplications": 1200
    },
    "timesheets": {
      "totalTimesheets": 400,
      "pendingTimesheets": 10,
      "disputedTimesheets": 3
    },
    "financial": {
      "totalRevenue": "5000000.00",
      "totalPlatformCommission": "500000.00",
      "totalDoctorPayouts": "4500000.00",
      "pendingLedgerEntries": 5
    },
    "reviews": {
      "totalReviews": 350
    }
  },
  "timestamp": "..."
}
```

#### Data Types

| Financial Field | Type | Note |
|----------------|------|------|
| `totalRevenue` | string | Sum of all SHIFT_PAYMENT ledger entries (stringified Decimal) |
| `totalPlatformCommission` | string | Sum of all PLATFORM_COMMISSION ledger entries |
| `totalDoctorPayouts` | string | Sum of all DOCTOR_NET_EARNING ledger entries |
| `pendingLedgerEntries` | number | Count of ledger entries with status `PENDING_CLEARANCE` |

#### Frontend Notes
- All financial values are **strings** (Prisma Decimal → `.toString()`)
- Returns `"0.00"` when no data exists (never `null`)
- This is the main dashboard endpoint — build summary cards from each section
- The 15 database queries are executed in parallel using `Promise.all` for performance

---

### 2.8 GET /admin/shifts

**Get all shifts with pagination (Admin overview).**

| Field | Value |
|-------|-------|
| **URL** | `GET /api/v1/admin/shifts` |
| **Auth** | Bearer Token (SUPER_ADMIN only) |

#### Query Parameters

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | `1` | Page number |
| `limit` | number | `20` | Items per page |
| `status` | string | — | Filter by shift status: `OPEN`, `FILLED`, `IN_PROGRESS`, `COMPLETED`, `EXPIRED`, `CANCELLED` |

#### Request Example

```
GET /api/v1/admin/shifts?page=1&limit=10&status=OPEN
```

#### Success Response — `200 OK`

```json
{
  "success": true,
  "data": {
    "shifts": [
      {
        "id": "shift-uuid",
        "hospitalProfileId": "hosp-profile-uuid",
        "title": "Night Shift ER",
        "department": "EMERGENCY",
        "requiredSpecialty": "ER_SPECIALIST",
        "description": "Busy ER night shift",
        "startTime": "2025-07-15T20:00:00.000Z",
        "endTime": "2025-07-16T08:00:00.000Z",
        "hourlyRate": "3500.00",
        "urgency": "URGENT",
        "status": "OPEN",
        "createdAt": "2025-07-10T09:00:00.000Z",
        "updatedAt": "2025-07-10T09:00:00.000Z",
        "hospitalProfile": {
          "hospitalName": "City Hospital",
          "city": "Karachi"
        },
        "_count": {
          "applications": 5
        }
      }
    ],
    "meta": {
      "total": 120,
      "page": 1,
      "limit": 10,
      "totalPages": 12
    }
  },
  "timestamp": "..."
}
```

#### Frontend Notes
- Shifts are sorted by `createdAt` descending (newest first)
- Each shift includes the hospital name/city and the application count
- Use `_count.applications` to show how many doctors have applied

---

### 2.9 GET /admin/disputes

**Get all disputed timesheets for admin review.**

| Field | Value |
|-------|-------|
| **URL** | `GET /api/v1/admin/disputes` |
| **Auth** | Bearer Token (SUPER_ADMIN only) |
| **Query Params** | _None_ |

#### Success Response — `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "timesheet-uuid",
      "shiftId": "shift-uuid",
      "doctorProfileId": "doc-profile-uuid",
      "hospitalProfileId": "hosp-profile-uuid",
      "clockInTime": "2025-07-15T20:05:00.000Z",
      "clockOutTime": "2025-07-16T07:55:00.000Z",
      "clockInLat": 24.8607,
      "clockInLng": 67.0011,
      "clockOutLat": 24.8607,
      "clockOutLng": 67.0011,
      "hoursWorked": "11.83",
      "finalCalculatedPay": "41405.00",
      "status": "DISPUTED",
      "disputeNote": "Doctor arrived 30 minutes late",
      "resolvedAt": null,
      "createdAt": "2025-07-15T20:05:00.000Z",
      "updatedAt": "2025-07-16T09:00:00.000Z",
      "shift": {
        "title": "Night Shift ER",
        "department": "EMERGENCY",
        "startTime": "2025-07-15T20:00:00.000Z",
        "endTime": "2025-07-16T08:00:00.000Z",
        "hourlyRate": "3500.00"
      },
      "doctorProfile": {
        "firstName": "Ahmed",
        "lastName": "Khan",
        "pmdcNumber": "12345-P",
        "userId": "doctor-user-uuid"
      },
      "hospitalProfile": {
        "hospitalName": "City Hospital",
        "userId": "hospital-user-uuid"
      }
    }
  ],
  "timestamp": "..."
}
```

#### Frontend Notes
- Sorted by `updatedAt` ascending (oldest disputes at the top — needs attention first)
- Returns an array (not paginated) — disputes should be relatively rare
- Each dispute includes the shift details, doctor info, and hospital info
- `disputeNote` contains the hospital's reason for disputing (or auto-generated for no-shows)
- `resolvedAt` will be `null` for unresolved disputes

---

### 2.10 PATCH /admin/disputes/:timesheetId/resolve

**Resolve a disputed timesheet. Admin can override clock times and force approval.**

| Field | Value |
|-------|-------|
| **URL** | `PATCH /api/v1/admin/disputes/:timesheetId/resolve` |
| **Auth** | Bearer Token (SUPER_ADMIN only) |
| **URL Param** | `timesheetId` — UUID of the disputed timesheet |

#### Request Body

```json
{
  "action": "APPROVE",
  "overrideClockIn": null,
  "overrideClockOut": null
}
```

| Field | Type | Required | Allowed Values | Description |
|-------|------|----------|---------------|-------------|
| `action` | string | **Yes** | `APPROVE`, `RESOLVE` | `APPROVE` = accept as-is; `RESOLVE` = override clock times |
| `overrideClockIn` | string (ISO 8601) | No | ISO datetime | New clock-in time. Only used with `RESOLVE` |
| `overrideClockOut` | string (ISO 8601) | No | ISO datetime | New clock-out time. Only used with `RESOLVE` |

#### Action: APPROVE (Accept As-Is)

```json
// Request
{
  "action": "APPROVE"
}

// Response 200 OK
{
  "success": true,
  "data": {
    "message": "Timesheet dispute approved by admin.",
    "timesheet": {
      "id": "timesheet-uuid",
      "status": "APPROVED",
      "resolvedAt": "2025-07-11T12:00:00.000Z",
      "clockInTime": "2025-07-15T20:05:00.000Z",
      "clockOutTime": "2025-07-16T07:55:00.000Z",
      "hoursWorked": "11.83",
      "finalCalculatedPay": "41405.00",
      "..."
    }
  },
  "timestamp": "..."
}
```

#### Action: RESOLVE (Override Clock Times)

```json
// Request
{
  "action": "RESOLVE",
  "overrideClockIn": "2025-07-15T20:30:00.000Z",
  "overrideClockOut": "2025-07-16T07:55:00.000Z"
}

// Response 200 OK
{
  "success": true,
  "data": {
    "message": "Timesheet dispute resolved by admin.",
    "timesheet": {
      "id": "timesheet-uuid",
      "status": "RESOLVED",
      "resolvedAt": "2025-07-11T12:00:00.000Z",
      "clockInTime": "2025-07-15T20:30:00.000Z",
      "clockOutTime": "2025-07-16T07:55:00.000Z",
      "hoursWorked": "11.42",
      "finalCalculatedPay": "39970.00",
      "..."
    }
  },
  "timestamp": "..."
}
```

#### Error Responses

| Status | Condition | Message |
|--------|-----------|---------|
| `404` | Timesheet not found | `"Timesheet not found."` |
| `400` | Timesheet not disputed | `"Timesheet is not in DISPUTED status. Current status: APPROVED"` |

#### Backend Logic
1. If `action = APPROVE`: Sets status to `APPROVED`, records `resolvedAt`
2. If `action = RESOLVE`: Sets status to `RESOLVED`, overrides clock-in/out times, **recalculates** `hoursWorked` and `finalCalculatedPay` using the overridden times and the shift's `hourlyRate`
3. Pay formula: `hoursWorked = (clockOut - clockIn) / 3600000`, `finalCalculatedPay = hoursWorked × hourlyRate`

#### Frontend Notes
- Build a resolution form with two options: "Approve As-Is" and "Resolve with Override"
- When "Resolve with Override" is selected, show datetime pickers for clock-in/out
- Show the current clock times and the shift's scheduled times side-by-side for comparison

---

### 2.11 GET /admin/revenue

**Get monthly revenue analytics (last 12 months).**

| Field | Value |
|-------|-------|
| **URL** | `GET /api/v1/admin/revenue` |
| **Auth** | Bearer Token (SUPER_ADMIN only) |
| **Query Params** | _None_ |

#### Success Response — `200 OK`

```json
{
  "success": true,
  "data": {
    "revenueByMonth": [
      {
        "month": "2024-08",
        "shiftPayments": "250000.00",
        "platformCommission": "25000.00",
        "doctorPayouts": "225000.00"
      },
      {
        "month": "2024-09",
        "shiftPayments": "320000.00",
        "platformCommission": "32000.00",
        "doctorPayouts": "288000.00"
      },
      {
        "month": "2024-10",
        "shiftPayments": "0.00",
        "platformCommission": "0.00",
        "doctorPayouts": "0.00"
      }
    ]
  },
  "timestamp": "..."
}
```

#### Data Structure

| Field | Type | Description |
|-------|------|-------------|
| `month` | string | Year-month in `YYYY-MM` format |
| `shiftPayments` | string | Total gross shift payments (SHIFT_PAYMENT ledger entries) |
| `platformCommission` | string | Platform's 10% commission (PLATFORM_COMMISSION entries) |
| `doctorPayouts` | string | Net doctor earnings — 90% of shift payment (DOCTOR_NET_EARNING entries) |

#### Frontend Notes
- Always returns exactly **12 months** of data (current month going back 11 months)
- Months with no activity return `"0.00"` for all three fields (never `null`)
- All values are **strings** (Prisma Decimal → `.toString()`)
- Great for building a **bar chart** or **line chart** on the admin dashboard
- The financial split is: Hospital pays 100% → Platform takes 10% → Doctor receives 90%

---

### 2.12 GET /admin/reviews

**Get all reviews across the platform (Admin moderation view).**

| Field | Value |
|-------|-------|
| **URL** | `GET /api/v1/admin/reviews` |
| **Auth** | Bearer Token (SUPER_ADMIN only) |

#### Query Parameters

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | `1` | Page number |
| `limit` | number | `20` | Items per page |

#### Success Response — `200 OK`

```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "id": "review-uuid",
        "timesheetId": "timesheet-uuid",
        "reviewerType": "HOSPITAL_REVIEWING_DOCTOR",
        "reviewerProfileId": "hosp-profile-uuid",
        "revieweeProfileId": "doc-profile-uuid",
        "rating": 5,
        "comment": "Excellent doctor, very professional",
        "isVisible": true,
        "createdAt": "2025-07-10T09:00:00.000Z",
        "updatedAt": "2025-07-10T09:00:00.000Z",
        "timesheet": {
          "shift": {
            "title": "Night Shift ER"
          },
          "doctorProfile": {
            "firstName": "Ahmed",
            "lastName": "Khan",
            "pmdcNumber": "12345-P"
          },
          "hospitalProfile": {
            "hospitalName": "City Hospital"
          }
        }
      }
    ],
    "meta": {
      "total": 350,
      "page": 1,
      "limit": 20,
      "totalPages": 18
    }
  },
  "timestamp": "..."
}
```

#### Frontend Notes
- Reviews sorted by `createdAt` descending (newest first)
- Each review includes the shift title, doctor name, and hospital name via the timesheet relation
- `isVisible` indicates whether the review has been revealed (blind review system)
- `reviewerType` is `HOSPITAL_REVIEWING_DOCTOR` or `DOCTOR_REVIEWING_HOSPITAL`
- Each review has a single `rating` (1–5) and optional `comment` (max 2000 chars)

---

## 3. Notification System Architecture

### 3.1 Overview

The backend uses an **event-driven architecture** powered by NestJS `EventEmitter2`. Business logic emits events, and dedicated listener classes handle notification delivery asynchronously.

```
┌────────────────────┐     emit()      ┌──────────────────────────┐
│  Business Logic    │ ──────────────▶ │  EventEmitter2           │
│  (Services)        │                 │  (NestJS Event Bus)      │
└────────────────────┘                 └──────────┬───────────────┘
                                                  │
                                    @OnEvent()    │
                           ┌──────────────────────┼──────────────────────┐
                           ▼                      ▼                      ▼
              ┌─────────────────────┐ ┌─────────────────────┐ ┌──────────────────┐
              │ ShiftNotification   │ │ TimesheetNotification│ │ LedgerNotification│
              │ Listener            │ │ Listener             │ │ Listener          │
              └─────────┬───────────┘ └─────────┬───────────┘ └──────────┬───────┘
                        │                       │                         │
                        ▼                       ▼                         ▼
              ┌─────────────────────┐ ┌─────────────────────┐ ┌──────────────────┐
              │ NotificationService │ │ NotificationService │ │ EarningsService  │
              │ .sendNotification() │ │ .sendNotification() │ │ .createLedger()  │
              └─────────────────────┘ └─────────────────────┘ └──────────────────┘
```

**Listener Summary:**

| Listener | Events Handled | Purpose |
|----------|---------------|---------|
| `ShiftNotificationListener` | `shift.created`, `application.accepted`, `application.others-rejected`, `shift.cancelled` | Shift marketplace notifications |
| `TimesheetNotificationListener` | `application.created`, `timesheet.clock-in`, `timesheet.clock-out`, `timesheet.approved`, `timesheet.disputed` | Timesheet lifecycle notifications |
| `LedgerNotificationListener` | `timesheet.approved` | Creates financial ledger entries (not a "notification" per se) |

### 3.2 NotificationPayload Contract

Every notification sent through `NotificationService.sendNotification()` follows this exact interface:

```typescript
interface NotificationPayload {
  recipientUserId: string;       // UUID of the user receiving the notification
  recipientPhone: string;        // Phone number for SMS delivery
  recipientEmail?: string | null; // Email for email delivery (optional)
  type: string;                  // Notification type identifier
  title: string;                 // Notification title (push notification title)
  message: string;               // Full notification message body
  data?: Record<string, any>;   // Extra data payload for deep linking
}
```

**Current Implementation**: In development, all notifications are **logged to console** only. The service is designed as a single entry point so that integrating real providers (Firebase FCM, Twilio SMS, SendGrid email) requires changes in only one place.

**Production Integration Points** (TODO in codebase):
- **Push Notifications**: Firebase Cloud Messaging (FCM)
- **SMS**: Twilio or local Pakistani SMS gateway
- **Email**: SendGrid or Nodemailer

### 3.3 Event Payload Classes

All event payload classes are defined in `src/notification/events/shift.events.ts`.

#### Phase 2 Events

**ShiftCreatedEvent**
```typescript
{
  shiftId: string;
  hospitalProfileId: string;
  hospitalName: string;
  hospitalLat: number | null;
  hospitalLng: number | null;
  requiredSpecialty: Specialty;      // enum
  urgency: ShiftUrgency;            // "NORMAL" | "URGENT"
  title: string;
  startTime: Date;
  endTime: Date;
  hourlyRate: string;
}
```

**ApplicationAcceptedEvent**
```typescript
{
  applicationId: string;
  shiftId: string;
  shiftTitle: string;
  acceptedDoctorProfileId: string;
  acceptedDoctorName: string;
  hospitalName: string;
  startTime: Date;
  endTime: Date;
}
```

**ApplicationOthersRejectedEvent**
```typescript
{
  shiftId: string;
  shiftTitle: string;
  acceptedApplicationId: string;
}
```

**ShiftCancelledEvent**
```typescript
{
  shiftId: string;
  hospitalProfileId: string;
}
```

#### Phase 3 Events

**ApplicationCreatedEvent**
```typescript
{
  applicationId: string;
  shiftId: string;
  doctorProfileId: string;
  doctorName: string;
}
```

**TimesheetClockInEvent**
```typescript
{
  timesheetId: string;
  shiftId: string;
  doctorProfileId: string;
}
```

**TimesheetClockOutEvent**
```typescript
{
  timesheetId: string;
  shiftId: string;
  doctorProfileId: string;
  hoursWorked: number;
  finalCalculatedPay: string;
}
```

**TimesheetApprovedEvent**
```typescript
{
  timesheetId: string;
  shiftId: string;
  doctorProfileId: string;
  hospitalProfileId: string;
  finalCalculatedPay: string | null;
}
```

**TimesheetDisputedEvent**
```typescript
{
  timesheetId: string;
  shiftId: string;
  doctorProfileId: string;
  hospitalProfileId: string;
  disputeNote: string | undefined;
}
```

### 3.4 All Notification Types

Here is the **complete list** of every notification the backend sends, with exact type codes, titles, messages, and data payloads.

---

#### 1. `URGENT_SHIFT` — Urgent Shift Available Near Doctor

| Field | Value |
|-------|-------|
| **Trigger** | `shift.created` event (only when `urgency = URGENT`) |
| **Recipient** | All VERIFIED doctors matching `requiredSpecialty` within 20km radius |
| **Type** | `URGENT_SHIFT` |
| **Title** | `🚨 Urgent Shift Available Near You!` |
| **Message** | `Urgent shift "{title}" at {hospitalName} ({distance}km away). Rate: Rs. {hourlyRate}/hr. Time: {startTime} — {endTime}. Open the app to apply now!` |
| **Data** | `{ shiftId: string, type: "urgent_shift" }` |

**Filtering Logic:**
1. Find all doctor profiles where `specialty` matches the shift's `requiredSpecialty`
2. Doctor must be `VERIFIED` status
3. Doctor must have `latitude` and `longitude` set
4. Apply Haversine distance filter: must be within **20km** of the hospital

> **Important**: `NORMAL` urgency shifts do NOT trigger proactive notifications. Doctors discover them through the feed.

---

#### 2. `APPLICATION_ACCEPTED` — Doctor's Application Accepted

| Field | Value |
|-------|-------|
| **Trigger** | `application.accepted` event |
| **Recipient** | The accepted doctor |
| **Type** | `APPLICATION_ACCEPTED` |
| **Title** | `Shift Confirmed! ✅` |
| **Message** | `Your application for "{shiftTitle}" at {hospitalName} has been accepted! Shift time: {startTime} — {endTime}. Don't forget to clock in when you arrive.` |
| **Data** | `{ shiftId: string, type: "application_accepted" }` |

---

#### 3. `APPLICATION_REJECTED` — Other Applications Rejected

| Field | Value |
|-------|-------|
| **Trigger** | `application.others-rejected` event |
| **Recipient** | All doctors whose applications were rejected for this shift |
| **Type** | `APPLICATION_REJECTED` |
| **Title** | `Shift Update` |
| **Message** | `The shift "{shiftTitle}" has been filled by another doctor. Keep checking the feed for more opportunities!` |
| **Data** | `{ shiftId: string, type: "application_rejected" }` |

---

#### 4. `SHIFT_CANCELLED` — Shift Cancelled by Hospital

| Field | Value |
|-------|-------|
| **Trigger** | `shift.cancelled` event |
| **Recipient** | All doctors who had applied to the shift |
| **Type** | `SHIFT_CANCELLED` |
| **Title** | `Shift Cancelled` |
| **Message** | `The shift "{shiftTitle}" has been cancelled by the hospital.` |
| **Data** | `{ shiftId: string, type: "shift_cancelled" }` |

---

#### 5. `NEW_APPLICATION` — New Doctor Application for Shift

| Field | Value |
|-------|-------|
| **Trigger** | `application.created` event |
| **Recipient** | The hospital that owns the shift |
| **Type** | `NEW_APPLICATION` |
| **Title** | `New Applicant for Your Shift` |
| **Message** | `Dr. {doctorName} has applied for "{shiftTitle}". You now have {applicationCount} applicant(s). Review and accept a doctor from the applicants list.` |
| **Data** | `{ shiftId: string, applicationId: string, type: "new_application" }` |

---

#### 6. `DOCTOR_CLOCKED_IN` — Doctor Arrived at Hospital

| Field | Value |
|-------|-------|
| **Trigger** | `timesheet.clock-in` event |
| **Recipient** | The hospital |
| **Type** | `DOCTOR_CLOCKED_IN` |
| **Title** | `Doctor Has Arrived ✅` |
| **Message** | `Dr. {doctorName} has clocked in for "{shiftTitle}". The shift is now in progress.` |
| **Data** | `{ shiftId: string, timesheetId: string, type: "doctor_clocked_in" }` |

---

#### 7. `SHIFT_COMPLETED` — Doctor Clocked Out, Review Timesheet

| Field | Value |
|-------|-------|
| **Trigger** | `timesheet.clock-out` event |
| **Recipient** | The hospital |
| **Type** | `SHIFT_COMPLETED` |
| **Title** | `Shift Completed — Review Timesheet` |
| **Message** | `Dr. {doctorName} has completed "{shiftTitle}". Hours worked: {hoursWorked}. Pay: Rs. {finalCalculatedPay}. Please review and approve the timesheet within 48 hours, otherwise it will be auto-approved.` |
| **Data** | `{ shiftId: string, timesheetId: string, type: "shift_completed" }` |

---

#### 8. `TIMESHEET_APPROVED` — Timesheet/Payment Approved

| Field | Value |
|-------|-------|
| **Trigger** | `timesheet.approved` event |
| **Recipient** | The doctor |
| **Type** | `TIMESHEET_APPROVED` |
| **Title** | `Timesheet Approved! 💰` |
| **Message** | `Your timesheet for "{shiftTitle}" at {hospitalName} has been approved. Amount: Rs. {finalCalculatedPay}. Payment will be processed shortly.` |
| **Data** | `{ shiftId: string, timesheetId: string, type: "timesheet_approved" }` |

---

#### 9. `TIMESHEET_DISPUTED` — Timesheet Disputed by Hospital

| Field | Value |
|-------|-------|
| **Trigger** | `timesheet.disputed` event |
| **Recipient** | The doctor |
| **Type** | `TIMESHEET_DISPUTED` |
| **Title** | `Timesheet Disputed ⚠️` |
| **Message** | `Your timesheet for "{shiftTitle}" at {hospitalName} has been disputed by the hospital. Reason: "{disputeNote}". This has been escalated to the platform admin for resolution.` |
| **Data** | `{ shiftId: string, timesheetId: string, type: "timesheet_disputed" }` |

---

#### Notification Type Summary Table

| # | Type Code | Recipient | Trigger Event |
|---|-----------|-----------|---------------|
| 1 | `URGENT_SHIFT` | Matching nearby doctors | `shift.created` (URGENT only) |
| 2 | `APPLICATION_ACCEPTED` | Accepted doctor | `application.accepted` |
| 3 | `APPLICATION_REJECTED` | Rejected doctors | `application.others-rejected` |
| 4 | `SHIFT_CANCELLED` | All applicant doctors | `shift.cancelled` |
| 5 | `NEW_APPLICATION` | Hospital owner | `application.created` |
| 6 | `DOCTOR_CLOCKED_IN` | Hospital | `timesheet.clock-in` |
| 7 | `SHIFT_COMPLETED` | Hospital | `timesheet.clock-out` |
| 8 | `TIMESHEET_APPROVED` | Doctor | `timesheet.approved` |
| 9 | `TIMESHEET_DISPUTED` | Doctor | `timesheet.disputed` |

#### Additional Events (Not Notifications)

| Event | Listener | Action |
|-------|----------|--------|
| `timesheet.approved` | `LedgerNotificationListener` | Creates 3 ledger entries (SHIFT_PAYMENT, PLATFORM_COMMISSION, DOCTOR_NET_EARNING) |
| `user.verified` | *(No listener yet)* | Emitted by admin verify endpoint — can be used for welcome notification |
| `user.rejected` | *(No listener yet)* | Emitted by admin reject endpoint — can be used for rejection notification |

---

## 4. Cron Jobs Reference

The backend runs 4 scheduled cron jobs for lifecycle management:

### 4.1 Shift Auto-Expiry

| Setting | Value |
|---------|-------|
| **Schedule** | Every 10 minutes |
| **Logic** | Find all `OPEN` shifts where `startTime ≤ now` → set status to `EXPIRED` |
| **Side Effect** | All `APPLIED` applications for expired shifts → set to `REJECTED` |

**Mobile Impact**: If a doctor is viewing an OPEN shift that gets expired between refreshes, the next API call will show it as EXPIRED. Always check shift status before allowing actions.

### 4.2 Timesheet Auto-Approve

| Setting | Value |
|---------|-------|
| **Schedule** | Every hour |
| **Threshold** | 48 hours after clock-out |
| **Logic** | Find all `PENDING_APPROVAL` timesheets where `clockOutTime` is ≤ 48 hours ago → set status to `APPROVED` |
| **Events Emitted** | `timesheet.approved` for each (triggers ledger creation + doctor notification) |

**Mobile Impact**: Hospitals see a countdown/deadline on pending timesheets. After 48 hours, the timesheet silently auto-approves and the doctor receives a notification.

### 4.3 Missed Clock-In Detection

| Setting | Value |
|---------|-------|
| **Schedule** | Every 30 minutes |
| **Logic** | Find all `FILLED` shifts where `endTime ≤ now` AND timesheet has no `clockInTime` |
| **Action** | Shift → `EXPIRED`, Timesheet → `DISPUTED` with note: `"Auto-flagged: Doctor did not clock in. Shift end time passed without attendance."` |

**Mobile Impact**: If a doctor was supposed to work a shift but never clocked in, the shift expires and a dispute is auto-created. Admin must resolve it.

### 4.4 Blind Review Auto-Reveal

| Setting | Value |
|---------|-------|
| **Schedule** | Every hour |
| **Threshold** | 7 days after review creation |
| **Logic** | Find all reviews where `isVisible = false` AND `createdAt ≤ 7 days ago` → set `isVisible = true` |

**Mobile Impact**: Reviews submitted by only one party remain hidden for up to 7 days (or until the other party also submits). After 7 days, they auto-reveal. The mobile app should show "Review submitted — visible after the other party reviews or in X days."

---

## 5. Complete API Endpoint Catalogue

### Authentication (Guide 1)

| # | Method | Endpoint | Auth | Role |
|---|--------|----------|------|------|
| 1 | POST | `/api/v1/auth/register` | No | — |
| 2 | POST | `/api/v1/auth/login` | No | — |
| 3 | POST | `/api/v1/auth/verify-otp` | Yes | Any |
| 4 | POST | `/api/v1/auth/resend-otp` | Yes | Any |
| 5 | POST | `/api/v1/auth/refresh` | No | — |
| 6 | POST | `/api/v1/auth/logout` | Yes | Any |
| 7 | GET | `/api/v1/auth/me` | Yes | Any |
| 8 | POST | `/api/v1/auth/forgot-password` | No | — |
| 9 | POST | `/api/v1/auth/reset-password` | No | — |

### Profiles (Guide 1)

| # | Method | Endpoint | Auth | Role |
|---|--------|----------|------|------|
| 10 | POST | `/api/v1/doctor/profile` | Yes | DOCTOR |
| 11 | GET | `/api/v1/doctor/profile` | Yes | DOCTOR |
| 12 | PATCH | `/api/v1/doctor/profile` | Yes | DOCTOR |
| 13 | POST | `/api/v1/hospital/profile` | Yes | HOSPITAL |
| 14 | GET | `/api/v1/hospital/profile` | Yes | HOSPITAL |
| 15 | PATCH | `/api/v1/hospital/profile` | Yes | HOSPITAL |

### File Upload (Guide 1)

| # | Method | Endpoint | Auth | Role |
|---|--------|----------|------|------|
| 16 | POST | `/api/v1/upload/:type` | Yes | Any |

### Shifts (Guide 2)

| # | Method | Endpoint | Auth | Role |
|---|--------|----------|------|------|
| 17 | POST | `/api/v1/shift` | Yes | HOSPITAL |
| 18 | GET | `/api/v1/shift/hospital` | Yes | HOSPITAL |
| 19 | GET | `/api/v1/shift/feed` | Yes | DOCTOR |
| 20 | GET | `/api/v1/shift/:id` | Yes | Any |
| 21 | PATCH | `/api/v1/shift/:id/cancel` | Yes | HOSPITAL |

### Applications (Guide 2)

| # | Method | Endpoint | Auth | Role |
|---|--------|----------|------|------|
| 22 | POST | `/api/v1/application/apply` | Yes | DOCTOR |
| 23 | GET | `/api/v1/application/my` | Yes | DOCTOR |
| 24 | PATCH | `/api/v1/application/:id/withdraw` | Yes | DOCTOR |
| 25 | GET | `/api/v1/application/shift/:shiftId/applicants` | Yes | HOSPITAL |
| 26 | PATCH | `/api/v1/application/:id/accept` | Yes | HOSPITAL |

### Timesheets (Guide 3)

| # | Method | Endpoint | Auth | Role |
|---|--------|----------|------|------|
| 27 | POST | `/api/v1/timesheet/shift/:shiftId/clock-in` | Yes | DOCTOR |
| 28 | POST | `/api/v1/timesheet/shift/:shiftId/clock-out` | Yes | DOCTOR |
| 29 | GET | `/api/v1/timesheet/doctor` | Yes | DOCTOR |
| 30 | GET | `/api/v1/timesheet/hospital` | Yes | HOSPITAL |
| 31 | PATCH | `/api/v1/timesheet/:id/approve` | Yes | HOSPITAL |
| 32 | PATCH | `/api/v1/timesheet/:id/dispute` | Yes | HOSPITAL |
| 33 | GET | `/api/v1/timesheet/shift/:shiftId` | Yes | HOSPITAL |

### Reviews (Guide 4)

| # | Method | Endpoint | Auth | Role |
|---|--------|----------|------|------|
| 34 | POST | `/api/v1/review/timesheet/:timesheetId/hospital-reviews-doctor` | Yes | HOSPITAL |
| 35 | POST | `/api/v1/review/timesheet/:timesheetId/doctor-reviews-hospital` | Yes | DOCTOR |
| 36 | GET | `/api/v1/review/doctor/:doctorProfileId` | Yes | Any |
| 37 | GET | `/api/v1/review/hospital/:hospitalProfileId` | Yes | Any |
| 38 | GET | `/api/v1/review/timesheet/:timesheetId/mine` | Yes | Any |

### Earnings (Guide 4)

| # | Method | Endpoint | Auth | Role |
|---|--------|----------|------|------|
| 39 | GET | `/api/v1/earnings/doctor` | Yes | DOCTOR |
| 40 | GET | `/api/v1/billing/hospital` | Yes | HOSPITAL |

### Admin Panel (Guide 5 — this guide)

| # | Method | Endpoint | Auth | Role |
|---|--------|----------|------|------|
| 41 | GET | `/api/v1/admin/verifications` | Yes | SUPER_ADMIN |
| 42 | PATCH | `/api/v1/admin/verify/:userId` | Yes | SUPER_ADMIN |
| 43 | GET | `/api/v1/admin/users` | Yes | SUPER_ADMIN |
| 44 | GET | `/api/v1/admin/users/:userId` | Yes | SUPER_ADMIN |
| 45 | PATCH | `/api/v1/admin/suspend/:userId` | Yes | SUPER_ADMIN |
| 46 | PATCH | `/api/v1/admin/unsuspend/:userId` | Yes | SUPER_ADMIN |
| 47 | GET | `/api/v1/admin/stats` | Yes | SUPER_ADMIN |
| 48 | GET | `/api/v1/admin/shifts` | Yes | SUPER_ADMIN |
| 49 | GET | `/api/v1/admin/disputes` | Yes | SUPER_ADMIN |
| 50 | PATCH | `/api/v1/admin/disputes/:timesheetId/resolve` | Yes | SUPER_ADMIN |
| 51 | GET | `/api/v1/admin/revenue` | Yes | SUPER_ADMIN |
| 52 | GET | `/api/v1/admin/reviews` | Yes | SUPER_ADMIN |

**Total: 52 endpoints**

---

## 6. Mobile Integration Notes

### 6.1 Push Notification Handling

The backend is architected to send notifications through `NotificationService`. Currently it logs to console (dev mode). When Firebase FCM is integrated, the mobile app should:

1. **Register FCM Token**: After login, send the device's FCM token to the backend (an endpoint will be added for this)
2. **Handle Foreground Notifications**: Show an in-app banner/toast
3. **Handle Background Notifications**: Show a system push notification
4. **Handle Notification Tap**: Parse the `data` payload and navigate to the correct screen

#### Notification `data` Payload — Deep Link Mapping

| `data.type` | Navigate To | Params |
|-------------|-------------|--------|
| `urgent_shift` | Shift Detail Screen | `shiftId` |
| `application_accepted` | Shift Detail Screen (or My Shifts) | `shiftId` |
| `application_rejected` | Shift Feed Screen | `shiftId` |
| `shift_cancelled` | Shift Feed Screen | `shiftId` |
| `new_application` | Shift Applicants Screen | `shiftId`, `applicationId` |
| `doctor_clocked_in` | Timesheet Detail Screen | `shiftId`, `timesheetId` |
| `shift_completed` | Timesheet Review Screen | `shiftId`, `timesheetId` |
| `timesheet_approved` | Earnings/Wallet Screen | `shiftId`, `timesheetId` |
| `timesheet_disputed` | Dispute Detail Screen | `shiftId`, `timesheetId` |

### 6.2 Deep Linking Strategy

Suggested URL scheme for deep links:

```
locum://shift/{shiftId}
locum://timesheet/{timesheetId}
locum://applications/{shiftId}
locum://wallet
locum://disputes/{timesheetId}
```

### 6.3 Token Refresh Strategy

```
┌─────────────────────────────────────────────────┐
│  API Request with Access Token                   │
│                                                  │
│  ┌───── 200 OK ──────▶ Process response         │
│  │                                               │
│  ├───── 401 Unauthorized ──────────────────────┐│
│  │  │                                           ││
│  │  │  Is this the refresh endpoint?            ││
│  │  │  ├── YES → Force logout (refresh expired) ││
│  │  │  └── NO → Call POST /auth/refresh         ││
│  │  │            ├── 200 → Save new tokens,     ││
│  │  │            │         retry original request││
│  │  │            └── 401 → Force logout          ││
│  │                                               │
│  ├───── 403 Forbidden ──────▶ Show "Access       │
│  │                            Denied" screen     │
│  │                                               │
│  └───── Other errors ──────▶ Handle by type      │
└─────────────────────────────────────────────────┘
```

**Key Implementation Details:**
- Store `accessToken` and `refreshToken` securely (Keychain / Secure Storage)
- Access token expires in **15 minutes** — always be ready to refresh
- Refresh token expires in **7 days** — after that, user must re-login
- Use an HTTP interceptor to automatically catch 401s and refresh
- **Queue concurrent requests** during refresh to avoid multiple refresh calls
- After suspend: the user's `refreshToken` is nullified server-side, so the next refresh will fail with 401 → force logout

### 6.4 Error Handling

#### Global Error Response Format

```json
{
  "success": false,
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Human-readable error message",
  "timestamp": "2025-07-11T10:30:00.000Z",
  "path": "/api/v1/some/endpoint"
}
```

#### Error Status Code Reference

| Code | Meaning | Mobile Action |
|------|---------|--------------|
| `400` | Bad Request (validation error, business rule violation) | Show `message` to user |
| `401` | Unauthorized (token expired/invalid) | Trigger token refresh flow |
| `403` | Forbidden (wrong role / account suspended) | Show access denied / check account status |
| `404` | Not Found | Show "not found" message |
| `409` | Conflict (duplicate) | Show `message` to user |
| `500` | Internal Server Error | Show generic "Something went wrong" |

#### Validation Errors

For DTO validation failures, `message` can be a **string** or **array of strings**:

```json
{
  "success": false,
  "statusCode": 400,
  "error": "Bad Request",
  "message": [
    "email must be an email",
    "password must be longer than or equal to 8 characters"
  ],
  "timestamp": "...",
  "path": "..."
}
```

Always handle `message` as potentially being an array.

### 6.5 Real-Time Considerations

The current backend does **not** implement WebSockets or SSE. All data is accessed via REST API polling. Recommended polling intervals:

| Screen | Endpoint | Interval |
|--------|----------|----------|
| Shift Feed (Doctor) | `GET /shift/feed` | 30 seconds |
| My Applications (Doctor) | `GET /application/my` | 60 seconds |
| Shift Applicants (Hospital) | `GET /application/shift/:id/applicants` | 30 seconds |
| Pending Timesheets (Hospital) | `GET /timesheet/hospital` | 60 seconds |
| Admin Stats Dashboard | `GET /admin/stats` | 5 minutes |
| Admin Disputes | `GET /admin/disputes` | 2 minutes |

When push notifications are integrated, reduce polling and rely on the notification `data.type` to trigger targeted refreshes instead.

### 6.6 Offline-First Guidance

| Data | Cache Strategy |
|------|---------------|
| User profile (`/auth/me`) | Cache on disk. Refresh on app launch. |
| Doctor/Hospital profile | Cache on disk. Refresh on profile screen visit. |
| Shift feed | Cache with short TTL (5 min). Always show cached while loading fresh. |
| My applications | Cache with medium TTL (15 min). |
| Timesheets | Cache with medium TTL. Critical actions (clock-in/out) require online. |
| Wallet/Billing | Cache with long TTL (1 hour). Financial data rarely changes rapidly. |
| Admin data | No caching needed. Admin panel requires online access. |

---

## Quick Reference: All Enums

For easy frontend dropdown/picker implementation:

```typescript
// Roles
type Role = 'DOCTOR' | 'HOSPITAL' | 'SUPER_ADMIN';

// Account Status
type AccountStatus = 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';

// Specialty (15 values)
type Specialty =
  | 'MEDICAL_OFFICER' | 'ER_SPECIALIST' | 'SURGEON' | 'PEDIATRICIAN'
  | 'GYNECOLOGIST' | 'ANESTHESIOLOGIST' | 'RADIOLOGIST' | 'PATHOLOGIST'
  | 'CARDIOLOGIST' | 'NEUROLOGIST' | 'ORTHOPEDIC' | 'DERMATOLOGIST'
  | 'PSYCHIATRIST' | 'GENERAL_PHYSICIAN' | 'OTHER';

// Department (16 values)
type Department =
  | 'EMERGENCY' | 'PEDIATRICS' | 'SURGERY' | 'GYNECOLOGY'
  | 'ANESTHESIOLOGY' | 'RADIOLOGY' | 'PATHOLOGY' | 'CARDIOLOGY'
  | 'NEUROLOGY' | 'ORTHOPEDICS' | 'DERMATOLOGY' | 'PSYCHIATRY'
  | 'GENERAL_MEDICINE' | 'ICU' | 'OPD' | 'OTHER';

// Shift Status
type ShiftStatus = 'OPEN' | 'FILLED' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';

// Shift Urgency
type ShiftUrgency = 'NORMAL' | 'URGENT';

// Application Status
type ApplicationStatus = 'APPLIED' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';

// Timesheet Status
type TimesheetStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'DISPUTED' | 'RESOLVED';

// Ledger Entry Type
type LedgerEntryType = 'SHIFT_PAYMENT' | 'PLATFORM_COMMISSION' | 'DOCTOR_NET_EARNING';

// Ledger Entry Status
type LedgerEntryStatus = 'PENDING_CLEARANCE' | 'CLEARED' | 'WITHDRAWN';

// Reviewer Type
type ReviewerType = 'HOSPITAL_REVIEWING_DOCTOR' | 'DOCTOR_REVIEWING_HOSPITAL';

// Upload Types (param for /upload/:type)
type UploadType = 'profile-pic' | 'pmdc-cert' | 'hospital-logo';
```

---

## Appendix: Complete User Lifecycle Flow

```
Registration
    │
    ▼
Phone OTP Verification
    │
    ▼
Profile Creation (Doctor or Hospital)
    │
    ▼
Status: PENDING_VERIFICATION
    │
    ▼
┌───────────────────────────────────┐
│  Admin Verification Queue         │
│  GET /admin/verifications         │
│                                   │
│  PATCH /admin/verify/:userId      │
│  ├── VERIFIED → Full access       │
│  └── REJECTED → Account disabled  │
└───────────────────────────────────┘
    │
    ▼ (VERIFIED)
    │
    ├── DOCTOR FLOW:
    │   Browse Shifts → Apply → Get Accepted → Clock In → Work → Clock Out
    │   → Timesheet Pending → Hospital Approves (or 48hr auto-approve)
    │   → Ledger Created → View Wallet/Earnings
    │   → Both Parties Review (blind, 7-day reveal)
    │
    └── HOSPITAL FLOW:
        Create Shifts → Review Applications → Accept Doctor
        → Doctor Works → Review Timesheet (approve/dispute)
        → View Billing → Review Doctor
    │
    ▼ (SUSPENDED by Admin)
    │
    PATCH /admin/suspend/:userId
    │   → refreshToken nullified → user forced to logout
    │   → StatusGuard blocks all protected endpoints
    │
    PATCH /admin/unsuspend/:userId
        → Smart restore: VERIFIED (has profile) or PENDING_VERIFICATION (no profile)
```

---

**End of Guide 5 — Admin Panel, Notifications & System Architecture**

*This concludes the 5-guide series. All 52 backend endpoints, 9 notification types, 4 cron jobs, and every enum/model have been documented.*

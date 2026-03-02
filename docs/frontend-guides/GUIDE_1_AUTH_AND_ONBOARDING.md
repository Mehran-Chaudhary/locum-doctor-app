# Guide 1 — Project Overview, Architecture, Authentication & User Onboarding

> **Audience**: Mobile / Frontend Engineers  
> **Backend**: NestJS + Prisma + PostgreSQL (Supabase) + JWT  
> **Last Updated**: March 2, 2026

---

## Table of Contents

1. [Base URL & API Prefix](#1-base-url--api-prefix)
2. [Global Response Format](#2-global-response-format)
3. [Global Error Format](#3-global-error-format)
4. [Authentication (JWT Bearer)](#4-authentication-jwt-bearer)
5. [Enums Reference](#5-enums-reference)
6. [Data Models Overview](#6-data-models-overview)
7. [Auth Endpoints](#7-auth-endpoints)
   - 7.1 [Register](#71-register)
   - 7.2 [Login](#72-login)
   - 7.3 [Verify OTP](#73-verify-otp)
   - 7.4 [Resend OTP](#74-resend-otp)
   - 7.5 [Refresh Tokens](#75-refresh-tokens)
   - 7.6 [Logout](#76-logout)
   - 7.7 [Forgot Password](#77-forgot-password)
   - 7.8 [Reset Password](#78-reset-password)
   - 7.9 [Get Current User (Me)](#79-get-current-user-me)
8. [Doctor Profile Endpoints](#8-doctor-profile-endpoints)
   - 8.1 [Create Doctor Profile](#81-create-doctor-profile)
   - 8.2 [Get My Doctor Profile](#82-get-my-doctor-profile)
   - 8.3 [Update Doctor Profile](#83-update-doctor-profile)
9. [Hospital Profile Endpoints](#9-hospital-profile-endpoints)
   - 9.1 [Create Hospital Profile](#91-create-hospital-profile)
   - 9.2 [Get My Hospital Profile](#92-get-my-hospital-profile)
   - 9.3 [Update Hospital Profile](#93-update-hospital-profile)
10. [File Upload Endpoints](#10-file-upload-endpoints)
    - 10.1 [Upload File](#101-upload-file)
11. [User Lifecycle Flow](#11-user-lifecycle-flow)
12. [Token Storage & Refresh Strategy](#12-token-storage--refresh-strategy)

---

## 1. Base URL & API Prefix

| Environment | Base URL                          |
|------------|-----------------------------------|
| Local      | `http://localhost:3000/api/v1`    |
| Production | `https://your-domain.com/api/v1`  |

**All endpoints below are relative to this base URL.**

Example: `POST /auth/register` → `POST http://localhost:3000/api/v1/auth/register`

Swagger Docs are available at: `http://localhost:3000/docs`

---

## 2. Global Response Format

**Every successful response** from the API is wrapped in a standard envelope:

```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-03-02T10:30:00.000Z"
}
```

| Field       | Type      | Description                              |
|-------------|-----------|------------------------------------------|
| `success`   | `boolean` | Always `true` for successful responses   |
| `data`      | `any`     | The actual response payload              |
| `timestamp` | `string`  | ISO 8601 timestamp of the response       |

> **IMPORTANT for Frontend**: The actual data you need is always inside `response.data.data` if using axios, or `response.data` if you extract the body. All example responses below show only the **inner `data`** field.

---

## 3. Global Error Format

**Every error response** follows this structure:

```json
{
  "success": false,
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "Invalid email or password",
  "timestamp": "2026-03-02T10:30:00.000Z",
  "path": "/api/v1/auth/login"
}
```

| Field        | Type               | Description                                   |
|--------------|--------------------|-----------------------------------------------|
| `success`    | `boolean`          | Always `false` for errors                     |
| `statusCode` | `number`           | HTTP status code                              |
| `error`      | `string`           | Error category (e.g., "Bad Request")          |
| `message`    | `string \| string[]` | Error message(s). Can be array for validation |
| `timestamp`  | `string`           | ISO 8601 timestamp                            |
| `path`       | `string`           | The request path that caused the error        |

### Validation Error Example (400)

When `class-validator` rejects the body:

```json
{
  "success": false,
  "statusCode": 400,
  "error": "Bad Request",
  "message": [
    "email must be an email",
    "Password must be at least 8 characters long",
    "Phone number must be a valid Pakistani number in +92XXXXXXXXXX format"
  ],
  "timestamp": "2026-03-02T10:30:00.000Z",
  "path": "/api/v1/auth/register"
}
```

### Common HTTP Status Codes

| Code | Meaning                | When                                           |
|------|------------------------|-------------------------------------------------|
| 200  | OK                     | Successful GET / POST / PATCH                   |
| 201  | Created                | Resource created successfully                   |
| 400  | Bad Request            | Validation failed, business rule violation       |
| 401  | Unauthorized           | Invalid/missing/expired JWT token                |
| 403  | Forbidden              | Role/status not permitted for this action        |
| 404  | Not Found              | Resource doesn't exist                           |
| 409  | Conflict               | Duplicate resource (email, phone, PMDC, etc.)    |
| 500  | Internal Server Error  | Unexpected server error                          |

---

## 4. Authentication (JWT Bearer)

The API uses **JWT Bearer Token** authentication.

### How It Works

1. **Register** or **Login** → you receive `accessToken` + `refreshToken`
2. Attach the `accessToken` to every authenticated request:
   ```
   Authorization: Bearer <accessToken>
   ```
3. The `accessToken` expires in **15 minutes**
4. The `refreshToken` expires in **7 days**
5. When the `accessToken` expires, call the **Refresh** endpoint with your `refreshToken` to get new tokens
6. On **Logout**, the `refreshToken` is invalidated server-side

### JWT Payload (Decoded)

```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "email": "doctor@example.com",
  "role": "DOCTOR",
  "status": "PENDING_VERIFICATION",
  "iat": 1709380200,
  "exp": 1709381100
}
```

| Field    | Type     | Description                          |
|----------|----------|--------------------------------------|
| `sub`    | `string` | User UUID (user ID)                  |
| `email`  | `string` | User's email                         |
| `role`   | `string` | `DOCTOR`, `HOSPITAL`, or `SUPER_ADMIN` |
| `status` | `string` | Account verification status          |
| `iat`    | `number` | Issued-at timestamp (Unix)           |
| `exp`    | `number` | Expiration timestamp (Unix)          |

### Guards & Access Control

The backend enforces three levels of access control:

| Guard         | Purpose                                                   |
|---------------|-----------------------------------------------------------|
| `JwtAuthGuard` | Requires a valid JWT token (any authenticated user)       |
| `RolesGuard`   | Requires specific role(s): `DOCTOR`, `HOSPITAL`, `SUPER_ADMIN` |
| `StatusGuard`  | Requires specific account status (usually `VERIFIED`)     |

> If an endpoint requires `VERIFIED` status and the user is still `PENDING_VERIFICATION`, they'll get a 403 error: *"Your account is not verified yet. Please wait for admin approval."*

---

## 5. Enums Reference

These enum values are used throughout the API. **Use these exact strings in requests/responses.**

### Role
```
DOCTOR
HOSPITAL
SUPER_ADMIN
```

### AccountStatus
```
PENDING_VERIFICATION
VERIFIED
REJECTED
SUSPENDED
```

### Specialty
```
MEDICAL_OFFICER
ER_SPECIALIST
SURGEON
PEDIATRICIAN
GYNECOLOGIST
ANESTHESIOLOGIST
RADIOLOGIST
PATHOLOGIST
CARDIOLOGIST
NEUROLOGIST
ORTHOPEDIC
DERMATOLOGIST
PSYCHIATRIST
GENERAL_PHYSICIAN
OTHER
```

### Department
```
EMERGENCY
PEDIATRICS
SURGERY
GYNECOLOGY
ANESTHESIOLOGY
RADIOLOGY
PATHOLOGY
CARDIOLOGY
NEUROLOGY
ORTHOPEDICS
DERMATOLOGY
PSYCHIATRY
GENERAL_MEDICINE
ICU
OPD
OTHER
```

### ShiftStatus
```
OPEN
FILLED
IN_PROGRESS
COMPLETED
EXPIRED
CANCELLED
```

### ShiftUrgency
```
NORMAL
URGENT
```

### ApplicationStatus
```
APPLIED
ACCEPTED
REJECTED
WITHDRAWN
```

### TimesheetStatus
```
PENDING_APPROVAL
APPROVED
DISPUTED
RESOLVED
```

### ReviewerType
```
HOSPITAL_REVIEWING_DOCTOR
DOCTOR_REVIEWING_HOSPITAL
```

### LedgerEntryType
```
SHIFT_PAYMENT
PLATFORM_COMMISSION
DOCTOR_NET_EARNING
```

### LedgerEntryStatus
```
PENDING_CLEARANCE
CLEARED
WITHDRAWN
```

---

## 6. Data Models Overview

### User

| Field           | Type              | Notes                                     |
|-----------------|-------------------|-------------------------------------------|
| `id`            | `string` (UUID)   | Primary key                               |
| `email`         | `string`          | Unique                                    |
| `phone`         | `string`          | Unique, format: `+92XXXXXXXXXX`           |
| `phoneVerified` | `boolean`         | `true` after OTP verification             |
| `role`          | `Role`            | `DOCTOR` or `HOSPITAL`                    |
| `status`        | `AccountStatus`   | Starts as `PENDING_VERIFICATION`          |
| `createdAt`     | `string` (ISO)    | Auto-generated                            |
| `updatedAt`     | `string` (ISO)    | Auto-updated                              |

### DoctorProfile

| Field            | Type              | Notes                                    |
|------------------|-------------------|------------------------------------------|
| `id`             | `string` (UUID)   | Profile ID (different from user ID)      |
| `userId`         | `string` (UUID)   | Links to `User.id`                       |
| `firstName`      | `string`          | Required                                 |
| `lastName`       | `string`          | Required                                 |
| `city`           | `string`          | Required                                 |
| `latitude`       | `number \| null`  | GPS latitude                             |
| `longitude`      | `number \| null`  | GPS longitude                            |
| `pmdcNumber`     | `string`          | Unique PMDC registration number          |
| `specialty`      | `Specialty`       | Enum value                               |
| `yearsExperience`| `number`          | 0–60                                     |
| `hourlyRate`     | `string` (Decimal)| PKR per hour (e.g., `"1500.00"`)         |
| `bio`            | `string \| null`  | Optional bio text                        |
| `profilePicUrl`  | `string \| null`  | Set via upload endpoint                  |
| `pmdcCertUrl`    | `string \| null`  | Set via upload endpoint                  |
| `averageRating`  | `number`          | 0–5, auto-calculated from reviews        |
| `totalReviews`   | `number`          | Auto-calculated                          |
| `createdAt`      | `string` (ISO)    |                                          |
| `updatedAt`      | `string` (ISO)    |                                          |

### HospitalProfile

| Field                 | Type              | Notes                                  |
|-----------------------|-------------------|----------------------------------------|
| `id`                  | `string` (UUID)   | Profile ID                             |
| `userId`              | `string` (UUID)   | Links to `User.id`                     |
| `hospitalName`        | `string`          | Required                               |
| `address`             | `string`          | Required                               |
| `city`                | `string`          | Required                               |
| `latitude`            | `number \| null`  | GPS latitude                           |
| `longitude`           | `number \| null`  | GPS longitude                          |
| `healthCommRegNumber` | `string`          | Unique HC registration number          |
| `contactPersonName`   | `string`          | Required                               |
| `contactPersonPhone`  | `string`          | Format: `+92XXXXXXXXXX`               |
| `contactPersonEmail`  | `string \| null`  | Optional                               |
| `logoUrl`             | `string \| null`  | Set via upload endpoint                |
| `averageRating`       | `number`          | 0–5, auto-calculated from reviews      |
| `totalReviews`        | `number`          | Auto-calculated                        |
| `createdAt`           | `string` (ISO)    |                                        |
| `updatedAt`           | `string` (ISO)    |                                        |

---

## 7. Auth Endpoints

### 7.1 Register

Creates a new Doctor or Hospital account. An OTP is sent to the provided phone number for verification.

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `/auth/register` |
| **Auth** | None |

#### Request Body

```json
{
  "email": "doctor@example.com",
  "password": "StrongP@ss1",
  "phone": "+923001234567",
  "role": "DOCTOR"
}
```

| Field      | Type     | Required | Validation                                        |
|------------|----------|----------|---------------------------------------------------|
| `email`    | `string` | Yes      | Valid email format                                |
| `password` | `string` | Yes      | Min 8 characters                                  |
| `phone`    | `string` | Yes      | Pakistani number: `+92XXXXXXXXXX` (10 digits after +92) |
| `role`     | `string` | Yes      | `"DOCTOR"` or `"HOSPITAL"` only                  |

#### Success Response — `201 Created`

```json
{
  "message": "Registration successful. Please verify your phone number with the OTP sent.",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "doctor@example.com",
    "phone": "+923001234567",
    "role": "DOCTOR",
    "status": "PENDING_VERIFICATION",
    "phoneVerified": false
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  },
  "devOtp": "482910"
}
```

> **Note**: `devOtp` is only returned in development mode. In production, the OTP is sent via SMS.

#### Error Responses

| Status | Condition                    | Message                              |
|--------|------------------------------|--------------------------------------|
| 400    | Role is `SUPER_ADMIN`        | "Cannot register as Super Admin"     |
| 409    | Email already registered     | "Email is already registered"        |
| 409    | Phone already registered     | "Phone number is already registered" |

---

### 7.2 Login

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `/auth/login` |
| **Auth** | None |

#### Request Body

```json
{
  "email": "doctor@example.com",
  "password": "StrongP@ss1"
}
```

| Field      | Type     | Required | Validation          |
|------------|----------|----------|---------------------|
| `email`    | `string` | Yes      | Valid email format  |
| `password` | `string` | Yes      | Min 1 character     |

#### Success Response — `200 OK`

```json
{
  "message": "Login successful",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "doctor@example.com",
    "phone": "+923001234567",
    "role": "DOCTOR",
    "status": "PENDING_VERIFICATION",
    "phoneVerified": false
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### Error Responses

| Status | Condition                | Message                      |
|--------|--------------------------|------------------------------|
| 401    | Wrong email or password  | "Invalid email or password"  |

---

### 7.3 Verify OTP

Verifies the user's phone number using the 6-digit OTP code.

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `/auth/verify-otp` |
| **Auth** | Bearer Token |

#### Request Body

```json
{
  "code": "482910"
}
```

| Field  | Type     | Required | Validation              |
|--------|----------|----------|-------------------------|
| `code` | `string` | Yes      | Exactly 6 characters    |

#### Success Response — `200 OK`

```json
{
  "message": "Phone number verified successfully"
}
```

#### Error Responses

| Status | Condition                     | Message                        |
|--------|-------------------------------|--------------------------------|
| 400    | Invalid or expired OTP        | "Invalid or expired OTP code"  |

---

### 7.4 Resend OTP

Resends a new OTP code to the user's phone. Invalidates all previous OTPs.

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `/auth/resend-otp` |
| **Auth** | Bearer Token |

#### Request Body

None.

#### Success Response — `200 OK`

```json
{
  "message": "New OTP sent to your phone number",
  "devOtp": "715328"
}
```

> `devOtp` only in development mode.

#### Error Responses

| Status | Condition                    | Message                                |
|--------|------------------------------|----------------------------------------|
| 400    | Phone already verified       | "Phone number is already verified"     |
| 404    | User not found               | "User not found"                       |

---

### 7.5 Refresh Tokens

Exchange a valid `refreshToken` for a new pair of `accessToken` + `refreshToken`. Call this when the `accessToken` expires (401 response).

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `/auth/refresh` |
| **Auth** | None |

#### Request Body

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

| Field          | Type     | Required | Validation       |
|----------------|----------|----------|------------------|
| `refreshToken` | `string` | Yes      | Non-empty string |

#### Success Response — `200 OK`

```json
{
  "message": "Tokens refreshed successfully",
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...(new)",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...(new)"
  }
}
```

> **IMPORTANT**: After refreshing, you receive a brand-new `refreshToken`. You must **replace** the old one. The old refresh token is now invalid.

#### Error Responses

| Status | Condition                              | Message                                   |
|--------|----------------------------------------|-------------------------------------------|
| 401    | Invalid, expired, or reused token      | "Invalid or expired refresh token"        |

---

### 7.6 Logout

Invalidates the user's refresh token on the server.

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `/auth/logout` |
| **Auth** | Bearer Token |

#### Request Body

None.

#### Success Response — `200 OK`

```json
{
  "message": "Logged out successfully"
}
```

---

### 7.7 Forgot Password

Requests a password reset. A reset token is generated (sent via email in production).

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `/auth/forgot-password` |
| **Auth** | None |

#### Request Body

```json
{
  "email": "doctor@example.com"
}
```

| Field   | Type     | Required | Validation        |
|---------|----------|----------|-------------------|
| `email` | `string` | Yes      | Valid email format |

#### Success Response — `200 OK`

```json
{
  "message": "If this email is registered, a password reset link has been sent.",
  "devResetToken": "a3f5c8d1e2b4..."
}
```

> `devResetToken` only in development mode. In production, the token is emailed. The response always returns the same success message regardless of whether the email exists (prevents email enumeration).

---

### 7.8 Reset Password

Resets the user's password using the token from the forgot-password email.

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `/auth/reset-password` |
| **Auth** | None |

#### Request Body

```json
{
  "token": "a3f5c8d1e2b4...",
  "newPassword": "NewStrongP@ss1"
}
```

| Field         | Type     | Required | Validation       |
|---------------|----------|----------|------------------|
| `token`       | `string` | Yes      | Non-empty string |
| `newPassword` | `string` | Yes      | Min 8 characters |

#### Success Response — `200 OK`

```json
{
  "message": "Password reset successfully. Please log in with your new password."
}
```

#### Error Responses

| Status | Condition                        | Message                              |
|--------|----------------------------------|--------------------------------------|
| 400    | Invalid or expired reset token   | "Invalid or expired reset token"     |

---

### 7.9 Get Current User (Me)

Returns the current authenticated user's full profile including related Doctor or Hospital profile data.

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/auth/me` |
| **Auth** | Bearer Token |

#### Success Response — `200 OK`

**Doctor User:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "doctor@example.com",
  "phone": "+923001234567",
  "role": "DOCTOR",
  "status": "VERIFIED",
  "phoneVerified": true,
  "createdAt": "2026-03-01T10:00:00.000Z",
  "doctorProfile": {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "firstName": "Ahmed",
    "lastName": "Khan",
    "city": "Lahore",
    "latitude": 31.5204,
    "longitude": 74.3587,
    "pmdcNumber": "12345-P",
    "specialty": "MEDICAL_OFFICER",
    "yearsExperience": 3,
    "hourlyRate": "1500.00",
    "bio": "Experienced ER doctor with 3 years at Mayo Hospital.",
    "profilePicUrl": "https://supabase.co/storage/v1/object/public/...",
    "pmdcCertUrl": "https://supabase.co/storage/v1/object/public/...",
    "averageRating": 4.5,
    "totalReviews": 12,
    "createdAt": "2026-03-01T10:30:00.000Z",
    "updatedAt": "2026-03-01T12:00:00.000Z"
  },
  "hospitalProfile": null
}
```

**Hospital User:**
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440000",
  "email": "admin@mayohospital.pk",
  "phone": "+923009876543",
  "role": "HOSPITAL",
  "status": "VERIFIED",
  "phoneVerified": true,
  "createdAt": "2026-03-01T09:00:00.000Z",
  "doctorProfile": null,
  "hospitalProfile": {
    "id": "880e8400-e29b-41d4-a716-446655440000",
    "userId": "770e8400-e29b-41d4-a716-446655440000",
    "hospitalName": "Mayo Hospital",
    "address": "2-Jail Road, Lahore",
    "city": "Lahore",
    "latitude": 31.5204,
    "longitude": 74.3587,
    "healthCommRegNumber": "HC-LHR-2024-001",
    "contactPersonName": "Dr. Usman Ali",
    "contactPersonPhone": "+923009876543",
    "contactPersonEmail": "admin@mayohospital.pk",
    "logoUrl": "https://supabase.co/storage/v1/object/public/...",
    "averageRating": 4.2,
    "totalReviews": 8,
    "createdAt": "2026-03-01T09:30:00.000Z",
    "updatedAt": "2026-03-01T11:00:00.000Z"
  }
}
```

---

## 8. Doctor Profile Endpoints

> **All endpoints require**: Bearer Token + Role = `DOCTOR`

### 8.1 Create Doctor Profile

Creates the doctor's professional profile (onboarding step). Each doctor can only have one profile.

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `/doctor/profile` |
| **Auth** | Bearer Token |
| **Role** | `DOCTOR` |

#### Request Body

```json
{
  "firstName": "Ahmed",
  "lastName": "Khan",
  "city": "Lahore",
  "latitude": 31.5204,
  "longitude": 74.3587,
  "pmdcNumber": "12345-P",
  "specialty": "MEDICAL_OFFICER",
  "yearsExperience": 3,
  "hourlyRate": 1500,
  "bio": "Experienced ER doctor with 3 years at Mayo Hospital."
}
```

| Field             | Type     | Required | Validation                        |
|-------------------|----------|----------|-----------------------------------|
| `firstName`       | `string` | Yes      | Non-empty                         |
| `lastName`        | `string` | Yes      | Non-empty                         |
| `city`            | `string` | Yes      | Non-empty                         |
| `latitude`        | `number` | No       | Valid latitude                    |
| `longitude`       | `number` | No       | Valid longitude                   |
| `pmdcNumber`      | `string` | Yes      | Non-empty, unique across system   |
| `specialty`       | `string` | Yes      | Must be a valid `Specialty` enum  |
| `yearsExperience` | `number` | Yes      | Integer, 0–60                     |
| `hourlyRate`      | `number` | Yes      | Positive number (PKR)             |
| `bio`             | `string` | No       | Optional text                     |

#### Success Response — `201 Created`

```json
{
  "id": "660e8400-e29b-41d4-a716-446655440000",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "firstName": "Ahmed",
  "lastName": "Khan",
  "city": "Lahore",
  "latitude": 31.5204,
  "longitude": 74.3587,
  "pmdcNumber": "12345-P",
  "specialty": "MEDICAL_OFFICER",
  "yearsExperience": 3,
  "hourlyRate": "1500",
  "bio": "Experienced ER doctor with 3 years at Mayo Hospital.",
  "profilePicUrl": null,
  "pmdcCertUrl": null,
  "averageRating": 0,
  "totalReviews": 0,
  "createdAt": "2026-03-02T10:30:00.000Z",
  "updatedAt": "2026-03-02T10:30:00.000Z"
}
```

#### Error Responses

| Status | Condition                        | Message                                              |
|--------|----------------------------------|------------------------------------------------------|
| 403    | User is not a DOCTOR             | "Only doctors can create a doctor profile"            |
| 409    | Profile already exists           | "Doctor profile already exists. Use the update endpoint." |
| 409    | PMDC number already taken        | "This PMDC number is already registered"              |

---

### 8.2 Get My Doctor Profile

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/doctor/profile` |
| **Auth** | Bearer Token |
| **Role** | `DOCTOR` |

#### Success Response — `200 OK`

```json
{
  "id": "660e8400-e29b-41d4-a716-446655440000",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "firstName": "Ahmed",
  "lastName": "Khan",
  "city": "Lahore",
  "latitude": 31.5204,
  "longitude": 74.3587,
  "pmdcNumber": "12345-P",
  "specialty": "MEDICAL_OFFICER",
  "yearsExperience": 3,
  "hourlyRate": "1500.00",
  "bio": "Experienced ER doctor with 3 years at Mayo Hospital.",
  "profilePicUrl": "https://...",
  "pmdcCertUrl": "https://...",
  "averageRating": 4.5,
  "totalReviews": 12,
  "createdAt": "2026-03-01T10:30:00.000Z",
  "updatedAt": "2026-03-02T10:30:00.000Z",
  "user": {
    "email": "doctor@example.com",
    "phone": "+923001234567",
    "status": "VERIFIED",
    "phoneVerified": true
  }
}
```

#### Error Responses

| Status | Condition               | Message                      |
|--------|-------------------------|------------------------------|
| 404    | Profile not found       | "Doctor profile not found"   |

---

### 8.3 Update Doctor Profile

Updates the doctor's profile. All fields are optional (partial update).

| | |
|---|---|
| **Method** | `PATCH` |
| **URL** | `/doctor/profile` |
| **Auth** | Bearer Token |
| **Role** | `DOCTOR` |

#### Request Body (example — any combination of fields)

```json
{
  "city": "Islamabad",
  "latitude": 33.6844,
  "longitude": 73.0479,
  "hourlyRate": 2000,
  "bio": "Updated bio text."
}
```

All fields from `CreateDoctorProfileDto` are accepted but optional.

#### Success Response — `200 OK`

Returns the full updated profile (same shape as the create response).

#### Error Responses

| Status | Condition                              | Message                                               |
|--------|----------------------------------------|-------------------------------------------------------|
| 404    | Profile doesn't exist                  | "Doctor profile not found. Please create one first."  |
| 409    | PMDC number already taken by another   | "This PMDC number is already registered"              |

---

## 9. Hospital Profile Endpoints

> **All endpoints require**: Bearer Token + Role = `HOSPITAL`

### 9.1 Create Hospital Profile

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `/hospital/profile` |
| **Auth** | Bearer Token |
| **Role** | `HOSPITAL` |

#### Request Body

```json
{
  "hospitalName": "Mayo Hospital",
  "address": "2-Jail Road, Lahore",
  "city": "Lahore",
  "latitude": 31.5204,
  "longitude": 74.3587,
  "healthCommRegNumber": "HC-LHR-2024-001",
  "contactPersonName": "Dr. Usman Ali",
  "contactPersonPhone": "+923009876543",
  "contactPersonEmail": "admin@mayohospital.pk"
}
```

| Field                 | Type     | Required | Validation                                |
|-----------------------|----------|----------|-------------------------------------------|
| `hospitalName`        | `string` | Yes      | Non-empty                                 |
| `address`             | `string` | Yes      | Non-empty                                 |
| `city`                | `string` | Yes      | Non-empty                                 |
| `latitude`            | `number` | No       | Valid latitude                            |
| `longitude`           | `number` | No       | Valid longitude                           |
| `healthCommRegNumber` | `string` | Yes      | Non-empty, unique                         |
| `contactPersonName`   | `string` | Yes      | Non-empty                                 |
| `contactPersonPhone`  | `string` | Yes      | Pakistani number: `+92XXXXXXXXXX`         |
| `contactPersonEmail`  | `string` | No       | Valid email format                        |

#### Success Response — `201 Created`

```json
{
  "id": "880e8400-e29b-41d4-a716-446655440000",
  "userId": "770e8400-e29b-41d4-a716-446655440000",
  "hospitalName": "Mayo Hospital",
  "address": "2-Jail Road, Lahore",
  "city": "Lahore",
  "latitude": 31.5204,
  "longitude": 74.3587,
  "healthCommRegNumber": "HC-LHR-2024-001",
  "contactPersonName": "Dr. Usman Ali",
  "contactPersonPhone": "+923009876543",
  "contactPersonEmail": "admin@mayohospital.pk",
  "logoUrl": null,
  "averageRating": 0,
  "totalReviews": 0,
  "createdAt": "2026-03-02T10:30:00.000Z",
  "updatedAt": "2026-03-02T10:30:00.000Z"
}
```

#### Error Responses

| Status | Condition                                     | Message                                                    |
|--------|-----------------------------------------------|------------------------------------------------------------|
| 403    | User is not a HOSPITAL                        | "Only hospital admins can create a hospital profile"       |
| 409    | Profile already exists                        | "Hospital profile already exists. Use the update endpoint."|
| 409    | HC registration number already taken          | "This Health Commission registration number is already registered" |

---

### 9.2 Get My Hospital Profile

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/hospital/profile` |
| **Auth** | Bearer Token |
| **Role** | `HOSPITAL` |

#### Success Response — `200 OK`

```json
{
  "id": "880e8400-e29b-41d4-a716-446655440000",
  "userId": "770e8400-e29b-41d4-a716-446655440000",
  "hospitalName": "Mayo Hospital",
  "address": "2-Jail Road, Lahore",
  "city": "Lahore",
  "latitude": 31.5204,
  "longitude": 74.3587,
  "healthCommRegNumber": "HC-LHR-2024-001",
  "contactPersonName": "Dr. Usman Ali",
  "contactPersonPhone": "+923009876543",
  "contactPersonEmail": "admin@mayohospital.pk",
  "logoUrl": "https://...",
  "averageRating": 4.2,
  "totalReviews": 8,
  "createdAt": "2026-03-01T09:30:00.000Z",
  "updatedAt": "2026-03-02T10:30:00.000Z",
  "user": {
    "email": "admin@mayohospital.pk",
    "phone": "+923009876543",
    "status": "VERIFIED",
    "phoneVerified": true
  }
}
```

#### Error Responses

| Status | Condition               | Message                        |
|--------|-------------------------|--------------------------------|
| 404    | Profile not found       | "Hospital profile not found"   |

---

### 9.3 Update Hospital Profile

| | |
|---|---|
| **Method** | `PATCH` |
| **URL** | `/hospital/profile` |
| **Auth** | Bearer Token |
| **Role** | `HOSPITAL` |

#### Request Body (example — any combination of fields)

```json
{
  "address": "New Address, Lahore",
  "contactPersonName": "Dr. Fatima Ahmed",
  "contactPersonEmail": "fatima@mayohospital.pk"
}
```

All fields from `CreateHospitalProfileDto` are accepted but optional.

#### Success Response — `200 OK`

Returns the full updated profile (same shape as the create response).

#### Error Responses

| Status | Condition                              | Message                                                   |
|--------|----------------------------------------|-----------------------------------------------------------|
| 404    | Profile doesn't exist                  | "Hospital profile not found. Please create one first."    |
| 409    | HC reg number taken by another         | "This Health Commission registration number is already registered" |

---

## 10. File Upload Endpoints

### 10.1 Upload File

Uploads a file to Supabase Storage and updates the corresponding profile URL.

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `/upload/:type` |
| **Auth** | Bearer Token |
| **Content-Type** | `multipart/form-data` |

#### URL Parameter

| Parameter | Values                                          | Description                |
|-----------|--------------------------------------------------|----------------------------|
| `type`    | `profile-pic`, `pmdc-cert`, `hospital-logo`      | Type of file being uploaded |

#### Role Permissions

| Upload Type      | Allowed Roles |
|------------------|---------------|
| `profile-pic`    | `DOCTOR`      |
| `pmdc-cert`      | `DOCTOR`      |
| `hospital-logo`  | `HOSPITAL`    |

#### Request Body (multipart/form-data)

| Field  | Type   | Required | Description            |
|--------|--------|----------|------------------------|
| `file` | `File` | Yes      | The file to upload     |

#### File Constraints

| Constraint       | Value                                              |
|------------------|----------------------------------------------------|
| Max size         | **5 MB**                                           |
| Allowed types (images) | `image/jpeg`, `image/png`, `image/webp`     |
| Allowed types (PMDC cert) | `image/jpeg`, `image/png`, `image/webp`, `application/pdf` |

#### Success Response — `201 Created`

```json
{
  "message": "File uploaded successfully",
  "url": "https://your-supabase-url.supabase.co/storage/v1/object/public/locum-uploads/profile-pic/550e8400.../abc123.jpg",
  "type": "profile-pic"
}
```

#### Error Responses

| Status | Condition                                | Message                                         |
|--------|------------------------------------------|-------------------------------------------------|
| 400    | No file provided                         | "No file provided"                              |
| 400    | File too large                           | "File size must not exceed 5MB"                 |
| 400    | Invalid MIME type                        | "Invalid file type. Allowed: ..."               |
| 400    | Invalid upload type in URL               | "Invalid upload type. Must be one of: ..."      |
| 403    | Doctor trying to upload hospital-logo    | "Doctors cannot upload hospital logos"           |
| 403    | Hospital trying to upload profile-pic    | "Hospitals can only upload logos"                |
| 404    | Profile not created yet                  | "Doctor/Hospital profile not found. Create your profile first." |

#### Mobile Implementation Example (React Native)

```javascript
const uploadFile = async (accessToken, type, file) => {
  const formData = new FormData();
  formData.append('file', {
    uri: file.uri,
    type: file.type, // e.g. 'image/jpeg'
    name: file.fileName,
  });

  const response = await fetch(`${BASE_URL}/upload/${type}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      // Do NOT set Content-Type — let fetch set it with boundary
    },
    body: formData,
  });

  return response.json();
};
```

---

## 11. User Lifecycle Flow

This is the complete journey from registration to being fully operational:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    REGISTRATION & ONBOARDING FLOW                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. POST /auth/register                                            │
│     └─ Gets: tokens + OTP (via SMS)                                │
│     └─ Status: PENDING_VERIFICATION                                │
│     └─ phoneVerified: false                                        │
│                                                                     │
│  2. POST /auth/verify-otp          (with Bearer token)             │
│     └─ phoneVerified: true                                         │
│                                                                     │
│  3. POST /doctor/profile  OR  POST /hospital/profile               │
│     └─ Complete the onboarding form                                │
│                                                                     │
│  4. POST /upload/profile-pic       (Doctor: profile pic)           │
│     POST /upload/pmdc-cert         (Doctor: PMDC certificate)      │
│     POST /upload/hospital-logo     (Hospital: logo)                │
│                                                                     │
│  5. ⏳ WAIT FOR ADMIN VERIFICATION                                  │
│     └─ Admin reviews at:  GET /admin/verifications                 │
│     └─ Admin decides:     PATCH /admin/verify/:userId              │
│        └─ VERIFIED → Can now use shift/application features        │
│        └─ REJECTED → Account rejected                              │
│                                                                     │
│  6. ✅ Status: VERIFIED                                             │
│     └─ Full access to all role-specific features                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Frontend State Machine Recommendation

```
SCREEN ROUTING BASED ON USER STATE:
─────────────────────────────────────

if (!tokens) → Login/Register Screen

if (tokens && !phoneVerified) → OTP Verification Screen

if (tokens && phoneVerified && !profile) → Onboarding/Profile Creation Screen

if (tokens && phoneVerified && profile && status === 'PENDING_VERIFICATION')
  → Waiting for Approval Screen
    "Your account is under review. You'll be notified once approved."

if (tokens && phoneVerified && profile && status === 'REJECTED')
  → Rejection Screen
    "Your account was not approved. Contact support."

if (tokens && phoneVerified && profile && status === 'SUSPENDED')
  → Suspended Screen
    "Your account has been suspended. Contact support."

if (tokens && phoneVerified && profile && status === 'VERIFIED')
  → Main App (Dashboard)
```

### How to Determine State on App Launch

Call `GET /auth/me` with the stored access token:
- Check `phoneVerified` → if false, go to OTP screen
- Check `doctorProfile` / `hospitalProfile` → if null, go to profile creation
- Check `status` → route accordingly

---

## 12. Token Storage & Refresh Strategy

### Storage Recommendations

| Platform      | Access Token              | Refresh Token                      |
|---------------|---------------------------|------------------------------------|
| React Native  | In-memory variable        | `react-native-keychain` (secure)   |
| Flutter        | In-memory variable        | `flutter_secure_storage`           |

> **Never store the access token in AsyncStorage/SharedPreferences** — it's sensitive and short-lived.

### Refresh Strategy (Axios Interceptor Example)

```javascript
// Axios interceptor for automatic token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const storedRefreshToken = await getSecureRefreshToken();
        const { data } = await api.post('/auth/refresh', {
          refreshToken: storedRefreshToken,
        });

        // Store new tokens
        setAccessToken(data.data.tokens.accessToken);
        await setSecureRefreshToken(data.data.tokens.refreshToken);

        // Retry original request with new token
        originalRequest.headers.Authorization =
          `Bearer ${data.data.tokens.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed — force logout
        await clearTokens();
        navigateToLogin();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

### Token Lifecycle Summary

```
Register/Login
    ↓
accessToken (15 min) + refreshToken (7 days)
    ↓
Access token expires → 401 error
    ↓
POST /auth/refresh → new accessToken + new refreshToken
    ↓
Refresh token expires or invalidated → Force re-login
```

---

## Quick Reference — All Endpoints in This Guide

| Method  | Endpoint                    | Auth   | Role       | Description                           |
|---------|-----------------------------|--------|------------|---------------------------------------|
| POST    | `/auth/register`            | None   | —          | Register new account                  |
| POST    | `/auth/login`               | None   | —          | Login                                 |
| POST    | `/auth/verify-otp`          | Bearer | Any        | Verify phone OTP                      |
| POST    | `/auth/resend-otp`          | Bearer | Any        | Resend OTP                            |
| POST    | `/auth/refresh`             | None   | —          | Refresh JWT tokens                    |
| POST    | `/auth/logout`              | Bearer | Any        | Logout                                |
| POST    | `/auth/forgot-password`     | None   | —          | Request password reset                |
| POST    | `/auth/reset-password`      | None   | —          | Reset password with token             |
| GET     | `/auth/me`                  | Bearer | Any        | Get current user + profile            |
| POST    | `/doctor/profile`           | Bearer | DOCTOR     | Create doctor profile                 |
| GET     | `/doctor/profile`           | Bearer | DOCTOR     | Get my doctor profile                 |
| PATCH   | `/doctor/profile`           | Bearer | DOCTOR     | Update doctor profile                 |
| POST    | `/hospital/profile`         | Bearer | HOSPITAL   | Create hospital profile               |
| GET     | `/hospital/profile`         | Bearer | HOSPITAL   | Get my hospital profile               |
| PATCH   | `/hospital/profile`         | Bearer | HOSPITAL   | Update hospital profile               |
| POST    | `/upload/:type`             | Bearer | Role-based | Upload file (profile pic/cert/logo)   |

---

> **Next Guide**: Guide 2 — Shifts & Applications (Creating shifts, doctor shift feed with geo-spatial search, applying, accepting applicants)

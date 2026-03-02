# Guide 0 — The Application Idea

> **For**: Mobile / Frontend Engineer  
> **Read this first** before diving into the technical guides.  
> **Purpose**: Understand WHAT we are building, WHY, and HOW the system works as a whole.

---

## Table of Contents

1. [The Problem](#1-the-problem)
2. [Our Solution](#2-our-solution)
3. [Who Are the Users?](#3-who-are-the-users)
4. [The Real-World User Journey](#4-the-real-world-user-journey)
5. [Core Platform Features](#5-core-platform-features)
6. [The Three User Roles](#6-the-three-user-roles)
7. [Application Architecture Overview](#7-application-architecture-overview)
8. [Doctor's Complete Flow](#8-doctors-complete-flow)
9. [Hospital's Complete Flow](#9-hospitals-complete-flow)
10. [Admin's Complete Flow](#10-admins-complete-flow)
11. [Key Business Rules](#11-key-business-rules)
12. [The Financial Model](#12-the-financial-model)
13. [Trust & Safety Mechanisms](#13-trust--safety-mechanisms)
14. [Screen Map — What to Build](#14-screen-map--what-to-build)
15. [Technical Guide Index](#15-technical-guide-index)

---

## 1. The Problem

In Pakistan, healthcare facilities face a critical staffing crisis every single day:

- A hospital's regular doctor calls in sick — the ER needs immediate coverage for the night shift
- A clinic needs a specialist for weekend surgery coverage
- A busy OPD needs extra hands during flu season

**What happens today?** The hospital admin panics. They scroll through personal WhatsApp groups, call contacts, post in Facebook groups. This manual process is:

- **Slow** — Finding a replacement takes 4–6 hours on average
- **Unreliable** — No guarantee the doctor who shows up is actually qualified
- **Risky** — No way to instantly verify PMDC (Pakistan Medical & Dental Council) credentials
- **Opaque** — No records of hours worked, frequent payment disputes
- **Unfair** — Doctors have no centralized way to find extra shifts near them

**On the doctor's side**, thousands of Medical Officers, post-grad trainees, and freelance specialists WANT to work additional shifts to earn extra income. But they have no platform to discover available shifts near their location in real-time.

---

## 2. Our Solution

We are building **a real-time, two-sided digital marketplace** — think of it as **"Uber for Locum Doctors"** — that connects understaffed healthcare facilities with verified freelance doctors.

The platform is a **trust-broker and matching engine** that:

1. **Verifies** every doctor's PMDC credentials before they can see any shifts
2. **Matches** doctors to nearby hospitals using GPS-based geo-spatial search
3. **Tracks** actual attendance through geo-fenced clock-in/out
4. **Calculates** pay automatically down to the minute
5. **Builds reputation** through a blind two-sided review system
6. **Handles payments** through a transparent financial ledger

**The core value proposition:**

| Value | What We Deliver |
|-------|----------------|
| **Speed** | Reduce time to find a locum doctor from 6 hours → 15 minutes |
| **Trust** | No doctor can work without verified PMDC credentials + admin approval |
| **Transparency** | Precise GPS timesheets eliminate "hours worked" disputes |
| **Fairness** | Automated pay calculation, blind reviews, 48hr auto-approval protection |

---

## 3. Who Are the Users?

The platform serves three distinct user types:

### Doctors (Supply Side)
- Medical Officers (MOs), Post-grad trainees, Freelance specialists
- Age range: 25–45
- Goal: Find extra shifts near them, earn additional income
- Use the **mobile app** (primary interface)

### Hospitals / Clinics (Demand Side)
- Hospital administrators, HR managers, department heads
- Could be large teaching hospitals or small private clinics
- Goal: Fill emergency/regular shift gaps quickly with verified doctors
- Use the **mobile app** (or web dashboard in future)

### Platform Admin (Super Admin)
- Platform operations team
- Goal: Verify users, resolve disputes, monitor platform health
- Use the **admin panel** (mobile or web)

---

## 4. The Real-World User Journey

Here's exactly how the platform works in a real scenario:

```
HOSPITAL SIDE                          DOCTOR SIDE
─────────────                          ───────────
                                       
1. "We need an ER doctor tonight"      
   ↓                                   
2. Hospital posts an URGENT shift:      
   "Night Shift ER, 8PM–8AM,           
    Rs. 3,500/hr, ER Specialist"        
   ↓                                   
3. Backend calculates: 12hrs ×          
   Rs. 3,500 = Rs. 42,000 total        
   ↓                                   
4. Notification engine fires →  →  →  → 5. All verified ER doctors 
                                          within 20km get a push
                                          notification: "🚨 Urgent
                                          Shift Available Near You!"
                                          ↓
                                       6. Doctor opens app, sees
                                          shift details, taps "Apply"
   ↓                                   
7. Hospital reviews applicants:         
   sees ratings, experience,           
   PMDC verification status            
   ↓                                   
8. Hospital taps "Accept" on           
   Dr. Ahmed Khan                      
   ↓                                   
9. System auto-rejects all             
   other applicants                    → 10. Rejected doctors get
                                           notification: "Shift filled"
   ↓                                   
   ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← 11. Dr. Ahmed gets notification:
                                           "Shift Confirmed! ✅"
                                          ↓
                                       12. Dr. Ahmed arrives at hospital
                                          Taps "Clock In"
                                          ↓
                                       13. Backend checks GPS:
                                          Is he within 500m of 
                                          the hospital? ✅ YES
                                          ↓
                                       14. Shift status → IN_PROGRESS
                                          Clock starts ticking
                                          ↓
                                       15. 12 hours later...
                                          Dr. Ahmed taps "Clock Out"
                                          ↓
16. Hospital gets notification:        16. Backend auto-calculates:
    "Dr. Ahmed completed the shift.        11.87 hrs worked
     Review timesheet within 48hrs"        × Rs. 3,500/hr
   ↓                                      = Rs. 41,545 pay
17. Hospital reviews timesheet:         
    "Hours look correct" → APPROVE      
   ↓                                   
18. Ledger entries auto-created:       → 19. Doctor gets notification:
    Total: Rs. 41,545                       "Timesheet Approved! 💰"
    Platform fee (10%): Rs. 4,154.50        
    Doctor gets (90%): Rs. 37,390.50   → 20. Amount appears in
                                           doctor's wallet
   ↓                                      ↓
21. Hospital rates doctor:             22. Doctor rates hospital:
    ⭐⭐⭐⭐⭐                                ⭐⭐⭐⭐
    "Excellent, very professional"         "Good facility, helpful
                                            nurses"
   ↓                                      ↓
23. BLIND: Neither can see the other's review until BOTH submit
    (or 7 days pass, whichever comes first)
```

---

## 5. Core Platform Features

### Phase 1 — Foundation
- Dual-role registration (Doctor / Hospital)
- Phone verification via OTP (Pakistani +92 numbers)
- JWT authentication (access + refresh tokens)
- Doctor profile with PMDC credentials, specialty, geo-location
- Hospital profile with Health Commission registration
- File uploads (profile pics, PMDC certificates, hospital logos)
- Admin verification queue (approve/reject users)

### Phase 2 — The Marketplace
- Hospital shift posting with time/rate/urgency
- Doctor shift feed with geo-spatial distance calculation
- Smart filtering (specialty, city, distance, date range)
- Sorting (closest, highest pay, soonest)
- Application workflow (apply, withdraw, accept)
- Urgent shift notification engine (auto-push to nearby matching doctors)
- Shift auto-expiry (cron: every 10 minutes)

### Phase 3 — Shift Execution
- Geo-fenced clock-in (doctor must be within 500m of hospital)
- Clock-in time window validation (30 min before → 2 hrs after shift start)
- Clock-out with automatic pay calculation
- Timesheet approval/dispute workflow
- 48-hour auto-approve protection (cron: every hour)
- Missed clock-in detection (cron: every 30 minutes)

### Phase 4 — Trust & Payments
- Two-sided blind review system (1–5 stars + optional comment)
- Automatic average rating recalculation
- 7-day blind reveal window (cron: every hour)
- Three-way financial ledger (shift payment, platform 10% commission, doctor 90% net)
- Doctor earnings wallet (pending, available, lifetime)
- Hospital billing dashboard (monthly spend, fees, invoices)
- Admin revenue analytics (12-month breakdown)
- Admin dispute resolution (override clock times, force approval)

---

## 6. The Three User Roles

### Doctor Flow Summary

```
Register → Verify Phone (OTP) → Create Profile (name, PMDC, specialty, location)
→ Upload PMDC Certificate → Wait for Admin Verification
→ [VERIFIED] → Browse Shift Feed → Apply → Get Accepted
→ Clock In (geo-fenced) → Work → Clock Out → Get Paid → Leave Review
```

### Hospital Flow Summary

```
Register → Verify Phone (OTP) → Create Profile (hospital name, address, HC reg)
→ Upload Logo → Wait for Admin Verification
→ [VERIFIED] → Post Shifts → Review Applicants → Accept Doctor
→ Track Clock-In → Review Timesheet (approve/dispute) → Pay → Leave Review
```

### Admin Flow Summary

```
Login → Review Verification Queue → Approve/Reject Users
→ Monitor Platform Stats → View All Shifts → Resolve Disputes
→ View Revenue Analytics → Moderate Reviews
→ Suspend/Unsuspend Users
```

---

## 7. Application Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     MOBILE APP (Flutter/RN)                  │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │  Doctor   │  │ Hospital │  │  Admin   │  │  Shared  │    │
│  │  Screens  │  │  Screens │  │  Screens │  │  (Auth)  │    │
│  └─────┬────┘  └─────┬────┘  └─────┬────┘  └─────┬────┘    │
│        └──────────────┴──────────────┴──────────────┘        │
│                           │                                  │
│                    REST API Calls                            │
│                    (52 endpoints)                            │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────────┐
│                    BACKEND (NestJS v11)                        │
│                                                               │
│  ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌──────────────────┐  │
│  │  Auth   │ │ Shifts  │ │Timesheets│ │  Reviews &       │  │
│  │ Module  │ │ Module  │ │  Module  │ │  Earnings Module │  │
│  └────┬────┘ └────┬────┘ └────┬─────┘ └────────┬─────────┘  │
│       │           │           │                 │            │
│       └───────────┴───────────┴─────────────────┘            │
│                           │                                  │
│              ┌────────────┼────────────┐                     │
│              ▼            ▼            ▼                     │
│       ┌──────────┐ ┌──────────┐ ┌──────────────┐            │
│       │  Prisma  │ │  Event   │ │  Cron Jobs   │            │
│       │   ORM    │ │  System  │ │  (4 workers) │            │
│       └────┬─────┘ └────┬─────┘ └──────────────┘            │
│            │            │                                    │
│            ▼            ▼                                    │
│     ┌──────────┐ ┌──────────────┐                            │
│     │PostgreSQL│ │ Notification │                            │
│     │(Supabase)│ │   Service    │                            │
│     └──────────┘ │ (FCM/SMS/    │                            │
│                  │  Email)      │                            │
│                  └──────────────┘                            │
└───────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Mobile App** | Flutter or React Native (your choice) |
| **Backend** | NestJS v11 (TypeScript) |
| **Database** | PostgreSQL (hosted on Supabase) |
| **ORM** | Prisma v7 |
| **Auth** | JWT (access token: 15 min, refresh: 7 days) |
| **File Storage** | Supabase Storage (5MB limit per file) |
| **Events** | NestJS EventEmitter2 (async event-driven) |
| **Scheduling** | NestJS `@nestjs/schedule` (4 cron jobs) |
| **API Docs** | Swagger / OpenAPI at `/docs` |
| **Base URL** | `https://<host>/api/v1` |

---

## 8. Doctor's Complete Flow

As a mobile engineer, here's every screen/flow the doctor experiences:

### 8.1 Onboarding (Guide 1)
1. **Register** — Email, password, phone, role: DOCTOR
2. **OTP Screen** — Enter 6-digit code sent to phone
3. **Create Profile** — First name, last name, city, PMDC number, specialty, years of experience, hourly rate, bio, GPS location
4. **Upload Documents** — Profile picture + PMDC certificate
5. **Waiting Screen** — "Your profile is under review. You'll be notified once verified."

### 8.2 Main App (Guides 2-4)
6. **Shift Feed** — Browse available shifts near you with distance, pay, timing. Filter by specialty, city, distance. Sort by closest/highest pay/soonest
7. **Shift Detail** — Full details + "Apply" button
8. **My Applications** — Track all applications (APPLIED, ACCEPTED, REJECTED, WITHDRAWN)
9. **Active Shift (Clock-In)** — When accepted, show shift details with "Clock In" button. Needs GPS permission
10. **During Shift** — Show timer/status showing IN_PROGRESS
11. **Clock Out** — "Clock Out" button. Shows calculated hours and pay
12. **My Timesheets** — List of all timesheets with status (PENDING, APPROVED, DISPUTED)
13. **Review Hospital** — After timesheet approved, rate the hospital (1-5 stars + comment)
14. **Earnings Wallet** — Pending clearance, available to withdraw, lifetime total, ledger history

### 8.3 Profile & Settings
15. **My Profile** — View/edit profile, see own average rating
16. **View My Reviews** — See visible reviews others have left

---

## 9. Hospital's Complete Flow

### 9.1 Onboarding (Guide 1)
1. **Register** — Email, password, phone, role: HOSPITAL
2. **OTP Screen** — 6-digit code
3. **Create Profile** — Hospital name, address, city, HC registration number, contact person details, GPS location
4. **Upload Logo**
5. **Waiting Screen** — "Under review"

### 9.2 Main App (Guides 2-4)
6. **My Shifts** — List of all posted shifts with status badges and applicant counts
7. **Create Shift** — Form: title, department, specialty needed, start/end time, hourly rate, urgency
8. **Shift Applicants** — See who applied, view their profiles/ratings/experience, accept one
9. **Active Shifts** — Monitor clock-in status of accepted doctors
10. **Timesheets** — Review completed timesheets. Approve or dispute with a note
11. **Review Doctor** — After approval, rate the doctor (1-5 stars + comment)
12. **Billing Dashboard** — Monthly spend, platform fees, payment history

### 9.3 Profile & Settings
13. **My Profile** — View/edit hospital profile
14. **View Hospital Reviews** — See what doctors are saying

---

## 10. Admin's Complete Flow

### Guide 5
1. **Dashboard** — Platform stats (users, shifts, revenue, disputes)
2. **Verification Queue** — Pending doctor/hospital profiles to approve or reject
3. **User Management** — List all users, filter by role/status, view details, suspend/unsuspend
4. **Shift Overview** — All shifts across the platform with filters
5. **Disputes** — Review disputed timesheets, override clock times if needed, resolve
6. **Revenue Analytics** — 12-month revenue chart (shift payments, commission, payouts)
7. **Reviews** — Moderate all reviews across the platform

---

## 11. Key Business Rules

These rules are enforced by the backend. The mobile app must be designed with them in mind:

| Rule | Detail |
|------|--------|
| **No unverified access** | PENDING_VERIFICATION users cannot browse/post shifts |
| **Phone first** | Phone number must be OTP-verified before profile creation |
| **One profile per user** | A doctor cannot create 2 profiles. 409 Conflict if attempted |
| **PMDC uniqueness** | Two doctors cannot register with the same PMDC number |
| **Geo-fence: 500m** | Doctor must be within 500 meters of hospital to clock in |
| **Clock-in window** | 30 min before shift start → 2 hours after shift start |
| **No geo-fence for clock-out** | GPS recorded for audit but no distance check |
| **Min shift duration** | 2 hours minimum when creating a shift |
| **One doctor per shift** | Accepting one doctor auto-rejects all others |
| **No duplicate applications** | Same doctor + same shift = blocked |
| **Schedule conflict** | Cannot apply if overlapping with an already ACCEPTED shift |
| **48-hour auto-approve** | Hospital doesn't approve → system auto-approves after 48hrs |
| **Missed clock-in** | Doctor never comes → shift EXPIRED, timesheet DISPUTED |
| **Blind reviews** | Reviews hidden until BOTH parties submit OR 7 days pass |
| **10% platform commission** | Platform takes 10%, doctor gets 90% of finalCalculatedPay |
| **Suspended = locked out** | Suspended users have refresh tokens invalidated immediately |

---

## 12. The Financial Model

```
Hospital pays for a shift:  Rs. 42,000 (12hrs × Rs. 3,500/hr)
                                │
                                ▼
                    ┌───────────────────────┐
                    │  SHIFT_PAYMENT        │
                    │  Rs. 42,000.00        │
                    │  (Full amount)        │
                    └───────────┬───────────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
                    ▼                       ▼
          ┌─────────────────┐     ┌─────────────────────┐
          │ PLATFORM_COMM.  │     │ DOCTOR_NET_EARNING   │
          │ Rs. 4,200.00    │     │ Rs. 37,800.00        │
          │ (10%)           │     │ (90%)                │
          │ Status: CLEARED │     │ Status: PENDING      │
          └─────────────────┘     └─────────────────────┘
```

- Ledger entries are created **automatically** by an event listener when a timesheet is approved
- Platform commission is immediately `CLEARED`
- Doctor's net earning starts as `PENDING_CLEARANCE`
- All amounts use Prisma `Decimal(10,2)` — returned as **strings** in API responses

---

## 13. Trust & Safety Mechanisms

| Mechanism | How It Works |
|-----------|-------------|
| **PMDC Verification** | Admin manually reviews uploaded PMDC certificate before approving a doctor |
| **HC Registration** | Admin verifies hospital's Health Commission registration number |
| **Geo-Fencing** | Uses Haversine formula to calculate GPS distance. 500m radius for clock-in |
| **Blind Reviews** | Neither party sees the other's review until both submit, preventing retaliatory ratings |
| **Auto-Approve** | Protects doctors from hospitals that "forget" to approve timesheets (48hr deadline) |
| **Missed Clock-In** | Detects no-show doctors and auto-flags for admin review |
| **Account Suspension** | Admin can instantly lock out problematic users (refresh token nullified) |
| **Smart Unsuspend** | System remembers if user had a profile; restores to VERIFIED or PENDING accordingly |
| **Duplicate Prevention** | Unique constraints on PMDC numbers, emails, phones, and applications per shift |

---

## 14. Screen Map — What to Build

### Shared Screens (All Roles)
- Splash / Loading
- Login
- Register (with role picker)
- OTP Verification
- Forgot Password
- Reset Password

### Doctor Screens
- Create/Edit Profile
- Document Upload (profile pic, PMDC cert)
- Verification Pending
- Shift Feed (main screen — with filters/sort)
- Shift Detail
- My Applications (with status tabs)
- Active Shift (clock-in/out)
- My Timesheets (with status filter)
- Review Hospital Form
- Earnings Wallet
- My Profile / My Reviews

### Hospital Screens
- Create/Edit Profile
- Logo Upload
- Verification Pending
- My Shifts (with status tabs + applicant badge)
- Create Shift Form
- Shift Applicants List
- Doctor Profile Preview (when reviewing applicants)
- Timesheet Review (approve/dispute)
- Review Doctor Form
- Billing Dashboard
- My Profile / My Reviews

### Admin Screens
- Dashboard (stats cards)
- Verification Queue (with approve/reject actions)
- User List (paginated, with filters)
- User Detail
- Shift Overview (paginated, with status filter)
- Dispute Queue (list + resolution form)
- Revenue Analytics (chart)
- Review Moderation (paginated)

---

## 15. Technical Guide Index

Now that you understand the full picture, dive into the technical guides:

| Guide | Title | What It Covers |
|-------|-------|----------------|
| **Guide 1** | Auth & Onboarding | Registration, OTP, login, JWT tokens, doctor profile, hospital profile, file uploads, all enums & data models |
| **Guide 2** | Shifts & Applications | Shift creation, doctor feed with geo-spatial search, applying, accepting, shift lifecycle, auto-expiry |
| **Guide 3** | Timesheets & Clock-In/Out | Geo-fenced clock-in, clock-out with pay calculation, timesheet approval/dispute, auto-approve, missed clock-in |
| **Guide 4** | Reviews & Earnings | Blind review system, rating calculation, three-way financial ledger, doctor wallet, hospital billing |
| **Guide 5** | Admin & System Architecture | All admin endpoints, notification system, event/listener architecture, cron jobs, complete API catalogue, mobile integration notes |

**Total backend endpoints: 52** — all fully documented with request/response shapes, error codes, and business logic.

---

**Welcome to the team. Let's build this.**

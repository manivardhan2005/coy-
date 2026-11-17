# Coy - Discover Tab & SDE Intern Assignment

A standalone, mobile-first, gesture-driven **"Discover" tab** engineered for **Coy** ([app.getcoy.com](https://app.getcoy.com)), adhering strictly to Coy's foundational guarantee:

> **"Never reveal who has liked the user unless it is mutual; this is the core promise of Coy."**

This repository contains both **Part A** (systems design, threat modeling & privacy proposals) and **Part B** (a functional Next.js prototype demonstrating a mobile-first Discover experience, double-blind matching, server-side privacy filtering, persistent file-backed storage, and automated backend-logic tests).

---

## 🚀 Live Demo & Quick Start

### Prerequisites
- **Node.js**: v18.0.0 or higher (Tested on Node v20 & v24)
- **npm** or **yarn** / **pnpm**

### Installation & Run

```bash
# 1. Clone repository
git clone https://github.com/manivardhan2005/coy-.git
cd coy-

# 2. Install dependencies
npm install

# 3. Run automated production backend test suite (13/13 tests pass)
npm test

# 4. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> **Tip for Reviewers:** A **"Reset Demo"** button is built into the top navigation bar and the empty feed state. Clicking it resets the profile deck and restores all 32 profiles and demo matches instantly!

---

## 📱 Features & Highlights (Part B)

### 1. Gesture-Driven Swipe Experience
- **Fluid Drag Gestures:** Works with touch on mobile and mouse drag on desktop using Framer Motion spring physics.
- **Dynamic Rotation & Stamps:** Cards rotate proportionally as you drag ($x / 20^\circ$); vibrant **LIKE** (green) and **PASS** (rose) stamps fade in dynamically with drag distance.
- **Action Buttons:** Accessible desktop & mobile buttons for quick actions: Pass (✕), Info Details (ℹ), and Like (♥).
- **Profile Details Sheet:** Tap the info icon on any card to view extended bio, academic major, graduation year, and interest tags.
- **Card Stack Effect:** The next profile card sits scaled and layered beneath the active card for tactile depth.

### 2. Double-Blind Matching & Privacy Enforcement
- **Strict Server-Side Privacy Guarantee:** The `GET /feed` endpoint **never** sends `hasLikedUser` or any indication of prior interest to the client.
- **Sanitized Payloads:** Network requests cannot be inspected to discover secret admirers.
- **"It's a Match!" Celebration:** When you swipe right on someone who already liked you, a celebration modal pops up with multi-stage confetti, dual circular avatars, and direct messaging options.
- **Matches View:** Dedicated tab listing all mutual matches with timestamps, profiles, and an interactive simulated direct message drawer with campus icebreakers.

### 3. Permanence & Seed Data
- **Never Repeat Swiped Profiles:** A profile that has been swiped on (whether liked or passed) is permanently marked in storage and **never** appears in the feed again.
- **32 Realistic Mock Profiles:** Curated with high-res portrait photography, authentic bios, and college tags (IIT Delhi, BITS Pilani, Ashoka University, DTU, DU SRCC, St. Xavier's, NLSIU Bangalore, etc.).
- **Pre-Seeded Matches:** 12 profiles are pre-configured to have already secretly liked the demo user (e.g. *Ananya Sharma*, *Meera Patel*, *Diya Sengupta*, *Tara Deshmukh*), ensuring immediate, delightful match events during review!
- **Clear Empty State:** Displays a radar pulse animation when all profiles have been swiped, with match summaries and a one-click reset action.

---

## 🛠 Tech Stack

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend** | **Next.js 14 (App Router) + React 18** | Mobile-first responsive shell, fast server-rendered scaffolding, instant route handlers. |
| **Styling** | **Tailwind CSS** | Custom Coy dark palette (`#070709`, `#FF3366` rose accents, glassmorphic overlays). |
| **Animations** | **Framer Motion + Canvas Confetti** | Native-feeling swipe gestures, drag inertia, dynamic stamps, and celebration confetti. |
| **Backend** | **Next.js API Route Handlers** | REST endpoints with rewrite proxies supporting `/feed`, `/swipe`, `/matches`, and protected demo reset. |
| **Database** | **Persistent File-Backed Store** | Atomic temporary file replacement with retry backoff and in-process transaction serialization (single-node scope). |
| **Testing** | **Node.js Native Test Runner** | 13 automated tests directly exercising production `src/lib/storage.ts` functions. |

---

## 🔌 Backend API Specification

All endpoints support both `/api/*` and direct `/*` routes via Next.js rewrites:

### 1. `GET /feed` (or `GET /api/feed`)
Returns profiles the current user has not yet swiped on.
- **Privacy:** `hasLikedUser` is stripped from every profile object.
- **Response `200 OK`:**
```json
{
  "profiles": [
    {
      "id": "coy_01",
      "name": "Ananya Sharma",
      "age": 21,
      "photo": "https://images.unsplash.com/...",
      "bio": "Literature student. Looking for best midnight Maggi spot.",
      "college": "Ashoka University",
      "city": "Sonipat / Delhi NCR",
      "interests": ["Indie Rock", "Filter Coffee", "Book Clubs"],
      "department": "Literature & Philosophy",
      "graduationYear": 2025
    }
  ],
  "count": 32,
  "remainingCount": 32
}
```

### 2. `POST /swipe` (or `POST /api/swipe`)
Records a swipe action (`'like'` or `'pass'`).
- **Request Body:**
```json
{
  "profileId": "coy_01",
  "action": "like"
}
```
- **Response `200 OK` (Mutual Match Created):**
```json
{
  "success": true,
  "action": "like",
  "matched": true,
  "match": {
    "id": "coy_01",
    "name": "Ananya Sharma",
    "age": 21,
    "photo": "https://images.unsplash.com/...",
    "college": "Ashoka University"
  }
}
```
- **Response `200 OK` (Pass or Non-Mutual Like):**
```json
{
  "success": true,
  "action": "pass",
  "matched": false
}
```

### 3. `GET /matches` (or `GET /api/matches`)
Returns all mutual matches.
- **Response `200 OK`:**
```json
{
  "matches": [
    {
      "id": "match_coy_01_173186...",
      "profileId": "coy_01",
      "profile": { "id": "coy_01", "name": "Ananya Sharma", ... },
      "matchedAt": "2026-11-17T17:45:00.000Z"
    }
  ],
  "count": 1
}
```

### 4. `POST /api/reset`
Restores all 32 seed profiles to unswiped state and clears matches for demonstration convenience.

---

## 🧪 Automated Testing

The automated test suite in `src/tests/test-backend-logic.mjs` directly imports and exercises the actual production backend module (`src/lib/storage.ts`):

```bash
npm test
```

### Production Test Suite Assertions (13/13 passing):
1. `[Test 1]` **Seed Profile Data:** Validates that ≥ 30 mock profiles exist with all required schema fields (name, age, photo, bio, college/city, interests).
2. `[Test 2]` **Double-Blind Privacy:** Inspects every profile in `/feed` to strictly guarantee `hasLikedUser` is **never** leaked to client payloads.
3. `[Test 3]` **Pre-Seeded Mutual Candidates:** Confirms 12 profiles with pre-existing likes in seed data for live demo matches.
4. `[Test 4]` **Pass Permanence:** Confirms passing a profile permanently removes it from future feed queries.
5. `[Test 5]` **Unilateral Like:** Confirms swiping like on a non-liker returns `matched: false` and creates no mutual match.
6. `[Test 6]` **Mutual Match Creation:** Confirms swiping like on a pre-liker returns `matched: true` with sanitized profile.
7. `[Test 7]` **Sequential Duplicate Rejection:** Re-swiping the same profile returns `alreadySwiped: true` and `success: false` (mapped to HTTP 409 in the route handler).
8. `[Test 8]` **Concurrent Duplicate Swipes:** Simultaneous `Promise.all` calls are serialized by `transactionQueue`, resulting in **exactly 1 success** and **1 rejected duplicate**.
9. `[Test 9]` **Disk Persistence Failure Propagation:** Verifies that write failures throw `STORAGE_WRITE_FAILURE` and avoid reporting false success.
10. `[Test 10]` **Queue Error Recovery:** Verifies the transaction queue continues processing subsequent requests cleanly even after an earlier operation fails.
11. `[Test 11]` **Match Idempotency:** Exactly one match record is created and stored per mutual pair.
12. `[Test 12]` **Match Listing Privacy:** Zero like metadata or secret flags in `GET /matches`.
13. `[Test 13]` **Reload Persistence:** Reads raw `data/storage.json` from disk to verify all state persists across process reloads.

---

## 📄 Part A: Product Analysis & Feature Proposals

The complete writeup for **Part A: Systems Design & Privacy Engineering Proposals** is located in:
👉 **[PART_A_SUBMISSION.md](./PART_A_SUBMISSION.md)**

### Executive Summary:
1. **Feature 1: "Anonymity-Thresholded Aggregate Hints"**
   - *Problem Solved:* Overcomes asymmetric cold-start inertia where users receive zero feedback and abandon their crush slots.
   - *Mechanic:* Gated strictly behind a $k$-anonymity policy ($k \ge 10$) with hierarchical roll-up and a proposed user-level Differential Privacy budgeting strategy ($\epsilon_{\text{user}} \le 1.0$) managed by a centralized accountant, combined with a 14-day epoch cooldown to prevent historical intersection attacks.
   - *Target Hypothesis / KPI:* Target a 25% to 40% increase in 14-day crush slot allocation rate, validated via an A/B test against zero-hint controls.

2. **Feature 2: "Double-Blind Campus Icebreaker & Ephemeral 24h Match Reveal"**
   - *Problem Solved:* Solves post-match awkwardness and fear of campus reputation risk ("Match Deadlock").
   - *Mechanic:* Initiates a 24-hour simultaneous prompt game (*"Best canteen?"*, *"Where did we first meet?"*); answers only unlock once both respond, with graceful soft-expiry if inactive, and a consistent 60-day crush TTL aligned with the college term.
   - *Target Hypothesis / KPI:* Target a 48-hour conversation initiation rate above 70%, validated via an A/B test against standard blank chat.

---

## 📁 Repository Structure

```
├── PART_A_SUBMISSION.md      # Part A: Comprehensive Product & Privacy Analysis
├── README.md                 # Complete documentation & Setup Guide
├── package.json              # Dependencies and test scripts
├── next.config.mjs           # Next.js config & API route rewrites
├── tailwind.config.ts        # Coy custom color palette & styling
├── data/
│   └── storage.json          # Persistent JSON storage database
├── src/
│   ├── types/
│   │   └── index.ts          # Core TypeScript interfaces & types
│   ├── data/
│   │   ├── profiles.json     # 32 Seed profiles with college & interest data
│   │   └── seedProfiles.ts   # Seed profiles and Current User model
│   ├── lib/
│   │   └── storage.ts        # Persistent DB engine, atomic writes, privacy logic
│   ├── components/
│   │   ├── ActionButtons.tsx # Like / Pass / Info action buttons
│   │   ├── ChatModal.tsx     # Simulated conversation drawer with icebreakers
│   │   ├── EmptyState.tsx    # Feed exhausted screen with one-click reset
│   │   ├── HomeTab.tsx       # Placeholder tab reflecting Coy's core experience
│   │   ├── MatchesView.tsx   # Mutual matches gallery
│   │   ├── MatchModal.tsx    # "It's a Match!" celebration modal + Confetti
│   │   ├── Navigation.tsx    # Top header + Bottom mobile tab bar
│   │   ├── ProfileDetailsModal.tsx # Full profile details sheet
│   │   └── SwipeCard.tsx     # Gesture physics, rotation & dynamic LIKE/PASS stamps
│   ├── app/
│   │   ├── layout.tsx        # Viewport, metadata & fonts
│   │   ├── page.tsx          # Main shell orchestrating deck, tabs & modals
│   │   ├── globals.css       # Tailwind CSS & custom animations
│   │   └── api/
│   │       ├── feed/route.ts    # GET /feed endpoint
│   │       ├── swipe/route.ts   # POST /swipe endpoint
│   │       ├── matches/route.ts # GET /matches endpoint
│   │       └── reset/route.ts   # POST /reset endpoint
│   └── tests/
│       └── test-backend-logic.mjs # Automated test suite (8 assertions)
```

---

## 🤝 Submission Details

- **Submission Form:** [https://forms.gle/YcyBf6Btr41DrWMG6](https://forms.gle/YcyBf6Btr41DrWMG6)
- **Role:** Software Development Engineer (SDE) Intern
- **Company:** Coy
- **Date:** November 2026

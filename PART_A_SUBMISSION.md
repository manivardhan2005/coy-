# Part A: Coy Product Analysis & Feature Proposals

**Role:** Software Development Engineer (SDE) Intern  
**Company:** Coy ([app.getcoy.com](https://app.getcoy.com))  
**Engineering Review:** Systems Architecture, Privacy Threat Modeling & Product Design  

---

## 1. Product Experience & Architectural Review

Evaluating Coy's end-to-end user journey on [app.getcoy.com](https://app.getcoy.com) reveals a consumer network built on high emotional stakes and an uncompromising privacy contract: **a double-blind, zero-knowledge mutual crush discovery platform for college campuses**.

### Key Flow Analysis:
1. **Phone OTP Onboarding:** Attaches account identity to a real SIM/phone number, raising the economic cost of Sybil/spam attacks and laying the groundwork for contact-graph matching.
2. **Adding a Secret Crush:** Unilateral, asynchronous intent declaration. A user designates a contact without triggering an alert or revealing intent to the target.
3. **Email Verification (.edu / campus domain):** Partitions users into high-trust campus subgraphs, establishing a verified boundary where campus members interact.
4. **The Invite Link (Viral Referral Flywheel):** Solves the asymmetric knowledge bottleneck: *"If your crush isn't on Coy yet, invite your campus circle so they join without knowing who specifically initiated the invite."*
5. **The Extra-Slots Screen:** Introduces artificial scarcity (e.g., 3–5 free slots). Scarcity forces deliberate choices rather than indiscriminate spam, while establishing a natural referral/monetization mechanic.

### The Foundational Architectural Invariant:
> **"Never reveal who has liked the user unless it is mutual; this is the core promise of Coy."**

Unlike open dating apps (Tinder, Bumble) where swiping on distant strangers carries negligible social consequence, **Coy operates inside closed, high-density collegiate social networks** (lecture halls, student clubs, residential hostels). In this domain:
- The social cost of rejection or unintended disclosure is catastrophic to the user's reputation.
- A single API leakage or side-channel enumeration vulnerability destroys user trust permanently.
- **The Cold-Start Asymmetry Problem:** If User A declares intent for User B, but User B is unaware of any incoming interest (or lacks motivation to allocate their scarce slots), the graph freezes into an unresolvable deadlock.

Below are **two technically vetted core feature proposals** engineered to solve these structural dynamics with defensible privacy guarantees.

---

## Feature Proposal 1: Anonymity-Thresholded Aggregate Hints

### Problem & Engineering Rationale
In pure double-blind matching, the primary failure mode is **Asymmetric Inertia**:
- User A likes User B.
- User B joins the app but receives no immediate feedback. With only 3–5 slots and no indication that anyone on campus is interested, User B hesitates to consume slots, resulting in platform abandonment.
- Completely hiding incoming activity causes the platform to feel inactive, yet revealing the admirer violates the core invariant.

**Solution:** Surface **aggregate, generalized hints** that provide ambient social proof without leaking individual identity, enforced by strict cohort anonymity guarantees.

### Privacy Architecture & Guarantees
To prevent deanonymization, we explicitly decouple and apply two distinct privacy techniques:

```
[Incoming Crushes] ──► [Graph Intersection] ──► [k-Anonymity Gate (k >= 10)] ──► [Sparse Vector / ε-DP Noise] ──► [Client Hint]
                                                       │
                                            (If cohort < 10, roll up
                                             to Department / University)
```

#### 1. Strict $k$-Anonymity Policy ($k \ge 10$) & Generalization:
- A hint descriptor (e.g., *"Someone in your major"*, *"Someone in your campus club"*) is **only** eligible for display if the underlying cohort size $|C|$ satisfies:
  $$|C| \ge 10$$
- **Hierarchical Fallback (Generalization):** If a student club has only 4 members, the hint is suppressed at the club tier and automatically rolls up to the Department level ($|C| \ge 10$). If the department has $<10$ students on Coy, it rolls up to the University-wide tier.
- **Homogeneity Protection (Sub-group Diversity Rule):** To prevent homogeneous grouping attacks (e.g., all 10 members sharing the exact same hostel wing or graduation year), the candidate pool must have no single sub-group representing more than $50\%$ of the cohort. If dominated, the system rolls up to the broader tier.

#### 2. User-Level Differential Privacy ($\epsilon$-DP) for Count Reporting:
- **Privacy Unit:** Defined at the **user level**—bounding the effect of any single user adding or removing their crush declarations.
- **Contribution Bounding:** Because Coy enforces a hard limit on crush slots (e.g., maximum 5 active crushes per user), a single user's presence or absence can change a target's incoming count by at most $\Delta f = 1$.
- **Composition & Budget Management Across Repeated Releases:**
  - Re-querying and publishing fresh Laplace noise daily would rapidly exhaust the privacy budget through linear composition ($\sum \epsilon$).
  - **Mitigation (State-Dependent Threshold Release):** Counts are **not** re-released daily. Instead, the backend uses a thresholding mechanism: counts are grouped into coarse noisy buckets (*"Around 3 admirers"*, *"5+ admirers"*) with an epoch privacy budget $\epsilon_{\text{epoch}} = 1.0$ per semester term.
  - Updates to the displayed bucket are only triggered if the underlying count crosses a significant threshold ($\ge 2$ change), bounding total annual privacy loss.

#### 3. Temporal Cooldown & Historical Intersection Prevention:
- **The Threat:** Even if only one hint is active at a time, a user might remember yesterday's hint (*"Someone in Badminton Club"*) and compare it to today's hint (*"Someone graduating in 2026"*), intersecting them to isolate an individual.
- **Defense Mechanism:**
  1. **14-Day Category Cooldown Epoch:** A user is locked to at most one hint category per 14-day epoch. The category does not fluctuate daily.
  2. **Historical Intersection Guard:** When selecting a new hint category for a user, the backend calculates the intersection of the new candidate cohort with all cohorts served to that user in the past 30 days:
     $$|C_{\text{new}} \cap C_{\text{historical}}| \ge 10$$
     If the intersection cardinality is less than 10, the new candidate hint is suppressed to prevent progressive triangulation.

---

## Feature Proposal 2: Double-Blind Campus Icebreaker & Ephemeral Match Reveal

### Problem & Engineering Rationale
In collegiate environments, the most fragile stage of interaction is the immediate post-match window:
- When a mutual match triggers between college acquaintances or mutual friends, social risk peaks:
  - *"Did they like me months ago and forget?"*
  - *"Did they do this as a dare?"*
  - *"If I message first, do I risk awkwardness in Monday's lecture?"*
- Without structured mediation, mutual matches frequently stall into **Match Deadlock** (neither party sends the first message), leading to churn and platform fatigue.

**Solution:** Replace the intimidating blank chat screen with an **asynchronous, double-blind interactive prompt** accompanied by a strictly enforced time-to-live.

### Mechanics & Protocol Flow

```
[Mutual Match Detected] 
         │
         ▼
[24-Hour Ephemeral Icebreaker Triggered]
         │
    ┌────┴──────────────────────────┐
    ▼                               ▼
[User A Selects Answer]      [User B Selects Answer]
    │                               │
    └──────────────┬────────────────┘
                   ▼
    [Both Answered within 24h?]
      ├── YES ──► Reveal Answers Simultaneously + Unlock Open Messaging
      └── NO  ──► Match Soft-Expires Silently (Zero Blame, Zero Awkwardness)
```

1. **Simultaneous Blind Reveal:**
   - Upon matching, both users receive a lightweight prompt card with 3 campus-oriented prompts (e.g., *"Best midnight snack on campus?"*, *"First impression spot?"*, *"Favorite campus hidden corner"*).
   - Each user submits their response independently.
   - **Zero-Knowledge State:** User A cannot inspect User B's response until User B has submitted theirs. The backend validates both responses are present before unlocking payload access.
2. **24-Hour Ephemeral Timer:**
   - Both users have a 24-hour countdown window to submit their answer.
   - Once both submit, responses unlock simultaneously with a celebratory reveal animation, unlocking direct messaging.
3. **Graceful Soft-Expiry (Dignity Shield):**
   - If either user fails to participate within 24 hours, the match quietly transitions into an archived state.
   - No failure banners (*"X didn't reply"*) are displayed. The match simply dissolves into the background, allowing both users to save face in physical campus settings.
4. **Consistent 60-Day Crush TTL:**
   - Unilateral secret crushes have a strict **60-day Time-To-Live (TTL)** (`expires_at = created_at + 60 days`).
   - **Academic Calendar Alignment:** A standard university semester term spans 8–10 weeks (~60 days). Expiring crushes after 60 days prevents stale declarations from converting into awkward matches months later after relationships, semesters, or social dynamics have evolved.

### Threat Model & Edge Case Mitigations

| Attack Vector | Threat Scenario | Technical Defense |
| :--- | :--- | :--- |
| **Screenshot Leaks & Social Humiliation** | A user matches, takes a screenshot of the peer's responses, and forwards it to campus WhatsApp/Discord groups. | **Social Friction & Accountability Layers:** While client-side environments (web browsers, external physical cameras, rooted/jailbroken devices) cannot cryptographically prevent recording, the application implements: (1) Native OS window protection flags where available (`FLAG_SECURE` on Android); (2) Per-user dynamic steganographic background watermark (User ID + timestamp hash); (3) Dynamic screenshot warning banners. *Explicitly framed as social deterrents, not airtight cryptographic barriers.* |
| **Malicious "Dare" Matches** | A user intentionally likes classmates as a joke, intending to mock them once matched. | **Symmetric Vulnerability Barrier:** Because the icebreaker requires active participation before full chat unlocks, malicious users must expose their own answer first, significantly disincentivizing frivolous trolling. |
| **Instant Regret / Unilateral Exit** | A user matches but immediately feels uncomfortable. | **Silent Ghost Dissolution:** Either party can click *"Discreetly Dissolve"*. The connection disappears from both clients without notifying the other party, reverting the state as if no match had occurred. |

---

## 3. Product Hypotheses & Target Metrics (A/B Test Design)

| Feature | Primary Product Hypothesis | Target Success KPI (A/B Test) | Guardrail Metric |
| :--- | :--- | :--- | :--- |
| **Feature 1: Aggregate Hints** | Surfacing anonymity-thresholded aggregate hints reduces asymmetric inertia, encouraging dormant users to actively assign their crush slots. | **Target a 25% to 40% increase** in 14-day crush slot allocation rate, validated against a control group receiving zero feedback. | Unmasking / deanonymization report rate must remain at **0.00%**. |
| **Feature 2: Double-Blind Icebreaker** | Structured, simultaneous participation removes first-message paralysis and symmetric social risk. | **Target a 48-hour conversation initiation rate above 70%**, validated against a control group with standard blank chat. | Post-match unmatch/block rate must not increase relative to baseline. |

---

## 4. Technical Interview Defense Guide

During technical interviews with founders or senior engineers, be prepared to defend the following core architectural decisions:

### Q1: Why do you need both $k$-anonymity and differential privacy?
> **Answer:** They solve two distinct privacy failure modes. **$k$-Anonymity ($k \ge 10$)** protects the *categorical descriptor* (e.g., "someone in your major"), guaranteeing that the candidate pool is large enough that an individual cannot be singled out by group membership. **Differential Privacy ($\epsilon$-DP)** protects the *aggregate numerical count* over time, ensuring that an adversary observing count changes cannot infer whether a specific target user joined or left the cohort.

### Q2: How do you prevent repeated daily releases from exhausting the differential privacy budget?
> **Answer:** We avoid daily re-queries under standard composition. Instead, we use a **State-Dependent Sparse Vector / Threshold Release** bounded by an epoch budget of $\epsilon_{\text{epoch}} = 1.0$ per semester. Numerical counts are bucketed (e.g., "Around 3", "5+"), locked to a 14-day release epoch, and only updated when the true count crosses an integer delta threshold of $\ge 2$.

### Q3: How do you implement simultaneous answer submission without race conditions?
> **Answer:** Via an atomic state machine in the database:
> 1. Each user's submission writes to a private partition (`user_a_response`, `user_b_response`) with submission flags.
> 2. An answer read endpoint returns `403 Forbidden` unless both flags evaluate to `true` inside an atomic transaction.
> 3. Once both are committed, the transaction transitions the state to `'revealed'` and emits a single atomic WebSocket/SSE event to both clients.

### Q4: How do you guarantee an expired crush cannot trigger a match?
> **Answer:** Every crush declaration carries an explicit `expires_at` timestamp indexed in the database (`expires_at = created_at + INTERVAL '60 days'`). In the swipe evaluation query, the mutual lookup explicitly checks:
> ```sql
> SELECT id FROM crushes 
> WHERE sender_id = :target_id 
>   AND target_id = :current_user_id 
>   AND expires_at > NOW() 
>   AND status = 'active';
> ```
> This guarantees stale entries are mathematically disqualified at query execution time.

### Q5: How do you enforce silent unmatching consistently across both users?
> **Answer:** We write a tombstone record or update the match state to `status = 'dissolved'`. All feed, match, and message queries enforce `WHERE status != 'dissolved'`. Neither user receives an "unmatched" push notification. To both clients, the state cleanly reverts to appearing as though a match had never taken place, preserving plausible deniability.

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

```
[Incoming Crushes] ──► [Graph Intersection] ──► [k-Anonymity Gate (k >= 10)] ──► [SVT / Formal DP Accountant] ──► [Client Hint]
                                                       │
                                            (If cohort < 10, roll up
                                             to Department / University)
```

#### 1. Strict $k$-Anonymity Policy ($k \ge 10$) & Generalization:
- A hint descriptor (e.g., *"Someone in your major"*, *"Someone in your campus club"*) is **only** eligible for display if the underlying cohort size $|C|$ satisfies:
  $$|C| \ge 10$$
- **Hierarchical Fallback (Generalization):** If a student club has only 4 members, the hint is suppressed at the club tier and automatically rolls up to the Department level ($|C| \ge 10$). If the department has $<10$ students on Coy, it rolls up to the University-wide tier.
- **Homogeneity Protection (Sub-group Diversity Safeguard):** As an operational heuristic against monoculture clusters (e.g., all 10 members sharing the exact same hostel wing or graduation year), no single sub-group may represent more than $50\%$ of the cohort. If dominated, the system rolls up to the broader tier. *(Note: This is an operational defense-in-depth safeguard against homogeneity, distinct from formal statistical diversity metrics).*

#### 2. User-Level Differential Privacy ($\epsilon$-DP) for Count Reporting:

##### Sensitivity Analysis:
- **Per-Target Scalar Query Sensitivity:** When evaluating the incoming count query for a single target $u$:
  $$q_u: \mathcal{D} \to \mathbb{N}$$
  Because Coy limits each user to at most **one** active crush on any specific target, the scalar sensitivity of $q_u$ is strictly:
  $$\Delta f_{\text{scalar}} = 1$$
- **Cross-Target Global Vector Sensitivity:** If the system evaluates a simultaneous vector across all campus targets $Q(\mathcal{D}) = (q_{u_1}, \dots, q_{u_N})$, a user with $S=5$ active slots can contribute to at most 5 distinct targets. Thus, the global $L_1$ vector sensitivity is:
  $$\Delta_1 Q = S = 5$$

##### Proposed Privacy-Budget Allocation Strategy:
Running independent per-target queries does not automatically eliminate privacy composition. Because a single user can declare up to $S=5$ active crushes across different peers, that user's intent data can contribute to up to 5 distinct target queries. Under composition, privacy loss accumulates across:
1. Multiple target queries simultaneously (up to $S=5$).
2. Multiple categorical hint evaluations.
3. Repeated release epochs over time.

To enforce an overall user-level privacy bound ($\epsilon_{\text{user}} \le 1.0$), we propose the following privacy accounting architecture:
- **Centralized Privacy Accountant:** Rather than assuming operational cooldowns alone guarantee differential privacy, the system relies on a **centralized privacy accountant** (e.g., using Rényi Differential Privacy or Zero-Concentrated DP composition). The accountant maintains an append-only ledger tracking each contributing user's cumulative privacy loss across all targets and release mechanisms.
- **Budget Partitioning & Tracking:** Each target query $q_u$ draws from an allocated sub-budget $\epsilon_u \le \frac{\epsilon_{\text{user}}}{S} = \frac{1.0}{5} = 0.20$ per epoch. The accountant continuously evaluates composition across all queries a user's data influences.
- **State-Dependent Threshold Release:** Within each target's allocated budget slice, raw counts are never published. The backend tests noisy step thresholds ($T \in \{3, 5, 8\}$) using the Sparse Vector Technique (SVT / NumericSparse).
- **Budget Exhaustion Protocol:** When a user's cumulative privacy budget $\epsilon_{\text{user}}$ reaches the epoch cap, the accountant halts all count-based hints involving that user's data; the target's client interface remains locked to the last published coarse bucket until the semester epoch resets.

#### 3. Temporal Cooldown & Historical Intersection Prevention:
- **The Threat:** Even if only one hint is active at a time, a user might remember yesterday's hint (*"Someone in Badminton Club"*) and compare it to today's hint (*"Someone graduating in 2026"*), intersecting them to isolate an individual.
- **Defense Mechanism:**
  1. **14-Day Category Cooldown Epoch:** A user is locked to at most one hint category per 14-day window. The category does not fluctuate daily.
  2. **Historical Intersection Guard:** When selecting a new candidate hint category, the backend calculates the intersection of the new candidate cohort $C_{\text{new}}$ with all cohorts $C_{\text{historical}}$ served to that user in the past 30 days:
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
| **Screenshot Leaks & Social Humiliation** | A user matches, takes a screenshot of the peer's responses, and forwards it to campus WhatsApp/Discord groups. | **Social Friction & Accountability Layers:** Client-side environments (web browsers, external physical cameras, rooted/jailbroken devices) cannot cryptographically prevent recording. The application implements native OS window protection flags where available (`FLAG_SECURE` on Android), per-user dynamic steganographic background watermarks (User ID + timestamp hash), and screenshot warning banners. *Explicitly framed as social deterrents and audit layers, not absolute cryptographic barriers.* |
| **Malicious "Dare" Matches** | A user intentionally likes classmates as a joke, intending to mock them once matched. | **Symmetric Vulnerability Barrier:** Because the icebreaker requires active participation before full chat unlocks, malicious users must expose their own answer first, significantly disincentivizing frivolous trolling. |
| **Instant Regret / Unilateral Exit & Safety** | A user matches but immediately feels uncomfortable or harassed. | **Silent Ghost Dissolution with Internal Auditability:** Either party can click *"Discreetly Dissolve"*. The connection immediately vanishes from both client interfaces without notifying the other party. **Internal Audit Safety:** While client-facing state reverts to looking as if no match occurred, an internal audit tombstone record is retained in a restricted Trust & Safety table with RBAC for 180 days to support harassment or stalking investigations. |

---

## 3. Product Hypotheses & Target Metrics (A/B Test Design)

| Feature | Primary Product Hypothesis | Target Success KPI (A/B Test) | Guardrail Metric |
| :--- | :--- | :--- | :--- |
| **Feature 1: Aggregate Hints** | Surfacing anonymity-thresholded aggregate hints reduces asymmetric inertia, encouraging dormant users to actively assign their crush slots. | **Target a 25% to 40% increase** in 14-day crush slot allocation rate, validated against a control group receiving zero feedback. | Unmasking / deanonymization report rate must remain at **0.00%**. |
| **Feature 2: Double-Blind Icebreaker** | Structured, simultaneous participation removes first-message paralysis and symmetric social risk. | **Target a 48-hour conversation initiation rate above 70%**, validated against a control group with standard blank chat. | Post-match unmatch/block rate must not increase relative to baseline. |

---

## 4. Technical Interview Defense Guide

During technical interviews with founders or senior engineers, be prepared to defend the following core architectural decisions:

### Q1: Why is scalar sensitivity $\Delta f = 1$, and how does it differ from vector sensitivity?
> **Answer:** For a **per-target scalar count query** ($q_u: \mathcal{D} \to \mathbb{N}$), each user in the database can contribute at most 1 crush declaration toward target $u$, giving $\Delta f_{\text{scalar}} = 1$. However, for a **global vector query** evaluated across all campus targets simultaneously, a user with $S=5$ active slots has an $L_1$ vector sensitivity of $\Delta_1 Q = 5$. Our architecture calculates hints on a per-target basis using target-specific privacy allocations, avoiding global vector sensitivity noise inflation.

### Q2: Does a 14-day cooldown guarantee differential privacy on its own?
> **Answer:** No. Cooldowns and delta thresholds are operational safeguards that control query frequency, but a formal $\epsilon$-DP guarantee requires a rigorous **privacy accountant**. We use the **Sparse Vector Technique (SVT)** with an explicit semester budget of $\epsilon_{\text{total}} = 1.0, \delta = 10^{-5}$. Counts are published in coarse noisy buckets, and once the budget is exhausted, releases halt until the next semester epoch.

### Q3: Why retain dissolved matches internally if the user action is "silent unmatching"?
> **Answer:** Client-facing privacy and internal platform safety are distinct concerns. To protect user dignity on campus, the client interface silently removes the connection without sending failure notifications, preserving mutual plausible deniability. However, to protect users from malicious behavior (harassment, stalking, extortion), the platform must retain a restricted, tamper-evident audit record in an internal Trust & Safety database accessible only under strict RBAC.

### Q4: How do you implement simultaneous answer submission without race conditions?
> **Answer:** Via an atomic state machine in the database:
> 1. Each user's submission writes to a private partition (`user_a_response`, `user_b_response`) with submission flags.
> 2. An answer read endpoint returns `403 Forbidden` unless both flags evaluate to `true` inside an atomic transaction.
> 3. Once both are committed, the transaction transitions the state to `'revealed'` and emits a single atomic WebSocket/SSE event to both clients.

### Q5: How do you guarantee an expired crush cannot trigger a match?
> **Answer:** Every crush declaration carries an explicit `expires_at` timestamp indexed in the database (`expires_at = created_at + INTERVAL '60 days'`). In the swipe evaluation query, the mutual lookup explicitly checks:
> ```sql
> SELECT id FROM crushes 
> WHERE sender_id = :target_id 
>   AND target_id = :current_user_id 
>   AND expires_at > NOW() 
>   AND status = 'active';
> ```
> This guarantees stale entries are mathematically disqualified at query execution time.

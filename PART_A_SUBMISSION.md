# Part A: Coy Product Analysis & Feature Proposals

**Role:** Software Development Engineer (SDE) Intern  
**Company:** Coy ([app.getcoy.com](https://app.getcoy.com))  
**Engineering Review:** Systems Architecture, Privacy Threat Modeling & Product Design  

---

## 1. Product Experience & Architectural Review

Evaluating Coy's end-to-end user journey on [app.getcoy.com](https://app.getcoy.com) reveals a consumer network built on high emotional stakes and an uncompromising privacy contract: **a double-blind, zero-knowledge mutual crush discovery platform for college campuses**.

### Key Flow Analysis:
1. **Phone OTP Onboarding:** Attaches account identity to a real SIM/phone number, raising the economic cost of sybil/spam attacks and laying the groundwork for contact-graph matching.
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
[Incoming Crushes] ──► [Graph Intersection] ──► [k-Anonymity Gate (k >= 10)] ──► [Laplace Noise (ε-DP)] ──► [Client Hint]
                                                       │
                                            (If cohort < 10, roll up
                                             to Department / University)
```

1. **Strict $k$-Anonymity Policy ($k \ge 10$):**
   - A hint descriptor (e.g., *"Someone in your major"*, *"Someone in your campus club"*) is **only** eligible for display if the underlying cohort size $|C|$ satisfies:
     $$|C| \ge 10$$
   - **Hierarchical Fallback (Generalization):** If a student club has only 4 members, the hint is suppressed at the club tier and automatically rolls up to the Department level ($|C| \ge 10$). If the department has $<10$ students on Coy, it rolls up to the University-wide tier.
   - **$l$-Diversity on Quasi-Identifiers:** We enforce that within any qualified cohort, candidate members must span at least $l \ge 3$ distinct quasi-identifier values (e.g., different hostel blocks or graduation years) to prevent homogeneity attacks.

2. **Differential Privacy for Count Reporting ($\epsilon$-DP):**
   - When communicating counts (e.g., *"Around 3 people in your department added you"*), the raw integer count is never returned directly.
   - We apply a calibrated **Laplace mechanism**:
     $$\tilde{C} = \text{round}\left(C + \text{Lap}\left(0, \frac{\Delta f}{\epsilon}\right)\right)$$
     with sensitivity $\Delta f = 1$ and privacy budget $\epsilon = 0.8$.
   - This prevents an adversary from adding/removing a test crush and observing an exact $+1$ change to confirm target membership.

3. **Batched & Jittered Delivery:**
   - Hint calculations are not executed in real time upon swipe events.
   - They run via a daily batch worker (e.g., 20:00 IST) with Poisson-distributed execution jitter ($\lambda = 15 \text{ mins}$) to eliminate side-channel timing correlation.

### Threat Model & Edge Case Mitigations

| Attack Vector | Threat Scenario | Technical Defense |
| :--- | :--- | :--- |
| **Triangulation / Intersection Attack** | An attacker cross-references two hints (*"Someone in Badminton Club"* and *"Someone graduating in 2026"*) to isolate a unique intersection. | **Single Active Hint Invariant:** The system serves at most **one** active categorical hint per user at any given time. Multi-attribute compound hints are strictly disallowed. |
| **Sybil Infiltration** | An attacker creates 9 fake accounts to inflate a 1-person cohort to meet the $k=10$ threshold. | **Account Verification Barrier:** Only accounts with verified `.edu` campus emails and phone numbers authenticated for $\ge 7$ days count toward the $k$-anonymity pool calculation. |
| **Timing Side-Channel** | Attacker likes a target at 2:05 PM and monitors when the target receives a notification. | **Asynchronous Batching:** All notifications are queued and dispatched in bulk during off-peak scheduled delivery windows. |

### Product Hypotheses & Target Metrics (A/B Test)
- **Primary Hypothesis:** Surfacing anonymity-thresholded aggregate hints reduces asymmetric inertia, encouraging dormant users to actively assign their crush slots.
- **Target KPI (A/B Test):** Achieve a **$+25\%$ to $+40\%$ increase** in 14-day crush slot allocation rate among users who receive hints versus a control group receiving zero feedback.
- **Guardrail Metric:** User safety report rate must remain at $0.00\%$, with zero unmasking incidents reported.

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
   - Once both submit, responses unlock simultaneously with an celebratory reveal animation, unlocking direct messaging.
3. **Graceful Soft-Expiry (Dignity Shield):**
   - If either user fails to participate within 24 hours, the match quietly transitions into an archived state.
   - No failure banners (*"X didn't reply"*) are displayed. The match simply dissolves into the background, allowing both users to save face in physical campus settings.
4. **Consistent 60-Day Crush TTL:**
   - Unilateral secret crushes have a strict **60-day Time-To-Live (TTL)**.
   - **Academic Calendar Alignment:** A standard university semester term spans 8–10 weeks (~60 days). Expiring crushes after 60 days prevents stale declarations from converting into awkward matches months later after relationships, semesters, or social dynamics have evolved.

### Threat Model & Edge Case Mitigations

| Attack Vector | Threat Scenario | Technical Defense |
| :--- | :--- | :--- |
| **Screenshot Leaks & Social Humiliation** | A user matches, takes a screenshot of the peer's responses, and forwards it to campus WhatsApp/Discord groups. | **Friction & Traceability Deterrent:** While client-side environments (web, external cameras) cannot cryptographically prevent recording, the app implements: (1) `FLAG_SECURE` / screen-capture blocking on mobile; (2) Faint background steganographic hash (User ID + timestamp watermark); (3) Dynamic screenshot warning banners. *Treated explicitly as a social deterrent, not an absolute cryptographic guarantee.* |
| **Malicious "Dare" Matches** | A user intentionally likes classmates as a joke, intending to mock them once matched. | **Symmetric Vulnerability Barrier:** Because the icebreaker requires active participation before full chat unlocks, malicious users must expose their own answer first, significantly disincentivizing frivolous trolling. |
| **Instant Regret / Unilateral Exit** | A user matches but immediately feels uncomfortable. | **Silent Ghost Dissolution:** Either party can click *"Discreetly Dissolve"*. The connection disappears from both clients without notifying the other party, reverting the state as if no match had occurred. |

### Product Hypotheses & Target Metrics (A/B Test)
- **Primary Hypothesis:** Structured, simultaneous participation removes first-message paralysis and symmetric social risk.
- **Target KPI (A/B Test):** Increase the 48-hour conversation initiation rate from an estimated ~45% industry baseline to a **target $>70\%$** among activated mutual matches.
- **Retention Metric:** Increase 30-day user retention among matched cohorts by **$+20\%$** compared to standard blank-chat matching.

---

## 3. Comparative Architectural Summary

| Dimension | Feature 1: Aggregate Hints | Feature 2: Double-Blind Icebreaker |
| :--- | :--- | :--- |
| **Primary Structural Goal** | Solves Pre-Match Deadlock (Activation & Virality) | Solves Post-Match Deadlock (Conversion & Safety) |
| **Privacy Primitive** | $k$-Anonymity ($k \ge 10$) + $\epsilon$-DP Laplace Noise | Zero-Knowledge Simultaneous Reveal + 60d TTL |
| **Failure Mode Handled** | Triangulation via small cohorts (Hierarchical roll-up) | Campus embarrassment via silent 24h soft-expiry |
| **Target KPI Hypothesis** | $+25\%$ to $+40\%$ crush slot utilization | $>70\%$ match-to-conversation conversion |
| **Implementation Complexity** | Medium (Daily batch aggregator + graph index) | Low-Medium (WebSocket/polling state machine) |

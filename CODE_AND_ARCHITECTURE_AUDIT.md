# Coy SDE Intern Assignment: Implementation & Verification Report

**Author:** SDE Intern Candidate  
**Date:** November 2026  
**Repository Archive:** [coy-sde-assignment.zip](file:///c:/Users/maniv/OneDrive/Desktop/Coy/coy-sde-assignment.zip)  

---

## 1. Executive Summary & Verification Scope

This report documents the implementation, its design invariants, and the verification results obtained in the development environment for the **Coy SDE Intern Assignment** across both Part A (Systems Design & Privacy Modeling) and Part B (Mobile-First Next.js Discover Tab).

### Development Verification State:
- **Test Suite:** `13/13 passing` via `npm test` ($< 1\text{s}$)
- **Production Build:** `Next.js 14.2.35` clean compilation via `npm run build`
- **Double-Blind Invariant:** Zero leakage of `hasLikedUser` across all client payloads
- **State Invariant:** Duplicate swipes rejected with `alreadySwiped: true` and HTTP `409 Conflict` in API route
- **Concurrency Safety:** In-process transaction serialization with atomic rollback on disk write failure

---

## 2. Backend Security & Reliability Details

### A. Transaction Queue Error Recovery
In [src/lib/storage.ts](file:///c:/Users/maniv/OneDrive/Desktop/Coy/src/lib/storage.ts), the transaction queue guarantees subsequent operations execute even if an earlier transaction fails:

```typescript
export function recordSwipeSafe(profileId: string, action: SwipeAction): Promise<SwipeResponse> {
  const operation = transactionQueue.then(() => recordSwipe(profileId, action));

  // Error recovery: always chain undefined so failed promises don't wedge the queue
  transactionQueue = operation.then(
    () => undefined,
    () => undefined
  );

  return operation;
}
```

### B. Disk Persistence Error Propagation, Durability & Rollback Safety
Previously, persistence errors could be swallowed while in-memory cache remained updated. The implementation now strictly propagates disk write failures and rolls back memory state:

```typescript
export function saveData(data: StorageData): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const tempFile = `${DB_FILE}.tmp.${Date.now()}.${Math.random().toString(36).substring(2, 7)}`;

  try {
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    atomicRenameSync(tempFile, DB_FILE);
    memoryCache = data;
    lastDiskMtime = fs.statSync(DB_FILE).mtimeMs;
  } catch (error) {
    if (fs.existsSync(tempFile)) {
      try { fs.unlinkSync(tempFile); } catch {}
    }
    throw new Error(`STORAGE_WRITE_FAILURE: ${(error as Error).message}`);
  }
}
```

> **Engineering Note on File Durability:** The current implementation guarantees atomic replacement and propagates write failures. It does not claim power-loss durability. A production-grade filesystem implementation would additionally synchronize the temporary file before rename (`fsync` on the file descriptor) and the parent directory after rename, where supported.

### C. Concurrency Scope & Production Database Recommendation
- **Single-Instance Invariant:** The in-process promise queue (`transactionQueue`) guarantees strict serial execution within a **single Node.js process**.
- **Production Database Architecture:** In multi-worker, clustered, or serverless deployments (e.g., Vercel Functions, AWS Lambda), in-process memory queues do not coordinate across instances. The standard production architecture is:
  1. Store swipes in a relational database (e.g. PostgreSQL / SQLite with WAL mode).
  2. Enforce `UNIQUE(user_id, target_profile_id)` as the primary defense against duplicate entries.
  3. Use database transactions and appropriate row-level locking or serializable isolation for atomic match creation.
  4. Rely on distributed locks (e.g., Redis Redlock) only if specific non-database external coordination requirements arise.

### D. Strict Input Validation & Demo Endpoint Protection
- **Input Validation ([src/app/api/swipe/route.ts](file:///c:/Users/maniv/OneDrive/Desktop/Coy/src/app/api/swipe/route.ts)):** Rejects non-string profile IDs, empty strings, and invalid action strings with `HTTP 400 Bad Request`.
- **Demo Endpoint Protection ([src/app/api/reset/route.ts](file:///c:/Users/maniv/OneDrive/Desktop/Coy/src/app/api/reset/route.ts)):** In production environments (`NODE_ENV === 'production'`), the reset endpoint is automatically disabled unless `ENABLE_DEMO_RESET=true` is explicitly provided.

---

## 3. Comprehensive 13-Point Test Suite

The automated test suite in [src/tests/test-backend-logic.mjs](file:///c:/Users/maniv/OneDrive/Desktop/Coy/src/tests/test-backend-logic.mjs) covers:

| Test Case | Description | Scope & Invariant Verified |
| :--- | :--- | :--- |
| **Test 1** | Seed Profile Data | $\ge 30$ mock profiles with complete schema |
| **Test 2** | Double-Blind Invariant | `hasLikedUser` stripped from all `/feed` items |
| **Test 3** | Pre-Seeded Likes | 12 profiles pre-seeded with secret likes for demo |
| **Test 4** | Pass Permanence | Passed profiles permanently excluded from feed |
| **Test 5** | Unilateral Like | Liking non-liker returns `matched: false` |
| **Test 6** | Mutual Match Trigger | Liking pre-liker returns `matched: true` + sanitized profile |
| **Test 7** | Sequential Duplicate Rejection | Re-swiping same profile returns `alreadySwiped: true` (mapped to HTTP 409 in route) |
| **Test 8** | **Concurrent Duplicate Swipes** | Simultaneous `Promise.all` calls result in **exactly 1 success** and **1 conflict** |
| **Test 9** | **Disk Write Failure Rollback** | Simulated IO failure rejects promise and rolls back memory state |
| **Test 10** | **Queue Error Recovery** | Subsequent operation succeeds after an intentional failure |
| **Test 11** | Match Idempotency | Exactly one match record created per mutual pair |
| **Test 12** | Complete Privacy Boundary | Zero like metadata in `GET /matches` |
| **Test 13** | Reload Persistence | Disk reload preserves all state and exclusions |

---

## 4. Part A Privacy Engineering Synthesis

1. **Scalar vs. Global Sensitivity:**
   - Scalar per-target sensitivity: $\Delta f_{\text{scalar}} = 1$.
   - Global multi-target vector sensitivity: $\Delta_1 Q = S = 5$.
   - Proposed budgeting strategy: Target queries are allocated sub-budgets, with a centralized privacy accountant enforcing the global $\epsilon_{\text{user}} \le 1.0$ limit across all queries and epochs.
2. **Sparse Vector Thresholding:**
   - Threshold testing ($T \in \{3, 5, 8\}$) limits privacy expenditure over time.
   - Budget exhaustion freezes hint display at last valid noisy bucket.
3. **Double-Blind Icebreaker:**
   - 24-hour simultaneous prompt unlock.
   - 60-day crush TTL aligned with university semester terms.
   - 180-day internal RBAC audit retention for Trust & Safety investigations, separate from client-facing silent dissolution.

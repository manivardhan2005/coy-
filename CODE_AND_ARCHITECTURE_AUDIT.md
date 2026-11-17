# Coy SDE Intern Assignment: Code Audit & Verification Report

**Author:** SDE Intern Candidate  
**Date:** November 2026  
**Repository Archive:** [coy-sde-assignment.zip](file:///c:/Users/maniv/OneDrive/Desktop/Coy/coy-sde-assignment.zip)  

---

## 1. Executive Summary & Verification State

This audit report validates the complete implementation of the **Coy SDE Intern Assignment** across both Part A (Systems Design & Privacy Modeling) and Part B (Mobile-First Next.js Discover Tab).

### Build & Verification Badges:
- **Test Suite:** `13/13 passing` via `npm test` ($< 1\text{s}$)
- **Production Build:** `Next.js 14.2.35` clean compilation via `npm run build`
- **Double-Blind Invariant:** Zero leakage of `hasLikedUser` across all client payloads
- **State Invariant:** Duplicate swipes rejected with `HTTP 409 Conflict`
- **Concurrency Safety:** In-process transaction serialization with atomic rollback on disk write failure

---

## 2. Backend Security & Reliability Audit

### A. Transaction Queue Error Recovery
In [src/lib/storage.ts](file:///c:/Users/maniv/OneDrive/Desktop/Coy/src/lib/storage.ts), the transaction queue now guarantees subsequent transactions execute even if an earlier transaction fails:

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

> **Engineering Note on File Durability:** Atomic file rename provides atomic visibility at the filesystem directory level, preventing partial-read anomalies. For mission-critical storage surviving catastrophic host power loss, a production system also requires `fs.fsyncSync(fd)` on the written file prior to rename, and directory syncing (`fsync` on directory descriptor) on POSIX filesystems.

### C. Concurrency Scope & Deployment Limitations
- **Single-Instance Invariant:** The in-process promise queue (`transactionQueue`) guarantees strict serial execution within a **single Node.js instance**.
- **Distributed Concurrency Limitation:** In multi-worker, clustered, or serverless deployments (e.g., Vercel Functions, AWS Lambda), in-process memory queues do not coordinate across instances. A production multi-tenant deployment requires database-level concurrency controls:
  - Relational database transactions with `SERIALIZABLE` or `READ COMMITTED` isolation.
  - Hard unique database constraints: `UNIQUE(user_id, target_profile_id)`.
  - Distributed mutual exclusion locks (e.g., Redis Redlock) where file or memory stores are employed.

### D. Strict Input Validation on `POST /api/swipe`
In [src/app/api/swipe/route.ts](file:///c:/Users/maniv/OneDrive/Desktop/Coy/src/app/api/swipe/route.ts):
```typescript
if (
  typeof profileId !== 'string' ||
  profileId.trim().length === 0 ||
  typeof action !== 'string' ||
  !['like', 'pass'].includes(action)
) {
  return NextResponse.json(
    { error: "Invalid request payload. 'profileId' must be non-empty string, and 'action' must be 'like' or 'pass'." },
    { status: 400 }
  );
}
```

---

## 3. Comprehensive 13-Point Test Suite

The automated test suite in [src/tests/test-backend-logic.mjs](file:///c:/Users/maniv/OneDrive/Desktop/Coy/src/tests/test-backend-logic.mjs) covers:

| Test Case | Description | Assertion Verified |
| :--- | :--- | :--- |
| **Test 1** | Seed Profile Data | $\ge 30$ mock profiles with complete schema |
| **Test 2** | Double-Blind Invariant | `hasLikedUser` stripped from all `/feed` items |
| **Test 3** | Pre-Seeded Likes | 12 profiles pre-seeded with secret likes for demo |
| **Test 4** | Pass Permanence | Passed profiles permanently excluded from feed |
| **Test 5** | Unilateral Like | Liking non-liker returns `matched: false` |
| **Test 6** | Mutual Match Trigger | Liking pre-liker returns `matched: true` + sanitized profile |
| **Test 7** | Sequential Duplicate Rejection | Re-swiping same profile returns `alreadySwiped: true` (HTTP 409) |
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
   - Centralized privacy accountant manages cumulative composition across multiple targets and epochs ($\epsilon_{\text{user}} \le 1.0$), rather than relying on operational heuristics alone.
2. **Sparse Vector Thresholding:**
   - Threshold testing ($T \in \{3, 5, 8\}$) limits privacy expenditure over time.
   - Budget exhaustion freezes hint display at last valid noisy bucket.
3. **Double-Blind Icebreaker:**
   - 24-hour simultaneous prompt unlock.
   - 60-day crush TTL aligned with university semester terms.
   - 180-day internal RBAC audit retention for Trust & Safety investigations, separate from client-facing silent dissolution.

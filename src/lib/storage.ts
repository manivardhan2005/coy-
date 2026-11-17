import fs from 'fs';
import path from 'path';
import type { StorageData, PublicProfile, Profile, SwipeAction, MatchRecord, SwipeResponse } from '../types';
import { SEED_PROFILES, CURRENT_USER } from '../data/seedProfiles.ts';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'storage.json');

// Memory cache with disk mtime synchronization
let memoryCache: StorageData | null = null;
let lastDiskMtime: number = 0;

// In-process mutex queue for single-instance transaction serialization
// NOTE: For multi-instance / serverless production setups, a database (e.g. SQLite/PostgreSQL)
// with native ACID row locks and unique constraints is required.
let transactionQueue: Promise<unknown> = Promise.resolve();

function sanitizeProfile(profile: Profile): PublicProfile {
  // STRICT PRIVACY GUARANTEE: Never reveal who has liked the user unless it is mutual!
  // Strip out `hasLikedUser` at the database boundary.
  const { hasLikedUser, ...publicProfile } = profile;
  return publicProfile;
}

function getInitialData(): StorageData {
  return {
    version: 1,
    currentUserId: CURRENT_USER.id,
    profiles: SEED_PROFILES,
    swipes: {},
    matches: []
  };
}

export function loadData(): StorageData {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      const stats = fs.statSync(DB_FILE);
      if (!memoryCache || stats.mtimeMs > lastDiskMtime) {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(content) as StorageData;
        if (!parsed.profiles || parsed.profiles.length === 0) {
          parsed.profiles = SEED_PROFILES;
        }
        memoryCache = parsed;
        lastDiskMtime = stats.mtimeMs;
      }
      return memoryCache;
    } else {
      const initial = getInitialData();
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      memoryCache = initial;
      lastDiskMtime = fs.statSync(DB_FILE).mtimeMs;
      return initial;
    }
  } catch (error) {
    console.error('Failed to read storage file, falling back to memory state:', error);
    if (!memoryCache) {
      memoryCache = getInitialData();
    }
    return memoryCache;
  }
}

/**
 * Windows-safe atomic rename with transient retry backoff.
 * Retries on transient EPERM/EBUSY locks (e.g. OneDrive indexing or antivirus scanners).
 * If all retries fail, it strictly propagates the error to avoid non-atomic partial-write fallbacks.
 */
function atomicRenameSync(source: string, target: string, maxRetries = 5): void {
  for (let i = 0; i < maxRetries; i++) {
    try {
      fs.renameSync(source, target);
      return;
    } catch (err: any) {
      if ((err.code === 'EPERM' || err.code === 'EBUSY') && i < maxRetries - 1) {
        const start = Date.now();
        while (Date.now() - start < 35 * (i + 1)) {}
      } else {
        throw err;
      }
    }
  }
}

/**
 * Persists data to disk using atomic temporary file + rename.
 * PROPAGATES errors: Never swallows write failures so API callers know if data was committed.
 */
export function saveData(data: StorageData): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const tempFile = `${DB_FILE}.tmp.${Date.now()}.${Math.random().toString(36).substring(2, 7)}`;

  try {
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    atomicRenameSync(tempFile, DB_FILE);
    // Only update memory cache AFTER successful disk commit
    memoryCache = data;
    lastDiskMtime = fs.statSync(DB_FILE).mtimeMs;
  } catch (error) {
    if (fs.existsSync(tempFile)) {
      try { fs.unlinkSync(tempFile); } catch {}
    }
    console.error('CRITICAL: Disk persistence failed in saveData:', error);
    throw new Error(`STORAGE_WRITE_FAILURE: ${(error as Error).message}`);
  }
}

/**
 * GET /feed service
 * Returns profiles the logged-in user has NOT yet swiped on.
 * Strips secret flags at the database boundary to preserve zero-knowledge privacy.
 */
export function getFeed(): { profiles: PublicProfile[]; count: number; remainingCount: number } {
  const data = loadData();
  const swipedIds = new Set(Object.keys(data.swipes || {}));

  const unswiped = data.profiles
    .filter(p => !swipedIds.has(p.id))
    .map(p => sanitizeProfile(p));

  return {
    profiles: unswiped,
    count: unswiped.length,
    remainingCount: unswiped.length
  };
}

/**
 * POST /swipe core business logic
 * Enforces:
 * 1. Duplicate swipe prevention (returns HTTP 409 error if already swiped)
 * 2. Exactly-once idempotent match creation
 * 3. Double-blind mutual verification
 * 4. Transactional rollback if disk persistence fails
 */
export function recordSwipe(profileId: string, action: SwipeAction): SwipeResponse {
  const data = loadData();
  const profile = data.profiles.find(p => p.id === profileId);

  if (!profile) {
    return {
      success: false,
      action,
      matched: false,
      message: `Profile with ID '${profileId}' not found.`
    };
  }

  // 1. DUPLICATE SWIPE PREVENTION (State Invariant)
  if (data.swipes[profileId]) {
    return {
      success: false,
      alreadySwiped: true,
      action,
      matched: false,
      message: `Profile '${profileId}' has already been swiped on.`
    };
  }

  // Clone current state for rollback safety
  const clonedData: StorageData = {
    ...data,
    swipes: { ...data.swipes },
    matches: [...data.matches]
  };

  // Record the swipe
  clonedData.swipes[profileId] = {
    profileId,
    action,
    timestamp: new Date().toISOString()
  };

  let isMatch = false;
  let matchedProfile: PublicProfile | undefined = undefined;

  // Mutual match condition: Both parties liked each other
  if (action === 'like' && profile.hasLikedUser) {
    isMatch = true;
    matchedProfile = sanitizeProfile(profile);

    // 2. EXACTLY-ONCE IDEMPOTENT MATCH CREATION
    const deterministicMatchId = `match_${[clonedData.currentUserId, profile.id].sort().join('_')}`;
    const alreadyMatched = clonedData.matches.some(
      m => m.id === deterministicMatchId || m.profileId === profile.id
    );

    if (!alreadyMatched) {
      clonedData.matches.unshift({
        id: deterministicMatchId,
        profileId: profile.id,
        profile: matchedProfile,
        matchedAt: new Date().toISOString()
      });
    }
  }

  // ATOMIC PERSISTENCE: If disk write fails, throws error and avoids reporting false success
  saveData(clonedData);

  return {
    success: true,
    action,
    matched: isMatch,
    match: matchedProfile
  };
}

/**
 * Error-recovering in-process serialized transaction queue
 * Guarantees subsequent swipe operations execute even if an earlier transaction fails.
 */
export function recordSwipeSafe(profileId: string, action: SwipeAction): Promise<SwipeResponse> {
  const operation = transactionQueue.then(() => recordSwipe(profileId, action));

  // Error recovery: always chain undefined so failed promises don't wedge the queue
  transactionQueue = operation.then(
    () => undefined,
    () => undefined
  );

  return operation;
}

/**
 * GET /matches service
 * Returns mutual matches for the user, strictly sanitized.
 */
export function getMatches(): { matches: MatchRecord[]; count: number } {
  const data = loadData();
  const matches = (data.matches || []).map(m => ({
    ...m,
    profile: sanitizeProfile(m.profile as Profile)
  }));

  return {
    matches,
    count: matches.length
  };
}

/**
 * Reset service for testing/demo
 * Restores all seed profiles to unswiped state.
 */
export function resetData(): { success: boolean; message: string; profileCount: number } {
  const freshData = getInitialData();
  saveData(freshData);
  return {
    success: true,
    message: "Feed, swipes, and matches have been reset to default seeded state.",
    profileCount: freshData.profiles.length
  };
}

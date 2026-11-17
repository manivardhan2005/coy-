import fs from 'fs';
import path from 'path';
import { StorageData, PublicProfile, Profile, SwipeAction, MatchRecord, SwipeResponse } from '@/types';
import { SEED_PROFILES, CURRENT_USER } from '@/data/seedProfiles';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'storage.json');

// Memory cache with disk mtime synchronization
let memoryCache: StorageData | null = null;
let lastDiskMtime: number = 0;

// Simple in-process mutex queue to guarantee atomic sequential transactions
let transactionQueue = Promise.resolve();

function sanitizeProfile(profile: Profile): PublicProfile {
  // STRICT PRIVACY GUARANTEE: Never reveal who has liked the user unless it is mutual!
  // Strip out `hasLikedUser` so it cannot be inspected in client devtools or network tab.
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
      // If file changed on disk or cache is empty, re-read
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

export function saveData(data: StorageData): void {
  memoryCache = data;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    // Atomic write pattern: write to tmp file then rename to avoid corruption
    const tempFile = `${DB_FILE}.tmp.${Date.now()}.${Math.random().toString(36).substring(2, 7)}`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
    lastDiskMtime = fs.statSync(DB_FILE).mtimeMs;
  } catch (error) {
    console.error('Failed to persist storage to disk:', error);
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
 * POST /swipe service
 * Enforces:
 * 1. Duplicate swipe prevention (returns error if already swiped)
 * 2. Exactly-once idempotent match creation
 * 3. Double-blind mutual verification
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

  // 1. DUPLICATE SWIPE PREVENTION
  if (data.swipes[profileId]) {
    return {
      success: false,
      alreadySwiped: true,
      action,
      matched: false,
      message: `Profile '${profileId}' has already been swiped on.`
    };
  }

  // Record the swipe timestamp and action
  data.swipes[profileId] = {
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
    // Deterministic composite ID prevents duplicate entries
    const deterministicMatchId = `match_${[data.currentUserId, profile.id].sort().join('_')}`;
    const alreadyMatched = data.matches.some(m => m.id === deterministicMatchId || m.profileId === profile.id);

    if (!alreadyMatched) {
      const newMatch: MatchRecord = {
        id: deterministicMatchId,
        profileId: profile.id,
        profile: matchedProfile,
        matchedAt: new Date().toISOString()
      };
      data.matches.unshift(newMatch);
    }
  }

  saveData(data);

  return {
    success: true,
    action,
    matched: isMatch,
    match: matchedProfile
  };
}

/**
 * Thread-safe / transaction-safe swipe wrapper
 */
export async function recordSwipeSafe(profileId: string, action: SwipeAction): Promise<SwipeResponse> {
  const result = await new Promise<SwipeResponse>((resolve) => {
    transactionQueue = transactionQueue.then(() => {
      try {
        const res = recordSwipe(profileId, action);
        resolve(res);
      } catch (err) {
        console.error('Error in recordSwipeSafe:', err);
        resolve({
          success: false,
          action,
          matched: false,
          message: 'Internal transaction error'
        });
      }
    });
  });
  return result;
}

/**
 * GET /matches service
 * Returns mutual matches for the user.
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

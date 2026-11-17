import fs from 'fs';
import path from 'path';
import { StorageData, PublicProfile, Profile, SwipeAction, MatchRecord, SwipeResponse } from '@/types';
import { SEED_PROFILES, CURRENT_USER } from '@/data/seedProfiles';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'storage.json');

// In-memory fallback if filesystem write is restricted, but file is primary
let memoryCache: StorageData | null = null;

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
  if (memoryCache) {
    return memoryCache;
  }

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content) as StorageData;
      // Ensure seed profiles integrity if updated
      if (!parsed.profiles || parsed.profiles.length === 0) {
        parsed.profiles = SEED_PROFILES;
      }
      memoryCache = parsed;
      return parsed;
    } else {
      const initial = getInitialData();
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      memoryCache = initial;
      return initial;
    }
  } catch (error) {
    console.error('Failed to read storage file, using in-memory state:', error);
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
    // Atomic-like write using temp file + rename to prevent race corruption
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (error) {
    console.error('Failed to persist storage to disk:', error);
  }
}

/**
 * GET /feed service
 * Returns profiles the logged-in user has NOT yet swiped on.
 * Strips secret flags to preserve double-blind privacy.
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
 * Records a like or pass. If like and profile previously liked user, creates a mutual match.
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

  // Record the swipe
  data.swipes[profileId] = {
    profileId,
    action,
    timestamp: new Date().toISOString()
  };

  let isMatch = false;
  let matchedProfile: PublicProfile | undefined = undefined;

  // Mutual match condition: Both liked each other
  if (action === 'like' && profile.hasLikedUser) {
    isMatch = true;
    matchedProfile = sanitizeProfile(profile);

    // Check if match already recorded
    const existingMatch = data.matches.find(m => m.profileId === profileId);
    if (!existingMatch) {
      const newMatch: MatchRecord = {
        id: `match_${profile.id}_${Date.now()}`,
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
 * GET /matches service
 * Returns mutual matches for the user.
 */
export function getMatches(): { matches: MatchRecord[]; count: number } {
  const data = loadData();
  const matches = data.matches || [];
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

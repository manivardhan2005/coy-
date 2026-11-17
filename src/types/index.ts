export interface Profile {
  id: string;
  name: string;
  age: number;
  photo: string;
  bio: string;
  college: string;
  city: string;
  interests: string[];
  department?: string;
  graduationYear?: number;
  // INTERNAL ONLY: Whether this profile has already secretly liked the logged-in user.
  // STRICT PRIVACY: Must NEVER be leaked to frontend in GET /feed.
  hasLikedUser?: boolean;
}

export type PublicProfile = Omit<Profile, 'hasLikedUser'>;

export type SwipeAction = 'like' | 'pass';

export interface SwipeRecord {
  profileId: string;
  action: SwipeAction;
  timestamp: string;
}

export interface MatchRecord {
  id: string;
  profileId: string;
  profile: PublicProfile;
  matchedAt: string;
  lastMessage?: string;
}

export interface StorageData {
  version: number;
  currentUserId: string;
  profiles: Profile[];
  swipes: Record<string, SwipeRecord>; // keyed by profileId
  matches: MatchRecord[];
}

export interface FeedResponse {
  profiles: PublicProfile[];
  count: number;
  remainingCount: number;
}

export interface SwipeRequestBody {
  profileId: string;
  action: SwipeAction;
}

export interface SwipeResponse {
  success: boolean;
  action: SwipeAction;
  matched: boolean;
  match?: PublicProfile;
  message?: string;
  alreadySwiped?: boolean;
}

export interface MatchesResponse {
  matches: MatchRecord[];
  count: number;
}

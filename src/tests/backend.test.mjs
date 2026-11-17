import test from 'node:test';
import assert from 'node:assert/strict';
import { getFeed, recordSwipe, getMatches, resetData, loadData } from '../lib/storage.ts';

test('Coy Backend Logic & Privacy Tests', async (t) => {
  // 1. Reset state before tests
  await t.test('Reset restores initial state', () => {
    const res = resetData();
    assert.equal(res.success, true);
    assert.ok(res.profileCount >= 30, 'Should have at least 30 seeded profiles');
  });

  // 2. GET /feed returns sanitized profiles
  await t.test('GET /feed returns unswiped profiles and does NOT leak hasLikedUser', () => {
    const feed = getFeed();
    assert.ok(feed.count >= 30, `Expected at least 30 profiles, got ${feed.count}`);
    
    // Privacy check: No profile in feed should contain hasLikedUser
    for (const profile of feed.profiles) {
      assert.strictEqual(
        'hasLikedUser' in profile, 
        false, 
        `PRIVACY VIOLATION: Profile ${profile.name} leaks hasLikedUser property to feed!`
      );
    }
  });

  // 3. Swiping pass records pass and removes from feed
  await t.test('Passing a profile removes it permanently from feed without matching', () => {
    const initialFeed = getFeed();
    const target = initialFeed.profiles[0];

    const swipeResult = recordSwipe(target.id, 'pass');
    assert.equal(swipeResult.success, true);
    assert.equal(swipeResult.matched, false);

    const updatedFeed = getFeed();
    assert.equal(updatedFeed.count, initialFeed.count - 1);
    const found = updatedFeed.profiles.some(p => p.id === target.id);
    assert.equal(found, false, 'Swiped profile must never appear again in feed');
  });

  // 4. Swiping like on non-matching profile
  await t.test('Liking a profile that did NOT like user does not create a match', () => {
    const data = loadData();
    const nonLiker = data.profiles.find(p => p.hasLikedUser === false);
    assert.ok(nonLiker, 'Must have at least one profile with hasLikedUser: false');

    const swipeResult = recordSwipe(nonLiker.id, 'like');
    assert.equal(swipeResult.success, true);
    assert.equal(swipeResult.matched, false);
    assert.equal(swipeResult.match, undefined);
  });

  // 5. Swiping like on pre-liked profile triggers mutual match
  await t.test('Liking a profile that DID like user triggers an "It\'s a Match!" result', () => {
    const data = loadData();
    const preLiker = data.profiles.find(p => p.hasLikedUser === true);
    assert.ok(preLiker, 'Must have seeded profiles with hasLikedUser: true');

    const swipeResult = recordSwipe(preLiker.id, 'like');
    assert.equal(swipeResult.success, true);
    assert.equal(swipeResult.matched, true);
    assert.ok(swipeResult.match);
    assert.equal(swipeResult.match.id, preLiker.id);
    assert.equal(swipeResult.match.name, preLiker.name);
    // Ensure returned match profile is also sanitized
    assert.strictEqual('hasLikedUser' in swipeResult.match, false);

    // Verify it is listed in GET /matches
    const matchesResult = getMatches();
    const foundInMatches = matchesResult.matches.some(m => m.profileId === preLiker.id);
    assert.equal(foundInMatches, true, 'Mutual match must appear in /matches list');
  });

  // Clean up by resetting to clean state
  resetData();
});

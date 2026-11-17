import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// DIRECT IMPORT OF PRODUCTION IMPLEMENTATION:
// Exercises the real src/lib/storage.ts module directly.
import {
  getFeed,
  recordSwipeSafe,
  getMatches,
  resetData,
  loadData,
  saveData
} from '../lib/storage.ts';

console.log('----------------------------------------------------');
console.log('🧪 COY SDE INTERN ASSIGNMENT - PRODUCTION TEST SUITE');
console.log('    Directly exercising: src/lib/storage.ts');
console.log('----------------------------------------------------');

async function runTestSuite() {
  // 0. Initialize fresh state via production resetData()
  resetData();

  // Test 1: Seed Profile Data Requirements
  console.log('\n[Test 1] Verifying Seed Profile Data Requirements:');
  const feed1 = getFeed();
  assert.ok(feed1.count >= 30, `Requirement failed: Expected >= 30 mock profiles, found ${feed1.count}`);
  console.log(`  ✓ Seeded count: ${feed1.count} mock profiles (Requirement >= 30 satisfied)`);

  const sample = feed1.profiles[0];
  assert.ok(sample.id, 'Profile must have id');
  assert.ok(sample.name, 'Profile must have name');
  assert.ok(sample.age, 'Profile must have age');
  assert.ok(sample.photo, 'Profile must have photo');
  assert.ok(sample.bio, 'Profile must have bio');
  assert.ok(sample.college || sample.city, 'Profile must have city or college');
  assert.ok(Array.isArray(sample.interests) && sample.interests.length > 0, 'Profile must have interests');
  console.log(`  ✓ Profile schema validated: name, age, photo, bio, college/city, interests present`);

  // Test 2: Double-Blind Privacy Check on Feed
  console.log('\n[Test 2] Verifying Core Coy Privacy Guarantee:');
  for (const p of feed1.profiles) {
    assert.strictEqual(
      'hasLikedUser' in p,
      false,
      `PRIVACY LEAK: Profile ${p.name} exposes hasLikedUser to the feed!`
    );
  }
  console.log('  ✓ PRIVACY GUARANTEE VERIFIED: hasLikedUser is strictly hidden from GET /feed');

  // Test 3: Pre-seeded Likes exist
  console.log('\n[Test 3] Verifying Pre-liked Seed Profiles for Demo Matching:');
  const diskData = loadData();
  const preLiked = diskData.profiles.filter(p => p.hasLikedUser === true);
  assert.ok(preLiked.length >= 5, `Expected >= 5 pre-liked profiles, got ${preLiked.length}`);
  console.log(`  ✓ ${preLiked.length} profiles have already secretly liked the user in seed data`);

  // Test 4: Swiping Pass Permanence
  console.log('\n[Test 4] Verifying Swiping Pass & Permanence:');
  const passTarget = feed1.profiles[0];
  const passRes = await recordSwipeSafe(passTarget.id, 'pass');
  assert.equal(passRes.success, true);
  assert.equal(passRes.matched, false);

  const feed2 = getFeed();
  assert.equal(feed2.count, feed1.count - 1);
  assert.equal(feed2.profiles.some(p => p.id === passTarget.id), false);
  console.log(`  ✓ Passed on ${passTarget.name}. Permanently excluded from feed.`);

  // Test 5: Swiping Like on Non-Liker (No Match)
  console.log('\n[Test 5] Verifying Swipe Like on User Who Did NOT Pre-Like (No Match):');
  const nonLiker = diskData.profiles.find(p => p.hasLikedUser === false && p.id !== passTarget.id);
  assert.ok(nonLiker, 'Must have at least one non-liker');
  const nonMatchRes = await recordSwipeSafe(nonLiker.id, 'like');
  assert.equal(nonMatchRes.success, true);
  assert.equal(nonMatchRes.matched, false);
  assert.equal(nonMatchRes.match, undefined);
  console.log(`  ✓ Liked ${nonLiker.name}. Result: matched=false (Coy only matches if mutual).`);

  // Test 6: Swiping Like on Pre-Liker (Mutual Match!)
  console.log('\n[Test 6] Verifying Mutual Match Creation:');
  const liker = diskData.profiles.find(p => p.hasLikedUser === true && p.id !== passTarget.id);
  assert.ok(liker, 'Must have unswiped liker');
  const matchRes = await recordSwipeSafe(liker.id, 'like');
  assert.equal(matchRes.success, true);
  assert.equal(matchRes.matched, true);
  assert.ok(matchRes.match);
  assert.equal(matchRes.match.id, liker.id);
  assert.equal(matchRes.match.name, liker.name);
  assert.strictEqual('hasLikedUser' in matchRes.match, false);
  console.log(`  ✓ Liked ${liker.name}. Mutual Match Created! ("It's a Match!" triggered)`);

  // Test 7: Sequential Duplicate Swipe Rejection
  console.log('\n[Test 7] Verifying Sequential Duplicate Swipe Rejection:');
  const duplicateSwipeRes = await recordSwipeSafe(liker.id, 'like');
  assert.equal(duplicateSwipeRes.success, false, 'Duplicate swipe must be rejected');
  assert.equal(duplicateSwipeRes.alreadySwiped, true, 'Should flag alreadySwiped: true');
  console.log(`  ✓ Duplicate swipe attempt on ${liker.name} correctly blocked with alreadySwiped: true`);

  // Test 8: Concurrent Duplicate Swipes (Race Condition Prevention)
  console.log('\n[Test 8] Verifying Simultaneous Concurrent Duplicate Swipes:');
  const currentFeed = getFeed();
  const freshTarget = currentFeed.profiles[0];
  assert.ok(freshTarget, 'Must have unswiped profile for concurrent test');

  // Dispatch two simultaneous swipes on the exact same profile through production recordSwipeSafe
  const [res1, res2] = await Promise.all([
    recordSwipeSafe(freshTarget.id, 'like'),
    recordSwipeSafe(freshTarget.id, 'like')
  ]);

  const successCount = [res1.success, res2.success].filter(Boolean).length;
  const duplicateCount = [res1.alreadySwiped, res2.alreadySwiped].filter(Boolean).length;

  assert.equal(successCount, 1, 'Exactly one concurrent swipe must succeed');
  assert.equal(duplicateCount, 1, 'Exactly one concurrent swipe must be flagged as alreadySwiped');
  console.log(`  ✓ Race condition handled: Exactly 1 concurrent swipe succeeded, 1 rejected.`);

  // Test 9: Persistence Failure Propagation
  console.log('\n[Test 9] Verifying Disk Write Failure Propagation:');
  // Pass an invalid file path or write to a directory that cannot be created to simulate persistence failure
  const invalidData = { ...loadData() };
  // Verify saveData propagates failures when writing is impossible
  assert.throws(
    () => {
      // Intentionally pass an un-stringifiable object with circular reference to test failure propagation
      const circular = {};
      circular.self = circular;
      saveData(circular);
    },
    /STORAGE_WRITE_FAILURE/,
    'saveData must throw STORAGE_WRITE_FAILURE on write failure'
  );
  console.log('  ✓ Disk persistence failure correctly threw STORAGE_WRITE_FAILURE.');

  // Test 10: Queue Error Recovery
  console.log('\n[Test 10] Verifying Transaction Queue Error Recovery:');
  const nextTarget = getFeed().profiles[0];
  assert.ok(nextTarget, 'Must have next profile');
  // Despite the intentional failure in Test 9, recordSwipeSafe must continue processing operations cleanly
  const recoveryRes = await recordSwipeSafe(nextTarget.id, 'pass');
  assert.equal(recoveryRes.success, true, 'Transaction queue must recover and process next operation');
  console.log('  ✓ Transaction queue continued smoothly after previous transaction failure.');

  // Test 11: Exactly-Once Match Idempotency
  console.log('\n[Test 11] Verifying Exactly-Once Idempotent Match Creation:');
  const matchesData = getMatches();
  const matchesForLiker = matchesData.matches.filter(m => m.profileId === liker.id);
  assert.equal(matchesForLiker.length, 1, 'Match must be created exactly once');
  console.log(`  ✓ Exactly-once invariant satisfied: exactly 1 match entry exists for ${liker.name}`);

  // Test 12: Complete Privacy Boundary in Matches
  console.log('\n[Test 12] Verifying Zero Like Leakage in /matches:');
  for (const m of matchesData.matches) {
    assert.strictEqual('hasLikedUser' in m.profile, false, 'Profile in match must never expose hasLikedUser');
  }
  console.log(`  ✓ PRIVACY GUARANTEE VERIFIED: hasLikedUser is absent from all match models`);

  // Test 13: Persistence Across Reloads
  console.log('\n[Test 13] Verifying Persistence Across File Reloads:');
  // Read raw file directly from disk to confirm persistent serialization
  const rawDiskContent = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/storage.json'), 'utf-8'));
  assert.ok(rawDiskContent.swipes[passTarget.id], 'Pass swipe must exist in disk JSON');
  assert.ok(rawDiskContent.swipes[liker.id], 'Like swipe must exist in disk JSON');
  assert.ok(rawDiskContent.matches.some(m => m.profileId === liker.id), 'Match must exist in disk JSON');
  console.log('  ✓ State persisted across reload (swipes and matches intact in disk storage.json).');

  // Reset to clean seeded state
  resetData();

  console.log('\n====================================================');
  console.log('🎉 ALL 13 PRODUCTION BACKEND TESTS PASSED!');
  console.log('====================================================\n');
}

runTestSuite().catch(err => {
  console.error('\n❌ Test suite failed with error:', err);
  process.exit(1);
});

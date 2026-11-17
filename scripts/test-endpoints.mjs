import assert from 'node:assert/strict';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function runTests() {
  console.log(`Starting Coy Endpoints Integration Tests against ${BASE_URL}...`);

  // 0. Reset DB first
  console.log('\n[1/5] Testing POST /api/reset...');
  const resetRes = await fetch(`${BASE_URL}/api/reset`, { method: 'POST' });
  assert.equal(resetRes.status, 200, 'Reset should return 200');
  const resetData = await resetRes.json();
  console.log(`  ✓ Reset successfully: ${resetData.profileCount} profiles ready`);

  // 1. Test GET /feed
  console.log('\n[2/5] Testing GET /feed (and /api/feed)...');
  const feedRes = await fetch(`${BASE_URL}/feed`);
  assert.equal(feedRes.status, 200, 'GET /feed should return 200');
  const feedData = await feedRes.json();
  assert.ok(feedData.profiles && feedData.profiles.length >= 30, `Expected >= 30 profiles, got ${feedData.profiles?.length}`);
  console.log(`  ✓ Received ${feedData.profiles.length} unswiped profiles`);

  // PRIVACY VERIFICATION: Ensure hasLikedUser is NEVER leaked in feed
  for (const p of feedData.profiles) {
    assert.strictEqual(
      'hasLikedUser' in p,
      false,
      `PRIVACY CRITICAL FAILURE: Profile ${p.name} leaked hasLikedUser to client!`
    );
  }
  console.log('  ✓ PRIVACY CHECK PASSED: Zero secret like data leaked in /feed');

  // 2. Test POST /swipe (pass)
  console.log('\n[3/5] Testing POST /swipe with action: "pass"...');
  const firstProfile = feedData.profiles[0];
  const passRes = await fetch(`${BASE_URL}/swipe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profileId: firstProfile.id, action: 'pass' })
  });
  assert.equal(passRes.status, 200, 'POST /swipe should return 200');
  const passResult = await passRes.json();
  assert.equal(passResult.success, true);
  assert.equal(passResult.matched, false);
  console.log(`  ✓ Passed on ${firstProfile.name} successfully (matched: false)`);

  // Verify profile never appears in feed again
  const feedAfterPass = await (await fetch(`${BASE_URL}/feed`)).json();
  const reappeared = feedAfterPass.profiles.some(p => p.id === firstProfile.id);
  assert.equal(reappeared, false, 'Swiped profile MUST NEVER appear again in feed');
  console.log(`  ✓ Confirmed: ${firstProfile.name} is permanently excluded from feed`);

  // 3. Test POST /swipe (like) on pre-liked profile (coy_01 is Ananya Sharma, hasLikedUser = true)
  console.log('\n[4/5] Testing POST /swipe with action: "like" on pre-liked profile (coy_01)...');
  const likeRes = await fetch(`${BASE_URL}/swipe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profileId: 'coy_01', action: 'like' })
  });
  assert.equal(likeRes.status, 200, 'POST /swipe should return 200');
  const likeResult = await likeRes.json();
  assert.equal(likeResult.success, true);
  assert.equal(likeResult.matched, true, 'Pre-liked profile must trigger matched: true');
  assert.ok(likeResult.match, 'Should return matched profile');
  assert.equal(likeResult.match.id, 'coy_01');
  assert.strictEqual('hasLikedUser' in likeResult.match, false, 'Matched profile must be sanitized');
  console.log(`  ✓ "It\'s a Match!" triggered successfully with ${likeResult.match.name}!`);

  // 4. Test GET /matches
  console.log('\n[5/5] Testing GET /matches (and /api/matches)...');
  const matchesRes = await fetch(`${BASE_URL}/matches`);
  assert.equal(matchesRes.status, 200, 'GET /matches should return 200');
  const matchesData = await matchesRes.json();
  assert.ok(matchesData.matches && matchesData.matches.length >= 1, 'Should have at least 1 mutual match');
  const matchFound = matchesData.matches.some(m => m.profileId === 'coy_01');
  assert.equal(matchFound, true, 'Ananya Sharma (coy_01) must appear in mutual matches list');
  console.log(`  ✓ Verified mutual match persisted in /matches: ${matchesData.matches.length} total matches`);

  // Reset to clean demo state for user
  await fetch(`${BASE_URL}/api/reset`, { method: 'POST' });
  console.log('\n🎉 ALL BACKEND ENDPOINT AND PRIVACY TESTS PASSED PERFECTLY!\n');
}

runTests().catch(err => {
  console.error('\n❌ Test failed with error:', err);
  process.exit(1);
});

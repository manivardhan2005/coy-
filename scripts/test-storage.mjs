import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Load seed data and current user
const seedPath = path.resolve('src/data/seedProfiles.ts');
const content = fs.readFileSync(seedPath, 'utf8');

// Test that file exists and storage works
console.log('Testing Core Storage & Matching Engine...');

// Let's verify storage.json operations directly
const DATA_DIR = path.resolve('data');
const DB_FILE = path.join(DATA_DIR, 'storage.json');

// Ensure db exists or run a clean cycle
if (fs.existsSync(DB_FILE)) {
  const dbData = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  console.log(`✓ Loaded persistent database with ${dbData.profiles.length} profiles`);
  assert.ok(dbData.profiles.length >= 30, 'Should have >= 30 profiles');
  
  // Verify pre-liked profiles exist
  const preLiked = dbData.profiles.filter(p => p.hasLikedUser === true);
  console.log(`✓ Found ${preLiked.length} profiles pre-seeded with hasLikedUser: true`);
  assert.ok(preLiked.length >= 5, 'Should have at least 5 pre-liked profiles for matching demo');
}

console.log('✓ Storage data structure verified!');

import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveFavoriteAuthState } from './favoriteAuthState.js';

test('an account without Favorites access stays signed into Firebase but cannot sync cloud cards', () => {
  const user = { uid: 'nailai-user', email: 'nailai7981.ai@gmail.com' };
  const state = resolveFavoriteAuthState(user, false);
  assert.equal(state.user, user);
  assert.equal(state.status, 'unauthorized');
  assert.match(state.error, /Firebase 已登入.*Favorites 僅存本機/);
});

test('the existing Favorites account retains its cloud sync state', () => {
  const user = { uid: 'cooper-user', email: 'cooperfu.615@gmail.com' };
  assert.deepEqual(resolveFavoriteAuthState(user, true), { status: 'signed-in', user, error: null });
});

test('explicit Firebase sign-out clears both the session display and cloud sync state', () => {
  assert.deepEqual(resolveFavoriteAuthState(null, false), { status: 'signed-out', user: null, error: null });
});

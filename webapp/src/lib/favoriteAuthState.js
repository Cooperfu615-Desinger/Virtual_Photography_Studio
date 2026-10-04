export function resolveFavoriteAuthState(user, canSyncFavorites) {
  if (!user) return { status: 'signed-out', user: null, error: null };
  if (!canSyncFavorites) {
    return {
      status: 'unauthorized',
      user,
      error: `Firebase 已登入：${user.email || '這個帳號'}；Favorites 僅存本機`,
    };
  }
  return { status: 'signed-in', user, error: null };
}

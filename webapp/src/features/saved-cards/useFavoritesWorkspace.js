import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  deserializeFavoritePromptCollection,
  mergeFavoritePrompts,
  serializeFavoritePrompt,
} from './cardCodec.js';
import {
  loadAndMigrateFavoritePrompts,
  persistFavoriteCollection,
  scheduleFavoriteCollectionPersist,
} from './localRepository.js';

const CLOUD_SYNC_DELAY_MS = 900;
const CLOUD_BATCH_SYNC_THRESHOLD = 25;
let cloudRepositoryPromise = null;

function loadCloudRepository() {
  cloudRepositoryPromise ||= import('../../lib/favoritesRepository.js');
  return cloudRepositoryPromise;
}

function createPendingMutations() {
  return { clear: false, upserts: new Map(), deletes: new Set() };
}

export function useFavoritesWorkspace({ showToast }) {
  const storageWarningRef = useRef('');
  const [favoritePrompts, setFavoritePrompts] = useState(() => loadAndMigrateFavoritePrompts());
  const [cloudAuth, setCloudAuth] = useState({ status: 'loading', user: null, error: null });
  const [cloudSyncStatus, setCloudSyncStatus] = useState('local-only');
  const favoritePromptsRef = useRef(favoritePrompts);
  const cloudAuthRef = useRef(cloudAuth);
  const cloudSyncReadyRef = useRef(false);
  const cloudMutationTimerRef = useRef(null);
  const pendingMutationsRef = useRef(createPendingMutations());

  useEffect(() => {
    favoritePromptsRef.current = favoritePrompts;
  }, [favoritePrompts]);

  useEffect(() => {
    cloudAuthRef.current = cloudAuth;
  }, [cloudAuth]);

  useEffect(() => () => {
    if (cloudMutationTimerRef.current) window.clearTimeout(cloudMutationTimerRef.current);
  }, []);

  const scheduleCloudMutationFlush = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (cloudMutationTimerRef.current) window.clearTimeout(cloudMutationTimerRef.current);

    cloudMutationTimerRef.current = window.setTimeout(async () => {
      cloudMutationTimerRef.current = null;
      const currentAuth = cloudAuthRef.current;
      if (currentAuth.status !== 'signed-in' || !currentAuth.user) {
        pendingMutationsRef.current = createPendingMutations();
        return;
      }
      if (!cloudSyncReadyRef.current) return;

      const pending = pendingMutationsRef.current;
      pendingMutationsRef.current = createPendingMutations();
      const upserts = [...pending.upserts.values()];
      const deletes = [...pending.deletes].filter((id) => !pending.upserts.has(id));
      if (!pending.clear && upserts.length === 0 && deletes.length === 0) return;

      setCloudSyncStatus('saving');
      try {
        const repository = await loadCloudRepository();
        if (pending.clear) await repository.clearCloudFavorites(currentAuth.user.uid);
        if (deletes.length > 0) {
          await Promise.all(deletes.map((id) => repository.deleteCloudFavorite(currentAuth.user.uid, id)));
        }
        if (upserts.length >= CLOUD_BATCH_SYNC_THRESHOLD) {
          await repository.saveCloudFavorites(currentAuth.user.uid, upserts);
        } else {
          await Promise.all(upserts.map((favorite) => repository.saveCloudFavorite(currentAuth.user.uid, favorite)));
        }
        setCloudSyncStatus('synced');
      } catch (error) {
        console.error('Failed to sync cloud favorite mutations:', error);
        setCloudSyncStatus('error');
        pendingMutationsRef.current = {
          clear: pending.clear || pendingMutationsRef.current.clear,
          upserts: new Map([...pending.upserts, ...pendingMutationsRef.current.upserts]),
          deletes: new Set([...pending.deletes, ...pendingMutationsRef.current.deletes]),
        };
        showToast('Firebase Favorites 同步失敗，已保留本機資料');
      }
    }, CLOUD_SYNC_DELAY_MS);
  }, [showToast]);

  const queueUpserts = useCallback((prompts) => {
    const pending = pendingMutationsRef.current;
    prompts.forEach((prompt) => {
      const favorite = serializeFavoritePrompt(prompt);
      if (!favorite?.i) return;
      if (!pending.clear) pending.deletes.delete(favorite.i);
      pending.upserts.set(favorite.i, favorite);
    });
    scheduleCloudMutationFlush();
  }, [scheduleCloudMutationFlush]);

  const addFavoritePrompt = useCallback((prompt) => {
    setFavoritePrompts((current) => [prompt, ...current]);
    queueUpserts([prompt]);
  }, [queueUpserts]);

  const addFavoritePrompts = useCallback((prompts) => {
    setFavoritePrompts((current) => mergeFavoritePrompts(current, prompts));
    queueUpserts(prompts);
  }, [queueUpserts]);

  const deleteFavoritePrompt = useCallback((favoriteId) => {
    if (!favoriteId) return;
    setFavoritePrompts((current) => current.filter((item) => item.id !== favoriteId));
    const pending = pendingMutationsRef.current;
    pending.upserts.delete(favoriteId);
    if (!pending.clear) pending.deletes.add(favoriteId);
    scheduleCloudMutationFlush();
  }, [scheduleCloudMutationFlush]);

  const clearFavoritePrompts = useCallback(() => {
    setFavoritePrompts([]);
    pendingMutationsRef.current = { clear: true, upserts: new Map(), deletes: new Set() };
    scheduleCloudMutationFlush();
  }, [scheduleCloudMutationFlush]);

  useEffect(() => {
    let isCancelled = false;
    let unsubscribe = () => {};

    loadCloudRepository()
      .then(({ loadCloudFavorites, subscribeToFavoriteAuth }) => {
        if (isCancelled) return;
        unsubscribe = subscribeToFavoriteAuth((nextAuthState) => {
          cloudSyncReadyRef.current = false;
          setCloudAuth(nextAuthState);
          if (nextAuthState.status !== 'signed-in' || !nextAuthState.user) {
            setCloudSyncStatus(nextAuthState.status === 'disabled' ? 'disabled' : 'local-only');
            return;
          }

          setCloudSyncStatus('loading');
          loadCloudFavorites(nextAuthState.user.uid)
            .then((cloudFavorites) => {
              if (isCancelled) return;
              const hydrated = deserializeFavoritePromptCollection(cloudFavorites);
              const merged = mergeFavoritePrompts(hydrated, favoritePromptsRef.current);
              setFavoritePrompts(merged);
              cloudSyncReadyRef.current = true;
              setCloudSyncStatus('synced');

              if (merged.length > hydrated.length) {
                pendingMutationsRef.current = {
                  clear: false,
                  upserts: new Map(
                    merged.map(serializeFavoritePrompt).filter(Boolean).map((favorite) => [favorite.i, favorite]),
                  ),
                  deletes: new Set(),
                };
                scheduleCloudMutationFlush();
              }
              const pending = pendingMutationsRef.current;
              if (!pending.clear && (pending.upserts.size > 0 || pending.deletes.size > 0)) {
                scheduleCloudMutationFlush();
              }
            })
            .catch((error) => {
              if (isCancelled) return;
              cloudSyncReadyRef.current = false;
              console.error('Failed to load cloud favorites:', error);
              setCloudSyncStatus('error');
              showToast('Firebase Favorites 載入失敗，暫時使用本機資料');
            });
        });
      })
      .catch((error) => {
        if (isCancelled) return;
        cloudSyncReadyRef.current = false;
        console.error('Failed to initialize Firebase Favorites:', error);
        setCloudAuth({ status: 'disabled', user: null, error: 'Firebase Favorites 無法初始化' });
        setCloudSyncStatus('disabled');
      });

    return () => {
      isCancelled = true;
      unsubscribe();
    };
  }, [scheduleCloudMutationFlush, showToast]);

  useEffect(() => scheduleFavoriteCollectionPersist(favoritePrompts, (result) => {
    if (result.failed) {
      const warning = '提示：本機儲存空間已滿，這次最愛變更無法完整保存，但畫面不會再白掉。';
      if (storageWarningRef.current !== warning) {
        storageWarningRef.current = warning;
        showToast(warning);
      }
      return;
    }
    if (result.truncatedCount > 0) {
      const warning = `提示：為避免瀏覽器儲存爆滿，只保留最新 ${favoritePrompts.length - result.truncatedCount} 張 Favorites 到本機。`;
      if (storageWarningRef.current !== warning) {
        storageWarningRef.current = warning;
        showToast(warning);
      }
      return;
    }
    storageWarningRef.current = '';
  }), [favoritePrompts, showToast]);

  useEffect(() => {
    const flush = () => persistFavoriteCollection(favoritePromptsRef.current);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const signInFavorites = useCallback(async () => {
    try {
      const { signInToFavorites } = await loadCloudRepository();
      await signInToFavorites();
      return true;
    } catch (error) {
      console.error('Firebase sign-in failed:', error);
      showToast('Firebase 登入失敗，請稍後再試');
      return false;
    }
  }, [showToast]);

  const signOutFavorites = useCallback(async () => {
    try {
      const { signOutFromFavorites } = await loadCloudRepository();
      await signOutFromFavorites();
      showToast('Firebase 已登出，Favorites 改用本機保存');
      return true;
    } catch (error) {
      console.error('Firebase sign-out failed:', error);
      showToast('Firebase 登出失敗，請稍後再試');
      return false;
    }
  }, [showToast]);

  const cloudLabel = useMemo(() => {
    if (cloudAuth?.status === 'signed-in') {
      if (cloudSyncStatus === 'loading') return 'Firebase 載入中';
      if (cloudSyncStatus === 'saving') return 'Firebase 同步中';
      if (cloudSyncStatus === 'error') return 'Firebase 同步失敗';
      return `Firebase 已同步：${cloudAuth.user.email}`;
    }
    if (cloudAuth?.status === 'unauthorized') return cloudAuth.error || 'Firebase 權限不足';
    if (cloudAuth?.status === 'disabled') return 'Firebase 尚未設定';
    return 'Favorites 僅存本機';
  }, [cloudAuth, cloudSyncStatus]);

  return {
    favoritePrompts,
    cloudAuth,
    cloudSyncStatus,
    cloudLabel,
    addFavoritePrompt,
    addFavoritePrompts,
    deleteFavoritePrompt,
    clearFavoritePrompts,
    signInFavorites,
    signOutFavorites,
  };
}

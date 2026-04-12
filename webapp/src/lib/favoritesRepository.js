import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import {
  firebaseAuth,
  firebaseDb,
  googleAuthProvider,
  isEmailAllowed,
  isFirebaseConfigured,
} from './firebase';

const FAVORITES_COLLECTION = 'favorites';
const CLOUD_SYNC_CHUNK_SIZE = 450;

function getFavoritesCollection(userId) {
  if (!firebaseDb || !userId) return null;
  return collection(firebaseDb, 'users', userId, FAVORITES_COLLECTION);
}

function toFavoriteDocId(favoriteId) {
  return encodeURIComponent(String(favoriteId));
}

export function subscribeToFavoriteAuth(onChange) {
  if (!firebaseAuth || !isFirebaseConfigured) {
    onChange({ status: 'disabled', user: null, error: null });
    return () => {};
  }

  return onAuthStateChanged(firebaseAuth, (user) => {
    if (!user) {
      onChange({ status: 'signed-out', user: null, error: null });
      return;
    }

    if (!isEmailAllowed(user.email)) {
      onChange({
        status: 'unauthorized',
        user: null,
        error: `${user.email || '這個帳號'} 沒有 Favorites 同步權限`,
      });
      signOut(firebaseAuth).catch(() => {});
      return;
    }

    onChange({ status: 'signed-in', user, error: null });
  });
}

export async function signInToFavorites() {
  if (!firebaseAuth || !googleAuthProvider) {
    throw new Error('Firebase 尚未設定完成');
  }
  await signInWithPopup(firebaseAuth, googleAuthProvider);
}

export async function signOutFromFavorites() {
  if (!firebaseAuth) return;
  await signOut(firebaseAuth);
}

export async function loadCloudFavorites(userId) {
  const favoritesRef = getFavoritesCollection(userId);
  if (!favoritesRef) return [];

  const snapshot = await getDocs(favoritesRef);
  return snapshot.docs.map((favoriteDoc) => ({
    i: decodeURIComponent(favoriteDoc.id),
    ...favoriteDoc.data(),
  }));
}

export async function replaceCloudFavorites(userId, serializedFavorites) {
  const favoritesRef = getFavoritesCollection(userId);
  if (!firebaseDb || !favoritesRef) return;

  const existingSnapshot = await getDocs(favoritesRef);
  const nextFavorites = serializedFavorites.filter((favorite) => favorite?.i);
  const nextIds = new Set(nextFavorites.map((favorite) => favorite.i));
  const operations = [];

  existingSnapshot.docs.forEach((favoriteDoc) => {
    if (!nextIds.has(favoriteDoc.id)) {
      operations.push({ type: 'delete', ref: favoriteDoc.ref });
    }
  });

  nextFavorites.forEach((favorite) => {
    operations.push({
      type: 'set',
      ref: doc(favoritesRef, toFavoriteDocId(favorite.i)),
      data: {
        ...favorite,
        cloudUpdatedAt: new Date().toISOString(),
      },
    });
  });

  for (let index = 0; index < operations.length; index += CLOUD_SYNC_CHUNK_SIZE) {
    const batch = writeBatch(firebaseDb);
    operations.slice(index, index + CLOUD_SYNC_CHUNK_SIZE).forEach((operation) => {
      if (operation.type === 'delete') {
        batch.delete(operation.ref);
        return;
      }
      batch.set(operation.ref, operation.data);
    });
    await batch.commit();
  }
}

export async function clearCloudFavorites(userId) {
  const favoritesRef = getFavoritesCollection(userId);
  if (!firebaseDb || !favoritesRef) return;

  const snapshot = await getDocs(favoritesRef);
  for (let index = 0; index < snapshot.docs.length; index += CLOUD_SYNC_CHUNK_SIZE) {
    const batch = writeBatch(firebaseDb);
    snapshot.docs.slice(index, index + CLOUD_SYNC_CHUNK_SIZE).forEach((favoriteDoc) => {
      batch.delete(favoriteDoc.ref);
    });
    await batch.commit();
  }
}

export async function deleteCloudFavorite(userId, favoriteId) {
  const favoritesRef = getFavoritesCollection(userId);
  if (!favoritesRef || !favoriteId) return;
  await deleteDoc(doc(favoritesRef, toFavoriteDocId(favoriteId)));
}

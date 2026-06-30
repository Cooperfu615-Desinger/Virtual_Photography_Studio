async function getMagnificCallable() {
  const [{ getFunctions, httpsCallable }, { firebaseApp, firebaseAuth }] = await Promise.all([
    import('firebase/functions'),
    import('./firebase.js'),
  ]);

  if (!firebaseApp || !firebaseAuth) {
    throw new Error('Firebase Functions 尚未設定，無法使用 Magnific');
  }

  await firebaseAuth.authStateReady?.();
  if (!firebaseAuth.currentUser) {
    throw new Error('請先登入 Firebase 後再使用 Magnific');
  }

  const firebaseFunctions = getFunctions(firebaseApp);
  return httpsCallable(firebaseFunctions, 'magnificGenerate', { timeout: 240000 });
}

export async function generateMagnificViaFirebase(payload) {
  const generate = await getMagnificCallable();
  const response = await generate(payload);
  return response.data;
}

export async function generateMagnificClassicViaFirebase(payload) {
  const generate = await getMagnificCallable();
  const response = await generate({
    ...payload,
    modelKey: 'classic',
  });
  return response.data;
}

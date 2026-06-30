export async function generateMagnificClassicViaFirebase(payload) {
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
  const generateClassic = httpsCallable(firebaseFunctions, 'magnificGenerateClassic');
  const response = await generateClassic(payload);
  return response.data;
}

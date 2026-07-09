async function getBytePlusCallable(functionName = 'bytePlusGenerate', timeout = 240000) {
  const [{ getFunctions, httpsCallable }, { firebaseApp, firebaseAuth }] = await Promise.all([
    import('firebase/functions'),
    import('./firebase.js'),
  ]);

  if (!firebaseApp || !firebaseAuth) {
    throw new Error('Firebase Functions 尚未設定，無法使用 BytePlus');
  }

  await firebaseAuth.authStateReady?.();
  if (!firebaseAuth.currentUser) {
    throw new Error('請先登入 Firebase 後再使用 BytePlus');
  }

  const firebaseFunctions = getFunctions(firebaseApp);
  return httpsCallable(firebaseFunctions, functionName, { timeout });
}

export async function generateBytePlusViaFirebase(payload) {
  const generate = await getBytePlusCallable();
  const response = await generate(payload);
  return response.data;
}

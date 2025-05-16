// src/lib/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyCMTlkYQnz9veMSQsomlDVCfiOTXEtSq_E",
  authDomain: "pinterest-clone-first.firebaseapp.com",
  projectId: "pinterest-clone-first",
  storageBucket: "pinterest-clone-first.firebasestorage.app",
  messagingSenderId: "328414080078",
  appId: "1:328414080078:web:2daefc37c6a0f04bb1e71f",
  measurementId: "G-KESXHWK8YH"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Analyticsの初期化をクライアントサイドのみで行うように修正
// analytics変数を宣言するが初期化はしない
let analytics = null;

// クライアントサイドでのみAnalyticsを初期化
if (typeof window !== 'undefined') {
  // 動的importを使用してサーバーサイドでのエラーを回避
  import('firebase/analytics').then(({ getAnalytics }) => {
    analytics = getAnalytics(app);
  }).catch(error => {
    console.error('Failed to initialize analytics:', error);
  });
}

export { analytics };
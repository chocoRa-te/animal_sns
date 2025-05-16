import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Firebaseの設定
const firebaseConfig = {
  apiKey: "AIzaSyCMTlkYQnz9veMSQsom1DVCfiOTXEtSq_E",
  authDomain: "pinterest-clone-first.firebaseapp.com",
  projectId: "pinterest-clone-first",
  storageBucket: "pinterest-clone-first.firebasestorage.app",
  messagingSenderId: "328414080078",
  appId: "1:328414080078:web:2daefc37c6a0f04bb1e71f",
  measurementId: "G-KESXHWK8YH"
};

// Firebaseを初期化
const app = initializeApp(firebaseConfig);

// 各サービスをエクスポート
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Analytics（クライアントサイドでのみ使用）
let analytics;
if (typeof window !== 'undefined') {
  const { getAnalytics } = require('firebase/analytics');
  analytics = getAnalytics(app);
}
export { analytics };
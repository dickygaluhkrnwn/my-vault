import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Mengambil konfigurasi dari Environment Variables (.env.local)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Singleton pattern: Mencegah inisialisasi berulang saat hot-reload
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Export service database dan auth
const db = getFirestore(app);
const auth = getAuth(app);

// Inisialisasi Google Auth Provider untuk Fase 1
const googleProvider = new GoogleAuthProvider();
// Opsional: Memaksa user memilih akun google jika punya lebih dari 1
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export { app, db, auth, googleProvider };